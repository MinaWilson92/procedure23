// src/SharePointContext.js - Using SharePoint User Profile APIs
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

// ✅ METHOD 1: SharePoint User Profile Service
const getUserProfileFromSharePoint = async (siteUrl, userId) => {
  try {
    console.log('👤 Method 1: Trying SharePoint User Profile Service...');
    
    // Get current user profile using SharePoint REST API
    const profileUrl = `${siteUrl}/_api/SP.UserProfiles.PeopleManager/GetMyProperties`;
    
    const response = await fetch(profileUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json; odata=verbose',
        'Content-Type': 'application/json; odata=verbose'
      },
      credentials: 'include'
    });

    if (response.ok) {
      const data = await response.json();
      const profile = data.d;
      
      console.log('✅ SharePoint User Profile data:', profile);
      
      // Extract user properties
      const getProperty = (key) => {
        const prop = profile.UserProfileProperties?.results?.find(p => p.Key === key);
        return prop ? prop.Value : null;
      };
      
      return {
        userId: userId,
        displayName: profile.DisplayName || getProperty('PreferredName'),
        email: profile.Email || getProperty('WorkEmail') || getProperty('SPS-UserPrincipalName'),
        loginName: profile.AccountName || getProperty('AccountName'),
        jobTitle: getProperty('Title') || getProperty('SPS-JobTitle'),
        department: getProperty('Department') || getProperty('SPS-Department'),
        manager: getProperty('Manager'),
        officeLocation: getProperty('SPS-Location'),
        workPhone: getProperty('WorkPhone'),
        source: 'sharepoint_user_profile_service'
      };
    } else {
      console.warn(`⚠️ User Profile Service failed: ${response.status}`);
      return null;
    }
  } catch (error) {
    console.warn('⚠️ SharePoint User Profile Service error:', error);
    return null;
  }
};

// ✅ METHOD 2: SharePoint Current User Extended Info
const getCurrentUserExtended = async (siteUrl) => {
  try {
    console.log('👤 Method 2: Trying SharePoint Current User Extended...');
    
    const userUrl = `${siteUrl}/_api/web/currentuser?$select=Id,Title,Email,LoginName,UserPrincipalName`;
    
    const response = await fetch(userUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json; odata=verbose'
      },
      credentials: 'include'
    });

    if (response.ok) {
      const data = await response.json();
      const user = data.d;
      
      console.log('✅ SharePoint Current User Extended:', user);
      
      return {
        userId: user.Id,
        displayName: user.Title,
        email: user.Email || user.UserPrincipalName,
        loginName: user.LoginName,
        userPrincipalName: user.UserPrincipalName,
        source: 'sharepoint_current_user_extended'
      };
    } else {
      console.warn(`⚠️ Current User Extended failed: ${response.status}`);
      return null;
    }
  } catch (error) {
    console.warn('⚠️ SharePoint Current User Extended error:', error);
    return null;
  }
};

// ✅ METHOD 3: Microsoft Graph API (if available)
const getUserFromMicrosoftGraph = async () => {
  try {
    console.log('👤 Method 3: Trying Microsoft Graph API...');
    
    // Try to access Microsoft Graph if available
    const graphUrl = 'https://graph.microsoft.com/v1.0/me';
    
    const response = await fetch(graphUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      credentials: 'include'
    });

    if (response.ok) {
      const user = await response.json();
      
      console.log('✅ Microsoft Graph user data:', user);
      
      return {
        userId: user.id,
        displayName: user.displayName,
        email: user.mail || user.userPrincipalName,
        loginName: user.userPrincipalName,
        jobTitle: user.jobTitle,
        department: user.department,
        officeLocation: user.officeLocation,
        businessPhones: user.businessPhones,
        source: 'microsoft_graph'
      };
    } else {
      console.warn(`⚠️ Microsoft Graph failed: ${response.status}`);
      return null;
    }
  } catch (error) {
    console.warn('⚠️ Microsoft Graph error:', error);
    return null;
  }
};

