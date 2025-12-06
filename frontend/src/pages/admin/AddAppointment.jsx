import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    TextField,
    Grid,
    MenuItem,
    Card,
    CardContent,
    Alert,
} from '@mui/material';
import { ArrowBack, Save } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { patientService } from '@/services/patientService';
import { doctorService } from '@/services/doctorService';
import { appointmentService } from '@/services/appointmentService';
import PageTitle from '@/components/common/PageTitle';

const AddAppointment = () => {
    const navigate = useNavigate();
    const [patients, setPatients] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [filteredDoctors, setFilteredDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const { register, handleSubmit, watch, formState: { errors } } = useForm({
        defaultValues: {
            patient_id: '',
            doctor_id: '',
            appointment_date: '',
            appointment_time: '',
            appointment_type: 'routine_checkup',
            reason: '',
            symptoms: '',
        }
    });

    const selectedDoctorId = watch('doctor_id');

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        // Filter doctors based on search or show all
        setFilteredDoctors(doctors);
    }, [doctors]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [patientsData, doctorsData] = await Promise.all([
                patientService.getAllPatients(),
                doctorService.getAllDoctors(),
            ]);

            const patientsList = Array.isArray(patientsData) ? patientsData : (patientsData.patients || []);
            const doctorsList = Array.isArray(doctorsData) ? doctorsData : [];

            setPatients(patientsList);
            setDoctors(doctorsList);
            setFilteredDoctors(doctorsList);
        } catch (error) {
            console.error('Error fetching data:', error);
            setError('Failed to load patients and doctors');
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data) => {
        try {
            setError('');

            // Combine date and time into ISO datetime format
            const appointmentDateTime = `${data.appointment_date}T${data.appointment_time}:00`;

            // Format the data according to the API schema
            const appointmentData = {
                patient_id: parseInt(data.patient_id),
                doctor_id: parseInt(data.doctor_id),
                appointment_date: appointmentDateTime,
                appointment_type: data.appointment_type,
                reason: data.reason || '',
                symptoms: data.symptoms || '',
            };

            await appointmentService.createAppointment(appointmentData);
            setSuccess(true);

            // Redirect after 2 seconds
            setTimeout(() => {
                navigate('/admin/appointments');
            }, 2000);
        } catch (error) {
            console.error('Error creating appointment:', error);
            setError(error.response?.data?.detail || 'Failed to create appointment');
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Typography>Loading...</Typography>
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Button
                    startIcon={<ArrowBack />}
                    onClick={() => navigate('/admin/appointments')}
                    sx={{ mr: 2 }}
                >
                    Back
                </Button>
                <PageTitle>
                    Add Appointment
                </PageTitle>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            {success && (
                <Alert severity="success" sx={{ mb: 3 }}>
                    Appointment created successfully! Redirecting...
                </Alert>
            )}

            <Paper elevation={2} sx={{ p: 4 }}>
                <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                    <Grid container spacing={3}>
                        {/* Patient Selection */}
                        <Grid item xs={12}>
                            <Card elevation={0} sx={{ bgcolor: 'grey.50', border: '1px solid #e0e0e0' }}>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Patient Information
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        select
                                        label="Select Patient *"
                                        {...register('patient_id', { required: 'Patient is required' })}
                                        error={!!errors.patient_id}
                                        helperText={errors.patient_id?.message || `${patients.length} patients available`}
                                        defaultValue=""
                                    >
                                        {patients.filter(p => p.user?.full_name).map((patient) => (
                                            <MenuItem key={patient.id} value={patient.id}>
                                                {patient.user?.full_name} (ID: {patient.patient_id}) - {patient.age} yrs, {patient.gender}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Doctor Selection */}
                        <Grid item xs={12}>
                            <Card elevation={0} sx={{ bgcolor: 'grey.50', border: '1px solid #e0e0e0' }}>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Doctor Information
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        select
                                        label="Select Doctor *"
                                        {...register('doctor_id', { required: 'Doctor is required' })}
                                        error={!!errors.doctor_id}
                                        helperText={errors.doctor_id?.message || `${filteredDoctors.length} doctors available`}
                                        defaultValue=""
                                    >
                                        {filteredDoctors.filter(d => d.user?.full_name).map((doctor) => (
                                            <MenuItem key={doctor.id} value={doctor.id}>
                                                {doctor.user?.full_name} - {doctor.specialization} (Fee: ₹{doctor.consultation_fee})
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Appointment Details */}
                        <Grid item xs={12}>
                            <Card elevation={0} sx={{ bgcolor: 'grey.50', border: '1px solid #e0e0e0' }}>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Appointment Details
                                    </Typography>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                type="date"
                                                label="Appointment Date *"
                                                InputLabelProps={{ shrink: true }}
                                                {...register('appointment_date', { required: 'Date is required' })}
                                                error={!!errors.appointment_date}
                                                helperText={errors.appointment_date?.message}
                                                inputProps={{
                                                    min: new Date().toISOString().split('T')[0] // Disable past dates
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                type="time"
                                                label="Appointment Time *"
                                                InputLabelProps={{ shrink: true }}
                                                {...register('appointment_time', { required: 'Time is required' })}
                                                error={!!errors.appointment_time}
                                                helperText={errors.appointment_time?.message}
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <TextField
                                                fullWidth
                                                select
                                                label="Appointment Type *"
                                                {...register('appointment_type', { required: 'Type is required' })}
                                                error={!!errors.appointment_type}
                                                helperText={errors.appointment_type?.message}
                                                defaultValue="routine_checkup"
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
                                                rows={3}
                                                label="Reason for Visit *"
                                                placeholder="Please describe the reason for this appointment..."
                                                {...register('reason', { required: 'Reason is required' })}
                                                error={!!errors.reason}
                                                helperText={errors.reason?.message}
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <TextField
                                                fullWidth
                                                multiline
                                                rows={3}
                                                label="Symptoms (Optional)"
                                                placeholder="Describe any symptoms the patient is experiencing..."
                                                {...register('symptoms')}
                                            />
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Action Buttons */}
                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                                <Button
                                    variant="outlined"
                                    onClick={() => navigate('/admin/appointments')}
                                    disabled={success}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    startIcon={<Save />}
                                    disabled={success}
                                >
                                    Create Appointment
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </Box>
            </Paper>
        </Box>
    );
};

export default AddAppointment;
