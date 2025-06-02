// components/HSBCProceduresHub.js - Main Hub Component with Enhanced Data Loading
import React, { useState, useEffect } from 'react';
import {
  Box, Container, AppBar, Toolbar, IconButton, Typography,
  Avatar, Chip, Badge, useTheme, Skeleton, Grid, Alert
} from '@mui/material';
import {
  Menu as MenuIcon, Notifications
} from '@mui/icons-material';
import { useSharePoint } from '../SharePointContext';
import { useNavigation } from '../contexts/NavigationContext';
import NavigationDrawer from './NavigationDrawer';
import PageRouter from './PageRouter';
import { dataService } from '../services/dataService';

const HSBCProceduresHub = () => {
  const { user, isAuthenticated, isAdmin } = useSharePoint();
  const { currentPage } = useNavigation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [procedures, setProcedures] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiHealth, setApiHealth] = useState(null);
  const [error, setError] = useState(null);
  const theme = useTheme();

  useEffect(() => {
    if (user && isAuthenticated) {
      loadInitialData();
    }
  }, [user, isAuthenticated]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🚀 Loading initial data...');
      
      // Check API health first
      const health = await dataService.checkAPIHealth();
      setApiHealth(health);
      
      // Load procedures (with fallback to mock data)
      const procData = await dataService.fetchProcedures();
      setProcedures(procData);
      
      // Load dashboard data (with fallback to mock data)
      let dashData = await dataService.fetchDashboardData();
      
      // If we got procedures but no dashboard stats, calculate them
      if (procData && (!dashData.stats || !health.dashboard)) {
        const calculatedStats = dataService.calculateStats(procData);
        dashData = {
          ...dashData,
          stats: calculatedStats
        };
      }
      
      setDashboardData(dashData);
      
      console.log('✅ Initial data loaded successfully');
      console.log('📊 Procedures:', procData.length);
      console.log('📈 Dashboard stats:', dashData.stats);
      
    } catch (err) {
      console.error('❌ Error loading initial data:', err);
      setError('Failed to load data: ' + err.message);
      
      // Load mock data as fallback
      try {
        console.log('🔄 Loading fallback mock data...');
        setProcedures(dataService.mockProcedures);
        setDashboardData(dataService.mockDashboardData);
      } catch (mockError) {
        console.error('❌ Failed to load mock data:', mockError);
      }
    } finally {
      setLoading(false);
    }
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
            
            {/* API Status Indicator */}
            {apiHealth && (
              <Chip 
                label={apiHealth.overall ? 'API Connected' : 'Demo Mode'}
                size="small"
                color={apiHealth.overall ? 'success' : 'warning'}
                sx={{ 
                  ml: 2,
                  fontSize: '0.7rem',
                  height: 24
                }}
              />
            )}
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
          {/* API Status Alert */}
          {apiHealth && !apiHealth.overall && (
            <Alert 
              severity="info" 
              sx={{ mb: 3 }}
              onClose={() => setApiHealth(null)}
            >
              <Typography variant="body2">
                <strong>Demo Mode:</strong> Backend APIs are not available. 
                Displaying sample data for demonstration purposes.
                {!apiHealth.procedures && ' • Procedures API: Offline'}
                {!apiHealth.dashboard && ' • Dashboard API: Offline'}
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

          <PageRouter
            currentPage={currentPage}
            procedures={procedures}
            dashboardData={dashboardData}
            user={user}
            isAdmin={isAdmin}
            onDataRefresh={loadInitialData}
            apiHealth={apiHealth}
          />
        </Container>
      </Box>
    </Box>
  );
};

export default HSBCProceduresHub;