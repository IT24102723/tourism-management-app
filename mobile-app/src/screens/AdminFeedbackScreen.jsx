import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Modal,
  ActivityIndicator, ScrollView, TextInput, RefreshControl
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import API from '../services/api';

const SENTIMENT_COLORS = { Positive: '#27AE60', Neutral: '#F39C12', Negative: '#E74C3C' };
const TARGET_TYPES = ['All', 'Attraction', 'Package', 'Provider', 'Schedule'];

export default function AdminFeedbackScreen({ navigation }) {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('All');
  const [detailModal, setDetailModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('feedback'); // 'feedback' | 'bestServices'
  const [bestServices, setBestServices] = useState(null);
  const [loadingBest, setLoadingBest] = useState(false);

  useFocusEffect(useCallback(() => { fetchFeedback(); }, [filter]));

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter !== 'All') params.target_type = filter;
      const res = await API.get('/feedback', { params });
      setFeedback(res.data?.data?.feedback || []);
    } catch (e) {
      console.error('Error fetching feedback:', e.response?.data || e.message);
    }
    setLoading(false);
  };

  const fetchBestServices = async () => {
    setLoadingBest(true);
    try {
      const res = await API.get('/feedback/best-services');
      setBestServices(res.data?.data || null);
    } catch (e) {
      console.error('Error fetching best services:', e.response?.data || e.message);
    }
    setLoadingBest(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFeedback();
    if (activeTab === 'bestServices') await fetchBestServices();
    setRefreshing(false);
  };

  const openDetail = (item) => {
    setSelected(item);
    setResponseText(item.admin_response || '');
    setDetailModal(true);
  };

  const submitResponse = async () => {
    if (!responseText.trim()) return Alert.alert('Error', 'Please enter a response');
    setSubmitting(true);
    try {
      await API.post(`/feedback/${selected.feedback_id}/respond`, { response_text: responseText });
      Alert.alert('✅ Success', 'Response added to feedback.');
      setDetailModal(false);
      fetchFeedback();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to submit response');
    }
    setSubmitting(false);
  };

  const deleteFeedback = (item) => {
    Alert.alert('Delete Feedback', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await API.delete(`/feedback/${item.feedback_id}`);
          Alert.alert('✅ Deleted');
          fetchFeedback();
        } catch (e) {
          Alert.alert('Error', e.response?.data?.message || 'Failed to delete');
        }
      }},
    ]);
  };

  const renderStars = (rating) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  const renderFeedbackCard = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => openDetail(item)}>
      <View style={styles.cardTop}>
        <View style={{ flex: 1, paddingRight: 10 }}>
          <Text style={styles.cardUser}>👤 {item.username || item.full_name || 'Tourist'}</Text>
          <Text style={styles.cardTarget}>{item.target_type}: {item.target_name || `#${item.target_id}`}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.sentiment, { color: SENTIMENT_COLORS[item.sentiment] || '#888' }]}>
            {item.sentiment || 'N/A'}
          </Text>
          <Text style={styles.cardStars}>{renderStars(item.rating || 0)}</Text>
        </View>
      </View>
      <Text style={styles.cardReview} numberOfLines={2}>{item.review_text || item.comment || 'No comment'}</Text>
      {item.admin_response && (
        <View style={styles.responseTag}>
          <Text style={styles.responseTagText}>✅ Responded</Text>
        </View>
      )}
      <View style={styles.cardFooter}>
        <Text style={styles.cardDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
        <TouchableOpacity onPress={() => deleteFeedback(item)}>
          <Text style={styles.deleteText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderBestServiceCard = (item, idx) => (
    <View key={`${item.id}-${idx}`} style={styles.bestCard}>
      <View style={styles.bestRank}>
        <Text style={styles.bestRankText}>#{idx + 1}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.bestName}>{item.name}</Text>
        <Text style={styles.bestSub}>{item.total_reviews} reviews • {item.positive_pct}% positive</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={styles.bestRating}>{item.avg_rating} ★</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>⭐ Feedback Management</Text>
        <Text style={styles.headerSub}>{feedback.length} total reviews</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'feedback' && styles.tabActive]}
          onPress={() => setActiveTab('feedback')}
        >
          <Text style={[styles.tabText, activeTab === 'feedback' && styles.tabTextActive]}>📋 All Feedback</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'bestServices' && styles.tabActive]}
          onPress={() => { setActiveTab('bestServices'); if (!bestServices) fetchBestServices(); }}
        >
          <Text style={[styles.tabText, activeTab === 'bestServices' && styles.tabTextActive]}>🏆 Best Services</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'feedback' ? (
        <>
          {/* Filters */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={{ paddingHorizontal: 16 }}>
            {TARGET_TYPES.map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.filterBtn, filter === t && styles.filterActive]}
                onPress={() => setFilter(t)}
              >
                <Text style={[styles.filterText, filter === t && styles.filterTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {loading ? (
            <ActivityIndicator size="large" color="#0D5F8A" style={{ marginTop: 40 }} />
          ) : (
            <FlatList
              data={feedback}
              keyExtractor={(item, idx) => `fb-${item.feedback_id || idx}`}
              renderItem={renderFeedbackCard}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 30 }}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              ListEmptyComponent={
                <Text style={styles.empty}>No feedback found for this filter.</Text>
              }
            />
          )}
        </>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {loadingBest ? (
            <ActivityIndicator size="large" color="#0D5F8A" style={{ marginTop: 40 }} />
          ) : bestServices ? (
            <>
              {/* Overview Stats */}
              <View style={styles.overviewRow}>
                <View style={styles.overviewBox}>
                  <Text style={styles.overviewVal}>{bestServices.overview?.total_feedback || 0}</Text>
                  <Text style={styles.overviewLabel}>Total Reviews</Text>
                </View>
                <View style={styles.overviewBox}>
                  <Text style={styles.overviewVal}>{bestServices.overview?.overall_avg_rating || 0} ★</Text>
                  <Text style={styles.overviewLabel}>Avg Rating</Text>
                </View>
                <View style={styles.overviewBox}>
                  <Text style={styles.overviewVal}>{bestServices.overview?.positive_rate || 0}%</Text>
                  <Text style={styles.overviewLabel}>Positive</Text>
                </View>
              </View>

              {/* Top Attractions */}
              <Text style={styles.sectionTitle}>🏝️ Top Rated Attractions</Text>
              <View style={styles.bestSection}>
                {(bestServices.attractions || []).length > 0 ?
                  bestServices.attractions.map((a, i) => renderBestServiceCard(a, i)) :
                  <Text style={styles.noData}>No attraction feedback yet</Text>
                }
              </View>

              {/* Top Packages */}
              <Text style={styles.sectionTitle}>🧳 Top Rated Packages</Text>
              <View style={styles.bestSection}>
                {(bestServices.packages || []).length > 0 ?
                  bestServices.packages.map((a, i) => renderBestServiceCard(a, i)) :
                  <Text style={styles.noData}>No package feedback yet</Text>
                }
              </View>

              {/* Top Providers */}
              <Text style={styles.sectionTitle}>🏢 Top Rated Providers</Text>
              <View style={styles.bestSection}>
                {(bestServices.providers || []).length > 0 ?
                  bestServices.providers.map((a, i) => renderBestServiceCard(a, i)) :
                  <Text style={styles.noData}>No provider feedback yet</Text>
                }
              </View>
            </>
          ) : (
            <Text style={styles.empty}>Loading analytics...</Text>
          )}
        </ScrollView>
      )}

      {/* Detail + Response Modal */}
      <Modal visible={detailModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setDetailModal(false)}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Feedback Detail</Text>
            <View style={{ width: 30 }} />
          </View>
          <ScrollView style={styles.modalBody}>
            {selected && (
              <>
                <View style={styles.detailCard}>
                  <Text style={styles.detailUser}>👤 {selected.username || selected.full_name || 'Tourist'}</Text>
                  <Text style={styles.detailTarget}>{selected.target_type}: {selected.target_name || `#${selected.target_id}`}</Text>
                  <Text style={styles.detailStars}>{renderStars(selected.rating || 0)}</Text>
                  <Text style={[styles.detailSentiment, { color: SENTIMENT_COLORS[selected.sentiment] || '#888' }]}>
                    {selected.sentiment}
                  </Text>
                  <Text style={styles.detailReview}>{selected.review_text || selected.comment || 'No comment'}</Text>
                  <Text style={styles.detailDate}>{new Date(selected.created_at).toLocaleString()}</Text>
                </View>

                {selected.admin_response && (
                  <View style={styles.existingResponse}>
                    <Text style={styles.existingResponseTitle}>✅ Your Previous Response</Text>
                    <Text style={styles.existingResponseText}>{selected.admin_response}</Text>
                  </View>
                )}

                <View style={styles.responseSection}>
                  <Text style={styles.responseSectionTitle}>
                    {selected.admin_response ? 'Update Response' : 'Add Response'}
                  </Text>
                  <TextInput
                    style={styles.responseInput}
                    placeholder="Type your response to this customer..."
                    value={responseText}
                    onChangeText={setResponseText}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                  <TouchableOpacity style={styles.submitBtn} onPress={submitResponse} disabled={submitting}>
                    {submitting ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.submitBtnText}>Send Response</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { backgroundColor: '#1A3A4A', paddingTop: 55, paddingBottom: 20, paddingHorizontal: 20 },
  backBtn: { color: '#87CEEB', fontSize: 14, fontWeight: '600', marginBottom: 8 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  headerSub: { fontSize: 12, color: '#87CEEB' },

  tabRow: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#E0E0E0' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: '#0D5F8A' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#999' },
  tabTextActive: { color: '#0D5F8A' },

  filterScroll: { flexGrow: 0, maxHeight: 50, paddingVertical: 10 },
  filterBtn: { borderWidth: 1, borderColor: '#ccc', borderRadius: 16, paddingHorizontal: 14, height: 30, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', marginRight: 8 },
  filterActive: { backgroundColor: '#0D5F8A', borderColor: '#0D5F8A' },
  filterText: { fontSize: 12, fontWeight: '600', color: '#555' },
  filterTextActive: { color: '#fff' },

  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 12, elevation: 2 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  cardUser: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  cardTarget: { fontSize: 11, color: '#888', marginTop: 2 },
  sentiment: { fontSize: 11, fontWeight: '700' },
  cardStars: { fontSize: 14, color: '#F39C12', marginTop: 2 },
  cardReview: { fontSize: 13, color: '#555', lineHeight: 18, marginBottom: 8 },
  responseTag: { backgroundColor: '#E8F5E9', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: 8 },
  responseTagText: { fontSize: 11, color: '#27AE60', fontWeight: '600' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 8 },
  cardDate: { fontSize: 11, color: '#999' },
  deleteText: { fontSize: 16 },
  empty: { textAlign: 'center', color: '#999', marginTop: 60, fontSize: 14 },

  overviewRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  overviewBox: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 16, alignItems: 'center', elevation: 2 },
  overviewVal: { fontSize: 20, fontWeight: 'bold', color: '#0D5F8A' },
  overviewLabel: { fontSize: 10, color: '#999', marginTop: 4, textTransform: 'uppercase' },

  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10, marginTop: 8 },
  bestSection: { backgroundColor: '#fff', borderRadius: 14, padding: 12, marginBottom: 16, elevation: 1 },
  bestCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  bestRank: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#E8F4FD', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  bestRankText: { fontSize: 12, fontWeight: 'bold', color: '#0D5F8A' },
  bestName: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  bestSub: { fontSize: 11, color: '#888', marginTop: 2 },
  bestRating: { fontSize: 16, fontWeight: 'bold', color: '#F39C12' },
  noData: { textAlign: 'center', color: '#999', paddingVertical: 16, fontStyle: 'italic' },

  modalOverlay: { flex: 1, backgroundColor: '#f0f4f8', paddingTop: 50 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#ddd' },
  closeBtn: { fontSize: 24, fontWeight: 'bold', color: '#555', paddingHorizontal: 8 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  modalBody: { flex: 1, padding: 16 },

  detailCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 1 },
  detailUser: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  detailTarget: { fontSize: 12, color: '#888', marginBottom: 8 },
  detailStars: { fontSize: 24, color: '#F39C12', marginBottom: 4 },
  detailSentiment: { fontSize: 13, fontWeight: '700', marginBottom: 10 },
  detailReview: { fontSize: 14, color: '#444', lineHeight: 22, backgroundColor: '#f9f9f9', padding: 12, borderRadius: 8 },
  detailDate: { fontSize: 11, color: '#999', marginTop: 10 },

  existingResponse: { backgroundColor: '#E8F5E9', borderRadius: 12, padding: 14, marginBottom: 16 },
  existingResponseTitle: { fontSize: 13, fontWeight: 'bold', color: '#27AE60', marginBottom: 6 },
  existingResponseText: { fontSize: 13, color: '#333', lineHeight: 20 },

  responseSection: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 40, elevation: 1 },
  responseSectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  responseInput: { backgroundColor: '#f5f5f5', borderRadius: 8, borderWidth: 1, borderColor: '#ddd', padding: 12, fontSize: 13, color: '#333', minHeight: 100, textAlignVertical: 'top', marginBottom: 12 },
  submitBtn: { backgroundColor: '#0D5F8A', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
});
