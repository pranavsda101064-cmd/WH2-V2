import asyncio
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from database import get_db
from models import Base
from server import app, limiter

TEST_DB_URL = "sqlite+aiosqlite:///:memory:"
engine = create_async_engine(TEST_DB_URL, echo=False)
TestSession = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


async def override_get_db():
    async with TestSession() as session:
        yield session
        await session.commit()


app.dependency_overrides[get_db] = override_get_db


@pytest_asyncio.fixture(autouse=True)
def disable_rate_limiting():
    limiter.enabled = False
    yield
    limiter.enabled = True


@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


@pytest_asyncio.fixture
async def auth_header(client: AsyncClient):
    r = await client.post("/api/auth/register", json={
        "email": "test@example.com",
        "password": "password123",
    })
    token = r.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
