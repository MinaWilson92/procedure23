// src/SharePointContext.js - DIAGNOSTIC VERSION to find your real data
import React, { createContext, useState, useEffect, useContext } from 'react';
import { CircularProgress, Box, Typography, Button, Alert } from '@mui/material';

const SharePointContext = createContext();

export const useSharePoint = () => {
  const context = useContext(SharePointContext);
  if (!context) {
    throw new Error('useSharePoint must be used within SharePointProvider');
  }
  return context;
};

// ✅ DIAGNOSTIC: Let's see what real data is actually available
const diagnoseAvailableUserData = () => {
  if (typeof window === 'undefined') {
    return { source: 'build_time', data: {} };
  }

  console.log('🔍 === DIAGNOSTIC: Checking all possible user data sources ===');
  
  const findings = {
    sharePointContext: null,
    cookies: {},
    localStorage: {},
    sessionStorage: {},
    metaTags: [],
    headers: {},
    windowProperties: {}
  };

  // ✅ 1. Check SharePoint Context
  try {
    if (window._spPageContextInfo) {
      findings.sharePointContext = {
        webAbsoluteUrl: window._spPageContextInfo.webAbsoluteUrl,
        userId: window._spPageContextInfo.userId,
        userDisplayName: window._spPageContextInfo.userDisplayName,
        userEmail: window._spPageContextInfo.userEmail,
        userLoginName: window._spPageContextInfo.userLoginName,
        siteAbsoluteUrl: window._spPageContextInfo.siteAbsoluteUrl,
        webTitle: window._spPageContextInfo.webTitle,
        currentLanguage: window._spPageContextInfo.currentLanguage
      };
      console.log('📋 SharePoint Context Found:', findings.sharePointContext);
    } else {
      console.log('❌ No SharePoint context available');
    }
  } catch (spError) {
    console.log('❌ SharePoint context error:', spError);
  }

  // ✅ 2. Check ALL Cookies
  try {
    const allCookies = document.cookie.split(';');
    console.log('🍪 === ALL COOKIES ===');
    allCookies.forEach(cookie => {
      const [name, value] = cookie.trim().split('=');
      if (name && value) {
        findings.cookies[name] = value;
        console.log(`🍪 ${name}: ${value.substring(0, 100)}${value.length > 100 ? '...' : ''}`);
        
        // Look for email patterns in cookie values
        if (value.includes('@') && value.includes('.')) {
          const emailMatch = value.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g);
          if (emailMatch) {
            console.log(`📧 FOUND EMAIL IN ${name}:`, emailMatch);
          }
        }
      }
    });
  } catch (cookieError) {
    console.log('❌ Cookie check error:', cookieError);
  }

  // ✅ 3. Check Local Storage
  try {
    console.log('💾 === LOCAL STORAGE ===');
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const value = localStorage.getItem(key);
      findings.localStorage[key] = value;
      console.log(`💾 ${key}: ${value?.substring(0, 100)}${value?.length > 100 ? '...' : ''}`);
      
      // Look for email in localStorage
      if (value && value.includes('@')) {
        const emailMatch = value.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g);
        if (emailMatch) {
          console.log(`📧 FOUND EMAIL IN LOCALSTORAGE ${key}:`, emailMatch);
        }
      }
    }
  } catch (lsError) {
    console.log('❌ LocalStorage check error:', lsError);
  }

  // ✅ 4. Check Session Storage
  try {
    console.log('📦 === SESSION STORAGE ===');
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      const value = sessionStorage.getItem(key);
      findings.sessionStorage[key] = value;
      console.log(`📦 ${key}: ${value?.substring(0, 100)}${value?.length > 100 ? '...' : ''}`);
      
      // Look for email in sessionStorage
      if (value && value.includes('@')) {
        const emailMatch = value.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g);
        if (emailMatch) {
          console.log(`📧 FOUND EMAIL IN SESSIONSTORAGE ${key}:`, emailMatch);
        }
      }
    }
  } catch (ssError) {
    console.log('❌ SessionStorage check error:', ssError);
  }

  // ✅ 5. Check Meta Tags
  try {
    console.log('🏷️ === META TAGS ===');
    const metaTags = document.querySelectorAll('meta');
    metaTags.forEach(meta => {
      const name = meta.getAttribute('name') || meta.getAttribute('property') || meta.getAttribute('http-equiv');
      const content = meta.getAttribute('content');
      
      if (name && content) {
        findings.metaTags.push({ name, content });
        console.log(`🏷️ ${name}: ${content}`);
        
        // Look for email in meta content
        if (content.includes('@')) {
          const emailMatch = content.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g);
          if (emailMatch) {
            console.log(`📧 FOUND EMAIL IN META ${name}:`, emailMatch);
          }
        }
      }
    });
  } catch (metaError) {
    console.log('❌ Meta tags check error:', metaError);
  }

  // ✅ 6. Check Window Properties for User Info
  try {
    console.log('🪟 === WINDOW PROPERTIES ===');
    const windowKeys = Object.keys(window);
    const userRelatedKeys = windowKeys.filter(key => 
      key.toLowerCase().includes('user') || 
      key.toLowerCase().includes('auth') ||
      key.toLowerCase().includes('login') ||
      key.toLowerCase().includes('profile') ||
      key.toLowerCase().includes('identity')
    );
    
    userRelatedKeys.forEach(key => {
      try {
        const value = window[key];
        findings.windowProperties[key] = value;
        console.log(`🪟 ${key}:`, value);
      } catch (propError) {
        console.log(`🪟 ${key}: [Could not access]`);
      }
    });
  } catch (windowError) {
    console.log('❌ Window properties check error:', windowError);
  }

  // ✅ 7. Check for Office 365 / Microsoft Authentication
  try {
    console.log('🏢 === OFFICE 365 / MICROSOFT AUTH ===');
    if (window.Office) {
      console.log('🏢 Office context available:', window.Office);
    }
    if (window.Microsoft) {
      console.log('🏢 Microsoft context available:', window.Microsoft);
    }
    if (window.msal) {
      console.log('🏢 MSAL context available:', window.msal);
    }
  } catch (officeError) {
    console.log('❌ Office/Microsoft check error:', officeError);
  }

  console.log('🔍 === DIAGNOSTIC COMPLETE ===');
  console.log('📋 All findings:', findings);
  
  return findings;
};

