import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  Alert, ScrollView, ActivityIndicator, StatusBar, FlatList, Platform, Dimensions 
} from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
import API from '../services/api';
import { LinearGradient } from 'expo-linear-gradient';

const CATEGORIES = [
  { type: 'Attraction', icon: '🏝️', label: 'Attraction' },
  { type: 'Package', icon: '🧳', label: 'Package' },
  { type: 'Provider', icon: '🏢', label: 'Service Provider' },
  { type: 'Vehicle', icon: '🚗', label: 'Transport' },
];

export default function FeedbackScreen({ route, navigation }) {
  const { target_type: initialType, target_id: initialId, booking_id } = route.params || {};
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Category selection
  const [selectedCategory, setSelectedCategory] = useState(initialType || null);
  const [selectedTarget, setSelectedTarget] = useState(initialId || null);
  const [targets, setTargets] = useState([]);
  const [loadingTargets, setLoadingTargets] = useState(false);

  useEffect(() => {
    if (selectedCategory && !initialId) {
      fetchTargets(selectedCategory);
    }
  }, [selectedCategory]);

  const fetchTargets = async (type) => {
    setLoadingTargets(true);
    setSelectedTarget(null);
    try {
      let items = [];
      if (type === 'Attraction') {
        const res = await API.get('/attractions');
        const data = res.data?.data?.attractions || [];
        items = data.map(a => ({ id: a.attraction_id, name: a.name }));
      } else if (type === 'Package') {
        const res = await API.get('/packages');
        const data = res.data?.data?.packages || [];
        items = data.map(p => ({ id: p.package_id, name: p.title }));
      } else if (type === 'Provider') {
        const res = await API.get('/providers');
        const data = res.data?.data?.providers || res.data?.data || [];
        items = data.map(p => ({ id: p.provider_id, name: p.business_name }));
      } else if (type === 'Vehicle') {
        const res = await API.get('/transport/vehicles?available=true');
        const data = res.data?.data?.vehicles || [];
        items = data.map(v => ({ id: v.vehicle_id, name: v.vehicle_name || `${v.vehicle_type} - ${v.registration_number}` }));
      }
      setTargets(items);
    } catch (e) {
      console.log('Error loading targets:', e.message);
      setTargets([]);
    }
    setLoadingTargets(false);
  };

  const submit = async () => {
    if (!comment.trim()) return Alert.alert('Error', 'Please share your experience in the comment section.');
    if (!selectedCategory) return Alert.alert('Error', 'Please select a category.');
    if (!selectedTarget) return Alert.alert('Error', 'Please select what you want to review.');
    
    setLoading(true);
    try {
      await API.post('/feedback', { 
        target_type: selectedCategory, 
        target_id: selectedTarget, 
        booking_id,
        rating, 
        review_text: comment 
      });
      
      Alert.alert(
        '✅ Thank You!', 
        'Your feedback helps us improve Sri Lanka Tourism.', 
        [{ text: 'Great', onPress: () => navigation.goBack() }]
      );
    } catch (e) {
      console.log(e.response?.data);
      Alert.alert('Error', e.response?.data?.message || 'Could not submit feedback');
    }
    setLoading(false);
  };

  return (
    <ScrollView
        style={styles.container} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={true}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#0D5F8A', '#2E86AB']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Share Experience</Text>
        <Text style={styles.subtitle}>Help others discover the best of Sri Lanka 🇱🇰</Text>
      </LinearGradient>

      <View style={styles.content}>
        {/* Category Selection */}
        {!initialType && (
          <View style={styles.section}>
            <Text style={styles.label}>What would you like to review?</Text>
            <View style={styles.catGrid}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat.type}
                  style={[styles.catCard, selectedCategory === cat.type && styles.catCardActive]}
                  onPress={() => setSelectedCategory(cat.type)}
                >
                  <Text style={styles.catIcon}>{cat.icon}</Text>
                  <Text style={[styles.catLabel, selectedCategory === cat.type && styles.catLabelActive]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Target Selection */}
        {selectedCategory && !initialId && (
          <View style={styles.section}>
            <Text style={styles.label}>Select {selectedCategory}</Text>
            {loadingTargets ? (
              <ActivityIndicator color="#0D5F8A" style={{ marginVertical: 16 }} />
            ) : targets.length === 0 ? (
              <Text style={styles.noTargets}>No items found in this category</Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {targets.map(t => (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.targetChip, selectedTarget === t.id && styles.targetChipActive]}
                    onPress={() => setSelectedTarget(t.id)}
                  >
                    <Text style={[styles.targetText, selectedTarget === t.id && styles.targetTextActive]} numberOfLines={1}>
                      {t.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        )}

        {/* Rating */}
        <View style={styles.card}>
          <Text style={styles.targetLabel}>
            {selectedCategory ? `Rating for ${selectedCategory.replace('_', ' ')}` : 'Your Rating'}
          </Text>
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map(n => (
              <TouchableOpacity key={n} onPress={() => setRating(n)} activeOpacity={0.7}>
                <Text style={[styles.star, { color: n <= rating ? '#F39C12' : '#E0E0E0' }]}>★</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.ratingHint}>
            {rating === 5 ? 'Excellent!' : rating === 4 ? 'Very Good' : rating === 3 ? 'Good' : rating === 2 ? 'Fair' : 'Poor'}
          </Text>
        </View>

        {/* Review Text */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>Your Review</Text>
          <TextInput 
            style={styles.textArea} 
            placeholder="What did you love? How can we improve?..."
            placeholderTextColor="#BBB"
            value={comment} 
            onChangeText={setComment}
            multiline 
            numberOfLines={6} 
            textAlignVertical="top" 
          />
        </View>

        <TouchableOpacity 
          style={[styles.btn, (!comment.trim() || !selectedCategory || !selectedTarget) && { opacity: 0.6 }]} 
          onPress={submit} 
          disabled={loading || !comment.trim() || !selectedCategory || !selectedTarget}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Submit Review →</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
    
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { paddingTop: 60, paddingBottom: 30, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  backBtn: { marginBottom: 15 },
  backText: { color: '#87CEEB', fontSize: 15, fontWeight: '600' },
  title: { fontSize: 26, fontWeight: 'bold', color: '#fff', marginBottom: 5 },
  subtitle: { fontSize: 13, color: '#B8D7E8', lineHeight: 18 },
  
  content: { flex: 1, padding: 20, marginTop: -20, backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  
  section: { marginBottom: 20 },
  label: { fontSize: 15, fontWeight: 'bold', color: '#1A3A4A', marginBottom: 12 },
  
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  catCard: { 
    width: '47%', backgroundColor: '#F9FAFB', borderRadius: 14, padding: 16, 
    alignItems: 'center', borderWidth: 2, borderColor: '#F0F0F0',
  },
  catCardActive: { borderColor: '#0D5F8A', backgroundColor: '#E8F4FD' },
  catIcon: { fontSize: 28, marginBottom: 8 },
  catLabel: { fontSize: 12, fontWeight: '600', color: '#555' },
  catLabelActive: { color: '#0D5F8A' },
  
  targetChip: { 
    backgroundColor: '#F5F5F5', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, 
    marginRight: 8, borderWidth: 1.5, borderColor: '#E0E0E0', maxWidth: 200,
  },
  targetChipActive: { borderColor: '#0D5F8A', backgroundColor: '#E8F4FD' },
  targetText: { fontSize: 12, fontWeight: '600', color: '#555' },
  targetTextActive: { color: '#0D5F8A' },
  noTargets: { color: '#999', fontStyle: 'italic', textAlign: 'center', paddingVertical: 16 },

  card: { alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 20, padding: 25, marginBottom: 25, borderWidth: 1, borderColor: '#F0F0F0' },
  targetLabel: { fontSize: 12, color: '#999', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 15 },
  stars: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  star: { fontSize: 44 },
  ratingHint: { fontSize: 14, fontWeight: 'bold', color: '#F39C12' },

  inputSection: { marginBottom: 30 },
  textArea: { 
    backgroundColor: '#fff', borderRadius: 16, padding: 18, 
    borderWidth: 1, borderColor: '#EEE', fontSize: 15, color: '#333',
    minHeight: 150, textAlignVertical: 'top',
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05
  },
  
  btn: { 
    backgroundColor: '#0D5F8A', borderRadius: 16, paddingVertical: 18, 
    alignItems: 'center', elevation: 5, shadowColor: '#0D5F8A', 
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3
  },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});