import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Rating,
    useTheme,
} from '@mui/material';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import {
    MedicalServices,
    EventAvailable,
    CheckCircle,
    Star,
} from '@mui/icons-material';
import { doctorService } from '@/services/doctorService';
import PageTitle from '@/components/common/PageTitle';
import MetricCard from '@/components/common/MetricCard';

const DoctorAnalytics = () => {
    const theme = useTheme();
    const [loading, setLoading] = useState(true);
    const [performanceData, setPerformanceData] = useState([]);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const data = await doctorService.getDoctorPerformance();
            setPerformanceData(data);
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    // Calculate metrics
    const totalDoctors = performanceData.length;
    const totalAppointments = performanceData.reduce((sum, doc) => sum + (doc.total_appointments || 0), 0);
    const avgCompletionRate = performanceData.length > 0
        ? (performanceData.reduce((sum, doc) => {
            const rate = doc.total_appointments > 0 ? (doc.completed_appointments / doc.total_appointments) * 100 : 0;
            return sum + rate;
        }, 0) / performanceData.length).toFixed(1)
        : 0;
    const topRatedDoctor = performanceData.reduce((top, doc) =>
        (!top || (doc.rating || 0) > (top.rating || 0)) ? doc : top
        , null);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <PageTitle>
                Doctor Analytics
            </PageTitle>

            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={6} lg={3}>
                    <MetricCard
                        title="Total Doctors"
                        value={totalDoctors}
                        icon={<MedicalServices sx={{ fontSize: 28 }} />}
                        color={theme.palette.primary.main}
                        loading={loading}
                    />
                </Grid>

                <Grid item xs={12} sm={6} md={6} lg={3}>
                    <MetricCard
                        title="Total Appointments"
                        value={totalAppointments}
                        icon={<EventAvailable sx={{ fontSize: 28 }} />}
                        color={theme.palette.secondary.main}
                        loading={loading}
                    />
                </Grid>

                <Grid item xs={12} sm={6} md={6} lg={3}>
                    <MetricCard
                        title="Avg Completion Rate"
                        value={`${avgCompletionRate}%`}
                        icon={<CheckCircle sx={{ fontSize: 28 }} />}
                        color={theme.palette.success.main}
                        subtitle="Across all doctors"
                        loading={loading}
                    />
                </Grid>

                <Grid item xs={12} sm={6} md={6} lg={3}>
                    <MetricCard
                        title="Top Rated Doctor"
                        value={topRatedDoctor?.doctor_name || 'N/A'}
                        icon={<Star sx={{ fontSize: 28 }} />}
                        color={theme.palette.warning.main}
                        subtitle={topRatedDoctor ? `${topRatedDoctor.rating?.toFixed(1)} ★` : ''}
                        loading={loading}
                    />
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Paper elevation={2} sx={{ p: 3, height: 400 }}>
                        <Typography variant="h6" gutterBottom>
                            Appointments Overview
                        </Typography>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={performanceData}
                                margin={{
                                    top: 20,
                                    right: 30,
                                    left: 20,
                                    bottom: 5,
                                }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="doctor_name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="total_appointments" fill="#8884d8" name="Total Appointments" />
                                <Bar dataKey="completed_appointments" fill="#82ca9d" name="Completed" />
                            </BarChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                <Grid item xs={12}>
                    <Paper elevation={2} sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Performance Details
                        </Typography>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Doctor</TableCell>
                                        <TableCell>Specialization</TableCell>
                                        <TableCell align="center">Total Patients</TableCell>
                                        <TableCell align="center">Appointments</TableCell>
                                        <TableCell align="center">Completion Rate</TableCell>
                                        <TableCell align="center">Rating</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {performanceData.map((row) => (
                                        <TableRow key={row.doctor_id}>
                                            <TableCell>{row.doctor_name}</TableCell>
                                            <TableCell>{row.specialization}</TableCell>
                                            <TableCell align="center">{row.total_patients}</TableCell>
                                            <TableCell align="center">
                                                {row.completed_appointments} / {row.total_appointments}
                                            </TableCell>
                                            <TableCell align="center">
                                                {row.total_appointments > 0
                                                    ? `${((row.completed_appointments / row.total_appointments) * 100).toFixed(1)}%`
                                                    : '0%'}
                                            </TableCell>
                                            <TableCell align="center">
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Rating value={row.rating} readOnly size="small" />
                                                    <Typography variant="caption" sx={{ ml: 1 }}>
                                                        ({row.total_reviews})
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default DoctorAnalytics;
