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
    Snackbar,
    Alert,
    useTheme,
    alpha,
    Avatar,
    Divider,
    Tabs,
    Tab,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
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
    Stop,
} from '@mui/icons-material';
import videoConsultationService from '@/services/videoConsultationService';
import { doctorService } from '@/services/doctorService';
import { appointmentService } from '@/services/appointmentService';
import { useAuthStore } from '@/store/authStore';
import PageTitle from '@/components/common/PageTitle';
import { formatDateTime } from '@/utils/helpers';

const DoctorVideoConsultation = () => {
    const theme = useTheme();

    const [consultations, setConsultations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(0);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const [openDialog, setOpenDialog] = useState(false);
    const [patients, setPatients] = useState([]);
    const [formData, setFormData] = useState({
        patient_id: '',
        scheduled_time: '',
        reason: '',
    });

    useEffect(() => {
        fetchConsultations();
        fetchPatients();
    }, []);

    const fetchPatients = async () => {
        try {
            const response = await doctorService.getDoctorPatients(await getDoctorId());
            setPatients(response);
        } catch (error) {
            console.error('Error fetching patients:', error);
        }
    };

    const getDoctorId = async () => {
        try {
            const profile = await doctorService.getProfile();
            return profile.doctor_id;
        } catch (error) {
            console.error('Error fetching profile:', error);
            return null;
        }
    };

    const fetchConsultations = async () => {
        try {
            setLoading(true);
            const data = await videoConsultationService.getAllConsultations();
            setConsultations(data);
        } catch (error) {
            console.error('Error fetching consultations:', error);
            showSnackbar('Failed to load consultations', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateConsultation = async () => {
        try {
            const doctorProfile = await doctorService.getProfile();

            const consultationData = {
                patient_id: formData.patient_id,
                doctor_id: doctorProfile.id,
                scheduled_time: formData.scheduled_time, // Send as-is, backend will handle it
                reason: formData.reason,
            };

            await videoConsultationService.createConsultation(consultationData);
            showSnackbar('Video consultation scheduled successfully!', 'success');
            setOpenDialog(false);
            setFormData({ patient_id: '', scheduled_time: '', reason: '' });
            fetchConsultations();
        } catch (error) {
            console.error('Error creating consultation:', error);
            showSnackbar(error.response?.data?.detail || 'Failed to schedule consultation', 'error');
        }
    };

    const handleStartConsultation = async (id) => {
        try {
            await videoConsultationService.startConsultation(id);
            showSnackbar('Consultation started', 'success');
            fetchConsultations();
        } catch (error) {
            console.error('Error starting consultation:', error);
            showSnackbar('Failed to start consultation', 'error');
        }
    };

    const handleEndConsultation = async (id) => {
        try {
            await videoConsultationService.endConsultation(id);
            showSnackbar('Consultation ended', 'success');
            fetchConsultations();
        } catch (error) {
            console.error('Error ending consultation:', error);
            showSnackbar('Failed to end consultation', 'error');
        }
    };

    const handleJoinMeeting = (consultation) => {
        if (consultation.meeting_url) {
            window.open(consultation.meeting_url, '_blank');
        }
    };

    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const getStatusColor = (status) => {
        const colors = {
            scheduled: 'info',
            in_progress: 'success',
            completed: 'default',
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

    const filteredConsultations = consultations.filter(c => {
        if (activeTab === 0) return c.status === 'scheduled';
        if (activeTab === 1) return c.status === 'in_progress';
        if (activeTab === 2) return c.status === 'completed';
        return true;
    });

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ pb: 4 }}>
            <Box sx={{ mb: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <PageTitle>
                        Video Consultations
                    </PageTitle>
                    <Typography variant="h6" color="text.secondary" fontWeight="normal">
                        Manage your virtual appointments
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    size="large"
                    startIcon={<VideoCall />}
                    onClick={() => setOpenDialog(true)}
                    sx={{ borderRadius: 2, px: 3 }}
                >
                    Schedule Consultation
                </Button>
            </Box>

            <Paper elevation={0} sx={{ mb: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
                <Tabs
                    value={activeTab}
                    onChange={(e, newValue) => setActiveTab(newValue)}
                    sx={{ px: 2 }}
                >
                    <Tab label="Scheduled" />
                    <Tab label="In Progress" />
                    <Tab label="Completed" />
                </Tabs>
            </Paper>

            <Grid container spacing={3}>
                {filteredConsultations.length === 0 ? (
                    <Grid item xs={12}>
                        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 4, border: '1px dashed', borderColor: 'divider' }}>
                            <VideoCall sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
                            <Typography variant="h6" color="text.secondary">
                                No {activeTab === 0 ? 'scheduled' : activeTab === 1 ? 'active' : 'completed'} consultations
                            </Typography>
                        </Paper>
                    </Grid>
                ) : (
                    filteredConsultations.map((consultation) => (
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
                                                <Person />
                                            </Avatar>
                                            <Box>
                                                <Typography variant="h6" fontWeight="700">
                                                    {consultation.patient?.name}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Patient ID: {consultation.patient?.patient_id}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Chip
                                            label={consultation.status.toUpperCase()}
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
                                                    startIcon={<PlayArrow />}
                                                    onClick={() => handleStartConsultation(consultation.id)}
                                                    sx={{ borderRadius: 2, flex: 1 }}
                                                >
                                                    Start & Join
                                                </Button>
                                            </>
                                        )}
                                        {consultation.status === 'in_progress' && (
                                            <>
                                                <Button
                                                    variant="contained"
                                                    size="small"
                                                    startIcon={<VideoCall />}
                                                    onClick={() => handleJoinMeeting(consultation)}
                                                    sx={{ borderRadius: 2, flex: 1 }}
                                                >
                                                    Join Meeting
                                                </Button>
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    color="error"
                                                    startIcon={<Stop />}
                                                    onClick={() => handleEndConsultation(consultation.id)}
                                                    sx={{ borderRadius: 2 }}
                                                >
                                                    End
                                                </Button>
                                            </>
                                        )}
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))
                )}
            </Grid>

            {/* Schedule Consultation Dialog */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Schedule Video Consultation</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                        <TextField
                            select
                            label="Select Patient"
                            fullWidth
                            value={formData.patient_id}
                            onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                        >
                            {patients.map((patient) => (
                                <MenuItem key={patient.id} value={patient.id}>
                                    {patient.name} ({patient.patient_id})
                                </MenuItem>
                            ))}
                        </TextField>
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
                            placeholder="Describe the reason for consultation..."
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleCreateConsultation}
                        disabled={!formData.scheduled_time || !formData.patient_id}
                    >
                        Schedule
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

export default DoctorVideoConsultation;
