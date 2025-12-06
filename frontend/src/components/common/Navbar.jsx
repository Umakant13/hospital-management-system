import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  Box,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  Divider,
  Button,
  Popover,
  Chip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications,
  AccountCircle,
  Logout,
  Settings,
  MarkEmailRead,
  MenuOpen,
} from '@mui/icons-material';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';
import { getInitials } from '@/utils/helpers';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';

const Navbar = ({ onMenuClick, onDesktopToggle, desktopOpen }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchor, setNotificationAnchor] = useState(null);

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    // eslint-disable-next-line no-unused-vars
    deleteNotification,
  } = useNotifications();

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = (event) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  const handleProfile = () => {
    navigate('/profile');
    handleClose();
  };

  const handleSettings = () => {
    navigate('/settings');
    handleClose();
  };

  const handleLogout = () => {
    logout();
    handleClose();
  };

  const handleNotificationItemClick = async (notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    if (notification.action_url) {
      navigate(notification.action_url);
    }
    handleNotificationClose();
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        bgcolor: 'white',
        color: 'text.primary',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        borderBottom: '1px solid #e0e0e0'
      }}
    >
      <Toolbar>
        {/* Mobile Menu Toggle */}
        <IconButton
          color="inherit"
          edge="start"
          onClick={onMenuClick}
          sx={{ mr: 2, display: { xs: 'block', sm: 'none' } }}
        >
          <MenuIcon />
        </IconButton>

        {/* Desktop Menu Toggle */}
        <Tooltip title={desktopOpen ? "Collapse sidebar" : "Expand sidebar"}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={onDesktopToggle}
            sx={{
              mr: 2,
              display: { xs: 'none', sm: 'block' },
              transition: 'all 0.3s ease',
              '&:hover': {
                bgcolor: 'rgba(102, 126, 234, 0.08)'
              }
            }}
          >
            {desktopOpen ? <MenuOpen /> : <MenuIcon />}
          </IconButton>
        </Tooltip>

        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 2
            }}
          >
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>
              H
            </Typography>
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
              Hospital Management
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)} Portal
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Tooltip title="Notifications">
            <IconButton
              onClick={handleNotificationClick}
              sx={{
                bgcolor: unreadCount > 0 ? 'rgba(102, 126, 234, 0.08)' : 'transparent',
                '&:hover': {
                  bgcolor: 'rgba(102, 126, 234, 0.12)'
                }
              }}
            >
              <Badge badgeContent={unreadCount} color="error">
                <Notifications sx={{ color: 'text.primary' }} />
              </Badge>
            </IconButton>
          </Tooltip>

          <Tooltip title="Account">
            <IconButton onClick={handleMenu}>
              <Avatar
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  width: 40,
                  height: 40,
                  fontWeight: 600
                }}
              >
                {getInitials(user?.full_name || 'User')}
              </Avatar>
            </IconButton>
          </Tooltip>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{
              sx: {
                mt: 1.5,
                borderRadius: 3,
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                minWidth: 280,
                overflow: 'hidden',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              }
            }}
          >
            {/* User Info Header */}
            <Box
              sx={{
                p: 2.5,
                color: 'white'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                <Avatar
                  sx={{
                    width: 48,
                    height: 48,
                    bgcolor: 'rgba(255,255,255,0.2)',
                    border: '2px solid rgba(255,255,255,0.3)',
                    fontWeight: 700,
                    fontSize: '1.2rem'
                  }}
                >
                  {getInitials(user?.full_name || 'User')}
                </Avatar>
                <Box sx={{ ml: 1.5 }}>
                  <Typography variant="subtitle1" fontWeight="700" sx={{ lineHeight: 1.2 }}>
                    {user?.full_name}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      opacity: 0.85,
                      fontSize: '0.75rem',
                      display: 'block',
                      mt: 0.5
                    }}
                  >
                    {user?.email}
                  </Typography>
                </Box>
              </Box>
              <Chip
                label={user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                size="small"
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  height: 24,
                  '& .MuiChip-label': { px: 1.5 }
                }}
              />
            </Box>

            {/* Menu Items */}
            <Box sx={{ p: 1 }}>
              <MenuItem
                onClick={handleProfile}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  py: 1.5,
                  color: 'white',
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.15)',
                    transform: 'translateX(4px)'
                  }
                }}
              >
                <AccountCircle sx={{ mr: 1.5, fontSize: 22 }} />
                <Typography variant="body2" fontWeight="500">Profile</Typography>
              </MenuItem>
              <MenuItem
                onClick={handleSettings}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  py: 1.5,
                  color: 'white',
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.15)',
                    transform: 'translateX(4px)'
                  }
                }}
              >
                <Settings sx={{ mr: 1.5, fontSize: 22 }} />
                <Typography variant="body2" fontWeight="500">Settings</Typography>
              </MenuItem>
            </Box>

            <Divider sx={{ borderColor: 'rgba(255,255,255,0.2)', my: 1 }} />

            {/* Logout Button */}
            <Box sx={{ p: 1 }}>
              <MenuItem
                onClick={handleLogout}
                sx={{
                  borderRadius: 2,
                  py: 1.5,
                  color: 'white',
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: 'rgba(255, 100, 100, 0.3)',
                    transform: 'translateX(4px)'
                  }
                }}
              >
                <Logout sx={{ mr: 1.5, fontSize: 22 }} />
                <Typography variant="body2" fontWeight="600">Logout</Typography>
              </MenuItem>
            </Box>
          </Menu>

          {/* Notifications Popover */}
          <Popover
            open={Boolean(notificationAnchor)}
            anchorEl={notificationAnchor}
            onClose={handleNotificationClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            PaperProps={{
              sx: {
                width: 380,
                maxHeight: 480,
                mt: 1.5,
                borderRadius: 2,
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
              },
            }}
          >
            <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" fontWeight="600">Notifications</Typography>
              {unreadCount > 0 && (
                <Button
                  size="small"
                  startIcon={<MarkEmailRead sx={{ fontSize: 18 }} />}
                  onClick={markAllAsRead}
                  sx={{ fontSize: '0.85rem' }}
                >
                  Mark all read
                </Button>
              )}
            </Box>
            <Divider />
            <List sx={{ maxHeight: 400, overflow: 'auto', p: 1 }}>
              {notifications.length === 0 ? (
                <ListItem sx={{ py: 4 }}>
                  <ListItemText
                    primary={
                      <Typography variant="body2" align="center" color="text.secondary">
                        No notifications
                      </Typography>
                    }
                    secondary={
                      <Typography variant="caption" align="center" display="block" color="text.secondary">
                        You're all caught up!
                      </Typography>
                    }
                  />
                </ListItem>
              ) : (
                notifications.slice(0, 10).map((notification) => (
                  <ListItem
                    key={notification.id}
                    button
                    onClick={() => handleNotificationItemClick(notification)}
                    sx={{
                      bgcolor: notification.is_read ? 'transparent' : 'rgba(102, 126, 234, 0.08)',
                      borderRadius: 1.5,
                      mb: 0.5,
                      '&:hover': {
                        bgcolor: notification.is_read ? 'action.hover' : 'rgba(102, 126, 234, 0.12)'
                      }
                    }}
                  >
                    <ListItemText
                      primary={
                        <Typography variant="body2" fontWeight="600">
                          {notification.title}
                        </Typography>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" component="span" color="text.secondary">
                            {notification.message}
                          </Typography>
                          <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                ))
              )}
            </List>
          </Popover>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;