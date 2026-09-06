import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_submit_rating(client: AsyncClient, auth_header):
    create = await client.post("/api/rides", json={
        "vehicle_id": "v1",
        "stops": [{"label": "A"}],
        "fare": 500,
        "payment_method": "card",
    }, headers=auth_header)
    ride_id = create.json()["id"]

    r = await client.post("/api/ratings", json={
        "ride_id": ride_id,
        "stars": 5,
        "tags": ["great", "friendly"],
        "note": "Excellent ride!",
        "tip": 100,
    }, headers=auth_header)
    assert r.status_code == 200
    data = r.json()
    assert data["stars"] == 5
    assert data["tip"] == 100


@pytest.mark.asyncio
async def test_rating_nonexistent_ride(client: AsyncClient, auth_header):
    r = await client.post("/api/ratings", json={
        "ride_id": "fake-ride-id",
        "stars": 4,
    }, headers=auth_header)
    assert r.status_code == 404
