// server.js - Upload endpoint using your analyzeDocument logic
app.post('/api/upload-procedure', upload.single('file'), async (req, res) => {
  try {
    console.log('🚀 SharePoint Upload with HSBC AI Analysis');
    
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      });
    }

    const {
      name, expiry, primary_owner, primary_owner_email,
      secondary_owner, secondary_owner_email, lob, procedure_subsection
    } = req.body;

    // Validate required fields
    if (!name || !primary_owner || !lob || !procedure_subsection || !expiry) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // ✅ USE YOUR EXISTING HSBC ANALYSIS LOGIC
    console.log('🔍 Running final HSBC template analysis...');
    const analysisResult = await analyzeDocument(req.file.path, req.file.mimetype);
    
    if (analysisResult.score < 80) {
      fs.unlinkSync(req.file.path);
      
      return res.status(400).json({
        success: false,
        message: `❌ Document does not meet HSBC template standards: ${analysisResult.score}% (minimum 80% required)`,
        analysis: analysisResult,
        templateCompliance: analysisResult.details?.summary?.templateCompliance,
        missingCriticalElements: analysisResult.details?.missingElements
      });
    }

    console.log('✅ Document passes HSBC standards:', {
      score: analysisResult.score,
      templateCompliance: analysisResult.details?.summary?.templateCompliance,
      riskRating: analysisResult.details?.riskRating,
      periodicReview: analysisResult.details?.periodicReview,
      documentOwners: analysisResult.details?.owners
    });

    // Continue with SharePoint upload...
    const sharePointPath = sharePointPaths.getSharePointPath(lob, procedure_subsection);
    const uploadUrl = sharePointPaths.getUploadUrl(lob, procedure_subsection, req.file.originalname);
    
    // SharePoint upload logic (same as before)...
    
    // ✅ STORE YOUR COMPREHENSIVE ANALYSIS RESULTS
    const listItemData = {
      __metadata: { type: 'SP.Data.ProceduresListItem' },
      Title: name,
      ExpiryDate: expiry,
      PrimaryOwner: primary_owner,
      PrimaryOwnerEmail: primary_owner_email || `${primary_owner}@hsbc.com`,
      SecondaryOwner: secondary_owner || '',
      SecondaryOwnerEmail: secondary_owner_email || '',
      LOB: lob,
      ProcedureSubsection: procedure_subsection,
      SharePointPath: sharePointPath,
      DocumentLink: fileServerRelativeUrl,
      OriginalFilename: req.file.originalname,
      FileSize: req.file.size,
      
      // ✅ YOUR COMPREHENSIVE HSBC ANALYSIS RESULTS
      QualityScore: analysisResult.score,
      TemplateCompliance: analysisResult.details?.summary?.templateCompliance || 'Unknown',
      AnalysisDetails: JSON.stringify(analysisResult.details),
      AIRecommendations: JSON.stringify(analysisResult.aiRecommendations || []),
      
      // ✅ EXTRACTED HSBC-SPECIFIC DATA
      RiskRating: analysisResult.details?.riskRating || 'Not Specified',
      PeriodicReview: analysisResult.details?.periodicReview || 'Not Specified',
      DocumentOwners: JSON.stringify(analysisResult.details?.owners || []),
      SignOffDates: JSON.stringify(analysisResult.details?.signOffDates || []),
      Departments: JSON.stringify(analysisResult.details?.departments || []),
      
      // ✅ DETAILED ANALYSIS METRICS
      FoundElements: JSON.stringify(analysisResult.details?.foundElements || []),
      MissingElements: JSON.stringify(analysisResult.details?.missingElements || []),
      HasDocumentControl: analysisResult.details?.hasDocumentControl || false,
      HasRiskAssessment: analysisResult.details?.hasRiskAssessment || false,
      HasPeriodicReview: analysisResult.details?.hasPeriodicReview || false,
      StructureScore: analysisResult.details?.summary?.structureScore || 0,
      GovernanceScore: analysisResult.details?.summary?.governanceScore || 0,
      
      // Upload metadata
      UploadedBy: primary_owner,
      UploadedAt: new Date().toISOString(),
      Status: 'Active',
      SharePointUploaded: true
    };

    // Continue with SharePoint list creation and audit log...

    res.json({
      success: true,
      message: '✅ Procedure uploaded successfully with HSBC AI analysis',
      procedureId: procedureId,
      qualityScore: analysisResult.score,
      templateCompliance: analysisResult.details?.summary?.templateCompliance,
      sharePointPath: sharePointPath,
      sharePointUrl: sharePointUrl,
      analysisResult: analysisResult,
      hsbc: {
        riskRating: analysisResult.details?.riskRating,
        periodicReview: analysisResult.details?.periodicReview,
        documentOwners: analysisResult.details?.owners,
        foundElements: analysisResult.details?.foundElements?.length,
        missingElements: analysisResult.details?.missingElements?.length,
        templateCompliance: analysisResult.details?.summary?.templateCompliance
      }
    });

  } catch (error) {
    console.error('❌ HSBC Upload procedure error:', error);
    
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: 'HSBC procedure upload failed: ' + error.message
    });
  }
});
