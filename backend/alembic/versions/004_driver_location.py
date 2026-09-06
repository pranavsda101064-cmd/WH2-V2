"""add driver location tracking + ride pin

Revision ID: 004
Revises: 003
Create Date: 2026-09-06

"""
from alembic import op
import sqlalchemy as sa

revision = "004"
down_revision = "003_seed_data"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("rides", sa.Column("driver_lat", sa.Float, nullable=True))
    op.add_column("rides", sa.Column("driver_lng", sa.Float, nullable=True))
    op.add_column("rides", sa.Column("driver_heading", sa.Float, nullable=True))
    op.add_column("rides", sa.Column("driver_speed", sa.Float, nullable=True))
    op.add_column(
        "rides",
        sa.Column("location_updated_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column("rides", sa.Column("ride_pin", sa.String(4), nullable=True))


def downgrade() -> None:
    op.drop_column("rides", "ride_pin")
    op.drop_column("rides", "location_updated_at")
    op.drop_column("rides", "driver_speed")
    op.drop_column("rides", "driver_heading")
    op.drop_column("rides", "driver_lng")
    op.drop_column("rides", "driver_lat")
