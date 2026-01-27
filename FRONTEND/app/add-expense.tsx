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
  Modal,
  KeyboardAvoidingView,
  Platform,
  Image,
  StatusBar,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import apiService from '@/services/api';

// Brand Colors
const COLORS = {
  primary: '#122f8a',
  secondary: '#fe9900',
  white: '#ffffff',
  background: '#f8fafc',
  card: '#ffffff',
  text: '#0f172a',
  textLight: '#64748b',
  border: '#e2e8f0',
  success: '#10b981',
  error: '#ef4444',
  blue50: '#eff6ff',
  orange50: '#fff7ed',
};

interface Category {
  id: string | number;
  name: string;
  icon?: string;
  color?: string;
  type: string;
}

interface Account {
  id: string | number;
  name: string;
  code: string;
  type: string;
  balance?: number;
}

interface Member {
  id: string | number;
  name: string;
}

interface SplitLine {
  id: number;
  category: Category | null;
  description: string;
  amount: string;
  member: Member | null;
}

// Smart Category Mappings
const VENDOR_CATEGORY_MAP: { [key: string]: string } = {
  'Safaricom': 'Airtime/Data',
  'Airtel': 'Airtime/Data',
  'Telkom': 'Airtime/Data',
  'Shell': 'Fuel',
  'Total': 'Fuel',
  'Rubis': 'Fuel',
  'KPLC': 'Electricity',
  'Kenya Power': 'Electricity',
  'Nairobi Water': 'Water',
};

