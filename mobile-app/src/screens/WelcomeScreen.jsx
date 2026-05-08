import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, StatusBar, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

// A beautiful image of Sri Lanka (e.g. Nine Arch Bridge or Sigiriya)
const BACKGROUND_IMAGE = 'https://images.unsplash.com/photo-1586227740560-8cf2732c1531?q=80&w=2661&auto=format&fit=crop';

export default function WelcomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <ImageBackground 
        source={{ uri: BACKGROUND_IMAGE }} 
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.9)']}
          style={styles.overlay}
        >
          <View style={styles.content}>
            <Text style={styles.subtitle}>Explore the Pearl of the Indian Ocean</Text>
            <Text style={styles.title}>Welcome to{'\n'}Sri Lanka</Text>
            <Text style={styles.description}>
              Discover breathtaking landscapes, ancient heritage, and unforgettable adventures.
            </Text>

            <TouchableOpacity 
              style={styles.button}
              onPress={() => navigation.replace('Login')}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Get Started</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 30,
    paddingBottom: 60,
  },
  content: {
    alignItems: 'flex-start',
  },
  subtitle: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  title: {
    color: '#FFF',
    fontSize: 48,
    fontWeight: 'bold',
    lineHeight: 54,
    marginBottom: 16,
  },
  description: {
    color: '#DDD',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 40,
    maxWidth: '90%',
  },
  button: {
    backgroundColor: '#2E86AB',
    width: '100%',
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#2E86AB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});
