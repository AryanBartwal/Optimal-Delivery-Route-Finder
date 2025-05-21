from fastapi import FastAPI, Depends, HTTPException, status, Form, Body
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import timedelta, datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

from .database import engine, get_db
from .models import Base, User, RouteHistory
from .auth import (
    verify_password,
    get_password_hash,
    create_access_token,
    get_current_user,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)
from .locations import get_all_locations, get_location_by_name
from .route_service import get_route, optimize_multi_stop_route, route_with_floyd_warshall, get_osrm_route, decode_polyline
from .user_route_history import add_route_to_history, get_user_history

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Dehradun Route Finder")

# Configure CORS with more permissive settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://alok-nawani.github.io"],  # GitHub Pages origin
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],  # List specific methods
    allow_headers=["Content-Type", "Authorization", "Accept", "Origin", "X-Requested-With"],
    expose_headers=["Content-Type", "Authorization"],
    max_age=600,  # Cache preflight requests for 10 minutes
)

class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class Token(BaseModel):
    username: str
    password: str

class RouteCreate(BaseModel):
    start_location: str
    end_location: str
    vehicle_type: str
    route_option: Optional[str] = None  # Optional parameter for selected route option
    user_weather: Optional[str] = None  # Optional parameter for user-specified weather

class OptimizeRouteRequest(BaseModel):
    stops: list  # List of {lat, lng} dicts
    vehicle_type: str = "car"

