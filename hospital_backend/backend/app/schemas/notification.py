from typing import Optional
from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum

class NotificationType(str, Enum):
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

class NotificationBase(BaseModel):
    title: str = Field(..., max_length=200)
    message: str = Field(..., min_length=1)
    type: NotificationType
    action_url: Optional[str] = None

class NotificationCreate(NotificationBase):
    user_id: int

class NotificationInDB(NotificationBase):
    id: int
    user_id: int
    is_read: bool
    created_at: datetime
    read_at: Optional[datetime]
    
    class Config:
        from_attributes = True

class NotificationResponse(NotificationInDB):
    pass