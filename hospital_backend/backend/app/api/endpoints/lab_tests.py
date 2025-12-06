from typing import Any, List
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_active_user, get_current_doctor, get_current_admin
from app.models.lab_test import LabTest, TestStatus
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.models.user import User
from app.schemas.lab_test import (
    LabTestCreate,
    LabTestUpdate,
    LabTestResponse,
    LabTestWithDetails
)
from app.services.notification_service import NotificationService
import random

router = APIRouter()

def generate_test_id(db: Session) -> str:
    """Generate unique lab test ID"""
    while True:
        test_id = f"LAB{random.randint(10000, 99999)}"
        if not db.query(LabTest).filter(LabTest.test_id == test_id).first():
            return test_id

@router.post("/", response_model=LabTestResponse, status_code=status.HTTP_201_CREATED)
async def create_lab_test(
    test_in: LabTestCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_doctor)
) -> Any:
    """
    Create new lab test order (Doctor only)
    """
    # Verify patient exists
    patient = db.query(Patient).filter(Patient.id == test_in.patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    db_test = LabTest(
        **test_in.dict(),
        test_id=generate_test_id(db),
        cost=500.0  # Default cost, can be updated later
    )
    db.add(db_test)
    db.commit()
    db.refresh(db_test)
    
    # Send notifications to patient, doctor, and admins
    try:
        # Get doctor info
        doctor = db.query(Doctor).filter(Doctor.id == test_in.doctor_id).first()
        if doctor:
            NotificationService.create_lab_test_notification(
                db=db,
                patient_id=patient.user_id,
                patient_name=patient.user.full_name or patient.user.username,
                doctor_id=doctor.user_id,
                doctor_name=doctor.user.full_name or doctor.user.username,
                test_id=db_test.id,
                test_name=test_in.test_name,
                background_tasks=background_tasks
            )
    except Exception as notif_error:
        db.rollback()
        print(f"⚠️ Failed to send lab test notification: {notif_error}")
        # Don't fail test creation if notification fails
    
    return db_test

@router.get("/", response_model=List[LabTestWithDetails])
async def get_lab_tests(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    patient_id: int = Query(None),
    status: TestStatus = Query(None),
    search: str = Query(None),
    test_type: str = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get all lab tests with filters
    """
    query = db.query(LabTest)
    
    # Role-based filtering
    if current_user.role.value == "patient":
        patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        if patient:
            query = query.filter(LabTest.patient_id == patient.id)
        else:
            return []
    
    # Apply filters
    if patient_id:
        query = query.filter(LabTest.patient_id == patient_id)
    
    if status:
        query = query.filter(LabTest.status == status)
    
    if test_type:
        query = query.filter(LabTest.test_type == test_type)
    
    if search:
        query = query.join(LabTest.patient).join(Patient.user).filter(
            (LabTest.test_name.contains(search)) |
            (User.full_name.contains(search))
        )
    
    tests = query.order_by(LabTest.ordered_date.desc()).offset(skip).limit(limit).all()
    
    result = []
    for test in tests:
        test_dict = test.__dict__
        test_dict['patient'] = {
            "id": test.patient.id,
            "patient_id": test.patient.patient_id,
            "name": test.patient.user.full_name
        }
        if test.doctor_id:
            test_dict['doctor'] = {
                "id": test.doctor.id,
                "doctor_id": test.doctor.doctor_id,
                "name": test.doctor.user.full_name
            }
        result.append(test_dict)
    
    return result

@router.get("/{test_id}", response_model=LabTestWithDetails)
async def get_lab_test(
    test_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get specific lab test by ID
    """
    test = db.query(LabTest).filter(LabTest.test_id == test_id).first()
    
    if not test:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lab test not found"
        )
    
    result = test.__dict__
    result['patient'] = {
        "id": test.patient.id,
        "patient_id": test.patient.patient_id,
        "name": test.patient.user.full_name
    }
    if test.doctor_id:
        result['doctor'] = {
            "id": test.doctor.id,
            "doctor_id": test.doctor.doctor_id,
            "name": test.doctor.user.full_name
        }
    
    return result

@router.put("/{test_id}", response_model=LabTestResponse)
async def update_lab_test(
    test_id: str,
    test_update: LabTestUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Update lab test
    """
    test = db.query(LabTest).filter(LabTest.test_id == test_id).first()
    
    if not test:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lab test not found"
        )
    
    update_data = test_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(test, field, value)
    
    db.commit()
    db.refresh(test)
    
    return test

@router.delete("/{test_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lab_test(
    test_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
) -> None:
    """
    Delete lab test (Admin only)
    """
    test = db.query(LabTest).filter(LabTest.test_id == test_id).first()
    
    if not test:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lab test not found"
        )
    
    db.delete(test)
    db.commit()

@router.get("/analytics/status-distribution")
async def get_lab_test_status_distribution(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get lab test status distribution
    """
    tests = db.query(LabTest).all()
    
    distribution = {
        "ordered": 0,
        "sample_collected": 0,
        "in_progress": 0,
        "completed": 0,
        "cancelled": 0
    }
    
    for test in tests:
        distribution[test.status.value] += 1
    
    return distribution