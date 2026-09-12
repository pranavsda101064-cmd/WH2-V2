"""create admins table and add is_banned to users

Revision ID: 010
Revises: 009
Create Date: 2026-09-12

"""
from alembic import op
import sqlalchemy as sa

revision = "010"
down_revision = "009"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add is_banned column to users
    op.add_column("users", sa.Column("is_banned", sa.Boolean(), nullable=False, server_default="false"))

    # Create admins table
    op.create_table(
        "admins",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("email", sa.String(255), unique=True, nullable=False, index=True),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("admins")
    op.drop_column("users", "is_banned")
