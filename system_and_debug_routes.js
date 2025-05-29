// routes/system.js - System routes
const express = require('express');
const fs = require('fs');
const router = express.Router();
const config = require('../config/config');

// API: System health check
router.get('/health', (req, res) => {
  try {
    const procedures = JSON.parse(fs.readFileSync(config.PROCEDURES_PATH));
    const auditLog = JSON.parse(fs.readFileSync(config.AUDIT_LOG_PATH));
    
    const systemHealth = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      components: {
        database: {
          status: 'healthy',
          proceduresCount: procedures.length,
          auditLogCount: auditLog.length
        },
        authentication: {
          status: req.staffId ? 'healthy' : 'warning',
          currentUser: req.staffId,
          userRole: req.userRole
        },
        fileSystem: {
          status: fs.existsSync(config.UPLOADS_DIR) ? 'healthy' : 'error',
          uploadsDirectory: config.UPLOADS_DIR
        },
        sharepoint: {
          status: config.SHAREPOINT.siteUrl ? 'configured' : 'not_configured',
          siteUrl: config.SHAREPOINT.siteUrl
        }
      },
      statistics: {
        totalProcedures: procedures.length,
        recentActivity: auditLog.filter(log => 
          new Date() - new Date(log.timestamp) < 24 * 60 * 60 * 1000
        ).length
      }
    };

    res.json(systemHealth);

  } catch (err) {
    console.error('❌ System health check failed:', err);
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: err.message
    });
  }
});

// API: System configuration (admin only)
router.get('/config', (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const systemConfig = {
      server: {
        port: config.PORT,
        environment: process.env.NODE_ENV || 'development',
        uploadPath: config.UPLOADS_DIR,
        dataPath: config.DATA_DIR
      },
      sharepoint: {
        siteUrl: config.SHAREPOINT.siteUrl,
        libraryName: config.SHAREPOINT.libraryName,
        baseFolderPath: config.SHAREPOINT.baseFolderPath,
        syncPath: process.env.SHAREPOINT_SYNC_PATH || null
      },
      roles: config.ROLES,
      features: {
        documentAnalysis: true,
        sharePointIntegration: !!config.SHAREPOINT.siteUrl,
        auditLogging: true,
        userDashboard: true,
        adminPanel: true
      }
    };

    res.json(systemConfig);

  } catch (err) {
    console.error('❌ Error getting system config:', err);
    res.status(500).json({ 
      message: 'Error loading system configuration',
      error: err.message 
    });
  }
});

module.exports = router;

// routes/debug.js - Debug and testing routes
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const router = express.Router();
const config = require('../config/config');
const { analyzeDocument } = require('../services/documentAnalysis');

const upload = multer({ dest: 'uploads/' });

// API: Set test cookie for localhost development (IT-compatible)
router.get('/set-cookie', (req, res) => {
  if (req.get('host').indexOf("localhost") === -1) {
    return res.status(403).json({ message: 'This endpoint is only available on localhost' });
  }
  
  console.log('Setting test cookie for localhost development...');
  
  // Create IT-compatible test cookie data
  const testUserData = {
    displayName: 'Mina Antoun Wilson Ross',
    adUserId: '43898931',
    mail: '43898931@hsbc.com',
    department: 'IT Test Department',
    timestamp: new Date().toISOString()
  };
  
  // Encode the test data as JSON (matching IT structure)
  const encodedData = encodeURIComponent(JSON.stringify(testUserData));
  
  // Set the cookie with IT-compatible name and structure
  res.cookie('apprunnersession', encodedData, {
    httpOnly: false, // Allow client-side access for testing
    secure: false,   // Allow over HTTP for localhost
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    path: '/'
  });
  
  console.log('✅ Test cookie set successfully');
  
  res.json({
    message: 'Test cookie set successfully for localhost development',
    userData: testUserData,
    cookieValue: encodedData.substring(0, 100) + '...',
    instructions: [
      '1. The test cookie has been set',
      '2. Refresh the page or navigate to /ProceduresHubEG6/',
      '3. You should now be authenticated as the test user',
      '4. Check /ProceduresHubEG6/api/role-check to verify'
    ]
  });
});

