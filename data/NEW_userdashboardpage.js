// pages/UserDashboardPage.js - User Personal Dashboard
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Paper,
  Avatar, Chip, LinearProgress, Alert, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, alpha, Tooltip, Badge, Divider
} from '@mui/material';
import {
  Person, Email, Business, Schedule, TrendingUp,
  Assignment, Warning, CheckCircle, Star, Edit,
  Visibility, Download, History, Notifications,
  CalendarToday, Dashboard, FilePresent
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigation } from '../contexts/NavigationContext';

const UserDashboardPage = ({ 
  user, 
  procedures, 
  dashboardData, 
  sharePointService,
  sharePointAvailable 
}) => {
  const { navigate } = useNavigation();
  const [userProcedures, setUserProcedures] = useState([]);
  const [userStats, setUserStats] = useState({});
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (procedures && user) {
      calculateUserData();
    }
  }, [procedures, user]);

  const calculateUserData = () => {
    try {
      setLoading(true);

      // Filter procedures where user is primary or secondary owner
      const myProcedures = procedures.filter(proc => 
        proc.primary_owner_email?.toLowerCase() === user.email?.toLowerCase() ||
        proc.secondary_owner_email?.toLowerCase() === user.email?.toLowerCase() ||
        proc.uploaded_by === user.staffId
      );

      setUserProcedures(myProcedures);

      // Calculate user-specific statistics
      const now = new Date();
      const stats = {
        totalOwned: myProcedures.length,
        primaryOwner: myProcedures.filter(p => 
          p.primary_owner_email?.toLowerCase() === user.email?.toLowerCase()
        ).length,
        secondaryOwner: myProcedures.filter(p => 
          p.secondary_owner_email?.toLowerCase() === user.email?.toLowerCase()
        ).length,
        uploaded: myProcedures.filter(p => p.uploaded_by === user.staffId).length,
        expired: myProcedures.filter(p => new Date(p.expiry) < now).length,
        expiringSoon: myProcedures.filter(p => {
          const expiry = new Date(p.expiry);
          const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
          return daysLeft > 0 && daysLeft <= 30;
        }).length,
        highQuality: myProcedures.filter(p => (p.score || 0) >= 80).length,
        averageScore: myProcedures.length > 0 ? 
          Math.round(myProcedures.reduce((sum, p) => sum + (p.score || 0), 0) / myProcedures.length) : 0
      };

      setUserStats(stats);

      // Generate recent activity
      const activity = myProcedures
        .sort((a, b) => new Date(b.uploaded_on || b.last_modified_on) - new Date(a.uploaded_on || a.last_modified_on))
        .slice(0, 5)
        .map((proc, index) => ({
          id: proc.id,
          action: proc.amendment_count > 0 ? 'Procedure amended' : 'Procedure uploaded',
          procedure: proc.name,
          time: getTimeAgo(proc.last_modified_on || proc.uploaded_on),
          type: proc.amendment_count > 0 ? 'amendment' : 'upload',
          score: proc.score,
          lob: proc.lob
        }));

      setRecentActivity(activity);

    } catch (error) {
      console.error('❌ Error calculating user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (timestamp) => {
    if (!timestamp) return 'Unknown';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Less than an hour ago';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
    
    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths} month${diffInMonths !== 1 ? 's' : ''} ago`;
  };

  const getExpiryStatus = (expiryDate) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) {
      return { status: 'expired', color: 'error', text: `Expired ${Math.abs(daysLeft)} days ago` };
    } else if (daysLeft <= 30) {
      return { status: 'expiring', color: 'warning', text: `Expires in ${daysLeft} days` };
    } else {
      return { status: 'current', color: 'success', text: `Expires in ${daysLeft} days` };
    }
  };

  const getQualityColor = (score) => {
    if (score >= 90) return '#4caf50';
    if (score >= 80) return '#8bc34a';
    if (score >= 70) return '#ff9800';
    if (score >= 60) return '#ff5722';
    return '#f44336';
  };

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>My Dashboard</Typography>
        <LinearProgress sx={{ mb: 3 }} />
        <Typography variant="body2" color="text.secondary">Loading your procedures...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          My Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Personal view of your procedures and responsibilities
        </Typography>
      </Box>

      {/* User Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Paper sx={{ p: 3, mb: 4, background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)', color: 'white' }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item>
              <Avatar 
                sx={{ 
                  width: 80, 
                  height: 80, 
                  bgcolor: 'rgba(255,255,255,0.2)',
                  fontSize: '2rem',
                  fontWeight: 'bold'
                }}
              >
                {user.displayName?.[0] || user.staffId?.[0] || 'U'}
              </Avatar>
            </Grid>
            <Grid item xs>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                {user.displayName || user.staffId}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Email sx={{ fontSize: 16 }} />
                  <Typography variant="body2">{user.email}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Person sx={{ fontSize: 16 }} />
                  <Typography variant="body2">Staff ID: {user.staffId}</Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip 
                  label={user.role || 'User'} 
                  size="small"
                  sx={{ 
                    bgcolor: 'rgba(255,255,255,0.2)', 
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                />
                {sharePointAvailable && (
                  <Chip 
                    icon={<CheckCircle />}
                    label="SharePoint Connected" 
                    size="small"
                    sx={{ 
                      bgcolor: 'rgba(76,175,80,0.8)', 
                      color: 'white'
                    }}
                  />
                )}
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </motion.div>

      {/* User Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          {
            title: 'Total Procedures',
            value: userStats.totalOwned,
            icon: <Assignment />,
            color: '#1976d2',
            description: 'Procedures you own or manage'
          },
          {
            title: 'Primary Owner',
            value: userStats.primaryOwner,
            icon: <Person />,
            color: '#388e3c',
            description: 'Procedures where you are primary owner'
          },
          {
            title: 'Need Attention',
            value: userStats.expiringSoon + userStats.expired,
            icon: <Warning />,
            color: userStats.expiringSoon + userStats.expired > 0 ? '#f57c00' : '#4caf50',
            description: 'Procedures requiring your attention'
          },
          {
            title: 'Quality Score',
            value: `${userStats.averageScore}%`,
            icon: <Star />,
            color: getQualityColor(userStats.averageScore),
            description: 'Average quality score of your procedures'
          }
        ].map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card sx={{ 
                height: '100%',
                background: `linear-gradient(135deg, ${stat.color} 0%, ${alpha(stat.color, 0.8)} 100%)`,
                color: 'white',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: `0 8px 24px ${alpha(stat.color, 0.3)}`
                }
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography color="rgba(255,255,255,0.8)" variant="body2" gutterBottom>
                        {stat.title}
                      </Typography>
                      <Typography variant="h3" fontWeight="bold">
                        {stat.value}
                      </Typography>
                      <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                        {stat.description}
                      </Typography>
                    </Box>
                    <Box sx={{ opacity: 0.3 }}>
                      {React.cloneElement(stat.icon, { sx: { fontSize: 40 } })}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Alerts Section */}
      {(userStats.expired > 0 || userStats.expiringSoon > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <Alert 
            severity={userStats.expired > 0 ? "error" : "warning"} 
            sx={{ mb: 3 }}
            action={
              <Button 
                color="inherit" 
                size="small"
                onClick={() => navigate('procedures')}
              >
                View Procedures
              </Button>
            }
          >
            <Typography variant="h6" gutterBottom>
              🚨 Action Required
            </Typography>
            {userStats.expired > 0 && (
              <Typography variant="body2">
                <strong>{userStats.expired}</strong> of your procedures have expired and require immediate updates.
              </Typography>
            )}
            {userStats.expiringSoon > 0 && (
              <Typography variant="body2">
                <strong>{userStats.expiringSoon}</strong> of your procedures are expiring within 30 days.
              </Typography>
            )}
          </Alert>
        </motion.div>
      )}

      <Grid container spacing={3}>
        {/* My Procedures Table */}
        <Grid item xs={12} lg={8}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
          >
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" fontWeight="bold">
                    📋 My Procedures ({userProcedures.length})
                  </Typography>
                  <Button 
                    variant="outlined" 
                    size="small"
                    onClick={() => navigate('procedures')}
                  >
                    View All
                  </Button>
                </Box>

                {userProcedures.length > 0 ? (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Procedure Name</strong></TableCell>
                          <TableCell><strong>Role</strong></TableCell>
                          <TableCell><strong>Quality</strong></TableCell>
                          <TableCell><strong>Expiry Status</strong></TableCell>
                          <TableCell><strong>Actions</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {userProcedures.slice(0, 5).map((proc) => {
                          const expiryInfo = getExpiryStatus(proc.expiry);
                          const isOwner = proc.primary_owner_email?.toLowerCase() === user.email?.toLowerCase();
                          const isSecondary = proc.secondary_owner_email?.toLowerCase() === user.email?.toLowerCase();
                          
                          return (
                            <TableRow key={proc.id} hover>
                              <TableCell>
                                <Box>
                                  <Typography variant="body2" fontWeight="bold">
                                    {proc.name}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {proc.lob} • {proc.procedure_subsection}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label={isOwner ? 'Primary Owner' : isSecondary ? 'Secondary Owner' : 'Uploader'}
                                  size="small"
                                  color={isOwner ? 'primary' : isSecondary ? 'secondary' : 'default'}
                                />
                              </TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="body2" fontWeight="bold">
                                    {proc.score}%
                                  </Typography>
                                  <LinearProgress 
                                    variant="determinate" 
                                    value={proc.score} 
                                    sx={{ 
                                      width: 50,
                                      '& .MuiLinearProgress-bar': {
                                        backgroundColor: getQualityColor(proc.score)
                                      }
                                    }}
                                  />
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label={expiryInfo.text}
                                  size="small"
                                  color={expiryInfo.color}
                                  variant={expiryInfo.status === 'current' ? 'outlined' : 'filled'}
                                />
                              </TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                  <Tooltip title="View Details">
                                    <IconButton size="small">
                                      <Visibility fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  {isOwner && (
                                    <Tooltip title="Edit Procedure">
                                      <IconButton size="small">
                                        <Edit fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  )}
                                </Box>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Box sx={{ 
                    textAlign: 'center', 
                    py: 4,
                    color: 'text.secondary'
                  }}>
                    <FilePresent sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                    <Typography variant="h6" gutterBottom>
                      No Procedures Found
                    </Typography>
                    <Typography variant="body2">
                      You don't own or manage any procedures yet.
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} lg={4}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.6 }}
          >
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <History />
                  <Typography variant="h6" fontWeight="bold">
                    Recent Activity
                  </Typography>
                </Box>

                {recentActivity.length > 0 ? (
                  <Box>
                    {recentActivity.map((activity, index) => (
                      <Box key={activity.id}>
                        <Box sx={{ display: 'flex', gap: 2, py: 2 }}>
                          <Box>
                            <Box sx={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              bgcolor: activity.type === 'amendment' ? '#ff9800' : '#4caf50',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white'
                            }}>
                              {activity.type === 'amendment' ? <Edit fontSize="small" /> : <Assignment fontSize="small" />}
                            </Box>
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" fontWeight="bold">
                              {activity.action}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {activity.procedure}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                              <Typography variant="caption" color="text.secondary">
                                {activity.time}
                              </Typography>
                              <Chip 
                                label={`${activity.score}%`}
                                size="small"
                                sx={{ 
                                  height: 16,
                                  fontSize: '0.7rem',
                                  bgcolor: alpha(getQualityColor(activity.score), 0.1),
                                  color: getQualityColor(activity.score)
                                }}
                              />
                              <Chip 
                                label={activity.lob}
                                size="small"
                                variant="outlined"
                                sx={{ height: 16, fontSize: '0.7rem' }}
                              />
                            </Box>
                          </Box>
                        </Box>
                        {index < recentActivity.length - 1 && <Divider />}
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Box sx={{ 
                    textAlign: 'center', 
                    py: 4,
                    color: 'text.secondary'
                  }}>
                    <History sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                    <Typography variant="body2">
                      No recent activity
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.7 }}
      >
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            🚀 Quick Actions
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Assignment />}
                onClick={() => navigate('procedures')}
                sx={{ py: 1.5 }}
              >
                View All Procedures
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<CalendarToday />}
                color="warning"
                sx={{ py: 1.5 }}
              >
                Expiring Soon ({userStats.expiringSoon})
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<TrendingUp />}
                color="success"
                sx={{ py: 1.5 }}
              >
                High Quality ({userStats.highQuality})
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Dashboard />}
                onClick={() => navigate('home')}
                sx={{ py: 1.5 }}
              >
                Main Dashboard
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </motion.div>
    </Box>
  );
};

export default UserDashboardPage
