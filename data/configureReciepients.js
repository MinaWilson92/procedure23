// components/email/ConfigureRecipients.js - Complete Fixed Version
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Grid,
  TextField, IconButton, Alert, Chip, Paper, Divider,
  Switch, FormControlLabel, Dialog, DialogTitle, DialogContent,
  DialogActions, List, ListItem, ListItemText, ListItemSecondaryAction,
  Checkbox, CircularProgress, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import {
  Add, Delete, Email, Save, Refresh, PersonAdd,
  Group, AdminPanelSettings, Business,
  CheckCircle, Cancel, Send
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import EmailService from '../../services/EmailService';

const ConfigureRecipients = () => {
  // State management
  const [config, setConfig] = useState({
    globalCCList: [],
    adminList: [],
    lobHeadsList: [],
    customGroupsList: [],
    testEmail: 'minaantoun@hsbc.com'
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [message, setMessage] = useState(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [newEmail, setNewEmail] = useState({ 
    email: '', 
    name: '', 
    lob: 'All', 
    escalationType: 'new-procedure-uploaded',
    recipientRole: 'General'
  });
  const [availableOwners, setAvailableOwners] = useState([]);
  const [selectedOwners, setSelectedOwners] = useState([]);
  const [loadingOwners, setLoadingOwners] = useState(false);

  // Your SharePoint list choices
  const lobChoices = ['All', 'IWPB', 'CIB', 'GCOO'];
  const escalationTypes = [
    'new-procedure-uploaded',
    'procedure-expiring', 
    'procedure-expired',
    'low-quality-score',
    'system-maintenance',
    'broadcast-announcement'
  ];
  const recipientRoles = ['General', 'Manager', 'Head', 'Director', 'VP'];

  // Initialize email service
  const [emailService] = useState(() => new EmailService());

  useEffect(() => {
    loadEmailConfig();
  }, []);

  const loadEmailConfig = async () => {
    try {
      setLoading(true);
      setMessage(null);

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
  };

  const loadProcedureOwners = async () => {
    try {
      setLoadingOwners(true);
      console.log('👥 Loading procedure owners from SharePoint...');

      const owners = await emailService.getProcedureOwners();
      setAvailableOwners(owners);
      
      console.log('✅ Procedure owners loaded:', owners.length);
      setMessage({ type: 'success', text: `Loaded ${owners.length} procedure owners from SharePoint` });
      
    } catch (error) {
      console.error('❌ Error loading procedure owners:', error);
      setMessage({ type: 'error', text: 'Failed to load procedure owners: ' + error.message });
    } finally {
      setLoadingOwners(false);
    }
  };

  const saveConfiguration = async () => {
    try {
      setSaving(true);
      setMessage(null);

      console.log('💾 Saving email configuration to SharePoint...', config);
      
      // Validate configuration
      if (config.globalCCList.length === 0 && config.adminList.length === 0 && config.lobHeadsList.length === 0) {
        setMessage({ 
          type: 'warning', 
          text: 'Please add at least one email address to any recipient list' 
        });
        return;
      }

      const result = await emailService.saveEmailConfig(config);
      
      if (result.success) {
        console.log('✅ Email configuration saved successfully to SharePoint');
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
  };

  const sendTestEmail = async () => {
    try {
      setSendingTest(true);
      setMessage(null);

      console.log('📧 Sending test email via SharePoint...');
      
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
  };

  const handleAddEmail = (type) => {
    setDialogType(type);
    setNewEmail({ 
      email: '', 
      name: '', 
      lob: 'All', 
      escalationType: 'new-procedure-uploaded',
      recipientRole: type === 'admin' ? 'Manager' : type === 'lobHeads' ? 'Head' : 'General'
    });

    if (type === 'procedureOwners') {
      loadProcedureOwners();
    }

    setShowAddDialog(true);
  };

  const handleSaveNewEmail = () => {
    if (dialogType === 'procedureOwners') {
      // Add selected procedure owners
      const newOwners = selectedOwners.map(owner => ({
        id: Date.now() + Math.random(),
        email: owner.email,
        name: owner.name,
        active: true,
        lob: owner.lob || 'All',
        escalationType: 'new-procedure-uploaded',
        recipientRole: 'General',
        type: owner.type,
        procedures: owner.procedures
      }));

      const listKey = 'customGroupsList'; // Add procedure owners to custom groups
      setConfig(prev => ({
        ...prev,
        [listKey]: [...prev[listKey], ...newOwners]
      }));
      
      setSelectedOwners([]);
    } else {
      // Add manual email
      if (newEmail.email && newEmail.email.includes('@')) {
        const listKey = dialogType === 'globalCC' ? 'globalCCList' : 
                       dialogType === 'admin' ? 'adminList' : 
                       dialogType === 'lobHeads' ? 'lobHeadsList' : 'customGroupsList';
        
        setConfig(prev => ({
          ...prev,
          [listKey]: [...prev[listKey], {
            id: Date.now() + Math.random(),
            email: newEmail.email.trim(),
            name: newEmail.name.trim() || newEmail.email.trim(),
            active: true,
            lob: newEmail.lob,
            escalationType: newEmail.escalationType,
            recipientRole: newEmail.recipientRole
          }]
        }));
      }
    }

    setShowAddDialog(false);
    setNewEmail({ 
      email: '', 
      name: '', 
      lob: 'All', 
      escalationType: 'new-procedure-uploaded',
      recipientRole: 'General'
    });
  };

  const handleRemoveEmail = (listType, emailId) => {
    const listKey = listType === 'globalCC' ? 'globalCCList' :
                   listType === 'admin' ? 'adminList' : 
                   listType === 'lobHeads' ? 'lobHeadsList' : 'customGroupsList';

    setConfig(prev => ({
      ...prev,
      [listKey]: prev[listKey].filter(item => item.id !== emailId)
    }));
  };

  const handleToggleActive = (listType, emailId) => {
    const listKey = listType === 'globalCC' ? 'globalCCList' :
                   listType === 'admin' ? 'adminList' : 
                   listType === 'lobHeads' ? 'lobHeadsList' : 'customGroupsList';

    setConfig(prev => ({
      ...prev,
      [listKey]: prev[listKey].map(item => 
        item.id === emailId ? { ...item, active: !item.active } : item
      )
    }));
  };

  const handleTestEmailChange = (event) => {
    setConfig(prev => ({
      ...prev,
      testEmail: event.target.value
    }));
  };

  // Render email list component
  const renderEmailList = (title, listKey, listType, color, icon) => {
    const list = config[listKey] || [];
    
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {icon}
              {title}
            </Typography>
            <Button
              size="small"
              startIcon={<Add />}
              onClick={() => handleAddEmail(listType)}
              variant="outlined"
              color={color}
            >
              Add
            </Button>
          </Box>
          
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {title === 'Global CC List' && 'These emails will be CC\'d on all procedure notifications'}
            {title === 'Administrator List' && 'System administrators who receive all critical notifications'}
            {title === 'LOB Heads List' && 'Line of Business heads for escalation notifications'}
            {title === 'Custom Groups' && 'Custom recipient groups and procedure owners'}
          </Typography>
          
          <Divider sx={{ my: 2 }} />
          
          {list.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 3, color: 'text.secondary' }}>
              {icon && React.cloneElement(icon, { sx: { fontSize: 48, opacity: 0.3, mb: 1 } })}
              <Typography variant="body2">
                No {title.toLowerCase()} configured
              </Typography>
            </Box>
          ) : (
            <List dense>
              {list.map((recipient) => (
                <ListItem key={recipient.id} sx={{ px: 0 }}>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        {recipient.name}
                        {recipient.lob && recipient.lob !== 'All' && (
                          <Chip 
                            label={recipient.lob} 
                            size="small" 
                            color="primary"
                            sx={{ fontSize: '0.6rem', height: 16 }}
                          />
                        )}
                        {recipient.recipientRole && recipient.recipientRole !== 'General' && (
                          <Chip 
                            label={recipient.recipientRole} 
                            size="small" 
                            color="secondary"
                            sx={{ fontSize: '0.6rem', height: 16 }}
                          />
                        )}
                        {recipient.type && (
                          <Chip 
                            label={recipient.type} 
                            size="small" 
                            color="info"
                            sx={{ fontSize: '0.6rem', height: 16 }}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2">{recipient.email}</Typography>
                        {recipient.escalationType && (
                          <Typography variant="caption" color="text.secondary">
                            Escalation: {recipient.escalationType}
                          </Typography>
                        )}
                        {recipient.procedures && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            {recipient.procedures.length} procedure(s)
                          </Typography>
                        )}
                      </Box>
                    }
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
                        onChange={() => handleToggleActive(listType, recipient.id)}
                      />
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemoveEmail(listType, recipient.id)}
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
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading email configuration from SharePoint...
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
            📧 Configure Email Recipients
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage global recipients, administrators, LOB heads, and custom groups for email notifications
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadEmailConfig}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={20} /> : <Save />}
            onClick={saveConfiguration}
            disabled={saving}
            color="primary"
          >
            {saving ? 'Saving...' : 'Save Configuration'}
          </Button>
        </Box>
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

      {/* Test Email Configuration */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12}>
          <Card>
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
                helperText="This email will receive test notifications to verify SharePoint email integration"
                sx={{ mb: 2 }}
              />
              
              <Alert severity="info">
                <Typography variant="body2">
                  The test email feature sends a sample notification to verify the SharePoint email system is working correctly.
                  Test emails are sent to the configured address above.
                </Typography>
              </Alert>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Email Lists Grid */}
      <Grid container spacing={3}>
        {/* Global CC List */}
        <Grid item xs={12} md={6} lg={3}>
          {renderEmailList(
            'Global CC List', 
            'globalCCList', 
            'globalCC', 
            'primary', 
            <Email color="primary" />
          )}
        </Grid>

        {/* Admin List */}
        <Grid item xs={12} md={6} lg={3}>
          {renderEmailList(
            'Administrator List', 
            'adminList', 
            'admin', 
            'error', 
            <AdminPanelSettings color="error" />
          )}
        </Grid>

        {/* LOB Heads List */}
        <Grid item xs={12} md={6} lg={3}>
          {renderEmailList(
            'LOB Heads List', 
            'lobHeadsList', 
            'lobHeads', 
            'warning', 
            <Group color="warning" />
          )}
        </Grid>

        {/* Custom Groups */}
        <Grid item xs={12} md={6} lg={3}>
          {renderEmailList(
            'Custom Groups', 
            'customGroupsList', 
            'procedureOwners', 
            'success', 
            <Business color="success" />
          )}
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
                  {(config.globalCCList || []).filter(r => r.active).length}
                </Typography>
                <Typography variant="body2">
                  Global CC Recipients
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'error.main', color: 'error.contrastText' }}>
                <Typography variant="h4" fontWeight="bold">
                  {(config.adminList || []).filter(r => r.active).length}
                </Typography>
                <Typography variant="body2">
                  Active Administrators
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.main', color: 'warning.contrastText' }}>
                <Typography variant="h4" fontWeight="bold">
                  {(config.lobHeadsList || []).filter(r => r.active).length}
                </Typography>
                <Typography variant="body2">
                  LOB Heads
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.main', color: 'success.contrastText' }}>
                <Typography variant="h4" fontWeight="bold">
                  {((config.globalCCList || []).filter(r => r.active).length + 
                    (config.adminList || []).filter(r => r.active).length + 
                    (config.lobHeadsList || []).filter(r => r.active).length +
                    (config.customGroupsList || []).filter(r => r.active).length)}
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
          {dialogType === 'lobHeads' && '👔 Add LOB Head'}
          {dialogType === 'procedureOwners' && '👥 Add Procedure Owners'}
        </DialogTitle>
        
        <DialogContent>
          {dialogType === 'procedureOwners' ? (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="body1">
                  Select procedure owners from SharePoint to add to the recipients list:
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
                      No procedure owners found. Make sure procedures have been uploaded with owner information in SharePoint.
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
                                <Chip 
                                  label={owner.lob} 
                                  size="small" 
                                  color="info"
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
               required
             />
             <TextField
               fullWidth
               label="Display Name"
               value={newEmail.name}
               onChange={(e) => setNewEmail(prev => ({ ...prev, name: e.target.value }))}
               placeholder="John Smith"
               sx={{ mb: 2 }}
             />
             <FormControl fullWidth sx={{ mb: 2 }}>
               <InputLabel>Line of Business</InputLabel>
               <Select
                 value={newEmail.lob}
                 onChange={(e) => setNewEmail(prev => ({ ...prev, lob: e.target.value }))}
                 label="Line of Business"
               >
                 {lobChoices.map((lob) => (
                   <MenuItem key={lob} value={lob}>{lob}</MenuItem>
                 ))}
               </Select>
             </FormControl>
             <FormControl fullWidth sx={{ mb: 2 }}>
               <InputLabel>Escalation Type</InputLabel>
               <Select
                 value={newEmail.escalationType}
                 onChange={(e) => setNewEmail(prev => ({ ...prev, escalationType: e.target.value }))}
                 label="Escalation Type"
               >
                 {escalationTypes.map((type) => (
                   <MenuItem key={type} value={type}>
                     {type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                   </MenuItem>
                 ))}
               </Select>
             </FormControl>
             <FormControl fullWidth>
               <InputLabel>Recipient Role</InputLabel>
               <Select
                 value={newEmail.recipientRole}
                 onChange={(e) => setNewEmail(prev => ({ ...prev, recipientRole: e.target.value }))}
                 label="Recipient Role"
               >
                 {recipientRoles.map((role) => (
                   <MenuItem key={role} value={role}>{role}</MenuItem>
                 ))}
               </Select>
             </FormControl>
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
 );
};

export default ConfigureRecipients;
