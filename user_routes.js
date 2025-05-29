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