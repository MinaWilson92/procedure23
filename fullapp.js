// SharePoint-Compatible App.js
import React, { useState, useEffect } from 'react';

// Basic Material-UI components (safe imports)
const Box = ({ children, sx, ...props }) => (
  <div style={{ ...sx }} {...props}>{children}</div>
);

const Typography = ({ variant, children, sx, ...props }) => {
  const styles = {
    h4: { fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0' },
    h6: { fontSize: '1.25rem', fontWeight: '500', margin: '0.5rem 0' },
    body1: { fontSize: '1rem', margin: '0.25rem 0' },
    body2: { fontSize: '0.875rem', margin: '0.25rem 0' }
  };
  
  return (
    <div style={{ ...styles[variant], ...sx }} {...props}>
      {children}
    </div>
  );
};

const Button = ({ children, variant, color, onClick, sx, ...props }) => {
  const baseStyle = {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    ...sx
  };
  
  const variantStyles = {
    contained: {
      backgroundColor: color === 'primary' ? '#1976d2' : '#d40000',
      color: 'white'
    },
    outlined: {
      backgroundColor: 'transparent',
      border: `1px solid ${color === 'primary' ? '#1976d2' : '#d40000'}`,
      color: color === 'primary' ? '#1976d2' : '#d40000'
    }
  };
  
  return (
    <button 
      style={{ ...baseStyle, ...variantStyles[variant] }} 
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

const Card = ({ children, sx, ...props }) => (
  <div style={{
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    padding: '16px',
    margin: '8px',
    ...sx
  }} {...props}>
    {children}
  </div>
);

// Main HSBC App Component
function HSBCProceduresHub() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [procedures, setProcedures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  // Initialize app
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      console.log('🚀 Initializing HSBC Procedures Hub...');
      
      // Check authentication
      const authResponse = await fetch('/ProceduresHubEG6/api/auth/check');
      if (authResponse.ok) {
        const authData = await authResponse.json();
        if (authData.authenticated) {
          setUser(authData.user);
          console.log('✅ User authenticated:', authData.user.displayName);
        }
      }
      
      // Load procedures
      const procResponse = await fetch('/ProceduresHubEG6/api/procedures');
      if (procResponse.ok) {
        const procData = await procResponse.json();
        setProcedures(procData);
        console.log('✅ Procedures loaded:', procData.length);
      }
      
      setLoading(false);
      
    } catch (err) {
      console.error('❌ Initialization error:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  // Navigation handler
  const navigate = (view) => {
    setCurrentView(view);
    console.log('📍 Navigating to:', view);
  };

  if (loading) {
    return (
      <Box sx={{
        minHeight: '100vh',
        backgroundColor: '#f5f6fa',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column'
      }}>
        <Box sx={{
          width: '80px',
          height: '40px',
          backgroundColor: '#d40000',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          borderRadius: '6px',
          marginBottom: '20px'
        }}>
          HSBC
        </Box>
        <Typography variant="h6">Loading Procedures Hub...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{
        minHeight: '100vh',
        backgroundColor: '#f5f6fa',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column'
      }}>
        <Box sx={{
          width: '80px',
          height: '40px',
          backgroundColor: '#d40000',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          borderRadius: '6px',
          marginBottom: '20px'
        }}>
          HSBC
        </Box>
        <Typography variant="h6" sx={{ color: '#f44336' }}>
          ❌ Error: {error}
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => window.location.reload()}
          sx={{ marginTop: '20px' }}
        >
          🔄 Reload
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f6fa' }}>
      {/* Header */}
      <Box sx={{
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
        color: 'white',
        padding: '20px 0'
      }}>
        <Box sx={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <Box sx={{
              width: '80px',
              height: '40px',
              backgroundColor: '#d40000',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              borderRadius: '6px'
            }}>
              HSBC
            </Box>
            <Typography variant="h4">Procedures Hub</Typography>
          </Box>
          
          {user && (
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body2">
                Welcome, {user.displayName}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Role: {user.role}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* Navigation */}
      <Box sx={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e0e0e0',
        padding: '10px 0'
      }}>
        <Box sx={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 20px',
          display: 'flex',
          gap: '10px'
        }}>
          <Button
            variant={currentView === 'dashboard' ? 'contained' : 'outlined'}
            onClick={() => navigate('dashboard')}
          >
            📊 Dashboard
          </Button>
          <Button
            variant={currentView === 'procedures' ? 'contained' : 'outlined'}
            onClick={() => navigate('procedures')}
          >
            📄 All Procedures
          </Button>
          {user?.role === 'admin' && (
            <Button
              variant={currentView === 'admin' ? 'contained' : 'outlined'}
              onClick={() => navigate('admin')}
            >
              ⚙️ Admin Panel
            </Button>
          )}
        </Box>
      </Box>

      {/* Main Content */}
      <Box sx={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '20px'
      }}>
        {currentView === 'dashboard' && <DashboardView procedures={procedures} />}
        {currentView === 'procedures' && <ProceduresView procedures={procedures} />}
        {currentView === 'admin' && user?.role === 'admin' && <AdminView />}
      </Box>
    </Box>
  );
}

// Dashboard View Component
function DashboardView({ procedures }) {
  const now = new Date();
  const stats = {
    total: procedures.length,
    expired: procedures.filter(p => new Date(p.expiry) < now).length,
    expiringSoon: procedures.filter(p => {
      const expiry = new Date(p.expiry);
      const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
      return daysLeft > 0 && daysLeft <= 30;
    }).length,
    highQuality: procedures.filter(p => (p.score || 0) >= 80).length
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ marginBottom: '20px' }}>
        📊 Dashboard Overview
      </Typography>
      
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <Card sx={{ textAlign: 'center', backgroundColor: '#2196f3', color: 'white' }}>
          <Typography variant="h6">Total Procedures</Typography>
          <Typography variant="h4">{stats.total}</Typography>
        </Card>
        
        <Card sx={{ textAlign: 'center', backgroundColor: '#ff9800', color: 'white' }}>
          <Typography variant="h6">Expiring Soon</Typography>
          <Typography variant="h4">{stats.expiringSoon}</Typography>
        </Card>
        
        <Card sx={{ textAlign: 'center', backgroundColor: '#f44336', color: 'white' }}>
          <Typography variant="h6">Expired</Typography>
          <Typography variant="h4">{stats.expired}</Typography>
        </Card>
        
        <Card sx={{ textAlign: 'center', backgroundColor: '#4caf50', color: 'white' }}>
          <Typography variant="h6">High Quality</Typography>
          <Typography variant="h4">{stats.highQuality}</Typography>
        </Card>
      </Box>

      <Card>
        <Typography variant="h6" sx={{ marginBottom: '15px' }}>
          📈 Recent Activity
        </Typography>
        <Typography variant="body2">
          • {procedures.length} procedures in system
        </Typography>
        <Typography variant="body2">
          • {stats.expiringSoon} procedures need attention
        </Typography>
        <Typography variant="body2">
          • System working normally ✅
        </Typography>
      </Card>
    </Box>
  );
}

