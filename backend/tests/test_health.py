import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health(client: AsyncClient):
    r = await client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "healthy"


@pytest.mark.asyncio
async def test_root(client: AsyncClient):
    r = await client.get("/api/")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"
