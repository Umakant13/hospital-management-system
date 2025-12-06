from datetime import date
from typing import Any, List
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload, aliased
from app.api.deps import get_db, get_current_active_user, get_current_admin
from app.models.patient import Gender, Patient
from app.models.user import User, UserRole
from app.models.doctor import Doctor
from app.schemas.patient import (
    PatientCreate,
    PatientUpdate,
    PatientResponse,
    PatientWithUser
)
import random
import string

from app.core.security import get_password_hash

router = APIRouter()



def generate_patient_id(user_id: int) -> str:
    return f"P{1000 + user_id}"



@router.post("/", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
async def create_patient(
    patient_in: PatientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
) -> Any:
    """
    Create patient - Creates user too if user_id not provided
    """
    
    try:
        print(f"🔄 Starting patient creation...")
        print(f"📝 Input data: {patient_in.dict()}")
        
        # ==========================================
        # Case 1: Link to existing user
        # ==========================================
        if patient_in.user_id:
            print(f"🔍 Looking for user_id: {patient_in.user_id}")
            
            existing_user = db.query(User).filter(User.id == patient_in.user_id).first()
            if not existing_user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"User ID {patient_in.user_id} not found"
                )
            
            print(f"✅ Found user: {existing_user.username}")
            
            # Check if patient record already exists
            existing_patient = db.query(Patient).filter(Patient.user_id == patient_in.user_id).first()
            if existing_patient:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Patient record already exists for this user"
                )
            
            # Update user role to patient
            if existing_user.role != UserRole.PATIENT:
                existing_user.role = UserRole.PATIENT
                db.flush()  # ✅ Flush the role update
                print(f"✅ Updated user role to PATIENT")
            
            user_id = existing_user.id
        
        # ==========================================
        # Case 2: Create new user automatically
        # ==========================================
        else:
            print(f"🔄 Creating new user for patient...")
            
            # Generate unique credentials
            unique_id = uuid.uuid4().hex[:8]
            username = f"patient_{unique_id}"
            email = f"patient_{unique_id}@hospital.com"
            
            # Create new user
            new_user = User(
                email=email,
                username=username,
                full_name="New Patient",
                hashed_password=get_password_hash("Patient@123"),
                role=UserRole.PATIENT,
                is_active=True,
                is_verified=False
            )
            db.add(new_user)
            db.flush()  # ✅ Get the ID
            
            user_id = new_user.id
            print(f"✅ Created new user with ID: {user_id}, username: {username}")
            
            # ✅ Verify user was added to session
            user_check = db.query(User).filter(User.id == user_id).first()
            if user_check:
                print(f"✅ User confirmed in session")
            else:
                print(f"❌ WARNING: User not found in session after flush!")

        # ==========================================
        # Calculate BMI if height and weight provided
        # ==========================================
        bmi = None
        bmi_category = None
        if patient_in.height and patient_in.weight:
            bmi = round(patient_in.weight / (patient_in.height ** 2), 2)
            if bmi < 18.5:
                bmi_category = "Underweight"
            elif bmi < 25:
                bmi_category = "Normal weight"
            elif bmi < 30:
                bmi_category = "Overweight"
            else:
                bmi_category = "Obese"
            print(f"📊 Calculated BMI: {bmi} ({bmi_category})")

        # ==========================================
        # Create patient record
        # ==========================================
        
        print(f"🔄 Creating patient record...")
        
        # ✅ Convert enum to string value
        gender_value = patient_in.gender.value if isinstance(patient_in.gender, Gender) else patient_in.gender
        blood_group_value = patient_in.blood_group.value if patient_in.blood_group else None
        
        db_patient = Patient(
            user_id=user_id,
            patient_id=generate_patient_id(user_id),
            age=patient_in.age,
            gender=gender_value,  # ✅ Use string value
            blood_group=blood_group_value,  # ✅ Use string value or None
            height=patient_in.height,
            weight=patient_in.weight,
            bmi=bmi,
            bmi_category=bmi_category,
            emergency_contact=patient_in.emergency_contact,
            emergency_contact_name=patient_in.emergency_contact_name,
            medical_history=patient_in.medical_history,
            allergies=patient_in.allergies,
            current_medications=patient_in.current_medications,
            insurance_id=patient_in.insurance_id,
            insurance_provider=patient_in.insurance_provider,
            primary_doctor_id=patient_in.primary_doctor_id,
            registration_date=date.today()
        )
        
        db.add(db_patient)
        
        # ✅ Commit BOTH user and patient
        print(f"💾 Committing transaction...")
        db.commit()
        
        # ✅ Refresh to get all fields
        db.refresh(db_patient)
        
        print(f"✅ Patient created successfully with patient_id: {db_patient.patient_id}")
        
        # ✅ Final verification
        verify_user = db.query(User).filter(User.id == user_id).first()
        verify_patient = db.query(Patient).filter(Patient.user_id == user_id).first()
        
        if verify_user:
            print(f"✅ Verified: User {verify_user.username} exists in database")
        else:
            print(f"❌ ERROR: User NOT found in database after commit!")
            
        if verify_patient:
            print(f"✅ Verified: Patient {verify_patient.patient_id} exists in database")
        else:
            print(f"❌ ERROR: Patient NOT found in database after commit!")
        
        return db_patient
    
    except HTTPException:
        db.rollback()
        print(f"⚠️ HTTPException - rolling back")
        raise
    except Exception as e:
        db.rollback()
        print(f"❌ Error creating patient: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create patient: {str(e)}"
        )

