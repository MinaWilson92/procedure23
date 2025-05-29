// middleware/auth.js - Authentication middleware

const config = require('../config/config');

// Helper to check user role
function getUserRole(staffId) {
  if (config.ROLES.admins && config.ROLES.admins.includes(staffId)) {
    return 'admin';
  }
  return 'user';
}

// IT AUTHENTICATION MIDDLEWARE - Extract user info from AppRunner cookies
const authMiddleware = (req, res, next) => {
  console.log('=== AUTHENTICATION MIDDLEWARE ===');
  console.log('Host:', req.get('host'));
  console.log('Request URL:', req.url);
  
  // Check if we're running on localhost (IT-provided condition)
  const isLocalhost = req.get('host').indexOf("localhost") !== -1;
  console.log('Is localhost:', isLocalhost);
  
  // Check for apprunnersession cookie
  const sessionCookie = req.cookies ? req.cookies['apprunnersession'] : null;
  
  console.log('Cookies received:', {
    sessionExists: !!sessionCookie,
    allCookies: Object.keys(req.cookies || {}),
    isLocalhost: isLocalhost
  });
  
  // Initialize user variables
  let userId = '';
  let displayName = '';
  let userInfo = {};
  
  if (isLocalhost) {
    console.log('🏠 LOCALHOST MODE - Using IT-provided fallback logic');
    
    if (sessionCookie) {
      console.log('Found session cookie on localhost, attempting to parse...');
      
      try {
        // Check if cookie matches the expected pattern (IT logic)
        const cookieMatch = sessionCookie.match(/(.+)?.*apprunnersession.*=.*(.+)?/);
        
        if (cookieMatch) {
          console.log('Cookie pattern matched on localhost');
          
          // Split and decode the cookie value (IT method)
          const value = "; " + sessionCookie;
          const parts = value.split("; apprunnersession=");
          
          if (parts.length === 2) {
            const decoded = decodeURIComponent(parts.pop().split(";").shift());
            console.log('Cookie decoded on localhost');
            
            try {
              // Try to parse as JSON first
              const userData = JSON.parse(decoded);
              displayName = userData.displayName || '';
              userId = userData.adUserId || userData.userId || '';
              userInfo = userData;
              
              console.log('✅ JSON parse successful on localhost:', {
                displayName,
                userId
              });
            } catch (jsonErr) {
              console.log('JSON parse failed on localhost, using pattern matching...');
              
              // Fallback: Use pattern matching
              const displayNameMatch = decoded.match(/displayName["\s]*[:=]["\s]*([^"&,}]+)/);
              const userIdMatch = decoded.match(/adUserId["\s]*[:=]["\s]*([^"&,}]+)/) || 
                                 decoded.match(/userId["\s]*[:=]["\s]*([^"&,}]+)/);
              
              displayName = displayNameMatch ? displayNameMatch[1].trim() : '';
              userId = userIdMatch ? userIdMatch[1].trim() : '';
              
              userInfo = {
                displayName: displayName,
                adUserId: userId,
                source: 'pattern_match_localhost'
              };
              
              console.log('✅ Pattern match successful on localhost:', {
                displayName,
                userId
              });
            }
          }
        } else {
          console.log('❌ Cookie pattern did not match on localhost');
        }
      } catch (err) {
        console.error('❌ Error parsing cookie on localhost:', err);
      }
    }
    
    // If no valid data extracted, use IT-provided fallback values
    if (!userId) {
      console.log('🔄 Using IT-provided fallback values for localhost');
      userId = '43898931';
      displayName = 'Mina Antoun Wilson Ross';
      userInfo = {
        displayName: displayName,
        adUserId: userId,
        source: 'it_fallback_localhost'
      };
      
      console.log('✅ IT fallback applied:', {
        displayName,
        userId
      });
    }
    
  } else {
    console.log('🌐 PRODUCTION MODE - Processing real AppRunner cookie');
    
    if (sessionCookie) {
      try {
        console.log('Processing AppRunner session cookie in production...');
        
        // Use IT-provided logic for production
        const value = "; " + sessionCookie;
        const parts = value.split("; apprunnersession=");
        
        if (parts.length >= 2) {
          const decoded = decodeURIComponent(parts.pop().split(";").shift());
          console.log('Cookie decoded successfully in production');
          
          try {
            // Parse as JSON (IT logic shows this structure)
            const userData = JSON.parse(decoded);
            console.log('Parsed user data from production cookie:', {
              hasDisplayName: !!userData.displayName,
              hasAdUserId: !!userData.adUserId,
              keys: Object.keys(userData || {})
            });
            
            // Extract user information using IT-provided field names
            displayName = userData.displayName || '';
            userId = userData.adUserId || userData.userId || '';
            userInfo = {
              ...userData,
              source: 'production_cookie'
            };
            
          } catch (jsonErr) {
            console.log('JSON parse failed in production, trying pattern extraction...');
            
            // Fallback: Use pattern matching similar to IT code
            const displayNameMatch = decoded.match(/displayName["\s]*[:=]["\s]*([^"&,}]+)/);
            const userIdMatch = decoded.match(/adUserId["\s]*[:=]["\s]*([^"&,}]+)/) || 
                               decoded.match(/userId["\s]*[:=]["\s]*([^"&,}]+)/);
            
            displayName = displayNameMatch ? displayNameMatch[1].trim() : '';
            userId = userIdMatch ? userIdMatch[1].trim() : '';
            
            userInfo = {
              displayName: displayName,
              adUserId: userId,
              rawCookie: decoded.substring(0, 100) + '...',
              source: 'pattern_match_production'
            };
          }
        }
      } catch (err) {
        console.error('❌ Failed to parse session cookie in production:', err);
        console.error('Cookie sample:', sessionCookie.substring(0, 100) + '...');
      }
    } else {
      console.log('❌ No AppRunner session cookie found in production');
    }
  }
  
  // Set user information on request object
  if (userId && displayName) {
    req.staffId = userId;
    req.userRole = getUserRole(userId);
    req.userInfo = {
      displayName: displayName,
      adUserId: userId,
      mail: `${userId}@hsbc.com`,
      ...userInfo
    };
    
    console.log('✅ User authenticated successfully:', {
      staffId: req.staffId,
      role: req.userRole,
      displayName: displayName,
      adUserId: userId,
      source: userInfo.source
    });
  } else {
    console.log('❌ Authentication failed - using default user');
    
    // Final fallback to default user
    req.staffId = 'default_user';
    req.userRole = getUserRole('default_user');
    req.userInfo = {
      displayName: 'Default User',
      adUserId: 'default_user',
      mail: 'default_user@hsbc.com',
      source: 'default_fallback',
      note: isLocalhost ? 'Localhost default' : 'Production default'
    };
  }
  
  console.log('=== FINAL AUTH RESULT ===');
  console.log({
    staffId: req.staffId,
    role: req.userRole,
    displayName: req.userInfo?.displayName,
    source: req.userInfo?.source,
    isLocalhost: isLocalhost
  });
  console.log('=============================');
  
  next();
};

module.exports = authMiddleware;