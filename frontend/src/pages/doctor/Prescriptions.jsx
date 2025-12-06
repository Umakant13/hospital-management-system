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
  Divider,
  Avatar,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  LocalPharmacy,
  Visibility,
  Close,
  Print,
  Download,
} from '@mui/icons-material';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { prescriptionService } from '@/services/prescriptionService';
import PageTitle from '@/components/common/PageTitle';
import { formatDateTime } from '@/utils/helpers';
import { useAuthStore } from '@/store/authStore';
import { doctorService } from '@/services/doctorService';
import aiService from '@/services/aiService';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const DoctorPrescriptions = () => {
  const { user } = useAuthStore();
  const [prescriptions, setPrescriptions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const { register, handleSubmit, reset, control, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      medications: [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }]
    }
  });



  const { fields, append, remove } = useFieldArray({
    control,
    name: 'medications'
  });

  useEffect(() => {
    console.log('DoctorPrescriptions: User changed', user);
    if (user?.doctor_internal_id && user?.doctor_id) {
      fetchPrescriptions();
      fetchPatients();
    } else {
      console.warn('DoctorPrescriptions: Missing doctor_id or doctor_internal_id', user);
    }
  }, [user]);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const data = await prescriptionService.getAllPrescriptions();
      // Filter prescriptions for this doctor
      const filteredData = data.filter(p => p.doctor_id === user.doctor_internal_id);
      setPrescriptions(filteredData);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      console.error('Error details:', error.response?.data || error.message);
    } finally {
      setLoading(false);
      console.log('DoctorPrescriptions: Fetch complete');
    }
  };

  const fetchPatients = async () => {
    try {
      if (!user.doctor_id) {
        console.warn('No doctor_id found for user');
        return;
      }
      console.log('Fetching patients for doctor:', user.doctor_id);
      const data = await doctorService.getDoctorPatients(user.doctor_id);
      console.log('Fetched patients:', data);
      setPatients(data || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };



  const handleOpenDialog = (prescription = null) => {
    setSelectedPrescription(prescription);
    if (prescription) {
      const medications = typeof prescription.medications === 'string'
        ? JSON.parse(prescription.medications)
        : prescription.medications;

      reset({
        patient_id: prescription.patient?.id || prescription.patient_id || '',
        medications: Array.isArray(prescription.medications)
          ? prescription.medications
          : JSON.parse(prescription.medications || '[]'),
        notes: prescription.notes || '',
      });
    } else {
      reset({
        patient_id: '',
        medications: [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }],
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

  const handleOpenViewDialog = (prescription) => {
    setSelectedPrescription(prescription);
    setOpenViewDialog(true);
  };

  const handleCloseViewDialog = () => {
    setOpenViewDialog(false);
    setSelectedPrescription(null);
  };

  const handleFillWithAI = async () => {
    setAiLoading(true);
    try {
      const fieldDescriptions = {
        instructions: 'General instructions for taking medications',
        notes: 'Additional notes or warnings for the prescription',
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

  const handleSavePrescription = async (data) => {
    try {
      const prescriptionData = {
        ...data,
        patient_id: data.patient_id ? parseInt(data.patient_id) : null,
        doctor_id: user.doctor_internal_id,
      };

      // Validate patient_id
      if (!prescriptionData.patient_id) {
        alert('Please select a patient');
        return;
      }

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

  const handleDelete = async (prescriptionId) => {
    if (window.confirm('Are you sure you want to delete this prescription?')) {
      try {
        await prescriptionService.deletePrescription(prescriptionId);
        fetchPrescriptions();
      } catch (error) {
        console.error('Error deleting prescription:', error);
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

    // Patient Info
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

    // Medications Table
    yPos += 10;
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
        fontSize: 10,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 10,
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
        <PageTitle>
          Prescriptions
        </PageTitle>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          New Prescription
        </Button>
      </Box>

      <Paper elevation={2}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Prescription ID</TableCell>
                <TableCell>Patient</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Medications</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {prescriptions.map((prescription) => {
                const medications = typeof prescription.medications === 'string'
                  ? JSON.parse(prescription.medications)
                  : prescription.medications;

                return (
                  <TableRow key={prescription.id} hover>
                    <TableCell>
                      <Chip label={prescription.prescription_id} size="small" color="primary" variant="outlined" />
                    </TableCell>
                    <TableCell>{prescription.patient?.name || 'N/A'}</TableCell>
                    <TableCell>{formatDateTime(prescription.created_at)}</TableCell>
                    <TableCell>
                      <Chip label={`${medications?.length || 0} medication(s)`} size="small" color="info" />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View Details">
                        <IconButton size="small" color="info" onClick={() => handleOpenViewDialog(prescription)}>
                          <Visibility />
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
                          onClick={() => handleDelete(prescription.prescription_id)}
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
              {prescriptions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <LocalPharmacy sx={{ fontSize: 60, color: 'text.secondary', mb: 1 }} />
                    <Typography color="text.secondary">No prescriptions found</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit(handleSavePrescription)}>
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{selectedPrescription ? 'Edit Prescription' : 'Create New Prescription'}</span>
              {!selectedPrescription && (
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
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
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
                      disabled={!!selectedPrescription}
                      InputLabelProps={{ shrink: true }}
                    >
                      {patients.length > 0 ? (
                        patients.map((patient) => (
                          <MenuItem key={patient.id} value={patient.id}>
                            {patient.name || patient.user?.full_name} ({patient.patient_id})
                          </MenuItem>
                        ))
                      ) : (
                        <MenuItem disabled value="">
                          <em>No patients found (Assign patients to this doctor first)</em>
                        </MenuItem>
                      )}
                    </TextField>
                  )}
                />
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
                  multiline
                  rows={3}
                  label="Instructions"
                  {...register('instructions')}
                  InputLabelProps={{ shrink: true }}
                  placeholder="General instructions for taking medications..."
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Notes"
                  {...register('notes')}
                  InputLabelProps={{ shrink: true }}
                  placeholder="Additional notes or warnings..."
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
      <Dialog open={openViewDialog} onClose={handleCloseViewDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          Prescription Details
          <IconButton
            onClick={handleCloseViewDialog}
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
                    <Typography variant="h6">{selectedPrescription.patient?.name || 'N/A'}</Typography>
                    <Typography variant="body2">ID: {selectedPrescription.patient?.patient_id}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                    <Typography variant="subtitle2" color="text.secondary">DOCTOR</Typography>
                    <Typography variant="h6">{user?.full_name || 'N/A'}</Typography>
                    <Typography variant="body2">ID: {user?.doctor_id}</Typography>
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
          <Button startIcon={<Download />} onClick={() => handleDownloadPDF(selectedPrescription)} variant="contained">
            Download PDF
          </Button>
          <Button onClick={handleCloseViewDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DoctorPrescriptions;
