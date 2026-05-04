import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import API from '../services/api';

export default function MyFeedbackScreen({ navigation }) {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [editRating, setEditRating] = useState('5');
  const [editComment, setEditComment] = useState('');

  useFocusEffect(
    useCallback(() => {
      fetchMyFeedback();
    }, [])
  );

  const fetchMyFeedback = async () => {
    setLoading(true);
    try {
      const meRes = await API.get('/auth/me');
      const myId = meRes.data.data.user_id;
      
      const res = await API.get(`/feedback?user_id=${myId}&limit=100`);
      const myReviews = res.data?.data?.feedback || [];
      setFeedback(myReviews);
    } catch (e) {
      console.error('Error fetching my feedback:', e.message);
    }
    setLoading(false);
  };

  const handleDelete = (id) => {
    if (!id) return Alert.alert('Error', 'Cannot delete this older review (Missing ID).');
    Alert.alert('Delete Review', 'Are you sure you want to delete this review?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await API.delete(`/feedback/${id}`);
          Alert.alert('Deleted', 'Review has been deleted.');
          fetchMyFeedback();
        } catch (e) {
          Alert.alert('Error', 'Failed to delete review.');
        }
      }}
    ]);
  };

  const openEdit = (item) => {
    if (!item.feedback_id) return Alert.alert('Error', 'Cannot edit this older review (Missing ID).');
    setEditItem(item);
    setEditRating(String(item.rating || 5));
    setEditComment(item.review_text || item.comment || '');
    setEditModalVisible(true);
  };

  const handleUpdate = async () => {
    const r = Number(editRating);
    if (isNaN(r) || r < 1 || r > 5) return Alert.alert('Error', 'Rating must be between 1 and 5.');
    if (!editComment.trim()) return Alert.alert('Error', 'Comment cannot be empty.');
    if (!editItem || !editItem.feedback_id) return;
    
    try {
      await API.put(`/feedback/${editItem.feedback_id}`, {
        rating: Number(editRating),
        review_text: editComment
      });
      Alert.alert('Success', 'Review updated successfully.');
      setEditModalVisible(false);
      fetchMyFeedback();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to update review.');
    }
  };

  const renderStars = (rating) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.targetType}>{item.target_type} Review</Text>
          <Text style={styles.targetName} numberOfLines={1}>{item.target_name || `ID: ${item.target_id}`}</Text>
        </View>
        <Text style={styles.rating}>{renderStars(item.rating || 0)}</Text>
      </View>
      <Text style={styles.reviewText}>{item.review_text || item.comment || 'No comment provided.'}</Text>
      <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>

      {item.admin_response && (
        <View style={styles.responseBox}>
          <Text style={styles.responseTitle}>💬 Response from Management</Text>
          <Text style={styles.responseText}>{item.admin_response}</Text>
          {item.response_date && (
            <Text style={styles.responseDate}>{new Date(item.response_date).toLocaleDateString()}</Text>
          )}
        </View>
      )}

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(item)}>
          <Text style={styles.editBtnText}>✏️ Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.delBtn} onPress={() => handleDelete(item.feedback_id)}>
          <Text style={styles.delBtnText}>🗑️ Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>My Reviews</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2E86AB" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={feedback}
          keyExtractor={(item, idx) => `my-fb-${item.feedback_id || idx}`}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          ListEmptyComponent={<Text style={styles.empty}>You haven't submitted any reviews yet.</Text>}
        />
      )}

      {/* Edit Modal */}
      <Modal visible={editModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Review</Text>
            
            <Text style={styles.label}>Rating (1-5)</Text>
            <TextInput 
              style={styles.input} 
              keyboardType="numeric" 
              value={editRating} 
              onChangeText={(v) => {
                const num = parseInt(v);
                if (v === '' || (num >= 1 && num <= 5)) {
                  setEditRating(v);
                }
              }} 
              maxLength={1}
              placeholder="1-5"
            />

            <Text style={styles.label}>Comment</Text>
            <TextInput 
              style={[styles.input, { height: 80 }]} 
              multiline 
              value={editComment} 
              onChangeText={setEditComment} 
            />

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setEditModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={handleUpdate}>
                <Text style={styles.modalSaveText}>Update</Text>
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
  header: { backgroundColor: '#2E86AB', paddingTop: 55, paddingBottom: 20, paddingHorizontal: 20 },
  backBtn: { marginBottom: 10 },
  backText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  targetType: { fontSize: 11, fontWeight: 'bold', color: '#999', textTransform: 'uppercase', marginBottom: 2 },
  targetName: { fontSize: 15, fontWeight: 'bold', color: '#1A3A4A', paddingRight: 10 },
  rating: { fontSize: 16, color: '#F39C12' },
  reviewText: { fontSize: 14, color: '#333', lineHeight: 20, marginBottom: 10 },
  date: { fontSize: 11, color: '#888' },
  
  actionsRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 15, borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingTop: 10 },
  editBtn: { marginRight: 15 },
  editBtnText: { color: '#2980B9', fontSize: 13, fontWeight: 'bold' },
  delBtn: {},
  delBtnText: { color: '#E74C3C', fontSize: 13, fontWeight: 'bold' },

  responseBox: { marginTop: 12, backgroundColor: '#E8F4FD', padding: 12, borderRadius: 8, borderLeftWidth: 3, borderLeftColor: '#2E86AB' },
  responseTitle: { fontSize: 12, fontWeight: 'bold', color: '#2E86AB', marginBottom: 6 },
  responseText: { fontSize: 13, color: '#444', lineHeight: 18 },
  responseDate: { fontSize: 10, color: '#888', marginTop: 6 },
  
  empty: { textAlign: 'center', color: '#999', marginTop: 50 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  label: { fontSize: 13, color: '#666', marginBottom: 5, fontWeight: 'bold' },
  input: { borderWidth: 1, borderColor: '#DDD', borderRadius: 8, padding: 12, marginBottom: 15, fontSize: 14 },
  modalBtns: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  modalCancel: { padding: 10, marginRight: 10 },
  modalCancelText: { color: '#999', fontWeight: 'bold' },
  modalSave: { backgroundColor: '#2E86AB', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  modalSaveText: { color: '#fff', fontWeight: 'bold' }
});
