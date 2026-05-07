import React, { useState, useEffect } from 'react';
import { 
  View, Text, FlatList, TouchableOpacity, StyleSheet, 
  ActivityIndicator, Image, StatusBar 
} from 'react-native';
import API from '../services/api';
import { getPrimaryImage } from '../utils/imageUtils';
import { LinearGradient } from 'expo-linear-gradient';

const typeEmojis = {
  Leisure: '🏖️', Adventure: '🎢', Cultural: '🎭', Wildlife: '🦁', All: '🌍'
};

export default function PackagesScreen({ navigation }) {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchPackages(); }, []);

  const fetchPackages = async () => {
    try {
      const res = await API.get('/packages');
      setPackages(res.data.data?.packages || res.data || []);
    } catch (e) { console.error(e.message); }
    setLoading(false);
    setRefreshing(false);
  };

  // Filter packages robustly, handling missing or mismatched type fields
  const filtered = filter === 'All' ? packages : packages.filter(p => {
    const type = (p.package_type || p.type || '').toString();
    return type === filter;
  });

  const renderPackageCard = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('PackageDetail', { id: item.package_id })}
      activeOpacity={0.9}
    >
      <Image 
        source={{ uri: getPrimaryImage(item) || `https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=400` }}
        style={styles.cardImage}
      />
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={styles.cardGradient}>
        <View style={styles.cardTop}>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>{typeEmojis[item.package_type]} {item.package_type || 'Standard'}</Text>
          </View>
          <View style={styles.priceBadge}>
            <Text style={styles.priceText}>LKR {Number(item.price_per_person || 0).toLocaleString()}</Text>
          </View>
        </View>
        
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>{item.title || item.name}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>⏱ {item.duration_days} Days</Text>
            <Text style={styles.metaText}> • </Text>
            <Text style={styles.metaText}>⭐ 4.8 (120+)</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#1A3A4A', '#0D5F8A']} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backBtn}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Tour Packages</Text>
          <View style={{ width: 20 }} />
        </View>
        <Text style={styles.subtitle}>Curated experiences for every traveler 🇱🇰</Text>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.filterRow}>
          {['All', 'Leisure', 'Adventure', 'Cultural', 'Wildlife'].map(f => (
            <TouchableOpacity 
              key={f}
              style={[styles.filterBtn, filter === f && styles.filterActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && { color: '#fff' }]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? <ActivityIndicator size="large" color="#0D5F8A" style={{ marginTop: 50 }} /> : (
          <FlatList 
            data={filtered} 
            keyExtractor={item => String(item.package_id || item.id || Math.random())}
            contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingBottom: 100 }}
            renderItem={renderPackageCard}
            refreshing={refreshing}
            onRefresh={fetchPackages}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { paddingTop: 60, paddingBottom: 25, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  backBtn: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 13, color: '#87CEEB', opacity: 0.8 },
  content: { flex: 1, marginTop: -20, backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  filterRow: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 15, gap: 8 },
  filterBtn: { backgroundColor: '#F5F7FA', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#EEE' },
  filterActive: { backgroundColor: '#0D5F8A', borderColor: '#0D5F8A' },
  filterText: { fontSize: 12, fontWeight: 'bold', color: '#666' },
  card: { height: 200, borderRadius: 20, marginBottom: 20, overflow: 'hidden', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2 },
  cardImage: { width: '100%', height: '100%' },
  cardGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '100%', justifyContent: 'space-between', padding: 15 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between' },
  typeBadge: { backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  typeBadgeText: { fontSize: 10, fontWeight: 'bold', color: '#333' },
  priceBadge: { backgroundColor: '#27AE60', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  priceText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  cardInfo: {},
  cardTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  metaText: { color: '#B8D7E8', fontSize: 12, fontWeight: '600' },
});