from sqlalchemy.orm import Session
from app.models.activity_log import ActivityLog
from app.models.user import User
from fastapi import Request
from typing import Optional

def log_activity(
    db: Session,
    user_id: int,
    action: str,
    entity_type: str,
    entity_id: Optional[int] = None,
    description: Optional[str] = None,
    request: Optional[Request] = None
):
    """
    Log user activity
    """
    ip_address = None
    user_agent = None
    
    if request:
        ip_address = request.client.host
        user_agent = request.headers.get("user-agent")
    
    activity_log = ActivityLog(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        description=description,
        ip_address=ip_address,
        user_agent=user_agent
    )
    
    db.add(activity_log)
    db.commit()