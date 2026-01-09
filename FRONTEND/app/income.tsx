import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

// Mock data for income transactions
// TODO: Replace with real API calls when backend is ready
const mockIncomes = [
  {
    id: 1,
    category: 'Salary',
    amount: 25000,
    time: 'Just now',
    source: 'Mpesa',
    member: 'David',
    date: '2026-01-08',
    description: 'January Salary'
  },
  {
    id: 2,
    category: 'Business',
    amount: 580,
    time: '2 hours ago',
    source: 'Cash',
    member: 'Sarah',
    date: '2026-01-08',
    description: 'Sales'
  },
  {
    id: 3,
    category: 'Investment',
    amount: 1500,
    time: 'Yesterday',
    source: 'Bank',
    member: 'David',
    date: '2026-01-07',
    description: 'Dividend Payment'
  }
];

const timeFilters = ['Today', 'This Week', 'This Month', 'All Time'];
const categoryFilters = ['All', 'Salary', 'Business', 'Investment', 'Gift', 'Other'];
const memberFilters = ['All', 'David', 'Sarah', 'John'];

export default function IncomeScreen() {
  const router = useRouter();
  const [incomes, setIncomes] = useState(mockIncomes);
  const [selectedTime, setSelectedTime] = useState('Today');
  const [selectedMember, setSelectedMember] = useState('David');
  const [selectedCategory, setSelectedCategory] = useState('Salary');
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);

  const onRefresh = async () => {
    setRefreshing(true);
    // TODO: Fetch updated income data from API
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const formatCurrency = (amount: number) => {
    return `KES ${amount.toLocaleString()}`;
  };

  const groupIncomesByDate = () => {
    const grouped: { [key: string]: typeof mockIncomes } = {};
    incomes.forEach((income) => {
      const dateKey = income.date === '2026-01-08' ? 'Today' : income.date;
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(income);
    });
    return grouped;
  };

  const groupedIncomes = groupIncomesByDate();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#1e3a8a', '#2563eb']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#f59e0b" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Income</Text>

          <View style={styles.onlineStatus}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>Online</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Filter Section */}
        <View style={styles.filterSection}>
          <View style={styles.filterRow}>
            {/* Time Filter */}
            <View style={styles.filterButtonContainer}>
              <TouchableOpacity
                style={styles.filterButton}
                onPress={() => {
                  setShowTimeDropdown(!showTimeDropdown);
                  setShowMemberDropdown(false);
                  setShowCategoryDropdown(false);
                }}
              >
                <Text style={styles.filterButtonText}>TIME</Text>
                <Ionicons name="chevron-down" size={16} color="#f59e0b" />
              </TouchableOpacity>
              {showTimeDropdown && (
                <View style={styles.dropdown}>
                  {timeFilters.map((filter) => (
                    <TouchableOpacity
                      key={filter}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setSelectedTime(filter);
                        setShowTimeDropdown(false);
                      }}
                    >
                      <Text style={[
                        styles.dropdownItemText,
                        selectedTime === filter && styles.dropdownItemTextSelected
                      ]}>
                        {filter}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Member Filter */}
            <View style={styles.filterButtonContainer}>
              <TouchableOpacity
                style={styles.filterButton}
                onPress={() => {
                  setShowMemberDropdown(!showMemberDropdown);
                  setShowTimeDropdown(false);
                  setShowCategoryDropdown(false);
                }}
              >
                <Text style={styles.filterButtonText}>MEMBER</Text>
                <Ionicons name="chevron-down" size={16} color="#f59e0b" />
              </TouchableOpacity>
              {showMemberDropdown && (
                <View style={styles.dropdown}>
                  {memberFilters.map((filter) => (
                    <TouchableOpacity
                      key={filter}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setSelectedMember(filter);
                        setShowMemberDropdown(false);
                      }}
                    >
                      <Text style={[
                        styles.dropdownItemText,
                        selectedMember === filter && styles.dropdownItemTextSelected
                      ]}>
                        {filter}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Category Filter */}
            <View style={styles.filterButtonContainer}>
              <TouchableOpacity
                style={styles.filterButton}
                onPress={() => {
                  setShowCategoryDropdown(!showCategoryDropdown);
                  setShowTimeDropdown(false);
                  setShowMemberDropdown(false);
                }}
              >
                <Text style={styles.filterButtonText}>CATEGORY</Text>
                <Ionicons name="chevron-down" size={16} color="#f59e0b" />
              </TouchableOpacity>
              {showCategoryDropdown && (
                <View style={styles.dropdown}>
                  {categoryFilters.map((filter) => (
                    <TouchableOpacity
                      key={filter}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setSelectedCategory(filter);
                        setShowCategoryDropdown(false);
                      }}
                    >
                      <Text style={[
                        styles.dropdownItemText,
                        selectedCategory === filter && styles.dropdownItemTextSelected
                      ]}>
                        {filter}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Total Income Display */}
        <View style={styles.totalIncomeSection}>
          <Text style={styles.totalIncomeText}>
            Total Income: {formatCurrency(totalIncome)}
          </Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              try {
                (router.push as any)('/add-income');
              } catch (error) {
                console.error('Navigation error:', error);
              }
            }}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>

        {/* Income List */}
        <View style={styles.incomeListSection}>
          {Object.entries(groupedIncomes).map(([date, dateIncomes]) => (
            <View key={date}>
              <Text style={styles.dateSectionHeader}>{date}</Text>
              {dateIncomes.map((income) => (
                <View key={income.id} style={styles.incomeCard}>
                  <View style={styles.incomeCardContent}>
                    <View style={styles.incomeHeader}>
                      <Text style={styles.incomeCategory}>{income.category}</Text>
                      <Text style={styles.incomeAmount}>
                        {formatCurrency(income.amount)}
                      </Text>
                    </View>

                    <View style={styles.incomeDetails}>
                      <Text style={styles.incomeTime}>{income.time}</Text>
                      <Text style={styles.incomeDetailDivider}>|</Text>
                      <Text style={styles.incomeSource}>{income.source}</Text>
                      <Text style={styles.incomeDetailDivider}>|</Text>
                      <Text style={styles.incomeMember}>{income.member}</Text>
                    </View>

                    <Text style={styles.lastSynced}>Last synced: Just now</Text>
                  </View>
                </View>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f59e0b',
    flex: 1,
    textAlign: 'center',
  },
  onlineStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
    marginRight: 6,
  },
  onlineText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  filterSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterButtonContainer: {
    flex: 1,
    marginHorizontal: 4,
    position: 'relative',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#f59e0b',
    backgroundColor: '#fff',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
    marginRight: 4,
  },
  dropdown: {
    position: 'absolute',
    top: 44,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#4b5563',
  },
  dropdownItemTextSelected: {
    color: '#f59e0b',
    fontWeight: '600',
  },
  totalIncomeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  totalIncomeText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  incomeListSection: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  dateSectionHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 10,
    marginBottom: 12,
  },
  incomeCard: {
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
  incomeCardContent: {
    flex: 1,
  },
  incomeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  incomeCategory: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  incomeAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10b981',
  },
  incomeDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  incomeTime: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '500',
  },
  incomeDetailDivider: {
    fontSize: 12,
    color: '#9ca3af',
    marginHorizontal: 8,
  },
  incomeSource: {
    fontSize: 12,
    color: '#4b5563',
  },
  incomeMember: {
    fontSize: 12,
    color: '#4b5563',
  },
  lastSynced: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 4,
  },
});