// API: Clear test cookie
router.get('/clear-cookie', (req, res) => {
  if (req.get('host').indexOf("localhost") === -1) {
    return res.status(403).json({ message: 'This endpoint is only available on localhost' });
  }
  
  console.log('Clearing test cookie...');
  
  res.clearCookie('apprunnersession', { path: '/' });
  
  res.json({
    message: 'Test cookie cleared successfully',
    instructions: [
      '1. The test cookie has been cleared',
      '2. Refresh the page to see unauthenticated state',
      '3. Use /api/test/set-cookie to set it again'
    ]
  });
});

// API: Test localhost authentication status
router.get('/auth-status', (req, res) => {
  const isLocalhost = req.get('host').indexOf("localhost") !== -1;
  
  res.json({
    isLocalhost: isLocalhost,
    authenticationResult: {
      staffId: req.staffId,
      role: req.userRole,
      displayName: req.userInfo?.displayName,
      adUserId: req.userInfo?.adUserId,
      source: req.userInfo?.source
    },
    cookies: {
      hasAppRunnerSession: !!req.cookies?.apprunnersession,
      allCookies: Object.keys(req.cookies || {}),
      sessionCookieLength: req.cookies?.apprunnersession?.length || 0
    },
    testActions: isLocalhost ? [
      'GET /ProceduresHubEG6/api/test/set-cookie - Set test cookie',
      'GET /ProceduresHubEG6/api/test/clear-cookie - Clear test cookie',
      'GET /ProceduresHubEG6/api/role-check - Check authentication',
      'GET /ProceduresHubEG6/test - Visual test page'
    ] : ['Test endpoints only available on localhost']
  });
});

// API: Test document analysis endpoint
router.post('/analyze', upload.single('file'), async (req, res) => {
  if (req.get('host').indexOf("localhost") === -1) {
    return res.status(403).json({ message: 'Test endpoint only available on localhost' });
  }

  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded for testing' });
    }

    console.log('🧪 Testing document analysis:', req.file.originalname);

    const analysis = await analyzeDocument(req.file.path, req.file.mimetype);
    
    // Clean up test file
    fs.unlinkSync(req.file.path);

    res.json({
      message: 'Document analysis test completed',
      filename: req.file.originalname,
      analysis: analysis,
      testResult: {
        passed: analysis.score >= 0,
        score: analysis.score,
        recommendationsCount: analysis.aiRecommendations ? analysis.aiRecommendations.length : 0,
        qualityLevel: analysis.score >= 80 ? 'High' : analysis.score >= 60 ? 'Medium' : 'Low'
      }
    });

  } catch (err) {
    console.error('❌ Document analysis test failed:', err);
    
    // Clean up test file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      message: 'Document analysis test failed',
      error: err.message
    });
  }
});

// API: Debug endpoint for troubleshooting
router.get('/', (req, res) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ message: 'Admin access required for debug information' });
  }

  try {
    const debugInfo = {
      timestamp: new Date().toISOString(),
      server: {
        nodeVersion: process.version,
        platform: process.platform,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        cwd: process.cwd()
      },
      request: {
        method: req.method,
        url: req.url,
        headers: {
          host: req.get('host'),
          userAgent: req.get('user-agent'),
          accept: req.get('accept')
        },
        cookies: Object.keys(req.cookies || {}),
        isLocalhost: req.get('host').indexOf("localhost") !== -1
      },
      authentication: {
        staffId: req.staffId,
        userRole: req.userRole,
        userInfo: req.userInfo,
        hasAppRunnerCookie: !!req.cookies?.apprunnersession
      },
      fileSystem: {
        dataDir: {
          exists: fs.existsSync(config.DATA_DIR),
          path: config.DATA_DIR
        },
        uploadsDir: {
          exists: fs.existsSync(config.UPLOADS_DIR),
          path: config.UPLOADS_DIR
        },
        proceduresFile: {
          exists: fs.existsSync(config.PROCEDURES_PATH),
          path: config.PROCEDURES_PATH,
          size: fs.existsSync(config.PROCEDURES_PATH) ? fs.statSync(config.PROCEDURES_PATH).size : 0
        }
      },
      config: {
        port: config.PORT,
        sharepoint: config.SHAREPOINT,
        roles: config.ROLES
      }
    };

    res.json(debugInfo);

  } catch (err) {
    console.error('❌ Error generating debug info:', err);
    res.status(500).json({
      error: 'Failed to generate debug information',
      message: err.message
    });
  }
});

