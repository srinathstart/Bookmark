from fastapi import FastAPI
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from database import engine
import models
from routers import bookmarks, users
from limiter import limiter

models.Base.metadata.create_all(bind=engine)

app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.include_router(bookmarks.router)
app.include_router(users.router)


@app.get("/")
def default():
    return {"message": "hello"}
