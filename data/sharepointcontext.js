// src/SharePointContext.js - COMPLETE & LATEST VERSION with Dynamic Roles from SharePoint List (Title as StaffId) and Correct User Staff ID Extraction
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

// New Helper: Get fresh request digest for POST/MERGE operations
const getFreshRequestDigest = async () => {
  try {
    const digestUrl = `${SHAREPOINT_SITE_URL}/_api/contextinfo`;
    const digestResponse = await fetch(digestUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json; odata=verbose',
        'Content-Type': 'application/json; odata=verbose'
      },
      credentials: 'include'
    });
    
    if (digestResponse.ok) {
      const digestData = await digestResponse.json();
      return digestData.d.GetContextWebInformation.FormDigestValue;
    } else {
      // Fallback: If API call fails, try to get from a hidden element (less reliable in modern SPAs)
      const digestElement = document.getElementById('__REQUESTDIGEST');
      return digestElement?.value || '';
    }
  } catch (err) {
    console.error('Error getting request digest:', err);
    return ''; // Return empty string to allow API call to proceed, but it might fail
  }
};


// Use direct fetch with absolute URLs - bypass PnPjs URL detection
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
    // Handle 404 for manager gracefully if no manager is set
    if (response.status === 404 && endpoint.includes('GetMyManager')) {
      console.warn('⚠️ Manager not found or no manager specified for current user (404 Not Found).');
      return null; // Return null if manager not found gracefully
    }
    console.error(`❌ API call failed: ${response.status} ${response.statusText} for ${fullUrl}`);
    throw new Error(`API call failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.d;
};

// New Helper: Update SharePoint List Item
const updateSharePointListItem = async (listName, itemId, data) => {
  const digest = await getFreshRequestDigest();
  if (!digest) {
    console.error('❌ Cannot update list item: Request digest not available.');
    throw new Error('Request digest not available for update.');
  }

  const fullUrl = `${SHAREPOINT_SITE_URL}/_api/web/lists/getbytitle('${listName}')/items(${itemId})`;
  console.log(`💾 Updating list item: ${fullUrl}`);

  const response = await fetch(fullUrl, {
    method: 'POST',
    headers: {
      'Accept': 'application/json; odata=verbose',
      'Content-Type': 'application/json; odata=verbose',
      'X-RequestDigest': digest,
      'IF-MATCH': '*', // Use '*' to update regardless of ETag (useful for simple updates)
      'X-HTTP-Method': 'MERGE' // Use MERGE for partial updates
    },
    credentials: 'include',
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    console.error(`❌ Failed to update item ${itemId} in ${listName}: ${response.status} ${response.statusText} for ${fullUrl}`);
    throw new Error(`Failed to update list item: ${response.status} ${response.statusText}`);
  }
  console.log(`✅ Successfully updated item ${itemId} in ${listName}.`);
  return true;
};

// Helper function to get user profile via direct API call
const getUserProfileDirect = async () => {
  try {
    console.log('👤 Getting user profile via direct API...');
    
    // Call 1: Get current user's properties
    const profile = await makeDirectSharePointCall('/SP.UserProfiles.PeopleManager/GetMyProperties');
    console.log('✅ SharePoint User Profile data:', profile);

    // Call 2: Get current user's manager details
    let managerDetails = null;
    try {
        managerDetails = await makeDirectSharePointCall('/SP.UserProfiles.PeopleManager/GetMyManager');
        if (managerDetails) {
            console.log('✅ Manager details:', managerDetails);
        } else {
            console.log('ℹ️ No manager details retrieved (might be undefined or no manager set).');
        }
    } catch (managerErr) {
        console.warn('⚠️ Failed to get manager details:', managerErr.message);
        // Do not re-throw, continue without manager details
    }

    // Extract user properties from UserProfileProperties
    const getProperty = (key) => {
      const prop = profile.UserProfileProperties?.results?.find(p => p.Key === key);
      return prop ? prop.Value : null;
    };

    return {
      userId: profile.UserProfileProperties ? getProperty('UserId') : null, // SharePoint integer ID
      // ✅ FIXED: Look for 'EmployeeID' specifically, fallback to parsing AccountName if not found
      staffId: getProperty('EmployeeID') || profile.AccountName?.split('|')[2],
      adUserId: profile.UserPrincipalName, // Active Directory User Principal Name
      displayName: profile.DisplayName,
      email: profile.Email,
      role: 'Staff', // Default role, will be overridden below by list lookup
      authenticated: true,
      loginName: profile.AccountName, // SharePoint Account Name (e.g., i:0#.f|membership|user@domain.com)
      jobTitle: getProperty('Title'),
      department: getProperty('Department'),
      source: 'SharePoint Profile Direct API',
      managerEmail: managerDetails?.Email || null,
      managerDisplayName: managerDetails?.DisplayName || null
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

  // Method to make SharePoint list API calls with correct URLs
  const makeSharePointListCall = async (listName, query = '') => {
    const endpoint = `/web/lists/getbytitle('${listName}')/items${query}`;
    return await makeDirectSharePointCall(endpoint);
  };

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
      const currentUserId = webInfo.CurrentUser?.Id; // SharePoint integer ID for current user
      const currentUserEmail = webInfo.CurrentUser?.Email;
      const currentDisplayName = webInfo.CurrentUser?.Title;

      setSpContext({ webAbsoluteUrl, currentUserId, isDevelopment: false });

      // STEP 2: Try to get detailed user profile (now includes manager details)
      let userProfile = await getUserProfileDirect();

      if (!userProfile) {
        console.warn('⚠️ Could not retrieve full user profile, using web context user info.');
        userProfile = {
          userId: currentUserId,
          adUserId: currentUserEmail,
          displayName: currentDisplayName,
          email: currentUserEmail,
          role: 'user', // Default to user if profile not found
          authenticated: true,
          loginName: webInfo.CurrentUser?.LoginName,
          source: 'SharePoint Web Context Direct API',
          managerEmail: null,
          managerDisplayName: null
        };
      }

      // STEP 3: Determine user role dynamically from SharePoint list AND update LastLogin
      userProfile.role = 'user'; // Default role, will be overridden if match found in list
      let matchedListItem = null;
      
      console.log('--- Dynamic Role & LastLogin Update Debug ---');
      console.log('Current User Email (lowercase):', userProfile.email?.toLowerCase());
      console.log('Current User Staff ID (from Profile):', userProfile.staffId); // ✅ DEBUG: Corrected log
      console.log('Current User AD User ID (UserPrincipalName):', userProfile.adUserId);
      console.log('Current User Login Name (AccountName):', userProfile.loginName);

      try {
        // Fetch users from the 'UserRoles' list, selecting necessary fields
        // 'Title' column contains the UserID according to your description
        const userRolesListItems = await makeSharePointListCall('UserRoles', '?$select=Id,Title,UserRole,Email,Status'); 
        
        if (userRolesListItems?.results && userRolesListItems.results.length > 0) {
            console.log('Fetched UserRoles list items:', userRolesListItems.results);

            matchedListItem = userRolesListItems.results.find(item => {
                const itemEmail = item.Email?.toLowerCase();
                // ✅ FIXED: Use item.Title for StaffId comparison from the list
                const itemStaffIdFromList = item.Title; 
                const itemRole = item.UserRole?.toLowerCase(); 
                // ✅ Added this to make sure itemTitle is defined for comparison if Title holds something other than StaffId
                const itemTitleLower = item.Title?.toLowerCase(); 

                // Match logic: prioritize email, then StaffId (from list Title), then AD User ID, then Login Name
                const isEmailMatch = userProfile.email?.toLowerCase() === itemEmail;
                const isStaffIdMatch = userProfile.staffId && userProfile.staffId === itemStaffIdFromList;
                // ✅ FIXED: Use itemTitleLower for comparison against AD User ID and Login Name
                const isAdUserIdMatch = userProfile.adUserId?.toLowerCase() === itemTitleLower; 
                const isLoginNameMatch = userProfile.loginName?.toLowerCase() === itemTitleLower; 


                if (isEmailMatch) console.log(`Debug: Email match found for ${userProfile.email}`);
                if (isStaffIdMatch) console.log(`Debug: Staff ID match found for ${userProfile.staffId} against list Title (${itemStaffIdFromList})`);
                if (isAdUserIdMatch) console.log(`Debug: AD User ID match found for ${userProfile.adUserId} against list Title (${itemTitleLower})`);
                if (isLoginNameMatch) console.log(`Debug: Login Name match found for ${userProfile.loginName} against list Title (${itemTitleLower})`);


                return isEmailMatch || isStaffIdMatch || isAdUserIdMatch || isLoginNameMatch;
            });

            if (matchedListItem) {
                console.log('✅ Current user found in UserRoles list:', matchedListItem);
                
                // If user is found, update LastLogin for them
                const currentDate = new Date().toISOString().split('T')[0]; // Format asYYYY-MM-DD for SharePoint Date-only field
                const updateData = { LastLogin: currentDate }; 
                
                try {
                  await updateSharePointListItem('UserRoles', matchedListItem.Id, updateData);
                  console.log(`✅ Updated LastLogin for ${userProfile.displayName} (List Item ID: ${matchedListItem.Id}) to ${currentDate}.`);
                } catch (updateErr) {
                  console.error('❌ Failed to update LastLogin:', updateErr.message);
                }


                // Now, determine role based on Status and UserRole from the list
                if (matchedListItem.Status?.toLowerCase() === 'active') {
                    userProfile.role = matchedListItem.UserRole?.toLowerCase(); // Set role from list ('admin', 'uploader', 'user')
                    console.log(`✅ User role set to "${userProfile.role}" from list. Status: Active.`);
                } else {
                    // If user is found but Status is not 'active', default to 'user' role
                    console.log(`ℹ️ User found in list but Status is "${matchedListItem.Status}". Role remains "user".`);
                    userProfile.role = 'user'; // Ensure role is explicitly 'user' if not active
                }
            } else {
                console.log('ℹ️ Current user not found in "UserRoles" list. Role remains "user".');
            }
        } else {
            console.log('ℹ️ No items found in "UserRoles" list or list does not exist. All users treated as "user".');
        }

      } catch (listError) {
        console.error('❌ Error during dynamic role assignment or LastLogin update:', listError);
        console.warn('⚠️ Dynamic role assignment and LastLogin update failed due to API error. User role remains "user".');
      }
      console.log('------------------------------');

      console.log('✅ User authentication and role assignment successful:', {
        displayName: userProfile.displayName,
        email: userProfile.email,
        role: userProfile.role,
        source: userProfile.source,
        managerEmail: userProfile.managerEmail,
        managerDisplayName: userProfile.managerDisplayName
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
      
      // Fallback: Set a basic authenticated user with default role
      setUser({ 
        authenticated: false, 
        role: 'guest', 
        source: 'Error', 
        displayName: 'SharePoint User',
        email: 'user@hsbc.com',
        error: err.message,
        managerEmail: null,
        managerDisplayName: null
      });
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    refreshUser: () => { if (typeof window !== 'undefined') initializeWithDirectAPIs(); },
    logout: () => setUser(null),
    manualLogin: () => { if (typeof window !== 'undefined') initializeWithDirectAPIs(); },
    isAdmin: user?.role === 'admin',
    isUploader: user?.role === 'uploader', // New: Check for uploader role
    isAuthenticated: !!user?.authenticated,

    // SharePoint API helpers with correct URLs
    makeSharePointCall: makeDirectSharePointCall,
    makeListCall: makeSharePointListCall,
    updateListItem: updateSharePointListItem, // New: Expose update function
    siteUrl: SHAREPOINT_SITE_URL,

    spContext,
    adUserId: user?.adUserId,
    displayName: user?.displayName,

    getUserInfo: () => ({
      userId: user?.userId, 
      staffId: user?.staffId,
      adUserId: user?.adUserId,
      displayName: user?.displayName,
      email: user?.email,
      role: user?.role,
      authenticated: user?.authenticated,
      loginName: user?.loginName,
      jobTitle: user?.jobTitle,
      department: user?.department,
      managerEmail: user?.managerEmail,
      managerDisplayName: user?.managerDisplayName
    }),

    authStatus: {
      loading,
      authenticated: !!user?.authenticated,
      error,
      environment: 'sharepoint',
      source: user?.source,
      apiBaseUrl: `${SHAREPOINT_SITE_URL}/_api/`,
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
