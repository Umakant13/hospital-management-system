from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_active_user
from app.models.user import User, UserRole
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.models.appointment import Appointment, AppointmentStatus
from app.models.message import Message
from app.models.notification import Notification
from datetime import datetime, timedelta
from app.api.deps import get_current_admin, get_current_doctor, get_current_patient

router = APIRouter()

@router.get("/admin")
async def get_admin_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
) -> Any:
    """
    Get admin dashboard data
    """
    # Counts
    total_patients = db.query(Patient).count()
    total_doctors = db.query(Doctor).count()
    total_appointments = db.query(Appointment).count()
    total_users = db.query(User).count()
    
    # Today's stats
    today = datetime.now().date()
    today_appointments = db.query(Appointment).filter(
        Appointment.appointment_date >= today,
        Appointment.appointment_date < today + timedelta(days=1)
    ).count()
    
    # Recent activities
    recent_appointments = db.query(Appointment).order_by(
        Appointment.created_at.desc()
    ).limit(5).all()
    
    recent_patients = db.query(Patient).order_by(
        Patient.created_at.desc()
    ).limit(5).all()
    
    # Pending tasks
    pending_appointments = db.query(Appointment).filter(
        Appointment.status == AppointmentStatus.SCHEDULED,
        Appointment.appointment_date >= datetime.now()
    ).count()
    
    unread_messages = db.query(Message).filter(
        Message.receiver_id == current_user.id,
        Message.is_read == False
    ).count()
    
    return {
        "overview": {
            "total_patients": total_patients,
            "total_doctors": total_doctors,
            "total_appointments": total_appointments,
            "total_users": total_users,
            "today_appointments": today_appointments
        },
        "recent_appointments": [
            {
                "appointment_id": apt.appointment_id,
                "patient": apt.patient.user.full_name,
                "doctor": apt.doctor.user.full_name,
                "date": apt.appointment_date,
                "status": apt.status.value
            } for apt in recent_appointments
        ],
        "recent_patients": [
            {
                "patient_id": p.patient_id,
                "name": p.user.full_name,
                "age": p.age,
                "gender": p.gender.value,
                "registered_date": p.registration_date
            } for p in recent_patients
        ],
        "pending_tasks": {
            "pending_appointments": pending_appointments,
            "unread_messages": unread_messages
        }
    }

@router.get("/doctor")
async def get_doctor_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_doctor)
) -> Any:
    """
    Get doctor dashboard data
    """
    doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
    
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor profile not found")
    
    # Today's appointments
    today = datetime.now().date()
    today_appointments = db.query(Appointment).filter(
        Appointment.doctor_id == doctor.id,
        Appointment.appointment_date >= today,
        Appointment.appointment_date < today + timedelta(days=1)
    ).order_by(Appointment.appointment_date).all()
    
    # Upcoming appointments
    upcoming_appointments = db.query(Appointment).filter(
        Appointment.doctor_id == doctor.id,
        Appointment.appointment_date >= datetime.now(),
        Appointment.status.in_([AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED])
    ).order_by(Appointment.appointment_date).limit(10).all()
    
    # My patients
    total_patients = len(doctor.patients)
    
    # Statistics
    total_appointments = db.query(Appointment).filter(
        Appointment.doctor_id == doctor.id
    ).count()
    
    completed_appointments = db.query(Appointment).filter(
        Appointment.doctor_id == doctor.id,
        Appointment.status == AppointmentStatus.COMPLETED
    ).count()
    
    return {
        "doctor_info": {
            "doctor_id": doctor.doctor_id,
            "name": doctor.user.full_name,
            "specialization": doctor.specialization,
            "rating": doctor.rating,
            "total_reviews": doctor.total_reviews
        },
        "statistics": {
            "total_patients": total_patients,
            "total_appointments": total_appointments,
            "completed_appointments": completed_appointments,
            "today_appointments": len(today_appointments)
        },
        "today_schedule": [
            {
                "appointment_id": apt.appointment_id,
                "patient": apt.patient.user.full_name,
                "time": apt.appointment_date,
                "reason": apt.reason,
                "status": apt.status.value
            } for apt in today_appointments
        ],
        "upcoming_appointments": [
            {
                "appointment_id": apt.appointment_id,
                "patient": apt.patient.user.full_name,
                "date": apt.appointment_date,
                "reason": apt.reason
            } for apt in upcoming_appointments
        ]
    }

@router.get("/patient")
async def get_patient_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_patient)
) -> Any:
    """
    Get patient dashboard data
    """
    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")
    
    # Upcoming appointments
    upcoming_appointments = db.query(Appointment).filter(
        Appointment.patient_id == patient.id,
        Appointment.appointment_date >= datetime.now(),
        Appointment.status.in_([AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED])
    ).order_by(Appointment.appointment_date).all()
    
    # Recent appointments
    recent_appointments = db.query(Appointment).filter(
        Appointment.patient_id == patient.id
    ).order_by(Appointment.appointment_date.desc()).limit(5).all()
    
    # Health metrics
    health_metrics = {
        "bmi": patient.bmi,
        "bmi_category": patient.bmi_category,
        "blood_group": patient.blood_group.value if patient.blood_group else None,
        "height": patient.height,
        "weight": patient.weight
    }
    
    # Primary doctor
    primary_doctor = None
    if patient.primary_doctor:
        primary_doctor = {
            "doctor_id": patient.primary_doctor.doctor_id,
            "name": patient.primary_doctor.user.full_name,
            "specialization": patient.primary_doctor.specialization,
            "phone": patient.primary_doctor.user.phone
        }
    
    return {
        "patient_info": {
            "patient_id": patient.patient_id,
            "name": patient.user.full_name,
            "age": patient.age,
            "gender": patient.gender.value
        },
        "health_metrics": health_metrics,
        "primary_doctor": primary_doctor,
        "upcoming_appointments": [
            {
                "appointment_id": apt.appointment_id,
                "doctor": apt.doctor.user.full_name,
                "specialization": apt.doctor.specialization,
                "date": apt.appointment_date,
                "type": apt.appointment_type.value
            } for apt in upcoming_appointments
        ],
        "recent_appointments": [
            {
                "appointment_id": apt.appointment_id,
                "doctor": apt.doctor.user.full_name,
                "date": apt.appointment_date,
                "status": apt.status.value
            } for apt in recent_appointments
        ]
    }