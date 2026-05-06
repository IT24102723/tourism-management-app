import React, { useState, useEffect } from 'react';
import { 
  View, Text, FlatList, TouchableOpacity, StyleSheet, 
  ActivityIndicator, Image, StatusBar, TextInput, ScrollView
} from 'react-native';
import API from '../services/api';
import { resolveImageUrl } from '../utils/imageUtils';
import { LinearGradient } from 'expo-linear-gradient';

const providerIcons = {
  Hotel: '🏨', Transport: '🚆', Tour_Guide: '🧑‍✈️', Restaurant: '🍴', All: '🏢'
};

const TYPES = [
  { label: 'All', value: 'All' },
  { label: 'Hotels', value: 'Hotel' },
  { label: 'Transport', value: 'Transport' },
  { label: 'Tour Guides', value: 'Tour_Guide' },
  { label: 'Restaurants', value: 'Restaurant' },
];

export default function ProvidersScreen({ navigation }) {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchProviders(); }, []);

  const fetchProviders = async () => {
    try {
      const res = await API.get('/providers');
      setProviders(res.data.data?.providers || res.data || []);
    } catch (e) { console.error(e.message); }
    setLoading(false);
    setRefreshing(false);
  };

  const filtered = providers.filter(p => {
    const matchType = filter === 'All' || p.business_type === filter;
    const matchSearch = (p.business_name || '').toLowerCase().includes(search.toLowerCase()) || (p.city || '').toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const renderProviderCard = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('ProviderDetail', { id: item.provider_id })}
      activeOpacity={0.9}
    >
      <Image 
        source={{ uri: resolveImageUrl(item.image_url) || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400' }}
        style={styles.cardImage}
      />
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={styles.cardGradient}>
        <View style={styles.cardTop}>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>{providerIcons[item.business_type]} {item.business_type?.replace('_', ' ')}</Text>
          </View>
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingText}>⭐ 4.9</Text>
          </View>
        </View>
        
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>{item.business_name}</Text>
          <View style={styles.locRow}>
            <Text style={styles.locText}>📍 {item.city || 'Sri Lanka'}</Text>
            {item.price_range && <Text style={styles.priceText}> • {item.price_range}</Text>}
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#0D5F8A', '#1A3A4A']} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backBtn}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Service Providers</Text>
          <View style={{ width: 20 }} />
        </View>
        <View style={styles.searchContainer}>
          <TextInput 
            style={styles.search} 
            placeholder="Search hotels, guides..." 
            placeholderTextColor="#87CEEB"
            value={search} 
            onChangeText={setSearch} 
          />
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <FlatList 
          horizontal 
          data={TYPES} 
          keyExtractor={i => i.value} 
          showsHorizontalScrollIndicator={false}
          style={styles.catList}
          contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 15 }}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[styles.catBtn, filter === item.value && styles.catActive]}
              onPress={() => setFilter(item.value)}
            >
              <Text style={styles.catEmoji}>{providerIcons[item.value]}</Text>
              <Text style={[styles.catLabel, filter === item.value && { color: '#fff' }]}>{item.label}</Text>
            </TouchableOpacity>
          )} 
        />

        {loading ? <ActivityIndicator size="large" color="#0D5F8A" style={{ marginTop: 50 }} /> : (
          <FlatList 
            data={filtered} 
            keyExtractor={item => String(item.provider_id)}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
            renderItem={renderProviderCard}
            refreshing={refreshing}
            onRefresh={fetchProviders}
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
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  backBtn: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  searchContainer: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 15, paddingHorizontal: 15, height: 45, justifyContent: 'center' },
  search: { color: '#fff', fontSize: 14 },
  content: { flex: 1, marginTop: -20, backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  catList: { flexGrow: 0 },
  catBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F7FA', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 12, marginRight: 10, borderWidth: 1, borderColor: '#EEE' },
  catActive: { backgroundColor: '#0D5F8A', borderColor: '#0D5F8A' },
  catEmoji: { fontSize: 16, marginRight: 6 },
  catLabel: { fontSize: 13, fontWeight: '600', color: '#666' },
  card: { height: 180, borderRadius: 20, marginBottom: 20, overflow: 'hidden', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2 },
  cardImage: { width: '100%', height: '100%' },
  cardGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '100%', justifyContent: 'space-between', padding: 15 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between' },
  typeBadge: { backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  typeBadgeText: { fontSize: 10, fontWeight: 'bold', color: '#333' },
  ratingBadge: { backgroundColor: '#F39C12', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  ratingText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  cardInfo: {},
  cardTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  locRow: { flexDirection: 'row', alignItems: 'center' },
  locText: { color: '#B8D7E8', fontSize: 12 },
  priceText: { color: '#27AE60', fontSize: 12, fontWeight: 'bold' },
});
