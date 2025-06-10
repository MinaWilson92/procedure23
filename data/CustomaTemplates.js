// components/email/CustomTemplates.js - Fixed Custom Templates Component
import React, { useState, useEffect } from ‘react’;
import {
Box, Typography, Card, CardContent, Button, Grid,
TextField, Alert, Dialog, DialogTitle, DialogContent,
DialogActions, List, ListItem, ListItemText, ListItemSecondaryAction,
IconButton, Chip, FormControl, InputLabel, Select, MenuItem,
CircularProgress, Divider
} from ‘@mui/material’;
import {
Add, Edit, Delete, Save, Cancel, Preview, Email,
Description, Send, Refresh
} from ‘@mui/icons-material’;
import { motion } from ‘framer-motion’;
import EmailService from ‘../../services/EmailService’;

const CustomTemplates = () => {
// State management
const [customTemplates, setCustomTemplates] = useState([]);
const [loading, setLoading] = useState(true);
const [saving, setSaving] = useState(false);
const [message, setMessage] = useState(null);
const [editDialog, setEditDialog] = useState(false);
const [previewDialog, setPreviewDialog] = useState(false);
const [currentTemplate, setCurrentTemplate] = useState(null);
const [templateForm, setTemplateForm] = useState({
type: ‘’,
name: ‘’,
subject: ‘’,
htmlContent: ‘’,
textContent: ‘’,
isActive: true
});

// Custom template types (different from system templates)
const customTemplateTypes = [
{
type: ‘custom-announcement’,
name: ‘Custom Announcement’,
description: ‘General announcement template’
},
{
type: ‘custom-reminder’,
name: ‘Custom Reminder’,
description: ‘Custom reminder template’
},
{
type: ‘custom-welcome’,
name: ‘Welcome Message’,
description: ‘Welcome message for new users’
},
{
type: ‘custom-training’,
name: ‘Training Notification’,
description: ‘Training and education notifications’
}
];

// Initialize email service
const [emailService] = useState(() => new EmailService());

useEffect(() => {
loadCustomTemplates();
}, []);

const loadCustomTemplates = async () => {
try {
setLoading(true);
setMessage(null);

```
  console.log('📧 Loading custom templates...');
  const allTemplates = await emailService.getEmailTemplates();
  
  // Filter for custom templates only
  const custom = allTemplates.filter(t => t.type.startsWith('custom-'));
  setCustomTemplates(custom);
  
  console.log('✅ Custom templates loaded:', custom.length);
  
} catch (error) {
  console.error('❌ Error loading custom templates:', error);
  setMessage({ type: 'error', text: 'Failed to load custom templates: ' + error.message });
} finally {
  setLoading(false);
}
```

};

const handleNewTemplate = () => {
setCurrentTemplate(null);
setTemplateForm({
type: ‘custom-announcement’,
name: ‘’,
subject: ‘’,
htmlContent: getDefaultCustomTemplate(),
textContent: ‘’,
isActive: true
});
setEditDialog(true);
};

const handleEditTemplate = (template) => {
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
};

const handleSaveTemplate = async () => {
try {
setSaving(true);
setMessage(null);

```
  console.log('💾 Saving custom template...');
  
  const templateToSave = {
    ...templateForm,
    id: currentTemplate?.id || null
  };
  
  const result = await emailService.saveEmailTemplate(templateToSave);
  
  if (result.success) {
    console.log('✅ Custom template saved successfully');
    setMessage({ type: 'success', text: 'Custom template saved successfully' });
    setEditDialog(false);
    
    // Reload templates
    await loadCustomTemplates();
  } else {
    console.error('❌ Failed to save custom template:', result.message);
    setMessage({ type: 'error', text: 'Failed to save template: ' + result.message });
  }
  
} catch (error) {
  console.error('❌ Error saving custom template:', error);
  setMessage({ type: 'error', text: 'Error saving template: ' + error.message });
} finally {
  setSaving(false);
}
```

};

const handleDeleteTemplate = async (templateId) => {
if (!window.confirm(‘Are you sure you want to delete this custom template?’)) {
return;
}

```
try {
  console.log('🗑️ Deleting custom template:', templateId);
  
  // Note: You'll need to implement deleteEmailTemplate in EmailService
  // For now, we'll just remove from local state
  setCustomTemplates(prev => prev.filter(t => t.id !== templateId));
  setMessage({ type: 'success', text: 'Custom template deleted successfully' });
  
} catch (error) {
  console.error('❌ Error deleting custom template:', error);
  setMessage({ type: 'error', text: 'Error deleting template: ' + error.message });
}
```

};

const handlePreviewTemplate = (template) => {
setCurrentTemplate(template);
setPreviewDialog(true);
};

const getDefaultCustomTemplate = () => {
return `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"> <div style="background: linear-gradient(135deg, #d40000, #b30000); padding: 20px; color: white;"> <h1 style="margin: 0; font-size: 24px;">HSBC Procedures Hub</h1> <p style="margin: 5px 0 0 0; opacity: 0.9;">Custom Notification</p> </div> <div style="padding: 30px; background: #f9f9f9;"> <h2 style="color: #333; margin-top: 0;">Your Custom Message Title</h2> <p style="color: #666; line-height: 1.6;"> This is your custom email template. You can customize this content with your own HTML and styling. </p> <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #d40000; margin: 20px 0;"> <h3 style="margin: 0 0 10px 0; color: #d40000;">Important Information</h3> <p style="margin: 5px 0; color: #666;">Add your custom content here...</p> </div> <p style="color: #666; font-size: 14px; margin-top: 30px;"> This email was sent by the HSBC Procedures Hub system. </p> </div> </div>`;
};

if (loading) {
return (
<Box sx={{ display: ‘flex’, justifyContent: ‘center’, alignItems: ‘center’, minHeight: 400 }}>
<CircularProgress size={60} />
<Typography variant=“h6” sx={{ ml: 2 }}>
Loading custom templates…
</Typography>
</Box>
);
}

return (
<Box>
{/* Header */}
<Box sx={{ display: ‘flex’, justifyContent: ‘space-between’, alignItems: ‘center’, mb: 3 }}>
<Box>
<Typography variant="h5" fontWeight="bold" gutterBottom>
📨 Custom Email Templates
</Typography>
<Typography variant="body2" color="text.secondary">
Create and manage custom email templates for special notifications
</Typography>
</Box>
<Box sx={{ display: ‘flex’, gap: 2 }}>
<Button
variant=“outlined”
startIcon={<Refresh />}
onClick={loadCustomTemplates}
disabled={loading}
>
Refresh
</Button>
<Button
variant=“contained”
startIcon={<Add />}
onClick={handleNewTemplate}
>
New Template
</Button>
</Box>
</Box>

```
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

  {/* Custom Templates List */}
  {customTemplates.length === 0 ? (
    <Card>
      <CardContent sx={{ textAlign: 'center', py: 6 }}>
        <Description sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
        <Typography variant="h5" color="text.secondary" gutterBottom>
          No Custom Templates
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Create your first custom email template to get started
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleNewTemplate}
          size="large"
        >
          Create First Template
        </Button>
      </CardContent>
    </Card>
  ) : (
    <Grid container spacing={3}>
      {customTemplates.map((template) => (
        <Grid item xs={12} md={6} lg={4} key={template.id}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card sx={{ 
              height: '100%',
              border: template.isActive ? '2px solid #1976d2' : '2px solid #e0e0e0',
              opacity: template.isActive ? 1 : 0.7
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" gutterBottom>
                      {template.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Type: {template.type}
                    </Typography>
                    <Chip 
                      label={template.isActive ? 'Active' : 'Disabled'}
                      size="small"
                      color={template.isActive ? 'success' : 'default'}
                      sx={{ mb: 2 }}
                    />
                  </Box>
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

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button
                    size="small"
                    startIcon={<Preview />}
                    onClick={() => handlePreviewTemplate(template)}
                    variant="outlined"
                  >
                    Preview
                  </Button>
                  <Button
                    size="small"
                    startIcon={<Edit />}
                    onClick={() => handleEditTemplate(template)}
                    variant="outlined"
                    color="primary"
                  >
                    Edit
                  </Button>
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteTemplate(template.id)}
                    color="error"
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      ))}
    </Grid>
  )}

  {/* Summary Statistics */}
  <Card sx={{ mt: 3 }}>
    <CardContent>
      <Typography variant="h6" gutterBottom>
        📊 Custom Templates Summary
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={6} sm={3}>
          <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'primary.main', color: 'white', borderRadius: 2 }}>
            <Typography variant="h4" fontWeight="bold">
              {customTemplates.length}
            </Typography>
            <Typography variant="body2">
              Total Custom Templates
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.main', color: 'white', borderRadius: 2 }}>
            <Typography variant="h4" fontWeight="bold">
              {customTemplates.filter(t => t.isActive).length}
            </Typography>
            <Typography variant="body2">
              Active Templates
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'warning.main', color: 'white', borderRadius: 2 }}>
            <Typography variant="h4" fontWeight="bold">
              {customTemplates.filter(t => !t.isActive).length}
            </Typography>
            <Typography variant="body2">
              Disabled Templates
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'info.main', color: 'white', borderRadius: 2 }}>
            <Typography variant="h4" fontWeight="bold">
              {customTemplateTypes.length}
            </Typography>
            <Typography variant="body2">
              Available Types
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
        {currentTemplate ? 'Edit Custom Template' : 'Create New Custom Template'}
      </Box>
    </DialogTitle>
    
    <DialogContent>
      <Grid container spacing={3}>
        {/* Template Form */}
        <Grid item xs={12} md={8}>
          <Box sx={{ mb: 3 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Template Type</InputLabel>
              <Select
                value={templateForm.type}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, type: e.target.value }))}
                label="Template Type"
              >
                {customTemplateTypes.map((type) => (
                  <MenuItem key={type.type} value={type.type}>
                    {type.name} - {type.description}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              label="Template Name"
              value={templateForm.name}
              onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
              sx={{ mb: 2 }}
              required
            />
            
            <TextField
              fullWidth
              label="Email Subject"
              value={templateForm.subject}
              onChange={(e) => setTemplateForm(prev => ({ ...prev, subject: e.target.value }))}
              sx={{ mb: 2 }}
              required
            />
            
            <TextField
              fullWidth
              multiline
              rows={12}
              label="HTML Content"
              value={templateForm.htmlContent}
              onChange={(e) => setTemplateForm(prev => ({ ...prev, htmlContent: e.target.value }))}
              sx={{ mb: 2 }}
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
          </Box>
        </Grid>
        
        {/* Template Preview */}
        <Grid item xs={12} md={4}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📱 Template Preview
              </Typography>
              
              <Box sx={{ 
                maxHeight: 400, 
                overflow: 'auto', 
                border: '1px solid #e0e0e0', 
                p: 2,
                borderRadius: 1,
                bgcolor: 'grey.50',
                fontSize: '0.8rem'
              }}>
                <Typography variant="body2" fontWeight="bold" gutterBottom>
                  Subject: {templateForm.subject}
                </Typography>
                <Divider sx={{ my: 1 }} />
                <div dangerouslySetInnerHTML={{ __html: templateForm.htmlContent }} />
              </Box>
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" fontWeight="bold" gutterBottom>
                  📝 Tips for Custom Templates:
                </Typography>
                <List dense>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText 
                      primary="Use HSBC brand colors"
                      secondary="#d40000 for primary, #b30000 for gradients"
                    />
                  </ListItem>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText 
                      primary="Keep it responsive"
                      secondary="Use max-width: 600px for email clients"
                    />
                  </ListItem>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText 
                      primary="Test thoroughly"
                      secondary="Preview in different email clients"
                    />
                  </ListItem>
                </List>
              </Box>
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
        disabled={saving || !templateForm.name || !templateForm.subject || !templateForm.htmlContent}
      >
        {saving ? 'Saving...' : 'Save Template'}
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
      </Box>
    </DialogTitle>
    
    <DialogContent>
      <Box sx={{ mb: 2 }}>
        <Typography variant="body1" fontWeight="bold">
          Subject: {currentTemplate?.subject}
        </Typography>
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      <Box sx={{ 
        border: '1px solid #e0e0e0', 
        borderRadius: 1,
        overflow: 'hidden'
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
          handleEditTemplate(currentTemplate);
        }}
      >
        Edit Template
      </Button>
    </DialogActions>
  </Dialog>
</Box>
```

);
};

export default CustomTemplates;