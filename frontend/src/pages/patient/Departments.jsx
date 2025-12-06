import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    Avatar,
    Chip,
    useTheme,
    alpha,
    CircularProgress,
    Container,
    Button
} from '@mui/material';
import {
    LocalHospital,
    MedicalServices,
    People,
    ArrowForward
} from '@mui/icons-material';
import { departmentService } from '@/services/departmentService';
import { doctorService } from '@/services/doctorService';
import PageTitle from '@/components/common/PageTitle';
import { useNavigate } from 'react-router-dom';

const Departments = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDepartments();
    }, []);

    const fetchDepartments = async () => {
        try {
            setLoading(true);
            const data = await departmentService.getAllDepartments();
            setDepartments(data);
        } catch (error) {
            console.error('Error fetching departments:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ pb: 4 }}>
            <Box sx={{ mb: 5, textAlign: 'center' }}>
                <PageTitle>
                    Departments
                </PageTitle>
                <Typography variant="h6" color="text.secondary" fontWeight="normal" sx={{ maxWidth: 600, mx: 'auto' }}>
                    World-class specialized care across multiple medical disciplines.
                </Typography>
            </Box>

            <Grid container spacing={3}>
                {departments.map((dept) => (
                    <Grid item xs={12} sm={6} md={4} key={dept.id}>
                        <Card
                            elevation={0}
                            sx={{
                                height: '100%',
                                borderRadius: 4,
                                border: '1px solid',
                                borderColor: 'divider',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: '0 12px 24px -10px rgba(0, 0, 0, 0.1)',
                                    borderColor: 'primary.main'
                                }
                            }}
                        >
                            <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                    <Avatar
                                        sx={{
                                            width: 56,
                                            height: 56,
                                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                                            color: 'primary.main'
                                        }}
                                    >
                                        <MedicalServices />
                                    </Avatar>
                                    <Box>
                                        <Typography variant="h6" fontWeight="700">
                                            {dept.name}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {dept.code}
                                        </Typography>
                                    </Box>
                                </Box>

                                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, flexGrow: 1 }}>
                                    {dept.description || 'Providing specialized care and treatment for patients.'}
                                </Typography>

                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 'auto' }}>
                                    <Chip
                                        icon={<People sx={{ fontSize: 16 }} />}
                                        label={`${dept.doctor_count || 0} Doctors`}
                                        size="small"
                                        sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.1), color: 'secondary.main', fontWeight: 600 }}
                                    />

                                    <Button
                                        endIcon={<ArrowForward />}
                                        onClick={() => navigate('/patient/doctors')}
                                        sx={{ textTransform: 'none', fontWeight: 600 }}
                                    >
                                        View Doctors
                                    </Button>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

export default Departments;