// ✅ Extract real user data from diagnostic findings
const extractRealUserData = (findings) => {
  let realUserData = {
    staffId: null,
    displayName: null,
    email: null,
    loginName: null,
    source: 'not_found'
  };

  // ✅ Priority 1: SharePoint Context
  if (findings.sharePointContext) {
    realUserData = {
      staffId: findings.sharePointContext.userId?.toString(),
      displayName: findings.sharePointContext.userDisplayName,
      email: findings.sharePointContext.userEmail,
      loginName: findings.sharePointContext.userLoginName,
      source: 'sharepoint_context'
    };
    
    if (realUserData.email && realUserData.email.includes('@')) {
      console.log('✅ FOUND REAL EMAIL in SharePoint context:', realUserData.email);
      return realUserData;
    }
  }

  // ✅ Priority 2: Check cookies for real email
  const cookieNames = Object.keys(findings.cookies);
  for (const cookieName of cookieNames) {
    const cookieValue = findings.cookies[cookieName];
    
    try {
      // Try to decode and parse cookie values
      const decoded = decodeURIComponent(cookieValue);
      
      // Look for JSON data in cookies
      if (decoded.startsWith('{') || decoded.includes('"email"') || decoded.includes('"displayName"')) {
        try {
          const parsed = JSON.parse(decoded);
          if (parsed.email && parsed.email.includes('@')) {
            realUserData.email = parsed.email;
            realUserData.displayName = parsed.displayName || parsed.name;
            realUserData.staffId = parsed.userId || parsed.id || parsed.staffId;
            realUserData.source = `cookie_${cookieName}`;
            console.log('✅ FOUND REAL EMAIL in cookie:', cookieName, realUserData.email);
            return realUserData;
          }
        } catch (parseError) {
          // Not JSON, continue searching
        }
      }
      
      // Look for email patterns directly in cookie value
      const emailMatch = decoded.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
      if (emailMatch) {
        realUserData.email = emailMatch[1];
        realUserData.source = `cookie_pattern_${cookieName}`;
        console.log('✅ FOUND EMAIL PATTERN in cookie:', cookieName, realUserData.email);
        // Don't return yet, keep looking for more complete data
      }
    } catch (decodeError) {
      // Skip this cookie
    }
  }

  // ✅ Priority 3: Check localStorage/sessionStorage
  const storageKeys = [...Object.keys(findings.localStorage), ...Object.keys(findings.sessionStorage)];
  for (const key of storageKeys) {
    const value = findings.localStorage[key] || findings.sessionStorage[key];
    
    if (value && value.includes('@')) {
      try {
        if (value.startsWith('{')) {
          const parsed = JSON.parse(value);
          if (parsed.email) {
            realUserData.email = parsed.email;
            realUserData.displayName = parsed.displayName || parsed.name;
            realUserData.staffId = parsed.userId || parsed.id;
            realUserData.source = `storage_${key}`;
            console.log('✅ FOUND REAL EMAIL in storage:', key, realUserData.email);
            return realUserData;
          }
        }
      } catch (parseError) {
        // Not JSON, look for email pattern
        const emailMatch = value.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
        if (emailMatch) {
          realUserData.email = emailMatch[1];
          realUserData.source = `storage_pattern_${key}`;
          console.log('✅ FOUND EMAIL PATTERN in storage:', key, realUserData.email);
        }
      }
    }
  }

  // If we found an email but no other data, try to infer
  if (realUserData.email && !realUserData.staffId) {
    // Try to extract staff ID from email
    const emailParts = realUserData.email.split('@')[0];
    if (emailParts.match(/^\d+$/)) {
      realUserData.staffId = emailParts;
    }
  }

  return realUserData;
};