// ✅ METHOD 4: Office 365 User Profile API
const getUserFromOffice365 = async (siteUrl) => {
  try {
    console.log('👤 Method 4: Trying Office 365 User Profile...');
    
    // Try Office 365 tenant user profile
    const tenantUrl = siteUrl.split('/sites/')[0]; // Get tenant root
    const profileUrl = `${tenantUrl}/_api/SP.UserProfiles.PeopleManager/GetMyProperties`;
    
    const response = await fetch(profileUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json; odata=verbose'
      },
      credentials: 'include'
    });

    if (response.ok) {
      const data = await response.json();
      const profile = data.d;
      
      console.log('✅ Office 365 User Profile:', profile);
      
      return {
        userId: profile.UserProfileProperties?.results?.find(p => p.Key === 'SPS-UserPrincipalName')?.Value,
        displayName: profile.DisplayName,
        email: profile.Email,
        loginName: profile.AccountName,
        source: 'office365_user_profile'
      };
    } else {
      console.warn(`⚠️ Office 365 User Profile failed: ${response.status}`);
      return null;
    }
  } catch (error) {
    console.warn('⚠️ Office 365 User Profile error:', error);
    return null;
  }
};

// ✅ METHOD 5: SharePoint Search API for User
const searchUserProfile = async (siteUrl, userId) => {
  try {
    console.log('👤 Method 5: Trying SharePoint Search for user profile...');
    
    const searchUrl = `${siteUrl}/_api/search/query?querytext='AccountName:${userId}*'&selectproperties='Title,WorkEmail,AccountName,JobTitle,Department'&sourceid='b09a7990-05ea-4af9-81ef-edfab16c4e31'`;
    
    const response = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json; odata=verbose'
      },
      credentials: 'include'
    });

    if (response.ok) {
      const data = await response.json();
      const results = data.d?.query?.PrimaryQueryResult?.RelevantResults?.Table?.Rows?.results;
      
      if (results && results.length > 0) {
        const userRow = results[0];
        const cells = userRow.Cells.results;
        
        const getValue = (key) => {
          const cell = cells.find(c => c.Key === key);
          return cell ? cell.Value : null;
        };
        
        console.log('✅ SharePoint Search user profile:', cells);
        
        return {
          userId: userId,
          displayName: getValue('Title'),
          email: getValue('WorkEmail'),
          loginName: getValue('AccountName'),
          jobTitle: getValue('JobTitle'),
          department: getValue('Department'),
          source: 'sharepoint_search'
        };
      }
    } else {
      console.warn(`⚠️ SharePoint Search failed: ${response.status}`);
    }
    return null;
  } catch (error) {
    console.warn('⚠️ SharePoint Search error:', error);
    return null;
  }
};

// ✅ COMPREHENSIVE: Try all methods to get real user profile
const getRealUserProfile = async (siteUrl, userId) => {
  console.log('🔍 === COMPREHENSIVE USER PROFILE SEARCH ===');
  console.log('🎯 Target:', { siteUrl, userId });
  
  const methods = [
    () => getUserProfileFromSharePoint(siteUrl, userId),
    () => getCurrentUserExtended(siteUrl),
    () => getUserFromMicrosoftGraph(),
    () => getUserFromOffice365(siteUrl),
    () => searchUserProfile(siteUrl, userId)
  ];

  for (let i = 0; i < methods.length; i++) {
    try {
      console.log(`🔄 Trying method ${i + 1}/5...`);
      const result = await methods[i]();
      
      if (result && result.email && result.email.includes('@') && !result.email.includes('undefined')) {
        console.log(`✅ SUCCESS with method ${i + 1}:`, result);
        return result;
      } else {
        console.log(`⚠️ Method ${i + 1} returned incomplete data:`, result);
      }
    } catch (error) {
      console.log(`❌ Method ${i + 1} failed:`, error.message);
    }
  }

  console.log('❌ All methods failed to get real user profile');
  return null;
};

