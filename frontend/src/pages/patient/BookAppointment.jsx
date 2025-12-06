import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Button,
  Grid,
  Card,
  CardContent,
  TextField,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  Snackbar,
  useTheme,
  Divider,
  alpha,
} from '@mui/material';
import {
  MedicalServices,
  CalendarMonth,
  CheckCircle,
  Person,
  Star,
  AccessTime,
} from '@mui/icons-material';
import AIFillButton from '@/components/common/AIFillButton';
import { doctorService } from '@/services/doctorService';
import { patientService } from '@/services/patientService';
import { appointmentService } from '@/services/appointmentService';
import { useAuthStore } from '@/store/authStore';
import PageTitle from '@/components/common/PageTitle';

const BookAppointment = () => {
  const theme = useTheme();
  const { user } = useAuthStore();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState([]);
  const [primaryDoctorId, setPrimaryDoctorId] = useState(null);

  // Form State
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [reason, setReason] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const steps = ['Select Doctor', 'Choose Date & Time', 'Confirm Details'];

  const availableSlots = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
    '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM',
    '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM',
  ];

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [doctorsData, patientProfile] = await Promise.all([
        doctorService.getAllDoctors(),
        patientService.getMyProfile()
      ]);

      setDoctors(doctorsData);

      if (patientProfile.primary_doctor_id) {
        setPrimaryDoctorId(patientProfile.primary_doctor_id);
        // Auto-select primary doctor if available
        const primaryDoc = doctorsData.find(d => d.id === patientProfile.primary_doctor_id);
        if (primaryDoc) {
          setSelectedDoctor(primaryDoc);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      showSnackbar('Failed to load doctors', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleBookAppointment = async () => {
    try {
      setLoading(true);

      // Get patient profile to get patient_id
      const patientProfile = await patientService.getMyProfile();

      if (!patientProfile || !patientProfile.id) {
        showSnackbar('Unable to retrieve patient information', 'error');
        return;
      }

      // Format date and time for backend
      const appointmentData = {
        patient_id: patientProfile.id,
        doctor_id: selectedDoctor.id,
        appointment_date: `${selectedDate}T${convertTo24Hour(selectedTime)}`,
        reason: reason,
        appointment_type: 'consultation'
      };

      console.log('Booking appointment with data:', appointmentData);

      await appointmentService.createAppointment(appointmentData);

      showSnackbar('Appointment booked successfully!', 'success');
      // Reset form and go back to start after delay
      setTimeout(() => {
        setActiveStep(0);
        setSelectedDoctor(null);
        setSelectedDate('');
        setSelectedTime('');
        setReason('');
        // Re-select primary doctor if exists
        if (primaryDoctorId) {
          const primaryDoc = doctors.find(d => d.id === primaryDoctorId);
          if (primaryDoc) setSelectedDoctor(primaryDoc);
        }
      }, 2000);

    } catch (error) {
      console.error('Booking error:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.detail ||
        (Array.isArray(error.response?.data) ? error.response.data[0]?.msg : null) ||
        'Failed to book appointment';
      showSnackbar(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const convertTo24Hour = (time12h) => {
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    if (hours === '12') {
      hours = '00';
    }
    if (modifier === 'PM') {
      hours = parseInt(hours, 10) + 12;
    }
    return `${hours}:${minutes}:00`;
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  if (loading && activeStep === 0 && doctors.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 4 }}>
      <PageTitle>
        Book Appointment
      </PageTitle>

      <Paper
        elevation={0}
        sx={{
          p: 4,
          mb: 4,
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper'
        }}
      >
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          p: 4,
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'divider',
          minHeight: 400
        }}
      >
        {activeStep === 0 && (
          <Box>
            <Typography variant="h6" fontWeight="700" gutterBottom sx={{ mb: 3 }}>
              Select a Doctor
            </Typography>
            {doctors.length > 0 ? (
              <Grid container spacing={3}>
                {doctors
                  .filter(doctor => !primaryDoctorId || doctor.id === primaryDoctorId)
                  .map((doctor) => (
                    <Grid item xs={12} md={6} lg={4} key={doctor.id}>
                      <Card
                        elevation={0}
                        sx={{
                          cursor: 'pointer',
                          borderRadius: 3,
                          border: '2px solid',
                          borderColor: selectedDoctor?.id === doctor.id ? 'primary.main' : 'divider',
                          transition: 'all 0.2s ease',
                          bgcolor: selectedDoctor?.id === doctor.id ? alpha(theme.palette.primary.main, 0.04) : 'background.paper',
                          '&:hover': {
                            borderColor: 'primary.main',
                            transform: 'translateY(-4px)',
                            boxShadow: '0 12px 24px -10px rgba(0, 0, 0, 0.1)'
                          }
                        }}
                        onClick={() => setSelectedDoctor(doctor)}
                      >
                        <CardContent sx={{ p: 3 }}>
                          <Box sx={{ display: 'flex', alignItems: 'start', mb: 2 }}>
                            <Avatar
                              sx={{
                                width: 64,
                                height: 64,
                                mr: 2,
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                color: 'primary.main',
                                fontSize: '1.5rem',
                                fontWeight: 'bold'
                              }}
                            >
                              {doctor.user?.full_name?.split(' ')[1]?.[0] || 'D'}
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                <Typography variant="h6" fontWeight="700" gutterBottom>
                                  {doctor.user?.full_name}
                                </Typography>
                                {doctor.id === primaryDoctorId && (
                                  <Chip
                                    label="PRIMARY"
                                    size="small"
                                    color="primary"
                                    sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }}
                                  />
                                )}
                              </Box>
                              <Chip
                                icon={<MedicalServices sx={{ fontSize: 14 }} />}
                                label={doctor.specialization}
                                size="small"
                                sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', fontWeight: 600, mb: 1 }}
                              />
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Star sx={{ fontSize: 16, color: 'warning.main' }} />
                                <Typography variant="body2" fontWeight="600">
                                  4.8
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  (120+ reviews)
                                </Typography>
                              </Box>
                            </Box>
                          </Box>

                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                            <Box>
                              <Typography variant="caption" color="text.secondary" display="block">
                                Experience
                              </Typography>
                              <Typography variant="body2" fontWeight="600">
                                {doctor.experience_years || '5+'} Years
                              </Typography>
                            </Box>
                            <Box sx={{ textAlign: 'right' }}>
                              <Typography variant="caption" color="text.secondary" display="block">
                                Consultation Fee
                              </Typography>
                              <Typography variant="body1" fontWeight="700" color="primary.main">
                                ₹{doctor.consultation_fee || 100}
                              </Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
              </Grid>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  No doctors available at the moment.
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {activeStep === 1 && (
          <Box>
            <Typography variant="h6" fontWeight="700" gutterBottom sx={{ mb: 3 }}>
              Choose Date & Time
            </Typography>
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom sx={{ mb: 2 }}>
                  Select Date
                </Typography>
                <TextField
                  fullWidth
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  InputProps={{
                    sx: { borderRadius: 3 }
                  }}
                  inputProps={{ min: new Date().toISOString().split('T')[0] }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom sx={{ mb: 2 }}>
                  Available Time Slots
                </Typography>
                <Grid container spacing={2}>
                  {availableSlots.map((slot) => (
                    <Grid item xs={4} sm={3} key={slot}>
                      <Chip
                        label={slot}
                        onClick={() => setSelectedTime(slot)}
                        variant={selectedTime === slot ? 'filled' : 'outlined'}
                        color={selectedTime === slot ? 'primary' : 'default'}
                        sx={{
                          width: '100%',
                          height: 40,
                          borderRadius: 2,
                          fontWeight: selectedTime === slot ? 600 : 400,
                          border: selectedTime === slot ? 'none' : '1px solid',
                          borderColor: 'divider'
                        }}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            </Grid>
          </Box>
        )}

        {activeStep === 2 && (
          <Box>
            <Typography variant="h6" fontWeight="700" gutterBottom sx={{ mb: 3 }}>
              Confirm Appointment Details
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">Doctor</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>
                          {selectedDoctor?.user?.full_name?.split(' ')[1]?.[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="600">
                            {selectedDoctor?.user?.full_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {selectedDoctor?.specialization}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">Date & Time</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <CalendarMonth color="action" fontSize="small" />
                        <Typography variant="subtitle2" fontWeight="600">
                          {selectedDate} at {selectedTime}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="caption" color="text.secondary">Reason for Visit</Typography>
                        <AIFillButton
                          label="Auto-Fill Reason"
                          fieldDescriptions={{
                            reason: "A detailed reason for visiting a doctor (e.g., severe headache, fever for 3 days)"
                          }}
                          onFill={(data) => {
                            if (data.reason) setReason(data.reason);
                          }}
                        />
                      </Box>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        placeholder="Describe your symptoms or reason for consultation..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        InputProps={{
                          sx: { borderRadius: 3 }
                        }}
                      />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 3, borderRadius: 3, bgcolor: alpha(theme.palette.primary.main, 0.04) }} elevation={0}>
                  <Typography variant="subtitle1" fontWeight="700" gutterBottom>
                    Payment Summary
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">Consultation Fee</Typography>
                    <Typography variant="body2" fontWeight="600">₹{selectedDoctor?.consultation_fee || 100}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Booking Fee</Typography>
                    <Typography variant="body2" fontWeight="600">₹50</Typography>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle1" fontWeight="700">Total</Typography>
                    <Typography variant="subtitle1" fontWeight="700" color="primary.main">
                      ₹{(selectedDoctor?.consultation_fee || 100) + 50}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 6 }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            sx={{ borderRadius: 2, px: 4 }}
          >
            Back
          </Button>
          <Button
            variant="contained"
            onClick={activeStep === steps.length - 1 ? handleBookAppointment : handleNext}
            disabled={
              (activeStep === 0 && !selectedDoctor) ||
              (activeStep === 1 && (!selectedDate || !selectedTime))
            }
            startIcon={activeStep === steps.length - 1 ? <CheckCircle /> : null}
            sx={{ borderRadius: 2, px: 4, py: 1.2 }}
          >
            {activeStep === steps.length - 1 ? 'Confirm & Book' : 'Next Step'}
          </Button>
        </Box>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default BookAppointment;