// src/SharePointContext.js - FIND REAL EMAIL VERSION
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

// ✅ COMPREHENSIVE: Find your REAL email from ALL possible sources
const findRealUserEmail = () => {
  if (typeof window === 'undefined') {
    return { email: 'build@hsbc.com', loginName: 'build\\user', source: 'build' };
  }

  console.log('🔍 === SEARCHING FOR YOUR REAL EMAIL ===');
  
  let findings = {
    email: null,
    loginName: null,
    source: 'not_found'
  };

  // ✅ Method 1: Check your existing working UserContext cookie
  try {
    console.log('🍪 Method 1: Checking existing UserContext cookie...');
    const cookies = document.cookie;
    
    if (cookies.includes('apprunnersession=')) {
      const value = "; " + cookies;
      const parts = value.split("; apprunnersession=");
      
      if (parts.length === 2) {
        const decoded = decodeURIComponent(parts.pop().split(";").shift());
        
        try {
          const userData = JSON.parse(decoded);
          
          if (userData.email && userData.email.includes('@') && !userData.email.includes('undefined')) {
            findings.email = userData.email;
            findings.loginName = userData.loginName || userData.userLoginName || '';
            findings.source = 'existing_user_context_cookie';
            
            console.log('✅ FOUND REAL EMAIL in existing cookie:', findings.email);
            console.log('✅ FOUND REAL LOGIN in existing cookie:', findings.loginName);
            return findings;
          }
        } catch (parseError) {
          console.log('⚠️ Could not parse existing cookie');
        }
      }
    }
  } catch (cookieError) {
    console.log('⚠️ Existing cookie check failed');
  }

  // ✅ Method 2: Check ALL browser cookies for email patterns
  try {
    console.log('🍪 Method 2: Scanning ALL cookies for email patterns...');
    const allCookies = document.cookie.split(';');
    
    for (const cookie of allCookies) {
      const [name, value] = cookie.trim().split('=');
      if (name && value) {
        try {
          // Try to decode cookie value
          const decoded = decodeURIComponent(value);
          
          // Look for HSBC email patterns
          const emailMatches = decoded.match(/([a-zA-Z0-9._%+-]+@hsbc\.com)/g);
          if (emailMatches && emailMatches.length > 0) {
            // Filter out generic/system emails
            const realEmails = emailMatches.filter(email => 
              !email.includes('system') && 
              !email.includes('service') && 
              !email.includes('noreply') &&
              !email.includes('admin') &&
              email !== 'mina.antoun@hsbc.com' // Exclude the constructed one
            );
            
            if (realEmails.length > 0) {
              findings.email = realEmails[0];
              findings.source = `cookie_${name}`;
              console.log(`✅ FOUND REAL EMAIL in cookie ${name}:`, findings.email);
              
              // Try to extract login name from same cookie
              const loginMatches = decoded.match(/(\\\\[^"'\s]+|[a-zA-Z0-9]+\\\\[a-zA-Z0-9.]+)/g);
              if (loginMatches && loginMatches.length > 0) {
                findings.loginName = loginMatches[0];
                console.log(`✅ FOUND LOGIN NAME in same cookie:`, findings.loginName);
              }
              
              return findings;
            }
          }
        } catch (decodeError) {
          // Skip this cookie
        }
      }
    }
  } catch (allCookieError) {
    console.log('⚠️ All cookies scan failed');
  }

  // ✅ Method 3: Check localStorage for user info
  try {
    console.log('💾 Method 3: Checking localStorage for user data...');
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const value = localStorage.getItem(key);
      
      if (value && value.includes('@hsbc.com')) {
        try {
          // Try parsing as JSON
          if (value.startsWith('{')) {
            const parsed = JSON.parse(value);
            if (parsed.email && parsed.email !== 'mina.antoun@hsbc.com') {
              findings.email = parsed.email;
              findings.loginName = parsed.loginName || parsed.userLoginName || '';
              findings.source = `localStorage_${key}`;
              console.log(`✅ FOUND REAL EMAIL in localStorage ${key}:`, findings.email);
              return findings;
            }
          }
          
          // Look for email patterns in raw value
          const emailMatch = value.match(/([a-zA-Z0-9._%+-]+@hsbc\.com)/);
          if (emailMatch && emailMatch[1] !== 'mina.antoun@hsbc.com') {
            findings.email = emailMatch[1];
            findings.source = `localStorage_pattern_${key}`;
            console.log(`✅ FOUND EMAIL PATTERN in localStorage ${key}:`, findings.email);
            
            // Don't return yet, keep looking for login name
          }
        } catch (parseError) {
          // Continue searching
        }
      }
    }
  } catch (lsError) {
    console.log('⚠️ localStorage check failed');
  }

  // ✅ Method 4: Check sessionStorage
  try {
    console.log('📦 Method 4: Checking sessionStorage for user data...');
    
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      const value = sessionStorage.getItem(key);
      
      if (value && value.includes('@hsbc.com')) {
        try {
          if (value.startsWith('{')) {
            const parsed = JSON.parse(value);
            if (parsed.email && parsed.email !== 'mina.antoun@hsbc.com') {
              findings.email = parsed.email;
              findings.loginName = parsed.loginName || parsed.userLoginName || '';
              findings.source = `sessionStorage_${key}`;
              console.log(`✅ FOUND REAL EMAIL in sessionStorage ${key}:`, findings.email);
              return findings;
            }
          }
        } catch (parseError) {
          // Continue
        }
      }
    }
  } catch (ssError) {
    console.log('⚠️ sessionStorage check failed');
  }

  // ✅ Method 5: Check page meta tags
  try {
    console.log('🏷️ Method 5: Checking page meta tags...');
    
    const metaTags = document.querySelectorAll('meta[name*="user"], meta[property*="user"], meta[content*="@hsbc.com"]');
    metaTags.forEach(meta => {
      const content = meta.getAttribute('content');
      if (content && content.includes('@hsbc.com') && content !== 'mina.antoun@hsbc.com') {
        const emailMatch = content.match(/([a-zA-Z0-9._%+-]+@hsbc\.com)/);
        if (emailMatch) {
          findings.email = emailMatch[1];
          findings.source = 'meta_tag';
          console.log('✅ FOUND REAL EMAIL in meta tag:', findings.email);
        }
      }
    });
  } catch (metaError) {
    console.log('⚠️ Meta tags check failed');
  }

  // ✅ Method 6: Check window object properties
  try {
    console.log('🪟 Method 6: Checking window properties...');
    
    // Look for user-related properties in window
    const userProps = Object.keys(window).filter(key => 
      key.toLowerCase().includes('user') || 
      key.toLowerCase().includes('profile') ||
      key.toLowerCase().includes('identity') ||
      key.toLowerCase().includes('auth')
    );
    
    for (const prop of userProps) {
      try {
        const value = window[prop];
        if (value && typeof value === 'object') {
          const stringified = JSON.stringify(value);
          if (stringified.includes('@hsbc.com')) {
            const emailMatch = stringified.match(/([a-zA-Z0-9._%+-]+@hsbc\.com)/);
            if (emailMatch && emailMatch[1] !== 'mina.antoun@hsbc.com') {
              findings.email = emailMatch[1];
              findings.source = `window_property_${prop}`;
              console.log(`✅ FOUND REAL EMAIL in window.${prop}:`, findings.email);
              break;
            }
          }
        }
      } catch (propError) {
        // Skip this property
      }
    }
  } catch (windowError) {
    console.log('⚠️ Window properties check failed');
  }

  // ✅ Method 7: Try to call your existing UserContext API
  try {
    console.log('🌐 Method 7: Trying existing UserContext API...');
    
    // This is async, so we'll need to handle it differently
    // For now, we'll try a synchronous approach
    
  } catch (apiError) {
    console.log('⚠️ API check failed');
  }

  console.log('📋 Final email search results:', findings);
  return findings;
};

// ✅ Build-safe SharePoint context with real email integration
const getSharePointContext = () => {
  if (typeof window === 'undefined') {
    return {
      webAbsoluteUrl: 'http://localhost:3000',
      userId: 43898931,
      userDisplayName: 'Build User',
      userEmail: 'build@hsbc.com',
      userLoginName: 'build\\user',
      isDevelopment: true
    };
  }

  try {
    // ✅ Get real email first
    const realEmailData = findRealUserEmail();
    
    // ✅ Get SharePoint context for user ID and display name
    let spData = {
      userId: 43898931,
      userDisplayName: 'Mina Antoun Wilson Ross',
      webAbsoluteUrl: window.location.origin,
      isDevelopment: true
    };

    if (typeof window._spPageContextInfo !== 'undefined' && window._spPageContextInfo) {
      spData = {
        webAbsoluteUrl: window._spPageContextInfo.webAbsoluteUrl || window.location.origin,
        userId: window._spPageContextInfo.userId || 43898931,
        userDisplayName: window._spPageContextInfo.userDisplayName || 'Mina Antoun Wilson Ross',
        isDevelopment: false
      };
      console.log('✅ Got SharePoint context data:', spData);
    }

    // ✅ Combine SharePoint data with real email
    const finalContext = {
      ...spData,
      userEmail: realEmailData.email || `${spData.userId}@hsbc.com`,
      userLoginName: realEmailData.loginName || `dev\\${spData.userId}`,
      emailSource: realEmailData.source
    };

    console.log('✅ Final combined context:', finalContext);
    return finalContext;

  } catch (error) {
    console.error('❌ Error in getSharePointContext:', error);
    return {
      webAbsoluteUrl: window.location.origin,
      userId: 43898931,
      userDisplayName: 'Error User',
      userEmail: 'error@hsbc.com',
      userLoginName: 'error\\user',
      isDevelopment: true
    };
  }
};

// ✅ Enhanced role determination
const determineUserRole = async (userId, userEmail, userLoginName) => {
  try {
    console.log('🔑 Determining user role for:', { userId, userEmail, userLoginName });
    
    const adminUsers = ['43898931', 'admin', 'mina.antoun', 'wilson.ross'];
    
    const userIdStr = userId?.toString().toLowerCase() || '';
    const emailStr = userEmail?.toLowerCase() || '';
    const loginStr = userLoginName?.toLowerCase() || '';
    
    const isAdmin = adminUsers.some(admin => {
      const adminStr = admin.toLowerCase();
      return userIdStr === adminStr || 
             userIdStr.includes(adminStr) ||
             emailStr.includes(adminStr) ||
             loginStr.includes(adminStr);
    });
    
    const role = isAdmin ? 'admin' : 'user';
    console.log(`🔑 Role determination result: ${role}`);
    return role;
    
  } catch (error) {
    console.warn('⚠️ Error determining user role:', error);
    return 'user';
  }
};

// Loading component
const LoadingScreen = ({ message = "Loading HSBC Procedures Hub..." }) => (
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
        Searching for your real email address...
      </Typography>
    </Box>
  </Box>
);

// Main SharePoint Provider Component
export const SharePointProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [spContext, setSpContext] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      initializeSharePointAuth();
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

  const initializeSharePointAuth = async () => {
    try {
      console.log('🔐 Initializing SharePoint auth with REAL email search...');
      setLoading(true);
      setError(null);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const context = getSharePointContext();
      setSpContext(context);
      
      const userRole = await determineUserRole(context.userId, context.userEmail, context.userLoginName);

      const userData = {
        staffId: context.userId?.toString() || '43898931',
        displayName: context.userDisplayName || 'Unknown User',
        email: context.userEmail || 'unknown@hsbc.com', // ✅ This should be your REAL email now
        role: userRole,
        adUserId: context.userId?.toString() || '43898931',
        loginName: context.userLoginName || '', // ✅ This should be your REAL login now
        authenticated: true,
        source: context.emailSource || (context.isDevelopment ? 'development' : 'sharepoint'),
        environment: context.isDevelopment ? 'development' : 'sharepoint'
      };

      setUser(userData);
      
      console.log('✅ FINAL USER OBJECT WITH REAL EMAIL:', {
        staffId: userData.staffId,
        displayName: userData.displayName,
        email: userData.email, // ✅ Should be real!
        loginName: userData.loginName, // ✅ Should be real!
        role: userData.role,
        source: userData.source
      });

    } catch (err) {
      console.error('❌ SharePoint authentication error:', err);
      setError(`Authentication failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    refreshUser: () => { if (typeof window !== 'undefined') initializeSharePointAuth(); },
    logout: () => setUser(null),
    manualLogin: () => { if (typeof window !== 'undefined') initializeSharePointAuth(); },
    isAdmin: user?.role === 'admin',
    isAuthenticated: !!user,
    
    spContext,
    siteUrl: spContext?.webAbsoluteUrl,
    adUserId: user?.adUserId,
    displayName: user?.displayName,
    
    getUserInfo: () => ({
      staffId: user?.staffId,
      adUserId: user?.adUserId,
      displayName: user?.displayName,
      email: user?.email, // ✅ Real email
      role: user?.role,
      authenticated: user?.authenticated,
      loginName: user?.loginName // ✅ Real login name
    }),
    
    authStatus: {
      loading,
      authenticated: !!user,
      error,
      environment: spContext?.isDevelopment ? 'development' : 'sharepoint',
      source: user?.source
    }
  };

  if (loading) {
    return <LoadingScreen message="Searching for your real email..." />;
  }

  return (
    <SharePointContext.Provider value={value}>
      {children}
    </SharePointContext.Provider>
  );
};

export { SharePointContext };
export default SharePointContext;
