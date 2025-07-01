// services/DocumentAnalyzer.js - Enhanced with AI and SharePoint integration + SiteAssets Support
import { sharePointPaths } from './paths';
import SharePointService  from './SharePointService';

class DocumentAnalyzer {
  constructor() {
    this.minimumScore = 85;
    
    // LOB subsection configuration for UI
    this.lobSubsections = {
      'IWPB': [
        { value: 'Risk_Management', label: 'Risk Management' },
        { value: 'Compliance', label: 'Compliance & Regulatory' },
        { value: 'Operational', label: 'Operational Procedures' },
        { value: 'Financial', label: 'Financial Controls' },
        { value: 'Technology', label: 'Technology & Security' }
      ],
      'CIB': [
        { value: 'Trading_Operations', label: 'Trading Operations' },
        { value: 'Sales_Procedures', label: 'Sales Procedures' },
        { value: 'Research_Analysis', label: 'Research & Analysis' },
        { value: 'Credit_Management', label: 'Credit Management' }
      ],
      'GCOO': [
        { value: 'Operations', label: 'Operations' },
        { value: 'Technology', label: 'Technology' },
        { value: 'Change_Management', label: 'Change Management' },
        { value: 'Project_Management', label: 'Project Management' }
      ]
    };
  }

  // ============================================================================
  // UI HELPER METHODS
  // ============================================================================

  getSubsections(lob) {
    return this.lobSubsections[lob] || [];
  }

  validateFile(file) {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Please select a PDF or Word document (.pdf, .docx, .doc)');
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new Error('File size must be less than 10MB');
    }

    return true;
  }

  // ============================================================================
  // ✅ AMENDMENT SUPPORT METHODS WITH SITEASSETS
  // ============================================================================

  // ✅ SMART FOLDER DETECTION - Parse existing document URL with SiteAssets
  parseExistingDocumentPath(documentLink) {
    try {
      if (!documentLink) {
        console.warn('⚠️ No document link provided, using default SiteAssets structure');
        return {
          baseUrl: sharePointPaths.baseSite || 'https://teams.global.hsbc/sites/employeeeng',
          lobFolder: 'IWPB',
          subFolder: 'General',
          fullFolderPath: '/sites/employeeeng/SiteAssets/IWPB/General',
          sharePointPath: 'SiteAssets/IWPB/General'
        };
      }

      console.log('🔍 Analyzing existing document URL:', documentLink);

      // Parse the URL to extract folder structure
      const url = new URL(documentLink);
      const pathname = url.pathname;

      // ✅ CORRECT PATTERN: /sites/employeeeng/SiteAssets/IWPB/Risk_Management/document.docx
      const pathParts = pathname.split('/').filter(part => part.length > 0);
      
      console.log('📂 URL path parts:', pathParts);

      // Find the base site structure
      const siteIndex = pathParts.findIndex(part => part === 'sites');
      const employeeEngIndex = pathParts.findIndex(part => part.toLowerCase() === 'employeeeng');
      const siteAssetsIndex = pathParts.findIndex(part => part.toLowerCase() === 'siteassets');
      
      if (siteIndex === -1 || employeeEngIndex === -1 || siteAssetsIndex === -1) {
        throw new Error('Invalid SharePoint URL structure - missing SiteAssets');
      }

      // Extract folder structure
      const baseUrl = `${url.protocol}//${url.host}`;
      
      // ✅ CORRECT: The folder after /sites/employeeeng/SiteAssets/ should be the LOB folder
      const lobFolderIndex = siteAssetsIndex + 1;
      const lobFolder = pathParts[lobFolderIndex] || 'IWPB';
      
      // ✅ CORRECT: The folder after LOB should be the actual subfolder (not "General")
      const subFolderIndex = lobFolderIndex + 1;
      const subFolder = pathParts[subFolderIndex] || 'General';
      
      // ✅ CORRECT: Reconstruct paths with SiteAssets
      const folderPathParts = pathParts.slice(siteIndex, subFolderIndex + 1);
      const fullFolderPath = `/${folderPathParts.join('/')}`;
      
      // ✅ CORRECT: SharePoint API path (SiteAssets/LOB/actual_subfolder)
      const sharePointPath = `SiteAssets/${lobFolder}/${subFolder}`;

      const result = {
        baseUrl,
        lobFolder,
        subFolder, // ✅ This will be "Risk_Management", not "General"
        fullFolderPath,
        sharePointPath,
        originalUrl: documentLink
      };

      console.log('✅ Parsed SiteAssets folder structure:', result);
      return result;

    } catch (error) {
      console.error('❌ Error parsing document URL:', error);
      
      // ✅ CORRECT FALLBACK: Default SiteAssets structure
      const fallback = {
        baseUrl: sharePointPaths.baseSite || 'https://teams.global.hsbc/sites/employeeeng',
        lobFolder: 'IWPB',
        subFolder: 'General',
        fullFolderPath: '/sites/employeeeng/SiteAssets/IWPB/General',
        sharePointPath: 'SiteAssets/IWPB/General',
        error: error.message
      };
      
      console.log('🔄 Using fallback SiteAssets structure:', fallback);
      return fallback;
    }
  }

  // ✅ ENHANCED: Complete amendment tracking with history
