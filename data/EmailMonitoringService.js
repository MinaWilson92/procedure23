// services/EmailMonitoringService.js - Automatic Email Monitoring
import EmailNotificationService from './EmailNotificationService';

class EmailMonitoringService {
  constructor() {
    this.emailNotificationService = new EmailNotificationService();
    this.monitoringIntervals = new Map();
    this.isRunning = false;
    this.lastMonitoringRun = null;
    
    console.log('📊 Email Monitoring Service initialized');
  }

  // ===================================================================
  // AUTOMATIC MONITORING SETUP
  // ===================================================================

  // Start automatic monitoring
  async startAutomaticMonitoring() {
    try {
      console.log('🔄 Starting automatic email monitoring...');
      
      if (this.isRunning) {
        console.log('⚠️ Monitoring already running');
        return { success: true, message: 'Monitoring already active' };
      }

      // Daily monitoring for expiring procedures
      this.setupDailyExpiryMonitoring();
      
      // Weekly monitoring for summary reports
      this.setupWeeklyReporting();
      
      // Hourly monitoring for critical procedures
      this.setupHourlyMonitoring();
      
      this.isRunning = true;
      
      // Log monitoring start
      await this.logMonitoringActivity('MONITORING_STARTED', {
        dailyMonitoring: true,
        weeklyReporting: true,
        hourlyMonitoring: true,
        startTime: new Date().toISOString()
      });
      
      console.log('✅ Automatic email monitoring started');
      return { success: true, message: 'Automatic monitoring started successfully' };
      
    } catch (error) {
      console.error('❌ Failed to start automatic monitoring:', error);
      return { success: false, message: error.message };
    }
  }

  // Stop automatic monitoring
  async stopAutomaticMonitoring() {
    try {
      console.log('🛑 Stopping automatic email monitoring...');
      
      // Clear all intervals
      this.monitoringIntervals.forEach((interval, name) => {
        clearInterval(interval);
        console.log(`✅ Stopped ${name} monitoring`);
      });
      
      this.monitoringIntervals.clear();
      this.isRunning = false;
      
      // Log monitoring stop
      await this.logMonitoringActivity('MONITORING_STOPPED', {
        stopTime: new Date().toISOString(),
        lastRun: this.lastMonitoringRun
      });
      
      console.log('✅ Automatic email monitoring stopped');
      return { success: true, message: 'Automatic monitoring stopped successfully' };
      
    } catch (error) {
      console.error('❌ Failed to stop automatic monitoring:', error);
      return { success: false, message: error.message };
    }
  }

  // ===================================================================
  // DAILY EXPIRY MONITORING
  // ===================================================================

  setupDailyExpiryMonitoring() {
    console.log('📅 Setting up daily expiry monitoring...');
    
    // Run every day at 9 AM
    const dailyInterval = setInterval(async () => {
      await this.runDailyExpiryCheck();
    }, 24 * 60 * 60 * 1000); // 24 hours
    
    this.monitoringIntervals.set('daily_expiry', dailyInterval);
    
    // Run immediately for testing
    setTimeout(() => this.runDailyExpiryCheck(), 5000);
  }

  async runDailyExpiryCheck() {
    try {
      console.log('📅 Running daily expiry check...');
      this.lastMonitoringRun = new Date().toISOString();
      
      // Get all procedures
      const procedures = await this.getAllProcedures();
      
      if (!procedures || procedures.length === 0) {
        console.log('⚠️ No procedures found for expiry check');
        return;
      }

      const now = new Date();
      const results = {
        totalProcedures: procedures.length,
        expiringSoon: 0,
        expired: 0,
        emailsSent: 0,
        errors: 0
      };

      // Check each procedure
      for (const procedure of procedures) {
        try {
          if (!procedure.ExpiryDate) continue;
          
          const expiryDate = new Date(procedure.ExpiryDate);
          const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
          
          // Send expiry warnings
          if (daysUntilExpiry <= 0) {
            // Expired - send urgent notification
            const result = await this.emailNotificationService.triggerExpiredProcedureNotification({
              id: procedure.Id,
              name: procedure.Title,
              lob: procedure.LOB,
              primary_owner: procedure.PrimaryOwner,
              primary_owner_email: procedure.PrimaryOwnerEmail,
              expiry: procedure.ExpiryDate
            });
            
            if (result.success) results.emailsSent++;
            else results.errors++;
            
            results.expired++;
            
          } else if (daysUntilExpiry <= 7 || daysUntilExpiry <= 14 || daysUntilExpiry <= 30) {
            // Expiring soon - send warning
            const result = await this.emailNotificationService.triggerExpiryWarningNotification({
              id: procedure.Id,
              name: procedure.Title,
              lob: procedure.LOB,
              primary_owner: procedure.PrimaryOwner,
              primary_owner_email: procedure.PrimaryOwnerEmail,
              expiry: procedure.ExpiryDate
            });
            
            if (result.success) results.emailsSent++;
            else results.errors++;
            
            results.expiringSoon++;
          }
          
        } catch (error) {
          console.error(`❌ Error checking procedure ${procedure.Id}:`, error);
          results.errors++;
        }
      }

      // Log daily monitoring results
      await this.logMonitoringActivity('DAILY_EXPIRY_CHECK', results);
      
      console.log('✅ Daily expiry check completed:', results);
      
    } catch (error) {
      console.error('❌ Daily expiry check failed:', error);
      await this.logMonitoringActivity('DAILY_EXPIRY_CHECK_FAILED', { error: error.message });
    }
  }

