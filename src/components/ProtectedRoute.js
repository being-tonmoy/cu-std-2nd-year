import React from 'react';
import { Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ 
  children, 
  requiredRole = 'admin' // 'admin' or 'superadmin'
}) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/student-information-form/login" replace />;
  }

  if (requiredRole === 'superadmin' && user?.role !== 'superadmin') {
    return <Navigate to="/student-information-form/admin/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
