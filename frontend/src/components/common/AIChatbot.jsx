import React, { useState, useRef, useEffect } from 'react';
import {
    Box,
    Paper,
    IconButton,
    Typography,
    TextField,
    Fab,
    Avatar,
    CircularProgress,
    Collapse,
    Chip
} from '@mui/material';
import {
    SmartToy,
    Close,
    Send,
    Minimize,
    Person
} from '@mui/icons-material';
import aiService from '@/services/aiService';

const AIChatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'system', content: 'Hello! I am your AI assistant. How can I help you today with the Hospital Management System?' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const result = await aiService.generateText(
                input,
                "You are a helpful AI assistant for a Hospital Management System. Answer questions about navigating the portal, managing patients, doctors, and appointments. Keep answers concise and professional."
            );
            setMessages(prev => [...prev, { role: 'system', content: result.response || result }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'system', content: "I'm sorry, I encountered an error. Please try again." }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <Box sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: 2
        }}>
            <Collapse in={isOpen} orientation="vertical">
                <Paper
                    elevation={12}
                    sx={{
                        width: 360,
                        height: 520,
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        borderRadius: 3,
                        border: '1px solid rgba(0,0,0,0.08)',
                        boxShadow: '0 12px 28px rgba(0,0,0,0.15)',
                    }}
                >
                    {/* Header */}
                    <Box sx={{
                        p: 2,
                        background: 'linear-gradient(135deg, #1976d2 0%, #0d47a1 100%)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', width: 36, height: 36 }}>
                                <SmartToy fontSize="small" />
                            </Avatar>
                            <Box>
                                <Typography variant="subtitle1" fontWeight="600" lineHeight={1.2}>
                                    AI Assistant
                                </Typography>
                                <Typography variant="caption" sx={{ opacity: 0.8, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Box component="span" sx={{ width: 6, height: 6, bgcolor: '#4caf50', borderRadius: '50%' }} />
                                    Online
                                </Typography>
                            </Box>
                        </Box>
                        <IconButton
                            size="small"
                            onClick={() => setIsOpen(false)}
                            sx={{
                                color: 'white',
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                            }}
                        >
                            <Close fontSize="small" />
                        </IconButton>
                    </Box>

                    {/* Messages Area */}
                    <Box sx={{
                        flexGrow: 1,
                        p: 2,
                        overflowY: 'auto',
                        bgcolor: '#f8f9fa',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2
                    }}>
                        {messages.map((msg, index) => (
                            <Box
                                key={index}
                                sx={{
                                    display: 'flex',
                                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                    alignItems: 'flex-end',
                                    gap: 1
                                }}
                            >
                                {msg.role === 'system' && (
                                    <Avatar sx={{ width: 28, height: 28, bgcolor: '#e3f2fd', color: 'primary.main', mb: 0.5 }}>
                                        <SmartToy sx={{ fontSize: 16 }} />
                                    </Avatar>
                                )}
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 1.5,
                                        maxWidth: '80%',
                                        borderRadius: 2,
                                        bgcolor: msg.role === 'user' ? 'primary.main' : 'white',
                                        color: msg.role === 'user' ? 'white' : 'text.primary',
                                        border: msg.role === 'system' ? '1px solid #e0e0e0' : 'none',
                                        borderBottomLeftRadius: msg.role === 'system' ? 4 : 16,
                                        borderBottomRightRadius: msg.role === 'user' ? 4 : 16,
                                        boxShadow: msg.role === 'system' ? '0 1px 2px rgba(0,0,0,0.05)' : '0 2px 4px rgba(25, 118, 210, 0.2)'
                                    }}
                                >
                                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                                        {msg.content}
                                    </Typography>
                                </Paper>
                            </Box>
                        ))}
                        {loading && (
                            <Box sx={{ display: 'flex', justifyContent: 'flex-start', gap: 1 }}>
                                <Avatar sx={{ width: 28, height: 28, bgcolor: '#e3f2fd', color: 'primary.main' }}>
                                    <SmartToy sx={{ fontSize: 16 }} />
                                </Avatar>
                                <Paper sx={{ p: 1.5, borderRadius: 2, bgcolor: 'white', border: '1px solid #e0e0e0' }}>
                                    <CircularProgress size={14} thickness={5} />
                                </Paper>
                            </Box>
                        )}
                        <div ref={messagesEndRef} />
                    </Box>

                    {/* Sample Questions */}
                    {messages.length === 1 && (
                        <Box sx={{ p: 2, pt: 0, bgcolor: '#f8f9fa', display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {[
                                "How do I add a patient?",
                                "What are the visiting hours?",
                                "How to book an appointment?",
                                "List all doctors"
                            ].map((q, i) => (
                                <Chip
                                    key={i}
                                    label={q}
                                    onClick={() => setInput(q)}
                                    size="small"
                                    variant="outlined"
                                    sx={{
                                        cursor: 'pointer',
                                        bgcolor: 'white',
                                        borderColor: 'divider',
                                        '&:hover': { bgcolor: '#e3f2fd', borderColor: 'primary.main' }
                                    }}
                                />
                            ))}
                        </Box>
                    )}

                    {/* Input Area */}
                    <Box sx={{ p: 2, bgcolor: 'white', borderTop: '1px solid #eee' }}>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="Type your message..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                disabled={loading}
                                multiline
                                maxRows={3}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 3,
                                        bgcolor: '#f8f9fa',
                                        '& fieldset': { borderColor: 'transparent' },
                                        '&:hover fieldset': { borderColor: '#e0e0e0' },
                                        '&.Mui-focused fieldset': { borderColor: 'primary.main' }
                                    }
                                }}
                            />
                            <IconButton
                                color="primary"
                                onClick={handleSend}
                                disabled={!input.trim() || loading}
                                sx={{
                                    bgcolor: input.trim() ? 'primary.main' : 'transparent',
                                    color: input.trim() ? 'white' : 'action.disabled',
                                    '&:hover': { bgcolor: input.trim() ? 'primary.dark' : 'transparent' },
                                    width: 40,
                                    height: 40
                                }}
                            >
                                <Send fontSize="small" />
                            </IconButton>
                        </Box>
                    </Box>
                </Paper>
            </Collapse>

            <Fab
                color="primary"
                aria-label="chat"
                onClick={() => setIsOpen(!isOpen)}
                sx={{
                    width: 56,
                    height: 56,
                    boxShadow: '0 4px 12px rgba(25, 118, 210, 0.4)',
                    background: 'linear-gradient(135deg, #1976d2 0%, #0d47a1 100%)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                    '&:hover': {
                        transform: isOpen ? 'rotate(90deg) scale(1.05)' : 'scale(1.05)',
                        boxShadow: '0 6px 16px rgba(25, 118, 210, 0.5)',
                    }
                }}
            >
                {isOpen ? <Close /> : <SmartToy />}
            </Fab>
        </Box>
    );
};

export default AIChatbot;
