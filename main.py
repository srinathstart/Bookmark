from fastapi import FastAPI
from database import engine
import models
from routers import bookmarks, users

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

app.include_router(bookmarks.router)
app.include_router(users.router)


@app.get("/")
def default():
    return {"message": "hello"}
