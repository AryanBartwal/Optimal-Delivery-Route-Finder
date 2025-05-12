from fastapi import FastAPI, Depends, HTTPException, status, Form
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import timedelta
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
from .route_service import get_route

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Dehradun Route Finder")

# Configure CORS with more permissive settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://alok-nawani.github.io"],  # Add GitHub Pages origin
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
    expose_headers=["*"],  # Expose all headers
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
def create_route(
    route_data: RouteCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # Calculate route using route service, pass user weather if specified
        route_result = get_route(
            route_data.start_location, 
            route_data.end_location, 
            route_data.vehicle_type,
            route_data.user_weather
        )
        
        # Select the chosen route option or default to the first one
        selected_option = route_data.route_option if route_data.route_option else "Route 1: Fast (Shortest)"
        
        # Find the selected route option
        selected_route = next(
            (route for route in route_result["route_options"] if route["option_name"] == selected_option), 
            route_result["route_options"][0]
        )
        
        # Save route to history
        route = RouteHistory(
            user_id=current_user.id,
            start_location=route_data.start_location,
            end_location=route_data.end_location,
            vehicle_type=route_data.vehicle_type,
            distance=selected_route["distance"],
            duration=selected_route["duration"],
            weather_condition=route_result["weather"]["condition"],
            traffic_condition=route_result["traffic"],
            route_option=selected_route["option_name"]
        )
        
        db.add(route)
        db.commit()
        db.refresh(route)
        
        return route_result
        
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