import React, { useState, useEffect, useContext } from 'react';
import { 
  View, Text, FlatList, TouchableOpacity, StyleSheet, 
  ActivityIndicator, TextInput, Image, StatusBar 
} from 'react-native';
import API from '../services/api';
import { getPrimaryImage } from '../utils/imageUtils';
import { AuthContext } from '../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';

const CATEGORIES = ['All', 'Beach', 'Mountain', 'Historical', 'Cultural', 'Wildlife', 'Adventure', 'Religious', 'Urban'];
const statusColor = { 
  Open: '#27AE60', 
  Closed: '#E74C3C', 
  Seasonal: '#F39C12', 
  Under_Maintenance: '#95A5A6' 
};

const categoryEmojis = {
  Beach: '🏖️', Mountain: '⛰️', Historical: '🏛️', Cultural: '🎭',
  Wildlife: '🦁', Adventure: '🎢', Religious: '🕌', Urban: '🏙️', All: '🌍'
};

export default function AttractionsScreen({ navigation }) {
  const [attractions, setAttractions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchAttractions(); }, []);

  const fetchAttractions = async () => {
    try {
      const res = await API.get('/attractions');
      setAttractions(res.data.data?.attractions || res.data || []);
    } catch (e) { console.error(e.message); }
    setLoading(false);
    setRefreshing(false);
  };

  const filtered = attractions.filter(a => {
    const matchSearch = (a.name || '').toLowerCase().includes(search.toLowerCase()) || (a.city || '').toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'All' || a.category === category;
    return matchSearch && matchCat;
  });

  const renderAttractionCard = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('AttractionDetail', { id: item.attraction_id })}
      activeOpacity={0.9}
    >
      <Image 
        source={{ uri: getPrimaryImage(item) || `https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=400` }}
        style={styles.cardImage}
      />
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.cardGradient}>
        <View style={styles.cardHeader}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor[item.operational_status] || '#999' }]}>
            <Text style={styles.statusText}>{item.operational_status}</Text>
          </View>
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingText}>⭐ {Number(item.average_rating || 4.5).toFixed(1)}</Text>
          </View>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{item.name}</Text>
          <View style={styles.locRow}>
            <Text style={styles.locText}>📍 {item.city}</Text>
            <Text style={styles.catText}>• {item.category}</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <View style={StyleSheet.absoluteFill}>
      <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#0D5F8A', '#2E86AB']} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backBtn}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Explore Wonders</Text>
          <View style={{ width: 20 }} />
        </View>
        <View style={styles.searchContainer}>
          <TextInput 
            style={styles.search} 
            placeholder="Search amazing places..." 
            placeholderTextColor="#87CEEB"
            value={search} 
            onChangeText={setSearch} 
          />
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <FlatList 
          horizontal 
          data={CATEGORIES} 
          keyExtractor={i => i} 
          showsHorizontalScrollIndicator={false}
          style={styles.catList}
          contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 15 }}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[styles.catBtn, category === item && styles.catActive]}
              onPress={() => setCategory(item)}
            >
              <Text style={styles.catEmoji}>{categoryEmojis[item]}</Text>
              <Text style={[styles.catLabel, category === item && { color: '#fff' }]}>{item}</Text>
            </TouchableOpacity>
          )} 
        />

        {loading ? <ActivityIndicator size="large" color="#0D5F8A" style={{ marginTop: 50 }} /> : (
          <FlatList 
            data={filtered} 
            keyExtractor={item => String(item.attraction_id)}
            contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingBottom: 100 }}
            renderItem={renderAttractionCard}
            refreshing={refreshing}
            onRefresh={fetchAttractions}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  backBtn: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  searchContainer: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 15, paddingHorizontal: 15, height: 50, justifyContent: 'center' },
  search: { color: '#fff', fontSize: 15 },
  content: { flex: 1, marginTop: -20, backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  catList: { flexGrow: 0 },
  catBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F7FA', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 12, marginRight: 10, borderWidth: 1, borderColor: '#EEE' },
  catActive: { backgroundColor: '#0D5F8A', borderColor: '#0D5F8A' },
  catEmoji: { fontSize: 16, marginRight: 6 },
  catLabel: { fontSize: 13, fontWeight: '600', color: '#666' },
  card: { height: 220, borderRadius: 20, marginBottom: 20, overflow: 'hidden', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2 },
  cardImage: { width: '100%', height: '100%' },
  cardGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '100%', justifyContent: 'space-between', padding: 15 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  ratingBadge: { backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  ratingText: { fontSize: 11, fontWeight: 'bold', color: '#F39C12' },
  cardInfo: {},
  cardName: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  locRow: { flexDirection: 'row', alignItems: 'center' },
  locText: { color: '#B8D7E8', fontSize: 12, marginRight: 8 },
  catText: { color: 'rgba(255,255,255,0.7)', fontSize: 11 },
});