import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import Swal from 'sweetalert2';
import { useAuth } from '../contexts/AuthContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    const result = await login(email, password);
    
    if (result.success) {
      Swal.fire({
        icon: 'success',
        title: 'Login Successful',
        text: 'Welcome to Admin Panel',
        timer: 2000,
        confirmButtonColor: '#001f3f'
      });
      navigate('/student-information-form/admin/dashboard');
    } else {
      setError(result.error);
    }
  };

  return (
    <>
      <Helmet>
        <title>Admin Login - Student Information Form</title>
        <meta name="description" content="Admin login page" />
      </Helmet>

      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #001f3f 0%, #003d7a 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4
        }}
      >
        <Container maxWidth="sm">
          <Paper
            elevation={3}
            sx={{
              p: { xs: 4, sm: 6 },
              borderRadius: '16px',
              background: 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  background: 'linear-gradient(135deg, #001f3f 0%, #003d7a 100%)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3,
                  boxShadow: '0 8px 16px rgba(0, 31, 63, 0.3)'
                }}
              >
                <LockIcon sx={{ fontSize: 40, color: 'white' }} />
              </Box>
              <Typography
                variant="h4"
                component="h1"
                sx={{
                  color: '#001f3f',
                  fontWeight: 'bold',
                  mb: 1
                }}
              >
                Admin Login
              </Typography>
              <Typography variant="body2" sx={{ color: '#666' }}>
                University of Chittagong - Student Information System
              </Typography>
            </Box>

            {/* Error Alert */}
            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: '8px' }}>
                {error}
              </Alert>
            )}

            {/* Info Alert */}
            <Alert severity="info" sx={{ mb: 4, borderRadius: '8px' }}>
              <Typography variant="body2" sx={{ fontSize: '13px' }}>
                <strong>Demo Credentials:</strong>
                <br />
                Email: <code>superadmin@cu.ac.bd</code>
                <br />
                Password: <code>super@2026</code>
              </Typography>
            </Alert>

            {/* Login Form */}
            <form onSubmit={handleLogin}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                variant="outlined"
                margin="normal"
                autoFocus
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    '&:hover fieldset': {
                      borderColor: '#003d7a'
                    }
                  }
                }}
              />

              <TextField
                fullWidth
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                variant="outlined"
                margin="normal"
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    '&:hover fieldset': {
                      borderColor: '#003d7a'
                    }
                  }
                }}
              />

              <Button
                fullWidth
                type="submit"
                variant="contained"
                disabled={loading}
                sx={{
                  background: 'linear-gradient(135deg, #001f3f 0%, #003d7a 100%)',
                  py: 1.5,
                  fontSize: '16px',
                  fontWeight: 'bold',
                  borderRadius: '8px',
                  textTransform: 'none',
                  '&:hover': {
                    boxShadow: '0 8px 20px rgba(0, 31, 63, 0.3)'
                  },
                  '&:disabled': {
                    background: '#ccc'
                  }
                }}
              >
                {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Login'}
              </Button>
            </form>

            {/* Footer */}
            <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid #e0e0e0', textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: '#999' }}>
                Only authorized administrators can access this page.
              </Typography>
            </Box>
          </Paper>
        </Container>
      </Box>
    </>
  );
};

export default LoginPage;
