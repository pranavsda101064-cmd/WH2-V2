import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_driver_requests(client: AsyncClient, auth_header):
    r = await client.get("/api/driver/requests", headers=auth_header)
    assert r.status_code == 200
    assert isinstance(r.json(), list)


@pytest.mark.asyncio
async def test_driver_stats(client: AsyncClient, auth_header):
    r = await client.get("/api/driver/stats", headers=auth_header)
    assert r.status_code == 200
    data = r.json()
    assert "earnings" in data
    assert "trips" in data
    assert "hours" in data
