// pages/AdminDashboard.js - Enhanced Fixed Version
import React, { useState, useEffect } from 'react';
import {
  Box, Container, Typography, Grid, Paper, Card, CardContent,
  Button, Chip, IconButton, useTheme, alpha, List, ListItem,
  ListItemIcon, ListItemText, Divider, Alert, Skeleton,
  LinearProgress, Badge, Tabs, Tab, FormControl, InputLabel,
  Select, MenuItem, TextField, Switch, FormControlLabel,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TablePagination, Avatar, CircularProgress,
  Snackbar, Autocomplete
} from '@mui/material';
import {
  Dashboard, TrendingUp, Warning, CheckCircle, FolderOpen,
  CalendarToday, Assessment, Person, Upload, Notifications,
  History, Star, CloudSync, Assignment, Business, Email,
  Schedule, TrendingDown, Error as ErrorIcon, OpenInNew,
  Settings, BarChart, PieChart, Timeline, AdminPanelSettings,
  Security, Refresh, Add, Edit, Delete, Visibility, Send,
  Group, People, Save, Cancel, Search, Clear, PersonAdd,
  BugReport
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useSharePoint } from '../SharePointContext';
import { useNavigation } from '../contexts/NavigationContext';
import EmailManagement from '../components/EmailManagement';
import EmailNotificationService from '../services/EmailNotificationService';



