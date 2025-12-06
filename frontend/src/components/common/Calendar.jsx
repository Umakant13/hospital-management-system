import React, { useState } from 'react';
import { Box, Typography, IconButton, Grid, Paper, Tooltip } from '@mui/material';
import { ChevronLeft, ChevronRight, CalendarToday } from '@mui/icons-material';

const Calendar = ({ events = [], onDateClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const isToday = (day) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (day) => {
    return (
      day === selectedDate.getDate() &&
      currentDate.getMonth() === selectedDate.getMonth() &&
      currentDate.getFullYear() === selectedDate.getFullYear()
    );
  };

  const handleDateClick = (day) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(newDate);
    if (onDateClick) {
      onDateClick(newDate);
    }
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const calendarDays = [];

  // Previous month's trailing days
  const prevMonthDays = getDaysInMonth(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  for (let i = firstDay - 1; i >= 0; i--) {
    calendarDays.push({ day: prevMonthDays - i, isCurrentMonth: false });
  }

  // Current month's days
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push({ day, isCurrentMonth: true });
  }

  // Next month's leading days
  const remainingDays = 42 - calendarDays.length; // 6 rows * 7 days
  for (let day = 1; day <= remainingDays; day++) {
    calendarDays.push({ day, isCurrentMonth: false });
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <CalendarToday sx={{ fontSize: 20, color: 'text.secondary' }} />
        <Typography variant="h6" fontWeight="600">
          Calendar
        </Typography>
      </Box>

      {/* Calendar Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1" fontWeight="600">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </Typography>
        <Box>
          <IconButton size="small" onClick={previousMonth}>
            <ChevronLeft fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={nextMonth}>
            <ChevronRight fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* Day Labels */}
      <Grid container spacing={0.5} sx={{ mb: 0.5 }}>
        {daysOfWeek.map((day, idx) => (
          <Grid item xs={12 / 7} key={idx}>
            <Typography
              variant="caption"
              align="center"
              display="block"
              fontWeight="600"
              color="text.secondary"
            >
              {day}
            </Typography>
          </Grid>
        ))}
      </Grid>

      {/* Calendar Days */}
      <Grid container spacing={0.5}>
        {calendarDays.map((dayObj, idx) => (
          <Grid item xs={12 / 7} key={idx}>
            <Tooltip title={dayObj.isCurrentMonth ? "Click to book appointment" : ""}>
              <Box
                onClick={() => dayObj.isCurrentMonth && handleDateClick(dayObj.day)}
                sx={{
                  textAlign: 'center',
                  py: 1,
                  borderRadius: 1,
                  bgcolor: isSelected(dayObj.day) && dayObj.isCurrentMonth
                    ? 'primary.main'
                    : isToday(dayObj.day) && dayObj.isCurrentMonth
                      ? 'secondary.main'
                      : 'transparent',
                  color: (isSelected(dayObj.day) || isToday(dayObj.day)) && dayObj.isCurrentMonth
                    ? 'white'
                    : dayObj.isCurrentMonth
                      ? 'text.primary'
                      : '#ccc',
                  fontWeight: (isSelected(dayObj.day) || isToday(dayObj.day)) && dayObj.isCurrentMonth ? 600 : 400,
                  cursor: dayObj.isCurrentMonth ? 'pointer' : 'default',
                  '&:hover': dayObj.isCurrentMonth && !isSelected(dayObj.day) ? {
                    bgcolor: 'action.hover',
                    transform: 'scale(1.1)',
                  } : {},
                  transition: 'all 0.2s ease',
                  boxShadow: isSelected(dayObj.day) && dayObj.isCurrentMonth ? 2 : 0,
                }}
              >
                <Typography variant="caption">{dayObj.day}</Typography>
              </Box>
            </Tooltip>
          </Grid>
        ))}
      </Grid>

      {/* Today's Schedule */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle2" fontWeight="600" gutterBottom>
          Schedule for {selectedDate.toLocaleDateString()}
        </Typography>
        {events.length > 0 ? (
          events.map((event, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                alignItems: 'center',
                py: 1.5,
                borderBottom: '1px solid #f0f0f0'
              }}
            >
              <Box
                sx={{
                  width: 4,
                  height: 40,
                  bgcolor: event.color || '#667eea',
                  borderRadius: 1,
                  mr: 2
                }}
              />
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" fontWeight="500">
                  {event.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {event.time}
                </Typography>
              </Box>
            </Box>
          ))
        ) : (
          <Typography variant="caption" color="text.secondary">
            No events scheduled for this day
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default Calendar;
