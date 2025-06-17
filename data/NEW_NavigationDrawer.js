// components/NavigationDrawer.js - COMPLETE SCROLLBAR-FREE VERSION
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
const slideIn = keyframes`
  0% { transform: translateX(-100%); opacity: 0; }
  100% { transform: translateX(0); opacity: 1; }
`;

const floatIcon = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-3px); }
`;

// 🎨 **Styled Components - SCROLLBAR-FREE**
const GlassmorphismDrawer = styled(Drawer)(({ theme }) => ({
  '& .MuiDrawer-paper': {
    width: 380, // ✅ INCREASED from 320 to 380 for more space
    background: 'linear-gradient(135deg, rgba(26,26,26,0.95) 0%, rgba(45,45,45,0.9) 100%)',
    backdropFilter: 'blur(20px)',
    border: 'none',
    borderRight: '1px solid rgba(255,255,255,0.1)',
    boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
    overflow: 'hidden', // ✅ HIDDEN to prevent any scrollbars
    marginTop: 64,
    display: 'flex',
    flexDirection: 'column',
    height: 'calc(100vh - 64px)', // ✅ EXACT HEIGHT to prevent overflow
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

const ModernMenuItem = styled(ListItem)(({ theme, isActive, itemColor }) => ({
  margin: '4px 20px', // ✅ INCREASED horizontal margin for wider layout
  borderRadius: '16px',
  padding: '16px 20px', // ✅ INCREASED padding for more comfortable spacing
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
    transform: 'translateX(8px)', // ✅ REDUCED movement to stay within bounds
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

const NavigationDrawer = ({ open, onClose, user, isAdmin, procedures, dashboardData }) => {
  const { currentPage, navigate } = useNavigation();
  const theme = useTheme();
  const [hoveredItem, setHoveredItem] = useState(null);

  // ✅ FIX: Get real stats from props
  const totalProcedures = procedures?.length || dashboardData?.stats?.total || 0;
  const expiringSoon = dashboardData?.stats?.expiringSoon || 0;
  const qualityScore = dashboardData?.stats?.averageScore || 0;

  // ✅ FIX: Updated menu items with correct navigation and permissions
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

  // ✅ FIX: Add admin items with proper permissions and navigation
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
      {/* 🌟 **SPECTACULAR HEADER** */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Box sx={{ 
          p: 4, // ✅ INCREASED padding for wider layout
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
            <Stack direction="row" alignItems="center" spacing={2}>
              <HSBCHexagon size={60}> {/* ✅ SLIGHTLY LARGER for wider layout */}
                <Person sx={{ color: 'white', fontSize: 28 }} />
              </HSBCHexagon>
              
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h5" fontWeight={900} color="white"> {/* ✅ LARGER text */}
                  Navigation
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>
                  HSBC Procedures Hub
                </Typography>
              </Box>
            </Stack>
            
            <IconButton 
              onClick={onClose} 
              sx={{ 
                color: 'white',
                flexShrink: 0,
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
          <Box sx={{ p: 4, flexShrink: 0 }}> {/* ✅ INCREASED padding */}
            <Paper sx={{ 
              p: 4, // ✅ INCREASED padding
              borderRadius: '20px',
              background: HSBCColors.gradients.glassMorphism,
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)'
            }}>
              <Stack direction="row" alignItems="center" spacing={3}> {/* ✅ INCREASED spacing */}
                <Avatar sx={{ 
                  width: 64, // ✅ LARGER avatar
                  height: 64,
                  background: HSBCColors.gradients.redPrimary,
                  fontSize: '1.8rem', // ✅ LARGER text
                  fontWeight: 900,
                  boxShadow: '0 8px 24px rgba(219,0,17,0.3)',
                  flexShrink: 0
                }}>
                  {user.displayName?.[0] || user.staffId?.[0] || 'U'}
                </Avatar>
                
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography 
                    variant="h5" // ✅ LARGER text
                    fontWeight={800} 
                    color="white" 
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {user.displayName || user.staffId}
                  </Typography>
                  <Typography 
                    variant="body1" // ✅ LARGER text
                    sx={{ 
                      color: 'rgba(255,255,255,0.7)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      mb: 1
                    }}
                  >
                    {user.email || 'user@hsbc.com'}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                    <Chip 
                      label={user.role || 'User'}
                      size="medium" // ✅ LARGER chips
                      sx={{ 
                        backgroundColor: user.role === 'admin' ? '#f44336' : 'rgba(255,255,255,0.2)',
                        color: 'white',
                        fontWeight: 700,
                        fontSize: '0.8rem' // ✅ LARGER text
                      }}
                    />
                    <Chip 
                      icon={<Star />}
                      label="Active"
                      size="medium" // ✅ LARGER chips
                      sx={{ 
                        backgroundColor: 'rgba(76,175,80,0.3)',
                        color: 'white',
                        fontWeight: 700,
                        fontSize: '0.8rem' // ✅ LARGER text
                      }}
                    />
                  </Stack>
                </Box>
              </Stack>
            </Paper>
          </Box>
        </motion.div>
      )}

      {/* 🚀 **NEXT-GEN MENU ITEMS - NO SCROLLING NEEDED** */}
      <Box sx={{ 
        flex: 1, 
        py: 2, 
        overflow: 'visible', // ✅ NO SCROLLING
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center' // ✅ CENTER the menu items
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
                <ModernMenuItem 
                  isActive={currentPage === item.id}
                  itemColor={item.color}
                  onClick={() => handleNavigation(item.id)}
                  onMouseEnter={() => setHoveredItem(item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <ListItemIcon sx={{ minWidth: 56, flexShrink: 0 }}> {/* ✅ LARGER icon area */}
                    <Box className="menu-icon" sx={{ 
                      color: currentPage === item.id ? item.color : 'rgba(255,255,255,0.7)',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {React.cloneElement(item.icon, { fontSize: 'large' })} {/* ✅ LARGER icons */}
                    </Box>
                  </ListItemIcon>
                  
                  <ListItemText 
                    sx={{ flex: 1, minWidth: 0 }}
                    primary={
                      <Typography 
                        className="menu-text"
                        variant="h6" // ✅ LARGER text
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
                        variant="body2" // ✅ LARGER text
                        sx={{ 
                          color: 'rgba(255,255,255,0.6)',
                          fontSize: '0.9rem' // ✅ LARGER text
                        }}
                      >
                        {item.description}
                      </Typography>
                    }
                  />
                  
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ flexShrink: 0 }}>
                    {item.badge && (
                      <Chip 
                        label={item.badge}
                        size="medium" // ✅ LARGER badges
                        sx={{ 
                          backgroundColor: alpha(item.color, 0.2),
                          color: item.color,
                          fontWeight: 700,
                          fontSize: '0.8rem', // ✅ LARGER text
                          height: 28, // ✅ LARGER height
                          minWidth: 'auto'
                        }}
                      />
                    )}
                    
                    <ChevronRight 
                      className="chevron-icon"
                      sx={{ 
                        color: alpha(item.color, 0.6),
                        fontSize: 24, // ✅ LARGER chevron
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

      {/* ✅ REMOVED QUICK STATS SECTION COMPLETELY - NO MORE SCROLLING! */}
      
      {/* 🔗 **FOOTER** */}
      <Box sx={{ 
        p: 4, // ✅ INCREASED padding
        borderTop: '1px solid rgba(255,255,255,0.1)', 
        flexShrink: 0 
      }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
            HSBC Procedures Hub v4.2.0
          </Typography>
          <Stack direction="row" spacing={1}>
            <IconButton size="medium" sx={{ color: 'rgba(255,255,255,0.6)' }}> {/* ✅ LARGER buttons */}
              <Settings />
            </IconButton>
            <IconButton size="medium" sx={{ color: 'rgba(255,255,255,0.6)' }}> {/* ✅ LARGER buttons */}
              <Notifications />
            </IconButton>
          </Stack>
        </Stack>
      </Box>
    </GlassmorphismDrawer>
  );
};

export default NavigationDrawer;
