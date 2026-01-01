import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Box } from '@mui/material';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Header from './components/Header';
import BackgroundDesign from './components/BackgroundDesign';
import ProtectedRoute from './components/ProtectedRoute';
import FormPage from './pages/FormPage';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/student-information-form/admin/AdminDashboard';
import UserManagement from './pages/student-information-form/admin/UserManagement';
import SubmissionManagement from './pages/student-information-form/admin/SubmissionManagement';
import AdminSetup from './pages/student-information-form/admin/AdminSetup';
import { createAdminUser, getUserByEmail } from './services/firestoreService';
import './App.css';

// Component to initialize superadmin user
const InitializeAdmin = () => {
  useEffect(() => {
    initializeSuperAdmin();
  }, []);

  const initializeSuperAdmin = async () => {
    try {
      const superAdminExists = await getUserByEmail('superadmin@cu.ac.bd');
      if (!superAdminExists) {
        await createAdminUser({
          email: 'superadmin@cu.ac.bd',
          password: 'super@2026',
          name: 'Super Administrator',
          role: 'superadmin'
        });
        console.log('SuperAdmin user created');
      }
    } catch (error) {
      console.log('SuperAdmin already exists or initialization skipped');
    }
  };

  return null;
};

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Box sx={{ minHeight: '100vh', position: 'relative' }}>
      <BackgroundDesign />
      {isAuthenticated && <Header />}
      <Box sx={{ position: 'relative', zIndex: 10 }}>
        <Routes>
          {/* Public Routes */}
          <Route path="/student-information-form/login" element={<LoginPage />} />
          <Route path="/student-information-form" element={<FormPage />} />
          
          {/* Admin Routes (Protected) */}
          <Route
            path="/student-information-form/admin/dashboard"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student-information-form/admin/setup"
            element={
              <ProtectedRoute requiredRole="superadmin">
                <AdminSetup />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student-information-form/admin/users"
            element={
              <ProtectedRoute requiredRole="superadmin">
                <UserManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student-information-form/admin/submissions"
            element={
              <ProtectedRoute requiredRole="admin">
                <SubmissionManagement />
              </ProtectedRoute>
            }
          />

          {/* Redirect unknown routes */}
          <Route path="*" element={<Navigate to="/student-information-form" replace />} />
        </Routes>
      </Box>
    </Box>
  );
}

function App() {
  return (
    <HelmetProvider>
      <LanguageProvider>
        <AuthProvider>
          <Router>
            <InitializeAdmin />
            <AppRoutes />
          </Router>
        </AuthProvider>
      </LanguageProvider>
    </HelmetProvider>
  );
}

export default App;
