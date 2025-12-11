// contexts/SidebarContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const SidebarContext = createContext();

export const useSidebar = () => {
    const context = useContext(SidebarContext);
    if (!context) {
        throw new Error('useSidebar must be used within SidebarProvider');
    }
    return context;
};

export const SidebarProvider = ({ children, initialIsOpen = true }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
        // Load from localStorage if available
        const saved = localStorage.getItem('sidebarOpen');
        return saved !== null ? saved === 'true' : initialIsOpen;
    });

    useEffect(() => {
        // Save to localStorage whenever it changes
        localStorage.setItem('sidebarOpen', isSidebarOpen.toString());
    }, [isSidebarOpen]);

    const toggleSidebar = () => {
        setIsSidebarOpen(prev => !prev);
    };

    return (
        <SidebarContext.Provider value={{ isSidebarOpen, setIsSidebarOpen, toggleSidebar }}>
            {children}
        </SidebarContext.Provider>
    );
};

