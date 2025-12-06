import React, { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    Card,
    CardContent,
    CardActionArea,
    TextField,
    Button,
    Divider,
    CircularProgress,
    Chip
} from '@mui/material';
import {
    Psychology,
    MedicalServices,
    MenuBook,
    Send,
    AutoAwesome
} from '@mui/icons-material';
import aiService from '@/services/aiService';

const AIAssistant = () => {
    const [activeTool, setActiveTool] = useState('general');
    const [input, setInput] = useState('');
    const [response, setResponse] = useState('');
    const [loading, setLoading] = useState(false);

    const tools = [
        {
            id: 'general',
            title: 'General Health Assistant',
            icon: <Psychology fontSize="large" />,
            description: 'Ask general questions about health, wellness, and hospital procedures.',
            color: '#2196F3'
        },
        {
            id: 'symptom',
            title: 'Symptom Analyzer',
            icon: <MedicalServices fontSize="large" />,
            description: 'Describe your symptoms to get potential causes and advice (Not a medical diagnosis).',
            color: '#F44336'
        },
        {
            id: 'terms',
            title: 'Medical Term Simplifier',
            icon: <MenuBook fontSize="large" />,
            description: 'Enter complex medical terms or reports to get simple, easy-to-understand explanations.',
            color: '#4CAF50'
        }
    ];

    const handleSend = async () => {
        if (!input.trim()) return;

        setLoading(true);
        setResponse('');

        let systemContext = '';
        switch (activeTool) {
            case 'symptom':
                systemContext = "You are a helpful medical assistant. Analyze the symptoms provided and suggest potential causes and general advice. ALWAYS state that this is not a professional medical diagnosis and they should consult a doctor.";
                break;
            case 'terms':
                systemContext = "You are a medical translator. Explain the provided medical terms or text in simple, easy-to-understand language for a layperson.";
                break;
            default:
                systemContext = "You are a helpful assistant for a Hospital Management System. Answer general health and hospital related questions.";
        }

        try {
            const result = await aiService.generateText(input, systemContext);
            setResponse(result.response || result);
        } catch (error) {
            setResponse("I'm sorry, I encountered an error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <AutoAwesome color="primary" fontSize="large" />
                AI Health Assistant
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
                Select a tool below to get assistance powered by advanced AI.
            </Typography>

            <Grid container spacing={3} sx={{ mb: 4 }}>
                {tools.map((tool) => (
                    <Grid item xs={12} md={4} key={tool.id}>
                        <Card
                            elevation={activeTool === tool.id ? 8 : 1}
                            sx={{
                                height: '100%',
                                border: activeTool === tool.id ? `2px solid ${tool.color}` : 'none',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            <CardActionArea
                                onClick={() => {
                                    setActiveTool(tool.id);
                                    setResponse('');
                                    setInput('');
                                }}
                                sx={{ height: '100%', p: 2 }}
                            >
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 2 }}>
                                    <Box sx={{ color: tool.color }}>
                                        {tool.icon}
                                    </Box>
                                    <CardContent sx={{ p: 0 }}>
                                        <Typography variant="h6" gutterBottom>
                                            {tool.title}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {tool.description}
                                        </Typography>
                                    </CardContent>
                                </Box>
                            </CardActionArea>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom color="primary">
                    {tools.find(t => t.id === activeTool)?.title}
                </Typography>

                <Box sx={{ mb: 3 }}>
                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        placeholder={
                            activeTool === 'symptom' ? "Describe your symptoms (e.g., headache, fever, nausea)..." :
                                activeTool === 'terms' ? "Enter medical terms (e.g., Hypertension, Tachycardia)..." :
                                    "Ask a question..."
                        }
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={loading}
                        sx={{ mb: 2 }}
                    />
                    <Button
                        variant="contained"
                        endIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Send />}
                        onClick={handleSend}
                        disabled={!input.trim() || loading}
                        size="large"
                    >
                        {loading ? 'Analyzing...' : 'Get Answer'}
                    </Button>
                </Box>

                {response && (
                    <Box sx={{ bgcolor: '#f8f9fa', p: 3, borderRadius: 2, borderLeft: '4px solid #2196F3' }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            AI Response:
                        </Typography>
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                            {response}
                        </Typography>
                        {activeTool === 'symptom' && (
                            <Chip
                                label="Disclaimer: Not a medical diagnosis"
                                color="warning"
                                size="small"
                                sx={{ mt: 2 }}
                            />
                        )}
                    </Box>
                )}
            </Paper>
        </Box>
    );
};

export default AIAssistant;
