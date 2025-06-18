// components/NavigationDrawer.js - SLEEK & COMPACT VERSION
import React, { useState } from 'react';
import {
  Drawer, Box, Typography, Divider, List, ListItem,
  ListItemIcon, ListItemText, alpha, Avatar, Chip,
  Paper, Stack, IconButton, useTheme, styled, keyframes
} from '@mui/material';
import {
  Home, Dashboard, Description, AdminPanelSettings, CloudUpload,
  Person, Notifications, Settings, TrendingUp, Star,
  ChevronRight, Close, BarChart
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
const floatIcon = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-2px); }
`;

// 🎨 **Styled Components - COMPACT & SLEEK**
const GlassmorphismDrawer = styled(Drawer)(({ theme }) => ({
  '& .MuiDrawer-paper': {
    width: 320, // ✅ REDUCED back to 320px for more compact feel
    background: 'linear-gradient(135deg, rgba(26,26,26,0.95) 0%, rgba(45,45,45,0.9) 100%)',
    backdropFilter: 'blur(20px)',
    border: 'none',
    borderRight: '1px solid rgba(255,255,255,0.1)',
    boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
    overflow: 'hidden',
    marginTop: 64,
    display: 'flex',
    flexDirection: 'column',
    height: 'calc(100vh - 64px)',
  }
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
  flexShrink: 0,
  '&::after': {
    content: '""',
    position: 'absolute',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(45deg, rgba(255,255,255,0.3) 0%, transparent 100%)',
    clipPath: 'inherit'
  }
}));

const CompactMenuItem = styled(ListItem)(({ theme, isActive, itemColor }) => ({
  margin: '2px 12px', // ✅ MUCH SMALLER margins
  borderRadius: '12px', // ✅ SMALLER border radius
  padding: '8px 12px', // ✅ MUCH SMALLER padding
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
    transform: 'translateX(6px)', // ✅ SMALLER movement
    background: `linear-gradient(135deg, ${itemColor}20 0%, ${itemColor}10 100%)`,
    border: `1px solid ${alpha(itemColor, 0.4)}`,
    boxShadow: `0 6px 24px ${alpha(itemColor, 0.3)}`, // ✅ SMALLER shadow
    
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

const NavigationDrawer = ({ open, onClose, user, isAdmin, procedures, dashboardData }) => {
  const { currentPage, navigate } = useNavigation();
  const theme = useTheme();
  const [hoveredItem, setHoveredItem] = useState(null);

  // ✅ Get real stats from props
  const totalProcedures = procedures?.length || dashboardData?.stats?.total || 0;

  // ✅ Updated menu items - COMPACT VERSION
  const menuItems = [
    { 
      id: 'home', 
      label: 'Home Dashboard', 
      icon: <Home />, 
      color: '#2196f3',
      description: 'Overview & Analytics',
      badge: null,
      show: true
    },
    { 
      id: 'procedures', 
      label: 'All Procedures', 
      icon: <Description />, 
      color: '#ff9800',
      description: 'Browse & Search',
      badge: totalProcedures.toString(),
      show: true
    }
  ];

  // ✅ Add admin items with proper permissions
  if (isAdmin) {
    menuItems.push(
      { 
        id: 'admin-dashboard',
        label: 'Admin Dashboard', 
        icon: <BarChart />, 
        color: '#9c27b0',
        description: 'Analytics & Reports',
        badge: 'ADMIN',
        show: true
      },
      { 
        id: 'admin-panel',
        label: 'Upload Procedure', 
        icon: <CloudUpload />, 
        color: '#f44336',
        description: 'Add New Document',
        badge: '+',
        show: true
      }
    );
  }

  const visibleMenuItems = menuItems.filter(item => item.show);

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
      {/* 🌟 **COMPACT HEADER** */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Box sx={{ 
          p: 2.5, // ✅ SMALLER padding
          background: HSBCColors.gradients.redPrimary,
          position: 'relative',
          overflow: 'hidden',
          flexShrink: 0
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
            <Stack direction="row" alignItems="center" spacing={1.5}> {/* ✅ SMALLER spacing */}
              <HSBCHexagon size={40}> {/* ✅ SMALLER hexagon */}
                <Person sx={{ color: 'white', fontSize: 18 }} /> {/* ✅ SMALLER icon */}
              </HSBCHexagon>
              
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h6" fontWeight={800} color="white" sx={{ fontSize: '1.1rem' }}> {/* ✅ SMALLER text */}
                  Navigation
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 500, fontSize: '0.7rem' }}> {/* ✅ SMALLER text */}
                  HSBC Procedures Hub
                </Typography>
              </Box>
            </Stack>
            
            <IconButton 
              onClick={onClose} 
              size="small" // ✅ SMALLER button
              sx={{ 
                color: 'white',
                flexShrink: 0,
                '&:hover': {
                  background: 'rgba(255,255,255,0.1)',
                  transform: 'rotate(90deg)'
                }
              }}
            >
              <Close fontSize="small" /> {/* ✅ SMALLER icon */}
            </IconButton>
          </Stack>
        </Box>
      </motion.div>

      {/* ✅ REMOVED USER PROFILE SECTION COMPLETELY */}

      {/* 🚀 **COMPACT MENU ITEMS** */}
      <Box sx={{ 
        flex: 1, 
        py: 3, // ✅ INCREASED vertical padding to center items better
        overflow: 'visible',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }}>
        <List sx={{ px: 0 }}>
          <AnimatePresence>
            {visibleMenuItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <CompactMenuItem 
                  isActive={currentPage === item.id}
                  itemColor={item.color}
                  onClick={() => handleNavigation(item.id)}
                  onMouseEnter={() => setHoveredItem(item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <ListItemIcon sx={{ minWidth: 36, flexShrink: 0 }}> {/* ✅ SMALLER icon area */}
                    <Box className="menu-icon" sx={{ 
                      color: currentPage === item.id ? item.color : 'rgba(255,255,255,0.7)',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {React.cloneElement(item.icon, { fontSize: 'medium' })} {/* ✅ SMALLER icons */}
                    </Box>
                  </ListItemIcon>
                  
                  <ListItemText 
                    sx={{ flex: 1, minWidth: 0 }}
                    primary={
                      <Typography 
                        className="menu-text"
                        variant="body1" // ✅ SMALLER text
                        fontWeight={currentPage === item.id ? 700 : 600}
                        sx={{ 
                          color: currentPage === item.id ? item.color : 'rgba(255,255,255,0.9)',
                          transition: 'all 0.3s ease',
                          fontSize: '0.9rem' // ✅ SMALLER font size
                        }}
                      >
                        {item.label}
                      </Typography>
                    }
                    secondary={
                      <Typography 
                        variant="caption" // ✅ SMALLER text
                        sx={{ 
                          color: 'rgba(255,255,255,0.6)',
                          fontSize: '0.7rem' // ✅ SMALLER font size
                        }}
                      >
                        {item.description}
                      </Typography>
                    }
                  />
                  
                  <Stack direction="row" alignItems="center" spacing={0.5} sx={{ flexShrink: 0 }}> {/* ✅ SMALLER spacing */}
                    {item.badge && (
                      <Chip 
                        label={item.badge}
                        size="small" // ✅ SMALLER badges
                        sx={{ 
                          backgroundColor: alpha(item.color, 0.2),
                          color: item.color,
                          fontWeight: 700,
                          fontSize: '0.65rem', // ✅ SMALLER text
                          height: 20, // ✅ SMALLER height
                          minWidth: 'auto'
                        }}
                      />
                    )}
                    
                    <ChevronRight 
                      className="chevron-icon"
                      sx={{ 
                        color: alpha(item.color, 0.6),
                        fontSize: 18, // ✅ SMALLER chevron
                        opacity: hoveredItem === item.id ? 1 : 0,
                        transform: hoveredItem === item.id ? 'translateX(0px)' : 'translateX(-10px)',
                        transition: 'all 0.3s ease'
                      }} 
                    />
                  </Stack>
                </CompactMenuItem>
              </motion.div>
            ))}
          </AnimatePresence>
        </List>
      </Box>

      {/* 🔗 **COMPACT FOOTER** */}
      <Box sx={{ 
        p: 2, // ✅ SMALLER padding
        borderTop: '1px solid rgba(255,255,255,0.1)', 
        flexShrink: 0 
      }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 500, fontSize: '0.7rem' }}> {/* ✅ SMALLER text */}
            HSBC Procedures Hub v4.2.0
          </Typography>
          <Stack direction="row" spacing={0.5}> {/* ✅ SMALLER spacing */}
            <IconButton size="small" sx={{ color: 'rgba(255,255,255,0.6)' }}> {/* ✅ SMALLER buttons */}
              <Settings fontSize="small" /> {/* ✅ SMALLER icons */}
            </IconButton>
            <IconButton size="small" sx={{ color: 'rgba(255,255,255,0.6)' }}> {/* ✅ SMALLER buttons */}
              <Notifications fontSize="small" /> {/* ✅ SMALLER icons */}
            </IconButton>
          </Stack>
        </Stack>
      </Box>
    </GlassmorphismDrawer>
  );
};

export default NavigationDrawer;
