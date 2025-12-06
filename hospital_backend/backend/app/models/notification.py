from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Boolean, Enum as SQLEnum
from sqlalchemy.sql import func
from app.db.base import Base
import enum

class NotificationType(enum.Enum):
    """
    Notification types supported by the database.
    All 10 values are now allowed in the database enum column.
    """
    APPOINTMENT = "appointment"
    MESSAGE = "message"
    SYSTEM = "system"
    REMINDER = "reminder"
    ALERT = "alert"
    INFO = "info"
    PRESCRIPTION = "prescription"
    MEDICAL_RECORD = "medical_record"
    LAB_TEST = "lab_test"
    USER_CREATED = "user_created"

class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    # Use String column with the enum values, letting database handle validation
    # This prevents SQLAlchemy from caching enum values
    type = Column(
        SQLEnum(
            'appointment', 'message', 'system', 'reminder', 'alert', 'info',
            'prescription', 'medical_record', 'lab_test', 'user_created',
            name='notificationtype',
            native_enum=True,
            validate_strings=True,
            length=20
        ),
        nullable=False
    )
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    action_url = Column(String(255))
    created_at = Column(DateTime, server_default=func.current_timestamp())
    read_at = Column(DateTime, server_default=func.current_timestamp(), onupdate=func.current_timestamp())
