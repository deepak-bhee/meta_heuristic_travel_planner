# This module trains a Constraint-Aware Adaptive Travel Itinerary Optimization
# System with Intelligent Nearby Discovery (CAA-TIOS-ND).

import json
import joblib
import warnings
from pathlib import Path
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    mean_absolute_error,
    mean_squared_error,
    precision_score,
    r2_score,
    recall_score,
)
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.dummy import DummyClassifier

# Suppress warnings
warnings.filterwarnings("ignore", category=UserWarning, module='sklearn')

def time_to_min(time_str):
    """Converts HH:MM string to minutes from midnight."""
    if pd.isna(time_str) or not isinstance(time_str, str) or ':' not in time_str:
        return None
    try:
        h, m = map(int, time_str.split(':'))
        return h * 60 + m
    except:
        return None

def read_dataset(csv_path: str) -> pd.DataFrame:
    """Reads the dataset and adds a travel_id."""
    df = pd.read_csv(csv_path)
    df['travel_id'] = range(len(df))
    return df

def build_vocabularies(df: pd.DataFrame):
    """Builds vocabularies for cities and locations from the nested structure."""
    cities = df["input/start_location/city"].unique().tolist()
    
    locations = {}
    # Iterate over possible location indices (0 to 4 based on CSV header)
    for i in range(5):
        name_col = f"input/locations/{i}/name"
        if name_col not in df.columns:
            continue
            
        subset = df[[name_col, f"input/locations/{i}/lat", f"input/locations/{i}/lng", 
                     f"input/locations/{i}/rating", f"input/locations/{i}/open_time", 
                     f"input/locations/{i}/close_time", f"input/locations/{i}/visit_duration", 
                     f"input/locations/{i}/mandatory"]].dropna(subset=[name_col])
        
        for _, row in subset.iterrows():
            name = row[name_col]
            if name not in locations:
                try:
                    open_m = time_to_min(row[f"input/locations/{i}/open_time"])
                    close_m = time_to_min(row[f"input/locations/{i}/close_time"])
                    lat = pd.to_numeric(row[f"input/locations/{i}/lat"], errors='coerce')
                    lng = pd.to_numeric(row[f"input/locations/{i}/lng"], errors='coerce')
                    rating = pd.to_numeric(row[f"input/locations/{i}/rating"], errors='coerce')
                    duration = pd.to_numeric(row[f"input/locations/{i}/visit_duration"], errors='coerce')
                    
                    if pd.isna(lat) or pd.isna(lng):
                        continue

                    locations[name] = {
                        "lat": float(lat),
                        "lng": float(lng),
                        "rating": float(rating) if pd.notna(rating) else 0.0,
                        "open_time": (open_m // 60, open_m % 60) if open_m is not None else (8, 0),
                        "close_time": (close_m // 60, close_m % 60) if close_m is not None else (20, 0),
                        "visit_duration": float(duration) if pd.notna(duration) else 0.0,
                        "mandatory": bool(row[f"input/locations/{i}/mandatory"]),
                    }
                except:
                    continue
    return cities, locations

def build_stop_level_examples(df: pd.DataFrame, locations_vocab: dict) -> pd.DataFrame:
    """Flattens the itinerary-level dataframe into stop-level examples."""
    rows = []
    for _, itin in df.iterrows():
        # Common features
        city = itin["input/start_location/city"]
        days = pd.to_numeric(itin["input/days"], errors='coerce')
        priority = itin.get("input/preferences/priority", "medium")
        travel_id = itin["travel_id"]
        
        itin_locs = []
        for i in range(5):
            name_col = f"input/locations/{i}/name"
            if name_col in itin and pd.notna(itin[name_col]):
                try:
                    lat = pd.to_numeric(itin[f"input/locations/{i}/lat"], errors='coerce')
                    lng = pd.to_numeric(itin[f"input/locations/{i}/lng"], errors='coerce')
                    rating = pd.to_numeric(itin[f"input/locations/{i}/rating"], errors='coerce')
                    duration = pd.to_numeric(itin[f"input/locations/{i}/visit_duration"], errors='coerce')
                    
                    if pd.isna(lat) or pd.isna(lng):
                        continue

                    itin_locs.append({
                        "index": i,
                        "name": itin[name_col],
                        "lat": float(lat),
                        "lng": float(lng),
                        "rating": float(rating) if pd.notna(rating) else 0.0,
                        "open_min": time_to_min(itin[f"input/locations/{i}/open_time"]) or 480,
                        "close_min": time_to_min(itin[f"input/locations/{i}/close_time"]) or 1200,
                        "visit_duration": float(duration) if pd.notna(duration) else 0.0,
                        "mandatory": bool(itin[f"input/locations/{i}/mandatory"])
                    })
                except:
                    continue
        
        if not itin_locs:
            continue
            
        location_count = len(itin_locs)
        mandatory_count = sum(1 for l in itin_locs if l["mandatory"])
        avg_rating = np.mean([l["rating"] for l in itin_locs])
        max_rating = np.max([l["rating"] for l in itin_locs])
        total_visit_duration = sum(l["visit_duration"] for l in itin_locs)
        earliest_open_min = min(l["open_min"] for l in itin_locs)
        latest_close_min = max(l["close_min"] for l in itin_locs)
        
        # Geo span
        max_dist = 0
        for i in range(len(itin_locs)):
            for j in range(i+1, len(itin_locs)):
                dist = haversine(itin_locs[i]["lat"], itin_locs[i]["lng"], itin_locs[j]["lat"], itin_locs[j]["lng"])
                if dist > max_dist:
                    max_dist = dist
        geo_span_km = max_dist

        for loc_info in itin_locs:
            i = loc_info["index"]
            name = loc_info["name"]
            
            row = {
                "travel_id": travel_id,
                "city": city,
                "days": days,
                "priority": priority,
                "location_name": name,
                "city_location": f"{city}_{name}",
                "slot_index": i,
                "lat": loc_info["lat"],
                "lng": loc_info["lng"],
                "rating": loc_info["rating"],
                "open_min": loc_info["open_min"],
                "close_min": loc_info["close_min"],
                "visit_duration": loc_info["visit_duration"],
                "mandatory": loc_info["mandatory"],
                "window_span": loc_info["close_min"] - loc_info["open_min"],
                "window_slack": (loc_info["close_min"] - loc_info["open_min"]) - loc_info["visit_duration"],
                "location_count": location_count,
                "mandatory_count": mandatory_count,
                "avg_rating": avg_rating,
                "max_rating": max_rating,
                "total_visit_duration": total_visit_duration,
                "earliest_open_min": earliest_open_min,
                "latest_close_min": latest_close_min,
                "geo_span_km": geo_span_km,
                # Targets
                "target_position": i,
                "target_arrival_min": time_to_min(itin.get(f"output/itinerary/0/schedule/{i}/arrival_time")),
                "target_departure_min": time_to_min(itin.get(f"output/itinerary/0/schedule/{i}/departure_time")),
                "target_status": itin.get(f"output/itinerary/0/schedule/{i}/status", "unknown"),
                "target_location_warning": 0 if name in locations_vocab else 1
            }
            rows.append(row)
            
    return pd.DataFrame(rows)

def haversine(lat1, lon1, lat2, lon2) -> float:
    R = 6371
    lat1, lon1, lat2, lon2 = map(np.radians, [lat1, lon1, lat2, lon2])
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = np.sin(dlat / 2.0) ** 2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon / 2.0) ** 2
    c = 2 * np.arcsin(np.sqrt(a))
    return R * c

def build_preprocessor(categorical_features, numeric_features):
    numeric_transformer = Pipeline(steps=[("scaler", StandardScaler())])
    categorical_transformer = Pipeline(steps=[("onehot", OneHotEncoder(handle_unknown="ignore"))])
    return ColumnTransformer(
        transformers=[
            ("num", numeric_transformer, numeric_features),
            ("cat", categorical_transformer, categorical_features),
        ]
    )

def train(args):
    df = read_dataset(args.csv)
    cities, locations = build_vocabularies(df)
    examples = build_stop_level_examples(df, locations)

    categorical_features = ["city", "priority", "location_name", "city_location"]
    numeric_features = [
        "days", "slot_index", "lat", "lng", "rating", "open_min", "close_min",
        "visit_duration", "mandatory", "window_span", "window_slack",
        "location_count", "mandatory_count", "avg_rating", "max_rating",
        "total_visit_duration", "earliest_open_min", "latest_close_min", "geo_span_km",
    ]
    feature_cols = categorical_features + numeric_features
    preprocessor = build_preprocessor(categorical_features, numeric_features)
    preprocessor.fit(examples[feature_cols])

    models_config = {
        "rank_model": {"target": "target_position", "type": "regressor", "estimator": RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)},
        "arrival_model": {"target": "target_arrival_min", "type": "regressor", "estimator": RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)},
        "departure_model": {"target": "target_departure_min", "type": "regressor", "estimator": RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)},
        "status_model": {"target": "target_status", "type": "classifier", "estimator": RandomForestClassifier(n_estimators=100, random_state=42, class_weight="balanced", n_jobs=-1)},
        "warning_model": {"target": "target_location_warning", "type": "classifier", "estimator": RandomForestClassifier(n_estimators=100, random_state=42, class_weight="balanced", n_jobs=-1)},
    }

    trained_models = {"preprocessor": preprocessor}
    metrics = {}

    for name, config in models_config.items():
        target_col = config["target"]
        model_type = config["type"]
        estimator = config["estimator"]

        usable = examples.dropna(subset=[target_col]).copy()
        if usable.empty: continue

        X_train, X_test, y_train, y_test = train_test_split(
            usable[feature_cols], usable[target_col], test_size=0.2, random_state=42
        )

        X_train_proc = preprocessor.transform(X_train)
        X_test_proc = preprocessor.transform(X_test)
        
        estimator.fit(X_train_proc, y_train)
        y_pred = estimator.predict(X_test_proc)

        if model_type == "regressor":
            metrics[name] = {"mae": mean_absolute_error(y_test, y_pred), "r2": r2_score(y_test, y_pred)}
        else:
            metrics[name] = {"accuracy": accuracy_score(y_test, y_pred), "f1_macro": f1_score(y_test, y_pred, average="macro", zero_division=0)}

        trained_models[name] = estimator

    joblib.dump(trained_models, args.model_out)
    with open(args.report_out, "w") as f:
        json.dump({"metrics": metrics, "cities": cities, "locations": locations}, f, indent=2)

