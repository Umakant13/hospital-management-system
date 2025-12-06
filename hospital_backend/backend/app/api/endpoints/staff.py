from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.api.deps import get_db, get_current_active_user, get_current_admin
from app.models.staff import Staff, StaffCategory, EmploymentType
from app.models.user import User, UserRole
from app.models.department import Department
from app.schemas.staff import (
    StaffCreate,
    StaffUpdate,
    StaffResponse,
    StaffWithUser
)
from datetime import datetime
from fastapi.encoders import jsonable_encoder
from app.core.security import get_password_hash
import uuid

router = APIRouter()

def generate_staff_id(user_id: int) -> str:
    """Generate unique staff ID"""
    return f"S{1000 + user_id}"

def generate_employee_id(category: str) -> str:
    """Generate employee ID based on category"""
    prefix_map = {
        "nurse": "NRS",
        "receptionist": "RCP",
        "lab_technician": "LBT",
        "pharmacist": "PHR",
        "administrator": "ADM",
        "support_staff": "SUP"
    }
    prefix = prefix_map.get(category, "EMP")
    unique_id = uuid.uuid4().hex[:6].upper()
    return f"{prefix}-{unique_id}"

@router.post("/", response_model=StaffResponse, status_code=status.HTTP_201_CREATED)
async def create_staff(
    staff_in: StaffCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Create staff - Creates user too if user_id not provided (Admin only)
    """
    
    try:
        # ==========================================
        # Case 1: Link to existing user
        # ==========================================
        if staff_in.user_id:
            # Check if user exists
            existing_user = db.query(User).filter(User.id == staff_in.user_id).first()
            if not existing_user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"User ID {staff_in.user_id} not found"
                )
            
            # Check if staff record already exists
            existing_staff = db.query(Staff).filter(Staff.user_id == staff_in.user_id).first()
            if existing_staff:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Staff record already exists for this user"
                )
            
            # Update user role to staff
            existing_user.role = UserRole.STAFF
            user_id = existing_user.id
        
        # ==========================================
        # Case 2: Create new user automatically
        # ==========================================
        else:
            # Generate unique credentials
            unique_id = uuid.uuid4().hex[:6]
            username = f"staff_{staff_in.employee_id.replace('-', '_').lower()}"
            email = f"staff_{unique_id}@hospital.com"
            
            # Check username uniqueness
            if db.query(User).filter(User.username == username).first():
                username = f"{username}_{unique_id}"
            
            # Create new user
            new_user = User(
                email=email,
                username=username,
                full_name=f"{staff_in.category.value.replace('_', ' ').title()} Staff",
                hashed_password=get_password_hash("Staff@123"),
                role=UserRole.STAFF,
                is_active=True,
                is_verified=True
            )
            db.add(new_user)
            db.flush()  # Get ID
            user_id = new_user.id

        # ==========================================
        # Check employee_id uniqueness
        # ==========================================
        existing_employee = db.query(Staff).filter(
            Staff.employee_id == staff_in.employee_id
        ).first()
        if existing_employee:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Employee ID {staff_in.employee_id} already exists"
            )

        # ==========================================
        # Create staff record
        # ==========================================
        new_staff = Staff(
            user_id=user_id,
            staff_id=generate_staff_id(user_id),
            employee_id=staff_in.employee_id,
            category=staff_in.category,
            position=staff_in.position,
            department_id=staff_in.department_id,
            qualification=staff_in.qualification,
            joining_date=staff_in.joining_date,
            experience_years=staff_in.experience_years,
            shift_timing=staff_in.shift_timing,
            salary=staff_in.salary,
            employment_type=staff_in.employment_type,
            is_active=staff_in.is_active
        )
        
        db.add(new_staff)
        db.commit()
        db.refresh(new_staff)
        
        return new_staff
    
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        print(f"Error creating staff: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create staff: {str(e)}"
        )

@router.get("/", response_model=List[StaffWithUser])
async def get_all_staff(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    category: str = Query(None),
    department_id: int = Query(None),
    search: str = Query(None),
    employment_type: str = Query(None),
    is_active: bool = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get all staff with filters
    """
    query = db.query(Staff).join(User)
    
    if category:
        query = query.filter(Staff.category == category)
    
    if department_id:
        query = query.filter(Staff.department_id == department_id)
    
    if employment_type:
        query = query.filter(Staff.employment_type == employment_type)
    
    if is_active is not None:
        query = query.filter(Staff.is_active == is_active)
    
    if search:
        query = query.filter(
            (User.full_name.contains(search)) |
            (Staff.staff_id.contains(search)) |
            (Staff.employee_id.contains(search)) |
            (Staff.position.contains(search))
        )
    
    staff_list = query.offset(skip).limit(limit).all()
    
    result = []
    for staff in staff_list:
        staff_data = jsonable_encoder(staff)
        staff_data['user'] = jsonable_encoder(staff.user)
        
        if staff.department:
            staff_data['department'] = jsonable_encoder(staff.department)
        
        result.append(staff_data)
    
    return result

@router.get("/{staff_id}", response_model=StaffWithUser)
async def get_staff(
    staff_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get specific staff by ID
    """
    staff = db.query(Staff).filter(Staff.staff_id == staff_id).first()
    
    if not staff:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Staff not found"
        )
    
    result = jsonable_encoder(staff)
    result['user'] = jsonable_encoder(staff.user)
    if staff.department:
        result['department'] = jsonable_encoder(staff.department)
    
    return result

@router.put("/{staff_id}", response_model=StaffResponse)
async def update_staff(
    staff_id: str,
    staff_update: StaffUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Update staff information
    """
    staff = db.query(Staff).filter(Staff.staff_id == staff_id).first()
    
    if not staff:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Staff not found"
        )
    
    # Only admin or the staff member themselves can update
    if current_user.role.value != "admin" and staff.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    update_data = staff_update.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(staff, field, value)
    
    db.commit()
    db.refresh(staff)
    
    return jsonable_encoder(staff)

@router.delete("/{staff_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_staff(
    staff_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
) -> None:
    """
    Delete staff record (Admin only)
    """
    staff = db.query(Staff).filter(Staff.staff_id == staff_id).first()
    
    if not staff:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Staff not found"
        )
    
    db.delete(staff)
    db.commit()

