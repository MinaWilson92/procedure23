// components/PageRouter.js - Updated with new admin dashboard
import React from 'react';
import HomePage from '../pages/HomePage';
import ProceduresPage from '../pages/ProceduresPage';
import AdminPanelPage from '../pages/AdminPanelPage';
import AdminDashboardPage from '../pages/AdminDashboardPage'; // ✅ NEW: Add this page

const PageRouter = ({ currentPage, ...props }) => {
  switch (currentPage) {
    case 'home':
      return <HomePage {...props} />;
    case 'procedures':
      return <ProceduresPage {...props} />;
    case 'admin-dashboard': // ✅ NEW: Admin dashboard page
      return <AdminDashboardPage {...props} />;
    case 'admin-panel': // ✅ FIX: This is now the upload page
      return <AdminPanelPage {...props} />;
    default:
      return <HomePage {...props} />;
  }
};

export default PageRouter;
