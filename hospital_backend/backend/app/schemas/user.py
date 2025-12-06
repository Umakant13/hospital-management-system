from typing import Optional
from pydantic import BaseModel, EmailStr, Field, validator
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    ADMIN = "admin"
    DOCTOR = "doctor"
    PATIENT = "patient"
    STAFF = "staff"

class UserBase(BaseModel):
    email: Optional[EmailStr] = None  # Made optional - will be validated based on role
    username: str = Field(..., min_length=3, max_length=50)
    full_name: str = Field(..., min_length=1, max_length=100)
    role: UserRole = UserRole.PATIENT
    phone: Optional[str] = Field(None, pattern="^\\+?[1-9]\\d{1,14}$")
    address: Optional[str] = None
    profile_picture: Optional[str] = None
    
    class Config:
        from_attributes = True

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)
    
    @validator('email')
    def validate_email_for_role(cls, v, values):
        """Email is required for doctors and admins, optional for patients and staff"""
        role = values.get('role')
        if role in [UserRole.DOCTOR, UserRole.ADMIN] and not v:
            raise ValueError('Email is required for doctors and administrators')
        # If email is not provided for patient/staff, generate a dummy one
        if not v and role in [UserRole.PATIENT, UserRole.STAFF]:
            # Will be handled in the endpoint to generate unique email
            return None
        return v
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters')
        if not any(char.isdigit() for char in v):
            raise ValueError('Password must contain at least one digit')
        return v

class UserUpdate(BaseModel):
    email: Optional[str] = None
    username: Optional[str] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    profile_picture: Optional[str] = None

class UserInDB(UserBase):
    id: int
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: Optional[datetime]
    last_login: Optional[datetime]
    
    class Config:
        from_attributes = True

class UserResponse(BaseModel):
    id: int
    email: Optional[str]  # Made optional for patients and staff
    username: str
    full_name: str
    role: UserRole
    phone: Optional[str]
    address: Optional[str]
    profile_picture: Optional[str]
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    doctor_id: Optional[str] = None  # Display ID like "D1024"
    doctor_internal_id: Optional[int] = None  # Internal FK ID like 11
    patient_id: Optional[str] = None  # Display ID
    patient_internal_id: Optional[int] = None  # Internal FK ID

class TokenData(BaseModel):
    user_id: Optional[int] = None
    username: Optional[str] = None
    role: Optional[str] = None

class LoginRequest(BaseModel):
    username: str
    password: str

class GoogleLoginRequest(BaseModel):
    token: str

class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6)
    
    @validator('new_password')
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters')
        if not any(char.isdigit() for char in v):
            raise ValueError('Password must contain at least one digit')
        return v