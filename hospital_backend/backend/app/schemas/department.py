from typing import Optional
from pydantic import BaseModel, Field
from datetime import datetime

class DepartmentBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    location: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    operating_hours: Optional[str] = None

class DepartmentCreate(DepartmentBase):
    head_doctor_id: Optional[int] = None

class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    head_doctor_id: Optional[int] = None
    location: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    operating_hours: Optional[str] = None

class DepartmentInDB(DepartmentBase):
    id: int
    head_doctor_id: Optional[int]
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True

class DepartmentResponse(DepartmentInDB):
    pass

class DepartmentWithDoctors(DepartmentResponse):
    doctors_count: int
    head_doctor: Optional[dict] = None