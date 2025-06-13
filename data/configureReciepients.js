// components/email/ConfigureRecipients.js - Complete Fixed Version
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Grid,
  TextField, IconButton, Alert, Chip, Paper, Divider,
  Switch, FormControlLabel, Dialog, DialogTitle, DialogContent,
  DialogActions, List, ListItem, ListItemText, ListItemSecondaryAction,
  Checkbox, CircularProgress, Accordion, AccordionSummary, AccordionDetails,
  Tabs, Tab, Avatar
} from '@mui/material';
import {
  Add, Delete, Email, Save, Refresh, PersonAdd, ExpandMore,
  Group, AdminPanelSettings, Business, CheckCircle, Cancel, Send,
  Notifications, Settings, Edit
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import EmailService from '../../services/EmailService';

const ConfigureRecipients = () => {
  // State management
  const [config, setConfig] = useState({
    testEmail: 'minaantoun@hsbc.com',
    lobConfigs: {
      'IWPB': {
        'new-procedure-uploaded': { globalHeads: [], admins: [], procedureOwners: true },
        'procedure-expiring': { globalHeads: [], admins: [], procedureOwners: true },
        'procedure-expired': { globalHeads: [], admins: [], procedureOwners: true },
        'low-quality-score': { globalHeads: [], admins: [], procedureOwners: true }
      },
      'CIB': {
        'new-procedure-uploaded': { globalHeads: [], admins: [], procedureOwners: true },
        'procedure-expiring': { globalHeads: [], admins: [], procedureOwners: true },
        'procedure-expired': { globalHeads: [], admins: [], procedureOwners: true },
        'low-quality-score': { globalHeads: [], admins: [], procedureOwners: true }
      },
      'GCOO': {
        'new-procedure-uploaded': { globalHeads: [], admins: [], procedureOwners: true },
        'procedure-expiring': { globalHeads: [], admins: [], procedureOwners: true },
        'procedure-expired': { globalHeads: [], admins: [], procedureOwners: true },
        'low-quality-score': { globalHeads: [], admins: [], procedureOwners: true }
      }
    },
    accessManagement: {
      'user-access-granted': { newUserNotification: true, adminNotification: true, customRecipients: [] },
      'user-access-revoked': { userNotification: true, adminNotification: true, customRecipients: [] },
      'user-role-updated': { userNotification: true, adminNotification: true, customRecipients: [] }
    }
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [message, setMessage] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [dialogConfig, setDialogConfig] = useState({ lob: '', template: '', type: '' });
  const [newEmail, setNewEmail] = useState({ email: '', name: '' });
  const [defaultAdmins, setDefaultAdmins] = useState([]);

  // LOB Configuration
  const lobConfig = {
    'IWPB': { name: 'International Wealth and Premier Banking', color: '#1976d2', icon: '🏦' },
    'CIB': { name: 'Commercial and Institutional Banking', color: '#388e3c', icon: '🏢' },
    'GCOO': { name: 'Group Chief Operating Officer', color: '#f57c00', icon: '⚙️' }
  };

  // Template Configuration
  const templateConfig = {
    'new-procedure-uploaded': { name: 'New Procedure Updates', description: 'Automatic email sent when a new procedure is uploaded', icon: '📤', color: 'primary' },
    'procedure-expiring': { name: 'Procedure Expiring Soon', description: 'Automatic email sent when procedures are expiring', icon: '⏰', color: 'warning' },
    'procedure-expired': { name: 'Procedure Expired', description: 'Automatic email sent when procedures have expired', icon: '🚨', color: 'error' },
    'low-quality-score': { name: 'Low Quality Score Alert', description: 'Automatic email sent for low quality procedures', icon: '📊', color: 'info' }
  };

  // Access Management Configuration
  const accessTemplateConfig = {
    'user-access-granted': { name: 'User Access Granted', description: 'Email sent when new user access is granted', icon: '✅', color: 'success' },
    'user-access-revoked': { name: 'User Access Revoked', description: 'Email sent when user access is revoked', icon: '❌', color: 'error' },
    'user-role-updated': { name: 'User Role Updated', description: 'Email sent when user role is changed', icon: '🔄', color: 'info' }
  };

  // Initialize email service
  const [emailService] = useState(() => new EmailService());

  useEffect(() => {
    loadEmailConfig();
    loadDefaultAdmins();
  }, []);

  const loadEmailConfig = async () => {
    try {
      setLoading(true);
      setMessage(null);

      console.log('🔄 Loading enhanced email configuration...');
      const emailConfig = await emailService.getEmailConfig();
      
      // Transform flat config to LOB-based structure
      const enhancedConfig = transformToLOBConfig(emailConfig);
      setConfig(enhancedConfig);
      
      console.log('✅ Enhanced email configuration loaded:', enhancedConfig);
      
    } catch (error) {
      console.error('❌ Error loading email config:', error);
      setMessage({ type: 'error', text: 'Failed to load email configuration: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const loadDefaultAdmins = async () => {
    try {
      console.log('👑 Loading default admin users...');
      
      const response = await fetch(
        `https://teams.global.hsbc/sites/EmployeeEng/_api/web/lists/getbytitle('UserRoles')/items?$filter=UserRole eq 'admin' and Status eq 'active'&$select=*`,
        {
          headers: { 'Accept': 'application/json; odata=verbose' },
          credentials: 'include'
        }
      );

      if (response.ok) {
        const data = await response.json();
        const admins = data.d.results.map(item => ({
          id: item.Id,
          email: `${item.Title}@hsbc.com`,
          name: item.DisplayName || `User ${item.Title}`,
          staffId: item.Title,
          role: item.UserRole,
          isDefault: true
        }));
        
        setDefaultAdmins(admins);
        console.log('✅ Default admins loaded:', admins.length);
      } else {
        console.log('⚠️ Could not load admin users, using fallback');
        setDefaultAdmins([
          {
            id: 'default-1',
            email: 'minaantoun@hsbc.com',
            name: 'Mina Antoun',
            staffId: '43898931',
            role: 'admin',
            isDefault: true
          }
        ]);
      }
      
    } catch (error) {
      console.error('❌ Error loading default admins:', error);
      setDefaultAdmins([]);
    }
  };

  // ✅ FIXED: Transform function to prevent duplicates and handle access management
  const transformToLOBConfig = (flatConfig) => {
    console.log('🔄 Transforming flat config to LOB config:', flatConfig);
    
    // Start with a fresh copy of the default config structure
    const enhanced = {
      testEmail: flatConfig.testEmail || 'minaantoun@hsbc.com',
      lobConfigs: {
        'IWPB': {
          'new-procedure-uploaded': { globalHeads: [], admins: [], procedureOwners: true },
          'procedure-expiring': { globalHeads: [], admins: [], procedureOwners: true },
          'procedure-expired': { globalHeads: [], admins: [], procedureOwners: true },
          'low-quality-score': { globalHeads: [], admins: [], procedureOwners: true }
        },
        'CIB': {
          'new-procedure-uploaded': { globalHeads: [], admins: [], procedureOwners: true },
          'procedure-expiring': { globalHeads: [], admins: [], procedureOwners: true },
          'procedure-expired': { globalHeads: [], admins: [], procedureOwners: true },
          'low-quality-score': { globalHeads: [], admins: [], procedureOwners: true }
        },
        'GCOO': {
          'new-procedure-uploaded': { globalHeads: [], admins: [], procedureOwners: true },
          'procedure-expiring': { globalHeads: [], admins: [], procedureOwners: true },
          'procedure-expired': { globalHeads: [], admins: [], procedureOwners: true },
          'low-quality-score': { globalHeads: [], admins: [], procedureOwners: true }
        }
      },
      accessManagement: {
        'user-access-granted': { newUserNotification: true, adminNotification: true, customRecipients: [] },
        'user-access-revoked': { userNotification: true, adminNotification: true, customRecipients: [] },
        'user-role-updated': { userNotification: true, adminNotification: true, customRecipients: [] }
      }
    };

    // ✅ FIXED: Use Sets to track unique combinations and prevent duplicates
    const processedGlobalHeads = new Set();
    const processedAdmins = new Set();
    const processedCustomRecipients = new Set();

    // Process LOB-specific global heads configurations
    flatConfig.globalCCList?.forEach(item => {
      if (item.lob && item.escalationType && item.email && 
          enhanced.lobConfigs[item.lob] && enhanced.lobConfigs[item.lob][item.escalationType]) {
        
        const uniqueKey = `${item.lob}_${item.escalationType}_${item.email.toLowerCase()}`;
        
        if (!processedGlobalHeads.has(uniqueKey) && 
            (item.recipientRole === 'Head' || item.recipientRole === 'Director')) {
          
          enhanced.lobConfigs[item.lob][item.escalationType].globalHeads.push({
            id: item.id || `head_${Date.now()}_${Math.random()}`,
            email: item.email,
            name: item.name || item.email,
            active: item.active !== false
          });
          
          processedGlobalHeads.add(uniqueKey);
          console.log('✅ Added global head:', uniqueKey);
        }
      }
    });

    // Process admin configurations - only add once per admin
    flatConfig.adminList?.forEach(item => {
      if (item.email) {
        const uniqueKey = `admin_${item.email.toLowerCase()}`;
        
        if (!processedAdmins.has(uniqueKey)) {
          // Add this admin to ALL LOB templates (as per original design)
          Object.keys(enhanced.lobConfigs).forEach(lob => {
            Object.keys(enhanced.lobConfigs[lob]).forEach(template => {
              enhanced.lobConfigs[lob][template].admins.push({
                id: item.id || `admin_${Date.now()}_${Math.random()}`,
                email: item.email,
                name: item.name || item.email,
                active: item.active !== false
              });
            });
          });
          
          processedAdmins.add(uniqueKey);
          console.log('✅ Added admin to all templates:', uniqueKey);
        }
      }
    });

    // ✅ FIXED: Process access management custom recipients properly
    flatConfig.customGroupsList?.forEach(item => {
      if (item.escalationType && item.email && enhanced.accessManagement[item.escalationType]) {
        const uniqueKey = `access_${item.escalationType}_${item.email.toLowerCase()}`;
        
        if (!processedCustomRecipients.has(uniqueKey)) {
          enhanced.accessManagement[item.escalationType].customRecipients.push({
            id: item.id || `custom_${Date.now()}_${Math.random()}`,
            email: item.email,
            name: item.name || item.email,
            active: item.active !== false
          });
          
          processedCustomRecipients.add(uniqueKey);
          console.log('✅ Added custom recipient:', uniqueKey);
        }
      }
    });

    console.log('✅ Enhanced config created:', enhanced);
    return enhanced;
  };

  const saveConfiguration = async () => {
    try {
      setSaving(true);
      setMessage(null);

      console.log('💾 Saving enhanced email configuration...');
      console.log('📋 Current config before save:', config);
      
      // Transform LOB-based config back to flat structure
      const flatConfig = transformFromLOBConfig(config);
      console.log('📤 Flat config for saving:', flatConfig);
      
      const result = await emailService.saveEmailConfig(flatConfig);
      
      if (result.success) {
        console.log('✅ Enhanced email configuration saved successfully');
        setMessage({ 
          type: 'success', 
          text: `Configuration saved successfully: ${result.message}` 
        });
        
        // Refresh the configuration to show updated data
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

  // ✅ FIXED: Transform function to properly handle access management
  const transformFromLOBConfig = (lobConfig) => {
    console.log('🔄 Transforming LOB config to flat config:', lobConfig);
    
    const flatConfig = {
      globalCCList: [],
      adminList: [],
      lobHeadsList: [],
      customGroupsList: [], // ✅ This will handle access management custom recipients
      testEmail: lobConfig.testEmail
    };

    // ✅ FIXED: Use Sets to prevent duplicate entries when saving
    const processedGlobalHeads = new Set();
    const processedAdmins = new Set();

    // Transform LOB configs back to flat structure
    Object.keys(lobConfig.lobConfigs).forEach(lob => {
      Object.keys(lobConfig.lobConfigs[lob]).forEach(template => {
        const templateConfig = lobConfig.lobConfigs[lob][template];
        
        // Add global heads (avoid duplicates)
        templateConfig.globalHeads?.forEach(head => {
          if (head.email) {
            const uniqueKey = `${lob}_${template}_${head.email.toLowerCase()}`;
            if (!processedGlobalHeads.has(uniqueKey)) {
              flatConfig.globalCCList.push({
                id: head.id,
                email: head.email,
                name: head.name,
                active: head.active,
                lob: lob,
                escalationType: template,
                recipientRole: 'Head'
              });
              processedGlobalHeads.add(uniqueKey);
            }
          }
        });

        // Add admins (avoid duplicates - only add each admin once)
        templateConfig.admins?.forEach(admin => {
          if (admin.email) {
            const uniqueKey = admin.email.toLowerCase();
            if (!processedAdmins.has(uniqueKey)) {
              flatConfig.adminList.push({
                id: admin.id,
                email: admin.email,
                name: admin.name,
                active: admin.active,
                lob: 'All', // Admins apply to all LOBs
                escalationType: 'all-templates',
                recipientRole: 'Manager'
              });
              processedAdmins.add(uniqueKey);
            }
          }
        });
      });
    });

    // ✅ FIXED: Transform access management configurations properly
    Object.keys(lobConfig.accessManagement).forEach(templateKey => {
      const templateData = lobConfig.accessManagement[templateKey];
      
      console.log(`🔄 Processing access management for ${templateKey}:`, templateData);
      
      // ✅ CRITICAL FIX: Add custom recipients to customGroupsList
      templateData.customRecipients?.forEach(recipient => {
        if (recipient.email) {
          const customGroupItem = {
            id: recipient.id,
            email: recipient.email,
            name: recipient.name,
            active: recipient.active,
            escalationType: templateKey,
            recipientRole: 'Custom',
            lob: 'All' // Access management applies to all LOBs
          };
          
          flatConfig.customGroupsList.push(customGroupItem);
          console.log(`✅ Added custom recipient to flat config:`, customGroupItem);
        }
      });
      
      // ✅ FIXED: Save notification settings as well
      flatConfig[`${templateKey}_newUserNotification`] = templateData.newUserNotification;
      flatConfig[`${templateKey}_userNotification`] = templateData.userNotification;
      flatConfig[`${templateKey}_adminNotification`] = templateData.adminNotification;
    });

    console.log('📤 Final transformed flat config:', flatConfig);
    return flatConfig;
  };

  const sendTestEmail = async () => {
    try {
      setSendingTest(true);
      setMessage(null);

      console.log('📧 Sending test email...');
      
      const result = await emailService.sendTestEmail(config);
      
      if (result.success) {
        setMessage({ type: 'success', text: result.message });
      } else {
        setMessage({ type: 'error', text: result.message });
      }
      
    } catch (error) {
      console.error('❌ Error sending test email:', error);
      setMessage({ type: 'error', text: 'Error sending test email: ' + error.message });
    } finally {
      setSendingTest(false);
    }
  };

  const handleAddRecipient = (lob, template, type) => {
    setDialogConfig({ lob, template, type });
    setNewEmail({ email: '', name: '' });
    setShowAddDialog(true);
  };

  const handleSaveNewRecipient = () => {
    if (!newEmail.email || !newEmail.email.includes('@')) {
      setMessage({ type: 'error', text: 'Please enter a valid email address' });
      return;
    }

    const { lob, template, type } = dialogConfig;
    const newRecipient = {
      id: `${type}_${Date.now()}_${Math.random()}`,
      email: newEmail.email.trim(),
      name: newEmail.name.trim() || newEmail.email.trim(),
      active: true
    };

    setConfig(prev => ({
      ...prev,
      lobConfigs: {
        ...prev.lobConfigs,
        [lob]: {
          ...prev.lobConfigs[lob],
          [template]: {
            ...prev.lobConfigs[lob][template],
            [type]: [...(prev.lobConfigs[lob][template][type] || []), newRecipient]
          }
        }
      }
    }));

    setShowAddDialog(false);
    setNewEmail({ email: '', name: '' });
  };

  const handleRemoveRecipient = (lob, template, type, recipientId) => {
    setConfig(prev => ({
      ...prev,
      lobConfigs: {
        ...prev.lobConfigs,
        [lob]: {
          ...prev.lobConfigs[lob],
          [template]: {
            ...prev.lobConfigs[lob][template],
            [type]: prev.lobConfigs[lob][template][type].filter(r => r.id !== recipientId)
          }
        }
      }
    }));
  };

  // ✅ FIXED: Toggle recipient active status
  const handleToggleRecipient = (lob, template, type, recipientId) => {
    console.log(`🔄 Toggling recipient: ${lob}/${template}/${type}/${recipientId}`);
    
    setConfig(prev => ({
      ...prev,
      lobConfigs: {
        ...prev.lobConfigs,
        [lob]: {
          ...prev.lobConfigs[lob],
          [template]: {
            ...prev.lobConfigs[lob][template],
            [type]: prev.lobConfigs[lob][template][type].map(r => {
              if (r.id === recipientId) {
                console.log(`✅ Toggling ${r.email} from ${r.active} to ${!r.active}`);
                return { ...r, active: !r.active };
              }
              return r;
            })
          }
        }
      }
    }));
  };

  const handleToggleProcedureOwners = (lob, template) => {
    setConfig(prev => ({
      ...prev,
      lobConfigs: {
        ...prev.lobConfigs,
        [lob]: {
          ...prev.lobConfigs[lob],
          [template]: {
            ...prev.lobConfigs[lob][template],
            procedureOwners: !prev.lobConfigs[lob][template].procedureOwners
          }
        }
      }
    }));
  };

  // ✅ FIXED: Toggle access notification settings
  const handleToggleAccessNotification = (template, type) => {
    console.log(`🔄 Toggling access notification: ${template}/${type}`);
    
    setConfig(prev => ({
      ...prev,
      accessManagement: {
        ...prev.accessManagement,
        [template]: {
          ...prev.accessManagement[template],
          [type]: !prev.accessManagement[template][type]
        }
      }
    }));
  };

  // ✅ FIXED: Toggle access management custom recipient
  const handleToggleAccessRecipient = (templateKey, recipientId) => {
    console.log(`🔄 Toggling access recipient: ${templateKey}/${recipientId}`);
    
    setConfig(prev => ({
      ...prev,
      accessManagement: {
        ...prev.accessManagement,
        [templateKey]: {
          ...prev.accessManagement[templateKey],
          customRecipients: prev.accessManagement[templateKey].customRecipients.map(r => {
            if (r.id === recipientId) {
              console.log(`✅ Toggling access recipient ${r.email} from ${r.active} to ${!r.active}`);
              return { ...r, active: !r.active };
            }
            return r;
          })
        }
      }
    }));
  };

  // ✅ FIXED: Remove access management custom recipient
  const handleRemoveAccessRecipient = (templateKey, recipientId) => {
    console.log(`🗑️ Removing access recipient: ${templateKey}/${recipientId}`);
    
    setConfig(prev => ({
      ...prev,
      accessManagement: {
        ...prev.accessManagement,
        [templateKey]: {
          ...prev.accessManagement[templateKey],
          customRecipients: prev.accessManagement[templateKey].customRecipients.filter(r => r.id !== recipientId)
        }
      }
    }));
  };

  // Render LOB Template Configuration
  const renderLOBTemplate = (lob, templateKey, templateConf) => {
    const lobConf = lobConfig[lob];
    const templateData = config.lobConfigs[lob][templateKey];

    return (
      <Card key={templateKey} sx={{ mb: 2, border: `2px solid ${lobConf.color}20` }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Typography variant="h4">{templateConf.icon}</Typography>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" fontWeight="bold" color={lobConf.color}>
                {templateConf.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {templateConf.description}
              </Typography>
            </Box>
          </Box>

          <Grid container spacing={3}>
            {/* LOB Global Heads */}
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, bgcolor: `${lobConf.color}10`, border: `1px solid ${lobConf.color}30` }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold" color={lobConf.color}>
                    {lob} Global Heads
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<Add />}
                    onClick={() => handleAddRecipient(lob, templateKey, 'globalHeads')}
                    variant="outlined"
                    sx={{ borderColor: lobConf.color, color: lobConf.color }}
                  >
                    Add
                  </Button>
                </Box>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  User can define emails within this list
                </Typography>

                {templateData.globalHeads?.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 2, color: 'text.secondary' }}>
                    <Group sx={{ fontSize: 32, opacity: 0.3, mb: 1 }} />
                    <Typography variant="body2">No global heads configured</Typography>
                  </Box>
                ) : (
                  <List dense>
                    {templateData.globalHeads?.map((head) => (
                      <ListItem key={head.id} sx={{ px: 0 }}>
                        <Avatar sx={{ width: 24, height: 24, mr: 1, bgcolor: lobConf.color }}>
                          {head.name[0]}
                        </Avatar>
                        <ListItemText
                          primary={head.name}
                          secondary={head.email}
                          sx={{ opacity: head.active ? 1 : 0.5 }}
                        />
                        <ListItemSecondaryAction>
                          <Switch
                            size="small"
                            checked={head.active}
                            onChange={() => handleToggleRecipient(lob, templateKey, 'globalHeads', head.id)}
                          />
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemoveRecipient(lob, templateKey, 'globalHeads', head.id)}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                )}
              </Paper>
            </Grid>

            {/* Admins */}
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, bgcolor: '#f4433610', border: '1px solid #f4433630' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold" color="error.main">
                    Admins
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<Add />}
                    onClick={() => handleAddRecipient(lob, templateKey, 'admins')}
                    variant="outlined"
                    color="error"
                  >
                    Add
                  </Button>
                </Box>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Default admin users (can remove or amend)
                </Typography>

                <List dense>
                  {defaultAdmins.map((admin) => (
                    <ListItem key={`default-${admin.id}`} sx={{ px: 0 }}>
                      <Avatar sx={{ width: 24, height: 24, mr: 1, bgcolor: 'error.main' }}>
                        {admin.name[0]}
                      </Avatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {admin.name}
                            <Chip label="Default" size="small" color="error" sx={{ height: 16, fontSize: '0.6rem' }} />
                          </Box>
                        }
                        secondary={admin.email}
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          size="small"
                          checked={true}
                          disabled
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                  
                  {templateData.admins?.map((admin) => (
                    <ListItem key={admin.id} sx={{ px: 0 }}>
                      <Avatar sx={{ width: 24, height: 24, mr: 1, bgcolor: 'error.main' }}>
                        {admin.name[0]}
                      </Avatar>
                      <ListItemText
                        primary={admin.name}
                        secondary={admin.email}
                        sx={{ opacity: admin.active ? 1 : 0.5 }}
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          size="small"
                          checked={admin.active}
                          onChange={() => handleToggleRecipient(lob, templateKey, 'admins', admin.id)}
                        />
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveRecipient(lob, templateKey, 'admins', admin.id)}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>

            {/* Procedure Owners */}
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, bgcolor: '#4caf5010', border: '1px solid #4caf5030' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold" color="success.main">
                   Primary & Secondary Owners
                 </Typography>
                 <FormControlLabel
                   control={
                     <Switch
                       checked={templateData.procedureOwners}
                       onChange={() => handleToggleProcedureOwners(lob, templateKey)}
                       color="success"
                     />
                   }
                   label=""
                 />
               </Box>
               
               <Typography variant="body2" color="text.secondary" gutterBottom>
                 Auto loaded from procedures list of newly uploaded procedure
               </Typography>

               <Box sx={{ 
                 textAlign: 'center', 
                 py: 3, 
                 color: templateData.procedureOwners ? 'success.main' : 'text.disabled'
               }}>
                 <Business sx={{ fontSize: 48, mb: 1 }} />
                 <Typography variant="body2" fontWeight="bold">
                   {templateData.procedureOwners ? 'Enabled' : 'Disabled'}
                 </Typography>
                 <Typography variant="caption" display="block">
                   {templateData.procedureOwners 
                     ? 'Procedure owners will receive notifications automatically' 
                     : 'Procedure owners will not receive notifications'
                   }
                 </Typography>
               </Box>
             </Paper>
           </Grid>
         </Grid>
       </CardContent>
     </Card>
   );
 };

 // ✅ FIXED: Render Access Management Template with proper toggle handling
 const renderAccessTemplate = (templateKey, templateConf) => {
   const templateData = config.accessManagement[templateKey];

   return (
     <Card key={templateKey} sx={{ mb: 2, border: `2px solid ${templateConf.color === 'success' ? '#4caf50' : templateConf.color === 'error' ? '#f44336' : '#2196f3'}20` }}>
       <CardContent>
         <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
           <Typography variant="h4">{templateConf.icon}</Typography>
           <Box sx={{ flex: 1 }}>
             <Typography variant="h6" fontWeight="bold" color={`${templateConf.color}.main`}>
               {templateConf.name}
             </Typography>
             <Typography variant="body2" color="text.secondary">
               {templateConf.description}
             </Typography>
           </Box>
         </Box>

         <Grid container spacing={3}>
           {/* New User Notification */}
           {templateKey === 'user-access-granted' && (
             <Grid item xs={12} md={4}>
               <Paper sx={{ p: 2, bgcolor: '#4caf5010', border: '1px solid #4caf5030' }}>
                 <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                   <Typography variant="subtitle1" fontWeight="bold" color="success.main">
                     New User Notification
                   </Typography>
                   <FormControlLabel
                     control={
                       <Switch
                         checked={templateData.newUserNotification}
                         onChange={() => handleToggleAccessNotification(templateKey, 'newUserNotification')}
                         color="success"
                       />
                     }
                     label=""
                   />
                 </Box>
                 
                 <Typography variant="body2" color="text.secondary" gutterBottom>
                   Send welcome email to newly granted user
                 </Typography>

                 <Box sx={{ 
                   textAlign: 'center', 
                   py: 2, 
                   color: templateData.newUserNotification ? 'success.main' : 'text.disabled'
                 }}>
                   <Email sx={{ fontSize: 32, mb: 1 }} />
                   <Typography variant="body2">
                     {templateData.newUserNotification ? 'Enabled' : 'Disabled'}
                   </Typography>
                 </Box>
               </Paper>
             </Grid>
           )}

           {/* User Notification (for revoked/updated) */}
           {(templateKey === 'user-access-revoked' || templateKey === 'user-role-updated') && (
             <Grid item xs={12} md={4}>
               <Paper sx={{ p: 2, bgcolor: '#ff980010', border: '1px solid #ff980030' }}>
                 <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                   <Typography variant="subtitle1" fontWeight="bold" color="warning.main">
                     User Notification
                   </Typography>
                   <FormControlLabel
                     control={
                       <Switch
                         checked={templateData.userNotification}
                         onChange={() => handleToggleAccessNotification(templateKey, 'userNotification')}
                         color="warning"
                       />
                     }
                     label=""
                   />
                 </Box>
                 
                 <Typography variant="body2" color="text.secondary" gutterBottom>
                   Notify user of access changes
                 </Typography>

                 <Box sx={{ 
                   textAlign: 'center', 
                   py: 2, 
                   color: templateData.userNotification ? 'warning.main' : 'text.disabled'
                 }}>
                   <Notifications sx={{ fontSize: 32, mb: 1 }} />
                   <Typography variant="body2">
                     {templateData.userNotification ? 'Enabled' : 'Disabled'}
                   </Typography>
                 </Box>
               </Paper>
             </Grid>
           )}

           {/* Admin Notification */}
           <Grid item xs={12} md={4}>
             <Paper sx={{ p: 2, bgcolor: '#f4433610', border: '1px solid #f4433630' }}>
               <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                 <Typography variant="subtitle1" fontWeight="bold" color="error.main">
                   Admin Notification
                 </Typography>
                 <FormControlLabel
                   control={
                     <Switch
                       checked={templateData.adminNotification}
                       onChange={() => handleToggleAccessNotification(templateKey, 'adminNotification')}
                       color="error"
                     />
                   }
                   label=""
                 />
               </Box>
               
               <Typography variant="body2" color="text.secondary" gutterBottom>
                 Notify admins of access management changes
               </Typography>

               <Box sx={{ 
                 textAlign: 'center', 
                 py: 2, 
                 color: templateData.adminNotification ? 'error.main' : 'text.disabled'
               }}>
                 <AdminPanelSettings sx={{ fontSize: 32, mb: 1 }} />
                 <Typography variant="body2">
                   {templateData.adminNotification ? 'Enabled' : 'Disabled'}
                 </Typography>
               </Box>
             </Paper>
           </Grid>

           {/* ✅ FIXED: Custom Recipients with proper toggle and remove functionality */}
           <Grid item xs={12} md={4}>
             <Paper sx={{ p: 2, bgcolor: '#21969610', border: '1px solid #21969630' }}>
               <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                 <Typography variant="subtitle1" fontWeight="bold" color="info.main">
                  Custom Recipients
                </Typography>
                <Button
                  size="small"
                  startIcon={<Add />}
                  onClick={() => {
                    setDialogConfig({ lob: 'access', template: templateKey, type: 'customRecipients' });
                    setNewEmail({ email: '', name: '' });
                    setShowAddDialog(true);
                  }}
                  variant="outlined"
                  color="info"
                >
                  Add
                </Button>
              </Box>
              
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Additional recipients for access management notifications
              </Typography>

              {templateData.customRecipients?.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 2, color: 'text.secondary' }}>
                  <Group sx={{ fontSize: 32, opacity: 0.3, mb: 1 }} />
                  <Typography variant="body2">No custom recipients</Typography>
                </Box>
              ) : (
                <List dense>
                  {templateData.customRecipients?.map((recipient) => (
                    <ListItem key={recipient.id} sx={{ px: 0 }}>
                      <Avatar sx={{ width: 24, height: 24, mr: 1, bgcolor: 'info.main' }}>
                        {recipient.name[0]}
                      </Avatar>
                      <ListItemText
                        primary={recipient.name}
                        secondary={recipient.email}
                        sx={{ opacity: recipient.active ? 1 : 0.5 }}
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          size="small"
                          checked={recipient.active}
                          onChange={() => handleToggleAccessRecipient(templateKey, recipient.id)}
                        />
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveAccessRecipient(templateKey, recipient.id)}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </Paper>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

if (loading) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
      <CircularProgress size={60} />
      <Typography variant="h6" sx={{ ml: 2 }}>
        Loading enhanced email configuration from SharePoint...
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
          📧 Configure Recipients
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Configure email recipients by Line of Business and notification templates
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
    <Grid container spacing={3} sx={{ mb: 4 }}>
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
              onChange={(e) => setConfig(prev => ({ ...prev, testEmail: e.target.value }))}
              placeholder="Enter email for testing"
              helperText="This email will receive test notifications to verify SharePoint email integration"
              sx={{ mb: 2 }}
            />
            
            <Alert severity="info">
              <Typography variant="body2">
                The test email feature sends a sample notification to verify the SharePoint email system is working correctly.
              </Typography>
            </Alert>
          </CardContent>
        </Card>
      </Grid>
    </Grid>

    {/* Main Configuration Tabs */}
    <Paper sx={{ mb: 3 }}>
      <Tabs 
        value={activeTab} 
        onChange={(e, newValue) => setActiveTab(newValue)}
        variant="fullWidth"
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab 
          label="Procedure Templates" 
          icon={<Business />}
          sx={{ minHeight: 60 }}
        />
        <Tab 
          label="Access Management" 
          icon={<AdminPanelSettings />}
          sx={{ minHeight: 60 }}
        />
      </Tabs>
    </Paper>

    {/* Tab Content */}
    {activeTab === 0 && (
      <Box>
        <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
          📋 Procedure Templates Configuration
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
          Configure recipients for procedure-related notifications by Line of Business. 
          For template design changes, use the <strong>Custom Templates</strong> section.
        </Typography>

        {/* LOB Accordions */}
        {Object.keys(lobConfig).map((lob) => (
          <Accordion key={lob} defaultExpanded sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="h4">{lobConfig[lob].icon}</Typography>
                <Box>
                  <Typography variant="h6" fontWeight="bold" color={lobConfig[lob].color}>
                    {lob} Templates
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {lobConfig[lob].name}
                  </Typography>
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              {Object.keys(templateConfig).map((templateKey) => 
                renderLOBTemplate(lob, templateKey, templateConfig[templateKey])
              )}
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    )}

    {activeTab === 1 && (
      <Box>
        <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
          👥 Access Management Templates
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
          Configure notifications for user access management changes. These emails are sent when users are added, 
          removed, or their roles are updated through the access rights management system.
        </Typography>

        {Object.keys(accessTemplateConfig).map((templateKey) => 
          renderAccessTemplate(templateKey, accessTemplateConfig[templateKey])
        )}
      </Box>
    )}

    {/* Summary Statistics */}
    <Card sx={{ mt: 4 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          📊 Configuration Summary
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={3}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.main', color: 'primary.contrastText' }}>
              <Typography variant="h4" fontWeight="bold">
                {Object.keys(lobConfig).length}
              </Typography>
              <Typography variant="body2">
                Lines of Business
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'info.main', color: 'info.contrastText' }}>
              <Typography variant="h4" fontWeight="bold">
                {Object.keys(templateConfig).length}
              </Typography>
              <Typography variant="body2">
                Procedure Templates
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.main', color: 'warning.contrastText' }}>
              <Typography variant="h4" fontWeight="bold">
                {Object.keys(accessTemplateConfig).length}
              </Typography>
              <Typography variant="body2">
                Access Templates
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.main', color: 'success.contrastText' }}>
              <Typography variant="h4" fontWeight="bold">
                {defaultAdmins.length}
              </Typography>
              <Typography variant="body2">
                Default Admins
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </CardContent>
    </Card>

    {/* ✅ FIXED: Add Recipient Dialog with proper handling for access management */}
    <Dialog 
      open={showAddDialog} 
      onClose={() => setShowAddDialog(false)}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonAdd />
          Add Recipient
          {dialogConfig.lob !== 'access' && (
            <Chip 
              label={dialogConfig.lob} 
              size="small" 
              sx={{ backgroundColor: lobConfig[dialogConfig.lob]?.color + '20' }}
            />
          )}
          {dialogConfig.lob === 'access' && (
            <Chip 
              label="Access Management" 
              size="small" 
              color="info"
            />
          )}
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ pt: 1 }}>
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
            helperText="Leave blank to use email address as name"
          />
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button 
          onClick={() => setShowAddDialog(false)}
          startIcon={<Cancel />}
        >
          Cancel
        </Button>
        <Button 
          onClick={() => {
            if (dialogConfig.lob === 'access') {
              // ✅ FIXED: Handle access management recipients properly
              const { template, type } = dialogConfig;
              const newRecipient = {
                id: `custom_${Date.now()}_${Math.random()}`,
                email: newEmail.email.trim(),
                name: newEmail.name.trim() || newEmail.email.trim(),
                active: true
              };

              console.log(`✅ Adding access management recipient:`, newRecipient);

              setConfig(prev => ({
                ...prev,
                accessManagement: {
                  ...prev.accessManagement,
                  [template]: {
                    ...prev.accessManagement[template],
                    [type]: [...(prev.accessManagement[template][type] || []), newRecipient]
                  }
                }
              }));
            } else {
              // Handle LOB recipients
              handleSaveNewRecipient();
            }
            setShowAddDialog(false);
            setNewEmail({ email: '', name: '' });
          }}
          variant="contained"
          startIcon={<CheckCircle />}
          disabled={!newEmail.email || !newEmail.email.includes('@')}
        >
          Add Recipient
        </Button>
      </DialogActions>
    </Dialog>
  </Box>
);
};

export default ConfigureRecipients;
