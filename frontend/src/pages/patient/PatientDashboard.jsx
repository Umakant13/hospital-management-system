import React, { useState, useEffect } from 'react';
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
  Button,
  CircularProgress,
  Container,
  useTheme,
  alpha,
} from '@mui/material';
import {
  LocalHospital,
  CalendarMonth,
  Description,
  Favorite,
  MoreVert,
  TrendingUp,
  ArrowForward,
  Science,
  AccessTime,
  Person,
  WaterDrop,
  MonitorHeart,
  Height,
  MonitorWeight,
  VideoCall,
} from '@mui/icons-material';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency } from '@/utils/constants';
import PageTitle from '@/components/common/PageTitle';
import { useNavigate } from 'react-router-dom';
import { appointmentService } from '@/services/appointmentService';
import { medicalRecordService } from '@/services/medicalRecordService';
import { labTestService } from '@/services/labTestService';
import { patientService } from '@/services/patientService';
import { doctorService } from '@/services/doctorService';
import { formatDateTime } from '@/utils/helpers';
import SymptomChecker from '@/components/patient/SymptomChecker';

const HealthMetricCard = ({ title, value, unit, status, max, change, icon, color }) => {
  const theme = useTheme();

  const getColor = () => {
    if (status === 'good') return theme.palette.success.main;
    if (status === 'warning') return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const percentage = max ? (value / max) * 100 : 75;

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 4,
        border: '1px solid',
        borderColor: 'divider',
        position: 'relative',
        overflow: 'hidden',
        height: '100%',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 12px 24px -10px rgba(0, 0, 0, 0.1)',
          borderColor: color || 'primary.main',
        }
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0 }}>
            <Box
              sx={{
                p: 1,
                borderRadius: 2,
                bgcolor: alpha(color || theme.palette.primary.main, 0.1),
                color: color || 'primary.main',
                display: 'flex',
                flexShrink: 0
              }}
            >
              {icon}
            </Box>
            <Typography variant="body2" color="text.secondary" fontWeight="600" noWrap>
              {title}
            </Typography>
          </Box>
          {change && (
            <Chip
              size="small"
              label={change}
              sx={{
                bgcolor: status === 'good' ? alpha(theme.palette.success.main, 0.1) : alpha(theme.palette.warning.main, 0.1),
                color: status === 'good' ? 'success.main' : 'warning.main',
                fontWeight: 700,
                height: 24,
                fontSize: '0.75rem',
                ml: 1
              }}
              icon={<TrendingUp sx={{ fontSize: 14 }} />}
            />
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, mb: 2, flexWrap: 'wrap' }}>
          <Typography variant="h4" fontWeight="700" sx={{ color: 'text.primary', fontSize: { xs: '1.5rem', md: '2rem' } }}>
            {value}
          </Typography>
          <Typography variant="body2" color="text.secondary" fontWeight="500">{unit}</Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ flexGrow: 1 }}>
            <LinearProgress
              variant="determinate"
              value={percentage}
              sx={{
                height: 6,
                borderRadius: 4,
                bgcolor: alpha(color || theme.palette.primary.main, 0.1),
                '& .MuiLinearProgress-bar': {
                  bgcolor: color || 'primary.main',
                  borderRadius: 4,
                }
              }}
            />
          </Box>
          <Typography
            variant="caption"
            sx={{
              color: color || 'text.secondary',
              fontWeight: 700,
              minWidth: 45,
              textAlign: 'right',
              fontSize: '0.7rem'
            }}
          >
            {status.toUpperCase()}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

