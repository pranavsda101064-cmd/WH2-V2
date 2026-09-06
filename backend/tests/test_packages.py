import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_packages(client: AsyncClient):
    r = await client.get("/api/packages")
    assert r.status_code == 200
    assert isinstance(r.json(), list)
