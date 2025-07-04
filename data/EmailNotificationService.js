// services/EmailNotificationService.js - Complete Fixed Version with Proper Imports
import EmailService from './EmailService'; // ✅ REQUIRED IMPORT

class EmailNotificationService {
  constructor() {
    this.emailService = new EmailService();
    this.currentConfig = null;
    this.lastConfigLoad = null;
    
    // Load config on initialization
    this.loadCurrentConfig();
    
    console.log('📧 EmailNotificationService initialized');
  }

  // ===================================================================
  // CONFIGURATION MANAGEMENT
  // ===================================================================

  // ✅ FIXED: Always load fresh config before sending emails
  async loadCurrentConfig() {
    try {
      console.log('🔄 Loading fresh email configuration for sending...');
      this.currentConfig = await this.emailService.getEmailConfig();
      this.lastConfigLoad = new Date();
      console.log('✅ Fresh config loaded:', this.currentConfig);
    } catch (error) {
      console.error('❌ Failed to load email config:', error);
      this.currentConfig = null;
    }
  }

  // Force refresh configuration
  async refreshConfiguration() {
    await this.loadCurrentConfig();
    return this.currentConfig;
  }

  // ===================================================================
  // RECIPIENT MANAGEMENT
  // ===================================================================

  // ✅ FIXED: Get fresh recipients based on current configuration
 async getRecipientsForNotification(notificationType, lob, procedureData = null) {
  // Always load fresh config before determining recipients
  await this.loadCurrentConfig();
  
  const recipients = new Set();

  console.log(`📧 Getting recipients for: ${notificationType} - ${lob}`);

  try {
    // ✅ FIXED: Get admin emails from UserRoles list (Email column)
    console.log('👑 Loading admin emails from UserRoles list...');
    
    const userRolesResponse = await fetch(
      'https://teams.global.hsbc/sites/EmployeeEng/_api/web/lists/getbytitle(\'UserRoles\')/items?$filter=UserRole eq \'admin\' and Status eq \'active\'&$select=Id,Title,Email,DisplayName,UserRole,Status',
      {
        headers: { 'Accept': 'application/json; odata=verbose' },
        credentials: 'same-origin'
      }
    );

    if (userRolesResponse.ok) {
      const userData = await userRolesResponse.json();
      console.log('✅ UserRoles data loaded:', userData.d.results);
      
      // Add admin emails from UserRoles list
      userData.d.results.forEach(user => {
        if (user.Email && user.Email.trim()) {
          recipients.add(user.Email.trim());
          console.log(`✅ Added admin from UserRoles: ${user.Email}`);
        } else if (user.Title) {
          // If Email column is empty, construct email from Title (staffId)
          const constructedEmail = `${user.Title}@hsbc.com`;
          recipients.add(constructedEmail);
          console.log(`✅ Added constructed admin email: ${constructedEmail}`);
        }
      });
    } else {
      console.warn('⚠️ Could not load UserRoles list, using fallback admin');
      recipients.add('minaantoun@hsbc.com'); // Your email as fallback
    }

    // ✅ Add LOB-specific recipients from EmailConfiguration if available
    if (this.currentConfig) {
      // Add LOB-specific global heads
      this.currentConfig.globalCCList?.forEach(item => {
        if (item.lob === lob && 
            item.escalationType === notificationType && 
            item.recipientRole === 'Head' &&
            item.active !== false &&
            item.email) {
          recipients.add(item.email);
          console.log(`✅ Added global head: ${item.email}`);
        }
      });

      // Add LOB heads
      this.currentConfig.lobHeadsList?.forEach(item => {
        if (item.lob === lob &&
            item.active !== false &&
            item.email) {
          recipients.add(item.email);
          console.log(`✅ Added LOB head: ${item.email}`);
        }
      });

      // Add custom groups for access management notifications
      if (notificationType.includes('access') || notificationType.includes('user-')) {
        this.currentConfig.customGroupsList?.forEach(item => {
          if (item.escalationType === notificationType &&
              item.active !== false &&
              item.email) {
            recipients.add(item.email);
            console.log(`✅ Added custom recipient: ${item.email}`);
          }
        });
      }
    }

    // ✅ Add procedure owners if available
    if (procedureData) {
      if (procedureData.primary_owner_email) {
        recipients.add(procedureData.primary_owner_email);
        console.log(`✅ Added primary owner: ${procedureData.primary_owner_email}`);
      }
      if (procedureData.secondary_owner_email) {
        recipients.add(procedureData.secondary_owner_email);
        console.log(`✅ Added secondary owner: ${procedureData.secondary_owner_email}`);
      }
    }

    const recipientArray = Array.from(recipients);
    console.log(`📤 Final recipients for ${notificationType}:`, recipientArray);
    
    // ✅ Always ensure we have at least one valid recipient
    if (recipientArray.length === 0) {
      console.warn('⚠️ No recipients found, using fallback');
      return ['minaantoun@hsbc.com'];
    }
    
    return recipientArray;
    
  } catch (error) {
    console.error('❌ Error getting recipients:', error);
    // Fallback to your email
    return ['minaantoun@hsbc.com'];
  }
}

