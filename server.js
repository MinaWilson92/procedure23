const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');

const app = express();
const port = parseInt(process.env.APP_PORT || process.env.PORT || 8082);

app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Create required directories and files if they don't exist
const dataDir = path.join(__dirname, 'data');
const uploadsDir = path.join(__dirname, 'uploads');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Initialize procedures.json if it doesn't exist
const proceduresPath = path.join(dataDir, 'procedures.json');
if (!fs.existsSync(proceduresPath)) {
  fs.writeFileSync(proceduresPath, '[]');
}

// Initialize roles config if it doesn't exist
const rolesPath = path.join(__dirname, 'roles.config.json');
if (!fs.existsSync(rolesPath)) {
  fs.writeFileSync(rolesPath, JSON.stringify({ 
    admins: ['admin', 'test_admin', 'default_user'] // Added default_user as admin for testing
  }, null, 2));
}

const roles = require('./roles.config.json');

// Helper to check user role
function getUserRole(staffId) {
  if (roles.admins && roles.admins.includes(staffId)) {
    return 'admin';
  }
  return 'user';
}

// Middleware: extract user info (simplified for now)
app.use((req, res, next) => {
  // Check for apprunner-staff cookie
  const staffCookie = req.cookies ? req.cookies['apprunner-staff'] : null;
  
  if (staffCookie) {
    try {
      // Try to decode the cookie (if it's JSON)
      const decoded = JSON.parse(decodeURIComponent(staffCookie));
      req.staffId = decoded.staffId || 'guest';
      req.userRole = getUserRole(req.staffId);
    } catch (err) {
      // If cookie parsing fails, check if it's just a staff ID
      req.staffId = staffCookie;
      req.userRole = getUserRole(staffCookie);
    }
  } else {
    // Default user for development/testing
    req.staffId = 'default_user';
    req.userRole = 'user';
  }
  
  console.log('User middleware:', { staffId: req.staffId, role: req.userRole });
  next();
});

// Serve static files from React build at the base path
app.use('/ProceduresHubEG6', express.static(path.join(__dirname, 'build')));

// API endpoints
app.get('/ProceduresHubEG6/api/role-check', (req, res) => {
  res.json({ staffId: req.staffId, role: req.userRole });
});

const upload = multer({ dest: 'uploads/' });

const REQUIRED_SECTIONS = ['purpose', 'scope', 'owner', 'review date', 'approval'];

function scoreContent(text) {
  const lower = text.toLowerCase();
  let score = 0;
  REQUIRED_SECTIONS.forEach(section => {
    if (lower.includes(section)) {
      score += 1;
    }
  });
  return Math.round((score / REQUIRED_SECTIONS.length) * 100);
}

async function extractTextFromFile(filePath, mimetype) {
  try {
    if (mimetype === 'application/pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      return data.text;
    } else if (
      mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimetype === 'application/msword'
    ) {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    }
  } catch (err) {
    console.error('Error extracting text:', err);
  }
  return '';
}

// API: Get all procedures
app.get('/ProceduresHubEG6/api/procedures', (req, res) => {
  try {
    const data = fs.readFileSync(proceduresPath);
    res.json(JSON.parse(data));
  } catch (err) {
    console.error('Error reading procedures:', err);
    res.json([]);
  }
});

// API: Add a new procedure
app.post('/ProceduresHubEG6/api/procedures', upload.single('file'), async (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(proceduresPath));
    const newId = data.length ? data[data.length - 1].id + 1 : 1;

    let score = 0;
    if (req.file) {
      const text = await extractTextFromFile(req.file.path, req.file.mimetype);
      score = scoreContent(text);
    }

    const newProcedure = {
      id: newId,
      name: req.body.name || 'Unnamed',
      expiry: req.body.expiry || new Date().toISOString(),
      primary_owner: req.body.primary_owner || 'Unknown',
      secondary_owner: req.body.secondary_owner || 'Unknown',
      lob: req.body.lob || 'General',
      file_link: req.file ? `/uploads/${req.file.filename}` : '',
      score: score,
      status: "active"
    };

    data.push(newProcedure);
    fs.writeFileSync(proceduresPath, JSON.stringify(data, null, 4));
    res.status(201).json({ message: 'Procedure added successfully' });
  } catch (err) {
    console.error('Error adding procedure:', err);
    res.status(500).json({ message: 'Error adding procedure' });
  }
});

// API: Dashboard summary
app.get('/ProceduresHubEG6/api/dashboard-summary', (req, res) => {
  try {
    const now = new Date();
    const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
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
  } catch (err) {
    console.error('Error getting dashboard summary:', err);
    res.json({ total: 0, expiringSoon: 0, expired: 0, averageScore: 0 });
  }
});

// Dashboard API: Get procedures by LOB
app.get('/ProceduresHubEG6/api/dashboard/by-lob', (req, res) => {
  try {
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

// Dashboard API: Get recent procedures
app.get('/ProceduresHubEG6/api/dashboard/recent', (req, res) => {
  try {
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

// Dashboard API: Get expiry timeline
app.get('/ProceduresHubEG6/api/dashboard/expiry-timeline', (req, res) => {
  try {
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

// Serve uploaded files
app.use('/ProceduresHubEG6/uploads', express.static(uploadsDir));

// Catch all handler for React routes - MUST be last
app.get('/ProceduresHubEG6/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Root redirect
app.get('/', (req, res) => {
  res.redirect('/ProceduresHubEG6');
});

// Initialize email scheduler
try {
  console.log('Initializing email scheduler...');
  const initializeScheduler = require('./hsbc_phase4_email_scheduler');
  if (typeof initializeScheduler === 'function') {
    initializeScheduler();
  } else if (typeof initializeScheduler.default === 'function') {
    initializeScheduler.default();
  } else {
    console.log('Email scheduler module found but not a function:', typeof initializeScheduler);
  }
} catch (err) {
  console.error('Failed to initialize email scheduler:', err.message);
  console.log('Continuing without email scheduler...');
}

// Start server - THIS MUST BE LAST
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Access the app at: http://localhost:${port}/ProceduresHubEG6`);
  console.log('Dashboard routes: Available at /ProceduresHubEG6/api/dashboard/*');
});

// Note: We've integrated the dashboard routes directly into server.js
// to avoid module loading issues. The hsbc_dashboard_summary_api.js file
// is no longer needed with this approach.