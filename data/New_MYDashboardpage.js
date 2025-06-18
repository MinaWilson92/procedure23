// pages/MyDashboardPage.js - Enhanced User Dashboard with Amendment Capabilities
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Button, Chip, 
  Avatar, Stack, Paper, LinearProgress, Alert, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Tooltip, Badge, alpha, useTheme, styled, keyframes, Container
} from '@mui/material';
import {
  Person, CloudUpload, Edit, Schedule, CheckCircle, Warning,
  Error as ErrorIcon, Visibility, Download, TrendingUp, Assessment,
  AutoAwesome, History, Notifications, AdminPanelSettings,
  Description, Star, Timeline, BarChart, LocalFireDepartment
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigation } from '../contexts/NavigationContext';
import { useSharePoint } from '../SharePointContext';
import ProcedureAmendModal from '../components/ProcedureAmendModal';
import ProcedureDetailsModal from '../components/ProcedureDetailsModal';

// 🎨 **HSBC Brand Colors**
const HSBCColors = {
  primary: '#DB0011',
  secondary: '#9FA1A4',
  gradients: {
    redPrimary: 'linear-gradient(135deg, #DB0011 0%, #B50010 50%, #8B000C 100%)',
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
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
`;

// 🎨 **Styled Components**
const GlassmorphismCard = styled(Card)(({ theme, variant = 'default' }) => ({
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
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: variant === 'primary' 
      ? '0 30px 80px rgba(219,0,17,0.4), inset 0 1px 0 rgba(255,255,255,0.3)'
      : '0 30px 80px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.9)'
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

const MyDashboardPage = ({ 
  procedures, 
  user, 
  isAdmin, 
  isUploader, 
  sharePointAvailable, 
  onDataRefresh 
}) => {
  const { navigate } = useNavigation();
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [userProcedures, setUserProcedures] = useState([]);
  const [selectedProcedure, setSelectedProcedure] = useState(null);
  const [amendModalOpen, setAmendModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // 🕒 **Real-time Clock**
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 🎯 **Filter User's Procedures**
  useEffect(() => {
    if (procedures && user) {
      const filtered = procedures.filter(proc => 
        proc.uploaded_by === user.staffId || 
        proc.uploaded_by === user.displayName ||
        proc.uploaded_by_user_id === user.staffId
      );
      
      // Sort by upload date (newest first)
      const sorted = filtered.sort((a, b) => 
        new Date(b.uploaded_on || b.last_modified_on) - new Date(a.uploaded_on || a.last_modified_on)
      );
      
      setUserProcedures(sorted);
      console.log('📊 User procedures filtered:', sorted.length);
    }
  }, [procedures, user]);

  // 📊 **Calculate User Statistics**
  const calculateUserStats = () => {
    if (!userProcedures.length) {
      return {
        total: 0,
        expired: 0,
        expiringSoon: 0,
        highQuality: 0,
        averageScore: 0,
        recentUploads: 0
      };
    }

    const now = new Date();
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return {
      total: userProcedures.length,
      expired: userProcedures.filter(p => new Date(p.expiry) < now).length,
      expiringSoon: userProcedures.filter(p => {
        const expiry = new Date(p.expiry);
        const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
        return daysLeft > 0 && daysLeft <= 30;
      }).length,
      highQuality: userProcedures.filter(p => (p.score || 0) >= 80).length,
      averageScore: userProcedures.length > 0 ? 
        Math.round(userProcedures.reduce((sum, p) => sum + (p.score || 0), 0) / userProcedures.length) : 0,
      recentUploads: userProcedures.filter(p => 
        new Date(p.uploaded_on || p.last_modified_on) > oneMonthAgo
      ).length
    };
  };

  const userStats = calculateUserStats();

  // 🎯 **Helper Functions**
  const getQualityColor = (score) => {
    if (score >= 90) return '#4caf50';
    if (score >= 80) return '#8bc34a';
    if (score >= 70) return '#ff9800';
    if (score >= 60) return '#f44336';
    return '#d32f2f';
  };

  const getQualityInfo = (score) => {
    if (score >= 90) return { level: 'Excellent', color: '#4caf50', icon: <AutoAwesome /> };
    if (score >= 80) return { level: 'Good', color: '#8bc34a', icon: <CheckCircle /> };
    if (score >= 70) return { level: 'Fair', color: '#ff9800', icon: <Warning /> };
    if (score >= 60) return { level: 'Poor', color: '#f44336', icon: <ErrorIcon /> };
    return { level: 'Critical', color: '#d32f2f', icon: <LocalFireDepartment /> };
  };

  const getDaysUntilExpiry = (expiryDate) => {
    if (!expiryDate) return null;
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExpiryStatus = (daysLeft) => {
    if (daysLeft < 0) {
      return { status: 'EXPIRED', color: '#f44336', icon: <ErrorIcon />, text: `EXPIRED (${Math.abs(daysLeft)} days ago)` };
    } else if (daysLeft <= 7) {
      return { status: 'CRITICAL', color: '#d32f2f', icon: <LocalFireDepartment />, text: `URGENT: ${daysLeft} days left` };
    } else if (daysLeft <= 30) {
      return { status: 'EXPIRING', color: '#ff9800', icon: <Schedule />, text: `${daysLeft} days left` };
    } else {
      return { status: 'ACTIVE', color: '#4caf50', icon: <CheckCircle />, text: `${daysLeft} days left` };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // 🎯 **Event Handlers**
  const handleAmendProcedure = (procedure) => {
    setSelectedProcedure(procedure);
    setAmendModalOpen(true);
  };

  const handleViewDetails = (procedure) => {
    setSelectedProcedure(procedure);
    setDetailsModalOpen(true);
  };

  const handleAmendSuccess = () => {
    setAmendModalOpen(false);
    setSelectedProcedure(null);
    if (onDataRefresh) {
      onDataRefresh();
    }
  };

  // ✅ **Check Access Permissions**
  if (!isAdmin && !isUploader) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <GlassmorphismCard variant="error">
            <CardContent sx={{ p: 6, textAlign: 'center' }}>
              <ErrorIcon sx={{ fontSize: 80, color: '#f44336', mb: 2 }} />
              <Typography variant="h4" fontWeight={800} gutterBottom>
                Access Denied
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                This dashboard is only available for uploaders and administrators.
              </Typography>
              <Button 
                variant="contained"
                onClick={() => navigate('home')}
                sx={{
                  background: HSBCColors.gradients.redPrimary,
                  borderRadius: '12px',
                  px: 4,
                  py: 1.5,
                  fontWeight: 700
                }}
              >
                Return to Home
              </Button>
            </CardContent>
          </GlassmorphismCard>
        </motion.div>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* 🌟 **ENHANCED HEADER** */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          mb: 4
        }}>
          <Stack direction="row" alignItems="center" spacing={3}>
            <HSBCHexagon size={80}>
              <Person sx={{ color: 'white', fontSize: 32 }} />
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
                My Dashboard
              </Typography>
              <Typography variant="h6" color="text.secondary" fontWeight={500}>
                Manage your uploaded procedures and track performance
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" alignItems="center" spacing={2}>
            {/* Live Clock */}
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="h4" fontWeight={700} color={HSBCColors.primary}>
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {currentTime.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </Typography>
            </Box>

            <Chip 
              avatar={<Avatar sx={{ bgcolor: HSBCColors.primary }}>{user?.displayName?.[0] || 'U'}</Avatar>}
              label={user?.displayName || user?.staffId}
              sx={{ 
                background: HSBCColors.gradients.modernGlass,
                color: 'text.primary',
                border: `1px solid ${alpha(HSBCColors.primary, 0.2)}`,
                fontWeight: 700,
                fontSize: '1rem',
                height: 48,
                px: 2
              }}
            />
          </Stack>
        </Box>
      </motion.div>

      {/* 📊 **USER STATISTICS CARDS** */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <GlassmorphismCard>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="h2" fontWeight={900} color={HSBCColors.primary} sx={{ mb: 1 }}>
                  {userStats.total}
                </Typography>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>
                  Total Procedures
                </Typography>
                <Description sx={{ fontSize: 40, color: HSBCColors.primary, mt: 1, opacity: 0.7 }} />
              </CardContent>
            </GlassmorphismCard>
          </motion.div>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <GlassmorphismCard variant={userStats.averageScore >= 80 ? 'success' : 'warning'}>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="h2" fontWeight={900} color={getQualityColor(userStats.averageScore)} sx={{ mb: 1 }}>
                  {userStats.averageScore}%
                </Typography>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>
                  Average Quality
                </Typography>
                <Assessment sx={{ fontSize: 40, color: getQualityColor(userStats.averageScore), mt: 1, opacity: 0.7 }} />
              </CardContent>
            </GlassmorphismCard>
          </motion.div>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <GlassmorphismCard variant={userStats.expiringSoon > 0 ? 'warning' : 'success'}>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Badge badgeContent={userStats.expiringSoon} color="warning" invisible={userStats.expiringSoon === 0}>
                  <Typography variant="h2" fontWeight={900} color={userStats.expiringSoon > 0 ? '#ff9800' : '#4caf50'} sx={{ mb: 1 }}>
                    {userStats.expiringSoon}
                  </Typography>
                </Badge>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>
                  Expiring Soon
                </Typography>
                <Schedule sx={{ fontSize: 40, color: userStats.expiringSoon > 0 ? '#ff9800' : '#4caf50', mt: 1, opacity: 0.7 }} />
              </CardContent>
            </GlassmorphismCard>
          </motion.div>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <GlassmorphismCard variant={userStats.expired > 0 ? 'error' : 'success'}>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Badge badgeContent={userStats.expired} color="error" invisible={userStats.expired === 0}>
                  <Typography variant="h2" fontWeight={900} color={userStats.expired > 0 ? '#f44336' : '#4caf50'} sx={{ mb: 1 }}>
                    {userStats.expired}
                  </Typography>
                </Badge>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>
                  Expired
                </Typography>
                <ErrorIcon sx={{ fontSize: 40, color: userStats.expired > 0 ? '#f44336' : '#4caf50', mt: 1, opacity: 0.7 }} />
              </CardContent>
            </GlassmorphismCard>
          </motion.div>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <GlassmorphismCard>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="h2" fontWeight={900} color="#2196f3" sx={{ mb: 1 }}>
                  {userStats.highQuality}
                </Typography>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>
                  High Quality
                </Typography>
                <Star sx={{ fontSize: 40, color: '#2196f3', mt: 1, opacity: 0.7 }} />
              </CardContent>
            </GlassmorphismCard>
          </motion.div>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <GlassmorphismCard>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="h2" fontWeight={900} color="#9c27b0" sx={{ mb: 1 }}>
                  {userStats.recentUploads}
                </Typography>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>
                  Recent (30d)
                </Typography>
                <TrendingUp sx={{ fontSize: 40, color: '#9c27b0', mt: 1, opacity: 0.7 }} />
              </CardContent>
            </GlassmorphismCard>
          </motion.div>
        </Grid>
      </Grid>

      {/* 📋 **MY PROCEDURES TABLE** */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
      >
        <GlassmorphismCard>
          <CardContent sx={{ p: 0 }}>
            {/* Table Header */}
            <Box sx={{ 
              p: 4, 
              background: HSBCColors.gradients.darkMatter,
              color: 'white',
              borderRadius: '24px 24px 0 0'
            }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h5" fontWeight={800}>
                    My Uploaded Procedures
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Manage and amend your procedure documents
                  </Typography>
                </Box>
                
                <Stack direction="row" spacing={2}>
                  <Chip 
                    label={`${userProcedures.length} procedures`}
                    sx={{ 
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      fontWeight: 700
                    }}
                  />
                  <Button
                    variant="contained"
                    startIcon={<CloudUpload />}
                    onClick={() => navigate('admin-panel')}
                    sx={{
                      background: 'linear-gradient(135deg, #fff 0%, #f0f0f0 100%)',
                      color: HSBCColors.primary,
                      borderRadius: '12px',
                      fontWeight: 700,
                      '&:hover': {
                        background: 'linear-gradient(135deg, #f0f0f0 0%, #e0e0e0 100%)'
                      }
                    }}
                  >
                    Upload New
                  </Button>
                </Stack>
              </Stack>
            </Box>

            {/* Table Content */}
            {userProcedures.length === 0 ? (
              <Box sx={{ p: 6, textAlign: 'center' }}>
                <Description sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h5" color="text.secondary" gutterBottom>
                  No Procedures Found
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  You haven't uploaded any procedures yet. Start by uploading your first document.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<CloudUpload />}
                  onClick={() => navigate('admin-panel')}
                  sx={{
                    background: HSBCColors.gradients.redPrimary,
                    borderRadius: '12px',
                    px: 4,
                    py: 1.5,
                    fontWeight: 700
                  }}
                >
                  Upload First Procedure
                </Button>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ '& th': { fontWeight: 800, fontSize: '0.875rem', py: 2 } }}>
                      <TableCell>Procedure Details</TableCell>
                      <TableCell align="center">Quality Score</TableCell>
                      <TableCell align="center">Status</TableCell>
                      <TableCell align="center">Last Modified</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {userProcedures.map((procedure, index) => {
                      const qualityInfo = getQualityInfo(procedure.score || 0);
                      const daysLeft = getDaysUntilExpiry(procedure.expiry);
                      const expiryStatus = daysLeft !== null ? getExpiryStatus(daysLeft) : null;
                      
                      return (
                        <motion.tr
                          key={procedure.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          component={TableRow}
                          sx={{
                            '&:hover': {
                              backgroundColor: alpha(HSBCColors.primary, 0.05),
                              transform: 'scale(1.01)',
                              transition: 'all 0.3s ease'
                            }
                          }}
                        >
                          <TableCell>
                            <Stack spacing={1}>
                              <Typography variant="h6" fontWeight={700} sx={{ fontSize: '1rem' }}>
                                {procedure.name}
                              </Typography>
                              <Stack direction="row" spacing={1}>
                                <Chip 
                                  label={procedure.lob}
                                  size="small"
                                  color="primary"
                                  variant="outlined"
                                  sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                                />
                                {procedure.procedure_subsection && (
                                  <Chip 
                                    label={procedure.procedure_subsection}
                                    size="small"
                                    color="default"
                                    variant="outlined"
                                    sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                                  />
                                )}
                              </Stack>
                              <Typography variant="caption" color="text.secondary">
                                Uploaded: {formatDate(procedure.uploaded_on)}
                              </Typography>
                            </Stack>
                          </TableCell>
                          
                          <TableCell align="center">
                            <Stack alignItems="center" spacing={1}>
                              <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={procedure.score || 0}
                                  sx={{
                                    height: 8,
                                    borderRadius: 4,
                                    width: 60,
                                    backgroundColor: alpha(qualityInfo.color, 0.2),
                                    '& .MuiLinearProgress-bar': {
                                      backgroundColor: qualityInfo.color,
                                      borderRadius: 4
                                    }
                                  }}
                                />
                              </Box>
                              <Typography variant="body2" fontWeight={700} sx={{ color: qualityInfo.color }}>
                                {procedure.score || 0}%
                              </Typography>
                              <Chip 
                                icon={qualityInfo.icon}
                                label={qualityInfo.level}
                                size="small"
                                sx={{ 
                                  backgroundColor: alpha(qualityInfo.color, 0.1),
                                  color: qualityInfo.color,
                                  fontWeight: 700,
                                  fontSize: '0.7rem'
                                }}
                              />
                            </Stack>
                          </TableCell>
                          
                          <TableCell align="center">
                            <Stack alignItems="center" spacing={1}>
                              {expiryStatus && (
                                <Chip 
                                  icon={expiryStatus.icon}
                                  label={expiryStatus.status}
                                  size="small"
                                  sx={{ 
                                    backgroundColor: expiryStatus.color,
                                    color: 'white',
                                    fontWeight: 700,
                                    fontSize: '0.7rem'
                                  }}
                                />
                              )}
                              <Typography variant="caption" color="text.secondary">
                                Expires: {formatDate(procedure.expiry)}
                              </Typography>
                              {daysLeft !== null && (
                                <Typography variant="caption" sx={{ color: expiryStatus?.color, fontWeight: 600 }}>
                                  {expiryStatus?.text}
                                </Typography>
                              )}
                            </Stack>
                          </TableCell>
                          
                          <TableCell align="center">
                            <Stack alignItems="center" spacing={1}>
                                                          <Typography variant="body2" fontWeight={600}>
                                {formatDate(procedure.last_modified_on || procedure.uploaded_on)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                by {procedure.last_modified_by || procedure.uploaded_by || 'System'}
                              </Typography>
                              {procedure.amendment_summary && (
                                <Chip 
                                  label="Amended"
                                  size="small"
                                  color="info"
                                  icon={<History />}
                                  sx={{ fontWeight: 600, fontSize: '0.65rem' }}
                                />
                              )}
                            </Stack>
                          </TableCell>
                          
                          <TableCell align="center">
                            <Stack direction="row" spacing={1} justifyContent="center">
                              <Tooltip title="View Details">
                                <IconButton
                                  size="small"
                                  onClick={() => handleViewDetails(procedure)}
                                  sx={{
                                    backgroundColor: alpha('#2196f3', 0.1),
                                    color: '#2196f3',
                                    '&:hover': {
                                      backgroundColor: alpha('#2196f3', 0.2),
                                      transform: 'scale(1.1)'
                                    }
                                  }}
                                >
                                  <Visibility fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              
                              <Tooltip title="Amend Procedure">
                                <IconButton
                                  size="small"
                                  onClick={() => handleAmendProcedure(procedure)}
                                  sx={{
                                    backgroundColor: alpha(HSBCColors.primary, 0.1),
                                    color: HSBCColors.primary,
                                    '&:hover': {
                                      backgroundColor: alpha(HSBCColors.primary, 0.2),
                                      transform: 'scale(1.1)'
                                    }
                                  }}
                                >
                                  <Edit fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              
                              {procedure.file_link && (
                                <Tooltip title="Download Document">
                                  <IconButton
                                    size="small"
                                    component="a"
                                    href={procedure.file_link}
                                    target="_blank"
                                    sx={{
                                      backgroundColor: alpha('#4caf50', 0.1),
                                      color: '#4caf50',
                                      '&:hover': {
                                        backgroundColor: alpha('#4caf50', 0.2),
                                        transform: 'scale(1.1)'
                                      }
                                    }}
                                  >
                                    <Download fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Stack>
                          </TableCell>
                        </motion.tr>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </GlassmorphismCard>
      </motion.div>

      {/* 🔄 **MODALS** */}
      <AnimatePresence>
        {amendModalOpen && selectedProcedure && (
          <ProcedureAmendModal
            open={amendModalOpen}
            onClose={() => {
              setAmendModalOpen(false);
              setSelectedProcedure(null);
            }}
            procedure={selectedProcedure}
            user={user}
            sharePointAvailable={sharePointAvailable}
            onSuccess={handleAmendSuccess}
          />
        )}
        
        {detailsModalOpen && selectedProcedure && (
          <ProcedureDetailsModal
            open={detailsModalOpen}
            onClose={() => {
              setDetailsModalOpen(false);
              setSelectedProcedure(null);
            }}
            procedureId={selectedProcedure.id}
            sharePointAvailable={sharePointAvailable}
            user={user}
          />
        )}
      </AnimatePresence>
    </Container>
  );
};

export default MyDashboardPage;
