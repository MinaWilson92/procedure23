// components/EmailManagement.js - Complete Fixed Main Component
import React, { useState } from 'react';
import {
  Box, Typography, Tabs, Tab, Paper, Alert
} from '@mui/material';
import {
  People, Email, Notifications
} from '@mui/icons-material';
import ConfigureRecipients from './email/ConfigureRecipients';
import NotificationSettings from './email/NotificationSettings';
import CustomTemplates from './email/CustomTemplates';

const EmailManagement = () => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const tabConfig = [
    {
      label: 'Configure Recipients',
      icon: <People />,
      component: <ConfigureRecipients />,
      description: 'Manage email recipients and distribution lists from SharePoint'
    },
    {
      label: 'Notification Settings',
      icon: <Notifications />,
      component: <NotificationSettings />,
      description: 'Configure system email templates stored in SharePoint'
    },
    {
      label: 'Custom Templates',
      icon: <Email />,
      component: <CustomTemplates />,
      description: 'Create and manage custom email templates in SharePoint'
    }
  ];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          📧 Email Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Configure email notifications, recipients, and templates for the HSBC Procedures Hub using SharePoint integration
        </Typography>
      </Box>

      {/* SharePoint Integration Notice */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>SharePoint Integration:</strong> All email configuration is stored in your SharePoint lists (EmailConfiguration, EmailTemplates). 
          Changes are saved directly to SharePoint and emails are sent via SharePoint's email service.
        </Typography>
      </Alert>

      {/* Navigation Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          {tabConfig.map((tab, index) => (
            <Tab
              key={index}
              icon={tab.icon}
              label={tab.label}
              sx={{ 
                minHeight: 80,
                '& .MuiTab-iconWrapper': {
                  marginBottom: 1
                }
              }}
            />
          ))}
        </Tabs>
      </Paper>

      {/* Tab Description */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
          {tabConfig[activeTab].description}
        </Typography>
      </Box>

      {/* Tab Content */}
      <Box>
        {tabConfig[activeTab].component}
      </Box>
    </Box>
  );
};

export default EmailManagement;
