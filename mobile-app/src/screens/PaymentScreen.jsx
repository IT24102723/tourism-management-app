import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, TextInput, Platform, Dimensions,
} from 'react-native';
import API from '../services/api';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function PaymentScreen({ route, navigation }) {
  const {
    booking_id, base_amount, transport_amount, discount_amount,
    final_amount, title, vehicle_label, route_label, duration_days, schedule_title
  } = route.params;

  const [loading, setLoading] = useState(false);
  const [method, setMethod]   = useState('Credit_Card');
  
  // Demo Card Details
  const [cardNumber, setCardNumber] = useState('4111 1111 1111 1111');
  const [expiry, setExpiry]         = useState('12/26');
  const [cvv, setCvv]               = useState('123');

  const tAmount = Number(transport_amount) || 0;
  const bAmount = Number(base_amount)      || 0;
  const dAmount = Number(discount_amount)  || 0;
  const total   = Number(final_amount)     || (bAmount + tAmount - dAmount);

  const METHODS = [
    { key: 'Credit_Card',    label: 'Card',           emoji: '💳' },
    { key: 'Cash_On_Tour',   label: 'Cash on Tour',   emoji: '💵' },
    { key: 'Bank_Transfer',  label: 'Bank Transfer',  emoji: '🏦' },
  ];

  const handlePayment = async () => {
    setLoading(true);
    try {
      const initRes = await API.post('/payments', {
        booking_id,
        payment_method: method,
        amount: total,
      });
      const payment_id = initRes.data.data.payment_id;
      await API.post(`/payments/${payment_id}/confirm`);

      Alert.alert(
        '🎉 Booking Confirmed!',
        'Your Sri Lanka tour has been successfully booked. Have a wonderful trip! 🌴',
        [{ text: 'View My Bookings', onPress: () => navigation.navigate('Main', { screen: 'Bookings' }) }]
      );
    } catch (e) {
      console.log(e.response?.data);
      Alert.alert('Payment Error', e.response?.data?.message || 'Transaction failed. Please try again.');
    }
    setLoading(false);
  };

  const webHeight = Platform.OS === 'web'
    ? (typeof window !== 'undefined' ? window.innerHeight : SCREEN_HEIGHT)
    : null;

  return (
    <View style={Platform.OS === 'web' ? { height: webHeight, overflow: 'hidden' } : { flex: 1, backgroundColor: '#F5F7FA' }}>
      <ScrollView style={styles.container} contentContainerStyle={{ flexGrow: 1, paddingBottom: 120 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={true}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.stepBadge}>Step 3 of 3</Text>
        <Text style={styles.headerTitle}>Payment</Text>
        <Text style={styles.headerSub}>Complete your booking securely</Text>
      </View>

      {/* Progress Dots */}
      <View style={styles.progress}>
        <View style={[styles.dot, styles.dotDone]} />
        <View style={[styles.line, styles.lineDone]} />
        <View style={[styles.dot, styles.dotDone]} />
        <View style={[styles.line, styles.lineDone]} />
        <View style={[styles.dot, styles.dotActive]} />
      </View>

      {/* Receipt */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🧾 Booking Summary</Text>
        <View style={styles.receipt}>
          <View style={styles.receiptHeader}>
            <Text style={styles.receiptTitle}>{title}</Text>
            <View style={styles.slBadge}>
              <Text style={styles.slBadgeText}>🇱🇰 Sri Lanka</Text>
            </View>
          </View>

          {/* Package row */}
          <View style={styles.receiptRow}>
            <View>
              <Text style={styles.receiptLabel}>🧳 Base Package</Text>
              <Text style={styles.receiptSub}>{title}</Text>
            </View>
            <Text style={styles.receiptVal}>LKR {bAmount.toLocaleString()}</Text>
          </View>

          {/* Hotel & Guide rows (Itemized) */}
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>🏨 Premium Hotel</Text>
            <Text style={styles.receiptVal}>LKR 15,000</Text>
          </View>
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>🧑‍✈️ Expert Guide</Text>
            <Text style={styles.receiptVal}>LKR 5,000</Text>
          </View>

          {/* Transport row */}
          {tAmount > 0 && (
            <View style={styles.receiptRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.receiptLabel}>🚗 Transport & Schedule</Text>
                {vehicle_label && <Text style={styles.receiptSub}>{vehicle_label}</Text>}
                {route_label   && <Text style={styles.receiptSub}>📍 {route_label}</Text>}
                {schedule_title && <Text style={styles.receiptSub}>📅 {schedule_title}</Text>}
              </View>
              <Text style={styles.receiptVal}>LKR {tAmount.toLocaleString()}</Text>
            </View>
          )}

          {/* Discount row */}
          {dAmount > 0 && (
            <View style={styles.receiptRow}>
              <Text style={[styles.receiptLabel, { color: '#27AE60' }]}>🏷️ Discount Applied</Text>
              <Text style={[styles.receiptVal, { color: '#27AE60' }]}>- LKR {dAmount.toLocaleString()}</Text>
            </View>
          )}

          {/* Divider */}
          <View style={styles.divider} />

          {/* Total */}
          <View style={styles.receiptRow}>
            <Text style={styles.totalLabel}>Grand Total</Text>
            <Text style={styles.totalVal}>LKR {(total + 20000).toLocaleString()}</Text>
          </View>

          <Text style={styles.lkrNote}>* Total includes Package, Hotel, Guide, and Transport</Text>
        </View>
      </View>

      {/* Payment Method */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💳 Payment Method</Text>
        <View style={styles.methodGrid}>
          {METHODS.map(m => (
            <TouchableOpacity
              key={m.key}
              style={[styles.methodBtn, method === m.key && styles.methodActive]}
              onPress={() => setMethod(m.key)}
              activeOpacity={0.8}
            >
              <Text style={styles.methodEmoji}>{m.emoji}</Text>
              <Text style={[styles.methodLabel, method === m.key && { color: '#fff' }]}>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Card Input UI */}
        {method === 'Credit_Card' && (
          <View style={styles.cardInputContainer}>
            <Text style={styles.cardInputTitle}>Card Details</Text>
            
            <Text style={styles.inputLabel}>Card Number</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>💳</Text>
              <TextInput 
                style={styles.input} 
                value={cardNumber}
                onChangeText={setCardNumber}
                keyboardType="numeric"
                maxLength={19}
              />
            </View>

            <View style={styles.rowInputs}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.inputLabel}>Expiry</Text>
                <TextInput 
                  style={[styles.input, styles.inputBox]} 
                  value={expiry}
                  onChangeText={setExpiry}
                  placeholder="MM/YY"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>CVV</Text>
                <TextInput 
                  style={[styles.input, styles.inputBox]} 
                  value={cvv}
                  onChangeText={setCvv}
                  keyboardType="numeric"
                  maxLength={3}
                  secureTextEntry
                />
              </View>
            </View>
          </View>
        )}

        {/* Demo Bank / Cash Info */}
        {(method === 'Bank_Transfer' || method === 'Cash_On_Tour') && (
          <View style={styles.cardInputContainer}>
            <Text style={styles.cardInputTitle}>{method.replace('_', ' ')} Instructions</Text>
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                {method === 'Bank_Transfer' 
                  ? '🏦 Please transfer the total amount to:\nBank: Bank of Ceylon\nAccount: 0012345678\nBranch: Colombo Fort'
                  : '💵 You can pay the total amount in cash to your tour guide upon arrival at the destination.'}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Security Note */}
      <View style={styles.secureBox}>
        <Text style={styles.secureText}>🔒  Your payment is encrypted and secure</Text>
        <Text style={styles.secureText}>🏦  Processed via Sri Lanka's secure payment gateway</Text>
      </View>

      {/* Pay Button */}
      <TouchableOpacity style={styles.payBtn} onPress={handlePayment} disabled={loading} activeOpacity={0.85}>
        {loading
          ? <ActivityIndicator color="#fff" />
          : <>
              <Text style={styles.payText}>Complete Payment →</Text>
              <Text style={styles.paySub}>Total: LKR {(total + 20000).toLocaleString()}</Text>
            </>
        }
      </TouchableOpacity>

      <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },

  // Header
  header: {
    backgroundColor: '#0D5F8A',
    paddingTop: 55,
    paddingBottom: 28,
    paddingHorizontal: 20,
  },
  backBtn:   { marginBottom: 12 },
  backText:  { color: '#87CEEB', fontSize: 15, fontWeight: '600' },
  stepBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 8,
    overflow: 'hidden',
  },
  headerTitle: { fontSize: 26, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  headerSub:   { fontSize: 13, color: '#87CEEB' },

  // Progress
  progress: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  dot:      { width: 14, height: 14, borderRadius: 7, backgroundColor: '#D0D0D0' },
  dotDone:  { backgroundColor: '#27AE60' },
  dotActive:{ backgroundColor: '#0D5F8A' },
  line:     { width: 40, height: 2, backgroundColor: '#D0D0D0', marginHorizontal: 4 },
  lineDone: { backgroundColor: '#27AE60' },

  // Section
  section:      { paddingHorizontal: 16, marginTop: 20 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#555',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },

  // Receipt
  receipt: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingBottom: 12,
  },
  receiptTitle: { fontSize: 15, fontWeight: 'bold', color: '#1A3A4A', flex: 1, marginRight: 8 },
  slBadge: {
    backgroundColor: '#E8F5FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  slBadgeText: { fontSize: 11, fontWeight: '700', color: '#0D5F8A' },
  receiptRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  receiptLabel:{ fontSize: 14, color: '#555', fontWeight: '600' },
  receiptSub:  { fontSize: 11, color: '#999', marginTop: 2 },
  receiptVal:  { fontSize: 14, fontWeight: '700', color: '#333' },
  divider:     { height: 1, backgroundColor: '#EEE', marginVertical: 10 },
  totalLabel:  { fontSize: 17, fontWeight: 'bold', color: '#333' },
  totalVal:    { fontSize: 20, fontWeight: 'bold', color: '#0D5F8A' },
  lkrNote:     { fontSize: 10, color: '#BBB', marginTop: 12, fontStyle: 'italic', textAlign: 'center' },

  // Payment methods
  methodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  methodBtn: {
    flex: 1,
    minWidth: '28%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E8E8E8',
    elevation: 1,
  },
  methodActive: { backgroundColor: '#0D5F8A', borderColor: '#0D5F8A' },
  methodEmoji:  { fontSize: 26, marginBottom: 6 },
  methodLabel:  { fontWeight: '600', color: '#333', fontSize: 12, textAlign: 'center' },

  // Card Inputs
  cardInputContainer: { marginTop: 16, backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#EEE' },
  cardInputTitle: { fontSize: 13, fontWeight: 'bold', color: '#1A3A4A', marginBottom: 12 },
  inputLabel: { fontSize: 11, color: '#666', fontWeight: '600', marginBottom: 6 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F7FA', borderRadius: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: '#E0E0E0', marginBottom: 14 },
  inputIcon: { fontSize: 16, marginRight: 8 },
  input: { flex: 1, height: 44, color: '#333', fontSize: 14, fontWeight: '600', letterSpacing: 1 },
  rowInputs: { flexDirection: 'row' },
  inputBox: { backgroundColor: '#F5F7FA', borderRadius: 10, paddingHorizontal: 14, borderWidth: 1, borderColor: '#E0E0E0', letterSpacing: 2 },

  // Secure box
  secureBox: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#EAFAF1',
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#27AE60',
    gap: 4,
  },
  secureText: { fontSize: 12, color: '#2C7A4B', fontWeight: '500' },

  // Pay button
  payBtn: {
    backgroundColor: '#27AE60',
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 20,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#27AE60',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
  },
  payText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  paySub:  { color: 'rgba(255,255,255,0.75)', fontSize: 11, marginTop: 3 },

  infoBox: { backgroundColor: '#F0F8FF', borderRadius: 10, padding: 12, borderLeftWidth: 3, borderLeftColor: '#0D5F8A' },
  infoText: { fontSize: 12, color: '#0D5F8A', lineHeight: 18 },
});
