import logging
import os
import time
import uuid
from contextlib import asynccontextmanager
from contextvars import ContextVar
from datetime import datetime, timezone
from typing import List, Literal, Optional

import httpx
import sentry_sdk
from fastapi import APIRouter, Depends, FastAPI, File, HTTPException, Query, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, EmailStr, Field
from pythonjsonlogger import json as jsonlogger
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import (
    UserCreate,
    UserLogin,
    TokenResponse,
    UserOut,
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)
from config import get_settings
from database import async_session_factory, get_db
from models import DriverRequest as DriverRequestModel
from models import DriverProfile as DriverProfileModel
from models import DriverDocument as DriverDocumentModel
from models import DriverVehicle as DriverVehicleModel
from models import Package as PackageModel
from models import Rating as RatingModel
from models import Ride as RideModel
from models import User
from models import Vehicle as VehicleModel
from seed import seed_database

settings = get_settings()

UPLOADS_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)

# ---------- Rate limiting ----------
limiter = Limiter(key_func=get_remote_address)

# ---------- Request ID context ----------
request_id_ctx: ContextVar[str] = ContextVar("request_id", default="-")

# ---------- Structured logging ----------
handler = logging.StreamHandler()
handler.setFormatter(
    jsonlogger.JsonFormatter(
        fmt="%(asctime)s %(levelname)s %(name)s %(message)s",
        rename_fields={"asctime": "timestamp", "levelname": "level", "name": "logger"},
    )
)
logging.basicConfig(level=getattr(logging, settings.LOG_LEVEL), handlers=[handler])
logger = logging.getLogger(__name__)


# ---------- Lifespan ----------
@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.SENTRY_DSN:
        sentry_sdk.init(dsn=settings.SENTRY_DSN, environment=settings.ENVIRONMENT)
        logger.info("Sentry initialized.")
    logger.info("Starting Sakleshpura Rides API...")
    if settings.ENVIRONMENT == "development":
        async with async_session_factory() as session:
            await seed_database(session)
        logger.info("Database seeded (if empty). Ready.")
    else:
        logger.info("Production mode — skipping seed. Ready.")
    yield
    logger.info("Shutting down.")


# ---------- App ----------
app = FastAPI(
    title="Sakleshpura Rides API",
    version="1.0.0",
    lifespan=lifespan,
)
app.state.limiter = limiter


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": f"Rate limit exceeded: {exc.detail}"},
    )