  // ===================================================================
  // NOTIFICATION TRIGGERS
  // ===================================================================

  // ✅ FIXED: Enhanced procedure upload notification



  
async triggerProcedureUploadNotification(uploadResult) {
  try {
    console.log('📧 Triggering procedure upload notification...');
    console.log('🔍 FULL DEBUG: uploadResult =', JSON.stringify(uploadResult, null, 2));
    
    // ✅ MULTIPLE FALLBACK EXTRACTION: Try every possible field combination
    const procedureName = uploadResult.procedureName || 
                         uploadResult.name || 
                         uploadResult.procedure?.name || 
                         uploadResult.formData?.name ||
                         'Unknown Procedure';
    
    const ownerName = uploadResult.ownerName || 
                     uploadResult.primary_owner || 
                     uploadResult.procedure?.primary_owner || 
                     uploadResult.formData?.primary_owner ||
                     uploadResult.uploadedBy ||
                     'Unknown Owner';
    
    const lob = uploadResult.lob || 
               uploadResult.procedure?.lob || 
               uploadResult.formData?.lob ||
               'Unknown';
    
    const qualityScore = uploadResult.qualityScore || 
                        uploadResult.score || 
                        uploadResult.analysisResult?.score ||
                        uploadResult.procedure?.score ||
                        'N/A';
    
    const procedureId = uploadResult.procedureId || 
                       uploadResult.id || 
                       uploadResult.procedure?.id ||
                       'Unknown';
    
    const uploadedBy = uploadResult.uploadedBy || 
                      uploadResult.uploaded_by_name ||
                      uploadResult.formData?.primary_owner ||
                      'System';
    
    console.log('🔍 EXTRACTED VALUES:');
    console.log('  - procedureName:', procedureName);
    console.log('  - ownerName:', ownerName);
    console.log('  - lob:', lob);
    console.log('  - qualityScore:', qualityScore);
    console.log('  - procedureId:', procedureId);
    console.log('  - uploadedBy:', uploadedBy);
    
    // Get fresh recipients
    const recipients = await this.getRecipientsForNotification(
      'new-procedure-uploaded', 
      lob, 
      uploadResult
    );

    // ✅ FIXED: Use extracted values
    const emailVariables = {
      procedureName: procedureName,
      ownerName: ownerName,
      uploadDate: uploadResult.uploadDate || new Date().toLocaleDateString(),
      qualityScore: qualityScore,
      lob: lob,
      uploadedBy: uploadedBy,
      procedureId: procedureId
    };

    console.log('📧 Final Email Variables:', emailVariables);

    // Send notification
    const result = await this.emailService.sendNotificationEmail(
      'new-procedure-uploaded',
      recipients,
      emailVariables
    );

    // Log the activity
    await this.logEmailActivity({
      activityType: 'NEW_PROCEDURE_NOTIFICATION',
      recipients: recipients,
      procedureId: procedureId,
      success: result.success,
      details: { 
        lob, 
        procedureName: procedureName,
        qualityScore: qualityScore,
        ownerName: ownerName
      }
    });

    console.log('✅ Procedure upload notification completed:', result.success);
    return result;
    
  } catch (error) {
    console.error('❌ Failed to send procedure upload notification:', error);
    return { success: false, message: error.message };
  }
}

async triggerProcedureAmendmentNotification(amendmentData) {
  try {
    console.log('📧 Triggering procedure amendment notification...');
    console.log('🔍 Amendment data:', amendmentData);
    
    const procedureName = amendmentData.procedureName || 'Unknown Procedure';
    const lob = amendmentData.lineOfBusiness || amendmentData.lob || 'Unknown';
    
    // Get fresh recipients (owners + admins + LOB heads)
    const recipients = await this.getRecipientsForNotification(
      'procedure-amended', 
      lob, 
      {
        primary_owner_email: amendmentData.primaryOwnerEmail,
        secondary_owner_email: amendmentData.secondaryOwnerEmail
      }
    );

    // Prepare email variables
    const emailVariables = {
      procedureName: procedureName,
      amendedBy: amendmentData.amendedBy || 'Unknown User',
      amendmentSummary: amendmentData.amendmentSummary || 'No summary provided',
      originalQualityScore: amendmentData.originalQualityScore || 'N/A',
      newQualityScore: amendmentData.newQualityScore || 'N/A',
      amendmentDate: amendmentData.amendmentDate || new Date().toLocaleDateString(),
      lob: lob,
      primaryOwner: amendmentData.primaryOwner || 'Unknown',
      procedureId: amendmentData.procedureId || 'Unknown'
    };

    console.log('📧 Amendment Email Variables:', emailVariables);

    // Send notification
    const result = await this.emailService.sendNotificationEmail(
      'procedure-amended',
      recipients,
      emailVariables
    );

    // Log the activity
    await this.logEmailActivity({
      activityType: 'PROCEDURE_AMENDED_NOTIFICATION',
      recipients: recipients,
      procedureId: amendmentData.procedureId,
      success: result.success,
      details: { 
        lob, 
        procedureName: procedureName,
        amendedBy: amendmentData.amendedBy,
        amendmentSummary: amendmentData.amendmentSummary,
        qualityScoreChange: `${amendmentData.originalQualityScore}% → ${amendmentData.newQualityScore}%`
      }
    });

    console.log('✅ Procedure amendment notification completed:', result.success);
    return result;
    
  } catch (error) {
    console.error('❌ Failed to send procedure amendment notification:', error);
    return { success: false, message: error.message };
  }
}
  
