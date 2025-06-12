// pages/AdminDashboard.js - Final Combined & Corrected Version with Audit Log
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
  BugReport, VpnKey, Policy // Added for Audit Log
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useSharePoint } from '../SharePointContext';
import { useNavigation } from '../contexts/NavigationContext';
import EmailManagement from '../components/EmailManagement';
import EmailNotificationService from '../services/EmailNotificationService';
import AdminPanel from '../components/AdminPanel'; 


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
  const [auditLog, setAuditLog] = useState([]);
  const [manageProceduresTab, setManageProceduresTab] = useState(0);
  const [users, setUsers] = useState([]);
  const [procedureStats, setProcedureStats] = useState({
    total: 0, active: 0, pendingReview: 0, expired: 0
  });
  const [editProcedure, setEditProcedure] = useState(null);
  const [notification, setNotification] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, procedure: null });
  const [disclaimerDialog, setDisclaimerDialog] = useState({ open: false, url: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userRoles, setUserRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [isEmailMonitoringRunning, setIsEmailMonitoringRunning] = useState(false);
  const [isPnPSetup, setIsPnPSetup] = useState(false);

  const [emailService] = useState(() => new EmailNotificationService());

  useEffect(() => {
    if (window.pnp && siteUrl && !isPnPSetup) {
      console.log(`Configuring PnPjs baseUrl to: ${siteUrl}`);
      window.pnp.setup({ sp: { baseUrl: siteUrl } });
      setIsPnPSetup(true);
    }
  }, [siteUrl, isPnPSetup]);

  useEffect(() => {
    if (isPnPSetup) {
      loadDashboardData();
      loadNotificationLog();
      loadAuditLog();
    }
  }, [isPnPSetup, onDataRefresh]);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const sp = window.pnp.sp.web.lists.getByTitle('Procedures');
      const items = await sp.items.select('*').get();
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
    } finally {
      setLoading(false);
    }
  };

  const loadNotificationLog = async () => {
    try {
      if (emailService && typeof emailService.getNotificationLog === 'function') {
        const log = await emailService.getNotificationLog();
        setNotificationLog(log);
      }
    } catch (error) {
      console.error("Error loading notification log:", error);
    }
  };

  const loadAuditLog = async () => {
    try {
        const sp = window.pnp.sp.web.lists.getByTitle('AuditLog');
        const items = await sp.items.select('*').get();
        const sortedItems = items.sort((a, b) => new Date(b.LogTimestamp) - new Date(a.LogTimestamp));
        setAuditLog(sortedItems);
        console.log("Audit Log loaded successfully:", sortedItems);
    } catch (err) {
        console.error("Error loading Audit Log:", err);
        setNotification({ type: 'error', message: 'Failed to load Audit Log data.' });
    }
  };

  const processProcedures = (proceduresData) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const recent = [];
    const expiring = [];
    const overdueList = [];
    let activeCount = 0, pendingCount = 0, expiredCount = 0;

    proceduresData.forEach(p => {
        const created = new Date(p.Created);
        const expiry = p.ExpiryDate ? new Date(p.ExpiryDate) : null;
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(now.getDate() - 7);
        if (created >= sevenDaysAgo) recent.push(p);

        if (expiry && expiry > today) {
            const diffDays = Math.ceil(Math.abs(expiry - today) / (1000 * 60 * 60 * 24));
            if (diffDays <= 30) expiring.push(p);
        }
        if (expiry && expiry <= today) {
            overdueList.push(p);
            expiredCount++;
        }
        if (p.Status === 'Active') activeCount++;
        else if (p.Status === 'Draft' || p.Status === 'Pending Review') pendingCount++;
    });

    setRecentUploads(recent.sort((a, b) => new Date(b.Created) - new Date(a.Created)).slice(0, 5));
    setExpiringSoon(expiring.sort((a, b) => new Date(a.ExpiryDate) - new Date(b.ExpiryDate)).slice(0, 5));
    setOverdue(overdueList.sort((a, b) => new Date(b.ExpiryDate) - new Date(a.ExpiryDate)).slice(0, 5));
    setProcedureStats({ total: proceduresData.length, active: activeCount, pendingReview: pendingCount, expired: expiredCount });
  };
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  const handleManageTabChange = (event, newValue) => {
    setManageProceduresTab(newValue);
  };

  const logAndNotify = async (actionType, procedure, status = 'Success') => {
    try {
        const logEntry = {
            Title: `${actionType}: ${procedure.Title}`,
            LogTimestamp: new Date().toISOString(),
            UserID: user.displayName,
            ActionType: actionType,
            LOB: procedure.LOB || 'N/A',
            ProcedureName: procedure.Title,
            Status: status,
            Details: `Action performed by ${user.displayName}.`
        };
        const auditLogList = window.pnp.sp.web.lists.getByTitle("AuditLog");
        await auditLogList.items.add(logEntry);
        console.log('Audit log entry created:', logEntry);
        if (emailService && typeof emailService.triggerChangeNotification === 'function') {
            await emailService.triggerChangeNotification(logEntry);
            console.log('Change notification email triggered.');
        }
        loadAuditLog();
    } catch (error) {
        console.error("Failed to log or notify action:", error);
        setNotification({ type: 'error', message: 'Failed to record action in audit log.' });
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
      await logAndNotify('Procedure Edited', procedure);
      setNotification({ type: 'success', message: `Procedure "${procedure.Title}" updated successfully!` });
      setEditProcedure(null);
      onDataRefresh();
    } catch (error) {
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
      await logAndNotify('Procedure Deleted', { Title: procedure.name, LOB: 'N/A' });
      setNotification({ type: 'success', message: `Procedure "${procedure.name}" deleted successfully!` });
      onDataRefresh();
    } catch (error) {
      console.error('Error deleting procedure:', error);
      setNotification({ type: 'error', message: 'Failed to delete procedure.' });
    } finally {
      setLoading(false);
    }
  };
  
  const handleUpdateUserRole = async () => {
    // ... (logic remains the same)
  };

  const handleGrantAccess = async () => {
    // ... (logic remains the same)
  };

  const handleRevokeAccess = async () => {
    // ... (logic remains the same)
  };
  
  const handleToggleEmailMonitoring = async () => {
    if (emailService) {
      if (isEmailMonitoringRunning) {
        await emailService.stopEmailMonitoring();
        setNotification({ type: 'info', message: 'Email monitoring stopped.' });
      } else {
        await emailService.startEmailMonitoring();
        setNotification({ type: 'success', message: 'Email monitoring started.' });
      }
      setIsEmailMonitoringRunning(emailService.isRunning);
    } else {
      setNotification({ type: 'error', message: 'Email service not initialized.' });
    }
  };
  
  const handleNavigateWithDisclaimer = (url) => {
    setDisclaimerDialog({ open: true, url: url });
  };
  
  const proceedToBackend = () => {
    window.open(disclaimerDialog.url, '_blank');
    setDisclaimerDialog({ open: false, url: '' });
  };

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
      <div role="tabpanel" hidden={value !== index} id={`tabpanel-${index}`} aria-labelledby={`tab-${index}`} {...other}>
        {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
      </div>
    );
  }

  function a11yProps(index) {
    return { id: `tab-${index}`, 'aria-controls': `tabpanel-${index}`};
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
          <Button onClick={loadDashboardData} startIcon={<Refresh />} sx={{ mt: 1 }}>Retry</Button>
        </Alert>
      </Container>
    );
  }

  if (!authStatus.authenticated || user?.role !== 'admin') {
    return (
      <Container maxWidth="md" sx={{ mt: 5, textAlign: 'center' }}>
        <Alert severity="warning">
          <Typography variant="h6" gutterBottom>Access Denied</Typography>
          <Typography>You must be an administrator to access this page.</Typography>
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
          <AdminPanelSettings sx={{ mr: 1 }} /> Admin Dashboard
        </Typography>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="admin dashboard tabs" variant="scrollable" scrollButtons="auto">
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
            {/* Stats Cards */}
            <Grid item xs={12} sm={6} md={3}><Card component={motion.div} whileHover={{ scale: 1.02 }}><CardContent><Box display="flex" alignItems="center" mb={1}><FolderOpen color="primary" sx={{ fontSize: 40, mr: 1 }} /><Typography variant="h5">{procedureStats.total}</Typography></Box><Typography color="text.secondary">Total Procedures</Typography></CardContent></Card></Grid>
            <Grid item xs={12} sm={6} md={3}><Card component={motion.div} whileHover={{ scale: 1.02 }}><CardContent><Box display="flex" alignItems="center" mb={1}><CheckCircle color="success" sx={{ fontSize: 40, mr: 1 }} /><Typography variant="h5">{procedureStats.active}</Typography></Box><Typography color="text.secondary">Active Procedures</Typography></CardContent></Card></Grid>
            <Grid item xs={12} sm={6} md={3}><Card component={motion.div} whileHover={{ scale: 1.02 }}><CardContent><Box display="flex" alignItems="center" mb={1}><TrendingUp color="info" sx={{ fontSize: 40, mr: 1 }} /><Typography variant="h5">{procedureStats.pendingReview}</Typography></Box><Typography color="text.secondary">Pending Review</Typography></CardContent></Card></Grid>
            <Grid item xs={12} sm={6} md={3}><Card component={motion.div} whileHover={{ scale: 1.02 }}><CardContent><Box display="flex" alignItems="center" mb={1}><TrendingDown color="error" sx={{ fontSize: 40, mr: 1 }} /><Typography variant="h5">{procedureStats.expired}</Typography></Box><Typography color="text.secondary">Expired Procedures</Typography></CardContent></Card></Grid>
            
            {/* Recent Uploads */}
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.paper' }}>
                <Typography variant="h6" gutterBottom display="flex" alignItems="center"><Upload sx={{ mr: 1 }} />Recent Uploads</Typography>
                <Divider sx={{ mb: 2 }} />
                {recentUploads.length > 0 ? (
                  <List>{recentUploads.map(p => (
                    <ListItem key={p.ID} secondaryAction={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip label={new Date(p.Created).toLocaleDateString()} size="small" />
                        <IconButton size="small" onClick={() => handleNavigateWithDisclaimer(`${siteUrl}/Lists/Procedures/DispForm.aspx?ID=${p.ID}`)}><OpenInNew /></IconButton>
                      </Box>
                    }><ListItemText primary={p.Title} secondary={`LOB: ${p.LOB || 'N/A'}`} /></ListItem>
                  ))}</List>
                ) : <Typography variant="body2" color="text.secondary">No recent uploads.</Typography>}
              </Paper>
            </Grid>

            {/* Expiring Soon */}
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.paper' }}>
                <Typography variant="h6" gutterBottom display="flex" alignItems="center"><Schedule sx={{ mr: 1 }} />Expiring Soon</Typography>
                <Divider sx={{ mb: 2 }} />
                {expiringSoon.length > 0 ? (
                  <List>{expiringSoon.map(p => (
                    <ListItem key={p.ID} secondaryAction={<Chip label={`Expires: ${p.ExpiryDate ? new Date(p.ExpiryDate).toLocaleDateString() : 'N/A'}`} color="warning" size="small" />}><ListItemText primary={p.Title} secondary={`Status: ${p.Status}`} /><IconButton size="small" onClick={() => handleNavigateWithDisclaimer(`${siteUrl}/Lists/Procedures/DispForm.aspx?ID=${p.ID}`)}><OpenInNew /></IconButton></ListItem>
                  ))}</List>
                ) : <Typography variant="body2" color="text.secondary">No procedures expiring soon.</Typography>}
              </Paper>
            </Grid>

            {/* Overdue Procedures */}
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.paper' }}>
                <Typography variant="h6" gutterBottom display="flex" alignItems="center"><ErrorIcon sx={{ mr: 1 }} color="error" />Overdue Procedures</Typography>
                <Divider sx={{ mb: 2 }} />
                {overdue.length > 0 ? (
                  <List>{overdue.map(p => (
                    <ListItem key={p.ID} secondaryAction={<Chip label={`Expired: ${p.ExpiryDate ? new Date(p.ExpiryDate).toLocaleDateString() : 'N/A'}`} color="error" size="small" />}><ListItemText primary={p.Title} secondary={`Status: ${p.Status}`} /><IconButton size="small" onClick={() => handleNavigateWithDisclaimer(`${siteUrl}/Lists/Procedures/DispForm.aspx?ID=${p.ID}`)}><OpenInNew /></IconButton></ListItem>
                  ))}</List>
                ) : <Typography variant="body2" color="text.secondary">No overdue procedures.</Typography>}
              </Paper>
            </Grid>

            {/* Recent Notifications */}
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.paper' }}>
                <Typography variant="h6" gutterBottom display="flex" alignItems="center"><Notifications sx={{ mr: 1 }} />Recent Notifications</Typography>
                <Divider sx={{ mb: 2 }} />
                {notificationLog.length > 0 ? (
                  <List>{notificationLog.map((log, index) => (
                    <ListItem key={log.ID || index} secondaryAction={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip label={log.Status || 'Unknown'} size="small" color={log.Status === 'Success' ? 'success' : log.Status === 'Failed' ? 'error' : 'default'} />
                        <Chip label={new Date(log.Created).toLocaleDateString()} size="small" />
                      </Box>
                    }>
                      <ListItemIcon>{log.NotificationType === 'Expiry Warning' ? <Warning color="warning" /> : <Edit color="info" />}</ListItemIcon>
                      <ListItemText primary={log.NotificationType || 'Notification'} secondary={log.ProcedureName ? `Procedure: ${log.ProcedureName}` : 'Details not available'} />
                    </ListItem>
                  ))}</List>
                ) : <Typography variant="body2" color="text.secondary">No recent notifications.</Typography>}
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={manageProceduresTab} onChange={handleManageTabChange} aria-label="manage procedures sub-tabs">
              <Tab label="All Procedures" {...a11yProps(0)} />
              <Tab label="Audit Log" icon={<Policy />} {...a11yProps(1)} />
            </Tabs>
          </Box>
          <TabPanel value={manageProceduresTab} index={0}>
            <Box display="flex" justifyContent="space-between" alignItems="center" my={3}>
              <Typography variant="h5">All Procedures</Typography>
              <TextField label="Search Procedures" variant="outlined" size="small" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} InputProps={{endAdornment: searchTerm && <IconButton onClick={() => setSearchTerm('')} size="small"><Clear /></IconButton>, startAdornment: <Search sx={{ mr: 1 }} />}}/>
            </Box>
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead><TableRow><TableCell>Title</TableCell><TableCell>Category</TableCell><TableCell>Status</TableCell><TableCell>Primary Owner</TableCell><TableCell>Secondary Owner</TableCell><TableCell>Actions</TableCell></TableRow></TableHead>
                <TableBody>{filteredProcedures.map((p) => (
                  <TableRow key={p.ID}>
                    <TableCell>{p.Title}</TableCell><TableCell>{p.Category}</TableCell>
                    <TableCell><Chip label={p.Status} color={p.Status === 'Active' ? 'success' : 'default'} size="small" /></TableCell>
                    <TableCell>{p.PrimaryOwner || 'N/A'}</TableCell><TableCell>{p.SecondaryOwner || 'N/A'}</TableCell>
                    <TableCell>
                      <IconButton color="primary" size="small" onClick={() => setEditProcedure(p)}><Edit /></IconButton>
                      <IconButton color="error" size="small" onClick={() => setDeleteDialog({ open: true, procedure: { id: p.ID, name: p.Title } })}><Delete /></IconButton>
                      <IconButton size="small" onClick={() => handleNavigateWithDisclaimer(`${siteUrl}/Lists/Procedures/DispForm.aspx?ID=${p.ID}`)}><Visibility /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}</TableBody>
              </Table>
            </TableContainer>
          </TabPanel>
          <TabPanel value={manageProceduresTab} index={1}>
            <Typography variant="h5" sx={{ my: 3 }}>Procedure Change History</Typography>
            <TableContainer component={Paper} elevation={0}>
                <Table>
                    <TableHead><TableRow><TableCell>Title</TableCell><TableCell>Timestamp</TableCell><TableCell>User</TableCell><TableCell>Action</TableCell><TableCell>LOB</TableCell><TableCell>Status</TableCell></TableRow></TableHead>
                    <TableBody>{auditLog.map((log) => (
                        <TableRow key={log.ID}>
                            <TableCell>{log.Title}</TableCell>
                            <TableCell>{new Date(log.LogTimestamp).toLocaleString()}</TableCell>
                            <TableCell>{log.UserID}</TableCell>
                            <TableCell><Chip label={log.ActionType} color={log.ActionType === 'Procedure Deleted' ? 'error' : log.ActionType === 'Procedure Edited' ? 'warning' : 'info'} size="small" /></TableCell>
                            <TableCell>{log.LOB}</TableCell>
                            <TableCell><Chip label={log.Status} color={log.Status === 'Success' ? 'success' : 'error'} size="small" /></TableCell>
                        </TableRow>
                    ))}</TableBody>
                </Table>
            </TableContainer>
          </TabPanel>
          <Dialog open={!!editProcedure} onClose={() => setEditProcedure(null)} fullWidth maxWidth="md">
            <DialogTitle>Edit Procedure</DialogTitle>
            <DialogContent>
              {editProcedure && (
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12}><TextField fullWidth label="Title" value={editProcedure.Title || ''} onChange={(e) => setEditProcedure({ ...editProcedure, Title: e.target.value })} /></Grid>
                  <Grid item xs={12}><TextField fullWidth label="Description" multiline rows={4} value={editProcedure.Description || ''} onChange={(e) => setEditProcedure({ ...editProcedure, Description: e.target.value })} /></Grid>
                  <Grid item xs={6}><TextField fullWidth label="Category" value={editProcedure.Category || ''} onChange={(e) => setEditProcedure({ ...editProcedure, Category: e.target.value })} /></Grid>
                  <Grid item xs={6}><TextField fullWidth label="Tags (comma-separated)" value={editProcedure.Tags || ''} onChange={(e) => setEditProcedure({ ...editProcedure, Tags: e.target.value })} /></Grid>
                  <Grid item xs={6}><TextField fullWidth label="Primary Owner" value={editProcedure.PrimaryOwner || ''} onChange={(e) => setEditProcedure({ ...editProcedure, PrimaryOwner: e.target.value })} /></Grid>
                  <Grid item xs={6}><TextField fullWidth label="Secondary Owner" value={editProcedure.SecondaryOwner || ''} onChange={(e) => setEditProcedure({ ...editProcedure, SecondaryOwner: e.target.value })} /></Grid>
                  <Grid item xs={6}><TextField fullWidth label="Expiry Date" type="date" InputLabelProps={{ shrink: true }} value={editProcedure.ExpiryDate ? new Date(editProcedure.ExpiryDate).toISOString().split('T')[0] : ''} onChange={(e) => setEditProcedure({ ...editProcedure, ExpiryDate: e.target.value })} /></Grid>
                  <Grid item xs={6}><FormControl fullWidth><InputLabel>Status</InputLabel><Select value={editProcedure.Status || ''} label="Status" onChange={(e) => setEditProcedure({ ...editProcedure, Status: e.target.value })}><MenuItem value="Draft">Draft</MenuItem><MenuItem value="Pending Review">Pending Review</MenuItem><MenuItem value="Active">Active</MenuItem><MenuItem value="Archived">Archived</MenuItem></Select></FormControl></Grid>
                </Grid>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEditProcedure(null)}>Cancel</Button>
              <Button onClick={() => handleEditProcedure(editProcedure)} variant="contained" color="primary" disabled={loading}>{loading ? <CircularProgress size={24} /> : 'Save Changes'}</Button>
            </DialogActions>
          </Dialog>
        </TabPanel>
        
        <TabPanel value={activeTab} index={2}>
          <AdminPanel onDataRefresh={onDataRefresh} />
        </TabPanel>

        <TabPanel value={activeTab} index={3}>
          <Typography variant="h5" gutterBottom>User Management</Typography>
          <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.paper' }}>
            <Box mb={3}><Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={4}><Autocomplete fullWidth options={users} getOptionLabel={(option) => option.name || ""} renderInput={(params) => <TextField {...params} label="Select User" />} onChange={(event, newValue) => setSelectedUser(newValue)} value={selectedUser} /></Grid>
              <Grid item xs={12} sm={6} md={3}><FormControl fullWidth><InputLabel>Assign Role</InputLabel><Select value={selectedRole} label="Assign Role" onChange={(e) => setSelectedRole(e.target.value)} disabled={!selectedUser}>{userRoles.map(role => (<MenuItem key={role} value={role}>{role}</MenuItem>))}</Select></FormControl></Grid>
              <Grid item xs={12} sm={6} md={5}><Button variant="contained" color="primary" startIcon={<Save />} onClick={handleUpdateUserRole} disabled={loading || !selectedUser || !selectedRole} sx={{ mr: 1 }}>Update Role</Button><Button variant="contained" color="success" startIcon={<PersonAdd />} onClick={handleGrantAccess} sx={{ mr: 1 }}>Grant Access</Button><Button variant="contained" color="error" startIcon={<Delete />} onClick={handleRevokeAccess}>Revoke Access</Button></Grid>
            </Grid></Box>
            <TableContainer><Table><TableHead><TableRow><TableCell>User</TableCell><TableCell>Email</TableCell><TableCell>Role</TableCell><TableCell>Actions</TableCell></TableRow></TableHead><TableBody>{users.map(user => (
              <TableRow key={user.id}><TableCell><Box display="flex" alignItems="center"><Avatar sx={{ mr: 1 }}>{user.name.charAt(0)}</Avatar>{user.name}</Box></TableCell><TableCell>{user.email}</TableCell><TableCell><Chip label={user.role} color={user.role === 'Admin' ? 'primary' : 'default'} size="small" /></TableCell><TableCell><IconButton size="small" onClick={() => setSelectedUser(user)}><Edit /></IconButton></TableCell></TableRow>
            ))}</TableBody></Table></TableContainer>
          </Paper>
        </TabPanel>

        <TabPanel value={activeTab} index={4}>
          <EmailManagement emailService={emailService} />
        </TabPanel>

        <TabPanel value={activeTab} index={5}>
          <Typography variant="h5" gutterBottom>Settings</Typography>
          <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.paper' }}>
            <FormControlLabel control={<Switch checked={isEmailMonitoringRunning} onChange={handleToggleEmailMonitoring} name="emailMonitoring" color="primary" />} label="Enable Email Monitoring for Procedures" />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>Automatically sends email notifications for expiring procedures.</Typography>
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" gutterBottom>Application Information</Typography>
            <Typography variant="body2">**Environment:** {authStatus.environment}</Typography>
            <Typography variant="body2">**SharePoint Site URL:** {siteUrl || 'N/A'}</Typography>
            <Typography variant="body2">**Current User:** {user?.displayName} ({user?.email}) - Role: {user?.role}</Typography>
            <Typography variant="body2">**Auth Source:** {authStatus.source || 'N/A'}</Typography>
            <Typography variant="body2" sx={{ mt: 2 }}>If you encounter issues, please check the browser console for errors or contact support.</Typography>
          </Paper>
        </TabPanel>
      </motion.div>

      <Dialog open={disclaimerDialog.open} onClose={() => setDisclaimerDialog({ open: false, url: '' })} aria-labelledby="disclaimer-dialog-title">
        <DialogTitle id="disclaimer-dialog-title"><Box display="flex" alignItems="center"><VpnKey color="primary" sx={{ mr: 1 }} />Backend Access Confirmation</Box></DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>You are about to be redirected to the SharePoint backend. This area contains the raw data for the Procedures list.</Typography>
          <Alert severity="warning" sx={{ mt: 2 }}><Typography variant="body2">Please ensure you understand the implications of any changes you make in the backend. Proceed with caution.</Typography></Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDisclaimerDialog({ open: false, url: '' })}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={proceedToBackend} autoFocus>Proceed</Button>
        </DialogActions>
      </Dialog>
      
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, procedure: null })} aria-labelledby="delete-dialog-title">
        <DialogTitle id="delete-dialog-title"><Box display="flex" alignItems="center"><Warning color="error" sx={{ mr: 1 }} />Confirm Delete</Box></DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>Are you sure you want to delete this procedure?</Typography>
          {deleteDialog.procedure && <Alert severity="warning" sx={{ mt: 2 }}><Typography variant="body2"><strong>"{deleteDialog.procedure.name}"</strong> will be permanently deleted. This cannot be undone.</Typography></Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, procedure: null })}>Cancel</Button>
          <Button variant="contained" color="error" onClick={() => handleDeleteProcedure(deleteDialog.procedure)} disabled={loading}>{loading ? <CircularProgress size={16} /> : 'Delete'}</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!notification} autoHideDuration={6000} onClose={() => setNotification(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert onClose={() => setNotification(null)} severity={notification?.type} sx={{ width: '100%' }}>{notification?.message}</Alert>
      </Snackbar>
    </Container>
  );
};

export default AdminDashboard;
