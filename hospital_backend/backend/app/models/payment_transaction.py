from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.db.base_class import Base


class TransactionStatus(str, enum.Enum):
    PENDING = "pending"
    SUCCESS = "success"
    FAILED = "failed"
    REFUNDED = "refunded"


class PaymentGateway(str, enum.Enum):
    RAZORPAY = "razorpay"
    STRIPE = "stripe"
    PAYPAL = "paypal"
    CASH = "cash"
    CARD = "card"


class PaymentTransaction(Base):
    """Payment transaction records for tracking all payment attempts"""
    __tablename__ = "payment_transactions"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(String(100), unique=True, index=True, nullable=False)
    
    # Foreign Keys
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False, index=True)
    billing_id = Column(Integer, ForeignKey("billings.id"), nullable=False, index=True)
    
    # Payment Details
    amount = Column(Float, nullable=False)  # Amount in rupees
    currency = Column(String(10), default="INR")
    payment_gateway = Column(SQLEnum(PaymentGateway), nullable=False)
    status = Column(SQLEnum(TransactionStatus), default=TransactionStatus.PENDING)
    
    # Gateway-specific fields (for Razorpay)
    gateway_order_id = Column(String(100), nullable=True)  # Razorpay order ID
    gateway_payment_id = Column(String(100), nullable=True)  # Razorpay payment ID
    gateway_signature = Column(String(255), nullable=True)  # Razorpay signature
    
    # Additional info
    payment_method = Column(String(50), nullable=True)  # card, netbanking, upi, etc.
    description = Column(String(500), nullable=True)
    failure_reason = Column(String(500), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    
    # Relationships
    patient = relationship("Patient", back_populates="payment_transactions")
    billing = relationship("Billing", back_populates="payment_transactions")
