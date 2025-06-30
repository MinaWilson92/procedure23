// components/ProcedureAmendModal.js - Enhanced with SiteAssets Folder Support
import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography,
  Grid, Card, CardContent, TextField, Alert, IconButton, LinearProgress,
  Stack, Paper, Chip, Divider, useTheme, styled, keyframes, alpha,
  FormControl, InputLabel, Select, MenuItem, CircularProgress, Backdrop,
  Stepper, Step, StepLabel, StepContent, Accordion, AccordionSummary, AccordionDetails,
  List, ListItem, ListItemIcon, ListItemText,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import {
  Close, CloudUpload, Analytics, Save, Cancel, Warning, CheckCircle,
  Description, Person, Schedule, AutoAwesome, Error as ErrorIcon,
  History, Refresh, Assignment, Security, ExpandMore, Psychology,
  Folder, FolderOpen
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigation } from '../contexts/NavigationContext';
import DocumentAnalyzer from '../services/DocumentAnalyzer';

class AmendmentErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorDetails: null };
  }

  static getDerivedStateFromError(error) {
    console.error('🚨 Amendment Error Boundary caught:', error);
    return { 
      hasError: true, 
      error: error.message || 'Unknown error',
      errorDetails: error.stack || 'No stack trace'
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error('🚨 Amendment Error Details:', {
      error,
      errorInfo,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert severity="error" sx={{ m: 2 }}>
          <Typography variant="h6" gutterBottom>
            ❌ Amendment Processing Error
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            <strong>Error:</strong> {this.state.error}
          </Typography>
          <Typography variant="caption" sx={{ mb: 2, display: 'block' }}>
            This error might be caused by:
            • URL encoding issues in data (%2, %20, etc.)
            • React state management conflicts
            • SharePoint environment compatibility
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button 
              variant="outlined" 
              onClick={() => {
                this.setState({ hasError: false, error: null, errorDetails: null });
              }}
            >
              Try Again
            </Button>
            <Button 
              variant="contained" 
              onClick={() => {
                if (window.location.reload) {
                  window.location.reload();
                } else {
                  window.location.href = window.location.href;
                }
              }}
            >
              Refresh Page
            </Button>
          </Stack>
        </Alert>
      );
    }
    return this.props.children;
  }
}

// 🎨 **HSBC Brand Colors**
const HSBCColors = {
  primary: '#DB0011',
  secondary: '#9FA1A4',
  gradients: {
    redPrimary: 'linear-gradient(135deg, #DB0011 0%, #B50010 50%, #8B000C 100%)',
    darkMatter: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #404040 100%)',
    lightGlass: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)',
    modernGlass: 'linear-gradient(135deg, rgba(219,0,17,0.1) 0%, rgba(159,161,164,0.05) 100%)',
    successGlass: 'linear-gradient(135deg, rgba(76,175,80,0.1) 0%, rgba(76,175,80,0.05) 100%)',
    warningGlass: 'linear-gradient(135deg, rgba(255,152,0,0.1) 0%, rgba(255,152,0,0.05) 100%)',
    errorGlass: 'linear-gradient(135deg, rgba(244,67,54,0.1) 0%, rgba(244,67,54,0.05) 100%)'
  }
};

// 🎨 **Styled Components**
const GlassmorphismCard = styled(Card)(({ theme, variant = 'default' }) => ({
  background: variant === 'primary'
    ? HSBCColors.gradients.redPrimary
    : variant === 'success'
    ? HSBCColors.gradients.successGlass
    : variant === 'warning'
    ? HSBCColors.gradients.warningGlass
    : variant === 'error'
    ? HSBCColors.gradients.errorGlass
    : HSBCColors.gradients.lightGlass,
  backdropFilter: 'blur(20px)',
  border: `1px solid ${variant === 'primary' ? 'rgba(255,255,255,0.2)' : 'rgba(219,0,17,0.1)'}`,
  borderRadius: '24px',
  boxShadow: variant === 'primary'
    ? '0 20px 60px rgba(219,0,17,0.3), inset 0 1px 0 rgba(255,255,255,0.2)'
    : '0 20px 60px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.8)',
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden'
}));

const HSBCHexagon = styled(Box)(({ theme, size = 60 }) => ({
  width: size,
  height: size,
  background: HSBCColors.gradients.redPrimary,
  clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  '&::after': {
    content: '""',
    position: 'absolute',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(45deg, rgba(255,255,255,0.3) 0%, transparent 100%)',
    clipPath: 'inherit'
  }
}));

const EnhancedDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: '24px',
    background: 'linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)',
    maxHeight: '95vh',
    margin: 16,
    width: 'calc(100% - 32px)',
    maxWidth: '1200px'
  }
}));

