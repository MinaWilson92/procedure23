// pages/AdminPanelPage.js - Next-Gen HSBC Professional Admin Panel
import React, { useState, useEffect } from 'react';
import {
  Box, Container, Typography, Card, CardContent, TextField, Button,
  Select, MenuItem, FormControl, InputLabel, Grid, Alert, 
  Stepper, Step, StepLabel, StepContent, LinearProgress, Chip,
  IconButton, Divider, List, ListItem, ListItemIcon, ListItemText,
  CircularProgress, Backdrop, Accordion, AccordionSummary, AccordionDetails,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Stack,
  Avatar, Tooltip, Fab, CardHeader, useTheme, styled, keyframes, alpha
} from '@mui/material';
import {
  CloudUpload, ArrowBack, CheckCircle, Error, Warning, Info,
  Assignment, Analytics, Save, Cancel, Refresh, ExpandMore,
  Security, CalendarToday, Assessment, OpenInNew, Close,
  ErrorOutline, CheckCircleOutline, Star, Speed, Psychology,
  AutoAwesome, Celebration, LocalFireDepartment, Insights,
  Timeline, TrendingUp, AccountBalance, AdminPanelSettings
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigation } from '../contexts/NavigationContext';
import { useSharePoint } from '../SharePointContext';
import DocumentAnalyzer from '../services/DocumentAnalyzer';
import EmailNotificationService from '../services/EmailNotificationService';

// 🎨 **HSBC Brand Colors (Official)**
const HSBCColors = {
  primary: '#DB0011',
  secondary: '#9FA1A4',
  black: '#000000',
  white: '#FFFFFF',
  gradients: {
    redPrimary: 'linear-gradient(135deg, #DB0011 0%, #B50010 50%, #8B000C 100%)',
    redSecondary: 'linear-gradient(135deg, #FF1B2D 0%, #DB0011 50%, #B50010 100%)',
    darkMatter: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #404040 100%)',
    lightGlass: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)',
    modernGlass: 'linear-gradient(135deg, rgba(219,0,17,0.1) 0%, rgba(159,161,164,0.05) 100%)',
    successGlass: 'linear-gradient(135deg, rgba(76,175,80,0.1) 0%, rgba(76,175,80,0.05) 100%)',
    warningGlass: 'linear-gradient(135deg, rgba(255,152,0,0.1) 0%, rgba(255,152,0,0.05) 100%)',
    errorGlass: 'linear-gradient(135deg, rgba(244,67,54,0.1) 0%, rgba(244,67,54,0.05) 100%)'
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

const hexagonRotate = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

// 🎨 **Styled Components with HSBC Branding**
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
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
    transition: 'left 0.5s'
  },
  '&:hover': {
    transform: 'translateY(-4px) scale(1.01)',
    boxShadow: variant === 'primary' 
      ? '0 30px 80px rgba(219,0,17,0.4), inset 0 1px 0 rgba(255,255,255,0.3)'
      : '0 30px 80px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.9)',
    '&::before': {
      left: '100%'
    }
  }
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
  animation: `${hexagonRotate} 20s linear infinite`,
  '&::after': {
    content: '""',
    position: 'absolute',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(45deg, rgba(255,255,255,0.3) 0%, transparent 100%)',
    clipPath: 'inherit'
  }
}));

const EnhancedStepper = styled(Stepper)(({ theme }) => ({
  '& .MuiStepLabel-root .Mui-completed': {
    color: HSBCColors.primary,
  },
  '& .MuiStepLabel-root .Mui-active': {
    color: HSBCColors.primary,
  },
  '& .MuiStepConnector-root': {
    borderLeftWidth: 3,
  },
  '& .MuiStepConnector-line': {
    borderColor: alpha(HSBCColors.primary, 0.3),
  },
  '& .Mui-completed .MuiStepConnector-line': {
    borderColor: HSBCColors.primary,
  }
}));

const StylishTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
    },
    '&.Mui-focused': {
      transform: 'translateY(-2px)',
      boxShadow: `0 8px 24px ${alpha(HSBCColors.primary, 0.2)}`
    }
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: HSBCColors.primary
  }
}));

