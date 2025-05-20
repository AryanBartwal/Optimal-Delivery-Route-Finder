import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Button,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
  Stack,
} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';
import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk';
import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt';
import TurnLeftIcon from '@mui/icons-material/TurnLeft';
import TurnRightIcon from '@mui/icons-material/TurnRight';
import StraightIcon from '@mui/icons-material/Straight';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import CloudIcon from '@mui/icons-material/Cloud';
import UmbrellaIcon from '@mui/icons-material/BeachAccess';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import FilterDramaIcon from '@mui/icons-material/FilterDrama';
import SpeedIcon from '@mui/icons-material/Speed';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useAuth } from '../contexts/AuthContext';
import { alpha } from '@mui/material/styles';
import Autocomplete from "@mui/material/Autocomplete";
import HotelIcon from '@mui/icons-material/Hotel';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import MosqueIcon from '@mui/icons-material/Mosque';
import TextField from '@mui/material/TextField';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ShareIcon from '@mui/icons-material/Share';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import { purple } from '@mui/material/colors';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Create custom markers for start and end points
const startIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const endIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Custom marker icons for nearby search
const hotelIcon = new L.Icon({
  iconUrl: 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-2x-violet.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
const restaurantIcon = new L.Icon({
  iconUrl: 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
const placeIcon = new L.Icon({
  iconUrl: 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Create axios instance
const api = axios.create({
  baseURL: 'http://localhost:8000',
});

const vehicleIcons = {
  car: <DirectionsCarIcon />,
  bike: <DirectionsBikeIcon />,
  walk: <DirectionsWalkIcon />,
};

const weatherIcons = {
  sunny: <WbSunnyIcon style={{ color: '#FFB900' }} />,
  cloudy: <CloudIcon style={{ color: '#757575' }} />,
  rainy: <UmbrellaIcon style={{ color: '#0078D7' }} />,
  snowy: <AcUnitIcon style={{ color: '#00B7C3' }} />,
  foggy: <FilterDramaIcon style={{ color: '#9E9E9E' }} />,
};

const trafficIcons = {
  light: <CheckCircleIcon style={{ color: '#107C10' }} />,
  moderate: <SpeedIcon style={{ color: '#FFB900' }} />,
  heavy: <WarningIcon style={{ color: '#E81123' }} />,
};

const getDirectionIcon = (instruction) => {
  if (instruction.includes('left')) {
    return <TurnLeftIcon color="primary" />;
  } else if (instruction.includes('right')) {
    return <TurnRightIcon color="primary" />;
  } else if (instruction.includes('straight')) {
    return <StraightIcon color="primary" />;
  } else {
    return <ArrowRightAltIcon color="primary" />;
  }
};

const formatDistance = (meters) => {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  } else {
    return `${(meters / 1000).toFixed(1)} km`;
  }
};

const formatDuration = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  if (minutes < 1) {
    return `${Math.round(seconds)} sec`;
  } else {
    return `${minutes} min`;
  }
};

const getPolylineColor = (vehicleType, routeIndex) => {
  // Base colors for each vehicle type
  const baseColors = {
    car: '#1976d2',
    bike: '#2e7d32',
    walk: '#ed6c02'
  };
  
  // Variations for multiple routes of the same vehicle type
  const variations = [
    '', // No variation for first route
    '99', // Lighter
    '66' // Even lighter
  ];
  
  return baseColors[vehicleType] + variations[routeIndex] || baseColors[vehicleType];
};

// Assign color based on traffic for each route
const getTrafficColor = (traffic, idx) => {
  if (traffic === 'heavy') return '#e53935'; // Red
  if (traffic === 'moderate') return '#fbc02d'; // Yellow
  if (traffic === 'light') return '#1976d2'; // Blue
  // Fallback: cycle colors if more than 3
  const palette = ['#1976d2', '#fbc02d', '#e53935'];
  return palette[idx % 3];
};

const getWeatherDescription = (weather) => {
  if (!weather) return '';
  
  const descriptions = {
    sunny: `Sunny, ${weather.temperature}°C`,
    cloudy: `Cloudy, ${weather.temperature}°C`,
    rainy: `Rainy, ${weather.temperature}°C, ${weather.precipitation}% precipitation`,
    snowy: `Snowy, ${weather.temperature}°C, ${weather.precipitation}% precipitation`,
    foggy: `Foggy, ${weather.temperature}°C`
  };
  
  return descriptions[weather.condition] || '';
};

const getTrafficDescription = (traffic) => {
  const descriptions = {
    light: 'Light traffic, good road conditions',
    moderate: 'Moderate traffic, expect minor delays',
    heavy: 'Heavy traffic, significant delays expected'
  };
  
  return descriptions[traffic] || '';
};

const FindRoute = () => {
  const [startQuery, setStartQuery] = useState("");
  const [endQuery, setEndQuery] = useState("");
  const [startOptions, setStartOptions] = useState([]);
  const [endOptions, setEndOptions] = useState([]);
  const [startCoords, setStartCoords] = useState(null); // {lat, lng}
  const [endCoords, setEndCoords] = useState(null); // {lat, lng}
  const [nearbyType, setNearbyType] = useState("");
  const [nearbyResults, setNearbyResults] = useState([]);
  const [vehicleType, setVehicleType] = useState('car');
  const [userWeather, setUserWeather] = useState('');
  const [route, setRoute] = useState(null);
  const [routePaths, setRoutePaths] = useState([]);
  const [selectedRouteOption, setSelectedRouteOption] = useState('Route 1: Fast (Shortest)');
  const [error, setError] = useState('');
  const [mapCenter, setMapCenter] = useState([30.3165, 78.0322]);
  const [mapZoom, setMapZoom] = useState(13);
  const [steps, setSteps] = useState([]);
  const [userCoords, setUserCoords] = useState(null); // {lat, lng}
  const [watchId, setWatchId] = useState(null);
  const [liveDistance, setLiveDistance] = useState(null);
  const [stops, setStops] = useState([{ id: Date.now() + Math.random(), lat: null, lng: null, query: '', options: [] }]);
  const [optimizedRoute, setOptimizedRoute] = useState(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [shareType, setShareType] = useState('google'); // 'google' or 'apple'
  const navigate = useNavigate();
  const { isAuthenticated, api } = useAuth();
  const [landmarks, setLandmarks] = useState([]);
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');

  // Add prototype route state
  const [prototypeRoute, setPrototypeRoute] = useState(null);
  const [directRoute, setDirectRoute] = useState(null); // Direct/greedy
  const [prototypeRouteLoading, setPrototypeRouteLoading] = useState(false);
  const [prototypeRouteError, setPrototypeRouteError] = useState('');

  // Fetch Dehradun landmarks from backend on mount
  useEffect(() => {
    api.get('/locations').then(res => {
      setLandmarks(res.data);
    });
  }, []);

  // OSM Nominatim search for start
  useEffect(() => {
    if (startQuery.length < 3) return;
    const fetchOptions = async () => {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(startQuery)}&addressdetails=1&limit=5`;
      const res = await fetch(url);
      const data = await res.json();
      setStartOptions(data);
    };
    fetchOptions();
  }, [startQuery]);

  // OSM Nominatim search for end
  useEffect(() => {
    if (endQuery.length < 3) return;
    const fetchOptions = async () => {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(endQuery)}&addressdetails=1&limit=5`;
      const res = await fetch(url);
      const data = await res.json();
      setEndOptions(data);
    };
    fetchOptions();
  }, [endQuery]);

  // OSM Overpass API for nearby search
  const handleNearbySearch = async () => {
    if (!startCoords && !userCoords) {
      setError("Set a start location or use your current location first.");
      return;
    }
    const { lat, lng } = startCoords || userCoords;
    const radius = 2; // km
    const filtered = landmarks.filter(l => {
      const dLat = (l.lat - lat) * Math.PI / 180;
      const dLng = (l.lng - lng) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat * Math.PI / 180) * Math.cos(l.lat * Math.PI / 180) * Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const dist = 6371 * c;
      return dist <= radius;
    });
    setNearbyResults(filtered);
  };

  // Haversine formula for distance in meters
  const haversine = (lat1, lon1, lat2, lon2) => {
    const toRad = x => x * Math.PI / 180;
    const R = 6371e3;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Use current location button handler
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords;
        setUserCoords({ lat: latitude, lng: longitude });
      },
      err => setError('Failed to get current location.'),
      { enableHighAccuracy: true }
    );
  };

  // Track user movement and update live distance
  useEffect(() => {
    if (!route || !route.end) return;
    if (!userCoords) return;
    if (watchId) navigator.geolocation.clearWatch(watchId);
    const id = navigator.geolocation.watchPosition(
      pos => {
        const { latitude, longitude } = pos.coords;
        setUserCoords({ lat: latitude, lng: longitude });
        // Calculate distance to destination
        setLiveDistance(haversine(latitude, longitude, route.end.lat, route.end.lng));
      },
      err => {},
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 }
    );
    setWatchId(id);
    return () => { if (id) navigator.geolocation.clearWatch(id); };
  }, [route, userCoords]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setRoutePaths([]);
    setSteps([]);

    try {
      if (!isAuthenticated) {
        navigate('/login');
        return;
      }

      const response = await api.post(
        '/routes',
        {
          start_coords: startCoords,
          end_coords: endCoords,
          vehicle_type: vehicleType,
          route_option: selectedRouteOption,
          user_weather: userWeather || undefined
        }
      );
      
      setRoute(response.data);
      
      if (response.data.route_options && response.data.route_options.length > 0) {
        // Set route paths for all options with color and selection info
        setRoutePaths(
          response.data.route_options.map((option, idx) => ({
            path: option.path,
            color: getPolylineColor(response.data.vehicle_type, idx),
            selected: option.option_name === selectedRouteOption
          }))
        );
        
        // Set steps for selected route option
        const selectedOption = response.data.route_options.find(
          option => option.option_name === selectedRouteOption
        ) || response.data.route_options[0];
        
        // Update selected route option if it's not in the new options
        if (!response.data.route_options.some(opt => opt.option_name === selectedRouteOption)) {
          setSelectedRouteOption(response.data.route_options[0].option_name);
        }
        
        if (selectedOption.steps && selectedOption.steps.length > 0) {
          setSteps(selectedOption.steps);
        }
        
        // Calculate bounds to fit the routes
        const allPoints = response.data.route_options.flatMap(option => option.path);
        if (allPoints.length > 0) {
          const bounds = L.latLngBounds(allPoints);
          const center = bounds.getCenter();
          setMapCenter([center.lat, center.lng]);
          setMapZoom(12);
        }
      }
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login');
      } else if (err.response?.status === 422) {
        setError('Please select both start and end locations');
      } else {
        setError('Failed to calculate route');
        console.error('Route error:', err.response?.data || err);
      }
    }
  };
  
  const handleRouteOptionChange = (e) => {
    setSelectedRouteOption(e.target.value);

    // Update steps and routePaths based on selected route
    if (route && route.route_options) {
      const selectedOption = route.route_options.find(
        option => option.option_name === e.target.value
      );

      if (selectedOption && selectedOption.steps) {
        setSteps(selectedOption.steps);
      } else {
        setSteps([]);
      }

      // Update routePaths to highlight the selected route
      setRoutePaths(
        route.route_options.map((option, idx) => ({
          path: option.path,
          color: getPolylineColor(route.vehicle_type, idx),
          selected: option.option_name === e.target.value
        }))
      );
    }
  };

  // Handle drag end for stops
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const reordered = Array.from(stops);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    setStops(reordered);
  };

  // Add a new stop
  const handleAddStop = () => {
    setStops([...stops, { id: Date.now() + Math.random(), lat: null, lng: null, query: '', options: [] }]);
  };

  // Remove a stop
  const handleRemoveStop = (idx) => {
    if (stops.length <= 2) return; // At least 2 stops required
    setStops(stops.filter((_, i) => i !== idx));
  };

  // Update stop query and fetch OSM options
  const handleStopQueryChange = (idx, value) => {
    const newStops = [...stops];
    newStops[idx].query = value;
    setStops(newStops);
    // No OSM fetch needed
  };

  // Set stop coordinates and query from dropdown
  const handleStopSelect = (idx, value) => {
    const newStops = [...stops];
    const found = landmarks.find(l => l.name === value);
    if (found) {
      newStops[idx].lat = found.lat;
      newStops[idx].lng = found.lng;
      newStops[idx].query = found.name; // Always set query to landmark name
    } else {
      newStops[idx].lat = null;
      newStops[idx].lng = null;
      newStops[idx].query = value;
    }
    setStops(newStops);
  };

  // Add a toggle for Google Maps optimization
  const [gmOptimize, setGmOptimize] = useState(true);

  // Optimize multi-stop route (redirect to Google Maps, pin stops, show optimal path)
  const handleOptimizeRoute = async () => {
    setError('');
    setOptimizedRoute(null);
    const validStops = stops.filter(s => s.lat && s.lng);
    if (validStops.length < 2) {
      setError('Please set at least 2 valid stops.');
      return;
    }
    const base = 'https://www.google.com/maps/dir/';
    const waypoints = validStops.map(s => `${s.lat},${s.lng}`).join('/');
    // Redirect to Google Maps in a new tab
    window.open(base + waypoints, '_blank');
  };

  // Google Maps Embed API key (replace with your own key)
  const GOOGLE_MAPS_EMBED_API_KEY = 'YOUR_GOOGLE_MAPS_EMBED_API_KEY'; // TODO: Set your API key here

  // Helper to build Google Maps embed URL (supports up to 10 stops)
  function getGoogleMapsEmbedUrl(stops) {
    if (!GOOGLE_MAPS_EMBED_API_KEY) return '';
    const validStops = stops.filter(s => s.lat && s.lng);
    if (validStops.length < 2) return '';
    const origin = `${validStops[0].lat},${validStops[0].lng}`;
    const destination = `${validStops[validStops.length - 1].lat},${validStops[validStops.length - 1].lng}`;
    const waypoints = validStops.slice(1, -1).map(s => `${s.lat},${s.lng}`).join('|');
    let url = `https://www.google.com/maps/embed/v1/directions?key=${GOOGLE_MAPS_EMBED_API_KEY}`;
    url += `&origin=${origin}&destination=${destination}`;
    if (waypoints) url += `&waypoints=${encodeURIComponent(waypoints)}`;
    return url;
  }

  const handleOpenShareDialog = () => {
    const validStops = stops.filter(s => s.lat && s.lng);
    if (validStops.length < 2) {
      setShareUrl('Please set at least 2 valid stops.');
    } else if (validStops.length > 10) {
      setShareUrl('Google Maps embed only supports up to 10 stops.');
    } else {
      const base = 'https://www.google.com/maps/dir/';
      const waypoints = validStops.map(s => `${s.lat},${s.lng}`).join('/');
      setShareUrl(base + waypoints);
    }
    setShareType('google');
    setShareDialogOpen(true);
  };

  const handleCopyShareUrl = () => {
    navigator.clipboard.writeText(shareUrl);
  };

  // 1. Allow clicking any landmark pin to add as a stop
  function handleAddLandmarkAsStop(landmark) {
    // Prevent duplicate stops
    if (stops.some(s => s.lat === landmark.lat && s.lng === landmark.lng)) return;
    setStops([...stops, { id: Date.now() + Math.random(), lat: landmark.lat, lng: landmark.lng, query: landmark.name, options: [] }]);
  }

  // 2. Add a Reset Route button
  function handleResetRoute() {
    setStops([{ id: Date.now() + Math.random(), lat: null, lng: null, query: '', options: [] }]);
    setOptimizedRoute(null);
    setSteps([]);
    setError('');
  }

  // Handler for 'Test Route' button
  const handleTestRoute = async () => {
    setPrototypeRoute(null);
    setDirectRoute(null);
    setPrototypeRouteError('');
    setPrototypeRouteLoading(true);
    const validStops = stops.filter(s => s.lat && s.lng);
    if (validStops.length < 2) {
      setPrototypeRouteError('Please set at least 2 valid stops.');
      setPrototypeRouteLoading(false);
      return;
    }
    try {
      // Always use the actual landmark name from the landmarks list
      const stopNames = validStops.map(s => {
        const found = landmarks.find(l => l.lat === s.lat && l.lng === s.lng);
        return found ? found.name : s.query;
      });
      // 1. Get Floyd-Warshall route
      const fwRes = await api.post('/multi-floyd-warshall', {
        start: stopNames[0],
        destinations: stopNames.slice(1)
      });
      if (fwRes.data && Array.isArray(fwRes.data.path_coords)) {
        setPrototypeRoute(fwRes.data);
      } else {
        setPrototypeRouteError('No Floyd-Warshall route found.');
      }
      // 2. Get direct/greedy route (assume backend endpoint exists: /multi-direct-route)
      try {
        const directRes = await api.post('/multi-direct-route', {
          start: stopNames[0],
          destinations: stopNames.slice(1)
        });
        if (directRes.data && Array.isArray(directRes.data.path_coords)) {
          setDirectRoute(directRes.data);
        }
      } catch (e) {
        // If endpoint not available, skip
      }
    } catch (e) {
      setPrototypeRouteError('Failed to get prototype route.');
    }
    setPrototypeRouteLoading(false);
  };

  // Fix Droppable defaultProps warning by using default parameters
  const DroppableWrapper = (props) => {
    const { children, ...rest } = props;
    return <Droppable {...rest}>{children}</Droppable>;
  };

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  return (
    <Container maxWidth="lg" sx={{ my: 4 }}>
      <Box sx={{ 
        py: 3, 
        px: 4, 
        backgroundColor: 'primary.main', 
        color: 'white', 
        borderRadius: '12px', 
        mb: 4,
        background: 'linear-gradient(135deg, #3f51b5 0%, #7986cb 100%)',
      }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="600">
          Find Optimal Route
        </Typography>
        <Typography variant="subtitle1">
          Choose start and end locations to discover the best routes in Dehradun
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Route Search Form */}
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom fontWeight="600" sx={{ mb: 3 }}>
              Route Settings
            </Typography>
            <Stack spacing={3}>
              {/* Multi-stop delivery UI */}
              <DragDropContext onDragEnd={handleDragEnd}>
                <DroppableWrapper droppableId="stops-droppable">
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps}>
                      {stops.map((stop, idx) => (
                        <Draggable key={stop.id} draggableId={`stop-${stop.id}`} index={idx}>
                          {(provided, snapshot) => (
                            <Box
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              sx={{ display: 'flex', alignItems: 'center', mb: 1, background: snapshot.isDragging ? '#e3f2fd' : 'none', borderRadius: 1 }}
                              item={String(true)} // Fix non-boolean attribute warning
                            >
                              <Autocomplete
                                options={landmarks.map(l => l.name)}
                                inputValue={stop.query}
                                value={landmarks.map(l => l.name).includes(stop.query) ? stop.query : null}
                                onInputChange={(_, value) => handleStopQueryChange(idx, value)}
                                onChange={(_, value) => handleStopSelect(idx, value)}
                                renderInput={(params) => <TextField {...params} label={`Stop ${idx + 1}`} />}
                                sx={{ flex: 1 }}
                              />
                              {stops.length > 2 && (
                                <Button color="error" onClick={() => handleRemoveStop(idx)} sx={{ ml: 1, minWidth: 0, px: 1 }}>✕</Button>
                              )}
                            </Box>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </DroppableWrapper>
              </DragDropContext>
              <Button variant="outlined" onClick={handleAddStop} sx={{ mb: 2 }}>+ Add Stop</Button>
              <Button variant="contained" color="secondary" onClick={handleOptimizeRoute} sx={{ width: '100%' }} disabled={stops.filter(s => s.lat && s.lng).length < 2}>
                Optimize Delivery Route
              </Button>
              {/* 3. Add Reset Route button near Optimize button */}
              <Button variant="outlined" color="error" onClick={handleResetRoute} sx={{ mt: 1 }}>
                Reset Route
              </Button>
              {/* Add Test Route button */}
              <Button variant="contained" color="info" onClick={handleTestRoute} sx={{ width: '100%' }} disabled={stops.filter(s => s.lat && s.lng).length < 2 || prototypeRouteLoading}>
                {prototypeRouteLoading ? 'Testing...' : 'Test Route'}
              </Button>
              {prototypeRouteError && (
                <Alert severity="error" sx={{ mt: 2 }}>{prototypeRouteError}</Alert>
              )}
              {prototypeRoute && prototypeRoute.total_distance_km && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Prototype route found! Total distance: {prototypeRoute.total_distance_km.toFixed(2)} km.
                </Alert>
              )}
            </Stack>
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </Paper>
        </Grid>

        {/* Map and Route Options */}
        <Grid item xs={12} md={8}>
          {/* Map Container */}
          <Paper 
            elevation={2} 
            sx={{ 
              p: 0, 
              borderRadius: 3,
              overflow: 'hidden',
              mb: 3,
              height: '400px'
            }}
          >
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {/* Show all landmarks as pins (prototype) */}
              {landmarks.filter(l => l.lat && l.lng).map((l, idx) => {
                // Color logic
                let iconUrl = '';
                // Tourist and recreational places: use a unique color (e.g. pink)
                if (l.type === 'recreational' || l.type === 'tourist') {
                  iconUrl = 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-2x-pink.png';
                } else if (l.name.toLowerCase().includes('race course')) {
                  iconUrl = 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-2x-pink.png';
                } else if (l.name.toLowerCase().includes('robbers cave')) {
                  iconUrl = 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-2x-pink.png';
                } else if (l.name.toLowerCase().includes('sahastradhara')) {
                  iconUrl = 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-2x-pink.png';
                } else if (l.type === 'residential') {
                  iconUrl = 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-2x-green.png';
                } else if (l.traffic_zone === 'high') {
                  iconUrl = 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-2x-red.png';
                } else if (l.type === 'institutional') {
                  iconUrl = 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-2x-blue.png';
                } else if (l.type === 'commercial') {
                  iconUrl = 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-2x-yellow.png';
                } else if (l.type === 'transport') {
                  iconUrl = 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-2x-violet.png';
                } else if (l.type === 'industrial') {
                  iconUrl = 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-2x-grey.png';
                } else {
                  iconUrl = 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-2x-orange.png';
                }
                return (
                  <Marker
                    key={l.id || l.name || idx}
                    position={[l.lat, l.lng]}
                    icon={new L.Icon({
                      iconUrl,
                      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                      iconSize: [25, 41],
                      iconAnchor: [12, 41],
                      popupAnchor: [1, -34],
                      shadowSize: [41, 41]
                    })}
                    eventHandlers={{
                      click: () => handleAddLandmarkAsStop(l)
                    }}
                  >
                    <Popup>{l.name}<br/><Button size="small" onClick={() => handleAddLandmarkAsStop(l)}>Add as Stop</Button></Popup>
                  </Marker>
                );
              })}

              {/* Draw optimized road route if available */}
              {optimizedRoute && optimizedRoute.routes && optimizedRoute.routes[0] && optimizedRoute.routes[0].geometry && (
                <Polyline
                  positions={optimizedRoute.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng])}
                  color="#1976d2"
                  weight={7}
                  opacity={0.9}
                />
              )}

              {/* In the MapContainer, show a Marker for each stop */}
              {stops.filter(s => s.lat && s.lng).map((s, idx) => (
                <Marker
                  key={`stop-${idx}`}
                  position={[s.lat, s.lng]}
                  icon={new L.Icon({
                    iconUrl: 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-2x-orange.png',
                    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowSize: [41, 41]
                  })}
                >
                  <Popup>Stop {idx + 1}</Popup>
                </Marker>
              ))}

              {/* In MapContainer, render both routes if available */}
              {directRoute && directRoute.path_coords && (
                <Polyline
                  positions={directRoute.path_coords.map(([lat, lng]) => [lat, lng])}
                  color="#8e24aa" // purple for direct
                  weight={5}
                  opacity={0.7}
                />
              )}
              {prototypeRoute && prototypeRoute.path_coords && (
                <Polyline
                  positions={prototypeRoute.path_coords.map(([lat, lng]) => [lat, lng])}
                  color="#1976d2" // blue for Floyd-Warshall
                  weight={7}
                  opacity={0.9}
                />
              )}
            </MapContainer>
          </Paper>
          
          {/* Route Details and Options */}
          {route && (
            <Paper 
              elevation={2} 
              sx={{ 
                p: 3, 
                borderRadius: 3
              }}
            >
              <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', mb: 3, gap: 2 }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  py: 1, 
                  px: 2, 
                  borderRadius: 2, 
                  bgcolor: 'primary.light', 
                  color: 'white'
                }}>
                  {weatherIcons[route.weather.condition] || weatherIcons.sunny}
                  <Typography variant="body1" sx={{ ml: 1 }}>
                    {route.weather.condition}
                    </Typography>
                  </Box>
                
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  py: 1, 
                  px: 2, 
                  borderRadius: 2, 
                  bgcolor: 
                    route.traffic === 'light' 
                      ? 'success.light' 
                      : route.traffic === 'moderate' 
                        ? 'warning.light' 
                        : 'error.light',
                  color: 'white'
                }}>
                  {trafficIcons[route.traffic] || trafficIcons.light}
                  <Typography variant="body1" sx={{ ml: 1, textTransform: 'capitalize' }}>
                    {route.traffic} Traffic
                    </Typography>
                  </Box>
                
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  py: 1, 
                  px: 2, 
                  borderRadius: 2, 
                  bgcolor: 'background.default'
                }}>
                  {vehicleIcons[route.vehicle_type] || vehicleIcons.car}
                  <Typography variant="body1" sx={{ ml: 1, textTransform: 'capitalize' }}>
                    {route.vehicle_type}
                  </Typography>
                </Box>
              </Box>
              
              <Typography variant="h6" gutterBottom fontWeight="600">
                  Route Options
                </Typography>
              
              <FormControl component="fieldset" sx={{ width: '100%', mb: 3 }}>
                  <RadioGroup 
                    value={selectedRouteOption} 
                    onChange={handleRouteOptionChange}
                  >
                  <Grid container spacing={2}>
                    {route.route_options.map((option, index) => (
                      <Grid item xs={12} key={index}>
                      <Paper 
                          elevation={selectedRouteOption === option.option_name ? 2 : 0} 
                        sx={{ 
                          p: 2, 
                            borderRadius: 2,
                            border: `2px solid ${selectedRouteOption === option.option_name 
                              ? getPolylineColor(route.vehicle_type, index) 
                              : 'transparent'}`,
                            transition: 'all 0.2s ease',
                            '&:hover': { 
                              bgcolor: 'background.default',
                              transform: 'translateY(-2px)'
                            }
                        }}
                      >
                        <FormControlLabel 
                          value={option.option_name} 
                          control={<Radio />} 
                          label={
                            <Box>
                                <Typography variant="subtitle1" fontWeight="600">
                                  {option.option_name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {option.description}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                                  <Chip 
                                    size="small" 
                                    label={`${option.distance} km`}
                                    sx={{ 
                                      bgcolor: alpha(getPolylineColor(route.vehicle_type, index), 0.1),
                                      borderRadius: '8px'
                                    }}
                                  />
                                  <Chip 
                                    size="small" 
                                    label={`${option.duration} min`}
                                    sx={{ 
                                      bgcolor: alpha(getPolylineColor(route.vehicle_type, index), 0.1),
                                      borderRadius: '8px'
                                    }}
                                  />
                                </Box>
                              </Box>
                            }
                            sx={{ 
                              width: '100%', 
                              alignItems: 'flex-start', 
                              ml: 0,
                              '& .MuiFormControlLabel-label': { 
                                width: '100%' 
                          } 
                            }}
                        />
                      </Paper>
                      </Grid>
                    ))}
                  </Grid>
                  </RadioGroup>
                </FormControl>
                
              {/* Directions */}
                {steps.length > 0 && (
                <>
                  <Typography variant="h6" gutterBottom fontWeight="600">
                    Directions
                    </Typography>
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      bgcolor: 'background.default', 
                      borderRadius: 2,
                      maxHeight: '300px',
                      overflow: 'auto'
                    }}
                  >
                    <List dense>
                      {steps.map((step, index) => (
                        <React.Fragment key={index}>
                          <ListItem>
                          <ListItemIcon>
                            {getDirectionIcon(step.instruction)}
                          </ListItemIcon>
                          <ListItemText
                            primary={step.instruction.charAt(0).toUpperCase() + step.instruction.slice(1)}
                              secondary={`${formatDistance(step.distance)} - ${formatDuration(step.duration)}`}
                          />
                        </ListItem>
                          {index < steps.length - 1 && <Divider variant="inset" component="li" />}
                        </React.Fragment>
                      ))}
                    </List>
                  </Paper>
                </>
            )}
            {liveDistance !== null && userCoords && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  You are {formatDistance(liveDistance)} from your destination. Map updates as you move.
                </Alert>
              )}
          </Paper>
          )}
        </Grid>
      </Grid>

      {/* Share Route Dialog */}
      <Dialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)}>
        <DialogTitle>Share Route (Google Maps)</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>{shareUrl}</Typography>
          {/* Embed Google Maps iframe if possible */}
          {(() => {
            const validStops = stops.filter(s => s.lat && s.lng);
            if (
              shareType === 'google' &&
              GOOGLE_MAPS_EMBED_API_KEY &&
              validStops.length >= 2 &&
              validStops.length <= 10
            ) {
              const embedUrl = getGoogleMapsEmbedUrl(stops);
              return (
                <Box sx={{ mt: 2 }}>
                  <iframe
                    title="Google Maps Directions"
                    width="100%"
                    height="400"
                    frameBorder="0"
                    style={{ border: 0 }}
                    src={embedUrl}
                    allowFullScreen
                  />
                  <Typography variant="caption" color="text.secondary">
                    (Up to 10 stops supported. For more, use the Open button below.)
                  </Typography>
                </Box>
              );
            }
            return null;
          })()}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCopyShareUrl} startIcon={<ContentCopyIcon />}>Copy Link</Button>
          <Button onClick={() => window.open(shareUrl, '_blank')} startIcon={<ShareIcon />}>Open</Button>
          <Button onClick={() => setShareDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Legend for route types */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 24, height: 4, bgcolor: '#8e24aa', mr: 1 }} />
          <Typography variant="body2">Direct Route (Greedy)</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 24, height: 4, bgcolor: '#1976d2', mr: 1 }} />
          <Typography variant="body2">Floyd-Warshall Route</Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default FindRoute;