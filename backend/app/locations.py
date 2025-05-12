from typing import List, Dict, Any

DEHRADUN_LOCATIONS = [
    {"name": "Clock Tower", "lat": 30.324133, "lng": 78.041545, "type": "commercial", "parking": True, "traffic_zone": "high"},
    {"name": "Forest Research Institute", "lat": 30.342138, "lng": 77.997196, "type": "institutional", "parking": True, "traffic_zone": "low"},
    {"name": "Paltan Bazaar", "lat": 30.322182, "lng": 78.037319, "type": "commercial", "parking": False, "traffic_zone": "high"},
    {"name": "Rajpur Road", "lat": 30.334577, "lng": 78.050415, "type": "residential", "parking": True, "traffic_zone": "medium"},
    {"name": "ISBT Dehradun", "lat": 30.287645, "lng": 78.037608, "type": "transport", "parking": True, "traffic_zone": "high"},
    {"name": "Clement Town", "lat": 30.269485, "lng": 77.989113, "type": "residential", "parking": True, "traffic_zone": "low"},
    {"name": "Premnagar", "lat": 30.334991, "lng": 77.958172, "type": "residential", "parking": True, "traffic_zone": "medium"},
    {"name": "Dalanwala", "lat": 30.330858, "lng": 78.060522, "type": "commercial", "parking": False, "traffic_zone": "high"},
    {"name": "Ballupur", "lat": 30.344053, "lng": 78.018580, "type": "residential", "parking": True, "traffic_zone": "medium"},
    {"name": "Race Course", "lat": 30.318277, "lng": 78.011597, "type": "recreational", "parking": True, "traffic_zone": "low"},
    {"name": "Survey Chowk", "lat": 30.325861, "lng": 78.047028, "type": "commercial", "parking": False, "traffic_zone": "high"},
    {"name": "Nehru Colony", "lat": 30.306847, "lng": 78.029657, "type": "residential", "parking": True, "traffic_zone": "medium"},
    {"name": "Rajpur", "lat": 30.384751, "lng": 78.095012, "type": "residential", "parking": True, "traffic_zone": "low"},
    {"name": "Mussoorie Diversion", "lat": 30.372744, "lng": 78.079261, "type": "transport", "parking": True, "traffic_zone": "medium"},
    {"name": "Doon University", "lat": 30.302542, "lng": 78.066221, "type": "institutional", "parking": True, "traffic_zone": "low"},
    {"name": "Pacific Hills", "lat": 30.348594, "lng": 78.034370, "type": "residential", "parking": True, "traffic_zone": "low"},
    {"name": "Kandoli", "lat": 30.359957, "lng": 78.062350, "type": "residential", "parking": True, "traffic_zone": "low"},
    {"name": "Majra", "lat": 30.267196, "lng": 78.006493, "type": "residential", "parking": True, "traffic_zone": "low"},
    {"name": "Sahastradhara", "lat": 30.387324, "lng": 78.126753, "type": "recreational", "parking": True, "traffic_zone": "medium"},
    {"name": "Robbers Cave", "lat": 30.375826, "lng": 78.084107, "type": "recreational", "parking": True, "traffic_zone": "low"}
]

def get_all_locations() -> List[Dict[str, Any]]:
    return DEHRADUN_LOCATIONS

def get_location_by_name(name: str) -> Dict[str, Any]:
    return next((loc for loc in DEHRADUN_LOCATIONS if loc["name"] == name), None) 