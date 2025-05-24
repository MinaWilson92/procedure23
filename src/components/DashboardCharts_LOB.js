import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#4caf50', '#ff9800', '#f44336'];

const DashboardCharts_LOB = ({ lob }) => {
  const [procedures, setProcedures] = useState([]);

  useEffect(() => {
    fetch('/ProceduresHubEG6/api/procedures')
      .then(res => res.json())
      .then(data => {
        setProcedures(data.filter(p => p.lob === lob));
      })
      .catch(err => console.error('Failed to fetch procedures:', err));
  }, [lob]);

  const now = new Date();
  const statusCounts = procedures.reduce((acc, proc) => {
    const expiryDate = new Date(proc.expiry);
    const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 0) acc.expired++;
    else if (daysLeft <= 30) acc.expiringSoon++;
    else acc.active++;
    
    return acc;
  }, { active: 0, expiringSoon: 0, expired: 0 });

  const scoreDistribution = procedures.reduce((acc, proc) => {
    if (proc.score >= 90) acc.high++;
    else if (proc.score >= 80) acc.medium++;
    else acc.low++;
    return acc;
  }, { high: 0, medium: 0, low: 0 });

  const statusData = [
    { name: 'Active', value: statusCounts.active },
    { name: 'Expiring Soon', value: statusCounts.expiringSoon },
    { name: 'Expired', value: statusCounts.expired }
  ];

  const scoreData = [
    { name: 'High (90+)', value: scoreDistribution.high },
    { name: 'Medium (80-89)', value: scoreDistribution.medium },
    { name: 'Low (<80)', value: scoreDistribution.low }
  ];

  return (
    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', p: 2, flexWrap: 'wrap' }}>
      <Paper elevation={3} sx={{ p: 2, minWidth: 300 }}>
        <Typography variant="h6" gutterBottom>{lob} Status Overview</Typography>
        <ResponsiveContainer width={300} height={200}>
          <PieChart>
            <Pie
              data={statusData}
              cx="50%"
              cy="50%"
              outerRadius={60}
              fill="#8884d8"
              dataKey="value"
              label
            >
              {statusData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </Paper>

      <Paper elevation={3} sx={{ p: 2, minWidth: 300 }}>
        <Typography variant="h6" gutterBottom>Score Distribution</Typography>
        <ResponsiveContainer width={300} height={200}>
          <PieChart>
            <Pie
              data={scoreData}
              cx="50%"
              cy="50%"
              outerRadius={60}
              fill="#8884d8"
              dataKey="value"
              label
            >
              {scoreData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </Paper>
    </Box>
  );
};

export default DashboardCharts_LOB;