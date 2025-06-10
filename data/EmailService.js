// services/EmailService.js - Enhanced with LOB-specific recipients and broadcast
import SharePointService from './SharePointService';

class EmailService {
  constructor() {
    this.spService = new SharePointService();
    this.baseUrl = 'https://teams.global.hsbc/sites/EmployeeEng';
    
    // LOB configuration
    this.lobConfig = {
      'IWPB': 'International Wealth and Premier Banking',
      'CIB': 'Commercial and Institutional Banking',
      'GCOO': 'Group Chief Operating Officer'
    };

    // Escalation types configuration
    this.escalationTypes = {
      'new-procedure-uploaded': 'New Procedure Uploaded',
      'procedure-expiring': 'Procedure Expiring Soon',
      'procedure-expired': 'Procedure Expired',
      'low-quality-score': 'Low Quality Score Alert',
      'system-maintenance': 'System Maintenance',
      'broadcast-announcement': 'Broadcast Announcement'
    };

    console.log('📧 Enhanced EmailService initialized with LOB-specific recipients');
  }

  // ===================================================================
  // ENHANCED: LOB-SPECIFIC EMAIL CONFIGURATION MANAGEMENT
  // ===================================================================

  async getEmailConfigByLOB(lob = null, escalationType = null) {
    try {
      console.log('📧 Getting LOB-specific email configuration...', { lob, escalationType });
      
      let filterQuery = '';
      if (lob && escalationType) {
        filterQuery = `?$filter=LOB eq '${lob}' and EscalationType eq '${escalationType}'`;
      } else if (lob) {
        filterQuery = `?$filter=LOB eq '${lob}'`;
      } else if (escalationType) {
        filterQuery = `?$filter=EscalationType eq '${escalationType}'`;
      }

      const response = await fetch(
        `${this.baseUrl}/_api/web/lists/getbytitle('EmailConfiguration')/items${filterQuery}&$orderby=LOB,EscalationType`,
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
        console.warn(`⚠️ EmailConfiguration list not accessible (${response.status}), using defaults`);
        return this.getDefaultLOBEmailConfig(lob, escalationType);
      }

      const data = await response.json();
      console.log('✅ LOB email config loaded:', data.d.results.length, 'items');
      
      return this.processLOBEmailConfig(data.d.results, lob, escalationType);
      
    } catch (error) {
      console.error('❌ Error getting LOB email config:', error);
      return this.getDefaultLOBEmailConfig(lob, escalationType);
    }
  }

  processLOBEmailConfig(configItems, lob, escalationType) {
    const config = {
      lob: lob,
      escalationType: escalationType,
      recipients: {
        globalCC: [],
        admins: [],
        procedureOwners: [],
        lobHeads: [],
        customGroups: []
      },
      settings: {
        sendToOwners: true,
        sendToSecondaryOwners: true,
        ccAdmins: true,
        ccGlobalList: true
      }
    };

    configItems.forEach(item => {
      const recipientData = {
        id: item.Id,
        email: item.EmailAddress,
        name: item.DisplayName || item.EmailAddress,
        active: item.IsActive !== false,
        role: item.RecipientRole || 'General',
        lob: item.LOB,
        escalationType: item.EscalationType
      };

      switch (item.ConfigType) {
        case 'GlobalCC':
          config.recipients.globalCC.push(recipientData);
          break;
        case 'Admin':
          config.recipients.admins.push(recipientData);
          break;
        case 'LOBHead':
          config.recipients.lobHeads.push(recipientData);
          break;
        case 'CustomGroup':
          config.recipients.customGroups.push(recipientData);
          break;
      }
    });

    return config;
  }

  async saveLOBEmailConfig(lobConfig) {
    try {
      console.log('📧 Saving LOB-specific email configuration...', lobConfig);
      
      const requestDigest = await this.getFreshRequestDigest();
      
      // Clear existing config for this LOB + escalation type
      await this.clearLOBConfig(lobConfig.lob, lobConfig.escalationType, requestDigest);

      let savedCount = 0;

      // Save all recipient types
      const recipientTypes = ['globalCC', 'admins', 'lobHeads', 'customGroups'];
      
      for (const type of recipientTypes) {
        const configType = type === 'globalCC' ? 'GlobalCC' : 
                          type === 'admins' ? 'Admin' : 
                          type === 'lobHeads' ? 'LOBHead' : 'CustomGroup';
        
        for (const recipient of lobConfig.recipients[type]) {
          if (recipient.email && recipient.email.trim()) {
            await this.saveLOBConfigItem({
              ConfigType: configType,
              EmailAddress: recipient.email.trim(),
              DisplayName: recipient.name || recipient.email.trim(),
              IsActive: recipient.active !== false,
              LOB: lobConfig.lob,
              EscalationType: lobConfig.escalationType,
              RecipientRole: recipient.role || 'General'
            }, requestDigest);
            savedCount++;
          }
        }
      }

      console.log(`✅ LOB email configuration saved: ${savedCount} items for ${lobConfig.lob} - ${lobConfig.escalationType}`);
      return { success: true, message: `Saved ${savedCount} recipients for ${lobConfig.lob} - ${lobConfig.escalationType}` };
      
    } catch (error) {
      console.error('❌ Error saving LOB email config:', error);
      return { success: false, message: error.message };
    }
  }

