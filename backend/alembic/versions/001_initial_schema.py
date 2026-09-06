"""initial schema

Revision ID: 001
Revises:
Create Date: 2026-09-06

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Enum types
    user_role = postgresql.ENUM("customer", "driver", name="user_role", create_type=False)
    payment_method = postgresql.ENUM("card", "upi", name="payment_method", create_type=False)
    ride_status = postgresql.ENUM(
        "arriving", "onboard", "arrived", "completed", "cancelled",
        name="ride_status", create_type=False,
    )

    user_role.create(op.get_bind(), checkfirst=True)
    payment_method.create(op.get_bind(), checkfirst=True)
    ride_status.create(op.get_bind(), checkfirst=True)

    # Users table
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column("email", sa.String(255), unique=True, nullable=False, index=True),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("role", user_role, nullable=False, server_default="customer"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    # Packages table
    op.create_table(
        "packages",
        sa.Column("id", sa.String(10), primary_key=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("subtitle", sa.String(255), nullable=False),
        sa.Column("price", sa.Integer, nullable=False),
        sa.Column("duration", sa.String(50), nullable=False),
        sa.Column("stops", sa.Integer, nullable=False),
        sa.Column("image", sa.Text, nullable=False),
    )

    # Vehicles table
    op.create_table(
        "vehicles",
        sa.Column("id", sa.String(10), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("desc", sa.String(255), nullable=False),
        sa.Column("seats", sa.Integer, nullable=False),
        sa.Column("fare", sa.Integer, nullable=False),
        sa.Column("eta", sa.String(20), nullable=False),
        sa.Column("icon", sa.String(100), nullable=False),
    )

    # Rides table
    op.create_table(
        "rides",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("driver_id", sa.String(100), nullable=True),
        sa.Column("vehicle_id", sa.String(10), nullable=False),
        sa.Column("stops", postgresql.JSON, nullable=False),
        sa.Column("fare", sa.Integer, nullable=False),
        sa.Column("payment_method", payment_method, nullable=False),
        sa.Column("tip", sa.Integer, nullable=False, server_default="0"),
        sa.Column("status", ride_status, nullable=False, server_default="arriving"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_rides_user_id", "rides", ["user_id"])
    op.create_index("ix_rides_status", "rides", ["status"])
    op.create_index("ix_rides_created_at", "rides", ["created_at"])

    # Ratings table
    op.create_table(
        "ratings",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("ride_id", sa.String(36), sa.ForeignKey("rides.id"), nullable=False),
        sa.Column("stars", sa.Integer, nullable=False),
        sa.Column("tags", postgresql.JSON, nullable=False, server_default="[]"),
        sa.Column("note", sa.Text, nullable=True),
        sa.Column("tip", sa.Integer, nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_ratings_ride_id", "ratings", ["ride_id"])

    # Driver requests table
    op.create_table(
        "driver_requests",
        sa.Column("id", sa.String(10), primary_key=True),
        sa.Column("pickup", sa.String(255), nullable=False),
        sa.Column("drop", sa.String(255), nullable=False),
        sa.Column("distance", sa.String(50), nullable=False),
        sa.Column("duration", sa.String(50), nullable=False),
        sa.Column("fare", sa.Integer, nullable=False),
        sa.Column("rider", sa.String(100), nullable=False),
        sa.Column("rating", sa.Float, nullable=False),
        sa.Column("tag", sa.String(100), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("driver_requests")
    op.drop_table("ratings")
    op.drop_index("ix_rides_created_at", table_name="rides")
    op.drop_index("ix_rides_status", table_name="rides")
    op.drop_index("ix_rides_user_id", table_name="rides")
    op.drop_table("rides")
    op.drop_table("vehicles")
    op.drop_table("packages")
    op.drop_table("users")

    op.execute("DROP TYPE IF EXISTS ride_status")
    op.execute("DROP TYPE IF EXISTS payment_method")
    op.execute("DROP TYPE IF EXISTS user_role")
