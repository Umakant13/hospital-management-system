import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
  MenuItem,
  Tooltip,
  Tabs,
  Tab,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  InputAdornment,
} from '@mui/material';
import {
  Add,
  Visibility,
  Edit,
  Delete,
  Download,
  AttachFile,
  Close,
  Search,
} from '@mui/icons-material';
import { medicalRecordService } from '@/services/medicalRecordService';
import { patientService } from '@/services/patientService';
import { doctorService } from '@/services/doctorService';
import { useForm } from 'react-hook-form';
import PageTitle from '@/components/common/PageTitle';
import { formatDateTime } from '@/utils/helpers';
import FileUpload from '@/components/common/FileUpload';
import AIFillButton from '@/components/common/AIFillButton';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const MedicalRecords = () => {
  const [records, setRecords] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [openDialog, setOpenDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    fetchRecords();
    fetchPatients();
    fetchDoctors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, searchQuery, doctorFilter, dateFilter]);

  const fetchRecords = async () => {
    try {
      const params = {
        skip: page * rowsPerPage,
        limit: rowsPerPage,
        search: searchQuery,
      };

      if (doctorFilter) params.doctor_id = doctorFilter;
      if (dateFilter !== 'all') params.date_range = dateFilter;

      const data = await medicalRecordService.getAllRecords(params);
      setRecords(data);
    } catch (error) {
      console.error('Error fetching records:', error);
    }
  };

  const fetchPatients = async () => {
    try {
      const data = await patientService.getAllPatients();
      setPatients(data);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const fetchDoctors = async () => {
    try {
      const data = await doctorService.getAllDoctors();
      setDoctors(data);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const handleOpenDialog = (record = null) => {
    setSelectedRecord(record);
    setTabValue(0);
    setUploadedFiles([]);
    if (record) {
      reset(record);
    } else {
      reset({});
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedRecord(null);
    setUploadedFiles([]);
    reset({});
  };

  const handleViewRecord = (record) => {
    setSelectedRecord(record);
    setOpenViewDialog(true);
  };

  const handleSaveRecord = async (data) => {
    try {
      console.log('Saving medical record with data:', data);

      // Add file paths if files were uploaded
      const recordData = {
        ...data,
        attachments: uploadedFiles.map(f => f.file_path), // Send as array, not JSON string
      };

      console.log('Record data to submit:', recordData);

      if (selectedRecord) {
        await medicalRecordService.updateRecord(selectedRecord.record_id, recordData);
      } else {
        await medicalRecordService.createRecord(recordData);
      }
      handleCloseDialog();
      fetchRecords();
    } catch (error) {
      console.error('Error saving record:', error);
      console.error('Error response:', error.response?.data);
      alert(`Failed to save medical record: ${error.response?.data?.detail || error.message}`);
    }
  };

  const handleDelete = async (recordId) => {
    if (window.confirm('Are you sure you want to delete this medical record?')) {
      try {
        await medicalRecordService.deleteRecord(recordId);
        fetchRecords();
      } catch (error) {
        console.error('Error deleting record:', error);
      }
    }
  };

  const handleFileUploadComplete = (files) => {
    setUploadedFiles((prev) => [...prev, ...files]);
  };

  const handleDownloadPDF = (record) => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(18);
    doc.setTextColor(25, 118, 210);
    doc.text('Medical Record', 105, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Hospital Management System', 105, 28, { align: 'center' });

    // Line separator
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 32, 190, 32);

    // Record Info
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text(`Record ID: ${record.record_id}`, 20, 40);
    doc.text(`Date: ${new Date(record.record_date).toLocaleDateString()}`, 140, 40);

    // Patient & Doctor Info
    let yPos = 50;
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Patient Information', 20, yPos);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    yPos += 5;
    doc.text(`Name: ${record.patient?.name || 'N/A'}`, 20, yPos);
    yPos += 4;
    doc.text(`Patient ID: ${record.patient?.patient_id || 'N/A'}`, 20, yPos);

    yPos = 50;
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Doctor Information', 120, yPos);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    yPos += 5;
    doc.text(`Name: ${record.doctor?.name || 'N/A'}`, 120, yPos);
    yPos += 4;
    doc.text(`Doctor ID: ${record.doctor?.doctor_id || 'N/A'}`, 120, yPos);

    // Clinical Information
    yPos = 70;
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(25, 118, 210);
    doc.text('Clinical Information', 20, yPos);
    doc.setTextColor(0, 0, 0);
    yPos += 8;

    if (record.chief_complaint) {
      doc.setFont(undefined, 'bold');
      doc.setFontSize(10);
      doc.text('Chief Complaint:', 20, yPos);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(9);
      yPos += 4;
      const splitComplaint = doc.splitTextToSize(record.chief_complaint, 170);
      doc.text(splitComplaint, 20, yPos);
      yPos += (splitComplaint.length * 4) + 5;
    }

    if (record.assessment) {
      doc.setFont(undefined, 'bold');
      doc.setFontSize(10);
      doc.text('Assessment:', 20, yPos);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(9);
      yPos += 4;
      const splitAssessment = doc.splitTextToSize(record.assessment, 170);
      doc.text(splitAssessment, 20, yPos);
      yPos += (splitAssessment.length * 4) + 5;
    }

    if (record.plan) {
      doc.setFont(undefined, 'bold');
      doc.setFontSize(10);
      doc.text('Plan:', 20, yPos);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(9);
      yPos += 4;
      const splitPlan = doc.splitTextToSize(record.plan, 170);
      doc.text(splitPlan, 20, yPos);
      yPos += (splitPlan.length * 4) + 8;
    }

    // Vital Signs - Horizontal Table
    if (record.vital_signs) {
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(25, 118, 210);
      doc.text('Vital Signs', 20, yPos);
      doc.setTextColor(0, 0, 0);
      yPos += 5;

      // Create horizontal table
      const vitalData = [[
        record.vital_signs.blood_pressure || 'N/A',
        `${record.vital_signs.heart_rate || 'N/A'} bpm`,
        `${record.vital_signs.temperature || 'N/A'} °F`,
        `${record.vital_signs.oxygen_saturation || 'N/A'} %`
      ]];

      doc.autoTable({
        startY: yPos,
        head: [['Blood Pressure', 'Heart Rate', 'Temperature', 'O2 Saturation']],
        body: vitalData,
        theme: 'grid',
        headStyles: {
          fillColor: [25, 118, 210],
          fontSize: 9,
          fontStyle: 'bold',
          halign: 'center'
        },
        styles: {
          fontSize: 9,
          cellPadding: 3,
          halign: 'center'
        },
        columnStyles: {
          0: { cellWidth: 42.5 },
          1: { cellWidth: 42.5 },
          2: { cellWidth: 42.5 },
          3: { cellWidth: 42.5 }
        }
      });
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text('This is a computer-generated medical record.', 105, 285, { align: 'center' });

    doc.save(`medical_record_${record.record_id}.pdf`);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <PageTitle>
          Medical Records
        </PageTitle>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Add Medical Record
        </Button>
      </Box>

      <Paper elevation={2} sx={{ p: 3 }}>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search by patient name or record ID..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(0);
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Doctor</InputLabel>
              <Select
                value={doctorFilter}
                label="Doctor"
                onChange={(e) => {
                  setDoctorFilter(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="">All Doctors</MenuItem>
                {doctors.map((doctor) => (
                  <MenuItem key={doctor.id} value={doctor.id}>
                    {doctor.user?.full_name || doctor.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Date Range</InputLabel>
              <Select
                value={dateFilter}
                label="Date Range"
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="all">All Time</MenuItem>
                <MenuItem value="today">Today</MenuItem>
                <MenuItem value="week">This Week</MenuItem>
                <MenuItem value="month">This Month</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Record ID</TableCell>
                <TableCell>Patient</TableCell>
                <TableCell>Doctor</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Chief Complaint</TableCell>
                <TableCell>Assessment</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id} hover>
                  <TableCell>
                    <Chip label={record.record_id} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>{record.patient?.name || 'N/A'}</TableCell>
                  <TableCell>{record.doctor?.name || 'N/A'}</TableCell>
                  <TableCell>{formatDateTime(record.record_date)}</TableCell>
                  <TableCell>{record.chief_complaint || 'N/A'}</TableCell>
                  <TableCell>{record.assessment || 'N/A'}</TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    <Tooltip title="View">
                      <IconButton size="small" color="info" onClick={() => handleViewRecord(record)}>
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleOpenDialog(record)}
                      >
                        <Edit />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Download PDF">
                      <IconButton
                        size="small"
                        color="success"
                        onClick={() => handleDownloadPDF(record)}
                      >
                        <Download />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(record.record_id)}
                      >
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={100}
          page={page}
          onPageChange={(event, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedRecord ? 'Edit Medical Record' : 'Add New Medical Record'}
          {!selectedRecord && (
            <Box sx={{ ml: 2, display: 'inline-block' }}>
              <AIFillButton
                fieldDescriptions={{
                  chief_complaint: "Patient's primary complaint (e.g., Chest pain)",
                  present_illness: "Details of present illness",
                  past_medical_history: "Past medical history",
                  physical_examination: "Physical exam findings",
                  assessment: "Medical assessment/diagnosis",
                  plan: "Treatment plan",
                  blood_pressure: "BP reading (e.g., 120/80)",
                  heart_rate: "Heart rate in bpm (number)",
                  temperature: "Temperature in F (number)",
                  respiratory_rate: "Respiratory rate (number)",
                  oxygen_saturation: "O2 saturation % (number)"
                }}
                onFill={(data) => {
                  Object.keys(data).forEach(key => {
                    // Handle nested vital signs if needed, or flat structure
                    // The form seems to use flat structure for vitals in tab 1
                    reset({ ...data });
                  });
                }}
              />
            </Box>
          )}
        </DialogTitle>
        <DialogContent>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 2 }}>
            <Tab label="Basic Information" />
            <Tab label="Vital Signs" />
            <Tab label="Attachments" />
          </Tabs>

          {tabValue === 0 && (
            <Box component="form" sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="Patient"
                    {...register('patient_id', { required: 'Patient is required' })}
                    error={!!errors.patient_id}
                    helperText={errors.patient_id?.message}
                  >
                    {patients.map((patient) => (
                      <MenuItem key={patient.id} value={patient.id}>
                        {patient.user?.full_name} ({patient.patient_id})
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="Doctor"
                    {...register('doctor_id')}
                  >
                    <MenuItem value="">None</MenuItem>
                    {doctors.map((doctor) => (
                      <MenuItem key={doctor.id} value={doctor.id}>
                        {doctor.user?.full_name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="datetime-local"
                    label="Record Date"
                    {...register('record_date', { required: 'Date is required' })}
                    error={!!errors.record_date}
                    helperText={errors.record_date?.message}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Chief Complaint"
                    InputLabelProps={{ shrink: true }}
                    {...register('chief_complaint')}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Present Illness"
                    InputLabelProps={{ shrink: true }}
                    {...register('present_illness')}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Past Medical History"
                    InputLabelProps={{ shrink: true }}
                    {...register('past_medical_history')}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Physical Examination"
                    InputLabelProps={{ shrink: true }}
                    {...register('physical_examination')}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Assessment"
                    InputLabelProps={{ shrink: true }}
                    {...register('assessment')}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Plan"
                    InputLabelProps={{ shrink: true }}
                    {...register('plan')}
                  />
                </Grid>
              </Grid>
            </Box>
          )}

          {tabValue === 1 && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Blood Pressure"
                    InputLabelProps={{ shrink: true }}
                    {...register('blood_pressure')}
                    placeholder="120/80"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Heart Rate (bpm)"
                    InputLabelProps={{ shrink: true }}
                    {...register('heart_rate')}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Temperature (°F)"
                    InputLabelProps={{ shrink: true }}
                    {...register('temperature')}
                    inputProps={{ step: 0.1 }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Respiratory Rate"
                    InputLabelProps={{ shrink: true }}
                    {...register('respiratory_rate')}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Oxygen Saturation (%)"
                    InputLabelProps={{ shrink: true }}
                    {...register('oxygen_saturation')}
                  />
                </Grid>
              </Grid>
            </Box>
          )}

          {tabValue === 2 && (
            <Box sx={{ mt: 2 }}>
              <FileUpload
                category="medical_records"
                onUploadComplete={handleFileUploadComplete}
                maxFiles={10}
              />
              {uploadedFiles.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Uploaded Files: {uploadedFiles.length}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit(handleSaveRecord)}
          >
            {selectedRecord ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar sx={{ bgcolor: 'primary.light', mr: 2 }}>
              <Visibility />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight="700">
                Medical Record Details
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ID: {selectedRecord?.record_id}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={() => setOpenViewDialog(false)}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 4 }}>
          {selectedRecord && (
            <Box>
              {/* Header Info */}
              <Paper elevation={0} sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 3, mb: 4, border: '1px solid', borderColor: 'divider' }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ display: 'block', mb: 0.5 }}>
                      RECORD DATE
                    </Typography>
                    <Typography variant="body2" fontWeight="500">
                      {formatDateTime(selectedRecord.record_date)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ display: 'block', mb: 0.5 }}>
                      CREATED BY
                    </Typography>
                    <Typography variant="body2" fontWeight="500">
                      {selectedRecord.doctor?.name || 'N/A'}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>

              <Grid container spacing={4}>
                {/* Patient Info */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" fontWeight="700" gutterBottom sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>
                    Patient Information
                  </Typography>
                  <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ width: 40, height: 40, mr: 2, bgcolor: 'primary.main' }}>
                        {selectedRecord.patient?.name?.charAt(0) || 'P'}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" fontWeight="600">
                          {selectedRecord.patient?.name || 'N/A'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Patient ID: {selectedRecord.patient_id || selectedRecord.patient?.patient_id}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>

                {/* Doctor Info */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" fontWeight="700" gutterBottom sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>
                    Doctor Information
                  </Typography>
                  <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ width: 40, height: 40, mr: 2, bgcolor: 'secondary.main' }}>
                        {selectedRecord.doctor?.name?.charAt(0) || 'D'}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" fontWeight="600">
                          {selectedRecord.doctor?.name || 'N/A'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Doctor ID: {selectedRecord.doctor_id || selectedRecord.doctor?.doctor_id}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>

                {/* Clinical Information */}
                <Grid item xs={12}>
                  <Typography variant="subtitle2" fontWeight="700" gutterBottom sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1, mt: 2 }}>
                    Clinical Information
                  </Typography>
                  <Paper elevation={0} sx={{ p: 3, bgcolor: '#f8fafc', borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                    <Grid container spacing={3}>
                      <Grid item xs={12}>
                        <Typography variant="caption" color="text.secondary" fontWeight="600" gutterBottom>CHIEF COMPLAINT</Typography>
                        <Typography variant="body1" sx={{ p: 2, bgcolor: 'white', borderRadius: 2, border: '1px solid', borderColor: 'divider', mb: 2 }}>
                          {selectedRecord.chief_complaint || 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="caption" color="text.secondary" fontWeight="600" gutterBottom>ASSESSMENT</Typography>
                        <Typography variant="body1" sx={{ p: 2, bgcolor: 'white', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                          {selectedRecord.assessment || 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="caption" color="text.secondary" fontWeight="600" gutterBottom>PLAN</Typography>
                        <Typography variant="body1" sx={{ p: 2, bgcolor: 'white', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                          {selectedRecord.plan || 'N/A'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>

                {/* Vital Signs */}
                {selectedRecord.vital_signs && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" fontWeight="700" gutterBottom sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1, mt: 2 }}>
                      Vital Signs
                    </Typography>
                    <Paper elevation={0} sx={{ p: 3, bgcolor: '#e3f2fd', borderRadius: 3, border: '1px solid', borderColor: '#90caf9' }}>
                      <Grid container spacing={3}>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="caption" color="text.secondary" fontWeight="600">BP</Typography>
                          <Typography variant="h6" fontWeight="700" color="primary.main">
                            {selectedRecord.vital_signs.blood_pressure || 'N/A'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="caption" color="text.secondary" fontWeight="600">HEART RATE</Typography>
                          <Typography variant="h6" fontWeight="700" color="error.main">
                            {selectedRecord.vital_signs.heart_rate || 'N/A'} <Typography component="span" variant="caption">bpm</Typography>
                          </Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="caption" color="text.secondary" fontWeight="600">TEMP</Typography>
                          <Typography variant="h6" fontWeight="700" color="warning.main">
                            {selectedRecord.vital_signs.temperature || 'N/A'} <Typography component="span" variant="caption">°F</Typography>
                          </Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="caption" color="text.secondary" fontWeight="600">O2 SAT</Typography>
                          <Typography variant="h6" fontWeight="700" color="success.main">
                            {selectedRecord.vital_signs.oxygen_saturation || 'N/A'} <Typography component="span" variant="caption">%</Typography>
                          </Typography>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={() => setOpenViewDialog(false)} variant="outlined" sx={{ borderRadius: 2 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box >
  );
};

export default MedicalRecords;