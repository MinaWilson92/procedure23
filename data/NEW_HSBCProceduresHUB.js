// components/HSBCProceduresHub.js - SPECTACULAR TOP BANNER UPGRADE
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
  CloudDone, CloudOff, Settings, Search, TrendingUp, Star
} from '@mui/icons-material';
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

// 🎨 **Styled Components**
const GlassmorphismAppBar = styled(AppBar)(({ theme }) => ({
  background: 'linear-gradient(135deg, rgba(26,26,26,0.95) 0%, rgba(45,45,45,0.9) 100%)',
  backdropFilter: 'blur(20px)',
  borderBottom: '1px solid rgba(255,255,255,0.1)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="rgba(255,255,255,0.03)" fill-opacity="1" fill-rule="evenodd"%3E%3Cpath d="m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4z"/%3E%3C/g%3E%3C/svg%3E")',
    opacity: 0.5,
    pointerEvents: 'none'
  }
}));

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

const PremiumChip = styled(Chip)(({ variant, chipColor }) => ({
  background: variant === 'success' 
    ? 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)'
    : variant === 'warning'
    ? 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)'
    : variant === 'error'
    ? 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)'
    : variant === 'info'
    ? 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)'
    : HSBCColors.gradients.glassMorphism,
  color: 'white',
  fontWeight: 700,
  fontSize: '0.75rem',
  height: 28,
  borderRadius: '14px',
  border: variant === 'outlined' ? '1px solid rgba(255,255,255,0.3)' : 'none',
  backdropFilter: 'blur(10px)',
  boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
  transition: 'all 0.3s ease',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
    transition: 'left 0.5s ease'
  },
  '&:hover': {
    transform: 'translateY(-2px) scale(1.05)',
    boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
    '&::before': {
      left: '100%'
    }
  },
  '& .MuiChip-icon': {
    color: 'white',
    animation: `${floatBadge} 3s ease-in-out infinite`
  }
}));

const NotificationBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
    color: 'white',
    fontWeight: 900,
    fontSize: '0.7rem',
    boxShadow: '0 0 0 2px rgba(26,26,26,0.9), 0 4px 16px rgba(244,67,54,0.4)',
    animation: `${pulseGlow} 2s infinite`,
    '&::after': {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      border: '1px solid rgba(255,255,255,0.3)',
      content: '""'
    }
  }
}));

const UserProfileChip = styled(Chip)(({ theme, isAdmin }) => ({
  background: isAdmin 
    ? 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)'
    : 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
  color: 'white',
  border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: '20px',
  height: 40,
  fontSize: '0.875rem',
  fontWeight: 700,
  backdropFilter: 'blur(10px)',
  boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
  transition: 'all 0.3s ease',
  cursor: 'pointer',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
    border: `1px solid ${isAdmin ? 'rgba(244,67,54,0.5)' : 'rgba(255,255,255,0.4)'}`,
    background: isAdmin 
      ? 'linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)'
      : 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.1) 100%)'
  },
  '& .MuiAvatar-root': {
    boxShadow: '0 0 0 2px rgba(255,255,255,0.3)'
  }
}));

const MenuButton = styled(IconButton)(({ theme }) => ({
  background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
  border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: '12px',
  backdropFilter: 'blur(10px)',
  transition: 'all 0.3s ease',
  '&:hover': {
    background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 100%)',
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
  }
}));

