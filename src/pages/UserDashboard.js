import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

const UserDashboard = () => {
  return (
    <Box sx={{ padding: 4 }}>
      <Typography variant="h4" gutterBottom>
        User Dashboard
      </Typography>
      <Card elevation={3}>
        <CardContent>
          <Typography variant="body1">
            Welcome to the Procedures Hub! Here you can explore your line of business procedures.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default UserDashboard;
