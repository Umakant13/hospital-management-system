import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    IconButton,
    CircularProgress,
    Button,
    useTheme,
    alpha,
    Collapse,
    Divider,
} from '@mui/material';
import {
    Medication,
    Download,
    CalendarMonth,
    Person,
    LocalPharmacy,
    ExpandMore,
    ExpandLess,
} from '@mui/icons-material';
import { prescriptionService } from '@/services/prescriptionService';
import { useAuthStore } from '@/store/authStore';
import PageTitle from '@/components/common/PageTitle';
import { formatDateTime } from '@/utils/helpers';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const PrescriptionRow = ({ prescription }) => {
    const theme = useTheme();
    const [expanded, setExpanded] = useState(false);

    const handleDownloadPDF = () => {
        const doc = new jsPDF();

        // Hospital Header with Logo Area
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

        // Prescription Title
        doc.setFontSize(18);
        doc.setTextColor(33, 150, 243);
        doc.setFont(undefined, 'bold');
        doc.text('℞ PRESCRIPTION', 105, 48, { align: 'center' });

        // Prescription Details Box
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.rect(20, 55, 170, 20);

        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.setFont(undefined, 'normal');
        doc.text('Prescription ID:', 25, 61);
        doc.text('Date:', 25, 67);
        doc.text('Prescribed By:', 25, 73);

        doc.setTextColor(0, 0, 0);
        doc.setFont(undefined, 'bold');
        doc.text(prescription.prescription_id, 60, 61);
        doc.text(formatDateTime(prescription.created_at), 60, 67);
        doc.text(prescription.doctor?.name || 'Unknown', 60, 73);

        // Patient Information Box
        doc.setFillColor(245, 245, 245);
        doc.rect(20, 80, 170, 18, 'F');
        doc.setDrawColor(200, 200, 200);
        doc.rect(20, 80, 170, 18);

        doc.setFontSize(10);
        doc.setTextColor(33, 150, 243);
        doc.setFont(undefined, 'bold');
        doc.text('PATIENT INFORMATION', 25, 87);

        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        doc.setFont(undefined, 'normal');
        doc.text(`Name: ${prescription.patient?.name || 'N/A'}`, 25, 93);
        doc.text(`Patient ID: ${prescription.patient?.patient_id || 'N/A'}`, 120, 93);

        // Medications Section
        doc.setFontSize(11);
        doc.setTextColor(33, 150, 243);
        doc.setFont(undefined, 'bold');
        doc.text('℞ MEDICATIONS', 25, 108);

        const medications = Array.isArray(prescription.medications)
            ? prescription.medications
            : [];

        const tableData = medications.map((med, index) => [
            (index + 1).toString(),
            med.name || 'N/A',
            med.dosage || 'N/A',
            med.frequency || 'N/A',
            med.duration || 'N/A',
        ]);

        doc.autoTable({
            startY: 112,
            head: [['#', 'Medication Name', 'Dosage', 'Frequency', 'Duration']],
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
            columnStyles: {
                0: { cellWidth: 10, halign: 'center' },
                1: { cellWidth: 50 },
                2: { cellWidth: 30 },
                3: { cellWidth: 35 },
                4: { cellWidth: 30 }
            },
            margin: { left: 20, right: 20 },
        });

        let yPos = doc.lastAutoTable.finalY + 10;

        // Instructions Section
        if (prescription.instructions) {
            doc.setFontSize(10);
            doc.setTextColor(33, 150, 243);
            doc.setFont(undefined, 'bold');
            doc.text('INSTRUCTIONS:', 25, yPos);

            doc.setFontSize(9);
            doc.setTextColor(0, 0, 0);
            doc.setFont(undefined, 'normal');
            const instructions = doc.splitTextToSize(prescription.instructions, 165);
            doc.text(instructions, 25, yPos + 6);
            yPos += instructions.length * 5 + 12;
        }

        // Notes Section
        if (prescription.notes) {
            doc.setFontSize(10);
            doc.setTextColor(33, 150, 243);
            doc.setFont(undefined, 'bold');
            doc.text('NOTES:', 25, yPos);

            doc.setFontSize(9);
            doc.setTextColor(0, 0, 0);
            doc.setFont(undefined, 'normal');
            const notes = doc.splitTextToSize(prescription.notes, 165);
            doc.text(notes, 25, yPos + 6);
            yPos += notes.length * 5 + 12;
        }

        // Doctor Signature Area
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.line(130, 260, 185, 260);
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text('Doctor Signature', 157, 265, { align: 'center' });

        // Footer
        doc.setFillColor(245, 245, 245);
        doc.rect(0, 275, 210, 22, 'F');

        doc.setFontSize(7);
        doc.setTextColor(100, 100, 100);
        doc.text('This is a computer-generated prescription and is valid without signature.', 105, 282, { align: 'center' });
        doc.text('For any queries, please contact our pharmacy department.', 105, 287, { align: 'center' });
        doc.text('HealthCare Plus Hospital - Your Health, Our Priority', 105, 292, { align: 'center' });

        doc.save(`prescription_${prescription.prescription_id}.pdf`);
    };

    return (
        <>
            <TableRow
                sx={{
                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) },
                    cursor: 'pointer'
                }}
            >
                <TableCell onClick={() => setExpanded(!expanded)}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Medication sx={{ color: 'primary.main' }} />
                        <Typography variant="body2" fontWeight="600">
                            {prescription.prescription_id}
                        </Typography>
                    </Box>
                </TableCell>
                <TableCell onClick={() => setExpanded(!expanded)}>
                    <Typography variant="body2">
                        {formatDateTime(prescription.created_at)}
                    </Typography>
                </TableCell>
                <TableCell onClick={() => setExpanded(!expanded)}>
                    <Typography variant="body2">
                        {prescription.doctor?.name || 'Unknown'}
                    </Typography>
                </TableCell>
                <TableCell onClick={() => setExpanded(!expanded)}>
                    <Chip
                        label="Active"
                        size="small"
                        color="success"
                        sx={{ fontWeight: 600 }}
                    />
                </TableCell>
                <TableCell align="right">
                    <IconButton
                        size="small"
                        onClick={handleDownloadPDF}
                        sx={{
                            color: 'primary.main',
                            '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) }
                        }}
                    >
                        <Download />
                    </IconButton>
                    <IconButton
                        size="small"
                        onClick={() => setExpanded(!expanded)}
                    >
                        {expanded ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                </TableCell>
            </TableRow>
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={5}>
                    <Collapse in={expanded} timeout="auto" unmountOnExit>
                        <Box sx={{ py: 3, px: 2, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                            <Typography variant="subtitle2" fontWeight="700" gutterBottom>
                                Medications
                            </Typography>
                            <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell><strong>Name</strong></TableCell>
                                            <TableCell><strong>Dosage</strong></TableCell>
                                            <TableCell><strong>Frequency</strong></TableCell>
                                            <TableCell><strong>Duration</strong></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {Array.isArray(prescription.medications) && prescription.medications.map((med, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{med.name || 'N/A'}</TableCell>
                                                <TableCell>{med.dosage || 'N/A'}</TableCell>
                                                <TableCell>{med.frequency || 'N/A'}</TableCell>
                                                <TableCell>{med.duration || 'N/A'}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            {prescription.instructions && (
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="subtitle2" fontWeight="700" gutterBottom>
                                        Instructions
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {prescription.instructions}
                                    </Typography>
                                </Box>
                            )}

                            {prescription.notes && (
                                <Box>
                                    <Typography variant="subtitle2" fontWeight="700" gutterBottom>
                                        Notes
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {prescription.notes}
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        </>
    );
};

const Prescriptions = () => {
    const theme = useTheme();
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPrescriptions();
    }, []);

    const fetchPrescriptions = async () => {
        try {
            setLoading(true);
            const data = await prescriptionService.getAllPrescriptions();
            setPrescriptions(data);
        } catch (error) {
            console.error('Error fetching prescriptions:', error);
        } finally {
            setLoading(false);
        }
    };

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
                    Prescriptions
                </PageTitle>
                <Typography variant="h6" color="text.secondary" fontWeight="normal">
                    View and download your digital prescriptions.
                </Typography>
            </Box>

            {prescriptions.length > 0 ? (
                <TableContainer component={Paper} elevation={0} sx={{
                    borderRadius: 4,
                    border: '1px solid',
                    borderColor: 'divider'
                }}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                                <TableCell><strong>Prescription ID</strong></TableCell>
                                <TableCell><strong>Date</strong></TableCell>
                                <TableCell><strong>Doctor</strong></TableCell>
                                <TableCell><strong>Status</strong></TableCell>
                                <TableCell align="right"><strong>Actions</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {prescriptions.map((prescription) => (
                                <PrescriptionRow key={prescription.id} prescription={prescription} />
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
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
                    <Medication sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        No prescriptions found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Prescriptions issued by your doctor will appear here.
                    </Typography>
                </Paper>
            )}
        </Box>
    );
};

export default Prescriptions;
