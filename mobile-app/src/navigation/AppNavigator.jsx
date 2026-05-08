import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { AuthContext } from '../context/AuthContext';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import AttractionsScreen from '../screens/AttractionsScreen';
import AttractionDetailScreen from '../screens/AttractionDetailScreen';
import PackagesScreen from '../screens/PackagesScreen';
import PackageDetailScreen from '../screens/PackageDetailScreen';
import BookingConfigScreen from '../screens/BookingConfigScreen';
import PackageBookingScreen from '../screens/PackageBookingScreen';
import TransportSelectionScreen from '../screens/TransportSelectionScreen';
import PaymentScreen from '../screens/PaymentScreen';
import BookingsScreen from '../screens/BookingsScreen';
import BookingDetailScreen from '../screens/BookingDetailScreen';
import TransportScreen from '../screens/TransportScreen';
import ProfileScreen from '../screens/ProfileScreen';
import FeedbackScreen from '../screens/FeedbackScreen';
import MyFeedbackScreen from '../screens/MyFeedbackScreen';
import InquiryScreen from '../screens/InquiryScreen';
import ProvidersScreen from '../screens/ProvidersScreen';
import ProviderDetailScreen from '../screens/ProviderDetailScreen';
import WelcomeScreen from '../screens/WelcomeScreen';

// Admin Screens
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import AdminAttractionsScreen from '../screens/AdminAttractionsScreen';
import AdminPackagesScreen from '../screens/AdminPackagesScreen';
import AdminVehiclesScreen from '../screens/AdminVehiclesScreen';
import AdminPaymentsScreen from '../screens/AdminPaymentsScreen';
import AdminSchedulesScreen from '../screens/AdminSchedulesScreen';
import AdminBookingsScreen from '../screens/AdminBookingsScreen';
import AdminProvidersScreen from '../screens/AdminProvidersScreen';
import AdminAnalyticsScreen from '../screens/AdminAnalyticsScreen';
import AdminInquiriesScreen from '../screens/AdminInquiriesScreen';
import AdminFeedbackScreen from '../screens/AdminFeedbackScreen';

// Provider Screens
import ProviderDashboardScreen from '../screens/ProviderDashboardScreen';
import ProviderProfileScreen from '../screens/ProviderProfileScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => (
    <Tab.Navigator screenOptions={{ tabBarActiveTintColor: '#2E86AB', headerShown: false }}>
        <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarIcon: () => <Text>🏠</Text> }} />
        <Tab.Screen name="Attractions" component={AttractionsScreen} options={{ tabBarIcon: () => <Text>🏝️</Text> }} />
        <Tab.Screen name="Packages" component={PackagesScreen} options={{ tabBarIcon: () => <Text>🧳</Text> }} />
        <Tab.Screen name="Providers" component={ProvidersScreen} options={{ tabBarIcon: () => <Text>🏢</Text> }} />
        <Tab.Screen name="Bookings" component={BookingsScreen} options={{ tabBarIcon: () => <Text>📅</Text> }} />
        <Tab.Screen name="Transport" component={TransportScreen} options={{ tabBarIcon: () => <Text>🚗</Text> }} />
        <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: () => <Text>👤</Text> }} />
    </Tab.Navigator>
);

const AdminTabs = () => (
    <Tab.Navigator screenOptions={{ tabBarActiveTintColor: '#0D5F8A', headerShown: false }}>
        <Tab.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ title: 'Dashboard', tabBarIcon: () => <Text>⚙️</Text> }} />
        <Tab.Screen name="AdminProviders" component={AdminProvidersScreen} options={{ title: 'Providers', tabBarIcon: () => <Text>🏢</Text> }} />
        <Tab.Screen name="AdminAttractions" component={AdminAttractionsScreen} options={{ title: 'Attractions', tabBarIcon: () => <Text>🏝️</Text> }} />
        <Tab.Screen name="AdminPackages" component={AdminPackagesScreen} options={{ title: 'Packages', tabBarIcon: () => <Text>🧳</Text> }} />
        <Tab.Screen name="AdminVehicles" component={AdminVehiclesScreen} options={{ title: 'Vehicles', tabBarIcon: () => <Text>🚗</Text> }} />
        <Tab.Screen name="AdminBookings" component={AdminBookingsScreen} options={{ title: 'Bookings', tabBarIcon: () => <Text>🗂️</Text> }} />
        <Tab.Screen name="AdminInquiries" component={AdminInquiriesScreen} options={{ title: 'Inquiries', tabBarIcon: () => <Text>📨</Text> }} />
        <Tab.Screen name="AdminFeedback" component={AdminFeedbackScreen} options={{ title: 'Feedback', tabBarIcon: () => <Text>⭐</Text> }} />
        <Tab.Screen name="AdminAnalytics" component={AdminAnalyticsScreen} options={{ title: 'Analytics', tabBarIcon: () => <Text>📊</Text> }} />
    </Tab.Navigator>
);

