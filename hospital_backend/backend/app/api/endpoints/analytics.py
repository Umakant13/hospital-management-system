from typing import Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.api.deps import get_db, get_current_active_user, get_current_admin
from app.models.patient import Patient, Gender
from app.models.doctor import Doctor
from app.models.appointment import Appointment, AppointmentStatus
from app.models.billing import Billing, PaymentStatus
from app.models.user import User
from datetime import datetime, timedelta

router = APIRouter()

@router.get("/overview")
async def get_analytics_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
) -> Any:
    """
    Get overall system analytics (Admin only)
    """
    total_patients = db.query(Patient).count()
    total_doctors = db.query(Doctor).count()
    total_appointments = db.query(Appointment).count()
    
    # Today's appointments
    today = datetime.now().date()
    today_appointments = db.query(Appointment).filter(
        func.date(Appointment.appointment_date) == today
    ).count()
    
    # Pending bills
    pending_bills = db.query(Billing).filter(
        Billing.payment_status == PaymentStatus.PENDING
    ).count()
    
    # Total revenue
    total_revenue = db.query(func.sum(Billing.total_amount)).scalar() or 0
    total_paid = db.query(func.sum(Billing.paid_amount)).scalar() or 0
    
    return {
        "total_patients": total_patients,
        "total_doctors": total_doctors,
        "total_appointments": total_appointments,
        "today_appointments": today_appointments,
        "pending_bills": pending_bills,
        "total_revenue": float(total_revenue),
        "total_paid": float(total_paid),
        "pending_revenue": float(total_revenue - total_paid)
    }

@router.get("/patient-demographics")
async def get_patient_demographics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get patient demographic analytics
    """
    patients = db.query(Patient).all()
    
    # Gender distribution
    gender_dist = {
        "male": 0,
        "female": 0,
        "other": 0
    }
    
    # Age distribution
    age_dist = {
        "0-18": 0,
        "19-30": 0,
        "31-45": 0,
        "46-60": 0,
        "60+": 0
    }
    
    # BMI distribution
    bmi_dist = {
        "Underweight": 0,
        "Normal weight": 0,
        "Overweight": 0,
        "Obese": 0,
        "Unknown": 0
    }
    
    for patient in patients:
        # Gender
        if patient.gender:
            gender_dist[patient.gender.value] += 1
        
        # Age
        if patient.age <= 18:
            age_dist["0-18"] += 1
        elif patient.age <= 30:
            age_dist["19-30"] += 1
        elif patient.age <= 45:
            age_dist["31-45"] += 1
        elif patient.age <= 60:
            age_dist["46-60"] += 1
        else:
            age_dist["60+"] += 1
        
        # BMI
        if patient.bmi_category:
            bmi_dist[patient.bmi_category] += 1
        else:
            bmi_dist["Unknown"] += 1
    
    return {
        "total_patients": len(patients),
        "gender_distribution": gender_dist,
        "age_distribution": age_dist,
        "bmi_distribution": bmi_dist
    }

@router.get("/appointment-trends")
async def get_appointment_trends(
    days: int = Query(30, ge=7, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get appointment trends over time
    """
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    
    appointments = db.query(Appointment).filter(
        Appointment.appointment_date >= start_date,
        Appointment.appointment_date <= end_date
    ).all()
    
    # Daily counts
    daily_counts = {}
    current_date = start_date.date()
    while current_date <= end_date.date():
        daily_counts[current_date.isoformat()] = 0
        current_date += timedelta(days=1)
    
    for appointment in appointments:
        date_key = appointment.appointment_date.date().isoformat()
        if date_key in daily_counts:
            daily_counts[date_key] += 1
    
    # Status distribution
    status_dist = {
        "scheduled": 0,
        "confirmed": 0,
        "in_progress": 0,
        "completed": 0,
        "cancelled": 0,
        "no_show": 0
    }
    
    for appointment in appointments:
        status_dist[appointment.status.value] += 1
    
    return {
        "period": f"Last {days} days",
        "total_appointments": len(appointments),
        "daily_appointments": daily_counts,
        "status_distribution": status_dist
    }

@router.get("/doctor-performance")
async def get_doctor_performance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get doctor performance metrics (Admin or Doctor)
    """
    if current_user.role.value == "doctor":
        # If doctor, only return their own performance
        doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
        doctors = [doctor] if doctor else []
    else:
        # If admin, return all
        doctors = db.query(Doctor).all()
    
    result = []
    for doctor in doctors:
        total_appointments = db.query(Appointment).filter(
            Appointment.doctor_id == doctor.id
        ).count()
        
        completed_appointments = db.query(Appointment).filter(
            Appointment.doctor_id == doctor.id,
            Appointment.status == AppointmentStatus.COMPLETED
        ).count()
        
        total_patients = len(doctor.patients)
        
        # Calculate completion rate
        completion_rate = (completed_appointments / total_appointments * 100) if total_appointments > 0 else 0
        
        result.append({
            "doctor_id": doctor.doctor_id,
            "doctor_name": doctor.user.full_name,
            "specialization": doctor.specialization,
            "total_patients": total_patients,
            "total_appointments": total_appointments,
            "completed_appointments": completed_appointments,
            "completion_rate": round(completion_rate, 2),
            "rating": doctor.rating,
            "total_reviews": doctor.total_reviews
        })
    
    return result

@router.get("/revenue-analytics")
async def get_revenue_analytics(
    start_date: str = Query(None),
    end_date: str = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
) -> Any:
    """
    Get revenue analytics (Admin only)
    """
    query = db.query(Billing)
    
    if start_date:
        query = query.filter(Billing.bill_date >= datetime.strptime(start_date, "%Y-%m-%d"))
    if end_date:
        query = query.filter(Billing.bill_date <= datetime.strptime(end_date, "%Y-%m-%d"))
    
    billings = query.all()
    
    total_bills = len(billings)
    total_revenue = sum(b.total_amount for b in billings)
    total_paid = sum(b.paid_amount for b in billings)
    total_pending = sum(b.balance for b in billings if b.balance > 0)
    
    # Payment method distribution
    payment_methods = {}
    for billing in billings:
        if billing.payment_method:
            method = billing.payment_method.value
            payment_methods[method] = payment_methods.get(method, 0) + billing.paid_amount
    
    # Status distribution
    status_dist = {
        "pending": len([b for b in billings if b.payment_status == PaymentStatus.PENDING]),
        "partial": len([b for b in billings if b.payment_status == PaymentStatus.PARTIAL]),
        "paid": len([b for b in billings if b.payment_status == PaymentStatus.PAID]),
        "overdue": len([b for b in billings if b.payment_status == PaymentStatus.OVERDUE]),
    }
    
    return {
        "total_bills": total_bills,
        "total_revenue": float(total_revenue),
        "total_paid": float(total_paid),
        "total_pending": float(total_pending),
        "collection_rate": round((total_paid / total_revenue * 100) if total_revenue > 0 else 0, 2),
        "payment_method_distribution": payment_methods,
        "status_distribution": status_dist
    }