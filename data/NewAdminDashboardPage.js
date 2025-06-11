// pages/AdminDashboard.js - Final Corrected Version
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
  const { user, getUserInfo, siteUrl, authStatus, refreshUser } = useSharePoint();
  const { navigateTo } = useNavigation();
  const theme = useTheme();

  // State for Admin Dashboard
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allProcedures, setAllProcedures] = useState([]);
  const [recentUploads, setRecentUploads] = useState([]);
  const [expiringSoon, setExpiringSoon] = useState([]);
  const [overdue, setOverdue] = useState([]);
  const [notificationLog, setNotificationLog] = useState([]);
  const [users, setUsers] = useState([]);
  const [procedureStats, setProcedureStats] = useState({
    total: 0, active: 0, pendingReview: 0, expired: 0
  });
  const [newProcedure, setNewProcedure] = useState({
    Title: '', Description: '', Category: '', Tags: '',
    Reviewer: '', Approver: '', ExpiryDate: null, Status: 'Draft'
  });
  const [editProcedure, setEditProcedure] = useState(null);
  const [notification, setNotification] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, procedure: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userRoles, setUserRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [isEmailMonitoringRunning, setIsEmailMonitoringRunning] = useState(false);

  const [emailService] = useState(() => new EmailNotificationService());

  // --- FINAL FIX ---
  // Configure the PnPjs library with the correct site URL once, when the component loads.
  useEffect(() => {
    if (window.pnp && siteUrl) {
      console.log(`Configuring PnPjs baseUrl to: ${siteUrl}`);
      window.pnp.setup({
        sp: {
          baseUrl: siteUrl
        }
      });
      // After setup, load the data.
      loadDashboardData();
      loadNotificationLog();
    }
  }, [siteUrl, sharePointAvailable]); // Dependency array ensures this runs when siteUrl is available.


  // Load Initial Data for Dashboard
  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      // With the setup complete, we can now use the simple 'pnp.sp.web' syntax.
      // It will automatically use the correct site URL.
      const sp = window.pnp.sp.web.lists.getByTitle('Procedures');
