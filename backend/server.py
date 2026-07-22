from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Literal
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

app = FastAPI(title="Sakleshpura Rides API", version="1.0.0")
api_router = APIRouter(prefix="/api")

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


# ---------- Models ----------
class Package(BaseModel):
    id: str
    title: str
    subtitle: str
    price: int
    duration: str
    stops: int
    image: str


class Vehicle(BaseModel):
    id: str
    name: str
    desc: str
    seats: int
    fare: int
    eta: str
    icon: str


class RideStop(BaseModel):
    label: str
    sub: Optional[str] = None


class RideCreate(BaseModel):
    user_id: str = "explorer"
    vehicle_id: str
    stops: List[RideStop]
    fare: int
    payment_method: Literal["card", "upi"]
    tip: Optional[int] = 0


class Ride(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str = "explorer"
    driver_id: Optional[str] = "driver-ravi"
    vehicle_id: str
    stops: List[RideStop]
    fare: int
    payment_method: Literal["card", "upi"]
    tip: int = 0
    status: Literal["arriving", "onboard", "arrived", "completed", "cancelled"] = "arriving"
    created_at: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )


class RideStatusUpdate(BaseModel):
    status: Literal["arriving", "onboard", "arrived", "completed", "cancelled"]


class RatingCreate(BaseModel):
    ride_id: str
    stars: int = Field(ge=1, le=5)
    tags: List[str] = []
    note: Optional[str] = None
    tip: Optional[int] = 0


class Rating(RatingCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )


class DriverRequest(BaseModel):
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


# ---------- Seed data ----------
PACKAGES = [
    {"id": "p1", "title": "Misty Coffee Estates", "subtitle": "Full-day estate walk", "price": 2499, "duration": "8 hrs", "stops": 4, "image": "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=1200&q=70"},
    {"id": "p2", "title": "Bisle Ghat Viewpoint", "subtitle": "Sunrise ridge drive", "price": 1899, "duration": "5 hrs", "stops": 3, "image": "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?auto=format&fit=crop&w=1200&q=70"},
    {"id": "p3", "title": "Manjarabad Fort", "subtitle": "Star-shaped heritage", "price": 1499, "duration": "4 hrs", "stops": 2, "image": "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=70"},
    {"id": "p4", "title": "Hills & Homestays", "subtitle": "Overnight coffee stay", "price": 4999, "duration": "24 hrs", "stops": 5, "image": "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=70"},
    {"id": "p5", "title": "Hanbal Waterfall Trail", "subtitle": "Monsoon cascade", "price": 1799, "duration": "5 hrs", "stops": 2, "image": "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=1200&q=70"},
    {"id": "p6", "title": "Shanti Falls & Green Route", "subtitle": "Rainforest loop", "price": 2199, "duration": "6 hrs", "stops": 3, "image": "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=70"},
    {"id": "p7", "title": "Kukke Subrahmanya Temple", "subtitle": "Sacred hill drive", "price": 2899, "duration": "10 hrs", "stops": 3, "image": "https://images.unsplash.com/photo-1587922546925-160ad1cd3b2a?auto=format&fit=crop&w=1200&q=70"},
    {"id": "p8", "title": "Mookanamane Falls", "subtitle": "Off-road adventure", "price": 2299, "duration": "6 hrs", "stops": 2, "image": "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1200&q=70"},
    {"id": "p9", "title": "Sakleshpur Sunset Point", "subtitle": "Golden hour ridge", "price": 1299, "duration": "3 hrs", "stops": 1, "image": "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=70"},
    {"id": "p10", "title": "Green Route Railway Walk", "subtitle": "Abandoned viaducts", "price": 2599, "duration": "7 hrs", "stops": 4, "image": "https://images.unsplash.com/photo-1418065460487-3956c3465ee2?auto=format&fit=crop&w=1200&q=70"},
]

VEHICLES = [
    {"id": "v1", "name": "Sedan", "desc": "Comfortable, AC", "seats": 4, "fare": 2199, "eta": "3 min", "icon": "car-outline"},
    {"id": "v2", "name": "SUV", "desc": "Extra space, hill-ready", "seats": 6, "fare": 2899, "eta": "5 min", "icon": "car-sport-outline"},
    {"id": "v3", "name": "Traveller", "desc": "Group minivan", "seats": 12, "fare": 4499, "eta": "8 min", "icon": "bus-outline"},
    {"id": "v4", "name": "Premium", "desc": "Executive class", "seats": 4, "fare": 3499, "eta": "6 min", "icon": "car-outline"},
]

