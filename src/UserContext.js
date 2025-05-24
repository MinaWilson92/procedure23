import { createContext, useEffect, useState } from 'react';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check user role from the server
    fetch('/ProceduresHubEG6/api/role-check')
      .then(res => res.json())
      .then(data => {
        console.log('User data:', data);
        setUser(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch user:', err);
        // Default to user role if API fails
        setUser({ staffId: 'guest', role: 'user' });
        setLoading(false);
      });
  }, []);

  return (
    <UserContext.Provider value={{ user, loading }}>
      {children}
    </UserContext.Provider>
  );
};