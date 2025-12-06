from app.db.session import SessionLocal
from app.models.patient import Patient
from app.models.user import User

db = SessionLocal()
try:
    patient_id = 17
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if patient:
        print(f"✅ Patient found: ID {patient.id}")
        print(f"   Name: {patient.first_name} {patient.last_name}")
        print(f"   User ID: {patient.user_id}")
        
        user = db.query(User).filter(User.id == patient.user_id).first()
        if user:
            print(f"   User Username: {user.username}")
            print(f"   User Email: {user.email}")
        else:
            print("   ❌ User not found for this patient!")
    else:
        print(f"❌ Patient with ID {patient_id} not found!")
finally:
    db.close()
