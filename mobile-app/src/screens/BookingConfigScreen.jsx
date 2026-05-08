import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, 
  ActivityIndicator, Alert, RefreshControl, Platform, Dimensions
} from 'react-native';
import API from '../services/api';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function BookingConfigScreen({ route, navigation }) {
  const { 
    booking_id, base_amount, transport_amount, title, 
    vehicle_label, route_label, duration_days 
  } = route.params;

  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState([]);
  const [selectedSched, setSelectedSched] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      const res = await API.get('/transport/schedules');
      setSchedules(res.data.data?.schedules || []);
    } catch (e) {
      console.log('Fetch schedules error:', e);
    }
    setLoading(false);
  };

  const handleSkip = () => {
    goToPayment(null);
  };

  const handleConfirm = () => {
    if (!selectedSched) return Alert.alert('Selection Required', 'Please select a schedule or skip.');
    goToPayment(selectedSched);
  };

  const goToPayment = (sched) => {
    navigation.navigate('Payment', {
      booking_id,
      base_amount,
      transport_amount,
      title,
      vehicle_label,
      route_label,
      duration_days,
      schedule_title: sched ? sched.title : 'Standard Schedule',
      final_amount: Number(base_amount) + Number(transport_amount)
    });
  };

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#0D5F8A" />
    </View>
  );

  return (
    <View style={[styles.container, StyleSheet.absoluteFill]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.stepBadge}>Step 3 — Schedule</Text>
        <Text style={styles.headerTitle}>Select Schedule</Text>
        <Text style={styles.headerSub}>Choose a travel plan or skip for default</Text>
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 20, paddingBottom: 150 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={true}>
        <Text style={styles.sectionTitle}>Available Schedules</Text>
        {schedules.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No custom schedules available.</Text>
            <Text style={styles.emptySub}>You can proceed with the default itinerary.</Text>
          </View>
        ) : (
          schedules.map(s => (
            <TouchableOpacity 
              key={s.schedule_id}
              style={[styles.schedCard, selectedSched?.schedule_id === s.schedule_id && styles.schedCardActive]}
              onPress={() => setSelectedSched(s)}
            >
              <View style={styles.schedHeader}>
                <Text style={styles.schedEmoji}>📅</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.schedTitle}>{s.title}</Text>
                  <Text style={styles.schedLoc}>{s.departure_location} → {s.arrival_location}</Text>
                </View>
              </View>
              <View style={styles.schedDivider} />
              <View style={styles.schedInfo}>
                <Text style={styles.schedText}>🕒 Starts: {new Date(s.departure_time).toLocaleDateString()}</Text>
                <Text style={styles.schedText}>📏 Distance: {s.total_distance_km} km</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip Schedule</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.confirmBtn, !selectedSched && styles.confirmBtnDisabled]} 
          onPress={handleConfirm}
          disabled={!selectedSched}
        >
          <Text style={styles.confirmText}>Next: Payment →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: '#0D5F8A', paddingTop: 55, paddingBottom: 28, paddingHorizontal: 20
  },
  backBtn:   { marginBottom: 12 },
  backText:  { color: '#87CEEB', fontSize: 15, fontWeight: '600' },
  stepBadge: {
    alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.18)',
    color: '#fff', fontSize: 11, fontWeight: '700', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginBottom: 8
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  headerSub:   { fontSize: 13, color: '#87CEEB' },

  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#555', textTransform: 'uppercase', marginBottom: 15 },
  schedCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, elevation: 2,
    borderWidth: 2, borderColor: 'transparent'
  },
  schedCardActive: { borderColor: '#0D5F8A', backgroundColor: '#F0F8FF' },
  schedHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  schedEmoji:  { fontSize: 28, marginRight: 15 },
  schedTitle:  { fontSize: 16, fontWeight: 'bold', color: '#1A3A4A' },
  schedLoc:    { fontSize: 12, color: '#666', marginTop: 2 },
  schedDivider:{ height: 1, backgroundColor: '#EEE', marginVertical: 12 },
  schedInfo:   { flexDirection: 'row', justifyContent: 'space-between' },
  schedText:   { fontSize: 11, color: '#888' },

  emptyBox: { backgroundColor: '#fff', borderRadius: 14, padding: 30, alignItems: 'center', elevation: 1 },
  emptyText: { fontWeight: 'bold', color: '#333', marginBottom: 5 },
  emptySub:  { fontSize: 12, color: '#999', textAlign: 'center' },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#EEE', gap: 10
  },
  skipBtn: { flex: 1, paddingVertical: 16, borderRadius: 12, borderWidth: 2, borderColor: '#0D5F8A', alignItems: 'center' },
  skipText: { color: '#0D5F8A', fontWeight: 'bold' },
  confirmBtn: { flex: 1.5, paddingVertical: 16, borderRadius: 12, backgroundColor: '#27AE60', alignItems: 'center' },
  confirmBtnDisabled: { backgroundColor: '#B0C4CE' },
  confirmText: { color: '#fff', fontWeight: 'bold' }
});
