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
} from '@mui/material';
import {
  DirectionsRun,
  Timeline,
  Star,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import axios from 'axios';

const StatCard = ({ icon, title, value, color }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        {icon}
        <Typography variant="h6" sx={{ ml: 1 }}>
          {title}
        </Typography>
      </Box>
      <Typography variant="h4" color={color}>
        {value}
      </Typography>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalRoutes: 0,
    favoriteLocation: '',
    lastRoute: null,
  });
  const [, setError] = useState('');

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
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Welcome to Dehradun Route Finder
        </Typography>
        <Typography color="text.secondary">
          Find the best routes across Dehradun city
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<Timeline sx={{ color: 'primary.main', fontSize: 40 }} />}
            title="Total Routes"
            value={stats.totalRoutes}
            color="primary.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<Star sx={{ color: 'secondary.main', fontSize: 40 }} />}
            title="Favorite Location"
            value={stats.favoriteLocation}
            color="secondary.main"
          />
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                component={RouterLink}
                to="/find-route"
                startIcon={<DirectionsRun />}
              >
                Find New Route
              </Button>
              <Button
                variant="outlined"
                component={RouterLink}
                to="/history"
                startIcon={<Timeline />}
              >
                View History
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Last Route */}
        {stats.lastRoute && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Last Route
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body1">
                    From: {stats.lastRoute.start_location}
                  </Typography>
                  <Typography variant="body1">
                    To: {stats.lastRoute.end_location}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body1">
                    Distance: {stats.lastRoute.distance.toFixed(2)} km
                  </Typography>
                  <Typography variant="body1">
                    Duration: {stats.lastRoute.duration.toFixed(0)} minutes
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Container>
  );
};

export default Dashboard; 