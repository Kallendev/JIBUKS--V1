import React, { useState, useEffect, useMemo } from 'react';
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
  Platform,
  KeyboardAvoidingView,
  Switch,
  Modal,
  FlatList,
  Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import apiService, { Account } from '@/services/api';
import { useAccounts } from '@/contexts/AccountsContext';

type Mode = 'QUICK' | 'SALARY';

// Brand Colors
const COLORS = {
  primary: '#122f8a', // Deep Blue
  primaryLight: '#3b5998',
  secondary: '#fe9900', // Orange
  secondaryLight: '#ffb74d',
  white: '#ffffff',
  bg: '#F3F4F6',
  text: '#1F2937',
  textLight: '#6B7280',
  border: '#E5E7EB',
  danger: '#EF4444'
};

interface DeductionRow {
  id: string;
  accountId: string;
  name: string;
  amount: string;
}

// Reusable Dropdown Modal
const SelectorModal = ({
  visible,
  onClose,
  title,
  items,
  onSelect,
  renderItem
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  items: any[];
  onSelect: (item: any) => void;
  renderItem?: (item: any) => React.ReactNode;
}) => (
  <Modal visible={visible} animationType="slide" transparent>
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>
        <FlatList
          data={items}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          contentContainerStyle={{ padding: 20 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.modalItem}
              onPress={() => {
                onSelect(item);
                onClose();
              }}
            >
              {renderItem ? renderItem(item) : <Text style={styles.modalItemText}>{item.name}</Text>}
            </TouchableOpacity>
          )}
        />
      </View>
    </View>
  </Modal>
);

