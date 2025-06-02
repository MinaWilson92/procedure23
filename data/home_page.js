// pages/HomePage.js - Enhanced with Graphs & Mock Data
import React from 'react';
import {
  Box, Typography, Alert, Grid, Card, CardContent,
  Paper, alpha, LinearProgress, Badge
} from '@mui/material';
import {
  Dashboard, Schedule, TrendingUp, Error as ErrorIcon,
  Folder, Person, CloudSync, Warning, CheckCircle
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigation } from '../contexts/NavigationContext';

const HomePage = ({ user, dashboardData, procedures, isAdmin }) => {
  const { navigate } = useNavigation();

  // Mock data for demonstration when API is not available
  const mockStats = {
    total: 247,
    expiringSoon: 23,
    expired: 8,
    highQuality: 186,
    byLOB: {
      'IWPB': 45,
      'CIB': 67,
      'GCOO': 38,
      'GRM': 52,
      'GF': 29,
      'GTRB': 16
    },
    trends: {
      totalChange: '+12%',
      qualityChange: '+5%',
      expiredChange: '-3%'
    }
  };

  // Use real data if available, otherwise use mock data
  const stats = dashboardData?.stats || mockStats;
  const proceduresList = procedures || [];

  const quickLinks = [
    { 
      title: 'All Procedures', 
      path: 'procedures', 
      icon: <Folder />, 
      color: '#1976d2',
      description: 'View all procedures',
      count: stats.total
    },
    { 
      title: 'My Dashboard', 
      path: 'user-dashboard', 
      icon: <Person />, 
      color: '#388e3c',
      description: 'My procedures dashboard',
      count: '12'
    }
  ];

  // Add admin link for admin users
  if (isAdmin) {
    quickLinks.push({ 
      title: 'Upload New', 
      path: 'admin-panel', 
      icon: <CloudSync />, 
      color: '#7b1fa2',
      description: 'Upload procedure',
      count: '+'
    });
  }

  return (
    <Box>
      {/* Enhanced Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          HSBC Procedures Hub
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Centralized procedure management with AI-powered quality analysis
        </Typography>
      </Box>

      {user && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Welcome back, <strong>{user.displayName || user.staffId}</strong>! 
          You are logged in as <strong>{user.role}</strong>.
          {user.source && (
            <Typography variant="caption" display="block" sx={{ mt: 0.5, opacity: 0.8 }}>
              Authenticated via: {user.source}
            </Typography>
          )}
        </Alert>
      )}

      {/* Enhanced Stats Cards with Professional Design */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
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
              boxShadow: '0 4px 12px rgba(25,118,210,0.3)',
              cursor: 'pointer',
              '&:hover': { transform: 'translateY(-2px)' },
              transition: 'transform 0.3s'
            }}
            onClick={() => navigate('procedures')}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography color="rgba(255,255,255,0.8)" variant="body2" gutterBottom>
                      Total Procedures
                    </Typography>
                    <Typography variant="h3" fontWeight="bold" sx={{ mb: 1 }}>
                      {stats.total}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TrendingUp sx={{ fontSize: 16 }} />
                      <Typography variant="caption">
                        {mockStats.trends.totalChange} this month
                      </Typography>
                    </Box>
                  </Box>
                  <Dashboard sx={{ fontSize: 40, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card sx={{ 
              height: '100%', 
              background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)', 
              color: 'white',
              boxShadow: '0 4px 12px rgba(255,152,0,0.3)',
              cursor: 'pointer',
              '&:hover': { transform: 'translateY(-2px)' },
              transition: 'transform 0.3s'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography color="rgba(255,255,255,0.8)" variant="body2" gutterBottom>
                      Expiring Soon
                    </Typography>
                    <Typography variant="h3" fontWeight="bold" sx={{ mb: 1 }}>
                      {stats.expiringSoon}
                    </Typography>
                    <Typography variant="caption">
                      Within 30 days
                    </Typography>
                  </Box>
                  <Badge 
                    badgeContent={stats.expiringSoon} 
                    color="error"
                    invisible={stats.expiringSoon === 0}
                  >
                    <Schedule sx={{ fontSize: 40, opacity: 0.3 }} />
                  </Badge>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card sx={{ 
              height: '100%', 
              background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)', 
              color: 'white',
              boxShadow: '0 4px 12px rgba(244,67,54,0.3)',
              cursor: 'pointer',
              '&:hover': { transform: 'translateY(-2px)' },
              transition: 'transform 0.3s'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography color="rgba(255,255,255,0.8)" variant="body2" gutterBottom>
                      Expired
                    </Typography>
                    <Typography variant="h3" fontWeight="bold" sx={{ mb: 1 }}>
                      {stats.expired}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TrendingUp sx={{ fontSize: 16, transform: 'rotate(180deg)' }} />
                      <Typography variant="caption">
                        {mockStats.trends.expiredChange} this month
                      </Typography>
                    </Box>
                  </Box>
                  <Badge 
                    badgeContent={stats.expired} 
                    color="error"
                    invisible={stats.expired === 0}
                  >
                    <ErrorIcon sx={{ fontSize: 40, opacity: 0.3 }} />
                  </Badge>
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
              background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)', 
              color: 'white',
              boxShadow: '0 4px 12px rgba(76,175,80,0.3)',
              cursor: 'pointer',
              '&:hover': { transform: 'translateY(-2px)' },
              transition: 'transform 0.3s'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography color="rgba(255,255,255,0.8)" variant="body2" gutterBottom>
                      High Quality
                    </Typography>
                    <Typography variant="h3" fontWeight="bold" sx={{ mb: 1 }}>
                      {stats.highQuality}
                    </Typography>
                    <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>
                      {Math.round((stats.highQuality / stats.total) * 100)}% of total
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={(stats.highQuality / stats.total) * 100} 
                      sx={{ 
                        backgroundColor: 'rgba(255,255,255,0.3)',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: 'rgba(255,255,255,0.8)'
                        }
                      }}
                    />
                  </Box>
                  <CheckCircle sx={{ fontSize: 40, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* Status Summary Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <Card sx={{ mb: 4, bgcolor: stats.expired > 0 ? '#fff3e0' : '#e8f5e8' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {stats.expired > 0 ? (
                <Warning color="warning" sx={{ fontSize: 28 }} />
              ) : (
                <CheckCircle color="success" sx={{ fontSize: 28 }} />
              )}
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  {stats.expired > 0 ? 'Action Required' : 'System Status: Healthy'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {stats.expired > 0 ? (
                    `${stats.expired} procedures have expired and ${stats.expiringSoon} are expiring within 30 days. Immediate review recommended.`
                  ) : (
                    `All procedures are up to date. ${stats.total} total procedures with ${Math.round((stats.highQuality / stats.total) * 100)}% meeting quality standards.`
                  )}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Typography variant="h4" color={stats.expired > 0 ? 'warning.main' : 'success.main'} fontWeight="bold">
                  {Math.round(((stats.total - stats.expired) / stats.total) * 100)}%
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'flex-end', mb: 0.5 }}>
                  compliance
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </motion.div>

      {/* Enhanced LOB Breakdown with Charts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        <Paper sx={{ p: 3, mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" fontWeight="bold">
              📊 Procedures by Line of Business
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total: {stats.total} procedures across 6 LOBs
            </Typography>
          </Box>
          <Grid container spacing={2}>
            {Object.entries(mockStats.byLOB).map(([lob, count], index) => {
              const lobNames = {
                'IWPB': 'Investment Banking',
                'CIB': 'Corporate & Investment Banking',
                'GCOO': 'Group Chief Operating Office',
                'GRM': 'Global Risk Management',
                'GF': 'Global Functions',
                'GTRB': 'Global Trade & Receivables Finance'
              };
              const colors = ['#1976d2', '#388e3c', '#f57c00', '#d32f2f', '#7b1fa2', '#0288d1'];
              const percentage = Math.round((count / stats.total) * 100);
              
              return (
                <Grid item xs={12} sm={6} md={4} lg={2} key={lob}>
                  <Card 
                    sx={{ 
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: `0 8px 24px ${alpha(colors[index], 0.3)}`
                      }
                    }}
                    onClick={() => navigate('procedures')}
                  >
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <Typography variant="h4" fontWeight="bold" color={colors[index]} gutterBottom>
                        {count}
                      </Typography>
                      <Typography variant="body2" fontWeight="bold" gutterBottom>
                        {lob}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                        {lobNames[lob]}
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={percentage} 
                          sx={{ 
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: alpha(colors[index], 0.1),
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: colors[index],
                              borderRadius: 3
                            }
                          }}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                          {percentage}% of total
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Paper>
      </motion.div>

      {/* Quick Access Links */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {quickLinks.map((link, index) => (
          <Grid item xs={12} md={4} key={link.path}>
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
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                    borderColor: alpha(link.color, 0.5)
                  }
                }}
                onClick={() => navigate(link.path)}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ 
                        p: 2, 
                        borderRadius: 3, 
                        bgcolor: alpha(link.color, 0.1),
                        color: link.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {link.icon}
                      </Box>
                      <Typography variant="h5" fontWeight="bold" color={link.color}>
                        {link.title}
                      </Typography>
                    </Box>
                    <Typography variant="h4" fontWeight="bold" color={link.color}>
                      {link.count}
                    </Typography>
                  </Box>
                  <Typography variant="body1" color="text.secondary">
                    {link.description}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default HomePage;
