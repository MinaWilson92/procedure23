import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button, Box, Chip, Typography } from '@mui/material';
import { UserContext } from '../UserContext';
import DashboardCharts from '../components/DashboardCharts';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const { user, loading } = useContext(UserContext);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    fetch('/ProceduresHubEG6/api/dashboard-summary')
      .then(res => res.json())
      .then(data => setSummary(data))
      .catch(err => console.error("Dashboard summary fetch failed:", err));
  }, []);

  // Show loading while user context is loading
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <div className="container">
      <header className="navbar">
        <h1>HSBC Procedures Hub</h1>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {user && (
            <Chip 
              label={`${user.staffId} (${user.role})`} 
              color={user.role === 'admin' ? 'error' : 'default'}
              variant="outlined"
              sx={{ color: 'white', borderColor: 'white' }}
            />
          )}
          {user?.role === 'admin' && (
            <Button 
              variant="contained" 
              color="error"
              onClick={() => navigate('/admin-panel')}
              sx={{ fontWeight: 'bold' }}
            >
              Admin Panel
            </Button>
          )}
        </Box>
      </header>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ background: '#f0f0f0', padding: '1rem', marginTop: '1rem', borderRadius: '8px' }}
      >
        <h3>📊 Dashboard Summary</h3>
        {summary && (
          <p>
            📄 Total: {summary.total} | ⏰ Expiring Soon: {summary.expiringSoon} | ❌ Expired: {summary.expired} | 📈 Avg. Score: {summary.averageScore}%
          </p>
        )}
      </motion.div>

      {user?.role === 'admin' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{
            background: '#fff3cd',
            border: '1px solid #ffeaa7',
            borderRadius: '8px',
            padding: '1rem',
            margin: '1rem 0',
            textAlign: 'center'
          }}
        >
          <p style={{ margin: 0, fontWeight: 'bold', color: '#856404' }}>
            🔐 Admin Access Enabled - You can add, edit, and manage procedures
          </p>
          <Button 
            variant="contained" 
            onClick={() => navigate('/admin-panel')}
            sx={{ mt: 1, backgroundColor: '#d40000' }}
          >
            ➕ Add New Procedure
          </Button>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          padding: '1rem',
          margin: '2rem auto',
          maxWidth: '900px'
        }}
      >
        <DashboardCharts />
      </motion.div>

      <main>
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Welcome to the Procedures Dashboard
        </motion.h2>

        <p>Manage and oversee current procedures by line of business.</p>

        <div className="cards">
          {['IWPB', 'CIB', 'GCOO'].map((lob, index) => (
            <motion.div
              className="card"
              key={lob}
              whileHover={{ scale: 1.05 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
            >
              <div className="icon">📁</div>
              <h3>{lob}</h3>
              <p>{lob === 'IWPB' ? 'International Wealth and Private Banking'
                  : lob === 'CIB' ? 'Commercial and Institutional Banking'
                  : 'Global Corporates and Operating Offices'}</p>
              <button onClick={() => navigate(`/${lob.toLowerCase()}`)}>View Procedures</button>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Home;