"""add driver is_online column

Revision ID: 007
Revises: 006
Create Date: 2026-09-11

"""
from alembic import op
import sqlalchemy as sa

revision = "007"
down_revision = "006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "driver_profiles",
        sa.Column("is_online", sa.Boolean(), nullable=False, server_default="false"),
    )


def downgrade() -> None:
    op.drop_column("driver_profiles", "is_online")
