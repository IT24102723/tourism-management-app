import React, { useState, useCallback, useContext } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, 
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import API from '../services/api';

const TYPES = ['Hotel', 'Transport', 'Tour_Guide', 'Restaurant', 'Activity'];

export default function ProviderProfileScreen({ route, navigation }) {
  const isSetup = route.params?.setup;
  const [loading, setLoading] = useState(!isSetup);
  const [saving, setSaving]   = useState(false);
  const [profile, setProfile] = useState({
    business_name: '', business_type: 'Hotel', city: '', 
    contact_email: '', contact_phone: '', website: '', description: '', license_number: ''
  });

  useFocusEffect(useCallback(() => { 
    if (!isSetup) fetchProfile();
  }, [isSetup]));

  const fetchProfile = async () => {
    try {
      const res = await API.get('/providers/me');
      if (res.data.data) setProfile(res.data.data);
    } catch (e) {
      console.log('Fetch profile error:', e.response?.data);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!profile.business_name || !profile.city || !profile.contact_email || !profile.contact_phone) {
      return Alert.alert('Error', 'Name, City, Email and Phone are required.');
    }
    if (!profile.contact_email.includes('@')) {
      return Alert.alert('Invalid Email', 'Please enter a valid business email with @ symbol.');
    }
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(profile.contact_phone)) {
      return Alert.alert('Invalid Phone', 'Phone number must be exactly 10 numeric digits.');
    }
    setSaving(true);
    try {
      if (isSetup || !profile.provider_id) {
        await API.post('/providers', profile);
        Alert.alert('✅ Created', 'Your provider profile has been created and sent for approval.');
      } else {
        await API.put(`/providers/${profile.provider_id}`, profile);
        Alert.alert('✅ Updated', 'Your profile has been updated successfully.');
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to save profile');
    }
    setSaving(false);
  };

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#0D5F8A" />
    </View>
  );

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{isSetup ? 'Setup Business Profile' : 'Edit My Profile'}</Text>
          <Text style={styles.sub}>This information is visible to potential tourists.</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Business Name *</Text>
          <TextInput 
            style={styles.input} value={profile.business_name} 
            onChangeText={v => setProfile(p => ({ ...p, business_name: v }))}
            placeholder="e.g. Serenity Beach Resort"
          />

          <Text style={styles.label}>Business Type *</Text>
          <View style={styles.typeRow}>
            {TYPES.map(t => (
              <TouchableOpacity 
                key={t} 
                style={[styles.typeChip, profile.business_type === t && styles.typeActive]}
                onPress={() => setProfile(p => ({ ...p, business_type: t }))}
              >
                <Text style={[styles.typeText, profile.business_type === t && { color: '#fff' }]}>
                  {t.replace('_', ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>City *</Text>
              <TextInput 
                style={styles.input} value={profile.city} 
                onChangeText={v => setProfile(p => ({ ...p, city: v }))}
                placeholder="e.g. Mirissa"
              />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.label}>License Number</Text>
              <TextInput 
                style={styles.input} value={profile.license_number} 
                onChangeText={v => setProfile(p => ({ ...p, license_number: v }))}
                placeholder="SLTDA-..."
              />
            </View>
          </View>

          <Text style={styles.label}>Contact Email</Text>
          <TextInput 
            style={styles.input} value={profile.contact_email} 
            onChangeText={v => setProfile(p => ({ ...p, contact_email: v }))}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Contact Phone</Text>
          <TextInput 
            style={styles.input} value={profile.contact_phone} 
            onChangeText={v => setProfile(p => ({ ...p, contact_phone: v }))}
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Website</Text>
          <TextInput 
            style={styles.input} value={profile.website} 
            onChangeText={v => setProfile(p => ({ ...p, website: v }))}
            placeholder="https://..."
            autoCapitalize="none"
          />

          <Text style={styles.label}>Description</Text>
          <TextInput 
            style={[styles.input, styles.textArea]} value={profile.description} 
            onChangeText={v => setProfile(p => ({ ...p, description: v }))}
            multiline numberOfLines={4}
            placeholder="Tell tourists about your business..."
          />

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Profile</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#F5F7FA', paddingTop: 55, paddingBottom: 24, paddingHorizontal: 20 },
  backBtn:   { marginBottom: 12 },
  backText:  { color: '#0D5F8A', fontWeight: 'bold' },
  title:     { fontSize: 22, fontWeight: 'bold', color: '#1A3A4A' },
  sub:       { fontSize: 13, color: '#777', marginTop: 4 },

  form: { padding: 20 },
  label: { fontSize: 13, fontWeight: 'bold', color: '#555', marginBottom: 8, marginTop: 10 },
  input: { 
    backgroundColor: '#F5F7FA', borderRadius: 10, padding: 12, 
    borderWidth: 1, borderColor: '#EEE', fontSize: 15, color: '#333' 
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  row: { flexDirection: 'row' },
  
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  typeChip: { 
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, 
    borderWidth: 1, borderColor: '#0D5F8A' 
  },
  typeActive: { backgroundColor: '#0D5F8A' },
  typeText: { fontSize: 11, color: '#0D5F8A', fontWeight: 'bold' },

  saveBtn: { 
    backgroundColor: '#0D5F8A', borderRadius: 12, paddingVertical: 16, 
    alignItems: 'center', marginTop: 30, elevation: 4
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
