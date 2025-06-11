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
// REMOVED: import EmailNotificationService from '../services/EmailNotificationService'; // No longer needed directly here

// ✅ CHANGE: Accept emailService as a prop
const EmailManagement = ({ emailService }) => {
  const [activeTab, setActiveTab] = useState(0);
  // ✅ REMOVED: const [emailService] = useState(() => new EmailNotificationService()); // This line is removed!
  const [expiringProcedures, setExpiringProcedures] = useState([]);
  const [emailActivityLog, setEmailActivityLog] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  useEffect(() => {
    // Only attempt to load data if emailService is provided and valid
    if (!emailService || typeof emailService.getProcedures !== 'function') {
        console.warn("EmailManagement: emailService prop is not available or not a valid service instance.");
        // Optionally, set an error message or disable functionality
        return;
    }

    if (activeTab === 3) { // Expiring Procedures tab
      loadExpiringProcedures();
    } else if (activeTab === 4) { // Email Activity Log tab
      loadEmailActivityLog();
    }
  }, [activeTab, emailService]); // ✅ ADDED: emailService as a dependency for the effect

  const loadExpiringProcedures = async () => {
    setLoading(true);
    setMessage(null);
    try {
      // ✅ Use the emailService prop directly
      if (emailService && typeof emailService.getExpiringProcedures === 'function') {
        const data = await emailService.getExpiringProcedures(
          await emailService.getProcedures(),
          await emailService.getNotificationLog()
        );
        setExpiringProcedures(data);
      } else {
        console.error("Email service methods are not available or not functions.");
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
      // ✅ Use the emailService prop directly
      if (emailService && typeof emailService.getEmailActivityLog === 'function') {
        const log = await emailService.getEmailActivityLog();
        setEmailActivityLog(log);
      } else {
        console.error("Email service getEmailActivityLog method is not available or not a function.");
        setMessage({ type: 'error', text: 'Email service is not properly initialized for activity log.' });
      }
    } catch (error) {
      console.error('Error loading email activity log:', error);
      setMessage({ type: 'error', text: 'Failed to load email activity log.' });
    } finally {
      setLoading(false);
    }
  };

  // ... rest of your component's logic and JSX ...

  return (
    <Box sx={{ p: 3 }}>
      {/* ... other tabs ... */}
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        aria-label="email management tabs"
        variant="scrollable"
        scrollButtons="auto"
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
      >
        <Tab label="Configure Recipients" icon={<People />} {...a11yProps(0)} />
        <Tab label="Notification Settings" icon={<Notifications />} {...a11yProps(1)} />
        <Tab label="Custom Templates" icon={<MailOutline />} {...a11yProps(2)} />
        <Tab label="Expiring Procedures" icon={<Schedule />} {...a11yProps(3)} />
        <Tab label="Email Activity Log" icon={<Timeline />} {...a11yProps(4)} />
      </Tabs>

      {/* Render tab content based on activeTab */}
      <TabPanel value={activeTab} index={0}>
        {/* ✅ Pass emailService to sub-components that need it */}
        <ConfigureRecipients emailService={emailService} />
      </TabPanel>
      <TabPanel value={activeTab} index={1}>
        {/* ✅ Pass emailService to sub-components that need it */}
        <NotificationSettings emailService={emailService} />
      </TabPanel>
      <TabPanel value={activeTab} index={2}>
        <CustomTemplates />
      </TabPanel>

      {/* Expiring Procedures Tab Content */}
      <TabPanel value={activeTab} index={3}>
        {/* ... (your existing expiring procedures display logic) */}
        {loading ? (
          <LinearProgress sx={{ my: 2 }} />
        ) : message ? (
          <Alert severity={message.type} sx={{ my: 2 }}>{message.text}</Alert>
        ) : (
          <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.paper' }}>
            <Typography variant="h6" gutterBottom>
              Expiring Procedures ({expiringProcedures.length})
            </Typography>
            {expiringProcedures.length > 0 ? (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Procedure Name</TableCell>
                      <TableCell>ID</TableCell>
                      <TableCell>Expiry Date</TableCell>
                      <TableCell>Notification Stage</TableCell>
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
                            label={procedure.expirationStage}
                            color={procedure.expirationStage === 'WARNING' ? 'warning' : 'error'}
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

      {/* Email Activity Log Tab Content */}
      <TabPanel value={activeTab} index={4}>
        {/* ... (your existing email activity log display logic) */}
        {loading ? (
          <LinearProgress sx={{ my: 2 }} />
        ) : message ? (
          <Alert severity={message.type} sx={{ my: 2 }}>{message.text}</Alert>
        ) : (
          <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.paper' }}>
            <Typography variant="h6" gutterBottom>
              Email Activity Log ({emailActivityLog.length})
            </Typography>
            <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
              {emailActivityLog.length > 0 && emailActivityLog.map((activity, index) => (
                <React.Fragment key={activity.ID || index}>
                  <ListItem alignItems="flex-start" sx={{ py: 1 }}>
                    <ListItemIcon>
                      {activity.ActivityType === 'ACCESS_GRANTED_NOTIFICATION' && <CheckCircle color="success" />}
                      {activity.ActivityType === 'ACCESS_REVOKED_NOTIFICATION' && <ErrorIcon color="error" />}
                      {activity.ActivityType === 'WARNING' && <Warning color="warning" />}
                      {activity.ActivityType === 'CRITICAL' && <ErrorIcon color="error" />}
                      {activity.ActivityType.includes('NOTIFICATION') && <Notifications color="info" />}
                      {!activity.ActivityType.includes('NOTIFICATION') && !['WARNING', 'CRITICAL'].includes(activity.ActivityType) && <Email color="primary" />}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography
                          sx={{ display: 'inline' }}
                          component="span"
                          variant="body1"
                          color="text.primary"
                        >
                          {activity.ActivityType} - {activity.PerformedBy}
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
        )}
      </TabPanel>
    </Box>
  );
};

export default EmailManagement;


// Helper for TabPanel
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
