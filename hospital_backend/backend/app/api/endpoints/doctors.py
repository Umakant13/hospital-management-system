from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_active_user, get_current_admin
from app.models.doctor import Doctor
from app.models.user import User, UserRole
from app.models.appointment import Appointment
from app.schemas.doctor import (
    DoctorCreate,
    DoctorUpdate,
    DoctorResponse,
    DoctorWithUser
)
from datetime import datetime, timedelta
import random
from fastapi.encoders import jsonable_encoder
from app.core.security import get_password_hash
import uuid

router = APIRouter()



def generate_doctor_id(user_id:int) -> str:
    """Generate unique doctor ID"""
    return f"D{1000 + user_id}"


@router.get("/me/profile", response_model=DoctorWithUser)
async def get_my_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get current doctor's profile
    """
    if current_user.role != UserRole.DOCTOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Current user is not a doctor"
        )
    
    doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor profile not found"
        )
    
    result = jsonable_encoder(doctor)
    result['user'] = jsonable_encoder(doctor.user)
    if doctor.department:
        result['department'] = jsonable_encoder(doctor.department)
    
    return result


@router.post("/", response_model=DoctorResponse, status_code=status.HTTP_201_CREATED)
async def create_doctor(
    doctor_in: DoctorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Create doctor - Creates user too if user_id not provided
    """
    
    try:
        # ==========================================
        # Case 1: Link to existing user
        # ==========================================
        if doctor_in.user_id:
            # Check if user exists
            existing_user = db.query(User).filter(User.id == doctor_in.user_id).first()
            if not existing_user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"User ID {doctor_in.user_id} not found"
                )
            
            # Check if doctor record already exists
            existing_doctor = db.query(Doctor).filter(Doctor.user_id == doctor_in.user_id).first()
            if existing_doctor:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Doctor record already exists for this user"
                )
            
            # Update user role to doctor
            existing_user.role = UserRole.DOCTOR
            user_id = existing_user.id
        
        # ==========================================
        # Case 2: Create new user automatically
        # ==========================================
        else:
            # Generate unique credentials
            unique_id = uuid.uuid4().hex[:6]
            username = f"doctor_{doctor_in.license_number.replace('-', '_').lower()}"
            email = f"doctor_{unique_id}@hospital.com"
            
            # Check username uniqueness
            if db.query(User).filter(User.username == username).first():
                username = f"{username}_{unique_id}"
            
            # Create new user
            new_user = User(
                email=email,
                username=username,
                full_name=f"Dr. {doctor_in.specialization}",
                hashed_password=get_password_hash("Doctor@123"),
                role=UserRole.DOCTOR,
                is_active=True,
                is_verified=True
            )
            db.add(new_user)
            db.flush()  # ✅ Get ID
            user_id = new_user.id

        # ==========================================
        # Check license uniqueness
        # ==========================================
        existing_license = db.query(Doctor).filter(
            Doctor.license_number == doctor_in.license_number
        ).first()
        if existing_license:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"License number {doctor_in.license_number} already exists"
            )

        # ==========================================
        # Create doctor record
        # ==========================================
        
        # Convert available_days if needed
        available_days_str = None
        if doctor_in.available_days:
            if isinstance(doctor_in.available_days, list):
                available_days_str = ",".join(doctor_in.available_days)
            else:
                available_days_str = doctor_in.available_days

        new_doctor = Doctor(
            user_id=user_id,
            doctor_id=generate_doctor_id(user_id),
            specialization=doctor_in.specialization,
            qualification=doctor_in.qualification,
            experience_years=doctor_in.experience_years,
            license_number=doctor_in.license_number,
            department_id=doctor_in.department_id,
            consultation_fee=doctor_in.consultation_fee,
            bio=doctor_in.bio,
            available_days=available_days_str,
            consultation_start_time=doctor_in.consultation_start_time,
            consultation_end_time=doctor_in.consultation_end_time,
            max_patients_per_day=doctor_in.max_patients_per_day,
            rating=0.0,
            total_reviews=0
        )
        
        db.add(new_doctor)
        db.commit()
        db.refresh(new_doctor)
        
        return new_doctor
    
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        print(f"Error creating doctor: {str(e)}")  # ✅ This will show in terminal
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create doctor: {str(e)}"
        )

