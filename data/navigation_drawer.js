// components/NavigationDrawer.js - Role-based Navigation
import React from 'react';
import {
  Drawer, Box, Typography, Divider, List, ListItem,
  ListItemIcon, ListItemText, alpha, Chip
} from '@mui/material';
import {
  Home, Description, AdminPanelSettings, CloudUpload, Dashboard,
  Security, People, Assignment
} from '@mui/icons-material';
import { useNavigation } from '../contexts/NavigationContext';

const NavigationDrawer = ({ open, onClose, user, isAdmin, isUploader }) => {
  const { navigate } = useNavigation();

  const menuItems = [
    { id: 'home', label: 'Home', icon: <Home />, color: '#2196f3', showFor: 'all' },
    { id: 'procedures', label: 'All Procedures', icon: <Description />, color: '#ff9800', showFor: 'all' },
  ];

  // Add admin-only items
  if (isAdmin) {
    menuItems.push(
      { id: 'admin-dashboard', label: 'Admin Dashboard', icon: <AdminPanelSettings />, color: '#f44336', showFor: 'admin' },
    );
  }

  // Add uploader items (admins + uploaders)
  if (isAdmin || isUploader) {
    menuItems.push(
      { id: 'admin-panel', label: 'Upload Procedure', icon: <CloudUpload />, color: '#607d8b', showFor: 'uploader' }
    );
  }

  const handleNavigation = (pageId) => {
    navigate(pageId);
    onClose();
  };

  return (
    <Drawer
      variant="temporary"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: 280,
          boxSizing: 'border-box',
          mt: 8
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Navigation
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          {isAdmin && (
            <Chip label="Admin" color="error" size="small" />
          )}
          {isUploader && !isAdmin && (
            <Chip label="Uploader" color="warning" size="small" />
          )}
        </Box>
        <Divider />
      </Box>

      <List>
        {menuItems.map((item) => (
          <ListItem 
            button 
            key={item.id}
            onClick={() => handleNavigation(item.id)}
            sx={{
              '&:hover': {
                bgcolor: alpha(item.color, 0.1),
                '& .MuiListItemIcon-root': {
                  color: item.color
                }
              }
            }}
          >
            <ListItemIcon sx={{ color: item.color }}>
              {item.icon}
</ListItemIcon>
           <ListItemText 
             primary={item.label}
             secondary={
               item.showFor === 'admin' ? 'Admin Only' : 
               item.showFor === 'uploader' ? 'Admin & Uploaders' : null
             }
           />
         </ListItem>
       ))}
     </List>

     <Divider />
     
     <Box sx={{ p: 2, mt: 'auto' }}>
       <Typography variant="caption" color="text.secondary">
         HBEG Procedures Hub v4.2.0
       </Typography>
       <br />
       <Typography variant="caption" color="text.secondary">
         Role-based Access Control
       </Typography>
     </Box>
   </Drawer>
 );
};

export default NavigationDrawer;
