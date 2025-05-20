import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Paper, Typography, Button, Box, Fade, Stack } from '@mui/material';
import DeliveryDiningIcon from '@mui/icons-material/DeliveryDining';
import MapIcon from '@mui/icons-material/Map';
import PlaceIcon from '@mui/icons-material/Place';
import RouteIcon from '@mui/icons-material/Route';

const features = [
  { icon: <MapIcon sx={{ fontSize: 32, color: '#fff' }} />, text: 'Live Dehradun Map' },
  { icon: <PlaceIcon sx={{ fontSize: 32, color: '#fff' }} />, text: 'Landmark-based Stops' },
  { icon: <RouteIcon sx={{ fontSize: 32, color: '#fff' }} />, text: 'Multi-stop Route Optimization' },
  { icon: <DeliveryDiningIcon sx={{ fontSize: 32, color: '#fff' }} />, text: 'For Delivery, Logistics & More' },
];

const Landing = () => {
  const navigate = useNavigate();
  return (
    <Box sx={{
      minHeight: '100vh',
      background: `linear-gradient(120deg, #3f51b5 0%, #7986cb 100%), url('https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <Fade in timeout={1200}>
        <Paper elevation={8} sx={{
          p: { xs: 3, sm: 5 },
          borderRadius: 5,
          textAlign: 'center',
          background: 'rgba(63,81,181,0.92)',
          color: 'white',
          minWidth: { xs: '90vw', sm: 500 },
          maxWidth: 600,
          boxShadow: '0 8px 32px 0 rgba(31,38,135,0.37)',
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <DeliveryDiningIcon sx={{ fontSize: 70, color: 'white', animation: 'bounce 2s infinite' }} />
          </Box>
          <Typography variant="h2" fontWeight={800} gutterBottom sx={{ letterSpacing: 1, fontFamily: 'Poppins, sans-serif' }}>
            Optimal Delivery Route Finder
          </Typography>
          <Typography variant="h5" sx={{ mb: 2, opacity: 0.95, fontWeight: 400 }}>
            The smartest way to plan and optimize your delivery routes in Dehradun.
          </Typography>
          <Typography variant="subtitle1" sx={{ mb: 4, opacity: 0.85 }}>
            Fast, reliable, and landmark-based multi-stop navigation for couriers, businesses, and anyone on the move.
          </Typography>
          <Stack direction="row" spacing={3} justifyContent="center" sx={{ mb: 4 }}>
            <Button variant="contained" color="secondary" size="large" sx={{ borderRadius: 3, px: 5, fontWeight: 700, fontSize: '1.1rem', boxShadow: 3 }} onClick={() => navigate('/login')}>
              Sign In
            </Button>
            <Button variant="outlined" color="inherit" size="large" sx={{ borderRadius: 3, px: 5, fontWeight: 700, fontSize: '1.1rem', borderColor: 'white', color: 'white', '&:hover': { background: 'rgba(255,255,255,0.1)' } }} onClick={() => navigate('/register')}>
              Sign Up
            </Button>
          </Stack>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, flexWrap: 'wrap', mb: 2 }}>
            {features.map((f, i) => (
              <Box key={i} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mx: 1 }}>
                {f.icon}
                <Typography variant="body2" sx={{ color: 'white', mt: 1, fontWeight: 500 }}>{f.text}</Typography>
              </Box>
            ))}
          </Box>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', mt: 2, fontSize: 14 }}>
            &copy; {new Date().getFullYear()} Dehradun Optimal Delivery Route Finder
          </Typography>
        </Paper>
      </Fade>
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
      `}</style>
    </Box>
  );
};

export default Landing;
