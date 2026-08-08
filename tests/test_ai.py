import httpx

import models
from routers import bookmarks as bookmarks_router
from services import ai
from tests.conftest import TestingSessionLocal


def make_response(status_code: int, **kwargs) -> httpx.Response:
    """Build an httpx response that also supports raise_for_status()."""
    return httpx.Response(
        status_code,
        request=httpx.Request("GET", "https://example.com"),
        **kwargs,
    )


def test_fetch_page_text_extracts_readable_html(monkeypatch):
    html = """
    <html>
      <head><style>hidden style</style></head>
      <body>
        <nav>hidden navigation</nav>
        <main><h1>Useful title</h1><p>Useful paragraph.</p></main>
        <script>hidden script</script>
      </body>
    </html>
    """
    response = make_response(
        200,
        text=html,
        headers={"content-type": "text/html; charset=utf-8"},
    )
    monkeypatch.setattr(ai.httpx, "get", lambda *args, **kwargs: response)

    result = ai.fetch_page_text("https://example.com")

    assert result == "Useful title Useful paragraph."


def test_fetch_page_text_rejects_non_html(monkeypatch):
    response = make_response(
        200,
        content=b"not an HTML document",
        headers={"content-type": "application/pdf"},
    )
    monkeypatch.setattr(ai.httpx, "get", lambda *args, **kwargs: response)

    assert ai.fetch_page_text("https://example.com/file.pdf") is None


def test_fetch_page_text_handles_request_failure(monkeypatch):
    def fail(*args, **kwargs):
        raise httpx.ConnectError("connection failed")

    monkeypatch.setattr(ai.httpx, "get", fail)

    assert ai.fetch_page_text("https://example.com") is None


def test_fetch_page_text_rejects_private_ip_before_request(monkeypatch):
    request_was_made = False

    def unexpected_request(*args, **kwargs):
        nonlocal request_was_made
        request_was_made = True

    monkeypatch.setattr(
        ai,
        "_resolve_host_addresses",
        lambda hostname, port: {ai.ipaddress.ip_address("127.0.0.1")},
    )
    monkeypatch.setattr(ai.httpx, "get", unexpected_request)

    assert ai.fetch_page_text("http://localhost/admin") is None
    assert request_was_made is False


def test_fetch_page_text_rejects_redirect_to_private_host(monkeypatch):
    requested_urls = []

    def resolve(hostname, port):
        address = "10.0.0.5" if hostname == "internal.example" else "93.184.216.34"
        return {ai.ipaddress.ip_address(address)}

    def fake_get(url, **kwargs):
        requested_urls.append(url)
        return make_response(302, headers={"location": "http://internal.example/admin"})

    monkeypatch.setattr(ai, "_resolve_host_addresses", resolve)
    monkeypatch.setattr(ai.httpx, "get", fake_get)

    assert ai.fetch_page_text("https://example.com") is None
    assert requested_urls == ["https://example.com"]


def test_fetch_page_text_rejects_oversized_page(monkeypatch):
    response = make_response(
        200,
        content=b"x" * (ai.MAX_PAGE_BYTES + 1),
        headers={"content-type": "text/html"},
    )
    monkeypatch.setattr(ai.httpx, "get", lambda *args, **kwargs: response)

    assert ai.fetch_page_text("https://example.com") is None


def test_generate_summary_returns_model_response(monkeypatch):
    response = make_response(200, json={"response": "  A short summary.  "})
    monkeypatch.setattr(ai.httpx, "post", lambda *args, **kwargs: response)

    assert ai.generate_summary("Page text") == "A short summary."


def test_generate_summary_handles_ollama_failure(monkeypatch):
    def fail(*args, **kwargs):
        raise httpx.ConnectError("Ollama unavailable")

    monkeypatch.setattr(ai.httpx, "post", fail)

    assert ai.generate_summary("Page text") is None


def test_build_summary_saves_generated_summary(db_session, monkeypatch):
    user = models.User(email="summary@example.com", hashed_password="unused")
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    bookmark = models.Bookmark(
        url="https://example.com/",
        title="Example",
        user_id=user.id,
    )
    db_session.add(bookmark)
    db_session.commit()
    db_session.refresh(bookmark)

    monkeypatch.setattr(bookmarks_router, "SessionLocal", TestingSessionLocal)
    monkeypatch.setattr(bookmarks_router, "fetch_page_text", lambda url: "Page text")
    monkeypatch.setattr(bookmarks_router, "generate_summary", lambda text: "Generated summary")

    bookmarks_router.build_summary(bookmark.id, bookmark.url)
    db_session.refresh(bookmark)

    assert bookmark.summary == "Generated summary"
    assert bookmark.summary_status == "completed"


def test_build_summary_marks_failure(db_session, monkeypatch):
    user = models.User(email="failed@example.com", hashed_password="unused")
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    bookmark = models.Bookmark(
        url="https://example.com/",
        title="Example",
        user_id=user.id,
    )
    db_session.add(bookmark)
    db_session.commit()
    db_session.refresh(bookmark)

    monkeypatch.setattr(bookmarks_router, "SessionLocal", TestingSessionLocal)
    monkeypatch.setattr(bookmarks_router, "fetch_page_text", lambda url: None)

    bookmarks_router.build_summary(bookmark.id, bookmark.url)
    db_session.refresh(bookmark)

    assert bookmark.summary is None
    assert bookmark.summary_status == "failed"


def test_build_summary_does_not_overwrite_after_url_change(db_session, monkeypatch):
    user = models.User(email="changed@example.com", hashed_password="unused")
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    bookmark = models.Bookmark(
        url="https://new.example.com/",
        title="Changed",
        user_id=user.id,
    )
    db_session.add(bookmark)
    db_session.commit()
    db_session.refresh(bookmark)

    monkeypatch.setattr(bookmarks_router, "SessionLocal", TestingSessionLocal)
    monkeypatch.setattr(bookmarks_router, "fetch_page_text", lambda url: "Old page text")
    monkeypatch.setattr(bookmarks_router, "generate_summary", lambda text: "Stale summary")

    bookmarks_router.build_summary(bookmark.id, "https://old.example.com/")
    db_session.refresh(bookmark)

    assert bookmark.summary is None
    assert bookmark.summary_status == "pending"
