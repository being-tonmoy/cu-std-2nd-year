import React, { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import TableSortLabel from '@mui/material/TableSortLabel';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import InputAdornment from '@mui/material/InputAdornment';




import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
  searchStudents,
  addStudentData,
  updateStudentData,
  deleteStudentData,
  importStudentsFromCSVBatched,
  getAllSubmissions
} from '../services/firestoreService';

const StudentDataManager = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('student_id');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState({
    student_id: '',
    name: '',
    subject: '',
    faculty: ''
  });

  // Load submissions on mount only
  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    try {
      const submissionData = await getAllSubmissions();
      setSubmissions(submissionData || []);
    } catch (error) {
      console.error('Error loading submissions:', error);
    }
  };

  const performSearch = useCallback(async () => {
    try {
      setSearchLoading(true);
      const studentData = await searchStudents(searchTerm);
      setStudents(studentData);
      setHasSearched(true);
      setPage(0);
    } catch (error) {
      console.error('Error searching students:', error);
      Swal.fire({
        icon: 'error',
        title: 'Search Error',
        text: 'Failed to search students'
      });
    } finally {
      setSearchLoading(false);
    }
  }, [searchTerm]);

  // Search students whenever search term changes (with debounce)
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchTerm.trim().length > 0) {
        performSearch();
      } else {
        setStudents([]);
        setHasSearched(false);
        setPage(0);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, performSearch]);

  // Check if eligible student's faculty matches any submission's department
  const getStudentVerification = (student) => {
    const matchingSubmissions = submissions.filter(sub => 
      sub.studentId === student.student_id
    );

    if (matchingSubmissions.length === 0) {
      return { matched: false, message: 'No submissions' };
    }

    for (const submission of matchingSubmissions) {
      if (submission.facultyAlias === student.faculty && 
          submission.department === student.subject) {
        return { matched: true, message: 'Verified' };
      }
    }

    return { matched: false, message: 'Mismatch' };
  };

  // Since students array now only contains search results, no need to filter
  const filteredStudents = students;

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const getSortedStudents = () => {
    const sorted = [...filteredStudents].sort((a, b) => {
      let aValue = a[orderBy];
      let bValue = b[orderBy];

      if (aValue < bValue) {
        return order === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return order === 'asc' ? 1 : -1;
      }
      return 0;
    });
    return sorted;
  };

  const handleOpenDialog = (student = null) => {
    if (student) {
      setEditingStudent(student);
      setFormData(student);
    } else {
      setEditingStudent(null);
      setFormData({
        student_id: '',
        name: '',
        subject: '',
        faculty: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingStudent(null);
  };

  const handleSaveStudent = async () => {
    if (!formData.student_id.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Validation Error',
        text: 'Student ID is required'
      });
      return;
    }

    try {
      if (editingStudent) {
        // Update existing student
        await updateStudentData(editingStudent.id || editingStudent.student_id, {
          name: formData.name,
          subject: formData.subject,
          faculty: formData.faculty
        });
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Student data updated successfully',
          timer: 2000,
          confirmButtonColor: '#001f3f'
        });
      } else {
        // Add new student
        await addStudentData(formData);
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Student added successfully',
          timer: 2000,
          confirmButtonColor: '#001f3f'
        });
      }
      handleCloseDialog();
      // Refresh search results if there's an active search
      if (hasSearched && searchTerm.trim().length > 0) {
        performSearch();
      }
    } catch (error) {
      console.error('Error saving student:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to save student data'
      });
    }
  };

  const handleDeleteStudent = async (studentId) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Confirm Delete',
      text: 'Are you sure you want to delete this student?',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#d32f2f'
    });

    if (result.isConfirmed) {
      try {
        await deleteStudentData(studentId);
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Student deleted successfully',
          timer: 2000,
          confirmButtonColor: '#001f3f'
        });
        // Refresh search results if there's an active search
        if (hasSearched && searchTerm.trim().length > 0) {
          performSearch();
        }
      } catch (error) {
        console.error('Error deleting student:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to delete student'
        });
      }
    }
  };

  const handleCSVUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const csv = e.target.result;
        const lines = csv.split('\n');
        const csvStudents = [];

        // Skip header row, parse CSV data
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const [student_id, name, subject, faculty] = line.split(',').map(v => v.trim());
          if (student_id) {
            csvStudents.push({ student_id, name, subject, faculty });
          }
        }

        if (csvStudents.length === 0) {
          Swal.fire({
            icon: 'warning',
            title: 'No Data',
            text: 'No valid student records found in the CSV file'
          });
          return;
        }

        // Show preview and confirmation
        const result = await Swal.fire({
          icon: 'info',
          title: 'Import Confirmation',
          html: `<p>Found <strong>${csvStudents.length}</strong> students to import.</p>
                 <p><strong>Note:</strong> Only new students (not already in the system) will be uploaded.</p>
                 <p>Import will process in batches of 500 to avoid network issues.</p>
                 <p style="color: #ff6b6b; margin-top: 15px;">
                   <strong>Continue?</strong>
                 </p>`,
          showCancelButton: true,
          confirmButtonText: 'Yes, import',
          cancelButtonText: 'Cancel',
          confirmButtonColor: '#001f3f'
        });

        if (result.isConfirmed) {
          // Show progress dialog
          Swal.fire({
            title: 'Importing Students',
            html: '<div id="progress-message">Starting import...</div>',
            icon: 'info',
            allowOutsideClick: false,
            allowEscapeKey: false,
            didOpen: async () => {
              try {
                const importResult = await importStudentsFromCSVBatched(csvStudents, (progress) => {
                  const message = `${progress.current}/${progress.total}: ${progress.message}`;
                  const messageEl = document.getElementById('progress-message');
                  if (messageEl) {
                    messageEl.textContent = message;
                  }
                });

                // Show final results
                Swal.fire({
                  icon: 'success',
                  title: 'Import Complete',
                  html: `
                    <p><strong>${importResult.successCount}</strong> new students imported</p>
                    ${importResult.skippedCount > 0 ? `<p style="color: #ffa500;"><strong>${importResult.skippedCount}</strong> students skipped (already exist)</p>` : ''}
                    ${importResult.errorCount > 0 ? `<p style="color: #d32f2f;"><strong>${importResult.errorCount}</strong> students failed</p>` : ''}
                  `,
                  confirmButtonText: 'OK',
                  confirmButtonColor: '#001f3f'
                });

                // Refresh search results if there's an active search
                if (hasSearched && searchTerm.trim().length > 0) {
                  performSearch();
                }
              } catch (error) {
                console.error('Error during import:', error);
                Swal.fire({
                  icon: 'error',
                  title: 'Import Failed',
                  text: error.message,
                  confirmButtonColor: '#001f3f'
                });
              }
            }
          });
        }
      } catch (error) {
        console.error('Error parsing CSV:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to parse CSV file'
        });
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset file input
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const sortedStudents = getSortedStudents();
  const paginatedStudents = sortedStudents.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
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
            <Typography variant="h3" sx={{ color: '#001f3f', fontWeight: 'bold' }}>
              Eligible Students Management
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{ backgroundColor: '#001f3f' }}
          >
            Add Student
          </Button>

          <Button
            variant="outlined"
            component="label"
            startIcon={<FileUploadIcon />}
            sx={{ borderColor: '#001f3f', color: '#001f3f' }}
          >
            Import CSV
            <input
              type="file"
              accept=".csv"
              hidden
              onChange={handleCSVUpload}
            />
          </Button>
        </Box>
      </Box>

      {/* Search Box */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search by Student ID, Name, or Faculty..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#999', mr: 1 }} />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      {/* Results Count */}
      <Box sx={{ mb: 2 }}>
        {hasSearched && (
          <Typography variant="body2" sx={{ color: '#666' }}>
            Found: <strong>{filteredStudents.length}</strong> student(s)
          </Typography>
        )}
      </Box>

      {/* Table */}
      {searchLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : !hasSearched ? (
        <Alert severity="info">
          Start typing a student ID, name, or faculty to search for eligible students. This helps prevent exceeding Firebase quotas.
        </Alert>
      ) : filteredStudents.length === 0 ? (
        <Alert severity="info">
          No students match your search criteria.
        </Alert>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead sx={{ bgcolor: '#001f3f' }}>
                <TableRow>
                  <TableCell
                    sx={{ 
                      color: 'white', 
                      fontWeight: 'bold',
                      backgroundColor: '#001f3f',
                      fontSize: '0.875rem',
                      padding: '8px 4px'
                    }}
                    sortDirection={orderBy === 'student_id' ? order : false}
                  >
                    <TableSortLabel
                      active={orderBy === 'student_id'}
                      direction={orderBy === 'student_id' ? order : 'asc'}
                      onClick={() => handleRequestSort('student_id')}
                      sx={{
                        color: 'white',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.1)'
                        },
                        '& .MuiTableSortLabel-icon': { 
                          color: 'white !important'
                        },
                        '&.Mui-active': {
                          color: 'white'
                        }
                      }}
                    >
                      Student ID
                    </TableSortLabel>
                  </TableCell>
                  <TableCell
                    sx={{ 
                      color: 'white', 
                      fontWeight: 'bold',
                      backgroundColor: '#001f3f',
                      fontSize: '0.875rem',
                      padding: '8px 4px'
                    }}
                    sortDirection={orderBy === 'name' ? order : false}
                  >
                    <TableSortLabel
                      active={orderBy === 'name'}
                      direction={orderBy === 'name' ? order : 'asc'}
                      onClick={() => handleRequestSort('name')}
                      sx={{
                        color: 'white',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.1)'
                        },
                        '& .MuiTableSortLabel-icon': { 
                          color: 'white !important'
                        },
                        '&.Mui-active': {
                          color: 'white'
                        }
                      }}
                    >
                      Name
                    </TableSortLabel>
                  </TableCell>
                  <TableCell
                    sx={{ 
                      color: 'white', 
                      fontWeight: 'bold',
                      backgroundColor: '#001f3f',
                      fontSize: '0.875rem',
                      padding: '8px 4px'
                    }}
                    sortDirection={orderBy === 'subject' ? order : false}
                  >
                    <TableSortLabel
                      active={orderBy === 'subject'}
                      direction={orderBy === 'subject' ? order : 'asc'}
                      onClick={() => handleRequestSort('subject')}
                      sx={{
                        color: 'white',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.1)'
                        },
                        '& .MuiTableSortLabel-icon': { 
                          color: 'white !important'
                        },
                        '&.Mui-active': {
                          color: 'white'
                        }
                      }}
                    >
                      Subject
                    </TableSortLabel>
                  </TableCell>
                  <TableCell
                    sx={{ 
                      color: 'white', 
                      fontWeight: 'bold',
                      backgroundColor: '#001f3f',
                      fontSize: '0.875rem',
                      padding: '8px 4px'
                    }}
                    sortDirection={orderBy === 'faculty' ? order : false}
                  >
                    <TableSortLabel
                      active={orderBy === 'faculty'}
                      direction={orderBy === 'faculty' ? order : 'asc'}
                      onClick={() => handleRequestSort('faculty')}
                      sx={{
                        color: 'white',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.1)'
                        },
                        '& .MuiTableSortLabel-icon': { 
                          color: 'white !important'
                        },
                        '&.Mui-active': {
                          color: 'white'
                        }
                      }}
                    >
                      Faculty
                    </TableSortLabel>
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      color: 'white', 
                      fontWeight: 'bold',
                      backgroundColor: '#001f3f',
                      fontSize: '0.875rem',
                      padding: '8px 4px',
                      width: '100px'
                    }} 
                    align="center"
                  >
                    Status
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      color: 'white', 
                      fontWeight: 'bold',
                      backgroundColor: '#001f3f',
                      fontSize: '0.875rem',
                      padding: '8px 4px'
                    }} 
                    align="right"
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedStudents.map((student) => (
                  <TableRow 
                    key={student.id || student.student_id}
                    hover
                    sx={{ 
                      height: '40px',
                      '&:hover': { bgcolor: '#f5f5f5' }
                    }}
                  >
                    <TableCell sx={{ padding: '4px 8px', fontSize: '0.85rem' }}>
                      {student.student_id}
                    </TableCell>
                    <TableCell sx={{ padding: '4px 8px', fontSize: '0.85rem' }}>
                      {student.name || 'N/A'}
                    </TableCell>
                    <TableCell sx={{ padding: '4px 8px', fontSize: '0.85rem' }}>
                      {student.subject || 'N/A'}
                    </TableCell>
                    <TableCell sx={{ padding: '4px 8px', fontSize: '0.85rem' }}>
                      {student.faculty || 'N/A'}
                    </TableCell>
                    <TableCell align="center" sx={{ padding: '4px 8px', fontSize: '0.85rem', width: '100px' }}>
                      {(() => {
                        const verification = getStudentVerification(student);
                        const icon = verification.matched ? (
                          <Tooltip title={verification.message}>
                            <CheckCircleIcon sx={{ color: '#4caf50', fontSize: '1.2rem' }} />
                          </Tooltip>
                        ) : (
                          <Tooltip title={verification.message}>
                            <BlockIcon sx={{ color: '#f44336', fontSize: '1.2rem' }} />
                          </Tooltip>
                        );
                        return icon;
                      })()}
                    </TableCell>
                    <TableCell align="right" sx={{ padding: '4px 4px', width: '100px' }}>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(student)}
                          sx={{ color: '#1976d2', padding: '2px' }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteStudent(student.id || student.student_id)}
                          sx={{ color: '#d32f2f', padding: '2px' }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          <TablePagination
            rowsPerPageOptions={[10, 25, 50, 100]}
            component="div"
            count={filteredStudents.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </>
      )}

      {/* Edit/Add Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ backgroundColor: '#001f3f', color: 'white' }}>
          {editingStudent ? 'Edit Student' : 'Add New Student'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            fullWidth
            label="Student ID"
            value={formData.student_id}
            onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
            disabled={!!editingStudent}
            margin="normal"
            placeholder="e.g., 2503011121"
          />
          <TextField
            fullWidth
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            margin="normal"
            placeholder="Full Name"
          />
          <TextField
            fullWidth
            label="Subject"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            margin="normal"
            placeholder="e.g., Accounting"
          />
          <TextField
            fullWidth
            label="Faculty"
            value={formData.faculty}
            onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
            margin="normal"
            placeholder="e.g., fba (Faculty alias)"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSaveStudent}
            variant="contained"
            sx={{ backgroundColor: '#001f3f' }}
          >
            {editingStudent ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default StudentDataManager;
