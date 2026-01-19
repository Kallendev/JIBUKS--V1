import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import apiService from '@/services/api';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [userName, setUserName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const user = await apiService.getCurrentUser();
      if (user && user.name) {
        setUserName(user.name);
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await apiService.getDashboard();

      // Transform the data to match the component's expected format
      const transformedData = {
        familyName: data.familyMembers?.[0]?.name || 'Your Family',
        totalMembers: data.familyMembers?.length || 0,
        activeGoals: data.goals?.length || 0,
        monthlySpending: Number(data.summary?.totalExpenses) || 0,
        recentGoals: data.goals?.slice(0, 3).map((g: any) => ({
          id: g.id,
          name: g.name,
          current: Number(g.currentAmount),
          target: Number(g.targetAmount),
          deadline: g.targetDate ? new Date(g.targetDate).toLocaleDateString() : 'No deadline'
        })) || [],
        recentTransactions: data.recentTransactions?.slice(0, 4).map((t: any) => ({
          id: t.id,
          name: t.description || t.category,
          amount: Number(t.amount),
          time: new Date(t.date).toLocaleDateString(),
          category: t.category,
          type: t.type.toLowerCase()
        })) || [],
        summary: data.summary || { totalIncome: 0, totalExpenses: 0, balance: 0 }
      };

      setDashboardData(transformedData);
    } catch (error: any) {
      // If user has no family, redirect to family setup
      if (error.error === 'User is not part of any family' ||
        error.error === 'Not part of a family') {
        console.log('No family found - redirecting to family setup');
        try {
          (router.replace as any)('/family-setup');
        } catch (navError) {
          console.error('Navigation error:', navError);
        }
      } else {
        console.error('Error loading dashboard:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    await loadUserData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f59e0b" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!dashboardData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#ef4444" />
          <Text style={styles.errorText}>Failed to load dashboard</Text>
          <TouchableOpacity onPress={loadDashboardData} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const formatCurrency = (amount: number) => {
    return `KES ${amount.toLocaleString()}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>JIBUKS</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="notifications-outline" size={24} color="#ffffff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push('/family-settings' as any)}
          >
            <Ionicons name="settings-outline" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Financial Summary Cards */}
        <View style={styles.summarySection}>
          <View style={styles.summaryRow}>
            {/* Cash on Hand */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryCardHeader}>
                <Ionicons name="cash-outline" size={20} color="#fe9900" />
                <Text style={styles.summaryCardTitle}>Cash on hand</Text>
              </View>
              <Text style={styles.summaryCardAmount}>
                {formatCurrency(dashboardData.summary?.balance || 0)}
              </Text>
            </View>

            {/* Income MTD */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryCardHeader}>
                <Ionicons name="trending-up-outline" size={20} color="#10b981" />
                <Text style={styles.summaryCardTitle}>Income (MTD)</Text>
              </View>
              <Text style={styles.summaryCardAmount}>
                {formatCurrency(dashboardData.summary?.totalIncome || 0)}
              </Text>
            </View>
          </View>

          <View style={styles.summaryRow}>
            {/* Expenses MTD */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryCardHeader}>
                <Ionicons name="trending-down-outline" size={20} color="#ef4444" />
                <Text style={styles.summaryCardTitle}>Expenses (MTD)</Text>
              </View>
              <Text style={styles.summaryCardAmount}>
                {formatCurrency(dashboardData.summary?.totalExpenses || 0)}
              </Text>
            </View>

            {/* Net Balance */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryCardHeader}>
                <Ionicons name="wallet-outline" size={20} color="#122f8a" />
                <Text style={styles.summaryCardTitle}>Net Balance</Text>
              </View>
              <Text style={styles.summaryCardAmount}>
                {formatCurrency((dashboardData.summary?.totalIncome || 0) - (dashboardData.summary?.totalExpenses || 0))}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="flash" size={20} color="#fe9900" />
            <Text style={styles.sectionTitle}>Quick Actions</Text>
          </View>

          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => router.push('/purchases' as any)}
            >
              <Ionicons name="cart" size={18} color="#ffffff" />
              <Text style={styles.quickActionText}>Purchase</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionButton, styles.quickActionOrange]}
              onPress={() => router.push('/cheques' as any)}
            >
              <Ionicons name="card" size={18} color="#ffffff" />
              <Text style={styles.quickActionText}>Cheque</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => router.push('/banking' as any)}
            >
              <Ionicons name="arrow-down-circle" size={18} color="#ffffff" />
              <Text style={styles.quickActionText}>Deposit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionButton, styles.quickActionOrange]}
              onPress={() => router.push('/add-expense' as any)}
            >
              <Ionicons name="document-text" size={18} color="#ffffff" />
              <Text style={styles.quickActionText}>Bill</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => router.push('/vendors' as any)}
            >
              <Ionicons name="business" size={18} color="#ffffff" />
              <Text style={styles.quickActionText}>Supplier</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionButton, styles.quickActionOrange]}
              onPress={() => router.push('/purchases' as any)}
            >
              <Ionicons name="receipt" size={18} color="#ffffff" />
              <Text style={styles.quickActionText}>Receipt</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => router.push('/income' as any)}
            >
              <Ionicons name="trending-up" size={18} color="#ffffff" />
              <Text style={styles.quickActionText}>Income</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionButton, styles.quickActionOrange]}
              onPress={() => router.push('/expenses' as any)}
            >
              <Ionicons name="trending-down" size={18} color="#ffffff" />
              <Text style={styles.quickActionText}>Expense</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => router.push('/banking' as any)}
            >
              <Ionicons name="swap-horizontal" size={18} color="#ffffff" />
              <Text style={styles.quickActionText}>Transfer</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Upcoming Bills */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar-outline" size={20} color="#fe9900" />
            <Text style={styles.sectionTitle}>Upcoming Bills</Text>
          </View>

          <View style={styles.billsCard}>
            <View style={styles.billItem}>
              <View style={styles.billLeft}>
                <Text style={styles.billBullet}>•</Text>
                <Text style={styles.billText}>Rent - Jan 25</Text>
              </View>
              <TouchableOpacity style={styles.payButton}>
                <Text style={styles.payButtonText}>Pay Now</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.billItem}>
              <View style={styles.billLeft}>
                <Text style={styles.billBullet}>•</Text>
                <Text style={styles.billText}>Electricity - Jan 25</Text>
              </View>
              <Text style={styles.billStatus}>AutoPay</Text>
            </View>

            <View style={styles.billItem}>
              <View style={styles.billLeft}>
                <Text style={styles.billBullet}>•</Text>
                <Text style={styles.billText}>Water - Jan 18</Text>
              </View>
              <Text style={styles.billStatus}>Mark Paid</Text>
            </View>

            <View style={styles.billItem}>
              <View style={styles.billLeft}>
                <Text style={styles.billBullet}>•</Text>
                <Text style={styles.billText}>School Fees - Feb 5</Text>
              </View>
              <TouchableOpacity style={styles.payButton}>
                <Text style={styles.payButtonText}>Pay</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="time-outline" size={20} color="#fe9900" />
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
          </View>

          <View style={styles.transactionsCard}>
            {dashboardData.recentTransactions && dashboardData.recentTransactions.length > 0 ? (
              dashboardData.recentTransactions.map((transaction: any) => (
                <View key={transaction.id} style={styles.transactionItem}>
                  <View style={styles.transactionLeft}>
                    <Text style={styles.transactionBullet}>•</Text>
                    <View>
                      <Text style={styles.transactionName}>{transaction.name}</Text>
                      <Text style={styles.transactionCategory}>
                        {formatCurrency(transaction.amount)} ({transaction.category})
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No recent transactions</Text>
            )}
          </View>
        </View>

        {/* Suppliers Section */}
        <View style={styles.section}>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="business" size={18} color="#122f8a" />
              <Text style={styles.infoText}>
                <Text style={styles.infoLabel}>Suppliers:</Text> Water | Electricity | School | Supermarket
              </Text>
            </View>
          </View>
        </View>

        {/* Cheques Section */}
        <View style={styles.section}>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="wallet" size={18} color="#fe9900" />
              <Text style={styles.infoText}>
                <Text style={styles.infoLabel}>Cheques:</Text> Pending 2 | Cleared 5 | Deposited 1 | Returned 0
              </Text>
            </View>
          </View>
        </View>

        {/* Bottom Spacing for Tab Bar */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 16,
    color: '#6b7280',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  errorText: {
    marginTop: 16,
    color: '#6b7280',
    fontSize: 16,
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#f59e0b',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#122f8a',
    borderBottomWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  scrollView: {
    flex: 1,
  },
  summarySection: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 12,
    width: '48%',
    minWidth: 150,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryCardTitle: {
    fontSize: 11,
    color: '#6b7280',
    marginLeft: 6,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryCardAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#122f8a',
    marginLeft: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#122f8a',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
    shadowColor: '#122f8a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 95,
  },
  quickActionOrange: {
    backgroundColor: '#fe9900',
    shadowColor: '#fe9900',
  },
  quickActionText: {
    fontSize: 13,
    color: '#ffffff',
    fontWeight: '700',
  },
  billsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  billItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  billLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  billBullet: {
    fontSize: 20,
    color: '#1f2937',
    marginRight: 8,
  },
  billText: {
    fontSize: 14,
    color: '#1f2937',
  },
  payButton: {
    backgroundColor: '#fe9900',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
    shadowColor: '#fe9900',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  payButtonText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '700',
  },
  billStatus: {
    fontSize: 12,
    color: '#6b7280',
  },
  transactionsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  transactionItem: {
    paddingVertical: 8,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  transactionBullet: {
    fontSize: 20,
    color: '#1f2937',
    marginRight: 8,
  },
  transactionName: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
  },
  transactionCategory: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  emptyText: {
    textAlign: 'center',
    color: '#6b7280',
    padding: 20,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoText: {
    fontSize: 13,
    color: '#1f2937',
    flex: 1,
    lineHeight: 20,
  },
  infoLabel: {
    fontWeight: '700',
    color: '#122f8a',
  },
});
