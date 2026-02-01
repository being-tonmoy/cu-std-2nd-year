import { BrowserRouter as Router, Routes, Route, } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Box from '@mui/material/Box';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import BackgroundDesign from './components/BackgroundDesign';
import PublicRoutes from './routes/PublicRoutes';
import AdminRoutes from './routes/AdminRoutes';
import NotFound from './pages/NotFound';
import './App.css';
// Component to initialize superadmin user
function AppRoutes() {
  // const { isAuthenticated } = useAuth();

  return (
    <Box sx={{ minHeight: '100vh', position: 'relative' }}>
      <BackgroundDesign />
      <Header />
      <Box sx={{ position: 'relative', zIndex: 10 }}>
        <Routes>
          {PublicRoutes}
          {AdminRoutes}
          {/* Catch-all route for 404 */}
          <Route path="*" element={<NotFound />} />
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
            <AppRoutes />
          </Router>
        </AuthProvider>
      </LanguageProvider>
    </HelmetProvider>
  );
}

export default App;
