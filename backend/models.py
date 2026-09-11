import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import relationship

from database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def generate_uuid() -> str:
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=False), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum("customer", "driver", name="user_role"), nullable=False, default="customer")
    profile_completed = Column(Boolean, nullable=False, default=False)
    push_token = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)

    rides = relationship("Ride", back_populates="user", foreign_keys="Ride.user_id")


class Package(Base):
    __tablename__ = "packages"

    id = Column(String(10), primary_key=True)
    title = Column(String(255), nullable=False)
    subtitle = Column(String(255), nullable=False)
    price = Column(Integer, nullable=False)
    duration = Column(String(50), nullable=False)
    stops = Column(Integer, nullable=False)
    image = Column(Text, nullable=False)


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(String(10), primary_key=True)
    name = Column(String(100), nullable=False)
    desc = Column(String(255), nullable=False)
    seats = Column(Integer, nullable=False)
    fare = Column(Integer, nullable=False)
    eta = Column(String(20), nullable=False)
    icon = Column(String(100), nullable=False)


class Ride(Base):
    __tablename__ = "rides"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=False, index=True)
    driver_id = Column(String(100), nullable=True)
    vehicle_id = Column(String(10), nullable=False)
    stops = Column(JSON, nullable=False)
    fare = Column(Integer, nullable=False)
    payment_method = Column(Enum("card", "upi", "cash", name="payment_method"), nullable=False)
    tip = Column(Integer, nullable=False, default=0)
    status = Column(
        Enum(
            "pending", "arriving", "onboard", "arrived", "completed", "cancelled",
            name="ride_status",
        ),
        nullable=False,
        default="pending",
        index=True,
    )
    created_at = Column(DateTime(timezone=True), nullable=False, default=utcnow, index=True)

    driver_lat = Column(Float, nullable=True)
    driver_lng = Column(Float, nullable=True)
    driver_heading = Column(Float, nullable=True)
    driver_speed = Column(Float, nullable=True)
    location_updated_at = Column(DateTime(timezone=True), nullable=True)
    ride_pin = Column(String(4), nullable=True)

    user = relationship("User", back_populates="rides", foreign_keys=[user_id])
    rating = relationship("Rating", back_populates="ride", uselist=False)


class Rating(Base):
    __tablename__ = "ratings"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    ride_id = Column(String(36), ForeignKey("rides.id"), nullable=False, index=True)
    stars = Column(Integer, nullable=False)
    tags = Column(JSON, nullable=False, default=list)
    note = Column(Text, nullable=True)
    tip = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)

    ride = relationship("Ride", back_populates="rating")


class DriverRequest(Base):
    __tablename__ = "driver_requests"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    ride_id = Column(String(36), ForeignKey("rides.id"), nullable=True, index=True)
    pickup = Column(String(255), nullable=False)
    drop = Column(String(255), nullable=False)
    distance = Column(String(50), nullable=False)
    duration = Column(String(50), nullable=False)
    fare = Column(Integer, nullable=False)
    rider = Column(String(100), nullable=False)
    rating = Column(Float, nullable=False, default=0.0)
    tag = Column(String(100), nullable=False, default="")


class DriverProfile(Base):
    __tablename__ = "driver_profiles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=False)
    dob = Column(String(10), nullable=True)
    address = Column(Text, nullable=True)
    photo_url = Column(Text, nullable=True)
    status = Column(
        Enum("pending", "under_review", "approved", "rejected", name="driver_status"),
        nullable=False,
        default="pending",
    )
    is_online = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow)

    user = relationship("User", foreign_keys=[user_id])
    documents = relationship("DriverDocument", back_populates="driver", cascade="all, delete-orphan")
    vehicles = relationship("DriverVehicle", back_populates="driver", cascade="all, delete-orphan")


class DriverDocument(Base):
    __tablename__ = "driver_documents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    driver_id = Column(String(36), ForeignKey("driver_profiles.id"), nullable=False, index=True)
    doc_type = Column(
        Enum("aadhaar", "pan", "driving_license", "psv_badge", "insurance", "rc", "puc", "permit", name="doc_type"),
        nullable=False,
    )
    file_path = Column(Text, nullable=False)
    verification_status = Column(
        Enum("pending", "verified", "rejected", name="doc_verification_status"),
        nullable=False,
        default="pending",
    )
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)

    driver = relationship("DriverProfile", back_populates="documents")


class DriverVehicle(Base):
    __tablename__ = "driver_vehicles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    driver_id = Column(String(36), ForeignKey("driver_profiles.id"), nullable=False, index=True)
    vehicle_type = Column(
        Enum("sedan", "suv", "hatchback", "auto", "bike", name="vehicle_type"),
        nullable=False,
    )
    make = Column(String(100), nullable=True)
    model = Column(String(100), nullable=True)
    year = Column(Integer, nullable=True)
    reg_number = Column(String(20), nullable=False)
    seats = Column(Integer, nullable=False, default=4)
    photo_url = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)

    driver = relationship("DriverProfile", back_populates="vehicles")


class CustomerProfile(Base):
    __tablename__ = "customer_profiles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=False)
    gender = Column(Enum("male", "female", "other", name="gender_type"), nullable=True)
    avatar_url = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow)

    user = relationship("User", foreign_keys=[user_id])
