import React from 'react';
import { Box, Typography, Container, Paper, useTheme, alpha, Grid, Card, CardContent } from '@mui/material';
import { Psychology, AutoAwesome, Info, Warning } from '@mui/icons-material';
import SymptomChecker from '@/components/patient/SymptomChecker';
import { useAuthStore } from '@/store/authStore';
import aiService from '@/services/aiService';
import PageTitle from '@/components/common/PageTitle';

const AIHealthAssistant = () => {
    const theme = useTheme();

    return (
        <Box sx={{ pb: 8 }}>
            {/* Hero Section */}
            <Box
                sx={{
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.background.default, 1)} 100%)`,
                    pt: 8,
                    pb: 6,
                    mb: 4,
                    borderRadius: { xs: 0, md: '0 0 40px 40px' }
                }}
            >
                <Container maxWidth="md" sx={{ textAlign: 'center' }}>
                    <Box
                        sx={{
                            width: 100,
                            height: 100,
                            borderRadius: '50%',
                            bgcolor: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto',
                            mb: 3,
                            boxShadow: '0 12px 24px rgba(0,0,0,0.1)'
                        }}
                    >
                        <Psychology sx={{ fontSize: 50, color: 'primary.main' }} />
                    </Box>

                    <Typography
                        variant="h4"
                        component="h1"
                        align="center"
                        gutterBottom
                        sx={{
                            fontWeight: 800,
                            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                            backgroundClip: 'text',
                            textFillColor: 'transparent',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            display: 'inline-block',
                            mb: 2
                        }}
                    >
                        AI Health Assistant
                    </Typography>

                    <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto', lineHeight: 1.6 }}>
                        Advanced symptom analysis powered by artificial intelligence.
                        Get instant insights about your health concerns.
                    </Typography>
                </Container>
            </Box>

            <Container maxWidth="lg">
                <Grid container spacing={4}>
                    {/* Left Column: Info & Disclaimer */}
                    <Grid item xs={12} md={4}>
                        <Box sx={{ position: 'sticky', top: 24 }}>
                            <Card
                                elevation={0}
                                sx={{
                                    mb: 3,
                                    borderRadius: 4,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.05)} 0%, ${alpha(theme.palette.background.paper, 1)} 100%)`
                                }}
                            >
                                <CardContent sx={{ p: 3 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                                        <Info color="info" />
                                        <Typography variant="h6" fontWeight="700">How it works</Typography>
                                    </Box>
                                    <Typography variant="body2" color="text.secondary" paragraph>
                                        1. Select your symptoms from the comprehensive list.
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" paragraph>
                                        2. Our AI model analyzes the combination of symptoms.
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        3. Receive an instant prediction with confidence score.
                                    </Typography>
                                </CardContent>
                            </Card>

                            <Card
                                elevation={0}
                                sx={{
                                    borderRadius: 4,
                                    border: '1px solid',
                                    borderColor: alpha(theme.palette.warning.main, 0.3),
                                    bgcolor: alpha(theme.palette.warning.main, 0.02)
                                }}
                            >
                                <CardContent sx={{ p: 3 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                                        <Warning color="warning" />
                                        <Typography variant="h6" fontWeight="700" color="warning.main">Disclaimer</Typography>
                                    </Box>
                                    <Typography variant="body2" color="text.secondary">
                                        This tool is for informational purposes only and does not constitute medical advice.
                                        Always consult a healthcare professional for diagnosis and treatment.
                                        If you have a medical emergency, call emergency services immediately.
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Box>
                    </Grid>

                    {/* Right Column: Symptom Checker */}
                    <Grid item xs={12} md={8}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 0,
                                borderRadius: 4,
                                border: '1px solid',
                                borderColor: 'divider',
                                overflow: 'hidden'
                            }}
                        >
                            <Box sx={{ p: 3, bgcolor: alpha(theme.palette.primary.main, 0.03), borderBottom: '1px solid', borderColor: 'divider' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <AutoAwesome sx={{ color: 'primary.main' }} />
                                    <Typography variant="h6" fontWeight="700">Symptom Analysis</Typography>
                                </Box>
                            </Box>
                            <Box sx={{ p: 3 }}>
                                <SymptomChecker />
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
};

export default AIHealthAssistant;
