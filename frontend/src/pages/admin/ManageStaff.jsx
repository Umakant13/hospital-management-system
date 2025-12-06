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
    TextField,
    InputAdornment,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Grid,
    Avatar,
    Tooltip,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
} from '@mui/material';
import {
    Add,
    Search,
    Edit,
    Visibility,
    Delete,
    Badge,
    Work,
    CheckCircle,
    Block,
} from '@mui/icons-material';
import staffService from '@/services/staffService';
import { userService } from '@/services/userService';
import { departmentService } from '@/services/departmentService';
import { useForm } from 'react-hook-form';
import { getInitials } from '@/utils/helpers';
import PageTitle from '@/components/common/PageTitle';
import AIFillButton from '@/components/common/AIFillButton';

const ManageStaff = () => {
    const [staff, setStaff] = useState([]);
    const [users, setUsers] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [openViewDialog, setOpenViewDialog] = useState(false);

    const { register, handleSubmit, reset, formState: { errors } } = useForm();

    const staffCategories = [
        { value: 'nurse', label: 'Nurse' },
        { value: 'receptionist', label: 'Receptionist' },
        { value: 'lab_technician', label: 'Lab Technician' },
        { value: 'pharmacist', label: 'Pharmacist' },
        { value: 'administrator', label: 'Administrator' },
        { value: 'support_staff', label: 'Support Staff' },
    ];

    const employmentTypes = [
        { value: 'full_time', label: 'Full Time' },
        { value: 'part_time', label: 'Part Time' },
        { value: 'contract', label: 'Contract' },
    ];

    useEffect(() => {
        fetchStaff();
        fetchUsers();
        fetchDepartments();
    }, [page, rowsPerPage, searchQuery, categoryFilter, statusFilter]);

    const fetchStaff = async () => {
        try {
            const params = {
                skip: page * rowsPerPage,
                limit: rowsPerPage,
                search: searchQuery,
                category: categoryFilter,
            };

            if (statusFilter !== '') params.is_active = statusFilter === 'active';

            const data = await staffService.getAllStaff(params);
            setStaff(data);
        } catch (error) {
            console.error('Error fetching staff:', error);
        }
    };

    const fetchUsers = async () => {
        try {
            const data = await userService.getAllUsers({ role: 'staff' });
            setUsers(data);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const fetchDepartments = async () => {
        try {
            const data = await departmentService.getAllDepartments();
            setDepartments(data);
        } catch (error) {
            console.error('Error fetching departments:', error);
        }
    };

    const handleOpenDialog = (staffMember = null) => {
        setSelectedStaff(staffMember);
        if (staffMember) {
            reset(staffMember);
        } else {
            reset({
                employment_type: 'full_time',
                is_active: true,
                experience_years: 0,
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedStaff(null);
        reset({});
    };

    const handleOpenViewDialog = (staffMember) => {
        setSelectedStaff(staffMember);
        setOpenViewDialog(true);
    };

    const handleCloseViewDialog = () => {
        setOpenViewDialog(false);
        setSelectedStaff(null);
    };

    const handleSaveStaff = async (data) => {
        try {
            if (selectedStaff) {
                await staffService.updateStaff(selectedStaff.staff_id, data);
            } else {
                await staffService.createStaff(data);
            }
            handleCloseDialog();
            fetchStaff();
        } catch (error) {
            console.error('Error saving staff:', error);
        }
    };

    const handleDeleteStaff = async (staffId) => {
        if (window.confirm('Are you sure you want to delete this staff member?')) {
            try {
                await staffService.deleteStaff(staffId);
                fetchStaff();
            } catch (error) {
                console.error('Error deleting staff:', error);
                alert('Failed to delete staff member');
            }
        }
    };

    const handleToggleActive = async (staffId, currentStatus) => {
        try {
            await staffService.updateStaff(staffId, { is_active: !currentStatus });
            fetchStaff();
        } catch (error) {
            console.error('Error toggling staff status:', error);
            alert('Failed to update staff status');
        }
    };

    const getCategoryColor = (category) => {
        const colors = {
            nurse: 'success',
            receptionist: 'info',
            lab_technician: 'warning',
            pharmacist: 'secondary',
            administrator: 'error',
            support_staff: 'default',
        };
        return colors[category] || 'default';
    };

    const formatCategory = (category) => {
        return category.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <PageTitle>
                    Manage Staff
                </PageTitle>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => handleOpenDialog()}
                >
                    Add Staff
                </Button>
            </Box>

            <Paper elevation={2} sx={{ p: 3 }}>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} md={4}>
                        <TextField
                            fullWidth
                            placeholder="Search by name, staff ID, employee ID..."
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
                    <Grid item xs={12} md={2}>
                        <FormControl fullWidth>
                            <InputLabel>Category</InputLabel>
                            <Select
                                value={categoryFilter}
                                label="Category"
                                onChange={(e) => {
                                    setCategoryFilter(e.target.value);
                                    setPage(0);
                                }}
                            >
                                <MenuItem value="">All</MenuItem>
                                {staffCategories.map((cat) => (
                                    <MenuItem key={cat.value} value={cat.value}>
                                        {cat.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} md={2}>
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
                                <MenuItem value="">All</MenuItem>
                                <MenuItem value="active">Active</MenuItem>
                                <MenuItem value="inactive">Inactive</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>

                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Staff Member</TableCell>
                                <TableCell>Staff ID</TableCell>
                                <TableCell>Employee ID</TableCell>
                                <TableCell>Category</TableCell>
                                <TableCell>Position</TableCell>
                                <TableCell>Department</TableCell>
                                <TableCell>Employment Type</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {staff.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                                        <Typography variant="body1" color="text.secondary">
                                            No staff members found. Click "Add Staff" to create one.
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                staff.map((staffMember) => (
                                    <TableRow key={staffMember.id} hover>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <Avatar sx={{ mr: 2, bgcolor: getCategoryColor(staffMember.category) + '.main' }}>
                                                    {getInitials(staffMember.user?.full_name || 'S')}
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="body1" fontWeight="medium">
                                                        {staffMember.user?.full_name}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {staffMember.user?.email}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={staffMember.staff_id} size="small" variant="outlined" />
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={staffMember.employee_id} size="small" />
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                icon={<Badge />}
                                                label={formatCategory(staffMember.category)}
                                                size="small"
                                                color={getCategoryColor(staffMember.category)}
                                            />
                                        </TableCell>
                                        <TableCell>{staffMember.position}</TableCell>
                                        <TableCell>
                                            {staffMember.department?.name || 'Not Assigned'}
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                icon={<Work />}
                                                label={formatCategory(staffMember.employment_type)}
                                                size="small"
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={staffMember.is_active ? 'Active' : 'Inactive'}
                                                size="small"
                                                color={staffMember.is_active ? 'success' : 'default'}
                                            />
                                        </TableCell>
                                        <TableCell align="right" sx={{ whiteSpace: 'nowrap', minWidth: 150 }}>
                                            <Tooltip title="View">
                                                <IconButton size="small" color="info" onClick={() => handleOpenViewDialog(staffMember)}>
                                                    <Visibility />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Edit">
                                                <IconButton
                                                    size="small"
                                                    color="primary"
                                                    onClick={() => handleOpenDialog(staffMember)}
                                                >
                                                    <Edit />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title={staffMember.is_active ? 'Deactivate' : 'Activate'}>
                                                <IconButton
                                                    size="small"
                                                    color={staffMember.is_active ? 'warning' : 'success'}
                                                    onClick={() => handleToggleActive(staffMember.staff_id, staffMember.is_active)}
                                                >
                                                    {staffMember.is_active ? <Block /> : <CheckCircle />}
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete">
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => handleDeleteStaff(staffMember.staff_id)}
                                                >
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

            {/* View Staff Details Dialog */}
            <Dialog open={openViewDialog} onClose={handleCloseViewDialog} maxWidth="md" fullWidth>
                <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'white', color: 'primary.main' }}>
                        {selectedStaff && getInitials(selectedStaff.user?.full_name)}
                    </Avatar>
                    <Box>
                        <Typography variant="h6">
                            {selectedStaff?.user?.full_name}
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>
                            {selectedStaff && formatCategory(selectedStaff.category)}
                        </Typography>
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    {selectedStaff && (
                        <Grid container spacing={3}>
                            {/* Professional Information */}
                            <Grid item xs={12}>
                                <Typography variant="h6" color="primary" gutterBottom sx={{ borderBottom: 1, borderColor: 'divider', pb: 1 }}>
                                    Professional Information
                                </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="text.secondary">Staff ID</Typography>
                                <Typography variant="body1">{selectedStaff.staff_id}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="text.secondary">Employee ID</Typography>
                                <Typography variant="body1">{selectedStaff.employee_id}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="text.secondary">Category</Typography>
                                <Chip
                                    label={formatCategory(selectedStaff.category)}
                                    color={getCategoryColor(selectedStaff.category)}
                                    size="small"
                                    sx={{ mt: 0.5 }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="text.secondary">Position</Typography>
                                <Typography variant="body1">{selectedStaff.position}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="text.secondary">Department</Typography>
                                <Chip
                                    label={selectedStaff.department?.name || 'Not Assigned'}
                                    color="primary"
                                    variant="outlined"
                                    size="small"
                                    sx={{ mt: 0.5 }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="text.secondary">Qualification</Typography>
                                <Typography variant="body1">{selectedStaff.qualification || 'N/A'}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="text.secondary">Experience</Typography>
                                <Typography variant="body1">{selectedStaff.experience_years} years</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="text.secondary">Joining Date</Typography>
                                <Typography variant="body1">{new Date(selectedStaff.joining_date).toLocaleDateString()}</Typography>
                            </Grid>

                            {/* Employment Details */}
                            <Grid item xs={12}>
                                <Typography variant="h6" color="primary" gutterBottom sx={{ borderBottom: 1, borderColor: 'divider', pb: 1, mt: 2 }}>
                                    Employment Details
                                </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="text.secondary">Employment Type</Typography>
                                <Chip
                                    label={formatCategory(selectedStaff.employment_type)}
                                    variant="outlined"
                                    size="small"
                                    sx={{ mt: 0.5 }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="text.secondary">Shift Timing</Typography>
                                <Typography variant="body1">{selectedStaff.shift_timing || 'N/A'}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="text.secondary">Salary</Typography>
                                <Typography variant="body1" fontWeight="medium" color="success.main">
                                    {selectedStaff.salary ? `₹${selectedStaff.salary.toLocaleString()}` : 'N/A'}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                                <Chip
                                    label={selectedStaff.is_active ? 'Active' : 'Inactive'}
                                    color={selectedStaff.is_active ? 'success' : 'default'}
                                    size="small"
                                    sx={{ mt: 0.5 }}
                                />
                            </Grid>

                            {/* Contact Information */}
                            <Grid item xs={12}>
                                <Typography variant="h6" color="primary" gutterBottom sx={{ borderBottom: 1, borderColor: 'divider', pb: 1, mt: 2 }}>
                                    Contact Information
                                </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                                <Typography variant="body1">{selectedStaff.user?.email}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="text.secondary">Phone</Typography>
                                <Typography variant="body1">{selectedStaff.user?.phone || 'N/A'}</Typography>
                            </Grid>
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseViewDialog} variant="contained">Close</Button>
                </DialogActions>
            </Dialog>

            {/* Add/Edit Staff Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle>
                    {selectedStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
                    {!selectedStaff && (
                        <Box sx={{ ml: 2, display: 'inline-block' }}>
                            <AIFillButton
                                fieldDescriptions={{
                                    employee_id: "Employee ID format like NRS-ABC123, RCP-XYZ456, LBT-DEF789",
                                    category: "One of: nurse, receptionist, lab_technician, pharmacist, administrator, support_staff",
                                    position: "Job position/title (e.g., Senior Nurse, Front Desk Receptionist)",
                                    qualification: "Educational qualifications (e.g., BSc Nursing, Diploma in Pharmacy)",
                                    joining_date: "Date in YYYY-MM-DD format",
                                    experience_years: "Years of experience (number between 0-40)",
                                    shift_timing: "Shift hours (e.g., 9:00 AM - 5:00 PM, Night Shift 10:00 PM - 6:00 AM)",
                                    salary: "Salary amount in rupees (number between 15000-100000)",
                                    employment_type: "One of: full_time, part_time, contract"
                                }}
                                onFill={(data) => {
                                    reset({ ...data });
                                }}
                            />
                        </Box>
                    )}
                </DialogTitle>
                <DialogContent>
                    <Box component="form" sx={{ mt: 2 }}>
                        <Grid container spacing={2}>
                            {!selectedStaff && (
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        select
                                        label="Select User (Optional)"
                                        {...register('user_id')}
                                    >
                                        <MenuItem value="">Create New User</MenuItem>
                                        {users.map((user) => (
                                            <MenuItem key={user.id} value={user.id}>
                                                {user.full_name} (@{user.username})
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>
                            )}

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Employee ID"
                                    InputLabelProps={{ shrink: true }}
                                    {...register('employee_id', { required: 'Employee ID is required' })}
                                    error={!!errors.employee_id}
                                    helperText={errors.employee_id?.message}
                                    disabled={!!selectedStaff}
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    select
                                    label="Category"
                                    InputLabelProps={{ shrink: true }}
                                    {...register('category', { required: 'Category is required' })}
                                    error={!!errors.category}
                                    helperText={errors.category?.message}
                                >
                                    {staffCategories.map((cat) => (
                                        <MenuItem key={cat.value} value={cat.value}>
                                            {cat.label}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Position/Title"
                                    InputLabelProps={{ shrink: true }}
                                    {...register('position', { required: 'Position is required' })}
                                    error={!!errors.position}
                                    helperText={errors.position?.message}
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    select
                                    label="Department"
                                    InputLabelProps={{ shrink: true }}
                                    {...register('department_id')}
                                >
                                    <MenuItem value="">None</MenuItem>
                                    {departments.map((dept) => (
                                        <MenuItem key={dept.id} value={dept.id}>
                                            {dept.name}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Qualification"
                                    InputLabelProps={{ shrink: true }}
                                    {...register('qualification')}
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    type="date"
                                    label="Joining Date"
                                    InputLabelProps={{ shrink: true }}
                                    {...register('joining_date', { required: 'Joining date is required' })}
                                    error={!!errors.joining_date}
                                    helperText={errors.joining_date?.message}
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    label="Experience (years)"
                                    {...register('experience_years', { min: 0, max: 50 })}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    select
                                    label="Employment Type"
                                    InputLabelProps={{ shrink: true }}
                                    {...register('employment_type')}
                                >
                                    {employmentTypes.map((type) => (
                                        <MenuItem key={type.value} value={type.value}>
                                            {type.label}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Shift Timing"
                                    InputLabelProps={{ shrink: true }}
                                    {...register('shift_timing')}
                                    placeholder="e.g., 9:00 AM - 5:00 PM"
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    label="Salary (₹)"
                                    {...register('salary', { min: 0 })}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    select
                                    label="Status"
                                    InputLabelProps={{ shrink: true }}
                                    {...register('is_active')}
                                >
                                    <MenuItem value={true}>Active</MenuItem>
                                    <MenuItem value={false}>Inactive</MenuItem>
                                </TextField>
                            </Grid>
                        </Grid>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleSubmit(handleSaveStaff)}
                    >
                        {selectedStaff ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ManageStaff;
