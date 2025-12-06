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
  Science,
  CheckCircle,
  Close,
  Download,
  Search,
} from '@mui/icons-material';
import { labTestService } from '@/services/labTestService';
import { patientService } from '@/services/patientService';
import { doctorService } from '@/services/doctorService';
import { useForm } from 'react-hook-form';
import PageTitle from '@/components/common/PageTitle';
// eslint-disable-next-line no-unused-vars
import { formatDateTime, getStatusColor } from '@/utils/helpers';
import FileUpload from '@/components/common/FileUpload';
import AIFillButton from '@/components/common/AIFillButton';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const LabTests = () => {
  const [tests, setTests] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [testTypeFilter, setTestTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openCompleteDialog, setOpenCompleteDialog] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [uploadedReports, setUploadedReports] = useState([]);

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    formState: { errors: errorsEdit }
  } = useForm();

  const {
    register: registerComplete,
    handleSubmit: handleSubmitComplete,
    reset: resetComplete,
    formState: { errors: errorsComplete }
  } = useForm();

  useEffect(() => {
    fetchTests();
    fetchPatients();
    fetchDoctors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, searchQuery, testTypeFilter, statusFilter]);

  const fetchTests = async () => {
    try {
      const params = {
        skip: page * rowsPerPage,
        limit: rowsPerPage,
        search: searchQuery,
      };

      if (testTypeFilter) params.test_type = testTypeFilter;
      if (statusFilter) params.status = statusFilter;

      const data = await labTestService.getAllLabTests(params);
      setTests(data);
    } catch (error) {
      console.error('Error fetching tests:', error);
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

  const handleOpenDialog = (test = null) => {
    setSelectedTest(test);
    setUploadedReports([]);
    if (test) {
      // Format date for datetime-local input (YYYY-MM-DDThh:mm)
      const formattedDate = test.ordered_date
        ? new Date(test.ordered_date).toISOString().slice(0, 16)
        : '';

      resetEdit({
        patient_id: test.patient_id || test.patient?.id,
        doctor_id: test.doctor_id || test.doctor?.id || '',
        test_name: test.test_name,
        test_type: test.test_type,
        ordered_date: formattedDate,
        status: test.status,
        notes: test.notes || ''
      });
    } else {
      resetEdit({
        status: 'ordered',
        ordered_date: new Date().toISOString().slice(0, 16)
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

  const handleViewTest = (test) => {
    setSelectedTest(test);
    setOpenViewDialog(true);
  };

  const handleCompleteTest = (test) => {
    setSelectedTest(test);
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

  const handleSaveTest = async (data) => {
    try {
      const testData = {
        ...data,
        report_file: uploadedReports.length > 0 ? uploadedReports[0].file_path : null,
      };

      if (selectedTest) {
        await labTestService.updateLabTest(selectedTest.test_id, testData);
      } else {
        await labTestService.createLabTest(testData);
      }
      handleCloseDialog();
      fetchTests();
    } catch (error) {
      console.error('Error saving test:', error);
      alert('Failed to save lab test');
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
      fetchTests();
    } catch (error) {
      console.error('Error completing test:', error);
      alert('Failed to complete lab test');
    }
  };

  const handleDelete = async (testId) => {
    if (window.confirm('Are you sure you want to delete this lab test?')) {
      try {
        await labTestService.deleteLabTest(testId);
        fetchTests();
      } catch (error) {
        console.error('Error deleting test:', error);
      }
    }
  };

  const handleReportUploadComplete = (files) => {
    setUploadedReports(files);
  };

  const getStatusChipColor = (status) => {
    const colors = {
      ordered: 'info',
      sample_collected: 'warning',
      in_progress: 'primary',
      completed: 'success',
      cancelled: 'error',
    };
    return colors[status] || 'default';
  };

  const handleDownloadReport = (test) => {
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
    // Use Rs. instead of ₹ symbol to avoid encoding issues
    doc.text(`Cost: Rs. ${test.cost || 0}`, 20, yPos);

    // Results (if completed)
    if (test.status === 'completed' || test.results) {
      yPos += 10;
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(25, 118, 210);
      doc.text('Test Results', 20, yPos);
      doc.setTextColor(0, 0, 0);
      yPos += 5;

      // Clean results text - replace special characters
      const cleanResults = (test.results || 'Pending')
        .replace(/μ/g, 'u')  // Replace mu with u
        .replace(/₹/g, 'Rs.'); // Replace rupee symbol

      // Results table
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

      <Paper elevation={2} sx={{ p: 3 }}>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search by patient name or test name..."
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
              <InputLabel>Test Type</InputLabel>
              <Select
                value={testTypeFilter}
                label="Test Type"
                onChange={(e) => {
                  setTestTypeFilter(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value="Blood Test">Blood Test</MenuItem>
                <MenuItem value="Urine Test">Urine Test</MenuItem>
                <MenuItem value="X-Ray">X-Ray</MenuItem>
                <MenuItem value="MRI">MRI</MenuItem>
                <MenuItem value="CT Scan">CT Scan</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="ordered">Ordered</MenuItem>
                <MenuItem value="sample_collected">Sample Collected</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Test ID</TableCell>
                <TableCell>Patient</TableCell>
                <TableCell>Test Name</TableCell>
                <TableCell>Ordered Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Results</TableCell>
                <TableCell>Cost</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tests.map((test) => (
                <TableRow key={test.id} hover>
                  <TableCell>
                    <Chip label={test.test_id} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>{test.patient?.name || 'N/A'}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Science sx={{ mr: 1, color: 'primary.main' }} />
                      {test.test_name}
                    </Box>
                  </TableCell>
                  <TableCell>{formatDateTime(test.ordered_date)}</TableCell>
                  <TableCell>
                    <Chip
                      label={test.status.replace('_', ' ')}
                      size="small"
                      color={getStatusChipColor(test.status)}
                    />
                  </TableCell>
                  <TableCell>{test.results || 'Pending'}</TableCell>
                  <TableCell>₹{test.cost || 0}</TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                      <Tooltip title="View">
                        <IconButton size="small" color="info" onClick={() => handleViewTest(test)}>
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
                    </Box>
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
          {selectedTest ? 'Update Lab Test' : 'Order New Lab Test'}
          {!selectedTest && (
            <Box sx={{ ml: 2, display: 'inline-block' }}>
              <AIFillButton
                fieldDescriptions={{
                  test_name: 'Name of the lab test (e.g., Complete Blood Count, Lipid Panel)',
                  test_type: 'Type or category of the test (e.g., Blood Test, Urine Test)',
                  notes: 'Additional notes or instructions for the lab test',
                }}
                onFill={(data) => {
                  Object.keys(data).forEach(key => {
                    if (data[key]) {
                      setValue(key, data[key]);
                    }
                  });
                }}
              />
            </Box>
          )}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Patient"
                  {...registerEdit('patient_id', { required: 'Patient is required' })}
                  error={!!errorsEdit.patient_id}
                  helperText={errorsEdit.patient_id?.message}
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
                  {...registerEdit('doctor_id')}
                >
                  <MenuItem value="">None</MenuItem>
                  {doctors.map((doctor) => (
                    <MenuItem key={doctor.id} value={doctor.id}>
                      {doctor.user?.full_name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Test Name"
                  {...registerEdit('test_name', { required: 'Test name is required' })}
                  error={!!errorsEdit.test_name}
                  helperText={errorsEdit.test_name?.message}
                  placeholder="e.g., Complete Blood Count"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Test Type"
                  {...registerEdit('test_type')}
                  placeholder="e.g., Blood Test"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="datetime-local"
                  label="Ordered Date"
                  {...registerEdit('ordered_date', { required: 'Ordered date is required' })}
                  error={!!errorsEdit.ordered_date}
                  helperText={errorsEdit.ordered_date?.message}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
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
                  multiline
                  rows={2}
                  label="Notes"
                  {...registerEdit('notes')}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmitEdit(handleSaveTest)}
          >
            {selectedTest ? 'Update' : 'Order Test'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Complete Dialog */}
      <Dialog open={openCompleteDialog} onClose={() => setOpenCompleteDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Complete Lab Test</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <Grid container spacing={2}>
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
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCompleteDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleSubmitComplete(handleSaveComplete)}
          >
            Complete Test
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar sx={{ bgcolor: 'primary.light', mr: 2 }}>
              <Science />
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
          <IconButton onClick={() => setOpenViewDialog(false)}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 4 }}>
          {selectedTest && (
            <Box>
              {/* Header Info */}
              <Paper elevation={0} sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 3, mb: 4, border: '1px solid', borderColor: 'divider' }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ display: 'block', mb: 0.5 }}>
                      STATUS
                    </Typography>
                    <Chip
                      label={selectedTest.status.replace('_', ' ').toUpperCase()}
                      size="small"
                      color={getStatusChipColor(selectedTest.status)}
                      sx={{ fontWeight: 'bold', borderRadius: 1.5 }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ display: 'block', mb: 0.5 }}>
                      ORDERED DATE
                    </Typography>
                    <Typography variant="body2" fontWeight="500">
                      {formatDateTime(selectedTest.ordered_date)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ display: 'block', mb: 0.5 }}>
                      COST
                    </Typography>
                    <Typography variant="body2" fontWeight="700" color="primary.main">
                      ₹{selectedTest.cost || 0}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ display: 'block', mb: 0.5 }}>
                      TEST TYPE
                    </Typography>
                    <Typography variant="body2" fontWeight="500">
                      {selectedTest.test_type || 'N/A'}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>

              <Grid container spacing={4}>
                {/* Patient & Doctor Info */}
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
                          Patient ID: {selectedTest.patient_id || selectedTest.patient?.patient_id}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" fontWeight="700" gutterBottom sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>
                    Doctor Information
                  </Typography>
                  <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ width: 40, height: 40, mr: 2, bgcolor: 'secondary.main' }}>
                        {selectedTest.doctor?.name?.charAt(0) || 'D'}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" fontWeight="600">
                          {selectedTest.doctor?.name || 'N/A'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Doctor ID: {selectedTest.doctor_id || selectedTest.doctor?.doctor_id}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>

                {/* Test Results Section */}
                {(selectedTest.status === 'completed' || selectedTest.results) && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" fontWeight="700" gutterBottom sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1, mt: 2 }}>
                      Test Results
                    </Typography>
                    <Paper elevation={0} sx={{ p: 3, bgcolor: '#f8fafc', borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                      <Grid container spacing={3}>
                        <Grid item xs={12}>
                          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', bgcolor: 'white', p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                            {selectedTest.results}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                            <Typography variant="caption" color="text.secondary" fontWeight="600">NORMAL RANGE</Typography>
                            <Typography variant="body1" fontWeight="500">{selectedTest.normal_range || 'N/A'}</Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                            <Typography variant="caption" color="text.secondary" fontWeight="600">UNIT</Typography>
                            <Typography variant="body1" fontWeight="500">{selectedTest.unit || 'N/A'}</Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                            <Typography variant="caption" color="text.secondary" fontWeight="600">RESULT DATE</Typography>
                            <Typography variant="body1" fontWeight="500">
                              {selectedTest.result_date ? formatDateTime(selectedTest.result_date) : 'N/A'}
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                )}

                {/* Notes Section */}
                {selectedTest.notes && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" fontWeight="700" gutterBottom sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>
                      Notes
                    </Typography>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: '#fff9c4', borderRadius: 2, border: '1px solid', borderColor: '#fbc02d' }}>
                      <Typography variant="body2" color="text.primary">
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
          <Button onClick={() => setOpenViewDialog(false)} variant="outlined" sx={{ borderRadius: 2 }}>
            Close
          </Button>
          <Button
            variant="contained"
            startIcon={<Download />}
            sx={{ borderRadius: 2 }}
            onClick={() => handleDownloadReport(selectedTest)}
          >
            Download Report
          </Button>

        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LabTests;