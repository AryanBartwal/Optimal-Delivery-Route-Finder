from typing import List, Dict, Any, Tuple
import math
import requests
import random
import datetime
import os
import polyline
from .locations import DEHRADUN_LOCATIONS, get_location_by_name

OPENROUTESERVICE_API_KEY = os.environ.get("ORS_API_KEY", "5b3ce3597851110001cf6248216b7bd858544b6e9011fc6c183d49b7")

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two points using Haversine formula."""
    R = 6371  # Earth's radius in kilometers

    lat1_rad = math.radians(lat1)
    lon1_rad = math.radians(lon1)
    lat2_rad = math.radians(lat2)
    lon2_rad = math.radians(lon2)

    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad

    a = math.sin(dlat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    distance = R * c

    return distance

def get_osrm_route(start_lng: float, start_lat: float, end_lng: float, end_lat: float, profile: str = "driving") -> Dict[str, Any]:
    """Get route from OSRM service with additional error handling and logging."""
    # Use the OSRM demo server - for production, you should host your own OSRM instance
    base_url = "https://router.project-osrm.org"
    
    # Format coordinates with proper precision and no spaces
    coord_str = f"{start_lng:.6f},{start_lat:.6f};{end_lng:.6f},{end_lat:.6f}"
    url = f"{base_url}/route/v1/{profile}/{coord_str}"
    
    # Use simpler params first
    params = {
        "overview": "full",
        "geometries": "geojson"
    }
    
    try:
        print(f"Making OSRM request to: {url} with params: {params}")
        response = requests.get(url, params=params)
        
        if response.status_code != 200:
            print(f"OSRM request failed with status {response.status_code}: {response.text}")
            return None
            
        data = response.json()
        
        # Check if we got valid routes
        if data.get("code") == "Ok" and "routes" in data and data["routes"]:
            print(f"OSRM request successful, got {len(data['routes'])} routes")
            
            # Try to get alternatives if the basic query works
            if len(data["routes"]) < 2:
                # Try again with alternatives
                alt_params = params.copy()
                alt_params["alternatives"] = "true"
                
                try:
                    alt_response = requests.get(url, params=alt_params)
                    if alt_response.status_code == 200:
                        alt_data = alt_response.json()
                        if alt_data.get("code") == "Ok" and "routes" in alt_data and len(alt_data["routes"]) > len(data["routes"]):
                            print(f"Got {len(alt_data['routes'])} alternative routes")
                            data = alt_data
                except Exception as e:
                    print(f"Alternative routes request failed: {e}")
            
            return data
        else:
            print(f"OSRM request returned no routes: {url}")
            return None
            
    except requests.exceptions.RequestException as e:
        print(f"OSRM request failed: {e}")
        # If OSRM service fails, return None to fall back to alternative routing
        return None

def get_osrm_alternatives(start_lng: float, start_lat: float, end_lng: float, end_lat: float, profile: str = "driving") -> List[Dict[str, Any]]:
    """Try multiple approaches to get route options from OSRM with real roads."""
    results = []
    
    # Try multiple profile types to get diverse routes
    profiles_to_try = [profile]
    
    # Add additional profiles based on the primary profile
    if profile == "driving":
        profiles_to_try.extend(["car"])
    elif profile == "cycling":
        profiles_to_try.extend(["bike"])
    elif profile == "walking":
        profiles_to_try.extend(["foot"])
    
    # Try to get routes with the primary profile first
    standard_result = get_osrm_route(start_lng, start_lat, end_lng, end_lat, profiles_to_try[0])
    if standard_result and "routes" in standard_result and standard_result["routes"]:
        results.extend(standard_result["routes"])
    
    # If we don't have enough routes, try alternative approaches
    if len(results) < 2 and len(profiles_to_try) > 1:
        # Try with alternate profile
        alt_result = get_osrm_route(start_lng, start_lat, end_lng, end_lat, profiles_to_try[1])
        if alt_result and "routes" in alt_result and alt_result["routes"]:
            # Only add routes that are different
            for route in alt_result["routes"]:
                if not any(is_similar_route(route, existing) for existing in results):
                    results.append(route)
    
    # Try using waypoints to force different routes
    if len(results) < 2:
        # Calculate midpoint with slight offset
        mid_lat = (start_lat + end_lat) / 2
        mid_lng = (start_lng + end_lng) / 2
        
        # Add slight offset
        offset = 0.005  # ~500m
        mid_lat += offset
        mid_lng += offset
        
        # Format waypoint coordinates
        waypoint_coords = f"{start_lng:.6f},{start_lat:.6f};{mid_lng:.6f},{mid_lat:.6f};{end_lng:.6f},{end_lat:.6f}"
        waypoint_url = f"https://router.project-osrm.org/route/v1/{profiles_to_try[0]}/{waypoint_coords}"
        
        try:
            print(f"Trying waypoint route: {waypoint_url}")
            params = {"overview": "full", "geometries": "geojson"}
            response = requests.get(waypoint_url, params=params)
            
            if response.status_code == 200:
                waypoint_result = response.json()
                if waypoint_result.get("code") == "Ok" and "routes" in waypoint_result and waypoint_result["routes"]:
                    # Only add if this route is genuinely different
                    new_route = waypoint_result["routes"][0]
                    if not any(is_similar_route(new_route, existing_route) for existing_route in results):
                        results.append(new_route)
        except Exception as e:
            print(f"OSRM waypoint request failed: {e}")
    
    # Return all unique routes found
    return results

def is_similar_route(route1: Dict[str, Any], route2: Dict[str, Any], threshold: float = 0.8) -> bool:
    """Check if two routes are significantly similar based on their geometries."""
    if "geometry" not in route1 or "geometry" not in route2:
        return False
    
    coords1 = route1["geometry"]["coordinates"]
    coords2 = route2["geometry"]["coordinates"]
    
    # If routes are very different in length, they're different routes
    if len(coords1) == 0 or len(coords2) == 0:
        return False
    
    if abs(len(coords1) - len(coords2)) / max(len(coords1), len(coords2)) > 0.5:
        return False
        
    # Sample some points to compare
    num_samples = min(10, min(len(coords1), len(coords2)))
    step1 = max(1, len(coords1) // num_samples)
    step2 = max(1, len(coords2) // num_samples)
    
    # Check distance between sample points
    similar_points = 0
    for i in range(0, num_samples):
        idx1 = min(i * step1, len(coords1) - 1)
        idx2 = min(i * step2, len(coords2) - 1)
        
        # Calculate distance between corresponding points
        point1 = coords1[idx1]
        point2 = coords2[idx2]
        
        # Haversine distance between points
        dist = calculate_distance(point1[1], point1[0], point2[1], point2[0])
        
        # If points are within 200m, consider them similar
        if dist < 0.2:
            similar_points += 1
    
    similarity = similar_points / num_samples
    return similarity > threshold

def decode_polyline(route_geometry):
    """Extract coordinates from GeoJSON geometry."""
    if not route_geometry or "coordinates" not in route_geometry:
        return []
    
    # GeoJSON coordinates are in [lng, lat] format, we need [lat, lng] for leaflet
    return [[coord[1], coord[0]] for coord in route_geometry["coordinates"]]

def get_seasonal_weather() -> Dict[str, Any]:
    """Get realistic weather condition based on current season in Dehradun."""
    # Get current date
    now = datetime.datetime.now()
    month = now.month
    
    # Determine season in Dehradun
    # Winter: November to February
    # Summer: March to June 
    # Monsoon: July to October
    if 11 <= month <= 12 or 1 <= month <= 2:
        season = "winter"
    elif 3 <= month <= 6:
        season = "summer"
    else:
        season = "monsoon"
    
    # Define seasonal weather probabilities
    weather_options = {
        "winter": [
            {"condition": "sunny", "temperature": random.randint(15, 22), "precipitation": 0, "weight": 40},
            {"condition": "cloudy", "temperature": random.randint(10, 18), "precipitation": 10, "weight": 35},
            {"condition": "foggy", "temperature": random.randint(5, 12), "precipitation": 0, "weight": 25}
        ],
        "summer": [
            {"condition": "sunny", "temperature": random.randint(28, 38), "precipitation": 0, "weight": 70},
            {"condition": "cloudy", "temperature": random.randint(25, 32), "precipitation": 10, "weight": 25},
            {"condition": "rainy", "temperature": random.randint(23, 30), "precipitation": random.randint(20, 40), "weight": 5}
        ],
        "monsoon": [
            {"condition": "rainy", "temperature": random.randint(24, 30), "precipitation": random.randint(40, 90), "weight": 60},
            {"condition": "cloudy", "temperature": random.randint(22, 28), "precipitation": 20, "weight": 30},
            {"condition": "sunny", "temperature": random.randint(26, 32), "precipitation": 0, "weight": 10}
        ]
    }
    
    # Select weather based on weighted probability
    season_options = weather_options[season]
    weights = [option["weight"] for option in season_options]
    total_weight = sum(weights)
    
    # Normalize weights to probabilities
    probabilities = [w/total_weight for w in weights]
    
    # Select weather using weighted random choice
    selected_weather = random.choices(season_options, weights=probabilities, k=1)[0]
    
    # Remove weight from result
    selected_weather.pop("weight", None)
    
    return selected_weather

def get_traffic_condition(start_traffic_zone: str, end_traffic_zone: str) -> str:
    """Determine traffic condition based on zones, time of day, and random factors."""
    # Get current time
    now = datetime.datetime.now()
    hour = now.hour
    
    # Rush hour periods (8-10 AM and 5-7 PM typically have higher traffic)
    is_rush_hour = (8 <= hour <= 10) or (17 <= hour <= 19)
    is_weekend = now.weekday() >= 5  # Saturday or Sunday
    
    # Base traffic probabilities determined by zones
    if start_traffic_zone == "high" or end_traffic_zone == "high":
        base_probs = {"light": 10, "moderate": 30, "heavy": 60}
    elif start_traffic_zone == "medium" or end_traffic_zone == "medium":
        base_probs = {"light": 30, "moderate": 50, "heavy": 20}
    else:
        base_probs = {"light": 60, "moderate": 30, "heavy": 10}
    
    # Adjust for time factors
    if is_rush_hour and not is_weekend:
        # Increase heavy traffic during weekday rush hours
        base_probs["heavy"] += 30
        base_probs["moderate"] += 10
        base_probs["light"] -= 40
    elif is_weekend:
        # Less traffic on weekends, especially in commercial areas
        base_probs["heavy"] -= 20
        base_probs["light"] += 20
    
    # Ensure probabilities are non-negative
    for key in base_probs:
        base_probs[key] = max(0, base_probs[key])
    
    # Normalize to sum to 100
    total = sum(base_probs.values())
    normalized_probs = {k: v/total*100 for k, v in base_probs.items()}
    
    # Select traffic condition based on probabilities
    r = random.randint(1, 100)
    cumulative = 0
    for cond, prob in normalized_probs.items():
        cumulative += prob
        if r <= cumulative:
            return cond
    
    # Fallback
    return "moderate"

def generate_realistic_road_path(start_lat: float, start_lng: float, end_lat: float, end_lng: float, num_points: int = 20) -> List[List[float]]:
    """Generate a more realistic path that simulates road-like navigation with curves and turns."""
    # Create base path
    path = []
    
    # Start with a straight segment (1/4 of the journey)
    quarter_points = max(2, num_points // 4)
    for i in range(quarter_points):
        factor = i / quarter_points
        lat = start_lat + (end_lat - start_lat) * factor * 0.25
        lng = start_lng + (end_lng - start_lng) * factor * 0.25
        path.append([lat, lng])
    
    # Add a "road network" segment in the middle with perpendicular movements
    # This creates a more grid-like pattern that looks like actual roads
    current_lat = path[-1][0]
    current_lng = path[-1][1]
    
    # Move mostly in one direction first (east-west)
    target_lng = start_lng + (end_lng - start_lng) * 0.75
    lng_step = (target_lng - current_lng) / (num_points // 4)
    for i in range(num_points // 4):
        # Add some small randomness to lat (north-south) to make it look like real roads
        lat_jitter = random.uniform(-0.0005, 0.0005)
        current_lat += lat_jitter
        current_lng += lng_step
        path.append([current_lat, current_lng])
    
    # Now move mostly in the other direction (north-south)
    target_lat = start_lat + (end_lat - start_lat) * 0.75
    lat_step = (target_lat - current_lat) / (num_points // 4)
    for i in range(num_points // 4):
        # Add some small randomness to lng (east-west)
        lng_jitter = random.uniform(-0.0005, 0.0005)
        current_lat += lat_step
        current_lng += lng_jitter
        path.append([current_lat, current_lng])
    
    # Final straight segment to destination
    last_lat = path[-1][0]
    last_lng = path[-1][1]
    remaining_points = num_points - len(path)
    for i in range(remaining_points):
        factor = i / remaining_points
        lat = last_lat + (end_lat - last_lat) * factor
        lng = last_lng + (end_lng - last_lng) * factor
        path.append([lat, lng])
    
    # Ensure last point is exactly the destination
    path.append([end_lat, end_lng])
    
    return path

def get_ors_alternatives(start_lat, start_lng, end_lat, end_lng, profile="driving-car", alternatives=3):
    """Get alternative routes from OpenRouteService API."""
    url = f"https://api.openrouteservice.org/v2/directions/{profile}/geojson"
    headers = {"Authorization": OPENROUTESERVICE_API_KEY, "Content-Type": "application/json"}
    body = {
        "coordinates": [
            [start_lng, start_lat],
            [end_lng, end_lat]
        ],
        "alternative_routes": {
            "share_factor": 0.6,
            "target_count": alternatives,
            "weight_factor": 1.6
        },
        "instructions": True
    }
    try:
        resp = requests.post(url, json=body, headers=headers, timeout=15)
        if resp.status_code == 200:
            data = resp.json()
            # Each feature is a route
            features = data.get("features", [])
            routes = []
            for i, feat in enumerate(features):
                props = feat.get("properties", {})
                geometry = feat.get("geometry", {})
                routes.append({
                    "geometry": geometry,
                    "distance": props.get("summary", {}).get("distance", 0),
                    "duration": props.get("summary", {}).get("duration", 0),
                    "segments": props.get("segments", []),
                    "option_name": f"Route {i+1}: {'Fast (Shortest)' if i==0 else 'Alternate'}"
                })
            return routes
        else:
            print(f"ORS error: {resp.status_code} {resp.text}")
            return []
    except Exception as e:
        print(f"ORS request failed: {e}")
        return []

def get_route(start_location: str, end_location: str, vehicle_type: str, user_weather: str = None) -> Dict[str, Any]:
    """Calculate multiple route options between two locations using OSRM for real road-based routes.
    
    Args:
        start_location: Starting location name
        end_location: Destination location name
        vehicle_type: Type of vehicle (car, bike, walk)
        user_weather: Optional user-specified weather condition
    """
    start = get_location_by_name(start_location)
    end = get_location_by_name(end_location)
    
    if not start or not end:
        raise ValueError("Invalid location names")

    profile_map = {
        "car": "driving-car",
        "bike": "cycling-regular",
        "walk": "foot-walking"
    }
    
    profile = profile_map.get(vehicle_type, "driving-car")
    
    weather = get_seasonal_weather() if not user_weather else {"condition": user_weather}
    traffic = get_traffic_condition(start["traffic_zone"], end["traffic_zone"])
    
    # Use ORS for real alternatives
    ors_routes = get_ors_alternatives(start["lat"], start["lng"], end["lat"], end["lng"], profile, alternatives=3)
    
    route_options = []
    
    if ors_routes:
        for i, route in enumerate(ors_routes):
            path = decode_polyline(route["geometry"])
            distance = route["distance"] / 1000
            duration = route["duration"] / 60
            steps = []
            # Parse turn-by-turn steps if available
            if route.get("segments"):
                for seg in route["segments"]:
                    for step in seg.get("steps", []):
                        steps.append({
                            "instruction": step.get("instruction", ""),
                            "distance": step.get("distance", 0),
                            "duration": step.get("duration", 0)
                        })
            route_options.append({
                "option_name": route["option_name"],
                "description": "Shortest distance" if i==0 else f"Alternate route #{i+1}",
                "distance": round(distance, 2),
                "duration": round(duration, 2),
                "original_duration": round(duration, 2),
                "path": path,
                "steps": steps,
                "traffic": random.choice(["light", "moderate", "heavy"])
            })
    
    # Fallback to old logic if ORS fails
    if not route_options:
        # Create a direct route as a fallback
        fallback_path = [[start["lat"], start["lng"]], [end["lat"], end["lng"]]]
        # Calculate direct distance
        direct_distance = calculate_distance(start["lat"], start["lng"], end["lat"], end["lng"])
        # Approximate the distance (straight-line distance with a realistic factor)
        fallback_distance = direct_distance * 1.3  # Typical road path is 30% longer than direct
        
        # Use simplified speed estimate based on vehicle type
        speed_map = {"car": 35, "bike": 15, "walk": 5}
        avg_speed = speed_map.get(vehicle_type, 30)  # km/hr
        
        # Calculate duration in minutes
        fallback_duration = (fallback_distance / avg_speed) * 60
        
        # Apply weather and traffic adjustments
        adjusted_duration = fallback_duration
        if weather["condition"] == "rainy":
            adjusted_duration *= 1.2
        elif weather["condition"] == "snowy":
            adjusted_duration *= 1.5
        elif weather["condition"] == "foggy":
            adjusted_duration *= 1.3
        
        if traffic == "moderate":
            adjusted_duration *= 1.3
        elif traffic == "heavy":
            adjusted_duration *= 1.6
        
        # Add a simple fallback route (with a note that it's approximate)
        route_options.append({
            "option_name": "Route 1: Direct Path",
            "description": "Approximate direct path (OSRM routing failed)",
            "distance": round(fallback_distance, 2),
            "duration": round(adjusted_duration, 2),
            "original_duration": round(fallback_duration, 2),
            "path": fallback_path,
            "steps": [{"instruction": "direct", "distance": fallback_distance * 1000, "duration": fallback_duration * 60}]
        })
        
        # Add a message to console about the fallback
        print(f"WARNING: Using fallback direct path for {start_location} to {end_location} as OSRM failed")
    
    # Ensure we don't have more than 3 route options to keep UI clean
    if len(route_options) > 3:
        route_options = route_options[:3]
    
    return {
        "start": start,
        "end": end,
        "vehicle_type": vehicle_type,
        "weather": weather,
        "traffic": traffic,
        "route_options": route_options
    }

def generate_alternate_road_path(start_lat: float, start_lng: float, end_lat: float, end_lng: float, detour_factor: float = 0.15) -> List[List[float]]:
    """Generate a path that takes a detour from the direct route, simulating an alternate road path.
    
    Args:
        start_lat, start_lng: Starting coordinates
        end_lat, end_lng: Ending coordinates
        detour_factor: How much the path should detour from the direct route (0.1 = 10% detour)
    
    Returns:
        List of [lat, lng] coordinates for the path
    """
    # Direct vector from start to end
    direct_vector = [end_lat - start_lat, end_lng - start_lng]
    
    # Calculate vector perpendicular to the direct vector
    perpendicular_vector = [-direct_vector[1], direct_vector[0]]
    
    # Normalize perpendicular vector
    magnitude = math.sqrt(perpendicular_vector[0]**2 + perpendicular_vector[1]**2)
    if magnitude > 0:
        perpendicular_vector = [perpendicular_vector[0]/magnitude, perpendicular_vector[1]/magnitude]
    
    # Calculate a detour point that's off to one side
    # The detour point is at a distance proportional to the direct distance
    direct_distance = math.sqrt(direct_vector[0]**2 + direct_vector[1]**2)
    detour_distance = direct_distance * detour_factor
    
    # Calculate detour point (midway along direct path but offset perpendicular)
    detour_point = [
        start_lat + direct_vector[0]/2 + perpendicular_vector[0] * detour_distance,
        start_lng + direct_vector[1]/2 + perpendicular_vector[1] * detour_distance
    ]
    
    # Create path with a sequence of segments
    path = []
    
    # Segment 1: Start -> First quarter (slight deviation)
    quarter_point = [
        start_lat + direct_vector[0] * 0.25 + perpendicular_vector[0] * detour_distance * 0.3,
        start_lng + direct_vector[1] * 0.25 + perpendicular_vector[1] * detour_distance * 0.3
    ]
    
    # Add points for the first segment with road-like grid patterns
    num_points = 5
    for i in range(num_points):
        factor = i / num_points
        lat = start_lat + (quarter_point[0] - start_lat) * factor
        lng = start_lng + (quarter_point[1] - start_lng) * factor
        # Add slight jitters for realism
        lat += random.uniform(-0.0001, 0.0001)
        lng += random.uniform(-0.0001, 0.0001)
        path.append([lat, lng])
    
    # Segment 2: First quarter -> Detour point
    num_points = 10
    for i in range(num_points):
        factor = i / num_points
        lat = quarter_point[0] + (detour_point[0] - quarter_point[0]) * factor
        lng = quarter_point[1] + (detour_point[1] - quarter_point[1]) * factor
        # Add slight jitters for realism
        lat += random.uniform(-0.0001, 0.0001)
        lng += random.uniform(-0.0001, 0.0001)
        path.append([lat, lng])
    
    # Segment 3: Detour point -> End with grid-like pattern
    # Calculate a point 3/4 of the way from detour to end
    three_quarter_point = [
        detour_point[0] + (end_lat - detour_point[0]) * 0.75,
        detour_point[1] + (end_lng - detour_point[1]) * 0.75
    ]
    
    # Do this segment with perpendicular movements to simulate a grid
    current_lat = detour_point[0]
    current_lng = detour_point[1]
    
    # First move mostly east-west
    lng_distance = three_quarter_point[1] - current_lng
    num_steps = 6
    lng_step = lng_distance / num_steps
    for i in range(num_steps):
        current_lng += lng_step
        # Add small random variations in latitude
        current_lat += random.uniform(-0.0003, 0.0003)
        path.append([current_lat, current_lng])
    
    # Then move mostly north-south
    lat_distance = three_quarter_point[0] - current_lat
    num_steps = 6
    lat_step = lat_distance / num_steps
    for i in range(num_steps):
        current_lat += lat_step
        # Add small random variations in longitude
        current_lng += random.uniform(-0.0003, 0.0003)
        path.append([current_lat, current_lng])
    
    # Final segment: Three-quarter point -> End
    num_points = 5
    for i in range(num_points):
        factor = i / num_points
        lat = three_quarter_point[0] + (end_lat - three_quarter_point[0]) * factor
        lng = three_quarter_point[1] + (end_lng - three_quarter_point[1]) * factor
        path.append([lat, lng])
    
    # Ensure end point is exact
    path.append([end_lat, end_lng])
    
    return path

def generate_basic_directions(path: List[List[float]]) -> List[Dict[str, Any]]:
    """Generate basic turn-by-turn directions from a path.
    
    Args:
        path: List of [lat, lng] coordinates
    
    Returns:
        List of direction steps
    """
    if len(path) < 3:
        return []
    
    steps = []
    total_distance = 0
    
    # Calculate initial bearing
    prev_bearing = calculate_bearing(path[0][0], path[0][1], path[1][0], path[1][1])
    
    # Start with a "depart" step
    steps.append({
        "instruction": "depart",
        "distance": 0,  # Will be updated
        "duration": 0   # Will be updated
    })
    
    segment_start_idx = 0
    
    # Process all points to detect turns
    for i in range(1, len(path) - 1):
        # Calculate current bearing
        current_bearing = calculate_bearing(path[i][0], path[i][1], path[i+1][0], path[i+1][1])
        
        # Calculate the angle difference to detect turns
        angle_diff = (current_bearing - prev_bearing + 180) % 360 - 180
        
        # Determine if this is a significant turn
        if abs(angle_diff) > 30:  # More than 30 degrees change is a turn
            # Calculate distance of the segment we just completed
            segment_distance = 0
            for j in range(segment_start_idx, i):
                segment_distance += calculate_distance(path[j][0], path[j][1], path[j+1][0], path[j+1][1])
            
            # Update the previous step's distance
            if steps:
                steps[-1]["distance"] = segment_distance * 1000  # Convert to meters
                # Estimate duration: assume 30 km/h average (8.33 m/s)
                steps[-1]["duration"] = (segment_distance * 1000) / 8.33
            
            total_distance += segment_distance
            
            # Determine turn direction
            turn_type = "straight"
            if angle_diff > 30 and angle_diff < 150:
                turn_type = "right"
            elif angle_diff < -30 and angle_diff > -150:
                turn_type = "left"
            elif abs(angle_diff) >= 150:
                turn_type = "uturn"
            
            # Add the turn and next segment
            steps.append({
                "instruction": turn_type,
                "distance": 0,  # Will be updated with the next segment
                "duration": 0    # Will be updated with the next segment
            })
            
            segment_start_idx = i
        
        prev_bearing = current_bearing
    
    # Calculate distance for the last segment
    last_segment_distance = 0
    for j in range(segment_start_idx, len(path) - 1):
        last_segment_distance += calculate_distance(path[j][0], path[j][1], path[j+1][0], path[j+1][1])
    
    # Update the last step's distance
    if steps:
        steps[-1]["distance"] = last_segment_distance * 1000  # Convert to meters
        # Estimate duration: assume 30 km/h average (8.33 m/s)
        steps[-1]["duration"] = (last_segment_distance * 1000) / 8.33
    
    total_distance += last_segment_distance
    
    # Add an "arrive" step
    steps.append({
        "instruction": "arrive",
        "distance": 0,
        "duration": 0
    })
    
    return steps

def calculate_bearing(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the bearing (heading) from point 1 to point 2."""
    # Convert to radians
    lat1_rad = math.radians(lat1)
    lon1_rad = math.radians(lon1)
    lat2_rad = math.radians(lat2)
    lon2_rad = math.radians(lon2)
    
    # Calculate the bearing
    y = math.sin(lon2_rad - lon1_rad) * math.cos(lat2_rad)
    x = math.cos(lat1_rad) * math.sin(lat2_rad) - \
        math.sin(lat1_rad) * math.cos(lat2_rad) * math.cos(lon2_rad - lon1_rad)
    
    bearing = math.atan2(y, x)
    
    # Convert to degrees
    bearing_deg = math.degrees(bearing)
    
    # Normalize to 0-360
    bearing_deg = (bearing_deg + 360) % 360
    
    return bearing_deg

