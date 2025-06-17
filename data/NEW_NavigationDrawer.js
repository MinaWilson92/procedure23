// components/NavigationDrawer.js - COMPLETELY REDESIGNED!
import React, { useState } from 'react';
import {
  Drawer, Box, Typography, Divider, List, ListItem,
  ListItemIcon, ListItemText, alpha, Avatar, Chip,
  Paper, Stack, IconButton, useTheme, styled, keyframes
} from '@mui/material';
import {
  Home, Dashboard, Description, AdminPanelSettings, CloudUpload,
  Person, Notifications, Settings, TrendingUp, Star,
  ChevronRight, Close
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigation } from '../contexts/NavigationContext';

// 🎨 **HSBC Brand Colors**
const HSBCColors = {
  primary: '#DB0011',
  secondary: '#9FA1A4',
  gradients: {
    redPrimary: 'linear-gradient(135deg, #DB0011 0%, #B50010 50%, #8B000C 100%)',
    darkMatter: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #404040 100%)',
    glassMorphism: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
    hoverGlow: 'linear-gradient(135deg, rgba(219,0,17,0.1) 0%, rgba(219,0,17,0.05) 100%)'
  }
};

// 🌟 **Advanced Animations**
const slideIn = keyframes`
  0% { transform: translateX(-100%); opacity: 0; }
  100% { transform: translateX(0); opacity: 1; }
`;

const pulseGlow = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 rgba(219, 0, 17, 0.4); }
  70% { box-shadow: 0 0 0 15px rgba(219, 0, 17, 0); }
`;

const floatIcon = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-3px); }
`;

// 🎨 **Styled Components**
const GlassmorphismDrawer = styled(Drawer)(({ theme }) => ({
  '& .MuiDrawer-paper': {
    width: 320,
    background: 'linear-gradient(135deg, rgba(26,26,26,0.95) 0%, rgba(45,45,45,0.9) 100%)',
    backdropFilter: 'blur(20px)',
    border: 'none',
    borderRight: '1px solid rgba(255,255,255,0.1)',
    boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
    overflow: 'hidden',
    marginTop: 64 // Account for app bar
  },
}));

const HSBCHexagon = styled(Box)(({ theme, size = 40 }) => ({
  width: size,
  height: size,
  background: HSBCColors.gradients.redPrimary,
  clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  '&::after': {
    content: '""',
    position: 'absolute',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(45deg, rgba(255,255,255,0.3) 0%, transparent 100%)',
    clipPath: 'inherit'
  }
}));

const ModernMenuItem = styled(ListItem)(({ theme, isActive, itemColor }) => ({
  margin: '4px 16px',
  borderRadius: '16px',
  padding: '12px 16px',
  position: 'relative',
  overflow: 'hidden',
  cursor: 'pointer',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  background: isActive 
    ? `linear-gradient(135deg, ${itemColor}15 0%, ${itemColor}08 100%)`
    : 'transparent',
  border: isActive 
    ? `1px solid ${alpha(itemColor, 0.3)}`
    : '1px solid transparent',
  
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: `linear-gradient(90deg, transparent, ${alpha(itemColor, 0.1)}, transparent)`,
    transition: 'left 0.5s ease'
  },
  
  '&:hover': {
    transform: 'translateX(8px)',
    background: `linear-gradient(135deg, ${itemColor}20 0%, ${itemColor}10 100%)`,
    border: `1px solid ${alpha(itemColor, 0.4)}`,
    boxShadow: `0 8px 32px ${alpha(itemColor, 0.3)}`,
    
    '&::before': {
      left: '100%'
    },
    
    '& .menu-icon': {
      animation: `${floatIcon} 2s ease-in-out infinite`,
      color: itemColor
    },
    
    '& .menu-text': {
      color: itemColor,
      fontWeight: 700
    },
    
    '& .chevron-icon': {
      opacity: 1,
      transform: 'translateX(0px)'
    }
  }
}));

