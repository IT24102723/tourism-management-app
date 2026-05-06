import React, { useState, useCallback, useContext } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, TextInput, Modal, ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';

const V_TYPES = ['Bus','Van','Car','Tuk_Tuk','Boat','Train'];

export default function AdminVehiclesScreen({ navigation, route }) {
  const { user } = useContext(AuthContext);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [editModal, setEditModal] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [editItem, setEditItem]   = useState(null);

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
      const res = await API.get('/transport/vehicles');
      console.log('Vehicles Response:', res.data);
      const data = res.data?.data || res.data || {};
      const vList = data.vehicles || data || [];
      setVehicles(Array.isArray(vList) ? vList : []);
    } catch (e) {
      console.error('Error fetching vehicles:', e.response?.data || e.message);
      Alert.alert('Error', e.response?.data?.message || 'Failed to load vehicles');
    }
    setLoading(false);
  };

  const openEdit = (item) => {
    setEditItem({
      vehicle_id:          item.vehicle_id,
      vehicle_name:        item.vehicle_name || `${item.vehicle_type} - ${item.registration_number || item.license_plate || ''}`,
      vehicle_type:        item.vehicle_type || 'Car',
      registration_number: item.registration_number || item.license_plate || '',
      capacity:            String(item.capacity || 4),
      price_per_day:       String(item.price_per_day || item.rental_price_per_day || 0),
      price_per_km:        String(item.price_per_km || 0),
      is_airconditioned:   item.is_airconditioned ? '1' : '0',
      is_available:        item.is_available ? '1' : '0',
    });
    setEditModal(true);
  };

  const openAdd = () => {
    setEditItem({
      vehicle_id:          null,
      vehicle_name:        '',
      vehicle_type:        'Car',
      registration_number: '',
      capacity:            '4',
      price_per_day:       '0',
      price_per_km:        '0',
      is_airconditioned:   '0',
      is_available:        '1',
    });
    setEditModal(true);
  };

  const handleSave = async () => {
    if (!editItem.vehicle_name.trim()) return Alert.alert('Error', 'Name is required.');
    if (!editItem.registration_number.trim()) return Alert.alert('Error', 'Plate number is required.');
    setSaving(true);
    try {
      const payload = {
        vehicle_name:        editItem.vehicle_name,
        vehicle_type:        editItem.vehicle_type,
        registration_number: editItem.registration_number,
        capacity:            Number(editItem.capacity) || 4,
        price_per_day:       Number(editItem.price_per_day) || 0,
        price_per_km:        Number(editItem.price_per_km) || 0,
        is_airconditioned:   editItem.is_airconditioned === '1',
      };

      if (editItem.vehicle_id) {
        // Update existing vehicle
        await API.put(`/transport/vehicles/${editItem.vehicle_id}`, payload);
        // Update availability
        await API.patch(`/transport/vehicles/${editItem.vehicle_id}/availability`, {
          is_available: editItem.is_available === '1'
        });
        Alert.alert('✅ Updated', 'Vehicle updated successfully.');
      } else {
        // Create new vehicle
        const createRes = await API.post('/transport/vehicles', payload);
        console.log('Create Vehicle Response:', createRes.data);
        Alert.alert('✅ Created', 'New vehicle added successfully.');
      }
      setEditModal(false);
      fetchAll();
    } catch (e) {
      console.error('Error saving vehicle:', e.response?.data || e.message);
      Alert.alert('Error', e.response?.data?.message || 'Save failed.');
    }
    setSaving(false);
  };

  const handleDelete = (item) => {
    Alert.alert('Delete Vehicle', `Delete "${item.vehicle_name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          const res = await API.delete(`/transport/vehicles/${item.vehicle_id}`);
          console.log('Delete Response:', res.data);
          Alert.alert('✅ Deleted', 'Vehicle removed successfully.');
          fetchAll();
        } catch (e) {
          console.error('Error deleting vehicle:', e.response?.data || e.message);
          Alert.alert('Error', e.response?.data?.message || 'Delete failed.');
        }
      }},
    ]);
  };

  const setField = (k, v) => setEditItem(p => ({ ...p, [k]: v }));

  const filtered = vehicles.filter(v =>
    (v.vehicle_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (v.registration_number || v.license_plate || '').toLowerCase().includes(search.toLowerCase())
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
              <Text style={styles.addBtnText}>+ Add Vehicle</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.headerTitle}>🚗 Manage Vehicles</Text>
        <Text style={styles.headerSub}>{filtered.length} vehicles registered</Text>
      </View>

      <TextInput
        style={styles.search}
        placeholder="🔍 Search vehicles..."
        value={search}
        onChangeText={setSearch}
        placeholderTextColor="#AAA"
      />

      {loading ? <ActivityIndicator size="large" color="#0D5F8A" style={{ marginTop: 40 }} /> : (
        <FlatList
          data={filtered}
          keyExtractor={i => String(i.vehicle_id)}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 30 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardName}>{item.vehicle_name || `${item.vehicle_type} - ${item.registration_number || item.license_plate}`}</Text>
                  <Text style={styles.cardSub}>{item.vehicle_type}  •  🪪 {item.registration_number || item.license_plate || 'N/A'}</Text>
                  <Text style={styles.cardPrice}>LKR {Number(item.rental_price_per_day || item.price_per_day || 0).toLocaleString()} / day</Text>
                </View>
                <View style={[styles.activeBadge, { backgroundColor: item.is_available ? '#EAFAF1' : '#FEF9E7' }]}>
                  <Text style={{ color: item.is_available ? '#27AE60' : '#E67E22', fontWeight: '700', fontSize: 11 }}>
                    {item.is_available ? 'Available' : 'Booked'}
                  </Text>
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
                {editItem?.vehicle_id ? '✏️ Edit Vehicle' : '✨ Add New Vehicle'}
              </Text>

              {[
                { label: 'Name *',           key: 'vehicle_name',        kb: 'default' },
                { label: 'Plate Number *',   key: 'registration_number', kb: 'default' },
                { label: 'Capacity (seats)', key: 'capacity',            kb: 'numeric' },
                { label: 'Price/Day (LKR)',  key: 'price_per_day',       kb: 'numeric' },
                { label: 'Price/KM (LKR)',   key: 'price_per_km',        kb: 'decimal-pad' },
              ].map(f => (
                <View key={f.key}>
                  <Text style={styles.fieldLabel}>{f.label}</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={editItem?.[f.key]}
                    onChangeText={v => setField(f.key, v)}
                    keyboardType={f.kb}
                  />
                </View>
              ))}

              <Text style={styles.fieldLabel}>Type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                {V_TYPES.map(t => (
                  <TouchableOpacity key={t}
                    style={[styles.chip, editItem?.vehicle_type === t && styles.chipActive]}
                    onPress={() => setField('vehicle_type', t)}>
                    <Text style={[styles.chipText, editItem?.vehicle_type === t && { color: '#fff' }]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.fieldLabel}>Air Conditioning</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                {[['0', 'No'], ['1', 'Yes ❄️']].map(([val, lbl]) => (
                  <TouchableOpacity key={val}
                    style={[styles.chip, { flex: 1, alignItems: 'center' }, editItem?.is_airconditioned === val && styles.chipActive]}
                    onPress={() => setField('is_airconditioned', val)}>
                    <Text style={[styles.chipText, editItem?.is_airconditioned === val && { color: '#fff' }]}>{lbl}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Availability</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                {[['1', 'Available ✅'], ['0', 'Booked 🚫']].map(([val, lbl]) => (
                  <TouchableOpacity key={val}
                    style={[styles.chip, { flex: 1, alignItems: 'center' }, editItem?.is_available === val && styles.chipActive]}
                    onPress={() => setField('is_available', val)}>
                    <Text style={[styles.chipText, editItem?.is_available === val && { color: '#fff' }]}>{lbl}</Text>
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
  card:        { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 12, elevation: 2 },
  cardRow:     { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  cardName:    { fontSize: 15, fontWeight: 'bold', color: '#1A3A4A', marginBottom: 4 },
  cardSub:     { fontSize: 12, color: '#777', marginBottom: 2 },
  cardPrice:   { fontSize: 14, fontWeight: 'bold', color: '#27AE60', marginTop: 4 },
  activeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginLeft: 8 },
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
  modalBtns:     { flexDirection: 'row', gap: 12, marginTop: 8, marginBottom: 20 },
  cancelBtn:     { flex: 1, backgroundColor: '#F5F7FA', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  cancelBtnText: { color: '#666', fontWeight: '600' },
  saveBtn:       { flex: 2, backgroundColor: '#0D5F8A', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  saveBtnText:   { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
