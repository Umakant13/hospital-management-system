from typing import Optional
from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum

class TestStatus(str, Enum):
    ORDERED = "ordered"
    SAMPLE_COLLECTED = "sample_collected"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class LabTestBase(BaseModel):
    patient_id: int
    doctor_id: Optional[int] = None
    test_name: str
    test_type: Optional[str] = None
    ordered_date: datetime

class LabTestCreate(LabTestBase):
    notes: Optional[str] = None

class LabTestUpdate(BaseModel):
    test_name: Optional[str] = None
    test_type: Optional[str] = None
    status: Optional[TestStatus] = None
    collection_date: Optional[datetime] = None
    result_date: Optional[datetime] = None
    results: Optional[str] = None
    normal_range: Optional[str] = None
    unit: Optional[str] = None
    notes: Optional[str] = None
    report_file: Optional[str] = None

class LabTestInDB(LabTestBase):
    id: int
    test_id: str
    status: TestStatus
    collection_date: Optional[datetime]
    result_date: Optional[datetime]
    results: Optional[str]
    normal_range: Optional[str]
    unit: Optional[str]
    cost: float
    notes: Optional[str]
    report_file: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True

class LabTestResponse(LabTestInDB):
    pass

class LabTestWithDetails(LabTestResponse):
    patient: dict
    doctor: Optional[dict] = None