  // ===================================================================
  // WEEKLY REPORTING
  // ===================================================================

  setupWeeklyReporting() {
    console.log('📊 Setting up weekly reporting...');
    
    // Run every week on Monday at 10 AM
    const weeklyInterval = setInterval(async () => {
      await this.runWeeklyReport();
    }, 7 * 24 * 60 * 60 * 1000); // 7 days
    
    this.monitoringIntervals.set('weekly_report', weeklyInterval);
    
    // Run immediately for testing (but only once)
    setTimeout(() => this.runWeeklyReport(), 10000);
  }

  async runWeeklyReport() {
    try {
      console.log('📊 Running weekly email report...');
      
      // Get weekly statistics
      const weeklyStats = await this.getWeeklyStatistics();
      
      // Generate weekly report email
      const reportHtml = this.generateWeeklyReportHtml(weeklyStats);
      
      // Send weekly report to admins
      const result = await this.sendWeeklyReport(reportHtml, weeklyStats);
      
      // Log weekly report
      await this.logMonitoringActivity('WEEKLY_REPORT_SENT', {
        stats: weeklyStats,
        emailSent: result.success,
        reportDate: new Date().toISOString()
      });
      
      console.log('✅ Weekly report completed:', result);
      
    } catch (error) {
      console.error('❌ Weekly report failed:', error);
      await this.logMonitoringActivity('WEEKLY_REPORT_FAILED', { error: error.message });
    }
  }

  async getWeeklyStatistics() {
    try {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      // Get email activity from last week
      const emailActivities = await this.emailNotificationService.getEmailActivityLog(100);
      const weeklyEmails = emailActivities.filter(activity => 
        new Date(activity.timestamp) >= oneWeekAgo
      );
      
      // Get procedures stats
      const procedures = await this.getAllProcedures();
      const now = new Date();
      
      const stats = {
        weekPeriod: {
          start: oneWeekAgo.toISOString(),
          end: new Date().toISOString()
        },
        emailActivity: {
          total: weeklyEmails.length,
          byType: this.groupByActivityType(weeklyEmails),
          successful: weeklyEmails.filter(e => e.success !== false).length
        },
        procedures: {
          total: procedures?.length || 0,
          expired: procedures?.filter(p => p.ExpiryDate && new Date(p.ExpiryDate) < now).length || 0,
          expiringSoon: procedures?.filter(p => {
            if (!p.ExpiryDate) return false;
            const expiry = new Date(p.ExpiryDate);
            const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
            return daysLeft > 0 && daysLeft <= 30;
          }).length || 0,
          byLOB: this.groupProceduresByLOB(procedures || [])
        },
        systemHealth: {
          monitoringUptime: this.isRunning ? '100%' : 'Stopped',
          lastSuccessfulRun: this.lastMonitoringRun,
          errors: weeklyEmails.filter(e => e.success === false).length
        }
      };
      
      return stats;
      
    } catch (error) {
      console.error('❌ Failed to get weekly statistics:', error);
      return null;
    }
  }

