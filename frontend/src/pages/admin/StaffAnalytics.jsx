import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    CircularProgress,
    useTheme,
} from '@mui/material';
import {
    PieChart,
    Pie,
    Cell,
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
    People,
    PersonOff,
    TrendingUp,
    Work,
} from '@mui/icons-material';
import staffService from '@/services/staffService';
import PageTitle from '@/components/common/PageTitle';
import MetricCard from '@/components/common/MetricCard';

const StaffAnalytics = () => {
    const theme = useTheme();
    const [loading, setLoading] = useState(true);
    const [analyticsData, setAnalyticsData] = useState(null);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const data = await staffService.getStaffAnalytics();
            setAnalyticsData(data);
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!analyticsData) {
        return (
            <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6">No analytics data available</Typography>
            </Box>
        );
    }

    const formatCategoryLabel = (category) => {
        return category.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    };

    const categoryChartData = analyticsData.category_distribution.map((item) => ({
        name: formatCategoryLabel(item.category),
        value: item.count,
    }));

    const departmentChartData = analyticsData.department_distribution.map((item) => ({
        name: item.department,
        count: item.count,
    }));

    const employmentChartData = analyticsData.employment_distribution.map((item) => ({
        name: formatCategoryLabel(item.type),
        value: item.count,
    }));

    const experienceChartData = analyticsData.experience_distribution;

    return (
        <Box>
            <PageTitle>
                Staff Analytics
            </PageTitle>

            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={6} lg={3}>
                    <MetricCard
                        title="Total Staff"
                        value={analyticsData.summary.total_staff}
                        icon={<People sx={{ fontSize: 28 }} />}
                        color={theme.palette.primary.main}
                        loading={loading}
                    />
                </Grid>

                <Grid item xs={12} sm={6} md={6} lg={3}>
                    <MetricCard
                        title="Active Staff"
                        value={analyticsData.summary.active_staff}
                        icon={<Work sx={{ fontSize: 28 }} />}
                        color={theme.palette.success.main}
                        loading={loading}
                    />
                </Grid>

                <Grid item xs={12} sm={6} md={6} lg={3}>
                    <MetricCard
                        title="Inactive Staff"
                        value={analyticsData.summary.inactive_staff}
                        icon={<PersonOff sx={{ fontSize: 28 }} />}
                        color={theme.palette.error.main}
                        loading={loading}
                    />
                </Grid>

                <Grid item xs={12} sm={6} md={6} lg={3}>
                    <MetricCard
                        title="Avg Experience"
                        value={`${analyticsData.summary.average_experience} years`}
                        icon={<TrendingUp sx={{ fontSize: 28 }} />}
                        color={theme.palette.warning.main}
                        loading={loading}
                    />
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                {/* Category Distribution */}
                <Grid item xs={12} md={6}>
                    <Paper elevation={2} sx={{ p: 3, height: 400 }}>
                        <Typography variant="h6" gutterBottom>
                            Staff by Category
                        </Typography>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryChartData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {categoryChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                {/* Employment Type Distribution */}
                <Grid item xs={12} md={6}>
                    <Paper elevation={2} sx={{ p: 3, height: 400 }}>
                        <Typography variant="h6" gutterBottom>
                            Employment Type Distribution
                        </Typography>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={employmentChartData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {employmentChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                {/* Department Distribution */}
                <Grid item xs={12}>
                    <Paper elevation={2} sx={{ p: 3, height: 400 }}>
                        <Typography variant="h6" gutterBottom>
                            Staff by Department
                        </Typography>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={departmentChartData}
                                margin={{
                                    top: 20,
                                    right: 30,
                                    left: 20,
                                    bottom: 5,
                                }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="count" fill="#8884d8" name="Staff Count" />
                            </BarChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                {/* Experience Distribution */}
                <Grid item xs={12}>
                    <Paper elevation={2} sx={{ p: 3, height: 400 }}>
                        <Typography variant="h6" gutterBottom>
                            Experience Distribution
                        </Typography>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={experienceChartData}
                                margin={{
                                    top: 20,
                                    right: 30,
                                    left: 20,
                                    bottom: 5,
                                }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="range" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="count" fill="#82ca9d" name="Staff Count" />
                            </BarChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default StaffAnalytics;
