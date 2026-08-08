def get_auth_token(client, email="user@example.com", password="secret123"):
    client.post("/register", json={"email": email, "password": password})
    response = client.post("/login", data={"username": email, "password": password})
    return response.json()["access_token"]


def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


def test_create_bookmark(client):
    token = get_auth_token(client)
    response = client.post("/bookmarks/", json={
        "url": "https://example.com",
        "title": "Example Site",
        "description": "A test bookmark"
    }, headers=auth_headers(token))
    assert response.status_code == 201
    assert response.json()["title"] == "Example Site"
    assert response.json()["url"] == "https://example.com/"
    assert response.json()["summary_status"] == "pending"


def test_duplicate_url_rejected_for_same_user(client):
    token = get_auth_token(client)
    headers = auth_headers(token)

    first = client.post("/bookmarks/", json={"url": "https://example.com", "title": "First"},
                        headers=headers)
    assert first.status_code == 201

    second = client.post("/bookmarks/", json={"url": "https://example.com", "title": "Dup"},
                         headers=headers)
    assert second.status_code == 400
    assert second.json()["detail"] == "Bookmark already exists"


def test_same_url_allowed_for_different_users(client):
    token_a = get_auth_token(client, email="a@example.com")
    token_b = get_auth_token(client, email="b@example.com")

    a = client.post("/bookmarks/", json={"url": "https://example.com", "title": "A"},
                    headers=auth_headers(token_a))
    b = client.post("/bookmarks/", json={"url": "https://example.com", "title": "B"},
                    headers=auth_headers(token_b))
    assert a.status_code == 201
    assert b.status_code == 201


def test_create_bookmark_without_login(client):
    response = client.post("/bookmarks/", json={
        "url": "https://example.com",
        "title": "Example Site",
    })
    assert response.status_code == 401


