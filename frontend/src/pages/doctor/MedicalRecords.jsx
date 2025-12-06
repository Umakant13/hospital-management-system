import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  MenuItem,
  Tooltip,
  CircularProgress,
  Avatar,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Add,
  Edit,
  Visibility,
  Delete,
  Assignment,
  Close,
  Download,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { medicalRecordService } from '@/services/medicalRecordService';
import { formatDateTime } from '@/utils/helpers';
import PageTitle from '@/components/common/PageTitle';
import { useAuthStore } from '@/store/authStore';
import { doctorService } from '@/services/doctorService';
import aiService from '@/services/aiService';
import FileUpload from '@/components/common/FileUpload';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const DoctorMedicalRecords = () => {
  const { user } = useAuthStore();
  const [records, setRecords] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const { register, handleSubmit, reset, setValue, watch, control, formState: { errors } } = useForm();



  useEffect(() => {
    console.log('DoctorMedicalRecords: User changed', user);
    if (user?.doctor_internal_id) {
      fetchRecords();
      fetchPatients();
    } else {
      console.warn('DoctorMedicalRecords: No doctor_internal_id available');
    }
  }, [user]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const data = await medicalRecordService.getAllRecords();
      setRecords(data);
    } catch (error) {
      console.error('Error fetching records:', error);
      console.error('Error details:', error.response?.data || error.message);
    } finally {
      setLoading(false);
      console.log('DoctorMedicalRecords: Fetch complete');
    }
  };

  const fetchPatients = async () => {
    try {
      const data = await doctorService.getDoctorPatients(user.doctor_id);
      console.log('Fetched patients:', data);
      // Log first patient to see structure
      if (data && data.length > 0) {
        console.log('First patient structure:', data[0]);
      }
      setPatients(data);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };



  const handleOpenDialog = (record = null) => {
    setSelectedRecord(record);
    setTabValue(0);
    setUploadedFiles([]);
    if (record) {
      const formattedDate = record.record_date ? new Date(record.record_date).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16);

      reset({
        patient_id: record.patient?.id || record.patient_id || '',
        record_date: formattedDate,
        chief_complaint: record.chief_complaint || '',
        present_illness: record.present_illness || '',
        past_medical_history: record.past_medical_history || '',
        physical_examination: record.physical_examination || '',
        assessment: record.assessment || '',
        plan: record.plan || '',
        blood_pressure: record.blood_pressure || '',
        heart_rate: record.heart_rate || '',
        temperature: record.temperature || '',
        respiratory_rate: record.respiratory_rate || '',
        oxygen_saturation: record.oxygen_saturation || '',
      });


    } else {
      reset({
        record_date: new Date().toISOString().slice(0, 16),
        patient_id: '', // Ensure default value
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedRecord(null);
    setUploadedFiles([]);
    reset({});
  };

  const handleOpenViewDialog = (record) => {
    setSelectedRecord(record);
    setOpenViewDialog(true);
  };

  const handleCloseViewDialog = () => {
    setOpenViewDialog(false);
    setSelectedRecord(null);
  };

  const handleFileUploadComplete = (files) => {
    setUploadedFiles((prev) => [...prev, ...files]);
  };

  const handleFillWithAI = async () => {
    setAiLoading(true);
    try {
      const fieldDescriptions = {
        chief_complaint: 'A brief description of the patient\'s main complaint or reason for visit',
        present_illness: 'Detailed description of the current illness or symptoms',
        past_medical_history: 'Patient\'s relevant past medical history',
        physical_examination: 'Physical examination findings',
        assessment: 'Medical assessment or diagnosis',
        plan: 'Treatment plan and recommendations',
        blood_pressure: 'Blood pressure reading (e.g., 120/80)',
        heart_rate: 'Heart rate in bpm (e.g., 72)',
        temperature: 'Body temperature in Fahrenheit (e.g., 98.6)',
        respiratory_rate: 'Respiratory rate per minute (e.g., 16)',
        oxygen_saturation: 'Oxygen saturation percentage (e.g., 98)',
      };

      const generatedData = await aiService.generateFormData(fieldDescriptions);

      // Fill form fields with AI-generated data
      Object.keys(generatedData).forEach(key => {
        if (generatedData[key]) {
          setValue(key, generatedData[key]);
        }
      });
    } catch (error) {
      console.error('Error generating AI data:', error);
      alert('Failed to generate data with AI. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveRecord = async (data) => {
    try {
      const recordData = {
        ...data,
        patient_id: data.patient_id ? parseInt(data.patient_id) : null,
        doctor_id: user.doctor_internal_id,
        record_date: new Date(data.record_date).toISOString(),
        attachments: uploadedFiles.map(f => f.file_path),
      };

      // Validate patient_id
      if (!recordData.patient_id) {
        alert('Please select a patient');
        return;
      }

      if (selectedRecord) {
        await medicalRecordService.updateRecord(selectedRecord.record_id, recordData);
      } else {
        await medicalRecordService.createRecord(recordData);
      }
      handleCloseDialog();
      fetchRecords();
    } catch (error) {
      console.error('Error saving record:', error);
      alert(`Failed to save: ${error.response?.data?.detail || error.message}`);
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
    doc.text(`Date: ${new Date(record.created_at || record.record_date).toLocaleDateString()}`, 140, 40);

    // Patient Info
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

    // Clinical Information
    yPos += 10;
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
    if (record.blood_pressure || record.heart_rate || record.temperature || record.oxygen_saturation) {
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(25, 118, 210);
      doc.text('Vital Signs', 20, yPos);
      doc.setTextColor(0, 0, 0);
      yPos += 5;

      const vitalData = [[
        record.blood_pressure || 'N/A',
        `${record.heart_rate || 'N/A'} bpm`,
        `${record.temperature || 'N/A'} °F`,
        `${record.oxygen_saturation || 'N/A'} %`
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

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
          Add Record
        </Button>
      </Box>

      <Paper elevation={2}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Record ID</TableCell>
                <TableCell>Patient</TableCell>
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
                  <TableCell>{formatDateTime(record.created_at || record.record_date || record.date)}</TableCell>
                  <TableCell>{record.chief_complaint || 'N/A'}</TableCell>
                  <TableCell>{record.assessment || 'N/A'}</TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    <Tooltip title="View Details">
                      <IconButton size="small" color="info" onClick={() => handleOpenViewDialog(record)}>
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
              {records.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Assignment sx={{ fontSize: 60, color: 'text.secondary', mb: 1 }} />
                    <Typography color="text.secondary">No medical records found</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{selectedRecord ? 'Edit Medical Record' : 'Add New Medical Record'}</span>
            {!selectedRecord && (
              <Button
                variant="outlined"
                size="small"
                onClick={handleFillWithAI}
                disabled={aiLoading}
                startIcon={aiLoading ? <CircularProgress size={16} /> : null}
              >
                {aiLoading ? 'Generating...' : 'Fill with AI'}
              </Button>
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 2, mt: 1 }}>
            <Tab label="Basic Information" />
            <Tab label="Vital Signs" />
            <Tab label="Attachments" />
          </Tabs>

          {tabValue === 0 && (
            <Box component="form" sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="patient_id"
                    control={control}
                    rules={{ required: 'Patient is required' }}
                    defaultValue=""
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        select
                        label="Patient"
                        error={!!errors.patient_id}
                        helperText={errors.patient_id?.message}
                        InputLabelProps={{ shrink: true }}
                      >
                        {patients.map((patient) => {
                          // Use the correct ID field - check both patient.id and patient.patient_id
                          const patientId = patient.id || patient.patient_id;
                          const patientDisplayId = patient.patient_id || `ID-${patient.id}`;
                          const patientName = patient.name || patient.user?.full_name || 'Unknown';

                          return (
                            <MenuItem key={patientId} value={patient.id}>
                              {patientName} ({patientDisplayId})
                            </MenuItem>
                          );
                        })}
                      </TextField>
                    )}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
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

      {/* View Dialog - Enhanced UI */}
      <Dialog open={openViewDialog} onClose={handleCloseViewDialog} maxWidth="md" fullWidth>
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
          <IconButton onClick={handleCloseViewDialog}>
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
                      {formatDateTime(selectedRecord.created_at || selectedRecord.record_date || selectedRecord.date)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ display: 'block', mb: 0.5 }}>
                      PATIENT
                    </Typography>
                    <Typography variant="body2" fontWeight="500">
                      {selectedRecord.patient?.name || 'N/A'}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>

              <Grid container spacing={4}>
                {/* Clinical Information */}
                <Grid item xs={12}>
                  <Typography variant="subtitle2" fontWeight="700" gutterBottom sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>
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
                <Grid item xs={12}>
                  <Typography variant="subtitle2" fontWeight="700" gutterBottom sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1, mt: 2 }}>
                    Vital Signs
                  </Typography>
                  <Paper elevation={0} sx={{ p: 3, bgcolor: '#e3f2fd', borderRadius: 3, border: '1px solid', borderColor: '#90caf9' }}>
                    <Grid container spacing={3}>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="text.secondary" fontWeight="600">BP</Typography>
                        <Typography variant="h6" fontWeight="700" color="primary.main">
                          {selectedRecord.blood_pressure || 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="text.secondary" fontWeight="600">HEART RATE</Typography>
                        <Typography variant="h6" fontWeight="700" color="error.main">
                          {selectedRecord.heart_rate ? `${selectedRecord.heart_rate} bpm` : 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="text.secondary" fontWeight="600">TEMP</Typography>
                        <Typography variant="h6" fontWeight="700" color="warning.main">
                          {selectedRecord.temperature ? `${selectedRecord.temperature}°F` : 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="text.secondary" fontWeight="600">O2 SAT</Typography>
                        <Typography variant="h6" fontWeight="700" color="success.main">
                          {selectedRecord.oxygen_saturation ? `${selectedRecord.oxygen_saturation}%` : 'N/A'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={handleCloseViewDialog} variant="outlined" sx={{ borderRadius: 2 }}>
            Close
          </Button>
          <Button
            variant="contained"
            startIcon={<Download />}
            sx={{ borderRadius: 2 }}
            onClick={() => handleDownloadPDF(selectedRecord)}
          >
            Download PDF
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DoctorMedicalRecords;