const AdminPanelPage = ({ onDataRefresh }) => {
  const { navigate } = useNavigation();
  const { user, isAdmin } = useSharePoint();
  const theme = useTheme();
  const [documentAnalyzer] = useState(() => new DocumentAnalyzer());
  const [emailNotificationService] = useState(() => new EmailNotificationService());
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Form state (keeping all your original state)
  const [formData, setFormData] = useState({
    name: '',
    expiry: '',
    primary_owner: '',
    primary_owner_email: '',
    secondary_owner: '',
    secondary_owner_email: '',
    lob: '',
    procedure_subsection: '',
    sharepoint_folder: ''
  });

  // UI state (keeping all your original state)
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('ready');
  const [activeStep, setActiveStep] = useState(0);
  const [documentAnalysis, setDocumentAnalysis] = useState(null);

  // Modal Dialog States (keeping all your original dialog state)
  const [errorDialog, setErrorDialog] = useState({
    open: false,
    title: '',
    message: '',
    details: null,
    severity: 'error'
  });

  const [successDialog, setSuccessDialog] = useState({
    open: false,
    title: '',
    message: '',
    details: null
  });

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // 🕒 **Real-time Clock**
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 🎯 **All your original functions stay EXACTLY the same**
  const showErrorDialog = (title, message, details = null) => {
    setErrorDialog({
      open: true,
      title,
      message,
      details,
      severity: 'error'
    });
  };

  const showSuccessDialog = (title, message, details = null) => {
    setSuccessDialog({
      open: true,
      title,
      message,
      details
    });
  };

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const closeErrorDialog = () => {
    setErrorDialog(prev => ({ ...prev, open: false }));
  };

  const closeSuccessDialog = () => {
    setSuccessDialog(prev => ({ ...prev, open: false }));
  };

  const closeSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Stepper steps with enhanced icons
  const steps = [
    { 
      label: 'Procedure Details', 
      description: 'Enter procedure information',
      icon: <Assignment />,
      color: '#2196f3'
    },
    { 
      label: 'Document Upload', 
      description: 'Upload and validate document',
      icon: <CloudUpload />,
      color: '#ff9800'
    },
    { 
      label: 'AI Analysis', 
      description: 'AI quality analysis and scoring',
      icon: <Psychology />,
      color: '#9c27b0'
    },
    { 
      label: 'SharePoint Upload', 
      description: 'Final upload if score ≥ 85%',
      icon: <AccountBalance />,
      color: '#4caf50'
    }
  ];

  // Keep ALL your original useEffect and handler functions EXACTLY the same
  useEffect(() => {
    if (!isAdmin) {
      showErrorDialog(
        'Access Denied',
        'You do not have admin privileges to access this page.',
        `User ID: ${user?.staffId} | Role: ${user?.role || 'user'}`
      );
      setTimeout(() => navigate('home'), 5000);
      return;
    }
    
    console.log('✅ Admin access granted for user:', {
      staffId: user?.staffId,
      displayName: user?.displayName,
      role: user?.role
    });
  }, [isAdmin, user, navigate]);

  useEffect(() => {
    const defaultExpiry = new Date();
    defaultExpiry.setFullYear(defaultExpiry.getFullYear() + 1);
    
    setFormData(prev => ({
      ...prev,
      expiry: defaultExpiry.toISOString().split('T')[0],
      primary_owner: user?.displayName || ''
    }));
  }, [user]);

  // Keep ALL your original handler functions
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'lob') {
      setFormData(prev => ({
        ...prev,
        procedure_subsection: ''
      }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        documentAnalyzer.validateFile(file);
        setSelectedFile(file);
        setDocumentAnalysis(null);
        setActiveStep(1);
        showSnackbar(`File selected: ${file.name}`, 'success');
      } catch (err) {
        showErrorDialog(
          'Invalid File',
          'The selected file does not meet the requirements.',
          err.message
        );
        setSelectedFile(null);
        e.target.value = '';
      }
    }
  };

  const analyzeDocument = async () => {
    if (!selectedFile) {
      showErrorDialog(
        'No File Selected',
        'Please select a document file before analyzing.',
        'You must choose a PDF, DOC, or DOCX file to proceed with analysis.'
      );
      return;
    }

    try {
      setSubmitStatus('analyzing');
      showSnackbar('Starting AI document analysis...', 'info');

      const analysisResult = await documentAnalyzer.analyzeDocument(selectedFile, {
        name: formData.name,
        lob: formData.lob,
        subsection: formData.procedure_subsection
      });

      setDocumentAnalysis(analysisResult);
      setActiveStep(2);
      setSubmitStatus('ready');

      if (analysisResult.accepted) {
        showSuccessDialog(
          'Document Analysis Completed! ✅',
          `Your document achieved a quality score of ${analysisResult.score}% which meets the 85% minimum requirement.`,
          'The document is ready for upload to SharePoint.'
        );
      } else {
        showErrorDialog(
          'Document Quality Score Too Low ❌',
          `Your document scored ${analysisResult.score}% but requires at least 85% to proceed.`,
          `Please review the AI recommendations and improve your document. Missing elements: ${analysisResult.details.missingElements?.length || 0}`
        );
      }

    } catch (err) {
      showErrorDialog(
        'Analysis Failed',
        'The AI document analysis encountered an error.',
        `Error details: ${err.message}`
      );
      setSubmitStatus('ready');
    }
  };

  const validateForm = () => {
    const errors = [];

    if (!formData.name) errors.push('• Procedure Name is required');
    if (!formData.primary_owner) errors.push('• Primary Owner is required');
    if (!formData.lob) errors.push('• Line of Business (LOB) is required');

    if (formData.primary_owner && formData.primary_owner.includes('@')) {
      errors.push('• Primary Owner should be a name, not an email address');
    }

    if (formData.primary_owner_email && !formData.primary_owner_email.includes('@')) {
      errors.push('• Please enter a valid email address for Primary Owner Email');
    }

    if (errors.length > 0) {
      showErrorDialog(
        'Form Validation Errors',
        'Please fix the following issues before proceeding:',
        errors.join('\n')
      );
      return false;
    }

    return true;
  };

  const handleUploadToSharePoint = async () => {
    if (!documentAnalysis?.accepted) {
      showErrorDialog(
        'Upload Not Allowed',
        'Document must achieve at least 85% quality score before upload.',
        `Current score: ${documentAnalysis?.score || 0}%. Please improve your document and re-analyze.`
      );
      return;
    }

    try {
      if (!validateForm()) {
        return;
      }

      setLoading(true);
      setSubmitStatus('uploading');
      setActiveStep(3);
      showSnackbar('Uploading to SharePoint...', 'info');

      const uploadData = {
        ...formData,
        uploaded_by_user_id: user?.staffId,
        uploaded_by_name: user?.displayName,
        uploaded_by_role: user?.role
      };

      const result = await documentAnalyzer.uploadProcedureWithAnalysis(uploadData, selectedFile);

      if (result.success) {
        showSuccessDialog(
          'Upload Successful! 🎉',
          `Your procedure has been successfully uploaded to SharePoint.`,
          `Procedure ID: ${result.procedureId}\nQuality Score: ${documentAnalysis.score}%\nUploaded by: ${user?.displayName}`
        );
        setSubmitStatus('success');
        setTimeout(() => {
          handleReset();
          if (onDataRefresh) onDataRefresh();
        }, 3000);
        
        try {
          await emailNotificationService.triggerProcedureUploadNotification(result);
        } catch (emailError) {
          console.warn('⚠️ Procedure uploaded but email notification failed:', emailError);
        }
      } else {
        showErrorDialog(
          'Upload Failed',
          'The procedure could not be uploaded to SharePoint.',
          result.message || 'Unknown error occurred during upload.'
        );
        setSubmitStatus('error');
      }

    } catch (err) {
      showErrorDialog(
        'Upload Error',
        'An unexpected error occurred while uploading to SharePoint.',
        `Error details: ${err.message}`
      );
      setSubmitStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    const defaultExpiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    
    setFormData({
      name: '',
      expiry: defaultExpiry.toISOString().split('T')[0],
      primary_owner: user?.displayName || '',
      primary_owner_email: '',
      secondary_owner: '',
      secondary_owner_email: '',
      lob: '',
      procedure_subsection: '',
      sharepoint_folder: ''
    });
    setSelectedFile(null);
    setDocumentAnalysis(null);
    setActiveStep(0);
    setSubmitStatus('ready');
    
    const fileInput = document.getElementById('file-input');
    if (fileInput) fileInput.value = '';

    showSnackbar('Form reset successfully', 'info');
  };

  const getStatusColor = () => {
    switch (submitStatus) {
      case 'success': return 'success';
      case 'error': return 'error';
      case 'analyzing':
      case 'uploading': return 'info';
      default: return 'default';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#4caf50';
    if (score >= 60) return '#ff9800';
    return '#f44336';
  };

  // Show access denied if not admin
  if (!isAdmin) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <GlassmorphismCard variant="error" sx={{ maxWidth: 500, textAlign: 'center' }}>
            <CardContent sx={{ p: 4 }}>
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Error sx={{ fontSize: 80, color: '#f44336', mb: 2 }} />
              </motion.div>
              <Typography variant="h4" fontWeight={800} gutterBottom>
                Access Denied
              </Typography>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Administrator privileges required
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                User ID: {user?.staffId} | Role: {user?.role}
              </Typography>
              <Button 
                variant="contained" 
                onClick={() => navigate('home')}
                startIcon={<ArrowBack />}
                sx={{
                  background: HSBCColors.gradients.redPrimary,
                  borderRadius: '12px',
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 700
                }}
              >
                Return to Home
              </Button>
            </CardContent>
          </GlassmorphismCard>
        </motion.div>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
      {/* 🌟 **NEXT-GEN HEADER with HSBC Branding** */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <Box sx={{ 
          background: HSBCColors.gradients.darkMatter,
          color: 'white',
          py: 4,
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Animated Background Pattern */}
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'url("data:image/svg+xml,%3Csvg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="rgba(255,255,255,0.05)" fill-opacity="1" fill-rule="evenodd"%3E%3Cpath d="m0 40l40-40h-40z"/%3E%3C/g%3E%3C/svg%3E")',
            opacity: 0.1
          }} />
          
          <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
            <Stack direction="row" alignItems="center" spacing={3}>
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <IconButton onClick={() => navigate('home')} sx={{ color: 'white', p: 2 }}>
                  <ArrowBack sx={{ fontSize: 28 }} />
                </IconButton>
              </motion.div>
              
              <HSBCHexagon size={60}>
                <AdminPanelSettings sx={{ color: 'white', fontSize: 24 }} />
              </HSBCHexagon>
              
              <Box sx={{ flex: 1 }}>
                <Typography 
                  variant="h3" 
                  fontWeight={900}
                  sx={{
                    background: 'linear-gradient(45deg, #fff 0%, #f0f0f0 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontFamily: '"Inter", "Roboto", sans-serif',
                    letterSpacing: '-0.02em'
                  }}
                >
                  Admin Upload Panel
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 500 }}>
                  AI-Powered Document Analysis & SharePoint Integration
                </Typography>
              </Box>
              
              {/* Live Clock & User Info */}
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="h5" fontWeight={700}>
                    {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    {currentTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Typography>
                </Box>
                
                <Avatar 
                  src={user?.PictureURL || `https://photos.global.hsbc/GetPhoto.ashx?pose=casual&format=square&empid=${user?.staffId}`}
                  sx={{ 
                    width: 50, 
                    height: 50,
                    border: '3px solid rgba(255,255,255,0.3)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
                  }}
                >
                  {user?.displayName?.[0]}
                </Avatar>
                
                <Stack spacing={0.5}>
                  <Chip 
                    label={user?.displayName || user?.staffId}
                    size="small"
                    sx={{ 
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      fontWeight: 600,
                      fontSize: '0.75rem'
                    }}
                  />
                  <Chip 
                    label="ADMINISTRATOR"
                    size="small"
                    sx={{ 
                      background: HSBCColors.gradients.redPrimary,
                      color: 'white',
                      fontWeight: 800,
                      fontSize: '0.7rem',
                      animation: `${pulseGlow} 3s infinite`
                    }}
                  />
                </Stack>
              </Stack>
            </Stack>
          </Container>
        </Box>
      </motion.div>

      {/* ✅ Enhanced Error Dialog */}
      <Dialog 
        open={errorDialog.open} 
        onClose={closeErrorDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '24px',
            border: `3px solid ${HSBCColors.primary}`,
            overflow: 'hidden'
          }
        }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <DialogTitle sx={{ 
            background: HSBCColors.gradients.errorGlass,
            color: '#d32f2f',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            pb: 2
          }}>
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <ErrorOutline sx={{ fontSize: 36 }} />
            </motion.div>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" fontWeight={800}>
                {errorDialog.title}
              </Typography>
            </Box>
            <IconButton onClick={closeErrorDialog} size="small">
              <Close />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <Typography variant="body1" gutterBottom sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
              {errorDialog.message}
            </Typography>
            {errorDialog.details && (
              <Paper sx={{ 
                p: 3, 
                mt: 2, 
                bgcolor: '#fafafa',
                borderRadius: '12px',
                border: '1px solid #e0e0e0'
              }}>
                <Typography variant="body2" color="text.secondary" sx={{ 
                  fontFamily: 'monospace', 
                  whiteSpace: 'pre-line',
                  fontSize: '0.9rem'
                }}>
                  {errorDialog.details}
                </Typography>
              </Paper>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button 
              onClick={closeErrorDialog} 
              variant="contained" 
              sx={{
                background: HSBCColors.gradients.redPrimary,
                borderRadius: '12px',
                px: 4,
                py: 1.5,
                fontWeight: 700
              }}
              autoFocus
            >
              Understood
            </Button>
          </DialogActions>
        </motion.div>
      </Dialog>

      {/* ✅ Enhanced Success Dialog */}
      <Dialog 
        open={successDialog.open} 
        onClose={closeSuccessDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '24px',
            border: '3px solid #4caf50',
            overflow: 'hidden'
          }
        }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <DialogTitle sx={{ 
                        background: HSBCColors.gradients.successGlass,
            color: '#2e7d32',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            pb: 2
          }}>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <CheckCircleOutline sx={{ fontSize: 36 }} />
            </motion.div>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" fontWeight={800}>
                {successDialog.title}
              </Typography>
            </Box>
            <IconButton onClick={closeSuccessDialog} size="small">
              <Close />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <Typography variant="body1" gutterBottom sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
              {successDialog.message}
            </Typography>
            {successDialog.details && (
              <Paper sx={{ 
                p: 3, 
                mt: 2, 
                bgcolor: '#f1f8e9',
                borderRadius: '12px',
                border: '1px solid #c8e6c9'
              }}>
                <Typography variant="body2" color="text.secondary" sx={{ 
                  fontFamily: 'monospace', 
                  whiteSpace: 'pre-line',
                  fontSize: '0.9rem'
                }}>
                  {successDialog.details}
                </Typography>
              </Paper>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button 
              onClick={closeSuccessDialog} 
              variant="contained" 
              color="success"
              sx={{
                borderRadius: '12px',
                px: 4,
                py: 1.5,
                fontWeight: 700
              }}
              autoFocus
            >
              Excellent!
            </Button>
          </DialogActions>
        </motion.div>
      </Dialog>

      {/* ✅ Enhanced Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={closeSnackbar} 
          severity={snackbar.severity} 
          sx={{ 
            width: '100%',
            borderRadius: '12px',
            fontWeight: 600
          }}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Grid container spacing={4}>
          {/* 📋 **LEFT PANEL - Enhanced Form** */}
          <Grid item xs={12} lg={8}>
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <GlassmorphismCard>
                <CardHeader
                  avatar={
                    <HSBCHexagon size={50}>
                      <Typography variant="h6" color="white" fontWeight={900}>
                        AI
                      </Typography>
                    </HSBCHexagon>
                  }
                  title={
                    <Typography variant="h4" fontWeight={800}>
                      Smart Upload Workflow
                    </Typography>
                  }
                  subheader={
                    <Typography variant="body1" color="text.secondary">
                      AI-powered document analysis with automated quality scoring
                    </Typography>
                  }
                />
                
                <CardContent sx={{ p: 4 }}>
                  {/* 🎯 **Enhanced Progress Stepper** */}
                  <Box sx={{ mb: 4 }}>
                    <EnhancedStepper activeStep={activeStep} orientation="vertical">
                      {steps.map((step, index) => (
                        <Step key={step.label}>
                          <StepLabel
                            StepIconComponent={() => (
                              <Box sx={{
                                width: 40,
                                height: 40,
                                borderRadius: '50%',
                                background: index <= activeStep 
                                  ? HSBCColors.gradients.redPrimary 
                                  : 'linear-gradient(135deg, #e0e0e0 0%, #bdbdbd 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                boxShadow: index <= activeStep 
                                  ? `0 4px 16px ${alpha(HSBCColors.primary, 0.4)}`
                                  : '0 2px 8px rgba(0,0,0,0.1)',
                                transition: 'all 0.3s ease'
                              }}>
                                {React.cloneElement(step.icon, { 
                                  sx: { fontSize: 20 } 
                                })}
                              </Box>
                            )}
                          >
                            <Typography variant="h6" fontWeight={700}>
                              {step.label}
                            </Typography>
                          </StepLabel>
                          <StepContent>
                            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                              {step.description}
                            </Typography>
                          </StepContent>
                        </Step>
                      ))}
                    </EnhancedStepper>
                  </Box>

                  {/* 📝 **Step 1: Enhanced Procedure Details** */}
                  {activeStep >= 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <Box sx={{ mb: 4 }}>
                        <Paper sx={{ 
                          p: 4, 
                          borderRadius: '20px',
                          background: HSBCColors.gradients.modernGlass,
                          border: `1px solid ${alpha(HSBCColors.primary, 0.1)}`
                        }}>
                          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                            <Assignment sx={{ color: HSBCColors.primary, fontSize: 32 }} />
                            <Typography variant="h5" fontWeight={800}>
                              Procedure Information
                            </Typography>
                            <Chip 
                              label="Step 1"
                              size="small"
                              sx={{ 
                                background: HSBCColors.gradients.redPrimary,
                                color: 'white',
                                fontWeight: 700
                              }}
                            />
                          </Stack>
                          
                          <Grid container spacing={3}>
                            <Grid item xs={12}>
                              <StylishTextField
                                fullWidth
                                label="Procedure Name"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                required
                                variant="outlined"
                                placeholder="Enter a descriptive name for the procedure"
                                helperText="✨ Give your procedure a clear, descriptive name"
                              />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                              <FormControl fullWidth required>
                                <InputLabel sx={{ 
                                  '&.Mui-focused': { color: HSBCColors.primary }
                                }}>
                                  Line of Business (LOB)
                                </InputLabel>
                                <Select
                                  name="lob"
                                  value={formData.lob}
                                  onChange={handleInputChange}
                                  label="Line of Business (LOB)"
                                  sx={{
                                    borderRadius: '12px',
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                      borderColor: HSBCColors.primary
                                    }
                                  }}
                                >
                                  <MenuItem value="">
                                    <em>Select LOB</em>
                                  </MenuItem>
                                  <MenuItem value="IWPB">
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                      <Box sx={{ fontSize: 20 }}>🏦</Box>
                                      <Box>
                                        <Typography variant="body1" fontWeight={600}>IWPB</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                          International Wealth & Premier Banking
                                        </Typography>
                                      </Box>
                                    </Stack>
                                  </MenuItem>
                                  <MenuItem value="CIB">
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                      <Box sx={{ fontSize: 20 }}>🏢</Box>
                                      <Box>
                                        <Typography variant="body1" fontWeight={600}>CIB</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                          Commercial & Institutional Banking
                                        </Typography>
                                      </Box>
                                    </Stack>
                                  </MenuItem>
                                  <MenuItem value="GCOO">
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                      <Box sx={{ fontSize: 20 }}>⚙️</Box>
                                      <Box>
                                        <Typography variant="body1" fontWeight={600}>GCOO</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                          Group Chief Operating Officer
                                        </Typography>
                                      </Box>
                                    </Stack>
                                  </MenuItem>
                                </Select>
                              </FormControl>
                            </Grid>

                            <Grid item xs={12} sm={6}>
                              <FormControl fullWidth disabled={!formData.lob}>
                                <InputLabel>Procedure Subsection</InputLabel>
                                <Select
                                  name="procedure_subsection"
                                  value={formData.procedure_subsection}
                                  onChange={handleInputChange}
                                  label="Procedure Subsection"
                                  sx={{ borderRadius: '12px' }}
                                >
                                  <MenuItem value="">
                                    <em>Select Subsection</em>
                                  </MenuItem>
                                  {formData.lob && documentAnalyzer.getSubsections(formData.lob).map(option => (
                                    <MenuItem key={option.value} value={option.value}>
                                      {option.label}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </Grid>

                            <Grid item xs={12} sm={6}>
                              <StylishTextField
                                fullWidth
                                label="Primary Owner (Name)"
                                name="primary_owner"
                                value={formData.primary_owner}
                                onChange={handleInputChange}
                                required
                                variant="outlined"
                                placeholder="Enter the full name of the primary owner"
                                helperText="✅ Auto-populated with your name"
                              />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                              <StylishTextField
                                fullWidth
                                label="Primary Owner Email"
                                name="primary_owner_email"
                                value={formData.primary_owner_email}
                                onChange={handleInputChange}
                                type="email"
                                variant="outlined"
                                placeholder="Enter the email address"
                                helperText="📧 Enter email address manually"
                              />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                              <StylishTextField
                                fullWidth
                                label="Secondary Owner (Optional)"
                                name="secondary_owner"
                                value={formData.secondary_owner}
                                onChange={handleInputChange}
                                variant="outlined"
                                placeholder="Enter secondary owner name"
                              />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                              <StylishTextField
                                fullWidth
                                label="Secondary Owner Email (Optional)"
                                name="secondary_owner_email"
                                value={formData.secondary_owner_email}
                                onChange={handleInputChange}
                                type="email"
                                variant="outlined"
                                placeholder="Enter secondary owner email"
                              />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                              <StylishTextField
                                fullWidth
                                label="Expiry Date"
                                name="expiry"
                                value={formData.expiry}
                                onChange={handleInputChange}
                                type="date"
                                required
                                variant="outlined"
                                InputLabelProps={{ shrink: true }}
                                helperText="📅 Defaults to 1 year from today"
                              />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                              <StylishTextField
                                fullWidth
                                label="SharePoint Folder (Optional)"
                                name="sharepoint_folder"
                                value={formData.sharepoint_folder}
                                onChange={handleInputChange}
                                variant="outlined"
                                placeholder="Custom SharePoint folder path"
                                helperText="🗂️ Leave empty for default structure"
                              />
                            </Grid>
                          </Grid>

                          {formData.name && formData.lob && formData.primary_owner && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.3 }}
                            >
                              <Button
                                variant="contained"
                                onClick={() => setActiveStep(1)}
                                sx={{ 
                                  mt: 3,
                                  background: HSBCColors.gradients.redPrimary,
                                  borderRadius: '12px',
                                  px: 4,
                                  py: 1.5,
                                  fontSize: '1.1rem',
                                  fontWeight: 700,
                                  boxShadow: `0 8px 24px ${alpha(HSBCColors.primary, 0.3)}`,
                                  '&:hover': {
                                    transform: 'translateY(-2px)',
                                    boxShadow: `0 12px 32px ${alpha(HSBCColors.primary, 0.4)}`
                                  }
                                }}
                                startIcon={<CloudUpload />}
                              >
                                Continue to Document Upload
                              </Button>
                            </motion.div>
                          )}
                        </Paper>
                      </Box>
                    </motion.div>
                  )}

                  {/* 📤 **Step 2: Enhanced Document Upload** */}
                  {activeStep >= 1 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                    >
                      <Box sx={{ mb: 4 }}>
                        <Paper sx={{ 
                          p: 4, 
                          borderRadius: '20px',
                          background: HSBCColors.gradients.warningGlass,
                          border: `1px solid ${alpha('#ff9800', 0.2)}`
                        }}>
                          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                            <CloudUpload sx={{ color: '#ff9800', fontSize: 32 }} />
                            <Typography variant="h5" fontWeight={800}>
                              Document Upload & Validation
                            </Typography>
                            <Chip 
                              label="Step 2"
                              size="small"
                              sx={{ 
                                background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
                                color: 'white',
                                fontWeight: 700
                              }}
                            />
                          </Stack>

                          <Box sx={{ 
                            border: selectedFile ? '3px solid #4caf50' : '3px dashed #d0d0d0',
                            borderRadius: '20px',
                            p: 4,
                            textAlign: 'center',
                            background: selectedFile 
                              ? 'linear-gradient(135deg, rgba(76,175,80,0.1) 0%, rgba(76,175,80,0.05) 100%)'
                              : 'linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)',
                            transition: 'all 0.4s ease',
                            position: 'relative',
                            overflow: 'hidden'
                          }}>
                            {!selectedFile ? (
                              <motion.div
                                initial={{ scale: 0.8 }}
                                animate={{ scale: 1 }}
                                transition={{ duration: 0.5 }}
                              >
                                <motion.div
                                  animate={{ 
                                    y: [0, -10, 0],
                                    scale: [1, 1.1, 1]
                                  }}
                                  transition={{ 
                                    duration: 3,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                  }}
                                >
                                  <CloudUpload sx={{ fontSize: 80, color: '#ff9800', mb: 2 }} />
                                </motion.div>
                                <Typography variant="h5" fontWeight={800} gutterBottom>
                                  Select Procedure Document
                                </Typography>
                                <Typography variant="body1" color="text.secondary" gutterBottom>
                                  Upload PDF or Word document (.pdf, .docx, .doc)
                                </Typography>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                  Maximum file size: 10MB
                                </Typography>
                                <input
                                  type="file"
                                  id="file-input"
                                  hidden
                                  accept=".pdf,.docx,.doc"
                                  onChange={handleFileChange}
                                />
                                <Button
                                  variant="contained"
                                  component="label"
                                  htmlFor="file-input"
                                  sx={{ 
                                    mt: 3,
                                    background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
                                    borderRadius: '12px',
                                    px: 4,
                                    py: 1.5,
                                    fontSize: '1.1rem',
                                    fontWeight: 700,
                                    boxShadow: '0 8px 24px rgba(255,152,0,0.3)',
                                    '&:hover': {
                                      transform: 'translateY(-2px)',
                                      boxShadow: '0 12px 32px rgba(255,152,0,0.4)'
                                    }
                                  }}
                                  startIcon={<CloudUpload />}
                                >
                                  Choose File
                                </Button>
                              </motion.div>
                            ) : (
                              <motion.div
                                initial={{ scale: 0.8 }}
                                animate={{ scale: 1 }}
                                transition={{ duration: 0.5 }}
                              >
                                <motion.div
                                  animate={{ 
                                    scale: [1, 1.05, 1],
                                    rotate: [0, 5, -5, 0]
                                  }}
                                  transition={{ 
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                  }}
                                >
                                  <CheckCircle sx={{ fontSize: 80, color: '#4caf50', mb: 2 }} />
                                </motion.div>
                                <Typography variant="h5" fontWeight={800} gutterBottom>
                                  File Selected Successfully!
                                </Typography>
                                <Typography variant="h6" color="primary" gutterBottom>
                                  📄 {selectedFile.name}
                                </Typography>
                                <Typography variant="body1" color="text.secondary" gutterBottom>
                                  Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                </Typography>
                                
                                <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 3 }}>
                                  <Button
                                    variant="outlined"
                                    onClick={() => {
                                      setSelectedFile(null);
                                      setDocumentAnalysis(null);
                                      setActiveStep(0);
                                      document.getElementById('file-input').value = '';
                                      showSnackbar('File removed', 'info');
                                    }}
                                    startIcon={<Cancel />}
                                    sx={{ 
                                      borderRadius: '12px',
                                      px: 3,
                                      py: 1.5,
                                      fontWeight: 600
                                    }}
                                  >
                                    Remove File
                                  </Button>
                                  <Button
                                    variant="contained"
                                    onClick={analyzeDocument}
                                    disabled={submitStatus === 'analyzing'}
                                    startIcon={submitStatus === 'analyzing' ? 
                                      <CircularProgress size={20} color="inherit" /> : 
                                      <Psychology />
                                    }
                                    sx={{
                                      background: 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)',
                                      borderRadius: '12px',
                                      px: 4,
                                      py: 1.5,
                                      fontSize: '1.1rem',
                                      fontWeight: 700,
                                      boxShadow: '0 8px 24px rgba(156,39,176,0.3)',
                                      '&:hover': {
                                        transform: 'translateY(-2px)',
                                        boxShadow: '0 12px 32px rgba(156,39,176,0.4)'
                                      }
                                    }}
                                  >
                                    {submitStatus === 'analyzing' ? 'Analyzing...' : 'Analyze with AI'}
                                  </Button>
                                </Stack>
                              </motion.div>
                            )}
                          </Box>
                        </Paper>
                      </Box>
                    </motion.div>
                  )}

                  {/* 🤖 **Step 3: Enhanced AI Analysis Results** */}
                  {activeStep >= 2 && documentAnalysis && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    >
                      <Box sx={{ mb: 4 }}>
                        <Paper sx={{ 
                          p: 4, 
                          borderRadius: '20px',
                          background: documentAnalysis.accepted 
                            ? HSBCColors.gradients.successGlass
                            : HSBCColors.gradients.errorGlass,
                          border: documentAnalysis.accepted 
                            ? '3px solid #4caf50' 
                            : '3px solid #f44336'
                        }}>
                          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                            <Psychology sx={{ 
                              color: documentAnalysis.accepted ? '#4caf50' : '#f44336', 
                              fontSize: 32 
                            }} />
                            <Typography variant="h5" fontWeight={800}>
                              AI Document Quality Analysis
                            </Typography>
                            <Chip 
                              label="Step 3"
                              size="small"
                              sx={{ 
                                background: 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)',
                                color: 'white',
                                fontWeight: 700
                              }}
                            />
                          </Stack>

                          {/* 📊 **Enhanced Score Display** */}
                          <GlassmorphismCard 
                            variant={documentAnalysis.accepted ? 'success' : 'error'}
                            sx={{ mb: 3 }}
                          >
                            <CardContent sx={{ p: 3 }}>
                              <Grid container alignItems="center" spacing={3}>
                                <Grid item xs={12} sm={4}>
                                  <Box sx={{ textAlign: 'center' }}>
                                    <motion.div
                                      animate={{ 
                                        scale: [1, 1.1, 1],
                                        rotate: [0, 5, -5, 0]
                                      }}
                                      transition={{ 
                                        duration: 3,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                      }}
                                    >
                                      <Typography 
                                        variant="h1" 
                                        sx={{ 
                                          color: getScoreColor(documentAnalysis.score), 
                                          fontWeight: 900,
                                          fontSize: '4rem',
                                          textShadow: '0 4px 8px rgba(0,0,0,0.1)'
                                        }}
                                      >
                                        {documentAnalysis.score}%
                                      </Typography>
                                    </motion.div>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                      Quality Score (Min: 85%)
                                    </Typography>
                                  </Box>
                                </Grid>
                                
                                <Grid item xs={12} sm={8}>
                                  <Box sx={{ mb: 2 }}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                                      <Typography variant="body2" fontWeight={600}>
                                        Analysis Progress
                                      </Typography>
                                      <Typography variant="body2" fontWeight={800} color={getScoreColor(documentAnalysis.score)}>
                                        {documentAnalysis.score}% / 85%
                                      </Typography>
                                    </Stack>
                                    <LinearProgress 
                                      variant="determinate" 
                                      value={Math.min(documentAnalysis.score, 100)} 
                                      sx={{ 
                                        height: 12, 
                                        borderRadius: 6,
                                        backgroundColor: '#e0e0e0',
                                        '& .MuiLinearProgress-bar': {
                                          backgroundColor: getScoreColor(documentAnalysis.score),
                                          borderRadius: 6,
                                          backgroundImage: `linear-gradient(45deg, rgba(255,255,255,0.2) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.2) 75%, transparent 75%, transparent)`
                                        }
                                      }}
                                    />
                                  </Box>
                                  
                                  <Stack direction="row" spacing={2}>
                                    <Chip 
                                      label={documentAnalysis.accepted ? 'ACCEPTED ✅' : 'REJECTED ❌'} 
                                      color={documentAnalysis.accepted ? 'success' : 'error'}
                                      icon={documentAnalysis.accepted ? <CheckCircle /> : <Error />}
                                      sx={{ fontWeight: 800, fontSize: '0.9rem' }}
                                    />
                                    
                                    {documentAnalysis.details?.summary?.templateCompliance && (
                                      <Chip 
                                        label={`Template: ${documentAnalysis.details.summary.templateCompliance}`}
                                        color={documentAnalysis.details.summary.templateCompliance === 'High' ? 'success' : 
                                               documentAnalysis.details.summary.templateCompliance === 'Medium' ? 'warning' : 'error'}
                                        variant="outlined"
                                        sx={{ fontWeight: 700 }}
                                      />
                                    )}
                                  </Stack>
                                </Grid>
                              </Grid>
                            </CardContent>
                          </GlassmorphismCard>

                          {/* 📋 **Enhanced Analysis Details** */}
                          <Stack spacing={2}>
                            {/* Found Elements */}
                            <Accordion sx={{ 
                              borderRadius: '16px !important',
                              border: '1px solid rgba(0,0,0,0.1)',
                              '&:before': { display: 'none' }
                            }}>
                              <AccordionSummary 
                                expandIcon={<ExpandMore />}
                                sx={{ 
                                  borderRadius: '16px',
                                  background: 'linear-gradient(135deg, rgba(76,175,80,0.1) 0%, rgba(76,175,80,0.05) 100%)'
                                }}
                              >
                                <Stack direction="row" alignItems="center" spacing={2}>
                                  <CheckCircle color="success" />
                                  <Typography variant="h6" fontWeight={700}>
                                    ✅ Found Elements ({documentAnalysis.details.foundElements?.length || 0})
                                  </Typography>
                                </Stack>
                              </AccordionSummary>
                              <AccordionDetails>
                                <Grid container spacing={1}>
                                  {documentAnalysis.details.foundElements?.map((element, index) => (
                                    <Grid item xs={12} sm={6} key={index}>
                                      <Paper sx={{ 
                                        p: 2, 
                                        borderRadius: '12px',
                                        background: 'linear-gradient(135deg, rgba(76,175,80,0.1) 0%, rgba(76,175,80,0.05) 100%)',
                                        border: '1px solid rgba(76,175,80,0.2)'
                                      }}>
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                          <CheckCircle color="success" fontSize="small" />
                                          <Typography variant="body2" fontWeight={600}>
                                            {element}
                                          </Typography>
                                        </Stack>
                                      </Paper>
                                    </Grid>
                                  ))}
                                </Grid>
                              </AccordionDetails>
                            </Accordion>

                            {/* Missing Elements */}
                            {documentAnalysis.details.missingElements?.length > 0 && (
                              <Accordion sx={{ 
                                borderRadius: '16px !important',
                                border: '1px solid rgba(244,67,54,0.2)',
                                '&:before': { display: 'none' }
                              }}>
                                <AccordionSummary 
                                  expandIcon={<ExpandMore />}
                                  sx={{ 
                                    borderRadius: '16px',
                                    background: 'linear-gradient(135deg, rgba(244,67,54,0.1) 0%, rgba(244,67,54,0.05) 100%)'
                                  }}
                                >
                                  <Stack direction="row" alignItems="center" spacing={2}>
                                    
                                    <Error color="error" />
                                    <Typography variant="h6" fontWeight={700}>
                                      ❌ Missing Elements ({documentAnalysis.details.missingElements.length})
                                    </Typography>
                                  </Stack>
                                </AccordionSummary>
                                <AccordionDetails>
                                  <Grid container spacing={1}>
                                    {documentAnalysis.details.missingElements.map((element, index) => (
                                      <Grid item xs={12} sm={6} key={index}>
                                        <Paper sx={{ 
                                          p: 2, 
                                          borderRadius: '12px',
                                          background: 'linear-gradient(135deg, rgba(244,67,54,0.1) 0%, rgba(244,67,54,0.05) 100%)',
                                          border: '1px solid rgba(244,67,54,0.2)'
                                        }}>
                                          <Stack direction="row" alignItems="center" spacing={1}>
                                            <Error color="error" fontSize="small" />
                                            <Typography variant="body2" fontWeight={600}>
                                              {element}
                                            </Typography>
                                          </Stack>
                                        </Paper>
                                      </Grid>
                                    ))}
                                  </Grid>
                                </AccordionDetails>
                              </Accordion>
                            )}

                            {/* HSBC Extracted Data */}
                            {(documentAnalysis.details.riskRating || documentAnalysis.details.periodicReview || documentAnalysis.details.owners?.length > 0) && (
                              <Accordion sx={{ 
                                borderRadius: '16px !important',
                                border: `1px solid ${alpha(HSBCColors.primary, 0.2)}`,
                                '&:before': { display: 'none' }
                              }}>
                                <AccordionSummary 
                                  expandIcon={<ExpandMore />}
                                  sx={{ 
                                    borderRadius: '16px',
                                    background: HSBCColors.gradients.modernGlass
                                  }}
                                >
                                  <Stack direction="row" alignItems="center" spacing={2}>
                                    <AccountBalance sx={{ color: HSBCColors.primary }} />
                                    <Typography variant="h6" fontWeight={700}>
                                      📊 Extracted HSBC Data
                                    </Typography>
                                  </Stack>
                                </AccordionSummary>
                                <AccordionDetails>
                                  <TableContainer component={Paper} sx={{ borderRadius: '12px' }}>
                                    <Table size="small">
                                      <TableHead>
                                        <TableRow sx={{ 
                                          background: HSBCColors.gradients.redPrimary,
                                          '& .MuiTableCell-head': { 
                                            color: 'white',
                                            fontWeight: 800
                                          }
                                        }}>
                                          <TableCell>Field</TableCell>
                                          <TableCell>Status</TableCell>
                                          <TableCell>Value</TableCell>
                                        </TableRow>
                                      </TableHead>
                                      <TableBody>
                                        <TableRow>
                                          <TableCell sx={{ fontWeight: 600 }}>Document Owners</TableCell>
                                          <TableCell>
                                            <Chip 
                                              label={documentAnalysis.details.owners?.length > 0 ? 'Found' : 'Missing'}
                                              color={documentAnalysis.details.owners?.length > 0 ? 'success' : 'error'}
                                              size="small"
                                              sx={{ fontWeight: 700 }}
                                            />
                                          </TableCell>
                                          <TableCell sx={{ fontWeight: 500 }}>
                                            {documentAnalysis.details.owners?.join(', ') || 'Not found'}
                                          </TableCell>
                                        </TableRow>
                                        <TableRow>
                                          <TableCell sx={{ fontWeight: 600 }}>Risk Rating</TableCell>
                                          <TableCell>
                                            <Chip 
                                              label={documentAnalysis.details.riskRating ? 'Found' : 'Missing'}
                                              color={documentAnalysis.details.riskRating ? 'success' : 'error'}
                                              size="small"
                                              sx={{ fontWeight: 700 }}
                                            />
                                          </TableCell>
                                          <TableCell sx={{ fontWeight: 500 }}>
                                            {documentAnalysis.details.riskRating || 'Not specified'}
                                          </TableCell>
                                        </TableRow>
                                        <TableRow>
                                          <TableCell sx={{ fontWeight: 600 }}>Periodic Review</TableCell>
                                          <TableCell>
                                            <Chip 
                                              label={documentAnalysis.details.periodicReview ? 'Found' : 'Missing'}
                                              color={documentAnalysis.details.periodicReview ? 'success' : 'error'}
                                              size="small"
                                              sx={{ fontWeight: 700 }}
                                            />
                                          </TableCell>
                                          <TableCell sx={{ fontWeight: 500 }}>
                                            {documentAnalysis.details.periodicReview || 'Not specified'}
                                          </TableCell>
                                        </TableRow>
                                        <TableRow>
                                          <TableCell sx={{ fontWeight: 600 }}>Sign-off Dates</TableCell>
                                          <TableCell>
                                            <Chip 
                                              label={documentAnalysis.details.signOffDates?.length > 0 ? 'Found' : 'Missing'}
                                              color={documentAnalysis.details.signOffDates?.length > 0 ? 'success' : 'error'}
                                              size="small"
                                              sx={{ fontWeight: 700 }}
                                            />
                                          </TableCell>
                                          <TableCell sx={{ fontWeight: 500 }}>
                                            {documentAnalysis.details.signOffDates?.join(', ') || 'Not found'}
                                          </TableCell>
                                        </TableRow>
                                      </TableBody>
                                    </Table>
                                  </TableContainer>
                                </AccordionDetails>
                              </Accordion>
                            )}

                            {/* AI Recommendations */}
                            {documentAnalysis.aiRecommendations?.length > 0 && (
                              <Accordion sx={{ 
                                borderRadius: '16px !important',
                                border: '1px solid rgba(156,39,176,0.2)',
                                '&:before': { display: 'none' }
                              }}>
                                <AccordionSummary 
                                  expandIcon={<ExpandMore />}
                                  sx={{ 
                                    borderRadius: '16px',
                                    background: 'linear-gradient(135deg, rgba(156,39,176,0.1) 0%, rgba(156,39,176,0.05) 100%)'
                                  }}
                                >
                                  <Stack direction="row" alignItems="center" spacing={2}>
                                    <Psychology sx={{ color: '#9c27b0' }} />
                                    <Typography variant="h6" fontWeight={700}>
                                      🤖 AI Recommendations ({documentAnalysis.aiRecommendations.length})
                                    </Typography>
                                  </Stack>
                                </AccordionSummary>
                                <AccordionDetails>
                                  <TableContainer component={Paper} sx={{ borderRadius: '12px' }}>
                                    <Table size="small">
                                      <TableHead>
                                        <TableRow sx={{ 
                                          background: 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)',
                                          '& .MuiTableCell-head': { 
                                            color: 'white',
                                            fontWeight: 800
                                          }
                                        }}>
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
                                                sx={{ fontWeight: 700 }}
                                              />
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>{rec.category}</TableCell>
                                            <TableCell sx={{ fontWeight: 500 }}>{rec.message}</TableCell>
                                            <TableCell sx={{ fontWeight: 500 }}>{rec.impact}</TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </TableContainer>
                                </AccordionDetails>
                              </Accordion>
                            )}
                          </Stack>

                          {/* 🚀 **Enhanced Action Buttons** */}
                          <Stack direction="row" spacing={3} justifyContent="flex-end" sx={{ mt: 4 }}>
                            <Button
                              variant="outlined"
                              onClick={handleReset}
                              startIcon={<Refresh />}
                              disabled={loading}
                              sx={{ 
                                borderRadius: '12px',
                                px: 3,
                                py: 1.5,
                                fontWeight: 600,
                                borderColor: HSBCColors.primary,
                                color: HSBCColors.primary,
                                '&:hover': {
                                  borderColor: HSBCColors.primary,
                                  backgroundColor: alpha(HSBCColors.primary, 0.1)
                                }
                              }}
                            >
                              Reset Form
                            </Button>
                            <Button
                              variant="contained"
                              onClick={handleUploadToSharePoint}
                              disabled={loading || !documentAnalysis.accepted}
                              startIcon={loading ? 
                                <CircularProgress size={20} color="inherit" /> : 
                                <Save />
                              }
                              size="large"
                              sx={{
                                minWidth: 250,
                                background: documentAnalysis.accepted 
                                  ? 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)'
                                  : 'linear-gradient(135deg, #bdbdbd 0%, #9e9e9e 100%)',
                                borderRadius: '12px',
                                px: 4,
                                py: 1.5,
                                fontSize: '1.1rem',
                                fontWeight: 700,
                                boxShadow: documentAnalysis.accepted 
                                  ? '0 8px 24px rgba(76,175,80,0.3)'
                                  : '0 4px 12px rgba(0,0,0,0.1)',
                                '&:hover': documentAnalysis.accepted ? {
                                  transform: 'translateY(-2px)',
                                  boxShadow: '0 12px 32px rgba(76,175,80,0.4)'
                                } : {}
                              }}
                            >
                              {loading ? 'Uploading to SharePoint...' : 'Upload to SharePoint'}
                            </Button>
                          </Stack>

                          {!documentAnalysis.accepted && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.3 }}
                            >
                              <Alert 
                                severity="warning" 
                                sx={{ 
                                  mt: 3,
                                  borderRadius: '12px',
                                  border: '2px solid #ff9800',
                                  fontWeight: 600
                                }}
                              >
                                <Typography variant="body1" fontWeight={700} gutterBottom>
                                  ⚠️ Upload Blocked: Document Quality Score Too Low
                                </Typography>
                                <Typography variant="body2">
                                  Your document scored {documentAnalysis.score}% but requires at least 85% to proceed. 
                                  Please address the AI recommendations above and re-analyze your document.
                                </Typography>
                              </Alert>
                            </motion.div>
                          )}
                        </Paper>
                      </Box>
                    </motion.div>
                  )}
                </CardContent>
              </GlassmorphismCard>
            </motion.div>
          </Grid>

          {/* 📊 **RIGHT PANEL - Enhanced Info & Status** */}
          <Grid item xs={12} lg={4}>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Stack spacing={3}>
                {/* 👤 **Enhanced User Info Card** */}
                <GlassmorphismCard>
                  <CardHeader
                    avatar={
                      <Avatar 
                        src={user?.PictureURL || `https://photos.global.hsbc/GetPhoto.ashx?pose=casual&format=square&empid=${user?.staffId}`}
                        sx={{ 
                          width: 60, 
                          height: 60,
                          border: `3px solid ${HSBCColors.primary}`,
                          boxShadow: `0 4px 16px ${alpha(HSBCColors.primary, 0.3)}`
                        }}
                      >
                        {user?.displayName?.[0]}
                      </Avatar>
                    }
                    title={
                      <Typography variant="h6" fontWeight={800}>
                        Current Administrator
                      </Typography>
                    }
                    subheader={
                      <Typography variant="body2" color="text.secondary">
                        Logged in with full upload privileges
                      </Typography>
                    }
                  />
                  <CardContent sx={{ pt: 0 }}>
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Display Name
                        </Typography>
                        <Typography variant="body1" fontWeight={700}>
                          {user?.displayName || 'Unknown User'}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Staff ID
                        </Typography>
                        <Typography variant="body1" fontWeight={700}>
                          {user?.staffId || 'Unknown ID'}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Access Level
                        </Typography>
                        <Chip 
                          label="ADMINISTRATOR"
                          color="error"
                          size="small"
                          sx={{ fontWeight: 800 }}
                        />
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Authentication
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {user?.source || 'SharePoint Authentication'}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </GlassmorphismCard>

                {/* 📋 **Enhanced Upload Status Card** */}
                <GlassmorphismCard variant={getStatusColor() === 'success' ? 'success' : 
                                           getStatusColor() === 'error' ? 'error' : 'default'}>
                  <CardHeader
                    avatar={
                      <Box sx={{
                        width: 50,
                        height: 50,
                        borderRadius: '50%',
                        background: getStatusColor() === 'success' ? '#4caf50' :
                                   getStatusColor() === 'error' ? '#f44336' :
                                   getStatusColor() === 'info' ? '#2196f3' : '#9e9e9e',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white'
                      }}>
                        {submitStatus === 'success' ? <CheckCircle /> :
                         submitStatus === 'error' ? <Error /> :
                         submitStatus === 'analyzing' || submitStatus === 'uploading' ? 
                         <CircularProgress size={24} color="inherit" /> :
                         <Assessment />}
                      </Box>
                    }
                    title={
                      <Typography variant="h6" fontWeight={800}>
                        Upload Status
                      </Typography>
                    }
                    subheader={
                      <Chip 
                        label={submitStatus.toUpperCase()}
                        color={getStatusColor()}
                        size="small"
                        sx={{ fontWeight: 800 }}
                      />
                    }
                  />
                  <CardContent sx={{ pt: 0 }}>
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Progress: Step {activeStep + 1} of {steps.length}
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={(activeStep + 1) / steps.length * 100} 
                          sx={{ 
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: '#e0e0e0',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: HSBCColors.primary,
                              borderRadius: 4
                            }
                          }}
                        />
                      </Box>
                      
                      {submitStatus === 'analyzing' && (
                        <motion.div
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <Alert severity="info" sx={{ borderRadius: '12px' }}>
                            <Typography variant="body2" fontWeight={600}>
                              🤖 AI analyzing document quality...
                            </Typography>
                          </Alert>
                        </motion.div>
                      )}
                      
                      {submitStatus === 'uploading' && (
                        <motion.div
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <Alert severity="info" sx={{ borderRadius: '12px' }}>
                            <Typography variant="body2" fontWeight={600}>
                              ☁️ Uploading to SharePoint...
                            </Typography>
                          </Alert>
                        </motion.div>
                      )}

                      {submitStatus === 'success' && (
                        <Alert severity="success" sx={{ borderRadius: '12px' }}>
                          <Typography variant="body2" fontWeight={600}>
                            ✅ Upload completed successfully!
                          </Typography>
                        </Alert>
                      )}
                    </Stack>
                  </CardContent>
                </GlassmorphismCard>

                {/* 📊 **Enhanced Analysis Summary** */}
                {documentAnalysis && (
                  <GlassmorphismCard variant={documentAnalysis.accepted ? 'success' : 'error'}>
                    <CardHeader
                      avatar={
                        <Box sx={{
                          width: 50,
                          height: 50,
                          borderRadius: '50%',
                          background: documentAnalysis.accepted 
                            ? 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)'
                            : 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white'
                        }}>
                          <Psychology />
                        </Box>
                      }
                      title={
                        <Typography variant="h6" fontWeight={800}>
                          Analysis Summary
                        </Typography>
                      }
                      subheader={
                        <Typography variant="body2" color="text.secondary">
                          AI quality assessment results
                        </Typography>
                      }
                    />
                    <CardContent sx={{ pt: 0 }}>
                      <Stack spacing={3}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="body2" color="text.secondary">
                            Quality Score
                          </Typography>
                          <Typography 
                            variant="h2" 
                            sx={{ 
                              color: getScoreColor(documentAnalysis.score), 
                              fontWeight: 900,
                              textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}
                          >
                            {documentAnalysis.score}%
                          </Typography>
                        </Box>

                        {documentAnalysis.details?.summary && (
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Template Compliance
                            </Typography>
                            <Chip 
                              label={documentAnalysis.details.summary.templateCompliance}
                              color={documentAnalysis.details.summary.templateCompliance === 'High' ? 'success' : 
                                     documentAnalysis.details.summary.templateCompliance === 'Medium' ? 'warning' : 'error'}
                              size="small"
                              sx={{ fontWeight: 700 }}
                            />
                          </Box>
                        )}

                        <Divider />

                        <Grid container spacing={2} sx={{ textAlign: 'center' }}>
                          <Grid item xs={6}>
                            <Typography variant="h4" color="success.main" fontWeight={900}>
                              {documentAnalysis.details?.foundElements?.length || 0}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>
                              Found Elements
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="h4" color="error.main" fontWeight={900}>
                              {documentAnalysis.details?.missingElements?.length || 0}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>
                              Missing Elements
                            </Typography>
                          </Grid>
                        </Grid>

                        {documentAnalysis.details?.riskRating && (
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Risk Rating
                            </Typography>
                            <Chip 
                              label={documentAnalysis.details.riskRating}
                              color={documentAnalysis.details.riskRating === 'High' ? 'error' : 
                                     documentAnalysis.details.riskRating === 'Medium' ? 'warning' : 'success'}
                              size="small"
                              sx={{ fontWeight: 700 }}
                            />
                          </Box>
                        )}
                      </Stack>
                    </CardContent>
                  </GlassmorphismCard>
                )}

                {/* 📋 **Enhanced Guidelines Card** */}
                <GlassmorphismCard>
                  <CardHeader
                    avatar={
                      <Info sx={{ 
                        fontSize: 32,
                        color: HSBCColors.primary
                      }} />
                    }
                    title={
                      <Typography variant="h6" fontWeight={800}>
                        Admin Guidelines
                      </Typography>
                    }
                    subheader={
                      <Typography variant="body2" color="text.secondary">
                        Important upload requirements
                      </Typography>
                    }
                  />
                  <CardContent sx={{ pt: 0 }}>
                    <Stack spacing={2}>
                      <Paper sx={{ 
                        p: 2, 
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, rgba(76,175,80,0.1) 0%, rgba(76,175,80,0.05) 100%)',
                        border: '1px solid rgba(76,175,80,0.2)'
                      }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Assessment sx={{ color: '#4caf50' }} />
                          <Box>
                            <Typography variant="body2" fontWeight={700}>
                              Minimum Score: 85%
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Required for SharePoint upload
                            </Typography>
                          </Box>
                        </Stack>
                      </Paper>

                      <Paper sx={{ 
                        p: 2, 
                        borderRadius: '12px',
                        background: HSBCColors.gradients.modernGlass,
                        border: `1px solid ${alpha(HSBCColors.primary, 0.2)}`
                      }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Security sx={{ color: HSBCColors.primary }} />
                          <Box>
                            <Typography variant="body2" fontWeight={700}>
                              Administrator Access
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Based on User ID verification
                            </Typography>
                          </Box>
                        </Stack>
                      </Paper>

                      <Paper sx={{ 
                        p: 2, 
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, rgba(255,152,0,0.1) 0%, rgba(255,152,0,0.05) 100%)',
                        border: '1px solid rgba(255,152,0,0.2)'
                      }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Warning sx={{ color: '#ff9800' }} />
                          <Box>
                            <Typography variant="body2" fontWeight={700}>
                              Error Notifications
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Prominent dialogs for all issues
                            </Typography>
                          </Box>
                        </Stack>
                      </Paper>

                      <Paper sx={{ 
                        p: 2, 
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, rgba(33,150,243,0.1) 0%, rgba(33,150,243,0.05) 100%)',
                        border: '1px solid rgba(33,150,243,0.2)'
                      }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <CalendarToday sx={{ color: '#2196f3' }} />
                          <Box>
                            <Typography variant="body2" fontWeight={700}>
                              Auto-filled Fields
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Name and expiry pre-populated
                            </Typography>
                          </Box>
                        </Stack>
                      </Paper>
                    </Stack>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Alert severity="success" sx={{ borderRadius: '12px' }}>
                      <Typography variant="body2" fontWeight={600}>
                        ✅ Access Granted
                      </Typography>
                      <Typography variant="caption">
                        User ID {user?.staffId} has admin privileges
                      </Typography>
                    </Alert>
                  </CardContent>
                </GlassmorphismCard>
              </Stack>
            </motion.div>
          </Grid>
        </Grid>
      </Container>

      {/* 🌟 **Enhanced Loading Backdrop** */}
      <Backdrop
        sx={{ 
          color: '#fff', 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          background: 'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.9) 100%)'
        }}
        open={loading && submitStatus === 'uploading'}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <CircularProgress 
                color="inherit" 
                size={80}
                thickness={4}
              />
            </motion.div>
            <Typography variant="h4" sx={{ mt: 3, fontWeight: 800 }}>
              Uploading to SharePoint...
            </Typography>
            <Typography variant="body1" sx={{ mt: 1, opacity: 0.9 }}>
              Please wait while we process your procedure
            </Typography>
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Typography variant="body2" sx={{ mt: 2, opacity: 0.7 }}>
                ⚡ AI analysis complete • 📤 Uploading to SharePoint • 📧 Preparing notifications
              </Typography>
            </motion.div>
          </Box>
        </motion.div>
      </Backdrop>

      {/* 🚀 **Floating Action Button** */}
      <AnimatePresence>
        {documentAnalysis?.accepted && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.5 }}
            style={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              zIndex: 1000
            }}
          >
            <Tooltip title="Quick Upload to SharePoint" placement="left">
              <Fab
                color="primary"
                size="large"
                onClick={handleUploadToSharePoint}
                disabled={loading}
                sx={{
                  background: HSBCColors.gradients.redPrimary,
                  width: 70,
                  height: 70,
                  boxShadow: `0 8px 32px ${alpha(HSBCColors.primary, 0.4)}`,
                  animation: `${pulseGlow} 3s infinite`,
                  '&:hover': {
                    transform: 'scale(1.1)',
                    boxShadow: `0 12px 40px ${alpha(HSBCColors.primary, 0.5)}`
                  }
                }}
              >
                <Save sx={{ fontSize: 28 }} />
              </Fab>
            </Tooltip>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
};

export default AdminPanelPage;