def test_get_all_bookmarks(client):
    token = get_auth_token(client)
    headers = auth_headers(token)

    client.post("/bookmarks/", json={"url": "https://example.com", "title": "First"}, headers=headers)
    client.post("/bookmarks/", json={"url": "https://python.org", "title": "Python"}, headers=headers)

    response = client.get("/bookmarks/", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 2
    assert data["total"] == 2
    assert data["limit"] == 20
    assert data["offset"] == 0
    assert data["has_more"] is False


def test_user_cannot_see_other_users_bookmarks(client):
    token_a = get_auth_token(client, email="a@example.com")
    token_b = get_auth_token(client, email="b@example.com")

    client.post("/bookmarks/", json={"url": "https://example.com", "title": "User A bookmark"},
                headers=auth_headers(token_a))

    response = client.get("/bookmarks/", headers=auth_headers(token_b))
    assert response.status_code == 200
    assert response.json()["items"] == []
    assert response.json()["total"] == 0


def test_get_single_bookmark(client):
    token = get_auth_token(client)
    headers = auth_headers(token)

    created = client.post("/bookmarks/", json={"url": "https://example.com", "title": "Example"},
                          headers=headers).json()

    response = client.get(f"/bookmarks/{created['id']}", headers=headers)
    assert response.status_code == 200
    assert response.json()["id"] == created["id"]


def test_get_nonexistent_bookmark(client):
    token = get_auth_token(client)
    response = client.get("/bookmarks/999", headers=auth_headers(token))
    assert response.status_code == 404


def test_update_bookmark(client):
    token = get_auth_token(client)
    headers = auth_headers(token)

    created = client.post("/bookmarks/", json={"url": "https://example.com", "title": "Old Title"},
                          headers=headers).json()

    response = client.put(f"/bookmarks/{created['id']}", json={
        "url": "https://example.com",
        "title": "New Title"
    }, headers=headers)
    assert response.status_code == 200
    assert response.json()["title"] == "New Title"


def test_update_to_duplicate_url_rejected(client):
    token = get_auth_token(client)
    headers = auth_headers(token)

    client.post("/bookmarks/", json={"url": "https://example.com", "title": "A"}, headers=headers)
    b = client.post("/bookmarks/", json={"url": "https://python.org", "title": "B"},
                    headers=headers).json()

    # Try to point B at A's URL -> should be rejected
    response = client.put(f"/bookmarks/{b['id']}", json={
        "url": "https://example.com",
        "title": "B"
    }, headers=headers)
    assert response.status_code == 400
    assert response.json()["detail"] == "Bookmark already exists"


def test_update_keeping_same_url_is_allowed(client):
    token = get_auth_token(client)
    headers = auth_headers(token)

    created = client.post("/bookmarks/", json={"url": "https://example.com", "title": "Old"},
                          headers=headers).json()

    # Same URL, new title -> must NOT be treated as a duplicate of itself
    response = client.put(f"/bookmarks/{created['id']}", json={
        "url": "https://example.com",
        "title": "New"
    }, headers=headers)
    assert response.status_code == 200
    assert response.json()["title"] == "New"


def test_delete_bookmark(client):
    token = get_auth_token(client)
    headers = auth_headers(token)

    created = client.post("/bookmarks/", json={"url": "https://example.com", "title": "To Delete"},
                          headers=headers).json()

    response = client.delete(f"/bookmarks/{created['id']}", headers=headers)
    assert response.status_code == 204

    response = client.get(f"/bookmarks/{created['id']}", headers=headers)
    assert response.status_code == 404


def test_search_bookmarks(client):
    token = get_auth_token(client)
    headers = auth_headers(token)

    client.post("/bookmarks/", json={"url": "https://python.org", "title": "Python Docs"}, headers=headers)
    client.post("/bookmarks/", json={"url": "https://example.com", "title": "Example Site"}, headers=headers)

    response = client.get("/bookmarks/?search=python", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 1
    assert data["items"][0]["title"] == "Python Docs"
    assert data["total"] == 1


def test_bookmark_has_timestamps(client):
    token = get_auth_token(client)
    headers = auth_headers(token)

    created = client.post("/bookmarks/", json={"url": "https://example.com", "title": "Timed"},
                          headers=headers).json()

    assert created["created_at"] is not None
    assert created["updated_at"] is not None


def test_bookmarks_default_sort_is_newest_first(client):
    token = get_auth_token(client)
    headers = auth_headers(token)

    first = client.post("/bookmarks/", json={"url": "https://a.com", "title": "First"},
                        headers=headers).json()
    second = client.post("/bookmarks/", json={"url": "https://b.com", "title": "Second"},
                         headers=headers).json()

    response = client.get("/bookmarks/", headers=headers)
    ids = [b["id"] for b in response.json()["items"]]
    # Newest (second) should come before oldest (first)
    assert ids.index(second["id"]) < ids.index(first["id"])


def test_bookmarks_sort_by_title_ascending(client):
    token = get_auth_token(client)
    headers = auth_headers(token)

    client.post("/bookmarks/", json={"url": "https://a.com", "title": "Banana"}, headers=headers)
    client.post("/bookmarks/", json={"url": "https://b.com", "title": "Apple"}, headers=headers)

    response = client.get("/bookmarks/?sort_by=title&order=asc", headers=headers)
    titles = [b["title"] for b in response.json()["items"]]
    assert titles == ["Apple", "Banana"]


def test_bookmark_pagination_metadata_and_second_page(client):
    token = get_auth_token(client)
    headers = auth_headers(token)

    for number in range(1, 6):
        client.post(
            "/bookmarks/",
            json={"url": f"https://example{number}.com", "title": f"Bookmark {number}"},
            headers=headers,
        )

    response = client.get("/bookmarks/?limit=2&offset=2", headers=headers)
    data = response.json()

    assert response.status_code == 200
    assert len(data["items"]) == 2
    assert data["total"] == 5
    assert data["limit"] == 2
    assert data["offset"] == 2
    assert data["has_more"] is True


def test_bookmark_pagination_last_page_has_no_more(client):
    token = get_auth_token(client)
    headers = auth_headers(token)

    for number in range(1, 4):
        client.post(
            "/bookmarks/",
            json={"url": f"https://page{number}.com", "title": f"Page {number}"},
            headers=headers,
        )

    response = client.get("/bookmarks/?limit=2&offset=2", headers=headers)
    data = response.json()

    assert len(data["items"]) == 1
    assert data["total"] == 3
    assert data["has_more"] is False


def test_bookmarks_invalid_sort_field_rejected(client):
    token = get_auth_token(client)
    headers = auth_headers(token)

    response = client.get("/bookmarks/?sort_by=password", headers=headers)
    assert response.status_code == 422


def test_retry_summary_sets_pending_and_schedules_task(client, monkeypatch):
    token = get_auth_token(client)
    headers = auth_headers(token)
    created = client.post(
        "/bookmarks/",
        json={"url": "https://example.com", "title": "Retry me"},
        headers=headers,
    ).json()

    scheduled = []

    def record_summary_task(bookmark_id, url):
        scheduled.append((bookmark_id, url))

    from routers import bookmarks as bookmarks_router

    monkeypatch.setattr(bookmarks_router, "build_summary", record_summary_task)
    response = client.post(
        f"/bookmarks/{created['id']}/summary/retry",
        headers=headers,
    )

    assert response.status_code == 200
    assert response.json()["summary"] is None
    assert response.json()["summary_status"] == "pending"
    assert scheduled == [(created["id"], "https://example.com/")]


def test_user_cannot_retry_another_users_summary(client):
    token_a = get_auth_token(client, email="retry-a@example.com")
    token_b = get_auth_token(client, email="retry-b@example.com")
    created = client.post(
        "/bookmarks/",
        json={"url": "https://example.com", "title": "Private"},
        headers=auth_headers(token_a),
    ).json()

    response = client.post(
        f"/bookmarks/{created['id']}/summary/retry",
        headers=auth_headers(token_b),
    )

    assert response.status_code == 404
