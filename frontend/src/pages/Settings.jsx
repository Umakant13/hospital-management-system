import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Divider,
  Switch,
  Alert,
  Snackbar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  Paper,
} from '@mui/material';
import {
  Notifications,
  Security,
  Palette,
  Email,
  Phone,
  Delete,
  Brightness4,
  Brightness7,
} from '@mui/icons-material';
import { useAuthStore } from '@/store/authStore';
import { useThemeContext } from '@/contexts/ThemeContext';
import api from '@/services/api';

const TabPanel = ({ children, value, index }) => (
  <div hidden={value !== index}>
    {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
  </div>
);

const Settings = () => {
  const { user } = useAuthStore();
  const { mode, toggleColorMode } = useThemeContext();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Notification Settings
  const [notifications, setNotifications] = useState({
    email_notifications: true,
    sms_notifications: false,
    appointment_reminders: true,
    billing_alerts: true,
    system_updates: false,
  });

  // Security Settings
  const [security, setSecurity] = useState({
    two_factor_enabled: false,
    login_alerts: true,
    session_timeout: 30,
  });

  // Appearance Settings
  const [appearance, setAppearance] = useState({
    language: 'en',
    date_format: 'DD/MM/YYYY',
    time_format: '24h',
  });

  // Delete Account Dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    // Load saved preferences from localStorage
    const savedNotifications = localStorage.getItem('notifications_settings');
    const savedSecurity = localStorage.getItem('security_settings');
    const savedAppearance = localStorage.getItem('appearance_settings');

    if (savedNotifications) setNotifications(JSON.parse(savedNotifications));
    if (savedSecurity) setSecurity(JSON.parse(savedSecurity));
    if (savedAppearance) setAppearance(JSON.parse(savedAppearance));
  }, []);

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Notification Handlers
  const handleNotificationChange = (setting) => {
    const updated = { ...notifications, [setting]: !notifications[setting] };
    setNotifications(updated);
    localStorage.setItem('notifications_settings', JSON.stringify(updated));
    showSnackbar('Notification settings updated');
  };

  // Security Handlers
  const handleSecurityChange = (setting, value) => {
    const updated = { ...security, [setting]: value };
    setSecurity(updated);
    localStorage.setItem('security_settings', JSON.stringify(updated));
    showSnackbar('Security settings updated');
  };

  // Appearance Handlers
  const handleAppearanceChange = (setting, value) => {
    const updated = { ...appearance, [setting]: value };
    setAppearance(updated);
    localStorage.setItem('appearance_settings', JSON.stringify(updated));
    showSnackbar('Appearance settings updated');
  };

  // Delete Account
  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      await api.delete('/users/me');
      showSnackbar('Account deleted successfully');
      setTimeout(() => {
        localStorage.clear();
        window.location.href = '/auth';
      }, 2000);
    } catch (error) {
      showSnackbar('Failed to delete account', 'error');
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Settings
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage your account settings and preferences
      </Typography>

      <Paper elevation={0} sx={{ borderRadius: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
        >
          <Tab icon={<Notifications />} label="Notifications" iconPosition="start" />
          <Tab icon={<Security />} label="Security" iconPosition="start" />
          <Tab icon={<Palette />} label="Appearance" iconPosition="start" />
        </Tabs>

        {/* Notifications Tab */}
        <TabPanel value={activeTab} index={0}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Notification Preferences
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Choose how you want to receive notifications
              </Typography>

              <List>
                <ListItem>
                  <ListItemIcon>
                    <Email />
                  </ListItemIcon>
                  <ListItemText
                    primary="Email Notifications"
                    secondary="Receive notifications via email"
                  />
                  <Switch
                    checked={notifications.email_notifications}
                    onChange={() => handleNotificationChange('email_notifications')}
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemIcon>
                    <Phone />
                  </ListItemIcon>
                  <ListItemText
                    primary="SMS Notifications"
                    secondary="Receive notifications via SMS"
                  />
                  <Switch
                    checked={notifications.sms_notifications}
                    onChange={() => handleNotificationChange('sms_notifications')}
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemIcon>
                    <Notifications />
                  </ListItemIcon>
                  <ListItemText
                    primary="Appointment Reminders"
                    secondary="Get reminders before appointments"
                  />
                  <Switch
                    checked={notifications.appointment_reminders}
                    onChange={() => handleNotificationChange('appointment_reminders')}
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemIcon>
                    <Notifications />
                  </ListItemIcon>
                  <ListItemText
                    primary="Billing Alerts"
                    secondary="Receive alerts for bills and payments"
                  />
                  <Switch
                    checked={notifications.billing_alerts}
                    onChange={() => handleNotificationChange('billing_alerts')}
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemIcon>
                    <Notifications />
                  </ListItemIcon>
                  <ListItemText
                    primary="System Updates"
                    secondary="Get notified about system updates"
                  />
                  <Switch
                    checked={notifications.system_updates}
                    onChange={() => handleNotificationChange('system_updates')}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </TabPanel>

        {/* Security Tab */}
        <TabPanel value={activeTab} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Security Settings
                  </Typography>

                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <Security />
                      </ListItemIcon>
                      <ListItemText
                        primary="Two-Factor Authentication"
                        secondary="Add an extra layer of security"
                      />
                      <Switch
                        checked={security.two_factor_enabled}
                        onChange={() => handleSecurityChange('two_factor_enabled', !security.two_factor_enabled)}
                      />
                    </ListItem>
                    <Divider />
                    <ListItem>
                      <ListItemIcon>
                        <Notifications />
                      </ListItemIcon>
                      <ListItemText
                        primary="Login Alerts"
                        secondary="Get notified of new logins"
                      />
                      <Switch
                        checked={security.login_alerts}
                        onChange={() => handleSecurityChange('login_alerts', !security.login_alerts)}
                      />
                    </ListItem>
                    <Divider />
                    <ListItem>
                      <ListItemText
                        primary="Session Timeout"
                        secondary="Automatically log out after inactivity"
                      />
                      <FormControl sx={{ minWidth: 120 }}>
                        <Select
                          value={security.session_timeout}
                          onChange={(e) => handleSecurityChange('session_timeout', e.target.value)}
                        >
                          <MenuItem value={15}>15 minutes</MenuItem>
                          <MenuItem value={30}>30 minutes</MenuItem>
                          <MenuItem value={60}>1 hour</MenuItem>
                          <MenuItem value={120}>2 hours</MenuItem>
                        </Select>
                      </FormControl>
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={{ bgcolor: 'error.lighter', border: 1, borderColor: 'error.main' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="error">
                    Danger Zone
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Once you delete your account, there is no going back. Please be certain.
                  </Typography>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<Delete />}
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    Delete Account
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Appearance Tab */}
        <TabPanel value={activeTab} index={2}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Appearance Settings
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Customize how the application looks and feels
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        {mode === 'light' ? <Brightness7 /> : <Brightness4 />}
                      </ListItemIcon>
                      <ListItemText
                        primary="Theme Mode"
                        secondary={`Current theme: ${mode === 'light' ? 'Light' : 'Dark'}`}
                      />
                      <Button
                        variant="outlined"
                        onClick={toggleColorMode}
                        startIcon={mode === 'light' ? <Brightness4 /> : <Brightness7 />}
                      >
                        Switch to {mode === 'light' ? 'Dark' : 'Light'} Mode
                      </Button>
                    </ListItem>
                  </List>
                  <Divider sx={{ my: 2 }} />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Language</InputLabel>
                    <Select
                      value={appearance.language}
                      label="Language"
                      onChange={(e) => handleAppearanceChange('language', e.target.value)}
                    >
                      <MenuItem value="en">English</MenuItem>
                      <MenuItem value="hi">Hindi</MenuItem>
                      <MenuItem value="mr">Marathi</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Date Format</InputLabel>
                    <Select
                      value={appearance.date_format}
                      label="Date Format"
                      onChange={(e) => handleAppearanceChange('date_format', e.target.value)}
                    >
                      <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
                      <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
                      <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Time Format</InputLabel>
                    <Select
                      value={appearance.time_format}
                      label="Time Format"
                      onChange={(e) => handleAppearanceChange('time_format', e.target.value)}
                    >
                      <MenuItem value="12h">12 Hour</MenuItem>
                      <MenuItem value="24h">24 Hour</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </TabPanel>
      </Paper>

      {/* Delete Account Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Account</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete your account? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteAccount} color="error" variant="contained" disabled={loading}>
            Delete Account
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Settings;
