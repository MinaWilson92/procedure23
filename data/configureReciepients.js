// components/email/ConfigureRecipients.js - Enhanced with LOB-specific recipients
import React, { useState, useEffect } from 'react';
import {
 Box, Typography, Card, CardContent, Button, Grid,
 TextField, IconButton, Alert, Chip, Paper, Divider,
 Switch, FormControlLabel, Dialog, DialogTitle, DialogContent,
 DialogActions, List, ListItem, ListItemText, ListItemSecondaryAction,
 Checkbox, CircularProgress, Accordion, AccordionSummary, AccordionDetails,
 FormControl, InputLabel, Select, MenuItem, Tabs, Tab, Badge
} from '@mui/material';
import {
 Add, Delete, Email, Save, Refresh, PersonAdd,
 ExpandMore, Group, AdminPanelSettings, Business,
 CheckCircle, Cancel, Send, Settings, Broadcast,
 LocationOn, NotificationImportant
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import EmailService from '../../services/EmailService';

const ConfigureRecipients = () => {
 // State management
 const [activeTab, setActiveTab] = useState(0);
 const [selectedLOB, setSelectedLOB] = useState('IWPB');
 const [selectedEscalationType, setSelectedEscalationType] = useState('new-procedure-uploaded');
 const [lobConfigs, setLobConfigs] = useState({});
 const [loading, setLoading] = useState(true);
 const [saving, setSaving] = useState(false);
 const [sendingTest, setSendingTest] = useState(false);
 const [message, setMessage] = useState(null);
 const [showAddDialog, setShowAddDialog] = useState(false);
 const [dialogType, setDialogType] = useState('');
 const [newRecipient, setNewRecipient] = useState({ email: '', name: '', role: 'General' });
 const [availableOwners, setAvailableOwners] = useState([]);
 const [selectedOwners, setSelectedOwners] = useState([]);
 const [loadingOwners, setLoadingOwners] = useState(false);
 const [testEmailAddress, setTestEmailAddress] = useState('');
 const [broadcastDialog, setBroadcastDialog] = useState(false);
 const [broadcastConfig, setBroadcastConfig] = useState({
   subject: '',
   body: '',
   targetGroups: [],
   ccAdmins: true
 });

 // Configuration
 const lobOptions = [
   { value: 'IWPB', label: 'International Wealth and Premier Banking' },
   { value: 'CIB', label: 'Commercial and Institutional Banking' },
   { value: 'GCOO', label: 'Group Chief Operating Officer' }
 ];

 const escalationTypes = [
   { value: 'new-procedure-uploaded', label: 'New Procedure Uploaded', icon: '📤' },
   { value: 'procedure-expiring', label: 'Procedure Expiring Soon', icon: '⏰' },
   { value: 'procedure-expired', label: 'Procedure Expired', icon: '🚨' },
   { value: 'low-quality-score', label: 'Low Quality Score Alert', icon: '📊' },
   { value: 'system-maintenance', label: 'System Maintenance', icon: '🔧' }
 ];

 const broadcastGroups = [
   { id: 'all-primary-owners', label: 'All Primary Owners', description: 'All procedure primary owners' },
   { id: 'all-secondary-owners', label: 'All Secondary Owners', description: 'All procedure secondary owners' },
   { id: 'all-admins', label: 'All Administrators', description: 'System administrators' },
   { id: 'lob-iwpb', label: 'IWPB Recipients', description: 'All IWPB email recipients' },
   { id: 'lob-cib', label: 'CIB Recipients', description: 'All CIB email recipients' },
   { id: 'lob-gcoo', label: 'GCOO Recipients', description: 'All GCOO email recipients' },
   { id: 'global-cc-list', label: 'Global CC List', description: 'Global CC recipients' }
 ];

 // Initialize email service
 const [emailService] = useState(() => new EmailService());

 useEffect(() => {
   loadLOBConfigurations();
 }, []);

 useEffect(() => {
   if (selectedLOB && selectedEscalationType) {
     loadSpecificLOBConfig();
   }
 }, [selectedLOB, selectedEscalationType]);

 const loadLOBConfigurations = async () => {
   try {
     setLoading(true);
     setMessage(null);

     console.log('🔄 Loading LOB-specific email configurations...');
     
     // Load configurations for all LOB + escalation type combinations
     const configs = {};
     
     for (const lob of lobOptions) {
       configs[lob.value] = {};
       for (const escalation of escalationTypes) {
         const config = await emailService.getEmailConfigByLOB(lob.value, escalation.value);
         configs[lob.value][escalation.value] = config;
       }
     }
     
     setLobConfigs(configs);
     console.log('✅ LOB configurations loaded:', configs);
     
   } catch (error) {
     console.error('❌ Error loading LOB configurations:', error);
     setMessage({ type: 'error', text: 'Failed to load LOB configurations: ' + error.message });
   } finally {
     setLoading(false);
   }
 };

 const loadSpecificLOBConfig = async () => {
   try {
     console.log('🔄 Loading specific LOB config:', selectedLOB, selectedEscalationType);
     
     const config = await emailService.getEmailConfigByLOB(selectedLOB, selectedEscalationType);
     
     setLobConfigs(prev => ({
       ...prev,
       [selectedLOB]: {
         ...prev[selectedLOB],
         [selectedEscalationType]: config
       }
     }));
     
   } catch (error) {
     console.error('❌ Error loading specific LOB config:', error);
   }
 };

 const getCurrentConfig = () => {
   return lobConfigs[selectedLOB]?.[selectedEscalationType] || {
     lob: selectedLOB,
     escalationType: selectedEscalationType,
     recipients: {
       globalCC: [],
       admins: [],
       procedureOwners: [],
       lobHeads: [],
       customGroups: []
     },
     settings: {
       sendToOwners: true,
       sendToSecondaryOwners: true,
       ccAdmins: true,
       ccGlobalList: true
     }
   };
 };

 const updateCurrentConfig = (updates) => {
   setLobConfigs(prev => ({
     ...prev,
     [selectedLOB]: {
       ...prev[selectedLOB],
       [selectedEscalationType]: {
         ...getCurrentConfig(),
         ...updates
       }
     }
   }));
 };

 const saveConfiguration = async () => {
   try {
     setSaving(true);
     setMessage(null);

     const currentConfig = getCurrentConfig();
     
     console.log('💾 Saving LOB-specific email configuration...', currentConfig);
     
     // Validate configuration
     const totalRecipients = Object.values(currentConfig.recipients).reduce((total, group) => {
       return total + (Array.isArray(group) ? group.filter(r => r.active).length : 0);
     }, 0);

     if (totalRecipients === 0) {
       setMessage({ 
         type: 'warning', 
         text: `Please add at least one recipient for ${selectedLOB} - ${escalationTypes.find(e => e.value === selectedEscalationType)?.label}` 
       });
       return;
     }

     const result = await emailService.saveLOBEmailConfig(currentConfig);
     
     if (result.success) {
       console.log('✅ LOB email configuration saved successfully');
       setMessage({ 
         type: 'success', 
         text: `Configuration saved successfully for ${selectedLOB} - ${escalationTypes.find(e => e.value === selectedEscalationType)?.label}: ${result.message}` 
       });
       
       // Reload to confirm save
       setTimeout(() => {
         loadSpecificLOBConfig();
       }, 1000);
     } else {
       console.error('❌ Failed to save LOB email configuration:', result.message);
       setMessage({ 
         type: 'error', 
         text: `Failed to save configuration: ${result.message}` 
       });
     }
     
   } catch (error) {
     console.error('❌ Error saving LOB email config:', error);
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

     if (!testEmailAddress || !testEmailAddress.includes('@')) {
       setMessage({ type: 'error', text: 'Please enter a valid email address for testing' });
       return;
     }

     console.log('📧 Sending test email to user-specified address...');
     
     const result = await emailService.sendTestEmail(testEmailAddress);
     
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

 const sendBroadcastEmail = async () => {
   try {
     if (!broadcastConfig.subject || !broadcastConfig.body || broadcastConfig.targetGroups.length === 0) {
       setMessage({ type: 'error', text: 'Please fill in all broadcast email fields and select target groups' });
       return;
     }

     console.log('📢 Sending broadcast email...', broadcastConfig);
     
     const result = await emailService.sendBroadcastEmail({
       ...broadcastConfig,
       sentBy: 'Admin User' // You can get this from user context
     });
     
     if (result.success) {
       setMessage({ 
         type: 'success', 
         text: result.message 
       });
       setBroadcastDialog(false);
       setBroadcastConfig({
         subject: '',
         body: '',
         targetGroups: [],
         ccAdmins: true
       });
     } else {
       setMessage({ 
         type: 'error', 
         text: result.message 
       });
     }
     
   } catch (error) {
     console.error('❌ Error sending broadcast email:', error);
     setMessage({ 
       type: 'error', 
       text: 'Error sending broadcast email: ' + error.message 
     });
   }
 };

 const handleAddRecipient = (recipientType) => {
   setDialogType(recipientType);
   setNewRecipient({ email: '', name: '', role: 'General' });
   
   if (recipientType === 'procedureOwners') {
     loadProcedureOwners();
   }
   
   setShowAddDialog(true);
 };

 const loadProcedureOwners = async () => {
   try {
     setLoadingOwners(true);
     console.log('👥 Loading procedure owners...');

     const owners = await emailService.getProcedureOwners();
     setAvailableOwners(owners);
     
     console.log('✅ Procedure owners loaded:', owners.length);
     
   } catch (error) {
     console.error('❌ Error loading procedure owners:', error);
     setMessage({ type: 'error', text: 'Failed to load procedure owners: ' + error.message });
   } finally {
     setLoadingOwners(false);
   }
 };

 const handleSaveNewRecipient = () => {
   const currentConfig = getCurrentConfig();
   
   if (dialogType === 'procedureOwners') {
     // Add selected procedure owners
     const newOwners = selectedOwners.map(owner => ({
       id: Date.now() + Math.random(),
       email: owner.email,
       name: owner.name,
       active: true,
       role: owner.type,
       procedures: owner.procedures
     }));

     updateCurrentConfig({
       recipients: {
         ...currentConfig.recipients,
         procedureOwners: [...currentConfig.recipients.procedureOwners, ...newOwners]
       }
     });
     
     setSelectedOwners([]);
   } else {
     // Add manual recipient
     if (newRecipient.email && newRecipient.email.includes('@')) {
       const recipientGroup = dialogType === 'globalCC' ? 'globalCC' : 
                            dialogType === 'admin' ? 'admins' : 
                            dialogType === 'lobHead' ? 'lobHeads' : 'customGroups';
       
       const newRecipientData = {
         id: Date.now() + Math.random(),
         email: newRecipient.email.trim(),
         name: newRecipient.name.trim() || newRecipient.email.trim(),
         role: newRecipient.role,
         active: true
       };

       updateCurrentConfig({
         recipients: {
           ...currentConfig.recipients,
           [recipientGroup]: [...currentConfig.recipients[recipientGroup], newRecipientData]
         }
       });
     }
   }

   setShowAddDialog(false);
   setNewRecipient({ email: '', name: '', role: 'General' });
 };

 const handleRemoveRecipient = (recipientType, recipientId) => {
   const currentConfig = getCurrentConfig();
   
   updateCurrentConfig({
     recipients: {
       ...currentConfig.recipients,
       [recipientType]: currentConfig.recipients[recipientType].filter(item => item.id !== recipientId)
     }
   });
 };

 const handleToggleRecipientActive = (recipientType, recipientId) => {
   const currentConfig = getCurrentConfig();
   
   updateCurrentConfig({
     recipients: {
       ...currentConfig.recipients,
       [recipientType]: currentConfig.recipients[recipientType].map(item => 
         item.id === recipientId ? { ...item, active: !item.active } : item
       )
     }
   });
 };

 const getRecipientTypeConfig = (type) => {
   const configs = {
     globalCC: {
       title: 'Global CC List',
       icon: <Email color="primary" />,
       description: 'Recipients CC\'d on all notifications for this LOB and escalation type',
       color: 'primary'
     },
     admins: {
       title: 'Administrators',
       icon: <AdminPanelSettings color="error" />,
       description: 'System administrators for this escalation type',
       color: 'error'
     },
     lobHeads: {
       title: 'LOB Heads',
       icon: <Business color="success" />,
       description: 'Line of Business heads and managers',
       color: 'success'
     },
     customGroups: {
       title: 'Custom Groups',
       icon: <Group color="info" />,
       description: 'Custom recipient groups for specific scenarios',
       color: 'info'
     }
   };
   
   return configs[type] || configs.customGroups;
 };

 const renderRecipientCard = (recipientType) => {
   const currentConfig = getCurrentConfig();
   const recipients = currentConfig.recipients[recipientType] || [];
   const typeConfig = getRecipientTypeConfig(recipientType);
   
   return (
     <Card key={recipientType} sx={{ height: '100%' }}>
       <CardContent>
         <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
           <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
             {typeConfig.icon}
             {typeConfig.title}
           </Typography>
           <Button
             size="small"
             startIcon={<Add />}
             onClick={() => handleAddRecipient(recipientType)}
             variant="outlined"
             color={typeConfig.color}
           >
             Add
           </Button>
         </Box>
         
         <Typography variant="body2" color="text.secondary" gutterBottom>
           {typeConfig.description}
         </Typography>
         
         <Divider sx={{ my: 2 }} />
         
         {recipients.length === 0 ? (
           <Box sx={{ textAlign: 'center', py: 3, color: 'text.secondary' }}>
             {typeConfig.icon}
             <Typography variant="body2" sx={{ mt: 1 }}>
               No {typeConfig.title.toLowerCase()} configured
             </Typography>
           </Box>
         ) : (
           <List dense>
             {recipients.map((recipient) => (
               <ListItem key={recipient.id} sx={{ px: 0 }}>
                 <ListItemText
                   primary={
                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                       {recipient.name}
                       <Chip 
                         label={recipient.role} 
                         size="small" 
                         color={recipient.role === 'Primary Owner' ? 'primary' : 'default'}
                         sx={{ fontSize: '0.6rem', height: 16 }}
                       />
                     </Box>
                   }
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
                       onChange={() => handleToggleRecipientActive(recipientType, recipient.id)}
                     />
                     <IconButton
                       size="small"
                       color="error"
                       onClick={() => handleRemoveRecipient(recipientType, recipient.id)}
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
         Loading LOB email configurations...
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
           Manage LOB-specific recipients and broadcast email functionality
         </Typography>
       </Box>
       <Box sx={{ display: 'flex', gap: 2 }}>
         <Button
           variant="outlined"
           startIcon={<Broadcast />}
           onClick={() => setBroadcastDialog(true)}
           color="secondary"
         >
           Broadcast Email
         </Button>
         <Button
           variant="outlined"
           startIcon={<Refresh />}
           onClick={loadLOBConfigurations}
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

     {/* Navigation Tabs */}
     <Paper sx={{ mb: 3 }}>
       <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
         <Tab 
           label="LOB-Specific Recipients" 
           icon={<LocationOn />}
           iconPosition="start"
         />
         <Tab 
           label="Test Email" 
           icon={<Send />}
           iconPosition="start"
         />
       </Tabs>
     </Paper>

     {/* Tab 0: LOB-Specific Recipients */}
     {activeTab === 0 && (
       <Box>
         {/* LOB and Escalation Type Selectors */}
         <Grid container spacing={3} sx={{ mb: 4 }}>
           <Grid item xs={12} md={6}>
             <FormControl fullWidth>
               <InputLabel>Line of Business</InputLabel>
               <Select
                 value={selectedLOB}
                 onChange={(e) => setSelectedLOB(e.target.value)}
                 label="Line of Business"
               >
                 {lobOptions.map((lob) => (
                   <MenuItem key={lob.value} value={lob.value}>
                     {lob.value} - {lob.label}
                   </MenuItem>
                 ))}
               </Select>
             </FormControl>
           </Grid>
           <Grid item xs={12} md={6}>
             <FormControl fullWidth>
               <InputLabel>Escalation Type</InputLabel>
               <Select
                 value={selectedEscalationType}
                 onChange={(e) => setSelectedEscalationType(e.target.value)}
                 label="Escalation Type"
               >
                 {escalationTypes.map((type) => (
                   <MenuItem key={type.value} value={type.value}>
                     {type.icon} {type.label}
                   </MenuItem>
                 ))}
               </Select>
             </FormControl>
           </Grid>
         </Grid>

         {/* Configuration Info */}
         <Alert severity="info" sx={{ mb: 3 }}>
           <Typography variant="body2">
             <strong>Configuring:</strong> {selectedLOB} - {escalationTypes.find(e => e.value === selectedEscalationType)?.label}
             <br />
             When this escalation occurs for {selectedLOB}, the system will notify the configured recipients below.
           </Typography>
         </Alert>

         {/* Recipient Configuration Cards */}
         <Grid container spacing={3} sx={{ mb: 4 }}>
           <Grid item xs={12} md={6}>
             {renderRecipientCard('globalCC')}
           </Grid>
           <Grid item xs={12} md={6}>
             {renderRecipientCard('admins')}
           </Grid>
           <Grid item xs={12} md={6}>
             {renderRecipientCard('lobHeads')}
           </Grid>
           <Grid item xs={12} md={6}>
             {renderRecipientCard('customGroups')}
           </Grid>
         </Grid>

         {/* Settings */}
         <Card sx={{ mb: 3 }}>
           <CardContent>
             <Typography variant="h6" gutterBottom>
               ⚙️ Notification Settings
             </Typography>
             <Grid container spacing={2}>
               <Grid item xs={12} sm={6}>
                 <FormControlLabel
                   control={
                     <Switch
                       checked={getCurrentConfig().settings?.sendToOwners || false}
                       onChange={(e) => {
                         const currentConfig = getCurrentConfig();
                         updateCurrentConfig({
                           settings: {
                             ...currentConfig.settings,
                             sendToOwners: e.target.checked
                           }
                         });
                       }}
                     />
                   }
                   label="Send to Primary Owners"
                 />
               </Grid>
               <Grid item xs={12} sm={6}>
                 <FormControlLabel
                   control={
                     <Switch
                       checked={getCurrentConfig().settings?.sendToSecondaryOwners || false}
                       onChange={(e) => {
                         const currentConfig = getCurrentConfig();
                         updateCurrentConfig({
                           settings: {
                             ...currentConfig.settings,
                             sendToSecondaryOwners: e.target.checked
                           }
                         });
                       }}
                     />
                   }
                   label="Send to Secondary Owners"
                 />
               </Grid>
               <Grid item xs={12} sm={6}>
                 <FormControlLabel
                   control={
                     <Switch
                       checked={getCurrentConfig().settings?.ccAdmins || false}
                       onChange={(e) => {
                         const currentConfig = getCurrentConfig();
                         updateCurrentConfig({
                           settings: {
                             ...currentConfig.settings,
                             ccAdmins: e.target.checked
                           }
                         });
                       }}
                     />
                   }
                   label="CC Administrators"
                 />
               </Grid>
               <Grid item xs={12} sm={6}>
                 <FormControlLabel
                   control={
                     <Switch
                       checked={getCurrentConfig().settings?.ccGlobalList || false}
                       onChange={(e) => {
                         const currentConfig = getCurrentConfig();
                         updateCurrentConfig({
                           settings: {
                             ...currentConfig.settings,
                             ccGlobalList: e.target.checked
                           }
                         });
                       }}
                     />
                   }
                   label="CC Global List"
                 />
               </Grid>
             </Grid>
           </CardContent>
         </Card>

         {/* Summary Statistics */}
         <Card>
           <CardContent>
             <Typography variant="h6" gutterBottom>
               📊 Current Configuration Summary
             </Typography>
             <Grid container spacing={2}>
               {Object.entries(getCurrentConfig().recipients).map(([type, recipients]) => {
                 const activeCount = recipients.filter(r => r.active).length;
                 const typeConfig = getRecipientTypeConfig(type);
                 
                 return (
                   <Grid item xs={6} sm={3} key={type}>
                     <Paper sx={{ 
                       p: 2, 
                       textAlign: 'center', 
                       bgcolor: `${typeConfig.color}.main`, 
                       color: `${typeConfig.color}.contrastText` 
                     }}>
                       <Typography variant="h4" fontWeight="bold">
                         {activeCount}
                       </Typography>
                       <Typography variant="body2">
                         {typeConfig.title}
                       </Typography>
                     </Paper>
                   </Grid>
                 );
               })}
             </Grid>
           </CardContent>
         </Card>
       </Box>
     )}

     {/* Tab 1: Test Email */}
     {activeTab === 1 && (
       <Box>
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
                 disabled={sendingTest || !testEmailAddress}
               >
                 {sendingTest ? 'Sending...' : 'Send Test Email'}
               </Button>
             </Box>
             
             <TextField
               fullWidth
               label="Test Email Address"
               value={testEmailAddress}
               onChange={(e) => setTestEmailAddress(e.target.value)}
               placeholder="Enter any valid email address for testing"
               helperText="Enter the email address where you want to receive the test notification"
               sx={{ mb: 2 }}
               type="email"
             />
             
             <Alert severity="info">
               <Typography variant="body2">
                 <strong>Enhanced Test Email:</strong> You can now send test emails to any valid email address to verify the SharePoint email integration is working correctly.
                 The test email will include system details and confirmation that the email service is operational.
               </Typography>
             </Alert>
           </CardContent>
         </Card>
       </Box>
     )}

     {/* Add Recipient Dialog */}
     <Dialog 
       open={showAddDialog} 
       onClose={() => setShowAddDialog(false)}
       maxWidth="md"
       fullWidth
     >
       <DialogTitle>
         {dialogType === 'globalCC' && '📧 Add Global CC Recipient'}
         {dialogType === 'admins' && '👨‍💼 Add Administrator'}
         {dialogType === 'lobHeads' && '🏢 Add LOB Head'}
         {dialogType === 'customGroups' && '👥 Add Custom Group Member'}
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
               value={newRecipient.email}
               onChange={(e) => setNewRecipient(prev => ({ ...prev, email: e.target.value }))}
               placeholder="user@hsbc.com"
               type="email"
               sx={{ mb: 2 }}
             />
             <TextField
               fullWidth
               label="Display Name"
               value={newRecipient.name}
               onChange={(e) => setNewRecipient(prev => ({ ...prev, name: e.target.value }))}
               placeholder="John Smith"
               sx={{ mb: 2 }}
             />
             <FormControl fullWidth>
               <InputLabel>Role</InputLabel>
               <Select
                 value={newRecipient.role}
                 onChange={(e) => setNewRecipient(prev => ({ ...prev, role: e.target.value }))}
                 label="Role"
               >
                 <MenuItem value="General">General</MenuItem>
                 <MenuItem value="Manager">Manager</MenuItem>
                 <MenuItem value="Head">Head</MenuItem>
                 <MenuItem value="Director">Director</MenuItem>
                 <MenuItem value="VP">VP</MenuItem>
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
           onClick={handleSaveNewRecipient}
           variant="contained"
           startIcon={<CheckCircle />}
           disabled={
             dialogType === 'procedureOwners' ? 
             selectedOwners.length === 0 : 
             !newRecipient.email || !newRecipient.email.includes('@')
           }
         >
           {dialogType === 'procedureOwners' ? 
             `Add ${selectedOwners.length} Owner(s)` : 
             'Add Recipient'
           }
         </Button>
       </DialogActions>
     </Dialog>

     {/* Broadcast Email Dialog */}
     <Dialog 
       open={broadcastDialog} 
       onClose={() => setBroadcastDialog(false)}
       maxWidth="lg"
       fullWidth
     >
       <DialogTitle>
         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
           <Broadcast color="secondary" />
           Send Broadcast Email
         </Box>
       </DialogTitle>
       
       <DialogContent>
         <Grid container spacing={3}>
           <Grid item xs={12} md={8}>
             <TextField
               fullWidth
               label="Email Subject"
               value={broadcastConfig.subject}
               onChange={(e) => setBroadcastConfig(prev => ({ ...prev, subject: e.target.value }))}
               sx={{ mb: 2 }}
               required
             />
             
             <TextField
               fullWidth
               multiline
               rows={8}
               label="Email Message"
               value={broadcastConfig.body}
               onChange={(e) => setBroadcastConfig(prev => ({ ...prev, body: e.target.value }))}
               sx={{ mb: 2 }}
               required
               placeholder="Enter your broadcast message..."
             />
             
             <FormControlLabel
               control={
                 <Switch
                   checked={broadcastConfig.ccAdmins}
                   onChange={(e) => setBroadcastConfig(prev => ({ ...prev, ccAdmins: e.target.checked }))}
                 />
               }
               label="CC Administrators"
             />
           </Grid>
           
           <Grid item xs={12} md={4}>
             <Typography variant="h6" gutterBottom>
               📋 Target Groups
             </Typography>
             <Typography variant="body2" color="text.secondary" gutterBottom>
               Select which groups should receive this broadcast:
             </Typography>
             
             <List dense sx={{ bgcolor: 'grey.50', borderRadius: 1, maxHeight: 300, overflow: 'auto' }}>
               {broadcastGroups.map((group) => (
                 <ListItem key={group.id} dense>
                   <Checkbox
                     checked={broadcastConfig.targetGroups.includes(group.id)}
                     onChange={(e) => {
                       if (e.target.checked) {
                         setBroadcastConfig(prev => ({
                           ...prev,
                           targetGroups: [...prev.targetGroups, group.id]
                         }));
                       } else {
                         setBroadcastConfig(prev => ({
                           ...prev,
                           targetGroups: prev.targetGroups.filter(id => id !== group.id)
                         }));
                       }
                     }}
                   />
                   <ListItemText
                     primary={group.label}
                     secondary={group.description}
                   />
                 </ListItem>
               ))}
             </List>
             
             {broadcastConfig.targetGroups.length > 0 && (
               <Alert severity="info" sx={{ mt: 2 }}>
                 <Typography variant="body2">
                   <strong>{broadcastConfig.targetGroups.length} group(s) selected</strong>
                   <br />
                   The system will automatically gather all recipients from the selected groups.
                 </Typography>
               </Alert>
             )}
           </Grid>
         </Grid>
       </DialogContent>
       
       <DialogActions>
         <Button 
           onClick={() => setBroadcastDialog(false)}
           startIcon={<Cancel />}
         >
           Cancel
         </Button>
         <Button 
           onClick={sendBroadcastEmail}
           variant="contained"
           color="secondary"
           startIcon={<Send />}
           disabled={!broadcastConfig.subject || !broadcastConfig.body || broadcastConfig.targetGroups.length === 0}
         >
           Send Broadcast Email
         </Button>
       </DialogActions>
     </Dialog>
   </Box>
 );
};

export default ConfigureRecipients;
