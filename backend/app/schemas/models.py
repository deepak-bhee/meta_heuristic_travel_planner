from pydantic import BaseModel, Field
from typing import List, Optional

class LocationRequest(BaseModel):
    name: str

class PredictRequest(BaseModel):
    city: str
    days: int = Field(default=1, ge=1)
    preference: str = Field(default="medium")
    locations: List[str]

class LocationSchema(BaseModel):
    name: str
    lat: float
    lng: float
    rating: float
    open_time: str
    close_time: str
    visit_duration: float
    mandatory: bool

class ScheduleItem(BaseModel):
    location: str
    arrival_time: str
    departure_time: str
    status: str

class DayItinerary(BaseModel):
    day: int
    schedule: List[ScheduleItem]

class OptimizationMetadata(BaseModel):
    score: float
    iterations: int
    seed: int

class ItineraryMetadata(BaseModel):
    city: str
    days: int
    preference: str
    optimization: OptimizationMetadata
    model_schema: str

class PredictResponse(BaseModel):
    itinerary: List[DayItinerary]
    total_travel_time: str
    total_distance: str
    warnings: List[str]
    metadata: ItineraryMetadata