  async clearLOBConfig(lob, escalationType, requestDigest) {
    try {
      const response = await fetch(
        `${this.baseUrl}/_api/web/lists/getbytitle('EmailConfiguration')/items?$filter=LOB eq '${lob}' and EscalationType eq '${escalationType}'&$select=Id`,
        {
          headers: { 'Accept': 'application/json; odata=verbose' },
          credentials: 'include'
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        for (const item of data.d.results) {
          await fetch(
            `${this.baseUrl}/_api/web/lists/getbytitle('EmailConfiguration')/items(${item.Id})`,
            {
              method: 'POST',
              headers: {
                'Accept': 'application/json; odata=verbose',
                'X-RequestDigest': requestDigest,
                'IF-MATCH': '*',
                'X-HTTP-Method': 'DELETE'
              },
              credentials: 'include'
            }
          );
        }
        console.log(`🗑️ Cleared ${data.d.results.length} existing config items for ${lob} - ${escalationType}`);
      }
    } catch (error) {
      console.warn('⚠️ Error clearing existing LOB config:', error);
    }
  }

  async saveLOBConfigItem(itemData, requestDigest) {
    const listItemData = {
      __metadata: { type: 'SP.Data.EmailConfigurationListItem' },
      Title: `${itemData.LOB}_${itemData.EscalationType}_${itemData.ConfigType}_${itemData.EmailAddress}`,
      ConfigType: itemData.ConfigType,
      EmailAddress: itemData.EmailAddress,
      DisplayName: itemData.DisplayName,
      IsActive: itemData.IsActive,
      LOB: itemData.LOB,
      EscalationType: itemData.EscalationType,
      RecipientRole: itemData.RecipientRole
    };

    const response = await fetch(
      `${this.baseUrl}/_api/web/lists/getbytitle('EmailConfiguration')/items`,
      {
        method: 'POST',
        headers: {
          'Accept': 'application/json; odata=verbose',
          'Content-Type': 'application/json; odata=verbose',
          'X-RequestDigest': requestDigest
        },
        credentials: 'include',
        body: JSON.stringify(listItemData)
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to save LOB config item: ${response.status} - ${errorText}`);
    }

    return await response.json();
  }

  // ===================================================================
  // ENHANCED: BROADCAST EMAIL FUNCTIONALITY
  // ===================================================================

  async sendBroadcastEmail(broadcastConfig) {
    try {
      console.log('📢 Sending broadcast email...', broadcastConfig);
      
      // Get all recipients based on target groups
      const recipients = await this.getBroadcastRecipients(broadcastConfig.targetGroups);
      
      if (recipients.length === 0) {
        throw new Error('No recipients found for the selected target groups');
      }

      // Send email to all recipients
      const emailData = {
        to: recipients,
        subject: broadcastConfig.subject,
        body: broadcastConfig.body,
        cc: broadcastConfig.ccAdmins ? await this.getAdminEmails() : []
      };

      const result = await this.sendEmailViaSharePoint(emailData);
      
      if (result.success) {
        // Log broadcast activity
        await this.logBroadcastActivity({
          subject: broadcastConfig.subject,
          targetGroups: broadcastConfig.targetGroups,
          recipientCount: recipients.length,
          sentBy: broadcastConfig.sentBy
        });
        
        return { 
          success: true, 
          message: `Broadcast email sent successfully to ${recipients.length} recipients`,
          recipientCount: recipients.length 
        };
      } else {
        throw new Error(result.message);
      }
      
    } catch (error) {
      console.error('❌ Error sending broadcast email:', error);
      return { success: false, message: error.message };
    }
  }

  async getBroadcastRecipients(targetGroups) {
    const recipients = [];
    
    try {
      for (const group of targetGroups) {
        switch (group) {
          case 'all-primary-owners':
            const primaryOwners = await this.getProcedureOwners();
            recipients.push(...primaryOwners.filter(o => o.type === 'Primary Owner').map(o => o.email));
            break;
            
          case 'all-secondary-owners':
            const secondaryOwners = await this.getProcedureOwners();
            recipients.push(...secondaryOwners.filter(o => o.type === 'Secondary Owner').map(o => o.email));
            break;
            
          case 'all-admins':
            const adminEmails = await this.getAdminEmails();
            recipients.push(...adminEmails);
            break;
            
          case 'lob-iwpb':
            const iwpbConfig = await this.getEmailConfigByLOB('IWPB');
            recipients.push(...this.extractEmailsFromConfig(iwpbConfig));
            break;
            
          case 'lob-cib':
            const cibConfig = await this.getEmailConfigByLOB('CIB');
            recipients.push(...this.extractEmailsFromConfig(cibConfig));
            break;
            
          case 'lob-gcoo':
            const gcooConfig = await this.getEmailConfigByLOB('GCOO');
            recipients.push(...this.extractEmailsFromConfig(gcooConfig));
            break;
            
          case 'global-cc-list':
            const globalConfig = await this.getEmailConfigByLOB();
            recipients.push(...globalConfig.recipients.globalCC.filter(r => r.active).map(r => r.email));
            break;
        }
      }
      
      // Remove duplicates
      return [...new Set(recipients.filter(email => email && email.includes('@')))];
      
    } catch (error) {
      console.error('❌ Error getting broadcast recipients:', error);
      return [];
    }
  }

  extractEmailsFromConfig(config) {
    const emails = [];
    
    Object.values(config.recipients).forEach(recipientGroup => {
      if (Array.isArray(recipientGroup)) {
        emails.push(...recipientGroup.filter(r => r.active).map(r => r.email));
      }
    });
    
    return emails;
  }

  async getAdminEmails() {
    try {
      const response = await fetch(
        `${this.baseUrl}/_api/web/lists/getbytitle('UserRoles')/items?$filter=UserRole eq 'admin' and Status eq 'active'&$select=DisplayName`,
        {
          headers: { 'Accept': 'application/json; odata=verbose' },
          credentials: 'include'
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data.d.results.map(user => `${user.Title}@hsbc.com`);
      }
      
      return ['minaantoun@hsbc.com']; // Fallback
    } catch (error) {
      console.error('❌ Error getting admin emails:', error);
      return ['minaantoun@hsbc.com'];
    }
  }

  async logBroadcastActivity(broadcastData) {
    try {
      const requestDigest = await this.getFreshRequestDigest();
      
      const auditData = {
        __metadata: { type: 'SP.Data.AuditLogListItem' },
        Title: 'BROADCAST_EMAIL_SENT',
        ActionType: 'BROADCAST_EMAIL_SENT',
        UserId: broadcastData.sentBy || 'System',
        UserDisplayName: 'Admin User',
        LogTimestamp: new Date().toISOString(),
        Details: JSON.stringify({
          subject: broadcastData.subject,
          targetGroups: broadcastData.targetGroups,
          recipientCount: broadcastData.recipientCount,
          timestamp: new Date().toISOString()
        }),
        Status: 'SUCCESS'
      };

      const response = await fetch(
        `${this.baseUrl}/_api/web/lists/getbytitle('AuditLog')/items`,
        {
          method: 'POST',
          headers: {
            'Accept': 'application/json; odata=verbose',
            'Content-Type': 'application/json; odata=verbose',
            'X-RequestDigest': requestDigest
          },
          credentials: 'include',
          body: JSON.stringify(auditData)
        }
      );
      
      if (response.ok) {
        console.log('✅ Broadcast activity logged successfully');
      }
    } catch (error) {
      console.warn('⚠️ Could not log broadcast activity:', error);
    }
  }

  // ===================================================================
  // ENHANCED: TEST EMAIL (USER-SPECIFIED ADDRESS)
  // ===================================================================

  async sendTestEmail(testEmailAddress) {
    try {
      console.log('📧 Sending test email to user-specified address:', testEmailAddress);
      
      // Validate email address
      if (!testEmailAddress || !testEmailAddress.includes('@')) {
        throw new Error('Please provide a valid email address');
      }
      
      const emailData = {
        to: [testEmailAddress],
        subject: 'HSBC Procedures Hub - Email Test (SharePoint API)',
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #d40000, #b30000); padding: 20px; color: white;">
              <h1 style="margin: 0; font-size: 24px;">HSBC Procedures Hub</h1>
              <p style="margin: 5px 0 0 0; opacity: 0.9;">Email System Test - SharePoint API</p>
            </div>
            <div style="padding: 30px; background: #f9f9f9;">
              <h2 style="color: #333; margin-top: 0;">✅ SharePoint Email Test Successful!</h2>
              <p style="color: #666; line-height: 1.6;">
                This test email was sent using SharePoint's email API. If you received this email, 
                the SharePoint email integration is working correctly.
              </p>
              <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #d40000; margin: 20px 0;">
                <h3 style="margin: 0 0 10px 0; color: #d40000;">Test Details:</h3>
                <p style="margin: 5px 0; color: #666;"><strong>Sent to:</strong> ${testEmailAddress}</p>
                <p style="margin: 5px 0; color: #666;"><strong>Test time:</strong> ${new Date().toLocaleString()}</p>
                <p style="margin: 5px 0; color: #666;"><strong>System:</strong> SharePoint Email API</p>
                <p style="margin: 5px 0; color: #666;"><strong>Site:</strong> ${this.baseUrl}</p>
              </div>
              <p style="color: #666; font-size: 14px; margin-top: 30px;">
                This email was sent automatically by the HSBC Procedures Hub via SharePoint's email service.
              </p>
            </div>
          </div>
        `
      };

      const result = await this.sendEmailViaSharePoint(emailData);
      
      if (result.success) {
        console.log('✅ Test email sent successfully to user-specified address');
        return { 
          success: true, 
          message: `Test email sent successfully to ${testEmailAddress}` 
        };
      } else {
        throw new Error(result.message);
      }
      
    } catch (error) {
      console.error('❌ Error sending test email:', error);
      return { 
        success: false, 
        message: `Failed to send test email: ${error.message}` 
      };
    }
  }

  // ===================================================================
  // ENHANCED: SYSTEM MAINTENANCE TEMPLATES
  // ===================================================================

  getSystemMaintenanceTemplates() {
    return [
      {
        id: 'maintenance-scheduled',
        type: 'system-maintenance',
        name: 'Scheduled Maintenance',
        subject: 'HSBC Procedures Hub - Scheduled Maintenance: {{maintenanceDate}}',
        htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #ff9800, #f57c00); padding: 20px; color: white;">
            <h1 style="margin: 0; font-size: 24px;">HSBC Procedures Hub</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">System Maintenance Notice</p>
          </div>
          <div style="padding: 30px; background: #fff3e0;">
            <h2 style="color: #e65100; margin-top: 0;">🔧 Scheduled System Maintenance</h2>
            <p style="color: #666; line-height: 1.6;">
              The HSBC Procedures Hub will undergo scheduled maintenance during the following time:
            </p>
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #ff9800; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #e65100;">Maintenance Details</h3>
              <p style="margin: 5px 0; color: #666;"><strong>Date:</strong> {{maintenanceDate}}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Start Time:</strong> {{startTime}}</p>
              <p style="margin: 5px 0; color: #666;"><strong>End Time:</strong> {{endTime}}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Duration:</strong> {{duration}}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Impact:</strong> {{impact}}</p>
            </div>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              We apologize for any inconvenience. The system will be back online after the maintenance window.
            </p>
          </div>
        </div>
        `,
        textContent: 'HSBC Procedures Hub maintenance scheduled for {{maintenanceDate}} from {{startTime}} to {{endTime}}. {{impact}}',
        isActive: true
      },
      {
        id: 'maintenance-emergency',
        type: 'system-maintenance',
        name: 'Emergency Maintenance',
        subject: 'URGENT: HSBC Procedures Hub - Emergency Maintenance',
        htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #f44336, #d32f2f); padding: 20px; color: white;">
            <h1 style="margin: 0; font-size: 24px;">HSBC Procedures Hub</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">🚨 Emergency Maintenance</p>
          </div>
          <div style="padding: 30px; background: #ffebee;">
            <h2 style="color: #c62828; margin-top: 0;">🚨 Emergency System Maintenance</h2>
            <p style="color: #666; line-height: 1.6;">
              Due to {{emergencyReason}}, we need to perform emergency maintenance on the HSBC Procedures Hub.
            </p>
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #f44336; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #c62828;">Emergency Maintenance</h3>
              <p style="margin: 5px 0; color: #666;"><strong>Start Time:</strong> {{startTime}}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Expected Duration:</strong> {{expectedDuration}}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Reason:</strong> {{emergencyReason}}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Impact:</strong> System will be unavailable</p>
            </div>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              We will notify you once the system is back online. Thank you for your patience.
            </p>
          </div>
        </div>
        `,
        textContent: 'URGENT: Emergency maintenance on HSBC Procedures Hub due to {{emergencyReason}}. Expected duration: {{expectedDuration}}',
        isActive: true
      }
    ];
  }

  // ===================================================================
  // KEEP EXISTING METHODS WITH ENHANCEMENTS
  // ===================================================================

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
        console.error('❌ Failed to get request digest:', digestResponse.status);
        
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

  async sendEmailViaSharePoint(emailData) {
    try {
      console.log('📧 Sending email via SharePoint API...');
      console.log('📤 Email data:', {
        to: emailData.to,
        subject: emailData.subject,
        bodyLength: emailData.body?.length || 0
      });
      
      const requestDigest = await this.getFreshRequestDigest();

      const emailPayload = {
        properties: {
          __metadata: { type: 'SP.Utilities.EmailProperties' },
          To: {
            results: Array.isArray(emailData.to) ? emailData.to : [emailData.to]
          },
          Subject: emailData.subject,
          Body: emailData.body || emailData.htmlBody
        }
      };

      if (emailData.cc && emailData.cc.length > 0) {
        emailPayload.properties.CC = {
          results: Array.isArray(emailData.cc) ? emailData.cc : [emailData.cc]
        };
      }

      console.log('📤 Sending email payload:', emailPayload);

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

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ SharePoint email API response:', response.status, errorText);
        throw new Error(`SharePoint email API failed: ${response.status} - ${errorText}`);
      }

      console.log('✅ Email sent successfully via SharePoint API');
      return { success: true, message: 'Email sent via SharePoint API' };
      
    } catch (error) {
      console.error('❌ SharePoint email API error:', error);
      return { success: false, message: error.message };
    }
  }