const NavigationDrawer = ({ open, onClose, user, isAdmin }) => {
  const { currentPage, navigate } = useNavigation();
  const theme = useTheme();
  const [hoveredItem, setHoveredItem] = useState(null);

  const menuItems = [
    { 
      id: 'home', 
      label: 'Home Dashboard', 
      icon: <Home />, 
      color: '#2196f3',
      description: 'Overview & Analytics',
      badge: null
    },
    { 
      id: 'user-dashboard', 
      label: 'My Dashboard', 
      icon: <Dashboard />, 
      color: '#4caf50',
      description: 'Personal Procedures',
      badge: '12'
    },
    { 
      id: 'procedures', 
      label: 'All Procedures', 
      icon: <Description />, 
      color: '#ff9800',
      description: 'Browse & Search',
      badge: '247'
    },
  ];

  // Add admin items for admin users
  if (isAdmin) {
    menuItems.push(
      { 
        id: 'admin-panel', 
        label: 'Admin Panel', 
        icon: <AdminPanelSettings />, 
        color: '#f44336',
        description: 'System Management',
        badge: 'ADMIN'
      },
      { 
        id: 'submit-procedure', 
        label: 'Upload Procedure', 
        icon: <CloudUpload />, 
        color: '#7b1fa2',
        description: 'Add New Document',
        badge: '+'
      }
    );
  }

  const handleNavigation = (pageId) => {
    navigate(pageId);
    onClose();
  };

  return (
    <GlassmorphismDrawer
      variant="temporary"
      open={open}
      onClose={onClose}
      ModalProps={{
        keepMounted: true,
      }}
    >
      {/* 🌟 **SPECTACULAR HEADER** */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Box sx={{ 
          p: 3,
          background: HSBCColors.gradients.redPrimary,
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Animated Background Pattern */}
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'url("data:image/svg+xml,%3Csvg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="rgba(255,255,255,0.1)" fill-opacity="1" fill-rule="evenodd"%3E%3Cpath d="m0 40l40-40h-40z"/%3E%3C/g%3E%3C/svg%3E")',
            opacity: 0.2
          }} />
          
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ position: 'relative', zIndex: 1 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <HSBCHexagon size={50}>
                <Person sx={{ color: 'white', fontSize: 24 }} />
              </HSBCHexagon>
              
              <Box>
                <Typography variant="h6" fontWeight={900} color="white">
                  Navigation
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  HSBC Procedures Hub
                </Typography>
              </Box>
            </Stack>
            
            <IconButton 
              onClick={onClose} 
              sx={{ 
                color: 'white',
                '&:hover': {
                  background: 'rgba(255,255,255,0.1)',
                  transform: 'rotate(90deg)'
                }
              }}
            >
              <Close />
            </IconButton>
          </Stack>
        </Box>
      </motion.div>

      {/* 👤 **USER PROFILE SECTION** */}
      {user && (
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Box sx={{ p: 3 }}>
            <Paper sx={{ 
              p: 3, 
              borderRadius: '20px',
              background: HSBCColors.gradients.glassMorphism,
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)'
            }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ 
                  width: 56, 
                  height: 56,
                  background: HSBCColors.gradients.redPrimary,
                  fontSize: '1.5rem',
                  fontWeight: 900,
                  boxShadow: '0 8px 24px rgba(219,0,17,0.3)'
                }}>
                  {user.displayName?.[0] || user.staffId?.[0] || 'U'}
                </Avatar>
                
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="h6" fontWeight={800} color="white" noWrap>
                    {user.displayName || user.staffId}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }} noWrap>
                    {user.email || 'user@hsbc.com'}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    <Chip 
                      label={user.role || 'User'}
                      size="small"
                      sx={{ 
                        backgroundColor: user.role === 'admin' ? '#f44336' : 'rgba(255,255,255,0.2)',
                        color: 'white',
                        fontWeight: 700,
                        fontSize: '0.7rem'
                      }}
                    />
                    <Chip 
                      icon={<Star />}
                      label="Active"
                      size="small"
                      sx={{ 
                        backgroundColor: 'rgba(76,175,80,0.3)',
                        color: 'white',
                        fontWeight: 700,
                        fontSize: '0.7rem'
                      }}
                    />
                  </Stack>
                </Box>
              </Stack>
            </Paper>
          </Box>
        </motion.div>
      )}

      {/* 🚀 **NEXT-GEN MENU ITEMS** */}
      <Box sx={{ flex: 1, py: 2 }}>
        <List sx={{ px: 0 }}>
          <AnimatePresence>
            {menuItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <ModernMenuItem 
                  isActive={currentPage === item.id}
                  itemColor={item.color}
                  onClick={() => handleNavigation(item.id)}
                  onMouseEnter={() => setHoveredItem(item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <ListItemIcon sx={{ minWidth: 48 }}>
                    <Box className="menu-icon" sx={{ 
                      color: currentPage === item.id ? item.color : 'rgba(255,255,255,0.7)',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {React.cloneElement(item.icon, { fontSize: 'medium' })}
                    </Box>
                  </ListItemIcon>
                  
                  <ListItemText 
                    sx={{ flex: 1 }}
                    primary={
                      <Typography 
                        className="menu-text"
                        variant="body1" 
                        fontWeight={currentPage === item.id ? 800 : 600}
                        sx={{ 
                          color: currentPage === item.id ? item.color : 'rgba(255,255,255,0.9)',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        {item.label}
                      </Typography>
                    }
                    secondary={
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: 'rgba(255,255,255,0.6)',
                          fontSize: '0.75rem'
                        }}
                      >
                        {item.description}
                      </Typography>
                    }
                  />
                  
                  <Stack direction="row" alignItems="center" spacing={1}>
                    {item.badge && (
                      <Chip 
                        label={item.badge}
                        size="small"
                        sx={{ 
                          backgroundColor: alpha(item.color, 0.2),
                          color: item.color,
                          fontWeight: 700,
                          fontSize: '0.7rem',
                          height: 24
                        }}
                      />
                    )}
                    
                    <ChevronRight 
                      className="chevron-icon"
                      sx={{ 
                        color: alpha(item.color, 0.6),
                        fontSize: 20,
                        opacity: hoveredItem === item.id ? 1 : 0,
                        transform: hoveredItem === item.id ? 'translateX(0px)' : 'translateX(-10px)',
                        transition: 'all 0.3s ease'
                      }} 
                    />
                  </Stack>
                </ModernMenuItem>
              </motion.div>
            ))}
          </AnimatePresence>
        </List>
      </Box>

      {/* 📊 **QUICK STATS SECTION** */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        <Box sx={{ p: 3 }}>
          <Paper sx={{ 
            p: 3, 
            borderRadius: '20px',
            background: 'linear-gradient(135deg, rgba(33,150,243,0.1) 0%, rgba(33,150,243,0.05) 100%)',
            border: '1px solid rgba(33,150,243,0.2)',
            backdropFilter: 'blur(10px)'
          }}>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
              <TrendingUp sx={{ color: '#2196f3' }} />
              <Typography variant="h6" fontWeight={800} color="white">
                Quick Stats
              </Typography>
            </Stack>
            
            <Stack spacing={1}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  Total Procedures
                </Typography>
                <Typography variant="body2" fontWeight={700} color="white">
                  247
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  Expiring Soon
                </Typography>
                <Typography variant="body2" fontWeight={700} color="#ff9800">
                  23
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  Quality Score
                </Typography>
                <Typography variant="body2" fontWeight={700} color="#4caf50">
                  84%
                </Typography>
              </Stack>
            </Stack>
          </Paper>
        </Box>
      </motion.div>

      {/* 🔗 **FOOTER** */}
      <Box sx={{ p: 3, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
            HSBC Procedures Hub v4.2.0
          </Typography>
          <Stack direction="row" spacing={1}>
            <IconButton size="small" sx={{ color: 'rgba(255,255,255,0.6)' }}>
              <Settings fontSize="small" />
            </IconButton>
            <IconButton size="small" sx={{ color: 'rgba(255,255,255,0.6)' }}>
              <Notifications fontSize="small" />
            </IconButton>
          </Stack>
        </Stack>
      </Box>
    </GlassmorphismDrawer>
  );
};

export default NavigationDrawer;
