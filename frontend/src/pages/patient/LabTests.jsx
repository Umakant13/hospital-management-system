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
  LinearProgress,
  CircularProgress,
  Tabs,
  Tab,
  useTheme,
  alpha,
  Avatar,
  Divider,
} from '@mui/material';
import {
  Science,
  Download,
  Pending,
  CheckCircle,
  Schedule,
  Person,
  Biotech,
} from '@mui/icons-material';
import { labTestService } from '@/services/labTestService';
import { formatDateTime } from '@/utils/helpers';
import { useAuthStore } from '@/store/authStore';
import PageTitle from '@/components/common/PageTitle';
import { fileService } from '@/services/fileService';

import jsPDF from 'jspdf';
import 'jspdf-autotable';

const TestCard = ({ test }) => {
  const theme = useTheme();
  const isCompleted = test.status === 'completed';

  const getStatusColor = (status) => {
    const colors = {
      ordered: 'info',
      sample_collected: 'warning',
      in_progress: 'primary',
      completed: 'success',
      cancelled: 'error',
    };
    return colors[status] || 'default';
  };

  const handleDownloadReport = () => {
    const doc = new jsPDF();

    // Hospital Header
    doc.setFillColor(33, 150, 243);
    doc.rect(0, 0, 210, 35, 'F');

    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.setFont(undefined, 'bold');
    doc.text('HealthCare Plus Hospital', 105, 15, { align: 'center' });

    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.text('123 Medical Center Drive, Healthcare City, HC 12345', 105, 22, { align: 'center' });
    doc.text('Phone: (555) 123-4567 | Email: info@healthcareplus.com', 105, 27, { align: 'center' });
    doc.text('www.healthcareplus.com', 105, 32, { align: 'center' });

    // Report Title
    doc.setFontSize(18);
    doc.setTextColor(33, 150, 243);
    doc.setFont(undefined, 'bold');
    doc.text('LABORATORY REPORT', 105, 48, { align: 'center' });

    // Test Details Box
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.rect(20, 55, 170, 20);

    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.setFont(undefined, 'normal');
    doc.text('Test ID:', 25, 61);
    doc.text('Ordered Date:', 25, 67);
    doc.text('Result Date:', 25, 73);

    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'bold');
    doc.text(`#${test.id}`, 60, 61);
    doc.text(formatDateTime(test.ordered_date), 60, 67);
    doc.text(test.result_date ? formatDateTime(test.result_date) : 'Pending', 60, 73);

    // Patient Information Box
    doc.setFillColor(245, 245, 245);
    doc.rect(20, 80, 170, 18, 'F');
    doc.setDrawColor(200, 200, 200);
    doc.rect(20, 80, 170, 18);

    doc.setFontSize(10);
    doc.setTextColor(33, 150, 243);
    doc.setFont(undefined, 'bold');
    doc.text('TEST INFORMATION', 25, 87);

    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'normal');
    doc.text(`Test Name: ${test.test_name}`, 25, 93);
    doc.text(`Category: ${test.category || 'General'}`, 120, 93);

    // Results Section
    doc.setFontSize(11);
    doc.setTextColor(33, 150, 243);
    doc.setFont(undefined, 'bold');
    doc.text('TEST RESULTS', 25, 108);

    // Results Table
    const tableData = [
      [test.test_name, test.results || 'Pending', test.unit || '-', test.normal_range || '-']
    ];

    doc.autoTable({
      startY: 112,
      head: [['Test Name', 'Result', 'Unit', 'Reference Range']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [33, 150, 243],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9
      },
      styles: {
        fontSize: 9,
        cellPadding: 3
      },
      margin: { left: 20, right: 20 },
    });

    let yPos = doc.lastAutoTable.finalY + 10;

    // Notes Section
    if (test.notes) {
      doc.setFontSize(10);
      doc.setTextColor(33, 150, 243);
      doc.setFont(undefined, 'bold');
      doc.text('NOTES / INTERPRETATION:', 25, yPos);

      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'normal');
      const notes = doc.splitTextToSize(test.notes, 165);
      doc.text(notes, 25, yPos + 6);
      yPos += notes.length * 5 + 12;
    }

    // Footer
    doc.setFillColor(245, 245, 245);
    doc.rect(0, 275, 210, 22, 'F');

    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text('This report is electronically generated and validated.', 105, 282, { align: 'center' });
    doc.text('Please consult your doctor for interpretation of results.', 105, 287, { align: 'center' });
    doc.text('HealthCare Plus Hospital - Excellence in Diagnostics', 105, 292, { align: 'center' });

    doc.save(`Lab_Report_${test.id}.pdf`);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 4,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        '&:hover': {
          borderColor: 'primary.main',
          boxShadow: '0 12px 24px -10px rgba(0, 0, 0, 0.1)',
          transform: 'translateY(-4px)',
        }
      }}
    >
      <Box sx={{ p: 3, flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
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
              <Science />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight="700">
                {test.test_name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ID: #{test.id}
              </Typography>
            </Box>
          </Box>
          <Chip
            label={test.status.replace('_', ' ').toUpperCase()}
            size="small"
            color={getStatusColor(test.status)}
            sx={{ fontWeight: 600, borderRadius: 2 }}
          />
        </Box>

        <Divider sx={{ mb: 2 }} />

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', mb: 0.5 }}>
              <Schedule sx={{ fontSize: 16 }} />
              <Typography variant="caption" fontWeight="600">Ordered</Typography>
            </Box>
            <Typography variant="body2" fontWeight="500">
              {formatDateTime(test.ordered_date)}
            </Typography>
          </Grid>
          {test.result_date && (
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', mb: 0.5 }}>
                <CheckCircle sx={{ fontSize: 16 }} />
                <Typography variant="caption" fontWeight="600">Result</Typography>
              </Box>
              <Typography variant="body2" fontWeight="500">
                {formatDateTime(test.result_date)}
              </Typography>
            </Grid>
          )}
        </Grid>

        {isCompleted && test.results && (
          <Box sx={{ mt: 2, bgcolor: alpha(theme.palette.success.main, 0.05), p: 2, borderRadius: 2, border: '1px dashed', borderColor: 'success.main' }}>
            <Typography variant="subtitle2" gutterBottom color="success.main" fontWeight="700">
              Results Summary
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
              {test.results}
            </Typography>
            {test.normal_range && (
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                Normal Range: {test.normal_range}
              </Typography>
            )}
          </Box>
        )}

        {/* Progress bar removed for cleaner UI */}
      </Box>

      {isCompleted && (
        <Box sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.02), borderTop: '1px solid', borderColor: 'divider' }}>
          <Button
            fullWidth
            variant="contained"
            startIcon={<Download />}
            onClick={handleDownloadReport}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
          >
            Download Report
          </Button>
        </Box>
      )}
    </Paper>
  );
};

