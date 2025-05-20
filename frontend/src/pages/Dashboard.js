import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Divider,
  Stack,
  Avatar,
  useTheme,
  alpha,
} from '@mui/material';
import {
  DirectionsRun,
  Timeline,
  Star,
  Navigation,
  Route,
  DirectionsCar,
  Schedule,
  Place,
  ArrowForward,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import axios from 'axios';

const StatCard = ({ icon, title, value, color, subtitle }) => {
  const theme = useTheme();
  
  return (
    <Card sx={{ 
      height: '100%', 
      position: 'relative',
      overflow: 'hidden',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        right: 0,
        width: '90px',
        height: '90px',
        background: alpha(color, 0.08),
        borderRadius: '0 0 0 100%',
        zIndex: 0
      }
    }}>
      <CardContent sx={{ position: 'relative', zIndex: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar
            sx={{
              bgcolor: alpha(color, 0.1),
              color: color,
              width: 48,
              height: 48,
            }}
          >
        {icon}
          </Avatar>
          <Typography variant="h6" sx={{ ml: 2, color: theme.palette.text.primary, fontWeight: 600 }}>
          {title}
        </Typography>
      </Box>
        <Typography variant="h4" color={color} sx={{ fontWeight: 700, mb: 0.5 }}>
        {value}
      </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
    </CardContent>
  </Card>
);
};

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalRoutes: 0,
    favoriteLocation: '',
    lastRoute: null,
  });
  const [, setError] = useState('');
  const theme = useTheme();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get('http://localhost:8000/routes/history', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        
        const routes = response.data;
        const locationCounts = routes.reduce((acc, route) => {
          acc[route.start_location] = (acc[route.start_location] || 0) + 1;
          acc[route.end_location] = (acc[route.end_location] || 0) + 1;
          return acc;
        }, {});

        const favoriteLocation = Object.entries(locationCounts)
          .sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A';

        setStats({
          totalRoutes: routes.length,
          favoriteLocation,
          lastRoute: routes[0],
        });
      } catch (err) {
        setError('Failed to load dashboard data');
      }
    };
    fetchStats();
  }, []);

  return (
    <>
      {/* Hero Section */}
      <Box
        sx={{
          background: `linear-gradient(to right, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
          color: 'white',
          pt: 8,
          pb: 7,
          mb: 6,
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={7}>
              <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          Welcome to Dehradun Route Finder
        </Typography>
              <Typography variant="h6" paragraph sx={{ opacity: 0.9, mb: 3 }}>
                Discover the most optimal paths across Dehradun city with real-time weather and traffic updates.
              </Typography>
              <Button
                variant="contained"
                color="secondary"
                size="large"
                component={RouterLink}
                to="/find-route"
                endIcon={<ArrowForward />}
                sx={{
                  px: 4,
                  py: 1.5,
                  fontSize: '1rem',
                  borderRadius: '30px',
                  boxShadow: '0 8px 20px rgba(0, 0, 0, 0.2)',
                }}
              >
                Find a Route
              </Button>
            </Grid>
            <Grid item xs={12} md={5} sx={{ display: { xs: 'none', md: 'block' } }}>
              <Box
                sx={{
                  position: 'relative',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    top: 0,
                    left: 0,
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    transform: 'rotate(-3deg)',
                    zIndex: 0,
                  }
                }}
              >
                <Paper
                  elevation={4}
                  sx={{
                    position: 'relative',
                    zIndex: 1,
                    p: 3,
                    borderRadius: '8px',
                    bgcolor: 'background.paper',
                    color: 'text.primary',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Route sx={{ mr: 1, color: theme.palette.primary.main }} />
                    <Typography variant="h6" fontWeight={600}>
                      Popular Routes
        </Typography>
                  </Box>
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Place sx={{ mr: 1, color: theme.palette.success.main }} />
                      <Typography variant="body1">Clock Tower</Typography>
                      <ArrowForward sx={{ mx: 1, fontSize: '1rem' }} />
                      <Typography variant="body1">Forest Research Institute</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Place sx={{ mr: 1, color: theme.palette.success.main }} />
                      <Typography variant="body1">Rajpur Road</Typography>
                      <ArrowForward sx={{ mx: 1, fontSize: '1rem' }} />
                      <Typography variant="body1">ISBT Dehradun</Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ mb: 6 }}>
      <Grid container spacing={3}>
        {/* Stats Cards */}
          <Grid item xs={12} sm={6} md={4}>
          <StatCard
              icon={<Timeline />}
            title="Total Routes"
            value={stats.totalRoutes}
              color={theme.palette.primary.main}
              subtitle="Routes you've searched"
          />
        </Grid>
          <Grid item xs={12} sm={6} md={4}>
          <StatCard
              icon={<Star />}
            title="Favorite Location"
            value={stats.favoriteLocation}
              color={theme.palette.secondary.main}
              subtitle="Your most visited place"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard
              icon={<Navigation />}
              title="Weather-Aware"
              value="Enabled"
              color="#00b0ff"
              subtitle="Routes adapt to weather"
          />
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
            <Paper sx={{ p: 4, borderRadius: 2 }}>
              <Typography variant="h5" gutterBottom fontWeight={600}>
              Quick Actions
            </Typography>
              <Divider sx={{ my: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
              <Button
                    fullWidth
                variant="contained"
                component={RouterLink}
                to="/find-route"
                startIcon={<DirectionsRun />}
                    sx={{ 
                      py: 1.5, 
                      borderRadius: 2,
                      bgcolor: theme.palette.primary.main
                    }}
              >
                Find New Route
              </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
              <Button
                    fullWidth
                variant="outlined"
                component={RouterLink}
                to="/history"
                startIcon={<Timeline />}
                    sx={{ 
                      py: 1.5, 
                      borderRadius: 2, 
                      borderWidth: 2
                    }}
              >
                View History
              </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Button
                    fullWidth
                    variant="outlined"
                    component={RouterLink}
                    to="/about"
                    startIcon={<Star />}
                    sx={{ 
                      py: 1.5, 
                      borderRadius: 2,
                      borderWidth: 2, 
                      color: theme.palette.secondary.main,
                      borderColor: theme.palette.secondary.main,
                      '&:hover': {
                        borderColor: theme.palette.secondary.dark,
                        backgroundColor: alpha(theme.palette.secondary.main, 0.04),
                      }
                    }}
                  >
                    About Dehradun
                  </Button>
                </Grid>
              </Grid>
          </Paper>
        </Grid>

        {/* Last Route */}
        {stats.lastRoute && (
          <Grid item xs={12}>
              <Paper sx={{ p: 4, borderRadius: 2 }}>
                <Typography variant="h5" gutterBottom fontWeight={600}>
                Last Route
              </Typography>
                <Divider sx={{ my: 2 }} />
                <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), color: theme.palette.success.main, mr: 2 }}>
                          <Place />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary">From</Typography>
                          <Typography variant="h6">{stats.lastRoute.start_location}</Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ bgcolor: alpha(theme.palette.error.main, 0.1), color: theme.palette.error.main, mr: 2 }}>
                          <Place />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary">To</Typography>
                          <Typography variant="h6">{stats.lastRoute.end_location}</Typography>
                        </Box>
                      </Box>
                    </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main, mr: 2 }}>
                          <DirectionsCar />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary">Vehicle</Typography>
                          <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>{stats.lastRoute.vehicle_type}</Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ bgcolor: alpha(theme.palette.info.main, 0.1), color: theme.palette.info.main, mr: 2 }}>
                          <Schedule />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary">Route Details</Typography>
                          <Typography variant="h6">{stats.lastRoute.distance.toFixed(2)} km • {stats.lastRoute.duration.toFixed(0)} min</Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sx={{ mt: 1 }}>
                    <Button 
                      variant="contained" 
                      color="primary"
                      component={RouterLink}
                      to="/find-route"
                      sx={{ borderRadius: 2 }}
                    >
                      Re-Search This Route
                    </Button>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Container>
    </>
  );
};

export default Dashboard; 