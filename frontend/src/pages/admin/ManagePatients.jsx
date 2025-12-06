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
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  Add,
  Search,
  Edit,
  Delete,
  Visibility,
  LocalHospital,
} from '@mui/icons-material';
import { patientService } from '@/services/patientService';
import { userService } from '@/services/userService';
import { doctorService } from '@/services/doctorService';
import { useForm } from 'react-hook-form';
import { getInitials, getBMICategory } from '@/utils/helpers';
import PageTitle from '@/components/common/PageTitle';
import AIFillButton from '@/components/common/AIFillButton';

const ManagePatients = () => {
  const [patients, setPatients] = useState([]);
  const [users, setUsers] = useState([]);
  const [doctors, setDoctors] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [bloodGroupFilter, setBloodGroupFilter] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();

  const height = watch('height');
  const weight = watch('weight');
  const bmi = height && weight ? (weight / (height * height)).toFixed(2) : null;

  useEffect(() => {
    fetchPatients();
    fetchUsers();
    fetchDoctors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, searchQuery, bloodGroupFilter, doctorFilter]);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const params = {
        skip: page * rowsPerPage,
        limit: rowsPerPage,
        search: searchQuery,
      };

      if (bloodGroupFilter) params.blood_group = bloodGroupFilter;
      if (doctorFilter) params.doctor_id = doctorFilter;

      const data = await patientService.getAllPatients(params);
      // Handle both array and object response formats
      if (Array.isArray(data)) {
        setPatients(data);
      } else if (data && Array.isArray(data.patients)) {
        setPatients(data.patients);
      } else {
        setPatients([]);
        console.error('Unexpected response format:', data);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await userService.getAllUsers({ role: 'patient' });
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchDoctors = async () => {
    try {
      const data = await doctorService.getAllDoctors();
      setDoctors(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const handleOpenDialog = (patient = null) => {
    setSelectedPatient(patient);
    if (patient) {
      reset(patient);
    } else {
      reset({});
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedPatient(null);
    reset({});
  };

  const handleOpenViewDialog = (patient) => {
    setSelectedPatient(patient);
    setOpenViewDialog(true);
  };

  const handleCloseViewDialog = () => {
    setOpenViewDialog(false);
    setSelectedPatient(null);
  };

  const handleSavePatient = async (data) => {
    try {
      if (selectedPatient) {
        await patientService.updatePatient(selectedPatient.patient_id, data);
      } else {
        await patientService.createPatient(data);
      }
      handleCloseDialog();
      fetchPatients();
    } catch (error) {
      console.error('Error saving patient:', error);
    }
  };

  const handleDeletePatient = async () => {
    try {
      await patientService.deletePatient(selectedPatient.patient_id);
      setOpenDeleteDialog(false);
      setSelectedPatient(null);
      fetchPatients();
    } catch (error) {
      console.error('Error deleting patient:', error);
      alert('Failed to delete patient');
    }
  };

  const handleToggleActive = async (patientId, currentStatus) => {
    try {
      await patientService.updatePatient(patientId, { is_active: !currentStatus });
      fetchPatients();
    } catch (error) {
      console.error('Error toggling patient status:', error);
      alert('Failed to update patient status');
    }
  };

  const getBMIColor = (bmi) => {
    if (!bmi) return 'default';
    if (bmi < 18.5) return 'info';
    if (bmi < 25) return 'success';
    if (bmi < 30) return 'warning';
    return 'error';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <PageTitle>
          Manage Patients
        </PageTitle>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Add Patient
        </Button>
      </Box>

      <Paper elevation={2} sx={{ p: 3 }}>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search patients by name or patient ID..."
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
              <InputLabel>Blood Group</InputLabel>
              <Select
                value={bloodGroupFilter}
                label="Blood Group"
                onChange={(e) => {
                  setBloodGroupFilter(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="A+">A+</MenuItem>
                <MenuItem value="A-">A-</MenuItem>
                <MenuItem value="B+">B+</MenuItem>
                <MenuItem value="B-">B-</MenuItem>
                <MenuItem value="O+">O+</MenuItem>
                <MenuItem value="O-">O-</MenuItem>
                <MenuItem value="AB+">AB+</MenuItem>
                <MenuItem value="AB-">AB-</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Primary Doctor</InputLabel>
              <Select
                value={doctorFilter}
                label="Primary Doctor"
                onChange={(e) => {
                  setDoctorFilter(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="">All</MenuItem>
                {doctors.map((doctor) => (
                  <MenuItem key={doctor.id} value={doctor.id}>
                    {doctor.user?.full_name}
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
                <TableCell>Patient</TableCell>
                <TableCell>Patient ID</TableCell>
                <TableCell>Age</TableCell>
                <TableCell>Gender</TableCell>
                <TableCell>Blood Group</TableCell>
                <TableCell>BMI</TableCell>
                <TableCell>Primary Doctor</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {patients.map((patient) => (
                <TableRow key={patient.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                        {getInitials(patient.user?.full_name || 'P')}
                      </Avatar>
                      <Box>
                        <Typography variant="body1" fontWeight="medium">
                          {patient.user?.full_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {patient.user?.email}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip label={patient.patient_id} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>{patient.age}</TableCell>
                  <TableCell>
                    <Chip
                      label={patient.gender}
                      size="small"
                      color={patient.gender === 'male' ? 'primary' : 'secondary'}
                    />
                  </TableCell>
                  <TableCell>{patient.blood_group || 'N/A'}</TableCell>
                  <TableCell>
                    <Chip
                      label={`${patient.bmi || 'N/A'} - ${patient.bmi_category || ''}`}
                      size="small"
                      color={getBMIColor(patient.bmi)}
                    />
                  </TableCell>
                  <TableCell>
                    {patient.primary_doctor ? (
                      <Chip
                        icon={<LocalHospital />}
                        label={patient.primary_doctor.user?.full_name}
                        size="small"
                      />
                    ) : (
                      'Not Assigned'
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="View">
                      <IconButton size="small" color="info" onClick={() => handleOpenViewDialog(patient)}>
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleOpenDialog(patient)}
                      >
                        <Edit />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => {
                          setSelectedPatient(patient);
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

      {/* View Patient Details Dialog */}
      <Dialog open={openViewDialog} onClose={handleCloseViewDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'white', color: 'primary.main' }}>
            {selectedPatient && getInitials(selectedPatient.user?.full_name)}
          </Avatar>
          <Box>
            <Typography variant="h6">
              {selectedPatient?.user?.full_name}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              Patient ID: {selectedPatient?.patient_id}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {selectedPatient && (
            <Grid container spacing={3}>
              {/* Personal Information */}
              <Grid item xs={12}>
                <Typography variant="h6" color="primary" gutterBottom sx={{ borderBottom: 1, borderColor: 'divider', pb: 1 }}>
                  Personal Information
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                <Typography variant="body1">{selectedPatient.user?.email}</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="subtitle2" color="text.secondary">Phone</Typography>
                <Typography variant="body1">{selectedPatient.user?.phone || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="subtitle2" color="text.secondary">Age</Typography>
                <Typography variant="body1">{selectedPatient.age} years</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="subtitle2" color="text.secondary">Gender</Typography>
                <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>{selectedPatient.gender}</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="subtitle2" color="text.secondary">Blood Group</Typography>
                <Chip label={selectedPatient.blood_group || 'N/A'} size="small" color="error" variant="outlined" />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="subtitle2" color="text.secondary">Address</Typography>
                <Typography variant="body1">{selectedPatient.user?.address || 'N/A'}</Typography>
              </Grid>

              {/* Physical Statistics */}
              <Grid item xs={12}>
                <Typography variant="h6" color="primary" gutterBottom sx={{ borderBottom: 1, borderColor: 'divider', pb: 1, mt: 2 }}>
                  Physical Statistics
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">Height</Typography>
                  <Typography variant="h6">{selectedPatient.height ? `${selectedPatient.height} m` : 'N/A'}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">Weight</Typography>
                  <Typography variant="h6">{selectedPatient.weight ? `${selectedPatient.weight} kg` : 'N/A'}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">BMI</Typography>
                  <Typography variant="h6" color={getBMIColor(selectedPatient.bmi)}>
                    {selectedPatient.bmi || 'N/A'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {selectedPatient.bmi_category}
                  </Typography>
                </Paper>
              </Grid>

              {/* Medical Information */}
              <Grid item xs={12}>
                <Typography variant="h6" color="primary" gutterBottom sx={{ borderBottom: 1, borderColor: 'divider', pb: 1, mt: 2 }}>
                  Medical Information
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Medical History</Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', bgcolor: 'grey.50', p: 1, borderRadius: 1, mt: 0.5 }}>
                  {selectedPatient.medical_history || 'No medical history recorded.'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Allergies</Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', bgcolor: 'grey.50', p: 1, borderRadius: 1, mt: 0.5 }}>
                  {selectedPatient.allergies || 'No known allergies.'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Current Medications</Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', bgcolor: 'grey.50', p: 1, borderRadius: 1, mt: 0.5 }}>
                  {selectedPatient.current_medications || 'No current medications.'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Primary Doctor</Typography>
                {selectedPatient.primary_doctor ? (
                  <Chip
                    icon={<LocalHospital />}
                    label={`${selectedPatient.primary_doctor.user?.full_name} (${selectedPatient.primary_doctor.specialization})`}
                    color="primary"
                    variant="outlined"
                    sx={{ mt: 0.5 }}
                  />
                ) : (
                  <Typography variant="body2" color="text.secondary">Not Assigned</Typography>
                )}
              </Grid>

              {/* Emergency Contact */}
              <Grid item xs={12}>
                <Typography variant="h6" color="primary" gutterBottom sx={{ borderBottom: 1, borderColor: 'divider', pb: 1, mt: 2 }}>
                  Emergency Contact
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Name</Typography>
                <Typography variant="body1">{selectedPatient.emergency_contact_name || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Contact Number</Typography>
                <Typography variant="body1">{selectedPatient.emergency_contact || 'N/A'}</Typography>
              </Grid>

              {/* Insurance Information */}
              <Grid item xs={12}>
                <Typography variant="h6" color="primary" gutterBottom sx={{ borderBottom: 1, borderColor: 'divider', pb: 1, mt: 2 }}>
                  Insurance Information
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Provider</Typography>
                <Typography variant="body1">{selectedPatient.insurance_provider || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Insurance ID</Typography>
                <Typography variant="body1">{selectedPatient.insurance_id || 'N/A'}</Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseViewDialog} variant="contained">Close</Button>
        </DialogActions>
      </Dialog>

      {/* Add/Edit Patient Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedPatient ? 'Edit Patient' : 'Add New Patient'}
          {!selectedPatient && (
            <Box sx={{ ml: 2, display: 'inline-block' }}>
              <AIFillButton
                fieldDescriptions={{
                  age: "Age between 18 and 90",
                  gender: "One of: male, female",
                  blood_group: "One of: A+, A-, B+, B-, O+, O-, AB+, AB-",
                  height: "Height in meters (e.g., 1.75)",
                  weight: "Weight in kg (e.g., 70)",
                  emergency_contact: "A valid phone number",
                  emergency_contact_name: "Full name of a person",
                  medical_history: "Short medical history summary",
                  allergies: "Common allergies or 'None'",
                  current_medications: "Common medications or 'None'",
                  insurance_provider: "Insurance company name",
                  insurance_id: "Alphanumeric insurance ID"
                }}
                onFill={(data) => {
                  Object.keys(data).forEach(key => {
                    // Handle specific field formatting if needed
                    if (key === 'gender') {
                      // Ensure lowercase for select match
                      reset({ ...watch(), [key]: data[key].toLowerCase() });
                    } else {
                      reset({ ...watch(), [key]: data[key] });
                    }
                  });
                }}
              />
            </Box>
          )}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              {!selectedPatient && (
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
                  type="number"
                  label="Age"
                  {...register('age', { required: 'Age is required', min: 1, max: 150 })}
                  error={!!errors.age}
                  helperText={errors.age?.message}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Gender"
                  {...register('gender', { required: 'Gender is required' })}
                  error={!!errors.gender}
                  helperText={errors.gender?.message}
                >
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Blood Group"
                  {...register('blood_group')}
                >
                  <MenuItem value="A+">A+</MenuItem>
                  <MenuItem value="A-">A-</MenuItem>
                  <MenuItem value="B+">B+</MenuItem>
                  <MenuItem value="B-">B-</MenuItem>
                  <MenuItem value="O+">O+</MenuItem>
                  <MenuItem value="O-">O-</MenuItem>
                  <MenuItem value="AB+">AB+</MenuItem>
                  <MenuItem value="AB-">AB-</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Primary Doctor"
                  {...register('primary_doctor_id')}
                >
                  <MenuItem value="">None</MenuItem>
                  {doctors.map((doctor) => (
                    <MenuItem key={doctor.id} value={doctor.id}>
                      {doctor.user?.full_name} - {doctor.specialization}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Height (m)"
                  {...register('height', { min: 0, max: 3 })}
                  inputProps={{ step: 0.01 }}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Weight (kg)"
                  {...register('weight', { min: 0, max: 500 })}
                  inputProps={{ step: 0.1 }}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="BMI"
                  value={bmi ? `${bmi} (${getBMICategory(parseFloat(bmi))})` : 'N/A'}
                  disabled
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Emergency Contact"
                  {...register('emergency_contact')}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Emergency Contact Name"
                  {...register('emergency_contact_name')}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Medical History"
                  {...register('medical_history')}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Allergies"
                  {...register('allergies')}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Current Medications"
                  {...register('current_medications')}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Insurance ID"
                  {...register('insurance_id')}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Insurance Provider"
                  {...register('insurance_provider')}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit(handleSavePatient)}
          >
            {selectedPatient ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>


      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete patient <strong>{selectedPatient?.user?.full_name}</strong>?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDeletePatient}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box >
  );
};

export default ManagePatients;