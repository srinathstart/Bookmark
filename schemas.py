from datetime import datetime
from pydantic import BaseModel, HttpUrl, EmailStr, field_validator

class BookmarkCreate(BaseModel):
    url: HttpUrl
    title: str
    description: str | None = None


class Bookmark(BaseModel):
    id: int
    url: str
    title: str
    description: str | None
    summary: str | None = None
    created_at: datetime
    updated_at: datetime


    model_config = {"from_attributes": True}

class UserCreate(BaseModel):
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if len(v.encode("utf-8")) > 72:
            raise ValueError("Password must be at most 72 bytes")
        return v

class User(BaseModel):
    id: int
    email: EmailStr

    model_config = {"from_attributes": True}

class Token(BaseModel):
    access_token: str
    token_type: str