// Main user profile loader with diagnostic
const loadUserProfileWithDiagnostic = () => {
  if (typeof window === 'undefined') {
    return {
      staffId: '43898931',
      displayName: 'Build User',
      email: 'build@hsbc.com',
      source: 'build_time'
    };
  }

  try {
    console.log('🔍 Starting comprehensive user data diagnostic...');
    
    // Run full diagnostic
    const findings = diagnoseAvailableUserData();
    
    // Extract real user data from findings
    const realUserData = extractRealUserData(findings);
    
    console.log('📋 FINAL EXTRACTED USER DATA:', realUserData);
    
    return realUserData;

  } catch (error) {
    console.error('❌ Diagnostic error:', error);
    return {
      staffId: '43898931',
      displayName: 'Diagnostic Error',
      email: 'error@hsbc.com',
      source: 'error_fallback'
    };
  }
};

// Simple role determination
const determineUserRole = (staffId) => {
  const adminUsers = ['43898931', 'admin'];
  return adminUsers.includes(staffId?.toString()) ? 'admin' : 'user';
};

// Loading component
const LoadingScreen = ({ message = "Diagnosing user data sources..." }) => (
  <Box sx={{
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: '#f5f6fa'
  }}>
    <Box sx={{ textAlign: 'center', maxWidth: '400px', padding: '40px' }}>
      <Box sx={{
        width: '80px',
        height: '40px',
        backgroundColor: '#d40000',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
        fontSize: '16px',
        borderRadius: '4px',
        margin: '0 auto 30px'
      }}>
        HSBC
      </Box>
      
      <CircularProgress size={60} sx={{ color: '#d40000', marginBottom: '20px' }} />
      
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 300 }}>
        {message}
      </Typography>
      <Typography variant="body2" sx={{ opacity: 0.8, color: '#666' }}>
        Checking all available data sources...
      </Typography>
    </Box>
  </Box>
);

// Main Provider
export const SharePointProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      initializeWithDiagnostic();
    } else {
      setLoading(false);
      setUser({
        staffId: 'build',
        displayName: 'Build User',
        email: 'build@hsbc.com',
        role: 'user',
        source: 'build'
      });
    }
  }, []);

  const initializeWithDiagnostic = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await new Promise(resolve => setTimeout(resolve, 1000)); // Give time to see diagnostic
      
      const userProfile = loadUserProfileWithDiagnostic();
      const userRole = determineUserRole(userProfile.staffId);

      const userData = {
        staffId: userProfile.staffId || 'unknown',
        displayName: userProfile.displayName || 'Unknown User',
        email: userProfile.email || 'unknown@hsbc.com',
        role: userRole,
        loginName: userProfile.loginName || '',
        authenticated: true,
        source: userProfile.source,
        environment: 'sharepoint'
      };

      setUser(userData);
      
      console.log('✅ FINAL USER OBJECT:', userData);

    } catch (err) {
      console.error('❌ Initialization error:', err);
      setError(`Initialization failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    refreshUser: initializeWithDiagnostic,
    logout: () => setUser(null),
    manualLogin: initializeWithDiagnostic,
    isAdmin: user?.role === 'admin',
    isAuthenticated: !!user,
    
    getUserInfo: () => ({
      staffId: user?.staffId,
      displayName: user?.displayName,
      email: user?.email, // This will show what we actually found
      role: user?.role,
      source: user?.source
    }),
    
    authStatus: {
      loading,
      authenticated: !!user,
      error,
      source: user?.source
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <SharePointContext.Provider value={value}>
      {children}
    </SharePointContext.Provider>
  );
};

export { SharePointContext };
export default SharePointContext;
