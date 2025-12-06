from typing import Optional
from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum


class TransactionStatus(str, Enum):
    PENDING = "pending"
    SUCCESS = "success"
    FAILED = "failed"
    REFUNDED = "refunded"


class PaymentGateway(str, Enum):
    RAZORPAY = "razorpay"
    STRIPE = "stripe"
    PAYPAL = "paypal"
    CASH = "cash"
    CARD = "card"


class PaymentTransactionBase(BaseModel):
    patient_id: int
    billing_id: int
    amount: float = Field(..., gt=0)
    currency: str = "INR"
    payment_gateway: PaymentGateway
    gateway_order_id: Optional[str] = None
    gateway_payment_id: Optional[str] = None
    gateway_signature: Optional[str] = None
    payment_method: Optional[str] = None
    description: Optional[str] = None


class PaymentTransactionCreate(PaymentTransactionBase):
    pass


class PaymentTransactionUpdate(BaseModel):
    status: Optional[TransactionStatus] = None
    gateway_payment_id: Optional[str] = None
    gateway_signature: Optional[str] = None
    payment_method: Optional[str] = None
    failure_reason: Optional[str] = None
    completed_at: Optional[datetime] = None


class PaymentTransactionInDB(PaymentTransactionBase):
    id: int
    transaction_id: str
    status: TransactionStatus
    failure_reason: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]
    completed_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class PaymentTransactionResponse(PaymentTransactionInDB):
    pass


class PaymentTransactionWithDetails(PaymentTransactionResponse):
    patient: dict
    billing: dict
