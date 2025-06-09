// components/HSBCProceduresHub.js - Complete Enhanced Version with Detailed Procedure Modal
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
  const { currentPage } = useNavigation();
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

  // 🎯 **ENHANCED: SharePoint API Configuration with Comprehensive Field Selection**
  const getSharePointConfig = () => {
    return {
      // Enhanced procedures URL with comprehensive field selection and user expansions
      proceduresUrl: 'https://teams.global.hsbc/sites/EmployeeEng/_api/web/lists/getbytitle(\'Procedures\')/items?' +
        '$select=*,' +
        // Expand Author (Uploaded By) details
        'Author/Title,Author/EMail,Author/JobTitle,Author/Department,Author/WorkPhone,Author/Office,Author/Picture,' +
        // Expand Editor (Last Modified By) details  
        'Editor/Title,Editor/EMail,Editor/JobTitle,Editor/Department,Editor/WorkPhone,Editor/Office,' +
        // Expand Primary Owner SharePoint User details
        'PrimaryOwner/Title,PrimaryOwner/EMail,PrimaryOwner/JobTitle,PrimaryOwner/Department,PrimaryOwner/WorkPhone,PrimaryOwner/Office,' +
        // Expand Secondary Owner SharePoint User details
        'SecondaryOwner/Title,SecondaryOwner/EMail,SecondaryOwner/JobTitle,SecondaryOwner/Department,SecondaryOwner/WorkPhone,SecondaryOwner/Office,' +
        // Expand any additional user fields
        'UploadedBy/Title,UploadedBy/EMail,UploadedBy/JobTitle,UploadedBy/Department&' +
        '$expand=Author,Editor,PrimaryOwner,SecondaryOwner,UploadedBy&' +
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

  useEffect(() => {
    if (user && isAuthenticated) {
      loadInitialData();
    }
  }, [user, isAuthenticated]);

  // 🎯 **ENHANCED: Load Data with Comprehensive Field Mapping**
  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🚀 Loading enhanced data from SharePoint...');
      const config = getSharePointConfig();
      
      // 📋 **Load Enhanced Procedures from SharePoint List**
      try {
        console.log('📋 Fetching comprehensive procedures from SharePoint...');
        console.log('Enhanced API URL:', config.proceduresUrl);
        
        const procResponse = await fetch(config.proceduresUrl, {
          method: 'GET',
          headers: getHeaders(),
          credentials: 'include'
        });

        console.log('📋 Response status:', procResponse.status);

        if (procResponse.ok) {
          const procData = await procResponse.json();
          console.log('📋 Raw comprehensive SharePoint data:', procData);
          
          // 🎯 **COMPREHENSIVE FIELD MAPPING - All Requested Fields**
          const mappedProcedures = procData.d.results.map(item => ({
            // Basic Procedure Information
            id: item.Id,
            name: item.Title,
            lob: item.LOB || 'Unknown',
            procedure_subsection: item.ProcedureSubsection || '',
            status: item.Status || 'Active',
            
            // 📅 **DATES - All Upload and Modification Info**
            uploaded_on: item.Created || new Date().toISOString(),
            last_modified_on: item.Modified || item.Created || new Date().toISOString(),
            expiry: item.ExpiryDate || new Date().toISOString(),
            sign_off_date: item.SignOffDate || null,
            
            // 👥 **PROCEDURE OWNERS - Manual vs SharePoint Users**
            // Manual entries (as typed by user)
            primary_owner: item.PrimaryOwnerManual || item.PrimaryOwner?.Title || 'Unknown',
            primary_owner_email: item.PrimaryOwnerEmail || item.PrimaryOwner?.EMail || '',
            secondary_owner: item.SecondaryOwnerManual || item.SecondaryOwner?.Title || '',
            secondary_owner_email: item.SecondaryOwnerEmailManual || item.SecondaryOwner?.EMail || '',
            
            // 👤 **UPLOADED BY - Full User Details**
            uploaded_by: item.Author?.Title || item.UploadedBy?.Title || 'System',
            uploaded_by_email: item.Author?.EMail || item.UploadedBy?.EMail || '',
            
            // 🔄 **LAST MODIFIED BY - Full User Details**
            last_modified_by: item.Editor?.Title || item.Author?.Title || 'System',
            last_modified_by_email: item.Editor?.EMail || item.Author?.EMail || '',
            
            // 🔗 **DOCUMENT URLs AND LINKS**
            document_link: item.DocumentLink || '',
            sharepoint_url: item.SharePointURL || '',
            procedure_url: item.SharePointURL || item.DocumentLink || '',
            original_filename: item.OriginalFilename || '',
            file_size: item.FileSize || 0,
            
            // ⚠️ **RISK RATING - As Requested**
            risk_rating: item.RiskRating || 'Medium',
            
            // 📊 **PERIODIC REVIEW - As Requested**  
            periodic_review: item.PeriodicReview || 'Annual',
            
            // ⭐ **DOCUMENT QUALITY SCORE - As Requested**
            score: item.QualityScore || 0,
            quality_details: item.AnalysisDetails ? this.safeJsonParse(item.AnalysisDetails, {}) : {},
            
            // 🔍 **AI ANALYSIS DATA**
            analysis_details: item.AnalysisDetails,
            ai_recommendations: item.AIRecommendations,
            missing_elements: item.MissingElements,
            extracted_owners: item.ExtractedOwners,
            document_owners: item.DocumentOwners,
            
            // 🏢 **DEPARTMENT OWNERS - From SharePoint User Profiles**
            department_owners: this.extractDepartmentOwners(item),
            
            // 📋 **COMPREHENSIVE USER OBJECTS - For Detailed Modal**
            author_details: item.Author ? {
              name: item.Author.Title,
              email: item.Author.EMail,
              jobTitle: item.Author.JobTitle,
              department: item.Author.Department,
              workPhone: item.Author.WorkPhone,
              office: item.Author.Office,
              picture: item.Author.Picture?.Url
            } : null,
            
            editor_details: item.Editor ? {
              name: item.Editor.Title,
              email: item.Editor.EMail,
              jobTitle: item.Editor.JobTitle,
              department: item.Editor.Department,
              workPhone: item.Editor.WorkPhone,
              office: item.Editor.Office
            } : null,
            
            primary_owner_details: item.PrimaryOwner ? {
              name: item.PrimaryOwner.Title,
              email: item.PrimaryOwner.EMail,
              jobTitle: item.PrimaryOwner.JobTitle,
              department: item.PrimaryOwner.Department,
              workPhone: item.PrimaryOwner.WorkPhone,
              office: item.PrimaryOwner.Office
            } : null,
            
            secondary_owner_details: item.SecondaryOwner ? {
              name: item.SecondaryOwner.Title,
              email: item.SecondaryOwner.EMail,
              jobTitle: item.SecondaryOwner.JobTitle,
              department: item.SecondaryOwner.Department,
              workPhone: item.SecondaryOwner.WorkPhone,
              office: item.SecondaryOwner.Office
            } : null,
            
            uploaded_by_details: item.UploadedBy ? {
              name: item.UploadedBy.Title,
              email: item.UploadedBy.EMail,
              jobTitle: item.UploadedBy.JobTitle,
              department: item.UploadedBy.Department
            } : null,
            
            // 🔧 **TECHNICAL FIELDS**
            sharepoint_uploaded: item.SharePointUploaded || true,
            sharepoint_id: item.Id,
            entity_type: item.__metadata?.type || '',
            
            // 📱 **UI HELPER FIELDS**
            file_link: item.DocumentLink || item.SharePointURL || '',
            owner_display: item.PrimaryOwnerManual || item.PrimaryOwner?.Title || 'Unknown'
          }));
          
          setProcedures(mappedProcedures);
          setSharePointAvailable(true);
          
          console.log('✅ Comprehensive procedures loaded from SharePoint:', mappedProcedures.length);
          console.log('📊 Sample comprehensive procedure data:', mappedProcedures[0]);
          
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

  // 🔧 **HELPER METHODS**
  const safeJsonParse = (jsonString, defaultValue = {}) => {
    try {
      return jsonString ? JSON.parse(jsonString) : defaultValue;
    } catch (error) {
      console.warn('⚠️ JSON parse error:', error);
      return defaultValue;
    }
  };

  const extractDepartmentOwners = (item) => {
    const departments = [];
    
    // Extract departments from all user fields
    if (item.Author?.Department) departments.push(item.Author.Department);
    if (item.Editor?.Department) departments.push(item.Editor.Department);
    if (item.PrimaryOwner?.Department) departments.push(item.PrimaryOwner.Department);
    if (item.SecondaryOwner?.Department) departments.push(item.SecondaryOwner.Department);
    if (item.UploadedBy?.Department) departments.push(item.UploadedBy.Department);
    
    // Return unique departments
    return [...new Set(departments)];
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

  // 📝 **Load Mock Data for Demo**
  const loadMockData = () => {
    console.log('📝 Loading comprehensive mock data for demonstration...');
    
    const mockProcedures = [
      {
        id: 1,
        name: "Risk Assessment Framework - Enhanced",
        lob: "IWPB",
        primary_owner: "John Smith",
        primary_owner_email: "john.smith@hsbc.com",
        uploaded_by: "Sarah Johnson",
        uploaded_by_email: "sarah.johnson@hsbc.com",
        uploaded_on: "2024-05-15T10:30:00Z",
        last_modified_by: "Michael Chen",
        last_modified_on: "2024-06-10T14:20:00Z",
        expiry: "2024-07-15", // Expiring soon
        score: 92,
        risk_rating: "High",
        periodic_review: "Annual",
        sign_off_date: "2024-05-20T09:00:00Z",
        document_link: "https://sharepoint.hsbc.com/sites/procedures/risk-framework.pdf",
        sharepoint_url: "https://sharepoint.hsbc.com/sites/procedures",
        procedure_url: "https://sharepoint.hsbc.com/sites/procedures/risk-framework.pdf",
        original_filename: "HSBC_Risk_Assessment_Framework_v2.1.pdf",
        file_size: 2450000,
        status: "Active",
        author_details: {
          name: "Sarah Johnson",
          email: "sarah.johnson@hsbc.com",
          jobTitle: "Senior Risk Manager",
          department: "Global Risk Management",
          workPhone: "+44 20 7991 8888",
          office: "London - Canary Wharf"
        },
        primary_owner_details: {
          name: "John Smith",
          email: "john.smith@hsbc.com",
          jobTitle: "Head of Credit Risk",
          department: "Global Risk Management",
          workPhone: "+852 2822 1111",
          office: "Hong Kong - Central"
        }
      },
      {
        id: 2,
        name: "Trading Compliance Guidelines", 
        lob: "CIB",
        primary_owner: "Sarah Johnson",
        primary_owner_email: "sarah.johnson@hsbc.com",
        uploaded_by: "David Park",
        uploaded_by_email: "david.park@hsbc.com",
        uploaded_on: "2024-04-20T16:45:00Z",
        expiry: "2024-05-20", // Expired
        score: 45, // Low quality
        risk_rating: "Medium",
        periodic_review: "Semi-Annual",
        sign_off_date: "2024-04-25T11:30:00Z",
        document_link: "https://sharepoint.hsbc.com/sites/procedures/trading-compliance.pdf",
        original_filename: "Trading_Compliance_Guidelines_v1.3.pdf",
        file_size: 1800000,
        status: "Active",
        author_details: {
          name: "David Park",
          email: "david.park@hsbc.com",
          jobTitle: "Compliance Officer",
          department: "Corporate & Investment Banking",
          workPhone: "+1 212 525 5000",
          office: "New York - Manhattan"
        }
      },
      {
        id: 3,
        name: "Client Onboarding Process",
        lob: "GCOO",
        primary_owner: "Mike Chen",
        primary_owner_email: "mike.chen@hsbc.com",
        uploaded_by: "Lisa Wang",
        uploaded_by_email: "lisa.wang@hsbc.com",
        uploaded_on: "2024-03-10T09:15:00Z",
        expiry: "2025-03-15",
        score: 88,
        risk_rating: "Low",
        periodic_review: "Annual",
        sign_off_date: "2024-03-15T14:00:00Z",
        document_link: "https://sharepoint.hsbc.com/sites/procedures/client-onboarding.pdf",
        original_filename: "Client_Onboarding_Process_v3.0.pdf",
        file_size: 3200000,
        status: "Active",
        author_details: {
          name: "Lisa Wang",
          email: "lisa.wang@hsbc.com",
          jobTitle: "Process Manager",
          department: "Group Chief Operating Office",
          workPhone: "+65 6658 8888",
          office: "Singapore - Marina Bay"
        }
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
              {/* 🎯 **HBEG Branding** */}
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
                label="Loading Enhanced SharePoint Data..."
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
      {/* 🎯 **Enhanced Professional App Bar with HBEG Branding** */}
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
            {/* 🎯 **HBEG Branding** */}
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
            
            {/* Enhanced SharePoint Status Indicator */}
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
                label={`${procedures.length} procedures loaded`}
                size="small"
                color="info"
                variant="outlined"
                sx={{ fontSize: '0.6rem', height: 20 }}
              />
            )}
          </Box>

          {user && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {/* 🔔 **Enhanced Notifications Bell** */}
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

     {/* 🔔 **Enhanced Notifications Menu** */}
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
         {/* Enhanced SharePoint Status Alert */}
         {!sharePointAvailable && (
           <Alert 
             severity="info" 
             sx={{ mb: 3 }}
             onClose={() => {}}
           >
             <Typography variant="body2">
               <strong>Demo Mode:</strong> SharePoint connection not available. 
               Displaying comprehensive sample data for demonstration purposes.
             </Typography>
             <Typography variant="caption" display="block" sx={{ mt: 1 }}>
               Expected endpoint: https://teams.global.hsbc/sites/EmployeeEng/_api/web/lists/getbytitle('Procedures')/items
             </Typography>
           </Alert>
         )}

         {/* Enhanced SharePoint Success Alert */}
         {sharePointAvailable && procedures.length > 0 && (
           <Alert 
             severity="success" 
             sx={{ mb: 3 }}
             onClose={() => {}}
           >
             <Typography variant="body2">
               <strong>SharePoint Connected:</strong> Successfully loaded {procedures.length} comprehensive procedures from SharePoint Lists with detailed user information.
             </Typography>
             <Typography variant="caption" display="block" sx={{ mt: 1 }}>
               Data includes: procedure owners, upload details, document analysis, department info, and more.
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
