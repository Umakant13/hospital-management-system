from pydantic import BaseModel, Field
from typing import Optional
from datetime import date
from enum import Enum

class StaffCategory(str, Enum):
    NURSE = "nurse"
    RECEPTIONIST = "receptionist"
    LAB_TECHNICIAN = "lab_technician"
    PHARMACIST = "pharmacist"
    ADMINISTRATOR = "administrator"
    SUPPORT_STAFF = "support_staff"

class EmploymentType(str, Enum):
    FULL_TIME = "full_time"
    PART_TIME = "part_time"
    CONTRACT = "contract"

class StaffBase(BaseModel):
    category: StaffCategory
    position: str
    department_id: Optional[int] = None
    qualification: Optional[str] = None
    joining_date: date
    experience_years: Optional[int] = 0
    shift_timing: Optional[str] = None
    salary: Optional[float] = None
    employment_type: EmploymentType = EmploymentType.FULL_TIME
    is_active: bool = True

class StaffCreate(StaffBase):
    user_id: Optional[int] = None
    employee_id: str

class StaffUpdate(BaseModel):
    category: Optional[StaffCategory] = None
    position: Optional[str] = None
    department_id: Optional[int] = None
    qualification: Optional[str] = None
    joining_date: Optional[date] = None
    experience_years: Optional[int] = None
    shift_timing: Optional[str] = None
    salary: Optional[float] = None
    employment_type: Optional[EmploymentType] = None
    is_active: Optional[bool] = None

class StaffResponse(StaffBase):
    id: int
    user_id: int
    staff_id: str
    employee_id: str

    class Config:
        from_attributes = True

class StaffWithUser(StaffResponse):
    user: Optional[dict] = None
    department: Optional[dict] = None

    class Config:
        from_attributes = True
