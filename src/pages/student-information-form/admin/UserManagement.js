import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  IconButton,
  Tooltip,
  Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import RefreshIcon from '@mui/icons-material/Refresh';
import LogoutIcon from '@mui/icons-material/Logout';
import Swal from 'sweetalert2';
import { useAuth } from '../../../contexts/AuthContext';
import { 
  getAllAdminUsers, 
  createAdminUser, 
  updateAdminUser, 
  deleteAdminUser 
} from '../../../services/firestoreService';
import { generatePassword } from '../../../utils/validation';

const UserManagement = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    password: '',
    role: 'admin',
    isActive: true
  });
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await getAllAdminUsers();
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load users',
        confirmButtonColor: '#001f3f'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        email: user.email,
        name: user.name,
        password: '',
        role: user.role,
        isActive: user.isActive !== false
      });
    } else {
      setEditingUser(null);
      setFormData({
        email: '',
        name: '',
        password: '',
        role: 'admin',
        isActive: true
      });
    }
    setPasswordError('');
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingUser(null);
    setPasswordError('');
  };

  const handleGeneratePassword = () => {
    const newPassword = generatePassword();
    setFormData({ ...formData, password: newPassword });
    setPasswordError('');
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(formData.password);
    Swal.fire({
      icon: 'success',
      title: 'Copied',
      text: 'Password copied to clipboard',
      timer: 1500,
      confirmButtonColor: '#001f3f'
    });
  };

  const handleSaveUser = async () => {
    // Validation
    if (!formData.email.trim()) {
      setPasswordError('Email is required');
      return;
    }
    if (!formData.name.trim()) {
      setPasswordError('Name is required');
      return;
    }
    if (!editingUser && !formData.password.trim()) {
      setPasswordError('Password is required for new users');
      return;
    }
    if (editingUser && formData.password && formData.password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      if (editingUser) {
        // Update user
        await updateAdminUser(editingUser.email, {
          name: formData.name,
          role: formData.role,
          isActive: formData.isActive,
          ...(formData.password && { password: formData.password })
        });
      } else {
        // Create new user
        await createAdminUser({
          email: formData.email,
          name: formData.name,
          password: formData.password,
          role: formData.role
        });
      }

      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: editingUser ? 'User updated successfully' : 'User created successfully',
        timer: 2000,
        confirmButtonColor: '#001f3f'
      });

      handleCloseDialog();
      await loadUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      setPasswordError(error.message || 'Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (email) => {
    const result = await Swal.fire({
      title: 'Confirm Delete',
      text: `Are you sure you want to delete user ${email}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d32f2f',
      cancelButtonColor: '#757575',
      confirmButtonText: 'Delete'
    });

    if (result.isConfirmed) {
      try {
        setLoading(true);
        await deleteAdminUser(email);
        Swal.fire({
          icon: 'success',
          title: 'Deleted',
          text: 'User deleted successfully',
          timer: 2000,
          confirmButtonColor: '#001f3f'
        });
        await loadUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to delete user',
          confirmButtonColor: '#001f3f'
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/student-information-form/login');
  };

  return (
    <>
      <Helmet>
        <title>User Management - Student Information Form</title>
        <meta name="description" content="Manage admin users and permissions" />
      </Helmet>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h3" sx={{ color: '#001f3f', fontWeight: 'bold' }}>
            User Management
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              sx={{ bgcolor: '#003d7a', '&:hover': { bgcolor: '#002147' } }}
            >
              New User
            </Button>
            <Tooltip title="Refresh">
              <IconButton onClick={loadUsers} disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Button
              variant="outlined"
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
              sx={{ borderColor: '#d32f2f', color: '#d32f2f' }}
            >
              Logout
            </Button>
          </Box>
        </Box>

        {/* Users Table */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead sx={{ bgcolor: '#001f3f' }}>
                <TableRow>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Email</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Name</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Role</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.email} hover>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>
                        <Box
                          sx={{
                            display: 'inline-block',
                            px: 2,
                            py: 0.5,
                            bgcolor: user.role === 'superadmin' ? '#e3f2fd' : '#f5f5f5',
                            color: user.role === 'superadmin' ? '#1565c0' : '#666',
                            borderRadius: '4px',
                            fontSize: '0.875rem',
                            fontWeight: 'bold'
                          }}
                        >
                          {user.role === 'superadmin' ? 'Super Admin' : 'Admin'}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{
                            display: 'inline-block',
                            px: 2,
                            py: 0.5,
                            bgcolor: user.isActive !== false ? '#c8e6c9' : '#ffcccc',
                            color: user.isActive !== false ? '#2e7d32' : '#c62828',
                            borderRadius: '4px',
                            fontSize: '0.875rem',
                            fontWeight: 'bold'
                          }}
                        >
                          {user.isActive !== false ? 'Active' : 'Inactive'}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(user)}
                            sx={{ color: '#1976d2' }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteUser(user.email)}
                            sx={{ color: '#d32f2f' }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Create/Edit User Dialog */}
        <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ bgcolor: '#001f3f', color: 'white', fontWeight: 'bold' }}>
            {editingUser ? 'Edit User' : 'Create New User'}
          </DialogTitle>
          <DialogContent sx={{ pt: 4 }}>
            {passwordError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {passwordError}
              </Alert>
            )}

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Email"
                type="email"
                fullWidth
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={!!editingUser}
                placeholder="admin@example.com"
              />

              <TextField
                label="Full Name"
                fullWidth
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
              />

              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                  Password
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <TextField
                    label={editingUser ? "Password (leave empty to keep current)" : "Password"}
                    type="text"
                    fullWidth
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Enter or generate password"
                  />
                  {formData.password && (
                    <Tooltip title="Copy">
                      <IconButton onClick={handleCopyPassword} size="small">
                        <ContentCopyIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleGeneratePassword}
                  sx={{ textTransform: 'none', color: '#003d7a', borderColor: '#003d7a' }}
                >
                  Generate Random Password (12 chars)
                </Button>
              </Box>

              <Select
                label="Role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                fullWidth
              >
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="superadmin">Super Admin</MenuItem>
              </Select>

              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                }
                label="Active"
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button
              onClick={handleSaveUser}
              variant="contained"
              sx={{ bgcolor: '#003d7a', '&:hover': { bgcolor: '#002147' } }}
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
};

export default UserManagement;
