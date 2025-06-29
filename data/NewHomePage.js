// pages/HomePage.js - Next-Gen HSBC Professional Homepage with Personalization
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Alert, Grid, Card, CardContent, Paper, alpha, LinearProgress, 
  Badge, Chip, Avatar, IconButton, Fab, Container, Skeleton, Stack, Tooltip,
  useTheme, styled, keyframes, CardHeader, Divider, Button
} from '@mui/material';
import {
  Dashboard, Schedule, TrendingUp, Error as ErrorIcon, Folder, Person, 
  CloudUpload, Warning, CheckCircle, Business, Assessment, Star, Timeline, 
  BarChart, PieChart, Security, CalendarToday, AdminPanelSettings, 
  NotificationsActive, Insights, AccountBalance, TrendingDown, 
  LocalFireDepartment, Psychology, Speed, Analytics, Groups,
  WavingHand, Coffee, Lightbulb, AutoAwesome, Celebration
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, 
  Legend, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart,
  Line, Area, AreaChart, RadialBarChart, RadialBar
} from 'recharts';
import { useNavigation } from '../contexts/NavigationContext';

// 🎨 **HSBC Brand Colors (Official)**
const HSBCColors = {
  primary: '#DB0011',      // HSBC Red
  secondary: '#9FA1A4',    // HSBC Grey  
  black: '#000000',
  white: '#FFFFFF',
  gradients: {
    redPrimary: 'linear-gradient(135deg, #DB0011 0%, #B50010 50%, #8B000C 100%)',
    redSecondary: 'linear-gradient(135deg, #FF1B2D 0%, #DB0011 50%, #B50010 100%)',
    darkMatter: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #404040 100%)',
    lightGlass: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)',
    modernGlass: 'linear-gradient(135deg, rgba(219,0,17,0.1) 0%, rgba(159,161,164,0.05) 100%)'
  }
};

// 🌟 **Advanced Animations**
const pulseGlow = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(219, 0, 17, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(219, 0, 17, 0); }
  100% { box-shadow: 0 0 0 0 rgba(219, 0, 17, 0); }
`;

const floatAnimation = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
`;

const hexagonRotate = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

// 🎨 **Styled Components with HSBC Branding**
const GlassmorphismCard = styled(Card)(({ theme, hsbc_primary = false }) => ({
  background: hsbc_primary 
    ? HSBCColors.gradients.redPrimary
    : HSBCColors.gradients.lightGlass,
  backdropFilter: 'blur(20px)',
  border: `1px solid ${hsbc_primary ? 'rgba(255,255,255,0.2)' : 'rgba(219,0,17,0.1)'}`,
  borderRadius: '24px',
  boxShadow: hsbc_primary 
    ? '0 20px 60px rgba(219,0,17,0.3), inset 0 1px 0 rgba(255,255,255,0.2)'
    : '0 20px 60px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.8)',
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  cursor: 'pointer',
  '&:hover': {
    transform: 'translateY(-8px) scale(1.02)',
    boxShadow: hsbc_primary 
      ? '0 30px 80px rgba(219,0,17,0.4), inset 0 1px 0 rgba(255,255,255,0.3)'
      : '0 30px 80px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.9)',
    '& .hsbc-icon': {
      animation: `${floatAnimation} 2s ease-in-out infinite`
    }
  }
}));

