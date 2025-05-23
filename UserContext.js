import { createContext, useEffect, useState } from 'react';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch('/ProceduresHubEG6/api/me')
      .then(res => res.json())
      .then(data => setUser(data))
      .catch(() => setUser({ role: 'user' }));
  }, []);

  return (
    <UserContext.Provider value={user}>
      {children}
    </UserContext.Provider>
  );
};
