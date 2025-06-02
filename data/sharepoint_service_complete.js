// src/services/SharePointService.js - Complete SharePoint API Layer
class SharePointService {
  constructor() {
    // SharePoint context from global variables
    this.siteUrl = typeof _spPageContextInfo !== 'undefined' 
      ? _spPageContextInfo.webAbsoluteUrl 
      : window.location.origin;
    
    this.requestDigest = document.getElementById('__REQUESTDIGEST')?.value;
    
    // LOB folder mapping
    this.lobFolders = {
      'IWPB': 'IWPB',
      'CIB': 'CIB', 
      'GCOO': 'GCOO'
    };

    console.log('🔧 SharePointService initialized:', {
      siteUrl: this.siteUrl,
      hasDigest: !!this.requestDigest
    });
  }

  // ===================================================================
  // PROCEDURES LIST OPERATIONS
  // ===================================================================

  // GET all procedures from SharePoint List
  async getProcedures() {
    try {
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
      const procedures = data.d.results.map(this.mapSharePointToModel);
      
      console.log('✅ Procedures fetched successfully:', procedures.length);
      return procedures;
      
    } catch (error) {
      console.error('❌ Error fetching procedures:', error);
      return [];
    }
  }

  // CREATE procedure in SharePoint List
  async createProcedure(procedureData, analysisResult, fileUploadResult = null) {
    try {
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
        AIRecommendations: JSON.stringify(analysisResult.aiRecommendations),
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
      throw error;
    }
  }

  // UPDATE procedure in SharePoint List
  async updateProcedure(procedureId, updateData) {
    try {
      console.log('📝 Updating procedure:', procedureId);
      
      const response = await fetch(
        `${this.siteUrl}/_api/web/lists/getbytitle('Procedures')/items(${procedureId})`,
        {
          method: 'POST',
          headers: {
            'Accept': 'application/json; odata=verbose',
            'Content-Type': 'application/json; odata=verbose',
            'X-RequestDigest': this.requestDigest,
            'X-HTTP-Method': 'MERGE',
            'If-Match': '*'
          },
          body: JSON.stringify({
            __metadata: { type: 'SP.Data.ProceduresListItem' },
            ...updateData
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update procedure: ${response.status}`);
      }

      console.log('✅ Procedure updated successfully');
      return { success: true };
      
    } catch (error) {
      console.error('❌ Error updating procedure:', error);
      throw error;
    }
  }

  // ===================================================================
  // FILE UPLOAD TO DOCUMENT LIBRARY (LOB FOLDERS)
  // ===================================================================

  // UPLOAD file to SharePoint Document Library with LOB folders
  async uploadFileToLibrary(file, procedureData) {
    try {
      console.log('📤 Uploading file to SharePoint Document Library...');
      
      // Generate safe filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileExtension = file.name.split('.').pop();
      const cleanName = procedureData.name.replace(/[^a-zA-Z0-9_-]/g, '_');
      const fileName = `${procedureData.lob}_${cleanName}_${timestamp}.${fileExtension}`;
      
      // Determine LOB folder
      const lobFolder = this.lobFolders[procedureData.lob] || 'GCOO';
      const folderPath = `Shared Documents/ProceduresLibrary/${lobFolder}`;
      
      console.log('📁 Upload details:', {
        fileName,
        lobFolder,
        folderPath,
        fileSize: file.size
      });

      // Convert file to array buffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Upload to SharePoint document library
      const uploadUrl = `${this.siteUrl}/_api/web/GetFolderByServerRelativeUrl('${folderPath}')/Files/add(url='${fileName}',overwrite=true)`;
      
      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json; odata=verbose',
          'X-RequestDigest': this.requestDigest
        },
        body: arrayBuffer
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`Upload failed: ${uploadResponse.status} - ${errorText}`);
      }

      const uploadResult = await uploadResponse.json();
      
      // Construct full URLs
      const serverRelativeUrl = uploadResult.d.ServerRelativeUrl;
      const webUrl = `${this.siteUrl}${serverRelativeUrl}`;
      
      console.log('✅ File uploaded successfully:', {
        fileName,
        serverRelativeUrl,
        webUrl
      });

      return {
        success: true,
        fileName: fileName,
        originalName: file.name,
        fileSize: file.size,
        serverRelativeUrl: serverRelativeUrl,
        webUrl: webUrl,
        folderPath: folderPath,
        lobFolder: lobFolder
      };
      
    } catch (error) {
      console.error('❌ Error uploading file:', error);
      throw error;
    }
  }

  // ===================================================================
  // AUDIT LOG OPERATIONS
  // ===================================================================

  // ADD audit log entry
  async addAuditLog(action, details, userId = null) {
    try {
      const user = userId || this.getCurrentUser().staffId;
      
      const logData = {
        __metadata: { type: 'SP.Data.AuditLogListItem' },
        Title: action,
        LogTimestamp: new Date().toISOString(),
        UserId: user,
        Details: JSON.stringify(details),
        ActionType: this.getActionType(action)
      };

      const response = await fetch(
        `${this.siteUrl}/_api/web/lists/getbytitle('AuditLog')/items`,
        {
          method: 'POST',
          headers: {
            'Accept': 'application/json; odata=verbose',
            'Content-Type': 'application/json; odata=verbose',
            'X-RequestDigest': this.requestDigest
          },
          body: JSON.stringify(logData)
        }
      );

      if (response.ok) {
        console.log('✅ Audit log entry created');
      }
      
    } catch (error) {
      console.warn('⚠️ Failed to create audit log:', error);
      // Don't throw - audit logging shouldn't break main functionality
    }
  }

  // GET audit log entries
  async getAuditLog(limit = 100) {
    try {
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
        details: JSON.parse(item.Details || '{}'),
        actionType: item.ActionType
      }));
      
    } catch (error) {
      console.error('❌ Error fetching audit log:', error);
      return [];
    }
  }

  // ===================================================================
  // USER MANAGEMENT
  // ===================================================================

  // GET current user info
  getCurrentUser() {
    if (typeof _spPageContextInfo !== 'undefined') {
      return {
        staffId: _spPageContextInfo.userId.toString(),
        displayName: _spPageContextInfo.userDisplayName,
        email: _spPageContextInfo.userEmail,
        loginName: _spPageContextInfo.userLoginName
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
  }

  // CHECK user role
  async getUserRole(staffId = null) {
    try {
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
      throw error;
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

  // Get action type for audit logging
  getActionType(action) {
    if (action.includes('CREATE') || action.includes('UPLOAD')) return 'CREATE';
    if (action.includes('UPDATE') || action.includes('EDIT')) return 'UPDATE';
    if (action.includes('DELETE')) return 'DELETE';
    if (action.includes('VIEW') || action.includes('ACCESS')) return 'VIEW';
    return 'OTHER';
  }

  // Check if SharePoint is available
  isSharePointAvailable() {
    return typeof _spPageContextInfo !== 'undefined' && this.siteUrl;
  }
}

export default SharePointService;