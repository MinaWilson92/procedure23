// routes/procedures.js - Procedure routes

const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const config = require('../config/config');
const { analyzeDocument } = require('../services/documentAnalysis');
const { addAuditLog } = require('../utils/auditLog');
const SharePointService = require('../services/sharepoint');

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// API: Get all procedures
router.get('/', (req, res) => {
  try {
    const data = fs.readFileSync(config.PROCEDURES_PATH);
    const procedures = JSON.parse(data);
    
    // Filter based on user role and ownership
    let filteredProcedures = procedures;
    
    if (req.userRole !== 'admin') {
      // Non-admin users can only see procedures they own or are associated with
      filteredProcedures = procedures.filter(proc => 
        proc.primary_owner === req.staffId || 
        proc.secondary_owner === req.staffId ||
        proc.uploaded_by === req.staffId
      );
    }
    
    console.log('📋 Procedures retrieved:', {
      totalInSystem: procedures.length,
      returnedToUser: filteredProcedures.length,
      userRole: req.userRole,
      staffId: req.staffId
    });
    
    res.json(filteredProcedures);
  } catch (err) {
    console.error('❌ Error reading procedures:', err);
    res.status(500).json({ 
      message: 'Error loading procedures',
      error: err.message 
    });
  }
});

// API: Add a new procedure with document analysis and SharePoint integration
router.post('/', upload.single('file'), async (req, res) => {
  try {
    console.log('📤 New procedure submission started:', {
      user: req.staffId,
      fileName: req.file?.originalname,
      procedureName: req.body.name
    });

    let analysis = { score: 0, details: {}, aiRecommendations: [] };
    let sharePointResult = null;
    
    if (req.file) {
      console.log('📊 Starting document analysis...');
      analysis = await analyzeDocument(req.file.path, req.file.mimetype);
      console.log('✅ Document analysis completed:', {
        score: analysis.score,
        recommendations: analysis.aiRecommendations.length
      });
    }

    // Check if document meets quality threshold
    if (analysis.score < config.DOCUMENT_ANALYSIS.MINIMUM_QUALITY_SCORE) {
      console.log('❌ Document rejected - quality too low:', analysis.score);
      
      // Delete the uploaded file since it doesn't meet quality standards
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      
      return res.status(200).json({ 
        message: `Document quality score (${analysis.score}%) is below the required minimum of ${config.DOCUMENT_ANALYSIS.MINIMUM_QUALITY_SCORE}%.`,
        analysis: analysis,
        accepted: false
      });
    }

    // Document meets quality standards, proceed with saving
    const data = JSON.parse(fs.readFileSync(config.PROCEDURES_PATH));
    const newId = data.length ? data[data.length - 1].id + 1 : 1;

    const newProcedure = {
      id: newId,
      name: req.body.name || 'Unnamed Procedure',
      expiry: req.body.expiry || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      primary_owner: req.body.primary_owner || req.staffId,
      primary_owner_email: req.body.primary_owner_email || `${req.staffId}@hsbc.com`,
      secondary_owner: req.body.secondary_owner || '',
      secondary_owner_email: req.body.secondary_owner_email || '',
      lob: req.body.lob || 'General',
      procedure_subsection: req.body.procedure_subsection || '',
      sharepoint_folder: req.body.sharepoint_folder || '',
      file_link: req.file ? `/uploads/${req.file.filename}` : '',
      original_filename: req.file ? req.file.originalname : '',
      file_size: req.file ? req.file.size : 0,
      score: analysis.score,
      quality_details: analysis.details,
      ai_recommendations: analysis.aiRecommendations,
      status: "active",
      uploaded_by: req.staffId || 'Unknown',
      uploaded_at: new Date().toISOString(),
      sharepoint_uploaded: false,
      sharepoint_url: null
    };

    // Attempt SharePoint upload if file exists and user wants it
    if (req.file && req.body.upload_to_sharepoint !== 'false') {
      try {
        console.log('📤 Attempting SharePoint upload...');
        
        const sharepointService = new SharePointService();
        sharePointResult = await sharepointService.uploadFile(req, newProcedure);
        
        if (sharePointResult && sharePointResult.success) {
          // Update procedure with SharePoint info
          newProcedure.sharepoint_uploaded = true;
          newProcedure.sharepoint_url = sharePointResult.webUrl;
          newProcedure.sharepoint_folder_path = sharePointResult.folderPath;
          newProcedure.sharepoint_filename = sharePointResult.fileName;
          
          console.log('✅ SharePoint upload successful:', sharePointResult.webUrl);
          
          addAuditLog('SHAREPOINT_AUTO_UPLOAD', {
            procedureId: newId,
            fileName: sharePointResult.fileName,
            sharePointUrl: sharePointResult.webUrl
          }, req.staffId);
        }
      } catch (spError) {
        console.error('❌ SharePoint upload failed (continuing with procedure save):', spError.message);
        newProcedure.sharepoint_error = spError.message;
      }
    }

    // Save procedure to database
    data.push(newProcedure);
    fs.writeFileSync(config.PROCEDURES_PATH, JSON.stringify(data, null, 4));
    
    // Add audit log entry
    addAuditLog('PROCEDURE_CREATED', {
      procedureId: newId,
      procedureName: newProcedure.name,
      score: analysis.score,
      lob: newProcedure.lob,
      sharePointUploaded: newProcedure.sharepoint_uploaded,
      uploadedBy: req.staffId
    }, req.staffId);
    
    console.log('✅ Procedure created successfully:', {
      id: newId,
      name: newProcedure.name,
      score: analysis.score,
      sharePointUploaded: newProcedure.sharepoint_uploaded
    });
    
    const response = { 
      message: 'Procedure uploaded successfully',
      analysis: analysis,
      procedure: newProcedure,
      accepted: true
    };

    // Add SharePoint info to response if uploaded
    if (sharePointResult && sharePointResult.success) {
      response.sharepoint_upload_success = true;
      response.sharepoint_url = sharePointResult.webUrl;
      response.sharepoint_result = sharePointResult;
    }
    
    res.status(201).json(response);
    
  } catch (err) {
    console.error('❌ Error adding procedure:', err);
    
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      message: 'Error adding procedure: ' + err.message,
      error: err.message,
      accepted: false
    });
  }
});

