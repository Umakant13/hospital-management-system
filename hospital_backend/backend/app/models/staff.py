from sqlalchemy import Column, Integer, String, Float, ForeignKey, Date, Enum as SQLEnum, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base
import enum

class StaffCategory(enum.Enum):
    NURSE = "nurse"
    RECEPTIONIST = "receptionist"
    LAB_TECHNICIAN = "lab_technician"
    PHARMACIST = "pharmacist"
    ADMINISTRATOR = "administrator"
    SUPPORT_STAFF = "support_staff"

class EmploymentType(enum.Enum):
    FULL_TIME = "full_time"
    PART_TIME = "part_time"
    CONTRACT = "contract"

class Staff(Base):
    __tablename__ = "staff"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    staff_id = Column(String(20), unique=True, index=True, nullable=False)
    employee_id = Column(String(50), unique=True, index=True, nullable=False)
    category = Column(SQLEnum(StaffCategory), nullable=False)
    position = Column(String(100), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    qualification = Column(String(200))
    joining_date = Column(Date, nullable=False)
    experience_years = Column(Integer, default=0)
    shift_timing = Column(String(50))  # e.g., "9:00 AM - 5:00 PM", "Night Shift"
    salary = Column(Float)
    employment_type = Column(SQLEnum(EmploymentType), default=EmploymentType.FULL_TIME)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.current_timestamp())
    updated_at = Column(DateTime, server_default=func.current_timestamp(), onupdate=func.current_timestamp())
    
    # Relationships
    user = relationship("User", back_populates="staff_profile")
    department = relationship("Department", back_populates="staff_members")
