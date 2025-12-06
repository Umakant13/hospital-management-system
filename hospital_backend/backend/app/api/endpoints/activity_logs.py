from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, Request, status, Query
from sqlalchemy.orm import Session
from app.api.deps import get_current_user, get_db, get_current_admin
from app.models.activity_log import ActivityLog
from app.schemas.activity_log import ActivityLogResponse, ActivityLogWithUser, UserShort
from app.models.user import User
from sqlalchemy import func
from app.utils.logger import log_activity
from app.models.medical_record import MedicalRecord
from app.models import user
from app.models import appointment

router = APIRouter()

@router.get("/", response_model=List[ActivityLogWithUser])
async def get_activity_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    user_id: int = Query(None),
    action: str = Query(None),
    entity_type: str = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    query = db.query(ActivityLog)

    if user_id:
        query = query.filter(ActivityLog.user_id == user_id)

    if action:
        query = query.filter(ActivityLog.action == action)

    if entity_type:
        query = query.filter(ActivityLog.entity_type == entity_type)

    logs = query.order_by(
        ActivityLog.created_at.desc()
    ).offset(skip).limit(limit).all()

    result = []
    for log in logs:
        user = db.query(User).filter(User.id == log.user_id).first()

        result.append(
            ActivityLogWithUser(
                id=log.id,
                user_id=log.user_id,
                action=log.action,
                entity_type=log.entity_type,
                entity_id=log.entity_id,
                description=log.description,
                ip_address=log.ip_address,
                user_agent=log.user_agent,
                created_at=log.created_at,
                user=UserShort(
                    id=user.id,
                    full_name=user.full_name,
                    email=user.email
                )
            )
        )

    return result

@router.get("/user/{user_id}", response_model= list[ActivityLogResponse])
async def get_user_activity_logs(
    user_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
) -> Any:
    """
    Get activity logs for a specific user (Admin only)
    """
    logs = db.query(ActivityLog).filter(
        ActivityLog.user_id == user_id
    ).order_by(ActivityLog.created_at.desc()).offset(skip).limit(limit).all()
    
    return logs

@router.get("/stats")
async def get_activity_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
) -> Any:
    """
    Get activity statistics (Admin only)
    """
    from datetime import datetime, timedelta
    
    # Last 24 hours
    yesterday = datetime.now() - timedelta(days=1)
    recent_activities = db.query(ActivityLog).filter(
        ActivityLog.created_at >= yesterday
    ).count()
    
    # Group by action
    actions = db.query(ActivityLog.action, func.count(ActivityLog.id)).group_by(ActivityLog.action).all()
    action_breakdown = {action: count for action, count in actions}
    
    # Group by entity_type
    entities = db.query(ActivityLog.entity_type, func.count(ActivityLog.id)).group_by(ActivityLog.entity_type).all()
    entity_breakdown = {entity: count for entity, count in entities}
    
    return {
        "recent_activities_24h": recent_activities,
        "action_breakdown": action_breakdown,
        "entity_breakdown": entity_breakdown
    }
    