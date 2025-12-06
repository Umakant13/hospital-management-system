from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
import random
import razorpay
import hmac
import hashlib
from datetime import datetime

from app.api.deps import get_db, get_current_active_user, get_current_admin
from app.core.config import settings
from app.models.billing import Billing, PaymentStatus, PaymentMethod
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.models.user import User
from app.models.payment_transaction import PaymentTransaction, TransactionStatus, PaymentGateway
from app.schemas.billing import (
    BillingCreate,
    BillingUpdate,
    BillingResponse,
    BillingWithDetails,
    PaymentCreate,
    RazorpayOrderCreate,
    RazorpayVerifyPayment
)


router = APIRouter()

def generate_bill_id(db: Session) -> str:
    """Generate unique bill ID"""
    while True:
        bill_id = f"BILL{random.randint(10000, 99999)}"
        if not db.query(Billing).filter(Billing.bill_id == bill_id).first():
            return bill_id

def generate_transaction_id(db: Session) -> str:
    """Generate unique transaction ID"""
    while True:
        trans_id = f"TXN{random.randint(100000, 999999)}"
        if not db.query(PaymentTransaction).filter(PaymentTransaction.transaction_id == trans_id).first():
            return trans_id

@router.post("/", response_model=BillingResponse, status_code=status.HTTP_201_CREATED)
async def create_billing(
    billing_in: BillingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Create new bill (Admin or Doctor)
    """
    # Check permissions
    if current_user.role.value not in ["admin", "doctor"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )

    # Verify patient exists
    patient = db.query(Patient).filter(Patient.id == billing_in.patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    # Calculate totals
    subtotal = (
        billing_in.consultation_fee +
        billing_in.medication_charges +
        billing_in.lab_charges +
        billing_in.other_charges
    )
    total_amount = subtotal + billing_in.tax - billing_in.discount
    
    db_billing = Billing(
        **billing_in.dict(),
        bill_id=generate_bill_id(db),
        subtotal=subtotal,
        total_amount=total_amount,
        paid_amount=0.0,
        balance=total_amount,
        payment_status=PaymentStatus.PENDING
    )
    db.add(db_billing)
    db.commit()
    db.refresh(db_billing)
    
    return db_billing

@router.get("/", response_model=List[BillingWithDetails])
async def get_billings(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    patient_id: int = Query(None),
    payment_status: PaymentStatus = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get all bills with filters
    """
    query = db.query(Billing)
    
    # Role-based filtering
    if current_user.role.value == "patient":
        patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        if patient:
            query = query.filter(Billing.patient_id == patient.id)
        else:
            return []
            
    # Doctor filtering - only show bills for their patients
    if current_user.role.value == "doctor":
        doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
        if doctor:
            # Filter bills where patient's primary doctor is the current doctor
            query = query.join(Patient).filter(Patient.primary_doctor_id == doctor.id)
        else:
            return []
    
    # Apply filters
    if patient_id:
        query = query.filter(Billing.patient_id == patient_id)
    
    if payment_status:
        query = query.filter(Billing.payment_status == payment_status)
    
    billings = query.order_by(Billing.bill_date.desc()).offset(skip).limit(limit).all()
    
    result = []
    for billing in billings:
        billing_dict = billing.__dict__
        billing_dict['patient'] = {
            "id": billing.patient.id,
            "patient_id": billing.patient.patient_id,
            "name": billing.patient.user.full_name
        }
        result.append(billing_dict)
    
    return result

@router.get("/{bill_id}", response_model=BillingWithDetails)
async def get_billing(
    bill_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get specific bill by ID
    """
    billing = db.query(Billing).filter(Billing.bill_id == bill_id).first()
    
    if not billing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bill not found"
        )
    
    # Permission check
    if current_user.role.value == "patient":
        patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        if not patient or billing.patient_id != patient.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
            
    if current_user.role.value == "doctor":
        doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
        if doctor:
            patient = db.query(Patient).filter(Patient.id == billing.patient_id).first()
            if not patient or patient.primary_doctor_id != doctor.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not enough permissions"
                )
    
    result = billing.__dict__
    result['patient'] = {
        "id": billing.patient.id,
        "patient_id": billing.patient.patient_id,
        "name": billing.patient.user.full_name
    }
    
    return result

@router.put("/{bill_id}", response_model=BillingResponse)
async def update_billing(
    bill_id: str,
    billing_update: BillingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Update bill (Admin or Doctor)
    """
    # Check permissions
    if current_user.role.value not in ["admin", "doctor"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )

    billing = db.query(Billing).filter(Billing.bill_id == bill_id).first()
    
    if not billing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bill not found"
        )
    
    update_data = billing_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(billing, field, value)
    
    # Recalculate totals
    billing.subtotal = (
        billing.consultation_fee +
        billing.medication_charges +
        billing.lab_charges +
        billing.other_charges
    )
    billing.total_amount = billing.subtotal + billing.tax - billing.discount
    billing.balance = billing.total_amount - billing.paid_amount
    
    # Update payment status
    if billing.balance <= 0:
        billing.payment_status = PaymentStatus.PAID
    elif billing.paid_amount > 0:
        billing.payment_status = PaymentStatus.PARTIAL
    
    db.commit()
    db.refresh(billing)
    
    return billing

@router.post("/{bill_id}/payment", response_model=BillingResponse)
async def add_payment(
    bill_id: str,
    payment: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Add payment to bill
    """
    billing = db.query(Billing).filter(Billing.bill_id == bill_id).first()
    
    if not billing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bill not found"
        )
    
    # Update payment
    billing.paid_amount += payment.amount
    billing.balance = billing.total_amount - billing.paid_amount
    billing.payment_method = payment.payment_method
    
    # Update status
    if billing.balance <= 0:
        billing.payment_status = PaymentStatus.PAID
    else:
        billing.payment_status = PaymentStatus.PARTIAL
    
    db.commit()
    db.refresh(billing)
    
    return billing

@router.delete("/{bill_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_billing(
    bill_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> None:
    """
    Delete bill (Admin or Doctor)
    """
    # Check permissions
    if current_user.role.value not in ["admin", "doctor"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )

    billing = db.query(Billing).filter(Billing.bill_id == bill_id).first()
    
    if not billing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bill not found"
        )
    
    db.delete(billing)
    db.commit()

@router.get("/analyti3cs/revenue")
async def get_revenue_analytics(
    start_date: str = Query(None),
    end_date: str = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
) -> Any:
    """
    Get revenue analytics (Admin only)
    """
    from datetime import datetime
    
    query = db.query(Billing)
    
    if start_date:
        query = query.filter(Billing.bill_date >= datetime.strptime(start_date, "%Y-%m-%d"))
    if end_date:
        query = query.filter(Billing.bill_date <= datetime.strptime(end_date, "%Y-%m-%d"))
    
    billings = query.all()
    
    total_revenue = sum(b.total_amount for b in billings)
    total_paid = sum(b.paid_amount for b in billings)
    total_pending = sum(b.balance for b in billings if b.balance > 0)
    
    return {
        "total_bills": len(billings),
        "total_revenue": total_revenue,
        "total_paid": total_paid,
        "total_pending": total_pending,
        "payment_status_distribution": {
            "pending": len([b for b in billings if b.payment_status == PaymentStatus.PENDING]),
            "partial": len([b for b in billings if b.payment_status == PaymentStatus.PARTIAL]),
            "paid": len([b for b in billings if b.payment_status == PaymentStatus.PAID]),
        }
    }
    
# Initialize Razorpay client
razorpay_client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

@router.post("/razorpay/create-order")
async def create_razorpay_order(
    data: RazorpayOrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create Razorpay order - Accessible by authenticated users (patients, doctors, admin)"""
    try:
        # Log authentication details
        print(f"✅ Razorpay Order - User authenticated: {current_user.username} (Role: {current_user.role.value})")
        print(f"📝 Request data: amount={data.amount}, bill_id={data.bill_id}")
        
        # Verify bill exists
        billing = db.query(Billing).filter(Billing.bill_id == data.bill_id).first()
        if not billing:
            raise HTTPException(status_code=404, detail=f"Bill {data.bill_id} not found")
        
        # If patient, verify bill ownership
        if current_user.role.value == "patient":
            patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
            if not patient:
                raise HTTPException(status_code=404, detail="Patient profile not found")
            
            if billing.patient_id != patient.id:
                raise HTTPException(
                    status_code=403,
                    detail=f"You don't have permission to pay bill {data.bill_id}"
                )
            print(f"✅ Bill ownership verified for patient {patient.patient_id}")
        
        # Create Razorpay order
        order_data = {
            "amount": data.amount,  # Already in paise from frontend
            "currency": data.currency,
            "receipt": f"bill_{data.bill_id}",
            "notes": {
                "bill_id": data.bill_id,
                "user_id": str(current_user.id)
            }
        }
        
        print(f"🔄 Creating Razorpay order: {order_data}")
        order = razorpay_client.order.create(data=order_data)
        print(f"✅ Razorpay order created: {order['id']}")
        
        # Create payment transaction record
        transaction = PaymentTransaction(
            transaction_id=generate_transaction_id(db),
            patient_id=patient.id if current_user.role.value == "patient" else billing.patient_id,
            billing_id=billing.id,
            amount=data.amount / 100,  # Convert paise to rupees
            currency=data.currency,
            payment_gateway=PaymentGateway.RAZORPAY,
            status=TransactionStatus.PENDING,
            gateway_order_id=order["id"],
            description=f"Payment for bill {data.bill_id}"
        )
        db.add(transaction)
        db.commit()
        db.refresh(transaction)
        print(f"✅ Payment transaction created: {transaction.transaction_id}")
        
        return {
            "razorpay_order_id": order["id"],
            "amount": order["amount"],
            "currency": order["currency"],
            "bill_id": data.bill_id
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error creating Razorpay order: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to create order: {str(e)}")


@router.post("/razorpay/verify-payment")
async def verify_razorpay_payment(
    data: RazorpayVerifyPayment,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Verify Razorpay payment - Accessible by authenticated users"""
    try:
        print(f"✅ Payment Verification - User: {current_user.username} (Role: {current_user.role.value})")
        print(f"📝 Verifying payment for bill: {data.bill_id}")
        print(f"📝 Payment data received: {data.dict()}")
        
        # Verify bill exists
        billing = db.query(Billing).filter(Billing.bill_id == data.bill_id).first()
        if not billing:
            raise HTTPException(status_code=404, detail="Bill not found")
        
        # If patient, verify bill ownership
        if current_user.role.value == "patient":
            patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
            if not patient or billing.patient_id != patient.id:
                raise HTTPException(
                    status_code=403,
                    detail="You don't have permission to verify payment for this bill"
                )
        
        # Verify signature
        generated_signature = hmac.new(
            settings.RAZORPAY_KEY_SECRET.encode(),
            f"{data.razorpay_order_id}|{data.razorpay_payment_id}".encode(),
            hashlib.sha256
        ).hexdigest()
        
        if generated_signature != data.razorpay_signature:
            print("❌ Invalid payment signature")
            raise HTTPException(status_code=400, detail="Invalid payment signature")
        
        print("✅ Payment signature verified")
        
        # Find the payment transaction
        transaction = db.query(PaymentTransaction).filter(
            PaymentTransaction.gateway_order_id == data.razorpay_order_id
        ).first()
        
        if not transaction:
            print("⚠️ Transaction record not found, creating new one")
            # Create transaction if not found (fallback)
            transaction = PaymentTransaction(
                transaction_id=generate_transaction_id(db),
                patient_id=billing.patient_id,
                billing_id=billing.id,
                amount=data.amount,
                currency="INR",
                payment_gateway=PaymentGateway.RAZORPAY,
                gateway_order_id=data.razorpay_order_id,
                description=f"Payment for bill {data.bill_id}"
            )
            db.add(transaction)
        
        # Update transaction with payment details
        transaction.gateway_payment_id = data.razorpay_payment_id
        transaction.gateway_signature = data.razorpay_signature
        transaction.status = TransactionStatus.SUCCESS
        transaction.completed_at = datetime.utcnow()
        
        # Calculate actual amount from billing balance if not provided correctly
        payment_amount = data.amount if data.amount > 0 else billing.balance
        
        # Update billing record
        billing.paid_amount += payment_amount
        billing.balance = billing.total_amount - billing.paid_amount
        billing.payment_method = PaymentMethod.ONLINE
        
        if billing.balance <= 0:
            billing.payment_status = PaymentStatus.PAID
        else:
            billing.payment_status = PaymentStatus.PARTIAL
        
        db.commit()
        db.refresh(billing)
        db.refresh(transaction)
        
        print(f"✅ Payment recorded: ₹{payment_amount} for bill {data.bill_id}")
        print(f"✅ Transaction {transaction.transaction_id} marked as SUCCESS")
        
        # Send notifications
        try:
            from app.services.notification_service import NotificationService
            from app.models.notification import NotificationType
            
            # Notify Patient
            NotificationService.create_notification(
                db=db,
                user_id=billing.patient.user_id,
                notification_type=NotificationType.BILLING,
                title="Payment Successful",
                message=f"Payment of ₹{payment_amount} for bill #{billing.bill_id} was successful.",
                action_url=f"/patient/billing",
                background_tasks=None
            )
            
            # Notify Doctor (if bill is associated with a doctor)
            if billing.doctor_id:
                doctor = db.query(Doctor).filter(Doctor.id == billing.doctor_id).first()
                if doctor and doctor.user_id:
                    NotificationService.create_notification(
                        db=db,
                        user_id=doctor.user_id,
                        notification_type=NotificationType.BILLING,
                        title="Payment Received",
                        message=f"Payment of ₹{payment_amount} received from {billing.patient.name} for bill #{billing.bill_id}.",
                        action_url=f"/doctor/billing",
                        background_tasks=None
                    )
            
            # Notify Admins
            NotificationService.notify_admins(
                db=db,
                notification_type=NotificationType.BILLING,
                title="New Payment Received",
                message=f"Payment of ₹{payment_amount} received from {billing.patient.name} (Bill #{billing.bill_id}).",
                action_url="/admin/billing",
                background_tasks=None
            )
            
        except Exception as notif_error:
            print(f"⚠️ Failed to send billing notifications: {notif_error}")
            # Don't fail the request if notification fails
        
        return {
            "status": "success",
            "message": "Payment verified successfully",
            "bill_id": data.bill_id,
            "paid_amount": float(billing.paid_amount),
            "balance": float(billing.balance),
            "payment_status": billing.payment_status.value
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Payment verification error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Payment verification failed: {str(e)}")