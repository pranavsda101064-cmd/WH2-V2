"""Admin panel API routes."""

import os
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import func, select, case, and_
from sqlalchemy.ext.asyncio import AsyncSession

from auth import create_access_token, decode_token, hash_password, verify_password, pwd_context
from config import get_settings
from database import get_db
from models import (
    Admin, User, Ride, Rating, DriverProfile, DriverDocument, DriverVehicle,
    CustomerProfile, Package, Vehicle, utcnow,
)
from notifications import send_push, notify_drivers, notify_user

settings = get_settings()

router = APIRouter(prefix="/api/admin", tags=["admin"])


# ---------- Schemas ----------
class AdminLogin(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)


class AdminOut(BaseModel):
    id: str
    email: str


class UserOut(BaseModel):
    id: str
    email: str
    role: str
    profile_completed: bool
    is_banned: bool
    push_token: Optional[str] = None
    created_at: str


class PaginatedUsers(BaseModel):
    items: list
    total: int
    page: int
    pages: int


class PaginatedRides(BaseModel):
    items: list
    total: int
    page: int
    pages: int


class DriverStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(approved|rejected)$")


class DocStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(verified|rejected)$")
    notes: Optional[str] = None


class NotifyPayload(BaseModel):
    target: str = Field(..., pattern="^(all|drivers|riders|user)$")
    user_id: Optional[str] = None
    title: str = Field(..., min_length=1, max_length=200)
    body: str = Field(..., min_length=1, max_length=500)


class VehicleUpdate(BaseModel):
    fare: int = Field(..., ge=0)


class GeofenceUpdate(BaseModel):
    min_lat: float
    max_lat: float
    min_lng: float
    max_lng: float


# ---------- Admin Auth Dependency ----------
async def get_admin_user(
    db: AsyncSession = Depends(get_db),
    credentials=Depends(__import__("fastapi.security", fromlist=["HTTPBearer"]).HTTPBearer(auto_error=False)),
) -> Admin:
    if credentials is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = decode_token(credentials.credentials)
    admin_id = payload.get("sub")
    role = payload.get("role")
    if role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    result = await db.execute(select(Admin).where(Admin.id == admin_id))
    admin = result.scalar_one_or_none()
    if admin is None:
        raise HTTPException(status_code=401, detail="Admin not found")
    return admin


# ---------- Auth Routes ----------
@router.post("/login")
async def admin_login(body: AdminLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Admin).where(Admin.email == body.email))
    admin = result.scalar_one_or_none()
    if not admin or not verify_password(body.password, admin.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(admin.id, admin.email, "admin")
    return {"access_token": token, "token_type": "bearer", "admin": {"id": admin.id, "email": admin.email}}


@router.get("/me")
async def admin_me(admin: Admin = Depends(get_admin_user)):
    return {"id": admin.id, "email": admin.email}


# ---------- Users ----------
@router.get("/users")
async def list_users(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    role: Optional[str] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    _admin: Admin = Depends(get_admin_user),
):
    query = select(User)
    count_query = select(func.count()).select_from(User)

    if role:
        query = query.where(User.role == role)
        count_query = count_query.where(User.role == role)

    if search:
        search_filter = User.email.ilike(f"%{search}%")
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)

    total = (await db.execute(count_query)).scalar()
    pages = max(1, (total + limit - 1) // limit)
    offset = (page - 1) * limit

    result = await db.execute(query.order_by(User.created_at.desc()).offset(offset).limit(limit))
    users = result.scalars().all()

    items = []
    for u in users:
        items.append({
            "id": str(u.id),
            "email": u.email,
            "role": u.role,
            "profile_completed": u.profile_completed,
            "is_banned": u.is_banned,
            "created_at": u.created_at.isoformat() if u.created_at else None,
        })

    return {"items": items, "total": total, "page": page, "pages": pages}


@router.get("/users/{user_id}")
async def get_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    _admin: Admin = Depends(get_admin_user),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, detail="User not found")

    profile = None
    if user.role == "customer":
        p = await db.execute(select(CustomerProfile).where(CustomerProfile.user_id == user_id))
        cp = p.scalar_one_or_none()
        if cp:
            profile = {"full_name": cp.full_name, "phone": cp.phone, "gender": cp.gender, "avatar_url": cp.avatar_url}
    elif user.role == "driver":
        p = await db.execute(select(DriverProfile).where(DriverProfile.user_id == user_id))
        dp = p.scalar_one_or_none()
        if dp:
            profile = {"full_name": dp.full_name, "phone": dp.phone, "status": dp.status, "is_online": dp.is_online, "photo_url": dp.photo_url}

    rides_result = await db.execute(
        select(Ride).where(Ride.user_id == user_id).order_by(Ride.created_at.desc()).limit(20)
    )
    rides = [{"id": r.id, "fare": r.fare, "status": r.status, "created_at": r.created_at.isoformat() if r.created_at else None} for r in rides_result.scalars().all()]

    return {
        "id": str(user.id),
        "email": user.email,
        "role": user.role,
        "profile_completed": user.profile_completed,
        "is_banned": user.is_banned,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "profile": profile,
        "rides": rides,
    }


