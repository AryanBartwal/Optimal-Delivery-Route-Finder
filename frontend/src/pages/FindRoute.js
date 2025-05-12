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
          <Paper 
            elevation={2} 
            sx={{ 
              p: 3, 
              borderRadius: 3,
              height: '100%'
            }}
          >
            <Typography variant="h6" gutterBottom fontWeight="600" sx={{ mb: 3 }}>
              Route Settings
            </Typography>
            
            <form onSubmit={handleSubmit}>
              <Stack spacing={3}>
                <FormControl fullWidth>
                  <InputLabel id="start-location-label">Start Location</InputLabel>
                  <Select
                    labelId="start-location-label"
                    value={startLocation}
                    onChange={(e) => setStartLocation(e.target.value)}
                    label="Start Location"
                    required
                    sx={{ borderRadius: 2 }}
                  >
                    {locations.map((location) => (
                      <MenuItem key={location.name} value={location.name}>
                        {location.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel id="end-location-label">End Location</InputLabel>
                  <Select
                    labelId="end-location-label"
                    value={endLocation}
                    onChange={(e) => setEndLocation(e.target.value)}
                    label="End Location"
                    required
                    sx={{ borderRadius: 2 }}
                  >
                    {locations.map((location) => (
                      <MenuItem key={location.name} value={location.name}>
                        {location.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel id="vehicle-type-label">Vehicle Type</InputLabel>
                  <Select
                    labelId="vehicle-type-label"
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    label="Vehicle Type"
                    required
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="car">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <DirectionsCarIcon sx={{ mr: 1, color: 'primary.main' }} />
                        Car
                      </Box>
                    </MenuItem>
                    <MenuItem value="bike">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <DirectionsBikeIcon sx={{ mr: 1, color: 'success.main' }} />
                        Bike
                      </Box>
                    </MenuItem>
                    <MenuItem value="walk">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <DirectionsWalkIcon sx={{ mr: 1, color: 'warning.main' }} />
                        Walk
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel id="weather-label">Custom Weather (Optional)</InputLabel>
                  <Select
                    labelId="weather-label"
                    value={userWeather}
                    onChange={(e) => setUserWeather(e.target.value)}
                    label="Custom Weather (Optional)"
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="">
                      <em>Use current weather</em>
                    </MenuItem>
                    <MenuItem value="sunny">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {weatherIcons.sunny}
                        <Typography sx={{ ml: 1 }}>Sunny</Typography>
                      </Box>
                    </MenuItem>
                    <MenuItem value="cloudy">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {weatherIcons.cloudy}
                        <Typography sx={{ ml: 1 }}>Cloudy</Typography>
                      </Box>
                    </MenuItem>
                    <MenuItem value="rainy">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {weatherIcons.rainy}
                        <Typography sx={{ ml: 1 }}>Rainy</Typography>
                      </Box>
                    </MenuItem>
                    <MenuItem value="snowy">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {weatherIcons.snowy}
                        <Typography sx={{ ml: 1 }}>Snowy</Typography>
                      </Box>
                    </MenuItem>
                    <MenuItem value="foggy">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {weatherIcons.foggy}
                        <Typography sx={{ ml: 1 }}>Foggy</Typography>
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>

                <Button 
                  type="submit" 
                  variant="contained" 
                  color="primary" 
                  size="large"
                  startIcon={<DirectionsCarIcon />}
                  disabled={!startLocation || !endLocation}
                  sx={{ 
                    mt: 2, 
                    py: 1.5, 
                    borderRadius: 2,
                    boxShadow: '0 4px 12px rgba(63, 81, 181, 0.2)'
                  }}
                >
                  Find Route
                </Button>
              </Stack>
            </form>
            
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
              
              {route && (
                <>
                  {/* Start Marker */}
                  <Marker position={[route.start.lat, route.start.lng]} icon={startIcon}>
                    <Popup>
                      Start: {route.start.name}
                    </Popup>
                  </Marker>
                  
                  {/* End Marker */}
                  <Marker position={[route.end.lat, route.end.lng]} icon={endIcon}>
                    <Popup>
                      End: {route.end.name}
                    </Popup>
                  </Marker>
                  
                  {/* Route Paths */}
                  {routePaths.map((path, index) => (
                    <Polyline
                      key={index}
                      positions={path.path}
                      color={path.color}
                      weight={5}
                      opacity={path.selected ? 1 : 0.6}
                    />
                  ))}
                </>
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
            </Paper>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default FindRoute; 