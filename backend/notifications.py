"""Push notification utilities using Expo Push API."""

import logging
from typing import Any

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models import User

logger = logging.getLogger("notifications")

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"


async def send_push(token: str, title: str, body: str, data: dict[str, Any] | None = None) -> bool:
    """Send a push notification via Expo Push API. Returns True on success."""
    payload = {
        "to": token,
        "title": title,
        "body": body,
        "data": data or {},
        "sound": "default",
        "priority": "high",
    }
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(EXPO_PUSH_URL, json=payload)
            resp.raise_for_status()
            result = resp.json()
            if result.get("data", {}).get("status") == "ok":
                return True
            logger.warning("Expo push returned non-ok: %s", result)
            return False
    except Exception as exc:
        logger.error("send_push failed: %s", exc)
        return False


async def notify_drivers(db: AsyncSession, title: str, body: str, data: dict[str, Any] | None = None) -> int:
    """Send push notification to all drivers with a registered push token. Returns count sent."""
    result = await db.execute(
        select(User.id, User.push_token).where(
            User.role == "driver",
            User.push_token.isnot(None),
        )
    )
    rows = result.all()
    sent = 0
    for user_id, token in rows:
        if token:
            ok = await send_push(token, title, body, data or {})
            if ok:
                sent += 1
    if sent:
        logger.info("Notified %d drivers: %s", sent, title)
    return sent


async def notify_user(db: AsyncSession, user_id: str, title: str, body: str, data: dict[str, Any] | None = None) -> bool:
    """Send push notification to a specific user. Returns True on success."""
    result = await db.execute(select(User.push_token).where(User.id == user_id))
    token = result.scalar_one_or_none()
    if not token:
        return False
    ok = await send_push(token, title, body, data or {})
    if ok:
        logger.info("Notified user %s: %s", user_id, title)
    return ok
