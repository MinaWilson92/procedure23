// src/SharePointContext.js - Using SharePoint User Profile APIs with explicit base URL
import React, { createContext, useState, useEffect, useContext } from 'react';
import { CircularProgress, Box, Typography, Button, Alert } from '@mui/material';

// Import pnpjs specifics
import { spfi, SPFx, SPBrowser } from "@pnp/sp";
import "@pnp/sp/webs"; // Required for sp.web()
import "@pnp/sp/site-users/web"; // Required for sp.web.currentUser
import "@pnp/sp/user-profiles"; // Required for sp.profiles.myProperties.get()

const SharePointContext = createContext();

export const useSharePoint = () => {
  const context = useContext(SharePointContext);
  if (!context) {
    throw new Error('useSharePoint must be used within SharePointProvider');
  }
  return context;
};

// ✅ DEFINING THE BASE URL EXPLICITLY HERE
const SHAREPOINT_BASE_URL = 'https://teams.global.hsbc/sites/EmployeeEng';

// Helper function to initialize and get the PnPjs instance
const getPnPjs = () => {
  // Check if PnPjs is already initialized globally for this context
  if (typeof window.pnp === 'undefined' || !window.pnp.sp) {
    console.log('✨ Initializing PnPjs...');
    window.pnp = window.pnp || {};

    // Initialize PnPjs based on environment:
    // If running within a SharePoint Framework (SPFx) context and _spPageContextInfo is available, use SPFx.
    // Otherwise, use SPBrowser for standalone apps or explicit URL configuration.
    if (typeof window._spPageContextInfo !== 'undefined' && window._spPageContextInfo.webAbsoluteUrl) {
        window.pnp.sp = spfi().using(SPFx(window._spPageContextInfo)); // Use SPFx context
        console.log('PnPjs initialized using SPFx context.');
    } else {
        window.pnp.sp = spfi().using(SPBrowser()); // Use SPBrowser for non-SPFx/development
        console.log('PnPjs initialized using SPBrowser.');
    }

    // ✅ EXPLICITLY SET THE BASE URL FOR PNPJS
    window.pnp.sp.setup({
        baseUrl: SHAREPOINT_BASE_URL
    });
    console.log(`✅ PnPjs base URL set to: ${SHAREPOINT_BASE_URL}`);
  }
  return window.pnp.sp;
};


// ✅ METHOD 1: SharePoint User Profile Service
const getUserProfileFromSharePoint = async (siteUrl, userId) => {
  try {
    console.log('👤 Method 1: Trying SharePoint User Profile Service...');

    // Use the explicitly configured PnPjs instance for profile calls
    const sp = getPnPjs();
    const profile = await sp.profiles.myProperties.get(); // This uses the configured base URL

    console.log('✅ SharePoint User Profile data:', profile);

    // Extract user properties from UserProfileProperties
    const getProperty = (key) => {
      const prop = profile.UserProfileProperties?.results?.find(p => p.Key === key);
      return prop ? prop.Value : null;
    };

    return {
      userId: userId, // This userId comes from sp.web.currentUser.Id
      staffId: getProperty('StaffId') || userId, // Assuming StaffId might be in UserProfileProperties
      adUserId: profile.UserPrincipalName, // User Principal Name (e.g., user@domain.com)
      displayName: profile.DisplayName,
      email: profile.Email,
      role: 'Staff', // Default role, can be refined based on actual roles
      authenticated: true,
      loginName: profile.LoginName,
      jobTitle: getProperty('Title'), // Job Title from profile properties
      department: getProperty('Department'), // Department from profile properties
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
  }, []); // Run only once on mount

  const initializeWithAPIs = async () => {
    setLoading(true);
    setError(null);
    try {
      // Ensure PnPjs is initialized with the correct base URL
      const sp = getPnPjs(); // Call the helper to ensure PnPjs is configured

      // Get current web info from PnPjs (this will use the configured base URL)
      const webInfo = await sp.web();
      const webAbsoluteUrl = webInfo.Url; // This should now be SHAREPOINT_BASE_URL if configured correctly
      const currentUserId = webInfo.CurrentUser.Id;
      const currentUserEmail = webInfo.CurrentUser.Email;
      const currentDisplayName = webInfo.CurrentUser.Title;

      setSpContext({ webAbsoluteUrl, currentUserId, isDevelopment: false });

      // Try fetching user profile using the PnPjs instance
      let userProfile = await getUserProfileFromSharePoint(webAbsoluteUrl, currentUserId);

      if (!userProfile) {
        // Fallback to basic user info if profile service fails or is not robust enough
        console.warn('⚠️ Could not retrieve full user profile, falling back to basic SharePoint web context user info.');
        userProfile = {
          userId: currentUserId,
          adUserId: currentUserEmail, // Using email as a fallback for AD User ID
          displayName: currentDisplayName,
          email: currentUserEmail,
          role: 'Staff', // Default role if not retrieved from profile
          authenticated: true,
          loginName: webInfo.CurrentUser.LoginName,
          source: 'SharePoint Web Context'
        };
      }

      // Basic role assignment logic (example)
      if (userProfile.email && userProfile.email.includes('@hsbc.com')) {
        userProfile.role = 'user';
      }
      // Example admin role check (adjust as per your actual admin determination)
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
      // Set an unauthenticated user state on error to avoid loading spinners indefinitely
      setUser({ authenticated: false, role: 'guest', source: 'Error',
