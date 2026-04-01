// import React, { useEffect } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { useLocation } from 'react-router-dom';
// import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';
// import { useAuth } from '../contexts/AuthContext';

const Header = () => {
  const { language, toggleLanguage } = useLanguage();
  // const { logout, isAuthenticated } = useAuth();
  // const navigate = useNavigate();
  const location = useLocation();

  // Handle logout
  // const handleLogout = () => {
  //   logout();
  //   navigate('/admin/login');
  // };

  // Hide header only on login page
  const isLoginPage = location.pathname === '/admin/login';
  if (isLoginPage) {
    return null;
  }

  return (
    <Box 
      className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 text-white py-6 shadow-lg relative overflow-hidden"
      sx={{
        background: 'linear-gradient(135deg, #001f3f 0%, #003d7a 50%, #001f3f 100%)',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          right: 0,
          width: '300px',
          height: '300px',
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '50%',
          transform: 'translate(50%, -50%)',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '200px',
          height: '200px',
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: '50%',
          transform: 'translate(-50%, 50%)',
        }
      }}
    >
      <Container maxWidth="lg">
        <Box className="flex items-center justify-between gap-4 relative z-10">
          {/* Logo and Title Section */}
          <Box className="flex items-center gap-4">
            {/* University Logo Image */}
            <Box 
              className="bg-white rounded-full p-1 flex-shrink-0"
              sx={{
                width: '70px',
                height: '70px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}
            >
              <img 
                src={`${process.env.PUBLIC_URL}/BigCircularLogo.jpg`}
                alt="University of Chittagong Logo"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '50%'
                }}
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="50" fill="%23001f3f"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="white" font-size="40" font-weight="bold"%3EUC%3C/text%3E%3C/svg%3E';
                }}
              />
            </Box>

            {/* Title */}
            <Box>
              <Typography 
                variant="h5" 
                component="h1" 
                className="font-bold"
                sx={{
                  fontSize: { xs: '16px', sm: '18px', md: '20px' },
                  lineHeight: '1.2'
                }}
              >
                University of Chittagong
              </Typography>
              <Typography 
                variant="subtitle2" 
                className="text-blue-100"
                sx={{
                  fontSize: { xs: '12px', sm: '13px', md: '14px' }
                }}
              >
                Institutional Email Application Form
              </Typography>
            </Box>
          </Box>

          {/* Language Toggle and Logout */}
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Button 
              variant="outlined" 
              onClick={toggleLanguage}
              sx={{
                borderColor: 'rgba(255, 255, 255, 0.5)',
                color: 'white',
                '&:hover': {
                  borderColor: 'white',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                },
                fontSize: { xs: '12px', sm: '14px' },
                padding: { xs: '6px 12px', sm: '8px 16px' }
              }}
            >
              {language === 'en' ? '🇧🇩 বাংলা' : '🇬🇧 English'}
            </Button>
            {/* {isAuthenticated && (
              <Button 
                variant="contained" 
                onClick={handleLogout}
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.3)'
                  },
                  fontSize: { xs: '12px', sm: '14px' },
                  padding: { xs: '6px 12px', sm: '8px 16px' }
                }}
              >
                Logout
              </Button>
            )} */}
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Header;
