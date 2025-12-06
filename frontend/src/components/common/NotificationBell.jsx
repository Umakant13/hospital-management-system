import React, { useState } from 'react';
import {
    IconButton,
    Badge,
    Menu,
    MenuItem,
    Typography,
    Box,
    Divider,
    Button,
    ListItemIcon,
    ListItemText,
    Avatar,
} from '@mui/material';
import {
    Notifications,
    MarkEmailRead,
    Delete,
    EventAvailable,
    Assessment,
    AttachMoney,
    LocalHospital,
    Science,
} from '@mui/icons-material';
import { useNotifications } from '@/hooks/useNotifications';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

const NotificationBell = () => {
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState(null);
    const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();

    console.log('NotificationBell: Rendering with', notifications.length, 'notifications, unread:', unreadCount);

    const handleClick = (event) => {
        console.log('NotificationBell: Opening menu');
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        console.log('NotificationBell: Closing menu');
        setAnchorEl(null);
    };

    const handleMarkAsRead = async (notificationId) => {
        console.log('NotificationBell: Marking notification as read:', notificationId);
        try {
            await markAsRead(notificationId);
        } catch (error) {
            console.error('NotificationBell: Error marking as read:', error);
        }
    };

    const handleDelete = async (notificationId) => {
        console.log('NotificationBell: Deleting notification:', notificationId);
        try {
            await deleteNotification(notificationId);
        } catch (error) {
            console.error('NotificationBell: Error deleting notification:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        console.log('NotificationBell: Marking all as read');
        try {
            await markAllAsRead();
        } catch (error) {
            console.error('NotificationBell: Error marking all as read:', error);
        }
    };

    const handleNotificationClick = async (notification) => {
        console.log('NotificationBell: Notification clicked:', notification);

        // Always mark as read (which deletes it)
        await handleMarkAsRead(notification.id);

        // Navigate to action URL if present
        if (notification.action_url) {
            console.log('NotificationBell: Navigating to:', notification.action_url);
            navigate(notification.action_url);
        }

        // Close the menu
        handleClose();
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'appointment':
                return <EventAvailable sx={{ fontSize: 20 }} />;
            case 'prescription':
                return <LocalHospital sx={{ fontSize: 20 }} />;
            case 'lab_test':
                return <Science sx={{ fontSize: 20 }} />;
            case 'medical_record':
                return <Assessment sx={{ fontSize: 20 }} />;
            case 'billing':
                return <AttachMoney sx={{ fontSize: 20 }} />;
            default:
                return <Notifications sx={{ fontSize: 20 }} />;
        }
    };

    const getNotificationColor = (type) => {
        switch (type) {
            case 'appointment':
                return '#4facfe';
            case 'prescription':
                return '#f5576c';
            case 'lab_test':
                return '#43e97b';
            case 'medical_record':
                return '#667eea';
            case 'billing':
                return '#fa709a';
            default:
                return '#757575';
        }
    };

    return (
        <>
            <IconButton
                color="inherit"
                onClick={handleClick}
                sx={{
                    '&:hover': {
                        bgcolor: 'action.hover',
                    },
                }}
            >
                <Badge badgeContent={unreadCount} color="error">
                    <Notifications />
                </Badge>
            </IconButton>

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                PaperProps={{
                    sx: {
                        width: 360,
                        maxHeight: '70vh', // Viewport-relative height to prevent overflow
                        overflowY: 'auto', // Enable scrolling
                        mt: 1.5,
                        '&::-webkit-scrollbar': {
                            width: '8px',
                        },
                        '&::-webkit-scrollbar-track': {
                            background: '#f1f1f1',
                        },
                        '&::-webkit-scrollbar-thumb': {
                            background: '#888',
                            borderRadius: '4px',
                        },
                        '&::-webkit-scrollbar-thumb:hover': {
                            background: '#555',
                        },
                    },
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">Notifications</Typography>
                    {unreadCount > 0 && (
                        <Button size="small" onClick={handleMarkAllAsRead} startIcon={<MarkEmailRead />}>
                            Mark all read
                        </Button>
                    )}
                </Box>

                <Divider />

                {notifications.length === 0 ? (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Notifications sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                        <Typography color="text.secondary">No notifications</Typography>
                    </Box>
                ) : (
                    <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                        {notifications.map((notification) => (
                            <MenuItem
                                key={notification.id}
                                onClick={() => handleNotificationClick(notification)}
                                sx={{
                                    py: 2,
                                    px: 2,
                                    bgcolor: notification.is_read ? 'transparent' : 'action.hover',
                                    borderBottom: '1px solid',
                                    borderColor: 'divider',
                                    whiteSpace: 'normal', // Allow text wrapping
                                    alignItems: 'flex-start', // Align items to top
                                    '&:hover': {
                                        bgcolor: 'action.selected',
                                    },
                                }}
                            >
                                <ListItemIcon>
                                    <Avatar
                                        sx={{
                                            bgcolor: `${getNotificationColor(notification.type)}20`,
                                            color: getNotificationColor(notification.type),
                                            width: 40,
                                            height: 40,
                                        }}
                                    >
                                        {getNotificationIcon(notification.type)}
                                    </Avatar>
                                </ListItemIcon>
                                <Box sx={{ flexGrow: 1, ml: 1 }}> {/* Replaced ListItemText with Box for flexible layout */}
                                    <Typography variant="subtitle2" fontWeight={notification.is_read ? 400 : 600} sx={{ mb: 0.5 }}>
                                        {notification.title}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                        {notification.message}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, ml: 1, minWidth: '30px' }}>
                                    <IconButton
                                        size="small"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(notification.id);
                                        }}
                                        title="Delete"
                                        sx={{
                                            color: 'error.main',
                                            '&:hover': { bgcolor: 'rgba(211, 47, 47, 0.04)' }
                                        }}
                                    >
                                        <Delete fontSize="small" />
                                    </IconButton>
                                </Box>
                            </MenuItem>
                        ))}
                    </Box>
                )}

                <Divider />
                <Box sx={{ p: 1.5, textAlign: 'center' }}>
                    <Button fullWidth onClick={() => { navigate('/notifications'); handleClose(); }}>
                        View All Notifications
                    </Button>
                </Box>
            </Menu>
        </>
    );
};

export default NotificationBell;