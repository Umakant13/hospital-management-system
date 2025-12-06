import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  TextField,
  MenuItem,
  Divider,
  Avatar,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Download,
  PictureAsPdf,
  TableChart,
  Assessment,
  Description,
  TrendingUp,
  People,
  EventNote,
  AttachMoney,
  Schedule,
  CheckCircle,
  ArrowForward,
} from '@mui/icons-material';
import api from '@/services/api';
import PageTitle from '@/components/common/PageTitle';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Premium Report Card Component
const ReportCard = ({ title, description, icon, color, selected, onClick }) => (
  <Card
    elevation={0}
    onClick={onClick}
    sx={{
      cursor: 'pointer',
      borderRadius: 4,
      border: '1px solid',
      borderColor: selected ? color : 'divider',
      bgcolor: selected ? `${color}08` : 'background.paper',
      transition: 'all 0.3s ease',
      position: 'relative',
      overflow: 'hidden',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: `0 12px 24px -10px ${color}40`,
        borderColor: color,
      },
    }}
  >
    <CardContent sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
        <Avatar
          variant="rounded"
          sx={{
            bgcolor: selected ? color : `${color}15`,
            color: selected ? 'white' : color,
            width: 48,
            height: 48,
            borderRadius: 3,
            mr: 2,
            transition: 'all 0.3s ease',
          }}
        >
          {icon}
        </Avatar>
        <Box>
          <Typography variant="h6" fontWeight="700" color={selected ? 'text.primary' : 'text.primary'}>
            {title}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
            {description}
          </Typography>
        </Box>
      </Box>

      {selected && (
        <Box
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            color: color
          }}
        >
          <CheckCircle fontSize="small" />
        </Box>
      )}
    </CardContent>
  </Card>
);

