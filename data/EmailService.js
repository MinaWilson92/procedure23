// services/EmailService.js - Fixed Email Management Service
import SharePointService from ‘./SharePointService’;

class EmailService {
constructor() {
this.spService = new SharePointService();
this.baseUrl = ‘https://teams.global.hsbc/sites/EmployeeEng’;

```
console.log('📧 EmailService initialized');
```

}

// ===================================================================
// EMAIL CONFIGURATION MANAGEMENT
// ===================================================================

// GET email configuration from SharePoint
async getEmailConfig() {
try {
console.log(‘📧 Getting email configuration…’);

```
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
      server: 'smtp.hsbc.com',
      port: 587,
      useAuth: false
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
      server: 'smtp.hsbc.com',
      port: 587,
      useAuth: false
    }
  };
}
```

}

// SAVE email configuration to SharePoint
async saveEmailConfig(config) {
try {
console.log(‘📧 Saving email configuration:’, config);

```
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
  return { success: true, message: `Saved ${savedCount} configuration items` };
  
} catch (error) {
  console.error('❌ Error saving email config:', error);
  return { success: false, message: error.message };
}
```

}

// Helper method to clear existing configuration
async clearExistingConfig(requestDigest) {
try {
const response = await fetch(
`${this.baseUrl}/_api/web/lists/getbytitle('EmailConfiguration')/items?$select=Id`,
{
headers: { ‘Accept’: ‘application/json; odata=verbose’ }
}
);

```
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
```

}

// Helper method to save a single config item
async saveConfigItem(itemData, requestDigest) {
const listItemData = {
__metadata: { type: ‘SP.Data.EmailConfigurationListItem’ },
Title: `${itemData.ConfigType}_${itemData.EmailAddress}`,
ConfigType: itemData.ConfigType,
EmailAddress: itemData.EmailAddress,
DisplayName: itemData.DisplayName,
IsActive: itemData.IsActive
};

```
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
```

}

// ===================================================================
// EMAIL TEMPLATES MANAGEMENT
// ===================================================================

// GET all email templates
async getEmailTemplates() {
try {
console.log(‘📧 Getting email templates…’);

```
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
```

}

// GET specific email template by type
async getEmailTemplate(templateType) {
try {
console.log(‘📧 Getting email template:’, templateType);

```
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
```

}

// SAVE email template
async saveEmailTemplate(template) {
try {
console.log(‘📧 Saving email template:’, template.type);

```
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
  return { success: true, message: 'Template saved successfully' };
  
} catch (error) {
  console.error('❌ Error saving email template:', error);
  return { success: false, message: error.message };
}
```

}

// ===================================================================
// PROCEDURE OWNERS MANAGEMENT
// ===================================================================

// GET all procedure owners from Procedures list
async getProcedureOwners() {
try {
console.log(‘📧 Getting procedure owners…’);

```
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
```

}

// ===================================================================
// EMAIL SENDING
// ===================================================================

// SEND test email
async sendTestEmail(config) {
try {
console.log(‘📧 Sending test email to:’, config.testEmail || ‘minaantoun@hsbc.com’);

```
  const emailData = {
    to: [config.testEmail || 'minaantoun@hsbc.com'],
    cc: [],
    subject: 'HSBC Procedures Hub - Email Test',
    htmlBody: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #d40000, #b30000); padding: 20px; color: white;">
          <h1 style="margin: 0; font-size: 24px;">HSBC Procedures Hub</h1>
          <p style="margin: 5px 0 0 0; opacity: 0.9;">Email System Test</p>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333; margin-top: 0;">✅ Email Test Successful!</h2>
          <p style="color: #666; line-height: 1.6;">
            This is a test email from the HSBC Procedures Hub email management system.
            If you received this email, the system is working correctly.
          </p>
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #d40000; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #d40000;">Test Details:</h3>
            <p style="margin: 5px 0; color: #666;"><strong>Sent to:</strong> ${config.testEmail || 'minaantoun@hsbc.com'}</p>
            <p style="margin: 5px 0; color: #666;"><strong>Test time:</strong> ${new Date().toLocaleString()}</p>
            <p style="margin: 5px 0; color: #666;"><strong>System:</strong> HSBC Procedures Hub Email Service</p>
          </div>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            This email was sent automatically by the HSBC Procedures Hub system.
          </p>
        </div>
      </div>
    `,
    priority: 'Normal'
  };

  // Use your existing email API endpoint
  const response = await fetch('/ProceduresHubEG6/api/send-email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(emailData)
  });

  if (!response.ok) {
    throw new Error(`Email send failed: ${response.status}`);
  }

  const result = await response.json();
  console.log('✅ Test email sent successfully:', result);
  
  return { 
    success: true, 
    message: `Test email sent successfully to ${config.testEmail || 'minaantoun@hsbc.com'}` 
  };
  
} catch (error) {
  console.error('❌ Error sending test email:', error);
  return { 
    success: false, 
    message: `Failed to send test email: ${error.message}` 
  };
}
```

}

// ===================================================================
// DEFAULT TEMPLATES
// ===================================================================

getDefaultTemplates() {
return [
{
id: null,
type: ‘new-procedure-uploaded’,
name: ‘New Procedure Uploaded’,
subject: ‘New Procedure Uploaded: {{procedureName}}’,
htmlContent: `<h2>New Procedure Uploaded</h2><p>A new procedure has been uploaded: <strong>{{procedureName}}</strong></p>`,
textContent: ‘New procedure uploaded: {{procedureName}}’,
isActive: true
},
{
id: null,
type: ‘procedure-expiring’,
name: ‘Procedure Expiring Soon’,
subject: ‘Procedure Expiring Soon: {{procedureName}}’,
htmlContent: `<h2>Procedure Expiring Soon</h2><p>The procedure <strong>{{procedureName}}</strong> expires on {{expiryDate}}.</p>`,
textContent: ‘Procedure {{procedureName}} expires on {{expiryDate}}’,
isActive: true
},
{
id: null,
type: ‘procedure-expired’,
name: ‘Procedure Expired’,
subject: ‘Procedure Expired: {{procedureName}}’,
htmlContent: `<h2>Procedure Expired</h2><p>The procedure <strong>{{procedureName}}</strong> has expired.</p>`,
textContent: ‘Procedure {{procedureName}} has expired’,
isActive: true
},
{
id: null,
type: ‘low-quality-score’,
name: ‘Low Quality Score Alert’,
subject: ‘Low Quality Score: {{procedureName}}’,
htmlContent: `<h2>Low Quality Score</h2><p>The procedure <strong>{{procedureName}}</strong> has a quality score of {{qualityScore}}%.</p>`,
textContent: ‘Procedure {{procedureName}} has low quality score: {{qualityScore}}%’,
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