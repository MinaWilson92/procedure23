import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Alert, Grid, Card, CardContent,
  Paper, alpha, LinearProgress, Badge, Chip, Menu, MenuItem,
  List, ListItem, ListItemText, Divider, IconButton, Popover
} from '@mui/material';
import {
  Dashboard, Schedule, TrendingUp, Error as ErrorIcon,
  Folder, Person, CloudUpload, Warning, CheckCircle,
  Business, Assessment, Star, Timeline, BarChart,
  PieChart, Security, CalendarToday, Notifications,
  NotificationsActive, AdminPanelSettings, Upload
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const HomePage = ({ user, dashboardData, procedures, sharePointAvailable }) => {
  const [currentPage, setCurrentPage] = useState('home');
  const [notifications, setNotifications] = useState([]);
  const [notificationAnchor, setNotificationAnchor] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Mock navigation function for demo
  const navigate = (page, data = {}) => {
    setCurrentPage(page);
    console.log('📍 Navigating to:', page);
  };

  // Check if user is admin
  const isAdmin = user?.role === 'admin';
  
  // Check if user is uploader (admin or has upload permissions)
  const isUploader = isAdmin || user?.permissions?.includes('upload') || user?.role === 'uploader';

  // Mock data for demo
  const stats = {
    total: 247,
    expiringSoon: 23,
    expired: 8,
    highQuality: 186
  };

  // Generate notifications based on real data
  useEffect(() => {
    const generateNotifications = () => {
      const notifs = [];
      let unread = 0;

      // Critical notifications for expired procedures
      if (stats.expired > 0) {
        notifs.push({
          id: 1,
          type: 'critical',
          title: 'Procedures Expired',
          message: `${stats.expired} procedure${stats.expired !== 1 ? 's have' : ' has'} expired and require immediate attention`,
          time: '2 hours ago',
          unread: true,
          action: () => navigate('procedures', { filter: 'expired' })
        });
        unread++;
      }

      // Warning notifications for expiring procedures
      if (stats.expiringSoon > 0) {
        notifs.push({
          id: 2,
          type: 'warning',
          title: 'Procedures Expiring Soon',
          message: `${stats.expiringSoon} procedure${stats.expiringSoon !== 1 ? 's are' : ' is'} expiring within 30 days`,
          time: '4 hours ago',
          unread: true,
          action: () => navigate('procedures', { filter: 'expiring' })
        });
        unread++;
      }

      // Info notifications for recent uploads (admin only)
      if (isAdmin) {
        notifs.push({
          id: 3,
          type: 'info',
          title: 'New Procedure Uploaded',
          message: 'Risk Assessment Framework v2.1 was uploaded by John Smith',
          time: '1 day ago',
          unread: false,
          action: () => navigate('admin-panel', { tab: 'audit' })
        });

        notifs.push({
          id: 4,
          type: 'success',
          title: 'Quality Score Improved',
          message: 'Overall quality score increased to 84% (+3% this month)',
          time: '2 days ago',
          unread: false,
          action: () => navigate('admin-panel', { tab: 'analytics' })
        });
      }

      // Success notification for compliance
      if (stats.expired === 0 && stats.expiringSoon <= 5) {
        notifs.push({
          id: 5,
          type: 'success',
          title: 'Excellent Compliance',
          message: 'All procedures are up to date with high quality scores',
          time: '1 week ago',
          unread: false,
          action: () => navigate('procedures')
        });
      }

      setNotifications(notifs);
      setUnreadCount(unread);
    };

    generateNotifications();
  }, [stats, isAdmin]);

  const handleNotificationClick = (event) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(false);
  };

  const handleNotificationItemClick = (notification) => {
    if (notification.action) {
      notification.action();
    }
    // Mark as read
    setNotifications(prev => 
      prev.map(n => n.id === notification.id ? { ...n, unread: false } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
    handleNotificationClose();
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'critical': return <ErrorIcon sx={{ color: '#f44336' }} />;
      case 'warning': return <Warning sx={{ color: '#ff9800' }} />;
      case 'success': return <CheckCircle sx={{ color: '#4caf50' }} />;
      default: return <Notifications sx={{ color: '#2196f3' }} />;
    }
  };

  // Define quick links based on user role
  const quickLinks = [
    { 
      title: 'All Procedures', 
      path: 'procedures', 
      icon: <Folder />, 
      color: '#1976d2',
      description: 'View all procedures',
      count: stats.total,
      show: true
    },
    { 
      title: 'Admin Panel', 
      path: 'admin-panel', 
      icon: <AdminPanelSettings />, 
      color: '#f44336',
      description: 'Manage procedures & users',
      count: '⚙️',
      show: isAdmin
    },
    { 
      title: 'Upload New', 
      path: 'upload-procedure', 
      icon: <Upload />, 
      color: '#7b1fa2',
      description: 'Upload new procedure',
      count: '+',
      show: isUploader
    }
  ].filter(link => link.show);

  return (
    <Box>
      {/* Enhanced Header */}
      <Box sx={{ 
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
        color: 'white',
        py: 3,
        px: 3,
        mb: 4,
        borderRadius: 2,
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Left Side - Logo and Title */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{
              width: 80, height: 40,
              background: 'linear-gradient(135deg, #d40000, #b30000)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '16px',
              borderRadius: 1
            }}>
              HBEG
            </Box>
            <Box>
              <Typography variant="h4" fontWeight="bold">
                Procedures Hub
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Centralized procedure management with AI-powered quality analysis
              </Typography>
            </Box>
          </Box>

          {/* Right Side - User Info and Notifications */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Working Notifications Bell */}
            <IconButton
              color="inherit"
              onClick={handleNotificationClick}
              sx={{ 
                position: 'relative',
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
              }}
            >
              <Badge badgeContent={unreadCount} color="error">
                {unreadCount > 0 ? <NotificationsActive /> : <Notifications />}
              </Badge>
            </IconButton>

            {/* User Info */}
            {user && (
              <>
                <Chip 
                  label={user.displayName || user.staffId}
                  variant="outlined"
                  sx={{ color: 'white', borderColor: 'white' }}
                />
                <Chip 
                  label={user.role}
                  size="small"
                  sx={{ 
                    bgcolor: user.role === 'admin' ? '#f44336' : 
                            isUploader ? '#ff9800' : 'rgba(255,255,255,0.2)',
                    color: 'white'
                  }}
                />
              </>
            )}
          </Box>
        </Box>
      </Box>

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
      >
        <Box sx={{ width: 400, maxHeight: 500, overflow: 'auto' }}>
          <Box sx={{ p: 2, borderBottom: '1px solid #eee' }}>
            <Typography variant="h6" fontWeight="bold">
              Notifications ({unreadCount} unread)
            </Typography>
          </Box>
          <List sx={{ p: 0 }}>
            {notifications.length > 0 ? (
              notifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  <ListItem
                    button
                    onClick={() => handleNotificationItemClick(notification)}
                    sx={{
                      backgroundColor: notification.unread ? alpha('#2196f3', 0.05) : 'transparent',
                      borderLeft: notification.unread ? '4px solid #2196f3' : '4px solid transparent',
                      '&:hover': {
                        backgroundColor: alpha('#2196f3', 0.08)
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, width: '100%' }}>
                      {getNotificationIcon(notification.type)}
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" fontWeight={notification.unread ? 'bold' : 'normal'}>
                          {notification.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                          {notification.message}
                        </Typography>
                        <Typography variant="caption" color="primary" sx={{ display: 'block', mt: 0.5 }}>
                          {notification.time}
                        </Typography>
                      </Box>
                      {notification.unread && (
                        <Box sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: '#2196f3',
                          mt: 1
                        }} />
                      )}
                    </Box>
                  </ListItem>
                  {index < notifications.length - 1 && <Divider />}
                </React.Fragment>
              ))
            ) : (
              <ListItem>
                <ListItemText 
                  primary="No notifications"
                  secondary="You're all caught up!"
                  sx={{ textAlign: 'center' }}
                />
              </ListItem>
            )}
          </List>
        </Box>
      </Popover>

      {/* SharePoint Status & User Welcome */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          {user && (
            <Alert severity="success" sx={{ mb: 0 }}>
              Welcome back, <strong>{user.displayName || user.staffId}</strong>! 
              You are logged in as <strong>{user.role}</strong>.
              {user.permissions && (
                <Typography variant="caption" display="block" sx={{ mt: 0.5, opacity: 0.8 }}>
                  Permissions: {user.permissions.join(', ')}
                </Typography>
              )}
            </Alert>
          )}
        </Grid>
        <Grid item xs={12} md={4}>
          <Alert 
            severity={sharePointAvailable ? "success" : "info"} 
            sx={{ mb: 0 }}
            icon={sharePointAvailable ? <CheckCircle /> : <Warning />}
          >
            <Typography variant="body2" fontWeight="bold">
              {sharePointAvailable ? 'SharePoint Connected' : 'Demo Mode'}
            </Typography>
            <Typography variant="caption">
              {sharePointAvailable ? 
                `${stats.total} procedures loaded from SharePoint` : 
                'Using sample data for demonstration'
              }
            </Typography>
          </Alert>
        </Grid>
      </Grid>

      {/* Enhanced Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Total Procedures Card */}
        <Grid item xs={12} sm={6} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card sx={{ 
              height: '100%', 
              background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)', 
              color: 'white',
              boxShadow: '0 8px 32px rgba(25,118,210,0.3)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              border: '2px solid transparent',
              '&:hover': {
                border: '2px solid rgba(255,255,255,0.3)',
                transform: 'translateY(-6px)', 
                boxShadow: '0 12px 40px rgba(25,118,210,0.4)'
              }
            }}
            onClick={() => navigate('procedures', { filter: 'all' })}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography color="rgba(255,255,255,0.8)" variant="body2" gutterBottom>
                      Total Procedures
                    </Typography>
                    <Typography variant="h2" fontWeight="bold" sx={{ mb: 1 }}>
                      {stats.total}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TrendingUp sx={{ fontSize: 16 }} />
                      <Typography variant="caption">
                        Click to view all procedures
                      </Typography>
                    </Box>
                  </Box>
                  <Dashboard sx={{ fontSize: 50, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Need Attention Card */}
        <Grid item xs={12} sm={6} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card sx={{ 
              height: '100%', 
              background: stats.expiringSoon > 0 ? 
                'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)' :
                'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)', 
              color: 'white',
              boxShadow: `0 8px 32px ${stats.expiringSoon > 0 ? 'rgba(255,152,0,0.3)' : 'rgba(76,175,80,0.3)'}`,
              cursor: stats.expiringSoon > 0 ? 'pointer' : 'default',
              transition: 'all 0.3s ease',
              border: '2px solid transparent',
              '&:hover': stats.expiringSoon > 0 ? {
                border: '2px solid rgba(255,255,255,0.3)',
                transform: 'translateY(-6px)',
                boxShadow: '0 12px 40px rgba(255,152,0,0.4)'
              } : {}
            }}
            onClick={() => stats.expiringSoon > 0 && navigate('procedures', { filter: 'expiring' })}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography color="rgba(255,255,255,0.8)" variant="body2" gutterBottom>
                      {stats.expiringSoon > 0 ? 'Need Attention' : 'All Current'}
                    </Typography>
                    <Typography variant="h2" fontWeight="bold" sx={{ mb: 1 }}>
                      {stats.expiringSoon}
                    </Typography>
                    <Typography variant="caption">
                      {stats.expiringSoon > 0 ? 
                        'Click to view expiring procedures' : 
                        'No urgent actions needed'
                      }
                    </Typography>
                  </Box>
                  <Badge 
                    badgeContent={stats.expiringSoon} 
                    color="error"
                    invisible={stats.expiringSoon === 0}
                  >
                    {stats.expiringSoon > 0 ? 
                      <Schedule sx={{ fontSize: 50, opacity: 0.3 }} /> :
                      <CheckCircle sx={{ fontSize: 50, opacity: 0.3 }} />
                    }
                  </Badge>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Compliance Card */}
        <Grid item xs={12} sm={6} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card sx={{ 
              height: '100%', 
              background: stats.expired > 0 ?
                'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)' :
                'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)', 
              color: 'white',
              boxShadow: `0 8px 32px ${stats.expired > 0 ? 'rgba(244,67,54,0.3)' : 'rgba(76,175,80,0.3)'}`,
              cursor: 'default',
              transition: 'all 0.3s ease'
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography color="rgba(255,255,255,0.8)" variant="body2" gutterBottom>
                      {stats.expired > 0 ? 'Expired' : 'Compliance'}
                    </Typography>
                    <Typography variant="h2" fontWeight="bold" sx={{ mb: 1 }}>
                      {stats.expired > 0 ? stats.expired : '100%'}
                    </Typography>
                    <Typography variant="caption">
                      {stats.expired > 0 ? 'Require immediate update' : 'All procedures current'}
                    </Typography>
                  </Box>
                  <Badge 
                    badgeContent={stats.expired} 
                    color="error"
                    invisible={stats.expired === 0}
                  >
                    {stats.expired > 0 ? 
                      <ErrorIcon sx={{ fontSize: 50, opacity: 0.3 }} /> :
                      <Star sx={{ fontSize: 50, opacity: 0.3 }} />
                    }
                  </Badge>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* High Quality Card */}
        <Grid item xs={12} sm={6} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card sx={{ 
              height: '100%', 
              background: 'linear-gradient(135deg, #7b1fa2 0%, #6a1b9a 100%)', 
              color: 'white',
              boxShadow: '0 8px 32px rgba(123,31,162,0.3)',
              cursor: 'default',
              transition: 'all 0.3s ease'
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography color="rgba(255,255,255,0.8)" variant="body2" gutterBottom>
                      High Quality
                    </Typography>
                    <Typography variant="h2" fontWeight="bold" sx={{ mb: 1 }}>
                      {stats.highQuality}
                    </Typography>
                    <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>
                      {stats.total > 0 ? Math.round((stats.highQuality / stats.total) * 100) : 0}% of total
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={stats.total > 0 ? (stats.highQuality / stats.total) * 100 : 0} 
                      sx={{ 
                        backgroundColor: 'rgba(255,255,255,0.3)',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: 'rgba(255,255,255,0.8)'
                        }
                      }}
                    />
                  </Box>
                  <Assessment sx={{ fontSize: 50, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* Role-Based Quick Access Links */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {quickLinks.map((link, index) => (
          <Grid item xs={12} md={quickLinks.length > 2 ? 4 : 6} key={link.path}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
            >
              <Card 
                sx={{ 
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                  '&:hover': {
                    transform: 'translateY(-6px)',
                    boxShadow: `0 12px 40px ${alpha(link.color, 0.2)}`,
                    '& .icon-box': {
                      backgroundColor: link.color,
                      color: 'white'
                    }
                  }
                }}
                onClick={() => navigate(link.path)}
              >
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box 
                        className="icon-box"
                        sx={{ 
                          p: 2, 
                          borderRadius: 3, 
                          bgcolor: alpha(link.color, 0.1),
                          color: link.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        {link.icon}
                      </Box>
                      <Typography variant="h5" fontWeight="bold" color={link.color}>
                        {link.title}
                      </Typography>
                    </Box>
                    <Typography variant="h3" fontWeight="bold" color={link.color}>
                      {link.count}
                    </Typography>
                  </Box>
                  <Typography variant="body1" color="text.secondary">
                    {link.description}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Role Information Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.7 }}
      >
        <Alert 
          severity={isAdmin ? "error" : isUploader ? "warning" : "info"} 
          sx={{ mb: 4 }}
        >
          <Typography variant="h6" gutterBottom>
            {isAdmin ? '🔐 Administrator Access' : 
             isUploader ? '📤 Upload Permissions' : 
             '👤 Standard User'}
          </Typography>
          <Typography variant="body2">
            {isAdmin ? 
              'You have full administrative access including user management, audit logs, and procedure deletion.' :
              isUploader ?
              'You can upload new procedures and view your upload history.' :
              'You can view all procedures and receive notifications about expiring documents.'
            }
          </Typography>
        </Alert>
      </motion.div>
    </Box>
  );
};

export default HomePage;
