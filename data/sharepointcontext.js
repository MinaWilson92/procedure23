// src/SharePointContext.js - Enhanced with SharePoint User Profile Loading
import React, { createContext, useState, useEffect, useContext } from 'react';
import { CircularProgress, Box, Typography, Button, Alert } from '@mui/material';

const SharePointContext = createContext();

// Custom hook to use SharePoint context
export const useSharePoint = () => {
  const context = useContext(SharePointContext);
  if (!context) {
    throw new Error('useSharePoint must be used within SharePointProvider');
  }
  return context;
};

// Helper function to safely get SharePoint context
const getSharePointContext = () => {
  if (typeof _spPageContextInfo === 'undefined') {
    console.warn('⚠️ SharePoint context not available - using development fallback');
    return {
      webAbsoluteUrl: window.location.origin,
      userId: 43898931,
      userDisplayName: 'Mina Antoun Wilson Ross',
      userEmail: '43898931@hsbc.com',
      userLoginName: 'dev\\43898931',
      isDevelopment: true
    };
  }

  return {
    webAbsoluteUrl: _spPageContextInfo.webAbsoluteUrl,
    userId: _spPageContextInfo.userId,
    userDisplayName: _spPageContextInfo.userDisplayName,
    userEmail: _spPageContextInfo.userEmail,
    userLoginName: _spPageContextInfo.userLoginName,
    isDevelopment: false
  };
};

// ✅ NEW: Enhanced SharePoint User Profile Loader
const loadEnhancedUserProfile = async (context) => {
  try {
    console.log('👤 Loading enhanced SharePoint user profile...');
    
    const baseUrl = context.webAbsoluteUrl;
    
    // Method 1: Get current user detailed info from SharePoint REST API
    const currentUserResponse = await fetch(`${baseUrl}/_api/web/currentuser?$select=Id,Title,Email,LoginName,UserPrincipalName`, {
      headers: {
        'Accept': 'application/json; odata=verbose'
      }
    });

    if (currentUserResponse.ok) {
      const currentUserData = await currentUserResponse.json();
      const spUser = currentUserData.d;
      
      console.log('✅ SharePoint REST API user data:', spUser);
      
      // Extract enhanced user details
      const enhancedProfile = {
        staffId: context.userId.toString(),
        userId: context.userId.toString(),
        displayName: spUser.Title || context.userDisplayName || `User ${context.userId}`,
        email: spUser.Email || spUser.UserPrincipalName || context.userEmail || `${context.userId}@hsbc.com`,
        loginName: spUser.LoginName || context.userLoginName,
        userPrincipalName: spUser.UserPrincipalName || '',
        sharePointId: spUser.Id || context.userId,
        source: 'sharepoint_rest_api'
      };
      
      console.log('✅ Enhanced user profile from REST API:', enhancedProfile);
      return enhancedProfile;
    }

    // Method 2: Try People Manager API for more detailed profile
    try {
      console.log('🔄 Trying People Manager API...');
      
      const peopleResponse = await fetch(`${baseUrl}/_api/SP.UserProfiles.PeopleManager/GetMyProperties`, {
        headers: {
          'Accept': 'application/json; odata=verbose'
        }
      });

      if (peopleResponse.ok) {
        const peopleData = await peopleResponse.json();
        const userProps = peopleData.d;
        
        console.log('✅ People Manager API data:', userProps);
        
        // Extract from user properties with fallback logic
        const getPropertyValue = (key) => {
          const prop = userProps.UserProfileProperties?.results?.find(p => p.Key === key);
          return prop ? prop.Value : null;
        };
        
        const enhancedProfile = {
          staffId: context.userId.toString(),
          userId: context.userId.toString(),
          displayName: userProps.DisplayName || 
                       getPropertyValue('PreferredName') || 
                       getPropertyValue('FirstName') + ' ' + getPropertyValue('LastName') ||
                       context.userDisplayName || 
                       `User ${context.userId}`,
          email: userProps.Email || 
                 getPropertyValue('WorkEmail') || 
                 getPropertyValue('WorkEmailAddress') ||
                 context.userEmail || 
                 `${context.userId}@hsbc.com`,
          loginName: userProps.AccountName || context.userLoginName,
          department: getPropertyValue('Department') || '',
          jobTitle: getPropertyValue('Title') || getPropertyValue('JobTitle') || '',
          officeLocation: getPropertyValue('Office') || '',
          manager: getPropertyValue('Manager') || '',
          source: 'people_manager_api'
        };
        
        console.log('✅ Enhanced user profile from People Manager:', enhancedProfile);
        return enhancedProfile;
      }
    } catch (peopleError) {
      console.warn('⚠️ People Manager API failed:', peopleError.message);
    }

    // Method 3: Enhanced fallback using SharePoint context + smart extraction
    console.log('🔄 Using enhanced fallback with context data...');
    
    // Try to extract real name from login if available
    let extractedName = context.userDisplayName;
    if (context.userLoginName && !extractedName) {
      // Extract from login name like "domain\firstname.lastname"
      const loginParts = context.userLoginName.split('\\');
      if (loginParts.length > 1) {
        const namePart = loginParts[1];
        if (namePart.includes('.')) {
          const names = namePart.split('.');
          extractedName = names.map(name => 
            name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
          ).join(' ');
        }
      }
    }
    
    const fallbackProfile = {
      staffId: context.userId.toString(),
      userId: context.userId.toString(),
      displayName: extractedName || `User ${context.userId}`,
      email: context.userEmail || `${context.userId}@hsbc.com`,
      loginName: context.userLoginName || '',
      source: 'enhanced_fallback'
    };
    
    console.log('✅ Enhanced fallback user profile:', fallbackProfile);
    return fallbackProfile;
    
  } catch (error) {
    console.error('❌ Failed to load enhanced user profile:', error);
    
    // Final basic fallback
    return {
      staffId: context.userId.toString(),
      userId: context.userId.toString(),
      displayName: context.userDisplayName || `User ${context.userId}`,
      email: context.userEmail || `${context.userId}@hsbc.com`,
      loginName: context.userLoginName || '',
      source: 'basic_fallback'
    };
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
      {/* HSBC Logo */}
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
      
      {/* Spinner */}
      <CircularProgress 
        size={60} 
        sx={{ 
          color: '#d40000',
          marginBottom: '20px'
        }} 
      />
      
      {/* Loading text */}
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 300 }}>
        {message}
      </Typography>
      <Typography variant="body2" sx={{ opacity: 0.8, color: '#666' }}>
        Loading user profile from SharePoint...
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
      {/* HSBC Logo */}
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

