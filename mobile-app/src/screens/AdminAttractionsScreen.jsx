import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, TextInput, Modal, ScrollView, Platform
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import API from '../services/api';
import { pickImage, uploadImage } from '../services/upload.service';

const STATUS_OPTIONS = ['Open', 'Closed', 'Seasonal', 'Under_Maintenance'];
const CAT_OPTIONS    = ['Beach','Mountain','Historical','Cultural','Wildlife','Adventure','Urban','Religious'];

export default function AdminAttractionsScreen({ navigation }) {
  const [attractions, setAttractions] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [editModal, setEditModal]     = useState(false);
  const [saving, setSaving]           = useState(false);
  const [editItem, setEditItem]       = useState(null);
  const [uploading, setUploading]     = useState(false);

  const handlePickAndUpload = async () => {
    const asset = await pickImage();
    if (!asset) return;

    setUploading(true);
    try {
      const url = await uploadImage(asset);
      setField('image_url', url);
      Alert.alert('Success', 'Image uploaded successfully!');
    } catch (e) {
      Alert.alert('Error', 'Failed to upload image');
    }
    setUploading(false);
  };

  useFocusEffect(useCallback(() => { fetchAll(); }, []));

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await API.get('/attractions');
      console.log('Attractions Response:', res.data);
      const attrList = res.data?.data?.attractions || res.data?.data || [];
      setAttractions(Array.isArray(attrList) ? attrList : []);
    } catch (e) {
      console.error('Error fetching attractions:', e.response?.data || e.message);
      Alert.alert('Error', e.response?.data?.message || 'Failed to load attractions');
    }
    setLoading(false);
  };

  const openEdit = (item) => {
    setEditItem({
      attraction_id:      item.attraction_id,
      name:               item.name || '',
      city:               item.city || '',
      category:           item.category || 'Beach',
      entrance_fee:       String(item.entrance_fee || 0),
      operational_status: item.operational_status || 'Open',
      description:        item.description || '',
      image_url:          item.image_url || '',
    });
    setEditModal(true);
  };

  const openAdd = () => {
    setEditItem({
      attraction_id:      null, // Indicator for new item
      name:               '',
      city:               '',
      category:           'Beach',
      entrance_fee:       '0',
      operational_status: 'Open',
      description:        '',
      image_url:          '',
    });
    setEditModal(true);
  };

  const handleSave = async () => {
    if (!editItem.name.trim()) return Alert.alert('Error', 'Name is required.');
    setSaving(true);
    try {
      const payload = {
        name:               editItem.name,
        city:               editItem.city,
        category:           editItem.category,
        entrance_fee:       Number(editItem.entrance_fee) || 0,
        operational_status: editItem.operational_status,
        description:        editItem.description,
        image_url:          editItem.image_url,
      };

      if (editItem.attraction_id) {
        await API.put(`/attractions/${editItem.attraction_id}`, payload);
        Alert.alert('✅ Saved', 'Attraction updated successfully.');
      } else {
        await API.post('/attractions', payload);
        Alert.alert('✅ Created', 'New attraction added successfully.');
      }
      setEditModal(false);
      fetchAll();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Save failed.');
    }
    setSaving(false);
  };

  const handleDelete = (item) => {
    const message = `Delete "${item.name}"?`;
    if (Platform.OS === 'web') {
      if (window.confirm(message)) {
        (async () => {
          try {
            await API.delete(`/attractions/${item.attraction_id}`);
            fetchAll();
          } catch (e) { Alert.alert('Error', e.response?.data?.message || 'Delete failed.'); }
        })();
      }
    } else {
      Alert.alert('Delete Attraction', message, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await API.delete(`/attractions/${item.attraction_id}`);
            fetchAll();
          } catch (e) { Alert.alert('Error', e.response?.data?.message || 'Delete failed.'); }
        }},
      ]);
    }
  };

  const filtered = attractions.filter(a =>
    (a.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (a.city || '').toLowerCase().includes(search.toLowerCase())
  );

  const setField = (k, v) => setEditItem(p => ({ ...p, [k]: v }));

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
        <Text style={styles.headerTitle}>🏝️ Manage Attractions</Text>
        <Text style={styles.headerSub}>{filtered.length} attractions in Sri Lanka</Text>
      </View>

      <TextInput
        style={styles.search}
        placeholder="🔍 Search attractions..."
        value={search}
        onChangeText={setSearch}
        placeholderTextColor="#AAA"
      />

      {loading ? <ActivityIndicator size="large" color="#0D5F8A" style={{ marginTop: 40 }} /> : (
        <FlatList
          data={filtered}
          keyExtractor={i => String(i.attraction_id)}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 30 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardName}>{item.name}</Text>
                  <Text style={styles.cardSub}>📍 {item.city}  •  {item.category}</Text>
                  <Text style={styles.cardSub}>💰 LKR {item.entrance_fee || 0} entry fee</Text>
                </View>
                <View style={[styles.statusBadge, {
                  backgroundColor: item.operational_status === 'Open' ? '#EAFAF1' : '#FEF9E7'
                }]}>
                  <Text style={[styles.statusText, {
                    color: item.operational_status === 'Open' ? '#27AE60' : '#E67E22'
                  }]}>{item.operational_status}</Text>
                </View>
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(item)}>
                  <Text style={styles.editBtnText}>✏️ Edit</Text>
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
                {editItem?.attraction_id ? '✏️ Edit Attraction' : '✨ Add New Attraction'}
              </Text>

              {[
                { label: 'Name *',       key: 'name',        kb: 'default' },
                { label: 'City',         key: 'city',        kb: 'default' },
                { label: 'Entry Fee (LKR)', key: 'entrance_fee', kb: 'numeric' },
                { label: 'Image URL',    key: 'image_url',   kb: 'default' },
                { label: 'Description',  key: 'description', kb: 'default' },
              ].map(f => (
                <View key={f.key}>
                  <Text style={styles.fieldLabel}>{f.label}</Text>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TextInput
                      style={[styles.fieldInput, { flex: 1 }, f.key === 'description' && { height: 80, textAlignVertical: 'top' }]}
                      value={editItem?.[f.key]}
                      onChangeText={v => setField(f.key, v)}
                      keyboardType={f.kb}
                      multiline={f.key === 'description'}
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

              <Text style={styles.fieldLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                {CAT_OPTIONS.map(c => (
                  <TouchableOpacity key={c} style={[styles.chip, editItem?.category === c && styles.chipActive]}
                    onPress={() => setField('category', c)}>
                    <Text style={[styles.chipText, editItem?.category === c && { color: '#fff' }]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.fieldLabel}>Status</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                {STATUS_OPTIONS.map(s => (
                  <TouchableOpacity key={s} style={[styles.chip, editItem?.operational_status === s && styles.chipActive]}
                    onPress={() => setField('operational_status', s)}>
                    <Text style={[styles.chipText, editItem?.operational_status === s && { color: '#fff' }]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

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
  search: { margin: 16, backgroundColor: '#fff', borderRadius: 12, padding: 13, fontSize: 14, borderWidth: 1, borderColor: '#E0E0E0' },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 12, elevation: 2 },
  cardRow:  { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  cardName: { fontSize: 15, fontWeight: 'bold', color: '#1A3A4A', marginBottom: 4 },
  cardSub:  { fontSize: 12, color: '#777', marginBottom: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginLeft: 8 },
  statusText:  { fontSize: 11, fontWeight: '700' },
  cardActions: { flexDirection: 'row', gap: 10 },
  editBtn:   { flex: 1, backgroundColor: '#EDF4F8', borderRadius: 8, paddingVertical: 9, alignItems: 'center', borderWidth: 1, borderColor: '#0D5F8A' },
  editBtnText:   { color: '#0D5F8A', fontWeight: '700', fontSize: 13 },
  deleteBtn:     { flex: 1, backgroundColor: '#FDEDEC', borderRadius: 8, paddingVertical: 9, alignItems: 'center', borderWidth: 1, borderColor: '#E74C3C' },
  deleteBtnText: { color: '#E74C3C', fontWeight: '700', fontSize: 13 },
  modalOverlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent:  { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '90%' },
  modalTitle:    { fontSize: 18, fontWeight: 'bold', color: '#1A3A4A', marginBottom: 16 },
  fieldLabel:    { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6 },
  fieldInput:    { backgroundColor: '#F5F7FA', borderRadius: 10, padding: 13, marginBottom: 14, borderWidth: 1, borderColor: '#E0E0E0', fontSize: 14 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: '#0D5F8A', marginRight: 8, backgroundColor: '#fff' },
  chipActive: { backgroundColor: '#0D5F8A' },
  chipText:   { color: '#0D5F8A', fontSize: 12, fontWeight: '600' },
  modalBtns:  { flexDirection: 'row', gap: 12, marginTop: 8, marginBottom: 20 },
  cancelBtn:  { flex: 1, backgroundColor: '#F5F7FA', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  cancelBtnText: { color: '#666', fontWeight: '600' },
  saveBtn:       { flex: 2, backgroundColor: '#0D5F8A', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  saveBtnText:   { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  pickBtn:       { backgroundColor: '#0D5F8A', borderRadius: 10, height: 50, paddingHorizontal: 15, justifyContent: 'center', alignItems: 'center' },
  pickBtnText:   { color: '#fff', fontWeight: 'bold', fontSize: 12 },
});
