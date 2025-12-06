import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Avatar,
    Chip,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Rating,
    CircularProgress,
    Alert,
    Snackbar,
    useTheme,
    alpha,
    Grid,
    Divider,
    Paper,
    Container
} from '@mui/material';
import {
    MedicalServices,
    Star,
    Email,
    Phone,
    School,
    Work,
    AttachMoney,
    RateReview,
    AccessTime,
    EventAvailable,
    VerifiedUser,
    LocationOn,
    Badge
} from '@mui/icons-material';
import api from '@/services/api';
import { patientService } from '@/services/patientService';

const MyDoctor = () => {
    const theme = useTheme();
    const [doctor, setDoctor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [openReviewDialog, setOpenReviewDialog] = useState(false);
    const [rating, setRating] = useState(0);
    const [reviewText, setReviewText] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        fetchMyDoctor();
    }, []);

    const fetchMyDoctor = async () => {
        try {
            setLoading(true);
            // Use getMyProfile to get the patient profile which includes primary_doctor
            const profile = await patientService.getMyProfile();

            if (!profile.primary_doctor) {
                setDoctor(null);
            } else {
                const doc = profile.primary_doctor;
                const docUser = doc.user || {};

                // Map the nested structure to a flat object for easier display
                setDoctor({
                    id: doc.id,
                    doctor_id: doc.doctor_id,
                    name: docUser.full_name,
                    email: docUser.email,
                    phone: docUser.phone,
                    address: docUser.address,
                    specialization: doc.specialization,
                    qualification: doc.qualification,
                    experience_years: doc.experience_years,
                    consultation_fee: doc.consultation_fee,
                    rating: doc.rating,
                    total_reviews: doc.total_reviews,
                    bio: doc.bio,
                    department: doc.department,
                    license_number: doc.license_number,
                    available_days: doc.available_days,
                    consultation_start_time: doc.consultation_start_time,
                    consultation_end_time: doc.consultation_end_time
                });
            }
        } catch (error) {
            console.error('Error fetching doctor:', error);
            showSnackbar('Failed to load doctor information', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitReview = async () => {
        if (rating === 0) {
            showSnackbar('Please select a rating', 'warning');
            return;
        }

        try {
            setSubmitting(true);
            await api.post(`/doctors/${doctor.doctor_id}/reviews`, {
                rating,
                review_text: reviewText
            });
            showSnackbar('Review submitted successfully!', 'success');
            setOpenReviewDialog(false);
            setRating(0);
            setReviewText('');
            fetchMyDoctor(); // Refresh to get updated rating
        } catch (error) {
            console.error('Error submitting review:', error);
            showSnackbar(error.response?.data?.detail || 'Failed to submit review', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const showSnackbar = (message, severity) => {
        setSnackbar({ open: true, message, severity });
    };

    const InfoItem = ({ icon, label, value, color }) => (
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 3 }}>
            <Avatar sx={{
                bgcolor: alpha(color || theme.palette.primary.main, 0.1),
                color: color || theme.palette.primary.main,
                width: 48,
                height: 48,
                flexShrink: 0 // Prevent avatar shrinking
            }}>
                {icon}
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}> {/* minWidth: 0 is crucial for text truncation in flex items */}
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    {label}
                </Typography>
                <Typography
                    variant="body1"
                    fontWeight="600"
                    sx={{
                        wordBreak: 'break-word', // Ensure long emails/addresses wrap locally
                        overflowWrap: 'break-word'
                    }}
                >
                    {value || 'Not specified'}
                </Typography>
            </Box>
        </Box>
    );

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!doctor) {
        return (
            <Box sx={{ textAlign: 'center', py: 8 }}>
                <MedicalServices sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h5" color="text.secondary" gutterBottom>
                    No Doctor Assigned
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    You don't have an assigned doctor yet. Please contact the hospital administration.
                </Typography>
            </Box>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Typography variant="h4" fontWeight="800" gutterBottom sx={{
                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                backgroundClip: 'text',
                textFillColor: 'transparent',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 4
            }}>
                My Doctor
            </Typography>

            <Grid container spacing={4}>
                {/* Left Column - Profile Card */}
                <Grid item xs={12} lg={4}>
                    <Card
                        elevation={0}
                        sx={{
                            borderRadius: 4,
                            border: '1px solid',
                            borderColor: 'divider',
                            overflow: 'hidden'
                        }}
                    >
                        <Box sx={{
                            background: `linear-gradient(135deg, #4834d4 0%, #686de0 100%)`,
                            p: 4,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            color: 'white',
                            textAlign: 'center'
                        }}>
                            <Avatar
                                sx={{
                                    width: 150,
                                    height: 150,
                                    bgcolor: 'white',
                                    color: 'primary.main',
                                    fontSize: '4rem',
                                    fontWeight: 'bold',
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                                    mb: 2,
                                    border: '4px solid rgba(255,255,255,0.3)'
                                }}
                            >
                                {doctor.name?.charAt(0)}
                            </Avatar>
                            <Typography variant="h5" fontWeight="700" gutterBottom>
                                {doctor.name}
                            </Typography>
                            <Typography variant="subtitle1" sx={{ opacity: 0.9, mb: 2 }}>
                                {doctor.specialization}
                            </Typography>

                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
                                <Chip
                                    icon={<Star sx={{ color: '#FFD700 !important' }} />}
                                    label={`${doctor.rating} / 5.0`}
                                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600 }}
                                />
                                {doctor.department && (
                                    <Chip
                                        label={doctor.department.name}
                                        sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600 }}
                                    />
                                )}
                            </Box>
                        </Box>

                        <CardContent sx={{ p: 3 }}>
                            <Button
                                fullWidth
                                variant="contained"
                                size="large"
                                startIcon={<RateReview />}
                                onClick={() => setOpenReviewDialog(true)}
                                sx={{
                                    borderRadius: 3,
                                    py: 1.5,
                                    background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                                    fontWeight: 700,
                                    textTransform: 'none',
                                    fontSize: '1rem',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                }}
                            >
                                Rate & Review Doctor
                            </Button>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Right Column - Detailed Info */}
                <Grid item xs={12} lg={8}>
                    <Card
                        elevation={0}
                        sx={{
                            borderRadius: 4,
                            border: '1px solid',
                            borderColor: 'divider',
                            overflow: 'hidden'
                        }}
                    >
                        <CardContent sx={{ p: 4 }}>
                            <Typography variant="h6" fontWeight="700" gutterBottom sx={{ mb: 3 }}>
                                Professional Details
                            </Typography>

                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <InfoItem
                                        icon={<School />}
                                        label="Qualification"
                                        value={doctor.qualification}
                                        color={theme.palette.info.main}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <InfoItem
                                        icon={<Work />}
                                        label="Experience"
                                        value={`${doctor.experience_years} Years`}
                                        color={theme.palette.warning.main}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <InfoItem
                                        icon={<VerifiedUser />}
                                        label="License Number"
                                        value={doctor.license_number}
                                        color={theme.palette.success.main}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <InfoItem
                                        icon={<Badge />}
                                        label="Doctor ID"
                                        value={doctor.doctor_id}
                                        color={theme.palette.secondary.main}
                                    />
                                </Grid>
                            </Grid>

                            <Divider sx={{ my: 3 }} />

                            <Typography variant="h6" fontWeight="700" gutterBottom sx={{ mb: 3 }}>
                                Availability & Fees
                            </Typography>

                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <InfoItem
                                        icon={<AttachMoney />}
                                        label="Consultation Fee"
                                        value={`₹${doctor.consultation_fee}`}
                                        color={theme.palette.success.main}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <InfoItem
                                        icon={<EventAvailable />}
                                        label="Available Days"
                                        value={doctor.available_days}
                                        color={theme.palette.primary.main}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <InfoItem
                                        icon={<AccessTime />}
                                        label="Consultation Hours"
                                        value={doctor.consultation_start_time && doctor.consultation_end_time ?
                                            `${doctor.consultation_start_time} - ${doctor.consultation_end_time}` :
                                            'Not specified'}
                                        color={theme.palette.info.main}
                                    />
                                </Grid>
                            </Grid>

                            <Divider sx={{ my: 3 }} />

                            <Typography variant="h6" fontWeight="700" gutterBottom sx={{ mb: 3 }}>
                                Contact Information
                            </Typography>

                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <InfoItem
                                        icon={<Email />}
                                        label="Email Address"
                                        value={doctor.email}
                                        color={theme.palette.error.main}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <InfoItem
                                        icon={<Phone />}
                                        label="Phone Number"
                                        value={doctor.phone}
                                        color={theme.palette.success.main}
                                    />
                                </Grid>
                                {doctor.address && (
                                    <Grid item xs={12}>
                                        <InfoItem
                                            icon={<LocationOn />}
                                            label="Address"
                                            value={doctor.address}
                                            color={theme.palette.text.secondary}
                                        />
                                    </Grid>
                                )}
                            </Grid>

                            {doctor.bio && (
                                <>
                                    <Divider sx={{ my: 3 }} />
                                    <Typography variant="h6" fontWeight="700" gutterBottom sx={{ mb: 2 }}>
                                        About Doctor
                                    </Typography>
                                    <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                                        {doctor.bio}
                                    </Typography>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Enhanced Review Dialog */}
            <Dialog
                open={openReviewDialog}
                onClose={() => setOpenReviewDialog(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 4,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        p: 0.5
                    }
                }}
            >
                <Box sx={{ background: 'white', borderRadius: 3.5 }}>
                    <DialogTitle sx={{ pb: 2, pt: 4, px: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <Avatar
                                sx={{
                                    width: 60,
                                    height: 60,
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    fontSize: '1.5rem',
                                    fontWeight: 700
                                }}
                            >
                                {doctor.name?.charAt(0)}
                            </Avatar>
                            <Box>
                                <Typography variant="h5" fontWeight="700" sx={{ mb: 0.5 }}>
                                    Rate & Review
                                </Typography>
                                <Typography variant="body1" color="text.secondary" fontWeight="500">
                                    {doctor.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {doctor.specialization}
                                </Typography>
                            </Box>
                        </Box>
                    </DialogTitle>

                    <DialogContent sx={{ px: 4, pb: 2 }}>
                        <Box sx={{ py: 2 }}>
                            {/* Rating Section */}
                            <Box
                                sx={{
                                    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                                    borderRadius: 3,
                                    p: 3,
                                    mb: 3,
                                    textAlign: 'center'
                                }}
                            >
                                <Typography variant="h6" fontWeight="600" gutterBottom>
                                    How would you rate your experience?
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    Your feedback helps us improve our services
                                </Typography>
                                <Rating
                                    value={rating}
                                    onChange={(event, newValue) => setRating(newValue)}
                                    size="large"
                                    sx={{
                                        fontSize: '3rem',
                                        '& .MuiRating-iconFilled': {
                                            color: '#ffd700',
                                            filter: 'drop-shadow(0 2px 4px rgba(255,215,0,0.3))'
                                        },
                                        '& .MuiRating-iconHover': {
                                            color: '#ffd700',
                                            transform: 'scale(1.1)',
                                            transition: 'transform 0.2s'
                                        }
                                    }}
                                />
                                {rating > 0 && (
                                    <Typography variant="body1" fontWeight="600" sx={{ mt: 1, color: '#667eea' }}>
                                        {rating === 5 ? 'Excellent!' : rating === 4 ? 'Great!' : rating === 3 ? 'Good' : rating === 2 ? 'Fair' : 'Needs Improvement'}
                                    </Typography>
                                )}
                            </Box>

                            {/* Review Text Section */}
                            <Box>
                                <Typography variant="subtitle1" fontWeight="600" gutterBottom sx={{ mb: 1.5 }}>
                                    Share Your Experience (Optional)
                                </Typography>
                                <TextField
                                    multiline
                                    rows={5}
                                    fullWidth
                                    value={reviewText}
                                    onChange={(e) => setReviewText(e.target.value)}
                                    placeholder="Tell us about your experience with this doctor. What did you like? What could be improved?"
                                    variant="outlined"
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2,
                                            '&:hover fieldset': {
                                                borderColor: '#667eea'
                                            },
                                            '&.Mui-focused fieldset': {
                                                borderColor: '#667eea',
                                                borderWidth: 2
                                            }
                                        }
                                    }}
                                />
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                    {reviewText.length}/500 characters
                                </Typography>
                            </Box>
                        </Box>
                    </DialogContent>

                    <DialogActions sx={{ px: 4, pb: 4, pt: 2, gap: 2 }}>
                        <Button
                            onClick={() => setOpenReviewDialog(false)}
                            disabled={submitting}
                            sx={{
                                borderRadius: 2,
                                px: 3,
                                py: 1,
                                textTransform: 'none',
                                fontWeight: 600,
                                color: 'text.secondary'
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleSubmitReview}
                            disabled={submitting || rating === 0}
                            sx={{
                                borderRadius: 2,
                                px: 4,
                                py: 1,
                                textTransform: 'none',
                                fontWeight: 600,
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                                '&:hover': {
                                    background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                                    boxShadow: '0 6px 20px rgba(102, 126, 234, 0.6)'
                                },
                                '&:disabled': {
                                    background: '#ccc'
                                }
                            }}
                        >
                            {submitting ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Submit Review'}
                        </Button>
                    </DialogActions>
                </Box>
            </Dialog>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity}
                    sx={{ width: '100%', borderRadius: 2 }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default MyDoctor;
