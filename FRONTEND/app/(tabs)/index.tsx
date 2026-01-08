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
import { LinearGradient } from 'expo-linear-gradient';
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
      const data = await apiService.getDashboardStats();
      setDashboardData(data);
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
        <LinearGradient
          colors={['#1e3a8a', '#2563eb']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.familyName}>Loading...</Text>
              <Text style={styles.headerTitle}>Family Dashboard</Text>
            </View>
            <TouchableOpacity
              style={styles.settingsButton}
              // @ts-ignore - Route exists but not in type definitions
              onPress={() => router.push('/family-settings')}
            >
              <Ionicons name="settings-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={{ marginTop: 16, color: '#64748b' }}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!dashboardData) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#1e3a8a', '#2563eb']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.familyName}>Error</Text>
              <Text style={styles.headerTitle}>Family Dashboard</Text>
            </View>
            <TouchableOpacity
              style={styles.settingsButton}
              // @ts-ignore - Route exists but not in type definitions
              onPress={() => router.push('/family-settings')}
            >
              <Ionicons name="settings-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="alert-circle" size={64} color="#ef4444" />
          <Text style={{ marginTop: 16, color: '#64748b', fontSize: 16 }}>Failed to load dashboard</Text>
          <TouchableOpacity
            onPress={loadDashboardData}
            style={{ marginTop: 16, backgroundColor: '#2563eb', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 }}
          >
            <Text style={{ color: '#fff', fontWeight: '600' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const formatCurrency = (amount: number) => {
    return `KES ${amount.toLocaleString()}`;
  };

  const calculateProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Blue Gradient Header */}
      <LinearGradient
        colors={['#1e3a8a', '#2563eb']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.familyName}>{dashboardData.familyName}</Text>
            <Text style={styles.headerTitle}>Family Dashboard</Text>
          </View>
          <TouchableOpacity
            style={styles.settingsButton}
            // @ts-ignore - Route exists but not in type definitions
            onPress={() => router.push('/family-settings')}
          >
            <Ionicons name="settings-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Welcome Message */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>
            Welcome back to Jibuks{userName ? `, ${userName}` : ''}! 👋
          </Text>
          <Text style={styles.familyNameText}>
            {dashboardData.familyName}
          </Text>
        </View>

        {/* Quick Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            {/* Total Members */}
            <View style={styles.statCard}>
              <View style={[styles.iconCircle, { backgroundColor: '#dbeafe' }]}>
                <Ionicons name="people" size={24} color="#2563eb" />
              </View>
              <Text style={styles.statValue}>{dashboardData.totalMembers}</Text>
              <Text style={styles.statLabel}>Total Members</Text>
            </View>

            {/* Active Goals */}
            <View style={styles.statCard}>
              <View style={[styles.iconCircle, { backgroundColor: '#fed7aa' }]}>
                <Ionicons name="trophy" size={24} color="#f59e0b" />
              </View>
              <Text style={styles.statValue}>{dashboardData.activeGoals}</Text>
              <Text style={styles.statLabel}>Active Goals</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            {/* Total Budget */}
            <View style={styles.statCard}>
              <View style={[styles.iconCircle, { backgroundColor: '#d1fae5' }]}>
                <Ionicons name="wallet" size={24} color="#10b981" />
              </View>
              <Text style={styles.statValue}>{formatCurrency(dashboardData.totalBudget)}</Text>
              <Text style={styles.statLabel}>Total Budget</Text>
            </View>

            {/* This Month's Spending */}
            <View style={styles.statCard}>
              <View style={[styles.iconCircle, { backgroundColor: '#fce7f3' }]}>
                <Ionicons name="trending-down" size={24} color="#ec4899" />
              </View>
              <Text style={styles.statValue}>{formatCurrency(dashboardData.monthlySpending)}</Text>
              <Text style={styles.statLabel}>Month Spending</Text>
            </View>
          </View>
        </View>

        {/* Recent Goals Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Goals</Text>
            <TouchableOpacity onPress={() => {
              try {
                (router.push as any)('/recent-goals');
              } catch (error) {
                console.error('Navigation error:', error);
              }
            }}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {dashboardData.recentGoals.map((goal: any) => {
            const progress = calculateProgress(goal.current, goal.target);
            return (
              <TouchableOpacity
                key={goal.id}
                style={styles.goalCard}
                onPress={() => {
                  try {
                    (router.push as any)('/recent-goals');
                  } catch (error) {
                    console.error('Navigation error:', error);
                  }
                }}
                activeOpacity={0.7}
              >
                <View style={styles.goalHeader}>
                  <Text style={styles.goalName}>{goal.name}</Text>
                  <Text style={styles.goalDeadline}>{goal.deadline}</Text>
                </View>
                <View style={styles.goalAmounts}>
                  <Text style={styles.goalAmount}>
                    {formatCurrency(goal.current)} / {formatCurrency(goal.target)}
                  </Text>
                  <Text style={styles.goalPercentage}>{progress.toFixed(0)}%</Text>
                </View>
                <View style={styles.progressBarContainer}>
                  <View style={[styles.progressBar, { width: `${progress}%` }]} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Budget Overview Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Budget Overview</Text>
            <TouchableOpacity onPress={() => {
              try {
                (router.push as any)('/monthly-budgets');
              } catch (error) {
                console.error('Navigation error:', error);
              }
            }}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {dashboardData.budgetOverview.map((budget: any, index: number) => {
            const progress = calculateProgress(budget.spent, budget.allocated);
            const isOverBudget = budget.spent > budget.allocated;
            const remaining = budget.allocated - budget.spent;

            return (
              <TouchableOpacity
                key={index}
                style={styles.budgetCard}
                onPress={() => {
                  try {
                    (router.push as any)('/monthly-budgets');
                  } catch (error) {
                    console.error('Navigation error:', error);
                  }
                }}
                activeOpacity={0.7}
              >
                <View style={styles.budgetHeader}>
                  <Text style={styles.budgetCategory}>{budget.category}</Text>
                  <Text style={[
                    styles.budgetRemaining,
                    { color: isOverBudget ? '#ef4444' : '#10b981' }
                  ]}>
                    {remaining >= 0 ? 'Remaining: ' : 'Over: '}{formatCurrency(Math.abs(remaining))}
                  </Text>
                </View>
                <View style={styles.budgetAmounts}>
                  <Text style={styles.budgetAmount}>
                    {formatCurrency(budget.spent)} / {formatCurrency(budget.allocated)}
                  </Text>
                  <Text style={styles.budgetPercentage}>{progress.toFixed(0)}%</Text>
                </View>
                <View style={styles.progressBarContainer}>
                  <View style={[
                    styles.progressBar,
                    {
                      width: `${Math.min(progress, 100)}%`,
                      backgroundColor: isOverBudget ? '#ef4444' : '#f59e0b'
                    }
                  ]} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Quick Action Buttons */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              try {
                (router.push as any)('/family-dreams');
              } catch (error) {
                console.error('Navigation error:', error);
              }
            }}
          >
            <Ionicons name="add-circle" size={24} color="#fff" />
            <Text style={styles.actionButtonText}>Add Goal</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              try {
                (router.push as any)('/family-settings');
              } catch (error) {
                console.error('Navigation error:', error);
              }
            }}
          >
            <Ionicons name="people" size={24} color="#fff" />
            <Text style={styles.actionButtonText}>View Members</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              try {
                (router.push as any)('/add-family-member');
              } catch (error) {
                console.error('Navigation error:', error);
              }
            }}
          >
            <Ionicons name="person-add" size={24} color="#fff" />
            <Text style={styles.actionButtonText}>Add Member</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Spacing for Tab Bar */}
        <View style={{ height: 20 }} />
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
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  familyName: {
    color: '#f59e0b',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  welcomeSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  welcomeText: {
    fontSize: 18,
    color: '#374151',
    fontWeight: '600',
  },
  familyNameText: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '700',
    marginTop: 4,
  },
  statsContainer: {
    paddingHorizontal: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    width: (width - 56) / 2,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  seeAllText: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '600',
  },
  goalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  goalDeadline: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 8,
  },
  goalAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalAmount: {
    fontSize: 14,
    color: '#4b5563',
  },
  goalPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 4,
  },
  budgetCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  budgetCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  budgetRemaining: {
    fontSize: 12,
    fontWeight: '600',
  },
  budgetAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  budgetAmount: {
    fontSize: 14,
    color: '#4b5563',
  },
  budgetPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f59e0b',
  },
  actionsSection: {
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
