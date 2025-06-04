// pages/AdminPanel.js - Enhanced with AI Analysis & SharePoint Upload
import React, { useState, useEffect } from 'react';
import {
  Box, Button, TextField, Grid, InputLabel, MenuItem, Select, FormControl, 
  Typography, Alert, Paper, IconButton, Card, CardContent, LinearProgress,
  Chip, List, ListItem, ListItemIcon, ListItemText, Divider, Collapse,
  Accordion, AccordionSummary, AccordionDetails, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, Stepper, Step, StepLabel,
  StepContent
} from '@mui/material';
import { 
  ArrowBack, CloudUpload, CheckCircle, Error as ErrorIcon, 
  CheckCircleOutline, Cancel, ExpandMore, ExpandLess,
  Description, People, CalendarToday, Warning, Assessment,
  Email, FolderOpen, CloudSync, Security, LightbulbOutlined,
  BugReport, Assignment, Timeline, OpenInNew, Link, Analytics
} from '@mui/icons-material';
import { useNavigation } from '../contexts/NavigationContext';
import DocumentAnalyzer from '../services/DocumentAnalyzer';
import { sharePointPaths } from '../config/paths';

const AdminPanel = ({ user, onDataRefresh }) => {
  const { navigate } = useNavigation();
  const [documentAnalyzer] = useState(() => new DocumentAnalyzer());
  
  const [form, setForm] = useState({
    name: '',
    expiry: '',
    primary_owner: user?.staffId || '',
    primary_owner_email: user?.email || '',
    secondary_owner: '',
    secondary_owner_email: '',
    lob: '',
    procedure_subsection: '',
    sharepoint_folder: '',
    file: null
  });
  
  const [status, setStatus] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [availableSubsections, setAvailableSubsections] = useState([]);
  const [sharePointPath, setSharePointPath] = useState('');

  // Set default expiry date (1 year from now)
  useEffect(() => {
    const defaultExpiry = new Date();
    defaultExpiry.setFullYear(defaultExpiry.getFullYear() + 1);
    setForm(prev => ({
      ...prev,
      expiry: defaultExpiry.toISOString().split('T')[0]
    }));
  }, []);

  // Update subsections when LOB changes
  useEffect(() => {
    if (form.lob) {
      const subsections = documentAnalyzer.getSubsections(form.lob);
      setAvailableSubsections(subsections);
      
      // Reset subsection selection
      setForm(prev => ({
        ...prev,
        procedure_subsection: '',
        sharepoint_folder: ''
      }));
      setSharePointPath('');
    } else {
      setAvailableSubsections([]);
    }
  }, [form.lob]);

  // Update SharePoint path when subsection changes
  useEffect(() => {
    if (form.lob && form.procedure_subsection) {
      try {
        const path = sharePointPaths.getSharePointPath(form.lob, form.procedure_subsection);
        setSharePointPath(path);
        setForm(prev => ({
          ...prev,
          sharepoint_folder: path
        }));
      } catch (error) {
        console.error('Error generating SharePoint path:', error);
      }
    }
  }, [form.lob, form.procedure_subsection]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        // Validate file using DocumentAnalyzer
        documentAnalyzer.validateFile(file);
        setForm({ ...form, file });
        setStatus(null);
        setCurrentStep(1);
      } catch (error) {
        setStatus({ success: false, message: error.message });
      }
    }
  };

  const handleAnalyzeDocument = async () => {
    if (!form.file || !form.name || !form.lob) {
      setStatus({ success: false, message: 'Please provide procedure name, LOB, and file before analysis' });
      return;
    }

    try {
      setUploading(true);
      setStatus(null);
      
      console.log('🔍 Starting document analysis...');
      
      const analysisResult = await documentAnalyzer.analyzeDocument(form.file, {
        name: form.name,
        lob: form.lob,
        subsection: form.procedure_subsection
      });

      setAnalysis(analysisResult);
      setCurrentStep(2);
      
      if (analysisResult.accepted) {
        setStatus({ 
          success: true, 
          message: `✅ Document analysis completed! Quality score: ${analysisResult.score}% - Ready for upload` 
        });
      } else {
        setStatus({ 
          success: false, 
          message: `❌ Document quality score: ${analysisResult.score}% (Minimum required: 80%). Please review recommendations below.` 
        });
      }

    } catch (error) {
      console.error('Analysis error:', error);
      setStatus({ success: false, message: 'Analysis failed: ' + error.message });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!analysis) {
      setStatus({ success: false, message: 'Please analyze the document first' });
      return;
    }

    if (!analysis.accepted) {
      setStatus({ success: false, message: 'Document does not meet quality standards. Please address the recommendations.' });
      return;
    }

    const errors = validateForm();
    if (errors.length > 0) {
      setStatus({ success: false, message: errors.join(', ') });
      return;
    }
    
    try {
      setUploading(true);
      setStatus(null);
      setCurrentStep(3);
      
      console.log('🚀 Starting procedure upload to SharePoint...');
      
      const result = await documentAnalyzer.uploadProcedureWithAnalysis(form, form.file);
      
      if (result.success) {
        setStatus({ 
          success: true, 
          message: `✅ Procedure uploaded successfully! SharePoint path: ${result.sharePointPath}` 
        });
        
        // Show SharePoint URL if available
        if (result.sharePointUrl) {
          setStatus(prev => ({
            ...prev,
            sharePointUrl: result.sharePointUrl
          }));
        }
        
        // Reset form after successful upload
        setTimeout(() => {
          resetForm();
          if (onDataRefresh) onDataRefresh();
        }, 3000);
        
      } else {
        setStatus({ success: false, message: result.message });
      }

    } catch (error) {
      console.error('Upload error:', error);
      setStatus({ success: false, message: 'Upload failed: ' + error.message });
    } finally {
      setUploading(false);
    }
  };

  const validateForm = () => {
    const errors = [];
    
    if (!form.name.trim()) errors.push('Procedure name is required');
    if (!form.primary_owner.trim()) errors.push('Primary owner is required');
    if (!form.primary_owner_email.trim()) errors.push('Primary owner email is required');
    if (!validateEmail(form.primary_owner_email)) errors.push('Primary owner email is invalid');
    if (!form.lob) errors.push('Line of Business is required');
    if (!form.procedure_subsection) errors.push('Procedure subsection is required');
    if (!form.expiry) errors.push('Expiry date is required');
    if (!form.file) errors.push('Document file is required');
    
    return errors;
  };

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const resetForm = () => {
    setForm({
      name: '',
      expiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      primary_owner: user?.staffId || '',
      primary_owner_email: user?.email || '',
      secondary_owner: '',
      secondary_owner_email: '',
      lob: '',
      procedure_subsection: '',
      sharepoint_folder: '',
      file: null
    });
    setAnalysis(null);
    setStatus(null);
    setCurrentStep(0);
    setSharePointPath('');
    
    // Clear file input
    const fileInput = document.getElementById('file-input');
    if (fileInput) fileInput.value = '';
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#4caf50';
    if (score >= 60) return '#ff9800';
    return '#f44336';
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'HIGH': return <ErrorIcon sx={{ color: '#f44336' }} />;
      case 'MEDIUM': return <Warning sx={{ color: '#ff9800' }} />;
      case 'LOW': return <LightbulbOutlined sx={{ color: '#4caf50' }} />;
      default: return <Assignment sx={{ color: '#2196f3' }} />;
    }
  };

  const steps = [
    'Enter Procedure Details',
    'Upload & Validate Document',
    'AI Analysis & Review',
    'SharePoint Upload'
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5', py: 4 }}>
      <Paper sx={{ maxWidth: 1000, mx: 'auto', p: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={() => navigate('home')} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
            Upload Procedure with AI Analysis
          </Typography>
        </Box>

        {/* Progress Stepper */}
        <Stepper activeStep={currentStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Status Alert */}
        {status && (
          <Alert 
            severity={status.success ? 'success' : 'error'} 
            sx={{ mb: 3 }}
            action={
              status.sharePointUrl && (
                <Button 
                  color="inherit" 
                  size="small"
                  startIcon={<OpenInNew />}
                  onClick={() => window.open(status.sharePointUrl, '_blank')}
                >
                  Open in SharePoint
                </Button>
              )
            }
          >
            <Typography variant="body2" fontWeight="bold">
              {status.success ? 'Success' : 'Error'}
            </Typography>
            <Typography variant="body2">
              {status.message}
            </Typography>
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Step 1: Procedure Details */}
            <Grid item xs={12}>
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Assignment />
                    Procedure Information
                  </Typography>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <TextField 
                        fullWidth 
                        label="Procedure Name" 
                        name="name" 
                        value={form.name} 
                        onChange={handleChange} 
                        required 
                        variant="outlined"
                        placeholder="Enter a descriptive name for the procedure"
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth required variant="outlined">
                        <InputLabel>Line of Business</InputLabel>
                        <Select 
                          name="lob" 
                          value={form.lob} 
                          onChange={handleChange}
                          label="Line of Business"
                        >
                          <MenuItem value="">Select LOB</MenuItem>
                          <MenuItem value="IWPB">IWPB - International Wealth & Premier Banking</MenuItem>
                          <MenuItem value="CIB">CIB - Commercial & Institutional Banking</MenuItem>
                          <MenuItem value="GCOO">GCOO - Group Chief Operating Officer</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth required variant="outlined" disabled={!form.lob}>
                        <InputLabel>Procedure Subsection</InputLabel>
                        <Select 
                          name="procedure_subsection" 
                          value={form.procedure_subsection} 
                          onChange={handleChange}
                          label="Procedure Subsection"
                        >
                          <MenuItem value="">Select Subsection</MenuItem>
                          {availableSubsections.map((subsection) => (
                            <MenuItem key={subsection.value} value={subsection.value}>
                              {subsection.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* SharePoint Path Preview */}
                    {sharePointPath && (
                      <Grid item xs={12}>
                        <Alert severity="info" sx={{ display: 'flex', alignItems: 'center' }}>
                          <FolderOpen sx={{ mr: 1 }} />
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              SharePoint Destination:
                            </Typography>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                              {sharePointPath}
                            </Typography>
                          </Box>
                        </Alert>
                      </Grid>
                    )}
                    
                    <Grid item xs={12} sm={6}>
                      <TextField 
                        fullWidth 
                        label="Primary Owner" 
                        name="primary_owner" 
                        value={form.primary_owner} 
                        onChange={handleChange} 
                        required 
                        variant="outlined"
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField 
                        fullWidth 
                        label="Primary Owner Email" 
                        name="primary_owner_email" 
                        value={form.primary_owner_email} 
                        onChange={handleChange} 
                        required 
                        type="email"
                        variant="outlined"
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField 
                        fullWidth 
                        label="Secondary Owner" 
                        name="secondary_owner" 
                        value={form.secondary_owner} 
                        onChange={handleChange}
                        variant="outlined"
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField 
                        fullWidth 
                        label="Secondary Owner Email" 
                        name="secondary_owner_email" 
                        value={form.secondary_owner_email} 
                        onChange={handleChange}
                        type="email"
                        variant="outlined"
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Expiry Date"
                        name="expiry"
                        type="date"
                        value={form.expiry}
                        onChange={handleChange}
                        required
                        variant="outlined"
                        InputLabelProps={{ shrink: true }}
                        inputProps={{
                          min: new Date().toISOString().split('T')[0]
                        }}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Step 2: File Upload */}
            <Grid item xs={12}>
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CloudUpload />
                    Document Upload & AI Analysis
                  </Typography>
                  
                  <Box sx={{ 
                    border: '2px dashed #ccc', 
                    borderRadius: 2, 
                    p: 3, 
                    textAlign: 'center',
                    bgcolor: form.file ? '#f8f9fa' : '#fafafa'
                  }}>
                    <input
                      type="file"
                      id="file-input"
                      hidden
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                    />
                    
                    {!form.file ? (
                      <>
                        <CloudUpload sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" gutterBottom>
                          Select Procedure Document
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Upload a PDF or Word document (.pdf, .docx, .doc) - Max 10MB
                        </Typography>
                        <label htmlFor="file-input">
                          <Button 
                            variant="contained" 
                            component="span"
                            startIcon={<CloudUpload />}
                            size="large"
                          >
                            Choose File
                          </Button>
                        </label>
                      </>
                    ) : (
                      <Box>
                        <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                        <Typography variant="h6" gutterBottom>
                          ✓ {form.file.name}
                       </Typography>
                       <Typography variant="body2" color="text.secondary" gutterBottom>
                         Size: {(form.file.size / 1024 / 1024).toFixed(2)} MB
                       </Typography>
                       
                       <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 2 }}>
                         <Button
                           variant="outlined"
                           onClick={() => {
                             setForm({ ...form, file: null });
                             setAnalysis(null);
                             setCurrentStep(0);
                             document.getElementById('file-input').value = '';
                           }}
                           startIcon={<Cancel />}
                         >
                           Remove File
                         </Button>
                         <Button
                           variant="contained"
                           onClick={handleAnalyzeDocument}
                           disabled={uploading || !form.name || !form.lob}
                           startIcon={uploading ? <LinearProgress size={20} /> : <Analytics />}
                         >
                           {uploading ? 'Analyzing...' : 'Analyze with AI'}
                         </Button>
                       </Box>
                     </Box>
                   )}
                 </Box>
               </CardContent>
             </Card>
           </Grid>

           {/* Step 3: AI Analysis Results */}
           {analysis && (
             <Grid item xs={12}>
               <Card sx={{ 
                 mb: 3, 
                 bgcolor: analysis.accepted ? '#e8f5e9' : '#ffebee',
                 border: analysis.accepted ? '2px solid #4caf50' : '2px solid #f44336'
               }}>
                 <CardContent>
                   <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                     <Analytics />
                     AI Document Quality Analysis
                     <Chip 
                       label={analysis.accepted ? 'ACCEPTED' : 'REJECTED'} 
                       color={analysis.accepted ? 'success' : 'error'}
                       icon={analysis.accepted ? <CheckCircle /> : <ErrorIcon />}
                     />
                   </Typography>
                   
                   <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                     <Typography variant="h3" sx={{ color: getScoreColor(analysis.score), fontWeight: 'bold' }}>
                       {analysis.score}%
                     </Typography>
                     <Box sx={{ flex: 1 }}>
                       <Typography variant="body2" color="text.secondary" gutterBottom>
                         Quality Score (Minimum Required: 80%)
                       </Typography>
                       <LinearProgress 
                         variant="determinate" 
                         value={analysis.score} 
                         sx={{ 
                           height: 10, 
                           borderRadius: 5,
                           backgroundColor: '#e0e0e0',
                           '& .MuiLinearProgress-bar': {
                             backgroundColor: getScoreColor(analysis.score),
                             borderRadius: 5
                           }
                         }}
                       />
                     </Box>
                   </Box>

                   {/* Document Structure Analysis */}
                   <Accordion sx={{ mb: 2 }}>
                     <AccordionSummary expandIcon={<ExpandMore />}>
                       <Typography variant="h6">
                         📋 Document Structure Analysis
                       </Typography>
                     </AccordionSummary>
                     <AccordionDetails>
                       <Grid container spacing={2}>
                         <Grid item xs={12} md={6}>
                           <Typography variant="subtitle2" gutterBottom color="success.main">
                             ✅ Found Elements ({analysis.details.foundElements.length})
                           </Typography>
                           <List dense>
                             {analysis.details.foundElements.map((element, index) => (
                               <ListItem key={index} sx={{ py: 0 }}>
                                 <ListItemIcon sx={{ minWidth: 30 }}>
                                   <CheckCircleOutline color="success" fontSize="small" />
                                 </ListItemIcon>
                                 <ListItemText primary={element} />
                               </ListItem>
                             ))}
                           </List>
                         </Grid>
                         
                         <Grid item xs={12} md={6}>
                           <Typography variant="subtitle2" gutterBottom color="error.main">
                             ❌ Missing Elements ({analysis.details.missingElements.length})
                           </Typography>
                           <List dense>
                             {analysis.details.missingElements.map((element, index) => (
                               <ListItem key={index} sx={{ py: 0 }}>
                                 <ListItemIcon sx={{ minWidth: 30 }}>
                                   <Cancel color="error" fontSize="small" />
                                 </ListItemIcon>
                                 <ListItemText primary={element} />
                               </ListItem>
                             ))}
                           </List>
                         </Grid>
                       </Grid>
                     </AccordionDetails>
                   </Accordion>

                   {/* Extracted Information */}
                   {analysis.details.structuredStatus && (
                     <Accordion sx={{ mb: 2 }}>
                       <AccordionSummary expandIcon={<ExpandMore />}>
                         <Typography variant="h6">
                           🔍 Extracted Information
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
                                     label={analysis.details.structuredStatus.documentOwners?.found ? 'Found' : 'Missing'}
                                     color={analysis.details.structuredStatus.documentOwners?.found ? 'success' : 'error'}
                                     size="small"
                                   />
                                 </TableCell>
                                 <TableCell>
                                   {analysis.details.owners?.join(', ') || 'Not found'}
                                 </TableCell>
                               </TableRow>
                               <TableRow>
                                 <TableCell>Risk Rating</TableCell>
                                 <TableCell>
                                   <Chip 
                                     label={analysis.details.riskRating ? 'Found' : 'Missing'}
                                     color={analysis.details.riskRating ? 'success' : 'error'}
                                     size="small"
                                   />
                                 </TableCell>
                                 <TableCell>
                                   {analysis.details.riskRating || 'Not specified'}
                                 </TableCell>
                               </TableRow>
                               <TableRow>
                                 <TableCell>Periodic Review</TableCell>
                                 <TableCell>
                                   <Chip 
                                     label={analysis.details.periodicReview ? 'Found' : 'Missing'}
                                     color={analysis.details.periodicReview ? 'success' : 'error'}
                                     size="small"
                                   />
                                 </TableCell>
                                 <TableCell>
                                   {analysis.details.periodicReview || 'Not specified'}
                                 </TableCell>
                               </TableRow>
                               <TableRow>
                                 <TableCell>Sign-off Dates</TableCell>
                                 <TableCell>
                                   <Chip 
                                     label={analysis.details.signOffDates?.length > 0 ? 'Found' : 'Missing'}
                                     color={analysis.details.signOffDates?.length > 0 ? 'success' : 'error'}
                                     size="small"
                                   />
                                 </TableCell>
                                 <TableCell>
                                   {analysis.details.signOffDates?.join(', ') || 'Not found'}
                                 </TableCell>
                               </TableRow>
                             </TableBody>
                           </Table>
                         </TableContainer>
                       </AccordionDetails>
                     </Accordion>
                   )}

                   {/* AI Recommendations */}
                   {analysis.aiRecommendations && analysis.aiRecommendations.length > 0 && (
                     <Accordion>
                       <AccordionSummary expandIcon={<ExpandMore />}>
                         <Typography variant="h6">
                           🤖 AI Recommendations ({analysis.aiRecommendations.length})
                         </Typography>
                       </AccordionSummary>
                       <AccordionDetails>
                         <TableContainer component={Paper} variant="outlined">
                           <Table size="small">
                             <TableHead>
                               <TableRow>
                                 <TableCell width="10%">Priority</TableCell>
                                 <TableCell width="20%">Category</TableCell>
                                 <TableCell width="50%">Recommendation</TableCell>
                                 <TableCell width="20%">Impact</TableCell>
                               </TableRow>
                             </TableHead>
                             <TableBody>
                               {analysis.aiRecommendations.map((rec, index) => (
                                 <TableRow 
                                   key={index}
                                   sx={{ 
                                     bgcolor: rec.priority === 'HIGH' ? '#ffebee' : 
                                             rec.priority === 'MEDIUM' ? '#fff3e0' : '#f3e5f5'
                                   }}
                                 >
                                   <TableCell>
                                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                       {getPriorityIcon(rec.priority)}
                                       <Typography variant="caption" fontWeight="bold">
                                         {rec.priority}
                                       </Typography>
                                     </Box>
                                   </TableCell>
                                   <TableCell>
                                     <Typography variant="body2" fontWeight="bold">
                                       {rec.category}
                                     </Typography>
                                   </TableCell>
                                   <TableCell>
                                     <Typography variant="body2">
                                       {rec.message}
                                     </Typography>
                                   </TableCell>
                                   <TableCell>
                                     <Chip 
                                       label={rec.impact}
                                       size="small"
                                       color={rec.impact.includes('+') ? 'success' : 'warning'}
                                       variant="outlined"
                                     />
                                   </TableCell>
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
             </Grid>
           )}

           {/* Submit Button */}
           <Grid item xs={12}>
             <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
               <Button 
                 variant="outlined" 
                 size="large"
                 onClick={resetForm}
                 disabled={uploading}
               >
                 Reset Form
               </Button>
               <Button 
                 type="submit" 
                 variant="contained" 
                 size="large"
                 disabled={uploading || !analysis?.accepted}
                 sx={{ minWidth: 200 }}
                 startIcon={uploading ? <LinearProgress size={16} /> : <CloudSync />}
               >
                 {uploading ? 'Uploading to SharePoint...' : 'Upload to SharePoint'}
               </Button>
             </Box>
             
             {analysis && !analysis.accepted && (
               <Alert severity="warning" sx={{ mt: 2 }}>
                 <Typography variant="body2">
                   Document must achieve at least 80% quality score before upload. 
                   Please address the AI recommendations above and re-analyze.
                 </Typography>
               </Alert>
             )}
           </Grid>
         </Grid>
       </form>
     </Paper>
   </Box>
 );
};

export default AdminPanel;