// API: Get single procedure details
router.get('/:id', (req, res) => {
  try {
    const procedures = JSON.parse(fs.readFileSync(config.PROCEDURES_PATH));
    const procedure = procedures.find(p => p.id === parseInt(req.params.id));
    
    if (!procedure) {
      return res.status(404).json({ message: 'Procedure not found' });
    }

    // Check if user has access to this procedure
    const hasAccess = req.userRole === 'admin' || 
                     procedure.primary_owner === req.staffId ||
                     procedure.secondary_owner === req.staffId ||
                     procedure.uploaded_by === req.staffId;

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied to this procedure' });
    }

    // Enrich procedure data
    const now = new Date();
    const expiryDate = new Date(procedure.expiry);
    const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

    const enrichedProcedure = {
      ...procedure,
      daysUntilExpiry,
      isExpired: daysUntilExpiry < 0,
      isExpiringSoon: daysUntilExpiry >= 0 && daysUntilExpiry <= 30,
      qualityLevel: (procedure.score || 0) >= 80 ? 'High' : (procedure.score || 0) >= 60 ? 'Medium' : 'Low',
      accessLevel: req.userRole === 'admin' ? 'admin' : 'owner'
    };

    res.json(enrichedProcedure);

  } catch (err) {
    console.error('❌ Error getting procedure details:', err);
    res.status(500).json({ 
      message: 'Error loading procedure details',
      error: err.message 
    });
  }
});

module.exports = router;