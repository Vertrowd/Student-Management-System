import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Check localStorage for saved preference, default to 'dark'
    const savedTheme = localStorage.getItem('vertrowd-theme');
    return savedTheme || 'dark';
  });

  useEffect(() => {
    // Apply the theme to the document root
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('vertrowd-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
