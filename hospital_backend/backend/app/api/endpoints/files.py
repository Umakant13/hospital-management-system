from fastapi import APIRouter, Depends, HTTPException, UploadFile, File as FastAPIFile, status, Response
from app.api.deps import get_current_active_user
from app.models.user import User
from typing import List
import uuid
from datetime import datetime
import os
import shutil
from pathlib import Path
import json

router = APIRouter()

ALLOWED_EXTENSIONS = {
    'image': {'jpg', 'jpeg', 'png', 'gif'},
    'document': {'pdf', 'doc', 'docx', 'txt'},
    'medical': {'pdf', 'jpg', 'jpeg', 'png', 'dcm', 'dicom'}
}

# Determine base directory (backend root)
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
UPLOAD_DIR = BASE_DIR / "uploads"
METADATA_FILE = UPLOAD_DIR / "file_metadata.json"

# Ensure uploads directory exists
os.makedirs(UPLOAD_DIR, exist_ok=True)

def load_metadata():
    """Load file metadata from JSON file"""
    if os.path.exists(METADATA_FILE):
        try:
            with open(METADATA_FILE, 'r') as f:
                return json.load(f)
        except:
            return {}
    return {}

def save_metadata(metadata):
    """Save file metadata to JSON file"""
    os.makedirs(os.path.dirname(METADATA_FILE), exist_ok=True)
    with open(METADATA_FILE, 'w') as f:
        json.dump(metadata, f, indent=2)

# Load metadata on startup
FILE_METADATA = load_metadata()

def get_file_extension(filename: str) -> str:
    return filename.rsplit('.', 1)[1].lower() if '.' in filename else ''

def is_allowed_file(filename: str, file_type: str) -> bool:
    ext = get_file_extension(filename)
    return ext in ALLOWED_EXTENSIONS.get(file_type, set())

@router.post("/upload/{category}")
async def upload_file(
    category: str,
    file: UploadFile = FastAPIFile(...),
    current_user: User = Depends(get_current_active_user)
):
    """
    Upload file to disk storage
    Categories: medical_records, prescriptions, lab_reports, profile_pictures
    """
    # Validate category
    valid_categories = ['medical_records', 'prescriptions', 'lab_reports', 'profile_pictures']
    if category not in valid_categories:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid category. Must be one of {valid_categories}"
        )
    
    # Determine file type based on category
    file_type = 'document'
    if category == 'profile_pictures':
        file_type = 'image'
    elif category in ['medical_records', 'lab_reports']:
        file_type = 'medical'
        
    # Validate file type
    if not is_allowed_file(file.filename, file_type) and not is_allowed_file(file.filename, 'image'):
        # Allow images for all categories as fallback
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File type not allowed"
        )
    
    try:
        # Create uploads directory if it doesn't exist (using absolute path)
        category_dir = UPLOAD_DIR / category
        os.makedirs(category_dir, exist_ok=True)
        
        # Generate unique filename to prevent overwrites
        file_ext = get_file_extension(file.filename)
        unique_filename = f"{uuid.uuid4().hex}.{file_ext}"
        file_path = str(category_dir / unique_filename)
        
        # Save file to disk
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Store metadata in memory
        file_id = str(uuid.uuid4())
        FILE_METADATA[file_id] = {
            "id": file_id,
            "filename": file.filename,
            "file_path": file_path,
            "category": category,
            "content_type": file.content_type,
            "size": os.path.getsize(file_path),
            "uploaded_by": current_user.id,
            "uploaded_at": datetime.now().isoformat()
        }
        
        # Save metadata to JSON file for persistence
        save_metadata(FILE_METADATA)
        
        return {
            "id": file_id,
            "filename": file.filename,
            "file_path": f"/files/view/{file_id}",  # URL to view/download file
            "category": category,
            "size": os.path.getsize(file_path),
            "uploaded_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload file: {str(e)}"
        )

# Multiple file upload removed - use single upload endpoint multiple times if needed

@router.get("/view/{file_id}")
async def view_file(file_id: str):
    """
    Stream file from disk storage
    """
    print(f"🔍 Attempting to view file: {file_id}")
    print(f"📦 FILE_METADATA keys: {list(FILE_METADATA.keys())}")
    print(f"📦 Total files in metadata: {len(FILE_METADATA)}")
    
    file_metadata = FILE_METADATA.get(file_id)
    
    if not file_metadata:
        print(f"❌ File metadata not found for ID: {file_id}")
        print(f"Available IDs: {list(FILE_METADATA.keys())}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"File not found. ID: {file_id}"
        )
    
    print(f"✅ Found metadata: {file_metadata}")
    
    if not os.path.exists(file_metadata["file_path"]):
        print(f"❌ File not found on disk: {file_metadata['file_path']}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"File not found on server: {file_metadata['file_path']}"
        )
    
    print(f"✅ File exists on disk, serving...")
    
    with open(file_metadata["file_path"], "rb") as f:
        content = f.read()
        
    return Response(
        content=content,
        media_type=file_metadata["content_type"],
        headers={
            "Content-Disposition": f"inline; filename={file_metadata['filename']}"
        }
    )

@router.delete("/delete/{category}/{file_id}")
async def delete_file(
    category: str,
    file_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete file from disk storage
    """
    file_metadata = FILE_METADATA.get(file_id)
    
    if not file_metadata:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
        
    # Permission check (optional: only uploader or admin can delete)
    if current_user.role.value != "admin" and file_metadata["uploaded_by"] != current_user.id:
         raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this file"
        )

    # Delete file from disk
    if os.path.exists(file_metadata["file_path"]):
        os.remove(file_metadata["file_path"])
    
    # Remove metadata
    del FILE_METADATA[file_id]
    
    # Save updated metadata to JSON file
    save_metadata(FILE_METADATA)
    
    return {"message": "File deleted successfully"}
