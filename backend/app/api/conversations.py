from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.models.conversation import Conversation
from app.schemas.conversation import ConversationCreate, ConversationUpdate, ConversationResponse
from app.core.security import get_current_user, require_admin_or_developer
from app.models.user import User, UserRole
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
import uuid

router = APIRouter(prefix="/conversations", tags=["Conversations"])

@router.get("", response_model=list[ConversationResponse])
async def list_conversations(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Conversation).where(Conversation.user_id == current_user.id).order_by(Conversation.updated_at.desc())
    )
    return result.scalars().all()

@router.post("", response_model=ConversationResponse)
async def create_conversation(data: ConversationCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    conv = Conversation(
        id=data.id,
        user_id=current_user.id,
        title=data.title,
        messages=data.messages,
    )
    db.add(conv)
    await db.flush()
    await db.refresh(conv)
    return conv

@router.put("/{conv_id}", response_model=ConversationResponse)
async def update_conversation(conv_id: str, data: ConversationUpdate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Conversation).where(Conversation.id == conv_id, Conversation.user_id == current_user.id))
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if data.title is not None:
        conv.title = data.title
    if data.messages is not None:
        conv.messages = data.messages
    await db.flush()
    await db.refresh(conv)
    return conv

@router.delete("/{conv_id}")
async def delete_conversation(conv_id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Conversation).where(Conversation.id == conv_id, Conversation.user_id == current_user.id))
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    await db.delete(conv)
    await db.flush()
    return {"status": "deleted"}

class AdminConversationResponse(BaseModel):
    id: str
    user_id: str
    username: str
    full_name: Optional[str] = None
    email: Optional[str] = None
    title: str
    messages: list
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

@router.get("/all", response_model=List[AdminConversationResponse])
async def list_all_conversations(
    current_user: User = Depends(require_admin_or_developer),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Conversation).order_by(Conversation.updated_at.desc()).limit(200)
    )
    convs = result.scalars().all()
    out = []
    for c in convs:
        out.append({
            "id": c.id,
            "user_id": c.user_id,
            "username": c.user.username if c.user else "deleted",
            "full_name": c.user.full_name if c.user else None,
            "email": c.user.email if c.user else None,
            "title": c.title,
            "messages": c.messages,
            "created_at": c.created_at,
            "updated_at": c.updated_at,
        })
    return out