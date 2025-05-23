const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');
const cookieParser = require('cookie-parser');
const roles = require('./roles.config.json');

const app = express();
const port = process.env.APP_PORT || 44557;

app.use(cors());
app.use(express.json());
app.use(cookieParser());

function getUserRole(staffId) {
  if (roles.admins.includes(staffId)) {
    return 'admin';
  }
  return 'user';
}

// Middleware to extract user role from JWT cookie
app.use((req, res, next) => {
  const jwtCookie = req.cookies['apprunner-staff'];
  if (jwtCookie) {
    try {
      const decoded = JSON.parse(decodeURIComponent(jwtCookie));
      req.staffId = decoded.staffId;
      req.userRole = getUserRole(decoded.staffId);
    } catch (err) {
      console.error('Invalid JWT cookie:', err);
    }
  }
  next();
});

// Serve React static build
app.use('/ProceduresHubEG6/static', express.static(path.join(__dirname, 'build/static')));

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
  return '';
}

app.get('/ProceduresHubEG6/api/procedures', (req, res) => {
  const data = fs.readFileSync(path.join(__dirname, 'data', 'procedures.json'));
  res.json(JSON.parse(data));
});

app.post('/ProceduresHubEG6/api/procedures', upload.single('file'), async (req, res) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ message: 'Access denied: admin only' });
  }

  const filePath = path.join(__dirname, 'data', 'procedures.json');
  const data = JSON.parse(fs.readFileSync(filePath));
  const newId = data.length ? data[data.length - 1].id + 1 : 1;

  let score = 0;
  try {
    const text = await extractTextFromFile(req.file.path, req.file.mimetype);
    score = scoreContent(text);
  } catch (err) {
    console.error('Error processing file:', err);
    return res.status(500).json({ message: 'Error reading file content' });
  }

  const newProcedure = {
    id: newId,
    name: req.body.name,
    expiry: req.body.expiry,
    primary_owner: req.body.primary_owner,
    secondary_owner: req.body.secondary_owner,
    lob: req.body.lob,
    file_link: `/uploads/${req.file.filename}`,
    score: score,
    status: "active"
  };

  data.push(newProcedure);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 4));
  res.status(201).json({ message: 'Procedure added and scored successfully' });
});

app.get('/ProceduresHubEG6/api/dashboard-summary', (req, res) => {
  const now = new Date();
  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
  const procedures = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'procedures.json')));

  const total = procedures.length;
  const expiringSoon = procedures.filter(p => {
    const expiry = new Date(p.expiry);
    return expiry > now && expiry - now < THIRTY_DAYS;
  }).length;

  const expired = procedures.filter(p => new Date(p.expiry) < now).length;

  const totalScore = procedures.reduce((sum, p) => sum + (p.score || 0), 0);
  const averageScore = total > 0 ? Math.round(totalScore / total) : 0;

  res.json({ total, expiringSoon, expired, averageScore });
});

// SPA fallback
app.get(/^\/ProceduresHubEG6(?!\/static).*$/, (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`HSBC Procedures App running at http://localhost:${port}/ProceduresHubEG6/`);
});

require('./hsbc_phase4_email_scheduler');
require('./hsbc_dashboard_summary_api');
