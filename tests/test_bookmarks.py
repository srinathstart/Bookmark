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
    assert len(response.json()) == 2


def test_user_cannot_see_other_users_bookmarks(client):
    token_a = get_auth_token(client, email="a@example.com")
    token_b = get_auth_token(client, email="b@example.com")

    client.post("/bookmarks/", json={"url": "https://example.com", "title": "User A bookmark"},
                headers=auth_headers(token_a))

    response = client.get("/bookmarks/", headers=auth_headers(token_b))
    assert response.status_code == 200
    assert len(response.json()) == 0


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
    assert len(response.json()) == 1
    assert response.json()[0]["title"] == "Python Docs"
