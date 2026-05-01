from pydantic import BaseModel, HttpUrl

class BookmarkCreate(BaseModel):
    url: HttpUrl
    title: str
    description: str | None = None


class Bookmark(BaseModel):
    id: int
    url: str
    title: str
    description: str | None

    model_config = {"from_attributes": True}