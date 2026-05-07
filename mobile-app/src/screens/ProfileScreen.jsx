import React, { useContext, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, Image,
  ActivityIndicator, Modal, TextInput, ScrollView, Platform, Dimensions
} from 'react-native';
import { AuthContext } from '../context/AuthContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
import API from '../services/api';
import { pickImage, uploadImage } from '../services/upload.service';
import { resolveImageUrl } from '../utils/imageUtils';

export default function ProfileScreen({ navigation }) {
  const { user, logout, updateUser } = useContext(AuthContext);
  const [uploading, setUploading] = useState(false);

  const [editForm, setEditForm] = useState({ full_name: user?.full_name || '', phone: user?.phone || '' });
  const [editModal, setEditModal] = useState(false);

  const handleLogout = () => {
    const message = 'Are you sure you want to logout?';
    if (Platform.OS === 'web') {
      if (window.confirm(message)) logout();
    } else {
      Alert.alert('Logout', message, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => { await logout(); }
        },
      ]);
    }
  };

  const handlePickImage = async () => {
    const asset = await pickImage();
    if (!asset) return;

    setUploading(true);
    try {
      const url = await uploadImage(asset);
      // Update backend
      await API.put('/auth/profile', { profile_image: url });
      // Update local context
      await updateUser({ profile_image: url });
      Alert.alert('Success', 'Profile picture updated!');
    } catch (e) {
      Alert.alert('Error', 'Failed to update profile picture');
    }
    setUploading(false);
  };

  const handleUpdateProfile = async () => {
    if (editForm.phone && (editForm.phone.length !== 10 || isNaN(editForm.phone))) {
      return Alert.alert('Invalid Phone', 'Phone number must be exactly 10 digits.');
    }
    try {
      await API.put('/auth/profile', editForm);
      await updateUser(editForm);
      setEditModal(false);
      Alert.alert('Success', 'Profile updated!');
    } catch (e) {
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const roleColor = {
    Tourist: '#2980B9', Service_Provider: '#27AE60',
    Admin: '#E74C3C', Tourism_Authority: '#8E44AD', Support_Agent: '#F39C12',
  };

  const profileUri = resolveImageUrl(user?.profile_image);

  const webHeight = Platform.OS === 'web'
    ? (typeof window !== 'undefined' ? window.innerHeight : SCREEN_HEIGHT)
    : null;

  return (
    <View style={Platform.OS === 'web' ? { height: webHeight, overflow: 'hidden' } : { flex: 1, backgroundColor: '#f0f4f8' }}>
      <ScrollView style={styles.container} contentContainerStyle={{ flexGrow: 1, paddingBottom: 80 }} showsVerticalScrollIndicator={true}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.avatarContainer} onPress={handlePickImage} disabled={uploading}>
          {profileUri ? (
            <Image source={{ uri: profileUri }} style={styles.avatarImg} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.full_name?.[0] || user?.username?.[0] || '?'}</Text>
            </View>
          )}
          {uploading && (
            <View style={styles.uploadOverlay}>
              <ActivityIndicator color="#fff" />
            </View>
          )}
          <View style={styles.editBadge}>
            <Text style={{ fontSize: 10 }}>📷</Text>
          </View>
        </TouchableOpacity>
        <Text style={styles.name}>{user?.full_name || user?.username}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={[styles.roleBadge, { backgroundColor: roleColor[user?.role] || '#888' }]}>
          <Text style={styles.roleText}>{user?.role?.replace('_', ' ')}</Text>
        </View>
      </View>

      <View style={styles.card}>
        {[
          ['Username', user?.username],
          ['Email', user?.email],
          ['Full Name', user?.full_name || '—'],
          ['Phone', user?.phone || '—']
        ].map(([k, v]) => (
          <View key={k} style={styles.row}>
            <Text style={styles.label}>{k}</Text>
            <Text style={styles.value}>{v}</Text>
          </View>
        ))}
        <TouchableOpacity style={styles.editProfileBtn} onPress={() => setEditModal(true)}>
          <Text style={styles.editProfileBtnText}>✏️ Edit Profile Info</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.menuCard}>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Inquiry')}>
          <Text style={styles.menuText}>💬 My Inquiries</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Bookings')}>
          <Text style={styles.menuText}>📅 My Bookings</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('MyFeedback')}>
          <Text style={styles.menuText}>⭐ My Reviews</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      {/* Edit Info Modal */}
      <Modal visible={editModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Profile Info</Text>

            <Text style={styles.fieldLabel}>Full Name</Text>
            <TextInput
              style={styles.fieldInput}
              value={editForm.full_name}
              onChangeText={v => setEditForm({ ...editForm, full_name: v })}
            />

            <Text style={styles.fieldLabel}>Phone Number</Text>
            <TextInput
              style={styles.fieldInput}
              value={editForm.phone}
              onChangeText={v => setEditForm({ ...editForm, phone: v })}
              keyboardType="phone-pad"
              maxLength={10}
            />

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleUpdateProfile}>
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        </View>
      </Modal>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8' },
  header: { backgroundColor: '#2E86AB', alignItems: 'center', padding: 32, paddingTop: 60, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  avatarContainer: { position: 'relative', marginBottom: 12 },
  avatarImg: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#fff' },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
  uploadOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
  editBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#fff', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2 },
  avatarText: { color: '#fff', fontSize: 36, fontWeight: 'bold' },
  name: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  email: { color: '#cce8f4', marginTop: 4, fontSize: 13 },
  roleBadge: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 4, marginTop: 10 },
  roleText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  card: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 20, borderRadius: 14, padding: 16, elevation: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  label: { color: '#888', fontSize: 13 },
  value: { fontWeight: '600', color: '#333', fontSize: 13 },
  menuCard: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 12, borderRadius: 14, overflow: 'hidden', elevation: 2 },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  menuText: { fontSize: 14, color: '#333', fontWeight: '500' },
  menuArrow: { color: '#aaa', fontSize: 20 },
  logoutBtn: { margin: 16, backgroundColor: '#E74C3C', borderRadius: 12, padding: 16, alignItems: 'center' },
  logoutText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  editProfileBtn: { marginTop: 10, padding: 8, alignItems: 'center' },
  editProfileBtnText: { color: '#2E86AB', fontWeight: 'bold', fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  fieldLabel: { fontSize: 13, fontWeight: 'bold', color: '#666', marginBottom: 5 },
  fieldInput: { borderWidth: 1, borderColor: '#DDD', borderRadius: 8, padding: 12, marginBottom: 15 },
  modalBtns: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  cancelBtn: { padding: 10 },
  cancelBtnText: { color: '#999', fontWeight: 'bold' },
  saveBtn: { backgroundColor: '#2E86AB', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  saveBtnText: { color: '#fff', fontWeight: 'bold' },
});