def optimize_multi_stop_route(locations: list, vehicle_type: str = "car") -> dict:
    """
    Use OpenRouteService optimization endpoint to solve the TSP for delivery stops.
    locations: list of dicts with 'lat' and 'lng' keys
    vehicle_type: 'car', 'bike', or 'walk'
    Returns dict with optimized order, route geometry, and total distance/duration.
    """
    profile_map = {
        "car": "driving-car",
        "bike": "cycling-regular",
        "walk": "foot-walking"
    }
    profile = profile_map.get(vehicle_type, "driving-car")
    url = "https://api.openrouteservice.org/optimization"
    headers = {"Authorization": OPENROUTESERVICE_API_KEY, "Content-Type": "application/json"}

    # Build jobs (stops) and single vehicle
    jobs = []
    for idx, loc in enumerate(locations):
        jobs.append({
            "id": idx + 1,
            "service": 300,  # seconds spent at each stop (arbitrary)
            "location": [loc["lng"], loc["lat"]]
        })
    vehicle = {
        "id": 1,
        "profile": profile,
        "start": [locations[0]["lng"], locations[0]["lat"]],
        "end": [locations[0]["lng"], locations[0]["lat"]],  # round trip
    }
    body = {
        "jobs": jobs,
        "vehicles": [vehicle]
    }
    try:
        resp = requests.post(url, json=body, headers=headers, timeout=20)
        if resp.status_code != 200:
            print(f"ORS optimization error: {resp.status_code} {resp.text}")
            return {"error": resp.text}
        data = resp.json()
        # Parse the optimized order
        if not data.get("routes") or not data.get("jobs"):
            print(f"ORS optimization missing routes/jobs: {data}")
            return {"error": "ORS optimization did not return routes/jobs"}
        route = data["routes"][0]
        steps = route["steps"]
        # Map job ids to locations
        id_to_loc = {j["id"]: j["location"] for j in data["jobs"]}
        ordered_coords = [id_to_loc[step["job"]] for step in steps if "job" in step]
        # Add start/end if not present
        if ordered_coords[0] != vehicle["start"]:
            ordered_coords = [vehicle["start"]] + ordered_coords
        if ordered_coords[-1] != vehicle["end"]:
            ordered_coords = ordered_coords + [vehicle["end"]]
        # ORS directions expects [lng, lat] pairs
        coords_str = "|".join([f"{lng},{lat}" for lng, lat in ordered_coords])
        directions_url = f"https://api.openrouteservice.org/v2/directions/{profile}"
        directions_headers = {"Authorization": OPENROUTESERVICE_API_KEY}
        directions_body = {
            "coordinates": ordered_coords
        }
        dir_resp = requests.post(directions_url, json=directions_body, headers=directions_headers, timeout=20)
        if dir_resp.status_code != 200:
            print(f"ORS directions error: {dir_resp.status_code} {dir_resp.text}")
            return {"error": dir_resp.text}
        dir_data = dir_resp.json()
        # ORS returns geometry as encoded polyline string, decode to coordinates
        geometry = dir_data["routes"][0]["geometry"]
        coordinates = polyline.decode(geometry)
        # Return geometry and summary in the expected format
        return {
            "routes": [
                {
                    "geometry": {"coordinates": [[lat, lng] for lat, lng in coordinates]},
                    "summary": dir_data["routes"][0]["summary"]
                }
            ],
            "ordered_stops": [
                {"lat": lat, "lng": lng} for lng, lat in ordered_coords
            ]
        }
    except Exception as e:
        import traceback
        print(f"ORS optimization request failed: {e}")
        traceback.print_exc()
        return {"error": str(e)}

