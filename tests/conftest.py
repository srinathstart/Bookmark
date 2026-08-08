import os

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# database.py creates its engine when it is imported. Set the test URL before
# importing main so test collection can never initialize the configured MySQL
# database from .env.
TEST_DATABASE_URL = "sqlite://"
os.environ["DATABASE_URL"] = TEST_DATABASE_URL

from main import app
from database import Base, get_db
from limiter import limiter
from routers import bookmarks as bookmarks_router
from services import ai

# Rate limiting is a production concern; disable it so test volume
# doesn't trip the per-minute caps on /register and /login.
limiter.enabled = False

# StaticPool makes every test session share the same in-memory SQLite
# connection. check_same_thread=False allows TestClient's worker thread to use
# that connection.
engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


# Tell FastAPI to use the test database instead of the real one
app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def isolated_test_environment(monkeypatch):
    # CRUD/auth tests should not fetch real websites or call Ollama. The
    # background worker receives the same isolated SQLite session factory so
    # it can safely persist failed status during those tests. AI tests replace
    # these mocks with their own controlled behavior.
    monkeypatch.setattr(bookmarks_router, "fetch_page_text", lambda url: None)
    monkeypatch.setattr(bookmarks_router, "SessionLocal", TestingSessionLocal)
    # Unit tests use controlled DNS answers and never resolve real hostnames.
    monkeypatch.setattr(
        ai,
        "_resolve_host_addresses",
        lambda hostname, port: {ai.ipaddress.ip_address("93.184.216.34")},
    )

    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client():
    return TestClient(app)


@pytest.fixture()
def db_session():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture()
def enabled_limiter():
    previous_state = limiter.enabled
    limiter.reset()
    limiter.enabled = True
    try:
        yield
    finally:
        limiter.enabled = previous_state
        limiter.reset()
