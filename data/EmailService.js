// services/EmailService.js - Complete Enhanced Version with All Missing Methods
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
  // ENHANCED: Better Request Digest Management
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

  // ===================================================================
  // EMAIL TEMPLATES MANAGEMENT - MISSING METHODS ADDED
  // ===================================================================

  async getEmailTemplates() {
    try {
      console.log('📧 Getting all email templates...');
      
      const response = await fetch(
        `${this.baseUrl}/_api/web/lists/getbytitle('EmailTemplates')/items?$select=*&$orderby=TemplateType`,
        {
          headers: { 
            'Accept': 'application/json; odata=verbose' 
          },
          credentials: 'include'
        }
      );

      if (!response.ok) {
        console.warn(`⚠️ EmailTemplates list not accessible (${response.status}), using defaults`);
        return this.getDefaultTemplates();
      }

      const data = await response.json();
      console.log('✅ Email templates loaded from SharePoint:', data.d.results.length);
      
      return data.d.results.map(item => ({
        id: item.Id,
        type: item.TemplateType,
        name: item.Title,
        subject: item.Subject || '',
        htmlContent: item.HTMLContent || '',
        textContent: item.TextContent || '',
        isActive: item.IsActive !== false,
        lastModified: item.Modified,
        category: this.getTemplateCategory(item.TemplateType)
      }));
      
    } catch (error) {
      console.error('❌ Error getting email templates:', error);
      return this.getDefaultTemplates();
    }
  }

  async getEmailTemplate(templateType) {
    try {
      console.log('📧 Getting email template:', templateType);
      
      const response = await fetch(
        `${this.baseUrl}/_api/web/lists/getbytitle('EmailTemplates')/items?$filter=TemplateType eq '${templateType}'&$top=1`,
        {
          headers: { 
            'Accept': 'application/json; odata=verbose' 
          },
          credentials: 'include'
        }
      );

      if (!response.ok) {
        console.warn(`⚠️ Template ${templateType} not found in SharePoint, using default`);
        return this.getDefaultTemplateByType(templateType);
      }

      const data = await response.json();
      
      if (data.d.results.length > 0) {
        const item = data.d.results[0];
        return {
          id: item.Id,
          type: item.TemplateType,
          name: item.Title,
          subject: item.Subject || '',
          htmlContent: item.HTMLContent || '',
          textContent: item.TextContent || '',
          isActive: item.IsActive !== false,
          category: this.getTemplateCategory(item.TemplateType)
        };
      }
      
      return this.getDefaultTemplateByType(templateType);
      
    } catch (error) {
      console.error('❌ Error getting email template:', error);
      return this.getDefaultTemplateByType(templateType);
    }
  }

  async saveEmailTemplate(template) {
    try {
      console.log('📧 Saving email template:', template.type);
      
      const requestDigest = await this.getFreshRequestDigest();

      const listItemData = {
        __metadata: { type: 'SP.Data.EmailTemplatesListItem' },
        Title: template.name,
        TemplateType: template.type,
        Subject: template.subject,
        HTMLContent: template.htmlContent,
        TextContent: template.textContent,
        IsActive: template.isActive !== false
      };

      let response;
      
      if (template.id) {
        // Update existing template
        response = await fetch(
          `${this.baseUrl}/_api/web/lists/getbytitle('EmailTemplates')/items(${template.id})`,
          {
            method: 'POST',
            headers: {
              'Accept': 'application/json; odata=verbose',
              'Content-Type': 'application/json; odata=verbose',
              'X-RequestDigest': requestDigest,
              'IF-MATCH': '*',
              'X-HTTP-Method': 'MERGE'
            },
            credentials: 'include',
            body: JSON.stringify(listItemData)
          }
        );
      } else {
        // Create new template
        response = await fetch(
          `${this.baseUrl}/_api/web/lists/getbytitle('EmailTemplates')/items`,
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
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to save template: ${response.status} - ${errorText}`);
      }

      console.log('✅ Email template saved successfully');
      return { success: true, message: 'Template saved successfully to SharePoint' };
      
    } catch (error) {
      console.error('❌ Error saving email template:', error);
      return { success: false, message: error.message };
    }
  }

  async deleteEmailTemplate(templateId) {
    try {
      console.log('🗑️ Deleting email template:', templateId);
      
      const requestDigest = await this.getFreshRequestDigest();
      
      const response = await fetch(
        `${this.baseUrl}/_api/web/lists/getbytitle('EmailTemplates')/items(${templateId})`,
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

      if (!response.ok && response.status !== 404) {
        const errorText = await response.text();
        throw new Error(`Failed to delete template: ${response.status} - ${errorText}`);
      }

      console.log('✅ Email template deleted successfully');
      return { success: true, message: 'Template deleted successfully from SharePoint' };
      
    } catch (error) {
      console.error('❌ Error deleting email template:', error);
      return { success: false, message: error.message };
    }
  }

  getTemplateCategory(templateType) {
    if (templateType.startsWith('custom-') || templateType.startsWith('broadcast-')) {
      return 'custom';
    }
    if (templateType === 'system-maintenance' || templateType === 'broadcast-announcement') {
      return 'system';
    }
    return 'procedure';
  }

  getDefaultTemplates() {
    return [
      {
        id: null,
        type: 'new-procedure-uploaded',
        name: 'New Procedure Uploaded',
        subject: 'New Procedure Uploaded: {{procedureName}}',
        htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #d40000, #b30000); padding: 20px; color: white;">
            <h1 style="margin: 0; font-size: 24px;">HSBC Procedures Hub</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">New Procedure Notification</p>
          </div>
          <div style="padding: 30px; background: #f9f9f9;">
            <h2 style="color: #333; margin-top: 0;">📤 New Procedure Uploaded</h2>
            <p style="color: #666; line-height: 1.6;">
              A new procedure has been uploaded to the HSBC Procedures Hub:
            </p>
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #d40000; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #d40000;">{{procedureName}}</h3>
              <p style="margin: 5px 0; color: #666;"><strong>Owner:</strong> {{ownerName}}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Upload Date:</strong> {{uploadDate}}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Quality Score:</strong> {{qualityScore}}%</p>
              <p style="margin: 5px 0; color: #666;"><strong>Line of Business:</strong> {{lob}}</p>
            </div>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              This email was sent automatically by the HSBC Procedures Hub system.
            </p>
          </div>
        </div>
        `,
        textContent: 'New procedure uploaded: {{procedureName}} by {{ownerName}} on {{uploadDate}}. Quality Score: {{qualityScore}}%',
        isActive: true,
        category: 'procedure'
      },
      {
        id: null,
        type: 'procedure-expiring',
        name: 'Procedure Expiring Soon',
        subject: 'Procedure Expiring Soon: {{procedureName}}',
        htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #ff9800, #f57c00); padding: 20px; color: white;">
            <h1 style="margin: 0; font-size: 24px;">HSBC Procedures Hub</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Expiry Warning</p>
          </div>
          <div style="padding: 30px; background: #fff3e0;">
            <h2 style="color: #e65100; margin-top: 0;">⏰ Procedure Expiring Soon</h2>
            <p style="color: #666; line-height: 1.6;">
              The following procedure is approaching its expiry date and requires your attention:
            </p>
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #ff9800; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #e65100;">{{procedureName}}</h3>
              <p style="margin: 5px 0; color: #666;"><strong>Owner:</strong> {{ownerName}}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Expiry Date:</strong> {{expiryDate}}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Days Remaining:</strong> {{daysLeft}}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Line of Business:</strong> {{lob}}</p>
            </div>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              Please review and update this procedure before it expires.
            </p>
          </div>
        </div>
        `,
        textContent: 'Procedure {{procedureName}} expires on {{expiryDate}} ({{daysLeft}} days remaining). Owner: {{ownerName}}',
        isActive: true,
        category: 'procedure'
      },
      {
        id: null,
        type: 'procedure-expired',
        name: 'Procedure Expired',
        subject: 'Procedure Expired: {{procedureName}}',
        htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #f44336, #d32f2f); padding: 20px; color: white;">
            <h1 style="margin: 0; font-size: 24px;">HSBC Procedures Hub</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Urgent Action Required</p>
          </div>
          <div style="padding: 30px; background: #ffebee;">
            <h2 style="color: #c62828; margin-top: 0;">🚨 Procedure Expired</h2>
            <p style="color: #666; line-height: 1.6;">
              The following procedure has expired and requires immediate attention:
            </p>
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #f44336; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #c62828;">{{procedureName}}</h3>
              <p style="margin: 5px 0; color: #666;"><strong>Owner:</strong> {{ownerName}}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Expired Date:</strong> {{expiredDate}}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Days Overdue:</strong> {{daysOverdue}}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Line of Business:</strong> {{lob}}</p>
            </div>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              This procedure must be updated immediately to maintain compliance.
            </p>
          </div>
        </div>
        `,
        textContent: 'Procedure {{procedureName}} expired on {{expiredDate}} ({{daysOverdue}} days overdue). Owner: {{ownerName}}',
        isActive: true,
        category: 'procedure'
      },
      {
        id: null,
        type: 'low-quality-score',
        name: 'Low Quality Score Alert',
        subject: 'Low Quality Score Alert: {{procedureName}}',
        htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #2196f3, #1976d2); padding: 20px; color: white;">
            <h1 style="margin: 0; font-size: 24px;">HSBC Procedures Hub</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Quality Alert</p>
          </div>
          <div style="padding: 30px; background: #e3f2fd;">
            <h2 style="color: #1565c0; margin-top: 0;">📊 Low Quality Score Alert</h2>
            <p style="color: #666; line-height: 1.6;">
              The following procedure has received a low quality score and may need improvement:
            </p>
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #2196f3; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #1565c0;">{{procedureName}}</h3>
              <p style="margin: 5px 0; color: #666;"><strong>Owner:</strong> {{ownerName}}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Quality Score:</strong> {{qualityScore}}%</p>
              <p style="margin: 5px 0; color: #666;"><strong>Line of Business:</strong> {{lob}}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Recommendations:</strong> {{recommendations}}</p>
            </div>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              Please review the recommendations and improve the procedure quality.
            </p>
          </div>
        </div>
        `,
        textContent: 'Procedure {{procedureName}} has a low quality score of {{qualityScore}}%. Recommendations: {{recommendations}}',
        isActive: true,
        category: 'procedure'
      },
      {
        id: null,
        type: 'system-maintenance',
        name: 'System Maintenance',
        subject: 'HSBC Procedures Hub - System Maintenance: {{maintenanceDate}}',
        htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #ff9800, #f57c00); padding: 20px; color: white;">
            <h1 style="margin: 0; font-size: 24px;">HSBC Procedures Hub</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">System Maintenance Notice</p>
          </div>
          <div style="padding: 30px; background: #fff3e0;">
            <h2 style="color: #e65100; margin-top: 0;">🔧 System Maintenance</h2>
            <p style="color: #666; line-height: 1.6;">
              The HSBC Procedures Hub will undergo maintenance during the following time:
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
        isActive: true,
        category: 'system'
      },
      {
        id: null,
        type: 'broadcast-announcement',
        name: 'Broadcast Announcement',
        subject: 'HSBC Procedures Hub - {{announcementTitle}}',
        htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #4caf50, #388e3c); padding: 20px; color: white;">
            <h1 style="margin: 0; font-size: 24px;">HSBC Procedures Hub</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Important Announcement</p>
          </div>
          <div style="padding: 30px; background: #f9f9f9;">
            <h2 style="color: #333; margin-top: 0;">📢 {{announcementTitle}}</h2>
            <p style="color: #666; line-height: 1.6;">
              We have an important announcement regarding the HSBC Procedures Hub:
            </p>
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #4caf50; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #388e3c;">Announcement Details</h3>
              <p style="margin: 5px 0; color: #666;"><strong>Date:</strong> {{announcementDate}}</p>
              <p style="margin: 5px 0; color: #666;"><strong>From:</strong> {{senderName}}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Priority:</strong> {{priority}}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Action Required:</strong> {{actionRequired}}</p>
            </div>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              Thank you for your attention to this announcement.
            </p>
          </div>
        </div>
        `,
        textContent: 'HSBC Procedures Hub Announcement: {{announcementTitle}} on {{announcementDate}}. {{actionRequired}}',
        isActive: true,
        category: 'system'
      }
    ];
  }

  getDefaultTemplateByType(templateType) {
    const defaults = this.getDefaultTemplates();
    const found = defaults.find(t => t.type === templateType);
    
    if (found) {
      return found;
    }
    
    // Return a basic template for unknown types
    return {
      id: null,
      type: templateType,
      name: templateType.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      subject: `HSBC Procedures Hub - ${templateType}`,
      htmlContent: '<p>Default template content</p>',
      textContent: 'Default template content',
      isActive: true,
      category: this.getTemplateCategory(templateType)
    };
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

 // ===================================================================
 // EMAIL CONFIGURATION MANAGEMENT (FALLBACK TO OLD SYSTEM)
 // ===================================================================

 async getEmailConfig() {
   try {
     console.log('📧 Getting general email configuration...');
     
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
       console.warn(`⚠️ EmailConfiguration list not accessible (${response.status}), using defaults`);
       return this.getDefaultEmailConfig();
     }

     const data = await response.json();
     console.log('✅ Email config loaded:', data.d.results.length, 'items');
     
     const config = {
       globalCCList: [],
       adminList: [],
       procedureOwnersList: [],
       testEmail: 'minaantoun@hsbc.com',
       smtpSettings: {
         server: 'SharePoint Email API',
         port: 'N/A',
         useAuth: true
       }
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

     console.log('✅ Email config processed:', config);
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
     testEmail: 'minaantoun@hsbc.com',
     smtpSettings: {
       server: 'SharePoint Email API',
       port: 'N/A',
       useAuth: true
     }
   };
 }

 async saveEmailConfig(config) {
   try {
     console.log('📧 Saving email configuration:', config);
     
     const requestDigest = await this.getFreshRequestDigest();
     
     console.log('✅ Got request digest for email config save');

     await this.clearExistingConfig(requestDigest);

     let savedCount = 0;

     for (const cc of config.globalCCList) {
       if (cc.email && cc.email.trim()) {
         await this.saveConfigItem({
           ConfigType: 'GlobalCC',
           EmailAddress: cc.email.trim(),
           DisplayName: cc.name || cc.email.trim(),
           IsActive: cc.active !== false
         }, requestDigest);
         savedCount++;
       }
     }

     for (const admin of config.adminList) {
       if (admin.email && admin.email.trim()) {
         await this.saveConfigItem({
           ConfigType: 'Admin',
           EmailAddress: admin.email.trim(),
           DisplayName: admin.name || admin.email.trim(),
           IsActive: admin.active !== false
         }, requestDigest);
         savedCount++;
       }
     }

     if (config.testEmail && config.testEmail.trim()) {
       await this.saveConfigItem({
         ConfigType: 'TestEmail',
         EmailAddress: config.testEmail.trim(),
         DisplayName: 'Test Email Address',
         IsActive: true
       }, requestDigest);
       savedCount++;
     }

     console.log(`✅ Email configuration saved: ${savedCount} items`);
     return { success: true, message: `Saved ${savedCount} configuration items to SharePoint` };
     
   } catch (error) {
     console.error('❌ Error saving email config:', error);
     return { success: false, message: error.message };
   }
 }

 async clearExistingConfig(requestDigest) {
   try {
     const response = await fetch(
       `${this.baseUrl}/_api/web/lists/getbytitle('EmailConfiguration')/items?$select=Id`,
       {
         headers: { 
           'Accept': 'application/json; odata=verbose' 
         },
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
       console.log(`🗑️ Cleared ${data.d.results.length} existing config items`);
     }
   } catch (error) {
     console.warn('⚠️ Error clearing existing config:', error);
   }
 }

 async saveConfigItem(itemData, requestDigest) {
   const listItemData = {
     __metadata: { type: 'SP.Data.EmailConfigurationListItem' },
     Title: `${itemData.ConfigType}_${itemData.EmailAddress}`,
     ConfigType: itemData.ConfigType,
     EmailAddress: itemData.EmailAddress,
     DisplayName: itemData.DisplayName,
     IsActive: itemData.IsActive
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
     throw new Error(`Failed to save config item: ${response.status} - ${errorText}`);
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
 // PROCEDURE OWNERS MANAGEMENT
 // ===================================================================

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

 // ===================================================================
 // EMAIL SENDING - SHAREPOINT API
 // ===================================================================

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

 // ===================================================================
 // SIMPLE EMAIL METHOD FOR ADMIN DASHBOARD
 // ===================================================================

 async sendSimpleEmail(to, subject, body) {
   try {
     console.log('📧 Sending simple email via SharePoint...');
     
     const emailData = {
       to: Array.isArray(to) ? to : [to],
       subject: subject,
       body: body
     };

     return await this.sendEmailViaSharePoint(emailData);
     
   } catch (error) {
     console.error('❌ Error sending simple email:', error);
     return { success: false, message: error.message };
   }
 }

 async sendNotificationEmail(templateType, recipients, variables) {
   try {
     console.log('📧 Sending notification email:', templateType);
     
     const template = await this.getEmailTemplate(templateType);
     
     if (!template || !template.isActive) {
       throw new Error(`Template ${templateType} not found or inactive`);
     }

     let subject = template.subject;
     let htmlContent = template.htmlContent;
     
     Object.keys(variables).forEach(key => {
       const placeholder = `{{${key}}}`;
       subject = subject.replace(new RegExp(placeholder, 'g'), variables[key]);
       htmlContent = htmlContent.replace(new RegExp(placeholder, 'g'), variables[key]);
     });

     const emailData = {
       to: recipients,
       subject: subject,
       body: htmlContent
     };

     const result = await this.sendEmailViaSharePoint(emailData);
     
     if (result.success) {
       console.log('✅ Notification email sent successfully');
       return { success: true, message: 'Notification sent via SharePoint' };
     } else {
       throw new Error(result.message);
     }
     
   } catch (error) {
     console.error('❌ Error sending notification email:', error);
     return { success: false, message: error.message };
   }
 }
}

export default EmailService;
