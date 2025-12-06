from fastapi import APIRouter
from app.api.endpoints import (
    auth, users, patients, doctors, staff, departments,
    appointments, medical_records, prescriptions, lab_tests,
    billing, files, messages, notifications, analytics, razorpay,
    video_consultations
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(patients.router, prefix="/patients", tags=["patients"])
api_router.include_router(doctors.router, prefix="/doctors", tags=["doctors"])
api_router.include_router(staff.router, prefix="/staff", tags=["staff"])
api_router.include_router(departments.router, prefix="/departments", tags=["departments"])
api_router.include_router(appointments.router, prefix="/appointments", tags=["appointments"])
api_router.include_router(medical_records.router, prefix="/medical-records", tags=["medical-records"])
api_router.include_router(prescriptions.router, prefix="/prescriptions", tags=["prescriptions"])
api_router.include_router(lab_tests.router, prefix="/lab-tests", tags=["lab-tests"])
api_router.include_router(billing.router, prefix="/billing", tags=["billing"])
api_router.include_router(files.router, prefix="/files", tags=["files"])
api_router.include_router(messages.router, prefix="/messages", tags=["messages"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(razorpay.router, prefix="/razorpay", tags=["razorpay"])
api_router.include_router(video_consultations.router, prefix="/video-consultations", tags=["video-consultations"])
