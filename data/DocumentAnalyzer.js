// services/DocumentAnalyzer.js - Complete Fixed Version with Domain Duplication Fixes
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

  // ✅ ENHANCED: Comprehensive URL cleaning with domain duplication fix
  cleanAndValidateUrl(url) {
    if (!url) return '';
    
    console.log('🔧 Starting ENHANCED URL cleaning for:', url);
    
    // Step 1: Fix domain duplication patterns first (CRITICAL FIX)
    let cleanUrl = url
      .replace(/https:\/\/teams\.global\.hsbc\/teams\.global\.hsbc\//gi, 'https://teams.global.hsbc/')
      .replace(/https:\/\/teams\.global\.hsbc\/https:\/\/teams\.global\.hsbc\//gi, 'https://teams.global.hsbc/')
      .replace(/teams\.global\.hsbc\/teams\.global\.hsbc\//gi, 'teams.global.hsbc/')
      .replace(/\/teams\.global\.hsbc\/teams\.global\.hsbc\//gi, '/teams.global.hsbc/');
    
    // Step 2: Fix protocol duplication
    cleanUrl = cleanUrl.replace(/https:\/\/https:\/\//gi, 'https://');
    
    // Step 3: Remove path segment duplications
    cleanUrl = cleanUrl
      .replace(/\/sites\/EmployeeEng\/sites\/EmployeeEng\//gi, '/sites/EmployeeEng/')
      .replace(/\/Sites\/EmployeeEng\/Sites\/EmployeeEng\//gi, '/sites/EmployeeEng/')
      .replace(/\/sites\/employeeeng\/sites\/employeeeng\//gi, '/sites/EmployeeEng/')
      .replace(/\/siteassets\/siteassets\//gi, '/SiteAssets/')
      .replace(/\/SiteAssets\/SiteAssets\//gi, '/SiteAssets/');
    
    // Step 4: Remove multiple consecutive slashes (except after protocol)
    cleanUrl = cleanUrl.replace(/([^:]\/)\/+/g, '$1');
    
    // Step 5: Fix case sensitivity issues
    cleanUrl = cleanUrl
      .replace(/\/sites\/employeeeng\//gi, '/sites/EmployeeEng/')
      .replace(/\/siteassets\//gi, '/SiteAssets/');
    
    // Step 6: Validate and fix structure issues
    if (cleanUrl.includes('undefined') || cleanUrl.includes('null')) {
      console.warn('⚠️ Invalid URL detected:', cleanUrl);
      return '';
    }
    
    // Step 7: Ensure proper structure for relative URLs
    if (!cleanUrl.startsWith('http') && !cleanUrl.startsWith('/sites/EmployeeEng/')) {
      if (cleanUrl.startsWith('/')) {
        cleanUrl = `/sites/EmployeeEng${cleanUrl}`;
      } else {
        cleanUrl = `/sites/EmployeeEng/${cleanUrl}`;
      }
    }
    
    // Step 8: Convert to full URL if needed (WITHOUT domain duplication)
    if (cleanUrl.startsWith('/sites/EmployeeEng/')) {
      cleanUrl = `https://teams.global.hsbc${cleanUrl}`;
    }
    
    // Step 9: Final validation to ensure no domain duplication remains
    if (cleanUrl.includes('teams.global.hsbc/teams.global.hsbc/')) {
      console.error('❌ CRITICAL: Domain duplication still detected:', cleanUrl);
      cleanUrl = cleanUrl.replace(/teams\.global\.hsbc\/teams\.global\.hsbc\//gi, 'teams.global.hsbc/');
    }
    
    console.log('✅ URL cleaned successfully (domain fixed):', cleanUrl);
    return cleanUrl;
  }

  // ✅ ENHANCED: Clean and validate folder paths with domain duplication fix
  cleanAndValidateFolderPath(folderPath) {
    if (!folderPath) return '/sites/EmployeeEng/SiteAssets/IWPB/General';
    
    console.log('🔧 Cleaning folder path with domain fix:', folderPath);
    
    // Step 1: Remove domain duplications in paths
    let cleanPath = folderPath
      .replace(/teams\.global\.hsbc\/teams\.global\.hsbc\//gi, 'teams.global.hsbc/')
      .replace(/https:\/\/teams\.global\.hsbc\/teams\.global\.hsbc\//gi, 'https://teams.global.hsbc/')
      .replace(/https:\/\/teams\.global\.hsbc\/https:\/\/teams\.global\.hsbc\//gi, 'https://teams.global.hsbc/')
      .replace(/\/teams\.global\.hsbc\/teams\.global\.hsbc\//gi, '/teams.global.hsbc/');
    
    // Step 2: Remove path segment duplications
    cleanPath = cleanPath
      .replace(/\/sites\/EmployeeEng\/sites\/EmployeeEng\//gi, '/sites/EmployeeEng/')
      .replace(/\/Sites\/EmployeeEng\/Sites\/EmployeeEng\//gi, '/sites/EmployeeEng/')
      .replace(/\/sites\/employeeeng\/sites\/employeeeng\//gi, '/sites/EmployeeEng/')
      .replace(/\/siteassets\/siteassets\//gi, '/SiteAssets/')
      .replace(/\/SiteAssets\/SiteAssets\//gi, '/SiteAssets/')
      .replace(/\/\/+/g, '/'); // Remove multiple consecutive slashes
    
    // Step 3: Fix case sensitivity
    cleanPath = cleanPath
      .replace(/\/sites\/employeeeng\//gi, '/sites/EmployeeEng/')
      .replace(/\/siteassets\//gi, '/SiteAssets/');
    
    // Step 4: Remove any protocol prefixes from folder paths
    cleanPath = cleanPath.replace(/^https?:\/\/[^\/]+/gi, '');
    
    // Step 5: Ensure proper structure
    if (!cleanPath.startsWith('/sites/EmployeeEng/')) {
      if (cleanPath.startsWith('/')) {
        cleanPath = `/sites/EmployeeEng${cleanPath}`;
      } else {
        cleanPath = `/sites/EmployeeEng/${cleanPath}`;
      }
    }
    
    // Step 6: Validate path structure
    if (cleanPath.includes('undefined') || cleanPath.includes('null')) {
      console.warn('⚠️ Invalid folder path detected, using fallback');
      cleanPath = '/sites/EmployeeEng/SiteAssets/IWPB/General';
    }
    
    console.log('✅ Folder path cleaned (domain fixed):', cleanPath);
    return cleanPath;
  }

  // ✅ NEW: Construct clean SharePoint URL without any duplication
  constructCleanSharePointUrl(basePath, relativePath, fileName) {
    // Clean base path and remove domain duplication
    let cleanBasePath = basePath
      .replace(/teams\.global\.hsbc\/teams\.global\.hsbc\//gi, 'teams.global.hsbc/')
      .replace(/https:\/\/teams\.global\.hsbc\/teams\.global\.hsbc\//gi, 'https://teams.global.hsbc/')
      .replace(/\/+$/, ''); // Remove trailing slashes
    
    // Clean relative path
    let cleanRelativePath = relativePath
      .replace(/^\/+/, '') // Remove leading slashes
      .replace(/\/+$/, '') // Remove trailing slashes
      .replace(/\/\/+/g, '/') // Remove multiple consecutive slashes
      .replace(/teams\.global\.hsbc\/teams\.global\.hsbc\//gi, 'teams.global.hsbc/');
    
    // Clean filename
    let cleanFileName = fileName ? fileName.replace(/^\/+/, '') : '';
    
    // Construct final URL
    let finalUrl;
    if (cleanBasePath.startsWith('http')) {
      if (cleanFileName) {
        finalUrl = `${cleanBasePath}${cleanRelativePath ? '/' + cleanRelativePath : ''}/${cleanFileName}`;
      } else {
        finalUrl = `${cleanBasePath}${cleanRelativePath ? '/' + cleanRelativePath : ''}`;
      }
    } else {
      if (cleanFileName) {
        finalUrl = `https://teams.global.hsbc${cleanBasePath}${cleanRelativePath ? '/' + cleanRelativePath : ''}/${cleanFileName}`;
      } else {
        finalUrl = `https://teams.global.hsbc${cleanBasePath}${cleanRelativePath ? '/' + cleanRelativePath : ''}`;
      }
    }
    
    // Final cleanup - fix double slashes except after protocol
    finalUrl = finalUrl.replace(/([^:]\/)\/+/g, '$1');
    
    // Ensure protocol is correct
    if (finalUrl.startsWith('http:/')) {
      finalUrl = finalUrl.replace(/^http:\/([^\/])/, 'https://$1');
    }
    
    console.log('🔧 Constructed clean SharePoint URL:', {
      basePath: cleanBasePath,
      relativePath: cleanRelativePath,
      fileName: cleanFileName,
      finalUrl: finalUrl
    });
    
    return finalUrl;
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

      // Clean the URL first using enhanced cleaning
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

  // ✅ COMPLETELY FIXED: Amendment with comprehensive URL handling and domain duplication fix
  async amendProcedureInSharePoint(amendmentData, file) {
    const sharePointUrl = 'https://teams.global.hsbc/sites/EmployeeEng';
    
    try {
      console.log('🔄 Starting ENHANCED SharePoint amendment with DOMAIN DUPLICATION FIX...');
      console.log('📂 Amendment data received:', amendmentData);

      // ✅ STEP 1: Clean and validate all paths with domain duplication fix
      let targetFolderPath = this.cleanAndValidateFolderPath(amendmentData.fullFolderPath);
      const sharePointPath = amendmentData.sharePointPath;
      
      console.log('🔍 DOMAIN DUPLICATION FIX - path validation:');
      console.log('   Original path:', amendmentData.fullFolderPath);
      console.log('   Cleaned path:', targetFolderPath);
      console.log('   SharePoint path:', sharePointPath);
      
      // Final validation for domain duplication
      if (targetFolderPath.includes('teams.global.hsbc/teams.global.hsbc/')) {
        console.error('❌ CRITICAL: Domain duplication still detected:', targetFolderPath);
        throw new Error('Domain duplication detected after cleaning. Please check folder path construction.');
      }

      console.log('✅ Using DOMAIN-CLEANED HSBC URLs with amendment tracking:');
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

      // ✅ STEP 4: Generate unique filename and upload file with domain duplication fix
      console.log(`📤 Preparing upload to DOMAIN-CLEANED HSBC path: ${targetFolderPath}`);
      
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
      console.log(`📤 Upload URL (domain duplication fixed): ${uploadUrl}`);

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

      // ✅ STEP 5: Build comprehensive amendment history with CLEAN URLs
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

      // ✅ CREATE CLEAN DOCUMENT URL WITHOUT DOMAIN DUPLICATION
      const cleanDocumentUrl = this.constructCleanSharePointUrl(
        'https://teams.global.hsbc',
        uploadResult.d.ServerRelativeUrl,
        ''
      );
      
      console.log('🔧 Constructed CLEAN document URL:', cleanDocumentUrl);
      
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
        documentUrl: cleanDocumentUrl, // ✅ CLEAN URL WITHOUT DOMAIN DUPLICATION
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

      console.log('📋 Built ENHANCED amendment tracking data with CLEAN URLs:');
      console.log(`   Amendment #: ${newAmendmentCount}`);
      console.log(`   Previous Score: ${currentScore}%`);
      console.log(`   New Score: ${newScore}%`);
      console.log(`   Score Change: ${newScore - currentScore > 0 ? '+' : ''}${newScore - currentScore}%`);
      console.log(`   Original filename: ${file.name}`);
      console.log(`   Saved filename: ${uniqueFileName}`);
      console.log(`   File renamed: ${isFileRenamed}`);
      console.log(`   Document URL (CLEAN): ${cleanDocumentUrl}`);

      // ✅ STEP 6: Update procedure with comprehensive data and CLEAN URLs
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
        
        // ✅ CLEAN document info WITHOUT DOMAIN DUPLICATION
        DocumentLink: uploadResult.d.ServerRelativeUrl, // SharePoint relative URL
        SharePointURL: cleanDocumentUrl, // ✅ CLEAN full URL without domain duplication
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

      console.log('📝 Updating procedure with DOMAIN-CLEANED amendment tracking...');

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

      console.log('✅ Procedure updated with DOMAIN-CLEANED amendment tracking');

      // ✅ STEP 7: Enhanced audit log with clean URLs
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
          documentUrl: cleanDocumentUrl, // ✅ CLEAN URL in audit log
          amendedBy: amendmentData.amended_by_name,
          totalAmendments: newAmendmentCount,
          urlCleaned: true,
          domainDuplicationFixed: true
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

      console.log('✅ ENHANCED audit log entry created with CLEAN URLs');
      console.log('✅ Amendment completed with COMPREHENSIVE tracking and DOMAIN DUPLICATION FIX');

      return {
        success: true,
                message: 'Procedure amended successfully with comprehensive tracking and domain duplication fix',
        amendmentNumber: newAmendmentCount,
        previousScore: currentScore,
        newScore: newScore,
        scoreChange: newScore - currentScore,
        uploadedTo: targetFolderPath,
        sharePointPath: sharePointPath,
        actualSubFolder: amendmentData.subFolder,
        documentUrl: cleanDocumentUrl, // ✅ Returns CLEAN URL without domain duplication
        amendmentHistory: amendmentHistory,
        timelineEntry: timelineEntry,
        originalFileName: file.name,
        savedFileName: uniqueFileName,
        fileRenamed: isFileRenamed,
        urlCleaned: true,
        domainDuplicationFixed: true
      };

    } catch (error) {
      console.error('❌ ENHANCED amendment with domain fix failed:', error);
      return {
        success: false,
        message: error.message || 'Amendment failed',
        error: error,
        attempted_url: sharePointUrl
      };
    }
  }

  // ✅ ENHANCED: Upload amendment with domain duplication fix
  async uploadAmendmentWithAnalysis(amendmentData, file) {
    try {
      console.log('🚀 Starting amendment upload with ENHANCED AI analysis and DOMAIN DUPLICATION FIX...');
      
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
      
      // 3. ✅ CLEAN: Use existing SiteAssets folder path with domain duplication fix
      const cleanedSharePointPath = amendmentData.sharePointPath || 'SiteAssets/IWPB/General';
      console.log('📂 Using DOMAIN-CLEANED SiteAssets SharePoint path:', cleanedSharePointPath);
      
      // 4. Upload with enhanced file naming and domain duplication fix
      const fileUploadResult = await this.uploadFileToSharePointWithUniqueName(file, cleanedSharePointPath, requestDigest);
      
      // 5. Create amended procedure list item with CLEAN URLs
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
        SharePointURL: fileUploadResult?.webUrl || '', // ✅ This will be CLEAN without domain duplication
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
     
      // 7. Create audit log entry with CLEAN URLs
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
          urlCleaned: true,
          domainDuplicationFixed: true
        }),
        ProcedureId: procedureResult.Id,
        LOB: amendmentData.originalLOB
      }, requestDigest);

      // ✅ CONSTRUCT CLEAN SharePoint URL with domain duplication fix
      const sharePointUrl = fileUploadResult?.webUrl || this.constructCleanSharePointUrl(
        sharePointPaths.baseSite,
        cleanedSharePointPath,
        fileUploadResult?.actualFileName || file.name
      );
      const finalCleanUrl = this.cleanAndValidateUrl(sharePointUrl);
     
      console.log('🎉 Amendment upload completed successfully with DOMAIN DUPLICATION FIX:', {
        newProcedureId: procedureResult.Id,
        originalProcedureId: amendmentData.procedureId,
        qualityScore: analysisResult.score,
        sharePointUrl: finalCleanUrl,
        sharePointPath: cleanedSharePointPath,
        actualSubfolder: amendmentData.subFolder,
        fileRenamed: fileUploadResult?.fileRenamed,
        urlCleaned: true,
        domainDuplicationFixed: true
      });

      return {
        success: true,
        procedureId: procedureResult.Id,
        qualityScore: analysisResult.score,
        templateCompliance: analysisResult.details?.summary?.templateCompliance,
        sharePointPath: cleanedSharePointPath,
        sharePointUrl: finalCleanUrl, // ✅ CLEAN URL without domain duplication
        analysisResult: analysisResult,
        message: `Amendment uploaded successfully to domain-cleaned path: SiteAssets/${amendmentData.lobFolder}/${amendmentData.subFolder}`,
        fileRenamed: fileUploadResult?.fileRenamed,
        actualFileName: fileUploadResult?.actualFileName,
        urlCleaned: true,
        domainDuplicationFixed: true
      };
     
    } catch (error) {
      console.error('❌ Upload amendment with domain fix failed:', error);
      throw new Error(`Amendment upload failed: ${error.message}`);
    }
  }

  // ✅ UPDATE ORIGINAL PROCEDURE RECORD
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
  // ✅ ENHANCED SHAREPOINT INTEGRATION WITH DOMAIN DUPLICATION FIX
  // ============================================================================

  async uploadProcedureWithAnalysis(formData, file) {
    try {
      console.log('🚀 Starting procedure upload with AI analysis and DOMAIN DUPLICATION FIX...');
      
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
      
      // 3. ✅ CLEAN: Generate SiteAssets path with domain duplication fix
      const sharePointPath = this.generateSiteAssetsPath(formData.lob, formData.procedure_subsection);
      console.log('📂 Generated DOMAIN-CLEAN SiteAssets path for new upload:', sharePointPath);
      
      // 4. Upload with enhanced file naming and domain duplication fix
      const fileUploadResult = await this.uploadFileToSharePointWithUniqueName(file, sharePointPath, requestDigest);
      
      // 5. Create procedure list item with comprehensive AI data and CLEAN URLs
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
        SharePointURL: fileUploadResult?.webUrl || '', // ✅ This will be CLEAN without domain duplication
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
     
      // 6. Create comprehensive audit log entry with CLEAN URLs
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
          urlCleaned: true,
          domainDuplicationFixed: true
        }),
        ProcedureId: procedureResult.Id,
        LOB: formData.lob
      }, requestDigest);

      // ✅ CONSTRUCT CLEAN SharePoint URL with domain duplication fix
      const sharePointUrl = fileUploadResult?.webUrl || this.constructCleanSharePointUrl(
        sharePointPaths.baseSite,
        sharePointPath,
        fileUploadResult?.actualFileName || file.name
      );
      const finalCleanUrl = this.cleanAndValidateUrl(sharePointUrl);
     
      console.log('🎉 Procedure upload completed successfully with DOMAIN DUPLICATION FIX:', {
        procedureId: procedureResult.Id,
        qualityScore: analysisResult.score,
        sharePointUrl: finalCleanUrl,
        sharePointPath: sharePointPath,
        selectedSubsection: formData.procedure_subsection,
        fileRenamed: fileUploadResult?.fileRenamed,
        urlCleaned: true,
        domainDuplicationFixed: true
      });

      return {
        success: true,
        procedureId: procedureResult.Id,
        qualityScore: analysisResult.score,
        templateCompliance: analysisResult.details?.summary?.templateCompliance,
        sharePointPath: sharePointPath,
        sharePointUrl: finalCleanUrl, // ✅ CLEAN URL without domain duplication
        analysisResult: analysisResult,
        fileRenamed: fileUploadResult?.fileRenamed,
        actualFileName: fileUploadResult?.actualFileName,
        urlCleaned: true,
        domainDuplicationFixed: true
      };
     
    } catch (error) {
      console.error('❌ Upload procedure with domain fix failed:', error);
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
    
    console.log(`📂 Generated DOMAIN-CLEAN SiteAssets path: ${path} (LOB: ${lob}, Subsection: ${subsection})`);
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

  // ✅ ENHANCED: Upload with smart file naming and DOMAIN DUPLICATION FIX
  async uploadFileToSharePointWithUniqueName(file, sharePointPath, requestDigest) {
    try {
      // ✅ CLEAN: Upload URL with DOMAIN DUPLICATION FIX
      const cleanSharePointPath = sharePointPath
        .replace(/^\/+/, '') // Remove leading slashes
        .replace(/\/+$/, '') // Remove trailing slashes
        .replace(/teams\.global\.hsbc\/teams\.global\.hsbc\//gi, 'teams.global.hsbc/')
        .replace(/siteassets\/siteassets\//gi, 'SiteAssets/')
        .replace(/SiteAssets\/SiteAssets\//gi, 'SiteAssets/');
      
      // Construct clean base path
      const basePath = `/sites/EmployeeEng/${cleanSharePointPath}`;
      const cleanBasePath = this.cleanAndValidateFolderPath(basePath);
      
      // Generate unique filename
      const uniqueFileResult = await this.generateUniqueFileName(file.name, cleanBasePath, sharePointPaths.baseSite, requestDigest);
      const uniqueFileName = uniqueFileResult.fileName;
      const isFileRenamed = uniqueFileResult.isRenamed;
      
      // ✅ CONSTRUCT UPLOAD URL WITHOUT DOMAIN DUPLICATION
      const baseUrl = sharePointPaths.baseSite.replace(/\/+$/, ''); // Remove trailing slashes
      const uploadUrl = `${baseUrl}/_api/web/GetFolderByServerRelativeUrl('${cleanBasePath}')/Files/add(url='${encodeURIComponent(uniqueFileName)}',overwrite=false)`;
     
      console.log('📤 Uploading with DOMAIN DUPLICATION FIX:', {
        cleanSharePointPath,
        cleanBasePath,
        uploadUrl,
        uniqueFileName,
        isFileRenamed
      });

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
      
      // ✅ CONSTRUCT CLEAN WEB URL WITHOUT DOMAIN DUPLICATION
      const webUrl = this.constructCleanSharePointUrl(
        'https://teams.global.hsbc',
        cleanBasePath,
        uniqueFileName
      );
     
      console.log('✅ File uploaded with CLEAN URLs (DOMAIN DUPLICATION FIXED):', {
        serverRelativeUrl: result.d.ServerRelativeUrl,
        webUrl: webUrl,
        actualFileName: uniqueFileName,
        fileRenamed: isFileRenamed
      });
     
      return {
        serverRelativeUrl: result.d.ServerRelativeUrl,
        webUrl: webUrl, // ✅ CLEAN URL without domain duplication
        actualFileName: uniqueFileName,
        fileRenamed: isFileRenamed
      };
     
    } catch (error) {
      console.error('❌ File upload with domain fix failed:', error);
      throw new Error(`File upload to SharePoint SiteAssets failed: ${error.message}`);
    }
  }

  // ✅ LEGACY: Keep existing method for compatibility with DOMAIN DUPLICATION FIX
  async uploadFileToSharePoint(file, sharePointPath, requestDigest) {
    try {
      // ✅ CLEAN: Upload URL with DOMAIN DUPLICATION FIX
      const cleanSharePointPath = sharePointPath
        .replace(/^\/+/, '') // Remove leading slashes
        .replace(/\/+$/, '') // Remove trailing slashes
        .replace(/teams\.global\.hsbc\/teams\.global\.hsbc\//gi, 'teams.global.hsbc/');
      
      const basePath = `/sites/EmployeeEng/${cleanSharePointPath}`;
      const cleanBasePath = this.cleanAndValidateFolderPath(basePath);
      
      const uploadUrl = `${sharePointPaths.baseSite}/_api/web/GetFolderByServerRelativeUrl('${cleanBasePath}')/Files/add(url='${encodeURIComponent(file.name)}',overwrite=true)`;
     
      console.log('📤 Uploading to DOMAIN-CLEAN SiteAssets path:', uploadUrl);

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
      
      // ✅ CONSTRUCT CLEAN WEB URL WITHOUT DOMAIN DUPLICATION
      const webUrl = this.constructCleanSharePointUrl(
        'https://teams.global.hsbc',
        cleanBasePath,
        file.name
      );
     
      console.log('✅ File uploaded to DOMAIN-CLEAN SiteAssets SharePoint:', result.d.ServerRelativeUrl);
     
      return {
        serverRelativeUrl: result.d.ServerRelativeUrl,
        webUrl: webUrl // ✅ CLEAN URL without domain duplication
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
