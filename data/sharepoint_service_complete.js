// services/SharePointService.js - Complete Enhanced Version with Amendment Support
class SharePointService {
  constructor() {
    this.baseUrl = 'https://teams.global.hsbc/sites/EmployeeEng';
    this.proceduresListUrl = `${this.baseUrl}/_api/web/lists/getbytitle('Procedures')/items`;
    this.requestDigest = this.getRequestDigest();
  }

  getRequestDigest() {
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

  getHeaders(includeDigest = false) {
    const headers = {
      'Accept': 'application/json; odata=verbose',
      'Content-Type': 'application/json; odata=verbose'
    };
    
    if (includeDigest && this.requestDigest) {
      headers['X-RequestDigest'] = this.requestDigest;
    }
    
    return headers;
  }

  // ===================================================================
  // ✅ NEW: AMENDMENT-SPECIFIC METHODS
  // ===================================================================

  /**
   * ✅ NEW: Amend existing procedure in SharePoint
   */
  async amendProcedureInSharePoint(amendmentData, newFile) {
    try {
      console.log('🔄 Processing procedure amendment in SharePoint...');
      console.log('Amendment data:', amendmentData);

      // Step 1: Upload new file if provided
      let newFileInfo = null;
      if (newFile) {
        const targetPath = `Procedures/${amendmentData.originalLOB}`;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `${amendmentData.originalName}_v${timestamp}_${newFile.name}`;
        
        newFileInfo = await this.uploadFileToSharePoint(newFile, targetPath, filename);
        console.log('✅ New file uploaded:', newFileInfo);
      }

      // Step 2: Get current procedure data for version history
      const currentProcedure = await this.getProcedureById(amendmentData.procedureId);
      if (!currentProcedure) {
        throw new Error(`Procedure with ID ${amendmentData.procedureId} not found`);
      }

      // Step 3: Create version history entry
      const versionHistory = this.createVersionHistoryEntry(currentProcedure, amendmentData);

      // Step 4: Prepare amendment update data
      const amendmentUpdateData = {
        // ✅ Amendment tracking fields
        AmendmentSummary: amendmentData.amendment_summary,
        AmendmentDate: amendmentData.amendment_date,
        AmendedBy: amendmentData.amended_by,
        AmendedByName: amendmentData.amended_by_name,
        LastModifiedBy: amendmentData.amended_by_name,
        PreviousScore: currentProcedure.QualityScore,
        AmendmentCount: (currentProcedure.AmendmentCount || 0) + 1,
        VersionHistory: versionHistory,

        // ✅ Updated content fields
        SecondaryOwner: amendmentData.secondary_owner || currentProcedure.SecondaryOwner,
        SecondaryOwnerEmail: amendmentData.secondary_owner_email || currentProcedure.SecondaryOwnerEmail,

        // ✅ New analysis data (if file was re-analyzed)
        QualityScore: amendmentData.new_score || currentProcedure.QualityScore,
        AnalysisDetails: amendmentData.new_analysis_details ? 
          JSON.stringify(amendmentData.new_analysis_details) : currentProcedure.AnalysisDetails,
        AIRecommendations: amendmentData.new_ai_recommendations ? 
          JSON.stringify(amendmentData.new_ai_recommendations) : currentProcedure.AIRecommendations,

        // ✅ File information (if new file uploaded)
        ...(newFileInfo && {
          DocumentLink: newFileInfo.serverRelativeUrl,
          SharePointURL: newFileInfo.webUrl,
          OriginalFilename: newFileInfo.filename,
          FileSize: newFileInfo.size
        }),

        // ✅ Extracted data from new analysis (if available)
        ...(amendmentData.new_analysis_details && {
          RiskRating: amendmentData.new_analysis_details.riskRating || currentProcedure.RiskRating,
          PeriodicReview: amendmentData.new_analysis_details.periodicReview || currentProcedure.PeriodicReview,
          DocumentOwners: amendmentData.new_analysis_details.owners?.join('; ') || currentProcedure.DocumentOwners,
          FoundElements: amendmentData.new_analysis_details.foundElements?.join('; ') || currentProcedure.FoundElements,
          MissingElements: amendmentData.new_analysis_details.missingElements?.join('; ') || currentProcedure.MissingElements,
          TemplateCompliance: amendmentData.new_analysis_details.summary?.templateCompliance || currentProcedure.TemplateCompliance
        })
      };

      // Step 5: Update the SharePoint list item
      const updateResult = await this.updateProcedureRecord(amendmentData.procedureId, amendmentUpdateData);

      // Step 6: Log amendment in audit trail
      await this.logAmendmentActivity({
        procedureId: amendmentData.procedureId,
        procedureName: amendmentData.originalName,
        amendedBy: amendmentData.amended_by_name,
        amendmentSummary: amendmentData.amendment_summary,
        previousScore: currentProcedure.QualityScore,
        newScore: amendmentData.new_score,
        newFileUploaded: !!newFile
      });

      const result = {
        success: true,
        procedureId: amendmentData.procedureId,
        message: 'Procedure amended successfully in SharePoint',
        amendmentId: `AMN_${Date.now()}`,
        newFileUrl: newFileInfo?.webUrl,
        amendmentTimestamp: amendmentData.amendment_date,
        versionNumber: (currentProcedure.AmendmentCount || 0) + 1
      };

      console.log('✅ Procedure amendment completed in SharePoint:', result);
      return result;

    } catch (error) {
      console.error('❌ SharePoint amendment failed:', error);
      return {
        success: false,
        message: `SharePoint amendment failed: ${error.message}`
      };
    }
  }

  /**
   * ✅ NEW: Get procedure by ID for amendment
   */
  async getProcedureById(procedureId) {
    try {
      console.log('📋 Getting procedure by ID:', procedureId);

      const response = await fetch(`${this.proceduresListUrl}(${procedureId})`, {
        method: 'GET',
        headers: this.getHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to get procedure: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Procedure data retrieved:', data.d.Title);
      
      return data.d;

    } catch (error) {
      console.error('❌ Failed to get procedure by ID:', error);
      throw error;
    }
  }

  /**
   * ✅ NEW: Create version history entry
   */
  createVersionHistoryEntry(currentProcedure, amendmentData) {
    const newEntry = {
      version: (currentProcedure.AmendmentCount || 0) + 1,
      amendmentDate: amendmentData.amendment_date,
      amendedBy: amendmentData.amended_by_name,
      summary: amendmentData.amendment_summary,
      previousScore: currentProcedure.QualityScore,
      newScore: amendmentData.new_score,
      changes: {
        secondaryOwner: {
          from: currentProcedure.SecondaryOwner || '',
          to: amendmentData.secondary_owner || ''
        },
        secondaryOwnerEmail: {
          from: currentProcedure.SecondaryOwnerEmail || '',
          to: amendmentData.secondary_owner_email || ''
        },
        fileUpdated: !!amendmentData.original_filename
      }
    };

    // Get existing version history
    let versionHistory = [];
    if (currentProcedure.VersionHistory) {
      try {
        versionHistory = JSON.parse(currentProcedure.VersionHistory);
      } catch (e) {
        console.warn('⚠️ Could not parse existing version history');
      }
    }

    // Add new entry
    versionHistory.push(newEntry);

    // Keep only last 10 versions to prevent field size issues
    if (versionHistory.length > 10) {
      versionHistory = versionHistory.slice(-10);
    }

    return JSON.stringify(versionHistory);
  }

  /**
   * ✅ NEW: Log amendment activity for audit trail
   */
  async logAmendmentActivity(activityData) {
    try {
      console.log('📝 Logging amendment activity...');

      const auditLogUrl = `${this.baseUrl}/_api/web/lists/getbytitle('AuditLog')/items`;
      
      const logEntry = {
        __metadata: { type: 'SP.Data.AuditLogListItem' },
        Title: 'PROCEDURE_AMENDED',
        ActionType: 'AMENDMENT',
        TargetItemId: activityData.procedureId.toString(),
        TargetItemTitle: activityData.procedureName,
        PerformedBy: activityData.amendedBy,
        LogTimestamp: new Date().toISOString(),
        Details: JSON.stringify({
          amendmentSummary: activityData.amendmentSummary,
          previousScore: activityData.previousScore,
          newScore: activityData.newScore,
          scoreChange: activityData.newScore - activityData.previousScore,
          newFileUploaded: activityData.newFileUploaded,
          timestamp: new Date().toISOString()
        }),
        Category: 'Procedure Management',
        Severity: 'Info'
      };

      const response = await fetch(auditLogUrl, {
        method: 'POST',
        headers: this.getHeaders(true),
        credentials: 'include',
        body: JSON.stringify(logEntry)
      });

      if (response.ok) {
        console.log('✅ Amendment activity logged successfully');
      } else {
        console.warn('⚠️ Failed to log amendment activity:', response.status);
      }

    } catch (error) {
      console.error('❌ Error logging amendment activity:', error);
      // Don't throw - this is non-critical
    }
  }

  // ===================================================================
  // ✅ ENHANCED: MAPPING WITH AMENDMENT FIELDS
  // ===================================================================

  /**
   * ✅ ENHANCED: Map SharePoint item to model with amendment fields
   */
  mapSharePointToModel(spItem) {
    return {
      // Basic procedure information
      id: spItem.Id,
      name: spItem.Title,
      expiry: spItem.ExpiryDate,
      primary_owner: spItem.PrimaryOwner,
      primary_owner_email: spItem.PrimaryOwnerEmail,
      secondary_owner: spItem.SecondaryOwner || '',
      secondary_owner_email: spItem.SecondaryOwnerEmail || '',
      lob: spItem.LOB,
      procedure_subsection: spItem.ProcedureSubsection || '',
      
      // Quality and analysis data
      score: spItem.QualityScore || 0,
      quality_details: this.safeJsonParse(spItem.AnalysisDetails, {}),
      ai_recommendations: this.safeJsonParse(spItem.AIRecommendations, []),
      
      // File and document information
      file_link: spItem.DocumentLink || '',
      original_filename: spItem.OriginalFilename || '',
      file_size: spItem.FileSize || 0,
      sharepoint_uploaded: spItem.SharePointUploaded || false,
      sharepoint_url: spItem.SharePointURL || '',
      
      // Dates and metadata
      uploaded_by: spItem.UploadedBy,
      uploaded_on: spItem.UploadedAt || spItem.Created,
      status: spItem.Status || 'Active',
      
      // ✅ NEW: Amendment-specific fields
      amendment_summary: spItem.AmendmentSummary || '',
      amendment_date: spItem.AmendmentDate || null,
      amended_by: spItem.AmendedBy || '',
      amended_by_name: spItem.AmendedByName || '',
      last_modified_by: spItem.LastModifiedBy || '',
      last_modified_on: spItem.Modified || spItem.Created,
      previous_score: spItem.PreviousScore || null,
      amendment_count: spItem.AmendmentCount || 0,
      version_history: this.safeJsonParse(spItem.VersionHistory, []),
      
      // Enhanced extracted data
      risk_rating: spItem.RiskRating || 'Medium',
      periodic_review: spItem.PeriodicReview || 'Annual',
      document_owners: spItem.DocumentOwners || '',
      sign_off_dates: spItem.SignOffDates || '',
      departments: spItem.Departments || '',
      found_elements: spItem.FoundElements || '',
      missing_elements: spItem.MissingElements || '',
      template_compliance: spItem.TemplateCompliance || 'Unknown',
      
      // Quality flags
      has_document_control: spItem.HasDocumentControl || false,
      has_risk_assessment: spItem.HasRiskAssessment || false,
      has_periodic_review: spItem.HasPeriodicReview || false,
      has_owners: spItem.HasOwners || false
    };
  }

  // ===================================================================
  // EXISTING METHODS (keeping your current functionality)
  // ===================================================================

  /**
   * Upload file to SharePoint document library
   */
  async uploadFileToSharePoint(file, targetPath, filename) {
    try {
      console.log('📤 Uploading file to SharePoint...');
      console.log('Target path:', targetPath);
      console.log('Filename:', filename);

      // Ensure folder exists first
      await this.ensureFolderExists(targetPath);

      // Upload file
      const uploadUrl = `${this.baseUrl}/_api/web/GetFolderByServerRelativeUrl('/sites/EmployeeEng/${targetPath}')/Files/add(url='${filename}',overwrite=true)`;
      
      const fileBuffer = await this.fileToArrayBuffer(file);
      
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json; odata=verbose',
          'X-RequestDigest': this.requestDigest
        },
        credentials: 'include',
        body: fileBuffer
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`File upload failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      const fileInfo = {
        serverRelativeUrl: result.d.ServerRelativeUrl,
        webUrl: `${this.baseUrl}${result.d.ServerRelativeUrl}`,
        filename: filename,
        size: file.size
      };

      console.log('✅ File uploaded successfully:', fileInfo);
      return fileInfo;

    } catch (error) {
      console.error('❌ File upload failed:', error);
      throw error;
    }
  }

  /**
   * Create procedure record in SharePoint Procedures list
   */
  async createProcedureRecord(procedureData, analysisData, fileInfo) {
    try {
      console.log('📝 Creating procedure record in SharePoint list...');

      const listItemData = {
        __metadata: { type: 'SP.Data.ProceduresListItem' },
        
        // Basic procedure information
        Title: procedureData.name,
        PrimaryOwner: procedureData.primary_owner,
        PrimaryOwnerEmail: procedureData.primary_owner_email,
        SecondaryOwner: procedureData.secondary_owner || '',
        SecondaryOwnerEmail: procedureData.secondary_owner_email || '',
        LOB: procedureData.lob,
        ProcedureSubsection: procedureData.procedure_subsection,
        ExpiryDate: procedureData.expiry,
        
        // AI Analysis results
        QualityScore: analysisData.score,
        AnalysisDetails: JSON.stringify(analysisData.details),
        AIRecommendations: JSON.stringify(analysisData.aiRecommendations),
        
        // Extracted data from AI analysis
        RiskRating: analysisData.details.riskRating || 'Medium',
        PeriodicReview: analysisData.details.periodicReview || 'Annual',
        DocumentOwners: analysisData.details.owners?.join('; ') || '',
        SignOffDates: analysisData.details.signOffDates?.join('; ') || '',
        Departments: analysisData.details.departments?.join('; ') || '',
        
        // File information
        DocumentLink: fileInfo.serverRelativeUrl,
        SharePointURL: fileInfo.webUrl,
        OriginalFilename: fileInfo.filename,
        FileSize: fileInfo.size,
        
        // Metadata
        UploadedBy: procedureData.uploaded_by || 'System',
        UploadedAt: new Date().toISOString(),
        Status: 'Active',
        SharePointUploaded: true,
        
        // ✅ NEW: Initialize amendment fields
        AmendmentCount: 0,
        VersionHistory: JSON.stringify([{
          version: 1,
          createdDate: new Date().toISOString(),
          createdBy: procedureData.uploaded_by || 'System',
          summary: 'Initial upload',
          score: analysisData.score
        }]),
        
        // Quality flags
        HasDocumentControl: analysisData.details.hasDocumentControl,
        HasRiskAssessment: analysisData.details.hasRiskAssessment,
        HasPeriodicReview: analysisData.details.hasPeriodicReview,
        HasOwners: analysisData.details.hasOwners,
        
        // Analysis summary
        FoundElements: analysisData.details.foundElements?.join('; ') || '',
        MissingElements: analysisData.details.missingElements?.join('; ') || '',
        TemplateCompliance: analysisData.details.summary?.templateCompliance || 'Unknown'
      };

      console.log('📋 List item data prepared:', {
        Title: listItemData.Title,
        QualityScore: listItemData.QualityScore,
        DocumentLink: listItemData.DocumentLink,
        RiskRating: listItemData.RiskRating
      });

      const response = await fetch(this.proceduresListUrl, {
        method: 'POST',
        headers: this.getHeaders(true),
        credentials: 'include',
        body: JSON.stringify(listItemData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`List item creation failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      const procedureRecord = {
        id: result.d.Id,
        name: result.d.Title,
        score: result.d.QualityScore,
        documentLink: result.d.DocumentLink,
        sharePointUrl: result.d.SharePointURL,
        created: result.d.Created,
        listItemId: result.d.Id
      };

      console.log('✅ Procedure record created successfully:', procedureRecord);
      return procedureRecord;

    } catch (error) {
      console.error('❌ Failed to create procedure record:', error);
      throw error;
    }
  }

  /**
   * Update procedure record in SharePoint list
   */
  async updateProcedureRecord(procedureId, updates) {
    try {
      console.log('📝 Updating procedure record:', procedureId);

      const updateUrl = `${this.proceduresListUrl}(${procedureId})`;
      const updateData = {
        __metadata: { type: 'SP.Data.ProceduresListItem' },
        ...updates
      };

      const response = await fetch(updateUrl, {
        method: 'POST',
        headers: {
          ...this.getHeaders(true),
          'X-HTTP-Method': 'MERGE',
          'IF-MATCH': '*'
        },
        credentials: 'include',
        body: JSON.stringify(updateData)
      });

      if (!response.ok && response.status !== 204) {
        const errorText = await response.text();
        throw new Error(`Update failed: ${response.status} - ${errorText}`);
      }

      console.log('✅ Procedure record updated successfully');
      return true;

    } catch (error) {
      console.error('❌ Failed to update procedure record:', error);
      throw error;
    }
  }

  // ===================================================================
  // UTILITY METHODS
  // ===================================================================
// services/SharePointService.js - Fix ensureFolderExists method

async ensureFolderExists(targetPath) {
  try {
    const checkUrl = `${this.baseUrl}/_api/web/GetFolderByServerRelativeUrl('/sites/EmployeeEng/${targetPath}')`;
    
    console.log('📁 Checking if folder exists:', targetPath);
    
    const checkResponse = await fetch(checkUrl, {
      method: 'GET',
      headers: this.getHeaders(),
      credentials: 'include'
    });

    if (checkResponse.ok) {
      console.log('✅ Folder already exists:', targetPath);
      return true; // ✅ Folder exists, no need to create
    }
    
    if (checkResponse.status === 404) {
      console.log('📁 Folder does not exist, creating:', targetPath);
      
      // ✅ CREATE FOLDER HIERARCHY STEP BY STEP
      const pathParts = targetPath.split('/').filter(part => part.length > 0);
      let currentPath = '';
      
      for (const part of pathParts) {
        currentPath += `/${part}`;
        await this.createSingleFolderSafe(currentPath);
      }
      
      return true;
    } else {
      console.warn('⚠️ Unexpected response checking folder:', checkResponse.status);
      return false;
    }

  } catch (error) {
    console.error('❌ Error ensuring folder exists:', error);
    return false;
  }
}

async createSingleFolderSafe(folderPath) {
  try {
    // ✅ CHECK IF THIS SPECIFIC FOLDER EXISTS FIRST
    const checkUrl = `${this.baseUrl}/_api/web/GetFolderByServerRelativeUrl('/sites/EmployeeEng${folderPath}')`;
    
    const checkResponse = await fetch(checkUrl, {
      method: 'GET',
      headers: this.getHeaders(),
      credentials: 'include'
    });
    
    if (checkResponse.ok) {
      console.log('✅ Folder already exists, skipping creation:', folderPath);
      return true;
    }
    
    // ✅ ONLY CREATE IF IT DOESN'T EXIST
    if (checkResponse.status === 404) {
      console.log('📁 Creating folder:', folderPath);
      
      const createUrl = `${this.baseUrl}/_api/web/folders/add('/sites/EmployeeEng${folderPath}')`;
      
      const response = await fetch(createUrl, {
        method: 'POST',
        headers: this.getHeaders(true),
        credentials: 'include'
      });

      if (response.ok) {
        console.log('✅ Folder created successfully:', folderPath);
        return true;
      } else if (response.status === 409) {
        console.log('✅ Folder already exists (409 conflict):', folderPath);
        return true; // ✅ Folder exists, that's fine
      } else {
        console.warn('⚠️ Folder creation failed but continuing:', response.status);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.warn('⚠️ Folder creation error (non-critical):', error.message);
    return false; // ✅ Don't fail the whole process for folder issues
  }
}

  async fileToArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
  }

  safeJsonParse(jsonString, defaultValue) {
    try {
      return jsonString ? JSON.parse(jsonString) : defaultValue;
    } catch (error) {
      console.warn('⚠️ JSON parse error:', error);
      return defaultValue;
    }
  }
}

export default SharePointService;
