import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const History = () => {
  const [routes, setRoutes] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { isAuthenticated, api } = useAuth();

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        if (!isAuthenticated) {
          navigate('/login');
          return;
        }

        const response = await api.get('/routes/history');
        console.log('Route history response:', response.data);
        setRoutes(response.data);
      } catch (err) {
        console.error('History fetch error:', err);
        if (err.response?.status === 401) {
          navigate('/login');
        } else {
          setError('Failed to load route history');
        }
      }
    };
    fetchRoutes();
  }, [navigate, isAuthenticated, api]);

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Route History
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>From</TableCell>
                <TableCell>To</TableCell>
                <TableCell>Vehicle</TableCell>
                <TableCell>Distance (km)</TableCell>
                <TableCell>Duration (min)</TableCell>
                <TableCell>Weather</TableCell>
                <TableCell>Traffic</TableCell>
                <TableCell>Route Option</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {routes.map((route) => (
                <TableRow key={route.id}>
                  <TableCell>
                    {new Date(route.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{route.start_location}</TableCell>
                  <TableCell>{route.end_location}</TableCell>
                  <TableCell>{route.vehicle_type}</TableCell>
                  <TableCell>{route.distance.toFixed(2)}</TableCell>
                  <TableCell>{route.duration.toFixed(0)}</TableCell>
                  <TableCell>{route.weather_condition || 'N/A'}</TableCell>
                  <TableCell>{route.traffic_condition || 'N/A'}</TableCell>
                  <TableCell>{route.route_option || 'N/A'}</TableCell>
                </TableRow>
              ))}
              {routes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    No routes found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
};

export default History; 