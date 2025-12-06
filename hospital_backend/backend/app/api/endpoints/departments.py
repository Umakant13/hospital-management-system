from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.api.deps import get_db, get_current_active_user, get_current_admin
from app.models.department import Department
from app.models.doctor import Doctor
from app.models.user import User, UserRole
from app.schemas.department import (
    DepartmentCreate,
    DepartmentUpdate,
    DepartmentResponse,
    DepartmentWithDoctors
)

router = APIRouter()

@router.post("/", response_model=DepartmentResponse, status_code=status.HTTP_201_CREATED)
async def create_department(
    department_in: DepartmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
) -> Any:
    """
    Create new department (Admin only)
    """
    # Check if department exists
    existing = db.query(Department).filter(Department.name == department_in.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Department with this name already exists"
        )
    
    db_department = Department(**department_in.dict())
    db.add(db_department)
    db.commit()
    db.refresh(db_department)
    
    return db_department

@router.get("/", response_model=List[DepartmentWithDoctors])
async def get_departments(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get all departments
    """
    departments = db.query(Department).offset(skip).limit(limit).all()
    
    result = []
    for dept in departments:
        dept_dict = dept.__dict__
        dept_dict['doctors_count'] = len(dept.doctors)
        
        if dept.head_doctor_id:
            head_doctor = db.query(Doctor).filter(Doctor.id == dept.head_doctor_id).first()
            if head_doctor:
                dept_dict['head_doctor'] = {
                    "id": head_doctor.id,
                    "doctor_id": head_doctor.doctor_id,
                    "name": head_doctor.user.full_name,
                    "specialization": head_doctor.specialization
                }
        
        result.append(dept_dict)
    
    return result

@router.get("/{department_id}", response_model=DepartmentWithDoctors)
async def get_department(
    department_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get specific department by ID
    """
    department = db.query(Department).filter(Department.id == department_id).first()
    
    if not department:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found"
        )
    
    result = department.__dict__
    result['doctors_count'] = len(department.doctors)
    
    if department.head_doctor_id:
        head_doctor = db.query(Doctor).filter(Doctor.id == department.head_doctor_id).first()
        if head_doctor:
            result['head_doctor'] = {
                "id": head_doctor.id,
                "doctor_id": head_doctor.doctor_id,
                "name": head_doctor.user.full_name,
                "specialization": head_doctor.specialization
            }
    
    return result

@router.put("/{department_id}", response_model=DepartmentResponse)
async def update_department(
    department_id: int,
    department_update: DepartmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
) -> Any:
    """
    Update department (Admin only)
    """
    department = db.query(Department).filter(Department.id == department_id).first()
    
    if not department:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found"
        )
    
    update_data = department_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(department, field, value)
    
    db.commit()
    db.refresh(department)
    
    return department

@router.delete("/{department_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_department(
    department_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
) -> None:
    """
    Delete department (Admin only)
    """
    department = db.query(Department).filter(Department.id == department_id).first()
    
    if not department:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found"
        )
    
    # Check if department has doctors
    if len(department.doctors) > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete department with assigned doctors"
        )
    
    db.delete(department)
    db.commit()

@router.get("/{department_id}/doctors", response_model=List[dict])
async def get_department_doctors(
    department_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get all doctors in a department
    """
    department = db.query(Department).filter(Department.id == department_id).first()
    
    if not department:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found"
        )
    
    result = []
    for doctor in department.doctors:
        result.append({
            "id": doctor.id,
            "doctor_id": doctor.doctor_id,
            "name": doctor.user.full_name,
            "specialization": doctor.specialization,
            "experience_years": doctor.experience_years,
            "rating": doctor.rating,
            "consultation_fee": doctor.consultation_fee
        })
    
    return result

@router.get("/stats/overview")
async def get_department_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get department analytics statistics
    """
    if current_user.role not in [UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    total_departments = db.query(Department).count()
    
    # Get doctor counts per department
    dept_doctor_counts = db.query(
        Department.name,
        func.count(Doctor.id).label('count')
    ).outerjoin(Doctor).group_by(Department.id).all()
    
    total_doctors = sum(count for _, count in dept_doctor_counts)
    
    # Find department with most doctors
    most_populated = max(dept_doctor_counts, key=lambda x: x[1]) if dept_doctor_counts else ("None", 0)
    
    # Calculate utilization (mock logic for now, or based on appointments if available)
    # For now, we'll return doctor distribution
    
    return {
        "total_departments": total_departments,
        "total_doctors": total_doctors,
        "most_populated_department": {
            "name": most_populated[0],
            "count": most_populated[1]
        },
        "doctor_distribution": [
            {"name": name, "value": count} for name, count in dept_doctor_counts
        ]
    }

@router.post("/{department_id}/assign-doctor", response_model=dict)
async def assign_doctor_to_department(
    department_id: int,
    doctor_id: int,
    is_head: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Assign a doctor to a department.
    - Multiple doctors can be assigned to one department
    - Only one head doctor per department (is_head=True)
    - If is_head=True and department already has head, raise error
    """
    department = db.query(Department).filter(Department.id == department_id).first()
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")

    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    # Check if doctor already assigned to this department
    if doctor.department_id == department_id:
        raise HTTPException(
            status_code=400,
            detail=f"Doctor {doctor.user.full_name} is already assigned to {department.name}"
        )

    # If trying to assign as head doctor
    if is_head:
        if department.head_doctor_id is not None:
            existing_head = db.query(Doctor).filter(Doctor.id == department.head_doctor_id).first()
            raise HTTPException(
                status_code=400,
                detail=f"Department '{department.name}' already has {existing_head.user.full_name} as head doctor."
            )
        department.head_doctor_id = doctor.id

    # Assign doctor to department
    doctor.department_id = department_id

    db.commit()
    db.refresh(department)
    db.refresh(doctor)

    message = f"Doctor {doctor.user.full_name} assigned to {department.name}"
    if is_head:
        message += " as Head Doctor"

    return {
        "message": message,
        "doctor_id": doctor.id,
        "department_id": department.id,
        "is_head": is_head,
        "head_doctor_id": department.head_doctor_id
    }



@router.delete("/{department_id}/remove-doctor/{doctor_id}", response_model=dict)
async def remove_doctor_from_department(
    department_id: int,
    doctor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Remove doctor from department.
    - Clears head_doctor_id if this doctor is the head.
    """
    department = db.query(Department).filter(Department.id == department_id).first()
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")

    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    if doctor.department_id != department_id:
        raise HTTPException(
            status_code=400,
            detail=f"Doctor {doctor.user.full_name} is not assigned to this department"
        )

    # ✅ Remove doctor and clear head if needed
    if department.head_doctor_id == doctor.id:
        department.head_doctor_id = None

    doctor.department_id = None

    db.commit()
    db.refresh(department)

    return {
        "message": f"Doctor {doctor.user.full_name} removed from {department.name}",
        "doctor_id": doctor.id,
        "department_id": department.id,
        "head_doctor_cleared": department.head_doctor_id is None
    }

