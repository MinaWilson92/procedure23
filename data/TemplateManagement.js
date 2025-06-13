// components/email/TemplateManagement.js - Complete Template Management
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Grid, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, Switch,
  FormControlLabel, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Alert, Chip, Accordion, AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Add, Edit, Delete, Save, Cancel, ExpandMore, Email, Send
} from '@mui/icons-material';

const TemplateManagement = ({ emailService }) => {
  const [templates, setTemplates] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const [templateForm, setTemplateForm] = useState({
    id: null,
    type: '',
    name: '',
    subject: '',
    htmlContent: '',
    textContent: '',
    isActive: true
  });

  // Default template types needed
  const requiredTemplates = [
    { type: 'new-procedure-uploaded', name: 'New Procedure Uploaded', icon: '📤' },
    { type: 'procedure-expiring', name: 'Procedure Expiring Soon', icon: '⏰' },
    { type: 'procedure-expired', name: 'Procedure Expired', icon: '🚨' },
    { type: 'user-access-granted', name: 'User Access Granted', icon: '✅' },
    { type: 'user-access-revoked', name: 'User Access Revoked', icon: '❌' },
    { type: 'user-role-updated', name: 'User Role Updated', icon: '🔄' },
    { type: 'low-quality-score', name: 'Low Quality Score Alert', icon: '📊' },
    { type: 'broadcast-admin', name: 'Broadcast to Admins', icon: '📢' },
    { type: 'broadcast-all', name: 'Broadcast to All Users', icon: '📡' }
  ];

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const templates = await emailService.getEmailTemplates();
      setTemplates(templates);
      console.log('✅ Templates loaded:', templates);
    } catch (error) {
      console.error('❌ Failed to load templates:', error);
      setMessage({ type: 'error', text: 'Failed to load templates: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleEditTemplate = (template) => {
    setTemplateForm({
      id: template.id,
      type: template.type,
      name: template.name,
      subject: template.subject,
      htmlContent: template.htmlContent,
      textContent: template.textContent,
      isActive: template.isActive
    });
    setEditingTemplate(template);
    setShowDialog(true);
  };

  const handleCreateTemplate = (templateType) => {
    const defaultTemplate = getDefaultTemplate(templateType);
    setTemplateForm(defaultTemplate);
    setEditingTemplate(null);
    setShowDialog(true);
  };

  const handleSaveTemplate = async () => {
    try {
      setLoading(true);
      const result = await emailService.saveEmailTemplate(templateForm);
      
      if (result.success) {
        setMessage({ type: 'success', text: 'Template saved successfully!' });
        setShowDialog(false);
        await loadTemplates();
      } else {
        setMessage({ type: 'error', text: 'Failed to save template: ' + result.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error saving template: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        setLoading(true);
        const result = await emailService.deleteEmailTemplate(templateId);
        
        if (result.success) {
          setMessage({ type: 'success', text: 'Template deleted successfully!' });
          await loadTemplates();
        } else {
          setMessage({ type: 'error', text: 'Failed to delete template: ' + result.message });
        }
      } catch (error) {
        setMessage({ type: 'error', text: 'Error deleting template: ' + error.message });
      } finally {
        setLoading(false);
      }
    }
  };

  const getDefaultTemplate = (templateType) => {
    const defaults = {
      'user-access-granted': {
        id: null,
        type: 'user-access-granted',
        name: 'User Access Granted',
        subject: 'HSBC Procedures Hub - Access Granted: {{userName}}',
        htmlContent: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #4caf50, #388e3c); padding: 20px; color: white;">
            <h1 style="margin: 0; font-size: 24px;">HSBC Procedures Hub</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Access Granted Notification</p>
          </div>
          <div style="padding: 30px; background: #f1f8e9;">
            <h2 style="color: #2e7d32; margin-top: 0;">✅ Access Granted</h2>
            <p style="color: #666; line-height: 1.6;">Welcome to the HSBC Procedures Hub! Your access has been granted.</p>
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #4caf50; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #2e7d32;">Account Details</h3>
              <p style="margin: 5px 0; color: #666;"><strong>User:</strong> {{userName}}</p>
              <p style="margin: 5px 0; color: #666;"><strong>User ID:</strong> {{userId}}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Granted By:</strong> {{performedBy}}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Access Level:</strong> {{newValue}}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Date:</strong> {{timestamp}}</p>
            </div>
          </div>
        </div>`,
        textContent: 'Access granted to {{userName}} for HSBC Procedures Hub',
        isActive: true
      },
      'user-access-revoked': {
        id: null,
        type: 'user-access-revoked',
        name: 'User Access Revoked',
        subject: 'HSBC Procedures Hub - Access Revoked: {{userName}}',
        htmlContent: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #f44336, #d32f2f); padding: 20px; color: white;">
            <h1 style="margin: 0; font-size: 24px;">HSBC Procedures Hub</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Access Revoked Notification</p>
          </div>
          <div style="padding: 30px; background: #ffebee;">
            <h2 style="color: #c62828; margin-top: 0;">❌ Access Revoked</h2>
            <p style="color: #666; line-height: 1.6;">Your access to the HSBC Procedures Hub has been revoked.</p>
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #f44336; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #c62828;">Revocation Details</h3>
              <p style="margin: 5px 0; color: #666;"><strong>User:</strong> {{userName}}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Previous Access:</strong> {{oldValue}}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Revoked By:</strong> {{performedBy}}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Date:</strong> {{timestamp}}</p>
            </div>
          </div>
        </div>`,
        textContent: 'Access revoked for {{userName}} from HSBC Procedures Hub',
        isActive: true
      },
      'user-role-updated': {
        id: null,
        type: 'user-role-updated',
        name: 'User Role Updated',
        subject: 'HSBC Procedures Hub - Role Updated: {{userName}}',
        htmlContent: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #ff9800, #f57c00); padding: 20px; color: white;">
            <h1 style="margin: 0; font-size: 24px;">HSBC Procedures Hub</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Role Update Notification</p>
          </div>
          <div style="padding: 30px; background: #fff3e0;">
            <h2 style="color: #e65100; margin-top: 0;">🔄 Role Updated</h2>
            <p style="color: #666; line-height: 1.6;">Your role in the HSBC Procedures Hub has been updated.</p>
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #ff9800; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #e65100;">Role Change Details</h3>
              <p style="margin: 5px 0; color: #666;"><strong>User:</strong> {{userName}}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Previous Role:</strong> {{oldValue}}</p>
              <p style="margin: 5px 0; color: #666;"><strong>New Role:</strong> {{newValue}}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Updated By:</strong> {{performedBy}}</p>
            </div>
          </div>
        </div>`,
        textContent: 'Role updated for {{userName}} in HSBC Procedures Hub',
        isActive: true
      }
    };

    return defaults[templateType] || {
      id: null,
      type: templateType,
      name: templateType.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      subject: `HSBC Procedures Hub - ${templateType}`,
      htmlContent: '<p>Default template content - please customize</p>',
      textContent: 'Default template content',
      isActive: true
    };
  };

  const getMissingTemplates = () => {
    const existingTypes = templates.map(t => t.type);
    return requiredTemplates.filter(req => !existingTypes.includes(req.type));
  };

  return (
    <Box>
      {message && (
        <Alert severity={message.type} sx={{ mb: 2 }} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      {/* Missing Templates Alert */}
      {getMissingTemplates().length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            ⚠️ Missing Required Templates ({getMissingTemplates().length})
          </Typography>
          <Typography variant="body2" gutterBottom>
            The following email templates are missing and need to be created:
          </Typography>
          <Grid container spacing={1} sx={{ mt: 1 }}>
            {getMissingTemplates().map(template => (
              <Grid item key={template.type}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={() => handleCreateTemplate(template.type)}
                  color="warning"
                >
                  {template.icon} {template.name}
                </Button>
              </Grid>
            ))}
          </Grid>
        </Alert>
      )}

      {/* Existing Templates */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              📧 Email Templates ({templates.length})
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setShowDialog(true)}
            >
              Create Custom Template
            </Button>
          </Box>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Template</strong></TableCell>
                  <TableCell><strong>Type</strong></TableCell>
                  <TableCell><strong>Subject</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {templates.map(template => (
                  <TableRow key={template.id}>
                    <TableCell>{template.name}</TableCell>
                    <TableCell>
                      <Chip label={template.type} size="small" />
                    </TableCell>
                    <TableCell>{template.subject?.substring(0, 50)}...</TableCell>
                    <TableCell>
                      <Chip 
                        label={template.isActive ? 'Active' : 'Inactive'} 
                        color={template.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        startIcon={<Edit />}
                        onClick={() => handleEditTemplate(template)}
                        sx={{ mr: 1 }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        startIcon={<Delete />}
                        onClick={() => handleDeleteTemplate(template.id)}
                        color="error"
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Template Editor Dialog */}
      <Dialog open={showDialog} onClose={() => setShowDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingTemplate ? 'Edit Email Template' : 'Create Email Template'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Template Name"
                value={templateForm.name}
                onChange={(e) => setTemplateForm({...templateForm, name: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Template Type"
                value={templateForm.type}
                onChange={(e) => setTemplateForm({...templateForm, type: e.target.value})}
                helperText="e.g., user-access-granted"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email Subject"
                value={templateForm.subject}
                onChange={(e) => setTemplateForm({...templateForm, subject: e.target.value})}
                helperText="Use {{variableName}} for dynamic content"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={8}
                label="HTML Content"
                value={templateForm.htmlContent}
                onChange={(e) => setTemplateForm({...templateForm, htmlContent: e.target.value})}
                helperText="HTML email content with {{variables}}"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Text Content"
                value={templateForm.textContent}
                onChange={(e) => setTemplateForm({...templateForm, textContent: e.target.value})}
                helperText="Plain text version"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={templateForm.isActive}
                    onChange={(e) => setTemplateForm({...templateForm, isActive: e.target.checked})}
                  />
                }
                label="Template Active"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDialog(false)} startIcon={<Cancel />}>
            Cancel
          </Button>
          <Button onClick={handleSaveTemplate} startIcon={<Save />} variant="contained" disabled={loading}>
            Save Template
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TemplateManagement;
