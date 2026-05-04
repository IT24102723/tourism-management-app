import { Platform } from 'react-native';

/**
 * ⚠️ NETWORK CONFIGURATION
 * Change LOCAL_MACHINE_IP to your current IPv4 address (run 'ipconfig' on Windows).
 * This is required for physical devices and Expo Go to reach your local backend.
 */
export const LOCAL_MACHINE_IP = '192.168.1.2';

export const API_PORT = '5051';
export const API_VERSION = 'v1';

const getBaseURL = () => {
  // Web platform
  if (Platform.OS === 'web') {
    return `http://localhost:${API_PORT}/api/${API_VERSION}`;
  }
  // For Android Emulator, you can use 10.0.2.2
  // But LOCAL_MACHINE_IP works for both physical and simulator if configured correctly
  return `http://${LOCAL_MACHINE_IP}:${API_PORT}/api/${API_VERSION}`;
};

export const API_BASE_URL = getBaseURL();
export const IMAGE_BASE_URL = `http://${LOCAL_MACHINE_IP}:${API_PORT}`;

console.log('🌐 API Config Initialized:');
console.log(`   Base URL: ${API_BASE_URL}`);
console.log(`   Images:   ${IMAGE_BASE_URL}`);
