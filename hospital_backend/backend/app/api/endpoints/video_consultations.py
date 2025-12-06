from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Any
from datetime import datetime, timedelta
import secrets

from app.api.deps import get_db, get_current_active_user
from app.models.user import User, UserRole
from app.models.video_consultation import VideoConsultation, ConsultationStatus
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.schemas.video_consultation import (
    VideoConsultationCreate,
    VideoConsultationUpdate,
    VideoConsultationResponse,
    VideoConsultationWithDetails,
    VideoConsultationStart,
    VideoConsultationEnd,
    VideoConsultationPatient,
    VideoConsultationDoctor
)

router = APIRouter()

def generate_consultation_id():
    """Generate unique consultation ID"""
    return f"VC{datetime.now().strftime('%Y%m%d')}{secrets.token_hex(4).upper()}"

def generate_jitsi_meeting_url(consultation_id: str):
    """Generate Jitsi Meet URL"""
    # Using Jitsi Meet's free service
    room_name = f"HospitalConsult_{consultation_id}"
    return f"https://meet.jit.si/{room_name}", room_name

@router.post("/", response_model=VideoConsultationResponse, status_code=status.HTTP_201_CREATED)
async def create_video_consultation(
    consultation_in: VideoConsultationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Create new video consultation
    """
    # Verify patient exists
    patient = db.query(Patient).filter(Patient.id == consultation_in.patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    # Verify doctor exists
    doctor = db.query(Doctor).filter(Doctor.id == consultation_in.doctor_id).first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found"
        )

    # Role-based validation
    if current_user.role == UserRole.PATIENT:
        # Patient can only create consultation for themselves
        current_patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        if not current_patient or current_patient.id != consultation_in.patient_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only schedule consultations for yourself"
            )
    elif current_user.role == UserRole.DOCTOR:
        # Doctor can only create consultation for themselves
        current_doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
        if not current_doctor or current_doctor.id != consultation_in.doctor_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only schedule consultations for yourself"
            )
    
    # Generate unique consultation ID
    consultation_id = generate_consultation_id()
    
    # Generate Jitsi meeting URL
    meeting_url, meeting_id = generate_jitsi_meeting_url(consultation_id)
    
    # Create consultation
    db_consultation = VideoConsultation(
        consultation_id=consultation_id,
        patient_id=consultation_in.patient_id,
        doctor_id=consultation_in.doctor_id,
        appointment_id=consultation_in.appointment_id,
        scheduled_time=consultation_in.scheduled_time,
        reason=consultation_in.reason,
        meeting_url=meeting_url,
        meeting_id=meeting_id,
        status=ConsultationStatus.SCHEDULED
    )
    
    db.add(db_consultation)
    db.commit()
    db.refresh(db_consultation)
    
    # Send notifications to patient, doctor, and admins
    try:
        from app.services.notification_service import NotificationService
        from datetime import datetime
        
        # Format scheduled time for notification
        scheduled_dt = consultation_in.scheduled_time
        if isinstance(scheduled_dt, str):
            scheduled_dt = datetime.fromisoformat(scheduled_dt.replace('Z', '+00:00'))
        formatted_time = scheduled_dt.strftime("%B %d, %Y at %I:%M %p")
        
        NotificationService.create_video_consultation_notification(
            db=db,
            patient_id=patient.user_id,
            patient_name=patient.user.full_name or patient.user.username,
            doctor_id=doctor.user_id,
            doctor_name=doctor.user.full_name or doctor.user.username,
            consultation_id=db_consultation.id,
            scheduled_time=formatted_time,
            background_tasks=None
        )
    except Exception as notif_error:
        print(f"⚠️ Failed to send video consultation notification: {notif_error}")
        import traceback
        traceback.print_exc()
    
    return db_consultation

@router.get("/", response_model=List[VideoConsultationWithDetails])
async def get_video_consultations(
    skip: int = 0,
    limit: int = 100,
    status_filter: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get all video consultations (filtered by user role)
    """
    query = db.query(VideoConsultation)
    
    # Filter by role
    if current_user.role == UserRole.PATIENT:
        # Get patient record
        patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        if patient:
            query = query.filter(VideoConsultation.patient_id == patient.id)
    elif current_user.role == UserRole.DOCTOR:
        # Get doctor record
        doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
        if doctor:
            query = query.filter(VideoConsultation.doctor_id == doctor.id)
    
    # Filter by status if provided
    if status_filter:
        query = query.filter(VideoConsultation.status == status_filter)
    
    consultations = query.order_by(VideoConsultation.scheduled_time.desc()).offset(skip).limit(limit).all()
    
    # Enrich with patient and doctor details
    result = []
    for consultation in consultations:
        patient = consultation.patient
        doctor = consultation.doctor
        
        consultation_dict = VideoConsultationResponse.from_orm(consultation).dict()
        consultation_dict['patient'] = VideoConsultationPatient(
            id=patient.id,
            patient_id=patient.patient_id,
            name=patient.user.full_name,
            age=patient.age,
            gender=patient.gender
        )
        consultation_dict['doctor'] = VideoConsultationDoctor(
            id=doctor.id,
            doctor_id=doctor.doctor_id,
            name=doctor.user.full_name,
            specialization=doctor.specialization
        )
        result.append(VideoConsultationWithDetails(**consultation_dict))
    
    return result

@router.get("/{consultation_id}", response_model=VideoConsultationWithDetails)
async def get_video_consultation(
    consultation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get video consultation by ID
    """
    consultation = db.query(VideoConsultation).filter(VideoConsultation.id == consultation_id).first()
    
    if not consultation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video consultation not found"
        )
    
    # Enrich with details
    patient = consultation.patient
    doctor = consultation.doctor
    
    consultation_dict = VideoConsultationResponse.from_orm(consultation).dict()
    consultation_dict['patient'] = VideoConsultationPatient(
        id=patient.id,
        patient_id=patient.patient_id,
        name=patient.user.full_name,
        age=patient.age,
        gender=patient.gender
    )
    consultation_dict['doctor'] = VideoConsultationDoctor(
        id=doctor.id,
        doctor_id=doctor.doctor_id,
        name=doctor.user.full_name,
        specialization=doctor.specialization
    )
    
    return VideoConsultationWithDetails(**consultation_dict)

@router.put("/{consultation_id}/start", response_model=VideoConsultationResponse)
async def start_video_consultation(
    consultation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Start video consultation
    """
    consultation = db.query(VideoConsultation).filter(VideoConsultation.id == consultation_id).first()
    
    if not consultation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video consultation not found"
        )
    
    if consultation.status != ConsultationStatus.SCHEDULED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Consultation is not in scheduled status"
        )
    
    consultation.status = ConsultationStatus.IN_PROGRESS
    consultation.started_at = datetime.utcnow()
    
    db.commit()
    db.refresh(consultation)
    
    return consultation

