# Import all models here so SQLAlchemy can create tables
from app.models.user import User, UserRole
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.models.staff import Staff
from app.models.department import Department
from app.models.appointment import Appointment
from app.models.medical_record import MedicalRecord
from app.models.prescription import Prescription
from app.models.lab_test import LabTest
from app.models.billing import Billing
from app.models.file import File
from app.models.payment_transaction import PaymentTransaction
from app.models.message import Message
from app.models.notification import Notification
from app.models.activity_log import ActivityLog
from app.models.video_consultation import VideoConsultation
from app.models.doctor_review import DoctorReview
