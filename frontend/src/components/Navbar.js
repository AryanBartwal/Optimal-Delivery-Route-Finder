import React, { useState } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  IconButton,
  Menu,
  MenuItem,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ExploreIcon from '@mui/icons-material/Explore';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleClose();
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <AppBar 
      position="sticky" 
      elevation={0}
      sx={{
        background: 'linear-gradient(45deg, #3f51b5 30%, #7986cb 90%)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
      }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ py: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <ExploreIcon sx={{ mr: 1, fontSize: 28 }} />
            <Typography
              variant="h6"
              component={RouterLink}
              to="/"
              sx={{
                textDecoration: 'none',
                color: 'inherit',
                fontWeight: 700,
                letterSpacing: '0.5px',
              }}
            >
              Dehradun Route Finder
            </Typography>
          </Box>

          {isMobile ? (
            <Box>
              <IconButton
                size="large"
                edge="end"
                color="inherit"
                aria-label="menu"
                onClick={handleMenu}
              >
                <MenuIcon />
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
              >
                {isAuthenticated ? (
                  [
                    <MenuItem key="dashboard" component={RouterLink} to="/" onClick={handleClose}>
                      Dashboard
                    </MenuItem>,
                    <MenuItem key="findroute" component={RouterLink} to="/find-route" onClick={handleClose}>
                      Find Route
                    </MenuItem>,
                    <MenuItem key="history" component={RouterLink} to="/history" onClick={handleClose}>
                      History
                    </MenuItem>,
                    <MenuItem key="about" component={RouterLink} to="/about" onClick={handleClose}>
                      About
                    </MenuItem>,
                    <MenuItem key="logout" onClick={handleLogout}>
                      Logout
                    </MenuItem>
                  ]
                ) : (
                  [
                    <MenuItem key="login" component={RouterLink} to="/login" onClick={handleClose}>
                      Login
                    </MenuItem>,
                    <MenuItem key="register" component={RouterLink} to="/register" onClick={handleClose}>
                      Register
                    </MenuItem>,
                    <MenuItem key="about" component={RouterLink} to="/about" onClick={handleClose}>
                      About
                    </MenuItem>
                  ]
                )}
              </Menu>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', gap: 1 }}>
              {isAuthenticated ? (
                <>
                  <Button
                    color="inherit"
                    component={RouterLink}
                    to="/"
                    sx={{
                      px: 2,
                      borderRadius: '20px',
                      bgcolor: isActive('/') ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                      '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.25)' }
                    }}
                  >
                    Dashboard
                  </Button>
                  <Button
                    color="inherit"
                    component={RouterLink}
                    to="/find-route"
                    sx={{
                      px: 2,
                      borderRadius: '20px',
                      bgcolor: isActive('/find-route') ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                      '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.25)' }
                    }}
                  >
                    Find Route
                  </Button>
                  <Button
                    color="inherit"
                    component={RouterLink}
                    to="/history"
                    sx={{
                      px: 2,
                      borderRadius: '20px',
                      bgcolor: isActive('/history') ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                      '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.25)' }
                    }}
                  >
                    History
                  </Button>
                  <Button
                    color="inherit"
                    variant="outlined"
                    onClick={handleLogout}
                    sx={{
                      ml: 1,
                      px: 2,
                      borderRadius: '20px',
                      border: '1px solid rgba(255, 255, 255, 0.5)',
                      '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)', borderColor: 'white' }
                    }}
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    color="inherit"
                    component={RouterLink}
                    to="/login"
                    sx={{
                      px: 2,
                      borderRadius: '20px',
                      bgcolor: isActive('/login') ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                      '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.25)' }
                    }}
                  >
                    Login
                  </Button>
                  <Button
                    color="inherit"
                    component={RouterLink}
                    to="/register"
                    sx={{
                      px: 2,
                      borderRadius: '20px',
                      bgcolor: isActive('/register') ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                      '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.25)' }
                    }}
                  >
                    Register
                  </Button>
                </>
              )}
              <Button
                color="inherit"
                component={RouterLink}
                to="/about"
                sx={{
                  px: 2,
                  borderRadius: '20px',
                  bgcolor: isActive('/about') ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.25)' }
                }}
              >
                About
              </Button>
            </Box>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar; 