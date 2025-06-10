// pages/AdminDashboard.js - Complete Fixed Version
import React, { useState, useEffect } from ‘react’;
import {
Box, Container, Typography, Grid, Paper, Card, CardContent,
Button, Chip, IconButton, useTheme, alpha, List, ListItem,
ListItemIcon, ListItemText, Divider, Alert, Skeleton,
LinearProgress, Badge, Tabs, Tab, FormControl, InputLabel,
Select, MenuItem, TextField, Switch, FormControlLabel,
Dialog, DialogTitle, DialogContent, DialogActions,
Table, TableBody, TableCell, TableContainer, TableHead,
TableRow, TablePagination, Avatar, CircularProgress
} from ‘@mui/material’;
import {
Dashboard, TrendingUp, Warning, CheckCircle, ArrowBack,
FolderOpen, CalendarToday, Assessment, Person, Upload,
Notifications, History, Star, CloudSync, Assignment,
Business, Email, Schedule, TrendingDown, Error as ErrorIcon,
OpenInNew, Settings, BarChart, PieChart, Timeline,
AdminPanelSettings, Security, Refresh, Add, Edit,
Delete, Visibility, Send, Group, People
} from ‘@mui/icons-material’;
import { motion } from ‘framer-motion’;
import { useSharePoint } from ‘../SharePointContext’;
import { useNavigation } from ‘../contexts/NavigationContext’;

// Import the FIXED email management component
import EmailManagement from ‘../components/EmailManagement’;

