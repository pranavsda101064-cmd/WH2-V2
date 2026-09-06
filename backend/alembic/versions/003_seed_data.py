"""Seed packages, vehicles, and driver requests

Revision ID: 003_seed_data
Revises: 002_driver_onboarding
Create Date: 2026-09-06
"""
from alembic import op
import sqlalchemy as sa

revision = "003_seed_data"
down_revision = "002_driver_onboarding"
branch_labels = None
depends_on = None

PACKAGES = [
    ("p1", "Misty Coffee Estates", "Full-day estate walk", 2499, "8 hrs", 4, "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=1200&q=70"),
    ("p2", "Bisle Ghat Viewpoint", "Sunrise ridge drive", 1899, "5 hrs", 3, "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?auto=format&fit=crop&w=1200&q=70"),
    ("p3", "Manjarabad Fort", "Star-shaped heritage", 1499, "4 hrs", 2, "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=70"),
    ("p4", "Hills & Homestays", "Overnight coffee stay", 4999, "24 hrs", 5, "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=70"),
    ("p5", "Hanbal Waterfall Trail", "Monsoon cascade", 1799, "5 hrs", 2, "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=1200&q=70"),
    ("p6", "Shanti Falls & Green Route", "Rainforest loop", 2199, "6 hrs", 3, "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=70"),
    ("p7", "Kukke Subrahmanya Temple", "Sacred hill drive", 2899, "10 hrs", 3, "https://images.unsplash.com/photo-1587922546925-160ad1cd3b2a?auto=format&fit=crop&w=1200&q=70"),
    ("p8", "Mookanamane Falls", "Off-road adventure", 2299, "6 hrs", 2, "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1200&q=70"),
    ("p9", "Sakleshpur Sunset Point", "Golden hour ridge", 1299, "3 hrs", 1, "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=70"),
    ("p10", "Green Route Railway Walk", "Abandoned viaducts", 2599, "7 hrs", 4, "https://images.unsplash.com/photo-1418065460487-3956c3465ee2?auto=format&fit=crop&w=1200&q=70"),
]

VEHICLES = [
    ("v1", "Sedan", "Comfortable, AC", 4, 2199, "3 min", "car-outline"),
    ("v2", "SUV", "Extra space, hill-ready", 6, 2899, "5 min", "car-sport-outline"),
    ("v3", "Traveller", "Group minivan", 12, 4499, "8 min", "bus-outline"),
    ("v4", "Premium", "Executive class", 4, 3499, "6 min", "car-outline"),
]

DRIVER_REQUESTS = [
    ("r1", "Sakleshpura Bus Stand", "Bisle Ghat Viewpoint", "46 km", "1h 40m", 2199, "Aditi S.", 4.9, "3 stops"),
    ("r2", "Green Route Homestay", "Manjarabad Fort", "12 km", "22 min", 899, "Rohit K.", 4.8, "Direct"),
    ("r3", "Coffee Estate Retreat", "Hanbal Falls", "18 km", "32 min", 1499, "Priya M.", 5.0, "2 stops"),
]


def upgrade() -> None:
    conn = op.get_bind()

    result = conn.execute(sa.text("SELECT COUNT(*) FROM packages"))
    if result.scalar() == 0:
        for p in PACKAGES:
            conn.execute(sa.text(
                "INSERT INTO packages (id, title, subtitle, price, duration, stops, image) "
                "VALUES (:id, :title, :subtitle, :price, :duration, :stops, :image)"
            ), {"id": p[0], "title": p[1], "subtitle": p[2], "price": p[3], "duration": p[4], "stops": p[5], "image": p[6]})

    result = conn.execute(sa.text("SELECT COUNT(*) FROM vehicles"))
    if result.scalar() == 0:
        for v in VEHICLES:
            conn.execute(sa.text(
                "INSERT INTO vehicles (id, name, \"desc\", seats, fare, eta, icon) "
                "VALUES (:id, :name, :desc, :seats, :fare, :eta, :icon)"
            ), {"id": v[0], "name": v[1], "desc": v[2], "seats": v[3], "fare": v[4], "eta": v[5], "icon": v[6]})

    result = conn.execute(sa.text("SELECT COUNT(*) FROM driver_requests"))
    if result.scalar() == 0:
        for r in DRIVER_REQUESTS:
            conn.execute(sa.text(
                "INSERT INTO driver_requests (id, pickup, drop, distance, duration, fare, rider, rating, tag) "
                "VALUES (:id, :pickup, :drop, :distance, :duration, :fare, :rider, :rating, :tag)"
            ), {"id": r[0], "pickup": r[1], "drop": r[2], "distance": r[3], "duration": r[4], "fare": r[5], "rider": r[6], "rating": r[7], "tag": r[8]})


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text("DELETE FROM driver_requests"))
    conn.execute(sa.text("DELETE FROM vehicles"))
    conn.execute(sa.text("DELETE FROM packages"))
