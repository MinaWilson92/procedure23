// pages/HomePage.js - Fixed to use only props data (no direct SharePoint calls)
import React from 'react';
import {
  Box, Typography, Alert, Grid, Card, CardContent,
  Paper, alpha, LinearProgress, Badge, Chip, Avatar
} from '@mui/material';
import {
  Dashboard, Schedule, TrendingUp, Error as ErrorIcon,
  Folder, Person, CloudUpload, Warning, CheckCircle,
  Business, Assessment, Star, Timeline, BarChart,
  PieChart, Security, CalendarToday, AdminPanelSettings
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useNavigation } from '../contexts/NavigationContext';

const HomePage = ({ user, dashboardData, procedures, isAdmin, isUploader, sharePointAvailable }) => {
  const { navigate } = useNavigation();

  // Your actual LOB configuration
  const lobConfig = {
    'IWPB': {
      name: 'International Wealth and Premier Banking',
      color: '#1976d2',
      icon: '🏦'
    },
    'CIB': {
      name: 'Commercial and Institutional Banking', 
      color: '#388e3c',
      icon: '🏢'
    },
    'GCOO': {
      name: 'Group Chief Operating Officer',
      color: '#f57c00',
      icon: '⚙️'
    }
  };

  // Risk Rating Configuration
  const riskConfig = {
    'High': { color: '#f44336', label: 'High Risk' },
    'Medium': { color: '#ff9800', label: 'Medium Risk' },
    'Low': { color: '#4caf50', label: 'Low Risk' },
    'Critical': { color: '#d32f2f', label: 'Critical Risk' }
  };

  // Annual Review Configuration
  const reviewConfig = {
    'Annual': { color: '#2196f3', label: 'Annual Review' },
    'Semi-Annual': { color: '#9c27b0', label: 'Semi-Annual Review' },
    'Quarterly': { color: '#ff5722', label: 'Quarterly Review' },
    'Monthly': { color: '#607d8b', label: 'Monthly Review' },
    'Bi-Annual': { color: '#795548', label: 'Bi-Annual Review' }
  };

  // 🎯 **FIXED: Calculate data from props only (no API calls)**
  const calculateRiskData = () => {
    if (!procedures || procedures.length === 0) {
      return [];
    }

    const riskStats = {};
    
    procedures.forEach(proc => {
      const risk = proc.risk_rating || 'Unknown';
      if (!riskStats[risk]) {
        riskStats[risk] = 0;
      }
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

  const calculateReviewData = () => {
    if (!procedures || procedures.length === 0) {
      return [];
    }

    const reviewStats = {};
    
    procedures.forEach(proc => {
      const review = proc.periodic_review || 'Not Set';
      if (!reviewStats[review]) {
        reviewStats[review] = 0;
      }
      reviewStats[review]++;
    });

    return Object.entries(reviewStats).map(([review, count]) => ({
      name: review,
      count: count,
      label: reviewConfig[review]?.label || review,
      color: reviewConfig[review]?.color || '#9e9e9e',
      percentage: Math.round((count / procedures.length) * 100)
    }));
  };

  const calculateLOBData = () => {
    if (!procedures || procedures.length === 0) {
      return {};
    }

    const lobStats = {};
    
    procedures.forEach(proc => {
      const lob = proc.lob;
      if (lob && lobConfig[lob]) {
        if (!lobStats[lob]) {
          lobStats[lob] = {
            count: 0,
            totalScore: 0,
            expired: 0,
            expiringSoon: 0,
            procedures: []
          };
        }
        
        lobStats[lob].count++;
        lobStats[lob].totalScore += proc.score || 0;
        lobStats[lob].procedures.push(proc);
        
        // Check expiry status
        const expiry = new Date(proc.expiry);
        const now = new Date();
        const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
        
        if (daysLeft < 0) {
          lobStats[lob].expired++;
        } else if (daysLeft <= 30) {
          lobStats[lob].expiringSoon++;
        }
      }
    });

    // Calculate averages
    Object.keys(lobStats).forEach(lob => {
      lobStats[lob].avgScore = lobStats[lob].count > 0 ? 
        Math.round(lobStats[lob].totalScore / lobStats[lob].count) : 0;
    });

    return lobStats;
  };

  // 🎯 **FIXED: All calculations from passed props data**
  const realLOBData = calculateLOBData();
  const riskData = calculateRiskData();
  const reviewData = calculateReviewData();
  const hasRealData = Object.keys(realLOBData).length > 0;

  // Stats from dashboardData or calculated from procedures
  const stats = dashboardData?.stats || {
    total: procedures?.length || 0,
    expiringSoon: procedures?.filter(p => {
      const expiry = new Date(p.expiry);
      const now = new Date();
      const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
      return daysLeft > 0 && daysLeft <= 30;
    }).length || 0,
    expired: procedures?.filter(p => new Date(p.expiry) < new Date()).length || 0,
    highQuality: procedures?.filter(p => (p.score || 0) >= 80).length || 0
  };

  // 🎯 **FIXED: Role-based Quick Links - corrected logic**
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

// Add My Dashboard link for uploaders/admins
if (isAdmin || isUploader) {
  quickLinks.unshift({ 
    title: 'My Dashboard', 
    path: 'my-dashboard', 
    icon: <ManageAccounts />, 
    color: '#4caf50',
    description: 'Manage my procedures',
    count: procedures?.filter(p => 
      p.uploaded_by === user?.staffId || 
      p.uploaded_by === user?.displayName ||
      p.uploaded_by_user_id === user?.staffId
    ).length || 0,
    showFor: 'uploader'
  });
}

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Box
          sx={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            padding: 2,
            border: '1px solid #ccc',
            borderRadius: 1,
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
          }}
        >
          <Typography variant="body2" fontWeight="bold">
            {data.label || data.name}
          </Typography>
          <Typography variant="body2" color="primary">
            Count: {data.value || data.count}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {data.percentage}% of total
          </Typography>
        </Box>
      );
    }
    return null;
  };

  return (
    <Box>
      {/* 🎯 **FIXED: HBEG Branding** */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          HBEG Procedures Hub
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Centralized procedure management with AI-powered quality analysis
        </Typography>
      </Box>

      {/* SharePoint Status & User Welcome */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          {user && (
            <Alert severity="success" sx={{ mb: 0 }}>
              Welcome back, <strong>{user.displayName || user.staffId}</strong>! 
              You are logged in as <strong>{user.role}</strong>
              {(isAdmin || isUploader) && (
                <Chip 
                  label={isAdmin ? 'Admin Access' : 'Uploader Access'} 
                  size="small" 
                  color={isAdmin ? 'error' : 'warning'}
                  sx={{ ml: 1, fontSize: '0.7rem' }}
                />
              )}
              {user.source && (
                <Typography variant="caption" display="block" sx={{ mt: 0.5, opacity: 0.8 }}>
                  Authenticated via: {user.source}
                </Typography>
              )}
            </Alert>
          )}
        </Grid>
        <Grid item xs={12} md={4}>
          <Alert 
            severity={sharePointAvailable ? "success" : "info"} 
            sx={{ mb: 0 }}
            icon={sharePointAvailable ? <CheckCircle /> : <Warning />}
          >
            <Typography variant="body2" fontWeight="bold">
              {sharePointAvailable ? 'SharePoint Connected' : 'Demo Mode'}
            </Typography>
            <Typography variant="caption">
              {sharePointAvailable ? 
                `${stats.total} procedures loaded from SharePoint` : 
                'Using sample data for demonstration'
              }
            </Typography>
          </Alert>
        </Grid>
      </Grid>

      {/* Enhanced Stats Cards - Only 2 Clickable */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* CLICKABLE: Total Procedures Card */}
        <Grid item xs={12} sm={6} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card sx={{ 
              height: '100%', 
              background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)', 
              color: 'white',
              boxShadow: '0 8px 32px rgba(25,118,210,0.3)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              border: '2px solid transparent',
              '&:hover': {
                border: '2px solid rgba(255,255,255,0.3)',
                transform: 'translateY(-6px)', 
                boxShadow: '0 12px 40px rgba(25,118,210,0.4)'
              }
            }}
            onClick={() => navigate('procedures', { filter: 'all' })}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography color="rgba(255,255,255,0.8)" variant="body2" gutterBottom>
                      Total Procedures
                    </Typography>
                    <Typography variant="h2" fontWeight="bold" sx={{ mb: 1 }}>
                      {stats.total}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TrendingUp sx={{ fontSize: 16 }} />
                      <Typography variant="caption">
                        Click to view all procedures
                      </Typography>
                    </Box>
                  </Box>
                  <Dashboard sx={{ fontSize: 50, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* CLICKABLE: Need Attention Card */}
        <Grid item xs={12} sm={6} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card sx={{ 
              height: '100%', 
              background: stats.expiringSoon > 0 ? 
                'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)' :
                'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)', 
              color: 'white',
              boxShadow: `0 8px 32px ${stats.expiringSoon > 0 ? 'rgba(255,152,0,0.3)' : 'rgba(76,175,80,0.3)'}`,
              cursor: stats.expiringSoon > 0 ? 'pointer' : 'default',
              transition: 'all 0.3s ease',
              border: '2px solid transparent',
              '&:hover': stats.expiringSoon > 0 ? {
                border: '2px solid rgba(255,255,255,0.3)',
                transform: 'translateY(-6px)',
                boxShadow: '0 12px 40px rgba(255,152,0,0.4)'
              } : {}
            }}
            onClick={() => stats.expiringSoon > 0 && navigate('procedures', { filter: 'expiring' })}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography color="rgba(255,255,255,0.8)" variant="body2" gutterBottom>
                      {stats.expiringSoon > 0 ? 'Need Attention' : 'All Current'}
                    </Typography>
                    <Typography variant="h2" fontWeight="bold" sx={{ mb: 1 }}>
                      {stats.expiringSoon}
                    </Typography>
                    <Typography variant="caption">
                      {stats.expiringSoon > 0 ? 
                        'Click to view expiring procedures' : 
                        'No urgent actions needed'
                      }
                    </Typography>
                  </Box>
                  <Badge 
                    badgeContent={stats.expiringSoon} 
                    color="error"
                    invisible={stats.expiringSoon === 0}
                  >
                    {stats.expiringSoon > 0 ? 
                      <Schedule sx={{ fontSize: 50, opacity: 0.3 }} /> :
                      <CheckCircle sx={{ fontSize: 50, opacity: 0.3 }} />
                    }
                  </Badge>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* NON-CLICKABLE: Compliance Card */}
        <Grid item xs={12} sm={6} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card sx={{ 
              height: '100%', 
              background: stats.expired > 0 ?
                'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)' :
                'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)', 
              color: 'white',
              boxShadow: `0 8px 32px ${stats.expired > 0 ? 'rgba(244,67,54,0.3)' : 'rgba(76,175,80,0.3)'}`,
              cursor: 'default',
              transition: 'all 0.3s ease'
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography color="rgba(255,255,255,0.8)" variant="body2" gutterBottom>
                      {stats.expired > 0 ? 'Expired' : 'Compliance'}
                    </Typography>
                    <Typography variant="h2" fontWeight="bold" sx={{ mb: 1 }}>
                      {stats.expired > 0 ? stats.expired : '100%'}
                    </Typography>
                    <Typography variant="caption">
                      {stats.expired > 0 ? 'Require immediate update' : 'All procedures current'}
                    </Typography>
                  </Box>
                  <Badge 
                    badgeContent={stats.expired} 
                    color="error"
                    invisible={stats.expired === 0}
                  >
                    {stats.expired > 0 ? 
                      <ErrorIcon sx={{ fontSize: 50, opacity: 0.3 }} /> :
                      <Star sx={{ fontSize: 50, opacity: 0.3 }} />
                    }
                  </Badge>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* NON-CLICKABLE: High Quality Card */}
        <Grid item xs={12} sm={6} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card sx={{ 
              height: '100%', 
              background: 'linear-gradient(135deg, #7b1fa2 0%, #6a1b9a 100%)', 
              color: 'white',
              boxShadow: '0 8px 32px rgba(123,31,162,0.3)',
              cursor: 'default',
              transition: 'all 0.3s ease'
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography color="rgba(255,255,255,0.8)" variant="body2" gutterBottom>
                      High Quality
                    </Typography>
                    <Typography variant="h2" fontWeight="bold" sx={{ mb: 1 }}>
                      {stats.highQuality}
                    </Typography>
                    <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>
                      {stats.total > 0 ? Math.round((stats.highQuality / stats.total) * 100) : 0}% of total
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={stats.total > 0 ? (stats.highQuality / stats.total) * 100 : 0} 
                      sx={{ 
                        backgroundColor: 'rgba(255,255,255,0.3)',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: 'rgba(255,255,255,0.8)'
                        }
                      }}
                    />
                  </Box>
                  <Assessment sx={{ fontSize: 50, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* NEW: Risk Rating & Annual Review Charts */}
      {sharePointAvailable && procedures && procedures.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {/* Risk Rating Pie Chart */}
            <Grid item xs={12} md={6}>
              <Card sx={{ 
                height: 400,
                background: 'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
              }}>
                <CardContent sx={{ p: 3, height: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Security sx={{ mr: 1, color: '#f44336' }} />
                    <Typography variant="h6" fontWeight="bold">
                      Procedures by Risk Rating
                    </Typography>
                    <Chip 
                      icon={<PieChart />}
                      label="Live Data"
                      size="small"
                      color="error"
                      variant="outlined"
                      sx={{ ml: 'auto' }}
                    />
                  </Box>
                  
                  {riskData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
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
                        <Tooltip content={<CustomTooltip />} />
                        <Legend 
                          verticalAlign="bottom" 
                          height={36}
                          iconType="circle"
                          wrapperStyle={{
                            paddingTop: '20px',
                            fontSize: '12px'
                          }}
                        />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  ) : (
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      height: 300,
                      flexDirection: 'column',
                      color: 'text.secondary'
                    }}>
                      <Security sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                      <Typography variant="body2">
                        No risk rating data available
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Annual Review Bar Chart */}
            <Grid item xs={12} md={6}>
              <Card sx={{ 
                height: 400,
                background: 'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
              }}>
                <CardContent sx={{ p: 3, height: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <CalendarToday sx={{ mr: 1, color: '#2196f3' }} />
                    <Typography variant="h6" fontWeight="bold">
                      Procedures by Annual Review
                    </Typography>
                    <Chip 
                      icon={<BarChart />}
                      label="Live Data"
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ ml: 'auto' }}
                    />
                  </Box>
                  
                  {reviewData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsBarChart data={reviewData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="name" 
                          angle={-45}
                          textAnchor="end"
                          height={60}
                          fontSize={12}
                        />
                        <YAxis fontSize={12} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar 
                          dataKey="count" 
                          radius={[4, 4, 0, 0]}
                        >
                          {reviewData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  ) : (
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      height: 300,
                      flexDirection: 'column',
                      color: 'text.secondary'
                    }}>
                      <CalendarToday sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                      <Typography variant="body2">
                        No periodic review data available
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </motion.div>
      )}

      {/* Real LOB Breakdown using SharePoint Data */}
      {hasRealData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <Paper sx={{ p: 4, mb: 4, background: 'linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  📊 Procedures by Line of Business
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Live data from SharePoint • {stats.total} total procedures across {Object.keys(realLOBData).length} LOBs
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
                      <Card 
                        sx={{ 
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          background: `linear-gradient(135deg, ${alpha(config.color, 0.1)} 0%, ${alpha(config.color, 0.05)} 100%)`,
                          border: `2px solid ${alpha(config.color, 0.2)}`,
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: `0 12px 32px ${alpha(config.color, 0.3)}`,
                            borderColor: config.color
                          }
                        }}
                        onClick={() => navigate('procedures')}
                      >
                        <CardContent sx={{ p: 3 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h3" sx={{ mr: 1 }}>
                              {config.icon}
                            </Typography>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="h4" fontWeight="bold" color={config.color}>
                                {data.count}
                              </Typography>
                              <Typography variant="body2" fontWeight="bold" gutterBottom>
                                {lob}
                              </Typography>
                            </Box>
                          </Box>
                          
                          <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                            {config.name}
                          </Typography>
                          
                          <Box sx={{ mt: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="caption">Quality Score</Typography>
                              <Typography variant="caption" fontWeight="bold">
                                {data.avgScore}%
                              </Typography>
                            </Box>
                            <LinearProgress 
                              variant="determinate" 
                              value={data.avgScore} 
                              sx={{ 
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: alpha(config.color, 0.1),
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: config.color,
                                  borderRadius: 4
                                }
                              }}
                            />
                          </Box>
                          
                          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                            <Chip 
                              label={`${percentage}%`}
                              size="small"
                              sx={{ 
                                backgroundColor: alpha(config.color, 0.1),
                                color: config.color,
                                fontWeight: 'bold'
                              }}
                            />
                            {data.expiringSoon > 0 && (
                          <Chip 
                               label={`${data.expiringSoon} expiring`}
                               size="small"
                               color="warning"
                             />
                           )}
                           {data.expired > 0 && (
                             <Chip 
                               label={`${data.expired} expired`}
                               size="small"
                               color="error"
                             />
                           )}
                         </Box>
                       </CardContent>
                     </Card>
                   </motion.div>
                 </Grid>
               );
             })}
           </Grid>
         </Paper>
       </motion.div>
     )}

     {/* 🎯 **FIXED: Role-based Quick Access Links** */}
     <Grid container spacing={3} sx={{ mb: 4 }}>
       {s.map((link, index) => (
         <Grid item xs={12} md={s.length === 3 ? 4 : 6} key={link.path}>
           <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
           >
             <Card 
               sx={{ 
                 height: '100%',
                 cursor: 'pointer',
                 transition: 'all 0.3s ease',
                 background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                 border: link.showFor === 'admin' ? '2px solid #f44336' : 
                        link.showFor === 'uploader' ? '2px solid #7b1fa2' : 
                        '2px solid transparent',
                 '&:hover': {
                   transform: 'translateY(-6px)',
                   boxShadow: `0 12px 40px ${alpha(link.color, 0.2)}`,
                   '& .icon-box': {
                     backgroundColor: link.color,
                     color: 'white'
                   }
                 }
               }}
               onClick={() => navigate(link.path)}
             >
               <CardContent sx={{ p: 4 }}>
                 <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                   <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                     <Box 
                       className="icon-box"
                       sx={{ 
                         p: 2, 
                         borderRadius: 3, 
                         bgcolor: alpha(link.color, 0.1),
                         color: link.color,
                         display: 'flex',
                         alignItems: 'center',
                         justifyContent: 'center',
                         transition: 'all 0.3s ease'
                       }}
                     >
                       {link.icon}
                     </Box>
                     <Typography variant="h5" fontWeight="bold" color={link.color}>
                       {link.title}
                     </Typography>
                   </Box>
                   <Typography variant="h3" fontWeight="bold" color={link.color}>
                     {link.count}
                   </Typography>
                 </Box>
                 <Typography variant="body1" color="text.secondary">
                   {link.description}
                 </Typography>
                 
                 {/* Role indicator */}
                 {link.showFor !== 'all' && (
                   <Box sx={{ mt: 2 }}>
                     <Chip 
                       label={link.showFor === 'admin' ? 'Admin Only' : 'Admin & Uploaders'}
                       size="small"
                       color={link.showFor === 'admin' ? 'error' : 'secondary'}
                       variant="outlined"
                     />
                   </Box>
                 )}
               </CardContent>
             </Card>
           </motion.div>
         </Grid>
       ))}
     </Grid>


           {/*Adding governance team details*/}
           <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Governance Team
        </Typography>
      </Box>
            {/* Adding the Governance team */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
     <Grid item xs={12} sm={6} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card sx={{ 
               height: '100%', 
               background: 'linear-gradient(135deg,rgb(139, 1, 1) 0%,rgb(151, 1, 1) 100%)', 
               color: 'white',
               boxShadow: '0 8px 32px rgba(39, 3, 3, 0.3)',
               cursor: 'default',
               transition: 'all 0.3s ease'
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography color="rgba(255,255,255,0.8)" variant="body2" gutterBottom>
                    SENIOR MANAGER GOVERNANCE AND PERFORMANCE MGT
                    </Typography>
                    <Typography variant="h3" fontWeight="bold" sx={{ mb: 1 }}>
                    Maii Pharouh
                    </Typography>
                    <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>
                    maii.pharouh@hsbc.com
                    </Typography>
                  </Box>
                  {/* using fixed URL from the HSBC directory for ease of access - Clean & Make sure to update when changing user details */}
                  <Avatar 
                 src="https://photos.global.hsbc/GetPhoto.ashx?pose=casual&format=square&empid=43744500"
                  sx={{ 
                    width: 80, 
                    height: 80, 
                    opacity: 0.6 
                  }}
                  alt="User Profile"/>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card sx={{ 
             height: '100%', 
             background: 'linear-gradient(135deg,rgb(66, 0, 0) 0%,rgb(75, 18, 18) 100%)', 
             color: 'white',
             boxShadow: '0 8px 32px rgba(58, 4, 4, 0.3)',
             cursor: 'default',
             transition: 'all 0.3s ease'
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography color="rgba(255,255,255,0.8)" variant="body2" gutterBottom>
                    MANAGER GOVERNANCE AND PERFORMANCE MGT
                    </Typography>
                    <Typography variant="h3" fontWeight="bold" sx={{ mb: 1 }}>
                    Heba A MAHER
                    </Typography>
                    <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>
                    heba.maher@hsbc.com
                    </Typography>
                  </Box>
                  {/* using fixed URL from the HSBC directory for ease of access - Clean & Make sure to update when changing user details */}
                  <Avatar 
                 src="https://photos.global.hsbc/GetPhoto.ashx?pose=casual&format=square&empid=43246885"
                  sx={{ 
                    width: 80, 
                    height: 80, 
                    opacity: 0.6 
                  }}
                  alt="User Profile"/>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card sx={{ 
              height: '100%', 
              background: 'linear-gradient(135deg,rgb(66, 0, 0) 0%,rgb(75, 18, 18) 100%)', 
              color: 'white',
              boxShadow: '0 8px 32px rgba(58, 4, 4, 0.3)',
              cursor: 'default',
              transition: 'all 0.3s ease'
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography color="rgba(255,255,255,0.8)" variant="body2" gutterBottom>
                    GOVERNANCE AND PERFORMANCE MGT MANAGER
                    </Typography>
                    <Typography variant="h3" fontWeight="bold" sx={{ mb: 1 }}>
                    Radwa HEGAZY
                    </Typography>
                    <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>
                    radwa.osman.hegazy@hsbc.com
                    </Typography>
                  </Box>
                  {/* using fixed URL from the HSBC directory for ease of access - Clean & Make sure to update when changing user details */}
                  <Avatar 
                 src="https://photos.global.hsbc/GetPhoto.ashx?pose=casual&format=square&empid=43246885"
                  sx={{ 
                    width: 80, 
                    height: 80, 
                    opacity: 0.6 
                  }}
                  alt="User Profile"/>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
        </Grid>
        


        
     {/* Empty State Message for New Installations */}
     {!hasRealData && sharePointAvailable && (
       <motion.div
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.4, delay: 0.7 }}
       >
         <Alert severity="info" sx={{ mb: 4 }}>
           <Typography variant="h6" gutterBottom>
             🎯 Ready to Get Started!
           </Typography>
           <Typography variant="body2">
             Your SharePoint integration is working perfectly. Start by uploading some procedures to see the LOB breakdown and risk analysis charts with real data.
             {(isAdmin || isUploader) && (
               <>
                 {' '}Click <strong>"Upload New"</strong> above to add your first procedure.
               </>
             )}
           </Typography>
         </Alert>
       </motion.div>
     )}
   </Box>
 );
};

export default HomePage;
