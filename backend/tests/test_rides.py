import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_ride(client: AsyncClient, auth_header):
    r = await client.post("/api/rides", json={
        "vehicle_id": "v1",
        "stops": [{"label": "Sakleshpura", "sub": "Pickup"}],
        "fare": 500,
        "payment_method": "card",
        "tip": 0,
    }, headers=auth_header)
    assert r.status_code == 200
    data = r.json()
    assert data["vehicle_id"] == "v1"
    assert data["status"] == "pending"


@pytest.mark.asyncio
async def test_create_ride_no_auth(client: AsyncClient):
    r = await client.post("/api/rides", json={
        "vehicle_id": "v1",
        "stops": [{"label": "Sakleshpura"}],
        "fare": 500,
        "payment_method": "card",
    })
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_list_rides(client: AsyncClient, auth_header):
    r = await client.get("/api/rides", headers=auth_header)
    assert r.status_code == 200
    assert isinstance(r.json(), list)


@pytest.mark.asyncio
async def test_create_and_get_ride(client: AsyncClient, auth_header):
    create = await client.post("/api/rides", json={
        "vehicle_id": "v2",
        "stops": [{"label": "A", "sub": "B"}],
        "fare": 1000,
        "payment_method": "upi",
        "tip": 50,
    }, headers=auth_header)
    ride_id = create.json()["id"]

    r = await client.get(f"/api/rides/{ride_id}", headers=auth_header)
    assert r.status_code == 200
    assert r.json()["fare"] == 1000


@pytest.mark.asyncio
async def test_update_ride_status(client: AsyncClient, auth_header):
    create = await client.post("/api/rides", json={
        "vehicle_id": "v1",
        "stops": [{"label": "X"}],
        "fare": 600,
        "payment_method": "card",
    }, headers=auth_header)
    ride_id = create.json()["id"]

    r = await client.patch(f"/api/rides/{ride_id}/status", json={
        "status": "onboard",
    }, headers=auth_header)
    assert r.status_code == 200
    assert r.json()["status"] == "onboard"
