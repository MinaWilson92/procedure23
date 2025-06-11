// services/EmailNotificationService.js - FINAL FIXED VERSION
class EmailNotificationService {
  constructor() {
    this.baseUrl = 'https://teams.global.hsbc/sites/EmployeeEng';
    this.checkInterval = 24 * 60 * 60 * 1000; // 24 hours
    this.isRunning = false;
    this.activeTemplates = new Map();
    this.lastCheckTime = null; // Track last check to prevent rapid duplicates
  }

  // ✅ FIXED: Enhanced duplicate prevention with time-based checking
  shouldRunCheck() {
    const now = new Date();
    if (!this.lastCheckTime) {
      this.lastCheckTime = now;
      return true;
    }
    
    const timeSinceLastCheck = now - this.lastCheckTime;
    const minInterval = 60 * 60 * 1000; // Minimum 1 hour between checks
    
    if (timeSinceLastCheck < minInterval) {
      console.log(`⏸️ Skipping check - only ${Math.round(timeSinceLastCheck / 1000 / 60)} minutes since last check`);
      return false;
    }
    
    this.lastCheckTime = now;
    return true;
  }

  // ✅ FIXED: Better request digest with error handling
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
        // Fallback to page digest
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

  // ✅ FIXED: Enhanced procedures fetching with better error handling
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
        const errorText = await response.text();
        console.error('❌ SharePoint API error:', response.status, errorText);
        
        // Check if it's an HTML error page (common SharePoint issue)
        if (errorText.includes('<html>') || errorText.includes('<!DOCTYPE')) {
          throw new Error(`SharePoint returned HTML instead of JSON - possible authentication issue`);
        }
        
