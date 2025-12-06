import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    CircularProgress,
    Card,
    CardContent,
    Avatar,
    Skeleton,
} from '@mui/material';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from 'recharts';
import { patientService } from '@/services/patientService';
import { Person, TrendingUp, TrendingDown, LocalHospital, Bloodtype, MonitorHeart } from '@mui/icons-material';
import PageTitle from '@/components/common/PageTitle';

// Consistent MetricCard matching AdminDashboard & Analytics
const MetricCard = ({ title, value, icon, color, trend, trendValue, subtitle, loading }) => (
    <Card
        elevation={0}
        sx={{
            borderRadius: 4,
            border: '1px solid',
            borderColor: 'divider',
            height: '100%',
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 24px -10px rgba(0, 0, 0, 0.1)',
            },
        }}
    >
        <CardContent sx={{ p: 3 }}>
            {loading ? (
                <>
                    <Skeleton variant="circular" width={48} height={48} sx={{ mb: 2 }} />
                    <Skeleton variant="text" width="60%" height={32} />
                    <Skeleton variant="text" width="40%" />
                </>
            ) : (
                <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Avatar
                            variant="rounded"
                            sx={{
                                bgcolor: `${color}15`, // 15% opacity
                                color: color,
                                width: 56,
                                height: 56,
                                borderRadius: 3,
                            }}
                        >
                            {icon}
                        </Avatar>
                        {trend && (
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    color: trend === 'up' ? 'success.dark' : 'error.dark',
                                    px: 1,
                                    py: 0.5,
                                    borderRadius: 2,
                                    bgcolor: trend === 'up' ? '#e8f5e9' : '#ffebee',
                                }}
                            >
                                {trend === 'up' ? <TrendingUp fontSize="small" sx={{ mr: 0.5 }} /> : <TrendingDown fontSize="small" sx={{ mr: 0.5 }} />}
                                <Typography variant="caption" fontWeight="bold">
                                    {trendValue}
                                </Typography>
                            </Box>
                        )}
                    </Box>

                    <Typography variant="h4" fontWeight="800" sx={{ mb: 0.5, color: 'text.primary' }}>
                        {value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" fontWeight="500">
                        {title}
                    </Typography>
                    {subtitle && (
                        <Typography variant="caption" color="text.disabled" sx={{ mt: 1, display: 'block' }}>
                            {subtitle}
                        </Typography>
                    )}
                </Box>
            )}
        </CardContent>
    </Card>
);

