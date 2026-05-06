import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, TextInput, Modal, ScrollView, Image, Platform
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import API from '../services/api';
import { pickImage, uploadImage } from '../services/upload.service';
import { AuthContext } from '../context/AuthContext';
import { resolveImageUrl } from '../utils/imageUtils';

const TYPE_OPTIONS = ['Leisure', 'Adventure', 'Cultural', 'Wildlife', 'Budget', 'Standard', 'Premium'];

export default function AdminPackagesScreen({ navigation, route }) {
  const { user } = React.useContext(AuthContext);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editModal, setEditModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editItem, setEditItem] = useState(null);

  useFocusEffect(useCallback(() => {
    fetchAll();
    if (route?.params?.openAdd) {
      openAdd();
      navigation.setParams({ openAdd: false });
    }
  }, [route?.params?.openAdd]));

  const fetchAll = async () => {
    setLoading(true);
    try {
      let endpoint = '/packages/all';
      if (user?.role === 'Service_Provider') {
        endpoint = '/packages/my';
      }
      const res = await API.get(endpoint);
      setPackages(res.data.data?.packages || res.data.data || []);
    } catch (e) {
      setPackages([]);
    }
    setLoading(false);
  };

  const openEdit = (item) => {
    setEditItem({
      package_id: item.package_id,
      title: item.title || item.name || '',
      description: item.description || '',
      duration_days: String(item.duration_days || 1),
      price_per_person: String(item.price_per_person || item.price || 0),
      package_type: item.package_type || 'Leisure',
      inclusions: item.inclusions || '',
      image_url: item.image_url || '',
      is_active: item.is_active !== 0 ? '1' : '0',
    });
    setEditModal(true);
  };

  const openAdd = () => {
    setEditItem({
      package_id: null,
      title: '',
      description: '',
      duration_days: '1',
      price_per_person: '0',
      package_type: 'Leisure',
      inclusions: '',
      image_url: '',
      is_active: '1',
    });
    setEditModal(true);
  };

  const handlePickAndUpload = async () => {
    const asset = await pickImage();
    if (!asset) return;
    setUploading(true);
    try {
      const url = await uploadImage(asset);
      setField('image_url', url);
    } catch (e) {
      console.error("Upload Error:", e.response?.data || e.message);
      const serverMsg = e.response?.data?.message || e.message;
      Alert.alert('Upload Failed', serverMsg || 'Could not upload image');
    }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!editItem.title.trim()) return Alert.alert('Error', 'Title is required.');
    if (Number(editItem.price_per_person) < 0) return Alert.alert('Error', 'Price cannot be negative.');
    setSaving(true);
    try {
      const payload = {
        title: editItem.title,
        description: editItem.description,
        duration_days: Number(editItem.duration_days) || 1,
        price_per_person: Number(editItem.price_per_person) || 0,
        package_type: editItem.package_type,
        inclusions: editItem.inclusions,
        image_url: editItem.image_url,
        is_active: editItem.is_active === '1' ? 1 : 0,
      };

      if (editItem.package_id) {
        await API.put(`/packages/${editItem.package_id}`, payload);
        Alert.alert('✅ Saved', 'Package updated successfully.');
      } else {
        await API.post('/packages', payload);
        Alert.alert('✅ Created', 'New package added successfully.');
      }
      setEditModal(false);
      fetchAll();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Save failed.');
    }
    setSaving(false);
  };

  const handleDelete = (item) => {
    const message = `Delete "${item.title}"?`;
    if (Platform.OS === 'web') {
      if (window.confirm(message)) {
        (async () => {
          try {
            await API.delete(`/packages/${item.package_id}`);
            fetchAll();
          } catch (e) { Alert.alert('Error', e.response?.data?.message || 'Delete failed.'); }
        })();
      }
    } else {
      Alert.alert('Delete Package', message, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive', onPress: async () => {
            try {
              await API.delete(`/packages/${item.package_id}`);
              fetchAll();
            } catch (e) { Alert.alert('Error', e.response?.data?.message || 'Delete failed.'); }
          }
        },
      ]);
    }
  };

  const setField = (k, v) => setEditItem(p => ({ ...p, [k]: v }));

  const filtered = packages.filter(p =>
    (p.title || p.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
            <Text style={styles.addBtnText}>+ Add New</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerTitle}>🧳 Manage Packages</Text>
        <Text style={styles.headerSub}>{filtered.length} tour packages</Text>
      </View>

      <TextInput
        style={styles.search}
        placeholder="🔍 Search packages..."
        value={search}
        onChangeText={setSearch}
        placeholderTextColor="#AAA"
      />

      {loading ? <ActivityIndicator size="large" color="#0D5F8A" style={{ marginTop: 40 }} /> : (
        <FlatList
          data={filtered}
          keyExtractor={i => String(i.package_id)}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 30 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              {item.image_url ? (
                <Image
                  source={{ uri: resolveImageUrl(item.image_url) }}
                  style={styles.cardImage}
                />
              ) : null}
              <View style={styles.cardRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardName} numberOfLines={2}>{item.title || item.name || 'Unnamed Package'}</Text>
                  <Text style={styles.cardSub}>⏱ {item.duration_days} days  •  {item.package_type}</Text>
                  <Text style={styles.cardPrice}>LKR {Number(item.price_per_person || item.price || 0).toLocaleString()} / person</Text>
                </View>
                <View style={[styles.activeBadge, { backgroundColor: item.is_active ? '#EAFAF1' : '#FDEDEC' }]}>
                  <Text style={{ color: item.is_active ? '#27AE60' : '#E74C3C', fontWeight: '700', fontSize: 11 }}>
                    {item.is_active ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(item)}>
                  <Text style={styles.editBtnText}>✏️ Edit & Price</Text>
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
                {editItem?.package_id ? '✏️ Edit Package' : '✨ Add New Package'}
              </Text>

              {[
                { label: 'Title *', key: 'title', kb: 'default' },
                { label: 'Price per Person (LKR)', key: 'price_per_person', kb: 'numeric' },
                { label: 'Duration (days)', key: 'duration_days', kb: 'numeric' },
                { label: 'Image URL', key: 'image_url', kb: 'default' },
                { label: 'Description', key: 'description', kb: 'default' },
                { label: 'Inclusions', key: 'inclusions', kb: 'default' },
              ].map(f => (
                <View key={f.key}>
                  {f.key === 'image_url' && editItem?.image_url ? (
                    <Image
                      source={{ uri: resolveImageUrl(editItem.image_url) }}
                      style={styles.modalImagePreview}
                    />
                  ) : null}
                  <Text style={styles.fieldLabel}>{f.label}</Text>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TextInput
                      style={[styles.fieldInput, { flex: 1 },
                      (f.key === 'description' || f.key === 'inclusions') && { height: 70, textAlignVertical: 'top' }
                      ]}
                      value={editItem?.[f.key]}
                      onChangeText={v => setField(f.key, v)}
                      keyboardType={f.kb}
                      multiline={f.key === 'description' || f.key === 'inclusions'}
                    />
                    {f.key === 'image_url' && (
                      <TouchableOpacity
                        style={[styles.pickBtn, uploading && { opacity: 0.5 }]}
                        onPress={handlePickAndUpload}
                        disabled={uploading}
                      >
                        {uploading ? <ActivityIndicator color="#fff" /> : <Text style={styles.pickBtnText}>🖼️ Pick</Text>}
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}

              <Text style={styles.fieldLabel}>Package Type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                {TYPE_OPTIONS.map(t => (
                  <TouchableOpacity key={t}
                    style={[styles.chip, editItem?.package_type === t && styles.chipActive]}
                    onPress={() => setField('package_type', t)}>
                    <Text style={[styles.chipText, editItem?.package_type === t && { color: '#fff' }]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.fieldLabel}>Status</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                {[['1', 'Active ✅'], ['0', 'Inactive ⛔']].map(([val, lbl]) => (
                  <TouchableOpacity key={val}
                    style={[styles.chip, { flex: 1, alignItems: 'center' }, editItem?.is_active === val && styles.chipActive]}
                    onPress={() => setField('is_active', val)}>
                    <Text style={[styles.chipText, editItem?.is_active === val && { color: '#fff' }]}>{lbl}</Text>
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
  backBtn: { marginBottom: 0 },
  backText: { color: '#87CEEB', fontSize: 14, fontWeight: '600' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  headerSub: { fontSize: 12, color: '#87CEEB' },
  search: { margin: 16, backgroundColor: '#fff', borderRadius: 12, padding: 13, fontSize: 14, borderWidth: 1, borderColor: '#E0E0E0' },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 12, elevation: 2, overflow: 'hidden' },
  cardImage: { width: '100%', height: 120, borderRadius: 10, marginBottom: 10, backgroundColor: '#EEE' },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  cardName: { fontSize: 15, fontWeight: 'bold', color: '#1A3A4A', marginBottom: 4 },
  cardSub: { fontSize: 12, color: '#777', marginBottom: 2 },
  cardPrice: { fontSize: 14, fontWeight: 'bold', color: '#27AE60', marginTop: 4 },
  activeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginLeft: 8, alignSelf: 'flex-start' },
  cardActions: { flexDirection: 'row', gap: 10 },
  editBtn: { flex: 1, backgroundColor: '#EDF4F8', borderRadius: 8, paddingVertical: 9, alignItems: 'center', borderWidth: 1, borderColor: '#0D5F8A' },
  editBtnText: { color: '#0D5F8A', fontWeight: '700', fontSize: 13 },
  deleteBtn: { flex: 1, backgroundColor: '#FDEDEC', borderRadius: 8, paddingVertical: 9, alignItems: 'center', borderWidth: 1, borderColor: '#E74C3C' },
  deleteBtnText: { color: '#E74C3C', fontWeight: '700', fontSize: 13 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '92%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A3A4A', marginBottom: 16 },
  modalImagePreview: { width: '100%', height: 150, borderRadius: 12, marginBottom: 15, backgroundColor: '#F0F0F0' },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6 },
  fieldInput: { backgroundColor: '#F5F7FA', borderRadius: 10, padding: 13, marginBottom: 14, borderWidth: 1, borderColor: '#E0E0E0', fontSize: 14 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: '#0D5F8A', marginRight: 8, backgroundColor: '#fff' },
  chipActive: { backgroundColor: '#0D5F8A' },
  chipText: { color: '#0D5F8A', fontSize: 12, fontWeight: '600' },
  pickBtn: { backgroundColor: '#0D5F8A', borderRadius: 10, paddingHorizontal: 15, height: 48, justifyContent: 'center', alignItems: 'center' },
  pickBtnText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 8, marginBottom: 20 },
  cancelBtn: { flex: 1, backgroundColor: '#F5F7FA', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  cancelBtnText: { color: '#666', fontWeight: '600' },
  saveBtn: { flex: 2, backgroundColor: '#0D5F8A', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
