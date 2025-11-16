import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api'; // <-- Import centralized API

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // --- DELETED ---
    // The baseURL is now set in api.js
    // const backendURL = ...
    // axios.defaults.baseURL = ...
    // --- DELETED ---

    useEffect(() => {
        try {
            const storedUser = localStorage.getItem('userInfo');
            if (storedUser) setUser(JSON.parse(storedUser));
        } catch (error) {
            console.error("Failed to parse user info", error);
        } finally {
            setLoading(false);
        }
    }, []);

    const login = async (email, password) => {
        // Use 'api' instead of 'axios'
        const { data } = await api.post('/api/auth/login', { email, password });
        localStorage.setItem('userInfo', JSON.stringify(data));
        setUser(data);
    };
    
    const signup = async (email, password, role) => {
        // Use 'api' instead of 'axios'
        const { data } = await api.post('/api/auth/signup', { email, password, role });
        localStorage.setItem('userInfo', JSON.stringify(data));
        setUser(data);
    };

    const logout = () => {
        localStorage.removeItem('userInfo');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);