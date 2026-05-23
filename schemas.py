from pydantic import BaseModel, HttpUrl, EmailStr

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

class User(BaseModel):
    id: int
    email: EmailStr

    model_config = {"from_attributes": True}

class Token(BaseModel):
    access_token: str
    token_type: str