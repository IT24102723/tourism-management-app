import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Alert, Image, Dimensions, Platform } from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { getPrimaryImage } from '../utils/imageUtils';

const { width } = Dimensions.get('window');

export default function AttractionDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const { user } = useContext(AuthContext);
  const [attraction, setAttraction] = useState(null);
  const [feedbackSummary, setFeedbackSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { 
    fetchAttraction(); 
    fetchFeedback();
  }, []);

  const fetchAttraction = async () => {
    try {
      const res = await API.get(`/attractions/${id}`);
      setAttraction(res.data.data || res.data);
    } catch (e) { 
      console.error('Error fetching attraction:', e.message);
      Alert.alert('Error', 'Failed to load attraction details');
    }
    setLoading(false);
  };

  const fetchFeedback = async () => {
    try {
      const res = await API.get(`/feedback/summary/Attraction/${id}`);
      setFeedbackSummary(res.data.data || null);
    } catch (e) {
      console.error('Error fetching feedback:', e.message);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#2E86AB" />
      </View>
    );
  }

  if (!attraction) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.errorText}>Attraction not found</Text>
        <TouchableOpacity 
          style={styles.backBtn} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusColor = {
    Open: '#27AE60',
    Closed: '#E74C3C',
    Seasonal: '#F39C12',
    Under_Maintenance: '#95A5A6'
  };

  return (
    <View style={StyleSheet.absoluteFill}>
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 120 }}
        showsVerticalScrollIndicator={true}
      >
        {/* Header Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: getPrimaryImage(attraction) || `https://picsum.photos/seed/attraction${id}/600/300` }}
            style={styles.headerImage}
          />
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          
          {/* Status and Rating Badges */}
          <View style={styles.badgesContainer}>
            <View style={[styles.statusBadge, { backgroundColor: statusColor[attraction.operational_status] }]}>
              <Text style={styles.badgeText}>{attraction.operational_status}</Text>
            </View>
            {attraction.average_rating > 0 && (
              <View style={styles.ratingBadge}>
                <Text style={styles.badgeText}>⭐ {attraction.average_rating.toFixed(1)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Title Section */}
          <Text style={styles.title}>{attraction.name}</Text>
          
          <View style={styles.metaRow}>
            <Text style={styles.category}>{attraction.category}</Text>
            <Text style={styles.divider}>•</Text>
            <Text style={styles.city}>{attraction.city}</Text>
          </View>

          {/* Info Cards */}
          <View style={styles.infoGrid}>
            {attraction.entrance_fee > 0 && (
              <View style={styles.infoCard}>
                <Text style={styles.infoIcon}>💰</Text>
                <Text style={styles.infoLabel}>Entry Fee</Text>
                <Text style={styles.infoValue}>LKR {attraction.entrance_fee}</Text>
              </View>
            )}
            {attraction.opening_hours && (
              <View style={styles.infoCard}>
                <Text style={styles.infoIcon}>🕐</Text>
                <Text style={styles.infoLabel}>Hours</Text>
                <Text style={styles.infoValue} numberOfLines={1}>{attraction.opening_hours}</Text>
              </View>
            )}
            {attraction.rating_count > 0 && (
              <View style={styles.infoCard}>
                <Text style={styles.infoIcon}>👥</Text>
                <Text style={styles.infoLabel}>Reviews</Text>
                <Text style={styles.infoValue}>{attraction.rating_count}</Text>
              </View>
            )}
          </View>

          {/* About Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About this Destination</Text>
            <View style={styles.descCard}>
              <Text style={styles.description}>
                {attraction.description || 'No description available for this attraction.'}
              </Text>
            </View>
          </View>

          {/* Facilities Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Facilities & Amenities</Text>
            <View style={styles.facilitiesGrid}>
              <View style={styles.facilityItem}><Text style={styles.facilityEmoji}>🚗</Text><Text style={styles.facilityText}>Parking</Text></View>
              <View style={styles.facilityItem}><Text style={styles.facilityEmoji}>📷</Text><Text style={styles.facilityText}>Photos</Text></View>
              <View style={styles.facilityItem}><Text style={styles.facilityEmoji}>🚻</Text><Text style={styles.facilityText}>Restrooms</Text></View>
              <View style={styles.facilityItem}><Text style={styles.facilityEmoji}>☕</Text><Text style={styles.facilityText}>Cafe</Text></View>
            </View>
          </View>

          {/* Reviews Section */}
          {feedbackSummary && feedbackSummary.recent_reviews?.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Reviews ({feedbackSummary.summary?.total_reviews || 0})</Text>
              {feedbackSummary.recent_reviews.map((review, idx) => (
                <View key={review.feedback_id || idx} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewUser}>👤 {review.username || review.full_name || 'Tourist'}</Text>
                    <Text style={styles.reviewRating}>{'★'.repeat(review.rating || 0)}</Text>
                  </View>
                  <Text style={styles.reviewText}>{review.review_text || review.comment}</Text>
                  <Text style={styles.reviewDate}>{new Date(review.created_at).toLocaleDateString()}</Text>
                  
                  {review.admin_response && (
                    <View style={styles.adminResponseContainer}>
                      <Text style={styles.adminResponseTitle}>💬 Response from Management</Text>
                      <Text style={styles.adminResponseText}>{review.admin_response}</Text>
                      {review.response_date && (
                        <Text style={styles.adminResponseDate}>{new Date(review.response_date).toLocaleDateString()}</Text>
                      )}
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.secondaryButton]}
              onPress={() => navigation.navigate('Feedback', { target_type: 'Attraction', target_id: id })}
            >
              <Text style={styles.secondaryButtonText}>💬 Leave Feedback</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 250,
  },
  headerImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E0E0E0',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  badgesContainer: {
    position: 'absolute',
    bottom: 12,
    left: 16,
    right: 16,
    flexDirection: 'row',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  ratingBadge: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  content: {
    padding: 16,
    paddingTop: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1A3A4A',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  category: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E86AB',
  },
  divider: {
    color: '#DDD',
    marginHorizontal: 8,
  },
  city: {
    fontSize: 14,
    color: '#666',
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 8,
  },
  infoCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
  },
  infoIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: 11,
    color: '#999',
    fontWeight: '600',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A3A4A',
    marginBottom: 12,
  },
  descCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
  },
  description: {
    fontSize: 15,
    color: '#444',
    lineHeight: 24,
  },
  facilitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  facilityItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
    minWidth: 80,
  },
  facilityEmoji: { fontSize: 16, marginRight: 8 },
  facilityText: { fontSize: 12, color: '#666', fontWeight: '500' },
  buttonContainer: {
    gap: 12,
    marginBottom: 32,
    marginTop: 10,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#2E86AB',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#2E86AB',
  },
  secondaryButtonText: {
    color: '#2E86AB',
    fontWeight: 'bold',
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  backBtn: {
    backgroundColor: '#2E86AB',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  reviewCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  reviewUser: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  reviewRating: {
    fontSize: 14,
    color: '#F39C12',
  },
  reviewText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 8,
  },
  reviewDate: {
    fontSize: 11,
    color: '#999',
  },
  adminResponseContainer: {
    marginTop: 12,
    backgroundColor: '#F9FBFD',
    borderLeftWidth: 3,
    borderLeftColor: '#0D5F8A',
    padding: 12,
    borderRadius: 8,
  },
  adminResponseTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0D5F8A',
    marginBottom: 4,
  },
  adminResponseText: {
    fontSize: 13,
    color: '#444',
    lineHeight: 18,
  },
  adminResponseDate: {
    fontSize: 10,
    color: '#888',
    marginTop: 6,
  },
});