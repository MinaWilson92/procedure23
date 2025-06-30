// components/ProcedureDetailsModal.js - Next-Gen HSBC Professional Modal Experience
import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, 
  Grid, Card, CardContent, Chip, Divider, List, ListItem, ListItemIcon, 
  ListItemText, Avatar, LinearProgress, Alert, IconButton, Skeleton, Link,
  Stack, Paper, Tooltip, Badge, useTheme, styled, keyframes, alpha,
  CardHeader, Accordion, AccordionSummary, AccordionDetails, Fab
} from '@mui/material';

// 🎯 **ADD ALL MISSING ICON IMPORTS:**
import {
  Close, Visibility, Description, CalendarToday, Schedule, CheckCircle,
  CloudDownload, Email, Person, Security, Business, Warning, ErrorIcon,
  LocalFireDepartment, AutoAwesome, Psychology, Insights, TrendingUp,
  ExpandMore, Grade, AdminPanelSettings, Share, Assignment, LinkIcon,
  Timeline as TimelineIcon, Error as ErrorIcon
} from '@mui/icons-material';

// Motion imports
import { motion, AnimatePresence } from 'framer-motion';

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
const HSBCColors = {
  primary: '#DB0011',      // Keep HSBC Red but use sparingly
  secondary: '#9FA1A4',    // HSBC Grey
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
    // Subtle professional gradients
    header: 'linear-gradient(135deg, #2C3E50 0%, #34495E 100%)',
    card: 'linear-gradient(135deg, #FFFFFF 0%, #F8F9FA 100%)',
    accent: 'linear-gradient(135deg, #DB0011 0%, #B50010 100%)', // Only for critical elements
    subtle: 'linear-gradient(135deg, #ECF0F1 0%, #FFFFFF 100%)'
  }
};

// 🌟 **Advanced Animations**
const pulseGlow = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(219, 0, 17, 0.4); }
  70% { box-shadow: 0 0 0 15px rgba(219, 0, 17, 0); }
  100% { box-shadow: 0 0 0 0 rgba(219, 0, 17, 0); }
`;

const floatAnimation = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-8px) rotate(2deg); }
`;

const shimmerAnimation = keyframes`
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
`;

const countUpAnimation = keyframes`
  0% { transform: scale(0.8); opacity: 0; }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); opacity: 1; }
`;

const slideInFromRight = keyframes`
  0% { transform: translateX(100%); opacity: 0; }
  100% { transform: translateX(0); opacity: 1; }
`;

