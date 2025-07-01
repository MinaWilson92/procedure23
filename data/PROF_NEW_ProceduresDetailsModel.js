// components/ProcedureDetailsModal.js - Complete Fixed Version
import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, 
  Grid, Card, CardContent, Chip, Divider, List, ListItem, ListItemIcon, 
  ListItemText, Avatar, LinearProgress, Alert, IconButton, Skeleton, Link,
  Stack, Paper, Tooltip, Badge, useTheme, styled, keyframes, alpha,
  CardHeader, Accordion, AccordionSummary, AccordionDetails, Fab,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import {
  Close, Visibility, Description, CalendarToday, Schedule, CheckCircle,
  CloudDownload, Email, Person, Security, Business, Warning, 
  LocalFireDepartment, AutoAwesome, Psychology, Insights, TrendingUp,
  ExpandMore, Grade, AdminPanelSettings, Share, Assignment,
  Error as ErrorIcon, Timeline as TimelineIcon, Link as LinkIcon,
  History, TrendingDown, Analytics, Edit, Circle, GetApp, Launch
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

// ✅ ENHANCED: Timeline Components
const CustomTimeline = styled(Box)(({ theme }) => ({
  position: 'relative',
  paddingLeft: 32,
  '&::before': {
    content: '""',
    position: 'absolute',
    left: 19,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#e0e0e0'
  }
}));

const CustomTimelineItem = styled(Box)(({ theme }) => ({
  position: 'relative',
  paddingBottom: 24,
  '&:last-child': {
    paddingBottom: 0
  }
}));

const CustomTimelineDot = styled(Box)(({ theme, variant = 'default' }) => ({
  position: 'absolute',
  left: -32,
  top: 0,
  width: 40,
  height: 40,
  borderRadius: '50%',
  backgroundColor: variant === 'primary' ? HSBCColors.professional.info : '#90caf9',
  color: 'white',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '0.75rem',
  fontWeight: 'bold',
  zIndex: 2,
  border: '3px solid white',
  boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
}));

const CustomTimelineContent = styled(Box)(({ theme }) => ({
  marginLeft: 16,
  marginTop: -8
}));

// 🎨 **Professional Corporate Colors**
const HSBCColors = {
  primary: '#DB0011',
  secondary: '#9FA1A4',
  professional: {
    darkGrey: '#2C3E50',
    lightGrey: '#ECF0F1',
    white: '#FFFFFF',
    softBlue: '#34495E',
    textPrimary: '#2C3E50',
    textSecondary: '#7F8C8D',
    border: '#BDC3C7',
    background: '#F8F9FA',
    success: '#27AE60',
    warning: '#F39C12',
    error: '#E74C3C',
    info: '#3498DB'
  },
  gradients: {
    header: 'linear-gradient(135deg, #2C3E50 0%, #34495E 100%)',
    card: 'linear-gradient(135deg, #FFFFFF 0%, #F8F9FA 100%)',
    accent: 'linear-gradient(135deg, #DB0011 0%, #B50010 100%)',
    subtle: 'linear-gradient(135deg, #ECF0F1 0%, #FFFFFF 100%)'
  }
};

// 🎨 **Professional Styled Components**
const ProfessionalCard = styled(Card)(({ theme, variant = 'default', accent = false }) => ({
  background: accent ? HSBCColors.gradients.card : '#FFFFFF',
  border: variant === 'error' ? `2px solid ${HSBCColors.professional.error}` :
    variant === 'warning' ? `2px solid ${HSBCColors.professional.warning}` :
    variant === 'success' ? `2px solid ${HSBCColors.professional.success}` :
    variant === 'info' ? `2px solid ${HSBCColors.professional.info}` :
    accent ? `2px solid ${HSBCColors.primary}` :
    `1px solid ${HSBCColors.professional.border}`,
  borderRadius: '8px',
  boxShadow: '0 2px 12px rgba(44,62,80,0.08)',
  transition: 'all 0.2s ease',
  '&:hover': {
    boxShadow: accent ? '0 4px 20px rgba(219,0,17,0.15)' : '0 4px 16px rgba(44,62,80,0.12)',
    transform: 'translateY(-2px)'
  }
}));

const ProfessionalLogo = styled(Box)(({ theme, size = 50 }) => ({
  width: size,
  height: size,
  background: HSBCColors.gradients.accent,
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 2px 8px rgba(219,0,17,0.2)'
}));

const ProfessionalDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: '8px',
    background: '#FFFFFF',
    maxHeight: '95vh',
    margin: 16,
    width: 'calc(100% - 32px)',
    maxWidth: '1200px',
    boxShadow: '0 8px 32px rgba(44,62,80,0.15)'
  }
}));

const ProfessionalPaper = styled(Paper)(({ theme, variant = 'default' }) => ({
  padding: 16,
  borderRadius: '8px',
  background: '#FFFFFF',
  border: `1px solid ${HSBCColors.professional.border}`,
  boxShadow: '0 2px 8px rgba(44,62,80,0.05)',
  transition: 'all 0.2s ease',
  '&:hover': {
    boxShadow: '0 4px 12px rgba(44,62,80,0.1)'
  }
}));

const ScoreDisplay = styled(Box)(({ score }) => ({
  width: 120,
  height: 120,
  borderRadius: '50%',
  background: `conic-gradient(${getScoreColor(score)} 0deg ${score * 3.6}deg, #e0e0e0 ${score * 3.6}deg 360deg)`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    width: '80%',
    height: '80%',
    borderRadius: '50%',
    background: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }
}));

// Helper functions
const getScoreColor = (score) => {
  if (score >= 90) return HSBCColors.professional.success;
  if (score >= 80) return '#8bc34a';
  if (score >= 70) return HSBCColors.professional.warning;
  if (score >= 60) return HSBCColors.professional.error;
  return '#d32f2f';
};

const getQualityInfo = (score) => {
  if (score >= 90) {
    return { level: 'Excellent', color: HSBCColors.professional.success, icon: <AutoAwesome /> };
  } else if (score >= 80) {
    return { level: 'Good', color: HSBCColors.professional.success, icon: <CheckCircle /> };
  } else if (score >= 70) {
    return { level: 'Fair', color: HSBCColors.professional.warning, icon: <Warning /> };
  } else if (score >= 60) {
    return { level: 'Poor', color: HSBCColors.professional.error, icon: <ErrorIcon /> };
  } else {
    return { level: 'Critical', color: HSBCColors.professional.error, icon: <LocalFireDepartment /> };
  }
};

const getRiskColor = (risk) => {
  switch (risk?.toLowerCase()) {
    case 'high': return HSBCColors.professional.error;
    case 'medium': return HSBCColors.professional.warning;
    case 'low': return HSBCColors.professional.success;
    case 'critical': return '#d32f2f';
    default: return '#9e9e9e';
  }
};

const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'active': return 'success';
    case 'expired': return 'error';
    case 'draft': return 'warning';
    default: return 'default';
  }
};

const ProcedureDetailsModal = ({ 
  open, 
  onClose, 
  procedureId, 
  sharePointAvailable = false,
  user,
  onAmend
}) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [procedureDetails, setProcedureDetails] = useState(null);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [amendmentHistory, setAmendmentHistory] = useState([]);
  const [amendmentTimeline, setAmendmentTimeline] = useState([]);

  // ✅ ENHANCED: Smart URL cleaning with comprehensive duplicate removal
  // ✅ COMPLETELY FIXED: Enhanced URL cleaning with comprehensive duplicate removal