// ✅ Build-safe SharePoint context
const getSharePointContext = () => {
  if (typeof window === 'undefined') {
    return {
      webAbsoluteUrl: 'http://localhost:3000',
      userId: 43898931,
      userDisplayName: 'Build User',
      isDevelopment: true
    };
  }

  try {
    if (typeof window._spPageContextInfo !== 'undefined' && window._spPageContextInfo) {
      return {
        webAbsoluteUrl: window._spPageContextInfo.webAbsoluteUrl,
        userId: window._spPageContextInfo.userId,
        userDisplayName: window._spPageContextInfo.userDisplayName,
        isDevelopment: false
      };
    } else {
      return {
        webAbsoluteUrl: window.location.origin,
        userId: 43898931,
        userDisplayName: 'Mina Antoun Wilson Ross',
        isDevelopment: true
      };
    }
  } catch (error) {
    return {
      webAbsoluteUrl: window.location.origin,
      userId: 43898931,
      userDisplayName: 'Error User',
      isDevelopment: true
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
        Fetching profile from Microsoft APIs...
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
      initializeWithAPIs();
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

  const initializeWithAPIs = async () => {
    try {
      console.log('🔐 Initializing with Microsoft/SharePoint APIs...');
      setLoading(true);
      setError(null);
      
      // Get basic SharePoint context
      const context = getSharePointContext();
      setSpContext(context);
      
      // Try to get real user profile from APIs
      let realProfile = null;
      if (!context.isDevelopment) {
        realProfile = await getRealUserProfile(context.webAbsoluteUrl, context.userId);
      }
      
      // Create final user object
      const userData = {
        staffId: (realProfile?.userId || context.userId)?.toString() || '43898931',
        displayName: realProfile?.displayName || context.userDisplayName || 'Unknown User',
        email: realProfile?.email || 'unknown@hsbc.com', // ✅ Real email from API
        role: 'user', // Will be determined below
        adUserId: (realProfile?.userId || context.userId)?.toString() || '43898931',
        loginName: realProfile?.loginName || '',
        userPrincipalName: realProfile?.userPrincipalName || '',
        jobTitle: realProfile?.jobTitle || '',
        department: realProfile?.department || '',
        officeLocation: realProfile?.officeLocation || '',
        workPhone: realProfile?.workPhone || '',
        authenticated: true,
        source: realProfile?.source || (context.isDevelopment ? 'development' : 'sharepoint_basic'),
        environment: context.isDevelopment ? 'development' : 'sharepoint'
      };

      // Determine role
      const adminUsers = ['43898931', 'admin', 'mina.antoun', 'wilson.ross'];
      const isAdmin = adminUsers.some(admin => 
        userData.staffId?.toLowerCase().includes(admin.toLowerCase()) ||
        userData.email?.toLowerCase().includes(admin.toLowerCase()) ||
        userData.loginName?.toLowerCase().includes(admin.toLowerCase())
      );
      userData.role = isAdmin ? 'admin' : 'user';

      setUser(userData);
      
      console.log('✅ FINAL USER OBJECT FROM APIs:', {
        staffId: userData.staffId,
        displayName: userData.displayName,
        email: userData.email, // ✅ Should be real from API!
        loginName: userData.loginName,
        jobTitle: userData.jobTitle,
        department: userData.department,
        role: userData.role,
        source: userData.source
      });

    } catch (err) {
      console.error('❌ API initialization error:', err);
      setError(`API authentication failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    refreshUser: () => { if (typeof window !== 'undefined') initializeWithAPIs(); },
    logout: () => setUser(null),
    manualLogin: () => { if (typeof window !== 'undefined') initializeWithAPIs(); },
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
      email: user?.email, // ✅ Real email from API
      role: user?.role,
      authenticated: user?.authenticated,
      loginName: user?.loginName,
      jobTitle: user?.jobTitle,
      department: user?.department
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
    return <LoadingScreen message="Fetching user profile from Microsoft APIs..." />;
  }

  return (
    <SharePointContext.Provider value={value}>
      {children}
    </SharePointContext.Provider>
  );
};

export { SharePointContext };
export default SharePointContext;
