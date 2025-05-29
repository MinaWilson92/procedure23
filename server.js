// server.js - HSBC Procedures Hub - Complete Fixed Implementation

const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');
const axios = require('axios');

const app = express();
const port = parseInt(process.env.APP_PORT || process.env.PORT || 8082);

// Middleware
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

// Initialize procedures data file
const proceduresPath = path.join(dataDir, 'procedures.json');
if (!fs.existsSync(proceduresPath)) {
  fs.writeFileSync(proceduresPath, '[]');
}

// Initialize audit log file
const auditLogPath = path.join(dataDir, 'audit_log.json');
if (!fs.existsSync(auditLogPath)) {
  fs.writeFileSync(auditLogPath, '[]');
}

// Helper function to add audit log entry
function addAuditLog(action, details, userId) {
  try {
    const auditLog = JSON.parse(fs.readFileSync(auditLogPath));
    auditLog.push({
      id: Date.now(),
      timestamp: new Date().toISOString(),
      action: action,
      userId: userId,
      details: details
    });
    fs.writeFileSync(auditLogPath, JSON.stringify(auditLog, null, 2));
  } catch (err) {
    console.error('Error writing audit log:', err);
  }
}

// Initialize roles config if it doesn't exist
const rolesPath = path.join(__dirname, 'roles.config.json');
if (!fs.existsSync(rolesPath)) {
  fs.writeFileSync(rolesPath, JSON.stringify({ 
    admins: ['admin', 'test_admin', 'default_user', 'wilson.ross', 'mina.antoun', '43898931']
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

// SharePoint Configuration
const SHAREPOINT_CONFIG = {
  siteUrl: process.env.SHAREPOINT_SITE_URL || 'https://hsbc.sharepoint.com/sites/ProceduresHub',
  libraryName: process.env.SHAREPOINT_LIBRARY || 'Procedures',
  baseFolderPath: process.env.SHAREPOINT_BASE_PATH || '/sites/ProceduresHub/Shared Documents/Procedures'
};

// IT AUTHENTICATION MIDDLEWARE - Extract user info from AppRunner cookies
app.use((req, res, next) => {
  console.log('=== AUTHENTICATION MIDDLEWARE ===');
  console.log('Host:', req.get('host'));
  console.log('Request URL:', req.url);
  
  // Check if we're running on localhost (IT-provided condition)
  const isLocalhost = req.get('host').indexOf("localhost") !== -1;
  console.log('Is localhost:', isLocalhost);
  
  // Check for apprunnersession cookie
  const sessionCookie = req.cookies ? req.cookies['apprunnersession'] : null;
  
  console.log('Cookies received:', {
    sessionExists: !!sessionCookie,
    allCookies: Object.keys(req.cookies || {}),
    isLocalhost: isLocalhost
  });
  
  // Initialize user variables
  let userId = '';
  let displayName = '';
  let userInfo = {};
  
  if (isLocalhost) {
    console.log('🏠 LOCALHOST MODE - Using IT-provided fallback logic');
    
    if (sessionCookie) {
      console.log('Found session cookie on localhost, attempting to parse...');
      
      try {
        // Check if cookie matches the expected pattern (IT logic)
        const cookieMatch = sessionCookie.match(/(.+)?.*apprunnersession.*=.*(.+)?/);
        
        if (cookieMatch) {
          console.log('Cookie pattern matched on localhost');
          
          // Split and decode the cookie value (IT method)
          const value = "; " + sessionCookie;
          const parts = value.split("; apprunnersession=");
          
          if (parts.length === 2) {
            const decoded = decodeURIComponent(parts.pop().split(";").shift());
            console.log('Cookie decoded on localhost');
            
            try {
              // Try to parse as JSON first
              const userData = JSON.parse(decoded);
              displayName = userData.displayName || '';
              userId = userData.adUserId || userData.userId || '';
              userInfo = userData;
              
              console.log('✅ JSON parse successful on localhost:', {
                displayName,
                userId
              });
            } catch (jsonErr) {
              console.log('JSON parse failed on localhost, using pattern matching...');
              
              // Fallback: Use pattern matching
              const displayNameMatch = decoded.match(/displayName["\s]*[:=]["\s]*([^"&,}]+)/);
              const userIdMatch = decoded.match(/adUserId["\s]*[:=]["\s]*([^"&,}]+)/) || 
                                 decoded.match(/userId["\s]*[:=]["\s]*([^"&,}]+)/);
              
              displayName = displayNameMatch ? displayNameMatch[1].trim() : '';
              userId = userIdMatch ? userIdMatch[1].trim() : '';
              
              userInfo = {
                displayName: displayName,
                adUserId: userId,
                source: 'pattern_match_localhost'
              };
              
              console.log('✅ Pattern match successful on localhost:', {
                displayName,
                userId
              });
            }
          }
        } else {
          console.log('❌ Cookie pattern did not match on localhost');
        }
      } catch (err) {
        console.error('❌ Error parsing cookie on localhost:', err);
      }
    }
    
    // If no valid data extracted, use IT-provided fallback values
    if (!userId) {
      console.log('🔄 Using IT-provided fallback values for localhost');
      userId = '43898931';
      displayName = 'Mina Antoun Wilson Ross';
      userInfo = {
        displayName: displayName,
        adUserId: userId,
        source: 'it_fallback_localhost'
      };
      
      console.log('✅ IT fallback applied:', {
        displayName,
        userId
      });
    }
    
  } else {
    console.log('🌐 PRODUCTION MODE - Processing real AppRunner cookie');
    
    if (sessionCookie) {
      try {
        console.log('Processing AppRunner session cookie in production...');
        
        // Use IT-provided logic for production
        const value = "; " + sessionCookie;
        const parts = value.split("; apprunnersession=");
        
        if (parts.length >= 2) {
          const decoded = decodeURIComponent(parts.pop().split(";").shift());
          console.log('Cookie decoded successfully in production');
          
          try {
            // Parse as JSON (IT logic shows this structure)
            const userData = JSON.parse(decoded);
            console.log('Parsed user data from production cookie:', {
              hasDisplayName: !!userData.displayName,
              hasAdUserId: !!userData.adUserId,
              keys: Object.keys(userData || {})
            });
            
            // Extract user information using IT-provided field names
            displayName = userData.displayName || '';
            userId = userData.adUserId || userData.userId || '';
            userInfo = {
              ...userData,
              source: 'production_cookie'
            };
            
          } catch (jsonErr) {
            console.log('JSON parse failed in production, trying pattern extraction...');
            
            // Fallback: Use pattern matching similar to IT code
            const displayNameMatch = decoded.match(/displayName["\s]*[:=]["\s]*([^"&,}]+)/);
            const userIdMatch = decoded.match(/adUserId["\s]*[:=]["\s]*([^"&,}]+)/) || 
                               decoded.match(/userId["\s]*[:=]["\s]*([^"&,}]+)/);
            
            displayName = displayNameMatch ? displayNameMatch[1].trim() : '';
            userId = userIdMatch ? userIdMatch[1].trim() : '';
            
            userInfo = {
              displayName: displayName,
              adUserId: userId,
              rawCookie: decoded.substring(0, 100) + '...',
              source: 'pattern_match_production'
            };
          }
        }
      } catch (err) {
        console.error('❌ Failed to parse session cookie in production:', err);
        console.error('Cookie sample:', sessionCookie.substring(0, 100) + '...');
      }
    } else {
      console.log('❌ No AppRunner session cookie found in production');
    }
  }
  
  // Set user information on request object
  if (userId && displayName) {
    req.staffId = userId;
    req.userRole = getUserRole(userId);
    req.userInfo = {
      displayName: displayName,
      adUserId: userId,
      mail: `${userId}@hsbc.com`,
      ...userInfo
    };
    
    console.log('✅ User authenticated successfully:', {
      staffId: req.staffId,
      role: req.userRole,
      displayName: displayName,
      adUserId: userId,
      source: userInfo.source
    });
  } else {
    console.log('❌ Authentication failed - using default user');
    
    // Final fallback to default user
    req.staffId = 'default_user';
    req.userRole = getUserRole('default_user');
    req.userInfo = {
      displayName: 'Default User',
      adUserId: 'default_user',
      mail: 'default_user@hsbc.com',
      source: 'default_fallback',
      note: isLocalhost ? 'Localhost default' : 'Production default'
    };
  }
  
  console.log('=== FINAL AUTH RESULT ===');
  console.log({
    staffId: req.staffId,
    role: req.userRole,
    displayName: req.userInfo?.displayName,
    source: req.userInfo?.source,
    isLocalhost: isLocalhost
  });
  console.log('=============================');
  
  next();
});

// Serve static files from React build at the base path
app.use('/ProceduresHubEG6', express.static(path.join(__dirname, 'build')));

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// ============================================================================
// AUTHENTICATION API ENDPOINTS
// ============================================================================

// API: Role check endpoint (IT-compatible)
app.get('/ProceduresHubEG6/api/role-check', (req, res) => {
  console.log('Role check endpoint called:', {
    staffId: req.staffId,
    role: req.userRole,
    hasUserInfo: !!req.userInfo,
    displayName: req.userInfo?.displayName
  });
  
  if (req.staffId && req.userRole) {
    res.json({ 
      staffId: req.staffId, 
      role: req.userRole,
      displayName: req.userInfo?.displayName || req.staffId,
      email: req.userInfo?.mail || `${req.staffId}@hsbc.com`,
      adUserId: req.userInfo?.adUserId || req.staffId,
      authenticated: true
    });
  } else {
    res.status(401).json({ 
      authenticated: false,
      message: 'Not authenticated - please ensure you are logged into HSBC AppRunner'
    });
  }
});

// API: Authentication check endpoint (compatible with AuthGuard)
app.get('/ProceduresHubEG6/api/auth/check', (req, res) => {
  console.log('Auth check endpoint called:', {
    staffId: req.staffId,
    role: req.userRole,
    hasUserInfo: !!req.userInfo
  });
  
  if (req.staffId && req.userRole) {
    res.json({ 
      authenticated: true,
      user: {
        staffId: req.staffId, 
        role: req.userRole,
        displayName: req.userInfo?.displayName || req.staffId,
        email: req.userInfo?.mail || `${req.staffId}@hsbc.com`,
        adUserId: req.userInfo?.adUserId || req.staffId,
        department: req.userInfo?.department || null,
        jobTitle: req.userInfo?.jobTitle || null
      }
    });
  } else {
    res.status(401).json({ 
      authenticated: false,
      message: 'Not authenticated or missing session cookie'
    });
  }
});

// API: Authentication status (lightweight check)
app.get('/ProceduresHubEG6/api/auth/status', (req, res) => {
  res.json({
    authenticated: !!(req.staffId && req.userRole),
    staffId: req.staffId || null,
    role: req.userRole || null,
    displayName: req.userInfo?.displayName || null,
    adUserId: req.userInfo?.adUserId || null
  });
});

// API: Login redirect using IT-provided URL pattern
app.get('/ProceduresHubEG6/api/auth/login', (req, res) => {
  const returnUrl = req.query.returnUrl || `${req.protocol}://${req.get('host')}/ProceduresHubEG6/`;
  
  // Use IT-provided login URL pattern
  const loginUrl = `https://apprunner.hk.hsbc/login/api/sessions/sso?nextUrl=${encodeURIComponent(returnUrl)}`;
  
  console.log('Redirecting to AppRunner login:', loginUrl);
  res.redirect(loginUrl);
});

// ============================================================================
// LOCALHOST TESTING ENDPOINTS
// ============================================================================

// API: Set test cookie for localhost development (IT-compatible)
app.get('/ProceduresHubEG6/api/test/set-cookie', (req, res) => {
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
app.get('/ProceduresHubEG6/api/test/clear-cookie', (req, res) => {
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
app.get('/ProceduresHubEG6/api/test/auth-status', (req, res) => {
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

// ============================================================================
// DOCUMENT ANALYSIS HELPER FUNCTIONS
// ============================================================================

// Helper functions for document analysis
function isValidOwnerName(name) {
  if (!name || name.length < 2 || name.length > 100) return false;
  
  // Remove common noise patterns
  const excludePatterns = [
    /last\s+updated?\s+date/gi,
    /sign[\s-]*off\s+date/gi,
    /effective\s+date/gi,
    /expiry\s+date/gi,
    /version\s+\d+/gi,
    /table\s+of\s+contents/gi,
    /page\s+\d+/gi,
    /^\d+$/,  // Numbers only
    /^[^a-zA-Z]*$/  // No letters
  ];
  
  for (const pattern of excludePatterns) {
    if (pattern.test(name)) return false;
  }

  // Must contain at least one letter
  if (!/[a-zA-Z]/.test(name)) return false;

  // Filter out common non-name terms
  const lowerName = name.toLowerCase().trim();
  const excludeWords = [
    'name', 'role', 'position', 'department', 'date', 'sign-off', 
    'version', 'control', 'table', 'header', 'title', 'section',
    'last updated', 'current', 'previous', 'next', 'tbd', 'tba',
    'pending', 'draft', 'final', 'approved', 'n/a', 'none'
  ];
  
  if (excludeWords.some(word => lowerName === word || lowerName.includes(word))) {
    return false;
  }

  // Should look like a name (has space or multiple words)
  const words = lowerName.split(/\s+/).filter(word => word.length >= 2);
  if (words.length >= 1 && words.every(word => /^[a-zA-Z\s\-\.]+$/.test(word))) {
    return true;
  }

  return false;
}

function isValidDate(dateStr) {
  if (!dateStr || dateStr.length < 5) return false;
  
  // Clean up the date string
  const cleanDate = dateStr.trim().replace(/[^\w\s\/\-\.]/g, '');
  
  const datePatterns = [
    /\d{1,2}[\s\/\-\.]\d{1,2}[\s\/\-\.]\d{2,4}/,
    /\d{4}[\s\/\-\.]\d{1,2}[\s\/\-\.]\d{1,2}/,
    /\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4}/i,
    /(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2},?\s+\d{4}/i
  ];
  
  for (const pattern of datePatterns) {
    if (pattern.test(cleanDate)) {
      try {
        const parsed = new Date(cleanDate);
        if (!isNaN(parsed.getTime()) && 
            parsed.getFullYear() > 1990 && 
            parsed.getFullYear() < 2040) {
          return true;
        }
      } catch (e) {
        continue;
      }
    }
  }
  
  return false;
}

// ============================================================================
// ENHANCED DOCUMENT ANALYSIS FUNCTION WITH AI RECOMMENDATIONS
// ============================================================================

async function analyzeDocument(filePath, mimetype) {
  const analysis = {
    score: 0,
    details: {
      hasTableOfContents: false,
      hasDocumentControl: false,
      hasOwners: false,
      hasSignOffDates: false,
      hasRiskAssessment: false,
      riskScore: null,
      riskRating: null,
      owners: [],
      signOffDates: [],
      departments: [],
      roles: [],
      missingElements: [],
      foundElements: [],
      summary: {}
    },
    aiRecommendations: [] // AI recommendations array
  };

  try {
    let text = '';
    
    console.log('📄 Starting document analysis for:', filePath);
    
    // Extract text from document
    if (mimetype === 'application/pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      text = data.text;
      console.log('✅ PDF text extracted, length:', text.length);
    } else if (
      mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimetype === 'application/msword'
    ) {
      const textResult = await mammoth.extractRawText({ path: filePath });
      text = textResult.value;
      console.log('✅ Word document text extracted, length:', text.length);
    } else {
      throw new Error('Unsupported file type: ' + mimetype);
    }

    if (!text || text.trim().length === 0) {
      throw new Error('No text content could be extracted from the document');
    }

    const lowerText = text.toLowerCase();
    let score = 0;

    // Enhanced section detection with weighted scoring
    const sectionChecks = {
      'Table of Contents': {
        found: /table\s+of\s+contents|contents\s+page|^contents$|index$/mi.test(text),
        weight: 10,
        priority: 'MEDIUM',
        description: 'Document navigation and structure'
      },
      'Purpose': {
        found: /purpose|objectives?|aims?/i.test(text),
        weight: 15,
        priority: 'HIGH',
        description: 'Clear statement of document purpose'
      },
      'Scope': {
        found: /scope|applies?\s+to|coverage/i.test(text),
        weight: 15,
        priority: 'HIGH',
        description: 'Definition of document scope and applicability'
      },
      'Document Control': {
        found: /document\s+control|version\s+control|document\s+management|revision\s+history/i.test(text),
        weight: 12,
        priority: 'HIGH',
        description: 'Version control and document management'
      },
      'Responsibilities': {
        found: /responsibilities|responsible\s+parties?|accountable|raci/i.test(text),
        weight: 10,
        priority: 'MEDIUM',
        description: 'Clear assignment of roles and responsibilities'
      },
      'Procedures': {
        found: /procedure|process|step|workflow|method/i.test(text) && text.length > 1000,
        weight: 20,
        priority: 'HIGH',
        description: 'Detailed procedural content and workflows'
      },
      'Risk Assessment': {
        found: /risk\s+assessment|risk\s+analysis|risk\s+management|risk\s+matrix/i.test(text),
        weight: 10,
        priority: 'MEDIUM',
        description: 'Risk identification and mitigation strategies'
      },
      'Approval': {
        found: /approval|approved\s+by|sign[\s-]*off|authorized/i.test(text),
        weight: 8,
        priority: 'LOW',
        description: 'Formal approval and authorization'
      },
      'Review Date': {
        found: /review\s+date|next\s+review|review\s+frequency/i.test(text),
        weight: 5,
        priority: 'LOW',
        description: 'Review schedule and maintenance'
      }
    };

    // Calculate weighted score and generate recommendations
    let totalWeight = 0;
    let achievedWeight = 0;
    
    Object.entries(sectionChecks).forEach(([name, check]) => {
      totalWeight += check.weight;
      if (check.found) {
        achievedWeight += check.weight;
        analysis.details.foundElements.push(name);
      } else {
        analysis.details.missingElements.push(name);
        
        // Generate AI recommendation for missing elements
        analysis.aiRecommendations.push({
          type: 'missing_section',
          priority: check.priority,
          message: `Add a ${name} section: ${check.description}`,
          impact: `+${check.weight} points`,
          category: 'Structure'
        });
      }
    });

    score = Math.round((achievedWeight / totalWeight) * 100);

    // Update specific analysis flags
    analysis.details.hasTableOfContents = sectionChecks['Table of Contents'].found;
    analysis.details.hasDocumentControl = sectionChecks['Document Control'].found;
    analysis.details.hasRiskAssessment = sectionChecks['Risk Assessment'].found;

    console.log('📊 Section analysis completed:', {
      foundSections: analysis.details.foundElements.length,
      missingSections: analysis.details.missingElements.length,
      baseScore: score
    });

    // Enhanced owner extraction with better patterns
    const ownerPatterns = [
      /(?:document\s+)?owner[s]?\s*[:：]\s*([^\n\r\t,;]+)/gi,
      /(?:procedure\s+)?owner[s]?\s*[:：]\s*([^\n\r\t,;]+)/gi,
      /prepared\s+by\s*[:：]\s*([^\n\r\t,;]+)/gi,
      /authored\s+by\s*[:：]\s*([^\n\r\t,;]+)/gi,
      /responsible\s*[:：]\s*([^\n\r\t,;]+)/gi,
      /accountable\s*[:：]\s*([^\n\r\t,;]+)/gi,
      /created\s+by\s*[:：]\s*([^\n\r\t,;]+)/gi,
      /maintained\s+by\s*[:：]\s*([^\n\r\t,;]+)/gi
    ];
    
    const foundOwners = new Set();
    ownerPatterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const owner = match[1].trim();
        if (isValidOwnerName(owner)) {
          foundOwners.add(owner);
        }
      }
    });

    analysis.details.owners = Array.from(foundOwners);
    analysis.details.hasOwners = analysis.details.owners.length > 0;

    // Enhanced date extraction
    const datePatterns = [
      /(?:review|approval|effective|expiry|next\s+review|last\s+updated?)\s*date\s*[:：]\s*([^\n\r]+)/gi,
      /(\d{1,2}[\s\/\-\.]\d{1,2}[\s\/\-\.]\d{2,4})/g,
      /(\d{4}[\s\/\-\.]\d{1,2}[\s\/\-\.]\d{1,2})/g,
      /(\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4})/gi,
      /((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2},?\s+\d{4})/gi
    ];
    
    const foundDates = new Set();
    datePatterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const date = match[1].trim();
        if (isValidDate(date)) {
          foundDates.add(date);
        }
      }
    });

    analysis.details.signOffDates = Array.from(foundDates);
    analysis.details.hasSignOffDates = analysis.details.signOffDates.length > 0;

    // Risk assessment scoring
    if (analysis.details.hasRiskAssessment) {
      const riskKeywords = [
        'high risk', 'medium risk', 'low risk',
        'risk score', 'risk level', 'risk rating',
        'critical', 'moderate', 'minimal', 'severe',
        'probability', 'impact', 'likelihood'
      ];
      
      let riskScore = 0;
      riskKeywords.forEach(keyword => {
        const matches = (text.toLowerCase().match(new RegExp(keyword, 'g')) || []).length;
        riskScore += matches;
      });
      
      analysis.details.riskScore = riskScore;
      analysis.details.riskRating = riskScore > 5 ? 'High' : riskScore > 2 ? 'Medium' : 'Low';
      
      console.log('🎯 Risk assessment analysis:', {
        riskScore: riskScore,
        riskRating: analysis.details.riskRating
      });
    }

    // Extract departments and roles
    const departmentPatterns = [
      /department[s]?\s*[:：]\s*([^\n\r\t,;]+)/gi,
      /division[s]?\s*[:：]\s*([^\n\r\t,;]+)/gi,
      /unit[s]?\s*[:：]\s*([^\n\r\t,;]+)/gi,
      /team[s]?\s*[:：]\s*([^\n\r\t,;]+)/gi
    ];
    
    const foundDepartments = new Set();
    departmentPatterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const dept = match[1].trim();
        if (dept.length > 2 && dept.length < 100) {
          foundDepartments.add(dept);
        }
      }
    });
    
    analysis.details.departments = Array.from(foundDepartments);

    // Extract roles
    const roleKeywords = [
      'manager', 'director', 'officer', 'analyst', 'specialist',
      'coordinator', 'supervisor', 'administrator', 'executive',
      'associate', 'senior', 'junior', 'lead', 'head'
    ];
    
    const foundRoles = new Set();
    roleKeywords.forEach(role => {
      const matches = text.toLowerCase().match(new RegExp(`\\b${role}\\b`, 'g')) || [];
      if (matches.length > 0) {
        foundRoles.add(role);
      }
    });
    
    analysis.details.roles = Array.from(foundRoles);

    // Document quality bonuses and penalties
    const documentLength = text.length;
    
    if (documentLength < 500) {
      score = Math.max(0, score - 30);
      analysis.aiRecommendations.push({
        type: 'content_length',
        priority: 'HIGH',
        message: 'Document appears too short for a comprehensive procedure. Consider adding more detail and examples.',
        impact: '-30 points',
        category: 'Content Quality'
      });
    } else if (documentLength > 20000) {
      analysis.aiRecommendations.push({
        type: 'content_optimization',
        priority: 'MEDIUM',
        message: 'Document is very long. Consider breaking into smaller, focused procedures for better usability.',
        impact: 'Usability Impact',
        category: 'Structure'
      });
    }

    // Structure bonuses
    if (analysis.details.hasRiskAssessment && analysis.details.hasDocumentControl) {
      score = Math.min(100, score + 10);
      analysis.aiRecommendations.push({
        type: 'structure_bonus',
        priority: 'LOW',
        message: 'Excellent document structure with both risk assessment and document control sections.',
        impact: '+10 points',
        category: 'Quality Bonus'
      });
    }

    // Content depth analysis
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 50);
    
    if (sentences.length < 20) {
      analysis.aiRecommendations.push({
        type: 'content_depth',
        priority: 'MEDIUM',
        message: 'Document may lack sufficient detail. Consider adding more comprehensive explanations.',
        impact: 'Content Quality',
        category: 'Content Quality'
      });
    }

    // Owner validation recommendations
    if (analysis.details.owners.length === 0) {
      analysis.aiRecommendations.push({
        type: 'governance',
        priority: 'HIGH',
        message: 'No document owners identified. Add clear ownership information with names and roles for accountability.',
        impact: 'Compliance Risk',
        category: 'Governance'
      });
    } else if (analysis.details.owners.length === 1) {
      analysis.aiRecommendations.push({
        type: 'governance',
        priority: 'MEDIUM',
        message: 'Consider adding a secondary owner for better governance, continuity, and backup coverage.',
        impact: 'Risk Mitigation',
        category: 'Governance'
      });
    } else {
      analysis.aiRecommendations.push({
        type: 'governance',
        priority: 'LOW',
        message: 'Good ownership structure with multiple stakeholders identified.',
        impact: 'Best Practice',
        category: 'Governance'
      });
    }

    // Date validation recommendations
    if (analysis.details.signOffDates.length === 0) {
      analysis.aiRecommendations.push({
        type: 'compliance',
        priority: 'HIGH',
        message: 'No sign-off or review dates found. Add approval dates, effective dates, and next review schedule.',
        impact: 'Compliance Risk',
        category: 'Compliance'
      });
    }

    // Technical quality checks
    const hasNumberedSteps = /\d+\.\s+/.test(text);
    const hasBulletPoints = /[•\-\*]\s+/.test(text);
    
    if (!hasNumberedSteps && !hasBulletPoints) {
      analysis.aiRecommendations.push({
        type: 'formatting',
        priority: 'MEDIUM',
        message: 'Consider using numbered steps or bullet points to improve readability and usability.',
        impact: 'Usability',
        category: 'Formatting'
      });
    }

    // Final score adjustment
    analysis.score = Math.max(0, Math.min(100, score));

    // Generate comprehensive summary
    analysis.details.summary = {
      totalElements: Object.keys(sectionChecks).length,
      foundElements: analysis.details.foundElements.length,
      missingElements: analysis.details.missingElements.length,
      documentLength: documentLength,
      hasStructure: analysis.details.hasTableOfContents,
      hasGovernance: analysis.details.hasDocumentControl,
      qualityLevel: analysis.score >= 80 ? 'High' : analysis.score >= 60 ? 'Medium' : 'Low',
      tablesFound: (text.match(/\|.*\|/g) || []).length,
      hasStructuredDocControl: /version\s*[:：]\s*\d+/i.test(text),
      ownersFound: analysis.details.owners.length,
      datesFound: analysis.details.signOffDates.length,
      departmentsFound: analysis.details.departments.length,
      rolesFound: analysis.details.roles.length,
      sentenceCount: sentences.length,
      paragraphCount: paragraphs.length,
      hasNumberedSteps: hasNumberedSteps,
      hasBulletPoints: hasBulletPoints
    };

    // Sort recommendations by priority (HIGH > MEDIUM > LOW)
    const priorityOrder = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
    analysis.aiRecommendations.sort((a, b) => {
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    console.log('✅ Enhanced document analysis completed:', {
      score: analysis.score,
      foundElements: analysis.details.foundElements.length,
      missingElements: analysis.details.missingElements.length,
      aiRecommendations: analysis.aiRecommendations.length,
      qualityLevel: analysis.details.summary.qualityLevel,
      documentLength: documentLength,
      ownersFound: analysis.details.owners.length,
      datesFound: analysis.details.signOffDates.length
    });

  } catch (err) {
    console.error('❌ Error in document analysis:', err);
    analysis.details.error = err.message;
    analysis.score = 0;
    analysis.aiRecommendations.push({
      type: 'analysis_error',
      priority: 'HIGH',
      message: `Document analysis failed: ${err.message}. Please check the file format and try again.`,
      impact: 'Score: 0',
      category: 'System Error'
    });
  }

  return analysis;
}

// ============================================================================
// SHAREPOINT INTEGRATION CLASSES & HELPERS
// ============================================================================

// Helper class for SharePoint operations
class SharePointHelper {
  static generateFolderPath(procedureData) {
    const { lob, procedure_subsection } = procedureData;
    const year = new Date().getFullYear();
    
    let folderPath = lob || 'General';
    if (procedure_subsection) {
      folderPath += `/${procedure_subsection}`;
    }
    folderPath += `/${year}`;
    
    return folderPath.replace(/[<>:"/\\|?*]/g, '_');
  }

  static generateFileName(procedureData) {
    const { name, lob, uploaded_by } = procedureData;
    const timestamp = new Date().toISOString().slice(0, 10);
    
    let fileName = `${lob || 'GEN'}_${name}_${timestamp}_${uploaded_by}`;
    fileName = fileName.replace(/[<>:"/\\|?*]/g, '_').substring(0, 100);
    
    return fileName;
  }

  static extractSharePointCookies(req) {
    const spCookies = {};
    const cookieNames = [
      'FedAuth', 'rtFa', 'EdgeAccessCookie', 'SPOIDCRL',
      'SPRequestGuid', 'WSS_FullScreenMode'
    ];

    if (req.cookies) {
      cookieNames.forEach(cookieName => {
        if (req.cookies[cookieName]) {
          spCookies[cookieName] = req.cookies[cookieName];
        }
      });
    }

    return spCookies;
  }
}

// SharePoint User Client class for handling uploads
class SharePointUserClient {
  constructor() {
    this.cookies = {};
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json;odata=verbose',
      'Content-Type': 'application/json;odata=verbose',
      'X-RequestDigest': ''
    };
  }

  extractSharePointSession(req) {
    this.cookies = SharePointHelper.extractSharePointCookies(req);
    
    // Build cookie string for requests
    this.cookieString = Object.entries(this.cookies)
      .map(([name, value]) => `${name}=${value}`)
      .join('; ');
    
    if (this.cookieString) {
      this.headers['Cookie'] = this.cookieString;
    }
  }

  async getRequestDigest(siteUrl) {
    try {
      const response = await axios.post(
        `${siteUrl}/_api/contextinfo`,
        {},
        {
          headers: {
            ...this.headers,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 10000
        }
      );

      if (response.data && response.data.d && response.data.d.GetContextWebInformation) {
        return response.data.d.GetContextWebInformation.FormDigestValue;
      }
      
      throw new Error('Unable to get request digest from SharePoint');
    } catch (error) {
      console.error('❌ Error getting SharePoint request digest:', error.message);
      throw new Error(`Failed to authenticate with SharePoint: ${error.message}`);
    }
  }

  async uploadViaRestApi(filePath, fileName, folderPath, metadata = {}) {
    try {
      const fileBuffer = fs.readFileSync(filePath);
      const fileUrl = `${SHAREPOINT_CONFIG.baseFolderPath}/${folderPath}/${fileName}`;
      
      // Get request digest
      const digest = await this.getRequestDigest(SHAREPOINT_CONFIG.siteUrl);
      this.headers['X-RequestDigest'] = digest;

      // Upload file
      const uploadResponse = await axios.post(
        `${SHAREPOINT_CONFIG.siteUrl}/_api/web/GetFolderByServerRelativeUrl('${SHAREPOINT_CONFIG.baseFolderPath}/${folderPath}')/Files/add(url='${fileName}',overwrite=true)`,
        fileBuffer,
        {
          headers: {
            ...this.headers,
            'Content-Type': 'application/octet-stream',
            'Content-Length': fileBuffer.length
          },
          timeout: 30000,
          maxContentLength: 50 * 1024 * 1024 // 50MB limit
        }
      );

      if (uploadResponse.status === 200 || uploadResponse.status === 201) {
        console.log('✅ File uploaded to SharePoint successfully');
        
        // Update file metadata if provided
        if (Object.keys(metadata).length > 0) {
          try {
            await this.updateFileMetadata(fileUrl, metadata);
          } catch (metaError) {
            console.warn('⚠️ File uploaded but metadata update failed:', metaError.message);
          }
        }

        return {
          success: true,
          webUrl: `${SHAREPOINT_CONFIG.siteUrl}${fileUrl}`,
          serverRelativeUrl: fileUrl,
          fileName: fileName,
          folderPath: folderPath
        };
      } else {
        throw new Error(`Upload failed with status: ${uploadResponse.status}`);
      }

    } catch (error) {
      console.error('❌ SharePoint REST API upload failed:', error.message);
      throw new Error(`SharePoint upload failed: ${error.message}`);
    }
  }

  async updateFileMetadata(fileUrl, metadata) {
    try {
      const updateResponse = await axios.post(
        `${SHAREPOINT_CONFIG.siteUrl}/_api/web/GetFileByServerRelativeUrl('${fileUrl}')/ListItemAllFields`,
        metadata,
        {
          headers: {
            ...this.headers,
            'X-HTTP-Method': 'MERGE',
            'If-Match': '*'
          },
          timeout: 10000
        }
      );

      console.log('✅ File metadata updated successfully');
      return updateResponse.data;
    } catch (error) {
      console.error('❌ Error updating file metadata:', error.message);
      throw error;
    }
  }

  async createFolder(folderPath) {
    try {
      const folderResponse = await axios.post(
        `${SHAREPOINT_CONFIG.siteUrl}/_api/web/folders`,
        {
          '__metadata': { 'type': 'SP.Folder' },
          'ServerRelativeUrl': `${SHAREPOINT_CONFIG.baseFolderPath}/${folderPath}`
        },
        {
          headers: this.headers,
          timeout: 10000
        }
      );

      console.log('✅ SharePoint folder created:', folderPath);
      return folderResponse.data;
    } catch (error) {
      if (error.response && error.response.status === 409) {
        console.log('📁 Folder already exists:', folderPath);
        return { exists: true };
      }
      console.error('❌ Error creating SharePoint folder:', error.message);
      throw error;
    }
  }
}

// ============================================================================
// SHAREPOINT API ENDPOINTS
// ============================================================================

// API: Get SharePoint configuration
app.get('/ProceduresHubEG6/api/sharepoint/config', (req, res) => {
  try {
    if (!req.staffId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    console.log('📋 Getting SharePoint config for user:', req.staffId);

    // Extract SharePoint cookies from request
    const spCookies = SharePointHelper.extractSharePointCookies(req);
    const hasSharePointSession = Object.keys(spCookies).length > 0;

    const procedureData = {
      lob: req.query.lob || 'General',
      procedure_subsection: req.query.subsection || '',
      name: req.query.name || 'New_Procedure',
      uploaded_by: req.staffId
    };

    const folderPath = SharePointHelper.generateFolderPath(procedureData);
    const fileName = SharePointHelper.generateFileName(procedureData);

    // Generate upload URLs
    const baseUrl = SHAREPOINT_CONFIG.siteUrl;
    const encodedFolderPath = encodeURIComponent(`${SHAREPOINT_CONFIG.baseFolderPath}/${folderPath}`);
    
    const uploadUrls = {
      uploadUrl: `${baseUrl}/_layouts/15/upload.aspx?List=${SHAREPOINT_CONFIG.libraryName}&RootFolder=${encodedFolderPath}`,
      folderUrl: `${baseUrl}/${SHAREPOINT_CONFIG.baseFolderPath}/${folderPath}`.replace(/\/+/g, '/'),
      libraryUrl: `${baseUrl}/_layouts/15/viewlsts.aspx?view=14`
    };

    console.log('✅ SharePoint config generated:', {
      hasSession: hasSharePointSession,
      folderPath,
      fileName
    });

    res.json({
      success: true,
      hasSharePointSession,
      config: {
        siteUrl: SHAREPOINT_CONFIG.siteUrl,
        libraryName: SHAREPOINT_CONFIG.libraryName,
        folderPath: folderPath,
        suggestedFileName: fileName,
        fullPath: `${SHAREPOINT_CONFIG.baseFolderPath}/${folderPath}/${fileName}`
      },
      uploadOptions: {
        restApiUpload: hasSharePointSession,
        clientUpload: true,
        formUpload: true
      },
      urls: uploadUrls,
      user: {
        staffId: req.staffId,
        displayName: req.userInfo?.displayName
      },
      instructions: hasSharePointSession ? 
        'SharePoint session detected. You can upload directly via our system or use SharePoint interface.' :
        'No SharePoint session detected. Please use the SharePoint interface option or login to SharePoint first.'
    });

  } catch (error) {
    console.error('❌ Error getting SharePoint config:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get SharePoint configuration',
      error: error.message 
    });
  }
});

// API: Upload file to SharePoint (server-side with user session)
app.post('/ProceduresHubEG6/api/sharepoint/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.staffId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    console.log('📤 Starting SharePoint upload for user:', req.staffId);

    // Extract SharePoint cookies
    const spCookies = SharePointHelper.extractSharePointCookies(req);
    
    if (Object.keys(spCookies).length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'SharePoint session required. Please login to SharePoint first.',
        loginUrl: `${SHAREPOINT_CONFIG.siteUrl}/_layouts/15/authenticate.aspx`,
        alternative: 'Use the "SharePoint Interface" upload method instead.'
      });
    }

    const procedureData = {
      name: req.body.name || 'Unnamed_Procedure',
      lob: req.body.lob || 'General',
      procedure_subsection: req.body.procedure_subsection || '',
      uploaded_by: req.staffId
    };

    const folderPath = SharePointHelper.generateFolderPath(procedureData);
    const fileName = SharePointHelper.generateFileName(procedureData) + path.extname(req.file.originalname);

    console.log('📁 Upload destination:', {
      folderPath,
      fileName,
      fileSize: req.file.size
    });

    // Use SharePoint client for upload
    const client = new SharePointUserClient();
    client.extractSharePointSession(req);

    try {
      // Create folder if it doesn't exist
      await client.createFolder(folderPath);

      const result = await client.uploadViaRestApi(
        req.file.path,
        fileName,
        folderPath,
        {
          Title: procedureData.name,
          LOB: procedureData.lob,
          UploadedBy: req.staffId,
          UploadDate: new Date().toISOString()
        }
      );

      // Clean up temporary file
      fs.unlinkSync(req.file.path);

      // Add audit log
      addAuditLog('SHAREPOINT_UPLOAD', {
        fileName: fileName,
        folderPath: folderPath,
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

    } catch (uploadError) {
      // Fallback: Save to local sync folder if available
      const sharePointSyncPath = process.env.SHAREPOINT_SYNC_PATH;
      if (sharePointSyncPath && fs.existsSync(sharePointSyncPath)) {
        const destFolder = path.join(sharePointSyncPath, folderPath);
        const destFile = path.join(destFolder, fileName);
        
        // Create folder structure
        if (!fs.existsSync(destFolder)) {
          fs.mkdirSync(destFolder, { recursive: true });
        }
        
        // Copy file
        fs.copyFileSync(req.file.path, destFile);
        fs.unlinkSync(req.file.path);

        addAuditLog('SHAREPOINT_SYNC_UPLOAD', {
          fileName: fileName,
          folderPath: folderPath,
          localPath: destFile,
          uploadMethod: 'sync_folder'
        }, req.staffId);

        res.json({
          success: true,
          message: 'File saved to SharePoint sync folder',
          sharePointResult: {
            method: 'sync_folder',
            localPath: destFile,
            fileName: fileName,
            folderPath: folderPath
          },
          procedureData: procedureData
        });
      } else {
        throw uploadError;
      }
    }

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
app.get('/ProceduresHubEG6/api/sharepoint/upload-form', (req, res) => {
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

    const folderPath = SharePointHelper.generateFolderPath(procedureData);
    const fileName = SharePointHelper.generateFileName(procedureData);
    const fullFolderPath = `${SHAREPOINT_CONFIG.baseFolderPath}/${folderPath}`;
    
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
              .info-grid {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 15px;
                  margin: 20px 0;
                  padding: 20px;
                  background: #f8f9fa;
                  border-radius: 8px;
              }
              .info-item {
                  padding: 10px;
                  background: white;
                  border-radius: 4px;
                  border-left: 3px solid #d40000;
              }
              .form-container { 
                  border: 2px solid #d40000; 
                  padding: 25px; 
                  border-radius: 8px;
                  background: #fff8f8;
                  margin: 20px 0;
              }
              .file-input {
                  width: 100%;
                  padding: 12px;
                  border: 2px dashed #d40000;
                  border-radius: 8px;
                  background: white;
                  margin: 15px 0;
                  text-align: center;
                  cursor: pointer;
                  transition: all 0.3s ease;
              }
              .file-input:hover {
                  background: #fff5f5;
                  border-color: #b30000;
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
                  transition: background 0.3s ease;
              }
              .submit-btn:hover {
                  background: #b30000;
              }
              .instructions {
                  background: #e7f3ff;
                  padding: 20px;
                  border-radius: 8px;
                  border-left: 4px solid #2196F3;
                  margin: 20px 0;
              }
              .warning {
                  background: #fff3cd;
                  padding: 15px;
                  border-radius: 8px;
                  border-left: 4px solid #ffc107;
                  margin: 15px 0;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>📁 HSBC SharePoint Upload</h1>
                  <p>Procedures Hub - Document Upload</p>
              </div>
              
              <div class="info-grid">
                  <div class="info-item">
                      <strong>👤 User:</strong><br>
                      ${req.userInfo?.displayName || req.staffId}<br>
                      <small>(${req.staffId})</small>
                  </div>
                  <div class="info-item">
                      <strong>🏢 LOB:</strong><br>
                      ${procedureData.lob}
                  </div>
                  <div class="info-item">
                      <strong>📂 Destination Folder:</strong><br>
                      <small>${folderPath}</small>
                  </div>
                  <div class="info-item">
                      <strong>📄 Suggested Filename:</strong><br>
                      <small>${fileName}</small>
                  </div>
              </div>

              <div class="instructions">
                  <h3>📋 Upload Instructions:</h3>
                  <ol>
                      <li><strong>Select your procedure file</strong> using the file selector below</li>
                      <li><strong>Click "Upload to SharePoint"</strong> to start the upload</li>
                      <li><strong>You'll be redirected</strong> to SharePoint to complete the upload</li>
                      <li><strong>Follow SharePoint's prompts</strong> to finalize the upload</li>
                      <li><strong>Close this window</strong> when the upload is complete</li>
                  </ol>
              </div>

              <div class="warning">
                  <strong>⚠️ Important:</strong> Make sure you're logged into SharePoint before uploading. 
                  The file will be uploaded to: <br>
                  <code>${SHAREPOINT_CONFIG.siteUrl}</code>
              </div>
              
              <form action="${SHAREPOINT_CONFIG.siteUrl}/_layouts/15/uploadex.aspx" method="post" enctype="multipart/form-data" target="_blank">
                  <div class="form-container">
                      <h3>📤 File Upload</h3>
                      
                      <input type="hidden" name="RootFolder" value="${fullFolderPath}" />
                      <input type="hidden" name="FolderCTID" value="0x012000" />
                      <input type="hidden" name="Source" value="${redirectUrl}" />
                      
                      <div class="file-input">
                          <input type="file" name="fileUpload" accept=".pdf,.docx,.doc,.pptx,.ppt,.xlsx,.xls" required 
                                 style="width: 100%; padding: 10px; border: none; background: transparent;" />
                      </div>
                      
                      <button type="submit" class="submit-btn">
                          🚀 Upload to SharePoint
                      </button>
                  </div>
              </form>

              <div style="margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px; text-align: center;">
                  <p><strong>🔗 Quick Links:</strong></p>
                  <a href="${SHAREPOINT_CONFIG.siteUrl}" target="_blank" style="color: #d40000; text-decoration: none; margin: 0 10px;">
                      📂 Open SharePoint Site
                  </a>
                  |
                  <a href="javascript:window.close();" style="color: #d40000; text-decoration: none; margin: 0 10px;">
                      ❌ Close Window
                  </a>
              </div>
          </div>

          <script>
              // Auto-close window after successful upload
              window.addEventListener('beforeunload', function() {
                  if (window.opener) {
                      window.opener.postMessage({
                          type: 'sharepoint-upload-complete',
                          data: {
                              method: 'form_upload',
                              folder: '${folderPath}',
                              user: '${req.staffId}'
                          }
                      }, '*');
                  }
              });

              // Handle form submission
              document.querySelector('form').addEventListener('submit', function() {
                  console.log('SharePoint upload form submitted');
                  setTimeout(function() {
                      alert('Upload form submitted! Please complete the upload in SharePoint and then close this window.');
                  }, 1000);
              });
          </script>
      </body>
      </html>
    `);

  } catch (error) {
    console.error('❌ Error generating upload form:', error);
    res.status(500).send(`
      <html>
        <body style="font-family: Arial, sans-serif; padding: 50px; text-align: center;">
          <h2 style="color: #d40000;">❌ Error</h2>
          <p>Failed to generate upload form: ${error.message}</p>
          <button onclick="window.close()" style="background: #d40000; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer;">
            Close Window
          </button>
        </body>
      </html>
    `);
  }
});

// API: SharePoint upload success callback
app.get('/ProceduresHubEG6/sharepoint-success', (req, res) => {
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
app.get('/ProceduresHubEG6/api/sharepoint/test', (req, res) => {
  try {
    if (!req.staffId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const spCookies = SharePointHelper.extractSharePointCookies(req);
    
    res.json({
      success: true,
      sharePointConfig: {
        siteUrl: SHAREPOINT_CONFIG.siteUrl,
        libraryName: SHAREPOINT_CONFIG.libraryName,
        baseFolderPath: SHAREPOINT_CONFIG.baseFolderPath
      },
      userSession: {
        staffId: req.staffId,
        displayName: req.userInfo?.displayName,
        hasSharePointCookies: Object.keys(spCookies).length > 0,
        cookieCount: Object.keys(spCookies).length,
        cookieNames: Object.keys(spCookies)
      },
      testResults: {
        configurationValid: !!(SHAREPOINT_CONFIG.siteUrl && SHAREPOINT_CONFIG.libraryName),
        userAuthenticated: !!req.staffId,
        sharePointSessionAvailable: Object.keys(spCookies).length > 0
      },
      recommendations: Object.keys(spCookies).length === 0 ? [
        'Login to SharePoint in another browser tab',
        'Use the "SharePoint Interface" upload method',
        'Contact IT support for SharePoint access issues'
      ] : [
        'All systems ready for SharePoint integration',
        'You can use direct upload or SharePoint interface'
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

// ============================================================================
// PROCEDURE MANAGEMENT ENDPOINTS
// ============================================================================

// API: Get all procedures
app.get('/ProceduresHubEG6/api/procedures', (req, res) => {
  try {
    const data = fs.readFileSync(proceduresPath);
    const procedures = JSON.parse(data);
    
    // Filter based on user role and ownership
    let filteredProcedures = procedures;
    
    if (req.userRole !== 'admin') {
      // Non-admin users can only see procedures they own or are associated with
      filteredProcedures = procedures.filter(proc => 
        proc.primary_owner === req.staffId || 
        proc.secondary_owner === req.staffId ||
        proc.uploaded_by === req.staffId
      );
    }
    
    console.log('📋 Procedures retrieved:', {
      totalInSystem: procedures.length,
      returnedToUser: filteredProcedures.length,
      userRole: req.userRole,
      staffId: req.staffId
    });
    
    res.json(filteredProcedures);
  } catch (err) {
    console.error('❌ Error reading procedures:', err);
    res.status(500).json({ 
      message: 'Error loading procedures',
      error: err.message 
    });
  }
});

// API: Add a new procedure with document analysis and SharePoint integration
app.post('/ProceduresHubEG6/api/procedures', upload.single('file'), async (req, res) => {
  try {
    console.log('📤 New procedure submission started:', {
      user: req.staffId,
      fileName: req.file?.originalname,
      procedureName: req.body.name
    });

    let analysis = { score: 0, details: {}, aiRecommendations: [] };
    let sharePointResult = null;
    
    if (req.file) {
      console.log('📊 Starting document analysis...');
      analysis = await analyzeDocument(req.file.path, req.file.mimetype);
      console.log('✅ Document analysis completed:', {
        score: analysis.score,
        recommendations: analysis.aiRecommendations.length
      });
    }

    // Check if document meets quality threshold
    const MINIMUM_QUALITY_SCORE = 60; // Adjustable threshold
    if (analysis.score < MINIMUM_QUALITY_SCORE) {
      console.log('❌ Document rejected - quality too low:', analysis.score);
      
      // Delete the uploaded file since it doesn't meet quality standards
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      
      return res.status(200).json({ 
        message: `Document quality score (${analysis.score}%) is below the required minimum of ${MINIMUM_QUALITY_SCORE}%.`,
        analysis: analysis,
        accepted: false
      });
    }

    // Document meets quality standards, proceed with saving
    const data = JSON.parse(fs.readFileSync(proceduresPath));
    const newId = data.length ? data[data.length - 1].id + 1 : 1;

    const newProcedure = {
      id: newId,
      name: req.body.name || 'Unnamed Procedure',
      expiry: req.body.expiry || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      primary_owner: req.body.primary_owner || req.staffId,
      primary_owner_email: req.body.primary_owner_email || `${req.staffId}@hsbc.com`,
      secondary_owner: req.body.secondary_owner || '',
      secondary_owner_email: req.body.secondary_owner_email || '',
      lob: req.body.lob || 'General',
      procedure_subsection: req.body.procedure_subsection || '',
      sharepoint_folder: req.body.sharepoint_folder || '',
      file_link: req.file ? `/uploads/${req.file.filename}` : '',
      original_filename: req.file ? req.file.originalname : '',
      file_size: req.file ? req.file.size : 0,
      score: analysis.score,
      quality_details: analysis.details,
      ai_recommendations: analysis.aiRecommendations,
      status: "active",
      uploaded_by: req.staffId || 'Unknown',
      uploaded_at: new Date().toISOString(),
      sharepoint_uploaded: false,
      sharepoint_url: null
    };

    // Attempt SharePoint upload if file exists and user wants it
    if (req.file && req.body.upload_to_sharepoint !== 'false') {
      try {
        console.log('📤 Attempting SharePoint upload...');
        
        const spCookies = SharePointHelper.extractSharePointCookies(req);
        
        if (Object.keys(spCookies).length > 0) {
          const client = new SharePointUserClient();
          client.extractSharePointSession(req);
          
          const folderPath = SharePointHelper.generateFolderPath(newProcedure);
          const fileName = SharePointHelper.generateFileName(newProcedure) + path.extname(req.file.originalname);
          
          // Create folder and upload
          await client.createFolder(folderPath);
          sharePointResult = await client.uploadViaRestApi(
            req.file.path,
            fileName,
            folderPath,
            {
              Title: newProcedure.name,
              LOB: newProcedure.lob,
              UploadedBy: req.staffId,
              UploadDate: new Date().toISOString(),
              QualityScore: analysis.score
            }
          );
          
          // Update procedure with SharePoint info
          newProcedure.sharepoint_uploaded = true;
          newProcedure.sharepoint_url = sharePointResult.webUrl;
          newProcedure.sharepoint_folder_path = folderPath;
          newProcedure.sharepoint_filename = fileName;
          
          console.log('✅ SharePoint upload successful:', sharePointResult.webUrl);
          
          addAuditLog('SHAREPOINT_AUTO_UPLOAD', {
            procedureId: newId,
            fileName: fileName,
            sharePointUrl: sharePointResult.webUrl
          }, req.staffId);
          
        } else {
          console.log('⚠️ No SharePoint session - skipping automatic upload');
        }
      } catch (spError) {
        console.error('❌ SharePoint upload failed (continuing with procedure save):', spError.message);
        
        // Don't fail the entire procedure creation if SharePoint fails
        newProcedure.sharepoint_error = spError.message;
      }
    }

    // Save procedure to database
    data.push(newProcedure);
    fs.writeFileSync(proceduresPath, JSON.stringify(data, null, 4));
    
    // Add audit log entry
    addAuditLog('PROCEDURE_CREATED', {
      procedureId: newId,
      procedureName: newProcedure.name,
      score: analysis.score,
      lob: newProcedure.lob,
      sharePointUploaded: newProcedure.sharepoint_uploaded,
      uploadedBy: req.staffId
    }, req.staffId);
    
    console.log('✅ Procedure created successfully:', {
      id: newId,
      name: newProcedure.name,
      score: analysis.score,
      sharePointUploaded: newProcedure.sharepoint_uploaded
    });
    
    const response = { 
      message: 'Procedure uploaded successfully',
      analysis: analysis,
      procedure: newProcedure,
      accepted: true
    };

    // Add SharePoint info to response if uploaded
    if (sharePointResult) {
      response.sharepoint_upload_success = true;
      response.sharepoint_url = sharePointResult.webUrl;
      response.sharepoint_result = sharePointResult;
    }
    
    res.status(201).json(response);
    
  } catch (err) {
    console.error('❌ Error adding procedure:', err);
    
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      message: 'Error adding procedure: ' + err.message,
      error: err.message,
      accepted: false
    });
  }
});

// ============================================================================
// USER DASHBOARD ENDPOINTS
// ============================================================================

// API: User dashboard data endpoint
app.get('/ProceduresHubEG6/api/user/dashboard', (req, res) => {
  try {
    if (!req.staffId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    console.log('📊 Getting dashboard data for user:', req.staffId);

    const procedures = JSON.parse(fs.readFileSync(proceduresPath));
    
    // Filter procedures owned by the current user
    const userProcedures = procedures.filter(proc => 
      proc.primary_owner === req.staffId || 
      proc.secondary_owner === req.staffId ||
      proc.uploaded_by === req.staffId
    );

    const now = new Date();
    const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

    // Calculate user-specific stats
    const stats = {
      total: userProcedures.length,
      expiringSoon: userProcedures.filter(p => {
        const expiry = new Date(p.expiry);
        return expiry > now && expiry - now < THIRTY_DAYS;
      }).length,
      expired: userProcedures.filter(p => new Date(p.expiry) < now).length,
      highQuality: userProcedures.filter(p => (p.score || 0) >= 80).length
    };

    // Generate recent activity for user's procedures
    const recentActivity = userProcedures
      .sort((a, b) => new Date(b.uploaded_at || 0) - new Date(a.uploaded_at || 0))
      .slice(0, 5)
      .map(proc => {
        const expiryDate = new Date(proc.expiry);
        const isExpired = expiryDate < now;
        const isExpiringSoon = !isExpired && (expiryDate - now) < THIRTY_DAYS;
        
        let activityType = 'update';
        let action = 'Procedure updated';
        
        if (isExpired) {
          activityType = 'expired';
          action = 'Procedure expired';
        } else if (isExpiringSoon) {
          activityType = 'warning';
          action = 'Expiring soon';
        } else if (proc.uploaded_by === req.staffId) {
          activityType = 'assignment';
          action = 'Procedure uploaded';
        }

        return {
          id: proc.id,
          type: activityType,
          action: action,
          procedure: proc.name,
          score: proc.score,
          time: proc.uploaded_at ? new Date(proc.uploaded_at).toLocaleDateString() : 'Unknown'
        };
      });

    // User info from server middleware
    const userInfo = {
      displayName: req.userInfo?.displayName || req.staffId,
      email: req.userInfo?.mail || `${req.staffId}@hsbc.com`,
      adUserId: req.userInfo?.adUserId || req.staffId,
      department: req.userInfo?.department || null,
      jobTitle: req.userInfo?.jobTitle || null,
      staffId: req.staffId,
      role: req.userRole
    };

    console.log('✅ Dashboard data prepared:', {
      totalProcedures: stats.total,
      expiringSoon: stats.expiringSoon,
      highQuality: stats.highQuality,
      recentActivityCount: recentActivity.length
    });

    res.json({
      stats,
      recentActivity,
      userInfo
    });

  } catch (err) {
    console.error('❌ Error getting user dashboard data:', err);
    res.status(500).json({ 
      message: 'Error loading dashboard data',
      error: err.message 
    });
  }
});

// API: Get user's procedures - FIXED VERSION
app.get('/ProceduresHubEG6/api/user/procedures', (req, res) => {
  try {
    if (!req.staffId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    console.log('📋 Getting procedures for user:', req.staffId);

    const procedures = JSON.parse(fs.readFileSync(proceduresPath));
    
    // Filter procedures owned by the current user
    const userProcedures = procedures.filter(proc => 
      proc.primary_owner === req.staffId || 
      proc.secondary_owner === req.staffId ||
      proc.uploaded_by === req.staffId
    );

    // Add calculated fields
    const now = new Date();
    const enrichedProcedures = userProcedures.map(proc => {
      const expiryDate = new Date(proc.expiry);
      const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
      
      return {
        ...proc,
        daysUntilExpiry,
        isExpired: daysUntilExpiry < 0,
        isExpiringSoon: daysUntilExpiry >= 0 && daysUntilExpiry <= 30,
        qualityLevel: (proc.score || 0) >= 80 ? 'High' : (proc.score || 0) >= 60 ? 'Medium' : 'Low'
      };
    });

    console.log('✅ User procedures retrieved:', {
      totalCount: enrichedProcedures.length,
      expired: enrichedProcedures.filter(p => p.isExpired).length,
      expiringSoon: enrichedProcedures.filter(p => p.isExpiringSoon).length
    });

    res.json(enrichedProcedures);

  } catch (err) {
    console.error('❌ Error getting user procedures:', err);
    res.status(500).json({ 
      message: 'Error loading user procedures',
      error: err.message 
    });
  }
});

// API: Get single procedure details
app.get('/ProceduresHubEG6/api/procedures/:id', (req, res) => {
  try {
    const procedures = JSON.parse(fs.readFileSync(proceduresPath));
    const procedure = procedures.find(p => p.id === parseInt(req.params.id));
    
    if (!procedure) {
      return res.status(404).json({ message: 'Procedure not found' });
    }

    // Check if user has access to this procedure
    const hasAccess = req.userRole === 'admin' || 
                     procedure.primary_owner === req.staffId ||
                     procedure.secondary_owner === req.staffId ||
                     procedure.uploaded_by === req.staffId;

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied to this procedure' });
    }

    // Enrich procedure data
    const now = new Date();
    const expiryDate = new Date(procedure.expiry);
    const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

    const enrichedProcedure = {
      ...procedure,
      daysUntilExpiry,
      isExpired: daysUntilExpiry < 0,
      isExpiringSoon: daysUntilExpiry >= 0 && daysUntilExpiry <= 30,
      qualityLevel: (procedure.score || 0) >= 80 ? 'High' : (procedure.score || 0) >= 60 ? 'Medium' : 'Low',
      accessLevel: req.userRole === 'admin' ? 'admin' : 'owner'
    };

    res.json(enrichedProcedure);

  } catch (err) {
    console.error('❌ Error getting procedure details:', err);
    res.status(500).json({ 
      message: 'Error loading procedure details',
      error: err.message 
    });
  }
});

// ============================================================================
// ADMIN MANAGEMENT ENDPOINTS
// ============================================================================

// API: Get all procedures (admin only)
app.get('/ProceduresHubEG6/api/admin/procedures', (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    console.log('🔧 Admin getting all procedures');

    const procedures = JSON.parse(fs.readFileSync(proceduresPath));
    
    // Add calculated fields for admin view
    const now = new Date();
    const enrichedProcedures = procedures.map(proc => {
      const expiryDate = new Date(proc.expiry);
      const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
      
      return {
        ...proc,
        daysUntilExpiry,
        isExpired: daysUntilExpiry < 0,
        isExpiringSoon: daysUntilExpiry >= 0 && daysUntilExpiry <= 30,
        qualityLevel: (proc.score || 0) >= 80 ? 'High' : (proc.score || 0) >= 60 ? 'Medium' : 'Low'
      };
    });

    console.log('✅ Admin procedures retrieved:', {
      totalCount: enrichedProcedures.length,
      expired: enrichedProcedures.filter(p => p.isExpired).length,
      expiringSoon: enrichedProcedures.filter(p => p.isExpiringSoon).length,
      highQuality: enrichedProcedures.filter(p => (p.score || 0) >= 80).length
    });

    res.json(enrichedProcedures);

  } catch (err) {
    console.error('❌ Error getting admin procedures:', err);
    res.status(500).json({ 
      message: 'Error loading procedures',
      error: err.message 
    });
  }
});

// API: Update procedure (admin only)
app.put('/ProceduresHubEG6/api/admin/procedures/:id', (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const procedures = JSON.parse(fs.readFileSync(proceduresPath));
    const procedureIndex = procedures.findIndex(p => p.id === parseInt(req.params.id));
    
    if (procedureIndex === -1) {
      return res.status(404).json({ message: 'Procedure not found' });
    }

    const originalProcedure = procedures[procedureIndex];
    
    // Update procedure with new data
    const updatedProcedure = {
      ...originalProcedure,
      ...req.body,
      id: originalProcedure.id, // Preserve ID
      updated_by: req.staffId,
      updated_at: new Date().toISOString()
    };

    procedures[procedureIndex] = updatedProcedure;
    fs.writeFileSync(proceduresPath, JSON.stringify(procedures, null, 4));

    // Add audit log
    addAuditLog('PROCEDURE_UPDATED', {
      procedureId: updatedProcedure.id,
      procedureName: updatedProcedure.name,
      changes: Object.keys(req.body),
      updatedBy: req.staffId
    }, req.staffId);

    console.log('✅ Procedure updated by admin:', {
      id: updatedProcedure.id,
      name: updatedProcedure.name,
      updatedBy: req.staffId
    });

    res.json({ 
      message: 'Procedure updated successfully',
      procedure: updatedProcedure
    });

  } catch (err) {
    console.error('❌ Error updating procedure:', err);
    res.status(500).json({ 
      message: 'Error updating procedure',
      error: err.message 
    });
  }
});

// API: Delete procedure (admin only)
app.delete('/ProceduresHubEG6/api/admin/procedures/:id', (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const procedures = JSON.parse(fs.readFileSync(proceduresPath));
    const procedureIndex = procedures.findIndex(p => p.id === parseInt(req.params.id));
    
    if (procedureIndex === -1) {
      return res.status(404).json({ message: 'Procedure not found' });
    }

    const deletedProcedure = procedures[procedureIndex];
    
    // Remove from array
    procedures.splice(procedureIndex, 1);
    fs.writeFileSync(proceduresPath, JSON.stringify(procedures, null, 4));

    // Delete associated file if it exists
    if (deletedProcedure.file_link) {
      const filePath = path.join(__dirname, deletedProcedure.file_link);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Add audit log
    addAuditLog('PROCEDURE_DELETED', {
      procedureId: deletedProcedure.id,
      procedureName: deletedProcedure.name,
      deletedBy: req.staffId
    }, req.staffId);

    console.log('✅ Procedure deleted by admin:', {
      id: deletedProcedure.id,
      name: deletedProcedure.name,
      deletedBy: req.staffId
    });

    res.json({ 
      message: 'Procedure deleted successfully',
      deletedProcedure: {
        id: deletedProcedure.id,
        name: deletedProcedure.name
      }
    });

  } catch (err) {
    console.error('❌ Error deleting procedure:', err);
    res.status(500).json({ 
      message: 'Error deleting procedure',
      error: err.message 
    });
  }
});

// API: Get admin dashboard statistics
app.get('/ProceduresHubEG6/api/admin/dashboard', (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    console.log('📊 Getting admin dashboard data');

    const procedures = JSON.parse(fs.readFileSync(proceduresPath));
    const auditLog = JSON.parse(fs.readFileSync(auditLogPath));
    
    const now = new Date();
    const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

    // Calculate comprehensive statistics
    const stats = {
      totalProcedures: procedures.length,
      activeProcedures: procedures.filter(p => p.status === 'active').length,
      expiredProcedures: procedures.filter(p => new Date(p.expiry) < now).length,
      expiringSoon: procedures.filter(p => {
        const expiry = new Date(p.expiry);
        return expiry > now && expiry - now < THIRTY_DAYS;
      }).length,
      highQualityProcedures: procedures.filter(p => (p.score || 0) >= 80).length,
      mediumQualityProcedures: procedures.filter(p => (p.score || 0) >= 60 && (p.score || 0) < 80).length,
      lowQualityProcedures: procedures.filter(p => (p.score || 0) < 60).length,
      averageQualityScore: procedures.length > 0 ? 
        Math.round(procedures.reduce((sum, p) => sum + (p.score || 0), 0) / procedures.length) : 0,
      sharePointUploaded: procedures.filter(p => p.sharepoint_uploaded === true).length,
      recentUploads: procedures.filter(p => {
        const uploadDate = new Date(p.uploaded_at);
        return now - uploadDate < SEVEN_DAYS;
      }).length
    };

    // LOB breakdown
    const lobStats = {};
    procedures.forEach(proc => {
      const lob = proc.lob || 'Unknown';
      if (!lobStats[lob]) {
        lobStats[lob] = { count: 0, avgScore: 0, expired: 0, expiringSoon: 0 };
      }
      lobStats[lob].count++;
      lobStats[lob].avgScore += proc.score || 0;
      
      const expiry = new Date(proc.expiry);
      if (expiry < now) {
        lobStats[lob].expired++;
      } else if (expiry - now < THIRTY_DAYS) {
        lobStats[lob].expiringSoon++;
      }
    });

    // Calculate average scores for each LOB
    Object.keys(lobStats).forEach(lob => {
      lobStats[lob].avgScore = lobStats[lob].count > 0 ? 
        Math.round(lobStats[lob].avgScore / lobStats[lob].count) : 0;
    });

    // Recent activity from audit log
    const recentActivity = auditLog
      .filter(log => now - new Date(log.timestamp) < SEVEN_DAYS)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10)
      .map(log => ({
        id: log.id,
        action: log.action,
        user: log.userId,
        timestamp: log.timestamp,
        details: log.details
      }));

    // User activity summary
    const userActivity = {};
    auditLog.forEach(log => {
      const user = log.userId;
      if (!userActivity[user]) {
        userActivity[user] = { uploads: 0, updates: 0, deletes: 0, lastActivity: log.timestamp };
      }
      
      if (log.action === 'PROCEDURE_CREATED') userActivity[user].uploads++;
      if (log.action === 'PROCEDURE_UPDATED') userActivity[user].updates++;
      if (log.action === 'PROCEDURE_DELETED') userActivity[user].deletes++;
      
      if (new Date(log.timestamp) > new Date(userActivity[user].lastActivity)) {
        userActivity[user].lastActivity = log.timestamp;
      }
    });

    console.log('✅ Admin dashboard data prepared:', {
      totalProcedures: stats.totalProcedures,
      expired: stats.expiredProcedures,
      expiringSoon: stats.expiringSoon,
      avgQuality: stats.averageQualityScore
    });

    res.json({
      stats,
      lobStats,
      recentActivity,
      userActivity,
      systemHealth: {
        totalUsers: Object.keys(userActivity).length,
        activeUsersLast7Days: Object.keys(userActivity).filter(user => 
          now - new Date(userActivity[user].lastActivity) < SEVEN_DAYS
        ).length,
        averageQualityTrend: stats.averageQualityScore >= 75 ? 'improving' : 
                           stats.averageQualityScore >= 60 ? 'stable' : 'needs_attention',
        sharePointIntegration: stats.sharePointUploaded / stats.totalProcedures > 0.5 ? 'good' : 'needs_improvement'
      }
    });

  } catch (err) {
    console.error('❌ Error getting admin dashboard data:', err);
    res.status(500).json({ 
      message: 'Error loading admin dashboard data',
      error: err.message 
    });
  }
});

// API: Get audit log (admin only)
app.get('/ProceduresHubEG6/api/admin/audit-log', (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const action = req.query.action;
    const userId = req.query.userId;

    console.log('📋 Getting audit log:', { page, limit, action, userId });

    let auditLog = JSON.parse(fs.readFileSync(auditLogPath));
    
    // Filter by action if specified
    if (action) {
      auditLog = auditLog.filter(log => log.action === action);
    }
    
    // Filter by user if specified
    if (userId) {
      auditLog = auditLog.filter(log => log.userId === userId);
    }
    
    // Sort by timestamp (newest first)
    auditLog.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedLog = auditLog.slice(startIndex, endIndex);
    
    res.json({
      logs: paginatedLog,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(auditLog.length / limit),
        totalRecords: auditLog.length,
        hasNext: endIndex < auditLog.length,
        hasPrevious: page > 1
      },
      filters: {
        action,
        userId
      }
    });

  } catch (err) {
    console.error('❌ Error getting audit log:', err);
    res.status(500).json({ 
      message: 'Error loading audit log',
      error: err.message 
    });
  }
});

// API: Export procedures data (admin only)
app.get('/ProceduresHubEG6/api/admin/export', (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const format = req.query.format || 'json';
    const procedures = JSON.parse(fs.readFileSync(proceduresPath));
    
    console.log('📤 Exporting procedures data:', { format, count: procedures.length });

    if (format === 'csv') {
      // Generate CSV
      const csvHeader = 'ID,Name,LOB,Primary Owner,Secondary Owner,Expiry,Score,Status,Upload Date,SharePoint URL\n';
      const csvRows = procedures.map(proc => [
        proc.id,
        `"${proc.name}"`,
        proc.lob,
        proc.primary_owner,
        proc.secondary_owner,
        proc.expiry,
        proc.score || 0,
        proc.status,
        proc.uploaded_at,
        proc.sharepoint_url || ''
      ].join(','));
      
      const csvContent = csvHeader + csvRows.join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="procedures-export-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvContent);
      
    } else {
      // JSON export (default)
      const exportData = {
        exportDate: new Date().toISOString(),
        exportedBy: req.staffId,
        totalRecords: procedures.length,
        procedures: procedures
      };
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="procedures-export-${new Date().toISOString().split('T')[0]}.json"`);
      res.json(exportData);
    }

    // Log export action
    addAuditLog('DATA_EXPORT', {
      format: format,
      recordCount: procedures.length,
      exportedBy: req.staffId
    }, req.staffId);

  } catch (err) {
    console.error('❌ Error exporting data:', err);
    res.status(500).json({ 
      message: 'Error exporting data',
      error: err.message 
    });
  }
});

// ============================================================================
// SYSTEM ENDPOINTS
// ============================================================================

// API: System health check
app.get('/ProceduresHubEG6/api/system/health', (req, res) => {
  try {
    const procedures = JSON.parse(fs.readFileSync(proceduresPath));
    const auditLog = JSON.parse(fs.readFileSync(auditLogPath));
    
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
          status: fs.existsSync(uploadsDir) ? 'healthy' : 'error',
          uploadsDirectory: uploadsDir
        },
        sharepoint: {
          status: SHAREPOINT_CONFIG.siteUrl ? 'configured' : 'not_configured',
          siteUrl: SHAREPOINT_CONFIG.siteUrl
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
app.get('/ProceduresHubEG6/api/system/config', (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const config = {
      server: {
        port: port,
        environment: process.env.NODE_ENV || 'development',
        uploadPath: uploadsDir,
        dataPath: dataDir
      },
      sharepoint: {
        siteUrl: SHAREPOINT_CONFIG.siteUrl,
        libraryName: SHAREPOINT_CONFIG.libraryName,
        baseFolderPath: SHAREPOINT_CONFIG.baseFolderPath,
        syncPath: process.env.SHAREPOINT_SYNC_PATH || null
      },
      roles: roles,
      features: {
        documentAnalysis: true,
        sharePointIntegration: !!SHAREPOINT_CONFIG.siteUrl,
        auditLogging: true,
        userDashboard: true,
        adminPanel: true
      }
    };

    res.json(config);

  } catch (err) {
    console.error('❌ Error getting system config:', err);
    res.status(500).json({ 
      message: 'Error loading system configuration',
      error: err.message 
    });
  }
});

// ============================================================================
// DEBUG AND TESTING ENDPOINTS
// ============================================================================

// API: Debug endpoint for troubleshooting
app.get('/ProceduresHubEG6/api/debug', (req, res) => {
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
          exists: fs.existsSync(dataDir),
          path: dataDir
        },
        uploadsDir: {
          exists: fs.existsSync(uploadsDir),
          path: uploadsDir
        },
        proceduresFile: {
          exists: fs.existsSync(proceduresPath),
          path: proceduresPath,
          size: fs.existsSync(proceduresPath) ? fs.statSync(proceduresPath).size : 0
        },
        auditLogFile: {
          exists: fs.existsSync(auditLogPath),
          path: auditLogPath,
          size: fs.existsSync(auditLogPath) ? fs.statSync(auditLogPath).size : 0
        }
      },
      config: {
        port: port,
        sharepoint: SHAREPOINT_CONFIG,
        roles: roles
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

// API: Test document analysis endpoint
app.post('/ProceduresHubEG6/api/test/analyze', upload.single('file'), async (req, res) => {
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

// Visual test page for localhost development
app.get('/ProceduresHubEG6/test', (req, res) => {
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
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; }
            .error { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; }
            .info { background: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460; }
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
            .button:hover { background: #b30000; }
            pre { 
                background: #f8f9fa; 
                padding: 15px; 
                border-radius: 4px; 
                overflow-x: auto;
                white-space: pre-wrap;
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
                <div id="auth-status" class="info">Checking authentication...</div>
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

            <div class="test-section">
                <h2>Document Analysis Test</h2>
                <form id="analysis-form" enctype="multipart/form-data">
                    <input type="file" name="file" accept=".pdf,.docx,.doc" required>
                    <button type="submit" class="button">Test Analysis</button>
                </form>
                <div id="analysis-result"></div>
            </div>

            <div class="test-section">
                <h2>System Information</h2>
                <div id="system-info" class="info">Loading system info...</div>
                <button class="button" onclick="loadSystemInfo()">Refresh Info</button>
            </div>

            <div class="test-section">
                <h2>API Endpoints</h2>
                <pre>
Authentication:
- GET /ProceduresHubEG6/api/auth/check
- GET /ProceduresHubEG6/api/role-check
- GET /ProceduresHubEG6/api/test/set-cookie
- GET /ProceduresHubEG6/api/test/clear-cookie

Procedures:
- GET /ProceduresHubEG6/api/procedures
- POST /ProceduresHubEG6/api/procedures
- GET /ProceduresHubEG6/api/procedures/:id

Dashboard:
- GET /ProceduresHubEG6/api/user/dashboard
- GET /ProceduresHubEG6/api/user/procedures

SharePoint:
- GET /ProceduresHubEG6/api/sharepoint/config
- POST /ProceduresHubEG6/api/sharepoint/upload
- GET /ProceduresHubEG6/api/sharepoint/test

Admin (requires admin role):
- GET /ProceduresHubEG6/api/admin/procedures
- GET /ProceduresHubEG6/api/admin/dashboard
- GET /ProceduresHubEG6/api/admin/audit-log

System:
- GET /ProceduresHubEG6/api/system/health
- GET /ProceduresHubEG6/api/debug (admin only)
                </pre>
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

            async function loadSystemInfo() {
                try {
                    const response = await fetch('/ProceduresHubEG6/api/system/health');
                    const data = await response.json();
                    
                    document.getElementById('system-info').innerHTML = \`
                        <strong>System Status:</strong> \${data.status}<br>
                        <strong>Version:</strong> \${data.version}<br>
                        <strong>Total Procedures:</strong> \${data.statistics.totalProcedures}<br>
                        <strong>Recent Activity:</strong> \${data.statistics.recentActivity}<br>
                        <strong>Database:</strong> \${data.components.database.status}<br>
                        <strong>SharePoint:</strong> \${data.components.sharepoint.status}
                    \`;
                } catch (err) {
                    document.getElementById('system-info').innerHTML = \`<strong>❌ Error loading system info:</strong> \${err.message}\`;
                }
            }

            // Document analysis test form
            document.getElementById('analysis-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const formData = new FormData(e.target);
                const resultDiv = document.getElementById('analysis-result');
                
                resultDiv.innerHTML = '<div class="info">Analyzing document...</div>';
                
                try {
                    const response = await fetch('/ProceduresHubEG6/api/test/analyze', {
                        method: 'POST',
                        body: formData
                    });
                    
                    const data = await response.json();
                    
                    if (response.ok) {
                        resultDiv.innerHTML = \`
                            <div class="success">
                                <strong>✅ Analysis Complete</strong><br>
                                <strong>Score:</strong> \${data.analysis.score}%<br>
                                <strong>Quality:</strong> \${data.testResult.qualityLevel}<br>
                                <strong>Recommendations:</strong> \${data.testResult.recommendationsCount}<br>
                                <strong>Missing Elements:</strong> \${data.analysis.details.missingElements.length}
                            </div>
                        \`;
                    } else {
                        resultDiv.innerHTML = \`<div class="error"><strong>❌ Analysis Failed:</strong> \${data.message}</div>\`;
                    }
                } catch (err) {
                    resultDiv.innerHTML = \`<div class="error"><strong>❌ Error:</strong> \${err.message}</div>\`;
                }
            });

            // Load initial data
            checkAuth();
            loadSystemInfo();
        </script>
    </body>
    </html>
  `);
});

// ============================================================================
// STATIC FILE SERVING & ROUTING
// ============================================================================

// Serve uploaded files
app.use('/ProceduresHubEG6/uploads', express.static(path.join(__dirname, 'uploads')));

// API endpoint to download files
app.get('/ProceduresHubEG6/api/files/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'uploads', filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Check if user has access to this file
    const procedures = JSON.parse(fs.readFileSync(proceduresPath));
    const procedure = procedures.find(p => p.file_link && p.file_link.includes(filename));
    
    if (!procedure) {
      return res.status(404).json({ message: 'File not associated with any procedure' });
    }

    // Check access permissions
    const hasAccess = req.userRole === 'admin' || 
                     procedure.primary_owner === req.staffId ||
                     procedure.secondary_owner === req.staffId ||
                     procedure.uploaded_by === req.staffId;

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied to this file' });
    }

    // Log file access
    addAuditLog('FILE_ACCESS', {
      filename: filename,
      procedureId: procedure.id,
      procedureName: procedure.name,
      accessedBy: req.staffId
    }, req.staffId);

    // Set appropriate headers
    res.setHeader('Content-Disposition', `attachment; filename="${procedure.original_filename || filename}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

  } catch (err) {
    console.error('❌ Error serving file:', err);
    res.status(500).json({ 
      message: 'Error accessing file',
      error: err.message 
    });
  }
});

// Catch-all route for React Router (must be last)
app.get('/ProceduresHubEG6/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Root redirect
app.get('/', (req, res) => {
  res.redirect('/ProceduresHubEG6/');
});

// ============================================================================
// ERROR HANDLING MIDDLEWARE
// ============================================================================

// Global error handler
app.use((err, req, res, next) => {
  console.error('🚨 Unhandled error:', err);
  
  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    error: isDevelopment ? err.stack : 'An unexpected error occurred',
    timestamp: new Date().toISOString(),
    requestId: req.headers['x-request-id'] || Date.now().toString()
  });
});

// 404 handler for API routes
app.use('/ProceduresHubEG6/api/*', (req, res) => {
  res.status(404).json({
    message: 'API endpoint not found',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Uncaught exception handler
process.on('uncaughtException', (err) => {
  console.error('🚨 Uncaught Exception:', err);
  console.error('Stack:', err.stack);
  process.exit(1);
});

// Unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start the server
app.listen(port, () => {
  console.log('\n🚀 HSBC Procedures Hub Server Started');
  console.log('=====================================');
  console.log(`📡 Server running on port: ${port}`);
  console.log(`🌐 Main URL: http://localhost:${port}/ProceduresHubEG6/`);
  console.log(`🧪 Test page: http://localhost:${port}/ProceduresHubEG6/test`);
  console.log(`📊 Health check: http://localhost:${port}/ProceduresHubEG6/api/system/health`);
  console.log('=====================================');
  console.log(`📁 Data directory: ${dataDir}`);
  console.log(`📤 Uploads directory: ${uploadsDir}`);
  console.log(`🔑 Admin users: ${roles.admins.join(', ')}`);
  console.log(`📎 SharePoint integration: ${SHAREPOINT_CONFIG.siteUrl ? 'Enabled' : 'Disabled'}`);
  console.log('=====================================');
  console.log('✅ Server is ready to handle requests');
  console.log('💡 For localhost testing, visit the test page or set a test cookie');
  console.log('🔧 Check /api/debug for troubleshooting information\n');
  
  // Initialize system on startup
  try {
    const procedures = JSON.parse(fs.readFileSync(proceduresPath));
    const auditLog = JSON.parse(fs.readFileSync(auditLogPath));
    
    console.log(`📋 Loaded ${procedures.length} procedures`);
    console.log(`📝 Loaded ${auditLog.length} audit log entries`);
    
    // Add startup log entry
    addAuditLog('SERVER_STARTUP', {
      port: port,
      proceduresCount: procedures.length,
      auditLogCount: auditLog.length,
      nodeVersion: process.version,
      platform: process.platform
    }, 'system');
    
  } catch (err) {
    console.warn('⚠️ Warning: Could not load existing data files:', err.message);
  }
});
