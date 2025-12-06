from sqlalchemy import Column, Integer, String, Float, ForeignKey, Date, Text, Time, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base

class Doctor(Base):
    __tablename__ = "doctors"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    doctor_id = Column(String(20), unique=True, index=True)
    specialization = Column(String(100), nullable=False)
    qualification = Column(String(200), nullable=False)
    experience_years = Column(Integer, default=0)
    license_number = Column(String(50), unique=True, nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"))
    consultation_fee = Column(Float, default=0.0)
    rating = Column(Float, default=0.0)
    total_reviews = Column(Integer, default=0)
    bio = Column(Text)
    available_days = Column(String(100))
    consultation_start_time = Column(Time)
    consultation_end_time = Column(Time)
    max_patients_per_day = Column(Integer, default=20)
    created_at = Column(DateTime, server_default=func.current_timestamp())
    updated_at = Column(DateTime, server_default=func.current_timestamp(), onupdate=func.current_timestamp())
    
    # Relationships
    user = relationship("User", back_populates ="doctor_profile")
    department = relationship("Department", back_populates="doctors")
    patients = relationship("Patient", back_populates="primary_doctor")
    appointments = relationship("Appointment", back_populates="doctor", cascade= "all, delete-orphan")
    prescriptions = relationship("Prescription", back_populates="doctor", cascade= "all, delete-orphan")
    medical_records = relationship("MedicalRecord", back_populates="doctor", cascade="all, delete-orphan")
    lab_tests = relationship("LabTest", back_populates="doctor", cascade="all, delete-orphan")
    reviews = relationship("DoctorReview", back_populates="doctor", cascade="all, delete-orphan")

