import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  CardActions,
  Avatar,
  Chip,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Divider,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Schedule,
  Person,
  Add as AddIcon,
  CalendarToday,
  AccessTime,
  Notes,
  LocalHospital,
} from '@mui/icons-material';
import { formatDateTime } from '@/utils/helpers';
import { useAuthStore } from '@/store/authStore';
import { appointmentService } from '@/services/appointmentService';
import { getInitials } from '@/utils/helpers';
import PageTitle from '@/components/common/PageTitle';
import { medicalRecordService } from '@/services/medicalRecordService';
import { doctorService } from '@/services/doctorService';

const DoctorAppointments = () => {
  const { user } = useAuthStore();
  const [tabValue, setTabValue] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [appointments, setAppointments] = useState({ scheduled: [], completed: [], cancelled: [] });
  const [myPatients, setMyPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Dialog form state
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [followUp, setFollowUp] = useState('No');

  // Add Appointment Form State
  const [newAppointment, setNewAppointment] = useState({
    patient_id: '',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    type: 'consultation',
    reason: ''
  });

  useEffect(() => {
    console.log('DoctorAppointments: User changed', user);
    if (user?.doctor_internal_id) {
      fetchAppointments();
    } else {
      console.warn('DoctorAppointments: No doctor_internal_id available');
    }
  }, [user]);

  const fetchAppointments = async () => {
    console.log('DoctorAppointments: Fetching appointments for doctor_internal_id:', user?.doctor_internal_id);
    if (!user?.doctor_internal_id) {
      console.warn('DoctorAppointments: No doctor_internal_id, skipping fetch');
      return;
    }
    try {
      setLoading(true);
      const allAppointments = await appointmentService.getAllAppointments({
        doctor_id: user.doctor_internal_id // Use internal ID for FK
      });
      console.log('DoctorAppointments: Received appointments:', allAppointments);

      const scheduled = allAppointments.filter(apt =>
        ['scheduled', 'confirmed', 'in_progress'].includes(apt.status)
      );
      const completed = allAppointments.filter(apt => apt.status === 'completed');
      const cancelled = allAppointments.filter(apt => apt.status === 'cancelled');

      setAppointments({ scheduled, completed, cancelled });
      console.log('DoctorAppointments: Categorized - Scheduled:', scheduled.length, 'Completed:', completed.length, 'Cancelled:', cancelled.length);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      console.error('Error details:', error.response?.data || error.message);
    } finally {
      setLoading(false);
      console.log('DoctorAppointments: Fetch complete');
    }
  };

  const fetchMyPatients = async () => {
    if (!user?.doctor_internal_id) return;
    try {
      console.log('Fetching patients for doctor:', user.doctor_internal_id);
      const patients = await doctorService.getDoctorPatients(user.doctor_internal_id);
      console.log('Fetched patients:', patients);
      setMyPatients(patients);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const handleOpenAddDialog = () => {
    fetchMyPatients();
    setOpenAddDialog(true);
  };

  const handleSaveNewAppointment = async () => {
    try {
      if (!newAppointment.patient_id || !newAppointment.date || !newAppointment.time) {
        alert('Please fill in all required fields');
        return;
      }

      const appointmentData = {
        doctor_id: user.doctor_internal_id,
        patient_id: newAppointment.patient_id,
        appointment_date: `${newAppointment.date}T${newAppointment.time}:00`,
        status: 'scheduled',
        appointment_type: newAppointment.type, // Changed from type to appointment_type
        reason: newAppointment.reason || 'Scheduled by Doctor'
      };

      console.log('Sending appointment data:', appointmentData);

      await appointmentService.createAppointment(appointmentData);
      setOpenAddDialog(false);
      setNewAppointment({
        patient_id: '',
        date: new Date().toISOString().split('T')[0],
        time: '09:00',
        type: 'consultation',
        reason: ''
      });
      fetchAppointments();
      alert('Appointment scheduled successfully!');
    } catch (error) {
      console.error('Error creating appointment:', error);
      console.error('Error details:', error.response?.data);
      alert('Failed to schedule appointment: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleCompleteAppointment = (appointment) => {
    setSelectedAppointment(appointment);
    setDiagnosis('');
    setNotes('');
    setFollowUp('No');
    setOpenDialog(true);
  };

  const handleSaveCompletion = async () => {
    try {
      // 1. Update appointment status
      await appointmentService.updateAppointment(selectedAppointment.appointment_id, {
        status: 'completed'
      });

      // 2. Create medical record only if diagnosis or notes are provided
      if (diagnosis || notes) {
        const recordData = {
          patient_id: selectedAppointment.patient_id,
          doctor_id: selectedAppointment.doctor_id,
          record_date: new Date().toISOString(),
          chief_complaint: selectedAppointment.reason || 'Follow-up',
          assessment: diagnosis || '',
          plan: notes || '',
        };

        // Only add vitals if they have values
        if (selectedAppointment.blood_pressure) recordData.blood_pressure = selectedAppointment.blood_pressure;

        try {
          await medicalRecordService.createRecord(recordData);
        } catch (recordError) {
          console.error('Error creating medical record:', recordError);
          // Don't fail the whole operation if medical record creation fails
        }
      }

      setOpenDialog(false);
      fetchAppointments();
    } catch (error) {
      console.error('Error completing appointment:', error);
      alert('Failed to complete appointment');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      scheduled: 'info',
      confirmed: 'success',
      in_progress: 'warning',
      completed: 'success',
      cancelled: 'error',
    };
    return colors[status] || 'default';
  };

  const renderAppointmentCard = (appointment) => (
    <Grid item xs={12} md={6} lg={4} key={appointment.id}>
      <Card
        elevation={0}
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'divider',
          transition: 'all 0.2s',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 24px -10px rgba(0, 0, 0, 0.1)',
            borderColor: 'primary.main'
          }
        }}
      >
        <CardContent sx={{ flexGrow: 1, p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar
                sx={{
                  bgcolor: 'primary.lighter',
                  color: 'primary.main',
                  mr: 2,
                  width: 56,
                  height: 56,
                  fontWeight: 'bold',
                  fontSize: '1.5rem'
                }}
              >
                {appointment.patient?.name?.[0] || 'P'}
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight="bold" sx={{ lineHeight: 1.2 }}>
                  {appointment.patient?.name || 'Unknown Patient'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {appointment.patient?.patient_id || 'ID: N/A'}
                </Typography>
              </Box>
            </Box>
            <Chip
              label={appointment.status.replace('_', ' ')}
              size="small"
              color={getStatusColor(appointment.status)}
              sx={{ fontWeight: 600, textTransform: 'capitalize' }}
            />
          </Box>

          <Divider sx={{ my: 2, borderStyle: 'dashed' }} />

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CalendarToday sx={{ fontSize: 18, mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2" fontWeight="medium">
                  {new Date(appointment.appointment_date || appointment.date || appointment.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AccessTime sx={{ fontSize: 18, mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2" fontWeight="medium">
                  {new Date(appointment.appointment_date || appointment.date || appointment.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase()}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <LocalHospital sx={{ fontSize: 18, mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {appointment.appointment_type || 'Consultation'}
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {appointment.reason && (
            <Box sx={{ mt: 2, bgcolor: 'background.default', p: 1.5, borderRadius: 2 }}>
              <Typography variant="caption" color="text.secondary" fontWeight="bold" display="block" gutterBottom>
                REASON FOR VISIT
              </Typography>
              <Box component="span" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                <Typography variant="body2" component="span">
                  {appointment.reason}
                </Typography>
              </Box>
            </Box>
          )}
        </CardContent>

        {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
          <CardActions sx={{ p: 2, pt: 0 }}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              startIcon={<CheckCircle />}
              onClick={() => handleCompleteAppointment(appointment)}
              sx={{ borderRadius: 2, py: 1 }}
            >
              Mark as Complete
            </Button>
          </CardActions>
        )}
      </Card>
    </Grid>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <PageTitle
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenAddDialog}
          >
            Schedule Appointment
          </Button>
        }
      >
        My Appointments
      </PageTitle>

      <Paper elevation={2} sx={{ mt: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
          variant="fullWidth"
        >
          <Tab
            label={`Scheduled (${appointments.scheduled.length})`}
            icon={<Schedule />}
            iconPosition="start"
          />
          <Tab
            label={`Completed (${appointments.completed.length})`}
            icon={<CheckCircle />}
            iconPosition="start"
          />
          <Tab
            label={`Cancelled (${appointments.cancelled.length})`}
            icon={<Cancel />}
            iconPosition="start"
          />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {tabValue === 0 && (
            <Grid container spacing={3}>
              {appointments.scheduled.length > 0 ? (
                appointments.scheduled.map(renderAppointmentCard)
              ) : (
                <Grid item xs={12}>
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Schedule sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                      No scheduled appointments
                    </Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          )}

          {tabValue === 1 && (
            <Grid container spacing={3}>
              {appointments.completed.length > 0 ? (
                appointments.completed.map(renderAppointmentCard)
              ) : (
                <Grid item xs={12}>
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <CheckCircle sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                      No completed appointments
                    </Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          )}

          {tabValue === 2 && (
            <Grid container spacing={3}>
              {appointments.cancelled.length > 0 ? (
                appointments.cancelled.map(renderAppointmentCard)
              ) : (
                <Grid item xs={12}>
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Cancel sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                      No cancelled appointments
                    </Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          )}
        </Box>
      </Paper>

      {/* Complete Appointment Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Complete Appointment</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Diagnosis"
            sx={{ mb: 2, mt: 1 }}
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
          />
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Treatment Notes"
            sx={{ mb: 2 }}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <TextField
            fullWidth
            label="Follow-up Required?"
            select
            value={followUp}
            onChange={(e) => setFollowUp(e.target.value)}
          >
            <MenuItem value="Yes">Yes</MenuItem>
            <MenuItem value="No">No</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveCompletion}>
            Save & Complete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Appointment Dialog */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Schedule New Appointment</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Select Patient</InputLabel>
              <Select
                value={newAppointment.patient_id}
                label="Select Patient"
                onChange={(e) => setNewAppointment({ ...newAppointment, patient_id: e.target.value })}
              >
                {myPatients.length > 0 ? (
                  myPatients.map((patient) => (
                    <MenuItem key={patient.patient_id} value={patient.id}>
                      {patient.name} ({patient.patient_id})
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>No patients assigned</MenuItem>
                )}
              </Select>
            </FormControl>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Date"
                  InputLabelProps={{ shrink: true }}
                  value={newAppointment.date}
                  onChange={(e) => setNewAppointment({ ...newAppointment, date: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="time"
                  label="Time"
                  InputLabelProps={{ shrink: true }}
                  value={newAppointment.time}
                  onChange={(e) => setNewAppointment({ ...newAppointment, time: e.target.value })}
                />
              </Grid>
            </Grid>

            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={newAppointment.type}
                label="Type"
                onChange={(e) => setNewAppointment({ ...newAppointment, type: e.target.value })}
              >
                <MenuItem value="consultation">Consultation</MenuItem>
                <MenuItem value="follow_up">Follow-up</MenuItem>
                <MenuItem value="emergency">Emergency</MenuItem>
                <MenuItem value="routine_checkup">Routine Checkup</MenuItem>
                <MenuItem value="vaccination">Vaccination</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Reason (Optional)"
              value={newAppointment.reason}
              onChange={(e) => setNewAppointment({ ...newAppointment, reason: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveNewAppointment}>
            Schedule
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DoctorAppointments;