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
  const [locations, setLocations] = useState([]);
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [vehicleType, setVehicleType] = useState('car');
  const [userWeather, setUserWeather] = useState('');
  const [route, setRoute] = useState(null);
  const [routePaths, setRoutePaths] = useState([]);
  const [selectedRouteOption, setSelectedRouteOption] = useState('Route 1: Fast (Shortest)');
  const [error, setError] = useState('');
  const [mapCenter, setMapCenter] = useState([30.3165, 78.0322]);
  const [mapZoom, setMapZoom] = useState(13);
  const [steps, setSteps] = useState([]);
  const navigate = useNavigate();
  const { isAuthenticated, api } = useAuth();

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        if (!isAuthenticated) {
          navigate('/login');
          return;
        }

        const response = await api.get('/locations');
        setLocations(response.data);
      } catch (err) {
        if (err.response?.status === 401) {
          navigate('/login');
        } else {
          setError('Failed to load locations');
          console.error('Location fetch error:', err);
        }
      }
    };
    fetchLocations();
  }, [navigate, isAuthenticated, api]);

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
          start_location: startLocation,
          end_location: endLocation,
          vehicle_type: vehicleType,
          route_option: selectedRouteOption,
          user_weather: userWeather || undefined
        }
      );
      
      setRoute(response.data);
      
      if (response.data.route_options && response.data.route_options.length > 0) {
        // Set route paths for all options
        setRoutePaths(response.data.route_options.map(option => option.path));
        
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
    
    // Update steps based on selected route
    if (route && route.route_options) {
      const selectedOption = route.route_options.find(
        option => option.option_name === e.target.value
      );
      
      if (selectedOption && selectedOption.steps) {
        setSteps(selectedOption.steps);
      } else {
        setSteps([]);
      }
    }
  };

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Grid container spacing={4}>
        <Grid xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Find Route
            </Typography>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <Box component="form" onSubmit={handleSubmit}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Start Location</InputLabel>
                <Select
                  value={startLocation}
                  label="Start Location"
                  onChange={(e) => setStartLocation(e.target.value)}
                  required
                >
                  {locations.map((loc) => (
                    <MenuItem key={loc.name} value={loc.name}>
                      {loc.name}
                      <Chip 
                        label={loc.type} 
                        size="small" 
                        sx={{ ml: 1 }}
                        color={loc.traffic_zone === 'high' ? 'error' : loc.traffic_zone === 'medium' ? 'warning' : 'success'}
                      />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth margin="normal">
                <InputLabel>End Location</InputLabel>
                <Select
                  value={endLocation}
                  label="End Location"
                  onChange={(e) => setEndLocation(e.target.value)}
                  required
                >
                  {locations.map((loc) => (
                    <MenuItem key={loc.name} value={loc.name}>
                      {loc.name}
                      <Chip 
                        label={loc.type} 
                        size="small" 
                        sx={{ ml: 1 }}
                        color={loc.traffic_zone === 'high' ? 'error' : loc.traffic_zone === 'medium' ? 'warning' : 'success'}
                      />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth margin="normal">
                <InputLabel>Vehicle Type</InputLabel>
                <Select
                  value={vehicleType}
                  label="Vehicle Type"
                  onChange={(e) => setVehicleType(e.target.value)}
                  required
                >
                  <MenuItem value="car">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {vehicleIcons.car} <Box sx={{ ml: 1 }}>Car</Box>
                    </Box>
                  </MenuItem>
                  <MenuItem value="bike">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {vehicleIcons.bike} <Box sx={{ ml: 1 }}>Bike</Box>
                    </Box>
                  </MenuItem>
                  <MenuItem value="walk">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {vehicleIcons.walk} <Box sx={{ ml: 1 }}>Walk</Box>
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth margin="normal">
                <InputLabel>Weather (Optional)</InputLabel>
                <Select
                  value={userWeather}
                  label="Weather (Optional)"
                  onChange={(e) => setUserWeather(e.target.value)}
                >
                  <MenuItem value="">
                    <em>Automatic (Use Current Season)</em>
                  </MenuItem>
                  <MenuItem value="sunny">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {weatherIcons.sunny} <Box sx={{ ml: 1 }}>Sunny</Box>
                    </Box>
                  </MenuItem>
                  <MenuItem value="cloudy">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {weatherIcons.cloudy} <Box sx={{ ml: 1 }}>Cloudy</Box>
                    </Box>
                  </MenuItem>
                  <MenuItem value="rainy">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {weatherIcons.rainy} <Box sx={{ ml: 1 }}>Rainy</Box>
                    </Box>
                  </MenuItem>
                  <MenuItem value="foggy">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {weatherIcons.foggy} <Box sx={{ ml: 1 }}>Foggy</Box>
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3 }}
                startIcon={vehicleIcons[vehicleType]}
              >
                Find Route
              </Button>
            </Box>

            {route && (
              <Box sx={{ mt: 3 }}>
                {/* Weather and Traffic Information */}
                <Paper sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}>
                  <Typography variant="h6" gutterBottom>
                    Conditions
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    {weatherIcons[route.weather?.condition] || <WbSunnyIcon />}
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      Weather: {getWeatherDescription(route.weather)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {trafficIcons[route.traffic] || <CheckCircleIcon />}
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      Traffic: {getTrafficDescription(route.traffic)}
                    </Typography>
                  </Box>
                </Paper>
                
                {/* Route Options */}
                <Typography variant="h6" gutterBottom>
                  Route Options
                </Typography>
                <FormControl component="fieldset" sx={{ width: '100%' }}>
                  <RadioGroup 
                    value={selectedRouteOption} 
                    onChange={handleRouteOptionChange}
                  >
                    {route.route_options.map((option, index) => (
                      <Paper 
                        key={option.option_name} 
                        sx={{ 
                          p: 2, 
                          mb: 1, 
                          border: option.option_name === selectedRouteOption ? 2 : 0,
                          borderColor: 'primary.main'
                        }}
                      >
                        <FormControlLabel 
                          value={option.option_name} 
                          control={<Radio />} 
                          label={
                            <Box>
                              <Typography variant="subtitle1">{option.option_name}</Typography>
                              <Typography variant="body2" color="text.secondary">
                                {option.description}
                              </Typography>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                                <Typography variant="body2">
                                  Distance: {option.distance.toFixed(2)} km
                                </Typography>
                                <Typography variant="body2">
                                  Duration: {option.duration.toFixed(0)} min
                                </Typography>
                              </Box>
                            </Box>
                          } 
                        />
                      </Paper>
                    ))}
                  </RadioGroup>
                </FormControl>
                
                {steps.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Turn-by-Turn Directions
                    </Typography>
                    <Divider sx={{ mb: 1 }} />
                    <List dense>
                      {steps.map((step, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            {getDirectionIcon(step.instruction)}
                          </ListItemIcon>
                          <ListItemText
                            primary={step.instruction.charAt(0).toUpperCase() + step.instruction.slice(1)}
                            secondary={`${formatDistance(step.distance)} · ${formatDuration(step.duration)}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid xs={12} md={8}>
          <Paper elevation={3} sx={{ height: '600px' }}>
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {locations.map((loc) => (
                <Marker
                  key={loc.name}
                  position={[loc.lat, loc.lng]}
                  icon={
                    loc.name === startLocation 
                      ? startIcon 
                      : loc.name === endLocation 
                        ? endIcon 
                        : new L.Icon.Default()
                  }
                >
                  <Popup>
                    <Typography variant="subtitle2">{loc.name}</Typography>
                    <Typography variant="body2">Type: {loc.type}</Typography>
                    <Typography variant="body2">
                      Traffic: {loc.traffic_zone}
                    </Typography>
                    <Typography variant="body2">
                      Parking: {loc.parking ? 'Available' : 'Not available'}
                    </Typography>
                  </Popup>
                </Marker>
              ))}
              {routePaths.length > 0 && route && route.route_options && 
                routePaths.map((path, index) => {
                  // Only show the selected route option
                  const isSelectedOption = route.route_options[index]?.option_name === selectedRouteOption;
                  return isSelectedOption ? (
                    <Polyline
                      key={index}
                      positions={path}
                      color={getPolylineColor(vehicleType, index)}
                      weight={5}
                      opacity={0.8}
                    />
                  ) : null;
                })
              }
            </MapContainer>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default FindRoute; 