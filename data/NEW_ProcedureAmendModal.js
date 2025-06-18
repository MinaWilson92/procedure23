
// components/ProcedureAmendModal.js - Enhanced Procedure Amendment Modal
import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, 
  Grid, Card, CardContent, TextField, Alert, IconButton, LinearProgress,
  Stack, Paper, Chip, Divider, useTheme, styled, keyframes, alpha,
  FormControl, InputLabel, Select, MenuItem, CircularProgress, Backdrop,
  Stepper, Step, StepLabel, StepContent, Accordion, AccordionSummary, AccordionDetails,
  List, ListItem, ListItemIcon, ListItemText
} from '@mui/material';
import {
  Close, CloudUpload, Analytics, Save, Cancel, Warning, CheckCircle,
  Description, Person, Schedule, AutoAwesome, Error as ErrorIcon,
  History, Refresh, Assignment, Security, ExpandMore, Psychology
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import DocumentAnalyzer from '../services/DocumentAnalyzer';
import EmailNotificationService from '../services/EmailNotificationService';

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

// 🌟 **Advanced Animations**
const pulseGlow = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(219, 0, 17, 0.4); }
  70% { box-shadow: 0 0 0 15px rgba(219, 0, 17, 0); }
  100% { box-shadow: 0 0 0 0 rgba(219, 0, 17, 0); }
