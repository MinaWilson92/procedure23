// components/PageRouter.js - Page Routing Logic
import React from 'react';
import HomePage from '../pages/HomePage';
import UserDashboardPage from '../pages/UserDashboardPage';
import ProceduresPage from '../pages/ProceduresPage';
import AdminPanelPage from '../pages/AdminPanelPage';

const PageRouter = ({ currentPage, ...props }) => {
  switch (currentPage) {
    case 'home':
      return <HomePage {...props} />;
    case 'user-dashboard':
      return <UserDashboardPage {...props} />;
    case 'procedures':
      return <ProceduresPage {...props} />;
    case 'admin-panel':
      return <AdminPanelPage {...props} />;
    case 'submit-procedure':
      return <AdminPanelPage {...props} />;
    default:
      return <HomePage {...props} />;
  }
};

export default PageRouter;