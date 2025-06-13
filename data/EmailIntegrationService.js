// services/EmailIntegrationService.js - Complete Action Integration
import EmailNotificationService from './EmailNotificationService';

class EmailIntegrationService {
  constructor() {
    this.emailNotificationService = new EmailNotificationService();
    this.initialized = false;
    this.init();
  }

  async init() {
    try {
      console.log('🔗 Initializing Email Integration Service...');
      await this.emailNotificationService.startEmailMonitoring();
      this.initialized = true;
      console.log('✅ Email Integration Service ready');
    } catch (error) {
      console.error('❌ Failed to initialize Email Integration:', error);
    }
  }

  // ===================================================================
  // PROCEDURE ACTION HOOKS
  // ===================================================================

  // Hook for procedure upload (call this after successful upload)
  async onProcedureUploaded(uploadResult, analysisResult, currentUser) {
    try {
      console.log('🔗 Procedure uploaded hook triggered:', uploadResult);
      
      // 1. Send new procedure notification
      const emailResult = await this.emailNotificationService.triggerProcedureUploadNotification({
        procedure: uploadResult.procedure,
        analysisResult: analysisResult,
        procedureId: uploadResult.procedureId
      });

      // 2. Check for low quality score
      if (analysisResult?.score < 60) {
        console.log('📊 Low quality score detected, sending alert...');
        await this.emailNotificationService.triggerLowQualityScoreNotification(
          uploadResult.procedure, 
          analysisResult
        );
      }

      // 3. Log user activity
      await this.logUserActivity({
        userId: currentUser?.staffId,
        userName: currentUser?.displayName,
        action: 'PROCEDURE_UPLOADED',
        details: {
          procedureId: uploadResult.procedureId,
          procedureName: uploadResult.procedure?.name,
          qualityScore: analysisResult?.score,
          emailSent: emailResult.success
        },
        timestamp: new Date().toISOString()
      });

      console.log('✅ Procedure upload integration completed');
      return emailResult;
      
    } catch (error) {
      console.error('❌ Procedure upload integration failed:', error);
      return { success: false, message: error.message };
    }
  }

  // Hook for procedure updates
  async onProcedureUpdated(procedureData, updateDetails, currentUser) {
    try {
      console.log('🔗 Procedure updated hook triggered:', procedureData);
      
      // Log user activity
      await this.logUserActivity({
        userId: currentUser?.staffId,
        userName: currentUser?.displayName,
        action: 'PROCEDURE_UPDATED',
        details: {
          procedureId: procedureData.id,
          procedureName: procedureData.name,
          updateType: updateDetails.type,
          changes: updateDetails.changes
        },
        timestamp: new Date().toISOString()
      });

      console.log('✅ Procedure update integration completed');
      
    } catch (error) {
      console.error('❌ Procedure update integration failed:', error);
    }
  }

  // ===================================================================
  // USER MANAGEMENT ACTION HOOKS
  // ===================================================================

  // Hook for user access granted
  async onUserAccessGranted(targetUserEmail, grantDetails, currentUser) {
    try {
      console.log('🔗 User access granted hook triggered:', targetUserEmail);
      
      // 1. Send access granted notification
      const emailResult = await this.emailNotificationService.triggerUserChangeNotification(
        targetUserEmail, 
        {
          Title: 'USER_ACCESS_GRANTED',
          TargetUserName: grantDetails.userName || targetUserEmail,
          TargetUserId: grantDetails.userId || 'Unknown',
          PerformedByName: currentUser?.displayName || 'System Admin',
          Details: `Access granted to HSBC Procedures Hub with role: ${grantDetails.role || 'User'}`,
          LogTimestamp: new Date().toISOString(),
          OldValue: 'No Access',
          NewValue: grantDetails.role || 'User',
          Reason: grantDetails.reason || 'Administrative action'
        }
      );

      // 2. Log user activity for both users
      await this.logUserActivity({
        userId: currentUser?.staffId,
        userName: currentUser?.displayName,
        action: 'USER_ACCESS_GRANTED',
        details: {
          targetUserEmail: targetUserEmail,
          targetUserName: grantDetails.userName,
          role: grantDetails.role,
          emailSent: emailResult.success
        },
        timestamp: new Date().toISOString()
      });

      // 3. Log activity for target user
      await this.logUserActivity({
        userId: grantDetails.userId,
        userName: grantDetails.userName,
        action: 'ACCESS_RECEIVED',
        details: {
          grantedBy: currentUser?.displayName,
          role: grantDetails.role,
          reason: grantDetails.reason
        },
        timestamp: new Date().toISOString()
      });

      console.log('✅ User access granted integration completed');
      return emailResult;
      
    } catch (error) {
      console.error('❌ User access granted integration failed:', error);
      return { success: false, message: error.message };
    }
  }

