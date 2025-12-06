import React, { createContext, useState, useMemo, useEffect, useContext } from 'react';
import { createTheme, ThemeProvider as MUIThemeProvider } from '@mui/material';
import { CssBaseline } from '@mui/material';

const ThemeContext = createContext({
    mode: 'light',
    toggleColorMode: () => { },
});

export const useThemeContext = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
    const [mode, setMode] = useState(() => {
        const savedMode = localStorage.getItem('themeMode');
        return savedMode || 'light';
    });

    useEffect(() => {
        localStorage.setItem('themeMode', mode);
    }, [mode]);

    const toggleColorMode = () => {
        setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
    };

    const theme = useMemo(
        () =>
            createTheme({
                palette: {
                    mode,
                    primary: {
                        main: '#667eea',
                        light: '#8b9ff5',
                        dark: '#4a5fc1',
                    },
                    secondary: {
                        main: '#f5576c',
                        light: '#f77a8a',
                        dark: '#d63e52',
                    },
                    background: {
                        default: mode === 'light' ? '#f8f9fa' : '#1a202c',
                        paper: mode === 'light' ? '#ffffff' : '#2d3748',
                    },
                    text: {
                        primary: mode === 'light' ? '#2d3748' : '#f7fafc',
                        secondary: mode === 'light' ? '#718096' : '#a0aec0',
                    },
                },
                typography: {
                    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
                    h4: {
                        fontWeight: 700,
                        letterSpacing: '-0.02em',
                    },
                    h6: {
                        fontWeight: 600,
                        letterSpacing: '-0.01em',
                    },
                    button: {
                        fontWeight: 600,
                        letterSpacing: '0.02em',
                    },
                },
                shape: {
                    borderRadius: 12,
                },
                components: {
                    MuiButton: {
                        styleOverrides: {
                            root: {
                                textTransform: 'none',
                                fontWeight: 600,
                                borderRadius: 8,
                                padding: '8px 16px',
                            },
                        },
                    },
                    MuiCard: {
                        styleOverrides: {
                            root: {
                                boxShadow: mode === 'light' ? '0 1px 3px rgba(0,0,0,0.05)' : '0 1px 3px rgba(0,0,0,0.2)',
                                borderRadius: 12,
                            },
                        },
                    },
                    MuiPaper: {
                        styleOverrides: {
                            root: {
                                boxShadow: mode === 'light' ? '0 1px 3px rgba(0,0,0,0.05)' : '0 1px 3px rgba(0,0,0,0.2)',
                            },
                        },
                    },
                    MuiAppBar: {
                        styleOverrides: {
                            root: {
                                backgroundColor: mode === 'light' ? '#ffffff' : '#2d3748',
                                color: mode === 'light' ? '#2d3748' : '#f7fafc',
                                borderBottom: `1px solid ${mode === 'light' ? '#e0e0e0' : 'rgba(255, 255, 255, 0.12)'}`,
                            },
                        },
                    },
                },
            }),
        [mode]
    );

    return (
        <ThemeContext.Provider value={{ mode, toggleColorMode }}>
            <MUIThemeProvider theme={theme}>
                <CssBaseline />
                {children}
            </MUIThemeProvider>
        </ThemeContext.Provider>
    );
};
