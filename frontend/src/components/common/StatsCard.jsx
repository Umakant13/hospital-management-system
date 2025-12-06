import React from 'react';
import { Card, CardContent, Typography, Box, alpha, useTheme } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

const StatsCard = ({
    title,
    value,
    icon: Icon,
    color = 'primary',
    trend,
    trendValue,
    subtitle,
    onClick
}) => {
    const theme = useTheme();

    const colorMap = {
        primary: theme.palette.primary.main,
        secondary: theme.palette.secondary.main,
        success: theme.palette.success.main,
        warning: theme.palette.warning.main,
        error: theme.palette.error.main,
        info: theme.palette.info.main
    };

    const selectedColor = colorMap[color] || theme.palette.primary.main;

    return (
        <Card
            elevation={0}
            onClick={onClick}
            sx={{
                borderRadius: 4,
                border: '1px solid',
                borderColor: 'divider',
                transition: 'all 0.3s ease',
                cursor: onClick ? 'pointer' : 'default',
                position: 'relative',
                overflow: 'hidden',
                '&:hover': onClick ? {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 12px 24px ${alpha(selectedColor, 0.15)}`,
                    borderColor: alpha(selectedColor, 0.3)
                } : {},
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: `linear-gradient(90deg, ${selectedColor}, ${alpha(selectedColor, 0.6)})`,
                }
            }}
        >
            <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ flex: 1 }}>
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            fontWeight="600"
                            textTransform="uppercase"
                            letterSpacing="0.5px"
                        >
                            {title}
                        </Typography>
                        <Typography
                            variant="h4"
                            fontWeight="800"
                            sx={{
                                mt: 1,
                                background: `linear-gradient(45deg, ${selectedColor}, ${alpha(selectedColor, 0.7)})`,
                                backgroundClip: 'text',
                                textFillColor: 'transparent',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}
                        >
                            {value}
                        </Typography>
                        {subtitle && (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                {subtitle}
                            </Typography>
                        )}
                    </Box>
                    <Box
                        sx={{
                            width: 56,
                            height: 56,
                            borderRadius: 3,
                            bgcolor: alpha(selectedColor, 0.1),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: selectedColor
                        }}
                    >
                        <Icon sx={{ fontSize: 28 }} />
                    </Box>
                </Box>

                {trend !== undefined && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 2 }}>
                        {trend > 0 ? (
                            <TrendingUp sx={{ fontSize: 16, color: 'success.main' }} />
                        ) : (
                            <TrendingDown sx={{ fontSize: 16, color: 'error.main' }} />
                        )}
                        <Typography
                            variant="caption"
                            fontWeight="600"
                            color={trend > 0 ? 'success.main' : 'error.main'}
                        >
                            {Math.abs(trend)}%
                        </Typography>
                        {trendValue && (
                            <Typography variant="caption" color="text.secondary">
                                {trendValue}
                            </Typography>
                        )}
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};

export default StatsCard;
