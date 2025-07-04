import { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { UserContext } from './UserContext';
import AdminPanel from './pages/AdminPanel';
import UserDashboard from './pages/UserDashboard';
import Home from './pages/Home';
import ProcedurePage from './pages/ProcedurePage';
import SubmitProcedure from './pages/SubmitProcedure';
import TestPage from './pages/TestPage';
import { CircularProgress, Box } from '@mui/material';

const App = () => {
  const { user, loading } = useContext(UserContext);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Router basename="/ProceduresHubEG6">
      <Routes>
        {/* Test route */}
        <Route path="/test-context" element={<TestPage />} />
        
        {/* Home page available to all */}
        <Route path="/" element={<Home />} />
        
        {/* Admin routes - protect with role check */}
        <Route 
          path="/admin-panel" 
          element={user?.role === 'admin' ? <AdminPanel /> : <Navigate to="/" />} 
        />
        <Route 
          path="/submit" 
          element={user?.role === 'admin' ? <SubmitProcedure /> : <Navigate to="/" />} 
        />
        
        {/* User routes */}
        <Route path="/user-dashboard" element={<UserDashboard />} />
        
        {/* LOB routes */}
        <Route path="/iwpb" element={<ProcedurePage lob="IWPB" />} />
        <Route path="/cib" element={<ProcedurePage lob="CIB" />} />
        <Route path="/gcoo" element={<ProcedurePage lob="GCOO" />} />
        
        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App;