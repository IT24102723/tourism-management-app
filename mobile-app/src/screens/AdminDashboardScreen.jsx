import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';

export default function AdminDashboardScreen({ navigation }) {
  const { logout } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    try {
      const [attrRes, pkgRes, bookRes, vehRes, schedRes, provRes, inquRes] = await Promise.all([
        API.get('/attractions'),
        API.get('/packages/all'),
        API.get('/bookings'),
        API.get('/transport/vehicles'),
        API.get('/transport/schedules'),
        API.get('/providers/all'),
        API.get('/inquiries'),
      ]);
      console.log('Dashboard Stats - Attractions:', attrRes.data);
      console.log('Dashboard Stats - Vehicles:', vehRes.data);
      setStats({
        attractions: attrRes.data?.data?.pagination?.total || attrRes.data?.data?.attractions?.length || attrRes.data?.pagination?.total || 0,
        packages: pkgRes.data?.data?.pagination?.total || pkgRes.data?.data?.packages?.length || 0,
        bookings: bookRes.data?.data?.pagination?.total || bookRes.data?.data?.bookings?.length || 0,
        vehicles: vehRes.data?.data?.vehicles?.length || vehRes.data?.data?.length || 0,
        schedules: schedRes.data?.data?.schedules?.length || schedRes.data?.data?.length || 0,
        providers: (provRes.data?.data?.providers || provRes.data?.data || []).length,
        inquiries: inquRes.data?.data?.inquiries?.length || 0,
        pendingBookings: (bookRes.data?.data?.bookings || []).filter(b => b.booking_status === 'Pending').length,
      });
    } catch (e) {
      console.error('Dashboard Stats Error:', e.response?.data || e.message);
    }
    setLoading(false);
  };

  const sections = [
    { icon: '🏝️', label: 'Attractions', color: '#E8F4FD', textColor: '#0D5F8A', screen: 'AdminAttractions', stat: stats?.attractions },
    { icon: '🧳', label: 'Packages', color: '#FEF9E7', textColor: '#E67E22', screen: 'AdminPackages', stat: stats?.packages },
    { icon: '🚗', label: 'Vehicles', color: '#FFE8E8', textColor: '#E74C3C', screen: 'AdminVehicles', stat: stats?.vehicles },
    { icon: '📅', label: 'Schedules', color: '#EAFAF1', textColor: '#27AE60', screen: 'AdminSchedules', stat: stats?.schedules },
    { icon: '🗂️', label: 'Bookings', color: '#F4ECF7', textColor: '#8E44AD', screen: 'AdminBookings', stat: stats?.bookings },
    { icon: '🏢', label: 'Providers', color: '#E8F8F5', textColor: '#16A085', screen: 'AdminProviders', stat: stats?.providers },
    { icon: '📨', label: 'Inquiries', color: '#FEF3E7', textColor: '#D35400', screen: 'AdminInquiries', stat: stats?.inquiries },
    { icon: '💳', label: 'Payments', color: '#EBF5FB', textColor: '#2980B9', screen: 'AdminPayments' },
    { icon: '⭐', label: 'Feedback', color: '#FEF9E7', textColor: '#F39C12', screen: 'AdminFeedback' },
    { icon: '📊', label: 'Analytics', color: '#FFF4E5', textColor: '#E67E22', screen: 'AdminAnalytics' },
  ];

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => { await logout(); navigation.navigate('Login'); } },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>⚙️ Admin Panel</Text>
            <Text style={styles.headerSub}>Sri Lanka Tourism Management System</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutBtnText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0D5F8A" style={{ marginTop: 60 }} />
      ) : (
        <>
          {/* Quick Stats */}
          <View style={styles.statsRow}>
            <View style={[styles.statBox, { backgroundColor: '#E8F4FD' }]}>
              <Text style={styles.statNum}>{stats?.attractions}</Text>
              <Text style={styles.statLabel}>Attractions</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: '#FEF9E7' }]}>
              <Text style={styles.statNum}>{stats?.packages}</Text>
              <Text style={styles.statLabel}>Packages</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: '#FFF0F0' }]}>
              <Text style={styles.statNum}>{stats?.pendingBookings}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: '#EAFAF1' }]}>
              <Text style={styles.statNum}>{stats?.vehicles}</Text>
              <Text style={styles.statLabel}>Vehicles</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Manage</Text>
          <View style={styles.grid}>
            {sections.map((s, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.card, { backgroundColor: s.color }]}
                onPress={() => navigation.navigate(s.screen)}
                activeOpacity={0.8}
              >
                <Text style={styles.cardIcon}>{s.icon}</Text>
                <Text style={[styles.cardLabel, { color: s.textColor }]}>{s.label}</Text>
                {s.stat !== undefined && (
                  <Text style={styles.cardCount}>{s.stat} records</Text>
                )}
                <Text style={[styles.cardArrow, { color: s.textColor }]}>→</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: {
    backgroundColor: '#1A3A4A', paddingTop: 55, paddingBottom: 24, paddingHorizontal: 20,
    borderBottomLeftRadius: 20, borderBottomRightRadius: 20,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 26, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  headerSub: { fontSize: 12, color: '#87CEEB' },
  logoutBtn: { backgroundColor: 'rgba(255,255,255,0.15)', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20 },
  logoutBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },

  statsRow: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 20, gap: 8 },
  statBox: { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center', elevation: 1 },
  statNum: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  statLabel: { fontSize: 10, color: '#666', fontWeight: '600', marginTop: 2 },

  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', paddingHorizontal: 20, marginTop: 24, marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 12 },
  card: {
    width: '47%', borderRadius: 16, padding: 18,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07,
  },
  cardIcon: { fontSize: 32, marginBottom: 10 },
  cardLabel: { fontSize: 15, fontWeight: 'bold', marginBottom: 4 },
  cardCount: { fontSize: 11, color: '#999', marginBottom: 8 },
  cardArrow: { fontSize: 18, fontWeight: 'bold' },
});
