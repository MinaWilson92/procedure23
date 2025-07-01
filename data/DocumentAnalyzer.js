// services/DocumentAnalyzer.js - Complete Fixed Version with Enhanced URL Handling
import { sharePointPaths } from './paths';
import SharePointService from './SharePointService';

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

  // ✅ ENHANCED: Comprehensive URL cleaning and validation
  cleanAndValidateUrl(url) {
    if (!url) return '';
    
    console.log('🔧 Starting URL cleaning for:', url);
    
    // Step 1: Remove multiple duplicate segments
    let cleanUrl = url
      .replace(/\/sites\/EmployeeEng\/sites\/EmployeeEng\//gi, '/sites/EmployeeEng/')
      .replace(/\/Sites\/EmployeeEng\/Sites\/EmployeeEng\//gi, '/sites/EmployeeEng/')
      .replace(/\/sites\/employeeeng\/sites\/employeeeng\//gi, '/sites/EmployeeEng/')
      .replace(/\/\/+/g, '/') // Remove multiple consecutive slashes
      .replace(/([^:]\/)\/+/g, '$1'); // Remove duplicate slashes except after protocol
    
    // Step 2: Fix case sensitivity issues
    cleanUrl = cleanUrl.replace(/\/sites\/employeeeng\//gi, '/sites/EmployeeEng/');
    
    // Step 3: Validate and fix common issues
    if (cleanUrl.includes('undefined') || cleanUrl.includes('null')) {
      console.warn('⚠️ Invalid URL detected:', cleanUrl);
      return '';
    }
    
    // Step 4: Ensure proper structure
    if (!cleanUrl.startsWith('http') && !cleanUrl.startsWith('/sites/EmployeeEng/')) {
      if (cleanUrl.startsWith('/')) {
        cleanUrl = `/sites/EmployeeEng${cleanUrl}`;
      } else {
        cleanUrl = `/sites/EmployeeEng/${cleanUrl}`;
      }
    }
    
    // Step 5: Convert to full URL if needed
    if (cleanUrl.startsWith('/sites/EmployeeEng/')) {
      cleanUrl = `https://teams.global.hsbc${cleanUrl}`;
    }
    
    console.log('✅ URL cleaned successfully:', cleanUrl);
    return cleanUrl;
  }

  // ✅ ENHANCED: Smart file naming with comprehensive duplicate prevention
  async generateUniqueFileName(baseFileName, targetFolderPath, sharePointUrl, requestDigest) {
    try {
      // Clean the target folder path first
      const cleanedTargetPath = this.cleanAndValidateFolderPath(targetFolderPath);
      
      // Extract name and extension
      const lastDotIndex = baseFileName.lastIndexOf('.');
      const nameWithoutExt = lastDotIndex > 0 ? baseFileName.substring(0, lastDotIndex) : baseFileName;
      const extension = lastDotIndex > 0 ? baseFileName.substring(lastDotIndex) : '';
      
      console.log('🔍 Generating unique filename:', {
        baseFileName,
        nameWithoutExt,
        extension,
        targetPath: cleanedTargetPath
      });
      
      // Check if original file exists
      const checkUrl = `${sharePointUrl}/_api/web/GetFolderByServerRelativeUrl('${cleanedTargetPath}')/Files('${encodeURIComponent(baseFileName)}')`;
      
      const checkResponse = await fetch(checkUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json; odata=verbose' }
      });
      
      if (checkResponse.status === 404) {
        console.log('✅ Original filename available:', baseFileName);
        return {
          fileName: baseFileName,
          isRenamed: false
        };
      }
      
      // File exists, generate unique name
      console.log('⚠️ File exists, generating unique name...');
      
      let counter = 1;
      let uniqueName;
      let exists = true;
      
      while (exists && counter <= 999) {
        // Generate name with timestamp and counter
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
        uniqueName = `${nameWithoutExt}_v${counter}_${timestamp}${extension}`;
        
        const uniqueCheckUrl = `${sharePointUrl}/_api/web/GetFolderByServerRelativeUrl('${cleanedTargetPath}')/Files('${encodeURIComponent(uniqueName)}')`;
        
        const uniqueResponse = await fetch(uniqueCheckUrl, {
          method: 'GET',
          headers: { 'Accept': 'application/json; odata=verbose' }
        });
        
        if (uniqueResponse.status === 404) {
          exists = false;
          console.log('✅ Generated unique filename:', uniqueName);
          return {
            fileName: uniqueName,
            isRenamed: true
          };
        }
        
        counter++;
      }
      
      // Fallback: use timestamp if all else fails
      const fallbackTimestamp = Date.now();
      const fallbackName = `${nameWithoutExt}_${fallbackTimestamp}${extension}`;
      console.log('🔄 Using fallback filename:', fallbackName);
      return {
        fileName: fallbackName,
        isRenamed: true
      };
      
    } catch (error) {
      console.error('❌ Error generating unique filename:', error);
      // Ultimate fallback: add timestamp to original name
      const timestamp = Date.now();
      const lastDotIndex = baseFileName.lastIndexOf('.');
      const nameWithoutExt = lastDotIndex > 0 ? baseFileName.substring(0, lastDotIndex) : baseFileName;
      const extension = lastDotIndex > 0 ? baseFileName.substring(lastDotIndex) : '';
      const fallbackName = `${nameWithoutExt}_${timestamp}${extension}`;
      console.log('🔄 Error fallback filename:', fallbackName);
      return {
        fileName: fallbackName,
        isRenamed: true
      };
    }
  }

  // ✅ ENHANCED: Clean and validate folder paths
  cleanAndValidateFolderPath(folderPath) {
    if (!folderPath) return '/sites/EmployeeEng/SiteAssets/IWPB/General';
    
    console.log('🔧 Cleaning folder path:', folderPath);
    
    // Remove duplicate path segments
    let cleanPath = folderPath
          .replace(/\/Sites\/EmployeeEng\/Sites\/EmployeeEng\//gi, '/sites/EmployeeEng/')
      .replace(/\/sites\/employeeeng\/sites\/employeeeng\//gi, '/sites/EmployeeEng/')
      .replace(/\/\/+/g, '/'); // Remove multiple consecutive slashes
    
    // Fix case sensitivity
    cleanPath = cleanPath.replace(/\/sites\/employeeeng\//gi, '/sites/EmployeeEng/');
    
    // Ensure proper structure
    if (!cleanPath.startsWith('/sites/EmployeeEng/')) {
      if (cleanPath.startsWith('/')) {
        cleanPath = `/sites/EmployeeEng${cleanPath}`;
      } else {
        cleanPath = `/sites/EmployeeEng/${cleanPath}`;
      }
    }
    
    // Validate path structure
    if (cleanPath.includes('undefined') || cleanPath.includes('null')) {
      console.warn('⚠️ Invalid folder path detected, using fallback');
      cleanPath = '/sites/EmployeeEng/SiteAssets/IWPB/General';
    }
    
    console.log('✅ Folder path cleaned:', cleanPath);
    return cleanPath;
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
  // ✅ ENHANCED AMENDMENT SUPPORT WITH COMPREHENSIVE URL FIXING
  // ============================================================================

  // ✅ ENHANCED: Parse existing document URL with comprehensive cleaning
  parseExistingDocumentPath(documentLink) {
    try {
      if (!documentLink) {
        console.warn('⚠️ No document link provided, using default SiteAssets structure');
        return {
          baseUrl: sharePointPaths.baseSite || 'https://teams.global.hsbc/sites/EmployeeEng',
          lobFolder: 'IWPB',
          subFolder: 'General',
          fullFolderPath: '/sites/EmployeeEng/SiteAssets/IWPB/General',
          sharePointPath: 'SiteAssets/IWPB/General'
        };
      }

      // Clean the URL first
      const cleanedUrl = this.cleanAndValidateUrl(documentLink);
      console.log('🔍 Analyzing cleaned document URL:', cleanedUrl);

      // Parse the cleaned URL
      const url = new URL(cleanedUrl);
      const pathname = url.pathname;

      // Extract path components
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
      
      // Get LOB folder (after SiteAssets)
      const lobFolderIndex = siteAssetsIndex + 1;
      const lobFolder = pathParts[lobFolderIndex] || 'IWPB';
      
      // Get actual subfolder
      const subFolderIndex = lobFolderIndex + 1;
      const subFolder = pathParts[subFolderIndex] || 'General';
      
      // Reconstruct clean paths
      const folderPathParts = ['sites', 'EmployeeEng', 'SiteAssets', lobFolder, subFolder];
      const fullFolderPath = `/${folderPathParts.join('/')}`;
      const sharePointPath = `SiteAssets/${lobFolder}/${subFolder}`;

      const result = {
        baseUrl,
        lobFolder,
        subFolder,
        fullFolderPath,
        sharePointPath,
        originalUrl: documentLink,
        cleanedUrl: cleanedUrl
      };

      console.log('✅ Parsed SiteAssets folder structure:', result);
      return result;

    } catch (error) {
      console.error('❌ Error parsing document URL:', error);
      
      // Clean fallback structure
      const fallback = {
        baseUrl: sharePointPaths.baseSite || 'https://teams.global.hsbc/sites/EmployeeEng',
        lobFolder: 'IWPB',
        subFolder: 'General',
        fullFolderPath: '/sites/EmployeeEng/SiteAssets/IWPB/General',
        sharePointPath: 'SiteAssets/IWPB/General',
        error: error.message
      };
      
      console.log('🔄 Using fallback SiteAssets structure:', fallback);
      return fallback;
    }
  }

  // ✅ COMPLETELY FIXED: Amendment with comprehensive URL handling and tracking
  async amendProcedureInSharePoint(amendmentData, file) {
    const sharePointUrl = 'https://teams.global.hsbc/sites/EmployeeEng';
    
    try {
      console.log('🔄 Starting ENHANCED SharePoint amendment with comprehensive URL fixing...');
      console.log('📂 Amendment data received:', amendmentData);

      // ✅ STEP 1: Clean and validate all paths
      let targetFolderPath = this.cleanAndValidateFolderPath(amendmentData.fullFolderPath);
      const sharePointPath = amendmentData.sharePointPath;
      
      console.log('🔍 ENHANCED path validation and cleaning:');
      console.log('   Original path:', amendmentData.fullFolderPath);
      console.log('   Cleaned path:', targetFolderPath);
      console.log('   SharePoint path:', sharePointPath);
      
      // Final validation
      if (!targetFolderPath || targetFolderPath === 'undefined') {
        throw new Error(`Invalid target folder path: ${targetFolderPath}`);
      }

      // Double-check for any remaining duplication
      if (targetFolderPath.includes('/sites/EmployeeEng/sites/EmployeeEng/')) {
        console.error('❌ CRITICAL: Path duplication still detected:', targetFolderPath);
        throw new Error('Path duplication detected after cleaning. Please check folder path construction.');
      }

      console.log('✅ Using CLEANED HSBC URLs with amendment tracking:');
      console.log(`📁 Final Target Path: ${targetFolderPath}`);

      // ✅ STEP 2: Get current procedure data
      const currentDataUrl = `${sharePointUrl}/_api/web/lists/getbytitle('Procedures')/items(${amendmentData.procedureId})?$select=QualityScore,AmendmentHistory,AmendmentCount,PreviousScore,AmendmentTimeline`;
      
      const currentDataResponse = await fetch(currentDataUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json; odata=verbose' }
      });

      let currentProcedure = null;
      if (currentDataResponse.ok) {
        const currentData = await currentDataResponse.json();
        currentProcedure = currentData.d;
        console.log('✅ Retrieved current procedure data:', currentProcedure);
      }

      // ✅ STEP 3: Get request digest
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

      // ✅ STEP 4: Generate unique filename and upload file
      console.log(`📤 Preparing upload to CLEANED HSBC path: ${targetFolderPath}`);
      
      // Generate unique filename with enhanced logic
      const uniqueFileResult = await this.generateUniqueFileName(file.name, targetFolderPath, sharePointUrl, requestDigest);
      const uniqueFileName = uniqueFileResult.fileName;
      const isFileRenamed = uniqueFileResult.isRenamed;
      
      console.log(`📁 File naming result:`, {
        originalName: file.name,
        finalName: uniqueFileName,
        wasRenamed: isFileRenamed
      });

      const uploadUrl = `${sharePointUrl}/_api/web/GetFolderByServerRelativeUrl('${targetFolderPath}')/Files/Add(url='${encodeURIComponent(uniqueFileName)}', overwrite=false)`;
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
      console.log('✅ File uploaded successfully to:', uploadResult.d.ServerRelativeUrl);

      // ✅ STEP 5: Build comprehensive amendment history with cleaned URLs
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

      // Create new amendment record with cleaned URLs
      const cleanDocumentUrl = this.cleanAndValidateUrl(`${sharePointUrl}${uploadResult.d.ServerRelativeUrl}`);
      
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
        fileName: file.name, // Original filename
        actualFileName: uniqueFileName, // Actual saved filename
        fileSize: file.size,
        fileRenamed: isFileRenamed, // Enhanced flag
        targetFolder: sharePointPath,
        actualSubFolder: amendmentData.subFolder,
        documentUrl: cleanDocumentUrl, // ✅ CLEANED URL
        analysisDetails: amendmentData.new_analysis_details,
        aiRecommendations: amendmentData.new_ai_recommendations,
        uploadTimestamp: new Date().toISOString()
      };

      // Add to history
      amendmentHistory.push(newAmendment);

      // Build timeline
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

      console.log('📋 Built ENHANCED amendment tracking data:');
      console.log(`   Amendment #: ${newAmendmentCount}`);
      console.log(`   Previous Score: ${currentScore}%`);
      console.log(`   New Score: ${newScore}%`);
      console.log(`   Score Change: ${newScore - currentScore > 0 ? '+' : ''}${newScore - currentScore}%`);
      console.log(`   Original filename: ${file.name}`);
      console.log(`   Saved filename: ${uniqueFileName}`);
      console.log(`   File renamed: ${isFileRenamed}`);
      console.log(`   Document URL (cleaned): ${cleanDocumentUrl}`);

      // ✅ STEP 6: Update procedure with comprehensive data and cleaned URLs
      const listUpdateUrl = `${sharePointUrl}/_api/web/lists/getbytitle('Procedures')/items(${amendmentData.procedureId})`;
      
      const updateData = {
        __metadata: { type: 'SP.Data.ProceduresListItem' },
        
        // Core amendment tracking
        QualityScore: newScore,
        PreviousScore: currentScore,
        AmendmentCount: newAmendmentCount,
        LatestAmendmentSummary: amendmentData.amendment_summary,
        AmendmentHistory: JSON.stringify(amendmentHistory),
        AmendmentTimeline: JSON.stringify(amendmentTimeline),
        
        // Latest amendment info
        LastAmendedBy: amendmentData.amended_by_name,
        LastAmendmentDate: new Date().toISOString(),
        LastAmendedByStaffId: amendmentData.amended_by,
        LastAmendedByRole: amendmentData.amended_by_role,
        
        // Update secondary owner if provided
        SecondaryOwner: amendmentData.secondary_owner || '',
        SecondaryOwnerEmail: amendmentData.secondary_owner_email || '',
        
        // Analysis data
        AnalysisDetails: JSON.stringify(amendmentData.new_analysis_details),
        AIRecommendations: JSON.stringify(amendmentData.new_ai_recommendations),
        
        // ✅ CLEANED document info
        DocumentLink: uploadResult.d.ServerRelativeUrl, // SharePoint relative URL
        SharePointURL: cleanDocumentUrl, // Full cleaned URL
        OriginalFilename: file.name,
        ActualFilename: uniqueFileName,
        FileSize: file.size,
        SharePointUploaded: true,
        SiteAssetsPath: sharePointPath,
        ActualSubFolder: amendmentData.subFolder,
        FileRenamed: isFileRenamed,
        
        // Amendment metadata
        LastModifiedOn: new Date().toISOString(),
        LastModifiedBy: amendmentData.amended_by_name
      };

      console.log('📝 Updating procedure with ENHANCED amendment tracking...');

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

      console.log('✅ Procedure updated with ENHANCED amendment tracking');

      // ✅ STEP 7: Enhanced audit log
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
          originalFileName: file.name,
          savedFileName: uniqueFileName,
          fileRenamed: isFileRenamed,
          documentUrl: cleanDocumentUrl,
          amendedBy: amendmentData.amended_by_name,
          totalAmendments: newAmendmentCount,
          urlCleaned: true
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

      console.log('✅ ENHANCED audit log entry created');
      console.log('✅ Amendment completed with COMPREHENSIVE tracking and URL cleaning');

      return {
        success: true,
        message: 'Procedure amended successfully with comprehensive tracking and URL cleaning',
        amendmentNumber: newAmendmentCount,
        previousScore: currentScore,
        newScore: newScore,
        scoreChange: newScore - currentScore,
        uploadedTo: targetFolderPath,
        sharePointPath: sharePointPath,
        actualSubFolder: amendmentData.subFolder,
        documentUrl: cleanDocumentUrl, // ✅ Returns cleaned URL
        amendmentHistory: amendmentHistory,
        timelineEntry: timelineEntry,
        originalFileName: file.name,
        savedFileName: uniqueFileName,
        fileRenamed: isFileRenamed,
        urlCleaned: true
      };

    } catch (error) {
      console.error('❌ ENHANCED amendment failed:', error);
      return {
        success: false,
        message: error.message || 'Amendment failed',
        error: error,
        attempted_url: sharePointUrl
      };
    }
  }

  // ✅ ENHANCED: Upload with comprehensive URL cleaning
  async uploadAmendmentWithAnalysis(amendmentData, file) {
    try {
      console.log('🚀 Starting amendment upload with ENHANCED AI analysis and URL cleaning...');
      
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
      
      // 3. ✅ CLEAN: Use existing SiteAssets folder path with cleaning
      const cleanedSharePointPath = amendmentData.sharePointPath || 'SiteAssets/IWPB/General';
      console.log('📂 Using cleaned SiteAssets SharePoint path:', cleanedSharePointPath);
      
      // 4. Upload with enhanced file naming and URL cleaning
      const fileUploadResult = await this.uploadFileToSharePointWithUniqueName(file, cleanedSharePointPath, requestDigest);
      
      // 5. Create amended procedure list item with cleaned URLs
      const amendedProcedureData = {
        __metadata: { type: 'SP.Data.ProceduresListItem' },
        Title: amendmentData.originalName,
        ExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
        PrimaryOwner: amendmentData.originalPrimaryOwner,
        PrimaryOwnerEmail: amendmentData.originalPrimaryOwnerEmail,
        SecondaryOwner: amendmentData.secondary_owner || '',
        SecondaryOwnerEmail: amendmentData.secondary_owner_email || '',
        LOB: amendmentData.originalLOB || 'Unknown',
        ProcedureSubsection: amendmentData.subFolder || '',
        SharePointPath: cleanedSharePointPath || '',
        DocumentLink: fileUploadResult?.serverRelativeUrl || '',
        SharePointURL: fileUploadResult?.webUrl || '', // ✅ This will be cleaned
        OriginalFilename: file?.name || 'unknown.doc',
        ActualFilename: fileUploadResult?.actualFileName || file.name,
        FileSize: file?.size || 0,
        FileRenamed: fileUploadResult?.fileRenamed || false,
        
        // AI analysis results
        QualityScore: analysisResult?.score || 0,
        TemplateCompliance: analysisResult?.details?.summary?.templateCompliance || 'Unknown',
        AnalysisDetails: JSON.stringify(analysisResult?.details || {}),
        AIRecommendations: JSON.stringify(analysisResult?.aiRecommendations || []),
        
        // HSBC-specific data
        RiskRating: analysisResult?.details?.riskRating || 'Not Specified',
        PeriodicReview: analysisResult?.details?.periodicReview || 'Not Specified',
        DocumentOwners: JSON.stringify(analysisResult?.details?.owners || []),
        SignOffDates: JSON.stringify(analysisResult?.details?.signOffDates || []),
        Departments: JSON.stringify(analysisResult?.details?.departments || []),
        
        // Amendment metadata
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
      
      // 6. Update original procedure record
      await this.updateOriginalProcedureRecord(amendmentData.procedureId, {
        status: 'Amended',
        amended_date: amendmentData.amendment_date,
        amended_by: amendmentData.amended_by_name,
        new_version_id: procedureResult.Id,
        amendment_summary: amendmentData.amendment_summary
      }, requestDigest);
     
      // 7. Create audit log entry
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
          subfolder: amendmentData.subFolder,
          amendmentSummary: amendmentData.amendment_summary,
          qualityScore: analysisResult.score,
          templateCompliance: analysisResult.details?.summary?.templateCompliance,
          cleanedSharePointPath: cleanedSharePointPath,
          fileSize: file.size,
          originalFileName: file.name,
          actualFileName: fileUploadResult?.actualFileName,
          fileRenamed: fileUploadResult?.fileRenamed,
          urlCleaned: true
        }),
        ProcedureId: procedureResult.Id,
        LOB: amendmentData.originalLOB
      }, requestDigest);

      // ✅ CLEAN: SharePoint URL with cleaned paths
      const sharePointUrl = fileUploadResult?.webUrl || `${sharePointPaths.baseSite}/${cleanedSharePointPath}/${fileUploadResult?.actualFileName || file.name}`;
      const finalCleanUrl = this.cleanAndValidateUrl(sharePointUrl);
     
      console.log('🎉 Amendment upload completed successfully with URL cleaning:', {
        newProcedureId: procedureResult.Id,
        originalProcedureId: amendmentData.procedureId,
        qualityScore: analysisResult.score,
        sharePointUrl: finalCleanUrl,
        sharePointPath: cleanedSharePointPath,
        actualSubfolder: amendmentData.subFolder,
        fileRenamed: fileUploadResult?.fileRenamed,
        urlCleaned: true
      });

      return {
        success: true,
        procedureId: procedureResult.Id,
        qualityScore: analysisResult.score,
        templateCompliance: analysisResult.details?.summary?.templateCompliance,
        sharePointPath: cleanedSharePointPath,
        sharePointUrl: finalCleanUrl, // ✅ Cleaned URL
        analysisResult: analysisResult,
        message: `Amendment uploaded successfully to cleaned path: SiteAssets/${amendmentData.lobFolder}/${amendmentData.subFolder}`,
        fileRenamed: fileUploadResult?.fileRenamed,
        actualFileName: fileUploadResult?.actualFileName,
        urlCleaned: true
      };
     
    } catch (error) {
      console.error('❌ Upload amendment failed:', error);
      throw new Error(`Amendment upload failed: ${error.message}`);
    }
  }

  // ✅ Continue existing methods with URL cleaning enhancements...

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

  // ✅ Sanitization helpers
  sanitizeString(str) {
    if (!str || typeof str !== 'string') return '';
    return str.replace(/%[0-9A-Fa-f]{2}/g, '').replace(/[<>]/g, '').trim();
  }

  sanitizeEmail(email) {
    if (!email || typeof email !== 'string') return '';
    return email.toLowerCase().replace(/[^a-zA-Z0-9@._-]/g, '').trim();
  }

  // ============================================================================
  // EXISTING DOCUMENT PROCESSING METHODS  
  // ============================================================================
  
  async analyzeDocument(file, metadata = {}) {
    try {
      console.log('🔍 Starting client-side AI analysis...');
      
      const text = await this.extractTextFromFile(file);
      
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
  // ✅ ENHANCED SHAREPOINT INTEGRATION WITH URL CLEANING
  // ============================================================================

  async uploadProcedureWithAnalysis(formData, file) {
    try {
      console.log('🚀 Starting procedure upload with AI analysis and URL cleaning...');
      
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
      
      // 3. ✅ CLEAN: Generate SiteAssets path with cleaning
      const sharePointPath = this.generateSiteAssetsPath(formData.lob, formData.procedure_subsection);
      console.log('📂 Generated clean SiteAssets path for new upload:', sharePointPath);
      
      // 4. Upload with enhanced file naming and URL cleaning
      const fileUploadResult = await this.uploadFileToSharePointWithUniqueName(file, sharePointPath, requestDigest);
      
      // 5. Create procedure list item with comprehensive AI data and cleaned URLs
      const procedureData = {
        __metadata: { type: 'SP.Data.ProceduresListItem' },
        Title: formData.name || 'Untitled Procedure',
        ExpiryDate: formData.expiry || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        PrimaryOwner: formData.primary_owner || 'Unknown',
        PrimaryOwnerEmail: formData.primary_owner_email || `${formData.primary_owner || 'unknown'}@hsbc.com`,
        SecondaryOwner: formData.secondary_owner || '',
        SecondaryOwnerEmail: formData.secondary_owner_email || '',
        LOB: formData.lob || 'Unknown',
        ProcedureSubsection: formData.procedure_subsection || '',
        SharePointPath: sharePointPath || '',
        DocumentLink: fileUploadResult?.serverRelativeUrl || '',
        SharePointURL: fileUploadResult?.webUrl || '', // ✅ This will be cleaned
        OriginalFilename: file?.name || 'unknown.doc',
        ActualFilename: fileUploadResult?.actualFileName || file.name,
        FileSize: file?.size || 0,
        FileRenamed: fileUploadResult?.fileRenamed || false,
        
        // ✅ SAFE AI ANALYSIS RESULTS
        QualityScore: analysisResult?.score || 0,
        TemplateCompliance: analysisResult?.details?.summary?.templateCompliance || 'Unknown',
        AnalysisDetails: JSON.stringify(analysisResult?.details || {}),
        AIRecommendations: JSON.stringify(analysisResult?.aiRecommendations || []),
        
        // ✅ SAFE HSBC-SPECIFIC DATA
        RiskRating: analysisResult?.details?.riskRating || 'Not Specified',
        PeriodicReview: analysisResult?.details?.periodicReview || 'Not Specified',
        DocumentOwners: JSON.stringify(analysisResult?.details?.owners || []),
        SignOffDates: JSON.stringify(analysisResult?.details?.signOffDates || []),
        Departments: JSON.stringify(analysisResult?.details?.departments || []),
        
        // ✅ SAFE ANALYSIS METRICS
        FoundElements: JSON.stringify(analysisResult?.details?.foundElements || []),
        MissingElements: JSON.stringify(analysisResult?.details?.missingElements || []),
        HasDocumentControl: analysisResult?.details?.hasDocumentControl || false,
        HasRiskAssessment: analysisResult?.details?.hasRiskAssessment || false,
        HasPeriodicReview: analysisResult?.details?.hasPeriodicReview || false,
        StructureScore: analysisResult?.details?.summary?.structureScore || 0,
        GovernanceScore: analysisResult?.details?.summary?.governanceScore || 0,
        
        // Upload metadata
        UploadedBy: formData.primary_owner || 'Unknown',
        UploadedAt: new Date().toISOString(),
        Status: 'Active',
        SharePointUploaded: true
      };
     
      const procedureResult = await this.createProcedureListItem(procedureData, requestDigest);
     
      // 6. Create comprehensive audit log entry
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
          subsection: formData.procedure_subsection,
          qualityScore: analysisResult.score,
          templateCompliance: analysisResult.details?.summary?.templateCompliance,
          riskRating: analysisResult.details?.riskRating,
          periodicReview: analysisResult.details?.periodicReview,
          documentOwners: analysisResult.details?.owners,
          foundElements: analysisResult.details?.foundElements?.length,
          missingElements: analysisResult.details?.missingElements?.length,
          fileSize: file.size,
          originalFileName: file.name,
          actualFileName: fileUploadResult?.actualFileName,
          fileRenamed: fileUploadResult?.fileRenamed,
          sharePointPath: sharePointPath,
          urlCleaned: true
        }),
        ProcedureId: procedureResult.Id,
        LOB: formData.lob
      }, requestDigest);

      // ✅ CLEAN: SharePoint URL with cleaning
      const sharePointUrl = fileUploadResult?.webUrl || `${sharePointPaths.baseSite}/${sharePointPath}/${fileUploadResult?.actualFileName || file.name}`;
      const finalCleanUrl = this.cleanAndValidateUrl(sharePointUrl);
     
      console.log('🎉 Procedure upload completed successfully with URL cleaning:', {
        procedureId: procedureResult.Id,
        qualityScore: analysisResult.score,
        sharePointUrl: finalCleanUrl,
        sharePointPath: sharePointPath,
        selectedSubsection: formData.procedure_subsection,
        fileRenamed: fileUploadResult?.fileRenamed,
        urlCleaned: true
      });

      return {
        success: true,
        procedureId: procedureResult.Id,
        qualityScore: analysisResult.score,
        templateCompliance: analysisResult.details?.summary?.templateCompliance,
        sharePointPath: sharePointPath,
        sharePointUrl: finalCleanUrl, // ✅ Cleaned URL
        analysisResult: analysisResult,
        fileRenamed: fileUploadResult?.fileRenamed,
        actualFileName: fileUploadResult?.actualFileName,
        urlCleaned: true
      };
     
    } catch (error) {
      console.error('❌ Upload procedure failed:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  // ✅ CLEAN: Generate SiteAssets path with validation
  generateSiteAssetsPath(lob, subsection) {
    let cleanSubsection = subsection || 'General';
    
    // Clean subsection name for folder path
    cleanSubsection = cleanSubsection
      .replace(/[^a-zA-Z0-9\s_]/g, '')
      .replace(/\s+/g, '_')
      .trim();
    
    const path = `SiteAssets/${lob}/${cleanSubsection}`;
    
    console.log(`📂 Generated clean SiteAssets path: ${path} (LOB: ${lob}, Subsection: ${subsection})`);
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

  // ✅ ENHANCED: Upload with smart file naming and URL cleaning
  async uploadFileToSharePointWithUniqueName(file, sharePointPath, requestDigest) {
    try {
      // ✅ CLEAN: Upload URL with proper path cleaning
      const basePath = `/sites/EmployeeEng/${sharePointPath}`;
      const cleanBasePath = this.cleanAndValidateFolderPath(basePath);
      
      // Generate unique filename
      const uniqueFileResult = await this.generateUniqueFileName(file.name, cleanBasePath, sharePointPaths.baseSite, requestDigest);
      const uniqueFileName = uniqueFileResult.fileName;
      const isFileRenamed = uniqueFileResult.isRenamed;
      
      const uploadUrl = `${sharePointPaths.baseSite}/_api/web/GetFolderByServerRelativeUrl('${cleanBasePath}')/Files/add(url='${encodeURIComponent(uniqueFileName)}',overwrite=false)`;
     
      console.log('📤 Uploading to clean SiteAssets path with unique naming:', uploadUrl);

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
      
      // ✅ CLEAN: Generate clean URLs
      const webUrl = `${sharePointPaths.baseSite}/${sharePointPath}/${uniqueFileName}`;
      const cleanWebUrl = this.cleanAndValidateUrl(webUrl);
     
      console.log('✅ File uploaded to SiteAssets SharePoint with unique name and clean URLs:', {
        serverRelativeUrl: result.d.ServerRelativeUrl,
        webUrl: cleanWebUrl,
        actualFileName: uniqueFileName,
        fileRenamed: isFileRenamed
      });
     
      return {
        serverRelativeUrl: result.d.ServerRelativeUrl,
        webUrl: cleanWebUrl, // ✅ Cleaned URL
        actualFileName: uniqueFileName,
        fileRenamed: isFileRenamed
      };
     
    } catch (error) {
      throw new Error(`File upload to SharePoint SiteAssets failed: ${error.message}`);
    }
  }

  // ✅ LEGACY: Keep existing method for compatibility with URL cleaning
  async uploadFileToSharePoint(file, sharePointPath, requestDigest) {
    try {
      // ✅ CLEAN: Upload URL with path cleaning
      const basePath = `/sites/EmployeeEng/${sharePointPath}`;
      const cleanBasePath = this.cleanAndValidateFolderPath(basePath);
      
      const uploadUrl = `${sharePointPaths.baseSite}/_api/web/GetFolderByServerRelativeUrl('${cleanBasePath}')/Files/add(url='${encodeURIComponent(file.name)}',overwrite=true)`;
     
      console.log('📤 Uploading to clean SiteAssets path:', uploadUrl);

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
      
      // ✅ CLEAN: Generate clean URLs
      const webUrl = `${sharePointPaths.baseSite}/${sharePointPath}/${file.name}`;
      const cleanWebUrl = this.cleanAndValidateUrl(webUrl);
     
      console.log('✅ File uploaded to clean SiteAssets SharePoint:', result.d.ServerRelativeUrl);
     
      return {
        serverRelativeUrl: result.d.ServerRelativeUrl,
        webUrl: cleanWebUrl // ✅ Cleaned URL
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
      return null;
    }
  }
}

export default DocumentAnalyzer;