  // Keep all existing methods for backward compatibility...
  async getEmailConfig() {
    return await this.getEmailConfigByLOB();
  }

  async getProcedureOwners() {
    try {
      console.log('📧 Getting procedure owners...');
      
      const response = await fetch(
        `${this.baseUrl}/_api/web/lists/getbytitle('Procedures')/items?$select=Id,Title,PrimaryOwner,PrimaryOwnerEmail,SecondaryOwner,SecondaryOwnerEmail&$top=5000`,
        {
          headers: { 'Accept': 'application/json; odata=verbose' },
          credentials: 'include'
        }
      );

      if (!response.ok) {
        console.warn(`⚠️ Procedures list not accessible (${response.status}), returning empty owners list`);
        return [];
      }

      const data = await response.json();
      console.log('✅ Procedures data loaded:', data.d.results.length);
      
      const ownersMap = new Map();
      
      data.d.results.forEach(proc => {
        if (proc.PrimaryOwner && proc.PrimaryOwnerEmail) {
          const key = proc.PrimaryOwnerEmail.toLowerCase();
          if (!ownersMap.has(key)) {
            ownersMap.set(key, {
              id: `primary_${proc.Id}`,
              name: proc.PrimaryOwner,
              email: proc.PrimaryOwnerEmail,
              type: 'Primary Owner',
              procedures: []
            });
          }
          ownersMap.get(key).procedures.push(proc.Title);
        }
        
        if (proc.SecondaryOwner && proc.SecondaryOwnerEmail) {
          const key = proc.SecondaryOwnerEmail.toLowerCase();
          if (!ownersMap.has(key)) {
            ownersMap.set(key, {
              id: `secondary_${proc.Id}`,
              name: proc.SecondaryOwner,
              email: proc.SecondaryOwnerEmail,
              type: 'Secondary Owner',
              procedures: []
            });
          }
          ownersMap.get(key).procedures.push(proc.Title);
        }
      });

      const owners = Array.from(ownersMap.values());
      console.log('✅ Procedure owners extracted:', owners.length);
      
      return owners;
      
    } catch (error) {
      console.error('❌ Error getting procedure owners:', error);
      return [];
    }
  }

  getDefaultLOBEmailConfig(lob, escalationType) {
    return {
      lob: lob || 'All',
      escalationType: escalationType || 'All',
      recipients: {
        globalCC: [],
        admins: [],
        procedureOwners: [],
        lobHeads: [],
        customGroups: []
      },
      settings: {
        sendToOwners: true,
        sendToSecondaryOwners: true,
        ccAdmins: true,
        ccGlobalList: true
      }
    };
  }
}

export default EmailService;
