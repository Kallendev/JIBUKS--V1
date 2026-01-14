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
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import apiService from '@/services/api';
import { useAccounts } from '@/contexts/AccountsContext';
import { getDefaultDebitAccount, getDefaultCreditAccount } from '@/utils/accountMapping';

export default function AddExpenseScreen() {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPayment, setSelectedPayment] = useState('');
  const [date, setDate] = useState(new Date());
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sourceAccountId, setSourceAccountId] = useState('');

  const [categories, setCategories] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const { accounts, defaultAccount } = useAccounts();

  useEffect(() => {
    loadData();
    // Set default account
    if (defaultAccount) {
      setSourceAccountId(defaultAccount.id);
    }
  }, [defaultAccount]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [allCategories, methods] = await Promise.all([
        apiService.getCategories(),
        apiService.getPaymentMethods()
      ]);

      // Filter for expense categories
      const expenseCats = allCategories.filter((c: any) => c.type?.toLowerCase() === 'expense');
      setCategories(expenseCats);
      setPaymentMethods(methods);
    } catch (error) {
      console.error('Failed to load data:', error);
      Alert.alert('Error', 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getIconName = (categoryName: string): any => {
    const iconMap: { [key: string]: any } = {
      'Food': 'restaurant',
      'Transport': 'car',
      'Housing': 'home',
      'Utilities': 'flash',
      'Entertainment': 'film',
      'Healthcare': 'medical',
      'Education': 'school',
      'Shopping': 'bag',
      'Salary': 'cash',
      'Business': 'briefcase',
      'Investment': 'trending-up',
      'Gift': 'gift',
    };
    return iconMap[categoryName] || 'ellipse';
  };

  const getPaymentIcon = (methodName: string): any => {
    const iconMap: { [key: string]: any } = {
      'Cash': 'cash',
      'M-Pesa': 'phone-portrait',
      'Bank Card': 'card',
      'Bank Transfer': 'swap-horizontal',
      'Mobile Money': 'phone-portrait'
    };
    return iconMap[methodName] || 'card'; // Default to card
  };

  const getCategoryColor = (categoryName: string) => {
    const colorMap: { [key: string]: string } = {
      'Food': '#FF6B6B',
      'Transport': '#4ECDC4',
      'Housing': '#45B7D1',
      'Utilities': '#FFA07A',
      'Entertainment': '#98D8C8',
      'Healthcare': '#F7DC6F',
      'Education': '#BB8FCE',
      'Shopping': '#85C1E2',
    };
    return colorMap[categoryName] || '#6b7280';
  };

  const handleSubmit = async () => {
    // Validation
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    if (!selectedCategory) {
      Alert.alert('Category Required', 'Please select a category');
      return;
    }

    if (!selectedPayment) {
      Alert.alert('Payment Method Required', 'Please select a payment method');
      return;
    }

    try {
      setSubmitting(true);

      const debitAcctId = getDefaultDebitAccount('EXPENSE', selectedCategory);
      const creditAcctId = sourceAccountId || getDefaultCreditAccount('EXPENSE', selectedCategory);

      console.log('💸 Creating EXPENSE transaction with accounts:', {
        debitAccountId: debitAcctId,
        creditAccountId: creditAcctId,
        category: selectedCategory,
      });

      await apiService.createTransaction({
        type: 'EXPENSE',
        amount: parseFloat(amount),
        category: selectedCategory,
        description: description || selectedCategory,
        paymentMethod: selectedPayment,
        date: date.toISOString(),
        notes: notes || undefined,
        debitAccountId: debitAcctId,
        creditAccountId: creditAcctId,
      });

      Alert.alert(
        'Success',
        'Expense added successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.error || 'Failed to add expense');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#ef4444', '#dc2626']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Expense</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#ef4444" />
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Amount Input */}
          <View style={styles.amountSection}>
            <Text style={styles.amountLabel}>Amount (KES)</Text>
            <View style={styles.amountInputContainer}>
              <Text style={styles.currencySymbol}>KES</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0"
                placeholderTextColor="#d1d5db"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
                autoFocus
              />
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Description (Optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., Grocery shopping"
              placeholderTextColor="#9ca3af"
              value={description}
              onChangeText={setDescription}
            />
          </View>

          {/* Category Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Category *</Text>
            <View style={styles.categoriesGrid}>
              {categories.map((category) => {
                const color = category.color || getCategoryColor(category.name);
                return (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryCard,
                      selectedCategory === category.name && {
                        backgroundColor: color + '20',
                        borderColor: color,
                        borderWidth: 2,
                      },
                    ]}
                    onPress={() => setSelectedCategory(category.name)}
                  >
                    <View
                      style={[
                        styles.categoryIcon,
                        selectedCategory === category.name
                          ? { backgroundColor: color + '30' }
                          : { backgroundColor: '#f3f4f6' }
                      ]}
                    >
                      <Ionicons
                        name={getIconName(category.name)}
                        size={24}
                        color={selectedCategory === category.name ? color : '#6b7280'}
                      />
                    </View>
                    <Text
                      style={[
                        styles.categoryName,
                        selectedCategory === category.name && { fontWeight: '700', color: color },
                      ]}
                    >
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Payment Method */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Payment Method *</Text>
            <View style={styles.paymentGrid}>
              {paymentMethods.map((method) => (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.paymentCard,
                    selectedPayment === method.name && styles.paymentCardActive,
                  ]}
                  onPress={() => setSelectedPayment(method.name)}
                >
                  <Ionicons
                    name={getPaymentIcon(method.name)}
                    size={24}
                    color={selectedPayment === method.name ? '#2563eb' : '#6b7280'}
                  />
                  <Text
                    style={[
                      styles.paymentName,
                      selectedPayment === method.name && styles.paymentNameActive,
                    ]}
                  >
                    {method.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Paid from Account */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Paid from Account (Optional)</Text>
            <View style={styles.accountsGrid}>
              {accounts.filter(acc => acc.type === 'ASSET').map((account) => (
                <TouchableOpacity
                  key={account.id}
                  style={[
                    styles.accountCard,
                    sourceAccountId === account.id && styles.accountCardActive,
                  ]}
                  onPress={() => setSourceAccountId(account.id)}
                >
                  <View style={styles.accountCardContent}>
                    <Ionicons
                      name="wallet"
                      size={20}
                      color={sourceAccountId === account.id ? '#ef4444' : '#6b7280'}
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.accountName,
                          sourceAccountId === account.id && styles.accountNameActive,
                        ]}
                      >
                        {account.name}
                      </Text>
                      <Text style={styles.accountCode}>{account.code}</Text>
                    </View>
                    {account.isDefault && (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultBadgeText}>Default</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Date */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Date</Text>
            <View style={styles.dateCard}>
              <Ionicons name="calendar" size={20} color="#6b7280" />
              <Text style={styles.dateText}>{formatDate(date)}</Text>
            </View>
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Notes (Optional)</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Add any additional notes..."
              placeholderTextColor="#9ca3af"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={24} color="#fff" />
                <Text style={styles.submitButtonText}>Add Expense</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
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
  content: {
    flex: 1,
  },
  amountSection: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 24,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  amountLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 12,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbol: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ef4444',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  textInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1f2937',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    width: '22%',
    aspectRatio: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  paymentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  paymentCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  paymentCardActive: {
    backgroundColor: '#dbeafe',
    borderColor: '#2563eb',
  },
  paymentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  paymentNameActive: {
    color: '#2563eb',
  },
  dateCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  dateText: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  notesInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1f2937',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minHeight: 100,
  },
  submitButton: {
    backgroundColor: '#ef4444',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  accountsGrid: {
    gap: 12,
  },
  accountCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  accountCardActive: {
    backgroundColor: '#fee2e2',
    borderColor: '#ef4444',
  },
  accountCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  accountName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
  },
  accountNameActive: {
    color: '#ef4444',
  },
  accountCode: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  defaultBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#2563eb',
  },
});