// Visual test page for localhost development
router.get('/test', (req, res) => {
  if (req.get('host').indexOf("localhost") === -1) {
    return res.status(403).send('<h1>Test page only available on localhost</h1>');
  }

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>HSBC Procedures Hub - Test Page</title>
        <style>
            body { 
                font-family: Arial, sans-serif; 
                max-width: 800px; 
                margin: 0 auto; 
                padding: 20px; 
                background: #f5f6fa;
            }
            .container {
                background: white;
                padding: 30px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
                background: linear-gradient(135deg, #d40000, #b30000);
                color: white;
                padding: 20px;
                border-radius: 8px;
                margin-bottom: 30px;
                text-align: center;
            }
            .status { padding: 15px; margin: 10px 0; border-radius: 4px; }
            .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
            .button {
                display: inline-block;
                padding: 10px 20px;
                margin: 5px;
                background: #d40000;
                color: white;
                text-decoration: none;
                border-radius: 4px;
                border: none;
                cursor: pointer;
            }
            .test-section {
                margin: 20px 0;
                padding: 20px;
                border: 1px solid #ddd;
                border-radius: 8px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🧪 HSBC Procedures Hub</h1>
                <p>Localhost Test Environment</p>
            </div>

            <div class="test-section">
                <h2>Authentication Status</h2>
                <div id="auth-status" class="status">Checking authentication...</div>
                <button class="button" onclick="checkAuth()">Check Auth</button>
                <button class="button" onclick="setCookie()">Set Test Cookie</button>
                <button class="button" onclick="clearCookie()">Clear Cookie</button>
            </div>

            <div class="test-section">
                <h2>Quick Actions</h2>
                <a href="/ProceduresHubEG6/" class="button">Open Main App</a>
                <a href="/ProceduresHubEG6/api/procedures" class="button">View Procedures API</a>
                <a href="/ProceduresHubEG6/api/debug" class="button">Debug Info</a>
                <a href="/ProceduresHubEG6/api/system/health" class="button">System Health</a>
            </div>
        </div>

        <script>
            async function checkAuth() {
                try {
                    const response = await fetch('/ProceduresHubEG6/api/auth/check');
                    const data = await response.json();
                    
                    const statusDiv = document.getElementById('auth-status');
                    if (data.authenticated) {
                        statusDiv.className = 'status success';
                        statusDiv.innerHTML = \`
                            <strong>✅ Authenticated</strong><br>
                            Staff ID: \${data.user.staffId}<br>
                            Role: \${data.user.role}<br>
                            Display Name: \${data.user.displayName}<br>
                            Email: \${data.user.email}
                        \`;
                    } else {
                        statusDiv.className = 'status error';
                        statusDiv.innerHTML = \`<strong>❌ Not Authenticated</strong><br>\${data.message}\`;
                    }
                } catch (err) {
                    document.getElementById('auth-status').innerHTML = \`<strong>❌ Error:</strong> \${err.message}\`;
                }
            }

            async function setCookie() {
                try {
                    const response = await fetch('/ProceduresHubEG6/api/test/set-cookie');
                    const data = await response.json();
                    alert('Test cookie set! Refresh the page to see the effect.');
                    checkAuth();
                } catch (err) {
                    alert('Error setting cookie: ' + err.message);
                }
            }

            async function clearCookie() {
                try {
                    const response = await fetch('/ProceduresHubEG6/api/test/clear-cookie');
                    const data = await response.json();
                    alert('Test cookie cleared! Refresh the page to see the effect.');
                    checkAuth();
                } catch (err) {
                    alert('Error clearing cookie: ' + err.message);
                }
            }

            // Load initial data
            checkAuth();
        </script>
    </body>
    </html>
  `);
});

module.exports = router;