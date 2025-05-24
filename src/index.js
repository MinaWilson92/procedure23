import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { UserProvider } from './UserContext';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import './style.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <UserProvider>
        <App />
      </UserProvider>
    </LocalizationProvider>
  </React.StrictMode>
);