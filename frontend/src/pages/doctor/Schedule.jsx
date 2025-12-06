import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Divider,
  Avatar,
  IconButton,
  Button,
  useTheme,
  alpha
} from '@mui/material';
import {
  Event,
  AccessTime,
  Person,
  CheckCircle,
  Cancel,
  MoreVert,
  CalendarMonth,
  Schedule as ScheduleIcon,
  ArrowForward,
  ArrowBack,
  ChevronLeft,
  ChevronRight
} from '@mui/icons-material';
import { useAuthStore } from '@/store/authStore';
import { doctorService } from '@/services/doctorService';
import PageTitle from '@/components/common/PageTitle';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday
} from 'date-fns';

const CustomCalendar = ({ selectedDate, onDateSelect }) => {
  const theme = useTheme();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const dateFormat = "d";
  const rows = [];
  let days = [];
  let day = startDate;
  let formattedDate = "";

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const daysInMonth = eachDayOfInterval({
    start: startDate,
    end: endDate
  });

  return (
    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, height: '100%' }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider' }}>
        <IconButton onClick={prevMonth} size="small"><ChevronLeft /></IconButton>
        <Typography variant="h6" fontWeight="bold">
          {format(currentMonth, "MMMM yyyy")}
        </Typography>
        <IconButton onClick={nextMonth} size="small"><ChevronRight /></IconButton>
      </Box>
      <CardContent sx={{ p: 2 }}>
        <Grid container spacing={1}>
          {weekDays.map((d) => (
            <Grid item xs={1.7} key={d} sx={{ textAlign: 'center' }}>
              <Typography variant="caption" fontWeight="bold" color="text.secondary">
                {d}
              </Typography>
            </Grid>
          ))}
          {daysInMonth.map((dayItem, idx) => (
            <Grid item xs={1.7} key={idx}>
              <Box
                onClick={() => onDateSelect(dayItem)}
                sx={{
                  p: 1,
                  textAlign: 'center',
                  cursor: 'pointer',
                  borderRadius: 2,
                  bgcolor: isSameDay(dayItem, selectedDate)
                    ? 'primary.main'
                    : isToday(dayItem)
                      ? alpha(theme.palette.primary.main, 0.1)
                      : 'transparent',
                  color: isSameDay(dayItem, selectedDate)
                    ? 'white'
                    : !isSameMonth(dayItem, monthStart)
                      ? 'text.disabled'
                      : 'text.primary',
                  fontWeight: isSameDay(dayItem, selectedDate) || isToday(dayItem) ? 'bold' : 'normal',
                  '&:hover': {
                    bgcolor: isSameDay(dayItem, selectedDate)
                      ? 'primary.dark'
                      : alpha(theme.palette.primary.main, 0.05)
                  }
                }}
              >
                {format(dayItem, dateFormat)}
              </Box>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
};

const Schedule = () => {
  const theme = useTheme();
  const { user } = useAuthStore();
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    const fetchSchedule = async () => {
      if (!user?.doctor_id) return;
      try {
        setLoading(true);
        // Format date as YYYY-MM-DD
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const data = await doctorService.getDoctorSchedule(user.doctor_id, dateStr);

        // Transform the single day schedule into a list for display
        setSchedule([{
          day: format(selectedDate, 'EEEE, MMMM do, yyyy'),
          slots: data.appointments.map(apt => ({
            id: apt.id,
            time: new Date(apt.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            patient: apt.patient_name,
            type: apt.type || 'Consultation',
            status: apt.status || 'scheduled',
            notes: apt.notes || 'Routine Checkup',
            avatar: apt.patient_name?.[0] || 'P'
          }))
        }]);
      } catch (error) {
        console.error('Error fetching schedule:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [user, selectedDate]);

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      case 'in_progress': return 'warning';
      default: return 'primary';
    }
  };

  return (
    <Box sx={{ pb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <PageTitle>My Schedule</PageTitle>
        <Typography variant="body1" color="text.secondary">
          Manage your appointments and daily timeline
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column: Calendar & Stats */}
        <Grid item xs={12} md={4}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <CustomCalendar selectedDate={selectedDate} onDateSelect={setSelectedDate} />
            </Grid>
            <Grid item xs={12}>
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Daily Summary
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ p: 1, borderRadius: 1, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
                          <Event fontSize="small" />
                        </Box>
                        <Typography variant="body2" fontWeight="600">Total Appointments</Typography>
                      </Box>
                      <Typography variant="h6" fontWeight="800">{schedule[0]?.slots?.length || 0}</Typography>
                    </Box>
                    <Divider />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ p: 1, borderRadius: 1, bgcolor: alpha(theme.palette.info.main, 0.1), color: 'info.main' }}>
                          <ScheduleIcon fontSize="small" />
                        </Box>
                        <Typography variant="body2" fontWeight="600">Pending</Typography>
                      </Box>
                      <Typography variant="h6" fontWeight="800">{schedule[0]?.slots?.filter(s => s.status === 'scheduled').length || 0}</Typography>
                    </Box>
                    <Divider />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ p: 1, borderRadius: 1, bgcolor: alpha(theme.palette.success.main, 0.1), color: 'success.main' }}>
                          <CheckCircle fontSize="small" />
                        </Box>
                        <Typography variant="body2" fontWeight="600">Completed</Typography>
                      </Box>
                      <Typography variant="h6" fontWeight="800">{schedule[0]?.slots?.filter(s => s.status === 'completed').length || 0}</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Right Column: Timeline */}
        <Grid item xs={12} md={8}>
          {schedule.length === 0 || schedule[0]?.slots?.length === 0 ? (
            <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 4, border: '1px dashed', borderColor: 'divider', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              <Event sx={{ fontSize: 60, color: 'text.disabled', mb: 2, opacity: 0.5 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>No schedule for {format(selectedDate, 'MMM do')}</Typography>
              <Typography variant="body2" color="text.secondary">Select another date from the calendar.</Typography>
            </Paper>
          ) : (
            schedule.map((daySchedule, index) => (
              <Card key={index} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, overflow: 'hidden', height: '100%' }}>
                <Box sx={{ p: 3, bgcolor: alpha(theme.palette.primary.main, 0.03), borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" fontWeight="700" color="primary.main">
                    {daySchedule.day}
                  </Typography>
                  <Chip label={`${daySchedule.slots.length} Appointments`} color="primary" size="small" variant="outlined" />
                </Box>
                <CardContent sx={{ p: 0 }}>
                  {daySchedule.slots.map((slot, idx) => (
                    <Box key={idx} sx={{
                      p: 3,
                      borderBottom: idx !== daySchedule.slots.length - 1 ? '1px solid' : 'none',
                      borderColor: 'divider',
                      transition: 'all 0.2s',
                      '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.02) }
                    }}>
                      <Grid container alignItems="center" spacing={2}>
                        <Grid item xs={12} sm={2}>
                          <Chip
                            icon={<AccessTime sx={{ fontSize: '1rem !important' }} />}
                            label={slot.time}
                            variant="outlined"
                            color="primary"
                            sx={{ fontWeight: 600, width: '100%' }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={5}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{
                              width: 48,
                              height: 48,
                              mr: 2,
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              color: 'primary.main',
                              fontWeight: 'bold'
                            }}>
                              {slot.avatar}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle1" fontWeight="700">
                                {slot.patient}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {slot.type}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <Typography variant="body2" color="text.secondary" sx={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>
                            {slot.notes}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={2} sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                          <Chip
                            label={slot.status}
                            color={getStatusColor(slot.status)}
                            size="small"
                            sx={{ textTransform: 'capitalize', fontWeight: 600, minWidth: 80 }}
                          />
                        </Grid>
                      </Grid>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            ))
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default Schedule;