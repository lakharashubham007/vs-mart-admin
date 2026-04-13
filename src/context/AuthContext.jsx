import React, { createContext, useContext, useState, useEffect } from 'react';
import * as authService from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            if (token) {
                try {
                    const data = await authService.getMe();
                    setUser(data);
                } catch (error) {
                    console.error('Auth init failed:', error);
                    logout();
                }
            }
            setLoading(false);
        };
        initAuth();
    }, [token]);

    const login = async (email, password, type = 'staff') => {
        const data = await authService.login(email, password, type);
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.user.role || '');
        localStorage.setItem('adminId', data.user._id || data.user.id || '');
        localStorage.setItem('loginType', type);
        return data;
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('adminId');
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, logout, setUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
