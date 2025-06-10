// services/EmailNotificationService.js - Complete Enhanced Version
class EmailNotificationService {
  constructor() {
    this.baseUrl = 'https://teams.global.hsbc/sites/EmployeeEng';
    this.checkInterval = 24 * 60 * 60 * 1000; // 24 hours
    this.isRunning = false;
  }

  // ✅ START: Automated email monitoring system
  async startEmailMonitoring() {
    if (this.isRunning) {
      console.log('📧 Email monitoring already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting automated email monitoring system...');

    // Run immediately
    await this.checkAndSendNotifications();

    // Set up recurring checks
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.checkAndSendNotifications();
      } catch (error) {
        console.error('❌ Error in monitoring cycle:', error);
      }
    }, this.checkInterval);

    console.log('✅ Automated email monitoring started - checking every 24 hours');
  }

  async stopEmailMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isRunning = false;
    console.log('⏹️ Email monitoring system stopped');
  }

  // ✅ CORE: Check procedures and send notifications
  async checkAndSendNotifications() {
    try {
      console.log('🔍 Checking procedures for automated notifications...');
      
      const procedures = await this.getProcedures();
      const notifications = await this.analyzeNotifications(procedures);
      
      for (const notification of notifications) {
        await this.sendNotification(notification);
        await this.sleep(2000); // Rate limiting
      }
      
      await this.logEmailActivity('AUTOMATED_CHECK', 'System', {
        proceduresChecked: procedures.length,
        notificationsSent: notifications.length,
        timestamp: new Date().toISOString()
      });
      
      console.log(`✅ Automated notification check complete: ${notifications.length} sent`);
      
    } catch (error) {
      console.error('❌ Error in automated notification check:', error);
      await this.logEmailActivity('AUTOMATED_CHECK_FAILED', 'System', {
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  // ✅ ANALYZE: Determine what notifications to send
  async analyzeNotifications(procedures) {
    const notifications = [];
    const now = new Date();
    
    for (const procedure of procedures) {
      const expiry = new Date(procedure.expiry);
      const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
      
      // Check if notification needed
      const notificationKey = `${procedure.id}_${procedure.expiry}`;
      const lastSent = await this.getLastNotificationSent(notificationKey);
      
      // Procedure expiring in 30 days
      if (daysLeft > 0 && daysLeft <= 30 && !lastSent.includes('30_day')) {
        notifications.push({
          type: 'expiring_30',
          procedure: procedure,
          daysLeft: daysLeft,
          recipients: [procedure.primary_owner_email, procedure.secondary_owner_email].filter(Boolean),
          key: notificationKey + '_30_day'
        });
      }
      
      // Procedure expiring in 7 days
      if (daysLeft > 0 && daysLeft <= 7 && !lastSent.includes('7_day')) {
        notifications.push({
          type: 'expiring_7',
          procedure: procedure,
          daysLeft: daysLeft,
          recipients: [procedure.primary_owner_email, procedure.secondary_owner_email].filter(Boolean),
          key: notificationKey + '_7_day'
        });
      }
      
      // Procedure expired
      if (daysLeft <= 0 && !lastSent.includes('expired')) {
        notifications.push({
          type: 'expired',
          procedure: procedure,
          daysLeft: Math.abs(daysLeft),
          recipients: [procedure.primary_owner_email, procedure.secondary_owner_email].filter(Boolean),
          key: notificationKey + '_expired'
        });
      }
    }
    
    return notifications;
  }

  // ✅ NEW: Get expiring procedures for dashboard display
  async getExpiringProcedures() {
    try {
      const procedures = await this.getProcedures();
      const now = new Date();
      const expiring = [];
      
      for (const procedure of procedures) {
        const expiry = new Date(procedure.expiry);
        const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
        
        if (daysLeft <= 30) {
          const notificationKey = `${procedure.id}_${procedure.expiry}`;
          const lastSent = await this.getLastNotificationSent(notificationKey);
          
          expiring.push({
            id: procedure.id,
            name: procedure.name,
            owner: procedure.primary_owner,
            ownerEmail: procedure.primary_owner_email,
            expiry: procedure.expiry,
            daysLeft: daysLeft,
            status: daysLeft <= 0 ? 'expired' : daysLeft <= 7 ? 'urgent' : 'warning',
            lob: procedure.lob,
            lastNotificationSent: lastSent,
            willSendNotification: this.shouldSendNotification(daysLeft, lastSent)
          });
        }
      }
      
      return expiring.sort((a, b) => a.daysLeft - b.daysLeft);
      
    } catch (error) {
      console.error('❌ Error getting expiring procedures:', error);
      return [];
    }
  }

  shouldSendNotification(daysLeft, lastSent) {
    if (daysLeft <= 0 && !lastSent.includes('expired')) return true;
    if (daysLeft <= 7 && daysLeft > 0 && !lastSent.includes('7_day')) return true;
    if (daysLeft <= 30 && daysLeft > 7 && !lastSent.includes('30_day')) return true;
    return false;
  }

  // ✅ USER ROLE NOTIFICATIONS: Send emails when roles change
  async triggerUserRoleChangeNotification(userId, userDisplayName, oldRole, newRole, changedBy) {
    try {
      console.log('📧 Triggering user role change notification...', userId);
      
      const emailData = {
        to: [`${userId}@hsbc.com`],
        cc: await this.getAdminEmails(),
        subject: `HSBC Procedures Hub - Role Updated: ${oldRole} → ${newRole}`,
        body: this.generateRoleChangeEmail(userId, userDisplayName, oldRole, newRole, changedBy)
      };

      const result = await this.sendEmailViaSharePoint(emailData);
      
      if (result.success) {
        await this.logEmailActivity('ROLE_CHANGE_NOTIFICATION', changedBy, {
          userId: userId,
          userDisplayName: userDisplayName,
          oldRole: oldRole,
          newRole: newRole,
          timestamp: new Date().toISOString()
        });
      }
      
      return result;
    } catch (error) {
      console.error('❌ Error sending role change notification:', error);
      return { success: false, message: error.message };
    }
  }

  async triggerUserAccessRevokedNotification(userId, userDisplayName, revokedBy, reason) {
    try {
      console.log('📧 Triggering user access revoked notification...', userId);
      
      const emailData = {
        to: [`${userId}@hsbc.com`],
        cc: await this.getAdminEmails(),
        subject: 'HSBC Procedures Hub - Access Revoked',
        body: this.generateAccessRevokedEmail(userId, userDisplayName, revokedBy, reason)
      };

      const result = await this.sendEmailViaSharePoint(emailData);
      
      if (result.success) {
        await this.logEmailActivity('ACCESS_REVOKED_NOTIFICATION', revokedBy, {
          userId: userId,
          userDisplayName: userDisplayName,
          reason: reason,
          timestamp: new Date().toISOString()
        });
      }
      
      return result;
    } catch (error) {
      console.error('❌ Error sending access revoked notification:', error);
      return { success: false, message: error.message };
    }
  }

  // ✅ MANUAL TRIGGERS: Enhanced with logging
  async triggerUserAccessNotification(userId, userDisplayName, grantedByName) {
    try {
      console.log('📧 Triggering user access notification...', userId);
      
      const emailData = {
        to: [`${userId}@hsbc.com`],
        cc: await this.getAdminEmails(),
        subject: 'HSBC Procedures Hub - Access Granted',
        body: this.generateAccessGrantedEmail(userId, userDisplayName, grantedByName)
      };

      const result = await this.sendEmailViaSharePoint(emailData);
      
      if (result.success) {
        await this.logEmailActivity('ACCESS_GRANTED_NOTIFICATION', grantedByName, {
          userId: userId,
          userDisplayName: userDisplayName,
          grantedBy: grantedByName,
          timestamp: new Date().toISOString()
        });
      }
      
      return result;
    } catch (error) {
      console.error('❌ Error sending access notification:', error);
      return { success: false, message: error.message };
    }
  }

  async triggerProcedureUploadNotification(procedureData, analysisResult) {
    try {
      console.log('📧 Triggering procedure upload notification...', procedureData.name);
      
      const recipients = await this.getAllRecipients();
      
      const emailData = {
        to: recipients,
        subject: `New Procedure Uploaded: ${procedureData.name}`,
        body: this.generateProcedureUploadEmail(procedureData, analysisResult)
      };

      const result = await this.sendEmailViaSharePoint(emailData);
      
      if (result.success) {
        await this.logEmailActivity('PROCEDURE_UPLOAD_NOTIFICATION', 'System', {
          procedureName: procedureData.name,
          lob: procedureData.lob,
          qualityScore: analysisResult.score,
          uploadedBy: procedureData.uploaded_by,
          recipientCount: recipients.length,
          timestamp: new Date().toISOString()
        });
      }
      
      return result;
    } catch (error) {
      console.error('❌ Error sending upload notification:', error);
      return { success: false, message: error.message };
    }
  }

  // ✅ EMAIL ACTIVITY LOGGING
  async logEmailActivity(activityType, performedBy, details) {
    try {
      const requestDigest = await this.getFreshRequestDigest();
      
      const logData = {
        __metadata: { type: 'SP.Data.EmailActivityLogListItem' },
        Title: `${activityType}_${new Date().toISOString()}`,
        ActivityType: activityType,
        PerformedBy: performedBy,
        ActivityDetails: JSON.stringify(details),
        ActivityTimestamp: new Date().toISOString(),
        Status: 'SUCCESS'
      };

      const response = await fetch(
        `${this.baseUrl}/_api/web/lists/getbytitle('EmailActivityLog')/items`,
        {
          method: 'POST',
          headers: {
            'Accept': 'application/json; odata=verbose',
            'Content-Type': 'application/json; odata=verbose',
            'X-RequestDigest': requestDigest
          },
          credentials: 'include',
          body: JSON.stringify(logData)
        }
      );

      if (!response.ok) {
        console.warn('⚠️ Could not log email activity (list may not exist)');
      }
      
    } catch (error) {
      console.error('❌ Error logging email activity:', error);
    }
  }

  async getEmailActivityLog(limit = 50) {
    try {
      const response = await fetch(
        `${this.baseUrl}/_api/web/lists/getbytitle('EmailActivityLog')/items?$select=*&$orderby=ActivityTimestamp desc&$top=${limit}`,
        {
          headers: { 'Accept': 'application/json; odata=verbose' },
          credentials: 'include'
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data.d.results.map(item => ({
          id: item.Id,
          activityType: item.ActivityType,
          performedBy: item.PerformedBy,
          details: this.safeJsonParse(item.ActivityDetails, {}),
          timestamp: item.ActivityTimestamp,
          status: item.Status || 'SUCCESS',
          readableActivity: this.getReadableActivity(item.ActivityType, this.safeJsonParse(item.ActivityDetails, {}))
        }));
      }
      
      return [];
    } catch (error) {
      console.error('❌ Error getting email activity log:', error);
      return [];
    }
  }

  getReadableActivity(activityType, details) {
    switch (activityType) {
      case 'ACCESS_GRANTED_NOTIFICATION':
        return `Access granted to ${details.userDisplayName || details.userId} by ${details.grantedBy}`;
      case 'ACCESS_REVOKED_NOTIFICATION':
        return `Access revoked for ${details.userDisplayName || details.userId} by ${details.performedBy}`;
      case 'ROLE_CHANGE_NOTIFICATION':
        return `Role changed for ${details.userDisplayName || details.userId}: ${details.oldRole} → ${details.newRole}`;
      case 'PROCEDURE_UPLOAD_NOTIFICATION':
        return `New procedure uploaded: ${details.procedureName} (${details.lob})`;
      case 'PROCEDURE_EXPIRY_NOTIFICATION':
        return `Expiry notification sent for: ${details.procedureName} (${details.daysLeft} days)`;
      case 'AUTOMATED_CHECK':
        return `Automated check: ${details.proceduresChecked} procedures checked, ${details.notificationsSent} notifications sent`;
      case 'AUTOMATED_CHECK_FAILED':
        return `Automated check failed: ${details.error}`;
      default:
        return `${activityType.replace(/_/g, ' ').toLowerCase()}`;
    }
  }

  // ✅ SEND: Enhanced notification sending with logging
  async sendNotification(notification) {
    try {
      console.log(`📧 Sending ${notification.type} notification for ${notification.procedure.name}`);
      
      const emailData = {
        to: notification.recipients,
        cc: await this.getGlobalCCList(),
        subject: this.getSubjectForType(notification),
        body: this.getBodyForType(notification)
      };
      
      const result = await this.sendEmailViaSharePoint(emailData);
      
      if (result.success) {
        // Mark as sent
        await this.markNotificationSent(notification.key);
        
        // Log the activity
        await this.logEmailActivity('PROCEDURE_EXPIRY_NOTIFICATION', 'System', {
          procedureName: notification.procedure.name,
          procedureId: notification.procedure.id,
          notificationType: notification.type,
          daysLeft: notification.daysLeft,
          recipientCount: notification.recipients.length,
          lob: notification.procedure.lob,
          timestamp: new Date().toISOString()
        });
        
        console.log(`✅ ${notification.type} notification sent successfully`);
      }
      
      return result;
      
    } catch (error) {
      console.error(`❌ Error sending ${notification.type} notification:`, error);
      
      await this.logEmailActivity('NOTIFICATION_FAILED', 'System', {
        procedureName: notification.procedure.name,
        notificationType: notification.type,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      return { success: false, message: error.message };
    }
  }

  // ✅ EMAIL TEMPLATES: Enhanced templates
  generateRoleChangeEmail(userId, userDisplayName, oldRole, newRole, changedBy) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #ff9800, #f57c00); padding: 20px; color: white;">
          <h1 style="margin: 0; font-size: 24px;">HSBC Procedures Hub</h1>
          <p style="margin: 5px 0 0 0; opacity: 0.9;">Role Update Notification</p>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #e65100; margin-top: 0;">🔄 Your Role Has Been Updated</h2>
          <p style="color: #666; line-height: 1.6;">
            Your access level in the HSBC Procedures Hub has been updated by an administrator.
          </p>
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #ff9800; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #e65100;">Role Change Details</h3>
            <p style="margin: 5px 0; color: #666;"><strong>User:</strong> ${userDisplayName} (${userId})</p>
            <p style="margin: 5px 0; color: #666;"><strong>Previous Role:</strong> ${oldRole}</p>
            <p style="margin: 5px 0; color: #666;"><strong>New Role:</strong> ${newRole}</p>
            <p style="margin: 5px 0; color: #666;"><strong>Changed By:</strong> ${changedBy}</p>
            <p style="margin: 5px 0; color: #666;"><strong>Date:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            This email was sent automatically by the HSBC Procedures Hub system.
          </p>
        </div>
      </div>
    `;
  }

  generateAccessRevokedEmail(userId, userDisplayName, revokedBy, reason) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #f44336, #d32f2f); padding: 20px; color: white;">
          <h1 style="margin: 0; font-size: 24px;">HSBC Procedures Hub</h1>
          <p style="margin: 5px 0 0 0; opacity: 0.9;">Access Revocation Notice</p>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #c62828; margin-top: 0;">🚫 Access Has Been Revoked</h2>
          <p style="color: #666; line-height: 1.6;">
            Your access to the HSBC Procedures Hub has been revoked by an administrator.
          </p>
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #f44336; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #c62828;">Revocation Details</h3>
            <p style="margin: 5px 0; color: #666;"><strong>User:</strong> ${userDisplayName} (${userId})</p>
            <p style="margin: 5px 0; color: #666;"><strong>Revoked By:</strong> ${revokedBy}</p>
            <p style="margin: 5px 0; color: #666;"><strong>Date:</strong> ${new Date().toLocaleString()}</p>
            ${reason ? `<p style="margin: 5px 0; color: #666;"><strong>Reason:</strong> ${reason}</p>` : ''}
          </div>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            If you believe this is an error, please contact your system administrator.
          </p>
        </div>
      </div>
    `;
  }

  generateAccessGrantedEmail(userId, userDisplayName, grantedByName) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #4caf50, #388e3c); padding: 20px; color: white;">
          <h1 style="margin: 0; font-size: 24px;">HSBC Procedures Hub</h1>
          <p style="margin: 5px 0 0 0; opacity: 0.9;">Welcome to the Team</p>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #2e7d32; margin-top: 0;">🎉 Access Granted Successfully</h2>
          <p style="color: #666; line-height: 1.6;">
            Welcome to the HSBC Procedures Hub! You have been granted access by an administrator.
          </p>
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #4caf50; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #2e7d32;">Access Details</h3>
            <p style="margin: 5px 0; color: #666;"><strong>User:</strong> ${userDisplayName} (${userId})</p>
            <p style="margin: 5px 0; color: #666;"><strong>Granted By:</strong> ${grantedByName}</p>
            <p style="margin: 5px 0; color: #666;"><strong>Date:</strong> ${new Date().toLocaleString()}</p>
            <p style="margin: 5px 0; color: #666;"><strong>System URL:</strong> ${this.baseUrl}</p>
          </div>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            You can now log in and start using the procedures management system.
          </p>
        </div>
      </div>
    `;
  }

  generateProcedureUploadEmail(procedureData, analysisResult) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #2196f3, #1976d2); padding: 20px; color: white;">
          <h1 style="margin: 0; font-size: 24px;">HSBC Procedures Hub</h1>
          <p style="margin: 5px 0 0 0; opacity: 0.9;">New Procedure Notification</p>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #1565c0; margin-top: 0;">📤 New Procedure Uploaded</h2>
          <p style="color: #666; line-height: 1.6;">
            A new procedure has been uploaded to the HSBC Procedures Hub.
          </p>
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #2196f3; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #1565c0;">${procedureData.name}</h3>
            <p style="margin: 5px 0; color: #666;"><strong>Primary Owner:</strong> ${procedureData.primary_owner}</p>
            <p style="margin: 5px 0; color: #666;"><strong>Line of Business:</strong> ${procedureData.lob}</p>
            <p style="margin: 5px 0; color: #666;"><strong>Quality Score:</strong> ${analysisResult.score}%</p>
            <p style="margin: 5px 0; color: #666;"><strong>Upload Date:</strong> ${new Date().toLocaleString()}</p>
            <p style="margin: 5px 0; color: #666;"><strong>Expiry Date:</strong> ${new Date(procedureData.expiry).toLocaleDateString()}</p>
          </div>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            This email was sent automatically by the HSBC Procedures Hub system.
          </p>
        </div>
      </div>
    `;
  }

  getSubjectForType(notification) {
    const templates = {
      expiring_30: `[REMINDER] Procedure Expiring in ${notification.daysLeft} Days: ${notification.procedure.name}`,
      expiring_7: `[URGENT] Procedure Expiring in ${notification.daysLeft} Days: ${notification.procedure.name}`,
      expired: `[EXPIRED] Procedure Expired ${notification.daysLeft} Days Ago: ${notification.procedure.name}`
    };
    
    return templates[notification.type] || `Procedure Notification: ${notification.procedure.name}`;
  }

  getBodyForType(notification) {
    const { procedure, daysLeft, type } = notification;
    
    const baseTemplate = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #d40000, #b30000); padding: 20px; color: white;">
          <h1 style="margin: 0; font-size: 24px;">HSBC Procedures Hub</h1>
          <p style="margin: 5px 0 0 0; opacity: 0.9;">Automated Notification</p>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          ${this.getContentForType(notification)}
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #d40000; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #d40000;">${procedure.name}</h3>
            <p style="margin: 5px 0; color: #666;"><strong>Primary Owner:</strong> ${procedure.primary_owner}</p>
            <p style="margin: 5px 0; color: #666;"><strong>Expiry Date:</strong> ${new Date(procedure.expiry).toLocaleDateString()}</p>
            <p style="margin: 5px 0; color: #666;"><strong>Line of Business:</strong> ${procedure.lob}</p>
            <p style="margin: 5px 0; color: #666;"><strong>Quality Score:</strong> ${procedure.score || 0}%</p>
          </div>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            This email was sent automatically by the HSBC Procedures Hub monitoring system.
          </p>
        </div>
      </div>
    `;
    
    return baseTemplate;
  }

  getContentForType(notification) {
    const { type, daysLeft } = notification;
    
    switch (type) {
      case 'expiring_30':
        return `
          <h2 style="color: #ff9800; margin-top: 0;">⏰ Procedure Expiring Soon</h2>
          <p style="color: #666; line-height: 1.6;">
            The following procedure will expire in <strong>${daysLeft} days</strong>. Please review and update as necessary.
          </p>
        `;
      case 'expiring_7':
        return `
          <h2 style="color: #f44336; margin-top: 0;">🚨 Urgent: Procedure Expiring Soon</h2>
          <p style="color: #666; line-height: 1.6;">
            <strong>URGENT:</strong> The following procedure will expire in <strong>${daysLeft} days</strong>. Immediate action required.
          </p>
        `;
      case 'expired':
        return `
          <h2 style="color: #d32f2f; margin-top: 0;">❌ Procedure Expired</h2>
          <p style="color: #666; line-height: 1.6;">
            <strong>EXPIRED:</strong> The following procedure expired <strong>${daysLeft} days ago</strong>. Please update immediately.
          </p>
        `;
      default:
        return `
          <h2 style="color: #333; margin-top: 0;">📋 Procedure Notification</h2>
          <p style="color: #666; line-height: 1.6;">
            Please review the following procedure.
          </p>
        `;
    }
  }

  // ✅ PERSISTENCE: Track sent notifications in SharePoint
  async getLastNotificationSent(notificationKey) {
    try {
      const response = await fetch(
        `${this.baseUrl}/_api/web/lists/getbytitle('NotificationLog')/items?$filter=NotificationKey eq '${notificationKey}'&$orderby=Created desc&$top=1`,
        {
          headers: { 'Accept': 'application/json; odata=verbose' },
          credentials: 'include'
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data.d.results.map(item => item.NotificationType).join(',');
      }
      
      return '';
    } catch (error) {
      console.error('❌ Error getting notification history:', error);
      return '';
    }
  }

  async markNotificationSent(notificationKey) {
    try {
      const requestDigest = await this.getFreshRequestDigest();
      
      const logData = {
        __metadata: { type: 'SP.Data.NotificationLogListItem' },
        Title: notificationKey,
        NotificationKey: notificationKey,
        NotificationType: notificationKey.split('_').pop(),
        SentDate: new Date().toISOString(),
        Status: 'SENT'
      };

      const response = await fetch(
        `${this.baseUrl}/_api/web/lists/getbytitle('NotificationLog')/items`,
        {
          method: 'POST',
         headers: {
           'Accept': 'application/json; odata=verbose',
           'Content-Type': 'application/json; odata=verbose',
           'X-RequestDigest': requestDigest
         },
         credentials: 'include',
         body: JSON.stringify(logData)
       }
     );

     if (!response.ok) {
       console.warn('⚠️ Could not log notification (list may not exist)');
     }
     
   } catch (error) {
     console.error('❌ Error marking notification as sent:', error);
   }
 }

 // ✅ UTILITY METHODS
 sleep(ms) {
   return new Promise(resolve => setTimeout(resolve, ms));
 }

 safeJsonParse(jsonString, defaultValue) {
   try {
     return jsonString ? JSON.parse(jsonString) : defaultValue;
   } catch (error) {
     return defaultValue;
   }
 }

 async getFreshRequestDigest() {
   try {
     const digestUrl = `${this.baseUrl}/_api/contextinfo`;
     const digestResponse = await fetch(digestUrl, {
       method: 'POST',
       headers: {
         'Accept': 'application/json; odata=verbose',
         'Content-Type': 'application/json; odata=verbose'
       },
       credentials: 'include'
     });
     
     if (digestResponse.ok) {
       const digestData = await digestResponse.json();
       return digestData.d.GetContextWebInformation.FormDigestValue;
     }
     
     throw new Error('Cannot get request digest');
   } catch (error) {
     console.error('❌ Error getting request digest:', error);
     throw error;
   }
 }

 async getProcedures() {
   try {
     const response = await fetch(
       `${this.baseUrl}/_api/web/lists/getbytitle('Procedures')/items?$select=*&$orderby=Id desc&$top=1000`,
       {
         method: 'GET',
         headers: { 
           'Accept': 'application/json; odata=verbose',
           'Content-Type': 'application/json; odata=verbose'
         },
         credentials: 'include'
       }
     );

     if (!response.ok) {
       throw new Error(`Failed to fetch procedures: ${response.status}`);
     }

     const data = await response.json();
     return data.d.results.map(this.mapSharePointToModel.bind(this));
     
   } catch (error) {
     console.error('❌ Error fetching procedures:', error);
     return [];
   }
 }

 mapSharePointToModel(spItem) {
   return {
     id: spItem.Id,
     name: spItem.Title,
     expiry: spItem.ExpiryDate,
     primary_owner: spItem.PrimaryOwner,
     primary_owner_email: spItem.PrimaryOwnerEmail,
     secondary_owner: spItem.SecondaryOwner || '',
     secondary_owner_email: spItem.SecondaryOwnerEmail || '',
     lob: spItem.LOB,
     score: spItem.QualityScore || 0,
     uploaded_by: spItem.UploadedBy
   };
 }

 async getGlobalCCList() {
   try {
     const config = await this.getEmailConfig();
     return config.globalCCList.filter(r => r.active).map(r => r.email);
   } catch (error) {
     return ['minaantoun@hsbc.com'];
   }
 }

 async getAllRecipients() {
   try {
     const config = await this.getEmailConfig();
     const recipients = [];
     
     config.globalCCList.filter(r => r.active).forEach(r => recipients.push(r.email));
     config.adminList.filter(r => r.active).forEach(r => recipients.push(r.email));
     
     return [...new Set(recipients)];
   } catch (error) {
     return ['minaantoun@hsbc.com'];
   }
 }

 async getAdminEmails() {
   try {
     const config = await this.getEmailConfig();
     return config.adminList.filter(r => r.active).map(r => r.email);
   } catch (error) {
     return ['minaantoun@hsbc.com'];
   }
 }

 async getEmailConfig() {
   // Your existing getEmailConfig method
   try {
     const response = await fetch(
       `${this.baseUrl}/_api/web/lists/getbytitle('EmailConfiguration')/items?$select=*&$top=1000`,
       {
         method: 'GET',
         headers: { 
           'Accept': 'application/json; odata=verbose',
           'Content-Type': 'application/json; odata=verbose'
         },
         credentials: 'include'
       }
     );

     if (!response.ok) {
       return this.getDefaultEmailConfig();
     }

     const data = await response.json();
     const config = {
       globalCCList: [],
       adminList: [],
       procedureOwnersList: [],
       testEmail: 'minaantoun@hsbc.com'
     };

     data.d.results.forEach(item => {
       switch (item.ConfigType) {
         case 'GlobalCC':
           if (item.EmailAddress) {
             config.globalCCList.push({
               id: item.Id,
               email: item.EmailAddress,
               name: item.DisplayName || item.EmailAddress,
               active: item.IsActive !== false
             });
           }
           break;
         case 'Admin':
           if (item.EmailAddress) {
             config.adminList.push({
               id: item.Id,
               email: item.EmailAddress,
               name: item.DisplayName || item.EmailAddress,
               active: item.IsActive !== false
             });
           }
           break;
         case 'TestEmail':
           if (item.EmailAddress) {
             config.testEmail = item.EmailAddress;
           }
           break;
       }
     });

     return config;
     
   } catch (error) {
     console.error('❌ Error getting email config:', error);
     return this.getDefaultEmailConfig();
   }
 }

 getDefaultEmailConfig() {
   return {
     globalCCList: [],
     adminList: [],
     procedureOwnersList: [],
     testEmail: 'minaantoun@hsbc.com'
   };
 }

 async sendEmailViaSharePoint(emailData) {
   try {
     const requestDigest = await this.getFreshRequestDigest();
     
     const emailPayload = {
       properties: {
         __metadata: { type: 'SP.Utilities.EmailProperties' },
         To: { results: Array.isArray(emailData.to) ? emailData.to : [emailData.to] },
         Subject: emailData.subject,
         Body: emailData.body
       }
     };

     if (emailData.cc && emailData.cc.length > 0) {
       emailPayload.properties.CC = {
         results: Array.isArray(emailData.cc) ? emailData.cc : [emailData.cc]
       };
     }

     const response = await fetch(
       `${this.baseUrl}/_api/SP.Utilities.Utility.SendEmail`,
       {
         method: 'POST',
         headers: {
           'Accept': 'application/json; odata=verbose',
           'Content-Type': 'application/json; odata=verbose',
           'X-RequestDigest': requestDigest
         },
         credentials: 'include',
         body: JSON.stringify(emailPayload)
       }
     );

     if (response.ok) {
       return { success: true, message: 'Email sent via SharePoint API' };
     } else {
       const errorText = await response.text();
       throw new Error(`SharePoint email API failed: ${response.status} - ${errorText}`);
     }
     
   } catch (error) {
     console.error('❌ SharePoint email API error:', error);
     return { success: false, message: error.message };
   }
 }
}

export default EmailNotificationService;
