from typing import Optional
from pydantic import BaseModel, Field, validator
from datetime import datetime
from enum import Enum

class ConsultationStatus(str, Enum):
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class VideoConsultationBase(BaseModel):
    patient_id: int
    doctor_id: int
    scheduled_time: datetime
    reason: Optional[str] = None
    appointment_id: Optional[int] = None
    
    class Config:
        from_attributes = True

class VideoConsultationCreate(VideoConsultationBase):
    @validator('scheduled_time')
    def validate_scheduled_time(cls, v):
        # Handle both naive and aware datetimes
        now = datetime.now(v.tzinfo) if v.tzinfo else datetime.now()
        if v < now:
            raise ValueError('Scheduled time must be in the future')
        return v

class VideoConsultationUpdate(BaseModel):
    scheduled_time: Optional[datetime] = None
    reason: Optional[str] = None
    status: Optional[ConsultationStatus] = None
    notes: Optional[str] = None
    
class VideoConsultationStart(BaseModel):
    meeting_url: str
    meeting_id: str

class VideoConsultationEnd(BaseModel):
    notes: Optional[str] = None

class VideoConsultationResponse(VideoConsultationBase):
    id: int
    consultation_id: str
    meeting_url: Optional[str] = None
    meeting_id: Optional[str] = None
    status: ConsultationStatus
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class VideoConsultationPatient(BaseModel):
    id: int
    patient_id: str
    name: str
    age: Optional[int] = None
    gender: Optional[str] = None
    
    class Config:
        from_attributes = True

class VideoConsultationDoctor(BaseModel):
    id: int
    doctor_id: str
    name: str
    specialization: Optional[str] = None
    
    class Config:
        from_attributes = True

class VideoConsultationWithDetails(VideoConsultationResponse):
    patient: VideoConsultationPatient
    doctor: VideoConsultationDoctor
