const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');

const app = express();
const port = process.env.PORT || 44557; // App Runner uses PORT env variable

app.use(cors());
app.use(express.json());

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
  fs.writeFileSync(rolesPath, JSON.stringify({ admins: ['admin'] }, null, 2));
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
  // For App Runner, you might need to handle auth differently
  // This is a simplified version
  req.staffId = 'default_user';
  req.userRole = 'user';
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

// Initialize additional modules BEFORE starting server
try {
  const initializeScheduler = require('./hsbc_phase4_email_scheduler');
  initializeScheduler();
} catch (err) {
  console.error('Failed to initialize email scheduler:', err.message);
}

try {
  const dashboardRoutes = require('./hsbc_dashboard_summary_api');
  dashboardRoutes(app);
} catch (err) {
  console.error('Failed to initialize dashboard routes:', err.message);
}

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Access the app at: http://localhost:${port}/ProceduresHubEG6`);
});