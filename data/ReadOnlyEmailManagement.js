// components/email/ReadOnlyEmailManagement.js - View Only for Regular Admins
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Paper, List, ListItem,
  ListItemText, ListItemIcon, Avatar, Chip, Alert, Accordion,
  AccordionSummary, AccordionDetails, Divider
} from '@mui/material';
import {
  Visibility, Group, AdminPanelSettings, Business, ExpandMore,
  Email, Notifications, CheckCircle, Cancel
} from '@mui/icons-material';
import EmailService from '../../services/EmailService';

const ReadOnlyEmailManagement = ({ user }) => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [emailService] = useState(() => new EmailService());

  // LOB Configuration
  const lobConfig = {
    'IWPB': { name: 'International Wealth and Premier Banking', color: '#1976d2', icon: '🏦' },
    'CIB': { name: 'Commercial and Institutional Banking', color: '#388e3c', icon: '🏢' },
    'GCOO': { name: 'Group Chief Operating Officer', color: '#f57c00', icon: '⚙️' }
  };

  const templateConfig = {
    'new-procedure-uploaded': { name: 'New Procedure Updates', icon: '📤' },
    'procedure-expiring': { name: 'Procedure Expiring Soon', icon: '⏰' },
    'procedure-expired': { name: 'Procedure Expired', icon: '🚨' },
    'low-quality-score': { name: 'Low Quality Score Alert', icon: '📊' }
  };

  useEffect(() => {
    loadEmailConfig();
  }, []);

  const loadEmailConfig = async () => {
    try {
      setLoading(true);
      const emailConfig = await emailService.getEmailConfig();
      setConfig(emailConfig);
    } catch (error) {
      console.error('Error loading email config:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderLOBReadOnly = (lob) => {
    const lobConf = lobConfig[lob];
    
    return (
      <Accordion key={lob} sx={{ mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h4">{lobConf.icon}</Typography>
            <Box>
              <Typography variant="h6" fontWeight="bold" color={lobConf.color}>
                {lob} Email Configuration
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {lobConf.name} - View Only
              </Typography>
            </Box>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          {Object.keys(templateConfig).map((templateKey) => (
            <Card key={templateKey} sx={{ mb: 2, border: `1px solid ${lobConf.color}30` }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Typography variant="h4">{templateConfig[templateKey].icon}</Typography>
                  <Typography variant="h6" color={lobConf.color}>
                    {templateConfig[templateKey].name}
                  </Typography>
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, bgcolor: `${lobConf.color}10` }}>
                      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                        {lob} Global Heads
                      </Typography>
                      {config?.globalCCList?.filter(item => 
                        item.lob === lob && 
                        item.escalationType === templateKey &&
                        item.recipientRole === 'Head'
                      ).length > 0 ? (
                        <List dense>
                          {config.globalCCList.filter(item => 
                            item.lob === lob && 
                            item.escalationType === templateKey &&
                            item.recipientRole === 'Head'
                          ).map((head, index) => (
                            <ListItem key={index} sx={{ px: 0 }}>
                              <ListItemIcon>
                                <Avatar sx={{ width: 24, height: 24, bgcolor: lobConf.color }}>
                                  {head.name?.[0] || head.email?.[0]}
                                </Avatar>
                              </ListItemIcon>
                              <ListItemText 
                                primary={head.name || head.email}
                                secondary={head.email}
                              />
                              <Chip 
                                icon={head.active ? <CheckCircle /> : <Cancel />}
                                label={head.active ? 'Active' : 'Disabled'}
                                size="small"
                                color={head.active ? 'success' : 'default'}
                              />
                            </ListItem>
                          ))}
                        </List>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No global heads configured
                        </Typography>
                      )}
                    </Paper>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, bgcolor: '#f4433610' }}>
                      <Typography variant="subtitle2" fontWeight="bold" gutterBottom color="error.main">
                        Admin Recipients
                      </Typography>
                      {config?.adminList?.length > 0 ? (
                        <List dense>
                          {config.adminList.map((admin, index) => (
                            <ListItem key={index} sx={{ px: 0 }}>
                              <ListItemIcon>
                                <Avatar sx={{ width: 24, height: 24, bgcolor: 'error.main' }}>
                                  {admin.name?.[0] || admin.email?.[0]}
                                </Avatar>
                              </ListItemIcon>
                              <ListItemText 
                                primary={admin.name || admin.email}
                                secondary={admin.email}
                              />
                              <Chip 
                                icon={admin.active ? <CheckCircle /> : <Cancel />}
                                label={admin.active ? 'Active' : 'Disabled'}
                                size="small"
                                color={admin.active ? 'success' : 'default'}
                              />
                            </ListItem>
                          ))}
                        </List>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No admin recipients configured
                        </Typography>
                      )}
                    </Paper>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, bgcolor: '#4caf5010' }}>
                      <Typography variant="subtitle2" fontWeight="bold" gutterBottom color="success.main">
                        Procedure Owners
                      </Typography>
                      <Box sx={{ textAlign: 'center', py: 2 }}>
                        <Business sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
                        <Typography variant="body2" fontWeight="bold" color="success.main">
                          Automatic
                        </Typography>
                        <Typography variant="caption" display="block">
                          Primary & Secondary owners are automatically included
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          ))}
        </AccordionDetails>
      </Accordion>
    );
  };

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography>Loading email configuration...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          📧 Email Management - View Only
        </Typography>
        <Typography variant="body2">
          You can view the current email configuration but cannot make changes. 
          This is a read-only view for administrative oversight.
        </Typography>
      </Alert>

      {/* Current Configuration Display */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
        Current Email Recipients Configuration
      </Typography>

      {Object.keys(lobConfig).map((lob) => renderLOBReadOnly(lob))}

      {/* Access Management Read-Only */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
        Access Management Email Configuration
      </Typography>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            👥 User Access Management Recipients
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Custom Recipients
                </Typography>
                {config?.customGroupsList?.length > 0 ? (
                  <List dense>
                    {config.customGroupsList.map((recipient, index) => (
                      <ListItem key={index} sx={{ px: 0 }}>
                        <ListItemIcon>
                          <Avatar sx={{ width: 24, height: 24, bgcolor: 'info.main' }}>
                            {recipient.name?.[0] || recipient.email?.[0]}
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText 
                          primary={recipient.name || recipient.email}
                          secondary={`${recipient.email} - ${recipient.escalationType}`}
                        />
                        <Chip 
                          label={recipient.active ? 'Active' : 'Disabled'}
                          size="small"
                          color={recipient.active ? 'success' : 'default'}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No custom recipients configured
                  </Typography>
                )}
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Test Email Configuration
                </Typography>
                <Typography variant="body2">
                  <strong>Test Email:</strong> {config?.testEmail || 'Not configured'}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ReadOnlyEmailManagement;
