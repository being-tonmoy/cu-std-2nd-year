import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import LogoutIcon from '@mui/icons-material/Logout';
import BarChartIcon from '@mui/icons-material/BarChart';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';
import SchoolIcon from '@mui/icons-material/School';
import WarningIcon from '@mui/icons-material/Warning';
import Swal from 'sweetalert2';
import { Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip as ChartTooltip, Legend, Filler } from 'chart.js';
import { useAuth } from '../contexts/AuthContext';
import { getAllSubmissions } from '../services/firestoreService';
import { db } from '../utils/firebase';
import { collection, getDocs } from 'firebase/firestore';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, ChartTooltip, Legend, Filler);

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [facultySortConfig, setFacultySortConfig] = useState({ key: 'count', direction: 'desc' });
  const [departmentSortConfig, setDepartmentSortConfig] = useState({ key: 'count', direction: 'desc' });

  useEffect(() => {
    loadSubmissions();
    loadComplaints();
  }, []);

  const loadSubmissions = async () => {
    try {
      const data = await getAllSubmissions();
      setSubmissions(data);
    } catch (error) {
      console.error('Error loading submissions:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load submissions',
        confirmButtonColor: '#001f3f'
      });
    }
  };

  const loadComplaints = async () => {
    try {
      const complaintsCollection = collection(db, 'complaints');
      const snapshot = await getDocs(complaintsCollection);
      const complaintsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setComplaints(complaintsData);
    } catch (error) {
      console.error('Error loading complaints:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const handleFacultySort = (key) => {
    let direction = 'desc';
    if (facultySortConfig.key === key && facultySortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setFacultySortConfig({ key, direction });
  };

  const handleDepartmentSort = (key) => {
    let direction = 'desc';
    if (departmentSortConfig.key === key && departmentSortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setDepartmentSortConfig({ key, direction });
  };

  const sortFacultyData = (data) => {
    const sorted = [...data].sort((a, b) => {
      let aVal, bVal, comparison;
      
      if (facultySortConfig.key === 'count') {
        aVal = a[1];
        bVal = b[1];
        comparison = aVal - bVal;
      } else if (facultySortConfig.key === 'percentage') {
        aVal = a[1] / stats.totalSubmissions;
        bVal = b[1] / stats.totalSubmissions;
        comparison = aVal - bVal;
      } else {
        aVal = a[0];
        bVal = b[0];
        comparison = aVal.localeCompare(bVal);
      }
      
      return facultySortConfig.direction === 'desc' ? -comparison : comparison;
    });
    return sorted;
  };

  const sortDepartmentData = (data) => {
    const sorted = [...data].sort((a, b) => {
      let aVal, bVal, comparison;
      
      if (departmentSortConfig.key === 'count') {
        aVal = a[1];
        bVal = b[1];
        comparison = aVal - bVal;
      } else if (departmentSortConfig.key === 'percentage') {
        aVal = a[1] / stats.totalSubmissions;
        bVal = b[1] / stats.totalSubmissions;
        comparison = aVal - bVal;
      } else {
        aVal = a[0];
        bVal = b[0];
        comparison = aVal.localeCompare(bVal);
      }
      
      return departmentSortConfig.direction === 'desc' ? -comparison : comparison;
    });
    return sorted;
  };

  const getSortIndicator = (column, sortConfig) => {
    if (sortConfig.key !== column) return ' ↕';
    return sortConfig.direction === 'desc' ? ' ↓' : ' ↑';
  };

  const stats = {
    totalSubmissions: submissions.length,
    totalFaculties: [...new Set(submissions.map(s => s.faculty))].length,
    totalDepartments: [...new Set(submissions.map(s => s.department))].length,
    sessions: [...new Set(submissions.map(s => s.session))]
  };

  const submissionsByFaculty = submissions.reduce((acc, s) => {
    acc[s.faculty] = (acc[s.faculty] || 0) + 1;
    return acc;
  }, {});

  const submissionsByDepartment = submissions.reduce((acc, s) => {
    acc[s.department] = (acc[s.department] || 0) + 1;
    return acc;
  }, {});

  // Calculate submissions by date
  const submissionsByDate = submissions.reduce((acc, s) => {
    const date = s.createdAt?.toDate?.().toLocaleDateString('en-CA') || 'Unknown';
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  // Sort dates and get daily submission counts
  const sortedDates = Object.keys(submissionsByDate).sort();
  const dateWiseData = sortedDates.map(date => submissionsByDate[date]);

  return (
    <>
      <Helmet>
        <title>Admin Dashboard - Institutional Email Application Form</title>
        <meta name="description" content="Admin dashboard for managing institutional email submissions" />
      </Helmet>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h3" sx={{ color: '#001f3f', fontWeight: 'bold', mb: 1 }}>
              Admin Dashboard
            </Typography>
            <Typography variant="body1" sx={{ color: '#666' }}>
              Welcome, <strong>{user?.name}</strong> ({user?.role})
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/admin/setup')}
              sx={{ borderColor: '#003d7a', color: '#003d7a', fontWeight: 'bold' }}
            >
              Setup
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/admin/submissions')}
              sx={{ borderColor: '#003d7a', color: '#003d7a', fontWeight: 'bold' }}
            >
              Manage Submissions
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/admin/users')}
              sx={{ borderColor: '#003d7a', color: '#003d7a', fontWeight: 'bold' }}
            >
              Manage Users
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/admin/complaints')}
              sx={{ borderColor: '#ff6f00', color: '#ff6f00', fontWeight: 'bold' }}
            >
              Manage Complaints
            </Button>
            <Button
              variant="outlined"
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
              sx={{ borderColor: '#d32f2f', color: '#d32f2f', fontWeight: 'bold' }}
            >
              Logout
            </Button>
          </Box>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #001f3f 0%, #003d7a 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="rgba(255,255,255,0.7)" gutterBottom>
                      Total Submissions
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {stats.totalSubmissions}
                    </Typography>
                  </Box>
                  <AssignmentIcon sx={{ fontSize: 50, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #0288d1 0%, #01579b 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="rgba(255,255,255,0.7)" gutterBottom>
                      Faculties
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {stats.totalFaculties}
                    </Typography>
                  </Box>
                  <SchoolIcon sx={{ fontSize: 50, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #00897b 0%, #004d40 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="rgba(255,255,255,0.7)" gutterBottom>
                      Departments
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {stats.totalDepartments}
                    </Typography>
                  </Box>
                  <BarChartIcon sx={{ fontSize: 50, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #6a1b9a 0%, #4a148c 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="rgba(255,255,255,0.7)" gutterBottom>
                      Sessions
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {stats.sessions.length}
                    </Typography>
                  </Box>
                  <PeopleIcon sx={{ fontSize: 50, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="rgba(255,255,255,0.7)" gutterBottom>
                      Open Issues
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {complaints.filter(c => c.status === 'open').length}
                    </Typography>
                  </Box>
                  <WarningIcon sx={{ fontSize: 50, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Submissions by Faculty - Chart and Table */}
        {Object.keys(submissionsByFaculty).length > 0 && (
          <Paper sx={{ p: 3, mb: 4, borderRadius: '12px' }}>
            <Typography variant="h6" sx={{ color: '#001f3f', fontWeight: 'bold', mb: 3 }}>
              Submissions by Faculty
            </Typography>
            
            {/* Bar Chart */}
            <Box sx={{ mb: 4, maxHeight: '400px', display: 'flex', justifyContent: 'center' }}>
              <Bar
                data={{
                  labels: Object.entries(submissionsByFaculty)
                    .sort((a, b) => b[1] - a[1])
                    .map(([faculty]) => faculty),
                  datasets: [
                    {
                      label: 'Number of Submissions',
                      data: Object.entries(submissionsByFaculty)
                        .sort((a, b) => b[1] - a[1])
                        .map(([, count]) => count),
                      backgroundColor: [
                        '#001f3f',
                        '#0288d1',
                        '#00897b',
                        '#6a1b9a',
                        '#ff6f00',
                        '#c62828',
                        '#0097a7',
                        '#1b5e20'
                      ],
                      borderColor: '#001f3f',
                      borderWidth: 1,
                      borderRadius: 4
                    }
                  ]
                }}
                options={{
                  indexAxis: 'y',
                  responsive: true,
                  maintainAspectRatio: true,
                  plugins: {
                    legend: {
                      display: true,
                      position: 'top'
                    },
                    title: {
                      display: false
                    }
                  },
                  scales: {
                    x: {
                      beginAtZero: true,
                      ticks: {
                        stepSize: 1
                      }
                    }
                  }
                }}
              />
            </Box>

            {/* Faculty Table */}
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" sx={{ color: '#666', fontWeight: 'bold', mb: 2 }}>
                Faculty Statistics
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell 
                        sx={{ fontWeight: 'bold', color: '#001f3f', cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleFacultySort('name')}
                      >
                        Faculty Name{getSortIndicator('name', facultySortConfig)}
                      </TableCell>
                      <TableCell 
                        align="right" 
                        sx={{ fontWeight: 'bold', color: '#001f3f', cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleFacultySort('count')}
                      >
                        Number of Submissions{getSortIndicator('count', facultySortConfig)}
                      </TableCell>
                      <TableCell 
                        align="right" 
                        sx={{ fontWeight: 'bold', color: '#001f3f', cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleFacultySort('percentage')}
                      >
                        Percentage{getSortIndicator('percentage', facultySortConfig)}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sortFacultyData(Object.entries(submissionsByFaculty)).map(([faculty, count]) => (
                      <TableRow key={faculty} hover>
                        <TableCell>{faculty}</TableCell>
                        <TableCell align="right">{count}</TableCell>
                        <TableCell align="right">
                          {((count / stats.totalSubmissions) * 100).toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell sx={{ fontWeight: 'bold' }}>Total</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        {stats.totalSubmissions}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>100%</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Paper>
        )}

        {/* Submissions by Department - Chart and Table */}
        {Object.keys(submissionsByDepartment).length > 0 && (
          <Paper sx={{ p: 3, mb: 4, borderRadius: '12px' }}>
            <Typography variant="h6" sx={{ color: '#001f3f', fontWeight: 'bold', mb: 3 }}>
              Submissions by Department
            </Typography>
            
            {/* Bar Chart */}
            <Box sx={{ mb: 4, minHeight: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <div style={{ width: '100%' }}>
                <Bar
                  data={{
                    labels: Object.entries(submissionsByDepartment)
                      .sort((a, b) => b[1] - a[1])
                      .map(([dept]) => dept),
                    datasets: [
                      {
                        label: 'Number of Submissions',
                        data: Object.entries(submissionsByDepartment)
                          .sort((a, b) => b[1] - a[1])
                          .map(([, count]) => count),
                        backgroundColor: [
                          '#001f3f',
                          '#0288d1',
                          '#00897b',
                          '#6a1b9a',
                          '#ff6f00',
                          '#c62828',
                          '#0097a7',
                          '#1b5e20',
                          '#1976d2',
                          '#388e3c',
                          '#d32f2f',
                          '#7b1fa2',
                          '#0277bd',
                          '#455a64',
                          '#558b2f',
                          '#bf360c'
                        ],
                        borderColor: '#001f3f',
                        borderWidth: 1,
                        borderRadius: 4,
                        barThickness: 12,
                        categoryPercentage: 0.4,
                        barPercentage: 0.7
                      }
                    ]
                  }}
                  options={{
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: true,
                        position: 'top'
                      },
                      title: {
                        display: false
                      }
                    },
                    scales: {
                      x: {
                        beginAtZero: true,
                        ticks: {
                          stepSize: 1,
                          font: {
                            size: 12
                          }
                        }
                      },
                      y: {
                        ticks: {
                          font: {
                            size: 13,
                            weight: 'bold'
                          },
                          padding: 5
                        }
                      }
                    }
                  }}
                  height={Math.max(400, Object.keys(submissionsByDepartment).length * 20)}
                />
              </div>
            </Box>

            {/* Department Table */}
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" sx={{ color: '#666', fontWeight: 'bold', mb: 2 }}>
                Department Statistics
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell 
                        sx={{ fontWeight: 'bold', color: '#001f3f', cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleDepartmentSort('name')}
                      >
                        Department Name{getSortIndicator('name', departmentSortConfig)}
                      </TableCell>
                      <TableCell 
                        align="right" 
                        sx={{ fontWeight: 'bold', color: '#001f3f', cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleDepartmentSort('count')}
                      >
                        Number of Submissions{getSortIndicator('count', departmentSortConfig)}
                      </TableCell>
                      <TableCell 
                        align="right" 
                        sx={{ fontWeight: 'bold', color: '#001f3f', cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleDepartmentSort('percentage')}
                      >
                        Percentage{getSortIndicator('percentage', departmentSortConfig)}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sortDepartmentData(Object.entries(submissionsByDepartment)).map(([department, count]) => (
                      <TableRow key={department} hover>
                        <TableCell>{department}</TableCell>
                        <TableCell align="right">{count}</TableCell>
                        <TableCell align="right">
                          {((count / stats.totalSubmissions) * 100).toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell sx={{ fontWeight: 'bold' }}>Total</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        {stats.totalSubmissions}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>100%</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Paper>
        )}

        {/* Submissions Timeline - Line Graph */}
        {sortedDates.length > 0 && (
          <Paper sx={{ p: 3, mb: 4, borderRadius: '12px' }}>
            <Typography variant="h6" sx={{ color: '#001f3f', fontWeight: 'bold', mb: 3 }}>
              Submissions by Date
            </Typography>
            
            {/* Line Chart */}
            <Box sx={{ mb: 2, minHeight: '400px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <div style={{ width: '100%', height: '400px' }}>
                <Line
                  data={{
                    labels: sortedDates,
                    datasets: [
                      {
                        label: 'Daily Submissions',
                        data: dateWiseData,
                        borderColor: '#001f3f',
                        backgroundColor: 'rgba(0, 31, 63, 0.1)',
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: '#0288d1',
                        pointBorderColor: '#001f3f',
                        pointBorderWidth: 2,
                        pointRadius: 5,
                        pointHoverRadius: 7,
                        borderWidth: 3,
                        segment: {
                          borderDash: [0],
                        }
                      }
                    ]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: true,
                        position: 'top',
                        labels: {
                          font: {
                            size: 13,
                            weight: 'bold'
                          },
                          padding: 15
                        }
                      },
                      title: {
                        display: false
                      },
                      tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleFont: { size: 13, weight: 'bold' },
                        bodyFont: { size: 12 },
                        borderColor: '#001f3f',
                        borderWidth: 1,
                        displayColors: true
                      }
                    },
                    scales: {
                      x: {
                        grid: {
                          display: true,
                          color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                          font: {
                            size: 11
                          },
                          maxRotation: 45,
                          minRotation: 0
                        }
                      },
                      y: {
                        beginAtZero: true,
                        grid: {
                          display: true,
                          color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                          font: {
                            size: 12,
                            weight: 'bold'
                          },
                          stepSize: 1
                        },
                        title: {
                          display: true,
                          text: 'Submissions',
                          font: {
                            size: 12,
                            weight: 'bold'
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
            </Box>

            {/* Timeline Statistics */}
            <Box sx={{ mt: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#666', fontWeight: 'bold' }}>
                      Total Days with Submissions
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#001f3f', fontWeight: 'bold' }}>
                      {sortedDates.length}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#666', fontWeight: 'bold' }}>
                      First Submission Date
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#0288d1', fontWeight: 'bold' }}>
                      {sortedDates[0] || 'N/A'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#666', fontWeight: 'bold' }}>
                      Latest Submission Date
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#00897b', fontWeight: 'bold' }}>
                      {sortedDates[sortedDates.length - 1] || 'N/A'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#666', fontWeight: 'bold' }}>
                      Avg. Submissions/Day
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#6a1b9a', fontWeight: 'bold' }}>
                      {sortedDates.length > 0 ? (stats.totalSubmissions / sortedDates.length).toFixed(1) : 0}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        )}

      </Container>
    </>
  );
};

export default AdminDashboard;
