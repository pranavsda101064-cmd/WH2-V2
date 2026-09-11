"""update vehicle fares to per-km rates

Revision ID: 008
Revises: 007
Create Date: 2026-09-11

"""
from alembic import op

revision = "008"
down_revision = "007"
branch_labels = None
depends_on = None

VEHICLE_FARES = {"v1": 12, "v2": 18, "v3": 25, "v4": 35}


def upgrade() -> None:
    for vid, fare in VEHICLE_FARES.items():
        op.execute(f"UPDATE vehicles SET fare = {fare} WHERE id = '{vid}'")


def downgrade() -> None:
    pass
