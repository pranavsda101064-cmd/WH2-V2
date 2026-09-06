import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register(client: AsyncClient):
    r = await client.post("/api/auth/register", json={
        "email": "new@example.com",
        "password": "password123",
    })
    assert r.status_code == 200
    data = r.json()
    assert "access_token" in data
    assert data["user"]["email"] == "new@example.com"


@pytest.mark.asyncio
async def test_register_duplicate(client: AsyncClient):
    payload = {"email": "dup@example.com", "password": "password123"}
    await client.post("/api/auth/register", json=payload)
    r = await client.post("/api/auth/register", json=payload)
    assert r.status_code == 400


@pytest.mark.asyncio
async def test_login(client: AsyncClient):
    await client.post("/api/auth/register", json={
        "email": "login@example.com",
        "password": "password123",
    })
    r = await client.post("/api/auth/login", json={
        "email": "login@example.com",
        "password": "password123",
    })
    assert r.status_code == 200
    assert "access_token" in r.json()


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient):
    await client.post("/api/auth/register", json={
        "email": "wrong@example.com",
        "password": "password123",
    })
    r = await client.post("/api/auth/login", json={
        "email": "wrong@example.com",
        "password": "badpassword",
    })
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_me(client: AsyncClient, auth_header):
    r = await client.get("/api/auth/me", headers=auth_header)
    assert r.status_code == 200
    assert r.json()["email"] == "test@example.com"


@pytest.mark.asyncio
async def test_me_no_auth(client: AsyncClient):
    r = await client.get("/api/auth/me")
    assert r.status_code == 401
