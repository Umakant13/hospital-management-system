from sqlalchemy import Column, Integer, String, DateTime, LargeBinary, ForeignKey
from sqlalchemy.sql import func
from app.db.base import Base
from sqlalchemy.orm import relationship

class File(Base):
    __tablename__ = "files"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    content_type = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False)
    file_path = Column(String(500), nullable=False)  # Store file path
    # data column removed to avoid DB size issues
    size = Column(Integer, nullable=False)      # Size in bytes
    uploaded_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, server_default=func.current_timestamp())

    # Relationship
    uploader = relationship("User", backref="uploaded_files")