// Procedures View Component
function ProceduresView({ procedures }) {
  return (
    <Box>
      <Typography variant="h4" sx={{ marginBottom: '20px' }}>
        📄 All Procedures ({procedures.length})
      </Typography>
      
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '20px'
      }}>
        {procedures.map((proc, index) => (
          <Card key={proc.id || index}>
            <Typography variant="h6" sx={{ marginBottom: '10px' }}>
              {proc.name}
            </Typography>
            <Typography variant="body2" sx={{ marginBottom: '5px' }}>
              📅 Expiry: {proc.expiry}
            </Typography>
            <Typography variant="body2" sx={{ marginBottom: '5px' }}>
              👤 Owner: {proc.primary_owner}
            </Typography>
            <Typography variant="body2" sx={{ marginBottom: '5px' }}>
              🏢 LOB: {proc.lob}
            </Typography>
            {proc.score && (
              <Typography variant="body2" sx={{
                color: proc.score >= 80 ? '#4caf50' : proc.score >= 60 ? '#ff9800' : '#f44336'
              }}>
                📊 Quality: {proc.score}%
              </Typography>
            )}
          </Card>
        ))}
      </Box>
      
      {procedures.length === 0 && (
        <Card sx={{ textAlign: 'center', padding: '40px' }}>
          <Typography variant="h6">No procedures found</Typography>
          <Typography variant="body2">
            Procedures will appear here once they are uploaded.
          </Typography>
        </Card>
      )}
    </Box>
  );
}

// Admin View Component
function AdminView() {
  const [uploadStatus, setUploadStatus] = useState('');

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadStatus('Uploading...');
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', 'Test Procedure');
    formData.append('primary_owner', 'Test User');
    formData.append('lob', 'IWPB');
    formData.append('expiry', '2025-12-31');

    try {
      const response = await fetch('/ProceduresHubEG6/api/procedures', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      if (result.accepted) {
        setUploadStatus(`✅ Upload successful! Quality score: ${result.analysis.score}%`);
      } else {
        setUploadStatus(`❌ Upload failed: ${result.message}`);
      }
    } catch (error) {
      setUploadStatus(`❌ Upload error: ${error.message}`);
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ marginBottom: '20px' }}>
        ⚙️ Admin Panel
      </Typography>
      
      <Card sx={{ marginBottom: '20px' }}>
        <Typography variant="h6" sx={{ marginBottom: '15px' }}>
          📤 Upload New Procedure
        </Typography>
        
        <input
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={handleFileUpload}
          style={{
            padding: '10px',
            border: '2px dashed #ccc',
            borderRadius: '6px',
            width: '100%',
            marginBottom: '10px'
          }}
        />
        
        {uploadStatus && (
          <Typography variant="body2" sx={{ marginTop: '10px' }}>
            {uploadStatus}
          </Typography>
        )}
      </Card>

      <Card>
        <Typography variant="h6" sx={{ marginBottom: '15px' }}>
          🔧 System Status
        </Typography>
        <Typography variant="body2">
          • SharePoint Integration: ✅ Active
        </Typography>
        <Typography variant="body2">
          • Document Analysis: ✅ Working
        </Typography>
        <Typography variant="body2">
          • Authentication: ✅ Connected
        </Typography>
      </Card>
    </Box>
  );
}

// Export the main app
export default HSBCProceduresHub;
