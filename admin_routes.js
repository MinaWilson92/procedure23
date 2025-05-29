// routes/admin.js - Admin routes
const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const config = require('../config/config');
const { addAuditLog } = require('../utils/auditLog');

// Middleware to check admin access
const requireAdmin = (req, res, next) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// Apply admin middleware to all routes
router.use(requireAdmin);

// API: Get all procedures (admin only)
router.get('/procedures', (req, res) => {
  try {
    console.log('🔧 Admin getting all procedures');

    const procedures = JSON.parse(fs.readFileSync(config.PROCEDURES_PATH));
    
    // Add calculated fields for admin view
    const now = new Date();
    const enrichedProcedures = procedures.map(proc => {
      const expiryDate = new Date(proc.expiry);
      const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
      
      return {
        ...proc,
        daysUntilExpiry,
        isExpired: daysUntilExpiry < 0,
        isExpiringSoon: daysUntilExpiry >= 0 && daysUntilExpiry <= 30,
        qualityLevel: (proc.score || 0) >= 80 ? 'High' : (proc.score || 0) >= 60 ? 'Medium' : 'Low'
      };
    });

    console.log('✅ Admin procedures retrieved:', {
      totalCount: enrichedProcedures.length,
      expired: enrichedProcedures.filter(p => p.isExpired).length,
      expiringSoon: enrichedProcedures.filter(p => p.isExpiringSoon).length,
      highQuality: enrichedProcedures.filter(p => (p.score || 0) >= 80).length
    });

    res.json(enrichedProcedures);

  } catch (err) {
    console.error('❌ Error getting admin procedures:', err);
    res.status(500).json({ 
      message: 'Error loading procedures',
      error: err.message 
    });
  }
});

// API: Update procedure (admin only)
router.put('/procedures/:id', (req, res) => {
  try {
    const procedures = JSON.parse(fs.readFileSync(config.PROCEDURES_PATH));
    const procedureIndex = procedures.findIndex(p => p.id === parseInt(req.params.id));
    
    if (procedureIndex === -1) {
      return res.status(404).json({ message: 'Procedure not found' });
    }

    const originalProcedure = procedures[procedureIndex];
    
    // Update procedure with new data
    const updatedProcedure = {
      ...originalProcedure,
      ...req.body,
      id: originalProcedure.id, // Preserve ID
      updated_by: req.staffId,
      updated_at: new Date().toISOString()
    };

    procedures[procedureIndex] = updatedProcedure;
    fs.writeFileSync(config.PROCEDURES_PATH, JSON.stringify(procedures, null, 4));

    // Add audit log
    addAuditLog('PROCEDURE_UPDATED', {
      procedureId: updatedProcedure.id,
      procedureName: updatedProcedure.name,
      changes: Object.keys(req.body),
      updatedBy: req.staffId
    }, req.staffId);

    console.log('✅ Procedure updated by admin:', {
      id: updatedProcedure.id,
      name: updatedProcedure.name,
      updatedBy: req.staffId
    });

    res.json({ 
      message: 'Procedure updated successfully',
      procedure: updatedProcedure
    });

  } catch (err) {
    console.error('❌ Error updating procedure:', err);
    res.status(500).json({ 
      message: 'Error updating procedure',
      error: err.message 
    });
  }
});