// Main SharePoint Provider Component
export const SharePointProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [spContext, setSpContext] = useState(null);

  useEffect(() => {
    initializeSharePointAuth();
  }, []);

  const initializeSharePointAuth = async () => {
    try {
      console.log('🔐 Initializing enhanced SharePoint authentication...');
      setLoading(true);
      setError(null);
      
      // Small delay to ensure SharePoint context is loaded
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Get basic SharePoint context
      const context = getSharePointContext();
      setSpContext(context);

      // ✅ Load enhanced user profile from SharePoint APIs
      console.log('👤 Loading enhanced user profile...');
      const enhancedProfile = await loadEnhancedUserProfile(context);

      // Determine user role based on your admin list
      const userRole = await determineUserRole(enhancedProfile.staffId);

      // ✅ Create enhanced user object with real display name and email
      const userData = {
        staffId: enhancedProfile.staffId,
        displayName: enhancedProfile.displayName, // ✅ Real display name from SharePoint
        email: enhancedProfile.email, // ✅ Real email from SharePoint
        role: userRole,
        adUserId: enhancedProfile.userId,
        loginName: enhancedProfile.loginName,
        userPrincipalName: enhancedProfile.userPrincipalName || '',
        
        // ✅ Additional profile info (if available)
        department: enhancedProfile.department || '',
        jobTitle: enhancedProfile.jobTitle || '',
        officeLocation: enhancedProfile.officeLocation || '',
        manager: enhancedProfile.manager || '',
        
        // Status info
        authenticated: true,
        source: enhancedProfile.source,
        environment: context.isDevelopment ? 'development' : 'sharepoint'
      };

      setUser(userData);
      
      console.log('✅ Enhanced SharePoint authentication successful:', {
        staffId: userData.staffId,
        displayName: userData.displayName, // Now shows real name!
        email: userData.email, // Now shows real email!
        role: userData.role,
        department: userData.department,
        source: userData.source,
        environment: userData.environment
      });

    } catch (err) {
      console.error('❌ Enhanced SharePoint authentication error:', err);
      setError(`Authentication failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const determineUserRole = async (userId) => {
    try {
      // Your admin users list - update this with actual admin user IDs
      const adminUsers = [
        '43898931',
        'admin', 
        'mina.antoun',
        'wilson.ross',
        'test_admin',
        'default_user'
      ];
      
      const userIdStr = userId.toString();
      
      // Check if user is in admin list
      const isAdmin = adminUsers.includes(userIdStr) || 
                     adminUsers.some(admin => userIdStr.toLowerCase().includes(admin.toLowerCase()));
      
      // ✅ Optional: Check SharePoint UserRoles list (if you have one)
      try {
        const baseUrl = spContext?.webAbsoluteUrl;
        if (baseUrl && !spContext?.isDevelopment) {
          const roleResponse = await fetch(`${baseUrl}/_api/web/lists/getbytitle('UserRoles')/items?$filter=Title eq '${userIdStr}'&$select=UserRole`, {
            headers: { 'Accept': 'application/json; odata=verbose' }
          });
          
          if (roleResponse.ok) {
            const roleData = await roleResponse.json();
            if (roleData.d.results.length > 0) {
              const spRole = roleData.d.results[0].UserRole;
              console.log(`🔑 Role from SharePoint UserRoles list: ${spRole}`);
              return spRole;
            }
          }
        }
      } catch (roleError) {
        console.warn('⚠️ Could not check SharePoint UserRoles list:', roleError.message);
      }
      
      const role = isAdmin ? 'admin' : 'user';
      console.log(`🔑 Role determination for user ${userIdStr}:`, role);
      return role;
      
    } catch (error) {
      console.warn('⚠️ Error determining user role, defaulting to user:', error);
      return 'user';
    }
  };

  const refreshUser = () => {
    console.log('🔄 Refreshing enhanced SharePoint user context...');
    initializeSharePointAuth();
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

  // Context value - compatible with your existing UserContext
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
    displayName: user?.displayName, // ✅ Real display name
    
    // Helper methods
    getUserInfo: () => ({
      staffId: user?.staffId,
      adUserId: user?.adUserId,
      displayName: user?.displayName, // ✅ Real display name  
      email: user?.email, // ✅ Real email
      role: user?.role,
      authenticated: user?.authenticated,
      loginName: user?.loginName,
      department: user?.department,
      jobTitle: user?.jobTitle
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
    return <LoadingScreen message="Loading user profile from SharePoint..." />;
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
