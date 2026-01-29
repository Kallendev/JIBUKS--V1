import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAccounts } from '@/contexts/AccountsContext';

type AccountType = 'ASSET' | 'LIABILITY' | 'INCOME' | 'EXPENSE' | 'EQUITY';

export default function AccountsScreen() {
  const router = useRouter();
  const { accounts, loading } = useAccounts();
  const [expandedSections, setExpandedSections] = useState<Set<AccountType>>(
    new Set(['ASSET', 'INCOME', 'EXPENSE'])
  );

  const toggleSection = (type: AccountType) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(type)) {
      newExpanded.delete(type);
    } else {
      newExpanded.add(type);
    }
    setExpandedSections(newExpanded);
  };

  const formatCurrency = (amount?: number) => {
    return `KES ${(amount || 0).toLocaleString()}`;
  };

  const getAccountIcon = (type: AccountType): any => {
    const iconMap: Record<AccountType, any> = {
      ASSET: 'wallet',
      LIABILITY: 'card',
      INCOME: 'trending-up',
      EXPENSE: 'trending-down',
      EQUITY: 'people',
    };
    return iconMap[type] || 'ellipse';
  };

  const getAccountColor = (type: AccountType): string => {
    const colorMap: Record<AccountType, string> = {
      ASSET: '#2563eb',
      LIABILITY: '#ef4444',
      INCOME: '#10b981',
      EXPENSE: '#f59e0b',
      EQUITY: '#8b5cf6',
    };
    return colorMap[type] || '#6b7280';
  };

  const getAccountBgColor = (type: AccountType): string => {
    const colorMap: Record<AccountType, string> = {
      ASSET: '#dbeafe',
      LIABILITY: '#fee2e2',
      INCOME: '#d1fae5',
      EXPENSE: '#fef3c7',
      EQUITY: '#ede9fe',
    };
    return colorMap[type] || '#f3f4f6';
  };

  const accountsByType = accounts.reduce((acc, account) => {
    if (!acc[account.type]) {
      acc[account.type] = [];
    }
    acc[account.type].push(account);
    return acc;
  }, {} as Record<AccountType, typeof accounts>);

  const accountTypeOrder: AccountType[] = ['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE'];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#2563eb', '#1e40af']} style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Chart of Accounts</Text>
            <View style={{ width: 40 }} />
          </View>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading accounts...</Text>
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
          <Text style={styles.headerTitle}>Chart of Accounts</Text>
          <View style={{ width: 40 }} />
        </View>
        <Text style={styles.headerSubtitle}>{accounts.length} Accounts • Real-time Balances</Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Account Type Sections */}
        {accountTypeOrder.map((type) => {
          const typeAccounts = accountsByType[type] || [];
          if (typeAccounts.length === 0) return null;

          const isExpanded = expandedSections.has(type);
          const color = getAccountColor(type);
          const bgColor = getAccountBgColor(type);
          const totalBalance = typeAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);

          return (
            <View key={type} style={styles.section}>
              {/* Section Header */}
              <TouchableOpacity
                style={[styles.sectionHeader, { backgroundColor: bgColor }]}
                onPress={() => toggleSection(type)}
              >
                <View style={styles.sectionLeft}>
                  <View style={[styles.sectionIcon, { backgroundColor: color + '30' }]}>
                    <Ionicons name={getAccountIcon(type)} size={24} color={color} />
                  </View>
                  <View>
                    <Text style={styles.sectionTitle}>{type}</Text>
                    <Text style={styles.sectionCount}>{typeAccounts.length} accounts</Text>
                  </View>
                </View>
                <View style={styles.sectionRight}>
                  <Text style={[styles.sectionBalance, { color }]}>
                    {formatCurrency(totalBalance)}
                  </Text>
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#6b7280"
                  />
                </View>
              </TouchableOpacity>

              {/* Accounts List */}
              {isExpanded && (
                <View style={styles.accountsList}>
                  {typeAccounts.map((account) => (
                    <View key={account.id} style={styles.accountCard}>
                      <View style={styles.accountLeft}>
                        <View style={[styles.accountIcon, { backgroundColor: bgColor }]}>
                          <Ionicons name={getAccountIcon(type)} size={20} color={color} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={styles.accountHeader}>
                            <Text style={styles.accountName}>{account.name}</Text>
                            {account.isSystem && (
                              <View style={styles.defaultBadge}>
                                <Text style={styles.defaultBadgeText}>System</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.accountCode}>Code: {account.code}</Text>
                        </View>
                      </View>
                      <Text style={[styles.accountBalance, { color }]}>
                        {formatCurrency(account.balance)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })}

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
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
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
  section: {
    marginTop: 16,
    marginHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
  },
  sectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  sectionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  sectionCount: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  sectionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionBalance: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  accountsList: {
    marginTop: 8,
    gap: 8,
  },
  accountCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  accountLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  accountIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  accountName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
  },
  accountCode: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  accountBalance: {
    fontSize: 16,
    fontWeight: '700',
  },
  defaultBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#2563eb',
  },
});