// API: Delete procedure (admin only)
router.delete('/procedures/:id', (req, res) => {
  try {
    const procedures = JSON.parse(fs.readFileSync(config.PROCEDURES_PATH));
    const procedureIndex = procedures.findIndex(p => p.id === parseInt(req.params.id));
    
    if (procedureIndex === -1) {
      return res.status(404).json({ message: 'Procedure not found' });
    }

    const deletedProcedure = procedures[procedureIndex];
    
    // Remove from array
    procedures.splice(procedureIndex, 1);
    fs.writeFileSync(config.PROCEDURES_PATH, JSON.stringify(procedures, null, 4));

    // Delete associated file if it exists
    if (deletedProcedure.file_link) {
      const filePath = path.join(__dirname, '..', deletedProcedure.file_link);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Add audit log
    addAuditLog('PROCEDURE_DELETED', {
      procedureId: deletedProcedure.id,
      procedureName: deletedProcedure.name,
      deletedBy: req.staffId
    }, req.staffId);

    console.log('✅ Procedure deleted by admin:', {
      id: deletedProcedure.id,
      name: deletedProcedure.name,
      deletedBy: req.staffId
    });

    res.json({ 
      message: 'Procedure deleted successfully',
      deletedProcedure: {
        id: deletedProcedure.id,
        name: deletedProcedure.name
      }
    });

  } catch (err) {
    console.error('❌ Error deleting procedure:', err);
    res.status(500).json({ 
      message: 'Error deleting procedure',
      error: err.message 
    });
  }
});

// API: Get admin dashboard statistics
router.get('/dashboard', (req, res) => {
  try {
    console.log('📊 Getting admin dashboard data');

    const procedures = JSON.parse(fs.readFileSync(config.PROCEDURES_PATH));
    const auditLog = JSON.parse(fs.readFileSync(config.AUDIT_LOG_PATH));
    
    const now = new Date();
    const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

    // Calculate comprehensive statistics
    const stats = {
      totalProcedures: procedures.length,
      activeProcedures: procedures.filter(p => p.status === 'active').length,
      expiredProcedures: procedures.filter(p => new Date(p.expiry) < now).length,
      expiringSoon: procedures.filter(p => {
        const expiry = new Date(p.expiry);
        return expiry > now && expiry - now < THIRTY_DAYS;
      }).length,
      highQualityProcedures: procedures.filter(p => (p.score || 0) >= 80).length,
      mediumQualityProcedures: procedures.filter(p => (p.score || 0) >= 60 && (p.score || 0) < 80).length,
      lowQualityProcedures: procedures.filter(p => (p.score || 0) < 60).length,
      averageQualityScore: procedures.length > 0 ? 
        Math.round(procedures.reduce((sum, p) => sum + (p.score || 0), 0) / procedures.length) : 0,
      sharePointUploaded: procedures.filter(p => p.sharepoint_uploaded === true).length,
      recentUploads: procedures.filter(p => {
        const uploadDate = new Date(p.uploaded_at);
        return now - uploadDate < SEVEN_DAYS;
      }).length
    };

    // LOB breakdown
    const lobStats = {};
    procedures.forEach(proc => {
      const lob = proc.lob || 'Unknown';
      if (!lobStats[lob]) {
        lobStats[lob] = { count: 0, avgScore: 0, expired: 0, expiringSoon: 0 };
      }
      lobStats[lob].count++;
      lobStats[lob].avgScore += proc.score || 0;
      
      const expiry = new Date(proc.expiry);
      if (expiry < now) {
        lobStats[lob].expired++;
      } else if (expiry - now < THIRTY_DAYS) {
        lobStats[lob].expiringSoon++;
      }
    });

    // Calculate average scores for each LOB
    Object.keys(lobStats).forEach(lob => {
      lobStats[lob].avgScore = lobStats[lob].count > 0 ? 
        Math.round(lobStats[lob].avgScore / lobStats[lob].count) : 0;
    });

    // Recent activity from audit log
    const recentActivity = auditLog
      .filter(log => now - new Date(log.timestamp) < SEVEN_DAYS)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10)
      .map(log => ({
        id: log.id,
        action: log.action,
        user: log.userId,
        timestamp: log.timestamp,
        details: log.details
      }));

    console.log('✅ Admin dashboard data prepared:', {
      totalProcedures: stats.totalProcedures,
      expired: stats.expiredProcedures,
      expiringSoon: stats.expiringSoon,
      avgQuality: stats.averageQualityScore
    });

    res.json({
      stats,
      lobStats,
      recentActivity,
      systemHealth: {
        totalUsers: Object.keys(auditLog.reduce((acc, log) => {
          acc[log.userId] = true;
          return acc;
        }, {})).length,
        averageQualityTrend: stats.averageQualityScore >= 75 ? 'improving' : 
                           stats.averageQualityScore >= 60 ? 'stable' : 'needs_attention',
        sharePointIntegration: stats.sharePointUploaded / stats.totalProcedures > 0.5 ? 'good' : 'needs_improvement'
      }
    });

  } catch (err) {
    console.error('❌ Error getting admin dashboard data:', err);
    res.status(500).json({ 
      message: 'Error loading admin dashboard data',
      error: err.message 
    });
  }
});

// API: Get audit log (admin only)
router.get('/audit-log', (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const action = req.query.action;
    const userId = req.query.userId;

    console.log('📋 Getting audit log:', { page, limit, action, userId });

    let auditLog = JSON.parse(fs.readFileSync(config.AUDIT_LOG_PATH));
    
    // Filter by action if specified
    if (action) {
      auditLog = auditLog.filter(log => log.action === action);
    }
    
    // Filter by user if specified
    if (userId) {
      auditLog = auditLog.filter(log => log.userId === userId);
    }
    
    // Sort by timestamp (newest first)
    auditLog.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedLog = auditLog.slice(startIndex, endIndex);
    
    res.json({
      logs: paginatedLog,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(auditLog.length / limit),
        totalRecords: auditLog.length,
        hasNext: endIndex < auditLog.length,
        hasPrevious: page > 1
      },
      filters: {
        action,
        userId
      }
    });

  } catch (err) {
    console.error('❌ Error getting audit log:', err);
    res.status(500).json({ 
      message: 'Error loading audit log',
      error: err.message 
    });
  }
});

// API: Export procedures data (admin only)
router.get('/export', (req, res) => {
  try {
    const format = req.query.format || 'json';
    const procedures = JSON.parse(fs.readFileSync(config.PROCEDURES_PATH));
    
    console.log('📤 Exporting procedures data:', { format, count: procedures.length });

    if (format === 'csv') {
      // Generate CSV
      const csvHeader = 'ID,Name,LOB,Primary Owner,Secondary Owner,Expiry,Score,Status,Upload Date,SharePoint URL\n';
      const csvRows = procedures.map(proc => [
        proc.id,
        `"${proc.name}"`,
        proc.lob,
        proc.primary_owner,
        proc.secondary_owner,
        proc.expiry,
        proc.score || 0,
        proc.status,
        proc.uploaded_at,
        proc.sharepoint_url || ''
      ].join(','));
      
      const csvContent = csvHeader + csvRows.join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="procedures-export-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvContent);
      
    } else {
      // JSON export (default)
      const exportData = {
        exportDate: new Date().toISOString(),
        exportedBy: req.staffId,
        totalRecords: procedures.length,
        procedures: procedures
      };
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="procedures-export-${new Date().toISOString().split('T')[0]}.json"`);
      res.json(exportData);
    }

    // Log export action
    addAuditLog('DATA_EXPORT', {
      format: format,
      recordCount: procedures.length,
      exportedBy: req.staffId
    }, req.staffId);

  } catch (err) {
    console.error('❌ Error exporting data:', err);
    res.status(500).json({ 
      message: 'Error exporting data',
      error: err.message 
    });
  }
});

module.exports = router;