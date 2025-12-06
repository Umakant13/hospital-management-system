import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Box, Toolbar } from '@mui/material';
import Navbar from '@/components/common/Navbar';
import Sidebar from '@/components/common/Sidebar';
import AIChatbot from '@/components/common/AIChatbot';

const drawerWidth = 260;

const MainLayout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(true);
  const location = useLocation();

  // Pages where global AI Chatbot should be hidden
  const hideChatbotPaths = [
    '/doctor/messages',
    '/patient/messages',
    '/admin/messages'
  ];

  const shouldShowChatbot = !hideChatbotPaths.some(path => location.pathname.startsWith(path));

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleDesktopToggle = () => {
    setDesktopOpen(!desktopOpen);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <Navbar
        onMenuClick={handleDrawerToggle}
        onDesktopToggle={handleDesktopToggle}
        desktopOpen={desktopOpen}
      />
      <Sidebar
        mobileOpen={mobileOpen}
        onDrawerToggle={handleDrawerToggle}
        desktopOpen={desktopOpen}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: '100%',
          minHeight: '100vh',
          backgroundColor: '#f8f9fa',
          transition: 'margin-left 0.3s ease',
          marginLeft: {
            xs: 0,
            sm: desktopOpen ? `${drawerWidth}px` : 0
          }
        }}
      >
        <Toolbar />
        {children}
      </Box>
      {shouldShowChatbot && <AIChatbot />}
    </Box>
  );
};

export default MainLayout;