const Reports = () => {
  const [reportType, setReportType] = useState('patient');
  const [format, setFormat] = useState('json');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  const reportTypes = [
    {
      value: 'patient',
      label: 'Patient Demographics',
      description: 'Comprehensive analysis of patient population, age, gender, and registration trends.',
      icon: <People />,
      color: '#667eea'
    },
    {
      value: 'appointment',
      label: 'Appointment History',
      description: 'Detailed logs of all appointments, status breakdowns, and scheduling efficiency.',
      icon: <EventNote />,
      color: '#00f2fe'
    },
    {
      value: 'financial',
      label: 'Financial Revenue',
      description: 'Income reports, billing status, outstanding payments, and revenue by method.',
      icon: <AttachMoney />,
      color: '#fee140'
    },
    {
      value: 'doctor',
      label: 'Doctor Performance',
      description: 'Metrics on doctor caseloads, patient ratings, and appointment completion rates.',
      icon: <TrendingUp />,
      color: '#f5576c'
    },
  ];

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      let endpoint = '';
      let params = { format };

      switch (reportType) {
        case 'patient':
          endpoint = '/reports/patient-report';
          break;
        case 'appointment':
          endpoint = '/reports/appointment-report';
          params = { ...params, start_date: startDate, end_date: endDate };
          break;
        case 'financial':
          endpoint = '/reports/financial-report';
          params = { ...params, start_date: startDate, end_date: endDate };
          break;
        case 'doctor':
          endpoint = '/reports/doctor-performance-report';
          break;
        default:
          break;
      }

      const response = await api.get(endpoint, { params });

      if (format === 'pdf') {
        // Generate PDF
        generatePDF(response.data, reportType);
      } else if (format === 'csv') {
        // Download CSV
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportType}_report.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        // Download JSON
        const jsonString = JSON.stringify(response.data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportType}_report.json`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = (data, type) => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(18);
    doc.setTextColor(25, 118, 210);
    const reportTitles = {
      patient: 'Patient Demographics Report',
      appointment: 'Appointment History Report',
      financial: 'Financial Revenue Report',
      doctor: 'Doctor Performance Report'
    };
    doc.text(reportTitles[type], 105, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Hospital Management System', 105, 28, { align: 'center' });
    doc.text(`Generated: ${new Date().toLocaleString()}`, 105, 34, { align: 'center' });

    // Line separator
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 38, 190, 38);

    let yPos = 45;

    // Summary section
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Summary', 20, yPos);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    yPos += 6;

    if (type === 'patient') {
      doc.text(`Total Patients: ${data.total_patients || 0}`, 20, yPos);
      yPos += 10;

      // Patient table
      const tableData = (data.data || []).map(p => [
        p.patient_id,
        p.name,
        p.age || 'N/A',
        p.gender,
        p.blood_group || 'N/A',
        p.total_appointments || 0
      ]);

      doc.autoTable({
        startY: yPos,
        head: [['Patient ID', 'Name', 'Age', 'Gender', 'Blood Group', 'Appointments']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [25, 118, 210], fontSize: 9 },
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 45 },
          2: { cellWidth: 15 },
          3: { cellWidth: 20 },
          4: { cellWidth: 25 },
          5: { cellWidth: 30 }
        }
      });
    } else if (type === 'appointment') {
      doc.text(`Total Appointments: ${data.total_appointments || 0}`, 20, yPos);
      yPos += 5;
      doc.text(`Period: ${data.period || 'All time'}`, 20, yPos);
      yPos += 10;

      const tableData = (data.data || []).map(a => [
        a.appointment_id,
        a.patient,
        a.doctor,
        new Date(a.date).toLocaleDateString(),
        a.type,
        a.status
      ]);

      doc.autoTable({
        startY: yPos,
        head: [['ID', 'Patient', 'Doctor', 'Date', 'Type', 'Status']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [25, 118, 210], fontSize: 9 },
        styles: { fontSize: 8, cellPadding: 2 }
      });
    } else if (type === 'financial') {
      doc.text(`Total Bills: ${data.total_bills || 0}`, 20, yPos);
      yPos += 5;
      doc.text(`Total Revenue: Rs. ${data.total_revenue || 0}`, 20, yPos);
      yPos += 5;
      doc.text(`Total Collected: Rs. ${data.total_collected || 0}`, 20, yPos);
      yPos += 5;
      doc.text(`Total Pending: Rs. ${data.total_pending || 0}`, 20, yPos);
      yPos += 5;
      doc.text(`Collection Rate: ${(data.collection_rate || 0).toFixed(2)}%`, 20, yPos);
      yPos += 10;

      // Revenue breakdown table
      const revenueData = [
        ['Consultation', `Rs. ${data.revenue_breakdown?.consultation || 0}`],
        ['Medication', `Rs. ${data.revenue_breakdown?.medication || 0}`],
        ['Lab Tests', `Rs. ${data.revenue_breakdown?.lab_tests || 0}`],
        ['Others', `Rs. ${data.revenue_breakdown?.others || 0}`]
      ];

      doc.autoTable({
        startY: yPos,
        head: [['Category', 'Amount']],
        body: revenueData,
        theme: 'striped',
        headStyles: { fillColor: [25, 118, 210], fontSize: 9 },
        styles: { fontSize: 9, cellPadding: 3 }
      });
    } else if (type === 'doctor') {
      doc.text(`Total Doctors: ${data.total_doctors || 0}`, 20, yPos);
      yPos += 10;

      const tableData = (data.data || []).map(d => [
        d.doctor_id,
        d.name,
        d.specialization,
        d.total_patients || 0,
        d.total_appointments || 0,
        `${(d.completion_rate || 0).toFixed(1)}%`
      ]);

      doc.autoTable({
        startY: yPos,
        head: [['Doctor ID', 'Name', 'Specialization', 'Patients', 'Appointments', 'Completion']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [25, 118, 210], fontSize: 9 },
        styles: { fontSize: 8, cellPadding: 2 }
      });
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text('This is a computer-generated report.', 105, 285, { align: 'center' });

    doc.save(`${type}_report.pdf`);
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <PageTitle>
          Reports & Analytics
        </PageTitle>
        <Typography variant="body1" color="text.secondary">
          Generate detailed insights and export data for your hospital.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column: Configuration */}
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
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Avatar sx={{ bgcolor: 'primary.light', mr: 2 }}>
                <Description />
              </Avatar>
              <Typography variant="h6" fontWeight="700">
                Configuration
              </Typography>
            </Box>

            <Box component="form" noValidate autoComplete="off">
              <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 1, color: 'text.secondary' }}>
                Select Report Type
              </Typography>
              <TextField
                fullWidth
                select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                sx={{ mb: 3 }}
                InputProps={{ sx: { borderRadius: 2 } }}
              >
                {reportTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </TextField>

              <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 1, color: 'text.secondary' }}>
                Export Format
              </Typography>
              <TextField
                fullWidth
                select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                sx={{ mb: 3 }}
                InputProps={{ sx: { borderRadius: 2 } }}
              >
                <MenuItem value="json">JSON (Preview)</MenuItem>
                <MenuItem value="csv">CSV (Excel)</MenuItem>
                <MenuItem value="pdf">PDF (Document)</MenuItem>
              </TextField>

              {(reportType === 'appointment' || reportType === 'financial') && (
                <>
                  <Divider sx={{ my: 3 }}>
                    <Chip label="Date Range" size="small" />
                  </Divider>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        type="date"
                        label="Start Date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        InputProps={{ sx: { borderRadius: 2 } }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        type="date"
                        label="End Date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        InputProps={{ sx: { borderRadius: 2 } }}
                      />
                    </Grid>
                  </Grid>
                  <Box sx={{ mb: 3 }} />
                </>
              )}

              <Button
                fullWidth
                variant="contained"
                size="large"
                startIcon={<Download />}
                onClick={handleGenerateReport}
                disabled={loading}
                sx={{
                  borderRadius: 3,
                  py: 1.5,
                  fontWeight: 'bold',
                  boxShadow: '0 8px 16px -4px rgba(33, 150, 243, 0.3)'
                }}
              >
                {loading ? 'Generating...' : 'Generate Report'}
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Right Column: Report Types Grid */}
        <Grid item xs={12} lg={8}>
          <Grid container spacing={3}>
            {reportTypes.map((type) => (
              <Grid item xs={12} md={6} key={type.value}>
                <ReportCard
                  title={type.label}
                  description={type.description}
                  icon={type.icon}
                  color={type.color}
                  selected={reportType === type.value}
                  onClick={() => setReportType(type.value)}
                />
              </Grid>
            ))}
          </Grid>

          {/* Scheduled Reports Section */}
          <Paper
            elevation={0}
            sx={{
              mt: 3,
              p: 3,
              borderRadius: 4,
              border: '1px solid',
              borderColor: 'divider',
              background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                  <Schedule />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="700">
                    Scheduled Reports
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Automate your reporting workflow
                  </Typography>
                </Box>
              </Box>

              <Typography variant="body1" sx={{ mb: 3, maxWidth: '80%' }}>
                Set up automated emails for daily, weekly, or monthly reports to keep your team informed without manual effort.
              </Typography>

              <Button
                variant="outlined"
                color="secondary"
                endIcon={<ArrowForward />}
                sx={{ borderRadius: 3, borderWidth: 2, fontWeight: 'bold', '&:hover': { borderWidth: 2 } }}
              >
                Configure Schedule
              </Button>
            </Box>

            {/* Decorative Background Icon */}
            <Schedule
              sx={{
                position: 'absolute',
                bottom: -20,
                right: -20,
                fontSize: 180,
                opacity: 0.05,
                transform: 'rotate(-15deg)'
              }}
            />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Reports;