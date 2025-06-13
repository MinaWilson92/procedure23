// services/EmailNotificationService.js - Fixed to Use Current Configuration
class EmailNotificationService {
  constructor() {
    this.emailService = new EmailService();
    this.currentConfig = null;
    this.lastConfigLoad = null;
    
    // Load config on initialization
    this.loadCurrentConfig();
  }

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

  // ✅ FIXED: Get fresh recipients based on current configuration
  async getRecipientsForNotification(notificationType, lob, procedureData = null) {
    // Always load fresh config before determining recipients
    await this.loadCurrentConfig();
    
    if (!this.currentConfig) {
      console.warn('⚠️ No email configuration available, using fallback');
      return ['minaantoun@hsbc.com']; // Fallback to your email
    }

    const recipients = new Set();

    console.log(`📧 Getting recipients for: ${notificationType} - ${lob}`);

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

    // Add active admins
    this.currentConfig.adminList?.forEach(item => {
      if (item.active !== false && item.email) {
        recipients.add(item.email);
        console.log(`✅ Added admin: ${item.email}`);
      }
    });

    // Add procedure owners if available
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

    // Add access management custom recipients for user access notifications
    if (notificationType.includes('access')) {
      this.currentConfig.customGroupsList?.forEach(item => {
        if (item.escalationType === notificationType &&
            item.active !== false &&
            item.email) {
          recipients.add(item.email);
          console.log(`✅ Added custom recipient: ${item.email}`);
        }
      });
    }

    const recipientArray = Array.from(recipients);
    console.log(`📤 Final recipients for ${notificationType}:`, recipientArray);
    
    return recipientArray.length > 0 ? recipientArray : ['minaantoun@hsbc.com'];
  }

  // ✅ FIXED: Enhanced procedure upload notification
  async triggerProcedureUploadNotification(uploadResult) {
    try {
      console.log('📧 Triggering procedure upload notification...');
      
      const procedureData = uploadResult.procedure || uploadResult;
      const lob = procedureData.lob || 'Unknown';
      
      // Get fresh recipients
      const recipients = await this.getRecipientsForNotification(
        'new-procedure-uploaded', 
        lob, 
        procedureData
      );

      // Send notification
      const result = await this.emailService.sendNotificationEmail(
        'new-procedure-uploaded',
        recipients,
        {
          procedureName: procedureData.name || procedureData.Title,
          ownerName: procedureData.primary_owner || 'Unknown',
          uploadDate: new Date().toLocaleDateString(),
          qualityScore: procedureData.score || uploadResult.analysisResult?.score || 'N/A',
          lob: lob
        }
      );

      // Log the activity
      await this.logEmailActivity({
        activityType: 'NEW_PROCEDURE_NOTIFICATION',
        recipients: recipients,
        procedureId: uploadResult.procedureId,
        success: result.success,
        details: { lob, procedureName: procedureData.name }
      });

      return result;
      
    } catch (error) {
      console.error('❌ Failed to send procedure upload notification:', error);
      return { success: false, message: error.message };
    }
  }

  // ✅ FIXED: Enhanced user access notification
  async triggerUserChangeNotification(userEmail, logEntry) {
    try {
      console.log('📧 Triggering user access change notification...');
      
      const notificationType = logEntry.Title.toLowerCase().replace('_', '-');
      
      // Get fresh recipients
      const recipients = await this.getRecipientsForNotification(
        notificationType,
        'All' // Access management applies to all LOBs
      );

      // Add the affected user's email if it's a grant or update
      if (logEntry.Title === 'USER_ACCESS_GRANTED' || logEntry.Title === 'USER_ROLE_UPDATED') {
        recipients.push(userEmail);
      }

      // Send notification
      const result = await this.emailService.sendNotificationEmail(
        notificationType,
        recipients,
        {
          userName: logEntry.TargetUserName,
          userId: logEntry.TargetUserId,
          performedBy: logEntry.PerformedByName,
          changeDetails: logEntry.Details,
          timestamp: new Date(logEntry.LogTimestamp).toLocaleString()
        }
      );

      // Log the activity
      await this.logEmailActivity({
        activityType: `${logEntry.Title}_NOTIFICATION`,
        recipients: recipients,
        targetUser: logEntry.TargetUserId,
        success: result.success,
        details: { actionType: logEntry.Title }
      });

      return result;
      
    } catch (error) {
      console.error('❌ Failed to send user access notification:', error);
      return { success: false, message: error.message };
    }
  }

  // Log email activity for audit trail
  async logEmailActivity(activity) {
    try {
      const logEntry = {
        Title: activity.activityType,
        ActivityType: activity.activityType,
        Recipients: JSON.stringify(activity.recipients),
        Success: activity.success,
        Details: JSON.stringify(activity.details),
        Timestamp: new Date().toISOString(),
        PerformedBy: 'System'
      };

      // Save to EmailActivityLog list
      const response = await fetch(
        'https://teams.global.hsbc/sites/EmployeeEng/_api/web/lists/getbytitle(\'EmailActivityLog\')/items',
        {
          method: 'POST',
          headers: {
            'Accept': 'application/json; odata=verbose',
            'Content-Type': 'application/json; odata=verbose',
            'X-RequestDigest': await this.emailService.getFreshRequestDigest()
          },
          credentials: 'include',
          body: JSON.stringify({
            __metadata: { type: 'SP.Data.EmailActivityLogListItem' },
            ...logEntry
          })
        }
      );

      if (response.ok) {
        console.log('✅ Email activity logged successfully');
      }
      
    } catch (error) {
      console.error('❌ Failed to log email activity:', error);
    }
  }
}

export default EmailNotificationService;
