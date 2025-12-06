from typing import Optional
from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum

class PaymentStatus(str, Enum):
    PENDING = "pending"
    PARTIAL = "partial"
    PAID = "paid"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"

class PaymentMethod(str, Enum):
    CASH = "cash"
    CARD = "card"
    INSURANCE = "insurance"
    ONLINE = "online"
    CHEQUE = "cheque"

class BillingBase(BaseModel):
    patient_id: int
    appointment_id: Optional[int] = None
    bill_date: datetime
    due_date: Optional[datetime] = None
    consultation_fee: float = Field(0.0, ge=0)
    medication_charges: float = Field(0.0, ge=0)
    lab_charges: float = Field(0.0, ge=0)
    other_charges: float = Field(0.0, ge=0)
    tax: float = Field(0.0, ge=0)
    discount: float = Field(0.0, ge=0)

class BillingCreate(BillingBase):
    notes: Optional[str] = None

class BillingUpdate(BaseModel):
    due_date: Optional[datetime] = None
    consultation_fee: Optional[float] = None
    medication_charges: Optional[float] = None
    lab_charges: Optional[float] = None
    other_charges: Optional[float] = None
    tax: Optional[float] = None
    discount: Optional[float] = None
    paid_amount: Optional[float] = None
    payment_status: Optional[PaymentStatus] = None
    payment_method: Optional[PaymentMethod] = None
    notes: Optional[str] = None

class PaymentCreate(BaseModel):
    amount: float = Field(..., gt=0)
    payment_method: PaymentMethod
    notes: Optional[str] = None

class BillingInDB(BillingBase):
    id: int
    bill_id: str
    subtotal: float
    total_amount: float
    paid_amount: float
    balance: float
    payment_status: PaymentStatus
    payment_method: Optional[PaymentMethod]
    insurance_claim_amount: float
    notes: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True

class BillingResponse(BillingInDB):
    pass

class BillingWithDetails(BillingResponse):
    patient: dict


class RazorpayOrderCreate(BaseModel):
    amount: int  # in paise
    currency: str = "INR"
    bill_id: str

class RazorpayVerifyPayment(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    bill_id: str
    amount: float  # in rupees
