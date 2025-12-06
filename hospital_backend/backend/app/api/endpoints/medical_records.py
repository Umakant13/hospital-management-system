from typing import Any, List
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_active_user, get_current_doctor
from app.models.medical_record import MedicalRecord
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.models.user import User
from app.schemas.medical_record import (
    MedicalRecordCreate,
    MedicalRecordUpdate,
    MedicalRecordResponse,
    MedicalRecordWithDetails
)
from app.services.notification_service import NotificationService
import random
import json

router = APIRouter()

def generate_record_id(db: Session) -> str:
    """Generate unique medical record ID"""
    while True:
        record_id = f"MR{random.randint(10000, 99999)}"
        if not db.query(MedicalRecord).filter(MedicalRecord.record_id == record_id).first():
            return record_id

@router.post("/", response_model=MedicalRecordResponse, status_code=status.HTTP_201_CREATED)
async def create_medical_record(
    record_in: MedicalRecordCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_doctor)
) -> Any:
    """
    Create new medical record (Doctor or Admin)
    """
    # Check role permissions
    if current_user.role.value not in ["doctor", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors and admins can create medical records"
        )
    # Verify patient exists
    patient = db.query(Patient).filter(Patient.id == record_in.patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    # Build vital signs JSON
    vital_signs = {
        "blood_pressure": record_in.blood_pressure,
        "heart_rate": record_in.heart_rate,
        "temperature": record_in.temperature,
        "respiratory_rate": record_in.respiratory_rate,
        "oxygen_saturation": record_in.oxygen_saturation
    }
    
    db_record = MedicalRecord(
        **record_in.dict(exclude={'blood_pressure', 'heart_rate', 'temperature', 'respiratory_rate', 'oxygen_saturation', 'attachments'}),
        record_id=generate_record_id(db),
        vital_signs=vital_signs,
        attachments=json.dumps(record_in.attachments) if record_in.attachments else "[]",
        
        blood_pressure=record_in.blood_pressure,
        heart_rate=record_in.heart_rate,
        temperature=record_in.temperature,
        respiratory_rate=record_in.respiratory_rate,
        oxygen_saturation=record_in.oxygen_saturation
    )
    
    
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    
    # Send notifications to patient, doctor, and admins
    try:
        # Get doctor info
        doctor = db.query(Doctor).filter(Doctor.id == record_in.doctor_id).first()
        if doctor:
            NotificationService.create_medical_record_notification(
                db=db,
                patient_id=patient.user_id,
                patient_name=patient.user.full_name or patient.user.username,
                doctor_id=doctor.user_id,
                doctor_name=doctor.user.full_name or doctor.user.username,
                record_id=db_record.id,
                diagnosis=record_in.diagnosis or "Medical examination",
                background_tasks=background_tasks
            )
    except Exception as notif_error:
        db.rollback()
        print(f"⚠️ Failed to send medical record notification: {notif_error}")
        # Don't fail record creation if notification fails
    
    return db_record

@router.get("/", response_model=List[MedicalRecordWithDetails])
async def get_medical_records(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    patient_id: int = Query(None),
    doctor_id: int = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get all medical records with filters
    """
    query = db.query(MedicalRecord)
    
    # Role-based filtering
    print(f"DEBUG: User {current_user.id} Role: {current_user.role}")
    from app.models.user import UserRole
    if current_user.role == UserRole.PATIENT:
        patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        if patient:
            print(f"DEBUG: Found Patient ID: {patient.id}")
            query = query.filter(MedicalRecord.patient_id == patient.id)
            count = query.count()
            print(f"DEBUG: Found {count} records for patient {patient.id}")
        else:
            print("DEBUG: Patient profile not found for user")
            return []
    
    elif current_user.role == UserRole.DOCTOR:
        doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
        if doctor:
            query = query.filter(MedicalRecord.doctor_id == doctor.id)
        else:
            return []
    
    # Apply filters
    if patient_id:
        query = query.filter(MedicalRecord.patient_id == patient_id)
    
    if doctor_id:
        query = query.filter(MedicalRecord.doctor_id == doctor_id)
    
    records = query.order_by(MedicalRecord.record_date.desc()).offset(skip).limit(limit).all()
    print(f"DEBUG: Query returned {len(records)} records")
    
    result = []
    for record in records:
        print(f"DEBUG: Processing record {record.id} for patient {record.patient_id}")
        record_dict = MedicalRecordResponse.model_validate(record)
        record_dict = record_dict.__dict__

        # record_dict = record.__dict__
        record_dict['patient'] = {
            "id": record.patient.id,
            "patient_id": record.patient.patient_id,
            "name": record.patient.user.full_name
        }
        if record.doctor_id:
            record_dict['doctor'] = {
                "id": record.doctor.id,
                "doctor_id": record.doctor.doctor_id,
                "name": record.doctor.user.full_name
            }
        result.append(record_dict)
    
    print(f"DEBUG: Returning {len(result)} records to frontend")
    return result

@router.get("/{record_id}", response_model=MedicalRecordWithDetails)
async def get_medical_record(
    record_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get specific medical record by ID
    """
    record = db.query(MedicalRecord).filter(MedicalRecord.record_id == record_id).first()
    
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medical record not found"
        )
    
    # Permission check
    if current_user.role.value == "patient":
        patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        if not patient or record.patient_id != patient.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
    
    result = record.__dict__
    result['patient'] = {
        "id": record.patient.id,
        "patient_id": record.patient.patient_id,
        "name": record.patient.user.full_name
    }
    if record.doctor_id:
        result['doctor'] = {
            "id": record.doctor.id,
            "doctor_id": record.doctor.doctor_id,
            "name": record.doctor.user.full_name
        }
    
    return result

@router.put("/{record_id}", response_model=MedicalRecordResponse)
async def update_medical_record(
    record_id: str,
    record_update: MedicalRecordUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Update medical record (Doctor or Admin)
    """
    # Check role permissions
    if current_user.role.value not in ["doctor", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors and admins can update medical records"
        )
    record = db.query(MedicalRecord).filter(MedicalRecord.record_id == record_id).first()
    
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medical record not found"
        )
    
    update_data = record_update.dict(exclude_unset=True)
    
    # Handle attachments serialization if present
    if 'attachments' in update_data:
        update_data['attachments'] = json.dumps(update_data['attachments']) if update_data['attachments'] else "[]"

    for field, value in update_data.items():
        setattr(record, field, value)
    
    db.commit()
    db.refresh(record)
    
    return record

@router.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_medical_record(
    record_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_doctor)
) -> None:
    """
    Delete medical record (Doctor only)
    """
    record = db.query(MedicalRecord).filter(MedicalRecord.record_id == record_id).first()
    
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medical record not found"
        )
    
    db.delete(record)
    db.commit()

@router.get("/patient/{patient_id}/history")
async def get_patient_medical_history(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get complete medical history of a patient
    """
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    records = db.query(MedicalRecord).filter(
        MedicalRecord.patient_id == patient_id
    ).order_by(MedicalRecord.record_date.desc()).all()
    
    return {
        "patient": {
            "id": patient.id,
            "patient_id": patient.patient_id,
            "name": patient.user.full_name,
            "age": patient.age,
            "gender": patient.gender.value,
            "blood_group": patient.blood_group.value if patient.blood_group else None
        },
        "total_records": len(records),
        "records": [
            {
                "record_id": record.record_id,
                "date": record.record_date,
                "doctor": record.doctor.user.full_name if record.doctor_id else None,
                "chief_complaint": record.chief_complaint,
                "assessment": record.assessment
            } for record in records
        ]
    }