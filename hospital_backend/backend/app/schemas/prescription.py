from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime

class MedicationItem(BaseModel):
    name: str
    dosage: str
    frequency: str
    duration: str
    instructions: Optional[str] = None

class PrescriptionBase(BaseModel):
    patient_id: int
    doctor_id: int
    appointment_id: Optional[int] = None
    medications: List[MedicationItem]
    instructions: Optional[str] = None
    notes: Optional[str] = None
    valid_until: Optional[datetime] = None

class PrescriptionCreate(PrescriptionBase):
    pass

class PrescriptionUpdate(BaseModel):
    medications: Optional[List[MedicationItem]] = None
    instructions: Optional[str] = None
    notes: Optional[str] = None
    valid_until: Optional[datetime] = None

class PrescriptionInDB(BaseModel):
    id: int
    prescription_id: str
    patient_id: int
    doctor_id: int
    appointment_id: Optional[int]
    medications: str  # JSON string
    instructions: Optional[str]
    notes: Optional[str]
    valid_until: Optional[datetime]
    created_at: datetime
    
    class Config:
        from_attributes = True

class PrescriptionResponse(BaseModel):
    id: int
    prescription_id: str
    patient_id: int
    doctor_id: int
    appointment_id: Optional[int]
    medications: List[MedicationItem]
    instructions: Optional[str]
    notes: Optional[str]
    valid_until: Optional[datetime]
    created_at: datetime
    
    class Config:
        from_attributes = True

class PrescriptionWithDetails(PrescriptionResponse):
    patient: dict
    doctor: dict