// 🎨 **Styled Components with HSBC Branding**
const ProfessionalCard = styled(Card)(({ theme, variant = 'default', accent = false }) => ({
  background: accent ? 
    HSBCColors.gradients.card : 
    '#FFFFFF',
  border: variant === 'error' ? 
    `2px solid ${HSBCColors.professional.error}` :
    variant === 'warning' ?
    `2px solid ${HSBCColors.professional.warning}` :
    variant === 'success' ?
    `2px solid ${HSBCColors.professional.success}` :
    variant === 'info' ?
    `2px solid ${HSBCColors.professional.info}` :
    accent ?
    `2px solid ${HSBCColors.primary}` :
    `1px solid ${HSBCColors.professional.border}`,
  borderRadius: '8px',
  boxShadow: '0 2px 12px rgba(44,62,80,0.08)',
  transition: 'all 0.2s ease',
  '&:hover': {
    boxShadow: accent ? 
      '0 4px 20px rgba(219,0,17,0.15)' : 
      '0 4px 16px rgba(44,62,80,0.12)',
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
// Fix the ScoreDisplay component
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
  if (score >= 90) return '#4caf50';
  if (score >= 80) return '#8bc34a';
  if (score >= 70) return '#ff9800';
  if (score >= 60) return '#f44336';
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
    return { level: 'Poor', color: HSBCColors.professional.error, icon: <Error /> };
  } else {
    return { level: 'Critical', color: HSBCColors.professional.error, icon: <LocalFireDepartment /> };
  }
};

const getRiskColor = (risk) => {
  switch (risk?.toLowerCase()) {
    case 'high': return '#f44336';
    case 'medium': return '#ff9800';
    case 'low': return '#4caf50';
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
  user 
}) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [procedureDetails, setProcedureDetails] = useState(null);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

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
      'LOB', 'ProcedureSubsection', 'QualityScore', 'OriginalFilename', 'FileSize',
      'UploadedBy', 'UploadedAt', 'Status', 'AnalysisDetails', 'AIRecommendations',
      'RiskRating', 'PeriodicReview', 'DocumentOwners', 'FoundElements', 'DocumentLink', 'SignOffDate'
    ].join(',');

    return `https://teams.global.hsbc/sites/EmployeeEng/_api/web/lists/getbytitle('Procedures')/items(${id})?$select=${selectFields}`;
  };

  useEffect(() => {
    if (open && procedureId) {
      loadProcedureDetails();
    }
  }, [open, procedureId]);

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
      documentOwners: safeJsonParse(spItem.DocumentOwners, [])
    };
  };

  const loadMockDetails = () => {
    setProcedureDetails({
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
      signOffDate: "2024-05-20",
      documentLink: "https://sharepoint.hsbc.com/sites/procedures/documents/risk-framework.pdf",
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
      ]
    });
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
      return { status: 'EXPIRED', color: '#f44336', icon: <ErrorIcon />, text: `EXPIRED (${Math.abs(daysLeft)} days ago)` };
    } else if (daysLeft <= 7) {
      return { status: 'CRITICAL', color: '#d32f2f', icon: <LocalFireDepartment />, text: `URGENT: ${daysLeft} days left` };
    } else if (daysLeft <= 30) {
      return { status: 'EXPIRING', color: '#ff9800', icon: <Schedule />, text: `${daysLeft} days left` };
    } else {
      return { status: 'ACTIVE', color: '#4caf50', icon: <CheckCircle />, text: `${daysLeft} days left` };
    }
  };

  if (!open) return null;

  const qualityInfo = procedureDetails ? getQualityInfo(procedureDetails.qualityScore) : null;
  const daysLeft = procedureDetails ? getDaysUntilExpiry(procedureDetails.expiry) : null;
  const expiryStatus = daysLeft !== null ? getExpiryStatus(daysLeft) : null;

  return (
    <ProfessionalDialog 
      open={open} 
      onClose={onClose}
      maxWidth="xl"
      fullWidth
    >
      {/* 🌟 **NEXT-GEN HEADER with HSBC Branding** */}
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
          /* Enhanced Loading State */
          <Box sx={{ p: 4 }}>
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 3 }} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 3 }} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 3 }} />
                </Grid>
              </Grid>
            </motion.div>
          </Box>
        ) : error ? (
          /* Enhanced Error State */
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <ProfessionalCard variant="error">
                <CardContent sx={{ p: 4 }}>
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <ErrorIcon sx={{ fontSize: 80, color: '#f44336', mb: 2 }} />
                  </motion.div>
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
                      background: HSBCColors.gradients.redPrimary,
                      borderRadius: '12px',
                      px: 4,
                      py: 1.5,
                      fontWeight: 700
                    }}
                  >
                    Retry Loading
                  </Button>
                </CardContent>
              </ProfessionalCard>
            </motion.div>
          </Box>
        ) : procedureDetails ? (
          /* Enhanced Content Display */
          <Box sx={{ p: 4 }}>
            {/* 📊 **HERO SECTION with Quality Score** */}
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
                      <Typography variant="h3" fontWeight={900} gutterBottom>
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
    backgroundColor: `${expiryStatus?.color}10`,
    fontWeight: 600
  }}
