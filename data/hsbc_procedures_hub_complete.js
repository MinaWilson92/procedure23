// components/HSBCProceduresHub.js - Fixed with Your Exact SharePoint Fields
import React, { useState, useEffect } from 'react';
import {
  Box, Container, AppBar, Toolbar, IconButton, Typography,
  Avatar, Chip, Badge, useTheme, Skeleton, Grid, Alert,
  Menu, MenuItem, ListItemIcon, ListItemText, Divider
} from '@mui/material';
import {
  Menu as MenuIcon, Notifications, ArrowBack, AccountCircle,
  Warning, Schedule, CheckCircle, Assignment, Error as ErrorIcon,
  CloudDone, CloudOff
} from '@mui/icons-material';
import { useSharePoint } from '../SharePointContext';
import { useNavigation } from '../contexts/NavigationContext';
import NavigationDrawer from './NavigationDrawer';
import PageRouter from './PageRouter';

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

  // 🎯 **CORRECTED: SharePoint API Configuration Using Your Exact Fields**
  const getSharePointConfig = () => {
    return {
      // ✅ USING ONLY YOUR EXACT SHAREPOINT FIELDS
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

  // 🔧 **HELPER METHODS**
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

  // 🎯 **CORRECTED: Load Data with Your Exact SharePoint Field Mapping**
  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🚀 Loading data from SharePoint with correct fields...');
      const config = getSharePointConfig();
      
      // 📋 **Load Procedures from SharePoint List with Correct Fields**
      try {
        console.log('📋 Fetching procedures from SharePoint...');
        console.log('Correct API URL:', config.proceduresUrl);
        
        const procResponse = await fetch(config.proceduresUrl, {
          method: 'GET',
          headers: getHeaders(),
          credentials: 'include'
        });

        console.log('📋 Response status:', procResponse.status);

        if (procResponse.ok) {
          const procData = await procResponse.json();
          console.log('📋 Raw SharePoint data with correct fields:', procData);
          
          // 🎯 **CORRECTED FIELD MAPPING - Using Your Exact SharePoint Fields**
          const mappedProcedures = procData.d.results.map(item => ({
            // Basic Procedure Information
            id: item.Id,
            name: item.Title,
            lob: item.LOB || 'Unknown',
            procedure_subsection: item.ProcedureSubsection || '',
            status: item.Status || 'Active',
            
            // 📅 **DATES - Using Your Exact Date Fields**
            uploaded_on: item.UploadedAt || item.Created || new Date().toISOString(),
            last_modified_on: item.Modified || new Date().toISOString(),
            expiry: item.ExpiryDate || new Date().toISOString(),
            sign_off_date: item.SignOffDate || null,
            
            // 👥 **PROCEDURE OWNERS - Using Your Exact Owner Fields**
            primary_owner: item.PrimaryOwner || 'Unknown',
            primary_owner_email: item.PrimaryOwnerEmail || '',
            secondary_owner: item.SecondaryOwner || '',
            secondary_owner_email: item.SecondaryOwnerEmail || '',
            
            // 👤 **UPLOADED BY - Using Your UploadedBy Field**
            uploaded_by: item.UploadedBy || 'Unknown',
            uploaded_by_email: '', // Can be enhanced later
            
            // 🔄 **SYSTEM FIELDS**
            author_id: item.AuthorId || null,
            editor_id: item.EditorId || null,
            last_modified_by: 'SharePoint User', // Can be enhanced later
            
            // 🔗 **DOCUMENT LINK - Using Your DocumentLink Field**
            document_link: item.DocumentLink || '',
            sharepoint_url: item.DocumentLink || '', // Same as document link
            procedure_url: item.DocumentLink || '',   // Same as document link
            original_filename: item.OriginalFilename || '',
            file_size: item.FileSize || 0,
            
            // ⚠️ **RISK RATING - Using Your RiskRating Field**
            risk_rating: item.RiskRating || 'Medium',
            
            // 📊 **PERIODIC REVIEW - Using Your PeriodicReview Field**  
            periodic_review: item.PeriodicReview || 'Annual',
            
            // ⭐ **DOCUMENT QUALITY SCORE - Using Your QualityScore Field**
            score: item.QualityScore || 0,
            
            // 🔍 **AI ANALYSIS DATA - Using Your Exact Analysis Fields**
            analysis_details: item.AnalysisDetails,
            ai_recommendations: item.AIRecommendations,
            found_elements: item.FoundElements, // Using your FoundElements field
            document_owners: item.DocumentOwners,
            
            // 🔧 **TECHNICAL FIELDS**
            sharepoint_uploaded: true, // Since it's in SharePoint
            sharepoint_id: item.Id,
            
            // 📱 **UI HELPER FIELDS**
            file_link: item.DocumentLink || '',
            owner_display: item.PrimaryOwner || 'Unknown'
          }));
          
          setProcedures(mappedProcedures);
          setSharePointAvailable(true);
          
          console.log('✅ Procedures loaded from SharePoint with correct fields:', mappedProcedures.length);
          console.log('📊 Sample procedure data:', mappedProcedures[0]);
          
          // Load notifications after procedures are loaded
          setTimeout(() => loadNotifications(mappedProcedures), 500);
          
        } else {
          const errorText = await procResponse.text();
          console.log('⚠️ SharePoint procedures not accessible (status:', procResponse.status, ')');
          console.log('Error details:', errorText);
          setSharePointAvailable(false);
          loadMockData();
        }
      } catch (procError) {
        console.error('❌ Error fetching procedures:', procError);
        setSharePointAvailable(false);
        loadMockData();
      }

      // 📊 **Load Dashboard Data from SharePoint (Optional)**
      try {
        console.log('📊 Fetching dashboard data from SharePoint...');
        
        const dashResponse = await fetch(config.dashboardUrl, {
          method: 'GET',
          headers: getHeaders(),
          credentials: 'include'
        });

        if (dashResponse.ok) {
          const dashData = await dashResponse.json();
          console.log('📊 Dashboard data from SharePoint:', dashData);
          
          if (dashData.d.results.length > 0) {
            const dashboardItem = dashData.d.results[0];
            setDashboardData({
              stats: {
                total: dashboardItem.TotalProcedures || procedures.length,
                expired: dashboardItem.ExpiredProcedures || 0,
                expiringSoon: dashboardItem.ExpiringSoonProcedures || 0,
                highQuality: dashboardItem.HighQualityProcedures || 0,
                averageScore: dashboardItem.AverageQualityScore || 0
              },
              userInfo: {
                displayName: user?.displayName || 'SharePoint User',
                email: user?.email || 'user@hsbc.com',
                department: 'Loaded from SharePoint',
                jobTitle: user?.role || 'User'
              }
            });
          } else {
            // Calculate dashboard data from procedures
            generateDashboardFromProcedures();
          }
        } else {
          console.log('⚠️ Dashboard data not available, calculating from procedures');
          generateDashboardFromProcedures();
        }
      } catch (dashError) {
        console.log('⚠️ Dashboard endpoint not available, calculating from procedures');
        generateDashboardFromProcedures();
      }
      
    } catch (err) {
      console.error('❌ Error loading initial data:', err);
      setError('Failed to load data from SharePoint: ' + err.message);
      setSharePointAvailable(false);
      loadMockData();
    } finally {
      setLoading(false);
    }
  };

  // 📊 **Generate Dashboard Data from Procedures**
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

    console.log('📊 Dashboard stats calculated:', stats);
  };

  // 🔔 **Load Notifications from Procedures Data**
  const loadNotifications = (proceduresList = procedures) => {
    try {
      console.log('🔔 Generating notifications from procedures...');
      
      const now = new Date();
      const notificationsList = [];
      
      if (proceduresList && proceduresList.length > 0) {
        // Expiring procedures
        const expiring = proceduresList.filter(p => {
          const expiry = new Date(p.expiry);
          const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
          return daysLeft > 0 && daysLeft <= 30;
        });

        // Expired procedures
        const expired = proceduresList.filter(p => new Date(p.expiry) < now);

        // Low quality procedures
        const lowQuality = proceduresList.filter(p => (p.score || 0) < 60);

        // Create notification objects
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

        lowQuality.forEach(proc => {
          notificationsList.push({
            id: `quality-${proc.id}`,
            type: 'info',
            icon: <Assignment />,
            title: `Low Quality Score`,
            message: `"${proc.name}" has ${proc.score}% quality score`,
            timestamp: new Date(proc.uploaded_on || Date.now()),
            priority: 'low',
            procedureId: proc.id
          });
        });
      }

      // Add system notifications
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

      // Sort by priority and timestamp
      const sortedNotifications = notificationsList.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return new Date(b.timestamp) - new Date(a.timestamp);
      });

      setNotifications(sortedNotifications);
      setUnreadCount(sortedNotifications.filter(n => n.priority === 'high').length);
      
      console.log('✅ Notifications generated:', sortedNotifications.length);
      
    } catch (err) {
      console.error('❌ Error generating notifications:', err);
    }
  };

  // 📝 **Load Mock Data for Demo - Updated with Correct Fields**
  const loadMockData = () => {
    console.log('📝 Loading mock data matching SharePoint fields...');
    
    const mockProcedures = [
      {
        id: 1,
        name: "Risk Assessment Framework",
        lob: "IWPB",
        primary_owner: "John Smith",
        primary_owner_email: "john.smith@hsbc.com",
        secondary_owner: "Sarah Johnson",
        secondary_owner_email: "sarah.johnson@hsbc.com",
        uploaded_by: "Michael Chen",
        uploaded_on: "2024-05-15T10:30:00Z",
        last_modified_on: "2024-06-10T14:20:00Z",
        expiry: "2024-07-15", // Expiring soon
        score: 92,
        risk_rating: "High",
        periodic_review: "Annual",
        sign_off_date: "2024-05-20T09:00:00Z",
        document_link: "https://sharepoint.hsbc.com/sites/procedures/risk-framework.pdf",
        sharepoint_url: "https://sharepoint.hsbc.com/sites/procedures/risk-framework.pdf",
        procedure_url: "https://sharepoint.hsbc.com/sites/procedures/risk-framework.pdf",
        original_filename: "HSBC_Risk_Assessment_Framework_v2.1.pdf",
        file_size: 2450000,
        status: "Active",
        file_link: "https://sharepoint.hsbc.com/sites/procedures/risk-framework.pdf"
      },
      {
        id: 2,
        name: "Trading Compliance Guidelines", 
        lob: "CIB",
        primary_owner: "Sarah Johnson",
        primary_owner_email: "sarah.johnson@hsbc.com",
        uploaded_by: "David Park",
        uploaded_on: "2024-04-20T16:45:00Z",
        expiry: "2024-05-20", // Expired
        score: 45, // Low quality
        risk_rating: "Medium",
        periodic_review: "Semi-Annual",
        sign_off_date: "2024-04-25T11:30:00Z",
        document_link: "https://sharepoint.hsbc.com/sites/procedures/trading-compliance.pdf",
        sharepoint_url: "https://sharepoint.hsbc.com/sites/procedures/trading-compliance.pdf",
        procedure_url: "https://sharepoint.hsbc.com/sites/procedures/trading-compliance.pdf",
        original_filename: "Trading_Compliance_Guidelines_v1.3.pdf",
        file_size: 1800000,
        status: "Active",
        file_link: "https://sharepoint.hsbc.com/sites/procedures/trading-compliance.pdf"
      },
      {
        id: 3,
        name: "Client Onboarding Process",
        lob: "GCOO",
        primary_owner: "Mike Chen",
        primary_owner_email: "mike.chen@hsbc.com",
        uploaded_by: "Lisa Wang",
        uploaded_on: "2024-03-10T09:15:00Z",
        expiry: "2025-03-15",
        score: 88,
        risk_rating: "Low",
        periodic_review: "Annual",
        sign_off_date: "2024-03-15T14:00:00Z",
        document_link: "https://sharepoint.hsbc.com/sites/procedures/client-onboarding.pdf",
        sharepoint_url: "https://sharepoint.hsbc.com/sites/procedures/client-onboarding.pdf",
        procedure_url: "https://sharepoint.hsbc.com/sites/procedures/client-onboarding.pdf",
        original_filename: "Client_Onboarding_Process_v3.0.pdf",
        file_size: 3200000,
        status: "Active",
        file_link: "https://sharepoint.hsbc.com/sites/procedures/client-onboarding.pdf"
      }
    ];

    setProcedures(mockProcedures);
    
    const mockStats = {
      total: 3,
      expiringSoon: 1,
      expired: 1,
      highQuality: 2,
      averageScore: 75
    };

    setDashboardData({
      stats: mockStats,
      userInfo: {
        displayName: user?.displayName || "Demo User",
        email: user?.email || "demo@hsbc.com",
        department: "Development Environment",
        jobTitle: "Demo Mode"
      }
    });
    
    // Load notifications for mock data
    setTimeout(() => loadNotifications(mockProcedures), 100);
  };

  // 🔔 **Notification Handlers**
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
              {/* HBEG Branding */}
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
                HBEG
              </Box>
              <Typography variant="h6" component="div" color="white">
                Procedures Hub
              </Typography>
              <Chip 
                label="Loading SharePoint Data..."
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
      {/* Professional App Bar with HBEG Branding */}
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
            {/* HBEG Branding */}
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
              HBEG
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
            
            {sharePointAvailable && (
              <Chip 
                label={`${procedures.length} procedures`}
                size="small"
                color="info"
                variant="outlined"
                sx={{ fontSize: '0.6rem', height: 20 }}
              />
            )}
          </Box>

          {user && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {/* Notifications Bell */}
              <IconButton
                color="inherit"
                onClick={handleNotificationClick}
                sx={{ 
                  '&:hover': { 
                    backgroundColor: 'rgba(255,255,255,0.1)' 
                  }
                }}
              >
                <Badge 
                  badgeContent={unreadCount} 
                  color="error"
                  invisible={unreadCount === 0}
                >
                  <Notifications />
                </Badge>
              </IconButton>

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

      {/* Notifications Menu */}
      <Menu
        anchorEl={notificationAnchor}
        open={Boolean(notificationAnchor)}
        onClose={handleNotificationClose}
        PaperProps={{
          sx: {
            width: 400,
            maxHeight: 500,
            overflow: 'auto'
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
          <Typography variant="h6" fontWeight="bold">
            Notifications
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {notifications.length} total • {unreadCount} high priority
          </Typography>
          {sharePointAvailable && (
            <Chip 
              label="Live Data" 
              size="small" 
              color="success" 
              variant="outlined"
              sx={{ ml: 1, fontSize: '0.6rem', height: 16 }}
            />
          )}
        </Box>

        {notifications.length === 0 ? (
          <MenuItem>
            <Box sx={{ textAlign: 'center', py: 4, width: '100%' }}>
              <CheckCircle sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                No notifications
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
                py: 1.5,
                '&:hover': {
                  backgroundColor: `${getNotificationColor(notification.type)}10`
                }
              }}
            >
              <ListItemIcon sx={{ color: getNotificationColor(notification.type) }}>
                {notification.icon}
              </ListItemIcon>
              <ListItemText
                primary={notification.title}
                secondary={
                  <Box>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      {notification.message}
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                      {formatTimeAgo(notification.timestamp)}
                    </Typography>
                  </Box>
                }
              />
              {notification.priority === 'high' && (
                <Chip label="High" size="small" color="error" />
              )}
            </MenuItem>
          ))
        )}

        {notifications.length > 10 && (
          <>
            <Divider />
            <MenuItem onClick={handleNotificationClose} sx={{ justifyContent: 'center' }}>
              <Typography variant="body2" color="primary">
                View All Notifications
              </Typography>
            </MenuItem>
          </>
        )}
      </Menu>

      {/* Navigation Drawer */}
      <NavigationDrawer 
        open={drawerOpen} 
        onClose={() => setDrawerOpen(false)}
        user={user}
        isAdmin={isAdmin}
        isUploader={isUploader}
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
               <strong>Demo Mode:</strong> SharePoint connection not available. 
               Displaying sample data matching your SharePoint list structure.
             </Typography>
             <Typography variant="caption" display="block" sx={{ mt: 1 }}>
               Your SharePoint fields: {[
                 'Title', 'ExpiryDate', 'PrimaryOwner', 'PrimaryOwnerEmail', 
                 'LOB', 'QualityScore', 'RiskRating', 'DocumentLink'
               ].join(', ')}
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
               <strong>SharePoint Connected:</strong> Successfully loaded {procedures.length} procedures using your exact SharePoint list fields.
             </Typography>
             <Typography variant="caption" display="block" sx={{ mt: 1 }}>
               Mapped fields: Title, ExpiryDate, PrimaryOwner, LOB, QualityScore, RiskRating, DocumentLink, and more.
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