  // ✅ FIXED: Enhanced user access notification
// In EmailNotificationService.js, REPLACE the existing triggerUserChangeNotification method with this:

async triggerUserChangeNotification(userEmail, logEntry) {
  try {
    console.log('📧 Triggering user access change notification for:', userEmail);
    console.log('➡️ Log Entry Data:', logEntry);

    // Ensure we map the log entry title to a valid template type
    const notificationType = this.mapActionToNotificationType(logEntry.Title);
    if (!notificationType) {
      console.error(`❌ No notification template mapping found for action: ${logEntry.Title}`);
      return { success: false, message: `No template for action ${logEntry.Title}` };
    }
    
    console.log(`✉️ Mapped Action "${logEntry.Title}" to Template Type "${notificationType}"`);

    // Get recipients, ensuring admins and custom groups are included
    const recipients = await this.getRecipientsForNotification(
      notificationType,
      'All' // Access management notifications are global
    );

    // Also notify the user whose role was changed
    if (userEmail && !recipients.includes(userEmail)) {
      recipients.push(userEmail);
      console.log(`✅ Added affected user to recipients: ${userEmail}`);
    }

    // ✅ **CRITICAL FIX:** Create variables with keys that EXACTLY match the template {{placeholders}}
    const emailVariables = {
      userName: logEntry.TargetUserName || userEmail || 'Unknown User',
      oldValue: logEntry.OldValue || 'N/A',
      newValue: logEntry.NewValue || 'N/A',
      performedBy: logEntry.PerformedByName || 'System Administrator',
      timestamp: logEntry.LogTimestamp ? new Date(logEntry.LogTimestamp).toLocaleString() : new Date().toLocaleString()
    };

    console.log('⚙️ Prepared Email Variables:', emailVariables);

    // Send the notification using the simplified and robust service
    const result = await this.emailService.sendNotificationEmail(
      notificationType,
      recipients,
      emailVariables
    );

    // Log the outcome of the email sending activity
    await this.logEmailActivity({
      activityType: `${logEntry.Title}_NOTIFICATION`,
      recipients: recipients,
      targetUser: logEntry.TargetUserId,
      success: result.success,
      details: { 
        actionType: logEntry.Title,
        targetUserName: emailVariables.userName,
        performedBy: emailVariables.performedBy,
        message: result.message
      }
    });

    console.log('✅ User access notification process completed:', result.success);
    return result;
    
  } catch (error) {
    console.error('❌ FATAL: Failed to send user access notification:', error);
    return { success: false, message: error.message };
  }
}
  // Trigger expiry warning notification
  async triggerExpiryWarningNotification(procedureData) {
    try {
      console.log('📧 Triggering expiry warning notification...');
      
      const lob = procedureData.lob || 'Unknown';
      
      // Get fresh recipients
      const recipients = await this.getRecipientsForNotification(
        'procedure-expiring', 
        lob, 
        procedureData
      );

      // Calculate days left
      const expiryDate = new Date(procedureData.expiry || procedureData.ExpiryDate);
      const today = new Date();
      const daysLeft = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

      // Prepare email variables
      const emailVariables = {
        procedureName: procedureData.name || procedureData.Title || 'Unknown Procedure',
        ownerName: procedureData.primary_owner || procedureData.PrimaryOwner || 'Unknown Owner',
        expiryDate: expiryDate.toLocaleDateString(),
        daysLeft: Math.max(0, daysLeft),
        lob: lob,
        procedureId: procedureData.id || procedureData.Id || 'Unknown'
      };

      // Send notification
      const result = await this.emailService.sendNotificationEmail(
        'procedure-expiring',
        recipients,
        emailVariables
      );

      // Log the activity
      await this.logEmailActivity({
        activityType: 'PROCEDURE_EXPIRING_NOTIFICATION',
        recipients: recipients,
        procedureId: emailVariables.procedureId,
        success: result.success,
        details: { 
          lob, 
          procedureName: emailVariables.procedureName,
          daysLeft: emailVariables.daysLeft
        }
      });

      return result;
      
    } catch (error) {
      console.error('❌ Failed to send expiry warning notification:', error);
      return { success: false, message: error.message };
    }
  }

