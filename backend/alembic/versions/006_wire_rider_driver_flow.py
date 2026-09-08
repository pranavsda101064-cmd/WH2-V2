"""wire rider-driver flow: ride_id on driver_requests, pending status, push_token, cash payment

Revision ID: 006
Revises: 005
Create Date: 2026-09-08

"""
from alembic import op
import sqlalchemy as sa

revision = "006"
down_revision = "005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add push_token to users
    op.add_column(
        "users",
        sa.Column("push_token", sa.String(500), nullable=True),
    )

    # Add ride_id to driver_requests + change id to String(36)
    op.alter_column("driver_requests", "id", type_=sa.String(36))
    op.add_column(
        "driver_requests",
        sa.Column("ride_id", sa.String(36), sa.ForeignKey("rides.id"), nullable=True, index=True),
    )

    # Add 'pending' to ride_status enum and 'cash' to payment_method enum
    # PostgreSQL enum alterations require raw SQL
    op.execute("ALTER TYPE ride_status ADD VALUE IF NOT EXISTS 'pending'")
    op.execute("ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'cash'")


def downgrade() -> None:
    op.drop_column("driver_requests", "ride_id")
    op.drop_column("users", "push_token")
