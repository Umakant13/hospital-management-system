from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine
import socketio
from app.core.websocket import sio
import os
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings


# Import all endpoints
from app.api.endpoints import (
    auth, users, patients, doctors, appointments,
    departments, medical_records, prescriptions,
    lab_tests, billing, messages, notifications,
    analytics, dashboard, reports, activity_logs,
    files, staff, video_consultations, ai_prediction, test_notification
)

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc"
)

origins = [
    "http://localhost:8000",
    "http://127.0.0.1:3000",
]


# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for testing (including mobile)
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Allow all headers
    expose_headers=["*"]
)

# Create uploads directory if it doesn't exist
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(f"{UPLOAD_DIR}/medical_records", exist_ok=True)
os.makedirs(f"{UPLOAD_DIR}/prescriptions", exist_ok=True)
os.makedirs(f"{UPLOAD_DIR}/lab_reports", exist_ok=True)
os.makedirs(f"{UPLOAD_DIR}/profile_pictures", exist_ok=True)

# Mount static files for uploads
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Include routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication"])
app.include_router(users.router, prefix=f"{settings.API_V1_STR}/users", tags=["Users"])
app.include_router(patients.router, prefix=f"{settings.API_V1_STR}/patients", tags=["Patients"])
app.include_router(doctors.router, prefix=f"{settings.API_V1_STR}/doctors", tags=["Doctors"])
app.include_router(appointments.router, prefix=f"{settings.API_V1_STR}/appointments", tags=["Appointments"])
app.include_router(departments.router, prefix=f"{settings.API_V1_STR}/departments", tags=["Departments"])
app.include_router(medical_records.router, prefix=f"{settings.API_V1_STR}/medical-records", tags=["Medical Records"])
app.include_router(prescriptions.router, prefix=f"{settings.API_V1_STR}/prescriptions", tags=["Prescriptions"])
app.include_router(lab_tests.router, prefix=f"{settings.API_V1_STR}/lab-tests", tags=["Lab Tests"])
app.include_router(billing.router, prefix=f"{settings.API_V1_STR}/billing", tags=["Billing"])
app.include_router(messages.router, prefix=f"{settings.API_V1_STR}/messages", tags=["Messages"])
app.include_router(notifications.router, prefix=f"{settings.API_V1_STR}/notifications", tags=["Notifications"])
app.include_router(analytics.router, prefix=f"{settings.API_V1_STR}/analytics", tags=["Analytics"])
app.include_router(dashboard.router, prefix=f"{settings.API_V1_STR}/dashboard", tags=["Dashboard"])
app.include_router(reports.router, prefix=f"{settings.API_V1_STR}/reports", tags=["Reports"])
app.include_router(activity_logs.router, prefix=f"{settings.API_V1_STR}/activity-logs", tags=["Activity Logs"])
app.include_router(staff.router, prefix=f"{settings.API_V1_STR}/staff", tags=["Staff"])
app.include_router(video_consultations.router, prefix=f"{settings.API_V1_STR}/video-consultations", tags=["Video Consultations"])
app.include_router(ai_prediction.router, prefix=f"{settings.API_V1_STR}/ai", tags=["AI Prediction"])
app.include_router(test_notification.router, prefix=f"{settings.API_V1_STR}/test", tags=["Testing"])

app.include_router(files.router, prefix=f"{settings.API_V1_STR}/files", tags=["File Upload"])

@app.get("/")
async def root():
    return {
        "message": "Hospital Management System API",
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "redoc": "/redoc"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Wrap FastAPI app with Socket.IO
socket_app = socketio.ASGIApp(
    sio,
    other_asgi_app=app,
    socketio_path='/ws/socket.io'
)