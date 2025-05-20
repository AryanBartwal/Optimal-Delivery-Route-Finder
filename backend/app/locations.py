from typing import List, Dict, Any

DEHRADUN_LOCATIONS = sorted([
    {"name": "Ballupur", "lat": 30.333275, "lng": 78.011248, "type": "residential", "parking": True, "traffic_zone": "medium"},
    {"name": "Badripur", "lat": 30.284644, "lng": 78.065020, "type": "residential", "parking": True, "traffic_zone": "low"},
    {"name": "Vasant Vihar", "lat": 30.323023, "lng": 78.004126, "type": "residential", "parking": True, "traffic_zone": "medium"},
    {"name": "Bharuwala Grant", "lat": 30.2675, "lng": 77.9959, "type": "residential", "parking": True, "traffic_zone": "low"},
    {"name": "Chakrata Road", "lat": 30.3456, "lng": 78.0112, "type": "transport", "parking": True, "traffic_zone": "medium"},
    {"name": "Clement Town", "lat": 30.2791, "lng": 78.0078, "type": "residential", "parking": True, "traffic_zone": "low"},
    {"name": "Clock Tower", "lat": 30.3242, "lng": 78.0417, "type": "commercial", "parking": True, "traffic_zone": "high"},
    {"name": "Dalanwala", "lat": 30.3126, "lng": 78.0573, "type": "commercial", "parking": False, "traffic_zone": "high"},
    {"name": "Doiwala", "lat": 30.1758, "lng": 78.1242, "type": "residential", "parking": True, "traffic_zone": "medium"},
    {"name": "Doon University", "lat": 30.2697, "lng": 78.0436, "type": "institutional", "parking": True, "traffic_zone": "low"},
    {"name": "Forest Research Institute", "lat": 30.3421, "lng": 77.9972, "type": "institutional", "parking": True, "traffic_zone": "low"},
    {"name": "Graphic Era University", "lat": 30.268745, "lng": 77.993425, "type": "institutional", "parking": True, "traffic_zone": "medium"},
    {"name": "Harrawala", "lat": 30.2507, "lng": 78.0772, "type": "residential", "parking": True, "traffic_zone": "low"},
    {"name": "ISBT Dehradun", "lat": 30.2879, "lng": 77.9985, "type": "transport", "parking": True, "traffic_zone": "high"},
    {"name": "Jolly Grant Airport", "lat": 30.1872, "lng": 78.1748, "type": "transport", "parking": True, "traffic_zone": "low"},
    {"name": "Kandoli", "lat": 30.3599, "lng": 78.0624, "type": "residential", "parking": True, "traffic_zone": "low"},
    {"name": "Kargi Chowk", "lat": 30.290801, "lng": 78.024759, "type": "commercial", "parking": True, "traffic_zone": "medium"},
    {"name": "Kedarpur", "lat": 30.3123, "lng": 78.0456, "type": "residential", "parking": True, "traffic_zone": "low"},
    {"name": "Majra", "lat": 30.2947, "lng": 77.9937, "type": "residential", "parking": True, "traffic_zone": "low"},
    {"name": "Mothrowala", "lat": 30.2679, "lng": 78.0368, "type": "residential", "parking": True, "traffic_zone": "low"},
    {"name": "Mussoorie Diversion", "lat": 30.371537, "lng": 78.077424, "type": "transport", "parking": True, "traffic_zone": "medium"},
    {"name": "Nehru Colony", "lat": 30.2986, "lng": 78.0555, "type": "residential", "parking": True, "traffic_zone": "medium"},
    {"name": "Pacific Hills", "lat": 30.3486, "lng": 78.0344, "type": "residential", "parking": True, "traffic_zone": "low"},
    {"name": "Paltan Bazaar", "lat": 30.3222, "lng": 78.0373, "type": "commercial", "parking": False, "traffic_zone": "high"},
    {"name": "Patel Nagar", "lat": 30.3210, "lng": 78.0215, "type": "residential", "parking": True, "traffic_zone": "medium"},
    {"name": "Premnagar", "lat": 30.3350, "lng": 77.9582, "type": "residential", "parking": True, "traffic_zone": "medium"},
    {"name": "Race Course", "lat": 30.3145, "lng": 78.0438, "type": "recreational", "parking": True, "traffic_zone": "low"},
    {"name": "Rajpur", "lat": 30.3848, "lng": 78.0950, "type": "residential", "parking": True, "traffic_zone": "low"},
    {"name": "Rajpur Road", "lat": 30.3346, "lng": 78.0504, "type": "residential", "parking": True, "traffic_zone": "medium"},
    {"name": "Raipur", "lat": 30.3253, "lng": 78.0802, "type": "residential", "parking": True, "traffic_zone": "medium"},
    {"name": "Robbers Cave", "lat": 30.3758, "lng": 78.0841, "type": "recreational", "parking": True, "traffic_zone": "low"},
    {"name": "Sahastradhara", "lat": 30.3873, "lng": 78.1268, "type": "recreational", "parking": True, "traffic_zone": "medium"},
    {"name": "Selaqui", "lat": 30.366160, "lng": 77.858086, "type": "industrial", "parking": True, "traffic_zone": "low"},
    {"name": "Sahastradhara Road", "lat": 30.358394, "lng": 78.088158, "type": "transport", "parking": True, "traffic_zone": "medium"},
    {"name": "Subhash Nagar", "lat": 30.2733, "lng": 77.9926, "type": "residential", "parking": True, "traffic_zone": "medium"},
    {"name": "Survey Chowk", "lat": 30.3259, "lng": 78.0470, "type": "commercial", "parking": False, "traffic_zone": "high"},
    {"name": "Tapovan", "lat": 30.3382, "lng": 78.0801, "type": "residential", "parking": True, "traffic_zone": "low"},
    {"name": "Dharampur", "lat": 30.2991, "lng": 78.0571, "type": "residential", "parking": True, "traffic_zone": "medium"},
], key=lambda x: x["name"])

def get_all_locations() -> List[Dict[str, Any]]:
    return DEHRADUN_LOCATIONS

def get_location_by_name(name: str) -> Dict[str, Any]:
    return next((loc for loc in DEHRADUN_LOCATIONS if loc["name"] == name), None)