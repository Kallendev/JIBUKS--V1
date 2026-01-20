import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [greeting, setGreeting] = useState('Good Morning');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  // Mock Data
  const recentActivities = [
    { id: 1, title: 'Cheque #204 Cleared', date: 'Today, 10:23 AM', type: 'success', amount: 'KES 500' },
    { id: 2, title: 'New Supplier Added', date: 'Yesterday, 4:15 PM', type: 'info', amount: '' },
    { id: 3, title: 'Rent Payment Pending', date: 'Jan 10, 2026', type: 'warning', amount: 'KES 25,000' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#122f8a" />

      {/* Scrollable Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <LinearGradient
          colors={['#122f8a', '#0a1a5c']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greetingText}>{greeting},</Text>
              <Text style={styles.userName}>{user?.name || 'Valued Member'}</Text>
            </View>
            <TouchableOpacity style={styles.notificationBtn}>
              <Ionicons name="notifications-outline" size={24} color="#ffffff" />
              <View style={styles.notificationBadge} />
            </TouchableOpacity>
          </View>

          {/* Quick Balance Card */}
          <View style={styles.balanceCard}>
            <View>
              <Text style={styles.balanceLabel}>Total Balance</Text>
              <Text style={styles.balanceAmount}>KES 1,250,500</Text>
            </View>
            <View style={styles.balanceRow}>
              <View style={styles.balanceItem}>
                <View style={[styles.trendIcon, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                  <Ionicons name="arrow-up" size={14} color="#10b981" />
                </View>
                <Text style={styles.trendText}>+12% vs last month</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Quick Actions Grid */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
          <View style={styles.actionsGrid}>

            {/* Invoice (Create) */}
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/create-invoice')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#dcfce7' }]}>
                <Ionicons name="receipt" size={24} color="#15803d" />
              </View>
              <Text style={styles.actionLabel}>Invoice</Text>
            </TouchableOpacity>

            {/* Enter Bill (Create) */}
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/new-purchase')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#ffedd5' }]}>
                <Ionicons name="document-text" size={24} color="#c2410c" />
              </View>
              <Text style={styles.actionLabel}>Enter Bill</Text>
            </TouchableOpacity>

            {/* Cheques (List Area) */}
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/transactions')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#f3e8ff' }]}>
                <Ionicons name="wallet" size={24} color="#7c3aed" />
              </View>
              <Text style={styles.actionLabel}>Cheques</Text>
            </TouchableOpacity>

            {/* Suppliers (List Area) */}
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/analytics')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#e0e7ff' }]}>
                <Ionicons name="people" size={24} color="#4338ca" />
              </View>
              <Text style={styles.actionLabel}>Suppliers</Text>
            </TouchableOpacity>

            {/* Reports (Records Tab) */}
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/community')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#f1f5f9' }]}>
                <Ionicons name="stats-chart" size={24} color="#475569" />
              </View>
              <Text style={styles.actionLabel}>Reports</Text>
            </TouchableOpacity>

            {/* Customers (List) */}
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/customers')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#ffe4e6' }]}>
                <Ionicons name="accessibility" size={24} color="#be123c" />
              </View>
              <Text style={styles.actionLabel}>Customers</Text>
            </TouchableOpacity>

            {/* Expense */}
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/add-expense')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#f0f9ff' }]}>
                <Ionicons name="receipt-outline" size={24} color="#0284c7" />
              </View>
              <Text style={styles.actionLabel}>Expense</Text>
            </TouchableOpacity>

            {/* Purchase (Inventory/Assets) */}
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/new-purchase')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#e0e7ff' }]}>
                <Ionicons name="cart" size={24} color="#4338ca" />
              </View>
              <Text style={styles.actionLabel}>Purchase</Text>
            </TouchableOpacity>

            {/* Deposit */}
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/deposit-cheque')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#fee2e2' }]}>
                <Ionicons name="arrow-down-circle" size={24} color="#dc2626" />
              </View>
              <Text style={styles.actionLabel}>Deposit</Text>
            </TouchableOpacity>

          </View>
        </View>


        {/* Recent Activity */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>RECENT ACTIVITY</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.activityList}>
            {recentActivities.map((item, index) => (
              <View key={item.id}>
                <TouchableOpacity style={styles.activityItem}>
                  <View style={[
                    styles.activityIcon,
                    item.type === 'success' ? { backgroundColor: '#dcfce7' } :
                      item.type === 'warning' ? { backgroundColor: '#fef3c7' } :
                        { backgroundColor: '#e0f2fe' }
                  ]}>
                    <Ionicons
                      name={
                        item.type === 'success' ? 'checkmark-circle' :
                          item.type === 'warning' ? 'time' : 'information-circle'
                      }
                      size={20}
                      color={
                        item.type === 'success' ? '#15803d' :
                          item.type === 'warning' ? '#b45309' : '#0369a1'
                      }
                    />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityTitle}>{item.title}</Text>
                    <Text style={styles.activityDate}>{item.date}</Text>
                  </View>
                  {item.amount ? (
                    <Text style={styles.activityAmount}>{item.amount}</Text>
                  ) : null}
                </TouchableOpacity>
                {index < recentActivities.length - 1 && <View style={styles.separator} />}
              </View>
            ))}
          </View>
        </View>

        {/* Extra Height for Tab Bar */}
        <View style={{ height: 80 }} />

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    paddingTop: Platform.OS === 'android' ? 60 : 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greetingText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  userName: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  notificationBadge: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fe9900',
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  balanceCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  balanceAmount: {
    fontSize: 26,
    color: '#ffffff',
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  balanceRow: {
    alignItems: 'flex-end',
  },
  balanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  trendIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  trendText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  sectionContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  seeAllText: {
    fontSize: 13,
    color: '#122f8a',
    fontWeight: '600',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionCard: {
    width: '23%', // 4 columns roughly
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 4,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
  },
  activityList: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 8,
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  activityDate: {
    fontSize: 12,
    color: '#94a3b8',
  },
  activityAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
  },
  separator: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginLeft: 64, // offset for icon
  },
});
