// services/EmailService.js - Fixed to use SharePoint Email API
import SharePointService from './SharePointService';

class EmailService {
  constructor() {
    this.spService = new SharePointService();
    this.baseUrl = 'https://teams.global.hsbc/sites/EmployeeEng';
    
    console.log('📧 EmailService initialized with SharePoint API');
  }

  // ===================================================================
  // EMAIL CONFIGURATION MANAGEMENT
  // ===================================================================

  // GET email configuration from SharePoint
  async getEmailConfig() {
    try {
      console.log('📧 Getting email configuration...');
      
      const response = await fetch(
        `${this.baseUrl}/_api/web/lists/getbytitle('EmailConfiguration')/items?$select=*&$top=1000`,
        {
          method: 'GET',
          headers: { 
            'Accept': 'application/json; odata=verbose',
            'Content-Type': 'application/json; odata=verbose'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get email config: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Email config loaded:', data.d.results.length, 'items');
      
      // Transform SharePoint data to app format
      const config = {
        globalCCList: [],
        adminList: [],
        procedureOwnersList: [],
        testEmail: 'minaantoun@hsbc.com', // Always test to your email
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
      // Return default config
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
  }

  // SAVE email configuration to SharePoint
  async saveEmailConfig(config) {
    try {
      console.log('📧 Saving email configuration:', config);
      
      // Get request digest for SharePoint operations
      const digestResponse = await fetch(`${this.baseUrl}/_api/contextinfo`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json; odata=verbose',
          'Content-Type': 'application/json; odata=verbose'
        }
      });
      
      if (!digestResponse.ok) {
        throw new Error('Failed to get request digest');
      }
      
      const digestData = await digestResponse.json();
      const requestDigest = digestData.d.GetContextWebInformation.FormDigestValue;
      
      console.log('✅ Got request digest for email config save');

      // Clear existing configuration first
      await this.clearExistingConfig(requestDigest);

      let savedCount = 0;

      // Save Global CC List
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

      // Save Admin List
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

      // Save Test Email
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

  // Helper method to clear existing configuration
  async clearExistingConfig(requestDigest) {
    try {
      const response = await fetch(
        `${this.baseUrl}/_api/web/lists/getbytitle('EmailConfiguration')/items?$select=Id`,
        {
          headers: { 'Accept': 'application/json; odata=verbose' }
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        // Delete existing items
        for (const item of data.d.results) {
          await fetch(
            `${this.baseUrl}/_api/web/lists/getbytitle('EmailConfiguration')/items(${item.Id})`,
            {
              method: 'DELETE',
              headers: {
                'Accept': 'application/json; odata=verbose',
                'X-RequestDigest': requestDigest,
                'IF-MATCH': '*',
                'X-HTTP-Method': 'DELETE'
              }
            }
          );
        }
        console.log(`🗑️ Cleared ${data.d.results.length} existing config items`);
      }
    } catch (error) {
      console.warn('⚠️ Error clearing existing config:', error);
    }
  }

  // Helper method to save a single config item
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
  // EMAIL TEMPLATES MANAGEMENT
  // ===================================================================

  // GET all email templates
  async getEmailTemplates() {
    try {
      console.log('📧 Getting email templates...');
      
      const response = await fetch(
        `${this.baseUrl}/_api/web/lists/getbytitle('EmailTemplates')/items?$select=*&$orderby=TemplateType`,
        {
          headers: { 'Accept': 'application/json; odata=verbose' }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get templates: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Email templates loaded:', data.d.results.length);
      
      return data.d.results.map(item => ({
        id: item.Id,
        type: item.TemplateType,
        name: item.Title,
        subject: item.Subject || '',
        htmlContent: item.HTMLContent || '',
        textContent: item.TextContent || '',
        isActive: item.IsActive !== false,
        lastModified: item.Modified
      }));
      
    } catch (error) {
      console.error('❌ Error getting email templates:', error);
      return this.getDefaultTemplates();
    }
  }

  // GET specific email template by type
  async getEmailTemplate(templateType) {
    try {
      console.log('📧 Getting email template:', templateType);
      
      const response = await fetch(
        `${this.baseUrl}/_api/web/lists/getbytitle('EmailTemplates')/items?$filter=TemplateType eq '${templateType}'&$top=1`,
        {
          headers: { 'Accept': 'application/json; odata=verbose' }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get template: ${response.status}`);
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
          isActive: item.IsActive !== false
        };
      }
      
      // Return default template if not found
      return this.getDefaultTemplateByType(templateType);
      
    } catch (error) {
      console.error('❌ Error getting email template:', error);
      return this.getDefaultTemplateByType(templateType);
    }
  }

  // SAVE email template
  async saveEmailTemplate(template) {
    try {
      console.log('📧 Saving email template:', template.type);
      
      // Get request digest
      const digestResponse = await fetch(`${this.baseUrl}/_api/contextinfo`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json; odata=verbose',
          'Content-Type': 'application/json; odata=verbose'
        }
      });
      
      const digestData = await digestResponse.json();
      const requestDigest = digestData.d.GetContextWebInformation.FormDigestValue;

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

  // ===================================================================
  // PROCEDURE OWNERS MANAGEMENT
  // ===================================================================

  // GET all procedure owners from Procedures list
  async getProcedureOwners() {
    try {
      console.log('📧 Getting procedure owners...');
      
      const response = await fetch(
        `${this.baseUrl}/_api/web/lists/getbytitle('Procedures')/items?$select=Id,Title,PrimaryOwner,PrimaryOwnerEmail,SecondaryOwner,SecondaryOwnerEmail&$top=5000`,
        {
          headers: { 'Accept': 'application/json; odata=verbose' }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get procedure owners: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Procedures data loaded:', data.d.results.length);
      
      // Extract unique owners with their emails
      const ownersMap = new Map();
      
      data.d.results.forEach(proc => {
        // Add primary owner
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
        
        // Add secondary owner
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

  // SEND test email using SharePoint API
  async sendTestEmail(config) {
    try {
      console.log('📧 Sending test email via SharePoint API to:', config.testEmail || 'minaantoun@hsbc.com');
      
      const emailData = {
        to: config.testEmail || 'minaantoun@hsbc.com',
        subject: 'HSBC Procedures Hub - Email Test (SharePoint)',
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
                <p style="margin: 5px 0; color: #666;"><strong>Sent to:</strong> ${config.testEmail || 'minaantoun@hsbc.com'}</p>
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

      // Use SharePoint Email API
      const result = await this.sendEmailViaSharePoint(emailData);
      
      if (result.success) {
        console.log('✅ Test email sent successfully via SharePoint API');
        return { 
          success: true, 
          message: `Test email sent successfully via SharePoint to ${config.testEmail || 'minaantoun@hsbc.com'}` 
        };
      } else {
        throw new Error(result.message);
      }
      
    } catch (error) {
      console.error('❌ Error sending test email:', error);
      return { 
        success: false, 
        message: `Failed to send test email via SharePoint: ${error.message}` 
      };
    }
  }

  // SEND email using SharePoint API
  async sendEmailViaSharePoint(emailData) {
    try {
      console.log('📧 Sending email via SharePoint API...');
      
      // Get request digest
      const digestResponse = await fetch(`${this.baseUrl}/_api/contextinfo`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json; odata=verbose',
          'Content-Type': 'application/json; odata=verbose'
        }
      });
      
      if (!digestResponse.ok) {
        throw new Error('Failed to get request digest');
      }
      
      const digestData = await digestResponse.json();
      const requestDigest = digestData.d.GetContextWebInformation.FormDigestValue;

      // Prepare email payload for SharePoint
      const emailPayload = {
        properties: {
          __metadata: { type: 'SP.Utilities.EmailProperties' },
          To: {
            results: Array.isArray(emailData.to) ? emailData.to : [emailData.to]
          },
          CC: {
            results: emailData.cc || []
          },
          Subject: emailData.subject,
          Body: emailData.body || emailData.htmlBody
        }
      };

      // Send email using SharePoint Utilities
      const response = await fetch(
        `${this.baseUrl}/_api/SP.Utilities.Utility.SendEmail`,
        {
          method: 'POST',
          headers: {
            'Accept': 'application/json; odata=verbose',
            'Content-Type': 'application/json; odata=verbose',
            'X-RequestDigest': requestDigest
          },
          body: JSON.stringify(emailPayload)
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`SharePoint email API failed: ${response.status} - ${errorText}`);
      }

      console.log('✅ Email sent successfully via SharePoint API');
      return { success: true, message: 'Email sent via SharePoint API' };
      
    } catch (error) {
      console.error('❌ SharePoint email API error:', error);
      return { success: false, message: error.message };
    }
  }

  // SEND notification email
  async sendNotificationEmail(templateType, recipients, variables) {
    try {
      console.log('📧 Sending notification email:', templateType);
      
      // Get template
      const template = await this.getEmailTemplate(templateType);
      
      if (!template || !template.isActive) {
        throw new Error(`Template ${templateType} not found or inactive`);
      }

      // Replace variables in template
      let subject = template.subject;
      let htmlContent = template.htmlContent;
      
      Object.keys(variables).forEach(key => {
        const placeholder = `{{${key}}}`;
        subject = subject.replace(new RegExp(placeholder, 'g'), variables[key]);
        htmlContent = htmlContent.replace(new RegExp(placeholder, 'g'), variables[key]);
      });

      // Send email
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

  // ===================================================================
  // DEFAULT TEMPLATES
  // ===================================================================

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
              This email was sent via SharePoint by the HSBC Procedures Hub system.
            </p>
          </div>
        </div>
        `,
        textContent: 'New procedure uploaded: {{procedureName}} by {{ownerName}} on {{uploadDate}}. Quality Score: {{qualityScore}}%',
        isActive: true
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
              Please review and update this procedure before it expires. Email sent via SharePoint.
            </p>
          </div>
        </div>
        `,
        textContent: 'Procedure {{procedureName}} expires on {{expiryDate}} ({{daysLeft}} days remaining). Owner: {{ownerName}}',
        isActive: true
      },
      {
        id: null,
        type: 'procedure-expired',
        name: 'Procedure Expired',
        subject: 'Procedure Expired: {{procedureName}}',
        htmlContent: `<h2>Procedure Expired</h2><p>The procedure <strong>{{procedureName}}</strong> has expired.</p>`,
        textContent: 'Procedure {{procedureName}} has expired',
        isActive: true
      },
      {
        id: null,
        type: 'low-quality-score',
        name: 'Low Quality Score Alert',
        subject: 'Low Quality Score: {{procedureName}}',
        htmlContent: `<h2>Low Quality Score</h2><p>The procedure <strong>{{procedureName}}</strong> has a quality score of {{qualityScore}}%.</p>`,
        textContent: 'Procedure {{procedureName}} has low quality score: {{qualityScore}}%',
        isActive: true
      }
    ];
  }

  getDefaultTemplateByType(templateType) {
    const defaults = this.getDefaultTemplates();
    return defaults.find(t => t.type === templateType) || defaults[0];
  }
}

export default EmailService;
