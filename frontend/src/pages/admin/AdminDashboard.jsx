import React, { useEffect, useState } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Avatar,
  LinearProgress,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  useTheme,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Skeleton,
} from '@mui/material';
import {
  People,
  LocalHospital,
  AttachMoney,
  TrendingUp,
  TrendingDown,
  CalendarToday,
  PersonOutline,
  EventAvailable,
  PendingActions,
  CheckCircle,
  Star,
  ArrowForward,
  Science,
  ReceiptLong,
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
  BarChart,
  Bar,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import { useAuthStore } from '@/store/authStore';
import Calendar from '@/components/common/Calendar';
import { formatCurrency } from '@/utils/constants';
import { patientService } from '@/services/patientService';
import { doctorService } from '@/services/doctorService';
import { appointmentService } from '@/services/appointmentService';
import { analyticsService } from '@/services/analyticsService';
import { billingService } from '@/services/billingService';
import { labTestService } from '@/services/labTestService';
import { useForm } from 'react-hook-form';
import { getInitials } from '@/utils/helpers';
import PageTitle from '@/components/common/PageTitle';

// Reusing the MetricCard from Analytics for consistency
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

const AdminDashboard = () => {
  const { user } = useAuthStore();
  const theme = useTheme();
  const [stats, setStats] = useState({
    patients: 0,
    doctors: 0,
    appointments: 0,
    todayAppointments: 0,
    revenue: 0,
    pendingRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [openBookingDialog, setOpenBookingDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [doctorPerformance, setDoctorPerformance] = useState([]);
  const [pendingLabTests, setPendingLabTests] = useState([]);
  const [unpaidBills, setUnpaidBills] = useState([]);

  // Analytics Data
  const [demographics, setDemographics] = useState(null);
  const [trends, setTrends] = useState(null);
  const [revenueAnalytics, setRevenueAnalytics] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    console.log('AdminDashboard: Starting data fetch...');
    setLoading(true);
    try {
      console.log('AdminDashboard: Calling API endpoints...');
      const [
        overviewData,
        patientsData,
        doctorsData,
        appointmentsData,
        doctorPerfData,
        labTestsData,
        billsData,
        demographicsData,
        trendsData,
        revenueData
      ] = await Promise.all([
        analyticsService.getOverview(),
        patientService.getAllPatients(),
        doctorService.getAllDoctors(),
        appointmentService.getAllAppointments(),
        analyticsService.getDoctorPerformance(),
        labTestService.getAllLabTests(),
        billingService.getAllBills(),
        analyticsService.getPatientDemographics(),
        analyticsService.getAppointmentTrends(30),
        analyticsService.getRevenueAnalytics()
      ]);

      console.log('AdminDashboard: API Responses received', {
        overviewData,
        patientsData,
        doctorsData,
        appointmentsData,
        doctorPerfData,
        labTestsData,
        billsData,
        demographicsData,
        trendsData,
        revenueData
      });

      const patientsList = Array.isArray(patientsData) ? patientsData : (patientsData.patients || []);
      const doctorsList = Array.isArray(doctorsData) ? doctorsData : [];
      const appointmentsList = Array.isArray(appointmentsData) ? appointmentsData : [];
      const labTestsList = Array.isArray(labTestsData) ? labTestsData : [];
      const billsList = Array.isArray(billsData) ? billsData : [];

      setPatients(patientsList);
      setDoctors(doctorsList);
      setAppointments(appointmentsList);
      setDoctorPerformance(doctorPerfData.slice(0, 3)); // Top 3 doctors
      setDemographics(demographicsData);
      setTrends(trendsData);
      setRevenueAnalytics(revenueData);

      // Get recent appointments (last 5)
      const recent = appointmentsList
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);
      setRecentAppointments(recent);

      // Get pending lab tests (limit 5)
      const pendingTests = labTestsList
        .filter(test => test.status !== 'completed')
        .sort((a, b) => new Date(b.ordered_date) - new Date(a.ordered_date))
        .slice(0, 5);
      setPendingLabTests(pendingTests);

      // Get unpaid bills (limit 5)
      const unpaid = billsList
        .filter(bill => bill.payment_status !== 'paid')
        .sort((a, b) => new Date(b.bill_date) - new Date(a.bill_date))
        .slice(0, 5);
      setUnpaidBills(unpaid);

      setStats({
        patients: overviewData.total_patients,
        doctors: overviewData.total_doctors,
        appointments: overviewData.total_appointments,
        todayAppointments: overviewData.today_appointments,
        revenue: overviewData.total_revenue,
        pendingRevenue: overviewData.pending_revenue,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      console.error('Error details:', error.response?.data || error.message);
    } finally {
      setLoading(false);
      console.log('AdminDashboard: Data fetch complete, loading set to false');
    }
  };

  const handleDateClick = (date) => {
    // Check if date is in the past (ignoring time)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const clickedDate = new Date(date);
    clickedDate.setHours(0, 0, 0, 0);

    if (clickedDate < today) {
      // Don't allow booking in the past
      return;
    }

    setSelectedDate(date);
    setOpenBookingDialog(true);
  };

  const handleCloseBookingDialog = () => {
    setOpenBookingDialog(false);
    reset();
  };

  const handleBookAppointment = async (data) => {
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const timeStr = data.appointment_time; // HH:MM

      // Construct ISO datetime string: YYYY-MM-DDTHH:MM:SS
      const appointmentDateTime = `${dateStr}T${timeStr}:00`;

      const appointmentData = {
        patient_id: data.patient_id,
        doctor_id: data.doctor_id,
        appointment_date: appointmentDateTime, // Send full datetime
        status: 'scheduled',
        reason: data.reason,
        notes: ''
      };

      await appointmentService.createAppointment(appointmentData);
      handleCloseBookingDialog();
      fetchDashboardData();
    } catch (error) {
      console.error('Error booking appointment:', error);
    }
  };

  // Prepare Chart Data
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

  const paymentMethodData = revenueAnalytics?.payment_method_distribution
    ? Object.entries(revenueAnalytics.payment_method_distribution).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: '#ff9800'
    }))
    : [];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <PageTitle>
          Welcome back, {user?.full_name}! 👋
        </PageTitle>
        <Typography variant="body1" color="text.secondary">
          Here's what's happening with your hospital today.
        </Typography>
      </Box>

      {/* Row 1: Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <MetricCard
            title="Total Patients"
            value={stats.patients.toLocaleString()}
            icon={<People sx={{ fontSize: 32 }} />}
            color="#667eea"
            loading={loading}
            subtitle="Active patients"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <MetricCard
            title="Total Doctors"
            value={stats.doctors.toLocaleString()}
            icon={<LocalHospital sx={{ fontSize: 32 }} />}
            color="#f5576c"
            loading={loading}
            subtitle="Medical staff"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <MetricCard
            title="Today's Appointments"
            value={stats.todayAppointments.toLocaleString()}
            icon={<CalendarToday sx={{ fontSize: 32 }} />}
            color="#00f2fe"
            loading={loading}
            subtitle="Scheduled for today"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <MetricCard
            title="Total Revenue"
            value={formatCurrency(stats.revenue)}
            icon={<AttachMoney sx={{ fontSize: 32 }} />}
            color="#fee140"
            loading={loading}
            subtitle={`Pending: ${formatCurrency(stats.pendingRevenue)}`}
          />
        </Grid>
      </Grid>

      {/* Row 2: Appointment Activity & Gender Distribution */}
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
              Appointment Activity
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={appointmentChartData}>
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
              Gender Distribution
            </Typography>
            <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={genderData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
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
      </Grid>

      {/* Row 3: Age Distribution & Revenue */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
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
              Patient Age Groups
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
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
            <ResponsiveContainer width="100%" height={250}>
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
      </Grid>

      {/* Row 4: Recent Appointments & Calendar */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} lg={8}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 4,
              border: '1px solid',
              borderColor: 'divider',
              overflow: 'hidden',
              height: '100%'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" fontWeight="700">
                Recent Appointments
              </Typography>
              <Button endIcon={<ArrowForward />} size="small">
                View All
              </Button>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Patient</TableCell>
                    <TableCell>Doctor</TableCell>
                    <TableCell>Date & Time</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentAppointments.length > 0 ? (
                    recentAppointments.map((appointment) => (
                      <TableRow key={appointment.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{ mr: 2, width: 36, height: 36, bgcolor: '#667eea', fontSize: 14 }}>
                              {getInitials(appointment.patient?.name || appointment.patient_name || 'P')}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight="600">
                                {appointment.patient?.name || appointment.patient_name || 'Unknown'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                ID: {appointment.patient_id}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {appointment.doctor?.name || appointment.doctor_name || 'Unknown'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(appointment.appointment_date).toLocaleDateString()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(appointment.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={appointment.status}
                            size="small"
                            color={
                              appointment.status === 'completed' ? 'success' :
                                appointment.status === 'cancelled' ? 'error' :
                                  'primary'
                            }
                            sx={{ fontWeight: 'bold' }}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        <Typography variant="body2" color="text.secondary">No recent appointments</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
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

            </Typography>
            <Calendar
              events={[]}
              onDateClick={handleDateClick}
            />
          </Paper>
        </Grid>
      </Grid>

      {/* Row 5: Pending Lab Tests & Unpaid Bills */}
      <Grid container spacing={3}>
        <Grid item xs={12} lg={6}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 4,
              border: '1px solid',
              borderColor: 'divider',
              overflow: 'hidden',
              height: '100%'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" fontWeight="700">
                Pending Lab Tests
              </Typography>
              <Button endIcon={<ArrowForward />} size="small">
                View All
              </Button>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Test Name</TableCell>
                    <TableCell>Patient</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pendingLabTests.length > 0 ? (
                    pendingLabTests.map((test) => (
                      <TableRow key={test.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{ mr: 2, width: 36, height: 36, bgcolor: 'warning.light', color: 'warning.dark' }}>
                              <Science fontSize="small" />
                            </Avatar>
                            <Typography variant="body2" fontWeight="600">
                              {test.test_name}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {test.patient?.name || 'Unknown'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(test.ordered_date).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={test.status}
                            size="small"
                            color="warning"
                            sx={{ fontWeight: 'bold' }}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        <Typography variant="body2" color="text.secondary">No pending lab tests</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} lg={6}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 4,
              border: '1px solid',
              borderColor: 'divider',
              overflow: 'hidden',
              height: '100%'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" fontWeight="700">
                Recent Unpaid Bills
              </Typography>
              <Button endIcon={<ArrowForward />} size="small">
                View All
              </Button>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Patient</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell align="right">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {unpaidBills.map((bill, index) => (
                    <TableRow key={index} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ width: 32, height: 32, mr: 2, bgcolor: 'error.light', color: 'error.dark', fontSize: 14 }}>
                            <ReceiptLong fontSize="inherit" />
                          </Avatar>
                          <Typography variant="body2" fontWeight="600">
                            {bill.patient?.name || 'Unknown'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(bill.bill_date).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="700" color="error.main">
                          {formatCurrency(bill.total_amount)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Chip label="Unpaid" size="small" color="error" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
                      </TableCell>
                    </TableRow>
                  ))}
                  {unpaidBills.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        <Typography color="text.secondary">No unpaid bills</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Booking Dialog */}
      <Dialog open={openBookingDialog} onClose={handleCloseBookingDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Book Appointment - {selectedDate.toLocaleDateString()}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="Select Patient"
                  {...register('patient_id', { required: 'Patient is required' })}
                  error={!!errors.patient_id}
                  helperText={errors.patient_id?.message || (patients.length === 0 ? 'No patients available' : '')}
                  disabled={patients.length === 0}
                >
                  {patients.map((patient) => (
                    <MenuItem key={patient.id} value={patient.id}>
                      {patient.user?.full_name} (ID: {patient.patient_id})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="Select Doctor"
                  {...register('doctor_id', { required: 'Doctor is required' })}
                  error={!!errors.doctor_id}
                  helperText={errors.doctor_id?.message || (doctors.length === 0 ? 'No doctors available' : '')}
                  disabled={doctors.length === 0}
                >
                  {doctors.map((doctor) => (
                    <MenuItem key={doctor.id} value={doctor.id}>
                      {doctor.user?.full_name} - {doctor.specialization}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="time"
                  label="Time"
                  InputLabelProps={{ shrink: true }}
                  {...register('appointment_time', { required: 'Time is required' })}
                  error={!!errors.appointment_time}
                  helperText={errors.appointment_time?.message}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Reason for Visit"
                  {...register('reason')}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseBookingDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit(handleBookAppointment)}
            disabled={patients.length === 0 || doctors.length === 0}
          >
            Book Appointment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminDashboard;