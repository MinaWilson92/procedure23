// src/SharePointContext.js - Fixed version with error resolved
import React, { createContext, useState, useEffect, useContext } from 'react';
import { CircularProgress, Box, Typography, Button, Alert } from '@mui/material';

// PnPjs is loaded globally via CDN in index.html, so no imports are needed here.

const SharePointContext = createContext();

export const useSharePoint = () => {
  const context = useContext(SharePointContext);
  if (!context) {
    throw new Error('useSharePoint must be used within SharePointProvider');
  }
  return context;
};

// Define the base URL explicitly (ADDED TRAILING SLASH)
const SHAREPOINT_BASE_URL = 'https://teams.global.hsbc/sites/EmployeeEng/';

// Helper function to initialize and get the PnPjs instance (PnPjs v2) - FIXED
const getPnPjs = () => {
  // Ensure PnPjs v2 global 'pnp' object and its 'sp' property are available
  if (typeof window.pnp === 'undefined' || typeof window.pnp.sp === 'undefined') {
    console.error("PnPjs v2 global 'pnp.sp' object not found.");
    console.error("Please ensure PnPjs v2 CDN script (pnp.min.js) is loaded correctly in index.html.");
    throw new Error("PnPjs v2 library not loaded. Check index.html CDN link and script order.");
  }

  const sp = window.pnp.sp;

  // Set up the base URL only once for the sp instance
  if (!sp.__pnpjs_setup_done__) { // Using a custom flag to prevent re-running setup
    sp.setup({
      baseUrl: SHAREPOINT_BASE_URL
    });
    sp.__pnpjs_setup_done__ = true; // Mark as setup
    console.log(`✅ PnPjs v2 base URL set to: ${SHAREPOINT_BASE_URL}`);
  }

  // ✅ FIXED: Removed the problematic diagnostic line that was causing the error
  // The sp.to["_options"] structure doesn't exist in PnPjs v2
  console.log('✅ PnPjs v2 configured and ready');
  console.log('🔧 Target SharePoint site:', SHAREPOINT_BASE_URL);

  return sp;
};

// METHOD 1: SharePoint User Profile Service (API calls generally compatible with v2)
const getUserProfileFromSharePoint = async (siteUrl, userId) => {
  try {
    console.log('👤 Method 1: Trying SharePoint User Profile Service...');

    // Use the explicitly configured PnPjs instance for profile calls
    const sp = getPnPjs(); // This will return the globally configured sp object for v2
    const profile = await sp.profiles.myProperties.get(); // This uses the configured base URL

    console.log('✅ SharePoint User Profile data:', profile);

    // Extract user properties from UserProfileProperties
    const getProperty = (key) => {
      const prop = profile.UserProfileProperties?.results?.find(p => p.Key === key);
      return prop ? prop.Value : null;
    };

    return {
      userId: userId,
      staffId: getProperty('StaffId') || userId,
      adUserId: profile.UserPrincipalName,
      displayName: profile.DisplayName,
      email: profile.Email,
      role: 'Staff',
      authenticated: true,
      loginName: profile.LoginName,
      jobTitle: getProperty('Title'),
      department: getProperty('Department'),
      source: 'SharePoint Profile'
    };
  } catch (err) {
    console.warn('⚠️ Method 1 (SharePoint User Profile Service) failed:', err);
    return null;
  }
};

// Loading screen component (unchanged)
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
      initializeWithAPIs();
    }
  }, []);

  const initializeWithAPIs = async () => {
    setLoading(true);
    setError(null);
    try {
      // Ensure PnPjs is initialized with the correct base URL
      const sp = getPnPjs(); // Call the helper to ensure PnPjs is configured for v2

      // Use sp.site.rootWeb() to explicitly target the root web of the site collection
      const webInfo = await sp.site.rootWeb();
      const webAbsoluteUrl = webInfo.Url;
      const currentUserId = webInfo.CurrentUser.Id;
      const currentUserEmail = webInfo.CurrentUser.Email;
      const currentDisplayName = webInfo.CurrentUser.Title;

      setSpContext({ webAbsoluteUrl, currentUserId, isDevelopment: false });

      // Try fetching user profile using the PnPjs instance
      let userProfile = await getUserProfileFromSharePoint(webAbsoluteUrl, currentUserId);

      if (!userProfile) {
        console.warn('⚠️ Could not retrieve full user profile, falling back to basic SharePoint web context user info.');
        userProfile = {
          userId: currentUserId,
          adUserId: currentUserEmail,
          displayName: currentDisplayName,
          email: currentUserEmail,
          role: 'Staff',
          authenticated: true,
          loginName: webInfo.CurrentUser.LoginName,
          source: 'SharePoint Web Context'
        };
      }

      // Basic role assignment logic (example)
      if (userProfile.email && userProfile.email.includes('@hsbc.com')) {
        userProfile.role = 'user';
      }
      if (userProfile.email && userProfile.email.toLowerCase() === 'youradminemail@hsbc.com') { // Replace with your actual admin email
        userProfile.role = 'admin';
      }

      setUser({
        ...userProfile,
        authenticated: true,
        environment: spContext?.isDevelopment ? 'development' : 'sharepoint',
        source: userProfile.source
      });

    } catch (err) {
      console.error('❌ API initialization error:', err);
      setError(`API authentication failed: ${err.message}`);
      setUser({ authenticated: false, role: 'guest', source: 'Error', displayName: 'Guest' });
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
    isAuthenticated: !!user?.authenticated,

    spContext,
    siteUrl: spContext?.webAbsoluteUrl,
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
