// services/SharePointService.js - Enhanced with List Management
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
   * Ensure SharePoint folder exists
   */
  async ensureFolderExists(targetPath) {
    try {
      // Check if folder exists
      const checkUrl = `${this.baseUrl}/_api/web/GetFolderByServerRelativeUrl('/sites/EmployeeEng/${targetPath}')`;
      
      const checkResponse = await fetch(checkUrl, {
        method: 'GET',
        headers: this.getHeaders(),
        credentials: 'include'
      });

      if (checkResponse.ok) {
        console.log('✅ Folder exists:', targetPath);
        return;
      }

      // Create folder if it doesn't exist
      console.log('📁 Creating folder:', targetPath);
      
      const pathParts = targetPath.split('/');
      let currentPath = '';
      
      for (const part of pathParts) {
        if (part) {
          currentPath += `/${part}`;
          await this.createSingleFolder(currentPath);
        }
      }

    } catch (error) {
      console.error('❌ Error ensuring folder exists:', error);
      // Don't throw here - let the upload attempt anyway
    }
  }

  async createSingleFolder(folderPath) {
    try {
      const createUrl = `${this.baseUrl}/_api/web/folders/add('/sites/EmployeeEng${folderPath}')`;
      
      const response = await fetch(createUrl, {
        method: 'POST',
        headers: this.getHeaders(true),
        credentials: 'include'
      });

      if (response.ok) {
        console.log('✅ Folder created:', folderPath);
      }
    } catch (error) {
      // Folder might already exist, ignore error
      console.log('⚠️ Folder creation skipped:', folderPath);
    }
  }

  /**
   * Convert file to ArrayBuffer for SharePoint upload
   */
  async fileToArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
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
}

export default SharePointService;
