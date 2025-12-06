import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Grid,
    Paper,
    useTheme,
    alpha,
    CircularProgress,
} from '@mui/material';
import {
    MedicalServices,
    People,
    TrendingUp,
    Calculate
} from '@mui/icons-material';
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid
} from 'recharts';
import { departmentService } from '@/services/departmentService';
import PageTitle from '@/components/common/PageTitle';
import MetricCard from '@/components/common/MetricCard';

const DepartmentAnalytics = () => {
    const theme = useTheme();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const data = await departmentService.getDepartmentStats();
            console.log('Department Stats API Response:', data);
            console.log('Department Distribution:', data.department_distribution);
            console.log('Doctor Distribution:', data.doctor_distribution);
            setStats(data);
        } catch (error) {
            console.error('Error fetching department stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const COLORS = [
        theme.palette.primary.main,
        theme.palette.secondary.main,
        theme.palette.success.main,
        theme.palette.warning.main,
        theme.palette.info.main,
        '#8884d8',
        '#82ca9d'
    ];

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!stats) {
        return (
            <Box sx={{ p: 3 }}>
                <Typography color="error">Failed to load analytics data.</Typography>
            </Box>
        );
    }

    return (
        <Box>
            <PageTitle>
                Department Analytics
            </PageTitle>

            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={6} lg={3}>
                    <MetricCard
                        title="Total Departments"
                        value={stats.total_departments}
                        icon={<MedicalServices sx={{ fontSize: 28 }} />}
                        color={theme.palette.primary.main}
                        loading={loading}
                    />
                </Grid>

                <Grid item xs={12} sm={6} md={6} lg={3}>
                    <MetricCard
                        title="Total Doctors"
                        value={stats.total_doctors}
                        icon={<People sx={{ fontSize: 28 }} />}
                        color={theme.palette.secondary.main}
                        loading={loading}
                    />
                </Grid>

                <Grid item xs={12} sm={6} md={6} lg={3}>
                    <MetricCard
                        title="Largest Department"
                        value={stats.most_populated_department.name}
                        icon={<TrendingUp sx={{ fontSize: 28 }} />}
                        color={theme.palette.success.main}
                        subtitle={`${stats.most_populated_department.count} Doctors`}
                        loading={loading}
                    />
                </Grid>

                <Grid item xs={12} sm={6} md={6} lg={3}>
                    <MetricCard
                        title="Avg Doctors/Dept"
                        value={(stats.total_doctors / stats.total_departments).toFixed(1)}
                        icon={<Calculate sx={{ fontSize: 28 }} />}
                        color={theme.palette.info.main}
                        subtitle="Average staffing"
                        loading={loading}
                    />
                </Grid>
            </Grid>

            <Grid container spacing={3} sx={{ mt: 1 }}>
                {/* Doctor Distribution by Department */}
                <Grid item xs={12} lg={6}>
                    <Paper elevation={0} sx={{
                        p: 3,
                        height: 450,
                        borderRadius: 4,
                        border: '1px solid',
                        borderColor: 'divider'
                    }}>
                        <Typography variant="h6" fontWeight="700" gutterBottom>
                            Doctor Distribution by Department
                        </Typography>
                        <ResponsiveContainer width="100%" height="90%">
                            <BarChart
                                data={stats.doctor_distribution || []}
                                margin={{
                                    top: 20,
                                    right: 30,
                                    left: 20,
                                    bottom: 80,
                                }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis
                                    dataKey="name"
                                    angle={-45}
                                    textAnchor="end"
                                    height={80}
                                    interval={0}
                                    tick={{ fontSize: 12, fill: '#666' }}
                                />
                                <YAxis
                                    tick={{ fontSize: 12, fill: '#666' }}
                                    label={{ value: 'Number of Doctors', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#666' } }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'white',
                                        border: '1px solid #e0e0e0',
                                        borderRadius: '8px',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                    }}
                                    cursor={{ fill: 'rgba(102, 126, 234, 0.1)' }}
                                />
                                <Bar
                                    dataKey="value"
                                    fill={theme.palette.primary.main}
                                    name="Doctors"
                                    radius={[8, 8, 0, 0]}
                                    animationDuration={800}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                {/* Department Size Distribution */}
                <Grid item xs={12} lg={6}>
                    <Paper elevation={0} sx={{
                        p: 3,
                        height: 450,
                        borderRadius: 4,
                        border: '1px solid',
                        borderColor: 'divider'
                    }}>
                        <Typography variant="h6" fontWeight="700" gutterBottom>
                            Department Size Distribution
                        </Typography>
                        <ResponsiveContainer width="100%" height="90%">
                            <PieChart>
                                <Pie
                                    data={stats.doctor_distribution || []}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={{
                                        stroke: '#666',
                                        strokeWidth: 1
                                    }}
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={120}
                                    fill="#8884d8"
                                    dataKey="value"
                                    animationDuration={800}
                                >
                                    {(stats.doctor_distribution || []).map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={COLORS[index % COLORS.length]}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'white',
                                        border: '1px solid #e0e0e0',
                                        borderRadius: '8px',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                    }}
                                />
                                <Legend
                                    verticalAlign="bottom"
                                    height={36}
                                    wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }}
                                    iconType="circle"
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default DepartmentAnalytics;
