from typing import Any, List
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_active_user, get_current_doctor
from app.models.prescription import Prescription
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.models.user import User
from app.schemas.prescription import (
    PrescriptionCreate,
    PrescriptionUpdate,
    PrescriptionResponse,
    PrescriptionWithDetails
)
from app.services.notification_service import NotificationService
import random
import json

router = APIRouter()

def generate_prescription_id(db: Session) -> str:
    """Generate unique prescription ID"""
    while True:
        prescription_id = f"RX{random.randint(10000, 99999)}"
        if not db.query(Prescription).filter(Prescription.prescription_id == prescription_id).first():
            return prescription_id

@router.post("/", response_model=PrescriptionResponse, status_code=status.HTTP_201_CREATED)
async def create_prescription(
    prescription_in: PrescriptionCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_doctor)
) -> Any:
    """
    Create new prescription (Doctor only)
    """
    print("=" * 80)
    print("🏥 CREATE PRESCRIPTION ENDPOINT CALLED")
    print(f"   Doctor: {current_user.username} (ID: {current_user.id})")
    print(f"   Patient ID: {prescription_in.patient_id}")
    print(f"   Medications: {len(prescription_in.medications)}")
    print("=" * 80)
    
    # Verify patient exists
    patient = db.query(Patient).filter(Patient.id == prescription_in.patient_id).first()
    if not patient:
        print(f"❌ ERROR: Patient {prescription_in.patient_id} not found!")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    print(f"✅ Patient found: {patient.user.username} (User ID: {patient.user_id})")
    
    # Convert medications to JSON string
    medications_json = json.dumps([med.dict() for med in prescription_in.medications])
    
    db_prescription = Prescription(
        prescription_id=generate_prescription_id(db),
        patient_id=prescription_in.patient_id,
        doctor_id=prescription_in.doctor_id,
        appointment_id=prescription_in.appointment_id,
        medications=medications_json,
        instructions=prescription_in.instructions,
        notes=prescription_in.notes,
        valid_until=prescription_in.valid_until
    )
    db.add(db_prescription)
    db.commit()
    db.refresh(db_prescription)
    
    # Send notifications to patient, doctor, and admins
    try:
        # Get doctor info
        doctor = db.query(Doctor).filter(Doctor.id == prescription_in.doctor_id).first()
        if doctor:
            # Get first medication name for notification
            med_name = "Medication"
            if prescription_in.medications and len(prescription_in.medications) > 0:
                med_name = prescription_in.medications[0].name
            
            print(f"🔔 PRESCRIPTION: About to send notifications")
            print(f"   Patient DB ID: {prescription_in.patient_id}")
            print(f"   Patient User ID: {patient.user_id}")
            print(f"   Patient Name: {patient.user.full_name or patient.user.username}")
            print(f"   Doctor User ID: {doctor.user_id}")
            print(f"   Medication: {med_name}")

            if not patient.user_id:
                print("❌ ERROR: Patient has no user_id linked!")
            
            if not doctor.user_id:
                print("❌ ERROR: Doctor has no user_id linked!")
                
            NotificationService.create_prescription_notification(
                db=db,
                patient_id=patient.user_id,
                patient_name=patient.user.full_name or patient.user.username,
                doctor_id=doctor.user_id,
                doctor_name=doctor.user.full_name or doctor.user.username,
                prescription_id=db_prescription.id,
                medication_name=med_name,
                background_tasks=background_tasks
            )
            print(f"✅ PRESCRIPTION: Notification service call completed")
    except Exception as notif_error:
        # DO NOT rollback here - it will undo the prescription creation!
        print(f"⚠️ Failed to send prescription notification: {notif_error}")
        import traceback
        traceback.print_exc()
        # Continue execution - prescription was already committed
        # Don't fail prescription creation if notification fails
    
    return PrescriptionResponse(
        id=db_prescription.id,
        prescription_id=db_prescription.prescription_id,
        patient_id=db_prescription.patient_id,
        doctor_id=db_prescription.doctor_id,
        appointment_id=db_prescription.appointment_id,
        medications=json.loads(db_prescription.medications),
        instructions=db_prescription.instructions,
        notes=db_prescription.notes,
        valid_until=db_prescription.valid_until,
        created_at=db_prescription.created_at
)

