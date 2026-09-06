"""Add driver profile, document, and vehicle tables

Revision ID: 002_driver_onboarding
Revises: 001
Create Date: 2026-09-06
"""
from alembic import op
import sqlalchemy as sa

revision = "002_driver_onboarding"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "driver_profiles",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.dialects.postgresql.UUID(as_uuid=False), sa.ForeignKey("users.id"), unique=True, nullable=False, index=True),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("phone", sa.String(20), nullable=False),
        sa.Column("dob", sa.String(10), nullable=True),
        sa.Column("address", sa.Text, nullable=True),
        sa.Column("photo_url", sa.Text, nullable=True),
        sa.Column("status", sa.Enum("pending", "under_review", "approved", "rejected", name="driver_status"), nullable=False, server_default="pending"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        "driver_documents",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("driver_id", sa.String(36), sa.ForeignKey("driver_profiles.id"), nullable=False, index=True),
        sa.Column("doc_type", sa.Enum("aadhaar", "pan", "driving_license", "psv_badge", "insurance", "rc", "puc", "permit", name="doc_type"), nullable=False),
        sa.Column("file_path", sa.Text, nullable=False),
        sa.Column("verification_status", sa.Enum("pending", "verified", "rejected", name="doc_verification_status"), nullable=False, server_default="pending"),
        sa.Column("notes", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        "driver_vehicles",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("driver_id", sa.String(36), sa.ForeignKey("driver_profiles.id"), nullable=False, index=True),
        sa.Column("vehicle_type", sa.Enum("sedan", "suv", "hatchback", "auto", "bike", name="vehicle_type"), nullable=False),
        sa.Column("make", sa.String(100), nullable=True),
        sa.Column("model", sa.String(100), nullable=True),
        sa.Column("year", sa.Integer, nullable=True),
        sa.Column("reg_number", sa.String(20), nullable=False),
        sa.Column("seats", sa.Integer, nullable=False, server_default="4"),
        sa.Column("photo_url", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("driver_vehicles")
    op.drop_table("driver_documents")
    op.drop_table("driver_profiles")
    op.execute("DROP TYPE IF EXISTS vehicle_type")
    op.execute("DROP TYPE IF EXISTS doc_verification_status")
    op.execute("DROP TYPE IF EXISTS doc_type")
    op.execute("DROP TYPE IF EXISTS driver_status")
