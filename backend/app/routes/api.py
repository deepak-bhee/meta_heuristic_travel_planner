from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from app.schemas.models import PredictRequest, PredictResponse, LocationSchema
from app.services.prediction import predict, get_cities, get_locations

router = APIRouter()

@router.get("/")
def root_check():
    return {"status": "ok", "message": "WanderAI Backend is running", "version": "1.0.0"}

@router.get("/health")
def health_check():
    return {"status": "ok", "message": "CAA-TIOS-ND Backend is running"}

@router.get("/cities", response_model=List[str])
def list_cities():
    cities = get_cities()
    return cities

@router.get("/locations/{city}", response_model=List[LocationSchema])
def list_locations(city: str):
    locations = get_locations(city)
    if not locations:
        raise HTTPException(status_code=404, detail="City not found or has no locations")
    return locations

@router.post("/predict", response_model=PredictResponse)
def predict_itinerary_route(request: PredictRequest):
    try:
        result = predict(
            city=request.city,
            days=request.days,
            preference=request.preference,
            locations=request.locations
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
