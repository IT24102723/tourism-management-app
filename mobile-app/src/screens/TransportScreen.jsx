import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, TextInput, Modal } from 'react-native';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';

const vehicleTypeEmoji = {
  Bus: '🚌',
  Van: '🚐',
  Jeep: '🚙',
  Car: '🚗',
  Truck: '🚚',
};

export default function TransportScreen({ navigation }) {
  const { user } = React.useContext(AuthContext);
  const [vehicles, setVehicles] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('vehicles');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    vehicle_id: '',
    departure_date: '',
    departure_time: '',
    destination: '',
    num_seats: '1',
  });

  useEffect(() => {
    fetchVehicles();
    fetchSchedules();
  }, []);

  const fetchVehicles = async () => {
    try {
      const res = await API.get('/transport/vehicles?available=true');
      setVehicles(res.data.data?.vehicles || []);
    } catch (e) {
      console.error('Error fetching vehicles:', e.message);
    }
    setLoading(false);
  };

  const fetchSchedules = async () => {
    try {
      const res = await API.get('/transport/schedules');
      setSchedules(res.data.data?.schedules || []);
    } catch (e) {
      console.error('Error fetching schedules:', e.message);
    }
  };

  const handleCreateSchedule = async () => {
    if (!scheduleForm.vehicle_id || !scheduleForm.departure_date || !scheduleForm.destination) {
      alert('Please fill all fields');
      return;
    }
    
    try {
      await API.post('/transport/schedules', scheduleForm);
      setShowScheduleModal(false);
      setScheduleForm({
        vehicle_id: '',
        departure_date: '',
        departure_time: '',
        destination: '',
        num_seats: '1',
      });
      fetchSchedules();
      alert('Schedule created successfully!');
    } catch (e) {
      alert('Error creating schedule: ' + (e.response?.data?.message || e.message));
    }
  };

  const renderVehicleCard = ({ item }) => (
    <TouchableOpacity style={styles.vehicleCard} activeOpacity={0.8}>
      <View style={styles.vehicleHeader}>
        <Text style={styles.vehicleIcon}>{vehicleTypeEmoji[item.vehicle_type] || '🚗'}</Text>
        <View style={styles.vehicleInfo}>
          <Text style={styles.vehicleType}>{item.vehicle_type}</Text>
          <Text style={styles.licensePlate}>{item.registration_number || item.license_plate || 'No Plate'}</Text>
        </View>
        <View style={[styles.availabilityBadge, { backgroundColor: item.is_available ? '#27AE60' : '#E74C3C' }]}>
          <Text style={styles.availabilityText}>{item.is_available ? '✓ Available' : '✗ Booked'}</Text>
        </View>
      </View>

      <View style={styles.vehicleDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>👥 Capacity:</Text>
          <Text style={styles.detailValue}>{item.capacity} seats</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>💰 Price:</Text>
          <Text style={styles.detailValue}>LKR {item.price_per_day || item.rental_price_per_day || 0}/day</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>⚙️ Condition:</Text>
          <Text style={styles.detailValue}>{item.is_airconditioned ? 'A/C Available' : 'Non A/C'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>🏢 Provider:</Text>
          <Text style={styles.detailValue}>{item.business_name || 'N/A'}</Text>
        </View>
      </View>

      {user?.role !== 'Tourist' && (
        <TouchableOpacity 
          style={styles.bookBtn}
          onPress={() => {
            setScheduleForm({ ...scheduleForm, vehicle_id: item.vehicle_id });
            setShowScheduleModal(true);
          }}
        >
          <Text style={styles.bookBtnText}>📅 Create Schedule</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  const renderScheduleCard = ({ item }) => (
    <View style={styles.scheduleCard}>
      <View style={styles.scheduleHeader}>
        <Text style={styles.scheduleDestination}>{item.destination}</Text>
        <Text style={[styles.scheduleStatus, { color: item.status === 'Available' ? '#27AE60' : '#F39C12' }]}>
          {item.status || 'Scheduled'}
        </Text>
      </View>

      <View style={styles.scheduleDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>📅 Date:</Text>
          <Text style={styles.detailValue}>{item.departure_date?.split('T')[0]}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>🕐 Time:</Text>
          <Text style={styles.detailValue}>{item.departure_time || 'Not specified'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>🚗 Vehicle:</Text>
          <Text style={styles.detailValue}>{item.vehicle_type || 'N/A'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>💺 Seats Available:</Text>
          <Text style={styles.detailValue}>{item.available_seats || item.num_seats || 'N/A'}</Text>
        </View>
      </View>

      {user?.role !== 'Tourist' && (
        <TouchableOpacity style={styles.bookBtn}>
          <Text style={styles.bookBtnText}>✅ Book This Schedule</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🚗 Transport Services</Text>
      </View>

      {/* Tab Buttons */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'vehicles' && styles.tabBtnActive]}
          onPress={() => setActiveTab('vehicles')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'vehicles' && styles.tabBtnTextActive]}>
            🚌 Vehicles
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'schedules' && styles.tabBtnActive]}
          onPress={() => setActiveTab('schedules')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'schedules' && styles.tabBtnTextActive]}>
            📅 Schedules
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <ActivityIndicator size="large" color="#2E86AB" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={activeTab === 'vehicles' ? vehicles : schedules}
          keyExtractor={(item, idx) => activeTab === 'vehicles' ? `v-${item.vehicle_id || idx}` : `s-${item.schedule_id || idx}`}
          renderItem={activeTab === 'vehicles' ? renderVehicleCard : renderScheduleCard}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {activeTab === 'vehicles' ? 'No vehicles available' : 'No schedules yet'}
            </Text>
          }
        />
      )}

      {/* Create Schedule Modal */}
      <Modal visible={showScheduleModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>📅 Create Transport Schedule</Text>

            <ScrollView style={styles.formContainer}>
              <Text style={styles.formLabel}>Vehicle ID</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 4001"
                value={scheduleForm.vehicle_id}
                onChangeText={(text) => setScheduleForm({ ...scheduleForm, vehicle_id: text })}
                keyboardType="numeric"
              />

              <Text style={styles.formLabel}>Destination</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Colombo to Galle"
                value={scheduleForm.destination}
                onChangeText={(text) => setScheduleForm({ ...scheduleForm, destination: text })}
              />

              <Text style={styles.formLabel}>Departure Date</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                value={scheduleForm.departure_date}
                onChangeText={(text) => setScheduleForm({ ...scheduleForm, departure_date: text })}
              />

              <Text style={styles.formLabel}>Departure Time</Text>
              <TextInput
                style={styles.input}
                placeholder="HH:MM"
                value={scheduleForm.departure_time}
                onChangeText={(text) => setScheduleForm({ ...scheduleForm, departure_time: text })}
              />

              <Text style={styles.formLabel}>Number of Seats</Text>
              <TextInput
                style={styles.input}
                placeholder="1"
                value={scheduleForm.num_seats}
                onChangeText={(text) => setScheduleForm({ ...scheduleForm, num_seats: text })}
                keyboardType="numeric"
              />
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={() => setShowScheduleModal(false)}>
                <Text style={styles.cancelBtnText}>❌ Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.submitBtn]} onPress={handleCreateSchedule}>
                <Text style={styles.submitBtnText}>✅ Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    backgroundColor: '#2E86AB',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: '#2E86AB',
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
  },
  tabBtnTextActive: {
    color: '#2E86AB',
  },
  vehicleCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
  },
  vehicleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  vehicleIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  licensePlate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  availabilityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  availabilityText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  vehicleDetails: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  scheduleCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingBottom: 12,
  },
  scheduleDestination: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  scheduleStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  scheduleDetails: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
  },
  bookBtn: {
    backgroundColor: '#2E86AB',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  bookBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 60,
    fontSize: 14,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 16,
  },
  formContainer: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#333',
    backgroundColor: '#FAFAFA',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  btn: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#FFE8E8',
  },
  cancelBtnText: {
    color: '#E74C3C',
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: '#2E86AB',
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
});
