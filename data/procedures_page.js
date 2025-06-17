// pages/ProceduresPage.js - Next-Gen HSBC Professional Procedures Experience
import React, { useState, useMemo, useEffect } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Button, Chip, TextField, 
  InputAdornment, FormControl, InputLabel, Select, MenuItem, Alert, 
  IconButton, Tooltip, Badge, Stack, Avatar, Divider, Paper, 
  ToggleButton, ToggleButtonGroup, Fab, useTheme, styled, keyframes,
  alpha, Container, LinearProgress, CardHeader, Skeleton
} from '@mui/material';
import {
  Search, FilterList, Refresh, Person, Business, CalendarToday,
  Visibility, CloudDownload, Schedule, Error as ErrorIcon,
  CheckCircle, Warning, Star, ViewList, ViewModule, Sort,
  TrendingUp, Security, Assessment, Timeline, LocalFireDepartment,
  Psychology, AutoAwesome, Insights, Speed, BarChart,
  TableView, GridView, FilterAlt, Clear, GetApp, Share
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigation } from '../contexts/NavigationContext';
import ProcedureDetailsModal from '../components/ProcedureDetailsModal';

// 🎨 **HSBC Brand Colors (Official)**
const HSBCColors = {
  primary: '#DB0011',
  secondary: '#9FA1A4',
  black: '#000000',
  white: '#FFFFFF',
  gradients: {
    redPrimary: 'linear-gradient(135deg, #DB0011 0%, #B50010 50%, #8B000C 100%)',
    redSecondary: 'linear-gradient(135deg, #FF1B2D 0%, #DB0011 50%, #B50010 100%)',
    darkMatter: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #404040 100%)',
    lightGlass: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)',
    modernGlass: 'linear-gradient(135deg, rgba(219,0,17,0.1) 0%, rgba(159,161,164,0.05) 100%)',
    successGlass: 'linear-gradient(135deg, rgba(76,175,80,0.1) 0%, rgba(76,175,80,0.05) 100%)',
    warningGlass: 'linear-gradient(135deg, rgba(255,152,0,0.1) 0%, rgba(255,152,0,0.05) 100%)',
    errorGlass: 'linear-gradient(135deg, rgba(244,67,54,0.1) 0%, rgba(244,67,54,0.05) 100%)'
  }
};

// 🌟 **Advanced Animations**
const pulseGlow = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(219, 0, 17, 0.4); }
  70% { box-shadow: 0 0 0 15px rgba(219, 0, 17, 0); }
  100% { box-shadow: 0 0 0 0 rgba(219, 0, 17, 0); }
`;

const floatAnimation = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-8px) rotate(2deg); }
`;

const shimmerAnimation = keyframes`
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
`;

const countUpAnimation = keyframes`
  0% { transform: scale(0.8); opacity: 0; }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); opacity: 1; }
`;

// 🎨 **Styled Components with HSBC Branding**
const GlassmorphismCard = styled(Card)(({ theme, variant = 'default', clickable = false }) => ({
  background: variant === 'primary' 
    ? HSBCColors.gradients.redPrimary
    : variant === 'success'
    ? HSBCColors.gradients.successGlass
    : variant === 'warning'
    ? HSBCColors.gradients.warningGlass
    : variant === 'error'
    ? HSBCColors.gradients.errorGlass
    : HSBCColors.gradients.lightGlass,
  backdropFilter: 'blur(20px)',
  border: `1px solid ${variant === 'primary' ? 'rgba(255,255,255,0.2)' : 'rgba(219,0,17,0.1)'}`,
  borderRadius: '24px',
  boxShadow: variant === 'primary' 
    ? '0 20px 60px rgba(219,0,17,0.3), inset 0 1px 0 rgba(255,255,255,0.2)'
    : '0 20px 60px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.8)',
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  cursor: clickable ? 'pointer' : 'default',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
    transition: 'left 0.5s'
  },
  '&:hover': clickable ? {
    transform: 'translateY(-8px) scale(1.02)',
    boxShadow: variant === 'primary' 
      ? '0 30px 80px rgba(219,0,17,0.4), inset 0 1px 0 rgba(255,255,255,0.3)'
      : '0 30px 80px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.9)',
    '&::before': {
      left: '100%'
    }
  } : {}
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

const EnhancedSearchField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: '16px',
    background: 'rgba(255,255,255,0.9)',
    backdropFilter: 'blur(10px)',
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
    },
    '&.Mui-focused': {
      transform: 'translateY(-2px)',
      boxShadow: `0 8px 24px ${alpha(HSBCColors.primary, 0.2)}`,
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: HSBCColors.primary,
        borderWidth: 2
      }
    }
  }
}));

