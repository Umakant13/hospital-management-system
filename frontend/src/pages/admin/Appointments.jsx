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
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Tooltip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  Search,
  Visibility,
  Edit,
  Cancel,
  Add,
  Delete,
  CheckCircle,
} from '@mui/icons-material';
import { appointmentService } from '@/services/appointmentService';
import { getInitials } from '@/utils/helpers';
import PageTitle from '@/components/common/PageTitle';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { patientService } from '@/services/patientService';
import { doctorService } from '@/services/doctorService';

const ManageAppointments = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [doctorFilter, setDoctorFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openCancelDialog, setOpenCancelDialog] = useState(false);
  const [openCompleteDialog, setOpenCompleteDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [loading, setLoading] = useState(true);

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    formState: { errors: errorsEdit }
  } = useForm();

  const {
    register: registerCancel,
    handleSubmit: handleSubmitCancel,
    reset: resetCancel,
    formState: { errors: errorsCancel }
  } = useForm();

  const {
    register: registerComplete,
    handleSubmit: handleSubmitComplete,
    reset: resetComplete,
    watch: watchComplete,
    formState: { errors: errorsComplete }
  } = useForm();

  const followUpRequired = watchComplete('follow_up_required');

  useEffect(() => {
    fetchData();
  }, [page, rowsPerPage, searchQuery, statusFilter, doctorFilter, dateFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [appointmentsData, patientsData, doctorsData] = await Promise.all([
        appointmentService.getAllAppointments({
          skip: page * rowsPerPage,
          limit: rowsPerPage,
        }),
        patientService.getAllPatients(),
        doctorService.getAllDoctors(),
      ]);

      const appointmentsList = Array.isArray(appointmentsData) ? appointmentsData : [];
      const patientsList = Array.isArray(patientsData) ? patientsData : (patientsData.patients || []);
      const doctorsList = Array.isArray(doctorsData) ? doctorsData : [];

      // Filter by search and status
      let filteredAppointments = appointmentsList;

      if (searchQuery) {
        filteredAppointments = filteredAppointments.filter(apt =>
          apt.patient?.user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          apt.doctor?.user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          apt.appointment_id?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      if (statusFilter !== 'all') {
        filteredAppointments = filteredAppointments.filter(apt => apt.status === statusFilter);
      }

      if (doctorFilter) {
        filteredAppointments = filteredAppointments.filter(apt => apt.doctor_id === doctorFilter);
      }

      if (dateFilter !== 'all') {
        const now = new Date();
        filteredAppointments = filteredAppointments.filter(apt => {
          const aptDate = new Date(apt.appointment_date);
          if (dateFilter === 'today') {
            return aptDate.toDateString() === now.toDateString();
          } else if (dateFilter === 'week') {
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return aptDate >= weekAgo;
          } else if (dateFilter === 'month') {
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return aptDate >= monthAgo;
          }
          return true;
        });
      }

      setAppointments(filteredAppointments);
      setPatients(patientsList);
      setDoctors(doctorsList);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewAppointment = (appointment) => {
    setSelectedAppointment(appointment);
    setOpenViewDialog(true);
  };

  const handleEditAppointment = (appointment) => {
    setSelectedAppointment(appointment);

    // Split appointment_date into date and time
    const appointmentDateTime = new Date(appointment.appointment_date);
    const dateStr = appointmentDateTime.toISOString().split('T')[0];
    const timeStr = appointmentDateTime.toTimeString().slice(0, 5);

    resetEdit({
      patient_id: appointment.patient_id || '',
      doctor_id: appointment.doctor_id || '',
      appointment_date: dateStr || '',
      appointment_time: timeStr || '',
      appointment_type: appointment.appointment_type || 'consultation',
      reason: appointment.reason || '',
      symptoms: appointment.symptoms || '',
    });
    setOpenEditDialog(true);
  };

  const handleCancelAppointment = (appointment) => {
    setSelectedAppointment(appointment);
    resetCancel({
      cancellation_reason: '',
    });
    setOpenCancelDialog(true);
  };

  const handleCompleteAppointment = (appointment) => {
    setSelectedAppointment(appointment);
    resetComplete({
      diagnosis: '',
      treatment_notes: '',
      follow_up_required: 'No',
      follow_up_date: '',
    });
    setOpenCompleteDialog(true);
  };

  const handleSaveEdit = async (data) => {
    try {
      // Combine date and time into ISO datetime format
      const appointmentDateTime = `${data.appointment_date}T${data.appointment_time}:00`;

      const updateData = {
        patient_id: data.patient_id,
        doctor_id: data.doctor_id,
        appointment_date: appointmentDateTime,
        appointment_type: data.appointment_type,
        reason: data.reason,
        symptoms: data.symptoms,
      };

      console.log('Updating appointment:', selectedAppointment.appointment_id);
      console.log('Update payload:', updateData);

      // Use appointment_id (string) not the numeric id
      await appointmentService.updateAppointment(selectedAppointment.appointment_id, updateData);
      console.log('Appointment updated successfully');

      setOpenEditDialog(false);
      fetchData();
    } catch (error) {
      console.error('Error updating appointment:', error);
      console.error('Error details:', error.response?.data);
      alert(error.response?.data?.detail || 'Failed to update appointment');
    }
  };

  const handleConfirmCancel = async (data) => {
    try {
      // Use appointment_id (string) not the numeric id
      await appointmentService.cancelAppointment(selectedAppointment.appointment_id, data.cancellation_reason);
      setOpenCancelDialog(false);
      fetchData();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      alert(error.response?.data?.detail || 'Failed to cancel appointment');
    }
  };

  const handleDeleteAppointment = async () => {
    try {
      await appointmentService.deleteAppointment(selectedAppointment.appointment_id);
      setOpenDeleteDialog(false);
      fetchData();
    } catch (error) {
      console.error('Error deleting appointment:', error);
      alert('Failed to delete appointment');
    }
  };

  const handleSaveComplete = async (data) => {
    try {
      const updateData = {
        status: 'completed',
        diagnosis: data.diagnosis,
        treatment_notes: data.treatment_notes,
        follow_up_required: data.follow_up_required,
        follow_up_date: data.follow_up_required === 'Yes' ? data.follow_up_date : null,
      };

      console.log('Completing appointment:', selectedAppointment.appointment_id);
      console.log('Completion payload:', updateData);

      await appointmentService.updateAppointment(selectedAppointment.appointment_id, updateData);
      setOpenCompleteDialog(false);
      fetchData();
    } catch (error) {
      console.error('Error completing appointment:', error);
      alert(error.response?.data?.detail || 'Failed to complete appointment');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'primary';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      case 'rescheduled': return 'warning';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <PageTitle>
          Appointments
        </PageTitle>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/admin/appointments/add')}
        >
          New Appointment
        </Button>
      </Box>

      <Paper elevation={2} sx={{ p: 3 }}>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search by patient, doctor, or ID..."
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
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="scheduled">Scheduled</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
                <MenuItem value="rescheduled">Rescheduled</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Doctor</InputLabel>
              <Select
                value={doctorFilter}
                label="Doctor"
                onChange={(e) => {
                  setDoctorFilter(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="">All Doctors</MenuItem>
                {doctors.map((doctor) => (
                  <MenuItem key={doctor.id} value={doctor.id}>
                    {doctor.user?.full_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Date Range</InputLabel>
              <Select
                value={dateFilter}
                label="Date Range"
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="all">All Time</MenuItem>
                <MenuItem value="today">Today</MenuItem>
                <MenuItem value="week">This Week</MenuItem>
                <MenuItem value="month">This Month</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Appointment ID</TableCell>
                <TableCell>Patient</TableCell>
                <TableCell>Doctor</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">Loading...</TableCell>
                </TableRow>
              ) : appointments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">No appointments found</TableCell>
                </TableRow>
              ) : (
                appointments.map((appointment) => (
                  <TableRow key={appointment.id} hover>
                    <TableCell>
                      <Chip label={appointment.appointment_id || `APT-${appointment.id}`} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ mr: 2, width: 32, height: 32, bgcolor: '#667eea' }}>
                          {getInitials(appointment.patient?.name || appointment.patient?.user?.full_name || 'P')}
                        </Avatar>
                        {appointment.patient?.name || appointment.patient?.user?.full_name || 'N/A'}
                      </Box>
                    </TableCell>
                    <TableCell>{appointment.doctor?.name || appointment.doctor?.user?.full_name || 'N/A'}</TableCell>
                    <TableCell>{appointment.appointment_date ? new Date(appointment.appointment_date).toLocaleDateString() : 'N/A'}</TableCell>
                    <TableCell>{appointment.appointment_date ? new Date(appointment.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</TableCell>
                    <TableCell>
                      <Chip label={appointment.appointment_type} size="small" />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={appointment.status}
                        size="small"
                        color={getStatusColor(appointment.status)}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View">
                        <IconButton size="small" color="info" onClick={() => handleViewAppointment(appointment)}>
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      {appointment.status === 'scheduled' && (
                        <>
                          <Tooltip title="Edit">
                            <IconButton size="small" color="primary" onClick={() => handleEditAppointment(appointment)}>
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Complete">
                            <IconButton size="small" color="success" onClick={() => handleCompleteAppointment(appointment)}>
                              <CheckCircle />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Cancel">
                            <IconButton size="small" color="error" onClick={() => handleCancelAppointment(appointment)}>
                              <Cancel />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => {
                            setSelectedAppointment(appointment);
                            setOpenDeleteDialog(true);
                          }}
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
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

      {/* View Dialog */}
      <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar sx={{ bgcolor: 'primary.light', mr: 2 }}>
              <Edit />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight="700">
                Appointment Details
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ID: {selectedAppointment?.appointment_id || `APT-${selectedAppointment?.id}`}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={() => setOpenViewDialog(false)}>
            <Cancel />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 4 }}>
          {selectedAppointment && (
            <Box>
              {/* Header Info */}
              <Paper elevation={0} sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 3, mb: 4, border: '1px solid', borderColor: 'divider' }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ display: 'block', mb: 0.5 }}>
                      STATUS
                    </Typography>
                    <Chip
                      label={selectedAppointment.status.toUpperCase()}
                      size="small"
                      color={getStatusColor(selectedAppointment.status)}
                      sx={{ fontWeight: 'bold', borderRadius: 1.5 }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ display: 'block', mb: 0.5 }}>
                      DATE
                    </Typography>
                    <Typography variant="body2" fontWeight="500">
                      {selectedAppointment.appointment_date ? new Date(selectedAppointment.appointment_date).toLocaleDateString() : 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ display: 'block', mb: 0.5 }}>
                      TIME
                    </Typography>
                    <Typography variant="body2" fontWeight="500">
                      {selectedAppointment.appointment_date ? new Date(selectedAppointment.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ display: 'block', mb: 0.5 }}>
                      TYPE
                    </Typography>
                    <Chip
                      label={selectedAppointment.appointment_type}
                      size="small"
                      variant="outlined"
                      sx={{ borderRadius: 1.5 }}
                    />
                  </Grid>
                </Grid>
              </Paper>

              <Grid container spacing={4}>
                {/* Patient & Doctor Info */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" fontWeight="700" gutterBottom sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>
                    Patient Information
                  </Typography>
                  <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ width: 40, height: 40, mr: 2, bgcolor: 'primary.main' }}>
                        {getInitials(selectedAppointment.patient?.name || selectedAppointment.patient?.user?.full_name || 'P')}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" fontWeight="600">
                          {selectedAppointment.patient?.name || selectedAppointment.patient?.user?.full_name || 'N/A'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Patient ID: {selectedAppointment.patient_id || selectedAppointment.patient?.patient_id}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" fontWeight="700" gutterBottom sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>
                    Doctor Information
                  </Typography>
                  <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ width: 40, height: 40, mr: 2, bgcolor: 'secondary.main' }}>
                        {getInitials(selectedAppointment.doctor?.name || selectedAppointment.doctor?.user?.full_name || 'D')}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" fontWeight="600">
                          {selectedAppointment.doctor?.name || selectedAppointment.doctor?.user?.full_name || 'N/A'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Doctor ID: {selectedAppointment.doctor_id || selectedAppointment.doctor?.doctor_id}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>

                {/* Clinical Details */}
                <Grid item xs={12}>
                  <Typography variant="subtitle2" fontWeight="700" gutterBottom sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1, mt: 2 }}>
                    Clinical Details
                  </Typography>
                  <Paper elevation={0} sx={{ p: 3, bgcolor: '#f8fafc', borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="caption" color="text.secondary" fontWeight="600" gutterBottom>REASON FOR VISIT</Typography>
                        <Typography variant="body1" sx={{ p: 2, bgcolor: 'white', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                          {selectedAppointment.reason || 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="caption" color="text.secondary" fontWeight="600" gutterBottom>SYMPTOMS</Typography>
                        <Typography variant="body1" sx={{ p: 2, bgcolor: 'white', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                          {selectedAppointment.symptoms || 'N/A'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={() => setOpenViewDialog(false)} variant="outlined" sx={{ borderRadius: 2 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Appointment</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Patient"
                  {...registerEdit('patient_id', { required: 'Patient is required' })}
                  error={!!errorsEdit.patient_id}
                  helperText={errorsEdit.patient_id?.message}
                >
                  {patients.map((patient) => (
                    <MenuItem key={patient.id} value={patient.id}>
                      {patient.user?.full_name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Doctor"
                  {...registerEdit('doctor_id', { required: 'Doctor is required' })}
                  error={!!errorsEdit.doctor_id}
                  helperText={errorsEdit.doctor_id?.message}
                >
                  {doctors.map((doctor) => (
                    <MenuItem key={doctor.id} value={doctor.id}>
                      {doctor.user?.full_name} - {doctor.specialization}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Appointment Date"
                  InputLabelProps={{ shrink: true }}
                  {...registerEdit('appointment_date')}
                  error={!!errorsEdit.appointment_date}
                  helperText={errorsEdit.appointment_date?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="time"
                  label="Appointment Time"
                  InputLabelProps={{ shrink: true }}
                  {...registerEdit('appointment_time')}
                  error={!!errorsEdit.appointment_time}
                  helperText={errorsEdit.appointment_time?.message}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="Appointment Type"
                  {...registerEdit('appointment_type')}
                  error={!!errorsEdit.appointment_type}
                  helperText={errorsEdit.appointment_type?.message}
                  SelectProps={{
                    native: false,
                  }}
                >
                  <MenuItem value="routine_checkup">Routine Checkup</MenuItem>
                  <MenuItem value="consultation">Consultation</MenuItem>
                  <MenuItem value="follow_up">Follow-up Visit</MenuItem>
                  <MenuItem value="emergency">Emergency</MenuItem>
                  <MenuItem value="vaccination">Vaccination</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Reason"
                  {...registerEdit('reason')}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Symptoms"
                  {...registerEdit('symptoms')}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmitEdit(handleSaveEdit)}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={openCancelDialog} onClose={() => setOpenCancelDialog(false)}>
        <DialogTitle>Cancel Appointment</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Are you sure you want to cancel this appointment?
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Cancellation Reason"
            {...registerCancel('cancellation_reason', { required: 'Reason is required' })}
            error={!!errorsCancel.cancellation_reason}
            helperText={errorsCancel.cancellation_reason?.message}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCancelDialog(false)}>No, Keep It</Button>
          <Button variant="contained" color="error" onClick={handleSubmitCancel(handleConfirmCancel)}>
            Yes, Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Complete Dialog */}
      <Dialog open={openCompleteDialog} onClose={() => setOpenCompleteDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Complete Appointment</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  id="diagnosis"
                  label="Diagnosis"
                  {...registerComplete('diagnosis', { required: 'Diagnosis is required' })}
                  error={!!errorsComplete.diagnosis}
                  helperText={errorsComplete.diagnosis?.message}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  id="treatment_notes"
                  label="Treatment Notes"
                  {...registerComplete('treatment_notes', { required: 'Treatment notes are required' })}
                  error={!!errorsComplete.treatment_notes}
                  helperText={errorsComplete.treatment_notes?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  id="follow_up_required"
                  label="Follow-up Required"
                  {...registerComplete('follow_up_required')}
                  defaultValue="No"
                >
                  <MenuItem value="Yes">Yes</MenuItem>
                  <MenuItem value="No">No</MenuItem>
                </TextField>
              </Grid>
              {followUpRequired === 'Yes' && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="datetime-local"
                    id="follow_up_date"
                    label="Follow-up Date"
                    InputLabelProps={{ shrink: true }}
                    {...registerComplete('follow_up_date', { required: followUpRequired === 'Yes' ? 'Follow-up date is required' : false })}
                    error={!!errorsComplete.follow_up_date}
                    helperText={errorsComplete.follow_up_date?.message}
                  />
                </Grid>
              )}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCompleteDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleSubmitComplete(handleSaveComplete)}
          >
            Complete Appointment
          </Button>
        </DialogActions>
      </Dialog>
      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this appointment?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDeleteAppointment}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManageAppointments;