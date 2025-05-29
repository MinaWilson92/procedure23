// routes/user.js - User routes
const express = require('express');
const fs = require('fs');
const router = express.Router();
const config = require('../config/config');

// API: User dashboard data endpoint
router.get('/dashboard', (req, res) => {
  try {
    if (!req.staffId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    console.log('📊 Getting dashboard data for user:', req.staffId);

    const procedures = JSON.parse(fs.readFileSync(config.PROCEDURES_PATH));
    
    // Filter procedures owned by the current user
    const userProcedures = procedures.filter(proc => 
      proc.primary_owner === req.staffId || 
      proc.secondary_owner === req.staffId ||
      proc.uploaded_by === req.staffId
    );

    const now = new Date();
    const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

    // Calculate user-specific stats
    const stats = {
      total: userProcedures.length,
      expiringSoon: userProcedures.filter(p => {
        const expiry = new Date(p.expiry);
        return expiry > now && expiry - now < THIRTY_DAYS;
      }).length,
      expired: userProcedures.filter(p => new Date(p.expiry) < now).length,
      highQuality: userProcedures.filter(p => (p.score || 0) >= 80).length
    };

    // Generate recent activity for user's procedures
    const recentActivity = userProcedures
      .sort((a, b) => new Date(b.uploaded_at || 0) - new Date(a.uploaded_at || 0))
      .slice(0, 5)
      .map(proc => {
        const expiryDate = new Date(proc.expiry);
        const isExpired = expiryDate < now;
        const isExpiringSoon = !isExpired && (expiryDate - now) < THIRTY_DAYS;
        
        let activityType = 'update';
        let action = 'Procedure updated';
        
        if (isExpired) {
          activityType = 'expired';
          action = 'Procedure expired';
        } else if (isExpiringSoon) {
          activityType = 'warning';
          action = 'Expiring soon';
        } else if (proc.uploaded_by === req.staffId) {
          activityType = 'assignment';
          action = 'Procedure uploaded';
        }

        return {
          id: proc.id,
          type: activityType,
          action: action,
          procedure: proc.name,
          score: proc.score,
          time: proc.uploaded_at ? new Date(proc.uploaded_at).toLocaleDateString() : 'Unknown'
        };
      });

    // User info from server middleware
    const userInfo = {
      displayName: req.userInfo?.displayName || req.staffId,
      email: req.userInfo?.mail || `${req.staffId}@hsbc.com`,
      adUserId: req.userInfo?.adUserId || req.staffId,
      department: req.userInfo?.department || null,
      jobTitle: req.userInfo?.jobTitle || null,
      staffId: req.staffId,
      role: req.userRole
    };

    console.log('✅ Dashboard data prepared:', {
      totalProcedures: stats.total,
      expiringSoon: stats.expiringSoon,
      highQuality: stats.highQuality,
      recentActivityCount: recentActivity.length
    });

    res.json({
      stats,
      recentActivity,
      userInfo
    });

  } catch (err) {
    console.error('❌ Error getting user dashboard data:', err);
    res.status(500).json({ 
      message: 'Error loading dashboard data',
      error: err.message 
    });
  }
});

// API: Get user's procedures
router.get('/procedures', (req, res) => {
  try {
    if (!req.staffId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    console.log('📋 Getting procedures for user:', req.staffId);

    const procedures = JSON.parse(fs.readFileSync(config.PROCEDURES_PATH));
    
    // Filter procedures owned by the current user
    const userProcedures = procedures.filter(proc => 
      proc.primary_owner === req.staffId || 
      proc.secondary_owner === req.staffId ||
      proc.uploaded_by === req.staffId
    );

    // Add calculated fields
    const now = new Date();
    const enrichedProcedures = userProcedures.map(proc => {
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

    console.log('✅ User procedures retrieved:', {
      totalCount: enrichedProcedures.length,
      expired: enrichedProcedures.filter(p => p.isExpired).length,
      expiringSoon: enrichedProcedures.filter(p => p.isExpiringSoon).length
    });

    res.json(enrichedProcedures);

  } catch (err) {
    console.error('❌ Error getting user procedures:', err);
    res.status(500).json({ 
      message: 'Error loading user procedures',
      error: err.message 
    });
  }
});

module.exports = router;

// routes/admin.js - Admin routes
const express = require('express');
const fs = require('fs');
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
      const filePath = require('path').join(__dirname, '..', deletedProcedure.file_link);
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

module.exports = router;