`;

const shimmerAnimation = keyframes`
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
`;

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
  const [emailService] = useState(() => new EmailNotificationService());

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

  // 🎯 **Helper Functions**
  const getScoreColor = (score) => {
    if (score >= 90) return '#4caf50';
    if (score >= 80) return '#8bc34a';
    if (score >= 70) return '#ff9800';
    if (score >= 60) return '#f44336';
    return '#d32f2f';
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

  // 🎯 **Event Handlers**
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

  const analyzeDocument = async () => {
    if (!selectedFile) {
      alert('Please select a document file before analyzing.');
      return;
    }

    try {
      setSubmitStatus('analyzing');
      setLoading(true);
      
      console.log('🔍 Starting AI document analysis for amendment...');

      const analysisResult = await documentAnalyzer.analyzeDocument(selectedFile, {
        name: procedure.name,
        lob: procedure.lob,
        subsection: procedure.procedure_subsection,
        isAmendment: true,
        originalScore: procedure.score
      });

      setDocumentAnalysis(analysisResult);
      setActiveStep(2);
      setSubmitStatus('ready');

      console.log('✅ Document analysis completed:', analysisResult);

    } catch (err) {
      console.error('❌ Analysis failed:', err);
      alert(`Analysis failed: ${err.message}`);
      setSubmitStatus('ready');
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

  const handleSubmitAmendment = async () => {
    if (!validateAmendmentForm()) {
      return;
    }

    try {
      setLoading(true);
      setSubmitStatus('uploading');
      setActiveStep(3);
      
      console.log('🚀 Starting procedure amendment process...');

      // Prepare amendment data
      const amendmentData = {
        procedureId: procedure.id,
        originalName: procedure.name,
        originalLOB: procedure.lob,
        originalPrimaryOwner: procedure.primary_owner,
        originalPrimaryOwnerEmail: procedure.primary_owner_email,
        originalExpiry: procedure.expiry,
        
        // Updated fields
        secondary_owner: formData.secondary_owner,
        secondary_owner_email: formData.secondary_owner_email,
        amendment_summary: formData.amendment_summary,
        
        // Amendment metadata
        amended_by: user?.staffId,
        amended_by_name: user?.displayName,
        amended_by_role: user?.role,
        amendment_date: new Date().toISOString(),
        last_modified_on: new Date().toISOString(),
        last_modified_by: user?.displayName,
        
        // New quality data
        new_score: documentAnalysis.score,
        new_analysis_details: documentAnalysis.details,
        new_ai_recommendations: documentAnalysis.aiRecommendations,
        
        // File information
        original_filename: selectedFile.name,
        file_size: selectedFile.size
      };

      // Upload to SharePoint (mock implementation)
      const result = await documentAnalyzer.amendProcedureInSharePoint(amendmentData, selectedFile);

      if (result.success) {
        console.log('✅ Procedure amended successfully');
        
        // Send notifications
        try {
          await emailService.triggerProcedureAmendmentNotification({
            procedureName: procedure.name,
            amendedBy: user?.displayName,
            amendmentSummary: formData.amendment_summary,
            newQualityScore: documentAnalysis.score,
            primaryOwnerEmail: procedure.primary_owner_email,
            secondaryOwnerEmail: formData.secondary_owner_email,
            amendmentDate: new Date().toLocaleDateString()
          });
        } catch (emailError) {
          console.warn('⚠️ Amendment successful but email notification failed:', emailError);
        }
        
        setSubmitStatus('success');
        setTimeout(() => {
          onSuccess();
        }, 2000);
        
      } else {
        throw new Error(result.message || 'Amendment failed');
      }

    } catch (err) {
      console.error('❌ Amendment failed:', err);
      alert(`Amendment failed: ${err.message}`);
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

  if (!open) return null;

  return (
    <EnhancedDialog 
      open={open} 
      onClose={onClose}
      maxWidth="xl"
      fullWidth
    >
      {/* 🌟 **ENHANCED HEADER** */}
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
        {/* 📋 **CURRENT PROCEDURE INFO** */}
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

        {/* 🔄 **AMENDMENT STEPPER** */}
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
                      
                      {/* Step 2: AI Analysis Results */}
                      {index === 2 && documentAnalysis && (
                        <Box>
                          <GlassmorphismCard 
                            variant={documentAnalysis.accepted ? 'success' : 'error'}
                            sx={{ mb: 3 }}
                          >
                            <CardContent>
                              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                                <Typography variant="h3" sx={{ color: getScoreColor(documentAnalysis.score), fontWeight: 'bold' }}>
                                  {documentAnalysis.score}%
                                </Typography>
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="body2" color="text.secondary" gutterBottom>
                                    New Quality Score (Minimum Required: 85%)
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
                              </Stack>

                              {/* Score Comparison */}
                              <Box sx={{ mb: 3 }}>
                                <Typography variant="h6" gutterBottom>
                                  📊 Score Comparison
                                </Typography>
                                <Grid container spacing={2}>
                                  <Grid item xs={6}>
                                    <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: alpha('#ff9800', 0.1) }}>
                                      <Typography variant="body2" color="text.secondary">Original Score</Typography>
                                      <Typography variant="h4" fontWeight={700} color="#ff9800">
                                        {procedure?.score || 0}%
                                      </Typography>
                                    </Paper>
                                  </Grid>
                                  <Grid item xs={6}>
                                    <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: alpha(getScoreColor(documentAnalysis.score), 0.1) }}>
                                      <Typography variant="body2" color="text.secondary">New Score</Typography>
                                      <Typography variant="h4" fontWeight={700} color={getScoreColor(documentAnalysis.score)}>
                                        {documentAnalysis.score}%
                                      </Typography>
                                    </Paper>
                                  </Grid>
                                </Grid>
                              </Box>

                              {/* Analysis Details */}
                              {documentAnalysis.details?.foundElements?.length > 0 && (
                                <Accordion sx={{ mb: 2 }}>
                                  <AccordionSummary expandIcon={<ExpandMore />}>
                                    <Typography variant="h6">
                                      ✅ Found Elements ({documentAnalysis.details.foundElements.length})
                                    </Typography>
                                  </AccordionSummary>
                                  <AccordionDetails>
                                    <List dense>
                                      {documentAnalysis.details.foundElements.map((element, idx) => (
                                        <ListItem key={idx}>
                                          <ListItemIcon>
                                            <CheckCircle color="success" fontSize="small" />
                                          </ListItemIcon>
                                          <ListItemText primary={element} />
                                        </ListItem>
                                      ))}
                                    </List>
                                  </AccordionDetails>
                                </Accordion>
                              )}

                              {/* AI Recommendations */}
                              {documentAnalysis.aiRecommendations?.length > 0 && (
                                <Accordion>
                                  <AccordionSummary expandIcon={<ExpandMore />}>
                                    <Typography variant="h6">
                                      🤖 AI Recommendations ({documentAnalysis.aiRecommendations.length})
                                    </Typography>
                                  </AccordionSummary>
                                  <AccordionDetails>
                                    <List dense>
                                      {documentAnalysis.aiRecommendations.map((rec, idx) => (
                                        <ListItem key={idx}>
                                          <ListItemIcon>
                                            <Psychology color="info" fontSize="small" />
                                          </ListItemIcon>
                                          <ListItemText primary={rec} />
                                        </ListItem>
                                      ))}
                                    </List>
                                  </AccordionDetails>
                                </Accordion>
                              )}
                            </CardContent>
                          </GlassmorphismCard>

                          {documentAnalysis.accepted ? (
                            <Alert severity="success" sx={{ mb: 2 }}>
                              <Typography variant="body2">
                                <strong>✅ Document Approved!</strong> The new document meets quality requirements and can be submitted.
                              </Typography>
                            </Alert>
                          ) : (
                            <Alert severity="error" sx={{ mb: 2 }}>
                              <Typography variant="body2">
                                <strong>❌ Document Rejected!</strong> Please improve the document quality and re-analyze before proceeding.
                              </Typography>
                            </Alert>
                          )}
                        </Box>
                      )}
                      
                      {/* Step 3: Submit Amendment */}
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

        {/* 📊 **STATUS MESSAGES** */}
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

      {/* 🚀 **ENHANCED ACTION BUTTONS** */}
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

      {/* 🌟 **LOADING BACKDROP** */}
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
            Updating SharePoint and sending notifications
          </Typography>
        </Box>
      </Backdrop>
    </EnhancedDialog>
  );
};

export default ProcedureAmendModal;