const PatientAnalytics = () => {
    const [loading, setLoading] = useState(true);
    const [bmiData, setBmiData] = useState([]);
    const [ageData, setAgeData] = useState([]);
    const [genderData, setGenderData] = useState([]);
    const [stats, setStats] = useState({
        total: 0,
        avgAge: 0,
        bloodDonors: 0,
        newAdmissions: 0,
        totalTrend: 'neutral',
        totalTrendValue: '0%',
        admissionsTrend: 'neutral',
        admissionsTrendValue: '0%',
    });

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const [bmi, age, patientsData] = await Promise.all([
                patientService.getBMIDistribution(),
                patientService.getAgeDistribution(),
                patientService.getAllPatients(),
            ]);

            const patientsList = Array.isArray(patientsData) ? patientsData : (patientsData.patients || []);

            // Process BMI Data - Filter out zero values
            const formattedBmi = Object.keys(bmi)
                .map(key => ({
                    name: key,
                    value: bmi[key]
                }))
                .filter(item => item.value > 0);

            const formattedAge = Object.keys(age).map(key => ({
                name: key,
                value: age[key]
            }));

            // Calculate real gender distribution
            const genderCounts = patientsList.reduce((acc, patient) => {
                const gender = patient.gender || 'other';
                acc[gender] = (acc[gender] || 0) + 1;
                return acc;
            }, {});

            const formattedGender = Object.keys(genderCounts).map(key => ({
                name: key.charAt(0).toUpperCase() + key.slice(1),
                value: genderCounts[key],
                color: key === 'male' ? '#2196f3' : key === 'female' ? '#f50057' : '#4caf50'
            }));

            // Calculate stats
            const avgAge = patientsList.length > 0
                ? Math.round(patientsList.reduce((sum, p) => sum + (p.age || 0), 0) / patientsList.length)
                : 0;

            // Trend Calculations
            const now = new Date();
            const thirtyDaysAgo = new Date(now);
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const sixtyDaysAgo = new Date(now);
            sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

            const currentAdmissions = patientsList.filter(p => {
                const regDate = new Date(p.created_at || p.registration_date);
                return regDate >= thirtyDaysAgo;
            }).length;

            const previousAdmissions = patientsList.filter(p => {
                const regDate = new Date(p.created_at || p.registration_date);
                return regDate >= sixtyDaysAgo && regDate < thirtyDaysAgo;
            }).length;

            // Admissions Trend
            let admissionsTrend = 'neutral';
            let admissionsTrendValue = '0%';
            if (previousAdmissions > 0) {
                const diff = currentAdmissions - previousAdmissions;
                const percent = (diff / previousAdmissions) * 100;
                admissionsTrend = diff >= 0 ? 'up' : 'down';
                admissionsTrendValue = `${Math.abs(percent).toFixed(1)}%`;
            } else if (currentAdmissions > 0) {
                admissionsTrend = 'up';
                admissionsTrendValue = '100%';
            }

            // Total Patients Trend (vs 30 days ago)
            const total30DaysAgo = patientsList.filter(p => {
                const regDate = new Date(p.created_at || p.registration_date);
                return regDate < thirtyDaysAgo;
            }).length;

            let totalTrend = 'neutral';
            let totalTrendValue = '0%';
            if (total30DaysAgo > 0) {
                const diff = patientsList.length - total30DaysAgo;
                const percent = (diff / total30DaysAgo) * 100;
                totalTrend = diff >= 0 ? 'up' : 'down';
                totalTrendValue = `${Math.abs(percent).toFixed(1)}%`;
            }

            // Count blood donors (patients with blood group specified)
            const bloodDonors = patientsList.filter(p => p.blood_group).length;

            setBmiData(formattedBmi);
            setAgeData(formattedAge);
            setGenderData(formattedGender);
            setStats({
                total: patientsList.length,
                avgAge,
                bloodDonors,
                newAdmissions: currentAdmissions,
                totalTrend,
                totalTrendValue,
                admissionsTrend,
                admissionsTrendValue,
            });
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    return (
        <Box>
            <PageTitle>
                Patient Analytics
            </PageTitle>

            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        title="Total Patients"
                        value={stats.total.toLocaleString()}
                        icon={<Person sx={{ fontSize: 32 }} />}
                        color="#667eea"
                        trend={stats.totalTrend}
                        trendValue={stats.totalTrendValue}
                        subtitle="Active patients"
                        loading={loading}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        title="New Admissions"
                        value={stats.newAdmissions.toLocaleString()}
                        icon={<LocalHospital sx={{ fontSize: 32 }} />}
                        color="#f5576c"
                        trend={stats.admissionsTrend}
                        trendValue={stats.admissionsTrendValue}
                        subtitle="Last 30 days"
                        loading={loading}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        title="Avg. Age"
                        value={stats.avgAge}
                        icon={<MonitorHeart sx={{ fontSize: 32 }} />}
                        color="#00f2fe"
                        subtitle="Years old"
                        loading={loading}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        title="Blood Donors"
                        value={stats.bloodDonors.toLocaleString()}
                        icon={<Bloodtype sx={{ fontSize: 32 }} />}
                        color="#fee140"
                        subtitle="With blood group"
                        loading={loading}
                    />
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                {/* Gender Distribution */}
                <Grid item xs={12} md={4}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            borderRadius: 4,
                            border: '1px solid',
                            borderColor: 'divider',
                            height: 400
                        }}
                    >
                        <Typography variant="h6" fontWeight="700" gutterBottom>
                            Gender Distribution
                        </Typography>
                        {genderData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={genderData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {genderData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: 12,
                                            border: 'none',
                                            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                <Typography color="text.secondary">No data available</Typography>
                            </Box>
                        )}
                    </Paper>
                </Grid>

                {/* BMI Distribution */}
                <Grid item xs={12} md={4}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            borderRadius: 4,
                            border: '1px solid',
                            borderColor: 'divider',
                            height: 400
                        }}
                    >
                        <Typography variant="h6" fontWeight="700" gutterBottom>
                            BMI Distribution
                        </Typography>
                        {bmiData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={bmiData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={true}
                                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {bmiData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: 12,
                                            border: 'none',
                                            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                <Typography color="text.secondary">No BMI data available</Typography>
                            </Box>
                        )}
                    </Paper>
                </Grid>

                {/* Age Distribution */}
                <Grid item xs={12} md={4}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            borderRadius: 4,
                            border: '1px solid',
                            borderColor: 'divider',
                            height: 400
                        }}
                    >
                        <Typography variant="h6" fontWeight="700" gutterBottom>
                            Age Distribution
                        </Typography>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={ageData}
                                margin={{ top: 20, right: 10, left: 10, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                                />
                                <Bar dataKey="value" fill="#00C49F" radius={[8, 8, 0, 0]} barSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default PatientAnalytics;
