from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_active_user
from app.models.message import Message
from app.models.user import User
from app.schemas.message import (
    MessageCreate,
    MessageReply,
    MessageResponse,
    MessageWithDetails
)
from datetime import datetime

router = APIRouter()

@router.post("/", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def send_message(
    message_in: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Send a new message
    """
    # Verify receiver exists
    receiver = db.query(User).filter(User.id == message_in.receiver_id).first()
    if not receiver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Receiver not found"
        )
    
    db_message = Message(
        **message_in.dict(),
        sender_id=current_user.id
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    
    return db_message

@router.get("/", response_model=List[MessageWithDetails])
async def get_messages(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    unread_only: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get all messages for current user
    """
    query = db.query(Message).filter(
        (Message.receiver_id == current_user.id) | (Message.sender_id == current_user.id)
    )
    
    if unread_only:
        query = query.filter(Message.is_read == False, Message.receiver_id == current_user.id)
    
    messages = query.order_by(Message.created_at.desc()).offset(skip).limit(limit).all()
    
    result = []
    for message in messages:
        msg_dict = message.__dict__
        
        sender = db.query(User).filter(User.id == message.sender_id).first()
        receiver = db.query(User).filter(User.id == message.receiver_id).first()
        
        msg_dict['sender'] = {
            "id": sender.id,
            "name": sender.full_name,
            "role": sender.role.value
        }
        msg_dict['receiver'] = {
            "id": receiver.id,
            "name": receiver.full_name,
            "role": receiver.role.value
        }
        
        # Get replies
        replies = db.query(Message).filter(Message.parent_message_id == message.id).all()
        msg_dict['replies'] = [{
            "id": reply.id,
            "message": reply.message,
            "sender": reply.sender_id,
            "created_at": reply.created_at
        } for reply in replies]
        
        result.append(msg_dict)
    
    return result

@router.get("/{message_id}", response_model=MessageWithDetails)
async def get_message(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get specific message by ID
    """
    message = db.query(Message).filter(Message.id == message_id).first()
    
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    
    # Permission check
    if message.sender_id != current_user.id and message.receiver_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Mark as read if receiver is viewing
    if message.receiver_id == current_user.id and not message.is_read:
        message.is_read = True
        message.read_at = datetime.now()
        db.commit()
    
    result = message.__dict__
    
    sender = db.query(User).filter(User.id == message.sender_id).first()
    receiver = db.query(User).filter(User.id == message.receiver_id).first()
    
    result['sender'] = {
        "id": sender.id,
        "name": sender.full_name,
        "role": sender.role.value
    }
    result['receiver'] = {
        "id": receiver.id,
        "name": receiver.full_name,
        "role": receiver.role.value
    }
    
    # Get replies
    replies = db.query(Message).filter(Message.parent_message_id == message.id).all()
    result['replies'] = [{
        "id": reply.id,
        "message": reply.message,
        "sender": reply.sender_id,
        "created_at": reply.created_at
    } for reply in replies]
    
    return result

@router.post("/{message_id}/reply", response_model=MessageResponse)
async def reply_message(
    message_id: int,
    reply: MessageReply,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Reply to a message
    """
    parent_message = db.query(Message).filter(Message.id == message_id).first()
    
    if not parent_message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    
    # Determine receiver (reply to sender)
    receiver_id = parent_message.sender_id if parent_message.receiver_id == current_user.id else parent_message.receiver_id
    
    db_reply = Message(
        sender_id=current_user.id,
        receiver_id=receiver_id,
        message=reply.message,
        parent_message_id=message_id
    )
    db.add(db_reply)
    db.commit()
    db.refresh(db_reply)
    
    return db_reply

@router.delete("/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_message(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> None:
    """
    Delete message
    """
    message = db.query(Message).filter(Message.id == message_id).first()
    
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    
    # Only sender can delete
    if message.sender_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    db.delete(message)
    db.commit()

@router.post("/{message_id}/mark-read", response_model=MessageResponse)
async def mark_message_read(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Mark message as read
    """
    message = db.query(Message).filter(Message.id == message_id).first()
    
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    
    if message.receiver_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    message.is_read = True
    message.read_at = datetime.now()
    db.commit()
    db.refresh(message)
    
    return message

@router.put("/{message_id}/archive", response_model=MessageResponse)
async def archive_message(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Archive a message
    """
    message = db.query(Message).filter(Message.id == message_id).first()
    
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    
    # Only sender or receiver can archive
    if message.sender_id != current_user.id and message.receiver_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    message.is_archived = True
    db.commit()
    db.refresh(message)
    
    return message


@router.get("/inbox/unread-count")
async def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get unread message count
    """
    count = db.query(Message).filter(
        Message.receiver_id == current_user.id,
        Message.is_read == False
    ).count()
    
    return {"unread_count": count}



