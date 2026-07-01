from sqlalchemy import Column, String, Boolean, DateTime, Text, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import JSON
from app.db.base import Base, TimestampMixin
import uuid
from datetime import datetime
import enum

class UserRole(str, enum.Enum):
    RESEARCHER = "researcher"
    STUDENT = "student"
    PROFESSOR = "professor"
    ADMIN = "admin"

class User(Base, TimestampMixin):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(SAEnum(UserRole), default=UserRole.RESEARCHER, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    avatar_url = Column(String(500), nullable=True)
    institution = Column(String(255), nullable=True)
    department = Column(String(255), nullable=True)
    orcid = Column(String(100), nullable=True)
    research_interests = Column(JSON, default=[])
    last_login = Column(DateTime, nullable=True)
    
    profile = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")

class UserProfile(Base, TimestampMixin):
    __tablename__ = "user_profiles"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    bio = Column(Text, nullable=True)
    website = Column(String(500), nullable=True)
    github = Column(String(255), nullable=True)
    twitter = Column(String(255), nullable=True)
    google_scholar = Column(String(500), nullable=True)
    publications_count = Column(String(50), default="0")
    h_index = Column(String(50), nullable=True)
    citation_count = Column(String(50), nullable=True)
    
    user = relationship("User", back_populates="profile")
