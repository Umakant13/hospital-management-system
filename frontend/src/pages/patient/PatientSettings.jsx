import Settings from '@/pages/Settings';

// Re-export the generic Settings page for use in the Patient Portal
// This allows for future customization specific to patients if needed,
// while currently sharing the robust implementations for Notifications, Security, and Appearance.
const PatientSettings = Settings;

export default PatientSettings;
