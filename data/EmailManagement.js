// components/EmailManagement.js - Fixed Main Email Management Component
import React, { useState } from ‘react’;
import {
Box, Typography, Tabs, Tab, Paper
} from ‘@mui/material’;
import {
Settings, People, Email, Notifications
} from ‘@mui/icons-material’;
import ConfigureRecipients from ‘./email/ConfigureRecipients’;
import NotificationSettings from ‘./email/NotificationSettings’;
import CustomTemplates from ‘./email/CustomTemplates’;

const EmailManagement = () => {
const [activeTab, setActiveTab] = useState(0);

const handleTabChange = (event, newValue) => {
setActiveTab(newValue);
};

const tabConfig = [
{
label: ‘Configure Recipients’,
icon: <People />,
component: <ConfigureRecipients />,
description: ‘Manage email recipients and lists’
},
{
label: ‘Notification Settings’,
icon: <Notifications />,
component: <NotificationSettings />,
description: ‘Configure email templates and notifications’
},
{
label: ‘Custom Templates’,
icon: <Email />,
component: <CustomTemplates />,
description: ‘Create and manage custom email templates’
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
Configure email notifications, recipients, and templates for the HSBC Procedures Hub
</Typography>
</Box>

```
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

  {/* Tab Content */}
  <Box>
    {tabConfig[activeTab].component}
  </Box>
</Box>
```

);
};

export default EmailManagement;