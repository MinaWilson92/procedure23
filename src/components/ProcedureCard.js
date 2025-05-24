import React from 'react';
import { Card, CardContent, Typography, Chip, Box, LinearProgress } from '@mui/material';
import { motion } from 'framer-motion';

const ProcedureCard = ({ proc }) => {
  const now = new Date();
  const expiryDate = new Date(proc.expiry);
  const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
  
  const getStatusColor = () => {
    if (daysLeft < 0) return '#f44336'; // Red for expired
    if (daysLeft <= 30) return '#ff9800'; // Orange for expiring soon
    return '#4caf50'; // Green for active
  };

  const getScoreColor = (score) => {
    if (score >= 90) return '#4caf50';
    if (score >= 80) return '#ff9800';
    return '#f44336';
  };

  return (
    <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
      <Card sx={{ width: 350, height: 280, display: 'flex', flexDirection: 'column' }}>
        <CardContent sx={{ flex: 1 }}>
          <Typography variant="h6" gutterBottom noWrap>
            {proc.name}
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Chip 
              label={daysLeft < 0 ? 'EXPIRED' : `${daysLeft} days left`}
              size="small"
              sx={{ 
                backgroundColor: getStatusColor(),
                color: 'white',
                fontWeight: 'bold'
              }}
            />
          </Box>

          <Typography variant="body2" color="text.secondary" gutterBottom>
            <strong>Primary Owner:</strong> {proc.primary_owner}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" gutterBottom>
            <strong>Secondary Owner:</strong> {proc.secondary_owner}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" gutterBottom>
            <strong>Expiry Date:</strong> {new Date(proc.expiry).toLocaleDateString()}
          </Typography>

          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" gutterBottom>
              <strong>Compliance Score:</strong>
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LinearProgress 
                variant="determinate" 
                value={proc.score || 0} 
                sx={{ 
                  flex: 1, 
                  height: 8, 
                  borderRadius: 4,
                  backgroundColor: '#e0e0e0',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: getScoreColor(proc.score || 0),
                    borderRadius: 4
                  }
                }}
              />
              <Typography variant="body2" fontWeight="bold">
                {proc.score || 0}%
              </Typography>
            </Box>
          </Box>

          {proc.file_link && (
            <Box sx={{ mt: 2 }}>
              <a 
                href={`/ProceduresHubEG6${proc.file_link}`} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ color: '#1976d2', textDecoration: 'none' }}
              >
                📄 View Document
              </a>
            </Box>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ProcedureCard;