@router.get("/", response_model=List[DoctorWithUser])
async def get_doctors(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    specialization: str = Query(None),
    department_id: int = Query(None),
    search: str = Query(None),
    status: str = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get all doctors with filters
    """
    query = db.query(Doctor).join(User)
    
    if specialization:
        query = query.filter(Doctor.specialization.contains(specialization))
    
    if department_id:
        query = query.filter(Doctor.department_id == department_id)

    if status:
        is_active = True if status.lower() == 'active' else False
        query = query.filter(User.is_active == is_active)
    
    if search:
        query = query.filter(
            (User.full_name.contains(search)) |
            (Doctor.doctor_id.contains(search)) |
            (Doctor.specialization.contains(search))
        )
    
    doctors = query.offset(skip).limit(limit).all()
    
    result = []
    for doctor in doctors:
        doctor_data = jsonable_encoder(doctor)
        doctor_data['user'] = jsonable_encoder(doctor.user)
        
        if doctor.department:
            doctor_data['department'] = jsonable_encoder(doctor.department)
        
        result.append(doctor_data)
    
    return result

@router.get("/{doctor_id}", response_model=DoctorWithUser)
async def get_doctor(
    doctor_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get specific doctor by ID (supports both 'D1001' format and internal integer ID)
    """
    # First try exact match on string ID (D-format)
    doctor = db.query(Doctor).filter(Doctor.doctor_id == doctor_id).first()
    
    # If not found and input looks like an integer, try internal ID
    if not doctor and doctor_id.isdigit():
        doctor = db.query(Doctor).filter(Doctor.id == int(doctor_id)).first()
    
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found"
        )
    
    result = jsonable_encoder(doctor)
    result['user'] = jsonable_encoder(doctor.user)
    if doctor.department:
        result['department'] = jsonable_encoder(doctor.department)
    
    return result
        

@router.put("/{doctor_id}", response_model=DoctorResponse)
async def update_doctor(
    doctor_id: str,
    doctor_update: DoctorUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Update doctor information
    """
    doctor = db.query(Doctor).filter(Doctor.doctor_id == doctor_id).first()
    
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found"
        )
    
    # Only admin or the doctor themselves can update
    if current_user.role.value != "admin" and doctor.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    update_data = doctor_update.dict(exclude_unset=True)
    
    # Handle available_days if it's a list
    if 'available_days' in update_data and isinstance(update_data['available_days'], list):
        update_data['available_days'] = ",".join(update_data['available_days'])

    for field, value in update_data.items():
        setattr(doctor, field, value)
    
    db.commit()
    db.refresh(doctor)
    
    return jsonable_encoder(doctor)


@router.delete("/{doctor_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_doctor(
    doctor_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
) -> None:
    """
    Delete doctor record (Admin only)
    """
    doctor = db.query(Doctor).filter(Doctor.doctor_id == doctor_id).first()
    
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found"
        )
    
    db.delete(doctor)
    db.commit()

@router.get("/{doctor_id}/schedule")
async def get_doctor_schedule(
    doctor_id: str,
    date: str = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get doctor's schedule for a specific date or week
    """
    doctor = db.query(Doctor).filter(Doctor.doctor_id == doctor_id).first()
    
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found"
        )
    
    if date:
        target_date = datetime.strptime(date, "%Y-%m-%d").date()
    else:
        target_date = datetime.now().date()
    
    # Get appointments for the date
    appointments = db.query(Appointment).filter(
        Appointment.doctor_id == doctor.id,
        Appointment.appointment_date >= target_date,
        Appointment.appointment_date < target_date + timedelta(days=1)
    ).all()
    
    return {
        "doctor_id": doctor.doctor_id,
        "doctor_name": doctor.user.full_name,
        "date": target_date,
        "consultation_hours": {
            "start": str(doctor.consultation_start_time) if doctor.consultation_start_time else None,
            "end": str(doctor.consultation_end_time) if doctor.consultation_end_time else None
        },
        "max_patients": doctor.max_patients_per_day,
        "booked_slots": len(appointments),
        "available_slots": doctor.max_patients_per_day - len(appointments),
        "appointments": [
            {
                "appointment_id": apt.appointment_id,
                "patient_name": apt.patient.user.full_name,
                "time": apt.appointment_date,
                "status": apt.status.value
            } for apt in appointments
        ]
    }