const ProcedureAmendModal = ({
  open,
  onClose,
  procedure,
  user,
  sharePointAvailable,
  onSuccess
}) => {
  const { navigate } = useNavigation();
  const theme = useTheme();

  // Form state
  const [formData, setFormData] = useState({
    secondary_owner: '',
    secondary_owner_email: '',
    amendment_summary: ''
  });

  // File and analysis state
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentAnalysis, setDocumentAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('ready');
  const [activeStep, setActiveStep] = useState(0);

  // Services
  const [documentAnalyzer] = useState(() => new DocumentAnalyzer());

  // Steps for the amendment process
  const steps = [
    { label: 'Amendment Details', description: 'Update procedure information' },
    { label: 'New Document Upload', description: 'Upload and validate new document' },
    { label: 'AI Quality Analysis', description: 'AI analysis and scoring (min 85%)' },
    { label: 'Submit Amendment', description: 'Finalize and notify stakeholders' }
  ];

  // Initialize form with procedure data
  useEffect(() => {
    if (procedure) {
      setFormData({
        secondary_owner: procedure.secondary_owner || '',
        secondary_owner_email: procedure.secondary_owner_email || '',
        amendment_summary: ''
      });
    }
  }, [procedure]);

  // ✅ CORRECTED: Smart folder detection with SiteAssets support
// ✅ CORRECTED: Smart folder detection with better SiteAssets URL parsing
// ✅ CORRECTED: parseExistingDocumentPath with CORRECT HSBC Base URL
const parseExistingDocumentPath = (documentLink) => {
  try {
    if (!documentLink || typeof documentLink !== 'string') {
      console.warn('⚠️ No valid document link provided, using default HSBC SiteAssets structure');
      return {
        baseUrl: 'https://teams.global.hsbc/sites/EmployeeEng',
        lobFolder: procedure?.lob || 'IWPB',
        subFolder: 'General',
        fullFolderPath: `/sites/EmployeeEng/SiteAssets/${procedure?.lob || 'IWPB'}/General`,
        sharePointPath: `SiteAssets/${procedure?.lob || 'IWPB'}/General`
      };
    }

    console.log('🔍 Analyzing existing document URL for HSBC SiteAssets:', documentLink);

    // ✅ SAFE URL PARSING: Handle both full URLs and relative paths
    let parsedUrl;
    let pathname;
    
    if (documentLink.startsWith('http')) {
      // Full URL
      try {
        parsedUrl = new URL(documentLink);
        pathname = parsedUrl.pathname;
      } catch (urlError) {
        console.warn('⚠️ Invalid full URL, treating as relative path');
        pathname = documentLink;
        parsedUrl = { 
          protocol: 'https:', 
          host: 'teams.global.hsbc',
          pathname: documentLink
        };
      }
    } else {
      // Relative path - construct base info with CORRECT HSBC URL
      pathname = documentLink.startsWith('/') ? documentLink : `/${documentLink}`;
      parsedUrl = { 
        protocol: 'https:', 
        host: 'teams.global.hsbc',
        pathname: pathname
      };
    }

    // ✅ ROBUST PATH PARSING: Split and clean path parts
    const pathParts = pathname.split('/').filter(part => part.length > 0);
    
    console.log('📂 URL path parts:', pathParts);

    // ✅ SMART DETECTION: Find key HSBC SharePoint structure markers
    let siteIndex = -1;
    let employeeEngIndex = -1;
    let siteAssetsIndex = -1;
    
    // Find indices with case-insensitive matching for HSBC structure
    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i].toLowerCase();
      if (part === 'sites' && siteIndex === -1) {
        siteIndex = i;
      }
      if (part === 'employeeeng' && employeeEngIndex === -1) {
        employeeEngIndex = i;
      }
      if (part === 'siteassets' && siteAssetsIndex === -1) {
        siteAssetsIndex = i;
      }
    }
    
    console.log('🔍 HSBC structure indices found:', { siteIndex, employeeEngIndex, siteAssetsIndex });

    // ✅ VALIDATE STRUCTURE: Must have proper HSBC SharePoint SiteAssets structure
    if (siteAssetsIndex === -1) {
      console.warn('⚠️ No SiteAssets found in path, likely stored elsewhere');
      
      // ✅ SMART FALLBACK: Try to detect LOB from path anyway
      let detectedLOB = procedure?.lob || 'IWPB';
      
      // Look for LOB patterns in any part of the path
      const lobPatterns = ['IWPB', 'CIB', 'GCOO', 'GRM', 'GF', 'GTRB'];
      for (const part of pathParts) {
        const upperPart = part.toUpperCase();
        if (lobPatterns.includes(upperPart)) {
          detectedLOB = upperPart;
          break;
        }
      }
      
      return {
        baseUrl: 'https://teams.global.hsbc/sites/EmployeeEng',
        lobFolder: detectedLOB,
        subFolder: 'General',
        fullFolderPath: `/sites/EmployeeEng/SiteAssets/${detectedLOB}/General`,
        sharePointPath: `SiteAssets/${detectedLOB}/General`,
        originalUrl: documentLink,
        warning: 'Document not in SiteAssets structure'
      };
    }

    // ✅ CORRECT PARSING: Extract LOB and actual subfolder for HSBC
    const baseUrl = 'https://teams.global.hsbc/sites/EmployeeEng'; // ✅ HARDCODED CORRECT HSBC URL
    
    // The folder immediately after SiteAssets should be the LOB
    const lobFolderIndex = siteAssetsIndex + 1;
    const lobFolder = pathParts[lobFolderIndex] || procedure?.lob || 'IWPB';
    
    // The folder after LOB is the actual subfolder (not "General")
    const subFolderIndex = lobFolderIndex + 1;
    let subFolder = 'General'; // Default fallback
    
    if (subFolderIndex < pathParts.length) {
      // ✅ DECODE URL-ENCODED FOLDER NAMES: Handle %20, %2C, etc.
      try {
        subFolder = decodeURIComponent(pathParts[subFolderIndex]);
        console.log('✅ Decoded actual HSBC subfolder:', subFolder);
      } catch (decodeError) {
        subFolder = pathParts[subFolderIndex]; // Use as-is if decode fails
        console.warn('⚠️ Could not decode subfolder, using raw value:', subFolder);
      }
    }
    
    // ✅ CONSTRUCT PATHS: Build proper HSBC SharePoint paths
    const fullFolderPath = `/sites/EmployeeEng/SiteAssets/${lobFolder}/${subFolder}`;
    const sharePointPath = `SiteAssets/${lobFolder}/${subFolder}`;

    const result = {
      baseUrl,
      lobFolder,
      subFolder,
      fullFolderPath,
      sharePointPath,
      originalUrl: documentLink
    };

    console.log('✅ Successfully parsed HSBC SiteAssets structure with actual subfolder:', result);
    return result;

  } catch (error) {
    console.error('❌ Error parsing HSBC document URL:', error);
    
    // ✅ ROBUST FALLBACK: Always return valid HSBC structure
    const fallback = {
      baseUrl: 'https://teams.global.hsbc/sites/EmployeeEng',
      lobFolder: procedure?.lob || 'IWPB',
      subFolder: 'General',
      fullFolderPath: `/sites/EmployeeEng/SiteAssets/${procedure?.lob || 'IWPB'}/General`,
      sharePointPath: `SiteAssets/${procedure?.lob || 'IWPB'}/General`,
      error: error.message,
      originalUrl: documentLink
    };
    
    console.log('🔄 Using robust HSBC fallback SiteAssets structure:', fallback);
    return fallback;
  }
};

  // ✅ Helper Functions
  const getScoreColor = (score) => {
    if (score >= 80) return '#4caf50';
    if (score >= 60) return '#ff9800';
    return '#f44336';
  };

  const getQualityInfo = (score) => {
    if (score >= 90) return { level: 'Excellent', color: '#4caf50', icon: <AutoAwesome /> };
    if (score >= 80) return { level: 'Good', color: '#8bc34a', icon: <CheckCircle /> };
    if (score >= 70) return { level: 'Fair', color: '#ff9800', icon: <Warning /> };
    if (score >= 60) return { level: 'Poor', color: '#f44336', icon: <ErrorIcon /> };
    return { level: 'Critical', color: '#d32f2f', icon: <ErrorIcon /> };
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Event Handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        documentAnalyzer.validateFile(file);
        setSelectedFile(file);
        setDocumentAnalysis(null);
        setActiveStep(1);
        console.log('📁 File selected for amendment:', file.name);
      } catch (err) {
        alert(`File validation error: ${err.message}`);
        setSelectedFile(null);
        e.target.value = '';
      }
    }
  };

  // ✅ FIXED: Use EXACT SAME ANALYSIS LOGIC as Admin Panel
  const analyzeDocument = async () => {
    if (!selectedFile) {
      alert('Please select a document file before analyzing.');
      return;
    }

    try {
      setSubmitStatus('analyzing');
      setLoading(true);
      
      console.log('🔍 Starting AI document analysis for amendment...');

      // ✅ USE EXACT SAME METADATA STRUCTURE AS ADMIN PANEL
      const analysisMetadata = {
        name: procedure?.name || 'Unknown Procedure',
        lob: procedure?.lob || 'Unknown',
        subsection: procedure?.procedure_subsection || 'Unknown'
      };

      console.log('🔍 Using analysis metadata:', analysisMetadata);

      // ✅ CALL SAME ANALYSIS METHOD AS ADMIN PANEL
      const analysisResult = await documentAnalyzer.analyzeDocument(selectedFile, analysisMetadata);

      console.log('✅ Analysis result:', analysisResult);

      setDocumentAnalysis(analysisResult);
      setActiveStep(2);
      setSubmitStatus('ready');

      if (analysisResult.accepted) {
        console.log('✅ Document accepted with score:', analysisResult.score);
      } else {
        console.log('❌ Document rejected with score:', analysisResult.score);
      }

    } catch (err) {
      console.error('❌ Analysis failed:', err);
      alert(`Analysis failed: ${err.message}`);
      setSubmitStatus('ready');
      setDocumentAnalysis(null);
    } finally {
      setLoading(false);
    }
  };

  const validateAmendmentForm = () => {
    const errors = [];

    if (!selectedFile) {
      errors.push('• Please select a new document file');
    }

    if (!documentAnalysis) {
      errors.push('• Please analyze the document first');
    }

    if (!documentAnalysis?.accepted) {
      errors.push('• Document must achieve at least 85% quality score');
    }

    if (!formData.amendment_summary.trim()) {
      errors.push('• Amendment summary is required');
    }

    if (formData.amendment_summary.trim().length < 10) {
      errors.push('• Amendment summary must be at least 10 characters');
    }

    if (formData.secondary_owner_email && !formData.secondary_owner_email.includes('@')) {
      errors.push('• Please enter a valid email address for Secondary Owner');
    }

    if (errors.length > 0) {
      alert(`Please fix the following issues:\n\n${errors.join('\n')}`);
      return false;
    }

    return true;
  };

  // ✅ ENHANCED: Amendment submission with SiteAssets folder detection