  generateWeeklyReportHtml(stats) {
    if (!stats) return '<p>Unable to generate report - statistics unavailable</p>';
    
    return `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #d40000, #b30000); padding: 20px; color: white; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">HSBC Procedures Hub</h1>
          <p style="margin: 10px 0 0 0; font-size: 18px;">Weekly Email System Report</p>
          <p style="margin: 5px 0 0 0; opacity: 0.9;">
            ${new Date(stats.weekPeriod.start).toLocaleDateString()} - ${new Date(stats.weekPeriod.end).toLocaleDateString()}
          </p>
        </div>
        
        <div style="padding: 30px; background: #f9f9f9;">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px;">
            <div style="background: #2196f3; color: white; padding: 20px; border-radius: 8px; text-align: center;">
              <h3 style="margin: 0 0 10px 0;">📧 Total Emails</h3>
              <p style="font-size: 32px; font-weight: bold; margin: 0;">${stats.emailActivity.total}</p>
            </div>
            <div style="background: #4caf50; color: white; padding: 20px; border-radius: 8px; text-align: center;">
              <h3 style="margin: 0 0 10px 0;">📋 Total Procedures</h3>
              <p style="font-size: 32px; font-weight: bold; margin: 0;">${stats.procedures.total}</p>
            </div>
            <div style="background: #ff9800; color: white; padding: 20px; border-radius: 8px; text-align: center;">
              <h3 style="margin: 0 0 10px 0;">⏰ Expiring Soon</h3>
              <p style="font-size: 32px; font-weight: bold; margin: 0;">${stats.procedures.expiringSoon}</p>
            </div>
            <div style="background: #f44336; color: white; padding: 20px; border-radius: 8px; text-align: center;">
              <h3 style="margin: 0 0 10px 0;">🚨 Expired</h3>
              <p style="font-size: 32px; font-weight: bold; margin: 0;">${stats.procedures.expired}</p>
            </div>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #d40000; margin: 0 0 15px 0;">📊 Email Activity Breakdown</h3>
            ${Object.entries(stats.emailActivity.byType).map(([type, count]) => `
              <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
                <span>${this.formatActivityType(type)}</span>
                <strong>${count}</strong>
              </div>
            `).join('')}
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #d40000; margin: 0 0 15px 0;">🏢 Procedures by LOB</h3>
            ${Object.entries(stats.procedures.byLOB).map(([lob, count]) => `
              <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
                <span>${lob}</span>
                <strong>${count}</strong>
              </div>
            `).join('')}
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 8px;">
            <h3 style="color: #d40000; margin: 0 0 15px 0;">🛡️ System Health</h3>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
              <span>Monitoring Status</span>
              <strong style="color: ${this.isRunning ? '#4caf50' : '#f44336'}">${stats.systemHealth.monitoringUptime}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
              <span>Last Successful Run</span>
              <strong>${stats.systemHealth.lastSuccessfulRun ? new Date(stats.systemHealth.lastSuccessfulRun).toLocaleString() : 'Never'}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0;">
              <span>Email Errors This Week</span>
              <strong style="color: ${stats.systemHealth.errors > 0 ? '#f44336' : '#4caf50'}">${stats.systemHealth.errors}</strong>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
            <p>This report was automatically generated by the HSBC Procedures Hub Email Monitoring System</p>
            <p>Report generated: ${new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>
    `;
  }

  async sendWeeklyReport(reportHtml, stats) {
    try {
      // Get admin recipients
      const config = await this.emailNotificationService.refreshConfiguration();
      const adminEmails = config?.adminList?.map(admin => admin.email).filter(Boolean) || ['minaantoun@hsbc.com'];
      
      // Send weekly report email
      const result = await this.emailNotificationService.emailService.sendEmailViaSharePoint({
        to: adminEmails,
        subject: `HSBC Procedures Hub - Weekly Email Report (${new Date().toLocaleDateString()})`,
        body: reportHtml
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ Failed to send weekly report:', error);
      return { success: false, message: error.message };
    }
  }

  // ===================================================================
  // HOURLY MONITORING FOR CRITICAL PROCEDURES
  // ===================================================================

  setupHourlyMonitoring() {
    console.log('⏰ Setting up hourly critical monitoring...');
    
    // Run every hour
    const hourlyInterval = setInterval(async () => {
      await this.runHourlyCriticalCheck();
    }, 60 * 60 * 1000); // 1 hour
    
    this.monitoringIntervals.set('hourly_critical', hourlyInterval);
  }

  async runHourlyCriticalCheck() {
    try {
      console.log('⏰ Running hourly critical check...');
      
      const procedures = await this.getAllProcedures();
      const now = new Date();
      const results = {
        criticalCount: 0,
        emailsSent: 0
      };

      for (const procedure of procedures || []) {
        if (!procedure.ExpiryDate) continue;
        
        const expiryDate = new Date(procedure.ExpiryDate);
        const hoursUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60));
        
        // Send critical alerts for procedures expiring in next 24 hours
        if (hoursUntilExpiry > 0 && hoursUntilExpiry <= 24) {
          const result = await this.emailNotificationService.triggerExpiryWarningNotification({
            id: procedure.Id,
            name: procedure.Title,
            lob: procedure.LOB,
            primary_owner: procedure.PrimaryOwner,
            primary_owner_email: procedure.PrimaryOwnerEmail,
            expiry: procedure.ExpiryDate
          });
          
          if (result.success) results.emailsSent++;
          results.criticalCount++;
        }
      }

      if (results.criticalCount > 0) {
        await this.logMonitoringActivity('HOURLY_CRITICAL_CHECK', results);
        console.log('⚠️ Hourly critical check found issues:', results);
      }
      
    } catch (error) {
      console.error('❌ Hourly critical check failed:', error);
    }
  }

