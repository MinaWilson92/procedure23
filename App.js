import { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { UserContext } from './UserContext';
import AdminPanel from './pages/AdminPanel';
import UserDashboard from './pages/UserDashboard';

const App = () => {
  const user = useContext(UserContext);

  if (!user) return <div>Loading...</div>;

  return (
    <Router basename="/ProceduresHubEG6">
      <Routes>
        {user.role === 'admin' ? (
          <Route path="/" element={<Navigate to="/admin-panel" />} />
        ) : (
          <Route path="/" element={<Navigate to="/user-dashboard" />} />
        )}
        <Route path="/admin-panel" element={<AdminPanel />} />
        <Route path="/user-dashboard" element={<UserDashboard />} />
      </Routes>
    </Router>
  );
};

export default App;
