from sqlalchemy import Column, Integer, String, Float, ForeignKey, Date, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy import DateTime
from app.db.base import Base
import enum
from datetime import date

class BloodGroup(enum.Enum):
    A_POSITIVE = "A+"
    A_NEGATIVE = "A-"
    B_POSITIVE = "B+"
    B_NEGATIVE = "B-"
    O_POSITIVE = "O+"
    O_NEGATIVE = "O-"
    AB_POSITIVE = "AB+"
    AB_NEGATIVE = "AB-"

class Gender(enum.Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"

class Patient(Base):
    __tablename__ = "patients"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    patient_id = Column(String(20), unique=True, index=True)  # Auto-generated like P001
    age = Column(Integer, nullable=False)
    gender = Column(SQLEnum(Gender), nullable=False)
    blood_group = Column(SQLEnum(BloodGroup, name="blood_group",
        values_callable=lambda obj: [e.value for e in obj]  ))
    height = Column(Float)  # in meters
    weight = Column(Float)  # in kg
    bmi = Column(Float)
    bmi_category = Column(String(50))
    emergency_contact = Column(String(20))
    emergency_contact_name = Column(String(100))
    medical_history = Column(Text)
    allergies = Column(Text)
    current_medications = Column(Text)
    insurance_id = Column(String(50))
    insurance_provider = Column(String(100))
    primary_doctor_id = Column(Integer, ForeignKey("doctors.id"))
    registration_date = Column(Date, default=date.today)
    created_at = Column(DateTime, server_default=func.current_timestamp())
    updated_at = Column(DateTime, onupdate=func.current_timestamp())
    
    # Relationships
    user = relationship("User", back_populates="patient_profile") 
    primary_doctor = relationship("Doctor", back_populates="patients")
    
    appointments = relationship("Appointment", back_populates="patient", cascade="all, delete-orphan")
    medical_records = relationship("MedicalRecord", back_populates="patient", cascade="all, delete-orphan")
    prescriptions = relationship("Prescription", back_populates="patient", cascade="all, delete-orphan")
    lab_tests = relationship("LabTest", back_populates="patient", cascade="all, delete-orphan")
    bills = relationship("Billing", back_populates="patient", cascade="all, delete-orphan")
    doctor_reviews = relationship("DoctorReview", back_populates="patient", cascade="all, delete-orphan")
    payment_transactions = relationship("PaymentTransaction", back_populates="patient", cascade="all, delete-orphan")