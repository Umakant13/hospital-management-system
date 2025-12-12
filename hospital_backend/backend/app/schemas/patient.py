from typing import Optional, List
from pydantic import BaseModel, Field, validator, computed_field
from datetime import date, datetime, time
from enum import Enum

from app.schemas.user import UserBase
from app.schemas.department import DepartmentBase

class BloodGroup(str, Enum):
    A_POSITIVE = "A+"
    A_NEGATIVE = "A-"
    B_POSITIVE = "B+"
    B_NEGATIVE = "B-"
    O_POSITIVE = "O+"
    O_NEGATIVE = "O-"
    AB_POSITIVE = "AB+"
    AB_NEGATIVE = "AB-"

class Gender(str, Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"

class PatientBase(BaseModel):
    age: int = Field(..., ge=0, le=150)
    gender: Gender
    blood_group: Optional[BloodGroup] = None
    height: Optional[float] = Field(None, gt=0, le=3)  # in meters
    weight: Optional[float] = Field(None, gt=0, le=500)  # in kg
    emergency_contact: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    medical_history: Optional[str] = None
    allergies: Optional[str] = None
    current_medications: Optional[str] = None
    insurance_id: Optional[str] = None
    insurance_provider: Optional[str] = None
    primary_doctor_id: Optional[int] = None

class PatientCreate(PatientBase):
    user_id: Optional[int] = None
    age: int = Field(18, ge=0, le=150)  # ✅ Default age 18 instead of 0
    gender: Gender = Gender.OTHER  # ✅ Default gender

    
class PatientUpdate(BaseModel):
    age: Optional[int] = Field(None, ge=0, le=150)
    height: Optional[float] = Field(None, gt=0, le=3)
    weight: Optional[float] = Field(None, gt=0, le=500)
    blood_group: Optional[BloodGroup] = None
    emergency_contact: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    medical_history: Optional[str] = None
    allergies: Optional[str] = None
    current_medications: Optional[str] = None
    insurance_id: Optional[str] = None
    insurance_provider: Optional[str] = None
    primary_doctor_id: Optional[int] = None

class PatientInDB(PatientBase):
    id: int
    user_id: int
    patient_id: str
    bmi: Optional[float] = None
    bmi_category: Optional[str] = None
    registration_date: date
    created_at: datetime
    updated_at: Optional[datetime]
    
    @computed_field
    @property
    def calculated_bmi(self) -> Optional[float]:
        if self.height and self.weight:
            return round(self.weight / (self.height ** 2), 2)
        return None
    
    @computed_field
    @property
    def calculated_bmi_category(self) -> Optional[str]:
        if self.calculated_bmi:
            if self.calculated_bmi < 18.5:
                return "Underweight"
            elif self.calculated_bmi < 25:
                return "Normal weight"
            elif self.calculated_bmi < 30:
                return "Overweight"
            else:
                return "Obese"
        return None
    
    class Config:
        from_attributes = True

class PatientResponse(PatientInDB):
    pass

# Nested schema for doctor with user
class DoctorWithUser(BaseModel):
    id: int
    doctor_id: str
    specialization: str
    qualification: Optional[str] = None
    experience_years: Optional[int] = None
    consultation_fee: Optional[float] = None
    rating: Optional[float] = 0.0
    total_reviews: Optional[int] = 0
    bio: Optional[str] = None
    license_number: Optional[str] = None
    available_days: Optional[str] = None
    consultation_start_time: Optional[time] = None
    consultation_end_time: Optional[time] = None
    user: Optional[UserBase] = None
    department: Optional[DepartmentBase] = None
    
    class Config:
        from_attributes = True

class PatientWithUser(PatientResponse):
    user: Optional[UserBase] = None
    primary_doctor: Optional[DoctorWithUser] = None

   
    @computed_field
    @property
    def full_name(self) -> str:
        return self.user.full_name if self.user else "Unknown"
