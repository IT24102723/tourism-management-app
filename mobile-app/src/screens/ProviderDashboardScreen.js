import React, { useState, useCallback, useContext } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, Image
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';

export default function ProviderDashboardScreen({ navigation }) {
  const { user, logout } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchStats();
    }, [])
  );

  const fetchStats = async () => {
    try {
      const res = await API.get('/providers/me/stats');
      if (res.data?.success) {
        setStats(res.data.data);
      }
    } catch (e) {
      const status = e.response?.status;
      if (status === 404) {
        // Provider profile not created yet
        navigation.navigate('ProviderProfile', { setup: true });
      } else if (status !== 401) {
        console.log('Stats error:', e.response?.data);
      }
    }
    setLoading(false);
    setRefreshing(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout }
    ]);
  };

  if (loading && !refreshing) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#0D5F8A" />
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.welcome}>Welcome back,</Text>
            <Text style={styles.name}>{user?.full_name}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: stats?.status === 'Active' ? '#EAFAF1' : '#FEF9E7' }]}>
            <Text style={[styles.statusText, { color: stats?.status === 'Active' ? '#27AE60' : '#F39C12' }]}>
              ● {stats?.status || 'Pending'}
            </Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutEmoji}>🚪</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={styles.statVal}>{stats?.active_packages || 0}</Text>
          <Text style={styles.statLabel}>Active Packages</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statVal}>{stats?.vehicles || 0}</Text>
          <Text style={styles.statLabel}>Vehicles</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statVal}>{stats?.total_bookings || 0}</Text>
          <Text style={styles.statLabel}>Bookings</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statVal}>{stats?.average_rating || 'N/A'}</Text>
          <Text style={styles.statLabel}>Avg Rating</Text>
        </View>
      </View>

      <View style={styles.actionSection}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#27AE60' }]}
            onPress={() => navigation.navigate('MyPackages', { openAdd: true })}
          >
            <Text style={styles.actionIcon}>🧳</Text>
            <Text style={styles.actionText}>New Package</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#F39C12' }]}
            onPress={() => navigation.navigate('MyVehicles', { openAdd: true })}
          >
            <Text style={styles.actionIcon}>🚗</Text>
            <Text style={styles.actionText}>Add Vehicle</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#2E86AB' }]}
            onPress={() => navigation.navigate('AdminSchedules')}
          >
            <Text style={styles.actionIcon}>📅</Text>
            <Text style={styles.actionText}>Add Schedule</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>Manage Business</Text>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('ProviderProfile')}>
          <Text style={styles.menuEmoji}>👤</Text>
          <View style={styles.menuInfo}>
            <Text style={styles.menuTitle}>My Provider Profile</Text>
            <Text style={styles.menuSub}>Edit your business details and contact info</Text>
          </View>
          <Text style={styles.arrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('MyPackages')}>
          <Text style={styles.menuEmoji}>🧳</Text>
          <View style={styles.menuInfo}>
            <Text style={styles.menuTitle}>My Packages</Text>
            <Text style={styles.menuSub}>Manage your listed tour packages</Text>
          </View>
          <Text style={styles.arrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('MyVehicles')}>
          <Text style={styles.menuEmoji}>🚗</Text>
          <View style={styles.menuInfo}>
            <Text style={styles.menuTitle}>My Vehicles</Text>
            <Text style={styles.menuSub}>Manage transport and fleet</Text>
          </View>
          <Text style={styles.arrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('AdminFeedback')}>
          <Text style={styles.menuEmoji}>⭐</Text>
          <View style={styles.menuInfo}>
            <Text style={styles.menuTitle}>Customer Reviews</Text>
            <Text style={styles.menuSub}>See what tourists say about you</Text>
          </View>
          <Text style={styles.arrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('AdminInquiries')}>
          <Text style={styles.menuEmoji}>📨</Text>
          <View style={styles.menuInfo}>
            <Text style={styles.menuTitle}>Customer Inquiries</Text>
            <Text style={styles.menuSub}>Respond to questions from travelers</Text>
          </View>
          <Text style={styles.arrow}>→</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: '#fff', paddingTop: 60, paddingBottom: 24, paddingHorizontal: 20,
    borderBottomLeftRadius: 30, borderBottomRightRadius: 30, elevation: 3
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  welcome: { fontSize: 13, color: '#888', marginBottom: 2 },
  name: { fontSize: 22, fontWeight: 'bold', color: '#1A3A4A' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: '700' },
  logoutBtn: { padding: 10, backgroundColor: '#FFF0F0', borderRadius: 10, marginLeft: 10 },
  logoutEmoji: { fontSize: 18 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 10 },
  statBox: {
    width: '48%', backgroundColor: '#fff', borderRadius: 16, padding: 16,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05
  },
  statVal: { fontSize: 20, fontWeight: 'bold', color: '#1A3A4A' },
  statLabel: { fontSize: 11, color: '#999', marginTop: 4 },

  actionSection: { paddingHorizontal: 20, marginTop: 10 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  actionGrid: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1, borderRadius: 14, paddingVertical: 15, alignItems: 'center',
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2
  },
  actionIcon: { fontSize: 20, marginBottom: 4 },
  actionText: { color: '#fff', fontSize: 10, fontWeight: 'bold', textAlign: 'center' },

  menuSection: { paddingHorizontal: 20, marginTop: 30, paddingBottom: 30 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 16, padding: 16, marginBottom: 12, elevation: 1
  },
  menuEmoji: { fontSize: 24, marginRight: 16 },
  menuInfo: { flex: 1 },
  menuTitle: { fontSize: 15, fontWeight: 'bold', color: '#1A3A4A' },
  menuSub: { fontSize: 12, color: '#888', marginTop: 2 },
  arrow: { fontSize: 18, color: '#CCC', fontWeight: 'bold' }
});
