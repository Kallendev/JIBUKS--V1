import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import apiService from '@/services/api';

const categoryOptions = [
  { label: 'Food & Groceries', value: 'Food' },
  { label: 'Rent & Utilities', value: 'Housing' },
  { label: 'Transport & Fuel', value: 'Transport' },
  { label: 'School & Education', value: 'Education' },
  { label: 'Medical & Healthcare', value: 'Healthcare' },
  { label: 'Entertainment', value: 'Entertainment' },
  { label: 'Shopping', value: 'Shopping' },
  { label: 'Savings', value: 'Savings' },
  { label: 'Other', value: 'Other' },
];

export default function MonthlyBudgetsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<any>(null);

  // Form states
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadBudgets();
  }, []);

  const loadBudgets = async () => {
    try {
      setLoading(true);
      const data = await apiService.getBudgets();
      setBudgets(data);
    } catch (error) {
      console.error('Error loading budgets:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBudgets();
    setRefreshing(false);
  };

  const formatCurrency = (value?: number) => {
    const amount = Number(value) || 0;
    return `KES ${amount.toLocaleString()}`;
  };

  const handleCreateBudget = async () => {
    if (!category || !amount) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setSubmitting(true);
      await apiService.createBudget({
        category,
        amount: parseFloat(amount),
        period: 'monthly'
      });
      setShowAddModal(false);
      setCategory('');
      setAmount('');
      loadBudgets();
      Alert.alert('Success', 'Budget created successfully');
    } catch (error: any) {
      Alert.alert('Error', error.error || 'Failed to create budget');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddExpense = async () => {
    if (!expenseAmount || parseFloat(expenseAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    try {
      setSubmitting(true);
      await apiService.createTransaction({
        type: 'EXPENSE',
        amount: parseFloat(expenseAmount),
        category: selectedBudget.category,
        description: description || `Spending for ${selectedBudget.category}`,
        paymentMethod: 'Cash', // Default, could be selectable
        date: new Date().toISOString(),
      });

      setShowExpenseModal(false);
      setExpenseAmount('');
      setDescription('');
      setSelectedBudget(null);
      loadBudgets();
      Alert.alert('Success', 'Expense recorded successfully');
    } catch (error: any) {
      Alert.alert('Error', error.error || 'Failed to record expense');
    } finally {
      setSubmitting(false);
    }
  };

  const openExpenseModal = (budget: any) => {
    setSelectedBudget(budget);
    setShowExpenseModal(true);
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Monthly Budgets</Text>
            <View style={{ width: 40 }} />
          </View>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f59e0b" />
          <Text style={styles.loadingText}>Loading budgets...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const normalizedBudgets = budgets.map((b) => {
    const amount = Number(b.amount) || 0;
    const spent = Number(b.spent) || 0;
    const remaining = amount - spent;
    const progress = amount > 0 ? Math.round((spent / amount) * 100) : 0;
    const status = remaining < 0 ? 'DANGER' : progress >= 80 ? 'WARNING' : 'GOOD';

    return {
      ...b,
      amount,
      spent,
      remaining,
      progress,
      status,
      isOverBudget: remaining < 0,
    };
  });

  const totalBudgeted = normalizedBudgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = normalizedBudgets.reduce((sum, b) => sum + b.spent, 0);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Monthly Budgets</Text>
          <TouchableOpacity onPress={() => setShowAddModal(true)} style={styles.addButton}>
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.headerStats}>
          <View style={styles.headerStatItem}>
            <Text style={styles.headerStatLabel}>Total Budget</Text>
            <Text style={styles.headerStatValue}>{formatCurrency(totalBudgeted)}</Text>
          </View>
          <View style={styles.headerStatDivider} />
          <View style={styles.headerStatItem}>
            <Text style={styles.headerStatLabel}>Total Spent</Text>
            <Text style={styles.headerStatValue}>{formatCurrency(totalSpent)}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {budgets.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="wallet-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyStateText}>No budgets set yet</Text>
            <Text style={styles.emptyStateSubtext}>Create a budget to track your spending</Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => setShowAddModal(true)}
            >
              <Text style={styles.createButtonText}>Create First Budget</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.budgetList}>
            {normalizedBudgets.map((budget) => (
              <View key={budget.id} style={styles.budgetCard}>
                <View style={styles.budgetHeader}>
                  <View style={styles.budgetIconContainer}>
                    <Ionicons
                      name={
                        budget.category === 'Food' ? 'restaurant' :
                          budget.category === 'Housing' ? 'home' :
                            budget.category === 'Transport' ? 'car' :
                              budget.category === 'Education' ? 'school' :
                                budget.category === 'Healthcare' ? 'medical' :
                                  budget.category === 'Entertainment' ? 'game-controller' :
                                    'wallet'
                      }
                      size={24}
                      color="#f59e0b"
                    />
                  </View>
                  <View style={styles.budgetInfo}>
                    <Text style={styles.budgetName}>{budget.category}</Text>
                    <Text style={styles.budgetPeriod}>Monthly</Text>
                  </View>
                  <View style={[styles.statusBadge,
                  budget.isOverBudget ? styles.statusDanger :
                    budget.status === 'WARNING' ? styles.statusWarning :
                      styles.statusGood
                  ]}>
                    <Text style={[styles.statusText,
                    budget.isOverBudget ? styles.statusTextDanger :
                      budget.status === 'WARNING' ? styles.statusTextWarning :
                        styles.statusTextGood
                    ]}>
                      {budget.isOverBudget ? 'Over Budget' :
                        budget.status === 'WARNING' ? 'Warning' : 'Good'}
                    </Text>
                  </View>
                </View>

                <View style={styles.progressSection}>
                  <View style={styles.progressLabels}>
                    <Text style={styles.progressLabel}>Spent</Text>
                    <Text style={styles.progressPercentage}>{budget.progress}%</Text>
                  </View>
                  <View style={styles.progressBarContainer}>
                    <View
                      style={[
                        styles.progressBar,
                        { width: `${Math.min(Number(budget.progress) || 0, 100)}%` },
                        budget.isOverBudget ? { backgroundColor: '#ef4444' } :
                          budget.status === 'WARNING' ? { backgroundColor: '#f59e0b' } :
                            { backgroundColor: '#10b981' }
                      ]}
                    />
                  </View>
                  <View style={styles.amountLabels}>
                    <Text style={styles.spentAmount}>{formatCurrency(budget.spent)}</Text>
                    <Text style={styles.totalAmount}>of {formatCurrency(budget.amount)}</Text>
                  </View>
                </View>

                <View style={styles.cardActions}>
                  <Text style={styles.remainingText}>
                    {budget.isOverBudget ?
                      `Over by ${formatCurrency(Math.abs(budget.remaining))}` :
                      `${formatCurrency(budget.remaining)} remaining`
                    }
                  </Text>
                  <TouchableOpacity
                    style={styles.addExpenseButton}
                    onPress={() => openExpenseModal(budget)}
                  >
                    <Ionicons name="add-circle" size={18} color="#f59e0b" />
                    <Text style={styles.addExpenseText}>Add Expense</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Create Budget Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Budget</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Category</Text>
              <View style={styles.categoryGrid}>
                {categoryOptions.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.categoryOption,
                      category === opt.value && styles.categoryOptionSelected
                    ]}
                    onPress={() => setCategory(opt.value)}
                  >
                    <Text style={[
                      styles.categoryOptionText,
                      category === opt.value && styles.categoryOptionTextSelected
                    ]}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Monthly Limit (KES)</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleCreateBudget}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>Create Budget</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Expenses Modal */}
      <Modal
        visible={showExpenseModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowExpenseModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Expense</Text>
              <TouchableOpacity onPress={() => setShowExpenseModal(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.budgetContext}>
                Adding to {selectedBudget?.category} Budget
              </Text>

              <Text style={styles.inputLabel}>Amount Spent (KES)</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0"
                keyboardType="numeric"
                value={expenseAmount}
                onChangeText={setExpenseAmount}
                autoFocus
              />

              <Text style={styles.inputLabel}>Description (Optional)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="What did you buy?"
                value={description}
                onChangeText={setDescription}
              />
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowExpenseModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleAddExpense}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>Record Spending</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 16,
  },
  headerStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  headerStatDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 10,
  },
  headerStatLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginBottom: 4,
  },
  headerStatValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#6b7280',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 16,
  },
  emptyStateSubtext: {
    color: '#6b7280',
    marginTop: 8,
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  budgetList: {
    gap: 16,
  },
  budgetCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  budgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  budgetIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fffbeb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  budgetInfo: {
    flex: 1,
  },
  budgetName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  budgetPeriod: {
    fontSize: 12,
    color: '#6b7280',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusGood: { backgroundColor: '#d1fae5' },
  statusWarning: { backgroundColor: '#fef3c7' },
  statusDanger: { backgroundColor: '#fee2e2' },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  statusTextGood: { color: '#059669' },
  statusTextWarning: { color: '#d97706' },
  statusTextDanger: { color: '#dc2626' },

  progressSection: {
    marginBottom: 16,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  progressPercentage: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  amountLabels: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  spentAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  totalAmount: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12,
  },
  remainingText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  addExpenseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  addExpenseText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#f59e0b',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 16,
  },
  amountInput: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    borderBottomWidth: 2,
    borderBottomColor: '#f59e0b',
    paddingVertical: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  saveButton: {
    backgroundColor: '#f59e0b',
  },
  cancelButtonText: {
    fontWeight: '600',
    color: '#4b5563',
  },
  saveButtonText: {
    fontWeight: 'bold',
    color: '#fff',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  categoryOptionSelected: {
    backgroundColor: '#fffbeb',
    borderColor: '#f59e0b',
  },
  categoryOptionText: {
    fontSize: 12,
    color: '#4b5563',
  },
  categoryOptionTextSelected: {
    color: '#f59e0b',
    fontWeight: 'bold',
  },
  budgetContext: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
    marginBottom: 8,
  },
});
