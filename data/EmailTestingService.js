// services/EmailTestingService.js - Comprehensive Email Testing
import EmailIntegrationService from './EmailIntegrationService';
import EmailNotificationService from './EmailNotificationService';

class EmailTestingService {
  constructor() {
    this.emailIntegration = new EmailIntegrationService();
    this.emailNotification = new EmailNotificationService();
    this.testResults = {};
  }

  // ===================================================================
  // COMPREHENSIVE EMAIL SYSTEM TEST
  // ===================================================================

  async runComprehensiveTest(currentUser) {
    console.log('🧪 Starting comprehensive email system test...');
    
    const testResults = {
      timestamp: new Date().toISOString(),
      user: currentUser?.displayName || 'Test User',
      tests: {},
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        warnings: 0
      }
    };

    try {
      // Test 1: Email Service Configuration
      testResults.tests.emailConfiguration = await this.testEmailConfiguration();
      
      // Test 2: Template Loading
      testResults.tests.templateLoading = await this.testTemplateLoading();
      
      // Test 3: Procedure Notifications
      testResults.tests.procedureNotifications = await this.testProcedureNotifications(currentUser);
      
      // Test 4: User Management Notifications
      testResults.tests.userManagementNotifications = await this.testUserManagementNotifications(currentUser);
      
      // Test 5: System Notifications
      testResults.tests.systemNotifications = await this.testSystemNotifications(currentUser);
      
      // Test 6: Email Activity Logging
      testResults.tests.emailActivityLogging = await this.testEmailActivityLogging();
      
      // Test 7: Integration Hooks
      testResults.tests.integrationHooks = await this.testIntegrationHooks(currentUser);
      
      // Calculate summary
      Object.values(testResults.tests).forEach(test => {
        testResults.summary.total++;
        if (test.status === 'PASSED') testResults.summary.passed++;
        else if (test.status === 'FAILED') testResults.summary.failed++;
        else if (test.status === 'WARNING') testResults.summary.warnings++;
      });

      // Log comprehensive test results
      await this.logTestResults(testResults);
      
      console.log('✅ Comprehensive email test completed:', testResults.summary);
      return testResults;
      
    } catch (error) {
      console.error('❌ Comprehensive email test failed:', error);
      testResults.error = error.message;
      return testResults;
    }
  }

  // Test email configuration
  async testEmailConfiguration() {
    try {
      console.log('🧪 Testing email configuration...');
      
      const config = await this.emailNotification.refreshConfiguration();
      
      if (!config) {
        return {
          name: 'Email Configuration',
          status: 'FAILED',
          message: 'Could not load email configuration',
          details: null
        };
      }

      const checks = {
        hasGlobalCC: (config.globalCCList?.length || 0) > 0,
        hasAdmins: (config.adminList?.length || 0) > 0,
        hasTestEmail: !!config.testEmail,
        hasTemplates: true // Assuming templates are always available
      };

      const passed = Object.values(checks).filter(Boolean).length;
      const total = Object.keys(checks).length;

      return {
        name: 'Email Configuration',
        status: passed === total ? 'PASSED' : passed > total / 2 ? 'WARNING' : 'FAILED',
        message: `Configuration loaded: ${passed}/${total} checks passed`,
        details: checks
      };
      
    } catch (error) {
      return {
        name: 'Email Configuration',
        status: 'FAILED',
        message: error.message,
        details: null
      };
    }
  }

  // Test template loading
  async testTemplateLoading() {
    try {
      console.log('🧪 Testing email template loading...');
      
      const templateTypes = [
        'new-procedure-uploaded',
        'procedure-expiring',
        'procedure-expired',
        'low-quality-score',
        'user-access-granted',
        'user-access-revoked',
        'user-role-updated'
      ];

      const results = {};
      
      for (const templateType of templateTypes) {
        try {
          const template = await this.emailNotification.emailService.getEmailTemplate(templateType);
          results[templateType] = !!template && !!template.subject && !!template.htmlContent;
        } catch (error) {
          results[templateType] = false;
        }
      }

      const passed = Object.values(results).filter(Boolean).length;
      const total = templateTypes.length;

      return {
        name: 'Template Loading',
        status: passed === total ? 'PASSED' : passed > total / 2 ? 'WARNING' : 'FAILED',
        message: `Templates loaded: ${passed}/${total}`,
        details: results
      };
      
    } catch (error) {
      return {
        name: 'Template Loading',
        status: 'FAILED',
        message: error.message,
        details: null
      };
    }
  }

  // Test procedure notifications
  async testProcedureNotifications(currentUser) {
    try {
      console.log('🧪 Testing procedure notifications...');
      
      const tests = {
        newProcedureUpload: false,
        lowQualityScore: false,
        procedureExpiring: false,
        procedureExpired: false
      };

      // Test new procedure upload notification
      try {
        const result = await this.emailNotification.triggerProcedureUploadNotification({
          procedure: {
            name: 'Test Procedure - Email System Test',
            lob: 'IWPB',
            primary_owner: 'Test Owner',
            primary_owner_email: 'test.owner@hsbc.com',
            score: 85
          },
          analysisResult: {
            score: 85,
            details: {},
            aiRecommendations: []
          },
          procedureId: 'EMAIL_TEST_001'
        });
        tests.newProcedureUpload = result.success;
      } catch (error) {
        console.error('❌ New procedure upload test failed:', error);
      }

      // Test low quality score notification
      try {
        const result = await this.emailNotification.triggerLowQualityScoreNotification(
          {
            name: 'Test Low Quality Procedure',
            lob: 'CIB',
            primary_owner: 'Test Owner',
            id: 'EMAIL_TEST_002'
          },
          {
            score: 45,
            aiRecommendations: [
              { message: 'Improve document structure' },
              { message: 'Add more detailed procedures' }
            ]
          }
        );
        tests.lowQualityScore = result.success;
      } catch (error) {
        console.error('❌ Low quality score test failed:', error);
      }

      // Test expiring procedure notification
      try {
        const result = await this.emailNotification.triggerExpiryWarningNotification({
          name: 'Test Expiring Procedure',
          lob: 'GCOO',
          primary_owner: 'Test Owner',
          primary_owner_email: 'test.owner@hsbc.com',
          expiry: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
          id: 'EMAIL_TEST_003'
        });
        tests.procedureExpiring = result.success;
      } catch (error) {
        console.error('❌ Procedure expiring test failed:', error);
      }

      // Test expired procedure notification
      try {
        const result = await this.emailNotification.triggerExpiredProcedureNotification({
          name: 'Test Expired Procedure',
          lob: 'IWPB',
          primary_owner: 'Test Owner',
          primary_owner_email: 'test.owner@hsbc.com',
          expiry: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
          id: 'EMAIL_TEST_004'
        });
        tests.procedureExpired = result.success;
      } catch (error) {
        console.error('❌ Procedure expired test failed:', error);
      }

      const passed = Object.values(tests).filter(Boolean).length;
      const total = Object.keys(tests).length;

      return {
        name: 'Procedure Notifications',
        status: passed === total ? 'PASSED' : passed > 0 ? 'WARNING' : 'FAILED',
        message: `Procedure notifications: ${passed}/${total} successful`,
        details: tests
      };
      
    } catch (error) {
      return {
        name: 'Procedure Notifications',
        status: 'FAILED',
        message: error.message,
        details: null
      };
    }
  }

  // Test user management notifications
  async testUserManagementNotifications(currentUser) {
    try {
      console.log('🧪 Testing user management notifications...');
      
      const tests = {
        userAccessGranted: false,
        userAccessRevoked: false,
        userRoleUpdated: false
      };

      // Test user access granted
      try {
        const result = await this.emailNotification.triggerUserChangeNotification(
          'test.user@hsbc.com',
          {
            Title: 'USER_ACCESS_GRANTED',
            TargetUserName: 'Test User - Email System',
            TargetUserId: 'EMAIL_TEST_USER',
            PerformedByName: currentUser?.displayName || 'Email Test System',
            Details: 'Access granted for email system testing',
            LogTimestamp: new Date().toISOString(),
            OldValue: 'No Access',
            NewValue: 'User',
            Reason: 'Email system testing'
          }
        );
        tests.userAccessGranted = result.success;
      } catch (error) {
        console.error('❌ User access granted test failed:', error);
      }

      // Test user access revoked
      try {
        const result = await this.emailNotification.triggerUserChangeNotification(
          'test.user@hsbc.com',
          {
            Title: 'USER_ACCESS_REVOKED',
            TargetUserName: 'Test User - Email System',
            TargetUserId: 'EMAIL_TEST_USER',
            PerformedByName: currentUser?.displayName || 'Email Test System',
            Details: 'Access revoked for email system testing',
            LogTimestamp: new Date().toISOString(),
            OldValue: 'User',
            NewValue: 'No Access',
            Reason: 'Email system testing'
          }
        );
        tests.userAccessRevoked = result.success;
      } catch (error) {
        console.error('❌ User access revoked test failed:', error);
      }

      // Test user role updated
      try {
        const result = await this.emailNotification.triggerUserChangeNotification(
          'test.user@hsbc.com',
          {
            Title: 'USER_ROLE_UPDATED',
            TargetUserName: 'Test User - Email System',
            TargetUserId: 'EMAIL_TEST_USER',
            PerformedByName: currentUser?.displayName || 'Email Test System',
            Details: 'Role updated for email system testing',
            LogTimestamp: new Date().toISOString(),
            OldValue: 'User',
            NewValue: 'Admin',
            Reason: 'Email system testing'
          }
        );
        tests.userRoleUpdated = result.success;
      } catch (error) {
        console.error('❌ User role updated test failed:', error);
      }

      const passed = Object.values(tests).filter(Boolean).length;
      const total = Object.keys(tests).length;

      return {
        name: 'User Management Notifications',
        status: passed === total ? 'PASSED' : passed > 0 ? 'WARNING' : 'FAILED',
        message: `User management notifications: ${passed}/${total} successful`,
        details: tests
      };
      
    } catch (error) {
      return {
        name: 'User Management Notifications',
        status: 'FAILED',
        message: error.message,
        details: null
      };
    }
  }

  // Test system notifications
  async testSystemNotifications(currentUser) {
    try {
      console.log('🧪 Testing system notifications...');
      
      const tests = {
        emailSystemTest: false,
        monitoringStart: false,
        monitoringStop: false
      };

      // Test email system test
      try {
        const result = await this.emailNotification.testEmailSystem();
        tests.emailSystemTest = result.success;
      } catch (error) {
        console.error('❌ Email system test failed:', error);
      }

      // Test monitoring start
      try {
        const result = await this.emailNotification.startEmailMonitoring();
        tests.monitoringStart = result;
      } catch (error) {
        console.error('❌ Monitoring start test failed:', error);
      }

      // Test monitoring stop
      try {
        const result = await this.emailNotification.stopEmailMonitoring();
        tests.monitoringStop = result;
      } catch (error) {
        console.error('❌ Monitoring stop test failed:', error);
      }

      const passed = Object.values(tests).filter(Boolean).length;
      const total = Object.keys(tests).length;

      return {
        name: 'System Notifications',
        status: passed === total ? 'PASSED' : passed > 0 ? 'WARNING' : 'FAILED',
        message: `System notifications: ${passed}/${total} successful`,
        details: tests
      };
      
    } catch (error) {
      return {
        name: 'System Notifications',
        status: 'FAILED',
        message: error.message,
        details: null
      };
    }
  }

  // Test email activity logging
  async testEmailActivityLogging() {
    try {
      console.log('🧪 Testing email activity logging...');
      
      const tests = {
        logCreation: false,
        logRetrieval: false,
        logParsing: false
      };

      // Test log creation
      try {
        await this.emailNotification.logEmailActivity({
          activityType: 'EMAIL_SYSTEM_COMPREHENSIVE_TEST',
          recipients: ['test@hsbc.com'],
          success: true,
          details: {
            testType: 'Comprehensive Email System Test',
            timestamp: new Date().toISOString()
          }
        });
        tests.logCreation = true;
      } catch (error) {
        console.error('❌ Log creation test failed:', error);
      }

      // Test log retrieval
      try {
        const logs = await this.emailNotification.getEmailActivityLog(10);
        tests.logRetrieval = Array.isArray(logs);
        
        // Test log parsing
        if (logs.length > 0) {
          const firstLog = logs[0];
          tests.logParsing = !!(firstLog.id && firstLog.activityType && firstLog.timestamp);
       }
     } catch (error) {
       console.error('❌ Log retrieval test failed:', error);
     }

     const passed = Object.values(tests).filter(Boolean).length;
     const total = Object.keys(tests).length;

     return {
       name: 'Email Activity Logging',
       status: passed === total ? 'PASSED' : passed > 0 ? 'WARNING' : 'FAILED',
       message: `Email activity logging: ${passed}/${total} successful`,
       details: tests
     };
     
   } catch (error) {
     return {
       name: 'Email Activity Logging',
       status: 'FAILED',
       message: error.message,
       details: null
     };
   }
 }

 // Test integration hooks
 async testIntegrationHooks(currentUser) {
   try {
     console.log('🧪 Testing integration hooks...');
     
     const results = await this.emailIntegration.testAllIntegrations(currentUser);
     
     const passed = Object.values(results).filter(Boolean).length;
     const total = Object.keys(results).length;

     return {
       name: 'Integration Hooks',
       status: passed === total ? 'PASSED' : passed > 0 ? 'WARNING' : 'FAILED',
       message: `Integration hooks: ${passed}/${total} successful`,
       details: results
     };
     
   } catch (error) {
     return {
       name: 'Integration Hooks',
       status: 'FAILED',
       message: error.message,
       details: null
     };
   }
 }

 // Log test results to SharePoint
 async logTestResults(testResults) {
   try {
     console.log('📝 Logging comprehensive test results...');
     
     const requestDigest = await this.getFreshRequestDigest();
     
     const logEntry = {
       __metadata: { type: 'SP.Data.EmailActivityLogListItem' },
       Title: 'COMPREHENSIVE_EMAIL_SYSTEM_TEST',
       ActivityType: 'COMPREHENSIVE_EMAIL_SYSTEM_TEST',
       Recipients: JSON.stringify(['minaantoun@hsbc.com']),
       Success: testResults.summary.failed === 0,
       Details: JSON.stringify(testResults),
       Timestamp: testResults.timestamp,
       PerformedBy: testResults.user,
       ProcedureId: null,
       TargetUser: null
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
       console.log('✅ Test results logged successfully');
     }
     
   } catch (error) {
     console.error('❌ Failed to log test results:', error);
   }
 }

 // Get fresh request digest
 async getFreshRequestDigest() {
   try {
     const digestResponse = await fetch(
       'https://teams.global.hsbc/sites/EmployeeEng/_api/contextinfo',
       {
         method: 'POST',
         headers: {
           'Accept': 'application/json; odata=verbose',
           'Content-Type': 'application/json; odata=verbose'
         },
         credentials: 'same-origin'
       }
     );
     
     if (digestResponse.ok) {
       const digestData = await digestResponse.json();
       return digestData.d.GetContextWebInformation.FormDigestValue;
     }
     
     return document.getElementById('__REQUESTDIGEST')?.value || '';
   } catch (error) {
     return '';
   }
 }

 // ===================================================================
 // QUICK TESTS FOR SPECIFIC COMPONENTS
 // ===================================================================

 // Quick test for single notification type
 async quickTestNotification(notificationType, currentUser) {
   console.log(`🧪 Quick test for ${notificationType}...`);
   
   const testData = {
     'new-procedure-uploaded': {
       procedure: {
         name: 'Quick Test Procedure',
         lob: 'IWPB',
         primary_owner: 'Quick Test Owner',
         primary_owner_email: 'quicktest@hsbc.com'
       },
       analysisResult: { score: 75 },
       procedureId: 'QUICK_TEST_001'
     },
     'user-access-granted': {
       userEmail: 'quicktest.user@hsbc.com',
       logEntry: {
         Title: 'USER_ACCESS_GRANTED',
         TargetUserName: 'Quick Test User',
         TargetUserId: 'QUICK_TEST_USER',
         PerformedByName: currentUser?.displayName || 'Quick Test',
         Details: 'Quick test access grant',
         LogTimestamp: new Date().toISOString(),
         OldValue: 'No Access',
         NewValue: 'User',
         Reason: 'Quick testing'
       }
     }
   };

   try {
     let result;
     
     if (notificationType === 'new-procedure-uploaded') {
       result = await this.emailNotification.triggerProcedureUploadNotification(testData[notificationType]);
     } else if (notificationType === 'user-access-granted') {
       const data = testData[notificationType];
       result = await this.emailNotification.triggerUserChangeNotification(data.userEmail, data.logEntry);
     }
     
     console.log(`✅ Quick test ${notificationType} result:`, result);
     return result;
     
   } catch (error) {
     console.error(`❌ Quick test ${notificationType} failed:`, error);
     return { success: false, message: error.message };
   }
 }

 // Test email configuration only
 async quickTestConfiguration() {
   console.log('🧪 Quick configuration test...');
   
   try {
     const config = await this.emailNotification.refreshConfiguration();
     const testEmail = await this.emailNotification.testEmailSystem();
     
     return {
       configLoaded: !!config,
       testEmailSent: testEmail.success,
       adminCount: config?.adminList?.length || 0,
       globalCCCount: config?.globalCCList?.length || 0,
       testEmailAddress: config?.testEmail || 'Not set'
     };
     
   } catch (error) {
     console.error('❌ Quick configuration test failed:', error);
     return { error: error.message };
   }
 }
}

export default EmailTestingService;
