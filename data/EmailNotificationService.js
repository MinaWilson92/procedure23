// services/EmailNotificationService.js - FIXED VERSION - Restore Data Display
class EmailNotificationService {
  constructor() {
    this.baseUrl = 'https://teams.global.hsbc/sites/EmployeeEng';
    this.checkInterval = 24 * 60 * 60 * 1000; // 24 hours
    this.isRunning = false;
    this.activeTemplates = new Map();
    this.lastCheckTime = null;
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

  // ✅ FIXED: Procedures fetching - Less strict validation
  async getProcedures() {
    try {
      console.log('📋 Fetching procedures from SharePoint...');
      
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
        throw new Error(`Failed to fetch procedures: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const procedures = data.d.results.map(this.mapSharePointToModel.bind(this)).filter(p => p !== null);
      
      console.log('✅ Procedures fetched successfully:', procedures.length);
      return procedures;
      
    } catch (error) {
      console.error('❌ Error fetching procedures:', error);
      return [];
    }
  }

  // ✅ FIXED: Less strict mapping - allow more procedures through
  mapSharePointToModel(spItem) {
    if (!spItem || !spItem.Id) {
      return null;
    }

    try {
      return {
        id: spItem.Id,
        name: spItem.Title || `Procedure ${spItem.Id}`,
        expiry: spItem.ExpiryDate || null,
        primary_owner: spItem.PrimaryOwner || 'Unknown Owner',
        primary_owner_email: spItem.PrimaryOwnerEmail || '',
        secondary_owner: spItem.SecondaryOwner || '',
        secondary_owner_email: spItem.SecondaryOwnerEmail || '',
        lob: spItem.LOB || 'Unknown',
        procedure_subsection: spItem.ProcedureSubsection || '',
        score: spItem.QualityScore || 0,
        uploaded_by: spItem.UploadedBy || 'Unknown',
        uploaded_at: spItem.UploadedAt || spItem.Created,
        status: spItem.Status || 'Active'
      };
    } catch (error) {
      console.error('❌ Error mapping SharePoint item:', error);
      return null;
    }
  }

  // ✅ FIXED: Template loading with fallback
  async loadActiveTemplates() {
    try {
      console.log('📧 Loading active email templates...');
      
      const response = await fetch(
        `${this.baseUrl}/_api/web/lists/getbytitle('EmailTemplates')/items?$select=*&$filter=IsActive eq true`,
        {
          headers: { 'Accept': 'application/json; odata=verbose' },
          credentials: 'include'
        }
      );

      if (response.ok) {
        const data = await response.json();
        this.activeTemplates.clear();
        
        data.d.results.forEach(template => {
          this.activeTemplates.set(template.TemplateType, {
            id: template.Id,
            type: template.TemplateType,
            subject: template.Subject,
            htmlContent: template.HTMLContent,
            isActive: template.IsActive
          });
        });
        
        console.log('✅ Active templates loaded:', this.activeTemplates.size);
        return this.activeTemplates;
      } else {
        console.warn('⚠️ EmailTemplates list not accessible, allowing all notifications');
        return new Map();
      }
    } catch (error) {
      console.error('❌ Error loading active templates:', error);
      return new Map();
    }
  }

  // ✅ FIXED: Template checking - allow when no templates
  isTemplateActive(templateType) {
    if (this.activeTemplates.size === 0) {
      // If no templates loaded, allow all (safer for display)
      console.log(`⚠️ No templates loaded, allowing ${templateType} by default`);
      return true;
    }
    
    const template = this.activeTemplates.get(templateType);
    const isActive = template && template.isActive;
    
    console.log(`🔍 Template ${templateType} active status:`, isActive);
    return isActive;
  }

  // ✅ FIXED: Less strict notification analysis
  async analyzeNotifications(procedures) {
    const notifications = [];
    const now = new Date();
    
    await this.loadActiveTemplates();
    
    console.log(`🔍 Analyzing ${procedures.length} procedures for notifications...`);
    
    for (const procedure of procedures) {
      // Less strict validation - only require id
      if (!procedure || !procedure.id) {
        console.warn('⚠️ Skipping procedure without ID:', procedure);
        continue;
      }

      // Handle missing expiry gracefully
      if (!procedure.expiry) {
        console.warn('⚠️ Procedure has no expiry date:', procedure.name || procedure.id);
        continue;
      }

      try {
        const expiry = new Date(procedure.expiry);
        if (isNaN(expiry.getTime())) {
          console.warn('⚠️ Invalid expiry date for procedure:', procedure.name);
          continue;
        }

        const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
        
        console.log(`🔍 Analyzing: ${procedure.name || procedure.id} (ID: ${procedure.id}), Days left: ${daysLeft}`);
        
        // Get unique notification key
        const baseKey = `${procedure.id}_${procedure.expiry}`;
        
        // Check 30-day notification
        if (daysLeft > 0 && daysLeft <= 30) {
          const key30 = baseKey + '_30_day';
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
          const key7 = baseKey + '_7_day';
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
          const keyExpired = baseKey + '_expired';
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

  // ✅ FIXED: Enhanced duplicate checking
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
        
        console.log(`🔍 Last notifications sent for key ${notificationKey}:`, sentTypes);
        return sentTypes;
      }
      
      return '';
    } catch (error) {
      console.error('❌ Error getting notification history:', error);
      return '';
    }
  }

  // ✅ FIXED: Restore email activity log functionality
  async getEmailActivityLog(limit = 50) {
    try {
      console.log('📧 Loading email activity log...');
      
      const response = await fetch(
        `${this.baseUrl}/_api/web/lists/getbytitle('EmailActivityLog')/items?$select=*&$orderby=ActivityTimestamp desc&$top=${limit}`,
        {
          headers: { 'Accept': 'application/json; odata=verbose' },
          credentials: 'include'
        }
      );

      if (response.ok) {
        const data = await response.json();
        const activities = data.d.results.map(item => ({
          id: item.Id,
          activityType: item.ActivityType,
          performedBy: item.PerformedBy,
          details: this.safeJsonParse(item.ActivityDetails, {}),
          timestamp: item.ActivityTimestamp,
          status: item.Status || 'SUCCESS',
          readableActivity: this.getReadableActivity(item.ActivityType, this.safeJsonParse(item.ActivityDetails, {}))
        }));
        
        console.log('✅ Email activity log loaded:', activities.length, 'entries');
        return activities;
      } else {
        console.warn('⚠️ EmailActivityLog list not accessible:', response.status);
        return [];
      }
      
    } catch (error) {
      console.error('❌ Error getting email activity log:', error);
      return [];
    }
  }

  getReadableActivity(activityType, details) {
    switch (activityType) {
      case 'ACCESS_GRANTED_NOTIFICATION':
        return `Access granted to ${details.userDisplayName || details.userId || 'Unknown User'} by ${details.grantedBy || 'Unknown Admin'}`;
      case 'ACCESS_REVOKED_NOTIFICATION':
        return `Access revoked for ${details.userDisplayName || details.userId || 'Unknown User'} by ${details.performedBy || 'Unknown Admin'}`;
      case 'ROLE_CHANGE_NOTIFICATION':
        return `Role changed for ${details.userDisplayName || details.userId || 'Unknown User'}: ${details.oldRole || 'Unknown'} → ${details.newRole || 'Unknown'}`;
      case 'PROCEDURE_UPLOAD_NOTIFICATION':
        return `New procedure uploaded: ${details.procedureName || 'Unknown Procedure'} (${details.lob || 'Unknown LOB'})`;
      case 'PROCEDURE_EXPIRY_NOTIFICATION':
        return `Expiry notification sent for: ${details.procedureName || 'Unknown Procedure'} (${details.daysLeft || 'Unknown'} days)`;
      case 'AUTOMATED_CHECK':
        return `Automated check: ${details.proceduresChecked || 0} procedures checked, ${details.notificationsSent || 0} notifications sent`;
      case 'AUTOMATED_CHECK_FAILED':
        return `Automated check failed: ${details.error || 'Unknown error'}`;
      default:
        return `${activityType.replace(/_/g, ' ').toLowerCase()}`;
    }
  }

  // ✅ FIXED: Restore expiring procedures functionality
  async getExpiringProcedures() {
    try {
      console.log('📅 Loading expiring procedures...');
      
      const procedures = await this.getProcedures();
      const now = new Date();
      const expiring = [];
      
      for (const procedure of procedures) {
        // Skip procedures without expiry date
        if (!procedure.expiry) {
          continue;
        }

        try {
          const expiry = new Date(procedure.expiry);
          if (isNaN(expiry.getTime())) {
            continue; // Skip invalid dates
          }

          const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
          
          // Include procedures expiring within 30 days OR already expired
          if (daysLeft <= 30) {
            const notificationKey = `${procedure.id}_${procedure.expiry}`;
            const lastSent = await this.getLastNotificationSent(notificationKey);
            
            expiring.push({
              id: procedure.id,
              name: procedure.name || `Procedure ${procedure.id}`,
              owner: procedure.primary_owner || 'Unknown Owner',
              ownerEmail: procedure.primary_owner_email || '',
              expiry: procedure.expiry,
              daysLeft: daysLeft,
              status: daysLeft <= 0 ? 'expired' : daysLeft <= 7 ? 'urgent' : 'warning',
              lob: procedure.lob || 'Unknown',
              lastNotificationSent: lastSent,
              willSendNotification: this.shouldSendNotification(daysLeft, lastSent)
            });
          }
        } catch (error) {
          console.error('Error processing expiry for procedure:', procedure.id, error);
          continue;
        }
      }
      
      const sortedExpiring = expiring.sort((a, b) => a.daysLeft - b.daysLeft);
      console.log('✅ Expiring procedures loaded:', sortedExpiring.length);
      return sortedExpiring;
      
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

  // ✅ FIXED: Enhanced automation check
  async checkAndSendNotifications() {
    try {
      console.log('🔍 Starting automated notification check...');
      
      const procedures = await this.getProcedures();
      
      console.log(`📋 Loaded ${procedures.length} procedures for analysis`);
      
      if (procedures.length === 0) {
        console.log('⚠️ No procedures found to check');
        await this.logEmailActivity('AUTOMATED_CHECK', 'System', {
          proceduresChecked: 0,
          notificationsSent: 0,
          message: 'No procedures found',
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      const notifications = await this.analyzeNotifications(procedures);
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
        await this.sleep(2000);
      }
      
      // Log complete results with safe values
      await this.logEmailActivity('AUTOMATED_CHECK', 'System', {
        proceduresChecked: procedures.length,
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

  // ✅ Enhanced notification sending
  async sendNotification(notification) {
    try {
      console.log(`📧 Sending ${notification.type} notification for "${notification.procedure.name}"...`);
      
      // Double-check if template is still active before sending
      if (!this.isTemplateActive(notification.templateType)) {
        console.log(`❌ Template ${notification.templateType} is disabled, skipping notification`);
        return { success: false, message: 'Template disabled' };
      }

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
        
        // Then log the detailed activity
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
      } else {
        console.error(`❌ Failed to send ${notification.type} notification for "${notification.procedure.name}":`, result.message);
        
        // Log the failure
        await this.logEmailActivity('NOTIFICATION_FAILED', 'System', {
          procedureName: notification.procedure.name || 'Unknown Procedure',
          procedureId: notification.procedure.id || 'Unknown ID',
          notificationType: notification.type || 'Unknown Type',
          error: result.message || 'Unknown error',
          recipients: notification.recipients || [],
          timestamp: new Date().toISOString()
        });
      }
      
      return result;
      
    } catch (error) {
      console.error(`❌ Error sending ${notification.type} notification:`, error);
      
      await this.logEmailActivity('NOTIFICATION_ERROR', 'System', {
        procedureName: notification.procedure?.name || 'Unknown Procedure',
        procedureId: notification.procedure?.id || 'Unknown ID',
        notificationType: notification.type || 'Unknown Type',
        error: error.message || 'Unknown error',
        timestamp: new Date().toISOString()
      });
      
      return { success: false, message: error.message };
    }
  }

  // ✅ Enhanced activity logging with complete validation
  async logEmailActivity(activityType, performedBy, details) {
    try {
      const requestDigest = await this.getFreshRequestDigest();
      
      // Ensure all details are properly defined
      const completeDetails = {
        procedureName: details.procedureName || 'System Action',
        procedureId: details.procedureId || 'N/A',
        notificationType: details.notificationType || 'System',
        timestamp: details.timestamp || new Date().toISOString(),
        systemVersion: 'EmailNotificationService v2.1',
        ...details // Spread other details
      };
      
      const logData = {
        __metadata: { type: 'SP.Data.EmailActivityLogListItem' },
        Title: `${activityType}_${completeDetails.procedureName}_${Date.now()}`,
        ActivityType: activityType,
        PerformedBy: performedBy,
        ActivityDetails: JSON.stringify(completeDetails),
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
        console.log(`✅ Email activity logged: ${activityType} for ${completeDetails.procedureName}`);
      } else {
        console.warn('⚠️ Could not log email activity (list may not exist)');
      }
      
    } catch (error) {
      console.error('❌ Error logging email activity:', error);
    }
  }

  // ✅ Enhanced notification marking
  async markNotificationSent(notificationKey) {
    try {
      const requestDigest = await this.getFreshRequestDigest();
      
      const notificationType = notificationKey.split('_').pop();
      
      const logData = {
        __metadata: { type: 'SP.Data.NotificationLogListItem' },
        Title: `${notificationKey}_${new Date().toISOString()}`,
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
        console.warn('⚠️ Could not mark notification as sent (list may not exist)');
      }
      
    } catch (error) {
      console.error('❌ Error marking notification as sent:', error);
    }
  }

  // Send email via SharePoint API
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
        console.error('❌ SharePoint email API response:', response.status, errorText);
        throw new Error(`SharePoint email API failed: ${response.status} - ${errorText}`);
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
    const qualityScore = procedure?.score || 0;
    
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
            <p style="margin: 5px 0; color: #666;"><strong>Quality Score:</strong> ${qualityScore}%</p>
            <p style="margin: 5px 0; color: #666;"><strong>Days ${daysLeft <= 0 ? 'Overdue' : 'Left'}:</strong> ${Math.abs(daysLeft)}</p>
          </div>
          ```javascript
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            This email was sent automatically by the HSBC Procedures Hub monitoring system via SharePoint.
            <br/>Notification Key: ${notification.key || 'Unknown'}
          </p>
        </div>
      </div>
    `;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Safe JSON parsing helper
  safeJsonParse(jsonString, defaultValue) {
    try {
      return jsonString ? JSON.parse(jsonString) : defaultValue;
    } catch (error) {
      console.warn('⚠️ JSON parse error:', error);
      return defaultValue;
    }
  }

  // Start/stop monitoring
  async startEmailMonitoring() {
    if (this.isRunning) {
      console.log('📧 Email monitoring already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting enhanced email monitoring system...');

    try {
      // Load active templates first
      await this.loadActiveTemplates();
      
      // Run immediately
      await this.checkAndSendNotifications();

      // Set up recurring checks
      this.monitoringInterval = setInterval(async () => {
        try {
          await this.loadActiveTemplates();
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

  // User management notification methods (enhanced implementations)
  async triggerUserAccessNotification(userId, userDisplayName, grantedByName) {
    try {
      console.log('📧 Triggering user access notification for:', userId);
      
      const emailData = {
        to: [`${userId}@hsbc.com`],
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

  async triggerUserRoleChangeNotification(userId, userDisplayName, oldRole, newRole, changedBy) {
    try {
      console.log('📧 Triggering role change notification for:', userId);
      
      const emailData = {
        to: [`${userId}@hsbc.com`],
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
          changedBy: changedBy,
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
      console.log('📧 Triggering access revoked notification for:', userId);
      
      const emailData = {
        to: [`${userId}@hsbc.com`],
        subject: 'HSBC Procedures Hub - Access Revoked',
        body: this.generateAccessRevokedEmail(userId, userDisplayName, revokedBy, reason)
      };

      const result = await this.sendEmailViaSharePoint(emailData);
      
      if (result.success) {
        await this.logEmailActivity('ACCESS_REVOKED_NOTIFICATION', revokedBy, {
          userId: userId,
          userDisplayName: userDisplayName,
          revokedBy: revokedBy,
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

  async triggerProcedureUploadNotification(procedureData, analysisResult) {
    try {
      console.log('📧 Triggering procedure upload notification for:', procedureData.name);
      
      const recipients = ['minaantoun@hsbc.com']; // Add your admin emails
      
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

  // Email template generators
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
}

export default EmailNotificationService;