def min_to_time(minutes):
    """Converts minutes from midnight to HH:MM string."""
    h = int(minutes // 60) % 24
    m = int(minutes % 60)
    return f"{h:02d}:{m:02d}"

def predict_itinerary(trip_data: dict, artifact) -> dict:
    """Predicts and optimizes an itinerary based on trained models."""
    # Models
    preprocessor = artifact["preprocessor"]
    rank_model = artifact["rank_model"]
    arrival_model = artifact["arrival_model"]
    departure_model = artifact["departure_model"]
    status_model = artifact["status_model"]
    warning_model = artifact["warning_model"]
    
    # Vocabularies
    cities_vocab = artifact.get("cities", [])
    locations_vocab = artifact.get("locations", {})
    
    city = trip_data.get("city", "unknown")
    days = trip_data.get("days", 1)
    priority = trip_data.get("preference", "medium")
    
    # Prepare stop-level features for each location
    loc_rows = []
    for i, loc in enumerate(trip_data.get("locations", [])):
        name = loc.get("name")
        # Get metadata from vocab or custom input
        meta = locations_vocab.get(name, {})
        lat = loc.get("lat", meta.get("lat", 0.0))
        lng = loc.get("lng", meta.get("lng", 0.0))
        rating = loc.get("rating", meta.get("rating", 0.0))
        duration = loc.get("visit_duration", meta.get("visit_duration", 60))
        mandatory = loc.get("mandatory", meta.get("mandatory", False))
        
        # Open/Close times
        if "open_time" in loc:
            open_min = time_to_min(loc["open_time"]) or 480
        elif "open_time" in meta:
            open_min = meta["open_time"][0] * 60 + meta["open_time"][1]
        else:
            open_min = 480 # 08:00 default
            
        if "close_time" in loc:
            close_min = time_to_min(loc["close_time"]) or 1200
        elif "close_time" in meta:
            close_min = meta["close_time"][0] * 60 + meta["close_time"][1]
        else:
            close_min = 1200 # 20:00 default

        loc_rows.append({
            "city": city,
            "priority": priority,
            "location_name": name,
            "city_location": f"{city}_{name}",
            "days": days,
            "slot_index": i,
            "lat": float(lat),
            "lng": float(lng),
            "rating": float(rating),
            "open_min": float(open_min),
            "close_min": float(close_min),
            "visit_duration": float(duration),
            "mandatory": bool(mandatory),
            "window_span": float(close_min - open_min),
            "window_slack": float((close_min - open_min) - duration)
        })

    if not loc_rows:
        return {"itinerary": [], "model_schema": "caa-tios-nd-v1"}

    # Add aggregate features
    df_locs = pd.DataFrame(loc_rows)
    df_locs["location_count"] = len(loc_rows)
    df_locs["mandatory_count"] = df_locs["mandatory"].sum()
    df_locs["avg_rating"] = df_locs["rating"].mean()
    df_locs["max_rating"] = df_locs["rating"].max()
    df_locs["total_visit_duration"] = df_locs["visit_duration"].sum()
    df_locs["earliest_open_min"] = df_locs["open_min"].min()
    df_locs["latest_close_min"] = df_locs["close_min"].max()
    
    # Simple geo span
    if len(loc_rows) > 1:
        coords = df_locs[["lat", "lng"]].values
        max_dist = 0
        for i in range(len(coords)):
            for j in range(i+1, len(coords)):
                d = haversine(coords[i][0], coords[i][1], coords[j][0], coords[j][1])
                if d > max_dist: max_dist = d
        df_locs["geo_span_km"] = max_dist
    else:
        df_locs["geo_span_km"] = 0.0

    # Predictions
    # Ensure column order matches training
    feature_cols = ["city", "priority", "location_name", "city_location", "days", "slot_index", "lat", "lng", "rating", "open_min", "close_min", "visit_duration", "mandatory", "window_span", "window_slack", "location_count", "mandatory_count", "avg_rating", "max_rating", "total_visit_duration", "earliest_open_min", "latest_close_min", "geo_span_km"]
    
    X = df_locs[feature_cols]
    X_proc = preprocessor.transform(X)

    df_locs["pred_rank"] = rank_model.predict(X_proc)
    df_locs["pred_arrival"] = arrival_model.predict(X_proc)
    df_locs["pred_departure"] = departure_model.predict(X_proc)
    df_locs["pred_status"] = status_model.predict(X_proc)
    
    # Warnings (optional)
    if warning_model:
        df_locs["pred_warning"] = warning_model.predict(X_proc)

    # Format result
    # Group by predicted days if multiple days exist (simplified)
    # For this model, we'll assign to Day 1 and sort by predicted rank
    sorted_locs = df_locs.sort_values("pred_rank")
    
    schedule = []
    for _, row in sorted_locs.iterrows():
        schedule.append({
            "location": row["location_name"],
            "arrival_time": min_to_time(row["pred_arrival"]),
            "departure_time": min_to_time(row["pred_departure"]),
            "status": str(row["pred_status"])
        })

    result = {
        "itinerary": [
            {
                "day": 1,
                "schedule": schedule
            }
        ],
        "total_travel_time": f"{int(df_locs['visit_duration'].sum())} minutes",
        "total_distance": f"{df_locs['geo_span_km'].max():.2f} km",
        "warnings": [
            f"Traffic delay predicted for {name}" for name, warn in zip(df_locs["location_name"], df_locs.get("pred_warning", [0]*len(df_locs))) if warn == 1
        ],
        "metadata": {
            "city": city,
            "days": days,
            "preference": priority,
            "optimization": {
                "score": 0.0,
                "iterations": trip_data.get("metaheuristic_iterations", 0),
                "seed": trip_data.get("metaheuristic_seed", 0)
            },
            "model_schema": "caa-tios-nd-v1"
        }
    }
    
    return result

if __name__ == '__main__':
    print("Module 'train_caa_tios_nd' loaded.")
