from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    echo=settings.DATABASE_ECHO,
    pool_pre_ping=True,
    pool_size=2,          # render supports max 5
    max_overflow=1,       # keep very low
    pool_recycle=1800     # avoid stale connections
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
