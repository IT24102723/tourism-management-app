import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert, Platform, Dimensions,
} from 'react-native';
import API from '../services/api';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const STATUS_COLOR = {
  Confirmed:  '#27AE60',
  Pending:    '#F39C12',
  Cancelled:  '#E74C3C',
  Completed:  '#2980B9',
  Refunded:   '#95A5A6',
};

const STATUS_BG = {
  Confirmed:  '#EAFAF1',
  Pending:    '#FEF9E7',
  Cancelled:  '#FDEDEC',
  Completed:  '#EBF5FB',
  Refunded:   '#F2F3F4',
};

export default function BookingDetailScreen({ route, navigation }) {
  const { booking_id } = route.params;
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchBooking(); }, []);

  const fetchBooking = async () => {
    try {
      const res = await API.get(`/bookings/${booking_id}`);
      setBooking(res.data.data || res.data);
    } catch (e) {
      Alert.alert('Error', 'Could not load booking details.');
    }
    setLoading(false);
  };

  const handleAddTransport = () => {
    navigation.navigate('TransportSelection', {
      booking_id:       booking.booking_id,
      package_id:       booking.package_id,
      package_title:    booking.package_title || 'Package Tour',
      duration_days:    booking.duration_days  || 1,
      travel_date:      booking.travel_date?.split('T')[0] || '',
      num_adults:       booking.num_adults    || 1,
      num_children:     booking.num_children  || 0,
      base_amount:      booking.base_amount   || booking.final_amount || 0,
    });
  };

  const handlePayNow = () => {
    navigation.navigate('Payment', {
      booking_id:       booking.booking_id,
      base_amount:      booking.base_amount      || 0,
      transport_amount: booking.transport_amount  || 0,
      discount_amount:  booking.discount_amount   || 0,
      final_amount:     booking.final_amount      || booking.base_amount || 0,
      title:            booking.package_title     || 'Package Tour',
      vehicle_label:    booking.transport_amount > 0 ? 'Transport included' : null,
      route_label:      null,
      duration_days:    booking.duration_days || 1,
    });
  };

  const handleCancel = () => {
    Alert.alert('Cancel Booking', 'Are you sure you want to cancel this booking?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          try {
            await API.patch(`/bookings/${booking_id}/cancel`);
            Alert.alert('Cancelled', 'Your booking has been cancelled.', [
              { text: 'OK', onPress: () => navigation.goBack() },
            ]);
          } catch (e) {
            Alert.alert('Error', e.response?.data?.message || 'Could not cancel booking.');
          }
        },
      },
    ]);
  };

  if (loading) return <ActivityIndicator size="large" color="#0D5F8A" style={{ marginTop: 100 }} />;
  if (!booking) return <Text style={{ textAlign: 'center', marginTop: 100, color: '#999' }}>Booking not found.</Text>;

  const isPending   = booking.booking_status === 'Pending';
  const hasTransport = Number(booking.transport_amount) > 0;
  const statusColor = STATUS_COLOR[booking.booking_status] || '#333';
  const statusBg    = STATUS_BG[booking.booking_status]    || '#F5F5F5';

  return (
    <ScrollView
        style={styles.container} contentContainerStyle={{ flexGrow: 1, paddingBottom: 120 }} showsVerticalScrollIndicator={true}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← My Bookings</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Details</Text>
        <Text style={styles.headerSub}>Booking #{booking.booking_id}</Text>
      </View>

      {/* Status Badge */}
      <View style={[styles.statusBanner, { backgroundColor: statusBg }]}>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <Text style={[styles.statusText, { color: statusColor }]}>
          {booking.booking_status}
        </Text>
        {isPending && !hasTransport && (
          <Text style={styles.statusHint}>  · Add transport or pay to confirm</Text>
        )}
        {isPending && hasTransport && (
          <Text style={styles.statusHint}>  · Transport added · Ready to pay</Text>
        )}
      </View>

      {/* Package Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🧳 Package</Text>
        <View style={styles.card}>
          <Text style={styles.pkgName}>{booking.package_title || 'Tour Package'}</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>📅 Travel Date</Text>
              <Text style={styles.infoVal}>{booking.travel_date?.split('T')[0] || '—'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>👥 Adults</Text>
              <Text style={styles.infoVal}>{booking.num_adults || 1}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>🧒 Children</Text>
              <Text style={styles.infoVal}>{booking.num_children || 0}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>🌴 Destination</Text>
              <Text style={styles.infoVal}>Sri Lanka</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Price Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💰 Price Breakdown</Text>
        <View style={styles.card}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Package Amount</Text>
            <Text style={styles.priceVal}>LKR {Number(booking.base_amount || 0).toLocaleString()}</Text>
          </View>

          {hasTransport && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>🚗 Transport</Text>
              <Text style={styles.priceVal}>LKR {Number(booking.transport_amount).toLocaleString()}</Text>
            </View>
          )}

          {Number(booking.discount_amount) > 0 && (
            <View style={styles.priceRow}>
              <Text style={[styles.priceLabel, { color: '#27AE60' }]}>🏷️ Discount</Text>
              <Text style={[styles.priceVal, { color: '#27AE60' }]}>
                − LKR {Number(booking.discount_amount).toLocaleString()}
              </Text>
            </View>
          )}

          <View style={styles.priceDivider} />
          <View style={styles.priceRow}>
            <Text style={styles.priceTotalLabel}>Total Payable</Text>
            <Text style={styles.priceTotalVal}>
              LKR {Number(booking.final_amount || booking.base_amount || 0).toLocaleString()}
            </Text>
          </View>
        </View>
      </View>

      {/* Transport Section — only shown for Pending bookings */}
      {isPending && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🚗 Transport & Schedule</Text>

          {hasTransport ? (
            /* Transport already added */
            <View style={styles.transportAddedCard}>
              <Text style={styles.transportAddedIcon}>✅</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.transportAddedTitle}>Transport Added</Text>
                <Text style={styles.transportAddedSub}>
                  LKR {Number(booking.transport_amount).toLocaleString()} · Included in total
                </Text>
              </View>
            </View>
          ) : (
            /* Offer to add transport */
            <View style={styles.transportCard}>
              <Text style={styles.transportCardIcon}>🚌</Text>
              <Text style={styles.transportCardTitle}>Add Transport & Schedule</Text>
              <Text style={styles.transportCardSub}>
                Choose a vehicle and route for your Sri Lanka trip. Completely optional — you can skip if you have your own transport.
              </Text>
              <View style={styles.transportBtnRow}>
                <TouchableOpacity style={styles.addTransportBtn} onPress={handleAddTransport} activeOpacity={0.85}>
                  <Text style={styles.addTransportBtnText}>+ Add Transport</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Action Buttons */}
      {isPending && (
        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.payBtn} onPress={handlePayNow} activeOpacity={0.85}>
            <Text style={styles.payBtnText}>
              {hasTransport ? '💳  Pay Now (Package + Transport)' : '💳  Pay Now (Package Only)'}
            </Text>
            <Text style={styles.payBtnSub}>
              Total: LKR {Number(booking.final_amount || booking.base_amount || 0).toLocaleString()}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} activeOpacity={0.85}>
            <Text style={styles.cancelBtnText}>✕  Cancel Booking</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Confirmed / Completed state */}
      {!isPending && booking.booking_status !== 'Cancelled' && (
        <View style={styles.confirmedBanner}>
          <Text style={styles.confirmedIcon}>
            {booking.booking_status === 'Confirmed' ? '🎉' : '✅'}
          </Text>
          <Text style={styles.confirmedTitle}>
            {booking.booking_status === 'Confirmed' ? 'Booking Confirmed!' : 'Trip Completed!'}
          </Text>
          <Text style={styles.confirmedSub}>
            {booking.booking_status === 'Confirmed'
              ? 'Your Sri Lanka tour is confirmed. Have a wonderful trip!'
              : 'Thank you for visiting Sri Lanka! We hope you had a great time.'}
          </Text>

          <TouchableOpacity 
            style={styles.feedbackBtn} 
            onPress={() => navigation.navigate('Feedback', { 
              booking_id: booking.booking_id
            })}
          >
            <Text style={styles.feedbackBtnText}>⭐ Give Feedback</Text>
          </TouchableOpacity>
        </View>
      )}
      </ScrollView>
    
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },

  header: {
    backgroundColor: '#0D5F8A',
    paddingTop: 55, paddingBottom: 24, paddingHorizontal: 20,
  },
  backBtn:     { marginBottom: 14 },
  backText:    { color: '#87CEEB', fontSize: 15, fontWeight: '600' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  headerSub:   { fontSize: 13, color: '#87CEEB' },

  statusBanner: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#EEE',
  },
  statusDot:  { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  statusText: { fontSize: 14, fontWeight: '700' },
  statusHint: { fontSize: 12, color: '#888' },

  section:      { paddingHorizontal: 16, marginTop: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#555', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },

  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07,
  },
  pkgName: { fontSize: 17, fontWeight: 'bold', color: '#1A3A4A', marginBottom: 14 },

  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  infoItem: { width: '47%', backgroundColor: '#F5F7FA', borderRadius: 10, padding: 12 },
  infoLabel:{ fontSize: 11, color: '#999', marginBottom: 4 },
  infoVal:  { fontSize: 14, fontWeight: '700', color: '#333' },

  priceRow:       { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  priceLabel:     { fontSize: 14, color: '#666' },
  priceVal:       { fontSize: 14, fontWeight: '600', color: '#333' },
  priceDivider:   { height: 1, backgroundColor: '#EEE', marginVertical: 10 },
  priceTotalLabel:{ fontSize: 16, fontWeight: 'bold', color: '#333' },
  priceTotalVal:  { fontSize: 18, fontWeight: 'bold', color: '#0D5F8A' },

  // Transport added
  transportAddedCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#EAFAF1', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: '#A9DFBF',
  },
  transportAddedIcon:  { fontSize: 28, marginRight: 14 },
  transportAddedTitle: { fontSize: 15, fontWeight: 'bold', color: '#27AE60', marginBottom: 2 },
  transportAddedSub:   { fontSize: 12, color: '#7DCEA0' },

  // Transport offer card
  transportCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 18,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07,
    borderWidth: 1.5, borderColor: '#D0E8F5', borderStyle: 'dashed',
  },
  transportCardIcon:  { fontSize: 36, marginBottom: 10 },
  transportCardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1A3A4A', marginBottom: 6 },
  transportCardSub:   { fontSize: 13, color: '#777', lineHeight: 20, marginBottom: 14 },
  transportBtnRow:    { flexDirection: 'row' },
  addTransportBtn: {
    backgroundColor: '#0D5F8A', borderRadius: 10,
    paddingVertical: 12, paddingHorizontal: 20, alignItems: 'center',
  },
  addTransportBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Action buttons
  actionSection: { paddingHorizontal: 16, marginTop: 24, gap: 12 },
  payBtn: {
    backgroundColor: '#27AE60', borderRadius: 14,
    paddingVertical: 18, alignItems: 'center',
    elevation: 4, shadowColor: '#27AE60', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35,
  },
  payBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  payBtnSub:  { color: 'rgba(255,255,255,0.75)', fontSize: 11, marginTop: 3 },
  cancelBtn: {
    borderWidth: 1.5, borderColor: '#E74C3C',
    borderRadius: 14, paddingVertical: 14, alignItems: 'center',
  },
  cancelBtnText: { color: '#E74C3C', fontWeight: '700', fontSize: 14 },

  // Confirmed
  confirmedBanner: {
    marginHorizontal: 16, marginTop: 20,
    backgroundColor: '#EAFAF1', borderRadius: 16, padding: 24, alignItems: 'center',
    borderWidth: 1, borderColor: '#A9DFBF',
  },
  confirmedIcon:  { fontSize: 44, marginBottom: 10 },
  confirmedTitle: { fontSize: 20, fontWeight: 'bold', color: '#27AE60', marginBottom: 8 },
  confirmedSub:   { fontSize: 13, color: '#7DCEA0', textAlign: 'center', lineHeight: 20, marginBottom: 16 },
  feedbackBtn: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#27AE60',
  },
  feedbackBtnText: { color: '#27AE60', fontWeight: 'bold', fontSize: 14 },
});
