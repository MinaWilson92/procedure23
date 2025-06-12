// pages/AdminDashboard.js - Final Combined & Corrected Version
import React, { useState, useEffect } from 'react';
import {
  Box, Container, Typography, Grid, Paper, Card, CardContent,
  Button, Chip, IconButton, useTheme, alpha, List, ListItem,
  ListItemIcon, ListItemText, Divider, Alert, Skeleton,
  LinearProgress, Badge, Tabs, Tab, FormControl, InputLabel,
  Select, MenuItem, TextField, Switch, FormControlLabel,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TablePagination, Avatar, CircularProgress,
  Snackbar, Autocomplete
} from '@mui/material';
import {
  Dashboard, TrendingUp, Warning, CheckCircle, FolderOpen,
  CalendarToday, Assessment, Person, Upload, Notifications,
  History, Star, CloudSync, Assignment, Business, Email,
  Schedule, TrendingDown, Error as ErrorIcon, OpenInNew,
  Settings, BarChart, PieChart, Timeline, AdminPanelSettings,
  Security, Refresh, Add, Edit, Delete, Visibility, Send,
  Group, People, Save, Cancel, Search, Clear, PersonAdd,
  BugReport
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useSharePoint } from '../SharePointContext';
import { useNavigation } from '../contexts/NavigationContext';
import EmailManagement from '../components/EmailManagement';
import EmailNotificationService from '../services/EmailNotificationService';

