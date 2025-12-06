import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Avatar,
  Skeleton,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  IconButton,
  Button,
  Chip,
} from '@mui/material';
import {
  People,
  CalendarMonth,
  CheckCircle,
  Schedule,
  Assignment,
  TrendingUp,
  TrendingDown,
  VideoCall,
  Message,
  ArrowForward,
} from '@mui/icons-material';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency } from '@/utils/constants';
import PageTitle from '@/components/common/PageTitle';
import { doctorService } from '@/services/doctorService';
import { appointmentService } from '@/services/appointmentService';
import { formatDateTime } from '@/utils/helpers';

// Reusing MetricCard for consistency
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

const DoctorDashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalPatients: 0,
    todayAppointments: 0,
    completedToday: 0,
    pendingTasks: 0,
  });
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [appointmentTrends, setAppointmentTrends] = useState([]);
  const [statusDistribution, setStatusDistribution] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      console.log('DoctorDashboard: Checking user...', user);
      if (!user?.doctor_internal_id) {
        console.warn('DoctorDashboard: No doctor_internal_id found in user object', user);
        return;
      }

      try {
        console.log('DoctorDashboard: Starting data fetch for doctor_internal_id:', user.doctor_internal_id);
        setLoading(true);
        // Fetch doctor performance stats (Now accessible by doctors)
        const performance = await doctorService.getDoctorPerformance({ doctor_id: user.doctor_id });
        console.log('DoctorDashboard: Performance data received:', performance);
        const myStats = performance.find(d => d.doctor_id === user.doctor_id) || {};
        console.log('DoctorDashboard: My stats:', myStats);

        // Fetch today's appointments
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
        const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

        // Fetch ALL appointments for charts (last 30 days ideally, but getting all for now)
        const allAppointments = await appointmentService.getAllAppointments({
          doctor_id: user.doctor_internal_id, // Use internal ID for FK
        });
        console.log('DoctorDashboard: All appointments received:', allAppointments);

        const todayApts = allAppointments.filter(apt => {
          const aptDate = new Date(apt.appointment_date);
          const todayDate = new Date();
          return aptDate.getDate() === todayDate.getDate() &&
            aptDate.getMonth() === todayDate.getMonth() &&
            aptDate.getFullYear() === todayDate.getFullYear();
        });

        const completedCount = todayApts.filter(apt => apt.status === 'completed').length;
        const pendingCount = allAppointments.filter(apt => ['scheduled', 'confirmed'].includes(apt.status)).length;

        setStats({
          totalPatients: myStats.total_patients || 0,
          todayAppointments: todayApts.length,
          completedToday: completedCount,
          pendingTasks: pendingCount,
        });
        console.log('DoctorDashboard: Stats set:', {
          totalPatients: myStats.total_patients || 0,
          todayAppointments: todayApts.length,
          completedToday: completedCount,
          pendingTasks: pendingCount,
        });

        setTodaySchedule(todayApts);

        // Prepare Chart Data
        // 1. Daily Appointments (Last 7 days)
        const last7Days = [...Array(7)].map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - i);
          return d.toISOString().split('T')[0];
        }).reverse();

        const trendsData = last7Days.map(date => ({
          date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          appointments: allAppointments.filter(apt => apt.appointment_date.startsWith(date)).length
        }));
        setAppointmentTrends(trendsData);

        // 2. Status Distribution
        const statusCounts = allAppointments.reduce((acc, curr) => {
          acc[curr.status] = (acc[curr.status] || 0) + 1;
          return acc;
        }, {});

        const statusData = Object.entries(statusCounts).map(([name, value]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' '),
          value,
          color: name === 'completed' ? '#4caf50' :
            name === 'cancelled' ? '#f44336' :
              name === 'scheduled' ? '#2196f3' : '#ff9800'
        }));
        setStatusDistribution(statusData);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        console.error('Error details:', error.response?.data || error.message);
      } finally {
        setLoading(false);
        console.log('DoctorDashboard: Data fetch complete');
      }
    };

    fetchDashboardData();
  }, [user]);

  const getStatusColor = (status) => {
    const colors = {
      scheduled: 'info',
      confirmed: 'primary',
      completed: 'success',
      in_progress: 'warning',
      cancelled: 'error',
    };
    return colors[status] || 'default';
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <PageTitle>
          Welcome back, {user?.full_name}! 👋
        </PageTitle>
        <Typography variant="body1" color="text.secondary">
          You have {stats.todayAppointments} appointments today.
        </Typography>
      </Box>

      {/* Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <MetricCard
            title="Total Patients"
            value={stats.totalPatients}
            icon={<People sx={{ fontSize: 32 }} />}
            color="#667eea"
            loading={loading}
            subtitle="Under your care"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <MetricCard
            title="Today's Appointments"
            value={stats.todayAppointments}
            icon={<CalendarMonth sx={{ fontSize: 32 }} />}
            color="#f5576c"
            loading={loading}
            subtitle="Scheduled for today"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <MetricCard
            title="Completed Today"
            value={stats.completedToday}
            icon={<CheckCircle sx={{ fontSize: 32 }} />}
            color="#00f2fe"
            loading={loading}
            subtitle="Successfully treated"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <MetricCard
            title="Pending Tasks"
            value={stats.pendingTasks}
            icon={<Assignment sx={{ fontSize: 32 }} />}
            color="#fee140"
            loading={loading}
            subtitle="Action required"
          />
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
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
              Appointment Activity (Last 7 Days)
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={appointmentTrends}>
                <defs>
                  <linearGradient id="colorApt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#667eea" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#667eea" stopOpacity={0} />
                  </linearGradient>
                </defs>
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
                <Area type="monotone" dataKey="appointments" stroke="#667eea" fillOpacity={1} fill="url(#colorApt)" />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
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
              Appointment Status
            </Typography>
            <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusDistribution.map((entry, index) => (
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
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Today's Schedule */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" fontWeight="600">
            Today's Schedule
          </Typography>
          <Button variant="outlined" size="small">View All</Button>
        </Box>
        <List>
          {todaySchedule.length === 0 ? (
            <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              No appointments scheduled for today.
            </Typography>
          ) : (
            todaySchedule.map((appointment) => (
              <ListItem
                key={appointment.id}
                sx={{
                  bgcolor: '#f8f9fa',
                  mb: 2,
                  borderRadius: 2,
                  border: 'none',
                  p: 2,
                  '&:hover': {
                    bgcolor: '#f0f0f0',
                  }
                }}
                secondaryAction={
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton
                      size="small"
                      sx={{
                        bgcolor: '#e3f2fd',
                        '&:hover': { bgcolor: '#bbdefb' }
                      }}
                      onClick={() => navigate(`/doctor/messages?user=${appointment.patient?.user_id}`)}
                    >
                      <Message fontSize="small" sx={{ color: '#1976d2' }} />
                    </IconButton>
                    <IconButton
                      size="small"
                      sx={{
                        bgcolor: '#f3e5f5',
                        '&:hover': { bgcolor: '#e1bee7' }
                      }}
                      onClick={() => window.open(`https://meet.jit.si/hospital_app_consultation_${appointment.id}`, '_blank')}
                    >
                      <VideoCall fontSize="small" sx={{ color: '#9c27b0' }} />
                    </IconButton>
                  </Box>
                }
              >
                <ListItemAvatar>
                  <Avatar
                    sx={{
                      width: 48,
                      height: 48,
                      bgcolor: `hsl(${appointment.id * 60}, 70%, 60%)`,
                      fontWeight: 600
                    }}
                  >
                    {appointment.patient?.name?.[0] || 'P'}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography variant="body1" fontWeight="600">
                      {appointment.patient?.name || 'Unknown Patient'}
                    </Typography>
                  }
                  secondary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Schedule fontSize="small" sx={{ fontSize: 16 }} />
                        <Typography variant="caption">
                          {new Date(appointment.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                      </Box>
                      <Typography variant="caption">•</Typography>
                      <Typography variant="caption">
                        {appointment.appointment_type || 'Consultation'}
                      </Typography>
                      <Chip
                        label={appointment.status.replace('_', ' ')}
                        color={getStatusColor(appointment.status)}
                        size="small"
                        sx={{ height: 22, fontSize: '0.7rem', ml: 1 }}
                      />
                    </Box>
                  }
                />
              </ListItem>
            ))
          )}
        </List>
      </Paper>
    </Box>
  );
};

export default DoctorDashboard;