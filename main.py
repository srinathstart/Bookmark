import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from database import engine
import models
from routers import bookmarks, users
from limiter import limiter

load_dotenv()

DEFAULT_FRONTEND_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]


def parse_frontend_origins(value: str | None) -> list[str]:
    """Parse a comma-separated CORS origin list with local defaults."""
    if not value:
        return DEFAULT_FRONTEND_ORIGINS.copy()

    origins = [origin.strip().rstrip("/") for origin in value.split(",")]
    return [origin for origin in origins if origin]


frontend_origins = parse_frontend_origins(os.getenv("FRONTEND_ORIGINS"))

models.Base.metadata.create_all(bind=engine)

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.include_router(bookmarks.router)
app.include_router(users.router)


@app.get("/")
def default():
    return {"message": "hello"}