export default function AddIncomeScreen() {
  const router = useRouter();
  const { accounts: contextAccounts, refreshAccounts } = useAccounts();

  // State
  const [mode, setMode] = useState<Mode>('QUICK');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Shared State
  const [date, setDate] = useState(new Date());
  const [description, setDescription] = useState('');

  // ================= MODE 1 STATE =================
  const [amount, setAmount] = useState('');

  // Dropdown Selections
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null); // "Received From"
  const [selectedDepositAccount, setSelectedDepositAccount] = useState<Account | null>(null); // "Deposit To"
  const [selectedCategory, setSelectedCategory] = useState<any>(null); // "Category"
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<any>(null); // "Payment Method"

  const [attachment, setAttachment] = useState<string | null>(null);

  // ================= MODE 2 STATE =================
  const [grossAmount, setGrossAmount] = useState('');
  const [employer, setEmployer] = useState('');
  const [salaryIncomeAccount, setSalaryIncomeAccount] = useState<Account | null>(null);
  const [deductions, setDeductions] = useState<DeductionRow[]>([]);

  // ================= MODAL VISIBILITY STATE =================
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [showIncomeAccountModal, setShowIncomeAccountModal] = useState(false);
  const [showDeductionAccountModal, setShowDeductionAccountModal] = useState<{ visible: boolean, rowId: string | null }>({ visible: false, rowId: null });

  // Data State
  const [allAccounts, setAllAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [fetchedAccounts, fetchedCats, fetchedMethods, fetchedCustomers] = await Promise.all([
        apiService.getAccounts({ includeBalances: true }),
        apiService.getCategories(),
        apiService.getPaymentMethods(),
        apiService.getCustomers({ active: true })
      ]);
      setAllAccounts(fetchedAccounts);
      setCategories(fetchedCats.filter((c: any) => c.type === 'income'));
      setPaymentMethods(fetchedMethods);
      setCustomers(fetchedCustomers);

      // Set defaults
      const defaultBank = fetchedAccounts.find(a => a.type === 'ASSET' && (a.name.includes('Check') || a.name.includes('Bank') || a.code === '1010'));
      if (defaultBank) setSelectedDepositAccount(defaultBank);

      const defaultMethod = fetchedMethods.find((m: any) => m.name === 'Cash') || fetchedMethods[0];
      if (defaultMethod) setSelectedPaymentMethod(defaultMethod);

    } catch (error) {
      console.error('Failed to load data', error);
      Alert.alert('Error', 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  // Filtered Account Lists
  const incomeAccounts = useMemo(() =>
    allAccounts.filter(a => a.type === 'INCOME'),
    [allAccounts]);

  const assetAccounts = useMemo(() =>
    allAccounts.filter(a => {
      // 1. Must be Asset
      if (a.type !== 'ASSET') return false;

      // 2. Strict SubType Check (Bank, Cash, Mobile Money, Wallet, Savings)
      const validSubTypes = ['bank', 'cash', 'mobile money', 'wallet', 'savings', 'current'];
      const subType = (a.subtype || '').toLowerCase();

      // Check subtype or flexible name matching if subtype is missing
      if (validSubTypes.some(t => subType.includes(t))) return true;

      // Fallback: Name matching for common keywords if subtype isn't explicit
      const name = a.name.toLowerCase();
      if (name.includes('bank') || name.includes('cash') || name.includes('m-pesa') || name.includes('wallet')) return true;

      // Fallback: Standard Code Range for Current Assets (1000-1199)
      const code = parseInt(a.code || '0');
      if (code >= 1000 && code < 1200) return true;

      return false;
    }),
    [allAccounts]);

  const deductionHeadings = useMemo(() => {
    return allAccounts.filter(a => {
      const code = parseInt(a.code || '0');
      if (a.type === 'EXPENSE' && code >= 6600 && code < 6700) return true; // Taxes
      if (a.type === 'LIABILITY' && (a.name.includes('Tax') || a.name.includes('PAYE'))) return true;
      if (a.type === 'LIABILITY' && (a.name.includes('Loan') || a.name.includes('Sacco'))) return true;
      if (a.type === 'ASSET' && (a.name.includes('Saving') || a.name.includes('Sacco'))) return true;
      return false;
    }).sort((a, b) => (a.code || '').localeCompare(b.code || ''));
  }, [allAccounts]);

  // Calculations
  const totalDeductions = useMemo(() => {
    return deductions.reduce((sum, row) => sum + (parseFloat(row.amount) || 0), 0);
  }, [deductions]);

  const netSalary = useMemo(() => {
    const gross = parseFloat(grossAmount) || 0;
    return gross - totalDeductions;
  }, [grossAmount, totalDeductions]);

  // Image Picker
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });

    if (!result.canceled) {
      setAttachment(result.assets[0].uri);
    }
  };

  // Handlers
  const handleSubmit = async () => {
    if (submitting) return;

    try {
      setSubmitting(true);

      if (mode === 'QUICK') {
        if (!amount || !selectedCategory || !selectedPaymentMethod || !selectedDepositAccount) {
          Alert.alert('Missing Fields', 'Please fill in Amount, Category, Deposit Account, and Payment Method');
          setSubmitting(false);
          return;
        }

        // Map Payment Method to Account if possible, or use Deposit Account
        await apiService.createTransaction({
          type: 'INCOME',
          amount: parseFloat(amount),
          category: selectedCategory.name,
          description: description || `Income from ${selectedCustomer?.name || 'Unknown'}`,
          paymentMethod: selectedPaymentMethod.name,
          date: date.toISOString(),
          notes: description,
          // IMPORTANT: In Quick Mode, money increases the CHOSEN Asset Account
          debitAccountId: parseInt(selectedDepositAccount.id), // Debit Asset (Increase)
          payee: selectedCustomer?.name
        });

      } else {
        // SALARY MODE
        if (!grossAmount || parseFloat(grossAmount) <= 0) {
          Alert.alert('Invalid Amount', 'Please enter a valid Gross Amount');
          setSubmitting(false);
          return;
        }
        if (!salaryIncomeAccount) {
          Alert.alert('Missing Field', 'Please select the Income Account (e.g. Salary)');
          setSubmitting(false);
          return;
        }

        const gross = parseFloat(grossAmount);

        // Construct Splits
        // 1. Deductions
        const splitLines = deductions.map(d => ({
          accountId: d.accountId,
          category: d.name,
          amount: parseFloat(d.amount) || 0,
          description: d.name
        }));

        // 2. The Net Deposit goes to Bank
        if (netSalary > 0 && selectedDepositAccount) {
          splitLines.push({
            accountId: selectedDepositAccount.id,
            category: 'Net Salary Deposit',
            amount: netSalary,
            description: `Net Pay to ${selectedDepositAccount.name}`
          });
        }

        // Validate
        const totalSplit = splitLines.reduce((sum, s) => sum + s.amount, 0);
        if (Math.abs(totalSplit - gross) > 1.0) {
          Alert.alert('Math Error', `Splits (${totalSplit}) do not equal Gross (${gross}). Check your numbers.`);
          setSubmitting(false);
          return;
        }

        await apiService.createTransaction({
          type: 'INCOME',
          amount: gross,
          category: 'Salary',
          description: description || `Salary: ${employer || 'Unknown'}`,
          date: date.toISOString(),
          creditAccountId: parseInt(salaryIncomeAccount.id), // Revenue Source
          splits: splitLines as any,
          payee: employer
        });
      }

      Alert.alert('Success', 'Income Recorded Successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
      refreshAccounts();

    } catch (error: any) {
      Alert.alert('Error', error.error || error.message || 'Failed to record income');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  // Renderers for Modals
  const renderAccountItem = (account: Account) => (
    <View style={styles.dropdownItem}>
      <View style={styles.dropdownIcon}>
        <Ionicons name="wallet-outline" size={20} color={COLORS.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.dropdownTitle}>{account.name}</Text>
        <Text style={styles.dropdownSubtitle}>{account.code} • Bal: KES {account.balance?.toLocaleString() || '0'}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </View>
  );

  const renderCustomerItem = (customer: any) => (
    <View style={styles.dropdownItem}>
      <View style={[styles.dropdownIcon, { backgroundColor: '#E0E7FF' }]}>
        <Ionicons name="person" size={18} color={COLORS.primary} />
      </View>
      <Text style={styles.dropdownTitle}>{customer.name}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>

        {/* Header with Blue Gradient */}
        <LinearGradient colors={[COLORS.primary, '#1e40af']} style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Record Income</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Toggle Switch */}
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[styles.toggleBtn, mode === 'QUICK' && styles.toggleBtnActive]}
              onPress={() => setMode('QUICK')}
            >
              <Text style={[styles.toggleText, mode === 'QUICK' && styles.toggleTextActive]}>Quick Deposit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, mode === 'SALARY' && styles.toggleBtnActive]}
              onPress={() => setMode('SALARY')}
            >
              <Text style={[styles.toggleText, mode === 'SALARY' && styles.toggleTextActive]}>Payslip / Salary</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 100 }}>

          {/* ================= MODE 1: QUICK DEPOSIT ================= */}
          {mode === 'QUICK' && (
            <View style={styles.formContainer}>

              {/* Amount Card */}
              <View style={styles.card}>
                <Text style={styles.label}>Amount Received</Text>
                <View style={styles.amountInputWrap}>
                  <Text style={styles.currency}>KES</Text>
                  <TextInput
                    style={styles.amountInput}
                    value={amount}
                    onChangeText={setAmount}
                    placeholder="0.00"
                    keyboardType="numeric"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>

              {/* Inputs Card */}
              <View style={styles.card}>

                {/* Received From Dropdown */}
                <Text style={styles.label}>Received From (Customer/Source)</Text>
                <TouchableOpacity style={styles.selector} onPress={() => setShowCustomerModal(true)}>
                  <Text style={[styles.selectorText, !selectedCustomer && styles.placeholderText]}>
                    {selectedCustomer ? selectedCustomer.name : 'Select Payer...'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={COLORS.textLight} />
                </TouchableOpacity>

                {/* Deposit To Dropdown */}
                <Text style={[styles.label, { marginTop: 15 }]}>Deposit To Account</Text>
                <TouchableOpacity style={styles.selector} onPress={() => setShowDepositModal(true)}>
                  {selectedDepositAccount ? (
                    <View>
                      <Text style={styles.selectorText}>{selectedDepositAccount.name}</Text>
                      <Text style={styles.balanceText}>Current Balance: KES {selectedDepositAccount.balance?.toLocaleString() || '0'}</Text>
                    </View>
                  ) : (
                    <Text style={styles.placeholderText}>Select Bank/M-Pesa...</Text>
                  )}
                  <Ionicons name="chevron-down" size={20} color={COLORS.textLight} />
                </TouchableOpacity>

                {/* Category Dropdown */}
                <Text style={[styles.label, { marginTop: 15 }]}>Income Category</Text>
                <TouchableOpacity style={styles.selector} onPress={() => setShowCategoryModal(true)}>
                  <Text style={[styles.selectorText, !selectedCategory && styles.placeholderText]}>
                    {selectedCategory ? selectedCategory.name : 'Select Category...'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={COLORS.textLight} />
                </TouchableOpacity>

                {/* Payment Method Dropdown */}
                <Text style={[styles.label, { marginTop: 15 }]}>Payment Method</Text>
                <TouchableOpacity style={styles.selector} onPress={() => setShowPaymentMethodModal(true)}>
                  <Text style={[styles.selectorText, !selectedPaymentMethod && styles.placeholderText]}>
                    {selectedPaymentMethod ? selectedPaymentMethod.name : 'Select Method...'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={COLORS.textLight} />
                </TouchableOpacity>

                {/* Date */}
                <Text style={[styles.label, { marginTop: 15 }]}>Date</Text>
                <View style={styles.dateSelector}>
                  <Ionicons name="calendar-outline" size={20} color={COLORS.textLight} />
                  <Text style={styles.selectorText}>{formatDate(date)}</Text>
                </View>

                {/* Description */}
                <Text style={[styles.label, { marginTop: 15 }]}>Description</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. January Rent"
                  value={description}
                  onChangeText={setDescription}
                />

                {/* Attachment */}
                <Text style={[styles.label, { marginTop: 15 }]}>Attachment</Text>
                <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
                  {attachment ? (
                    <View style={styles.attachmentPreview}>
                      <Ionicons name="image" size={20} color={COLORS.primary} />
                      <Text style={styles.attachmentText}>Receipt Attached</Text>
                      <TouchableOpacity onPress={() => setAttachment(null)} style={{ marginLeft: 10 }}>
                        <Ionicons name="close-circle" size={20} color={COLORS.danger} />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <>
                      <Ionicons name="camera-outline" size={24} color={COLORS.textLight} />
                      <Text style={styles.uploadText}>Upload Receipt</Text>
                    </>
                  )}
                </TouchableOpacity>

              </View>
            </View>
          )}

          {/* ================= MODE 2: SALARY / PAYSLIP ================= */}
          {mode === 'SALARY' && (
            <View style={styles.formContainer}>

              {/* Section A: Gross */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={[styles.iconBox, { backgroundColor: '#EFF6FF' }]}>
                    <Ionicons name="cash-outline" size={20} color={COLORS.primary} />
                  </View>
                  <Text style={styles.sectionTitle}>1. Gross Earnings</Text>
                </View>

                <Text style={styles.label}>Income Type (Source Account)</Text>
                <TouchableOpacity style={styles.selector} onPress={() => setShowIncomeAccountModal(true)}>
                  <Text style={[styles.selectorText, !salaryIncomeAccount && styles.placeholderText]}>
                    {salaryIncomeAccount ? salaryIncomeAccount.name : 'Select Income Type...'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={COLORS.textLight} />
                </TouchableOpacity>

                <Text style={[styles.label, { marginTop: 15 }]}>Employer / Payer</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Acme Corp Ltd"
                  value={employer}
                  onChangeText={setEmployer}
                />

                <View style={{ marginTop: 15 }}>
                  <Text style={styles.label}>GROSS AMOUNT (Pre-Tax)</Text>
                  <View style={[styles.amountInputWrap, { borderBottomColor: COLORS.primaryLight }]}>
                    <Text style={[styles.currency, { color: COLORS.primary }]}>KES</Text>
                    <TextInput
                      style={styles.amountInput}
                      value={grossAmount}
                      onChangeText={setGrossAmount}
                      placeholder="0.00"
                      keyboardType="numeric"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </View>
              </View>

              {/* Section B: Deductions Grid */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={[styles.iconBox, { backgroundColor: '#FEF2F2' }]}>
                    <Ionicons name="cut-outline" size={20} color={COLORS.danger} />
                  </View>
                  <Text style={[styles.sectionTitle, { color: COLORS.danger }]}>2. Taxes & Deductions</Text>
                </View>

                <View style={styles.gridHeader}>
                  <Text style={[styles.gridHeadText, { flex: 2 }]}>Type</Text>
                  <Text style={[styles.gridHeadText, { flex: 1, textAlign: 'right' }]}>Amount</Text>
                  <View style={{ width: 30 }} />
                </View>

                {deductions.map((row) => (
                  <View key={row.id} style={styles.gridRow}>
                    {/* Deduction Selector */}
                    <TouchableOpacity
                      style={styles.deductionSelector}
                      onPress={() => setShowDeductionAccountModal({ visible: true, rowId: row.id })}
                    >
                      <Text style={styles.deductionSelectorText}>
                        {row.name || 'Select Tax/Fee...'}
                      </Text>
                      <Ionicons name="chevron-down" size={16} color={COLORS.textLight} />
                    </TouchableOpacity>

                    {/* Amount Input */}
                    <TextInput
                      style={styles.gridInput}
                      value={row.amount}
                      onChangeText={(val) => {
                        setDeductions(prev => prev.map(r => r.id === row.id ? { ...r, amount: val } : r));
                      }}
                      placeholder="0"
                      keyboardType="numeric"
                    />

                    {/* Delete */}
                    <TouchableOpacity
                      onPress={() => setDeductions(prev => prev.filter(r => r.id !== row.id))}
                      style={styles.trashBtn}
                    >
                      <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
                    </TouchableOpacity>
                  </View>
                ))}

                <TouchableOpacity
                  style={[styles.addBtn, { borderColor: COLORS.danger }]}
                  onPress={() => setDeductions([...deductions, { id: Date.now().toString(), accountId: '', name: '', amount: '' }])}
                >
                  <Ionicons name="add-circle" size={20} color={COLORS.danger} />
                  <Text style={[styles.addBtnText, { color: COLORS.danger }]}>+ Add Deduction Line</Text>
                </TouchableOpacity>

                <View style={styles.divider} />

                <View style={styles.rowBetween}>
                  <Text style={styles.totalLabel}>Total Deductions:</Text>
                  <Text style={styles.totalValue}>{totalDeductions.toLocaleString()}</Text>
                </View>
              </View>

              {/* Section C: Net Pay */}
              <View style={[styles.card, { backgroundColor: COLORS.primary }]}>
                <View style={[styles.cardHeader, { marginBottom: 10 }]}>
                  <View style={[styles.iconBox, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                    <Ionicons name="wallet" size={20} color="#fff" />
                  </View>
                  <Text style={[styles.sectionTitle, { color: '#fff' }]}>3. Net Deposit</Text>
                </View>

                <View style={{ alignItems: 'center', marginVertical: 10 }}>
                  <Text style={[styles.netLabel, { color: 'rgba(255,255,255,0.7)' }]}>TOTAL TO BANK</Text>
                  <Text style={styles.netAmount}>KES {netSalary.toLocaleString()}</Text>
                </View>

                <View style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: 15, borderRadius: 12, marginTop: 10 }}>
                  <Text style={[styles.label, { color: 'rgba(255,255,255,0.8)', marginBottom: 8 }]}>Deposit To Account</Text>
                  <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                    onPress={() => setShowDepositModal(true)}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <Ionicons name="card-outline" size={24} color="#fff" />
                      <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
                        {selectedDepositAccount ? selectedDepositAccount.name : 'Select Account'}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.5)" />
                  </TouchableOpacity>
                  {selectedDepositAccount && (
                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 5, marginLeft: 34 }}>
                      Current Bal: KES {selectedDepositAccount.balance?.toLocaleString() || '0'}
                    </Text>
                  )}
                </View>
              </View>

            </View>
          )}

        </ScrollView>

        {/* Footer Submit */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
            {submitting ? <ActivityIndicator color="#fff" /> : (
              <Text style={styles.submitBtnText}>
                {mode === 'QUICK' ? 'Record Income' : 'Process Payslip'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>

      {/* ================= MODALS ================= */}

      {/* 1. Customers Modal */}
      <SelectorModal
        visible={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        title="Received From"
        items={customers}
        onSelect={setSelectedCustomer}
        renderItem={renderCustomerItem}
      />

      {/* 2. Deposit Account Modal */}
      <SelectorModal
        visible={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        title="Deposit To Account"
        items={assetAccounts}
        onSelect={setSelectedDepositAccount}
        renderItem={renderAccountItem}
      />

      {/* 3. Categories Modal */}
      <SelectorModal
        visible={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        title="Income Category"
        items={categories}
        onSelect={setSelectedCategory}
      />

      {/* 4. Payment Methods Modal */}
      <SelectorModal
        visible={showPaymentMethodModal}
        onClose={() => setShowPaymentMethodModal(false)}
        title="Payment Method"
        items={paymentMethods}
        onSelect={setSelectedPaymentMethod}
      />

      {/* 5. Deductions Modal */}
      <SelectorModal
        visible={showDeductionAccountModal.visible}
        onClose={() => setShowDeductionAccountModal({ visible: false, rowId: null })}
        title="Select Deduction Type"
        items={deductionHeadings}
        onSelect={(item) => {
          if (showDeductionAccountModal.rowId) {
            setDeductions(prev => prev.map(row =>
              row.id === showDeductionAccountModal.rowId
                ? { ...row, accountId: item.id, name: item.name.replace(/(Tax:|Insurance:)\s*/, '') }
                : row
            ));
          }
        }}
      />

      {/* 6. Income Account Modal (Payslip Mode) */}
      <SelectorModal
        visible={showIncomeAccountModal}
        onClose={() => setShowIncomeAccountModal(false)}
        title="Select Income Type"
        items={incomeAccounts}
        onSelect={setSalaryIncomeAccount}
        renderItem={renderAccountItem}
      />

    </SafeAreaView >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  backBtn: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700'
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 15,
    padding: 4
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12
  },
  toggleBtnActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  toggleText: {
    color: '#bfdbfe',
    fontWeight: '600'
  },
  toggleTextActive: {
    color: COLORS.primary,
    fontWeight: '700'
  },
  content: {
    padding: 20
  },
  formContainer: {
    gap: 16
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2
  },
  label: {
    fontSize: 14,
    color: COLORS.textLight,
    fontWeight: '600',
    marginBottom: 8
  },
  amountInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 10
  },
  currency: {
    fontSize: 24,
    color: COLORS.textLight,
    fontWeight: '600',
    marginRight: 10
  },
  amountInput: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1
  },

  // Custom Selector Styles
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  selectorText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500'
  },
  placeholderText: {
    color: '#9CA3AF'
  },
  balanceText: {
    fontSize: 12,
    color: COLORS.primary,
    marginTop: 2
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10
  },
  input: {
    backgroundColor: '#F9FAFB',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: 16
  },

  // Attachment
  uploadBtn: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB'
  },
  uploadText: {
    color: COLORS.textLight,
    marginTop: 8
  },
  attachmentPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 10,
    borderRadius: 8
  },
  attachmentText: {
    color: COLORS.primary,
    fontWeight: '500',
    marginLeft: 8
  },

  // Chips
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8
  },
  chipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: COLORS.primary
  },
  chipText: {
    color: COLORS.textLight,
    fontWeight: '500'
  },
  chipTextActive: {
    color: COLORS.primary,
    fontWeight: '600'
  },

  // Grid
  deductionSelector: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 10,
    marginRight: 10
  },
  deductionSelectorText: {
    fontSize: 13,
    color: COLORS.text,
    flex: 1
  },
  gridHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 8,
    marginBottom: 8
  },
  gridHeadText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  gridInput: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 10,
    textAlign: 'right',
    fontSize: 14,
    color: COLORS.text
  },
  trashBtn: {
    padding: 8,
    marginLeft: 8
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    gap: 8,
    marginTop: 10
  },
  addBtnText: {
    color: COLORS.secondary,
    fontWeight: '600'
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 15
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  totalLabel: {
    fontSize: 16,
    color: '#4B5563',
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.danger
  },

  // Net Card
  netLabel: {
    color: '#bfdbfe',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8
  },
  netAmount: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '800'
  },
  netSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    marginTop: 8,
    justifyContent: 'space-between'
  },
  netSelectorText: {
    color: COLORS.primary,
    fontWeight: '700',
    marginLeft: 10,
    flex: 1
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 15
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    maxHeight: '80%',
    paddingBottom: 40
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary
  },
  closeBtn: {
    padding: 5
  },
  modalItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6'
  },
  modalItemText: {
    fontSize: 16,
    color: COLORS.text
  },

  // Custom Modal Items
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15
  },
  dropdownIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF', // Light Blue
    alignItems: 'center',
    justifyContent: 'center'
  },
  dropdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text
  },
  dropdownSubtitle: {
    fontSize: 13,
    color: COLORS.textLight,
    marginTop: 2
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB'
  },
  submitBtn: {
    backgroundColor: COLORS.secondary,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold'
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  }
});
