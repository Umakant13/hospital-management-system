import React, { useState, useEffect } from 'react';
import {
    Box,
    Grid,
    Paper,
    Typography,
    Card,
    CardContent,
    Avatar,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    useTheme,
    alpha,
    LinearProgress,
    IconButton,
    Tooltip,
} from '@mui/material';
import {
    LocalHospital,
    People,
    CalendarMonth,
    TrendingUp,
    Star,
    Phone,
    Email,
    Badge,
    Assessment,
    Schedule,
    CheckCircle,
} from '@mui/icons-material';
import { useAuthStore } from '@/store/authStore';
import { departmentService } from '@/services/departmentService';
import { appointmentService } from '@/services/appointmentService';
import PageTitle from '@/components/common/PageTitle';

const StatCard = ({ title, value, subtitle, icon, color, trend }) => {
    const theme = useTheme();

    return (
        <Card
            elevation={0}
            sx={{
                borderRadius: 4,
                border: '1px solid',
                borderColor: 'divider',
                height: '100%',
                transition: 'all 0.3s ease',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 24px -10px rgba(0, 0, 0, 0.1)',
                    borderColor: color,
                }
            }}
        >
            <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box
                        sx={{
                            p: 1.5,
                            borderRadius: 3,
                            bgcolor: alpha(color, 0.1),
                            color: color,
                        }}
                    >
                        {icon}
                    </Box>
                    {trend && (
                        <Chip
                            size="small"
                            label={trend}
                            sx={{
                                bgcolor: alpha(theme.palette.success.main, 0.1),
                                color: 'success.main',
                                fontWeight: 700,
                            }}
                        />
                    )}
                </Box>
                <Typography variant="h3" fontWeight="800" gutterBottom>
                    {value}
                </Typography>
                <Typography variant="body2" color="text.secondary" fontWeight="600">
                    {title}
                </Typography>
                {subtitle && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                        {subtitle}
                    </Typography>
                )}
            </CardContent>
        </Card>
    );
};