const AdminDashboard = ({ procedures, onDataRefresh, sharePointAvailable }) => {
  const { user, getUserInfo, siteUrl, authStatus, refreshUser } = useSharePoint();
  const { navigateTo } = useNavigation();
  const theme = useTheme();

  // State for Admin Dashboard
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allProcedures, setAllProcedures] = useState([]);
  const [recentUploads, setRecentUploads] = useState([]);
  const [expiringSoon, setExpiringSoon] = useState([]);
  const [overdue, setOverdue] = useState([]);
  const [notificationLog, setNotificationLog] = useState([]);
  const [users, setUsers] = useState([]); // Placeholder for user management
  const [procedureStats, setProcedureStats] = useState({
    total: 0, active: 0, pendingReview: 0, expired: 0
  });
  const [newProcedure, setNewProcedure] = useState({
    Title: '', Description: '', Category: '', Tags: '',
    PrimaryOwner: '', SecondaryOwner: '', ExpiryDate: null, Status: 'Draft'
  });
  const [editProcedure, setEditProcedure] = useState(null);
  const [notification, setNotification] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, procedure: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userRoles, setUserRoles] = useState([]); // Example: 'Staff', 'Admin', 'Reviewer'
  const [selectedRole, setSelectedRole] = useState('');
  const [isEmailMonitoringRunning, setIsEmailMonitoringRunning] = useState(false);
  const [isPnPSetup, setIsPnPSetup] = useState(false);

  // Email Notification Service Instance - This is passed to EmailManagement
  const [emailService] = useState(() => new EmailNotificationService());

  // Configure the PnPjs library with the correct site URL once, when the component loads.
  useEffect(() => {
    if (window.pnp && siteUrl && !isPnPSetup) {
      console.log(`Configuring PnPjs baseUrl to: ${siteUrl}`);
      window.pnp.setup({
        sp: {
          baseUrl: siteUrl
        }
      });
      setIsPnPSetup(true); // Mark setup as complete to prevent re-running
    }
  }, [siteUrl, isPnPSetup]);

  // Load data only after PnPjs has been configured.
  useEffect(() => {
    if (isPnPSetup) {
      loadDashboardData();
      loadNotificationLog();
    }
  }, [isPnPSetup, onDataRefresh]);


  // Load Initial Data for Dashboard
  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Use the simple 'select *' query that matches the user's list columns.
      const sp = window.pnp.sp.web.lists.getByTitle('Procedures');
      const items = await sp.items.select('*').get();
      
      console.log("Procedures loaded successfully. Sample item:", items[0]);

      setAllProcedures(items);
      processProcedures(items);

      const dummyUsers = [
        { id: 1, name: 'Alice Smith', email: 'alice.smith@example.com', role: 'Staff' },
        { id: 2, name: 'Bob Johnson', email: 'bob.johnson@example.com', role: 'Admin' },
        { id: 3, name: 'Charlie Brown', email: 'charlie.brown@example.com', role: 'Reviewer' },
      ];
      setUsers(dummyUsers);
      setUserRoles(['Staff', 'Admin', 'Reviewer', 'Management']);

    } catch (err) {
      console.error("Error loading dashboard data:", err);
      setError("Failed to load dashboard data. Please refresh.");
      setNotification({ type: 'error', message: 'Failed to load dashboard data.' });
    } finally {
      setLoading(false);
    }
  };

  const loadNotificationLog = async () => {
    try {
      if (emailService && typeof emailService.getNotificationLog === 'function') {
        // This function in your service should fetch all necessary columns,
        // including NotificationType, ProcedureName, and Status.
        const log = await emailService.getNotificationLog();
        console.log("Notification log loaded:", log);
        setNotificationLog(log);
      }
    } catch (error) {
      console.error("Error loading notification log:", error);
      setNotification({ type: 'error', message: 'Failed to load notification log.' });
    }
  };

  const processProcedures = (proceduresData) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const recent = [];
    const expiring = [];
    const overdueList = [];
    let activeCount = 0;
    let pendingCount = 0;
    let expiredCount = 0;

    proceduresData.forEach(p => {
      const created = new Date(p.Created);
      const expiry = p.ExpiryDate ? new Date(p.ExpiryDate) : null;

      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 7);
      if (created >= sevenDaysAgo) {
        recent.push(p);
      }

      if (expiry && expiry > today) {
        const diffTime = Math.abs(expiry.getTime() - today.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays <= 30) {
          expiring.push(p);
        }
      }
      if (expiry && expiry <= today) {
        overdueList.push(p);
        expiredCount++;
      }
      if (p.Status === 'Active') {
        activeCount++;
      } else if (p.Status === 'Draft' || p.Status === 'Pending Review') {
        pendingCount++;
      }
    });

    setRecentUploads(recent.sort((a, b) => new Date(b.Created) - new Date(a.Created)).slice(0, 5));
    setExpiringSoon(expiring.sort((a, b) => new Date(a.ExpiryDate) - new Date(b.ExpiryDate)).slice(0, 5));
    setOverdue(overdueList.sort((a, b) => new Date(b.ExpiryDate) - new Date(a.ExpiryDate)).slice(0, 5));

    setProcedureStats({
      total: proceduresData.length,
      active: activeCount,
      pendingReview: pendingCount,
      expired: expiredCount
    });
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const logAction = async (notificationType, procedureName, status = 'Success') => {
      // Your EmailNotificationService should contain the logic to write to the SharePoint list.
      // Example call:
      // await emailService.logAction({
      //   NotificationType: notificationType,
      //   ProcedureName: procedureName,
      //   Status: status,
      //   User: user.displayName
      // });
      console.log(`AUDIT LOG: ${notificationType} - ${procedureName} - ${status}`);
      loadNotificationLog(); // Refresh the log after an action
  };

  const handleAddProcedure = async () => {
    setLoading(true);
    try {
      const sp = window.pnp.sp.web.lists.getByTitle('Procedures');
      await sp.items.add({
        Title: newProcedure.Title,
        Description: newProcedure.Description,
        Category: newProcedure.Category,
        Tags: newProcedure.Tags,
        PrimaryOwner: newProcedure.PrimaryOwner,
        SecondaryOwner: newProcedure.SecondaryOwner,
        ExpiryDate: newProcedure.ExpiryDate ? new Date(newProcedure.ExpiryDate).toISOString() : null,
        Status: newProcedure.Status
      });
      await logAction('Procedure Added', newProcedure.Title);
      setNotification({ type: 'success', message: `Procedure "${newProcedure.Title}" added successfully!` });
      setNewProcedure({ Title: '', Description: '', Category: '', Tags: '', PrimaryOwner: '', SecondaryOwner: '', ExpiryDate: null, Status: 'Draft' });
      onDataRefresh();
    } catch (error) {
      await logAction('Procedure Add Failed', newProcedure.Title, 'Failed');
      console.error('Error adding procedure:', error);
      setNotification({ type: 'error', message: 'Failed to add procedure.' });
    } finally {
      setLoading(false);
    }
  };

  const handleEditProcedure = async (procedure) => {
    setLoading(true);
    try {
      const sp = window.pnp.sp.web.lists.getByTitle('Procedures');
      await sp.items.getById(procedure.ID).update({
        Title: procedure.Title,
        Description: procedure.Description,
        Category: procedure.Category,
        Tags: procedure.Tags,
        PrimaryOwner: procedure.PrimaryOwner,
        SecondaryOwner: procedure.SecondaryOwner,
        ExpiryDate: procedure.ExpiryDate ? new Date(procedure.ExpiryDate).toISOString() : null,
        Status: procedure.Status
      });
      await logAction('Procedure Edited', procedure.Title);
      setNotification({ type: 'success', message: `Procedure "${procedure.Title}" updated successfully!` });
      setEditProcedure(null);
      onDataRefresh();
    } catch (error) {
      await logAction('Procedure Edit Failed', procedure.Title, 'Failed');
      console.error('Error updating procedure:', error);
      setNotification({ type: 'error', message: 'Failed to update procedure.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProcedure = async (procedure) => {
    setLoading(true);
    setDeleteDialog({ open: false, procedure: null });
    try {
      const sp = window.pnp.sp.web.lists.getByTitle('Procedures');
      await sp.items.getById(procedure.id).delete();
      await logAction('Procedure Deleted', procedure.name);
      setNotification({ type: 'success', message: `Procedure "${procedure.name}" deleted successfully!` });
      onDataRefresh();
    } catch (error) {
      await logAction('Procedure Delete Failed', procedure.name, 'Failed');
      console.error('Error deleting procedure:', error);
      setNotification({ type: 'error', message: 'Failed to delete procedure.' });
    } finally {
      setLoading(false);
    }
  };
  
  // ... other handler functions ...

  const filteredProcedures = allProcedures.filter(p => {
    const title = p.Title || '';
    const category = p.Category || '';
    const status = p.Status || '';
    const term = searchTerm.toLowerCase();

    return title.toLowerCase().includes(term) ||
           category.toLowerCase().includes(term) ||
           status.toLowerCase().includes(term);
  });

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
        {value === index && (<Box sx={{ p: 3 }}>{children}</Box>)}
      </div>
    );
  }

  function a11yProps(index) {
    return {
      id: `simple-tab-${index}`,
      'aria-controls': `simple-tabpanel-${index}`,
    };
  }

  if (loading && allProcedures.length === 0) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <LinearProgress sx={{ mb: 2 }} />
        <Typography variant="h6" color="text.secondary" align="center">Loading Admin Dashboard...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Alert severity="error">
          <Typography variant="h6">Error Loading Dashboard</Typography>
          <Typography>{error}</Typography>
          <Button onClick={loadDashboardData} startIcon={<Refresh />} sx={{ mt: 1 }}>
            Retry
          </Button>
        </Alert>
      </Container>
    );
  }

  if (!authStatus.authenticated || user?.role !== 'admin') {
    return (
      <Container maxWidth="md" sx={{ mt: 5, textAlign: 'center' }}>
        <Alert severity="warning">
          <Typography variant="h6" gutterBottom>Access Denied</Typography>
          <Typography>You must be logged in as an administrator to access this page.</Typography>
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
          <AdminPanelSettings sx={{ mr: 1 }} /> Admin Dashboard
        </Typography>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="admin dashboard tabs"
            variant="scrollable" scrollButtons="auto"
          >
            <Tab label="Overview" icon={<Dashboard />} {...a11yProps(0)} />
            <Tab label="Manage Procedures" icon={<Assignment />} {...a11yProps(1)} />
            <Tab label="Add Procedure" icon={<Add />} {...a11yProps(2)} />
            <Tab label="Manage Users" icon={<People />} {...a11yProps(3)} />
            <Tab label="Email Integration" icon={<Email />} {...a11yProps(4)} />
            <Tab label="Settings" icon={<Settings />} {...a11yProps(5)} />
          </Tabs>
        </Box>

        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            {/* Stats Cards ... */}
            
            {/* Recent Uploads */}
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.paper' }}>
                <Typography variant="h6" gutterBottom display="flex" alignItems="center">
                  <Upload sx={{ mr: 1 }} /> Recent Uploads
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {recentUploads.length > 0 ? (
                  <List>
                    {recentUploads.map(p => (
                      <ListItem key={p.ID}
                        secondaryAction={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip label={new Date(p.Created).toLocaleDateString()} size="small" />
                            <IconButton size="small" onClick={() => navigateTo(`/procedures/${p.ID}`)}>
                              <OpenInNew />
                            </IconButton>
                          </Box>
                        }
                      >
                        <ListItemText
                          primary={p.Title}
                          secondary={`LOB: ${p.LOB || 'N/A'}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">No recent uploads.</Typography>
                )}
              </Paper>
            </Grid>

            {/* Other cards: Expiring Soon, Overdue Procedures ... */}

            {/* Recent Notifications */}
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.paper' }}>
                <Typography variant="h6" gutterBottom display="flex" alignItems="center">
                  <Notifications sx={{ mr: 1 }} /> Recent Notifications
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {notificationLog.length > 0 ? (
                  <List>
                    {notificationLog.map((log, index) => (
                      <ListItem key={log.ID || index} 
                        secondaryAction={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {/* FIX: Display notification status */}
                            <Chip 
                              label={log.Status || 'Unknown'} 
                              size="small"
                              color={log.Status === 'Success' ? 'success' : log.Status === 'Failed' ? 'error' : 'default'}
                            />
                            <Chip label={new Date(log.Created).toLocaleDateString()} size="small" />
                          </Box>
                        }
                      >
                        <ListItemIcon>
                            {log.NotificationType === 'Expiry Warning' && <Warning color="warning" />}
                            {log.NotificationType === 'Procedure Edited' && <Edit color="info" />}
                            {log.NotificationType === 'Procedure Added' && <Add color="success" />}
                            {log.NotificationType === 'Procedure Deleted' && <Delete color="error" />}
                        </ListItemIcon>
                        <ListItemText
                          // FIX: Changed to display NotificationType and ProcedureName
                          primary={log.NotificationType || 'Notification'}
                          secondary={log.ProcedureName ? `Procedure: ${log.ProcedureName}` : 'Details not available'}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">No recent notifications.</Typography>
                )}
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Other Tab Panels ... */}
        
      </motion.div>
    </Container>
  );
};

export default AdminDashboard;
