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
  Card,
  CardContent,
  Stack,
  Divider,
  Alert,
  FormControl,
  InputLabel,
  Select,
  InputAdornment,
  TablePagination,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  LocalPharmacy,
  Visibility,
  Close,
  Download,
  Search,
} from '@mui/icons-material';
import { useForm, useFieldArray } from 'react-hook-form';
import { prescriptionService } from '@/services/prescriptionService';
import PageTitle from '@/components/common/PageTitle';
import { patientService } from '@/services/patientService';
import { doctorService } from '@/services/doctorService';
import { appointmentService } from '@/services/appointmentService';
import { formatDateTime } from '@/utils/helpers';
import AIFillButton from '@/components/common/AIFillButton';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const AdminPrescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patientAppointments, setPatientAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [openDialog, setOpenDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [error, setError] = useState(null);

  const { register, handleSubmit, reset, control, watch, formState: { errors } } = useForm({
    defaultValues: {
      medications: [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }]
    }
  });

  const selectedPatientId = watch('patient_id');

  useEffect(() => {
    if (selectedPatientId) {
      fetchPatientAppointments(selectedPatientId);
    } else {
      setPatientAppointments([]);
    }
  }, [selectedPatientId]);

  const fetchPatientAppointments = async (patientId) => {
    try {
      // Assuming appointmentService has a method to get appointments by patient
      // If not, we might need to filter from all appointments or add an endpoint
      // For now, let's assume we can filter the getAllAppointments result or use a specific call
      const allAppointments = await appointmentService.getAllAppointments({ limit: 100 });
      const filtered = Array.isArray(allAppointments)
        ? allAppointments.filter(apt => apt.patient_id === parseInt(patientId))
        : [];
      setPatientAppointments(filtered);
    } catch (error) {
      console.error('Error fetching patient appointments:', error);
    }
  };

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'medications'
  });

  useEffect(() => {
    fetchPrescriptions();
    fetchPatients();
    fetchDoctors();
  }, [page, rowsPerPage, searchQuery, doctorFilter, dateFilter]);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        skip: page * rowsPerPage,
        limit: rowsPerPage,
        search: searchQuery,
      };

      if (doctorFilter) params.doctor_id = doctorFilter;
      if (dateFilter !== 'all') params.date_range = dateFilter;

      const data = await prescriptionService.getAllPrescriptions(params);
      setPrescriptions(data);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      setError('Failed to load prescriptions');
    } finally {
      setLoading(false);
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

  const handleOpenDialog = (prescription = null) => {
    setSelectedPrescription(prescription);
    if (prescription) {
      // Parse medications if it's a JSON string
      const medications = typeof prescription.medications === 'string'
        ? JSON.parse(prescription.medications)
        : prescription.medications;

      reset({
        patient_id: prescription.patient_id,
        doctor_id: prescription.doctor_id,
        appointment_id: prescription.appointment_id || '',
        medications: medications || [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }],
        instructions: prescription.instructions || '',
        notes: prescription.notes || '',
      });
    } else {
      reset({
        medications: [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }]
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedPrescription(null);
    reset({
      medications: [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }]
    });
  };

  const handleViewPrescription = (prescription) => {
    setSelectedPrescription(prescription);
    setOpenViewDialog(true);
  };

  const handleSavePrescription = async (data) => {
    try {
      const prescriptionData = {
        patient_id: parseInt(data.patient_id),
        doctor_id: parseInt(data.doctor_id),
        appointment_id: data.appointment_id ? parseInt(data.appointment_id) : null,
        medications: data.medications,
        instructions: data.instructions || null,
        notes: data.notes || null,
      };

      if (selectedPrescription) {
        await prescriptionService.updatePrescription(selectedPrescription.prescription_id, prescriptionData);
      } else {
        await prescriptionService.createPrescription(prescriptionData);
      }
      handleCloseDialog();
      fetchPrescriptions();
    } catch (error) {
      console.error('Error saving prescription:', error);
      alert(`Failed to save: ${error.response?.data?.detail || error.message}`);
    }
  };

  const handleDelete = async (prescription) => {
    if (window.confirm('Are you sure you want to delete this prescription?')) {
      try {
        await prescriptionService.deletePrescription(prescription.prescription_id);
        fetchPrescriptions();
      } catch (error) {
        console.error('Error deleting prescription:', error);
        alert('Failed to delete prescription');
      }
    }
  };

  const handleDownloadPDF = (prescription) => {
    const doc = new jsPDF();
    const medications = typeof prescription.medications === 'string'
      ? JSON.parse(prescription.medications)
      : prescription.medications;

    // Header
    doc.setFontSize(18);
    doc.setTextColor(25, 118, 210);
    doc.text('PRESCRIPTION', 105, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Hospital Management System', 105, 28, { align: 'center' });

    // Line separator
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 32, 190, 32);

    // Prescription Info
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text(`Prescription ID: ${prescription.prescription_id}`, 20, 40);
    doc.text(`Date: ${new Date(prescription.created_at).toLocaleDateString()}`, 140, 40);

    // Patient & Doctor Info
    let yPos = 50;
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Patient Information', 20, yPos);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    yPos += 5;
    doc.text(`Name: ${prescription.patient?.name || prescription.patient?.full_name || 'N/A'}`, 20, yPos);
    yPos += 4;
    doc.text(`Patient ID: ${prescription.patient?.patient_id || 'N/A'}`, 20, yPos);

    yPos = 50;
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Doctor Information', 120, yPos);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    yPos += 5;
    doc.text(`Name: ${prescription.doctor?.name || prescription.doctor?.full_name || 'N/A'}`, 120, yPos);
    yPos += 4;
    doc.text(`Doctor ID: ${prescription.doctor?.doctor_id || 'N/A'}`, 120, yPos);

    // Medications Table
    yPos = 70;
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(25, 118, 210);
    doc.text('Rx Medications', 20, yPos);
    yPos += 5;

    const tableData = medications.map(med => [
      med.name,
      med.dosage,
      med.frequency,
      med.duration,
      med.instructions || '-'
    ]);

    doc.autoTable({
      startY: yPos,
      head: [['Medication', 'Dosage', 'Frequency', 'Duration', 'Instructions']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [25, 118, 210],
        fontSize: 9,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 8,
        cellPadding: 2
      },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 25 },
        2: { cellWidth: 30 },
        3: { cellWidth: 25 },
        4: { cellWidth: 50 }
      }
    });

    yPos = doc.lastAutoTable.finalY + 10;

    // Instructions
    if (prescription.instructions) {
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('General Instructions:', 20, yPos);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(9);
      yPos += 5;
      const splitInstructions = doc.splitTextToSize(prescription.instructions, 170);
      doc.text(splitInstructions, 20, yPos);
      yPos += (splitInstructions.length * 4) + 5;
    }

    // Notes
    if (prescription.notes) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('Notes:', 20, yPos);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(9);
      yPos += 5;
      const splitNotes = doc.splitTextToSize(prescription.notes, 170);
      doc.text(splitNotes, 20, yPos);
      yPos += (splitNotes.length * 4) + 10;
    }

    // Signature
    yPos = Math.max(yPos, 250);
    doc.setFontSize(9);
    doc.text('_______________________', 140, yPos);
    doc.text("Doctor's Signature", 148, yPos + 5);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text('This is a computer-generated prescription.', 105, 285, { align: 'center' });

    doc.save(`prescription_${prescription.prescription_id}.pdf`);
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
        <Box>
          <PageTitle>
            Prescriptions
          </PageTitle>
          <Typography variant="body2" color="text.secondary">
            Manage all patient prescriptions
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          New Prescription
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={2} sx={{ p: 3 }}>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search by patient name or prescription ID..."
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
                <TableCell>Prescription ID</TableCell>
                <TableCell>Patient</TableCell>
                <TableCell>Doctor</TableCell>
                <TableCell>Medications</TableCell>
                <TableCell>Created Date</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {prescriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                      No prescriptions found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                prescriptions.map((prescription) => {
                  const medications = typeof prescription.medications === 'string'
                    ? JSON.parse(prescription.medications)
                    : prescription.medications;

                  return (
                    <TableRow key={prescription.id} hover>
                      <TableCell>
                        <Chip
                          label={prescription.prescription_id}
                          size="small"
                          color="primary"
                          variant="outlined"
                          icon={<LocalPharmacy />}
                        />
                      </TableCell>
                      <TableCell>
                        {prescription.patient?.name || prescription.patient?.full_name || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {prescription.doctor?.name || prescription.doctor?.full_name || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={`${medications?.length || 0} medication(s)`}
                          size="small"
                          color="info"
                        />
                      </TableCell>
                      <TableCell>{formatDateTime(prescription.created_at)}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            color="info"
                            onClick={() => handleViewPrescription(prescription)}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Download PDF">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => handleDownloadPDF(prescription)}
                          >
                            <Download />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleOpenDialog(prescription)}
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(prescription)}
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
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

      {/* Create/Edit Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <form onSubmit={handleSubmit(handleSavePrescription)}>
          <DialogTitle>
            {selectedPrescription ? 'Edit Prescription' : 'Create New Prescription'}
            {!selectedPrescription && (
              <Box sx={{ ml: 2, display: 'inline-block' }}>
                <AIFillButton
                  fieldDescriptions={{
                    instructions: 'General instructions for taking medications',
                    notes: 'Additional notes or warnings for the prescription',
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
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Patient"
                  {...register('patient_id', { required: 'Patient is required' })}
                  error={!!errors.patient_id}
                  helperText={errors.patient_id?.message}
                  disabled={!!selectedPrescription}
                >
                  {patients.map((patient) => (
                    <MenuItem key={patient.id} value={patient.id}>
                      {patient.user?.full_name || patient.name} ({patient.patient_id})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Doctor"
                  {...register('doctor_id', { required: 'Doctor is required' })}
                  error={!!errors.doctor_id}
                  helperText={errors.doctor_id?.message}
                  disabled={!!selectedPrescription}
                >
                  {doctors.map((doctor) => (
                    <MenuItem key={doctor.id} value={doctor.id}>
                      {doctor.user?.full_name || doctor.name} ({doctor.specialization})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={12}>
                <TextField
                  fullWidth
                  select
                  label="Appointment (Optional)"
                  {...register('appointment_id')}
                  disabled={!selectedPatientId}
                  helperText={!selectedPatientId ? "Select a patient first" : ""}
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {patientAppointments.map((apt) => (
                    <MenuItem key={apt.id} value={apt.id}>
                      {formatDateTime(apt.appointment_date)} - {apt.doctor?.user?.full_name || 'Doctor'} ({apt.status})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Medications */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }}>
                  <Chip label="Medications" />
                </Divider>
              </Grid>

              {fields.map((field, index) => (
                <Grid item xs={12} key={field.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="subtitle2">Medication {index + 1}</Typography>
                        {fields.length > 1 && (
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => remove(index)}
                          >
                            <Close />
                          </IconButton>
                        )}
                      </Box>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Medicine Name"
                            {...register(`medications.${index}.name`, { required: 'Required' })}
                            error={!!errors.medications?.[index]?.name}
                            helperText={errors.medications?.[index]?.name?.message}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Dosage (e.g., 500mg)"
                            {...register(`medications.${index}.dosage`, { required: 'Required' })}
                            error={!!errors.medications?.[index]?.dosage}
                            helperText={errors.medications?.[index]?.dosage?.message}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Frequency (e.g., Twice daily)"
                            {...register(`medications.${index}.frequency`, { required: 'Required' })}
                            error={!!errors.medications?.[index]?.frequency}
                            helperText={errors.medications?.[index]?.frequency?.message}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Duration (e.g., 7 days)"
                            {...register(`medications.${index}.duration`, { required: 'Required' })}
                            error={!!errors.medications?.[index]?.duration}
                            helperText={errors.medications?.[index]?.duration?.message}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Special Instructions (Optional)"
                            {...register(`medications.${index}.instructions`)}
                            multiline
                            rows={2}
                          />
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              ))}

              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={() => append({ name: '', dosage: '', frequency: '', duration: '', instructions: '' })}
                >
                  Add Another Medication
                </Button>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="General Instructions"
                  {...register('instructions')}
                  multiline
                  rows={3}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Additional Notes"
                  {...register('notes')}
                  multiline
                  rows={2}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained">
              {selectedPrescription ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* View Dialog */}
      <Dialog
        open={openViewDialog}
        onClose={() => setOpenViewDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Prescription Details
          <IconButton
            onClick={() => setOpenViewDialog(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers id="printable-prescription">
          {selectedPrescription && (
            <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
              {/* Header */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4, borderBottom: '2px solid #1976d2', pb: 2 }}>
                <Box>
                  <Typography variant="h5" color="primary" fontWeight="bold">HOSPITAL NAME</Typography>
                  <Typography variant="body2">123 Medical Center Dr.</Typography>
                  <Typography variant="body2">City, State, 12345</Typography>
                  <Typography variant="body2">Phone: (555) 123-4567</Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="h6">PRESCRIPTION</Typography>
                  <Typography variant="body2" color="text.secondary">ID: {selectedPrescription.prescription_id}</Typography>
                  <Typography variant="body2" color="text.secondary">Date: {new Date(selectedPrescription.created_at).toLocaleDateString()}</Typography>
                </Box>
              </Box>

              {/* Patient & Doctor Info */}
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={6}>
                  <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                    <Typography variant="subtitle2" color="text.secondary">PATIENT</Typography>
                    <Typography variant="h6">{selectedPrescription.patient?.name || selectedPrescription.patient?.full_name || 'N/A'}</Typography>
                    <Typography variant="body2">ID: {selectedPrescription.patient?.patient_id}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                    <Typography variant="subtitle2" color="text.secondary">DOCTOR</Typography>
                    <Typography variant="h6">{selectedPrescription.doctor?.name || selectedPrescription.doctor?.full_name || 'N/A'}</Typography>
                    <Typography variant="body2">ID: {selectedPrescription.doctor?.doctor_id}</Typography>
                  </Box>
                </Grid>
              </Grid>

              {/* Medications Table */}
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <LocalPharmacy sx={{ mr: 1 }} color="primary" /> Rx Medications
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ mb: 4 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                      <TableCell><strong>Medication</strong></TableCell>
                      <TableCell><strong>Dosage</strong></TableCell>
                      <TableCell><strong>Frequency</strong></TableCell>
                      <TableCell><strong>Duration</strong></TableCell>
                      <TableCell><strong>Instructions</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(typeof selectedPrescription.medications === 'string'
                      ? JSON.parse(selectedPrescription.medications)
                      : selectedPrescription.medications || []
                    ).map((med, index) => (
                      <TableRow key={index}>
                        <TableCell>{med.name}</TableCell>
                        <TableCell>{med.dosage}</TableCell>
                        <TableCell>{med.frequency}</TableCell>
                        <TableCell>{med.duration}</TableCell>
                        <TableCell>{med.instructions || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Instructions & Notes */}
              <Grid container spacing={2}>
                {selectedPrescription.instructions && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" fontWeight="bold">General Instructions:</Typography>
                    <Typography variant="body1" sx={{ mt: 0.5, p: 1, bgcolor: '#fff3e0', borderRadius: 1 }}>
                      {selectedPrescription.instructions}
                    </Typography>
                  </Grid>
                )}
                {selectedPrescription.notes && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" fontWeight="bold">Notes:</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedPrescription.notes}
                    </Typography>
                  </Grid>
                )}
              </Grid>

              {/* Footer */}
              <Box sx={{ mt: 8, pt: 2, borderTop: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Generated on {new Date().toLocaleString()}</Typography>
                </Box>
                <Box sx={{ textAlign: 'center', width: 200 }}>
                  <Divider sx={{ mb: 1 }} />
                  <Typography variant="body2">Doctor's Signature</Typography>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={() => handleDownloadPDF(selectedPrescription)}
          >
            Download PDF
          </Button>
          <Button onClick={() => setOpenViewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box >
  );
};

export default AdminPrescriptions;
