// components/HSBCProceduresHub.js - FIXED VERSION
import React, { useState, useEffect } from 'react';
import {
  Box, Container, AppBar, Toolbar, IconButton, Typography,
  Avatar, Chip, Badge, useTheme, Skeleton, Grid, Alert,
  Menu, MenuItem, ListItemIcon, ListItemText, Divider,
  Stack, Paper, alpha, styled, keyframes, Tooltip
} from '@mui/material';
import {
  Menu as MenuIcon, Notifications, ArrowBack, AccountCircle,
  Warning, Schedule, CheckCircle, Assignment, Error as ErrorIcon,
  CloudDone, CloudOff, Settings, Search, TrendingUp, Star,
  History, ArrowForward
} from '@mui/icons-material';
// ❌ REMOVED: duplicate styled import
// ✅ USING: styled from @mui/material already imported above
import { motion, AnimatePresence } from 'framer-motion';
import { useSharePoint } from '../SharePointContext';
import { useNavigation } from '../contexts/NavigationContext';
import NavigationDrawer from './NavigationDrawer';
import PageRouter from './PageRouter';

// 🎨 **HSBC Brand Colors & Animations**
const HSBCColors = {
  primary: '#DB0011',
  secondary: '#9FA1A4',
  gradients: {
    redPrimary: 'linear-gradient(135deg, #DB0011 0%, #B50010 50%, #8B000C 100%)',
    darkMatter: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #404040 100%)',
    glassMorphism: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
    premiumGold: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FF8C00 100%)',
    modernBlue: 'linear-gradient(135deg, #2196f3 0%, #1976d2 50%, #1565c0 100%)'
  }
};

