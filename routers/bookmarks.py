from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db
import models
from schemas import BookmarkCreate, Bookmark
from auth import get_current_user

router = APIRouter(prefix="/bookmarks", tags=["bookmarks"])


# ✅ CREATE
@router.post("/", response_model=Bookmark)
def create_bookmark(
    bookmark: BookmarkCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    new_bookmark = models.Bookmark(
        url=str(bookmark.url),
        title=bookmark.title,
        description=bookmark.description,
        user_id=current_user.id
    )

    db.add(new_bookmark)
    db.commit()
    db.refresh(new_bookmark)

    return new_bookmark


# ✅ READ ALL
@router.get("/", response_model=list[Bookmark])
def get_bookmarks(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return (
        db.query(models.Bookmark)
        .filter(models.Bookmark.user_id == current_user.id)
        .all()
    )


# ✅ READ ONE
@router.get("/{bookmark_id}", response_model=Bookmark)
def get_bookmark(
    bookmark_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    bookmark = (
        db.query(models.Bookmark)
        .filter(
            models.Bookmark.id == bookmark_id,
            models.Bookmark.user_id == current_user.id
        )
        .first()
    )

    if bookmark is None:
        raise HTTPException(status_code=404, detail="Bookmark not found")

    return bookmark


# ✅ UPDATE
@router.put("/{bookmark_id}", response_model=Bookmark)
def update_bookmark(
    bookmark_id: int,
    updated: BookmarkCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    bookmark = (
        db.query(models.Bookmark)
        .filter(
            models.Bookmark.id == bookmark_id,
            models.Bookmark.user_id == current_user.id
        )
        .first()
    )

    if bookmark is None:
        raise HTTPException(status_code=404, detail="Bookmark not found")

    bookmark.url = str(updated.url)
    bookmark.title = updated.title
    bookmark.description = updated.description

    db.commit()
    db.refresh(bookmark)

    return bookmark


# ✅ DELETE
@router.delete("/{bookmark_id}")
def delete_bookmark(
    bookmark_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    bookmark = (
        db.query(models.Bookmark)
        .filter(
            models.Bookmark.id == bookmark_id,
            models.Bookmark.user_id == current_user.id
        )
        .first()
    )

    if bookmark is None:
        raise HTTPException(status_code=404, detail="Bookmark not found")

    db.delete(bookmark)
    db.commit()

    return {"message": "Bookmark deleted successfully"}
