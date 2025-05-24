import React, { useEffect, useState } from 'react';
import ProcedureCard from '../components/ProcedureCard';
import Header from '../components/Header';
import DashboardCharts from '../components/DashboardCharts_LOB';
import { motion } from 'framer-motion';

const ProcedurePage = ({ lob }) => {
  const [procedures, setProcedures] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [scoreFilter, setScoreFilter] = useState('');
  const [expiryFilter, setExpiryFilter] = useState('');

  useEffect(() => {
    fetch('/ProceduresHubEG6/api/procedures')
      .then(res => res.json())
      .then(data => {
        setProcedures(data.filter(p => p.lob === lob));
      });
  }, [lob]);

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setScoreFilter('');
    setExpiryFilter('');
  };

  const filterProcedures = () => {
    const now = new Date();
    return procedures.filter(proc => {
      const expiryDate = new Date(proc.expiry);
      const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

      const matchesSearch =
        proc.name.toLowerCase().includes(search.toLowerCase()) ||
        proc.primary_owner.toLowerCase().includes(search.toLowerCase()) ||
        proc.secondary_owner.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter ? proc.status === statusFilter : true;

      const matchesScore = scoreFilter
        ? (scoreFilter === '>90' && proc.score > 90) ||
          (scoreFilter === '80-90' && proc.score >= 80 && proc.score <= 90) ||
          (scoreFilter === '<80' && proc.score < 80)
        : true;

      const matchesExpiry = expiryFilter
        ? (expiryFilter === '<30' && daysLeft >= 0 && daysLeft <= 30) ||
          (expiryFilter === '<60' && daysLeft >= 0 && daysLeft <= 60) ||
          (expiryFilter === 'expired' && daysLeft < 0)
        : true;

      return matchesSearch && matchesStatus && matchesScore && matchesExpiry;
    });
  };

  return (
    <>
      <Header title={`Viewing: ${lob} Procedures`} />
      <DashboardCharts lob={lob} />
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ padding: '2rem', textAlign: 'left' }}
      >
        <h2 style={{ marginLeft: '1rem' }}>{lob} Procedures</h2>

        <div style={{
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          margin: '1rem 1rem 2rem',
          alignItems: 'center'
        }}>
          <input
            type="text"
            placeholder="Search by name or owner..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ padding: '0.5rem', width: '250px', borderRadius: '5px', border: '1px solid #ccc' }}
          />

          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '0.5rem', borderRadius: '5px' }}>
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
          </select>

          <select value={scoreFilter} onChange={e => setScoreFilter(e.target.value)} style={{ padding: '0.5rem', borderRadius: '5px' }}>
            <option value="">All Scores</option>
            <option value=">90">Above 90</option>
            <option value="80-90">80 - 90</option>
            <option value="<80">Below 80</option>
          </select>

          <select value={expiryFilter} onChange={e => setExpiryFilter(e.target.value)} style={{ padding: '0.5rem', borderRadius: '5px' }}>
            <option value="">All Expiry Statuses</option>
            <option value="<30">Expiring in 30 Days</option>
            <option value="<60">Expiring in 60 Days</option>
            <option value="expired">Already Expired</option>
          </select>

          <button onClick={clearFilters} style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#ccc',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}>🧹 Clear All</button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {filterProcedures().map((proc, index) => (
            <motion.div
              key={proc.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              style={{ margin: '1rem' }}
            >
              <ProcedureCard proc={proc} />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </>
  );
};

export default ProcedurePage;
