// App.js - Main Entry Point
import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { SharePointProvider } from './SharePointContext';
import { NavigationProvider } from './contexts/NavigationContext';
import HSBCProceduresHub from './components/HSBCProceduresHub';
import { theme } from './theme/theme';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SharePointProvider>
        <NavigationProvider>
          <HSBCProceduresHub />
        </NavigationProvider>
      </SharePointProvider>
    </ThemeProvider>
  );
}

export default App;