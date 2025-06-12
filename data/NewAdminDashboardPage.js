// pages/AdminDashboard.js - Final Combined & Corrected Version with Full Audit Logs
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
  Snackbar, Autocomplete, AlertTitle
} from '@mui/material';
import {
  Dashboard, TrendingUp, Warning, CheckCircle, FolderOpen,
  CalendarToday, Assessment, Person, Upload, Notifications,
  History, Star, CloudSync, Assignment, Business, Email,
  Schedule, TrendingDown, Error as ErrorIcon, OpenInNew,
  Settings, BarChart, PieChart, Timeline, AdminPanelSettings,
  Security, Refresh, Add, Edit, Delete, Visibility, Send,
  Group, People, Save, Cancel, Search, Clear, PersonAdd,
  BugReport, VpnKey, Policy, LockOpen, HowToReg
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useSharePoint } from '../SharePointContext';
import { useNavigation } from '../contexts/NavigationContext';
import EmailManagement from '../components/EmailManagement';
import EmailNotificationService from '../services/EmailNotificationService';
import AdminPanel from '../components/AdminPanel'; 


const AdminDashboard = ({ procedures, onDataRefresh, sharePointAvailable }) => {
  const { user, getUserInfo, siteUrl, authStatus, refreshUser } = useSharePoint();
  const theme = useTheme();

  // State
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allProcedures, setAllProcedures] = useState([]);
  const [recentUploads, setRecentUploads] = useState([]);
  const [expiringSoon, setExpiringSoon] = useState([]);
  const [overdue, setOverdue] = useState([]);
  const [notificationLog, setNotificationLog] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [accessAuditLog, setAccessAuditLog] = useState([]);
  const [manageProceduresTab, setManageProceduresTab] = useState(0);
  const [manageUsersTab, setManageUsersTab] = useState(0);
  const [allUsers, setAllUsers] = useState([]);
  const [procedureStats, setProcedureStats] = useState({ total: 0, active: 0, pendingReview: 0, expired: 0 });
  const [editProcedure, setEditProcedure] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [addUser, setAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ Title: '', DisplayName: '', Email: '', UserRole: 'Uploader' });
  const [notification, setNotification] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, procedure: null });
  const [disclaimerDialog, setDisclaimerDialog] = useState({ open: false, url: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [isPnPSetup, setIsPnPSetup] = useState(false);
  const [isEmailMonitoringRunning, setIsEmailMonitoringRunning] = useState(false);

  const [emailService] = useState(() => new EmailNotificationService());

  useEffect(() => {
    if (window.pnp && siteUrl && !isPnPSetup) {
      window.pnp.setup({ sp: { baseUrl: siteUrl } });
      setIsPnPSetup(true);
    }
  }, [siteUrl, isPnPSetup]);

  useEffect(() => {
    if (isPnPSetup) {
      loadInitialData();
    }
  }, [isPnPSetup, onDataRefresh]);

  const loadInitialData = async () => {
    setLoading(true);
    await Promise.all([
        loadDashboardData(),
        loadNotificationLog(),
        loadAuditLog(),
        loadUserRoles(),
        loadAccessAuditLog()
    ]);
    setLoading(false);
  };
  
  const loadDashboardData = async () => {
    try {
      const sp = window.pnp.sp.web.lists.getByTitle('Procedures');
      const items = await sp.items.select('*').get();
      setAllProcedures(items);
      processProcedures(items);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
      setError("Failed to load dashboard data. Please refresh.");
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
        const items = await sp.items.select('*').orderBy("LogTimestamp", false).get();
        setAuditLog(items);
    } catch (err) {
        console.error("Error loading Audit Log:", err);
        setNotification({ type: 'error', message: 'Failed to load Audit Log data.' });
    }
  };

  const loadUserRoles = async () => {
    try {
        const sp = window.pnp.sp.web.lists.getByTitle('UserRoles');
        const items = await sp.items.select('*').get();
        setAllUsers(items);
    } catch (err) {
        console.error("Error loading User Roles:", err);
        setNotification({ type: 'error', message: 'Failed to load User Roles data.' });
    }
  };

  const loadAccessAuditLog = async () => {
    try {
        const sp = window.pnp.sp.web.lists.getByTitle('AccessAuditLog');
        const items = await sp.items.select('*').orderBy("LogTimestamp", false).get();
        setAccessAuditLog(items);
    } catch (err) {
        console.error("Error loading Access Audit Log:", err);
        setNotification({ type: 'error', message: 'Failed to load Access Audit Log.' });
    }
  };
  
  const processProcedures = (proceduresData) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const recent = [], expiring = [], overdueList = [];
    let activeCount = 0, pendingCount = 0, expiredCount = 0;

    proceduresData.forEach(p => {
        const created = new Date(p.Created);
        const expiry = p.ExpiryDate ? new Date(p.ExpiryDate) : null;
        if (created >= new Date().setDate(new Date().getDate() - 7)) recent.push(p);
        if (expiry && expiry > today && Math.ceil(Math.abs(expiry - today) / 86400000) <= 30) expiring.push(p);
        if (expiry && expiry <= today) { overdueList.push(p); expiredCount++; }
        if (p.Status === 'Active') activeCount++;
        else if (p.Status === 'Draft' || p.Status === 'Pending Review') pendingCount++;
    });
    setRecentUploads(recent.sort((a, b) => new Date(b.Created) - new Date(a.Created)).slice(0, 5));
    setExpiringSoon(expiring.sort((a, b) => new Date(a.ExpiryDate) - new Date(b.ExpiryDate)).slice(0, 5));
    setOverdue(overdueList.sort((a, b) => new Date(b.ExpiryDate) - new Date(a.ExpiryDate)).slice(0, 5));
    setProcedureStats({ total: proceduresData.length, active: activeCount, pendingReview: pendingCount, expired: expiredCount });
  };
  
  const handleTabChange = (event, newValue) => setActiveTab(newValue);
  const handleManageProceduresTabChange = (event, newValue) => setManageProceduresTab(newValue);
  const handleManageUsersTabChange = (event, newValue) => setManageUsersTab(newValue);

  const getAdminEmails = async () => {
    try {
        const sp = window.pnp.sp.web.lists.getByTitle("UserRoles");
        const adminUsers = await sp.items.filter("UserRole eq 'Admin' and Status eq 'Active'").get();
        return adminUsers.map(admin => admin.Email); 
    } catch (error) {
        console.error("Failed to fetch admin emails:", error);
        return [];
    }
  };

  const logProcedureAction = async (actionType, procedure, changes = '', status = 'Success') => {
    const logEntry = {
        Title: `${actionType}: ${procedure.Title}`,
        LogTimestamp: new Date().toISOString(),
        UserID: user.displayName,
        ActionType: actionType,
        LOB: procedure.LOB || 'N/A',
        ProcedureName: procedure.Title,
        Status: status,
        Details: changes
    };
    try {
        await window.pnp.sp.web.lists.getByTitle("AuditLog").items.add(logEntry);
        if (emailService?.triggerChangeNotification) {
            const adminEmails = await getAdminEmails();
            const recipients = [...new Set([procedure.PrimaryOwnerEmail, procedure.SecondaryOwnerEmail, ...adminEmails].filter(Boolean))];
            await emailService.triggerChangeNotification(recipients, logEntry);
        }
    } catch (error) {
        console.error("Failed to log procedure action:", error);
    } finally {
        loadAuditLog();
    }
  };

  const logUserAction = async ({ actionType, targetUser, oldValue = '', newValue = '' }) => {
    const performedBy = user.displayName;
    const performedById = user.Title; // Assuming user context has UserID as Title
    const details = `Action: ${actionType}, Target: ${targetUser.DisplayName} (${targetUser.Title}), Performed By: ${performedBy} (${performedById})`;
    const reason = `${actionType.replace(/_/g, ' ')} for ${targetUser.DisplayName} by ${performedBy}`;
    const logEntry = {
        Title: actionType,
        LogTimestamp: new Date().toISOString(),
        TargetUserID: targetUser.Title,
        TargetUserName: targetUser.DisplayName,
        PerformedBy: performedById,
        PerformedByName: performedBy,
        OldValue: oldValue,
        NewValue: newValue,
        Details: `<p>${details}</p>`,
        Reason: reason,
        Status: 'Success'
    };
    try {
        await window.pnp.sp.web.lists.getByTitle("AccessAuditLog").items.add(logEntry);
        if (emailService?.triggerUserChangeNotification) {
            await emailService.triggerUserChangeNotification(targetUser.Email, logEntry);
        }
    } catch (error) {
        console.error("Failed to log user action:", error);
    } finally {
        loadAccessAuditLog();
        loadUserRoles();
    }
  };

  const handleAddUser = async () => {
    setLoading(true);
    try {
        const userToAdd = {
            Title: newUser.Title, DisplayName: newUser.DisplayName, Email: newUser.Email,
            UserRole: newUser.UserRole, Status: 'Active', GrantedBy: user.displayName,
            LastLogin: new Date().toISOString()
        };
        await window.pnp.sp.web.lists.getByTitle("UserRoles").items.add(userToAdd);
        await logUserAction({ actionType: 'USER_ACCESS_GRANTED', targetUser: userToAdd, newValue: newUser.UserRole });
        setNotification({ type: 'success', message: 'User access granted successfully.' });
        setAddUser(false);
        setNewUser({ Title: '', DisplayName: '', Email: '', UserRole: 'Uploader' });
    } catch (error) {
        console.error("Error granting access:", error);
        setNotification({ type: 'error', message: 'Failed to grant user access.' });
    } finally {
        setLoading(false);
    }
  };

  const handleUpdateUser = async () => {
    setLoading(true);
    try {
        const list = window.pnp.sp.web.lists.getByTitle("UserRoles");
        const originalUser = await list.items.getById(editUser.ID).get();
        const changes = {};
        if (originalUser.DisplayName !== editUser.DisplayName) changes.DisplayName = { from: originalUser.DisplayName, to: editUser.DisplayName };
        if (originalUser.Email !== editUser.Email) changes.Email = { from: originalUser.Email, to: editUser.Email };
        if (originalUser.UserRole !== editUser.UserRole) changes.UserRole = { from: originalUser.UserRole, to: editUser.UserRole };
        
        if (Object.keys(changes).length === 0) {
            setNotification({ type: 'info', message: 'No changes detected.' });
        } else {
            await list.items.getById(editUser.ID).update({ DisplayName: editUser.DisplayName, Email: editUser.Email, UserRole: editUser.UserRole });
            await logUserAction({ actionType: 'USER_ACCESS_CHANGED', targetUser: editUser, oldValue: Object.values(changes).map(c=>c.from).join(', '), newValue: Object.values(changes).map(c=>c.to).join(', ') });
            setNotification({ type: 'success', message: 'User updated successfully.' });
        }
        setEditUser(null);
    } catch (error) {
        console.error("Error updating user:", error);
        setNotification({ type: 'error', message: 'Failed to update user.' });
    } finally {
        setLoading(false);
    }
  };

  const handleRevokeAccess = async (userToRevoke) => {
    setLoading(true);
    try {
        await window.pnp.sp.web.lists.getByTitle("UserRoles").items.getById(userToRevoke.ID).update({ Status: 'Inactive' });
        await logUserAction({ actionType: 'USER_ACCESS_REVOKED', targetUser: userToRevoke, oldValue: userToRevoke.UserRole, newValue: 'REVOKED' });
        setNotification({ type: 'success', message: `Access for ${userToRevoke.DisplayName} has been revoked.` });
    } catch (error) {
        console.error("Error revoking access:", error);
        setNotification({ type: 'error', message: 'Failed to revoke access.' });
    } finally {
        setLoading(false);
    }
  };

  const handleEditProcedure = async () => {
    setLoading(true);
    try {
      const sp = window.pnp.sp.web.lists.getByTitle('Procedures');
      const originalItem = await sp.items.getById(editProcedure.ID).get();
      const fieldsToUpdate = {
        Status: editProcedure.Status,
        PrimaryOwner: editProcedure.PrimaryOwner, PrimaryOwnerEmail: editProcedure.PrimaryOwnerEmail,
        SecondaryOwner: editProcedure.SecondaryOwner, SecondaryOwnerEmail: editProcedure.SecondaryOwnerEmail,
        SignOffDate: editProcedure.SignOffDate ? new Date(editProcedure.SignOffDate).toISOString() : null,
        ExpiryDate: editProcedure.ExpiryDate ? new Date(editProcedure.ExpiryDate).toISOString() : null,
      };
      const changesDetailString = Object.entries(fieldsToUpdate).map(([key, value]) => {
          const originalValue = originalItem[key] ? (key.includes('Date') ? new Date(originalItem[key]).toISOString().split('T')[0] : originalItem[key]) : 'empty';
          const newValue = value ? (key.includes('Date') ? new Date(value).toISOString().split('T')[0] : value) : 'empty';
          return originalValue !== newValue ? `${key} from '${originalValue}' to '${newValue}'` : null;
      }).filter(Boolean).join('. ');

      if (!changesDetailString) {
        setNotification({ type: 'info', message: 'No changes were made.' });
      } else {
        await sp.items.getById(editProcedure.ID).update(fieldsToUpdate);
        await logProcedureAction('Procedure Edited', { ...originalItem, ...fieldsToUpdate }, changesDetailString);
        setNotification({ type: 'success', message: `Procedure "${editProcedure.Title}" updated.` });
      }
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
        const itemToDelete = await sp.items.getById(procedure.id).get();
        await sp.items.getById(procedure.id).delete();
        await logProcedureAction('Procedure Deleted', itemToDelete, `Deleted procedure '${itemToDelete.Title}'`);
        setNotification({ type: 'success', message: `Procedure "${procedure.name}" deleted.` });
        onDataRefresh();
    } catch (error) {
        console.error('Error deleting procedure:', error);
    } finally {
        setLoading(false);
    }
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
    }
  };
  
  const handleNavigateWithDisclaimer = (url) => setDisclaimerDialog({ open: true, url });
  const proceedToBackend = () => { window.open(disclaimerDialog.url, '_blank'); setDisclaimerDialog({ open: false, url: '' }); };
  const filteredProcedures = allProcedures.filter(p => (p.Title||'').toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredUsers = allUsers.filter(u => (u.DisplayName||'').toLowerCase().includes(userSearchTerm.toLowerCase()));

  function TabPanel(props) {
    const { children, value, index, ...other } = props;
    return <div role="tabpanel" hidden={value !== index} id={`tabpanel-${index}`} {...other}>{value === index && <Box sx={{ p: 3 }}>{children}</Box>}</div>;
  }
  function a11yProps(index) { return { id: `tab-${index}`, 'aria-controls': `tabpanel-${index}`}; }

  if (loading) return <Container maxWidth="xl" sx={{ mt: 4 }}><LinearProgress /></Container>;
  if (error) return <Container maxWidth="xl" sx={{ mt: 4 }}><Alert severity="error">{error}</Alert></Container>;
  if (!authStatus.authenticated || user?.role !== 'admin') return <Container maxWidth="md" sx={{ mt: 5, textAlign: 'center' }}><Alert severity="warning">Access Denied</Alert></Container>;

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Typography variant="h4" gutterBottom><AdminPanelSettings sx={{ mr: 1 }} /> Admin Dashboard</Typography>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
            <Tab label="Overview" icon={<Dashboard />} {...a11yProps(0)} />
            <Tab label="Manage Procedures" icon={<Assignment />} {...a11yProps(1)} />
            <Tab label="Add Procedure" icon={<Add />} {...a11yProps(2)} />
            <Tab label="Manage Users" icon={<People />} {...a11yProps(3)} />
            <Tab label="Email Integration" icon={<Email />} {...a11yProps(4)} />
            <Tab label="Settings" icon={<Settings />} {...a11yProps(5)} />
          </Tabs>
        </Box>

        <TabPanel value={activeTab} index={0}>
            {/* Overview Content */}
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={manageProceduresTab} onChange={handleManageProceduresTabChange}>
              <Tab label="All Procedures" {...a11yProps(0)} />
              <Tab label="Procedure Audit Log" icon={<Policy />} {...a11yProps(1)} />
            </Tabs>
          </Box>
          <TabPanel value={manageProceduresTab} index={0}>
            <Box display="flex" justifyContent="space-between" alignItems="center" my={3}>
                <Typography variant="h5">Procedures</Typography>
                <TextField label="Search Procedures" variant="outlined" size="small" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} InputProps={{startAdornment: <Search sx={{ mr: 1 }} />}}/>
            </Box>
            <TableContainer component={Paper} elevation={0}>
                <Table><TableHead><TableRow>
                    <TableCell>Title</TableCell><TableCell>Status</TableCell><TableCell>Primary Owner</TableCell><TableCell>Actions</TableCell>
                </TableRow></TableHead>
                <TableBody>{filteredProcedures.map((p) => (
                    <TableRow key={p.ID}>
                        <TableCell>{p.Title}</TableCell>
                        <TableCell><Chip label={p.Status} color={p.Status === 'Active' ? 'success' : 'default'} size="small" /></TableCell>
                        <TableCell>{p.PrimaryOwner}</TableCell>
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
                <Table><TableHead><TableRow>
                    <TableCell>Timestamp</TableCell><TableCell>Action</TableCell><TableCell>Procedure Name</TableCell><TableCell>User</TableCell><TableCell>Details</TableCell>
                </TableRow></TableHead>
                <TableBody>{auditLog.map((log) => (
                    <TableRow key={log.ID}>
                        <TableCell>{new Date(log.LogTimestamp).toLocaleString()}</TableCell>
                        <TableCell><Chip label={log.ActionType} color={log.ActionType.includes('Deleted') ? 'error' : 'warning'} size="small"/></TableCell>
                        <TableCell>{log.ProcedureName}</TableCell>
                        <TableCell>{log.UserID}</TableCell>
                        <TableCell>{log.Details}</TableCell>
                    </TableRow>
                ))}</TableBody>
                </Table>
            </TableContainer>
          </TabPanel>
        </TabPanel>
        
        <TabPanel value={activeTab} index={2}> <AdminPanel onDataRefresh={loadDashboardData} /> </TabPanel>
        
        <TabPanel value={activeTab} index={3}>
          <Typography variant="h5" gutterBottom>User Management</Typography>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={manageUsersTab} onChange={handleManageUsersTabChange}>
              <Tab label="System Users" icon={<People />} {...a11yProps(0)} />
              <Tab label="Access Audit Log" icon={<Security />} {...a11yProps(1)} />
            </Tabs>
          </Box>
          <TabPanel value={manageUsersTab} index={0}>
            <Box display="flex" justifyContent="space-between" alignItems="center" my={3}>
                <Typography variant="h5">Users & Roles</Typography>
                <TextField label="Search Users" variant="outlined" size="small" value={userSearchTerm} onChange={(e) => setUserSearchTerm(e.target.value)} InputProps={{startAdornment: <Search sx={{ mr: 1 }} />}}/>
                <Button variant="contained" startIcon={<PersonAdd />} onClick={() => setAddUser(true)}>Grant New Access</Button>
            </Box>
            <TableContainer component={Paper} elevation={0}>
              <Table><TableHead><TableRow>
                  <TableCell>Display Name</TableCell><TableCell>User ID (Title)</TableCell><TableCell>Email</TableCell>
                  <TableCell>Role</TableCell><TableCell>Status</TableCell><TableCell>Granted By</TableCell>
                  <TableCell>Last Login</TableCell><TableCell>Actions</TableCell>
              </TableRow></TableHead>
                <TableBody>{filteredUsers.map((u) => (
                  <TableRow key={u.ID}>
                    <TableCell>{u.DisplayName}</TableCell><TableCell>{u.Title}</TableCell><TableCell>{u.Email}</TableCell>
                    <TableCell><Chip label={u.UserRole} color={u.UserRole === 'Admin' ? 'primary' : 'default'} size="small"/></TableCell>
                    <TableCell><Chip label={u.Status} color={u.Status === 'Active' ? 'success' : 'error'} size="small"/></TableCell>
                    <TableCell>{u.GrantedBy}</TableCell><TableCell>{u.LastLogin ? new Date(u.LastLogin).toLocaleString() : 'N/A'}</TableCell>
                    <TableCell>
                      <IconButton color="primary" size="small" onClick={() => setEditUser(u)}><Edit /></IconButton>
                      {u.Status === 'Active' && <IconButton title="Revoke Access" color="error" size="small" onClick={() => handleRevokeAccess(u)}><LockOpen /></IconButton>}
                    </TableCell>
                  </TableRow>
                ))}</TableBody>
              </Table>
            </TableContainer>
          </TabPanel>
          <TabPanel value={manageUsersTab} index={1}>
            <Typography variant="h5" sx={{ my: 3 }}>User Access Change History</Typography>
            <TableContainer component={Paper} elevation={0}>
                <Table><TableHead><TableRow>
                    <TableCell>Timestamp</TableCell><TableCell>Action</TableCell><TableCell>Target User</TableCell>
                    <TableCell>Performed By</TableCell><TableCell>Change Details</TableCell><TableCell>Reason</TableCell>
                </TableRow></TableHead>
                    <TableBody>{accessAuditLog.map((log) => (
                        <TableRow key={log.ID}>
                            <TableCell>{new Date(log.LogTimestamp).toLocaleString()}</TableCell>
                            <TableCell><Chip label={log.Title} color={log.Title.includes('REVOKED') ? 'error' : log.Title.includes('GRANTED') ? 'success' : 'info'} size="small"/></TableCell>
                            <TableCell>{log.TargetUserName} ({log.TargetUserID})</TableCell>
                            <TableCell>{log.PerformedByName}</TableCell>
                            <TableCell><b>From:</b> {log.OldValue || 'N/A'} <br/> <b>To:</b> {log.NewValue || 'N/A'}</TableCell>
                            <TableCell>{log.Reason}</TableCell>
                        </TableRow>
                    ))}</TableBody>
                </Table>
            </TableContainer>
          </TabPanel>
        </TabPanel>

        <TabPanel value={activeTab} index={4}><EmailManagement emailService={emailService} /></TabPanel>
        <TabPanel value={activeTab} index={5}>
            {/* Settings Content */}
        </TabPanel>
      </motion.div>
      
      {/* DIALOGS */}
      <Dialog open={addUser} onClose={() => setAddUser(false)}>
        <DialogTitle>Grant New User Access</DialogTitle>
        <DialogContent><Grid container spacing={2} sx={{mt: 1}}>
            <Grid item xs={12}><TextField required fullWidth label="User ID (Title)" value={newUser.Title} onChange={e => setNewUser({...newUser, Title: e.target.value})} /></Grid>
            <Grid item xs={12}><TextField required fullWidth label="Display Name" value={newUser.DisplayName} onChange={e => setNewUser({...newUser, DisplayName: e.target.value})} /></Grid>
            <Grid item xs={12}><TextField required fullWidth label="Email" type="email" value={newUser.Email} onChange={e => setNewUser({...newUser, Email: e.target.value})} /></Grid>
            <Grid item xs={12}><FormControl fullWidth><InputLabel>Role</InputLabel><Select value={newUser.UserRole} label="Role" onChange={e => setNewUser({...newUser, UserRole: e.target.value})}>
                <MenuItem value="Admin">Admin</MenuItem><MenuItem value="Uploader">Uploader</MenuItem>
            </Select></FormControl></Grid>
        </Grid></DialogContent>
        <DialogActions><Button onClick={() => setAddUser(false)}>Cancel</Button><Button onClick={handleAddUser} variant="contained" disabled={loading}>Grant Access</Button></DialogActions>
      </Dialog>
      
      <Dialog open={!!editUser} onClose={() => setEditUser(null)}>
        <DialogTitle>Edit User Details</DialogTitle>
        <DialogContent><Grid container spacing={2} sx={{mt: 1}}>
            <Grid item xs={12}><TextField disabled fullWidth label="User ID (Title)" value={editUser?.Title || ''} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Display Name" value={editUser?.DisplayName || ''} onChange={e => setEditUser({...editUser, DisplayName: e.target.value})} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Email" type="email" value={editUser?.Email || ''} onChange={e => setEditUser({...editUser, Email: e.target.value})} /></Grid>
            <Grid item xs={12}><FormControl fullWidth><InputLabel>Role</InputLabel><Select value={editUser?.UserRole || ''} label="Role" onChange={e => setEditUser({...editUser, UserRole: e.target.value})}>
                <MenuItem value="Admin">Admin</MenuItem><MenuItem value="Uploader">Uploader</MenuItem>
            </Select></FormControl></Grid>
        </Grid></DialogContent>
        <DialogActions><Button onClick={() => setEditUser(null)}>Cancel</Button><Button onClick={handleUpdateUser} variant="contained" disabled={loading}>Save Changes</Button></DialogActions>
      </Dialog>

      <Dialog open={disclaimerDialog.open} onClose={() => setDisclaimerDialog({ open: false, url: '' })}>{/* ... Disclaimer Dialog ... */}</Dialog>
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, procedure: null })}>{/* ... Delete Dialog ... */}</Dialog>
      <Snackbar open={!!notification} autoHideDuration={6000} onClose={() => setNotification(null)}><Alert onClose={() => setNotification(null)} severity={notification?.type} sx={{ width: '100%' }}>{notification?.message}</Alert></Snackbar>
    </Container>
  );
};

export default AdminDashboard;
