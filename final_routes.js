// routes/sharepoint.js - SharePoint routes
const express = require('express');
const multer = require('multer');
const router = express.Router();
const SharePointService = require('../services/sharepoint');
const { addAuditLog } = require('../utils/auditLog');

const upload = multer({ dest: 'uploads/' });

// API: Get SharePoint configuration
router.get('/config', (req, res) => {
  try {
    if (!req.staffId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    console.log('📋 Getting SharePoint config for user:', req.staffId);

    const procedureData = {
      lob: req.query.lob || 'General',
      procedure_subsection: req.query.subsection || '',
      name: req.query.name || 'New_Procedure',
      uploaded_by: req.staffId
    };

    const sharepointService = new SharePointService();
    const config = sharepointService.getConfig(req, procedureData);

    console.log('✅ SharePoint config generated');
    res.json(config);

  } catch (error) {
    console.error('❌ Error getting SharePoint config:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get SharePoint configuration',
      error: error.message 
    });
  }
});

// API: Upload file to SharePoint
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.staffId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    console.log('📤 Starting SharePoint upload for user:', req.staffId);

    const procedureData = {
      name: req.body.name || 'Unnamed_Procedure',
      lob: req.body.lob || 'General',
      procedure_subsection: req.body.procedure_subsection || '',
      uploaded_by: req.staffId
    };

    const sharepointService = new SharePointService();
    const result = await sharepointService.uploadFile(req, procedureData);

    // Add audit log
    addAuditLog('SHAREPOINT_UPLOAD', {
      fileName: result.fileName,
      folderPath: result.folderPath,
      fileSize: req.file.size,
      uploadMethod: 'rest_api',
      sharePointUrl: result.webUrl
    }, req.staffId);

    console.log('✅ SharePoint upload completed successfully');

    res.json({
      success: true,
      message: 'File uploaded to SharePoint successfully',
      sharePointResult: result,
      procedureData: procedureData
    });

  } catch (error) {
    console.error('❌ SharePoint upload error:', error);
    
    // Clean up temporary file on error
    if (req.file && require('fs').existsSync(req.file.path)) {
      require('fs').unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: 'SharePoint upload failed',
      error: error.message
    });
  }
});

// API: Generate SharePoint upload form
router.get('/upload-form', (req, res) => {
  try {
    if (!req.staffId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    console.log('📋 Generating SharePoint upload form for user:', req.staffId);

    const procedureData = {
      name: req.query.name || 'New_Procedure',
      lob: req.query.lob || 'General',
      procedure_subsection: req.query.subsection || '',
      uploaded_by: req.staffId
    };

    const sharepointService = new SharePointService();
    const formData = sharepointService.generateUploadForm(req, procedureData);
    
    const redirectUrl = `${req.protocol}://${req.get('host')}/ProceduresHubEG6/sharepoint-success`;

    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Upload to SharePoint - HSBC Procedures Hub</title>
          <style>
              body { 
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                  max-width: 700px; 
                  margin: 50px auto; 
                  padding: 30px; 
                  background: #f5f6fa;
              }
              .container {
                  background: white;
                  padding: 30px;
                  border-radius: 12px;
                  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
              }
              .header {
                  background: linear-gradient(135deg, #d40000, #b30000);
                  color: white;
                  padding: 20px;
                  border-radius: 8px;
                  margin-bottom: 30px;
                  text-align: center;
              }
              .form-container { 
                  border: 2px solid #d40000; 
                  padding: 25px; 
                  border-radius: 8px;
                  background: #fff8f8;
                  margin: 20px 0;
              }
              .submit-btn { 
                  background: #d40000; 
                  color: white; 
                  padding: 15px 30px; 
                  border: none; 
                  border-radius: 6px; 
                  cursor: pointer; 
                  font-size: 16px;
                  font-weight: bold;
                  width: 100%;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>📁 HSBC SharePoint Upload</h1>
                  <p>Procedures Hub - Document Upload</p>
              </div>
              
              <form action="${formData.uploadUrl}" method="post" enctype="multipart/form-data" target="_blank">
                  <div class="form-container">
                      <h3>📤 File Upload</h3>
                      
                      <input type="hidden" name="RootFolder" value="${formData.folderPath}" />
                      <input type="hidden" name="Source" value="${redirectUrl}" />
                      
                      <input type="file" name="fileUpload" accept=".pdf,.docx,.doc" required style="width: 100%; padding: 10px; margin: 10px 0;" />
                      
                      <button type="submit" class="submit-btn">
                          🚀 Upload to SharePoint
                      </button>
                  </div>
              </form>
          </div>
      </body>
      </html>
    `);

  } catch (error) {
    console.error('❌ Error generating upload form:', error);
    res.status(500).send(`<html><body><h2>Error: ${error.message}</h2></body></html>`);
  }
});

// API: SharePoint upload success callback
router.get('/success', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Upload Successful - HSBC Procedures Hub</title>
        <style>
            body { 
                font-family: Arial, sans-serif; 
                text-align: center; 
                padding: 50px; 
                background: #f5f6fa;
            }
            .success-container {
                background: white;
                padding: 40px;
                border-radius: 12px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                max-width: 500px;
                margin: 0 auto;
            }
            .success-icon {
                font-size: 4em;
                color: #28a745;
                margin-bottom: 20px;
            }
            .close-btn {
                background: #d40000;
                color: white;
                padding: 15px 30px;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 16px;
                margin-top: 20px;
            }
        </style>
    </head>
    <body>
        <div class="success-container">
            <div class="success-icon">✅</div>
            <h2 style="color: #28a745;">Upload Successful!</h2>
            <p>Your procedure has been uploaded to SharePoint successfully.</p>
            <p>You can now close this window and return to the Procedures Hub.</p>
            <button onclick="window.close()" class="close-btn">
                Close Window
            </button>
        </div>
        
        <script>
            // Notify parent window of successful upload
            if (window.opener) {
                window.opener.postMessage({
                    type: 'sharepoint-upload-success',
                    timestamp: new Date().toISOString()
                }, '*');
            }
            
            // Auto-close after 5 seconds
            setTimeout(function() {
                window.close();
            }, 5000);
        </script>
    </body>
    </html>
  `);
});

module.exports = router;

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
    console.error('❌ Error generating debug info:", err);
    res.status(500).json({
      error: 'Failed to generate debug information',
      message: err.message
    });
  }
});

module.exports = router;