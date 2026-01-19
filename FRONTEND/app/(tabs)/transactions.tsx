import React, { useState } from 'react';
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

export default function ChequesScreen() {
  const router = useRouter();

  const menuItems = [
    {
      id: 1,
      title: 'Write Cheque',
      icon: 'create',
      route: '/cheques',
      description: 'Issue a new cheque',
      color: '#fe9900',
    },
    {
      id: 2,
      title: 'Track Pending',
      icon: 'time',
      route: '/cheques',
      description: 'View pending cheques',
      color: '#f59e0b',
    },
    {
      id: 3,
      title: 'Deposit Cheque',
      icon: 'arrow-down-circle',
      route: '/banking',
      description: 'Record cheque deposit',
      color: '#10b981',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Ionicons name="wallet" size={24} color="#ffffff" />
          <Text style={styles.headerTitle}>Cheques</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Summary Cards */}
        <View style={styles.summarySection}>
          <View style={styles.summaryCard}>
            <Ionicons name="time" size={28} color="#f59e0b" />
            <Text style={styles.summaryNumber}>2</Text>
            <Text style={styles.summaryLabel}>Pending</Text>
          </View>
          <View style={styles.summaryCard}>
            <Ionicons name="checkmark-circle" size={28} color="#10b981" />
            <Text style={styles.summaryNumber}>5</Text>
            <Text style={styles.summaryLabel}>Cleared</Text>
          </View>
          <View style={styles.summaryCard}>
            <Ionicons name="arrow-down-circle" size={28} color="#2563eb" />
            <Text style={styles.summaryNumber}>1</Text>
            <Text style={styles.summaryLabel}>Deposited</Text>
          </View>
        </View>

        {/* Status Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CHEQUE STATUS</Text>
          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <View style={styles.statusDot} style={{ backgroundColor: '#f59e0b' }} />
              <Text style={styles.statusLabel}>Pending</Text>
              <Text style={styles.statusValue}>2 cheques</Text>
            </View>
            <View style={styles.statusRow}>
              <View style={styles.statusDot} style={{ backgroundColor: '#10b981' }} />
              <Text style={styles.statusLabel}>Cleared</Text>
              <Text style={styles.statusValue}>5 cheques</Text>
            </View>
            <View style={styles.statusRow}>
              <View style={styles.statusDot} style={{ backgroundColor: '#2563eb' }} />
              <Text style={styles.statusLabel}>Deposited</Text>
              <Text style={styles.statusValue}>1 cheque</Text>
            </View>
            <View style={styles.statusRow}>
              <View style={styles.statusDot} style={{ backgroundColor: '#ef4444' }} />
              <Text style={styles.statusLabel}>Returned</Text>
              <Text style={styles.statusValue}>0 cheques</Text>
            </View>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CHEQUE MANAGEMENT</Text>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={() => router.push(item.route as any)}
            >
              <View style={[styles.menuIconContainer, { backgroundColor: `${item.color}15` }]}>
                <Ionicons name={item.icon as any} size={24} color={item.color} />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuDescription}>{item.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Cheques */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>RECENT CHEQUES</Text>
          <View style={styles.chequeCard}>
            <View style={styles.chequeItem}>
              <View style={styles.chequeLeft}>
                <Text style={styles.chequeName}>Rent Payment</Text>
                <Text style={styles.chequeDate}>Jan 15, 2026</Text>
              </View>
              <View style={styles.chequeRight}>
                <Text style={styles.chequeAmount}>KES 25,000</Text>
                <View style={[styles.statusBadge, { backgroundColor: '#fef3c7' }]}>
                  <Text style={[styles.statusBadgeText, { color: '#f59e0b' }]}>Pending</Text>
                </View>
              </View>
            </View>
            <View style={styles.chequeItem}>
              <View style={styles.chequeLeft}>
                <Text style={styles.chequeName}>Supplier Payment</Text>
                <Text style={styles.chequeDate}>Jan 10, 2026</Text>
              </View>
              <View style={styles.chequeRight}>
                <Text style={styles.chequeAmount}>KES 15,500</Text>
                <View style={[styles.statusBadge, { backgroundColor: '#d1fae5' }]}>
                  <Text style={[styles.statusBadgeText, { color: '#10b981' }]}>Cleared</Text>
                </View>
              </View>
            </View>
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
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 12,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 6,
  },
  summaryLabel: {
    fontSize: 11,
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
  statusCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  statusLabel: {
    flex: 1,
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
  },
  statusValue: {
    fontSize: 13,
    color: '#6b7280',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  menuIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  menuDescription: {
    fontSize: 13,
    color: '#6b7280',
  },
  chequeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  chequeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  chequeLeft: {
    flex: 1,
  },
  chequeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  chequeDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  chequeRight: {
    alignItems: 'flex-end',
  },
  chequeAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#122f8a',
    marginBottom: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
