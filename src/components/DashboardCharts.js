import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#4caf50', '#ff9800', '#f44336', '#2196f3'];

const DashboardCharts = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    // Fetch dashboard data
    Promise.all([
      fetch('/ProceduresHubEG6/api/dashboard-summary').then(res => res.json()),
      fetch('/ProceduresHubEG6/api/dashboard/by-lob').then(res => res.json()),
      fetch('/ProceduresHubEG6/api/dashboard/expiry-timeline').then(res => res.json())
    ]).then(([summary, byLob, timeline]) => {
      setData({ summary, byLob, timeline });
    }).catch(err => console.error('Failed to fetch dashboard data:', err));
  }, []);

  if (!data) return <Typography>Loading charts...</Typography>;

  // Prepare data for charts
  const statusData = [
    { name: 'Active', value: data.summary.total - data.summary.expired },
    { name: 'Expired', value: data.summary.expired },
    { name: 'Expiring Soon', value: data.summary.expiringSoon }
  ];

  const lobData = Object.entries(data.byLob).map(([lob, stats]) => ({
    name: lob,
    total: stats.total,
    expired: stats.expired,
    avgScore: stats.averageScore
  }));

  const timelineData = [
    { name: 'Expired', count: data.timeline.expired },
    { name: 'This Week', count: data.timeline.thisWeek },
    { name: 'This Month', count: data.timeline.thisMonth },
    { name: 'Later', count: data.timeline.later }
  ];

  return (
    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center', p: 2 }}>
      {/* Status Pie Chart */}
      <Paper elevation={3} sx={{ p: 2, flex: '1 1 300px', minWidth: 300 }}>
        <Typography variant="h6" gutterBottom>Procedure Status</Typography>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={statusData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {statusData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </Paper>

      {/* LOB Bar Chart */}
      <Paper elevation={3} sx={{ p: 2, flex: '1 1 400px', minWidth: 400 }}>
        <Typography variant="h6" gutterBottom>Procedures by Line of Business</Typography>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={lobData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="total" fill="#2196f3" name="Total" />
            <Bar dataKey="expired" fill="#f44336" name="Expired" />
          </BarChart>
        </ResponsiveContainer>
      </Paper>

      {/* Timeline Bar Chart */}
      <Paper elevation={3} sx={{ p: 2, flex: '1 1 300px', minWidth: 300 }}>
        <Typography variant="h6" gutterBottom>Expiry Timeline</Typography>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={timelineData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#ff9800" />
          </BarChart>
        </ResponsiveContainer>
      </Paper>
    </Box>
  );
};

export default DashboardCharts;