# --- DAA Graph Algorithms: Dijkstra and Floyd-Warshall ---

def build_landmark_graph(locations=None, max_edge_km=2.5):
    """
    Build an adjacency list graph from Dehradun landmarks.
    Edges are created between landmarks within max_edge_km (default 2.5km).
    Returns: dict {name: [(neighbor_name, distance_km), ...]}
    """
    if locations is None:
        from .locations import DEHRADUN_LOCATIONS
        locations = DEHRADUN_LOCATIONS
    graph = {}
    for loc in locations:
        graph[loc['name']] = []
        for other in locations:
            if loc['name'] == other['name']:
                continue
            dist = calculate_distance(loc['lat'], loc['lng'], other['lat'], other['lng'])
            if dist <= max_edge_km:
                graph[loc['name']].append((other['name'], dist))
    return graph


def dijkstra(graph, start, end):
    """
    Dijkstra's algorithm for shortest path in a weighted graph.
    Returns (distance, path) from start to end.
    """
    import heapq
    queue = [(0, start, [start])]
    visited = set()
    while queue:
        (cost, node, path) = heapq.heappop(queue)
        if node == end:
            return cost, path
        if node in visited:
            continue
        visited.add(node)
        for neighbor, weight in graph.get(node, []):
            if neighbor not in visited:
                heapq.heappush(queue, (cost + weight, neighbor, path + [neighbor]))
    return float('inf'), []


