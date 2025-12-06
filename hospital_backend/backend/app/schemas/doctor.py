from typing import Optional, List, Union
from pydantic import BaseModel, Field, validator
from datetime import time, datetime
from decimal import Decimal

class DoctorBase(BaseModel):
    specialization: str = Field(..., min_length=1, max_length=100)
    qualification: str = Field(..., min_length=1, max_length=200)
    experience_years: int = Field(0, ge=0, le=70)
    license_number: str = Field(..., min_length=1, max_length=50)
    department_id: Optional[int] = None
    consultation_fee: float = Field(0.0, ge=0)
    bio: Optional[str] = None
    available_days: Optional[Union[List[str], str]] = None
    consultation_start_time: Optional[time] = None
    consultation_end_time: Optional[time] = None
    max_patients_per_day: int = Field(20, gt=0, le=100)

    class Config:
        from_attributes = True
        
    @validator("available_days", pre=True)
    def split_days(cls, v):
        if isinstance(v, str):
            return [day.strip() for day in v.split(",") if day.strip()]
        return v

    # Convert list → string before saving (optional, if used for create/update)
    def to_db_dict(self):
        data = self.dict(exclude_unset=True)
        if isinstance(data.get("available_days"), list):
            data["available_days"] = ",".join(data["available_days"])
        return data


class DoctorCreate(DoctorBase):
    user_id: Optional[int] = None

class DoctorUpdate(BaseModel):
    specialization: Optional[str] = None
    qualification: Optional[str] = None
    experience_years: Optional[int] = Field(None, ge=0, le=70)
    department_id: Optional[int] = None
    consultation_fee: Optional[float] = Field(None, ge=0)
    bio: Optional[str] = None
    available_days: Optional[List[str]] = None
    consultation_start_time: Optional[time] = None
    consultation_end_time: Optional[time] = None
    max_patients_per_day: Optional[int] = Field(None, gt=0, le=100)

class DoctorInDB(DoctorBase):
    id: int
    user_id: int
    doctor_id: str
    rating: float
    total_reviews: int
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True

class DoctorResponse(BaseModel):
    id: int
    user_id: int
    doctor_id: str
    specialization: str
    qualification: str
    experience_years: int
    license_number: str
    department_id: Optional[int]
    consultation_fee: float
    bio: Optional[str]
    available_days: Optional[str]
    consultation_start_time: Optional[time]
    consultation_end_time: Optional[time]
    max_patients_per_day: int
    rating: float
    total_reviews: int
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class DoctorWithUser(DoctorResponse):
    user: dict
    department: Optional[dict] = None