  // Hook for user access revoked
  async onUserAccessRevoked(targetUserEmail, revokeDetails, currentUser) {
    try {
      console.log('🔗 User access revoked hook triggered:', targetUserEmail);
      
      // 1. Send access revoked notification
      const emailResult = await this.emailNotificationService.triggerUserChangeNotification(
        targetUserEmail, 
        {
          Title: 'USER_ACCESS_REVOKED',
          TargetUserName: revokeDetails.userName || targetUserEmail,
          TargetUserId: revokeDetails.userId || 'Unknown',
          PerformedByName: currentUser?.displayName || 'System Admin',
          Details: `Access revoked from HSBC Procedures Hub. Previous role: ${revokeDetails.previousRole || 'User'}`,
          LogTimestamp: new Date().toISOString(),
          OldValue: revokeDetails.previousRole || 'User',
          NewValue: 'No Access',
          Reason: revokeDetails.reason || 'Administrative action'
        }
      );

      // 2. Log user activities
      await this.logUserActivity({
        userId: currentUser?.staffId,
        userName: currentUser?.displayName,
        action: 'USER_ACCESS_REVOKED',
        details: {
          targetUserEmail: targetUserEmail,
          targetUserName: revokeDetails.userName,
          previousRole: revokeDetails.previousRole,
          emailSent: emailResult.success
        },
        timestamp: new Date().toISOString()
      });

      await this.logUserActivity({
        userId: revokeDetails.userId,
        userName: revokeDetails.userName,
        action: 'ACCESS_REVOKED',
        details: {
          revokedBy: currentUser?.displayName,
          previousRole: revokeDetails.previousRole,
          reason: revokeDetails.reason
        },
        timestamp: new Date().toISOString()
      });

      console.log('✅ User access revoked integration completed');
      return emailResult;
      
    } catch (error) {
      console.error('❌ User access revoked integration failed:', error);
      return { success: false, message: error.message };
    }
  }

  // Hook for user role updated
  async onUserRoleUpdated(targetUserEmail, updateDetails, currentUser) {
    try {
      console.log('🔗 User role updated hook triggered:', targetUserEmail);
      
      // 1. Send role update notification
      const emailResult = await this.emailNotificationService.triggerUserChangeNotification(
        targetUserEmail, 
        {
          Title: 'USER_ROLE_UPDATED',
          TargetUserName: updateDetails.userName || targetUserEmail,
          TargetUserId: updateDetails.userId || 'Unknown',
          PerformedByName: currentUser?.displayName || 'System Admin',
          Details: `Role updated from ${updateDetails.oldRole} to ${updateDetails.newRole}`,
          LogTimestamp: new Date().toISOString(),
          OldValue: updateDetails.oldRole,
          NewValue: updateDetails.newRole,
          Reason: updateDetails.reason || 'Role adjustment'
        }
      );

      // 2. Log user activities
      await this.logUserActivity({
        userId: currentUser?.staffId,
        userName: currentUser?.displayName,
        action: 'USER_ROLE_UPDATED',
        details: {
          targetUserEmail: targetUserEmail,
          targetUserName: updateDetails.userName,
          oldRole: updateDetails.oldRole,
          newRole: updateDetails.newRole,
          emailSent: emailResult.success
        },
        timestamp: new Date().toISOString()
      });

      await this.logUserActivity({
        userId: updateDetails.userId,
        userName: updateDetails.userName,
        action: 'ROLE_UPDATED',
        details: {
          updatedBy: currentUser?.displayName,
          oldRole: updateDetails.oldRole,
          newRole: updateDetails.newRole,
          reason: updateDetails.reason
        },
        timestamp: new Date().toISOString()
      });

      console.log('✅ User role updated integration completed');
      return emailResult;
      
    } catch (error) {
      console.error('❌ User role updated integration failed:', error);
      return { success: false, message: error.message };
    }
  }

  // ===================================================================
  // SYSTEM ACTION HOOKS
  // ===================================================================

