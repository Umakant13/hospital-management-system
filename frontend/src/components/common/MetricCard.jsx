import React from 'react';
import {
    Card,
    CardContent,
    Typography,
    Box,
    Avatar,
    Skeleton,
} from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

const MetricCard = ({ title, value, icon, color, trend, trendValue, subtitle, loading }) => (
    <Card
        elevation={0}
        sx={{
            borderRadius: 4,
            border: '1px solid',
            borderColor: 'divider',
            height: '100%',
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 24px -10px rgba(0, 0, 0, 0.1)',
            },
        }}
    >
        <CardContent sx={{ p: 3 }}>
            {loading ? (
                <>
                    <Skeleton variant="circular" width={48} height={48} sx={{ mb: 2 }} />
                    <Skeleton variant="text" width="60%" height={32} />
                    <Skeleton variant="text" width="40%" />
                </>
            ) : (
                <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Avatar
                            variant="rounded"
                            sx={{
                                bgcolor: `${color}15`, // 15% opacity
                                color: color,
                                width: 56,
                                height: 56,
                                borderRadius: 3,
                            }}
                        >
                            {icon}
                        </Avatar>
                        {trend && (
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    color: trend === 'up' ? 'success.dark' : 'error.dark',
                                    px: 1,
                                    py: 0.5,
                                    borderRadius: 2,
                                    bgcolor: trend === 'up' ? '#e8f5e9' : '#ffebee',
                                }}
                            >
                                {trend === 'up' ? <TrendingUp fontSize="small" sx={{ mr: 0.5 }} /> : <TrendingDown fontSize="small" sx={{ mr: 0.5 }} />}
                                <Typography variant="caption" fontWeight="bold">
                                    {trendValue}
                                </Typography>
                            </Box>
                        )}
                    </Box>

                    <Typography variant="h4" fontWeight="800" sx={{ mb: 0.5, color: 'text.primary' }}>
                        {value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" fontWeight="500">
                        {title}
                    </Typography>
                    {subtitle && (
                        <Typography variant="caption" color="text.disabled" sx={{ mt: 1, display: 'block' }}>
                            {subtitle}
                        </Typography>
                    )}
                </Box>
            )}
        </CardContent>
    </Card>
);

export default MetricCard;
