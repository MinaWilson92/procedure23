// components/email/ConfigureRecipients.js - Fixed Recipients Management
import React, { useState, useEffect } from ‘react’;
import {
Box, Typography, Card, CardContent, Button, Grid,
TextField, IconButton, Alert, Chip, Paper, Divider,
Switch, FormControlLabel, Dialog, DialogTitle, DialogContent,
DialogActions, List, ListItem, ListItemText, ListItemSecondaryAction,
Checkbox, CircularProgress, Accordion, AccordionSummary, AccordionDetails
} from ‘@mui/material’;
import {
Add, Delete, Email, Save, Refresh, PersonAdd,
ExpandMore, Group, AdminPanelSettings, Business,
CheckCircle, Cancel, Send
} from ‘@mui/icons-material’;
import { motion } from ‘framer-motion’;
import EmailService from ‘../../services/EmailService’;

const ConfigureRecipients = () => {
// State management
const [config, setConfig] = useState({
globalCCList: [],
adminList: [],
procedureOwnersList: [],
testEmail: ‘minaantoun@hsbc.com’
});

const [loading, setLoading] = useState(true);
const [saving, setSaving] = useState(false);
const [sendingTest, setSendingTest] = useState(false);
const [message, setMessage] = useState(null);
const [showAddDialog, setShowAddDialog] = useState(false);
const [dialogType, setDialogType] = useState(’’);
const [newEmail, setNewEmail] = useState({ email: ‘’, name: ‘’ });
const [availableOwners, setAvailableOwners] = useState([]);
const [selectedOwners, setSelectedOwners] = useState([]);
const [loadingOwners, setLoadingOwners] = useState(false);

// Initialize email service
const [emailService] = useState(() => new EmailService());

useEffect(() => {
loadEmailConfig();
}, []);

const loadEmailConfig = async () => {
try {
setLoading(true);
setMessage(null);

```
  console.log('🔄 Loading email configuration...');
  const emailConfig = await emailService.getEmailConfig();
  
  setConfig(emailConfig);
  console.log('✅ Email configuration loaded:', emailConfig);
  
} catch (error) {
  console.error('❌ Error loading email config:', error);
  setMessage({ type: 'error', text: 'Failed to load email configuration: ' + error.message });
} finally {
  setLoading(false);
}
```

};

const loadProcedureOwners = async () => {
try {
setLoadingOwners(true);
console.log(‘👥 Loading procedure owners…’);

```
  const owners = await emailService.getProcedureOwners();
  setAvailableOwners(owners);
  
  console.log('✅ Procedure owners loaded:', owners.length);
  setMessage({ type: 'success', text: `Loaded ${owners.length} procedure owners` });
  
} catch (error) {
  console.error('❌ Error loading procedure owners:', error);
  setMessage({ type: 'error', text: 'Failed to load procedure owners: ' + error.message });
} finally {
  setLoadingOwners(false);
}
```

};

const saveConfiguration = async () => {
try {
setSaving(true);
setMessage(null);

```
  console.log('💾 Saving email configuration...', config);
  
  // Validate configuration
  if (config.globalCCList.length === 0 && config.adminList.length === 0) {
    setMessage({ 
      type: 'warning', 
      text: 'Please add at least one email address to Global CC or Admin list' 
    });
    return;
  }

  const result = await emailService.saveEmailConfig(config);
  
  if (result.success) {
    console.log('✅ Email configuration saved successfully');
    setMessage({ 
      type: 'success', 
      text: `Configuration saved successfully: ${result.message}` 
    });
    
    // Reload to confirm save
    setTimeout(() => {
      loadEmailConfig();
    }, 1000);
  } else {
    console.error('❌ Failed to save email configuration:', result.message);
    setMessage({ 
      type: 'error', 
      text: `Failed to save configuration: ${result.message}` 
    });
  }
  
} catch (error) {
  console.error('❌ Error saving email config:', error);
  setMessage({ 
    type: 'error', 
    text: 'Error saving configuration: ' + error.message 
  });
} finally {
  setSaving(false);
}
```

};

const sendTestEmail = async () => {
try {
setSendingTest(true);
setMessage(null);

```
  console.log('📧 Sending test email...');
  
  const result = await emailService.sendTestEmail(config);
  
  if (result.success) {
    setMessage({ 
      type: 'success', 
      text: result.message 
    });
  } else {
    setMessage({ 
      type: 'error', 
      text: result.message 
    });
  }
  
} catch (error) {
  console.error('❌ Error sending test email:', error);
  setMessage({ 
    type: 'error', 
    text: 'Error sending test email: ' + error.message 
  });
} finally {
  setSendingTest(false);
}
```

};

const handleAddEmail = (type) => {
setDialogType(type);
setNewEmail({ email: ‘’, name: ‘’ });

```
if (type === 'procedureOwners') {
  loadProcedureOwners();
}

setShowAddDialog(true);
```

};

const handleSaveNewEmail = () => {
if (dialogType === ‘procedureOwners’) {
// Add selected procedure owners
const newOwners = selectedOwners.map(owner => ({
id: Date.now() + Math.random(),
email: owner.email,
name: owner.name,
active: true,
type: owner.type,
procedures: owner.procedures
}));

```
  setConfig(prev => ({
    ...prev,
    procedureOwnersList: [...prev.procedureOwnersList, ...newOwners]
  }));
  
  setSelectedOwners([]);
} else {
  // Add manual email
  if (newEmail.email && newEmail.email.includes('@')) {
    const listKey = dialogType === 'globalCC' ? 'globalCCList' : 'adminList';
    
    setConfig(prev => ({
      ...prev,
      [listKey]: [...prev[listKey], {
        id: Date.now() + Math.random(),
        email: newEmail.email.trim(),
        name: newEmail.name.trim() || newEmail.email.trim(),
        active: true
      }]
    }));
  }
}

setShowAddDialog(false);
setNewEmail({ email: '', name: '' });
```

};

const handleRemoveEmail = (listType, emailId) => {
const listKey = listType === ‘globalCC’ ? ‘globalCCList’ :
listType === ‘admin’ ? ‘adminList’ : ‘procedureOwnersList’;

```
setConfig(prev => ({
  ...prev,
  [listKey]: prev[listKey].filter(item => item.id !== emailId)
}));
```

};

const handleToggleActive = (listType, emailId) => {
const listKey = listType === ‘globalCC’ ? ‘globalCCList’ :
listType === ‘admin’ ? ‘adminList’ : ‘procedureOwnersList’;

```
setConfig(prev => ({
  ...prev,
  [listKey]: prev[listKey].map(item => 
    item.id === emailId ? { ...item, active: !item.active } : item
  )
}));
```

};

const handleTestEmailChange = (event) => {
setConfig(prev => ({
…prev,
testEmail: event.target.value
}));
};

if (loading) {
return (
<Box sx={{ display: ‘flex’, justifyContent: ‘center’, alignItems: ‘center’, minHeight: 400 }}>
<CircularProgress size={60} />
<Typography variant=“h6” sx={{ ml: 2 }}>
Loading email configuration…
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
📧 Configure Email Recipients
</Typography>
<Typography variant="body2" color="text.secondary">
Manage global recipients, administrators, and procedure owners for email notifications
</Typography>
</Box>
<Box sx={{ display: ‘flex’, gap: 2 }}>
<Button
variant=“outlined”
startIcon={<Refresh />}
onClick={loadEmailConfig}
disabled={loading}
>
Refresh
</Button>
<Button
variant=“contained”
startIcon={saving ? <CircularProgress size={20} /> : <Save />}
onClick={saveConfiguration}
disabled={saving}
color=“primary”
>
{saving ? ‘Saving…’ : ‘Save Configuration’}
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

  <Grid container spacing={3}>
    {/* Test Email Configuration */}
    <Grid item xs={12}>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Send color="primary" />
              Test Email Configuration
            </Typography>
            <Button
              variant="contained"
              color="secondary"
              startIcon={sendingTest ? <CircularProgress size={20} /> : <Send />}
              onClick={sendTestEmail}
              disabled={sendingTest}
            >
              {sendingTest ? 'Sending...' : 'Send Test Email'}
            </Button>
          </Box>
          
          <TextField
            fullWidth
            label="Test Email Address"
            value={config.testEmail}
            onChange={handleTestEmailChange}
            placeholder="Enter email for testing"
            helperText="This email will always receive test notifications (currently set to minaantoun@hsbc.com)"
            sx={{ mb: 2 }}
          />
          
          <Alert severity="info">
            <Typography variant="body2">
              The test email feature sends a sample notification to verify the email system is working correctly.
              Test emails are always sent to <strong>minaantoun@hsbc.com</strong> for system validation.
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    </Grid>

    {/* Global CC List */}
    <Grid item xs={12} md={4}>
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Email color="primary" />
              Global CC List
            </Typography>
            <Button
              size="small"
              startIcon={<Add />}
              onClick={() => handleAddEmail('globalCC')}
              variant="outlined"
            >
              Add
            </Button>
          </Box>
          
          <Typography variant="body2" color="text.secondary" gutterBottom>
            These emails will be CC'd on all procedure notifications
          </Typography>
          
          <Divider sx={{ my: 2 }} />
          
          {config.globalCCList.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 3, color: 'text.secondary' }}>
              <Email sx={{ fontSize: 48, opacity: 0.3, mb: 1 }} />
              <Typography variant="body2">
                No global CC recipients configured
              </Typography>
            </Box>
          ) : (
            <List dense>
              {config.globalCCList.map((recipient) => (
                <ListItem key={recipient.id} sx={{ px: 0 }}>
                  <ListItemText
                    primary={recipient.name}
                    secondary={recipient.email}
                    sx={{ 
                      opacity: recipient.active ? 1 : 0.5,
                      textDecoration: recipient.active ? 'none' : 'line-through'
                    }}
                  />
                  <ListItemSecondaryAction>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Switch
                        size="small"
                        checked={recipient.active}
                        onChange={() => handleToggleActive('globalCC', recipient.id)}
                      />
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemoveEmail('globalCC', recipient.id)}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
    </Grid>

    {/* Admin List */}
    <Grid item xs={12} md={4}>
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AdminPanelSettings color="error" />
              Administrator List
            </Typography>
            <Button
              size="small"
              startIcon={<Add />}
              onClick={() => handleAddEmail('admin')}
              variant="outlined"
              color="error"
            >
              Add
            </Button>
          </Box>
          
          <Typography variant="body2" color="text.secondary" gutterBottom>
            System administrators who receive all critical notifications
          </Typography>
          
          <Divider sx={{ my: 2 }} />
          
          {config.adminList.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 3, color: 'text.secondary' }}>
              <AdminPanelSettings sx={{ fontSize: 48, opacity: 0.3, mb: 1 }} />
              <Typography variant="body2">
                No administrators configured
              </Typography>
            </Box>
          ) : (
            <List dense>
              {config.adminList.map((admin) => (
                <ListItem key={admin.id} sx={{ px: 0 }}>
                  <ListItemText
                    primary={admin.name}
                    secondary={admin.email}
                    sx={{ 
                      opacity: admin.active ? 1 : 0.5,
                      textDecoration: admin.active ? 'none' : 'line-through'
                    }}
                  />
                  <ListItemSecondaryAction>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Switch
                        size="small"
                        checked={admin.active}
                        onChange={() => handleToggleActive('admin', admin.id)}
                      />
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemoveEmail('admin', admin.id)}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
    </Grid>

    {/* Procedure Owners List */}
    <Grid item xs={12} md={4}>
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Business color="success" />
              Procedure Owners
            </Typography>
            <Button
              size="small"
              startIcon={<Add />}
              onClick={() => handleAddEmail('procedureOwners')}
              variant="outlined"
              color="success"
            >
              Add All
            </Button>
          </Box>
          
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Primary and secondary owners loaded from procedure records
          </Typography>
          
          <Divider sx={{ my: 2 }} />
          
          {config.procedureOwnersList.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 3, color: 'text.secondary' }}>
              <Business sx={{ fontSize: 48, opacity: 0.3, mb: 1 }} />
              <Typography variant="body2">
                No procedure owners loaded
              </Typography>
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                Click "Add All" to load from SharePoint
              </Typography>
            </Box>
          ) : (
            <List dense>
              {config.procedureOwnersList.map((owner) => (
                <ListItem key={owner.id} sx={{ px: 0 }}>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {owner.name}
                        <Chip 
                          label={owner.type} 
                          size="small" 
                          color={owner.type === 'Primary Owner' ? 'primary' : 'secondary'}
                          sx={{ fontSize: '0.6rem', height: 16 }}
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="caption" display="block">
                          {owner.email}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {owner.procedures?.length || 0} procedure(s)
                        </Typography>
                      </Box>
                    }
                    sx={{ 
                      opacity: owner.active ? 1 : 0.5,
                      textDecoration: owner.active ? 'none' : 'line-through'
                    }}
                  />
                  <ListItemSecondaryAction>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Switch
                        size="small"
                        checked={owner.active}
                        onChange={() => handleToggleActive('procedureOwners', owner.id)}
                      />
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemoveEmail('procedureOwners', owner.id)}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
    </Grid>
  </Grid>

  {/* Summary Statistics */}
  <Card sx={{ mt: 3 }}>
    <CardContent>
      <Typography variant="h6" gutterBottom>
        📊 Recipients Summary
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.main', color: 'primary.contrastText' }}>
            <Typography variant="h4" fontWeight="bold">
              {config.globalCCList.filter(r => r.active).length}
            </Typography>
            <Typography variant="body2">
              Global CC Recipients
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'error.main', color: 'error.contrastText' }}>
            <Typography variant="h4" fontWeight="bold">
              {config.adminList.filter(r => r.active).length}
            </Typography>
            <Typography variant="body2">
              Active Administrators
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.main', color: 'success.contrastText' }}>
            <Typography variant="h4" fontWeight="bold">
              {config.procedureOwnersList.filter(r => r.active).length}
            </Typography>
            <Typography variant="body2">
              Procedure Owners
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'secondary.main', color: 'secondary.contrastText' }}>
            <Typography variant="h4" fontWeight="bold">
              {(config.globalCCList.filter(r => r.active).length + 
                config.adminList.filter(r => r.active).length + 
                config.procedureOwnersList.filter(r => r.active).length)}
            </Typography>
            <Typography variant="body2">
              Total Active Recipients
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </CardContent>
  </Card>

  {/* Add Email Dialog */}
  <Dialog 
    open={showAddDialog} 
    onClose={() => setShowAddDialog(false)}
    maxWidth="md"
    fullWidth
  >
    <DialogTitle>
      {dialogType === 'globalCC' && '📧 Add Global CC Recipient'}
      {dialogType === 'admin' && '👨‍💼 Add Administrator'}
      {dialogType === 'procedureOwners' && '👥 Add Procedure Owners'}
    </DialogTitle>
    
    <DialogContent>
      {dialogType === 'procedureOwners' ? (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="body1">
              Select procedure owners to add to the recipients list:
            </Typography>
            <Button
              startIcon={loadingOwners ? <CircularProgress size={20} /> : <Refresh />}
              onClick={loadProcedureOwners}
              disabled={loadingOwners}
              size="small"
            >
              {loadingOwners ? 'Loading...' : 'Refresh'}
            </Button>
          </Box>
          
          {loadingOwners ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
              {availableOwners.length === 0 ? (
                <Alert severity="info">
                  No procedure owners found. Make sure procedures have been uploaded with owner information.
                </Alert>
              ) : (
                <List>
                  {availableOwners.map((owner) => (
                    <ListItem key={owner.id} dense>
                      <Checkbox
                        checked={selectedOwners.some(s => s.email === owner.email)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedOwners(prev => [...prev, owner]);
                          } else {
                            setSelectedOwners(prev => prev.filter(s => s.email !== owner.email));
                          }
                        }}
                      />
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {owner.name}
                            <Chip 
                              label={owner.type} 
                              size="small" 
                              color={owner.type === 'Primary Owner' ? 'primary' : 'secondary'}
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2">{owner.email}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {owner.procedures.length} procedure(s): {owner.procedures.slice(0, 2).join(', ')}
                              {owner.procedures.length > 2 && '...'}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          )}
          
          {selectedOwners.length > 0 && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Selected {selectedOwners.length} owner(s) to add to recipients list.
            </Alert>
          )}
        </Box>
      ) : (
        <Box>
          <TextField
            fullWidth
            label="Email Address"
            value={newEmail.email}
            onChange={(e) => setNewEmail(prev => ({ ...prev, email: e.target.value }))}
            placeholder="user@hsbc.com"
            type="email"
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Display Name (Optional)"
            value={newEmail.name}
            onChange={(e) => setNewEmail(prev => ({ ...prev, name: e.target.value }))}
            placeholder="John Smith"
          />
        </Box>
      )}
    </DialogContent>
    
    <DialogActions>
      <Button 
        onClick={() => setShowAddDialog(false)}
        startIcon={<Cancel />}
      >
        Cancel
      </Button>
      <Button 
        onClick={handleSaveNewEmail}
        variant="contained"
        startIcon={<CheckCircle />}
        disabled={
          dialogType === 'procedureOwners' ? 
          selectedOwners.length === 0 : 
          !newEmail.email || !newEmail.email.includes('@')
        }
      >
        {dialogType === 'procedureOwners' ? 
          `Add ${selectedOwners.length} Owner(s)` : 
          'Add Recipient'
        }
      </Button>
    </DialogActions>
  </Dialog>
</Box>
```

);
};

export default ConfigureRecipients;