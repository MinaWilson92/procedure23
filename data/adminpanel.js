import React, { useState, useEffect } from 'react';
import {
  Box, Container, Typography, Card, CardContent, TextField, Button,
  Select, MenuItem, FormControl, InputLabel, Grid, Alert, Dialog,
  DialogTitle, DialogContent, DialogActions, Tab, Tabs, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Chip, List, ListItem, ListItemIcon, ListItemText,
  Divider, Avatar, Badge, Switch, FormControlLabel, Fab,
  Tooltip, Menu, Accordion, AccordionSummary, AccordionDetails,
  LinearProgress, CircularProgress
} from '@mui/material';
import {
  CloudUpload, ArrowBack, CheckCircle, Error, Warning, Info,
  Assignment, Delete, Edit, Visibility, History, PersonAdd,
  Security, AdminPanelSettings, ExpandMore, GetApp, Share,
  MoreVert, Refresh, FilterList, Search, Add, Block, VerifiedUser,
  Schedule, Folder, Person, Email, CalendarToday, Assessment,
  TrendingUp, Business, FileDownload
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const AdminPanel = ({ user, onDataRefresh }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploadDialog, setUploadDialog] = useState(false);
  const [userManagementDialog, setUserManagementDialog] = useState(false);
  const [editProcedureDialog, setEditProcedureDialog] = useState(false);
  const [selectedProcedure, setSelectedProcedure] = useState(null);
  const [auditLog, setAuditLog] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Mock data
  const [procedures, setProcedures] = useState([
    {
      id: 1,
      name: "Risk Assessment Framework",
      lob: "GRM",
      primary_owner: "John Smith",
      primary_owner_email: "john.smith@hbeg.com",
      expiry: "2024-12-15",
      score: 92,
      status: "Active",
      uploaded_by: "Admin",
      uploaded_at: "2024-01-15T10:30:00Z",
      last_modified: "2024-02-20T14:22:00Z"
    },
    {
      id: 2,
      name: "Trading Compliance Guidelines",
      lob: "CIB",
      primary_owner: "Sarah Johnson",
      primary_owner_email: "sarah.johnson@hbeg.com",
      expiry: "2024-07-20",
      score: 78,
      status: "Expiring Soon",
      uploaded_by: "J.Doe",
      uploaded_at: "2024-01-10T09:15:00Z",
      last_modified: "2024-01-10T09:15:00Z"
    },
    {
      id: 3,
      name: "Client Onboarding Process",
      lob: "IWPB",
      primary_owner: "Mike Chen",
      primary_owner_email: "mike.chen@hbeg.com",
      expiry: "2024-06-01",
      score: 85,
      status: "Expired",
      uploaded_by: "Admin",
      uploaded_at: "2023-12-05T16:45:00Z",
      last_modified: "2024-01-15T11:30:00Z"
    }
  ]);

  useEffect(() => {
    // Load audit log
    setAuditLog([
      {
        id: 1,
        action: "Procedure Created",
        user: "Admin",
        procedure: "Risk Assessment Framework",
        timestamp: "2024-01-15T10:30:00Z",
        details: "New procedure uploaded with quality score 92%",
        type: "CREATE"
      },
      {
        id: 2,
        action: "User Added",
        user: "Admin",
        procedure: "N/A",
        timestamp: "2024-01-14T14:22:00Z",
        details: "Added Sarah Johnson as uploader",
        type: "USER_MGMT"
      },
      {
        id: 3,
        action: "Procedure Updated",
        user: "J.Doe",
        procedure: "Client Onboarding Process",
        timestamp: "2024-01-15T11:30:00Z",
        details: "Updated procedure metadata",
        type: "UPDATE"
      },
      {
        id: 4,
        action: "Procedure Deleted",
        user: "Admin",
        procedure: "Old Security Policy",
        timestamp: "2024-01-13T09:15:00Z",
        details: "Removed outdated procedure",
        type: "DELETE"
      }
    ]);

    // Load users list
    setUsersList([
      {
        id: 1,
        name: "John Smith",
        email: "john.smith@hbeg.com",
        role: "admin",
        status: "active",
        lastLogin: "2024-01-20T08:30:00Z",
        proceduresCount: 5
      },
      {
        id: 2,
        name: "Sarah Johnson",
        email: "sarah.johnson@hbeg.com",
        role: "uploader",
        status: "active",
        lastLogin: "2024-01-19T14:45:00Z",
        proceduresCount: 3
      },
      {
        id: 3,
        name: "Mike Chen",
        email: "mike.chen@hbeg.com",
        role: "user",
        status: "active",
        lastLogin: "2024-01-18T11:20:00Z",
        proceduresCount: 0
      },
      {
        id: 4,
        name: "Lisa Wang",
        email: "lisa.wang@hbeg.com",
        role: "uploader",
        status: "inactive",
        lastLogin: "2024-01-10T16:00:00Z",
        proceduresCount: 8
      }
    ]);
  }, []);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'success';
      case 'Expiring Soon': return 'warning';
      case 'Expired': return 'error';
      default: return 'default';
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return '#f44336';
      case 'uploader': return '#ff9800';
      case 'user': return '#2196f3';
      default: return '#9e9e9e';
    }
  };

  const handleDeleteProcedure = (procedure) => {
    if (window.confirm(`Are you sure you want to delete "${procedure.name}"? This action cannot be undone.`)) {
      setProcedures(prev => prev.filter(p => p.id !== procedure.id));
      
      // Add to audit log
      const newAuditEntry = {
        id: auditLog.length + 1,
        action: "Procedure Deleted",
        user: user?.displayName || "Admin",
        procedure: procedure.name,
        timestamp: new Date().toISOString(),
        details: `Deleted procedure: ${procedure.name}`,
        type: "DELETE"
      };
      setAuditLog(prev => [newAuditEntry, ...prev]);
      
      alert('Procedure deleted successfully!');
    }
  };

  const handleEditProcedure = (procedure) => {
    setSelectedProcedure(procedure);
    setEditProcedureDialog(true);
  };

  const handleUserRoleChange = (userId, newRole) => {
    setUsersList(prev => prev.map(u => 
      u.id === userId ? { ...u, role: newRole } : u
    ));

    // Add to audit log
    const user = usersList.find(u => u.id === userId);
    const newAuditEntry = {
      id: auditLog.length + 1,
      action: "User Role Changed",
      user: "Admin",
      procedure: "N/A",
      timestamp: new Date().toISOString(),
      details: `Changed ${user.name}'s role to ${newRole}`,
      type: "USER_MGMT"
    };
    setAuditLog(prev => [newAuditEntry, ...prev]);
  };

  const filteredProcedures = procedures.filter(proc => {
    const matchesSearch = proc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         proc.lob.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         proc.primary_owner.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || proc.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  // Tab panels
  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index} style={{ paddingTop: 24 }}>
      {value === index && children}
    </div>
  );

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f6fa' }}>
      {/* Header */}
      <Box sx={{ 
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
        color: 'white',
        py: 3,
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton sx={{ color: 'white' }}>
              <ArrowBack />
            </IconButton>
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
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" fontWeight="bold">
                Admin Panel
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Manage procedures, users, and system settings
              </Typography>
            </Box>
            <Chip 
              label="Administrator" 
              size="small"
              sx={{ 
                backgroundColor: '#f44336',
                color: 'white',
                fontWeight: 'bold'
              }}
              icon={<AdminPanelSettings sx={{ color: 'white !important' }} />}
            />
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ mt: -2, pb: 4 }}>
        {/* Admin Stats Dashboard */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card sx={{ 
                background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)', 
                color: 'white',
                cursor: 'pointer',
                '&:hover': { transform: 'translateY(-2px)' },
                transition: 'transform 0.3s'
              }}
              onClick={() => setActiveTab(1)}
              >
                <CardContent sx={{ textAlign: 'center' }}>
                  <Folder sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h4" fontWeight="bold">
                    {procedures.length}
                  </Typography>
                  <Typography variant="body2">
                    Total Procedures
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Card sx={{ 
                background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)', 
                color: 'white',
                cursor: 'pointer',
                '&:hover': { transform: 'translateY(-2px)' },
                transition: 'transform 0.3s'
              }}
              onClick={() => setActiveTab(3)}
              >
                <CardContent sx={{ textAlign: 'center' }}>
                  <Person sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h4" fontWeight="bold">
                    {usersList.length}
                  </Typography>
                  <Typography variant="body2">
                    Registered Users
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Card sx={{ 
                background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)', 
                color: 'white',
                cursor: 'pointer',
                '&:hover': { transform: 'translateY(-2px)' },
                transition: 'transform 0.3s'
              }}
              onClick={() => setActiveTab(2)}
              >
                <CardContent sx={{ textAlign: 'center' }}>
                  <History sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h4" fontWeight="bold">
                    {auditLog.length}
                  </Typography>
                  <Typography variant="body2">
                    Audit Entries
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <Card sx={{ 
                background: 'linear-gradient(135deg, #7b1fa2 0%, #6a1b9a 100%)', 
                color: 'white',
                cursor: 'pointer',
                '&:hover': { transform: 'translateY(-2px)' },
                transition: 'transform 0.3s'
              }}
              onClick={() => setActiveTab(0)}
              >
                <CardContent sx={{ textAlign: 'center' }}>
                  <CloudUpload sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h4" fontWeight="bold">
                    +
                  </Typography>
                  <Typography variant="body2">
                    Upload New
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>

        {/* Tab Navigation */}
        <Card sx={{ mb: 3 }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{
              '& .MuiTab-root': {
                minHeight: 72,
                fontWeight: 'bold'
              }
            }}
          >
            <Tab 
              icon={<CloudUpload />} 
              label="Upload Procedures" 
              iconPosition="start"
            />
            <Tab 
              icon={<Folder />} 
              label="Manage Procedures" 
              iconPosition="start"
            />
            <Tab 
              icon={<History />} 
              label="Audit Log" 
              iconPosition="start"
            />
            <Tab 
              icon={<Security />} 
              label="User Management" 
              iconPosition="start"
            />
          </Tabs>
        </Card>

        {/* Tab Content */}
        
        {/* Tab 0: Upload Procedures */}
        <TabPanel value={activeTab} index={0}>
          <Card>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CloudUpload color="primary" />
                Upload New Procedure
              </Typography>
              
              <Alert severity="info" sx={{ mb: 3 }}>
                Upload and analyze procedure documents with AI-powered quality assessment.
              </Alert>

              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <Box sx={{ 
                    border: '2px dashed #d0d0d0',
                    borderRadius: 2,
                    p: 6,
                    textAlign: 'center',
                    bgcolor: '#f8f9fa'
                  }}>
                    <CloudUpload sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h5" gutterBottom>
                      Select Procedure Document
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Upload a PDF or Word document (.pdf, .docx, .doc)
                    </Typography>
                    <Button
                      variant="contained"
                      component="label"
                      size="large"
                      sx={{ mt: 2 }}
                    >
                      Choose File
                      <input type="file" hidden accept=".pdf,.docx,.doc" />
                    </Button>
                  </Box>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        📋 Upload Guidelines
                      </Typography>
                      <List dense>
                        <ListItem>
                          <ListItemIcon><CheckCircle fontSize="small" color="success" /></ListItemIcon>
                          <ListItemText primary="PDF, DOC, DOCX formats" />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon><CheckCircle fontSize="small" color="success" /></ListItemIcon>
                          <ListItemText primary="Maximum 10MB file size" />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon><CheckCircle fontSize="small" color="success" /></ListItemIcon>
                          <ListItemText primary="Auto AI quality analysis" />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon><CheckCircle fontSize="small" color="success" /></ListItemIcon>
                          <ListItemText primary="SharePoint integration" />
                        </ListItem>
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </TabPanel>

        {/* Tab 1: Manage Procedures */}
        <TabPanel value={activeTab} index={1}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Folder color="primary" />
                  Manage Procedures ({filteredProcedures.length})
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    size="small"
                    placeholder="Search procedures..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Filter</InputLabel>
                    <Select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      label="Filter"
                    >
                      <MenuItem value="all">All Status</MenuItem>
                      <MenuItem value="Active">Active</MenuItem>
                      <MenuItem value="Expiring Soon">Expiring Soon</MenuItem>
                      <MenuItem value="Expired">Expired</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Box>

              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                      <TableCell><strong>Procedure</strong></TableCell>
                      <TableCell><strong>LOB</strong></TableCell>
                      <TableCell><strong>Owner</strong></TableCell>
                      <TableCell><strong>Status</strong></TableCell>
                      <TableCell><strong>Quality</strong></TableCell>
                      <TableCell><strong>Expiry</strong></TableCell>
                      <TableCell><strong>Actions</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredProcedures.map((procedure) => (
                      <TableRow key={procedure.id} hover>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {procedure.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ID: {procedure.id} • Uploaded by {procedure.uploaded_by}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip label={procedure.lob} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2">{procedure.primary_owner}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {procedure.primary_owner_email}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={procedure.status} 
                            color={getStatusColor(procedure.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" fontWeight="bold">
                              {procedure.score}%
                            </Typography>
                            <LinearProgress 
                              variant="determinate" 
                              value={procedure.score} 
                              sx={{ width: 50, height: 6 }}
                              color={procedure.score >= 80 ? 'success' : procedure.score >= 60 ? 'warning' : 'error'}
                            />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(procedure.expiry).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="View Details">
                              <IconButton size="small" color="primary">
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit Procedure">
                              <IconButton 
                                size="small" 
                                color="warning"
                                onClick={() => handleEditProcedure(procedure)}
                              >
                                <Edit />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Procedure">
                              <IconButton 
                                size="small" 
                                color="error"
                                onClick={() => handleDeleteProcedure(procedure)}
                              >
                                <Delete />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </TabPanel>

        {/* Tab 2: Audit Log */}
        <TabPanel value={activeTab} index={2}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <History color="primary" />
                  System Audit Log
                </Typography>
                <Button startIcon={<Refresh />} variant="outlined">
                  Refresh
                </Button>
              </Box>

              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                      <TableCell><strong>Timestamp</strong></TableCell>
                      <TableCell><strong>Action</strong></TableCell>
                      <TableCell><strong>User</strong></TableCell>
                      <TableCell><strong>Procedure</strong></TableCell>
                      <TableCell><strong>Details</strong></TableCell>
                      <TableCell><strong>Type</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {auditLog.map((entry) => (
                      <TableRow key={entry.id} hover>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(entry.timestamp).toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {entry.action}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 24, height: 24, fontSize: 12 }}>
                              {entry.user.charAt(0)}
                            </Avatar>
                            <Typography variant="body2">{entry.user}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {entry.procedure}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {entry.details}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={entry.type} 
                            size="small"
                            color={
                              entry.type === 'CREATE' ? 'success' :
                              entry.type === 'DELETE' ? 'error' :
                              entry.type === 'UPDATE' ? 'warning' :
                              'info'
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </TabPanel>

        {/* Tab 3: User Management */}
        <TabPanel value={activeTab} index={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Security color="primary" />
                  User Management & Access Rights
                </Typography>
                <Button 
                  startIcon={<PersonAdd />} 
                  variant="contained"
                  onClick={() => setUserManagementDialog(true)}
                >
                  Add User
                </Button>
              </Box>

              <Grid container spacing={3}>
                {/* Users List */}
                <Grid item xs={12} md={8}>
                  <TableContainer component={Paper} variant="outlined">
                    <Table>
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                          <TableCell><strong>User</strong></TableCell>
                          <TableCell><strong>Role</strong></TableCell>
                          <TableCell><strong>Status</strong></TableCell>
                          <TableCell><strong>Last Login</strong></TableCell>
                          <TableCell><strong>Procedures</strong></TableCell>
                          <TableCell><strong>Actions</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {usersList.map((user) => (
                          <TableRow key={user.id} hover>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Avatar sx={{ bgcolor: getRoleColor(user.role) }}>
                                  {user.name.split(' ').map(n => n.charAt(0)).join('')}
                                </Avatar>
                                <Box>
                                  <Typography variant="body2" fontWeight="bold">
                                    {user.name}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {user.email}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <FormControl size="small" sx={{ minWidth: 100 }}>
                                <Select
                                  value={user.role}
                                  onChange={(e) => handleUserRoleChange(user.id, e.target.value)}
                                  variant="outlined"
                                >
                                  <MenuItem value="user">User</MenuItem>
                                  <MenuItem value="uploader">Uploader</MenuItem>
                                  <MenuItem value="admin">Admin</MenuItem>
                                </Select>
                              </FormControl>
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={user.status} 
                                color={user.status === 'active' ? 'success' : 'error'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {new Date(user.lastLogin).toLocaleDateString()}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {user.proceduresCount}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Tooltip title="View Profile">
                                  <IconButton size="small" color="primary">
                                    <Visibility />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title={user.status === 'active' ? 'Deactivate' : 'Activate'}>
                                  <IconButton 
                                    size="small" 
                                    color={user.status === 'active' ? 'error' : 'success'}
                                  >
                                    {user.status === 'active' ? <Block /> : <CheckCircle />}
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>

                {/* Role Information */}
                <Grid item xs={12} md={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        🔐 Role Permissions
                      </Typography>
                      
                      <Accordion>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#f44336' }} />
                            <Typography fontWeight="bold">Admin</Typography>
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                          <List dense>
                            <ListItem>
                              <ListItemIcon><CheckCircle fontSize="small" color="success" /></ListItemIcon>
                              <ListItemText primary="Upload procedures" />
                            </ListItem>
                            <ListItem>
                              <ListItemIcon><CheckCircle fontSize="small" color="success" /></ListItemIcon>
                              <ListItemText primary="Delete procedures" />
                            </ListItem>
                            <ListItem>
                              <ListItemIcon><CheckCircle fontSize="small" color="success" /></ListItemIcon>
                              <ListItemText primary="Manage users" />
                            </ListItem>
                            <ListItem>
                              <ListItemIcon><CheckCircle fontSize="small" color="success" /></ListItemIcon>
                              <ListItemText primary="View audit logs" />
                            </ListItem>
                            <ListItem>
                              <ListItemIcon><CheckCircle fontSize="small" color="success" /></ListItemIcon>
                              <ListItemText primary="System settings" />
                            </ListItem>
                          </List>
                        </AccordionDetails>
                      </Accordion>

                      <Accordion>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#ff9800' }} />
                            <Typography fontWeight="bold">Uploader</Typography>
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                          <List dense>
                            <ListItem>
                              <ListItemIcon><CheckCircle fontSize="small" color="success" /></ListItemIcon>
                              <ListItemText primary="Upload procedures" />
                            </ListItem>
                            <ListItem>
                              <ListItemIcon><CheckCircle fontSize="small" color="success" /></ListItemIcon>
                              <ListItemText primary="Edit own procedures" />
                            </ListItem>
                            <ListItem>
                              <ListItemIcon><CheckCircle fontSize="small" color="success" /></ListItemIcon>
                              <ListItemText primary="View all procedures" />
                            </ListItem>
                            <ListItem>
                              <ListItemIcon><Error fontSize="small" color="error" /></ListItemIcon>
                              <ListItemText primary="Cannot delete procedures" />
                            </ListItem>
                          </List>
                        </AccordionDetails>
                      </Accordion>

                      <Accordion>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#2196f3' }} />
                            <Typography fontWeight="bold">User</Typography>
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                          <List dense>
                            <ListItem>
                              <ListItemIcon><CheckCircle fontSize="small" color="success" /></ListItemIcon>
                              <ListItemText primary="View procedures" />
                            </ListItem>
                            <ListItem>
                              <ListItemIcon><CheckCircle fontSize="small" color="success" /></ListItemIcon>
                              <ListItemText primary="Download procedures" />
                            </ListItem>
                            <ListItem>
                              <ListItemIcon><CheckCircle fontSize="small" color="success" /></ListItemIcon>
                              <ListItemText primary="Receive notifications" />
                            </ListItem>
                            <ListItem>
                              <ListItemIcon><Error fontSize="small" color="error" /></ListItemIcon>
                              <ListItemText primary="Cannot upload" />
                            </ListItem>
                          </List>
                        </AccordionDetails>
                      </Accordion>
                    </CardContent>
                  </Card>

                  <Card variant="outlined" sx={{ mt: 2 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        📊 User Statistics
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="body2">Total Users:</Typography>
                        <Typography variant="body2" fontWeight="bold">{usersList.length}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="body2">Admins:</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {usersList.filter(u => u.role === 'admin').length}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="body2">Uploaders:</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {usersList.filter(u => u.role === 'uploader').length}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="body2">Regular Users:</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {usersList.filter(u => u.role === 'user').length}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Active:</Typography>
                        <Typography variant="body2" fontWeight="bold" color="success.main">
                          {usersList.filter(u => u.status === 'active').length}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </TabPanel>

        {/* Add User Dialog */}
        <Dialog 
          open={userManagementDialog} 
          onClose={() => setUserManagementDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PersonAdd color="primary" />
              Add New User
            </Box>
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Full Name"
                  placeholder="Enter user's full name"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email Address"
                  placeholder="user@hbeg.com"
                  type="email"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Role</InputLabel>
                  <Select
                    label="Role"
                    defaultValue="user"
                  >
                    <MenuItem value="user">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Person fontSize="small" />
                        User - View Only
                      </Box>
                    </MenuItem>
                    <MenuItem value="uploader">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CloudUpload fontSize="small" />
                        Uploader - Can Upload
                      </Box>
                    </MenuItem>
                    <MenuItem value="admin">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AdminPanelSettings fontSize="small" />
                        Admin - Full Access
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Alert severity="info">
                  <Typography variant="body2">
                    The user will receive an email invitation with login instructions.
                  </Typography>
                </Alert>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setUserManagementDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="contained" 
              onClick={() => {
                setUserManagementDialog(false);
                alert('User invitation sent successfully!');
              }}
            >
              Send Invitation
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Procedure Dialog */}
        <Dialog 
          open={editProcedureDialog} 
          onClose={() => setEditProcedureDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Edit color="primary" />
              Edit Procedure: {selectedProcedure?.name}
            </Box>
          </DialogTitle>
          <DialogContent>
            {selectedProcedure && (
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Procedure Name"
                    defaultValue={selectedProcedure.name}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Primary Owner"
                    defaultValue={selectedProcedure.primary_owner}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Primary Owner Email"
                    defaultValue={selectedProcedure.primary_owner_email}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>LOB</InputLabel>
                    <Select
                      defaultValue={selectedProcedure.lob}
                      label="LOB"
                    >
                      <MenuItem value="IWPB">IWPB - Investment Banking</MenuItem>
                      <MenuItem value="CIB">CIB - Corporate Banking</MenuItem>
                      <MenuItem value="GRM">GRM - Global Risk Management</MenuItem>
                      <MenuItem value="GCOO">GCOO - Group COO</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Expiry Date"
                    type="date"
                    defaultValue={selectedProcedure.expiry}
                    InputLabelProps={{ shrink: true }}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      defaultValue={selectedProcedure.status}
                      label="Status"
                    >
                      <MenuItem value="Active">Active</MenuItem>
                      <MenuItem value="Expiring Soon">Expiring Soon</MenuItem>
                      <MenuItem value="Expired">Expired</MenuItem>
                      <MenuItem value="Under Review">Under Review</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditProcedureDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="contained" 
              onClick={() => {
                setEditProcedureDialog(false);
                alert('Procedure updated successfully!');
              }}
            >
              Save Changes
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default AdminPanel;
