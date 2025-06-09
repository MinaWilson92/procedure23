// components/ProcedureDetailsModal.js - Comprehensive Procedure Details
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

  // 🎯 **ENHANCED SharePoint API Configuration**
  const getDetailedProcedureUrl = (id) => {
    // Comprehensive field selection with expansions for user fields
    const selectFields = [
      // Basic Info
      'Id', 'Title', 'Created', 'Modified',
      
      // Procedure Info
      'LOB', 'ProcedureSubsection', 'ExpiryDate', 'Status',
      'RiskRating', 'PeriodicReview', 'QualityScore',
      'SignOffDate', 'DocumentLink', 'SharePointURL',
      'OriginalFilename', 'FileSize',
      
      // User Fields with Expansion
      'Author/Title', 'Author/EMail', 'Author/JobTitle', 'Author/Department',
      'Author/WorkPhone', 'Author/Office', 'Author/Picture',
      'Editor/Title', 'Editor/EMail', 'Editor/JobTitle', 'Editor/Department',
      
      // Custom User Fields with Expansion
      'PrimaryOwner/Title', 'PrimaryOwner/EMail', 'PrimaryOwner/JobTitle', 'PrimaryOwner/Department',
      'PrimaryOwner/WorkPhone', 'PrimaryOwner/Office',
      'SecondaryOwner/Title', 'SecondaryOwner/EMail', 'SecondaryOwner/JobTitle', 'SecondaryOwner/Department',
      'UploadedBy/Title', 'UploadedBy/EMail', 'UploadedBy/JobTitle', 'UploadedBy/Department',
      
      // Manual Fields
      'PrimaryOwnerEmail', 'SecondaryOwnerEmail', 'PrimaryOwnerManual', 'SecondaryOwnerManual',
      
      // Document Analysis
      'AnalysisDetails', 'AIRecommendations', 'MissingElements',
      'DocumentOwners', 'ExtractedOwners', 'DepartmentOwners'
    ].join(',');

    const expandFields = [
      'Author', 'Editor', 'PrimaryOwner', 'SecondaryOwner', 'UploadedBy'
    ].join(',');

    return `https://teams.global.hsbc/sites/EmployeeEng/_api/web/lists/getbytitle('Procedures')/items(${id})?$select=${selectFields}&$expand=${expandFields}`;
  };

  const getDepartmentInfo = async (department) => {
    try {
      if (!department) return null;
      
      // Get department details from SharePoint User Profile or custom list
      const deptUrl = `https://teams.global.hsbc/sites/EmployeeEng/_api/web/lists/getbytitle('Departments')/items?$select=*&$filter=Title eq '${department}'`;
      
      const response = await fetch(deptUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json; odata=verbose'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        return data.d.results[0] || null;
      }
    } catch (err) {
      console.warn('Could not fetch department info:', err);
    }
    return null;
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

        // Process the detailed data
        const details = await processDetailedData(data.d);
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

  const processDetailedData = async (spItem) => {
    // Parse JSON fields safely
    const safeJsonParse = (jsonString, defaultValue = {}) => {
      try {
        return jsonString ? JSON.parse(jsonString) : defaultValue;
      } catch {
        return defaultValue;
      }
    };

    // Get department info for all users
    const departments = [];
    if (spItem.Author?.Department) departments.push(spItem.Author.Department);
    if (spItem.PrimaryOwner?.Department) departments.push(spItem.PrimaryOwner.Department);
    if (spItem.SecondaryOwner?.Department) departments.push(spItem.SecondaryOwner.Department);

    const uniqueDepartments = [...new Set(departments)];
    const departmentDetails = await Promise.all(
      uniqueDepartments.map(dept => getDepartmentInfo(dept))
    );

    return {
      // Basic Info
      id: spItem.Id,
      name: spItem.Title,
      uploadedOn: spItem.Created,
      modifiedOn: spItem.Modified,
      
      // Document Info
      lob: spItem.LOB,
      subsection: spItem.ProcedureSubsection,
      expiry: spItem.ExpiryDate,
      status: spItem.Status,
      riskRating: spItem.RiskRating,
      periodicReview: spItem.PeriodicReview,
      qualityScore: spItem.QualityScore,
      signOffDate: spItem.SignOffDate,
      
      // File Info
      documentLink: spItem.DocumentLink,
      sharePointURL: spItem.SharePointURL,
      originalFilename: spItem.OriginalFilename,
      fileSize: spItem.FileSize,
      
      // Users from SharePoint (expanded)
      uploadedBy: spItem.Author ? {
        name: spItem.Author.Title,
        email: spItem.Author.EMail,
        jobTitle: spItem.Author.JobTitle,
        department: spItem.Author.Department,
        phone: spItem.Author.WorkPhone,
        office: spItem.Author.Office,
        picture: spItem.Author.Picture?.Url
      } : null,
      
      lastModifiedBy: spItem.Editor ? {
        name: spItem.Editor.Title,
        email: spItem.Editor.EMail,
        jobTitle: spItem.Editor.JobTitle,
        department: spItem.Editor.Department
      } : null,
      
      primaryOwnerFromSP: spItem.PrimaryOwner ? {
        name: spItem.PrimaryOwner.Title,
        email: spItem.PrimaryOwner.EMail,
        jobTitle: spItem.PrimaryOwner.JobTitle,
        department: spItem.PrimaryOwner.Department,
        phone: spItem.PrimaryOwner.WorkPhone,
        office: spItem.PrimaryOwner.Office
      } : null,
      
      secondaryOwnerFromSP: spItem.SecondaryOwner ? {
        name: spItem.SecondaryOwner.Title,
        email: spItem.SecondaryOwner.EMail,
        jobTitle: spItem.SecondaryOwner.JobTitle,
        department: spItem.SecondaryOwner.Department
      } : null,
      
      // Manual User Fields
      primaryOwnerManual: spItem.PrimaryOwnerManual,
      primaryOwnerEmailManual: spItem.PrimaryOwnerEmail,
      secondaryOwnerManual: spItem.SecondaryOwnerManual,
      secondaryOwnerEmailManual: spItem.SecondaryOwnerEmail,
      
      // Document Analysis
      analysisDetails: safeJsonParse(spItem.AnalysisDetails),
      aiRecommendations: safeJsonParse(spItem.AIRecommendations, []),
      missingElements: safeJsonParse(spItem.MissingElements, []),
      documentOwners: safeJsonParse(spItem.DocumentOwners, []),
      extractedOwners: safeJsonParse(spItem.ExtractedOwners, []),
      
      // Department Details
      departmentDetails: departmentDetails.filter(d => d !== null)
    };
  };

  const loadMockDetails = () => {
    // Mock detailed data for demonstration
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
      sharePointURL: "https://sharepoint.hsbc.com/sites/procedures",
      originalFilename: "HSBC_Risk_Assessment_Framework_v2.1.pdf",
      fileSize: 2450000,
      
      uploadedBy: {
        name: "John Smith",
        email: "john.smith@hsbc.com",
        jobTitle: "Senior Risk Manager",
        department: "Global Risk Management",
        phone: "+44 20 7991 8888",
        office: "London - Canary Wharf"
      },
      
      lastModifiedBy: {
        name: "Sarah Johnson",
        email: "sarah.johnson@hsbc.com",
        jobTitle: "Risk Director",
        department: "Global Risk Management"
      },
      
      primaryOwnerFromSP: {
        name: "Michael Chen",
        email: "michael.chen@hsbc.com",
        jobTitle: "Head of Credit Risk",
        department: "Global Risk Management",
        phone: "+852 2822 1111",
        office: "Hong Kong - Central"
      },
      
      primaryOwnerManual: "Michael Chen (Head of Credit Risk)",
      primaryOwnerEmailManual: "michael.chen@hsbc.com",
      
      analysisDetails: {
        score: 92,
        foundElements: [
          "Document Control Section",
          "Risk Assessment Matrix", 
          "Approval Workflow",
          "Version Control"
        ],
        missingElements: [
          "Annual Review Date",
          "Stakeholder Sign-off"
        ]
      },
      
      aiRecommendations: [
        "Add specific annual review scheduling",
        "Include stakeholder approval matrix",
        "Update regulatory references to latest standards"
      ],
      
      extractedOwners: [
        "Michael Chen - Head of Credit Risk",
        "Sarah Johnson - Risk Director", 
        "David Park - Senior Risk Analyst"
      ],
      
      departmentDetails: [
        {
          Title: "Global Risk Management",
          Head: "Sarah Johnson",
          Location: "London, Hong Kong",
          ContactEmail: "grm@hsbc.com"
        }
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

  const UserCard = ({ user, title, isManual = false }) => (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
            {user?.name?.[0] || user?.[0] || '?'}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" gutterBottom>
              {title}
              {isManual && (
                <Chip label="Manual Entry" size="small" color="info" sx={{ ml: 1 }} />
              )}
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              {isManual ? user : user?.name}
            </Typography>
            {user?.email && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                <Email fontSize="small" color="action" />
                <Link href={`mailto:${user.email}`} variant="body2">
                  {user.email}
                </Link>
              </Box>
            )}
            {user?.jobTitle && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                <Work fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {user.jobTitle}
                </Typography>
              </Box>
            )}
            {user?.department && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                <Business fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {user.department}
                </Typography>
              </Box>
            )}
            {user?.phone && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                <Phone fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {user.phone}
                </Typography>
              </Box>
            )}
            {user?.office && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                <LocationOn fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {user.office}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

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
                {/* Document Details */}
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

                    {/* Document Links */}
                    {(procedureDetails.documentLink || procedureDetails.sharePointURL) && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Document Links:
                        </Typography>
                        {procedureDetails.documentLink && (
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
                        )}
                        {procedureDetails.sharePointURL && (
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<Business />}
                            href={procedureDetails.sharePointURL}
                            target="_blank"
                            sx={{ mb: 1 }}
                          >
                            SharePoint Site
                          </Button>
                        )}
                      </Box>
                    )}
                  </CardContent>
                </Card>

                {/* Document Analysis */}
                {procedureDetails.analysisDetails && (
                  <Card sx={{ mb: 3 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Star color="primary" />
                        AI Document Analysis
                      </Typography>
                      <Divider sx={{ mb: 2 }} />

                      {procedureDetails.analysisDetails.foundElements?.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" gutterBottom color="success.main">
                            ✅ Found Elements:
                          </Typography>
                          {procedureDetails.analysisDetails.foundElements.map((element, index) => (
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

                      {procedureDetails.analysisDetails.missingElements?.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" gutterBottom color="warning.main">
                            ⚠️ Missing Elements:
                          </Typography>
                          {procedureDetails.analysisDetails.missingElements.map((element, index) => (
                            <Chip 
                              key={index}
                              label={element}
                              size="small"
                              color="warning"
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

              {/* Right Column - People & Departments */}
              <Grid item xs={12} md={6}>
                {/* Procedure Owners */}
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Person color="primary" />
                      Procedure Owners
                    </Typography>
                    <Divider sx={{ mb: 2 }} />

                    {/* Primary Owner from SharePoint */}
                    {procedureDetails.primaryOwnerFromSP && (
                      <UserCard 
                        user={procedureDetails.primaryOwnerFromSP}
                        title="Primary Owner (SharePoint User)"
                      />
                    )}

                    {/* Primary Owner Manual Entry */}
                    {procedureDetails.primaryOwnerManual && (
                      <UserCard 
                        user={procedureDetails.primaryOwnerManual}
                        title="Primary Owner (Manual Entry)"
                        isManual
                      />
                    )}

                    {/* Secondary Owner from SharePoint */}
                    {procedureDetails.secondaryOwnerFromSP && (
                      <UserCard 
                        user={procedureDetails.secondaryOwnerFromSP}
                        title="Secondary Owner (SharePoint User)"
                      />
                    )}

                    {/* Secondary Owner Manual Entry */}
                    {procedureDetails.secondaryOwnerManual && (
                      <UserCard 
                        user={procedureDetails.secondaryOwnerManual}
                        title="Secondary Owner (Manual Entry)"
                        isManual
                      />
                    )}
                  </CardContent>
                </Card>

                {/* System Users */}
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Assignment color="primary" />
                      System Information
                    </Typography>
                    <Divider sx={{ mb: 2 }} />

                    {/* Uploaded By */}
                    {procedureDetails.uploadedBy && (
                      <UserCard 
                        user={procedureDetails.uploadedBy}
                        title="Uploaded By"
                      />
                    )}

                    {/* Last Modified By */}
                    {procedureDetails.lastModifiedBy && (
                      <UserCard 
                        user={procedureDetails.lastModifiedBy}
                        title="Last Modified By"
                      />
                    )}
                  </CardContent>
                </Card>

                {/* Extracted Document Owners */}
                {procedureDetails.extractedOwners?.length > 0 && (
                  <Card sx={{ mb: 3 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Grade color="primary" />
                        Owners Extracted from Document
                      </Typography>
                      <Divider sx={{ mb: 2 }} />

                      <List dense>
                        {procedureDetails.extractedOwners.map((owner, index) => (
                          <ListItem key={index}>
                            <ListItemIcon>
                              <Person fontSize="small" />
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

               {/* Department Information */}
               {procedureDetails.departmentDetails?.length > 0 && (
                 <Card>
                   <CardContent>
                     <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                       <Business color="primary" />
                       Department Owners
                     </Typography>
                     <Divider sx={{ mb: 2 }} />

                     {procedureDetails.departmentDetails.map((dept, index) => (
                       <Card key={index} variant="outlined" sx={{ mb: 2 }}>
                         <CardContent sx={{ p: 2 }}>
                           <Typography variant="h6" gutterBottom>
                             {dept.Title}
                           </Typography>
                           {dept.Head && (
                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                               <Person fontSize="small" color="action" />
                               <Typography variant="body2">
                                 Head: {dept.Head}
                               </Typography>
                             </Box>
                           )}
                           {dept.Location && (
                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                               <LocationOn fontSize="small" color="action" />
                               <Typography variant="body2">
                                 Location: {dept.Location}
                               </Typography>
                             </Box>
                           )}
                           {dept.ContactEmail && (
                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                               <Email fontSize="small" color="action" />
                               <Link href={`mailto:${dept.ContactEmail}`} variant="body2">
                                 {dept.ContactEmail}
                               </Link>
                             </Box>
                           )}
                         </CardContent>
                       </Card>
                     ))}
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
