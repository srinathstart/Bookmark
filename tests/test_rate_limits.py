def test_register_rate_limit_rejects_fourth_request(client, enabled_limiter):
    responses = [
        client.post(
            "/register",
            json={
                "email": f"rate-user-{number}@example.com",
                "password": "secret123",
            },
        )
        for number in range(1, 5)
    ]

    assert [response.status_code for response in responses[:3]] == [201, 201, 201]
    assert responses[3].status_code == 429
    assert responses[3].json()["error"] == "Rate limit exceeded: 3 per 1 minute"


def test_login_rate_limit_rejects_sixth_request(client, enabled_limiter):
    responses = [
        client.post(
            "/login",
            data={
                "username": "missing@example.com",
                "password": "secret123",
            },
        )
        for _ in range(6)
    ]

    assert [response.status_code for response in responses[:5]] == [401] * 5
    assert responses[5].status_code == 429
    assert responses[5].json()["error"] == "Rate limit exceeded: 5 per 1 minute"
