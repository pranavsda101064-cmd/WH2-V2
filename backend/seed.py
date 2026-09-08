import logging
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from models import Package, Vehicle, DriverRequest

logger = logging.getLogger(__name__)

PACKAGES = [
    {"id": "p1", "title": "Misty Coffee Estates", "subtitle": "Full-day estate walk", "price": 2499, "duration": "8 hrs", "stops": 4, "image": "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=1200&q=70"},
    {"id": "p2", "title": "Bisle Ghat Viewpoint", "subtitle": "Sunrise ridge drive", "price": 1899, "duration": "5 hrs", "stops": 3, "image": "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?auto=format&fit=crop&w=1200&q=70"},
    {"id": "p3", "title": "Manjarabad Fort", "subtitle": "Star-shaped heritage", "price": 1499, "duration": "4 hrs", "stops": 2, "image": "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=70"},
    {"id": "p4", "title": "Hills & Homestays", "subtitle": "Overnight coffee stay", "price": 4999, "duration": "24 hrs", "stops": 5, "image": "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=70"},
    {"id": "p5", "title": "Hanbal Waterfall Trail", "subtitle": "Monsoon cascade", "price": 1799, "duration": "5 hrs", "stops": 2, "image": "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=1200&q=70"},
    {"id": "p6", "title": "Shanti Falls & Green Route", "subtitle": "Rainforest loop", "price": 2199, "duration": "6 hrs", "stops": 3, "image": "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=70"},
    {"id": "p7", "title": "Kukke Subrahmanya Temple", "subtitle": "Sacred hill drive", "price": 2899, "duration": "10 hrs", "stops": 3, "image": "https://images.unsplash.com/photo-1587922546925-160ad1cd3b2a?auto=format&fit=crop&w=1200&q=70"},
    {"id": "p8", "title": "Mookanamane Falls", "subtitle": "Off-road adventure", "price": 2299, "duration": "6 hrs", "stops": 2, "image": "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1200&q=70"},
    {"id": "p9", "title": "Sakleshpur Sunset Point", "subtitle": "Golden hour ridge", "price": 1299, "duration": "3 hrs", "stops": 1, "image": "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=70"},
    {"id": "p10", "title": "Green Route Railway Walk", "subtitle": "Abandoned viaducts", "price": 2599, "duration": "7 hrs", "stops": 4, "image": "https://images.unsplash.com/photo-1418065460487-3956c3465ee2?auto=format&fit=crop&w=1200&q=70"},
]

VEHICLES = [
    {"id": "v1", "name": "Sedan", "desc": "Comfortable, AC", "seats": 4, "fare": 2199, "eta": "3 min", "icon": "car-outline"},
    {"id": "v2", "name": "SUV", "desc": "Extra space, hill-ready", "seats": 6, "fare": 2899, "eta": "5 min", "icon": "car-sport-outline"},
    {"id": "v3", "name": "Traveller", "desc": "Group minivan", "seats": 12, "fare": 4499, "eta": "8 min", "icon": "bus-outline"},
    {"id": "v4", "name": "Premium", "desc": "Executive class", "seats": 4, "fare": 3499, "eta": "6 min", "icon": "car-outline"},
]

DRIVER_REQUESTS = [
    {"id": "r1", "pickup": "Sakleshpura Bus Stand", "drop": "Bisle Ghat Viewpoint", "distance": "46 km", "duration": "1h 40m", "fare": 2199, "rider": "Aditi S.", "rating": 4.9, "tag": "3 stops"},
    {"id": "r2", "pickup": "Green Route Homestay", "drop": "Manjarabad Fort", "distance": "12 km", "duration": "22 min", "fare": 899, "rider": "Rohit K.", "rating": 4.8, "tag": "Direct"},
    {"id": "r3", "pickup": "Coffee Estate Retreat", "drop": "Hanbal Falls", "distance": "18 km", "duration": "32 min", "fare": 1499, "rider": "Priya M.", "rating": 5.0, "tag": "2 stops"},
]


async def seed_database(session: AsyncSession) -> None:
    """Idempotent seed — only inserts if tables are empty."""

    # Seed packages
    result = await session.execute(select(func.count()).select_from(Package))
    if result.scalar() == 0:
        for p in PACKAGES:
            session.add(Package(**p))
        await session.commit()
        logger.info("Seeded %d packages", len(PACKAGES))

    # Seed vehicles
    result = await session.execute(select(func.count()).select_from(Vehicle))
    if result.scalar() == 0:
        for v in VEHICLES:
            session.add(Vehicle(**v))
        await session.commit()
        logger.info("Seeded %d vehicles", len(VEHICLES))

    # Seed driver requests (legacy demo data — no ride_id, filtered out by driver requests endpoint)
    result = await session.execute(select(func.count()).select_from(DriverRequest))
    if result.scalar() == 0:
        for r in DRIVER_REQUESTS:
            session.add(DriverRequest(**r))
        await session.commit()
        logger.info("Seeded %d driver requests (demo only)", len(DRIVER_REQUESTS))
