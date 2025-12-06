import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  CircularProgress,
  useTheme,
  alpha,
  Collapse,
  Divider,
  Grid,
  TextField,
  InputAdornment,
  Button,
} from '@mui/material';
import {
  Description,
  ExpandMore,
  ExpandLess,
  Download,
  CalendarMonth,
  Person,
  Search,
  FilterList,
} from '@mui/icons-material';
import { medicalRecordService } from '@/services/medicalRecordService';
import { useAuthStore } from '@/store/authStore';
import PageTitle from '@/components/common/PageTitle';
import { formatDateTime } from '@/utils/helpers';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const MedicalRecordRow = ({ record }) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);

  const handleDownloadPDF = () => {
    const doc = new jsPDF();

    // Hospital Header
    doc.setFontSize(18);
    doc.setTextColor(33, 150, 243);
    doc.text('HealthCare Plus Hospital', 105, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('123 Medical Center Drive, Healthcare City, HC 12345', 105, 22, { align: 'center' });
    doc.text('Phone: (555) 123-4567 | Email: info@healthcareplus.com', 105, 27, { align: 'center' });

    doc.setDrawColor(33, 150, 243);
    doc.setLineWidth(0.5);
    doc.line(20, 30, 190, 30);

    // Title
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('Medical Record', 105, 40, { align: 'center' });

    // Record Details
    doc.setFontSize(10);
    doc.text(`Record ID: ${record.record_id}`, 20, 50);
    doc.text(`Date: ${formatDateTime(record.record_date)}`, 20, 56);

    // Patient & Doctor Info
    doc.setFont(undefined, 'bold');
    doc.text('Patient Information', 20, 68);
    doc.setFont(undefined, 'normal');
    doc.text(`Name: ${record.patient?.name || 'N/A'}`, 20, 74);
    doc.text(`ID: ${record.patient?.patient_id || 'N/A'}`, 20, 80);

    doc.setFont(undefined, 'bold');
    doc.text('Doctor Information', 120, 68);
    doc.setFont(undefined, 'normal');
    doc.text(`Name: ${record.doctor?.name || 'N/A'}`, 120, 74);
    doc.text(`ID: ${record.doctor?.doctor_id || 'N/A'}`, 120, 80);

    let yPos = 95;

    // Medical Details
    if (record.chief_complaint) {
      doc.setFont(undefined, 'bold');
      doc.text('Chief Complaint:', 20, yPos);
      doc.setFont(undefined, 'normal');
      const complaint = doc.splitTextToSize(record.chief_complaint, 170);
      doc.text(complaint, 20, yPos + 5);
      yPos += complaint.length * 5 + 10;
    }

    if (record.assessment) {
      doc.setFont(undefined, 'bold');
      doc.text('Assessment:', 20, yPos);
      doc.setFont(undefined, 'normal');
      const assessment = doc.splitTextToSize(record.assessment, 170);
      doc.text(assessment, 20, yPos + 5);
      yPos += assessment.length * 5 + 10;
    }

    if (record.plan) {
      doc.setFont(undefined, 'bold');
      doc.text('Treatment Plan:', 20, yPos);
      doc.setFont(undefined, 'normal');
      const plan = doc.splitTextToSize(record.plan, 170);
      doc.text(plan, 20, yPos + 5);
      yPos += plan.length * 5 + 10;
    }

    // Vitals Table
    if (record.blood_pressure || record.heart_rate || record.temperature) {
      doc.setFont(undefined, 'bold');
      doc.text('Vital Signs:', 20, yPos);
      yPos += 7;

      const vitalsData = [];
      if (record.blood_pressure) vitalsData.push(['Blood Pressure', record.blood_pressure + ' mmHg']);
      if (record.heart_rate) vitalsData.push(['Heart Rate', record.heart_rate + ' bpm']);
      if (record.temperature) vitalsData.push(['Temperature', record.temperature + ' °F']);
      if (record.respiratory_rate) vitalsData.push(['Respiratory Rate', record.respiratory_rate + ' /min']);
      if (record.oxygen_saturation) vitalsData.push(['Oxygen Saturation', record.oxygen_saturation + ' %']);

      doc.autoTable({
        startY: yPos,
        head: [['Vital', 'Value']],
        body: vitalsData,
        theme: 'grid',
        headStyles: { fillColor: [33, 150, 243] },
        margin: { left: 20, right: 20 },
      });
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text('This is a computer-generated medical record.', 105, 280, { align: 'center' });
    doc.text('HealthCare Plus Hospital - Confidential Medical Document', 105, 285, { align: 'center' });

    doc.save(`medical_record_${record.record_id}.pdf`);
  };

  return (
    <>
      <TableRow
        sx={{
          '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) },
          cursor: 'pointer'
        }}
      >
        <TableCell onClick={() => setExpanded(!expanded)}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Description sx={{ color: 'primary.main' }} />
            <Typography variant="body2" fontWeight="600">
              {record.record_id}
            </Typography>
          </Box>
        </TableCell>
        <TableCell onClick={() => setExpanded(!expanded)}>
          <Typography variant="body2" sx={{
            maxWidth: 300,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}>
            {record.assessment || record.chief_complaint || 'Medical Record'}
          </Typography>
        </TableCell>
        <TableCell onClick={() => setExpanded(!expanded)}>
          <Typography variant="body2">
            {formatDateTime(record.record_date)}
          </Typography>
        </TableCell>
        <TableCell onClick={() => setExpanded(!expanded)}>
          <Typography variant="body2">
            {record.doctor?.name || 'Unknown'}
          </Typography>
        </TableCell>
        <TableCell onClick={() => setExpanded(!expanded)}>
          <Chip
            label="Final"
            size="small"
            color="success"
            sx={{ fontWeight: 600 }}
          />
        </TableCell>
        <TableCell align="right">
          <IconButton
            size="small"
            onClick={handleDownloadPDF}
            sx={{
              color: 'primary.main',
              '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) }
            }}
          >
            <Download />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Box sx={{ py: 3, px: 2, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  {record.chief_complaint && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" fontWeight="700" gutterBottom>
                        Chief Complaint
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {record.chief_complaint}
                      </Typography>
                    </Box>
                  )}

                  {record.present_illness && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" fontWeight="700" gutterBottom>
                        Present Illness
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {record.present_illness}
                      </Typography>
                    </Box>
                  )}

                  {record.physical_examination && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" fontWeight="700" gutterBottom>
                        Physical Examination
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {record.physical_examination}
                      </Typography>
                    </Box>
                  )}

                  {record.assessment && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" fontWeight="700" gutterBottom>
                        Assessment
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {record.assessment}
                      </Typography>
                    </Box>
                  )}

                  {record.plan && (
                    <Box>
                      <Typography variant="subtitle2" fontWeight="700" gutterBottom>
                        Treatment Plan
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {record.plan}
                      </Typography>
                    </Box>
                  )}
                </Grid>

                <Grid item xs={12} md={4}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                    <Typography variant="subtitle2" fontWeight="700" gutterBottom>
                      Vital Signs
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Blood Pressure</Typography>
                        <Typography variant="body2" fontWeight="600">{record.blood_pressure || '--/--'}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Heart Rate</Typography>
                        <Typography variant="body2" fontWeight="600">{record.heart_rate || '--'} bpm</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Temperature</Typography>
                        <Typography variant="body2" fontWeight="600">{record.temperature || '--'} °F</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Respiratory Rate</Typography>
                        <Typography variant="body2" fontWeight="600">{record.respiratory_rate || '--'} /min</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">O2 Saturation</Typography>
                        <Typography variant="body2" fontWeight="600">{record.oxygen_saturation || '--'} %</Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

const MedicalRecords = () => {
  const theme = useTheme();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      console.log('Fetching medical records...');
      const data = await medicalRecordService.getAllRecords();
      console.log('Medical records received:', data);
      console.log('Number of records:', data?.length || 0);
      setRecords(data);
    } catch (error) {
      console.error('Error fetching medical records:', error);
      console.error('Error details:', error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = records.filter(record =>
    record.assessment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.chief_complaint?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.doctor?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <PageTitle>
          Medical Records
        </PageTitle>
        <Typography variant="h6" color="text.secondary" fontWeight="normal">
          Access your complete medical history and reports.
        </Typography>
      </Box>

      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          placeholder="Search by diagnosis, complaint, or doctor..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search color="action" />
              </InputAdornment>
            ),
            sx: { borderRadius: 3, bgcolor: 'background.paper' }
          }}
        />
      </Box>

      {filteredRecords.length > 0 ? (
        <TableContainer component={Paper} elevation={0} sx={{
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'divider'
        }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                <TableCell><strong>Record ID</strong></TableCell>
                <TableCell><strong>Diagnosis/Complaint</strong></TableCell>
                <TableCell><strong>Date</strong></TableCell>
                <TableCell><strong>Doctor</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell align="right"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRecords.map((record) => (
                <MedicalRecordRow key={record.id} record={record} />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Paper
          elevation={0}
          sx={{
            p: 6,
            textAlign: 'center',
            borderRadius: 4,
            border: '1px dashed',
            borderColor: 'divider',
            bgcolor: 'background.default'
          }}
        >
          <Description sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No medical records found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Records from your visits will appear here.
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default MedicalRecords;