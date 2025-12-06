from datetime import timedelta
import secrets
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.api.deps import get_current_active_user, get_db
from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    verify_password,
    get_password_hash,
    verify_token
)
from app.models.user import User
from app.schemas.user import Token, UserCreate, UserResponse, LoginRequest, GoogleLoginRequest, UserRole
from authlib.integrations.starlette_client import OAuth
from starlette.config import Config
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import httpx, secrets


router = APIRouter()

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class GoogleTokenRequest(BaseModel):
    token: str
    mode: str = "login"  # 'login' or 'signup'
    role: str = "patient"  # 'admin', 'doctor', 'patient'

# OAuth setup
config = Config('.env')
oauth = OAuth(config)
oauth.register(
    name='google',
    client_id=settings.GOOGLE_CLIENT_ID,
    client_secret=settings.GOOGLE_CLIENT_SECRET,
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'}
)

@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def signup(
    user_in: UserCreate,
    db: Session = Depends(get_db)
) -> Any:
    """
    Create new user account
    """
    # Check if user exists
    user = db.query(User).filter(
        (User.email == user_in.email) | (User.username == user_in.username)
    ).first()
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email or username already exists"
        )
    
    # Create new user
    db_user = User(
        email=user_in.email,
        username=user_in.username,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=user_in.role,
        phone=user_in.phone,
        address=user_in.address
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user

@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
) -> Any:
    """
    OAuth2 compatible token login
    """
    from app.models.doctor import Doctor
    from app.models.patient import Patient
    
    user = db.query(User).filter(User.username == form_data.username).first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    # Get doctor_id or patient_id if applicable
    doctor_id = None
    doctor_internal_id = None
    patient_id = None
    patient_internal_id = None
    
    if user.role.value == "doctor":
        doctor = db.query(Doctor).filter(Doctor.user_id == user.id).first()
        if doctor:
            doctor_id = doctor.doctor_id  # Display ID like "D1024"
            doctor_internal_id = doctor.id  # Internal ID like 11
    elif user.role.value == "patient":
        patient = db.query(Patient).filter(Patient.user_id == user.id).first()
        if patient:
            patient_id = patient.patient_id  # Display ID
            patient_internal_id = patient.id  # Internal ID
    
    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role.value}
    )
    refresh_token = create_refresh_token(
        data={"sub": str(user.id)}
    )
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "doctor_id": doctor_id,
        "doctor_internal_id": doctor_internal_id,
        "patient_id": patient_id,
        "patient_internal_id": patient_internal_id
    }


@router.post("/login-json", response_model=Token)
async def login_json(
    login_data: LoginRequest,
    db: Session = Depends(get_db)
) -> Any:
    """
    JSON login endpoint (alternative to OAuth2 form login)
    """
    from app.models.doctor import Doctor
    from app.models.patient import Patient
    
    user = db.query(User).filter(User.username == login_data.username).first()
    
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    # Get doctor_id or patient_id if applicable
    doctor_id = None
    doctor_internal_id = None
    patient_id = None
    patient_internal_id = None
    
    if user.role.value == "doctor":
        doctor = db.query(Doctor).filter(Doctor.user_id == user.id).first()
        if doctor:
            doctor_id = doctor.doctor_id  # Display ID like "D1024"
            doctor_internal_id = doctor.id  # Internal ID like 11
    elif user.role.value == "patient":
        patient = db.query(Patient).filter(Patient.user_id == user.id).first()
        if patient:
            patient_id = patient.patient_id  # Display ID
            patient_internal_id = patient.id  # Internal ID
    
    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role.value}
    )
    refresh_token = create_refresh_token(
        data={"sub": str(user.id)}
    )
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "doctor_id": doctor_id,
        "doctor_internal_id": doctor_internal_id,
        "patient_id": patient_id,
        "patient_internal_id": patient_internal_id
    }
    
@router.post("/refresh", response_model=Token)
async def refresh_token(
    token_data: RefreshTokenRequest,  # Changed this line
    db: Session = Depends(get_db)
) -> Any:
    """
    Refresh access token
    """
    payload = verify_token(token_data.refresh_token, token_type="refresh")
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == int(user_id)).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role.value}
    )
    new_refresh_token = create_refresh_token(
        data={"sub": str(user.id)}
    )
    
    return {
        "access_token": access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer"
    }



