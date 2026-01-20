import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function RecordsScreen() {
  const router = useRouter();

  const reportCategories = [
    {
      title: 'Financial Statements',
      items: [
        { id: 1, name: 'Income Statement', icon: 'trending-up', route: '/reports/profit-loss', color: '#10b981', bgColor: '#d1fae5' },
        { id: 2, name: 'Balance Sheet', icon: 'scale', route: '/reports/balance-sheet', color: '#2563eb', bgColor: '#dbeafe' },
        { id: 3, name: 'Cash Flow', icon: 'water', route: '/reports/cash-flow', color: '#06b6d4', bgColor: '#cffafe' },
      ],
    },
    {
      title: 'Transactions & Lists',
      items: [
        { id: 4, name: 'Income', icon: 'cash', route: '/income', color: '#10b981', bgColor: '#d1fae5' },
        { id: 5, name: 'Expenses', icon: 'receipt-outline', route: '/expenses', color: '#ef4444', bgColor: '#fee2e2' },
        { id: 6, name: 'Purchases', icon: 'cart', route: '/purchases', color: '#8b5cf6', bgColor: '#ede9fe' },
        { id: 7, name: 'Bills', icon: 'document-text', route: '/purchases', color: '#f59e0b', bgColor: '#fef3c7' }, // Linking to purchases for now
        { id: 8, name: 'Cheques', icon: 'wallet', route: '/(tabs)/transactions', color: '#0ea5e9', bgColor: '#e0f2fe' },
        { id: 9, name: 'Assets', icon: 'cube', route: '/household-assets', color: '#6366f1', bgColor: '#e0e7ff' },
        { id: 10, name: 'Receipts', icon: 'camera', route: '/expenses', color: '#ec4899', bgColor: '#fce7f3' }, // Linking to expenses for receipts
      ],
    },
    {
      title: 'Accounting',
      items: [
        { id: 11, name: 'Chart of Accounts', icon: 'list', route: '/accounts', color: '#475569', bgColor: '#f1f5f9' },
        { id: 12, name: 'Reconciliation', icon: 'swap-horizontal', route: '/banking', color: '#059669', bgColor: '#ecfdf5' },
        { id: 13, name: 'Account Ledger', icon: 'book', route: '/accounts', color: '#9333ea', bgColor: '#f3e8ff' },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#122f8a" />

      {/* Premium Header */}
      <View style={styles.headerContainer}>
        <LinearGradient
          colors={['#122f8a', '#0a1a5c']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <Ionicons name="folder-open" size={28} color="#ffffff" />
            <Text style={styles.headerTitle}>All Records</Text>
          </View>
          <Text style={styles.headerSubtitle}>Access your financial history and reports</Text>
        </LinearGradient>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

        {/* Report Categories */}
        {reportCategories.map((category, index) => (
          <View key={index} style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>{category.title}</Text>
              <View style={styles.sectionLine} />
            </View>

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
                  <View style={[styles.reportIconContainer, { backgroundColor: item.bgColor }]}>
                    <Ionicons name={item.icon as any} size={20} color={item.color} />
                  </View>
                  <Text style={styles.reportName}>{item.name}</Text>
                  <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Bottom Spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  headerContainer: {
    marginBottom: 20,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  header: {
    paddingTop: Platform.OS === 'android' ? 60 : 60,
    paddingBottom: 30,
    paddingHorizontal: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 40, // Align with title text
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  categoryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 6,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  reportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  reportItemLast: {
    borderBottomWidth: 0,
  },
  reportIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  reportName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
});
