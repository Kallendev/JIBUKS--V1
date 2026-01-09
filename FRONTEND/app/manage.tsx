import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface MenuItem {
  id: string;
  title: string;
  route?: string;
  comingSoon?: boolean;
}

const menuItems: MenuItem[] = [
  { id: '1', title: 'Family Members', route: '/family-settings' },
  { id: '2', title: 'Saving Goals', comingSoon: true },
  { id: '3', title: 'Recurring Transactions', comingSoon: true },
  { id: '4', title: 'Reports & Exports', comingSoon: true },
  { id: '5', title: 'Budget Categories', comingSoon: true },
  { id: '6', title: 'Mpesa Settings', comingSoon: true },
  { id: '7', title: 'App settings', comingSoon: true },
];

export default function ManageScreen() {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  const handleMenuItemPress = (item: MenuItem) => {
    if (item.route) {
      // @ts-ignore - Route exists but not in type definitions
      router.push(item.route);
    } else if (item.comingSoon) {
      // TODO: Navigate to respective screens when implemented
      console.log(`${item.title} - Coming Soon`);
      alert('Coming Soon!\nThis feature is under development.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Blue Header Section */}
      <LinearGradient
        colors={['#1e3a8a', '#2563eb']}
        style={styles.header}
      >
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={32} color="#f59e0b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>MANAGE</Text>
      </LinearGradient>

      {/* White Card Section */}
      <View style={styles.card}>
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {menuItems.map((item, index) => (
            <View key={item.id}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleMenuItemPress(item)}
                activeOpacity={0.7}
              >
                <Text style={styles.menuItemText}>{item.title}</Text>
                <Ionicons name="chevron-forward" size={24} color="#1f2937" />
              </TouchableOpacity>
              {index < menuItems.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e3a8a',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 24,
    top: 60,
    padding: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f59e0b',
    letterSpacing: 1,
  },
  card: {
    flex: 1,
    backgroundColor: '#ffffff',
    marginTop: -20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 24,
  },
  menuItemText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
  },
});
