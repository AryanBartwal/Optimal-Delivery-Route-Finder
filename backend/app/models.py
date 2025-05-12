from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    routes = relationship("RouteHistory", back_populates="user")

class RouteHistory(Base):
    __tablename__ = "route_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    start_location = Column(String)
    end_location = Column(String)
    vehicle_type = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    distance = Column(Float)
    duration = Column(Float)
    weather_condition = Column(String, nullable=True)
    traffic_condition = Column(String, nullable=True)
    route_option = Column(String, nullable=True)
    
    user = relationship("User", back_populates="routes") 