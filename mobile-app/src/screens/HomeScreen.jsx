import React, { useContext, useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl,
  ImageBackground, Image, Dimensions, StatusBar, Alert
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';
import { LinearGradient } from 'expo-linear-gradient';
import { resolveImageUrl } from '../utils/imageUtils';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const { user, logout } = useContext(AuthContext);
  const [stats, setStats] = useState({ attractions: 0, packages: 0, rating: '4.9' });
  const [refreshing, setRefreshing] = useState(false);
  const [featured, setFeatured] = useState([]);
  const [bestProviders, setBestProviders] = useState([]);

  useEffect(() => {
    fetchStats();
    fetchFeatured();
    fetchBestProviders();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
    fetchFeatured();
    fetchBestProviders();
  };

  const fetchStats = async () => {
    try {
      const [attrRes, pkgRes] = await Promise.all([
        API.get('/attractions?limit=1'),
        API.get('/packages?limit=1'),
      ]);
      setStats({
        attractions: attrRes.data?.data?.pagination?.total || 120,
        packages: pkgRes.data?.data?.pagination?.total || 45,
        rating: '4.9',
      });
    } catch (e) {
      console.error('Error fetching stats:', e.message);
    } finally {
      setRefreshing(false);
    }
  };

  const fetchFeatured = async () => {
    try {
      const res = await API.get('/attractions?limit=5');
      setFeatured(res.data?.data?.attractions || []);
    } catch (e) { console.log(e); }
  };

  const fetchBestProviders = async () => {
    try {
      const res = await API.get('/feedback/best-services');
      setBestProviders(res.data?.data?.Provider || []);
    } catch (e) { console.log(e); }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout }
    ]);
  };

  const categories = [
    { title: 'Attractions', icon: '⛰️', sub: 'Explore Spots', screen: 'Attractions', color: '#E3F2FD' },
    { title: 'Packages', icon: '🏝️', sub: 'Tour Deals', screen: 'Packages', color: '#FFF3E0' },
    { title: 'Providers', icon: '🏨', sub: 'Book Services', screen: 'Providers', color: '#E8F5E9' },
    { title: 'Transport', icon: '🚆', sub: 'Travel Easy', screen: 'Transport', color: '#FCE4EC' },
  ];

  const greeting = user?.full_name?.split(' ')[0] || user?.username || 'Traveler';

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
    >
      <StatusBar barStyle="light-content" />

      {/* Hero Section */}
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=900&auto=format&fit=crop' }}
        style={styles.hero}
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.8)']}
          style={styles.heroGradient}
        >
          <View style={styles.headerTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.greeting}>Ayubowan, {greeting}! 🙏</Text>
              <Text style={styles.headerSub}>Welcome to Paradise Island 🇱🇰</Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={handleLogout} style={styles.logoutHeaderBtn}>
                <Text style={styles.logoutEmoji}>🚪</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.avatarBtn}>
                <Image
                  source={{ uri: user?.profile_image ? resolveImageUrl(user.profile_image) : 'https://ui-avatars.com/api/?name=' + greeting }}
                  style={styles.avatar}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>Discover the Wonders of Sri Lanka</Text>
            <TouchableOpacity
              style={styles.searchBar}
              onPress={() => navigation.navigate('Attractions')}
              activeOpacity={0.8}
            >
              <Text style={styles.searchPlaceholder}>🔍 Search attractions, hotels...</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </ImageBackground>

      {/* Categories */}
      <View style={styles.categoryRow}>
        {categories.map((cat, i) => (
          <TouchableOpacity
            key={i}
            style={styles.catItem}
            onPress={() => navigation.navigate(cat.screen)}
          >
            <View style={[styles.catIconBox, { backgroundColor: cat.color }]}>
              <Text style={styles.catIcon}>{cat.icon}</Text>
            </View>
            <Text style={styles.catTitle}>{cat.title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Featured Attractions Carousel */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Attractions</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Attractions')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carousel}>
          {featured.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={styles.featCard}
              onPress={() => navigation.navigate('AttractionDetail', { id: item.attraction_id })}
            >
              <Image
                source={{ uri: item.image_url ? resolveImageUrl(item.image_url) : 'https://picsum.photos/seed/' + i + '/300/200' }}
                style={styles.featImg}
              />
              <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={styles.featGradient}>
                <Text style={styles.featTitle}>{item.name}</Text>
                <Text style={styles.featLoc}>📍 {item.city}</Text>
              </LinearGradient>
              <View style={styles.featBadge}>
                <Text style={styles.featBadgeText}>⭐ 4.9</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Best Service Providers (Based on Feedback) */}
      {bestProviders.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🏆 Top Rated Services</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Providers')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carousel}>
            {bestProviders.map((item, i) => (
              <TouchableOpacity
                key={i}
                style={styles.providerCard}
                onPress={() => navigation.navigate('ProviderDetail', { id: item._id })}
              >
                <View style={styles.providerIconBox}>
                  <Text style={styles.providerIcon}>🏢</Text>
                </View>
                <Text style={styles.providerName} numberOfLines={1}>{item.name}</Text>
                <View style={styles.providerRatingRow}>
                  <Text style={styles.providerStar}>⭐ {Number(item.avg_rating).toFixed(1)}</Text>
                  <Text style={styles.providerReviews}>({item.total_reviews})</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Promo Banner */}
      <TouchableOpacity
        style={styles.promoBanner}
        onPress={() => navigation.navigate('Packages')}
      >
        <LinearGradient colors={['#0D5F8A', '#2E86AB']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.promoGradient}>
          <View style={styles.promoContent}>
            <Text style={styles.promoTitle}>Exclusive Tour Packages</Text>
            <Text style={styles.promoSub}>Book now and get 20% off on your first trip!</Text>
            <View style={styles.promoBtn}>
              <Text style={styles.promoBtnText}>Book Now</Text>
            </View>
          </View>
          <Text style={styles.promoEmoji}>🐘</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Trip Planner Step */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Plan Your Perfect Trip</Text>
        <View style={styles.stepsContainer}>
          {[
            { step: '1', title: 'Pick Package', sub: 'Choose your destination', icon: '🧳' },
            { step: '2', title: 'Add Transport', sub: 'Select your ride', icon: '🚗' },
            { step: '3', title: 'Easy Payment', sub: 'Secure and fast', icon: '💳' },
          ].map((s, i) => (
            <View key={i} style={styles.stepItem}>
              <View style={styles.stepIconBox}><Text style={styles.stepIcon}>{s.icon}</Text></View>
              <Text style={styles.stepTitle}>{s.title}</Text>
              <Text style={styles.stepSub}>{s.sub}</Text>
              {i < 2 && <Text style={styles.stepArrow}>→</Text>}
            </View>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <Image source={{ uri: 'https://www.srilanka.travel/images/logo.png' }} style={styles.footerLogo} resizeMode="contain" />
        <Text style={styles.footerText}>© 2026 Sri Lanka Tourism Management</Text>
        <Text style={styles.footerSub}>"So Sri Lanka" · Official App</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  // Hero
  hero: { width: '100%', height: 320 },
  heroGradient: { flex: 1, padding: 20, justifyContent: 'space-between' },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 30 },
  greeting: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  headerSub: { color: '#B8D7E8', fontSize: 13, marginTop: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoutHeaderBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10 },
  logoutEmoji: { fontSize: 18 },
  avatarBtn: { width: 45, height: 45, borderRadius: 23, borderWidth: 2, borderColor: '#fff', overflow: 'hidden' },
  avatar: { width: '100%', height: '100%' },
  heroContent: { paddingBottom: 10 },
  heroTitle: { color: '#fff', fontSize: 28, fontWeight: 'bold', width: '80%', lineHeight: 36, marginBottom: 20 },
  searchBar: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  searchPlaceholder: { color: '#fff', fontSize: 14 },

  // Categories
  categoryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: -30 },
  catItem: { alignItems: 'center', flex: 1 },
  catIconBox: { width: 60, height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1 },
  catIcon: { fontSize: 28 },
  catTitle: { marginTop: 8, fontSize: 12, fontWeight: 'bold', color: '#333' },

  // Section
  section: { paddingHorizontal: 20, marginTop: 30 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A3A4A' },
  seeAll: { color: '#0D5F8A', fontSize: 13, fontWeight: 'bold' },

  // Carousel
  carousel: { marginRight: -20 },
  featCard: { width: 220, height: 160, borderRadius: 16, marginRight: 15, overflow: 'hidden', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15 },
  featImg: { width: '100%', height: '100%' },
  featGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12 },
  featTitle: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  featLoc: { color: '#B8D7E8', fontSize: 11, marginTop: 2 },
  featBadge: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  featBadgeText: { fontSize: 10, fontWeight: 'bold', color: '#F39C12' },

  // Provider Card
  providerCard: { width: 140, backgroundColor: '#fff', borderRadius: 16, marginRight: 15, padding: 15, alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1 },
  providerIconBox: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  providerIcon: { fontSize: 24 },
  providerName: { fontSize: 13, fontWeight: 'bold', color: '#1A3A4A', textAlign: 'center', marginBottom: 6 },
  providerRatingRow: { flexDirection: 'row', alignItems: 'center' },
  providerStar: { fontSize: 11, fontWeight: 'bold', color: '#F39C12', marginRight: 4 },
  providerReviews: { fontSize: 10, color: '#999' },

  // Promo
  promoBanner: { marginHorizontal: 20, marginTop: 30, borderRadius: 16, overflow: 'hidden', elevation: 5 },
  promoGradient: { padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  promoContent: { flex: 1 },
  promoTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  promoSub: { color: '#B8D7E8', fontSize: 12, marginBottom: 12 },
  promoBtn: { alignSelf: 'flex-start', backgroundColor: '#fff', paddingHorizontal: 15, paddingVertical: 7, borderRadius: 8 },
  promoBtnText: { color: '#0D5F8A', fontWeight: 'bold', fontSize: 13 },
  promoEmoji: { fontSize: 50, opacity: 0.3 },

  // Steps
  stepsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, backgroundColor: '#F5F7FA', borderRadius: 16, padding: 15 },
  stepItem: { flex: 1, alignItems: 'center', position: 'relative' },
  stepIconBox: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  stepIcon: { fontSize: 20 },
  stepTitle: { fontSize: 11, fontWeight: 'bold', color: '#333', marginBottom: 2 },
  stepSub: { fontSize: 9, color: '#888', textAlign: 'center' },
  stepArrow: { position: 'absolute', right: -15, top: 12, fontSize: 16, color: '#DDD' },

  // Footer
  footer: { padding: 40, alignItems: 'center', backgroundColor: '#F9FAFB', marginTop: 40 },
  footerLogo: { width: 120, height: 60, marginBottom: 10 },
  footerText: { fontSize: 11, color: '#999' },
  footerSub: { fontSize: 10, color: '#AAA', marginTop: 4 },
});