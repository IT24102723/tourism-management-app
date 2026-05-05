import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import { API_BASE_URL } from '../config/env';

const API = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Increased to 30s for slower connections
  validateStatus: (status) => status >= 200 && status < 300,
});


API.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('tss_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    console.warn('⚠️ Token retrieval error:', e.message);
  }
  console.log(`🚀 [${config.method?.toUpperCase()}] ${config.baseURL}${config.url}`);
  return config;
});

API.interceptors.response.use(
  (response) => {
    if (response.status < 400) {
      console.log(`✅ [${response.status}] Success`);
    } else {
      console.warn(`⚠️ [${response.status}] ${response.data?.message || 'Error'}`);
    }
    return response;
  },
  (error) => {
    let message = error.response?.data?.message || error.message || 'Connection Error';
    const status = error.response?.status;

    if (status === 401) {
      AsyncStorage.removeItem('tss_access_token');
      console.warn('🔴 [401] Unauthorized - token removed');
    } else if (status === 500) {
      console.error('🔴 [500] Server Error');
    } else if (!error.response) {
      message = `Network Error: Cannot reach ${API.defaults.baseURL}. Ensure your phone is on the same Wi-Fi as your PC (192.168.1.2).`;
      console.error(`🔴 ${message}`);
    }

    console.error(`❌ API Error: ${message}`);
    return Promise.reject(error);
  }
);

export default API;
