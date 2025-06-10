// components/EmailManagement.js - Enhanced with Expiring Procedures & Email Logs
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Tabs, Tab, Paper, Alert, Grid, Card, CardContent,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, LinearProgress, IconButton, Button, Divider, List, ListItem,
  ListItemText, ListItemIcon, Avatar, Badge
} from '@mui/material';
import {
  Settings, People, Email, Notifications, Schedule, Warning,
  CheckCircle, Error as ErrorIcon, Refresh, Timeline,
  CalendarToday, Send, MailOutline
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import ConfigureRecipients from './email/ConfigureRecipients';
import NotificationSettings from './email/NotificationSettings';
import CustomTemplates from './email/CustomTemplates';
import EmailNotificationService from '../services/EmailNotificationService';

const EmailManagement = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [emailService] = useState(() => new EmailNotificationService());
  const [expiringProcedures, setExpiringProcedures] = useState([]);
  const [emailActivityLog, setEmailActivityLog] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  useEffect(() => {
    if (activeTab === 3) { // Expiring Procedures tab
      loadExpiringProcedures();
    } else if (activeTab === 4) { // Email Activity Log tab
      loadEmailActivityLog();
    }
  }, [activeTab]);

  const loadExpiringProcedures = async () => {
    try {
      setLoading(true);
      console.log('📅 Loading expiring procedures...');
      
      const procedures = await emailService.getExpiringProcedures();
      setExpiringProcedures(procedures);
      
      console.log('✅ Expiring procedures loaded:', procedures.length);
      
    } catch (error) {
      console.error('❌ Error loading expiring procedures:', error);
      setMessage({ type: 'error', text: 'Failed to load expiring procedures: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const loadEmailActivityLog = async () => {
    try {
      setLoading(true);
      console.log('📧 Loading email activity log...');
      
      const activityLog = await emailService.getEmailActivityLog(100);
      setEmailActivityLog(activityLog);
      
      console.log('✅ Email activity log loaded:', activityLog.length);
      
    } catch (error) {
      console.error('❌ Error loading email activity log:', error);
      setMessage({ type: 'error', text: 'Failed to load email activity log: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleManualCheck = async () => {
    try {
      setLoading(true);
      setMessage(null);
      
      console.log('🔍 Running manual notification check...');
      await emailService.checkAndSendNotifications();
      
      setMessage({ type: 'success', text: 'Manual notification check completed successfully' });
      
      // Reload data
      if (activeTab === 3) {
        await loadExpiringProcedures();
      }
      if (activeTab === 4) {
        await loadEmailActivityLog();
      }
      
    } catch (error) {
      console.error('❌ Error running manual check:', error);
      setMessage({ type: 'error', text: 'Failed to run manual check: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'expired': return 'error';
      case 'urgent': return 'warning';
      case 'warning': return 'info';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'expired': return <ErrorIcon />;
      case 'urgent': return <Warning />;
      case 'warning': return <Schedule />;
      default: return <CheckCircle />;
    }
  };

  const getActivityIcon = (activityType) => {
    switch (activityType) {
      case 'ACCESS_GRANTED_NOTIFICATION':
      case 'ACCESS_REVOKED_NOTIFICATION':
      case 'ROLE_CHANGE_NOTIFICATION':
        return <People />;
      case 'PROCEDURE_UPLOAD_NOTIFICATION':
      case 'PROCEDURE_EXPIRY_NOTIFICATION':
        return <MailOutline />;
      case 'AUTOMATED_CHECK':
        return <Schedule />;
      default:
        return <Email />;
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = Math.floor((now - time) / 1000);
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const tabConfig = [
    {
      label: 'Configure Recipients',
      icon: <People />,
      component: <ConfigureRecipients />,
      description: 'Manage email recipients and lists'
    },
    {
      label: 'Notification Settings',
      icon: <Notifications />,
      component: <NotificationSettings />,
      description: 'Configure email templates and notifications'
    },
    {
      label: 'Custom Templates',
      icon: <Email />,
      component: <CustomTemplates />,
      description: 'Create and manage custom email templates'
    },
    {
      label: 'Expiring Procedures',
      icon: <Schedule />,
      component: null, // Custom component rendered below
      description: 'View procedures that will trigger email notifications'
    },
    {
      label: 'Email Activity Log',
      icon: <Timeline />,
      component: null, // Custom component rendered below
      description: 'View log of all email notifications sent by SharePoint'
    }
  ];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          📧 Email Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Configure email notifications, recipients, and templates for the HSBC Procedures Hub
        </Typography>
      </Box>

      {/* Status Message */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Alert 
            severity={message.type} 
            sx={{ mb: 3 }}
            onClose={() => setMessage(null)}
          >
            {message.text}
          </Alert>
        </motion.div>
      )}

      {/* Navigation Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          {tabConfig.map((tab, index) => (
            <Tab
              key={index}
              icon={tab.icon}
              label={tab.label}
              sx={{ 
                minHeight: 80,
                '& .MuiTab-iconWrapper': {
                  marginBottom: 1
                }
              }}
            />
          ))}
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <Box>
        {activeTab < 3 && tabConfig[activeTab].component}

        {/* Expiring Procedures Tab */}
        {activeTab === 3 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">
                📅 Procedures with Upcoming Email Notifications ({expiringProcedures.length})
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={loadExpiringProcedures}
                  disabled={loading}
                >
                  Refresh
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Send />}
                  onClick={handleManualCheck}
                  disabled={loading}
                >
                  Run Check Now
                </Button>
              </Box>
            </Box>

            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                This shows procedures that are expiring within 30 days and will automatically trigger email notifications. 
                The system checks daily and sends reminders at 30 days, 7 days, and when expired.
              </Typography>
            </Alert>

            {loading && <LinearProgress sx={{ mb: 2 }} />}

            {/* Summary Cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" color="error.main" fontWeight="bold">
                      {expiringProcedures.filter(p => p.status === 'expired').length}
                    </Typography>
                    <Typography variant="body2">Expired</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" color="warning.main" fontWeight="bold">
                      {expiringProcedures.filter(p => p.status === 'urgent').length}
                    </Typography>
                    <Typography variant="body2">Urgent (≤7 days)</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" color="info.main" fontWeight="bold">
                      {expiringProcedures.filter(p => p.status === 'warning').length}
                    </Typography>
                    <Typography variant="body2">Warning (≤30 days)</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" color="success.main" fontWeight="bold">
                      {expiringProcedures.filter(p => p.willSendNotification).length}
                    </Typography>
                    <Typography variant="body2">Will Send Email</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Expiring Procedures Table */}
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Procedure Name</strong></TableCell>
                    <TableCell><strong>Owner</strong></TableCell>
                    <TableCell><strong>LOB</strong></TableCell>
                    <TableCell><strong>Expiry Date</strong></TableCell>
                    <TableCell><strong>Days Left</strong></TableCell>
                    <TableCell><strong>Email Status</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {expiringProcedures.map((procedure) => (
                    <TableRow key={procedure.id} hover>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(procedure.status)}
                          label={procedure.status.toUpperCase()}
                          color={getStatusColor(procedure.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {procedure.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 24, height: 24, fontSize: '0.7rem' }}>
                            {procedure.owner?.[0]}
                          </Avatar>
                          <Typography variant="body2">
                            {procedure.owner}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={procedure.lob} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CalendarToday fontSize="small" color="action" />
                          <Typography variant="body2">
                            {new Date(procedure.expiry).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography 
                          variant="body2" 
                          fontWeight="bold"
                          color={procedure.daysLeft <= 0 ? 'error.main' : procedure.daysLeft <= 7 ? 'warning.main' : 'text.primary'}
                        >
                          {procedure.daysLeft <= 0 ? `${Math.abs(procedure.daysLeft)} overdue` : `${procedure.daysLeft} days`}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {procedure.willSendNotification ? (
                            <Chip 
                              icon={<Send />}
                              label="Will Send" 
                              color="success" 
                              size="small"
                            />
                          ) : (
                            <Chip 
                              icon={<CheckCircle />}
                              label="Already Sent" 
                              color="default" 
                              size="small"
                            />
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                  {expiringProcedures.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          No procedures expiring within 30 days
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Email Activity Log Tab */}
        {activeTab === 4 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">
                📧 Email Activity Log ({emailActivityLog.length} entries)
              </Typography>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={loadEmailActivityLog}
                disabled={loading}
              >
                Refresh Log
              </Button>
            </Box>

            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                This log shows all email notifications sent by SharePoint, including automated expiry notifications, 
                user access notifications, and procedure upload notifications.
              </Typography>
            </Alert>

            {loading && <LinearProgress sx={{ mb: 2 }} />}

            {/* Activity Summary */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="primary.main" fontWeight="bold">
                      {emailActivityLog.filter(log => log.activityType.includes('EXPIRY')).length}
                    </Typography>
                    <Typography variant="body2">Expiry Notifications</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="success.main" fontWeight="bold">
                      {emailActivityLog.filter(log => log.activityType.includes('ACCESS_GRANTED')).length}
                    </Typography>
                    <Typography variant="body2">Access Granted</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="warning.main" fontWeight="bold">
                      {emailActivityLog.filter(log => log.activityType.includes('UPLOAD')).length}
                    </Typography>
                    <Typography variant="body2">Upload Notifications</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="info.main" fontWeight="bold">
                      {emailActivityLog.filter(log => log.activityType.includes('AUTOMATED')).length}
                    </Typography>
                    <Typography variant="body2">Automated Checks</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Activity Log List */}
            <Paper>
              <List>
                {emailActivityLog.map((activity, index) => (
                  <React.Fragment key={activity.id}>
                    <ListItem sx={{ py: 2 }}>
                      <ListItemIcon>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {getActivityIcon(activity.activityType)}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography variant="body1" fontWeight="medium">
                              {activity.readableActivity}
                            </Typography>
                            <Chip 
                              label={activity.status} 
                              color={activity.status === 'SUCCESS' ? 'success' : 'error'}
                              size="small"
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Performed by: {activity.performedBy}
                            </Typography>
                            <Typography variant="caption" color="text.disabled">
                              {formatTimeAgo(activity.timestamp)} • {new Date(activity.timestamp).toLocaleString()}
                            </Typography>
                            {activity.details && Object.keys(activity.details).length > 0 && (
                              <Box sx={{ mt: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                                <Typography variant="caption" component="pre" sx={{ fontSize: '0.7rem' }}>
                                  {JSON.stringify(activity.details, null, 2)}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < emailActivityLog.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
                {emailActivityLog.length === 0 && (
                  <ListItem sx={{ textAlign: 'center', py: 4 }}>
                    <ListItemText>
                      <Email sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        No email activity logged
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Email activities will appear here once notifications start being sent
                      </Typography>
                    </ListItemText>
                  </ListItem>
                )}
              </List>
            </Paper>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default EmailManagement;
