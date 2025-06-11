// services/EmailNotificationService.js - COMPLETE FIXED VERSION
class EmailNotificationService {
  constructor() {
    this.baseUrl = 'https://teams.global.hsbc/sites/EmployeeEng'; // Make sure this is your correct SharePoint site URL
    this.checkInterval = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
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
        // Fallback for SharePoint context if not available from API
        const digestElement = document.getElementById('__REQUESTDIGEST');
        return digestElement?.value || '';
      }
    } catch (err) {
      console.error('Error getting digest:', err);
      // Attempt to get from page context if API call fails
      const digestElement = document.getElementById('__REQUESTDIGEST');
      return digestElement?.value || '';
    }
  }

  // ✅ Get procedures from SharePoint
  async getProcedures() {
    try {
      console.log('📋 Loading procedures from SharePoint...');
      
      const response = await fetch(
        `${this.baseUrl}/_api/web/lists/getbytitle('Procedures')/items?$select=*&$top=1000`, // Adjust $top as needed
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json; odata=verbose',
            'Content-Type': 'application/json; odata=verbose'
          },
          credentials: 'include'
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Procedures loaded:', data.d.results);
        return data.d.results;
      } else {
        console.error('❌ Failed to load procedures:', response.status, await response.text());
        return [];
      }
    } catch (error) {
      console.error('❌ Error in getProcedures:', error);
      return [];
    }
  }

  // ✅ Send Email via SharePoint Utility
  async sendEmailViaSharePoint({ to, subject, body }) {
    try {
      if (!to || !subject || !body) {
        console.error('❌ Missing required email parameters: to, subject, or body');
        return { success: false, message: 'Missing required email parameters' };
      }

      console.log(`📧 Attempting to send email to: ${to} with subject: ${subject}`);
      
      const digest = await this.getFreshRequestDigest();
      if (!digest) {
        console.error('❌ Could not get request digest. Email not sent.');
        return { success: false, message: 'Could not get request digest' };
      }

      const emailEndpoint = `${this.baseUrl}/_api/SP.Utilities.Utility.SendEmail`;
      const emailHeaders = {
        'Accept': 'application/json;odata=verbose',
        'Content-Type': 'application/json;odata=verbose',
        'X-RequestDigest': digest,
      };

      const emailBody = {
        'properties': {
          '__metadata': { 'type': 'SP.Utilities.EmailProperties' },
          'To': { 'results': Array.isArray(to) ? to : [to] },
          'Subject': subject,
          'Body': body,
          'From': 'noreply@sharepointonline.com', // SharePoint sends from this address
          'IsBodyHtml': true
        }
      };

      const response = await fetch(emailEndpoint, {
        method: 'POST',
        headers: emailHeaders,
        body: JSON.stringify(emailBody),
        credentials: 'include'
      });

      if (response.ok) {
        console.log('✅ Email sent successfully!');
        return { success: true, message: 'Email sent successfully!' };
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to send email:', response.status, errorText);
        return { success: false, message: `Failed to send email: ${response.status} - ${errorText}` };
      }
    } catch (error) {
      console.error('❌ Error in sendEmailViaSharePoint:', error);
      return { success: false, message: error.message };
    }
  }

  // ✅ Get Email Activity Log from SharePoint
  async getEmailActivityLog() {
    try {
      console.log('📖 Loading email activity log...');
      const response = await fetch(
        `${this.baseUrl}/_api/web/lists/getbytitle('EmailActivityLog')/items?$select=*&$orderby=Created desc&$top=500`, // Adjust $top as needed
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json; odata=verbose',
            'Content-Type': 'application/json; odata=verbose'
          },
          credentials: 'include'
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Parse the 'Details' JSON string back into an object
        const logs = data.d.results.map(log => ({
          ...log,
          details: this.safeJsonParse(log.ActivityDetails, {}), // Use safeJsonParse here
          timestamp: log.Created // Use Created for timestamp
        }));
        console.log('✅ Email activity log loaded:', logs);
        return logs;
      } else {
        console.error('❌ Failed to load email activity log:', response.status, await response.text());
        return [];
      }
    } catch (error) {
      console.error('❌ Error in getEmailActivityLog:', error);
      return [];
    }
  }

  // ✅ Log Email Activity to SharePoint
  async logEmailActivity(activityType, performedBy, details = {}) {
    try {
      console.log(`📝 Logging email activity: ${activityType} by ${performedBy}`);
      
      const digest = await this.getFreshRequestDigest();
      if (!digest) {
        console.error('❌ Could not get request digest. Activity not logged.');
        return { success: false, message: 'Could not get request digest' };
      }

      const listName = 'EmailActivityLog'; // Ensure this list exists in SharePoint
      const logEndpoint = `${this.baseUrl}/_api/web/lists/getbytitle('${listName}')/items`;
      const logHeaders = {
        'Accept': 'application/json;odata=verbose',
        'Content-Type': 'application/json;odata=verbose',
        'X-RequestDigest': digest,
      };

      const logBody = {
        '__metadata': { 'type': `SP.Data.${listName.replace(/\s/g, '_')}ListItem` }, // Dynamic type name
        'ActivityType': activityType,
        'PerformedBy': performedBy,
        'ActivityDetails': JSON.stringify(details) // Store details as JSON string
      };

      const response = await fetch(logEndpoint, {
        method: 'POST',
        headers: logHeaders,
        body: JSON.stringify(logBody),
        credentials: 'include'
      });

      if (response.ok) {
        console.log('✅ Email activity logged successfully!');
        return { success: true, message: 'Email activity logged successfully!' };
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to log email activity:', response.status, errorText);
        return { success: false, message: `Failed to log activity: ${response.status} - ${errorText}` };
      }
    } catch (error) {
      console.error('❌ Error in logEmailActivity:', error);
      return { success: false, message: error.message };
    }
  }

  // ✅ Get Notification Log from SharePoint
  async getNotificationLog() {
    try {
      console.log('⏳ Loading notification log...');
      const response = await fetch(
        `${this.baseUrl}/_api/web/lists/getbytitle('NotificationLog')/items?$select=*&$top=1000`, // Adjust $top as needed
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json; odata=verbose',
            'Content-Type': 'application/json; odata=verbose'
          },
          credentials: 'include'
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Notification log loaded:', data.d.results);
        return data.d.results;
      } else {
        console.error('❌ Failed to load notification log:', response.status, await response.text());
        return [];
      }
    } catch (error) {
      console.error('❌ Error in getNotificationLog:', error);
      return [];
    }
  }

  // ✅ Log Notification to SharePoint
  async logNotification(procedureId, notificationType, recipientEmail) {
    try {
      console.log(`📝 Logging notification: Proc ID ${procedureId}, Type ${notificationType}, Recipient ${recipientEmail}`);
      
      const digest = await this.getFreshRequestDigest();
      if (!digest) {
        console.error('❌ Could not get request digest. Notification not logged.');
        return { success: false, message: 'Could not get request digest' };
      }

      const listName = 'NotificationLog'; // Ensure this list exists in SharePoint
      const logEndpoint = `${this.baseUrl}/_api/web/lists/getbytitle('${listName}')/items`;
      const logHeaders = {
        'Accept': 'application/json;odata=verbose',
        'Content-Type': 'application/json;odata=verbose',
        'X-RequestDigest': digest,
      };

      const logBody = {
        '__metadata': { 'type': `SP.Data.${listName.replace(/\s/g, '_')}ListItem` }, // Dynamic type name
        'ProcedureId': procedureId,
        'NotificationType': notificationType,
        'RecipientEmail': recipientEmail,
        'NotificationDate': new Date().toISOString()
      };

      const response = await fetch(logEndpoint, {
        method: 'POST',
        headers: logHeaders,
        body: JSON.stringify(logBody),
        credentials: 'include'
      });

      if (response.ok) {
        console.log('✅ Notification logged successfully!');
        return { success: true, message: 'Notification logged successfully!' };
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to log notification:', response.status, errorText);
        return { success: false, message: `Failed to log notification: ${response.status} - ${errorText}` };
      }
    } catch (error) {
      console.error('❌ Error in logNotification:', error);
      return { success: false, message: error.message };
    }
  }

  // ✅ Get Recipients from SharePoint
  async getRecipients() {
    try {
      console.log('👥 Loading recipients from SharePoint...');
      const response = await fetch(
        `${this.baseUrl}/_api/web/lists/getbytitle('Recipients')/items?$select=ID,Title,Email,Type,IsActive`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json; odata=verbose',
            'Content-Type': 'application/json; odata=verbose'
          },
          credentials: 'include'
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Recipients loaded:', data.d.results);
        return data.d.results.map(r => ({
          id: r.ID,
          name: r.Title,
          email: r.Email,
          type: r.Type,
          isActive: r.IsActive
        }));
      } else {
        console.error('❌ Failed to load recipients:', response.status, await response.text());
        return [];
      }
    } catch (error) {
      console.error('❌ Error in getRecipients:', error);
      return [];
    }
  }

  // ✅ Add or Update Recipient in SharePoint
  async saveRecipient(recipient) {
    try {
      console.log(`💾 Saving recipient: ${recipient.name}`);
      
      const digest = await this.getFreshRequestDigest();
      if (!digest) {
        console.error('❌ Could not get request digest. Recipient not saved.');
        return { success: false, message: 'Could not get request digest' };
      }

      const listName = 'Recipients'; // Ensure this list exists
      const listItemType = `SP.Data.${listName.replace(/\s/g, '_')}ListItem`;
      let endpoint = `${this.baseUrl}/_api/web/lists/getbytitle('${listName}')/items`;
      let method = 'POST';
      let headers = {
        'Accept': 'application/json;odata=verbose',
        'Content-Type': 'application/json;odata=verbose',
        'X-RequestDigest': digest,
      };

      if (recipient.id) { // If recipient has an ID, it's an update
        endpoint += `(${recipient.id})`;
        method = 'POST'; // POST with X-HTTP-Method for update
        headers['X-HTTP-Method'] = 'MERGE';
        headers['If-Match'] = '*'; // To overwrite existing item
      }

      const body = {
        '__metadata': { 'type': listItemType },
        'Title': recipient.name,
        'Email': recipient.email,
        'Type': recipient.type,
        'IsActive': recipient.isActive
      };

      const response = await fetch(endpoint, {
        method: method,
        headers: headers,
        body: JSON.stringify(body),
        credentials: 'include'
      });

      if (response.ok) {
        console.log('✅ Recipient saved successfully!');
        return { success: true, message: 'Recipient saved successfully!' };
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to save recipient:', response.status, errorText);
        return { success: false, message: `Failed to save recipient: ${response.status} - ${errorText}` };
      }
    } catch (error) {
      console.error('❌ Error in saveRecipient:', error);
      return { success: false, message: error.message };
    }
  }

  // ✅ Delete Recipient from SharePoint
  async deleteRecipient(id) {
    try {
      console.log(`🗑️ Deleting recipient with ID: ${id}`);
      
      const digest = await this.getFreshRequestDigest();
      if (!digest) {
        console.error('❌ Could not get request digest. Recipient not deleted.');
        return { success: false, message: 'Could not get request digest' };
      }

      const listName = 'Recipients';
      const endpoint = `${this.baseUrl}/_api/web/lists/getbytitle('${listName}')/items(${id})`;
      const headers = {
        'Accept': 'application/json;odata=verbose',
        'Content-Type': 'application/json;odata=verbose',
        'X-Request-Digest': digest,
        'IF-MATCH': '*', // Required for DELETE
        'X-HTTP-Method': 'DELETE',
      };

      const response = await fetch(endpoint, {
        method: 'POST', // DELETE operation sent as POST with X-HTTP-Method header
        headers: headers,
        credentials: 'include'
      });

      if (response.ok) {
        console.log('✅ Recipient deleted successfully!');
        return { success: true, message: 'Recipient deleted successfully!' };
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to delete recipient:', response.status, errorText);
        return { success: false, message: `Failed to delete recipient: ${response.status} - ${errorText}` };
      }
    } catch (error) {
      console.error('❌ Error in deleteRecipient:', error);
      return { success: false, message: error.message };
    }
  }

  // Helper to validate email format
  isValidEmail(email) {
    // Basic email regex for validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Helper for safe JSON parsing
  safeJsonParse(jsonString, defaultValue = null) {
    try {
      return typeof jsonString === 'string' && jsonString.length > 0 ? JSON.parse(jsonString) : defaultValue;
    } catch (error) {
      console.warn('⚠️ JSON parse error:', error);
      return defaultValue;
    }
  }

  // Start/stop methods for monitoring (client-side, requires browser access)
  async startEmailMonitoring() {
    if (this.isRunning) {
      console.log('📧 Email monitoring already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting email monitoring...');

    try {
      // Perform an immediate check on startup
      await this.checkAndSendNotifications();

      // Set up recurring check
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

  // Main logic for checking procedures and sending notifications
  async checkAndSendNotifications() {
    console.log('🔍 Checking for expiring procedures and sending notifications...');
    const now = new Date();
    this.lastCheckTime = now.toISOString();

    try {
      const procedures = await this.getProcedures();
      const notificationLog = await this.getNotificationLog();
      const recipients = await this.getRecipients();

      const staffRecipients = recipients.filter(r => r.IsActive && r.Type === 'Staff');
      const managementRecipients = recipients.filter(r => r.IsActive && r.Type === 'Management');

      const expiringProcedures = this.getExpiringProcedures(procedures, notificationLog);

      for (const procedure of expiringProcedures) {
        if (procedure.expirationStage === 'WARNING') {
          // Send warning notification to staff
          const subject = `[HSBC Procedures Hub] Warning: Procedure "${procedure.name}" Nearing Expiry`;
          const body = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #FFC107; padding: 20px; color: white;">
                <h1>Procedure Expiry Warning</h1>
                <p>Notification from Procedures Hub</p>
              </div>
              <div style="padding: 20px;">
                <p>Dear Team,</p>
                <p>Procedure <strong>"${procedure.name}"</strong> (ID: ${procedure.id}) is nearing its expiry date: <strong>${new Date(procedure.expiryDate).toLocaleDateString()}</strong>.</p>
                <p>Please review and update this procedure as soon as possible to ensure compliance.</p>
                <p>You can access the procedure here: <a href="${this.baseUrl}/Lists/Procedures/DispForm.aspx?ID=${procedure.id}">${procedure.name}</a></p>
                <p>Thank you for your attention to this matter.</p>
              </div>
            </div>
          `;
          for (const recipient of staffRecipients) {
            if (this.isValidEmail(recipient.email)) {
              await this.sendEmailViaSharePoint({ to: recipient.email, subject, body });
              await this.logNotification(procedure.id, 'WARNING', recipient.email);
            } else {
              console.warn(`Invalid email for staff recipient: ${recipient.email}`);
            }
          }
        } else if (procedure.expirationStage === 'CRITICAL') {
          // Send critical notification to management
          const subject = `[HSBC Procedures Hub] Critical: Procedure "${procedure.name}" Expired`;
          const body = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #F44336; padding: 20px; color: white;">
                <h1>Procedure Expired - Critical Alert</h1>
                <p>Notification from Procedures Hub</p>
              </div>
              <div style="padding: 20px;">
                <p>Dear Management Team,</p>
                <p>Procedure <strong>"${procedure.name}"</strong> (ID: ${procedure.id}) has expired on: <strong>${new Date(procedure.expiryDate).toLocaleDateString()}</strong>.</p>
                <p>This is a critical compliance issue. Please take immediate action to address this.</p>
                <p>You can access the procedure here: <a href="${this.baseUrl}/Lists/Procedures/DispForm.aspx?ID=${procedure.id}">${procedure.name}</a></p>
                <p>Thank you.</p>
              </div>
            </div>
          `;
          for (const recipient of managementRecipients) {
            if (this.isValidEmail(recipient.email)) {
              await this.sendEmailViaSharePoint({ to: recipient.email, subject, body });
              await this.logNotification(procedure.id, 'CRITICAL', recipient.email);
            } else {
              console.warn(`Invalid email for management recipient: ${recipient.email}`);
            }
          }
        }
      }
      console.log('✅ Expiring procedures check complete.');
    } catch (error) {
      console.error('❌ Error during checkAndSendNotifications:', error);
    }
  }

  // Helper to determine expiry stage and if notification should be sent
  getExpiringProcedures(procedures, notificationLog) {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day for comparison

    return procedures.filter(procedure => {
      const expiryDate = new Date(procedure.ExpiryDate);
      expiryDate.setHours(0, 0, 0, 0);

      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      let expirationStage = null;
      let shouldNotify = false;

      // Warning: 30 days before expiry, if not already notified
      if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
        if (!notificationLog.some(log => log.ProcedureId === procedure.ID && log.NotificationType === 'WARNING')) {
          expirationStage = 'WARNING';
          shouldNotify = true;
        }
      } 
      // Critical: On or after expiry date, if not already notified
      else if (daysUntilExpiry <= 0) {
        if (!notificationLog.some(log => log.ProcedureId === procedure.ID && log.NotificationType === 'CRITICAL')) {
          expirationStage = 'CRITICAL';
          shouldNotify = true;
        }
      }

      if (shouldNotify) {
        return {
          id: procedure.ID,
          name: procedure.Title,
          expiryDate: procedure.ExpiryDate,
          expirationStage: expirationStage
        };
      }
      return false;
    }).filter(Boolean); // Filter out false values
  }

  // ✅ NEW: Implement Access Granted Notification
  async triggerUserAccessNotification(userDisplayName, userEmail, grantedBy) {
    try {
      if (!this.isValidEmail(userEmail)) {
        console.warn(`❌ Cannot send access granted notification: Invalid email for ${userDisplayName}`);
        return { success: false, message: 'Invalid recipient email' };
      }

      const subject = `[HSBC Procedures Hub] Access Granted: ${userDisplayName}`;
      const body = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
          <div style="background: #4CAF50; padding: 20px; color: white; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">Access Granted</h1>
            <p style="margin: 5px 0 0;">Notification from Procedures Hub</p>
          </div>
          <div style="padding: 20px; color: #333;">
            <p>Dear ${userDisplayName},</p>
            <p>Your access to the HSBC Procedures Hub has been successfully granted by <strong>${grantedBy}</strong>.</p>
            <p>You can now access the hub and its resources via the following link:</p>
            <p style="text-align: center; margin: 20px 0;">
              <a href="${this.baseUrl}" style="display: inline-block; padding: 12px 25px; background: #2196F3; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Go to Procedures Hub
              </a>
            </p>
            <p>If you have any questions or believe this is an error, please contact the administrators of the Procedures Hub.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #777; text-align: center;">This is an automated notification. Please do not reply to this email.</p>
          </div>
        </div>
      `;

      console.log(`📧 Sending Access Granted email to: ${userEmail}`);
      const result = await this.sendEmailViaSharePoint({
        to: userEmail,
        subject: subject,
        body: body
      });

      if (result.success) {
        await this.logEmailActivity('ACCESS_GRANTED_NOTIFICATION', grantedBy, {
          userDisplayName: userDisplayName,
          userEmail: userEmail,
          grantedBy: grantedBy,
          timestamp: new Date().toISOString()
        });
      }

      return result;
    } catch (error) {
      console.error('❌ Error sending access granted notification:', error);
      return { success: false, message: error.message };
    }
  }

  // ✅ NEW: Implement Access Revoked Notification
  async triggerUserAccessRevokedNotification(userDisplayName, userEmail, revokedBy) {
    try {
      if (!this.isValidEmail(userEmail)) {
        console.warn(`❌ Cannot send access revoked notification: Invalid email for ${userDisplayName}`);
        return { success: false, message: 'Invalid recipient email' };
      }

      const subject = `[HSBC Procedures Hub] Access Revoked: ${userDisplayName}`;
      const body = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
          <div style="background: #D32F2F; padding: 20px; color: white; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">Access Revoked</h1>
            <p style="margin: 5px 0 0;">Notification from Procedures Hub</p>
          </div>
          <div style="padding: 20px; color: #333;">
            <p>Dear ${userDisplayName},</p>
            <p>Your access to the HSBC Procedures Hub has been revoked by <strong>${revokedBy}</strong>.</p>
            <p>If you believe this is an error or have any questions regarding this change, please contact the administrators of the Procedures Hub immediately.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #777; text-align: center;">This is an automated notification. Please do not reply to this email.</p>
          </div>
        </div>
      `;

      console.log(`📧 Sending Access Revoked email to: ${userEmail}`);
      const result = await this.sendEmailViaSharePoint({
        to: userEmail,
        subject: subject,
        body: body
      });

      if (result.success) {
        await this.logEmailActivity('ACCESS_REVOKED_NOTIFICATION', revokedBy, {
          userDisplayName: userDisplayName,
          userEmail: userEmail,
          revokedBy: revokedBy,
          timestamp: new Date().toISOString()
        });
      }

      return result;
    } catch (error) {
      console.error('❌ Error sending access revoked notification:', error);
      return { success: false, message: error.message };
    }
  }

  // ✅ Keep other stub methods if they are not yet implemented and you intend to implement them later.
  async triggerUserRoleChangeNotification() { return { success: true, message: 'Role change notification stub called.' }; }
  async triggerProcedureUploadNotification() { return { success: true, message: 'Procedure upload notification stub called.' }; }
}

export default EmailNotificationService;