# ---------- CORS ----------
allowed_origins = [o.strip() for o in settings.ALLOWED_ORIGINS.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- Global exception handler ----------
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(
        "unhandled error",
        exc_info=True,
        extra={
            "request_id": request_id_ctx.get("-"),
            "method": request.method,
            "path": request.url.path,
            "error": str(exc),
        },
    )
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


# ---------- Request logging middleware ----------
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.perf_counter()
    req_id = str(uuid.uuid4())[:8]
    request_id_ctx.set(req_id)
    response = await call_next(request)
    elapsed_ms = round((time.perf_counter() - start) * 1000, 1)
    logger.info(
        "request completed",
        extra={
            "request_id": req_id,
            "method": request.method,
            "path": request.url.path,
            "status": response.status_code,
            "duration_ms": elapsed_ms,
            "client": request.client.host if request.client else "unknown",
        },
    )
    return response


# ---------- Pydantic schemas (API contract — unchanged) ----------
class PackageOut(BaseModel):
    id: str
    title: str
    subtitle: str
    price: int
    duration: str
    stops: int
    image: str


class VehicleOut(BaseModel):
    id: str
    name: str
    desc: str
    seats: int
    fare: int
    eta: str
    icon: str


class RideStop(BaseModel):
    label: str = Field(..., max_length=255)
    sub: Optional[str] = Field(None, max_length=255)
    lat: Optional[float] = None
    lng: Optional[float] = None


class RideCreate(BaseModel):
    vehicle_id: str = Field(..., max_length=10)
    stops: List[RideStop] = Field(..., min_length=1, max_length=10)
    fare: int = Field(..., ge=0, le=100000)
    payment_method: Literal["card", "upi"]
    tip: Optional[int] = Field(0, ge=0, le=10000)


class RideOut(BaseModel):
    id: str
    user_id: str
    driver_id: Optional[str] = None
    vehicle_id: str
    stops: List[RideStop]
    fare: int
    payment_method: Literal["card", "upi"]
    tip: int = 0
    status: Literal["arriving", "onboard", "arrived", "completed", "cancelled"] = "arriving"
    ride_pin: Optional[str] = None
    created_at: str


class RideStatusUpdate(BaseModel):
    status: Literal["arriving", "onboard", "arrived", "completed", "cancelled"]


class RatingCreate(BaseModel):
    ride_id: str = Field(..., max_length=36)
    stars: int = Field(ge=1, le=5)
    tags: List[str] = Field(default=[], max_length=10)
    note: Optional[str] = Field(None, max_length=500)
    tip: Optional[int] = Field(0, ge=0, le=10000)


class RatingOut(BaseModel):
    id: str
    ride_id: str
    stars: int
    tags: List[str]
    note: Optional[str] = None
    tip: int = 0
    created_at: str


class DriverRequestOut(BaseModel):
    id: str
    pickup: str
    drop: str
    distance: str
    duration: str
    fare: int
    rider: str
    rating: float
    tag: str


class DriverStats(BaseModel):
    earnings: int
    trips: int
    hours: float


# ---------- Helpers ----------
def ride_to_out(ride: RideModel) -> RideOut:
    return RideOut(
        id=ride.id,
        user_id=str(ride.user_id),
        driver_id=ride.driver_id,
        vehicle_id=ride.vehicle_id,
        stops=[RideStop(**s) for s in (ride.stops or [])],
        fare=ride.fare,
        payment_method=ride.payment_method,
        tip=ride.tip,
        status=ride.status,
        ride_pin=ride.ride_pin,
        created_at=ride.created_at.isoformat() if ride.created_at else "",
    )


def calculate_fare(vehicle_fare: int, num_stops: int) -> int:
    stops_fee = 200 if num_stops > 1 else 0
    gst = round((vehicle_fare + stops_fee) * 0.05)
    return vehicle_fare + stops_fee + gst


# ---------- Router ----------
api_router = APIRouter(prefix="/api")


@api_router.get("/")
async def root():
    return {"service": "sakleshpura-rides", "status": "ok"}


# ---------- Auth ----------
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    role: Literal["customer", "driver"] = "customer"


@api_router.post("/auth/register", response_model=TokenResponse)
@limiter.limit("5/minute")
async def register(request: Request, payload: RegisterRequest, db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(User).where(User.email == payload.email))
        if result.scalar_one_or_none():
            raise HTTPException(400, detail="Email already registered")

        user = User(
            email=payload.email,
            hashed_password=hash_password(payload.password),
            role=payload.role,
        )
        db.add(user)
        await db.flush()

        token = create_access_token(str(user.id), user.email, user.role)
        return TokenResponse(
            access_token=token,
            user={"id": str(user.id), "email": user.email, "role": user.role},
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("register failed", extra={"error": str(exc), "email": payload.email})
        raise HTTPException(500, detail="Registration failed")


@api_router.post("/auth/login", response_model=TokenResponse)
@limiter.limit("10/minute")
async def login(request: Request, payload: UserLogin, db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(User).where(User.email == payload.email))
        user = result.scalar_one_or_none()
        if not user or not verify_password(payload.password, user.hashed_password):
            raise HTTPException(401, detail="Invalid email or password")

        token = create_access_token(str(user.id), user.email, user.role)
        return TokenResponse(
            access_token=token,
            user={"id": str(user.id), "email": user.email, "role": user.role},
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("login failed", extra={"error": str(exc), "email": payload.email})
        raise HTTPException(500, detail="Login failed")


@api_router.get("/auth/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserOut(id=str(current_user.id), email=current_user.email, role=current_user.role)


# ---------- Google Auth ----------
class GoogleAuthRequest(BaseModel):
    id_token: str = Field(..., max_length=2048)
    role: Literal["customer", "driver"] = "customer"


@api_router.post("/auth/google", response_model=TokenResponse)
@limiter.limit("10/minute")
async def google_auth(request: Request, payload: GoogleAuthRequest, db: AsyncSession = Depends(get_db)):
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                "https://oauth2.googleapis.com/tokeninfo",
                params={"id_token": payload.id_token},
                timeout=10.0,
            )
        if resp.status_code != 200:
            raise HTTPException(401, detail="Invalid Google token")
        claims = resp.json()
        email = claims.get("email")
        if not email:
            raise HTTPException(401, detail="No email in Google token")

        aud = claims.get("aud")
        if not settings.GOOGLE_WEB_CLIENT_ID or aud != settings.GOOGLE_WEB_CLIENT_ID:
            logger.warning("google_auth aud mismatch", extra={"aud": aud})
            raise HTTPException(401, detail="Invalid Google token audience")

        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if not user:
            user = User(
                email=email,
                hashed_password=hash_password(uuid.uuid4().hex),
                role=payload.role,
            )
            db.add(user)
            await db.flush()

        token = create_access_token(str(user.id), user.email, user.role)
        return TokenResponse(
            access_token=token,
            user={"id": str(user.id), "email": user.email, "role": user.role},
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("google_auth failed", extra={"error": str(exc)})
        raise HTTPException(500, detail="Google auth failed")


# ---------- Health check ----------
@app.get("/health")
async def health(db: AsyncSession = Depends(get_db)):
    try:
        await db.execute(select(func.count()).select_from(PackageModel))
        return {"status": "healthy", "database": "connected"}
    except Exception as exc:
        logger.error("health check failed", extra={"error": str(exc)})
        raise HTTPException(503, detail="Service unhealthy")


# ---------- Packages ----------
@api_router.get("/packages", response_model=List[PackageOut])
@limiter.limit("60/minute")
async def list_packages(request: Request, db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(PackageModel))
        packages = result.scalars().all()
        return [
            PackageOut(
                id=p.id, title=p.title, subtitle=p.subtitle,
                price=p.price, duration=p.duration, stops=p.stops, image=p.image,
            )
            for p in packages
        ]
    except Exception as exc:
        logger.error("list_packages failed", extra={"error": str(exc)})
        raise HTTPException(500, detail="Failed to fetch packages")


# ---------- Vehicles ----------
@api_router.get("/vehicles", response_model=List[VehicleOut])
@limiter.limit("60/minute")
async def list_vehicles(request: Request, db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(VehicleModel))
        vehicles = result.scalars().all()
        return [
            VehicleOut(
                id=v.id, name=v.name, desc=v.desc,
                seats=v.seats, fare=v.fare, eta=v.eta, icon=v.icon,
            )
            for v in vehicles
        ]
    except Exception as exc:
        logger.error("list_vehicles failed", extra={"error": str(exc)})
        raise HTTPException(500, detail="Failed to fetch vehicles")


# ---------- Rides ----------
@api_router.post("/rides", response_model=RideOut)
@limiter.limit("20/minute")
async def create_ride(
    request: Request,
    payload: RideCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        ride_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)
        ride_pin = f"{int.from_bytes(os.urandom(2), 'big') % 10000:04d}"

        ride = RideModel(
            id=ride_id,
            user_id=str(current_user.id),
            vehicle_id=payload.vehicle_id,
            stops=[{"label": s.label, "sub": s.sub, "lat": s.lat, "lng": s.lng} for s in payload.stops],
            fare=payload.fare,
            payment_method=payload.payment_method,
            tip=payload.tip or 0,
            status="arriving",
            ride_pin=ride_pin,
            created_at=now,
        )
        db.add(ride)
        await db.flush()

        return RideOut(
            id=ride.id,
            user_id=ride.user_id,
            driver_id=ride.driver_id,
            vehicle_id=ride.vehicle_id,
            stops=[RideStop(**s) for s in ride.stops],
            fare=ride.fare,
            payment_method=ride.payment_method,
            tip=ride.tip,
            status=ride.status,
            ride_pin=ride.ride_pin,
            created_at=ride.created_at.isoformat(),
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("create_ride failed", extra={"error": str(exc), "user_id": str(current_user.id)})
        raise HTTPException(500, detail="Failed to create ride")


@api_router.get("/rides", response_model=List[RideOut])
@limiter.limit("30/minute")
async def list_rides(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        result = await db.execute(
            select(RideModel)
            .where(RideModel.user_id == str(current_user.id))
            .order_by(RideModel.created_at.desc())
            .limit(200)
        )
        rides = result.scalars().all()
        return [ride_to_out(r) for r in rides]
    except Exception as exc:
        logger.error("list_rides failed", extra={"error": str(exc), "user_id": str(current_user.id)})
        raise HTTPException(500, detail="Failed to fetch rides")


@api_router.get("/rides/{ride_id}", response_model=RideOut)
async def get_ride(
    ride_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        result = await db.execute(select(RideModel).where(RideModel.id == ride_id))
        ride = result.scalar_one_or_none()
        if not ride:
            raise HTTPException(404, detail="Ride not found")
        return ride_to_out(ride)
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("get_ride failed", extra={"error": str(exc), "ride_id": ride_id})
        raise HTTPException(500, detail="Failed to fetch ride")


@api_router.patch("/rides/{ride_id}/status", response_model=RideOut)
async def update_ride_status(
    ride_id: str,
    payload: RideStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        result = await db.execute(select(RideModel).where(RideModel.id == ride_id))
        ride = result.scalar_one_or_none()
        if not ride:
            raise HTTPException(404, detail="Ride not found")
        ride.status = payload.status
        await db.flush()
        return ride_to_out(ride)
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("update_ride_status failed", extra={"error": str(exc), "ride_id": ride_id})
        raise HTTPException(500, detail="Failed to update ride status")


# ---------- Ratings ----------
@api_router.post("/ratings", response_model=RatingOut)
@limiter.limit("10/minute")
async def create_rating(
    request: Request,
    payload: RatingCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        # Verify ride exists
        result = await db.execute(select(RideModel).where(RideModel.id == payload.ride_id))
        ride = result.scalar_one_or_none()
        if not ride:
            raise HTTPException(404, detail="Ride not found")
        if str(ride.user_id) != str(current_user.id):
            raise HTTPException(403, detail="You can only rate your own rides")

        rating = RatingModel(
            id=str(uuid.uuid4()),
            ride_id=payload.ride_id,
            stars=payload.stars,
            tags=payload.tags or [],
            note=payload.note,
            tip=payload.tip or 0,
            created_at=datetime.now(timezone.utc),
        )
        db.add(rating)

        # Mark ride completed
        ride.status = "completed"
        ride.tip = payload.tip or 0
        await db.flush()

        return RatingOut(
            id=rating.id,
            ride_id=rating.ride_id,
            stars=rating.stars,
            tags=rating.tags,
            note=rating.note,
            tip=rating.tip,
            created_at=rating.created_at.isoformat(),
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("create_rating failed", extra={"error": str(exc), "ride_id": payload.ride_id})
        raise HTTPException(500, detail="Failed to submit rating")


# ---------- Driver Onboarding ----------
def require_driver(user: User):
    if user.role != "driver":
        raise HTTPException(403, detail="Driver access required")


class DriverProfileCreate(BaseModel):
    full_name: str = Field(..., max_length=255)
    phone: str = Field(..., max_length=20)
    dob: Optional[str] = None
    address: Optional[str] = None


class DriverProfileOut(BaseModel):
    id: str
    user_id: str
    full_name: str
    phone: str
    dob: Optional[str] = None
    address: Optional[str] = None
    photo_url: Optional[str] = None
    status: str
    created_at: str


class DriverDocumentOut(BaseModel):
    id: str
    doc_type: str
    file_path: str
    verification_status: str
    notes: Optional[str] = None
    created_at: str


class DriverVehicleCreate(BaseModel):
    vehicle_type: Literal["sedan", "suv", "hatchback", "auto", "bike"]
    make: Optional[str] = Field(None, max_length=100)
    model: Optional[str] = Field(None, max_length=100)
    year: Optional[int] = None
    reg_number: str = Field(..., max_length=20)
    seats: int = Field(4, ge=1, le=10)


class DriverVehicleOut(BaseModel):
    id: str
    driver_id: str
    vehicle_type: str
    make: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    reg_number: str
    seats: int
    photo_url: Optional[str] = None
    created_at: str


@api_router.post("/driver/profile", response_model=DriverProfileOut)
@limiter.limit("10/minute")
async def create_driver_profile(
    request: Request,
    payload: DriverProfileCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    require_driver(current_user)
    try:
        result = await db.execute(
            select(DriverProfileModel).where(DriverProfileModel.user_id == str(current_user.id))
        )
        existing = result.scalar_one_or_none()
        if existing:
            raise HTTPException(400, detail="Driver profile already exists")

        profile = DriverProfileModel(
            user_id=str(current_user.id),
            full_name=payload.full_name,
            phone=payload.phone,
            dob=payload.dob,
            address=payload.address,
            status="pending",
        )
        db.add(profile)
        await db.flush()

        return DriverProfileOut(
            id=profile.id,
            user_id=profile.user_id,
            full_name=profile.full_name,
            phone=profile.phone,
            dob=profile.dob,
            address=profile.address,
            photo_url=profile.photo_url,
            status=profile.status,
            created_at=profile.created_at.isoformat(),
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("create_driver_profile failed", extra={"error": str(exc)})
        raise HTTPException(500, detail="Failed to create driver profile")


@api_router.get("/driver/profile", response_model=DriverProfileOut)
async def get_driver_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    require_driver(current_user)
    try:
        result = await db.execute(
            select(DriverProfileModel).where(DriverProfileModel.user_id == str(current_user.id))
        )
        profile = result.scalar_one_or_none()
        if not profile:
            raise HTTPException(404, detail="Driver profile not found")

        return DriverProfileOut(
            id=profile.id,
            user_id=profile.user_id,
            full_name=profile.full_name,
            phone=profile.phone,
            dob=profile.dob,
            address=profile.address,
            photo_url=profile.photo_url,
            status=profile.status,
            created_at=profile.created_at.isoformat(),
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("get_driver_profile failed", extra={"error": str(exc)})
        raise HTTPException(500, detail="Failed to fetch driver profile")


@api_router.post("/driver/documents", response_model=DriverDocumentOut)
@limiter.limit("20/minute")
async def upload_document(
    request: Request,
    doc_type: str = Query(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    require_driver(current_user)
    try:
        result = await db.execute(
            select(DriverProfileModel).where(DriverProfileModel.user_id == str(current_user.id))
        )
        profile = result.scalar_one_or_none()
        if not profile:
            raise HTTPException(400, detail="Create driver profile first")

        ext = os.path.splitext(file.filename or "doc")[1] or ".jpg"
        filename = f"{profile.id}_{doc_type}_{uuid.uuid4().hex[:8]}{ext}"
        filepath = os.path.join(UPLOADS_DIR, filename)
        content = await file.read()
        with open(filepath, "wb") as f:
            f.write(content)

        doc = DriverDocumentModel(
            driver_id=profile.id,
            doc_type=doc_type,
            file_path=f"/uploads/{filename}",
            verification_status="pending",
        )
        db.add(doc)
        await db.flush()

        return DriverDocumentOut(
            id=doc.id,
            doc_type=doc.doc_type,
            file_path=doc.file_path,
            verification_status=doc.verification_status,
            notes=doc.notes,
            created_at=doc.created_at.isoformat(),
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("upload_document failed", extra={"error": str(exc)})
        raise HTTPException(500, detail="Failed to upload document")


@api_router.get("/driver/documents", response_model=List[DriverDocumentOut])
async def list_documents(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    require_driver(current_user)
    try:
        result = await db.execute(
            select(DriverProfileModel).where(DriverProfileModel.user_id == str(current_user.id))
        )
        profile = result.scalar_one_or_none()
        if not profile:
            return []

        result = await db.execute(
            select(DriverDocumentModel).where(DriverDocumentModel.driver_id == profile.id)
        )
        docs = result.scalars().all()
        return [
            DriverDocumentOut(
                id=d.id,
                doc_type=d.doc_type,
                file_path=d.file_path,
                verification_status=d.verification_status,
                notes=d.notes,
                created_at=d.created_at.isoformat(),
            )
            for d in docs
        ]
    except Exception as exc:
        logger.error("list_documents failed", extra={"error": str(exc)})
        raise HTTPException(500, detail="Failed to fetch documents")


@api_router.post("/driver/vehicles", response_model=DriverVehicleOut)
@limiter.limit("10/minute")
async def create_vehicle(
    request: Request,
    payload: DriverVehicleCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    require_driver(current_user)
    try:
        result = await db.execute(
            select(DriverProfileModel).where(DriverProfileModel.user_id == str(current_user.id))
        )
        profile = result.scalar_one_or_none()
        if not profile:
            raise HTTPException(400, detail="Create driver profile first")

        vehicle = DriverVehicleModel(
            driver_id=profile.id,
            vehicle_type=payload.vehicle_type,
            make=payload.make,
            model=payload.model,
            year=payload.year,
            reg_number=payload.reg_number,
            seats=payload.seats,
        )
        db.add(vehicle)
        await db.flush()

        return DriverVehicleOut(
            id=vehicle.id,
            driver_id=vehicle.driver_id,
            vehicle_type=vehicle.vehicle_type,
            make=vehicle.make,
            model=vehicle.model,
            year=vehicle.year,
            reg_number=vehicle.reg_number,
            seats=vehicle.seats,
            photo_url=vehicle.photo_url,
            created_at=vehicle.created_at.isoformat(),
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("create_vehicle failed", extra={"error": str(exc)})
        raise HTTPException(500, detail="Failed to create vehicle")


@api_router.get("/driver/vehicles", response_model=List[DriverVehicleOut])
async def list_vehicles(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    require_driver(current_user)
    try:
        result = await db.execute(
            select(DriverProfileModel).where(DriverProfileModel.user_id == str(current_user.id))
        )
        profile = result.scalar_one_or_none()
        if not profile:
            return []

        result = await db.execute(
            select(DriverVehicleModel).where(DriverVehicleModel.driver_id == profile.id)
        )
        vehicles = result.scalars().all()
        return [
            DriverVehicleOut(
                id=v.id,
                driver_id=v.driver_id,
                vehicle_type=v.vehicle_type,
                make=v.make,
                model=v.model,
                year=v.year,
                reg_number=v.reg_number,
                seats=v.seats,
                photo_url=v.photo_url,
                created_at=v.created_at.isoformat(),
            )
            for v in vehicles
        ]
    except Exception as exc:
        logger.error("list_vehicles failed", extra={"error": str(exc)})
        raise HTTPException(500, detail="Failed to fetch vehicles")


# ---------- Driver Ride Operations ----------
@api_router.get("/driver/requests", response_model=List[DriverRequestOut])
async def list_driver_requests(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    require_driver(current_user)
    try:
        result = await db.execute(select(DriverRequestModel))
        requests = result.scalars().all()
        return [
            DriverRequestOut(
                id=r.id, pickup=r.pickup, drop=r.drop,
                distance=r.distance, duration=r.duration, fare=r.fare,
                rider=r.rider, rating=r.rating, tag=r.tag,
            )
            for r in requests
        ]
    except Exception as exc:
        logger.error("list_driver_requests failed", extra={"error": str(exc)})
        raise HTTPException(500, detail="Failed to fetch driver requests")


@api_router.post("/driver/requests/{req_id}/accept", response_model=RideOut)
async def accept_request(
    req_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    require_driver(current_user)
    try:
        result = await db.execute(select(DriverRequestModel).where(DriverRequestModel.id == req_id))
        req = result.scalar_one_or_none()
        if not req:
            raise HTTPException(404, detail="Request not found")

        profile_result = await db.execute(
            select(DriverProfileModel).where(DriverProfileModel.user_id == str(current_user.id))
        )
        profile = profile_result.scalar_one_or_none()
        vehicle_id = "v1"
        if profile:
            veh_result = await db.execute(
                select(DriverVehicleModel).where(DriverVehicleModel.driver_id == profile.id).limit(1)
            )
            veh = veh_result.scalar_one_or_none()
            if veh:
                vehicle_id = veh.id

        ride = RideModel(
            id=str(uuid.uuid4()),
            user_id=str(uuid.uuid4()),
            driver_id=str(current_user.id),
            vehicle_id=vehicle_id,
            stops=[
                {"label": req.pickup, "sub": "Pickup"},
                {"label": req.drop, "sub": "Drop-off"},
            ],
            fare=req.fare,
            payment_method="card",
            status="arriving",
            created_at=datetime.now(timezone.utc),
        )
        db.add(ride)
        await db.delete(req)
        await db.flush()

        return RideOut(
            id=ride.id,
            user_id=ride.user_id,
            driver_id=ride.driver_id,
            vehicle_id=ride.vehicle_id,
            stops=[RideStop(**s) for s in ride.stops],
            fare=ride.fare,
            payment_method=ride.payment_method,
            tip=ride.tip,
            status=ride.status,
            created_at=ride.created_at.isoformat(),
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("accept_request failed", extra={"error": str(exc), "req_id": req_id})
        raise HTTPException(500, detail="Failed to accept request")


@api_router.post("/driver/requests/{req_id}/decline")
async def decline_request(
    req_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    require_driver(current_user)
    try:
        result = await db.execute(select(DriverRequestModel).where(DriverRequestModel.id == req_id))
        req = result.scalar_one_or_none()
        if not req:
            raise HTTPException(404, detail="Request not found")
        await db.delete(req)
        await db.flush()
        return {"status": "declined"}
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("decline_request failed", extra={"error": str(exc), "req_id": req_id})
        raise HTTPException(500, detail="Failed to decline request")


@api_router.get("/driver/stats", response_model=DriverStats)
async def driver_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    require_driver(current_user)
    try:
        result = await db.execute(
            select(
                func.count().label("trips"),
                func.coalesce(func.sum(RideModel.fare), 0).label("earnings"),
            ).where(
                RideModel.driver_id == str(current_user.id),
                RideModel.status == "completed",
            )
        )
        row = result.one()
        trips = row.trips
        earnings = int(row.earnings)

        if trips == 0:
            return DriverStats(earnings=0, trips=0, hours=0.0)
        return DriverStats(earnings=earnings, trips=trips, hours=round(trips * 1.2, 1))
    except Exception as exc:
        logger.error("driver_stats failed", extra={"error": str(exc)})
        raise HTTPException(500, detail="Failed to fetch driver stats")


# ---------- Static files (uploads) ----------

# ---------- Driver Location Tracking ----------
class DriverLocationUpdate(BaseModel):
    ride_id: str = Field(..., max_length=36)
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)
    heading: Optional[float] = Field(None, ge=0, le=360)
    speed: Optional[float] = Field(None, ge=0)


@api_router.post("/driver/location")
@limiter.limit("30/minute")
async def update_driver_location(
    request: Request,
    payload: DriverLocationUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    require_driver(current_user)
    result = await db.execute(
        select(RideModel).where(
            RideModel.id == payload.ride_id,
            RideModel.driver_id == str(current_user.id),
        )
    )
    ride = result.scalar_one_or_none()
    if not ride:
        raise HTTPException(404, detail="Ride not found or not assigned to you")

    ride.driver_lat = payload.lat
    ride.driver_lng = payload.lng
    ride.driver_heading = payload.heading
    ride.driver_speed = payload.speed
    ride.location_updated_at = datetime.now(timezone.utc)
    await db.flush()
    return {"status": "ok"}


@api_router.get("/rides/{ride_id}/driver-location")
async def get_driver_location(
    ride_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(RideModel).where(RideModel.id == ride_id))
    ride = result.scalar_one_or_none()
    if not ride:
        raise HTTPException(404, detail="Ride not found")
    return {
        "lat": ride.driver_lat,
        "lng": ride.driver_lng,
        "heading": ride.driver_heading,
        "speed": ride.driver_speed,
        "updated_at": ride.location_updated_at.isoformat() if ride.location_updated_at else None,
    }


# ---------- Ride PIN Verification ----------
class RidePinVerify(BaseModel):
    pin: str = Field(..., min_length=4, max_length=4)


@api_router.post("/rides/{ride_id}/verify-pin")
async def verify_ride_pin(
    ride_id: str,
    payload: RidePinVerify,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    require_driver(current_user)
    result = await db.execute(
        select(RideModel).where(
            RideModel.id == ride_id,
            RideModel.driver_id == str(current_user.id),
        )
    )
    ride = result.scalar_one_or_none()
    if not ride:
        raise HTTPException(404, detail="Ride not found")
    if ride.ride_pin != payload.pin:
        raise HTTPException(400, detail="Invalid PIN")
    ride.status = "onboard"
    await db.flush()
    return {"status": "ok", "message": "Ride started"}


# ---------- Trip Sharing ----------
@api_router.get("/rides/{ride_id}/share")
async def share_ride(
    ride_id: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(RideModel).where(RideModel.id == ride_id))
    ride = result.scalar_one_or_none()
    if not ride:
        raise HTTPException(404, detail="Ride not found")
    return {
        "ride_id": ride.id,
        "status": ride.status,
        "driver_lat": ride.driver_lat,
        "driver_lng": ride.driver_lng,
        "stops": ride.stops,
        "fare": ride.fare,
    }


# ---------- Static files (uploads) ----------
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

# ---------- Include router ----------
app.include_router(api_router)
