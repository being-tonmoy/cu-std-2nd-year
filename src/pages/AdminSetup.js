import React, { useState, useEffect } from 'react';
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
import LogoutIcon from '@mui/icons-material/Logout';
import DownloadIcon from '@mui/icons-material/Download';
import Swal from 'sweetalert2';
import { saveFacultyData, getFacultyData } from '../services/firestoreService';
import { useAuth } from '../contexts/AuthContext';

// Sample faculty data
const SAMPLE_FACULTY_DATA = `Faculty of Arts and Humanities (fah):
    Bangla
    English
    History
    Philosophy
    Islamic History and Culture
    Arabic
    Islamic Studies
    Dramatics
    Institute of Modern Languages
    Institute of Fine Arts
    Persian Language & Literature
    Pali
    Sanskrit
    Music
    Bangladesh Studies

Faculty of Science (fsc):
    Physics
    Chemistry
    Mathematics
    Statistics
    Applied Chemistry and Chemical Engineering
    Forestry and Environmental Sciences
    JNIRCMPS

Faculty of Business Administration (fba):
    Accounting
    Management
    Finance
    Marketing
    Human Resource Management
    Banking and Insurance

Faculty of Social Sciences (fss):
    Economics
    Political Science
    Sociology
    Public Administration
    Anthropology
    International Relations
    Communication and Journalism
    Criminology and Police Science
    Development Studies

Faculty of Law (folaw):
    Law

Faculty of Biological Sciences (fbio):
    Zoology
    Botany
    Geography and Environmental Studies
    Biochemistry & Molecular Biology
    Microbiology
    Soil Science
    Genetic Engineering & Biotechnology
    Psychology
    Pharmacy

Faculty of Engineering (fengg):
    Computer Science & Engineering
    Electrical & Electronic Engineering

Faculty of Education (fedu):
    Physical Education & Sports Science
    Institute of Education and Research

Faculty of Marine Sciences and Fisheries (fmsf):
    Institute of Marine Sciences
    Oceanography
    Fisheries`;

