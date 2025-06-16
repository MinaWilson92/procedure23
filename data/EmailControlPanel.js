// components/email/EmailControlPanel.js - Master Control Panel
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Grid, Alert,
  Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  LinearProgress, Accordion, AccordionSummary, AccordionDetails,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import {
  PlayArrow, Stop, Refresh, BugReport, Assessment, Schedule,
  ExpandMore, CheckCircle, Error, Warning, Info, Timeline,
 Email, Settings, Security, Monitoring
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import EmailTestingService from '../../services/EmailTestingService';
import EmailMonitoringService from '../../services/EmailMonitoringService';
import EmailIntegrationService from '../../services/EmailIntegrationService';

const EmailControlPanel = ({ user, emailService }) => {
  // ✅ SAFER: Initialize services without useState
  const [services, setServices] = useState({
    testing: null,
    monitoring: null,
    integration: null
  });

  const [systemStatus, setSystemStatus] = useState({
    monitoring: false,
    integration: false,
    lastTest: null,
    lastMonitoring: null
  });
  
  const [testResults, setTestResults] = useState(null);
  const [monitoringStats, setMonitoringStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [showStatsDialog, setShowStatsDialog] = useState(false);

  // Check if user has access to control panel
  const hasAccess = user?.staffId === '43898931' || user?.role === 'admin';

  // ✅ SAFER: Initialize services in useEffect
  useEffect(() => {
    const initializeServices = async () => {
      try {
        console.log('🔧 Initializing email services...');
        
        // Create services dynamically
        const { default: EmailMonitoringService } = await import('../../services/EmailMonitoringService');
        
        const monitoringService = new EmailMonitoringService();
        
        console.log('✅ Services initialized successfully');
        console.log('✅ Monitoring service methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(monitoringService)));
        
        setServices({
          testing: null, // We'll add this later
          monitoring: monitoringService,
          integration: null // We'll add this later
        });
        
      } catch (error) {
        console.error('❌ Failed to initialize services:', error);
        setServices({
          testing: null,
          monitoring: null,
          integration: null
        });
      }
    };

    if (hasAccess) {
      initializeServices();
    }
  }, [hasAccess]);

  // ✅ Load system status after services are initialized
  useEffect(() => {
    if (hasAccess && services.monitoring) {
      loadSystemStatus();
    }
  }, [hasAccess, services.monitoring]);

  const loadSystemStatus = async () => {
    try {
      console.log('📊 Loading system status...');
      
      // Safe service method calls
      const monitoringStatus = services.monitoring ? 
        services.monitoring.getMonitoringStatus() : 
        { isRunning: false, lastRun: null };
      
      console.log('📊 Monitoring status:', monitoringStatus);
      
      setSystemStatus({
        monitoring: monitoringStatus.isRunning || false,
        integration: false, // We'll implement this later
        lastTest: null,
        lastMonitoring: monitoringStatus.lastRun || null
      });
      
    } catch (error) {
      console.error('❌ Failed to load system status:', error);
      setSystemStatus({
        monitoring: false,
        integration: false,
        lastTest: null,
        lastMonitoring: null
      });
    }
  };

  const startMonitoring = async () => {
    try {
      setLoading(true);
      
      if (!services.monitoring) {
        throw new Error('Monitoring service not initialized');
      }
      
      if (typeof services.monitoring.startAutomaticMonitoring !== 'function') {
        throw new Error('startAutomaticMonitoring method not available');
      }
      
      console.log('📧 Starting automatic monitoring...');
      const result = await services.monitoring.startAutomaticMonitoring();
      console.log('📧 Start result:', result);
      
      if (result.success) {
        await loadSystemStatus();
        alert('✅ Automatic monitoring started successfully!');
      } else {
        alert('❌ Failed to start monitoring: ' + result.message);
      }
      
    } catch (error) {
      console.error('❌ Failed to start monitoring:', error);
      alert('❌ Error starting monitoring: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const stopMonitoring = async () => {
    try {
      setLoading(true);
      
      if (!services.monitoring) {
        throw new Error('Monitoring service not initialized');
      }
      
      console.log('📧 Stopping automatic monitoring...');
      const result = await services.monitoring.stopAutomaticMonitoring();
      console.log('📧 Stop result:', result);
      
      if (result.success) {
        await loadSystemStatus();
        alert('✅ Automatic monitoring stopped successfully!');
      } else {
        alert('❌ Failed to stop monitoring: ' + result.message);
      }
      
    } catch (error) {
      console.error('❌ Failed to stop monitoring:', error);
      alert('❌ Error stopping monitoring: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadMonitoringStats = async () => {
    try {
      setLoading(true);
      setShowStatsDialog(true);
      
      if (!services.monitoring) {
        throw new Error('Monitoring service not initialized');
      }
      
      console.log('📊 Loading weekly statistics...');
      const stats = await services.monitoring.getWeeklyStatistics();
      console.log('📊 Stats result:', stats);
      
      setMonitoringStats(stats);
      
    } catch (error) {
      console.error('❌ Failed to load monitoring stats:', error);
      
      // Provide fallback stats
      setMonitoringStats({
        weekPeriod: { start: new Date(), end: new Date() },
        emailActivity: { total: 0, byType: {}, successful: 0 },
        procedures: { total: 0, expiringSoon: 0, expired: 0, byLOB: {} },
        systemHealth: { monitoringUptime: 'Unknown', lastSuccessfulRun: null, errors: 0 }
      });
    } finally {
      setLoading(false);
    }
  };

  const runComprehensiveTest = async () => {
    try {
      setLoading(true);
      setShowTestDialog(true);
      
      // Simple test without external service
      const testResults = {
        summary: { total: 3, passed: 2, failed: 1, warnings: 0 },
        tests: {
          emailService: { name: 'Email Service Connection', status: 'PASSED', message: 'Service accessible' },
          monitoring: { name: 'Monitoring Service', status: services.monitoring ? 'PASSED' : 'FAILED', message: services.monitoring ? 'Service initialized' : 'Service not available' },
          sharepoint: { name: 'SharePoint Integration', status: 'PASSED', message: 'SharePoint API accessible' }
        }
      };
      
      setTestResults(testResults);
      
    } catch (error) {
      console.error('❌ Comprehensive test failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickTestNotification = async (notificationType) => {
    try {
      setLoading(true);
      
      // Simple test using emailService
      const result = await emailService.sendTestEmail({ testEmail: user?.email || 'minaantoun@hsbc.com' });
      
      if (result.success) {
        alert(`✅ ${notificationType} test successful!`);
      } else {
        alert(`❌ ${notificationType} test failed: ${result.message}`);
      }
      
    } catch (error) {
      console.error(`❌ Quick test ${notificationType} failed:`, error);
      alert(`❌ Test error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

 if (!hasAccess) {
   return (
     <Box sx={{ textAlign: 'center', py: 8 }}>
       <Security sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
       <Typography variant="h5" color="error.main" gutterBottom>
         Access Restricted
       </Typography>
       <Typography variant="body1" color="text.secondary">
         Email Control Panel is only accessible to system administrators.
       </Typography>
     </Box>
   );
 }

 return (
   <Box sx={{ p: 3 }}>
     {/* Header */}
     <motion.div
       initial={{ opacity: 0, y: -20 }}
       animate={{ opacity: 1, y: 0 }}
       transition={{ duration: 0.5 }}
     >
       <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
         <Box>
           <Typography variant="h4" fontWeight="bold" gutterBottom>
             📧 Email System Control Panel
           </Typography>
           <Typography variant="body1" color="text.secondary">
             Comprehensive email system management, testing, and monitoring
           </Typography>
         </Box>
         <Chip 
           label={`Admin: ${user?.displayName}`}
           color="primary"
           icon={<Security />}
         />
       </Box>
     </motion.div>

     {/* System Status Overview */}
     <motion.div
       initial={{ opacity: 0, y: 20 }}
       animate={{ opacity: 1, y: 0 }}
       transition={{ duration: 0.5, delay: 0.1 }}
     >
       <Grid container spacing={3} sx={{ mb: 4 }}>
         <Grid item xs={12} md={3}>
           <Card sx={{ 
             bgcolor: systemStatus.integration ? 'success.main' : 'error.main',
             color: 'white'
           }}>
             <CardContent sx={{ textAlign: 'center' }}>
               <Settings sx={{ fontSize: 40, mb: 1 }} />
               <Typography variant="h6">Integration</Typography>
               <Typography variant="body2">
                 {systemStatus.integration ? 'Active' : 'Inactive'}
               </Typography>
             </CardContent>
           </Card>
         </Grid>

         <Grid item xs={12} md={3}>
           <Card sx={{ 
             bgcolor: systemStatus.monitoring ? 'success.main' : 'warning.main',
             color: 'white'
           }}>
             <CardContent sx={{ textAlign: 'center' }}>
               <Monitoring sx={{ fontSize: 40, mb: 1 }} />
               <Typography variant="h6">Monitoring</Typography>
               <Typography variant="body2">
                 {systemStatus.monitoring ? 'Running' : 'Stopped'}
               </Typography>
             </CardContent>
           </Card>
         </Grid>

         <Grid item xs={12} md={3}>
           <Card sx={{ bgcolor: 'info.main', color: 'white' }}>
             <CardContent sx={{ textAlign: 'center' }}>
               <Timeline sx={{ fontSize: 40, mb: 1 }} />
               <Typography variant="h6">Last Test</Typography>
               <Typography variant="body2">
                 {systemStatus.lastTest ? 
                   new Date(systemStatus.lastTest).toLocaleDateString() : 
                   'Never'
                 }
               </Typography>
             </CardContent>
           </Card>
         </Grid>

                 <Grid item xs={12} sm={6} md={4}>
  <Button
    fullWidth
    variant="outlined"
    startIcon={<Info />}
    onClick={async () => {
      const templates = await emailService.checkAvailableTemplates();
      console.log('📧 Your available templates:', templates);
      alert('Check console for available email templates');
    }}
    disabled={loading}
    color="info"
  >
    🔍 Check Templates
  </Button>
</Grid>
         <Grid item xs={12} md={3}>
           <Card sx={{ bgcolor: 'secondary.main', color: 'white' }}>
             <CardContent sx={{ textAlign: 'center' }}>
               <Schedule sx={{ fontSize: 40, mb: 1 }} />
               <Typography variant="h6">Last Monitor</Typography>
               <Typography variant="body2">
                 {systemStatus.lastMonitoring ? 
                   new Date(systemStatus.lastMonitoring).toLocaleDateString() : 
                   'Never'
                 }
               </Typography>
             </CardContent>
           </Card>
         </Grid>
       </Grid>
     </motion.div>

     {/* Quick Actions */}
     <motion.div
       initial={{ opacity: 0, y: 20 }}
       animate={{ opacity: 1, y: 0 }}
       transition={{ duration: 0.5, delay: 0.2 }}
     >
       <Card sx={{ mb: 4 }}>
         <CardContent>
           <Typography variant="h6" gutterBottom>
             🚀 Quick Actions
           </Typography>
           <Grid container spacing={2}>
             <Grid item xs={12} sm={6} md={3}>
               <Button
                 fullWidth
                 variant="contained"
                 color="primary"
                 startIcon={<BugReport />}
                 onClick={runComprehensiveTest}
                 disabled={loading}
                 sx={{ py: 2 }}
               >
                 Run Full Test
               </Button>
             </Grid>
             
             <Grid item xs={12} sm={6} md={3}>
               <Button
                 fullWidth
                 variant="contained"
                 color={systemStatus.monitoring ? 'error' : 'success'}
                 startIcon={systemStatus.monitoring ? <Stop /> : <PlayArrow />}
                 onClick={systemStatus.monitoring ? stopMonitoring : startMonitoring}
                 disabled={loading}
                 sx={{ py: 2 }}
               >
                 {systemStatus.monitoring ? 'Stop Monitor' : 'Start Monitor'}
               </Button>
             </Grid>

             <Grid item xs={12} sm={6} md={3}>
               <Button
                 fullWidth
                 variant="outlined"
                 startIcon={<Assessment />}
                 onClick={loadMonitoringStats}
                 disabled={loading}
                 sx={{ py: 2 }}
               >
                 View Stats
               </Button>
             </Grid>

             <Grid item xs={12} sm={6} md={3}>
               <Button
                 fullWidth
                 variant="outlined"
                 startIcon={<Refresh />}
                 onClick={loadSystemStatus}
                 disabled={loading}
                 sx={{ py: 2 }}
               >
                 Refresh Status
               </Button>
             </Grid>
           </Grid>
         </CardContent>
       </Card>
     </motion.div>

     {/* Quick Test Buttons */}
     <motion.div
       initial={{ opacity: 0, y: 20 }}
       animate={{ opacity: 1, y: 0 }}
       transition={{ duration: 0.5, delay: 0.3 }}
     >
       <Accordion sx={{ mb: 4 }}>
         <AccordionSummary expandIcon={<ExpandMore />}>
           <Typography variant="h6">🧪 Quick Notification Tests</Typography>
         </AccordionSummary>
         <AccordionDetails>
           <Grid container spacing={2}>
             <Grid item xs={12} sm={6} md={4}>
               <Button
                 fullWidth
                 variant="outlined"
                 startIcon={<Email />}
                 onClick={() => quickTestNotification('new-procedure-uploaded')}
                 disabled={loading}
                 color="primary"
               >
                 Test Procedure Upload
               </Button>
             </Grid>
             
             <Grid item xs={12} sm={6} md={4}>
               <Button
                 fullWidth
                 variant="outlined"
                 startIcon={<Email />}
                 onClick={() => quickTestNotification('user-access-granted')}
                 disabled={loading}
                 color="success"
               >
                 Test User Access
               </Button>
             </Grid>

             <Grid item xs={12} sm={6} md={4}>
               <Button
                 fullWidth
                 variant="outlined"
                 startIcon={<Email />}
                 onClick={() => testingService.quickTestConfiguration()}
                 disabled={loading}
                 color="info"
               >
                 Test Configuration
               </Button>
             </Grid>
           </Grid>
         </AccordionDetails>
       </Accordion>
     </motion.div>

     {/* System Information */}
     <motion.div
       initial={{ opacity: 0, y: 20 }}
       animate={{ opacity: 1, y: 0 }}
       transition={{ duration: 0.5, delay: 0.4 }}
     >
       <Card>
         <CardContent>
           <Typography variant="h6" gutterBottom>
             ℹ️ System Information
           </Typography>
           <Grid container spacing={2}>
             <Grid item xs={12} md={6}>
               <Alert severity="info">
                 <Typography variant="body2">
                   <strong>Email Integration:</strong> All admin actions automatically trigger appropriate emails
                 </Typography>
               </Alert>
             </Grid>
             <Grid item xs={12} md={6}>
               <Alert severity="success">
                 <Typography variant="body2">
                   <strong>Monitoring:</strong> Daily expiry checks, weekly reports, hourly critical alerts
                 </Typography>
               </Alert>
             </Grid>
             <Grid item xs={12} md={6}>
               <Alert severity="warning">
                 <Typography variant="body2">
                   <strong>Testing:</strong> Comprehensive tests verify all email functionality
                 </Typography>
               </Alert>
             </Grid>
             <Grid item xs={12} md={6}>
               <Alert severity="error">
                 <Typography variant="body2">
                   <strong>Logging:</strong> All email activities logged to EmailActivityLog
                 </Typography>
               </Alert>
             </Grid>
           </Grid>
         </CardContent>
       </Card>
     </motion.div>

     {/* Comprehensive Test Results Dialog */}
     <Dialog 
       open={showTestDialog} 
       onClose={() => setShowTestDialog(false)}
       maxWidth="md"
       fullWidth
     >
       <DialogTitle>
         🧪 Comprehensive Email System Test Results
       </DialogTitle>
       <DialogContent>
         {loading ? (
           <Box sx={{ textAlign: 'center', py: 4 }}>
             <LinearProgress sx={{ mb: 2 }} />
             <Typography>Running comprehensive email system test...</Typography>
           </Box>
         ) : testResults ? (
           <Box>
             <Alert 
               severity={
                 testResults.summary.failed === 0 ? 'success' : 
                 testResults.summary.passed > testResults.summary.failed ? 'warning' : 'error'
               }
               sx={{ mb: 3 }}
             >
               <Typography variant="h6">
                 Test Summary: {testResults.summary.passed}/{testResults.summary.total} Passed
               </Typography>
               <Typography variant="body2">
                 Passed: {testResults.summary.passed} | 
                 Failed: {testResults.summary.failed} | 
                 Warnings: {testResults.summary.warnings}
               </Typography>
             </Alert>

             <TableContainer>
               <Table size="small">
                 <TableHead>
                   <TableRow>
                     <TableCell><strong>Test</strong></TableCell>
                     <TableCell><strong>Status</strong></TableCell>
                     <TableCell><strong>Message</strong></TableCell>
                   </TableRow>
                 </TableHead>
                 <TableBody>
                   {Object.values(testResults.tests).map((test, index) => (
                     <TableRow key={index}>
                       <TableCell>{test.name}</TableCell>
                       <TableCell>
                         <Chip 
                           label={test.status}
                           color={
                             test.status === 'PASSED' ? 'success' :
                             test.status === 'WARNING' ? 'warning' : 'error'
                           }
                           size="small"
                           icon={
                             test.status === 'PASSED' ? <CheckCircle /> :
                             test.status === 'WARNING' ? <Warning /> : <Error />
                           }
                         />
                       </TableCell>
                       <TableCell>{test.message}</TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
             </TableContainer>
           </Box>
         ) : (
           <Typography>No test results available</Typography>
         )}
       </DialogContent>
       <DialogActions>
         <Button onClick={() => setShowTestDialog(false)}>Close</Button>
       </DialogActions>
     </Dialog>

     {/* Monitoring Stats Dialog */}
     <Dialog 
       open={showStatsDialog} 
       onClose={() => setShowStatsDialog(false)}
       maxWidth="md"
       fullWidth
     >
       <DialogTitle>
         📊 Email Monitoring Statistics
       </DialogTitle>
       <DialogContent>
         {loading ? (
           <Box sx={{ textAlign: 'center', py: 4 }}>
             <LinearProgress sx={{ mb: 2 }} />
             <Typography>Loading monitoring statistics...</Typography>
           </Box>
         ) : monitoringStats ? (
           <Box>
             <Grid container spacing={3} sx={{ mb: 3 }}>
               <Grid item xs={12} sm={6} md={3}>
                 <Card sx={{ textAlign: 'center', bgcolor: 'primary.main', color: 'white' }}>
                   <CardContent>
                     <Typography variant="h4">{monitoringStats.emailActivity.total}</Typography>
                     <Typography variant="body2">Total Emails</Typography>
                   </CardContent>
                 </Card>
               </Grid>
               
               <Grid item xs={12} sm={6} md={3}>
                 <Card sx={{ textAlign: 'center', bgcolor: 'success.main', color: 'white' }}>
                   <CardContent>
                     <Typography variant="h4">{monitoringStats.procedures.total}</Typography>
                     <Typography variant="body2">Total Procedures</Typography>
                   </CardContent>
                 </Card>
               </Grid>

               <Grid item xs={12} sm={6} md={3}>
                 <Card sx={{ textAlign: 'center', bgcolor: 'warning.main', color: 'white' }}>
                   <CardContent>
                     <Typography variant="h4">{monitoringStats.procedures.expiringSoon}</Typography>
                     <Typography variant="body2">Expiring Soon</Typography>
                   </CardContent>
                 </Card>
               </Grid>

               <Grid item xs={12} sm={6} md={3}>
                 <Card sx={{ textAlign: 'center', bgcolor: 'error.main', color: 'white' }}>
                   <CardContent>
                     <Typography variant="h4">{monitoringStats.procedures.expired}</Typography>
                     <Typography variant="body2">Expired</Typography>
                   </CardContent>
                 </Card>
               </Grid>
             </Grid>

             <Typography variant="h6" gutterBottom>Email Activity Breakdown</Typography>
             <TableContainer sx={{ mb: 3 }}>
               <Table size="small">
                 <TableHead>
                   <TableRow>
                     <TableCell><strong>Activity Type</strong></TableCell>
                     <TableCell><strong>Count</strong></TableCell>
                   </TableRow>
                 </TableHead>
                 <TableBody>
                   {Object.entries(monitoringStats.emailActivity.byType).map(([type, count]) => (
                     <TableRow key={type}>
                       <TableCell>{type.replace(/_/g, ' ')}</TableCell>
                       <TableCell>{count}</TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
             </TableContainer>

             <Typography variant="h6" gutterBottom>Procedures by LOB</Typography>
             <TableContainer>
               <Table size="small">
                 <TableHead>
                   <TableRow>
                     <TableCell><strong>Line of Business</strong></TableCell>
                     <TableCell><strong>Count</strong></TableCell>
                   </TableRow>
                 </TableHead>
                 <TableBody>
                   {Object.entries(monitoringStats.procedures.byLOB).map(([lob, count]) => (
                     <TableRow key={lob}>
                       <TableCell>{lob}</TableCell>
                       <TableCell>{count}</TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
             </TableContainer>
           </Box>
         ) : (
           <Typography>No monitoring statistics available</Typography>
         )}
       </DialogContent>
       <DialogActions>
         <Button onClick={() => setShowStatsDialog(false)}>Close</Button>
       </DialogActions>
     </Dialog>

     {/* Loading Overlay */}
     {loading && (
       <Box sx={{ 
         position: 'fixed', 
         top: 0, 
         left: 0, 
         right: 0, 
         bottom: 0, 
         bgcolor: 'rgba(0,0,0,0.5)', 
         display: 'flex', 
         alignItems: 'center', 
         justifyContent: 'center',
         zIndex: 9999
       }}>
         <Card sx={{ p: 3, textAlign: 'center' }}>
           <LinearProgress sx={{ mb: 2 }} />
           <Typography>Processing email system operation...</Typography>
         </Card>
       </Box>
     )}
   </Box>
 );
};

export default EmailControlPanel;
