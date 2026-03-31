import React from 'react';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import WarningIcon from '@mui/icons-material/Warning';

const MaintenancePage = () => {
  return (
    <Box
      sx={{
        minHeight: '85vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #001f3f 0%, #003d7a 100%)',
        position: 'relative',
        overflow: 'hidden',
        py: 4
      }}
    >
      {/* Animated background circles */}
      <Box
        sx={{
          position: 'absolute',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          top: '-200px',
          right: '-200px',
          pointerEvents: 'none'
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.05)',
          bottom: '-100px',
          left: '-100px',
          pointerEvents: 'none'
        }}
      />

      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 10 }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 4, sm: 6, md: 8 },
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(0, 31, 63, 0.1)',
            borderRadius: '20px',
            boxShadow: '0 20px 60px rgba(0, 31, 63, 0.3)',
            textAlign: 'center'
          }}
        >
          {/* Icon */}
          <Box
            sx={{
              mb: 3,
              display: 'flex',
              justifyContent: 'center'
            }}
          >
            <Box
              sx={{
                background: 'linear-gradient(135deg, #d32f2f 0%, #f57c00 100%)',
                borderRadius: '50%',
                p: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <WarningIcon sx={{ fontSize: '48px', color: 'white' }} />
            </Box>
          </Box>

          {/* Title */}
          <Typography
            variant="h3"
            component="h1"
            sx={{
              color: '#001f3f',
              fontWeight: 'bold',
              mb: 2,
              fontSize: { xs: '28px', sm: '32px', md: '36px' }
            }}
          >
            Under Maintenance
          </Typography>

          {/* Message */}
          <Typography
            variant="h6"
            sx={{
              color: '#666',
              fontWeight: '500',
              mb: 2,
              lineHeight: 1.6
            }}
          >
            We're currently performing scheduled maintenance on our system.
          </Typography>

          {/* Description */}
          <Typography
            variant="body1"
            sx={{
              color: '#999',
              lineHeight: 1.8,
              mb: 4
            }}
          >
            The form is temporarily unavailable. We're working to restore service as quickly as possible.
          </Typography>

          {/* Info Box */}
          <Box
            sx={{
              background: '#f5f5f5',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              p: 3,
              mb: 3
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: '#666',
                lineHeight: 1.8
              }}
            >
              <strong>What's happening?</strong>
              <br />
              We're upgrading and improving our system to serve you better. Please check back shortly.
            </Typography>
          </Box>

          {/* Footer message */}
          <Typography
            variant="caption"
            sx={{
              color: '#aaa'
            }}
          >
            If you have any questions, please contact the administrator.
          </Typography>
          {/* Add ICT Cell, University of Chittagong */}
            <Typography sx={{ color: '#949494', mt: 5, fontWeight: 'bold' }}>
                ICT Cell, University of Chittagong
            </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default MaintenancePage;