@router.get("/", response_model=List[PrescriptionWithDetails])
async def get_prescriptions(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    patient_id: int = Query(None),
    doctor_id: int = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get all prescriptions with filters
    """
    query = db.query(Prescription)
    
    # Role-based filtering
    from app.models.user import UserRole
    if current_user.role == UserRole.PATIENT:
        patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        if patient:
            query = query.filter(Prescription.patient_id == patient.id)
        else:
            return []
    
    elif current_user.role == UserRole.DOCTOR:
        doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
        if doctor:
            query = query.filter(Prescription.doctor_id == doctor.id)
        else:
            return []
    
    # Apply filters
    if patient_id:
        query = query.filter(Prescription.patient_id == patient_id)
    
    if doctor_id:
        query = query.filter(Prescription.doctor_id == doctor_id)
    
    prescriptions = query.order_by(Prescription.created_at.desc()).offset(skip).limit(limit).all()
    
    result = []
    for prescription in prescriptions:
        prescription_dict = {
            "id": prescription.id,
            "prescription_id": prescription.prescription_id,
            "patient_id": prescription.patient_id,
            "doctor_id": prescription.doctor_id,
            "appointment_id": prescription.appointment_id,
            "medications": json.loads(prescription.medications) if prescription.medications else [],
            "instructions": prescription.instructions,
            "notes": prescription.notes,
            "valid_until": prescription.valid_until,
            "created_at": prescription.created_at,
            "patient": {
                "id": prescription.patient.id,
                "patient_id": prescription.patient.patient_id,
                "name": prescription.patient.user.full_name
            },
            "doctor": {
                "id": prescription.doctor.id,
                "doctor_id": prescription.doctor.doctor_id,
                "name": prescription.doctor.user.full_name
            }
        }
        result.append(prescription_dict)
    
    return result

@router.get("/{prescription_id}", response_model=PrescriptionWithDetails)
async def get_prescription(
    prescription_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get specific prescription by ID
    """
    prescription = db.query(Prescription).filter(Prescription.prescription_id == prescription_id).first()
    
    if not prescription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prescription not found"
        )
    
    # Permission check
    if current_user.role.value == "patient":
        patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        if not patient or prescription.patient_id != patient.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
    
    result = {
        "id": prescription.id,
        "prescription_id": prescription.prescription_id,
        "patient_id": prescription.patient_id,
        "doctor_id": prescription.doctor_id,
        "appointment_id": prescription.appointment_id,
        "medications": json.loads(prescription.medications) if prescription.medications else [],
        "instructions": prescription.instructions,
        "notes": prescription.notes,
        "valid_until": prescription.valid_until,
        "created_at": prescription.created_at,
        "patient": {
            "id": prescription.patient.id,
            "patient_id": prescription.patient.patient_id,
            "name": prescription.patient.user.full_name
        },
        "doctor": {
            "id": prescription.doctor.id,
            "doctor_id": prescription.doctor.doctor_id,
            "name": prescription.doctor.user.full_name
        }
    }
    
    return result

@router.put("/{prescription_id}", response_model=PrescriptionResponse)
async def update_prescription(
    prescription_id: str,
    prescription_update: PrescriptionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_doctor)
) -> Any:
    """
    Update prescription (Doctor only)
    """
    prescription = db.query(Prescription).filter(Prescription.prescription_id == prescription_id).first()
    
    if not prescription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prescription not found"
        )
    
    update_data = prescription_update.dict(exclude_unset=True)
    
    if 'medications' in update_data and update_data['medications']:
        update_data['medications'] = json.dumps(
            # med.dict() if hasattr(med, "dict") else med 
            # for med in update_data['medications']
                update_data['medications']
            )
    
    for field, value in update_data.items():
        setattr(prescription, field, value)
    
    db.commit()
    db.refresh(prescription)
    
    if prescription.medications:
        prescription.medications = json.loads(prescription.medications)

    
    return prescription

@router.delete("/{prescription_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_prescription(
    prescription_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_doctor)
) -> None:
    """
    Delete prescription (Doctor only)
    """
    prescription = db.query(Prescription).filter(Prescription.prescription_id == prescription_id).first()
    
    if not prescription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prescription not found"
        )
    
    db.delete(prescription)
    db.commit()