const cleanSharePointUrl = (url) => {
  if (!url) return '';
  
  console.log('🔧 Original URL:', url);
  
  // Step 1: Handle various input formats
  let cleanUrl = url.toString().trim();
  
  // Step 2: Remove duplicate domain segments (your main issue)
  // Pattern: https://teams.hsbc.global/teams.hsbc.global/... → https://teams.hsbc.global/...
  cleanUrl = cleanUrl.replace(/https:\/\/teams\.hsbc\.global\/teams\.hsbc\.global\//gi, 'https://teams.hsbc.global/');
  cleanUrl = cleanUrl.replace(/https:\/\/teams\.global\.hsbc\/teams\.global\.hsbc\//gi, 'https://teams.global.hsbc/');
  
  // Step 3: Remove duplicate site path segments  
  cleanUrl = cleanUrl.replace(/\/sites\/EmployeeEng\/sites\/EmployeeEng\//gi, '/sites/EmployeeEng/');
  cleanUrl = cleanUrl.replace(/\/Sites\/EmployeeEng\/Sites\/EmployeeEng\//gi, '/sites/EmployeeEng/');
  cleanUrl = cleanUrl.replace(/\/sites\/employeeeng\/sites\/employeeeng\//gi, '/sites/EmployeeEng/');
  
  // Step 4: Remove multiple consecutive slashes (but preserve protocol://)
  cleanUrl = cleanUrl.replace(/([^:]\/)\/+/g, '$1');
  
  // Step 5: Fix case sensitivity for known paths
  cleanUrl = cleanUrl.replace(/\/sites\/employeeeng\//gi, '/sites/EmployeeEng/');
  cleanUrl = cleanUrl.replace(/\/Sites\/employeeeng\//gi, '/sites/EmployeeEng/');
  
  // Step 6: Handle relative URLs properly
  if (!cleanUrl.startsWith('http')) {
    // If it's a relative URL starting with /sites/EmployeeEng, make it absolute
    if (cleanUrl.startsWith('/sites/EmployeeEng/')) {
      cleanUrl = `https://teams.global.hsbc${cleanUrl}`;
    }
    // If it doesn't start with /sites/, add the full path
    else if (cleanUrl.startsWith('/')) {
      cleanUrl = `https://teams.global.hsbc/sites/EmployeeEng${cleanUrl}`;
    }
    // If it's a bare filename or path, add full prefix
    else {
      cleanUrl = `https://teams.global.hsbc/sites/EmployeeEng/${cleanUrl}`;
    }
  }
  
  // Step 7: Final cleanup - remove any remaining duplicates
  const domainPattern = /https:\/\/([^\/]+)\/\1\//gi;
  cleanUrl = cleanUrl.replace(domainPattern, 'https://$1/');
  
  // Step 8: Validate result
  if (cleanUrl.includes('undefined') || cleanUrl.includes('null')) {
    console.warn('⚠️ Invalid URL detected, using fallback');
    return '';
  }
  
  console.log('✅ Cleaned URL:', cleanUrl);
  return cleanUrl;
};
  // ✅ ENHANCED: Get latest document version with smart logic
  const getLatestDocumentUrl = () => {
    if (!procedureDetails) return '';
    
    console.log('🔍 Finding latest document version...');
    console.log('Amendment history length:', amendmentHistory?.length || 0);
    console.log('Original document link:', procedureDetails.documentLink);
    
    // Priority 1: Latest amendment document
    if (amendmentHistory && amendmentHistory.length > 0) {
      const latestAmendment = amendmentHistory[amendmentHistory.length - 1];
      console.log('Latest amendment:', latestAmendment);
      
      if (latestAmendment.documentUrl) {
        const cleanedUrl = cleanSharePointUrl(latestAmendment.documentUrl);
        console.log('📥 Using latest amendment URL:', cleanedUrl);
        return cleanedUrl;
      }
    }
    
    // Priority 2: Main document link
    const mainDocUrl = cleanSharePointUrl(procedureDetails.documentLink);
    console.log('📥 Using main document URL:', mainDocUrl);
    return mainDocUrl;
  };

  // ✅ ENHANCED: Get version-specific document URL
  const getVersionDocumentUrl = (amendmentData) => {
    if (!amendmentData) return '';
    
    if (amendmentData.documentUrl) {
      return cleanSharePointUrl(amendmentData.documentUrl);
    }
    
    return '';
  };

  // ✅ ENHANCED: Download handlers with error handling
  const handleDownloadLatest = () => {
    const latestUrl = getLatestDocumentUrl();
    if (latestUrl) {
      console.log('📥 Downloading latest version from:', latestUrl);
      try {
        window.open(latestUrl, '_blank');
      } catch (error) {
        console.error('❌ Download failed:', error);
        // Fallback: copy to clipboard
        if (navigator.clipboard) {
          navigator.clipboard.writeText(latestUrl);
          alert('Download link copied to clipboard. Please paste in a new browser tab.');
        } else {
          alert('Download failed. Please contact support.');
        }
      }
    } else {
      alert('No document available for download');
    }
  };

  const handleDownloadVersion = (amendmentData, versionNumber) => {
    const versionUrl = getVersionDocumentUrl(amendmentData);
    if (versionUrl) {
      console.log(`📥 Downloading version ${versionNumber} from:`, versionUrl);
      try {
        window.open(versionUrl, '_blank');
      } catch (error) {
        console.error('❌ Version download failed:', error);
        if (navigator.clipboard) {
          navigator.clipboard.writeText(versionUrl);
          alert(`Version ${versionNumber} download link copied to clipboard.`);
        } else {
          alert(`Version ${versionNumber} download failed. Please contact support.`);
        }
      }
    } else {
      alert(`Version ${versionNumber} document not available`);
    }
  };

  const handleOpenInSharePoint = () => {
    const latestUrl = getLatestDocumentUrl();
    if (latestUrl) {
      // Convert download URL to SharePoint view URL
      const sharePointViewUrl = latestUrl.replace('/$value', '');
      console.log('🔗 Opening in SharePoint:', sharePointViewUrl);
      window.open(sharePointViewUrl, '_blank');
    } else {
      alert('No SharePoint link available');
    }
  };

  // 🕒 **Real-time Clock**
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 🎯 **SharePoint API for Individual Procedure**
  const getDetailedProcedureUrl = (id) => {
    const selectFields = [
      'Id', 'Title', 'Created', 'Modified',
      'ExpiryDate', 'PrimaryOwner', 'PrimaryOwnerEmail', 'SecondaryOwner', 'SecondaryOwnerEmail',
      'LOB', 'ProcedureSubsection', 'QualityScore', 'PreviousScore', 'OriginalFilename', 'FileSize',
      'UploadedBy', 'UploadedAt', 'Status', 'AnalysisDetails', 'AIRecommendations',
      'RiskRating', 'PeriodicReview', 'DocumentOwners', 'FoundElements', 'DocumentLink', 'SignOffDate',
      'AmendmentCount', 'AmendmentHistory', 'AmendmentTimeline', 'LatestAmendmentSummary',
      'LastAmendedBy', 'LastAmendmentDate'
    ].join(',');

    return `https://teams.global.hsbc/sites/EmployeeEng/_api/web/lists/getbytitle('Procedures')/items(${id})?$select=${selectFields}`;
  };

  useEffect(() => {
    if (open && procedureId) {
      loadProcedureDetails();
    }
  }, [open, procedureId]);

  // ✅ Parse amendment data
 const parseAmendmentData = (procedureData) => {
  try {
    let history = [];
    if (procedureData.AmendmentHistory) {
      const historyData = procedureData.AmendmentHistory;
      
      // 🔍 DEBUG: Log the raw JSON data
      console.log('🔍 Raw AmendmentHistory JSON:', historyData);
      
      if (typeof historyData === 'string') {
        history = JSON.parse(historyData);
      } else if (Array.isArray(historyData)) {
        history = historyData;
      }
      
      // 🔍 DEBUG: Log parsed data to see URLs
      console.log('🔍 Parsed AmendmentHistory:', history);
      
      // 🔍 DEBUG: Check each amendment's URL
      history.forEach((amendment, index) => {
        console.log(`🔍 Amendment ${index + 1} URL:`, amendment.documentUrl);
        console.log(`🔍 Amendment ${index + 1} full data:`, amendment);
      });
    }
    
    setAmendmentHistory(history);
    
  } catch (error) {
    console.error('❌ Error parsing amendment data:', error);
    setAmendmentHistory([]);
  }
};
  const loadProcedureDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!sharePointAvailable) {
        loadMockDetails();
        return;
      }

      const detailUrl = getDetailedProcedureUrl(procedureId);
      console.log('📡 Loading procedure details from:', detailUrl);

      const response = await fetch(detailUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json; odata=verbose' },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Detailed procedure data:', data.d);
        const details = processDetailedData(data.d);
        setProcedureDetails(details);
        parseAmendmentData(data.d);
      } else {
        throw new Error(`Failed to load: ${response.status}`);
      }

    } catch (err) {
      console.error('❌ Error loading procedure details:', err);
      setError(err.message);
      loadMockDetails();
    } finally {
      setLoading(false);
    }
  };

  const processDetailedData = (spItem) => {
    const safeJsonParse = (jsonString, defaultValue = {}) => {
      try {
        return jsonString ? JSON.parse(jsonString) : defaultValue;
      } catch {
        return defaultValue;
      }
    };

    return {
      id: spItem.Id,
      name: spItem.Title,
      uploadedOn: spItem.UploadedAt || spItem.Created,
      modifiedOn: spItem.Modified,
      lob: spItem.LOB,
      subsection: spItem.ProcedureSubsection,
      expiry: spItem.ExpiryDate,
      status: spItem.Status,
      riskRating: spItem.RiskRating,
      periodicReview: spItem.PeriodicReview,
      qualityScore: spItem.QualityScore,
      previousScore: spItem.PreviousScore,
      signOffDate: spItem.SignOffDate,
      documentLink: spItem.DocumentLink,
      originalFilename: spItem.OriginalFilename,
      fileSize: spItem.FileSize,
      uploadedBy: spItem.UploadedBy || 'Unknown',
      primaryOwner: spItem.PrimaryOwner,
      primaryOwnerEmail: spItem.PrimaryOwnerEmail,
      secondaryOwner: spItem.SecondaryOwner,
      secondaryOwnerEmail: spItem.SecondaryOwnerEmail,
      analysisDetails: safeJsonParse(spItem.AnalysisDetails),
      aiRecommendations: safeJsonParse(spItem.AIRecommendations, []),
      foundElements: safeJsonParse(spItem.FoundElements, []),
      documentOwners: safeJsonParse(spItem.DocumentOwners, []),
      amendmentCount: spItem.AmendmentCount || 0,
      latestAmendmentSummary: spItem.LatestAmendmentSummary,
      lastAmendedBy: spItem.LastAmendedBy,
      lastAmendmentDate: spItem.LastAmendmentDate
    };
  };

  const loadMockDetails = () => {
    const mockData = {
      id: procedureId,
      name: "Risk Assessment Framework - Enhanced Analytics",
      uploadedOn: "2024-05-15T10:30:00Z",
      modifiedOn: "2024-06-10T14:20:00Z",
      lob: "IWPB",
      subsection: "Credit Risk Management",
      expiry: "2024-12-31",
      status: "Active",
      riskRating: "High",
      periodicReview: "Annual",
      qualityScore: 92,
      previousScore: 85,
      signOffDate: "2024-05-20",
      documentLink: "https://teams.global.hsbc/sites/EmployeeEng/SiteAssets/IWPB/Risk_Management/risk-framework-v2.1.pdf",
      originalFilename: "HSBC_Risk_Assessment_Framework_v2.1.pdf",
      fileSize: 2450000,
      uploadedBy: "John Smith (Admin)",
      primaryOwner: "Michael Chen",
      primaryOwnerEmail: "michael.chen@hsbc.com",
      secondaryOwner: "Sarah Johnson", 
      secondaryOwnerEmail: "sarah.johnson@hsbc.com",
      analysisDetails: { score: 92, compliance: 'High', templateMatch: 95 },
      aiRecommendations: [
        "Add specific annual review scheduling section",
        "Include comprehensive stakeholder approval matrix",
        "Enhance risk mitigation strategies documentation"
      ],
      foundElements: [
        "Document Control Section",
        "Risk Assessment Matrix", 
        "Approval Workflow",
        "Stakeholder Responsibilities",
        "Review Schedule",
        "Version Control"
      ],
      documentOwners: [
        "Michael Chen - Head of Credit Risk",
        "Sarah Johnson - Risk Director",
        "David Park - Compliance Officer"
      ],
      amendmentCount: 2,
      latestAmendmentSummary: "Updated risk calculation methodology",
      lastAmendedBy: "Sarah Johnson",
      lastAmendmentDate: "2024-06-10T14:20:00Z"
    };
    
    setProcedureDetails(mockData);
    
    // Mock amendment history with proper URLs
    const mockAmendmentHistory = [
      {
        amendmentNumber: 1,
        date: "2024-05-25T10:30:00Z",
        amendedBy: "Michael Chen",
        amendedByStaffId: "12345",
        amendedByRole: "Risk Manager",
        summary: "Initial risk framework improvements",
        previousScore: 78,
        newScore: 85,
        scoreChange: 7,
        fileName: "Risk_Framework_v1.1.pdf",
        actualFileName: "Risk_Framework_v1.1_v1_20240525T103000.pdf",
        fileSize: 2300000,
        fileRenamed: true,
        targetFolder: "SiteAssets/IWPB/Risk_Management",
        actualSubFolder: "Risk_Management",
        documentUrl: "https://teams.global.hsbc/sites/EmployeeEng/SiteAssets/IWPB/Risk_Management/Risk_Framework_v1.1_v1_20240525T103000.pdf"
      },
      {
        amendmentNumber: 2,
        date: "2024-06-10T14:20:00Z",
        amendedBy: "Sarah Johnson",
        amendedByStaffId: "67890",
        amendedByRole: "Risk Director",
        summary: "Updated risk calculation methodology",
        previousScore: 85,
        newScore: 92,
        scoreChange: 7,
        fileName: "Risk_Framework_v2.1.pdf",
        actualFileName: "Risk_Framework_v2.1_v2_20240610T142000.pdf",
        fileSize: 2450000,
        fileRenamed: true,
        targetFolder: "SiteAssets/IWPB/Risk_Management",
        actualSubFolder: "Risk_Management",
        documentUrl: "https://teams.global.hsbc/sites/EmployeeEng/SiteAssets/IWPB/Risk_Management/Risk_Framework_v2.1_v2_20240610T142000.pdf"
      }
    ];
    
    setAmendmentHistory(mockAmendmentHistory);
  };

  // ✅ Helper functions for amendment display
  const getScoreChangeIcon = (change) => {
    if (change > 0) return <TrendingUp sx={{ color: HSBCColors.professional.success }} />;
    if (change < 0) return <TrendingDown sx={{ color: HSBCColors.professional.error }} />;
    return <Analytics sx={{ color: '#9e9e9e' }} />;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate days until expiry
  const getDaysUntilExpiry = (expiryDate) => {
    if (!expiryDate) return null;
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExpiryStatus = (daysLeft) => {
    if (daysLeft < 0) {
      return { status: 'EXPIRED', color: HSBCColors.professional.error, icon: <ErrorIcon />, text: `EXPIRED (${Math.abs(daysLeft)} days ago)` };
    } else if (daysLeft <= 7) {
      return { status: 'CRITICAL', color: HSBCColors.professional.error, icon: <LocalFireDepartment />, text: `URGENT: ${daysLeft} days left` };
    } else if (daysLeft <= 30) {
      return { status: 'EXPIRING', color: HSBCColors.professional.warning, icon: <Schedule />, text: `${daysLeft} days left` };
    } else {
      return { status: 'ACTIVE', color: HSBCColors.professional.success, icon: <CheckCircle />, text: `${daysLeft} days left` };
    }
  };

  if (!open) return null;

  const qualityInfo = procedureDetails ? getQualityInfo(procedureDetails.qualityScore) : null;
  const daysLeft = procedureDetails ? getDaysUntilExpiry(procedureDetails.expiry) : null;
  const expiryStatus = daysLeft !== null ? getExpiryStatus(daysLeft) : null;
  
  const hasAmendments = amendmentHistory.length > 0;
  const totalAmendments = procedureDetails?.amendmentCount || amendmentHistory.length;
  const latestAmendment = amendmentHistory[amendmentHistory.length - 1];

  return (
    <ProfessionalDialog 
      open={open} 
      onClose={onClose}
      maxWidth="xl"
      fullWidth
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <DialogTitle sx={{ p: 0 }}>
          <Box sx={{ 
            background: HSBCColors.gradients.header,
            color: 'white',
            p: 3,
            borderBottom: `1px solid ${HSBCColors.professional.border}`
          }}>
            <Grid container alignItems="center" spacing={2}>
              <Grid item>
                <ProfessionalLogo size={60}>
                  <Visibility sx={{ color: 'white', fontSize: 24 }} />
                </ProfessionalLogo>
              </Grid>
              
              <Grid item xs>
                <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>
                  Procedure Details
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Comprehensive procedure analysis and information
                </Typography>
              </Grid>
              
              <Grid item>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="h6" fontWeight={600}>
                      {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      {currentTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Typography>
                  </Box>
                  
                  <Chip 
                    icon={sharePointAvailable ? <CheckCircle /> : <Warning />}
                    label={sharePointAvailable ? 'Connected' : 'Demo Mode'}
                    variant="outlined"
                    sx={{ 
                      borderColor: 'white',
                      color: 'white',
                      backgroundColor: 'rgba(255,255,255,0.1)'
                    }}
                  />
                  
                  {hasAmendments && (
                    <Badge badgeContent={totalAmendments} color="secondary">
                      <Chip 
                        icon={<History />}
                        label="Amended"
                        color="info"
                        variant="outlined"
                        sx={{ 
                          borderColor: 'white',
                          color: 'white',
                                                    backgroundColor: 'rgba(255,255,255,0.1)'
                        }}
                      />
                    </Badge>
                  )}
                  
                  <IconButton onClick={onClose} sx={{ color: 'white' }}>
                    <Close />
                  </IconButton>
                </Stack>
              </Grid>
            </Grid>
          </Box>
        </DialogTitle>
      </motion.div>

      <DialogContent sx={{ p: 0 }}>
        {loading ? (
          /* Loading State */
          <Box sx={{ p: 4 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
              </Grid>
              <Grid item xs={12} md={6}>
                <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
              </Grid>
              <Grid item xs={12} md={6}>
                <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
              </Grid>
            </Grid>
          </Box>
        ) : error ? (
          /* Error State */
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <ProfessionalCard variant="error">
              <CardContent sx={{ p: 4 }}>
                <ErrorIcon sx={{ fontSize: 80, color: HSBCColors.professional.error, mb: 2 }} />
                <Typography variant="h5" fontWeight={800} gutterBottom>
                  Failed to Load Details
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  {error}
                </Typography>
                <Button 
                  variant="contained" 
                  onClick={loadProcedureDetails}
                  sx={{
                    background: HSBCColors.gradients.accent,
                    borderRadius: '8px',
                    px: 4,
                    py: 1.5,
                    fontWeight: 700
                  }}
                >
                  Retry Loading
                </Button>
              </CardContent>
            </ProfessionalCard>
          </Box>
        ) : procedureDetails ? (
          /* Content Display */
          <Box sx={{ p: 4 }}>
            {/* Hero Section with Quality Score */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <ProfessionalCard 
                variant={qualityInfo?.level === 'Excellent' ? 'success' : 
                         qualityInfo?.level === 'Good' ? 'success' :
                         qualityInfo?.level === 'Fair' ? 'warning' : 'error'} 
                accent={true}
                sx={{ mb: 4 }}
              >
                <CardContent sx={{ p: 4 }}>
                  <Grid container spacing={4} alignItems="center">
                    <Grid item xs={12} md={8}>
                      <Typography variant="h3" fontWeight={700} gutterBottom>
                        {procedureDetails.name}
                      </Typography>
                      
                      <Stack direction="row" spacing={1} sx={{ mb: 3, flexWrap: 'wrap', gap: 1 }}>
                        <Chip 
                          icon={expiryStatus?.icon}
                          label={expiryStatus?.text}
                          variant="outlined"
                          sx={{ 
                            borderColor: expiryStatus?.color,
                            color: expiryStatus?.color,
                            backgroundColor: alpha(expiryStatus?.color || HSBCColors.professional.success, 0.1),
                            fontWeight: 600
                          }}
                        />
                        <Chip 
                          icon={<Business />}
                          label={`${procedureDetails.lob}${procedureDetails.subsection ? ` • ${procedureDetails.subsection}` : ''}`}
                          color="primary"
                          variant="outlined"
                          sx={{ fontWeight: 600 }}
                        />
                        <Chip 
                          icon={<Security />}
                          label={`Risk: ${procedureDetails.riskRating}`}
                          variant="outlined"
                          sx={{ 
                            borderColor: getRiskColor(procedureDetails.riskRating),
                            color: getRiskColor(procedureDetails.riskRating),
                            fontWeight: 600
                          }}
                        />
                        <Chip 
                          icon={<Schedule />}
                          label={`Review: ${procedureDetails.periodicReview}`}
                          color="info"
                          variant="outlined"
                          sx={{ fontWeight: 600 }}
                        />
                        <Chip 
                          icon={<CheckCircle />}
                          label={`Status: ${procedureDetails.status}`}
                          color={getStatusColor(procedureDetails.status)}
                          variant="outlined"
                          sx={{ fontWeight: 600 }}
                        />
                      </Stack>
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                      <Stack alignItems="center" spacing={2}>
                        <Box sx={{ position: 'relative' }}>
                          <ScoreDisplay score={procedureDetails.qualityScore}>
                            <Box sx={{ 
                              position: 'absolute', 
                              zIndex: 2, 
                              display: 'flex', 
                              flexDirection: 'column', 
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '100%',
                              height: '100%'
                            }}>
                              <Typography 
                                variant="h3" 
                                fontWeight={900} 
                                color={qualityInfo.color}
                                sx={{ 
                                  lineHeight: 1,
                                  textAlign: 'center'
                                }}
                              >
                                {procedureDetails.qualityScore}%
                              </Typography>
                            </Box>
                          </ScoreDisplay>
                        </Box>
                        
                        <Stack alignItems="center" spacing={1}>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            {React.cloneElement(qualityInfo.icon, { 
                              sx: { color: qualityInfo.color, fontSize: 24 } 
                            })}
                            <Typography variant="h5" fontWeight={700} color={qualityInfo.color}>
                              {qualityInfo.level}
                            </Typography>
                          </Stack>
                          <Typography variant="body2" color="text.secondary" fontWeight={600}>
                            Document Quality Assessment
                          </Typography>
                        </Stack>
                      </Stack>
                    </Grid>
                  </Grid>
                </CardContent>
              </ProfessionalCard>
            </motion.div>

            {/* ✅ ENHANCED: Latest Version Download Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <ProfessionalCard 
                variant="info"
                sx={{ 
                  mb: 4,
                  border: '3px solid #3498DB',
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)'
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  <Grid container spacing={3} alignItems="center">
                    <Grid item xs={12} md={8}>
                      <Stack direction="row" alignItems="center" spacing={3}>
                        <Box sx={{
                          background: 'linear-gradient(135deg, #3498DB 0%, #2980B9 100%)',
                          borderRadius: '50%',
                          p: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <GetApp sx={{ fontSize: 32, color: 'white' }} />
                        </Box>
                        
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h5" fontWeight={700} color="#2980B9" gutterBottom>
                            📥 Latest Document Version
                          </Typography>
                          <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                            {hasAmendments ? 
                              `Amendment #${totalAmendments} - ${procedureDetails.latestAmendmentSummary || 'Latest changes'}` :
                              'Original document version (no amendments yet)'
                            }
                          </Typography>
                          {hasAmendments && latestAmendment && (
                            <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                              <Typography variant="caption" color="text.secondary">
                                📅 Last updated: {formatDate(latestAmendment.date)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                👤 By: {latestAmendment.amendedBy}
                              </Typography>
                              <Typography variant="caption" color="#2980B9" fontWeight="bold">
                                📊 Score: {latestAmendment.newScore}%
                              </Typography>
                            </Stack>
                          )}
                        </Box>
                      </Stack>
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                      <Stack spacing={2}>
                        <Button
                          variant="contained"
                          size="large"
                          fullWidth
                          startIcon={<CloudDownload />}
                          onClick={handleDownloadLatest}
                          sx={{
                            background: 'linear-gradient(135deg, #3498DB 0%, #2980B9 100%)',
                            borderRadius: '12px',
                            py: 2,
                            fontWeight: 700,
                            fontSize: '1.1rem',
                            boxShadow: '0 6px 20px rgba(52,152,219,0.3)',
                            '&:hover': {
                              boxShadow: '0 8px 25px rgba(52,152,219,0.4)',
                              transform: 'translateY(-2px)'
                            }
                          }}
                        >
                          Download Latest
                        </Button>
                        
                        <Button
                          variant="outlined"
                          size="medium"
                          fullWidth
                          startIcon={<Launch />}
                          onClick={handleOpenInSharePoint}
                          sx={{ 
                            borderColor: '#3498DB',
                            color: '#3498DB',
                            borderRadius: '8px',
                            fontWeight: 600,
                            '&:hover': {
                              borderColor: '#2980B9',
                              backgroundColor: alpha('#3498DB', 0.1)
                            }
                          }}
                        >
                          Open in SharePoint
                        </Button>
                      </Stack>
                    </Grid>
                  </Grid>
                </CardContent>
              </ProfessionalCard>
            </motion.div>

            {/* Amendment History Section */}
            {hasAmendments && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <ProfessionalCard 
                  variant="info"
                  sx={{ mb: 4 }}
                >
                  <CardContent sx={{ p: 0 }}>
                    {/* Amendment Header */}
                    <Box sx={{ 
                      background: 'linear-gradient(135deg, #3498DB 0%, #2980B9 100%)',
                      color: 'white',
                      p: 3
                    }}>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <TimelineIcon sx={{ fontSize: 28 }} />
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" fontWeight={700}>
                            Amendment History
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.9 }}>
                            Complete tracking of all procedure amendments and quality improvements
                          </Typography>
                        </Box>
                        <Chip 
                          label={`${totalAmendments} Amendment${totalAmendments !== 1 ? 's' : ''}`}
                          sx={{ 
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            color: 'white',
                            fontWeight: 'bold'
                          }}
                        />
                      </Stack>
                    </Box>

                    {/* Amendment Summary Stats */}
                    <Box sx={{ p: 3, bgcolor: '#f8f9fa' }}>
                      <Grid container spacing={3}>
                        <Grid item xs={12} sm={3}>
                          <ProfessionalPaper sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" fontWeight="bold" color={HSBCColors.professional.info}>
                              {totalAmendments}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Total Amendments
                            </Typography>
                          </ProfessionalPaper>
                        </Grid>
                        
                        <Grid item xs={12} sm={3}>
                          <ProfessionalPaper sx={{ textAlign: 'center' }}>
                            <Typography 
                              variant="h4" 
                              fontWeight="bold" 
                              color={getScoreColor(procedureDetails.qualityScore)}
                            >
                              {procedureDetails.qualityScore}%
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Current Score
                            </Typography>
                          </ProfessionalPaper>
                        </Grid>

                        <Grid item xs={12} sm={3}>
                          <ProfessionalPaper sx={{ textAlign: 'center' }}>
                            <Typography 
                              variant="h4" 
                              fontWeight="bold" 
                              color="text.secondary"
                            >
                              {procedureDetails.previousScore || 0}%
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Previous Score
                            </Typography>
                          </ProfessionalPaper>
                        </Grid>

                        <Grid item xs={12} sm={3}>
                          <ProfessionalPaper sx={{ textAlign: 'center' }}>
                            <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
                              {getScoreChangeIcon(
                                (procedureDetails.qualityScore || 0) - 
                                (procedureDetails.previousScore || 0)
                              )}
                              <Typography 
                                variant="h4" 
                                fontWeight="bold"
                                color={
                                  (procedureDetails.qualityScore || 0) - 
                                  (procedureDetails.previousScore || 0) > 0 
                                  ? HSBCColors.professional.success : HSBCColors.professional.error
                                }
                              >
                                {(procedureDetails.qualityScore || 0) - 
                                 (procedureDetails.previousScore || 0) > 0 ? '+' : ''}
                                {(procedureDetails.qualityScore || 0) - 
                                 (procedureDetails.previousScore || 0)}%
                              </Typography>
                            </Stack>
                            <Typography variant="caption" color="text.secondary">
                              Score Change
                            </Typography>
                          </ProfessionalPaper>
                        </Grid>
                      </Grid>
                    </Box>

                    {/* Latest Amendment Summary */}
                    {latestAmendment && (
                      <Box sx={{ p: 3, bgcolor: alpha(HSBCColors.professional.info, 0.05) }}>
                        <Alert severity="info" sx={{ mb: 0 }}>
                          <Typography variant="body2" fontWeight="bold" gutterBottom>
                            Latest Amendment (#{latestAmendment.amendmentNumber})
                          </Typography>
                          <Typography variant="body2">
                            <strong>Summary:</strong> {latestAmendment.summary}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Date:</strong> {formatDate(latestAmendment.date)} by {latestAmendment.amendedBy}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Quality Impact:</strong> {latestAmendment.previousScore}% → {latestAmendment.newScore}% 
                            ({latestAmendment.scoreChange > 0 ? '+' : ''}{latestAmendment.scoreChange}%)
                          </Typography>
                        </Alert>
                      </Box>
                    )}

                  </CardContent>
                </ProfessionalCard>
              </motion.div>
            )}

            {/* Detailed Amendment Timeline */}
            {hasAmendments && (
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6" fontWeight="bold">
                    📋 Detailed Amendment Timeline
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 0 }}>
                  <CustomTimeline>
                    {amendmentHistory.slice().reverse().map((amendment, index) => (
                      <CustomTimelineItem key={amendment.amendmentNumber}>
                        <CustomTimelineDot 
                          variant={index === 0 ? 'primary' : 'default'}
                        >
                          #{amendment.amendmentNumber}
                        </CustomTimelineDot>
                        
                        <CustomTimelineContent>
                          <ProfessionalCard sx={{ 
                            mb: 2,
                            border: index === 0 ? `2px solid ${HSBCColors.professional.info}` : '1px solid #e0e0e0',
                            bgcolor: index === 0 ? alpha(HSBCColors.professional.info, 0.05) : 'white'
                          }}>
                            <CardContent sx={{ p: 3 }}>
                              <Grid container spacing={2}>
                                <Grid item xs={12} md={8}>
                                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                                    Amendment #{amendment.amendmentNumber}
                                    {index === 0 && (
                                      <Chip 
                                        label="Latest" 
                                        color="primary" 
                                        size="small" 
                                        sx={{ ml: 1 }} 
                                      />
                                    )}
                                  </Typography>
                                  
                                  <Typography variant="body1" gutterBottom sx={{ fontStyle: 'italic' }}>
                                    "{amendment.summary}"
                                  </Typography>

                                  <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                      <Person sx={{ fontSize: 16, color: 'text.secondary' }} />
                                      <Typography variant="body2">
                                        {amendment.amendedBy} ({amendment.amendedByRole})
                                      </Typography>
                                    </Stack>
                                    
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                      <CalendarToday sx={{ fontSize: 16, color: 'text.secondary' }} />
                                      <Typography variant="body2">
                                        {formatDate(amendment.date)}
                                      </Typography>
                                    </Stack>
                                  </Stack>
                                </Grid>

                                <Grid item xs={12} md={4}>
                                  <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                      Quality Score Change
                                    </Typography>
                                    
                                    <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
                                      <Typography 
                                        variant="h6" 
                                        fontWeight="bold"
                                        color={getScoreColor(amendment.previousScore)}
                                      >
                                        {amendment.previousScore}%
                                      </Typography>
                                      
                                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        {getScoreChangeIcon(amendment.scoreChange)}
                                      </Box>
                                      
                                      <Typography 
                                        variant="h6" 
                                        fontWeight="bold"
                                        color={getScoreColor(amendment.newScore)}
                                      >
                                        {amendment.newScore}%
                                      </Typography>
                                    </Stack>

                                    <Typography 
                                      variant="body2" 
                                      sx={{ 
                                        mt: 1,
                                        color: amendment.scoreChange > 0 ? HSBCColors.professional.success : HSBCColors.professional.error,
                                        fontWeight: 'bold'
                                      }}
                                    >
                                      {amendment.scoreChange > 0 ? '+' : ''}{amendment.scoreChange}% change
                                    </Typography>

                                    {amendment.scoreChange > 0 && (
                                      <Chip 
                                        label="Improvement"
                                        color="success"
                                        size="small"
                                        sx={{ mt: 1 }}
                                      />
                                    )}
                                  </Box>
                                </Grid>
                              </Grid>

                              {/* File and Technical Details */}
                              <Divider sx={{ my: 2 }} />
                              <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                  <Typography variant="caption" color="text.secondary">
                                    File Details
                                  </Typography>
                                  <Typography variant="body2">
                                    📁 {amendment.fileName} 
                                    {amendment.fileRenamed && (
                                      <Chip 
                                        label="Renamed" 
                                        size="small" 
                                        color="warning" 
                                        sx={{ ml: 1, fontSize: '0.6rem', height: 16 }} 
                                      />
                                    )}
                                    ({formatFileSize(amendment.fileSize)})
                                  </Typography>
                                  {amendment.fileRenamed && (
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                      💾 Saved as: {amendment.actualFileName}
                                    </Typography>
                                  )}
                                  <Typography variant="body2">
                                    📂 {amendment.actualSubFolder}
                                  </Typography>
                                </Grid>
                                
                                <Grid item xs={12} sm={6}>
                                  <Typography variant="caption" color="text.secondary">
                                    Actions
                                  </Typography>
                                  <Stack direction="row" spacing={1}>
                                    <Button
                                      size="small"
                                      startIcon={<CloudDownload />}
                                      onClick={() => handleDownloadVersion(amendment, amendment.amendmentNumber)}
                                      sx={{
                                        background: 'linear-gradient(135deg, #27AE60 0%, #229954 100%)',
                                        color: 'white',
                                        fontWeight: 600,
                                        '&:hover': {
                                          background: 'linear-gradient(135deg, #229954 0%, #1e8449 100%)'
                                        }
                                      }}
                                    >
                                      Download v{amendment.amendmentNumber}
                                    </Button>
                                    <Button
                                      size="small"
                                      startIcon={<Description />}
                                      onClick={() => {
                                        const details = amendment.analysisDetails || {};
                                        const recommendations = amendment.aiRecommendations || [];
                                        
                                        let analysisText = `📊 Amendment #${amendment.amendmentNumber} Analysis:\n\n`;
                                        
                                        if (details.foundElements) {
                                          analysisText += `✅ Found Elements: ${details.foundElements.length}\n`;
                                        }
                                        if (details.missingElements) {
                                          analysisText += `❌ Missing Elements: ${details.missingElements.length}\n`;
                                        }
                                        if (details.templateCompliance) {
                                          analysisText += `📋 Template Compliance: ${details.templateCompliance}\n`;
                                        }
                                        
                                        if (recommendations.length > 0) {
                                          analysisText += `\n💡 AI Recommendations:\n`;
                                          recommendations.forEach((rec, idx) => {
                                            analysisText += `${idx + 1}. ${rec.message || rec}\n`;
                                          });
                                        }
                                        
                                        if (analysisText.trim() === `📊 Amendment #${amendment.amendmentNumber} Analysis:`) {
                                          analysisText += 'No detailed analysis data available for this amendment.';
                                        }
                                        
                                        alert(analysisText);
                                      }}
                                    >
                                      Analysis
                                    </Button>
                                  </Stack>
                                </Grid>
                              </Grid>
                            </CardContent>
                          </ProfessionalCard>
                        </CustomTimelineContent>
                      </CustomTimelineItem>
                    ))}
                  </CustomTimeline>
                </AccordionDetails>
              </Accordion>
            )}

            {/* No Amendments Message */}
            {!hasAmendments && (
              <ProfessionalCard sx={{ mb: 4, textAlign: 'center', bgcolor: '#f8f9fa' }}>
                <CardContent sx={{ p: 4 }}>
                  <History sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No Amendments Yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    This procedure has not been amended since its initial upload.
                  </Typography>
                </CardContent>
              </ProfessionalCard>
            )}

            <Grid container spacing={4}>
              {/* LEFT COLUMN - Document Information */}
              <Grid item xs={12} lg={8}>
                <Stack spacing={3}>
                  {/* Document Details */}
                  <ProfessionalCard>
                    <CardHeader
                      avatar={
                        <ProfessionalLogo size={50}>
                          <Description sx={{ color: 'white', fontSize: 20 }} />
                        </ProfessionalLogo>
                      }
                      title={
                        <Typography variant="h5" fontWeight={700}>
                          Document Information
                        </Typography>
                      }
                      subheader={
                        <Typography variant="body2" color="text.secondary">
                          Complete document metadata and analysis
                        </Typography>
                      }
                    />
                    
                    <CardContent>
                      <Grid container spacing={3}>
                        <Grid item xs={12} sm={6}>
                          <ProfessionalPaper>
                            <Stack direction="row" alignItems="center" spacing={2}>
                              <CalendarToday sx={{ color: HSBCColors.professional.info }} />
                              <Box>
                                <Typography variant="body2" color="text.secondary">
                                  Uploaded On
                                </Typography>
                                <Typography variant="body1" fontWeight={700}>
                                  {formatDate(procedureDetails.uploadedOn)}
                                </Typography>
                              </Box>
                            </Stack>
                          </ProfessionalPaper>
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                          <ProfessionalPaper>
                            <Stack direction="row" alignItems="center" spacing={2}>
                              <Schedule sx={{ color: HSBCColors.professional.info }} />
                              <Box>
                                <Typography variant="body2" color="text.secondary">
                                  Last Modified
                                </Typography>
                                <Typography variant="body1" fontWeight={700}>
                                  {formatDate(procedureDetails.modifiedOn)}
                                </Typography>
                              </Box>
                            </Stack>
                          </ProfessionalPaper>
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                          <ProfessionalPaper>
                            <Stack direction="row" alignItems="center" spacing={2}>
                              {expiryStatus?.icon && React.cloneElement(expiryStatus.icon, { 
                                sx: { color: expiryStatus.color } 
                              })}
                              <Box>
                                <Typography variant="body2" color="text.secondary">
                                  Expiry Date
                                </Typography>
                                <Typography variant="body1" fontWeight={700}>
                                  {formatDate(procedureDetails.expiry)}
                                </Typography>
                                {daysLeft !== null && (
                                  <Typography variant="caption" sx={{ color: expiryStatus?.color, fontWeight: 700 }}>
                                    {expiryStatus?.text}
                                  </Typography>
                                )}
                              </Box>
                            </Stack>
                          </ProfessionalPaper>
                        </Grid>
                        
                        {procedureDetails.signOffDate && (
                          <Grid item xs={12} sm={6}>
                            <ProfessionalPaper>
                              <Stack direction="row" alignItems="center" spacing={2}>
                                <CheckCircle sx={{ color: HSBCColors.professional.success }} />
                                <Box>
                                  <Typography variant="body2" color="text.secondary">
                                    Sign-off Date
                                  </Typography>
                                  <Typography variant="body1" fontWeight={700}>
                                    {formatDate(procedureDetails.signOffDate)}
                                  </Typography>
                                </Box>
                              </Stack>
                            </ProfessionalPaper>
                          </Grid>
                        )}
                        
                        <Grid item xs={12} sm={6}>
                          <ProfessionalPaper>
                            <Stack direction="row" alignItems="center" spacing={2} sx={{ width: '100%' }}>
                              <Description sx={{ color: HSBCColors.primary, flexShrink: 0 }} />
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                  Original Filename
                                </Typography>
                                <Tooltip title={procedureDetails.originalFilename || 'Not available'} arrow>
                                  <Typography 
                                    variant="body1" 
                                    fontWeight={700}
                                    sx={{
                                      wordBreak: 'break-word',
                                      overflowWrap: 'break-word',
                                      display: '-webkit-box',
                                      WebkitLineClamp: 2,
                                      WebkitBoxOrient: 'vertical',
                                      overflow: 'hidden',
                                      lineHeight: 1.2
                                    }}
                                  >
                                    {procedureDetails.originalFilename || 'Not available'}
                                  </Typography>
                                </Tooltip>
                              </Box>
                            </Stack>
                                                    </ProfessionalPaper>
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                          <ProfessionalPaper>
                            <Stack direction="row" alignItems="center" spacing={2}>
                              <CloudDownload sx={{ color: HSBCColors.primary }} />
                              <Box>
                                <Typography variant="body2" color="text.secondary">
                                  File Size
                                </Typography>
                                <Typography variant="body1" fontWeight={700}>
                                  {formatFileSize(procedureDetails.fileSize)}
                                </Typography>
                              </Box>
                            </Stack>
                          </ProfessionalPaper>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </ProfessionalCard>

                  {/* AI Analysis Section */}
                  {(procedureDetails.foundElements?.length > 0 || procedureDetails.aiRecommendations?.length > 0) && (
                    <ProfessionalCard>
                      <CardHeader
                        avatar={
                          <ProfessionalLogo size={50}>
                            <Psychology sx={{ color: 'white', fontSize: 20 }} />
                          </ProfessionalLogo>
                        }
                        title={
                          <Typography variant="h5" fontWeight={700}>
                            AI Document Analysis
                          </Typography>
                        }
                        subheader={
                          <Typography variant="body2" color="text.secondary">
                            Intelligent analysis results and recommendations
                          </Typography>
                        }
                        action={
                          <Chip 
                            icon={<AutoAwesome />}
                            label="AI Powered"
                            color="secondary"
                            variant="outlined"
                            sx={{ fontWeight: 600 }}
                          />
                        }
                      />
                      
                      <CardContent>
                        {procedureDetails.foundElements?.length > 0 && (
                          <Accordion defaultExpanded sx={{ mb: 2, borderRadius: '8px !important' }}>
                            <AccordionSummary 
                              expandIcon={<ExpandMore />}
                              sx={{ 
                                background: alpha(HSBCColors.professional.success, 0.05),
                                borderRadius: '8px'
                              }}
                            >
                              <Stack direction="row" alignItems="center" spacing={2}>
                                <CheckCircle sx={{ color: HSBCColors.professional.success }} />
                                <Typography variant="h6" fontWeight={700}>
                                  ✅ Found Elements ({procedureDetails.foundElements.length})
                                </Typography>
                              </Stack>
                            </AccordionSummary>
                            <AccordionDetails>
                              <Grid container spacing={1}>
                                {procedureDetails.foundElements.map((element, index) => (
                                  <Grid item xs={12} sm={6} key={index}>
                                    <ProfessionalPaper>
                                      <Stack direction="row" alignItems="center" spacing={1}>
                                        <CheckCircle sx={{ color: HSBCColors.professional.success, fontSize: 20 }} />
                                        <Typography variant="body2" fontWeight={600}>
                                          {element}
                                        </Typography>
                                      </Stack>
                                    </ProfessionalPaper>
                                  </Grid>
                                ))}
                              </Grid>
                            </AccordionDetails>
                          </Accordion>
                        )}

                        {procedureDetails.aiRecommendations?.length > 0 && (
                          <Accordion sx={{ borderRadius: '8px !important' }}>
                            <AccordionSummary 
                              expandIcon={<ExpandMore />}
                              sx={{ 
                                background: alpha(HSBCColors.professional.info, 0.05),
                                borderRadius: '8px'
                              }}
                            >
                              <Stack direction="row" alignItems="center" spacing={2}>
                                <Insights sx={{ color: HSBCColors.professional.info }} />
                                <Typography variant="h6" fontWeight={700}>
                                  💡 AI Recommendations ({procedureDetails.aiRecommendations.length})
                                </Typography>
                              </Stack>
                            </AccordionSummary>
                            <AccordionDetails>
                              <Stack spacing={2}>
                                {procedureDetails.aiRecommendations.map((rec, index) => (
                                  <ProfessionalPaper key={index}>
                                    <Stack direction="row" alignItems="flex-start" spacing={2}>
                                      <TrendingUp sx={{ color: HSBCColors.professional.info, fontSize: 24, mt: 0.5 }} />
                                      <Box>
                                        <Typography variant="body1" fontWeight={600} gutterBottom>
                                          Recommendation #{index + 1}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                          {rec}
                                        </Typography>
                                      </Box>
                                    </Stack>
                                  </ProfessionalPaper>
                                ))}
                              </Stack>
                            </AccordionDetails>
                          </Accordion>
                        )}
                      </CardContent>
                    </ProfessionalCard>
                  )}
                </Stack>
              </Grid>

              {/* RIGHT COLUMN - People & Timeline */}
              <Grid item xs={12} lg={4}>
                <Stack spacing={3}>
                  {/* Procedure Owners */}
                  <ProfessionalCard>
                    <CardHeader
                      avatar={
                        <ProfessionalLogo size={50}>
                          <Person sx={{ color: 'white', fontSize: 20 }} />
                        </ProfessionalLogo>
                      }
                      title={
                        <Typography variant="h5" fontWeight={700}>
                          Procedure Owners
                        </Typography>
                      }
                      subheader={
                        <Typography variant="body2" color="text.secondary">
                          Responsible stakeholders and contacts
                        </Typography>
                      }
                    />
                    
                    <CardContent>
                      <Stack spacing={3}>
                        {/* Primary Owner */}
                        {procedureDetails.primaryOwner && (
                          <ProfessionalCard accent={true}>
                            <CardContent sx={{ p: 3, background: HSBCColors.gradients.accent, borderRadius: '8px' }}>
                              <Stack direction="row" alignItems="center" spacing={2}>
                                <Avatar sx={{ 
                                  width: 60, 
                                  height: 60,
                                  background: 'rgba(255,255,255,0.9)',
                                  color: HSBCColors.primary,
                                  fontSize: '1.5rem',
                                  fontWeight: 900
                                }}>
                                  {procedureDetails.primaryOwner[0]}
                                </Avatar>
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', mb: 0.5 }}>
                                    Primary Owner
                                  </Typography>
                                  <Typography variant="h6" fontWeight={800} color="white" gutterBottom>
                                    {procedureDetails.primaryOwner}
                                  </Typography>
                                  {procedureDetails.primaryOwnerEmail && (
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                      <Email sx={{ fontSize: 16, color: 'rgba(255,255,255,0.8)' }} />
                                      <Link 
                                        href={`mailto:${procedureDetails.primaryOwnerEmail}`}
                                        sx={{ 
                                          color: 'rgba(255,255,255,0.9)',
                                          textDecoration: 'none',
                                          '&:hover': { textDecoration: 'underline' }
                                        }}
                                      >
                                        <Typography variant="body2">
                                          {procedureDetails.primaryOwnerEmail}
                                        </Typography>
                                      </Link>
                                    </Stack>
                                  )}
                                </Box>
                              </Stack>
                            </CardContent>
                          </ProfessionalCard>
                        )}

                        {/* Secondary Owner */}
                        {procedureDetails.secondaryOwner && (
                          <ProfessionalCard variant="info">
                            <CardContent sx={{ p: 3 }}>
                              <Stack direction="row" alignItems="center" spacing={2}>
                                <Avatar sx={{ 
                                  width: 60, 
                                  height: 60,
                                  background: HSBCColors.professional.info,
                                  color: 'white',
                                  fontSize: '1.5rem',
                                  fontWeight: 900
                                }}>
                                  {procedureDetails.secondaryOwner[0]}
                                </Avatar>
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Secondary Owner
                                  </Typography>
                                  <Typography variant="h6" fontWeight={700} gutterBottom>
                                    {procedureDetails.secondaryOwner}
                                  </Typography>
                                  {procedureDetails.secondaryOwnerEmail && (
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                      <Email sx={{ fontSize: 16, color: 'text.secondary' }} />
                                      <Link href={`mailto:${procedureDetails.secondaryOwnerEmail}`}>
                                        <Typography variant="body2">
                                          {procedureDetails.secondaryOwnerEmail}
                                        </Typography>
                                      </Link>
                                    </Stack>
                                  )}
                                </Box>
                              </Stack>
                            </CardContent>
                          </ProfessionalCard>
                        )}

                        {/* Uploaded By */}
                        {procedureDetails.uploadedBy && (
                          <ProfessionalPaper>
                            <Stack direction="row" alignItems="center" spacing={2}>
                              <Avatar sx={{ 
                                background: HSBCColors.gradients.accent,
                                color: 'white',
                                fontWeight: 900
                              }}>
                                {procedureDetails.uploadedBy[0]}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" color="text.secondary">
                                  Uploaded By
                                </Typography>
                                <Typography variant="body1" fontWeight={700}>
                                  {procedureDetails.uploadedBy}
                                </Typography>
                              </Box>
                            </Stack>
                          </ProfessionalPaper>
                        )}
                      </Stack>
                    </CardContent>
                  </ProfessionalCard>

                  {/* Enhanced Procedure Timeline */}
                  <ProfessionalCard>
                    <CardHeader
                      avatar={
                        <ProfessionalLogo size={50}>
                          <TimelineIcon sx={{ color: 'white', fontSize: 20 }} />
                        </ProfessionalLogo>
                      }
                      title={
                        <Typography variant="h5" fontWeight={700}>
                          Procedure Timeline
                        </Typography>
                      }
                      subheader={
                        <Typography variant="body2" color="text.secondary">
                          Key dates and milestones
                        </Typography>
                      }
                    />
                    
                    <CardContent>
                      <Stack spacing={3}>
                        {/* Document Uploaded */}
                        <ProfessionalPaper>
                          <Stack direction="row" alignItems="center" spacing={3}>
                            <Avatar sx={{ 
                              background: HSBCColors.professional.success,
                              width: 48, 
                              height: 48
                            }}>
                              <CloudDownload sx={{ color: 'white', fontSize: 24 }} />
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="h6" fontWeight={700} color={HSBCColors.professional.success}>
                                Document Uploaded
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                {formatDate(procedureDetails.uploadedOn)}
                              </Typography>
                              <Chip 
                                label="Initial Upload"
                                size="small"
                                sx={{ 
                                  backgroundColor: alpha(HSBCColors.professional.success, 0.1),
                                  color: HSBCColors.professional.success,
                                  fontWeight: 600,
                                  fontSize: '0.7rem'
                                }}
                              />
                            </Box>
                          </Stack>
                        </ProfessionalPaper>

                        {/* Sign-off (if available) */}
                        {procedureDetails.signOffDate && (
                          <ProfessionalPaper>
                            <Stack direction="row" alignItems="center" spacing={3}>
                              <Avatar sx={{ 
                                background: HSBCColors.professional.info,
                                width: 48, 
                                height: 48
                              }}>
                                <CheckCircle sx={{ color: 'white', fontSize: 24 }} />
                              </Avatar>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="h6" fontWeight={700} color={HSBCColors.professional.info}>
                                  Document Signed Off
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                  {formatDate(procedureDetails.signOffDate)}
                                </Typography>
                                <Chip 
                                  label="Approved"
                                  size="small"
                                  sx={{ 
                                    backgroundColor: alpha(HSBCColors.professional.info, 0.1),
                                    color: HSBCColors.professional.info,
                                    fontWeight: 600,
                                    fontSize: '0.7rem'
                                  }}
                                />
                              </Box>
                            </Stack>
                          </ProfessionalPaper>
                        )}

                        {/* Last Modified */}
                        <ProfessionalPaper>
                          <Stack direction="row" alignItems="center" spacing={3}>
                            <Avatar sx={{ 
                              background: HSBCColors.professional.warning,
                              width: 48, 
                              height: 48
                            }}>
                              <Schedule sx={{ color: 'white', fontSize: 24 }} />
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="h6" fontWeight={700} color={HSBCColors.professional.warning}>
                                Last Modified
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                {formatDate(procedureDetails.modifiedOn)}
                              </Typography>
                              <Chip 
                                label="Updated"
                                size="small"
                                sx={{ 
                                  backgroundColor: alpha(HSBCColors.professional.warning, 0.1),
                                  color: HSBCColors.professional.warning,
                                  fontWeight: 600,
                                  fontSize: '0.7rem'
                                }}
                              />
                            </Box>
                          </Stack>
                        </ProfessionalPaper>

                        {/* Expiry Date */}
                        <ProfessionalPaper>
                          <Stack direction="row" alignItems="center" spacing={3}>
                            <Avatar sx={{ 
                              background: expiryStatus?.color || HSBCColors.professional.success,
                              width: 48, 
                              height: 48
                            }}>
                              {expiryStatus?.icon && React.cloneElement(expiryStatus.icon, { 
                                sx: { color: 'white', fontSize: 24 } 
                              })}
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="h6" fontWeight={700} sx={{ color: expiryStatus?.color || HSBCColors.professional.success }}>
                                Expires
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                {formatDate(procedureDetails.expiry)}
                              </Typography>
                              {daysLeft !== null && (
                                <Chip 
                                  label={expiryStatus?.text}
                                  size="small"
                                  sx={{ 
                                    backgroundColor: alpha(expiryStatus?.color || HSBCColors.professional.success, 0.1),
                                    color: expiryStatus?.color || HSBCColors.professional.success,
                                    fontWeight: 600,
                                    fontSize: '0.7rem'
                                  }}
                                />
                              )}
                            </Box>
                          </Stack>
                        </ProfessionalPaper>
                      </Stack>
                    </CardContent>
                  </ProfessionalCard>

                  {/* Document Owners (Extracted) */}
                  {procedureDetails.documentOwners?.length > 0 && (
                    <ProfessionalCard variant="success">
                      <CardHeader
                        avatar={
                          <ProfessionalLogo size={50}>
                            <Grade sx={{ color: 'white', fontSize: 20 }} />
                          </ProfessionalLogo>
                        }
                        title={
                          <Typography variant="h5" fontWeight={700}>
                            Document Owners
                          </Typography>
                        }
                        subheader={
                          <Typography variant="body2" color="text.secondary">
                            Extracted from document content
                          </Typography>
                        }
                        action={
                          <Chip 
                            icon={<Psychology />}
                            label="AI Extracted"
                            size="small"
                            color="success"
                            variant="outlined"
                            sx={{ fontWeight: 600 }}
                          />
                        }
                      />
                      
                      <CardContent>
                        <Stack spacing={2}>
                          {procedureDetails.documentOwners.map((owner, index) => (
                            <ProfessionalPaper key={index}>
                              <Stack direction="row" alignItems="center" spacing={2}>
                                <Person sx={{ color: HSBCColors.professional.success }} />
                                <Typography variant="body2" fontWeight={600}>
                                  {owner}
                                </Typography>
                              </Stack>
                            </ProfessionalPaper>
                          ))}
                        </Stack>
                      </CardContent>
                    </ProfessionalCard>
                  )}
                </Stack>
              </Grid>
            </Grid>
          </Box>
        ) : (
          /* No Data State */
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <ProfessionalCard>
              <CardContent sx={{ p: 6 }}>
                <Assignment sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h5" color="text.secondary">
                  No procedure details available
                </Typography>
              </CardContent>
            </ProfessionalCard>
          </Box>
        )}
      </DialogContent>

      {/* PROFESSIONAL ACTION BUTTONS */}
      <DialogActions sx={{ 
        p: 3, 
        background: HSBCColors.professional.background, 
        borderTop: `1px solid ${HSBCColors.professional.border}`
      }}>
        <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
          <Button 
            onClick={onClose} 
            variant="outlined"
            sx={{ 
              borderRadius: '8px',
              px: 3,
              py: 1.5,
              fontWeight: 700,
              flex: 1
            }}
          >
            Close
          </Button>
          
          <Button 
            variant="contained" 
            startIcon={<CloudDownload />}
            onClick={handleDownloadLatest}
            sx={{
              background: 'linear-gradient(135deg, #3498DB 0%, #2980B9 100%)',
              borderRadius: '8px',
              px: 4,
              py: 1.5,
              fontWeight: 700,
              flex: 2,
              boxShadow: '0 4px 16px rgba(52,152,219,0.2)'
            }}
          >
            Download Latest Version
          </Button>
          
          {/* Amendment Button for Admin Users */}
          {user?.role === 'admin' && onAmend && (
            <Button 
              variant="contained" 
              startIcon={<Edit />}
              onClick={() => onAmend(procedureDetails)}
              sx={{
                background: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)',
                borderRadius: '8px',
                px: 4,
                py: 1.5,
                fontWeight: 700,
                flex: 2,
                boxShadow: '0 4px 16px rgba(255,152,0,0.2)'
              }}
            >
              Create Amendment
            </Button>
          )}
          
          {user?.role === 'admin' && (
            <Tooltip title="Admin Actions">
              <IconButton
                sx={{
                  background: HSBCColors.professional.warning,
                  color: 'white',
                  width: 48,
                  height: 48,
                  '&:hover': {
                    background: alpha(HSBCColors.professional.warning, 0.8),
                    transform: 'scale(1.05)'
                  }
                }}
              >
                <AdminPanelSettings />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </DialogActions>

      {/* PROFESSIONAL SHARE BUTTON */}
      <AnimatePresence>
        {procedureDetails && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ type: "spring", stiffness: 200, delay: 1 }}
            style={{
              position: 'absolute',
              bottom: 100,
              right: 24,
              zIndex: 1000
            }}
          >
            <Tooltip title="Share Procedure" placement="left">
              <Fab
                size="medium"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: procedureDetails.name,
                      text: `Check out this procedure: ${procedureDetails.name}`,
                      url: window.location.href
                    }).catch(() => {
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText(window.location.href);
                        alert('Link copied to clipboard!');
                      }
                    });
                  } else if (navigator.clipboard) {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Link copied to clipboard!');
                  }
                }}
                sx={{
                  background: HSBCColors.professional.info,
                  color: 'white',
                  boxShadow: '0 4px 16px rgba(52,152,219,0.3)',
                  '&:hover': {
                    transform: 'scale(1.1)',
                    boxShadow: '0 6px 20px rgba(52,152,219,0.4)'
                  }
                }}
              >
                <Share />
              </Fab>
            </Tooltip>
          </motion.div>
        )}
      </AnimatePresence>
    </ProfessionalDialog>
  );
};

export default ProcedureDetailsModal;
                          
