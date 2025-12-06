from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.security import get_password_hash
from app.db.session import SessionLocal
from app.db.base import Base
from app.db.session import engine

# Import all models to ensure they're registered with SQLAlchemy
from app.db.all_models import *

# Now import the models we need
from app.models.user import User, UserRole
from app.models.department import Department


def init_db() -> None:
    """
    Initialize database with default data
    """
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Create superuser
        user = db.query(User).filter(User.email == settings.FIRST_SUPERUSER_EMAIL).first()
        if not user:
            user = User(
                email=settings.FIRST_SUPERUSER_EMAIL,
                username="admin",
                hashed_password=get_password_hash(settings.FIRST_SUPERUSER_PASSWORD),
                full_name=settings.FIRST_SUPERUSER_NAME,
                role=UserRole.ADMIN,
                is_active=True,
                is_verified=True
            )
            db.add(user)
            db.commit()
            print(f"✅ Superuser created: {settings.FIRST_SUPERUSER_EMAIL}")
        else:
            print(f"ℹ️  Superuser already exists: {settings.FIRST_SUPERUSER_EMAIL}")
        
        # Create default departments
        departments_data = [
            {
                "name": "Cardiology",
                "description": "Heart and blood vessel care",
                "location": "Building A, Floor 3",
                "phone": "+1234560001",
                "email": "cardiology@hospital.com"
            },
            {
                "name": "Neurology",
                "description": "Brain and nervous system",
                "location": "Building B, Floor 2",
                "phone": "+1234560002",
                "email": "neurology@hospital.com"
            },
            {
                "name": "Orthopedics",
                "description": "Bone and joint care",
                "location": "Building C, Floor 1",
                "phone": "+1234560003",
                "email": "orthopedics@hospital.com"
            },
            {
                "name": "Pediatrics",
                "description": "Children's health",
                "location": "Building D, Floor 1",
                "phone": "+1234560004",
                "email": "pediatrics@hospital.com"
            },
            {
                "name": "Emergency",
                "description": "Emergency medical care",
                "location": "Building E, Ground Floor",
                "phone": "+1234560005",
                "email": "emergency@hospital.com"
            },
            {
                "name": "General Medicine",
                "description": "General health care",
                "location": "Building F, Floor 2",
                "phone": "+1234560006",
                "email": "general@hospital.com"
            },
        ]
        
        created_count = 0
        for dept_data in departments_data:
            dept = db.query(Department).filter(Department.name == dept_data["name"]).first()
            if not dept:
                dept = Department(**dept_data)
                db.add(dept)
                created_count += 1
        
        if created_count > 0:
            db.commit()
            print(f"✅ Created {created_count} departments")
        else:
            print("ℹ️  All departments already exist")
        
        print("\n" + "="*50)
        print("🎉 Database initialization completed successfully!")
        print("="*50)
        print(f"\n📧 Admin Email: {settings.FIRST_SUPERUSER_EMAIL}")
        print(f"🔑 Admin Password: {settings.FIRST_SUPERUSER_PASSWORD}")
        print("\n⚠️  Please change the admin password after first login!")
        print("="*50 + "\n")
        
    except Exception as e:
        print(f"❌ Error during database initialization: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("🚀 Starting database initialization...\n")
    init_db()