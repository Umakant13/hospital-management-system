import React from 'react';
import { Tabs, Tab, Box } from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import PersonIcon from '@mui/icons-material/Person';

const TabSelector = ({ value, onChange }) => {
  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
      <Tabs 
        value={value} 
        onChange={onChange} 
        variant="fullWidth"
        textColor="primary"
        indicatorColor="primary"
      >
        <Tab 
          icon={<AdminPanelSettingsIcon />} 
          label="Admin" 
          value="admin"
          sx={{ textTransform: 'none', fontSize: '1rem' }}
        />
        <Tab 
          icon={<LocalHospitalIcon />} 
          label="Doctor" 
          value="doctor"
          sx={{ textTransform: 'none', fontSize: '1rem' }}
        />
        <Tab 
          icon={<PersonIcon />} 
          label="Patient" 
          value="patient"
          sx={{ textTransform: 'none', fontSize: '1rem' }}
        />
      </Tabs>
    </Box>
  );
};

export default TabSelector;