const items = await sp.items.select('*').get();
      console.log("Sample of first procedure item:", items[0]);

      setAllProcedures(items);
      processProcedures(items);

      const dummyUsers = [
        { id: 1, name: 'Alice Smith', email: 'alice.smith@hsbc.com', role: 'Staff' },
        { id: 2, name: 'Bob Johnson', email: 'bob.johnson@hsbc.com', role: 'Admin' },
        { id: 3, name: 'Charlie Brown', email: 'charlie.brown@hsbc.com', role: 'Reviewer' },
      ];
      setUsers(dummyUsers);
      setUserRoles(['Staff', 'Admin', 'Reviewer', 'Management']);

    } catch (err) {
      console.error("Error loading dashboard data:", err);
      setError("Failed to load dashboard data. Please refresh.");
      setNotification({ type: 'error', message: 'Failed to load dashboard data.' });
    } finally {
      setLoading(false);
    }
  };

  const loadNotificationLog = async () => {
    try {
      if (emailService && typeof emailService.getNotificationLog === 'function') {
        const log = await emailService.getNotificationLog();
        setNotificationLog(log);
      }
    } catch (error) {
      console.error("Error loading notification log:", error);
      setNotification({ type: 'error', message: 'Failed to load notification log.' });
    }
  };

  const processProcedures = (proceduresData) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const recent = [];
    const expiring = [];
    const overdueList = [];
    let activeCount = 0;
    let pendingCount = 0;
    let expiredCount = 0;

    proceduresData.forEach(p => {
      const created = new Date(p.Created);
      const expiry = p.ExpiryDate ? new Date(p.ExpiryDate) : null;
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 7);
      if (created >= sevenDaysAgo) {
        recent.push(p);
      }
      if (expiry && expiry > today) {
        const diffTime = Math.abs(expiry.getTime() - today.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays <= 30) {
          expiring.push(p);
        }
      }
      if (expiry && expiry <= today) {
        overdueList.push(p);
        expiredCount++;
      }
      if (p.Status === 'Active') {
        activeCount++;
      } else if (p.Status === 'Draft' || p.Status === 'Pending Review') {
        pendingCount++;
      }
    });

    setRecentUploads(recent.sort((a, b) => new Date(b.Created) - new Date(a.Created)).slice(0, 5));
    setExpiringSoon(expiring.sort((a, b) => new Date(a.ExpiryDate) - new Date(b.ExpiryDate)).slice(0, 5));
    setOverdue(overdueList.sort((a, b) => new Date(b.ExpiryDate) - new Date(a.ExpiryDate)).slice(0, 5));

    setProcedureStats({
      total: proceduresData.length,
      active: activeCount,
      pendingReview: pendingCount,
      expired: expiredCount
    });
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleAddProcedure = async () => {
    setLoading(true);
    try {
      const sp = window.pnp.sp.web.lists.getByTitle('Procedures');
      await sp.items.add({
        Title: newProcedure.Title,
        Description: newProcedure.Description,
        Category: newProcedure.Category,
        Tags: newProcedure.Tags,
        ReviewerId: newProcedure.Reviewer ? users.find(u => u.name === newProcedure.Reviewer)?.id : null,
        ApproverId: newProcedure.Approver ? users.find(u => u.name === newProcedure.Approver)?.id : null,
        ExpiryDate: newProcedure.ExpiryDate ? new Date(newProcedure.ExpiryDate).toISOString() : null,
        Status: newProcedure.Status
      });
      setNotification({ type: 'success', message: `Procedure "${newProcedure.Title}" added successfully!` });
      setNewProcedure({ Title: '', Description: '', Category: '', Tags: '', Reviewer: '', Approver: '', ExpiryDate: null, Status: 'Draft' });
      onDataRefresh();
    } catch (error) {
      console.error('Error adding procedure:', error);
      setNotification({ type: 'error', message: 'Failed to add procedure.' });
    } finally {
      setLoading(false);
    }
  };

  const handleEditProcedure = async (procedure) => {
    setLoading(true);
    try {
      const sp = window.pnp.sp.web.lists.getByTitle('Procedures');
      await sp.items.getById(procedure.ID).update({
        Title: procedure.Title,
        Description: procedure.Description,
        Category: procedure.Category,
        Tags: procedure.Tags,
        ReviewerId: procedure.Reviewer ? users.find(u => u.name === procedure.Reviewer.Title)?.id : null,
        ApproverId: procedure.Approver ? users.find(u => u.name === procedure.Approver.Title)?.id : null,
        ExpiryDate: procedure.ExpiryDate ? new Date(procedure.ExpiryDate).toISOString() : null,
        Status: procedure.Status
      });
      setNotification({ type: 'success', message: `Procedure "${procedure.Title}" updated successfully!` });
      setEditProcedure(null);
      onDataRefresh();
    } catch (error)
    {
      console.error('Error updating procedure:', error);
      setNotification({ type: 'error', message: 'Failed to update procedure.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProcedure = async (procedure) => {
    setLoading(true);
    setDeleteDialog({ open: false, procedure: null });
    try {
      const sp = window.pnp.sp.web.lists.getByTitle('Procedures');
      await sp.items.getById(procedure.ID).delete();
      setNotification({ type: 'success', message: `Procedure "${procedure.name}" deleted successfully!` });
      onDataRefresh();
    } catch (error) {
      console.error('Error deleting procedure:', error);
      setNotification({ type: 'error', message: 'Failed to delete procedure.' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUserRole = async () => {
    if (!selectedUser || !selectedRole) {
      setNotification({ type: 'error', message: 'Please select a user and a role.' });
      return;
    }
    setLoading(true);
    try {
      console.log(`Updating role for ${selectedUser.name} to ${selectedRole}`);
      setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, role: selectedRole } : u));
      if (emailService && typeof emailService.triggerUserRoleChangeNotification === 'function') {
        await emailService.triggerUserRoleChangeNotification(selectedUser.name, selectedUser.email, selectedRole, getUserInfo().displayName);
      }
      setNotification({ type: 'success', message: `Role updated for ${selectedUser.name} to ${selectedRole}.` });
    } catch (error) {
      console.error('Error updating user role:', error);
      setNotification({ type: 'error', message: 'Failed to update user role.' });
    } finally {
      setLoading(false);
      setSelectedUser(null);
      setSelectedRole('');
    }
  };

  // ... (The rest of the file remains the same, only the data functions and the new useEffect are changed)
  
  // (JSX code from here down is unchanged)
  // ...
  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      {/* JSX Code here */}
    </Container>
  );
};

export default AdminDashboard;
