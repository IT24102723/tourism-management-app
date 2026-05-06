import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadUser(); }, []);

    const loadUser = async () => {
        try {
            const u = await AsyncStorage.getItem('tss_user');
            if (u) setUser(JSON.parse(u));
        } catch (e) { }
        setLoading(false);
    };

    const login = async (email, password) => {
        const res = await API.post('/auth/login', { email, password });
        const { access_token, refresh_token, user } = res.data.data;
        await AsyncStorage.setItem('tss_access_token', access_token);
        await AsyncStorage.setItem('tss_refresh_token', refresh_token);
        await AsyncStorage.setItem('tss_user', JSON.stringify(user));
        setUser(user);
        return user;
    };

    const register = async (data) => {
        const res = await API.post('/auth/register', data);
        const { access_token, refresh_token, user } = res.data.data;
        await AsyncStorage.setItem('tss_access_token', access_token);
        await AsyncStorage.setItem('tss_refresh_token', refresh_token);
        await AsyncStorage.setItem('tss_user', JSON.stringify(user));
        setUser(user);
        return user;
    };

    const logout = async () => {
        await AsyncStorage.multiRemove(['tss_access_token', 'tss_refresh_token', 'tss_user']);
        setUser(null);
    };

    const updateUser = async (newData) => {
        const updated = { ...user, ...newData };
        await AsyncStorage.setItem('tss_user', JSON.stringify(updated));
        setUser(updated);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};