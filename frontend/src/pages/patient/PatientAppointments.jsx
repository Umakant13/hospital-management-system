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
    Avatar,
    Chip,
    Button,
    CircularProgress,
    Divider,
    Container,
} from '@mui/material';
import {
    CheckCircle,
    Cancel,
    Schedule,
    CalendarMonth,
    AccessTime,
    LocalHospital,
    Person,
    Add as AddIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { appointmentService } from '@/services/appointmentService';
import { patientService } from '@/services/patientService';
import { doctorService } from '@/services/doctorService';
import PageTitle from '@/components/common/PageTitle';
import { formatDateTime } from '@/utils/helpers';
import { alpha, useTheme } from '@mui/material/styles';

const PatientAppointments = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [tabValue, setTabValue] = useState(0);
    const [appointments, setAppointments] = useState({ scheduled: [], completed: [], cancelled: [] });
    const [patientProfile, setPatientProfile] = useState(null);
    const [doctorsMap, setDoctorsMap] = useState({});

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            // 1. Get Patient Profile to get ID
            const profile = await patientService.getMyProfile();
            setPatientProfile(profile);

            if (profile && profile.id) {
                // 2. Fetch Appointments
                const allAppointments = await appointmentService.getAllAppointments({
                    patient_id: profile.id
                });

                // 3. Fetch All Doctors to build lookup map (Avoids 404 on individual fetches)
                try {
                    const doctorsList = await doctorService.getAllDoctors();
                    const dMap = {};
                    if (Array.isArray(doctorsList)) {
                        doctorsList.forEach(doc => {
                            dMap[doc.id] = doc;
                        });
                    }
                    setDoctorsMap(dMap);
                } catch (err) {
                    console.error('Error fetching doctors list:', err);
                }

                const scheduled = allAppointments.filter(apt =>
                    ['scheduled', 'confirmed', 'in_progress'].includes(apt.status)
                );
                const completed = allAppointments.filter(apt => apt.status === 'completed');
                const cancelled = allAppointments.filter(apt => apt.status === 'cancelled');

                setAppointments({ scheduled, completed, cancelled });
            }
        } catch (error) {
            console.error('Error fetching patient appointments:', error);
        } finally {
            setLoading(false);
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

    const renderAppointmentCard = (appointment) => {
        // Prefer the map if appointment.doctor is missing or doesn't have user info
        let doctor = doctorsMap[appointment.doctor_id];
        if (!doctor && appointment.doctor && appointment.doctor.user) {
            doctor = appointment.doctor;
        }

        const doctorName = doctor?.user?.full_name || 'Unknown Doctor';
        const specialization = doctor?.specialization || 'Specialist';

        return (
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
                                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                                        color: 'primary.main',
                                        mr: 2,
                                        width: 56,
                                        height: 56,
                                        fontWeight: 'bold',
                                        fontSize: '1.5rem'
                                    }}
                                >
                                    {doctorName?.[0] || 'D'}
                                </Avatar>
                                <Box>
                                    <Typography variant="h6" fontWeight="bold" sx={{ lineHeight: 1.2 }}>
                                        {doctorName}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {specialization}
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
                                    <CalendarMonth sx={{ fontSize: 18, mr: 1, color: 'text.secondary' }} />
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
                                    <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                                        {appointment.appointment_type?.replace('_', ' ') || 'Consultation'}
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
                </Card>
            </Grid>
        );
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
            <PageTitle
                actions={
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => navigate('/patient/book-appointment')}
                    >
                        Book Appointment
                    </Button>
                }
            >
                My Appointments
            </PageTitle>

            <Paper elevation={0} sx={{ mt: 3, border: '1px solid', borderColor: 'divider', borderRadius: 4 }}>
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
                        sx={{ minHeight: 64 }}
                    />
                    <Tab
                        label={`Completed (${appointments.completed.length})`}
                        icon={<CheckCircle />}
                        iconPosition="start"
                        sx={{ minHeight: 64 }}
                    />
                    <Tab
                        label={`Cancelled (${appointments.cancelled.length})`}
                        icon={<Cancel />}
                        iconPosition="start"
                        sx={{ minHeight: 64 }}
                    />
                </Tabs>

                <Box sx={{ p: 4 }}>
                    {tabValue === 0 && (
                        <Grid container spacing={3}>
                            {appointments.scheduled.length > 0 ? (
                                appointments.scheduled.map(renderAppointmentCard)
                            ) : (
                                <Grid item xs={12}>
                                    <Box sx={{ textAlign: 'center', py: 8 }}>
                                        <Schedule sx={{ fontSize: 80, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
                                        <Typography variant="h6" color="text.secondary">
                                            No scheduled appointments
                                        </Typography>
                                        <Button
                                            variant="outlined"
                                            sx={{ mt: 2 }}
                                            onClick={() => navigate('/patient/book-appointment')}
                                        >
                                            Book Your First Appointment
                                        </Button>
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
                                        <CheckCircle sx={{ fontSize: 80, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
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
                                        <Cancel sx={{ fontSize: 80, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
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
        </Box>
    );
};

export default PatientAppointments;
