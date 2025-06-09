// components/ProcedureDetailsModal.js - Updated for Your Exact SharePoint Fields
import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Box, Typography, Grid, Card, CardContent, Chip, Divider,
  List, ListItem, ListItemIcon, ListItemText, Avatar,
  LinearProgress, Alert, IconButton, Skeleton, Link
} from '@mui/material';
import {
  Close, Person, CalendarToday, Business, Assignment,
  Security, Schedule, Star, CloudDownload, Email,
  Phone, LocationOn, Work, Description, Link as LinkIcon,
  Grade, TrendingUp, Warning, CheckCircle, ErrorIcon
} from '@mui/icons-material';

const ProcedureDetailsModal = ({ 
  open, 
  onClose, 
  procedureId, 
  sharePointAvailable = false 
}) => {
  const [loading, setLoading] = useState(false);
  const [procedureDetails, setProcedureDetails] = useState(null);
  const [error, setError] = useState(null);

  // 🎯 **CORRECTED: SharePoint API for Individual Procedure with Your Exact Fields**
  const getDetailedProcedureUrl = (id) => {
    // Using only your exact SharePoint fields
    const selectFields = [
      // Basic Info
      'Id', 'Title', 'Created', 'Modified',
      
      // Your Exact Procedure Fields
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

      console.log('🔍 Loading detailed procedure data for ID:', procedureId);

      if (!sharePointAvailable) {
        // Load mock detailed data
        loadMockDetails();
        return;
      }

      const detailUrl = getDetailedProcedureUrl(procedureId);
      console.log('📡 SharePoint API URL:', detailUrl);

      const response = await fetch(detailUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json; odata=verbose'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Detailed procedure data:', data.d);

        // Process the detailed data using your exact SharePoint fields
        const details = processDetailedData(data.d);
        setProcedureDetails(details);

      } else {
        const errorText = await response.text();
        console.error('❌ Failed to load procedure details:', response.status, errorText);
        setError(`Failed to load procedure details: ${response.status}`);
        loadMockDetails(); // Fallback
      }

    } catch (err) {
      console.error('❌ Error loading procedure details:', err);
      setError(err.message);
      loadMockDetails(); // Fallback
    } finally {
      setLoading(false);
    }
  };

  const processDetailedData = (spItem) => {
    // Parse JSON fields safely
    const safeJsonParse = (jsonString, defaultValue = {}) => {
      try {
        return jsonString ? JSON.parse(jsonString) : defaultValue;
      } catch {
        return defaultValue;
      }
    };

    return {
      // Basic Info
      id: spItem.Id,
      name: spItem.Title,
      uploadedOn: spItem.UploadedAt || spItem.Created,
      modifiedOn: spItem.Modified,
      
      // Document Info using your exact fields
      lob: spItem.LOB,
      subsection: spItem.ProcedureSubsection,
      expiry: spItem.ExpiryDate,
      status: spItem.Status,
      riskRating: spItem.RiskRating,
      periodicReview: spItem.PeriodicReview,
      qualityScore: spItem.QualityScore,
      signOffDate: spItem.SignOffDate,
      
      // File Info using your exact fields
      documentLink: spItem.DocumentLink,
      originalFilename: spItem.OriginalFilename,
      fileSize: spItem.FileSize,
      
      // Users using your exact fields
      uploadedBy: spItem.UploadedBy || 'Unknown',
      primaryOwner: spItem.PrimaryOwner,
      primaryOwnerEmail: spItem.PrimaryOwnerEmail,
      secondaryOwner: spItem.SecondaryOwner,
      secondaryOwnerEmail: spItem.SecondaryOwnerEmail,
      
      // Analysis Data using your exact fields
      analysisDetails: safeJsonParse(spItem.AnalysisDetails),
      aiRecommendations: safeJsonParse(spItem.AIRecommendations, []),
      foundElements: safeJsonParse(spItem.FoundElements, []),
      documentOwners: safeJsonParse(spItem.DocumentOwners, [])
    };
  };

  const loadMockDetails = () => {
    // Mock detailed data matching your SharePoint fields
    setProcedureDetails({
      id: procedureId,
      name: "Risk Assessment Framework - Detailed View",
      uploadedOn: "2024-05-15T10:30:00Z",
      modifiedOn: "2024-06-10T14:20:00Z",
      lob: "IWPB",
      subsection: "Credit Risk",
      expiry: "2024-12-31",
      status: "Active",
      riskRating: "High",
      periodicReview: "Annual",
      qualityScore: 92,
      signOffDate: "2024-05-20",
      documentLink: "https://sharepoint.hsbc.com/sites/procedures/documents/risk-framework.pdf",
      originalFilename: "HSBC_Risk_Assessment_Framework_v2.1.pdf",
      fileSize: 2450000,
      uploadedBy: "John Smith",
      primaryOwner: "Michael Chen",
      primaryOwnerEmail: "michael.chen@hsbc.com",
      secondaryOwner: "Sarah Johnson", 
      secondaryOwnerEmail: "sarah.johnson@hsbc.com",
      analysisDetails: {
        score: 92
      },
      aiRecommendations: [
        "Add specific annual review scheduling",
        "Include stakeholder approval matrix"
      ],
      foundElements: [
        "Document Control Section",
        "Risk Assessment Matrix", 
        "Approval Workflow"
      ],
      documentOwners: [
        "Michael Chen - Head of Credit Risk",
        "Sarah Johnson - Risk Director"
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

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'success';
      case 'expired': return 'error';
      case 'draft': return 'warning';
      default: return 'default';
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

  if (!open) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      sx={{ '& .MuiDialog-paper': { height: '90vh' } }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Assignment color="primary" />
            <Typography variant="h5" fontWeight="bold">
              Procedure Details
            </Typography>
            {!sharePointAvailable && (
              <Chip label="Demo Mode" size="small" color="warning" />
            )}
          </Box>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {loading ? (
          <Box>
            <Skeleton variant="text" width="60%" height={40} sx={{ mb: 2 }} />
            <Skeleton variant="rectangular" height={200} sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              {[1, 2, 3, 4].map(n => (
                <Grid item xs={6} key={n}>
                  <Skeleton variant="rectangular" height={120} />
                </Grid>
              ))}
            </Grid>
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>Failed to Load Details</Typography>
            <Typography variant="body2">{error}</Typography>
            <Button variant="contained" size="small" sx={{ mt: 2 }} onClick={loadProcedureDetails}>
              Retry
            </Button>
          </Alert>
        ) : procedureDetails ? (
          <Box>
            {/* Procedure Header */}
            <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                  {procedureDetails.name}
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                  <Chip 
                    label={`Status: ${procedureDetails.status}`}
                    color={getStatusColor(procedureDetails.status)}
                    variant="filled"
                  />
                  <Chip 
                    label={`LOB: ${procedureDetails.lob}`}
                    color="primary"
                    variant="outlined"
                  />
                  <Chip 
                    label={`Risk: ${procedureDetails.riskRating}`}
                    sx={{ 
                      backgroundColor: getRiskColor(procedureDetails.riskRating),
                      color: 'white'
                    }}
                  />
                  <Chip 
                    label={`Review: ${procedureDetails.periodicReview}`}
                    color="info"
                    variant="outlined"
                  />
                </Box>

                {/* Quality Score */}
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    Document Quality Score: <strong>{procedureDetails.qualityScore}%</strong>
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={procedureDetails.qualityScore} 
                    sx={{ 
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: '#e0e0e0',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: procedureDetails.qualityScore >= 80 ? '#4caf50' : 
                                         procedureDetails.qualityScore >= 60 ? '#ff9800' : '#f44336',
                        borderRadius: 4
                      }
                    }}
                  />
                </Box>
              </CardContent>
            </Card>

            <Grid container spacing={3}>
              {/* Left Column - Document Info */}
              <Grid item xs={12} md={6}>
                {/* Document Details using your exact SharePoint fields */}
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Description color="primary" />
                      Document Information
                    </Typography>
                    <Divider sx={{ mb: 2 }} />

                    <List dense>
                      <ListItem>
                        <ListItemIcon><CalendarToday fontSize="small" /></ListItemIcon>
                        <ListItemText 
                          primary="Uploaded On" 
                          secondary={formatDate(procedureDetails.uploadedOn)}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><Schedule fontSize="small" /></ListItemIcon>
                        <ListItemText 
                          primary="Last Modified" 
                          secondary={formatDate(procedureDetails.modifiedOn)}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><CalendarToday fontSize="small" /></ListItemIcon>
                        <ListItemText 
                          primary="Expiry Date" 
                          secondary={formatDate(procedureDetails.expiry)}
                        />
                      </ListItem>
                      {procedureDetails.signOffDate && (
                        <ListItem>
                          <ListItemIcon><CheckCircle fontSize="small" /></ListItemIcon>
                          <ListItemText 
                            primary="Sign-off Date" 
                            secondary={formatDate(procedureDetails.signOffDate)}
                          />
                        </ListItem>
                      )}
                      <ListItem>
                        <ListItemIcon><Description fontSize="small" /></ListItemIcon>
                        <ListItemText 
                          primary="Original Filename" 
                          secondary={procedureDetails.originalFilename || 'Not available'}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><CloudDownload fontSize="small" /></ListItemIcon>
                        <ListItemText 
                          primary="File Size" 
                          secondary={formatFileSize(procedureDetails.fileSize)}
                        />
                      </ListItem>
                      {procedureDetails.subsection && (
                        <ListItem>
                          <ListItemIcon><Business fontSize="small" /></ListItemIcon>
                          <ListItemText 
                            primary="Procedure Subsection" 
                            secondary={procedureDetails.subsection}
                          />
                        </ListItem>
                      )}
                    </List>

                    {/* Document Link */}
                    {procedureDetails.documentLink && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Document Link:
                        </Typography>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<LinkIcon />}
                          href={procedureDetails.documentLink}
                          target="_blank"
                          sx={{ mr: 1, mb: 1 }}
                        >
                          View Document
                        </Button>
                      </Box>
                    )}
                  </CardContent>
                </Card>

                {/* AI Analysis using your exact SharePoint fields */}
                {(procedureDetails.foundElements?.length > 0 || procedureDetails.aiRecommendations?.length > 0) && (
                  <Card sx={{ mb: 3 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Star color="primary" />
                        AI Document Analysis
                      </Typography>
                      <Divider sx={{ mb: 2 }} />

                      {procedureDetails.foundElements?.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" gutterBottom color="success.main">
                            ✅ Found Elements:
                          </Typography>
                          {procedureDetails.foundElements.map((element, index) => (
                            <Chip 
                              key={index}
                              label={element}
                              size="small"
                              color="success"
                              variant="outlined"
                              sx={{ mr: 0.5, mb: 0.5 }}
                            />
                          ))}
                        </Box>
                      )}

                      {procedureDetails.aiRecommendations?.length > 0 && (
                        <Box>
                          <Typography variant="subtitle2" gutterBottom color="info.main">
                            💡 AI Recommendations:
                          </Typography>
                          <List dense>
                            {procedureDetails.aiRecommendations.map((rec, index) => (
                              <ListItem key={index} sx={{ py: 0.5 }}>
                                <ListItemIcon sx={{ minWidth: 30 }}>
                                  <TrendingUp fontSize="small" color="info" />
                                </ListItemIcon>
                                <ListItemText 
                                  primary={rec}
                                  primaryTypographyProps={{ variant: 'body2' }}
                                />
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                )}
              </Grid>

              {/* Right Column - People using your exact SharePoint fields */}
              <Grid item xs={12} md={6}>
                {/* Procedure Owners using your exact SharePoint fields */}
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Person color="primary" />
                      Procedure Owners
                    </Typography>
                    <Divider sx={{ mb: 2 }} />

                    {/* Primary Owner */}
                    {procedureDetails.primaryOwner && (
                      <Card variant="outlined" sx={{ mb: 2 }}>
                        <CardContent sx={{ p: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                              {procedureDetails.primaryOwner[0]}
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="h6" gutterBottom>
                                Primary Owner
                              </Typography>
                              <Typography variant="body2" fontWeight="bold">
                                {procedureDetails.primaryOwner}
                              </Typography>
                              {procedureDetails.primaryOwnerEmail && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                  <Email fontSize="small" color="action" />
                                  <Link href={`mailto:${procedureDetails.primaryOwnerEmail}`} variant="body2">
                                    {procedureDetails.primaryOwnerEmail}
                                  </Link>
                                </Box>
                              )}
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    )}

                    {/* Secondary Owner */}
                    {procedureDetails.secondaryOwner && (
                      <Card variant="outlined" sx={{ mb: 2 }}>
                        <CardContent sx={{ p: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Avatar sx={{ mr: 2, bgcolor: 'secondary.main' }}>
                              {procedureDetails.secondaryOwner[0]}
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="h6" gutterBottom>
                                Secondary Owner
                              </Typography>
                              <Typography variant="body2" fontWeight="bold">
                                {procedureDetails.secondaryOwner}
                              </Typography>
                              {procedureDetails.secondaryOwnerEmail && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                  <Email fontSize="small" color="action" />
                                  <Link href={`mailto:${procedureDetails.secondaryOwnerEmail}`} variant="body2">
                                    {procedureDetails.secondaryOwnerEmail}
                                  </Link>
                                </Box>
                              )}
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    )}
                  </CardContent>
                </Card>

                {/* System Information using your exact SharePoint fields */}
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Assignment color="primary" />
                      System Information
                    </Typography>
                    <Divider sx={{ mb: 2 }} />

                    {/* Uploaded By */}
                    {procedureDetails.uploadedBy && (
                      <Card variant="outlined" sx={{ mb: 2 }}>
                        <CardContent sx={{ p: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Avatar sx={{ mr: 2, bgcolor: 'info.main' }}>
                              {procedureDetails.uploadedBy[0]}
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="h6" gutterBottom>
                                Uploaded By
                              </Typography>
                              <Typography variant="body2" fontWeight="bold">
                                {procedureDetails.uploadedBy}
                              </Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    )}
                  </CardContent>
                </Card>

                {/* Document Owners using your exact SharePoint fields */}
                {procedureDetails.documentOwners?.length > 0 && (
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Grade color="primary" />
                        Document Owners (Extracted)
                      </Typography>
                      <Divider sx={{ mb: 2 }} />

                      <List dense>
                        {procedureDetails.documentOwners.map((owner, index) => (
                          <ListItem key={index}>
                            <ListItemIcon>
                              <Person fontSize="small" />
                            </ListItemIcon>
                            <ListItemText 
                              primary={owner}
                              primaryTypographyProps={{ variant: 'body2' }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </CardContent>
                  </Card>
                )}
              </Grid>
            </Grid>
          </Box>
        ) : (
          <Alert severity="info">
            No procedure details available.
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
        {procedureDetails?.documentLink && (
          <Button 
            variant="contained" 
            startIcon={<CloudDownload />}
            href={procedureDetails.documentLink}
            target="_blank"
          >
            Download Document
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ProcedureDetailsModal;
