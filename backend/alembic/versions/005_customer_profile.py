"""add customer_profiles table + profile_completed to users

Revision ID: 005
Revises: 004
Create Date: 2026-09-06

"""
from alembic import op
import sqlalchemy as sa

revision = "005"
down_revision = "004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("profile_completed", sa.Boolean, nullable=False, server_default="false"),
    )
    op.create_table(
        "customer_profiles",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.dialects.postgresql.UUID(as_uuid=False), sa.ForeignKey("users.id"), unique=True, nullable=False, index=True),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("phone", sa.String(20), nullable=False),
        sa.Column("gender", sa.Enum("male", "female", "other", name="gender_type"), nullable=True),
        sa.Column("avatar_url", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("customer_profiles")
    op.drop_column("users", "profile_completed")
