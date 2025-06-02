// contexts/NavigationContext.js - Navigation State Management
import React, { createContext, useContext, useState } from 'react';

const NavigationContext = createContext();

export const NavigationProvider = ({ children }) => {
  const [currentPage, setCurrentPage] = useState('home');
  const [pageData, setPageData] = useState({});

  const navigate = (page, data = {}) => {
    setCurrentPage(page);
    setPageData(data);
    console.log('📍 Navigating to:', page);
  };

  return (
    <NavigationContext.Provider value={{ currentPage, pageData, navigate }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return context;
};