/>
                        <Chip 
                          icon={<Business />}
                          label={`${procedureDetails.lob}${procedureDetails.subsection ? ` • ${procedureDetails.subsection}` : ''}`}
                          color="primary"
                          variant="outlined"
                          sx={{ fontWeight: 700 }}
                        />
                        <Chip 
                          icon={<Security />}
                          label={`Risk: ${procedureDetails.riskRating}`}
                          sx={{ 
                            backgroundColor: getRiskColor(procedureDetails.riskRating),
                            color: 'white',
                            fontWeight: 700
                          }}
                        />
                        <Chip 
                          icon={<Schedule />}
                          label={`Review: ${procedureDetails.periodicReview}`}
                          color="info"
                          variant="outlined"
                          sx={{ fontWeight: 700 }}
                        />
                        <Chip 
                          icon={<CheckCircle />}
                          label={`Status: ${procedureDetails.status}`}
                          color={getStatusColor(procedureDetails.status)}
                          sx={{ fontWeight: 700 }}
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
  
  {/* Rotating border animation */}
  <motion.div
    animate={{ rotate: 360 }}
    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
    style={{
      position: 'absolute',
      top: -10,
      left: -10,
      right: -10,
      bottom: -10,
      border: `2px solid ${alpha(qualityInfo.color, 0.3)}`,
      borderRadius: '50%',
      borderTopColor: qualityInfo.color
    }}
  />
