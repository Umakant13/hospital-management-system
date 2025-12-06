import React from 'react';
import { Typography, Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';

/**
 * Reusable page title component with gradient styling
 * Provides consistent heading appearance across all portals
 */
const PageTitle = ({
    children,
    subtitle,
    actions,
    variant = 'h4',
    gutterBottom = true,
    sx = {},
    ...props
}) => {
    const theme = useTheme();

    const gradientStyle = {
        fontWeight: 800,
        background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
        backgroundClip: 'text',
        textFillColor: 'transparent',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        display: 'inline-block',
        ...sx
    };

    return (
        <Box sx={{ mb: subtitle ? 2 : 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
                <Typography
                    variant={variant}
                    gutterBottom={gutterBottom}
                    sx={gradientStyle}
                    {...props}
                >
                    {children}
                </Typography>
                {subtitle && (
                    <Typography
                        variant="body1"
                        color="text.secondary"
                        sx={{ mt: 1 }}
                    >
                        {subtitle}
                    </Typography>
                )}
            </Box>
            {actions && (
                <Box>
                    {actions}
                </Box>
            )}
        </Box>
    );
};

export default PageTitle;
