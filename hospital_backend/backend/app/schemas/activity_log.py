from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class ActivityLogBase(BaseModel):
    action: str
    entity_type: str
    entity_id: Optional[int] = None
    description: Optional[str] = None

class ActivityLogCreate(ActivityLogBase):
    user_id: int
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None

class ActivityLogInDB(ActivityLogBase):
    id: int
    user_id: int
    ip_address: Optional[str]
    user_agent: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

class ActivityLogResponse(ActivityLogInDB):
    pass

class UserShort(BaseModel):
    id: int
    full_name: str
    email: str

    class Config:
        from_attributes = True
class ActivityLogWithUser(ActivityLogResponse):
    user: UserShort