  // Trigger expired procedure notification
  async triggerExpiredProcedureNotification(procedureData) {
    try {
      console.log('📧 Triggering expired procedure notification...');
      
      const lob = procedureData.lob || 'Unknown';
      
      // Get fresh recipients
      const recipients = await this.getRecipientsForNotification(
        'procedure-expired', 
        lob, 
        procedureData
      );

      // Calculate days overdue
      const expiredDate = new Date(procedureData.expiry || procedureData.ExpiryDate);
      const today = new Date();
      const daysOverdue = Math.ceil((today - expiredDate) / (1000 * 60 * 60 * 24));

      // Prepare email variables
      const emailVariables = {
        procedureName: procedureData.name || procedureData.Title || 'Unknown Procedure',
        ownerName: procedureData.primary_owner || procedureData.PrimaryOwner || 'Unknown Owner',
        expiredDate: expiredDate.toLocaleDateString(),
        daysOverdue: Math.max(0, daysOverdue),
        lob: lob,
        procedureId: procedureData.id || procedureData.Id || 'Unknown'
      };

      // Send notification
      const result = await this.emailService.sendNotificationEmail(
        'procedure-expired',
        recipients,
        emailVariables
      );

      // Log the activity
      await this.logEmailActivity({
        activityType: 'PROCEDURE_EXPIRED_NOTIFICATION',
        recipients: recipients,
        procedureId: emailVariables.procedureId,
        success: result.success,
        details: { 
          lob, 
          procedureName: emailVariables.procedureName,
          daysOverdue: emailVariables.daysOverdue
        }
      });

      return result;
      
    } catch (error) {
      console.error('❌ Failed to send expired procedure notification:', error);
      return { success: false, message: error.message };
    }
  }