export default function SpendMoneyScreen() {
  const router = useRouter();

  // Zone 1: Money Source
  const [account, setAccount] = useState<Account | null>(null);
  const [date] = useState(new Date());
  const [reference, setReference] = useState('');

  // Zone 2: Quick Entry
  const [payee, setPayee] = useState('');
  const [category, setCategory] = useState<Category | null>(null);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [member, setMember] = useState<Member | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [meterNumber, setMeterNumber] = useState('');

  // Payment Method (for Cheque support)
  const [paymentMethod, setPaymentMethod] = useState('Cash/M-PESA');
  const [chequeNumber, setChequeNumber] = useState('');
  const [chequeDate, setChequeDate] = useState(new Date());
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [showChequeDateModal, setShowChequeDateModal] = useState(false);


  // Zone 3: Split Mode
  const [splitMode, setSplitMode] = useState(false);
  const [splitLines, setSplitLines] = useState<SplitLine[]>([
    { id: 1, category: null, description: '', amount: '', member: null }
  ]);

  // Zone 4: Attachments
  const [receipt, setReceipt] = useState<string | null>(null);
  const [showTax, setShowTax] = useState(false);
  const [taxAmount, setTaxAmount] = useState('');

  // Database Data
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [vendors, setVendors] = useState<string[]>([]);

  // UI State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [activeSplitLine, setActiveSplitLine] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cats, accs, dashboard] = await Promise.all([
        apiService.getCategories(),
        apiService.getPaymentEligibleAccounts(),
        apiService.getDashboard(),
      ]);

      const expenseCats = cats.filter((c: any) => c.type?.toLowerCase() === 'expense');
      setCategories(expenseCats);
      setAccounts(accs);

      if (dashboard?.familyMembers) {
        setMembers(dashboard.familyMembers);
      }

      // Auto-select M-PESA or first cash account
      const mpesa = accs.find((a: any) => a.name?.toLowerCase().includes('mpesa') || a.name?.toLowerCase().includes('m-pesa'));
      const cash = accs.find((a: any) => a.code === '1000' || a.name?.toLowerCase().includes('cash'));
      setAccount(mpesa || cash || accs[0]);

      // Load common vendors (you can enhance this with an API call)
      setVendors(['Safaricom', 'Airtel', 'Shell', 'Total', 'Rubis', 'KPLC', 'Kenya Power', 'Naivas', 'Carrefour']);
    } catch (error) {
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Smart Auto-Fill when Payee changes
  const handlePayeeChange = (text: string) => {
    setPayee(text);

    // Auto-fill category based on vendor
    const matchedCategory = VENDOR_CATEGORY_MAP[text];
    if (matchedCategory) {
      const cat = categories.find(c => c.name.toLowerCase().includes(matchedCategory.toLowerCase()));
      if (cat) {
        setCategory(cat);

        // Auto-fill description
        if (matchedCategory === 'Airtime/Data') {
          setDescription('Prepaid bundle');
        } else if (matchedCategory === 'Fuel') {
          setDescription('Fuel purchase');
        } else if (matchedCategory === 'Electricity') {
          setDescription('Electricity tokens');
        }
      }
    }
  };

  // Dynamic reference label based on account
  const getReferenceLabel = () => {
    if (account?.name?.toLowerCase().includes('mpesa') || account?.name?.toLowerCase().includes('m-pesa')) {
      return 'M-PESA Code *';
    }
    return 'Reference / Receipt #';
  };

  // Show special fields based on category
  const shouldShowPhoneNumber = () => {
    return category?.name?.toLowerCase().includes('airtime') ||
      category?.name?.toLowerCase().includes('data');
  };

  const shouldShowMeterNumber = () => {
    return category?.name?.toLowerCase().includes('electricity') ||
      category?.name?.toLowerCase().includes('power');
  };

  const addSplitLine = () => {
    setSplitLines([...splitLines, {
      id: Date.now(),
      category: null,
      description: '',
      amount: '',
      member: null
    }]);
  };

  const removeSplitLine = (id: number) => {
    if (splitLines.length > 1) {
      setSplitLines(splitLines.filter(l => l.id !== id));
    }
  };

  const updateSplitLine = (id: number, field: keyof SplitLine, value: any) => {
    setSplitLines(splitLines.map(line =>
      line.id === id ? { ...line, [field]: value } : line
    ));
  };

  const getSplitTotal = () => {
    return splitLines.reduce((sum, line) => sum + (parseFloat(line.amount) || 0), 0);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
    });

    if (!result.canceled) {
      setReceipt(result.assets[0].uri);
    }
  };

  const save = async () => {
    // Validation
    if (!account) {
      Alert.alert('Required', 'Select payment account');
      return;
    }

    if (!splitMode) {
      // Simple mode validation
      if (!amount || parseFloat(amount) <= 0) {
        Alert.alert('Invalid Amount', 'Enter expense amount');
        return;
      }
      if (!category) {
        Alert.alert('Required', 'Select category');
        return;
      }
      if (!payee.trim()) {
        Alert.alert('Required', 'Enter payee name');
        return;
      }
      if (account.name?.toLowerCase().includes('mpesa') && !reference.trim()) {
        Alert.alert('Required', 'Enter M-PESA code');
        return;
      }
      // Cheque validation
      if (paymentMethod === 'Cheque' && !chequeNumber.trim()) {
        Alert.alert('Required', 'Enter cheque number');
        return;
      }
    } else {
      // Split mode validation
      const invalidLine = splitLines.find(l => !l.category || !l.amount || parseFloat(l.amount) <= 0);
      if (invalidLine) {
        Alert.alert('Invalid Split', 'All lines must have category and amount');
        return;
      }
    }

    try {
      setSaving(true);

      // If Payment Method is Cheque, Create Cheque Record First
      if (paymentMethod === 'Cheque') {
        const currentUser = await apiService.getCurrentUser();
        if (currentUser.tenantId) {
          const accountInfo = accounts.find(a => a.id === account.id);
          const accountNumber = accountInfo?.code?.slice(-4) || '****';

          await apiService.createCheque({
            tenantId: currentUser.tenantId,
            chequeNumber: chequeNumber,
            payee: payee || 'Multiple Items',
            amount: splitMode ? getSplitTotal() : parseFloat(amount),
            dueDate: chequeDate.toISOString(),
            bankAccountId: typeof account.id === 'string' ? parseInt(account.id) : account.id,
            accountNumber: accountNumber,
            purpose: description || (splitMode ? 'Split Expense' : (category?.name || 'Expense')),
            notes: `Expense transaction via cheque. Ref: ${reference}`,
            reference: reference || chequeNumber,
          });
        }
      }

      if (!splitMode) {
        // Simple transaction
        const finalAmount = showTax && taxAmount ?
          parseFloat(amount) + parseFloat(taxAmount) :
          parseFloat(amount);

        await apiService.createTransaction({
          type: 'EXPENSE',
          amount: finalAmount,
          category: category!.name,
          description: description.trim() || `${category!.name} - ${payee}`,
          payee: payee.trim(),
          paymentMethod: paymentMethod,
          date: date.toISOString(),
          notes: [
            reference.trim(),
            `Payment: ${paymentMethod}`,
            paymentMethod === 'Cheque' ? `Cheque #${chequeNumber}` : '',
            paymentMethod === 'Cheque' ? `Cheque Date: ${chequeDate.toLocaleDateString()}` : '',
            paymentMethod === 'Cheque' ? 'Status: Pending' : '',
            phoneNumber ? `Phone: ${phoneNumber}` : '',
            meterNumber ? `Meter: ${meterNumber}` : '',
            member ? `For: ${member.name}` : '',
          ].filter(Boolean).join(' | '),
          creditAccountId: typeof account.id === 'string' ? parseInt(account.id) : account.id,
        });
      } else {
        // Split transaction
        const totalAmount = getSplitTotal();

        await apiService.createTransaction({
          type: 'EXPENSE',
          amount: totalAmount,
          category: 'Multiple Categories',
          description: `Split expense - ${payee || 'Multiple items'}`,
          payee: payee.trim() || 'Multiple',
          paymentMethod: account.name,
          date: date.toISOString(),
          notes: reference.trim(),
          creditAccountId: typeof account.id === 'string' ? parseInt(account.id) : account.id,
          splits: splitLines.map(line => ({
            category: line.category!.name,
            description: `${line.description || line.category!.name}${line.member ? ` (For: ${line.member.name})` : ''}`,
            amount: parseFloat(line.amount),
          })),
        });
      }

      Alert.alert(
        '✅ Money Spent!',
        `KES ${splitMode ? getSplitTotal().toFixed(2) : parseFloat(amount).toFixed(2)} recorded`,
        [
          {
            text: 'Save & New',
            onPress: () => {
              resetForm();
            }
          },
          {
            text: 'Save & Close',
            onPress: () => router.back(),
            style: 'cancel'
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setPayee('');
    setCategory(null);
    setDescription('');
    setAmount('');
    setMember(null);
    setPhoneNumber('');
    setMeterNumber('');
    setReference('');
    setReceipt(null);
    setTaxAmount('');
    setSplitMode(false);
    setSplitLines([{ id: 1, category: null, description: '', amount: '', member: null }]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient colors={[COLORS.primary, '#0a1f5c']} style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={COLORS.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Spend Money</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Zone 1: Money Source */}
          <View style={styles.moneySource}>
            <Text style={styles.zoneLabel}>MONEY LEAVING FROM</Text>
            <TouchableOpacity
              style={styles.accountCard}
              onPress={() => setShowAccountModal(true)}
            >
              {account ? (
                <>
                  <View style={styles.accountLeft}>
                    <Ionicons
                      name={account.name?.toLowerCase().includes('mpesa') ? 'phone-portrait' : 'wallet'}
                      size={24}
                      color={COLORS.secondary}
                    />
                    <View style={styles.accountDetails}>
                      <Text style={styles.accountName}>{account.name}</Text>
                      {account.balance !== undefined && (
                        <Text style={styles.accountBalance}>
                          Bal: KES {account.balance.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                        </Text>
                      )}
                    </View>
                  </View>
                  <Ionicons name="chevron-down" size={20} color="rgba(255,255,255,0.7)" />
                </>
              ) : (
                <Text style={styles.accountPlaceholder}>Select Account</Text>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Form Content */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.content}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Date & Reference */}
          <View style={styles.row}>
            <View style={[styles.field, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>DATE</Text>
              <View style={styles.input}>
                <Ionicons name="calendar" size={18} color={COLORS.textLight} />
                <Text style={styles.dateText}>
                  {date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
              </View>
            </View>
            <View style={[styles.field, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>{getReferenceLabel()}</Text>
              <View style={styles.input}>
                <TextInput
                  style={styles.inputText}
                  placeholder="QDH45..."
                  value={reference}
                  onChangeText={setReference}
                  placeholderTextColor={COLORS.textLight}
                />
              </View>
            </View>
          </View>

          {/* Payment Method Row */}
          <View style={styles.field}>
            <Text style={styles.label}>PAYMENT METHOD</Text>
            <TouchableOpacity
              style={styles.selector}
              onPress={() => setShowPaymentMethodModal(true)}
            >
              <Ionicons
                name={
                  paymentMethod === 'Cheque' ? 'document-text-outline' :
                    paymentMethod.includes('M-PESA') ? 'phone-portrait-outline' :
                      paymentMethod === 'Bank Transfer' ? 'card-outline' : 'cash-outline'
                }
                size={24}
                color={COLORS.textLight}
              />
              <Text style={styles.selectorText}>{paymentMethod}</Text>
              <Ionicons name="chevron-down" size={20} color={COLORS.textLight} />
            </TouchableOpacity>
          </View>

          {/* Conditional Cheque Fields */}
          {paymentMethod === 'Cheque' && (
            <View style={styles.card}>
              <Text style={[styles.zoneLabel, { marginBottom: 10 }]}>CHEQUE DETAILS</Text>
              <View style={styles.row}>
                <View style={[styles.field, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>CHEQUE NUMBER *</Text>
                  <View style={styles.input}>
                    <Ionicons name="document-text-outline" size={20} color={COLORS.textLight} />
                    <TextInput
                      style={styles.inputText}
                      placeholder="000123"
                      value={chequeNumber}
                      onChangeText={setChequeNumber}
                      placeholderTextColor={COLORS.textLight}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
                <View style={[styles.field, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.label}>CHEQUE DATE (POST-DATED)</Text>
                  <TouchableOpacity
                    style={styles.input}
                    onPress={() => setShowChequeDateModal(true)}
                  >
                    <Ionicons name="calendar-outline" size={20} color={COLORS.textLight} />
                    <Text style={styles.dateText}>
                      {chequeDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={styles.hintText}>💡 Cheques will typically be cleared later.</Text>
            </View>
          )}

          {/* Zone 3: Split Toggle */}
          <View style={styles.splitToggle}>
            <View style={styles.splitToggleLeft}>
              <Ionicons name="git-branch-outline" size={20} color={COLORS.text} />
              <Text style={styles.splitToggleText}>Split into multiple items?</Text>
            </View>
            <Switch
              value={splitMode}
              onValueChange={setSplitMode}
              trackColor={{ false: COLORS.border, true: COLORS.secondary }}
              thumbColor={COLORS.white}
            />
          </View>

          {!splitMode ? (
            /* Zone 2: Quick Entry Mode */
            <>
              {/* Payee - Searchable */}
              <View style={styles.field}>
                <Text style={styles.label}>PAID TO *</Text>
                <View style={styles.input}>
                  <Ionicons name="business-outline" size={20} color={COLORS.textLight} />
                  <TextInput
                    style={styles.inputText}
                    placeholder="Type vendor name (e.g., Safaricom, Shell)"
                    value={payee}
                    onChangeText={handlePayeeChange}
                    placeholderTextColor={COLORS.textLight}
                  />
                </View>
                {/* Quick vendor suggestions */}
                {payee.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestions}>
                    {vendors
                      .filter(v => v.toLowerCase().includes(payee.toLowerCase()))
                      .slice(0, 5)
                      .map(vendor => (
                        <TouchableOpacity
                          key={vendor}
                          style={styles.suggestionChip}
                          onPress={() => handlePayeeChange(vendor)}
                        >
                          <Text style={styles.suggestionText}>{vendor}</Text>
                        </TouchableOpacity>
                      ))}
                  </ScrollView>
                )}
              </View>

              {/* Category */}
              <View style={styles.field}>
                <Text style={styles.label}>EXPENSE CATEGORY *</Text>
                <TouchableOpacity
                  style={[styles.selector, !category && styles.selectorEmpty]}
                  onPress={() => setShowCategoryModal(true)}
                >
                  {category ? (
                    <>
                      <View style={styles.categoryIcon}>
                        <Text style={styles.iconText}>{category.icon || '💰'}</Text>
                      </View>
                      <Text style={styles.selectorText}>{category.name}</Text>
                      <Ionicons name="chevron-down" size={20} color={COLORS.textLight} />
                    </>
                  ) : (
                    <>
                      <Ionicons name="grid-outline" size={24} color={COLORS.textLight} />
                      <Text style={styles.placeholderText}>Select Category</Text>
                      <Ionicons name="chevron-down" size={20} color={COLORS.textLight} />
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {/* Amount */}
              <View style={styles.field}>
                <Text style={styles.label}>AMOUNT *</Text>
                <View style={styles.amountInput}>
                  <Text style={styles.amountCurrency}>KES</Text>
                  <TextInput
                    style={styles.amountText}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    value={amount}
                    onChangeText={setAmount}
                    placeholderTextColor={COLORS.textLight}
                  />
                </View>
              </View>

              {/* Description */}
              <View style={styles.field}>
                <Text style={styles.label}>DESCRIPTION</Text>
                <View style={styles.input}>
                  <TextInput
                    style={styles.inputText}
                    placeholder="Details"
                    value={description}
                    onChangeText={setDescription}
                    placeholderTextColor={COLORS.textLight}
                  />
                </View>
              </View>

              {/* Member (Beneficiary) */}
              <View style={styles.field}>
                <Text style={styles.label}>FOR FAMILY MEMBER (Optional)</Text>
                <TouchableOpacity
                  style={styles.selector}
                  onPress={() => setShowMemberModal(true)}
                >
                  {member ? (
                    <>
                      <View style={styles.memberIcon}>
                        <Text style={styles.memberInitial}>{member.name[0]}</Text>
                      </View>
                      <Text style={styles.selectorText}>{member.name}</Text>
                      <TouchableOpacity onPress={() => setMember(null)}>
                        <Ionicons name="close-circle" size={20} color={COLORS.textLight} />
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      <Ionicons name="person-outline" size={24} color={COLORS.textLight} />
                      <Text style={styles.placeholderText}>Who is this for?</Text>
                      <Ionicons name="chevron-down" size={20} color={COLORS.textLight} />
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {/* Smart Fields - Phone Number for Airtime */}
              {shouldShowPhoneNumber() && (
                <View style={styles.field}>
                  <Text style={styles.label}>PHONE NUMBER</Text>
                  <View style={styles.input}>
                    <Ionicons name="call-outline" size={20} color={COLORS.textLight} />
                    <TextInput
                      style={styles.inputText}
                      placeholder="0712345678"
                      keyboardType="phone-pad"
                      value={phoneNumber}
                      onChangeText={setPhoneNumber}
                      placeholderTextColor={COLORS.textLight}
                    />
                  </View>
                </View>
              )}

              {/* Smart Fields - Meter Number for Electricity */}
              {shouldShowMeterNumber() && (
                <View style={styles.field}>
                  <Text style={styles.label}>METER NUMBER</Text>
                  <View style={styles.input}>
                    <Ionicons name="flash-outline" size={20} color={COLORS.textLight} />
                    <TextInput
                      style={styles.inputText}
                      placeholder="12345678"
                      value={meterNumber}
                      onChangeText={setMeterNumber}
                      placeholderTextColor={COLORS.textLight}
                    />
                  </View>
                </View>
              )}
            </>
          ) : (
            /* Split Mode - Grid */
            <View style={styles.splitContainer}>
              <Text style={styles.splitTitle}>Split Items</Text>
              {splitLines.map((line, index) => (
                <View key={line.id} style={styles.splitLine}>
                  <View style={styles.splitLineHeader}>
                    <Text style={styles.splitLineNumber}>#{index + 1}</Text>
                    {splitLines.length > 1 && (
                      <TouchableOpacity onPress={() => removeSplitLine(line.id)}>
                        <Ionicons name="trash-outline" size={20} color={COLORS.error} />
                      </TouchableOpacity>
                    )}
                  </View>

                  <TouchableOpacity
                    style={[styles.splitSelector, !line.category && styles.selectorEmpty]}
                    onPress={() => {
                      setActiveSplitLine(line.id);
                      setShowCategoryModal(true);
                    }}
                  >
                    {line.category ? (
                      <>
                        <Text style={styles.iconText}>{line.category.icon || '💰'}</Text>
                        <Text style={styles.selectorText}>{line.category.name}</Text>
                      </>
                    ) : (
                      <Text style={styles.placeholderText}>Category</Text>
                    )}
                  </TouchableOpacity>

                  <View style={styles.splitRow}>
                    <View style={[styles.input, { flex: 2, marginRight: 8 }]}>
                      <TextInput
                        style={styles.inputText}
                        placeholder="Description"
                        value={line.description}
                        onChangeText={(text) => updateSplitLine(line.id, 'description', text)}
                        placeholderTextColor={COLORS.textLight}
                      />
                    </View>
                    <View style={[styles.input, { flex: 1 }]}>
                      <TextInput
                        style={styles.inputText}
                        placeholder="0.00"
                        keyboardType="decimal-pad"
                        value={line.amount}
                        onChangeText={(text) => updateSplitLine(line.id, 'amount', text)}
                        placeholderTextColor={COLORS.textLight}
                      />
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.splitSelector}
                    onPress={() => {
                      setActiveSplitLine(line.id);
                      setShowMemberModal(true);
                    }}
                  >
                    {line.member ? (
                      <>
                        <View style={styles.memberIconSmall}>
                          <Text style={styles.memberInitialSmall}>{line.member.name[0]}</Text>
                        </View>
                        <Text style={styles.selectorTextSmall}>{line.member.name}</Text>
                      </>
                    ) : (
                      <Text style={styles.placeholderTextSmall}>For member (optional)</Text>
                    )}
                  </TouchableOpacity>
                </View>
              ))}

              <TouchableOpacity style={styles.addLineBtn} onPress={addSplitLine}>
                <Ionicons name="add-circle" size={24} color={COLORS.primary} />
                <Text style={styles.addLineText}>Add Line</Text>
              </TouchableOpacity>

              <View style={styles.splitTotal}>
                <Text style={styles.splitTotalLabel}>Total:</Text>
                <Text style={styles.splitTotalAmount}>
                  KES {getSplitTotal().toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                </Text>
              </View>
            </View>
          )}

          {/* Payment Method */}
          <View style={styles.field}>
            <Text style={styles.label}>PAYMENT METHOD</Text>
            <TouchableOpacity
              style={styles.selector}
              onPress={() => setShowPaymentMethodModal(true)}
            >
              <Ionicons
                name={paymentMethod === 'Cheque' ? 'card-outline' : 'cash-outline'}
                size={24}
                color={COLORS.textLight}
              />
              <Text style={styles.selectorText}>{paymentMethod}</Text>
              <Ionicons name="chevron-down" size={20} color={COLORS.textLight} />
            </TouchableOpacity>
          </View>

          {/* Cheque Fields (shown only when Cheque is selected) */}
          {paymentMethod === 'Cheque' && (
            <>
              <View style={styles.field}>
                <Text style={styles.label}>CHEQUE NUMBER *</Text>
                <View style={styles.input}>
                  <Ionicons name="card-outline" size={20} color={COLORS.textLight} />
                  <TextInput
                    style={styles.inputText}
                    placeholder="e.g., 001234"
                    value={chequeNumber}
                    onChangeText={setChequeNumber}
                    placeholderTextColor={COLORS.textLight}
                  />
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>CHEQUE DATE (Post-Dated)</Text>
                <View style={styles.input}>
                  <Ionicons name="calendar" size={18} color={COLORS.textLight} />
                  <Text style={styles.dateText}>
                    {chequeDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </Text>
                </View>
                <Text style={styles.helperText}>
                  💡 Post-dated cheques won't deduct from your balance until cleared
                </Text>
              </View>
            </>
          )}

          {/* Tax Toggle */}
          <TouchableOpacity
            style={styles.taxToggle}
            onPress={() => setShowTax(!showTax)}
          >
            <Ionicons name="receipt-outline" size={20} color={COLORS.textLight} />
            <Text style={styles.taxToggleText}>Add VAT/Tax</Text>
            <Ionicons
              name={showTax ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={COLORS.textLight}
            />
          </TouchableOpacity>

          {showTax && !splitMode && (
            <View style={styles.field}>
              <Text style={styles.label}>TAX AMOUNT</Text>
              <View style={styles.input}>
                <Text style={styles.taxCurrency}>KES</Text>
                <TextInput
                  style={styles.inputText}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  value={taxAmount}
                  onChangeText={setTaxAmount}
                  placeholderTextColor={COLORS.textLight}
                />
              </View>
            </View>
          )}

          {/* Receipt Photo */}
          <View style={styles.field}>
            <Text style={styles.label}>RECEIPT PHOTO (Optional)</Text>
            <TouchableOpacity style={styles.photoBox} onPress={pickImage}>
              {receipt ? (
                <View style={styles.photoPreview}>
                  <Image source={{ uri: receipt }} style={styles.photoImage} />
                  <TouchableOpacity
                    style={styles.photoRemove}
                    onPress={() => setReceipt(null)}
                  >
                    <Ionicons name="close-circle" size={28} color={COLORS.error} />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.photoEmpty}>
                  <Ionicons name="camera" size={32} color={COLORS.secondary} />
                  <Text style={styles.photoText}>Snap receipt</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Zone 4: Action Buttons */}
      <View style={styles.footer}>
        <View style={styles.footerButtons}>
          <TouchableOpacity
            style={[styles.saveBtn, styles.saveBtnSecondary, saving && styles.saveBtnDisabled]}
            onPress={save}
            disabled={saving}
          >
            <Text style={styles.saveBtnTextSecondary}>SAVE & NEW</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveBtn, styles.saveBtnPrimary, saving && styles.saveBtnDisabled]}
            onPress={save}
            disabled={saving}
          >
            <LinearGradient
              colors={[COLORS.secondary, '#ff8800']}
              style={styles.saveBtnGradient}
            >
              {saving ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={22} color={COLORS.white} />
                  <Text style={styles.saveBtnText}>SAVE & CLOSE</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Account Modal */}
      <Modal visible={showAccountModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Account</Text>
              <TouchableOpacity onPress={() => setShowAccountModal(false)}>
                <Ionicons name="close" size={28} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {accounts.map((acc) => (
                <TouchableOpacity
                  key={acc.id}
                  style={[
                    styles.modalItem,
                    account?.id === acc.id && styles.modalItemActive
                  ]}
                  onPress={() => {
                    setAccount(acc);
                    setShowAccountModal(false);
                  }}
                >
                  <View style={styles.accountIconModal}>
                    <Ionicons
                      name={acc.name?.toLowerCase().includes('mpesa') ? 'phone-portrait' : 'wallet'}
                      size={20}
                      color={COLORS.primary}
                    />
                  </View>
                  <View style={styles.accountDetailsModal}>
                    <Text style={styles.modalItemText}>{acc.name}</Text>
                    <Text style={styles.accountCodeModal}>{acc.code}</Text>
                    {acc.balance !== undefined && (
                      <Text style={styles.accountBalanceModal}>
                        Balance: KES {acc.balance.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                      </Text>
                    )}
                  </View>
                  {account?.id === acc.id && (
                    <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Category Modal */}
      <Modal visible={showCategoryModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <TouchableOpacity onPress={() => {
                setShowCategoryModal(false);
                setActiveSplitLine(null);
              }}>
                <Ionicons name="close" size={28} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.modalItem,
                    (activeSplitLine
                      ? splitLines.find(l => l.id === activeSplitLine)?.category?.id === cat.id
                      : category?.id === cat.id
                    ) && styles.modalItemActive
                  ]}
                  onPress={() => {
                    if (activeSplitLine) {
                      updateSplitLine(activeSplitLine, 'category', cat);
                    } else {
                      setCategory(cat);
                    }
                    setShowCategoryModal(false);
                    setActiveSplitLine(null);
                  }}
                >
                  <Text style={styles.modalIcon}>{cat.icon || '💰'}</Text>
                  <Text style={styles.modalItemText}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Member Modal */}
      <Modal visible={showMemberModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Member</Text>
              <TouchableOpacity onPress={() => {
                setShowMemberModal(false);
                setActiveSplitLine(null);
              }}>
                <Ionicons name="close" size={28} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {members.map((mem) => (
                <TouchableOpacity
                  key={mem.id}
                  style={styles.modalItem}
                  onPress={() => {
                    if (activeSplitLine) {
                      updateSplitLine(activeSplitLine, 'member', mem);
                    } else {
                      setMember(mem);
                    }
                    setShowMemberModal(false);
                    setActiveSplitLine(null);
                  }}
                >
                  <View style={styles.memberIconModal}>
                    <Text style={styles.memberInitialModal}>{mem.name[0]}</Text>
                  </View>
                  <Text style={styles.modalItemText}>{mem.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Payment Method Modal */}
      <Modal visible={showPaymentMethodModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Payment Method</Text>
              <TouchableOpacity onPress={() => setShowPaymentMethodModal(false)}>
                <Ionicons name="close" size={28} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalScroll}>
              {['Cash/M-PESA', 'Bank Transfer', 'Cheque'].map((method) => (
                <TouchableOpacity
                  key={method}
                  style={[
                    styles.modalItem,
                    paymentMethod === method && styles.modalItemActive
                  ]}
                  onPress={() => {
                    setPaymentMethod(method);
                    setShowPaymentMethodModal(false);
                  }}
                >
                  <Ionicons
                    name={
                      method === 'Cheque' ? 'card-outline' :
                        method === 'Bank Transfer' ? 'business-outline' :
                          'cash-outline'
                    }
                    size={24}
                    color={COLORS.primary}
                  />
                  <Text style={styles.modalItemText}>{method}</Text>
                  {paymentMethod === method && (
                    <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Cheque Date Picker */}
      <CustomDatePicker
        visible={showChequeDateModal}
        onClose={() => setShowChequeDateModal(false)}
        date={chequeDate}
        onChange={setChequeDate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textLight,
  },
  header: {
    paddingBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
  },
  moneySource: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  zoneLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1,
    marginBottom: 8,
  },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  accountLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  accountDetails: {
    marginLeft: 12,
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  accountBalance: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.secondary,
    marginTop: 2,
  },
  accountPlaceholder: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.5)',
  },
  content: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    borderWidth: 2,
    borderColor: COLORS.border,
    gap: 10,
  },
  inputText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '500',
  },
  dateText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '500',
  },
  splitToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.orange50,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: COLORS.secondary,
  },
  splitToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  splitToggleText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  suggestions: {
    marginTop: 8,
  },
  suggestionChip: {
    backgroundColor: COLORS.blue50,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  suggestionText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  selectorEmpty: {
    borderStyle: 'dashed',
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.orange50,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 22,
  },
  selectorText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  placeholderText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textLight,
    marginLeft: 10,
  },
  amountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  amountCurrency: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textLight,
    marginRight: 8,
  },
  amountText: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
  },
  memberIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.blue50,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  memberInitial: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  splitContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  splitTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },
  splitLine: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  splitLineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  splitLineNumber: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textLight,
  },
  splitSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  splitRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  selectorTextSmall: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  placeholderTextSmall: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textLight,
  },
  memberIconSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.blue50,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  memberInitialSmall: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  addLineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: COLORS.blue50,
    gap: 8,
  },
  addLineText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
  },
  splitTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: COLORS.border,
  },
  splitTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  splitTotalAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
  },
  taxToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    gap: 10,
  },
  taxToggleText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  taxCurrency: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textLight,
    marginRight: 8,
  },
  photoBox: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  photoEmpty: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoText: {
    marginTop: 8,
    fontSize: 14,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  photoPreview: {
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  photoRemove: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: COLORS.white,
    borderRadius: 14,
  },
  footer: {
    padding: 16,
    paddingBottom: 28,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  saveBtn: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  saveBtnSecondary: {
    backgroundColor: COLORS.background,
    borderWidth: 2,
    borderColor: COLORS.primary,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnPrimary: {
    flex: 1,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  saveBtnTextSecondary: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  modalScroll: {
    padding: 16,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: COLORS.background,
  },
  modalItemActive: {
    backgroundColor: COLORS.blue50,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  modalIcon: {
    fontSize: 24,
    marginRight: 14,
  },
  modalItemText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  accountIconModal: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.blue50,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  accountDetailsModal: {
    flex: 1,
  },
  accountCodeModal: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
  },
  accountBalanceModal: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.success,
    marginTop: 4,
  },
  memberIconModal: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.blue50,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  memberInitialModal: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  helperText: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 8,
    fontStyle: 'italic',
  },
  card: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  hintText: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 8,
    fontStyle: 'italic',
  },
});

// Simple JS Date Picker Component
const CustomDatePicker = ({ visible, onClose, date, onChange }: any) => {
  const [tempDate, setTempDate] = useState(date || new Date());
  const daysInMonth = new Date(tempDate.getFullYear(), tempDate.getMonth() + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={[styles.modal, { maxHeight: 'auto', paddingBottom: 20 }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Date</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color={COLORS.text} /></TouchableOpacity>
          </View>
          <View style={{ padding: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 15 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.text }}>{months[tempDate.getMonth()]} {tempDate.getFullYear()}</Text>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
              {days.map(day => (
                <TouchableOpacity key={day} style={{ width: 36, height: 36, justifyContent: 'center', alignItems: 'center', borderRadius: 18, backgroundColor: tempDate.getDate() === day ? COLORS.primary : COLORS.background }} onPress={() => { const newDate = new Date(tempDate); newDate.setDate(day); setTempDate(newDate); }}>
                  <Text style={{ color: tempDate.getDate() === day ? '#fff' : COLORS.text, fontSize: 13 }}>{day}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={{ backgroundColor: COLORS.primary, marginTop: 20, padding: 12, borderRadius: 8, alignItems: 'center' }} onPress={() => { onChange(tempDate); onClose(); }}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Confirm Date</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
