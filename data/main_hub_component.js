// components/HSBCProceduresHub.js - Main Hub Component
import React, { useState, useEffect } from 'react';
import {
  Box, Container, AppBar, Toolbar, IconButton, Typography,
  Avatar, Chip, Badge, useTheme, Skeleton, Grid
} from '@mui/material';
import {
  Menu as MenuIcon, Notifications
} from '@mui/icons-material';
import { useSharePoint } from '../SharePointContext';
import { useNavigation } from '../contexts/NavigationContext';
import NavigationDrawer from './NavigationDrawer';
import PageRouter from './PageRouter';

const HSBCProceduresHub = () => {
  const { user, isAuthenticated, isAdmin } = useSharePoint();
  const { currentPage } = useNavigation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [procedures, setProcedures] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();

  useEffect(() => {
    if (user && isAuthenticated) {
      loadInitialData();
    }
  }, [user, isAuthenticated]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Load procedures
      const procResponse = await fetch('/ProceduresHubEG6/api/procedures');
      if (procResponse.ok) {
        const procData = await procResponse.json();
        setProcedures(procData);
        console.log('✅ Procedures loaded:', procData.length);
      }

      // Load dashboard data
      const dashResponse = await fetch('/ProceduresHubEG6/api/user/dashboard');
      if (dashResponse.ok) {
        const dashData = await dashResponse.json();
        setDashboardData(dashData);
        console.log('✅ Dashboard data loaded');
      }
    } catch (err) {
      console.error('❌ Error loading data:', err);
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
        <Container maxWidth="lg" sx={{ pt: 4 }}>
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
          <PageRouter
            currentPage={currentPage}
            procedures={procedures}
            dashboardData={dashboardData}
            user={user}
            isAdmin={isAdmin}
            onDataRefresh={loadInitialData}
          />
        </Container>
      </Box>
    </Box>
  );
};

export default HSBCProceduresHub;