  // Trigger low quality score notification
  async triggerLowQualityScoreNotification(procedureData, analysisResult) {
    try {
      console.log('📧 Triggering low quality score notification...');
      
      const lob = procedureData.lob || 'Unknown';
      const score = analysisResult.score || procedureData.score || 0;
      
      // Only send if score is below threshold
      if (score >= 60) {
        console.log('⚠️ Quality score is acceptable, skipping notification');
        return { success: true, message: 'Quality score acceptable, no notification needed' };
      }
      
      // Get fresh recipients
      const recipients = await this.getRecipientsForNotification(
        'low-quality-score', 
        lob, 
        procedureData
      );

      // Prepare recommendations
      const recommendations = analysisResult.aiRecommendations?.map(rec => rec.message).join(', ') || 'Please review document structure and content';

      // Prepare email variables
      const emailVariables = {
        procedureName: procedureData.name || procedureData.Title || 'Unknown Procedure',
        ownerName: procedureData.primary_owner || 'Unknown Owner',
        qualityScore: score,
        lob: lob,
        recommendations: recommendations,
        uploadDate: new Date().toLocaleDateString()
      };

      // Send notification
      const result = await this.emailService.sendNotificationEmail(
        'low-quality-score',
        recipients,
        emailVariables
      );

      // Log the activity
      await this.logEmailActivity({
        activityType: 'LOW_QUALITY_SCORE_NOTIFICATION',
        recipients: recipients,
        procedureId: procedureData.id,
        success: result.success,
        details: { 
          lob, 
          procedureName: emailVariables.procedureName,
          qualityScore: score
        }
      });

      return result;
      
    } catch (error) {
      console.error('❌ Failed to send low quality score notification:', error);
      return { success: false, message: error.message };
    }
  }

  // ===================================================================
  // UTILITY METHODS
  // ===================================================================

  // Map action types to notification types
  mapActionToNotificationType(actionType) {
    const mappings = {
      'USER_ACCESS_GRANTED': 'user-access-granted',
      'USER_ACCESS_REVOKED': 'user-access-revoked',
      'USER_ROLE_UPDATED': 'user-role-updated',
      'USER_ACCESS_CHANGED': 'user-role-updated'
    };
    
    return mappings[actionType] || 'user-access-granted';
  }

  // ===================================================================
  // EMAIL ACTIVITY LOGGING
  // ===================================================================

  // Get email activity log for display
  async getEmailActivityLog(limit = 50) {
    try {
      console.log('📋 Loading email activity log...');
      
      const response = await fetch(
        `https://teams.global.hsbc/sites/EmployeeEng/_api/web/lists/getbytitle('EmailActivityLog')/items?$select=*&$orderby=Timestamp desc&$top=${limit}`,
        {
          headers: { 'Accept': 'application/json; odata=verbose' },
          credentials: 'include'
        }
      );

      if (response.ok) {
        const data = await response.json();
        const activities = data.d.results.map(item => ({
          id: item.Id,
          activityType: item.ActivityType || item.Title,
          timestamp: item.Timestamp || item.Created,
          recipients: this.safeJsonParse(item.Recipients, []),
          success: item.Success !== false,
          details: this.safeJsonParse(item.Details, {}),
          performedBy: item.PerformedBy || 'System',
          readableActivity: this.getReadableActivity(item.ActivityType || item.Title, item.Details)
        }));
        
        console.log('✅ Email activity log loaded:', activities.length, 'entries');
        return activities;
      }
      
      console.warn('⚠️ Could not load email activity log');
      return [];
    } catch (error) {
      console.error('❌ Failed to load email activity log:', error);
      return [];
    }
  }

