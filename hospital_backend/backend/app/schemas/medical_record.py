from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime

class MedicalRecordBase(BaseModel):
    patient_id: int
    doctor_id: Optional[int] = None
    appointment_id: Optional[int] = None
    record_date: datetime
    chief_complaint: Optional[str] = None
    present_illness: Optional[str] = None
    past_medical_history: Optional[str] = None
    family_history: Optional[str] = None
    social_history: Optional[str] = None
    blood_pressure: Optional[str] = None
    heart_rate: Optional[int] = Field(None, ge=30, le=250)
    temperature: Optional[float] = Field(None, ge=80.0, le=120.0)
    respiratory_rate: Optional[int] = Field(None, ge=8, le=120)
    oxygen_saturation: Optional[int] = Field(None, ge=0, le=100)
    physical_examination: Optional[str] = None
    assessment: Optional[str] = None
    plan: Optional[str] = None

class MedicalRecordCreate(MedicalRecordBase):
    attachments: Optional[List[str]] = None

class MedicalRecordUpdate(BaseModel):
    record_date: Optional[datetime] = None
    chief_complaint: Optional[str] = None
    present_illness: Optional[str] = None
    past_medical_history: Optional[str] = None
    family_history: Optional[str] = None
    social_history: Optional[str] = None
    blood_pressure: Optional[str] = None
    heart_rate: Optional[int] = None
    temperature: Optional[float] = None
    respiratory_rate: Optional[int] = None
    oxygen_saturation: Optional[int] = None
    physical_examination: Optional[str] = None
    assessment: Optional[str] = None
    plan: Optional[str] = None
    attachments: Optional[List[str]] = None

class MedicalRecordInDB(MedicalRecordBase):
    id: int
    record_id: str
    vital_signs: Optional[Dict[str, Any]]
    attachments: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True

class MedicalRecordResponse(MedicalRecordInDB):
    pass

class MedicalRecordWithDetails(MedicalRecordResponse):
    patient: dict
    doctor: Optional[dict] = None