import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity,
  ActivityIndicator, Linking, Alert, Platform, Dimensions,
} from 'react-native';
import API from '../services/api';
import { resolveImageUrl } from '../utils/imageUtils';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ProviderDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const [provider, setProvider] = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    fetchProvider();
  }, []);

  const fetchProvider = async () => {
    try {
      const res = await API.get(`/providers/${id}`);
      setProvider(res.data.data || res.data);
    } catch (e) {
      Alert.alert('Error', 'Could not load provider details.');
      navigation.goBack();
    }
    setLoading(false);
  };

  const handleContact = (type, val) => {
    if (!val) return;
    const url = type === 'email' ? `mailto:${val}` : `tel:${val}`;
    Linking.openURL(url).catch(err => console.log('Link error:', err));
  };

  if (loading) return <ActivityIndicator size="large" color="#0D5F8A" style={{ marginTop: 100 }} />;
  if (!provider) return <Text style={{ textAlign: 'center', marginTop: 100 }}>Provider not found.</Text>;

  const imageUri = resolveImageUrl(provider.image_url);

  return (
    <ScrollView
        style={[styles.container, Platform.OS === 'web' && { height: '100vh' }]} contentContainerStyle={{ flexGrow: 1, paddingBottom: 120 }} showsVerticalScrollIndicator={true}>
      {/* Header Image */}
      <View style={styles.imageHeader}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.headerImg} />
        ) : (
          <View style={styles.placeholderImg}>
            <Text style={styles.placeholderEmoji}>
              {provider.business_type === 'Hotel' ? '🏨' : 
               provider.business_type === 'Transport' ? '🚗' : 
               provider.business_type === 'Tour Guide' ? '🚩' : '🏢'}
            </Text>
          </View>
        )}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.typeBadge}>
          <Text style={styles.typeBadgeText}>{provider.business_type}</Text>
        </View>

        <Text style={styles.name}>{provider.business_name || provider.name}</Text>
        
        <View style={styles.ratingRow}>
          <Text style={styles.starText}>⭐ {Number(provider.average_rating || 0).toFixed(1)}</Text>
          <Text style={styles.countText}>({provider.rating_count || 0} reviews)</Text>
          {provider.is_verified === 1 && (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>✓ Verified</Text>
            </View>
          )}
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.description}>
          {provider.description || 'Professional service provider offering high-quality experiences in Sri Lanka.'}
        </Text>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>📍 Location</Text>
            <Text style={styles.infoVal}>{provider.address || provider.city || 'Sri Lanka'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>✉️ Email</Text>
            <TouchableOpacity onPress={() => handleContact('email', provider.contact_email)}>
              <Text style={[styles.infoVal, { color: '#0D5F8A', textDecorationLine: 'underline' }]}>
                {provider.contact_email || 'Not available'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>📞 Phone</Text>
            <TouchableOpacity onPress={() => handleContact('tel', provider.contact_phone || provider.contact_number)}>
              <Text style={[styles.infoVal, { color: '#0D5F8A', textDecorationLine: 'underline' }]}>
                {provider.contact_phone || provider.contact_number || 'Not available'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.actionGrid}>
          <TouchableOpacity 
            style={styles.actionBtn} 
            onPress={() => handleContact('tel', provider.contact_phone || provider.contact_number)}
          >
            <Text style={styles.actionBtnText}>Call Now</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: '#fff', borderWidth: 1, borderColor: '#0D5F8A' }]} 
            onPress={() => handleContact('email', provider.contact_email)}
          >
            <Text style={[styles.actionBtnText, { color: '#0D5F8A' }]}>Send Email</Text>
          </TouchableOpacity>
        </View>
      </View>
      </ScrollView>
    
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  imageHeader: { height: 260, position: 'relative' },
  headerImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  placeholderImg: { width: '100%', height: '100%', backgroundColor: '#E1F5FE', alignItems: 'center', justifyContent: 'center' },
  placeholderEmoji: { fontSize: 80 },
  backBtn: { position: 'absolute', top: 50, left: 20, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
  backBtnText: { color: '#fff', fontWeight: 'bold' },
  content: { padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -24, backgroundColor: '#fff' },
  typeBadge: { alignSelf: 'flex-start', backgroundColor: '#F0F7FF', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8, marginBottom: 10 },
  typeBadgeText: { fontSize: 11, fontWeight: 'bold', color: '#0D5F8A', textTransform: 'uppercase' },
  name: { fontSize: 24, fontWeight: 'bold', color: '#1A3A4A', marginBottom: 8 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  starText: { fontSize: 16, fontWeight: 'bold', color: '#F39C12', marginRight: 6 },
  countText: { fontSize: 14, color: '#999', marginRight: 15 },
  verifiedBadge: { backgroundColor: '#EAFAF1', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  verifiedText: { color: '#27AE60', fontSize: 12, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A3A4A', marginBottom: 10 },
  description: { fontSize: 15, color: '#666', lineHeight: 24, marginBottom: 25 },
  infoCard: { backgroundColor: '#F9FAFB', borderRadius: 16, padding: 16, marginBottom: 30 },
  infoRow: { marginBottom: 15 },
  infoLabel: { fontSize: 12, color: '#999', marginBottom: 4, fontWeight: '600' },
  infoVal: { fontSize: 15, color: '#333', fontWeight: '500' },
  actionGrid: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, backgroundColor: '#0D5F8A', paddingVertical: 15, borderRadius: 12, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
