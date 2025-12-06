from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_active_user
from app.models.user import User
from app.services.notification_service import NotificationService
from app.models.notification import NotificationType

router = APIRouter()

@router.post("/test-notification")
async def test_notification(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Test endpoint to manually trigger a notification for the current user
    """
    print(f"🧪 TEST: Creating test notification for user {current_user.id}")
    
    try:
        NotificationService.create_notification(
            db=db,
            user_id=current_user.id,
            notification_type=NotificationType.APPOINTMENT,
            title="Test Notification",
            message=f"This is a test notification for {current_user.full_name or current_user.username}",
            action_url="/patient/appointments",
            background_tasks=background_tasks
        )
        
        print(f"✅ TEST: Notification created successfully for user {current_user.id}")
        
        return {
            "success": True,
            "message": f"Test notification sent to user {current_user.id}",
            "user_id": current_user.id,
            "username": current_user.username
        }
    except Exception as e:
        print(f"❌ TEST: Error creating notification: {e}")
        return {
            "success": False,
            "error": str(e)
        }
