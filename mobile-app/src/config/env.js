import { Platform } from 'react-native';

/**
 * ⚠️ NETWORK CONFIGURATION
 * Change LOCAL_MACHINE_IP to your current IPv4 address (run 'ipconfig' on Windows).
 * This is required for physical devices and Expo Go to reach your local backend.
 */
// Replace this with your COMPUTER'S IPv4 address (e.g., 192.168.1.5)
// If you have deployed to Vercel, put your vercel URL here (e.g., 'your-app.vercel.app')
export const LOCAL_MACHINE_IP = '192.168.1.2';
export const PRODUCTION_API_URL = 'https://tourism-management-app-production-323d.up.railway.app';

export const API_PORT = '5051';
export const API_VERSION = 'v1';

const getBaseURL = () => {
  // If we are running in a deployed web environment (Vercel)
  if (Platform.OS === 'web' && process.env.NODE_ENV === 'production') {
    return `${PRODUCTION_API_URL}/api/${API_VERSION}`;
  }

  // Web platform
  if (Platform.OS === 'web') {
    return `http://localhost:${API_PORT}/api/${API_VERSION}`;
  }

  // Local Development
  return `http://${LOCAL_MACHINE_IP}:${API_PORT}/api/${API_VERSION}`;
};

export const API_BASE_URL = getBaseURL();
export const IMAGE_BASE_URL = Platform.OS === 'web' && process.env.NODE_ENV === 'production'
  ? PRODUCTION_API_URL
  : `http://${LOCAL_MACHINE_IP}:${API_PORT}`;

console.log('🌐 API Config Initialized:');
console.log(`   Base URL: ${API_BASE_URL}`);
console.log(`   Images:   ${IMAGE_BASE_URL}`);