def floyd_warshall(graph):
    """
    Floyd-Warshall algorithm for all-pairs shortest paths.
    Returns: dist, next_hop dicts for path reconstruction.
    """
    nodes = list(graph.keys())
    dist = {u: {v: float('inf') for v in nodes} for u in nodes}
    next_hop = {u: {v: None for v in nodes} for u in nodes}
    for u in nodes:
        dist[u][u] = 0
        for v, w in graph[u]:
            dist[u][v] = w
            next_hop[u][v] = v
    for k in nodes:
        for i in nodes:
            for j in nodes:
                if dist[i][j] > dist[i][k] + dist[k][j]:
                    dist[i][j] = dist[i][k] + dist[k][j]
                    next_hop[i][j] = next_hop[i][k]
    return dist, next_hop


def reconstruct_fw_path(next_hop, start, end):
    """
    Reconstruct path from Floyd-Warshall next_hop table.
    """
    if next_hop[start][end] is None:
        return []
    path = [start]
    while start != end:
        start = next_hop[start][end]
        path.append(start)
    return path


def get_landmark_coords(name, locations=None):
    if locations is None:
        from .locations import DEHRADUN_LOCATIONS
        locations = DEHRADUN_LOCATIONS
    for loc in locations:
        if loc['name'] == name:
            return loc['lat'], loc['lng']
    return None, None


def route_with_dijkstra(start_name, end_name, locations=None):
    """
    Find shortest path between two landmarks using Dijkstra's algorithm.
    Returns: path (list of [lat, lng]), total distance (km)
    """
    graph = build_landmark_graph(locations)
    dist, path_names = dijkstra(graph, start_name, end_name)
    path_coords = [get_landmark_coords(n, locations) for n in path_names]
    return path_coords, dist


def route_with_floyd_warshall(start_name, end_name, fw_cache=None, locations=None):
    """
    Find shortest path using Floyd-Warshall (optionally with precomputed cache).
    Returns: path (list of [lat, lng]), total distance (km)
    """
    if fw_cache is None:
        # Increase max_edge_km to 7.5 for a much more connected graph
        graph = build_landmark_graph(locations, max_edge_km=7.5)
        dist, next_hop = floyd_warshall(graph)
    else:
        dist, next_hop = fw_cache
    path_names = reconstruct_fw_path(next_hop, start_name, end_name)
    path_coords = [get_landmark_coords(n, locations) for n in path_names]
    return path_coords, dist[start_name][end_name]

# --- End DAA Graph Algorithms ---