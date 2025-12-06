import React, { useState, useEffect } from 'react';
import {
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
  TablePagination,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Avatar,
  Tooltip,
  MenuItem,
  Rating,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  Add,
  Search,
  Edit,
  Visibility,
  MedicalServices,
  Star,
  Delete,
} from '@mui/icons-material';
import { doctorService } from '@/services/doctorService';
import { userService } from '@/services/userService';
import { departmentService } from '@/services/departmentService';
import { useForm } from 'react-hook-form';
import { getInitials } from '@/utils/helpers';
import PageTitle from '@/components/common/PageTitle';
import AIFillButton from '@/components/common/AIFillButton';

const ManageDoctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [specializationFilter, setSpecializationFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    fetchDoctors();
    fetchUsers();
    fetchDepartments();
  }, [page, rowsPerPage, searchQuery, specializationFilter, departmentFilter]);

  const fetchDoctors = async () => {
    try {
      const params = {
        skip: page * rowsPerPage,
        limit: rowsPerPage,
        search: searchQuery,
      };

      if (specializationFilter) params.specialization = specializationFilter;
      if (departmentFilter) params.department_id = departmentFilter;

      const data = await doctorService.getAllDoctors(params);
      setDoctors(data);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await userService.getAllUsers({ role: 'doctor' });
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const data = await departmentService.getAllDepartments();
      setDepartments(data);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const handleOpenDialog = (doctor = null) => {
    setSelectedDoctor(doctor);
    if (doctor) {
      reset(doctor);
    } else {
      reset({});
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedDoctor(null);
    reset({});
  };

  const handleOpenViewDialog = (doctor) => {
    setSelectedDoctor(doctor);
    setOpenViewDialog(true);
  };

  const handleCloseViewDialog = () => {
    setOpenViewDialog(false);
    setSelectedDoctor(null);
  };

  const handleSaveDoctor = async (data) => {
    try {
      const doctorData = {
        ...data,
        available_days: Array.isArray(data.available_days)
          ? data.available_days
          : data.available_days?.split(',').map(d => d.trim()),
      };

      if (selectedDoctor) {
        await doctorService.updateDoctor(selectedDoctor.doctor_id, doctorData);
      } else {
        await doctorService.createDoctor(doctorData);
      }
      handleCloseDialog();
      fetchDoctors();
    } catch (error) {
      console.error('Error saving doctor:', error);
      alert('Failed to save doctor');
    }
  };

  const handleDeleteDoctor = async () => {
    try {
      await doctorService.deleteDoctor(selectedDoctor.doctor_id);
      setOpenDeleteDialog(false);
      setSelectedDoctor(null);
      fetchDoctors();
    } catch (error) {
      console.error('Error deleting doctor:', error);
      alert('Failed to delete doctor');
    }
  };

  const handleToggleActive = async (doctorId, currentStatus) => {
    try {
      await doctorService.updateDoctor(doctorId, { is_active: !currentStatus });
      fetchDoctors();
    } catch (error) {
      console.error('Error toggling doctor status:', error);
      alert('Failed to update doctor status');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <PageTitle>
          Manage Doctors
        </PageTitle>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Add Doctor
        </Button>
      </Box>

      <Paper elevation={2} sx={{ p: 3 }}>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search doctors by name or specialization..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(0);
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Specialization</InputLabel>
              <Select
                value={specializationFilter}
                label="Specialization"
                onChange={(e) => {
                  setSpecializationFilter(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="Cardiologist">Cardiologist</MenuItem>
                <MenuItem value="Neurologist">Neurologist</MenuItem>
                <MenuItem value="Pediatrician">Pediatrician</MenuItem>
                <MenuItem value="Orthopedic">Orthopedic</MenuItem>
                <MenuItem value="Dermatologist">Dermatologist</MenuItem>
                <MenuItem value="General">General</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Department</InputLabel>
              <Select
                value={departmentFilter}
                label="Department"
                onChange={(e) => {
                  setDepartmentFilter(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="">All</MenuItem>
                {departments.map((dept) => (
                  <MenuItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Doctor</TableCell>
                <TableCell>Doctor ID</TableCell>
                <TableCell>Specialization</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Experience</TableCell>
                <TableCell>Rating</TableCell>
                <TableCell>Fee</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {doctors.map((doctor) => (
                <TableRow key={doctor.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ mr: 2, bgcolor: 'success.main' }}>
                        {getInitials(doctor.user?.full_name || 'D')}
                      </Avatar>
                      <Box>
                        <Typography variant="body1" fontWeight="medium">
                          {doctor.user?.full_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {doctor.user?.email}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip label={doctor.doctor_id} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={<MedicalServices />}
                      label={doctor.specialization}
                      size="small"
                      color="primary"
                    />
                  </TableCell>
                  <TableCell>
                    {doctor.department?.name || 'Not Assigned'}
                  </TableCell>
                  <TableCell>{doctor.experience_years} years</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Rating value={doctor.rating} readOnly size="small" />
                      <Typography variant="caption" sx={{ ml: 1 }}>
                        ({doctor.total_reviews})
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>₹{doctor.consultation_fee}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="View">
                      <IconButton size="small" color="info" onClick={() => handleOpenViewDialog(doctor)}>
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleOpenDialog(doctor)}
                      >
                        <Edit />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => {
                          setSelectedDoctor(doctor);
                          setOpenDeleteDialog(true);
                        }}
                      >
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={100}
          page={page}
          onPageChange={(event, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Paper>

      {/* View Doctor Details Dialog */}
      <Dialog open={openViewDialog} onClose={handleCloseViewDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'white', color: 'primary.main' }}>
            {selectedDoctor && getInitials(selectedDoctor.user?.full_name)}
          </Avatar>
          <Box>
            <Typography variant="h6">
              {selectedDoctor?.user?.full_name}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              {selectedDoctor?.specialization}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {selectedDoctor && (
            <Grid container spacing={3}>
              {/* Professional Information */}
              <Grid item xs={12}>
                <Typography variant="h6" color="primary" gutterBottom sx={{ borderBottom: 1, borderColor: 'divider', pb: 1 }}>
                  Professional Information
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Doctor ID</Typography>
                <Typography variant="body1">{selectedDoctor.doctor_id}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">License Number</Typography>
                <Typography variant="body1">{selectedDoctor.license_number}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Department</Typography>
                <Chip
                  label={selectedDoctor.department?.name || 'Not Assigned'}
                  color="primary"
                  variant="outlined"
                  size="small"
                  sx={{ mt: 0.5 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Qualification</Typography>
                <Typography variant="body1">{selectedDoctor.qualification}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Experience</Typography>
                <Typography variant="body1">{selectedDoctor.experience_years} years</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Consultation Fee</Typography>
                <Typography variant="body1">₹{selectedDoctor.consultation_fee}</Typography>
              </Grid>

              {/* Contact Information */}
              <Grid item xs={12}>
                <Typography variant="h6" color="primary" gutterBottom sx={{ borderBottom: 1, borderColor: 'divider', pb: 1, mt: 2 }}>
                  Contact Information
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                <Typography variant="body1">{selectedDoctor.user?.email}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Phone</Typography>
                <Typography variant="body1">{selectedDoctor.user?.phone || 'N/A'}</Typography>
              </Grid>

              {/* Schedule & Availability */}
              <Grid item xs={12}>
                <Typography variant="h6" color="primary" gutterBottom sx={{ borderBottom: 1, borderColor: 'divider', pb: 1, mt: 2 }}>
                  Schedule & Availability
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Available Days</Typography>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                  {selectedDoctor.available_days?.split(',').map((day, index) => (
                    <Chip key={index} label={day.trim()} size="small" />
                  ))}
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Timings</Typography>
                <Typography variant="body1">
                  {selectedDoctor.consultation_start_time} - {selectedDoctor.consultation_end_time}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Max Patients/Day</Typography>
                <Typography variant="body1">{selectedDoctor.max_patients_per_day}</Typography>
              </Grid>

              {/* Bio */}
              <Grid item xs={12}>
                <Typography variant="h6" color="primary" gutterBottom sx={{ borderBottom: 1, borderColor: 'divider', pb: 1, mt: 2 }}>
                  Biography
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
                  {selectedDoctor.bio || 'No biography available.'}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseViewDialog} variant="contained">Close</Button>
        </DialogActions>
      </Dialog>

      {/* Add/Edit Doctor Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedDoctor ? 'Edit Doctor' : 'Add New Doctor'}
          {!selectedDoctor && (
            <Box sx={{ ml: 2, display: 'inline-block' }}>
              <AIFillButton
                fieldDescriptions={{
                  specialization: "Medical specialization (e.g., Cardiologist, Neurologist)",
                  license_number: "Medical license number (e.g., MD-12345)",
                  qualification: "Medical degrees (e.g., MBBS, MD)",
                  experience_years: "Years of experience (number)",
                  consultation_fee: "Fee in rupees (number)",
                  max_patients_per_day: "Maximum patients per day (number)",
                  bio: "Short professional biography"
                }}
                onFill={(data) => {
                  Object.keys(data).forEach(key => {
                    reset({ ...data });
                  });
                }}
              />
            </Box>
          )}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              {!selectedDoctor && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    select
                    label="Select User"
                    {...register('user_id', { required: 'User is required' })}
                    error={!!errors.user_id}
                    helperText={errors.user_id?.message}
                  >
                    {users.map((user) => (
                      <MenuItem key={user.id} value={user.id}>
                        {user.full_name} (@{user.username})
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              )}

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Specialization"
                  InputLabelProps={{ shrink: true }}
                  {...register('specialization', { required: 'Specialization is required' })}
                  error={!!errors.specialization}
                  helperText={errors.specialization?.message}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="License Number"
                  InputLabelProps={{ shrink: true }}
                  {...register('license_number', { required: 'License number is required' })}
                  error={!!errors.license_number}
                  helperText={errors.license_number?.message}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Qualification"
                  InputLabelProps={{ shrink: true }}
                  {...register('qualification', { required: 'Qualification is required' })}
                  error={!!errors.qualification}
                  helperText={errors.qualification?.message}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Experience (years)"
                  InputLabelProps={{ shrink: true }}
                  {...register('experience_years', { min: 0, max: 70 })}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Department"
                  {...register('department_id')}
                >
                  <MenuItem value="">None</MenuItem>
                  {departments.map((dept) => (
                    <MenuItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Consultation Fee (₹)"
                  InputLabelProps={{ shrink: true }}
                  {...register('consultation_fee', { min: 0 })}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Max Patients Per Day"
                  InputLabelProps={{ shrink: true }}
                  {...register('max_patients_per_day', { min: 1, max: 100 })}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="time"
                  label="Consultation Start Time"
                  {...register('consultation_start_time')}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="time"
                  label="Consultation End Time"
                  {...register('consultation_end_time')}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Available Days (comma separated)"
                  {...register('available_days')}
                  placeholder="Monday, Tuesday, Wednesday, Thursday, Friday"
                  helperText="Enter days separated by commas"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Bio"
                  InputLabelProps={{ shrink: true }}
                  {...register('bio')}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit(handleSaveDoctor)}
          >
            {selectedDoctor ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete Dr. <strong>{selectedDoctor?.user?.full_name}</strong>?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDeleteDoctor}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManageDoctors;