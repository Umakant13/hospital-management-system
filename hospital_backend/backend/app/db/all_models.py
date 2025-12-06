# Import all models here for Alembic
from app.db.base import Base

# Import all models
from app.models.user import User
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.models.appointment import Appointment
from app.models.message import Message
from app.models.notification import Notification
from app.models.activity_log import ActivityLog
from app.models.medical_record import MedicalRecord
from app.models.prescription import Prescription
from app.models.department import Department
from app.models.billing import Billing
from app.models.lab_test import LabTest
from app.models.payment_transaction import PaymentTransaction

# This ensures all models are imported when using Base.metadata.create_all()