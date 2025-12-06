import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    Chip,
    CircularProgress,
    Alert,
    Autocomplete,
    TextField,
    useTheme,
    alpha,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Divider,
    Card,
    CardContent
} from '@mui/material';
import {
    Psychology,
    HealthAndSafety,
    RestartAlt,
    AutoAwesome,
    ExpandMore,
    CheckCircle,
    Medication,
    Restaurant,
    LocalHospital,
    Warning,
    Info
} from '@mui/icons-material';
import aiService from '@/services/aiService';

const SymptomChecker = () => {
    const theme = useTheme();
    const [symptoms, setSymptoms] = useState([]);
    const [selectedSymptoms, setSelectedSymptoms] = useState([]);
    const [prediction, setPrediction] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchSymptoms();
    }, []);

    const fetchSymptoms = async () => {
        try {
            const data = await aiService.getSymptoms();
            setSymptoms(data);
            setError(null);
        } catch (err) {
            console.error('Error fetching symptoms:', err);
            setError('Failed to load symptom checker. Please ensure the ML models are trained.');
        }
    };

    const handlePredict = async () => {
        if (selectedSymptoms.length === 0) return;

        try {
            setLoading(true);
            setError(null);

            // Create binary vector for prediction using ALL symptoms
            const symptomVector = symptoms.map(s =>
                selectedSymptoms.find(sel => sel.id === s.id) ? 1 : 0
            );

            console.log(`Sending ${symptomVector.length} symptoms to prediction API`);
            console.log(`Selected symptoms: ${selectedSymptoms.map(s => s.label).join(', ')}`);

            // Try Deep Learning first, fallback to Random Forest
            let result;
            try {
                result = await aiService.predictDisease(symptomVector, 'deep_learning');
            } catch (dlError) {
                console.log('Deep Learning not available, using Random Forest');
                result = await aiService.predictDisease(symptomVector, 'random_forest');
            }

            setPrediction(result);
        } catch (err) {
            console.error('Prediction error:', err);
            setError(err.response?.data?.detail || 'Failed to analyze symptoms. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setSelectedSymptoms([]);
        setPrediction(null);
        setError(null);
    };

    const getSeverityColor = (severity) => {
        switch (severity?.toLowerCase()) {
            case 'mild': return theme.palette.success.main;
            case 'moderate': return theme.palette.warning.main;
            case 'severe': return theme.palette.error.main;
            default: return theme.palette.info.main;
        }
    };

    return (
        <Box>
            {!prediction ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                        Select your symptoms to get an instant AI-powered health assessment with personalized recommendations.
                    </Typography>

                    {/* Symptom Selection */}
                    <Autocomplete
                        multiple
                        options={symptoms}
                        getOptionLabel={(option) => option.label}
                        value={selectedSymptoms}
                        onChange={(event, newValue) => setSelectedSymptoms(newValue)}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                placeholder="Select symptoms (e.g., Fever, Cough, Headache)"
                                variant="outlined"
                                sx={{ bgcolor: 'background.paper', borderRadius: 2 }}
                            />
                        )}
                        renderTags={(value, getTagProps) =>
                            value.map((option, index) => {
                                const { key, ...chipProps } = getTagProps({ index });
                                return (
                                    <Chip
                                        key={key}
                                        label={option.label}
                                        {...chipProps}
                                        size="small"
                                        color="primary"
                                        variant="outlined"
                                    />
                                );
                            })
                        }
                    />

                    <Button
                        fullWidth
                        variant="contained"
                        onClick={handlePredict}
                        disabled={selectedSymptoms.length === 0 || loading}
                        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Psychology />}
                        sx={{
                            borderRadius: 3,
                            py: 1.5,
                            fontWeight: 700,
                            textTransform: 'none',
                            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                            color: 'white'
                        }}
                    >
                        {loading ? 'Analyzing Your Symptoms...' : 'Analyze Symptoms'}
                    </Button>
                </Box>
            ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {/* Prediction Header */}
                    <Card elevation={0} sx={{
                        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.background.paper, 1)} 100%)`,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 3
                    }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                <Box
                                    sx={{
                                        width: 64,
                                        height: 64,
                                        borderRadius: '50%',
                                        bgcolor: alpha(getSeverityColor(prediction.disease_info?.severity), 0.1),
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: getSeverityColor(prediction.disease_info?.severity)
                                    }}
                                >
                                    <HealthAndSafety sx={{ fontSize: 32 }} />
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight="600" textTransform="uppercase">
                                        AI Health Assessment
                                    </Typography>
                                    <Typography variant="h5" fontWeight="800" color="primary.main">
                                        {prediction.disease}
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                        <Chip
                                            label={`${Math.round(prediction.confidence * 100)}% Match`}
                                            color="success"
                                            size="small"
                                            sx={{ fontWeight: 600 }}
                                        />
                                        {prediction.disease_info && (
                                            <Chip
                                                label={prediction.disease_info.severity.charAt(0).toUpperCase() + prediction.disease_info.severity.slice(1)}
                                                size="small"
                                                sx={{
                                                    bgcolor: alpha(getSeverityColor(prediction.disease_info.severity), 0.1),
                                                    color: getSeverityColor(prediction.disease_info.severity),
                                                    fontWeight: 600
                                                }}
                                            />
                                        )}
                                    </Box>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>

                    {/* Disease Information */}
                    {prediction.disease_info && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {/* Description */}
                            <Alert severity="info" icon={<Info />} sx={{ borderRadius: 2 }}>
                                {prediction.disease_info.description}
                            </Alert>

                            {/* Precautions */}
                            <Accordion defaultExpanded sx={{ borderRadius: 2, '&:before': { display: 'none' } }}>
                                <AccordionSummary expandIcon={<ExpandMore />}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <Warning color="warning" />
                                        <Typography variant="subtitle1" fontWeight="700">
                                            Safety Precautions
                                        </Typography>
                                    </Box>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <List dense>
                                        {prediction.disease_info.precautions.map((precaution, index) => (
                                            <ListItem key={index}>
                                                <ListItemIcon sx={{ minWidth: 36 }}>
                                                    <CheckCircle color="success" fontSize="small" />
                                                </ListItemIcon>
                                                <ListItemText primary={precaution} />
                                            </ListItem>
                                        ))}
                                    </List>
                                </AccordionDetails>
                            </Accordion>

                            {/* Medications */}
                            <Accordion sx={{ borderRadius: 2, '&:before': { display: 'none' } }}>
                                <AccordionSummary expandIcon={<ExpandMore />}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <Medication color="primary" />
                                        <Typography variant="subtitle1" fontWeight="700">
                                            Recommended Medications
                                        </Typography>
                                    </Box>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <List dense>
                                        {prediction.disease_info.medications.map((medication, index) => (
                                            <ListItem key={index}>
                                                <ListItemIcon sx={{ minWidth: 36 }}>
                                                    <CheckCircle color="primary" fontSize="small" />
                                                </ListItemIcon>
                                                <ListItemText primary={medication} />
                                            </ListItem>
                                        ))}
                                    </List>
                                </AccordionDetails>
                            </Accordion>

                            {/* Diet Recommendations */}
                            <Accordion sx={{ borderRadius: 2, '&:before': { display: 'none' } }}>
                                <AccordionSummary expandIcon={<ExpandMore />}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <Restaurant color="secondary" />
                                        <Typography variant="subtitle1" fontWeight="700">
                                            Dietary Recommendations
                                        </Typography>
                                    </Box>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <List dense>
                                        {prediction.disease_info.diet.map((food, index) => (
                                            <ListItem key={index}>
                                                <ListItemIcon sx={{ minWidth: 36 }}>
                                                    <CheckCircle color="secondary" fontSize="small" />
                                                </ListItemIcon>
                                                <ListItemText primary={food} />
                                            </ListItem>
                                        ))}
                                    </List>
                                </AccordionDetails>
                            </Accordion>

                            {/* Specialist */}
                            <Paper elevation={0} sx={{ p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.info.main, 0.05), border: '1px solid', borderColor: alpha(theme.palette.info.main, 0.2) }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <LocalHospital color="info" />
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" fontWeight="600">
                                            Recommended Specialist
                                        </Typography>
                                        <Typography variant="subtitle1" fontWeight="700">
                                            {prediction.disease_info.specialist}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Paper>

                            {/* Disclaimer */}
                            <Alert severity="warning" sx={{ borderRadius: 2 }}>
                                <Typography variant="caption" fontWeight="600">
                                    This is an AI-based assessment and should not replace professional medical advice. Please consult a healthcare provider for accurate diagnosis and treatment.
                                </Typography>
                            </Alert>
                        </Box>
                    )}

                    <Divider />

                    <Button
                        fullWidth
                        variant="outlined"
                        onClick={handleReset}
                        startIcon={<RestartAlt />}
                        sx={{ borderRadius: 3, textTransform: 'none', py: 1.5 }}
                    >
                        Check Another Condition
                    </Button>
                </Box>
            )}

            {error && (
                <Alert
                    severity="error"
                    sx={{ mt: 2, borderRadius: 2 }}
                    action={
                        <Button color="inherit" size="small" onClick={fetchSymptoms}>
                            Retry
                        </Button>
                    }
                >
                    {error}
                </Alert>
            )}
        </Box>
    );
};

export default SymptomChecker;
