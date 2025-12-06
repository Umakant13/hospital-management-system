import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  CircularProgress,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Search,
  Message,
  Visibility,
  Edit,
  Save,
  Close,
} from '@mui/icons-material';
import { useAuthStore } from '@/store/authStore';
import { doctorService } from '@/services/doctorService';
import { patientService } from '@/services/patientService';
import { getInitials, getBMICategory } from '@/utils/helpers';
import PageTitle from '@/components/common/PageTitle';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Person,
  MonitorHeart,
  History,
  MedicalServices,
} from '@mui/icons-material';

const MyPatients = () => {
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [formData, setFormData] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const navigate = useNavigate();

  useEffect(() => {
    fetchDoctorProfile();
  }, []);

  const fetchDoctorProfile = async () => {
    try {
      // Get doctor profile to get doctor_id
      const doctors = await doctorService.getAllDoctors();
      const currentDoctor = doctors.find(d => d.user_id === user.id);
      if (currentDoctor) {
        setDoctorProfile(currentDoctor);
        console.log('Current doctor:', currentDoctor);
        console.log('Fetching patients for doctor_id:', currentDoctor.doctor_id);
        // Use doctor_id instead of id
        fetchDoctorPatients(currentDoctor.doctor_id);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching doctor profile:', error);
      setLoading(false);
    }
  };

  const fetchDoctorPatients = async (doctorId) => {
    try {
      setLoading(true);
      const data = await doctorService.getDoctorPatients(doctorId);
      console.log('Assigned patients data:', data);
      setPatients(data);
    } catch (error) {
      console.error('Error fetching assigned patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (patient) => {
    setSelectedPatient(patient);
    setFormData(patient);
    setEditMode(false);
    setActiveTab(0);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedPatient(null);
    setEditMode(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdatePatient = async () => {
    try {
      await patientService.updatePatient(selectedPatient.patient_id, formData);
      setSnackbar({ open: true, message: 'Patient details updated successfully', severity: 'success' });

      // Refresh list
      if (doctorProfile) {
        fetchDoctorPatients(doctorProfile.doctor_id);
      }
      handleCloseModal();
    } catch (error) {
      console.error('Error updating patient:', error);
      setSnackbar({ open: true, message: 'Failed to update patient details', severity: 'error' });
    }
  };

  const filteredPatients = patients.filter(patient =>
    patient.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.patient_id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <PageTitle>
          My Patients
        </PageTitle>
        <Typography variant="body1" color="text.secondary">
          Manage and view details of your assigned patients
        </Typography>
      </Box>

      <TextField
        fullWidth
        placeholder="Search patients by name or ID..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{
          mb: 4,
          '& .MuiOutlinedInput-root': {
            borderRadius: 3,
            bgcolor: 'background.paper',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
          }
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search color="action" />
            </InputAdornment>
          ),
        }}
      />

      <Grid container spacing={3}>
        {filteredPatients.map((patient) => (
          <Grid item xs={12} md={6} lg={4} key={patient.patient_id}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 4,
                border: '1px solid',
                borderColor: 'divider',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 24px -10px rgba(0, 0, 0, 0.1)',
                  borderColor: 'primary.main'
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 3 }}>
                  <Avatar
                    sx={{
                      width: 64,
                      height: 64,
                      mr: 2,
                      bgcolor: 'primary.main',
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                  >
                    {getInitials(patient.name || 'Patient')}
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ lineHeight: 1.2, mb: 0.5 }}>
                      {patient.name || 'N/A'}
                    </Typography>
                    <Chip
                      label={patient.patient_id}
                      size="small"
                      sx={{
                        bgcolor: 'primary.lighter',
                        color: 'primary.dark',
                        fontWeight: 'bold',
                        fontSize: '0.75rem'
                      }}
                    />
                  </Box>
                  <Tooltip title="Send Message">
                    <IconButton
                      sx={{
                        bgcolor: 'primary.lighter',
                        color: 'primary.main',
                        '&:hover': { bgcolor: 'primary.light' }
                      }}
                      onClick={() => navigate(`/doctor/messages?user=${patient.user_id}`)}
                    >
                      <Message fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>

                <Box sx={{
                  bgcolor: 'background.default',
                  p: 2,
                  borderRadius: 2,
                  mb: 2,
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Age / Gender
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {patient.age} yrs / {patient.gender}
                    </Typography>
                  </Box>
                  <Divider orientation="vertical" flexItem />
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Blood Group
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {patient.blood_group || 'N/A'}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Last Visit
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {patient.last_visit ? new Date(patient.last_visit).toLocaleDateString() : 'Never'}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Visibility />}
                    onClick={() => handleViewDetails(patient)}
                    fullWidth
                  >
                    View Details
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
        {filteredPatients.length === 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 4 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {searchQuery ? 'No patients found matching your search' : 'No patients assigned yet'}
              </Typography>
              <Typography variant="body2" color="text.disabled">
                Assigned patients will appear here automatically
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Patient Details Modal */}
      <Dialog
        open={openModal}
        onClose={handleCloseModal}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Box>
            <Typography variant="h6" fontWeight="bold">
              {editMode ? 'Edit Patient Details' : 'Patient Details'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedPatient?.name} ({selectedPatient?.patient_id})
            </Typography>
          </Box>
          <IconButton onClick={handleCloseModal}>
            <Close />
          </IconButton>
        </DialogTitle>
        <Divider />
        <Divider />
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3, bgcolor: 'background.default' }}>
          <Tabs
            value={activeTab}
            onChange={(e, v) => setActiveTab(v)}
            textColor="primary"
            indicatorColor="primary"
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                minHeight: 48,
              }
            }}
          >
            <Tab icon={<Person fontSize="small" />} iconPosition="start" label="Overview" />
            <Tab icon={<MonitorHeart fontSize="small" />} iconPosition="start" label="Vitals" />
            <Tab icon={<History fontSize="small" />} iconPosition="start" label="Medical History" />
          </Tabs>
        </Box>
        <DialogContent sx={{ py: 3, minHeight: 400 }}>
          {activeTab === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="overline" color="text.secondary" fontWeight="bold" letterSpacing={1}>
                  Personal Information
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Age"
                  name="age"
                  type="number"
                  value={formData.age || ''}
                  onChange={handleInputChange}
                  disabled={!editMode}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small" disabled={!editMode}>
                  <InputLabel>Gender</InputLabel>
                  <Select
                    name="gender"
                    value={formData.gender || ''}
                    label="Gender"
                    onChange={handleInputChange}
                  >
                    <MenuItem value="MALE">Male</MenuItem>
                    <MenuItem value="FEMALE">Female</MenuItem>
                    <MenuItem value="OTHER">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small" disabled={!editMode}>
                  <InputLabel>Blood Group</InputLabel>
                  <Select
                    name="blood_group"
                    value={formData.blood_group || ''}
                    label="Blood Group"
                    onChange={handleInputChange}
                  >
                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                      <MenuItem key={bg} value={bg}>{bg}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="overline" color="text.secondary" fontWeight="bold" letterSpacing={1} sx={{ mt: 2, display: 'block' }}>
                  Emergency Contact
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Contact Name"
                  name="emergency_contact_name"
                  value={formData.emergency_contact_name || ''}
                  onChange={handleInputChange}
                  disabled={!editMode}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Contact Number"
                  name="emergency_contact"
                  value={formData.emergency_contact || ''}
                  onChange={handleInputChange}
                  disabled={!editMode}
                  size="small"
                />
              </Grid>
            </Grid>
          )}

          {activeTab === 1 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="overline" color="text.secondary" fontWeight="bold" letterSpacing={1}>
                  Physical Measurements
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Height (cm)"
                  name="height"
                  type="number"
                  value={formData.height || ''}
                  onChange={handleInputChange}
                  disabled={!editMode}
                  size="small"
                  InputProps={{
                    endAdornment: <InputAdornment position="end">cm</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Weight (kg)"
                  name="weight"
                  type="number"
                  value={formData.weight || ''}
                  onChange={handleInputChange}
                  disabled={!editMode}
                  size="small"
                  InputProps={{
                    endAdornment: <InputAdornment position="end">kg</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="BMI"
                  value={formData.bmi || ''}
                  disabled
                  size="small"
                  InputProps={{
                    readOnly: true,
                  }}
                />
              </Grid>
            </Grid>
          )}

          {activeTab === 2 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="overline" color="text.secondary" fontWeight="bold" letterSpacing={1}>
                  Medical Records
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Medical History"
                  name="medical_history"
                  multiline
                  rows={4}
                  value={formData.medical_history || ''}
                  onChange={handleInputChange}
                  disabled={!editMode}
                  placeholder="Past surgeries, chronic conditions, etc."
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Allergies"
                  name="allergies"
                  multiline
                  rows={3}
                  value={formData.allergies || ''}
                  onChange={handleInputChange}
                  disabled={!editMode}
                  placeholder="Drug allergies, food allergies, etc."
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Current Medications"
                  name="current_medications"
                  multiline
                  rows={3}
                  value={formData.current_medications || ''}
                  onChange={handleInputChange}
                  disabled={!editMode}
                  placeholder="List of current medications"
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          {!editMode ? (
            <>
              <Button onClick={handleCloseModal}>Close</Button>
              <Button
                variant="contained"
                startIcon={<Edit />}
                onClick={() => setEditMode(true)}
              >
                Edit Details
              </Button>
            </>
          ) : (
            <>
              <Button onClick={() => setEditMode(false)}>Cancel</Button>
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={handleUpdatePatient}
              >
                Save Changes
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box >
  );
};

export default MyPatients;
