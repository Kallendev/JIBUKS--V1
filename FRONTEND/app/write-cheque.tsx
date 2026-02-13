import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import apiService from '@/services/api';

const VAT_RATE = 0.16;

type ChequeType = 'EXPENSE' | 'STOCK' | 'OTHER';

export default function WriteChequeScreen() {
  const router = useRouter();

  // Loading flags
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // Reference data
  const [vendors, setVendors] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);

  // Top form
  const [bankAccountId, setBankAccountId] = useState('');
  const [chequeNumber, setChequeNumber] = useState('');
  const [payeeId, setPayeeId] = useState('');
  const [chequeDate, setChequeDate] = useState(new Date().toISOString().split('T')[0]);

  // Cheque purpose
  const [chequeType, setChequeType] = useState<ChequeType>('EXPENSE');
  const [expenseAccountId, setExpenseAccountId] = useState('');

  // Amount / VAT / memo
  const [lineAmount, setLineAmount] = useState(''); // user-entered amount before VAT logic
  const [vatInclusive, setVatInclusive] = useState(true);
  const [lineMemo, setLineMemo] = useState('');
  const [memo, setMemo] = useState('');
  const [messageToCustomer, setMessageToCustomer] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setLoadingData(true);

        const [vendorsRes, allAccountsRes, assetAccountsRes] = await Promise.all([
          apiService.getVendors(),
          apiService.getAccounts({ includeBalances: false }),
          apiService.getAccounts({ type: 'ASSET', includeBalances: false }),
        ]);

        const vendorList = Array.isArray(vendorsRes)
          ? vendorsRes
          : vendorsRes?.vendors ?? [];
        setVendors(vendorList);

        const accountList = Array.isArray(allAccountsRes) ? allAccountsRes : (allAccountsRes ?? []);
        setAccounts(accountList);

        // bank / cash accounts: ASSET + isPaymentEligible
        const bankList = (assetAccountsRes || []).filter((a: any) => a.isPaymentEligible);
        setBankAccounts(bankList);

        if (bankList.length > 0 && !bankAccountId) {
          setBankAccountId(String(bankList[0].id));
        }
        if (vendorList.length > 0 && !payeeId) {
          setPayeeId(String(vendorList[0].id));
        }
      } catch (error) {
        console.error('Error loading cheque data:', error);
        Alert.alert('Error', 'Failed to load suppliers or accounts from the server.');
        setVendors([]);
        setAccounts([]);
        setBankAccounts([]);
      } finally {
        setLoadingData(false);
      }
    })();
  }, []);

  // Derived lists for the three tabs from Chart of Accounts
  const expenseAccounts = useMemo(
    () => (accounts || []).filter((a: any) => a.type === 'EXPENSE'),
    [accounts],
  );

  const stockAccounts = useMemo(
    () =>
      (expenseAccounts || []).filter((a: any) => {
        const code = (a.code || '').toString();
        const name = (a.name || '').toLowerCase();
        // Heuristic: treat codes 51xx–52xx or names with 'stock', 'inventory', 'purchase' as stock-related
        return (
          code.startsWith('51') ||
          code.startsWith('52') ||
          name.includes('stock') ||
          name.includes('inventory') ||
          name.includes('purchase')
        );
      }),
    [expenseAccounts],
  );

  const otherAccounts = useMemo(
    () =>
      (expenseAccounts || []).filter((a: any) => !stockAccounts.some((s: any) => s.id === a.id)),
    [expenseAccounts, stockAccounts],
  );

  // Pick which list to show based on tab
  const visibleExpenseAccounts = useMemo(() => {
    if (chequeType === 'STOCK') return stockAccounts;
    if (chequeType === 'OTHER') return otherAccounts;
    return expenseAccounts;
  }, [chequeType, expenseAccounts, stockAccounts, otherAccounts]);

  // Ensure we always have a valid selected expense account when the list changes
  useEffect(() => {
    if (!visibleExpenseAccounts.length) return;
    const exists = visibleExpenseAccounts.some(
      (a: any) => String(a.id) === String(expenseAccountId),
    );
    if (!exists) {
      setExpenseAccountId(String(visibleExpenseAccounts[0].id));
    }
  }, [visibleExpenseAccounts, expenseAccountId]);

  // Simple helpers
  const formatCurrency = (n: number) => `KES ${n.toLocaleString('en-KE', { minimumFractionDigits: 0 })}`;

  const parseAmount = (s: string) => {
    const n = parseFloat(s.replace(/,/g, ''));
    return isNaN(n) ? 0 : n;
  };

  // Totals
  const subtotal = parseAmount(lineAmount);
  const vatAmountRaw = vatInclusive
    ? subtotal - subtotal / (1 + VAT_RATE)
    : subtotal * VAT_RATE;
  const vatAmount = Number(vatAmountRaw.toFixed(2));
  const total = vatInclusive ? subtotal : subtotal + vatAmount;

  const selectedVendorName =
    vendors.find((v: any) => String(v.id) === String(payeeId))?.name || '';

  const handleClear = () => {
    setChequeNumber('');
    setChequeDate(new Date().toISOString().split('T')[0]);
    setChequeType('EXPENSE');
    setExpenseAccountId('');
    setLineAmount('');
    setVatInclusive(true);
    setLineMemo('');
    setMemo('');
    setMessageToCustomer('');
  };

  const buildNotes = () => {
    const parts: string[] = [];
    if (messageToCustomer.trim()) {
      parts.push(`Message to payee: ${messageToCustomer.trim()}`);
    }
    if (lineMemo.trim()) {
      parts.push(`Line memo: ${lineMemo.trim()}`);
    }
    if (memo.trim()) {
      parts.push(`Internal memo: ${memo.trim()}`);
    }
    return parts.join('\n\n') || undefined;
  };

  const validateForm = (): boolean => {
    if (!bankAccountId) {
      Alert.alert('Missing field', 'Please select a bank account (Account).');
      return false;
    }
    if (!chequeNumber.trim()) {
      Alert.alert('Missing field', 'Please enter a cheque number.');
      return false;
    }
    if (!payeeId) {
      Alert.alert('Missing field', 'Please select a payee (Supplier).');
      return false;
    }
    if (!expenseAccountId) {
      Alert.alert('Missing field', 'Please select an expense account for this cheque.');
      return false;
    }
    if (total <= 0) {
      Alert.alert('Invalid amount', 'Total amount must be greater than 0.');
      return false;
    }
    return true;
  };

  const submitCheque = async (options: { mode: 'save' | 'saveAndNew' | 'print' }) => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      const notes = buildNotes();

      await apiService.writeCheque({
        // backend reads tenantId & userId from JWT; not passed here
        bankAccountId: parseInt(bankAccountId, 10),
        amount: total,
        chequeNumber: chequeNumber.trim(),
        payee: selectedVendorName || 'Supplier',
        date: chequeDate, // ISO date string (YYYY-MM-DD)
        expenseAccountId: parseInt(expenseAccountId, 10),
        description:
          (chequeType === 'EXPENSE'
            ? 'Expense'
            : chequeType === 'STOCK'
            ? 'Stock purchase'
            : 'Other payment') +
          (lineMemo ? ` - ${lineMemo.trim()}` : ''),
        notes,
      });

      if (options.mode === 'saveAndNew') {
        Alert.alert('Success', 'Cheque saved. Ready for the next one.');
        handleClear();
      } else if (options.mode === 'print') {
        Alert.alert(
          'Saved',
          'Cheque saved successfully. Print/Share will be wired to a PDF/receipt screen next.',
        );
      } else {
        Alert.alert('Success', 'Cheque saved successfully', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch (error: any) {
      console.error('Error writing cheque:', error);
      Alert.alert(
        'Error',
        error?.error || error?.message || 'Failed to write cheque. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => submitCheque({ mode: 'save' });
  const handleSaveAndNew = () => submitCheque({ mode: 'saveAndNew' });
  const handlePrintShare = () => submitCheque({ mode: 'print' });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#f59e0b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Write Cheque</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {/* Top card: Account / Cheque No / Payee / Date */}
          <View style={styles.topCard}>
            <View style={styles.rowTwoCols}>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Account*</Text>
                <View style={styles.dropdownField}>
                  {loadingData ? (
                    <ActivityIndicator size="small" color="#1d4ed8" />
                  ) : (
                    <Picker
                      selectedValue={bankAccountId}
                      onValueChange={(val) => setBankAccountId(val ? String(val) : '')}
                      style={styles.picker}
                      prompt="Select bank account"
                    >
                      <Picker.Item label="Select account" value="" />
                      {bankAccounts.map((a: any) => (
                        <Picker.Item
                          key={a.id}
                          label={`${a.code} - ${a.name}`}
                          value={String(a.id)}
                        />
                      ))}
                    </Picker>
                  )}
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Cheque No*</Text>
                <TextInput
                  style={styles.textInput}
                  value={chequeNumber}
                  onChangeText={setChequeNumber}
                  placeholder="e.g. 204"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.rowTwoCols}>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Payee (Supplier)*</Text>
                <View style={styles.dropdownField}>
                  {loadingData ? (
                    <ActivityIndicator size="small" color="#1d4ed8" />
                  ) : (
                    <Picker
                      selectedValue={payeeId}
                      onValueChange={(val) => setPayeeId(val ? String(val) : '')}
                      style={styles.picker}
                      prompt="Select payee"
                    >
                      <Picker.Item label="Select supplier" value="" />
                      {vendors.map((v: any) => (
                        <Picker.Item key={v.id} label={v.name} value={String(v.id)} />
                      ))}
                    </Picker>
                  )}
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Date*</Text>
                <View style={styles.inputWithIcon}>
                  <TextInput
                    style={styles.textInputPlain}
                    value={chequeDate}
                    onChangeText={setChequeDate}
                    placeholder="YYYY-MM-DD"
                  />
                  <Ionicons name="calendar-outline" size={18} color="#6b7280" />
                </View>
              </View>
            </View>
          </View>

          {/* Tabs: Expense / Stock Purchase / Other */}
          <View style={styles.tabRow}>
            {(['EXPENSE', 'STOCK', 'OTHER'] as ChequeType[]).map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.tabButton,
                  chequeType === type && styles.tabButtonActive,
                ]}
                onPress={() => setChequeType(type)}
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    chequeType === type && styles.tabButtonTextActive,
                  ]}
                >
                  {type === 'EXPENSE'
                    ? 'Expense'
                    : type === 'STOCK'
                    ? 'Stock Purchase'
                    : 'Other'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Line: Expense / VAT / Memo / Amount */}
          <View style={styles.lineCard}>
            <View style={styles.lineRow}>
              <Text style={[styles.lineLabel, { flex: 1 }]}>Expense*</Text>
              <View style={[styles.dropdownField, { flex: 3 }]}>
                <Picker
                  selectedValue={expenseAccountId}
                  onValueChange={(val) => setExpenseAccountId(val ? String(val) : '')}
                  style={styles.picker}
                  prompt="Select expense account"
                >
                  <Picker.Item label="Select account" value="" />
                  {visibleExpenseAccounts.map((a: any) => (
                    <Picker.Item
                      key={a.id}
                      label={`${a.code} - ${a.name}`}
                      value={String(a.id)}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.lineRow}>
              <Text style={[styles.lineLabel, { flex: 1 }]}>VAT</Text>
              <View style={[styles.dropdownField, { flex: 3 }]}>
                {/* Fixed 16% for now */}
                <View style={styles.vatStaticRow}>
                  <Text style={styles.vatStaticText}>16%</Text>
                </View>
              </View>
            </View>

            <View style={styles.lineRow}>
              <Text style={[styles.lineLabel, { flex: 1 }]}>Memo</Text>
              <TextInput
                style={[styles.textInput, { flex: 3 }]}
                value={lineMemo}
                onChangeText={setLineMemo}
                placeholder="e.g. Rent payment, utilities..."
              />
            </View>

            <View style={styles.lineRow}>
              <Text style={[styles.lineLabel, { flex: 1 }]}>Amount*</Text>
              <TextInput
                style={[styles.textInput, { flex: 3 }]}
                value={lineAmount}
                onChangeText={setLineAmount}
                placeholder="0.00"
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* VAT inclusive toggle */}
          <TouchableOpacity
            style={styles.vatToggleRow}
            onPress={() => setVatInclusive((prev) => !prev)}
            activeOpacity={0.8}
          >
            <View style={[styles.checkbox, vatInclusive && styles.checkboxChecked]}>
              {vatInclusive && <Ionicons name="checkmark" size={16} color="#1e3a8a" />}
            </View>
            <Text style={styles.vatToggleText}>VAT inclusive</Text>
          </TouchableOpacity>

          {/* Totals card */}
          <View style={styles.totalsCard}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Subtotal:</Text>
              <Text style={styles.totalsValue}>
                {subtotal ? subtotal.toLocaleString('en-KE') : '00'}
              </Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>VAT (16%):</Text>
              <Text style={styles.totalsValue}>
                {vatAmount ? vatAmount.toLocaleString('en-KE') : '00'}
              </Text>
            </View>
            <View style={[styles.totalsRow, styles.totalsTotalRow]}>
              <Text style={styles.totalsTotalLabel}>Total:</Text>
              <Text style={styles.totalsTotalValue}>{formatCurrency(total || 0)}</Text>
            </View>
          </View>

          {/* Message to Customer & Memo sections */}
          <View style={styles.textBlock}>
            <Text style={styles.fieldLabel}>Message to Customer</Text>
            <TextInput
              style={styles.multiLineInput}
              placeholder="This appears on the cheque stub / receipt"
              value={messageToCustomer}
              onChangeText={setMessageToCustomer}
              multiline
            />
          </View>

          <View style={styles.textBlock}>
            <Text style={styles.fieldLabel}>Memo</Text>
            <TextInput
              style={styles.multiLineInput}
              placeholder="Internal notes (not visible to payee)"
              value={memo}
              onChangeText={setMemo}
              multiline
            />
          </View>

          {/* Footer buttons */}
          <View style={styles.footerButtonsRow}>
            <TouchableOpacity
              style={styles.footerButtonGrey}
              onPress={handleClear}
              disabled={loading}
            >
              <Text style={styles.footerButtonGreyText}>Clear</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.footerButtonOutline}
              onPress={handleSaveAndNew}
              disabled={loading}
            >
              <Text style={styles.footerButtonOutlineText}>Save &amp; New</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.footerButtonOutline}
              onPress={handlePrintShare}
              disabled={loading}
            >
              <Text style={styles.footerButtonOutlineText}>Print/Share</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.footerButtonPrimary, loading && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.footerButtonPrimaryText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#112b7a' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#112b7a',
  },
  backButton: {
    padding: 4,
    borderRadius: 20,
    backgroundColor: '#0b1b4f',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fbbf24' },
  scroll: { flex: 1, backgroundColor: '#f9fafb' },
  scrollContent: { padding: 16, paddingBottom: 32 },

  topCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  rowTwoCols: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  fieldGroup: { flex: 1 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#111827', marginBottom: 4 },
  dropdownField: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    backgroundColor: '#f9fafb',
    paddingHorizontal: 4,
    justifyContent: 'center',
    minHeight: 44,
  },
  picker: {
    flex: 1,
    color: '#111827',
    fontSize: 14,
    backgroundColor: 'transparent',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#f9fafb',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: '#f9fafb',
    height: 44,
    justifyContent: 'space-between',
  },
  textInputPlain: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    marginRight: 8,
  },

  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#e5e7eb',
    borderRadius: 24,
    padding: 4,
    marginBottom: 12,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#f97316',
  },
  tabButtonText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  tabButtonTextActive: { color: '#ffffff' },

  lineCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  lineLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  vatStaticRow: {
    height: 44,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  vatStaticText: { fontSize: 14, fontWeight: '600', color: '#111827' },

  vatToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#9ca3af',
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  checkboxChecked: {
    borderColor: '#1e3a8a',
    backgroundColor: '#e0ebff',
  },
  vatToggleText: { fontSize: 13, color: '#111827' },

  totalsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 16,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  totalsLabel: { fontSize: 13, color: '#111827', fontWeight: '600' },
  totalsValue: { fontSize: 13, color: '#111827', fontWeight: '500' },
  totalsTotalRow: {
    borderBottomWidth: 0,
    paddingTop: 8,
  },
  totalsTotalLabel: { fontSize: 16, fontWeight: '700', color: '#111827' },
  totalsTotalValue: { fontSize: 16, fontWeight: '700', color: '#1e3a8a' },

  textBlock: { marginBottom: 12 },
  multiLineInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#ffffff',
    minHeight: 70,
    textAlignVertical: 'top',
    marginTop: 4,
  },

  footerButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  footerButtonGrey: {
    height: 46,
    borderRadius: 23,
    backgroundColor: '#e5e7eb',
    borderWidth: 1,
    borderColor: '#9ca3af',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  footerButtonGreyText: { fontSize: 13, fontWeight: '600', color: '#111827' },
  footerButtonOutline: {
    height: 46,
    borderRadius: 23,
    backgroundColor: '#f9fafb',
    borderWidth: 2,
    borderColor: '#f59e0b',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  footerButtonOutlineText: { fontSize: 13, fontWeight: '600', color: '#1e3a8a' },
  footerButtonPrimary: {
    height: 46,
    borderRadius: 23,
    backgroundColor: '#1d4ed8',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  footerButtonPrimaryText: { fontSize: 14, fontWeight: '700', color: '#ffffff' },
});