  // Hook for system admin actions
  async onSystemAction(actionType, actionDetails, currentUser) {
    try {
      console.log('🔗 System action hook triggered:', actionType);
      
      // Log system activity
      await this.logUserActivity({
        userId: currentUser?.staffId || 'SYSTEM',
        userName: currentUser?.displayName || 'System',
        action: actionType,
        details: actionDetails,
        timestamp: new Date().toISOString()
      });

      // Send notifications for critical system actions
      if (['SYSTEM_CONFIGURATION_CHANGED', 'EMAIL_SETTINGS_UPDATED', 'BULK_USER_IMPORT'].includes(actionType)) {
        await this.emailNotificationService.triggerUserChangeNotification(
          'minaantoun@hsbc.com', // Always notify system admin
          {
            Title: 'SYSTEM_ACTION_NOTIFICATION',
            TargetUserName: 'System Administrator',
            TargetUserId: 'SYSTEM',
            PerformedByName: currentUser?.displayName || 'System',
            Details: `System action performed: ${actionType}`,
            LogTimestamp: new Date().toISOString(),
            OldValue: 'N/A',
            NewValue: JSON.stringify(actionDetails),
            Reason: 'System administration'
          }
        );
      }

      console.log('✅ System action integration completed');
      
    } catch (error) {
      console.error('❌ System action integration failed:', error);
    }
  }

  // ===================================================================
  // USER ACTIVITY LOGGING
  // ===================================================================

  async logUserActivity(activityData) {
    try {
      console.log('📝 Logging user activity:', activityData);
      
      // Get fresh request digest
      const requestDigest = await this.getFreshRequestDigest();
      
      const logEntry = {
        __metadata: { type: 'SP.Data.UserActivityLogListItem' },
        Title: activityData.action,
        UserId: activityData.userId || 'Unknown',
        UserName: activityData.userName || 'Unknown User',
        ActivityType: activityData.action,
        ActivityDetails: JSON.stringify(activityData.details || {}),
        ActivityTimestamp: activityData.timestamp || new Date().toISOString(),
        Status: 'completed'
      };

      const response = await fetch(
        'https://teams.global.hsbc/sites/EmployeeEng/_api/web/lists/getbytitle(\'UserActivityLog\')/items',
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
        console.log('✅ User activity logged successfully');
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to log user activity:', response.status, errorText);
      }
      
    } catch (error) {
      console.error('❌ Error logging user activity:', error);
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
      } else {
        // Fallback to page digest
        const digestElement = document.getElementById('__REQUESTDIGEST');
        return digestElement?.value || '';
      }
    } catch (error) {
      console.error('❌ Error getting request digest:', error);
      return '';
    }
  }

  // ===================================================================
  // PUBLIC INTEGRATION METHODS
  // ===================================================================

  // Test all email integrations
  async testAllIntegrations(currentUser) {
    console.log('🧪 Testing all email integrations...');
    
    const results = {
      procedureUpload: false,
      userAccessGranted: false,
      userAccessRevoked: false,
      userRoleUpdated: false,
      systemAction: false
    };

    try {
      // Test procedure upload
      results.procedureUpload = await this.onProcedureUploaded(
        {
          procedureId: 'TEST_001',
          procedure: {
            name: 'Test Procedure Integration',
            lob: 'IWPB',
            primary_owner: 'Test Owner',
            primary_owner_email: 'test.owner@hsbc.com'
          }
        },
        { score: 85, details: {}, aiRecommendations: [] },
        currentUser
      );

      // Test user access granted
      results.userAccessGranted = await this.onUserAccessGranted(
        'test.user@hsbc.com',
        {
          userName: 'Test User',
          userId: 'TEST_USER',
          role: 'User',
          reason: 'Integration test'
        },
        currentUser
      );

      // Test system action
      await this.onSystemAction(
        'INTEGRATION_TEST_COMPLETED',
        { testResults: results, timestamp: new Date().toISOString() },
        currentUser
      );

      console.log('✅ All integration tests completed:', results);
      return results;
      
    } catch (error) {
      console.error('❌ Integration test failed:', error);
      return results;
    }
  }

  // Get integration status
  getStatus() {
    return {
      initialized: this.initialized,
      emailServiceRunning: this.emailNotificationService?.isRunning || false,
      lastActivity: new Date().toISOString()
    };
  }
}

export default EmailIntegrationService;
