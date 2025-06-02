// pages/HomePage.js - Professional Home Page
import React from 'react';
import {
  Box, Typography, Alert, Grid, Card, CardContent,
  Paper, alpha, LinearProgress, Badge
} from '@mui/material';
import {
  Dashboard, Schedule, TrendingUp, Error as ErrorIcon,
  Folder, Person, CloudSync
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigation } from '../contexts/NavigationContext';

const HomePage = ({ user, dashboardData, procedures, isAdmin }) => {
  const { navigate } = useNavigation();

  const quickLinks = [
    { 
      title: 'All Procedures', 
      path: 'procedures', 
      icon: <Folder />, 
      color: '#1976d2',
      description: 'View all procedures'
    },
    { 
      title: 'My Dashboard', 
      path: 'user-dashboard', 
      icon: <Person />, 
      color: '#388e3c',
      description: 'My procedures dashboard'
    }
  ];

  // Add admin link for admin users
  if (isAdmin) {
    quickLinks.push({ 
      title: 'Upload New', 
      path: 'admin-panel', 
      icon: <CloudSync />, 
      color: '#7b1fa2',
      description: 'Upload procedure'
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

      {/* Quick Stats from Dashboard Data */}
      {dashboardData?.stats && (
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
                boxShadow: '0 4px 12px rgba(25,118,210,0.3)'
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography color="rgba(255,255,255,0.8)" variant="body2" gutterBottom>
                        Total Procedures
                      </Typography>
                      <Typography variant="h3" fontWeight="bold">
                        {dashboardData.stats.total || 0}
                      </Typography>
                    </Box>
                    <Dashboard sx={{ fontSize: 50, opacity: 0.3 }} />
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
                boxShadow: '0 4px 12px rgba(255,152,0,0.3)'
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography color="rgba(255,255,255,0.8)" variant="body2" gutterBottom>
                        Need Attention
                      </Typography>
                      <Typography variant="h3" fontWeight="bold">
                        {dashboardData.stats.expiringSoon || 0}
                      </Typography>
                    </Box>
                    <Badge 
                      badgeContent={dashboardData.stats.expiringSoon || 0} 
                      color="error"
                      invisible={(dashboardData.stats.expiringSoon || 0) === 0}
                    >
                      <Schedule sx={{ fontSize: 50, opacity: 0.3 }} />
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
                boxShadow: '0 4px 12px rgba(244,67,54,0.3)'
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography color="rgba(255,255,255,0.8)" variant="body2" gutterBottom>
                        Expired
                      </Typography>
                      <Typography variant="h3" fontWeight="bold">
                        {dashboardData.stats.expired || 0}
                      </Typography>
                    </Box>
                    <Badge 
                      badgeContent={dashboardData.stats.expired || 0} 
                      color="error"
                      invisible={(dashboardData.stats.expired || 0) === 0}
                    >
                      <ErrorIcon sx={{ fontSize: 50, opacity: 0.3 }} />
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
                boxShadow: '0 4px 12px rgba(76,175,80,0.3)'
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography color="rgba(255,255,255,0.8)" variant="body2" gutterBottom>
                        High Quality
                      </Typography>
                      <Typography variant="h3" fontWeight="bold">
                        {dashboardData.stats.highQuality || 0}
                      </Typography>
                      {dashboardData.stats.total > 0 && (
                        <LinearProgress 
                          variant="determinate" 
                          value={(dashboardData.stats.highQuality / dashboardData.stats.total) * 100} 
                          sx={{ 
                            mt: 1,
                            backgroundColor: 'rgba(255,255,255,0.3)',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: 'rgba(255,255,255,0.8)'
                            }
                          }}
                        />
                      )}
                    </Box>
                    <TrendingUp sx={{ fontSize: 50, opacity: 0.3 }} />
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>
      )}

      {/* Quick Access Links */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {quickLinks.map((link, index) => (
          <Grid item xs={12} md={4} key={link.path}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
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
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ 
                      p: 2, 
                      borderRadius: 3, 
                      bgcolor: alpha(link.color, 0.1),
                      color: link.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 2
                    }}>
                      {link.icon}
                    </Box>
                    <Typography variant="h5" fontWeight="bold" color={link.color}>
                      {link.title}
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

      {/* LOB Breakdown (Professional Feature) */}
      {procedures && procedures.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.7 }}
        >
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              📊 Procedures by Line of Business
            </Typography>
            <Grid container spacing={2}>
              {['IWPB', 'CIB', 'GCOO', 'GRM', 'GF', 'GTRB'].map((lob, index) => {
                const lobProcedures = procedures.filter(p => p.lob === lob);
                const lobNames = {
                  'IWPB': 'Investment Banking',
                  'CIB': 'Corporate & Investment Banking',
                  'GCOO': 'Group Chief Operating Office',
                  'GRM': 'Global Risk Management',
                  'GF': 'Global Functions',
                  'GTRB': 'Global Trade & Receivables Finance'
                };
                const colors = ['#1976d2', '#388e3c', '#f57c00', '#d32f2f', '#7b1fa2', '#0288d1'];
                
                return (
                  <Grid item xs={12} sm={6} md={4} lg={2} key={lob}>
                    <Card 
                      sx={{ 
                        textAlign: 'center',
                        border: `2px solid ${colors[index]}`,
                        bgcolor: alpha(colors[index], 0.05),
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: `0 8px 24px ${alpha(colors[index], 0.3)}`
                        }
                      }}
                      onClick={() => navigate('procedures')}
                    >
                      <CardContent sx={{ py: 2 }}>
                        <Typography variant="h4" fontWeight="bold" color={colors[index]}>
                          {lobProcedures.length}
                        </Typography>
                        <Typography variant="body2" fontWeight="bold" gutterBottom>
                          {lob}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {lobNames[lob]}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Paper>
        </motion.div>
      )}
    </Box>
  );
};

export default HomePage;