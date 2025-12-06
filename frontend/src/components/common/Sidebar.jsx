import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Box,
  Divider,
  Collapse,
  Typography,
} from '@mui/material';
import {
  Dashboard,
  People,
  LocalHospital,
  CalendarMonth,
  Assignment,
  BarChart,
  Message,
  ExpandLess,
  ExpandMore,
  Description,
  PersonAdd,
  MedicalServices,
  Biotech,
  AttachMoney,
  Settings,
  Event,
  Favorite,
  Receipt,

  AdminPanelSettings,
  AutoAwesome,
  Badge,
  VideoCall,
  RateReview,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { USER_ROLES } from '@/utils/constants';
import { departmentService } from '@/services/departmentService';

const drawerWidth = 260;

const Sidebar = ({ mobileOpen, onDrawerToggle, desktopOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const [openMenus, setOpenMenus] = React.useState({});
  const [isHeadDoctor, setIsHeadDoctor] = React.useState(false);

  React.useEffect(() => {
    const checkHeadDoctorStatus = async () => {
      if (user?.role === USER_ROLES.DOCTOR && user.doctor_internal_id) {
        try {
          const departments = await departmentService.getAllDepartments();
          const isHead = departments.some(dept => dept.head_doctor_id === user.doctor_internal_id);
          setIsHeadDoctor(isHead);
        } catch (error) {
          console.error('Error checking head doctor status:', error);
        }
      }
    };

    checkHeadDoctorStatus();
  }, [user]);

  const handleMenuClick = (menu) => {
    setOpenMenus((prev) => ({ ...prev, [menu]: !prev[menu] }));
  };

  const isActive = (path) => location.pathname === path;

  // Admin Menu Items
  const adminMenuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/admin/dashboard' },
    {
      text: 'Users',
      icon: <People />,
      submenu: [
        { text: 'All Users', icon: <People />, path: '/admin/users' },
        { text: 'User Roles', icon: <AdminPanelSettings />, path: '/admin/user-roles' },
      ],
    },
    {
      text: 'Patients',
      icon: <LocalHospital />,
      submenu: [
        { text: 'All Patients', icon: <People />, path: '/admin/patients' },
        { text: 'Patient Analytics', icon: <BarChart />, path: '/admin/patient-analytics' },
      ],
    },
    {
      text: 'Doctors',
      icon: <MedicalServices />,
      submenu: [
        { text: 'All Doctors', icon: <People />, path: '/admin/doctors' },
        { text: 'Doctor Analytics', icon: <BarChart />, path: '/admin/doctor-analytics' },
      ],
    },
    {
      text: 'Staff',
      icon: <Badge />,
      submenu: [
        { text: 'All Staff', icon: <People />, path: '/admin/staff' },
        { text: 'Staff Analytics', icon: <BarChart />, path: '/admin/staff-analytics' },
      ],
    },
    {
      text: 'Departments',
      icon: <LocalHospital />,
      submenu: [
        { text: 'All Departments', icon: <LocalHospital />, path: '/admin/departments' },
        { text: 'Department Analytics', icon: <BarChart />, path: '/admin/department-analytics' },
      ],
    },
    { text: 'Appointments', icon: <CalendarMonth />, path: '/admin/appointments' },
    { text: 'Medical Records', icon: <Assignment />, path: '/admin/medical-records' },
    { text: 'Prescriptions', icon: <Description />, path: '/admin/prescriptions' },
    { text: 'Lab Tests', icon: <Biotech />, path: '/admin/lab-tests' },
    { text: 'Billing', icon: <AttachMoney />, path: '/admin/billing' },
    { text: 'Analytics', icon: <BarChart />, path: '/admin/analytics' },
    { text: 'Reports', icon: <Description />, path: '/admin/reports' },
    { text: 'AI Assistant', icon: <AutoAwesome />, path: '/ai-assistant' },
    { text: 'Settings', icon: <Settings />, path: '/settings', divider: true },
  ];

  const doctorMenuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/doctor/dashboard' },
    ...(isHeadDoctor ? [{ text: 'Department', icon: <LocalHospital />, path: '/doctor/department' }] : []),
    { text: 'My Patients', icon: <People />, path: '/doctor/patients' },
    { text: 'Appointments', icon: <CalendarMonth />, path: '/doctor/appointments' },
    { text: 'Video Consultations', icon: <VideoCall />, path: '/doctor/video-consultations' },
    { text: 'Medical Records', icon: <Assignment />, path: '/doctor/medical-records' },
    { text: 'Prescriptions', icon: <Description />, path: '/doctor/prescriptions' },
    { text: 'Lab Tests', icon: <Biotech />, path: '/doctor/lab-tests' },
    { text: 'Billing', icon: <AttachMoney />, path: '/doctor/billing' },
    { text: 'Messages', icon: <Message />, path: '/doctor/messages' },
    { text: 'Schedule', icon: <Event />, path: '/doctor/schedule' },
    { text: 'Ratings & Reviews', icon: <RateReview />, path: '/doctor/reviews' },
    { text: 'AI Assistant', icon: <AutoAwesome />, path: '/ai-assistant' },
    { text: 'Settings', icon: <Settings />, path: '/settings', divider: true },
  ];

  // Patient Menu Items
  const patientMenuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/patient/dashboard' },
    { text: 'My Health', icon: <Favorite />, path: '/patient/health' },
    { text: 'My Doctor', icon: <MedicalServices />, path: '/patient/doctors' },
    {
      text: 'Appointments',
      icon: <CalendarMonth />,
      submenu: [
        { text: 'Book Appointment', icon: <CalendarMonth />, path: '/patient/book-appointment' },
        { text: 'My Appointments', icon: <Assignment />, path: '/patient/appointments' },
      ],
    },
    { text: 'Video Consultations', icon: <VideoCall />, path: '/patient/video-consultations' },
    { text: 'Medical Records', icon: <Assignment />, path: '/patient/medical-records' },
    { text: 'Prescriptions', icon: <Description />, path: '/patient/prescriptions' },
    { text: 'Lab Tests', icon: <Biotech />, path: '/patient/lab-tests' },
    { text: 'Messages', icon: <Message />, path: '/patient/messages' },
    { text: 'Billing', icon: <Receipt />, path: '/patient/billing' },
    { text: 'AI Health Assistant', icon: <AutoAwesome />, path: '/patient/ai-health' },
    { text: 'Settings', icon: <Settings />, path: '/patient/settings', divider: true },
  ];

  const getMenuItems = () => {
    switch (user?.role) {
      case USER_ROLES.ADMIN:
        return adminMenuItems;
      case USER_ROLES.DOCTOR:
        return doctorMenuItems;
      case USER_ROLES.PATIENT:
        return patientMenuItems;
      default:
        return [];
    }
  };

  const renderMenuItem = (item, index) => {
    if (item.submenu) {
      return (
        <React.Fragment key={index}>
          {item.divider && <Divider sx={{ my: 2 }} />}
          <ListItemButton
            onClick={() => handleMenuClick(item.text)}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              '&:hover': {
                bgcolor: 'rgba(102, 126, 234, 0.08)',
              }
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: 'text.secondary' }}>{item.icon}</ListItemIcon>
            <ListItemText
              primary={item.text}
              primaryTypographyProps={{
                fontSize: '0.9rem',
                fontWeight: 500
              }}
            />
            {openMenus[item.text] ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
          <Collapse in={openMenus[item.text]} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.submenu.map((subItem, subIndex) => (
                <ListItemButton
                  key={subIndex}
                  sx={{
                    pl: 4,
                    borderRadius: 2,
                    mb: 0.5,
                    '&.Mui-selected': {
                      bgcolor: 'rgba(102, 126, 234, 0.12)',
                      color: 'primary.main',
                      '& .MuiListItemIcon-root': {
                        color: 'primary.main',
                      },
                      '&:hover': {
                        bgcolor: 'rgba(102, 126, 234, 0.16)',
                      }
                    },
                    '&:hover': {
                      bgcolor: 'rgba(102, 126, 234, 0.08)',
                    }
                  }}
                  selected={isActive(subItem.path)}
                  onClick={() => {
                    navigate(subItem.path);
                    if (mobileOpen) onDrawerToggle();
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: 'text.secondary' }}>{subItem.icon}</ListItemIcon>
                  <ListItemText
                    primary={subItem.text}
                    primaryTypographyProps={{
                      fontSize: '0.9rem',
                      fontWeight: 500
                    }}
                  />
                </ListItemButton>
              ))}
            </List>
          </Collapse>
        </React.Fragment>
      );
    }

    return (
      <React.Fragment key={index}>
        {item.divider && <Divider sx={{ my: 2 }} />}
        <ListItemButton
          selected={isActive(item.path)}
          onClick={() => {
            navigate(item.path);
            if (mobileOpen) onDrawerToggle();
          }}
          sx={{
            borderRadius: 2,
            mb: 0.5,
            '&.Mui-selected': {
              bgcolor: 'rgba(102, 126, 234, 0.12)',
              color: 'primary.main',
              '& .MuiListItemIcon-root': {
                color: 'primary.main',
              },
              '&:hover': {
                bgcolor: 'rgba(102, 126, 234, 0.16)',
              }
            },
            '&:hover': {
              bgcolor: 'rgba(102, 126, 234, 0.08)',
            }
          }}
        >
          <ListItemIcon sx={{ minWidth: 40, color: 'text.secondary' }}>{item.icon}</ListItemIcon>
          <ListItemText
            primary={item.text}
            primaryTypographyProps={{
              fontSize: '0.9rem',
              fontWeight: 500
            }}
          />
        </ListItemButton>
      </React.Fragment>
    );
  };

  const drawer = (
    <Box>
      <Toolbar />
      <Divider />
      <Box sx={{ px: 2, py: 2 }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1 }}>
          MAIN MENU
        </Typography>
      </Box>
      <List sx={{ px: 1 }}>
        {getMenuItems().map((item, index) => renderMenuItem(item, index))}
      </List>
    </Box>
  );

  return (
    <>
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
      >
        {drawer}
      </Drawer>

      {/* Desktop Drawer */}
      <Drawer
        variant="persistent"
        open={desktopOpen}
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            borderRight: '1px solid #e0e0e0',
            boxShadow: 'none',
          },
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
};

export default Sidebar;