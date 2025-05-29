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