// components/HSBCProceduresHub.js - Using Your Existing SharePoint Service
import React, { useState, useEffect } from 'react';
import {
  Box, Container, AppBar, Toolbar, IconButton, Typography,
  Avatar, Chip, Badge, useTheme, Skeleton, Grid, Alert
} from '@mui/material';
import {
  Menu as MenuIcon, Notifications, CloudDone, CloudOff
} from '@mui/icons-material';
import { useSharePoint } from '../SharePointContext';
import { useNavigation } from '../contexts/NavigationContext';
import NavigationDrawer from './NavigationDrawer';
import PageRouter from './PageRouter';
import SharePointService from '../services/SharePointService'; // Your existing service

const HSBCProceduresHub = () => {
  const { user, isAuthenticated, isAdmin } = useSharePoint();
  const { currentPage } = useNavigation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [procedures, setProcedures] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sharePointAvailable, setSharePointAvailable] = useState(false);
  const [error, setError] = useState(null);
  const theme = useTheme();

  // Initialize SharePoint service
  const [spService] = useState(() => new SharePointService());

  useEffect(() => {
    if (user && isAuthenticated) {
      loadInitialData();
    }
  }, [user, isAuthenticated]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🚀 Loading data from SharePoint Lists...');
      
      // Check if SharePoint is available
      const spAvailable = spService.isSharePointAvailable();
      setSharePointAvailable(spAvailable);
      
      if (spAvailable) {
        console.log('✅ SharePoint environment detected');
        
        // Load procedures from SharePoint List
        const proceduresData = await spService.getProcedures();
        setProcedures(proceduresData);
        
        // Load dashboard summary from SharePoint
        const dashboardSummary = await spService.getDashboardSummary();
        
        // Get current user info
        const currentUser = spService.getCurrentUser();
        
        // Structure dashboard data
        const dashData = {
          stats: {
            total: dashboardSummary.total,
            expired: dashboardSummary.expired,
            expiringSoon: dashboardSummary.expiringSoon,
            highQuality: dashboardSummary.highQuality,
            averageScore: dashboardSummary.averageScore,
            sharePointUploaded: dashboardSummary.sharePointUploaded
          },
          byLOB: dashboardSummary.byLOB,
          userInfo: {
            displayName: currentUser.displayName,
            email: currentUser.email,
            staffId: currentUser.staffId,
            department: 'SharePoint User',
            jobTitle: 'Loaded from SharePoint'
          },
          recentActivity: await generateRecentActivity(proceduresData)
        };
        
        setDashboardData(dashData);
        
        console.log('✅ SharePoint data loaded successfully');
        console.log('📊 Procedures from SharePoint List:', proceduresData.length);
        console.log('📈 Dashboard stats:', dashData.stats);
        
      } else {
        console.log('⚠️ SharePoint not available, using mock data');
        await loadMockData();
      }
      
    } catch (err) {
      console.error('❌ Error loading SharePoint data:', err);
      setError('Failed to load data from SharePoint: ' + err.message);
      
      // Fallback to mock data
      try {
        console.log('🔄 Loading fallback mock data...');
        await loadMockData();
      } catch (mockError) {
        console.error('❌ Failed to load mock data:', mockError);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadMockData = async () => {
    // Mock data for development/demo
    const mockProcedures = [
      {
        id: 1,
        name: "Risk Assessment Framework",
        lob: "GRM",
        primary_owner: "John Smith",
        expiry: "2024-12-15",
        score: 92,
        status: "Active"
      },
      {
        id: 2,
        name: "Trading Compliance Guidelines",
        lob: "CIB", 
        primary_owner: "Sarah Johnson",
        expiry: "2024-07-20",
        score: 78,
        status: "Active"
      },
      {
        id: 3,
        name: "Client Onboarding Process",
        lob: "IWPB",
        primary_owner: "Mike Chen", 
        expiry: "2024-06-01",
        score: 85,
        status: "Active"
      }
    ];

    const mockStats = {
      total: 247,
      expired: 8,
      expiringSoon: 23,
      highQuality: 186,
      averageScore: 84
    };

    setProcedures(mockProcedures);
    setDashboardData({
      stats: mockStats,
      userInfo: {
        displayName: "Demo User",
        email: "demo@hsbc.com",
        department: "Development Environment"
      },
      recentActivity: await generateRecentActivity(mockProcedures)
    });
  };

  const generateRecentActivity = async (proceduresData) => {
    try {
      // Get recent audit log from SharePoint if available
      if (sharePointAvailable) {
        const auditLog = await spService.getAuditLog(5);
        return auditLog.map(log => ({
          id: log.id,
          action: log.action,
          procedure: log.details.procedureName || 'Unknown Procedure',
          time: getTimeAgo(log.timestamp),
          type: log.actionType.toLowerCase(),
          score: log.details.score || null
        }));
      }
    } catch (error) {
      console.warn('⚠️ Could not load audit log, generating mock activity');
    }

    // Generate mock activity from procedures
    return proceduresData.slice(0, 3).map((proc, index) => ({
      id: proc.id,
      action: getActivityAction(proc.status),
      procedure: proc.name,
      time: `${index + 1} hour${index !== 0 ? 's' : ''} ago`,
      type: 'update',
      score: proc.score
    }));
  };

  const getActivityAction = (status) => {
    switch (status) {
      case 'Expired': return 'Procedure expired';
      case 'Expiring': return 'Procedure expiring soon';
      default: return 'Procedure updated';
    }
  };

  const getTimeAgo = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Less than an hour ago';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
  };

  // Show loading while SharePoint context initializes
  if (!isAuthenticated) {
    return null; // SharePointProvider handles loading/error states
  }

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#f5f6fa' }}>
        {/* Loading Header */}
        <AppBar position="fixed" sx={{ 
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)'
        }}>
          <Toolbar>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
              <Box sx={{
                width: 60, height: 30,
                background: 'linear-gradient(135deg, #d40000, #b30000)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '12px',
                borderRadius: 1
              }}>
                HSBC
              </Box>
              <Typography variant="h6" component="div" color="white">
                Procedures Hub
              </Typography>
              <Chip 
                label="Loading SharePoint..."
                size="small"
                color="info"
                sx={{ ml: 2, fontSize: '0.7rem', height: 24 }}
              />
            </Box>
          </Toolbar>
        </AppBar>

        {/* Loading Content */}
        <Container maxWidth="lg" sx={{ pt: 12 }}>
          <Skeleton variant="text" width="60%" height={60} sx={{ mb: 2 }} />
          <Skeleton variant="text" width="40%" height={30} sx={{ mb: 4 }} />
          
          <Grid container spacing={3}>
            {[1, 2, 3, 4].map(n => (
              <Grid item xs={12} sm={6} md={3} key={n}>
                <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f6fa' }}>
      {/* Professional App Bar */}
      <AppBar position="fixed" sx={{ 
        zIndex: theme.zIndex.drawer + 1,
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)'
      }}>
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setDrawerOpen(!drawerOpen)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
            <Box sx={{
              width: 60, height: 30,
              background: 'linear-gradient(135deg, #d40000, #b30000)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '12px',
              borderRadius: 1
            }}>
              HSBC
            </Box>
            <Typography variant="h6" component="div">
              Procedures Hub
            </Typography>
            
            {/* SharePoint Status Indicator */}
            <Chip 
              icon={sharePointAvailable ? <CloudDone /> : <CloudOff />}
              label={sharePointAvailable ? 'SharePoint Connected' : 'Demo Mode'}
              size="small"
              color={sharePointAvailable ? 'success' : 'warning'}
              sx={{ 
                ml: 2,
                fontSize: '0.7rem',
                height: 24
              }}
            />
          </Box>

          {user && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Badge badgeContent={dashboardData?.stats?.expiringSoon || 0} color="error">
                <Notifications />
              </Badge>
              <Chip 
                avatar={<Avatar sx={{ bgcolor: '#d40000' }}>{user.displayName?.[0] || 'U'}</Avatar>}
                label={user.displayName || user.staffId}
                variant="outlined"
                sx={{ color: 'white', borderColor: 'white' }}
              />
              <Chip 
                label={user.role || 'User'}
                size="small"
                sx={{ 
                  bgcolor: user.role === 'admin' ? '#f44336' : 'rgba(255,255,255,0.2)',
                  color: 'white'
                }}
              />
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* Navigation Drawer */}
      <NavigationDrawer 
        open={drawerOpen} 
        onClose={() => setDrawerOpen(false)}
        user={user}
        isAdmin={isAdmin}
      />

      {/* Main Content */}
      <Box component="main" sx={{ 
        flexGrow: 1, 
        pt: 8, 
        minHeight: '100vh'
      }}>
        <Container maxWidth="xl" sx={{ py: 3 }}>
          {/* SharePoint Status Alert */}
          {!sharePointAvailable && (
            <Alert 
              severity="info" 
              sx={{ mb: 3 }}
              onClose={() => {}}
            >
              <Typography variant="body2">
                <strong>Demo Mode:</strong> SharePoint Lists are not available in this environment. 
                Displaying sample data for demonstration purposes.
              </Typography>
            </Alert>
          )}

          {/* Error Alert */}
          {error && (
            <Alert 
              severity="warning" 
              sx={{ mb: 3 }}
              onClose={() => setError(null)}
            >
              <Typography variant="body2">
                {error}
              </Typography>
            </Alert>
          )}

          {/* SharePoint Success Alert */}
          {sharePointAvailable && procedures.length > 0 && (
            <Alert 
              severity="success" 
              sx={{ mb: 3 }}
              onClose={() => {}}
            >
              <Typography variant="body2">
                <strong>SharePoint Connected:</strong> Successfully loaded {procedures.length} procedures from SharePoint Lists.
              </Typography>
            </Alert>
          )}

          <PageRouter
            currentPage={currentPage}
            procedures={procedures}
            dashboardData={dashboardData}
            user={user}
            isAdmin={isAdmin}
            onDataRefresh={loadInitialData}
            sharePointService={spService}
            sharePointAvailable={sharePointAvailable}
          />
        </Container>
      </Box>
    </Box>
  );
};

export default HSBCProceduresHub;
