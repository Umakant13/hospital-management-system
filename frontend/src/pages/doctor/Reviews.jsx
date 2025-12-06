import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    Avatar,
    Rating,
    Chip,
    CircularProgress,
    Paper,
    useTheme,
    alpha,
    Divider
} from '@mui/material';
import {
    Star,
    Person,
    RateReview
} from '@mui/icons-material';
import { doctorService } from '@/services/doctorService';
import { useAuthStore } from '@/store/authStore';
import PageTitle from '@/components/common/PageTitle';
import { format } from 'date-fns';

const DoctorReviews = () => {
    const theme = useTheme();
    const { user } = useAuthStore();
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    });

    useEffect(() => {
        if (user?.doctor_id) {
            fetchReviews();
        }
    }, [user]);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const data = await doctorService.getDoctorReviews(user.doctor_id);
            setReviews(data);
            calculateStats(data);
        } catch (error) {
            console.error('Error fetching reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (reviewsData) => {
        if (reviewsData.length === 0) {
            setStats({ averageRating: 0, totalReviews: 0, ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } });
            return;
        }

        const total = reviewsData.length;
        const sum = reviewsData.reduce((acc, r) => acc + r.rating, 0);
        const avg = sum / total;

        const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        reviewsData.forEach(r => {
            const roundedRating = Math.round(r.rating);
            distribution[roundedRating]++;
        });

        setStats({
            averageRating: avg,
            totalReviews: total,
            ratingDistribution: distribution
        });
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <PageTitle>
                My Reviews
            </PageTitle>

            {/* Statistics Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={4}>
                    <Card
                        elevation={0}
                        sx={{
                            borderRadius: 4,
                            border: '1px solid',
                            borderColor: 'divider',
                            height: '100%',
                            background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.1)} 0%, ${alpha(theme.palette.warning.main, 0.05)} 100%)`
                        }}
                    >
                        <CardContent sx={{ textAlign: 'center', py: 4 }}>
                            <Star sx={{ fontSize: 60, color: '#FFD700', mb: 2 }} />
                            <Typography variant="h2" fontWeight="800" color="warning.main">
                                {stats.averageRating.toFixed(1)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" fontWeight="600">
                                Average Rating
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Card
                        elevation={0}
                        sx={{
                            borderRadius: 4,
                            border: '1px solid',
                            borderColor: 'divider',
                            height: '100%',
                            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`
                        }}
                    >
                        <CardContent sx={{ textAlign: 'center', py: 4 }}>
                            <RateReview sx={{ fontSize: 60, color: theme.palette.primary.main, mb: 2 }} />
                            <Typography variant="h2" fontWeight="800" color="primary.main">
                                {stats.totalReviews}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" fontWeight="600">
                                Total Reviews
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Card
                        elevation={0}
                        sx={{
                            borderRadius: 4,
                            border: '1px solid',
                            borderColor: 'divider',
                            height: '100%'
                        }}
                    >
                        <CardContent sx={{ py: 3 }}>
                            <Typography variant="subtitle2" fontWeight="700" gutterBottom>
                                Rating Distribution
                            </Typography>
                            {[5, 4, 3, 2, 1].map((star) => (
                                <Box key={star} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <Typography variant="body2" sx={{ minWidth: 20 }}>{star}</Typography>
                                    <Star sx={{ fontSize: 16, color: '#FFD700' }} />
                                    <Box sx={{ flexGrow: 1, bgcolor: 'grey.200', borderRadius: 1, height: 8 }}>
                                        <Box
                                            sx={{
                                                width: `${stats.totalReviews > 0 ? (stats.ratingDistribution[star] / stats.totalReviews) * 100 : 0}%`,
                                                bgcolor: '#FFD700',
                                                height: '100%',
                                                borderRadius: 1
                                            }}
                                        />
                                    </Box>
                                    <Typography variant="caption" sx={{ minWidth: 30, textAlign: 'right' }}>
                                        {stats.ratingDistribution[star]}
                                    </Typography>
                                </Box>
                            ))}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Reviews List */}
            <Typography variant="h5" fontWeight="700" gutterBottom sx={{ mb: 3 }}>
                Patient Reviews
            </Typography>

            {reviews.length === 0 ? (
                <Paper
                    elevation={0}
                    sx={{
                        p: 6,
                        textAlign: 'center',
                        borderRadius: 4,
                        border: '1px dashed',
                        borderColor: 'divider'
                    }}
                >
                    <RateReview sx={{ fontSize: 60, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
                    <Typography variant="h6" color="text.secondary">
                        No reviews yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Reviews from your patients will appear here
                    </Typography>
                </Paper>
            ) : (
                <Grid container spacing={3}>
                    {reviews.map((review) => (
                        <Grid item xs={12} key={review.id}>
                            <Card
                                elevation={0}
                                sx={{
                                    borderRadius: 4,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.1)',
                                        transform: 'translateY(-2px)'
                                    }
                                }}
                            >
                                <CardContent sx={{ p: 3 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Avatar
                                                sx={{
                                                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                                                    color: 'primary.main',
                                                    width: 48,
                                                    height: 48,
                                                    fontWeight: 'bold'
                                                }}
                                            >
                                                {review.patient_name?.charAt(0)}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="h6" fontWeight="700">
                                                    {review.patient_name}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {format(new Date(review.created_at), 'MMM dd, yyyy')}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Chip
                                            icon={<Star sx={{ fontSize: 16, color: '#FFD700 !important' }} />}
                                            label={review.rating.toFixed(1)}
                                            sx={{
                                                bgcolor: alpha('#FFD700', 0.1),
                                                color: '#F57C00',
                                                fontWeight: 700,
                                                borderRadius: 2
                                            }}
                                        />
                                    </Box>

                                    <Rating value={review.rating} readOnly size="small" sx={{ mb: 2 }} />

                                    {review.review_text && (
                                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                            "{review.review_text}"
                                        </Typography>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}
        </Box>
    );
};

export default DoctorReviews;
