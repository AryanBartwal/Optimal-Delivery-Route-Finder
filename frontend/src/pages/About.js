import React from 'react';
import {
  Container,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  DirectionsCar,
  DirectionsBike,
  DirectionsWalk,
  Place,
  History,
  Info,
} from '@mui/icons-material';

const About = () => {
  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          About Dehradun Route Finder
        </Typography>
        
        <Typography paragraph>
          Welcome to the Dehradun Route Finder! This application helps you find optimal routes
          between different locations in Dehradun city. Whether you're traveling by car, bike,
          or on foot, we'll help you find the best path to your destination.
        </Typography>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h5" gutterBottom>
          How to Use
        </Typography>

        <List>
          <ListItem>
            <ListItemIcon>
              <Place />
            </ListItemIcon>
            <ListItemText
              primary="Select Locations"
              secondary="Choose your starting point and destination from the dropdown menus in the Find Route section."
            />
          </ListItem>

          <ListItem>
            <ListItemIcon>
              <DirectionsCar />
            </ListItemIcon>
            <ListItemText
              primary="Choose Vehicle"
              secondary="Select your preferred mode of transportation: car, bike, or walking."
            />
          </ListItem>

          <ListItem>
            <ListItemIcon>
              <Info />
            </ListItemIcon>
            <ListItemText
              primary="View Route Details"
              secondary="After clicking 'Find Route', you'll see the route displayed on the map along with distance and estimated duration."
            />
          </ListItem>

          <ListItem>
            <ListItemIcon>
              <History />
            </ListItemIcon>
            <ListItemText
              primary="Check History"
              secondary="View your past routes in the History section to track your previous journeys."
            />
          </ListItem>
        </List>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h5" gutterBottom>
          Available Transportation Modes
        </Typography>

        <List>
          <ListItem>
            <ListItemIcon>
              <DirectionsCar />
            </ListItemIcon>
            <ListItemText
              primary="Car"
              secondary="Best for longer distances and when carrying luggage."
            />
          </ListItem>

          <ListItem>
            <ListItemIcon>
              <DirectionsBike />
            </ListItemIcon>
            <ListItemText
              primary="Bike"
              secondary="Perfect for avoiding traffic in congested areas."
            />
          </ListItem>

          <ListItem>
            <ListItemIcon>
              <DirectionsWalk />
            </ListItemIcon>
            <ListItemText
              primary="Walking"
              secondary="Ideal for short distances and exploring the city."
            />
          </ListItem>
        </List>

        <Divider sx={{ my: 3 }} />

        <Typography variant="body2" color="text.secondary" align="center">
          This application uses OpenStreetMap data to provide accurate routing information
          for Dehradun city. For the best experience, please ensure you have a stable
          internet connection.
        </Typography>
      </Paper>
    </Container>
  );
};

export default About; 