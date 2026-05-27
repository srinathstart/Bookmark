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


    model_config = {"from_attributes": True}

class UserCreate(BaseModel):
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

class User(BaseModel):
    id: int
    email: EmailStr

    model_config = {"from_attributes": True}

class Token(BaseModel):
    access_token: str
    token_type: str