</Box>
                        
                        <Stack alignItems="center" spacing={1}>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            {React.cloneElement(qualityInfo.icon, { 
                              sx: { color: qualityInfo.color, fontSize: 24 } 
                            })}
                            <Typography variant="h5" fontWeight={800} color={qualityInfo.color}>
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

            <Grid container spacing={4}>
              {/* 📋 **LEFT COLUMN - Document Information** */}
              <Grid item xs={12} lg={8}>
                <Stack spacing={3}>
                  {/* Document Details */}
                  <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    <ProfessionalCard>
                      <CardHeader
                        avatar={
                          <ProfessionalLogo size={50}>
                            <Description sx={{ color: 'white', fontSize: 20 }} />
                          </ProfessionalLogo>
                        }
                        title={
                          <Typography variant="h5" fontWeight={800}>
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
                            <ProfessionalPaper sx={{ 
  p: 2, 
  borderRadius: '8px',
  background: '#FFFFFF',
  border: `1px solid ${HSBCColors.professional.border}`,
  boxShadow: '0 2px 8px rgba(44,62,80,0.05)',
  transition: 'all 0.2s ease',
  '&:hover': {
    boxShadow: '0 4px 12px rgba(44,62,80,0.1)'
  }
}}>
                              <Stack direction="row" alignItems="center" spacing={2}>
                                <CalendarToday sx={{ color: '#2196f3' }} />
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
                           <ProfessionalPaper sx={{ 
  p: 2, 
  borderRadius: '8px',
  background: '#FFFFFF',
  border: `1px solid ${HSBCColors.professional.border}`,
  boxShadow: '0 2px 8px rgba(44,62,80,0.05)',
  transition: 'all 0.2s ease',
  '&:hover': {
    boxShadow: '0 4px 12px rgba(44,62,80,0.1)'
  }
}}>
                              <Stack direction="row" alignItems="center" spacing={2}>
                                <Schedule sx={{ color: '#2196f3' }} />
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
                            <ProfessionalPaper sx={{ 
                              p: 2, 
                              borderRadius: '16px',
                              background: expiryStatus?.status === 'EXPIRED' ? rgba(231,76,60,0.05) :
                                          expiryStatus?.status === 'CRITICAL' ? rgba(231,76,60,0.05) :
                                          expiryStatus?.status === 'EXPIRING' ? rgba(243,156,18,0.05) :
                                          rgba(39,174,96,0.05),
                              border: `1px solid ${alpha(expiryStatus?.color || '#4caf50', 0.2)}`
                            }}>
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
                              <ProfessionalPaper sx={{ 
                                p: 2, 
                                borderRadius: '16px',
                                background: rgba(39,174,96,0.05),
                                border: '1px solid rgba(76,175,80,0.2)'
                              }}>
                                <Stack direction="row" alignItems="center" spacing={2}>
                                  <CheckCircle sx={{ color: '#4caf50' }} />
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
  <ProfessionalPaper sx={{ 
    p: 2, 
    borderRadius: '16px',
    background: rgba(219,0,17,0.05),
    border: `1px solid ${alpha(HSBCColors.primary, 0.2)}`,
    minHeight: 80, // Ensure consistent height
    display: 'flex',
    alignItems: 'center'
  }}>
    <Stack direction="row" alignItems="center" spacing={2} sx={{ width: '100%' }}>
      <Description sx={{ color: HSBCColors.primary, flexShrink: 0 }} />
      <Box sx={{ flex: 1, minWidth: 0 }}> {/* minWidth: 0 allows text to wrap */}
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Original Filename
        </Typography>
        <Tooltip title={procedureDetails.originalFilename || 'Not available'} arrow>
          <Typography 
            variant="body1" 
            fontWeight={700}
            sx={{
              wordBreak: 'break-word', // Break long words
              overflowWrap: 'break-word', // Wrap long text
              display: '-webkit-box',
              WebkitLineClamp: 2, // Limit to 2 lines
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
    <ProfessionalPaper sx={{ 
      p: 2, 
      borderRadius: '16px',
      background: rgba(219,0,17,0.05),
      border: `1px solid ${alpha(HSBCColors.primary, 0.2)}`,
      minHeight: { xs: 'auto', sm: 80 },
      display: 'flex',
      alignItems: 'center'
    }}>
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
                        
                        {/* Document Link */}
                        {procedureDetails.documentLink && (
                          <Box sx={{ mt: 3 }}>
                            <Stack direction="row" spacing={2}>
                              <Button
                                variant="contained"
                                startIcon={<CloudDownload />}
                                href={procedureDetails.documentLink}
                                target="_blank"
                                sx={{
                                  background: HSBCColors.gradients.redPrimary,
                                  borderRadius: '12px',
                                  px: 3,
                                  py: 1.5,
                                  fontWeight: 700,
                                  boxShadow: `0 8px 24px ${alpha(HSBCColors.primary, 0.3)}`
                                }}
                              >
                                Download Document
                              </Button>
                              <Button
                                variant="outlined"
                                startIcon={<LinkIcon />}
                                href={procedureDetails.documentLink}
                                target="_blank"
                                sx={{ borderRadius: '12px', px: 3, py: 1.5, fontWeight: 700 }}
                              >
                                Open in SharePoint
                              </Button>
                            </Stack>
                          </Box>
                        )}
                      </CardContent>
                    </ProfessionalCard>
                  </motion.div>

                  {/* AI Analysis Section */}
                  {(procedureDetails.foundElements?.length > 0 || procedureDetails.aiRecommendations?.length > 0) && (
                    <motion.div
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: 0.4 }}
                    >
                      <ProfessionalCard>
                        <CardHeader
                          avatar={
                            <ProfessionalLogo size={50}>
                              <Psychology sx={{ color: 'white', fontSize: 20 }} />
                            </ProfessionalLogo>
                          }
                          title={
                            <Typography variant="h5" fontWeight={800}>
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
                              sx={{ fontWeight: 700 }}
                            />
                          }
                        />
                        
                        <CardContent>
                          {procedureDetails.foundElements?.length > 0 && (
                            <Accordion defaultExpanded sx={{ mb: 2, borderRadius: '16px !important' }}>
                              <AccordionSummary 
                                expandIcon={<ExpandMore />}
                                sx={{ 
                                  background: rgba(39,174,96,0.05),
                                  borderRadius: '16px'
                                }}
                              >
                                <Stack direction="row" alignItems="center" spacing={2}>
                                  <CheckCircle sx={{ color: '#4caf50' }} />
                                  <Typography variant="h6" fontWeight={700}>
                                    ✅ Found Elements ({procedureDetails.foundElements.length})
                                  </Typography>
                                </Stack>
                              </AccordionSummary>
                              <AccordionDetails>
                                <Grid container spacing={1}>
                                  {procedureDetails.foundElements.map((element, index) => (
                                    <Grid item xs={12} sm={6} key={index}>
                                      <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.3, delay: index * 0.1 }}
                                      >
                                        <ProfessionalPaper sx={{ 
                                          p: 2, 
                                          borderRadius: '12px',
                                          background: rgba(39,174,96,0.05),
                                          border: '1px solid rgba(76,175,80,0.2)',
                                          transition: 'all 0.3s ease',
                                          '&:hover': {
                                            transform: 'translateY(-2px)',
                                            boxShadow: '0 8px 24px rgba(76,175,80,0.2)'
                                          }
                                        }}>
                                          <Stack direction="row" alignItems="center" spacing={1}>
                                            <CheckCircle sx={{ color: '#4caf50', fontSize: 20 }} />
                                            <Typography variant="body2" fontWeight={600}>
                                              {element}
                                            </Typography>
                                          </Stack>
                                        </ProfessionalPaper>
                                      </motion.div>
                                    </Grid>
                                  ))}
                                </Grid>
                              </AccordionDetails>
                            </Accordion>
                          )}

                          {procedureDetails.aiRecommendations?.length > 0 && (
                            <Accordion sx={{ borderRadius: '16px !important' }}>
                              <AccordionSummary 
                                expandIcon={<ExpandMore />}
                                sx={{ 
                                  background: rgba(52,152,219,0.05),
                                  borderRadius: '16px'
                                }}
                              >
                                <Stack direction="row" alignItems="center" spacing={2}>
                                  <Insights sx={{ color: '#2196f3' }} />
                                  <Typography variant="h6" fontWeight={700}>
                                    💡 AI Recommendations ({procedureDetails.aiRecommendations.length})
                                  </Typography>
                                </Stack>
                              </AccordionSummary>
                              <AccordionDetails>
                                <Stack spacing={2}>
                                  {procedureDetails.aiRecommendations.map((rec, index) => (
                                    <motion.div
                                      key={index}
                                      initial={{ opacity: 0, x: -20 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ duration: 0.3, delay: index * 0.1 }}
                                    >
                                      <ProfessionalPaper sx={{ 
                                        p: 3, 
                                        borderRadius: '12px',
                                        background: rgba(52,152,219,0.05),
                                        border: '1px solid rgba(33,150,243,0.2)',
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                          transform: 'translateX(8px)',
                                          boxShadow: '0 8px 24px rgba(33,150,243,0.2)'
                                        }
                                      }}>
                                        <Stack direction="row" alignItems="flex-start" spacing={2}>
                                          <TrendingUp sx={{ color: '#2196f3', fontSize: 24, mt: 0.5 }} />
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
                                    </motion.div>
                                  ))}
                                </Stack>
                              </AccordionDetails>
                            </Accordion>
                          )}
                        </CardContent>
                      </ProfessionalCard>
                    </motion.div>
                  )}
                </Stack>
              </Grid>

              {/* 👥 **RIGHT COLUMN - People & Timeline** */}
              <Grid item xs={12} lg={4}>
                <Stack spacing={3}>
                  {/* Procedure Owners */}
                  <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    <ProfessionalCard>
                      <CardHeader
                        avatar={
                          <ProfessionalLogo size={50}>
                            <Person sx={{ color: 'white', fontSize: 20 }} />
                          </ProfessionalLogo>
                        }
                        title={
                          <Typography variant="h5" fontWeight={800}>
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
                            <motion.div
                              whileHover={{ scale: 1.02 }}
                              transition={{ type: "spring", stiffness: 300 }}
                            >
                        <ProfessionalCard variant="primary" accent={true}>
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
                            </motion.div>
                          )}

                          {/* Secondary Owner */}
                          {procedureDetails.secondaryOwner && (
                            <motion.div
                              whileHover={{ scale: 1.02 }}
                              transition={{ type: "spring", stiffness: 300 }}
                            >
                              <ProfessionalCard variant="info">
                                <CardContent sx={{ p: 3 }}>
                                  <Stack direction="row" alignItems="center" spacing={2}>
                                    <Avatar sx={{ 
                                      width: 60, 
                                      height: 60,
                                      background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
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
                                      <Typography variant="h6" fontWeight={800} gutterBottom>
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
                            </motion.div>
                          )}

                          {/* Uploaded By */}
                          {procedureDetails.uploadedBy && (
                            <ProfessionalPaper sx={{ 
                              p: 2, 
                              borderRadius: '16px',
                              background: rgba(219,0,17,0.05),
                              border: `1px solid ${alpha(HSBCColors.primary, 0.2)}`
                            }}>
                              <Stack direction="row" alignItems="center" spacing={2}>
                                <Avatar sx={{ 
                                  background: HSBCColors.gradients.redPrimary,
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
                  </motion.div>

      {/* Enhanced Procedure Timeline - No Extra Dependencies */}
<motion.div
  initial={{ opacity: 0, x: 30 }}
  animate={{ opacity: 1, x: 0 }}
  transition={{ duration: 0.6, delay: 0.5 }}
>
  <ProfessionalCard>
    <CardHeader
      avatar={
        <ProfessionalLogo size={50}>
          <TimelineIcon sx={{ color: 'white', fontSize: 20 }} />
        </ProfessionalLogo>
      }
      title={
        <Typography variant="h5" fontWeight={800}>
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
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <ProfessionalPaper sx={{ 
            p: 3, 
            borderRadius: '16px',
            background: rgba(39,174,96,0.05),
            border: '1px solid rgba(76,175,80,0.2)',
            position: 'relative',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateX(8px)',
              boxShadow: '0 8px 24px rgba(76,175,80,0.2)'
            },
            '&::before': {
              content: '""',
              position: 'absolute',
              left: -12,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 6,
              height: '80%',
              background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)',
              borderRadius: 3
            }
          }}>
            <Stack direction="row" alignItems="center" spacing={3}>
              <Avatar sx={{ 
                background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)', 
                width: 48, 
                height: 48,
                boxShadow: '0 4px 16px rgba(76,175,80,0.3)'
              }}>
                <CloudDownload sx={{ color: 'white', fontSize: 24 }} />
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" fontWeight={800} color="#2e7d32">
                  Document Uploaded
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  {formatDate(procedureDetails.uploadedOn)}
                </Typography>
                <Chip 
                  label="Initial Upload"
                  size="small"
                  sx={{ 
                    backgroundColor: 'rgba(76,175,80,0.1)',
                    color: '#2e7d32',
                    fontWeight: 700,
                    fontSize: '0.7rem'
                  }}
                />
              </Box>
            </Stack>
          </ProfessionalPaper>
        </motion.div>

        {/* Sign-off (if available) */}
        {procedureDetails.signOffDate && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <ProfessionalPaper sx={{ 
              p: 3, 
              borderRadius: '16px',
              background: rgba(52,152,219,0.05),
              border: '1px solid rgba(33,150,243,0.2)',
              position: 'relative',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateX(8px)',
                boxShadow: '0 8px 24px rgba(33,150,243,0.2)'
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                left: -12,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 6,
                height: '80%',
                background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
                borderRadius: 3
              }
            }}>
              <Stack direction="row" alignItems="center" spacing={3}>
                <Avatar sx={{ 
                  background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)', 
                  width: 48, 
                  height: 48,
                  boxShadow: '0 4px 16px rgba(33,150,243,0.3)'
                }}>
                  <CheckCircle sx={{ color: 'white', fontSize: 24 }} />
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" fontWeight={800} color="#1565c0">
                    Document Signed Off
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    {formatDate(procedureDetails.signOffDate)}
                  </Typography>
                  <Chip 
                    label="Approved"
                    size="small"
                    sx={{ 
                      backgroundColor: 'rgba(33,150,243,0.1)',
                      color: '#1565c0',
                      fontWeight: 700,
                      fontSize: '0.7rem'
                    }}
                  />
                </Box>
              </Stack>
            </ProfessionalPaper>
          </motion.div>
        )}

        {/* Last Modified */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <ProfessionalPaper sx={{ 
            p: 3, 
            borderRadius: '16px',
            background: rgba(243,156,18,0.05),
            border: '1px solid rgba(255,152,0,0.2)',
            position: 'relative',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateX(8px)',
              boxShadow: '0 8px 24px rgba(255,152,0,0.2)'
            },
            '&::before': {
              content: '""',
              position: 'absolute',
              left: -12,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 6,
              height: '80%',
              background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
              borderRadius: 3
            }
          }}>
            <Stack direction="row" alignItems="center" spacing={3}>
              <Avatar sx={{ 
                background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)', 
                width: 48, 
                height: 48,
                boxShadow: '0 4px 16px rgba(255,152,0,0.3)'
              }}>
                <Schedule sx={{ color: 'white', fontSize: 24 }} />
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" fontWeight={800} color="#ef6c00">
                  Last Modified
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  {formatDate(procedureDetails.modifiedOn)}
                </Typography>
                <Chip 
                  label="Updated"
                  size="small"
                  sx={{ 
                    backgroundColor: 'rgba(255,152,0,0.1)',
                    color: '#ef6c00',
                    fontWeight: 700,
                    fontSize: '0.7rem'
                  }}
                />
              </Box>
            </Stack>
          </ProfessionalPaper>
        </motion.div>

        {/* Expiry Date */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <ProfessionalPaper sx={{ 
            p: 3, 
            borderRadius: '16px',
            background: expiryStatus?.status === 'EXPIRED' ? rgba(231,76,60,0.05) :
                        expiryStatus?.status === 'CRITICAL' ? rgba(231,76,60,0.05) :
                        expiryStatus?.status === 'EXPIRING' ? rgba(243,156,18,0.05) :
                        rgba(39,174,96,0.05),
            border: `1px solid ${alpha(expiryStatus?.color || '#4caf50', 0.2)}`,
            position: 'relative',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateX(8px)',
              boxShadow: `0 8px 24px ${alpha(expiryStatus?.color || '#4caf50', 0.2)}`
            },
            '&::before': {
              content: '""',
              position: 'absolute',
              left: -12,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 6,
              height: '80%',
              background: `linear-gradient(135deg, ${expiryStatus?.color || '#4caf50'} 0%, ${alpha(expiryStatus?.color || '#4caf50', 0.8)} 100%)`,
              borderRadius: 3
            }
          }}>
            <Stack direction="row" alignItems="center" spacing={3}>
              <Avatar sx={{ 
                background: `linear-gradient(135deg, ${expiryStatus?.color || '#4caf50'} 0%, ${alpha(expiryStatus?.color || '#4caf50', 0.8)} 100%)`, 
                width: 48, 
                height: 48,
                boxShadow: `0 4px 16px ${alpha(expiryStatus?.color || '#4caf50', 0.3)}`
              }}>
                {expiryStatus?.icon && React.cloneElement(expiryStatus.icon, { 
                  sx: { color: 'white', fontSize: 24 } 
                })}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" fontWeight={800} sx={{ color: expiryStatus?.color || '#4caf50' }}>
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
                      backgroundColor: alpha(expiryStatus?.color || '#4caf50', 0.1),
                      color: expiryStatus?.color || '#4caf50',
                      fontWeight: 700,
                      fontSize: '0.7rem'
                    }}
                  />
                )}
              </Box>
            </Stack>
          </ProfessionalPaper>
        </motion.div>
      </Stack>
    </CardContent>
  </ProfessionalCard>