const PatientLabTests = () => {
  const theme = useTheme();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const data = await labTestService.getAllLabTests();
      setTests(data);
    } catch (error) {
      console.error('Error fetching lab tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const completedTests = tests.filter(t => t.status === 'completed');
  const pendingTests = tests.filter(t => t.status !== 'completed');
  const displayTests = tabValue === 0 ? completedTests : pendingTests;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 4 }}>
      <Box sx={{ mb: 5 }}>
        <PageTitle>
          Lab Tests
        </PageTitle>
        <Typography variant="h6" color="text.secondary" fontWeight="normal">
          Track your lab tests and download reports.
        </Typography>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="lab tests tabs">
          <Tab
            label={`Completed (${completedTests.length})`}
            sx={{ fontWeight: 600, textTransform: 'none', fontSize: '1rem' }}
          />
          <Tab
            label={`Pending / In Progress (${pendingTests.length})`}
            sx={{ fontWeight: 600, textTransform: 'none', fontSize: '1rem' }}
          />
        </Tabs>
      </Box>

      {displayTests.length > 0 ? (
        <Grid container spacing={3}>
          {displayTests.map((test) => (
            <Grid item xs={12} md={6} lg={4} key={test.id}>
              <TestCard test={test} />
            </Grid>
          ))}
        </Grid>
      ) : (
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
          <Biotech sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No {tabValue === 0 ? 'completed' : 'pending'} tests found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {tabValue === 0
              ? "Once your tests are analyzed, results will appear here."
              : "You don't have any active lab test orders."}
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default PatientLabTests;