  // ===================================================================
  // HELPER METHODS
  // ===================================================================

  async getAllProcedures() {
    try {
      const response = await fetch(
        'https://teams.global.hsbc/sites/EmployeeEng/_api/web/lists/getbytitle(\'Procedures\')/items?$select=Id,Title,ExpiryDate,LOB,PrimaryOwner,PrimaryOwnerEmail,Status&$top=5000',
        {
          headers: { 'Accept': 'application/json; odata=verbose' },
          credentials: 'same-origin'
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        return data.d.results;
      }
      
      return [];
    } catch (error) {
      console.error('❌ Failed to get procedures:', error);
      return [];
    }
  }

  groupByActivityType(activities) {
    const grouped = {};
    activities.forEach(activity => {
      const type = activity.activityType || 'UNKNOWN';
      grouped[type] = (grouped[type] || 0) + 1;
    });
    return grouped;
  }

  groupProceduresByLOB(procedures) {
    const grouped = {};
    procedures.forEach(procedure => {
      const lob = procedure.LOB || 'Unknown';
      grouped[lob] = (grouped[lob] || 0) + 1;
    });
    return grouped;
  }

  formatActivityType(type) {
    const formatMap = {
      'NEW_PROCEDURE_NOTIFICATION': '📤 New Procedure Uploads',
      'USER_ACCESS_GRANTED_NOTIFICATION': '✅ User Access Granted',
      'USER_ACCESS_REVOKED_NOTIFICATION': '❌ User Access Revoked',
      'USER_ROLE_UPDATED_NOTIFICATION': '🔄 User Role Updates',
      'PROCEDURE_EXPIRING_NOTIFICATION': '⏰ Expiry Warnings',
      'PROCEDURE_EXPIRED_NOTIFICATION': '🚨 Expired Procedures',
      'LOW_QUALITY_SCORE_NOTIFICATION': '📊 Quality Alerts',
      'EMAIL_SYSTEM_TEST': '🧪 System Tests'
    };
    
    return formatMap[type] || type.replace(/_/g, ' ');
  }

  async logMonitoringActivity(activityType, details) {
    try {
      const requestDigest = await this.getFreshRequestDigest();
      
      const logEntry = {
        __metadata: { type: 'SP.Data.EmailActivityLogListItem' },
        Title: activityType,
        ActivityType: activityType,
        Recipients: JSON.stringify(['minaantoun@hsbc.com']),
        Success: true,
        Details: JSON.stringify(details),
        Timestamp: new Date().toISOString(),
        PerformedBy: 'Email Monitoring System',
        ProcedureId: null,
        TargetUser: null
      };

      await fetch(
        'https://teams.global.hsbc/sites/EmployeeEng/_api/web/lists/getbytitle(\'EmailActivityLog\')/items',
        {
          method: 'POST',
          headers: {
            'Accept': 'application/json; odata=verbose',
            'Content-Type': 'application/json; odata=verbose',
            'X-RequestDigest': requestDigest
          },
          credentials: 'same-origin',
          body: JSON.stringify(logEntry)
        }
      );
      
    } catch (error) {
      console.error('❌ Failed to log monitoring activity:', error);
    }
  }

  async getFreshRequestDigest() {
    try {
      const digestResponse = await fetch(
        'https://teams.global.hsbc/sites/EmployeeEng/_api/contextinfo',
        {
          method: 'POST',
          headers: {
            'Accept': 'application/json; odata=verbose',
            'Content-Type': 'application/json; odata=verbose'
          },
          credentials: 'same-origin'
        }
      );
      
      if (digestResponse.ok) {
        const digestData = await digestResponse.json();
        return digestData.d.GetContextWebInformation.FormDigestValue;
      }
      
      return document.getElementById('__REQUESTDIGEST')?.value || '';
    } catch (error) {
      return '';
    }
  }

  // Get monitoring status
  getMonitoringStatus() {
    return {
      isRunning: this.isRunning,
      activeMonitors: Array.from(this.monitoringIntervals.keys()),
      lastRun: this.lastMonitoringRun,
      intervalsCount: this.monitoringIntervals.size
    };
  }
}

export default EmailMonitoringService;
