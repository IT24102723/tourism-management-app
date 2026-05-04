import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions
} from 'react-native';
import API from '../services/api';

export default function AdminAnalyticsScreen() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      const res = await API.get('/attractions/analytics/report');
      console.log('Analytics Response:', res.data);
      setData(res.data?.data || res.data);
    } catch (e) {
      console.error('Analytics Error:', e.response?.data || e.message);
    }
    setLoading(false);
  };

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#0D5F8A" />
      <Text style={styles.loadingText}>Generating Report...</Text>
    </View>
  );

  const totals = data?.totals || {};

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📊 Business Analytics</Text>
        <Text style={styles.headerSub}>Tourism Content & Performance Report</Text>
      </View>

      {/* Key Metrics */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricBox}>
          <Text style={styles.metricVal}>{totals.total_visitors?.toLocaleString()}</Text>
          <Text style={styles.metricLabel}>Total Visitors</Text>
        </View>
        <View style={styles.metricBox}>
          <Text style={styles.metricVal}>LKR {(totals.total_revenue / 1000).toFixed(1)}k</Text>
          <Text style={styles.metricLabel}>Total Revenue</Text>
        </View>
        <View style={styles.metricBox}>
          <Text style={styles.metricVal}>{totals.avg_rating?.toFixed(1)} ★</Text>
          <Text style={styles.metricLabel}>Avg. Rating</Text>
        </View>
      </View>

      {/* Category Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏝️ Category Breakdown</Text>
        <View style={styles.card}>
          {data?.category_breakdown?.map((cat, idx) => (
            <View key={idx} style={styles.listRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{cat.category}</Text>
                <Text style={styles.rowSub}>{cat.attraction_count} attractions</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.rowVal}>{cat.total_visitors} visits</Text>
                <Text style={styles.rowSub}>{cat.avg_rating} rating</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  loadingText: { marginTop: 12, color: '#0D5F8A', fontWeight: '600' },
  
  header: {
    backgroundColor: '#fff', paddingTop: 55, paddingBottom: 20, paddingHorizontal: 20,
    borderBottomWidth: 1, borderBottomColor: '#EEE',
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1A3A4A', marginBottom: 4 },
  headerSub:   { fontSize: 12, color: '#777' },

  metricsGrid: { flexDirection: 'row', padding: 16, gap: 10 },
  metricBox: { 
    flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 16, 
    alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05 
  },
  metricVal: { fontSize: 18, fontWeight: 'bold', color: '#0D5F8A' },
  metricLabel: { fontSize: 10, color: '#999', marginTop: 4, textTransform: 'uppercase' },

  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, elevation: 1 },
  
  listRow: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  rowTitle: { fontSize: 14, fontWeight: 'bold', color: '#1A3A4A' },
  rowSub:   { fontSize: 11, color: '#999', marginTop: 2 },
  rowVal:   { fontSize: 14, fontWeight: 'bold', color: '#27AE60' },

});
