// utils/fileSystem.js - File system utilities
const fs = require('fs');
const config = require('../config/config');

function initializeDirectories() {
  // Create required directories if they don't exist
  if (!fs.existsSync(config.DATA_DIR)) {
    fs.mkdirSync(config.DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(config.UPLOADS_DIR)) {
    fs.mkdirSync(config.UPLOADS_DIR, { recursive: true });
  }

  // Initialize procedures data file
  if (!fs.existsSync(config.PROCEDURES_PATH)) {
    fs.writeFileSync(config.PROCEDURES_PATH, '[]');
  }

  // Initialize audit log file
  if (!fs.existsSync(config.AUDIT_LOG_PATH)) {
    fs.writeFileSync(config.AUDIT_LOG_PATH, '[]');
  }

  // Initialize roles config if it doesn't exist
  if (!fs.existsSync(config.ROLES_PATH)) {
    fs.writeFileSync(config.ROLES_PATH, JSON.stringify({ 
      admins: ['admin', 'test_admin', 'default_user', 'wilson.ross', 'mina.antoun', '43898931']
    }, null, 2));
  }
}

module.exports = {
  initializeDirectories
};

// utils/auditLog.js - Audit logging utilities
const fs = require('fs');
const config = require('../config/config');

function addAuditLog(action, details, userId) {
  try {
    const auditLog = JSON.parse(fs.readFileSync(config.AUDIT_LOG_PATH));
    auditLog.push({
      id: Date.now(),
      timestamp: new Date().toISOString(),
      action: action,
      userId: userId,
      details: details
    });
    fs.writeFileSync(config.AUDIT_LOG_PATH, JSON.stringify(auditLog, null, 2));
  } catch (err) {
    console.error('Error writing audit log:', err);
  }
}

module.exports = {
  addAuditLog
};

// middleware/errorHandler.js - Error handling middleware
function errorHandler(err, req, res, next) {
  console.error('🚨 Unhandled error:', err);
  
  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    error: isDevelopment ? err.stack : 'An unexpected error occurred',
    timestamp: new Date().toISOString(),
    requestId: req.headers['x-request-id'] || Date.now().toString()
  });
}

module.exports = errorHandler;