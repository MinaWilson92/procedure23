const fs = require('fs');
const path = require('path');

// Export a function that adds routes to the existing app
module.exports = function(app) {
  // Dashboard summary endpoint (if you want to override the one in server.js)
  app.get('/ProceduresHubEG6/api/dashboard-summary', (req, res) => {
    try {
      const now = new Date();
      const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
      const proceduresPath = path.join(__dirname, 'data', 'procedures.json');
      
      // Check if file exists
      if (!fs.existsSync(proceduresPath)) {
        return res.json({ total: 0, expiringSoon: 0, expired: 0, averageScore: 0 });
      }
      
      const procedures = JSON.parse(fs.readFileSync(proceduresPath));

      const total = procedures.length;
      const expiringSoon = procedures.filter(p => {
        const expiry = new Date(p.expiry);
        return expiry > now && expiry - now < THIRTY_DAYS;
      }).length;

      const expired = procedures.filter(p => new Date(p.expiry) < now).length;

      const totalScore = procedures.reduce((sum, p) => sum + (p.score || 0), 0);
      const averageScore = total > 0 ? Math.round(totalScore / total) : 0;

      res.json({ total, expiringSoon, expired, averageScore });
    } catch (error) {
      console.error('Error in dashboard-summary:', error);
      res.status(500).json({ error: 'Failed to get dashboard summary' });
    }
  });

  // Additional dashboard endpoints can be added here
  
  // Get procedures by LOB
  app.get('/ProceduresHubEG6/api/dashboard/by-lob', (req, res) => {
    try {
      const proceduresPath = path.join(__dirname, 'data', 'procedures.json');
      
      if (!fs.existsSync(proceduresPath)) {
        return res.json({});
      }
      
      const procedures = JSON.parse(fs.readFileSync(proceduresPath));
      
      // Group by LOB
      const byLob = procedures.reduce((acc, proc) => {
        const lob = proc.lob || 'Unknown';
        if (!acc[lob]) {
          acc[lob] = {
            total: 0,
            expired: 0,
            expiringSoon: 0,
            averageScore: 0,
            totalScore: 0
          };
        }
        
        acc[lob].total++;
        acc[lob].totalScore += (proc.score || 0);
        
        const now = new Date();
        const expiryDate = new Date(proc.expiry);
        const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
        
        if (expiryDate < now) {
          acc[lob].expired++;
        } else if (expiryDate - now < THIRTY_DAYS) {
          acc[lob].expiringSoon++;
        }
        
        return acc;
      }, {});
      
      // Calculate average scores
      Object.keys(byLob).forEach(lob => {
        byLob[lob].averageScore = byLob[lob].total > 0 
          ? Math.round(byLob[lob].totalScore / byLob[lob].total) 
          : 0;
        delete byLob[lob].totalScore; // Remove temporary field
      });
      
      res.json(byLob);
    } catch (error) {
      console.error('Error in dashboard by-lob:', error);
      res.status(500).json({ error: 'Failed to get LOB summary' });
    }
  });
  
  // Get recent procedures
  app.get('/ProceduresHubEG6/api/dashboard/recent', (req, res) => {
    try {
      const proceduresPath = path.join(__dirname, 'data', 'procedures.json');
      const limit = parseInt(req.query.limit) || 5;
      
      if (!fs.existsSync(proceduresPath)) {
        return res.json([]);
      }
      
      const procedures = JSON.parse(fs.readFileSync(proceduresPath));
      
      // Sort by ID (assuming higher ID = more recent) and get last N
      const recent = procedures
        .sort((a, b) => b.id - a.id)
        .slice(0, limit);
      
      res.json(recent);
    } catch (error) {
      console.error('Error in dashboard recent:', error);
      res.status(500).json({ error: 'Failed to get recent procedures' });
    }
  });
  
  // Get expiry timeline
  app.get('/ProceduresHubEG6/api/dashboard/expiry-timeline', (req, res) => {
    try {
      const proceduresPath = path.join(__dirname, 'data', 'procedures.json');
      
      if (!fs.existsSync(proceduresPath)) {
        return res.json({ expired: 0, thisWeek: 0, thisMonth: 0, later: 0 });
      }
      
      const procedures = JSON.parse(fs.readFileSync(proceduresPath));
      const now = new Date();
      const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
      const ONE_MONTH = 30 * 24 * 60 * 60 * 1000;
      
      const timeline = {
        expired: 0,
        thisWeek: 0,
        thisMonth: 0,
        later: 0
      };
      
      procedures.forEach(proc => {
        const expiryDate = new Date(proc.expiry);
        const diff = expiryDate - now;
        
        if (diff < 0) {
          timeline.expired++;
        } else if (diff < ONE_WEEK) {
          timeline.thisWeek++;
        } else if (diff < ONE_MONTH) {
          timeline.thisMonth++;
        } else {
          timeline.later++;
        }
      });
      
      res.json(timeline);
    } catch (error) {
      console.error('Error in expiry timeline:', error);
      res.status(500).json({ error: 'Failed to get expiry timeline' });
    }
  });

  console.log('Dashboard API routes initialized');
};