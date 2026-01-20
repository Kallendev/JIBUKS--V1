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
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function SuppliersScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  // Mock Data
  const suppliers = [
    { id: 1, name: 'Water Board', category: 'Utilities', amount: 2500, status: 'active', contact: '0712345678' },
    { id: 2, name: 'Electricity Co.', category: 'Utilities', amount: 4800, status: 'active', contact: '0722345678' },
    { id: 3, name: 'City School', category: 'Education', amount: 15000, status: 'pending', contact: '0733345678' },
    { id: 4, name: 'Naivas Supermarket', category: 'Retail', amount: 8200, status: 'active', contact: '0744345678' },
    { id: 5, name: 'Shell Station', category: 'Fuel', amount: 6500, status: 'active', contact: '0755345678' },
    { id: 6, name: 'Safaricom Fiber', category: 'Utilities', amount: 3200, status: 'inactive', contact: '0766345678' },
  ];

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalSuppliers = suppliers.length;
  const activeSuppliers = suppliers.filter(s => s.status === 'active').length;
  const totalOutstanding = suppliers.filter(s => s.status === 'pending').reduce((sum, s) => sum + s.amount, 0);

  const getInitials = (name: string) => {
    return name.substring(0, 2).toUpperCase();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'inactive': return '#9ca3af';
      default: return '#6b7280';
    }
  };

  const formatCurrency = (amount: number) => {
    return `KES ${amount.toLocaleString()}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#122f8a" />

      {/* Creative Header */}
      <View style={styles.headerContainer}>
        <LinearGradient
          colors={['#122f8a', '#0a1a5c']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          {/* Header Content */}
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Suppliers</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push('/add-supplier' as any)}
            >
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Stats Overview */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Total Suppliers</Text>
              <Text style={styles.statValue}>{totalSuppliers}</Text>
            </View>
            <View style={styles.verticalDivider} />
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Active</Text>
              <Text style={styles.statValue}>{activeSuppliers}</Text>
            </View>
            <View style={styles.verticalDivider} />
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Pending Pay</Text>
              <Text style={styles.statValue}>{formatCurrency(totalOutstanding)}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Floating Search Bar */}
        <View style={styles.searchContainerWrapper}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#94a3b8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search supplier name, category..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#94a3b8" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

        {/* Suppliers List */}
        <View style={styles.listContainer}>
          <Text style={styles.sectionTitle}>All Suppliers</Text>

          {filteredSuppliers.map((supplier) => (
            <TouchableOpacity
              key={supplier.id}
              style={styles.supplierCard}
              onPress={() => router.push(`/vendor-profile?id=${supplier.id}&name=${supplier.name}` as any)}
            >
              {/* Left: Avatar */}
              <View style={[styles.avatarContainer, { backgroundColor: '#e0e7ff' }]}>
                <Text style={styles.avatarText}>{getInitials(supplier.name)}</Text>
              </View>

              {/* Middle: Info */}
              <View style={styles.cardInfo}>
                <Text style={styles.cardName}>{supplier.name}</Text>
                <View style={styles.cardMetaRow}>
                  <Text style={styles.cardCategory}>{supplier.category}</Text>
                  <View style={styles.dotSeparator} />
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(supplier.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(supplier.status) }]}>
                      {supplier.status.charAt(0).toUpperCase() + supplier.status.slice(1)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Right: Balance & Action */}
              <View style={styles.cardRight}>
                <Text style={styles.cardAmount}>{formatCurrency(supplier.amount)}</Text>
                <TouchableOpacity style={styles.callButton}>
                  <Ionicons name="call-outline" size={18} color="#122f8a" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}

          {filteredSuppliers.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyText}>No suppliers found</Text>
              <Text style={styles.emptySubtext}>Try a different search term</Text>
            </View>
          )}
        </View>

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
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  header: {
    paddingTop: Platform.OS === 'android' ? 50 : 50,
    paddingBottom: 50, // More space for search bar
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fe9900',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  verticalDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  searchContainerWrapper: {
    marginHorizontal: 20,
    marginTop: -25, // Overlap the header
    zIndex: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1e293b',
    marginLeft: 10,
  },
  content: {
    flex: 1,
    marginTop: 10,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 16,
    marginTop: 10,
  },
  supplierCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#122f8a',
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardCategory: {
    fontSize: 13,
    color: '#64748b',
  },
  dotSeparator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#cbd5e1',
    marginHorizontal: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  cardAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
  },
  callButton: {
    padding: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 4,
  },
});
