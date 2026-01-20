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

export default function ChequesScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  // Mock Data
  const cheques = [
    { id: 204, payee: 'City School', amount: 15000, date: 'Jan 15, 2026', status: 'pending', bank: 'Equity Bank' },
    { id: 203, payee: 'Naivas Supermarket', amount: 8200, date: 'Jan 12, 2026', status: 'cleared', bank: 'KCB Bank' },
    { id: 202, payee: 'Landlord - Jan Rent', amount: 25000, date: 'Jan 05, 2026', status: 'cleared', bank: 'Co-op Bank' },
    { id: 201, payee: 'Supplier - Electronics', amount: 45000, date: 'Dec 28, 2025', status: 'bounced', bank: 'Equity Bank' },
    { id: 200, payee: 'Water Bill', amount: 2500, date: 'Dec 20, 2025', status: 'cleared', bank: 'M-Pesa' },
  ];

  const filteredCheques = cheques.filter(cheque =>
    cheque.payee.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cheque.id.toString().includes(searchQuery)
  );

  const totalWritten = cheques.length;
  const pendingCount = cheques.filter(c => c.status === 'pending').length;
  const bouncedCount = cheques.filter(c => c.status === 'bounced').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'cleared': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'bounced': return '#ef4444';
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
            <Text style={styles.headerTitle}>Cheques</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Stats Overview */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Total Written</Text>
              <Text style={styles.statValue}>{totalWritten}</Text>
            </View>
            <View style={styles.verticalDivider} />
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Pending</Text>
              <Text style={[styles.statValue, { color: '#fcd34d' }]}>{pendingCount}</Text>
            </View>
            <View style={styles.verticalDivider} />
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Bounced</Text>
              <Text style={[styles.statValue, { color: '#fca5a5' }]}>{bouncedCount}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Floating Search Bar */}
        <View style={styles.searchContainerWrapper}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#94a3b8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by Cheque # or Payee..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              keyboardType="default"
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

        {/* Quick Actions */}
        <View style={styles.quickActionRow}>
          <TouchableOpacity style={styles.quickActionBtn} onPress={() => router.push('/write-cheque')}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#f3e8ff' }]}>
              <Ionicons name="create" size={20} color="#7c3aed" />
            </View>
            <Text style={styles.quickActionLabel}>Write</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickActionBtn} onPress={() => router.push('/deposit-cheque')}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#ecfdf5' }]}>
              <Ionicons name="arrow-down-circle" size={20} color="#059669" />
            </View>
            <Text style={styles.quickActionLabel}>Deposit</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickActionBtn} onPress={() => router.push('/pending-cheques')}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#fff7ed' }]}>
              <Ionicons name="time" size={20} color="#ea580c" />
            </View>
            <Text style={styles.quickActionLabel}>Pending</Text>
          </TouchableOpacity>
        </View>

        {/* Cheques List */}
        <View style={styles.listContainer}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>

          {filteredCheques.map((cheque) => (
            <TouchableOpacity
              key={cheque.id}
              style={styles.chequeCard}
              onPress={() => router.push('/cheque-details')}
            >
              {/* Top Row: Icon + Payee + Amount */}
              <View style={styles.cardTopRow}>
                <View style={[styles.iconContainer, { backgroundColor: '#f1f5f9' }]}>
                  <Ionicons name="wallet-outline" size={24} color="#334155" />
                </View>
                <View style={styles.cardMainInfo}>
                  <Text style={styles.payeeName}>{cheque.payee}</Text>
                  <Text style={styles.chequeNumber}>#{cheque.id} • {cheque.bank}</Text>
                </View>
                <Text style={styles.amountText}>{formatCurrency(cheque.amount)}</Text>
              </View>

              {/* Divider */}
              <View style={styles.cardDivider} />

              {/* Bottom Row: Status + Date + Action */}
              <View style={styles.cardBottomRow}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(cheque.status) + '20' }]}>
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor(cheque.status) }]} />
                  <Text style={[styles.statusText, { color: getStatusColor(cheque.status) }]}>
                    {cheque.status.charAt(0).toUpperCase() + cheque.status.slice(1)}
                  </Text>
                </View>

                <View style={styles.dateContainer}>
                  <Ionicons name="calendar-outline" size={14} color="#94a3b8" />
                  <Text style={styles.dateText}>{cheque.date}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}

          {filteredCheques.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyText}>No cheques found</Text>
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
    paddingBottom: 50,
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
    marginTop: -25,
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
  quickActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 10,
    gap: 12,
  },
  quickActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
  },
  quickActionIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 16,
  },
  chequeCard: {
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
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardMainInfo: {
    flex: 1,
  },
  payeeName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 2,
  },
  chequeNumber: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#122f8a',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 12,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#64748b',
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
