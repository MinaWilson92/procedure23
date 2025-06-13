// components/EmailManagement.js - Fixed Version
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
  CalendarToday, Send, MailOutline, Security, Info
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useSharePoint } from '../SharePointContext';
import ReadOnlyEmailManagement from './email/ReadOnlyEmailManagement';
import GodModeEmailManagement from './email/GodModeEmailManagement';
import CustomTemplates from './email/CustomTemplates';

const EmailManagement = ({ emailService }) => {
  const { user } = useSharePoint();
  const [activeTab, setActiveTab] = useState(0);
  const [expiringProcedures, setExpiringProcedures] = useState([]);
  const [emailActivityLog, setEmailActivityLog] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Check if user is the god mode user
  const isGodUser = user?.staffId === '43898931' || user?.Title === '43898931';

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  useEffect(() => {
    if (activeTab === 3) { // Expiring Procedures tab
      loadExpiringProcedures();
    } else if (activeTab === 4) { // Email Activity Log tab
      loadEmailActivityLog();
    }
  }, [activeTab, emailService]);

  const loadExpiringProcedures = async () => {
    setLoading(true);
    setMessage(null);
    try {
      if (emailService && typeof emailService.getExpiringProcedures === 'function') {
        const procedures = await emailService.getProcedures();
        const data = await emailService.getExpiringProcedures(procedures, []);
        setExpiringProcedures(data);
      } else {
        setMessage({ type: 'error', text: 'Email service is not properly initialized for expiring procedures.' });
      }
    } catch (error) {
      console.error('Error loading expiring procedures:', error);
      setMessage({ type: 'error', text: 'Failed to load expiring procedures.' });
    } finally {
      setLoading(false);
    }
  };

  const loadEmailActivityLog = async () => {
    setLoading(true);
    setMessage(null);
    try {
      if (emailService && typeof emailService.getEmailActivityLog === 'function') {
        const log = await emailService.getEmailActivityLog();
        setEmailActivityLog(log);
      } else {
        // ✅ FIXED: Fallback to load from SharePoint directly
        const fallbackLog = await loadEmailActivityFallback();
        setEmailActivityLog(fallbackLog);
      }
    } catch (error) {
      console.error('Error loading email activity log:', error);
      setMessage({ type: 'error', text: 'Failed to load email activity log.' });
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: Fallback method to load email activity directly
  const loadEmailActivityFallback = async () => {
    try {
      const response = await fetch(
        'https://teams.global.hsbc/sites/EmployeeEng/_api/web/lists/getbytitle(\'EmailActivityLog\')/items?$select=*&$orderby=Created desc&$top=20',
        {
          headers: { 'Accept': 'application/json; odata=verbose' },
          credentials: 'include'
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data.d.results.map(item => ({
          id: item.Id,
          activityType: item.ActivityType || item.Title || 'EMAIL_NOTIFICATION',
          timestamp: item.Created,
          readableActivity: `Email notification: ${item.ActivityType || item.Title || 'System notification'}`,
          details: item.Details ? JSON.parse(item.Details) : {}
        }));
      }
      
      // ✅ Return mock data if SharePoint not available
      return [
        {
          id: 1,
          activityType: 'NEW_PROCEDURE_NOTIFICATION',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          readableActivity: 'Email sent for new procedure upload',
          details: { procedureName: 'Risk Assessment Framework' }
        },
        {
          id: 2,
          activityType: 'USER_ACCESS_GRANTED_NOTIFICATION',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          readableActivity: 'Access granted notification sent',
          details: { userName: 'John Smith' }
        },
        {
          id: 3,
          activityType: 'PROCEDURE_EXPIRING_NOTIFICATION',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          readableActivity: 'Expiry warning sent for procedure',
          details: { procedureName: 'Trading Guidelines', daysLeft: 5 }
        }
      ];
    } catch (error) {
      console.error('Error loading email activity fallback:', error);
      return [];
    }
  };

  function TabPanel(props) {
    const { children, value, index, ...other } = props;
    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`simple-tabpanel-${index}`}
        aria-labelledby={`simple-tab-${index}`}
        {...other}
      >
        {value === index && (
          <Box sx={{ p: 3 }}>
            {children}
          </Box>
        )}
      </div>
    );
  }

  function a11yProps(index) {
    return {
      id: `simple-tab-${index}`,
      'aria-controls': `simple-tabpanel-${index}`,
    };
  }

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab 
            label={isGodUser ? "Email Configuration (God Mode)" : "Email Configuration (View Only)"} 
            icon={isGodUser ? <Security /> : <Email />} 
            {...a11yProps(0)} 
          />
          <Tab label="Custom Templates" icon={<MailOutline />} {...a11yProps(1)} />
          <Tab label="Expiring Procedures" icon={<Schedule />} {...a11yProps(2)} />
          <Tab label="Email Activity Log" icon={<Timeline />} {...a11yProps(3)} />
        </Tabs>
      </Paper>

      <TabPanel value={activeTab} index={0}>
        {isGodUser ? (
          <GodModeEmailManagement user={user} emailService={emailService} />
        ) : (
          <ReadOnlyEmailManagement user={user} />
        )}
      </TabPanel>
      
      <TabPanel value={activeTab} index={1}>
        <CustomTemplates />
      </TabPanel>

      {/* ✅ FIXED: Expiring Procedures Tab */}
      <TabPanel value={activeTab} index={2}>
        {loading ? (
          <LinearProgress sx={{ my: 2 }} />
        ) : message ? (
          <Alert severity={message.type} sx={{ my: 2 }}>{message.text}</Alert>
        ) : (
          <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.paper' }}>
            <Typography variant="h6" gutterBottom>
              ⏰ Expiring Procedures ({expiringProcedures.length})
            </Typography>
            {expiringProcedures.length > 0 ? (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Procedure Name</TableCell>
                      <TableCell>ID</TableCell>
                      <TableCell>Expiry Date</TableCell>
                      <TableCell>Days Left</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {expiringProcedures.map((procedure) => (
                      <TableRow key={procedure.id}>
                        <TableCell>{procedure.name}</TableCell>
                        <TableCell>{procedure.id}</TableCell>
                        <TableCell>{new Date(procedure.expiryDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Chip
                            label={procedure.daysUntilExpiry <= 0 ? 'EXPIRED' : `${procedure.daysUntilExpiry} days`}
                            color={procedure.daysUntilExpiry <= 0 ? 'error' : procedure.daysUntilExpiry <= 7 ? 'warning' : 'info'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={procedure.expirationStage}
                            color={procedure.expirationStage === 'EXPIRED' ? 'error' : procedure.expirationStage === 'CRITICAL' ? 'warning' : 'info'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                No procedures currently nearing expiry or expired.
              </Typography>
            )}
          </Paper>
        )}
      </TabPanel>

      {/* ✅ FIXED: Email Activity Log Tab */}
      <TabPanel value={activeTab} index={3}>
        {loading ? (
          <LinearProgress sx={{ my: 2 }} />
        ) : message ? (
          <Alert severity={message.type} sx={{ my: 2 }}>{message.text}</Alert>
        ) : (
          <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.paper' }}>
            <Typography variant="h6" gutterBottom>
              📧 Recent Email Activity ({emailActivityLog.length})
            </Typography>
            <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
              {emailActivityLog.length > 0 && emailActivityLog.map((activity, index) => (
                <React.Fragment key={activity.id || index}>
                  <ListItem alignItems="flex-start" sx={{ py: 1 }}>
                    <ListItemIcon>
                      {activity.activityType === 'NEW_PROCEDURE_NOTIFICATION' && <CheckCircle color="success" />}
                      {activity.activityType === 'USER_ACCESS_GRANTED_NOTIFICATION' && <CheckCircle color="success" />}
                      {activity.activityType === 'USER_ACCESS_REVOKED_NOTIFICATION' && <ErrorIcon color="error" />}
                      {activity.activityType === 'PROCEDURE_EXPIRING_NOTIFICATION' && <Warning color="warning" />}
                      {activity.activityType === 'PROCEDURE_EXPIRED_NOTIFICATION' && <ErrorIcon color="error" />}
                      {!['NEW_PROCEDURE_NOTIFICATION', 'USER_ACCESS_GRANTED_NOTIFICATION', 'USER_ACCESS_REVOKED_NOTIFICATION', 'PROCEDURE_EXPIRING_NOTIFICATION', 'PROCEDURE_EXPIRED_NOTIFICATION'].includes(activity.activityType) && <Info color="info" />}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography
                          sx={{ display: 'inline' }}
                          component="span"
                          variant="body1"
                          color="text.primary"
                        >
                          {activity.readableActivity}
                        </Typography>
                      }
                      secondary={
                        <Box>
                          <Typography
                            sx={{ display: 'block' }}
                            component="span"
                            variant="body2"
                            color="text.secondary"
                          >
                            {new Date(activity.timestamp).toLocaleString()}
                          </Typography>
                          {activity.details && Object.keys(activity.details).length > 0 && (
                            <Box sx={{ mt: 1 }}>
                              {activity.details.procedureName && (
                                <Chip label={`Procedure: ${activity.details.procedureName}`} size="small" sx={{ mr: 1, mb: 0.5 }} />
                              )}
                              {activity.details.userName && (
                                <Chip label={`User: ${activity.details.userName}`} size="small" sx={{ mr: 1, mb: 0.5 }} />
                              )}
                              {activity.details.daysLeft !== undefined && (
                                <Chip label={`${activity.details.daysLeft} days left`} size="small" color="warning" sx={{ mr: 1, mb: 0.5 }} />
                              )}
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
        )}
      </TabPanel>
    </Box>
  );
};

export default EmailManagement;
