def test_register_success(client):
    response = client.post("/register", json={
        "email": "test@example.com",
        "password": "secret123"
    })
    assert response.status_code == 201
    assert response.json()["email"] == "test@example.com"


def test_register_duplicate_email(client):
    client.post("/register", json={
        "email": "test@example.com",
        "password": "secret123"
    })
    response = client.post("/register", json={
        "email": "test@example.com",
        "password": "anotherpassword"
    })
    assert response.status_code == 400
    assert response.json()["detail"] == "Email already registered"


def test_login_success(client):
    client.post("/register", json={
        "email": "test@example.com",
        "password": "secret123"
    })
    response = client.post("/login", data={
        "username": "test@example.com",
        "password": "secret123"
    })
    assert response.status_code == 200
    assert "access_token" in response.json()
    assert response.json()["token_type"] == "bearer"


def test_login_wrong_password(client):
    client.post("/register", json={
        "email": "test@example.com",
        "password": "secret123"
    })
    response = client.post("/login", data={
        "username": "test@example.com",
        "password": "wrongpassword"
    })
    assert response.status_code == 401


def test_login_nonexistent_user(client):
    response = client.post("/login", data={
        "username": "nobody@example.com",
        "password": "secret123"
    })
    assert response.status_code == 401


def test_register_password_too_short(client):
    response = client.post("/register", json={
        "email": "test@example.com",
        "password": "abc"
    })
    assert response.status_code == 422


def test_register_password_exactly_8_characters(client):
    response = client.post("/register", json={
        "email": "test@example.com",
        "password": "exactly8"
    })
    assert response.status_code == 201


def test_register_empty_password(client):
    response = client.post("/register", json={
        "email": "test@example.com",
        "password": ""
    })
    assert response.status_code == 422


from auth import create_access_token

def test_malformed_token_sub_returns_401(client):
    bad_token = create_access_token(data={"sub": "not-a-number"})
    response = client.get("/bookmarks/", headers={"Authorization": f"Bearer {bad_token}"})
    assert response.status_code == 401
