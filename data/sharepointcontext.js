// src/SharePointContext.js - FIXED: Build-Safe with Real User Data Extraction
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

// ✅ FIXED: Build-safe SharePoint context extraction
const getSharePointContext = () => {
  // ✅ Build-time safety check
  if (typeof window === 'undefined') {
    console.log('🔧 Build time - using build fallback');
    return {
      webAbsoluteUrl: 'http://localhost:3000',
      userId: 43898931,
      userDisplayName: 'Build User',
      userEmail: 'build@hsbc.com',
      userLoginName: 'build\\user',
      isDevelopment: true
    };
  }

  // ✅ Runtime safety check for SharePoint context
  try {
    if (typeof window._spPageContextInfo === 'undefined' || !window._spPageContextInfo) {
      console.warn('⚠️ SharePoint context not available - using development fallback');
      return {
        webAbsoluteUrl: window.location.origin,
        userId: 43898931,
        userDisplayName: 'Mina Antoun Wilson Ross',
        userEmail: 'mina.antoun@hsbc.com', // ✅ Put your real email here
        userLoginName: 'dev\\mina.antoun',  // ✅ Put your real username here
        isDevelopment: true
      };
    }

    // ✅ SharePoint context is available - extract real data
    const spInfo = window._spPageContextInfo;
    console.log('📋 Raw SharePoint context:', spInfo);

    // ✅ Extract real user data with better logic
    let realEmail = spInfo.userEmail;
    let realDisplayName = spInfo.userDisplayName;
    let realLoginName = spInfo.userLoginName;

    // ✅ Fix email extraction - sometimes it's in different properties
    if (!realEmail || realEmail === spInfo.userId) {
      // Try to construct email from login name
      if (realLoginName && realLoginName.includes('\\')) {
        const username = realLoginName.split('\\')[1];
        if (username && !username.match(/^\d+$/)) {
          // If username is not just numbers, construct email
          realEmail = `${username}@hsbc.com`;
          console.log('✅ Constructed email from login:', realEmail);
        }
      }
      
      // If still no email, try other SharePoint properties
      if (!realEmail) {
        realEmail = spInfo.userPrincipalName || spInfo.userEmail || `${spInfo.userId}@hsbc.com`;
      }
    }

    // ✅ Fix display name extraction
    if (!realDisplayName || realDisplayName === spInfo.userId) {
      // Try to extract from login name
      if (realLoginName && realLoginName.includes('\\')) {
        const username = realLoginName.split('\\')[1];
        if (username && username.includes('.')) {
          // Convert "firstname.lastname" to "Firstname Lastname"
          const names = username.split('.');
          realDisplayName = names.map(name => 
            name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
          ).join(' ');
          console.log('✅ Constructed display name from login:', realDisplayName);
        }
      }
    }

    const contextData = {
      webAbsoluteUrl: spInfo.webAbsoluteUrl || window.location.origin,
      userId: spInfo.userId || 43898931,
      userDisplayName: realDisplayName || `User ${spInfo.userId}`,
      userEmail: realEmail,
      userLoginName: realLoginName || '',
      userPrincipalName: spInfo.userPrincipalName || '',
      isDevelopment: false
    };

    console.log('✅ Processed SharePoint context:', contextData);
    return contextData;

  } catch (error) {
    console.error('❌ Error accessing SharePoint context:', error);
    return {
      webAbsoluteUrl: window.location.origin,
      userId: 43898931,
      userDisplayName: 'Error Fallback User',
      userEmail: 'error@hsbc.com',
      userLoginName: 'error\\user',
      isDevelopment: true
    };
  }
};

// ✅ Alternative: Try to extract from your existing UserContext approach
const tryExistingUserContext = () => {
  if (typeof window === 'undefined') return null;

  try {
    console.log('🔍 Trying existing UserContext approach...');
    
    // Check for your app's session cookie
    const cookies = document.cookie;
    
    if (cookies.includes('apprunnersession=')) {
      const value = "; " + cookies;
      const parts = value.split("; apprunnersession=");
      
      if (parts.length === 2) {
        const decoded = decodeURIComponent(parts.pop().split(";").shift());
        
        try {
          const userData = JSON.parse(decoded);
          
          if (userData.email && userData.displayName) {
            console.log('✅ Found real user data in existing cookie:', {
              email: userData.email,
              displayName: userData.displayName,
              userId: userData.adUserId || userData.userId
            });
            
            return {
              userId: userData.adUserId || userData.userId || 43898931,
              userDisplayName: userData.displayName,
              userEmail: userData.email,
              userLoginName: userData.loginName || '',
              webAbsoluteUrl: window.location.origin,
              isDevelopment: false,
              source: 'existing_user_context'
            };
          }
        } catch (parseError) {
          console.warn('⚠️ Could not parse existing user context cookie');
        }
      }
    }
    
    return null;
  } catch (error) {
    console.warn('⚠️ Error checking existing UserContext:', error);
    return null;
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
    backgroundColor: '#f5f6fa',
    fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif'
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
      
      <CircularProgress 
        size={60} 
        sx={{ 
          color: '#d40000',
          marginBottom: '20px'
        }} 
      />
      
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 300 }}>
        {message}
      </Typography>
      <Typography variant="body2" sx={{ opacity: 0.8, color: '#666' }}>
        Extracting real user information...
      </Typography>
    </Box>
  </Box>
);

