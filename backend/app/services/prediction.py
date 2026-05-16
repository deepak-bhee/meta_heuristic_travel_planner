import sys
import os
import joblib
import json

# Add parent directory to path to import train_caa_tios_nd
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../")))
from train_caa_tios_nd import predict_itinerary

MODEL_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../caa_tios_nd_model.joblib"))
REPORT_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../training_report.json"))
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

def predict(city: str, days: int, preference: str, location_names: list) -> dict:
    """
    Format request for the predict_itinerary function.
    """
    artifact = get_artifact()
    
    trip_data = {
        "city": city,
        "days": days,
        "preference": preference,
        "locations": [{"name": name} for name in location_names]
    }
    
    result = predict_itinerary(trip_data, artifact)
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
