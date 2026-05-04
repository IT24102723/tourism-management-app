import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { API_BASE_URL } from '../config/env';

const API_BASE = API_BASE_URL; // Standardized based on server logs and api.js

export const pickImage = async () => {
  // Request permissions
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    alert('Sorry, we need camera roll permissions to make this work!');
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'], // Updated to use array/MediaType as per deprecation notice
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.7,
  });

  if (!result.canceled) {
    return result.assets[0];
  }
  return null;
};

export const uploadImage = async (imageAsset) => {
  try {
    const token = await AsyncStorage.getItem('tss_access_token');
    const formData = new FormData();
    
    // In React Native, we need to provide uri, type, and name
    formData.append('image', {
      uri: imageAsset.uri,
      type: 'image/jpeg', // Defaulting to jpeg; could be dynamic from imageAsset.type
      name: imageAsset.fileName || `upload-${Date.now()}.jpg`,
    });

    const response = await axios.post(`${API_BASE}/upload`, formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.data.success) {
      // Prepend the full base URL so the frontend can display it easily
      // However, usually we return relative path and let frontend handle base URL
      return response.data.data.url;
    }
    throw new Error(response.data.message || 'Upload failed');
  } catch (error) {
    console.error('Upload Error:', error.message);
    throw error;
  }
};
