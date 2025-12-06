from app.db.session import SessionLocal
from app.models.user import User, UserRole
from app.models.patient import Patient
from app.models.medical_record import MedicalRecord

db = SessionLocal()

print("-" * 50)
print("DEBUGGING MEDICAL RECORDS VISIBILITY")
print("-" * 50)

# 1. List all Patients and their User IDs
print("\n1. PATIENTS:")
patients = db.query(Patient).all()
for p in patients:
    user = db.query(User).filter(User.id == p.user_id).first()
    print(f"ID: {p.id}, UserID: {p.user_id}, Name: {user.full_name if user else 'UNKNOWN'}, UserRole: {user.role if user else 'N/A'}")

# 2. List all Medical Records
print("\n2. MEDICAL RECORDS:")
records = db.query(MedicalRecord).all()
for r in records:
    print(f"RecordID: {r.id}, PatientID: {r.patient_id}, Diagnosis: {r.diagnosis}")

# 3. Check for Orphans
print("\n3. ANALYSIS:")
for p in patients:
    p_records = [r for r in records if r.patient_id == p.id]
    print(f"Patient {p.id} ({p.user.full_name}) has {len(p_records)} records.")

print("-" * 50)
