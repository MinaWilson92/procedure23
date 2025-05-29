// routes/sharepoint.js - SharePoint routes
const express = require('express');
const multer = require('multer');
const fs = require('fs');
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

    // Clean up temporary file
    fs.unlinkSync(req.file.path);

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
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
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

// API: Test SharePoint connectivity
router.get('/test', (req, res) => {
  try {
    if (!req.staffId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const sharepointService = new SharePointService();
    const testConfig = sharepointService.getConfig(req, {
      name: 'Test',
      lob: 'General',
      uploaded_by: req.staffId
    });
    
    res.json({
      success: true,
      sharePointConfig: testConfig.config,
      userSession: {
        staffId: req.staffId,
        displayName: req.userInfo?.displayName,
        hasSharePointSession: testConfig.hasSharePointSession
      },
      testResults: {
        configurationValid: !!(testConfig.config.siteUrl && testConfig.config.libraryName),
        userAuthenticated: !!req.staffId,
        sharePointSessionAvailable: testConfig.hasSharePointSession
      },
      recommendations: testConfig.hasSharePointSession ? [
        'All systems ready for SharePoint integration',
        'You can use direct upload or SharePoint interface'
      ] : [
        'Login to SharePoint in another browser tab',
        'Use the "SharePoint Interface" upload method',
        'Contact IT support for SharePoint access issues'
      ]
    });

  } catch (error) {
    console.error('❌ SharePoint test error:', error);
    res.status(500).json({
      success: false,
      message: 'SharePoint connectivity test failed',
      error: error.message
    });
  }
});

module.exports = router;