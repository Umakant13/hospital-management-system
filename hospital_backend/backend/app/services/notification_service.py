from sqlalchemy.orm import Session
from app.models.notification import Notification, NotificationType
from app.models.user import User, UserRole
from typing import List
from app.core.websocket import send_notification_to_user

from fastapi import BackgroundTasks

class NotificationService:
    
    @staticmethod
    def create_notification(
        db: Session,
        user_id: int,
        notification_type: NotificationType,
        title: str,
        message: str,
        action_url: str = None,
        background_tasks: BackgroundTasks = None
    ):
        """
        Create a new notification
        """
        try:
            print(f"📝 create_notification: Starting for user_id={user_id}, type={notification_type.value}")
            
            notification = Notification(
                user_id=user_id,
                type=notification_type.value,  # Pass the string value, not the enum
                title=title,
                message=message,
                action_url=action_url
            )
            print(f"📝 create_notification: Notification object created")
            
            db.add(notification)
            print(f"📝 create_notification: Added to session")
            
            db.commit()
            print(f"📝 create_notification: Committed to database")
            
            db.refresh(notification)
            print(f"✅ Notification saved to DB: ID={notification.id}, User={user_id}, Type={notification_type.value}")
            
            # Send real-time notification
            notification_data = {
                "id": notification.id,
                "type": notification.type,  # Already a string, no need for .value
                "title": notification.title,
                "message": notification.message,
                "action_url": notification.action_url,
                "created_at": notification.created_at.isoformat(),
            }
            
            print(f"🔔 Attempting to send notification to user {user_id}: {notification.title}")
            if background_tasks:
                print(f"   -> Adding to background tasks for user {user_id}")
                background_tasks.add_task(send_notification_to_user, user_id, notification_data)
            else:
                # Fallback to asyncio.create_task if no background_tasks provided
                try:
                    import asyncio
                    print(f"   -> Using asyncio.create_task for user {user_id}")
                    asyncio.create_task(send_notification_to_user(user_id, notification_data))
                except Exception as e:
                    print(f"⚠️ WebSocket notification failed: {e}")
            
            return notification
            
        except Exception as e:
            print(f"❌ FAILED to save notification to DB!")
            print(f"   Error type: {type(e).__name__}")
            print(f"   Error message: {str(e)}")
            print(f"   User ID: {user_id}")
            print(f"   Notification Type: {notification_type}")
            print(f"   Title: {title}")
            db.rollback()
            import traceback
            traceback.print_exc()
            return None
    
    @staticmethod
    def get_all_admin_ids(db: Session) -> List[int]:
        """
        Get all admin user IDs
        """
        admins = db.query(User.id).filter(User.role == UserRole.ADMIN).all()
        return [admin.id for admin in admins]
    
    @staticmethod
    def notify_admins(
        db: Session,
        notification_type: NotificationType,
        title: str,
        message: str,
        action_url: str = None,
        background_tasks: BackgroundTasks = None
    ):
        """
        Send notification to all admins
        """
        admin_ids = NotificationService.get_all_admin_ids(db)
        for admin_id in admin_ids:
            NotificationService.create_notification(
                db=db,
                user_id=admin_id,
                notification_type=notification_type,
                title=title,
                message=message,
                action_url=action_url,
                background_tasks=background_tasks
            )
    
    @staticmethod
    def create_user_notification(
        db: Session,
        new_user_id: int,
        new_user_name: str,
        new_user_role: str,
        background_tasks: BackgroundTasks = None
    ):
        """
        Notify admins when a new user is created
        """
        NotificationService.notify_admins(
            db=db,
            notification_type=NotificationType.USER_CREATED,
            title="New User Added",
            message=f"New {new_user_role} user '{new_user_name}' has been added to the system.",
            action_url="/admin/users",
            background_tasks=background_tasks
        )
    
    @staticmethod
    def create_appointment_notification(
        db: Session,
        patient_id: int,
        patient_name: str,
        doctor_id: int,
        doctor_name: str,
        appointment_id: int,
        appointment_date: str,
        background_tasks: BackgroundTasks = None
    ):
        """
        Create notifications for new appointment
        """
        # Notify patient
        NotificationService.create_notification(
            db=db,
            user_id=patient_id,
            notification_type=NotificationType.APPOINTMENT,
            title="Appointment Confirmed",
            message=f"Your appointment with {doctor_name} has been confirmed for {appointment_date}",
            action_url="/patient/appointments",
            background_tasks=background_tasks
        )
        
        # Notify doctor
        NotificationService.create_notification(
            db=db,
            user_id=doctor_id,
            notification_type=NotificationType.APPOINTMENT,
            title="New Appointment",
            message=f"New appointment with {patient_name} scheduled for {appointment_date}",
            action_url="/doctor/appointments",
            background_tasks=background_tasks
        )
        
        # Notify admins
        NotificationService.notify_admins(
            db=db,
            notification_type=NotificationType.APPOINTMENT,
            title="New Appointment Created",
            message=f"Appointment between {patient_name} and {doctor_name} on {appointment_date}",
            action_url="/admin/appointments",
            background_tasks=background_tasks
        )
    
    @staticmethod
    def create_medical_record_notification(
        db: Session,
        patient_id: int,
        patient_name: str,
        doctor_id: int,
        doctor_name: str,
        record_id: int,
        diagnosis: str,
        background_tasks: BackgroundTasks = None
    ):
        """
        Notify relevant parties about new medical record
        """
        # Notify patient
        NotificationService.create_notification(
            db=db,
            user_id=patient_id,
            notification_type=NotificationType.MEDICAL_RECORD,
            title="New Medical Record",
            message=f"{doctor_name} has added a new medical record for you.",
            action_url="/patient/medical-records",
            background_tasks=background_tasks
        )
        
        # Notify doctor (confirmation)
        NotificationService.create_notification(
            db=db,
            user_id=doctor_id,
            notification_type=NotificationType.MEDICAL_RECORD,
            title="Medical Record Created",
            message=f"Medical record for {patient_name} has been saved successfully.",
            action_url="/doctor/medical-records",
            background_tasks=background_tasks
        )
        
        # Notify admins
        NotificationService.notify_admins(
            db=db,
            notification_type=NotificationType.MEDICAL_RECORD,
            title="New Medical Record",
            message=f"{doctor_name} created a medical record for {patient_name}: {diagnosis[:50]}...",
            action_url="/admin/medical-records",
            background_tasks=background_tasks
        )

    @staticmethod
    def create_lab_test_notification(
        db: Session,
        patient_id: int,
        patient_name: str,
        doctor_id: int,
        doctor_name: str,
        test_id: int,
        test_name: str,
        background_tasks: BackgroundTasks = None
    ):
        """
        Notify about new lab test
        """
        # Notify patient
        NotificationService.create_notification(
            db=db,
            user_id=patient_id,
            notification_type=NotificationType.LAB_TEST,
            title="New Lab Test Ordered",
            message=f"{doctor_name} has ordered a {test_name} test for you.",
            action_url="/patient/lab-tests",
            background_tasks=background_tasks
        )
        
        # Notify doctor
        NotificationService.create_notification(
            db=db,
            user_id=doctor_id,
            notification_type=NotificationType.LAB_TEST,
            title="Lab Test Ordered",
            message=f"Lab test {test_name} ordered for {patient_name}.",
            action_url="/doctor/lab-tests",
            background_tasks=background_tasks
        )
        
        # Notify admins
        NotificationService.notify_admins(
            db=db,
            notification_type=NotificationType.LAB_TEST,
            title="New Lab Test Order",
            message=f"{doctor_name} ordered {test_name} for {patient_name}",
            action_url="/admin/lab-tests",
            background_tasks=background_tasks
        )

    @staticmethod
    def create_prescription_notification(
        db: Session,
        patient_id: int,
        patient_name: str,
        doctor_id: int,
        doctor_name: str,
        prescription_id: int,
        medication_name: str,
        background_tasks: BackgroundTasks = None
    ):
        """
        Notify about new prescription
        """
        print(f"🔔 NotificationService: create_prescription_notification called")
        print(f"   Patient ID: {patient_id}, Doctor ID: {doctor_id}")
        
        # Notify patient
        NotificationService.create_notification(
            db=db,
            user_id=patient_id,
            notification_type=NotificationType.PRESCRIPTION,
            title="New Prescription",
            message=f"{doctor_name} has prescribed {medication_name} for you.",
            action_url="/patient/prescriptions",
            background_tasks=background_tasks
        )
        
        # Notify doctor
        NotificationService.create_notification(
            db=db,
            user_id=doctor_id,
            notification_type=NotificationType.PRESCRIPTION,
            title="Prescription Created",
            message=f"Prescription for {patient_name} created successfully.",
            action_url="/doctor/prescriptions",
            background_tasks=background_tasks
        )
        
        # Notify admins
        NotificationService.notify_admins(
            db=db,
            notification_type=NotificationType.PRESCRIPTION,
            title="New Prescription Issued",
            message=f"{doctor_name} issued prescription for {patient_name}",
            action_url="/admin/prescriptions",
            background_tasks=background_tasks
        )

    @staticmethod
    def create_video_consultation_notification(
        db: Session,
        patient_id: int,
        patient_name: str,
        doctor_id: int,
        doctor_name: str,
        consultation_id: int,
        scheduled_time: str,
        background_tasks: BackgroundTasks = None
    ):
        """
        Notify about new video consultation scheduled
        """
        # Notify patient
        NotificationService.create_notification(
            db=db,
            user_id=patient_id,
            notification_type=NotificationType.APPOINTMENT,
            title="Video Consultation Scheduled",
            message=f"{doctor_name} has scheduled a video consultation with you on {scheduled_time}",
            action_url="/patient/video-consultation",
            background_tasks=background_tasks
        )
        
        # Notify doctor (confirmation)
        NotificationService.create_notification(
            db=db,
            user_id=doctor_id,
            notification_type=NotificationType.APPOINTMENT,
            title="Video Consultation Scheduled",
            message=f"Video consultation with {patient_name} scheduled for {scheduled_time}",
            action_url="/doctor/video-consultations",
            background_tasks=background_tasks
        )