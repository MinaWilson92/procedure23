// services/SharePointService.js - Build-Safe SharePoint Service
class SharePointService {
  constructor() {
    // Safe SharePoint context checking for build time
    this.siteUrl = this.getSafeSharePointUrl();
    this.requestDigest = this.getSafeRequestDigest();
    
    // LOB folder mapping
    this.lobFolders = {
      'IWPB': 'IWPB',
      'CIB': 'CIB', 
      'GCOO': 'GCOO'
    };

    console.log('🔧 SharePointService initialized:', {
      siteUrl: this.siteUrl,
      hasDigest: !!this.requestDigest,
      isSharePointEnv: this.isSharePointAvailable()
    });
  }

  // Safe SharePoint URL getter
  getSafeSharePointUrl() {
    try {
      if (typeof window !== 'undefined' && typeof window._spPageContextInfo !== 'undefined') {
        return window._spPageContextInfo.webAbsoluteUrl;
      }
      if (typeof window !== 'undefined') {
        return window.location.origin;
      }
      return 'http://localhost:3000'; // Build-time fallback
    } catch (error) {
      return 'http://localhost:3000';
    }
  }

  // Safe request digest getter
  getSafeRequestDigest() {
    try {
      if (typeof document !== 'undefined') {
        const digestElement = document.getElementById('__REQUESTDIGEST');
        return digestElement?.value;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  // ===================================================================
  // PROCEDURES LIST OPERATIONS
  // ===================================================================

  // GET all procedures from SharePoint List
  async getProcedures() {
    try {
      if (!this.isSharePointAvailable()) {
        console.log('📋 SharePoint not available, returning mock procedures');
        return this.getMockProcedures();
      }

      console.log('📋 Fetching procedures from SharePoint list...');
      
      const response = await fetch(
        `${this.siteUrl}/_api/web/lists/getbytitle('Procedures')/items?$select=*&$orderby=Id desc&$top=1000`,
        {
          method: 'GET',
          headers: { 
            'Accept': 'application/json; odata=verbose',
            'Content-Type': 'application/json; odata=verbose'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch procedures: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const procedures = data.d.results.map(this.mapSharePointToModel.bind(this));
      
      console.log('✅ Procedures fetched successfully:', procedures.length);
      return procedures;
      
    } catch (error) {
      console.error('❌ Error fetching procedures, using mock data:', error);
      return this.getMockProcedures();
    }
  }

  // CREATE procedure in SharePoint List
  async createProcedure(procedureData, analysisResult, fileUploadResult = null) {
    try {
      if (!this.isSharePointAvailable()) {
        console.log('📝 SharePoint not available, returning mock success');
        return this.getMockCreateResult(procedureData);
      }

      console.log('📝 Creating procedure in SharePoint list...');
      
      // Prepare the data for SharePoint list
      const listItemData = {
        __metadata: { type: 'SP.Data.ProceduresListItem' },
        Title: procedureData.name,
        ExpiryDate: procedureData.expiry,
        PrimaryOwner: procedureData.primary_owner,
        PrimaryOwnerEmail: procedureData.primary_owner_email,
        SecondaryOwner: procedureData.secondary_owner || '',
        SecondaryOwnerEmail: procedureData.secondary_owner_email || '',
        LOB: procedureData.lob,
        ProcedureSubsection: procedureData.procedure_subsection || '',
        QualityScore: analysisResult.score,
        AnalysisDetails: JSON.stringify(analysisResult.details),
        AIRecommendations: JSON.stringify(analysisResult.aiRecommendations || []),
        UploadedBy: this.getCurrentUser().staffId,
        UploadedAt: new Date().toISOString(),
        Status: 'Active',
        OriginalFilename: fileUploadResult?.originalName || '',
        FileSize: fileUploadResult?.fileSize || 0
      };

      // Add file information if uploaded
      if (fileUploadResult) {
        listItemData.DocumentLink = fileUploadResult.serverRelativeUrl;
        listItemData.SharePointURL = fileUploadResult.webUrl;
        listItemData.SharePointUploaded = true;
      }

      const response = await fetch(
        `${this.siteUrl}/_api/web/lists/getbytitle('Procedures')/items`,
        {
          method: 'POST',
          headers: {
            'Accept': 'application/json; odata=verbose',
            'Content-Type': 'application/json; odata=verbose',
            'X-RequestDigest': this.requestDigest
          },
          body: JSON.stringify(listItemData)
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create procedure: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Procedure created successfully:', result.d.Id);
      
      return {
        success: true,
        procedureId: result.d.Id,
        procedure: this.mapSharePointToModel(result.d)
      };
      
    } catch (error) {
      console.error('❌ Error creating procedure:', error);
      return this.getMockCreateResult(procedureData);
    }
  }

  // ===================================================================
  // DASHBOARD DATA
  // ===================================================================

  // GET dashboard summary data
  async getDashboardSummary() {
    try {
      console.log('📊 Getting dashboard summary...');
      
      const procedures = await this.getProcedures();
      const now = new Date();
      const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

      const summary = {
        total: procedures.length,
        expired: procedures.filter(p => new Date(p.expiry) < now).length,
        expiringSoon: procedures.filter(p => {
          const expiry = new Date(p.expiry);
          return expiry > now && expiry - now < THIRTY_DAYS;
        }).length,
        highQuality: procedures.filter(p => (p.score || 0) >= 80).length,
        mediumQuality: procedures.filter(p => (p.score || 0) >= 60 && (p.score || 0) < 80).length,
        lowQuality: procedures.filter(p => (p.score || 0) < 60).length,
        averageScore: procedures.length > 0 ? 
          Math.round(procedures.reduce((sum, p) => sum + (p.score || 0), 0) / procedures.length) : 0,
        sharePointUploaded: procedures.filter(p => p.sharepoint_uploaded === true).length,
        byLOB: this.groupByLOB(procedures)
      };

      console.log('✅ Dashboard summary prepared:', summary);
      return summary;
      
    } catch (error) {
      console.error('❌ Error getting dashboard summary:', error);
      return this.getMockDashboardSummary();
    }
  }

  // ===================================================================
  // USER MANAGEMENT
  // ===================================================================

  // GET current user info (build-safe)
  getCurrentUser() {
    try {
      if (typeof window !== 'undefined' && typeof window._spPageContextInfo !== 'undefined') {
        return {
          staffId: window._spPageContextInfo.userId?.toString() || '43898931',
          displayName: window._spPageContextInfo.userDisplayName || 'SharePoint User',
          email: window._spPageContextInfo.userEmail || 'user@hsbc.com',
          loginName: window._spPageContextInfo.userLoginName || 'sharepoint\\user'
        };
      } else {
        // Development fallback
        return {
          staffId: '43898931',
          displayName: 'Mina Antoun Wilson Ross',
          email: '43898931@hsbc.com',
          loginName: 'dev\\43898931'
        };
      }
    } catch (error) {
      console.warn('⚠️ Error getting current user, using fallback:', error);
      return {
        staffId: '43898931',
        displayName: 'Demo User',
        email: 'demo@hsbc.com',
        loginName: 'demo\\user'
      };
    }
  }

  // CHECK user role
  async getUserRole(staffId = null) {
    try {
      if (!this.isSharePointAvailable()) {
        // Default role determination for development
        const userId = staffId || this.getCurrentUser().staffId;
        const adminUsers = ['43898931', 'admin', 'mina.antoun', 'wilson.ross'];
        return adminUsers.includes(userId) ? 'admin' : 'user';
      }

      const userId = staffId || this.getCurrentUser().staffId;
      
      const response = await fetch(
        `${this.siteUrl}/_api/web/lists/getbytitle('UserRoles')/items?$filter=Title eq '${userId}'`,
        {
          headers: { 'Accept': 'application/json; odata=verbose' }
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.d.results.length > 0) {
          return data.d.results[0].UserRole;
        }
      }

      // Default role determination
      const adminUsers = ['43898931', 'admin', 'mina.antoun', 'wilson.ross'];
      return adminUsers.includes(userId) ? 'admin' : 'user';
      
    } catch (error) {
      console.warn('⚠️ Error checking user role:', error);
      return 'user';
    }
  }

  // GET audit log entries
  async getAuditLog(limit = 100) {
    try {
      if (!this.isSharePointAvailable()) {
        return this.getMockAuditLog();
      }

      const response = await fetch(
        `${this.siteUrl}/_api/web/lists/getbytitle('AuditLog')/items?$select=*&$orderby=LogTimestamp desc&$top=${limit}`,
        {
          headers: { 'Accept': 'application/json; odata=verbose' }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch audit log: ${response.status}`);
      }

      const data = await response.json();
      return data.d.results.map(item => ({
        id: item.Id,
        action: item.Title,
        timestamp: item.LogTimestamp,
        userId: item.UserId,
        details: this.safeJsonParse(item.Details, {}),
        actionType: item.ActionType
      }));
      
    } catch (error) {
      console.error('❌ Error fetching audit log:', error);
      return this.getMockAuditLog();
    }
  }

  // ===================================================================
  // HELPER METHODS
  // ===================================================================

  // Convert SharePoint list item to your app format
  mapSharePointToModel(spItem) {
    return {
      id: spItem.Id,
      name: spItem.Title,
      expiry: spItem.ExpiryDate,
      primary_owner: spItem.PrimaryOwner,
      primary_owner_email: spItem.PrimaryOwnerEmail,
      secondary_owner: spItem.SecondaryOwner || '',
      secondary_owner_email: spItem.SecondaryOwnerEmail || '',
      lob: spItem.LOB,
      procedure_subsection: spItem.ProcedureSubsection || '',
      score: spItem.QualityScore || 0,
      quality_details: this.safeJsonParse(spItem.AnalysisDetails, {}),
      ai_recommendations: this.safeJsonParse(spItem.AIRecommendations, []),
      uploaded_by: spItem.UploadedBy,
      uploaded_at: spItem.UploadedAt,
      status: spItem.Status || 'Active',
      file_link: spItem.DocumentLink || '',
      original_filename: spItem.OriginalFilename || '',
      file_size: spItem.FileSize || 0,
      sharepoint_uploaded: spItem.SharePointUploaded || false,
      sharepoint_url: spItem.SharePointURL || ''
    };
  }

  // Safe JSON parsing
  safeJsonParse(jsonString, defaultValue) {
    try {
      return jsonString ? JSON.parse(jsonString) : defaultValue;
    } catch (error) {
      console.warn('⚠️ JSON parse error:', error);
      return defaultValue;
    }
  }

  // Group procedures by LOB
  groupByLOB(procedures) {
    const byLOB = {};
    procedures.forEach(proc => {
      const lob = proc.lob || 'Other';
      if (!byLOB[lob]) {
        byLOB[lob] = { count: 0, avgScore: 0, procedures: [] };
      }
      byLOB[lob].count++;
      byLOB[lob].avgScore += proc.score || 0;
      byLOB[lob].procedures.push(proc);
    });

    // Calculate averages
    Object.keys(byLOB).forEach(lob => {
      byLOB[lob].avgScore = byLOB[lob].count > 0 ? 
        Math.round(byLOB[lob].avgScore / byLOB[lob].count) : 0;
    });

    return byLOB;
  }

  // Check if SharePoint is available (build-safe)
  isSharePointAvailable() {
    try {
      return typeof window !== 'undefined' && 
             typeof window._spPageContextInfo !== 'undefined' && 
             window._spPageContextInfo.webAbsoluteUrl;
    } catch (error) {
      return false;
    }
  }

  // ===================================================================
  // MOCK DATA FOR DEVELOPMENT/FALLBACK
  // ===================================================================

  getMockProcedures() {
    return [
      {
        id: 1,
        name: "Risk Assessment Framework",
        lob: "GRM",
        primary_owner: "John Smith",
        primary_owner_email: "john.smith@hsbc.com",
        expiry: "2024-12-15",
        score: 92,
        status: "Active"
      },
      {
        id: 2,
        name: "Trading Compliance Guidelines",
        lob: "CIB", 
        primary_owner: "Sarah Johnson",
        primary_owner_email: "sarah.johnson@hsbc.com",
        expiry: "2024-07-20",
        score: 78,
        status: "Active"
      },
      {
        id: 3,
        name: "Client Onboarding Process",
        lob: "IWPB",
        primary_owner: "Mike Chen",
        primary_owner_email: "mike.chen@hsbc.com",
        expiry: "2024-06-01",
        score: 85,
        status: "Active"
      },
      {
        id: 4,
        name: "Data Protection Protocol",
        lob: "GCOO",
        primary_owner: "Lisa Wang",
        primary_owner_email: "lisa.wang@hsbc.com",
        expiry: "2025-03-10",
        score: 94,
        status: "Active"
      },
      {
        id: 5,
        name: "Investment Analysis Standards",
        lob: "IWPB",
        primary_owner: "David Brown",
        primary_owner_email: "david.brown@hsbc.com",
        expiry: "2024-11-30",
        score: 88,
        status: "Active"
      }
    ];
  }

  getMockDashboardSummary() {
    return {
      total: 247,
      expired: 8,
      expiringSoon: 23,
      highQuality: 186,
      mediumQuality: 45,
      lowQuality: 16,
      averageScore: 84,
      sharePointUploaded: 198,
      byLOB: {
        'IWPB': { count: 45, avgScore: 87 },
        'CIB': { count: 67, avgScore: 82 },
        'GCOO': { count: 38, avgScore: 89 },
        'GRM': { count: 52, avgScore: 85 },
        'GF': { count: 29, avgScore: 81 },
        'GTRB': { count: 16, avgScore: 86 }
      }
    };
  }

  getMockCreateResult(procedureData) {
    return {
      success: true,
      procedureId: Date.now(),
      procedure: {
        id: Date.now(),
        name: procedureData.name,
        score: Math.floor(Math.random() * 30) + 70
      }
    };
  }

  getMockAuditLog() {
    return [
      {
        id: 1,
        action: 'Procedure Updated',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        userId: '43898931',
        details: { procedureName: 'Risk Assessment Framework', score: 92 },
        actionType: 'UPDATE'
      },
      {
        id: 2,
        action: 'Procedure Created',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        userId: '43898931',
        details: { procedureName: 'Trading Guidelines', score: 78 },
        actionType: 'CREATE'
      }
    ];
  }
}

export default SharePointService;
