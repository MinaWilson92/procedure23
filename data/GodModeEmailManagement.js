// components/email/GodModeEmailManagement.js - Full Access for User 43898931
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Alert, Card, CardContent, Button, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField
} from '@mui/material';
import {
  Security, AdminPanelSettings, Warning, Edit, Save
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import ConfigureRecipients from './ConfigureRecipients';
import NotificationSettings from './NotificationSettings';
import CustomTemplates from './CustomTemplates';
import TemplateManagement from './TemplateManagement';

const GodModeEmailManagement = ({ user, emailService }) => {
  const [showAccessDialog, setShowAccessDialog] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [isGodModeActive, setIsGodModeActive] = useState(false);

  // Check if user is the god mode user
  const isGodUser = user?.staffId === '43898931' || user?.Title === '43898931';

  useEffect(() => {
    if (isGodUser) {
      setIsGodModeActive(true);
    }
  }, [isGodUser]);

  const handleAccessRequest = () => {
    // Additional security check
    if (accessCode === 'HSBC-EMAIL-GOD-MODE-2025' && isGodUser) {
      setIsGodModeActive(true);
      setShowAccessDialog(false);
      setAccessCode('');
    } else {
      alert('Access Denied: Invalid credentials or unauthorized user');
      setAccessCode('');
    }
  };

  if (!isGodUser) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Security sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
        <Typography variant="h5" color="error.main" gutterBottom>
          Access Restricted
        </Typography>
        <Typography variant="body1" color="text.secondary">
          This page is only accessible to authorized system administrators.
        </Typography>
        <Alert severity="error" sx={{ mt: 3, maxWidth: 500, mx: 'auto' }}>
          <Typography variant="body2">
            <strong>Security Notice:</strong> Unauthorized access attempts are logged and monitored.
            User ID: {user?.staffId || 'Unknown'}
          </Typography>
        </Alert>
      </Box>
    );
  }

  if (!isGodModeActive) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <AdminPanelSettings sx={{ fontSize: 64, color: 'warning.main', mb: 2 }} />
        <Typography variant="h5" color="warning.main" gutterBottom>
          God Mode Email Management
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Welcome, {user?.displayName}. You have elevated privileges for email system management.
        </Typography>
        
        <Card sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
          <CardContent>
            <Alert severity="warning" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>Critical System Access:</strong> Changes made here will affect the entire email notification system.
                All actions are logged and audited.
              </Typography>
            </Alert>
            
            <Button
              variant="contained"
              color="error"
              size="large"
              startIcon={<Security />}
              onClick={() => setShowAccessDialog(true)}
              sx={{ minWidth: 200 }}
            >
              Enter God Mode
            </Button>
          </CardContent>
        </Card>

        <Dialog open={showAccessDialog} onClose={() => setShowAccessDialog(false)}>
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Security color="error" />
              Confirm God Mode Access
            </Box>
          </DialogTitle>
          <DialogContent>
            <Typography gutterBottom>
              Enter the system access code to proceed:
            </Typography>
            <TextField
              fullWidth
              type="password"
              label="Access Code"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              sx={{ mt: 2 }}
              onKeyPress={(e) => e.key === 'Enter' && handleAccessRequest()}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowAccessDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleAccessRequest}
              variant="contained"
              color="error"
              disabled={!accessCode}
            >
              Confirm Access
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  return (
    <Box>
      {/* God Mode Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3,
            background: 'linear-gradient(135deg, #d32f2f 0%, #f44336 100%)',
            color: 'white',
            '& .MuiAlert-icon': { color: 'white' }
          }}
        >
          <Typography variant="h6" fontWeight="bold">
            🔥 GOD MODE ACTIVE - FULL EMAIL SYSTEM CONTROL
          </Typography>
          <Typography variant="body2">
            User: {user?.displayName} ({user?.staffId}) | All changes are logged and audited
          </Typography>
        </Alert>
      </motion.div>

      {/* Full Email Management Access */}
      <ConfigureRecipients emailService={emailService} />

        // Add this to the return statement:
<Box>
  {/* Existing God Mode Header */}
  
  {/* Add Template Management */}
  <Card sx={{ mb: 4 }}>
    <CardContent>
      <Typography variant="h5" gutterBottom>
        📧 Email Template Management
      </Typography>
      <TemplateManagement emailService={emailService} />
    </CardContent>
  </Card>

  {/* Existing ConfigureRecipients */}
  <ConfigureRecipients emailService={emailService} />
</Box>
    
    </Box>
  );
};

export default GodModeEmailManagement;
