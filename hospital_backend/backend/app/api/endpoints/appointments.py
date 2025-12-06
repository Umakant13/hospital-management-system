from typing import Any, List
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_active_user, get_current_admin
from app.models.appointment import Appointment, AppointmentStatus
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.models.user import User
from app.schemas.appointment import (
    AppointmentCreate,
    AppointmentUpdate,
    AppointmentCancel,
    AppointmentResponse,
    AppointmentWithDetails
)
from app.services.notification_service import NotificationService
from datetime import datetime, timedelta
import random

router = APIRouter()

def generate_appointment_id(db: Session) -> str:
    """Generate unique appointment ID"""
    while True:
        appointment_id = f"A{random.randint(10000, 99999)}"
        if not db.query(Appointment).filter(Appointment.appointment_id == appointment_id).first():
            return appointment_id

@router.post("/", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
async def create_appointment(
    appointment_in: AppointmentCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Create new appointment
    """
    # Verify patient exists
    patient = db.query(Patient).filter(Patient.id == appointment_in.patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    # Verify doctor exists
    doctor = db.query(Doctor).filter(Doctor.id == appointment_in.doctor_id).first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found"
        )
    
    # Check if appointment slot is available
    existing_appointment = db.query(Appointment).filter(
        Appointment.doctor_id == appointment_in.doctor_id,
        Appointment.appointment_date == appointment_in.appointment_date,
        Appointment.status.in_([AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED])
    ).first()
    
    if existing_appointment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This time slot is already booked"
        )
    
    # Check daily limit
    day_start = appointment_in.appointment_date.replace(hour=0, minute=0, second=0)
    day_end = day_start + timedelta(days=1)
    
    daily_appointments = db.query(Appointment).filter(
        Appointment.doctor_id == appointment_in.doctor_id,
        Appointment.appointment_date >= day_start,
        Appointment.appointment_date < day_end,
        Appointment.status.in_([AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED])
    ).count()
    
    if daily_appointments >= doctor.max_patients_per_day:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Doctor has reached maximum appointments for this day"
        )
    
    db_appointment = Appointment(
        **appointment_in.dict(),
        appointment_id=generate_appointment_id(db)
    )
    db.add(db_appointment)
    db.commit()
    db.refresh(db_appointment)
    
    # Send notifications to patient, doctor, and admins
    try:
        print(f"🔔 APPOINTMENT: About to send notifications")
        print(f"   Patient User ID: {patient.user_id}")
        print(f"   Doctor User ID: {doctor.user_id}")

        if not patient.user_id:
            print("❌ ERROR: Patient has no user_id linked!")
        
        if not doctor.user_id:
            print("❌ ERROR: Doctor has no user_id linked!")

        NotificationService.create_appointment_notification(
            db=db,
            patient_id=patient.user_id,
            patient_name=patient.user.full_name or patient.user.username,
            doctor_id=doctor.user_id,
            doctor_name=doctor.user.full_name or doctor.user.username,
            appointment_id=db_appointment.id,
            appointment_date=db_appointment.appointment_date.strftime("%B %d, %Y at %I:%M %p"),
            background_tasks=background_tasks
        )
    except Exception as notif_error:
        db.rollback()
        print(f"⚠️ Failed to send appointment notification: {notif_error}")
        # Don't fail appointment creation if notification fails
    
    return db_appointment

@router.get("/", response_model=List[AppointmentWithDetails])
async def get_appointments(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    patient_id: int = Query(None),
    doctor_id: int = Query(None),
    status: AppointmentStatus = Query(None),
    date_from: datetime = Query(None),
    date_to: datetime = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get all appointments with filters
    """
    query = db.query(Appointment)
    
    # Role-based filtering
    if current_user.role.value == "patient":
        # Patients can only see their own appointments
        patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        if patient:
            query = query.filter(Appointment.patient_id == patient.id)
        else:
            return []
    
    elif current_user.role.value == "doctor":
        # Doctors can only see their appointments
        doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
        if doctor:
            query = query.filter(Appointment.doctor_id == doctor.id)
        else:
            return []
    
    # Apply filters
    if patient_id:
        query = query.filter(Appointment.patient_id == patient_id)
    
    if doctor_id:
        query = query.filter(Appointment.doctor_id == doctor_id)
    
    if status:
        query = query.filter(Appointment.status == status)
    
    if date_from:
        query = query.filter(Appointment.appointment_date >= date_from)
    
    if date_to:
        query = query.filter(Appointment.appointment_date <= date_to)
    
    appointments = query.order_by(Appointment.appointment_date.desc()).offset(skip).limit(limit).all()
    
    result = []
    for appointment in appointments:
        apt_dict = appointment.__dict__
        apt_dict['patient'] = {
            "id": appointment.patient.id,
            "user_id": appointment.patient.user_id,
            "patient_id": appointment.patient.patient_id,
            "name": appointment.patient.user.full_name,
            "age": appointment.patient.age,
            "gender": appointment.patient.gender.value
        }
        apt_dict['doctor'] = {
            "id": appointment.doctor.id,
            "doctor_id": appointment.doctor.doctor_id,
            "name": appointment.doctor.user.full_name,
            "specialization": appointment.doctor.specialization
        }
        result.append(apt_dict)
    
    return result

@router.get("/upcoming", response_model=List[AppointmentWithDetails])
async def get_upcoming_appointments(
    days: int = Query(7, ge=1, le=30),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get upcoming appointments
    """
    now = datetime.now()
    future = now + timedelta(days=days)
    
    query = db.query(Appointment).filter(
        Appointment.appointment_date >= now,
        Appointment.appointment_date <= future,
        Appointment.status.in_([AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED])
    )
    
    # Role-based filtering
    if current_user.role.value == "patient":
        patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        if patient:
            query = query.filter(Appointment.patient_id == patient.id)
        else:
            return []
    
    elif current_user.role.value == "doctor":
        doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
        if doctor:
            query = query.filter(Appointment.doctor_id == doctor.id)
        else:
            return []
    
    appointments = query.order_by(Appointment.appointment_date).all()
    
    result = []
    for appointment in appointments:
        apt_dict = appointment.__dict__
        apt_dict['patient'] = {
            "id": appointment.patient.id,
            "user_id": appointment.patient.user_id,
            "patient_id": appointment.patient.patient_id,
            "name": appointment.patient.user.full_name,
            "age": appointment.patient.age,
            "gender": appointment.patient.gender.value
        }
        apt_dict['doctor'] = {
            "id": appointment.doctor.id,
            "doctor_id": appointment.doctor.doctor_id,
            "name": appointment.doctor.user.full_name,
            "specialization": appointment.doctor.specialization
        }
        result.append(apt_dict)
    
    return result

@router.get("/{appointment_id}", response_model=AppointmentWithDetails)
async def get_appointment(
    appointment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get specific appointment by ID
    """
    appointment = db.query(Appointment).filter(Appointment.appointment_id == appointment_id).first()
    
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    
    # Permission check
    if current_user.role.value == "patient":
        patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        if not patient or appointment.patient_id != patient.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
    
    elif current_user.role.value == "doctor":
        doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
        if not doctor or appointment.doctor_id != doctor.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
    
    result = appointment.__dict__
    result['patient'] = {
        "id": appointment.patient.id,
        "user_id": appointment.patient.user_id,
        "patient_id": appointment.patient.patient_id,
        "name": appointment.patient.user.full_name,
        "age": appointment.patient.age,
        "gender": appointment.patient.gender.value,
        "phone": appointment.patient.user.phone
    }
    result['doctor'] = {
        "id": appointment.doctor.id,
        "doctor_id": appointment.doctor.doctor_id,
        "name": appointment.doctor.user.full_name,
        "specialization": appointment.doctor.specialization,
        "phone": appointment.doctor.user.phone
    }
    
    return result

@router.put("/{appointment_id}", response_model=AppointmentResponse)
async def update_appointment(
    appointment_id: str,
    appointment_update: AppointmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Update appointment
    """
    appointment = db.query(Appointment).filter(Appointment.appointment_id == appointment_id).first()
    
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    
    # Permission check
    if current_user.role.value == "doctor":
        doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
        if not doctor or appointment.doctor_id != doctor.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
    elif current_user.role.value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    update_data = appointment_update.dict(exclude_unset=True)
    
    # Validate patient if being updated
    if 'patient_id' in update_data:
        patient = db.query(Patient).filter(Patient.id == update_data['patient_id']).first()
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found"
            )

    # Validate doctor if being updated
    if 'doctor_id' in update_data:
        doctor = db.query(Doctor).filter(Doctor.id == update_data['doctor_id']).first()
        if not doctor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Doctor not found"
            )

    for field, value in update_data.items():
        setattr(appointment, field, value)
    
    db.commit()
    db.refresh(appointment)
    
    return appointment

@router.post("/{appointment_id}/cancel", response_model=AppointmentResponse)
async def cancel_appointment(
    appointment_id: str,
    cancel_data: AppointmentCancel,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Cancel appointment
    """
    appointment = db.query(Appointment).filter(Appointment.appointment_id == appointment_id).first()
    
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    
    # Permission check
    if current_user.role.value == "patient":
        patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        if not patient or appointment.patient_id != patient.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
    
    appointment.status = AppointmentStatus.CANCELLED
    appointment.cancelled_reason = cancel_data.cancelled_reason
    
    db.commit()
    db.refresh(appointment)
    
    return appointment

@router.delete("/{appointment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_appointment(
    appointment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
) -> None:
    """
    Delete appointment (Admin only)
    """
    appointment = db.query(Appointment).filter(Appointment.appointment_id == appointment_id).first()
    
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    
    db.delete(appointment)
    db.commit()

@router.get("/analytics/status-distribution")
async def get_appointment_status_distribution(
    date_from: datetime = Query(None),
    date_to: datetime = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get appointment status distribution
    """
    query = db.query(Appointment)
    
    if date_from:
        query = query.filter(Appointment.appointment_date >= date_from)
    if date_to:
        query = query.filter(Appointment.appointment_date <= date_to)
    
    appointments = query.all()
    
    distribution = {
        "scheduled": 0,
        "confirmed": 0,
        "in_progress": 0,
        "completed": 0,
        "cancelled": 0,
        "no_show": 0
    }
    
    for appointment in appointments:
        distribution[appointment.status.value] += 1
    
    return distribution

@router.get("/analytics/daily-count")
async def get_daily_appointment_count(
    days: int = Query(7, ge=1, le=90),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get daily appointment count for the last N days
    """
    today = datetime.now().date()
    start_date = today - timedelta(days=days)
    
    appointments = db.query(Appointment).filter(
        Appointment.appointment_date >= start_date
    ).all()
    
    daily_counts = {}
    current_date = start_date
    while current_date <= today:
        daily_counts[current_date.isoformat()] = 0
        current_date += timedelta(days=1)
    
    for appointment in appointments:
        date_key = appointment.appointment_date.date().isoformat()
        if date_key in daily_counts:
            daily_counts[date_key] += 1
    
    return daily_counts