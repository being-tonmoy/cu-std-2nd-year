import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from '@mui/material/CircularProgress';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import Swal from 'sweetalert2';
import { getFacultyData } from '../services/firestoreService';
import { db } from '../utils/firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, Timestamp, setDoc, doc, getDoc } from 'firebase/firestore';

const ComplaintsPage = () => {
  // Form section state
  const [formData, setFormData] = useState({
    studentId: '',
    title: '',
    email: '',
    department: '',
    issue: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);

  // Track section state
  const [trackingStudentId, setTrackingStudentId] = useState('');
  const [complaints, setComplaints] = useState([]);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Chat modal state
  const [openChat, setOpenChat] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [messageSending, setMessageSending] = useState(false);

  // Load faculty data on component mount
  useEffect(() => {
    loadFacultyDataFromFirestore();
  }, []);

  const loadFacultyDataFromFirestore = async () => {
    try {
      const data = await getFacultyData();
      if (data) {
        const allDepts = new Set();
        Object.values(data).forEach(faculty => {
          if (faculty && faculty.departments && Array.isArray(faculty.departments)) {
            faculty.departments.forEach(dept => allDepts.add(dept));
          }
        });
        setDepartments(Array.from(allDepts).sort());
      }
    } catch (error) {
      console.error('Error loading faculty data:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.studentId.trim()) {
      newErrors.studentId = 'Student ID is required';
    }

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.department.trim()) {
      newErrors.department = 'Department is required';
    }

    if (!formData.issue.trim()) {
      newErrors.issue = 'Detailed description is required';
    } else if (formData.issue.trim().length < 10) {
      newErrors.issue = 'Please provide at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const studentId = formData.studentId.trim();
      
      // Create complaint data (without messages)
      const complaintData = {
        studentId: studentId,
        title: formData.title.trim(),
        email: formData.email.trim(),
        department: formData.department,
        description: formData.issue.trim(),
        openedAt: serverTimestamp(),
        lastUpdatedAt: serverTimestamp(),
        lastTextBy: 'student',
        status: 'open'
      };

      // Set document with studentId as document ID, merge if exists
      const complaintDocRef = doc(db, 'complaints', studentId);
      await setDoc(complaintDocRef, complaintData, { merge: true });

      // Add message to subcollection
      const messagesCollection = collection(complaintDocRef, 'messages');
      await addDoc(messagesCollection, {
        text: formData.issue.trim(),
        sentBy: 'student',
        timestamp: Timestamp.now(),
        isAdmin: false
      });

      Swal.fire({
        icon: 'success',
        title: 'Complaint Submitted Successfully',
        html: `<p>Your complaint has been registered.</p><p><strong>Student ID: ${studentId}</strong></p><p>You can use this ID to track your complaint status.</p>`,
        confirmButtonColor: '#001f3f',
        confirmButtonText: 'OK'
      });

      setFormData({
        studentId: '',
        title: '',
        email: '',
        department: '',
        issue: ''
      });
    } catch (error) {
      console.error('Error submitting complaint:', error);
      const errorMessage = error.message || 'Failed to submit complaint. Please try again.';
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: `${errorMessage}${errorMessage.includes('permission') ? ' - Please check your Firestore security rules.' : ''}`,
        confirmButtonColor: '#001f3f'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTrackComplaints = async (e) => {
    e.preventDefault();
    
    if (!trackingStudentId.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Input Required',
        text: 'Please enter your Student ID to track complaints',
        confirmButtonColor: '#001f3f'
      });
      return;
    }

    setTrackingLoading(true);

    try {
      const studentId = trackingStudentId.trim();
      const complaintDocRef = doc(db, 'complaints', studentId);
      const complaintSnapshot = await getDoc(complaintDocRef);

      if (!complaintSnapshot.exists()) {
        Swal.fire({
          icon: 'info',
          title: 'No Complaints Found',
          text: 'You have not filed any complaints yet.',
          confirmButtonColor: '#001f3f'
        });
        setComplaints([]);
        setHasSearched(true);
        setTrackingLoading(false);
        return;
      }

      // Get complaint data with document ID
      const complaintData = {
        id: complaintSnapshot.id,
        ...complaintSnapshot.data()
      };

      // Fetch messages from subcollection
      const messagesCollection = collection(complaintDocRef, 'messages');
      const messagesQuery = query(messagesCollection, orderBy('timestamp', 'asc'));
      const messagesSnapshot = await getDocs(messagesQuery);
      
      const messages = messagesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      complaintData.messages = messages;

      setComplaints([complaintData]);
      setHasSearched(true);
    } catch (error) {
      console.error('Error fetching complaints:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: `Failed to retrieve complaints. ${error.message}`,
        confirmButtonColor: '#001f3f'
      });
    } finally {
      setTrackingLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      studentId: '',
      title: '',
      email: '',
      department: '',
      issue: ''
    });
    setErrors({});
  };

  const handleOpenChat = (complaint) => {
    setSelectedComplaint(complaint);
    setOpenChat(true);
    setNewMessage('');
  };

  const handleCloseChat = () => {
    setOpenChat(false);
    setSelectedComplaint(null);
    setNewMessage('');
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedComplaint) return;

    setMessageSending(true);

    try {
      const complaintDocRef = doc(db, 'complaints', selectedComplaint.studentId);
      const messagesCollection = collection(complaintDocRef, 'messages');
      
      await addDoc(messagesCollection, {
        text: newMessage.trim(),
        sentBy: 'student',
        timestamp: Timestamp.now(),
        isAdmin: false
      });

      // Update the complaint's lastUpdatedAt and lastTextBy
      await setDoc(complaintDocRef, {
        lastUpdatedAt: serverTimestamp(),
        lastTextBy: 'student'
      }, { merge: true });

      // Update selected complaint with new message
      setSelectedComplaint(prev => ({
        ...prev,
        messages: [
          ...(prev.messages || []),
          {
            text: newMessage.trim(),
            sentBy: 'student',
            timestamp: Timestamp.now(),
            isAdmin: false
          }
        ]
      }));

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to send message. Please try again.',
        confirmButtonColor: '#001f3f'
      });
    } finally {
      setMessageSending(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'open':
        return '#ff6f00';
      case 'in-progress':
        return '#1976d2';
      case 'resolved':
        return '#4caf50';
      case 'closed':
        return '#666';
      default:
        return '#666';
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <Helmet>
        <title>Report Issue & Track Complaints - Institutional Email Application Form</title>
        <meta name="description" content="Report issues and track your complaints" />
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
          <Box sx={{ textAlign: 'center', mb: 4 }}>
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
              Report an Issue
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: '#666',
                fontSize: { xs: '14px', sm: '16px' }
              }}
            >
              Submit your complaint or issue to get help
            </Typography>
          </Box>

          <Box sx={{ background: 'white', p: { xs: 2, sm: 3 }, borderRadius: '12px', mb: 4 }}>
            <form onSubmit={handleSubmit}>
              {/* Row 1: Title - Full Width */}
              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <TextField
                  fullWidth
                  label="Title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  error={!!errors.title}
                  helperText={errors.title}
                  placeholder="Brief title of your issue"
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': {
                        borderColor: '#003d7a'
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#001f3f',
                        borderWidth: 2
                      }
                    }
                  }}
                />
              </Box>

              {/* Row 2: Student ID and Department - Same Row, 1/2 width each */}
              <Box sx={{ display: 'flex', gap: 2, mb: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <TextField
                    fullWidth
                    label="Student ID"
                    name="studentId"
                    value={formData.studentId}
                    onChange={handleInputChange}
                    error={!!errors.studentId}
                    helperText={errors.studentId}
                    placeholder="e.g., 2024001"
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': {
                          borderColor: '#003d7a'
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#001f3f',
                          borderWidth: 2
                        }
                      }
                    }}
                  />
                </Box>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <TextField
                    fullWidth
                    select
                    label="Department"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    error={!!errors.department}
                    helperText={errors.department}
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': {
                          borderColor: '#003d7a'
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#001f3f',
                          borderWidth: 2
                        }
                      }
                    }}
                  >
                    <MenuItem value="">Select Department</MenuItem>
                    {departments.map(dept => (
                      <MenuItem key={dept} value={dept}>
                        {dept}
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>
              </Box>

              {/* Row 3: Primary Email - Full Width */}
              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <TextField
                  fullWidth
                  type="email"
                  label="Primary Email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  error={!!errors.email}
                  helperText={errors.email}
                  placeholder="your.email@example.com"
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': {
                        borderColor: '#003d7a'
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#001f3f',
                        borderWidth: 2
                      }
                    }
                  }}
                />
              </Box>

              {/* Row 4: Detailed Description - Full Width */}
              <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={6}
                  label="Detailed Description"
                  name="issue"
                  value={formData.issue}
                  onChange={handleInputChange}
                  error={!!errors.issue}
                  helperText={errors.issue || `${formData.issue.length} / minimum 10 characters`}
                  placeholder="Please describe your issue in detail..."
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': {
                        borderColor: '#003d7a'
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#001f3f',
                        borderWidth: 2
                      }
                    }
                  }}
                />
              </Box>

              {/* Action Buttons */}
              <Box
                sx={{
                  display: 'flex',
                  gap: { xs: 2, sm: 3 },
                  justifyContent: 'center',
                  flexDirection: { xs: 'column', sm: 'row' },
                  flexWrap: 'wrap'
                }}
              >
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                sx={{
                  background: 'linear-gradient(135deg, #001f3f 0%, #003d7a 100%)',
                  px: { xs: 6, sm: 8 },
                  py: { xs: 1.2, sm: 1.5 },
                  fontSize: { xs: '14px', sm: '16px' },
                  textTransform: 'none',
                  fontWeight: 'bold',
                  borderRadius: '8px',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 8px 20px rgba(0, 31, 63, 0.3)',
                    transform: 'translateY(-2px)'
                  },
                  '&:disabled': {
                    background: '#ccc'
                  }
                }}
              >
                {loading ? (
                  <CircularProgress size={24} sx={{ color: 'white' }} />
                ) : (
                  'Submit'
                )}
              </Button>
              <Button
                type="button"
                variant="outlined"
                onClick={handleReset}
                disabled={loading}
                sx={{
                  borderColor: '#d32f2f',
                  color: '#d32f2f',
                  px: { xs: 6, sm: 8 },
                  py: { xs: 1.2, sm: 1.5 },
                  fontSize: { xs: '14px', sm: '16px' },
                  textTransform: 'none',
                  fontWeight: 'bold',
                  borderRadius: '8px',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: 'rgba(211, 47, 47, 0.05)',
                    borderColor: '#d32f2f'
                  }
                }}
              >
                Clear
              </Button>
            </Box>
            </form>
          </Box>

          {/* Divider */}
          <Divider sx={{ my: 6, borderColor: 'rgba(0, 31, 63, 0.1)' }} />

          {/* Track Complaints Section */}
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Typography
              variant="h5"
              sx={{
                color: '#001f3f',
                fontWeight: 'bold',
                mb: 1,
                fontSize: { xs: '18px', sm: '20px' }
              }}
            >
              Check Your Complaint Status
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: '#666',
                fontSize: { xs: '13px', sm: '14px' }
              }}
            >
              Enter your Student ID to view and continue your conversation
            </Typography>
          </Box>

          {/* Search Form */}
          <form onSubmit={handleTrackComplaints}>
            <Box sx={{ display: 'flex', gap: 2, mb: 4, flexDirection: { xs: 'column', sm: 'row' } }}>
              <Box sx={{ flex: { xs: 1, sm: 3 }, minWidth: 0 }}>
                <TextField
                  fullWidth
                  label="Student ID"
                  value={trackingStudentId}
                  onChange={(e) => setTrackingStudentId(e.target.value)}
                  placeholder="Enter your Student ID"
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': {
                        borderColor: '#003d7a'
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#001f3f',
                        borderWidth: 2
                      }
                    }
                  }}
                />
              </Box>
              <Box sx={{ flex: { xs: 1, sm: 1 }, minWidth: 0 }}>
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={trackingLoading}
                  sx={{
                    background: 'linear-gradient(135deg, #001f3f 0%, #003d7a 100%)',
                    py: { xs: 1.5, sm: 1.75 },
                    textTransform: 'none',
                    fontWeight: 'bold',
                    borderRadius: '8px',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: '0 8px 20px rgba(0, 31, 63, 0.3)',
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  {trackingLoading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Search'}
                </Button>
              </Box>
            </Box>
          </form>

          {/* Complaints List */}
          {hasSearched && (
            <>
              {complaints.length === 0 ? (
                <Alert severity="info" sx={{ borderRadius: '8px' }}>
                  No complaints found. Submit one above to get started.
                </Alert>
              ) : (
                <Box>
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#666',
                      mb: 2,
                      fontSize: '13px',
                      fontWeight: '500'
                    }}
                  >
                    {complaints.length} Complaint{complaints.length !== 1 ? 's' : ''} Found
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {complaints.map((complaint) => (
                      <Card
                        key={complaint.id}
                        sx={{
                          borderLeft: `5px solid ${getStatusColor(complaint.status || 'open')}`,
                          transition: 'all 0.3s ease',
                          cursor: 'pointer',
                          '&:hover': {
                            boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                            transform: 'translateY(-2px)'
                          }
                        }}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 2, mb: 1 }}>
                            <Box>
                              <Typography variant="h6" sx={{ color: '#001f3f', fontWeight: 'bold' }}>
                                {complaint.title}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#999' }}>
                                ID: {complaint.id.substring(0, 12)}...
                              </Typography>
                            </Box>
                            <Chip
                              label={complaint.status || 'open'}
                              size="small"
                              sx={{
                                background: getStatusColor(complaint.status || 'open'),
                                color: 'white',
                                fontWeight: 'bold',
                                textTransform: 'capitalize'
                              }}
                            />
                          </Box>
                          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #eee', display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                            <Box>
                              <Typography variant="caption" sx={{ color: '#999' }}>
                                Department
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#333', fontWeight: '500' }}>
                                {complaint.department}
                              </Typography>
                            </Box>
                            <Box>
                              <Typography variant="caption" sx={{ color: '#999' }}>
                                Last Updated
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#333', fontWeight: '500' }}>
                                {formatDate(complaint.lastUpdatedAt)}
                              </Typography>
                            </Box>
                          </Box>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleOpenChat(complaint)}
                            disabled={complaint.status === 'closed'}
                            sx={{
                              mt: 2,
                              borderColor: complaint.status === 'closed' ? '#ccc' : '#001f3f',
                              color: complaint.status === 'closed' ? '#ccc' : '#001f3f',
                              textTransform: 'none',
                              fontWeight: '500',
                              borderRadius: '6px',
                              fontSize: '12px',
                              cursor: complaint.status === 'closed' ? 'not-allowed' : 'pointer'
                            }}
                          >
                            {complaint.status === 'closed' ? 'Chat Closed' : 'Continue Chat'}
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                </Box>
              )}
            </>
          )}
        </Paper>
      </Container>

      {/* Chat Modal */}
      <Dialog
        open={openChat}
        onClose={handleCloseChat}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
            height: '90vh',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
          }
        }}
      >
        {selectedComplaint && (
          <>
            <DialogTitle
              sx={{
                background: 'linear-gradient(135deg, #001f3f 0%, #003d7a 100%)',
                color: 'white',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                py: 1,
              }}
            >
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {selectedComplaint.title}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  {selectedComplaint.studentId}
                </Typography>
              </Box>
              <IconButton
                onClick={handleCloseChat}
                sx={{ color: 'white', size: 'small' }}
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>

            <DialogContent
              sx={{
                flex: 1,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                py: 2,
                px: 0,
                background: '#f5f5f5',
                justifyContent: 'flex-end',
                minHeight: 0,
                '&::-webkit-scrollbar': {
                  width: '6px'
                },
                '&::-webkit-scrollbar-track': {
                  background: 'transparent'
                },
                '&::-webkit-scrollbar-thumb': {
                  background: '#ccc',
                  borderRadius: '3px'
                }
              }}
            >
              {selectedComplaint.messages && selectedComplaint.messages.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, pt: 2, px:1, overflowY: 'auto' }}>
                  {selectedComplaint.messages.map((message) => (
                    <Box
                      key={message.id}
                      sx={{
                        display: 'flex',
                        justifyContent: message.sentBy === 'student' ? 'flex-end' : 'flex-start',
                        mb: 1
                      }}
                    >
                      <Paper
                        sx={{
                          p: 1.5,
                          maxWidth: '70%',
                          background: message.sentBy === 'student' ? '#001f3f' : '#fff',
                          color: message.sentBy === 'student' ? '#fff' : '#333',
                          borderRadius: '12px',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                      >
                        <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                          {message.text}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            display: 'block',
                            mt: 0.5,
                            opacity: 0.7,
                            fontSize: '11px'
                          }}
                        >
                          {message.timestamp ? formatDate(message.timestamp) : 'Sending...'}
                        </Typography>
                      </Paper>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <Typography variant="body2" sx={{ color: '#999' }}>
                    No messages yet. Start the conversation!
                  </Typography>
                </Box>
              )}
            </DialogContent>

            {/* Facebook-style Message Input */}
            {selectedComplaint.status === 'closed' ? (
              <Alert severity="warning" sx={{ m: 2, borderRadius: '8px' }}>
                This complaint has been closed. You cannot send new messages.
              </Alert>
            ) : (
              <Box
                sx={{
                  p: 2,
                  background: '#fff',
                  borderTop: '1px solid #e0e0e0',
                  display: 'flex',
                  gap: 1,
                  alignItems: 'flex-end'
                }}
              >
                <TextField
                  fullWidth
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  multiline
                  maxRows={3}
                  variant="outlined"
                  size="small"
                  disabled={messageSending}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '20px',
                      '&:hover fieldset': {
                        borderColor: '#003d7a'
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#001f3f'
                      }
                    }
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={handleSendMessage}
                          disabled={!newMessage.trim() || messageSending}
                          sx={{
                            color: newMessage.trim() ? '#001f3f' : '#ccc'
                          }}
                          size="small"
                        >
                          <SendIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </Box>
            )}
          </>
        )}
      </Dialog>
    </>
  );
};

export default ComplaintsPage;
