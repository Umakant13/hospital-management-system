from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text
from sqlalchemy.sql import func
from app.db.base import Base
from sqlalchemy.orm import relationship

class ActivityLog(Base):
    __tablename__ = "activity_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String(50), nullable=False)  # CREATE, READ, UPDATE, DELETE
    entity_type = Column(String(50), nullable=False)  # patient, doctor, appointment, etc.
    entity_id = Column(Integer)
    description = Column(Text)
    ip_address = Column(String(50))
    user_agent = Column(String(255))
    created_at = Column(DateTime, server_default=func.current_timestamp())
    
