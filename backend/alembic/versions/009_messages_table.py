"""create messages table for rider-driver chat

Revision ID: 009
Revises: 008
Create Date: 2026-09-11

"""
from alembic import op
import sqlalchemy as sa

revision = "009"
down_revision = "008"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "messages",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("ride_id", sa.String(36), sa.ForeignKey("rides.id"), nullable=False, index=True),
        sa.Column("sender_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False, index=True),
        sa.Column("receiver_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("text", sa.String(500), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now(), index=True),
    )
    op.create_index("ix_messages_ride_created", "messages", ["ride_id", "created_at"])


def downgrade() -> None:
    op.drop_index("ix_messages_ride_created", table_name="messages")
    op.drop_table("messages")
