from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class DoctorReviewCreate(BaseModel):
    rating: float = Field(..., ge=1, le=5, description="Rating from 1 to 5")
    review_text: Optional[str] = Field(None, max_length=1000)

class DoctorReviewResponse(BaseModel):
    id: int
    doctor_id: int
    patient_id: int
    patient_name: str
    rating: float
    review_text: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

class DoctorReviewUpdate(BaseModel):
    rating: Optional[float] = Field(None, ge=1, le=5)
    review_text: Optional[str] = Field(None, max_length=1000)
