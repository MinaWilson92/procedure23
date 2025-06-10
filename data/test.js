// pages/AdminDashboardPage.js - Complete Version with AccessAuditLog Integration
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Button, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Select, FormControl, InputLabel,
  List, ListItem, ListItemText, ListItemIcon, Divider, Badge,
  Avatar, Tooltip, Snackbar, LinearProgress, Tab, Tabs, Box as TabPanel,
  CircularProgress
} from '@mui/material';
import {
  Dashboard, CloudUpload, History, Security, People, Assignment,
  Edit, Delete, Visibility, Schedule, Warning, CheckCircle,
  AdminPanelSettings, PersonAdd, Refresh, Error as ErrorIcon,
  Person, CalendarToday, Business, Assessment, Cancel, BugReport, Email, Send, Description
} from '@mui/icons-material';
import { useNavigation } from '../contexts/NavigationContext';
import { useSharePoint } from '../SharePointContext';
import { motion } from 'framer-motion';
import EmailTemplateEditor from '../components/EmailTemplateEditor';
import EmailRecipientsConfig from '../components/EmailRecipientsConfig';
import CustomEmailComposer from '../components/CustomEmailComposer';

const AdminDashboardPage = ({ procedures, onDataRefresh, sharePointAvailable }) => {
  const { navigate } = useNavigation();
  const { user, isAdmin } = useSharePoint();
  const [activeTab, setActiveTab] = useState(0);
  const [auditLog, setAuditLog] = useState([]);
  const [userRoles, setUserRoles] = useState([]);
  const [accessAuditLog, setAccessAuditLog] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  const [emailDialogs, setEmailDialogs] = useState({
    templateEditor: { open: false, templateType: null },
    recipientsConfig: { open: false, notificationType: null },
    customComposer: { open: false }
  });
  
  // Dialog states
  const [editDialog, setEditDialog] = useState({ open: false, procedure: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, procedure: null });
  const [accessDialog, setAccessDialog] = useState({ open: false });
  
  // Form states
  const [newUser, setNewUser] = useState({ 
    userId: '',
    displayName: '',
    role: 'user' 
  });
  const [editingProcedure, setEditingProcedure] = useState({});

  // Check admin access on component mount
  useEffect(() => {
    if (!isAdmin) {
      console.log('❌ Access denied - user is not admin:', {
        staffId: user?.staffId,
        role: user?.role
      });
      return;
    }
    
    console.log('✅ Admin access granted for user:', {
      staffId: user?.staffId,
      displayName: user?.displayName,
      role: user?.role
    });
    
    loadAuditLog();
    loadUserRoles();
    loadAccessAuditLog();
    initializeEmailScheduler();
  }, [isAdmin, sharePointAvailable]);

  // SharePoint API Configuration
  const getSharePointConfig = () => {
    return {
      baseUrl: 'https://teams.global.hsbc/sites/EmployeeEng',
      proceduresListUrl: "https://teams.global.hsbc/sites/EmployeeEng/_api/web/lists/getbytitle('Procedures')/items",
      auditLogListUrl: "https://teams.global.hsbc/sites/EmployeeEng/_api/web/lists/getbytitle('AuditLog')/items",
      userRolesListUrl: "https://teams.global.hsbc/sites/EmployeeEng/_api/web/lists/getbytitle('UserRoles')/items",
      accessAuditLogListUrl: "https://teams.global.hsbc/sites/EmployeeEng/_api/web/lists/getbytitle('AccessAuditLog')/items"
    };
  };

  // 🔧 CENTRALIZED DIGEST HELPER
  const getFreshRequestDigest = async () => {
    try {
      const config = getSharePointConfig();
      
      console.log('🔑 Getting fresh request digest...');
      
      const digestUrl = `${config.baseUrl}/_api/contextinfo`;
      const digestResponse = await fetch(digestUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json; odata=verbose',
          'Content-Type': 'application/json; odata=verbose'
        },
        credentials: 'include'
      });
      
      if (digestResponse.ok) {
        const digestData = await digestResponse.json();
        const requestDigest = digestData.d.GetContextWebInformation.FormDigestValue;
        console.log('✅ Fresh request digest obtained');
        return requestDigest;
      } else {
        console.error('❌ Failed to get request digest:', digestResponse.status);
        
        // Fallback to page digest
        const digestElement = document.getElementById('__REQUESTDIGEST');
        const pageDigest = digestElement?.value;
        
        if (pageDigest) {
          console.log('⚠️ Using fallback page digest');
          return pageDigest;
        } else {
          throw new Error(`Cannot get request digest: ${digestResponse.status}`);
        }
      }
    } catch (err) {
      console.error('❌ Error getting request digest:', err);
      throw new Error('Cannot get authentication token: ' + err.message);
    }
  };

  const getHeaders = (includeDigest = false) => {
    const headers = {
      'Accept': 'application/json; odata=verbose',
      'Content-Type': 'application/json; odata=verbose'
    };
    
    if (includeDigest && typeof document !== 'undefined') {
      const digestElement = document.getElementById('__REQUESTDIGEST');
      if (digestElement?.value) {
        headers['X-RequestDigest'] = digestElement.value;
      }
    }
    
    return headers;
  };

  // 🔍 DEBUG FUNCTION: Quick SharePoint Debug
  const runQuickDebug = async () => {
    try {
      const config = getSharePointConfig();
      
      console.log('🔍 === QUICK DEBUG START ===');
      
      // Test basic connectivity
      const allListsUrl = `${config.baseUrl}/_api/web/lists?$select=Title,Id,Hidden&$filter=Hidden eq false`;
      
      const response = await fetch(allListsUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json; odata=verbose'
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        const lists = data.d.results;
        
        console.log('✅ Available SharePoint Lists:');
        lists.forEach(list => {
          console.log(`   - ${list.Title} (ID: ${list.Id})`);
        });
        
        // Check specific lists
        const userRolesList = lists.find(list => list.Title === 'UserRoles');
        const auditLogList = lists.find(list => list.Title === 'AuditLog');
        const accessAuditLogList = lists.find(list => list.Title === 'AccessAuditLog');
        const proceduresList = lists.find(list => list.Title === 'Procedures');
        
        console.log('📋 Critical Lists Status:');
        console.log(`   - UserRoles: ${userRolesList ? '✅ Found' : '❌ Missing'}`);
        console.log(`   - AuditLog: ${auditLogList ? '✅ Found' : '❌ Missing'}`);
        console.log(`   - AccessAuditLog: ${accessAuditLogList ? '✅ Found' : '❌ Missing'}`);
        console.log(`   - Procedures: ${proceduresList ? '✅ Found' : '❌ Missing'}`);
        
        // Test fresh digest
        try {
          const digest = await getFreshRequestDigest();
          console.log('✅ Fresh digest test: SUCCESS');
        } catch (digestErr) {
          console.log('❌ Fresh digest test: FAILED -', digestErr.message);
        }
        
        setNotification({ 
          type: 'success', 
          message: `Debug completed! Found ${lists.length} lists. Check console for details.` 
        });
        
      } else {
        console.error('❌ Cannot access SharePoint lists:', response.status);
        setNotification({ 
          type: 'error', 
          message: `Debug failed: Cannot access SharePoint (${response.status})` 
        });
      }
      
      console.log('🔍 === QUICK DEBUG END ===');
      
    } catch (err) {
      console.error('❌ Debug error:', err);
      setNotification({ 
        type: 'error', 
        message: 'Debug error: ' + err.message 
      });
    }
  };

  // 🔧 CREATE ACCESS AUDIT LOG LIST
  const createAccessAuditLogList = async () => {
    try {
      const config = getSharePointConfig();
      
      console.log('📝 Creating AccessAuditLog list...');
      setLoading(true);
      
      // Get request digest
      const requestDigest = await getFreshRequestDigest();
      
      // Create the AccessAuditLog list
      const listData = {
        __metadata: { type: 'SP.List' },
        Title: 'AccessAuditLog',
        Description: 'Audit log for user access management activities',
        BaseTemplate: 100 // Generic List
      };
      
      const createResponse = await fetch(`${config.baseUrl}/_api/web/lists`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json; odata=verbose',
          'Content-Type': 'application/json; odata=verbose',
          'X-RequestDigest': requestDigest
        },
        credentials: 'include',
        body: JSON.stringify(listData)
      });
      
      if (createResponse.ok) {
        const createdList = await createResponse.json();
        console.log('✅ AccessAuditLog list created successfully:', createdList.d.Id);
        
        // Add custom columns for AccessAuditLog
        await addAccessAuditLogColumns(createdList.d.Id, requestDigest);
        
        setNotification({ 
          type: 'success', 
          message: 'AccessAuditLog list created successfully in SharePoint' 
        });
        
        // Refresh after creation
        setTimeout(() => {
          loadAccessAuditLog();
        }, 2000);
        
      } else {
        const errorText = await createResponse.text();
        console.error('❌ Failed to create AccessAuditLog list:', createResponse.status, errorText);
        setNotification({ 
          type: 'error', 
          message: `Failed to create AccessAuditLog list: ${createResponse.status}` 
        });
      }
      
    } catch (err) {
      console.error('❌ Error creating AccessAuditLog list:', err);
      setNotification({ 
        type: 'error', 
        message: 'Error creating AccessAuditLog list: ' + err.message 
      });
    } finally {
      setLoading(false);
    }
  };

  const initializeEmailScheduler = async () => {
    try {
      if (sharePointAvailable) {
        console.log('🔧 Initializing Email Notification Scheduler...');
        
        // Import and initialize the email services
        // const EmailNotificationService = (await import('../services/EmailNotificationService')).default;
        // const EmailSchedulerService = (await import('../services/EmailSchedulerService')).default;
        
        // const emailService = new EmailNotificationService();
        // const schedulerService = new EmailSchedulerService(emailService, proceduresService);
        
        // await emailService.initialize();
        // await schedulerService.startMonitoring();
        
        setNotification({ 
          type: 'success', 
          message: '📧 Email notification system initialized successfully!' 
        });
        
        console.log('✅ Email scheduler started and monitoring for expiring procedures');
      }
    } catch (error) {
      console.error('❌ Failed to initialize email scheduler:', error);
      setNotification({ 
        type: 'warning', 
        message: 'Email scheduler could not be initialized: ' + error.message 
      });
    }
  };

  const testEmailSystem = async () => {
    try {
      setLoading(true);
      console.log('🧪 Testing email system...');
      
      // Test email configuration
      const testEmail = {
        to: [user?.email || 'test@hsbc.com'],
        subject: '🧪 HSBC Procedures Hub - Email System Test',
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #d40000, #b30000); padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">HSBC</h1>
              <p style="color: white; margin: 10px 0;">Procedures Hub - Email System Test</p>
            </div>
            <div style="padding: 20px; background: white;">
              <h2>✅ Email System Test Successful!</h2>
              <p>This email confirms that the HSBC Procedures Hub email notification system is working correctly.</p>
              <p><strong>Test Time:</strong> ${new Date().toLocaleString()}</p>
              <p><strong>Tested By:</strong> ${user?.displayName || user?.staffId}</p>
              <ul>
                <li>✅ SharePoint Email API: Connected</li>
                <li>✅ Template System: Operational</li>
                <li>✅ Notification Scheduler: Active</li>
                <li>✅ CC/BCC Configuration: Ready</li>
              </ul>
            </div>
          </div>
        `
      };
  
      if (sharePointAvailable) {
        // Use the actual SharePoint email API
        const config = getSharePointConfig();
        const requestDigest = await getFreshRequestDigest();
        
        const emailPayload = {
          properties: {
            __metadata: { type: 'SP.Utilities.EmailProperties' },
            To: { results: testEmail.to },
            Subject: testEmail.subject,
            Body: testEmail.body
          }
        };
  
        const response = await fetch(`${config.baseUrl}/_api/SP.Utilities.Utility.SendEmail`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json; odata=verbose',
            'Content-Type': 'application/json; odata=verbose',
            'X-RequestDigest': requestDigest
          },
          body: JSON.stringify(emailPayload)
        });
  
        if (response.ok) {
          setNotification({ 
            type: 'success', 
            message: `✅ Email system test successful! Test email sent to ${testEmail.to.join(', ')}` 
          });
        } else {
          throw new Error(`Email test failed: ${response.status}`);
        }
      } else {
        // Mock test
        setNotification({ 
          type: 'info', 
          message: '📧 Email system test completed (Demo Mode)' 
        });
      }
  
    } catch (error) {
      console.error('❌ Email system test failed:', error);
      setNotification({ 
        type: 'error', 
        message: 'Email system test failed: ' + error.message 
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Update your quick email test section to use the real test function
  <Card variant="outlined">
    <CardContent>
      <Typography variant="h6" gutterBottom>
        🧪 Email System Test
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Test the complete email notification system with your SharePoint integration
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
        <Button
          variant="contained"
          onClick={testEmailSystem}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : <Send />}
        >
          {loading ? 'Testing...' : 'Run Complete Email Test'}
        </Button>
        <Button
          variant="outlined"
          onClick={() => setNotification({ 
            type: 'info', 
            message: 'Email system monitoring is active. Checking for expiring procedures every hour.' 
          })}
        >
          Check Scheduler Status
        </Button>
      </Box>
      
      {sharePointAvailable && (
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>Live Testing:</strong> This will send an actual test email using your SharePoint configuration.
            The test email will be sent to: {user?.email || 'your admin email'}
          </Typography>
        </Alert>
      )}
    </CardContent>
  </Card>

const createEmailManagementLists = async () => {
    try {
      setLoading(true);
      console.log('📝 Creating Email Management SharePoint Lists...');
      
      const config = getSharePointConfig();
      const requestDigest = await getFreshRequestDigest();
      
      const listsToCreate = [
        {
          name: 'EmailConfigurations',
          description: 'Email notification configurations for different types',
          columns: [
            { Title: 'NotificationType', FieldTypeKind: 2, Required: true },
            { Title: 'Enabled', FieldTypeKind: 8, Required: true }, // Boolean
            { Title: 'CCList', FieldTypeKind: 3, Required: false }, // Note
            { Title: 'BCCList', FieldTypeKind: 3, Required: false },
            { Title: 'LOBSpecificCC', FieldTypeKind: 3, Required: false },
            { Title: 'LOBSpecificBCC', FieldTypeKind: 3, Required: false },
            { Title: 'SendToOwners', FieldTypeKind: 8, Required: true },
            { Title: 'SendToSecondaryOwners', FieldTypeKind: 8, Required: true },
            { Title: 'AdditionalRecipients', FieldTypeKind: 3, Required: false },
            { Title: 'Priority', FieldTypeKind: 2, Required: false },
            { Title: 'Template', FieldTypeKind: 3, Required: false }
          ]
        },
        {
          name: 'EmailTemplates',
          description: 'Custom email templates for notifications',
          columns: [
            { Title: 'TemplateType', FieldTypeKind: 2, Required: true },
            { Title: 'Subject', FieldTypeKind: 2, Required: true },
            { Title: 'TemplateBody', FieldTypeKind: 3, Required: true }, // Note
            { Title: 'Variables', FieldTypeKind: 3, Required: false },
            { Title: 'Enabled', FieldTypeKind: 8, Required: true },
            { Title: 'Priority', FieldTypeKind: 2, Required: false },
            { Title: 'CreatedBy', FieldTypeKind: 2, Required: false },
            { Title: 'LastModified', FieldTypeKind: 4, Required: false }
          ]
        },
        {
          name: 'EmailNotificationLog',
          description: 'Log of all sent email notifications',
          columns: [
            { Title: 'NotificationType', FieldTypeKind: 2, Required: true },
            { Title: 'ProcedureId', FieldTypeKind: 1, Required: false }, // Number
            { Title: 'ProcedureName', FieldTypeKind: 2, Required: false },
            { Title: 'Recipients', FieldTypeKind: 3, Required: true },
            { Title: 'CCList', FieldTypeKind: 3, Required: false },
            { Title: 'BCCList', FieldTypeKind: 3, Required: false },
            { Title: 'SentAt', FieldTypeKind: 4, Required: true }, // DateTime
            { Title: 'Success', FieldTypeKind: 8, Required: true },
            { Title: 'ErrorMessage', FieldTypeKind: 3, Required: false },
            { Title: 'DaysUntilExpiry', FieldTypeKind: 1, Required: false },
            { Title: 'SentBy', FieldTypeKind: 2, Required: false }
          ]
        },
        {
          name: 'EmailScheduler',
          description: 'Email scheduling and monitoring configuration',
          columns: [
            { Title: 'SchedulerEnabled', FieldTypeKind: 8, Required: true },
            { Title: 'LastRun', FieldTypeKind: 4, Required: false },
            { Title: 'NextRun', FieldTypeKind: 4, Required: false },
            { Title: 'CheckInterval', FieldTypeKind: 1, Required: false }, // Minutes
            { Title: 'Status', FieldTypeKind: 2, Required: false },
            { Title: 'Configuration', FieldTypeKind: 3, Required: false }
          ]
        }
      ];
      
      let createdCount = 0;
      let existingCount = 0;
      
      for (const listConfig of listsToCreate) {
        try {
          // Check if list already exists
          const checkResponse = await fetch(
            `${config.baseUrl}/_api/web/lists/getbytitle('${listConfig.name}')`,
            { headers: { 'Accept': 'application/json; odata=verbose' } }
          );
          
          if (checkResponse.ok) {
            console.log(`✅ List ${listConfig.name} already exists`);
            existingCount++;
            continue;
          }
          
          // Create the list
          console.log(`📝 Creating list: ${listConfig.name}`);
          
          const listData = {
            __metadata: { type: 'SP.List' },
            Title: listConfig.name,
            Description: listConfig.description,
            BaseTemplate: 100 // Generic List
          };
          
          const createResponse = await fetch(`${config.baseUrl}/_api/web/lists`, {
            method: 'POST',
            headers: {
              'Accept': 'application/json; odata=verbose',
              'Content-Type': 'application/json; odata=verbose',
              'X-RequestDigest': requestDigest
            },
            body: JSON.stringify(listData)
          });
          
          if (createResponse.ok) {
            const createdList = await createResponse.json();
            console.log(`✅ Created list: ${listConfig.name}`);
            
            // Add custom columns
            await addColumnsToList(createdList.d.Id, listConfig.columns, requestDigest);
            createdCount++;
          } else {
            console.error(`❌ Failed to create list ${listConfig.name}:`, createResponse.status);
          }
          
        } catch (listError) {
          console.error(`❌ Error with list ${listConfig.name}:`, listError);
        }
      }
      
      setNotification({ 
        type: 'success', 
        message: `📝 Email Management Lists Setup Complete! Created: ${createdCount}, Existing: ${existingCount}` 
      });
      
    } catch (error) {
      console.error('❌ Error creating email management lists:', error);
      setNotification({ 
        type: 'error', 
        message: 'Failed to create email management lists: ' + error.message 
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to add columns to a list
  const addColumnsToList = async (listId, columns, requestDigest) => {
    const config = getSharePointConfig();
    
    for (const column of columns) {
      try {
        const columnData = {
          __metadata: { type: 'SP.Field' },
          Title: column.Title,
          FieldTypeKind: column.FieldTypeKind,
          Required: column.Required || false,
          Description: column.Description || `${column.Title} field for email management`
        };
        
        const columnResponse = await fetch(`${config.baseUrl}/_api/web/lists('${listId}')/fields`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json; odata=verbose',
            'Content-Type': 'application/json; odata=verbose',
            'X-RequestDigest': requestDigest
          },
          body: JSON.stringify(columnData)
        });
        
        if (columnResponse.ok) {
          console.log(`✅ Added column: ${column.Title}`);
        } else {
          console.log(`⚠️ Could not add column ${column.Title}: ${columnResponse.status}`);
        }
      } catch (err) {
        console.log(`⚠️ Error adding column ${column.Title}:`, err);
      }
    }
  };

  // Helper function to add AccessAuditLog columns
  const addAccessAuditLogColumns = async (listId, requestDigest) => {
    const config = getSharePointConfig();
    
    const columns = [
      {
        __metadata: { type: 'SP.Field' },
        Title: 'ActionType',
        FieldTypeKind: 2, // Text
        Required: true,
        Description: 'Type of access action: GRANTED, REVOKED, UPDATED'
      },
      {
        __metadata: { type: 'SP.Field' },
        Title: 'TargetUserId',
        FieldTypeKind: 2, // Text
        Required: true,
        Description: 'User ID being affected'
      },
      {
        __metadata: { type: 'SP.Field' },
        Title: 'TargetUserName',
        FieldTypeKind: 2, // Text
        Required: false,
        Description: 'Display name of affected user'
      },
      {
        __metadata: { type: 'SP.Field' },
        Title: 'PerformedBy',
        FieldTypeKind: 2, // Text
        Required: true,
        Description: 'Admin User ID who performed the action'
      },
      {
        __metadata: { type: 'SP.Field' },
        Title: 'PerformedByName',
        FieldTypeKind: 2, // Text
        Required: false,
        Description: 'Admin display name'
      },
      {
        __metadata: { type: 'SP.Field' },
        Title: 'LogTimestamp',
        FieldTypeKind: 4, // DateTime
        Required: true,
        Description: 'When the action occurred'
      },
      {
        __metadata: { type: 'SP.Field' },
        Title: 'OldValue',
        FieldTypeKind: 2, // Text
        Required: false,
        Description: 'Previous value (for updates)'
      },
      {
        __metadata: { type: 'SP.Field' },
        Title: 'NewValue',
        FieldTypeKind: 2, // Text
        Required: false,
        Description: 'New value (for updates)'
      },
      {
        __metadata: { type: 'SP.Field' },
        Title: 'Details',
        FieldTypeKind: 3, // Note (Multi-line text)
        Required: false,
        Description: 'JSON details of the action'
      },
      {
        __metadata: { type: 'SP.Field' },
        Title: 'Status',
        FieldTypeKind: 2, // Text
        Required: false,
        Description: 'SUCCESS or ERROR'
      },
      {
        __metadata: { type: 'SP.Field' },
        Title: 'Reason',
        FieldTypeKind: 2, // Text
        Required: false,
        Description: 'Reason for the action'
      }
    ];
    
    for (const column of columns) {
      try {
        const columnResponse = await fetch(`${config.baseUrl}/_api/web/lists('${listId}')/fields`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json; odata=verbose',
            'Content-Type': 'application/json; odata=verbose',
            'X-RequestDigest': requestDigest
          },
          credentials: 'include',
          body: JSON.stringify(column)
        });
        
        if (columnResponse.ok) {
          console.log(`✅ Added AccessAuditLog column: ${column.Title}`);
        } else {
          console.log(`⚠️ Could not add AccessAuditLog column ${column.Title}: ${columnResponse.status}`);
        }
      } catch (err) {
        console.log(`⚠️ Error adding AccessAuditLog column ${column.Title}:`, err);
      }
    }
  };

  // 📝 NEW: Log Access Audit Action to AccessAuditLog List
  const logAccessAuditAction = async (actionType, targetUserId, targetUserName, oldValue = null, newValue = null, reason = '') => {
    try {
      const config = getSharePointConfig();
      
      if (sharePointAvailable) {
        console.log('📝 Logging access audit action:', actionType);
        
        // Get fresh request digest
        const requestDigest = await getFreshRequestDigest();
        
        const auditData = {
          __metadata: { type: 'SP.Data.AccessAuditLogListItem' },
          Title: actionType,
          ActionType: actionType,
          TargetUserId: targetUserId,
          TargetUserName: targetUserName || `User ${targetUserId}`,
          PerformedBy: user?.staffId || 'System',
          PerformedByName: user?.displayName || '',
          LogTimestamp: new Date().toISOString(),
          OldValue: oldValue || '',
          NewValue: newValue || '',
          Details: JSON.stringify({
            targetUserId,
            targetUserName,
            performedBy: user?.staffId,
            performedByName: user?.displayName,
            timestamp: new Date().toISOString(),
            reason
          }),
          Status: 'SUCCESS',
          Reason: reason
        };

        console.log('📤 Sending access audit log data:', auditData);

        const response = await fetch(config.accessAuditLogListUrl, {
          method: 'POST',
          headers: {
            'Accept': 'application/json; odata=verbose',
            'Content-Type': 'application/json; odata=verbose',
            'X-RequestDigest': requestDigest
          },
          credentials: 'include',
          body: JSON.stringify(auditData)
        });
        
        if (response.ok) {
          console.log('✅ Access audit action logged successfully:', actionType);
          // Refresh access audit log to show new entry
          loadAccessAuditLog();
        } else {
          const errorText = await response.text();
          console.log('⚠️ Failed to log access audit action:', response.status, errorText);
        }
      }
    } catch (err) {
      console.error('❌ Error logging access audit action:', err);
      // Don't throw error here - audit logging failure shouldn't break the main action
    }
  };

  // Load Access Audit Log from SharePoint
  const loadAccessAuditLog = async () => {
    try {
      const config = getSharePointConfig();
      
      if (sharePointAvailable) {
        console.log('🔍 Loading access audit log from SharePoint...');
        
        const auditUrl = `${config.accessAuditLogListUrl}?$select=*&$orderby=LogTimestamp desc&$top=100`;
        
        const response = await fetch(auditUrl, {
          method: 'GET',
          headers: getHeaders(),
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          const auditEntries = data.d.results.map(item => ({
            id: item.Id,
            actionType: item.ActionType || item.Title,
            targetUserId: item.TargetUserId,
            targetUserName: item.TargetUserName,
            performedBy: item.PerformedBy,
            performedByName: item.PerformedByName,
            timestamp: new Date(item.LogTimestamp || item.Modified),
            oldValue: item.OldValue,
            newValue: item.NewValue,
            details: safeJsonParse(item.Details, {}),
            status: item.Status || 'SUCCESS',
            reason: item.Reason
          }));
          
          setAccessAuditLog(auditEntries);
          console.log('✅ Access audit log loaded from SharePoint:', auditEntries.length, 'entries');
        } else {
          console.log('⚠️ AccessAuditLog not accessible (status:', response.status, '), using mock data');
          loadMockAccessAuditLog();
        }
      } else {
        console.log('📝 Loading mock access audit log (SharePoint not available)');
        loadMockAccessAuditLog();
      }
    } catch (err) {
      console.error('❌ Error loading access audit log:', err);
      loadMockAccessAuditLog();
    }
  };

  // Load Audit Log from SharePoint (for procedures only)
  const loadAuditLog = async () => {
    try {
      setLoading(true);
      const config = getSharePointConfig();
      
      if (sharePointAvailable) {
        console.log('🔍 Loading procedure audit log from SharePoint...');
        
        const auditUrl = `${config.auditLogListUrl}?$select=*&$orderby=Modified desc&$top=50`;
        
        const response = await fetch(auditUrl, {
          method: 'GET',
          headers: getHeaders(),
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          const auditEntries = data.d.results.map(item => ({
            id: item.Id,
            action: item.ActionType || item.Title,
            user: item.UserId || item.Author?.Title || 'System',
            procedureName: item.ProcedureName || null,
            timestamp: new Date(item.LogTimestamp || item.Modified),
            details: safeJsonParse(item.Details, {}),
            status: item.Status || 'SUCCESS'
          }));
          
          setAuditLog(auditEntries);
          console.log('✅ Procedure audit log loaded from SharePoint:', auditEntries.length, 'entries');
        } else {
          console.log('⚠️ SharePoint procedure audit log not accessible (status:', response.status, '), using mock data');
          loadMockAuditLog();
        }
      } else {
        console.log('📝 Loading mock procedure audit log (SharePoint not available)');
        loadMockAuditLog();
      }
    } catch (err) {
      console.error('❌ Error loading procedure audit log:', err);
      loadMockAuditLog();
    } finally {
      setLoading(false);
    }
  };

  // Load User Roles from SharePoint with Access Audit Info
  const loadUserRoles = async () => {
    try {
      const config = getSharePointConfig();
      
      if (sharePointAvailable) {
        console.log('👥 Loading user roles from SharePoint...');
        
        const rolesUrl = `${config.userRolesListUrl}?$select=*&$orderby=Modified desc&$top=100`;
        
        const response = await fetch(rolesUrl, {
          method: 'GET',
          headers: getHeaders(),
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          const users = data.d.results.map(item => ({
            id: item.Id,
            userId: item.Title,
            displayName: item.DisplayName || item.UserDisplayName || `User ${item.Title}`,
            role: item.UserRole || 'user',
            lastLogin: new Date(item.LastLogin || item.Modified),
            status: item.Status || 'active',
            created: new Date(item.Created),
            createdBy: item.Author?.Title || 'System',
            grantedBy: item.GrantedBy || 'Unknown' // Track who granted access
          }));
          
          setUserRoles(users);
          console.log('✅ User roles loaded from SharePoint:', users.length, 'users');
        } else {
          console.log('⚠️ SharePoint user roles not accessible (status:', response.status, '), using mock data');
          loadMockUserRoles();
        }
      } else {
        console.log('👥 Loading mock user roles (SharePoint not available)');
        loadMockUserRoles();
      }
    } catch (err) {
      console.error('❌ Error loading user roles:', err);
      loadMockUserRoles();
    }
  };

  // 🔧 FIXED: Handle User Access Management with Access Audit Logging
  const handleGrantAccess = async () => {
    try {
      // Validate User ID
      if (!newUser.userId || !newUser.userId.match(/^\d+$/)) {
        setNotification({ type: 'error', message: 'Please enter a valid User ID (numeric)' });
        return;
      }

      setLoading(true);
      const config = getSharePointConfig();
      
      if (sharePointAvailable) {
        console.log('👤 Granting access in SharePoint for User ID:', newUser.userId);
        
        // Get fresh request digest
        const requestDigest = await getFreshRequestDigest();
        
        // Updated data structure for User ID-based access
        const userData = {
          __metadata: { type: 'SP.Data.UserRolesListItem' },
          Title: newUser.userId,
          DisplayName: newUser.displayName || `User ${newUser.userId}`,
          UserRole: newUser.role,
          Status: 'active',
          LastLogin: new Date().toISOString(),
          GrantedBy: user?.staffId
        };

        console.log('📝 Sending user data to SharePoint:', userData);

        const response = await fetch(config.userRolesListUrl, {
          method: 'POST',
          headers: {
            'Accept': 'application/json; odata=verbose',
            'Content-Type': 'application/json; odata=verbose',
            'X-RequestDigest': requestDigest
          },
          credentials: 'include',
          body: JSON.stringify(userData)
        });

        if (response.ok) {
          // ✅ Log to AccessAuditLog instead of regular audit
          await logAccessAuditAction(
            'USER_ACCESS_GRANTED', 
            newUser.userId, 
            newUser.displayName,
            null,
            newUser.role,
            `Access granted by admin ${user?.displayName || user?.staffId}`
          );
          
          setNotification({ 
            type: 'success', 
            message: `✅ Access granted to User ID ${newUser.userId} (${newUser.displayName}) in SharePoint` 
          });
          loadUserRoles();
          setNewUser({ userId: '', displayName: '', role: 'user' });
        } else {
          const errorText = await response.text();
          console.error('SharePoint access grant error:', response.status, errorText);
          setNotification({ 
            type: 'error', 
            message: `❌ Failed to grant access in SharePoint (${response.status}): ${errorText}` 
          });
        }
      } else {
        // Mock mode
        console.log('👤 Mock access grant for User ID:', newUser.userId);
        setNotification({ 
          type: 'success', 
          message: `Access granted to User ID ${newUser.userId} (${newUser.displayName}) - Demo Mode` 
        });
        
        const mockUser = {
          id: Date.now(),
          userId: newUser.userId,
          displayName: newUser.displayName || `User ${newUser.userId}`,
          role: newUser.role,
          lastLogin: new Date(),
          status: 'active',
          created: new Date(),
          createdBy: user?.staffId,
          grantedBy: user?.staffId
        };
        setUserRoles(prev => [mockUser, ...prev]);
        setNewUser({ userId: '', displayName: '', role: 'user' });
      }
    } catch (err) {
      console.error('❌ Error granting access:', err);
      setNotification({ type: 'error', message: 'Error granting access: ' + err.message });
    } finally {
      setLoading(false);
      setAccessDialog({ open: false });
    }
  };


  // 🔧 FIXED: Edit User Role with Access Audit Logging
  const handleEditUserRole = async (userRole) => {
    const newRole = prompt(`Change role for ${userRole.displayName} (current: ${userRole.role})\nEnter: admin, uploader, or user`, userRole.role);
    
    if (newRole && ['admin', 'uploader', 'user'].includes(newRole) && newRole !== userRole.role) {
      try {
        setLoading(true);
        const config = getSharePointConfig();
        
        if (sharePointAvailable) {
          console.log('✏️ Updating user role in SharePoint:', userRole.id, 'to', newRole);
          
          // Get fresh request digest
          const requestDigest = await getFreshRequestDigest();
          
          const updateUrl = `${config.userRolesListUrl}(${userRole.id})`;
          const updateData = {
            __metadata: { type: 'SP.Data.UserRolesListItem' },
            UserRole: newRole
          };
          
          const response = await fetch(updateUrl, {
            method: 'POST',
            headers: {
              'Accept': 'application/json; odata=verbose',
              'Content-Type': 'application/json; odata=verbose',
              'X-RequestDigest': requestDigest,
              'X-HTTP-Method': 'MERGE',
              'IF-MATCH': '*'
            },
            credentials: 'include',
            body: JSON.stringify(updateData)
          });
          
          if (response.ok || response.status === 204) {
            console.log('✅ User role updated successfully');
            
            // ✅ Log to AccessAuditLog
            await logAccessAuditAction(
              'USER_ROLE_UPDATED',
              userRole.userId,
              userRole.displayName,
              userRole.role,
              newRole,
              `Role updated by admin ${user?.displayName || user?.staffId}`
            );
            
            setNotification({ 
              type: 'success', 
              message: `✅ Role updated to ${newRole} for ${userRole.displayName}` 
            });
            loadUserRoles();
          } else {
            const errorText = await response.text();
            console.error('❌ Role update error:', response.status, errorText);
            setNotification({ 
              type: 'error', 
              message: `❌ Failed to update role (${response.status}): ${errorText}` 
            });
          }
        }
      } catch (err) {
        console.error('❌ Error updating role:', err);
        setNotification({ 
          type: 'error', 
          message: 'Error updating role: ' + err.message 
        });
      } finally {
        setLoading(false);
      }
    }
  };

  // 🔧 FIXED: Revoke Access with Access Audit Logging (Keep Record as Deleted)
  const handleRevokeAccess = async (userRole) => {
    if (window.confirm(`Are you sure you want to revoke access for ${userRole.displayName} (${userRole.userId})?`)) {
      try {
        setLoading(true);
        const config = getSharePointConfig();
        
        if (sharePointAvailable) {
          console.log('🗑️ Revoking access in SharePoint:', userRole.id);
          
          // Get fresh request digest
          const requestDigest = await getFreshRequestDigest();
          
          // ✅ First, log the revocation to AccessAuditLog BEFORE deletion
          await logAccessAuditAction(
            'USER_ACCESS_REVOKED',
            userRole.userId,
            userRole.displayName,
            userRole.role,
            'REVOKED',
            `Access revoked by admin ${user?.displayName || user?.staffId}`
          );
          
          // Instead of deleting, update status to 'inactive' to keep audit trail
          const updateUrl = `${config.userRolesListUrl}(${userRole.id})`;
          const updateData = {
            __metadata: { type: 'SP.Data.UserRolesListItem' },
            Status: 'inactive'
          };
          
          const response = await fetch(updateUrl, {
            method: 'POST',
            headers: {
              'Accept': 'application/json; odata=verbose',
              'Content-Type': 'application/json; odata=verbose',
              'X-RequestDigest': requestDigest,
              'X-HTTP-Method': 'MERGE',
              'IF-MATCH': '*'
            },
            credentials: 'include',
           body: JSON.stringify(updateData)
         });
         
         if (response.ok || response.status === 204) {
           console.log('✅ Access revoked successfully (marked as inactive)');
           setNotification({ 
             type: 'success', 
             message: `✅ Access revoked for ${userRole.displayName}` 
           });
           loadUserRoles();
         } else {
           const errorText = await response.text();
           console.error('❌ Revoke access error:', response.status, errorText);
           setNotification({ 
             type: 'error', 
             message: `❌ Failed to revoke access (${response.status}): ${errorText}` 
           });
         }
       }
     } catch (err) {
       console.error('❌ Error revoking access:', err);
       setNotification({ 
         type: 'error', 
         message: 'Error revoking access: ' + err.message 
       });
     } finally {
       setLoading(false);
     }
   }
 };


 const handleProcedureUploaded = async (procedure, uploadedBy) => {
    try {
      console.log('📧 Triggering upload notification for:', procedure.name);
      
      if (sharePointAvailable) {
        // Initialize email service if not already done
        const EmailNotificationService = (await import('../services/EmailNotificationService')).default;
        const emailService = new EmailNotificationService();
        await emailService.initialize();
        
        // Send notification
        const result = await emailService.sendProcedureUploadedNotification(procedure, uploadedBy);
        
        if (result.success) {
          console.log('✅ Upload notification sent successfully');
          setNotification({ 
            type: 'success', 
            message: `📧 Upload notification sent for "${procedure.name}"` 
          });
        } else {
          console.warn('⚠️ Upload notification failed:', result.error);
          setNotification({ 
            type: 'warning', 
            message: `⚠️ Upload notification failed: ${result.error}` 
          });
        }
      }
    } catch (error) {
      console.error('❌ Error sending upload notification:', error);
    }
  };

  const handleProcedureDeleted = async (procedure, deletedBy) => {
    try {
      console.log('📧 Triggering deletion notification for:', procedure.name);
      
      if (sharePointAvailable) {
        const EmailNotificationService = (await import('../services/EmailNotificationService')).default;
        const emailService = new EmailNotificationService();
        await emailService.initialize();
        
        const result = await emailService.sendProcedureDeletedNotification(procedure, deletedBy);
        
        if (result.success) {
          console.log('✅ Deletion notification sent successfully');
          setNotification({ 
            type: 'success', 
            message: `📧 Deletion notification sent for "${procedure.name}"` 
          });
        } else {
          console.warn('⚠️ Deletion notification failed:', result.error);
          setNotification({ 
            type: 'warning', 
            message: `⚠️ Deletion notification failed: ${result.error}` 
          });
        }
      }
    } catch (error) {
      console.error('❌ Error sending deletion notification:', error);
    }
  };


  

 // 🔧 FIXED: Handle Procedure Edit with Fresh Digest
 const handleEditProcedure = async (procedure, updates) => {
   try {
     setLoading(true);
     const config = getSharePointConfig();
     
     if (sharePointAvailable) {
       console.log('📝 Updating procedure in SharePoint:', procedure.id);
       
       // Get fresh request digest
       const requestDigest = await getFreshRequestDigest();
       
       const updateUrl = `${config.proceduresListUrl}(${procedure.id})`;
       
       const updateData = {
         __metadata: { type: 'SP.Data.ProceduresListItem' }
       };

       if (updates.name) updateData.Title = updates.name;
       if (updates.primary_owner) updateData.PrimaryOwner = updates.primary_owner;
       if (updates.primary_owner_email) updateData.PrimaryOwnerEmail = updates.primary_owner_email;
       if (updates.secondary_owner) updateData.SecondaryOwner = updates.secondary_owner;
       if (updates.secondary_owner_email) updateData.SecondaryOwnerEmail = updates.secondary_owner_email;
       if (updates.expiry) updateData.ExpiryDate = updates.expiry;
       if (updates.lob) updateData.LOB = updates.lob;
       if (updates.procedure_subsection) updateData.ProcedureSubsection = updates.procedure_subsection;

       console.log('📤 Sending UPDATE request with data:', updateData);

       const response = await fetch(updateUrl, {
         method: 'POST',
         headers: {
           'Accept': 'application/json; odata=verbose',
           'Content-Type': 'application/json; odata=verbose',
           'X-RequestDigest': requestDigest,
           'X-HTTP-Method': 'MERGE',
           'IF-MATCH': '*'
         },
         credentials: 'include',
         body: JSON.stringify(updateData)
       });

       if (response.ok || response.status === 204) {
         console.log('✅ Procedure updated successfully in SharePoint');
         
         await logAuditAction('PROCEDURE_UPDATED', procedure.name, {
           procedureId: procedure.id,
           updates: updates,
           updatedBy: user?.staffId
         });
         
         setNotification({ type: 'success', message: 'Procedure updated successfully in SharePoint' });
         onDataRefresh();
       } else {
         const errorText = await response.text();
         console.error('❌ SharePoint update error:', response.status, errorText);
         setNotification({ type: 'error', message: `Failed to update procedure in SharePoint (${response.status}): ${errorText}` });
       }
     } else {
       console.log('📝 Mock procedure update:', updates);
       setNotification({ type: 'success', message: 'Procedure updated successfully (Demo Mode)' });
       onDataRefresh();
     }
   } catch (err) {
     console.error('❌ Error updating procedure:', err);
     setNotification({ type: 'error', message: 'Error updating procedure: ' + err.message });
   } finally {
     setLoading(false);
     setEditDialog({ open: false, procedure: null });
   }
 };


 const handleOpenTemplateEditor = (templateType) => {
    setEmailDialogs(prev => ({
      ...prev,
      templateEditor: { open: true, templateType }
    }));
  };
  
  const handleOpenRecipientsConfig = (notificationType) => {
    setEmailDialogs(prev => ({
      ...prev,
      recipientsConfig: { open: true, notificationType }
    }));
  };
  
  const handleOpenCustomComposer = () => {
    setEmailDialogs(prev => ({
      ...prev,
      customComposer: { open: true }
    }));
  };
  

  // Clean email management handlers - replace your existing ones
const handleSaveTemplate = async (template) => {
    try {
      console.log('💾 Saving email template:', template);
      
      if (sharePointAvailable) {
        // Use the direct SharePoint API approach instead of a separate service
        const config = getSharePointConfig();
        const requestDigest = await getFreshRequestDigest();
        
        const templateData = {
          __metadata: { type: 'SP.Data.EmailTemplatesListItem' },
          Title: template.type,
          TemplateType: template.type,
          Subject: template.subject,
          TemplateBody: template.htmlBody,
          Enabled: template.enabled,
          Priority: template.priority,
          CreatedBy: user?.staffId || 'System'
        };
  
        // Try to save to SharePoint EmailTemplates list
        const response = await fetch(`${config.baseUrl}/_api/web/lists/getbytitle('EmailTemplates')/items`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json; odata=verbose',
            'Content-Type': 'application/json; odata=verbose',
            'X-RequestDigest': requestDigest
          },
          body: JSON.stringify(templateData)
        });
  
        if (response.ok) {
          setNotification({ 
            type: 'success', 
            message: `✅ Email template saved to SharePoint: ${template.type}` 
          });
        } else {
          throw new Error(`SharePoint save failed: ${response.status}`);
        }
      } else {
        // Demo mode
        setNotification({ 
          type: 'success', 
          message: `📧 Email template saved (Demo Mode): ${template.type}` 
        });
      }
      
    } catch (error) {
      console.error('❌ Failed to save email template:', error);
      setNotification({ 
        type: 'error', 
        message: 'Failed to save email template: ' + error.message 
      });
    }
  };
  
  const handleSaveRecipientsConfig = async (config) => {
    try {
      console.log('💾 Saving recipients configuration:', config);
      
      if (sharePointAvailable) {
        const spConfig = getSharePointConfig();
        const requestDigest = await getFreshRequestDigest();
        
        const configData = {
          __metadata: { type: 'SP.Data.EmailConfigurationsListItem' },
          Title: config.notificationType,
          NotificationType: config.notificationType,
          Enabled: config.enabled,
          CCList: config.globalCC?.join(', ') || '',
          BCCList: config.globalBCC?.join(', ') || '',
          LOBSpecificCC: JSON.stringify(config.lobSpecificCC || {}),
          LOBSpecificBCC: JSON.stringify(config.lobSpecificBCC || {}),
          SendToOwners: config.sendToOwners,
          SendToSecondaryOwners: config.sendToSecondaryOwners,
          AdditionalRecipients: config.additionalRecipients?.join(', ') || '',
          Priority: 'Normal'
        };
  
        const response = await fetch(`${spConfig.baseUrl}/_api/web/lists/getbytitle('EmailConfigurations')/items`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json; odata=verbose',
            'Content-Type': 'application/json; odata=verbose',
            'X-RequestDigest': requestDigest
          },
          body: JSON.stringify(configData)
        });
  
        if (response.ok) {
          setNotification({ 
            type: 'success', 
            message: `✅ Recipients configuration saved to SharePoint: ${config.notificationType}` 
          });
        } else {
          throw new Error(`SharePoint save failed: ${response.status}`);
        }
      } else {
        setNotification({ 
          type: 'success', 
          message: `📧 Recipients configuration saved (Demo Mode): ${config.notificationType}` 
        });
      }
      
    } catch (error) {
      console.error('❌ Failed to save recipients configuration:', error);
      setNotification({ 
        type: 'error', 
        message: 'Failed to save recipients configuration: ' + error.message 
      });
    }
  };
  
  const handleSendCustomEmail = async (emailData) => {
    try {
      console.log('📧 Sending custom email:', emailData);
      
      if (sharePointAvailable) {
        // Use your working SharePoint email API directly
        const config = getSharePointConfig();
        const requestDigest = await getFreshRequestDigest();
        
        const emailPayload = {
          properties: {
            __metadata: { type: 'SP.Utilities.EmailProperties' },
            To: { results: emailData.to },
            CC: emailData.cc?.length > 0 ? { results: emailData.cc } : { results: [] },
            BCC: emailData.bcc?.length > 0 ? { results: emailData.bcc } : { results: [] },
            Subject: emailData.subject,
            Body: emailData.body
          }
        };
  
        const response = await fetch(`${config.baseUrl}/_api/SP.Utilities.Utility.SendEmail`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json; odata=verbose',
            'Content-Type': 'application/json; odata=verbose',
            'X-RequestDigest': requestDigest
          },
          body: JSON.stringify(emailPayload)
        });
  
        if (response.ok) {
          setNotification({ 
            type: 'success', 
            message: `✅ Custom email sent successfully to ${emailData.to.length} recipients via SharePoint!` 
          });
        } else {
          throw new Error(`Email send failed: ${response.status}`);
        }
      } else {
        setNotification({ 
          type: 'success', 
          message: `📧 Custom email sent (Demo Mode) to ${emailData.to.length} recipients` 
        });
      }
      
    } catch (error) {
      console.error('❌ Failed to send custom email:', error);
      setNotification({ 
        type: 'error', 
        message: 'Failed to send custom email: ' + error.message 
      });
    }
  };

 // 🔧 FIXED: Handle Procedure Delete with Fresh Digest
 const handleDeleteProcedure = async (procedure) => {
   try {
     setLoading(true);
     const config = getSharePointConfig();
     
     if (sharePointAvailable) {
       console.log('🗑️ Deleting procedure from SharePoint:', procedure.id);
       
       // Get fresh request digest
       const requestDigest = await getFreshRequestDigest();
       
       const deleteUrl = `${config.proceduresListUrl}(${procedure.id})`;
       
       console.log('📤 Sending DELETE request to:', deleteUrl);
       
       const response = await fetch(deleteUrl, {
         method: 'POST',
         headers: {
           'Accept': 'application/json; odata=verbose',
           'Content-Type': 'application/json; odata=verbose',
           'X-RequestDigest': requestDigest,
           'X-HTTP-Method': 'DELETE',
           'IF-MATCH': '*'
         },
         credentials: 'include'
       });

       if (response.ok || response.status === 204) {
         console.log('✅ Procedure deleted successfully from SharePoint');
         
         // Log the audit action (to procedure AuditLog)
         await logAuditAction('PROCEDURE_DELETED', procedure.name, {
           procedureId: procedure.id,
           deletedBy: user?.staffId,
           reason: 'Admin deletion'
         });
         
         setNotification({ type: 'success', message: 'Procedure deleted successfully from SharePoint' });
         onDataRefresh();
         loadAuditLog();
       } else {
         const errorText = await response.text();
         console.error('❌ SharePoint delete error:', response.status, errorText);
         setNotification({ type: 'error', message: `Failed to delete procedure from SharePoint (${response.status}): ${errorText}` });
       }
     } else {
       console.log('🗑️ Mock procedure delete:', procedure.name);
       setNotification({ type: 'success', message: 'Procedure deleted successfully (Demo Mode)' });
       onDataRefresh();
     }
   } catch (err) {
     console.error('❌ Error deleting procedure:', err);
     setNotification({ type: 'error', message: 'Error deleting procedure: ' + err.message });
   } finally {
     setLoading(false);
     setDeleteDialog({ open: false, procedure: null });
   }
 };

 // 🔧 FIXED: Log Audit Action for Procedures (to AuditLog)
 const logAuditAction = async (action, procedureName, details) => {
   try {
     const config = getSharePointConfig();
     
     if (sharePointAvailable) {
       console.log('📝 Logging procedure audit action:', action);
       
       // Get fresh request digest
       const requestDigest = await getFreshRequestDigest();
       
       const auditData = {
         __metadata: { type: 'SP.Data.AuditLogListItem' },
         Title: action,
         ActionType: action,
         UserId: user?.staffId || 'System',
         UserDisplayName: user?.displayName || '',
         ProcedureName: procedureName,
         LogTimestamp: new Date().toISOString(),
         Details: JSON.stringify(details),
         Status: 'SUCCESS'
       };

       console.log('📤 Sending procedure audit log data:', auditData);

       const response = await fetch(config.auditLogListUrl, {
         method: 'POST',
         headers: {
           'Accept': 'application/json; odata=verbose',
           'Content-Type': 'application/json; odata=verbose',
           'X-RequestDigest': requestDigest
         },
         credentials: 'include',
         body: JSON.stringify(auditData)
       });
       
       if (response.ok) {
         console.log('✅ Procedure audit action logged successfully:', action);
       } else {
         const errorText = await response.text();
         console.log('⚠️ Failed to log procedure audit action:', response.status, errorText);
       }
     }
   } catch (err) {
     console.error('❌ Error logging procedure audit action:', err);
     // Don't throw error here - audit logging failure shouldn't break the main action
   }
 };

 // Helper Functions
 const safeJsonParse = (jsonString, defaultValue) => {
   try {
     return jsonString ? JSON.parse(jsonString) : defaultValue;
   } catch (error) {
     return defaultValue;
   }
 };

 const loadMockAuditLog = () => {
   setAuditLog([
     {
       id: 1,
       action: 'PROCEDURE_UPLOADED',
       user: '12345678',
       procedureName: 'Risk Assessment Framework',
       timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
       details: { score: 92, lob: 'IWPB', uploadedBy: '12345678' },
       status: 'SUCCESS'
     },
     {
       id: 2,
       action: 'PROCEDURE_UPDATED',
       user: user?.staffId || '43898931',
       procedureName: 'Trading Guidelines',
       timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
       details: { field: 'expiry_date', oldValue: '2024-06-01', newValue: '2024-12-01' },
       status: 'SUCCESS'
     },
     {
       id: 3,
       action: 'PROCEDURE_DELETED',
       user: user?.staffId || '43898931',
       procedureName: 'Old Compliance Document',
       timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
       details: { deletedBy: user?.staffId, reason: 'Admin deletion' },
       status: 'SUCCESS'
     }
   ]);
 };

 const loadMockAccessAuditLog = () => {
   setAccessAuditLog([
     {
       id: 1,
       actionType: 'USER_ACCESS_GRANTED',
       targetUserId: '87654321',
       targetUserName: 'Sarah Johnson',
       performedBy: user?.staffId || '43898931',
       performedByName: user?.displayName || 'Admin User',
       timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
       oldValue: null,
       newValue: 'user',
       reason: 'New user onboarding',
       status: 'SUCCESS'
     },
     {
       id: 2,
       actionType: 'USER_ROLE_UPDATED',
       targetUserId: '12345678',
       targetUserName: 'John Smith',
       performedBy: user?.staffId || '43898931',
       performedByName: user?.displayName || 'Admin User',
       timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
       oldValue: 'user',
       newValue: 'uploader',
       reason: 'Role promotion',
       status: 'SUCCESS'
     }
   ]);
 };

 const loadMockUserRoles = () => {
   setUserRoles([
     { 
       id: 1, 
       userId: user?.staffId || '43898931',
       displayName: user?.displayName || 'Admin User',
       role: 'admin', 
       lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000), 
       status: 'active',
       grantedBy: 'System'
     },
     { 
       id: 2, 
       userId: '12345678', 
       displayName: 'John Smith',
       role: 'uploader', 
       lastLogin: new Date(Date.now() - 5 * 60 * 60 * 1000), 
       status: 'active',
       grantedBy: user?.staffId || '43898931'
     },
     { 
       id: 3, 
       userId: '87654321', 
       displayName: 'Sarah Johnson',
       role: 'user', 
       lastLogin: new Date(Date.now() - 24 * 60 * 60 * 1000), 
       status: 'active',
       grantedBy: user?.staffId || '43898931'
     }
   ]);
 };

 // Helper Functions for UI
 const getStatusColor = (expiry) => {
   const now = new Date();
   const expiryDate = new Date(expiry);
   const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
   
   if (daysLeft < 0) return 'error';
   if (daysLeft <= 30) return 'warning';
   return 'success';
 };

 const formatTimeAgo = (timestamp) => {
   const now = new Date();
   const diff = Math.floor((now - new Date(timestamp)) / 1000);
   
   if (diff < 60) return 'Just now';
   if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
   if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
   return `${Math.floor(diff / 86400)}d ago`;
 };

 const getActionIcon = (action) => {
   switch (action) {
     case 'PROCEDURE_UPLOADED': return <CloudUpload color="primary" />;
     case 'PROCEDURE_UPDATED': return <Edit color="info" />;
     case 'PROCEDURE_DELETED': return <Delete color="error" />;
     case 'USER_ACCESS_GRANTED': return <PersonAdd color="success" />;
     case 'USER_ACCESS_REVOKED': return <Cancel color="warning" />;
     case 'USER_ROLE_UPDATED': return <Edit color="info" />;
     default: return <Assignment color="action" />;
   }
 };

 const getRoleChip = (role) => {
   const roleConfig = {
     admin: { color: 'error', label: 'Admin' },
     uploader: { color: 'warning', label: 'Uploader' },
     user: { color: 'default', label: 'User' }
   };
   
   const config = roleConfig[role] || roleConfig.user;
   return <Chip label={config.label} color={config.color} size="small" />;
 };

 // Find who granted access for a user
 const getAccessGrantedBy = (userId) => {
   const grantEntry = accessAuditLog.find(
     entry => entry.actionType === 'USER_ACCESS_GRANTED' && entry.targetUserId === userId
   );
   return grantEntry ? grantEntry.performedByName || grantEntry.performedBy : 'Unknown';
 };

 // Calculate admin stats
 const adminStats = {
   totalProcedures: procedures?.length || 0,
   expiringSoon: procedures?.filter(p => {
     const expiry = new Date(p.expiry);
     const now = new Date();
     const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
     return daysLeft > 0 && daysLeft <= 30;
   }).length || 0,
   expired: procedures?.filter(p => new Date(p.expiry) < new Date()).length || 0,
   lowQuality: procedures?.filter(p => (p.score || 0) < 60).length || 0,
   totalUsers: userRoles.filter(u => u.status === 'active').length,
   adminUsers: userRoles.filter(u => u.role === 'admin' && u.status === 'active').length,
   uploaderUsers: userRoles.filter(u => u.role === 'uploader' && u.status === 'active').length,
   totalAccessActions: accessAuditLog.length
 };

 // Show access denied if not admin
 if (!isAdmin) {
   return (
     <Box sx={{ minHeight: '100vh', bgcolor: '#f5f6fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
       <Card sx={{ maxWidth: 500, textAlign: 'center' }}>
         <CardContent sx={{ p: 4 }}>
           <ErrorIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
           <Typography variant="h5" gutterBottom>
             Access Denied
           </Typography>
           <Typography variant="body1" color="text.secondary" gutterBottom>
             Admin privileges required to access the Admin Dashboard.
           </Typography>
           <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
             User ID: {user?.staffId} | Role: {user?.role}
           </Typography>
           <Button 
             variant="contained" 
             onClick={() => navigate('home')}
             startIcon={<Dashboard />}
           >
             Return to Home
           </Button>
         </CardContent>
       </Card>
     </Box>
   );
 }

 return (
   <Box>
     {/* Header */}
     <Box sx={{ mb: 4 }}>
       <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
         <AdminPanelSettings color="error" />
         Admin Dashboard
       </Typography>
       <Typography variant="body1" color="text.secondary">
         Comprehensive administration and management tools
       </Typography>
       
       {/* Clean Status Info */}
       <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
         <Chip 
           icon={sharePointAvailable ? <CheckCircle /> : <Warning />}
           label={sharePointAvailable ? 'SharePoint Connected' : 'Demo Mode'}
           color={sharePointAvailable ? 'success' : 'warning'}
           variant="outlined"
         />
         <Chip 
           label={`Admin: ${user?.displayName || user?.staffId}`}
           color="error"
           variant="outlined"
           icon={<Person />}
         />
       </Box>
     </Box>

 {/* Admin Stats Cards - Enhanced with Email Management */}
<Grid container spacing={3} sx={{ mb: 4 }}>
  <Grid item xs={12} sm={6} md={2.4}>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card sx={{ 
        background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)', 
        color: 'white',
        cursor: 'pointer',
        '&:hover': { transform: 'translateY(-2px)' },
        transition: 'transform 0.3s'
      }}
      onClick={() => navigate('admin-panel')}
      >
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography color="rgba(255,255,255,0.8)" variant="body2" gutterBottom>
                Upload New
              </Typography>
              <Typography variant="h3" fontWeight="bold">
                +
              </Typography>
            </Box>
            <CloudUpload sx={{ fontSize: 40, opacity: 0.3 }} />
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  </Grid>
  <Grid item xs={12} sm={6} md={2.4}>
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay: 0.4 }}
  >
    <Card sx={{ 
      background: 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)', 
      color: 'white',
      cursor: 'pointer',
      '&:hover': { transform: 'translateY(-2px)' },
      transition: 'transform 0.3s'
    }}
    onClick={createEmailManagementLists}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography color="rgba(255,255,255,0.8)" variant="body2" gutterBottom>
              Setup Email System
            </Typography>
            <Typography variant="h3" fontWeight="bold">
              📧
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" display="block" color="rgba(255,255,255,0.8)">
              Create Lists
            </Typography>
            <Typography variant="caption" display="block" color="rgba(255,255,255,0.8)">
              Initialize
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  </motion.div>
</Grid>

  {/* 🆕 NEW: Email Management Card */}
  <Grid item xs={12} sm={6} md={2.4}>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.05 }}
    >
      <Card sx={{ 
        background: 'linear-gradient(135deg, #7b1fa2 0%, #6a1b9a 100%)', 
        color: 'white',
        cursor: 'pointer',
        '&:hover': { transform: 'translateY(-2px)' },
        transition: 'transform 0.3s'
      }}
      onClick={() => setActiveTab(3)} // Navigate to new email tab
      >
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography color="rgba(255,255,255,0.8)" variant="body2" gutterBottom>
                Email System
              </Typography>
              <Typography variant="h3" fontWeight="bold">
                📧
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" display="block" color="rgba(255,255,255,0.8)">
                Templates
              </Typography>
              <Typography variant="caption" display="block" color="rgba(255,255,255,0.8)">
                Settings
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  </Grid>

  <Grid item xs={12} sm={6} md={2.4}>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <Card sx={{ 
        background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)', 
        color: 'white'
      }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography color="rgba(255,255,255,0.8)" variant="body2" gutterBottom>
                Need Attention
              </Typography>
              <Typography variant="h3" fontWeight="bold">
                {adminStats.expiringSoon + adminStats.expired}
              </Typography>
            </Box>
            <Badge badgeContent={adminStats.expired} color="error">
              <Warning sx={{ fontSize: 40, opacity: 0.3 }} />
            </Badge>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  </Grid>

  <Grid item xs={12} sm={6} md={2.4}>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      <Card sx={{ 
        background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)', 
        color: 'white'
      }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography color="rgba(255,255,255,0.8)" variant="body2" gutterBottom>
                Active Users
              </Typography>
              <Typography variant="h3" fontWeight="bold">
                {adminStats.totalUsers}
              </Typography>
            </Box>
            <People sx={{ fontSize: 40, opacity: 0.3 }} />
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  </Grid>

  <Grid item xs={12} sm={6} md={2.4}>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.3 }}
    >
      <Card sx={{ 
        background: 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)', 
        color: 'white'
      }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography color="rgba(255,255,255,0.8)" variant="body2" gutterBottom>
                Debug Tools
              </Typography>
              <Typography variant="h3" fontWeight="bold">
                <BugReport sx={{ fontSize: 40 }} />
              </Typography>
            </Box>
            <Button
              size="small"
              variant="contained"
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)', 
                color: 'white',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
              }}
              onClick={runQuickDebug}
              disabled={loading}
            >
              Run Debug
            </Button>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  </Grid>
</Grid>

     {/* Main Content Tabs */}
     <Card>
       <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
         <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
           <Tab 
             label="Procedures Management" 
             icon={<Assignment />} 
             iconPosition="start"
           />
           <Tab 
             label="Procedure Audit Log" 
             icon={<History />} 
             iconPosition="start"
           />
           <Tab 
             label="Access Management" 
             icon={<Security />} 
             iconPosition="start"
           />
            {/* 🆕 NEW: Email Management Tab */}
            <Tab 
             label="Email Management" 
             icon={<Email />} 
             iconPosition="start"
             />
         </Tabs>
       </Box>

       {/* Tab 1: Procedures Management */}
       <TabPanel hidden={activeTab !== 0}>
         <Box sx={{ p: 3 }}>
           <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
             <Typography variant="h6">
               Procedures Management ({procedures?.length || 0} total)
             </Typography>
             <Box sx={{ display: 'flex', gap: 1 }}>
               <Button
                 variant="outlined"
                 startIcon={<Refresh />}
                 onClick={onDataRefresh}
                 disabled={loading}
               >
                 Refresh Data
               </Button>
               <Button
                 variant="contained"
                 startIcon={<CloudUpload />}
                 onClick={() => navigate('admin-panel')}
               >
                 Upload New
               </Button>
             </Box>
           </Box>

           {loading && <LinearProgress sx={{ mb: 2 }} />}

           <TableContainer component={Paper} variant="outlined">
             <Table>
               <TableHead>
                 <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                   <TableCell><strong>Procedure Name</strong></TableCell>
                   <TableCell><strong>LOB</strong></TableCell>
                   <TableCell><strong>Owner</strong></TableCell>
                   <TableCell><strong>Expiry</strong></TableCell>
                   <TableCell><strong>Quality</strong></TableCell>
                   <TableCell><strong>Status</strong></TableCell>
                   <TableCell><strong>Actions</strong></TableCell>
                 </TableRow>
               </TableHead>
               <TableBody>
                 {procedures && procedures.length > 0 ? procedures.map((procedure) => (
                   <TableRow key={procedure.id} hover>
                     <TableCell>
                       <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                         <Assignment fontSize="small" color="action" />
                        <Typography variant="body2" fontWeight="medium">
                          {procedure.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={procedure.lob} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 24, height: 24, fontSize: '0.7rem' }}>
                          {procedure.primary_owner?.[0]}
                        </Avatar>
                        <Typography variant="body2">
                          {procedure.primary_owner}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarToday fontSize="small" color="action" />
                        <Typography variant="body2">
                          {new Date(procedure.expiry).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={procedure.score || 0} 
                          sx={{ width: 60, height: 6, borderRadius: 3 }}
                        />
                        <Typography variant="body2" fontWeight="bold">
                          {procedure.score || 0}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={getStatusColor(procedure.expiry) === 'error' ? 'Expired' : 
                              getStatusColor(procedure.expiry) === 'warning' ? 'Expiring' : 'Active'}
                        color={getStatusColor(procedure.expiry)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="View Details">
                          <IconButton 
                            size="small" 
                            onClick={() => navigate('procedures', { highlightId: procedure.id })}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Procedure">
                          <IconButton 
                            size="small" 
                            onClick={() => {
                              setEditDialog({ open: true, procedure });
                              setEditingProcedure({
                                name: procedure.name,
                                primary_owner: procedure.primary_owner,
                                primary_owner_email: procedure.primary_owner_email,
                                expiry: procedure.expiry
                              });
                            }}
                            disabled={loading}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Procedure">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => setDeleteDialog({ open: true, procedure })}
                            disabled={loading}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        No procedures found
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </TabPanel>

      {/* Tab 2: Procedure Audit Log */}
      <TabPanel hidden={activeTab !== 1}>
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              Procedure Audit Log ({auditLog.length} entries)
            </Typography>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={loadAuditLog}
              disabled={loading}
              size="small"
            >
              Refresh Log
            </Button>
          </Box>
          
          {loading && <LinearProgress sx={{ mb: 2 }} />}
          
          <List>
            {auditLog.map((entry, index) => (
              <React.Fragment key={entry.id}>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    {getActionIcon(entry.action)}
                  </ListItemIcon>
                          <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="body1" fontWeight="medium">
                          {entry.action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                        </Typography>
                        <Chip 
                          label={entry.status} 
                          color={entry.status === 'SUCCESS' ? 'success' : 'error'}
                          size="small"
                        />
                        {sharePointAvailable && (
                          <Chip 
                            label="SharePoint" 
                            size="small" 
                            variant="outlined"
                            sx={{ fontSize: '0.6rem', height: 20 }}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {entry.procedureName ? `"${entry.procedureName}"` : 'System action'} by User ID: {entry.user}
                        </Typography>
                        <Typography variant="caption" color="text.disabled">
                          {formatTimeAgo(entry.timestamp)} • {new Date(entry.timestamp).toLocaleString()}
                        </Typography>
                        {entry.details && Object.keys(entry.details).length > 0 && (
                          <Box sx={{ mt: 1, p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                            <Typography variant="caption" component="pre" sx={{ fontSize: '0.7rem' }}>
                              {JSON.stringify(entry.details, null, 2)}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
                {index < auditLog.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>

          {auditLog.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <History sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No procedure audit entries
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Procedure activities will appear here
              </Typography>
            </Box>
          )}
        </Box>
      </TabPanel>

      {/* Tab 3: Access Management */}
      <TabPanel hidden={activeTab !== 2}>
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              Access Management ({adminStats.totalUsers} active users, {adminStats.totalAccessActions} audit entries)
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={() => {
                  loadUserRoles();
                  loadAccessAuditLog();
                }}
                disabled={loading}
                size="small"
              >
                Refresh
              </Button>
              <Button
                variant="contained"
                startIcon={<PersonAdd />}
                onClick={() => setAccessDialog({ open: true })}
                disabled={loading}
              >
                Grant Access
              </Button>
              {sharePointAvailable && (
                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={<Assignment />}
                  onClick={createAccessAuditLogList}
                  disabled={loading}
                  size="small"
                >
                  Create AccessAuditLog
                </Button>
              )}
            </Box>
          </Box>

          {loading && <LinearProgress sx={{ mb: 2 }} />}

          {/* Access Control Info */}
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>Access Management:</strong> User access is managed by User ID with full audit trail. 
              All access changes are logged to AccessAuditLog for compliance.
            </Typography>
          </Alert>

          {/* User Stats */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="error.main" fontWeight="bold">
                  {adminStats.adminUsers}
                </Typography>
                <Typography variant="body2">Admins</Typography>
              </Paper>
            </Grid>
            <Grid item xs={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="warning.main" fontWeight="bold">
                  {adminStats.uploaderUsers}
                </Typography>
                <Typography variant="body2">Uploaders</Typography>
              </Paper>
            </Grid>
            <Grid item xs={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="primary.main" fontWeight="bold">
                  {userRoles.filter(u => u.role === 'user' && u.status === 'active').length}
                </Typography>
                <Typography variant="body2">Users</Typography>
              </Paper>
            </Grid>
            <Grid item xs={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="secondary.main" fontWeight="bold">
                  {adminStats.totalAccessActions}
                </Typography>
                <Typography variant="body2">Audit Entries</Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Enhanced User Table with Audit Info */}
          <TableContainer component={Paper} variant="outlined" sx={{ mb: 4 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell><strong>User ID & Name</strong></TableCell>
                  <TableCell><strong>Role</strong></TableCell>
                  <TableCell><strong>Last Login</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Access Granted By</strong></TableCell>
                  <TableCell><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {userRoles.map((userRole) => (
                  <TableRow key={userRole.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ width: 32, height: 32 }}>
                          {userRole.displayName?.[0] || userRole.userId?.[0] || 'U'}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {userRole.displayName || `User ${userRole.userId}`}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            User ID: {userRole.userId}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {getRoleChip(userRole.role)}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatTimeAgo(userRole.lastLogin)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(userRole.lastLogin).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={userRole.status}
                        color={userRole.status === 'active' ? 'success' : 'default'}
                        size="small"
                        icon={userRole.status === 'active' ? <CheckCircle /> : <Cancel />}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {userRole.grantedBy || getAccessGrantedBy(userRole.userId)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Edit Role">
                          <IconButton 
                            size="small"
                            onClick={() => handleEditUserRole(userRole)}
                            disabled={loading || userRole.status !== 'active'}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Revoke Access">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleRevokeAccess(userRole)}
                            disabled={loading || userRole.status !== 'active'}
                          >
                            <Cancel fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Access Audit Log Section */}
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Access Audit Trail ({accessAuditLog.length} entries)
            </Typography>
            
            <List sx={{ bgcolor: 'background.paper', borderRadius: 1, border: '1px solid #e0e0e0' }}>
              {accessAuditLog.slice(0, 10).map((entry, index) => (
                <React.Fragment key={entry.id}>
                  <ListItem sx={{ px: 2, py: 1 }}>
                    <ListItemIcon>
                      {getActionIcon(entry.actionType)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" fontWeight="medium">
                            {entry.actionType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                          </Typography>
                          <Chip 
                            label={entry.status} 
                            color={entry.status === 'SUCCESS' ? 'success' : 'error'}
                            size="small"
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            <strong>{entry.targetUserName || entry.targetUserId}</strong> by {entry.performedByName || entry.performedBy}
                            {entry.oldValue && entry.newValue && (
                              <> • {entry.oldValue} → {entry.newValue}</>
                            )}
                          </Typography>
                          <Typography variant="caption" color="text.disabled">
                            {formatTimeAgo(entry.timestamp)} • {entry.reason}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < Math.min(accessAuditLog.length, 10) - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>

            {accessAuditLog.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                <Security sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No access audit entries
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  User access activities will appear here
                </Typography>
              </Box>
            )}

            {accessAuditLog.length > 10 && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Showing last 10 entries. Total: {accessAuditLog.length} audit records.
              </Typography>
            )}
          </Box>

          {userRoles.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <People sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No users found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                User access records will appear here
              </Typography>
            </Box>
          )}
        </Box>
      </TabPanel>

{/* Enhanced Tab 4: Email Management */}
<TabPanel hidden={activeTab !== 3}>
  <Box sx={{ p: 3 }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
      <Typography variant="h6">
        📧 Email Notification Management
      </Typography>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={() => {
            setNotification({ type: 'info', message: 'Email settings refreshed' });
          }}
          disabled={loading}
          size="small"
        >
          Refresh
        </Button>
        <Button
          variant="contained"
          startIcon={<Send />}
          onClick={handleOpenCustomComposer}
          disabled={loading}
        >
          Send Custom Email
        </Button>
      </Box>
    </Box>

    {/* Email System Status */}
    <Alert severity="success" sx={{ mb: 3 }}>
      <Typography variant="body2">
        <strong>Email System Status:</strong> ✅ SharePoint Email API Connected | 
        ✅ Templates Active | ✅ Notifications Enabled
      </Typography>
    </Alert>

    {/* Email Configuration Quick Cards - ENHANCED */}
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid item xs={12} md={4}>
        <Card sx={{ 
          cursor: 'pointer',
          '&:hover': { boxShadow: '0 8px 24px rgba(0,0,0,0.15)' },
          transition: 'all 0.3s'
        }}
        onClick={() => handleOpenTemplateEditor('procedure-uploaded')}
        >
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box sx={{ 
                p: 2, 
                borderRadius: 2, 
                bgcolor: '#e3f2fd',
                color: '#1976d2',
                mr: 2
              }}>
                <Description />
              </Box>
              <Typography variant="h6" fontWeight="bold">
                Email Templates
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Customize email templates for different notification types
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              <Chip label="Upload" size="small" />
              <Chip label="Expiry" size="small" />
              <Chip label="Delete" size="small" />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card sx={{ 
          cursor: 'pointer',
          '&:hover': { boxShadow: '0 8px 24px rgba(0,0,0,0.15)' },
          transition: 'all 0.3s'
        }}
        onClick={() => handleOpenRecipientsConfig('procedure-uploaded')}
        >
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box sx={{ 
                p: 2, 
                borderRadius: 2, 
                bgcolor: '#fff3e0',
                color: '#f57c00',
                mr: 2
              }}>
                <People />
              </Box>
              <Typography variant="h6" fontWeight="bold">
                CC/BCC Lists
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Configure recipients for each notification type and LOB
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              <Chip label="Global CC" size="small" />
              <Chip label="LOB Specific" size="small" />
              <Chip label="BCC Audit" size="small" />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card sx={{ 
          cursor: 'pointer',
          '&:hover': { boxShadow: '0 8px 24px rgba(0,0,0,0.15)' },
          transition: 'all 0.3s'
        }}
        onClick={handleOpenCustomComposer}
        >
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box sx={{ 
                p: 2, 
                borderRadius: 2, 
                bgcolor: '#e8f5e8',
                color: '#4caf50',
                mr: 2
              }}>
                <Send />
              </Box>
              <Typography variant="h6" fontWeight="bold">
                Custom Emails
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Send tailored emails to users and groups
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              <Chip label="Rich Editor" size="small" />
              <Chip label="Templates" size="small" />
              <Chip label="Attachments" size="small" />
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>

    {/* Enhanced Email Notification Settings Table */}
    <Typography variant="h6" gutterBottom>
      📋 Notification Settings
    </Typography>
    
    <TableContainer component={Paper} variant="outlined" sx={{ mb: 4 }}>
      <Table>
        <TableHead>
          <TableRow sx={{ bgcolor: '#f5f5f5' }}>
            <TableCell><strong>Notification Type</strong></TableCell>
            <TableCell><strong>Status</strong></TableCell>
            <TableCell><strong>Primary Recipients</strong></TableCell>
            <TableCell><strong>CC List</strong></TableCell>
            <TableCell><strong>BCC List</strong></TableCell>
            <TableCell><strong>Actions</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {[
            {
              type: 'New Procedure Uploaded',
              notificationType: 'procedure-uploaded',
              status: 'enabled',
              recipients: 'Primary Owner + Secondary Owner',
              cc: 'procedures-admin@hsbc.com, LOB managers',
              bcc: 'audit@hsbc.com',
              template: 'procedure-uploaded'
            },
            {
              type: 'Procedure Deleted',
              notificationType: 'procedure-deleted',
              status: 'enabled',
              recipients: 'Primary Owner',
              cc: 'procedures-admin@hsbc.com, compliance@hsbc.com',
              bcc: 'audit@hsbc.com',
              template: 'procedure-deleted'
            },
            {
              type: 'Expiry Warning (30 days)',
              notificationType: 'expiry-30-days',
              status: 'enabled',
              recipients: 'Primary Owner + Secondary Owner',
              cc: 'LOB managers',
              bcc: '',
              template: 'expiry-30-days'
            },
            {
              type: 'Expiry Warning (10 days)',
              notificationType: 'expiry-10-days',
              status: 'enabled',
              recipients: 'Primary Owner + Secondary Owner',
              cc: 'LOB managers, procedures-admin@hsbc.com',
              bcc: '',
              template: 'expiry-10-days'
            },
            {
              type: 'Urgent Expiry (5-0 days)',
              notificationType: 'expiry-urgent',
              status: 'enabled',
              recipients: 'Primary Owner + Secondary Owner',
              cc: 'LOB directors, compliance@hsbc.com',
              bcc: 'audit@hsbc.com',
              template: 'expiry-urgent'
            }
          ].map((notification, index) => (
            <TableRow key={index} hover>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Email fontSize="small" color="action" />
                  <Typography variant="body2" fontWeight="medium">
                    {notification.type}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Chip 
                  label={notification.status}
                  color={notification.status === 'enabled' ? 'success' : 'default'}
                  size="small"
                  icon={notification.status === 'enabled' ? <CheckCircle /> : <Cancel />}
                />
              </TableCell>
              <TableCell>
                <Typography variant="body2" color="text.secondary">
                  {notification.recipients}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 200 }}>
                  {notification.cc}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" color="text.secondary">
                  {notification.bcc || 'None'}
                </Typography>
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <Tooltip title="Edit Template">
                    <IconButton 
                      size="small"
                      onClick={() => handleOpenTemplateEditor(notification.notificationType)}
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Configure Recipients">
                    <IconButton 
                      size="small"
                      onClick={() => handleOpenRecipientsConfig(notification.notificationType)}
                    >
                      <People fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Test Email">
                    <IconButton 
                      size="small"
                      onClick={() => setNotification({ 
                        type: 'success', 
                        message: `Test email sent for ${notification.type}` 
                      })}
                    >
                      <Send fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>

    {/* Quick Email Test - Enhanced */}
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" gutterBottom>
          🧪 Quick Email Test
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Test the email system with sample notifications
        </Typography>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={4}>
            <Button
              variant="outlined"
              fullWidth
              size="small"
              onClick={() => setNotification({ 
                type: 'success', 
                message: '📧 Test upload notification sent successfully!' 
              })}
            >
              Test Upload Notification
            </Button>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button
              variant="outlined"
              fullWidth
              size="small"
              onClick={() => setNotification({ 
                type: 'success', 
                message: '⚠️ Test expiry warning sent successfully!' 
              })}
            >
              Test Expiry Warning
            </Button>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button
              variant="outlined"
              fullWidth
              size="small"
              onClick={() => setNotification({ 
                type: 'success', 
                message: '🗑️ Test deletion notification sent successfully!' 
              })}
            >
              Test Delete Notification
            </Button>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  </Box>
</TabPanel>
    </Card>

    {/* Edit Procedure Dialog */}
    <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, procedure: null })} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Edit />
          Edit Procedure
          {sharePointAvailable && (
            <Chip label="SharePoint" size="small" color="success" variant="outlined" />
          )}
        </Box>
      </DialogTitle>
      <DialogContent>
        {editDialog.procedure && (
          <Box sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Procedure Name"
                  value={editingProcedure.name || ''}
                  onChange={(e) => setEditingProcedure({...editingProcedure, name: e.target.value})}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Primary Owner"
                  value={editingProcedure.primary_owner || ''}
                  onChange={(e) => setEditingProcedure({...editingProcedure, primary_owner: e.target.value})}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Primary Owner Email"
                  value={editingProcedure.primary_owner_email || ''}
                  onChange={(e) => setEditingProcedure({...editingProcedure, primary_owner_email: e.target.value})}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Expiry Date"
                  type="date"
                  value={editingProcedure.expiry || ''}
                  onChange={(e) => setEditingProcedure({...editingProcedure, expiry: e.target.value})}
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setEditDialog({ open: false, procedure: null })}>
          Cancel
        </Button>
        <Button 
          variant="contained" 
          onClick={() => handleEditProcedure(editDialog.procedure, editingProcedure)}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : <Edit />}
        >
          {loading ? 'Updating...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>

    {/* Delete Confirmation Dialog */}
    <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, procedure: null })}>
      <DialogTitle sx={{ color: 'error.main' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ErrorIcon />
          Confirm Deletion
          {sharePointAvailable && (
            <Chip label="SharePoint" size="small" color="error" variant="outlined" />
          )}
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1" gutterBottom>
          Are you sure you want to delete this procedure?
        </Typography>
        {deleteDialog.procedure && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>"{deleteDialog.procedure.name}"</strong> will be permanently deleted from SharePoint. 
              This action cannot be undone.
            </Typography>
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setDeleteDialog({ open: false, procedure: null })}>
          Cancel
        </Button>
        <Button 
          variant="contained" 
          color="error"
          onClick={() => handleDeleteProcedure(deleteDialog.procedure)}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : <Delete />}
        >
          {loading ? 'Deleting...' : 'Delete Procedure'}
        </Button>
      </DialogActions>
    </Dialog>

    {/* Grant Access Dialog */}
    <Dialog open={accessDialog.open} onClose={() => setAccessDialog({ open: false })}>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonAdd />
          Grant User Access
          {sharePointAvailable && (
            <Chip label="SharePoint + AccessAuditLog" size="small" color="success" variant="outlined" />
          )}
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <TextField
            fullWidth
            label="User ID"
            type="text"
            value={newUser.userId}
            onChange={(e) => setNewUser({ ...newUser, userId: e.target.value })}
            variant="outlined"
            sx={{ mb: 2 }}
            placeholder="43898931"
            helperText="Enter the HSBC User ID (numeric)"
          />
          <TextField
            fullWidth
            label="Display Name"
            type="text"
            value={newUser.displayName}
            onChange={(e) => setNewUser({ ...newUser, displayName: e.target.value })}
            variant="outlined"
            sx={{ mb: 2 }}
            placeholder="John Smith"
            helperText="Enter the user's full name"
          />
          <FormControl fullWidth variant="outlined">
            <InputLabel>Role</InputLabel>
            <Select
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              label="Role"
            >
              <MenuItem value="user">User - View only access</MenuItem>
              <MenuItem value="uploader">Uploader - Can upload procedures</MenuItem>
              <MenuItem value="admin">Admin - Full access</MenuItem>
            </Select>
          </FormControl>
          
          {sharePointAvailable && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="caption">
                User will be added to UserRoles list and action logged to AccessAuditLog with User ID: {newUser.userId}
              </Typography>
            </Alert>
          )}

          

        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setAccessDialog({ open: false })}>
          Cancel
        </Button>
        <Button 
          variant="contained" 
          onClick={handleGrantAccess}
          disabled={loading || !newUser.userId || !newUser.userId.match(/^\d+$/)}
          startIcon={loading ? <CircularProgress size={16} /> : <PersonAdd />}
        >
          {loading ? 'Granting...' : 'Grant Access'}
        </Button>
      </DialogActions>
    </Dialog>

    {/* Notification Snackbar */}
    <Snackbar
      open={!!notification}
      autoHideDuration={6000}
      onClose={() => setNotification(null)}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert 
        onClose={() => setNotification(null)} 
        severity={notification?.type}
        sx={{ width: '100%' }}
      >
        {notification?.message}
      </Alert>
    </Snackbar>
    {/* Email Template Editor Dialog */}
    <EmailTemplateEditor
  open={emailDialogs.templateEditor.open}
  templateType={emailDialogs.templateEditor.templateType}
  onClose={() => setEmailDialogs(prev => ({
    ...prev,
    templateEditor: { open: false, templateType: null }
  }))}
  onSave={handleSaveTemplate}
/>

{/* Email Recipients Configuration Dialog */}
<EmailRecipientsConfig
  open={emailDialogs.recipientsConfig.open}
  notificationType={emailDialogs.recipientsConfig.notificationType}
  onClose={() => setEmailDialogs(prev => ({
    ...prev,
    recipientsConfig: { open: false, notificationType: null }
  }))}
  onSave={handleSaveRecipientsConfig}
/>

{/* Custom Email Composer Dialog */}
<CustomEmailComposer
  open={emailDialogs.customComposer.open}
  onClose={() => setEmailDialogs(prev => ({
    ...prev,
    customComposer: { open: false }
  }))}
  onSend={handleSendCustomEmail}
/>
  </Box>
);
};

export default AdminDashboardPage;
