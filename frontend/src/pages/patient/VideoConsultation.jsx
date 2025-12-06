import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Card,
    CardContent,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Snackbar,
    Alert,
    useTheme,
    alpha,
    Avatar,
    Divider,
    Tabs,
    Tab,
} from '@mui/material';
import {
    VideoCall,
    Schedule,
    CheckCircle,
    Cancel,
    AccessTime,
    Person,
    CalendarMonth,
    PlayArrow,
    History,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import videoConsultationService from '@/services/videoConsultationService';
import { patientService } from '@/services/patientService';
import { doctorService } from '@/services/doctorService';
import { formatDateTime } from '@/utils/helpers';
import { useAuthStore } from '@/store/authStore';
import PageTitle from '@/components/common/PageTitle';

const PatientVideoConsultation = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { user } = useAuthStore();

    const [consultations, setConsultations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tabValue, setTabValue] = useState(0);
    const [doctorsMap, setDoctorsMap] = useState({});
    const [openDialog, setOpenDialog] = useState(false);
    const [formData, setFormData] = useState({
        scheduled_time: '',
        reason: '',
    });
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        fetchConsultations();
    }, []);

    const fetchConsultations = async () => {
        try {
            setLoading(true);
            const data = await videoConsultationService.getAllConsultations();
            setConsultations(data);

            // Fetch All Doctors to build map
            try {
                const doctors = await doctorService.getAllDoctors();
                const dMap = {};
                if (Array.isArray(doctors)) {
                    doctors.forEach(doc => {
                        dMap[doc.id] = doc;
                    });
                }
                setDoctorsMap(dMap);
            } catch (err) {
                console.error('Error fetching doctors list:', err);
            }
        } catch (error) {
            console.error('Error fetching consultations:', error);
            showSnackbar('Failed to load consultations', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateConsultation = async () => {
        try {
            // Get patient profile to get patient_id and primary_doctor_id
            const patientProfile = await patientService.getMyProfile();

            if (!patientProfile.primary_doctor_id) {
                showSnackbar('You need to have a primary doctor assigned', 'error');
                return;
            }

            const consultationData = {
                patient_id: patientProfile.id,
                doctor_id: patientProfile.primary_doctor_id,
                scheduled_time: new Date(formData.scheduled_time).toISOString(),
                reason: formData.reason,
            };

            await videoConsultationService.createConsultation(consultationData);
            showSnackbar('Video consultation requested successfully!', 'success');
            setOpenDialog(false);
            setFormData({ scheduled_time: '', reason: '' });
            fetchConsultations();
        } catch (error) {
            console.error('Error creating consultation:', error);
            showSnackbar(error.response?.data?.detail || 'Failed to request consultation', 'error');
        }
    };

    const handleJoinMeeting = (consultation) => {
        if (consultation.meeting_url) {
            window.open(consultation.meeting_url, '_blank');
        }
    };

    const handleCancelConsultation = async (id) => {
        try {
            await videoConsultationService.cancelConsultation(id);
            showSnackbar('Consultation cancelled', 'success');
            fetchConsultations();
        } catch (error) {
            console.error('Error cancelling consultation:', error);
            showSnackbar('Failed to cancel consultation', 'error');
        }
    };

    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const getStatusColor = (status) => {
        const colors = {
            scheduled: 'info',
            in_progress: 'warning',
            completed: 'success',
            cancelled: 'error',
        };
        return colors[status] || 'default';
    };

    const getStatusIcon = (status) => {
        const icons = {
            scheduled: <Schedule />,
            in_progress: <PlayArrow />,
            completed: <CheckCircle />,
            cancelled: <Cancel />,
        };
        return icons[status] || <Schedule />;
    };

    // Filter consultations based on tabs
    const getFilteredConsultations = () => {
        if (tabValue === 0) { // Scheduled
            return consultations.filter(c => c.status === 'scheduled');
        } else if (tabValue === 1) { // In Progress
            return consultations.filter(c => c.status === 'in_progress');
        } else if (tabValue === 2) { // Completed
            return consultations.filter(c => c.status === 'completed');
        } else { // Cancelled
            return consultations.filter(c => c.status === 'cancelled');
        }
    };

    const renderConsultationCard = (consultation) => {
        // Prefer the map if consultation.doctor is missing or doesn't have user info
        let doctor = doctorsMap[consultation.doctor_id];
        if (!doctor && consultation.doctor && consultation.doctor.user) {
            doctor = consultation.doctor;
        }

        const doctorName = doctor?.user?.full_name || 'Unknown Doctor';
        const specialization = doctor?.specialization || 'Specialist';

        return (
            <Grid item xs={12} md={6} key={consultation.id}>
                <Card elevation={0} sx={{
                    borderRadius: 4,
                    border: '1px solid',
                    borderColor: 'divider',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                        borderColor: 'primary.main',
                        boxShadow: '0 8px 24px -10px rgba(0, 0, 0, 0.1)',
                        transform: 'translateY(-2px)',
                    }
                }}>
                    <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Avatar sx={{
                                    width: 56,
                                    height: 56,
                                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                                    color: 'primary.main',
                                }}>
                                    <VideoCall />
                                </Avatar>
                                <Box>
                                    <Typography variant="h6" fontWeight="700">
                                        {doctorName}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {specialization}
                                    </Typography>
                                </Box>
                            </Box>
                            <Chip
                                label={consultation.status.replace('_', ' ').toUpperCase()}
                                size="small"
                                color={getStatusColor(consultation.status)}
                                icon={getStatusIcon(consultation.status)}
                                sx={{ fontWeight: 600, borderRadius: 2 }}
                            />
                        </Box>

                        <Divider sx={{ my: 2 }} />

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CalendarMonth sx={{ fontSize: 18, color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary">
                                    {formatDateTime(consultation.scheduled_time)}
                                </Typography>
                            </Box>
                            {consultation.reason && (
                                <Box sx={{ display: 'flex', alignItems: 'start', gap: 1 }}>
                                    <Person sx={{ fontSize: 18, color: 'text.secondary', mt: 0.3 }} />
                                    <Typography variant="body2" color="text.secondary">
                                        {consultation.reason}
                                    </Typography>
                                </Box>
                            )}
                            {consultation.duration_minutes && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <AccessTime sx={{ fontSize: 18, color: 'text.secondary' }} />
                                    <Typography variant="body2" color="text.secondary">
                                        Duration: {consultation.duration_minutes} minutes
                                    </Typography>
                                </Box>
                            )}
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1, mt: 3 }}>
                            {consultation.status === 'scheduled' && (
                                <>
                                    <Button
                                        variant="contained"
                                        size="small"
                                        startIcon={<VideoCall />}
                                        onClick={() => handleJoinMeeting(consultation)}
                                        sx={{ borderRadius: 2, flex: 1 }}
                                    >
                                        Join
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        color="error"
                                        onClick={() => handleCancelConsultation(consultation.id)}
                                        sx={{ borderRadius: 2 }}
                                    >
                                        Cancel
                                    </Button>
                                </>
                            )}
                            {consultation.status === 'in_progress' && (
                                <Button
                                    variant="contained"
                                    size="small"
                                    fullWidth
                                    startIcon={<VideoCall />}
                                    onClick={() => handleJoinMeeting(consultation)}
                                    sx={{ borderRadius: 2 }}
                                    color="warning"
                                >
                                    Join Ongoing Meeting
                                </Button>
                            )}
                        </Box>
                    </CardContent>
                </Card>
            </Grid>
        );
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    const filteredConsultations = getFilteredConsultations();

    return (
        <Box sx={{ pb: 4 }}>
            <Box sx={{ mb: 3 }}>
                <PageTitle
                    actions={
                        <Button
                            variant="contained"
                            startIcon={<VideoCall />}
                            onClick={() => setOpenDialog(true)}
                        >
                            Request Consultation
                        </Button>
                    }
                >
                    Video Consultations
                </PageTitle>
            </Box>

            <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, overflow: 'hidden' }}>
                <Tabs
                    value={tabValue}
                    onChange={(e, v) => setTabValue(v)}
                    variant="fullWidth"
                    sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}
                >
                    <Tab label="Scheduled" icon={<Schedule />} iconPosition="start" sx={{ minHeight: 64 }} />
                    <Tab label="In Progress" icon={<PlayArrow />} iconPosition="start" sx={{ minHeight: 64 }} />
                    <Tab label="Completed" icon={<History />} iconPosition="start" sx={{ minHeight: 64 }} />
                    <Tab label="Cancelled" icon={<Cancel />} iconPosition="start" sx={{ minHeight: 64 }} />
                </Tabs>

                <Box sx={{ p: 4 }}>
                    <Grid container spacing={3}>
                        {filteredConsultations.length > 0 ? (
                            filteredConsultations.map(renderConsultationCard)
                        ) : (
                            <Grid item xs={12}>
                                <Box sx={{ textAlign: 'center', py: 8 }}>
                                    <VideoCall sx={{ fontSize: 80, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
                                    <Typography variant="h6" color="text.secondary">
                                        No {tabValue === 0 ? 'scheduled' : tabValue === 1 ? 'active' : tabValue === 2 ? 'completed' : 'cancelled'} consultations
                                    </Typography>
                                    {tabValue === 0 && (
                                        <Button
                                            variant="outlined"
                                            sx={{ mt: 2 }}
                                            onClick={() => setOpenDialog(true)}
                                        >
                                            Request One Now
                                        </Button>
                                    )}
                                </Box>
                            </Grid>
                        )}
                    </Grid>
                </Box>
            </Paper>

            {/* Request Consultation Dialog */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Request Video Consultation</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                        <TextField
                            label="Scheduled Date & Time"
                            type="datetime-local"
                            fullWidth
                            value={formData.scheduled_time}
                            onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{ min: new Date().toISOString().slice(0, 16) }}
                        />
                        <TextField
                            label="Reason for Consultation"
                            multiline
                            rows={4}
                            fullWidth
                            value={formData.reason}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                            placeholder="Describe your symptoms or reason for consultation..."
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleCreateConsultation}
                        disabled={!formData.scheduled_time}
                    >
                        Request Consultation
                    </Button>
                </DialogActions>
            </Dialog>

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

export default PatientVideoConsultation;