const ProviderTabs = () => (
    <Tab.Navigator screenOptions={{ tabBarActiveTintColor: '#0D5F8A', headerShown: false }}>
        <Tab.Screen name="ProviderDashboard" component={ProviderDashboardScreen} options={{ title: 'Dashboard', tabBarIcon: () => <Text>🏢</Text> }} />
        <Tab.Screen name="MyPackages" component={AdminPackagesScreen} options={{ title: 'Packages', tabBarIcon: () => <Text>🧳</Text> }} />
        <Tab.Screen name="MyVehicles" component={AdminVehiclesScreen} options={{ title: 'Vehicles', tabBarIcon: () => <Text>🚗</Text> }} />
        <Tab.Screen name="ProviderProfile" component={ProviderProfileScreen} options={{ title: 'Profile', tabBarIcon: () => <Text>👤</Text> }} />
    </Tab.Navigator>
);

export default function AppNavigator() {
    const { user, loading } = useContext(AuthContext);
    if (loading) return null;

    const isAdmin = user && (user.role === 'Admin' || user.role === 'Tourism_Authority');

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {user ? (
                    isAdmin ? (
                        <>
                            <Stack.Screen name="AdminMain" component={AdminTabs} />
                            <Stack.Screen name="AdminPackages" component={AdminPackagesScreen} />
                            <Stack.Screen name="AdminVehicles" component={AdminVehiclesScreen} />
                            <Stack.Screen name="AdminSchedules" component={AdminSchedulesScreen} />
                            <Stack.Screen name="AdminBookings" component={AdminBookingsScreen} />
                            <Stack.Screen name="AdminProviders" component={AdminProvidersScreen} />
                            <Stack.Screen name="AdminInquiries" component={AdminInquiriesScreen} />
                            <Stack.Screen name="AdminFeedback" component={AdminFeedbackScreen} />
                            <Stack.Screen name="AdminAnalytics" component={AdminAnalyticsScreen} />
                            <Stack.Screen name="AdminPayments" component={AdminPaymentsScreen} />
                        </>
                    ) : user.role === 'Service_Provider' ? (
                        <>
                            <Stack.Screen name="ProviderMain" component={ProviderTabs} />
                            <Stack.Screen name="ProviderProfile" component={ProviderProfileScreen} />
                            <Stack.Screen name="AdminSchedules" component={AdminSchedulesScreen} />
                            <Stack.Screen name="AdminInquiries" component={AdminInquiriesScreen} />
                            <Stack.Screen name="AdminFeedback" component={AdminFeedbackScreen} />
                        </>
                    ) : (
                        <>
                            <Stack.Screen name="Main" component={MainTabs} />
                            <Stack.Screen name="AttractionDetail" component={AttractionDetailScreen} />
                            <Stack.Screen name="PackageDetail" component={PackageDetailScreen} />
                            <Stack.Screen name="BookingConfig" component={BookingConfigScreen} />
                            <Stack.Screen name="PackageBooking" component={PackageBookingScreen} />
                            <Stack.Screen name="BookingDetail" component={BookingDetailScreen} />
                            <Stack.Screen name="TransportSelection" component={TransportSelectionScreen} />
                            <Stack.Screen name="Payment" component={PaymentScreen} />
                            <Stack.Screen name="Feedback" component={FeedbackScreen} />
                            <Stack.Screen name="MyFeedback" component={MyFeedbackScreen} />
                            <Stack.Screen name="Inquiry" component={InquiryScreen} />
                            <Stack.Screen name="ProviderDetail" component={ProviderDetailScreen} />
                        </>
                    )
                ) : (
                    <>
                        <Stack.Screen name="Welcome" component={WelcomeScreen} />
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="Register" component={RegisterScreen} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}