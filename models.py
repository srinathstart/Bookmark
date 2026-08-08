from sqlalchemy import (
    Column,
    Integer,
    String,
    ForeignKey,
    DateTime,
    func
)
from database import Base

class Bookmark(Base):
    __tablename__ = "bookmarks"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    url = Column(
        String(2048),
        nullable=False
    )

    title = Column(
        String(255),
        nullable=False
    )

    description = Column(
        String(500),
        nullable=True
    )

    summary = Column(
        String(1000), 
        nullable=True
    )

    summary_status = Column(
        String(20),
        nullable=False,
        default="pending",
        server_default="pending"
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