// 🌟 **Advanced Animations**
const pulseGlow = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 rgba(219, 0, 17, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(219, 0, 17, 0); }
`;

const slideInFromTop = keyframes`
  0% { transform: translateY(-100%); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
`;

const floatBadge = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-2px) rotate(2deg); }
`;

const shimmerEffect = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const rotateHexagon = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

// 🎨 **FIXED STYLED COMPONENTS**
const GlassmorphismAppBar = styled(AppBar)(({ theme }) => ({
  background: 'linear-gradient(135deg, rgba(26,26,26,0.95) 0%, rgba(45,45,45,0.9) 100%)',
  backdropFilter: 'blur(20px)',
  borderBottom: '1px solid rgba(255,255,255,0.1)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
}));

// ✅ FIXED: Remove duplicate HSBCHexagonLogo definition
const HSBCHexagonLogo = styled(Box)(({ theme, size = 60 }) => ({
  width: size,
  height: size,
  background: HSBCColors.gradients.redPrimary,
  clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  '&::after': {
    content: '""',
    position: 'absolute',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(45deg, rgba(255,255,255,0.3) 0%, transparent 100%)',
    clipPath: 'inherit',
    transition: 'all 0.3s ease'
  },
  '&:hover': {
    animation: `${rotateHexagon} 2s ease-in-out`,
    transform: 'scale(1.1)',
    '&::after': {
      background: 'linear-gradient(45deg, rgba(255,255,255,0.5) 0%, transparent 100%)'
    }
  }
}));

const HSBCProceduresHub = () => {
  const { user, isAuthenticated, isAdmin, isUploader } = useSharePoint();
  const { currentPage, navigate } = useNavigation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [procedures, setProcedures] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sharePointAvailable, setSharePointAvailable] = useState(false);
  const [error, setError] = useState(null);
  
  // 🔔 **Notifications State**
  const [notifications, setNotifications] = useState([]);
  const [notificationAnchor, setNotificationAnchor] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const theme = useTheme();

  // Helper functions
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Invalid Date';
    }
  };

  // 🎯 **SharePoint API Configuration**
  const getSharePointConfig = () => {
    return {
      proceduresUrl: 'https://teams.global.hsbc/sites/EmployeeEng/_api/web/lists/getbytitle(\'Procedures\')/items?' +
        '$select=Id,Title,Created,Modified,AuthorId,EditorId,' +
        'ExpiryDate,PrimaryOwner,PrimaryOwnerEmail,SecondaryOwner,SecondaryOwnerEmail,' +
        'LOB,ProcedureSubsection,QualityScore,OriginalFilename,FileSize,' +
        'UploadedBy,UploadedAt,Status,AnalysisDetails,AIRecommendations,' +
        'RiskRating,PeriodicReview,DocumentOwners,FoundElements,DocumentLink,SignOffDate&' +
        '$orderby=Modified%20desc&' +
        '$top=1000',
      
      dashboardUrl: 'https://teams.global.hsbc/sites/EmployeeEng/_api/web/lists/getbytitle(\'DashboardSummary\')/items?$select=*&$top=1',
      baseUrl: 'https://teams.global.hsbc/sites/EmployeeEng'
    };
  };

  const getHeaders = () => {
    return {
      'Accept': 'application/json; odata=verbose',
      'Content-Type': 'application/json; odata=verbose'
    };
  };

  const safeJsonParse = (jsonString, defaultValue = {}) => {
    try {
      return jsonString ? JSON.parse(jsonString) : defaultValue;
    } catch (error) {
      console.warn('⚠️ JSON parse error:', error);
      return defaultValue;
    }
  };

  useEffect(() => {
    if (user && isAuthenticated) {
      loadInitialData();
    }
  }, [user, isAuthenticated]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🚀 Loading data from SharePoint...');
      const config = getSharePointConfig();
      
      try {
        console.log('📋 Fetching procedures...');
        
        const procResponse = await fetch(config.proceduresUrl, {
          method: 'GET',
          headers: getHeaders(),
          credentials: 'include'
        });

        if (procResponse.ok) {
          const procData = await procResponse.json();
          console.log('📋 SharePoint data:', procData);
          
          const mappedProcedures = procData.d.results.map(item => ({
            id: item.Id,
            name: item.Title,
            lob: item.LOB || 'Unknown',
            procedure_subsection: item.ProcedureSubsection || '',
            status: item.Status || 'Active',
            uploaded_on: item.UploadedAt || item.Created || new Date().toISOString(),
            last_modified_on: item.Modified || new Date().toISOString(),
            expiry: item.ExpiryDate || new Date().toISOString(),
            sign_off_date: item.SignOffDate || null,
            primary_owner: item.PrimaryOwner || 'Unknown',
            primary_owner_email: item.PrimaryOwnerEmail || '',
            secondary_owner: item.SecondaryOwner || '',
            secondary_owner_email: item.SecondaryOwnerEmail || '',
            uploaded_by: item.UploadedBy || 'Unknown',
            author_id: item.AuthorId || null,
            editor_id: item.EditorId || null,
            document_link: item.DocumentLink || '',
            sharepoint_url: item.DocumentLink || '',
            original_filename: item.OriginalFilename || '',
            file_size: item.FileSize || 0,
            risk_rating: item.RiskRating || 'Medium',
            periodic_review: item.PeriodicReview || 'Annual',
            score: item.QualityScore || 0,
            analysis_details: item.AnalysisDetails,
            ai_recommendations: item.AIRecommendations,
            found_elements: item.FoundElements,
            document_owners: item.DocumentOwners,
            sharepoint_uploaded: true,
            sharepoint_id: item.Id,
            file_link: item.DocumentLink || ''
          }));
          
          setProcedures(mappedProcedures);
          setSharePointAvailable(true);
          
          console.log('✅ Procedures loaded:', mappedProcedures.length);
          setTimeout(() => loadNotifications(mappedProcedures), 500);
          
        } else {
          console.log('⚠️ SharePoint not accessible');
          setSharePointAvailable(false);
          loadMockData();
        }
      } catch (procError) {
        console.error('❌ Error fetching procedures:', procError);
        setSharePointAvailable(false);
        loadMockData();
      }

      generateDashboardFromProcedures();
      
    } catch (err) {
      console.error('❌ Error loading data:', err);
      setError('Failed to load data: ' + err.message);
      setSharePointAvailable(false);
      loadMockData();
    } finally {
      setLoading(false);
    }
  };

  const generateDashboardFromProcedures = () => {
    if (procedures.length === 0) return;
    
    const now = new Date();
    const stats = {
      total: procedures.length,
      expired: procedures.filter(p => new Date(p.expiry) < now).length,
      expiringSoon: procedures.filter(p => {
        const expiry = new Date(p.expiry);
        const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
        return daysLeft > 0 && daysLeft <= 30;
      }).length,
      highQuality: procedures.filter(p => (p.score || 0) >= 80).length,
      averageScore: procedures.length > 0 ? 
        Math.round(procedures.reduce((sum, p) => sum + (p.score || 0), 0) / procedures.length) : 0
    };

    setDashboardData({
      stats,
      userInfo: {
        displayName: user?.displayName || 'SharePoint User',
        email: user?.email || 'user@hsbc.com',
        department: 'Calculated from SharePoint data',
        jobTitle: user?.role || 'User'
      }
    });
  };

  const loadNotifications = (proceduresList = procedures) => {
    try {
      console.log('🔔 Generating notifications...');
      
      const now = new Date();
      const notificationsList = [];
      
      if (proceduresList && proceduresList.length > 0) {
        const expiring = proceduresList.filter(p => {
          const expiry = new Date(p.expiry);
          const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
          return daysLeft > 0 && daysLeft <= 30;
        });

        const expired = proceduresList.filter(p => new Date(p.expiry) < now);

        expiring.forEach(proc => {
          const daysLeft = Math.ceil((new Date(proc.expiry) - now) / (1000 * 60 * 60 * 24));
          notificationsList.push({
            id: `expiring-${proc.id}`,
            type: 'warning',
            icon: <Schedule />,
            title: `Procedure Expiring Soon`,
            message: `"${proc.name}" expires in ${daysLeft} days`,
            timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
            priority: daysLeft <= 7 ? 'high' : 'medium',
            procedureId: proc.id
          });
        });

        expired.forEach(proc => {
          const daysOverdue = Math.ceil((now - new Date(proc.expiry)) / (1000 * 60 * 60 * 24));
          notificationsList.push({
            id: `expired-${proc.id}`,
            type: 'error',
            icon: <ErrorIcon />,
            title: `Procedure Expired`,
            message: `"${proc.name}" expired ${daysOverdue} days ago`,
            timestamp: new Date(proc.expiry),
            priority: 'high',
            procedureId: proc.id
          });
        });
      }

      if (isAdmin) {
        notificationsList.push({
          id: 'system-1',
          type: 'success',
          icon: <CheckCircle />,
          title: 'SharePoint Integration',
          message: sharePointAvailable ? 
            'SharePoint connection is active' : 
            'Running in demo mode',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          priority: 'low'
        });
      }

      const sortedNotifications = notificationsList.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return new Date(b.timestamp) - new Date(a.timestamp);
      });

      setNotifications(sortedNotifications);
      setUnreadCount(sortedNotifications.filter(n => n.priority === 'high').length);
      
    } catch (err) {
      console.error('❌ Error generating notifications:', err);
    }
  };

  const loadMockData = () => {
    console.log('📝 Loading mock data...');
    
    const mockProcedures = [
      {
        id: 1,
        name: "Risk Assessment Framework",
        lob: "IWPB",
        primary_owner: "John Smith",
        primary_owner_email: "john.smith@hsbc.com",
        uploaded_by: "Michael Chen",
        uploaded_on: "2024-05-15T10:30:00Z",
        expiry: "2024-07-15",
        score: 92,
        risk_rating: "High",
        status: "Active",
        file_link: "https://sharepoint.hsbc.com/procedures/risk-framework.pdf"
      },
      {
        id: 2,
        name: "Trading Compliance Guidelines", 
        lob: "CIB",
        primary_owner: "Sarah Johnson",
        primary_owner_email: "sarah.johnson@hsbc.com",
        uploaded_by: "David Park",
        uploaded_on: "2024-04-20T16:45:00Z",
        expiry: "2024-05-20",
        score: 45,
        risk_rating: "Medium",
        status: "Active",
        file_link: "https://sharepoint.hsbc.com/procedures/trading-compliance.pdf"
      }
    ];

    setProcedures(mockProcedures);
    
    setDashboardData({
      stats: {
        total: 2,
        expiringSoon: 1,
        expired: 1,
        highQuality: 1,
        averageScore: 68
      },
      userInfo: {
        displayName: user?.displayName || "Demo User",
        email: user?.email || "demo@hsbc.com",
        department: "Development Environment"
      }
    });
    
    setTimeout(() => loadNotifications(mockProcedures), 100);
  };

  const handleNotificationClick = (event) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  const handleNotificationItemClick = (notification) => {
    if (notification.procedureId) {
      navigate('procedures', { highlightId: notification.procedureId });
    }
    handleNotificationClose();
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'error': return '#f44336';
      case 'warning': return '#ff9800';
      case 'success': return '#4caf50';
      default: return '#2196f3';
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = Math.floor((now - new Date(timestamp)) / 1000);
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#f5f6fa' }}>
        <GlassmorphismAppBar position="fixed">
          <Toolbar>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
              <HSBCHexagonLogo size={40}>
                <Typography variant="caption" fontWeight={900} color="white" sx={{ fontSize: '10px' }}>
                  HBEG
                </Typography>
              </HSBCHexagonLogo>
              
              <Stack>
                <Typography variant="h6" component="div" color="white" fontWeight={800}>
                  Procedures Hub
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                  Loading SharePoint Data...
                </Typography>
              </Stack>
            </Box>
          </Toolbar>
        </GlassmorphismAppBar>

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
      <GlassmorphismAppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
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
            <HSBCHexagonLogo size={40}>
              <Typography variant="caption" fontWeight={900} color="white" sx={{ fontSize: '11px' }}>
                HBEG
              </Typography>
            </HSBCHexagonLogo>
            
            <Box>
              <Typography variant="h6" component="div" color="white" fontWeight={800}>
                Procedures Hub
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                Next-Generation Document Management
              </Typography>
            </Box>
            
            <Chip 
              icon={sharePointAvailable ? <CloudDone /> : <CloudOff />}
              label={sharePointAvailable ? 'SharePoint Connected' : 'Demo Mode'}
              size="small"
              sx={{
                ml: 2,
                background: sharePointAvailable 
                  ? 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)'
                  : 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
                color: 'white',
                fontWeight: 700,
                border: 'none'
              }}
            />
          </Box>

          {user && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton
                color="inherit"
                onClick={handleNotificationClick}
              >
                <Badge badgeContent={unreadCount} color="error">
                  <Notifications />
                </Badge>
              </IconButton>

              <Chip 
                avatar={<Avatar sx={{ bgcolor: '#d40000' }}>{user.displayName?.[0] || 'U'}</Avatar>}
                label={user.displayName || user.staffId}
                sx={{ 
                  color: 'white',
                  borderColor: 'white'
                }}
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
      </GlassmorphismAppBar>

      <Menu
        anchorEl={notificationAnchor}
        open={Boolean(notificationAnchor)}
        onClose={handleNotificationClose}
        PaperProps={{
          sx: {
            width: 420,
            maxHeight: 550,
            overflow: 'auto',
            background: 'linear-gradient(135deg, rgba(26,26,26,0.95) 0%, rgba(45,45,45,0.9) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '20px'
          }
        }}
      >
        <Box sx={{ p: 3, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <Typography variant="h6" fontWeight="bold" color="white">
            Notifications
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            {notifications.length} total • {unreadCount} high priority
          </Typography>
        </Box>

        {notifications.length === 0 ? (
          <MenuItem sx={{ py: 6 }}>
            <Box sx={{ textAlign: 'center', width: '100%' }}>
              <CheckCircle sx={{ fontSize: 64, color: '#4caf50', mb: 2 }} />
              <Typography variant="h6" color="white" fontWeight={700}>
                All caught up! 🎉
              </Typography>
            </Box>
          </MenuItem>
        ) : (
          notifications.slice(0, 10).map((notification) => (
            <MenuItem
              key={notification.id}
              onClick={() => handleNotificationItemClick(notification)}
              sx={{ 
                borderLeft: `4px solid ${getNotificationColor(notification.type)}`,
                py: 2,
                px: 3,
                '&:hover': {
                  background: `${alpha(getNotificationColor(notification.type), 0.1)}`
                }
              }}
            >
              <ListItemIcon sx={{ color: getNotificationColor(notification.type) }}>
                {notification.icon}
              </ListItemIcon>
              <ListItemText
                sx={{ color: 'white' }}
                primary={notification.title}
                secondary={
                  <Box>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                      {notification.message}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                      {formatTimeAgo(notification.timestamp)}
                    </Typography>
                  </Box>
                }
              />
            </MenuItem>
          ))
        )}
      </Menu>

      <NavigationDrawer 
        open={drawerOpen} 
        onClose={() => setDrawerOpen(false)}
        user={user}
        isAdmin={isAdmin}
        isUploader={isUploader}
        procedures={procedures}
        dashboardData={dashboardData}
      />

      <Box component="main" sx={{ flexGrow: 1, pt: 8, minHeight: '100vh' }}>
        <Container maxWidth="xl" sx={{ py: 3 }}>
          {!sharePointAvailable && (
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>Demo Mode:</strong> SharePoint connection not available. 
                Displaying sample data matching your SharePoint list structure.
              </Typography>
            </Alert>
          )}

          {sharePointAvailable && procedures.length > 0 && (
            <Alert severity="success" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>SharePoint Connected:</strong> Successfully loaded {procedures.length} procedures.
              </Typography>
            </Alert>
          )}

          {error && (
            <Alert severity="warning" sx={{ mb: 3 }} onClose={() => setError(null)}>
              <Typography variant="body2">{error}</Typography>
            </Alert>
          )}

          <PageRouter
            currentPage={currentPage}
            procedures={procedures}
            dashboardData={dashboardData}
            user={user}
            isAdmin={isAdmin}
            isUploader={isUploader}
            onDataRefresh={loadInitialData}
            sharePointAvailable={sharePointAvailable}
            notifications={notifications}
          />
        </Container>
      </Box>
    </Box>
  );
};

export default HSBCProceduresHub;
