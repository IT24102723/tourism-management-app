import React, { useState, useContext } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const { login } = useContext(AuthContext);
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Missing Fields', 'Please enter your email and password.');
    if (!email.includes('@')) return Alert.alert('Invalid Email', 'Please enter a valid email address.');
    setLoading(true);
    try {
      await login(email, password);
    } catch (e) {
      const errorMsg = e.response?.data?.message
        || e.message
        || 'Connection failed. Please ensure the server is running.';
      Alert.alert('Login Failed', errorMsg);
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Hero top section */}
        <View style={styles.hero}>
          <Text style={styles.heroFlag}>🇱🇰</Text>
          <Text style={styles.heroTitle}>Visit Sri Lanka</Text>
          <Text style={styles.heroSub}>The Pearl of the Indian Ocean</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome Back</Text>
          <Text style={styles.cardSub}>Sign in to continue your journey</Text>

          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor="#AAA"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Password</Text>
          <View style={styles.passRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              placeholder="Enter your password"
              placeholderTextColor="#AAA"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPass}
            />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPass(!showPass)}>
              <Text style={styles.eyeText}>{showPass ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>Sign In →</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.link}>
            <Text style={styles.linkText}>
              New to Visit Sri Lanka?{'  '}
              <Text style={styles.linkBold}>Create Account</Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bottom note */}
        <Text style={styles.note}>🌴 Discover ancient temples, beaches & wildlife</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#0D5F8A' },

  // Hero
  hero: { alignItems: 'center', paddingTop: 70, paddingBottom: 36, paddingHorizontal: 24 },
  heroFlag:  { fontSize: 52, marginBottom: 10 },
  heroTitle: { fontSize: 30, fontWeight: 'bold', color: '#fff', marginBottom: 6, textAlign: 'center' },
  heroSub:   { fontSize: 14, color: '#87CEEB', textAlign: 'center' },

  // Card
  card: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 40,
    minHeight: 480,
  },
  cardTitle: { fontSize: 22, fontWeight: 'bold', color: '#1A3A4A', marginBottom: 4 },
  cardSub:   { fontSize: 13, color: '#999', marginBottom: 28 },

  label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6 },
  input: {
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    padding: 15,
    marginBottom: 18,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    color: '#333',
  },
  passRow:   { flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 8 },
  eyeBtn:    { width: 48, height: 52, alignItems: 'center', justifyContent: 'center' },
  eyeText:   { fontSize: 20 },

  btn: {
    backgroundColor: '#0D5F8A',
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#0D5F8A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
  },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 17 },

  link:     { marginTop: 20, alignItems: 'center' },
  linkText: { color: '#888', fontSize: 14, textAlign: 'center' },
  linkBold: { color: '#0D5F8A', fontWeight: 'bold' },

  note: { textAlign: 'center', color: '#fff', fontSize: 12, paddingVertical: 16, opacity: 0.8 },
});