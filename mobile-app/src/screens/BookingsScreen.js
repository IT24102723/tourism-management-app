import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  TouchableOpacity, Alert, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import API from '../services/api';

const STATUS_COLOR = {
  Confirmed: '#27AE60',
  Pending:   '#F39C12',
  Cancelled: '#E74C3C',
  Completed: '#2980B9',
  Refunded:  '#95A5A6',
};
const STATUS_BG = {
  Confirmed: '#EAFAF1',
  Pending:   '#FEF9E7',
  Cancelled: '#FDEDEC',
  Completed: '#EBF5FB',
  Refunded:  '#F2F3F4',
};
const STATUS_ICON = {
  Confirmed: '✅',
  Pending:   '⏳',
  Cancelled: '✕',
  Completed: '🏁',
  Refunded:  '↩️',
};

export default function BookingsScreen({ navigation }) {
  const [bookings, setBookings]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Refresh whenever the screen comes into focus (e.g. returning from BookingDetail)
  useFocusEffect(
    useCallback(() => {
      fetchBookings();
    }, [])
  );

  const fetchBookings = async () => {
    try {
      const res = await API.get('/bookings');
      const payload = res.data?.data?.bookings || res.data?.bookings || res.data?.data || res.data || [];
      setBookings(Array.isArray(payload) ? payload : []);
    } catch (e) {
      console.log(e.response?.data);
    }
    setLoading(false);
    setRefreshing(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const renderBookingCard = ({ item }) => {
    const statusColor = STATUS_COLOR[item.booking_status] || '#333';
    const statusBg    = STATUS_BG[item.booking_status]    || '#F5F5F5';
    const statusIcon  = STATUS_ICON[item.booking_status]  || '📋';
    const isPending   = item.booking_status === 'Pending';
    const hasTransport= Number(item.transport_amount) > 0;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('BookingDetail', { booking_id: item.booking_id })}
        activeOpacity={0.8}
      >
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardPackageName} numberOfLines={1}>
              {item.package_title || item.attraction_name || `${item.booking_type} Booking`}
            </Text>
            <Text style={styles.cardBookingId}>Booking #{item.booking_id}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
            <Text style={styles.statusIcon}>{statusIcon}</Text>
            <Text style={[styles.statusLabel, { color: statusColor }]}>
              {item.booking_status}
            </Text>
          </View>
        </View>

        {/* Card Body */}
        <View style={styles.cardBody}>
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>📅</Text>
            <Text style={styles.detailText}>Travel: {item.travel_date?.split('T')[0] || '—'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>👥</Text>
            <Text style={styles.detailText}>
              {item.num_adults || 1} Adult{(item.num_adults || 1) > 1 ? 's' : ''}
              {item.num_children > 0 ? `, ${item.num_children} Child${item.num_children > 1 ? 'ren' : ''}` : ''}
            </Text>
          </View>
          {hasTransport && (
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>🚗</Text>
              <Text style={styles.detailText}>Transport included</Text>
            </View>
          )}
        </View>

        {/* Card Footer */}
        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.footerLabel}>Total Payable</Text>
            <Text style={styles.footerAmount}>
              LKR {Number(item.final_amount || item.base_amount || 0).toLocaleString()}
            </Text>
          </View>

          {isPending && (
            <View style={styles.pendingActions}>
              {!hasTransport && (
                <TouchableOpacity
                  style={styles.transportBtn}
                  onPress={() => navigation.navigate('BookingDetail', { booking_id: item.booking_id })}
                  activeOpacity={0.8}
                >
                  <Text style={styles.transportBtnText}>🚗 Transport</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.payBtn}
                onPress={() => navigation.navigate('Payment', {
                  booking_id:       item.booking_id,
                  base_amount:      item.base_amount      || 0,
                  transport_amount: item.transport_amount  || 0,
                  discount_amount:  item.discount_amount   || 0,
                  final_amount:     item.final_amount      || item.base_amount || 0,
                  title:            item.package_title || item.attraction_name || 'Booking',
                  vehicle_label:    hasTransport ? 'Transport included' : null,
                  route_label:      null,
                  duration_days:    item.duration_days || 1,
                })}
                activeOpacity={0.8}
              >
                <Text style={styles.payBtnText}>💳 Pay Now</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>


        {/* Tap hint */}
        <Text style={styles.tapHint}>Tap to open →</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>📅 My Bookings</Text>
        <Text style={styles.subtitle}>Tap a booking to view details, add transport or pay</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0D5F8A" style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={item => String(item.booking_id)}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 30, paddingTop: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0D5F8A" />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>No Bookings Yet</Text>
              <Text style={styles.emptyText}>
                Browse packages and book your Sri Lanka adventure!
              </Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => navigation.navigate('Packages')}
              >
                <Text style={styles.emptyBtnText}>Browse Packages →</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={renderBookingCard}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },

  header: {
    backgroundColor: '#0D5F8A',
    paddingTop: 55, paddingBottom: 24, paddingHorizontal: 16,
    borderBottomLeftRadius: 20, borderBottomRightRadius: 20,
  },
  title:    { fontSize: 26, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  subtitle: { fontSize: 12, color: '#87CEEB' },

  // Booking card
  card: {
    backgroundColor: '#fff',
    borderRadius: 16, marginBottom: 14,
    elevation: 3, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.09,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  cardPackageName: { fontSize: 15, fontWeight: 'bold', color: '#1A3A4A', marginBottom: 2 },
  cardBookingId:   { fontSize: 11, color: '#AAA' },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, gap: 4,
  },
  statusIcon:  { fontSize: 12 },
  statusLabel: { fontSize: 11, fontWeight: '700' },

  cardBody: { paddingHorizontal: 16, paddingVertical: 12, gap: 6 },
  detailRow:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailIcon: { fontSize: 14, width: 20 },
  detailText: { fontSize: 13, color: '#555' },

  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#FAFAFA', borderTopWidth: 1, borderTopColor: '#F0F0F0',
  },
  footerLabel:  { fontSize: 11, color: '#999', marginBottom: 2 },
  footerAmount: { fontSize: 16, fontWeight: 'bold', color: '#0D5F8A' },
  pendingActions: { flexDirection: 'row', gap: 6 },
  transportBtn: {
    backgroundColor: '#EDF4F8', paddingHorizontal: 10,
    paddingVertical: 7, borderRadius: 8,
    borderWidth: 1, borderColor: '#0D5F8A',
  },
  transportBtnText: { fontSize: 11, fontWeight: '700', color: '#0D5F8A' },
  payBtn: {
    backgroundColor: '#27AE60', paddingHorizontal: 12,
    paddingVertical: 7, borderRadius: 8,
  },
  payBtnText: { fontSize: 11, fontWeight: '700', color: '#fff' },

  tapHint: {
    textAlign: 'right', fontSize: 10, color: '#CCC',
    paddingRight: 14, paddingBottom: 8,
  },

  // Empty state
  emptyContainer: {
    marginTop: 60, alignItems: 'center', paddingHorizontal: 32,
  },
  emptyIcon:  { fontSize: 52, marginBottom: 14 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  emptyText:  { fontSize: 13, color: '#999', textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  emptyBtn: {
    backgroundColor: '#0D5F8A', paddingHorizontal: 24,
    paddingVertical: 13, borderRadius: 12,
  },
  emptyBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
});