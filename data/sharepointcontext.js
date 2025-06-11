// src/SharePointContext.js - Fixed with Absolute URL Enforcement
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

// Define the EXACT SharePoint site URL (no trailing slash)
const SHAREPOINT_SITE_URL = 'https://teams.global.hsbc/sites/EmployeeEng';

// FIXED: Use direct fetch with absolute URLs - bypass PnPjs URL detection
const makeDirectSharePointCall = async (endpoint) => {
  const fullUrl = `${SHAREPOINT_SITE_URL}/_api${endpoint}`;
  console.log(`🚀 Direct API call to: ${fullUrl}`);
  
  const response = await fetch(fullUrl, {
    method: 'GET',
    headers: {
      'Accept': 'application/json; odata=verbose',
      'Content-Type': 'application/json; odata=verbose'
    },
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error(`API call failed: ${response.status} ${response.statusText} for ${fullUrl}`);
  }

  const data = await response.json();
  return data.d;
};

// Helper function to get user profile via direct API call
const getUserProfileDirect = async () => {
  try {
    console.log('👤 Getting user profile via direct API...');
    const profile = await makeDirectSharePointCall('/SP.UserProfiles.PeopleManager/GetMyProperties');
    console.log('✅ SharePoint User Profile data:', profile);

    // Extract user properties from UserProfileProperties
    const getProperty = (key) => {
      const prop = profile.UserProfileProperties?.results?.find(p => p.Key === key);
      return prop ? prop.Value : null;
    };

    return {
      userId: profile.UserProfileProperties ? getProperty('UserId') : null,
      staffId: getProperty('StaffId') || profile.AccountName?.split('|')[2],
      adUserId: profile.UserPrincipalName,
      displayName: profile.DisplayName,
      email: profile.Email,
      role: 'Staff',
      authenticated: true,
      loginName: profile.AccountName,
      jobTitle: getProperty('Title'),
      department: getProperty('Department'),
      source: 'SharePoint Profile Direct API'
    };
  } catch (err) {
    console.warn('⚠️ Direct user profile API failed:', err);
    return null;
  }
};

// Loading screen component
const LoadingScreen = ({ message }) => (
  <Box sx={{
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    minHeight: '100vh', bgcolor: 'background.default', color: 'text.primary'
  }}>
    <CircularProgress size={60} sx={{ mb: 2 }} />
    <Typography variant="h6">{message}</Typography>
  </Box>
);

export const SharePointProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [spContext, setSpContext] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      initializeWithDirectAPIs();
    }
  }, []);

  const initializeWithDirectAPIs = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🎯 Initializing with DIRECT API calls to avoid URL detection issues...');
      
      // STEP 1: Get web info via direct API call
      const webInfo = await makeDirectSharePointCall('/web?$expand=CurrentUser');
      console.log('✅ Web info retrieved:', webInfo);
      
      const webAbsoluteUrl = webInfo.Url;
      const currentUserId = webInfo.CurrentUser?.Id;
      const currentUserEmail = webInfo.CurrentUser?.Email;
      const currentDisplayName = webInfo.CurrentUser?.Title;

      setSpContext({ webAbsoluteUrl, currentUserId, isDevelopment: false });

      // STEP 2: Try to get detailed user profile
      let userProfile = await getUserProfileDirect();

      if (!userProfile) {
        console.warn('⚠️ Could not retrieve full user profile, using web context user info.');
        userProfile = {
          userId: currentUserId,
          adUserId: currentUserEmail,
          displayName: currentDisplayName,
          email: currentUserEmail,
          role: 'Staff',
          authenticated: true,
          loginName: webInfo.CurrentUser?.LoginName,
          source: 'SharePoint Web Context Direct API'
        };
      }

      // STEP 3: Determine user role
      if (userProfile.email && userProfile.email.includes('@hsbc.com')) {
        userProfile.role = 'user';
      }
      
      // Set admin role based on email or staff ID
      const adminEmails = ['your.admin@hsbc.com']; // Replace with actual admin emails
      const adminStaffIds = ['43898931', 'admin']; // Replace with actual admin staff IDs
      
      if (adminEmails.includes(userProfile.email?.toLowerCase()) || 
          adminStaffIds.includes(userProfile.staffId)) {
        userProfile.role = 'admin';
      }

      console.log('✅ User authentication successful:', {
        displayName: userProfile.displayName,
        email: userProfile.email,
        role: userProfile.role,
        source: userProfile.source
      });

      setUser({
        ...userProfile,
        authenticated: true,
        environment: 'sharepoint',
        source: userProfile.source
      });

    } catch (err) {
      console.error('❌ Direct API initialization error:', err);
      setError(`SharePoint API authentication failed: ${err.message}`);
      
      // Fallback: Set a basic authenticated user
      setUser({ 
        authenticated: false, 
        role: 'guest', 
        source: 'Error', 
        displayName: 'SharePoint User',
        email: 'user@hsbc.com',
        error: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  // Method to make SharePoint list API calls with correct URLs
  const makeSharePointListCall = async (listName, query = '') => {
    const endpoint = `/web/lists/getbytitle('${listName}')/items${query}`;
    return await makeDirectSharePointCall(endpoint);
  };

  const value = {
    user,
    loading,
    error,
    refreshUser: () => { if (typeof window !== 'undefined') initializeWithDirectAPIs(); },
    logout: () => setUser(null),
    manualLogin: () => { if (typeof window !== 'undefined') initializeWithDirectAPIs(); },
    isAdmin: user?.role === 'admin',
    isAuthenticated: !!user?.authenticated,

    // SharePoint API helpers with correct URLs
    makeSharePointCall: makeDirectSharePointCall,
    makeListCall: makeSharePointListCall,
    siteUrl: SHAREPOINT_SITE_URL,

    spContext,
    adUserId: user?.adUserId,
    displayName: user?.displayName,

    getUserInfo: () => ({
      staffId: user?.staffId,
      adUserId: user?.adUserId,
      displayName: user?.displayName,
      email: user?.email,
      role: user?.role,
      authenticated: user?.authenticated,
      loginName: user?.loginName,
      jobTitle: user?.jobTitle,
      department: user?.department
    }),

    authStatus: {
      loading,
      authenticated: !!user?.authenticated,
      error,
      environment: 'sharepoint',
      source: user?.source,
      apiBaseUrl: `${SHAREPOINT_SITE_URL}/_api/`
    }
  };

  if (loading) {
    return <LoadingScreen message="Connecting to SharePoint APIs..." />;
  }

  return (
    <SharePointContext.Provider value={value}>
      {children}
    </SharePointContext.Provider>
  );
};
