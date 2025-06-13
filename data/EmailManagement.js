// components/EmailManagement.js - Complete Fixed Version
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
    if (activeTab === 2) { // Expiring Procedures tab
      loadExpiringProcedures();
    } else if (activeTab === 3) { // Email Activity Log tab
      loadEmailActivityLog();
    }
  }, [activeTab, emailService]);

  const loadExpiringProcedures = async () => {
    setLoading(true);
    setMessage(null);
    try {
      console.log('📋 Loading expiring procedures...');
      
      // ✅ FIXED: Direct SharePoint call with proper credentials
      const response = await fetch(
        'https://teams.global.hsbc/sites/EmployeeEng/_api/web/lists/getbytitle(\'Procedures\')/items?$select=Id,Title,ExpiryDate,LOB,PrimaryOwner,Status&$top=1000',
        {
          method: 'GET',
          headers: { 
            'Accept': 'application/json; odata=verbose',
            'Content-Type': 'application/json; odata=verbose'
          },
          credentials: 'same-origin' // ✅ CRITICAL FIX: Use same-origin instead of include
        }
      );

      if (response.ok) {
        const data = await response.json();
        const procedures = data.d.results;
        
        // Calculate expiring procedures
        const now = new Date();
        const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
        
        const expiring = procedures.filter(proc => {
          if (!proc.ExpiryDate) return false;
          const expiryDate = new Date(proc.ExpiryDate);
          return expiryDate <= thirtyDaysFromNow;
        }).map(proc => {
          const expiryDate = new Date(proc.ExpiryDate);
          const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
          
          return {
            id: proc.Id,
            name: proc.Title,
            expiryDate: proc.ExpiryDate,
            daysUntilExpiry: daysUntilExpiry,
            expirationStage: daysUntilExpiry <= 0 ? 'EXPIRED' : daysUntilExpiry <= 7 ? 'CRITICAL' : 'WARNING',
            lob: proc.LOB,
            primaryOwner: proc.PrimaryOwner,
            status: proc.Status
          };
        });

        setExpiringProcedures(expiring);
        console.log('✅ Expiring procedures loaded:', expiring.length);
      } else {
        throw new Error(`Failed to load procedures: ${response.status}`);
      }
      
    } catch (error) {
      console.error('❌ Error loading expiring procedures:', error);
      setMessage({ type: 'error', text: 'Failed to load expiring procedures: ' + error.message });
      
      // Fallback mock data
      setExpiringProcedures([
        {
          id: 1,
          name: 'Risk Assessment Framework',
          expiryDate: '2024-06-20',
          daysUntilExpiry: 7,
          expirationStage: 'WARNING',
          lob: 'IWPB',
          primaryOwner: 'John Smith'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadEmailActivityLog = async () => {
    setLoading(true);
    setMessage(null);
    try {
      console.log('📧 Loading email activity log from SharePoint...');
      
      // ✅ FIXED: Direct call to EmailActivityLog with proper credentials and column names
      const response = await fetch(
        'https://teams.global.hsbc/sites/EmployeeEng/_api/web/lists/getbytitle(\'EmailActivityLog\')/items?$select=*&$orderby=Created desc&$top=50',
        {
          method: 'GET',
          headers: { 
            'Accept': 'application/json; odata=verbose',
            'Content-Type': 'application/json; odata=verbose'
          },
          credentials: 'same-origin' // ✅ CRITICAL FIX: Use same-origin instead of include
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Raw email activity data:', data.d.results);
        
        const activities = data.d.results.map(item => ({
          id: item.Id,
          activityType: item.ActivityType || item.Title || 'EMAIL_NOTIFICATION',
          timestamp: item.ActivityTimestamp || item.Created,
          readableActivity: getReadableActivity(item.ActivityType || item.Title, item.ActivityDetails),
          details: safeJsonParse(item.ActivityDetails, {}),
          performedBy: item.PerformedBy || 'System',
          status: item.Status || 'completed',
          procedureName: item.ProcedureName || '',
          procedureId: item.ProcedureID || '',
          notificationType: item.NotificationType || ''
        }));

        setEmailActivityLog(activities);
        console.log('✅ Email activity log processed:', activities.length, 'entries');
      } else {
        console.warn(`⚠️ EmailActivityLog not accessible (${response.status}), using fallback data`);
        setEmailActivityLog(getFallbackEmailActivity());
      }
      
    } catch (error) {
      console.error('❌ Error loading email activity log:', error);
      setMessage({ type: 'warning', text: 'Could not load email activity log from SharePoint. Showing sample data.' });
      setEmailActivityLog(getFallbackEmailActivity());
    } finally {
      setLoading(false);
    }
  };

  // ✅ Enhanced readable activity generator
  const getReadableActivity = (activityType, detailsJson) => {
    try {
      const details = safeJsonParse(detailsJson, {});
      
      switch (activityType) {
        case 'NEW_PROCEDURE_NOTIFICATION':
          return `📤 New procedure uploaded: ${details.procedureName || 'Unknown'} (${details.lob || 'Unknown LOB'})`;
        case 'USER_ACCESS_GRANTED_NOTIFICATION':
          return `✅ User access granted: ${details.targetUserName || 'Unknown user'}`;
        case 'USER_ACCESS_REVOKED_NOTIFICATION':
          return `❌ User access revoked: ${details.targetUserName || 'Unknown user'}`;
        case 'USER_ROLE_UPDATED_NOTIFICATION':
          return `🔄 User role updated: ${details.targetUserName || 'Unknown user'}`;
        case 'PROCEDURE_EXPIRING_NOTIFICATION':
          return `⏰ Expiry warning: ${details.procedureName || 'Unknown'} (${details.daysLeft || 0} days left)`;
        case 'PROCEDURE_EXPIRED_NOTIFICATION':
          return `🚨 Procedure expired: ${details.procedureName || 'Unknown'} (${details.daysOverdue || 0} days overdue)`;
        case 'LOW_QUALITY_SCORE_NOTIFICATION':
          return `📊 Quality alert: ${details.procedureName || 'Unknown'} (Score: ${details.qualityScore || 0}%)`;
        case 'EMAIL_SYSTEM_TEST':
          return `🧪 Email system test completed`;
        case 'EMAIL_MONITORING_STARTED':
          return `🟢 Email monitoring started`;
        case 'EMAIL_MONITORING_STOPPED':
          return `🔴 Email monitoring stopped`;
        default:
          return `📧 Email notification: ${activityType?.replace(/_/g, ' ') || 'Unknown activity'}`;
      }
    } catch (error) {
      return `📧 Email activity: ${activityType || 'Unknown'}`;
    }
  };

  // Safe JSON parsing
  const safeJsonParse = (jsonString, defaultValue) => {
    try {
      return jsonString && typeof jsonString === 'string' ? JSON.parse(jsonString) : (jsonString || defaultValue);
    } catch (error) {
      console.warn('⚠️ JSON parse error:', error);
      return defaultValue;
    }
  };

  // Fallback email activity data
  const getFallbackEmailActivity = () => {
    return [
      {
        id: 1,
        activityType: 'NEW_PROCEDURE_NOTIFICATION',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        readableActivity: '📤 New procedure uploaded: Risk Assessment Framework (IWPB)',
        details: { procedureName: 'Risk Assessment Framework', lob: 'IWPB' },
        performedBy: 'System',
        status: 'completed'
      },
      {
        id: 2,
        activityType: 'USER_ACCESS_GRANTED_NOTIFICATION',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        readableActivity: '✅ User access granted: John Smith',
        details: { targetUserName: 'John Smith' },
        performedBy: 'Admin',
        status: 'completed'
      },
      {
        id: 3,
        activityType: 'PROCEDURE_EXPIRING_NOTIFICATION',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        readableActivity: '⏰ Expiry warning: Trading Guidelines (5 days left)',
        details: { procedureName: 'Trading Guidelines', daysLeft: 5 },
        performedBy: 'System',
        status: 'completed'
      }
    ];
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">
            ⏰ Expiring Procedures ({expiringProcedures.length})
          </Typography>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadExpiringProcedures}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>

        {loading ? (
          <LinearProgress sx={{ my: 2 }} />
        ) : message ? (
          <Alert severity={message.type} sx={{ my: 2 }}>{message.text}</Alert>
        ) : (
          <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.paper' }}>
            {expiringProcedures.length > 0 ? (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Procedure Name</strong></TableCell>
                      <TableCell><strong>ID</strong></TableCell>
                      <TableCell><strong>Owner</strong></TableCell>
                      <TableCell><strong>LOB</strong></TableCell>
                      <TableCell><strong>Expiry Date</strong></TableCell>
                      <TableCell><strong>Days Left</strong></TableCell>
                      <TableCell><strong>Status</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {expiringProcedures.map((procedure) => (
                      <TableRow key={procedure.id}>
                        <TableCell>{procedure.name}</TableCell>
                        <TableCell>{procedure.id}</TableCell>
                        <TableCell>{procedure.primaryOwner || 'Unknown'}</TableCell>
                        <TableCell>
                          <Chip label={procedure.lob || 'Unknown'} size="small" color="info" />
                        </TableCell>
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
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Schedule sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No procedures currently expiring
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  All procedures are within their valid date ranges
                </Typography>
              </Box>
            )}
          </Paper>
        )}
      </TabPanel>

      {/* ✅ FIXED: Email Activity Log Tab */}
      <TabPanel value={activeTab} index={3}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">
            📧 Email Activity Log ({emailActivityLog.length})
          </Typography>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadEmailActivityLog}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>

        {loading ? (
          <LinearProgress sx={{ my: 2 }} />
        ) : message ? (
          <Alert severity={message.type} sx={{ my: 2 }} onClose={() => setMessage(null)}>
            {message.text}
          </Alert>
        ) : (
          <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.paper' }}>
            <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
              {emailActivityLog.length > 0 ? emailActivityLog.map((activity, index) => (
                <React.Fragment key={activity.id || index}>
                  <ListItem alignItems="flex-start" sx={{ py: 2 }}>
                    <ListItemIcon>
                      <Avatar sx={{ 
                        bgcolor: getActivityColor(activity.activityType),
                        width: 32,
                        height: 32
                      }}>
                        {getActivityIcon(activity.activityType)}
                      </Avatar>
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
                            sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}
                            component="span"
                            variant="body2"
                            color="text.secondary"
                          >
                            <CalendarToday sx={{ fontSize: 14 }} />
                            {new Date(activity.timestamp).toLocaleString()}
                            <Chip 
                              label={activity.performedBy} 
                              size="small" 
                              sx={{ ml: 1, height: 20, fontSize: '0.6rem' }}
                            />
                            {activity.status && (
                              <Chip 
                                label={activity.status} 
                                size="small" 
                                color={activity.status === 'completed' ? 'success' : 'default'}
                                sx={{ height: 20, fontSize: '0.6rem' }}
                              />
                            )}
                          </Typography>
                          {activity.details && Object.keys(activity.details).length > 0 && (
                            <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {activity.details.procedureName && (
                                <Chip label={`📋 ${activity.details.procedureName}`} size="small" variant="outlined" />
                              )}
                              {activity.details.lob && (
                                <Chip label={`🏢 ${activity.details.lob}`} size="small" variant="outlined" />
                              )}
                              {activity.details.targetUserName && (
                                <Chip label={`👤 ${activity.details.targetUserName}`} size="small" variant="outlined" />
                              )}
                              {activity.details.daysLeft !== undefined && (
                                <Chip label={`⏰ ${activity.details.daysLeft} days`} size="small" color="warning" variant="outlined" />
                              )}
                              {activity.details.qualityScore !== undefined && (
                                <Chip label={`📊 ${activity.details.qualityScore}%`} size="small" color="info" variant="outlined" />
                              )}
                            </Box>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < emailActivityLog.length - 1 && <Divider />}
                </React.Fragment>
              )) : (
                <ListItem sx={{ textAlign: 'center', py: 8 }}>
                  <ListItemText>
                    <Email sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No email activity found
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

  // Helper functions for activity display
  function getActivityColor(activityType) {
    switch (activityType) {
      case 'NEW_PROCEDURE_NOTIFICATION': return '#2196f3';
      case 'USER_ACCESS_GRANTED_NOTIFICATION': return '#4caf50';
      case 'USER_ACCESS_REVOKED_NOTIFICATION': return '#f44336';
      case 'USER_ROLE_UPDATED_NOTIFICATION': return '#ff9800';
      case 'PROCEDURE_EXPIRING_NOTIFICATION': return '#ff9800';
      case 'PROCEDURE_EXPIRED_NOTIFICATION': return '#f44336';
      case 'LOW_QUALITY_SCORE_NOTIFICATION': return '#9c27b0';
      case 'EMAIL_SYSTEM_TEST': return '#607d8b';
      default: return '#757575';
    }
  }

  function getActivityIcon(activityType) {
    switch (activityType) {
      case 'NEW_PROCEDURE_NOTIFICATION': return '📤';
      case 'USER_ACCESS_GRANTED_NOTIFICATION': return '✅';
      case 'USER_ACCESS_REVOKED_NOTIFICATION': return '❌';
      case 'USER_ROLE_UPDATED_NOTIFICATION': return '🔄';
      case 'PROCEDURE_EXPIRING_NOTIFICATION': return '⏰';
      case 'PROCEDURE_EXPIRED_NOTIFICATION': return '🚨';
      case 'LOW_QUALITY_SCORE_NOTIFICATION': return '📊';
      case 'EMAIL_SYSTEM_TEST': return '🧪';
      default: return '📧';
    }
  }
};

export default EmailManagement;