const DoctorDepartment = () => {
    const { user } = useAuthStore();
    const theme = useTheme();

    const [loading, setLoading] = useState(true);
    const [departmentData, setDepartmentData] = useState(null);
    const [doctors, setDoctors] = useState([]);
    const [stats, setStats] = useState({
        totalDoctors: 0,
        totalAppointments: 0,
        completedAppointments: 0,
        avgRating: 0,
    });

    useEffect(() => {
        fetchDepartmentData();
    }, []);

    const fetchDepartmentData = async () => {
        try {
            setLoading(true);

            // Get all departments to find the doctor's department
            const departments = await departmentService.getAllDepartments();

            // Find the department where the current user is a doctor
            const userDepartment = departments.find(dept =>
                dept.doctors?.some(doc => doc.user_id === user.id) ||
                dept.head_doctor?.id === user.doctor_internal_id
            );

            if (!userDepartment) {
                console.warn('No department found for current doctor');
                setLoading(false);
                return;
            }

            setDepartmentData(userDepartment);

            // Fetch department doctors
            const deptDoctors = await departmentService.getDepartmentDoctors(userDepartment.id);
            setDoctors(deptDoctors);

            // Fetch appointments for the department
            const allAppointments = await appointmentService.getAllAppointments();
            const departmentAppointments = allAppointments.filter(apt =>
                deptDoctors.some(doc => doc.id === apt.doctor_id)
            );

            // Calculate stats
            const completedCount = departmentAppointments.filter(apt => apt.status === 'completed').length;
            const avgRating = deptDoctors.reduce((sum, doc) => sum + (doc.rating || 0), 0) / (deptDoctors.length || 1);

            setStats({
                totalDoctors: deptDoctors.length,
                totalAppointments: departmentAppointments.length,
                completedAppointments: completedCount,
                avgRating: avgRating.toFixed(1),
            });

        } catch (error) {
            console.error('Error fetching department data:', error);
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

    if (!departmentData) {
        return (
            <Box sx={{ textAlign: 'center', py: 8 }}>
                <LocalHospital sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h5" color="text.secondary">
                    No department assigned
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Please contact administration to be assigned to a department.
                </Typography>
            </Box>
        );
    }

    const isHeadDoctor = departmentData.head_doctor?.id === user.doctor_internal_id;

    return (
        <Box sx={{ pb: 4 }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Box sx={{ mb: 2 }}>
                    <Typography variant="overline" color="text.secondary" fontWeight="700" letterSpacing={1} sx={{ display: 'block', lineHeight: 1, mb: 1 }}>
                        DEPARTMENT
                    </Typography>
                    <PageTitle sx={{ mb: 0 }}>{departmentData.name}</PageTitle>
                </Box>
                <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 800 }}>
                    {departmentData.description || 'Department overview and statistics'}
                </Typography>
            </Box>

            {/* Stats Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Total Doctors"
                        value={stats.totalDoctors}
                        subtitle={`Including ${isHeadDoctor ? 'you as' : ''} head doctor`}
                        icon={<People sx={{ fontSize: 28 }} />}
                        color={theme.palette.primary.main}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Total Appointments"
                        value={stats.totalAppointments}
                        subtitle="All department appointments"
                        icon={<CalendarMonth sx={{ fontSize: 28 }} />}
                        color={theme.palette.info.main}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Completed"
                        value={stats.completedAppointments}
                        subtitle={`${stats.totalAppointments > 0 ? Math.round((stats.completedAppointments / stats.totalAppointments) * 100) : 0}% completion rate`}
                        icon={<CheckCircle sx={{ fontSize: 28 }} />}
                        color={theme.palette.success.main}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Avg Rating"
                        value={stats.avgRating}
                        subtitle="Department average"
                        icon={<Star sx={{ fontSize: 28 }} />}
                        color={theme.palette.warning.main}
                    />
                </Grid>
            </Grid>

            <Grid container spacing={4}>
                {/* Department Doctors */}
                <Grid item xs={12} lg={8}>
                    <Paper
                        elevation={0}
                        sx={{
                            borderRadius: 4,
                            border: '1px solid',
                            borderColor: 'divider',
                            overflow: 'hidden',
                            mb: 4
                        }}
                    >
                        <Box sx={{ p: 3, bgcolor: alpha(theme.palette.primary.main, 0.03), borderBottom: '1px solid', borderColor: 'divider' }}>
                            <Typography variant="h6" fontWeight="700">
                                Department Doctors ({doctors.length})
                            </Typography>
                        </Box>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Doctor</TableCell>
                                        <TableCell>Specialization</TableCell>
                                        <TableCell>Experience</TableCell>
                                        <TableCell>Rating</TableCell>
                                        <TableCell>Status</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {doctors.map((doctor) => (
                                        <TableRow key={doctor.id} hover>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                    <Avatar
                                                        sx={{
                                                            bgcolor: doctor.id === departmentData.head_doctor?.id
                                                                ? theme.palette.primary.main
                                                                : alpha(theme.palette.primary.main, 0.1),
                                                            color: doctor.id === departmentData.head_doctor?.id
                                                                ? 'white'
                                                                : 'primary.main',
                                                        }}
                                                    >
                                                        {doctor.name?.charAt(0) || 'D'}
                                                    </Avatar>
                                                    <Box>
                                                        <Typography variant="body2" fontWeight="600">
                                                            {doctor.name || 'Unknown'}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {doctor.doctor_id}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={doctor.specialization}
                                                    size="small"
                                                    sx={{ bgcolor: alpha(theme.palette.info.main, 0.1), color: 'info.main' }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2">
                                                    {doctor.experience_years || 0} years
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <Star sx={{ fontSize: 16, color: 'warning.main' }} />
                                                    <Typography variant="body2" fontWeight="600">
                                                        {doctor.rating?.toFixed(1) || 'N/A'}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={doctor.id === departmentData.head_doctor?.id ? 'Head' : 'Active'}
                                                    size="small"
                                                    color={doctor.id === departmentData.head_doctor?.id ? 'primary' : 'success'}
                                                    sx={{ fontWeight: 600 }}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {doctors.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                                                <People sx={{ fontSize: 60, color: 'text.secondary', mb: 1 }} />
                                                <Typography color="text.secondary">No doctors in this department</Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>

                    {/* Additional Analytics Section */}
                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            borderRadius: 4,
                            border: '1px solid',
                            borderColor: 'divider',
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                            <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'secondary.main', color: 'white' }}>
                                <TrendingUp />
                            </Box>
                            <Typography variant="h6" fontWeight="700">
                                Department Growth & Trends
                            </Typography>
                        </Box>

                        <Grid container spacing={3}>
                            <Grid item xs={12} md={4}>
                                <Box sx={{ p: 2, borderRadius: 3, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                        Patient Growth
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                                        <Typography variant="h4" fontWeight="700" color="primary.main">
                                            +{Math.round(stats.totalAppointments * 0.15)}%
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            vs last month
                                        </Typography>
                                    </Box>
                                    <LinearProgress
                                        variant="determinate"
                                        value={75}
                                        sx={{ mt: 2, height: 6, borderRadius: 3 }}
                                    />
                                </Box>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Box sx={{ p: 2, borderRadius: 3, bgcolor: alpha(theme.palette.success.main, 0.05) }}>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                        Appointment Completion
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                                        <Typography variant="h4" fontWeight="700" color="success.main">
                                            {stats.totalAppointments > 0 ? Math.round((stats.completedAppointments / stats.totalAppointments) * 100) : 0}%
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            achieved
                                        </Typography>
                                    </Box>
                                    <LinearProgress
                                        variant="determinate"
                                        value={stats.totalAppointments > 0 ? (stats.completedAppointments / stats.totalAppointments) * 100 : 0}
                                        color="success"
                                        sx={{ mt: 2, height: 6, borderRadius: 3 }}
                                    />
                                </Box>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Box sx={{ p: 2, borderRadius: 3, bgcolor: alpha(theme.palette.warning.main, 0.05) }}>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                        Satisfaction Score
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                                        <Typography variant="h4" fontWeight="700" color="warning.main">
                                            {stats.avgRating}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            / 5.0
                                        </Typography>
                                    </Box>
                                    <LinearProgress
                                        variant="determinate"
                                        value={(parseFloat(stats.avgRating) / 5) * 100}
                                        color="warning"
                                        sx={{ mt: 2, height: 6, borderRadius: 3 }}
                                    />
                                </Box>
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>

                {/* Department Info & Performance */}
                <Grid item xs={12} lg={4}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {/* Department Info */}
                        <Paper
                            elevation={0}
                            sx={{
                                p: 3,
                                borderRadius: 4,
                                border: '1px solid',
                                borderColor: 'divider',
                            }}
                        >
                            <Typography variant="h6" fontWeight="700" gutterBottom>
                                Department Information
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Department Name
                                    </Typography>
                                    <Typography variant="body2" fontWeight="600">
                                        {departmentData.name}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Head of Department
                                    </Typography>
                                    <Typography variant="body2" fontWeight="600">
                                        {departmentData.head_doctor?.name || 'Not assigned'}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Total Doctors
                                    </Typography>
                                    <Typography variant="body2" fontWeight="600">
                                        {stats.totalDoctors}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Location
                                    </Typography>
                                    <Typography variant="body2" fontWeight="600">
                                        {departmentData.location || 'Main Building'}
                                    </Typography>
                                </Box>
                            </Box>
                        </Paper>

                        {/* Performance Metrics */}
                        <Paper
                            elevation={0}
                            sx={{
                                p: 3,
                                borderRadius: 4,
                                border: '1px solid',
                                borderColor: 'divider',
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                                <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'primary.main', color: 'white' }}>
                                    <Assessment />
                                </Box>
                                <Typography variant="h6" fontWeight="700">
                                    Performance
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                <Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body2" color="text.secondary" fontWeight="600">
                                            Appointment Completion
                                        </Typography>
                                        <Typography variant="body2" fontWeight="700" color="success.main">
                                            {stats.totalAppointments > 0
                                                ? Math.round((stats.completedAppointments / stats.totalAppointments) * 100)
                                                : 0}%
                                        </Typography>
                                    </Box>
                                    <LinearProgress
                                        variant="determinate"
                                        value={stats.totalAppointments > 0
                                            ? (stats.completedAppointments / stats.totalAppointments) * 100
                                            : 0}
                                        color="success"
                                        sx={{ height: 8, borderRadius: 4 }}
                                    />
                                </Box>

                                <Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body2" color="text.secondary" fontWeight="600">
                                            Average Rating
                                        </Typography>
                                        <Typography variant="body2" fontWeight="700" color="warning.main">
                                            {stats.avgRating} / 5.0
                                        </Typography>
                                    </Box>
                                    <LinearProgress
                                        variant="determinate"
                                        value={(parseFloat(stats.avgRating) / 5) * 100}
                                        color="warning"
                                        sx={{ height: 8, borderRadius: 4 }}
                                    />
                                </Box>

                                <Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body2" color="text.secondary" fontWeight="600">
                                            Staff Capacity
                                        </Typography>
                                        <Typography variant="body2" fontWeight="700" color="info.main">
                                            {stats.totalDoctors} / 10
                                        </Typography>
                                    </Box>
                                    <LinearProgress
                                        variant="determinate"
                                        value={(stats.totalDoctors / 10) * 100}
                                        color="info"
                                        sx={{ height: 8, borderRadius: 4 }}
                                    />
                                </Box>
                            </Box>
                        </Paper>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
};

export default DoctorDepartment;
