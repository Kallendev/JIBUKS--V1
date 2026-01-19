import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function SuppliersScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const suppliers = [
    { id: 1, name: 'Water Board', category: 'Utilities', amount: 2500, status: 'active' },
    { id: 2, name: 'Electricity Company', category: 'Utilities', amount: 4800, status: 'active' },
    { id: 3, name: 'School (Primary)', category: 'Education', amount: 15000, status: 'active' },
    { id: 4, name: 'Supermarket - City Mall', category: 'Retail', amount: 8200, status: 'active' },
    { id: 5, name: 'Fuel Station - Shell', category: 'Fuel', amount: 6500, status: 'active' },
    { id: 6, name: 'Internet Provider', category: 'Utilities', amount: 3200, status: 'active' },
  ];

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalSuppliers = suppliers.length;
  const activeSuppliers = suppliers.filter(s => s.status === 'active').length;
  const totalSpent = suppliers.reduce((sum, s) => sum + s.amount, 0);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Ionicons name="search" size={24} color="#ffffff" />
          <Text style={styles.headerTitle}>Suppliers</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Summary Cards */}
        <View style={styles.summarySection}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryIconContainer}>
              <Ionicons name="business" size={28} color="#122f8a" />
            </View>
            <Text style={styles.summaryNumber}>{totalSuppliers}</Text>
            <Text style={styles.summaryLabel}>Total Suppliers</Text>
          </View>

          <View style={styles.summaryCard}>
            <View style={[styles.summaryIconContainer, { backgroundColor: '#fff5e6' }]}>
              <Ionicons name="checkmark-circle" size={28} color="#fe9900" />
            </View>
            <Text style={styles.summaryNumber}>{activeSuppliers}</Text>
            <Text style={styles.summaryLabel}>Active</Text>
          </View>
        </View>

        {/* Total Spent Card */}
        <View style={styles.section}>
          <View style={styles.totalSpentCard}>
            <View style={styles.totalSpentLeft}>
              <Text style={styles.totalSpentLabel}>Total Spent (MTD)</Text>
              <Text style={styles.totalSpentAmount}>KES {totalSpent.toLocaleString()}</Text>
            </View>
            <View style={styles.totalSpentIcon}>
              <Ionicons name="trending-up" size={32} color="#fe9900" />
            </View>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.section}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#6b7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search Suppliers"
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#9ca3af" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Add Supplier Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/vendors' as any)}
          >
            <Ionicons name="add-circle" size={22} color="#ffffff" />
            <Text style={styles.addButtonText}>Add New Supplier</Text>
          </TouchableOpacity>
        </View>

        {/* All Suppliers List */}
        <View style={styles.section}>
          <View style={styles.listHeader}>
            <Text style={styles.sectionTitle}>ALL SUPPLIERS</Text>
            <Text style={styles.countBadge}>{filteredSuppliers.length}</Text>
          </View>

          <View style={styles.suppliersList}>
            {filteredSuppliers.map((supplier, index) => (
              <TouchableOpacity
                key={supplier.id}
                style={[
                  styles.supplierCard,
                  index === filteredSuppliers.length - 1 && styles.supplierCardLast
                ]}
                onPress={() => router.push(`/vendor-profile?id=${supplier.id}&name=${supplier.name}` as any)}
              >
                <View style={styles.supplierLeft}>
                  <View style={styles.supplierIconContainer}>
                    <Ionicons name="business-outline" size={20} color="#122f8a" />
                  </View>
                  <View style={styles.supplierInfo}>
                    <Text style={styles.supplierName}>{supplier.name}</Text>
                    <Text style={styles.supplierCategory}>{supplier.category}</Text>
                  </View>
                </View>
                <View style={styles.supplierRight}>
                  <Text style={styles.supplierAmount}>KES {supplier.amount.toLocaleString()}</Text>
                  <View style={styles.profileButton}>
                    <Ionicons name="chevron-forward" size={18} color="#fe9900" />
                  </View>
                </View>
              </TouchableOpacity>
            ))}

            {filteredSuppliers.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={48} color="#9ca3af" />
                <Text style={styles.emptyText}>No suppliers found</Text>
                <Text style={styles.emptySubtext}>Try a different search term</Text>
              </View>
            )}
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
    borderRadius: 12,
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
  summaryIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  summaryNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#122f8a',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  totalSpentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  totalSpentLeft: {
    flex: 1,
  },
  totalSpentLabel: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '600',
    marginBottom: 8,
  },
  totalSpentAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#122f8a',
  },
  totalSpentIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff5e6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1f2937',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fe9900',
    borderRadius: 10,
    paddingVertical: 14,
    gap: 8,
    shadowColor: '#fe9900',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#122f8a',
    letterSpacing: 0.5,
  },
  countBadge: {
    backgroundColor: '#122f8a',
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  suppliersList: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  supplierCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  supplierCardLast: {
    borderBottomWidth: 0,
  },
  supplierLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  supplierIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  supplierInfo: {
    flex: 1,
  },
  supplierName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  supplierCategory: {
    fontSize: 12,
    color: '#6b7280',
  },
  supplierRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  supplierAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#122f8a',
  },
  profileButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff5e6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 4,
  },
});
