// components/email/NotificationSettings.js - Enhanced with System Maintenance Templates
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Grid,
  Switch, FormControlLabel, Alert, Chip, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, MenuItem, FormControl, InputLabel,
  CircularProgress, List, ListItem, ListItemText, ListItemSecondaryAction,
  Accordion, AccordionSummary, AccordionDetails, Tabs, Tab, Paper
} from '@mui/material';
import {
  Settings, Edit, Save, Cancel, ExpandMore, Email,
  Notifications, Description, Preview, Refresh, Add,
  CheckCircle, Warning, Info, Build, Announcement
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import EmailService from '../../services/EmailService';

const NotificationSettings = () => {
  // State management
  const [activeTab, setActiveTab] = useState(0);
  const [templates, setTemplates] = useState([]);
  const [systemTemplates, setSystemTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [editDialog, setEditDialog] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [templateForm, setTemplateForm] = useState({
    type: '',
    name: '',
    subject: '',
    htmlContent: '',
    textContent: '',
    isActive: true
  });

  // Enhanced template types with system maintenance
  const templateTypes = [
    {
      type: 'new-procedure-uploaded',
      name: 'New Procedure Uploaded',
      description: 'Sent when a new procedure is uploaded to the system',
      icon: '📤',
      color: 'primary',
      category: 'procedure'
    },
    {
      type: 'procedure-expiring',
      name: 'Procedure Expiring Soon',
      description: 'Sent when a procedure is approaching its expiry date',
      icon: '⏰',
      color: 'warning',
      category: 'procedure'
    },
    {
      type: 'procedure-expired',
      name: 'Procedure Expired',
      description: 'Sent when a procedure has expired',
      icon: '🚨',
      color: 'error',
      category: 'procedure'
    },
    {
      type: 'low-quality-score',
      name: 'Low Quality Score Alert',
      description: 'Sent when a procedure has a low quality score',
      icon: '📊',
      color: 'info',
      category: 'procedure'
    },
    {
      type: 'system-maintenance',
      name: 'System Maintenance',
      description: 'Notifications for scheduled and emergency maintenance',
      icon: '🔧',
      color: 'secondary',
      category: 'system'
    },
    {
      type: 'broadcast-announcement',
      name: 'Broadcast Announcement',
      description: 'General announcements and communications',
      icon: '📢',
      color: 'success',
      category: 'system'
    }
  ];

  // Available template variables for each type
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
      '{{maintenanceDate}}', '{{startTime}}', '{{endTime}}', '{{duration}}', '{{impact}}', '{{emergencyReason}}', '{{expectedDuration}}'
    ],
    'broadcast-announcement': [
      '{{announcementTitle}}', '{{announcementDate}}', '{{senderName}}', '{{priority}}', '{{actionRequired}}'
    ]
  };

  // Initialize email service
  const [emailService] = useState(() => new EmailService());

  useEffect(() => {
    loadEmailTemplates();
    loadSystemMaintenanceTemplates();
  }, []);

  const loadEmailTemplates = async () => {
    try {
      setLoading(true);
      setMessage(null);

      console.log('📧 Loading email templates...');
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

  const loadSystemMaintenanceTemplates = async () => {
    try {
      console.log('🔧 Loading system maintenance templates...');
      const maintenanceTemplates = emailService.getSystemMaintenanceTemplates();
      setSystemTemplates(maintenanceTemplates);
      console.log('✅ System maintenance templates loaded:', maintenanceTemplates.length);
    } catch (error) {
      console.error('❌ Error loading system maintenance templates:', error);
    }
  };

  const getDefaultSubject = (type) => {
    const subjects = {
      'new-procedure-uploaded': 'New Procedure Uploaded: {{procedureName}}',
      'procedure-expiring': 'Procedure Expiring Soon: {{procedureName}}',
      'procedure-expired': 'Procedure Expired: {{procedureName}}',
      'low-quality-score': 'Low Quality Score Alert: {{procedureName}}',
      'system-maintenance': 'HSBC Procedures Hub - System Maintenance: {{maintenanceDate}}',
      'broadcast-announcement': 'HSBC Procedures Hub - {{announcementTitle}}'
    };
    return subjects[type] || 'HSBC Procedures Hub Notification';
  };

  const getDefaultHtmlContent = (type) => {
    const contents = {
      'system-maintenance': `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #ff9800, #f57c00); padding: 20px; color: white;">
            <h1 style="margin: 0; font-size: 24px;">HSBC Procedures Hub</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">System Maintenance Notice</p>
          </div>
          <div style="padding: 30px; background: #fff3e0;">
            <h2 style="color: #e65100; margin-top: 0;">🔧 System Maintenance</h2>
            <p style="color: #666; line-height: 1.6;">
              The HSBC Procedures Hub will undergo maintenance during the following time:
            </p>
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #ff9800; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #e65100;">Maintenance Details</h3>
              <p style="margin: 5px 0; color: #666;"><strong>Date:</strong> {{maintenanceDate}}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Start Time:</strong> {{startTime}}</p>
              <p style="margin: 5px 0; color: #666;"><strong>End Time:</strong> {{endTime}}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Duration:</strong> {{duration}}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Impact:</strong> {{impact}}</p>
            </div>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              We apologize for any inconvenience. The system will be back online after the maintenance window.
            </p>
          </div>
        </div>
      `,
      'broadcast-announcement': `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #4caf50, #388e3c); padding: 20px; color: white;">
            <h1 style="margin: 0; font-size: 24px;">HSBC Procedures Hub</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Important Announcement</p>
          </div>
          <div style="padding: 30px; background: #f9f9f9;">
            <h2 style="color: #333; margin-top: 0;">📢 {{announcementTitle}}</h2>
            <p style="color: #666; line-height: 1.6;">
              We have an important announcement regarding the HSBC Procedures Hub:
            </p>
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #4caf50; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #388e3c;">Announcement Details</h3>
              <p style="margin: 5px 0; color: #666;"><strong>Date:</strong> {{announcementDate}}</p>
              <p style="margin: 5px 0; color: #666;"><strong>From:</strong> {{senderName}}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Priority:</strong> {{priority}}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Action Required:</strong> {{actionRequired}}</p>
            </div>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              Thank you for your attention to this announcement.
            </p>
          </div>
        </div>
      `
    };
    
    // Return existing content for other types or default for new ones
    return contents[type] || this.getExistingDefaultContent(type);
  };

  const getExistingDefaultContent = (type) => {
    // Keep existing content for procedure-related templates
    const existingContents = {
      'new-procedure-uploaded': `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"> <div style="background: linear-gradient(135deg, #d40000, #b30000); padding: 20px; color: white;"> <h1 style="margin: 0; font-size: 24px;">HSBC Procedures Hub</h1> <p style="margin: 5px 0 0 0; opacity: 0.9;">New Procedure Notification</p> </div> <div style="padding: 30px; background: #f9f9f9;"> <h2 style="color: #333; margin-top: 0;">📤 New Procedure Uploaded</h2> <p style="color: #666; line-height: 1.6;"> A new procedure has been uploaded to the HSBC Procedures Hub: </p> <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #d40000; margin: 20px 0;"> <h3 style="margin: 0 0 10px 0; color: #d40000;">{{procedureName}}</h3> <p style="margin: 5px 0; color: #666;"><strong>Owner:</strong> {{ownerName}}</p> <p style="margin: 5px 0; color: #666;"><strong>Upload Date:</strong> {{uploadDate}}</p> <p style="margin: 5px 0; color: #666;"><strong>Quality Score:</strong> {{qualityScore}}%</p> <p style="margin: 5px 0; color: #666;"><strong>Line of Business:</strong> {{lob}}</p> </div> <p style="color: #666; font-size: 14px; margin-top: 30px;"> This email was sent automatically by the HSBC Procedures Hub system. </p> </div> </div>`
    };
    
    return existingContents[type] || '<p>Default notification content</p>';
  };

  const getDefaultTextContent = (type) => {
    const contents = {
      'new-procedure-uploaded': 'New procedure uploaded: {{procedureName}} by {{ownerName}} on {{uploadDate}}. Quality Score: {{qualityScore}}%',
      'procedure-expiring': 'Procedure {{procedureName}} expires on {{expiryDate}} ({{daysLeft}} days remaining). Owner: {{ownerName}}',
      'procedure-expired': 'Procedure {{procedureName}} expired on {{expiredDate}} ({{daysOverdue}} days overdue). Owner: {{ownerName}}',
      'low-quality-score': 'Procedure {{procedureName}} has a low quality score of {{qualityScore}}%. Recommendations: {{recommendations}}',
      'system-maintenance': 'HSBC Procedures Hub maintenance scheduled for {{maintenanceDate}} from {{startTime}} to {{endTime}}. {{impact}}',
      'broadcast-announcement': 'HSBC Procedures Hub Announcement: {{announcementTitle}} on {{announcementDate}}. {{actionRequired}}'
    };
    return contents[type] || 'Default notification text';
  };

  const handleEditTemplate = async (templateType) => {
    try {
      console.log('✏️ Editing template:', templateType);

      // Get the specific template from SharePoint
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

      console.log('💾 Saving template:', templateForm.type);
      
      const templateToSave = {
        ...templateForm,
        id: currentTemplate?.id || null
      };
      
      const result = await emailService.saveEmailTemplate(templateToSave);
      
      if (result.success) {
        console.log('✅ Template saved successfully');
        setMessage({ type: 'success', text: 'Template saved successfully' });
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

      // Get current template
      const template = await emailService.getEmailTemplate(templateType);
      
      // Update active status
      const updatedTemplate = {
        ...template,
        isActive: isActive
      };
      
      const result = await emailService.saveEmailTemplate(updatedTemplate);
      
      if (result.success) {
        // Update local state
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
      
      // Set cursor position after insertion
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + variable.length;
        textarea.focus();
      }, 0);
    }
  };

  const getCategoryTemplates = (category) => {
    return templates.filter(t => t.category === category);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading notification settings...
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
            Configure email templates for procedures, system maintenance, and announcements
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

      {/* Navigation Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab 
            label="Procedure Templates" 
            icon={<Description />}
            iconPosition="start"
          />
          <Tab 
            label="System Templates" 
            icon={<Build />}
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      {/* Tab 0: Procedure Templates */}
      {activeTab === 0 && (
        <Box>
          <Grid container spacing={3}>
            {getCategoryTemplates('procedure').map((template) => (
              <Grid item xs={12} md={6} key={template.type}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card sx={{ 
                    height: '100%',
                    border: template.isActive ? `2px solid ${template.color === 'primary' ? '#1976d2' : template.color === 'warning' ? '#ff9800' : template.color === 'error' ? '#f44336' : '#2196f3'}` : '2px solid #e0e0e0',
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
                         icon={template.isActive ? <CheckCircle /> : <Cancel />}
                       />
                     </Box>

                     <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
                       <Button
                         variant="outlined"
                         startIcon={<Edit />}
                         onClick={() => handleEditTemplate(template.type)}
                         size="small"
                         fullWidth
                       >
                         Edit Template
                       </Button>
                     </Box>
                   </CardContent>
                 </Card>
               </motion.div>
             </Grid>
           ))}
         </Grid>
       </Box>
     )}

     {/* Tab 1: System Templates */}
     {activeTab === 1 && (
       <Box>
         <Alert severity="info" sx={{ mb: 3 }}>
           <Typography variant="body2">
             <strong>System Templates:</strong> These templates are used for system maintenance notifications and broadcast announcements. 
             Customize them to match your organization's communication standards.
           </Typography>
         </Alert>

         <Grid container spacing={3}>
           {getCategoryTemplates('system').map((template) => (
             <Grid item xs={12} md={6} key={template.type}>
               <motion.div
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ duration: 0.3 }}
               >
                 <Card sx={{ 
                   height: '100%',
                   border: template.isActive ? `2px solid ${template.color === 'secondary' ? '#9c27b0' : '#4caf50'}` : '2px solid #e0e0e0',
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
                           label={template.category === 'system' ? 'System Template' : 'Procedure Template'}
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
                         Available Variables:
                       </Typography>
                       <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                         {templateVariables[template.type]?.slice(0, 3).map((variable) => (
                           <Chip
                             key={variable}
                             label={variable}
                             size="small"
                             variant="outlined"
                             sx={{ fontSize: '0.6rem', height: 20 }}
                           />
                         ))}
                         {templateVariables[template.type]?.length > 3 && (
                           <Chip
                             label={`+${templateVariables[template.type].length - 3} more`}
                             size="small"
                             variant="outlined"
                             sx={{ fontSize: '0.6rem', height: 20 }}
                           />
                         )}
                       </Box>
                     </Box>

                     <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
                       <Button
                         variant="outlined"
                         startIcon={<Edit />}
                         onClick={() => handleEditTemplate(template.type)}
                         size="small"
                         fullWidth
                       >
                         Edit Template
                       </Button>
                     </Box>
                   </CardContent>
                 </Card>
               </motion.div>
             </Grid>
           ))}
         </Grid>

         {/* System Maintenance Quick Templates */}
         <Card sx={{ mt: 4 }}>
           <CardContent>
             <Typography variant="h6" gutterBottom>
               🔧 System Maintenance Quick Templates
             </Typography>
             <Typography variant="body2" color="text.secondary" gutterBottom>
               Pre-configured templates for common maintenance scenarios
             </Typography>

             <Grid container spacing={2} sx={{ mt: 2 }}>
               {systemTemplates.map((template, index) => (
                 <Grid item xs={12} md={6} key={template.id}>
                   <Card variant="outlined" sx={{ 
                     cursor: 'pointer',
                     '&:hover': { bgcolor: 'grey.50' }
                   }}
                   onClick={() => {
                     setTemplateForm({
                       type: 'system-maintenance',
                       name: template.name,
                       subject: template.subject,
                       htmlContent: template.htmlContent,
                       textContent: template.textContent,
                       isActive: true
                     });
                     setCurrentTemplate(null);
                     setEditDialog(true);
                   }}>
                     <CardContent sx={{ p: 2 }}>
                       <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                         {template.name}
                       </Typography>
                       <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                         {template.subject}
                       </Typography>
                       <Chip 
                         label="Use Template"
                         size="small"
                         color="secondary"
                         sx={{ mt: 1 }}
                       />
                     </CardContent>
                   </Card>
                 </Grid>
               ))}
             </Grid>
           </CardContent>
         </Card>
       </Box>
     )}

     {/* Summary Statistics */}
     <Card sx={{ mt: 3 }}>
       <CardContent>
         <Typography variant="h6" gutterBottom>
           📊 Template Summary
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
                 {getCategoryTemplates('procedure').length}
               </Typography>
               <Typography variant="body2">
                 Procedure Templates
               </Typography>
             </Box>
           </Grid>
           <Grid item xs={6} sm={3}>
             <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'secondary.main', color: 'white', borderRadius: 2 }}>
               <Typography variant="h4" fontWeight="bold">
                 {getCategoryTemplates('system').length}
               </Typography>
               <Typography variant="body2">
                 System Templates
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
           <Description color="primary" />
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
               />
               
               <TextField
                 fullWidth
                 label="Email Subject"
                 value={templateForm.subject}
                 onChange={(e) => setTemplateForm(prev => ({ ...prev, subject: e.target.value }))}
                 sx={{ mb: 2 }}
                 helperText="Use variables like {{procedureName}} for dynamic content"
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

                 {/* Template Category Info */}
                 {templateForm.type && (
                   <Box sx={{ mt: 2 }}>
                     <Typography variant="body2" fontWeight="bold" gutterBottom>
                       Template Category:
                     </Typography>
                     <Chip 
                       label={templateTypes.find(t => t.type === templateForm.type)?.category === 'system' ? 'System Template' : 'Procedure Template'}
                       size="small"
                       color={templateTypes.find(t => t.type === templateForm.type)?.category === 'system' ? 'secondary' : 'primary'}
                     />
                   </Box>
                 )}
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
           {saving ? 'Saving...' : 'Save Template'}
         </Button>
       </DialogActions>
     </Dialog>
   </Box>
 );
};

export default NotificationSettings;
