from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Float, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base
import enum

class TestStatus(enum.Enum):
    ORDERED = "ordered"
    SAMPLE_COLLECTED = "sample_collected"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class LabTest(Base):
    __tablename__ = "lab_tests"
    
    id = Column(Integer, primary_key=True, index=True)
    test_id = Column(String(20), unique=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.id"))
    test_name = Column(String(100), nullable=False)
    test_type = Column(String(50))
    status = Column(SQLEnum(TestStatus), default=TestStatus.ORDERED)
    ordered_date = Column(DateTime, nullable=False)
    collection_date = Column(DateTime)
    result_date = Column(DateTime)
    results = Column(Text)
    normal_range = Column(Text)
    unit = Column(String(20))
    cost = Column(Float, default=0.0)
    notes = Column(Text)
    report_file = Column(String(255))
    created_at = Column(DateTime, server_default=func.current_timestamp())
    updated_at = Column(DateTime, server_default=func.current_timestamp(), onupdate=func.current_timestamp())
    
    # Relationships
    patient = relationship("Patient", back_populates="lab_tests")
    doctor = relationship("Doctor", back_populates="lab_tests")