@router.get("/{doctor_id}/patients")
async def get_doctor_patients(
    doctor_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get all patients assigned to a doctor
    """
    doctor = db.query(Doctor).filter(Doctor.doctor_id == doctor_id).first()
    
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found"
        )
    
    # Only admin or the doctor themselves can view
    if current_user.role.value != "admin" and doctor.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    patients = doctor.patients
    
    patients_data = []
    for patient in patients:
        # Get the last appointment for this patient with this doctor
        last_appointment = db.query(Appointment).filter(
            Appointment.patient_id == patient.id,
            Appointment.doctor_id == doctor.id
        ).order_by(Appointment.appointment_date.desc()).first()
        
        patients_data.append({
            "id": patient.id,
            "patient_id": patient.patient_id,
            "user_id": patient.user_id,
            "name": patient.user.full_name if patient.user else None,
            "age": patient.age,
            "gender": patient.gender.value,
            "blood_group": patient.blood_group,
            "height": patient.height,
            "weight": patient.weight,
            "bmi": patient.bmi,
            "bmi_category": patient.bmi_category,
            "emergency_contact": patient.emergency_contact,
            "emergency_contact_name": patient.emergency_contact_name,
            "medical_history": patient.medical_history,
            "allergies": patient.allergies,
            "current_medications": patient.current_medications,
            "insurance_id": patient.insurance_id,
            "insurance_provider": patient.insurance_provider,
            "primary_doctor_id": patient.primary_doctor_id,
            "registration_date": patient.registration_date,
            "last_visit": last_appointment.appointment_date if last_appointment else None,
            "total_appointments": db.query(Appointment).filter(
                Appointment.patient_id == patient.id,
                Appointment.doctor_id == doctor.id
            ).count()
        })
    
    return patients_data

@router.get("/analytics/performance")
async def get_doctor_performance(
    start_date: str = Query(None),
    end_date: str = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get doctor performance analytics (Admin or Doctor)
    """
    if current_user.role.value == "doctor":
        # If doctor, only return their own performance
        doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
        query = [doctor] if doctor else []
    else:
        query = db.query(Doctor).all()
    
    result = []
    for doctor in query:
        # Count appointments
        appointments_query = db.query(Appointment).filter(
            Appointment.doctor_id == doctor.id
        )
        
        if start_date:
            appointments_query = appointments_query.filter(
                Appointment.appointment_date >= datetime.strptime(start_date, "%Y-%m-%d")
            )
        if end_date:
            appointments_query = appointments_query.filter(
                Appointment.appointment_date <= datetime.strptime(end_date, "%Y-%m-%d")
            )
        
        total_appointments = appointments_query.count()
        completed_appointments = appointments_query.filter(
            Appointment.status == "completed"
        ).count()
        
        result.append({
            "doctor_id": doctor.doctor_id,
            "doctor_name": doctor.user.full_name,
            "specialization": doctor.specialization,
            "total_patients": len(doctor.patients),
            "total_appointments": total_appointments,
            "completed_appointments": completed_appointments,
            "rating": doctor.rating,
            "total_reviews": doctor.total_reviews
        })
    
    return result

@router.post("/{doctor_id}/reviews", status_code=status.HTTP_201_CREATED)
async def create_review(
    doctor_id: str,
    review_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Create a review for a doctor (Patient only - must be assigned to this doctor)
    """
    from app.models.doctor_review import DoctorReview
    from app.models.patient import Patient
    
    if current_user.role != UserRole.PATIENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only patients can review doctors"
        )
    
    # Get patient
    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")
    
    # Get doctor
    doctor = db.query(Doctor).filter(Doctor.doctor_id == doctor_id).first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found"
        )
    
    # Check if patient is assigned to this doctor
    if patient.primary_doctor_id != doctor.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only review your assigned doctor"
        )
    
    # Always create a new review (allow multiple reviews)
    review = DoctorReview(
        doctor_id=doctor.id,
        patient_id=patient.id,
        rating=review_data.get('rating'),
        review_text=review_data.get('review_text')
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    
    # Recalculate doctor's average rating
    all_reviews = db.query(DoctorReview).filter(DoctorReview.doctor_id == doctor.id).all()
    if all_reviews:
        avg_rating = sum(r.rating for r in all_reviews) / len(all_reviews)
        doctor.rating = round(avg_rating, 1)
        doctor.total_reviews = len(all_reviews)
        db.commit()
    
    return {
        "message": "Review submitted successfully",
        "review_id": review.id,
        "new_rating": doctor.rating,
        "total_reviews": doctor.total_reviews
    }

@router.get("/{doctor_id}/reviews")
async def get_doctor_reviews(
    doctor_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get all reviews for a doctor
    """
    from app.models.doctor_review import DoctorReview
    
    doctor = db.query(Doctor).filter(Doctor.doctor_id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    
    reviews = db.query(DoctorReview).filter(
        DoctorReview.doctor_id == doctor.id
    ).offset(skip).limit(limit).all()
    
    result = []
    for review in reviews:
        result.append({
            "id": review.id,
            "patient_name": review.patient.user.full_name,
            "rating": review.rating,
            "review_text": review.review_text,
            "created_at": review.created_at
        })
    
    return result