@router.get("/", response_model=List[PatientWithUser])
async def get_patients(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    search: str = Query(None),
    blood_group: str = Query(None),
    doctor_id: int = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get all patients with filters
    """
    DoctorUser = aliased(User)
    query = db.query(Patient).join(User).outerjoin(Doctor, Patient.primary_doctor_id == Doctor.id).outerjoin(DoctorUser, Doctor.user_id == DoctorUser.id)
    
    if search:
        query = query.filter(
            (Patient.patient_id.contains(search))
        )
    
    if blood_group:
        query = query.filter(Patient.blood_group == blood_group)
    
    if doctor_id:
        query = query.filter(Patient.primary_doctor_id == doctor_id)
    
    # Eager load the relationships
    patients = query.options(
        joinedload(Patient.user),
        joinedload(Patient.primary_doctor).joinedload(Doctor.user)
    ).offset(skip).limit(limit).all()
    
    #   result = []
    # for patient in patients:
    #     patient_dict = patient.__dict__
    #     patient_dict['user'] = patient.user.__dict__
    #     result.append(patient_dict)
    
    return patients

@router.get("/me/profile", response_model=PatientWithUser)
async def get_my_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get current patient's profile with full details including assigned doctor
    """
    # Eager load user and primary_doctor with its user details
    patient = db.query(Patient).options(
        joinedload(Patient.user),
        joinedload(Patient.primary_doctor).joinedload(Doctor.user),
        joinedload(Patient.primary_doctor).joinedload(Doctor.department)
    ).filter(Patient.user_id == current_user.id).first()
    
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient profile not found"
        )
    
    return patient

@router.get("/{patient_id}", response_model=PatientWithUser)
async def get_patient(
    patient_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get specific patient by ID
    """
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    # result = patient.__dict__
    # result['user'] = patient.user.__dict__
    
    return patient

@router.put("/{patient_id}", response_model=PatientResponse)
async def update_patient(
    patient_id: str,
    patient_update: PatientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Update patient information
    """
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    # Update fields
    update_data = patient_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(patient, field, value)
    
    # Recalculate BMI if height or weight updated
    if patient.height and patient.weight:
        patient.bmi = round(patient.weight / (patient.height ** 2), 2)
        if patient.bmi < 18.5:
            patient.bmi_category = "Underweight"
        elif patient.bmi < 25:
            patient.bmi_category = "Normal weight"
        elif patient.bmi < 30:
            patient.bmi_category = "Overweight"
        else:
            patient.bmi_category = "Obese"
    
    db.commit()
    db.refresh(patient)
    
    return patient

@router.delete("/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_patient(
    patient_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
) -> None:
    """
    Delete patient record (Admin only)
    """
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    db.delete(patient)
    db.commit()

@router.get("/analytics/bmi-distribution")
async def get_bmi_distribution(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get BMI category distribution
    """
    patients = db.query(Patient).all()
    
    distribution = {
        "Underweight": 0,
        "Normal weight": 0,
        "Overweight": 0,
        "Obese": 0,
        "Unknown": 0
    }
    
    for patient in patients:
        if patient.bmi_category:
            distribution[patient.bmi_category] += 1
        else:
            distribution["Unknown"] += 1
    
    return distribution

@router.get("/analytics/age-distribution")
async def get_age_distribution(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get age distribution of patients
    """
    patients = db.query(Patient).all()
    
    distribution = {
        "0-18": 0,
        "19-30": 0,
        "31-45": 0,
        "46-60": 0,
        "60+": 0
    }
    
    for patient in patients:
        if patient.age <= 18:
            distribution["0-18"] += 1
        elif patient.age <= 30:
            distribution["19-30"] += 1
        elif patient.age <= 45:
            distribution["31-45"] += 1
        elif patient.age <= 60:
            distribution["46-60"] += 1
        else:
            distribution["60+"] += 1
    
    return distribution
