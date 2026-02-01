import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import SendIcon from '@mui/icons-material/Send';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Swal from 'sweetalert2';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../utils/firebase';
import { collection, getDocs, setDoc, deleteDoc, doc, addDoc, Timestamp, query, orderBy } from 'firebase/firestore';

const AdminComplaints = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openReplyDialog, setOpenReplyDialog] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [editStatus, setEditStatus] = useState('');
  const [replyMessage, setReplyMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [complaintMessages, setComplaintMessages] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    loadComplaints();
  }, []);

  const loadComplaints = async () => {
    try {
      const complaintsCollection = collection(db, 'complaints');
      const snapshot = await getDocs(complaintsCollection);
      const complaintsData = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const complaintData = {
            id: doc.id,
            ...doc.data()
          };
          
          // Load messages for this complaint
          try {
            const messagesCollection = collection(doc.ref, 'messages');
            const messagesQuery = query(messagesCollection, orderBy('timestamp', 'asc'));
            const messagesSnapshot = await getDocs(messagesQuery);
            complaintData.messages = messagesSnapshot.docs.map(msgDoc => ({
              id: msgDoc.id,
              ...msgDoc.data()
            }));
          } catch (error) {
            complaintData.messages = [];
          }
          
          return complaintData;
        })
      );
      
      setComplaints(complaintsData.sort((a, b) => {
        const dateA = a.openedAt?.toDate?.() || new Date(0);
        const dateB = b.openedAt?.toDate?.() || new Date(0);
        return dateB - dateA;
      }));
    } catch (error) {
      console.error('Error loading complaints:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load complaints',
        confirmButtonColor: '#001f3f'
      });
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getFilteredComplaints = () => {
    return complaints.filter((complaint) => {
      const matchesSearch = searchTerm === '' ||
        complaint.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        complaint.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        complaint.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDepartment = filterDepartment === '' || complaint.department === filterDepartment;
      const matchesStatus = filterStatus === '' || complaint.status === filterStatus;
      
      return matchesSearch && matchesDepartment && matchesStatus;
    });
  };

  const filteredComplaints = getFilteredComplaints();
  const uniqueDepartments = [...new Set(complaints.map(c => c.department).filter(Boolean))];
  const statuses = ['open', 'in-progress', 'resolved', 'closed'];

  const handleEditClick = (complaint) => {
    setSelectedComplaint(complaint);
    setEditStatus(complaint.status || 'open');
    setOpenEditDialog(true);
  };

  const handleReplyClick = (complaint) => {
    setSelectedComplaint(complaint);
    setComplaintMessages(complaint.messages || []);
    setReplyMessage('');
    setOpenReplyDialog(true);
  };

  const handleStatusChange = async () => {
    if (!selectedComplaint) return;

    setLoading(true);
    try {
      const complaintDocRef = doc(db, 'complaints', selectedComplaint.id);
      await setDoc(complaintDocRef, {
        status: editStatus,
        lastUpdatedAt: new Date(),
        lastTextBy: 'admin'
      }, { merge: true });

      setComplaints(complaints.map(c =>
        c.id === selectedComplaint.id ? { ...c, status: editStatus, lastUpdatedAt: new Date() } : c
      ));

      Swal.fire({
        icon: 'success',
        title: 'Status Updated',
        text: `Complaint status changed to ${editStatus}`,
        confirmButtonColor: '#001f3f'
      });

      setOpenEditDialog(false);
      setSelectedComplaint(null);
    } catch (error) {
      console.error('Error updating status:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to update status',
        confirmButtonColor: '#001f3f'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async () => {
    if (!selectedComplaint || !replyMessage.trim()) return;

    setLoading(true);
    try {
      const complaintDocRef = doc(db, 'complaints', selectedComplaint.id);
      const messagesCollection = collection(complaintDocRef, 'messages');

      // Add reply message
      await addDoc(messagesCollection, {
        text: replyMessage.trim(),
        sentBy: 'admin',
        timestamp: Timestamp.now(),
        isAdmin: true
      });

      // Update complaint metadata
      await setDoc(complaintDocRef, {
        lastUpdatedAt: new Date(),
        lastTextBy: 'admin'
      }, { merge: true });

      // Update local state
      const newMessage = {
        text: replyMessage.trim(),
        sentBy: 'admin',
        timestamp: Timestamp.now(),
        isAdmin: true
      };
      
      setComplaintMessages([...complaintMessages, newMessage]);
      
      setComplaints(complaints.map(c =>
        c.id === selectedComplaint.id ? {
          ...c,
          lastUpdatedAt: new Date(),
          lastTextBy: 'admin',
          messages: [
            ...(c.messages || []),
            newMessage
          ]
        } : c
      ));

      Swal.fire({
        icon: 'success',
        title: 'Reply Sent',
        text: 'Your reply has been sent to the student',
        confirmButtonColor: '#001f3f'
      });

      setReplyMessage('');
    } catch (error) {
      console.error('Error sending reply:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to send reply',
        confirmButtonColor: '#001f3f'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (complaintId) => {
    Swal.fire({
      icon: 'warning',
      title: 'Delete Complaint',
      text: 'Are you sure you want to delete this complaint? This action cannot be undone.',
      showCancelButton: true,
      confirmButtonColor: '#d32f2f',
      cancelButtonColor: '#001f3f',
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const complaintDocRef = doc(db, 'complaints', complaintId);
          await deleteDoc(complaintDocRef);

          setComplaints(complaints.filter(c => c.id !== complaintId));

          Swal.fire({
            icon: 'success',
            title: 'Deleted',
            text: 'Complaint has been deleted',
            confirmButtonColor: '#001f3f'
          });
        } catch (error) {
          console.error('Error deleting complaint:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to delete complaint',
            confirmButtonColor: '#001f3f'
          });
        }
      }
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
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
        <title>Manage Complaints - Admin Panel</title>
        <meta name="description" content="Admin panel for managing student complaints" />
      </Helmet>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton
              onClick={() => navigate('/admin/dashboard')}
              sx={{ color: '#001f3f' }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Box>
              <Typography variant="h3" sx={{ color: '#001f3f', fontWeight: 'bold', mb: 1 }}>
                Manage Complaints
              </Typography>
              <Typography variant="body1" sx={{ color: '#666' }}>
                {complaints.length} total complaint{complaints.length !== 1 ? 's' : ''}
              </Typography>
            </Box>
          </Box>
          <Button
            variant="outlined"
            startIcon={<CloseIcon />}
            onClick={() => {
              logout();
              navigate('/admin/login');
            }}
            sx={{ borderColor: '#d32f2f', color: '#d32f2f', fontWeight: 'bold' }}
          >
            Logout
          </Button>
        </Box>

        {/* Search and Filter Bar */}
        <Paper sx={{ p: 3, mb: 3, borderRadius: '12px', background: 'linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%)' }}>
          <Typography variant="h6" sx={{ mb: 2, color: '#001f3f', fontWeight: 'bold' }}>
            Search & Filter Complaints
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            {/* Search Bar */}
            <TextField
              label="Search by Student ID, Title, or Email"
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(0);
              }}
              sx={{ flexGrow: 1, minWidth: '250px' }}
            />
            
            {/* Department Filter */}
            <TextField
              label="Filter by Department"
              select
              variant="outlined"
              size="small"
              value={filterDepartment}
              onChange={(e) => {
                setFilterDepartment(e.target.value);
                setPage(0);
              }}
              sx={{ minWidth: '180px' }}
            >
              <MenuItem value="">All Departments</MenuItem>
              {uniqueDepartments.map((dept) => (
                <MenuItem key={dept} value={dept}>
                  {dept}
                </MenuItem>
              ))}
            </TextField>
            
            {/* Status Filter */}
            <TextField
              label="Filter by Status"
              select
              variant="outlined"
              size="small"
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPage(0);
              }}
              sx={{ minWidth: '150px' }}
            >
              <MenuItem value="">All Status</MenuItem>
              {statuses.map((status) => (
                <MenuItem key={status} value={status}>
                  <Box sx={{ textTransform: 'capitalize' }}>{status}</Box>
                </MenuItem>
              ))}
            </TextField>
            
            {/* Clear Filters Button */}
            {(searchTerm || filterDepartment || filterStatus) && (
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  setSearchTerm('');
                  setFilterDepartment('');
                  setFilterStatus('');
                  setPage(0);
                }}
                sx={{ color: '#d32f2f', borderColor: '#d32f2f' }}
              >
                Clear Filters 
              </Button>
            )}
          </Box>
          <Typography variant="body2" sx={{ mt: 2, color: '#666' }}>
            Showing {filteredComplaints.length} of {complaints.length} complaint{complaints.length !== 1 ? 's' : ''}
          </Typography>
        </Paper>

        {/* Complaints Table */}
        <Paper sx={{ borderRadius: '12px', overflow: 'hidden' }}>
          <TableContainer sx={{ maxHeight: 'calc(100vh - 300px)' }}>
            <Table  >
              <TableHead >
                <TableRow sx={{ bgcolor: '#001f3f !important' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold', width: '110px' }}>Student ID</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold', width: '150px' }}>Title</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold', width: '180px' }}>Email</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold', width: '130px' }}>Department</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold', width: '100px' }}>Status</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold', width: '140px' }}>Opened</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold', width: '140px' }}>Last Updated</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold', width: '120px' }} align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredComplaints.length > 0 ? (
                  filteredComplaints.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((complaint) => (
                    <TableRow key={complaint.id} sx={{ '&:hover': { background: '#f5f5f5' } }}>
                      <TableCell sx={{ fontWeight: '500', width: '110px' }}>{complaint.studentId}</TableCell>
                      <TableCell sx={{ width: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <Typography variant="body2" title={complaint.title}>
                          {complaint.title}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ width: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <Typography variant="body2" title={complaint.email}>
                          {complaint.email}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ width: '130px' }}>{complaint.department}</TableCell>
                      <TableCell sx={{ width: '100px' }}>
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
                      </TableCell>
                      <TableCell sx={{ fontSize: '12px', width: '140px' }}>{formatDate(complaint.openedAt)}</TableCell>
                      <TableCell sx={{ fontSize: '12px', width: '140px' }}>{formatDate(complaint.lastUpdatedAt)}</TableCell>
                      <TableCell align="center" sx={{ width: '120px' }}>
                        <IconButton
                          size="small"
                          onClick={() => handleEditClick(complaint)}
                          sx={{ color: '#1976d2' }}
                          title="Change Status"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleReplyClick(complaint)}
                          sx={{ color: '#4caf50' }}
                          title="Send Reply"
                        >
                          <Typography variant="caption" sx={{ fontWeight: 'bold' }}>💬</Typography>
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(complaint.id)}
                          sx={{ color: '#d32f2f' }}
                          title="Delete"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <Typography variant="body1" sx={{ color: '#999' }}>
                        {searchTerm || filterDepartment || filterStatus ? 'No complaints match your filters' : 'No complaints yet'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          {filteredComplaints.length > 0 && (
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={filteredComplaints.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              sx={{
                background: '#f5f5f5',
                borderTop: '1px solid #ddd'
              }}
            />
          )}
        </Paper>
      </Container>

      {/* Edit Status Dialog */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ background: '#001f3f', color: 'white', fontWeight: 'bold' }}>
          Change Complaint Status
        </DialogTitle>
        <DialogContent sx={{ pt: 4, mt: 2 }}>
          <TextField
            fullWidth
            select
            label="Status"
            value={editStatus}
            onChange={(e) => setEditStatus(e.target.value)}
            variant="outlined"
          >
            <MenuItem value="open">Open</MenuItem>
            <MenuItem value="in-progress">In Progress</MenuItem>
            <MenuItem value="resolved">Resolved</MenuItem>
            <MenuItem value="closed">Closed</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
          <Button
            onClick={handleStatusChange}
            disabled={loading}
            variant="contained"
            sx={{ background: '#001f3f' }}
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reply Dialog with Chat */}
      <Dialog open={openReplyDialog} onClose={() => setOpenReplyDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { height: '80vh', maxHeight: '80vh', display: 'flex', flexDirection: 'column' } }}>
        <DialogTitle sx={{ background: '#001f3f', color: 'white', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Chat with {selectedComplaint?.studentId}</span>
          <IconButton
            onClick={() => setOpenReplyDialog(false)}
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
          <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
            <strong>Complaint:</strong> {selectedComplaint?.title}
          </Typography>

          {/* Messages Display */}
          {complaintMessages && complaintMessages.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, pt: 2, px:1, overflowY: 'auto', }}>
              {complaintMessages.map((message, idx) => (
                <Box
                  key={idx}
                  sx={{
                    display: 'flex',
                    justifyContent: message.sentBy === 'admin' ? 'flex-end' : 'flex-start',
                    px: 0,
                    mb: 1
                  }}
                >
                  <Paper
                    sx={{
                      p: 1.5,
                      maxWidth: '70%',
                      background: message.sentBy === 'admin' ? '#001f3f' : '#fff',
                      color: message.sentBy === 'admin' ? '#fff' : '#333',
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

        {/* Message Input */}
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
            placeholder="Type your reply..."
            value={replyMessage}
            onChange={(e) => setReplyMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendReply();
              }
            }}
            multiline
            maxRows={3}
            variant="outlined"
            size="small"
            disabled={loading}
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
                    onClick={handleSendReply}
                    disabled={!replyMessage.trim() || loading}
                    sx={{
                      color: replyMessage.trim() ? '#001f3f' : '#ccc'
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
      </Dialog>
    </>
  );
};

export default AdminComplaints;