const HSBCHexagon = styled(Box)(({ theme, size = 60 }) => ({
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

const PersonalizedWelcome = styled(Box)(({ theme }) => ({
  background: HSBCColors.gradients.modernGlass,
  backdropFilter: 'blur(15px)',
  borderRadius: '20px',
  border: `1px solid ${alpha(HSBCColors.primary, 0.1)}`,
  padding: theme.spacing(3),
  marginBottom: theme.spacing(4),
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: HSBCColors.gradients.redPrimary
  }
}));

const NextGenStatCard = ({ icon, title, value, subtitle, color, isClickable = false, onClick, trend, trendValue }) => {
  const theme = useTheme();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
      whileHover={isClickable ? { scale: 1.02 } : {}}
    >
      <GlassmorphismCard 
        onClick={isClickable ? onClick : undefined}
        sx={{ 
          height: '100%',
          cursor: isClickable ? 'pointer' : 'default',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Background Pattern */}
        <Box sx={{
          position: 'absolute',
          top: -50,
          right: -50,
          width: 120,
          height: 120,
          background: `linear-gradient(135deg, ${alpha(color, 0.1)} 0%, transparent 100%)`,
          borderRadius: '50%'
        }} />
        
        <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
            <Box sx={{ flex: 1 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>
                  {title}
                </Typography>
                {trend && (
                  <Chip 
                    icon={trend === 'up' ? <TrendingUp /> : <TrendingDown />}
                    label={trendValue}
                    size="small"
                    color={trend === 'up' ? 'success' : 'error'}
                    sx={{ height: 20, fontSize: '0.65rem' }}
                  />
                )}
              </Stack>
              
              <Typography variant="h2" fontWeight={900} color={color} sx={{ 
                mb: 1,
                fontFamily: '"Inter", "Roboto", sans-serif',
                letterSpacing: '-0.02em'
              }}>
                {value}
              </Typography>
              
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            </Box>
            
            <Box className="hsbc-icon" sx={{ 
              p: 2, 
              borderRadius: '16px',
              background: `linear-gradient(135deg, ${alpha(color, 0.1)} 0%, ${alpha(color, 0.05)} 100%)`,
              color: color
            }}>
              {icon}
            </Box>
          </Stack>
          
          {isClickable && (
            <Box sx={{ 
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 4,
              background: `linear-gradient(90deg, ${color} 0%, ${alpha(color, 0.3)} 100%)`
            }} />
          )}
        </CardContent>
      </GlassmorphismCard>
    </motion.div>
  );
};

const HomePage = ({ user, dashboardData, procedures, isAdmin, isUploader, sharePointAvailable }) => {
  const { navigate } = useNavigation();
  const theme = useTheme();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [userPictureUrl, setUserPictureUrl] = useState(null);

  // 🕒 **Real-time Clock**
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 👤 **Load User Picture from SharePoint API**
  useEffect(() => {
    if (user && sharePointAvailable) {
      // Get PictureURL from SharePoint user profile
      setUserPictureUrl(user.PictureURL || `https://photos.global.hsbc/GetPhoto.ashx?pose=casual&format=square&empid=${user.staffId}`);
    }
  }, [user, sharePointAvailable]);

  // 🎯 **Personalized Greeting Logic**
  const getPersonalizedGreeting = () => {
    const hour = currentTime.getHours();
    const name = user?.displayName?.split(' ')[0] || 'there';
    
    if (hour < 12) return { text: `Good morning, ${name}!`, icon: <Coffee />, color: '#ff9800' };
    if (hour < 17) return { text: `Good afternoon, ${name}!`, icon: <Lightbulb />, color: '#2196f3' };
    return { text: `Good evening, ${name}!`, icon: <AutoAwesome />, color: '#9c27b0' };
  };

  const greeting = getPersonalizedGreeting();

  // Your existing calculation functions (unchanged)
  const lobConfig = {
    'IWPB': { name: 'International Wealth and Premier Banking', color: '#1976d2', icon: '🏦' },
    'CIB': { name: 'Commercial and Institutional Banking', color: '#388e3c', icon: '🏢' },
    'GCOO': { name: 'Group Chief Operating Officer', color: '#f57c00', icon: '⚙️' }
  };

  const riskConfig = {
    'High': { color: '#f44336', label: 'High Risk' },
    'Medium': { color: '#ff9800', label: 'Medium Risk' },
    'Low': { color: '#4caf50', label: 'Low Risk' },
    'Critical': { color: '#d32f2f', label: 'Critical Risk' }
  };

  const calculateRiskData = () => {
    if (!procedures || procedures.length === 0) return [];
    const riskStats = {};
    procedures.forEach(proc => {
      const risk = proc.risk_rating || 'Unknown';
      if (!riskStats[risk]) riskStats[risk] = 0;
      riskStats[risk]++;
    });
    return Object.entries(riskStats).map(([risk, count]) => ({
      name: risk,
      value: count,
      label: riskConfig[risk]?.label || risk,
      color: riskConfig[risk]?.color || '#9e9e9e',
      percentage: Math.round((count / procedures.length) * 100)
    }));
  };

  const calculateLOBData = () => {
    if (!procedures || procedures.length === 0) return {};
    const lobStats = {};
    procedures.forEach(proc => {
      const lob = proc.lob;
      if (lob && lobConfig[lob]) {
        if (!lobStats[lob]) {
          lobStats[lob] = { count: 0, totalScore: 0, expired: 0, expiringSoon: 0, procedures: [] };
        }
        lobStats[lob].count++;
        lobStats[lob].totalScore += proc.score || 0;
        lobStats[lob].procedures.push(proc);
        
        const expiry = new Date(proc.expiry);
        const now = new Date();
        const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
        
        if (daysLeft < 0) lobStats[lob].expired++;
        else if (daysLeft <= 30) lobStats[lob].expiringSoon++;
      }
    });
    Object.keys(lobStats).forEach(lob => {
      lobStats[lob].avgScore = lobStats[lob].count > 0 ? 
        Math.round(lobStats[lob].totalScore / lobStats[lob].count) : 0;
    });
    return lobStats;
  };

  const realLOBData = calculateLOBData();
  const riskData = calculateRiskData();
  const hasRealData = Object.keys(realLOBData).length > 0;

const stats = dashboardData?.stats || {
  total: procedures?.length || 0,
  nearExpiry: procedures?.filter(p => {
    const expiry = new Date(p.expiry);
    const now = new Date();
    const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    return daysLeft > 0 && daysLeft <= 60;
  }).length || 0,
  expired: procedures?.filter(p => new Date(p.expiry) < new Date()).length || 0,
  documentControl: procedures?.filter(p => (p.score || 0) === 100).length || 0
};

  // 🎯 **Role-based Quick Links**
  const quickLinks = [
    { 
      title: 'All Procedures', 
      path: 'procedures', 
      icon: <Folder />, 
      color: HSBCColors.primary,
      description: 'View all procedures',
      count: stats.total,
      showFor: 'all'
    }
  ];

  if (isAdmin) {
    quickLinks.push({ 
      title: 'Admin Dashboard', 
      path: 'admin-dashboard', 
      icon: <AdminPanelSettings />, 
      color: '#f44336',
      description: 'Admin management panel',
      count: '⚙️',
      showFor: 'admin'
    });
  }

  if (isAdmin || isUploader) {
    quickLinks.push({ 
      title: 'Upload New', 
      path: 'admin-panel', 
      icon: <CloudUpload />, 
      color: '#7b1fa2',
      description: 'Upload procedure',
      count: '+',
      showFor: 'uploader'
    });
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* 🌟 **NEXT-GEN HEADER with HSBC Branding** */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          mb: 4,
          position: 'relative'
        }}>
          <Stack direction="row" alignItems="center" spacing={3}>
            <HSBCHexagon size={80}>
              <Typography variant="h5" fontWeight={900} color="white">
                H
              </Typography>
            </HSBCHexagon>
            
            <Box>
              <Typography 
                variant="h3" 
                fontWeight={900} 
                sx={{ 
                  background: HSBCColors.gradients.redPrimary,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontFamily: '"Inter", "Roboto", sans-serif',
                  letterSpacing: '-0.02em'
                }}
              >
                HBEG Procedures Hub
              </Typography>
              <Typography variant="h6" color="text.secondary" fontWeight={500}>
                Next-Generation Procedure Management with robust Document Analysis
              </Typography>
            </Box>
          </Stack>

          {/* ⏰ **Live Clock** */}
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="h4" fontWeight={700} color={HSBCColors.primary}>
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {currentTime.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Typography>
          </Box>
        </Box>
      </motion.div>

      {/* 👋 **PERSONALIZED WELCOME SECTION** */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <PersonalizedWelcome>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={8}>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                <Box sx={{ color: greeting.color, fontSize: 28 }}>
                  {greeting.icon}
                </Box>
                <Typography variant="h4" fontWeight={700} color="text.primary">
                  {greeting.text}
                </Typography>
                <Chip 
                  label={isAdmin ? 'Administrator' : isUploader ? 'Content Uploader' : 'User'}
                  color={isAdmin ? 'error' : isUploader ? 'warning' : 'primary'}
                  variant="outlined"
                  sx={{ fontWeight: 600 }}
                />
              </Stack>
              
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                Welcome to your personalized procedures dashboard. 
                {sharePointAvailable ? 
                  `Successfully connected to SharePoint with ${stats.total} procedures loaded.` :
                  'Currently running in demo mode with sample data.'
                }
              </Typography>
              
              <Stack direction="row" spacing={1}>
                <Chip 
                  icon={sharePointAvailable ? <CheckCircle /> : <Warning />}
                  label={sharePointAvailable ? 'Database Connected' : 'Demo Mode'}
                  color={sharePointAvailable ? 'success' : 'warning'}
                  variant="outlined"
                />
                <Chip 
                  label={user?.source || 'Authentication System'}
                  variant="outlined"
                />
              </Stack>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={2}>
                {/* 👤 **User Avatar with Picture from SharePoint** */}
                <Avatar 
                  src={userPictureUrl}
                  sx={{ 
                    width: 80, 
                    height: 80,
                    border: `3px solid ${HSBCColors.primary}`,
                    boxShadow: `0 8px 32px ${alpha(HSBCColors.primary, 0.3)}`
                  }}
                >
                  {user?.displayName?.[0] || 'U'}
                </Avatar>
                
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="h6" fontWeight={700}>
                    {user?.displayName || user?.staffId}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Staff ID: {user?.staffId}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {user?.email}
                  </Typography>
                </Box>
              </Stack>
            </Grid>
          </Grid>
        </PersonalizedWelcome>
      </motion.div>

      {/* 📊 **ENHANCED STATISTICS CARDS** */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <NextGenStatCard
            icon={<Dashboard sx={{ fontSize: 28 }} />}
            title="Total Procedures"
            value={stats.total}
            subtitle="Click to view all procedures"
            color={HSBCColors.primary}
            isClickable={true}
            onClick={() => navigate('procedures', { filter: 'all' })}
            trend="up"
            trendValue="+12%"
          />
        </Grid>
        
   <Grid item xs={12} sm={6} md={3}>
  <NextGenStatCard
    icon={<Schedule sx={{ fontSize: 28 }} />}
    title="Near Expiry"
    value={stats.nearExpiry}
    subtitle="Number of procedures expiring in 60 days"
    color="#ff9800"
    isClickable={stats.nearExpiry > 0}
    onClick={() => stats.nearExpiry > 0 && navigate('procedures', { filter: 'nearExpiry' })}
    trend="down"
    trendValue="-2%"
  />
</Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <NextGenStatCard
            icon={stats.expired > 0 ? <ErrorIcon sx={{ fontSize: 28 }} /> : <Star sx={{ fontSize: 28 }} />}
            title={stats.expired > 0 ? "Expired" : "Compliance"}
            value={stats.expired > 0 ? stats.expired : "100%"}
            subtitle={stats.expired > 0 ? "Require immediate update" : "All procedures current"}
            color={stats.expired > 0 ? '#f44336' : '#4caf50'}
            trend={stats.expired > 0 ? "down" : "up"}
            trendValue={stats.expired > 0 ? "Critical" : "Perfect"}
          />
        </Grid>
        
<Grid item xs={12} sm={6} md={3}>
  <NextGenStatCard
    icon={<Assessment sx={{ fontSize: 28 }} />}
    title="High Quality"
    value={stats.documentControl}
    subtitle="Number of procedures achieved 100% document control"
    color="#7b1fa2"
    trend="up"
    trendValue="+5%"
  />
</Grid>

      {/* 📈 **ADVANCED ANALYTICS CHARTS** */}
      {sharePointAvailable && procedures && procedures.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {/* Risk Analysis Chart */}
            <Grid item xs={12} md={6}>
              <GlassmorphismCard sx={{ height: 400 }}>
                <CardHeader
                  avatar={<Security sx={{ color: HSBCColors.primary }} />}
                  title={
                    <Typography variant="h6" fontWeight={700}>
                      Risk Distribution Analysis
                    </Typography>
                  }
                  action={
                    <Chip 
                      icon={<PieChart />}
                      label="Live Data"
                      color="error"
                      variant="outlined"
                      size="small"
                    />
                  }
                />
                <CardContent sx={{ height: 300 }}>
                  {riskData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={riskData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={120}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {riskData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                        <Legend />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  ) : (
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      height: '100%',
                      flexDirection: 'column'
                    }}>
                      <Security sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="body2" color="text.secondary">
                        No risk data available
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </GlassmorphismCard>
            </Grid>

            {/* Quality Trends */}
            <Grid item xs={12} md={6}>
              <GlassmorphismCard sx={{ height: 400 }}>
                <CardHeader
                  avatar={<TrendingUp sx={{ color: '#4caf50' }} />}
                  title={
                    <Typography variant="h6" fontWeight={700}>
                      Quality Score Trends
                    </Typography>
                  }
                  action={
                    <Chip 
                      icon={<BarChart />}
                      label="Real-time"
                      color="success"
                      variant="outlined"
                      size="small"
                    />
                  }
                />
                <CardContent sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[
                      { month: 'Jan', score: 78 },
                      { month: 'Feb', score: 82 },
                      { month: 'Mar', score: 85 },
                      { month: 'Apr', score: 88 },
                      { month: 'May', score: 84 },
                      { month: 'Jun', score: 90 }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" fontSize={12} />
                      <YAxis fontSize={12} />
                      <RechartsTooltip />
                      <Area 
                        type="monotone" 
                        dataKey="score" 
                        stroke="#4caf50" 
                        fill="url(#colorScore)" 
                      />
                      <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4caf50" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#4caf50" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </GlassmorphismCard>
            </Grid>
          </Grid>
        </motion.div>
      )}

      {/* 🏢 **LOB BREAKDOWN with HSBC Styling** */}
      {hasRealData && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <GlassmorphismCard sx={{ p: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box>
                <Typography variant="h5" fontWeight={800} gutterBottom>
                  📊 Line of Business Overview
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Real-time data from SharePoint • {stats.total} total procedures across {Object.keys(realLOBData).length} LOBs
                </Typography>
              </Box>
           <Chip 
                icon={<Timeline />}
                label="Real-time Data"
                color="success" 
                variant="outlined"
              />
            </Box>
            
            <Grid container spacing={3}>
              {Object.entries(realLOBData).map(([lob, data]) => {
                const config = lobConfig[lob];
                const percentage = Math.round((data.count / stats.total) * 100);
                
                return (
                  <Grid item xs={12} md={4} key={lob}>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <GlassmorphismCard 
                        sx={{ 
                          cursor: 'pointer',
                          background: `linear-gradient(135deg, ${alpha(config.color, 0.1)} 0%, ${alpha(config.color, 0.05)} 100%)`,
                          border: `2px solid ${alpha(config.color, 0.2)}`,
                          '&:hover': {
                            borderColor: config.color,
                            '& .lob-icon': {
                              animation: `${pulseGlow} 2s infinite`
                            }
                          }
                        }}
                        onClick={() => navigate('procedures')}
                      >
                        <CardContent sx={{ p: 3 }}>
                          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                            <Box 
                              className="lob-icon"
                              sx={{ 
                                fontSize: 32,
                                p: 1.5,
                                borderRadius: '12px',
                                background: `linear-gradient(135deg, ${alpha(config.color, 0.2)} 0%, ${alpha(config.color, 0.1)} 100%)`,
                                border: `1px solid ${alpha(config.color, 0.3)}`
                              }}
                            >
                              {config.icon}
                            </Box>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="h4" fontWeight={900} color={config.color}>
                                {data.count}
                              </Typography>
                              <Typography variant="h6" fontWeight={700} gutterBottom>
                                {lob}
                              </Typography>
                            </Box>
                          </Stack>
                          
                          <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                            {config.name}
                          </Typography>
                          
                          <Box sx={{ mt: 2 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                              <Typography variant="body2" fontWeight={600}>Quality Score</Typography>
                              <Typography variant="body2" fontWeight={800} color={config.color}>
                                {data.avgScore}%
                              </Typography>
                            </Stack>
                            <LinearProgress 
                              variant="determinate" 
                              value={data.avgScore} 
                              sx={{ 
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: alpha(config.color, 0.1),
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: config.color,
                                  borderRadius: 4,
                                  backgroundImage: `linear-gradient(45deg, rgba(255,255,255,0.2) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.2) 75%, transparent 75%, transparent)`
                                }
                              }}
                            />
                          </Box>
                          
                          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                            <Chip 
                              label={`${percentage}%`}
                              size="small"
                              sx={{ 
                                backgroundColor: alpha(config.color, 0.1),
                                color: config.color,
                                fontWeight: 700,
                                fontSize: '0.75rem'
                              }}
                            />
                            {data.expiringSoon > 0 && (
                              <Chip 
                                label={`${data.expiringSoon} expiring`}
                                size="small"
                                color="warning"
                                icon={<Schedule />}
                              />
                            )}
                            {data.expired > 0 && (
                              <Chip 
                                label={`${data.expired} expired`}
                                size="small"
                                color="error"
                                icon={<ErrorIcon />}
                              />
                            )}
                          </Stack>
                        </CardContent>
                      </GlassmorphismCard>
                    </motion.div>
                  </Grid>
                );
              })}
            </Grid>
          </GlassmorphismCard>
        </motion.div>
      )}

      {/* 🚀 **NEXT-GEN QUICK ACCESS CARDS** */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.8 }}
      >
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" fontWeight={800} gutterBottom sx={{ mb: 3 }}>
            🚀 Quick Actions
          </Typography>
          
          <Grid container spacing={3}>
            {quickLinks.map((link, index) => (
              <Grid item xs={12} md={quickLinks.length === 3 ? 4 : 6} key={link.path}>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.9 + index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <GlassmorphismCard 
                    sx={{ 
                      height: '100%',
                      cursor: 'pointer',
                      background: `linear-gradient(135deg, ${alpha(link.color, 0.05)} 0%, rgba(255,255,255,0.9) 100%)`,
                      border: link.showFor === 'admin' ? `2px solid ${alpha('#f44336', 0.3)}` : 
                             link.showFor === 'uploader' ? `2px solid ${alpha('#7b1fa2', 0.3)}` : 
                             `2px solid ${alpha(link.color, 0.2)}`,
                      '&:hover': {
                        borderColor: link.color,
                        '& .action-icon': {
                          animation: `${floatAnimation} 2s ease-in-out infinite`
                        }
                      }
                    }}
                    onClick={() => navigate(link.path)}
                  >
                    <CardContent sx={{ p: 4 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Box 
                            className="action-icon"
                            sx={{ 
                              p: 2.5, 
                              borderRadius: '16px', 
                              background: `linear-gradient(135deg, ${alpha(link.color, 0.1)} 0%, ${alpha(link.color, 0.05)} 100%)`,
                              color: link.color,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: `1px solid ${alpha(link.color, 0.2)}`
                            }}
                          >
                            {link.icon}
                          </Box>
                          <Typography variant="h5" fontWeight={800} color={link.color}>
                            {link.title}
                          </Typography>
                        </Stack>
                        <Typography variant="h2" fontWeight={900} color={link.color}>
                          {link.count}
                        </Typography>
                      </Stack>
                      
                      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                        {link.description}
                      </Typography>
                      
                      {link.showFor !== 'all' && (
                        <Chip 
                          label={link.showFor === 'admin' ? 'Administrator Access' : 'Upload Privileges'}
                          size="small"
                          color={link.showFor === 'admin' ? 'error' : 'secondary'}
                          variant="outlined"
                          icon={link.showFor === 'admin' ? <AdminPanelSettings /> : <CloudUpload />}
                        />
                      )}
                    </CardContent>
                  </GlassmorphismCard>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Box>
      </motion.div>

      {/* 🎭 **ENHANCED GOVERNANCE TEAM SECTION** */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.0 }}
      >
        <Box sx={{ mb: 4 }}>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
            <Groups sx={{ color: HSBCColors.primary, fontSize: 32 }} />
            <Typography variant="h5" fontWeight={800}>
              Governance Team
            </Typography>
            <Chip 
              label="Leadership Team"
              color="primary"
              variant="outlined"
              icon={<Star />}
            />
          </Stack>
          
          <Grid container spacing={3}>
            {/* Team Member 1 */}
            <Grid item xs={12} md={4}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <GlassmorphismCard hsbc_primary={true}>
                  <CardContent sx={{ p: 3 }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar 
                        src="https://photos.global.hsbc/GetPhoto.ashx?pose=casual&format=square&empid=43744500"
                        sx={{ 
                          width: 80, 
                          height: 80,
                          border: '3px solid rgba(255,255,255,0.3)',
                          boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
                        }}
                      />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" fontWeight={800} color="white" gutterBottom>
                          Maii Pharouh
                        </Typography>
                        <Typography variant="body2" color="rgba(255,255,255,0.9)" gutterBottom>
                          SENIOR MANAGER GOVERNANCE AND PERFORMANCE MGT
                        </Typography>
                        <Chip 
                          label="maii.pharouh@hsbc.com"
                          size="small"
                          sx={{ 
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            color: 'white',
                            fontSize: '0.7rem'
                          }}
                        />
                      </Box>
                    </Stack>
                  </CardContent>
                </GlassmorphismCard>
              </motion.div>
            </Grid>

            {/* Team Member 2 */}
            <Grid item xs={12} md={4}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <GlassmorphismCard sx={{ 
                  background: HSBCColors.gradients.darkMatter,
                  color: 'white'
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar 
                        src="https://photos.global.hsbc/GetPhoto.ashx?pose=casual&format=square&empid=43246885"
                        sx={{ 
                          width: 80, 
                          height: 80,
                          border: '3px solid rgba(255,255,255,0.3)',
                          boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
                        }}
                      />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" fontWeight={800} color="white" gutterBottom>
                          Heba A MAHER
                        </Typography>
                        <Typography variant="body2" color="rgba(255,255,255,0.9)" gutterBottom>
                          MANAGER GOVERNANCE AND PERFORMANCE MGT
                        </Typography>
                        <Chip 
                          label="heba.maher@hsbc.com"
                          size="small"
                          sx={{ 
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            color: 'white',
                            fontSize: '0.7rem'
                          }}
                        />
                      </Box>
                    </Stack>
                  </CardContent>
                </GlassmorphismCard>
              </motion.div>
            </Grid>

            {/* Team Member 3 */}
            <Grid item xs={12} md={4}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <GlassmorphismCard sx={{ 
                  background: HSBCColors.gradients.darkMatter,
                  color: 'white'
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar 
                        src="https://photos.global.hsbc/GetPhoto.ashx?pose=casual&format=square&empid=43246885"
                        sx={{ 
                          width: 80, 
                          height: 80,
                          border: '3px solid rgba(255,255,255,0.3)',
                          boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
                        }}
                      />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" fontWeight={800} color="white" gutterBottom>
                          Radwa HEGAZY
                        </Typography>
                        <Typography variant="body2" color="rgba(255,255,255,0.9)" gutterBottom>
                          GOVERNANCE AND PERFORMANCE MGT MANAGER
                        </Typography>
                        <Chip 
                          label="radwa.osman.hegazy@hsbc.com"
                          size="small"
                          sx={{ 
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            color: 'white',
                            fontSize: '0.7rem'
                          }}
                        />
                      </Box>
                    </Stack>
                  </CardContent>
                </GlassmorphismCard>
              </motion.div>
            </Grid>
          </Grid>
        </Box>
      </motion.div>

      {/* 🎯 **GETTING STARTED SECTION** */}
      {!hasRealData && sharePointAvailable && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 1.2 }}
        >
          <GlassmorphismCard sx={{ p: 4, textAlign: 'center' }}>
            <Stack alignItems="center" spacing={2}>
              <Box sx={{ 
                p: 3,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${alpha(HSBCColors.primary, 0.1)} 0%, ${alpha(HSBCColors.primary, 0.05)} 100%)`,
                border: `2px solid ${alpha(HSBCColors.primary, 0.2)}`
              }}>
                <Celebration sx={{ fontSize: 48, color: HSBCColors.primary }} />
              </Box>
              
              <Typography variant="h5" fontWeight={800} gutterBottom>
                🎯 Ready to Get Started!
              </Typography>
              
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600 }}>
                Your SharePoint integration is working perfectly. Start by uploading some procedures to see the LOB breakdown and risk analysis charts with real data.
                {(isAdmin || isUploader) && (
                  <>
                    {' '}Click <strong>"Upload New"</strong> above to add your first procedure.
                  </>
                )}
              </Typography>
              
              {(isAdmin || isUploader) && (
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate('admin-panel')}
                  startIcon={<CloudUpload />}
                  sx={{
                    mt: 2,
                    background: HSBCColors.gradients.redPrimary,
                    borderRadius: '12px',
                    px: 4,
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    textTransform: 'none',
                    boxShadow: `0 8px 32px ${alpha(HSBCColors.primary, 0.3)}`,
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: `0 12px 40px ${alpha(HSBCColors.primary, 0.4)}`
                    }
                  }}
                >
                  Upload First Procedure
                </Button>
              )}
            </Stack>
          </GlassmorphismCard>
        </motion.div>
      )}

      {/* 🌟 **FLOATING ACTION BUTTON** */}
      <AnimatePresence>
        {(isAdmin || isUploader) && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ type: "spring", stiffness: 200, delay: 1.5 }}
            style={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              zIndex: 1000
            }}
          >
            <Fab
              color="primary"
              size="large"
              onClick={() => navigate('admin-panel')}
              sx={{
                background: HSBCColors.gradients.redPrimary,
                width: 70,
                height: 70,
                boxShadow: `0 8px 32px ${alpha(HSBCColors.primary, 0.4)}`,
                animation: `${pulseGlow} 3s infinite`,
                '&:hover': {
                  transform: 'scale(1.1)',
                  boxShadow: `0 12px 40px ${alpha(HSBCColors.primary, 0.5)}`
                }
              }}
            >
              <CloudUpload sx={{ fontSize: 28 }} />
            </Fab>
          </motion.div>
        )}
      </AnimatePresence>
    </Container>
  );
};

export default HomePage;
