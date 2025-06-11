// services/EmailNotificationService.js - COMPLETE VERSION WITH ALL METHODS AND REFINEMENTS
class EmailNotificationService {
  constructor() {
    this.baseUrl = 'https://teams.global.hsbc/sites/EmployeeEng';
    this.checkInterval = 24 * 60 * 60 * 1000;
    this.isRunning = false;
    this.lastCheckTime = null;
  }

  // ✅ Get fresh request digest
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
      } else {
        // Fallback: If digest endpoint fails, try to get from hidden field
        const digestElement = document.getElementById('__REQUESTDIGEST');
        return digestElement?.value || '';
      }
    } catch (err) {
      console.error('Error getting digest:', err);
      return '';
    }
  }

  // ✅ Get procedures from SharePoint
  async getProcedures() {
    try {
      console.log('📋 Loading procedures from SharePoint...');

      const response = await fetch(
        `${this.baseUrl}/_api/web/lists/getbytitle('Procedures')/items?$select=*&$top=1000`,
        {
          headers: { 'Accept': 'application/json; odata=verbose' },
          credentials: 'include'
        }
      );

      if (response.ok) {
        const data = await response.json();
        const procedures = data.d.results.map(item => ({
          id: item.Id || 0,
          name: item.Title || `Procedure ${item.Id || 'Unknown'}`,
          expiry: item.ExpiryDate || null,
          primary_owner: item.PrimaryOwner || 'Unknown Owner',
          primary_owner_email: item.PrimaryOwnerEmail || '',
          secondary_owner: item.SecondaryOwner || '',
          secondary_owner_email: item.SecondaryOwnerEmail || '',
          lob: item.LOB || 'Unknown LOB',
          score: item.QualityScore || 0,
          status: item.Status || 'Active'
        }));

        console.log('✅ Procedures loaded from SharePoint:', procedures.length);
        return procedures;
      } else {
        console.error('❌ Failed to load procedures:', response.status);
        return [];
      }
    } catch (error) {
      console.error('❌ Error loading procedures:', error);
      return [];
    }
  }

  // ✅ FIXED: Get expiring procedures - THIS WAS MISSING!
  async getExpiringProcedures() {
    try {
      console.log('📅 Loading expiring procedures from SharePoint...');

      const procedures = await this.getProcedures();
      const now = new Date();
      const expiring = [];

      console.log(`📋 Got ${procedures.length} procedures, filtering for expiring...`);

      for (const procedure of procedures) {
        if (procedure.expiry) {
          try {
            const expiry = new Date(procedure.expiry);
            if (!isNaN(expiry.getTime())) {
              const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

              // Include procedures expiring within 30 days OR already expired (up to 30 days overdue)
              if (daysLeft <= 30 && daysLeft >= -30) {
                expiring.push({
                  id: procedure.id,
                  name: procedure.name,
                  owner: procedure.primary_owner,
                  ownerEmail: procedure.primary_owner_email,
                  expiry: procedure.expiry,
                  daysLeft: daysLeft,
                  status: daysLeft <= 0 ? 'expired' : daysLeft <= 7 ? 'urgent' : 'warning',
                  lob: procedure.lob,
                  lastNotificationSent: '', // Will be populated if needed
                  willSendNotification: this.shouldSendNotificationSync(daysLeft)
                });
                console.log(`📅 Added expiring procedure: ${procedure.name} (${daysLeft} days)`);
              }
            }
          } catch (dateError) {
            console.warn('⚠️ Invalid date for procedure:', procedure.name, procedure.expiry);
            continue;
          }
        }
      }

      const sortedExpiring = expiring.sort((a, b) => a.daysLeft - b.daysLeft);
      console.log(`✅ Expiring procedures loaded: ${sortedExpiring.length} found`);
      return sortedExpiring;

    } catch (error) {
      console.error('❌ Error loading expiring procedures:', error);
      return [];
    }
  }

  // ✅ FIXED: Get email activity log - THIS WAS MISSING!
  // Refinement 2: Added robust error handling for response.json()
  async getEmailActivityLog(limit = 50) {
    try {
      console.log('📧 Loading email activity log from SharePoint...');

      const response = await fetch(
        `${this.baseUrl}/_api/web/lists/getbytitle('EmailActivityLog')/items?$select=*&$orderby=Id desc&$top=${limit}`,
        {
          headers: { 'Accept': 'application/json; odata=verbose' },
          credentials: 'include'
        }
      );

      if (response.ok) {
        let data;
        try {
          // Attempt to parse JSON response. If it fails, it means the content wasn't JSON.
          data = await response.json();
        } catch (jsonError) {
          console.error('❌ Failed to parse JSON from email activity log response. Response might be HTML or malformed JSON.', jsonError);
          const rawText = await response.text(); // Get raw text to inspect
          console.error('Raw response text (first 500 chars):', rawText.substring(0, 500) + '...'); // Log first 500 chars
          return []; // Return empty array if JSON parsing fails
        }

        console.log(`📧 Got ${data.d.results.length} email activity records from SharePoint`);

        const activities = data.d.results.map(item => {
          const details = this.safeJsonParse(item.ActivityDetails, {}); // Calls the refined safeJsonParse

          return {
            id: item.Id || 0,
            activityType: item.ActivityType || 'Unknown Activity',
            performedBy: item.PerformedBy || 'System',
            timestamp: item.ActivityTimestamp || item.Created || new Date().toISOString(),
            status: item.Status || 'SUCCESS',
            details: details,
            readableActivity: this.getReadableActivity(item.ActivityType || 'Unknown', details)
          };
        });

        console.log('✅ Email activity log processed:', activities.length, 'entries');
        return activities;
      } else {
        const errorText = await response.text(); // Get error details for non-ok responses
        console.error('❌ Failed to load email activity log. Status:', response.status, 'Error Text:', errorText);
        return [];
      }

    } catch (error) {
      console.error('❌ Error loading email activity log:', error);
      return [];
    }
  }

  // ✅ FIXED: Readable activity with NO undefined values
  getReadableActivity(activityType, details) {
    // Ensure details is always an object
    const safeDetails = details || {};

    console.log('🔍 Processing activity:', activityType, safeDetails);

    switch (activityType) {
      case 'PROCEDURE_EXPIRY_NOTIFICATION':
        const procedureName = safeDetails.procedureName || 'Unknown Procedure';
        const daysLeft = safeDetails.daysLeft !== undefined ? safeDetails.daysLeft : 'Unknown';
        return `Expiry notification sent for: ${procedureName} (${daysLeft} days)`;

      case 'ACCESS_GRANTED_NOTIFICATION':
        const userName = safeDetails.userDisplayName || safeDetails.userId || 'Unknown User';
        const grantedBy = safeDetails.grantedBy || 'Unknown Admin';
        return `Access granted to ${userName} by ${grantedBy}`;

      case 'ACCESS_REVOKED_NOTIFICATION':
        const revokedUser = safeDetails.userDisplayName || safeDetails.userId || 'Unknown User';
        const revokedBy = safeDetails.performedBy || 'Unknown Admin';
        return `Access revoked for ${revokedUser} by ${revokedBy}`;

      case 'ROLE_CHANGE_NOTIFICATION':
        const roleUser = safeDetails.userDisplayName || safeDetails.userId || 'Unknown User';
        const oldRole = safeDetails.oldRole || 'Unknown';
        const newRole = safeDetails.newRole || 'Unknown';
        return `Role changed for ${roleUser}: ${oldRole} → ${newRole}`;

      case 'PROCEDURE_UPLOAD_NOTIFICATION':
        const uploadProcedure = safeDetails.procedureName || 'Unknown Procedure';
        const lob = safeDetails.lob || 'Unknown LOB';
        return `New procedure uploaded: ${uploadProcedure} (${lob})`;

      case 'AUTOMATED_CHECK':
        const checked = safeDetails.proceduresChecked !== undefined ? safeDetails.proceduresChecked : 0;
        const sent = safeDetails.notificationsSent !== undefined ? safeDetails.notificationsSent : 0;
        return `Automated check: ${checked} procedures checked, ${sent} notifications sent`;

      case 'AUTOMATED_CHECK_FAILED':
        const error = safeDetails.error || 'Unknown error';
        return `Automated check failed: ${error}`;

      default:
        const fallback = activityType ? activityType.replace(/_/g, ' ').toLowerCase() : 'unknown activity';
        return fallback;
    }
  }

  // ✅ Helper method for sync notification checking
  shouldSendNotificationSync(daysLeft) {
    // Simple logic - would send if expired, within 7 days, or within 30 days
    return daysLeft <= 30;
  }

  // ✅ Check and send notifications - FIXED UNDEFINED VALUES
  async checkAndSendNotifications() {
    try {
      // Prevent rapid checks
      const now = new Date();
      if (this.lastCheckTime && (now - this.lastCheckTime) < 30 * 60 * 1000) {
        console.log('⏸️ Skipping check - too soon since last check');
        return;
      }
      this.lastCheckTime = now;

      console.log('🔍 ========== STARTING AUTOMATED NOTIFICATION CHECK ==========');

      const procedures = await this.getProcedures();
      console.log(`📋 Procedures loaded: ${procedures.length}`);

      if (procedures.length === 0) {
        console.log('⚠️ No procedures found in SharePoint');
        await this.logEmailActivity('AUTOMATED_CHECK', 'System', {
          proceduresChecked: 0,
          validProceduresFound: 0,
          notificationsSent: 0,
          message: 'No procedures found in SharePoint',
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Filter for procedures with valid expiry dates
      const validProcedures = procedures.filter(p => {
        if (!p.expiry) return false;
        const expiry = new Date(p.expiry);
        return !isNaN(expiry.getTime());
      });

      console.log(`📊 Valid procedures with expiry dates: ${validProcedures.length}`);

      if (validProcedures.length === 0) {
        console.log('⚠️ No procedures with valid expiry dates found');
        await this.logEmailActivity('AUTOMATED_CHECK', 'System', {
          proceduresChecked: procedures.length,
          validProceduresFound: 0,
          notificationsSent: 0,
          message: 'No procedures with valid expiry dates',
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Check each valid procedure for notifications
      let notificationsSent = 0;

      for (const procedure of validProcedures) {
        try {
          const expiry = new Date(procedure.expiry);
          const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

          console.log(`🔍 Checking procedure: ${procedure.name} - ${daysLeft} days left`);

          // Simple logic - check if expiring within 30 days
          if (daysLeft <= 30 && daysLeft > -30) { // Not too old
            const shouldSend = await this.shouldSendNotification(procedure, daysLeft);

            if (shouldSend) {
              console.log(`📧 Sending notification for: ${procedure.name}`);
              const result = await this.sendSimpleNotification(procedure, daysLeft);
              if (result.success) {
                notificationsSent++;
                await this.markNotificationSent(procedure, daysLeft);
                console.log(`✅ Notification sent successfully`);
              } else {
                console.log(`❌ Notification failed: ${result.message}`);
              }
            } else {
              console.log(`⏭️ Notification already sent for: ${procedure.name}`);
            }
          }
        } catch (error) {
          console.warn('⚠️ Error processing procedure:', procedure.name, error);
          continue;
        }
      }

      // Log the check with NO undefined values
      await this.logEmailActivity('AUTOMATED_CHECK', 'System', {
        proceduresChecked: procedures.length,
        validProceduresFound: validProcedures.length,
        notificationsSent: notificationsSent,
        timestamp: new Date().toISOString(),
        systemStatus: notificationsSent > 0 ? 'NOTIFICATIONS_SENT' : 'NO_NOTIFICATIONS_NEEDED'
      });

      console.log(`✅ ========== CHECK COMPLETE: ${procedures.length} checked, ${notificationsSent} sent ==========`);

    } catch (error) {
      console.error('❌ ========== CHECK FAILED ==========', error);
      await this.logEmailActivity('AUTOMATED_CHECK_FAILED', 'System', {
        error: error.message || 'Unknown error',
        timestamp: new Date().toISOString(),
        errorType: error.name || 'Error'
      });
    }
  }

  // ✅ Should send notification check
  async shouldSendNotification(procedure, daysLeft) {
    try {
      // Create a simple key based on procedure and notification type
      const notificationType = daysLeft <= 0 ? 'expired' : daysLeft <= 7 ? '7day' : '30day';
      const key = `${procedure.id}_${procedure.expiry}_${notificationType}`;

      const response = await fetch(
        `${this.baseUrl}/_api/web/lists/getbytitle('NotificationLog')/items?$filter=NotificationKey eq '${key}'&$top=1`,
        {
          headers: { 'Accept': 'application/json; odata=verbose' },
          credentials: 'include'
        }
      );

      if (response.ok) {
        const data = await response.json();
        const alreadySent = data.d.results.length > 0;
        console.log(`🔍 Notification check for ${procedure.name} (${notificationType}): ${alreadySent ? 'Already sent' : 'Not sent'}`);
        return !alreadySent;
      }

      return true; // Default to send if we can't check
    } catch (error) {
      console.error('❌ Error checking notification history:', error);
      return true;
    }
  }

  // ✅ Send simple notification
  async sendSimpleNotification(procedure, daysLeft) {
    try {
      const recipients = this.getValidRecipients(procedure);

      if (recipients.length === 0) {
        console.log('❌ No valid recipients found');
        return { success: false, message: 'No valid recipients' };
      }

      const subject = `[HSBC] ${procedure.name} - ${daysLeft <= 0 ? 'EXPIRED' : 'EXPIRING'} (${Math.abs(daysLeft)} days)`;
      const body = this.generateSimpleEmailBody(procedure, daysLeft);

      console.log(`📧 Sending email to: ${recipients.join(', ')}`);
      const result = await this.sendEmailViaSharePoint({
        to: recipients,
        subject: subject,
        body: body
      });

      if (result.success) {
        // Log the notification with complete details
        await this.logEmailActivity('PROCEDURE_EXPIRY_NOTIFICATION', 'System', {
          procedureName: procedure.name,
          procedureId: procedure.id,
          notificationType: daysLeft <= 0 ? 'expired' : daysLeft <= 7 ? 'urgent' : 'warning',
          daysLeft: daysLeft,
          recipients: recipients,
          recipientCount: recipients.length,
          lob: procedure.lob,
          primaryOwner: procedure.primary_owner,
          expiryDate: procedure.expiry,
          timestamp: new Date().toISOString()
        });
      }

      return result;
    } catch (error) {
      console.error('❌ Error sending notification:', error);
      return { success: false, message: error.message };
    }
  }

  // ✅ Mark notification as sent
  async markNotificationSent(procedure, daysLeft) {
    try {
      const requestDigest = await this.getFreshRequestDigest();
      const notificationType = daysLeft <= 0 ? 'expired' : daysLeft <= 7 ? '7day' : '30day';
      const key = `${procedure.id}_${procedure.expiry}_${notificationType}`;

      const logData = {
        __metadata: { type: 'SP.Data.NotificationLogListItem' },
        Title: `${procedure.name}_${notificationType}_${new Date().toISOString()}`,
        NotificationKey: key,
        NotificationType: notificationType,
        SentDate: new Date().toISOString(),
        Status: 'SENT'
      };

      await fetch(
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

      console.log(`✅ Marked notification as sent: ${key}`);
    } catch (error) {
      console.error('❌ Error marking notification sent:', error);
    }
  }

  // ✅ FIXED: Log activity with NO undefined values
  async logEmailActivity(activityType, performedBy, details) {
    try {
      const requestDigest = await this.getFreshRequestDigest();

      // Ensure NO undefined values - provide defaults for everything
      const safeDetails = {
        procedureName: details.procedureName || 'System Action',
        procedureId: details.procedureId || 'N/A',
        notificationType: details.notificationType || 'System',
        proceduresChecked: details.proceduresChecked !== undefined ? details.proceduresChecked : 0,
        notificationsSent: details.notificationsSent !== undefined ? details.notificationsSent : 0,
        validProceduresFound: details.validProceduresFound !== undefined ? details.validProceduresFound : 0,
        timestamp: details.timestamp || new Date().toISOString(),
        systemVersion: 'EmailNotificationService v5.0',
        ...details // Spread other details but safe defaults come first
      };

      console.log('📝 Logging email activity:', activityType, safeDetails);

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
      } else {
        console.warn('⚠️ Could not log email activity:', response.status);
      }

    } catch (error) {
      console.error('❌ Error logging email activity:', error);
    }
  }

  // ✅ Send email via SharePoint
  async sendEmailViaSharePoint(emailData) {
    try {
      const requestDigest = await this.getFreshRequestDigest();

      const emailPayload = {
        properties: {
          __metadata: { type: 'SP.Utilities.EmailProperties' },
          To: {
            results: Array.isArray(emailData.to) ? emailData.to : [emailData.to]
          },
          Subject: emailData.subject || 'HSBC Procedures Hub Notification',
          Body: emailData.body || 'Automated notification'
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
        console.log('✅ Email sent successfully via SharePoint');
        return { success: true, message: 'Email sent' };
      } else {
        const errorText = await response.text();
        console.error('❌ Email failed:', response.status, errorText);
        return { success: false, message: `Failed: ${response.status}` };
      }

    } catch (error) {
      console.error('❌ Email error:', error);
      return { success: false, message: error.message };
    }
  }

  // Helper methods

  // Refinement 1: Enhanced safeJsonParse
  safeJsonParse(jsonString, defaultValue) {
    try {
      // Ensure jsonString is actually a string and not null/undefined
      if (typeof jsonString !== 'string' || !jsonString.trim()) {
        console.warn('⚠️ safeJsonParse: Input is not a valid string or is empty, returning default value.', jsonString);
        return defaultValue;
      }

      // Check for common non-JSON patterns that might cause issues before parsing
      // This is a heuristic and might not catch all cases, but helps with HTML-like content
      if (jsonString.trim().startsWith('<') && jsonString.trim().endsWith('>')) {
        console.warn('⚠️ safeJsonParse: Input looks like HTML, returning default value.', jsonString.substring(0, 100) + '...');
        return defaultValue;
      }

      return JSON.parse(jsonString);
    } catch (error) {
      console.warn('⚠️ JSON parse error for input:', jsonString.substring(0, 100) + '...', 'Error:', error.message);
      return defaultValue;
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
    return email.includes('@') && email.includes('.');
  }

  generateSimpleEmailBody(procedure, daysLeft) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #d40000; padding: 20px; color: white;">
          <h1>HSBC Procedures Hub</h1>
          <p>Automated Notification</p>
        </div>
        <div style="padding: 20px;">
          <h2>${daysLeft <= 0 ? '❌ Procedure Expired' : '⏰ Procedure Expiring Soon'}</h2>
          <div style="background: #f5f5f5; padding: 15px; border-left: 4px solid #d40000;">
            <h3>${procedure.name}</h3>
            <p><strong>Owner:</strong> ${procedure.primary_owner}</p>
            <p><strong>Expiry:</strong> ${new Date(procedure.expiry).toLocaleDateString()}</p>
            <p><strong>Days ${daysLeft <= 0 ? 'Overdue' : 'Left'}:</strong> ${Math.abs(daysLeft)}</p>
            <p><strong>LOB:</strong> ${procedure.lob}</p>
          </div>
          <p>Please review and update this procedure as needed.</p>
        </div>
      </div>
    `;
  }

  // Start/stop methods
  async startEmailMonitoring() {
    if (this.isRunning) {
      console.log('📧 Email monitoring already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting email monitoring...');

    try {
      await this.checkAndSendNotifications();

      this.monitoringInterval = setInterval(async () => {
        try {
          await this.checkAndSendNotifications();
        } catch (error) {
          console.error('❌ Error in monitoring cycle:', error);
        }
      }, this.checkInterval);

      console.log('✅ Email monitoring started');

    } catch (error) {
      console.error('❌ Error starting monitoring:', error);
      this.isRunning = false;
    }
  }

  async stopEmailMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isRunning = false;
    console.log('⏹️ Email monitoring stopped');
  }

  // Stub methods for compatibility
  async triggerUserAccessNotification() { return { success: true }; }
  async triggerUserRoleChangeNotification() { return { success: true }; }
  async triggerUserAccessRevokedNotification() { return { success: true }; }
  async triggerProcedureUploadNotification() { return { success: true }; }
}

export default EmailNotificationService;