const QuickActionCard = ({ title, subtitle, icon, color, onClick }) => {
  const theme = useTheme();

  return (
    <Card
      elevation={0}
      sx={{
        textAlign: 'center',
        p: 3,
        cursor: 'pointer',
        borderRadius: 4,
        border: '1px solid',
        borderColor: 'divider',
        height: '100%',
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: '0 12px 24px -10px rgba(0, 0, 0, 0.1)',
          transform: 'translateY(-4px)',
          borderColor: color,
        }
      }}
      onClick={onClick}
    >
      <Box
        sx={{
          width: 64,
          height: 64,
          borderRadius: 3,
          background: `linear-gradient(135deg, ${color} 0%, ${alpha(color, 0.6)} 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto',
          mb: 2,
          boxShadow: `0 8px 16px -4px ${alpha(color, 0.4)}`
        }}
      >
        {React.cloneElement(icon, { sx: { fontSize: 32, color: 'white' } })}
      </Box>
      <Typography variant="h6" fontWeight="700" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {subtitle}
      </Typography>
    </Card>
  );
};

const PatientDashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const theme = useTheme();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    appointments: [],
    medicalRecordsCount: 0,
    labTestsCount: 0,
    upcomingAppointment: null,
    patientProfile: null
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // 1. Get Profile First
      const profile = await patientService.getMyProfile();
      if (!profile) throw new Error("Failed to load profile");

      // 2. Fetch parallel data
      const [doctorsList, appointments, records, tests] = await Promise.all([
        doctorService.getAllDoctors(),
        appointmentService.getAllAppointments({ patient_id: profile.id }), // Filter by patient
        medicalRecordService.getAllRecords(),
        labTestService.getAllLabTests(),
      ]);

      // 3. Build Doctor Map
      const doctorsMap = {};
      doctorsList.forEach(doc => {
        doctorsMap[doc.id] = doc;
      });

      // 4. Process Appointments with Doctor Names
      const processedAppointments = appointments.map(apt => {
        // Resolve doctor name
        let doctor = doctorsMap[apt.doctor_id];
        if (!doctor && apt.doctor && apt.doctor.user) {
          doctor = apt.doctor;
        }
        const doctorName = doctor?.user?.full_name || 'Unknown Doctor';
        const doctorSpec = doctor?.specialization || 'General';

        return {
          ...apt,
          resolvedDoctorName: doctorName,
          resolvedSpecialization: doctorSpec
        };
      });

      // Filter upcoming appointments (Include all of today's appointments)
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const upcoming = processedAppointments
        .filter(apt => {
          const aptDate = new Date(apt.appointment_date);
          return aptDate >= today && ['scheduled', 'confirmed'].includes(apt.status);
        })
        .sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date));

      // Count appointments this month
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const thisMonthAppointments = processedAppointments.filter(apt => {
        const aptDate = new Date(apt.appointment_date);
        return aptDate >= thisMonthStart && aptDate <= thisMonthEnd;
      });

      setStats({
        appointments: upcoming.slice(0, 2),
        medicalRecordsCount: records.length,
        labTestsCount: tests.length,
        upcomingAppointment: upcoming[0] || null,
        patientProfile: profile,
        appointmentsThisMonth: thisMonthAppointments.length
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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
      {/* Header */}
      <Box sx={{ mb: 5 }}>
        <Typography variant="h3" fontWeight="800" gutterBottom sx={{
          background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          backgroundClip: 'text',
          textFillColor: 'transparent',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          display: 'inline-block',
          fontSize: { xs: '2rem', md: '3rem' }
        }}>
          Hello, {user?.full_name?.split(' ')[0]}! 👋
        </Typography>
        <Typography variant="h6" color="text.secondary" fontWeight="normal">
          Here's your daily health overview and upcoming schedule.
        </Typography>
      </Box>

      {/* Health Metrics */}
      <Grid container spacing={3} sx={{ mb: 5 }}>
        <Grid item xs={12} sm={6} md={6} lg={3}>
          <HealthMetricCard
            title="BMI"
            value={stats.patientProfile?.bmi?.toFixed(1) || 'N/A'}
            unit="kg/m²"
            status={
              !stats.patientProfile?.bmi ? 'good' :
                stats.patientProfile.bmi < 18.5 ? 'warning' :
                  stats.patientProfile.bmi < 25 ? 'good' :
                    stats.patientProfile.bmi < 30 ? 'warning' : 'bad'
            }
            max={30}
            change={stats.patientProfile?.bmi_category || 'Unknown'}
            icon={<Height />}
            color={theme.palette.primary.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={6} lg={3}>
          <HealthMetricCard
            title="Blood Group"
            value={stats.patientProfile?.blood_group || 'N/A'}
            unit=""
            status="good"
            max={100}
            change={stats.appointmentsThisMonth ? `${stats.appointmentsThisMonth} apt${stats.appointmentsThisMonth !== 1 ? 's' : ''} this month` : 'No appointments'}
            icon={<WaterDrop />}
            color={theme.palette.error.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={6} lg={3}>
          <HealthMetricCard
            title="Height"
            value={stats.patientProfile?.height || 'N/A'}
            unit="cm"
            status="good"
            max={200}
            change="Normal"
            icon={<Height />}
            color={theme.palette.secondary.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={6} lg={3}>
          <HealthMetricCard
            title="Weight"
            value={stats.patientProfile?.weight || 'N/A'}
            unit="kg"
            status="good"
            max={100}
            change={stats.patientProfile?.age ? `Age: ${stats.patientProfile.age}` : 'Unknown'}
            icon={<MonitorWeight />}
            color={theme.palette.success.main}
          />
        </Grid>
      </Grid>

      <Grid container spacing={4}>
        {/* Appointments Section */}
        <Grid item xs={12} md={8}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" fontWeight="700">
              Upcoming Appointments
            </Typography>
            <Button
              endIcon={<ArrowForward />}
              onClick={() => navigate('/patient/appointments')}
              sx={{ borderRadius: 2 }}
            >
              View All
            </Button>
          </Box>

          {stats.appointments.length > 0 ? (
            <Grid container spacing={2}>
              {stats.appointments.map((appointment) => (
                <Grid item xs={12} key={appointment.id}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      borderRadius: 4,
                      border: '1px solid',
                      borderColor: 'divider',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.08)',
                        borderColor: 'primary.main',
                        transform: 'translateY(-2px)',
                      }
                    }}
                  >
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm="auto">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar
                            sx={{
                              width: 64,
                              height: 64,
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              color: 'primary.main',
                              fontSize: '1.5rem',
                              fontWeight: 'bold'
                            }}
                          >
                            {appointment.resolvedDoctorName?.split(' ')[1]?.[0] || 'D'}
                          </Avatar>
                          <Box sx={{ display: { sm: 'none' } }}>
                            <Typography variant="h6" fontWeight="700">
                              {appointment.resolvedDoctorName}
                            </Typography>
                            <Chip
                              label={appointment.status.toUpperCase()}
                              size="small"
                              color={appointment.status === 'confirmed' ? 'success' : 'warning'}
                              sx={{ fontWeight: 700, borderRadius: 2, mt: 0.5 }}
                            />
                          </Box>
                        </Box>
                      </Grid>

                      <Grid item xs={12} sm>
                        <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                          <Typography variant="h6" fontWeight="700" gutterBottom>
                            {appointment.resolvedDoctorName}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                          <Chip
                            icon={<LocalHospital sx={{ fontSize: 16 }} />}
                            label={appointment.resolvedSpecialization}
                            size="small"
                            sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', fontWeight: 600 }}
                          />
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                            <CalendarMonth sx={{ fontSize: 18 }} />
                            <Typography variant="body2" fontWeight="500">
                              {formatDateTime(appointment.appointment_date)}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>

                      <Grid item xs={12} sm="auto" sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
                        <Chip
                          label={appointment.status.toUpperCase()}
                          color={appointment.status === 'confirmed' ? 'success' : 'warning'}
                          sx={{ fontWeight: 700, borderRadius: 2 }}
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Paper
              elevation={0}
              sx={{
                p: 4,
                textAlign: 'center',
                borderRadius: 4,
                border: '1px dashed',
                borderColor: 'divider',
                bgcolor: 'background.default'
              }}
            >
              <CalendarMonth sx={{ fontSize: 48, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No upcoming appointments
              </Typography>
              <Button
                variant="contained"
                onClick={() => navigate('/patient/appointments')}
                sx={{ mt: 2, borderRadius: 2 }}
              >
                Book Now
              </Button>
            </Paper>
          )}
        </Grid>

        {/* Health Analytics */}
        <Grid item xs={12} md={4}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 4,
              border: '1px solid',
              borderColor: 'divider',
              height: '100%',
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.background.paper, 1)} 100%)`
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'primary.main', color: 'white' }}>
                <TrendingUp />
              </Box>
              <Typography variant="h6" fontWeight="700">
                Health Analytics
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary" fontWeight="600">Appointment Frequency</Typography>
                  <Typography variant="body2" fontWeight="700" color={
                    stats.appointmentsThisMonth === 0 ? 'text.secondary' :
                      stats.appointmentsThisMonth <= 2 ? 'success.main' :
                        stats.appointmentsThisMonth <= 4 ? 'warning.main' : 'error.main'
                  }>
                    {stats.appointmentsThisMonth === 0 ? 'None' :
                      stats.appointmentsThisMonth <= 2 ? 'Low' :
                        stats.appointmentsThisMonth <= 4 ? 'Moderate' : 'High'}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min((stats.appointmentsThisMonth / 5) * 100, 100)}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    '& .MuiLinearProgress-bar': {
                      bgcolor: stats.appointmentsThisMonth <= 2 ? theme.palette.success.main :
                        stats.appointmentsThisMonth <= 4 ? theme.palette.warning.main : theme.palette.error.main
                    }
                  }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  {stats.appointmentsThisMonth === 0
                    ? 'No appointments scheduled this month.'
                    : `You have ${stats.appointmentsThisMonth} appointment${stats.appointmentsThisMonth !== 1 ? 's' : ''} this month.`
                  }
                </Typography>
              </Box>

              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary" fontWeight="600">Medical Records</Typography>
                  <Typography variant="body2" fontWeight="700" color="info.main">
                    {stats.medicalRecordsCount > 0 ? 'Active' : 'None'}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min((stats.medicalRecordsCount / 10) * 100, 100)}
                  color="info"
                  sx={{ height: 8, borderRadius: 4, bgcolor: alpha(theme.palette.info.main, 0.1) }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  {stats.medicalRecordsCount === 0
                    ? 'No medical records yet.'
                    : `${stats.medicalRecordsCount} medical record${stats.medicalRecordsCount !== 1 ? 's' : ''} on file.`
                  }
                </Typography>
              </Box>

              <Box sx={{ p: 2, borderRadius: 3, bgcolor: 'white', border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle2" fontWeight="700" gutterBottom>
                  Health Activity Score
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                  <Typography variant="h3" fontWeight="800" color="primary.main">
                    {(() => {
                      // Calculate health score based on activity
                      const baseScore = 50;
                      const appointmentScore = Math.min(stats.appointmentsThisMonth * 10, 25);
                      const recordScore = Math.min(stats.medicalRecordsCount * 5, 15);
                      const testScore = Math.min(stats.labTestsCount * 5, 10);
                      return Math.min(baseScore + appointmentScore + recordScore + testScore, 100);
                    })()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    / 100
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Based on your appointments, records, and lab tests.
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Quick Actions Row */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" fontWeight="700" sx={{ mb: 3 }}>
          Quick Actions
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={6} lg={3}>
            <QuickActionCard
              title="Book Appointment"
              subtitle="Schedule a visit"
              icon={<LocalHospital />}
              color="#4facfe"
              onClick={() => navigate('/patient/appointments')}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={6} lg={3}>
            <QuickActionCard
              title="Medical Records"
              subtitle={`${stats.medicalRecordsCount} records`}
              icon={<Description />}
              color="#f093fb"
              onClick={() => navigate('/patient/medical-records')}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={6} lg={3}>
            <QuickActionCard
              title="Lab Results"
              subtitle={`${stats.labTestsCount} reports`}
              icon={<Science />}
              color="#fa709a"
              onClick={() => navigate('/patient/lab-tests')}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={6} lg={3}>
            <QuickActionCard
              title="Video Consultation"
              subtitle="Virtual visits"
              icon={<VideoCall />}
              color="#00f2fe"
              onClick={() => navigate('/patient/video-consultations')}
            />
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default PatientDashboard;