@router.put("/{consultation_id}/end", response_model=VideoConsultationResponse)
async def end_video_consultation(
    consultation_id: int,
    consultation_end: VideoConsultationEnd,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    End video consultation
    """
    consultation = db.query(VideoConsultation).filter(VideoConsultation.id == consultation_id).first()
    
    if not consultation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video consultation not found"
        )
    
    if consultation.status != ConsultationStatus.IN_PROGRESS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Consultation is not in progress"
        )
    
    consultation.status = ConsultationStatus.COMPLETED
    consultation.ended_at = datetime.utcnow()
    
    # Calculate duration
    if consultation.started_at:
        duration = consultation.ended_at - consultation.started_at
        consultation.duration_minutes = int(duration.total_seconds() / 60)
    
    if consultation_end.notes:
        consultation.notes = consultation_end.notes
    
    db.commit()
    db.refresh(consultation)
    
    return consultation

@router.put("/{consultation_id}", response_model=VideoConsultationResponse)
async def update_video_consultation(
    consultation_id: int,
    consultation_update: VideoConsultationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Update video consultation
    """
    consultation = db.query(VideoConsultation).filter(VideoConsultation.id == consultation_id).first()
    
    if not consultation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video consultation not found"
        )
    
    update_data = consultation_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(consultation, field, value)
    
    db.commit()
    db.refresh(consultation)
    
    return consultation

@router.delete("/{consultation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_video_consultation(
    consultation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> None:
    """
    Cancel video consultation
    """
    consultation = db.query(VideoConsultation).filter(VideoConsultation.id == consultation_id).first()
    
    if not consultation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video consultation not found"
        )
    
    if consultation.status == ConsultationStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot cancel completed consultation"
        )
    
    consultation.status = ConsultationStatus.CANCELLED
    
    db.commit()
    
    return None