DRIVER_REQUESTS = [
    {"id": "r1", "pickup": "Sakleshpura Bus Stand", "drop": "Bisle Ghat Viewpoint", "distance": "46 km", "duration": "1h 40m", "fare": 2199, "rider": "Aditi S.", "rating": 4.9, "tag": "3 stops"},
    {"id": "r2", "pickup": "Green Route Homestay", "drop": "Manjarabad Fort", "distance": "12 km", "duration": "22 min", "fare": 899, "rider": "Rohit K.", "rating": 4.8, "tag": "Direct"},
    {"id": "r3", "pickup": "Coffee Estate Retreat", "drop": "Hanbal Falls", "distance": "18 km", "duration": "32 min", "fare": 1499, "rider": "Priya M.", "rating": 5.0, "tag": "2 stops"},
]


@app.on_event("startup")
async def seed_db():
    """Idempotent seed — only inserts if the collection is empty."""
    if await db.packages.count_documents({}) == 0:
        await db.packages.insert_many([{**p} for p in PACKAGES])
        logger.info("Seeded packages")
    if await db.vehicles.count_documents({}) == 0:
        await db.vehicles.insert_many([{**v} for v in VEHICLES])
        logger.info("Seeded vehicles")
    if await db.driver_requests.count_documents({}) == 0:
        await db.driver_requests.insert_many([{**r} for r in DRIVER_REQUESTS])
        logger.info("Seeded driver_requests")


# ---------- Routes ----------
@api_router.get("/")
async def root():
    return {"service": "sakleshpura-rides", "status": "ok"}


@api_router.get("/packages", response_model=List[Package])
async def list_packages():
    docs = await db.packages.find({}, {"_id": 0}).to_list(100)
    return [Package(**d) for d in docs]


@api_router.get("/vehicles", response_model=List[Vehicle])
async def list_vehicles():
    docs = await db.vehicles.find({}, {"_id": 0}).to_list(100)
    return [Vehicle(**d) for d in docs]


@api_router.post("/rides", response_model=Ride)
async def create_ride(payload: RideCreate):
    ride = Ride(**payload.dict())
    await db.rides.insert_one(ride.dict())
    return ride


@api_router.get("/rides", response_model=List[Ride])
async def list_rides(user_id: str = "explorer"):
    docs = (
        await db.rides.find({"user_id": user_id}, {"_id": 0})
        .sort("created_at", -1)
        .to_list(200)
    )
    return [Ride(**d) for d in docs]


@api_router.get("/rides/{ride_id}", response_model=Ride)
async def get_ride(ride_id: str):
    doc = await db.rides.find_one({"id": ride_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Ride not found")
    return Ride(**doc)


@api_router.patch("/rides/{ride_id}/status", response_model=Ride)
async def update_ride_status(ride_id: str, payload: RideStatusUpdate):
    result = await db.rides.find_one_and_update(
        {"id": ride_id},
        {"$set": {"status": payload.status}},
        projection={"_id": 0},
        return_document=True,
    )
    if not result:
        raise HTTPException(404, "Ride not found")
    return Ride(**result)


@api_router.post("/ratings", response_model=Rating)
async def create_rating(payload: RatingCreate):
    rating = Rating(**payload.dict())
    await db.ratings.insert_one(rating.dict())
    # Also mark ride completed
    await db.rides.update_one(
        {"id": payload.ride_id}, {"$set": {"status": "completed", "tip": payload.tip or 0}}
    )
    return rating


@api_router.get("/driver/requests", response_model=List[DriverRequest])
async def list_driver_requests():
    docs = await db.driver_requests.find({}, {"_id": 0}).to_list(100)
    return [DriverRequest(**d) for d in docs]


@api_router.post("/driver/requests/{req_id}/accept", response_model=Ride)
async def accept_request(req_id: str):
    req = await db.driver_requests.find_one({"id": req_id}, {"_id": 0})
    if not req:
        raise HTTPException(404, "Request not found")
    ride = Ride(
        vehicle_id="v2",
        stops=[
            RideStop(label=req["pickup"], sub="Pickup"),
            RideStop(label=req["drop"], sub="Drop-off"),
        ],
        fare=req["fare"],
        payment_method="card",
        status="arriving",
    )
    await db.rides.insert_one(ride.dict())
    # Remove from queue
    await db.driver_requests.delete_one({"id": req_id})
    return ride


@api_router.get("/driver/stats", response_model=DriverStats)
async def driver_stats():
    completed = await db.rides.count_documents({"status": "completed"})
    earnings_agg = await db.rides.aggregate(
        [{"$match": {"status": "completed"}}, {"$group": {"_id": None, "sum": {"$sum": "$fare"}}}]
    ).to_list(1)
    earnings = earnings_agg[0]["sum"] if earnings_agg else 3420
    # Static-ish demo numbers when no rides yet
    if completed == 0:
        return DriverStats(earnings=3420, trips=6, hours=7.4)
    return DriverStats(
        earnings=earnings, trips=completed, hours=round(completed * 1.2, 1)
    )


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
