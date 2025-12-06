from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base

class Department(Base):
    __tablename__ = "departments"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text)
    head_doctor_id = Column(Integer)
    location = Column(String(100))
    phone = Column(String(20))
    email = Column(String(100))
    operating_hours = Column(String(200))
    created_at = Column(DateTime, server_default=func.current_timestamp())
    updated_at = Column(DateTime, server_default=func.current_timestamp(), onupdate=func.current_timestamp())
    
    # Relationships
    doctors = relationship("Doctor", back_populates="department")
    staff_members = relationship("Staff", back_populates="department")