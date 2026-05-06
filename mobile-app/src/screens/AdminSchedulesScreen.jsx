import React, { useState, useCallback, useContext } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, TextInput, Modal, ScrollView, Platform
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';

const STATUS_OPTIONS = ['Scheduled', 'In_Progress', 'Completed', 'Cancelled'];

export default function AdminSchedulesScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [editModal, setEditModal] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [editItem, setEditItem]   = useState(null);

  useFocusEffect(useCallback(() => { fetchAll(); }, []));

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await API.get('/transport/schedules');
      console.log('Schedules Response:', res.data);
      const schedList = res.data?.data?.schedules || res.data?.data || [];
      setSchedules(Array.isArray(schedList) ? schedList : []);
    } catch (e) {
      console.error('Error fetching schedules:', e.response?.data || e.message);
      Alert.alert('Error', e.response?.data?.message || 'Failed to load schedules');
    }
    setLoading(false);
  };

  const openEdit = (item) => {
    setEditItem({
      schedule_id: item.schedule_id,
      title:       item.title || '',
      status:      item.status || 'Scheduled',
      departure_location: item.departure_location || '',
      arrival_location:   item.arrival_location || '',
    });
    setEditModal(true);
  };

  const openAdd = () => {
    setEditItem({
      schedule_id: null,
      title:       '',
      status:      'Scheduled',
      departure_location: '',
      arrival_location:   '',
    });
    setEditModal(true);
  };

  const handleSave = async () => {
    if (!editItem.title.trim()) return Alert.alert('Error', 'Title is required.');
    setSaving(true);
    try {
      const payload = {
        title:  editItem.title,
        status: editItem.status,
        departure_location: editItem.departure_location,
        arrival_location:   editItem.arrival_location,
        departure_time:     new Date().toISOString(), // Default
        arrival_time:       new Date(Date.now() + 86400000).toISOString(),
      };

      if (editItem.schedule_id) {
        await API.put(`/transport/schedules/${editItem.schedule_id}`, payload);
        Alert.alert('✅ Saved', 'Schedule updated.');
      } else {
        // Find a default vehicle if none
        const vRes = await API.get('/transport/vehicles?available=true');
        const vId = vRes.data.data?.vehicles?.[0]?.vehicle_id;
        if (!vId) return Alert.alert('Error', 'No available vehicles to assign.');
        
        await API.post('/transport/schedules', { ...payload, vehicle_id: vId });
        Alert.alert('✅ Created', 'New schedule added.');
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
            await API.delete(`/transport/schedules/${item.schedule_id}`);
            fetchAll();
          } catch (e) { Alert.alert('Error', e.response?.data?.message || 'Delete failed.'); }
        })();
      }
    } else {
      Alert.alert('Delete Schedule', message, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await API.delete(`/transport/schedules/${item.schedule_id}`);
            fetchAll();
          } catch (e) { Alert.alert('Error', e.response?.data?.message || 'Delete failed.'); }
        }},
      ]);
    }
  };

  const setField = (k, v) => setEditItem(p => ({ ...p, [k]: v }));

  const filtered = schedules.filter(s =>
    (s.title || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.departure_location || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          {user?.role !== 'Tourist' && (
            <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
              <Text style={styles.addBtnText}>+ Add Schedule</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.headerTitle}>📅 Manage Schedules</Text>
        <Text style={styles.headerSub}>{filtered.length} transport schedules</Text>
      </View>

      <TextInput
        style={styles.search}
        placeholder="🔍 Search schedules..."
        value={search}
        onChangeText={setSearch}
        placeholderTextColor="#AAA"
      />

      {loading ? <ActivityIndicator size="large" color="#0D5F8A" style={{ marginTop: 40 }} /> : (
        <FlatList
          data={filtered}
          keyExtractor={i => String(i.schedule_id)}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 30 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardName}>{item.title}</Text>
                  <Text style={styles.cardSub}>📍 {item.departure_location} → {item.arrival_location}</Text>
                  <Text style={styles.cardSub}>Departure: {item.departure_time?.split('T')[0]}</Text>
                </View>
                <View style={[styles.statusBadge, {
                  backgroundColor: item.status === 'Completed' ? '#EAFAF1' : item.status === 'Cancelled' ? '#FDEDEC' : '#FEF9E7'
                }]}>
                  <Text style={[styles.statusText, {
                    color: item.status === 'Completed' ? '#27AE60' : item.status === 'Cancelled' ? '#E74C3C' : '#E67E22'
                  }]}>{item.status}</Text>
                </View>
              </View>
              {user?.role !== 'Tourist' && (
                <View style={styles.cardActions}>
                  <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(item)}>
                    <Text style={styles.editBtnText}>✏️ Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
                    <Text style={styles.deleteBtnText}>🗑️ Delete</Text>
                  </TouchableOpacity>
                </View>
              )}
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
                {editItem?.schedule_id ? '✏️ Edit Schedule' : '✨ Add New Schedule'}
              </Text>

              <Text style={styles.fieldLabel}>Title *</Text>
              <TextInput
                style={styles.fieldInput}
                value={editItem?.title}
                onChangeText={v => setField('title', v)}
                placeholder="e.g. Colombo to Kandy Morning Tour"
              />

              <Text style={styles.fieldLabel}>Departure Location</Text>
              <TextInput
                style={styles.fieldInput}
                value={editItem?.departure_location}
                onChangeText={v => setField('departure_location', v)}
              />

              <Text style={styles.fieldLabel}>Arrival Location</Text>
              <TextInput
                style={styles.fieldInput}
                value={editItem?.arrival_location}
                onChangeText={v => setField('arrival_location', v)}
              />

            <Text style={styles.fieldLabel}>Status</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              {STATUS_OPTIONS.map(s => (
                <TouchableOpacity key={s}
                  style={[styles.chip, editItem?.status === s && styles.chipActive]}
                  onPress={() => setField('status', s)}>
                  <Text style={[styles.chipText, editItem?.status === s && { color: '#fff' }]}>{s}</Text>
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
  search:      { margin: 16, backgroundColor: '#fff', borderRadius: 12, padding: 13, fontSize: 14, borderWidth: 1, borderColor: '#E0E0E0' },
  card:        { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 12, elevation: 2 },
  cardRow:     { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  cardName:    { fontSize: 15, fontWeight: 'bold', color: '#1A3A4A', marginBottom: 4 },
  cardSub:     { fontSize: 12, color: '#777', marginBottom: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginLeft: 8 },
  statusText:  { fontSize: 11, fontWeight: '700' },
  cardActions: { flexDirection: 'row', gap: 10 },
  editBtn:     { flex: 1, backgroundColor: '#EDF4F8', borderRadius: 8, paddingVertical: 9, alignItems: 'center', borderWidth: 1, borderColor: '#0D5F8A' },
  editBtnText: { color: '#0D5F8A', fontWeight: '700', fontSize: 13 },
  deleteBtn:     { flex: 1, backgroundColor: '#FDEDEC', borderRadius: 8, paddingVertical: 9, alignItems: 'center', borderWidth: 1, borderColor: '#E74C3C' },
  deleteBtnText: { color: '#E74C3C', fontWeight: '700', fontSize: 13 },
  modalOverlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent:  { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '90%' },
  modalTitle:    { fontSize: 18, fontWeight: 'bold', color: '#1A3A4A', marginBottom: 16 },
  fieldLabel:    { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6 },
  fieldInput:    { backgroundColor: '#F5F7FA', borderRadius: 10, padding: 13, marginBottom: 14, borderWidth: 1, borderColor: '#E0E0E0', fontSize: 14 },
  chip:          { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: '#0D5F8A', marginRight: 8, backgroundColor: '#fff' },
  chipActive:    { backgroundColor: '#0D5F8A' },
  chipText:      { color: '#0D5F8A', fontSize: 12, fontWeight: '600' },
  modalBtns:     { flexDirection: 'row', gap: 12, marginTop: 14, marginBottom: 20 },
  cancelBtn:     { flex: 1, backgroundColor: '#F5F7FA', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  cancelBtnText: { color: '#666', fontWeight: '600' },
  saveBtn:       { flex: 2, backgroundColor: '#0D5F8A', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  saveBtnText:   { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
