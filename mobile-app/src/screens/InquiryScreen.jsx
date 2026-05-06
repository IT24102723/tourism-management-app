import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, Alert, Modal, ActivityIndicator, ScrollView } from 'react-native';
import API from '../services/api';

const CATEGORIES = ['General', 'Booking', 'Payment', 'Complaint', 'Other'];

export default function InquiryScreen({ navigation }) {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ subject: '', message: '', category: 'General' });
  const [submitting, setSubmitting] = useState(false);

  // Detail Modal States
  const [detailModal, setDetailModal] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [responses, setResponses] = useState([]);
  const [responseText, setResponseText] = useState('');
  const [submittingResponse, setSubmittingResponse] = useState(false);

  useEffect(() => { fetchInquiries(); }, []);

  const fetchInquiries = async () => {
    try {
      const res = await API.get('/inquiries');
      setInquiries(res.data.data?.inquiries || []);
    } catch (e) { console.log(e.response?.data); }
    setLoading(false);
  };

  const submit = async () => {
    if (!form.subject || !form.message) return Alert.alert('Error', 'Please fill all fields');
    setSubmitting(true);
    try {
      await API.post('/inquiries', form);
      Alert.alert('✅ Submitted', 'Your inquiry was sent successfully.');
      setModal(false);
      setForm({ subject: '', message: '', category: 'General' });
      fetchInquiries();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to submit');
    }
    setSubmitting(false);
  };

  const openDetail = async (inquiry) => {
    setSelectedInquiry(inquiry);
    setResponses([]);
    setResponseText('');
    setDetailModal(true);
    try {
      const res = await API.get(`/inquiries/${inquiry.inquiry_id}`);
      setResponses(res.data.data?.responses || []);
    } catch (e) {
      console.log(e);
    }
  };

  const submitResponse = async () => {
    if (!responseText.trim()) return Alert.alert('Error', 'Please enter a response');
    setSubmittingResponse(true);
    try {
      await API.post(`/inquiries/${selectedInquiry.inquiry_id}/respond`, { message: responseText });
      Alert.alert('✅ Success', 'Response added');
      setResponseText('');
      const res = await API.get(`/inquiries/${selectedInquiry.inquiry_id}`);
      setResponses(res.data.data?.responses || []);
      fetchInquiries();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to submit response');
    }
    setSubmittingResponse(false);
  };

  const statusColor = { Open: '#F39C12', Resolved: '#27AE60', Closed: '#95A5A6', 'In_Progress': '#2980B9', Responded: '#2980B9', Submitted: '#F39C12', Pending: '#E67E22' };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>💬 My Inquiries</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModal(true)}>
          <Text style={styles.addBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {loading ? <ActivityIndicator size="large" color="#2E86AB" style={{ marginTop: 40 }} /> : (
        <FlatList data={inquiries} keyExtractor={item => String(item.inquiry_id)}
          ListEmptyComponent={<Text style={styles.empty}>No inquiries yet. Tap + New to ask something.</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => openDetail(item)}>
              <View style={styles.row}>
                <Text style={styles.subject}>{item.subject}</Text>
                <Text style={[styles.status, { color: statusColor[item.status] || '#888' }]}>{item.status}</Text>
              </View>
              <Text style={styles.category}>{item.category} • {item.priority}</Text>
              <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
            </TouchableOpacity>
          )} />
      )}

      {/* New Inquiry Modal */}
      <Modal visible={modal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalBox}>
            <Text style={styles.modalTitle}>New Inquiry</Text>
            <Text style={styles.label}>Category</Text>
            <View style={styles.catRow}>
              {CATEGORIES.map(c => (
                <TouchableOpacity key={c} style={[styles.catBtn, form.category === c && styles.catActive]}
                  onPress={() => setForm(f => ({ ...f, category: c }))}>
                  <Text style={{ color: form.category === c ? '#fff' : '#2E86AB', fontSize: 11, fontWeight: '600' }}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.label}>Subject</Text>
            <TextInput style={styles.input} placeholder="Brief subject..."
              value={form.subject} onChangeText={v => setForm(f => ({ ...f, subject: v }))} />
            <Text style={styles.label}>Message</Text>
            <TextInput style={styles.textArea} placeholder="Describe your inquiry..."
              value={form.message} onChangeText={v => setForm(f => ({ ...f, message: v }))}
              multiline numberOfLines={4} textAlignVertical="top" />
            <TouchableOpacity style={styles.btn} onPress={submit} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Submit</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelModal} onPress={() => setModal(false)}>
              <Text style={{ color: '#888', textAlign: 'center' }}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Inquiry Detail & Chat Modal */}
      <Modal visible={detailModal} animationType="slide" transparent>
        <View style={styles.fullModalOverlay}>
          <View style={styles.detailHeader}>
            <TouchableOpacity onPress={() => setDetailModal(false)}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.detailTitle}>Inquiry #{selectedInquiry?.inquiry_id}</Text>
            <View style={{ width: 30 }} />
          </View>
          
          <ScrollView style={styles.detailBody} showsVerticalScrollIndicator={false}>
            {selectedInquiry && (
              <View style={styles.detailCard}>
                <View style={styles.row}>
                  <Text style={styles.detailSubject}>{selectedInquiry.subject}</Text>
                  <Text style={[styles.status, { color: statusColor[selectedInquiry.status] || '#888' }]}>{selectedInquiry.status}</Text>
                </View>
                <Text style={styles.detailCategory}>{selectedInquiry.category}</Text>
                <Text style={styles.detailMessage}>{selectedInquiry.message}</Text>
              </View>
            )}

            <Text style={styles.responseSectionTitle}>Responses ({responses.length})</Text>
            
            {responses.length === 0 ? (
              <Text style={styles.emptyResponses}>No replies yet. Please wait for an admin to review your inquiry.</Text>
            ) : (
              responses.map((resp, idx) => {
                const isAdmin = resp.role && resp.role !== 'Tourist';
                return (
                  <View key={idx} style={[styles.respBubble, isAdmin ? styles.respBubbleAdmin : styles.respBubbleUser]}>
                    <Text style={styles.respUser}>{isAdmin ? 'Support Admin' : 'You'}</Text>
                    <Text style={styles.respMessage}>{resp.message}</Text>
                    <Text style={styles.respDate}>{new Date(resp.created_at).toLocaleString()}</Text>
                  </View>
                );
              })
            )}

            {selectedInquiry?.status !== 'Closed' && (
              <View style={styles.replyBox}>
                <Text style={styles.label}>Add Reply</Text>
                <TextInput style={styles.textArea} placeholder="Type your reply..."
                  value={responseText} onChangeText={setResponseText}
                  multiline numberOfLines={3} textAlignVertical="top" />
                <TouchableOpacity style={styles.btn} onPress={submitResponse} disabled={submittingResponse}>
                  {submittingResponse ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Send Reply</Text>}
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#f0f4f8', paddingTop: 50 },
  headerRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 },
  title:        { fontSize: 24, fontWeight: 'bold', color: '#2E86AB' },
  addBtn:       { backgroundColor: '#2E86AB', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  addBtnText:   { color: '#fff', fontWeight: '700' },
  card:         { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 10, borderRadius: 14, padding: 16, elevation: 2 },
  row:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  subject:      { fontSize: 15, fontWeight: 'bold', color: '#333', flex: 1, paddingRight: 8 },
  status:       { fontWeight: '700', fontSize: 12, backgroundColor: '#f5f5f5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  category:     { color: '#888', fontSize: 12, marginTop: 4 },
  message:      { color: '#555', fontSize: 13, marginTop: 6 },
  empty:        { textAlign: 'center', color: '#999', marginTop: 60, paddingHorizontal: 32 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox:     { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '85%' },
  modalTitle:   { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 20 },
  label:        { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 8 },
  catRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  catBtn:       { borderWidth: 1.5, borderColor: '#2E86AB', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 5 },
  catActive:    { backgroundColor: '#2E86AB' },
  input:        { backgroundColor: '#f5f5f5', borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#eee' },
  textArea:     { backgroundColor: '#f5f5f5', borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#eee', minHeight: 100 },
  btn:          { backgroundColor: '#2E86AB', borderRadius: 12, padding: 14, alignItems: 'center' },
  btnText:      { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  cancelModal:  { padding: 14 },

  fullModalOverlay: { flex: 1, backgroundColor: '#f0f4f8', paddingTop: 50 },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#ddd' },
  closeBtn: { fontSize: 24, fontWeight: 'bold', color: '#555', paddingHorizontal: 8 },
  detailTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  detailBody: { flex: 1, padding: 16 },
  detailCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 20, elevation: 1 },
  detailSubject: { fontSize: 18, fontWeight: 'bold', color: '#333', flex: 1, paddingRight: 8 },
  detailCategory: { fontSize: 12, color: '#888', marginTop: 4, marginBottom: 10 },
  detailMessage: { fontSize: 14, color: '#444', lineHeight: 22, backgroundColor: '#f9f9f9', padding: 12, borderRadius: 8 },
  
  responseSectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  emptyResponses: { textAlign: 'center', color: '#888', fontStyle: 'italic', paddingVertical: 20 },
  respBubble: { padding: 12, borderRadius: 12, marginBottom: 10, maxWidth: '85%' },
  respBubbleAdmin: { backgroundColor: '#E3F2FD', alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  respBubbleUser: { backgroundColor: '#E8F5E9', alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  respUser: { fontSize: 11, fontWeight: 'bold', color: '#555', marginBottom: 4 },
  respMessage: { fontSize: 14, color: '#333', lineHeight: 20 },
  respDate: { fontSize: 10, color: '#999', marginTop: 6, textAlign: 'right' },
  replyBox: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginTop: 10, marginBottom: 40, elevation: 1 }
});