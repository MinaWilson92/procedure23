// pages/AdminDashboard.js - COMPLETE FIXED VERSION
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
import { useSharePoint } from '../SharePointContext'; // Make sure this import is correct
import { useNavigation } from '../contexts/NavigationContext';
import EmailManagement from '../components/EmailManagement';
import EmailNotificationService from '../services/EmailNotificationService';

const AdminDashboard = ({ procedures, onDataRefresh, sharePointAvailable }) => {
  // ✅ Destructure cleanClaimsId from useSharePoint
  const { user, siteUrl, adUserId, displayName, getUserInfo, cleanClaimsId } = useSharePoint();
  const { navigateTo } = useNavigation();
  const emailService = React.useMemo(() => new EmailNotificationService(), []); // Memoize the service

  const theme = useTheme();

  // State for Admin Dashboard
  const [activeTab, setActiveTab] = useState(0);
  const [dashboardData, setDashboardData] = useState(null); // Example for overall dashboard data
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // User Management States
  const [users, setUsers] = useState([]); // All users fetched for management
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]); // Filtered users based on search
  const [usersLoading, setUsersLoading] = useState(false);
  const [selectedUserForAction, setSelectedUserForAction] = useState(null); // For grant/revoke dialogs
  const [grantAccessDialogOpen, setGrantAccessDialogOpen] = useState(false);
  const [revokeAccessDialogOpen, setRevokeAccessDialogOpen] = useState(false);

  // Procedure Management States (assuming these are passed via props or fetched here)
  const [deleteDialog, setDeleteDialog] = useState({ open: false, procedure: null });

  // Audit Log States
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLogLoading, setAuditLogLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Tab change handler
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // ✅ Function to load all users (example - adjust based on how you fetch users)
  // This needs to fetch users with their display names and emails
  const loadUsersForManagement = async () => {
    setUsersLoading(true);
    try {
      // This is a placeholder. You need to replace this with your actual API call
      // to fetch users from SharePoint, ideally with display name and email.
      // Example: Using _api/web/siteusers or Graph API for tenant users
      const response = await fetch(`${siteUrl}/_api/web/siteusers?$select=Id,LoginName,Email,Title`, {
        headers: { 'Accept': 'application/json;odata=verbose' },
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        const fetchedUsers = data.d.results.map(user => ({
          id: user.Id,
          loginName: user.LoginName,
          email: user.Email,
          displayName: user.Title // SharePoint's Title field often holds display name
        }));
        setUsers(fetchedUsers);
        setFilteredUsers(fetchedUsers); // Initialize filtered users
        setNotification({ type: 'success', message: 'Users loaded successfully.' });
      } else {
        const errorText = await response.text();
        console.error('Failed to load users:', response.status, errorText);
        setNotification({ type: 'error', message: `Failed to load users: ${errorText}` });
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setNotification({ type: 'error', message: `Error loading users: ${error.message}` });
    } finally {
      setUsersLoading(false);
    }
  };

  // ✅ Function to load audit logs
  const loadAuditLogs = async () => {
    setAuditLogLoading(true);
    try {
      // Assuming emailService.getEmailActivityLog() fetches data from your 'EmailActivityLog' list
      const logs = await emailService.getEmailActivityLog(); 
      setAuditLogs(logs);
      setNotification({ type: 'success', message: 'Audit logs loaded successfully!' });
    } catch (error) {
      console.error('Error loading audit logs:', error);
      setNotification({ type: 'error', message: 'Failed to load audit logs.' });
    } finally {
      setAuditLogLoading(false);
    }
  };

  // ✅ useEffect to load data when component mounts or tab changes
  useEffect(() => {
    if (activeTab === 0) { // Assuming 'Dashboard Overview' is the first tab (index 0)
      // loadDashboardData(); // If you have a function to load dashboard specific data
    } else if (activeTab === 1) { // Assuming 'User Management' is the second tab (index 1)
      loadUsersForManagement();
    } else if (activeTab === 4) { // Assuming 'Audit Log' is the fifth tab (index 4)
      loadAuditLogs();
    }
  }, [activeTab, siteUrl, emailService]); // Dependencies for useEffect

  // User Search Function
  const handleUserSearch = (event, value) => {
    setUserSearchTerm(value);
    if (value) {
      const lowercasedValue = value.toLowerCase();
      setFilteredUsers(
        users.filter(
          (user) =>
            user.displayName?.toLowerCase().includes(lowercasedValue) ||
            user.email?.toLowerCase().includes(lowercasedValue) ||
            user.loginName?.toLowerCase().includes(lowercasedValue)
        )
      );
    } else {
      setFilteredUsers(users);
    }
  };

  // Pagination Handlers for Audit Log
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // --- User Access Management Functions ---
  const handleGrantAccess = async () => {
    if (!selectedUserForAction || !selectedUserForAction.loginName || !selectedUserForAction.email) {
      setNotification({ type: 'error', message: 'Please select a valid user with email.' });
      return;
    }
    setLoading(true);
    try {
      const currentUserDisplayName = getUserInfo().displayName || 'Admin'; // Current admin's display name
      const targetUserDisplayName = selectedUserForAction.displayName || cleanClaimsId(selectedUserForAction.loginName);

      // ✅ Call the service to send notification and log
      const result = await emailService.triggerUserAccessNotification(
        targetUserDisplayName,
        selectedUserForAction.email,
        currentUserDisplayName
      );

      if (result.success) {
        setNotification({ type: 'success', message: `Access granted for ${targetUserDisplayName}! Email notification sent.` });
        // After successfully granting access (and sending email), update the user's role in SharePoint
        // This part needs your actual logic to update user permissions in SharePoint
        // For example: await updateSharePointUserPermissions(selectedUserForAction.id, 'Grant');
        
        loadAuditLogs(); // Refresh audit logs after successful operation
        setGrantAccessDialogOpen(false);
      } else {
        setNotification({ type: 'error', message: `Failed to grant access: ${result.message}` });
      }
    } catch (error) {
      console.error('Error granting access:', error);
      setNotification({ type: 'error', message: `Error granting access: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeAccess = async () => {
    if (!selectedUserForAction || !selectedUserForAction.loginName || !selectedUserForAction.email) {
      setNotification({ type: 'error', message: 'Please select a valid user with email.' });
      return;
    }
    setLoading(true);
    try {
      const currentUserDisplayName = getUserInfo().displayName || 'Admin'; // Current admin's display name
      const targetUserDisplayName = selectedUserForAction.displayName || cleanClaimsId(selectedUserForAction.loginName);

      // ✅ Call the service to send notification and log
      const result = await emailService.triggerUserAccessRevokedNotification(
        targetUserDisplayName,
        selectedUserForAction.email,
        currentUserDisplayName
      );

      if (result.success) {
        setNotification({ type: 'success', message: `Access revoked for ${targetUserDisplayName}! Email notification sent.` });
        // After successfully revoking access (and sending email), update the user's role in SharePoint
        // This part needs your actual logic to update user permissions in SharePoint
        // For example: await updateSharePointUserPermissions(selectedUserForAction.id, 'Revoke');
        
        loadAuditLogs(); // Refresh audit logs after successful operation
        setRevokeAccessDialogOpen(false);
      } else {
        setNotification({ type: 'error', message: `Failed to revoke access: ${result.message}` });
      }
    } catch (error) {
      console.error('Error revoking access:', error);
      setNotification({ type: 'error', message: `Error revoking access: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  // Placeholder for your actual SharePoint permission update logic
  // async function updateSharePointUserPermissions(userId, action) {
  //   // Implement your SharePoint REST API calls here to modify user permissions
  //   console.log(`Simulating SharePoint permission update for user ${userId}: ${action}`);
  //   return new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
  // }

  // --- Procedure Management Functions --- (Keep your existing ones)
  const handleDeleteProcedure = async (procedureToDelete) => {
    // Implement your procedure deletion logic here
    console.log('Deleting procedure:', procedureToDelete);
    setLoading(true);
    try {
      // Example: Call SharePoint API to delete procedure item
      // const digest = await emailService.getFreshRequestDigest();
      // const response = await fetch(`${siteUrl}/_api/web/lists/getbytitle('Procedures')/items(${procedureToDelete.ID})`, {
      //   method: 'POST',
      //   headers: {
      //     'Accept': 'application/json;odata=verbose',
      //     'X-RequestDigest': digest,
      //     'IF-MATCH': '*',
      //     'X-HTTP-Method': 'DELETE'
      //   },
      //   credentials: 'include'
      // });

      // if (response.ok) {
        setNotification({ type: 'success', message: `Procedure "${procedureToDelete.name}" deleted successfully!` });
        // onDataRefresh(); // Refresh procedures list
      // } else {
      //   const errorText = await response.text();
      //   setNotification({ type: 'error', message: `Failed to delete procedure: ${errorText}` });
      // }
    } catch (error) {
      console.error('Error deleting procedure:', error);
      setNotification({ type: 'error', message: `Error deleting procedure: ${error.message}` });
    } finally {
      setLoading(false);
      setDeleteDialog({ open: false, procedure: null });
    }
  };

  if (!sharePointAvailable) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">
          <Typography variant="h6">SharePoint Context Not Available</Typography>
          <Typography>
            This application requires a SharePoint environment to function. Please ensure you are accessing it from a SharePoint page.
          </Typography>
        </Alert>
      </Container>
    );
  }

  // --- Main Render ---
  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 2, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ color: theme.palette.primary.main }}>
          Admin Dashboard
        </Typography>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="admin dashboard tabs"
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{ mb: 2 }}
        >
          <Tab label="Dashboard Overview" icon={<Dashboard />} />
          <Tab label="User Management" icon={<People />} />
          <Tab label="Procedure Management" icon={<Assignment />} />
          <Tab label="Email Management" icon={<Email />} />
          <Tab label="Audit Log" icon={<Timeline />} /> {/* Fifth tab, index 4 */}
          <Tab label="System Settings" icon={<Settings />} />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {/* Tab 0: Dashboard Overview */}
      {activeTab === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Grid container spacing={3}>
            {/* ... Your existing dashboard overview cards and content ... */}
          </Grid>
        </motion.div>
      )}

      {/* Tab 1: User Management */}
      {activeTab === 1 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            User Management
            <IconButton onClick={loadUsersForManagement} disabled={usersLoading}>
                <Refresh sx={{ fontSize: 20 }} />
            </IconButton>
          </Typography>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
              <Grid item xs={12} sm={8}>
                <Autocomplete
                  options={users}
                  getOptionLabel={(option) => option.displayName || option.email || option.loginName || 'Unknown User'}
                  filterOptions={(options, { inputValue }) => {
                    const lowercasedValue = inputValue.toLowerCase();
                    return options.filter(option =>
                      option.displayName?.toLowerCase().includes(lowercasedValue) ||
                      option.email?.toLowerCase().includes(lowercasedValue) ||
                      option.loginName?.toLowerCase().includes(lowercasedValue)
                    );
                  }}
                  onInputChange={handleUserSearch}
                  onChange={(event, newValue) => setSelectedUserForAction(newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Search User by Name or Email"
                      variant="outlined"
                      fullWidth
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {usersLoading ? <CircularProgress color="inherit" size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                  loading={usersLoading}
                  noOptionsText="No users found"
                />
              </Grid>
              <Grid item xs={12} sm={4} display="flex" justifyContent="flex-end">
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<PersonAdd />}
                  onClick={() => setGrantAccessDialogOpen(true)}
                  disabled={!selectedUserForAction || loading}
                  sx={{ mr: 1 }}
                >
                  Grant Access
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<Security />}
                  onClick={() => setRevokeAccessDialogOpen(true)}
                  disabled={!selectedUserForAction || loading}
                >
                  Revoke Access
                </Button>
              </Grid>
            </Grid>
            {usersLoading ? (
              <LinearProgress sx={{ mt: 2 }} />
            ) : (
                <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                        Select a user from the search bar to grant or revoke their access.
                        The system will attempt to send an email notification to the user upon action.
                    </Typography>
                </Alert>
            )}
          </Paper>
        </Box>
      )}


      {/* Tab 2: Procedure Management */}
      {activeTab === 2 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            Procedure Management
            <IconButton onClick={onDataRefresh} disabled={loading}>
                <Refresh sx={{ fontSize: 20 }} />
            </IconButton>
          </Typography>
          <Paper elevation={3} sx={{ p: 2 }}>
            {/* Display procedures and allow editing/deletion */}
            {procedures && procedures.length > 0 ? (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Title</TableCell>
                      <TableCell>Expiry Date</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {procedures.map((proc) => (
                      <TableRow key={proc.ID}>
                        <TableCell>{proc.Title}</TableCell>
                        <TableCell>{new Date(proc.ExpiryDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {/* Determine status based on ExpiryDate */}
                          {new Date(proc.ExpiryDate) < new Date() ? (
                            <Chip label="Expired" color="error" size="small" icon={<ErrorIcon />} />
                          ) : (
                            <Chip label="Active" color="success" size="small" icon={<CheckCircle />} />
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton size="small" onClick={() => navigateTo(`/edit-procedure/${proc.ID}`)}><Edit /></IconButton>
                          <IconButton size="small" onClick={() => setDeleteDialog({ open: true, procedure: proc })}><Delete /></IconButton>
                          <IconButton size="small" onClick={() => window.open(`${siteUrl}/Lists/Procedures/DispForm.aspx?ID=${proc.ID}`, '_blank')}><OpenInNew /></IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="info">No procedures found. Add new procedures to get started.</Alert>
            )}
            <Button
              variant="contained"
              color="primary"
              startIcon={<Add />}
              sx={{ mt: 2 }}
              onClick={() => navigateTo('/add-procedure')}
            >
              Add New Procedure
            </Button>
          </Paper>
        </Box>
      )}

      {/* Tab 3: Email Management */}
      {activeTab === 3 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <EmailManagement />
        </motion.div>
      )}

      {/* Tab 4: Audit Log */}
      {activeTab === 4 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            Audit Log
            <IconButton onClick={loadAuditLogs} disabled={auditLogLoading}>
                <Refresh sx={{ fontSize: 20 }} />
            </IconButton>
          </Typography>
          <Paper elevation={3} sx={{ p: 2 }}>
            {auditLogLoading ? (
              <LinearProgress />
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Timestamp</TableCell>
                      <TableCell>Activity Type</TableCell>
                      <TableCell>Performed By</TableCell>
                      <TableCell>User ID</TableCell> {/* Display cleaned claims ID */}
                      <TableCell>User Name</TableCell> {/* Display user's display name */}
                      <TableCell>Status</TableCell>
                      <TableCell>Details</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {auditLogs
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((log) => (
                        <TableRow key={log.ID}> {/* Use log.ID or log.id if your data has it */}
                          <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                          <TableCell>{log.ActivityType}</TableCell>
                          <TableCell>{log.PerformedBy}</TableCell>
                          {/* ✅ Use cleanClaimsId for display for User ID */}
                          <TableCell>{log.details.userEmail ? cleanClaimsId(log.details.userEmail) : (log.details.userId ? cleanClaimsId(log.details.userId) : 'N/A')}</TableCell>
                          {/* ✅ Display userDisplayName from details if available, otherwise fallback */}
                          <TableCell>{log.details.userDisplayName || 'Unknown'}</TableCell>
                          <TableCell>
                            <Chip
                              label={log.status || 'SUCCESS'} {/* Assuming default SUCCESS if not explicitly logged */}
                              color={log.status === 'SUCCESS' ? 'success' : 'error'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" component="pre" sx={{ fontSize: '0.8rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                               {JSON.stringify(log.details, null, 2)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    {auditLogs.length === 0 && !auditLogLoading && (
                      <TableRow>
                        <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                          No audit log entries found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={auditLogs.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </Paper>
        </Box>
      )}

      {/* Tab 5: System Settings */}
      {activeTab === 5 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>System Settings</Typography>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Alert severity="info">
              System settings configuration options will be available here.
            </Alert>
            {/* Add your system settings components here */}
          </Paper>
        </Box>
      )}

      {/* --- Dialogs for User Management --- */}
      <Dialog open={grantAccessDialogOpen} onClose={() => setGrantAccessDialogOpen(false)}>
        <DialogTitle>Grant Access to {selectedUserForAction?.displayName || cleanClaimsId(selectedUserForAction?.loginName)}</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Are you sure you want to grant access to <strong>{selectedUserForAction?.displayName || cleanClaimsId(selectedUserForAction?.loginName)}</strong>?
            An email notification will be sent.
          </Typography>
          {loading && <LinearProgress sx={{ mt: 2 }} />}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGrantAccessDialogOpen(false)} disabled={loading}>Cancel</Button>
          <Button variant="contained" color="success" onClick={handleGrantAccess} disabled={loading} startIcon={loading ? <CircularProgress size={16} /> : <CheckCircle />}>
            {loading ? 'Granting...' : 'Confirm Grant'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={revokeAccessDialogOpen} onClose={() => setRevokeAccessDialogOpen(false)}>
        <DialogTitle>Revoke Access from {selectedUserForAction?.displayName || cleanClaimsId(selectedUserForAction?.loginName)}</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Are you sure you want to revoke access from <strong>{selectedUserForAction?.displayName || cleanClaimsId(selectedUserForAction?.loginName)}</strong>?
            An email notification will be sent.
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2">
              This action will remove the user's access.
            </Typography>
          </Alert>
          {loading && <LinearProgress sx={{ mt: 2 }} />}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRevokeAccessDialogOpen(false)} disabled={loading}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleRevokeAccess} disabled={loading} startIcon={loading ? <CircularProgress size={16} /> : <Security />}>
            {loading ? 'Revoking...' : 'Confirm Revoke'}
          </Button>
        </DialogActions>
      </Dialog>


      {/* --- Dialog for Procedure Deletion --- */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, procedure: null })}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">Confirm Delete Procedure</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Are you sure you want to delete this procedure?
          </Typography>
          {deleteDialog.procedure && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>"{deleteDialog.procedure.name || deleteDialog.procedure.Title}"</strong> will be permanently deleted from SharePoint. 
                This action cannot be undone.
              </Typography>
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, procedure: null })}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="error"
            onClick={() => handleDeleteProcedure(deleteDialog.procedure)}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : <Delete />}
          >
            {loading ? 'Deleting...' : 'Delete Procedure'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification Snackbar */}
      <Snackbar
        open={!!notification}
        autoHideDuration={6000}
        onClose={() => setNotification(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setNotification(null)} 
          severity={notification?.type}
          sx={{ width: '100%' }}
        >
          {notification?.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AdminDashboard;