// Error component
const ErrorScreen = ({ error, onRetry }) => (
  <Box sx={{
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: '#ffebee',
    fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
    padding: '20px'
  }}>
    <Box sx={{ textAlign: 'center', maxWidth: '500px' }}>
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

      <Alert severity="error" sx={{ marginBottom: '20px' }}>
        <Typography variant="h6" gutterBottom>
          Authentication Error
        </Typography>
        <Typography variant="body2">
          {error}
        </Typography>
      </Alert>

      <Button 
        variant="contained"
        onClick={onRetry}
        sx={{
          backgroundColor: '#d40000',
          '&:hover': { backgroundColor: '#b30000' },
          padding: '12px 24px',
          fontSize: '16px'
        }}
      >
        Retry Authentication
      </Button>
      
      <Typography variant="caption" display="block" sx={{ marginTop: '20px', color: '#666' }}>
        If the problem persists, please contact IT support
      </Typography>
    </Box>
  </Box>
);

// ✅ Enhanced role determination
const determineUserRole = async (userId, userEmail, userLoginName) => {
  try {
    console.log('🔑 Determining user role for:', { userId, userEmail, userLoginName });
    
    // ✅ Admin users list - check multiple identifiers
    const adminUsers = [
      '43898931',
      'admin', 
      'mina.antoun',
      'wilson.ross',
      'test_admin',
      'default_user'
    ];
    
    // ✅ Check against multiple user identifiers
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
    console.warn('⚠️ Error determining user role, defaulting to user:', error);
    return 'user';
  }
};

// Main SharePoint Provider Component
export const SharePointProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [spContext, setSpContext] = useState(null);

  useEffect(() => {
    // ✅ Only initialize in browser
    if (typeof window !== 'undefined') {
      initializeSharePointAuth();
    } else {
      // Build time
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
      console.log('🔐 Initializing enhanced SharePoint authentication...');
      setLoading(true);
      setError(null);
      
      // Small delay to ensure context is loaded
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // ✅ Try existing UserContext first (if it has real data)
      let context = tryExistingUserContext();
      
      // ✅ If no existing context, try SharePoint context
      if (!context || !context.userEmail || context.userEmail.includes(context.userId)) {
        console.log('🔄 Trying SharePoint context...');
        context = getSharePointContext();
      }
      
      setSpContext(context);
      console.log('📋 Final context to use:', context);

      // ✅ Determine user role with enhanced logic
      const userRole = await determineUserRole(context.userId, context.userEmail, context.userLoginName);

      // ✅ Create user object with real data
      const userData = {
        staffId: context.userId?.toString() || '43898931',
        displayName: context.userDisplayName || 'Unknown User',
        email: context.userEmail || 'unknown@hsbc.com',
        role: userRole,
        adUserId: context.userId?.toString() || '43898931',
        loginName: context.userLoginName || '',
        userPrincipalName: context.userPrincipalName || '',
        authenticated: true,
        source: context.source || (context.isDevelopment ? 'development' : 'sharepoint'),
        environment: context.isDevelopment ? 'development' : 'sharepoint'
      };

      setUser(userData);
      
      console.log('✅ Enhanced SharePoint authentication successful:', {
        staffId: userData.staffId,
        displayName: userData.displayName,
        email: userData.email, // ✅ This should now be real email!
        role: userData.role,
        source: userData.source,
        environment: userData.environment
      });

    } catch (err) {
      console.error('❌ SharePoint authentication error:', err);
      setError(`Authentication failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = () => {
    console.log('🔄 Refreshing SharePoint user context...');
    if (typeof window !== 'undefined') {
      initializeSharePointAuth();
    }
  };

  const logout = () => {
    console.log('🚪 Logout requested in SharePoint environment');
    if (spContext && !spContext.isDevelopment) {
      window.location.href = `${spContext.webAbsoluteUrl}/_layouts/SignOut.aspx`;
    } else {
      setUser(null);
      setError('Logged out - please refresh to login again');
    }
  };

  const manualLogin = () => {
    console.log('🔐 Manual login requested');
    if (spContext && !spContext.isDevelopment) {
      window.location.href = `${spContext.webAbsoluteUrl}/_layouts/authenticate.aspx`;
    } else {
      initializeSharePointAuth();
    }
  };

  // Context value - compatible with your existing interface
  const value = {
    user,
    loading,
    error,
    refreshUser,
    logout,
    manualLogin,
    isAdmin: user?.role === 'admin',
    isAuthenticated: !!user,
    
    // SharePoint-specific properties
    spContext,
    siteUrl: spContext?.webAbsoluteUrl,
    
    // Enhanced user data
    adUserId: user?.adUserId,
    displayName: user?.displayName,
    
    // Helper methods
    getUserInfo: () => ({
      staffId: user?.staffId,
      adUserId: user?.adUserId,
      displayName: user?.displayName,
      email: user?.email, // ✅ Real email
      role: user?.role,
      authenticated: user?.authenticated,
      loginName: user?.loginName,
      userPrincipalName: user?.userPrincipalName
    }),
    
    // Authentication status
    authStatus: {
      loading,
      authenticated: !!user,
      error,
      environment: spContext?.isDevelopment ? 'development' : 'sharepoint',
      source: user?.source
    }
  };

  // Show loading state
  if (loading) {
    return <LoadingScreen message="Extracting real user information..." />;
  }

  // Show error state
  if (error && !user) {
    return <ErrorScreen error={error} onRetry={refreshUser} />;
  }

  // Render children with context
  return (
    <SharePointContext.Provider value={value}>
      {children}
    </SharePointContext.Provider>
  );
};

export { SharePointContext };
export default SharePointContext;
