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
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Biotech,
  Visibility,
  Close,
  CheckCircle,
  Download,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { labTestService } from '@/services/labTestService';
import { formatDateTime, getStatusColor } from '@/utils/helpers';
import PageTitle from '@/components/common/PageTitle';
import { useAuthStore } from '@/store/authStore';
import { doctorService } from '@/services/doctorService';
import aiService from '@/services/aiService';
import FileUpload from '@/components/common/FileUpload';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const DoctorLabTests = () => {
  const { user } = useAuthStore();
  const [labTests, setLabTests] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openCompleteDialog, setOpenCompleteDialog] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [uploadedReports, setUploadedReports] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    control: controlEdit,
    formState: { errors: errorsEdit },
    watch: watchEdit,
    setValue: setValueEdit,
  } = useForm();

  const {
    register: registerComplete,
    handleSubmit: handleSubmitComplete,
    reset: resetComplete,
    formState: { errors: errorsComplete }
  } = useForm();



  useEffect(() => {
    console.log('DoctorLabTests: User changed', user);
    if (user?.doctor_internal_id) {
      fetchLabTests();
      fetchPatients();
    } else {
      console.warn('DoctorLabTests: No doctor_internal_id available');
    }
  }, [user]);

  const fetchLabTests = async () => {
    try {
      setLoading(true);
      const data = await labTestService.getAllLabTests();
      // Filter lab tests for this doctor
      const filteredData = data.filter(test => test.doctor_id === user.doctor_internal_id);
      setLabTests(filteredData);
    } catch (error) {
      console.error('Error fetching lab tests:', error);
      console.error('Error details:', error.response?.data || error.message);
    } finally {
      setLoading(false);
      console.log('DoctorLabTests: Fetch complete');
    }
  };

  const fetchPatients = async () => {
    try {
      const data = await doctorService.getDoctorPatients(user.doctor_id);
      setPatients(data);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };



  const handleOpenDialog = (test = null) => {
    setSelectedTest(test);
    setUploadedReports([]);
    if (test) {
      const formattedDate = test.ordered_date
        ? new Date(test.ordered_date).toISOString().slice(0, 16)
        : new Date().toISOString().slice(0, 16);

      resetEdit({
        patient_id: test.patient?.id || test.patient_id || '',
        test_name: test.test_name || '',
        test_type: test.test_type || '',
        ordered_date: formattedDate,
        status: test.status || 'ordered',
        notes: test.notes || ''
      });

      // Set value explicitly for select field
      setTimeout(() => {
        setValueEdit('patient_id', test.patient_id || test.patient?.id);
      }, 0);
    } else {
      resetEdit({
        status: 'ordered',
        ordered_date: new Date().toISOString().slice(0, 16),
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedTest(null);
    setUploadedReports([]);
    resetEdit({});
  };

  const handleOpenViewDialog = (test) => {
    setSelectedTest(test);
    setOpenViewDialog(true);
  };

  const handleCloseViewDialog = () => {
    setOpenViewDialog(false);
    setSelectedTest(null);
  };

  const handleCompleteTest = (test) => {
    setSelectedTest(test);
    setUploadedReports([]);
    resetComplete({
      status: 'completed',
      collection_date: '',
      result_date: '',
      results: '',
      normal_range: '',
      unit: '',
      notes: test.notes || '',
    });
    setOpenCompleteDialog(true);
  };

  const handleReportUploadComplete = (files) => {
    setUploadedReports(files);
  };

  const handleFillWithAI = async () => {
    setAiLoading(true);
    try {
      const fieldDescriptions = {
        test_name: 'Name of the lab test (e.g., Complete Blood Count, Lipid Panel)',
        test_type: 'Type or category of the test (e.g., Blood Test, Urine Test)',
        notes: 'Additional notes or instructions for the lab test',
      };

      const generatedData = await aiService.generateFormData(fieldDescriptions);

      // Fill form fields with AI-generated data
      Object.keys(generatedData).forEach(key => {
        if (generatedData[key]) {
          setValueEdit(key, generatedData[key]);
        }
      });
    } catch (error) {
      console.error('Error generating AI data:', error);
      alert('Failed to generate data with AI. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveTest = async (data) => {
    try {
      const testData = {
        ...data,
        patient_id: data.patient_id ? parseInt(data.patient_id) : null,
        doctor_id: user.doctor_internal_id,
        ordered_date: new Date(data.ordered_date).toISOString(),
        report_file: uploadedReports.length > 0 ? uploadedReports[0].file_path : null,
      };

      // Validate patient_id
      if (!testData.patient_id) {
        alert('Please select a patient');
        return;
      }

      if (selectedTest) {
        await labTestService.updateLabTest(selectedTest.test_id, testData);
      } else {
        await labTestService.createLabTest(testData);
      }
      handleCloseDialog();
      fetchLabTests();
    } catch (error) {
      console.error('Error saving lab test:', error);
      alert(`Failed to save: ${error.response?.data?.detail || error.message}`);
    }
  };

  const handleSaveComplete = async (data) => {
    try {
      const updateData = {
        ...data,
        status: 'completed',
        report_file: uploadedReports.length > 0 ? uploadedReports[0].file_path : null,
      };

      await labTestService.updateLabTest(selectedTest.test_id, updateData);
      setOpenCompleteDialog(false);
      setUploadedReports([]);
      fetchLabTests();
    } catch (error) {
      console.error('Error completing test:', error);
      alert('Failed to complete lab test');
    }
  };

  const handleDelete = async (testId) => {
    if (window.confirm('Are you sure you want to delete this lab test?')) {
      try {
        await labTestService.deleteLabTest(testId);
        fetchLabTests();
      } catch (error) {
        console.error('Error deleting lab test:', error);
      }
    }
  };

  const handleDownloadPDF = (test) => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(18);
    doc.setTextColor(25, 118, 210);
    doc.text('Lab Test Report', 105, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Hospital Management System', 105, 28, { align: 'center' });

    // Line separator
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 32, 190, 32);

    // Test ID and Status
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text(`Test ID: ${test.test_id}`, 20, 40);
    doc.text(`Status: ${test.status.replace('_', ' ').toUpperCase()}`, 140, 40);

    // Patient Information
    let yPos = 50;
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Patient Information', 20, yPos);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    yPos += 5;
    doc.text(`Name: ${test.patient?.name || 'N/A'}`, 20, yPos);
    yPos += 4;
    doc.text(`Patient ID: ${test.patient?.patient_id || 'N/A'}`, 20, yPos);

    // Test Details
    yPos += 8;
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Test Details', 20, yPos);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    yPos += 5;
    doc.text(`Test Name: ${test.test_name}`, 20, yPos);
    yPos += 4;
    doc.text(`Test Type: ${test.test_type || 'N/A'}`, 20, yPos);
    yPos += 4;
    doc.text(`Ordered Date: ${new Date(test.ordered_date).toLocaleDateString()}`, 20, yPos);
    yPos += 4;
    doc.text(`Cost: Rs. ${test.cost || 0}`, 20, yPos);
    yPos += 8; // Add spacing after cost

    // Results (if completed)
    if (test.status === 'completed' || test.results) {
      yPos += 2; // Extra spacing before results section
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(25, 118, 210);
      doc.text('Test Results', 20, yPos);
      doc.setTextColor(0, 0, 0);
      yPos += 5;

      const cleanResults = (test.results || 'Pending')
        .replace(/μ/g, 'u')
        .replace(/₹/g, 'Rs.');

      const resultsData = [
        ['Results', cleanResults],
        ['Normal Range', (test.normal_range || 'N/A').replace(/μ/g, 'u')],
        ['Unit', (test.unit || 'N/A').replace(/μ/g, 'u')],
        ['Result Date', test.result_date ? new Date(test.result_date).toLocaleDateString() : 'N/A']
      ];

      doc.autoTable({
        startY: yPos,
        head: [['Parameter', 'Value']],
        body: resultsData,
        theme: 'striped',
        headStyles: {
          fillColor: [25, 118, 210],
          fontSize: 9,
          fontStyle: 'bold'
        },
        styles: {
          fontSize: 9,
          cellPadding: 3
        },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 50 },
          1: { cellWidth: 130 }
        }
      });

      yPos = doc.lastAutoTable.finalY + 10;
    }

    // Notes
    if (test.notes) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('Notes', 20, yPos);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(9);
      yPos += 5;
      const cleanNotes = test.notes.replace(/μ/g, 'u').replace(/₹/g, 'Rs.');
      const splitNotes = doc.splitTextToSize(cleanNotes, 170);
      doc.text(splitNotes, 20, yPos);
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text('This is a computer-generated report.', 105, 285, { align: 'center' });

    doc.save(`lab_test_report_${test.test_id}.pdf`);
  };

  const getStatusColor = (status) => {
    const colors = {
      ordered: 'info',
      sample_collected: 'warning',
      in_progress: 'primary',
      completed: 'success',
      cancelled: 'error',
      pending: 'warning',
    };
    return colors[status] || 'default';
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
          Lab Tests
        </PageTitle>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Order Lab Test
        </Button>
      </Box>

      <Paper elevation={2}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Test ID</TableCell>
                <TableCell>Patient</TableCell>
                <TableCell>Test Name</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {labTests.map((test) => (
                <TableRow key={test.id} hover>
                  <TableCell>
                    <Chip label={test.test_id} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>{test.patient?.name || 'N/A'}</TableCell>
                  <TableCell>{test.test_name}</TableCell>
                  <TableCell>{formatDateTime(test.ordered_date)}</TableCell>
                  <TableCell>
                    <Chip
                      label={test.status.replace('_', ' ')}
                      size="small"
                      color={getStatusColor(test.status)}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="View Details">
                      <IconButton size="small" color="info" onClick={() => handleOpenViewDialog(test)}>
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                    {test.status !== 'completed' && (
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleOpenDialog(test)}
                        >
                          <Edit />
                        </IconButton>
                      </Tooltip>
                    )}
                    {test.status !== 'completed' && test.status !== 'cancelled' && (
                      <Tooltip title="Complete">
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => handleCompleteTest(test)}
                        >
                          <CheckCircle />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(test.test_id)}
                      >
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {labTests.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Biotech sx={{ fontSize: 60, color: 'text.secondary', mb: 1 }} />
                    <Typography color="text.secondary">No lab tests found</Typography>
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
            <span>{selectedTest ? 'Edit Lab Test' : 'Order New Lab Test'}</span>
            {!selectedTest && (
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
        <form onSubmit={handleSubmitEdit(handleSaveTest)}>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="patient_id"
                  control={controlEdit}
                  rules={{ required: 'Patient is required' }}
                  defaultValue=""
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      select
                      label="Patient"
                      error={!!errorsEdit.patient_id}
                      helperText={errorsEdit.patient_id?.message}
                      InputLabelProps={{ shrink: true }}
                    >
                      {patients.map((patient) => (
                        <MenuItem key={patient.id} value={patient.id}>
                          {patient.name || patient.user?.full_name} ({patient.patient_id})
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="datetime-local"
                  label="Ordered Date"
                  {...registerEdit('ordered_date', { required: 'Date is required' })}
                  error={!!errorsEdit.ordered_date}
                  helperText={errorsEdit.ordered_date?.message}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Test Name"
                  {...registerEdit('test_name', { required: 'Test name is required' })}
                  error={!!errorsEdit.test_name}
                  helperText={errorsEdit.test_name?.message}
                  InputLabelProps={{ shrink: true }}
                  placeholder="e.g., Complete Blood Count (CBC)"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Test Type"
                  {...registerEdit('test_type')}
                  InputLabelProps={{ shrink: true }}
                  placeholder="e.g., Blood Test"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="Status"
                  {...registerEdit('status')}
                  defaultValue="ordered"
                >
                  <MenuItem value="ordered">Ordered</MenuItem>
                  <MenuItem value="sample_collected">Sample Collected</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  {...registerEdit('notes')}
                  multiline
                  rows={2}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained">
              {selectedTest ? 'Update' : 'Order Test'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Complete Dialog */}
      <Dialog open={openCompleteDialog} onClose={() => setOpenCompleteDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Complete Lab Test</DialogTitle>
        <form onSubmit={handleSubmitComplete(handleSaveComplete)}>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="datetime-local"
                  label="Collection Date"
                  {...registerComplete('collection_date')}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="datetime-local"
                  label="Result Date"
                  {...registerComplete('result_date')}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Results"
                  {...registerComplete('results', { required: 'Results are required' })}
                  error={!!errorsComplete.results}
                  helperText={errorsComplete.results?.message}
                  placeholder="Enter test results..."
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Normal Range"
                  {...registerComplete('normal_range')}
                  placeholder="e.g., 4000-11000"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Unit"
                  {...registerComplete('unit')}
                  placeholder="e.g., cells/μL"
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Upload Test Report
                </Typography>
                <FileUpload
                  category="lab_reports"
                  onUploadComplete={handleReportUploadComplete}
                  maxFiles={1}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Notes"
                  {...registerComplete('notes')}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenCompleteDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained" color="success">
              Complete Test
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* View Dialog - Enhanced UI */}
      <Dialog open={openViewDialog} onClose={handleCloseViewDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar sx={{ bgcolor: 'primary.light', mr: 2 }}>
              <Biotech />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight="700">
                Lab Test Details
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ID: {selectedTest?.test_id}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={handleCloseViewDialog}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 4 }}>
          {selectedTest && (
            <Box>
              {/* Header Info */}
              <Paper elevation={0} sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 3, mb: 4, border: '1px solid', borderColor: 'divider' }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ display: 'block', mb: 0.5 }}>
                      TEST DATE
                    </Typography>
                    <Typography variant="body2" fontWeight="500">
                      {formatDateTime(selectedTest.ordered_date)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ display: 'block', mb: 0.5 }}>
                      STATUS
                    </Typography>
                    <Chip label={selectedTest.status.replace('_', ' ')} size="small" color={getStatusColor(selectedTest.status)} />
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
                        {selectedTest.patient?.name?.charAt(0) || 'P'}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" fontWeight="600">
                          {selectedTest.patient?.name || 'N/A'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Patient ID: {selectedTest.patient?.patient_id}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>

                {/* Test Info */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" fontWeight="700" gutterBottom sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>
                    Test Information
                  </Typography>
                  <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary">TEST NAME</Typography>
                    <Typography variant="h6" fontWeight="600" sx={{ mb: 1 }}>
                      {selectedTest.test_name}
                    </Typography>
                  </Paper>
                </Grid>

                {/* Results */}
                {selectedTest.results && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" fontWeight="700" gutterBottom sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>
                      Results
                    </Typography>
                    <Paper elevation={0} sx={{ p: 3, bgcolor: '#e3f2fd', borderRadius: 3, border: '1px solid', borderColor: '#90caf9' }}>
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                        {selectedTest.results}
                      </Typography>
                    </Paper>
                  </Grid>
                )}

                {/* Notes */}
                {selectedTest.notes && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" fontWeight="700" gutterBottom sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>
                      Additional Notes
                    </Typography>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="body2" color="text.secondary">
                        {selectedTest.notes}
                      </Typography>
                    </Paper>
                  </Grid>
                )}
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
            onClick={() => handleDownloadPDF(selectedTest)}
          >
            Download PDF
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DoctorLabTests;
