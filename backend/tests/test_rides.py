import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_ride(client: AsyncClient, auth_header):
    r = await client.post("/api/rides", json={
        "vehicle_id": "v1",
        "stops": [{"label": "Sakleshpura", "sub": "Pickup"}],
        "payment_method": "card",
        "tip": 0,
    }, headers=auth_header)
    assert r.status_code == 200
    data = r.json()
    assert data["vehicle_id"] == "v1"
    assert data["status"] == "pending"
    assert data["fare"] == 840  # server-computed: 800 base + 5% GST


@pytest.mark.asyncio
async def test_create_ride_no_auth(client: AsyncClient):
    r = await client.post("/api/rides", json={
        "vehicle_id": "v1",
        "stops": [{"label": "Sakleshpura"}],
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
        "payment_method": "upi",
        "tip": 50,
    }, headers=auth_header)
    assert create.status_code == 200
    ride_id = create.json()["id"]

    r = await client.get(f"/api/rides/{ride_id}", headers=auth_header)
    assert r.status_code == 200
    # v2 fare = 1200, no extra stops fee, 5% GST = round(1200*0.05) = 60, total = 1260
    assert r.json()["fare"] == 1260


@pytest.mark.asyncio
async def test_update_ride_status(client: AsyncClient, auth_header):
    create = await client.post("/api/rides", json={
        "vehicle_id": "v1",
        "stops": [{"label": "X"}],
        "payment_method": "card",
    }, headers=auth_header)
    ride_id = create.json()["id"]

    # Customer can only cancel
    r = await client.patch(f"/api/rides/{ride_id}/status", json={
        "status": "cancelled",
    }, headers=auth_header)
    assert r.status_code == 200
    assert r.json()["status"] == "cancelled"


@pytest.mark.asyncio
async def test_update_ride_status_forbidden(client: AsyncClient, auth_header):
    create = await client.post("/api/rides", json={
        "vehicle_id": "v1",
        "stops": [{"label": "X"}],
        "payment_method": "card",
    }, headers=auth_header)
    ride_id = create.json()["id"]

    # Customer cannot set driver-only statuses
    r = await client.patch(f"/api/rides/{ride_id}/status", json={
        "status": "onboard",
    }, headers=auth_header)
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_get_ride_ownership(client: AsyncClient, auth_header, driver_header):
    create = await client.post("/api/rides", json={
        "vehicle_id": "v1",
        "stops": [{"label": "X"}],
        "payment_method": "card",
    }, headers=auth_header)
    ride_id = create.json()["id"]

    # Different user cannot view this ride
    r = await client.get(f"/api/rides/{ride_id}", headers=driver_header)
    assert r.status_code == 403
