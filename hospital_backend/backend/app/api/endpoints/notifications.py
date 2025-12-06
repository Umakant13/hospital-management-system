from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_active_user
from app.models.notification import Notification, NotificationType
from app.models.user import User
from app.schemas.notification import (
    NotificationCreate,
    NotificationResponse
)
from datetime import datetime
from app.core.websocket import send_notification_to_user

router = APIRouter()

@router.post("/", response_model=NotificationResponse, status_code=status.HTTP_201_CREATED)
async def create_notification(
    notification_in: NotificationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Create new notification (Admin only for system notifications)
    """
    db_notification = Notification(**notification_in.dict())
    db.add(db_notification)
    db.commit()
    db.refresh(db_notification)
    
    # Send real-time notification via WebSocket
    await send_notification_to_user(
        notification_in.user_id,
        {
            "id": db_notification.id,
            "type": db_notification.type.value,
            "title": db_notification.title,
            "message": db_notification.message,
            "action_url": db_notification.action_url,
            "created_at": db_notification.created_at.isoformat(),
        }
    )
    
    return db_notification

@router.get("/", response_model=List[NotificationResponse])
async def get_notifications(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    unread_only: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get user notifications
    """
    query = db.query(Notification).filter(Notification.user_id == current_user.id)
    
    if unread_only:
        query = query.filter(Notification.is_read == False)
    
    notifications = query.order_by(Notification.created_at.desc()).offset(skip).limit(limit).all()
    
    return notifications

@router.get("/unread-count")
async def get_unread_notification_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get count of unread notifications
    """
    count = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).count()
    
    return {"unread_count": count}

@router.put("/{notification_id}/read")
async def mark_notification_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Mark notification as read by deleting it (mobile-like behavior)
    """
    notification = db.query(Notification).filter(Notification.id == notification_id).first()
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    if notification.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Delete the notification instead of marking as read
    db.delete(notification)
    db.commit()
    
    return {"message": "Notification marked as read and removed"}

@router.put("/mark-all-read")
async def mark_all_notifications_as_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Mark all notifications as read by deleting them (mobile-like behavior)
    """
    notifications = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).all()
    
    count = len(notifications)
    
    # Delete all unread notifications
    for notification in notifications:
        db.delete(notification)
    
    db.commit()
    
    return {"message": f"{count} notifications marked as read and removed"}

@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> None:
    """
    Delete notification
    """
    notification = db.query(Notification).filter(Notification.id == notification_id).first()
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    if notification.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    db.delete(notification)
    db.commit()

# Helper function to create and send notification
async def create_and_send_notification(
    db: Session,
    user_id: int,
    notification_type: NotificationType,
    title: str,
    message: str,
    action_url: str = None
):
    """
    Helper function to create and send notification in one go
    """
    db_notification = Notification(
        user_id=user_id,
        type=notification_type,
        title=title,
        message=message,
        action_url=action_url
    )
    db.add(db_notification)
    db.commit()
    db.refresh(db_notification)
    
    # Send via WebSocket
    await send_notification_to_user(
        user_id,
        {
            "id": db_notification.id,
            "type": db_notification.type.value,
            "title": db_notification.title,
            "message": db_notification.message,
            "action_url": db_notification.action_url,
            "created_at": db_notification.created_at.isoformat(),
        }
    )
    
    return db_notification