@router.patch("/users/{user_id}/ban")
async def toggle_ban(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    _admin: Admin = Depends(get_admin_user),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, detail="User not found")
    user.is_banned = not user.is_banned
    return {"id": str(user.id), "is_banned": user.is_banned}


# ---------- Rides ----------
@router.get("/rides")
async def list_rides(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    _admin: Admin = Depends(get_admin_user),
):
    query = select(Ride)
    count_query = select(func.count()).select_from(Ride)

    if status:
        query = query.where(Ride.status == status)
        count_query = count_query.where(Ride.status == status)

    total = (await db.execute(count_query)).scalar()
    pages = max(1, (total + limit - 1) // limit)
    offset = (page - 1) * limit

    result = await db.execute(query.order_by(Ride.created_at.desc()).offset(offset).limit(limit))
    rides = result.scalars().all()

    items = []
    for r in rides:
        # Get rider email
        rider_result = await db.execute(select(User.email).where(User.id == r.user_id))
        rider_email = rider_result.scalar_one_or_none() or "unknown"

        items.append({
            "id": r.id,
            "rider_email": rider_email,
            "driver_id": r.driver_id,
            "vehicle_id": r.vehicle_id,
            "fare": r.fare,
            "payment_method": r.payment_method,
            "status": r.status,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        })

    return {"items": items, "total": total, "page": page, "pages": pages}


@router.get("/rides/{ride_id}")
async def get_ride(
    ride_id: str,
    db: AsyncSession = Depends(get_db),
    _admin: Admin = Depends(get_admin_user),
):
    result = await db.execute(select(Ride).where(Ride.id == ride_id))
    ride = result.scalar_one_or_none()
    if not ride:
        raise HTTPException(404, detail="Ride not found")

    rider_result = await db.execute(select(User.email).where(User.id == ride.user_id))
    rider_email = rider_result.scalar_one_or_none() or "unknown"

    rating_data = None
    if ride.rating:
        rating_data = {"stars": ride.rating.stars, "tags": ride.rating.tags, "note": ride.rating.note}

    return {
        "id": ride.id,
        "rider_email": rider_email,
        "driver_id": ride.driver_id,
        "vehicle_id": ride.vehicle_id,
        "stops": ride.stops,
        "fare": ride.fare,
        "payment_method": ride.payment_method,
        "tip": ride.tip,
        "status": ride.status,
        "ride_pin": ride.ride_pin,
        "created_at": ride.created_at.isoformat() if ride.created_at else None,
        "rating": rating_data,
    }


# ---------- Analytics ----------
@router.get("/analytics/overview")
async def analytics_overview(
    db: AsyncSession = Depends(get_db),
    _admin: Admin = Depends(get_admin_user),
):
    now = utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - __import__("datetime").timedelta(days=7)
    month_start = today_start - __import__("datetime").timedelta(days=30)

    # Revenue
    today_rev = (await db.execute(select(func.coalesce(func.sum(Ride.fare), 0)).where(and_(Ride.status == "completed", Ride.created_at >= today_start)))).scalar()
    week_rev = (await db.execute(select(func.coalesce(func.sum(Ride.fare), 0)).where(and_(Ride.status == "completed", Ride.created_at >= week_start)))).scalar()
    month_rev = (await db.execute(select(func.coalesce(func.sum(Ride.fare), 0)).where(and_(Ride.status == "completed", Ride.created_at >= month_start)))).scalar()

    # Ride counts
    today_rides = (await db.execute(select(func.count()).select_from(Ride).where(Ride.created_at >= today_start))).scalar()
    week_rides = (await db.execute(select(func.count()).select_from(Ride).where(Ride.created_at >= week_start))).scalar()
    month_rides = (await db.execute(select(func.count()).select_from(Ride).where(Ride.created_at >= month_start))).scalar()

    # Active drivers
    active_drivers = (await db.execute(select(func.count()).select_from(DriverProfile).where(DriverProfile.is_online == True))).scalar()

    # Total users
    total_riders = (await db.execute(select(func.count()).select_from(User).where(User.role == "customer"))).scalar()
    total_drivers = (await db.execute(select(func.count()).select_from(User).where(User.role == "driver"))).scalar()
    pending_drivers = (await db.execute(select(func.count()).select_from(DriverProfile).where(DriverProfile.status == "pending"))).scalar()

    return {
        "revenue": {"today": today_rev, "week": week_rev, "month": month_rev},
        "rides": {"today": today_rides, "week": week_rides, "month": month_rides},
        "active_drivers": active_drivers,
        "total_riders": total_riders,
        "total_drivers": total_drivers,
        "pending_drivers": pending_drivers,
    }


@router.get("/analytics/revenue")
async def analytics_revenue(
    days: int = Query(30, ge=1, le=90),
    db: AsyncSession = Depends(get_db),
    _admin: Admin = Depends(get_admin_user),
):
    from datetime import timedelta
    now = utcnow()
    start = now - timedelta(days=days)

    result = await db.execute(
        select(
            func.date(Ride.created_at).label("date"),
            func.coalesce(func.sum(Ride.fare), 0).label("revenue"),
            func.count().label("rides"),
        )
        .where(and_(Ride.status == "completed", Ride.created_at >= start))
        .group_by(func.date(Ride.created_at))
        .order_by(func.date(Ride.created_at))
    )
    rows = result.all()
    return [{"date": str(r.date), "revenue": r.revenue, "rides": r.rides} for r in rows]


# ---------- Drivers ----------
@router.get("/drivers")
async def list_drivers(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    _admin: Admin = Depends(get_admin_user),
):
    query = select(DriverProfile)
    count_query = select(func.count()).select_from(DriverProfile)

    if status:
        query = query.where(DriverProfile.status == status)
        count_query = count_query.where(DriverProfile.status == status)

    total = (await db.execute(count_query)).scalar()
    pages = max(1, (total + limit - 1) // limit)
    offset = (page - 1) * limit

    result = await db.execute(query.order_by(DriverProfile.created_at.desc()).offset(offset).limit(limit))
    drivers = result.scalars().all()

    items = []
    for d in drivers:
        # Get user email
        user_result = await db.execute(select(User.email).where(User.id == d.user_id))
        email = user_result.scalar_one_or_none() or "unknown"

        # Count documents
        doc_count = (await db.execute(select(func.count()).select_from(DriverDocument).where(DriverDocument.driver_id == d.id))).scalar()
        pending_docs = (await db.execute(select(func.count()).select_from(DriverDocument).where(and_(DriverDocument.driver_id == d.id, DriverDocument.verification_status == "pending")))).scalar()

        items.append({
            "id": d.id,
            "user_id": str(d.user_id),
            "email": email,
            "full_name": d.full_name,
            "phone": d.phone,
            "status": d.status,
            "is_online": d.is_online,
            "photo_url": d.photo_url,
            "doc_count": doc_count,
            "pending_docs": pending_docs,
            "created_at": d.created_at.isoformat() if d.created_at else None,
        })

    return {"items": items, "total": total, "page": page, "pages": pages}


@router.get("/drivers/{driver_id}")
async def get_driver(
    driver_id: str,
    db: AsyncSession = Depends(get_db),
    _admin: Admin = Depends(get_admin_user),
):
    result = await db.execute(select(DriverProfile).where(DriverProfile.id == driver_id))
    driver = result.scalar_one_or_none()
    if not driver:
        raise HTTPException(404, detail="Driver not found")

    user_result = await db.execute(select(User.email).where(User.id == driver.user_id))
    email = user_result.scalar_one_or_none() or "unknown"

    docs_result = await db.execute(select(DriverDocument).where(DriverDocument.driver_id == driver_id))
    docs = [{"id": d.id, "doc_type": d.doc_type, "file_path": d.file_path, "verification_status": d.verification_status, "notes": d.notes, "created_at": d.created_at.isoformat() if d.created_at else None} for d in docs_result.scalars().all()]

    vehicles_result = await db.execute(select(DriverVehicle).where(DriverVehicle.driver_id == driver_id))
    vehicles = [{"id": v.id, "vehicle_type": v.vehicle_type, "make": v.make, "model": v.model, "year": v.year, "reg_number": v.reg_number, "seats": v.seats} for v in vehicles_result.scalars().all()]

    return {
        "id": driver.id,
        "user_id": str(driver.user_id),
        "email": email,
        "full_name": driver.full_name,
        "phone": driver.phone,
        "dob": driver.dob,
        "address": driver.address,
        "photo_url": driver.photo_url,
        "status": driver.status,
        "is_online": driver.is_online,
        "documents": docs,
        "vehicles": vehicles,
        "created_at": driver.created_at.isoformat() if driver.created_at else None,
    }


@router.patch("/drivers/{driver_id}/status")
async def update_driver_status(
    driver_id: str,
    body: DriverStatusUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: Admin = Depends(get_admin_user),
):
    result = await db.execute(select(DriverProfile).where(DriverProfile.id == driver_id))
    driver = result.scalar_one_or_none()
    if not driver:
        raise HTTPException(404, detail="Driver not found")
    driver.status = body.status
    return {"id": driver.id, "status": driver.status}


@router.patch("/drivers/{driver_id}/documents/{doc_id}")
async def update_document_status(
    driver_id: str,
    doc_id: str,
    body: DocStatusUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: Admin = Depends(get_admin_user),
):
    result = await db.execute(
        select(DriverDocument).where(and_(DriverDocument.id == doc_id, DriverDocument.driver_id == driver_id))
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(404, detail="Document not found")
    doc.verification_status = body.status
    if body.notes:
        doc.notes = body.notes
    return {"id": doc.id, "verification_status": doc.verification_status}


# ---------- Places ----------
@router.get("/places")
async def list_places(db: AsyncSession = Depends(get_db), _admin: Admin = Depends(get_admin_user)):
    result = await db.execute(select(Package).order_by(Package.id))
    places = result.scalars().all()
    return [{"id": p.id, "title": p.title, "subtitle": p.subtitle, "price": p.price, "duration": p.duration, "stops": p.stops, "image": p.image} for p in places]


class PlaceCreate(BaseModel):
    id: str = Field(..., max_length=10)
    title: str = Field(..., max_length=255)
    subtitle: str = Field(..., max_length=255)
    price: int = Field(..., ge=0)
    duration: str = Field(..., max_length=50)
    stops: int = Field(..., ge=0)
    image: str = Field(..., max_length=500)


class PlaceUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    subtitle: Optional[str] = Field(None, max_length=255)
    price: Optional[int] = Field(None, ge=0)
    duration: Optional[str] = Field(None, max_length=50)
    stops: Optional[int] = Field(None, ge=0)
    image: Optional[str] = Field(None, max_length=500)


@router.post("/places")
async def create_place(body: PlaceCreate, db: AsyncSession = Depends(get_db), _admin: Admin = Depends(get_admin_user)):
    existing = await db.execute(select(Package).where(Package.id == body.id))
    if existing.scalar_one_or_none():
        raise HTTPException(400, detail="Place with this ID already exists")
    place = Package(id=body.id, title=body.title, subtitle=body.subtitle, price=body.price, duration=body.duration, stops=body.stops, image=body.image)
    db.add(place)
    return {"id": place.id, "title": place.title}


@router.put("/places/{place_id}")
async def update_place(place_id: str, body: PlaceUpdate, db: AsyncSession = Depends(get_db), _admin: Admin = Depends(get_admin_user)):
    result = await db.execute(select(Package).where(Package.id == place_id))
    place = result.scalar_one_or_none()
    if not place:
        raise HTTPException(404, detail="Place not found")
    if body.title is not None: place.title = body.title
    if body.subtitle is not None: place.subtitle = body.subtitle
    if body.price is not None: place.price = body.price
    if body.duration is not None: place.duration = body.duration
    if body.stops is not None: place.stops = body.stops
    if body.image is not None: place.image = body.image
    return {"id": place.id, "title": place.title}


@router.delete("/places/{place_id}")
async def delete_place(place_id: str, db: AsyncSession = Depends(get_db), _admin: Admin = Depends(get_admin_user)):
    result = await db.execute(select(Package).where(Package.id == place_id))
    place = result.scalar_one_or_none()
    if not place:
        raise HTTPException(404, detail="Place not found")
    await db.delete(place)
    return {"deleted": True}


# ---------- Push Notifications ----------
@router.post("/notify")
async def send_notification(body: NotifyPayload, db: AsyncSession = Depends(get_db), _admin: Admin = Depends(get_admin_user)):
    sent = 0
    if body.target == "all":
        result = await db.execute(select(User.push_token).where(User.push_token.isnot(None)))
        tokens = [r[0] for r in result.all()]
        for token in tokens:
            if await send_push(token, body.title, body.body):
                sent += 1
    elif body.target == "drivers":
        sent = await notify_drivers(db, body.title, body.body)
    elif body.target == "riders":
        result = await db.execute(select(User.push_token).where(User.role == "customer", User.push_token.isnot(None)))
        tokens = [r[0] for r in result.all()]
        for token in tokens:
            if await send_push(token, body.title, body.body):
                sent += 1
    elif body.target == "user":
        if not body.user_id:
            raise HTTPException(400, detail="user_id required for target=user")
        ok = await notify_user(db, body.user_id, body.title, body.body)
        sent = 1 if ok else 0

    return {"sent": sent}


# ---------- Pricing ----------
@router.get("/vehicles")
async def list_vehicles(db: AsyncSession = Depends(get_db), _admin: Admin = Depends(get_admin_user)):
    result = await db.execute(select(Vehicle).order_by(Vehicle.id))
    vehicles = result.scalars().all()
    return [{"id": v.id, "name": v.name, "desc": v.desc, "seats": v.seats, "fare": v.fare, "eta": v.eta, "icon": v.icon} for v in vehicles]


@router.put("/vehicles/{vehicle_id}")
async def update_vehicle(vehicle_id: str, body: VehicleUpdate, db: AsyncSession = Depends(get_db), _admin: Admin = Depends(get_admin_user)):
    result = await db.execute(select(Vehicle).where(Vehicle.id == vehicle_id))
    vehicle = result.scalar_one_or_none()
    if not vehicle:
        raise HTTPException(404, detail="Vehicle not found")
    vehicle.fare = body.fare
    return {"id": vehicle.id, "fare": vehicle.fare}


# ---------- Geofence ----------
# Stored as a simple JSON file for flexibility
GEOFENCE_FILE = os.path.join(os.path.dirname(__file__), "geofence.json")

DEFAULT_GEOFENCE = {
    "min_lat": 12.93,
    "max_lat": 13.14,
    "min_lng": 75.68,
    "max_lng": 75.88,
}


def _load_geofence() -> dict:
    import json
    if os.path.isfile(GEOFENCE_FILE):
        with open(GEOFENCE_FILE) as f:
            return json.load(f)
    return DEFAULT_GEOFENCE


def _save_geofence(data: dict):
    import json
    with open(GEOFENCE_FILE, "w") as f:
        json.dump(data, f, indent=2)


@router.get("/geofence")
async def get_geofence(_admin: Admin = Depends(get_admin_user)):
    return _load_geofence()


@router.put("/geofence")
async def update_geofence(body: GeofenceUpdate, _admin: Admin = Depends(get_admin_user)):
    data = {"min_lat": body.min_lat, "max_lat": body.max_lat, "min_lng": body.min_lng, "max_lng": body.max_lng}
    _save_geofence(data)
    return data
