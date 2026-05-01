from fastapi import FastAPI, HTTPException, Depends
from sqlalchemy.orm import Session
from schemas import BookmarkCreate, Bookmark
from database import engine, get_db
import models

# create tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI()


@app.get("/")
def default():
    return {"message": "hello"}


@app.get("/hello/{name}")
def greet(name: str):
    return {"message": f"hello {name}"}


# ✅ CREATE
@app.post("/bookmarks", response_model=Bookmark)
def create_bookmark(bookmark: BookmarkCreate, db: Session = Depends(get_db)):
    new_bookmark = models.Bookmark(
        url=bookmark.url,
        title=bookmark.title,
        description=bookmark.description
    )

    db.add(new_bookmark)
    db.commit()
    db.refresh(new_bookmark)

    return new_bookmark


# ✅ READ ALL
@app.get("/bookmarks", response_model=list[Bookmark])
def get_bookmarks(db: Session = Depends(get_db)):
    return db.query(models.Bookmark).all()


# ✅ READ ONE
@app.get("/bookmarks/{bookmark_id}", response_model=Bookmark)
def get_bookmark(bookmark_id: int, db: Session = Depends(get_db)):
    bookmark = (
        db.query(models.Bookmark)
        .filter(models.Bookmark.id == bookmark_id)
        .first()
    )

    if bookmark is None:
        raise HTTPException(status_code=404, detail="Bookmark not found")

    return bookmark


# ✅ UPDATE
@app.put("/bookmarks/{bookmark_id}", response_model=Bookmark)
def update_bookmark(
    bookmark_id: int,
    updated: BookmarkCreate,
    db: Session = Depends(get_db)
):
    bookmark = (
        db.query(models.Bookmark)
        .filter(models.Bookmark.id == bookmark_id)
        .first()
    )

    if bookmark is None:
        raise HTTPException(status_code=404, detail="Bookmark not found")

    bookmark.url = updated.url
    bookmark.title = updated.title
    bookmark.description = updated.description

    db.commit()
    db.refresh(bookmark)

    return bookmark


# ✅ DELETE
@app.delete("/bookmarks/{bookmark_id}")
def delete_bookmark(bookmark_id: int, db: Session = Depends(get_db)):
    bookmark = (
        db.query(models.Bookmark)
        .filter(models.Bookmark.id == bookmark_id)
        .first()
    )

    if bookmark is None:
        raise HTTPException(status_code=404, detail="Bookmark not found")

    db.delete(bookmark)
    db.commit()

    return {"message": "Bookmark deleted successfully"}