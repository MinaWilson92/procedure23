// services/EmailService.js - Complete Fixed Version for Your SharePoint Lists
import SharePointService from './SharePointService';

class EmailService {
  constructor() {
    this.spService = new SharePointService();
    this.baseUrl = 'https://teams.global.hsbc/sites/EmployeeEng';
    
    console.log('📧 EmailService initialized with your SharePoint structure');
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

  // Get correct SharePoint entity type name
  async getListEntityTypeName(listName) {
    try {
      const response = await fetch(
        `${this.baseUrl}/_api/web/lists/getbytitle('${listName}')?$select=ListItemEntityTypeFullName`,
        {
          headers: { 'Accept': 'application/json; odata=verbose' },
          credentials: 'include'
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        return data.d.ListItemEntityTypeFullName;
      }
    } catch (error) {
      console.warn('Could not get entity type for:', listName);
    }
    
    // Fallback to generic naming convention
    return `SP.Data.${listName.replace(/[^a-zA-Z0-9]/g, '')}ListItem`;
  }

  // ===================================================================
  // EMAIL CONFIGURATION MANAGEMENT (Your EmailConfiguration List)
  // ===================================================================

  async getEmailConfig() {
    try {
      console.log('📧 Getting email configuration from EmailConfiguration list...');
      
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
      console.log('✅ Email config loaded from SharePoint:', data.d.results.length, 'items');
      
      const config = {
        globalCCList: [],
        adminList: [],
        lobHeadsList: [],
        customGroupsList: [],
        testEmail: 'minaantoun@hsbc.com',
        smtpSettings: {
          server: 'SharePoint Email API',
          port: 'N/A',
          useAuth: true
        }
      };

      // Process your EmailConfiguration list structure
      data.d.results.forEach(item => {
        const configItem = {
          id: item.Id,
          email: item.EmailAddress,
          name: item.DisplayName || item.EmailAddress,
          active: item.IsActive !== false,
          lob: item.LOB || 'All',
          escalationType: item.EscalationType,
          recipientRole: item.RecipientRole || 'General'
        };

        switch (item.ConfigType) {
          case 'GlobalCC':
            config.globalCCList.push(configItem);
            break;
          case 'Admin':
            config.adminList.push(configItem);
            break;
          case 'LOBHead':
            config.lobHeadsList.push(configItem);
            break;
          case 'CustomGroup':
            config.customGroupsList.push(configItem);
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
      lobHeadsList: [],
      customGroupsList: [],
      testEmail: 'minaantoun@hsbc.com',
      smtpSettings: {
        server: 'SharePoint Email API',
        port: 'N/A',
        useAuth: true
      }
    };
  }

// services/EmailService.js - Add this missing section in saveEmailConfig method

async saveEmailConfig(config) {
  try {
    console.log('📧 Saving email configuration to SharePoint:', config);
    
    const requestDigest = await this.getFreshRequestDigest();
    const entityType = await this.getListEntityTypeName('EmailConfiguration');
    
    console.log('✅ Got entity type:', entityType);

    await this.clearExistingConfig(requestDigest);

    let savedCount = 0;

    // Save Global CC List
    for (const cc of config.globalCCList || []) {
      if (cc.email && cc.email.trim()) {
        await this.saveConfigItem({
          ConfigType: 'GlobalCC',
          EmailAddress: cc.email.trim(),
          DisplayName: cc.name || cc.email.trim(),
          IsActive: cc.active !== false,
          LOB: cc.lob || 'All',
          EscalationType: cc.escalationType || 'new-procedure-uploaded',
          RecipientRole: cc.recipientRole || 'General'
        }, requestDigest, entityType);
        savedCount++;
      }
    }

    // Save Admin List
    for (const admin of config.adminList || []) {
      if (admin.email && admin.email.trim()) {
        await this.saveConfigItem({
          ConfigType: 'Admin',
          EmailAddress: admin.email.trim(),
          DisplayName: admin.name || admin.email.trim(),
          IsActive: admin.active !== false,
          LOB: admin.lob || 'All',
          EscalationType: admin.escalationType || 'new-procedure-uploaded',
          RecipientRole: admin.recipientRole || 'Manager'
        }, requestDigest, entityType);
        savedCount++;
      }
    }

    // Save LOB Heads List
    for (const lobHead of config.lobHeadsList || []) {
      if (lobHead.email && lobHead.email.trim()) {
        await this.saveConfigItem({
          ConfigType: 'LOBHead',
          EmailAddress: lobHead.email.trim(),
          DisplayName: lobHead.name || lobHead.email.trim(),
          IsActive: lobHead.active !== false,
          LOB: lobHead.lob || 'All',
          EscalationType: lobHead.escalationType || 'new-procedure-uploaded',
          RecipientRole: lobHead.recipientRole || 'Head'
        }, requestDigest, entityType);
        savedCount++;
      }
    }

    // ✅ ADD THIS MISSING SECTION: Save Custom Groups List (Access Management Recipients)
    for (const customGroup of config.customGroupsList || []) {
      if (customGroup.email && customGroup.email.trim()) {
        console.log('💾 Saving custom group recipient:', customGroup);
        await this.saveConfigItem({
          ConfigType: 'CustomGroup',
          EmailAddress: customGroup.email.trim(),
          DisplayName: customGroup.name || customGroup.email.trim(),
          IsActive: customGroup.active !== false,
          LOB: customGroup.lob || 'All',
          EscalationType: customGroup.escalationType || 'user-access-granted',
          RecipientRole: customGroup.recipientRole || 'Custom'
        }, requestDigest, entityType);
        savedCount++;
        console.log('✅ Custom group recipient saved successfully');
      }
    }

    // Save Test Email
    if (config.testEmail && config.testEmail.trim()) {
      await this.saveConfigItem({
        ConfigType: 'TestEmail',
        EmailAddress: config.testEmail.trim(),
        DisplayName: 'Test Email Address',
        IsActive: true,
        LOB: 'All',
        EscalationType: 'system-maintenance',
        RecipientRole: 'General'
      }, requestDigest, entityType);
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

  async saveConfigItem(itemData, requestDigest, entityType) {
    const listItemData = {
      __metadata: { type: entityType },
      Title: `${itemData.ConfigType}_${itemData.EmailAddress}`,
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
      throw new Error(`Failed to save config item: ${response.status} - ${errorText}`);
    }

    return await response.json();
  }

  // ===================================================================
  // EMAIL TEMPLATES MANAGEMENT (Your EmailTemplates List)
  // ===================================================================

  async getEmailTemplates() {
    try {
      console.log('📧 Getting email templates from EmailTemplates list...');
      
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
        lastModified: item.Modified
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
          isActive: item.IsActive !== false
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
      console.log('📧 Saving email template to SharePoint:', template.type);
      
      const requestDigest = await this.getFreshRequestDigest();
      const entityType = await this.getListEntityTypeName('EmailTemplates');

      const listItemData = {
        __metadata: { type: entityType },
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

      console.log('✅ Email template saved successfully to SharePoint');
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

      console.log('✅ Email template deleted successfully from SharePoint');
      return { success: true, message: 'Template deleted successfully from SharePoint' };
      
    } catch (error) {
      console.error('❌ Error deleting email template:', error);
      return { success: false, message: error.message };
    }
  }

  // ===================================================================
  // PROCEDURE OWNERS MANAGEMENT (From Your Procedures List)
  // ===================================================================

  async getProcedureOwners() {
    try {
      console.log('📧 Getting procedure owners from Procedures list...');
      
      const response = await fetch(
        `${this.baseUrl}/_api/web/lists/getbytitle('Procedures')/items?$select=Id,Title,PrimaryOwner,PrimaryOwnerEmail,SecondaryOwner,SecondaryOwnerEmail,LOB&$top=5000`,
        {
          headers: { 
            'Accept': 'application/json; odata=verbose' 
          },
          credentials: 'include'
        }
      );

      if (!response.ok) {
        console.warn(`⚠️ Procedures list not accessible (${response.status}), returning empty owners list`);
        return [];
      }

      const data = await response.json();
      console.log('✅ Procedures data loaded for owners:', data.d.results.length);
      
      const ownersMap = new Map();
      
      data.d.results.forEach(proc => {
        // Primary owners
        if (proc.PrimaryOwner && proc.PrimaryOwnerEmail) {
          const key = proc.PrimaryOwnerEmail.toLowerCase();
          if (!ownersMap.has(key)) {
            ownersMap.set(key, {
              id: `primary_${proc.Id}`,
              name: proc.PrimaryOwner,
              email: proc.PrimaryOwnerEmail,
              type: 'Primary Owner',
              lob: proc.LOB || 'Unknown',
              procedures: []
            });
          }
          ownersMap.get(key).procedures.push(proc.Title);
        }
        
        // Secondary owners
        if (proc.SecondaryOwner && proc.SecondaryOwnerEmail) {
          const key = proc.SecondaryOwnerEmail.toLowerCase();
          if (!ownersMap.has(key)) {
            ownersMap.set(key, {
              id: `secondary_${proc.Id}`,
              name: proc.SecondaryOwner,
              email: proc.SecondaryOwnerEmail,
              type: 'Secondary Owner',
              lob: proc.LOB || 'Unknown',
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

  async sendTestEmail(config) {
    try {
      console.log('📧 Sending test email via SharePoint API to:', config.testEmail || 'minaantoun@hsbc.com');
      
      const emailData = {
        to: config.testEmail || 'minaantoun@hsbc.com',
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
async checkAvailableTemplates() {
  try {
    console.log('🔍 Checking available email templates...');
    
    const response = await fetch(
      `${this.baseUrl}/_api/web/lists/getbytitle('EmailTemplates')/items?$select=TemplateType,Title,IsActive`,
      {
        headers: { 'Accept': 'application/json; odata=verbose' },
        credentials: 'same-origin'
      }
    );

    if (response.ok) {
      const data = await response.json();
      const templates = data.d.results;
      console.log('📧 Available email templates:', templates);
      
      const templateTypes = templates.map(t => t.TemplateType).filter(Boolean);
      console.log('📧 Available template types:', templateTypes);
      
      return templateTypes;
    } else {
      console.log('⚠️ Could not load email templates');
      return [];
    }
  } catch (error) {
    console.error('❌ Error checking templates:', error);
    return [];
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

      console.log('📤 Sending email payload to SharePoint...');

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
    console.log('📧 Recipients:', recipients);
    console.log('📧 Variables received:', variables);
    
    const template = await this.getEmailTemplate(templateType);
    
    if (!template || !template.isActive) {
      throw new Error(`Template ${templateType} not found or inactive`);
    }

    console.log('📧 Template loaded:', template.name);
    console.log('📧 Original subject BEFORE replacement:', template.subject);
    console.log('📧 Original HTML content BEFORE replacement (first 200 chars):', template.htmlContent?.substring(0, 200));

    // ✅ CRITICAL FIX: Proper variable replacement
    let subject = template.subject || '';
    let htmlContent = template.htmlContent || '';

    // Debug: Show what we're starting with
    console.log('📧 Starting replacement process...');
    console.log('📧 Variables to replace:', Object.keys(variables));

    // Replace each variable one by one
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      const replaceValue = String(value || 'N/A'); // Ensure it's a string
      
      console.log(`🔄 REPLACING: "${placeholder}" WITH: "${replaceValue}"`);
      
      // Count occurrences before replacement
      const subjectBefore = (subject.match(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g')) || []).length;
      const htmlBefore = (htmlContent.match(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g')) || []).length;
      
      console.log(`📊 Found ${subjectBefore} occurrences in subject, ${htmlBefore} in HTML`);
      
      // Perform replacement
      subject = subject.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), replaceValue);
      htmlContent = htmlContent.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), replaceValue);
      
      // Count occurrences after replacement
      const subjectAfter = (subject.match(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g')) || []).length;
      const htmlAfter = (htmlContent.match(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g')) || []).length;
      
      console.log(`✅ After replacement: ${subjectAfter} remaining in subject, ${htmlAfter} in HTML`);
    }

    console.log('📧 Final subject AFTER replacement:', subject);
    console.log('📧 Final HTML content AFTER replacement (first 200 chars):', htmlContent?.substring(0, 200));

    // ✅ VERIFICATION: Check for any remaining unreplaced variables
    const remainingInSubject = subject.match(/\{\{[^}]+\}\}/g);
    const remainingInHtml = htmlContent.match(/\{\{[^}]+\}\}/g);
    
    if (remainingInSubject || remainingInHtml) {
      console.error('❌ UNREPLACED VARIABLES FOUND!');
      console.error('❌ In subject:', remainingInSubject);
      console.error('❌ In HTML:', remainingInHtml);
    } else {
      console.log('✅ ALL VARIABLES SUCCESSFULLY REPLACED!');
    }

    const emailData = {
      to: recipients,
      subject: subject,
      body: htmlContent
    };

    console.log('📧 Final email data being sent:', {
      to: emailData.to,
      subject: emailData.subject,
      bodyPreview: emailData.body?.substring(0, 100) + '...'
    });

    const result = await this.sendEmailViaSharePoint(emailData);
    
    if (result.success) {
      console.log('✅ Notification email sent successfully with replaced variables');
      return { success: true, message: 'Notification sent via SharePoint with variable replacement' };
    } else {
      throw new Error(result.message);
    }
    
  } catch (error) {
    console.error('❌ Error sending notification email:', error);
    return { success: false, message: error.message };
  }
}

  
async debugVariableReplacement(templateType, variables) {
  try {
    console.log('🔍 DEBUG: Variable replacement test');
    
    const template = await this.getEmailTemplate(templateType);
    if (!template) {
      console.error('❌ Template not found:', templateType);
      return;
    }
    
    console.log('🔍 Template content:', template.htmlContent);
    console.log('🔍 Variables provided:', variables);
    
    // Find all variables in template
    const templateVars = template.htmlContent.match(/\{\{[^}]+\}\}/g) || [];
    console.log('🔍 Variables found in template:', templateVars);
    
    // Check which variables we have vs need
    templateVars.forEach(templateVar => {
      const varName = templateVar.replace(/[{}]/g, '');
      if (variables.hasOwnProperty(varName)) {
        console.log(`✅ Variable ${templateVar} will be replaced with: ${variables[varName]}`);
      } else {
        console.error(`❌ Variable ${templateVar} NOT PROVIDED in variables object`);
      }
    });
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}
  // ===================================================================
  // DEFAULT TEMPLATES (For Your SharePoint Structure)
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
       subject: 'URGENT: Procedure Expired - {{procedureName}}',
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
       textContent: 'URGENT: Procedure {{procedureName}} expired on {{expiredDate}} ({{daysOverdue}} days overdue). Owner: {{ownerName}}',
       isActive: true
     },
     {
       id: null,
       type: 'low-quality-score',
       name: 'Low Quality Score Alert',
       subject: 'Quality Alert: {{procedureName}} - Score {{qualityScore}}%',
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
       textContent: 'Quality Alert: Procedure {{procedureName}} has a low quality score of {{qualityScore}}%. Recommendations: {{recommendations}}',
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