async amendProcedureInSharePoint(amendmentData, file) {
  const sharePointUrl = 'https://teams.global.hsbc/sites/EmployeeEng';
  
  try {
    console.log('🔄 Starting enhanced SharePoint amendment with full tracking...');
    console.log('📂 Amendment data received:', amendmentData);

    // ✅ Validate folder paths
    const targetFolderPath = amendmentData.fullFolderPath;
    const sharePointPath = amendmentData.sharePointPath;
    
    if (!targetFolderPath || targetFolderPath === 'undefined') {
      throw new Error(`Invalid target folder path: ${targetFolderPath}`);
    }

    console.log('✅ Using HSBC URLs with amendment tracking:');
    console.log(`📁 Target Path: ${targetFolderPath}`);
    console.log(`📊 Previous Score: ${amendmentData.previous_score || 'N/A'}`);
    console.log(`📊 New Score: ${amendmentData.new_score}`);

    // ✅ STEP 1: Get current procedure data to build amendment history
    const currentDataUrl = `${sharePointUrl}/_api/web/lists/getbytitle('Procedures')/items(${amendmentData.procedureId})?$select=QualityScore,AmendmentHistory,AmendmentCount,PreviousScore,AmendmentTimeline`;
    
    const currentDataResponse = await fetch(currentDataUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json; odata=verbose'
      }
    });

    let currentProcedure = null;
    if (currentDataResponse.ok) {
      const currentData = await currentDataResponse.json();
      currentProcedure = currentData.d;
      console.log('✅ Retrieved current procedure data:', currentProcedure);
    }

    // ✅ STEP 2: Get request digest
    const digestUrl = `${sharePointUrl}/_api/contextinfo`;
    const digestResponse = await fetch(digestUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json; odata=verbose',
        'Content-Type': 'application/json; odata=verbose'
      }
    });

    if (!digestResponse.ok) {
      throw new Error(`Failed to get request digest: ${digestResponse.status}`);
    }

    const digestData = await digestResponse.json();
    const requestDigest = digestData.d.GetContextWebInformation.FormDigestValue;

    // ✅ STEP 3: Upload file
    const uploadUrl = `${sharePointUrl}/_api/web/GetFolderByServerRelativeUrl('${targetFolderPath}')/Files/Add(url='${encodeURIComponent(file.name)}', overwrite=true)`;
    console.log(`📤 Uploading to: ${uploadUrl}`);

    const formData = await file.arrayBuffer();
    
    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json; odata=verbose',
        'X-RequestDigest': requestDigest,
        'Content-Length': formData.byteLength
      },
      body: formData
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`File upload failed: ${uploadResponse.status} - ${errorText}`);
    }

    const uploadResult = await uploadResponse.json();
    console.log('✅ File uploaded successfully');

    // ✅ STEP 4: Build comprehensive amendment history
    const currentScore = currentProcedure?.QualityScore || amendmentData.original_score || 0;
    const newScore = amendmentData.new_score;
    const currentAmendmentCount = currentProcedure?.AmendmentCount || 0;
    const newAmendmentCount = currentAmendmentCount + 1;

    // Parse existing amendment history
    let amendmentHistory = [];
    try {
      if (currentProcedure?.AmendmentHistory) {
        amendmentHistory = JSON.parse(currentProcedure.AmendmentHistory);
      }
    } catch (parseError) {
      console.warn('⚠️ Could not parse existing amendment history, starting fresh');
      amendmentHistory = [];
    }

    // Create new amendment record
    const newAmendment = {
      amendmentNumber: newAmendmentCount,
      date: new Date().toISOString(),
      amendedBy: amendmentData.amended_by_name,
      amendedByStaffId: amendmentData.amended_by,
      amendedByRole: amendmentData.amended_by_role,
      summary: amendmentData.amendment_summary,
      previousScore: currentScore,
      newScore: newScore,
      scoreChange: newScore - currentScore,
      fileName: file.name,
      fileSize: file.size,
      targetFolder: sharePointPath,
      actualSubFolder: amendmentData.subFolder,
      documentUrl: `${sharePointUrl}${uploadResult.d.ServerRelativeUrl}`,
      analysisDetails: amendmentData.new_analysis_details,
      aiRecommendations: amendmentData.new_ai_recommendations
    };

    // Add to history
    amendmentHistory.push(newAmendment);

    // Build human-readable timeline
    let amendmentTimeline = [];
    try {
      if (currentProcedure?.AmendmentTimeline) {
        amendmentTimeline = JSON.parse(currentProcedure.AmendmentTimeline);
      }
    } catch (parseError) {
      amendmentTimeline = [];
    }

    const timelineEntry = `Amendment #${newAmendmentCount} - ${new Date().toLocaleDateString()} by ${amendmentData.amended_by_name}: ${amendmentData.amendment_summary} (Score: ${currentScore}% → ${newScore}%)`;
    amendmentTimeline.push(timelineEntry);

    console.log('📋 Built amendment tracking data:');
    console.log(`   Amendment #: ${newAmendmentCount}`);
    console.log(`   Previous Score: ${currentScore}%`);
    console.log(`   New Score: ${newScore}%`);
    console.log(`   Score Change: ${newScore - currentScore > 0 ? '+' : ''}${newScore - currentScore}%`);

    // ✅ STEP 5: Update procedure with comprehensive amendment tracking
    const listUpdateUrl = `${sharePointUrl}/_api/web/lists/getbytitle('Procedures')/items(${amendmentData.procedureId})`;
    
    const updateData = {
      __metadata: { type: 'SP.Data.ProceduresListItem' },
      
      // ✅ CORE AMENDMENT TRACKING
      QualityScore: newScore, // Current score
      PreviousScore: currentScore, // Score before this amendment
      AmendmentCount: newAmendmentCount, // Total amendments
      LatestAmendmentSummary: amendmentData.amendment_summary, // Latest summary
      AmendmentHistory: JSON.stringify(amendmentHistory), // Complete history
      AmendmentTimeline: JSON.stringify(amendmentTimeline), // Human-readable timeline
      
      // ✅ LATEST AMENDMENT INFO
      LastAmendedBy: amendmentData.amended_by_name,
      LastAmendmentDate: new Date().toISOString(),
      LastAmendedByStaffId: amendmentData.amended_by,
      LastAmendedByRole: amendmentData.amended_by_role,
      
      // Update secondary owner if provided
      SecondaryOwner: amendmentData.secondary_owner || '',
      SecondaryOwnerEmail: amendmentData.secondary_owner_email || '',
      
      // Update analysis data with new analysis
      AnalysisDetails: JSON.stringify(amendmentData.new_analysis_details),
      AIRecommendations: JSON.stringify(amendmentData.new_ai_recommendations),
      
      // Updated document info
      DocumentLink: uploadResult.d.ServerRelativeUrl,
      SharePointURL: `${sharePointUrl}${uploadResult.d.ServerRelativeUrl}`,
      OriginalFilename: file.name,
      FileSize: file.size,
      SharePointUploaded: true,
      SiteAssetsPath: sharePointPath,
      ActualSubFolder: amendmentData.subFolder,
      
      // ✅ AMENDMENT METADATA
      LastModifiedOn: new Date().toISOString(),
      LastModifiedBy: amendmentData.amended_by_name
    };

    console.log('📝 Updating procedure with comprehensive amendment tracking...');

    const updateResponse = await fetch(listUpdateUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json; odata=verbose',
        'Content-Type': 'application/json; odata=verbose',
        'X-RequestDigest': requestDigest,
        'X-HTTP-Method': 'MERGE',
        'If-Match': '*'
      },
      body: JSON.stringify(updateData)
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      throw new Error(`List update failed: ${updateResponse.status} - ${errorText}`);
    }

    console.log('✅ Procedure updated with comprehensive amendment tracking');

    // ✅ STEP 6: Enhanced audit log
    const auditUrl = `${sharePointUrl}/_api/web/lists/getbytitle('AuditLog')/items`;
    
    const auditData = {
      __metadata: { type: 'SP.Data.AuditLogListItem' },
      Title: `Procedure Amendment #${newAmendmentCount}`,
      UserId: amendmentData.amended_by,
      ActionType: 'AMEND',
      LogTimestamp: new Date().toISOString(),
      Details: JSON.stringify({
        procedureId: amendmentData.procedureId,
        procedureName: amendmentData.originalName,
        amendmentNumber: newAmendmentCount,
        amendmentSummary: amendmentData.amendment_summary,
        previousScore: currentScore,
        newScore: newScore,
        scoreChange: newScore - currentScore,
        targetFolder: sharePointPath,
        actualSubFolder: amendmentData.subFolder,
        uploadPath: targetFolderPath,
        fileName: file.name,
        amendedBy: amendmentData.amended_by_name,
        totalAmendments: newAmendmentCount
      })
    };

    await fetch(auditUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json; odata=verbose',
        'Content-Type': 'application/json; odata=verbose',
        'X-RequestDigest': requestDigest
      },
      body: JSON.stringify(auditData)
    });

    console.log('✅ Enhanced audit log entry created');
    console.log('✅ Amendment completed with comprehensive tracking');

    return {
      success: true,
      message: 'Procedure amended successfully with full tracking',
      amendmentNumber: newAmendmentCount,
      previousScore: currentScore,
      newScore: newScore,
      scoreChange: newScore - currentScore,
      uploadedTo: targetFolderPath,
      sharePointPath: sharePointPath,
      actualSubFolder: amendmentData.subFolder,
      documentUrl: `${sharePointUrl}${uploadResult.d.ServerRelativeUrl}`,
      amendmentHistory: amendmentHistory,
      timelineEntry: timelineEntry
    };

  } catch (error) {
    console.error('❌ Enhanced amendment failed:', error);
    return {
      success: false,
      message: error.message || 'Amendment failed',
      error: error,
      attempted_url: sharePointUrl
    };
  }
}
  // ✅ UPLOAD AMENDMENT WITH ANALYSIS - Uses existing SiteAssets folder path
  async uploadAmendmentWithAnalysis(amendmentData, file) {
    try {
      console.log('🚀 Starting amendment upload with AI analysis...');
      
      // 1. Analyze the new document
      const analysisResult = await this.analyzeDocument(file, {
        name: amendmentData.originalName,
        lob: amendmentData.originalLOB,
        subsection: amendmentData.subFolder
      });
      
      if (!analysisResult.accepted) {
        throw new Error(`Document quality score is ${analysisResult.score}% (minimum ${this.minimumScore}% required)`);
      }

      console.log('✅ Amendment document passed AI analysis:', {
        score: analysisResult.score,
        templateCompliance: analysisResult.details?.summary?.templateCompliance
      });

      // 2. Get SharePoint context
      const requestDigest = await this.getRequestDigest();
      
      // 3. ✅ CORRECT: USE EXISTING SITEASSETS FOLDER PATH
      const sharePointPath = amendmentData.sharePointPath; // Already includes SiteAssets/LOB/actual_subfolder
      console.log('📂 Using existing SiteAssets SharePoint path:', sharePointPath);
      
      // 4. Upload amendment file to existing SiteAssets folder
      const fileUploadResult = await this.uploadFileToSharePoint(file, sharePointPath, requestDigest);
      
      // 5. Create amended procedure list item
      const amendedProcedureData = {
        __metadata: { type: 'SP.Data.ProceduresListItem' },
        Title: amendmentData.originalName,
        ExpiryDate: new Date().toISOString(),
        PrimaryOwner: amendmentData.originalPrimaryOwner,
        PrimaryOwnerEmail: amendmentData.originalPrimaryOwnerEmail,
        SecondaryOwner: amendmentData.secondary_owner || '',
        SecondaryOwnerEmail: amendmentData.secondary_owner_email || '',
        LOB: amendmentData.originalLOB || 'Unknown',
        ProcedureSubsection: amendmentData.subFolder || '', // ✅ Real subfolder name
        SharePointPath: sharePointPath || '',
        DocumentLink: (fileUploadResult && fileUploadResult.serverRelativeUrl) || '',
        OriginalFilename: (file && file.name) || 'unknown.doc',
        FileSize: (file && file.size) || 0,
        
        // ✅ AI ANALYSIS RESULTS
        QualityScore: (analysisResult && analysisResult.score) || 0,
        TemplateCompliance: (analysisResult && analysisResult.details && analysisResult.details.summary && analysisResult.details.summary.templateCompliance) || 'Unknown',
        AnalysisDetails: JSON.stringify((analysisResult && analysisResult.details) || {}),
        AIRecommendations: JSON.stringify((analysisResult && analysisResult.aiRecommendations) || []),
        
        // ✅ HSBC-SPECIFIC DATA
        RiskRating: (analysisResult && analysisResult.details && analysisResult.details.riskRating) || 'Not Specified',
        PeriodicReview: (analysisResult && analysisResult.details && analysisResult.details.periodicReview) || 'Not Specified',
        DocumentOwners: JSON.stringify((analysisResult && analysisResult.details && analysisResult.details.owners) || []),
        SignOffDates: JSON.stringify((analysisResult && analysisResult.details && analysisResult.details.signOffDates) || []),
        Departments: JSON.stringify((analysisResult && analysisResult.details && analysisResult.details.departments) || []),
        
        // ✅ AMENDMENT METADATA
        IsAmendment: true,
        AmendmentOfProcedureId: amendmentData.procedureId,
        AmendmentSummary: amendmentData.amendment_summary,
        AmendmentDate: amendmentData.amendment_date,
        AmendedBy: amendmentData.amended_by_name,
        AmendedByUserId: amendmentData.amended_by,
        
        // Upload metadata
        UploadedBy: amendmentData.amended_by_name || 'Unknown',
        UploadedAt: new Date().toISOString(),
        Status: 'Active',
        SharePointUploaded: true
      };
     
      const procedureResult = await this.createProcedureListItem(amendedProcedureData, requestDigest);
      
      // 6. ✅ UPDATE ORIGINAL PROCEDURE RECORD
      await this.updateOriginalProcedureRecord(amendmentData.procedureId, {
        status: 'Amended',
        amended_date: amendmentData.amendment_date,
        amended_by: amendmentData.amended_by_name,
        new_version_id: procedureResult.Id,
        amendment_summary: amendmentData.amendment_summary
      }, requestDigest);
     
      // 7. Create audit log entry for amendment
      await this.createAuditLogEntry({
        __metadata: { type: 'SP.Data.AuditLogListItem' },
        Title: `Procedure Amended: ${amendmentData.originalName}`,
        ActionType: 'AMEND',
        UserId: amendmentData.amended_by,
        LogTimestamp: new Date().toISOString(),
        Details: JSON.stringify({
          originalProcedureId: amendmentData.procedureId,
          newProcedureId: procedureResult.Id,
          procedureName: amendmentData.originalName,
          lob: amendmentData.originalLOB,
          subfolder: amendmentData.subFolder, // ✅ Real subfolder
          amendmentSummary: amendmentData.amendment_summary,
          qualityScore: analysisResult.score,
          templateCompliance: analysisResult.details?.summary?.templateCompliance,
          sharePointPath: sharePointPath,
          fileSize: file.size,
          fileName: file.name
        }),
        ProcedureId: procedureResult.Id,
        LOB: amendmentData.originalLOB
      }, requestDigest);

      // ✅ CORRECT: SharePoint URL with SiteAssets
      const sharePointUrl = `${sharePointPaths.baseSite}/${sharePointPath}/${file.name}`;
     
      console.log('🎉 Amendment upload completed successfully:', {
        newProcedureId: procedureResult.Id,
        originalProcedureId: amendmentData.procedureId,
        qualityScore: analysisResult.score,
        sharePointUrl,
        sharePointPath,
        actualSubfolder: amendmentData.subFolder
      });

      return {
        success: true,
        procedureId: procedureResult.Id,
        qualityScore: analysisResult.score,
        templateCompliance: analysisResult.details?.summary?.templateCompliance,
        sharePointPath: sharePointPath,
        sharePointUrl: sharePointUrl,
        analysisResult: analysisResult,
        message: `Amendment uploaded successfully to SiteAssets/${amendmentData.lobFolder}/${amendmentData.subFolder}`
      };
     
    } catch (error) {
      console.error('❌ Upload amendment failed:', error);
      throw new Error(`Amendment upload failed: ${error.message}`);
    }
  }

  // ✅ UPDATE ORIGINAL PROCEDURE RECORD - Mark as amended
  async updateOriginalProcedureRecord(originalProcedureId, updateData, requestDigest) {
    try {
      console.log('🔄 Updating original procedure record:', originalProcedureId);
      
      const updatePayload = {
        Status: updateData.status,
        AmendedDate: updateData.amended_date,
        AmendedBy: updateData.amended_by,
        NewVersionId: updateData.new_version_id,
        AmendmentSummary: updateData.amendment_summary,
        LastModifiedOn: new Date().toISOString(),
        LastModifiedBy: updateData.amended_by
      };

      const response = await fetch(
        `${sharePointPaths.baseSite}/_api/web/lists/getbytitle('Procedures')/items(${originalProcedureId})`,
        {
          method: 'POST',
          headers: {
            'Accept': 'application/json; odata=verbose',
            'Content-Type': 'application/json; odata=verbose',
            'X-RequestDigest': requestDigest,
            'X-HTTP-Method': 'MERGE',
            'If-Match': '*'
          },
          body: JSON.stringify(updatePayload)
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update original procedure: ${response.status}`);
      }

      console.log('✅ Original procedure record updated successfully');
      return true;

    } catch (error) {
      console.error('❌ Failed to update original procedure record:', error);
      console.warn('⚠️ Continuing amendment process despite update failure');
      return false;
    }
  }

  // ✅ SANITIZATION HELPER METHODS
  sanitizeString(str) {
    if (!str || typeof str !== 'string') return '';
    
    return str
      .replace(/%[0-9A-Fa-f]{2}/g, '') // Remove URL encoded characters
      .replace(/[<>]/g, '') // Remove HTML brackets
      .trim();
  }

  sanitizeEmail(email) {
    if (!email || typeof email !== 'string') return '';
    
    return email
      .toLowerCase()
      .replace(/[^a-zA-Z0-9@._-]/g, '') // Keep only valid email characters
      .trim();
  }

  // ============================================================================
  // EXISTING DOCUMENT PROCESSING METHODS  
  // ============================================================================
  
  async analyzeDocument(file, metadata = {}) {
    try {
      console.log('🔍 Starting client-side AI analysis...');
      
      // Extract text from file
      const text = await this.extractTextFromFile(file);
      
      // ✅ USE YOUR EXISTING AI ANALYSIS LOGIC
      if (!window.documentAnalysis) {
        throw new Error('Document analysis engine not loaded. Please ensure documentAnalysis.js is included.');
      }
      
      const analysis = await window.documentAnalysis.analyzeDocument(text, file.type, metadata);
      
      analysis.accepted = analysis.score >= this.minimumScore;
      
      console.log('✅ AI Analysis completed:', {
        score: analysis.score,
        accepted: analysis.accepted,
        templateCompliance: analysis.details?.summary?.templateCompliance
      });

      return analysis;
      
    } catch (error) {
      console.error('❌ AI analysis failed:', error);
      throw new Error(`Document analysis failed: ${error.message}`);
    }
  }

  async extractTextFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          let text = '';
          
          if (file.type === 'application/pdf') {
            text = await this.extractPDFText(e.target.result);
          } else if (file.type.includes('wordprocessingml') || file.type.includes('msword')) {
            text = await this.extractWordText(e.target.result);
          } else {
            throw new Error('Unsupported file type');
          }
          
          resolve(text);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  }

  async extractPDFText(arrayBuffer) {
    try {
      const pdfjsLib = window['pdfjs-dist/build/pdf'];
      
      if (!pdfjsLib) {
        throw new Error('PDF.js library not loaded. Please ensure PDF.js CDN is included in SharePoint page.');
      }

      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + '\n';
      }

      console.log('✅ PDF text extracted, length:', fullText.length);
      return fullText;
      
    } catch (error) {
      console.error('❌ PDF extraction failed:', error);
      throw new Error('Failed to extract text from PDF: ' + error.message);
    }
  }

  async extractWordText(arrayBuffer) {
    try {
      const mammoth = window.mammoth;
      
      if (!mammoth) {
        throw new Error('Mammoth.js library not loaded. Please ensure mammoth.js CDN is included in SharePoint page.');
      }

      const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
      
      console.log('✅ Word document text extracted, length:', result.value.length);
      return result.value;
      
    } catch (error) {
      console.error('❌ Word extraction failed:', error);
      throw new Error('Failed to extract text from Word document: ' + error.message);
    }
  }

  // ============================================================================
  // ✅ SHAREPOINT INTEGRATION WITH CORRECT SITEASSETS PATHS
  // ============================================================================

  async uploadProcedureWithAnalysis(formData, file) {
    try {
      console.log('🚀 Starting procedure upload with AI analysis...');
      
      // 1. Analyze document first
      const analysisResult = await this.analyzeDocument(file, {
        name: formData.name,
        lob: formData.lob,
        subsection: formData.procedure_subsection
      });
      
      if (!analysisResult.accepted) {
        throw new Error(`Document quality score is ${analysisResult.score}% (minimum ${this.minimumScore}% required)`);
      }

      console.log('✅ Document passed AI analysis:', {
        score: analysisResult.score,
        templateCompliance: analysisResult.details?.summary?.templateCompliance
      });

      // 2. Get SharePoint context
      const requestDigest = await this.getRequestDigest();
      
      // 3. ✅ CORRECT: Generate SiteAssets path using SELECTED subsection
      const sharePointPath = this.generateSiteAssetsPath(formData.lob, formData.procedure_subsection);
      console.log('📂 Generated SiteAssets path for new upload:', sharePointPath);
      
      const fileUploadResult = await this.uploadFileToSharePoint(file, sharePointPath, requestDigest);
      
      // 4. Create procedure list item with comprehensive AI data
      const procedureData = {
        __metadata: { type: 'SP.Data.ProceduresListItem' },
        Title: formData.name || 'Untitled Procedure',
        ExpiryDate: formData.expiry || new Date().toISOString(),
        PrimaryOwner: formData.primary_owner || 'Unknown',
        PrimaryOwnerEmail: formData.primary_owner_email || `${formData.primary_owner || 'unknown'}@hsbc.com`,
        SecondaryOwner: formData.secondary_owner || '',
        SecondaryOwnerEmail: formData.secondary_owner_email || '',
        LOB: formData.lob || 'Unknown',
        ProcedureSubsection: formData.procedure_subsection || '', // ✅ Selected subsection
        SharePointPath: sharePointPath || '',
        DocumentLink: (fileUploadResult && fileUploadResult.serverRelativeUrl) || '',
        OriginalFilename: (file && file.name) || 'unknown.doc',
        FileSize: (file && file.size) || 0,
        
        // ✅ SAFE AI ANALYSIS RESULTS
        QualityScore: (analysisResult && analysisResult.score) || 0,
        TemplateCompliance: (analysisResult && analysisResult.details && analysisResult.details.summary && analysisResult.details.summary.templateCompliance) || 'Unknown',
        AnalysisDetails: JSON.stringify((analysisResult && analysisResult.details) || {}),
        AIRecommendations: JSON.stringify((analysisResult && analysisResult.aiRecommendations) || []),
        
        // ✅ SAFE HSBC-SPECIFIC DATA
        RiskRating: (analysisResult && analysisResult.details && analysisResult.details.riskRating) || 'Not Specified',
        PeriodicReview: (analysisResult && analysisResult.details && analysisResult.details.periodicReview) || 'Not Specified',
        DocumentOwners: JSON.stringify((analysisResult && analysisResult.details && analysisResult.details.owners) || []),
        SignOffDates: JSON.stringify((analysisResult && analysisResult.details && analysisResult.details.signOffDates) || []),
        Departments: JSON.stringify((analysisResult && analysisResult.details && analysisResult.details.departments) || []),
        
        // ✅ SAFE ANALYSIS METRICS
        FoundElements: JSON.stringify((analysisResult && analysisResult.details && analysisResult.details.foundElements) || []),
        MissingElements: JSON.stringify((analysisResult && analysisResult.details && analysisResult.details.missingElements) || []),
        HasDocumentControl: (analysisResult && analysisResult.details && analysisResult.details.hasDocumentControl) || false,
        HasRiskAssessment: (analysisResult && analysisResult.details && analysisResult.details.hasRiskAssessment) || false,
        HasPeriodicReview: (analysisResult && analysisResult.details && analysisResult.details.hasPeriodicReview) || false,
        StructureScore: (analysisResult && analysisResult.details && analysisResult.details.summary && analysisResult.details.summary.structureScore) || 0,
        GovernanceScore: (analysisResult && analysisResult.details && analysisResult.details.summary && analysisResult.details.summary.governanceScore) || 0,
        
        // Upload metadata
        UploadedBy: formData.primary_owner || 'Unknown',
        UploadedAt: new Date().toISOString(),
        Status: 'Active',
        SharePointUploaded: true
      };
     
      const procedureResult = await this.createProcedureListItem(procedureData, requestDigest);
     
      // 5. Create comprehensive audit log entry
      await this.createAuditLogEntry({
        __metadata: { type: 'SP.Data.AuditLogListItem' },
        Title: `Procedure Created: ${formData.name}`,
        ActionType: 'CREATE',
        UserId: formData.primary_owner,
        LogTimestamp: new Date().toISOString(),
        Details: JSON.stringify({
          procedureId: procedureResult.Id,
          procedureName: formData.name,
          lob: formData.lob,
          subsection: formData.procedure_subsection, // ✅ Selected subsection
          qualityScore: analysisResult.score,
          templateCompliance: analysisResult.details?.summary?.templateCompliance,
          riskRating: analysisResult.details?.riskRating,
          periodicReview: analysisResult.details?.periodicReview,
          documentOwners: analysisResult.details?.owners,
          foundElements: analysisResult.details?.foundElements?.length,
          missingElements: analysisResult.details?.missingElements?.length,
          fileSize: file.size,
          fileName: file.name,
          sharePointPath: sharePointPath
        }),
        ProcedureId: procedureResult.Id,
        LOB: formData.lob
      }, requestDigest);

      // ✅ CORRECT: SharePoint URL with SiteAssets
      const sharePointUrl = `${sharePointPaths.baseSite}/${sharePointPath}/${file.name}`;
     
      console.log('🎉 Procedure upload completed successfully:', {
        procedureId: procedureResult.Id,
        qualityScore: analysisResult.score,
        sharePointUrl,
        sharePointPath,
        selectedSubsection: formData.procedure_subsection
      });

      return {
        success: true,
        procedureId: procedureResult.Id,
        qualityScore: analysisResult.score,
        templateCompliance: analysisResult.details?.summary?.templateCompliance,
        sharePointPath: sharePointPath,
        sharePointUrl: sharePointUrl,
        analysisResult: analysisResult
      };
     
    } catch (error) {
      console.error('❌ Upload procedure failed:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  // ✅ CORRECT: Generate SiteAssets path with selected subsection
  generateSiteAssetsPath(lob, subsection) {
    // ✅ Use the SELECTED subsection, not "General" unless no selection
    let cleanSubsection = subsection || 'General';
    
    // Clean subsection name for folder path (keep underscores, replace spaces)
    cleanSubsection = cleanSubsection
      .replace(/[^a-zA-Z0-9\s_]/g, '') // Remove special characters except underscores
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .trim();
    
    // ✅ CORRECT: Always include SiteAssets as base
    const path = `SiteAssets/${lob}/${cleanSubsection}`;
    
    console.log(`📂 Generated SiteAssets path: ${path} (LOB: ${lob}, Subsection: ${subsection})`);
    return path;
  }

  async getRequestDigest() {
    try {
      const response = await fetch(`${sharePointPaths.baseSite}/_api/contextinfo`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json; odata=verbose',
          'Content-Type': 'application/json; odata=verbose'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get SharePoint context: ${response.status}`);
      }

      const data = await response.json();
      return data.d.GetContextWebInformation.FormDigestValue;
     
    } catch (error) {
      throw new Error(`Failed to get SharePoint request digest: ${error.message}`);
   }
 }

 async uploadFileToSharePoint(file, sharePointPath, requestDigest) {
   try {
     // ✅ CORRECT: Upload URL with SiteAssets path
     const uploadUrl = `${sharePointPaths.baseSite}/_api/web/GetFolderByServerRelativeUrl('/sites/EmployeeEng/${sharePointPath}')/Files/add(url='${file.name}',overwrite=true)`;
    
     console.log('📤 Uploading to SiteAssets path:', uploadUrl);

     const response = await fetch(uploadUrl, {
       method: 'POST',
       headers: {
         'Accept': 'application/json; odata=verbose',
         'X-RequestDigest': requestDigest,
         'Content-Type': 'application/octet-stream'
       },
       body: file
     });

     if (!response.ok) {
       const errorText = await response.text();
       throw new Error(`SharePoint file upload failed: ${response.status} - ${errorText}`);
     }

     const result = await response.json();
    
     console.log('✅ File uploaded to SiteAssets SharePoint:', result.d.ServerRelativeUrl);
    
     return {
       serverRelativeUrl: result.d.ServerRelativeUrl,
       webUrl: `${sharePointPaths.baseSite}/${sharePointPath}/${file.name}`
     };
    
   } catch (error) {
     throw new Error(`File upload to SharePoint SiteAssets failed: ${error.message}`);
   }
 }

 async createProcedureListItem(procedureData, requestDigest) {
   try {
     const response = await fetch(
       `${sharePointPaths.baseSite}/_api/web/lists/getbytitle('Procedures')/items`,
       {
         method: 'POST',
         headers: {
           'Accept': 'application/json; odata=verbose',
           'Content-Type': 'application/json; odata=verbose',
           'X-RequestDigest': requestDigest
         },
         body: JSON.stringify(procedureData)
       }
     );

     if (!response.ok) {
       const errorText = await response.text();
       throw new Error(`Failed to create procedure list item: ${response.status} - ${errorText}`);
     }

     const result = await response.json();
     console.log('✅ Procedure created in SharePoint List:', result.d.Id);
    
     return result.d;
    
   } catch (error) {
     throw new Error(`Failed to create procedure list item: ${error.message}`);
   }
 }

 async createAuditLogEntry(auditData, requestDigest) {
   try {
     const response = await fetch(
       `${sharePointPaths.baseSite}/_api/web/lists/getbytitle('AuditLog')/items`,
       {
         method: 'POST',
         headers: {
           'Accept': 'application/json; odata=verbose',
           'Content-Type': 'application/json; odata=verbose',
           'X-RequestDigest': requestDigest
         },
         body: JSON.stringify(auditData)
       }
     );

     if (response.ok) {
       console.log('✅ Audit log entry created');
       return await response.json();
     } else {
       console.warn('⚠️ Failed to create audit log entry, but continuing...');
       return null;
     }
    
   } catch (error) {
     console.warn('⚠️ Audit log creation failed:', error.message);
     return null; // Don't fail the whole process for audit log
   }
 }
}

export default DocumentAnalyzer;
