// routes/files.js - File serving routes
const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const config = require('../config/config');
const { addAuditLog } = require('../utils/auditLog');

// API endpoint to download files
router.get('/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '..', 'uploads', filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Check if user has access to this file
    const procedures = JSON.parse(fs.readFileSync(config.PROCEDURES_PATH));
    const procedure = procedures.find(p => p.file_link && p.file_link.includes(filename));
    
    if (!procedure) {
      return res.status(404).json({ message: 'File not associated with any procedure' });
    }

    // Check access permissions
    const hasAccess = req.userRole === 'admin' || 
                     procedure.primary_owner === req.staffId ||
                     procedure.secondary_owner === req.staffId ||
                     procedure.uploaded_by === req.staffId;

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied to this file' });
    }

    // Log file access
    addAuditLog('FILE_ACCESS', {
      filename: filename,
      procedureId: procedure.id,
      procedureName: procedure.name,
      accessedBy: req.staffId
    }, req.staffId);

    // Set appropriate headers
    res.setHeader('Content-Disposition', `attachment; filename="${procedure.original_filename || filename}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

  } catch (err) {
    console.error('❌ Error serving file:', err);
    res.status(500).json({ 
      message: 'Error accessing file',
      error: err.message 
    });
  }
});

module.exports = router;