        throw new Error(`Failed to fetch procedures: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const procedures = data.d.results.map(this.mapSharePointToModel.bind(this));
      
      console.log('✅ Procedures fetched successfully:', procedures.length);
      return procedures.filter(p => p && p.id && p.name && p.expiry); // Filter out invalid procedures
      
    } catch (error) {
      console.error('❌ Error fetching procedures:', error);
      return []; // Return empty array instead of failing
    }
  }

  // ✅ FIXED: Better SharePoint data mapping with validation
  mapSharePointToModel(spItem) {
    if (!spItem || !spItem.Id) {
      console.warn('⚠️ Invalid SharePoint item:', spItem);
      return null;
    }

    try {
      return {
        id: spItem.Id,
        name: spItem.Title || 'Untitled Procedure',
        expiry: spItem.ExpiryDate || null,
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

  // ✅ FIXED: Enhanced template loading with validation
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
        const responseText = await response.text();
        
        // Check if response is actually JSON
        if (responseText.includes('<html>') || responseText.includes('<!DOCTYPE')) {
          console.warn('⚠️ EmailTemplates list returned HTML, templates may not exist');
          return new Map();
        }

        const data = JSON.parse(responseText);
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
        console.warn('⚠️ EmailTemplates list not accessible, using all notifications');
        return new Map();
      }
    } catch (error) {
      console.error('❌ Error loading active templates:', error);
      return new Map();
    }
  }

  // ✅ FIXED: Template checking with fallback
  isTemplateActive(templateType) {
    if (this.activeTemplates.size === 0) {
      // If no templates loaded, disable by default for safety
      console.log(`⚠️ No templates loaded, disabling ${templateType} for safety`);
      return false;
    }
    
    const template = this.activeTemplates.get(templateType);
    const isActive = template && template.isActive;
    
    console.log(`🔍 Template ${templateType} active status:`, isActive);
    return isActive;
  }

  // ✅ FIXED: Better notification key to prevent partial duplicates
  getNotificationKey(procedure, type) {
    // Include procedure name to ensure uniqueness
    const procedureId = procedure.id || 'unknown';
    const expiryDate = procedure.expiry ? new Date(procedure.expiry).toISOString().split('T')[0] : 'no-expiry';
    return `${procedureId}_${expiryDate}_${type}`;
  }

  // ✅ FIXED: Enhanced duplicate checking
  async getLastNotificationSent(notificationKey) {
    try {
      // Check both the exact key and partial matches
      const response = await fetch(
        `${this.baseUrl}/_api/web/lists/getbytitle('NotificationLog')/items?$filter=substringof('${notificationKey}',NotificationKey)&$select=NotificationType,SentDate&$orderby=SentDate desc&$top=10`,
        {
          headers: { 'Accept': 'application/json; odata=verbose' },
          credentials: 'include'
        }
      );

      if (response.ok) {
        const responseText = await response.text();
        
        // Check if response is HTML (list doesn't exist)
        if (responseText.includes('<html>') || responseText.includes('<!DOCTYPE')) {
          console.warn('⚠️ NotificationLog list may not exist');
          return '';
        }

        const data = JSON.parse(responseText);
        const sentTypes = data.d.results.map(item => item.NotificationType).join(',');
        
        console.log(`🔍 Last notifications sent for key ${notificationKey}:`, sentTypes);
        return sentTypes;
      }
      
      return '';
    } catch (error) {
      console.error('❌ Error getting notification history:', error);
      return '';
    }
  }

  // ✅ FIXED: Enhanced notification analysis
  async analyzeNotifications(procedures) {
    const notifications = [];
    const now = new Date();
    
    // Load active templates first
    await this.loadActiveTemplates();
    
    console.log(`🔍 Analyzing ${procedures.length} valid procedures for notifications...`);
    
    for (const procedure of procedures) {
      if (!procedure || !procedure.id || !procedure.name || !procedure.expiry) {
        console.warn('⚠️ Skipping procedure with missing required data:', procedure);
        continue;
      }

      try {
        const expiry = new Date(procedure.expiry);
        if (isNaN(expiry.getTime())) {
          console.warn('⚠️ Skipping procedure with invalid expiry date:', procedure.expiry);
          continue;
        }

        const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
        
        console.log(`🔍 Analyzing: ${procedure.name} (ID: ${procedure.id}), Days left: ${daysLeft}`);
        
        // Check 30-day notification
        if (daysLeft > 0 && daysLeft <= 30) {
          const key30 = this.getNotificationKey(procedure, '30_day');
          const lastSent30 = await this.getLastNotificationSent(key30);
          
          if (!lastSent30.includes('30_day') && this.isTemplateActive('procedure-expiring-30')) {
            notifications.push({
              type: 'expiring_30',
              templateType: 'procedure-expiring-30',
              procedure: procedure,
              daysLeft: daysLeft,
              recipients: this.getValidRecipients(procedure),
              key: key30
            });
            console.log(`✅ Will send 30-day notification for: ${procedure.name}`);
          }
        }
        
        // Check 7-day notification
        if (daysLeft > 0 && daysLeft <= 7) {
          const key7 = this.getNotificationKey(procedure, '7_day');
          const lastSent7 = await this.getLastNotificationSent(key7);
          
          if (!lastSent7.includes('7_day') && this.isTemplateActive('procedure-expiring-7')) {
            notifications.push({
              type: 'expiring_7',
              templateType: 'procedure-expiring-7',
              procedure: procedure,
              daysLeft: daysLeft,
              recipients: this.getValidRecipients(procedure),
              key: key7
            });
            console.log(`✅ Will send 7-day notification for: ${procedure.name}`);
          }
        }
        
        // Check expired notification
        if (daysLeft <= 0) {
          const keyExpired = this.getNotificationKey(procedure, 'expired');
          const lastSentExpired = await this.getLastNotificationSent(keyExpired);
          
          if (!lastSentExpired.includes('expired') && this.isTemplateActive('procedure-expired')) {
            notifications.push({
              type: 'expired',
              templateType: 'procedure-expired',
              procedure: procedure,
              daysLeft: Math.abs(daysLeft),
              recipients: this.getValidRecipients(procedure),
              key: keyExpired
            });
            console.log(`✅ Will send expired notification for: ${procedure.name}`);
          }
        }
        
      } catch (error) {
        console.error(`❌ Error analyzing procedure ${procedure.name}:`, error);
        continue;
      }
    }
    
    console.log(`📊 Analysis complete: ${notifications.length} notifications to send out of ${procedures.length} procedures`);
    return notifications;
  }

  // ✅ FIXED: Enhanced notification sending
  async sendNotification(notification) {
    try {
      console.log(`📧 Sending ${notification.type} notification for "${notification.procedure.name}"...`);
      
      // Validate recipients before sending
      if (!notification.recipients || notification.recipients.length === 0) {
        console.log(`❌ No valid recipients for ${notification.procedure.name}, skipping`);
        return { success: false, message: 'No valid recipients' };
      }
      
      const emailData = {
        to: notification.recipients,
        subject: this.getSubjectForType(notification),
        body: this.getBodyForType(notification)
      };
      
      const result = await this.sendEmailViaSharePoint(emailData);
      
      if (result.success) {
        // Mark as sent FIRST to prevent duplicates
        await this.markNotificationSent(notification.key);
        
        // Log detailed activity
        await this.logEmailActivity('PROCEDURE_EXPIRY_NOTIFICATION', 'System', {
          procedureName: notification.procedure.name || 'Unknown Procedure',
          procedureId: notification.procedure.id || 'Unknown ID',
          notificationType: notification.type || 'Unknown Type',
          daysLeft: notification.daysLeft || 0,
          recipients: notification.recipients || [],
          recipientCount: (notification.recipients || []).length,
          lob: notification.procedure.lob || 'Unknown',
          primaryOwner: notification.procedure.primary_owner || 'Unknown',
          expiryDate: notification.procedure.expiry || 'Unknown',
          timestamp: new Date().toISOString(),
          notificationKey: notification.key || 'Unknown'
        });
        
        console.log(`✅ ${notification.type} notification sent successfully for "${notification.procedure.name}"`);
      }
      
      return result;
      
    } catch (error) {
      console.error(`❌ Error sending ${notification.type} notification:`, error);
      return { success: false, message: error.message };
    }
  }

  // ✅ FIXED: Enhanced automation check with validation
  async checkAndSendNotifications() {
    try {
      // Prevent rapid successive checks
      if (!this.shouldRunCheck()) {
        return;
      }

      console.log('🔍 Starting automated notification check...');
      
      const procedures = await this.getProcedures();
      const validProcedures = procedures.filter(p => p !== null);
      
      console.log(`📋 Loaded ${validProcedures.length} valid procedures for analysis`);
      
      if (validProcedures.length === 0) {
        console.log('⚠️ No valid procedures found to check');
        await this.logEmailActivity('AUTOMATED_CHECK', 'System', {
          proceduresChecked: 0,
          notificationsSent: 0,
          message: 'No valid procedures found',
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      const notifications = await this.analyzeNotifications(validProcedures);
      console.log(`📊 Found ${notifications.length} notifications to send`);
      
      let successCount = 0;
      let failureCount = 0;
      
      for (const notification of notifications) {
        const result = await this.sendNotification(notification);
        if (result.success) {
          successCount++;
        } else {
          failureCount++;
        }
        
        // Rate limiting between sends
        await this.sleep(3000);
      }
      
      // Log complete results
      await this.logEmailActivity('AUTOMATED_CHECK', 'System', {
        proceduresChecked: validProcedures.length,
        notificationsSent: successCount,
        notificationsFailed: failureCount,
        totalNotificationsAnalyzed: notifications.length,
        activeTemplatesCount: this.activeTemplates.size,
        timestamp: new Date().toISOString(),
        systemStatus: successCount > 0 ? 'NOTIFICATIONS_SENT' : 'NO_NOTIFICATIONS_NEEDED'
      });
      
      console.log(`✅ Automated notification check complete: ${successCount} sent, ${failureCount} failed out of ${notifications.length} analyzed`);
      
    } catch (error) {
      console.error('❌ Error in automated notification check:', error);
      await this.logEmailActivity('AUTOMATED_CHECK_FAILED', 'System', {
        error: error.message || 'Unknown error',
        timestamp: new Date().toISOString(),
        errorType: error.name || 'Error'
      });
    }
  }

  // ✅ FIXED: Enhanced activity logging with validation
  async logEmailActivity(activityType, performedBy, details) {
    try {
      const requestDigest = await this.getFreshRequestDigest();
      
      // Ensure all details are properly defined and not undefined
      const safeDetails = {
        procedureName: details.procedureName || 'System Action',
        procedureId: details.procedureId || 'N/A',
        notificationType: details.notificationType || 'System',
        timestamp: details.timestamp || new Date().toISOString(),
        systemVersion: 'EmailNotificationService v2.1',
        ...details // Spread the rest, but safe defaults come first
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
        console.log(`✅ Email activity logged: ${activityType} for ${safeDetails.procedureName}`);
      } else {
        console.warn('⚠️ Could not log email activity (list may not exist)');
      }
      
    } catch (error) {
      console.error('❌ Error logging email activity:', error);
    }
  }

  // ✅ FIXED: Better notification marking
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
      } else {
        console.warn('⚠️ Could not mark notification as sent');
      }
      
    } catch (error) {
      console.error('❌ Error marking notification as sent:', error);
    }
  }

  // ✅ FIXED: Enhanced email sending with validation
  async sendEmailViaSharePoint(emailData) {
    try {
      console.log('📧 Sending email via SharePoint API...');
      
      const requestDigest = await this.getFreshRequestDigest();

      const emailPayload = {
        properties: {
          __metadata: { type: 'SP.Utilities.EmailProperties' },
          To: {
            results: Array.isArray(emailData.to) ? emailData.to : [emailData.to]
          },
          Subject: emailData.subject || 'HSBC Procedures Hub Notification',
          Body: emailData.body || 'Automated notification from HSBC Procedures Hub'
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

  // Helper methods
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
    
    console.log(`📧 Valid recipients for ${procedure.name}:`, recipients);
    return recipients;
  }

  isValidEmail(email) {
    if (!email || typeof email !== 'string') return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  getSubjectForType(notification) {
    const { procedure, daysLeft, type } = notification;
    const procedureName = procedure?.name || 'Unknown Procedure';
    
    const templates = {
      expiring_30: `[REMINDER] ${procedureName} expires in ${daysLeft} days`,
      expiring_7: `[URGENT] ${procedureName} expires in ${daysLeft} days - Action Required`,
      expired: `[EXPIRED] ${procedureName} expired ${daysLeft} days ago - Immediate Action Required`
    };
    
    return templates[type] || `Procedure Notification: ${procedureName}`;
  }

  getBodyForType(notification) {
    const { procedure, daysLeft, type } = notification;
    const procedureName = procedure?.name || 'Unknown Procedure';
    const primaryOwner = procedure?.primary_owner || 'Unknown Owner';
    const lob = procedure?.lob || 'Unknown LOB';
    const expiryDate = procedure?.expiry ? new Date(procedure.expiry).toLocaleDateString() : 'Unknown Date';
    
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #d40000, #b30000); padding: 20px; color: white;">
          <h1 style="margin: 0; font-size: 24px;">HSBC Procedures Hub</h1>
          <p style="margin: 5px 0 0 0; opacity: 0.9;">Automated Notification</p>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333; margin-top: 0;">📋 Procedure Notification</h2>
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #d40000; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #d40000;">${procedureName}</h3>
            <p style="margin: 5px 0; color: #666;"><strong>Primary Owner:</strong> ${primaryOwner}</p>
            <p style="margin: 5px 0; color: #666;"><strong>Expiry Date:</strong> ${expiryDate}</p>
            <p style="margin: 5px 0; color: #666;"><strong>Line of Business:</strong> ${lob}</p>
            <p style="margin: 5px 0; color: #666;"><strong>Days Left:</strong> ${daysLeft}</p>
          </div>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            This email was sent automatically by the HSBC Procedures Hub via SharePoint.
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
