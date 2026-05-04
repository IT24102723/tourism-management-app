import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Modal } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import API from '../services/api';

export default function AdminPaymentsScreen({ navigation }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit Modal State - Status Only
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [editStatus, setEditStatus] = useState('');

  useFocusEffect(
    useCallback(() => {
      fetchPayments();
    }, [])
  );

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await API.get('/payments');
      setPayments(res.data?.data?.payments || []);
    } catch (e) {
      console.error('Error fetching payments:', e.message);
      Alert.alert('Error', 'Failed to fetch payments.');
    }
    setLoading(false);
  };

  const handleRefund = (id) => {
    Alert.alert('Refund Payment', 'Are you sure you want to refund this payment?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Refund', style: 'destructive', onPress: async () => {
        try {
          await API.post(`/payments/${id}/refund`);
          Alert.alert('Success', 'Payment refunded successfully.');
          fetchPayments();
        } catch (e) {
          Alert.alert('Error', e.response?.data?.message || 'Failed to refund payment.');
        }
      }}
    ]);
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Payment', 'Are you sure you want to completely delete this payment record?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await API.delete(`/payments/${id}`);
          Alert.alert('Deleted', 'Payment record has been deleted.');
          fetchPayments();
        } catch (e) {
          Alert.alert('Error', e.response?.data?.message || 'Failed to delete payment.');
        }
      }}
    ]);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setEditStatus(item.payment_status);
    setEditModalVisible(true);
  };

  const handleUpdate = async () => {
    try {
      await API.put(`/payments/${editItem.payment_id}`, {
        payment_status: editStatus
      });
      Alert.alert('Success', 'Payment status updated successfully.');
      setEditModalVisible(false);
      fetchPayments();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to update payment status.');
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Completed': return '#2ECC71';
      case 'Pending': return '#F39C12';
      case 'Refunded': return '#9B59B6';
      case 'Failed': return '#E74C3C';
      case 'Cancelled': return '#7F8C8D';
      default: return '#333';
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.txRef}>{item.transaction_ref || `ID: ${item.payment_id}`}</Text>
        <View style={[styles.badge, { backgroundColor: getStatusColor(item.payment_status) }]}>
          <Text style={styles.badgeText}>{item.payment_status}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.detail}>👤 User: {item.username || `ID ${item.user_id}`}</Text>
        <Text style={styles.detail}>🎟️ Booking ID: {item.booking_id}</Text>
        <Text style={styles.detail}>💳 Method: {item.payment_method?.replace('_', ' ')}</Text>
        <Text style={styles.amount}>Rs. {item.amount.toLocaleString()}</Text>
        <Text style={styles.date}>{new Date(item.created_at).toLocaleString()}</Text>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => openEdit(item)}>
          <Text style={styles.editBtnText}>✏️ Update Status</Text>
        </TouchableOpacity>
        
        {item.payment_status === 'Completed' && (
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleRefund(item.payment_id)}>
            <Text style={styles.refundBtnText}>↩️ Refund</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item.payment_id)}>
          <Text style={styles.delBtnText}>🗑️ Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const statusOptions = ['Pending', 'Completed', 'Refunded', 'Failed', 'Cancelled'];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Manage Payments</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2E86AB" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={payments}
          keyExtractor={(item) => String(item.payment_id)}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          ListEmptyComponent={<Text style={styles.empty}>No payments found.</Text>}
        />
      )}

      {/* Status Update Modal */}
      <Modal visible={editModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Payment Status</Text>
            <Text style={styles.modalSubtitle}>Payment ID: {editItem?.payment_id}</Text>
            
            <Text style={styles.label}>New Status</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={editStatus}
                onValueChange={setEditStatus}
                style={styles.picker}
                itemStyle={styles.pickerItem}
              >
                {statusOptions.map(status => (
                  <Picker.Item key={status} label={status} value={status} />
                ))}
              </Picker>
            </View>

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setEditModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={handleUpdate} disabled={!editStatus}>
                <Text style={styles.modalSaveText}>Update Status</Text>
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
  backBtn: { marginBottom: 10 },
  backText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#EEE', paddingBottom: 10 },
  txRef: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  
  cardBody: { marginBottom: 12 },
  detail: { fontSize: 13, color: '#555', marginBottom: 4 },
  amount: { fontSize: 18, fontWeight: 'bold', color: '#2E86AB', marginTop: 8 },
  date: { fontSize: 11, color: '#999', marginTop: 5 },
  
  actionsRow: { flexDirection: 'row', justifyContent: 'flex-end', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  actionBtn: { marginLeft: 15 },
  editBtnText: { color: '#2980B9', fontSize: 13, fontWeight: 'bold' },
  refundBtnText: { color: '#9B59B6', fontSize: 13, fontWeight: 'bold' },
  delBtnText: { color: '#E74C3C', fontSize: 13, fontWeight: 'bold' },

  empty: { textAlign: 'center', color: '#999', marginTop: 50 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 20, maxHeight: '80%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  modalSubtitle: { fontSize: 14, color: '#666', marginBottom: 20 },
  label: { fontSize: 14, color: '#666', marginBottom: 10, fontWeight: '600' },
  
  pickerContainer: { backgroundColor: '#F8F9FA', borderRadius: 8, borderWidth: 1, borderColor: '#E0E0E0', marginBottom: 20 },
  picker: { height: 50, color: '#333' },
  pickerItem: { fontSize: 16, height: 44 },

  modalBtns: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  modalCancel: { paddingVertical: 12, paddingHorizontal: 20 },
  modalCancelText: { color: '#999', fontWeight: '600', fontSize: 16 },
  modalSave: { backgroundColor: '#1A3A4A', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8 },
  modalSaveText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});