const NotificationButton = styled(IconButton)(({ theme, unreadCount }) => ({
  background: unreadCount > 0 
    ? 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)'
    : 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
  border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: '12px',
  backdropFilter: 'blur(10px)',
  transition: 'all 0.3s ease',
  animation: unreadCount > 0 ? `${pulseGlow} 2s infinite` : 'none',
  '&:hover': {
    background: unreadCount > 0
      ? 'linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)'
      : 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 100%)',
    transform: 'translateY(-2px) scale(1.05)',
    boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
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
        {/* 🌟 **SPECTACULAR LOADING HEADER** */}
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <GlassmorphismAppBar position="fixed">
            <Toolbar sx={{ position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
                {/* 🎨 **PREMIUM HSBC HEXAGON LOGO** */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                >
                  <HSBCHexagonLogo size={40}>
                    <Typography variant="caption" fontWeight={900} color="white" sx={{ fontSize: '10px' }}>
                      HBEG
                    </Typography>
                  </HSBCHexagonLogo>
                </motion.div>
                
                <Stack>
                  <Typography variant="h6" component="div" color="white" fontWeight={800}>
                    Procedures Hub
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                    Next-Generation Document Management
                  </Typography>
                </Stack>
                
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <PremiumChip 
                    icon={<TrendingUp />}
                    label="Loading SharePoint Data..."
                    variant="info"
                    sx={{ ml: 2 }}
                  />
                </motion.div>
              </Box>
            </Toolbar>
          </GlassmorphismAppBar>
        </motion.div>

        {/* Loading Content */}
        <Container maxWidth="lg" sx={{ pt: 12 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Skeleton variant="text" width="60%" height={60} sx={{ mb: 2, borderRadius: 2 }} />
            <Skeleton variant="text" width="40%" height={30} sx={{ mb: 4, borderRadius: 2 }} />
            
            <Grid container spacing={3}>
              {[1, 2, 3, 4].map(n => (
                <Grid item xs={12} sm={6} md={3} key={n}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: n * 0.1 }}
                  >
                    <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 3 }} />
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </motion.div>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f6fa' }}>
      {/* 🌟 **SPECTACULAR NEXT-GEN APP BAR** */}
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <GlassmorphismAppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
          <Toolbar sx={{ position: 'relative', zIndex: 1 }}>
            {/* 📱 **MENU BUTTON WITH GLASSMORPHISM** */}
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <MenuButton
                onClick={() => setDrawerOpen(!drawerOpen)}
                sx={{ mr: 2 }}
              >
                <MenuIcon sx={{ color: 'white' }} />
              </MenuButton>
            </motion.div>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
              {/* 🎨 **PREMIUM HSBC HEXAGON LOGO** */}
              <motion.div
                whileHover={{ rotate: 180, scale: 1.1 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
              >
                <HSBCHexagonLogo size={50}>
                  <Typography variant="caption" fontWeight={900} color="white" sx={{ fontSize: '11px' }}>
                    HBEG
                  </Typography>
                </HSBCHexagonLogo>
              </motion.div>
              
              <Stack>
                <Typography variant="h6" component="div" color="white" fontWeight={800}>
                  Procedures Hub
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                  Next-Generation Document Management
                </Typography>
              </Stack>
              
              {/* 🌟 **PREMIUM STATUS CHIPS** */}
              <Stack direction="row" spacing={1} sx={{ ml: 2 }}>
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <PremiumChip 
                    icon={sharePointAvailable ? <CloudDone /> : <CloudOff />}
                    label={sharePointAvailable ? 'SharePoint Connected' : 'Demo Mode'}
                    variant={sharePointAvailable ? 'success' : 'warning'}
                  />
                </motion.div>
                
                {sharePointAvailable && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    <PremiumChip 
                      icon={<Assignment />}
                      label={`${procedures.length} procedures`}
                      variant="info"
                    />
                  </motion.div>
                )}
                
                {dashboardData?.stats?.averageScore && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                  >
                    <PremiumChip 
                      icon={<Star />}
                      label={`${dashboardData.stats.averageScore}% avg quality`}
                      variant="success"
                    />
                  </motion.div>
                )}
              </Stack>
            </Box>

            {user && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {/* 🔔 **SPECTACULAR NOTIFICATIONS BELL** */}
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Tooltip title={`${notifications.length} notifications • ${unreadCount} high priority`} arrow>
                    <NotificationButton
                      onClick={handleNotificationClick}
                      unreadCount={unreadCount}
                    >
                      <NotificationBadge 
                        badgeContent={unreadCount} 
                        invisible={unreadCount === 0}
                      >
                        <motion.div
                          animate={unreadCount > 0 ? { rotate: [0, 10, -10, 0] } : {}}
                          transition={{ duration: 0.5, repeat: unreadCount > 0 ? Infinity : 0, repeatDelay: 3 }}
                        >
                          <Notifications sx={{ color: 'white' }} />
                        </motion.div>
                      </NotificationBadge>
                    </NotificationButton>
                  </Tooltip>
                </motion.div>

                {/* 👤 **PREMIUM USER PROFILE CHIP** */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Tooltip title={`${user.displayName || user.staffId} • ${user.email || 'user@hsbc.com'}`} arrow>
                    <UserProfileChip 
                      avatar={
                        <motion.div
                          animate={{ rotate: [0, 360] }}
                          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                        >
                          <Avatar sx={{ 
                            bgcolor: isAdmin ? '#fff' : HSBCColors.primary,
                            color: isAdmin ? HSBCColors.primary : '#fff',
                            fontWeight: 900
                          }}>
                            {user.displayName?.[0] || user.staffId?.[0] || 'U'}
                          </Avatar>
                        </motion.div>
                      }
                      label={user.displayName || user.staffId}
                      isAdmin={isAdmin}
                    />
                  </Tooltip>
                </motion.div>
                
                {/* 🏆 **ROLE BADGE** */}
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <PremiumChip 
                    icon={isAdmin ? <Star /> : <AccountCircle />}
                    label={user.role || 'User'}
                    variant={isAdmin ? 'error' : 'outlined'}
                  />
                </motion.div>
              </Box>
            )}
          </Toolbar>
        </GlassmorphismAppBar>
      </motion.div>

      {/* 🔔 **SPECTACULAR NOTIFICATIONS MENU** */}
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
            borderRadius: '20px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.4)'
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {/* 📋 **NOTIFICATIONS HEADER** */}
        <Box sx={{ 
          p: 3, 
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          background: HSBCColors.gradients.glassMorphism
        }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack>
              <Typography variant="h6" fontWeight="bold" color="white">
                Notifications
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                {notifications.length} total • {unreadCount} high priority
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1}>
              {sharePointAvailable && (
                <PremiumChip 
                  label="Live Data" 
                  variant="success"
                  sx={{ fontSize: '0.6rem', height: 20 }}
                />
              )}
              <PremiumChip 
                icon={<TrendingUp />}
                label="Smart Alerts"
                variant="info"
                sx={{ fontSize: '0.6rem', height: 20 }}
              />
            </Stack>
          </Stack>
        </Box>

        {notifications.length === 0 ? (
          <MenuItem sx={{ py: 6 }}>
            <Box sx={{ textAlign: 'center', width: '100%' }}>
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <CheckCircle sx={{ fontSize: 64, color: '#4caf50', mb: 2 }} />
              </motion.div>
              <Typography variant="h6" color="white" fontWeight={700}>
                All caught up! 🎉
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                No notifications at this time
              </Typography>
            </Box>
          </MenuItem>
        ) : (
          notifications.slice(0, 10).map((notification, index) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <MenuItem
                onClick={() => handleNotificationItemClick(notification)}
                sx={{ 
                  borderLeft: `4px solid ${getNotificationColor(notification.type)}`,
                  py: 2,
                  px: 3,
                  background: 'rgba(255,255,255,0.02)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: `${alpha(getNotificationColor(notification.type), 0.1)}`,
                    transform: 'translateX(8px)'
                  }
                }}
              >
                <ListItemIcon sx={{ 
                  color: getNotificationColor(notification.type),
                  minWidth: 40
                }}>
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  >
                    {notification.icon}
                  </motion.div>
                </ListItemIcon>
                <ListItemText
                  sx={{ color: 'white' }}
                  primary={
                    <Typography variant="body1" fontWeight={700} color="white">
                      {notification.title}
                    </Typography>
                  }
                  secondary={
                    <Stack spacing={0.5}>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                        {notification.message}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                        {formatTimeAgo(notification.timestamp)}
                      </Typography>
                    </Stack>
                  }
                />
                {notification.priority === 'high' && (
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <PremiumChip 
                      label="High" 
                      variant="error"
                      sx={{ fontSize: '0.6rem', height: 20 }}
                    />
                  </motion.div>
                )}
              </MenuItem>
            </motion.div>
          ))
        )}

        {notifications.length > 10 && (
          <>
            <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
            <MenuItem 
              onClick={handleNotificationClose} 
              sx={{ 
                justifyContent: 'center',
                py: 2,
                background: HSBCColors.gradients.glassMorphism,
                '&:hover': {
                  background: HSBCColors.gradients.modernBlue
                }
              }}
            >
              <Typography variant="body2" color="white" fontWeight={700}>
                View All {notifications.length} Notifications
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
        procedures={procedures}
        dashboardData={dashboardData}
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
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Alert 
                severity="info" 
                sx={{ 
                  mb: 3,
                  background: 'linear-gradient(135deg, rgba(33,150,243,0.1) 0%, rgba(33,150,243,0.05) 100%)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(33,150,243,0.2)',
                  borderRadius: '12px'
                }}
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
            </motion.div>
          )}

          {/* SharePoint Success Alert */}
          {sharePointAvailable && procedures.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Alert 
                severity="success" 
                sx={{ 
                  mb: 3,
                  background: 'linear-gradient(135deg, rgba(76,175,80,0.1) 0%, rgba(76,175,80,0.05) 100%)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(76,175,80,0.2)',
                  borderRadius: '12px'
                }}
              >
                <Typography variant="body2">
                  <strong>SharePoint Connected:</strong> Successfully loaded {procedures.length} procedures using your exact SharePoint list fields.
                </Typography>
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Mapped fields: Title, ExpiryDate, PrimaryOwner, LOB, QualityScore, RiskRating, DocumentLink, and more.
                </Typography>
              </Alert>
            </motion.div>
          )}

          {/* Error Alert */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Alert 
                severity="warning" 
                sx={{ 
                  mb: 3,
                  background: 'linear-gradient(135deg, rgba(255,152,0,0.1) 0%, rgba(255,152,0,0.05) 100%)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,152,0,0.2)',
                  borderRadius: '12px'
                }}
                onClose={() => setError(null)}
              >
                <Typography variant="body2">
                  {error}
                </Typography>
              </Alert>
            </motion.div>
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
