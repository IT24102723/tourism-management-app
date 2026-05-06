import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, Modal, ScrollView, TextInput, Image, Platform
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import API from '../services/api';
import { pickImage, uploadImage } from '../services/upload.service';
import { resolveImageUrl } from '../utils/imageUtils';

const STATUS_OPTIONS = ['Pending', 'Active', 'Inactive', 'Suspended'];

export default function AdminProvidersScreen({ navigation }) {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [editModal, setEditModal] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editItem, setEditItem]   = useState(null);

  useFocusEffect(useCallback(() => { fetchAll(); }, []));

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await API.get('/providers/all');
      console.log('Providers Response:', res.data);
      const provList = res.data?.data?.providers || res.data?.data || [];
      setProviders(Array.isArray(provList) ? provList : []);
    } catch (e) {
      console.error('Error fetching providers:', e.response?.data || e.message);
      Alert.alert('Error', e.response?.data?.message || 'Failed to load providers');
    }
    setLoading(false);
  };

  const openEdit = (item) => {
    setEditItem({
      provider_id:   item.provider_id,
      business_name: item.business_name || '',
      business_type: item.business_type || 'Hotel',
      status:        item.status || 'Active',
      contact_number:item.contact_number || '',
      address:       item.address || '',
      image_url:     item.image_url || '',
      description:   item.description || '',
    });
    setEditModal(true);
  };

  const openAdd = () => {
    setEditItem({
      provider_id:   null,
      business_name: '',
      business_type: 'Hotel',
      status:        'Active',
      contact_number: '',
      address:       '',
      image_url:     '',
      description:   '',
    });
    setEditModal(true);
  };

  const handlePickAndUpload = async () => {
    const asset = await pickImage();
    if (!asset) return;
    setUploading(true);
    try {
      const url = await uploadImage(asset);
      setEditItem(p => ({ ...p, image_url: url }));
    } catch (e) {
      Alert.alert('Upload Failed', e.message || 'Could not upload image');
    }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!editItem.business_name.trim()) return Alert.alert('Error', 'Name is required.');
    if (editItem.contact_number && (editItem.contact_number.length !== 10 || isNaN(editItem.contact_number))) {
      return Alert.alert('Invalid Phone', 'Contact number must be exactly 10 digits.');
    }
    setSaving(true);
    try {
      const payload = {
        business_name:  editItem.business_name,
        business_type:  editItem.business_type,
        status:         editItem.status,
        contact_number: editItem.contact_number,
        address:        editItem.address,
        image_url:      editItem.image_url,
        description:    editItem.description,
      };

      if (editItem.provider_id) {
        await Promise.all([
          API.put(`/providers/${editItem.provider_id}`, payload),
          API.patch(`/providers/${editItem.provider_id}/status`, { status: editItem.status })
        ]);
        Alert.alert('✅ Saved', 'Provider updated successfully.');
      } else {
        await API.post('/providers', payload);
        Alert.alert('✅ Created', 'New provider added successfully.');
      }
      setEditModal(false);
      fetchAll();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Save failed.');
    }
    setSaving(false);
  };

  const handleDelete = (item) => {
    const message = `Delete "${item.business_name}"?`;
    if (Platform.OS === 'web') {
      if (window.confirm(message)) {
        (async () => {
          try {
            await API.delete(`/providers/${item.provider_id}`);
            fetchAll();
          } catch (e) { Alert.alert('Error', e.response?.data?.message || 'Delete failed.'); }
        })();
      }
    } else {
      Alert.alert('Delete Provider', message, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await API.delete(`/providers/${item.provider_id}`);
            fetchAll();
          } catch (e) { Alert.alert('Error', e.response?.data?.message || 'Delete failed.'); }
        }},
      ]);
    }
  };

  const filtered = providers.filter(p =>
    (p.business_name || '').toLowerCase().includes(search.toLowerCase()) ||
    String(p.provider_id).includes(search)
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
            <Text style={styles.addBtnText}>+ Add Provider</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerTitle}>🏢 Manage Providers</Text>
        <Text style={styles.headerSub}>{filtered.length} service providers registered</Text>
      </View>

      <TextInput
        style={styles.search}
        placeholder="🔍 Search by name or ID..."
        value={search}
        onChangeText={setSearch}
        placeholderTextColor="#AAA"
      />

      {loading ? <ActivityIndicator size="large" color="#0D5F8A" style={{ marginTop: 40 }} /> : (
        <FlatList
          data={filtered}
          keyExtractor={i => String(i.provider_id)}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 30 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardName}>{item.business_name}</Text>
                  <Text style={styles.cardSub}>ID: #{item.provider_id} • {item.business_type}</Text>
                  <View style={styles.ratingRow}>
                    <Text style={styles.starText}>⭐ {Number(item.average_rating || 0).toFixed(1)}</Text>
                    <Text style={styles.ratingCount}>({item.rating_count || 0} reviews)</Text>
                  </View>
                </View>
                <View style={[styles.statusBadge, {
                  backgroundColor: item.status === 'Active' ? '#EAFAF1' :
                                   item.status === 'Pending' ? '#FEF9E7' :
                                   item.status === 'Suspended' ? '#FDEDEC' : '#F5F5F5'
                }]}>
                  <Text style={[styles.statusText, {
                    color: item.status === 'Active' ? '#27AE60' :
                           item.status === 'Pending' ? '#E67E22' :
                           item.status === 'Suspended' ? '#E74C3C' : '#333'
                  }]}>{item.status}</Text>
                </View>
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(item)}>
                  <Text style={styles.editBtnText}>✏️ Edit Details</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
                  <Text style={styles.deleteBtnText}>🗑️ Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {/* Edit Modal */}
      <Modal visible={editModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>
                {editItem?.provider_id ? '✏️ Edit Provider' : '✨ Add New Provider'}
              </Text>
              
              <Text style={styles.fieldLabel}>Business Name *</Text>
              <TextInput
                style={styles.fieldInput}
                value={editItem?.business_name}
                onChangeText={v => setEditItem({ ...editItem, business_name: v })}
                placeholder="Enter hotel or guide name"
              />

              <Text style={styles.fieldLabel}>Provider Type</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                {['Hotel', 'Transport', 'Tour_Guide', 'Restaurant'].map(t => (
                  <TouchableOpacity key={t}
                    style={[styles.chip, { flex: 1, alignItems: 'center' }, editItem?.business_type === t && styles.chipActive]}
                    onPress={() => setEditItem({ ...editItem, business_type: t })}>
                    <Text style={[styles.chipText, editItem?.business_type === t && { color: '#fff' }]}>
                      {t.replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Profile/Business Image</Text>
              {editItem?.image_url ? (
                <Image 
                  source={{ uri: resolveImageUrl(editItem.image_url) }} 
                  style={{ width: '100%', height: 150, borderRadius: 10, marginBottom: 12, backgroundColor: '#eee' }} 
                />
              ) : null}
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                <TextInput
                  style={[styles.fieldInput, { flex: 1, marginBottom: 0 }]}
                  value={editItem?.image_url}
                  onChangeText={v => setEditItem({ ...editItem, image_url: v })}
                  placeholder="Image URL or pick file"
                />
                <TouchableOpacity 
                  style={[styles.pickBtn, uploading && { opacity: 0.5 }]} 
                  onPress={handlePickAndUpload}
                  disabled={uploading}
                >
                  {uploading ? <ActivityIndicator color="#fff" /> : <Text style={styles.pickBtnText}>🖼️ Pick</Text>}
                </TouchableOpacity>
              </View>

              <Text style={styles.fieldLabel}>Description</Text>
              <TextInput
                style={[styles.fieldInput, { height: 80, textAlignVertical: 'top' }]}
                value={editItem?.description}
                onChangeText={v => setEditItem({ ...editItem, description: v })}
                placeholder="About the provider..."
                multiline
              />

              <Text style={styles.fieldLabel}>Contact Number</Text>
              <TextInput
                style={styles.fieldInput}
                value={editItem?.contact_number}
                onChangeText={v => setEditItem({ ...editItem, contact_number: v })}
                placeholder="Phone number"
                keyboardType="phone-pad"
                maxLength={10}
              />

              <Text style={styles.fieldLabel}>Address</Text>
              <TextInput
                style={styles.fieldInput}
                value={editItem?.address}
                onChangeText={v => setEditItem({ ...editItem, address: v })}
                placeholder="Full address"
              />

              <Text style={styles.fieldLabel}>Status</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                {STATUS_OPTIONS.map(s => (
                  <TouchableOpacity key={s}
                    style={[styles.chip, { flex: 1, alignItems: 'center' }, editItem?.status === s && styles.chipActive]}
                    onPress={() => setEditItem({ ...editItem, status: s })}>
                    <Text style={[styles.chipText, editItem?.status === s && { color: '#fff' }]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalBtns}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditModal(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                  {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { backgroundColor: '#1A3A4A', paddingTop: 55, paddingBottom: 20, paddingHorizontal: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  addBtn: { backgroundColor: '#27AE60', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12 },
  addBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  backBtn:     { marginBottom: 0 },
  backText:    { color: '#87CEEB', fontSize: 14, fontWeight: '600' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  headerSub:   { fontSize: 12, color: '#87CEEB' },
  search:      { margin: 16, backgroundColor: '#fff', borderRadius: 12, padding: 13, fontSize: 14, borderWidth: 1, borderColor: '#E0E0E0' },
  card:        { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, elevation: 2 },
  cardRow:     { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  cardName:    { fontSize: 16, fontWeight: 'bold', color: '#1A3A4A', marginBottom: 4 },
  cardSub:     { fontSize: 12, color: '#777', marginBottom: 6 },
  ratingRow:   { flexDirection: 'row', alignItems: 'center' },
  starText:    { fontSize: 13, color: '#F39C12', fontWeight: 'bold', marginRight: 4 },
  ratingCount: { fontSize: 11, color: '#AAA' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginLeft: 8, alignSelf: 'flex-start' },
  statusText:  { fontWeight: '700', fontSize: 11 },
  cardActions: { flexDirection: 'row', gap: 10 },
  editBtn:     { flex: 1, backgroundColor: '#EDF4F8', borderRadius: 8, paddingVertical: 9, alignItems: 'center', borderWidth: 1, borderColor: '#0D5F8A' },
  editBtnText: { color: '#0D5F8A', fontWeight: '700', fontSize: 13 },
  deleteBtn:     { flex: 1, backgroundColor: '#FDEDEC', borderRadius: 8, paddingVertical: 9, alignItems: 'center', borderWidth: 1, borderColor: '#E74C3C' },
  deleteBtnText: { color: '#E74C3C', fontWeight: '700', fontSize: 13 },
  modalOverlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent:  { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '92%' },
  modalTitle:    { fontSize: 18, fontWeight: 'bold', color: '#1A3A4A', marginBottom: 16 },
  fieldLabel:    { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6 },
  fieldInput:    { backgroundColor: '#F5F7FA', borderRadius: 10, padding: 13, marginBottom: 14, borderWidth: 1, borderColor: '#E0E0E0', fontSize: 14 },
  chip:          { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: '#0D5F8A', marginRight: 8, backgroundColor: '#fff' },
  chipActive:    { backgroundColor: '#0D5F8A' },
  chipText:      { color: '#0D5F8A', fontSize: 11, fontWeight: '600' },
  pickBtn:       { backgroundColor: '#0D5F8A', borderRadius: 10, paddingHorizontal: 15, height: 48, justifyContent: 'center', alignItems: 'center' },
  pickBtnText:   { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  modalBtns:     { flexDirection: 'row', gap: 12, marginTop: 8, marginBottom: 20 },
  cancelBtn:     { flex: 1, backgroundColor: '#F5F7FA', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  cancelBtnText: { color: '#666', fontWeight: '600' },
  saveBtn:       { flex: 2, backgroundColor: '#0D5F8A', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  saveBtnText:   { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