@app.post("/register")
async def register_user(user: UserCreate, db: Session = Depends(get_db)):
    # Check if username exists
    if db.query(User).filter(User.username == user.username).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # Check if email exists
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user.password)
    db_user = User(username=user.username, email=user.email, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return {"message": "User created successfully"}

@app.post("/token")
async def login(form_data: Token):
    db = next(get_db())
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/locations")
def get_locations() -> List[Dict[str, Any]]:
    return get_all_locations()

@app.post("/routes")
async def create_route(
    route: RouteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        # Calculate route using route service, pass user weather if specified
        result = get_route(
            route.start_location,
            route.end_location,
            route.vehicle_type,
            route.user_weather
        )
        
        # Select the chosen route option or default to the first one
        selected_option = route.route_option if route.route_option else "Route 1: Fast (Shortest)"
        
        # Find the selected route option
        selected_route = next(
            (r for r in result["route_options"] if r["option_name"] == selected_option), 
            result["route_options"][0]
        )
        
        # Save route to history in the database
        db_route = RouteHistory(
            user_id=current_user.id,
            start_location=route.start_location,
            end_location=route.end_location,
            vehicle_type=route.vehicle_type,
            distance=selected_route["distance"],
            duration=selected_route["duration"],
            weather_condition=result["weather"]["condition"],
            traffic_condition=result["traffic"],
            route_option=selected_route["option_name"]
        )
        
        db.add(db_route)
        db.commit()
        db.refresh(db_route)
        
        # Store in permanent user file
        add_route_to_history(current_user.username, {
            "start_location": route.start_location,
            "end_location": route.end_location,
            "vehicle_type": route.vehicle_type,
            "route_option": route.route_option,
            "weather_condition": result.get("weather", {}).get("condition"),
            "traffic_condition": result.get("traffic"),
            "distance": result.get("distance"),
            "duration": result.get("duration"),
            "created_at": datetime.utcnow().isoformat()
        })
        
        return result
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to calculate route"
        )

@app.get("/routes/history")
def get_route_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    routes = db.query(RouteHistory).filter(RouteHistory.user_id == current_user.id).all()
    return [
        {
            "id": route.id,
            "start_location": route.start_location,
            "end_location": route.end_location,
            "vehicle_type": route.vehicle_type,
            "created_at": route.created_at,
            "distance": route.distance,
            "duration": route.duration,
            "weather_condition": route.weather_condition,
            "traffic_condition": route.traffic_condition,
            "route_option": route.route_option
        }
        for route in routes
    ]

@app.get("/user/history")
def get_history(current_user: User = Depends(get_current_user)):
    return get_user_history(current_user.username)

@app.post("/optimize-route")
def optimize_route(request: OptimizeRouteRequest, current_user: User = Depends(get_current_user)):
    if not request.stops or len(request.stops) < 2:
        raise HTTPException(status_code=400, detail="At least 2 stops required.")
    result = optimize_multi_stop_route(request.stops, request.vehicle_type)
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
    # Save to user history
    add_route_to_history(current_user.username, {
        "type": "multi-stop-optimized",
        "stops": request.stops,
        "vehicle_type": request.vehicle_type,
        "ordered_stops": result.get("ordered_stops"),
        "distance": result.get("routes", [{}])[0].get("summary", {}).get("distance"),
        "duration": result.get("routes", [{}])[0].get("summary", {}).get("duration"),
        "created_at": datetime.utcnow().isoformat()
    })
    return result

@app.get("/test-floyd-warshall")
def test_floyd_warshall(start: str, end: str):
    """
    Test endpoint to verify Floyd-Warshall algorithm.
    Returns path and distance, and a road-based route for the FW path.
    """
    # Floyd-Warshall
    fw_path, fw_dist = route_with_floyd_warshall(start, end)
    # Build road-based route for FW path (segment by segment)
    road_polyline = []
    for i in range(len(fw_path) - 1):
        lat1, lng1 = fw_path[i]
        lat2, lng2 = fw_path[i+1]
        osrm_result = get_osrm_route(lng1, lat1, lng2, lat2)
        if osrm_result and osrm_result.get("routes"):
            segment = decode_polyline(osrm_result["routes"][0]["geometry"])
            if road_polyline and segment:
                # Avoid duplicate point at join
                road_polyline += segment[1:]
            else:
                road_polyline += segment
    return {
        "start": start,
        "end": end,
        "floyd_warshall": {
            "distance_km": fw_dist,
            "path_coords": fw_path
        },
        "fw_road_polyline": road_polyline
    }

@app.post("/multi-floyd-warshall")
def multi_floyd_warshall(
    start: str = Body(...),
    destinations: List[str] = Body(..., embed=True),
    current_user: User = Depends(get_current_user)
):
    """
    Compute a greedy multi-destination path using Floyd-Warshall between landmarks.
    Returns the visiting order, road-based path coordinates, and total distance.
    """
    from .route_service import route_with_floyd_warshall, get_osrm_route, decode_polyline
    from .locations import get_all_locations
    if not start or not destinations or not isinstance(destinations, list) or len(destinations) < 1:
        return {"error": "Provide a start and at least one destination."}
    # Robustly match stop names to landmark names (case-insensitive, trimmed)
    def match_landmark(name):
        name = name.strip().lower()
        for loc in get_all_locations():
            if loc['name'].strip().lower() == name:
                return loc['name']
        return None
    start_matched = match_landmark(start)
    dests_matched = [match_landmark(d) for d in destinations]
    if not start_matched or any(d is None for d in dests_matched):
        return {"error": "One or more stops do not match any known Dehradun landmark. Please select from the dropdown only."}
    order = [start_matched]
    remaining = dests_matched[:]
    fw_path_names = []
    total_dist = 0.0
    curr = start_matched
    while remaining:
        # Find nearest next destination
        best = None
        best_dist = float('inf')
        best_path = []
        for dest in remaining:
            path, dist = route_with_floyd_warshall(curr, dest)
            if dist < best_dist:
                best = dest
                best_dist = dist
                best_path = path
        if not best_path:
            return {"error": f"No path from {curr} to {best}"}
        if fw_path_names and best_path:
            fw_path_names += best_path[1:]
        else:
            fw_path_names += best_path
        total_dist += best_dist
        order.append(best)
        curr = best
        remaining.remove(best)
    # Build road-based polyline for the full path
    road_polyline = []
    for i in range(len(fw_path_names) - 1):
        lat1, lng1 = fw_path_names[i]
        lat2, lng2 = fw_path_names[i+1]
        osrm_result = get_osrm_route(lng1, lat1, lng2, lat2)
        if osrm_result and osrm_result.get("routes"):
            segment = decode_polyline(osrm_result["routes"][0]["geometry"])
            if road_polyline and segment:
                road_polyline += segment[1:]
            else:
                road_polyline += segment
    # Save to user history
    add_route_to_history(current_user.username, {
        "type": "multi-stop-floyd-warshall",
        "stops": [start] + destinations,
        "order": order,
        "distance": total_dist,
        "path_coords": road_polyline,
        "created_at": datetime.utcnow().isoformat()
    })
    return {
        "order": order,
        "path_coords": road_polyline,
        "total_distance_km": total_dist
    }

@app.post("/multi-direct-route")
def multi_direct_route(
    start: str = Body(...),
    destinations: List[str] = Body(..., embed=True),
    current_user: User = Depends(get_current_user)
):
    """
    Compute a direct multi-destination path (in user-selected order) using OSRM between landmarks.
    Returns the visiting order, road-based path coordinates, and total distance.
    """
    from .route_service import get_osrm_route, decode_polyline
    from .locations import get_all_locations
    if not start or not destinations or not isinstance(destinations, list) or len(destinations) < 1:
        return {"error": "Provide a start and at least one destination."}
    def match_landmark(name):
        name = name.strip().lower()
        for loc in get_all_locations():
            if loc['name'].strip().lower() == name:
                return loc['name']
        return None
    all_stops = [start] + destinations
    matched_stops = [match_landmark(s) for s in all_stops]
    if any(s is None for s in matched_stops):
        return {"error": "One or more stops do not match any known Dehradun landmark. Please select from the dropdown only."}
    order = matched_stops
    road_polyline = []
    total_dist = 0.0
    for i in range(len(order) - 1):
        from_name = order[i]
        to_name = order[i+1]
        from_loc = next(l for l in get_all_locations() if l['name'] == from_name)
        to_loc = next(l for l in get_all_locations() if l['name'] == to_name)
        osrm_result = get_osrm_route(from_loc['lng'], from_loc['lat'], to_loc['lng'], to_loc['lat'])
        if osrm_result and osrm_result.get("routes"):
            segment = decode_polyline(osrm_result["routes"][0]["geometry"])
            if road_polyline and segment:
                road_polyline += segment[1:]
            else:
                road_polyline += segment
            total_dist += osrm_result["routes"][0]["distance"] / 1000.0
        else:
            return {"error": f"No route from {from_name} to {to_name}"}
    # Save to user history
    add_route_to_history(current_user.username, {
        "type": "multi-stop-direct",
        "stops": all_stops,
        "order": order,
        "distance": total_dist,
        "path_coords": road_polyline,
        "created_at": datetime.utcnow().isoformat()
    })
    return {
        "order": order,
        "path_coords": road_polyline,
        "total_distance_km": total_dist
    }