const StatusChip = styled(Chip)(({ severity }) => ({
  fontWeight: 800,
  fontSize: '0.75rem',
  height: 32,
  animation: `${countUpAnimation} 0.5s ease-out`,
  '& .MuiChip-icon': {
    fontSize: 18
  }
}));

const ProceduresPage = ({ procedures = [], sharePointAvailable = false, onDataRefresh, user }) => {
  const { navigate } = useNavigation();
  const theme = useTheme();
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLOB, setFilterLOB] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterRisk, setFilterRisk] = useState('');
  const [filterQuality, setFilterQuality] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [loading, setLoading] = useState(false);
  
  // Modal state
  const [selectedProcedureId, setSelectedProcedureId] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // 🕒 **Real-time Clock**
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const now = new Date();

  // 🎯 **Enhanced Status Calculation**
  const getStatusInfo = (expiry, score = 0) => {
    const expiryDate = new Date(expiry);
    const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 0) {
      return {
        status: 'EXPIRED',
        color: '#f44336',
        bgColor: HSBCColors.gradients.errorGlass,
        icon: <ErrorIcon />,
        text: `EXPIRED (${Math.abs(daysLeft)} days ago)`,
        severity: 'error',
        priority: 4
      };
    } else if (daysLeft <= 7) {
      return {
        status: 'CRITICAL',
        color: '#d32f2f',
        bgColor: HSBCColors.gradients.errorGlass,
        icon: <LocalFireDepartment />,
        text: `URGENT: ${daysLeft} days left`,
        severity: 'error',
        priority: 3
      };
    } else if (daysLeft <= 30) {
      return {
        status: 'EXPIRING',
        color: '#ff9800',
        bgColor: HSBCColors.gradients.warningGlass,
        icon: <Schedule />,
        text: `${daysLeft} days left`,
        severity: 'warning',
        priority: 2
      };
    } else {
      return {
        status: 'ACTIVE',
        color: '#4caf50',
        bgColor: HSBCColors.gradients.successGlass,
        icon: <CheckCircle />,
        text: `${daysLeft} days left`,
        severity: 'success',
        priority: 1
      };
    }
  };

  // 🎯 **Enhanced Quality Score Calculation**
  const getQualityInfo = (score) => {
    if (score >= 90) {
      return { level: 'Excellent', color: '#4caf50', icon: <AutoAwesome /> };
    } else if (score >= 80) {
      return { level: 'Good', color: '#8bc34a', icon: <CheckCircle /> };
    } else if (score >= 70) {
      return { level: 'Fair', color: '#ff9800', icon: <Warning /> };
    } else if (score >= 60) {
      return { level: 'Poor', color: '#f44336', icon: <ErrorIcon /> };
    } else {
      return { level: 'Critical', color: '#d32f2f', icon: <LocalFireDepartment /> };
    }
  };

  // 🎯 **Advanced Filtering and Sorting**
  const filteredAndSortedProcedures = useMemo(() => {
    let filtered = procedures.filter(proc => {
      const matchesSearch = !searchTerm || 
        proc.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proc.primary_owner?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proc.lob?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proc.procedure_subsection?.toLowerCase().includes(searchTerm.toLowerCase());
        
      const matchesLOB = !filterLOB || proc.lob === filterLOB;
      
      const statusInfo = getStatusInfo(proc.expiry, proc.score);
      const matchesStatus = !filterStatus || statusInfo.status === filterStatus;
      
      const matchesRisk = !filterRisk || proc.risk_rating === filterRisk;
      
      const matchesQuality = !filterQuality || 
        (filterQuality === 'excellent' && (proc.score || 0) >= 90) ||
        (filterQuality === 'good' && (proc.score || 0) >= 80 && (proc.score || 0) < 90) ||
        (filterQuality === 'fair' && (proc.score || 0) >= 60 && (proc.score || 0) < 80) ||
        (filterQuality === 'poor' && (proc.score || 0) < 60);
      
      return matchesSearch && matchesLOB && matchesStatus && matchesRisk && matchesQuality;
    });

    // Sort procedures
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name?.toLowerCase() || '';
          bValue = b.name?.toLowerCase() || '';
          break;
        case 'expiry':
          aValue = new Date(a.expiry);
          bValue = new Date(b.expiry);
          break;
        case 'score':
          aValue = a.score || 0;
          bValue = b.score || 0;
          break;
        case 'owner':
          aValue = a.primary_owner?.toLowerCase() || '';
          bValue = b.primary_owner?.toLowerCase() || '';
          break;
        case 'lob':
          aValue = a.lob?.toLowerCase() || '';
          bValue = b.lob?.toLowerCase() || '';
          break;
        default:
          aValue = a.name?.toLowerCase() || '';
          bValue = b.name?.toLowerCase() || '';
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [procedures, searchTerm, filterLOB, filterStatus, filterRisk, filterQuality, sortBy, sortOrder]);

  // Get unique values for filters
  const uniqueLOBs = [...new Set(procedures.map(p => p.lob).filter(Boolean))];
  const uniqueRisks = [...new Set(procedures.map(p => p.risk_rating).filter(Boolean))];

  // 🎯 **Calculate Statistics**
  const stats = useMemo(() => {
    const total = procedures.length;
    const expired = procedures.filter(p => getStatusInfo(p.expiry).status === 'EXPIRED').length;
    const expiring = procedures.filter(p => getStatusInfo(p.expiry).status === 'EXPIRING').length;
    const critical = procedures.filter(p => getStatusInfo(p.expiry).status === 'CRITICAL').length;
    const highQuality = procedures.filter(p => (p.score || 0) >= 80).length;
    const avgScore = total > 0 ? Math.round(procedures.reduce((sum, p) => sum + (p.score || 0), 0) / total) : 0;
    
    return {
      total,
      expired,
      expiring,
      critical,
      active: total - expired - expiring - critical,
      highQuality,
      avgScore,
      filtered: filteredAndSortedProcedures.length
    };
  }, [procedures, filteredAndSortedProcedures]);

  // 🎯 **Modal Handlers**
  const handleProcedureClick = (procedureId) => {
    setSelectedProcedureId(procedureId);
    setShowDetailsModal(true);
  };

  const handleCloseModal = () => {
    setShowDetailsModal(false);
    setSelectedProcedureId(null);
  };

  // 🎯 **Clear All Filters**
  const clearAllFilters = () => {
    setSearchTerm('');
    setFilterLOB('');
    setFilterStatus('');
    setFilterRisk('');
    setFilterQuality('');
    setSortBy('name');
    setSortOrder('asc');
  };

  // 🎯 **Refresh Data**
  const handleRefresh = async () => {
    setLoading(true);
    try {
      await onDataRefresh();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setTimeout(() => setLoading(false), 500); // Add slight delay for smooth UX
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* 🌟 **NEXT-GEN HEADER with HSBC Branding** */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <Box sx={{ 
          background: HSBCColors.gradients.darkMatter,
          color: 'white',
          p: 4,
          borderRadius: '24px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          position: 'relative',
          overflow: 'hidden',
          mb: 4
        }}>
          {/* Animated Background Pattern */}
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'url("data:image/svg+xml,%3Csvg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="rgba(255,255,255,0.05)" fill-opacity="1" fill-rule="evenodd"%3E%3Cpath d="m0 40l40-40h-40z"/%3E%3C/g%3E%3C/svg%3E")',
            opacity: 0.1
          }} />
          
          <Grid container alignItems="center" spacing={3} sx={{ position: 'relative', zIndex: 1 }}>
            <Grid item xs={12} md={8}>
              <Stack direction="row" alignItems="center" spacing={3}>
                <HSBCHexagon size={70}>
                  <Assessment sx={{ color: 'white', fontSize: 28 }} />
                </HSBCHexagon>
                
                <Box>
                  <Typography 
                    variant="h3" 
                    fontWeight={900}
                    sx={{
                      background: 'linear-gradient(45deg, #fff 0%, #f0f0f0 100%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      fontFamily: '"Inter", "Roboto", sans-serif',
                      letterSpacing: '-0.02em'
                    }}
                  >
                    Procedures Database
                  </Typography>
                  <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 500 }}>
                    Complete procedure management with advanced analytics
                  </Typography>
                </Box>
              </Stack>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={2}>
                {/* Live Clock */}
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="h5" fontWeight={700}>
                    {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    {currentTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Typography>
                </Box>
                
                {/* Connection Status */}
                <Chip 
                  icon={sharePointAvailable ? <CheckCircle /> : <Warning />}
                  label={sharePointAvailable ? 'Live Data' : 'Demo Mode'}
                  sx={{ 
                    background: sharePointAvailable ? '#4caf50' : '#ff9800',
                    color: 'white',
                    fontWeight: 700
                  }}
                />
              </Stack>
            </Grid>
          </Grid>
        </Box>
      </motion.div>

      {/* 📊 **ENHANCED STATISTICS DASHBOARD** */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={2.4}>
            <GlassmorphismCard>
              <CardContent sx={{ p: 3, textAlign: 'center' }}>
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Typography variant="h3" fontWeight={900} color={HSBCColors.primary}>
                    {stats.total}
                  </Typography>
                </motion.div>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>
                  Total Procedures
                </Typography>
                <Chip 
                  label="Database"
                  size="small"
                  sx={{ mt: 1, backgroundColor: alpha(HSBCColors.primary, 0.1), color: HSBCColors.primary }}
                />
              </CardContent>
            </GlassmorphismCard>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2.4}>
            <GlassmorphismCard variant="success">
              <CardContent sx={{ p: 3, textAlign: 'center' }}>
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
                >
                  <Typography variant="h3" fontWeight={900} color="#4caf50">
                    {stats.active}
                  </Typography>
                </motion.div>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>
                  Active Procedures
                </Typography>
                <Chip 
                  icon={<CheckCircle />}
                  label="Current"
                  size="small"
                  sx={{ mt: 1, backgroundColor: alpha('#4caf50', 0.1), color: '#4caf50' }}
                />
              </CardContent>
            </GlassmorphismCard>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2.4}>
            <GlassmorphismCard variant="warning">
              <CardContent sx={{ p: 3, textAlign: 'center' }}>
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.4 }}
                >
                  <Typography variant="h3" fontWeight={900} color="#ff9800">
                    {stats.expiring + stats.critical}
                  </Typography>
                </motion.div>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>
                  Need Attention
                </Typography>
                <Chip 
                  icon={<Schedule />}
                  label="Expiring"
                  size="small"
                  sx={{ mt: 1, backgroundColor: alpha('#ff9800', 0.1), color: '#ff9800' }}
                />
              </CardContent>
            </GlassmorphismCard>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2.4}>
            <GlassmorphismCard variant="error">
              <CardContent sx={{ p: 3, textAlign: 'center' }}>
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
                >
                  <Typography variant="h3" fontWeight={900} color="#f44336">
                    {stats.expired}
                  </Typography>
                </motion.div>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>
                  Expired
                </Typography>
                <Chip 
                  icon={<ErrorIcon />}
                  label="Urgent"
                  size="small"
                  sx={{ mt: 1, backgroundColor: alpha('#f44336', 0.1), color: '#f44336' }}
                />
              </CardContent>
            </GlassmorphismCard>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2.4}>
            <GlassmorphismCard>
              <CardContent sx={{ p: 3, textAlign: 'center' }}>
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.8 }}
                >
                  <Typography variant="h3" fontWeight={900} color="#7b1fa2">
                    {stats.avgScore}%
                  </Typography>
                </motion.div>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>
                  Avg Quality
                </Typography>
                <Chip 
                  icon={<Star />}
                  label="Score"
                  size="small"
                  sx={{ mt: 1, backgroundColor: alpha('#7b1fa2', 0.1), color: '#7b1fa2' }}
                />
              </CardContent>
            </GlassmorphismCard>
          </Grid>
        </Grid>
      </motion.div>

      {/* 🔍 **ENHANCED SEARCH & FILTERS** */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <GlassmorphismCard sx={{ mb: 4 }}>
          <CardHeader
            avatar={
              <HSBCHexagon size={50}>
                <Search sx={{ color: 'white', fontSize: 20 }} />
              </HSBCHexagon>
            }
            title={
              <Typography variant="h5" fontWeight={800}>
                Smart Search & Filters
              </Typography>
            }
            subheader={
              <Typography variant="body2" color="text.secondary">
                {stats.filtered} of {stats.total} procedures displayed
                {searchTerm || filterLOB || filterStatus || filterRisk || filterQuality ? (
                  <Chip 
                    label="Filters Active"
                    size="small"
                    color="primary"
                    sx={{ ml: 1, fontSize: '0.7rem' }}
                  />
                ) : null}
              </Typography>
            }
            action={
              <Stack direction="row" spacing={1}>
                <ToggleButtonGroup
                  value={viewMode}
                  exclusive
                  onChange={(e, newMode) => newMode && setViewMode(newMode)}
                  size="small"
                >
                  <ToggleButton value="grid">
                    <GridView />
                  </ToggleButton>
                  <ToggleButton value="list">
                    <TableView />
                  </ToggleButton>
                </ToggleButtonGroup>
                
                <Button
                  variant="outlined"
                  startIcon={loading ? <LinearProgress sx={{ width: 20 }} /> : <Refresh />}
                  onClick={handleRefresh}
                  disabled={loading}
                  sx={{ borderRadius: '12px' }}
                >
                  {loading ? 'Refreshing...' : 'Refresh'}
                </Button>
              </Stack>
            }
          />
          
          <CardContent sx={{ pt: 0 }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={4}>
                <EnhancedSearchField
                  fullWidth
                  placeholder="Search procedures, owners, or content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search sx={{ color: HSBCColors.primary }} />
                      </InputAdornment>
                    ),
                    endAdornment: searchTerm && (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setSearchTerm('')} size="small">
                          <Clear />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={1.6}>
                <FormControl fullWidth>
                  <InputLabel>Line of Business</InputLabel>
                  <Select
                    value={filterLOB}
                    onChange={(e) => setFilterLOB(e.target.value)}
                    label="Line of Business"
                    sx={{ borderRadius: '12px' }}
                  >
                    <MenuItem value="">All LOBs</MenuItem>
                    {uniqueLOBs.map(lob => (
                      <MenuItem key={lob} value={lob}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Business sx={{ fontSize: 16 }} />
                          <Typography>{lob}</Typography>
                        </Stack>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
            </Grid>
              
              <Grid item xs={12} sm={6} md={1.6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    label="Status"
                    sx={{ borderRadius: '12px' }}
                  >
                    <MenuItem value="">All Statuses</MenuItem>
                    <MenuItem value="ACTIVE">
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <CheckCircle sx={{ fontSize: 16, color: '#4caf50' }} />
                        <Typography>Active</Typography>
                      </Stack>
                    </MenuItem>
                    <MenuItem value="EXPIRING">
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Schedule sx={{ fontSize: 16, color: '#ff9800' }} />
                        <Typography>Expiring Soon</Typography>
                      </Stack>
                    </MenuItem>
                    <MenuItem value="CRITICAL">
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <LocalFireDepartment sx={{ fontSize: 16, color: '#d32f2f' }} />
                        <Typography>Critical (≤7 days)</Typography>
                      </Stack>
                    </MenuItem>
                    <MenuItem value="EXPIRED">
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <ErrorIcon sx={{ fontSize: 16, color: '#f44336' }} />
                        <Typography>Expired</Typography>
                      </Stack>
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={1.6}>
                <FormControl fullWidth>
                  <InputLabel>Risk Level</InputLabel>
                  <Select
                    value={filterRisk}
                    onChange={(e) => setFilterRisk(e.target.value)}
                    label="Risk Level"
                    sx={{ borderRadius: '12px' }}
                  >
                    <MenuItem value="">All Risk Levels</MenuItem>
                    {uniqueRisks.map(risk => (
                      <MenuItem key={risk} value={risk}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Security sx={{ 
                            fontSize: 16, 
                            color: risk === 'High' ? '#f44336' : 
                                   risk === 'Medium' ? '#ff9800' : '#4caf50' 
                          }} />
                          <Typography>{risk}</Typography>
                        </Stack>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={1.6}>
                <FormControl fullWidth>
                  <InputLabel>Quality</InputLabel>
                  <Select
                    value={filterQuality}
                    onChange={(e) => setFilterQuality(e.target.value)}
                    label="Quality"
                    sx={{ borderRadius: '12px' }}
                  >
                    <MenuItem value="">All Quality Levels</MenuItem>
                    <MenuItem value="excellent">
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <AutoAwesome sx={{ fontSize: 16, color: '#4caf50' }} />
                        <Typography>Excellent (90%+)</Typography>
                      </Stack>
                    </MenuItem>
                    <MenuItem value="good">
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <CheckCircle sx={{ fontSize: 16, color: '#8bc34a' }} />
                        <Typography>Good (80-89%)</Typography>
                      </Stack>
                    </MenuItem>
                    <MenuItem value="fair">
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Warning sx={{ fontSize: 16, color: '#ff9800' }} />
                        <Typography>Fair (60-79%)</Typography>
                      </Stack>
                    </MenuItem>
                    <MenuItem value="poor">
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <ErrorIcon sx={{ fontSize: 16, color: '#f44336' }} />
                        <Typography>Poor (<60%)</Typography>
                      </Stack>
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={1.6}>
                <FormControl fullWidth>
                  <InputLabel>Sort By</InputLabel>
                  <Select
                    value={`${sortBy}-${sortOrder}`}
                    onChange={(e) => {
                      const [field, order] = e.target.value.split('-');
                      setSortBy(field);
                      setSortOrder(order);
                    }}
                    label="Sort By"
                    sx={{ borderRadius: '12px' }}
                  >
                    <MenuItem value="name-asc">
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Sort sx={{ fontSize: 16 }} />
                        <Typography>Name A-Z</Typography>
                      </Stack>
                    </MenuItem>
                    <MenuItem value="name-desc">Name Z-A</MenuItem>
                    <MenuItem value="expiry-asc">Expiry: Earliest First</MenuItem>
                    <MenuItem value="expiry-desc">Expiry: Latest First</MenuItem>
                    <MenuItem value="score-desc">Quality: Highest First</MenuItem>
                    <MenuItem value="score-asc">Quality: Lowest First</MenuItem>
                    <MenuItem value="owner-asc">Owner A-Z</MenuItem>
                    <MenuItem value="lob-asc">LOB A-Z</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            
            {/* Clear Filters Button */}
            {(searchTerm || filterLOB || filterStatus || filterRisk || filterQuality) && (
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Button
                  variant="outlined"
                  startIcon={<Clear />}
                  onClick={clearAllFilters}
                  sx={{ borderRadius: '12px' }}
                >
                  Clear All Filters
                </Button>
              </Box>
            )}
          </CardContent>
        </GlassmorphismCard>
      </motion.div>

      {/* 📋 **ENHANCED PROCEDURES DISPLAY** */}
      {viewMode === 'grid' ? (
        /* GRID VIEW */
        <Grid container spacing={3}>
          <AnimatePresence>
            {filteredAndSortedProcedures.map((proc, index) => {
              const statusInfo = getStatusInfo(proc.expiry, proc.score);
              const qualityInfo = getQualityInfo(proc.score || 0);
              
              return (
                <Grid item xs={12} sm={6} md={4} lg={3} key={proc.id}>
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 30, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -30, scale: 0.9 }}
                    transition={{ 
                      duration: 0.4, 
                      delay: index * 0.05,
                      type: "spring", 
                      stiffness: 100 
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <GlassmorphismCard 
                      clickable
                      sx={{ 
                        height: '100%',
                        background: statusInfo.bgColor,
                        border: `2px solid ${alpha(statusInfo.color, 0.2)}`,
                        '&:hover': {
                          borderColor: statusInfo.color
                        }
                      }}
                      onClick={() => handleProcedureClick(proc.id)}
                    >
                      {/* Card Header with Status */}
                      <Box sx={{ 
                        p: 2, 
                        background: `linear-gradient(135deg, ${statusInfo.color} 0%, ${alpha(statusInfo.color, 0.8)} 100%)`,
                        color: 'white'
                      }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <StatusChip
                            icon={statusInfo.icon}
                            label={statusInfo.status}
                            sx={{ 
                              backgroundColor: 'rgba(255,255,255,0.2)',
                              color: 'white',
                              '& .MuiChip-icon': { color: 'white' }
                            }}
                          />
                          {proc.score && (
                            <Tooltip title={`Quality Score: ${proc.score}% - ${qualityInfo.level}`}>
                              <Box sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 0.5,
                                backgroundColor: 'rgba(255,255,255,0.2)',
                                borderRadius: '12px',
                                px: 1.5,
                                py: 0.5
                              }}>
                                {React.cloneElement(qualityInfo.icon, { 
                                  sx: { fontSize: 16, color: 'white' } 
                                })}
                                <Typography variant="body2" fontWeight={800}>
                                  {proc.score}%
                                </Typography>
                              </Box>
                            </Tooltip>
                          )}
                        </Stack>
                      </Box>
                      
                      <CardContent sx={{ p: 3, flex: 1 }}>
                        {/* Procedure Name */}
                        <Typography 
                          variant="h6" 
                          fontWeight={800} 
                          gutterBottom
                          sx={{ 
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            minHeight: '3em',
                            color: statusInfo.color
                          }}
                        >
                          {proc.name}
                        </Typography>
                        
                        {/* Procedure Details */}
                        <Stack spacing={2}>
                          <Box>
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                              <Business sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="body2" color="text.secondary">
                                <strong>{proc.lob}</strong>
                              </Typography>
                            </Stack>
                            
                            {proc.procedure_subsection && (
                              <Typography variant="caption" color="text.secondary" display="block">
                                {proc.procedure_subsection}
                              </Typography>
                            )}
                          </Box>
                          
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Person sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {proc.primary_owner}
                            </Typography>
                          </Stack>
                          
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <CalendarToday sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">
                              {new Date(proc.expiry).toLocaleDateString()}
                            </Typography>
                          </Stack>
                          
                          {proc.risk_rating && (
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Security sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Chip 
                                label={proc.risk_rating}
                                size="small"
                                color={proc.risk_rating === 'High' ? 'error' : 
                                       proc.risk_rating === 'Medium' ? 'warning' : 'success'}
                                sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                              />
                            </Stack>
                          )}
                        </Stack>
                        
                        {/* Quality Progress Bar */}
                        {proc.score && (
                          <Box sx={{ mt: 3 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                              <Typography variant="body2" fontWeight={600}>
                                Quality Score
                              </Typography>
                              <Typography variant="body2" fontWeight={800} color={qualityInfo.color}>
                                {qualityInfo.level}
                              </Typography>
                            </Stack>
                            <Box sx={{
                              width: '100%',
                              height: 8,
                              bgcolor: '#e0e0e0',
                              borderRadius: 4,
                              overflow: 'hidden',
                              position: 'relative'
                            }}>
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${proc.score}%` }}
                                transition={{ duration: 1, delay: index * 0.1 }}
                                style={{
                                  height: '100%',
                                  background: `linear-gradient(90deg, ${qualityInfo.color} 0%, ${alpha(qualityInfo.color, 0.8)} 100%)`,
                                  borderRadius: 4
                                }}
                              />
                              {/* Shimmer effect */}
                              <Box sx={{
                                position: 'absolute',
                                top: 0,
                                left: '-100%',
                                width: '100%',
                                height: '100%',
                                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
                                animation: `${shimmerAnimation} 2s infinite`,
                                animationDelay: `${index * 0.1}s`
                              }} />
                            </Box>
                          </Box>
                        )}
                      </CardContent>

                      {/* Action Buttons */}
                      <Box sx={{ p: 2, pt: 0 }}>
                        <Grid container spacing={1}>
                          <Grid item xs={6}>
                            <Button
                              fullWidth
                              variant="outlined"
                              size="small"
                              startIcon={<Visibility />}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleProcedureClick(proc.id);
                              }}
                              sx={{ 
                                borderRadius: '12px',
                                borderColor: statusInfo.color,
                                color: statusInfo.color,
                                '&:hover': {
                                  borderColor: statusInfo.color,
                                  backgroundColor: alpha(statusInfo.color, 0.1)
                                }
                              }}
                            >
                              Details
                            </Button>
                          </Grid>
                          <Grid item xs={6}>
                            <Button
                              fullWidth
                              variant="outlined"
                              size="small"
                              startIcon={<GetApp />}
                              disabled={!proc.file_link}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (proc.file_link) {
                                  window.open(proc.file_link, '_blank');
                                }
                              }}
                              sx={{ 
                                borderRadius: '12px',
                                '&:not(:disabled)': {
                                  borderColor: '#2196f3',
                                  color: '#2196f3',
                                  '&:hover': {
                                    borderColor: '#2196f3',
                                    backgroundColor: alpha('#2196f3', 0.1)
                                  }
                                }
                              }}
                            >
                              Download
                            </Button>
                          </Grid>
                        </Grid>
                      </Box>
                    </GlassmorphismCard>
                  </motion.div>
                </Grid>
              );
            })}
          </AnimatePresence>
        </Grid>
      ) : (
        /* LIST VIEW */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <GlassmorphismCard>
            <CardContent sx={{ p: 0 }}>
              {filteredAndSortedProcedures.map((proc, index) => {
                const statusInfo = getStatusInfo(proc.expiry, proc.score);
                const qualityInfo = getQualityInfo(proc.score || 0);
                
                return (
                  <motion.div
                    key={proc.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Box
                      sx={{
                        p: 3,
                        borderBottom: index < filteredAndSortedProcedures.length - 1 ? '1px solid #e0e0e0' : 'none',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          backgroundColor: alpha(statusInfo.color, 0.05),
                          transform: 'translateX(8px)'
                        }
                      }}
                      onClick={() => handleProcedureClick(proc.id)}
                    >
                      <Grid container alignItems="center" spacing={2}>
                        <Grid item xs={12} sm={4}>
                          <Stack direction="row" alignItems="center" spacing={2}>
                            <Avatar sx={{ 
                              background: statusInfo.color,
                              width: 40,
                              height: 40
                            }}>
                              {statusInfo.icon}
                            </Avatar>
                            <Box>
                              <Typography variant="h6" fontWeight={700} noWrap>
                                {proc.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {proc.lob} • {proc.primary_owner}
                              </Typography>
                            </Box>
                          </Stack>
                        </Grid>
                        
                        <Grid item xs={6} sm={2}>
                          <StatusChip
                            icon={statusInfo.icon}
                            label={statusInfo.text}
                            severity={statusInfo.severity}
                            sx={{ 
                              backgroundColor: statusInfo.color,
                              color: 'white'
                            }}
                          />
                        </Grid>
                        
                        <Grid item xs={6} sm={2}>
                          <Typography variant="body2" color="text.secondary">
                            {new Date(proc.expiry).toLocaleDateString()}
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={6} sm={2}>
                          {proc.score && (
                            <Stack direction="row" alignItems="center" spacing={1}>
                              {React.cloneElement(qualityInfo.icon, { 
                                sx: { fontSize: 16, color: qualityInfo.color } 
                              })}
                              <Typography variant="body2" fontWeight={700}>
                                {proc.score}%
                              </Typography>
                            </Stack>
                          )}
                        </Grid>
                        
                        <Grid item xs={6} sm={2}>
                          <Stack direction="row" spacing={1}>
                            <IconButton 
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleProcedureClick(proc.id);
                              }}
                              sx={{ 
                                color: statusInfo.color,
                                '&:hover': { backgroundColor: alpha(statusInfo.color, 0.1) }
                              }}
                            >
                              <Visibility />
                            </IconButton>
                            <IconButton 
                              size="small"
                              disabled={!proc.file_link}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (proc.file_link) {
                                  window.open(proc.file_link, '_blank');
                                }
                              }}
                              sx={{ 
                                color: '#2196f3',
                                '&:hover': { backgroundColor: alpha('#2196f3', 0.1) }
                              }}
                            >
                              <GetApp />
                            </IconButton>
                          </Stack>
                        </Grid>
                      </Grid>
                    </Box>
                  </motion.div>
                );
              })}
            </CardContent>
          </GlassmorphismCard>
        </motion.div>
      )}
      
      {/* 🚫 **NO RESULTS STATE** */}
      {filteredAndSortedProcedures.length === 0 && procedures.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <GlassmorphismCard sx={{ textAlign: 'center', py: 8 }}>
            <CardContent>
              <motion.div
                animate={{ 
                  y: [0, -10, 0],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <Search sx={{ fontSize: 100, color: 'text.disabled', mb: 3 }} />
              </motion.div>
              <Typography variant="h4" fontWeight={800} gutterBottom>
                No Procedures Found
              </Typography>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No procedures match your current search and filter criteria
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
                Try adjusting your search terms, changing the filters, or clearing all filters to see more results.
              </Typography>
              <Stack direction="row" spacing={2} justifyContent="center">
                <Button 
                  variant="contained" 
                  onClick={clearAllFilters}
                  startIcon={<Clear />}
                  sx={{
                    background: HSBCColors.gradients.redPrimary,
                    borderRadius: '12px',
                    px: 4,
                    py: 1.5,
                    fontWeight: 700
                  }}
                >
                  Clear All Filters
                </Button>
                <Button 
                  variant="outlined" 
                  onClick={handleRefresh}
                  startIcon={<Refresh />}
                  sx={{ borderRadius: '12px', px: 4, py: 1.5, fontWeight: 700 }}
                >
                  Refresh Data
                </Button>
              </Stack>
            </CardContent>
          </GlassmorphismCard>
        </motion.div>
      )}

      {/* 📭 **EMPTY STATE** */}
      {procedures.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <GlassmorphismCard sx={{ textAlign: 'center', py: 10 }}>
            <CardContent>
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <Business sx={{ fontSize: 120, color: 'text.disabled', mb: 3 }} />
              </motion.div>
              <Typography variant="h3" fontWeight={900} gutterBottom>
                No Procedures Yet
              </Typography>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                The procedures database is empty
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
                Procedures will appear here once they are uploaded through the admin panel. 
                Get started by uploading your first procedure!
              </Typography>
              {user?.role === 'admin' && (
                <Button 
                  variant="contained" 
                  onClick={() => navigate('admin-panel')}
                  startIcon={<CloudUpload />}
                  size="large"
                  sx={{
                    background: HSBCColors.gradients.redPrimary,
                    borderRadius: '12px',
                    px: 6,
                    py: 2,
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    boxShadow: `0 8px 32px ${alpha(HSBCColors.primary, 0.3)}`
                  }}
                >
                  Upload First Procedure
                </Button>
              )}
            </CardContent>
          </GlassmorphismCard>
        </motion.div>
      )}

      {/* 🎯 **PROCEDURE DETAILS MODAL** */}
      <ProcedureDetailsModal
        open={showDetailsModal}
        onClose={handleCloseModal}
        procedureId={selectedProcedureId}
        sharePointAvailable={sharePointAvailable}
      />

      {/* 🚀 **FLOATING ACTION BUTTONS** */}
      <AnimatePresence>
        {filteredAndSortedProcedures.length > 0 && (
          <>
            {/* Scroll to Top */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ type: "spring", stiffness: 200, delay: 1 }}
              style={{
                position: 'fixed',
                bottom: 24,
                right: 24,
                zIndex: 1000
              }}
            >
              <Fab
                color="primary"
                size="medium"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                sx={{
                  background: HSBCColors.gradients.redPrimary,
                  boxShadow: `0 8px 32px ${alpha(HSBCColors.primary, 0.4)}`,
                  '&:hover': {
                    transform: 'scale(1.1)',
                    boxShadow: `0 12px 40px ${alpha(HSBCColors.primary, 0.5)}`
                  }
                }}
              >
                <TrendingUp />
              </Fab>
            </motion.div>

            {/* Export/Share FAB */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ type: "spring", stiffness: 200, delay: 1.2 }}
              style={{
                position: 'fixed',
                bottom: 88,
                right: 24,
                zIndex: 1000
              }}
            >
              <Tooltip title="Export Filtered Results" placement="left">
                <Fab
                  color="secondary"
                  size="small"
                  onClick={() => {
                    // Export functionality can be added here
                    console.log('Exporting filtered procedures:', filteredAndSortedProcedures);
                  }}
                  sx={{
                    background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
                    boxShadow: '0 6px 24px rgba(33,150,243,0.4)',
                    '&:hover': {
                      transform: 'scale(1.1)',
                      boxShadow: '0 8px 32px rgba(33,150,243,0.5)'
                    }
                  }}
                >
                  <Share />
                </Fab>
              </Tooltip>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 📊 **LOADING OVERLAY** */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              backdropFilter: 'blur(10px)'
            }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <HSBCHexagon size={100}>
                <Refresh sx={{ color: 'white', fontSize: 40 }} />
              </HSBCHexagon>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Container>
  );
};

export default ProceduresPage;
