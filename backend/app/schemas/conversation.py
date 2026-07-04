from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ConversationCreate(BaseModel):
    id: str
    title: str
    messages: list

class ConversationUpdate(BaseModel):
    title: Optional[str] = None
    messages: Optional[list] = None

class ConversationResponse(BaseModel):
    id: str
    user_id: str
    title: str
    messages: list
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
