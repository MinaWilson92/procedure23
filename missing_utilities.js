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