import React from 'react';
import { Box, Container, Typography, Button } from '@mui/material';
import { useLanguage } from '../hooks/useLanguage';

const Header = () => {
  const { language, toggleLanguage } = useLanguage();

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
                src="/BigCircularLogo.jpg" 
                alt="University of Chittagong Logo"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '50%'
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
                Student Information Portal
              </Typography>
            </Box>
          </Box>

          {/* Language Toggle */}
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
        </Box>
      </Container>
    </Box>
  );
};

export default Header;
