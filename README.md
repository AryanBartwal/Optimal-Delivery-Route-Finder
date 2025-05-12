# Optimal Route Finder for Dehradun City

A route finding application for Dehradun city featuring a FastAPI backend and React frontend. 

## Features

- Find optimal routes between landmarks in Dehradun city
- Multiple route options displayed with distance and duration
- Weather conditions affect route calculations
- Traffic information impacts route durations
- Different route types (fast vs. alternate)
- Turn-by-turn directions with real road paths

## Technology Stack

- **Frontend**: React.js with Leaflet for maps
- **Backend**: FastAPI (Python)
- **Routing**: OpenStreetMap data via OSRM

## Screenshots

<!-- Add screenshots here when available -->

## Setup & Installation

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm start
```

The application will be available at http://localhost:3000

## API Documentation

The API documentation is available at http://localhost:8000/docs when the backend server is running.

## Future Improvements

- Real-time traffic data integration
- User profiles and saved routes
- Mobile application version

## Contributors

- Alok Nawani

## License

MIT License 