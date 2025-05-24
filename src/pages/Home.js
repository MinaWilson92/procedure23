import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import DashboardCharts from '../components/DashboardCharts';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    fetch('/ProceduresHubEG6/api/dashboard-summary')
      .then(res => res.json())
      .then(data => setSummary(data))
      .catch(err => console.error("Dashboard summary fetch failed:", err));
  }, []);

  return (
    <div className="container">
      <header className="navbar">
        <h1>HSBC</h1>
        <button className="signin">Sign In</button>
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
