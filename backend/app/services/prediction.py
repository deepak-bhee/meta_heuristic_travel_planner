import json
import os
import sys
import joblib

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from model import train_caa_tios_nd

MODEL_PATH = os.path.join(os.path.dirname(__file__), "../../..", "model/caa_tios_nd_model.joblib")
REPORT_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../..", "model/training_report.json"))
LOCATIONS_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../data/locations.json"))

# Global variables to cache the model and vocabularies
_artifact = None

def get_artifact():
    global _artifact
    if _artifact is None:
        print("Loading model and vocabularies...")
        artifact = joblib.load(MODEL_PATH)
        
        with open(REPORT_PATH, 'r') as f:
            report_data = json.load(f)
            artifact["cities"] = report_data.get("cities", [])
            artifact["locations"] = report_data.get("locations", {})
            
        _artifact = artifact
        print("Model loaded successfully.")
    return _artifact

def predict(city: str, days: int, preference: str, locations: list) -> dict:
    """
    Format request for the predict_itinerary function.
    """
    artifact = get_artifact()
    
    # Process locations to ensure they have the minimum required format
    processed_locations = []
    for loc in locations:
        if isinstance(loc, str):
            processed_locations.append({"name": loc})
        elif isinstance(loc, dict):
            processed_locations.append(loc)
            
    trip_data = {
        "city": city,
        "days": days,
        "preference": preference,
        "locations": processed_locations,
        "metadata": {
            "city": city,
            "days": days,
            "preference": preference,
            "optimization": {
                "score": 0.0,
                "iterations": 0,
                "seed": 0
            },
            "model_schema": "wanderai-v1"
        }
    }
    
    result = train_caa_tios_nd.predict_itinerary(trip_data, artifact)
    return result

def get_cities():
    artifact = get_artifact()
    return artifact.get("cities", [])

def get_locations(city: str):
    try:
        with open(LOCATIONS_PATH, 'r') as f:
            data = json.load(f)
        return data.get(city, [])
    except FileNotFoundError:
        return []
