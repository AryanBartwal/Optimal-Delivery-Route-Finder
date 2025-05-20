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

function formatDateTime(dt) {
  if (!dt) return '';
  const d = new Date(dt);
  // Add 5 hours 30 minutes (330 minutes) to convert UTC to IST
  const ist = new Date(d.getTime() + 330 * 60000);
  return ist.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false
  });
}

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
        // Fetch both DB and JSON history
        const [dbRes, jsonRes] = await Promise.all([
          api.get('/routes/history').catch(() => ({ data: [] })),
          api.get('/user/history').catch(() => ({ data: [] })),
        ]);
        // Mark type for display
        const dbRoutes = (dbRes.data || []).map(r => ({ ...r, _source: 'db' }));
        const jsonRoutes = (jsonRes.data || []).map(r => ({ ...r, _source: 'json' }));
        setRoutes([...dbRoutes, ...jsonRoutes].sort((a, b) => new Date(b.created_at || b.timestamp) - new Date(a.created_at || a.timestamp)));
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
                <TableCell>Type</TableCell>
                <TableCell>From</TableCell>
                <TableCell>To / Stops</TableCell>
                <TableCell>Vehicle</TableCell>
                <TableCell>Distance (km)</TableCell>
                <TableCell>Duration (min)</TableCell>
                <TableCell>Weather</TableCell>
                <TableCell>Traffic</TableCell>
                <TableCell>Route Option</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {routes.map((route, idx) => (
                <TableRow key={route.id || route.timestamp || idx}>
                  <TableCell>{formatDateTime(route.created_at || route.timestamp)}</TableCell>
                  <TableCell>{route.type ? route.type.replace('multi-stop-', '').replace('-', ' ') : 'single'}</TableCell>
                  <TableCell>{route.start_location || (route.stops && route.stops[0]) || ''}</TableCell>
                  <TableCell>
                    {/* For multi-stop, show all stops; for single, show end location */}
                    {route.stops && route.stops.length > 1
                      ? route.stops.join(' → ')
                      : (route.end_location || '')}
                    {/* For Floyd/Direct, show order if present */}
                    {route.order && Array.isArray(route.order) && route.order.length > 1 && (
                      <div style={{ fontSize: 12, color: '#888' }}>
                        Order: {route.order.join(' → ')}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{route.vehicle_type || 'N/A'}</TableCell>
                  <TableCell>{route.distance ? Number(route.distance).toFixed(2) : 'N/A'}</TableCell>
                  <TableCell>{route.duration ? Number(route.duration).toFixed(0) : 'N/A'}</TableCell>
                  <TableCell>{route.weather_condition || 'N/A'}</TableCell>
                  <TableCell>{route.traffic_condition || 'N/A'}</TableCell>
                  <TableCell>{route.route_option || (route.type ? route.type.replace('multi-stop-', '').replace('-', ' ') : 'N/A')}</TableCell>
                </TableRow>
              ))}
              {routes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} align="center">
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