@router.get("/analytics/performance")
async def get_staff_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
) -> Any:
    """
    Get staff analytics (Admin only)
    """
    
    # Total staff count
    total_staff = db.query(Staff).count()
    active_staff = db.query(Staff).filter(Staff.is_active == True).count()
    
    # Average experience
    avg_experience = db.query(func.avg(Staff.experience_years)).scalar() or 0
    
    # Category-wise distribution
    category_distribution = db.query(
        Staff.category,
        func.count(Staff.id).label('count')
    ).group_by(Staff.category).all()
    
    category_data = [
        {
            "category": cat.value,
            "count": count
        }
        for cat, count in category_distribution
    ]
    
    # Department-wise distribution
    department_distribution = db.query(
        Department.name,
        func.count(Staff.id).label('count')
    ).join(Staff, Staff.department_id == Department.id, isouter=True)\
     .group_by(Department.name).all()
    
    department_data = [
        {
            "department": dept_name or "Unassigned",
            "count": count
        }
        for dept_name, count in department_distribution
    ]
    
    # Employment type distribution
    employment_distribution = db.query(
        Staff.employment_type,
        func.count(Staff.id).label('count')
    ).group_by(Staff.employment_type).all()
    
    employment_data = [
        {
            "type": emp_type.value,
            "count": count
        }
        for emp_type, count in employment_distribution
    ]
    
    # Experience distribution (0-2, 3-5, 6-10, 10+)
    experience_ranges = [
        {"range": "0-2 years", "count": db.query(Staff).filter(Staff.experience_years <= 2).count()},
        {"range": "3-5 years", "count": db.query(Staff).filter(Staff.experience_years.between(3, 5)).count()},
        {"range": "6-10 years", "count": db.query(Staff).filter(Staff.experience_years.between(6, 10)).count()},
        {"range": "10+ years", "count": db.query(Staff).filter(Staff.experience_years > 10).count()},
    ]
    
    return {
        "summary": {
            "total_staff": total_staff,
            "active_staff": active_staff,
            "inactive_staff": total_staff - active_staff,
            "average_experience": round(avg_experience, 1)
        },
        "category_distribution": category_data,
        "department_distribution": department_data,
        "employment_distribution": employment_data,
        "experience_distribution": experience_ranges
    }
