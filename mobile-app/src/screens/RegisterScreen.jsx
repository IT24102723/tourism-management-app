import React, { useState, useContext } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ScrollView, ActivityIndicator,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';

export default function RegisterScreen({ navigation }) {
  const { register } = useContext(AuthContext);
  const [form, setForm]   = useState({ username: '', email: '', password: '', full_name: '', phone: '', role: 'Tourist' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleRegister = async () => {
    if (!form.username || !form.email || !form.password)
      return Alert.alert('Missing Fields', 'Username, email and password are required.');
    if (!form.email.includes('@'))
      return Alert.alert('Invalid Email', 'Please enter a valid email address.');
    if (form.phone && (form.phone.length !== 10 || isNaN(form.phone)))
      return Alert.alert('Invalid Phone', 'Phone number must be exactly 10 digits.');
    if (form.password.length < 8)
      return Alert.alert('Weak Password', 'Password must be at least 8 characters.');
    setLoading(true);
    try {
      await register(form);
    } catch (e) {
      const errData = e.response?.data;
      if (e.response?.status === 422 && Array.isArray(errData.errors)) {
        const msg = errData.errors.map(err => `• ${err.msg}`).join('\n');
        Alert.alert('Validation Error', msg);
      } else {
        const errMsg = errData?.message || 'Registration failed. Please try again.';
        Alert.alert('Registration Error', errMsg);
      }
    }
    setLoading(false);
  };

  return (
    <ScrollView
        style={styles.container} contentContainerStyle={{ paddingBottom: 50 }} keyboardShouldPersistTaps="handled">
      {/* Hero top */}
      <View style={styles.hero}>
        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.heroFlag}>🌴</Text>
        <Text style={styles.heroTitle}>Join Visit Sri Lanka</Text>
        <Text style={styles.heroSub}>Start your Sri Lanka adventure today</Text>
      </View>

      {/* Form card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Create Account</Text>
        <Text style={styles.cardSub}>Fill in the details below to get started</Text>

        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. John Smith"
          placeholderTextColor="#AAA"
          value={form.full_name}
          onChangeText={v => set('full_name', v)}
        />

        <Text style={styles.label}>Username <Text style={styles.req}>*</Text></Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. johnsmith"
          placeholderTextColor="#AAA"
          value={form.username}
          onChangeText={v => set('username', v)}
          autoCapitalize="none"
        />

        <Text style={styles.label}>Email Address <Text style={styles.req}>*</Text></Text>
        <TextInput
          style={styles.input}
          placeholder="you@example.com"
          placeholderTextColor="#AAA"
          value={form.email}
          onChangeText={v => set('email', v)}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Phone Number <Text style={styles.req}>*</Text></Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 0712345678"
          placeholderTextColor="#AAA"
          value={form.phone}
          onChangeText={v => set('phone', v)}
          keyboardType="phone-pad"
          maxLength={10}
        />

        <Text style={styles.label}>Password <Text style={styles.req}>*</Text></Text>
        <View style={styles.passRow}>
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0 }]}
            placeholder="Min 8 chars, 1 uppercase, 1 number"
            placeholderTextColor="#AAA"
            value={form.password}
            onChangeText={v => set('password', v)}
            secureTextEntry={!showPass}
          />
          <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPass(!showPass)}>
            <Text style={styles.eyeText}>{showPass ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Registering as *</Text>
        <View style={styles.roleRow}>
          {['Tourist', 'Service_Provider'].map(r => (
            <TouchableOpacity 
              key={r} 
              style={[styles.roleBtn, form.role === r && styles.roleActive]}
              onPress={() => set('role', r)}
            >
              <Text style={styles.roleBtnIcon}>{r === 'Tourist' ? '🎒' : '🏢'}</Text>
              <Text style={[styles.roleBtnText, form.role === r && { color: '#fff' }]}>
                {r.replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Nationality hint */}
        <View style={styles.hintBox}>
          <Text style={styles.hintText}>
            {form.role === 'Tourist' 
              ? '🌏 This app is for international tourists. Your account will let you book packages and transport.'
              : '🏢 List your business, manage packages, and connect with global tourists visiting Sri Lanka.'
            }
          </Text>
        </View>

        <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={loading} activeOpacity={0.85}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnText}>Create Account →</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.link}>
          <Text style={styles.linkText}>
            Already have an account?{'  '}
            <Text style={styles.linkBold}>Sign In</Text>
          </Text>
        </TouchableOpacity>

        {/* What you get */}
        <View style={styles.perks}>
          <Text style={styles.perksTitle}>✅ What you get:</Text>
          {[
            'Browse 100+ Sri Lanka attractions',
            'Book curated tour packages',
            'Arrange transport & schedules',
            '24/7 travel support',
          ].map((p, i) => (
            <Text key={i} style={styles.perkItem}>• {p}</Text>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#0D5F8A' },

  // Hero
  hero: { paddingTop: 55, paddingBottom: 30, paddingHorizontal: 24 },
  backBtn:   { marginBottom: 16 },
  backText:  { color: '#87CEEB', fontSize: 14, fontWeight: '600' },
  heroFlag:  { fontSize: 40, marginBottom: 8 },
  heroTitle: { fontSize: 26, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  heroSub:   { fontSize: 13, color: '#87CEEB' },

  // Card
  card: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 28,
    paddingTop: 32,
    minHeight: 600,
  },
  cardTitle: { fontSize: 20, fontWeight: 'bold', color: '#1A3A4A', marginBottom: 4 },
  cardSub:   { fontSize: 13, color: '#999', marginBottom: 24 },

  label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6 },
  req:   { color: '#E74C3C' },
  input: {
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    padding: 15,
    marginBottom: 16,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    color: '#333',
  },
  passRow:   { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 8 },
  eyeBtn:    { width: 48, height: 52, alignItems: 'center', justifyContent: 'center' },
  eyeText:   { fontSize: 20 },

  // Hint box
  hintBox: {
    backgroundColor: '#E8F5FF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: '#0D5F8A',
  },
  hintText: { color: '#0D5F8A', fontSize: 12, lineHeight: 18, fontWeight: '500' },

  // Button
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

  link:     { marginTop: 18, alignItems: 'center', marginBottom: 20 },
  linkText: { color: '#888', fontSize: 14 },
  linkBold: { color: '#0D5F8A', fontWeight: 'bold' },

  // Perks
  perks: {
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    padding: 16,
    marginTop: 4,
    marginBottom: 20,
  },
  perksTitle: { fontSize: 13, fontWeight: '700', color: '#333', marginBottom: 8 },
  perkItem:   { fontSize: 13, color: '#555', lineHeight: 22 },

  roleRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  roleBtn: { 
    flex: 1, backgroundColor: '#F5F7FA', borderRadius: 14, padding: 14, 
    alignItems: 'center', borderWidth: 1.5, borderColor: '#EEE' 
  },
  roleActive: { backgroundColor: '#0D5F8A', borderColor: '#0D5F8A' },
  roleBtnIcon: { fontSize: 24, marginBottom: 6 },
  roleBtnText: { fontSize: 12, fontWeight: '700', color: '#1A3A4A' },
});