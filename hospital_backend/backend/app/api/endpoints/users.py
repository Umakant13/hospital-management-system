
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.api.deps import get_db, get_current_active_user, get_current_admin
from app.models.user import User, UserRole
from app.core.security import get_password_hash, verify_password
from app.schemas.user import UserCreate, UserResponse, UserUpdate, PasswordChange
from app.models.doctor import Doctor
from datetime import date
import uuid
from app.models.patient import Patient
from app.models.staff import Staff, StaffCategory, EmploymentType
from app.services.notification_service import NotificationService

router = APIRouter()

@router.get("/me", response_model=UserResponse)
async def get_current_user_me(
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get current user info
    """
    return current_user

@router.get("/", response_model=List[UserResponse])
async def get_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    role: str = Query(None),
    search: str = Query(None),
    status: str = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
) -> Any:
    """
    Get all users (Admin only)
    """
    query = db.query(User)
    
    if role:
        query = query.filter(User.role == role)
    
    if status:
        is_active = True if status.lower() == 'active' else False
        query = query.filter(User.is_active == is_active)
    
    if search:
        query = query.filter(
            (User.full_name.contains(search)) |
            (User.email.contains(search)) |
            (User.username.contains(search))
        )
    
    users = query.offset(skip).limit(limit).all()
    return users

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get specific user by ID
    """
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Users can only view their own profile unless they're admin
    if current_user.role != UserRole.ADMIN and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    return user

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_in: UserCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
) -> Any:
    """
    Create new user (Admin only)
    """
    try:
        # Generate email if not provided (for patients and staff)
        email_to_use = user_in.email
        if not email_to_use and user_in.role in [UserRole.PATIENT, UserRole.STAFF]:
            # Generate unique dummy email
            unique_id = uuid.uuid4().hex[:8]
            role_prefix = "patient" if user_in.role == UserRole.PATIENT else "staff"
            email_to_use = f"{role_prefix}_{user_in.username}_{unique_id}@noemail.local"
            print(f"📧 Generated dummy email for {user_in.role.value}: {email_to_use}")
        
        # Check if user exists
        existing = db.query(User).filter(
            (User.email == email_to_use) | (User.username == user_in.username)
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email or username already exists"
            )

        # Create user
        db_user = User(
            email=email_to_use,
            username=user_in.username,
            hashed_password=get_password_hash(user_in.password),
            full_name=user_in.full_name,
            role=user_in.role,
            phone=user_in.phone,
            address=user_in.address,
            is_active=True,
            is_verified=False
        )
        
        db.add(db_user)
        db.flush()  # ✅ Get the user ID
        
        print(f"✅ User created with ID: {db_user.id}, Role: {user_in.role}")  # Debug

        # Create linked record based on role
        if user_in.role == UserRole.DOCTOR:
            print(f"🔄 Creating doctor record for user_id: {db_user.id}")  # Debug
            
            new_doctor = Doctor(
                user_id=db_user.id,
                doctor_id=f"D{1000 + db_user.id}",  # ✅ Format: D1001, D1002, etc.
                specialization="General",
                qualification="MBBS",
                experience_years=0,
                license_number=f"LIC{db_user.id:05d}{uuid.uuid4().hex[:4].upper()}",
                consultation_fee=0.0,
                rating=0.0,
                total_reviews=0
            )
            db.add(new_doctor)
            print(f"✅ Doctor record added to session")  # Debug
        
        elif user_in.role == UserRole.PATIENT:
            print(f"🔄 Creating patient record for user_id: {db_user.id}")  # Debug
            
            new_patient = Patient(
                user_id=db_user.id,
                patient_id=f"P{1000 + db_user.id}",  # ✅ Format: P1001, P1002, etc.
                age=18,
                gender="other",
                blood_group=None,
                registration_date=date.today()
            )
            db.add(new_patient)
            print(f"✅ Patient record added to session")  # Debug
        
        elif user_in.role == UserRole.STAFF:
            print(f"🔄 Creating staff record for user_id: {db_user.id}")  # Debug
            
            new_staff = Staff(
                user_id=db_user.id,
                staff_id=f"S{1000 + db_user.id}",  # ✅ Format: S1001, S1002, etc.
                employee_id=f"EMP{db_user.id:05d}",  # ✅ Format: EMP00001
                category=StaffCategory.SUPPORT_STAFF,  # Default category (using enum)
                position="Staff Member",  # Default position
                joining_date=date.today(),
                experience_years=0,
                employment_type=EmploymentType.FULL_TIME,  # Using enum
                is_active=True
            )
            db.add(new_staff)
            print(f"✅ Staff record added to session")  # Debug

        # ✅ Commit everything together
        db.commit()
        db.refresh(db_user)
        
        print(f"✅ All records committed successfully")  # Debug
        
        # Verify doctor was created
        if user_in.role == UserRole.DOCTOR:
            verify = db.query(Doctor).filter(Doctor.user_id == db_user.id).first()
            if verify:
                print(f"✅ Verified: Doctor record exists with doctor_id: {verify.doctor_id}")
            else:
                print(f"❌ ERROR: Doctor record NOT found in database!")
        
        # Verify patient was created
        elif user_in.role == UserRole.PATIENT:
            verify = db.query(Patient).filter(Patient.user_id == db_user.id).first()
            if verify:
                print(f"✅ Verified: Patient record exists with patient_id: {verify.patient_id}")
            else:
                print(f"❌ ERROR: Patient record NOT found in database!")
        
        # Verify staff was created
        elif user_in.role == UserRole.STAFF:
            verify = db.query(Staff).filter(Staff.user_id == db_user.id).first()
            if verify:
                print(f"✅ Verified: Staff record exists with staff_id: {verify.staff_id}")
            else:
                print(f"❌ ERROR: Staff record NOT found in database!")
        
        # Send notification to admins about new user
        try:
            NotificationService.create_user_notification(
                db=db,
                new_user_id=db_user.id,
                new_user_name=db_user.full_name or db_user.username,
                new_user_role=user_in.role.value
            )
        except Exception as notif_error:
            db.rollback()
            print(f"⚠️ Failed to send notification: {notif_error}")
            # Don't fail user creation if notification fails

        return db_user
    
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        print(f"❌ Error in create_user: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create user: {str(e)}"
        )
        
