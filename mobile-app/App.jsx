import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { Platform } from 'react-native';

if (Platform.OS === 'web') {
  // Inject global styles to ensure the root web container behaves like a mobile screen
  const style = document.createElement('style');
  style.textContent = `
    html, body, #root {
      min-height: 100vh;
      width: 100%;
      display: flex;
      flex-direction: column;
    }
    #root > div {
      flex: 1;
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