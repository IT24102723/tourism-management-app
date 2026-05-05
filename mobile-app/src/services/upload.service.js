import * as ImagePicker from 'expo-image-picker';
import API from './api';

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
    const formData = new FormData();

    // In React Native, we need to provide uri, type, and name
    formData.append('image', {
      uri: imageAsset.uri,
      type: imageAsset.mimeType || 'image/jpeg',
      name: imageAsset.fileName || `upload-${Date.now()}.jpg`,
    });

    const response = await API.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
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
