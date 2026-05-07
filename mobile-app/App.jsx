import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { Platform } from 'react-native';

if (Platform.OS === 'web') {
  // Inject global styles to ensure the root web container behaves like a mobile screen
  const style = document.createElement('style');
  style.textContent = `
    html, body, #root {
      height: 100%;
      width: 100%;
      overflow-y: hidden;
      display: flex;
      flex-direction: column;
      flex: 1;
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