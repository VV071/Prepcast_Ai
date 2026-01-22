import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
};

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => {
        // Check localStorage first, fallback to 'dark'
        const savedTheme = localStorage.getItem('prepcast-theme');
        return savedTheme || 'dark';
    });

    useEffect(() => {
        // Update localStorage when theme changes
        localStorage.setItem('prepcast-theme', theme);

        // Update document root attribute for CSS variables
        document.documentElement.setAttribute('data-theme', theme);

        // Toggle dark class for Tailwind dark mode
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }

        console.log('Theme changed to:', theme); // Debug log
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
