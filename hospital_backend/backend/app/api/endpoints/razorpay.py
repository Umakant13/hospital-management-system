from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Any
import razorpay
import os
from datetime import datetime

from app.api.deps import get_db, get_current_active_user
from app.models.user import User
from app.models.billing import Billing
from app.models.payment_transaction import PaymentTransaction
from pydantic import BaseModel

router = APIRouter()

# Initialize Razorpay client
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "rzp_test_dummy_key")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "dummy_secret")

try:
    razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
except Exception as e:
    print(f"Warning: Razorpay client initialization failed: {e}")
    razorpay_client = None


class OrderCreate(BaseModel):
    amount: float
    currency: str = "INR"
    receipt: str
    notes: dict = {}


class PaymentVerify(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    bill_id: str


@router.post("/create-order")
async def create_order(
    order_data: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Create a Razorpay order for payment
    """
    try:
        if not razorpay_client:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Payment service is not configured"
            )
        
        # Convert amount to paise (Razorpay uses smallest currency unit)
        amount_in_paise = int(order_data.amount * 100)
        
        # Create order
        order = razorpay_client.order.create({
            "amount": amount_in_paise,
            "currency": order_data.currency,
            "receipt": order_data.receipt,
            "notes": order_data.notes
        })
        
        return {
            "order_id": order["id"],
            "amount": order["amount"],
            "currency": order["currency"],
            "receipt": order["receipt"],
            "key_id": RAZORPAY_KEY_ID
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create order: {str(e)}"
        )


@router.post("/verify-payment")
async def verify_payment(
    payment_data: PaymentVerify,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Verify Razorpay payment signature and update billing
    """
    try:
        if not razorpay_client:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Payment service is not configured"
            )
        
        # Verify payment signature
        params_dict = {
            'razorpay_order_id': payment_data.razorpay_order_id,
            'razorpay_payment_id': payment_data.razorpay_payment_id,
            'razorpay_signature': payment_data.razorpay_signature
        }
        
        try:
            razorpay_client.utility.verify_payment_signature(params_dict)
        except razorpay.errors.SignatureVerificationError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid payment signature"
            )
        
        # Get payment details
        payment = razorpay_client.payment.fetch(payment_data.razorpay_payment_id)
        
        # Update billing record
        bill = db.query(Billing).filter(Billing.bill_id == payment_data.bill_id).first()
        if not bill:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Bill not found"
            )
        
        # Calculate payment amount (convert from paise to rupees)
        payment_amount = payment["amount"] / 100
        
        # Update bill
        bill.paid_amount = (bill.paid_amount or 0) + payment_amount
        bill.balance = bill.total_amount - bill.paid_amount
        
        if bill.balance <= 0:
            bill.payment_status = "paid"
        elif bill.paid_amount > 0:
            bill.payment_status = "partial"
        
        # Create payment transaction record
        transaction = PaymentTransaction(
            bill_id=bill.id,
            transaction_id=payment_data.razorpay_payment_id,
            payment_method="razorpay",
            amount=payment_amount,
            status="success",
            payment_date=datetime.utcnow(),
            razorpay_order_id=payment_data.razorpay_order_id,
            razorpay_payment_id=payment_data.razorpay_payment_id,
            razorpay_signature=payment_data.razorpay_signature
        )
        
        db.add(transaction)
        db.commit()
        db.refresh(bill)
        
        return {
            "success": True,
            "message": "Payment verified successfully",
            "bill_id": bill.bill_id,
            "paid_amount": bill.paid_amount,
            "balance": bill.balance,
            "payment_status": bill.payment_status
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Payment verification failed: {str(e)}"
        )


@router.get("/payment/{payment_id}")
async def get_payment_details(
    payment_id: str,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get payment details from Razorpay
    """
    try:
        if not razorpay_client:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Payment service is not configured"
            )
        
        payment = razorpay_client.payment.fetch(payment_id)
        
        return {
            "payment_id": payment["id"],
            "order_id": payment.get("order_id"),
            "amount": payment["amount"] / 100,  # Convert from paise
            "currency": payment["currency"],
            "status": payment["status"],
            "method": payment.get("method"),
            "email": payment.get("email"),
            "contact": payment.get("contact"),
            "created_at": payment["created_at"]
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch payment details: {str(e)}"
        )


@router.get("/key")
async def get_razorpay_key() -> Any:
    """
    Get Razorpay public key for frontend
    """
    return {"key_id": RAZORPAY_KEY_ID}
