// services/EmailNotificationService.js - FINAL CHAOS FIX
class EmailNotificationService {
  constructor() {
    this.baseUrl = 'https://teams.global.hsbc/sites/EmployeeEng';
    this.checkInterval = 24 * 60 * 60 * 1000; // 24 hours
    this.isRunning = false;
    this.activeTemplates = new Map();
    this.lastCheckTime = null;
    this.isCurrentlyChecking = false; // ✅ NEW: Prevent overlapping checks
  }

  // ✅ FIXED: Prevent rapid successive checks
  shouldRunCheck() {
    if (this.isCurrentlyChecking) {
      console.log('⏸️ Check already in progress, skipping...');
      return false;
    }

    const now = new Date();
    if (!this.lastCheckTime) {
      this.lastCheckTime = now;
      return true;
    }
    
    const timeSinceLastCheck = now - this.lastCheckTime;
    const minInterval = 30 * 60 * 1000; // Minimum 30 minutes between checks
    
    if (timeSinceLastCheck < minInterval) {
      console.log(`⏸️ Skipping check - only ${Math.round(timeSinceLastCheck / 1000 / 60)} minutes since last check`);
      return false;
    }
    
    this.lastCheckTime = now;
    return true;
  }

  // ✅ FIXED: Get fresh request digest
  async getFreshRequestDigest() {
    try {
      console.log('🔑 Getting fresh request digest...');
      
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
        const requestDigest = digestData.d.GetContextWebInformation.FormDigestValue;
        console.log('✅ Fresh request digest obtained');
        return requestDigest;
      } else {
        const digestElement = document.getElementById('__REQUESTDIGEST');
        const pageDigest = digestElement?.value;
        
        if (pageDigest) {
          console.log('⚠️ Using fallback page digest');
          return pageDigest;
        } else {
          throw new Error(`Cannot get request digest: ${digestResponse.status}`);
        }
      }
    } catch (err) {
      console.error('❌ Error getting request digest:', err);
      throw new Error('Cannot get authentication token: ' + err.message);
    }
  }

  // ✅ COMPLETELY FIXED: Get procedures with proper validation
  async getProcedures() {
    try {
      console.log('📋 Fetching procedures from SharePoint...');
      
      const response = await fetch(
        `${this.baseUrl}/_api/web/lists/getbytitle('Procedures')/items?$select=Id,Title,ExpiryDate,PrimaryOwner,PrimaryOwnerEmail,SecondaryOwner,SecondaryOwnerEmail,LOB,QualityScore,Status,Created&$orderby=Id desc&$top=1000`,
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
        console.error('❌ Failed to fetch procedures:', response.status, response.statusText);
        return [];
      }

      const data = await response.json();
      console.log('📋 Raw SharePoint data received:', data.d.results.length, 'items');

      // ✅ STRICT validation - only include procedures that have ALL required data
      const validProcedures = [];
      
      for (const item of data.d.results) {
        if (item.Id && item.Title && item.ExpiryDate) {
          const mapped = this.mapSharePointToModel(item);
          if (mapped && mapped.expiry && !isNaN(new Date(mapped.expiry).getTime())) {
            validProcedures.push(mapped);
            console.log(`✅ Valid procedure: ${mapped.name} (${mapped.id}) expires ${mapped.expiry}`);
          } else {
            console.warn(`⚠️ Skipping procedure with invalid expiry: ${item.Title} - ${item.ExpiryDate}`);
          }
        } else {
          console.warn(`⚠️ Skipping procedure missing required data:`, {
            Id: item.Id,
            Title: item.Title,
            ExpiryDate: item.ExpiryDate
          });
        }
      }
      
      console.log(`✅ Procedures validation complete: ${validProcedures.length} valid out of ${data.d.results.length} total`);
      return validProcedures;
      
    } catch (error) {
      console.error('❌ Error fetching procedures:', error);
      return [];
    }
  }

  // ✅ FIXED: Strict mapping with validation
  mapSharePointToModel(spItem) {
    if (!spItem || !spItem.Id || !spItem.Title || !spItem.ExpiryDate) {
      console.warn('⚠️ Cannot map item missing required fields:', spItem);
      return null;
    }

    try {
      // Validate expiry date
      const expiryDate = new Date(spItem.ExpiryDate);
      if (isNaN(expiryDate.getTime())) {
        console.warn('⚠️ Invalid expiry date:', spItem.ExpiryDate);
        return null;
      }

      return {
        id: spItem.Id,
        name: spItem.Title,
        expiry: spItem.ExpiryDate,
        primary_owner: spItem.PrimaryOwner || 'Unknown Owner',
        primary_owner_email: spItem.PrimaryOwnerEmail || '',
        secondary_owner: spItem.SecondaryOwner || '',
        secondary_owner_email: spItem.SecondaryOwnerEmail || '',
        lob: spItem.LOB || 'Unknown',
        score: spItem.QualityScore || 0,
        status: spItem.Status || 'Active',
        created: spItem.Created || new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error mapping SharePoint item:', error);
      return null;
    }
  }

  // ✅ FIXED: Template loading
  async loadActiveTemplates() {
    try {
      console.log('📧 Loading active email templates...');
      
      const response = await fetch(
        `${this.baseUrl}/_api/web/lists/getbytitle('EmailTemplates')/items?$select=Id,TemplateType,Subject,HTMLContent,IsActive&$filter=IsActive eq true`,
        {
          headers: { 'Accept': 'application/json; odata=verbose' },
          credentials: 'include'
        }
      );

      if (response.ok) {
        const data = await response.json();
        this.activeTemplates.clear();
        
        data.d.results.forEach(template => {
          if (template.TemplateType && template.IsActive) {
            this.activeTemplates.set(template.TemplateType, {
              id: template.Id,
              type: template.TemplateType,
              subject: template.Subject || '',
              htmlContent: template.HTMLContent || '',
              isActive: template.IsActive
            });
          }
        });
        
        console.log('✅ Active templates loaded:', this.activeTemplates.size);
        return this.activeTemplates;
      } else {
        console.warn('⚠️ EmailTemplates list not accessible, disabling notifications');
        return new Map();
      }
    } catch (error) {
      console.error('❌ Error loading active templates:', error);
      return new Map();
    }
  }

  // ✅ FIXED: Strict template checking
  isTemplateActive(templateType) {
    if (this.activeTemplates.size === 0) {
      console.log(`❌ No templates loaded, disabling ${templateType}`);
      return false;
    }
    
    const template = this.activeTemplates.get(templateType);
    const isActive = template && template.isActive;
    
    console.log(`🔍 Template ${templateType} active status:`, isActive);
    return isActive;
  }

  // ✅ COMPLETELY REWRITTEN: The main check function - source of all problems
  async checkAndSendNotifications() {
    // ✅ PREVENT overlapping checks
    if (this.isCurrentlyChecking) {
      console.log('⏸️ Check already in progress, aborting...');
      return;
    }

    if (!this.shouldRunCheck()) {
      return;
    }

    this.isCurrentlyChecking = true;
    
    try {
      console.log('🔍 ========== STARTING AUTOMATED NOTIFICATION CHECK ==========');
      
      // Step 1: Load active templates
      await this.loadActiveTemplates();
      console.log(`📧 Active templates: ${this.activeTemplates.size}`);
      
      // Step 2: Get valid procedures
      const procedures = await this.getProcedures();
      console.log(`📋 Valid procedures loaded: ${procedures.length}`);
      
      // Step 3: If no procedures, log and exit - DO NOT SEND ANY EMAILS
      if (procedures.length === 0) {
        console.log('⚠️ No valid procedures found - NO EMAILS WILL BE SENT');
        await this.logEmailActivity('AUTOMATED_CHECK', 'System', {
          proceduresChecked: 0,
          validProceduresFound: 0,
          notificationsSent: 0,
          message: 'No valid procedures with expiry dates found',
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      // Step 4: Analyze which notifications to send
      const notifications = await this.analyzeNotifications(procedures);
      console.log(`📊 Notifications to send: ${notifications.length}`);
      
      // Step 5: If no notifications needed, log and exit
      if (notifications.length === 0) {
        console.log('✅ No notifications needed');
        await this.logEmailActivity('AUTOMATED_CHECK', 'System', {
          proceduresChecked: procedures.length,
          validProceduresFound: procedures.length,
          notificationsSent: 0,
          notificationAnalyzed: 0,
          message: 'No notifications needed',
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      // Step 6: Send notifications one by one
      let successCount = 0;
      let failureCount = 0;
      
      for (const notification of notifications) {
        console.log(`📧 Processing notification for: ${notification.procedure.name}`);
        const result = await this.sendNotification(notification);
        if (result.success) {
          successCount++;
          console.log(`✅ Email sent successfully to ${notification.recipients.join(', ')}`);
        } else {
          failureCount++;
          console.log(`❌ Email failed: ${result.message}`);
        }
        
        // Rate limiting
        await this.sleep(3000);
      }
      
      // Step 7: Log final results
      await this.logEmailActivity('AUTOMATED_CHECK', 'System', {
        proceduresChecked: procedures.length,
        validProceduresFound: procedures.length,
        notificationsAnalyzed: notifications.length,
        notificationsSent: successCount,
        notificationsFailed: failureCount,
        activeTemplatesCount: this.activeTemplates.size,
        timestamp: new Date().toISOString(),
        systemStatus: successCount > 0 ? 'NOTIFICATIONS_SENT' : 'NO_NOTIFICATIONS_SENT'
      });
      
      console.log(`✅ ========== CHECK COMPLETE: ${successCount} sent, ${failureCount} failed ==========`);
      
    } catch (error) {
      console.error('❌ ========== CHECK FAILED ==========', error);
      await this.logEmailActivity('AUTOMATED_CHECK_FAILED', 'System', {
        error: error.message || 'Unknown error',
        timestamp: new Date().toISOString(),
        errorType: error.name || 'Error'
      });
    } finally {
      this.isCurrentlyChecking = false;
    }
  }

  // ✅ FIXED: Better notification analysis
  async analyzeNotifications(procedures) {
    const notifications = [];
    const now = new Date();
    
    console.log(`🔍 Analyzing ${procedures.length} procedures for notifications...`);
    
    for (const procedure of procedures) {
      try {
        const expiry = new Date(procedure.expiry);
        const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
        
        console.log(`🔍 ${procedure.name}: ${daysLeft} days left`);
        
        const baseKey = `${procedure.id}_${procedure.expiry}`;
        
        // Check 30-day notification
        if (daysLeft > 0 && daysLeft <= 30) {
          const key30 = baseKey + '_30_day';
          const lastSent30 = await this.getLastNotificationSent(key30);
          
          if (!lastSent30.includes('30_day') && this.isTemplateActive('procedure-expiring-30')) {
            const recipients = this.getValidRecipients(procedure);
            if (recipients.length > 0) {
              notifications.push({
                type: 'expiring_30',
                procedure: procedure,
                daysLeft: daysLeft,
                recipients: recipients,
                key: key30
              });
              console.log(`✅ Will send 30-day notification for: ${procedure.name}`);
            }
          }
        }
        
        // Check 7-day notification
        if (daysLeft > 0 && daysLeft <= 7) {
          const key7 = baseKey + '_7_day';
          const lastSent7 = await this.getLastNotificationSent(key7);
          
          if (!lastSent7.includes('7_day') && this.isTemplateActive('procedure-expiring-7')) {
            const recipients = this.getValidRecipients(procedure);
            if (recipients.length > 0) {
              notifications.push({
                type: 'expiring_7',
                procedure: procedure,
                daysLeft: daysLeft,
                recipients: recipients,
                key: key7
              });
              console.log(`✅ Will send 7-day notification for: ${procedure.name}`);
            }
          }
        }
        
        // Check expired notification
        if (daysLeft <= 0) {
          const keyExpired = baseKey + '_expired';
          const lastSentExpired = await this.getLastNotificationSent(keyExpired);
          
          if (!lastSentExpired.includes('expired') && this.isTemplateActive('procedure-expired')) {
            const recipients = this.getValidRecipients(procedure);
            if (recipients.length > 0) {
              notifications.push({
                type: 'expired',
                procedure: procedure,
                daysLeft: Math.abs(daysLeft),
                recipients: recipients,
                key: keyExpired
              });
              console.log(`✅ Will send expired notification for: ${procedure.name}`);
            }
          }
        }
        
      } catch (error) {
        console.error(`❌ Error analyzing procedure ${procedure.name}:`, error);
        continue;
      }
    }
    
    console.log(`📊 Analysis complete: ${notifications.length} notifications to send`);
    return notifications;
  }

  // ✅ FIXED: Strict notification sending
  async sendNotification(notification) {
    try {
      const { procedure, daysLeft, recipients, type, key } = notification;
      
      console.log(`📧 Sending ${type} notification for "${procedure.name}" (${daysLeft} days)`);
      
      if (!recipients || recipients.length === 0) {
        console.log(`❌ No valid recipients, skipping`);
        return { success: false, message: 'No valid recipients' };
      }
      
      const emailData = {
        to: recipients,
        subject: this.getSubjectForType(notification),
        body: this.getBodyForType(notification)
      };
      
      const result = await this.sendEmailViaSharePoint(emailData);
      
      if (result.success) {
        // Mark as sent
        await this.markNotificationSent(key);
        
        // Log activity with COMPLETE details
        await this.logEmailActivity('PROCEDURE_EXPIRY_NOTIFICATION', 'System', {
          procedureName: procedure.name,
          procedureId: procedure.id,
          notificationType: type,
          daysLeft: daysLeft,
          recipients: recipients,
          recipientCount: recipients.length,
          lob: procedure.lob,
          primaryOwner: procedure.primary_owner,
          expiryDate: procedure.expiry,
          timestamp: new Date().toISOString(),
          notificationKey: key
        });
        
        console.log(`✅ Notification sent successfully`);
      }
      
      return result;
      
    } catch (error) {
      console.error(`❌ Error sending notification:`, error);
      return { success: false, message: error.message };
    }
  }

  // ✅ All other methods remain the same...
  async getLastNotificationSent(notificationKey) {
    try {
      const response = await fetch(
        `${this.baseUrl}/_api/web/lists/getbytitle('NotificationLog')/items?$filter=NotificationKey eq '${notificationKey}'&$select=NotificationType,SentDate&$orderby=SentDate desc&$top=10`,
        {
          headers: { 'Accept': 'application/json; odata=verbose' },
          credentials: 'include'
        }
      );

      if (response.ok) {
        const data = await response.json();
        const sentTypes = data.d.results.map(item => item.NotificationType).join(',');
        return sentTypes;
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
      const notificationType = notificationKey.split('_').pop();
      
      const logData = {
        __metadata: { type: 'SP.Data.NotificationLogListItem' },
        Title: `${notificationKey}_${Date.now()}`,
        NotificationKey: notificationKey,
        NotificationType: notificationType,
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

      if (response.ok) {
        console.log(`✅ Marked notification as sent: ${notificationKey}`);
      }
      
    } catch (error) {
      console.error('❌ Error marking notification as sent:', error);
    }
  }

  async logEmailActivity(activityType, performedBy, details) {
    try {
      const requestDigest = await this.getFreshRequestDigest();
      
      const safeDetails = {
        procedureName: details.procedureName || 'System Action',
        procedureId: details.procedureId || 'N/A',
        notificationType: details.notificationType || 'System',
        timestamp: details.timestamp || new Date().toISOString(),
        systemVersion: 'EmailNotificationService v3.0',
        ...details
      };
      
      const logData = {
        __metadata: { type: 'SP.Data.EmailActivityLogListItem' },
        Title: `${activityType}_${safeDetails.procedureName}_${Date.now()}`,
        ActivityType: activityType,
        PerformedBy: performedBy || 'System',
        ActivityDetails: JSON.stringify(safeDetails),
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

      if (response.ok) {
        console.log(`✅ Email activity logged: ${activityType}`);
      }
      
    } catch (error) {
      console.error('❌ Error logging email activity:', error);
    }
  }

  async sendEmailViaSharePoint(emailData) {
    try {
      const requestDigest = await this.getFreshRequestDigest();

      const emailPayload = {
        properties: {
          __metadata: { type: 'SP.Utilities.EmailProperties' },
          To: {
            results: Array.isArray(emailData.to) ? emailData.to : [emailData.to]
          },
          Subject: emailData.subject,
          Body: emailData.body
        }
      };

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
        console.log('✅ Email sent successfully via SharePoint API');
        return { success: true, message: 'Email sent via SharePoint API' };
      } else {
        const errorText = await response.text();
        console.error('❌ SharePoint email API error:', response.status, errorText);
        return { success: false, message: `SharePoint email API failed: ${response.status}` };
      }
      
    } catch (error) {
      console.error('❌ SharePoint email API error:', error);
      return { success: false, message: error.message };
    }
  }

  getValidRecipients(procedure) {
    const recipients = [];
    
    if (procedure.primary_owner_email && this.isValidEmail(procedure.primary_owner_email)) {
      recipients.push(procedure.primary_owner_email);
    }
    
    if (procedure.secondary_owner_email && 
        this.isValidEmail(procedure.secondary_owner_email) && 
        !recipients.includes(procedure.secondary_owner_email)) {
      recipients.push(procedure.secondary_owner_email);
    }
    
    return recipients;
  }

  isValidEmail(email) {
    if (!email || typeof email !== 'string') return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  getSubjectForType(notification) {
    const { procedure, daysLeft, type } = notification;
    const procedureName = procedure.name;
    
    const templates = {
      expiring_30: `[REMINDER] ${procedureName} expires in ${daysLeft} days`,
      expiring_7: `[URGENT] ${procedureName} expires in ${daysLeft} days - Action Required`,
      expired: `[EXPIRED] ${procedureName} expired ${daysLeft} days ago - Immediate Action Required`
    };
    
    return templates[type] || `Procedure Notification: ${procedureName}`;
  }

  getBodyForType(notification) {
    const { procedure, daysLeft, type } = notification;
    const procedureName = procedure.name;
    const primaryOwner = procedure.primary_owner;
    const lob = procedure.lob;
    const expiryDate = new Date(procedure.expiry).toLocaleDateString();
    
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #d40000, #b30000); padding: 20px; color: white;">
          <h1 style="margin: 0; font-size: 24px;">HSBC Procedures Hub</h1>
          <p style="margin: 5px 0 0 0; opacity: 0.9;">Automated Notification</p>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333; margin-top: 0;">📋 Procedure ${type === 'expired' ? 'Expired' : 'Expiring Soon'}</h2>
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #d40000; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #d40000;">${procedureName}</h3>
            <p style="margin: 5px 0; color: #666;"><strong>Primary Owner:</strong> ${primaryOwner}</p>
            <p style="margin: 5px 0; color: #666;"><strong>Expiry Date:</strong> ${expiryDate}</p>
            <p style="margin: 5px 0; color: #666;"><strong>Line of Business:</strong> ${lob}</p>
            <p style="margin: 5px 0; color: #666;"><strong>Days ${daysLeft <= 0 ? 'Overdue' : 'Left'}:</strong> ${daysLeft}</p>
          </div>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            This email was sent automatically by the HSBC Procedures Hub monitoring system.
          </p>
        </div>
      </div>
    `;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async startEmailMonitoring() {
    if (this.isRunning) {
      console.log('📧 Email monitoring already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting enhanced email monitoring system...');

    try {
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

      console.log('✅ Enhanced email monitoring started - checking every 24 hours');
      
    } catch (error) {
      console.error('❌ Error starting email monitoring:', error);
      this.isRunning = false;
    }
  }

  async stopEmailMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isRunning = false;
    this.isCurrentlyChecking = false;
    console.log('⏹️ Email monitoring system stopped');
  }

  // Stub methods for compatibility
  async triggerUserAccessNotification() { return { success: true }; }
  async triggerUserRoleChangeNotification() { return { success: true }; }
  async triggerUserAccessRevokedNotification() { return { success: true }; }
  async triggerProcedureUploadNotification() { return { success: true }; }
  async getEmailActivityLog() { return []; }
  async getExpiringProcedures() { return []; }
  safeJsonParse(jsonString, defaultValue) {
    try {
      return jsonString ? JSON.parse(jsonString) : defaultValue;
    } catch (error) {
      return defaultValue;
    }
  }
}

export default EmailNotificationService;
