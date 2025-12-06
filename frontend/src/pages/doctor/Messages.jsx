import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  TextField,
  IconButton,
  Typography,
  Divider,
  Badge,
  InputAdornment,
  CircularProgress,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
} from '@mui/material';
import {
  Send,
  Search,
  Message as MessageIcon,
  Add,
  Refresh,
  ArrowBack,
} from '@mui/icons-material';
import { useAuthStore } from '@/store/authStore';
import { messageService } from '@/services/messageService';
import PageTitle from '@/components/common/PageTitle';
import { doctorService } from '@/services/doctorService';
import { formatDateTime, formatMessageDate } from '@/utils/helpers';
import { useForm } from 'react-hook-form';
import { useLocation } from 'react-router-dom';

const DoctorMessages = () => {
  const { user } = useAuthStore();
  const [allMessages, setAllMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [assignedPatients, setAssignedPatients] = useState([]);
  const [openNewMessage, setOpenNewMessage] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const location = useLocation();

  useEffect(() => {
    fetchDoctorProfile();
    fetchMessages();
  }, []);

  const fetchDoctorProfile = async () => {
    try {
      const doctors = await doctorService.getAllDoctors();
      const currentDoctor = doctors.find(d => d.user_id === user.id);
      if (currentDoctor) {
        setDoctorProfile(currentDoctor);
        // Fetch assigned patients
        const patients = await doctorService.getDoctorPatients(currentDoctor.doctor_id);
        console.log('Assigned patients:', patients);
        setAssignedPatients(patients || []);
      }
    } catch (error) {
      console.error('Error fetching doctor profile:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const data = await messageService.getAllMessages();
      setAllMessages(data || []);
      organizeConversations(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setAllMessages([]);
    } finally {
      setLoading(false);
    }
  };

  // Group messages by conversation (patient)
  const organizeConversations = (messages) => {
    const conversationMap = new Map();

    messages.forEach(msg => {
      // Determine the other person in conversation
      const otherPerson = msg.sender?.id === user.id ? msg.receiver : msg.sender;
      if (!otherPerson) return;

      const key = otherPerson.id;
      if (!conversationMap.has(key)) {
        conversationMap.set(key, {
          userId: otherPerson.id,
          userName: otherPerson.name,
          userRole: otherPerson.role,
          messages: [],
          lastMessage: null,
          unreadCount: 0,
        });
      }

      const conversation = conversationMap.get(key);
      conversation.messages.push(msg);

      // Update last message
      if (!conversation.lastMessage || new Date(msg.created_at) > new Date(conversation.lastMessage.created_at)) {
        conversation.lastMessage = msg;
      }

      // Count unread messages (received by me)
      if (msg.receiver?.id === user.id && !msg.is_read) {
        conversation.unreadCount++;
      }
    });

    // Sort conversations by last message time
    const sortedConversations = Array.from(conversationMap.values()).sort((a, b) => {
      const timeA = a.lastMessage ? new Date(a.lastMessage.created_at) : new Date(0);
      const timeB = b.lastMessage ? new Date(b.lastMessage.created_at) : new Date(0);
      return timeB - timeA;
    });

    setConversations(sortedConversations);

    // Update selected patient conversation if it exists
    if (selectedPatient) {
      const updatedConversation = sortedConversations.find(c => c.userId === selectedPatient.userId);
      if (updatedConversation) {
        setSelectedPatient(updatedConversation);
      }
    }
  };

  // Handle URL params for pre-selecting user
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const userId = params.get('user');
    if (userId && conversations.length > 0) {
      const targetConv = conversations.find(c => c.userId === parseInt(userId));
      if (targetConv) {
        handleSelectConversation(targetConv);
      } else {
        // If conversation doesn't exist yet, we might need to create a temporary one or open new message dialog
        // For now, let's try to find the patient in assigned patients and open new message dialog
        const patient = assignedPatients.find(p => p.user_id === parseInt(userId));
        if (patient) {
          setOpenNewMessage(true);
          // Pre-select patient in the dialog (requires handling in the dialog)
          // Or we can just set selectedPatient manually if we have enough info
        }
      }
    }
  }, [location.search, conversations, assignedPatients]);

  const handleSelectConversation = async (conversation) => {
    setSelectedPatient(conversation);

    // Mark all unread messages in this conversation as read
    const unreadMessages = conversation.messages.filter(
      msg => msg.receiver?.id === user.id && !msg.is_read
    );

    // Mark each unread message as read
    for (const msg of unreadMessages) {
      try {
        await messageService.markMessageAsRead(msg.id);
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    }

    // Refresh to update unread counts
    if (unreadMessages.length > 0) {
      fetchMessages();
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedPatient) return;

    try {
      await messageService.sendMessage({
        receiver_id: selectedPatient.userId,
        subject: 'Conversation',
        message: messageText,
      });
      setMessageText('');
      fetchMessages(); // Refresh to show new message
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleSendNewMessage = async (data) => {
    try {
      await messageService.sendMessage({
        receiver_id: parseInt(data.receiver_id),
        subject: data.subject || 'Conversation',
        message: data.message,
      });
      setOpenNewMessage(false);
      reset({});
      fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.userName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get messages for selected conversation, sorted by time
  const currentConversationMessages = selectedPatient
    ? selectedPatient.messages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    : [];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <PageTitle>
            Messages
          </PageTitle>
          <Typography variant="body2" color="text.secondary">
            Chat with your patients
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpenNewMessage(true)}
        >
          New Message
        </Button>
      </Box>

      <Paper elevation={2} sx={{ height: 'calc(100vh - 250px)', display: 'flex' }}>
        {/* Conversations List */}
        <Box sx={{
          width: { xs: '100%', md: 350 },
          borderRight: { xs: 'none', md: '1px solid #e0e0e0' },
          display: { xs: selectedPatient ? 'none' : 'flex', md: 'flex' },
          flexDirection: 'column'
        }}>
          <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search patients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
          <List sx={{ flex: 1, overflow: 'auto', p: 0 }}>
            {filteredConversations.map((conv) => (
              <ListItemButton
                key={conv.userId}
                selected={selectedPatient?.userId === conv.userId}
                onClick={() => handleSelectConversation(conv)}
                sx={{
                  borderBottom: '1px solid #f0f0f0',
                  '&.Mui-selected': {
                    bgcolor: '#e3f2fd',
                  },
                  '&:hover': {
                    bgcolor: '#f5f5f5',
                  },
                }}
              >
                <ListItemAvatar>
                  <Badge badgeContent={conv.unreadCount} color="error">
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      {conv.userName?.[0] || 'P'}
                    </Avatar>
                  </Badge>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography variant="body1" fontWeight="600">
                      {conv.userName || 'Unknown'}
                    </Typography>
                  }
                  secondary={
                    <Typography variant="body2" noWrap sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                      {conv.lastMessage?.message || 'No messages yet'}
                    </Typography>
                  }
                />
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                  {conv.lastMessage ? formatMessageDate(conv.lastMessage.created_at).split(' ')[0] : ''}
                </Typography>
              </ListItemButton>
            ))}
            {filteredConversations.length === 0 && (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <MessageIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 1 }} />
                <Typography color="text.secondary" sx={{ mb: 2 }}>
                  {searchQuery ? 'No conversations found' : 'No conversations yet'}
                </Typography>
                {!searchQuery && (
                  <Button
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={() => setOpenNewMessage(true)}
                  >
                    Start a conversation
                  </Button>
                )}
              </Box>
            )}
          </List>
        </Box>

        {/* Chat Area */}
        <Box sx={{
          flex: 1,
          display: { xs: selectedPatient ? 'flex' : 'none', md: 'flex' },
          flexDirection: 'column',
          position: 'relative', // Ensure stacking context
          zIndex: 1200, // Higher than global chatbot (1000) but lower than modals
          bgcolor: 'background.paper' // Ensure opacity
        }}>
          {selectedPatient ? (
            <>
              {/* Chat Header */}
              <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: '#f8f9fa' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {/* Back button for mobile */}
                  <IconButton
                    onClick={() => setSelectedPatient(null)}
                    sx={{ display: { xs: 'flex', md: 'none' } }}
                  >
                    <ArrowBack />
                  </IconButton>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    {selectedPatient.userName?.[0] || 'P'}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight="600">
                      {selectedPatient.userName || 'Patient'}
                    </Typography>
                    <Chip label={selectedPatient.userRole || 'patient'} size="small" sx={{ height: 20 }} />
                  </Box>
                </Box>
                <IconButton
                  onClick={fetchMessages}
                  color="primary"
                  size="small"
                  sx={{
                    '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.08)' }
                  }}
                >
                  <Refresh />
                </IconButton>
              </Box>

              {/* Messages */}
              <Box sx={{ flex: 1, overflow: 'auto', p: 2, bgcolor: '#fafafa' }}>
                {currentConversationMessages.map((msg, index) => {
                  const isOwnMessage = msg.sender?.id === user.id;
                  const showDateSeparator = index === 0 ||
                    new Date(msg.created_at).toDateString() !== new Date(currentConversationMessages[index - 1].created_at).toDateString();

                  return (
                    <React.Fragment key={msg.id}>
                      {showDateSeparator && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                          <Chip
                            label={new Date(msg.created_at).toLocaleDateString('en-US', {
                              day: 'numeric',
                              month: 'short',
                              year: new Date(msg.created_at).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                            })}
                            size="small"
                            sx={{
                              bgcolor: '#e0e0e0',
                              color: 'text.secondary',
                              fontSize: '0.75rem',
                              height: 24
                            }}
                          />
                        </Box>
                      )}
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
                          mb: 1.5,
                        }}
                      >
                        <Paper
                          elevation={1}
                          sx={{
                            p: 1.5,
                            maxWidth: '70%',
                            bgcolor: isOwnMessage ? '#dcf8c6' : 'white',
                            borderRadius: 2,
                          }}
                        >
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                            {msg.message}
                          </Typography>
                          <Typography variant="caption" sx={{ display: 'block', mt: 0.5, textAlign: 'right', color: 'text.secondary' }}>
                            {new Date(msg.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </Typography>
                        </Paper>
                      </Box>
                    </React.Fragment>
                  );
                })}
                {currentConversationMessages.length === 0 && (
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <MessageIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 1 }} />
                    <Typography color="text.secondary">No messages yet. Start the conversation!</Typography>
                  </Box>
                )}
              </Box>

              {/* Message Input */}
              <Box sx={{
                p: 2,
                pr: 12, // Increased padding to 96px to aggressively avoid AI chatbot overlap
                borderTop: '1px solid #e0e0e0',
                bgcolor: 'white',
                display: 'flex',
                gap: 1,
                position: 'relative',
                zIndex: 9999 // High z-index to ensure it is above everything else
              }}>
                <TextField
                  fullWidth
                  multiline
                  maxRows={4}
                  size="small"
                  placeholder="Type a message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                    },
                  }}
                />
                <IconButton
                  color="primary"
                  onClick={handleSendMessage}
                  disabled={!messageText.trim()}
                  sx={{
                    bgcolor: 'primary.main',
                    color: 'white',
                    zIndex: 10000, // Even higher z-index for the button itself
                    '&:hover': {
                      bgcolor: 'primary.dark',
                    },
                    '&.Mui-disabled': {
                      bgcolor: '#e0e0e0',
                      color: '#9e9e9e',
                    },
                  }}
                >
                  <Send />
                </IconButton>
              </Box>
            </>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <Box sx={{ textAlign: 'center' }}>
                <MessageIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  Select a patient to start messaging
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      </Paper>

      {/* New Message Dialog */}
      <Dialog open={openNewMessage} onClose={() => setOpenNewMessage(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit(handleSendNewMessage)}>
          <DialogTitle>New Message to Patient</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                select
                label="Select Patient"
                defaultValue=""
                {...register('receiver_id', { required: 'Please select a patient' })}
                error={!!errors.receiver_id}
                helperText={errors.receiver_id?.message}
              >
                {assignedPatients.map((patient) => (
                  <MenuItem key={patient.patient_id} value={patient.user_id}>
                    {patient.name} ({patient.patient_id})
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                fullWidth
                label="Subject (Optional)"
                {...register('subject')}
              />
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Message"
                {...register('message', { required: 'Message is required' })}
                error={!!errors.message}
                helperText={errors.message?.message}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenNewMessage(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Send</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default DoctorMessages;