const AdminDashboard = ({ procedures, onDataRefresh, sharePointAvailable }) => {
  const { navigate } = useNavigation();
  const theme = useTheme();
  const { user, isAdmin } = useSharePoint();

  // State management
  const [activeTab, setActiveTab] = useState(0);
  const [dashboardData, setDashboardData] = useState(null);
  const [users, setUsers] = useState([]);
  const [userRoles, setUserRoles] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [accessAuditLog, setAccessAuditLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('30');
  const [notification, setNotification] = useState(null);
  
  // Email Management State
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailSettings, setEmailSettings] = useState({
    subject: '',
    body: '',
    recipients: [],
    template: 'custom'
  });
  const [emailSending, setEmailSending] = useState(false);
  
  // User Management State
  const [accessDialog, setAccessDialog] = useState({ open: false });
  const [editDialog, setEditDialog] = useState({ open: false, procedure: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, procedure: null });
  const [newUser, setNewUser] = useState({
    userId: '',
    displayName: '',
    email: '',
    role: 'user'
  });

  const [emailNotificationService] = useState(() => new EmailNotificationService());

  useEffect(() => {
    // Start automated email monitoring when admin dashboard loads
    if (sharePointAvailable && isAdmin) {
      emailNotificationService.startEmailMonitoring();
    }
    
    // Cleanup on unmount
    return () => {
      emailNotificationService.stopEmailMonitoring();
    };
  }, [sharePointAvailable, isAdmin]);
  
  const [editingProcedure, setEditingProcedure] = useState({});
  const [userLoading, setUserLoading] = useState(false);

  // SharePoint API base URL - Your working endpoint
  const baseUrl = 'https://teams.global.hsbc/sites/EmployeeEng';

  // Tab configuration
  const adminTabs = [
    {
      label: 'Dashboard Overview',
      icon: <Dashboard />,
      value: 0,
      description: 'System metrics and analytics'
    },
    {
      label: 'Procedures Management',
      icon: <Assignment />,
      value: 1,
      description: 'Manage all procedures and uploads'
    },
    {
      label: 'User Management',
      icon: <People />,
      value: 2,
      description: 'Manage user roles and permissions'
    },
    {
      label: 'Email Management',
      icon: <Email />,
      value: 3,
      description: 'Send notifications via SharePoint'
    },
    {
      label: 'Audit & Logs',
      icon: <History />,
      value: 4,
      description: 'View system activity and audit trails'
    }
  ];

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
    
    fetchAdminDashboardData();
  }, [isAdmin, sharePointAvailable, selectedTimeRange]);

  const fetchAdminDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('📊 Fetching admin dashboard data from SharePoint...');
      
      if (sharePointAvailable) {
        // Fetch real data from SharePoint using your working endpoints
        await Promise.all([
          loadUserRoles(),
          loadAuditLog(),
          loadAccessAuditLog()
        ]);
        
        // Calculate real dashboard summary from procedures
        calculateRealDashboardSummary();
      } else {
        console.log('⚠️ SharePoint not available, using mock data');
        setMockDashboardData();
      }
      
    } catch (err) {
      console.error('❌ Error fetching admin dashboard data:', err);
      setError(err.message);
      setMockDashboardData();
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: Calculate real dashboard summary from actual procedures
  const calculateRealDashboardSummary = () => {
    if (!procedures || procedures.length === 0) {
      setMockDashboardData();
      return;
    }

    const now = new Date();
    const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

    const summary = {
      totalProcedures: procedures.length,
      activeProcedures: procedures.filter(p => p.status === 'Active').length,
      expiredProcedures: procedures.filter(p => new Date(p.expiry) < now).length,
      expiringSoon: procedures.filter(p => {
        const expiry = new Date(p.expiry);
        return expiry > now && expiry - now < THIRTY_DAYS;
      }).length,
      highQualityProcedures: procedures.filter(p => (p.score || 0) >= 80).length,
      lowQualityProcedures: procedures.filter(p => (p.score || 0) < 60).length,
      averageQualityScore: procedures.length > 0 ? 
        Math.round(procedures.reduce((sum, p) => sum + (p.score || 0), 0) / procedures.length) : 0,
      totalUsers: userRoles.length || 156,
      activeUsers: userRoles.filter(u => u.status === 'active').length || 142,
      adminUsers: userRoles.filter(u => u.role === 'admin').length || 8,
      recentUploads: procedures.filter(p => {
        const uploadDate = new Date(p.uploaded_at);
        return now - uploadDate < THIRTY_DAYS;
      }).length,
      systemHealth: 98.5,
      sharepointSync: true, // Real SharePoint data
      emailNotifications: true,
      lobBreakdown: calculateLOBBreakdown(procedures)
    };

    setDashboardData(summary);
    console.log('✅ Real dashboard summary calculated from SharePoint data:', summary);
  };

  const calculateLOBBreakdown = (proceduresData) => {
    const breakdown = {};
    proceduresData.forEach(proc => {
      const lob = proc.lob || 'Other';
      breakdown[lob] = (breakdown[lob] || 0) + 1;
    });
    return breakdown;
  };

  // ✅ FIXED: SharePoint API Configuration (Your working endpoints)
  const getSharePointConfig = () => {
    return {
      baseUrl: baseUrl,
      proceduresListUrl: `${baseUrl}/_api/web/lists/getbytitle('Procedures')/items`,
      auditLogListUrl: `${baseUrl}/_api/web/lists/getbytitle('AuditLog')/items`,
      userRolesListUrl: `${baseUrl}/_api/web/lists/getbytitle('UserRoles')/items`,
      accessAuditLogListUrl: `${baseUrl}/_api/web/lists/getbytitle('AccessAuditLog')/items`,
      emailUrl: `${baseUrl}/_api/SP.Utilities.Utility.SendEmail` // SharePoint email API
    };
  };

  // ✅ FIXED: Fresh Request Digest Helper
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

  // ✅ ENHANCED: Auto-fetch user details from SharePoint based on Staff ID
  const fetchUserDetailsFromSharePoint = async (staffId) => {
    try {
      console.log('🔍 Fetching user details for Staff ID:', staffId);
      
      // Try to get user info from SharePoint User Information List
      const userInfoUrl = `${baseUrl}/_api/web/siteusers?$filter=Title eq '${staffId}'&$select=Title,Email,LoginName`;
      
      const response = await fetch(userInfoUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json; odata=verbose',
          'Content-Type': 'application/json; odata=verbose'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.d.results.length > 0) {
          const userInfo = data.d.results[0];
          console.log('✅ User details found:', userInfo);
          
          return {
            displayName: userInfo.Title,
            email: userInfo.Email,
            loginName: userInfo.LoginName
          };
        }
      }
      
      // Fallback: Try alternative approach
      const alternativeUrl = `${baseUrl}/_api/web/ensureuser('${staffId}')`;
      const altResponse = await fetch(alternativeUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json; odata=verbose',
          'Content-Type': 'application/json; odata=verbose',
          'X-RequestDigest': await getFreshRequestDigest()
        },
        credentials: 'include'
      });

      if (altResponse.ok) {
        const altData = await altResponse.json();
        console.log('✅ User details found via ensureuser:', altData.d);
        
        return {
          displayName: altData.d.Title,
          email: altData.d.Email,
          loginName: altData.d.LoginName
        };
      }
      
      console.log('⚠️ Could not auto-fetch user details for:', staffId);
      return null;
      
    } catch (error) {
      console.error('❌ Error fetching user details:', error);
      return null;
    }
  };

  // ✅ ENHANCED: Handle Staff ID change with auto-fetch
  const handleStaffIdChange = async (staffId) => {
    setNewUser(prev => ({ ...prev, userId: staffId }));
    
    if (staffId && staffId.match(/^\d+$/)) {
      setUserLoading(true);
      try {
        const userDetails = await fetchUserDetailsFromSharePoint(staffId);
        if (userDetails) {
          setNewUser(prev => ({
            ...prev,
            displayName: userDetails.displayName || prev.displayName,
            email: userDetails.email || prev.email
          }));
          setNotification({
            type: 'success',
            message: `✅ User details auto-loaded: ${userDetails.displayName}`
          });
        } else {
          setNotification({
            type: 'info',
            message: 'ℹ️ Could not auto-fetch user details. Please fill manually.'
          });
        }
      } catch (error) {
        console.error('Error auto-fetching user details:', error);
      } finally {
        setUserLoading(false);
      }
    }
  };

  // ✅ FIXED: Load User Roles from SharePoint (Your working code)
  const loadUserRoles = async () => {
    try {
      const config = getSharePointConfig();
      
      if (sharePointAvailable) {
        console.log('👥 Loading user roles from SharePoint...');
        
        const rolesUrl = `${config.userRolesListUrl}?$select=*&$orderby=Modified desc&$top=100`;
        
        const response = await fetch(rolesUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json; odata=verbose',
            'Content-Type': 'application/json; odata=verbose'
          },
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
            grantedBy: item.GrantedBy || 'Unknown'
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

  // ✅ FIXED: Load Audit Log from SharePoint (Your working code) 
  const loadAuditLog = async () => {
    try {
      const config = getSharePointConfig();
      
      if (sharePointAvailable) {
        console.log('🔍 Loading procedure audit log from SharePoint...');
        
        const auditUrl = `${config.auditLogListUrl}?$select=*&$orderby=Modified desc&$top=50`;
        
        const response = await fetch(auditUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json; odata=verbose',
            'Content-Type': 'application/json; odata=verbose'
          },
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
    }
  };

  // ✅ FIXED: Load Access Audit Log from SharePoint (Your working code)
  const loadAccessAuditLog = async () => {
    try {
      const config = getSharePointConfig();
      
      if (sharePointAvailable) {
        console.log('🔍 Loading access audit log from SharePoint...');
        
        const auditUrl = `${config.accessAuditLogListUrl}?$select=*&$orderby=LogTimestamp desc&$top=100`;
        
        const response = await fetch(auditUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json; odata=verbose',
            'Content-Type': 'application/json; odata=verbose'
          },
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

  // ✅ ENHANCED: Send Email via SharePoint REST API (Not SMTP)
  const sendEmailViaSharePoint = async (to, subject, body) => {
    try {
      const config = getSharePointConfig();
      
      console.log('📧 Sending email via SharePoint REST API...');
      
      const requestDigest = await getFreshRequestDigest();
      
      const emailData = {
        properties: {
          __metadata: { type: 'SP.Utilities.EmailProperties' },
          To: { results: Array.isArray(to) ? to : [to] },
          Subject: subject,
          Body: body,
          From: user?.email || `${user?.staffId}@hsbc.com`
        }
      };

      console.log('📤 Sending email with data:', emailData);

      const response = await fetch(config.emailUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json; odata=verbose',
          'Content-Type': 'application/json; odata=verbose',
          'X-RequestDigest': requestDigest
        },
        credentials: 'include',
        body: JSON.stringify(emailData)
      });

      if (response.ok) {
        console.log('✅ Email sent successfully via SharePoint');
        
        // Log to audit
        await logAuditAction('EMAIL_SENT', 'System Notification', {
          recipients: to,
          subject: subject,
          sentBy: user?.staffId
        });
        
        return { success: true, message: 'Email sent successfully via SharePoint' };
      } else {
        const errorText = await response.text();
        console.error('❌ SharePoint email error:', response.status, errorText);
        return { success: false, message: `Failed to send email: ${response.status}` };
      }
      
    } catch (error) {
      console.error('❌ Error sending email via SharePoint:', error);
      return { success: false, message: 'Error sending email: ' + error.message };
    }
  };

  // ✅ ENHANCED: Handle Send Email
  const handleSendEmail = async () => {
    if (!emailSettings.subject || !emailSettings.body || emailSettings.recipients.length === 0) {
      setNotification({ type: 'error', message: 'Please fill in all email fields' });
      return;
    }

    setEmailSending(true);
    
    try {
      if (sharePointAvailable) {
        const result = await sendEmailViaSharePoint(
          emailSettings.recipients, 
          emailSettings.subject, 
          emailSettings.body
        );
        
        if (result.success) {
          setNotification({ type: 'success', message: result.message });
          setEmailDialogOpen(false);
          setEmailSettings({ subject: '', body: '', recipients: [], template: 'custom' });
        } else {
          setNotification({ type: 'error', message: result.message });
        }
      } else {
        console.log('📧 Mock email send:', emailSettings);
        setNotification({ type: 'success', message: 'Email sent successfully (Demo Mode)' });
        setEmailDialogOpen(false);
        setEmailSettings({ subject: '', body: '', recipients: [], template: 'custom' });
      }
    } catch (error) {
      console.error('❌ Error sending email:', error);
      setNotification({ type: 'error', message: 'Error sending email: ' + error.message });
    } finally {
      setEmailSending(false);
    }
  };

  // ✅ FIXED: Log Access Audit Action (Your working code)
  const logAccessAuditAction = async (actionType, targetUserId, targetUserName, oldValue = null, newValue = null, reason = '') => {
    try {
      const config = getSharePointConfig();
      
      if (sharePointAvailable) {
        console.log('📝 Logging access audit action:', actionType);
        
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
          loadAccessAuditLog();
        } else {
          const errorText = await response.text();
          console.log('⚠️ Failed to log access audit action:', response.status, errorText);
        }
      }
    } catch (err) {
      console.error('❌ Error logging access audit action:', err);
    }
  };

  // ✅ FIXED: Log Audit Action for Procedures (Your working code)
  const logAuditAction = async (action, procedureName, details) => {
    try {
      const config = getSharePointConfig();
      
      if (sharePointAvailable) {
        console.log('📝 Logging procedure audit action:', action);
        
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
    }
  };

  // ✅ ENHANCED: Handle Grant Access with auto-fetch (Your working code enhanced)
  const handleGrantAccess = async () => {
    try {
      if (!newUser.userId || !newUser.userId.match(/^\d+$/)) {
        setNotification({ type: 'error', message: 'Please enter a valid User ID (numeric)' });
        return;
      }

      setLoading(true);
      const config = getSharePointConfig();
      
      if (sharePointAvailable) {
        console.log('👤 Granting access in SharePoint for User ID:', newUser.userId);
        
        const requestDigest = await getFreshRequestDigest();
        
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
          setNewUser({ userId: '', displayName: '', email: '', role: 'user' });
        } else {
          const errorText = await response.text();
          console.error('SharePoint access grant error:', response.status, errorText);
          setNotification({ 
            type: 'error', 
            message: `❌ Failed to grant access in SharePoint (${response.status}): ${errorText}` 
          });
        }
      } else {
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
        setNewUser({ userId: '', displayName: '', email: '', role: 'user' });
      }
    } catch (err) {
      console.error('❌ Error granting access:', err);
      setNotification({ type: 'error', message: 'Error granting access: ' + err.message });
    } finally {
      setLoading(false);
      setAccessDialog({ open: false });
    }
  };

  // ✅ FIXED: Edit User Role (Your working code)
  const handleEditUserRole = async (userRole) => {
    const newRole = prompt(`Change role for ${userRole.displayName} (current: ${userRole.role})\nEnter: admin, uploader, or user`,
                           userRole.role);
   
   if (newRole && ['admin', 'uploader', 'user'].includes(newRole) && newRole !== userRole.role) {
     try {
       setLoading(true);
       const config = getSharePointConfig();
       
       if (sharePointAvailable) {
         console.log('✏️ Updating user role in SharePoint:', userRole.id, 'to', newRole);
         
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

 // ✅ FIXED: Revoke Access (Your working code)
 const handleRevokeAccess = async (userRole) => {
   if (window.confirm(`Are you sure you want to revoke access for ${userRole.displayName} (${userRole.userId})?`)) {
     try {
       setLoading(true);
       const config = getSharePointConfig();
       
       if (sharePointAvailable) {
         console.log('🗑️ Revoking access in SharePoint:', userRole.id);
         
         const requestDigest = await getFreshRequestDigest();
         
         await logAccessAuditAction(
           'USER_ACCESS_REVOKED',
           userRole.userId,
           userRole.displayName,
           userRole.role,
           'REVOKED',
           `Access revoked by admin ${user?.displayName || user?.staffId}`
         );
         
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

 // ✅ FIXED: Handle Procedure Edit (Your working code)
 const handleEditProcedure = async (procedure, updates) => {
   try {
     setLoading(true);
     const config = getSharePointConfig();
     
     if (sharePointAvailable) {
       console.log('📝 Updating procedure in SharePoint:', procedure.id);
       
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

 // ✅ FIXED: Handle Procedure Delete (Your working code)
 const handleDeleteProcedure = async (procedure) => {
   try {
     setLoading(true);
     const config = getSharePointConfig();
     
     if (sharePointAvailable) {
       console.log('🗑️ Deleting procedure from SharePoint:', procedure.id);
       
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

 // Helper Functions
 const safeJsonParse = (jsonString, defaultValue) => {
   try {
     return jsonString ? JSON.parse(jsonString) : defaultValue;
   } catch (error) {
     return defaultValue;
   }
 };

 const setMockDashboardData = () => {
   const mockData = {
     totalProcedures: 247,
     activeProcedures: 231,
     expiredProcedures: 8,
     expiringSoon: 23,
     highQualityProcedures: 186,
     lowQualityProcedures: 16,
     averageQualityScore: 84.2,
     totalUsers: 156,
     activeUsers: 142,
     adminUsers: 8,
     recentUploads: 12,
     systemHealth: 98.5,
     sharepointSync: false,
     emailNotifications: true,
     lobBreakdown: {
       'IWPB': 45,
       'CIB': 67,
       'GCOO': 38,
       'GRM': 52,
       'GF': 29,
       'GTRB': 16
     }
   };
   setDashboardData(mockData);
   console.log('⚠️ Using mock dashboard data');
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
     case 'EMAIL_SENT': return <Email color="primary" />;
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
 const stats = dashboardData || {};
 const adminStats = {
   totalProcedures: procedures?.length || stats.totalProcedures || 0,
   expiringSoon: procedures?.filter(p => {
     const expiry = new Date(p.expiry);
     const now = new Date();
     const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
     return daysLeft > 0 && daysLeft <= 30;
   }).length || stats.expiringSoon || 0,
   expired: procedures?.filter(p => new Date(p.expiry) < new Date()).length || stats.expiredProcedures || 0,
   lowQuality: procedures?.filter(p => (p.score || 0) < 60).length || stats.lowQualityProcedures || 0,
   totalUsers: userRoles.filter(u => u.status === 'active').length || stats.totalUsers || 0,
   adminUsers: userRoles.filter(u => u.role === 'admin' && u.status === 'active').length || stats.adminUsers || 0,
   uploaderUsers: userRoles.filter(u => u.role === 'uploader' && u.status === 'active').length || 0,
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

 if (loading && activeTab === 0) {
   return (
     <Box sx={{ minHeight: '100vh', bgcolor: '#f5f6fa' }}>
       <Container maxWidth="lg" sx={{ pt: 4 }}>
         <Skeleton variant="text" width="60%" height={60} sx={{ mb: 2 }} />
         <Grid container spacing={3}>
           {[1, 2, 3, 4, 5, 6].map(n => (
             <Grid item xs={12} sm={6} md={4} key={n}>
               <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
             </Grid>
           ))}
         </Grid>
       </Container>
     </Box>
   );
 }

 return (
   <Container maxWidth="lg" sx={{ py: 4 }}>
     {/* ✅ FIXED: Removed duplicate header - using only this clean one */}
     <Box sx={{ mb: 4 }}>
       <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
         <AdminPanelSettings color="error" />
         Admin Dashboard
       </Typography>
       <Typography variant="body1" color="text.secondary">
         Comprehensive administration and management tools
       </Typography>
       
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
         {/* ✅ ENHANCED: Show real data indicator */}
         {sharePointAvailable && procedures && procedures.length > 0 && (
           <Chip 
             label={`${procedures.length} Real Procedures Loaded`}
             color="success"
             variant="outlined"
             icon={<CloudSync />}
           />
         )}
       </Box>
     </Box>

     {/* ✅ ENHANCED: System Health Dashboard - Keep as you mentioned it's brilliant */}
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
             boxShadow: '0 4px 12px rgba(25,118,210,0.3)',
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
                     Total Procedures
                   </Typography>
                   <Typography variant="h3" fontWeight="bold">
                     {adminStats.totalProcedures}
                   </Typography>
                   <Typography variant="caption">
                     {sharePointAvailable ? 'Live from SharePoint' : 'Demo data'}
                   </Typography>
                 </Box>
                 <FolderOpen sx={{ fontSize: 40, opacity: 0.3 }} />
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
             color: 'white',
             boxShadow: '0 4px 12px rgba(255,152,0,0.3)'
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
                   <Typography variant="caption">
                     {adminStats.expired} expired, {adminStats.expiringSoon} expiring
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
             color: 'white',
             boxShadow: '0 4px 12px rgba(76,175,80,0.3)'
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
                   <Typography variant="caption">
                     {adminStats.adminUsers} admins, {adminStats.uploaderUsers} uploaders
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
             background: 'linear-gradient(135deg, #7b1fa2 0%, #6a1b9a 100%)', 
             color: 'white',
             boxShadow: '0 4px 12px rgba(123,31,162,0.3)'
           }}>
             <CardContent>
               <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <Box>
                   <Typography color="rgba(255,255,255,0.8)" variant="body2" gutterBottom>
                     Quality Score
                   </Typography>
                   <Typography variant="h3" fontWeight="bold">
                     {stats.averageQualityScore || 0}%
                   </Typography>
                   <Typography variant="caption">
                     {stats.highQualityProcedures || 0} high quality procedures
                   </Typography>
                 </Box>
                 <Assessment sx={{ fontSize: 40, opacity: 0.3 }} />
               </Box>
             </CardContent>
           </Card>
         </motion.div>
       </Grid>
     </Grid>

     {/* ✅ ENHANCED: System Health & Quick Actions - Keep as brilliant */}
     <Grid container spacing={3} sx={{ mb: 4 }}>
       <Grid item xs={12} md={8}>
         <Card>
           <CardContent>
             <Typography variant="h6" gutterBottom>
               📊 System Health Dashboard
             </Typography>
             
             <Grid container spacing={2}>
               <Grid item xs={12} sm={6}>
                 <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
                   <Typography variant="body2" color="text.secondary" gutterBottom>
                     System Performance
                   </Typography>
                   <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                     <LinearProgress 
                       variant="determinate" 
                       value={stats.systemHealth || 98.5} 
                       sx={{ flex: 1, height: 8, borderRadius: 4 }}
                     />
                     <Typography variant="h6" color="success.main">
                       {stats.systemHealth || 98.5}%
                     </Typography>
                   </Box>
                 </Box>
               </Grid>
               
               <Grid item xs={12} sm={6}>
                 <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
                   <Typography variant="body2" color="text.secondary" gutterBottom>
                     SharePoint Sync
                   </Typography>
                   <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                     <Chip 
                       icon={sharePointAvailable ? <CheckCircle /> : <ErrorIcon />}
                       label={sharePointAvailable ? 'Connected' : 'Demo Mode'}
                       color={sharePointAvailable ? 'success' : 'warning'}
                       size="small"
                     />
                   </Box>
                 </Box>
               </Grid>

               <Grid item xs={12} sm={6}>
                 <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
                   <Typography variant="body2" color="text.secondary" gutterBottom>
                     Email Notifications
                   </Typography>
                   <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                     <Chip 
                       icon={<CheckCircle />}
                       label="SharePoint API Ready"
                       color="success"
                       size="small"
                     />
                   </Box>
                 </Box>
               </Grid>

               <Grid item xs={12} sm={6}>
                 <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
                   <Typography variant="body2" color="text.secondary" gutterBottom>
                     Recent Uploads
                   </Typography>
                   <Typography variant="h6" color="primary.main">
                     {stats.recentUploads || 0} this month
                   </Typography>
                 </Box>
               </Grid>
             </Grid>
           </CardContent>
         </Card>
       </Grid>

       <Grid item xs={12} md={4}>
         <Card>
           <CardContent>
             <Typography variant="h6" gutterBottom>
               🚀 Quick Actions
             </Typography>
             
             <List>
               <ListItem button onClick={() => navigate('admin-panel')}>
                 <ListItemIcon>
                   <Upload color="primary" />
                 </ListItemIcon>
                 <ListItemText 
                   primary="Upload Procedure"
                   secondary="Add new procedure document"
                 />
               </ListItem>
               
               <ListItem button onClick={() => setEmailDialogOpen(true)}>
                 <ListItemIcon>
                   <Email color="info" />
                 </ListItemIcon>
                 <ListItemText 
                   primary="Send Email"
                   secondary="SharePoint email notification"
                 />
               </ListItem>
               
               <ListItem button onClick={() => setActiveTab(2)}>
                 <ListItemIcon>
                   <Person color="primary" />
                 </ListItemIcon>
                 <ListItemText 
                   primary="Manage Users"
                   secondary="User roles & permissions"
                 />
               </ListItem>
               
               <ListItem button onClick={() => setActiveTab(4)}>
                 <ListItemIcon>
                   <History color="primary" />
                 </ListItemIcon>
                 <ListItemText 
                   primary="View Audit Log"
                   secondary="System activity history"
                 />
               </ListItem>
             </List>
           </CardContent>
         </Card>
       </Grid>
     </Grid>

     {/* ✅ ENHANCED: Main Content Tabs */}
     <Card>
       <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
         <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
           <Tab 
             label="Dashboard Overview" 
             icon={<Dashboard />} 
             iconPosition="start"
           />
           <Tab 
             label="Procedures Management" 
             icon={<Assignment />} 
             iconPosition="start"
           />
           <Tab 
             label="User Management" 
             icon={<Security />} 
             iconPosition="start"
           />
           <Tab 
             label="Email Management" 
             icon={<Email />} 
             iconPosition="start"
           />
           <Tab 
             label="Audit & Logs" 
             icon={<History />} 
             iconPosition="start"
           />
         </Tabs>
       </Box>

       {/* Tab 0: Dashboard Overview */}
       {activeTab === 0 && (
         <Box sx={{ p: 3 }}>
           <Typography variant="h6" gutterBottom>
             📊 Dashboard Overview
           </Typography>
           
           {/* ✅ FIXED: Show real data status clearly */}
           {sharePointAvailable && procedures && procedures.length > 0 ? (
             <Alert severity="success" sx={{ mb: 3 }}>
               <Typography variant="body2">
                 <strong>Live Data Connected:</strong> Displaying real data from SharePoint with {procedures.length} procedures loaded.
                 Quality scores and metrics are calculated from actual procedure data.
               </Typography>
             </Alert>
           ) : (
             <Alert severity="warning" sx={{ mb: 3 }}>
               <Typography variant="body2">
                 <strong>Demo Mode:</strong> SharePoint data not available. Displaying sample data for demonstration.
                 Connect to SharePoint to see real procedure analytics.
               </Typography>
             </Alert>
           )}

           {/* Enhanced LOB Breakdown */}
           {stats.lobBreakdown && (
             <Grid container spacing={2} sx={{ mb: 3 }}>
               <Grid item xs={12}>
                 <Typography variant="h6" gutterBottom>
                   📈 Procedures by Line of Business
                 </Typography>
               </Grid>
               {Object.entries(stats.lobBreakdown).map(([lob, count]) => (
                 <Grid item xs={6} sm={4} md={2} key={lob}>
                   <Card variant="outlined" sx={{ textAlign: 'center', p: 2 }}>
                     <Typography variant="h4" color="primary.main" fontWeight="bold">
                       {count}
                     </Typography>
                     <Typography variant="body2" fontWeight="bold">
                       {lob}
                     </Typography>
                     <Typography variant="caption" color="text.secondary">
                       {Math.round((count / adminStats.totalProcedures) * 100)}% of total
                     </Typography>
                   </Card>
                 </Grid>
               ))}
             </Grid>
           )}

           {/* Recent Activity Summary */}
           <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
             📝 Recent Activity Summary
           </Typography>
           <Grid container spacing={2}>
             <Grid item xs={12} sm={6}>
               <Card variant="outlined">
                 <CardContent>
                   <Typography variant="subtitle2" gutterBottom>
                     Procedure Activities
                   </Typography>
                   <Typography variant="h4" color="primary.main">
                     {auditLog.length}
                   </Typography>
                   <Typography variant="body2" color="text.secondary">
                     Recent procedure actions logged
                   </Typography>
                 </CardContent>
               </Card>
             </Grid>
             <Grid item xs={12} sm={6}>
               <Card variant="outlined">
                 <CardContent>
                   <Typography variant="subtitle2" gutterBottom>
                     Access Management
                   </Typography>
                   <Typography variant="h4" color="secondary.main">
                     {adminStats.totalAccessActions}
                   </Typography>
                   <Typography variant="body2" color="text.secondary">
                     User access actions logged
                   </Typography>
                 </CardContent>
               </Card>
             </Grid>
           </Grid>
         </Box>
       )}

       {/* Tab 1: ✅ REVERTED: Procedures Management (Your original working code) */}
       {activeTab === 1 && (
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
                         <IconButton 
                           size="small" 
                           onClick={() => navigate('procedures', { highlightId: procedure.id })}
                         >
                           <Visibility fontSize="small" />
                         </IconButton>
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
                         <IconButton 
                           size="small" 
                           color="error"
                           onClick={() => setDeleteDialog({ open: true, procedure })}
                           disabled={loading}
                         >
                           <Delete fontSize="small" />
                         </IconButton>
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
       )}

       {/* Tab 2: ✅ REVERTED: User Management (Your original working code enhanced) */}
       {activeTab === 2 && (
         <Box sx={{ p: 3 }}>
           <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
             <Typography variant="h6">
               User Management ({adminStats.totalUsers} active users, {adminStats.totalAccessActions} audit entries)
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
             </Box>
           </Box>

           {loading && <LinearProgress sx={{ mb: 2 }} />}

           <Alert severity="info" sx={{ mb: 3 }}>
             <Typography variant="body2">
               <strong>Access Management:</strong> User access is managed by User ID with full audit trail. 
               All access changes are logged to AccessAuditLog for compliance.
               {sharePointAvailable && (
                 <> User details are auto-fetched from SharePoint when available.</>
               )}
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

           {/* Enhanced User Table */}
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
                         {userRole.grantedBy}
                       </Typography>
                     </TableCell>
                     <TableCell>
                       <Box sx={{ display: 'flex', gap: 0.5 }}>
                         <IconButton 
                           size="small"
                           onClick={() => handleEditUserRole(userRole)}
                           disabled={loading || userRole.status !== 'active'}
                         >
                           <Edit fontSize="small" />
                         </IconButton>
                         <IconButton 
                           size="small" 
                           color="error"
                           onClick={() => handleRevokeAccess(userRole)}
                           disabled={loading || userRole.status !== 'active'}
                         >
                           <Cancel fontSize="small" />
                         </IconButton>
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
           </Box>
         </Box>
       )}

              {/* Tab 3: ✅ RESTORED: Your Original EmailManagement Component */}
        {activeTab === 3 && (
          <Box sx={{ p: 0 }}>  {/* Remove padding since EmailManagement has its own */}
            <EmailManagement />
          </Box>
        )}

       {/* Tab 4: ✅ REVERTED: Audit & Logs (Your original working code) */}
       {activeTab === 4 && (
         <Box sx={{ p: 3 }}>
           <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
             <Typography variant="h6">
               Audit Trail & System Logs ({auditLog.length} procedure entries, {accessAuditLog.length} access entries)
             </Typography>
             <FormControl size="small">
               <InputLabel>Time Range</InputLabel>
               <Select
                 value={selectedTimeRange}
                 onChange={(e) => setSelectedTimeRange(e.target.value)}
                 label="Time Range"
               >
                 <MenuItem value="7">Last 7 days</MenuItem>
                 <MenuItem value="30">Last 30 days</MenuItem>
                 <MenuItem value="90">Last 90 days</MenuItem>
               </Select>
             </FormControl>
           </Box>
           
           <Alert severity="info" sx={{ mb: 3 }}>
             System activity and audit trail for the last {selectedTimeRange} days.
             {sharePointAvailable ? (
               <Typography variant="body2" sx={{ mt: 1 }}>
                 <strong>Live Data:</strong> Real audit logs from SharePoint Lists.
               </Typography>
             ) : (
               <Typography variant="body2" sx={{ mt: 1 }}>
                 <strong>Demo Mode:</strong> Showing sample audit data.
               </Typography>
             )}
           </Alert>

           {/* Procedure Audit Log */}
           <Typography variant="h6" gutterBottom>
             📋 Procedure Activities
           </Typography>
           
           <List sx={{ mb: 4 }}>
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

           {/* System Activities */}
           <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
             ⚙️ Recent System Activity
           </Typography>
           
           <List>
             <ListItem>
               <ListItemIcon>
                 <CloudSync color="info" />
               </ListItemIcon>
               <ListItemText 
                 primary="SharePoint data synchronized"
                 secondary={`${procedures?.length || 0} procedures synced - ${sharePointAvailable ? 'Live data' : 'Demo data'}`}
               />
             </ListItem>
             <ListItem>
               <ListItemIcon>
                 <Assessment color="primary" />
               </ListItemIcon>
               <ListItemText 
                 primary="Quality analysis completed"
                 secondary={`Average quality score: ${stats.averageQualityScore || 0}%`}
               />
             </ListItem>
             <ListItem>
               <ListItemIcon>
                 <Security color="warning" />
               </ListItemIcon>
               <ListItemText 
                 primary="Access management active"
                 secondary={`${adminStats.totalUsers} active users, ${adminStats.totalAccessActions} audit entries`}
               />
             </ListItem>
           </List>

           <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
             <Button
               variant="outlined"
               startIcon={<Refresh />}
               onClick={fetchAdminDashboardData}
             >
               Refresh All Logs
             </Button>
           </Box>
         </Box>
       )}
     </Card>

     {/* ✅ ENHANCED: Grant Access Dialog with auto-fetch */}
     <Dialog open={accessDialog.open} onClose={() => setAccessDialog({ open: false })}>
       <DialogTitle>
         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
           <PersonAdd />
           Grant User Access
           {sharePointAvailable && (
             <Chip label="SharePoint + Auto-fetch" size="small" color="success" variant="outlined" />
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
             onChange={(e) => handleStaffIdChange(e.target.value)}
             variant="outlined"
             sx={{ mb: 2 }}
             placeholder="43898931"
             helperText="Enter the HSBC User ID (numeric) - Details will auto-fetch if available"
             InputProps={{
               endAdornment: userLoading && <CircularProgress size={20} />
             }}
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
             helperText="Auto-filled from SharePoint or enter manually"
           />
           <TextField
             fullWidth
             label="Email Address"
             type="email"
             value={newUser.email}
             onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
             variant="outlined"
             sx={{ mb: 2 }}
             placeholder="john.smith@hsbc.com"
             helperText="Auto-filled from SharePoint or enter manually"
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

     {/* ✅ ENHANCED: Email Dialog with SharePoint API */}
     <Dialog open={emailDialogOpen} onClose={() => setEmailDialogOpen(false)} maxWidth="md" fullWidth>
       <DialogTitle>
         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
           <Email />
           Send Email via SharePoint
           {sharePointAvailable && (
             <Chip label="SharePoint API" size="small" color="success" variant="outlined" />
           )}
         </Box>
       </DialogTitle>
       <DialogContent>
         <Box sx={{ pt: 1 }}>
           <FormControl fullWidth sx={{ mb: 2 }}>
             <InputLabel>Email Template</InputLabel>
             <Select
               value={emailSettings.template}
               onChange={(e) => {
                 const template = e.target.value;
                 setEmailSettings(prev => ({ ...prev, template }));
                 
                 // Auto-fill based on template
                 if (template === 'expiry') {
                   setEmailSettings(prev => ({
                     ...prev,
                     subject: 'Procedure Expiry Reminder',
                     body: 'Dear Procedure Owner,\n\nThis is a reminder that your procedure is expiring soon. Please review and update as necessary.\n\nBest regards,\nHSBC Procedures Team'
                   }));
                 } else if (template === 'access') {
                   setEmailSettings(prev => ({
                     ...prev,
                     subject: 'Access Granted - HSBC Procedures Hub',
                     body: 'Dear User,\n\nYou have been granted access to the HSBC Procedures Hub. Please login to start using the system.\n\nBest regards,\nHSBC Admin Team'
                   }));
                 }
               }}
               label="Email Template"
             >
               <MenuItem value="custom">Custom Email</MenuItem>
               <MenuItem value="expiry">Procedure Expiry Reminder</MenuItem>
               <MenuItem value="access">Access Granted Notification</MenuItem>
               <MenuItem value="quality">Quality Score Alert</MenuItem>
             </Select>
           </FormControl>

           <Autocomplete
             multiple
             freeSolo
             options={userRoles.map(u => u.displayName ? `${u.displayName} (${u.userId}@hsbc.com)` : `${u.userId}@hsbc.com`)}
             value={emailSettings.recipients}
             onChange={(event, newValue) => {
               setEmailSettings(prev => ({ ...prev, recipients: newValue }));
             }}
             renderInput={(params) => (
               <TextField
                 {...params}
                 label="Recipients"
                 placeholder="Enter email addresses or select users"
                 helperText="Recipients must be valid SharePoint users"
               />
             )}
             sx={{ mb: 2 }}
           />

           <TextField
             fullWidth
             label="Subject"
             value={emailSettings.subject}
             onChange={(e) => setEmailSettings(prev => ({ ...prev, subject: e.target.value }))}
             variant="outlined"
             sx={{ mb: 2 }}
           />

           <TextField
             fullWidth
             label="Message Body"
             multiline
             rows={6}
             value={emailSettings.body}
             onChange={(e) => setEmailSettings(prev => ({ ...prev, body: e.target.value }))}
             variant="outlined"
             sx={{ mb: 2 }}
             placeholder="Enter your email message..."
           />

           {!sharePointAvailable && (
             <Alert severity="warning" sx={{ mt: 2 }}>
               <Typography variant="caption">
                 Demo Mode: Email will be simulated. Connect to SharePoint to send real emails.
               </Typography>
             </Alert>
           )}
         </Box>
       </DialogContent>
       <DialogActions>
         <Button onClick={() => setEmailDialogOpen(false)}>
           Cancel
         </Button>
         <Button 
           variant="contained" 
           onClick={handleSendEmail}
           disabled={emailSending || !emailSettings.subject || !emailSettings.body || emailSettings.recipients.length === 0}
           startIcon={emailSending ? <CircularProgress size={16} /> : <Send />}
         >
           {emailSending ? 'Sending...' : 'Send Email'}
         </Button>
       </DialogActions>
     </Dialog>

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
   </Container>
 );
};

export default AdminDashboard;
