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
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
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
  Payment,
  Print,
  AttachMoney,
  Search,
  Close,
  Download,
} from '@mui/icons-material';
import { billingService } from '@/services/billingService';
import { patientService } from '@/services/patientService';
import { razorpayService } from '@/services/razorpayService';
// eslint-disable-next-line no-unused-vars
import { appointmentService } from '@/services/appointmentService';
import { useForm } from 'react-hook-form';
import { formatDateTime } from '@/utils/helpers';
import { formatCurrency } from '@/utils/constants';
import PageTitle from '@/components/common/PageTitle';
import AIFillButton from '@/components/common/AIFillButton';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const Billing = () => {
  const [bills, setBills] = useState([]);
  const [patients, setPatients] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [openDialog, setOpenDialog] = useState(false);
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [viewBill, setViewBill] = useState(null);

  // eslint-disable-next-line no-unused-vars
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm();
  const { register: registerPayment, handleSubmit: handleSubmitPayment, reset: resetPayment } = useForm();

  const consultationFee = watch('consultation_fee', 0);
  const medicationCharges = watch('medication_charges', 0);
  const labCharges = watch('lab_charges', 0);
  const otherCharges = watch('other_charges', 0);
  const tax = watch('tax', 0);
  const discount = watch('discount', 0);

  const subtotal = parseFloat(consultationFee || 0) + parseFloat(medicationCharges || 0) +
    parseFloat(labCharges || 0) + parseFloat(otherCharges || 0);
  const total = subtotal + parseFloat(tax || 0) - parseFloat(discount || 0);

  useEffect(() => {
    fetchBills();
    fetchPatients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, searchQuery, statusFilter, dateFilter]);

  const fetchBills = async () => {
    try {
      const params = {
        skip: page * rowsPerPage,
        limit: rowsPerPage,
        search: searchQuery,
      };

      if (statusFilter) params.payment_status = statusFilter;
      if (dateFilter !== 'all') params.date_range = dateFilter;

      const data = await billingService.getAllBills(params);
      setBills(data);
    } catch (error) {
      console.error('Error fetching bills:', error);
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

  const handleOpenDialog = (bill = null) => {
    setSelectedBill(bill);
    if (bill) {
      reset(bill);
    } else {
      reset({
        consultation_fee: 0,
        medication_charges: 0,
        lab_charges: 0,
        other_charges: 0,
        tax: 0,
        discount: 0,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedBill(null);
    reset({});
  };

  const handleSaveBill = async (data) => {
    try {
      const billData = {
        ...data,
        bill_date: new Date().toISOString(),
      };

      if (selectedBill) {
        await billingService.updateBill(selectedBill.bill_id, billData);
      } else {
        await billingService.createBill(billData);
      }
      handleCloseDialog();
      fetchBills();
    } catch (error) {
      console.error('Error saving bill:', error);
      alert('Failed to save bill');
    }
  };

  const handleOpenPaymentDialog = (bill) => {
    setSelectedBill(bill);
    resetPayment({ amount: bill.balance });
    setOpenPaymentDialog(true);
  };

  const handleClosePaymentDialog = () => {
    setOpenPaymentDialog(false);
    setSelectedBill(null);
    resetPayment({});
  };

  const handleAddPayment = async (data) => {
    try {
      // If payment method is online, use Razorpay
      if (data.payment_method === 'online' || data.payment_method === 'razorpay') {
        await handleRazorpayPayment(data.amount);
      } else {
        // Regular payment methods (cash, card, etc.)
        await billingService.addPayment(selectedBill.bill_id, data);
        handleClosePaymentDialog();
        fetchBills();
      }
    } catch (error) {
      console.error('Error adding payment:', error);
      alert(error.response?.data?.detail || 'Failed to add payment');
    }
  };

  const handleRazorpayPayment = async (amount) => {
    try {
      // Create Razorpay order
      const orderData = await razorpayService.createOrder(
        amount,
        selectedBill.bill_id,
        selectedBill.patient?.name
      );

      // Add patient details to order
      orderData.patient_name = selectedBill.patient?.name;
      orderData.patient_email = selectedBill.patient?.email || '';
      orderData.patient_contact = selectedBill.patient?.phone || '';

      // Open Razorpay checkout
      await razorpayService.openCheckout(
        orderData,
        (response) => {
          // Payment successful
          alert('Payment successful!');
          handleClosePaymentDialog();
          fetchBills();
        },
        (error) => {
          // Payment failed
          console.error('Payment failed:', error);
          alert('Payment failed or cancelled');
        }
      );
    } catch (error) {
      console.error('Error initiating Razorpay payment:', error);
      alert('Failed to initiate payment');
    }
  };

  const handleDelete = async (billId) => {
    if (window.confirm('Are you sure you want to delete this bill?')) {
      try {
        await billingService.deleteBill(billId);
        fetchBills();
      } catch (error) {
        console.error('Error deleting bill:', error);
      }
    }
  };

  const handleViewBill = (bill) => {
    setViewBill(bill);
  };

  const handleCloseViewBill = () => {
    setViewBill(null);
  };

  const generateInvoice = (bill) => {
    const doc = new jsPDF();

    // Helper function for PDF currency formatting
    const formatPDFCurrency = (amount) => {
      return `Rs ${Number(amount).toFixed(2)}`;
    };

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

    // Invoice Title
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('INVOICE', 105, 40, { align: 'center' });

    // Bill Details
    doc.setFontSize(10);
    doc.text(`Invoice #: ${bill.bill_id}`, 20, 52);
    doc.text(`Date: ${formatDateTime(bill.bill_date)}`, 20, 58);
    doc.text(`Patient: ${bill.patient?.name || 'N/A'}`, 20, 64);

    // Status Badge
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    const statusColor = bill.payment_status === 'paid' ? [76, 175, 80] : [255, 152, 0];
    doc.setTextColor(...statusColor);
    doc.text(`Status: ${bill.payment_status.toUpperCase()}`, 150, 52);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(0, 0, 0);

    // Items Table
    const tableColumn = ["Description", "Amount"];
    const tableRows = [
      ["Consultation Fee", formatPDFCurrency(bill.consultation_fee)],
      ["Medication Charges", formatPDFCurrency(bill.medication_charges)],
      ["Lab Charges", formatPDFCurrency(bill.lab_charges)],
      ["Other Charges", formatPDFCurrency(bill.other_charges)],
    ];

    doc.autoTable({
      startY: 75,
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [33, 150, 243], textColor: [255, 255, 255] },
      styles: { fontSize: 10 },
      columnStyles: {
        0: { cellWidth: 130 },
        1: { cellWidth: 50, halign: 'right' }
      }
    });

    // Totals Section
    const finalY = doc.lastAutoTable.finalY + 10;
    const rightX = 150;

    doc.setFontSize(10);
    doc.text('Subtotal:', rightX, finalY);
    doc.text(formatPDFCurrency(bill.subtotal), 185, finalY, { align: 'right' });

    doc.text('Tax:', rightX, finalY + 6);
    doc.text(formatPDFCurrency(bill.tax), 185, finalY + 6, { align: 'right' });

    doc.text('Discount:', rightX, finalY + 12);
    doc.text(`${formatPDFCurrency(bill.discount)}`, 185, finalY + 12, { align: 'right' });

    doc.setDrawColor(200, 200, 200);
    doc.line(rightX, finalY + 15, 185, finalY + 15);

    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Total:', rightX, finalY + 22);
    doc.text(formatPDFCurrency(bill.total_amount), 185, finalY + 22, { align: 'right' });

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text('Paid:', rightX, finalY + 30);
    doc.text(formatPDFCurrency(bill.paid_amount), 185, finalY + 30, { align: 'right' });




    // Footer
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.setFont(undefined, 'normal');
    doc.text('Thank you for choosing HealthCare Plus Hospital.', 105, 270, { align: 'center' });
    doc.text('For any queries, please contact our billing department.', 105, 275, { align: 'center' });
    doc.text('This is a computer-generated invoice.', 105, 280, { align: 'center' });

    doc.save(`Invoice_${bill.bill_id}.pdf`);
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      partial: 'info',
      paid: 'success',
      overdue: 'error',
      cancelled: 'default',
    };
    return colors[status] || 'default';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <PageTitle>
          Billing
        </PageTitle>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Create Bill
        </Button>
      </Box>

      <Paper elevation={2} sx={{ p: 3 }}>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search by patient name or bill ID..."
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
              <InputLabel>Payment Status</InputLabel>
              <Select
                value={statusFilter}
                label="Payment Status"
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="partial">Partial</MenuItem>
                <MenuItem value="paid">Paid</MenuItem>
                <MenuItem value="overdue">Overdue</MenuItem>
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
                <TableCell>Bill ID</TableCell>
                <TableCell>Patient</TableCell>
                <TableCell>Bill Date</TableCell>
                <TableCell>Total Amount</TableCell>
                <TableCell>Paid</TableCell>
                <TableCell>Balance</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bills.map((bill) => (
                <TableRow key={bill.id} hover>
                  <TableCell>
                    <Chip label={bill.bill_id} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>{bill.patient?.name || 'N/A'}</TableCell>
                  <TableCell>{formatDateTime(bill.bill_date)}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {formatCurrency(bill.total_amount || 0)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="success.main">
                      {formatCurrency(bill.paid_amount || 0)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="error.main">
                      {formatCurrency(bill.balance || 0)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={bill.payment_status}
                      size="small"
                      color={getPaymentStatusColor(bill.payment_status)}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="View Invoice">
                      <IconButton
                        size="small"
                        color="info"
                        onClick={() => handleViewBill(bill)}
                      >
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                    {bill.balance > 0 && (
                      <Tooltip title="Add Payment">
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => handleOpenPaymentDialog(bill)}
                        >
                          <Payment />
                        </IconButton>
                      </Tooltip>
                    )}
                    {bill.payment_status !== 'paid' && (
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleOpenDialog(bill)}
                        >
                          <Edit />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(bill.bill_id)}
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

      {/* Create/Edit Bill Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedBill ? 'Edit Bill' : 'Create New Bill'}
          {!selectedBill && (
            <Box sx={{ ml: 2, display: 'inline-block' }}>
              <AIFillButton
                fieldDescriptions={{
                  consultation_fee: 'Consultation fee amount (number)',
                  medication_charges: 'Medication charges amount (number)',
                  lab_charges: 'Lab test charges amount (number)',
                  other_charges: 'Other miscellaneous charges (number)',
                  notes: 'Additional notes or comments for the bill',
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
              <Grid item xs={12}>
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
                  type="datetime-local"
                  label="Due Date"
                  {...register('due_date')}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Consultation Fee (₹)"
                  {...register('consultation_fee')}
                  inputProps={{ step: 0.01, min: 0 }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Medication Charges (₹)"
                  {...register('medication_charges')}
                  inputProps={{ step: 0.01, min: 0 }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Lab Charges (₹)"
                  {...register('lab_charges')}
                  inputProps={{ step: 0.01, min: 0 }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Other Charges (₹)"
                  {...register('other_charges')}
                  inputProps={{ step: 0.01, min: 0 }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Tax (₹)"
                  {...register('tax')}
                  inputProps={{ step: 0.01, min: 0 }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Discount (₹)"
                  {...register('discount')}
                  inputProps={{ step: 0.01, min: 0 }}
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body1">Subtotal:</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {formatCurrency(subtotal)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body1">Tax:</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {formatCurrency(parseFloat(tax || 0))}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body1">Discount:</Typography>
                  <Typography variant="body1" fontWeight="medium" color="error">
                    -{formatCurrency(parseFloat(discount || 0))}
                  </Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="h6">Total Amount:</Typography>
                  <Typography variant="h6" color="primary" fontWeight="bold">
                    {formatCurrency(total)}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Notes"
                  {...register('notes')}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit(handleSaveBill)}
          >
            {selectedBill ? 'Update Bill' : 'Create Bill'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Payment Dialog */}
      <Dialog open={openPaymentDialog} onClose={handleClosePaymentDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Add Payment</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Bill Details
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Bill ID:</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {selectedBill?.bill_id}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Total Amount:</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {formatCurrency(selectedBill?.total_amount || 0)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Paid Amount:</Typography>
                  <Typography variant="body2" color="success.main" fontWeight="bold">
                    {formatCurrency(selectedBill?.paid_amount || 0)}
                  </Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body1" fontWeight="bold">Outstanding Balance:</Typography>
                  <Typography variant="body1" color="error.main" fontWeight="bold">
                    {formatCurrency(selectedBill?.balance || 0)}
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Payment Amount (₹)"
                  {...registerPayment('amount', {
                    required: 'Amount is required',
                    min: { value: 0.01, message: 'Amount must be greater than 0' },
                    max: { value: selectedBill?.balance, message: 'Amount cannot exceed balance' }
                  })}
                  inputProps={{ step: 0.01, min: 0.01, max: selectedBill?.balance }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="Payment Method"
                  {...registerPayment('payment_method', { required: 'Payment method is required' })}
                >
                  <MenuItem value="cash">Cash</MenuItem>
                  <MenuItem value="card">Credit/Debit Card</MenuItem>
                  <MenuItem value="razorpay">Razorpay (Online)</MenuItem>
                  <MenuItem value="insurance">Insurance</MenuItem>
                  <MenuItem value="cheque">Cheque</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Notes"
                  {...registerPayment('notes')}
                  placeholder="Payment reference or additional notes..."
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePaymentDialog}>Cancel</Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<Payment />}
            onClick={handleSubmitPayment(handleAddPayment)}
          >
            Add Payment
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Bill Dialog */}
      <Dialog open={Boolean(viewBill)} onClose={handleCloseViewBill} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Invoice Details</Typography>
            <IconButton onClick={handleCloseViewBill}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {viewBill && (
            <Box>
              <Card variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Hospital Management System
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Invoice #{viewBill.bill_id}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Date: {new Date(viewBill.bill_date).toLocaleDateString()}
                  </Typography>
                </CardContent>
              </Card>

              <Card variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>
                    Patient Information
                  </Typography>
                  <Typography variant="body2">
                    Name: {viewBill.patient?.name}
                  </Typography>
                </CardContent>
              </Card>

              <Typography variant="subtitle2" gutterBottom>
                Charges Breakdown
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText primary="Consultation Fee" />
                  <Typography variant="body2">{formatCurrency(viewBill.consultation_fee || 0)}</Typography>
                </ListItem>
                <ListItem>
                  <ListItemText primary="Medication Charges" />
                  <Typography variant="body2">{formatCurrency(viewBill.medication_charges || 0)}</Typography>
                </ListItem>
                <ListItem>
                  <ListItemText primary="Lab Charges" />
                  <Typography variant="body2">{formatCurrency(viewBill.lab_charges || 0)}</Typography>
                </ListItem>
                <ListItem>
                  <ListItemText primary="Other Charges" />
                  <Typography variant="body2">{formatCurrency(viewBill.other_charges || 0)}</Typography>
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText primary="Subtotal" />
                  <Typography variant="body2" fontWeight="medium">
                    {formatCurrency(viewBill.subtotal || 0)}
                  </Typography>
                </ListItem>
                <ListItem>
                  <ListItemText primary="Tax" />
                  <Typography variant="body2">{formatCurrency(viewBill.tax || 0)}</Typography>
                </ListItem>
                <ListItem>
                  <ListItemText primary="Discount" />
                  <Typography variant="body2" color="error">
                    {formatCurrency(viewBill.discount || 0)}
                  </Typography>
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText primary="Total Amount" primaryTypographyProps={{ variant: 'h6', component: 'div' }} />
                  <Typography variant="h6" color="primary" fontWeight="bold">
                    {formatCurrency(viewBill.total_amount || 0)}
                  </Typography>
                </ListItem>
                <ListItem>
                  <ListItemText primary="Paid Amount" />
                  <Typography variant="body1" color="success.main" fontWeight="bold">
                    {formatCurrency(viewBill.paid_amount || 0)}
                  </Typography>
                </ListItem>

                <ListItem>
                  <ListItemText primary={<Typography variant="h6">Balance Due</Typography>}
                  />
                  <Typography variant="h6" color="error.main" fontWeight="bold">
                    {formatCurrency(viewBill.balance || 0)}
                  </Typography>
                </ListItem>

              </List>

              <Card variant="outlined" sx={{ mt: 2, bgcolor: 'background.default' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" color="text.secondary">Payment Status:</Typography>
                    <Chip
                      label={viewBill.payment_status}
                      size="small"
                      color={getPaymentStatusColor(viewBill.payment_status)}
                    />
                  </Box>
                  {viewBill.notes && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Notes: {viewBill.notes}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="contained" startIcon={<Download />} onClick={() => generateInvoice(viewBill)}>
            Download Invoice
          </Button>
          <Button onClick={handleCloseViewBill}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Billing;