import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import apiService from '@/services/api';

export default function ManageScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [categoriesData, paymentMethodsData, statsData] = await Promise.all([
        apiService.getCategories(),
        apiService.getPaymentMethods(),
        apiService.getTransactionStats(),
      ]);
      setCategories(categoriesData);
      setPaymentMethods(paymentMethodsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return `KES ${Math.abs(amount).toLocaleString()}`;
  };

  const getCategoryIcon = (category: string): any => {
    const iconMap: { [key: string]: any } = {
      'Food': 'restaurant',
      'Transport': 'car',
      'Housing': 'home',
      'Utilities': 'flash',
      'Entertainment': 'film',
      'Healthcare': 'medical',
      'Education': 'school',
      'Shopping': 'bag',
      'Salary': 'cash',
      'Business': 'briefcase',
      'Investment': 'trending-up',
      'Gift': 'gift',
    };
    return iconMap[category] || 'ellipse';
  };

  const expenseCategories = categories.filter(c => c.type === 'expense');
  const incomeCategories = categories.filter(c => c.type === 'income');

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#2563eb', '#1e40af']} style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Manage</Text>
            <View style={{ width: 40 }} />
          </View>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#2563eb', '#1e40af']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Manage</Text>
          <View style={{ width: 40 }} />
        </View>
        <Text style={styles.headerSubtitle}>Categories, Payment Methods & More</Text>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Quick Stats */}
        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="pricetag" size={24} color="#2563eb" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>{categories.length}</Text>
              <Text style={styles.statLabel}>Categories</Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="card" size={24} color="#10b981" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>{paymentMethods.length}</Text>
              <Text style={styles.statLabel}>Payment Methods</Text>
            </View>
          </View>
        </View>

        {/* Expense Categories */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Expense Categories</Text>
            <Text style={styles.sectionCount}>{expenseCategories.length}</Text>
          </View>
          <View style={styles.categoriesGrid}>
            {expenseCategories.map((category) => (
              <View key={category.id} style={styles.categoryCard}>
                <View style={[styles.categoryIconContainer, { backgroundColor: category.color + '20' || '#ef444420' }]}>
                  <Ionicons
                    name={getCategoryIcon(category.name)}
                    size={24}
                    color={category.color || '#ef4444'}
                  />
                </View>
                <Text style={styles.categoryName}>{category.name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Income Categories */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Income Categories</Text>
            <Text style={styles.sectionCount}>{incomeCategories.length}</Text>
          </View>
          <View style={styles.categoriesGrid}>
            {incomeCategories.map((category) => (
              <View key={category.id} style={styles.categoryCard}>
                <View style={[styles.categoryIconContainer, { backgroundColor: category.color + '20' || '#10b98120' }]}>
                  <Ionicons
                    name={getCategoryIcon(category.name)}
                    size={24}
                    color={category.color || '#10b981'}
                  />
                </View>
                <Text style={styles.categoryName}>{category.name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Payment Methods */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Payment Methods</Text>
            <Text style={styles.sectionCount}>{paymentMethods.length}</Text>
          </View>
          {paymentMethods.map((method) => (
            <View key={method.id} style={styles.paymentCard}>
              <View style={styles.paymentLeft}>
                <View style={styles.paymentIconContainer}>
                  <Ionicons name="card" size={24} color="#2563eb" />
                </View>
                <View>
                  <Text style={styles.paymentName}>{method.name}</Text>
                  <Text style={styles.paymentType}>{method.type}</Text>
                </View>
              </View>
              <View style={[styles.statusBadge, method.isActive && styles.statusBadgeActive]}>
                <Text style={[styles.statusText, method.isActive && styles.statusTextActive]}>
                  {method.isActive ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/accounts' as any)}
          >
            <View style={styles.actionLeft}>
              <View style={[styles.actionIcon, { backgroundColor: '#dbeafe' }]}>
                <Ionicons name="list" size={24} color="#2563eb" />
              </View>
              <View>
                <Text style={styles.actionTitle}>Chart of Accounts</Text>
                <Text style={styles.actionSubtitle}>View all financial accounts</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/family-settings' as any)}
          >
            <View style={styles.actionLeft}>
              <View style={[styles.actionIcon, { backgroundColor: '#dbeafe' }]}>
                <Ionicons name="people" size={24} color="#2563eb" />
              </View>
              <View>
                <Text style={styles.actionTitle}>Family Settings</Text>
                <Text style={styles.actionSubtitle}>Manage family members & permissions</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/monthly-budgets' as any)}
          >
            <View style={styles.actionLeft}>
              <View style={[styles.actionIcon, { backgroundColor: '#fef3c7' }]}>
                <Ionicons name="wallet" size={24} color="#f59e0b" />
              </View>
              <View>
                <Text style={styles.actionTitle}>Budgets</Text>
                <Text style={styles.actionSubtitle}>Set & manage monthly budgets</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/family-dreams' as any)}
          >
            <View style={styles.actionLeft}>
              <View style={[styles.actionIcon, { backgroundColor: '#ddd6fe' }]}>
                <Ionicons name="trophy" size={24} color="#7c3aed" />
              </View>
              <View>
                <Text style={styles.actionTitle}>Goals</Text>
                <Text style={styles.actionSubtitle}>Track family financial goals</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#f59e0b',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  content: {
    flex: 1,
  },
  statsSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  sectionCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    width: '22%',
    aspectRatio: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
  },
  paymentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paymentIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  paymentType: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#fee2e2',
  },
  statusBadgeActive: {
    backgroundColor: '#d1fae5',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ef4444',
  },
  statusTextActive: {
    color: '#10b981',
  },
  actionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  actionSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
});
