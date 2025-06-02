// pages/ProceduresPage.js - Professional Procedures List
import React from 'react';
import {
  Box, Typography, Button, Grid, Card, CardContent, Chip
} from '@mui/material';
import {
  Refresh, Business, Person, CalendarToday, Description
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const ProceduresPage = ({ procedures }) => {
  const now = new Date();

  const getStatusColor = (expiry) => {
    const expiryDate = new Date(expiry);
    const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 0) return '#f44336'; // Red for expired
    if (daysLeft <= 30) return '#ff9800'; // Orange for expiring soon
    return '#4caf50'; // Green for active
  };

  const getStatusText = (expiry) => {
    const expiryDate = new Date(expiry);
    const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 0) return `EXPIRED (${Math.abs(daysLeft)} days ago)`;
    if (daysLeft <= 30) return `${daysLeft} days left`;
    return `${daysLeft} days left`;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          📄 All Procedures ({procedures.length})
        </Typography>
        <Button
          variant="contained"
          startIcon={<Refresh />}
          onClick={() => window.location.reload()}
        >
          Refresh
        </Button>
      </Box>
      
      <Grid container spacing={3}>
        {procedures.map((proc) => (
          <Grid item xs={12} sm={6} md={4} key={proc.id}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                '&:hover': {
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  transform: 'translateY(-2px)'
                },
                transition: 'all 0.3s ease'
              }}>
                <CardContent sx={{ flex: 1 }}>
                  <Typography variant="h6" gutterBottom noWrap title={proc.name}>
                    {proc.name}
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Chip 
                      label={getStatusText(proc.expiry)}
                      size="small"
                      sx={{ 
                        backgroundColor: getStatusColor(proc.expiry),
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    />
                  </Box>

                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <Business sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                    LOB: {proc.lob}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <Person sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                    Owner: {proc.primary_owner}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <CalendarToday sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                    Expiry: {new Date(proc.expiry).toLocaleDateString()}
                  </Typography>

                  {proc.score && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" gutterBottom>
                        Quality Score: <strong>{proc.score}%</strong>
                      </Typography>
                      <Box sx={{
                        width: '100%',
                        height: 8,
                        bgcolor: '#e0e0e0',
                        borderRadius: 4,
                        overflow: 'hidden'
                      }}>
                        <Box sx={{
                          width: `${proc.score}%`,
                          height: '100%',
                          bgcolor: proc.score >= 80 ? '#4caf50' : proc.score >= 60 ? '#ff9800' : '#f44336',
                          borderRadius: 4
                        }} />
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>
      
      {procedures.length === 0 && (
        <Card sx={{ textAlign: 'center', py: 8 }}>
          <CardContent>
            <Description sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h5" color="text.secondary" gutterBottom>
              No procedures found
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Procedures will appear here once they are uploaded to the system.
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default ProceduresPage;