const handleSubmitAmendment = async () => {
  if (!validateAmendmentForm()) {
    return;
  }

  try {
    setLoading(true);
    setSubmitStatus('uploading');
    setActiveStep(3);
    
    console.log('🚀 Starting procedure amendment process...');

    // ✅ SMART FOLDER DETECTION - Parse existing document URL for SiteAssets
    const existingDocumentPath = parseExistingDocumentPath(
      procedure?.file_link || 
      procedure?.document_link || 
      procedure?.sharepoint_url ||
      procedure?.DocumentLink ||
      procedure?.SharePointURL
    );
    
    console.log('📂 Using existing SiteAssets folder structure:', existingDocumentPath);

    // ✅ VALIDATE PARSED PATHS BEFORE PROCEEDING
    if (!existingDocumentPath.fullFolderPath || existingDocumentPath.fullFolderPath === 'undefined') {
      throw new Error('Could not determine target folder path from existing document');
    }

    // ✅ COMPLETELY SANITIZE ALL AMENDMENT DATA
    const sanitizedAmendmentData = {
      procedureId: Number(procedure?.id) || 0,
      originalName: String(procedure?.name || '').replace(/[%&+#]/g, ''),
      originalLOB: String(procedure?.lob || '').replace(/[%&+#]/g, ''),
      originalPrimaryOwner: String(procedure?.primary_owner || '').replace(/[%&+#]/g, ''),
      originalPrimaryOwnerEmail: String(procedure?.primary_owner_email || '').replace(/[%&+#]/g, ''),
      originalExpiry: procedure?.expiry || new Date().toISOString(),
      
      // Sanitized updated fields
      secondary_owner: String(formData.secondary_owner || '').replace(/[%&+#]/g, ''),
      secondary_owner_email: String(formData.secondary_owner_email || '').replace(/[%&+#]/g, ''),
      amendment_summary: String(formData.amendment_summary || '').replace(/[%&+#]/g, ''),
      
      // ✅ CRITICAL: Ensure folder paths are properly set
      targetFolderPath: existingDocumentPath.fullFolderPath,
      sharePointPath: existingDocumentPath.sharePointPath,
      fullFolderPath: existingDocumentPath.fullFolderPath, // ✅ Duplicate to ensure it's set
      lobFolder: existingDocumentPath.lobFolder,
      subFolder: existingDocumentPath.subFolder,
      baseUrl: existingDocumentPath.baseUrl,
      
      // Amendment metadata
      amended_by: String(user?.staffId || 'Unknown').replace(/[%&+#]/g, ''),
      amended_by_name: String(user?.displayName || 'Unknown').replace(/[%&+#]/g, ''),
      amended_by_role: String(user?.role || 'User').replace(/[%&+#]/g, ''),
      amendment_date: new Date().toISOString(),
      last_modified_on: new Date().toISOString(),
      last_modified_by: String(user?.displayName || 'Unknown').replace(/[%&+#]/g, ''),
      
      // Sanitized quality data
      new_score: Number(documentAnalysis?.score) || 0,
      new_analysis_details: documentAnalysis?.details || {},
      new_ai_recommendations: documentAnalysis?.aiRecommendations || [],
      
      // File information
      original_filename: selectedFile?.name || 'unknown.pdf',
      file_size: selectedFile?.size || 0,
      
      // ✅ PRESERVE ORIGINAL DOCUMENT INFO
      original_document_link: existingDocumentPath.originalUrl
    };

    // ✅ DEBUG: Log the data being sent
    console.log('📤 Sending amendment data to DocumentAnalyzer:', sanitizedAmendmentData);
    console.log('🔍 Critical paths check:');
    console.log(`   fullFolderPath: ${sanitizedAmendmentData.fullFolderPath}`);
    console.log(`   sharePointPath: ${sanitizedAmendmentData.sharePointPath}`);
    console.log(`   subFolder: ${sanitizedAmendmentData.subFolder}`);

    // ✅ PROCESS AMENDMENT WITH VALIDATED DATA
    const result = await documentAnalyzer.amendProcedureInSharePoint(sanitizedAmendmentData, selectedFile);

    if (result.success) {
      console.log('✅ Procedure amended successfully with SiteAssets folder detection');
      console.log(`📂 Amendment uploaded to: ${result.sharePointPath}`);
      
      setSubmitStatus('success');
      setTimeout(() => {
        onSuccess();
        navigate('user-dashboard');
      }, 2000);
      
    } else {
      throw new Error(result.message || 'Amendment failed');
    }

  } catch (err) {
    console.error('❌ Amendment failed:', err);
    const safeError = String(err.message || 'Unknown error').replace(/[%&+#]/g, '');
    alert(`Amendment failed: ${safeError}`);
    setSubmitStatus('error');
  } finally {
    setLoading(false);
  }
};
  const handleReset = () => {
    setFormData({
      secondary_owner: procedure?.secondary_owner || '',
      secondary_owner_email: procedure?.secondary_owner_email || '',
      amendment_summary: ''
    });
    setSelectedFile(null);
    setDocumentAnalysis(null);
    setActiveStep(0);
    setSubmitStatus('ready');

    const fileInput = document.getElementById('amend-file-input');
    if (fileInput) fileInput.value = '';
  };

  // ✅ DEBUG INFO IN THE UI WITH CORRECT SITEASSETS
  const existingDocumentInfo = procedure ? parseExistingDocumentPath(
    procedure?.file_link || 
    procedure?.document_link || 
    procedure?.sharepoint_url ||
    procedure?.DocumentLink ||
    procedure?.SharePointURL
  ) : null;

  if (!open) return null;

  return (
    <AmendmentErrorBoundary>
      <EnhancedDialog
        open={open}
        onClose={onClose}
        maxWidth="xl"
        fullWidth
      >
        {/* Enhanced Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <DialogTitle sx={{ p: 0 }}>
            <Box sx={{
              background: HSBCColors.gradients.darkMatter,
              color: 'white',
              p: 3,
              position: 'relative',
              overflow: 'hidden'
            }}>
              <Grid container alignItems="center" spacing={2}>
                <Grid item>
                  <HSBCHexagon size={60}>
                    <History sx={{ color: 'white', fontSize: 24 }} />
                  </HSBCHexagon>
                </Grid>

                <Grid item xs>
                  <Typography variant="h4" fontWeight={900} sx={{ mb: 0.5 }}>
                    Amend Procedure
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Update and re-analyze procedure document with AI validation
                  </Typography>
                </Grid>

                <Grid item>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Chip
                      label={`User: ${user?.displayName}`}
                      sx={{
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        color: 'white',
                        fontWeight: 700
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

        <DialogContent sx={{ p: 4 }}>
          {/* Current Procedure Info with SiteAssets Folder Debug */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <GlassmorphismCard sx={{ mb: 4 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={800} gutterBottom>
                  📄 Current Procedure Information
                </Typography>

                <Grid container spacing={3}>
                  <Grid item xs={12} md={8}>
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Procedure Name</Typography>
                        <Typography variant="h6" fontWeight={700}>{procedure?.name}</Typography>
                      </Box>

                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Line of Business</Typography>
                          <Chip label={procedure?.lob} color="primary" variant="outlined" />
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Primary Owner</Typography>
                          <Typography variant="body1" fontWeight={600}>{procedure?.primary_owner}</Typography>
                        </Grid>
                      </Grid>

                      <Box>
                        <Typography variant="body2" color="text.secondary">Expiry Date</Typography>
                        <Typography variant="body1" fontWeight={600}>{formatDate(procedure?.expiry)}</Typography>
                      </Box>

                      {/* ✅ ENHANCED: SiteAssets Folder Structure Info with Actual Subfolder */}
                      {existingDocumentInfo && (
                        <Box>
                          <Typography variant="body2" color="text.secondary">Current SharePoint SiteAssets Location</Typography>
                          <Paper sx={{ p: 2, mt: 1, bgcolor: '#f8f9fa', border: '1px solid #e0e0e0' }}>
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                              <Folder sx={{ color: '#1976d2', fontSize: 20 }} />
                              <Typography variant="body2" fontWeight={600}>SiteAssets Folder Structure Analysis</Typography>
                            </Stack>
                            <Typography variant="caption" sx={{ fontFamily: 'monospace', display: 'block', mb: 0.5 }}>
                             <strong>Base URL:</strong> {existingDocumentInfo.baseUrl}
                           </Typography>
                           <Typography variant="caption" sx={{ fontFamily: 'monospace', display: 'block', mb: 0.5 }}>
                             <strong>LOB Folder:</strong> {existingDocumentInfo.lobFolder}
                           </Typography>
                           <Typography variant="caption" sx={{ fontFamily: 'monospace', display: 'block', mb: 0.5 }}>
                             <strong>Actual Sub Folder:</strong> {existingDocumentInfo.subFolder}
                             {existingDocumentInfo.subFolder !== 'General' && (
                               <Chip 
                                 label="REAL SUBFOLDER" 
                                 size="small" 
                                 color="success" 
                                 sx={{ ml: 1, fontSize: '0.6rem', height: 16 }}
                               />
                             )}
                           </Typography>
                           <Typography variant="caption" sx={{ fontFamily: 'monospace', display: 'block', mb: 0.5 }}>
                             <strong>SharePoint Path:</strong> {existingDocumentInfo.sharePointPath}
                           </Typography>
                           <Typography variant="caption" sx={{ fontFamily: 'monospace', display: 'block', mb: 1 }}>
                             <strong>Full Path:</strong> {existingDocumentInfo.fullFolderPath}
                           </Typography>
                           
                           {existingDocumentInfo.error ? (
                             <Alert severity="warning" sx={{ mt: 1 }}>
                               <Typography variant="caption">
                                 ⚠️ Could not parse existing URL: {existingDocumentInfo.error}
                               </Typography>
                             </Alert>
                           ) : (
                             <Alert severity="success" sx={{ mt: 1 }}>
                               <Typography variant="caption">
                                 ✅ Amendment will use existing SiteAssets/{existingDocumentInfo.lobFolder}/{existingDocumentInfo.subFolder} folder structure
                               </Typography>
                             </Alert>
                           )}
                         </Paper>
                       </Box>
                     )}
                   </Stack>
                 </Grid>

                 <Grid item xs={12} md={4}>
                   <Box sx={{ textAlign: 'center' }}>
                     <Typography variant="body2" color="text.secondary" gutterBottom>Current Quality Score</Typography>
                     <Typography variant="h2" fontWeight={900} color={getScoreColor(procedure?.score || 0)}>
                       {procedure?.score || 0}%
                     </Typography>
                     <Chip
                       label={getQualityInfo(procedure?.score || 0).level}
                       sx={{
                         backgroundColor: alpha(getScoreColor(procedure?.score || 0), 0.1),
                         color: getScoreColor(procedure?.score || 0),
                         fontWeight: 700,
                         mt: 1
                       }}
                     />
                   </Box>
                 </Grid>
               </Grid>
             </CardContent>
           </GlassmorphismCard>
         </motion.div>

         {/* Amendment Stepper */}
         <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.6, delay: 0.2 }}
         >
           <GlassmorphismCard sx={{ mb: 4 }}>
             <CardContent sx={{ p: 3 }}>
               <Stepper activeStep={activeStep} orientation="vertical">
                 {steps.map((step, index) => (
                   <Step key={step.label}>
                     <StepLabel>
                       <Typography variant="h6" fontWeight={700}>{step.label}</Typography>
                     </StepLabel>
                     <StepContent>
                       <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                         {step.description}
                       </Typography>

                       {/* Step 0: Amendment Details */}
                       {index === 0 && (
                         <Grid container spacing={3}>
                           <Grid item xs={12} sm={6}>
                             <TextField
                               fullWidth
                               label="Secondary Owner (Optional)"
                               name="secondary_owner"
                               value={formData.secondary_owner}
                               onChange={handleInputChange}
                               variant="outlined"
                               placeholder="Enter secondary owner name"
                               helperText="You can update the secondary owner"
                             />
                           </Grid>

                           <Grid item xs={12} sm={6}>
                             <TextField
                               fullWidth
                               label="Secondary Owner Email (Optional)"
                               name="secondary_owner_email"
                               value={formData.secondary_owner_email}
                               onChange={handleInputChange}
                               type="email"
                               variant="outlined"
                               placeholder="Enter secondary owner email"
                               helperText="Email for notifications"
                             />
                           </Grid>

                           <Grid item xs={12}>
                             <TextField
                               fullWidth
                               label="Amendment Summary"
                               name="amendment_summary"
                               value={formData.amendment_summary}
                               onChange={handleInputChange}
                               multiline
                               rows={4}
                               variant="outlined"
                               placeholder="Describe the key changes in this amendment..."
                               helperText="Required: Explain what has changed in this version (minimum 10 characters)"
                               required
                             />
                           </Grid>

                           <Grid item xs={12}>
                             <Alert severity="info">
                               <Typography variant="body2">
                                 <strong>Note:</strong> You cannot change the procedure name, expiry date, or primary owner.
                                 Only secondary owner and document file can be updated.
                               </Typography>
                             </Alert>
                           </Grid>

                           <Grid item xs={12}>
                             <Button
                               variant="contained"
                               onClick={() => setActiveStep(1)}
                               disabled={!formData.amendment_summary.trim() || formData.amendment_summary.length < 10}
                               sx={{
                                 background: HSBCColors.gradients.redPrimary,
                                 borderRadius: '12px',
                                 px: 3,
                                 py: 1.5,
                                 fontWeight: 700
                               }}
                             >
                               Continue to File Upload
                             </Button>
                           </Grid>
                         </Grid>
                       )}

                       {/* Step 1: File Upload */}
                       {index === 1 && (
                         <Box>
                           <Box sx={{
                             border: '2px dashed #d0d0d0',
                             borderRadius: 2,
                             p: 4,
                             textAlign: 'center',
                             bgcolor: selectedFile ? '#f8f9fa' : 'background.paper',
                             transition: 'all 0.3s ease',
                             mb: 3
                           }}>
                             {!selectedFile ? (
                               <>
                                 <CloudUpload sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                                 <Typography variant="h6" gutterBottom>
                                   Select New Document
                                 </Typography>
                                 <Typography variant="body2" color="text.secondary" gutterBottom>
                                   Upload the amended procedure document (.pdf, .docx, .doc) - Max 10MB
                                 </Typography>
                                 <input
                                   type="file"
                                   id="amend-file-input"
                                   hidden
                                   accept=".pdf,.docx,.doc"
                                   onChange={handleFileChange}
                                 />
                                 <Button
                                   variant="contained"
                                   component="label"
                                   htmlFor="amend-file-input"
                                   sx={{ mt: 2 }}
                                   startIcon={<CloudUpload />}
                                 >
                                   Choose New File
                                 </Button>
                               </>
                             ) : (
                               <Box>
                                 <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                                 <Typography variant="h6" gutterBottom>
                                   New File Selected: {selectedFile.name}
                                 </Typography>
                                 <Typography variant="body2" color="text.secondary" gutterBottom>
                                   Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                 </Typography>

                                 <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 2 }}>
                                   <Button
                                     variant="outlined"
                                     onClick={() => {
                                       setSelectedFile(null);
                                       setDocumentAnalysis(null);
                                       document.getElementById('amend-file-input').value = '';
                                     }}
                                     startIcon={<Cancel />}
                                   >
                                     Remove File
                                   </Button>
                                   <Button
                                     variant="contained"
                                     onClick={analyzeDocument}
                                     disabled={submitStatus === 'analyzing'}
                                     startIcon={submitStatus === 'analyzing' ? <CircularProgress size={20} /> : <Analytics />}
                                     sx={{
                                       background: HSBCColors.gradients.redPrimary,
                                       borderRadius: '12px'
                                     }}
                                   >
                                     {submitStatus === 'analyzing' ? 'Analyzing...' : 'Analyze with AI'}
                                   </Button>
                                 </Stack>
                               </Box>
                             )}
                           </Box>

                           <Alert severity="warning">
                             <Typography variant="body2">
                               <strong>Important:</strong> The new document will undergo AI analysis and must achieve
                               at least 85% quality score to proceed with the amendment.
                             </Typography>
                           </Alert>
                         </Box>
                       )}

                       {/* Step 2: AI Analysis Results - EXACT SAME AS ADMIN PANEL */}
                       {index === 2 && documentAnalysis && (
                         <Box>
                           <Card 
                             variant="outlined" 
                             sx={{ 
                               mt: 3,
                               bgcolor: documentAnalysis.accepted ? '#e8f5e9' : '#ffebee',
                               border: documentAnalysis.accepted ? '2px solid #4caf50' : '2px solid #f44336'
                             }}
                           >
                             <CardContent>
                               <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                 <Typography variant="h3" sx={{ color: getScoreColor(documentAnalysis.score), fontWeight: 'bold' }}>
                                   {documentAnalysis.score}%
                                 </Typography>
                                 <Box sx={{ flex: 1 }}>
                                   <Typography variant="body2" color="text.secondary" gutterBottom>
                                     Quality Score (Minimum Required: 85%)
                                   </Typography>
                                   <LinearProgress 
                                     variant="determinate" 
                                     value={documentAnalysis.score} 
                                     sx={{ 
                                       height: 10, 
                                       borderRadius: 5,
                                       backgroundColor: '#e0e0e0',
                                       '& .MuiLinearProgress-bar': {
                                         backgroundColor: getScoreColor(documentAnalysis.score),
                                         borderRadius: 5
                                       }
                                     }}
                                   />
                                 </Box>
                                 <Chip 
                                   label={documentAnalysis.accepted ? 'ACCEPTED' : 'REJECTED'} 
                                   color={documentAnalysis.accepted ? 'success' : 'error'}
                                   icon={documentAnalysis.accepted ? <CheckCircle /> : <ErrorIcon />}
                                   sx={{ fontWeight: 800 }}
                                 />
                               </Box>

                               {/* Template Compliance Badge */}
                               {documentAnalysis.details?.summary?.templateCompliance && (
                                 <Box sx={{ mb: 2 }}>
                                   <Chip 
                                     label={`Template Compliance: ${documentAnalysis.details.summary.templateCompliance}`}
                                     color={documentAnalysis.details.summary.templateCompliance === 'High' ? 'success' : 
                                            documentAnalysis.details.summary.templateCompliance === 'Medium' ? 'warning' : 'error'}
                                     variant="outlined"
                                   />
                                 </Box>
                               )}

                               {/* Found Elements Accordion */}
                               <Accordion sx={{ mb: 2 }}>
                                 <AccordionSummary expandIcon={<ExpandMore />}>
                                   <Typography variant="h6">
                                     ✅ Found Elements ({documentAnalysis.details?.foundElements?.length || 0})
                                   </Typography>
                                 </AccordionSummary>
                                 <AccordionDetails>
                                   <List dense>
                                     {documentAnalysis.details?.foundElements?.map((element, idx) => (
                                       <ListItem key={idx} sx={{ py: 0 }}>
                                         <ListItemIcon sx={{ minWidth: 30 }}>
                                           <CheckCircle color="success" fontSize="small" />
                                         </ListItemIcon>
                                         <ListItemText primary={element} />
                                       </ListItem>
                                     ))}
                                   </List>
                                 </AccordionDetails>
                               </Accordion>

                               {/* Missing Elements Accordion */}
                               {documentAnalysis.details?.missingElements?.length > 0 && (
                                 <Accordion sx={{ mb: 2 }}>
                                   <AccordionSummary expandIcon={<ExpandMore />}>
                                     <Typography variant="h6">
                                       ❌ Missing Elements ({documentAnalysis.details.missingElements.length})
                                     </Typography>
                                   </AccordionSummary>
                                   <AccordionDetails>
                                     <List dense>
                                       {documentAnalysis.details.missingElements.map((element, idx) => (
                                         <ListItem key={idx} sx={{ py: 0 }}>
                                           <ListItemIcon sx={{ minWidth: 30 }}>
                                             <ErrorIcon color="error" fontSize="small" />
                                           </ListItemIcon>
                                           <ListItemText primary={element} />
                                         </ListItem>
                                       ))}
                                     </List>
                                   </AccordionDetails>
                                 </Accordion>
                               )}

                               {/* HSBC Extracted Data Table */}
                               {(documentAnalysis.details?.riskRating || documentAnalysis.details?.periodicReview || documentAnalysis.details?.owners?.length > 0) && (
                                 <Accordion sx={{ mb: 2 }}>
                                   <AccordionSummary expandIcon={<ExpandMore />}>
                                     <Typography variant="h6">
                                       📊 Extracted HSBC Data
                                     </Typography>
                                   </AccordionSummary>
                                   <AccordionDetails>
                                     <TableContainer component={Paper} variant="outlined">
                                       <Table size="small">
                                         <TableHead>
                                           <TableRow>
                                             <TableCell><strong>Field</strong></TableCell>
                                             <TableCell><strong>Status</strong></TableCell>
                                             <TableCell><strong>Value</strong></TableCell>
                                           </TableRow>
                                         </TableHead>
                                         <TableBody>
                                           <TableRow>
                                             <TableCell>Document Owners</TableCell>
                                             <TableCell>
                                               <Chip 
                                                 label={documentAnalysis.details.owners?.length > 0 ? 'Found' : 'Missing'}
                                                 color={documentAnalysis.details.owners?.length > 0 ? 'success' : 'error'}
                                                 size="small"
                                               />
                                             </TableCell>
                                             <TableCell>
                                               {documentAnalysis.details.owners?.join(', ') || 'Not found'}
                                             </TableCell>
                                           </TableRow>
                                           <TableRow>
                                             <TableCell>Risk Rating</TableCell>
                                             <TableCell>
                                               <Chip 
                                                 label={documentAnalysis.details.riskRating ? 'Found' : 'Missing'}
                                                 color={documentAnalysis.details.riskRating ? 'success' : 'error'}
                                                 size="small"
                                               />
                                             </TableCell>
                                             <TableCell>
                                               {documentAnalysis.details.riskRating || 'Not specified'}
                                             </TableCell>
                                           </TableRow>
                                           <TableRow>
                                             <TableCell>Periodic Review</TableCell>
                                             <TableCell>
                                               <Chip 
                                                 label={documentAnalysis.details.periodicReview ? 'Found' : 'Missing'}
                                                 color={documentAnalysis.details.periodicReview ? 'success' : 'error'}
                                                 size="small"
                                               />
                                             </TableCell>
                                             <TableCell>
                                               {documentAnalysis.details.periodicReview || 'Not specified'}
                                             </TableCell>
                                           </TableRow>
                                           <TableRow>
                                             <TableCell>Sign-off Dates</TableCell>
                                             <TableCell>
                                               <Chip 
                                                 label={documentAnalysis.details.signOffDates?.length > 0 ? 'Found' : 'Missing'}
                                                 color={documentAnalysis.details.signOffDates?.length > 0 ? 'success' : 'error'}
                                                 size="small"
                                               />
                                             </TableCell>
                                             <TableCell>
                                               {documentAnalysis.details.signOffDates?.join(', ') || 'Not found'}
                                             </TableCell>
                                           </TableRow>
                                           <TableRow>
                                             <TableCell>Departments</TableCell>
                                             <TableCell>
                                               <Chip 
                                                 label={documentAnalysis.details.departments?.length > 0 ? 'Found' : 'Missing'}
                                                 color={documentAnalysis.details.departments?.length > 0 ? 'success' : 'error'}
                                                 size="small"
                                               />
                                             </TableCell>
                                             <TableCell>
                                               {documentAnalysis.details.departments?.join(', ') || 'Not found'}
                                             </TableCell>
                                           </TableRow>
                                         </TableBody>
                                       </Table>
                                     </TableContainer>
                                   </AccordionDetails>
                                 </Accordion>
                               )}

                               {/* AI Recommendations Table */}
                               {documentAnalysis.aiRecommendations?.length > 0 && (
                                 <Accordion>
                                   <AccordionSummary expandIcon={<ExpandMore />}>
                                     <Typography variant="h6">
                                       🤖 AI Recommendations ({documentAnalysis.aiRecommendations.length})
                                     </Typography>
                                   </AccordionSummary>
                                   <AccordionDetails>
                                     <TableContainer component={Paper} variant="outlined">
                                       <Table size="small">
                                         <TableHead>
                                           <TableRow>
                                             <TableCell>Priority</TableCell>
                                             <TableCell>Category</TableCell>
                                             <TableCell>Recommendation</TableCell>
                                             <TableCell>Impact</TableCell>
                                           </TableRow>
                                         </TableHead>
                                         <TableBody>
                                           {documentAnalysis.aiRecommendations.map((rec, index) => (
                                             <TableRow key={index}>
                                               <TableCell>
                                                 <Chip 
                                                   label={rec.priority}
                                                   size="small"
                                                   color={rec.priority === 'HIGH' ? 'error' : rec.priority === 'MEDIUM' ? 'warning' : 'info'}
                                                 />
                                               </TableCell>
                                               <TableCell>{rec.category}</TableCell>
                                               <TableCell>{rec.message}</TableCell>
                                               <TableCell>{rec.impact}</TableCell>
                                             </TableRow>
                                           ))}
                                         </TableBody>
                                       </Table>
                                     </TableContainer>
                                   </AccordionDetails>
                                 </Accordion>
                               )}
                             </CardContent>
                           </Card>

                           {/* Status Alert */}
                           {documentAnalysis.accepted ? (
                             <Alert severity="success" sx={{ mt: 2 }}>
                               <Typography variant="body2">
                                 <strong>✅ Document Approved!</strong> The new document meets quality requirements and can be submitted.
                               </Typography>
                             </Alert>
                           ) : (
                             <Alert severity="error" sx={{ mt: 2 }}>
                               <Typography variant="body2">
                                 <strong>❌ Document Rejected!</strong> Please improve the document quality and re-analyze before proceeding.
                               </Typography>
                             </Alert>
                           )}

                           {/* Action Buttons */}
                           <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
                             <Button
                               variant="outlined"
                               onClick={handleReset}
                               startIcon={<Refresh />}
                               disabled={loading}
                             >
                               Reset Form
                             </Button>
                             <Button
                               variant="contained"
                               onClick={() => setActiveStep(3)}
                               disabled={loading || !documentAnalysis.accepted}
                               startIcon={<Save />}
                               size="large"
                               sx={{ 
                                 minWidth: 200,
                                 background: HSBCColors.gradients.redPrimary,
                                 borderRadius: '12px'
                               }}
                             >
                               Continue to Submit
                             </Button>
                           </Box>

                           {!documentAnalysis.accepted && (
                             <Alert severity="warning" sx={{ mt: 2 }}>
                               <Typography variant="body2" fontWeight="bold">
                                 ⚠️ Amendment Blocked: Document must achieve at least 85% quality score before submission.
                               </Typography>
                               <Typography variant="body2">
                                 Please address the AI recommendations above and re-analyze your document.
                               </Typography>
                             </Alert>
                           )}
                         </Box>
                       )}

                       {/* Step 3: Submit Amendment with Correct SiteAssets Info */}
                       {index === 3 && (
                         <Box>
                           <Alert severity="info" sx={{ mb: 3 }}>
                             <Typography variant="h6" gutterBottom>
                               📋 Amendment Summary
                             </Typography>
                             <Typography variant="body2" sx={{ mb: 2 }}>
                               <strong>Procedure:</strong> {procedure?.name}
                             </Typography>
                             <Typography variant="body2" sx={{ mb: 2 }}>
                               <strong>Changes:</strong> {formData.amendment_summary}
                             </Typography>
                             <Typography variant="body2" sx={{ mb: 2 }}>
                               <strong>New Quality Score:</strong> {documentAnalysis?.score}%
                               (Previous: {procedure?.score || 0}%)
                             </Typography>
                             <Typography variant="body2" sx={{ mb: 2 }}>
                               <strong>Target SiteAssets Location:</strong> {existingDocumentInfo?.sharePointPath}
                             </Typography>
                             <Typography variant="body2" sx={{ mb: 2 }}>
                               <strong>Full SharePoint Path:</strong> {existingDocumentInfo?.fullFolderPath}
                             </Typography>
                             {existingDocumentInfo?.subFolder !== 'General' && (
                               <Typography variant="body2" sx={{ mb: 2, color: 'success.main', fontWeight: 'bold' }}>
                                 ✅ <strong>Using Actual Subfolder:</strong> {existingDocumentInfo.subFolder} (not Generic)
                               </Typography>
                             )}
                             <Typography variant="body2">
                               <strong>Notifications will be sent to:</strong>
                               <br />• Primary Owner: {procedure?.primary_owner} ({procedure?.primary_owner_email})
                               {formData.secondary_owner_email && (
                                 <>
                                   <br />• Secondary Owner: {formData.secondary_owner} ({formData.secondary_owner_email})
                                 </>
                               )}
                               <br />• All administrators
                             </Typography>
                           </Alert>

                           <Stack direction="row" spacing={2}>
                             <Button
                               variant="outlined"
                               onClick={handleReset}
                               startIcon={<Refresh />}
                               disabled={loading}
                             >
                               Reset Form
                             </Button>
                             <Button
                               variant="contained"
                               onClick={handleSubmitAmendment}
                               disabled={loading || !documentAnalysis?.accepted}
                               startIcon={loading ? <CircularProgress size={20} /> : <Save />}
                               sx={{
                                 background: HSBCColors.gradients.redPrimary,
                                 borderRadius: '12px',
                                 px: 4,
                                 py: 1.5,
                                 fontWeight: 700,
                                 flex: 1
                               }}
                             >
                               {loading ? 'Submitting Amendment...' : 'Submit Amendment'}
                             </Button>
                           </Stack>
                         </Box>
                       )}
                     </StepContent>
                   </Step>
                 ))}
               </Stepper>
             </CardContent>
           </GlassmorphismCard>
         </motion.div>

         {/* Status Messages */}
         {submitStatus === 'success' && (
           <motion.div
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             transition={{ duration: 0.5 }}
           >
             <Alert severity="success" sx={{ mb: 3 }}>
               <Typography variant="h6" gutterBottom>
                 🎉 Amendment Successful!
               </Typography>
               <Typography variant="body2">
                 The procedure has been successfully amended and all stakeholders have been notified.
                 You will be redirected shortly.
               </Typography>
             </Alert>
           </motion.div>
         )}

         {submitStatus === 'error' && (
           <motion.div
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             transition={{ duration: 0.5 }}
           >
             <Alert severity="error" sx={{ mb: 3 }}>
               <Typography variant="h6" gutterBottom>
                 ❌ Amendment Failed
               </Typography>
               <Typography variant="body2">
                 There was an error processing the amendment. Please try again or contact support.
               </Typography>
             </Alert>
           </motion.div>
         )}
       </DialogContent>

       {/* Enhanced Action Buttons */}
       <DialogActions sx={{ p: 3, background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)' }}>
         <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
           <Button
             onClick={onClose}
             variant="outlined"
             disabled={loading}
             sx={{
               borderRadius: '12px',
               px: 3,
               py: 1.5,
               fontWeight: 700,
               flex: 1
             }}
           >
             {submitStatus === 'success' ? 'Close' : 'Cancel'}
           </Button>

           {activeStep > 0 && activeStep < 3 && (
             <Button
               onClick={() => setActiveStep(prev => prev - 1)}
               variant="outlined"
               disabled={loading}
               sx={{
                 borderRadius: '12px',
                 px: 3,
                 py: 1.5,
                 fontWeight: 700
               }}
             >
               Previous Step
             </Button>
           )}

           {activeStep === 0 && formData.amendment_summary.length >= 10 && (
             <Button
               onClick={() => setActiveStep(1)}
               variant="contained"
               sx={{
                 background: HSBCColors.gradients.redPrimary,
                 borderRadius: '12px',
                 px: 4,
                 py: 1.5,
                 fontWeight: 700,
                 flex: 2
               }}
             >
               Continue to Upload
             </Button>
           )}

           {activeStep === 1 && selectedFile && (
             <Button
               onClick={analyzeDocument}
               variant="contained"
               disabled={submitStatus === 'analyzing'}
               startIcon={submitStatus === 'analyzing' ? <CircularProgress size={20} /> : <Analytics />}
               sx={{
                 background: HSBCColors.gradients.redPrimary,
                 borderRadius: '12px',
                 px: 4,
                 py: 1.5,
                 fontWeight: 700,
                 flex: 2
               }}
             >
               {submitStatus === 'analyzing' ? 'Analyzing...' : 'Analyze Document'}
             </Button>
           )}

           {activeStep === 2 && documentAnalysis?.accepted && (
             <Button
               onClick={() => setActiveStep(3)}
               variant="contained"
               sx={{
                 background: HSBCColors.gradients.redPrimary,
                 borderRadius: '12px',
                 px: 4,
                 py: 1.5,
                 fontWeight: 700,
                 flex: 2
               }}
             >
               Continue to Submit
             </Button>
           )}
         </Stack>
       </DialogActions>

       {/* Loading Backdrop */}
       <Backdrop
         sx={{
           color: '#fff',
           zIndex: (theme) => theme.zIndex.drawer + 1,
           backdropFilter: 'blur(10px)'
         }}
         open={loading && submitStatus === 'uploading'}
       >
         <Box sx={{ textAlign: 'center' }}>
           <CircularProgress color="inherit" size={60} />
           <Typography variant="h6" sx={{ mt: 2 }}>
             Processing Amendment...
           </Typography>
           <Typography variant="body2">
             Updating SharePoint SiteAssets and sending notifications
           </Typography>
         </Box>
       </Backdrop>
     </EnhancedDialog>
   </AmendmentErrorBoundary>
 );
};

export default ProcedureAmendModal;
