from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.models.conversation import Conversation
from app.schemas.conversation import ConversationCreate, ConversationUpdate, ConversationResponse
from app.core.security import get_current_user
from app.models.user import User
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