const AdminSetup = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [facultyText, setFacultyText] = useState('');
  const [loading, setLoading] = useState(false);
  const [savedData, setSavedData] = useState(null);
  const [loadingData, setLoadingData] = useState(true);

  // Load existing faculty data on mount
  useEffect(() => {
    loadFacultyData();
  }, []);

  const loadFacultyData = async () => {
    try {
      setLoadingData(true);
      const data = await getFacultyData();
      if (data) {
        setSavedData(data);
      }
    } catch (error) {
      console.error('Error loading faculty data:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error Loading Data',
        text: 'Could not load faculty data from database',
        confirmButtonColor: '#001f3f'
      });
    } finally {
      setLoadingData(false);
    }
  };

  const handleLoadSampleData = () => {
    setFacultyText(SAMPLE_FACULTY_DATA);
    Swal.fire({
      icon: 'info',
      title: 'Sample Data Loaded',
      text: 'Click "Save Faculty Data" to import the sample data',
      confirmButtonColor: '#001f3f'
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/student-information-form/login');
  };

  const parseFacultyData = (text) => {
    const lines = text.trim().split('\n');
    const faculties = {};
    let currentFaculty = null;
    let currentAlias = null;

    for (let line of lines) {
      line = line.trim();
      
      if (!line) continue; // Skip empty lines

      // Check if line is a faculty (contains parentheses with alias)
      const facultyMatch = line.match(/^Faculty of (.+)\s+\(([a-z]+)\):\s*$/i);
      if (facultyMatch) {
        const fullName = facultyMatch[1];
        currentAlias = facultyMatch[2];
        faculties[currentAlias] = {
          name: `Faculty of ${fullName}`,
          alias: currentAlias,
          departments: [],
          createdAt: new Date().toISOString()
        };
        currentFaculty = currentAlias;
        continue;
      }

      // If we have a current faculty and line doesn't start with "Faculty", it's a department
      if (currentFaculty && !line.match(/^Faculty of/i)) {
        faculties[currentFaculty].departments.push(line);
      }
    }

    return faculties;
  };

  const handleSubmit = async () => {
    if (!facultyText.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Empty Input',
        text: 'Please paste the faculty and department data',
        confirmButtonColor: '#001f3f'
      });
      return;
    }

    try {
      const parsedData = parseFacultyData(facultyText);
      
      if (Object.keys(parsedData).length === 0) {
        Swal.fire({
          icon: 'error',
          title: 'Parse Error',
          text: 'Could not parse faculty data. Please check the format.',
          confirmButtonColor: '#001f3f'
        });
        return;
      }

      setLoading(true);
      await saveFacultyData(parsedData);

      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: `Successfully saved ${Object.keys(parsedData).length} faculties with ${Object.values(parsedData).reduce((sum, f) => sum + f.departments.length, 0)} departments`,
        confirmButtonColor: '#001f3f'
      });

      setSavedData(parsedData);
      setFacultyText('');
    } catch (error) {
      console.error('Error saving faculty data:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to save faculty data: ' + error.message,
        confirmButtonColor: '#001f3f'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Admin Setup - Faculty & Departments</title>
        <meta name="description" content="Admin setup page for faculty and department configuration" />
      </Helmet>

      <Container maxWidth="lg" sx={{ py: { xs: 4, sm: 6, md: 8 }, position: 'relative', zIndex: 10 }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 4, md: 6 },
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(0, 31, 63, 0.1)',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0, 31, 63, 0.1)'
          }}
        >
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 6 }}>
            <Box>
              <Typography
                variant="h3"
                component="h1"
                sx={{
                  color: '#001f3f',
                  fontWeight: 'bold',
                  mb: 1,
                  fontSize: { xs: '24px', sm: '28px', md: '36px' }
                }}
              >
                Faculty & Department Setup
              </Typography>
              <Typography variant="body1" sx={{ color: '#666' }}>
                Configure faculties and departments for the registration system.
              </Typography>
            </Box>
            <Button
              variant="outlined"
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
              sx={{ borderColor: '#d32f2f', color: '#d32f2f', fontWeight: 'bold' }}
            >
              Logout
            </Button>
          </Box>

          {/* Instructions Alert */}
          <Alert severity="info" sx={{ mb: 4, borderRadius: '8px' }}>
            <Typography variant="body2">
              Paste the faculty data in the format provided. The system will automatically parse the aliases in parentheses and create timestamps.
            </Typography>
          </Alert>

          {/* Input Section */}
          <Box sx={{ mb: 6 }}>
            <Typography variant="h6" sx={{ color: '#001f3f', fontWeight: 'bold', mb: 2 }}>
              Faculty & Department Data
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={15}
              placeholder="Paste faculty and department data here..."
              value={facultyText}
              onChange={(e) => setFacultyText(e.target.value)}
              disabled={loading}
              variant="outlined"
              sx={{
                mb: 3,
                fontFamily: 'monospace',
                fontSize: '13px',
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  '&:hover fieldset': {
                    borderColor: '#003d7a'
                  }
                }
              }}
            />

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={loading || !facultyText.trim()}
                sx={{
                  background: 'linear-gradient(135deg, #001f3f 0%, #003d7a 100%)',
                  px: 6,
                  py: 1.5,
                  fontWeight: 'bold',
                  borderRadius: '8px',
                  '&:hover': {
                    boxShadow: '0 8px 20px rgba(0, 31, 63, 0.3)'
                  },
                  '&:disabled': {
                    background: '#ccc'
                  }
                }}
              >
                {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Save Faculty Data'}
              </Button>
              <Button
                variant="outlined"
                onClick={loadFacultyData}
                disabled={loading}
                sx={{
                  borderColor: '#001f3f',
                  color: '#001f3f',
                  fontWeight: 'bold',
                  borderRadius: '8px',
                  px: 4
                }}
              >
                Refresh Data
              </Button>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleLoadSampleData}
                disabled={loading}
                sx={{
                  borderColor: '#0288d1',
                  color: '#0288d1',
                  fontWeight: 'bold',
                  borderRadius: '8px'
                }}
              >
                Load Sample Data
              </Button>
            </Box>
          </Box>

          {/* Saved Data Display */}
          {loadingData ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : savedData ? (
            <Box>
              <Typography variant="h6" sx={{ color: '#001f3f', fontWeight: 'bold', mb: 3 }}>
                Currently Saved Data ({Object.keys(savedData).length} faculties)
              </Typography>

              {Object.values(savedData).map((faculty) => (
                <Box key={faculty.alias} sx={{ mb: 4, pb: 3, borderBottom: '1px solid #e0e0e0' }}>
                  <Typography variant="subtitle1" sx={{ color: '#003d7a', fontWeight: 'bold', mb: 1 }}>
                    {faculty.name} ({faculty.alias})
                  </Typography>
                  {faculty.createdAt && (
                    <Typography variant="caption" sx={{ color: '#999', display: 'block', mb: 2 }}>
                      Created: {new Date(faculty.createdAt).toLocaleString()}
                    </Typography>
                  )}
                  <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
                    Departments ({faculty.departments.length}):
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {faculty.departments.map((dept, idx) => (
                      <Box
                        key={idx}
                        sx={{
                          background: '#f5f5f5',
                          border: '1px solid #e0e0e0',
                          borderRadius: '6px',
                          px: 2,
                          py: 1,
                          fontSize: '13px',
                          color: '#333'
                        }}
                      >
                        {dept}
                      </Box>
                    ))}
                  </Box>
                </Box>
              ))}
            </Box>
          ) : (
            <Alert severity="warning">
              No faculty data found in database. Please enter and save the data above.
            </Alert>
          )}
        </Paper>
      </Container>
    </>
  );
};

export default AdminSetup;
