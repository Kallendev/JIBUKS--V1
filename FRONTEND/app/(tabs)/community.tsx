import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function RecordsScreen() {
  const router = useRouter();

  const reportCategories = [
    {
      title: 'FINANCIAL STATEMENTS',
      items: [
        { id: 0, name: 'Chart of Accounts', icon: 'list', route: '/accounts', color: '#4b5563' },
        { id: 1, name: 'Income Statement', icon: 'trending-up', route: '/reports/profit-loss', color: '#10b981' },
        { id: 2, name: 'Balance Sheet', icon: 'analytics', route: '/reports', color: '#2563eb' },
        { id: 3, name: 'Cash Flow', icon: 'water', route: '/reports', color: '#06b6d4' },
      ],
    },
    {
      title: 'OPERATIONAL REPORTS',
      items: [
        { id: 4, name: 'Supplier Reports', icon: 'business', route: '/reports', color: '#122f8a' },
        { id: 5, name: 'Cheque Reports', icon: 'wallet', route: '/reports', color: '#fe9900' },
        { id: 6, name: 'Purchases', icon: 'cart', route: '/purchases', color: '#8b5cf6' },
      ],
    },
    {
      title: 'TRANSACTION RECORDS',
      items: [
        { id: 7, name: 'Expenses', icon: 'arrow-up-circle', route: '/expenses', color: '#ef4444' },
        { id: 8, name: 'Income', icon: 'arrow-down-circle', route: '/income', color: '#10b981' },
        { id: 9, name: 'Bills', icon: 'document-text', route: '/add-expense', color: '#f59e0b' },
        { id: 10, name: 'Receipts', icon: 'receipt', route: '/purchases', color: '#6366f1' },
      ],
    },
    {
      title: 'TRANSACTION HISTORY',
      items: [
        { id: 11, name: 'Full Transaction History', icon: 'time', route: '/(tabs)/transactions', color: '#64748b' },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Ionicons name="folder" size={24} color="#ffffff" />
          <Text style={styles.headerTitle}>Records</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Summary Cards */}
        <View style={styles.summarySection}>
          <View style={styles.summaryCard}>
            <Ionicons name="document-text" size={28} color="#122f8a" />
            <Text style={styles.summaryNumber}>156</Text>
            <Text style={styles.summaryLabel}>Total Records</Text>
          </View>
          <View style={styles.summaryCard}>
            <Ionicons name="calendar" size={28} color="#fe9900" />
            <Text style={styles.summaryNumber}>24</Text>
            <Text style={styles.summaryLabel}>This Month</Text>
          </View>
        </View>

        {/* Report Categories */}
        {reportCategories.map((category, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.sectionTitle}>{category.title}</Text>
            <View style={styles.categoryCard}>
              {category.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.reportItem,
                    itemIndex === category.items.length - 1 && styles.reportItemLast,
                  ]}
                  onPress={() => router.push(item.route as any)}
                >
                  <View style={[styles.reportIconContainer, { backgroundColor: `${item.color}15` }]}>
                    <Ionicons name={item.icon as any} size={22} color={item.color} />
                  </View>
                  <Text style={styles.reportName}>{item.name}</Text>
                  <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => router.push('/reports' as any)}
            >
              <Ionicons name="download" size={20} color="#122f8a" />
              <Text style={styles.quickActionText}>Export</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => router.push('/reports' as any)}
            >
              <Ionicons name="print" size={20} color="#122f8a" />
              <Text style={styles.quickActionText}>Print</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => router.push('/reports' as any)}
            >
              <Ionicons name="share" size={20} color="#122f8a" />
              <Text style={styles.quickActionText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom Spacing */}
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
  header: {
    backgroundColor: '#122f8a',
    paddingHorizontal: 16,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
  },
  summarySection: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#122f8a',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  categoryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  reportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  reportItemLast: {
    borderBottomWidth: 0,
  },
  reportIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  reportName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#1f2937',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#122f8a',
    shadowColor: '#122f8a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  quickActionText: {
    fontSize: 12,
    color: '#122f8a',
    fontWeight: '700',
    marginTop: 6,
  },
});
