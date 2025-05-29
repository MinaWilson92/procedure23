// routes/auth.js - Authentication routes

const express = require('express');
const router = express.Router();

// API: Role check endpoint (IT-compatible)
router.get('/role-check', (req, res) => {
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
router.get('/check', (req, res) => {
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
router.get('/status', (req, res) => {
  res.json({
    authenticated: !!(req.staffId && req.userRole),
    staffId: req.staffId || null,
    role: req.userRole || null,
    displayName: req.userInfo?.displayName || null,
    adUserId: req.userInfo?.adUserId || null
  });
});

// API: Login redirect using IT-provided URL pattern
router.get('/login', (req, res) => {
  const returnUrl = req.query.returnUrl || `${req.protocol}://${req.get('host')}/ProceduresHubEG6/`;
  
  // Use IT-provided login URL pattern
  const loginUrl = `https://apprunner.hk.hsbc/login/api/sessions/sso?nextUrl=${encodeURIComponent(returnUrl)}`;
  
  console.log('Redirecting to AppRunner login:', loginUrl);
  res.redirect(loginUrl);
});

module.exports = router;