  // Get readable activity description
  getReadableActivity(activityType, detailsJson) {
    try {
      const details = this.safeJsonParse(detailsJson, {});
      
      switch (activityType) {
        case 'NEW_PROCEDURE_NOTIFICATION':
          return `Email sent for new procedure: ${details.procedureName || 'Unknown'} (${details.lob || 'Unknown LOB'})`;
        case 'USER_ACCESS_GRANTED_NOTIFICATION':
          return `Access granted notification sent to ${details.targetUserName || 'user'}`;
        case 'USER_ACCESS_REVOKED_NOTIFICATION':
          return `Access revoked notification sent to ${details.targetUserName || 'user'}`;
        case 'USER_ROLE_UPDATED_NOTIFICATION':
          return `User role update notification sent to ${details.targetUserName || 'user'}`;
        case 'PROCEDURE_EXPIRING_NOTIFICATION':
          return `Expiry warning sent for procedure: ${details.procedureName || 'Unknown'} (${details.daysLeft || 0} days left)`;
        case 'PROCEDURE_EXPIRED_NOTIFICATION':
          return `Expired procedure notification sent for: ${details.procedureName || 'Unknown'} (${details.daysOverdue || 0} days overdue)`;
        case 'LOW_QUALITY_SCORE_NOTIFICATION':
          return `Low quality score alert sent for: ${details.procedureName || 'Unknown'} (Score: ${details.qualityScore || 0}%)`;
        default:
          return `Email notification: ${activityType.replace(/_/g, ' ')}`;
      }
    } catch (error) {
      return `Email notification: ${activityType}`;
    }
  }

  // Safe JSON parsing
  safeJsonParse(jsonString, defaultValue) {
    try {
      return jsonString && typeof jsonString === 'string' ? JSON.parse(jsonString) : (jsonString || defaultValue);
    } catch (error) {
      console.warn('⚠️ JSON parse error:', error);
      return defaultValue;
    }
  }

  // Log email activity for audit trail

