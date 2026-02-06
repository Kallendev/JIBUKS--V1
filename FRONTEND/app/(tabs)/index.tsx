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
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import apiService from '@/services/api';
import { useCallback } from 'react';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [greeting, setGreeting] = useState('Good Morning');
  const [chequeSummary, setChequeSummary] = useState({
    count: 0,
    totalAmount: 0,
    bankBalance: 0,
    realAvailable: 0,
  });
  const [loadingCheques, setLoadingCheques] = useState(false);

  // Use useFocusEffect ensures data refreshes when navigating back to dashboard
  useFocusEffect(
    useCallback(() => {
      if (user?.tenantId) {
        fetchChequeSummary();
      }
    }, [user?.tenantId])
  );

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  const fetchChequeSummary = async () => {
    if (!user?.tenantId) return;

    try {
      setLoadingCheques(true);
      const summary = await apiService.getChequeSummary(user.tenantId);
      setChequeSummary(summary);
    } catch (error) {
      console.error('Error fetching cheque summary:', error);
    } finally {
      setLoadingCheques(false);
    }
  };

  // Mock Data
  const recentActivities = [
    { id: 1, title: 'Cheque #204 Cleared', date: 'Today, 10:23 AM', type: 'success', amount: 'KES 500' },
    { id: 2, title: 'New Supplier Added', date: 'Yesterday, 4:15 PM', type: 'info', amount: '' },
    { id: 3, title: 'Rent Payment Pending', date: 'Jan 10, 2026', type: 'warning', amount: 'KES 25,000' },
  ];

  const COLORS = {
    primary: '#122f8a',
    secondary: '#fe9900',
    white: '#ffffff',
    bg: '#F3F4F6',
    text: '#1F2937',
    textLight: '#6B7280',
    border: '#E5E7EB',
    danger: '#EF4444',
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#122f8a" />

      {/* Scrollable Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Creative Header Section */}
        <View style={styles.headerContainer}>
          <LinearGradient
            colors={['#122f8a', '#0a1a5c']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            {/* Decorative Background Circles */}
            <View style={styles.circle1} />
            <View style={styles.circle2} />

            {/* Top Bar: Greeting & Notification */}
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

            {/* Creative Financial Dashboard Card */}
            <View style={styles.financialCard}>

              {/* Main Balance */}
              <View style={styles.mainBalanceSection}>
                <Text style={styles.balanceLabel}>REAL AVAILABLE CASH</Text>
                <Text style={styles.balanceAmount}>
                  KES {chequeSummary.realAvailable.toLocaleString('en-KE', { minimumFractionDigits: 0 })}
                </Text>
              </View>

              <View style={styles.divider} />

              {/* Three-Column Stats Grid */}
              <View style={styles.statsGrid}>
                {/* Money In */}
                <View style={styles.statItem}>
                  <View style={[styles.statIcon, { backgroundColor: '#dcfce7' }]}>
                    <Ionicons name="arrow-down" size={14} color="#15803d" />
                  </View>
                  <View>
                    <Text style={styles.statLabel}>Money In</Text>
                    <Text style={styles.statValue}>1.5M</Text>
                  </View>
                </View>

                <View style={styles.verticalDivider} />

                {/* Money Out */}
                <View style={styles.statItem}>
                  <View style={[styles.statIcon, { backgroundColor: '#fee2e2' }]}>
                    <Ionicons name="arrow-up" size={14} color="#ef4444" />
                  </View>
                  <View>
                    <Text style={styles.statLabel}>Money Out</Text>
                    <Text style={styles.statValue}>320k</Text>
                  </View>
                </View>

                <View style={styles.verticalDivider} />

                {/* Cash */}
                <View style={styles.statItem}>
                  <View style={[styles.statIcon, { backgroundColor: '#e0f2fe' }]}>
                    <Ionicons name="wallet" size={14} color="#0284c7" />
                  </View>
                  <View>
                    <Text style={styles.statLabel}>Bank Bal</Text>
                    <Text style={styles.statValue}>
                      {chequeSummary.bankBalance >= 1000
                        ? (chequeSummary.bankBalance / 1000).toFixed(1) + 'k'
                        : chequeSummary.bankBalance.toLocaleString()}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Quick Actions Grid */}
        <View style={styles.sectionContainer}>
          <View style={styles.actionsGrid}>

            {/* 1. Spend Money */}
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/add-expense')}>
              <View style={[styles.actionIcon, { backgroundColor: '#fff7ed' }]}>
                <Ionicons name="cash-outline" size={24} color="#ea580c" />
              </View>
              <Text style={styles.actionLabel}>Spend Money</Text>
            </TouchableOpacity>

            {/* 2. Enter Bill */}
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/bill-entry' as any)}>
              <View style={[styles.actionIcon, { backgroundColor: '#fff7ed' }]}>
                <Ionicons name="document-text" size={24} color="#d97706" />
              </View>
              <Text style={styles.actionLabel}>Enter Bill</Text>
            </TouchableOpacity>

            {/* 3. Debt Tracker */}
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/lending')}>
              <View style={[styles.actionIcon, { backgroundColor: '#F3E8FF' }]}>
                <Ionicons name="people-outline" size={24} color="#9333EA" />
              </View>
              <Text style={styles.actionLabel}>Debt Tracker</Text>
            </TouchableOpacity>

            {/* 4. Pay Bill */}
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/pay-supplier' as any)}>
              <View style={[styles.actionIcon, { backgroundColor: '#e0e7ff' }]}>
                <Ionicons name="card-outline" size={24} color="#4338ca" />
              </View>
              <Text style={styles.actionLabel}>Pay Bill</Text>
            </TouchableOpacity>

            {/* 5. Add Loan */}
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/add-loan')}>
              <View style={[styles.actionIcon, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="add-circle-outline" size={24} color="#EF4444" />
              </View>
              <Text style={styles.actionLabel}>Add Loan</Text>
            </TouchableOpacity>

            {/* 6. Repay Loan */}
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/repay-loan')}>
              <View style={[styles.actionIcon, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="return-down-back" size={24} color="#2563EB" />
              </View>
              <Text style={styles.actionLabel}>Repay Loan</Text>
            </TouchableOpacity>

            {/* 7. Suppliers */}
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/vendors' as any)}>
              <View style={[styles.actionIcon, { backgroundColor: '#f0fdf4' }]}>
                <Ionicons name="people-outline" size={24} color="#15803d" />
              </View>
              <Text style={styles.actionLabel}>Suppliers</Text>
            </TouchableOpacity>

            {/* 7. Income */}
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/add-income')}>
              <View style={[styles.actionIcon, { backgroundColor: '#dcfce7' }]}>
                <Ionicons name="cash" size={24} color="#15803d" />
              </View>
              <Text style={styles.actionLabel}>Income</Text>
            </TouchableOpacity>

            {/* 8. Transfer */}
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/transfer')}>
              <View style={[styles.actionIcon, { backgroundColor: '#cffafe' }]}>
                <Ionicons name="swap-horizontal" size={24} color="#0891b2" />
              </View>
              <Text style={styles.actionLabel}>Transfer</Text>
            </TouchableOpacity>

            {/* 9. Assets */}
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/fixed-assets' as any)}>
              <View style={[styles.actionIcon, { backgroundColor: '#f1f5f9' }]}>
                <Ionicons name="home-outline" size={24} color="#475569" />
              </View>
              <Text style={styles.actionLabel}>Assets</Text>
            </TouchableOpacity>

            {/* 10. Inventory */}
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/inventory' as any)}>
              <View style={[styles.actionIcon, { backgroundColor: '#fffbe6' }]}>
                <Ionicons name="cube-outline" size={24} color="#d4b106" />
              </View>
              <Text style={styles.actionLabel}>Inventory</Text>
            </TouchableOpacity>

            {/* 11. Invoices (NEW) */}
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/invoices' as any)}>
              <View style={[styles.actionIcon, { backgroundColor: '#e0f2fe' }]}>
                <Ionicons name="document-text-outline" size={24} color="#0284c7" />
              </View>
              <Text style={styles.actionLabel}>Invoices</Text>
            </TouchableOpacity>

            {/* 12. Stock Value (NEW) */}
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/inventory-valuation' as any)}>
              <View style={[styles.actionIcon, { backgroundColor: '#d1fae5' }]}>
                <Ionicons name="trending-up" size={24} color="#059669" />
              </View>
              <Text style={styles.actionLabel}>Stock Value</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Debt Crusher Widget (Demo) */}
        <View style={styles.sectionContainer}>
          <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2, borderWidth: 1, borderColor: '#FEE2E2', borderStyle: 'dashed' }}>
            <View style={[styles.sectionHeaderRow, { marginBottom: 10 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ backgroundColor: '#FEF2F2', padding: 8, borderRadius: 8 }}>
                  <Ionicons name="trending-down" size={20} color="#EF4444" />
                </View>
                <Text style={{ fontWeight: '700', fontSize: 16, color: '#EF4444' }}>DEBT CRUSHER</Text>
              </View>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#9CA3AF' }}>Top Priority</Text>
            </View>

            <Text style={{ fontSize: 18, fontWeight: '700', color: '#1F2937', marginBottom: 5 }}>KCB Car Loan</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={{ color: '#6B7280', fontSize: 12 }}>Initial: 1.2M</Text>
              <Text style={{ color: '#EF4444', fontSize: 13, fontWeight: '700' }}>Current: 980,000</Text>
            </View>

            {/* Progress Bar */}
            <View style={{ height: 8, backgroundColor: '#F3F4F6', borderRadius: 4, width: '100%', overflow: 'hidden', marginBottom: 15 }}>
              <View style={{ height: 8, backgroundColor: '#10B981', width: '18%', borderRadius: 4 }} />
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 5 }}>
              <Ionicons name="calendar-outline" size={14} color="#6B7280" />
              <Text style={{ fontSize: 12, color: '#6B7280' }}>Project Debt Free: <Text style={{ fontWeight: '700', color: '#1F2937' }}>Nov 2028</Text></Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Ionicons name="alert-circle-outline" size={14} color="#F59E0B" />
              <Text style={{ fontSize: 12, color: '#6B7280' }}>Interest Paid: <Text style={{ fontWeight: '700', color: '#F59E0B' }}>KES 150,000</Text></Text>
            </View>

            <TouchableOpacity style={{ marginTop: 15, padding: 12, backgroundColor: '#EFF6FF', borderRadius: 12, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#DBEAFE' }} onPress={() => router.push('/lending')}>
              <Text style={{ color: COLORS.primary, fontWeight: '700' }}>RECORD PAYMENT</Text>
            </TouchableOpacity>

          </View>
        </View>


        {/* Pending Cheques Widget */}
        {chequeSummary.count > 0 && (
          <View style={styles.sectionContainer}>
            <TouchableOpacity
              style={styles.pendingChequesWidget}
              onPress={() => router.push('/(tabs)/transactions')}
            >
              <View style={styles.pendingChequesLeft}>
                <View style={styles.pendingChequesIcon}>
                  <Ionicons name="time-outline" size={24} color="#d97706" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pendingChequesTitle}>Pending Cheques</Text>
                  <Text style={styles.pendingChequesSubtitle}>
                    {chequeSummary.count} {chequeSummary.count === 1 ? 'cheque' : 'cheques'} waiting to clear
                  </Text>
                </View>
              </View>
              <View style={styles.pendingChequesRight}>
                <Text style={styles.pendingChequesAmount}>
                  KES {chequeSummary.totalAmount.toLocaleString('en-KE', { minimumFractionDigits: 0 })}
                </Text>
                <View style={styles.pendingChequesBadge}>
                  <Text style={styles.pendingChequesBadgeText}>{chequeSummary.count}</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Recent Activity */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Recent</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>Show All</Text>
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
                        item.type === 'success' ? 'checkmark' :
                          item.type === 'warning' ? 'time' : 'information'
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
  headerContainer: {
    marginBottom: 20,
    overflow: 'hidden',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  header: {
    paddingTop: Platform.OS === 'android' ? 60 : 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    position: 'relative',
  },
  circle1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  circle2: {
    position: 'absolute',
    bottom: -50,
    left: -20,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    zIndex: 10,
  },
  greetingText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
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
  financialCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  mainBalanceSection: {
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  balanceLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    fontWeight: '600',
  },
  balanceAmount: {
    fontSize: 32,
    color: '#ffffff',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  statIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 2,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  verticalDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginHorizontal: 12,
  },
  sectionContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
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
    width: '31%', // 3 Columns
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 12,
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
  },
  activityList: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 8,
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  activityIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
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
    marginLeft: 74,
  },
  pendingChequesWidget: {
    backgroundColor: '#fff7ed',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: '#fed7aa',
    shadowColor: '#d97706',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  pendingChequesLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  pendingChequesIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 2,
    borderColor: '#fed7aa',
  },
  pendingChequesTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#92400e',
    marginBottom: 2,
  },
  pendingChequesSubtitle: {
    fontSize: 13,
    color: '#b45309',
  },
  pendingChequesBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#d97706',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingChequesBadgeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  pendingChequesRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  pendingChequesAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#92400e',
  },
});
