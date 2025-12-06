import React, { useState } from 'react';
import { Button, CircularProgress, Tooltip, Snackbar, Alert } from '@mui/material';
import { AutoAwesome } from '@mui/icons-material';
import aiService from '@/services/aiService';

const AIFillButton = ({ fieldDescriptions, onFill, label = "Fill with AI" }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleFill = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await aiService.generateFormData(fieldDescriptions);
            onFill(data);
        } catch (err) {
            console.error('AI Fill Error:', err);
            setError(err.message || 'Failed to generate data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Button
                variant="outlined"
                size="small"
                startIcon={loading ? <CircularProgress size={16} /> : <AutoAwesome />}
                onClick={handleFill}
                disabled={loading}
            >
                {loading ? 'Generating...' : label}
            </Button>

            <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
                <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
                    {error}
                </Alert>
            </Snackbar>
        </>
    );
};

export default AIFillButton;
