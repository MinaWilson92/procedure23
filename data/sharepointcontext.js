// src/SharePointContext.js - COMPLETE FIXED VERSION
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

// Utility to clean SharePoint Claims ID (e.g., 'i:0#.f|membership|user@domain.com' -> 'user@domain.com')
const cleanClaimsId = (claimsId) => {
  if (!claimsId || typeof claimsId !== 'string') return claimsId;
  const match = claimsId.match(/\|membership\|([^|]+)$/);
  if (match && match[1]) {
    return match[1]; // Extracts the email/username part
  }
  return claimsId; // Return original if no match
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
        displayName: getProperty('DisplayName') || profile.DisplayName || 'Unknown User',
        email: getProperty('WorkEmail') || profile.Email || 'unknown@hsbc.com',
        loginName: profile.UserPrincipalName || profile.LoginName,
        jobTitle: getProperty('Title'),
        department: getProperty('Department'),
        authenticated: true,
        source: 'sharepoint_profile'
      };
    } else {
      console.warn('⚠️ SharePoint User Profile Service failed:', response.status, await response.text());
      return null; // Return null to indicate failure, so Graph API can be tried
    }
  } catch (error) {
    console.error('❌ Error getting SharePoint user profile:', error);
    return null; // Return null on error
  }
};

// ✅ METHOD 2: Microsoft Graph API
const getUserInfoFromGraphAPI = async (userId) => {
  try {
    console.log('👤 Method 2: Trying Microsoft Graph API...');
    // Note: Graph API requires proper Azure AD app registration and permissions for your solution.
    // For SPFx, these permissions are usually configured in the package-solution.json.
    const graphResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });

    if (graphResponse.ok) {
      const graphData = await graphResponse.json();
      console.log('✅ Microsoft Graph API data:', graphData);
      return {
        userId: userId, // Keep SharePoint's userId if needed for SP-specific operations
        displayName: graphData.displayName || 'Unknown User',
        email: graphData.mail || graphData.userPrincipalName || 'unknown@hsbc.com', // Prioritize mail
        loginName: graphData.userPrincipalName,
        jobTitle: graphData.jobTitle,
        department: graphData.department,
        authenticated: true,
        source: 'graph_api'
      };
    } else {
      console.warn('⚠️ Microsoft Graph API failed:', graphResponse.status, await graphResponse.text());
      return null; // Return null to indicate failure
    }
  } catch (error) {
    console.error('❌ Error getting Graph API user info:', error);
    return null; // Return null on error
  }
};

export const SharePointProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [spContext, setSpContext] = useState(null);

  const initializeWithAPIs = async () => {
    setLoading(true);
    setError(null);
    try {
      // Step 1: Get SharePoint Context (basic info like site URL and current user ID)
      const contextResponse = await fetch('/_layouts/15/init.js', { credentials: 'include' });
      if (!contextResponse.ok) throw new Error('Failed to load SharePoint context.');

      const scriptContent = await contextResponse.text();
      const webAbsoluteUrlMatch = scriptContent.match(/_spPageContextInfo\.webAbsoluteUrl\s*=\s*\"([^\"]+)\"/);
      const siteAbsoluteUrlMatch = scriptContent.match(/_spPageContextInfo\.siteAbsoluteUrl\s*=\s*\"([^\"]+)\"/);
      const userIdMatch = scriptContent.match(/_spPageContextInfo\.userId\s*=\s*\"([^\"]+)\"/);

      const webAbsoluteUrl = webAbsoluteUrlMatch ? webAbsoluteUrlMatch[1] : '';
      const siteAbsoluteUrl = siteAbsoluteUrlMatch ? siteAbsoluteUrlMatch[1] : '';
      const currentUserId = userIdMatch ? userIdMatch[1] : '';

      setSpContext({
        webAbsoluteUrl,
        siteAbsoluteUrl,
        userId: currentUserId,
        isDevelopment: window.location.hostname === 'localhost' || window.location.hostname.startsWith('192.168.')
      });

      // Step 2: Try to get user profile from SharePoint API first
      let userData = await getUserProfileFromSharePoint(webAbsoluteUrl, currentUserId);

      // Step 3: If SharePoint API returns generic email or fails, try Graph API
      // If SharePoint API returned 'unknown@hsbc.com' or was null/error, try Graph
      if (!userData || userData.email === 'unknown@hsbc.com') {
        console.log('⚠️ SharePoint profile generic/failed, trying Graph API...');
        const graphUserData = await getUserInfoFromGraphAPI(currentUserId);
        if (graphUserData) {
            // Merge Graph API data, prioritizing Graph for key profile fields like email and display name
            userData = { ...userData, ...graphUserData, userId: currentUserId }; // Keep SharePoint's userId
        }
      }

      if (!userData || !userData.authenticated) {
        setError('Authentication failed. Please ensure you are logged into SharePoint and have necessary permissions.');
        setUser(null);
        return;
      }
      
      // Use cleanClaimsId for adUserId for a cleaner display/storage of the login name
      setUser({
        ...userData,
        adUserId: cleanClaimsId(userData.loginName || userData.adUserId), // Apply cleanup here
      });

    } catch (err) {
      console.error('❌ API initialization error:', err);
      setError(`API authentication failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only run this client-side
    if (typeof window !== 'undefined') {
      initializeWithAPIs();
    }
  }, []);

  const value = {
    user,
    loading,
    error,
    refreshUser: () => { if (typeof window !== 'undefined') initializeWithAPIs(); },
    logout: () => setUser(null),
    manualLogin: () => { if (typeof window !== 'undefined') initializeWithAPIs(); },
    isAdmin: user?.role === 'admin', // Ensure role is being set correctly elsewhere if needed
    isAuthenticated: !!user,
    
    spContext,
    siteUrl: spContext?.webAbsoluteUrl,
    adUserId: user?.adUserId, // Cleaned version of login name
    displayName: user?.displayName,
    
    getUserInfo: () => ({
      staffId: user?.staffId, // Assuming this is set elsewhere
      adUserId: user?.adUserId,
      displayName: user?.displayName,
      email: user?.email,
      role: user?.role,
      authenticated: user?.authenticated,
      loginName: user?.loginName,
      jobTitle: user?.jobTitle,
      department: user?.department
    }),
    
    cleanClaimsId: cleanClaimsId, // Expose the utility function for other components
    
    authStatus: {
      loading,
      authenticated: !!user,
      error,
      environment: spContext?.isDevelopment ? 'development' : 'sharepoint',
      source: user?.source
    }
  };

  if (loading) {
    return <LoadingScreen message="Fetching user profile from Microsoft APIs..." />;\
  }

  return (
    <SharePointContext.Provider value={value}>
      {children}
    </SharePointContext.Provider>
  );
};

// Assuming LoadingScreen is defined elsewhere or needs to be included here
const LoadingScreen = ({ message }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
    <CircularProgress />
    <Typography variant="h6" sx={{ mt: 2 }}>{message}</Typography>
  </Box>
);
