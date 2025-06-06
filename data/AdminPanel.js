// pages/AdminPanelPage.js - Enhanced with AI workflow
import React, { useState, useEffect } from 'react';
import {
  Box, Container, Typography, Card, CardContent, TextField, Button,
  Select, MenuItem, FormControl, InputLabel, Grid, Alert, 
  Stepper, Step, StepLabel, StepContent, LinearProgress, Chip,
  IconButton, Divider, List, ListItem, ListItemIcon, ListItemText,
  CircularProgress, Backdrop, Accordion, AccordionSummary, AccordionDetails,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper
} from '@mui/material';
import {
  CloudUpload, ArrowBack, CheckCircle, Error, Warning, Info,
  Assignment, Analytics, Save, Cancel, Refresh, ExpandMore,
  Security, CalendarToday, Assessment, OpenInNew
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigation } from '../contexts/NavigationContext';
import DocumentAnalyzer from '../services/DocumentAnalyzer';

const AdminPanelPage = ({ user, onDataRefresh }) => {
  const { navigate } = useNavigation();
  const [documentAnalyzer] = useState(() => new DocumentAnalyzer());
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    expiry: '',
    primary_owner: user?.staffId || '',
    primary_owner_email: user?.email || '',
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
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [documentAnalysis, setDocumentAnalysis] = useState(null);

  // Stepper steps
  const steps = [
    { label: 'Procedure Details', description: 'Enter procedure information' },
    { label: 'Document Upload', description: 'Upload and validate document' },
    { label: 'AI Analysis', description: 'AI quality analysis and scoring' },
    { label: 'Upload to SharePoint', description: 'Final upload if score ≥ 80%' }
  ];

  // Set default expiry date (1 year from now)
  useEffect(() => {
    const defaultExpiry = new Date();
    defaultExpiry.setFullYear(defaultExpiry.getFullYear() + 1);
    setFormData(prev => ({
      ...prev,
      expiry: defaultExpiry.toISOString().split('T')[0]
    }));
  }, []);

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

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        documentAnalyzer.validateFile(file);
        setSelectedFile(file);
        setDocumentAnalysis(null);
        setError(null);
        setActiveStep(1);
      } catch (err) {
        setError(err.message);
        setSelectedFile(null);
      }
    }
  };

  // AI Document Analysis
  const analyzeDocument = async () => {
    if (!selectedFile) return;

    try {
      setSubmitStatus('analyzing');
      setError(null);

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
        setSuccess(`✅ Document analysis completed! Quality score: ${analysisResult.score}% - Ready for upload`);
      } else {
        setError(`❌ Document quality score: ${analysisResult.score}% (Minimum required: 80%). Please review recommendations.`);
      }

    } catch (err) {
      setError('Document analysis failed: ' + err.message);
      setSubmitStatus('ready');
    }
  };

  // Upload to SharePoint
  const handleUploadToSharePoint = async () => {
    if (!documentAnalysis?.accepted) {
      setError('Document must achieve at least 80% quality score before upload');
      return;
    }

    try {
      setLoading(true);
      setSubmitStatus('uploading');
      setError(null);
      setActiveStep(3);

      console.log('🚀 Starting upload to SharePoint...');

      const result = await documentAnalyzer.uploadProcedureWithAnalysis(formData, selectedFile);

      if (result.success) {
        setSuccess(`✅ Procedure uploaded successfully! ID: ${result.procedureId}`);
        setSubmitStatus('success');
        
        setTimeout(() => {
          handleReset();
          if (onDataRefresh) onDataRefresh();
        }, 3000);
        
      } else {
        setError(result.message || 'Upload failed');
        setSubmitStatus('error');
      }

    } catch (err) {
      setError('Upload failed: ' + err.message);
      setSubmitStatus('error');
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const handleReset = () => {
    setFormData({
      name: '',
      expiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      primary_owner: user?.staffId || '',
      primary_owner_email: user?.email || '',
      secondary_owner: '',
      secondary_owner_email: '',
      lob: '',
      procedure_subsection: '',
      sharepoint_folder: ''
    });
    setSelectedFile(null);
    setDocumentAnalysis(null);
    setError(null);
    setSuccess(null);
    setActiveStep(0);
    setSubmitStatus('ready');
    
    const fileInput = document.getElementById('file-input');
    if (fileInput) fileInput.value = '';
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

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f6fa' }}>
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
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ mt: -2, pb: 4 }}>
        {/* Status Alert */}
        {(error || success) && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Alert 
              severity={error ? 'error' : 'success'} 
              sx={{ mb: 3 }}
              action={
                error && (
                  <Button color="inherit" size="small" onClick={() => setError(null)}>
                    Dismiss
                  </Button>
                )
              }
            >
              {error || success}
            </Alert>
          </motion.div>
        )}

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
                          label="Primary Owner"
                          name="primary_owner"
                          value={formData.primary_owner}
                          onChange={handleInputChange}
                          required
                          variant="outlined"
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
                        />
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Secondary Owner"
                          name="secondary_owner"
                          value={formData.secondary_owner}
                          onChange={handleInputChange}
                          variant="outlined"
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
                        />
                      </Grid>
                    </Grid>

                    {formData.name && formData.lob && (
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
                       Document must achieve at least 80% quality score before upload. 
                       Please address the AI recommendations above and re-analyze.
                     </Alert>
                   )}
                 </Box>
               )}
             </CardContent>
           </Card>
         </Grid>

         {/* Right Panel - Info & Status */}
         <Grid item xs={12} lg={4}>
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

           <Card sx={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
             <CardContent>
               <Typography variant="h6" gutterBottom>
                 ℹ️ AI Analysis Guidelines
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
                     primary="Document Control"
                     secondary="Owners, sign-off dates, versions"
                   />
                 </ListItem>
                 <ListItem>
                   <ListItemIcon><Warning fontSize="small" /></ListItemIcon>
                   <ListItemText 
                     primary="Risk Assessment"
                     secondary="Risk rating and evaluation"
                   />
                 </ListItem>
                 <ListItem>
                   <ListItemIcon><CalendarToday fontSize="small" /></ListItemIcon>
                   <ListItemText 
                     primary="Periodic Review"
                     secondary="Review schedule and frequency"
                   />
                 </ListItem>
               </List>
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
