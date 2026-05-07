import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Image, Dimensions
} from 'react-native';
import API from '../services/api';
import { useFocusEffect } from '@react-navigation/native';
import { resolveImageUrl } from '../utils/imageUtils';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function PackageBookingScreen({ route, navigation }) {
  const { package_id, package_title, price_per_person, duration_days } = route.params;

  const today = new Date().toISOString().split('T')[0];
  const [date, setDate]         = useState(today);
  const [adults, setAdults]     = useState('1');
  const [children, setChildren] = useState('0');
  const [loading, setLoading]   = useState(false);
  
  const [hotels, setHotels] = useState([]);
  const [guides, setGuides] = useState([]);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [selectedGuide, setSelectedGuide] = useState(null);

  React.useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      const [hRes, gRes] = await Promise.all([
        API.get('/providers?type=Hotel'),
        API.get('/providers?type=Tour_Guide')
      ]);
      setHotels(hRes.data.data?.providers || []);
      setGuides(gRes.data.data?.providers || []);
    } catch (e) { console.log('Fetch error:', e); }
  };

  const numAdults   = Math.max(1, parseInt(adults)   || 1);
  const numChildren = Math.max(0, parseInt(children) || 0);
  const baseAmount  = numAdults * Number(price_per_person);

  const handleConfirmBooking = async () => {
    if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return Alert.alert('Invalid Date', 'Please enter the date in YYYY-MM-DD format.\nExample: 2026-06-15');
    }
    if (new Date(date) < new Date(today)) {
      return Alert.alert('Invalid Date', 'Travel date cannot be in the past.');
    }

    setLoading(true);
    try {
      const res = await API.post('/bookings', {
        booking_type: 'Package',
        package_id,
        travel_date:  date,
        num_adults:   numAdults,
        num_children: numChildren,
        hotel_id:     selectedHotel?.provider_id,
        guide_id:     selectedGuide?.provider_id,
      });

      const booking = res.data.data;
      navigation.navigate('TransportSelection', { 
        booking_id:   booking.booking_id,
        package_id,
        package_title,
        duration_days,
        travel_date:  date,
        num_adults:   numAdults,
        num_children: numChildren,
        base_amount:  booking.base_amount,
      });
    } catch (e) {
      const msg = e.response?.data?.message || 'Booking failed. Please try again.';
      Alert.alert('Booking Error', msg);
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={Platform.OS === 'web' ? { height: webHeight, overflow: 'hidden', flex: 1 } : { flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container} 
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 120 }} 
        keyboardShouldPersistTaps="handled" 
        showsVerticalScrollIndicator={true}
      >

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.stepBadge}>Step 1 — Book Package</Text>
          <Text style={styles.headerTitle}>Booking Details</Text>
          <Text style={styles.headerSub}>Fill in your travel details to confirm the booking</Text>
        </View>

        {/* Package Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏝️ Selected Package</Text>
          <View style={styles.pkgCard}>
            <Text style={styles.pkgName}>{package_title}</Text>
            <View style={styles.pkgMeta}>
              <View style={styles.pkgMetaItem}>
                <Text style={styles.pkgMetaLabel}>Duration</Text>
                <Text style={styles.pkgMetaVal}>{duration_days} Days</Text>
              </View>
              <View style={styles.pkgMetaDivider} />
              <View style={styles.pkgMetaItem}>
                <Text style={styles.pkgMetaLabel}>Price/Person</Text>
                <Text style={styles.pkgMetaVal}>LKR {Number(price_per_person).toLocaleString()}</Text>
              </View>
              <View style={styles.pkgMetaDivider} />
              <View style={styles.pkgMetaItem}>
                <Text style={styles.pkgMetaLabel}>Destination</Text>
                <Text style={styles.pkgMetaVal}>🇱🇰 Sri Lanka</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Travel Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 Travel Details</Text>
          <View style={styles.card}>
            <Text style={styles.inputLabel}>Departure Airport</Text>
            <View style={styles.readonlyBox}>
              <Text style={styles.readonlyText}>✈️  Bandaranaike International Airport, Colombo</Text>
            </View>

            <Text style={styles.inputLabel}>Travel Start Date <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD  (e.g. 2026-06-15)"
              placeholderTextColor="#aaa"
              keyboardType="numbers-and-punctuation"
            />

            <View style={styles.row}>
              <View style={styles.halfCol}>
                <Text style={styles.inputLabel}>Adults <Text style={styles.required}>*</Text></Text>
                <View style={styles.counterRow}>
                  <TouchableOpacity style={styles.counterBtn} onPress={() => setAdults(String(Math.max(1, numAdults - 1)))}>
                    <Text style={styles.counterBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.counterVal}>{adults}</Text>
                  <TouchableOpacity style={styles.counterBtn} onPress={() => setAdults(String(numAdults + 1))}>
                    <Text style={styles.counterBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.halfCol}>
                <Text style={styles.inputLabel}>Children</Text>
                <View style={styles.counterRow}>
                  <TouchableOpacity style={styles.counterBtn} onPress={() => setChildren(String(Math.max(0, numChildren - 1)))}>
                    <Text style={styles.counterBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.counterVal}>{children}</Text>
                  <TouchableOpacity style={styles.counterBtn} onPress={() => setChildren(String(numChildren + 1))}>
                    <Text style={styles.counterBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Hotel & Guide Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏨 Select Premium Hotel</Text>
          <Text style={styles.sectionSub}>Pick your preferred stay for the tour</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
            {hotels.map(h => (
              <TouchableOpacity key={h.provider_id} 
                style={[styles.resCard, selectedHotel?.provider_id === h.provider_id && styles.resCardActive]}
                onPress={() => setSelectedHotel(h)}
              >
                <View style={styles.resIconBox}>
                  {h.image_url ? (
                    <Image source={{ uri: resolveImageUrl(h.image_url) }} style={styles.resImage} />
                  ) : (
                    <Text style={styles.resEmoji}>🏨</Text>
                  )}
                </View>
                <Text style={styles.resName} numberOfLines={2}>{h.business_name || h.name}</Text>
                <View style={styles.resPriceBox}>
                  <Text style={styles.resPriceLabel}>From</Text>
                  <Text style={styles.resPriceVal}>LKR 15,000</Text>
                </View>
                {selectedHotel?.provider_id === h.provider_id && (
                  <View style={styles.selBadge}><Text style={styles.selText}>✓ Selected</Text></View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🧑‍✈️ Select Expert Guide</Text>
          <Text style={styles.sectionSub}>Friendly local guides to enhance your trip</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
            {guides.map(g => (
              <TouchableOpacity key={g.provider_id} 
                style={[styles.resCard, selectedGuide?.provider_id === g.provider_id && styles.resCardActive]}
                onPress={() => setSelectedGuide(g)}
              >
                <View style={[styles.resIconBox, { backgroundColor: '#F0E6FF' }]}>
                  {g.image_url ? (
                    <Image source={{ uri: resolveImageUrl(g.image_url) }} style={styles.resImage} />
                  ) : (
                    <Text style={styles.resEmoji}>🧑‍✈️</Text>
                  )}
                </View>
                <Text style={styles.resName} numberOfLines={2}>{g.business_name || g.name}</Text>
                <View style={styles.resPriceBox}>
                  <Text style={styles.resPriceLabel}>From</Text>
                  <Text style={styles.resPriceVal}>LKR 5,000</Text>
                </View>
                {selectedGuide?.provider_id === g.provider_id && (
                  <View style={[styles.selBadge, { backgroundColor: '#8E44AD' }]}><Text style={styles.selText}>✓ Selected</Text></View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Price Preview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💰 Price Preview</Text>
          <View style={styles.priceCard}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>
                {numAdults} Adult{numAdults > 1 ? 's' : ''} × LKR {Number(price_per_person).toLocaleString()}
              </Text>
              <Text style={styles.priceVal}>LKR {baseAmount.toLocaleString()}</Text>
            </View>
            {numChildren > 0 && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>{numChildren} Child{numChildren > 1 ? 'ren' : ''} (50% rate)</Text>
                <Text style={styles.priceVal}>
                  LKR {(numChildren * Number(price_per_person) * 0.5).toLocaleString()}
                </Text>
              </View>
            )}
            <View style={styles.priceDivider} />
            <View style={styles.priceRow}>
              <Text style={styles.priceTotalLabel}>Package Total</Text>
              <Text style={styles.priceTotalVal}>LKR {(baseAmount + (selectedHotel ? 15000 : 0) + (selectedGuide ? 5000 : 0)).toLocaleString()}</Text>
            </View>
            <Text style={styles.priceNote}>
              * Hotel and Guide charges are added to the base package price
            </Text>
          </View>
        </View>

        {/* Info Note */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            📌  Next step: Select your preferred Transport & Schedule.
          </Text>
        </View>

        {/* Confirm Button */}
        <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirmBooking} disabled={loading} activeOpacity={0.85}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <>
                <Text style={styles.confirmBtnText}>Next Step: Transport →</Text>
                <Text style={styles.confirmBtnSub}>Continue to transport selection</Text>
              </>
          }
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },

  header: {
    backgroundColor: '#0D5F8A',
    paddingTop: 55, paddingBottom: 28, paddingHorizontal: 20,
  },
  backBtn:    { marginBottom: 12 },
  backText:   { color: '#87CEEB', fontSize: 15, fontWeight: '600' },
  stepBadge:  {
    alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.18)',
    color: '#fff', fontSize: 11, fontWeight: '700',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginBottom: 8, overflow: 'hidden',
  },
  headerTitle: { fontSize: 26, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  headerSub:   { fontSize: 13, color: '#87CEEB' },

  section:      { paddingHorizontal: 16, marginTop: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#555', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },

  pkgCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07 },
  pkgName: { fontSize: 17, fontWeight: 'bold', color: '#1A3A4A', marginBottom: 14 },
  pkgMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  pkgMetaItem:   { flex: 1, alignItems: 'center' },
  pkgMetaLabel:  { fontSize: 11, color: '#999', marginBottom: 4 },
  pkgMetaVal:    { fontSize: 13, fontWeight: '700', color: '#0D5F8A' },
  pkgMetaDivider:{ width: 1, backgroundColor: '#EEE', marginHorizontal: 8 },

  card: { backgroundColor: '#fff', borderRadius: 14, padding: 18, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07 },
  inputLabel:  { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6 },
  required:    { color: '#E74C3C' },
  readonlyBox: { backgroundColor: '#F0F8FF', borderRadius: 10, padding: 13, marginBottom: 18, borderWidth: 1, borderColor: '#D0E8F5' },
  readonlyText:{ color: '#0D5F8A', fontSize: 13, fontWeight: '500' },
  input: { backgroundColor: '#F9F9F9', borderRadius: 10, padding: 14, marginBottom: 18, borderWidth: 1, borderColor: '#E0E0E0', fontSize: 15, color: '#333' },
  row:     { flexDirection: 'row', gap: 12 },
  halfCol: { flex: 1 },
  counterRow:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9F9F9', borderRadius: 10, borderWidth: 1, borderColor: '#E0E0E0', overflow: 'hidden' },
  counterBtn:    { width: 44, height: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EDF4F8' },
  counterBtnText:{ fontSize: 20, color: '#0D5F8A', fontWeight: 'bold' },
  counterVal:    { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: 'bold', color: '#333' },

  priceCard:       { backgroundColor: '#fff', borderRadius: 14, padding: 18, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07 },
  priceRow:        { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  priceLabel:      { fontSize: 14, color: '#666' },
  priceVal:        { fontSize: 14, fontWeight: '600', color: '#333' },
  priceDivider:    { height: 1, backgroundColor: '#EEE', marginVertical: 10 },
  priceTotalLabel: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  priceTotalVal:   { fontSize: 17, fontWeight: 'bold', color: '#0D5F8A' },
  priceNote:       { fontSize: 11, color: '#AAA', marginTop: 10, fontStyle: 'italic' },

  infoBox: {
    marginHorizontal: 16, marginTop: 16,
    backgroundColor: '#FFF8E7', borderRadius: 12, padding: 14,
    borderLeftWidth: 4, borderLeftColor: '#F39C12',
  },
  infoText: { color: '#7D5C00', fontSize: 13, lineHeight: 20 },

  confirmBtn: {
    backgroundColor: '#0D5F8A', marginHorizontal: 16, marginTop: 24,
    paddingVertical: 18, borderRadius: 14, alignItems: 'center',
    elevation: 4, shadowColor: '#0D5F8A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35,
  },
  confirmBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 17 },
  confirmBtnSub:  { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 3 },

  resCard: { 
    width: 160, backgroundColor: '#fff', borderRadius: 18, padding: 15, 
    marginRight: 15, borderWidth: 2, borderColor: '#F0F0F0', elevation: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08,
  },
  resCardActive: { borderColor: '#0D5F8A', backgroundColor: '#F4FAFD' },
  resIconBox: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#E1F5FE', alignItems: 'center', justifyContent: 'center', marginBottom: 12, overflow: 'hidden' },
  resImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  resEmoji: { fontSize: 24 },
  resName:  { fontSize: 14, fontWeight: 'bold', color: '#1A3A4A', marginBottom: 8, height: 36 },
  resPriceBox: { marginTop: 4 },
  resPriceLabel: { fontSize: 10, color: '#999', textTransform: 'uppercase' },
  resPriceVal: { fontSize: 13, fontWeight: '700', color: '#0D5F8A' },
  selBadge: { position: 'absolute', top: 10, right: 10, backgroundColor: '#27AE60', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  selText: { color: '#fff', fontSize: 9, fontWeight: 'bold' },
  sectionSub: { fontSize: 12, color: '#999', marginTop: -6, marginBottom: 4 },
});
