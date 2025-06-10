// components/email/NotificationSettings.js - Complete Fixed Version
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Grid,
  Switch, FormControlLabel, Alert, Chip, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, CircularProgress, List, ListItem, ListItemText,
  ListItemSecondaryAction, IconButton
} from '@mui/material';
import {
  Settings, Edit, Save, Cancel, Notifications, Email,
  CheckCircle, Warning, Refresh, Preview
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import EmailService from '../../services/EmailService';

const NotificationSettings = () => {
  // State management
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [editDialog, setEditDialog] = useState(false);
  const [previewDialog, setPreviewDialog] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [templateForm, setTemplateForm] = useState({
    type: '',
    name: '',
    subject: '',
    htmlContent: '',
    textContent: '',
    isActive: true
  });

  // Template types configuration matching your SharePoint structure
  const templateTypes = [
    {
      type: 'new-procedure-uploaded',
      name: 'New Procedure Uploaded',
      description: 'Sent when a new procedure is uploaded to the system',
      icon: '📤',
      color: 'primary'
    },
    {
      type: 'procedure-expiring',
      name: 'Procedure Expiring Soon',
      description: 'Sent when a procedure is approaching its expiry date',
      icon: '⏰',
      color: 'warning'
    },
    {
      type: 'procedure-expired',
      name: 'Procedure Expired',
      description: 'Sent when a procedure has expired',
      icon: '🚨',
      color: 'error'
    },
    {
      type: 'low-quality-score',
      name: 'Low Quality Score Alert',
      description: 'Sent when a procedure has a low quality score',
      icon: '📊',
      color: 'info'
    },
    {
      type: 'system-maintenance',
      name: 'System Maintenance',
      description: 'Sent during system maintenance or updates',
      icon: '🔧',
      color: 'secondary'
    },
    {
      type: 'broadcast-announcement',
      name: 'Broadcast Announcement',
      description: 'Sent for general announcements to all users',
      icon: '📢',
      color: 'success'
    }
  ];

  // Available template variables
  const templateVariables = {
    'new-procedure-uploaded': [
      '{{procedureName}}', '{{ownerName}}', '{{uploadDate}}', '{{qualityScore}}', '{{lob}}'
    ],
    'procedure-expiring': [
      '{{procedureName}}', '{{ownerName}}', '{{expiryDate}}', '{{daysLeft}}', '{{lob}}'
    ],
    'procedure-expired': [
      '{{procedureName}}', '{{ownerName}}', '{{expiredDate}}', '{{daysOverdue}}', '{{lob}}'
    ],
    'low-quality-score': [
      '{{procedureName}}', '{{ownerName}}', '{{qualityScore}}', '{{recommendations}}', '{{lob}}'
    ],
    'system-maintenance': [
      '{{maintenanceDate}}', '{{duration}}', '{{affectedSystems}}', '{{contactInfo}}'
    ],
    'broadcast-announcement': [
      '{{announcementTitle}}', '{{announcementBody}}', '{{effectiveDate}}', '{{contactInfo}}'
    ]
  };

  // Initialize email service
  const [emailService] = useState(() => new EmailService());

  useEffect(() => {
    loadEmailTemplates();
  }, []);

  const loadEmailTemplates = async () => {
    try {
      setLoading(true);
      setMessage(null);

      console.log('📧 Loading email templates from SharePoint...');
      const emailTemplates = await emailService.getEmailTemplates();
      
      // Ensure all template types are represented
      const completeTemplates = templateTypes.map(typeConfig => {
        const existingTemplate = emailTemplates.find(t => t.type === typeConfig.type);
        if (existingTemplate) {
          return { ...existingTemplate, ...typeConfig };
        } else {
          // Create default template for missing types
          return {
            id: null,
            type: typeConfig.type,
            name: typeConfig.name,
            subject: getDefaultSubject(typeConfig.type),
            htmlContent: getDefaultHtmlContent(typeConfig.type),
            textContent: getDefaultTextContent(typeConfig.type),
            isActive: true,
            ...typeConfig
          };
        }
      });
      
      setTemplates(completeTemplates);
      console.log('✅ Email templates loaded:', completeTemplates.length);
      
    } catch (error) {
      console.error('❌ Error loading email templates:', error);
      setMessage({ type: 'error', text: 'Failed to load email templates: ' + error.message });
      
      // Set default templates on error
      setTemplates(templateTypes.map(typeConfig => ({
        id: null,
        type: typeConfig.type,
        name: typeConfig.name,
        subject: getDefaultSubject(typeConfig.type),
        htmlContent: getDefaultHtmlContent(typeConfig.type),
        textContent: getDefaultTextContent(typeConfig.type),
        isActive: true,
        ...typeConfig
      })));
    } finally {
      setLoading(false);
    }
  };

  const getDefaultSubject = (type) => {
    const subjects = {
      'new-procedure-uploaded': 'New Procedure Uploaded: {{procedureName}}',
      'procedure-expiring': 'Procedure Expiring Soon: {{procedureName}}',
      'procedure-expired': 'URGENT: Procedure Expired - {{procedureName}}',
      'low-quality-score': 'Quality Alert: {{procedureName}} - Score {{qualityScore}}%',
      'system-maintenance': 'System Maintenance Scheduled: {{maintenanceDate}}',
      'broadcast-announcement': 'Important Announcement: {{announcementTitle}}'
    };
    return subjects[type] || 'HSBC Procedures Hub Notification';
  };

  const getDefaultHtmlContent = (type) => {
    const baseTemplate = (title, bgColor, content) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, ${bgColor}, ${bgColor}); padding: 20px; color: white;">
          <h1 style="margin: 0; font-size: 24px;">HSBC Procedures Hub</h1>
          <p style="margin: 5px 0 0 0; opacity: 0.9;">${title}</p>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          ${content}
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            This email was sent automatically by the HSBC Procedures Hub via SharePoint.
          </p>
        </div>
      </div>
    `;

    const contents = {
      'new-procedure-uploaded': baseTemplate('New Procedure Notification', '#d40000', `
        <h2 style="color: #333; margin-top: 0;">📤 New Procedure Uploaded</h2>
        <p style="color: #666; line-height: 1.6;">A new procedure has been uploaded to the HSBC Procedures Hub:</p>
        <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #d40000; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #d40000;">{{procedureName}}</h3>
          <p style="margin: 5px 0; color: #666;"><strong>Owner:</strong> {{ownerName}}</p>
          <p style="margin: 5px 0; color: #666;"><strong>Upload Date:</strong> {{uploadDate}}</p>
          <p style="margin: 5px 0; color: #666;"><strong>Quality Score:</strong> {{qualityScore}}%</p>
          <p style="margin: 5px 0; color: #666;"><strong>Line of Business:</strong> {{lob}}</p>
        </div>
      `),
      'procedure-expiring': baseTemplate('Expiry Warning', '#ff9800', `
        <h2 style="color: #e65100; margin-top: 0;">⏰ Procedure Expiring Soon</h2>
        <p style="color: #666; line-height: 1.6;">The following procedure is approaching its expiry date:</p>
        <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #ff9800; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #e65100;">{{procedureName}}</h3>
          <p style="margin: 5px 0; color: #666;"><strong>Owner:</strong> {{ownerName}}</p>
          <p style="margin: 5px 0; color: #666;"><strong>Expiry Date:</strong> {{expiryDate}}</p>
          <p style="margin: 5px 0; color: #666;"><strong>Days Remaining:</strong> {{daysLeft}}</p>
          <p style="margin: 5px 0; color: #666;"><strong>Line of Business:</strong> {{lob}}</p>
        </div>
      `),
      'procedure-expired': baseTemplate('Urgent Action Required', '#f44336', `
        <h2 style="color: #c62828; margin-top: 0;">🚨 Procedure Expired</h2>
        <p style="color: #666; line-height: 1.6;">The following procedure has expired and requires immediate attention:</p>
        <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #f44336; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #c62828;">{{procedureName}}</h3>
          <p style="margin: 5px 0; color: #666;"><strong>Owner:</strong> {{ownerName}}</p>
          <p style="margin: 5px 0; color: #666;"><strong>Expired Date:</strong> {{expiredDate}}</p>
          <p style="margin: 5px 0; color: #666;"><strong>Days Overdue:</strong> {{daysOverdue}}</p>
          <p style="margin: 5px 0; color: #666;"><strong>Line of Business:</strong> {{lob}}</p>
        </div>
      `),
      'low-quality-score': baseTemplate('Quality Alert', '#2196f3', `
        <h2 style="color: #1565c0; margin-top: 0;">📊 Low Quality Score Alert</h2>
        <p style="color: #666; line-height: 1.6;">The following procedure has received a low quality score:</p>
        <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #2196f3; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #1565c0;">{{procedureName}}</h3>
          <p style="margin: 5px 0; color: #666;"><strong>Owner:</strong> {{ownerName}}</p>
          <p style="margin: 5px 0; color: #666;"><strong>Quality Score:</strong> {{qualityScore}}%</p>
          <p style="margin: 5px 0; color: #666;"><strong>Line of Business:</strong> {{lob}}</p>
          <p style="margin: 5px 0; color: #666;"><strong>Recommendations:</strong> {{recommendations}}</p>
        </div>
      `),
      'system-maintenance': baseTemplate('System Maintenance', '#9c27b0', `
        <h2 style="color: #7b1fa2; margin-top: 0;">🔧 System Maintenance Scheduled</h2>
        <p style="color: #666; line-height: 1.6;">The HSBC Procedures Hub will undergo scheduled maintenance:</p>
        <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #9c27b0; margin: 20px 0;">
          <p style="margin: 5px 0; color: #666;"><strong>Maintenance Date:</strong> {{maintenanceDate}}</p>
          <p style="margin: 5px 0; color: #666;"><strong>Duration:</strong> {{duration}}</p>
          <p style="margin: 5px 0; color: #666;"><strong>Affected Systems:</strong> {{affectedSystems}}</p>
          <p style="margin: 5px 0; color: #666;"><strong>Contact:</strong> {{contactInfo}}</p>
        </div>
      `),
      'broadcast-announcement': baseTemplate('Important Announcement', '#4caf50', `
        <h2 style="color: #388e3c; margin-top: 0;">📢 Important Announcement</h2>
        <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #4caf50; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #388e3c;">{{announcementTitle}}</h3>
          <p style="margin: 10px 0; color: #666; line-height: 1.6;">{{announcementBody}}</p>
          <p style="margin: 5px 0; color: #666;"><strong>Effective Date:</strong> {{effectiveDate}}</p>
          <p style="margin: 5px 0; color: #666;"><strong>Contact:</strong> {{contactInfo}}</p>
        </div>
      `)
    };
    return contents[type] || '<p>Default notification content</p>';
  };

  const getDefaultTextContent = (type) => {
    const contents = {
      'new-procedure-uploaded': 'New procedure uploaded: {{procedureName}} by {{ownerName}} on {{uploadDate}}. Quality Score: {{qualityScore}}%',
      'procedure-expiring': 'Procedure {{procedureName}} expires on {{expiryDate}} ({{daysLeft}} days remaining). Owner: {{ownerName}}',
      'procedure-expired': 'URGENT: Procedure {{procedureName}} expired on {{expiredDate}} ({{daysOverdue}} days overdue). Owner: {{ownerName}}',
      'low-quality-score': 'Quality Alert: Procedure {{procedureName}} has a low quality score of {{qualityScore}}%. Recommendations: {{recommendations}}',
      'system-maintenance': 'System maintenance scheduled for {{maintenanceDate}}. Duration: {{duration}}. Affected: {{affectedSystems}}',
      'broadcast-announcement': 'Announcement: {{announcementTitle}}. {{announcementBody}}. Effective: {{effectiveDate}}'
    };
    return contents[type] || 'Default notification text';
  };

  const handleEditTemplate = async (templateType) => {
    try {
      console.log('✏️ Editing template:', templateType);

      const template = await emailService.getEmailTemplate(templateType);
      
      setCurrentTemplate(template);
      setTemplateForm({
        type: template.type,
        name: template.name,
        subject: template.subject,
        htmlContent: template.htmlContent,
        textContent: template.textContent,
        isActive: template.isActive
      });
      setEditDialog(true);
      
    } catch (error) {
      console.error('❌ Error loading template for edit:', error);
      setMessage({ type: 'error', text: 'Failed to load template: ' + error.message });
    }
  };

  const handleSaveTemplate = async () => {
    try {
      setSaving(true);
      setMessage(null);

      console.log('💾 Saving template to SharePoint:', templateForm.type);
      
      const templateToSave = {
        ...templateForm,
        id: currentTemplate?.id || null
      };
      
      const result = await emailService.saveEmailTemplate(templateToSave);
      
      if (result.success) {
        console.log('✅ Template saved successfully to SharePoint');
        setMessage({ type: 'success', text: 'Template saved successfully to SharePoint' });
        setEditDialog(false);
        
        // Reload templates
        await loadEmailTemplates();
      } else {
        console.error('❌ Failed to save template:', result.message);
        setMessage({ type: 'error', text: 'Failed to save template: ' + result.message });
      }
      
    } catch (error) {
      console.error('❌ Error saving template:', error);
      setMessage({ type: 'error', text: 'Error saving template: ' + error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleTemplate = async (templateType, isActive) => {
    try {
      console.log('🔄 Toggling template:', templateType, isActive);

      const template = await emailService.getEmailTemplate(templateType);
      
      const updatedTemplate = {
        ...template,
        isActive: isActive
      };
      
      const result = await emailService.saveEmailTemplate(updatedTemplate);
      
      if (result.success) {
        setTemplates(prev => prev.map(t => 
          t.type === templateType ? { ...t, isActive: isActive } : t
        ));
        setMessage({ 
          type: 'success', 
          text: `Template ${isActive ? 'enabled' : 'disabled'} successfully` 
        });
      } else {
        setMessage({ type: 'error', text: 'Failed to update template status' });
      }
      
    } catch (error) {
      console.error('❌ Error toggling template:', error);
      setMessage({ type: 'error', text: 'Error updating template: ' + error.message });
    }
  };

  const handlePreviewTemplate = (template) => {
    setCurrentTemplate(template);
    setPreviewDialog(true);
  };

  const insertVariable = (variable) => {
    const textarea = document.getElementById('htmlContent');
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = templateForm.htmlContent;
      const before = text.substring(0, start);
      const after = text.substring(end, text.length);

      setTemplateForm(prev => ({
        ...prev,
        htmlContent: before + variable + after
      }));
      
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + variable.length;
        textarea.focus();
      }, 0);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading notification settings from SharePoint...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            🔔 Notification Settings
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configure email templates and notification preferences for different events
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={loadEmailTemplates}
          disabled={loading}
        >
          Refresh Templates
        </Button>
      </Box>

      {/* Status Message */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Alert 
            severity={message.type} 
            sx={{ mb: 3 }}
            onClose={() => setMessage(null)}
          >
            {message.text}
          </Alert>
        </motion.div>
      )}

      {/* Template Cards */}
      <Grid container spacing={3}>
        {templates.map((template) => (
          <Grid item xs={12} md={6} key={template.type}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card sx={{ 
                height: '100%',
                border: template.isActive ? `2px solid ${
                  template.color === 'primary' ? '#1976d2' : 
                  template.color === 'warning' ? '#ff9800' : 
                  template.color === 'error' ? '#f44336' : 
                  template.color === 'info' ? '#2196f3' :
                  template.color === 'secondary' ? '#9c27b0' :
                  template.color === 'success' ? '#4caf50' : '#1976d2'
                }` : '2px solid #e0e0e0',
                opacity: template.isActive ? 1 : 0.7
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <span style={{ fontSize: '1.5rem' }}>{template.icon}</span>
                        {template.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {template.description}
                      </Typography>
                      <Chip 
                        label={template.type}
                        size="small"
                        color={template.color}
                        variant="outlined"
                        sx={{ mb: 2 }}
                      />
                    </Box>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={template.isActive}
                          onChange={(e) => handleToggleTemplate(template.type, e.target.checked)}
                          color="primary"
                        />
                      }
                      label=""
                      sx={{ ml: 1 }}
                    />
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" fontWeight="bold" gutterBottom>
                      Subject:
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ 
                      fontStyle: 'italic',
                      bgcolor: 'grey.50',
                      p: 1,
                      borderRadius: 1,
                      fontSize: '0.8rem'
                    }}>
                      {template.subject || 'No subject configured'}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" fontWeight="bold" gutterBottom>
                      Status:
                    </Typography>
                    <Chip 
                      label={template.isActive ? 'Active' : 'Disabled'}
                      size="small"
                      color={template.isActive ? 'success' : 'default'}
                      icon={template.isActive ? <CheckCircle /> : <Warning />}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
                    <Button
                      variant="outlined"
                      startIcon={<Preview />}
                      onClick={() => handlePreviewTemplate(template)}
                      size="small"
                      sx={{ flex: 1 }}
                    >
                      Preview
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Edit />}
                      onClick={() => handleEditTemplate(template.type)}
                      size="small"
                      sx={{ flex: 1 }}
                    >
                      Edit
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Summary Statistics */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            📊 Notification Summary
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.main', color: 'white', borderRadius: 2 }}>
                <Typography variant="h4" fontWeight="bold">
                  {templates.filter(t => t.isActive).length}
                </Typography>
                <Typography variant="body2">
                  Active Templates
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'warning.main', color: 'white', borderRadius: 2 }}>
                <Typography variant="h4" fontWeight="bold">
                  {templates.filter(t => !t.isActive).length}
                </Typography>
                <Typography variant="body2">
                  Disabled Templates
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'primary.main', color: 'white', borderRadius: 2 }}>
                <Typography variant="h4" fontWeight="bold">
                  {templates.length}
                </Typography>
                <Typography variant="body2">
                  Total Templates
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'info.main', color: 'white', borderRadius: 2 }}>
                <Typography variant="h4" fontWeight="bold">
                  {templates.filter(t => t.id !== null).length}
                </Typography>
                <Typography variant="body2">
                  Customized Templates
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Edit Template Dialog */}
      <Dialog 
        open={editDialog} 
        onClose={() => setEditDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Email color="primary" />
            Edit Email Template: {templateForm.name}
          </Box>
        </DialogTitle>
<DialogContent>
         <Grid container spacing={3}>
           {/* Template Form */}
           <Grid item xs={12} md={8}>
             <Box sx={{ mb: 3 }}>
               <TextField
                 fullWidth
                 label="Template Name"
                 value={templateForm.name}
                 onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                 sx={{ mb: 2 }}
                 disabled
                 helperText="Template name is auto-generated based on type"
               />
               
               <TextField
                 fullWidth
                 label="Email Subject"
                 value={templateForm.subject}
                 onChange={(e) => setTemplateForm(prev => ({ ...prev, subject: e.target.value }))}
                 sx={{ mb: 2 }}
                 helperText="Use variables like {{procedureName}} for dynamic content"
                 required
               />
               
               <TextField
                 fullWidth
                 multiline
                 rows={12}
                 label="HTML Content"
                 value={templateForm.htmlContent}
                 onChange={(e) => setTemplateForm(prev => ({ ...prev, htmlContent: e.target.value }))}
                 id="htmlContent"
                 sx={{ mb: 2 }}
                 helperText="HTML content for rich email formatting"
                 required
               />
               
               <TextField
                 fullWidth
                 multiline
                 rows={4}
                 label="Text Content (Fallback)"
                 value={templateForm.textContent}
                 onChange={(e) => setTemplateForm(prev => ({ ...prev, textContent: e.target.value }))}
                 helperText="Plain text version for email clients that don't support HTML"
               />
               
               <FormControlLabel
                 control={
                   <Switch
                     checked={templateForm.isActive}
                     onChange={(e) => setTemplateForm(prev => ({ ...prev, isActive: e.target.checked }))}
                   />
                 }
                 label="Template is active"
                 sx={{ mt: 2 }}
               />
             </Box>
           </Grid>
           
           {/* Template Variables Helper */}
           <Grid item xs={12} md={4}>
             <Card variant="outlined">
               <CardContent>
                 <Typography variant="h6" gutterBottom>
                   📝 Available Variables
                 </Typography>
                 <Typography variant="body2" color="text.secondary" gutterBottom>
                   Click to insert into template:
                 </Typography>
                 
                 <Box sx={{ mt: 2 }}>
                   {templateVariables[templateForm.type]?.map((variable) => (
                     <Chip
                       key={variable}
                       label={variable}
                       size="small"
                       onClick={() => insertVariable(variable)}
                       sx={{ 
                         m: 0.5, 
                         cursor: 'pointer',
                         '&:hover': { bgcolor: 'primary.light', color: 'white' }
                       }}
                       variant="outlined"
                     />
                   ))}
                 </Box>
                 
                 <Divider sx={{ my: 2 }} />
                 
                 <Typography variant="body2" fontWeight="bold" gutterBottom>
                   Template Preview:
                 </Typography>
                 <Box sx={{ 
                   maxHeight: 200, 
                   overflow: 'auto', 
                   border: '1px solid #e0e0e0', 
                   p: 1,
                   borderRadius: 1,
                   bgcolor: 'grey.50',
                   fontSize: '0.75rem'
                 }}>
                   <div dangerouslySetInnerHTML={{ 
                     __html: templateForm.htmlContent.substring(0, 500) + (templateForm.htmlContent.length > 500 ? '...' : '')
                   }} />
                 </Box>

                 <Divider sx={{ my: 2 }} />
                 
                 <Typography variant="body2" fontWeight="bold" gutterBottom>
                   💡 Template Tips:
                 </Typography>
                 <List dense>
                   <ListItem sx={{ px: 0, py: 0.5 }}>
                     <ListItemText 
                       primary="Use HSBC colors"
                       secondary="#d40000 for primary branding"
                       primaryTypographyProps={{ fontSize: '0.8rem' }}
                       secondaryTypographyProps={{ fontSize: '0.7rem' }}
                     />
                   </ListItem>
                   <ListItem sx={{ px: 0, py: 0.5 }}>
                     <ListItemText 
                       primary="Keep it responsive"
                       secondary="max-width: 600px for email clients"
                       primaryTypographyProps={{ fontSize: '0.8rem' }}
                       secondaryTypographyProps={{ fontSize: '0.7rem' }}
                     />
                   </ListItem>
                   <ListItem sx={{ px: 0, py: 0.5 }}>
                     <ListItemText 
                       primary="Test thoroughly"
                       secondary="Preview in different email clients"
                       primaryTypographyProps={{ fontSize: '0.8rem' }}
                       secondaryTypographyProps={{ fontSize: '0.7rem' }}
                     />
                   </ListItem>
                 </List>
               </CardContent>
             </Card>
           </Grid>
         </Grid>
       </DialogContent>
       
       <DialogActions>
         <Button 
           onClick={() => setEditDialog(false)}
           startIcon={<Cancel />}
         >
           Cancel
         </Button>
         <Button 
           onClick={handleSaveTemplate}
           variant="contained"
           startIcon={saving ? <CircularProgress size={20} /> : <Save />}
           disabled={saving || !templateForm.subject || !templateForm.htmlContent}
         >
           {saving ? 'Saving to SharePoint...' : 'Save Template'}
         </Button>
       </DialogActions>
     </Dialog>

     {/* Preview Dialog */}
     <Dialog 
       open={previewDialog} 
       onClose={() => setPreviewDialog(false)}
       maxWidth="md"
       fullWidth
     >
       <DialogTitle>
         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
           <Preview color="primary" />
           Template Preview: {currentTemplate?.name}
           <Chip 
             label={currentTemplate?.isActive ? 'Active' : 'Disabled'}
             size="small"
             color={currentTemplate?.isActive ? 'success' : 'default'}
             sx={{ ml: 1 }}
           />
         </Box>
       </DialogTitle>
       
       <DialogContent>
         <Box sx={{ mb: 2 }}>
           <Typography variant="body1" fontWeight="bold">
             Subject: {currentTemplate?.subject}
           </Typography>
           <Typography variant="body2" color="text.secondary">
             Type: {currentTemplate?.type} | Template ID: {currentTemplate?.id || 'New'}
           </Typography>
         </Box>
         
         <Divider sx={{ my: 2 }} />
         
         <Box sx={{ 
           border: '1px solid #e0e0e0', 
           borderRadius: 1,
           overflow: 'hidden',
           mb: 2
         }}>
           <div dangerouslySetInnerHTML={{ __html: currentTemplate?.htmlContent }} />
         </Box>
         
         <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
           <Typography variant="body2" fontWeight="bold" gutterBottom>
             Plain Text Version:
           </Typography>
           <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
             {currentTemplate?.textContent || 'No plain text version available'}
           </Typography>
         </Box>

         {/* Template Variables for this type */}
         {currentTemplate?.type && templateVariables[currentTemplate.type] && (
           <Box sx={{ mt: 2 }}>
             <Typography variant="body2" fontWeight="bold" gutterBottom>
               Available Variables for {currentTemplate.name}:
             </Typography>
             <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
               {templateVariables[currentTemplate.type].map((variable) => (
                 <Chip
                   key={variable}
                   label={variable}
                   size="small"
                   variant="outlined"
                   color="primary"
                 />
               ))}
             </Box>
           </Box>
         )}
       </DialogContent>
       
       <DialogActions>
         <Button onClick={() => setPreviewDialog(false)}>
           Close
         </Button>
         <Button 
           variant="outlined"
           startIcon={<Edit />}
           onClick={() => {
             setPreviewDialog(false);
             handleEditTemplate(currentTemplate.type);
           }}
         >
           Edit Template
         </Button>
       </DialogActions>
     </Dialog>
   </Box>
 );
};

export default NotificationSettings;
