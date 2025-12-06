from typing import Optional
from pydantic import BaseModel, Field
from datetime import datetime

class MessageBase(BaseModel):
    receiver_id: int
    subject: Optional[str] = Field(None, max_length=200)
    message: str = Field(..., min_length=1)

class MessageCreate(MessageBase):
    pass

class MessageReply(BaseModel):
    message: str = Field(..., min_length=1)

class MessageInDB(MessageBase):
    id: int
    sender_id: int
    is_read: bool
    is_archived: bool
    parent_message_id: Optional[int]
    attachments: Optional[str]
    created_at: datetime
    read_at: Optional[datetime]
    
    class Config:
        from_attributes = True

class MessageResponse(MessageInDB):
    pass

class MessageWithDetails(MessageResponse):
    sender: dict
    receiver: dict
    replies: Optional[list] = None