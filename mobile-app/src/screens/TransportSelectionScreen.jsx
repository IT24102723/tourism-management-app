import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert, Platform, Dimensions,
} from 'react-native';
import API from '../services/api';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const vehicleEmoji = { Bus: '🚌', Van: '🚐', Jeep: '🚙', Car: '🚗', Truck: '🚚' };

const SL_ROUTES = [
  { label: 'Colombo → Kandy',        km: 116,  icon: '🏯' },
  { label: 'Colombo → Galle',        km: 126,  icon: '🏰' },
  { label: 'Colombo → Sigiriya',     km: 170,  icon: '🗿' },
  { label: 'Colombo → Nuwara Eliya', km: 181,  icon: '🌿' },
  { label: 'Colombo → Yala',         km: 305,  icon: '🐆' },
  { label: 'Colombo → Trincomalee',  km: 257,  icon: '🏖️' },
];

export default function TransportSelectionScreen({ route, navigation }) {
  const {
    booking_id,
    package_id,
    package_title,
    duration_days,
    travel_date,
    num_adults,
    num_children,
    base_amount,
  } = route.params || {};

  // Ensure numeric values to prevent NaN
  const safeBaseAmount = Number(base_amount) || 0;
  const safeDuration   = Number(duration_days) || 1;
  const safeTravelDate = travel_date || new Date().toISOString().split('T')[0];

  const [vehicles, setVehicles]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [selected, setSelected]     = useState(null);
  const [selectedRoute, setRoute]   = useState(SL_ROUTES[0]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchVehicles(); }, []);

  const fetchVehicles = async () => {
    try {
      const res = await API.get('/transport/vehicles?available=true');
      setVehicles(res.data.data?.vehicles || []);
    } catch (e) {
      console.log('Failed fetching vehicles', e);
    }
    setLoading(false);
  };

  const transportEstimate = selected
    ? Number(selected.rental_price_per_day || 0) * safeDuration
    : 0;

  const handleSkip = () => {
    navigation.navigate('BookingConfig', {
      booking_id,
      base_amount:      safeBaseAmount,
      transport_amount: 0,
      title:            package_title,
      duration_days:    safeDuration,
    });
  };

  const handleConfirm = async () => {
    if (!selected) {
      return Alert.alert('No Vehicle Selected', 'Please select a vehicle or tap "Skip".');
    }
    setSubmitting(true);
    try {
      // 1. Create the transport schedule
      const depDate = new Date(`${safeTravelDate}T08:00:00.000Z`);
      const arrDate = new Date(depDate.getTime() + safeDuration * 86400000);

      const schedRes = await API.post('/transport/schedules', {
        package_id,
        vehicle_id:         selected.vehicle_id,
        title:              `Transport — ${selectedRoute.label}`,
        departure_location: 'Bandaranaike International Airport, Colombo',
        arrival_location:   selectedRoute.label.split('→')[1]?.trim() || 'Tour Destination',
        departure_time:     depDate.toISOString(),
        arrival_time:       arrDate.toISOString(),
        total_distance_km:  selectedRoute.km,
      });
      const schedule_id = schedRes.data.data.schedule_id;

      // 2. Attach transport to the existing booking
      const updateRes = await API.patch(`/bookings/${booking_id}/add-transport`, {
        schedule_id,
        transport_amount: transportEstimate,
      });

      const updated = updateRes.data.data;

      // 3. Go to schedule with updated totals
      navigation.navigate('BookingConfig', {
        booking_id,
        base_amount:      updated.base_amount,
        transport_amount: updated.transport_amount,
        title:            package_title,
        vehicle_label:    `${selected.vehicle_type} (${selected.vehicle_name || selected.license_plate})`,
        route_label:      selectedRoute.label,
        duration_days:    safeDuration,
      });
    } catch (e) {
      const msg = e.response?.data?.errors?.[0]?.msg
        || e.response?.data?.message
        || 'Something went wrong. Please try again.';
      Alert.alert('Error', msg);
    }
    setSubmitting(false);
  };

  const totalIfBooked = safeBaseAmount + transportEstimate;

  return (
    <View style={Platform.OS === 'web' ? { height: webHeight, overflow: 'hidden', backgroundColor: '#F5F7FA' } : styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.stepBadge}>Optional Step — Transport</Text>
        <Text style={styles.headerTitle}>Add Transport & Schedule</Text>
        <Text style={styles.headerSub}>Choose a vehicle and route, or skip</Text>
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 150 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={true}>
        {/* Booking recap */}
        <View style={styles.recap}>
          <Text style={styles.recapTitle}>{package_title}</Text>
          <Text style={styles.recapSub}>
            📅 {safeTravelDate}  •  👤 {num_adults} Adult{num_adults > 1 ? 's' : ''}
            {num_children > 0 ? `  •  🧒 ${num_children} Child${num_children > 1 ? 'ren' : ''}` : ''}
          </Text>
          <Text style={styles.recapSub}>🧳 Package: LKR {safeBaseAmount.toLocaleString()}</Text>
        </View>

        {/* Route Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Select Route</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {SL_ROUTES.map((r, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.routeChip, selectedRoute.label === r.label && styles.routeChipActive]}
                onPress={() => setRoute(r)}
              >
                <Text style={styles.routeEmoji}>{r.icon}</Text>
                <Text style={[styles.routeText, selectedRoute.label === r.label && styles.routeTextActive]}>
                  {r.label}
                </Text>
                <Text style={[styles.routeKm, selectedRoute.label === r.label && { color: '#fff' }]}>
                  {r.km} km
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Vehicle Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🚗 Choose Vehicle</Text>

          {loading ? (
            <ActivityIndicator color="#0D5F8A" style={{ marginTop: 20 }} />
          ) : vehicles.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No vehicles available right now.</Text>
              <Text style={styles.emptySubText}>You can skip and pay for the package only.</Text>
            </View>
          ) : (
            vehicles.map(v => {
              const dayRate  = Number(v.rental_price_per_day || 0);
              const estimate = dayRate * safeDuration;
              const isActive = selected?.vehicle_id === v.vehicle_id;

              return (
                <TouchableOpacity
                  key={v.vehicle_id}
                  style={[styles.vehicleCard, isActive && styles.vehicleCardActive]}
                  onPress={() => setSelected(isActive ? null : v)}
                  activeOpacity={0.8}
                >
                  <View style={styles.vehicleRow}>
                    <Text style={styles.vehicleEmoji}>{vehicleEmoji[v.vehicle_type] || '🚗'}</Text>
                    <View style={styles.vehicleInfo}>
                      <Text style={[styles.vehicleName, isActive && { color: '#0D5F8A' }]}>
                        {v.vehicle_name || v.vehicle_type}
                      </Text>
                      <Text style={styles.vehicleSub}>
                        {v.capacity} Seats  •  {v.is_airconditioned ? '❄️ A/C' : '🌬️ Non A/C'}
                      </Text>
                      {v.license_plate && <Text style={styles.vehiclePlate}>🪪 {v.license_plate}</Text>}
                    </View>
                    {isActive && (
                      <View style={styles.checkBadge}>
                        <Text style={styles.checkText}>✓</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.vehiclePriceRow}>
                    <View>
                      <Text style={styles.vehicleRateLabel}>Daily Rate</Text>
                      <Text style={styles.vehicleRate}>LKR {dayRate.toLocaleString()} / day</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.vehicleRateLabel}>
                        Est. for {safeDuration} day{safeDuration > 1 ? 's' : ''}
                      </Text>
                      <Text style={[styles.vehicleEstimate, isActive && { color: '#0D5F8A' }]}>
                        LKR {estimate.toLocaleString()}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Updated total preview */}
        {selected && (
          <View style={[styles.section, { marginTop: 4 }]}>
            <View style={styles.totalCard}>
              <Text style={styles.totalTitle}>💳 Updated Total</Text>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Package Amount</Text>
                <Text style={styles.totalVal}>LKR {safeBaseAmount.toLocaleString()}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Transport ({safeDuration} days)</Text>
                <Text style={styles.totalVal}>LKR {transportEstimate.toLocaleString()}</Text>
              </View>
              <View style={styles.totalDivider} />
              <View style={styles.totalRow}>
                <Text style={styles.grandLabel}>Total Payable</Text>
                <Text style={styles.grandVal}>LKR {totalIfBooked.toLocaleString()}</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Sticky Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip — Pay Package Only</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.confirmBtn, (!selected || submitting) && styles.confirmBtnDisabled]}
          onPress={handleConfirm}
          disabled={submitting || !selected}
          activeOpacity={0.85}
        >
          {submitting
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.confirmText}>
                {selected ? 'Next: Schedule →' : 'Select Vehicle First'}
              </Text>
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },

  header: {
    backgroundColor: '#0D5F8A',
    paddingTop: 55, paddingBottom: 28, paddingHorizontal: 20,
  },
  backBtn:   { marginBottom: 12 },
  backText:  { color: '#87CEEB', fontSize: 15, fontWeight: '600' },
  stepBadge: {
    alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.18)',
    color: '#fff', fontSize: 11, fontWeight: '700',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginBottom: 8, overflow: 'hidden',
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  headerSub:   { fontSize: 13, color: '#87CEEB' },

  recap: {
    backgroundColor: '#fff', margin: 16, borderRadius: 12, padding: 14,
    elevation: 1, borderLeftWidth: 4, borderLeftColor: '#0D5F8A',
  },
  recapTitle: { fontSize: 15, fontWeight: 'bold', color: '#1A3A4A', marginBottom: 4 },
  recapSub:   { fontSize: 12, color: '#666', marginBottom: 2 },

  section:      { paddingHorizontal: 16, marginTop: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#555', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },

  routeChip: {
    backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
    marginRight: 10, borderWidth: 1.5, borderColor: '#E0E0E0', alignItems: 'center', minWidth: 140,
  },
  routeChipActive: { borderColor: '#0D5F8A', backgroundColor: '#0D5F8A' },
  routeEmoji:      { fontSize: 20, marginBottom: 4 },
  routeText:       { fontSize: 11, fontWeight: '600', color: '#333', textAlign: 'center' },
  routeTextActive: { color: '#fff' },
  routeKm:         { fontSize: 10, color: '#999', marginTop: 2 },

  vehicleCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12,
    borderWidth: 2, borderColor: 'transparent', elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07,
  },
  vehicleCardActive: { borderColor: '#0D5F8A', backgroundColor: '#F0F8FF' },
  vehicleRow:   { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  vehicleEmoji: { fontSize: 36, marginRight: 14 },
  vehicleInfo:  { flex: 1 },
  vehicleName:  { fontSize: 16, fontWeight: 'bold', color: '#333' },
  vehicleSub:   { fontSize: 12, color: '#777', marginTop: 3 },
  vehiclePlate: { fontSize: 11, color: '#AAA', marginTop: 2 },
  checkBadge:   { width: 28, height: 28, borderRadius: 14, backgroundColor: '#0D5F8A', alignItems: 'center', justifyContent: 'center' },
  checkText:    { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  vehiclePriceRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    backgroundColor: '#F9F9F9', borderRadius: 10, padding: 12,
  },
  vehicleRateLabel:{ fontSize: 10, color: '#999', marginBottom: 2 },
  vehicleRate:     { fontSize: 13, fontWeight: '600', color: '#555' },
  vehicleEstimate: { fontSize: 15, fontWeight: 'bold', color: '#27AE60' },

  emptyBox:    { backgroundColor: '#FFF9F0', borderRadius: 12, padding: 20, alignItems: 'center' },
  emptyText:   { color: '#E67E22', fontWeight: '600', fontSize: 14, marginBottom: 4 },
  emptySubText:{ color: '#999', fontSize: 12 },

  totalCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07,
  },
  totalTitle:  { fontSize: 14, fontWeight: '700', color: '#333', marginBottom: 12 },
  totalRow:    { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  totalLabel:  { fontSize: 14, color: '#666' },
  totalVal:    { fontSize: 14, fontWeight: '600', color: '#333' },
  totalDivider:{ height: 1, backgroundColor: '#EEE', marginVertical: 8 },
  grandLabel:  { fontSize: 16, fontWeight: 'bold', color: '#333' },
  grandVal:    { fontSize: 18, fontWeight: 'bold', color: '#0D5F8A' },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', gap: 10,
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#EEE', elevation: 8,
  },
  skipBtn: {
    flex: 1, borderWidth: 2, borderColor: '#0D5F8A',
    borderRadius: 12, paddingVertical: 14, alignItems: 'center',
  },
  skipText:           { color: '#0D5F8A', fontWeight: '700', fontSize: 13 },
  confirmBtn:         { flex: 2, backgroundColor: '#27AE60', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  confirmBtnDisabled: { backgroundColor: '#B0C4CE' },
  confirmText:        { color: '#fff', fontWeight: 'bold', fontSize: 14 },
});