@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Update user information
    """
    # Users can only update their own profile unless they're admin
    if current_user.role != UserRole.ADMIN and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    update_data = user_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    
    db.commit()
    db.refresh(user)
    
    return user

@router.delete("/{user_id}", status_code=status.HTTP_200_OK)
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Delete user and all related records (Admin only)
    """
    if current_user.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete yourself"
        )

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    try:
        db.delete(user)
        db.commit()
        return {"message": f"User (ID: {user_id}) and all related data deleted successfully."}
    except IntegrityError as e:
        db.rollback()
        # Check if it's a foreign key constraint error
        if "foreign key constraint" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete user because they have related records (appointments, prescriptions, messages, etc.). Please delete those records first."
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error deleting user: {str(e)}"
            )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting user: {str(e)}"
        )

@router.post("/change-password")
async def change_password(
    password_data: PasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Change user password
    """
    if not verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect password"
        )
    
    current_user.hashed_password = get_password_hash(password_data.new_password)
    db.commit()
    
    return {"message": "Password changed successfully"}

@router.post("/{user_id}/activate")
async def activate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
) -> Any:
    """
    Activate user account (Admin only)
    """
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.is_active = True
    db.commit()
    
    return {"message": "User activated successfully"}

@router.post("/{user_id}/deactivate")
async def deactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
) -> Any:
    """
    Deactivate user account (Admin only)
    """
    if current_user.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate yourself"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.is_active = False
    db.commit()
    
    return {"message": "User deactivated successfully"}