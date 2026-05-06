import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, Modal, ScrollView, TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import API from '../services/api';

const STATUS_OPTIONS = ['Pending', 'Confirmed', 'Completed', 'Cancelled', 'Refunded'];

export default function AdminBookingsScreen({ navigation }) {
  const [bookings, setBookings]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [editModal, setEditModal] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [editItem, setEditItem]   = useState(null);

  useFocusEffect(useCallback(() => { fetchAll(); }, []));

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await API.get('/bookings');
      console.log('Bookings Response:', res.data);
      const bookList = res.data?.data?.bookings || res.data?.data || [];
      setBookings(Array.isArray(bookList) ? bookList : []);
    } catch (e) {
      console.error('Error fetching bookings:', e.response?.data || e.message);
      Alert.alert('Error', e.response?.data?.message || 'Failed to load bookings');
    }
    setLoading(false);
  };

  const openEdit = (item) => {
    setEditItem({
      booking_id:     item.booking_id,
      booking_status: item.booking_status,
      user_name:      item.username || `User #${item.user_id}`,
      item_name:      item.package_title || item.attraction_name || 'Booking',
      final_amount:   item.final_amount || item.base_amount || 0,
    });
    setEditModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await API.patch(`/bookings/${editItem.booking_id}/status`, {
        booking_status: editItem.booking_status,
      });
      Alert.alert('✅ Saved', 'Booking status updated.');
      setEditModal(false);
      fetchAll();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Update failed.');
    }
    setSaving(false);
  };

  const filtered = bookings.filter(b =>
    String(b.booking_id).includes(search) ||
    (b.username || '').toLowerCase().includes(search.toLowerCase()) ||
    (b.package_title || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🗂️ Manage Bookings</Text>
        <Text style={styles.headerSub}>{filtered.length} bookings found</Text>
      </View>

      <TextInput
        style={styles.search}
        placeholder="🔍 Search by ID or Username..."
        value={search}
        onChangeText={setSearch}
        placeholderTextColor="#AAA"
      />

      {loading ? <ActivityIndicator size="large" color="#0D5F8A" style={{ marginTop: 40 }} /> : (
        <FlatList
          data={filtered}
          keyExtractor={i => String(i.booking_id)}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 30 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardName}>Booking #{item.booking_id}</Text>
                  <Text style={styles.cardSub}>👤 {item.username || `User ${item.user_id}`}</Text>
                  <Text style={styles.cardSub}>🧳 {item.package_title || item.attraction_name || 'Item'}</Text>
                  <Text style={styles.cardPrice}>LKR {Number(item.final_amount || item.base_amount || 0).toLocaleString()}</Text>
                </View>
                <View style={[styles.statusBadge, {
                  backgroundColor: item.booking_status === 'Confirmed' ? '#EAFAF1' :
                                   item.booking_status === 'Pending'   ? '#FEF9E7' :
                                   item.booking_status === 'Cancelled' ? '#FDEDEC' : '#F5F5F5'
                }]}>
                  <Text style={[styles.statusText, {
                    color: item.booking_status === 'Confirmed' ? '#27AE60' :
                           item.booking_status === 'Pending'   ? '#E67E22' :
                           item.booking_status === 'Cancelled' ? '#E74C3C' : '#333'
                  }]}>{item.booking_status}</Text>
                </View>
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(item)}>
                  <Text style={styles.editBtnText}>✏️ Change Status</Text>
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
            <Text style={styles.modalTitle}>✏️ Edit Booking Status</Text>
            
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>ID: #{editItem?.booking_id}</Text>
              <Text style={styles.infoText}>User: {editItem?.user_name}</Text>
              <Text style={styles.infoText}>Item: {editItem?.item_name}</Text>
              <Text style={styles.infoText}>Total: LKR {Number(editItem?.final_amount).toLocaleString()}</Text>
            </View>

            <Text style={styles.fieldLabel}>New Status</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              {STATUS_OPTIONS.map(s => (
                <TouchableOpacity key={s}
                  style={[styles.chip, editItem?.booking_status === s && styles.chipActive]}
                  onPress={() => setEditItem({ ...editItem, booking_status: s })}>
                  <Text style={[styles.chipText, editItem?.booking_status === s && { color: '#fff' }]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Status</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { backgroundColor: '#1A3A4A', paddingTop: 55, paddingBottom: 20, paddingHorizontal: 20 },
  backBtn:     { marginBottom: 10 },
  backText:    { color: '#87CEEB', fontSize: 14, fontWeight: '600' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  headerSub:   { fontSize: 12, color: '#87CEEB' },
  search:      { margin: 16, backgroundColor: '#fff', borderRadius: 12, padding: 13, fontSize: 14, borderWidth: 1, borderColor: '#E0E0E0' },
  card:        { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 12, elevation: 2 },
  cardRow:     { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  cardName:    { fontSize: 16, fontWeight: 'bold', color: '#1A3A4A', marginBottom: 4 },
  cardSub:     { fontSize: 13, color: '#777', marginBottom: 2 },
  cardPrice:   { fontSize: 14, fontWeight: 'bold', color: '#0D5F8A', marginTop: 4 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginLeft: 8 },
  statusText:  { fontSize: 11, fontWeight: '700' },
  cardActions: { flexDirection: 'row', gap: 10 },
  editBtn:     { flex: 1, backgroundColor: '#EDF4F8', borderRadius: 8, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: '#0D5F8A' },
  editBtnText: { color: '#0D5F8A', fontWeight: '700', fontSize: 13 },
  modalOverlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent:  { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  modalTitle:    { fontSize: 18, fontWeight: 'bold', color: '#1A3A4A', marginBottom: 16 },
  infoBox:       { backgroundColor: '#F5F7FA', padding: 14, borderRadius: 12, marginBottom: 16 },
  infoText:      { fontSize: 13, color: '#333', marginBottom: 4, fontWeight: '500' },
  fieldLabel:    { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6 },
  chip:          { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: '#0D5F8A', marginRight: 8, backgroundColor: '#fff' },
  chipActive:    { backgroundColor: '#0D5F8A' },
  chipText:      { color: '#0D5F8A', fontSize: 12, fontWeight: '600' },
  modalBtns:     { flexDirection: 'row', gap: 12, marginTop: 14, marginBottom: 20 },
  cancelBtn:     { flex: 1, backgroundColor: '#F5F7FA', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  cancelBtnText: { color: '#666', fontWeight: '600' },
  saveBtn:       { flex: 2, backgroundColor: '#0D5F8A', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  saveBtnText:   { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
