// components/EmailManagement.js - Updated with God Mode Check
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Tabs, Tab, Paper, Alert
} from '@mui/material';
import {
  Settings, People, Email, Notifications, Schedule,
  Timeline, MailOutline, Security
} from '@mui/icons-material';
import { useSharePoint } from '../SharePointContext';
import ReadOnlyEmailManagement from './email/ReadOnlyEmailManagement';
import GodModeEmailManagement from './email/GodModeEmailManagement';
import CustomTemplates from './email/CustomTemplates';

const EmailManagement = ({ emailService }) => {
  const { user } = useSharePoint();
  const [activeTab, setActiveTab] = useState(0);

  // Check if user is the god mode user
  const isGodUser = user?.staffId === '43898931' || user?.Title === '43898931';

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  function TabPanel(props) {
    const { children, value, index, ...other } = props;
    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`simple-tabpanel-${index}`}
        aria-labelledby={`simple-tab-${index}`}
        {...other}
      >
        {value === index && (
          <Box sx={{ p: 3 }}>
            {children}
          </Box>
        )}
      </div>
    );
  }

  function a11yProps(index) {
    return {
      id: `simple-tab-${index}`,
      'aria-controls': `simple-tabpanel-${index}`,
    };
  }

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab 
            label={isGodUser ? "Email Configuration (God Mode)" : "Email Configuration (View Only)"} 
            icon={isGodUser ? <Security /> : <Email />} 
            {...a11yProps(0)} 
          />
          <Tab label="Custom Templates" icon={<MailOutline />} {...a11yProps(1)} />
          <Tab label="System Status" icon={<Timeline />} {...a11yProps(2)} />
        </Tabs>
      </Paper>

      <TabPanel value={activeTab} index={0}>
        {isGodUser ? (
          <GodModeEmailManagement user={user} emailService={emailService} />
        ) : (
          <ReadOnlyEmailManagement user={user} />
        )}
      </TabPanel>
      
      <TabPanel value={activeTab} index={1}>
        <CustomTemplates />
      </TabPanel>
      
      <TabPanel value={activeTab} index={2}>
        <Alert severity="info">
          <Typography variant="body2">
            System status and monitoring features will be implemented here.
          </Typography>
        </Alert>
      </TabPanel>
    </Box>
  );
};

export default EmailManagement;
