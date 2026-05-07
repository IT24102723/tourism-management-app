import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, ScrollView,
  TouchableOpacity, Image, LinearGradient,
} from 'react-native';
import API from '../services/api';
import { getPrimaryImage } from '../utils/imageUtils';
import { AuthContext } from '../context/AuthContext';

// Sri Lanka package hero images mapped by type
const HERO_IMAGES = {
  Leisure:   'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=900&auto=format&fit=crop',
  Adventure: 'https://images.unsplash.com/photo-1586185862378-3e3e49e98073?w=900&auto=format&fit=crop',
  Cultural:  'https://images.unsplash.com/photo-1567359781514-3b964e2b04d6?w=900&auto=format&fit=crop',
  Wildlife:  'https://images.unsplash.com/photo-1564760290292-23341e4df6ec?w=900&auto=format&fit=crop',
  default:   'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=900&auto=format&fit=crop',
};

const TYPE_COLORS = {
  Leisure:   '#27AE60',
  Adventure: '#E67E22',
  Cultural:  '#8E44AD',
  Wildlife:  '#E74C3C',
};

export default function PackageDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const { user } = useContext(AuthContext);
  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchPackage(); }, []);

  const fetchPackage = async () => {
    try {
      const res = await API.get(`/packages/${id}`);
      setPkg(res.data.data || res.data);
    } catch (e) { console.log(e); }
    setLoading(false);
  };

  const handleBook = () => {
    navigation.navigate('PackageBooking', {
      package_id:       id,
      package_title:    pkg.title || pkg.name,
      price_per_person: pkg.price_per_person || pkg.price || 0,
      duration_days:    pkg.duration_days,
    });
  };

  if (loading) return <ActivityIndicator size="large" color="#0D5F8A" style={{ marginTop: 100 }} />;
  if (!pkg)    return <Text style={{ textAlign: 'center', marginTop: 100 }}>Package not found.</Text>;

  const heroUri   = getPrimaryImage(pkg) || HERO_IMAGES[pkg.package_type] || HERO_IMAGES.default;
  const typeColor = TYPE_COLORS[pkg.package_type] || '#0D5F8A';

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}>
      {/* Hero */}
      <View style={styles.heroWrap}>
        <Image source={{ uri: heroUri }} style={styles.heroImage} />
        <View style={styles.heroOverlay} />
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.heroContent}>
          <View style={[styles.typeBadge, { backgroundColor: typeColor }]}>
            <Text style={styles.typeText}>{pkg.package_type} Tour • 🇱🇰 Sri Lanka</Text>
          </View>
          <Text style={styles.heroTitle}>{pkg.title || pkg.name}</Text>
          <Text style={styles.heroPrice}>LKR {Number(pkg.price_per_person || pkg.price || 0).toLocaleString()} / person</Text>
        </View>
      </View>

      {/* Quick Info */}
      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Text style={styles.infoIcon}>⏱</Text>
          <Text style={styles.infoVal}>{pkg.duration_days} Days</Text>
          <Text style={styles.infoLabel}>Duration</Text>
        </View>
        <View style={styles.infoDiv} />
        <View style={styles.infoItem}>
          <Text style={styles.infoIcon}>👥</Text>
          <Text style={styles.infoVal}>Group</Text>
          <Text style={styles.infoLabel}>Tour Type</Text>
        </View>
        <View style={styles.infoDiv} />
        <View style={styles.infoItem}>
          <Text style={styles.infoIcon}>🌴</Text>
          <Text style={styles.infoVal}>Sri Lanka</Text>
          <Text style={styles.infoLabel}>Destination</Text>
        </View>
        <View style={styles.infoDiv} />
        <View style={styles.infoItem}>
          <Text style={styles.infoIcon}>{pkg.is_active ? '✅' : '⛔'}</Text>
          <Text style={[styles.infoVal, { color: pkg.is_active ? '#27AE60' : '#E74C3C' }]}>
            {pkg.is_active ? 'Available' : 'Unavailable'}
          </Text>
          <Text style={styles.infoLabel}>Status</Text>
        </View>
      </View>

      {/* Description */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About This Package</Text>
        <Text style={styles.desc}>{pkg.description || 'Explore the beautiful island of Sri Lanka with this curated tour package.'}</Text>
      </View>

      {/* Inclusions */}
      {pkg.inclusions && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✅ What's Included</Text>
          <View style={styles.inclusionBox}>
            <Text style={styles.inclusionText}>{pkg.inclusions}</Text>
          </View>
        </View>
      )}

      {/* What to Expect / Itinerary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🗺️ Included Attractions</Text>
        {pkg.itinerary && pkg.itinerary.length > 0 ? (
          <View style={styles.itineraryGrid}>
            {pkg.itinerary.map((item, i) => (
              <View key={i} style={styles.itineraryItem}>
                <View style={styles.dayBadge}>
                  <Text style={styles.dayText}>Day {item.visit_day}</Text>
                </View>
                <View style={styles.itineraryContent}>
                  <Text style={styles.itineraryName}>{item.name}</Text>
                  <Text style={styles.itineraryCity}>{item.city}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.highlightsGrid}>
            {['Sigiriya Rock', 'Galle Fort', 'Temple of Tooth', 'Yala Safari', 'Ella Train', 'Mirissa Beach'].map((h, i) => (
              <View key={i} style={styles.highlight}>
                <Text style={styles.highlightText}>{h}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* CTA */}
      {user?.role === 'Tourist' && (
        <TouchableOpacity style={styles.bookBtn} onPress={handleBook} activeOpacity={0.85}>
          <Text style={styles.bookBtnText}>🏷️  Book This Package</Text>
          <Text style={styles.bookBtnSub}>Pick your Hotel, Guide & Transport in next steps</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.feedbackBtn}
        onPress={() => navigation.navigate('Feedback', { target_type: 'Package', target_id: id })}
      >
        <Text style={styles.feedbackBtnText}>⭐  Leave a Review</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },

  // Hero
  heroWrap:    { height: 300, position: 'relative' },
  heroImage:   { width: '100%', height: '100%', resizeMode: 'cover' },
  heroOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  backBtn: {
    position: 'absolute', top: 52, left: 16,
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
  },
  backText:  { color: '#fff', fontSize: 14, fontWeight: '600' },
  heroContent: { position: 'absolute', bottom: 20, left: 16, right: 16 },
  typeBadge: {
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 6, marginBottom: 8,
  },
  typeText:  { color: '#fff', fontSize: 11, fontWeight: '700' },
  heroTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 4, lineHeight: 30 },
  heroPrice: { fontSize: 18, fontWeight: 'bold', color: '#7FFFD4' },

  // Info row
  infoRow: {
    flexDirection: 'row', backgroundColor: '#fff',
    paddingVertical: 16, paddingHorizontal: 8,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06,
  },
  infoItem:  { flex: 1, alignItems: 'center' },
  infoIcon:  { fontSize: 18, marginBottom: 3 },
  infoVal:   { fontSize: 12, fontWeight: 'bold', color: '#333', marginBottom: 1 },
  infoLabel: { fontSize: 10, color: '#999' },
  infoDiv:   { width: 1, backgroundColor: '#EEE', marginVertical: 4 },

  // Section
  section:      { paddingHorizontal: 16, marginTop: 22 },
  sectionTitle: { fontSize: 17, fontWeight: 'bold', color: '#1A3A4A', marginBottom: 10 },
  desc:         { fontSize: 14, color: '#555', lineHeight: 22 },

  // Inclusions
  inclusionBox: {
    backgroundColor: '#EAFAF1', borderRadius: 12, padding: 14,
    borderLeftWidth: 4, borderLeftColor: '#27AE60',
  },
  inclusionText: { fontSize: 14, color: '#2C7A4B', lineHeight: 22 },

  // Highlights
  highlightsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  highlight: {
    backgroundColor: '#EDF4F8', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  highlightText: { color: '#0D5F8A', fontSize: 12, fontWeight: '600' },

  // Book button
  bookBtn: {
    backgroundColor: '#0D5F8A', marginHorizontal: 16, marginTop: 28,
    borderRadius: 14, paddingVertical: 18, alignItems: 'center',
    elevation: 5, shadowColor: '#0D5F8A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35,
  },
  bookBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 17 },
  bookBtnSub:  { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 3 },

  // Feedback button
  feedbackBtn: {
    borderWidth: 2, borderColor: '#0D5F8A',
    marginHorizontal: 16, marginTop: 12, borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
  },
  feedbackBtnText: { color: '#0D5F8A', fontWeight: '700', fontSize: 15 },
  
  // Itinerary
  itineraryGrid: { gap: 10 },
  itineraryItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
  },
  dayBadge: {
    backgroundColor: '#0D5F8A',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginRight: 15,
  },
  dayText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  itineraryContent: { flex: 1 },
  itineraryName: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 2 },
  itineraryCity: { fontSize: 12, color: '#666' },
});