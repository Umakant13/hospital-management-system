from typing import Generator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.security import verify_token
from app.db.session import SessionLocal
from app.models.user import User, UserRole
from app.schemas.user import TokenData

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

def get_db() -> Generator:
    try:
        db = SessionLocal()
        yield db
    finally:
        db.close()

async def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = verify_token(token)
        if payload is None:
            print("❌ Token verification failed - invalid token")
            raise credentials_exception
        
        user_id: int = payload.get("sub")
        if user_id is None:
            print("❌ No user_id in token payload")
            raise credentials_exception
        
        print(f"✅ Token verified for user_id: {user_id}")
        
        user = db.query(User).filter(User.id == user_id).first()
        if user is None:
            print(f"❌ User not found in database: {user_id}")
            raise credentials_exception
        
        print(f"✅ User found: {user.username} (Active: {user.is_active}, Role: {user.role})")
        
        if not user.is_active:
            print(f"❌ User {user.username} is INACTIVE")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Inactive user"
            )
        
        return user
        
    except JWTError as e:
        print(f"❌ JWT Error: {str(e)}")
        raise credentials_exception
    except Exception as e:
        print(f"❌ Unexpected error in get_current_user: {str(e)}")
        raise

async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

def get_current_admin(
    current_user: User = Depends(get_current_active_user)
) -> User:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user

def get_current_doctor(
    current_user: User = Depends(get_current_active_user)
) -> User:
    if current_user.role not in [UserRole.DOCTOR, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user

def get_current_patient(
    current_user: User = Depends(get_current_active_user)
) -> User:
    if current_user.role not in [UserRole.PATIENT, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user