@router.get("/google/login")
async def google_login():
    """
    Redirect to Google OAuth consent screen
    """
    google_auth_url = (
        "https://accounts.google.com/o/oauth2/v2/auth?"
        f"client_id={settings.GOOGLE_CLIENT_ID}"
        f"&redirect_uri={settings.GOOGLE_REDIRECT_URI}"
        f"&response_type=code"
        f"&scope=openid%20email%20profile"
        f"&access_type=offline"
        f"&prompt=consent"
    )
    return {"url": google_auth_url}


@router.get("/google/callback")
async def google_callback(
    code: str,
    db: Session = Depends(get_db)
):
    """
    Handle Google OAuth callback — verify user and create JWT tokens
    """
    token_url = "https://oauth2.googleapis.com/token"
    token_data = {
        "code": code,
        "client_id": settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "grant_type": "authorization_code"
    }

    headers = {"Content-Type": "application/x-www-form-urlencoded"}

    async with httpx.AsyncClient() as client:
        token_response = await client.post(token_url, data=token_data, headers=headers)
        token_json = token_response.json()

    # Debugging: show Google's response if id_token missing
    if "id_token" not in token_json:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": "Google token exchange failed",
                "response": token_json
            }
        )

    try:
        # Verify Google ID token
        idinfo = id_token.verify_oauth2_token(
            token_json["id_token"],
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID
        )

        email = idinfo.get("email")
        name = idinfo.get("name")
        google_id = idinfo.get("sub")

        if not email:
            raise HTTPException(status_code=400, detail="Email not provided by Google")

        # Check if user already exists
        user = db.query(User).filter(
            (User.email == email) | (User.google_id == google_id)
        ).first()

        if not user:
            # Auto-create a new Patient user
            user = User(
                email=email,
                username=email.split("@")[0],
                full_name=name or "Google User",
                google_id=google_id,
                hashed_password=get_password_hash(secrets.token_urlsafe(32)),
                is_verified=True,
                role=UserRole.PATIENT
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        # Create JWT tokens
        access_token = create_access_token(
            data={"sub": str(user.id), "role": user.role.value}
        )
        refresh_token = create_refresh_token(
            data={"sub": str(user.id)}
        )

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.full_name,
                "role": user.role.value
            }
        }

    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid or expired ID token")


@router.post("/google/callback")
async def google_callback_post(
    request: GoogleTokenRequest,
    db: Session = Depends(get_db)
):
    """
    Handle Google OAuth with credential token (from @react-oauth/google)
    """
    try:
        # Verify Google ID token directly
        idinfo = id_token.verify_oauth2_token(
            request.token,
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID
        )

        email = idinfo.get("email")
        name = idinfo.get("name")
        google_id = idinfo.get("sub")

        if not email:
            raise HTTPException(status_code=400, detail="Email not provided by Google")

        # Check if user already exists
        user = db.query(User).filter(
            (User.email == email) | (User.google_id == google_id)
        ).first()

        # Handle mode: 'login' or 'signup'
        if request.mode == "signup":
            # Signup mode: User must NOT exist
            if user:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Account already exists with this email. Please sign in instead."
                )
            
            # Create new user with requested role
            role_mapping = {
                "admin": UserRole.ADMIN,
                "doctor": UserRole.DOCTOR,
                "patient": UserRole.PATIENT
            }
            user_role = role_mapping.get(request.role, UserRole.PATIENT)
            
            user = User(
                email=email,
                username=email.split("@")[0] + secrets.token_hex(3),  # Ensure unique username
                full_name=name or "Google User",
                google_id=google_id,
                hashed_password=get_password_hash(secrets.token_urlsafe(32)),
                is_verified=True,
                role=user_role
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            # Login mode: User must exist
            if not user:
                raise HTTPException(
                    status_code=404, 
                    detail="No account found with this Google account. Please sign up first."
                )
            
            # Verify role matches
            role_mapping = {
                "admin": UserRole.ADMIN,
                "doctor": UserRole.DOCTOR,
                "patient": UserRole.PATIENT
            }
            expected_role = role_mapping.get(request.role, UserRole.PATIENT)
            
            if user.role.value != expected_role.value:
                raise HTTPException(
                    status_code=403,
                    detail=f"This account is registered as {user.role.value}. Please select the correct role tab."
                )

        # Create JWT tokens
        access_token = create_access_token(
            data={"sub": str(user.id), "role": user.role.value}
        )
        refresh_token_str = create_refresh_token(
            data={"sub": str(user.id)}
        )

        return {
            "access_token": access_token,
            "refresh_token": refresh_token_str,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.full_name,
                "role": user.role.value
            }
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid or expired ID token: {str(e)}")


