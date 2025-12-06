import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  LinearProgress,
  Avatar,
  Skeleton,
  Chip,
} from '@mui/material';
import {
  People,
  LocalHospital,
  CalendarMonth,
  AttachMoney,
  TrendingUp,
  TrendingDown,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { analyticsService } from '@/services/analyticsService';
import { formatCurrency } from '@/utils/constants';
import PageTitle from '@/components/common/PageTitle';

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

const Analytics = () => {
  const [timeRange, setTimeRange] = useState('30');
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [demographics, setDemographics] = useState(null);
  const [trends, setTrends] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [doctorPerformance, setDoctorPerformance] = useState([]);

  useEffect(() => {
    fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [overviewData, demographicsData, trendsData, revenueData, doctorData] = await Promise.all([
        analyticsService.getOverview(),
        analyticsService.getPatientDemographics(),
        analyticsService.getAppointmentTrends(parseInt(timeRange)),
        analyticsService.getRevenueAnalytics(),
        analyticsService.getDoctorPerformance(),
      ]);

      setOverview(overviewData);
      setDemographics(demographicsData);
      setTrends(trendsData);
      setRevenue(revenueData);
      setDoctorPerformance(doctorData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data
  const appointmentChartData = trends?.daily_appointments
    ? Object.entries(trends.daily_appointments).map(([date, count]) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      appointments: count
    }))
    : [];

  const genderData = demographics?.gender_distribution
    ? Object.entries(demographics.gender_distribution).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: name === 'male' ? '#2196f3' : name === 'female' ? '#f50057' : '#4caf50'
    }))
    : [];

  const ageData = demographics?.age_distribution
    ? Object.entries(demographics.age_distribution).map(([name, value]) => ({
      name,
      value,
      color: '#8884d8'
    }))
    : [];

  const paymentMethodData = revenue?.payment_method_distribution
    ? Object.entries(revenue.payment_method_distribution).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: '#ff9800' // You might want to assign different colors
    }))
    : [];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <PageTitle>
            Analytics Dashboard
          </PageTitle>
          <Typography variant="body1" color="text.secondary">
            Real-time insights and performance metrics
          </Typography>
        </Box>
        <FormControl
          sx={{
            minWidth: 200,
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
              bgcolor: 'background.paper',
            }
          }}
        >
          <InputLabel>Time Range</InputLabel>
          <Select
            value={timeRange}
            label="Time Range"
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <MenuItem value="7">Last 7 days</MenuItem>
            <MenuItem value="30">Last 30 days</MenuItem>
            <MenuItem value="90">Last 3 months</MenuItem>
            <MenuItem value="365">Last year</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <MetricCard
            title="Total Patients"
            value={overview?.total_patients?.toLocaleString() || '0'}
            icon={<People sx={{ fontSize: 32 }} />}
            color="#667eea"
            loading={loading}
            subtitle="Registered patients"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <MetricCard
            title="Total Doctors"
            value={overview?.total_doctors?.toLocaleString() || '0'}
            icon={<LocalHospital sx={{ fontSize: 32 }} />}
            color="#f5576c"
            loading={loading}
            subtitle="Active medical staff"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <MetricCard
            title="Appointments"
            value={overview?.total_appointments?.toLocaleString() || '0'}
            icon={<CalendarMonth sx={{ fontSize: 32 }} />}
            color="#00f2fe"
            loading={loading}
            subtitle={`Total appointments`}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <MetricCard
            title="Total Revenue"
            value={formatCurrency(overview?.total_revenue || 0)}
            icon={<AttachMoney sx={{ fontSize: 32 }} />}
            color="#fee140"
            loading={loading}
            subtitle={`Pending: ${formatCurrency(overview?.pending_revenue || 0)}`}
          />
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        {/* Appointment Trends */}
        <Grid item xs={12} lg={8}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 4,
              border: '1px solid',
              borderColor: 'divider',
              height: '100%'
            }}
          >
            <Typography variant="h6" fontWeight="700" gutterBottom>
              Appointment Trends
            </Typography>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={appointmentChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: 'none',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="appointments"
                  name="Appointments"
                  stroke="#667eea"
                  strokeWidth={4}
                  dot={{ r: 4, strokeWidth: 2 }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Gender Distribution */}
        <Grid item xs={12} lg={4}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 4,
              border: '1px solid',
              borderColor: 'divider',
              height: '100%'
            }}
          >
            <Typography variant="h6" fontWeight="700" gutterBottom>
              Gender Distribution
            </Typography>
            <Box sx={{ height: 350, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Patient Age Distribution */}
        <Grid item xs={12} lg={6}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 4,
              border: '1px solid',
              borderColor: 'divider',
              height: '100%'
            }}
          >
            <Typography variant="h6" fontWeight="700" gutterBottom>
              Patient Age Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ageData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: 'none',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                  }}
                  cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                />
                <Bar dataKey="value" name="Patients" fill="#8884d8" radius={[8, 8, 0, 0]}>
                  {ageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Payment Method Distribution */}
        <Grid item xs={12} lg={6}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 4,
              border: '1px solid',
              borderColor: 'divider',
              height: '100%'
            }}
          >
            <Typography variant="h6" fontWeight="700" gutterBottom>
              Revenue by Payment Method
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={paymentMethodData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={100} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: 'none',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                  }}
                  formatter={(value) => formatCurrency(value)}
                  cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                />
                <Bar dataKey="value" name="Revenue" fill="#ff9800" radius={[0, 8, 8, 0]}>
                  {paymentMethodData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Doctor Performance */}
        <Grid item xs={12}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 4,
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Typography variant="h6" fontWeight="700" gutterBottom>
              Doctor Performance
            </Typography>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              {doctorPerformance.map((doctor, index) => (
                <Grid item xs={12} md={6} lg={4} key={index}>
                  <Box
                    sx={{
                      p: 2.5,
                      borderRadius: 3,
                      bgcolor: 'background.default',
                      border: '1px solid',
                      borderColor: 'divider',
                      transition: 'all 0.2s',
                      '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: 'action.hover',
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Box>
                        <Typography variant="subtitle1" fontWeight="700">
                          {doctor.doctor_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          {doctor.specialization}
                        </Typography>
                      </Box>
                      <Chip
                        label={`${doctor.rating} ★`}
                        size="small"
                        color="warning"
                        variant="soft"
                        sx={{ fontWeight: 'bold' }}
                      />
                    </Box>

                    <Box sx={{ mb: 1.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" fontWeight="600">Completion Rate</Typography>
                        <Typography variant="caption" fontWeight="600">{doctor.completion_rate}%</Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={doctor.completion_rate}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: 'action.selected',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 4,
                            bgcolor: doctor.completion_rate > 80 ? 'success.main' : 'warning.main'
                          }
                        }}
                      />
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" fontWeight="700">{doctor.total_patients}</Typography>
                        <Typography variant="caption" color="text.secondary">Patients</Typography>
                      </Box>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" fontWeight="700">{doctor.total_appointments}</Typography>
                        <Typography variant="caption" color="text.secondary">Appointments</Typography>
                      </Box>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" fontWeight="700">{doctor.completed_appointments}</Typography>
                        <Typography variant="caption" color="text.secondary">Completed</Typography>
                      </Box>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Analytics;