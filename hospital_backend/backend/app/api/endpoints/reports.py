from typing import Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_active_user, get_current_admin
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.models.appointment import Appointment
from app.models.billing import Billing
from datetime import datetime, timedelta
from app.models.user import User
import csv
import io

router = APIRouter()

@router.get("/patient-report")
async def generate_patient_report(
    format: str = Query("json", regex="^(json|csv|pdf)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
) -> Any:
    """
    Generate comprehensive patient report (Admin only)
    """
    patients = db.query(Patient).all()
    
    report_data = []
    for patient in patients:
        report_data.append({
            "patient_id": patient.patient_id,
            "name": patient.user.full_name,
            "age": patient.age,
            "gender": patient.gender.value,
            "blood_group": patient.blood_group.value if patient.blood_group else None,
            "bmi": patient.bmi,
            "bmi_category": patient.bmi_category,
            "total_appointments": len(patient.appointments),
            "primary_doctor": patient.primary_doctor.user.full_name if patient.primary_doctor else None,
            "registration_date": patient.registration_date.isoformat()
        })
    
    if format == "csv":
        # Generate CSV
        output = io.StringIO()
        if report_data:
            writer = csv.DictWriter(output, fieldnames=report_data[0].keys())
            writer.writeheader()
            writer.writerows(report_data)
        
        from fastapi.responses import StreamingResponse
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=patient_report.csv"}
        )
    
    return {
        "total_patients": len(report_data),
        "generated_at": datetime.now(),
        "data": report_data
    }

@router.get("/appointment-report")
async def generate_appointment_report(
    start_date: str = Query(None),
    end_date: str = Query(None),
    format: str = Query("json", regex="^(json|csv|pdf)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
) -> Any:
    """
    Generate appointment report (Admin only)
    """
    query = db.query(Appointment)
    
    if start_date:
        query = query.filter(Appointment.appointment_date >= datetime.strptime(start_date, "%Y-%m-%d"))
    if end_date:
        query = query.filter(Appointment.appointment_date <= datetime.strptime(end_date, "%Y-%m-%d"))
    
    appointments = query.all()
    
    report_data = []
    for apt in appointments:
        report_data.append({
            "appointment_id": apt.appointment_id,
            "patient": apt.patient.user.full_name,
            "doctor": apt.doctor.user.full_name,
            "date": apt.appointment_date.isoformat(),
            "type": apt.appointment_type.value,
            "status": apt.status.value,
            "reason": apt.reason
        })
    
    return {
        "total_appointments": len(report_data),
        "period": f"{start_date or 'beginning'} to {end_date or 'now'}",
        "generated_at": datetime.now(),
        "data": report_data
    }

@router.get("/financial-report")
async def generate_financial_report(
    start_date: str = Query(None),
    end_date: str = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
) -> Any:
    """
    Generate financial report (Admin only)
    """
    query = db.query(Billing)
    
    if start_date:
        query = query.filter(Billing.bill_date >= datetime.strptime(start_date, "%Y-%m-%d"))
    if end_date:
        query = query.filter(Billing.bill_date <= datetime.strptime(end_date, "%Y-%m-%d"))
    
    billings = query.all()
    
    total_revenue = sum(b.total_amount for b in billings)
    total_collected = sum(b.paid_amount for b in billings)
    total_pending = sum(b.balance for b in billings)
    
    revenue_breakdown = {
        "consultation": sum(b.consultation_fee for b in billings),
        "medication": sum(b.medication_charges for b in billings),
        "lab_tests": sum(b.lab_charges for b in billings),
        "others": sum(b.other_charges for b in billings)
    }
    
    payment_status_breakdown = {
        "paid": 0,
        "partial": 0,
        "pending": 0,
        "overdue": 0
    }
    
    for billing in billings:
        payment_status_breakdown[billing.payment_status.value] += 1
    
    return {
        "period": f"{start_date or 'beginning'} to {end_date or 'now'}",
        "total_bills": len(billings),
        "total_revenue": total_revenue,
        "total_collected": total_collected,
        "total_pending": total_pending,
        "collection_rate": (total_collected / total_revenue * 100) if total_revenue > 0 else 0,
        "revenue_breakdown": revenue_breakdown,
        "payment_status_breakdown": payment_status_breakdown,
        "generated_at": datetime.now()
    }

@router.get("/doctor-performance-report")
async def generate_doctor_performance_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
) -> Any:
    """
    Generate doctor performance report (Admin only)
    """
    doctors = db.query(Doctor).all()
    
    report_data = []
    for doctor in doctors:
        total_appointments = len(doctor.appointments)
        completed_appointments = sum(1 for apt in doctor.appointments if apt.status.value == "completed")
        
        report_data.append({
            "doctor_id": doctor.doctor_id,
            "name": doctor.user.full_name,
            "specialization": doctor.specialization,
            "total_patients": len(doctor.patients),
            "total_appointments": total_appointments,
            "completed_appointments": completed_appointments,
            "completion_rate": (completed_appointments / total_appointments * 100) if total_appointments > 0 else 0,
            "rating": doctor.rating,
            "total_reviews": doctor.total_reviews,
            "consultation_fee": doctor.consultation_fee
        })
    
    return {
        "total_doctors": len(report_data),
        "generated_at": datetime.now(),
        "data": sorted(report_data, key=lambda x: x['total_appointments'], reverse=True)
    }