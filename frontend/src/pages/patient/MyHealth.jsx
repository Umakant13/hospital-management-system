import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Divider,
  CircularProgress,
  useTheme,
  alpha,
  Chip,
} from '@mui/material';
import {
  Favorite,
  FitnessCenter,
  Height,
  MonitorWeight,
  TrendingUp,
  WaterDrop,
  MonitorHeart,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { patientService } from '@/services/patientService';
import { useAuthStore } from '@/store/authStore';
import PageTitle from '@/components/common/PageTitle';
import { medicalRecordService } from '@/services/medicalRecordService';
import { formatDateTime } from '@/utils/helpers';

const HealthMetricCard = ({ title, value, unit, status, max, change, icon, color }) => {
  const theme = useTheme();

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
            {status ? status.toUpperCase() : 'NORMAL'}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

const MyHealth = () => {
  const theme = useTheme();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [vitalsHistory, setVitalsHistory] = useState([]);
  const [medicalHistory, setMedicalHistory] = useState([]);
  const [currentMedications, setCurrentMedications] = useState([]);
  const [latestVitals, setLatestVitals] = useState({
    weight: { value: 70, unit: 'kg' },
    height: { value: 1.75, unit: 'm' },
    bmi: { value: 22.9, unit: 'kg/m²' },
    bp: { value: '120/80', unit: 'mmHg' },
    heartRate: { value: 72, unit: 'bpm' }
  });

  useEffect(() => {
    fetchHealthData();
  }, []);

  const fetchHealthData = async () => {
    try {
      setLoading(true);
      // Fetch medical records to get vitals history and medical history
      const records = await medicalRecordService.getAllRecords();
      console.log('Medical records for health:', records);

      // Process records to extract vitals
      const history = records
        .filter(r => r.record_date && r.weight)
        .map(r => ({
          date: formatDateTime(r.record_date).split(',')[0], // Just the date
          weight: parseFloat(r.weight),
          heartRate: parseInt(r.heart_rate) || 72,
          bp: r.blood_pressure || '120/80'
        }))
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(-6); // Last 6 records

      if (history.length > 0) {
        setVitalsHistory(history);
        const latest = history[history.length - 1];
        setLatestVitals(prev => ({
          ...prev,
          weight: { ...prev.weight, value: latest.weight },
          heartRate: { ...prev.heartRate, value: latest.heartRate },
          bp: { ...prev.bp, value: latest.bp }
        }));
      } else {
        // Fallback mock data for visualization if no records
        setVitalsHistory([
          { date: 'Jan', weight: 70, heartRate: 72 },
          { date: 'Feb', weight: 69.5, heartRate: 75 },
          { date: 'Mar', weight: 69, heartRate: 71 },
          { date: 'Apr', weight: 68.5, heartRate: 73 },
          { date: 'May', weight: 68.2, heartRate: 70 },
          { date: 'Jun', weight: 68, heartRate: 72 },
        ]);
      }

      // Extract medical history from records
      const medHistory = records
        .map(r => ({
          diagnosis: r.assessment || r.diagnosis || r.chief_complaint,
          date: formatDateTime(r.record_date),
          doctor: r.doctor?.name
        }))
        .filter(h => h.diagnosis)
        .slice(0, 5); // Last 5 diagnoses

      setMedicalHistory(medHistory);

      // Fetch current medications from active prescriptions
      const prescriptionService = (await import('@/services/prescriptionService')).prescriptionService;
      const prescriptions = await prescriptionService.getAllPrescriptions();
      console.log('Prescriptions for medications:', prescriptions);

      // Extract all medications from active prescriptions
      const meds = [];
      prescriptions.forEach(prescription => {
        if (Array.isArray(prescription.medications)) {
          prescription.medications.forEach(med => {
            meds.push({
              name: med.name,
              dosage: med.dosage,
              frequency: med.frequency,
              duration: med.duration
            });
          });
        }
      });

      setCurrentMedications(meds.slice(0, 5)); // Show max 5 medications

    } catch (error) {
      console.error('Error fetching health data:', error);
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
      <Box sx={{ mb: 5 }}>
        <Typography variant="h3" fontWeight="800" gutterBottom sx={{
          background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.info.main})`,
          backgroundClip: 'text',
          textFillColor: 'transparent',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          display: 'inline-block',
          fontSize: { xs: '2rem', md: '3rem' }
        }}>
          My Health Overview
        </Typography>
        <Typography variant="h6" color="text.secondary" fontWeight="normal">
          Track your vitals and health trends over time.
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 5 }}>
        <Grid item xs={12} sm={6} md={6} lg={3}>
          <HealthMetricCard
            title="Weight"
            value={latestVitals.weight.value}
            unit={latestVitals.weight.unit}
            status="good"
            max={100}
            change="-0.5"
            icon={<MonitorWeight />}
            color={theme.palette.success.main}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={6} lg={3}>
          <HealthMetricCard
            title="Height"
            value={latestVitals.height.value}
            unit={latestVitals.height.unit}
            status="good"
            max={2.5}
            icon={<Height />}
            color={theme.palette.info.main}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={6} lg={3}>
          <HealthMetricCard
            title="BMI"
            value={latestVitals.bmi.value}
            unit={latestVitals.bmi.unit}
            status="good"
            max={30}
            icon={<FitnessCenter />}
            color={theme.palette.warning.main}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={6} lg={3}>
          <HealthMetricCard
            title="Heart Rate"
            value={latestVitals.heartRate.value}
            unit={latestVitals.heartRate.unit}
            status="good"
            max={120}
            icon={<Favorite />}
            color={theme.palette.error.main}
          />
        </Grid>
      </Grid>

      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 4,
              border: '1px solid',
              borderColor: 'divider',
              height: '100%'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
              <Typography variant="h5" fontWeight="700">
                Weight Trend
              </Typography>
              <Chip label="Last 6 Months" size="small" sx={{ borderRadius: 2 }} />
            </Box>

            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={vitalsHistory}>
                <defs>
                  <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: theme.palette.text.secondary }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: theme.palette.text.secondary }}
                  domain={['auto', 'auto']}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: 'none',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="weight"
                  stroke={theme.palette.primary.main}
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorWeight)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
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
                  Medical History
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {medicalHistory.length > 0 ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {medicalHistory.map((item, index) => (
                      <Box key={index}>
                        <Typography variant="body2" fontWeight="600" color="primary.main">
                          {item.diagnosis}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.date} • {item.doctor || 'Unknown'}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No medical history recorded yet.
                  </Typography>
                )}
              </Paper>
            </Grid>

            <Grid item xs={12}>
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
                  Current Medications
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {currentMedications.length > 0 ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {currentMedications.map((med, index) => (
                      <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ p: 1, borderRadius: 2, bgcolor: alpha(theme.palette.info.main, 0.1), color: 'info.main' }}>
                          <WaterDrop />
                        </Box>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="600">{med.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {med.dosage} • {med.frequency}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No active medications.
                  </Typography>
                )}
              </Paper>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default MyHealth;