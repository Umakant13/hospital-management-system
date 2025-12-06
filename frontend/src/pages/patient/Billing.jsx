import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  Snackbar,
  Alert,
  useTheme,
  alpha,
  Avatar,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Receipt,
  Payment,
  CheckCircle,
  Warning,
  Download,
  AccountBalanceWallet,
  CreditCard,
  AttachMoney,
} from '@mui/icons-material';
import { billingService } from '@/services/billingService';
import { razorpayService } from '@/services/razorpayService';
import { formatDateTime } from '@/utils/helpers';
import { formatCurrency } from '@/utils/constants';
import { useAuthStore } from '@/store/authStore';
import PageTitle from '@/components/common/PageTitle';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const PatientBilling = () => {
  const theme = useTheme();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const { user } = useAuthStore();

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    try {
      setFetchLoading(true);
      const data = await billingService.getAllBills();
      setBills(data);
    } catch (error) {
      console.error('Error fetching bills:', error);
      showSnackbar('Failed to load bills', 'error');
    } finally {
      setFetchLoading(false);
    }
  };

  const handlePayment = async (bill) => {
    setLoading(true);
    try {
      const scriptLoaded = await razorpayService.loadScript();

      if (!scriptLoaded) {
        showSnackbar('Failed to load payment gateway', 'error');
        return;
      }

      const orderData = await razorpayService.createOrder(
        bill.balance,
        bill.bill_id,
        user.full_name
      );

      await razorpayService.openCheckout({
        order: orderData,
        amount: bill.balance,
        billId: bill.bill_id,
        patientName: user.full_name,
        patientEmail: user.email,
        patientPhone: user.phone,
        onSuccess: async (response) => {
          showSnackbar('Payment successful!', 'success');
          fetchBills();
        },
        onFailure: (error) => {
          showSnackbar('Payment failed', 'error');
        },
      });
    } catch (error) {
      console.error('Payment initiation error:', error);
      showSnackbar('Payment initiation failed', 'error');
    } finally {
      setLoading(false);
    }
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
    doc.text(`Patient: ${user.full_name}`, 20, 64);

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

    doc.setTextColor(200, 0, 0);
    doc.setFont(undefined, 'bold');
    doc.text('Balance Due:', rightX, finalY + 38);
    doc.text(formatPDFCurrency(bill.balance), 185, finalY + 38, { align: 'right' });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.setFont(undefined, 'normal');
    doc.text('Thank you for choosing HealthCare Plus Hospital.', 105, 270, { align: 'center' });
    doc.text('For any queries, please contact our billing department.', 105, 275, { align: 'center' });
    doc.text('This is a computer-generated invoice.', 105, 280, { align: 'center' });

    doc.save(`Invoice_${bill.bill_id}.pdf`);
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      partial: 'info',
      paid: 'success',
      overdue: 'error',
    };
    return colors[status] || 'default';
  };

  const getPaymentStatusIcon = (status) => {
    if (status === 'paid') {
      return <CheckCircle color="success" />;
    }
    return <Warning color="warning" />;
  };

  return (
    <Box sx={{ pb: 4 }}>
      <Box sx={{ mb: 5 }}>
        <PageTitle>
          Billing
        </PageTitle>
        <Typography variant="h6" color="text.secondary" fontWeight="normal">
          Manage your invoices and payments securely.
        </Typography>
      </Box>

      {
        fetchLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={4}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 4,
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
                    border: '1px solid',
                    borderColor: alpha(theme.palette.primary.main, 0.2),
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', color: 'white' }}>
                      <Receipt />
                    </Avatar>
                    <Typography variant="subtitle1" fontWeight="600" color="primary.main" noWrap>
                      Total Billed
                    </Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="800" color="text.primary" sx={{ wordBreak: 'break-word' }}>
                    {formatCurrency(bills.reduce((sum, bill) => sum + (bill.total_amount || 0), 0))}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 4,
                    background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.success.main, 0.05)} 100%)`,
                    border: '1px solid',
                    borderColor: alpha(theme.palette.success.main, 0.2),
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'success.main', color: 'white' }}>
                      <CheckCircle />
                    </Avatar>
                    <Typography variant="subtitle1" fontWeight="600" color="success.main" noWrap>
                      Total Paid
                    </Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="800" color="text.primary" sx={{ wordBreak: 'break-word' }}>
                    {formatCurrency(bills.reduce((sum, bill) => sum + (bill.paid_amount || 0), 0))}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 4,
                    background: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.1)} 0%, ${alpha(theme.palette.error.main, 0.05)} 100%)`,
                    border: '1px solid',
                    borderColor: alpha(theme.palette.error.main, 0.2),
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'error.main', color: 'white' }}>
                      <Warning />
                    </Avatar>
                    <Typography variant="subtitle1" fontWeight="600" color="error.main" noWrap>
                      Balance Due
                    </Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="800" color="text.primary" sx={{ wordBreak: 'break-word' }}>
                    {formatCurrency(bills.reduce((sum, bill) => sum + (bill.balance || 0), 0))}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            {/* Tabs for Paid/Unpaid Separation */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
              <Tabs
                value={tabValue}
                onChange={(e, v) => setTabValue(v)}
                aria-label="billing tabs"
                textColor="primary"
                indicatorColor="primary"
              >
                <Tab
                  label={`Unpaid / Pending (${bills.filter(b => b.payment_status !== 'paid').length})`}
                  sx={{ fontWeight: 600, textTransform: 'none', fontSize: '1rem' }}
                />
                <Tab
                  label={`Paid History (${bills.filter(b => b.payment_status === 'paid').length})`}
                  sx={{ fontWeight: 600, textTransform: 'none', fontSize: '1rem' }}
                />
              </Tabs>
            </Box>

            <Grid container spacing={3}>
              {(tabValue === 0
                ? bills.filter(bill => bill.payment_status !== 'paid')
                : bills.filter(bill => bill.payment_status === 'paid')
              ).map((bill) => (
                <Grid item xs={12} key={bill.id}>
                  <Paper
                    elevation={0}
                    sx={{
                      borderRadius: 4,
                      border: '1px solid',
                      borderColor: 'divider',
                      overflow: 'hidden',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        borderColor: 'primary.main',
                        boxShadow: '0 8px 24px -10px rgba(0, 0, 0, 0.1)',
                        transform: 'translateY(-2px)',
                      }
                    }}
                  >
                    <Box sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 3 }}>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          <Avatar
                            sx={{
                              width: 56,
                              height: 56,
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              color: 'primary.main',
                              borderRadius: 3
                            }}
                          >
                            <Receipt />
                          </Avatar>
                          <Box>
                            <Typography variant="h6" fontWeight="700">
                              Invoice #{bill.bill_id}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {formatDateTime(bill.bill_date)}
                            </Typography>
                          </Box>
                        </Box>
                        <Chip
                          label={bill.payment_status.toUpperCase()}
                          size="small"
                          color={getPaymentStatusColor(bill.payment_status)}
                          icon={getPaymentStatusIcon(bill.payment_status)}
                          sx={{ fontWeight: 600, borderRadius: 2, px: 1 }}
                        />
                      </Box>

                      <Divider sx={{ mb: 3 }} />

                      <Grid container spacing={4}>
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Bill Details
                          </Typography>
                          <List dense disablePadding>
                            <ListItem sx={{ px: 0 }}>
                              <ListItemText primary="Consultation Fee" />
                              <Typography variant="body2" fontWeight="500">{formatCurrency(bill.consultation_fee || 0)}</Typography>
                            </ListItem>
                            <ListItem sx={{ px: 0 }}>
                              <ListItemText primary="Medication Charges" />
                              <Typography variant="body2" fontWeight="500">{formatCurrency(bill.medication_charges || 0)}</Typography>
                            </ListItem>
                            <ListItem sx={{ px: 0 }}>
                              <ListItemText primary="Lab Test Charges" />
                              <Typography variant="body2" fontWeight="500">{formatCurrency(bill.lab_charges || 0)}</Typography>
                            </ListItem>
                            <ListItem sx={{ px: 0 }}>
                              <ListItemText primary="Other Charges" />
                              <Typography variant="body2" fontWeight="500">{formatCurrency(bill.other_charges || 0)}</Typography>
                            </ListItem>
                          </List>
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <Paper variant="outlined" sx={{ p: 3, bgcolor: alpha(theme.palette.background.default, 0.5), borderRadius: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="body2" color="text.secondary">Subtotal</Typography>
                              <Typography variant="body2" fontWeight="600">{formatCurrency(bill.subtotal || 0)}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="body2" color="text.secondary">Tax</Typography>
                              <Typography variant="body2" fontWeight="600">{formatCurrency(bill.tax || 0)}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                              <Typography variant="body2" color="text.secondary">Discount</Typography>
                              <Typography variant="body2" color="error" fontWeight="600">{formatCurrency(bill.discount || 0)}</Typography>
                            </Box>

                            <Divider sx={{ mb: 2 }} />

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                              <Typography variant="h6" fontWeight="700">Total</Typography>
                              <Typography variant="h6" fontWeight="700" color="primary.main">{formatCurrency(bill.total_amount || 0)}</Typography>
                            </Box>

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="body2" fontWeight="500">Paid Amount</Typography>
                              <Typography variant="body2" color="success.main" fontWeight="700">
                                {formatCurrency(bill.paid_amount || 0)}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body1" fontWeight="700">Balance Due</Typography>
                              <Typography variant="body1" color="error.main" fontWeight="700">
                                {formatCurrency(bill.balance || 0)}
                              </Typography>
                            </Box>

                            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                              <Button
                                variant="outlined"
                                startIcon={<Download />}
                                fullWidth
                                onClick={() => generateInvoice(bill)}
                                sx={{ borderRadius: 2 }}
                              >
                                Invoice
                              </Button>
                              {bill.balance > 0 && (
                                <Button
                                  variant="contained"
                                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Payment />}
                                  fullWidth
                                  onClick={() => handlePayment(bill)}
                                  disabled={loading}
                                  sx={{ borderRadius: 2, boxShadow: 'none' }}
                                >
                                  {loading ? 'Processing...' : 'Pay Now'}
                                </Button>
                              )}
                            </Box>
                          </Paper>
                        </Grid>
                      </Grid>
                    </Box>
                  </Paper>
                </Grid>
              ))}

              {/* Show "No Bills" message based on current tab filter */}
              {(tabValue === 0
                ? bills.filter(bill => bill.payment_status !== 'paid')
                : bills.filter(bill => bill.payment_status === 'paid')
              ).length === 0 && (
                  <Grid item xs={12}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 6,
                        textAlign: 'center',
                        borderRadius: 4,
                        border: '1px dashed',
                        borderColor: 'divider',
                        bgcolor: 'background.default'
                      }}
                    >
                      <Receipt sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        No {tabValue === 0 ? 'unpaid' : 'paid'} bills found
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {tabValue === 0
                          ? "You have no pending payments."
                          : "Your payment history will appear here."}
                      </Typography>
                    </Paper>
                  </Grid>
                )}
            </Grid>
          </>
        )
      }

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box >
  );
};

export default PatientBilling;