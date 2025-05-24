// src/pages/TestPage.js
import React, { useContext } from 'react';
import { UserContext } from '../UserContext';
import { Box, Typography, Paper } from '@mui/material';

const TestPage = () => {
  // Always call hooks at the top level
  const contextValue = useContext(UserContext);

  // Detect if no provider has been mounted above
  const hasContext = contextValue != null;

  return (
    <Box sx={{ p: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Context Test Page
        </Typography>

        {!hasContext && (
          <Typography color="error" sx={{ mb: 2 }}>
            ⚠️ No UserContext.Provider found. Please wrap your app (or this page)
            in a{' '}
            <code>
              UserContext.Provider value={{ /* your context here */ }}
            </code>
            .
          </Typography>
        )}

        <Typography variant="h6">Context Value:</Typography>
        <pre
          style={{
            background: '#f5f5f5',
            padding: '10px',
            borderRadius: '4px',
          }}
        >
          {JSON.stringify(contextValue, null, 2)}
        </pre>

        <Typography variant="h6" sx={{ mt: 2 }}>
          Type Check:
        </Typography>
        <ul>
          <li>Context type: {typeof contextValue}</li>
          <li>
            Has <code>user</code> property:{' '}
            {contextValue && 'user' in contextValue ? 'Yes' : 'No'}
          </li>
          <li>
            Has <code>loading</code> property:{' '}
            {contextValue && 'loading' in contextValue ? 'Yes' : 'No'}
          </li>
          <li>User type: {typeof contextValue?.user}</li>
          <li>Loading type: {typeof contextValue?.loading}</li>
        </ul>
      </Paper>
    </Box>
  );
};

export default TestPage;
