// config/config.js - Configuration module

const path = require('path');
const fs = require('fs');

// Port configuration
const PORT = parseInt(process.env.APP_PORT || process.env.PORT || 8082);

// Directory paths
const DATA_DIR = path.join(__dirname, '..', 'data');
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

// File paths
const PROCEDURES_PATH = path.join(DATA_DIR, 'procedures.json');
const AUDIT_LOG_PATH = path.join(DATA_DIR, 'audit_log.json');
const ROLES_PATH = path.join(__dirname, '..', 'roles.config.json');

// SharePoint Configuration
const SHAREPOINT_CONFIG = {
  siteUrl: process.env.SHAREPOINT_SITE_URL || 'https://hsbc.sharepoint.com/sites/ProceduresHub',
  libraryName: process.env.SHAREPOINT_LIBRARY || 'Procedures',
  baseFolderPath: process.env.SHAREPOINT_BASE_PATH || '/sites/ProceduresHub/Shared Documents/Procedures'
};

// Load roles configuration
let roles = { admins: ['admin', 'test_admin', 'default_user', 'wilson.ross', 'mina.antoun', '43898931'] };
try {
  if (fs.existsSync(ROLES_PATH)) {
    roles = require(ROLES_PATH);
  }
} catch (err) {
  console.warn('Warning: Could not load roles config, using defaults');
}

// Document Analysis Configuration
const DOCUMENT_ANALYSIS = {
  MINIMUM_QUALITY_SCORE: 60,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword'
  ]
};

// Quality Score Weights
const QUALITY_WEIGHTS = {
  'Table of Contents': { weight: 10, priority: 'MEDIUM' },
  'Purpose': { weight: 15, priority: 'HIGH' },
  'Scope': { weight: 15, priority: 'HIGH' },
  'Document Control': { weight: 12, priority: 'HIGH' },
  'Responsibilities': { weight: 10, priority: 'MEDIUM' },
  'Procedures': { weight: 20, priority: 'HIGH' },
  'Risk Assessment': { weight: 10, priority: 'MEDIUM' },
  'Approval': { weight: 8, priority: 'LOW' },
  'Review Date': { weight: 5, priority: 'LOW' }
};

// Export configuration
module.exports = {
  PORT,
  DATA_DIR,
  UPLOADS_DIR,
  PROCEDURES_PATH,
  AUDIT_LOG_PATH,
  ROLES_PATH,
  SHAREPOINT: SHAREPOINT_CONFIG,
  ROLES: roles,
  DOCUMENT_ANALYSIS,
  QUALITY_WEIGHTS
};