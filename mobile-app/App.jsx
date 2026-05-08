import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { Platform } from 'react-native';

if (Platform.OS === 'web' && typeof document !== 'undefined') {
  // Inject global styles to ensure the root web container behaves like a mobile screen
  const style = document.createElement('style');
  style.textContent = `
    html, body, #root {
      height: 100%;
      width: 100%;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    #root * {
      /* Force React Navigation intermediate divs to pass down flex if they are relative */
    }
    #root > div {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
  `;
  document.head.appendChild(style);
}

export default function App() {
    return (
        <AuthProvider>
            <AppNavigator />
        </AuthProvider>
    );
}