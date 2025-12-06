import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    IconButton,
    Chip,
    Avatar,
    useTheme,
    alpha,
    Tooltip,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormControlLabel,
    Checkbox,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    ListItemSecondaryAction,
    Divider,
    Alert,
    CircularProgress
} from '@mui/material';
import {
    Add,
    Edit,
    Delete,
    MedicalServices,
    People,
    Visibility,
    PersonAdd,
    Phone,
    Email,
    AccessTime,
    LocationOn,
    Star,
    Close,
    Search,
    FilterList
} from '@mui/icons-material';
import { departmentService } from '@/services/departmentService';
import { doctorService } from '@/services/doctorService';
import { useForm } from 'react-hook-form';
import PageTitle from '@/components/common/PageTitle';

const Departments = () => {
    const theme = useTheme();
    const [departments, setDepartments] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);

    // Dialog States
    const [openDialog, setOpenDialog] = useState(false);
    const [openViewDialog, setOpenViewDialog] = useState(false);
    const [openAssignDialog, setOpenAssignDialog] = useState(false);

    const [selectedDepartment, setSelectedDepartment] = useState(null);
    const [departmentDoctors, setDepartmentDoctors] = useState([]);

    // Search, Filter, and Pagination States
    const [searchQuery, setSearchQuery] = useState('');
    const [headDoctorFilter, setHeadDoctorFilter] = useState('all');
    const [locationFilter, setLocationFilter] = useState('all');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Form Data
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
        location: '',
        phone: '',
        email: '',
        operating_hours: ''
    });

    // Assignment Data
    const [assignData, setAssignData] = useState({
        doctor_id: '',
        is_head: false
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [deptData, docData] = await Promise.all([
                departmentService.getAllDepartments(),
                doctorService.getAllDoctors()
            ]);
            setDepartments(deptData);
            setDoctors(docData);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Create/Edit Dialog Handlers
    const handleOpenDialog = (department = null) => {
        if (department) {
            setFormData({
                name: department.name,
                code: department.code,
                description: department.description || '',
                location: department.location || '',
                phone: department.phone || '',
                email: department.email || '',
                operating_hours: department.operating_hours || ''
            });
            setSelectedDepartment(department);
        } else {
            setFormData({
                name: '',
                code: '',
                description: '',
                location: '',
                phone: '',
                email: '',
                operating_hours: ''
            });
            setSelectedDepartment(null);
        }
        setOpenDialog(true);
    };

    const handleSubmit = async () => {
        try {
            if (selectedDepartment) {
                await departmentService.updateDepartment(selectedDepartment.id, formData);
            } else {
                await departmentService.createDepartment(formData);
            }
            setOpenDialog(false);
            fetchData();
        } catch (error) {
            console.error('Error saving department:', error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this department?')) {
            try {
                await departmentService.deleteDepartment(id);
                fetchData();
            } catch (error) {
                console.error('Error deleting department:', error);
                alert(error.response?.data?.detail || 'Failed to delete department');
            }
        }
    };

    // View Dialog Handlers
    const handleViewDepartment = (department) => {
        setSelectedDepartment(department);
        setOpenViewDialog(true);
    };

    // Assign Doctor Handlers
    const handleOpenAssignDialog = async (department) => {
        setSelectedDepartment(department);
        setAssignData({ doctor_id: '', is_head: false });
        try {
            const docs = await departmentService.getDepartmentDoctors(department.id);
            setDepartmentDoctors(docs);
            setOpenAssignDialog(true);
        } catch (error) {
            console.error('Error fetching department doctors:', error);
        }
    };

    const handleAssignDoctor = async () => {
        try {
            await departmentService.assignDoctor(
                selectedDepartment.id,
                assignData.doctor_id,
                assignData.is_head
            );
            // Refresh department doctors list
            const docs = await departmentService.getDepartmentDoctors(selectedDepartment.id);
            setDepartmentDoctors(docs);
            setAssignData({ doctor_id: '', is_head: false });
            fetchData(); // Refresh main list to update counts/head doctor
        } catch (error) {
            console.error('Error assigning doctor:', error);
            alert(error.response?.data?.detail || 'Failed to assign doctor');
        }
    };

    const handleRemoveDoctor = async (doctorId) => {
        if (window.confirm('Remove this doctor from the department?')) {
            try {
                await departmentService.removeDoctor(selectedDepartment.id, doctorId);
                const docs = await departmentService.getDepartmentDoctors(selectedDepartment.id);
                setDepartmentDoctors(docs);
                fetchData();
            } catch (error) {
                console.error('Error removing doctor:', error);
            }
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    // Get unique locations for filter
    const uniqueLocations = [...new Set(departments.map(d => d.location).filter(Boolean))];

    // Filter and search logic
    const filteredDepartments = departments.filter(dept => {
        // Search filter
        const matchesSearch = searchQuery === '' ||
            dept.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            dept.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            dept.email?.toLowerCase().includes(searchQuery.toLowerCase());

        // Head doctor filter
        const matchesHeadDoctor = headDoctorFilter === 'all' ||
            (headDoctorFilter === 'assigned' && dept.head_doctor_id) ||
            (headDoctorFilter === 'not_assigned' && !dept.head_doctor_id);

        // Location filter
        const matchesLocation = locationFilter === 'all' || dept.location === locationFilter;

        return matchesSearch && matchesHeadDoctor && matchesLocation;
    });

    // Pagination
    const paginatedDepartments = filteredDepartments.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
    );

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <PageTitle>
                    Departments
                </PageTitle>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => handleOpenDialog()}
                    sx={{ borderRadius: 2, px: 3, py: 1 }}
                >
                    Add Department
                </Button>
            </Box>

            {/* Search and Filters */}
            <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={4}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Search departments..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            InputProps={{
                                startAdornment: <Search sx={{ color: 'text.secondary', mr: 1 }} />
                            }}
                            sx={{ bgcolor: 'background.default', borderRadius: 2 }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Head Doctor Status</InputLabel>
                            <Select
                                value={headDoctorFilter}
                                label="Head Doctor Status"
                                onChange={(e) => setHeadDoctorFilter(e.target.value)}
                            >
                                <MenuItem value="all">All Departments</MenuItem>
                                <MenuItem value="assigned">Head Assigned</MenuItem>
                                <MenuItem value="not_assigned">No Head</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Location</InputLabel>
                            <Select
                                value={locationFilter}
                                label="Location"
                                onChange={(e) => setLocationFilter(e.target.value)}
                            >
                                <MenuItem value="all">All Locations</MenuItem>
                                {uniqueLocations.map((loc) => (
                                    <MenuItem key={loc} value={loc}>{loc}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
            </Paper>

            <Paper elevation={0} sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                <TableContainer>
                    <Table>
                        <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 700 }}>Department ID</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Department</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Head Doctor</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Contact</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Doctors</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {paginatedDepartments.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            {searchQuery || headDoctorFilter !== 'all' || locationFilter !== 'all'
                                                ? 'No departments match your filters'
                                                : 'No departments found'}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedDepartments.map((dept) => (
                                    <TableRow key={dept.id} hover>
                                        <TableCell>
                                            <Chip
                                                label={`#${dept.id}`}
                                                size="small"
                                                sx={{
                                                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                                                    color: 'primary.main',
                                                    fontWeight: 700,
                                                    fontFamily: 'monospace'
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Avatar
                                                    variant="rounded"
                                                    sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}
                                                >
                                                    <MedicalServices />
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="subtitle2" fontWeight="700">
                                                        {dept.name}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {dept.code}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            {dept.head_doctor ? (
                                                <Chip
                                                    avatar={<Avatar>{dept.head_doctor.name.charAt(0)}</Avatar>}
                                                    label={dept.head_doctor.name}
                                                    size="small"
                                                    color="primary"
                                                    variant="outlined"
                                                />
                                            ) : (
                                                <Typography variant="caption" color="text.secondary" fontStyle="italic">
                                                    Not Assigned
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                                {dept.phone && (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Phone sx={{ fontSize: 14, color: 'text.secondary' }} />
                                                        <Typography variant="caption">{dept.phone}</Typography>
                                                    </Box>
                                                )}
                                                {dept.email && (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Email sx={{ fontSize: 14, color: 'text.secondary' }} />
                                                        <Typography variant="caption">{dept.email}</Typography>
                                                    </Box>
                                                )}
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={`${dept.doctors_count || 0} Doctors`}
                                                size="small"
                                                sx={{ bgcolor: alpha(theme.palette.info.main, 0.1), color: 'info.main', fontWeight: 600 }}
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <Tooltip title="Assign Doctors">
                                                <IconButton size="small" color="secondary" onClick={() => handleOpenAssignDialog(dept)}>
                                                    <PersonAdd />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="View Details">
                                                <IconButton size="small" color="info" onClick={() => handleViewDepartment(dept)}>
                                                    <Visibility />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Edit">
                                                <IconButton size="small" color="primary" onClick={() => handleOpenDialog(dept)}>
                                                    <Edit />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete">
                                                <IconButton size="small" color="error" onClick={() => handleDelete(dept.id)}>
                                                    <Delete />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="body2" color="text.secondary">
                        Showing {paginatedDepartments.length} of {filteredDepartments.length} departments
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">Rows per page:</Typography>
                        <Select
                            size="small"
                            value={rowsPerPage}
                            onChange={handleChangeRowsPerPage}
                            sx={{ minWidth: 70 }}
                        >
                            <MenuItem value={10}>10</MenuItem>
                            <MenuItem value={25}>25</MenuItem>
                            <MenuItem value={50}>50</MenuItem>
                        </Select>
                        <Button
                            size="small"
                            onClick={(e) => handleChangePage(e, page - 1)}
                            disabled={page === 0}
                        >
                            Previous
                        </Button>
                        <Typography variant="body2" sx={{ mx: 2 }}>
                            Page {page + 1} of {Math.ceil(filteredDepartments.length / rowsPerPage) || 1}
                        </Typography>
                        <Button
                            size="small"
                            onClick={(e) => handleChangePage(e, page + 1)}
                            disabled={page >= Math.ceil(filteredDepartments.length / rowsPerPage) - 1}
                        >
                            Next
                        </Button>
                    </Box>
                </Box>
            </Paper>

            {/* Create/Edit Dialog */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700 }}>
                    {selectedDepartment ? 'Edit Department' : 'Add New Department'}
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={3} sx={{ mt: 0.5 }}>
                        <Grid item xs={12} md={6}>
                            <TextField
                                label="Department Name"
                                placeholder="e.g., Cardiology, Neurology"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                fullWidth
                                required
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                label="Description"
                                placeholder="Brief description of the department"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                fullWidth
                                multiline
                                rows={2}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                label="Phone Number"
                                placeholder="e.g., +91 1234567890"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                fullWidth
                                InputProps={{
                                    startAdornment: <Phone sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                label="Email Address"
                                placeholder="e.g., cardiology@hospital.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                fullWidth
                                InputProps={{
                                    startAdornment: <Email sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                label="Location"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                fullWidth
                                placeholder="e.g. Building A, Floor 3"
                                InputProps={{
                                    startAdornment: <LocationOn sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                label="Operating Hours"
                                value={formData.operating_hours}
                                onChange={(e) => setFormData({ ...formData, operating_hours: e.target.value })}
                                fullWidth
                                placeholder="e.g. Mon-Fri: 8AM - 6PM"
                                InputProps={{
                                    startAdornment: <AccessTime sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />
                                }}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleSubmit} sx={{ px: 4 }}>
                        {selectedDepartment ? 'Update Department' : 'Create Department'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Assign Doctor Dialog */}
            <Dialog open={openAssignDialog} onClose={() => setOpenAssignDialog(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 2 }}>
                    <Box>
                        <Typography variant="h6" fontWeight="700">Assign Doctors</Typography>
                        <Typography variant="caption" color="text.secondary">{selectedDepartment?.name}</Typography>
                    </Box>
                    <IconButton onClick={() => setOpenAssignDialog(false)} size="small" sx={{ color: 'text.secondary' }}>
                        <Close />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" fontWeight="600" gutterBottom sx={{ mb: 2 }}>Add New Doctor</Typography>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Select Doctor</InputLabel>
                                <Select
                                    value={assignData.doctor_id}
                                    label="Select Doctor"
                                    onChange={(e) => setAssignData({ ...assignData, doctor_id: e.target.value })}
                                >
                                    {doctors
                                        .filter(d => !d.department_id || d.department_id !== selectedDepartment?.id)
                                        .map((doc) => (
                                            <MenuItem key={doc.id} value={doc.id}>
                                                {doc.user?.full_name || doc.name} ({doc.specialization})
                                            </MenuItem>
                                        ))}
                                </Select>
                            </FormControl>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={assignData.is_head}
                                        onChange={(e) => setAssignData({ ...assignData, is_head: e.target.checked })}
                                        disabled={!!selectedDepartment?.head_doctor_id && selectedDepartment.head_doctor_id !== assignData.doctor_id}
                                    />
                                }
                                label="Head"
                                sx={{ whiteSpace: 'nowrap' }}
                            />
                            <Button
                                variant="contained"
                                onClick={handleAssignDoctor}
                                disabled={!assignData.doctor_id}
                                sx={{ px: 3 }}
                            >
                                Add
                            </Button>
                        </Box>
                        {selectedDepartment?.head_doctor_id && (
                            <Typography variant="caption" color="warning.main" sx={{ mt: 1.5, display: 'block' }}>
                                * Department already has a head doctor assigned
                            </Typography>
                        )}
                    </Box>

                    <Divider sx={{ my: 3 }} />

                    <Typography variant="subtitle2" fontWeight="600" gutterBottom sx={{ mb: 2 }}>Current Doctors ({departmentDoctors.length})</Typography>
                    <List sx={{ bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider', maxHeight: 300, overflow: 'auto' }}>
                        {departmentDoctors.length === 0 ? (
                            <ListItem sx={{ py: 3 }}>
                                <ListItemText
                                    primary="No doctors assigned yet"
                                    sx={{ color: 'text.secondary', textAlign: 'center' }}
                                    primaryTypographyProps={{ fontStyle: 'italic' }}
                                />
                            </ListItem>
                        ) : (
                            departmentDoctors.map((doc, index) => (
                                <React.Fragment key={doc.id}>
                                    <ListItem sx={{ py: 1.5 }}>
                                        <ListItemAvatar>
                                            <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
                                                {doc.name?.charAt(0)}
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Typography variant="body2" fontWeight="600">{doc.name}</Typography>
                                                    {selectedDepartment?.head_doctor_id === doc.id && (
                                                        <Chip label="HEAD" size="small" color="primary" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600 }} />
                                                    )}
                                                </Box>
                                            }
                                            secondary={doc.specialization}
                                        />
                                        <ListItemSecondaryAction>
                                            <IconButton edge="end" size="small" color="error" onClick={() => handleRemoveDoctor(doc.id)}>
                                                <Delete />
                                            </IconButton>
                                        </ListItemSecondaryAction>
                                    </ListItem>
                                    {index < departmentDoctors.length - 1 && <Divider component="li" />}
                                </React.Fragment>
                            ))
                        )}
                    </List>
                </DialogContent>
            </Dialog>

            {/* View Details Dialog */}
            {/* View Details Dialog */}
            <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ bgcolor: 'primary.light', mr: 2 }}>
                            <MedicalServices />
                        </Avatar>
                        <Box>
                            <Typography variant="h6" fontWeight="700">
                                Department Details
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                ID: #{selectedDepartment?.id}
                            </Typography>
                        </Box>
                    </Box>
                    <IconButton onClick={() => setOpenViewDialog(false)}>
                        <Close />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ p: 4 }}>
                    {selectedDepartment && (
                        <Box>
                            {/* Header Info */}
                            <Paper elevation={0} sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 3, mb: 4, border: '1px solid', borderColor: 'divider' }}>
                                <Grid container spacing={3}>
                                    {/* Code field removed as requested */}
                                    <Grid item xs={12} sm={6} md={3}>
                                        <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ display: 'block', mb: 0.5 }}>
                                            LOCATION
                                        </Typography>
                                        <Typography variant="body2" fontWeight="500">
                                            {selectedDepartment.location || 'N/A'}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={3}>
                                        <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ display: 'block', mb: 0.5 }}>
                                            PHONE
                                        </Typography>
                                        <Typography variant="body2" fontWeight="500">
                                            {selectedDepartment.phone || 'N/A'}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={3}>
                                        <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ display: 'block', mb: 0.5 }}>
                                            EMAIL
                                        </Typography>
                                        <Typography variant="body2" fontWeight="500" sx={{ wordBreak: 'break-word' }}>
                                            {selectedDepartment.email || 'N/A'}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </Paper>

                            <Grid container spacing={4}>
                                {/* Head Doctor Info */}
                                <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle2" fontWeight="700" gutterBottom sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>
                                        Head of Department
                                    </Typography>
                                    <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                                        {selectedDepartment.head_doctor ? (
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <Avatar
                                                    src={selectedDepartment.head_doctor.user?.profile_picture}
                                                    sx={{ width: 40, height: 40, mr: 2, bgcolor: 'primary.main' }}
                                                >
                                                    {selectedDepartment.head_doctor.name.charAt(0)}
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="subtitle1" fontWeight="600">
                                                        {selectedDepartment.head_doctor.name}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {selectedDepartment.head_doctor.specialization}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary" fontStyle="italic">
                                                No Head Doctor Assigned
                                            </Typography>
                                        )}
                                    </Paper>
                                </Grid>

                                {/* Operating Hours / Stats */}
                                <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle2" fontWeight="700" gutterBottom sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>
                                        Overview
                                    </Typography>
                                    <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                                        <Grid container spacing={2}>
                                            <Grid item xs={6}>
                                                <Typography variant="caption" color="text.secondary">Doctors</Typography>
                                                <Typography variant="h6" fontWeight="600">{selectedDepartment.doctors_count || 0}</Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography variant="caption" color="text.secondary">Operating Hours</Typography>
                                                <Typography variant="body2" fontWeight="500">{selectedDepartment.operating_hours || 'N/A'}</Typography>
                                            </Grid>
                                        </Grid>
                                    </Paper>
                                </Grid>

                                {/* Description */}
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" fontWeight="700" gutterBottom sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1, mt: 2 }}>
                                        Description
                                    </Typography>
                                    <Paper elevation={0} sx={{ p: 3, bgcolor: '#f8fafc', borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                                        <Typography variant="body1" color="text.primary">
                                            {selectedDepartment.description || 'No description available.'}
                                        </Typography>
                                    </Paper>
                                </Grid>
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
        </Box>
    );
};

export default Departments;
