from typing import Literal
from fastapi import APIRouter, HTTPException, Depends, Query, BackgroundTasks
from sqlalchemy.orm import Session
from database import get_db, SessionLocal
import models
from schemas import BookmarkCreate, Bookmark
from auth import get_current_user
from services.ai import fetch_page_text, generate_summary

router = APIRouter(prefix="/bookmarks", tags=["bookmarks"])


def build_summary(bookmark_id: int, url: str) -> None:
    """
    Fetch the page and generate a summary, then save it to the bookmark.

    Runs as a background task after the response is sent, so it opens its
    own DB session (the request's session is already closed by then).
    """
    page_text = fetch_page_text(url)
    summary = generate_summary(page_text) if page_text else None
    if summary is None:
        return

    db = SessionLocal()
    try:
        bookmark = (
            db.query(models.Bookmark)
            .filter(models.Bookmark.id == bookmark_id)
            .first()
        )
        # The bookmark may have been deleted or its URL changed again
        # while we were working; only write if it still points at this URL.
        if bookmark is not None and bookmark.url == url:
            bookmark.summary = summary
            db.commit()
    finally:
        db.close()


# ✅ CREATE
@router.post("/", response_model=Bookmark, status_code=201)
def create_bookmark(
    bookmark: BookmarkCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    url_str = str(bookmark.url)

    new_bookmark = models.Bookmark(
        url=url_str,
        title=bookmark.title,
        description=bookmark.description,
        summary=None,
        user_id=current_user.id
    )

    db.add(new_bookmark)
    db.commit()
    db.refresh(new_bookmark)

    # Generate the summary off the request path so saving feels instant;
    # the summary is filled in shortly after and shows up on a later GET.
    background_tasks.add_task(build_summary, new_bookmark.id, url_str)

    return new_bookmark


# ✅ READ ALL
SORT_COLUMNS = {
    "created_at": models.Bookmark.created_at,
    "updated_at": models.Bookmark.updated_at,
    "title": models.Bookmark.title,
}


@router.get("/", response_model=list[Bookmark])
def get_bookmarks(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    search: str | None = None,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    sort_by: Literal["created_at", "updated_at", "title"] = "created_at",
    order: Literal["asc", "desc"] = "desc"
):
    query = (
        db.query(models.Bookmark)
        .filter(models.Bookmark.user_id == current_user.id)
    )

    if search:
        query = query.filter(
            models.Bookmark.title.ilike(f"%{search}%")
        )

    sort_column = SORT_COLUMNS[sort_by]
    if order == "desc":
        query = query.order_by(sort_column.desc(), models.Bookmark.id.desc())
    else:
        query = query.order_by(sort_column.asc(), models.Bookmark.id.asc())

    return query.offset(offset).limit(limit).all()


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
    background_tasks: BackgroundTasks,
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

    new_url = str(updated.url)
    url_changed = new_url != bookmark.url
    if url_changed:
        # Old summary is stale once the URL changes; clear it and
        # regenerate off the request path.
        bookmark.summary = None

    bookmark.url = new_url
    bookmark.title = updated.title
    bookmark.description = updated.description

    db.commit()
    db.refresh(bookmark)

    if url_changed:
        background_tasks.add_task(build_summary, bookmark.id, new_url)

    return bookmark


# ✅ DELETE
@router.delete("/{bookmark_id}", status_code=204)
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
