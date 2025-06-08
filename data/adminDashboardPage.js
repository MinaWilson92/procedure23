// pages/AdminDashboardPage.js - Complete File with Debugging
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
  Person, CalendarToday, Business, Assessment, Cancel, BugReport
} from '@mui/icons-material';
import { useNavigation } from '../contexts/NavigationContext';
import { useSharePoint } from '../SharePointContext';
import { motion } from 'framer-motion';

const AdminDashboardPage = ({ procedures, onDataRefresh, sharePointAvailable }) => {
  const { navigate } = useNavigation();
  const { user, isAdmin } = useSharePoint();
  const [activeTab, setActiveTab] = useState(0);
  const [auditLog, setAuditLog] = useState([]);
  const [userRoles, setUserRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);
  
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
    
    if (sharePointAvailable) {
      // Run debug functions first
      debugSharePointLists();
      checkCurrentUserPermissions();
    }
    
    loadAuditLog();
    loadUserRoles();
  }, [isAdmin, sharePointAvailable]);

  // SharePoint API Configuration
  const getSharePointConfig = () => {
    return {
      baseUrl: 'https://teams.global.hsbc/sites/EmployeeEng',
      proceduresListUrl: "https://teams.global.hsbc/sites/EmployeeEng/_api/web/lists/getbytitle('Procedures')/items",
      auditLogListUrl: "https://teams.global.hsbc/sites/EmployeeEng/_api/web/lists/getbytitle('AuditLog')/items",
      userRolesListUrl: "https://teams.global.hsbc/sites/EmployeeEng/_api/web/lists/getbytitle('UserRoles')/items"
    };
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

  // 🔍 DEBUG FUNCTION 1: Check SharePoint Lists
  const debugSharePointLists = async () => {
    try {
      const config = getSharePointConfig();
      
      console.log('🔍 Testing SharePoint list access...');
      
      // First, test if we can read any lists at all
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
        
        // Check if UserRoles exists
        const userRolesList = lists.find(list => 
          list.Title === 'UserRoles' || 
          list.Title === 'User Roles' ||
          list.Title === 'UserAccessControl'
        );
        
        const debugResult = {
          listsFound: lists.length,
          availableLists: lists.map(l => l.Title),
          userRolesExists: !!userRolesList,
          userRolesTitle: userRolesList?.Title || 'NOT FOUND'
        };
        
        if (userRolesList) {
          console.log(`✅ Found UserRoles list: ${userRolesList.Title}`);
          
          // Test read access to UserRoles
          const testReadUrl = `${config.baseUrl}/_api/web/lists/getbytitle('${userRolesList.Title}')/items?$select=Id&$top=1`;
          
          const readResponse = await fetch(testReadUrl, {
            method: 'GET',
            headers: { 'Accept': 'application/json; odata=verbose' },
            credentials: 'include'
          });
          
          debugResult.canReadUserRoles = readResponse.ok;
          debugResult.readStatus = readResponse.status;
          
          if (readResponse.ok) {
            console.log('✅ UserRoles list - READ access: OK');
          } else {
            console.log('❌ UserRoles list - READ access: DENIED', readResponse.status);
          }
        } else {
          console.log('❌ UserRoles list NOT FOUND');
          console.log('📝 Available list names:', lists.map(l => l.Title));
          debugResult.canReadUserRoles = false;
          debugResult.readStatus = 'LIST_NOT_FOUND';
        }
        
        setDebugInfo(debugResult);
        
      } else {
        console.error('❌ Cannot access SharePoint lists:', response.status);
        setDebugInfo({
          error: `Cannot access SharePoint lists: ${response.status}`,
          listsFound: 0,
          userRolesExists: false
        });
      }
      
    } catch (err) {
      console.error('❌ Error debugging SharePoint lists:', err);
      setDebugInfo({
        error: err.message,
        listsFound: 0,
        userRolesExists: false
      });
    }
  };

  // 🔍 DEBUG FUNCTION 2: Check Current User Permissions
  const checkCurrentUserPermissions = async () => {
    try {
      const config = getSharePointConfig();
      
      console.log('👤 Checking current user permissions...');
      
      // Get current user info
      const userInfoUrl = `${config.baseUrl}/_api/web/currentuser`;
      
      const response = await fetch(userInfoUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json; odata=verbose' },
        credentials: 'include'
      });
      
      if (response.ok) {
        const userData = await response.json();
        const currentUser = userData.d;
        
        console.log('👤 Current SharePoint User Info:');
        console.log(`   - Login Name: ${currentUser.LoginName}`);
        console.log(`   - Title: ${currentUser.Title}`);
        console.log(`   - Email: ${currentUser.Email}`);
        console.log(`   - User ID: ${currentUser.Id}`);
        
        // Check if user is site admin
        const groupsUrl = `${config.baseUrl}/_api/web/currentuser/groups`;
        const groupsResponse = await fetch(groupsUrl, {
          method: 'GET',
          headers: { 'Accept': 'application/json; odata=verbose' },
          credentials: 'include'
        });
        
        if (groupsResponse.ok) {
          const groupsData = await groupsResponse.json();
          const groups = groupsData.d.results;
          
          console.log('👥 User Groups:');
          groups.forEach(group => {
            console.log(`   - ${group.Title} (ID: ${group.Id})`);
          });
          
          const isOwner = groups.some(g => g.Title.includes('Owners'));
          const isMember = groups.some(g => g.Title.includes('Members'));
          
          console.log(`🔐 Permission Summary:`);
          console.log(`   - Is Site Owner: ${isOwner}`);
          console.log(`   - Is Site Member: ${isMember}`);
        }
        
      } else {
        console.error('❌ Cannot get current user info:', response.status);
      }
      
    } catch (err) {
      console.error('❌ Error checking user permissions:', err);
    }
  };

  // 🔍 DEBUG FUNCTION 3: Create UserRoles List
  const createUserRolesList = async () => {
    try {
      const config = getSharePointConfig();
      
      console.log('📝 Creating UserRoles list...');
      setLoading(true);
      
      // Get request digest first
      const digestUrl = `${config.baseUrl}/_api/contextinfo`;
      const digestResponse = await fetch(digestUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json; odata=verbose',
          'Content-Type': 'application/json; odata=verbose'
        },
        credentials: 'include'
      });
      
      if (!digestResponse.ok) {
        throw new Error(`Cannot get request digest: ${digestResponse.status}`);
      }
      
      const digestData = await digestResponse.json();
      const requestDigest = digestData.d.GetContextWebInformation.FormDigestValue;
      
      console.log('✅ Got request digest for list creation');
      
      // Create the list
      const listData = {
        __metadata: { type: 'SP.List' },
        Title: 'UserRoles',
        Description: 'User access control and role management for Procedures Hub',
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
        console.log('✅ UserRoles list created successfully:', createdList.d.Id);
        
        // Add custom columns
        await addUserRolesColumns(createdList.d.Id, requestDigest);
        
        setNotification({ 
          type: 'success', 
          message: 'UserRoles list created successfully in SharePoint' 
        });
        
        // Refresh debug info
        setTimeout(() => {
          debugSharePointLists();
        }, 2000);
        
      } else {
        const errorText = await createResponse.text();
        console.error('❌ Failed to create UserRoles list:', createResponse.status, errorText);
        setNotification({ 
          type: 'error', 
          message: `Failed to create UserRoles list: ${createResponse.status}` 
        });
      }
      
    } catch (err) {
      console.error('❌ Error creating UserRoles list:', err);
      setNotification({ 
        type: 'error', 
        message: 'Error creating UserRoles list: ' + err.message 
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper function to add custom columns
  const addUserRolesColumns = async (listId, requestDigest) => {
    const config = getSharePointConfig();
    
    const columns = [
      {
        __metadata: { type: 'SP.Field' },
        Title: 'DisplayName',
        FieldTypeKind: 2, // Text
        Required: false,
        Description: 'User display name'
      },
      {
        __metadata: { type: 'SP.Field' },
        Title: 'UserRole',
        FieldTypeKind: 2, // Text
        Required: true,
        Description: 'User role: admin, uploader, or user'
      },
      {
        __metadata: { type: 'SP.Field' },
        Title: 'Status',
        FieldTypeKind: 2, // Text
        Required: false,
        Description: 'User status: active or inactive'
      },
      {
        __metadata: { type: 'SP.Field' },
        Title: 'LastLogin',
        FieldTypeKind: 4, // DateTime
        Required: false,
        Description: 'Last login timestamp'
      },
      {
        __metadata: { type: 'SP.Field' },
        Title: 'GrantedBy',
        FieldTypeKind: 2, // Text
        Required: false,
        Description: 'User ID who granted access'
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
          console.log(`✅ Added column: ${column.Title}`);
        } else {
          console.log(`⚠️ Could not add column ${column.Title}: ${columnResponse.status}`);
        }
      } catch (err) {
        console.log(`⚠️ Error adding column ${column.Title}:`, err);
      }
    }
  };

  // Load Audit Log from SharePoint
  const loadAuditLog = async () => {
    try {
      setLoading(true);
      const config = getSharePointConfig();
      
      if (sharePointAvailable) {
        console.log('🔍 Loading audit log from SharePoint...');
        
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
          console.log('✅ Audit log loaded from SharePoint:', auditEntries.length, 'entries');
        } else {
          console.log('⚠️ SharePoint audit log not accessible (status:', response.status, '), using mock data');
          loadMockAuditLog();
        }
      } else {
        console.log('📝 Loading mock audit log (SharePoint not available)');
        loadMockAuditLog();
      }
    } catch (err) {
      console.error('❌ Error loading audit log:', err);
      loadMockAuditLog();
    } finally {
      setLoading(false);
    }
  };

  // Load User Roles from SharePoint
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
            createdBy: item.Author?.Title || 'System'
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

  // Handle User Access Management - Updated with better error handling
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
        
        // FIRST: Get a fresh request digest
        const digestUrl = `${config.baseUrl}/_api/contextinfo`;
        
        let requestDigest = '';
        try {
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
            requestDigest = digestData.d.GetContextWebInformation.FormDigestValue;
            console.log('✅ Got fresh request digest');
          } else {
            throw new Error(`Digest request failed: ${digestResponse.status}`);
          }
        } catch (digestError) {
          console.log('⚠️ Could not get fresh digest, using page digest');
          const digestElement = document.getElementById('__REQUESTDIGEST');
          requestDigest = digestElement?.value || '';
        }
        
        if (!requestDigest) {
          setNotification({ type: 'error', message: 'Cannot get authentication token from SharePoint' });
          return;
        }
        
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
          await logAuditAction('USER_ACCESS_GRANTED', null, {
            targetUserId: newUser.userId,
            targetUserName: newUser.displayName,
            role: newUser.role,
            grantedBy: user?.staffId
          });
          
          setNotification({ 
            type: 'success', 
            message: `✅ Access granted to User ID ${newUser.userId} (${newUser.displayName}) in SharePoint` 
          });
          loadUserRoles();
          setNewUser({ userId: '', displayName: '', role: 'user' });
        } else {
          const errorText = await response.text();
          console.error('SharePoint access grant error:', response.status, errorText);
          
          // More specific error messages
          if (response.status === 403) {
            setNotification({ 
              type: 'error', 
              message: `❌ Permission denied. Check if 'UserRoles' list exists and you have write permissions.` 
            });
          } else if (response.status === 404) {
            setNotification({ 
              type: 'error', 
              message: `❌ UserRoles list not found. Please create the list first.` 
            });
          } else {
            setNotification({ 
              type: 'error', 
              message: `❌ Failed to grant access in SharePoint (${response.status}): ${errorText}` 
            });
          }
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
          createdBy: user?.staffId
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

  // Handle Procedure Edit
  const handleEditProcedure = async (procedure, updates) => {
    try {
      setLoading(true);
      const config = getSharePointConfig();
      
      if (sharePointAvailable) {
        console.log('📝 Updating procedure in SharePoint:', procedure.id);
        
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

        const response = await fetch(updateUrl, {
          method: 'POST',
          headers: {
            ...getHeaders(true),
            'X-HTTP-Method': 'MERGE',
            'IF-MATCH': '*'
          },
          credentials: 'include',
          body: JSON.stringify(updateData)
        });

        if (response.ok || response.status === 204) {
          await logAuditAction('PROCEDURE_UPDATED', procedure.name, {
            procedureId: procedure.id,
            updates: updates,
            updatedBy: user?.staffId
          });
          
          setNotification({ type: 'success', message: 'Procedure updated successfully in SharePoint' });
          onDataRefresh();
        } else {
          const errorText = await response.text();
          console.error('SharePoint update error:', response.status, errorText);
          setNotification({ type: 'error', message: `Failed to update procedure in SharePoint (${response.status})` });
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

  // Handle Procedure Delete
  const handleDeleteProcedure = async (procedure) => {
    try {
      setLoading(true);
      const config = getSharePointConfig();
      
      if (sharePointAvailable) {
        console.log('🗑️ Deleting procedure from SharePoint:', procedure.id);
        
        const deleteUrl = `${config.proceduresListUrl}(${procedure.id})`;
        
        const response = await fetch(deleteUrl, {
          method: 'POST',
          headers: {
            ...getHeaders(true),
            'X-HTTP-Method': 'DELETE',
            'IF-MATCH': '*'
          },
          credentials: 'include'
        });

        if (response.ok || response.status === 204) {
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
          console.error('SharePoint delete error:', response.status, errorText);
          setNotification({ type: 'error', message: `Failed to delete procedure from SharePoint (${response.status})` });
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

  // Log Audit Action to SharePoint
  const logAuditAction = async (action, procedureName, details) => {
    try {
      const config = getSharePointConfig();
      
      if (sharePointAvailable) {
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

        const response = await fetch(config.auditLogListUrl, {
          method: 'POST',
          headers: getHeaders(true),
          credentials: 'include',
          body: JSON.stringify(auditData)
        });
        
        if (response.ok) {
          console.log('📝 Audit action logged successfully:', action, 'by User ID:', user?.staffId);
        } else {
          console.log('⚠️ Failed to log audit action:', response.status);
        }
      }
    } catch (err) {
      console.error('❌ Error logging audit action:', err);
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
        action: 'USER_ACCESS_GRANTED',
        user: user?.staffId || '43898931',
        procedureName: null,
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
        details: { targetUserId: '87654321', targetUserName: 'Sarah Johnson', role: 'user' },
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
       status: 'active' 
     },
     { 
       id: 2, 
       userId: '12345678', 
       displayName: 'John Smith',
       role: 'user', 
       lastLogin: new Date(Date.now() - 5 * 60 * 60 * 1000), 
       status: 'active' 
     },
     { 
       id: 3, 
       userId: '87654321', 
       displayName: 'Sarah Johnson',
       role: 'user', 
       lastLogin: new Date(Date.now() - 24 * 60 * 60 * 1000), 
       status: 'active' 
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
   totalUsers: userRoles.length,
   adminUsers: userRoles.filter(u => u.role === 'admin').length,
   uploaderUsers: userRoles.filter(u => u.role === 'uploader').length
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
       
       {/* SharePoint Status & User Info */}
       <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
         <Chip 
           icon={sharePointAvailable ? <CheckCircle /> : <Warning />}
           label={sharePointAvailable ? 'SharePoint Connected - Live Data' : 'Demo Mode - Mock Data'}
           color={sharePointAvailable ? 'success' : 'warning'}
           variant="outlined"
         />
         <Chip 
           label={`Admin: ${user?.displayName} (${user?.staffId})`}
           color="error"
           variant="outlined"
           icon={<Person />}
         />
         {sharePointAvailable && (
           <Chip 
             label="https://teams.global.hsbc/sites/EmployeeEng"
             size="small"
             variant="outlined"
             sx={{ fontSize: '0.7rem' }}
           />
         )}
       </Box>

       {/* 🔍 DEBUG INFO DISPLAY */}
       {debugInfo && (
         <Alert 
           severity={debugInfo.userRolesExists ? "success" : "warning"} 
           sx={{ mt: 2 }}
           action={
             !debugInfo.userRolesExists && (
               <Button 
                 color="inherit" 
                 size="small"
                 onClick={createUserRolesList}
                 disabled={loading}
                 startIcon={loading ? <CircularProgress size={16} /> : <Assignment />}
               >
                 {loading ? 'Creating...' : 'Create List'}
               </Button>
             )
           }
         >
           <Typography variant="body2" fontWeight="bold" gutterBottom>
             🔍 SharePoint Debug Info:
           </Typography>
           <Typography variant="body2" component="div">
             • Lists Found: {debugInfo.listsFound}<br/>
             • UserRoles List: {debugInfo.userRolesExists ? `✅ Found (${debugInfo.userRolesTitle})` : '❌ Not Found'}<br/>
             • Read Access: {debugInfo.canReadUserRoles ? '✅ OK' : `❌ Failed (${debugInfo.readStatus})`}<br/>
             {debugInfo.error && (
               <>• Error: {debugInfo.error}<br/></>
             )}
             {debugInfo.availableLists && (
               <>• Available Lists: {debugInfo.availableLists.join(', ')}</>
             )}
           </Typography>
         </Alert>
       )}
     </Box>

     {/* Admin Stats Cards */}
     <Grid container spacing={3} sx={{ mb: 4 }}>
       <Grid item xs={12} sm={6} md={3}>
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

       <Grid item xs={12} sm={6} md={3}>
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

       <Grid item xs={12} sm={6} md={3}>
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
                     Total Users
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

       <Grid item xs={12} sm={6} md={3}>
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
                   onClick={debugSharePointLists}
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
             label="Audit Log" 
             icon={<History />} 
             iconPosition="start"
           />
           <Tab 
             label="Access Rights" 
             icon={<Security />} 
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
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Procedure">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => setDeleteDialog({ open: true, procedure })}
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

      {/* Tab 2: Audit Log */}
      <TabPanel hidden={activeTab !== 1}>
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              System Audit Log ({auditLog.length} entries)
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
                No audit entries
              </Typography>
              <Typography variant="body2" color="text.secondary">
                System activities will appear here
              </Typography>
              {sharePointAvailable && (
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                  Audit entries are stored in SharePoint AuditLog list
                </Typography>
              )}
            </Box>
          )}
        </Box>
      </TabPanel>

      {/* Tab 3: Access Rights */}
      <TabPanel hidden={activeTab !== 2}>
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              User Access Management ({userRoles.length} users)
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={loadUserRoles}
                disabled={loading}
                size="small"
              >
                Refresh Users
              </Button>
              <Button
                variant="contained"
                startIcon={<PersonAdd />}
                onClick={() => setAccessDialog({ open: true })}
                disabled={!debugInfo?.userRolesExists}
              >
                Grant Access
              </Button>
            </Box>
          </Box>

          {loading && <LinearProgress sx={{ mb: 2 }} />}

          {/* Access Control Info with Debug Status */}
          <Alert severity={debugInfo?.userRolesExists ? "info" : "warning"} sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>Access Control:</strong> User access is managed by User ID (not email). 
              {debugInfo?.userRolesExists ? 
                ' UserRoles list is available for managing access.' :
                ' UserRoles list needs to be created first.'
              }
            </Typography>
            {debugInfo && !debugInfo.userRolesExists && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                <strong>Status:</strong> UserRoles list not found in SharePoint. Click "Create List" above to create it.
              </Typography>
            )}
          </Alert>

          {/* User Stats */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={4}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="error.main" fontWeight="bold">
                  {adminStats.adminUsers}
                </Typography>
                <Typography variant="body2">Admins</Typography>
              </Paper>
            </Grid>
            <Grid item xs={4}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="warning.main" fontWeight="bold">
                  {adminStats.uploaderUsers}
                </Typography>
                <Typography variant="body2">Uploaders</Typography>
              </Paper>
            </Grid>
            <Grid item xs={4}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="primary.main" fontWeight="bold">
                  {userRoles.filter(u => u.role === 'user').length}
                </Typography>
                <Typography variant="body2">Users</Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* User Table */}
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell><strong>User ID & Name</strong></TableCell>
                  <TableCell><strong>Role</strong></TableCell>
                  <TableCell><strong>Last Login</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
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
                            {sharePointAvailable && (
                              <Chip 
                                label="SharePoint" 
                                size="small" 
                                variant="outlined"
                                sx={{ ml: 1, fontSize: '0.6rem', height: 16 }}
                              />
                            )}
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
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Edit Role">
                          <IconButton size="small">
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Revoke Access">
                          <IconButton size="small" color="error">
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

          {userRoles.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <People sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No users found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                User access records will appear here
              </Typography>
              {sharePointAvailable && (
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                  User roles are stored in SharePoint UserRoles list by User ID
                </Typography>
              )}
            </Box>
          )}
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

    {/* Grant Access Dialog - Updated for User ID */}
    <Dialog open={accessDialog.open} onClose={() => setAccessDialog({ open: false })}>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonAdd />
          Grant User Access (User ID Based)
          {sharePointAvailable && (
            <Chip label="SharePoint" size="small" color="success" variant="outlined" />
          )}
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          {/* Debug Info in Dialog */}
          {debugInfo && !debugInfo.userRolesExists && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>UserRoles list not found!</strong> Please create the UserRoles list first before granting access.
              </Typography>
            </Alert>
          )}
          
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
            disabled={!debugInfo?.userRolesExists}
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
            disabled={!debugInfo?.userRolesExists}
          />
          <FormControl fullWidth variant="outlined" disabled={!debugInfo?.userRolesExists}>
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
          
          {sharePointAvailable && debugInfo?.userRolesExists && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="caption">
                User will be added to SharePoint UserRoles list with User ID: {newUser.userId}
              </Typography>
            </Alert>
          )}
          
          {debugInfo && (
            <Alert severity="success" sx={{ mt: 2 }}>
              <Typography variant="caption">
                <strong>Debug Status:</strong><br/>
                • SharePoint Lists: {debugInfo.listsFound} found<br/>
                • UserRoles List: {debugInfo.userRolesExists ? '✅ Available' : '❌ Missing'}<br/>
                • Read Access: {debugInfo.canReadUserRoles ? '✅ OK' : '❌ Failed'}
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
          disabled={loading || !newUser.userId || !newUser.userId.match(/^\d+$/) || !debugInfo?.userRolesExists}
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
  </Box>
);
};

export default AdminDashboardPage;
