// components/NavigationDrawer.js - Professional Side Navigation
import React from 'react';
import {
  Drawer, Box, Typography, Divider, List, ListItem,
  ListItemIcon, ListItemText, alpha
} from '@mui/material';
import {
  Home, Dashboard, Description, AdminPanelSettings, CloudUpload
} from '@mui/icons-material';
import { useNavigation } from '../contexts/NavigationContext';

const NavigationDrawer = ({ open, onClose, user, isAdmin }) => {
  const { navigate } = useNavigation();

  const menuItems = [
    { id: 'home', label: 'Home', icon: <Home />, color: '#2196f3' },
    { id: 'user-dashboard', label: 'My Dashboard', icon: <Dashboard />, color: '#4caf50' },
    { id: 'procedures', label: 'All Procedures', icon: <Description />, color: '#ff9800' },
  ];

  // Only show admin items for admin users
  if (isAdmin) {
    menuItems.push(
      { id: 'admin-panel', label: 'Admin Panel', icon: <AdminPanelSettings />, color: '#f44336' },
      { id: 'submit-procedure', label: 'Upload Procedure', icon: <CloudUpload />, color: '#607d8b' }
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
            <ListItemText primary={item.label} />
          </ListItem>
        ))}
      </List>

      <Divider />
      
      <Box sx={{ p: 2, mt: 'auto' }}>
        <Typography variant="caption" color="text.secondary">
          HSBC Procedures Hub v4.1.0 (SharePoint Compatible)
        </Typography>
      </Box>
    </Drawer>
  );
};

export default NavigationDrawer;