  async logEmailActivity(activity) {
  try {
    console.log('📝 Logging email activity:', activity);
    
    // Get fresh request digest
    const requestDigest = await this.emailService.getFreshRequestDigest();
    
    // ✅ FIXED: Ensure ALL fields are properly stringified
    const logEntry = {
      __metadata: { type: 'SP.Data.EmailActivityLogListItem' },
      Title: String(activity.activityType || 'Unknown'),
      ActivityType: String(activity.activityType || 'Unknown'),
      PerformedBy: String(activity.performedBy || 'System'),
      ActivityDetails: JSON.stringify({
        ...activity.details,
        recipients: activity.recipients || []
      }),
      ActivityTimestamp: activity.timestamp || new Date().toISOString(),
      Status: String(activity.success ? 'completed' : 'failed'),
      ProcedureName: String(activity.details?.procedureName || ''),
      ProcedureID: String(activity.procedureId || ''),
      NotificationType: String(activity.activityType || '')
    };

    const response = await fetch(
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

    if (response.ok) {
      console.log('✅ Email activity logged successfully');
    } else {
      const errorText = await response.text();
      console.error('❌ Failed to log email activity:', response.status, errorText);
    }
    
  } catch (error) {
    console.error('❌ Error logging email activity:', error);
  }
}

  // ===================================================================
  // MONITORING AND STATUS
  // ===================================================================

  // Get expiring procedures
  async getExpiringProcedures(allProcedures = null, notificationLog = null) {
    try {
      console.log('📋 Getting expiring procedures...');
      
      // Load procedures if not provided
      if (!allProcedures) {
        const response = await fetch(
          'https://teams.global.hsbc/sites/EmployeeEng/_api/web/lists/getbytitle(\'Procedures\')/items?$select=*',
          {
            headers: { 'Accept': 'application/json; odata=verbose' },
            credentials: 'include'
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          allProcedures = data.d.results;
        } else {
          return [];
        }
      }

      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
      
      const expiringProcedures = allProcedures.filter(proc => {
        if (!proc.ExpiryDate) return false;
        
        const expiryDate = new Date(proc.ExpiryDate);
        return expiryDate <= thirtyDaysFromNow;
      }).map(proc => {
        const expiryDate = new Date(proc.ExpiryDate);
        const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
        
        return {
          id: proc.Id,
          name: proc.Title,
          expiryDate: proc.ExpiryDate,
          daysUntilExpiry: daysUntilExpiry,
          expirationStage: daysUntilExpiry <= 0 ? 'EXPIRED' : daysUntilExpiry <= 7 ? 'CRITICAL' : 'WARNING',
          lob: proc.LOB,
          primaryOwner: proc.PrimaryOwner,
          status: proc.Status
        };
      });

      console.log('✅ Found expiring procedures:', expiringProcedures.length);
      return expiringProcedures;
      
    } catch (error) {
      console.error('❌ Failed to get expiring procedures:', error);
      return [];
    }
  }

  // Get procedures list
  async getProcedures() {
    try {
      const response = await fetch(
        'https://teams.global.hsbc/sites/EmployeeEng/_api/web/lists/getbytitle(\'Procedures\')/items?$select=*',
        {
          headers: { 'Accept': 'application/json; odata=verbose' },
          credentials: 'include'
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

  // Get notification log
  async getNotificationLog() {
    return await this.getEmailActivityLog();
  }

  // Check if email monitoring is running
  get isRunning() {
    return this.currentConfig !== null;
  }

  // Start email monitoring
  async startEmailMonitoring() {
    try {
      console.log('📧 Starting email monitoring...');
      await this.loadCurrentConfig();
      
      // Log the start event
      await this.logEmailActivity({
        activityType: 'EMAIL_MONITORING_STARTED',
        recipients: [],
        success: true,
        details: { timestamp: new Date().toISOString() }
      });
      
      console.log('✅ Email monitoring started');
      return true;
    } catch (error) {
      console.error('❌ Failed to start email monitoring:', error);
      return false;
    }
  }

  // Stop email monitoring
  async stopEmailMonitoring() {
    try {
      console.log('📧 Stopping email monitoring...');
      
      // Log the stop event
      await this.logEmailActivity({
        activityType: 'EMAIL_MONITORING_STOPPED',
        recipients: [],
        success: true,
        details: { timestamp: new Date().toISOString() }
      });
      
      console.log('✅ Email monitoring stopped');
      return true;
    } catch (error) {
      console.error('❌ Failed to stop email monitoring:', error);
      return false;
    }
  }

  // Test email functionality
  async testEmailSystem() {
    try {
      console.log('🧪 Testing email system...');
      
      const testResult = await this.emailService.sendTestEmail({
        testEmail: 'minaantoun@hsbc.com'
      });
      
      // Log the test
      await this.logEmailActivity({
        activityType: 'EMAIL_SYSTEM_TEST',
        recipients: ['minaantoun@hsbc.com'],
        success: testResult.success,
        details: { 
          message: testResult.message,
          timestamp: new Date().toISOString()
        }
      });
      
      return testResult;
    } catch (error) {
      console.error('❌ Email system test failed:', error);
      return { success: false, message: error.message };
    }
  }
}

export default EmailNotificationService;
