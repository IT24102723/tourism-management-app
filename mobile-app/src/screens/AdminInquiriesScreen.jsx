import React, { useState, useCallback, useContext } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Modal,
  ActivityIndicator, ScrollView, TextInput, RefreshControl
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';

const STATUSES = ['Submitted', 'Pending', 'Responded', 'Closed'];
const STATUS_COLORS = {
  Submitted: '#F39C12',
  Pending: '#E67E22',
  Responded: '#2980B9',
  Closed: '#27AE60',
};

export default function AdminInquiriesScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [detailModal, setDetailModal] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [responses, setResponses] = useState([]);
  const [responseText, setResponseText] = useState('');
  const [submittingResponse, setSubmittingResponse] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');

  useFocusEffect(useCallback(() => { 
    fetchInquiries(); 
  }, [statusFilter, categoryFilter]));

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'All') params.status = statusFilter;
      if (categoryFilter !== 'All') params.category = categoryFilter;

      console.log('📨 Fetching inquiries with params:', params);
      const res = await API.get('/inquiries', { params });
      console.log('📨 Inquiries Response:', res.data);
      
      const data = res.data?.data || res.data || {};
      const inquList = data.inquiries || data || [];
      const validList = Array.isArray(inquList) ? inquList : [];
      setInquiries(validList);
      console.log('📨 Inquiries loaded:', validList.length);
    } catch (e) {
      console.error('❌ Error fetching inquiries:', e.response?.data || e.message);
      Alert.alert('Error', e.response?.data?.message || 'Failed to load inquiries');
    }
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchInquiries();
    setRefreshing(false);
  };

  const openDetail = async (inquiry) => {
    setSelectedInquiry(inquiry);
    try {
      console.log('📨 Fetching inquiry detail for ID:', inquiry.inquiry_id);
      const res = await API.get(`/inquiries/${inquiry.inquiry_id}`);
      console.log('📨 Inquiry Detail Response:', res.data);
      const data = res.data?.data || res.data;
      setResponses(data.responses || []);
    } catch (e) {
      console.error('❌ Error fetching inquiry detail:', e.response?.data || e.message);
      Alert.alert('Error', e.response?.data?.message || 'Failed to load inquiry details');
      setResponses([]);
    }
    setResponseText('');
    setDetailModal(true);
  };

  const submitResponse = async () => {
    if (!responseText.trim()) {
      return Alert.alert('Error', 'Please enter a response message');
    }
    setSubmittingResponse(true);
    try {
      console.log('📨 Submitting response for inquiry:', selectedInquiry.inquiry_id);
      const res = await API.post(`/inquiries/${selectedInquiry.inquiry_id}/respond`, {
        message: responseText,
      });
      console.log('📨 Response Submission Result:', res.data);
      Alert.alert('✅ Success', 'Response submitted successfully');
      setResponseText('');
      // Refresh inquiry details
      const detailRes = await API.get(`/inquiries/${selectedInquiry.inquiry_id}`);
      const data = detailRes.data?.data || detailRes.data;
      setResponses(data.responses || []);
      setSelectedInquiry(data);
      // Refresh list
      await fetchInquiries();
    } catch (e) {
      console.error('❌ Error submitting response:', e.response?.data || e.message);
      Alert.alert('Error', e.response?.data?.message || 'Failed to submit response');
    }
    setSubmittingResponse(false);
  };

  const updateStatus = async (newStatus) => {
    try {
      console.log('📨 Updating inquiry status:', { id: selectedInquiry.inquiry_id, status: newStatus });
      const res = await API.patch(`/inquiries/${selectedInquiry.inquiry_id}/status`, {
        status: newStatus,
      });
      console.log('📨 Status Update Result:', res.data);
      Alert.alert('✅ Success', `Status updated to ${newStatus}`);
      // Refresh the inquiry
      const detailRes = await API.get(`/inquiries/${selectedInquiry.inquiry_id}`);
      setSelectedInquiry(detailRes.data?.data || detailRes.data);
      // Refresh list
      await fetchInquiries();
    } catch (e) {
      console.error('❌ Error updating status:', e.response?.data || e.message);
      Alert.alert('Error', e.response?.data?.message || 'Failed to update status');
    }
  };

  const categories = ['All', 'General', 'Booking', 'Payment', 'Complaint', 'Suggestion', 'Technical'];

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2E86AB" style={{ marginTop: 60 }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>📨 Inquiries</Text>
        <View style={{ width: 60 }} />
      </View>



      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterBtn, statusFilter === 'All' && styles.filterActive]}
            onPress={() => setStatusFilter('All')}
          >
            <Text style={[styles.filterText, statusFilter === 'All' && styles.filterTextActive]}>
              All Status
            </Text>
          </TouchableOpacity>
          {STATUSES.map(status => (
            <TouchableOpacity
              key={status}
              style={[styles.filterBtn, statusFilter === status && styles.filterActive]}
              onPress={() => {
                console.log('🔍 Filtering by status:', status);
                setStatusFilter(status);
              }}
            >
              <Text style={[styles.filterText, statusFilter === status && styles.filterTextActive]}>
                {status}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Category Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
        <View style={styles.filterContainer}>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryBtn, categoryFilter === cat && styles.categoryActive]}
              onPress={() => setCategoryFilter(cat)}
            >
              <Text style={[styles.categoryText, categoryFilter === cat && styles.categoryTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Inquiries List */}
      <FlatList
        data={inquiries}
        keyExtractor={item => String(item.inquiry_id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: 60 }}>
            <Text style={{ fontSize: 16, color: '#999', marginBottom: 8 }}>📭 No inquiries found.</Text>
            {statusFilter !== 'All' || categoryFilter !== 'All' ? (
              <Text style={{ fontSize: 13, color: '#AAA', textAlign: 'center', paddingHorizontal: 20 }}>
                Try selecting "All Status" or "All" category to see all inquiries
              </Text>
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => openDetail(item)}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardSubject}>{item.subject}</Text>
              <Text style={[styles.cardStatus, { color: STATUS_COLORS[item.status] || '#888' }]}>
                {item.status}
              </Text>
            </View>
            <Text style={styles.cardMeta}>
              {item.category} • {item.priority} • By: {item.username || 'Guest'}
            </Text>
            <Text style={styles.cardMessage} numberOfLines={2}>
              {item.message}
            </Text>
            <View style={styles.cardFooter}>
              <Text style={styles.cardUser}>👤 {item.email || 'No email'}</Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Detail Modal */}
      <Modal visible={detailModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setDetailModal(false)}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Inquiry Details</Text>
            <View style={{ width: 30 }} />
          </View>

          <ScrollView style={styles.modalBox} showsVerticalScrollIndicator={false}>
            {selectedInquiry && (
              <>
                {/* Inquiry Info */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Inquiry Information</Text>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>ID:</Text>
                    <Text style={styles.infoValue}>#{selectedInquiry.inquiry_id}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Status:</Text>
                    <Text
                      style={[
                        styles.infoValue,
                        { color: STATUS_COLORS[selectedInquiry.status] || '#888', fontWeight: 'bold' },
                      ]}
                    >
                      {selectedInquiry.status}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Category:</Text>
                    <Text style={styles.infoValue}>{selectedInquiry.category}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Priority:</Text>
                    <Text style={styles.infoValue}>{selectedInquiry.priority}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>From:</Text>
                    <Text style={styles.infoValue}>
                      {selectedInquiry.username || 'Guest'} ({selectedInquiry.email || 'No email'})
                    </Text>
                  </View>
                </View>

                {/* Inquiry Message */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Subject</Text>
                  <Text style={styles.messageBox}>{selectedInquiry.subject}</Text>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Message</Text>
                  <Text style={styles.messageBox}>{selectedInquiry.message}</Text>
                </View>

                {/* Responses */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    Responses ({responses.length})
                  </Text>
                  {responses.length === 0 ? (
                    <Text style={styles.noResponses}>No responses yet</Text>
                  ) : (
                    responses.map((resp, idx) => (
                      <View key={idx} style={styles.responseBox}>
                        <View style={styles.respHeader}>
                          <Text style={styles.respUser}>
                            {resp.username || 'Unknown'} ({resp.role || 'Support'})
                          </Text>
                          <Text style={styles.respDate}>
                            {new Date(resp.created_at).toLocaleDateString()}
                          </Text>
                        </View>
                        <Text style={styles.respMessage}>{resp.message}</Text>
                      </View>
                    ))
                  )}
                </View>

                {/* Status Update */}
                {selectedInquiry.status !== 'Closed' && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Update Status</Text>
                    <View style={styles.statusBtnRow}>
                      {STATUSES.map(status => (
                        selectedInquiry.status !== status && (
                          <TouchableOpacity
                            key={status}
                            style={[styles.statusBtn, { backgroundColor: STATUS_COLORS[status] }]}
                            onPress={() => updateStatus(status)}
                          >
                            <Text style={styles.statusBtnText}>{status}</Text>
                          </TouchableOpacity>
                        )
                      ))}
                    </View>
                  </View>
                )}

                {/* Add Response */}
                {selectedInquiry.status !== 'Closed' && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Add Response</Text>
                    <TextInput
                      style={styles.responseInput}
                      placeholder="Type your response here..."
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                      value={responseText}
                      onChangeText={setResponseText}
                    />
                    <TouchableOpacity
                      style={styles.submitBtn}
                      onPress={submitResponse}
                      disabled={submittingResponse}
                    >
                      {submittingResponse ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.submitBtnText}>Send Response</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8',
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  backBtn: {
    color: '#2E86AB',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2E86AB',
  },
  filterScroll: {
    marginBottom: 8,
    paddingHorizontal: 16,
    flexGrow: 0,
    maxHeight: 34,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filterBtn: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 16,
    paddingHorizontal: 12,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginRight: 6,
  },
  filterActive: {
    backgroundColor: '#2E86AB',
    borderColor: '#2E86AB',
  },
  filterText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#555',
  },
  filterTextActive: {
    color: '#fff',
  },
  categoryScroll: {
    marginBottom: 12,
    paddingHorizontal: 16,
    flexGrow: 0,
    maxHeight: 34,
  },
  categoryBtn: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginRight: 6,
  },
  categoryActive: {
    backgroundColor: '#E67E22',
    borderColor: '#E67E22',
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
  },
  categoryTextActive: {
    color: '#fff',
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 14,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  cardSubject: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  cardStatus: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
  },
  cardMeta: {
    fontSize: 11,
    color: '#888',
    marginBottom: 6,
  },
  cardMessage: {
    fontSize: 13,
    color: '#555',
    marginBottom: 8,
    lineHeight: 18,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 8,
  },
  cardUser: {
    fontSize: 12,
    color: '#888',
  },
  empty: {
    textAlign: 'center',
    color: '#999',
    marginTop: 60,
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#f0f4f8',
    paddingTop: 50,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    backgroundColor: '#fff',
  },
  closeBtn: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#555',
    paddingHorizontal: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBox: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  infoValue: {
    fontSize: 12,
    color: '#333',
  },
  messageBox: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 13,
    color: '#333',
    lineHeight: 20,
  },
  noResponses: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
  },
  responseBox: {
    backgroundColor: '#f9f9f9',
    borderLeftWidth: 3,
    borderLeftColor: '#2E86AB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  respHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  respUser: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2E86AB',
  },
  respDate: {
    fontSize: 11,
    color: '#999',
  },
  respMessage: {
    fontSize: 12,
    color: '#333',
    lineHeight: 18,
  },
  statusBtnRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  statusBtn: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statusBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  responseInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    fontSize: 13,
    color: '#333',
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  submitBtn: {
    backgroundColor: '#2E86AB',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  debugInfo: {
    backgroundColor: '#E3F2FD',
    borderBottomWidth: 1,
    borderBottomColor: '#2E86AB',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  debugText: {
    fontSize: 11,
    color: '#2E86AB',
    fontWeight: '600',
  },
});
