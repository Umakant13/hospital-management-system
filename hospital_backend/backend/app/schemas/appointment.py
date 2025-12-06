from typing import Optional
from pydantic import BaseModel, Field, validator
from datetime import datetime
from enum import Enum

class AppointmentStatus(str, Enum):
    SCHEDULED = "scheduled"
    CONFIRMED = "confirmed"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"

class AppointmentType(str, Enum):
    CONSULTATION = "consultation"
    FOLLOW_UP = "follow_up"
    EMERGENCY = "emergency"
    ROUTINE_CHECKUP = "routine_checkup"
    VACCINATION = "vaccination"

class AppointmentBase(BaseModel):
    patient_id: int
    doctor_id: int
    appointment_date: datetime
    appointment_type: AppointmentType = AppointmentType.CONSULTATION
    reason: Optional[str] = None
    symptoms: Optional[str] = None
    
    class Config:
        from_attributes = True

class AppointmentCreate(AppointmentBase):
    @validator('appointment_date')
    def validate_appointment_date(cls, v):
        if v < datetime.now():
            raise ValueError('Appointment date must be in the future')
        return v

class AppointmentUpdate(BaseModel):
    patient_id: Optional[int] = None
    doctor_id: Optional[int] = None
    appointment_date: Optional[datetime] = None
    appointment_type: Optional[AppointmentType] = None
    reason: Optional[str] = None
    symptoms: Optional[str] = None
    status: Optional[AppointmentStatus] = None
    diagnosis: Optional[str] = None
    treatment_notes: Optional[str] = None
    follow_up_required: Optional[str] = None
    follow_up_date: Optional[datetime] = None

class AppointmentCancel(BaseModel):
    cancelled_reason: str

class AppointmentInDB(AppointmentBase):
    id: int
    appointment_id: str
    status: AppointmentStatus
    diagnosis: Optional[str] = None
    treatment_notes: Optional[str] = None
    follow_up_required: Optional[str] = None
    follow_up_date: Optional[datetime] = None
    cancelled_reason: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True

class AppointmentResponse(AppointmentInDB):
    pass


class AppointmentPatient(BaseModel):
    id: int
    patient_id: str
    name: str
    age: Optional[int] = None
    gender: Optional[str] = None
    phone: Optional[str] = None

    class Config:
        from_attributes = True


class AppointmentDoctor(BaseModel):
    id: int
    doctor_id: str
    name: str
    specialization: Optional[str] = None
    phone: Optional[str] = None

    class Config:
        from_attributes = True


class AppointmentWithDetails(AppointmentResponse):
    patient: AppointmentPatient
    doctor: AppointmentDoctor

# class AppointmentWithDetails(AppointmentResponse):
#     patient: dict
#     doctor: dict