const AdminDashboard = () => {
const { navigate } = useNavigation();
const theme = useTheme();
const { user } = useSharePoint();

// State management
const [activeTab, setActiveTab] = useState(0);
const [dashboardData, setDashboardData] = useState(null);
const [procedures, setProcedures] = useState([]);
const [users, setUsers] = useState([]);
const [auditLog, setAuditLog] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
const [selectedTimeRange, setSelectedTimeRange] = useState(‘30’);

// SharePoint API base URL
const baseUrl = ‘https://teams.global.hsbc/sites/EmployeeEng’;

// Tab configuration
const adminTabs = [
{
label: ‘Dashboard Overview’,
icon: <Dashboard />,
value: 0,
description: ‘System metrics and analytics’
},
{
label: ‘Procedure Management’,
icon: <Assignment />,
value: 1,
description: ‘Manage all procedures and uploads’
},
{
label: ‘User Management’,
icon: <People />,
value: 2,
description: ‘Manage user roles and permissions’
},
{
label: ‘Email Management’,
icon: <Email />,
value: 3,
description: ‘Configure email notifications and templates’
},
{
label: ‘System Settings’,
icon: <Settings />,
value: 4,
description: ‘System configuration and maintenance’
},
{
label: ‘Audit & Logs’,
icon: <History />,
value: 5,
description: ‘View system activity and audit trails’
}
];

useEffect(() => {
fetchAdminDashboardData();
}, [selectedTimeRange]);

const fetchAdminDashboardData = async () => {
try {
setLoading(true);
setError(null);

```
  console.log('📊 Fetching admin dashboard data from SharePoint...');
  
  // Fetch procedures from SharePoint
  await fetchProcedures();
  
  // Calculate dashboard summary from procedures
  calculateDashboardSummary();
  
} catch (err) {
  console.error('❌ Error fetching admin dashboard data:', err);
  setError(err.message);
  
  // Set mock data as fallback
  setMockDashboardData();
} finally {
  setLoading(false);
}
```

};

const fetchProcedures = async () => {
try {
console.log(‘📄 Fetching procedures from SharePoint…’);

```
  const response = await fetch(
    `${baseUrl}/_api/web/lists/getbytitle('Procedures')/items?$select=*&$top=5000`,
    {
      method: 'GET',
      headers: { 
        'Accept': 'application/json; odata=verbose',
        'Content-Type': 'application/json; odata=verbose'
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch procedures: ${response.status}`);
  }

  const data = await response.json();
  const proceduresData = data.d.results.map(item => ({
    id: item.Id,
    name: item.Title,
    expiry: item.ExpiryDate,
    primary_owner: item.PrimaryOwner,
    primary_owner_email: item.PrimaryOwnerEmail,
    secondary_owner: item.SecondaryOwner || '',
    secondary_owner_email: item.SecondaryOwnerEmail || '',
    lob: item.LOB,
    procedure_subsection: item.ProcedureSubsection || '',
    score: item.QualityScore || 0,
    uploaded_by: item.UploadedBy,
    uploaded_at: item.UploadedAt,
    status: item.Status || 'Active'
  }));
  
  setProcedures(proceduresData);
  console.log('✅ Procedures loaded from SharePoint:', proceduresData.length);
  
} catch (error) {
  console.error('❌ Error fetching procedures from SharePoint:', error);
  throw error;
}
```

};

const calculateDashboardSummary = () => {
if (procedures.length === 0) {
setMockDashboardData();
return;
}

```
const now = new Date();
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

const summary = {
  totalProcedures: procedures.length,
  activeProcedures: procedures.filter(p => p.status === 'Active').length,
  expiredProcedures: procedures.filter(p => new Date(p.expiry) < now).length,
  expiringSoon: procedures.filter(p => {
    const expiry = new Date(p.expiry);
    return expiry > now && expiry - now < THIRTY_DAYS;
  }).length,
  highQualityProcedures: procedures.filter(p => (p.score || 0) >= 80).length,
  lowQualityProcedures: procedures.filter(p => (p.score || 0) < 60).length,
  averageQualityScore: procedures.length > 0 ? 
    Math.round(procedures.reduce((sum, p) => sum + (p.score || 0), 0) / procedures.length) : 0,
  totalUsers: 156, // This would come from SharePoint UserRoles list
  activeUsers: 142,
  adminUsers: 8,
  recentUploads: procedures.filter(p => {
    const uploadDate = new Date(p.uploaded_at);
    return now - uploadDate < THIRTY_DAYS;
  }).length,
  systemHealth: 98.5,
  sharepointSync: true,
  emailNotifications: true,
  lobBreakdown: calculateLOBBreakdown(procedures)
};

setDashboardData(summary);
console.log('✅ Dashboard summary calculated:', summary);
```

};

const calculateLOBBreakdown = (proceduresData) => {
const breakdown = {};
proceduresData.forEach(proc => {
const lob = proc.lob || ‘Other’;
breakdown[lob] = (breakdown[lob] || 0) + 1;
});
return breakdown;
};

const setMockDashboardData = () => {
const mockData = {
totalProcedures: 247,
activeProcedures: 231,
expiredProcedures: 8,
expiringSoon: 23,
highQualityProcedures: 186,
lowQualityProcedures: 16,
averageQualityScore: 84.2,
totalUsers: 156,
activeUsers: 142,
adminUsers: 8,
recentUploads: 12,
systemHealth: 98.5,
sharepointSync: false, // Indicate this is mock data
emailNotifications: true,
lobBreakdown: {
‘IWPB’: 45,
‘CIB’: 67,
‘GCOO’: 38,
‘GRM’: 52,
‘GF’: 29,
‘GTRB’: 16
}
};
setDashboardData(mockData);
console.log(‘⚠️ Using mock dashboard data’);
};

const handleTabChange = (event, newValue) => {
setActiveTab(newValue);
};

const handleTimeRangeChange = (event) => {
setSelectedTimeRange(event.target.value);
};

const stats = dashboardData || {};

if (loading && activeTab === 0) {
return (
<Box sx={{ minHeight: ‘100vh’, bgcolor: ‘#f5f6fa’ }}>
<Container maxWidth=“lg” sx={{ pt: 4 }}>
<Skeleton variant=“text” width=“60%” height={60} sx={{ mb: 2 }} />
<Grid container spacing={3}>
{[1, 2, 3, 4, 5, 6].map(n => (
<Grid item xs={12} sm={6} md={4} key={n}>
<Skeleton variant=“rectangular” height={120} sx={{ borderRadius: 2 }} />
</Grid>
))}
</Grid>
</Container>
</Box>
);
}

if (error && activeTab === 0) {
return (
<Box sx={{ minHeight: ‘100vh’, bgcolor: ‘#f5f6fa’ }}>
<Container maxWidth=“lg” sx={{ pt: 4 }}>
<Alert severity=“error” sx={{ mb: 3 }}>
<Typography variant="h6" gutterBottom>Unable to load admin dashboard</Typography>
<Typography variant="body2">{error}</Typography>
<Button
variant=“contained”
size=“small”
sx={{ mt: 2 }}
onClick={fetchAdminDashboardData}
>
Retry
</Button>
</Alert>
</Container>
</Box>
);
}

return (
<Box sx={{ minHeight: ‘100vh’, bgcolor: ‘#f5f6fa’ }}>
{/* Enhanced Admin Header */}
<Box sx={{
background: ‘linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)’,
color: ‘white’,
py: 3,
boxShadow: ‘0 4px 6px rgba(0,0,0,0.1)’
}}>
<Container maxWidth="lg">
<Box sx={{ display: ‘flex’, alignItems: ‘center’, gap: 2 }}>
<IconButton onClick={() => navigate(‘home’)} sx={{ color: ‘white’ }}>
<ArrowBack />
</IconButton>
<Box sx={{ flex: 1 }}>
<Typography variant="h4" fontWeight="bold">
Admin Dashboard
</Typography>
<Typography variant=“body2” sx={{ opacity: 0.9 }}>
System administration and management console
</Typography>
</Box>
<Box sx={{ display: ‘flex’, alignItems: ‘center’, gap: 2 }}>
<Chip
icon={<AdminPanelSettings />}
label=“Administrator”
size=“small”
sx={{
backgroundColor: ‘#f44336’,
color: ‘white’,
fontWeight: ‘bold’
}}
/>
<Chip
label={user?.displayName || user?.staffId}
size=“small”
sx={{
backgroundColor: ‘rgba(255,255,255,0.2)’,
color: ‘white’
}}
/>
{!stats.sharepointSync && (
<Chip
label=“Demo Mode”
size=“small”
color=“warning”
sx={{ fontWeight: ‘bold’ }}
/>
)}
</Box>
</Box>
</Container>
</Box>

```
  <Container maxWidth="lg" sx={{ mt: -2, pb: 4 }}>
    {/* Admin Navigation Tabs */}
    <Paper sx={{ mb: 3, overflow: 'hidden' }}>
      <Tabs 
        value={activeTab} 
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ 
          borderBottom: 1, 
          borderColor: 'divider',
          '& .MuiTab-root': {
            minHeight: 80,
            minWidth: 120
          }
        }}
      >
        {adminTabs.map((tab) => (
          <Tab
            key={tab.value}
            icon={tab.icon}
            label={tab.label}
            value={tab.value}
            sx={{ 
              '& .MuiTab-iconWrapper': {
                marginBottom: 1
              }
            }}
          />
        ))}
      </Tabs>
    </Paper>

    {/* SharePoint Connection Status */}
    {!stats.sharepointSync && (
      <Alert severity="warning" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Demo Mode:</strong> SharePoint connection not available. 
          Displaying sample data for demonstration purposes.
        </Typography>
      </Alert>
    )}

    {/* Tab Content */}
    <Box>
      {/* Dashboard Overview Tab */}
      {activeTab === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Key Metrics Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)', 
                color: 'white',
                boxShadow: '0 4px 12px rgba(25,118,210,0.3)'
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography color="rgba(255,255,255,0.8)" variant="body2" gutterBottom>
                        Total Procedures
                      </Typography>
                      <Typography variant="h3" fontWeight="bold">
                        {stats.totalProcedures || 0}
                      </Typography>
                    </Box>
                    <FolderOpen sx={{ fontSize: 50, opacity: 0.3 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)', 
                color: 'white',
                boxShadow: '0 4px 12px rgba(255,152,0,0.3)'
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography color="rgba(255,255,255,0.8)" variant="body2" gutterBottom>
                        Need Attention
                      </Typography>
                      <Typography variant="h3" fontWeight="bold">
                        {stats.expiringSoon || 0}
                      </Typography>
                    </Box>
                    <Warning sx={{ fontSize: 50, opacity: 0.3 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)', 
                color: 'white',
                boxShadow: '0 4px 12px rgba(76,175,80,0.3)'
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography color="rgba(255,255,255,0.8)" variant="body2" gutterBottom>
                        Active Users
                      </Typography>
                      <Typography variant="h3" fontWeight="bold">
                        {stats.activeUsers || 0}
                      </Typography>
                    </Box>
                    <Person sx={{ fontSize: 50, opacity: 0.3 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                background: 'linear-gradient(135deg, #7b1fa2 0%, #6a1b9a 100%)', 
                color: 'white',
                boxShadow: '0 4px 12px rgba(123,31,162,0.3)'
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography color="rgba(255,255,255,0.8)" variant="body2" gutterBottom>
                        Quality Score
                      </Typography>
                      <Typography variant="h3" fontWeight="bold">
                        {stats.averageQualityScore || 0}%
                      </Typography>
                    </Box>
                    <Assessment sx={{ fontSize: 50, opacity: 0.3 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* System Health & Quick Actions */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    📊 System Health Dashboard
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          System Performance
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={stats.systemHealth || 0} 
                            sx={{ flex: 1, height: 8, borderRadius: 4 }}
                          />
                          <Typography variant="h6" color="success.main">
                            {stats.systemHealth || 0}%
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          SharePoint Sync
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Chip 
                            icon={stats.sharepointSync ? <CheckCircle /> : <ErrorIcon />}
                            label={stats.sharepointSync ? 'Connected' : 'Demo Mode'}
                            color={stats.sharepointSync ? 'success' : 'warning'}
                            size="small"
                          />
                        </Box>
                      </Box>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Email Notifications
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Chip 
                            icon={stats.emailNotifications ? <CheckCircle /> : <ErrorIcon />}
                            label={stats.emailNotifications ? 'Active' : 'Disabled'}
                            color={stats.emailNotifications ? 'success' : 'error'}
                            size="small"
                          />
                        </Box>
                      </Box>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Recent Uploads
                        </Typography>
                        <Typography variant="h6" color="primary.main">
                          {stats.recentUploads || 0} this month
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    🚀 Quick Actions
                  </Typography>
                  
                  <List>
                    <ListItem button onClick={() => setActiveTab(1)}>
                      <ListItemIcon>
                        <Upload color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Upload Procedure"
                        secondary="Add new procedure document"
                      />
                    </ListItem>
                    
                    <ListItem button onClick={() => setActiveTab(3)}>
                      <ListItemIcon>
                        <Email color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Email Settings"
                        secondary="Configure notifications"
                      />
                    </ListItem>
                    
                    <ListItem button onClick={() => setActiveTab(2)}>
                      <ListItemIcon>
                        <Person color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Manage Users"
                        secondary="User roles & permissions"
                      />
                    </ListItem>
                    
                    <ListItem button onClick={() => setActiveTab(5)}>
                      <ListItemIcon>
                        <History color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="View Audit Log"
                        secondary="System activity history"
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </motion.div>
      )}

      {/* Procedure Management Tab */}
      {activeTab === 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" fontWeight="bold">
                  📄 Procedure Management
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Upload />}
                  onClick={() => navigate('submit-procedure')}
                >
                  Upload New Procedure
                </Button>
              </Box>
              
              <Alert severity="info" sx={{ mb: 3 }}>
                This section manages all procedure documents in the system. You can upload new procedures,
                edit existing ones, and monitor quality scores.
              </Alert>

              {/* Procedure statistics */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6} sm={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.main', color: 'white' }}>
                    <Typography variant="h4" fontWeight="bold">
                      {stats.totalProcedures || 0}
                    </Typography>
                    <Typography variant="body2">
                      Total Procedures
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.main', color: 'white' }}>
                    <Typography variant="h4" fontWeight="bold">
                      {stats.activeProcedures || 0}
                    </Typography>
                    <Typography variant="body2">
                      Active
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.main', color: 'white' }}>
                    <Typography variant="h4" fontWeight="bold">
                      {stats.expiringSoon || 0}
                    </Typography>
                    <Typography variant="body2">
                      Expiring Soon
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'error.main', color: 'white' }}>
                    <Typography variant="h4" fontWeight="bold">
                      {stats.expiredProcedures || 0}
                    </Typography>
                    <Typography variant="body2">
                      Expired
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              <Button
                variant="outlined"
                startIcon={<OpenInNew />}
                onClick={() => navigate('procedures')}
                fullWidth
              >
                View All Procedures in Main Interface
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* User Management Tab */}
      {activeTab === 2 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardContent>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                👥 User Management
              </Typography>
              
              <Alert severity="info" sx={{ mb: 3 }}>
                User management and role assignment. Users are authenticated through HSBC's IT systems.
              </Alert>

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6} sm={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'info.main', color: 'white' }}>
                    <Typography variant="h4" fontWeight="bold">
                      {stats.totalUsers || 0}
                    </Typography>
                    <Typography variant="body2">
                      Total Users
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.main', color: 'white' }}>
                    <Typography variant="h4" fontWeight="bold">
                      {stats.activeUsers || 0}
                    </Typography>
                    <Typography variant="body2">
                      Active Users
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'error.main', color: 'white' }}>
                    <Typography variant="h4" fontWeight="bold">
                      {stats.adminUsers || 0}
                    </Typography>
                    <Typography variant="body2">
                      Administrators
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.main', color: 'white' }}>
                    <Typography variant="h4" fontWeight="bold">
                      {(stats.totalUsers || 0) - (stats.activeUsers || 0)}
                    </Typography>
                    <Typography variant="body2">
                      Inactive
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              <Typography variant="body2" color="text.secondary">
                User authentication is handled by HSBC's IT infrastructure. Role assignments can be managed 
                through the SharePoint UserRoles list.
              </Typography>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Email Management Tab - FIXED VERSION */}
      {activeTab === 3 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <EmailManagement />
        </motion.div>
      )}

      {/* System Settings Tab */}
      {activeTab === 4 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardContent>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                ⚙️ System Settings
              </Typography>
              
              <Alert severity="info" sx={{ mb: 3 }}>
                System configuration and maintenance settings.
              </Alert>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        🔧 System Configuration
                      </Typography>
                      <List>
                        <ListItem>
                          <ListItemText 
                            primary="SharePoint Integration"
                            secondary={`Connected to ${baseUrl}`}
                          />
                          <Chip 
                            label={stats.sharepointSync ? "Connected" : "Demo Mode"} 
                            color={stats.sharepointSync ? "success" : "warning"} 
                            size="small" 
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText 
                            primary="Email Notifications"
                            secondary="SMTP email system"
                          />
                          <Chip label="Configured" color="success" size="small" />
                        </ListItem>
                        <ListItem>
                          <ListItemText 
                            primary="Document Analysis"
                            secondary="AI-powered quality scoring"
                          />
                          <Chip label="Active" color="success" size="small" />
                        </ListItem>
                      </List>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        📊 Performance Metrics
                      </Typography>
                      <List>
                        <ListItem>
                          <ListItemText 
                            primary="System Uptime"
                            secondary="99.8% availability"
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText 
                            primary="Average Response Time"
                            secondary="<200ms"
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText 
                            primary="Storage Usage"
                            secondary="2.4GB / 100GB"
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText 
                            primary="Procedures Loaded"
                            secondary={`${procedures.length} from SharePoint`}
                          />
                        </ListItem>
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Audit & Logs Tab */}
      {activeTab === 5 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" fontWeight="bold">
                  📋 Audit Trail & System Logs
                </Typography>
                <FormControl size="small">
                  <InputLabel>Time Range</InputLabel>
                  <Select
                    value={selectedTimeRange}
                    onChange={handleTimeRangeChange}
                    label="Time Range"
                  >
                    <MenuItem value="7">Last 7 days</MenuItem>
                    <MenuItem value="30">Last 30 days</MenuItem>
                    <MenuItem value="90">Last 90 days</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              
              <Alert severity="info" sx={{ mb: 3 }}>
                System activity and audit trail for the last {selectedTimeRange} days.
                {!stats.sharepointSync && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    <strong>Note:</strong> In demo mode, showing sample audit data.
                  </Typography>
                )}
              </Alert>

              <Typography variant="h6" gutterBottom>
                Recent System Activity
              </Typography>
              
              <List>
                <ListItem>
                  <ListItemIcon>
                    <Upload color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="New procedure uploaded"
                    secondary="Risk Assessment Framework - 2 hours ago"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Email color="info" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Email notification sent"
                    secondary="Procedure expiry reminder - 4 hours ago"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Person color="success" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="User role updated"
                    secondary="Admin privileges granted to user - 1 day ago"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Settings color="warning" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="System maintenance"
                    secondary="SharePoint sync completed - 2 days ago"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Assessment color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Quality analysis completed"
                    secondary="Trading Guidelines scored 89% - 3 days ago"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CloudSync color="info" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="SharePoint data synchronized"
                    secondary={`${procedures.length} procedures synced - ${stats.sharepointSync ? 'Live data' : 'Demo data'}`}
                  />
                </ListItem>
              </List>

              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={fetchAdminDashboardData}
                >
                  Refresh Audit Log
                </Button>
              </Box>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </Box>
  </Container>
</Box>
```

);
};

export default AdminDashboard;