import pandas as pd
import json
import os

def time_to_min(time_str):
    if pd.isna(time_str) or not isinstance(time_str, str) or ':' not in time_str:
        return None
    try:
        h, m = map(int, time_str.split(':'))
        return h * 60 + m
    except:
        return None

def extract_locations_by_city(csv_path, output_path):
    df = pd.read_csv(csv_path)
    city_locations = {}
    
    for _, row in df.iterrows():
        city = row.get("input/start_location/city")
        if pd.isna(city):
            continue
        
        if city not in city_locations:
            city_locations[city] = {}
            
        for i in range(5):
            name_col = f"input/locations/{i}/name"
            if name_col in df.columns and pd.notna(row[name_col]):
                name = row[name_col]
                
                # Check if we already have this location for the city
                if name not in city_locations[city]:
                    try:
                        open_m = time_to_min(row.get(f"input/locations/{i}/open_time"))
                        close_m = time_to_min(row.get(f"input/locations/{i}/close_time"))
                        lat = pd.to_numeric(row.get(f"input/locations/{i}/lat"), errors='coerce')
                        lng = pd.to_numeric(row.get(f"input/locations/{i}/lng"), errors='coerce')
                        rating = pd.to_numeric(row.get(f"input/locations/{i}/rating"), errors='coerce')
                        duration = pd.to_numeric(row.get(f"input/locations/{i}/visit_duration"), errors='coerce')
                        mandatory = row.get(f"input/locations/{i}/mandatory", False)
                        
                        if pd.isna(lat) or pd.isna(lng):
                            continue
                            
                        open_time_str = f"{open_m // 60:02d}:{open_m % 60:02d}" if open_m is not None else "08:00"
                        close_time_str = f"{close_m // 60:02d}:{close_m % 60:02d}" if close_m is not None else "20:00"

                        city_locations[city][name] = {
                            "name": name,
                            "lat": float(lat),
                            "lng": float(lng),
                            "rating": float(rating) if pd.notna(rating) else 0.0,
                            "open_time": open_time_str,
                            "close_time": close_time_str,
                            "visit_duration": float(duration) if pd.notna(duration) else 60.0,
                            "mandatory": bool(mandatory)
                        }
                    except:
                        continue

    # Convert inner dictionaries to lists
    final_output = {city: list(locs.values()) for city, locs in city_locations.items()}
    
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'w') as f:
        json.dump(final_output, f, indent=2)

if __name__ == "__main__":
    csv_file = "../../Cleaned_Travel_Dataset.csv"
    output_file = "../app/data/locations.json"
    extract_locations_by_city(csv_file, output_file)
    print(f"Successfully extracted locations to {output_file}")
