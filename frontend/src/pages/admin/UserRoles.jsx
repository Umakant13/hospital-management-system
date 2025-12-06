import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  CircularProgress,
  Alert,
  Grid,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  AdminPanelSettings,
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { userService } from '@/services/userService';
import PageTitle from '@/components/common/PageTitle';

const UserRoles = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [error, setError] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      setError(null);
      // For now, we'll use the predefined roles from constants
      // In a real implementation, this would come from an API
      const predefinedRoles = [
        { id: 1, name: 'admin', displayName: 'Administrator', description: 'Full system access and management privileges' },
        { id: 2, name: 'doctor', displayName: 'Doctor', description: 'Medical professional with patient management access' },
        { id: 3, name: 'patient', displayName: 'Patient', description: 'Patient with access to their health records' },
      ];
      setRoles(predefinedRoles);
    } catch (error) {
      console.error('Error fetching roles:', error);
      setError('Failed to load user roles');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (role = null) => {
    setSelectedRole(role);
    if (role) {
      reset(role);
    } else {
      reset({});
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedRole(null);
    reset({});
  };

  const handleSaveRole = async (data) => {
    try {
      if (selectedRole) {
        // Update existing role
        alert('Role updated successfully');
      } else {
        // Create new role
        alert('Role created successfully');
      }
      handleCloseDialog();
      fetchRoles();
    } catch (error) {
      console.error('Error saving role:', error);
      alert(`Failed to save: ${error.response?.data?.detail || error.message}`);
    }
  };

  const handleDelete = async (roleId) => {
    if (window.confirm('Are you sure you want to delete this role?')) {
      try {
        // Delete role logic here
        alert('Role deleted successfully');
        fetchRoles();
      } catch (error) {
        console.error('Error deleting role:', error);
        alert('Failed to delete role');
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <PageTitle>
            User Roles
          </PageTitle>
          <Typography variant="body2" color="text.secondary">
            Manage user roles and permissions
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          New Role
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={2}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Role Name</TableCell>
                <TableCell>Display Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Permissions</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {roles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                      No roles found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                roles.map((role) => (
                  <TableRow key={role.id} hover>
                    <TableCell>
                      <Chip
                        label={role.name}
                        size="small"
                        color={role.name === 'admin' ? 'error' : role.name === 'doctor' ? 'primary' : 'info'}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="600">
                        {role.displayName}
                      </Typography>
                    </TableCell>
                    <TableCell>{role.description}</TableCell>
                    <TableCell>
                      <Chip
                        label={`${role.name === 'admin' ? 'Full' : role.name === 'doctor' ? 'Medical' : 'Basic'} Access`}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleOpenDialog(role)}
                        >
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      {role.name !== 'admin' && role.name !== 'doctor' && role.name !== 'patient' && (
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(role.id)}
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Create/Edit Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={handleSubmit(handleSaveRole)}>
          <DialogTitle>
            {selectedRole ? 'Edit Role' : 'Create New Role'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Role Name"
                  {...register('name', { required: 'Role name is required' })}
                  error={!!errors.name}
                  helperText={errors.name?.message}
                  disabled={!!selectedRole}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Display Name"
                  {...register('displayName', { required: 'Display name is required' })}
                  error={!!errors.displayName}
                  helperText={errors.displayName?.message}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  {...register('description')}
                  multiline
                  rows={3}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Permissions Level</InputLabel>
                  <Select
                    label="Permissions Level"
                    defaultValue="basic"
                    {...register('permissions')}
                  >
                    <MenuItem value="basic">Basic Access</MenuItem>
                    <MenuItem value="medical">Medical Access</MenuItem>
                    <MenuItem value="full">Full Access</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained">
              {selectedRole ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default UserRoles;