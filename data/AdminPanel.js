// pages/AdminPanelPage.js - Enhanced with Modal Error/Success Dialogs
import React, { useState, useEffect } from 'react';
import {
  Box, Container, Typography, Card, CardContent, TextField, Button,
  Select, MenuItem, FormControl, InputLabel, Grid, Alert, 
  Stepper, Step, StepLabel, StepContent, LinearProgress, Chip,
  IconButton, Divider, List, ListItem, ListItemIcon, ListItemText,
  CircularProgress, Backdrop, Accordion, AccordionSummary, AccordionDetails,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions, Snackbar // ✅ Added Dialog components
} from '@mui/material';
import {
  CloudUpload, ArrowBack, CheckCircle, Error, Warning, Info,
  Assignment, Analytics, Save, Cancel, Refresh, ExpandMore,
  Security, CalendarToday, Assessment, OpenInNew, Close, // ✅ Added Close icon
  ErrorOutline, CheckCircleOutline // ✅ Added prominent icons
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigation } from '../contexts/NavigationContext';
import { useSharePoint } from '../SharePointContext';
import DocumentAnalyzer from '../services/DocumentAnalyzer';
import EmailNotificationService from '../services/EmailNotificationService';


const AdminPanelPage = ({ onDataRefresh }) => {
  const { navigate } = useNavigation();
  const { user, isAdmin } = useSharePoint();
  const [documentAnalyzer] = useState(() => new DocumentAnalyzer());
  const [emailNotificationService] = useState(() => new EmailNotificationService());
  
  // Form state
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

  // UI state
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('ready');
  const [activeStep, setActiveStep] = useState(0);
  const [documentAnalysis, setDocumentAnalysis] = useState(null);

  // ✅ NEW: Modal Dialog States for Prominent Notifications
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

  // ✅ NEW: Snackbar for minor notifications
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // ✅ NEW: Show Error Dialog - Cannot be ignored!
  const showErrorDialog = (title, message, details = null) => {
    setErrorDialog({
      open: true,
      title,
      message,
      details,
      severity: 'error'
    });
  };

  // ✅ ENHANCED: Your existing procedure upload handler
  const handleProcedureUpload = async (procedureData, analysisResult, fileUploadResult) => {
    try {
      setLoading(true);
      
      // 1. Your existing SharePoint procedure creation code
      const createResult = await sharePointService.createProcedure(
        procedureData, 
        analysisResult, 
        fileUploadResult
      );
      
      if (createResult.success) {
        console.log('✅ Procedure created successfully in SharePoint');
        
        // 2. ✅ NEW: Trigger email notification after successful upload
        try {
          await emailNotificationService.triggerProcedureUploadNotification(
            procedureData, 
            analysisResult
          );
          
          setNotification({ 
            type: 'success', 
            message: `✅ Procedure "${procedureData.name}" uploaded successfully - Notification emails sent to configured recipients` 
          });
          
        } catch (emailError) {
          console.warn('⚠️ Procedure uploaded but email notification failed:', emailError);
          setNotification({ 
            type: 'warning', 
            message: `✅ Procedure uploaded successfully, but email notification failed: ${emailError.message}` 
          });
        }
        
        // 3. Your existing success handling
        onDataRefresh(); // Refresh the procedures list
        resetForm(); // Reset the upload form
        
      } else {
        throw new Error(createResult.message || 'Failed to create procedure');
      }
      
    } catch (error) {
      console.error('❌ Error uploading procedure:', error);
      setNotification({ 
        type: 'error', 
        message: 'Failed to upload procedure: ' + error.message 
      });
    } finally {
      setLoading(false);
    }
  };

  // ✅ NEW: Show Success Dialog - Prominent success notification
  const showSuccessDialog = (title, message, details = null) => {
    setSuccessDialog({
      open: true,
      title,
      message,
      details
    });
  };

  // ✅ NEW: Show Snackbar - For minor notifications
  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  // Close dialogs
  const closeErrorDialog = () => {
    setErrorDialog(prev => ({ ...prev, open: false }));
  };

  const closeSuccessDialog = () => {
    setSuccessDialog(prev => ({ ...prev, open: false }));
  };

  const closeSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Stepper steps
  const steps = [
    { label: 'Procedure Details', description: 'Enter procedure information' },
    { label: 'Document Upload', description: 'Upload and validate document' },
    { label: 'AI Analysis', description: 'AI quality analysis and scoring' },
    { label: 'Upload to SharePoint', description: 'Final upload if score ≥ 80%' }
  ];

  // Check admin access on component mount
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

  // Set default expiry date and auto-populate display name only
  useEffect(() => {
    const defaultExpiry = new Date();
    defaultExpiry.setFullYear(defaultExpiry.getFullYear() + 1);
    
    setFormData(prev => ({
      ...prev,
      expiry: defaultExpiry.toISOString().split('T')[0],
      primary_owner: user?.displayName || ''
    }));
  }, [user]);

  // Handle form input changes
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

  // ✅ UPDATED: Handle file selection with prominent error dialog
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
        // ✅ PROMINENT ERROR DIALOG instead of small alert
        showErrorDialog(
          'Invalid File',
          'The selected file does not meet the requirements.',
          err.message
        );
        setSelectedFile(null);
        // Clear the file input
        e.target.value = '';
      }
    }
  };

  // ✅ UPDATED: AI Document Analysis with prominent notifications
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

      console.log('🔍 Starting AI document analysis...');

      const analysisResult = await documentAnalyzer.analyzeDocument(selectedFile, {
        name: formData.name,
        lob: formData.lob,
        subsection: formData.procedure_subsection
      });

      setDocumentAnalysis(analysisResult);
      setActiveStep(2);
      setSubmitStatus('ready');

      if (analysisResult.accepted) {
        // ✅ PROMINENT SUCCESS DIALOG
        showSuccessDialog(
          'Document Analysis Completed! ✅',
          `Your document achieved a quality score of ${analysisResult.score}% which meets the 80% minimum requirement.`,
          'The document is ready for upload to SharePoint.'
        );
      } else {
        // ✅ PROMINENT ERROR DIALOG for failed analysis
        showErrorDialog(
          'Document Quality Score Too Low ❌',
          `Your document scored ${analysisResult.score}% but requires at least 80% to proceed.`,
          `Please review the AI recommendations and improve your document. Missing elements: ${analysisResult.details.missingElements?.length || 0}`
        );
      }

    } catch (err) {
      // ✅ PROMINENT ERROR DIALOG for analysis failure
      showErrorDialog(
        'Analysis Failed',
        'The AI document analysis encountered an error.',
        `Error details: ${err.message}`
      );
      setSubmitStatus('ready');
    }
  };

  // ✅ UPDATED: Form validation with prominent error dialog
  const validateForm = () => {
    const errors = [];

    if (!formData.name) errors.push('• Procedure Name is required');
    if (!formData.primary_owner) errors.push('• Primary Owner is required');
    if (!formData.lob) errors.push('• Line of Business (LOB) is required');

    // Validate that primary owner is a name, not email
    if (formData.primary_owner && formData.primary_owner.includes('@')) {
      errors.push('• Primary Owner should be a name, not an email address');
    }

    // Validate email format if provided
    if (formData.primary_owner_email && !formData.primary_owner_email.includes('@')) {
      errors.push('• Please enter a valid email address for Primary Owner Email');
    }

    if (errors.length > 0) {
      // ✅ PROMINENT ERROR DIALOG for validation errors
      showErrorDialog(
        'Form Validation Errors',
        'Please fix the following issues before proceeding:',
        errors.join('\n')
      );
      return false;
    }

    return true;
  };

  // ✅ UPDATED: Upload to SharePoint with prominent notifications
  const handleUploadToSharePoint = async () => {
    if (!documentAnalysis?.accepted) {
      showErrorDialog(
        'Upload Not Allowed',
        'Document must achieve at least 80% quality score before upload.',
        `Current score: ${documentAnalysis?.score || 0}%. Please improve your document and re-analyze.`
      );
      return;
    }

    try {
      // ✅ Validate form before upload
      if (!validateForm()) {
        return; // validateForm() already shows error dialog
      }

      setLoading(true);
      setSubmitStatus('uploading');
      setActiveStep(3);
      showSnackbar('Uploading to SharePoint...', 'info');

      console.log('🚀 Starting upload to SharePoint...');

      // Add user context data for backend processing
      const uploadData = {
        ...formData,
        uploaded_by_user_id: user?.staffId,
        uploaded_by_name: user?.displayName,
        uploaded_by_role: user?.role
      };

      const result = await documentAnalyzer.uploadProcedureWithAnalysis(uploadData, selectedFile);

      if (result.success) {
        // ✅ PROMINENT SUCCESS DIALOG
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
        
      } else {
        // ✅ PROMINENT ERROR DIALOG for upload failure
        showErrorDialog(
          'Upload Failed',
          'The procedure could not be uploaded to SharePoint.',
          result.message || 'Unknown error occurred during upload.'
        );
        setSubmitStatus('error');
      }

    } catch (err) {
      // ✅ PROMINENT ERROR DIALOG for upload error
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

  // Reset form
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
      <Box sx={{ minHeight: '100vh', bgcolor: '#f5f6fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Card sx={{ maxWidth: 500, textAlign: 'center' }}>
          <CardContent sx={{ p: 4 }}>
            <Error sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Access Denied
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              Admin privileges required to access this page.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              User ID: {user?.staffId} | Role: {user?.role}
            </Typography>
            <Button 
              variant="contained" 
              onClick={() => navigate('home')}
              startIcon={<ArrowBack />}
            >
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f6fa' }}>
      {/* ✅ ERROR DIALOG - Cannot be ignored! */}
      <Dialog 
        open={errorDialog.open} 
        onClose={closeErrorDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            border: '3px solid #f44336',
            borderRadius: 2
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: '#ffebee', 
          color: '#d32f2f',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          pb: 1
        }}>
          <ErrorOutline sx={{ fontSize: 32 }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" fontWeight="bold">
              {errorDialog.title}
            </Typography>
          </Box>
          <IconButton onClick={closeErrorDialog} size="small">
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body1" gutterBottom sx={{ fontWeight: 500 }}>
            {errorDialog.message}
          </Typography>
          {errorDialog.details && (
            <Paper sx={{ p: 2, mt: 2, bgcolor: '#fafafa' }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-line' }}>
                {errorDialog.details}
              </Typography>
            </Paper>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={closeErrorDialog} 
            variant="contained" 
            color="error"
            autoFocus
          >
            Understood
          </Button>
        </DialogActions>
      </Dialog>

      {/* ✅ SUCCESS DIALOG - Prominent success notification */}
      <Dialog 
        open={successDialog.open} 
        onClose={closeSuccessDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            border: '3px solid #4caf50',
            borderRadius: 2
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: '#e8f5e9', 
          color: '#2e7d32',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          pb: 1
        }}>
          <CheckCircleOutline sx={{ fontSize: 32 }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" fontWeight="bold">
              {successDialog.title}
            </Typography>
          </Box>
          <IconButton onClick={closeSuccessDialog} size="small">
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body1" gutterBottom sx={{ fontWeight: 500 }}>
            {successDialog.message}
          </Typography>
          {successDialog.details && (
            <Paper sx={{ p: 2, mt: 2, bgcolor: '#f1f8e9' }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-line' }}>
                {successDialog.details}
              </Typography>
            </Paper>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={closeSuccessDialog} 
            variant="contained" 
            color="success"
            autoFocus
          >
            Great!
          </Button>
        </DialogActions>
      </Dialog>

      {/* ✅ SNACKBAR for minor notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={closeSnackbar} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Header */}
      <Box sx={{ 
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
        color: 'white',
        py: 3,
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={() => navigate('home')} sx={{ color: 'white' }}>
              <ArrowBack />
            </IconButton>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" fontWeight="bold">
                Upload Procedure with AI Analysis
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                AI-powered document quality assessment and SharePoint integration
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip 
                label={`${user?.displayName} (${user?.staffId})`}
                size="small"
                sx={{ 
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  fontWeight: 'normal'
                }}
              />
              <Chip 
                label={user?.role || 'User'} 
                size="small"
                sx={{ 
                  backgroundColor: user?.role === 'admin' ? '#f44336' : 'rgba(255,255,255,0.2)',
                  color: 'white',
                  fontWeight: 'bold'
                }}
              />
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ mt: -2, pb: 4 }}>
        {/* Main Content */}
        <Grid container spacing={3}>
          {/* Left Panel - Form */}
          <Grid item xs={12} lg={8}>
            <Card sx={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
              <CardContent sx={{ p: 4 }}>
                {/* Progress Stepper */}
                <Stepper activeStep={activeStep} orientation="vertical" sx={{ mb: 4 }}>
                  {steps.map((step, index) => (
                    <Step key={step.label}>
                      <StepLabel>
                        <Typography variant="h6">{step.label}</Typography>
                      </StepLabel>
                      <StepContent>
                        <Typography variant="body2" color="text.secondary">
                          {step.description}
                        </Typography>
                      </StepContent>
                    </Step>
                  ))}
                </Stepper>

                {/* Step 1: Procedure Details */}
                {activeStep >= 0 && (
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Assignment color="primary" />
                      Procedure Information
                    </Typography>
                    
                    <Grid container spacing={3}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Procedure Name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                          variant="outlined"
                          placeholder="Enter a descriptive name for the procedure"
                        />
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth required>
                          <InputLabel>Line of Business (LOB)</InputLabel>
                          <Select
                            name="lob"
                            value={formData.lob}
                            onChange={handleInputChange}
                            label="Line of Business (LOB)"
                          >
                            <MenuItem value="">Select LOB</MenuItem>
                            <MenuItem value="IWPB">IWPB - International Wealth & Premier Banking</MenuItem>
                            <MenuItem value="CIB">CIB - Commercial & Institutional Banking</MenuItem>
                            <MenuItem value="GCOO">GCOO - Group Chief Operating Officer</MenuItem>
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
                          >
                            <MenuItem value="">Select Subsection</MenuItem>
                            {formData.lob && documentAnalyzer.getSubsections(formData.lob).map(option => (
                              <MenuItem key={option.value} value={option.value}>
                                {option.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Primary Owner (Name)"
                          name="primary_owner"
                          value={formData.primary_owner}
                          onChange={handleInputChange}
                          required
                          variant="outlined"
                          placeholder="Enter the full name of the primary owner"
                          helperText="✅ Auto-populated with your name. Enter a different name if needed."
                        />
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Primary Owner Email"
                          name="primary_owner_email"
                          value={formData.primary_owner_email}
                          onChange={handleInputChange}
                          type="email"
                          variant="outlined"
                          placeholder="Enter the email address of the primary owner"
                          helperText="📧 Enter the actual email address manually"
                        />
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Secondary Owner (Optional)"
                          name="secondary_owner"
                          value={formData.secondary_owner}
                          onChange={handleInputChange}
                          variant="outlined"
                          placeholder="Enter the name of the secondary owner"
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
                          placeholder="Enter the secondary owner's email"
                        />
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <TextField
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
                        <TextField
                          fullWidth
                          label="SharePoint Folder (Optional)"
                          name="sharepoint_folder"
                          value={formData.sharepoint_folder}
                          onChange={handleInputChange}
                          variant="outlined"
                          placeholder="Custom SharePoint folder path"
                          helperText="🗂️ Leave empty for default folder structure"
                        />
                      </Grid>
                    </Grid>

                    {formData.name && formData.lob && formData.primary_owner && (
                      <Button
                        variant="contained"
                        onClick={() => setActiveStep(1)}
                        sx={{ mt: 3 }}
                        startIcon={<CloudUpload />}
                      >
                        Continue to Document Upload
                      </Button>
                    )}
                  </Box>
                )}

                {/* Step 2: Document Upload */}
                {activeStep >= 1 && (
                  <Box sx={{ mb: 4 }}>
                    <Divider sx={{ my: 3 }} />
                    <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CloudUpload color="primary" />
                      Document Upload & Validation
                    </Typography>

                    <Box sx={{ 
                      border: '2px dashed #d0d0d0',
                      borderRadius: 2,
                      p: 4,
                      textAlign: 'center',
                      bgcolor: selectedFile ? '#f8f9fa' : 'background.paper',
                      transition: 'all 0.3s ease'
                    }}>
                      {!selectedFile ? (
                        <>
                          <CloudUpload sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                          <Typography variant="h6" gutterBottom>
                            Select Procedure Document
                          </Typography>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Upload a PDF or Word document (.pdf, .docx, .doc) - Max 10MB
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
                            sx={{ mt: 2 }}
                            startIcon={<CloudUpload />}
                          >
                            Choose File
                          </Button>
                        </>
                      ) : (
                        <Box>
                          <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                          <Typography variant="h6" gutterBottom>
                            File Selected: {selectedFile.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </Typography>
                          
                          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 2 }}>
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
                            >
                              Remove File
                            </Button>
                            <Button
                              variant="contained"
                              onClick={analyzeDocument}
                              disabled={submitStatus === 'analyzing'}
                              startIcon={submitStatus === 'analyzing' ? <CircularProgress size={20} /> : <Analytics />}
                            >
                              {submitStatus === 'analyzing' ? 'Analyzing...' : 'Analyze with AI'}
                            </Button>
                          </Box>
                        </Box>
                      )}
                    </Box>
                  </Box>
                )}

                {/* Step 3: AI Analysis Results */}
                {activeStep >= 2 && documentAnalysis && (
                  <Box sx={{ mb: 4 }}>
                    <Divider sx={{ my: 3 }} />
                    <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Analytics color="primary" />
                      AI Document Quality Analysis
                    </Typography>

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
                             Quality Score (Minimum Required: 80%)
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
                           icon={documentAnalysis.accepted ? <CheckCircle /> : <Error />}
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

                       {/* Found Elements */}
                       <Accordion sx={{ mb: 2 }}>
                         <AccordionSummary expandIcon={<ExpandMore />}>
                           <Typography variant="h6">
                             ✅ Found Elements ({documentAnalysis.details.foundElements?.length || 0})
                           </Typography>
                         </AccordionSummary>
                         <AccordionDetails>
                           <List dense>
                             {documentAnalysis.details.foundElements?.map((element, index) => (
                               <ListItem key={index} sx={{ py: 0 }}>
                                 <ListItemIcon sx={{ minWidth: 30 }}>
                                   <CheckCircle color="success" fontSize="small" />
                                 </ListItemIcon>
                                 <ListItemText primary={element} />
                               </ListItem>
                             ))}
                           </List>
                         </AccordionDetails>
                       </Accordion>

                       {/* Missing Elements */}
                       {documentAnalysis.details.missingElements?.length > 0 && (
                         <Accordion sx={{ mb: 2 }}>
                           <AccordionSummary expandIcon={<ExpandMore />}>
                             <Typography variant="h6">
                               ❌ Missing Elements ({documentAnalysis.details.missingElements.length})
                             </Typography>
                           </AccordionSummary>
                           <AccordionDetails>
                             <List dense>
                               {documentAnalysis.details.missingElements.map((element, index) => (
                                 <ListItem key={index} sx={{ py: 0 }}>
                                   <ListItemIcon sx={{ minWidth: 30 }}>
                                     <Error color="error" fontSize="small" />
                                   </ListItemIcon>
                                   <ListItemText primary={element} />
                                 </ListItem>
                               ))}
                             </List>
                           </AccordionDetails>
                         </Accordion>
                       )}

                       {/* HSBC Extracted Data */}
                       {(documentAnalysis.details.riskRating || documentAnalysis.details.periodicReview || documentAnalysis.details.owners?.length > 0) && (
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

                      {/* AI Recommendations */}
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

           {/* Upload Button */}
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
    onClick={handleUploadToSharePoint}
    disabled={loading || !documentAnalysis.accepted}
    startIcon={loading ? <CircularProgress size={20} /> : <Save />}
    size="large"
    sx={{ minWidth: 200 }}
  >
    {loading ? 'Uploading to SharePoint...' : 'Upload to SharePoint'}
  </Button>
</Box>

                  {!documentAnalysis.accepted && (
                    <Alert severity="warning" sx={{ mt: 2 }}>
                      <Typography variant="body2" fontWeight="bold">
                        ⚠️ Upload Blocked: Document must achieve at least 80% quality score before upload.
                      </Typography>
                      <Typography variant="body2">
                        Please address the AI recommendations above and re-analyze your document.
                      </Typography>
                    </Alert>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right Panel - Info & Status */}
        <Grid item xs={12} lg={4}>
          {/* User Info Card */}
          <Card sx={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)', mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                👤 Current User
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Display Name
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {user?.displayName || 'Unknown User'}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  User ID
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {user?.staffId || 'Unknown ID'}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Role
                </Typography>
                <Chip 
                  label={user?.role || 'User'}
                  color={user?.role === 'admin' ? 'error' : 'default'}
                  size="small"
                />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Authentication Source
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {user?.source || 'Unknown'}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)', mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📋 Upload Status
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Chip 
                  label={submitStatus.toUpperCase()}
                  color={getStatusColor()}
                  sx={{ mb: 1 }}
                />
              </Box>
              
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Current Step: {activeStep + 1} of {steps.length}
              </Typography>
              
              {submitStatus === 'analyzing' && (
                <Box sx={{ mt: 2 }}>
                  <LinearProgress />
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    AI analyzing document quality...
                  </Typography>
                </Box>
              )}
              
              {submitStatus === 'uploading' && (
                <Box sx={{ mt: 2 }}>
                  <LinearProgress />
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    Uploading to SharePoint and updating lists...
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Analysis Summary Card */}
          {documentAnalysis && (
            <Card sx={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)', mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  🎯 Analysis Summary
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Quality Score
                  </Typography>
                  <Typography variant="h4" sx={{ color: getScoreColor(documentAnalysis.score), fontWeight: 'bold' }}>
                    {documentAnalysis.score}%
                  </Typography>
                </Box>

                {documentAnalysis.details?.summary && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Template Compliance
                    </Typography>
                    <Chip 
                      label={documentAnalysis.details.summary.templateCompliance}
                      color={documentAnalysis.details.summary.templateCompliance === 'High' ? 'success' : 
                             documentAnalysis.details.summary.templateCompliance === 'Medium' ? 'warning' : 'error'}
                      size="small"
                    />
                  </Box>
                )}

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, textAlign: 'center' }}>
                  <Box>
                    <Typography variant="h5" color="success.main" fontWeight="bold">
                      {documentAnalysis.details?.foundElements?.length || 0}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Found Elements
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="h5" color="error.main" fontWeight="bold">
                      {documentAnalysis.details?.missingElements?.length || 0}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Missing Elements
                    </Typography>
                  </Box>
                </Box>

                {documentAnalysis.details?.riskRating && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Risk Rating
                    </Typography>
                    <Chip 
                      label={documentAnalysis.details.riskRating}
                      color={documentAnalysis.details.riskRating === 'High' ? 'error' : 
                             documentAnalysis.details.riskRating === 'Medium' ? 'warning' : 'success'}
                      size="small"
                    />
                  </Box>
                )}
              </CardContent>
            </Card>
          )}

          {/* Updated Guidelines Card */}
          <Card sx={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                ℹ️ Admin Guidelines
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon><Assessment fontSize="small" /></ListItemIcon>
                  <ListItemText 
                    primary="Minimum Score: 80%"
                    secondary="Required for SharePoint upload"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><Security fontSize="small" /></ListItemIcon>
                  <ListItemText 
                    primary="Access Control"
                    secondary="Admin access based on User ID"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><Warning fontSize="small" /></ListItemIcon>
                  <ListItemText 
                    primary="Error Notifications"
                    secondary="Prominent dialogs for all errors"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CalendarToday fontSize="small" /></ListItemIcon>
                  <ListItemText 
                    primary="Auto-filled Fields"
                    secondary="Name and expiry date pre-populated"
                  />
                </ListItem>
              </List>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="body2" color="text.secondary">
                <strong>Access Granted:</strong> User ID {user?.staffId} has admin privileges.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>

    {/* Loading Backdrop */}
    <Backdrop
      sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
      open={loading && submitStatus === 'uploading'}
    >
      <Box sx={{ textAlign: 'center' }}>
        <CircularProgress color="inherit" size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Uploading to SharePoint...
        </Typography>
        <Typography variant="body2">
          Please wait while we process your procedure
        </Typography>
      </Box>
    </Backdrop>
  </Box>
);
};

export default AdminPanelPage;