</motion.div>

                  {/* Document Owners (Extracted) */}
                  {procedureDetails.documentOwners?.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: 0.7 }}
                    >
                      <ProfessionalCard variant="success">
                        <CardHeader
                          avatar={
                            <ProfessionalLogo size={50}>
                              <Grade sx={{ color: 'white', fontSize: 20 }} />
                            </ProfessionalLogo>
                          }
                          title={
                            <Typography variant="h5" fontWeight={800}>
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
                              sx={{ fontWeight: 700 }}
                            />
                          }
                        />
                        
                        <CardContent>
                          <Stack spacing={2}>
                            {procedureDetails.documentOwners.map((owner, index) => (
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.1 }}
                              >
                                <ProfessionalPaper sx={{ 
                                  p: 2, 
                                  borderRadius: '12px',
                                  background: rgba(39,174,96,0.05),
                                  border: '1px solid rgba(76,175,80,0.2)',
                                  transition: 'all 0.3s ease',
                                  '&:hover': {
                                    transform: 'translateX(8px)',
                                    boxShadow: '0 8px 24px rgba(76,175,80,0.2)'
                                  }
                                }}>
                                  <Stack direction="row" alignItems="center" spacing={2}>
                                    <Person sx={{ color: '#4caf50' }} />
                                    <Typography variant="body2" fontWeight={600}>
                                      {owner}
                                    </Typography>
                                  </Stack>
                                </ProfessionalPaper>
                              </motion.div>
                            ))}
                          </Stack>
                        </CardContent>
                      </ProfessionalCard>
                    </motion.div>
                  )}
                </Stack>
              </Grid>
            </Grid>
          </Box>
        ) : (
          /* No Data State */
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <ProfessionalCard>
                <CardContent sx={{ p: 6 }}>
                  <Assignment sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="h5" color="text.secondary">
                    No procedure details available
                  </Typography>
                </CardContent>
              </ProfessionalCard>
            </motion.div>
          </Box>
        )}
      </DialogContent>

      {/* 🚀 **ENHANCED ACTION BUTTONS** */}
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
              borderRadius: '12px',
              px: 3,
              py: 1.5,
              fontWeight: 700,
              flex: 1
            }}
          >
            Close
          </Button>
          
          {procedureDetails?.documentLink && (
            <Button 
              variant="contained" 
              startIcon={<CloudDownload />}
              href={procedureDetails.documentLink}
              target="_blank"
              sx={{
                background: HSBCColors.gradients.redPrimary,
                borderRadius: '12px',
                px: 4,
                py: 1.5,
                fontWeight: 700,
                flex: 2,
                boxShadow: `0 8px 24px ${alpha(HSBCColors.primary, 0.3)}`
              }}
            >
              Download Document
            </Button>
          )}
          
          {user?.role === 'admin' && (
            <Tooltip title="Admin Actions">
              <IconButton
                sx={{
                  background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
                  color: 'white',
                  width: 48,
                  height: 48,
                  '&:hover': {
                    background: 'linear-gradient(135deg, #f57c00 0%, #ef6c00 100%)',
                    transform: 'scale(1.1)'
                  }
                }}
              >
                <AdminPanelSettings />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </DialogActions>

      {/* 🌟 **FLOATING SHARE BUTTON** */}
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
                  // Share functionality
                  navigator.share?.({
                    title: procedureDetails.name,
                    text: `Check out this procedure: ${procedureDetails.name}`,
                    url: window.location.href
                  }).catch(() => {
                    // Fallback to copy link
                    navigator.clipboard?.writeText(window.location.href);
                  });
                }}
                sx={{
                  background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
                  color: 'white', boxShadow: '0 8px 32px rgba(33,150,243,0.4)',
                  '&:hover': {
                    transform: 'scale(1.1)',
                    boxShadow: '0 12px 40px rgba(33,150,243,0.5)'
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
