from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.db.base import Base

class ConsultationStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class VideoConsultation(Base):
    __tablename__ = "video_consultations"

    id = Column(Integer, primary_key=True, index=True)
    consultation_id = Column(String(50), unique=True, index=True, nullable=False)
    
    # Foreign Keys
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=False)
    
    # Meeting Details
    meeting_url = Column(String(500), nullable=True)
    meeting_id = Column(String(100), nullable=True)
    
    # Status and Timing
    status = Column(SQLEnum(ConsultationStatus), default=ConsultationStatus.SCHEDULED, nullable=False)
    scheduled_time = Column(DateTime, nullable=False)
    started_at = Column(DateTime, nullable=True)
    ended_at = Column(DateTime, nullable=True)
    duration_minutes = Column(Integer, nullable=True)
    
    # Additional Info
    reason = Column(String(500), nullable=True)
    notes = Column(String(1000), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    appointment = relationship("Appointment", backref="video_consultations")
    patient = relationship("Patient", backref="video_consultations")
    doctor = relationship("Doctor", backref="video_consultations")
