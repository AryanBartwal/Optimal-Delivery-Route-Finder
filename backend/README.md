# Optimal Route Finder Backend

FastAPI backend for the Optimal Route Finder application.

## Setup

```bash
# Create a virtual environment
python -m venv venv

# Activate the virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn app.main:app --reload --port 8000
```

## Environment Variables

Create a `.env` file with the following variables:

```
DATABASE_URL=sqlite:///app.db
SECRET_KEY=your-secret-key-here
CORS_ORIGINS=https://alok-nawani.github.io,http://localhost:3000
```

## API Documentation

When running locally, API documentation is available at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc 