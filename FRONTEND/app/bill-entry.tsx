import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView,
    TextInput, Platform, Alert, ActivityIndicator, Modal, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import apiService from '@/services/api';

type Account = { id: string | number; name: string; code?: string;[key: string]: any; };

type ExpenseType = 'Expense' | 'Stock Purchase' | 'Other';
type TaxTreatment = 'Exclusive of Tax' | 'Inclusive of Tax' | 'Out of Scope of Tax';

type LineItem = {
    id: string;
    categoryId: string | null;
    description: string;
    taxTreatment: TaxTreatment;
    vatRateId: string | null;
    memo: string;
    amount: string;
};

export default function BillScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [expenseAccounts, setExpenseAccounts] = useState<Account[]>([]);
    const [inventoryAccounts, setInventoryAccounts] = useState<Account[]>([]);
    const [otherAssetAccounts, setOtherAssetAccounts] = useState<Account[]>([]);
    const [paymentAccounts, setPaymentAccounts] = useState<Account[]>([]);
    const [vatRates, setVatRates] = useState<any[]>([]);

    const [isDebitNote, setIsDebitNote] = useState(false);
    const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(null);
    const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
    const [refNo, setRefNo] = useState('');
    const [date, setDate] = useState(new Date());
    const [dueDate, setDueDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
    const [expenseType, setExpenseType] = useState<ExpenseType>('Expense');

    const [lineItems, setLineItems] = useState<LineItem[]>([
        { id: '1', categoryId: null, description: '', taxTreatment: 'Exclusive of Tax', vatRateId: null, memo: '', amount: '' }
    ]);

    const [showSupplierModal, setShowSupplierModal] = useState(false);
    const [showAccountModal, setShowAccountModal] = useState(false);
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [showTaxTreatmentModal, setShowTaxTreatmentModal] = useState(false);
    const [showVatRateModal, setShowVatRateModal] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showDueDatePicker, setShowDueDatePicker] = useState(false);
    const [editingLineIndex, setEditingLineIndex] = useState<number>(0);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [vendorsData, expenseData, assetData, vatRatesData] = await Promise.all([
                apiService.getVendors({ active: true }),
                apiService.getAccounts({ type: 'EXPENSE' }),
                apiService.getAccounts({ type: 'ASSET' }),
                apiService.getVatRates()
            ]);

            // Filter inventory accounts from asset accounts
            const inventoryData = assetData.filter(a =>
                a.name?.toLowerCase().includes('inventory') ||
                a.name?.toLowerCase().includes('stock') ||
                a.code?.startsWith('12') || // 1200-1299 range for inventory
                a.name?.toLowerCase().includes('raw material') ||
                a.name?.toLowerCase().includes('work in progress') ||
                a.name?.toLowerCase().includes('finished goods')
            );

            // Filter other asset accounts (Fixed Assets, Prepaid, etc.) - exclude inventory and payables
            const otherAssetData = assetData.filter(a =>
                !a.name?.toLowerCase().includes('inventory') &&
                !a.name?.toLowerCase().includes('stock') &&
                !a.code?.startsWith('12') &&
                !a.name?.includes('Payable') &&
                !a.code?.includes('2100') &&
                (a.code?.startsWith('13') ||  // Fixed Assets (1300-1399)
                    a.code?.startsWith('14') ||  // Long-term Assets (1400+)
                    a.code?.startsWith('15') ||
                    a.name?.toLowerCase().includes('equipment') ||
                    a.name?.toLowerCase().includes('vehicle') ||
                    a.name?.toLowerCase().includes('building') ||
                    a.name?.toLowerCase().includes('furniture') ||
                    a.name?.toLowerCase().includes('prepaid') ||
                    a.name?.toLowerCase().includes('deposit') ||
                    a.name?.toLowerCase().includes('asset'))
            );

            console.log('✅ Vendors fetched:', vendorsData.length, 'suppliers');
            console.log('💰 EXPENSE Accounts fetched:', expenseData.length, 'accounts');
            console.log('📦 INVENTORY Accounts fetched:', inventoryData.length, 'accounts');
            console.log('� OTHER ASSET Accounts fetched:', otherAssetData.length, 'accounts');
            console.log('�🏷️ VAT Rates fetched:', vatRatesData.length, 'rates');

            setSuppliers(vendorsData);
            setExpenseAccounts(expenseData);
            setInventoryAccounts(inventoryData);
            setOtherAssetAccounts(otherAssetData);
            setPaymentAccounts(assetData.filter(a => a.name?.includes('Payable') || a.code?.includes('2100')));
            setVatRates(vatRatesData);

            if (expenseData.length > 0) {
                setLineItems(prev => prev.map((item, idx) =>
                    idx === 0 ? { ...item, categoryId: String(expenseData[0].id) } : item
                ));
            }

            if (assetData.length > 0) {
                const apAccount = assetData.find(a => a.name?.includes('Payable'));
                if (apAccount) setSelectedAccountId(String(apAccount.id));
            }
        } catch (error) {
            console.error('Error loading data:', error);
            Alert.alert('Error', 'Failed to load data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const addLineItem = () => {
        setLineItems(prev => [...prev, {
            id: Date.now().toString(),
            categoryId: expenseAccounts.length > 0 ? String(expenseAccounts[0].id) : null,
            description: '',
            taxTreatment: 'Exclusive of Tax',
            vatRateId: null,
            memo: '',
            amount: ''
        }]);
    };

    const removeLineItem = (index: number) => {
        if (lineItems.length > 1) {
            setLineItems(prev => prev.filter((_, i) => i !== index));
        }
    };

    const updateLineItem = (index: number, field: keyof LineItem, value: any) => {
        setLineItems(prev => prev.map((item, i) =>
            i === index ? { ...item, [field]: value } : item
        ));
    };

    // Calculate VAT and totals based on line items
    const calculateTotals = () => {
        let subtotal = 0;
        let totalVat = 0;

        lineItems.forEach(item => {
            const amount = parseFloat(item.amount) || 0;

            if (item.taxTreatment === 'Out of Scope of Tax') {
                // No VAT
                subtotal += amount;
            } else {
                // Get VAT rate
                const vatRate = item.vatRateId
                    ? vatRates.find(v => String(v.id) === item.vatRateId)
                    : null;
                const rate = vatRate ? parseFloat(vatRate.rate) : 0;

                if (item.taxTreatment === 'Inclusive of Tax') {
                    // Amount includes VAT - extract it
                    const baseAmount = amount / (1 + rate / 100);
                    const vat = amount - baseAmount;
                    subtotal += baseAmount;
                    totalVat += vat;
                } else if (item.taxTreatment === 'Exclusive of Tax') {
                    // Amount excludes VAT - add it
                    const vat = amount * (rate / 100);
                    subtotal += amount;
                    totalVat += vat;
                }
            }
        });

        const total = subtotal + totalVat;
        return { subtotal, vatAmount: totalVat, total };
    };

    const { subtotal, vatAmount, total } = calculateTotals();


    const handleSave = async () => {
        if (!selectedSupplierId || lineItems.length === 0 || !lineItems[0].amount) {
            Alert.alert('Required', 'Please fill supplier and at least one line item');
            return;
        }

        setLoading(true);
        try {
            const items = lineItems
                .filter(item => item.amount && parseFloat(item.amount) > 0)
                .map(item => {
                    const cleanId = String(item.categoryId).replace(/\D/g, '');
                    const accountIdNum = parseInt(cleanId, 10);

                    // Calculate VAT for this line item
                    const amount = parseFloat(item.amount);
                    let baseAmount = amount;
                    let vatAmount = 0;

                    if (item.taxTreatment !== 'Out of Scope of Tax' && item.vatRateId) {
                        const vatRate = vatRates.find(v => String(v.id) === item.vatRateId);
                        const rate = vatRate ? parseFloat(vatRate.rate) : 0;

                        if (item.taxTreatment === 'Inclusive of Tax') {
                            // Amount includes VAT - extract it
                            baseAmount = amount / (1 + rate / 100);
                            vatAmount = amount - baseAmount;
                        } else if (item.taxTreatment === 'Exclusive of Tax') {
                            // Amount excludes VAT - calculate it
                            baseAmount = amount;
                            vatAmount = amount * (rate / 100);
                        }
                    }

                    return {
                        description: item.description || item.memo || `Bill from ${suppliers.find(s => s.id === selectedSupplierId)?.name}`,
                        quantity: 1,
                        unitPrice: baseAmount, // Send base amount only
                        accountId: accountIdNum,
                        // VAT data
                        taxTreatment: item.taxTreatment,
                        vatRateId: item.vatRateId ? parseInt(String(item.vatRateId)) : null,
                        vatAmount: vatAmount,
                        totalAmount: baseAmount + vatAmount
                    };
                });

            const formData = new FormData();
            formData.append('vendorId', String(selectedSupplierId));
            formData.append('purchaseDate', date.toISOString());
            formData.append('dueDate', dueDate.toISOString());
            formData.append('billNumber', refNo);
            formData.append('notes', lineItems[0].memo);
            formData.append('status', 'UNPAID');
            formData.append('items', JSON.stringify(items));

            await apiService.createPurchase(formData);
            Alert.alert('Success', 'Bill saved successfully', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to save bill');
        } finally {
            setLoading(false);
        }
    };


    const formatDate = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    // Check if any line item is not "Out of Scope of Tax"
    const showVatInTotals = lineItems.some(item => item.taxTreatment !== 'Out of Scope of Tax');

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            {/* Header */}
            <LinearGradient colors={['#122f8a', '#0a1a5c']} style={styles.header}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Bill</Text>
                    <View style={styles.toggleContainer}>
                        <TouchableOpacity
                            onPress={() => setIsDebitNote(false)}
                            style={[styles.toggleBtn, !isDebitNote && styles.toggleActiveOrange]}
                        >
                            <Text style={[styles.toggleText, !isDebitNote && styles.toggleTextActive]}>Bill</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setIsDebitNote(true)}
                            style={[styles.toggleBtn, isDebitNote && styles.toggleActiveOrange]}
                        >
                            <Text style={[styles.toggleText, isDebitNote && styles.toggleTextActive]}>Debit Note</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </LinearGradient>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#122f8a" />
                        <Text style={styles.loadingText}>Loading...</Text>
                    </View>
                ) : (
                    <>
                        {/* Supplier Selection */}
                        <View style={styles.section}>
                            <Text style={styles.label}>Select Supplier *</Text>
                            <TouchableOpacity style={styles.inputBox} onPress={() => setShowSupplierModal(true)}>
                                <Text style={styles.selectText}>
                                    {selectedSupplierId
                                        ? suppliers.find(s => s.id === selectedSupplierId)?.name
                                        : 'Choose supplier'}
                                </Text>
                                <Ionicons name="chevron-down" size={20} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        {/* A/P Account */}
                        <View style={styles.section}>
                            <Text style={styles.label}>A/P Account</Text>
                            <TouchableOpacity style={styles.inputBox} onPress={() => setShowAccountModal(true)}>
                                <Text style={styles.selectText}>
                                    {selectedAccountId
                                        ? paymentAccounts.find(a => String(a.id) === selectedAccountId)?.name
                                        : 'Select account'}
                                </Text>
                                <Ionicons name="chevron-down" size={20} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        {/* Reference and Dates */}
                        <View style={styles.section}>
                            <Text style={styles.label}>Reference No.</Text>
                            <TextInput
                                style={styles.input}
                                value={refNo}
                                onChangeText={setRefNo}
                                placeholder="Optional"
                                placeholderTextColor="#94a3b8"
                            />
                        </View>

                        <View style={styles.rowFields}>
                            <View style={styles.halfField}>
                                <Text style={styles.label}>Bill Date</Text>
                                <TouchableOpacity style={styles.inputBox} onPress={() => setShowDatePicker(true)}>
                                    <Ionicons name="calendar-outline" size={16} color="#64748b" />
                                    <Text style={styles.dateText}>{formatDate(date)}</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.halfField}>
                                <Text style={styles.label}>Due Date</Text>
                                <TouchableOpacity style={styles.inputBox} onPress={() => setShowDueDatePicker(true)}>
                                    <Ionicons name="calendar-outline" size={16} color="#64748b" />
                                    <Text style={styles.dateText}>{formatDate(dueDate)}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Type Toggle */}
                        <View style={styles.typeRow}>
                            {['Expense', 'Stock Purchase', 'Other'].map((type) => (
                                <TouchableOpacity
                                    key={type}
                                    style={[styles.typeBtn, expenseType === type && styles.typeBtnActiveOrange]}
                                    onPress={() => setExpenseType(type as ExpenseType)}
                                >
                                    <Text style={[styles.typeText, expenseType === type && styles.typeTextActive]}>
                                        {type}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Line Items */}
                        {lineItems.map((item, index) => (
                            <View key={item.id} style={styles.lineItem}>
                                <View style={styles.lineRow}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.label}>
                                            {expenseType === 'Stock Purchase'
                                                ? 'Stock/Inventory'
                                                : expenseType === 'Other'
                                                    ? 'Asset Account'
                                                    : 'Category'}
                                        </Text>
                                        <TouchableOpacity style={styles.select} onPress={() => {
                                            setEditingLineIndex(index);
                                            setShowExpenseModal(true);
                                        }}>
                                            <Text style={styles.selectText}>
                                                {expenseType === 'Stock Purchase'
                                                    ? (inventoryAccounts.find(a => String(a.id) === item.categoryId)?.name?.substring(0, 15) || 'Select Stock')
                                                    : expenseType === 'Other'
                                                        ? (otherAssetAccounts.find(a => String(a.id) === item.categoryId)?.name?.substring(0, 15) || 'Select Asset')
                                                        : (expenseAccounts.find(a => String(a.id) === item.categoryId)?.name?.substring(0, 15) || 'Select')}
                                            </Text>
                                            <Ionicons name="chevron-down" size={16} color="#64748b" />
                                        </TouchableOpacity>
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 12 }}>
                                        <Text style={styles.label}>Description</Text>
                                        <TextInput
                                            style={styles.lineInput}
                                            placeholder="Item description"
                                            placeholderTextColor="#94a3b8"
                                            value={item.description}
                                            onChangeText={(txt) => updateLineItem(index, 'description', txt)}
                                        />
                                    </View>
                                </View>

                                <View style={styles.lineRow}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.label}>Amounts are</Text>
                                        <TouchableOpacity style={styles.select} onPress={() => {
                                            setEditingLineIndex(index);
                                            setShowTaxTreatmentModal(true);
                                        }}>
                                            <Text style={styles.selectText}>
                                                {item.taxTreatment}
                                            </Text>
                                            <Ionicons name="chevron-down" size={16} color="#64748b" />
                                        </TouchableOpacity>
                                    </View>

                                    {/* Tax dropdown - only show if NOT "Out of Scope of Tax" */}
                                    {item.taxTreatment !== 'Out of Scope of Tax' && (
                                        <View style={{ flex: 1, marginLeft: 12 }}>
                                            <Text style={styles.label}>Tax</Text>
                                            <TouchableOpacity style={styles.select} onPress={() => {
                                                setEditingLineIndex(index);
                                                setShowVatRateModal(true);
                                            }}>
                                                <Text style={styles.selectText}>
                                                    {item.vatRateId
                                                        ? vatRates.find(v => String(v.id) === item.vatRateId)?.name || 'Select'
                                                        : 'Select Tax'}
                                                </Text>
                                                <Ionicons name="chevron-down" size={16} color="#64748b" />
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>

                                <View style={styles.lineRow}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.label}>Amount</Text>
                                        <TextInput
                                            style={styles.lineInput}
                                            placeholder="0.00"
                                            placeholderTextColor="#94a3b8"
                                            value={item.amount}
                                            onChangeText={(txt) => updateLineItem(index, 'amount', txt)}
                                            keyboardType="numeric"
                                        />
                                    </View>
                                </View>

                                {lineItems.length > 1 && (
                                    <TouchableOpacity
                                        style={styles.removeBtn}
                                        onPress={() => removeLineItem(index)}
                                    >
                                        <Ionicons name="trash-outline" size={18} color="#ef4444" />
                                        <Text style={styles.removeBtnText}>Remove</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        ))}

                        {/* Add Line Button */}
                        <TouchableOpacity style={styles.addLineBtn} onPress={addLineItem}>
                            <Ionicons name="add-circle-outline" size={20} color="#122f8a" />
                            <Text style={styles.addLineText}>Add line</Text>
                        </TouchableOpacity>

                        {/* Totals */}
                        <View style={styles.totalsSection}>
                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>Subtotal</Text>
                                <Text style={styles.totalValue}>KES {subtotal.toFixed(2)}</Text>
                            </View>

                            {/* Only show VAT if at least one item is taxable */}
                            {showVatInTotals && (
                                <View style={styles.totalRow}>
                                    <Text style={styles.totalLabel}>VAT</Text>
                                    <Text style={styles.totalValue}>KES {vatAmount.toFixed(2)}</Text>
                                </View>
                            )}

                            <View style={[styles.totalRow, styles.grandTotalRow]}>
                                <Text style={styles.grandTotalLabel}>Total</Text>
                                <Text style={styles.grandTotalValue}>KES {total.toFixed(2)}</Text>
                            </View>
                        </View>

                        {/* Save Button */}
                        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
                            <LinearGradient colors={['#122f8a', '#0a1a5c']} style={styles.saveBtnGradient}>
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.saveBtnText}>Save Bill</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </>
                )}
            </ScrollView>

            {/* Supplier Modal */}
            <Modal visible={showSupplierModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modal}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Supplier</Text>
                            <TouchableOpacity onPress={() => setShowSupplierModal(false)}>
                                <Ionicons name="close" size={24} color="#1e293b" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView>
                            {loading ? (
                                <View style={{ padding: 20, alignItems: 'center' }}>
                                    <ActivityIndicator size="small" color="#122f8a" />
                                    <Text style={{ marginTop: 10, color: '#64748b' }}>Loading suppliers...</Text>
                                </View>
                            ) : suppliers.length === 0 ? (
                                <View style={{ padding: 20, alignItems: 'center' }}>
                                    <Text style={{ color: '#64748b' }}>No suppliers found</Text>
                                </View>
                            ) : (
                                suppliers.map(s => (
                                    <TouchableOpacity
                                        key={s.id}
                                        style={styles.modalItem}
                                        onPress={() => {
                                            setSelectedSupplierId(s.id);
                                            setShowSupplierModal(false);
                                        }}
                                    >
                                        <Text style={styles.modalItemText}>{s.name}</Text>
                                        {s.email && (
                                            <Text style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                                                {s.email}
                                            </Text>
                                        )}
                                    </TouchableOpacity>
                                ))
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Account Modal */}
            <Modal visible={showAccountModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modal}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>A/P Account</Text>
                            <TouchableOpacity onPress={() => setShowAccountModal(false)}>
                                <Ionicons name="close" size={24} color="#1e293b" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView>
                            {paymentAccounts.map(a => (
                                <TouchableOpacity
                                    key={a.id}
                                    style={styles.modalItem}
                                    onPress={() => {
                                        setSelectedAccountId(String(a.id));
                                        setShowAccountModal(false);
                                    }}
                                >
                                    <Text style={styles.modalItemText}>{a.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Expense/Category Modal */}
            <Modal visible={showExpenseModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modal}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {expenseType === 'Stock Purchase'
                                    ? 'Select Inventory/Stock'
                                    : expenseType === 'Other'
                                        ? 'Select Asset Account'
                                        : 'Select Category'}
                            </Text>
                            <TouchableOpacity onPress={() => setShowExpenseModal(false)}>
                                <Ionicons name="close" size={24} color="#1e293b" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView>
                            {expenseType === 'Stock Purchase' ? (
                                // Show inventory accounts for Stock Purchase
                                inventoryAccounts.length > 0 ? (
                                    inventoryAccounts.map(a => (
                                        <TouchableOpacity
                                            key={a.id}
                                            style={styles.modalItem}
                                            onPress={() => {
                                                updateLineItem(editingLineIndex, 'categoryId', String(a.id));
                                                setShowExpenseModal(false);
                                            }}
                                        >
                                            <Text style={styles.modalItemText}>{a.name}</Text>
                                            {a.code && <Text style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{a.code}</Text>}
                                        </TouchableOpacity>
                                    ))
                                ) : (
                                    <View style={{ padding: 20, alignItems: 'center' }}>
                                        <Ionicons name="cube-outline" size={48} color="#cbd5e1" />
                                        <Text style={{ color: '#64748b', marginTop: 12, fontSize: 14 }}>
                                            No inventory accounts found
                                        </Text>
                                        <Text style={{ color: '#94a3b8', marginTop: 4, fontSize: 12, textAlign: 'center' }}>
                                            Please set up inventory accounts in Chart of Accounts
                                        </Text>
                                    </View>
                                )
                            ) : expenseType === 'Other' ? (
                                // Show other asset accounts for Other (Fixed Assets, Prepaid, etc.)
                                otherAssetAccounts.length > 0 ? (
                                    otherAssetAccounts.map(a => (
                                        <TouchableOpacity
                                            key={a.id}
                                            style={styles.modalItem}
                                            onPress={() => {
                                                updateLineItem(editingLineIndex, 'categoryId', String(a.id));
                                                setShowExpenseModal(false);
                                            }}
                                        >
                                            <Text style={styles.modalItemText}>{a.name}</Text>
                                            {a.code && <Text style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{a.code}</Text>}
                                        </TouchableOpacity>
                                    ))
                                ) : (
                                    <View style={{ padding: 20, alignItems: 'center' }}>
                                        <Ionicons name="business-outline" size={48} color="#cbd5e1" />
                                        <Text style={{ color: '#64748b', marginTop: 12, fontSize: 14 }}>
                                            No asset accounts found
                                        </Text>
                                        <Text style={{ color: '#94a3b8', marginTop: 4, fontSize: 12, textAlign: 'center' }}>
                                            Fixed Assets, Prepaid Expenses, etc.
                                        </Text>
                                    </View>
                                )
                            ) : (
                                // Show expense accounts for regular Expense
                                expenseAccounts.map(a => (
                                    <TouchableOpacity
                                        key={a.id}
                                        style={styles.modalItem}
                                        onPress={() => {
                                            updateLineItem(editingLineIndex, 'categoryId', String(a.id));
                                            setShowExpenseModal(false);
                                        }}
                                    >
                                        <Text style={styles.modalItemText}>{a.name}</Text>
                                    </TouchableOpacity>
                                ))
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Tax Treatment Modal */}
            <Modal visible={showTaxTreatmentModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modal}>
                        <ScrollView>
                            {(['Exclusive of Tax', 'Inclusive of Tax', 'Out of Scope of Tax'] as TaxTreatment[]).map((treatment) => (
                                <TouchableOpacity
                                    key={treatment}
                                    style={styles.modalItem}
                                    onPress={() => {
                                        updateLineItem(editingLineIndex, 'taxTreatment', treatment);
                                        // Reset VAT rate when changing tax treatment
                                        if (treatment === 'Out of Scope of Tax') {
                                            updateLineItem(editingLineIndex, 'vatRateId', null);
                                        }
                                        setShowTaxTreatmentModal(false);
                                    }}
                                >
                                    <Text style={styles.modalItemText}>{treatment}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* VAT Rate Modal */}
            <Modal visible={showVatRateModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modal}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Tax</Text>
                            <TouchableOpacity onPress={() => setShowVatRateModal(false)}>
                                <Ionicons name="close" size={24} color="#1e293b" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView>
                            {vatRates.map(vat => (
                                <TouchableOpacity
                                    key={vat.id}
                                    style={styles.modalItem}
                                    onPress={() => {
                                        updateLineItem(editingLineIndex, 'vatRateId', String(vat.id));
                                        setShowVatRateModal(false);
                                    }}
                                >
                                    <Text style={styles.modalItemText}>{vat.name}</Text>
                                    {vat.description && (
                                        <Text style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                                            {vat.description}
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Date Picker for Bill Date */}
            <CustomDatePicker
                visible={showDatePicker}
                onClose={() => setShowDatePicker(false)}
                date={date}
                onChange={setDate}
                title="Select Bill Date"
            />

            {/* Date Picker for Due Date */}
            <CustomDatePicker
                visible={showDueDatePicker}
                onClose={() => setShowDueDatePicker(false)}
                date={dueDate}
                onChange={setDueDate}
                title="Select Due Date"
            />
        </SafeAreaView>
    );
}

// Custom Date Picker Component (iOS Optimized)
const CustomDatePicker = ({ visible, onClose, date, onChange, title }: any) => {
    const [tempDate, setTempDate] = useState(date || new Date());

    const currentYear = tempDate.getFullYear();
    const currentMonth = tempDate.getMonth();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const changeMonth = (increment: number) => {
        const newDate = new Date(tempDate);
        newDate.setMonth(newDate.getMonth() + increment);
        setTempDate(newDate);
    };

    const confirmDate = () => {
        onChange(tempDate);
        onClose();
    };

    const emptyDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={datePickerStyles.overlay}>
                <View style={datePickerStyles.container}>
                    <View style={datePickerStyles.header}>
                        <Text style={datePickerStyles.title}>{title}</Text>
                        <TouchableOpacity onPress={onClose} style={datePickerStyles.closeButton}>
                            <Ionicons name="close" size={24} color="#1e293b" />
                        </TouchableOpacity>
                    </View>

                    <View style={datePickerStyles.monthNav}>
                        <TouchableOpacity
                            onPress={() => changeMonth(-1)}
                            style={datePickerStyles.navButton}
                        >
                            <Ionicons name="chevron-back" size={24} color="#122f8a" />
                        </TouchableOpacity>

                        <Text style={datePickerStyles.monthYear}>
                            {months[tempDate.getMonth()]} {tempDate.getFullYear()}
                        </Text>

                        <TouchableOpacity
                            onPress={() => changeMonth(1)}
                            style={datePickerStyles.navButton}
                        >
                            <Ionicons name="chevron-forward" size={24} color="#122f8a" />
                        </TouchableOpacity>
                    </View>

                    <View style={datePickerStyles.weekDaysRow}>
                        {weekDays.map((day, idx) => (
                            <View key={idx} style={datePickerStyles.weekDayCell}>
                                <Text style={datePickerStyles.weekDayText}>{day}</Text>
                            </View>
                        ))}
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        <View style={datePickerStyles.daysGrid}>
                            {emptyDays.map(i => (
                                <View key={`empty-${i}`} style={datePickerStyles.dayCell} />
                            ))}

                            {days.map(day => {
                                const isSelected = tempDate.getDate() === day;
                                const isToday = new Date().getDate() === day &&
                                    new Date().getMonth() === tempDate.getMonth() &&
                                    new Date().getFullYear() === tempDate.getFullYear();

                                return (
                                    <TouchableOpacity
                                        key={day}
                                        style={[
                                            datePickerStyles.dayCell,
                                            isSelected && datePickerStyles.selectedDay,
                                            isToday && !isSelected && datePickerStyles.todayDay
                                        ]}
                                        onPress={() => {
                                            const newDate = new Date(tempDate);
                                            newDate.setDate(day);
                                            setTempDate(newDate);
                                        }}
                                    >
                                        <Text style={[
                                            datePickerStyles.dayText,
                                            isSelected && datePickerStyles.selectedDayText,
                                            isToday && !isSelected && datePickerStyles.todayDayText
                                        ]}>
                                            {day}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </ScrollView>

                    <TouchableOpacity
                        style={datePickerStyles.confirmButton}
                        onPress={confirmDate}
                    >
                        <Text style={datePickerStyles.confirmText}>
                            Confirm Date
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const datePickerStyles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: '#ffffff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: Platform.OS === 'ios' ? 34 : 20,
        maxHeight: '75%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1e293b',
    },
    closeButton: {
        padding: 8,
        backgroundColor: '#f8fafc',
        borderRadius: 20,
    },
    monthNav: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    navButton: {
        padding: 8,
        backgroundColor: '#eff6ff',
        borderRadius: 12,
    },
    monthYear: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1e293b',
    },
    weekDaysRow: {
        flexDirection: 'row',
        paddingHorizontal: 12,
        paddingBottom: 8,
        backgroundColor: '#f8fafc',
    },
    weekDayCell: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 8,
    },
    weekDayText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748b',
        textTransform: 'uppercase',
    },
    daysGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 12,
        paddingTop: 8,
    },
    dayCell: {
        width: `${100 / 7}%`,
        aspectRatio: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 4,
    },
    selectedDay: {
        backgroundColor: '#122f8a',
        borderRadius: 12,
    },
    todayDay: {
        borderWidth: 2,
        borderColor: '#fe9900',
        borderRadius: 12,
    },
    dayText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#334155',
    },
    selectedDayText: {
        color: '#ffffff',
        fontWeight: '700',
    },
    todayDayText: {
        color: '#fe9900',
        fontWeight: '700',
    },
    confirmButton: {
        marginHorizontal: 20,
        marginTop: 16,
        backgroundColor: '#122f8a',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#122f8a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    confirmText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '700',
    },
});

const { width } = Dimensions.get('window');
const isSmallScreen = width < 375;
const isMediumScreen = width >= 375 && width < 768;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        paddingTop: Platform.OS === 'ios' ? 50 : 30,
        paddingBottom: 20,
        paddingHorizontal: 16,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backBtn: {
        padding: 8,
    },
    headerTitle: {
        fontSize: isSmallScreen ? 18 : 20,
        fontWeight: '700',
        color: '#fff',
        flex: 1,
        textAlign: 'center',
        marginHorizontal: isSmallScreen ? 8 : 16,
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 8,
        padding: 2,
    },
    toggleBtn: {
        paddingVertical: 6,
        paddingHorizontal: isSmallScreen ? 8 : 12,
        borderRadius: 6,
    },
    toggleActive: {
        backgroundColor: '#fff',
    },
    toggleActiveOrange: {
        backgroundColor: '#FE9900',
    },
    toggleText: {
        fontSize: isSmallScreen ? 11 : 12,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.7)',
    },
    toggleTextActive: {
        color: '#fff',
    },
    content: {
        flex: 1,
        padding: isSmallScreen ? 12 : 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 60,
    },
    loadingText: {
        marginTop: 12,
        color: '#64748b',
        fontSize: 14,
    },
    section: {
        marginBottom: 16,
    },
    label: {
        fontSize: isSmallScreen ? 12 : 13,
        fontWeight: '600',
        color: '#475569',
        marginBottom: 6,
    },
    inputBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        borderRadius: 10,
        paddingHorizontal: isSmallScreen ? 12 : 14,
        paddingVertical: isSmallScreen ? 12 : 14,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    selectText: {
        fontSize: isSmallScreen ? 13 : 14,
        color: '#1e293b',
        flex: 1,
    },
    input: {
        backgroundColor: '#fff',
        borderRadius: 10,
        paddingHorizontal: isSmallScreen ? 12 : 14,
        paddingVertical: isSmallScreen ? 12 : 14,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        fontSize: isSmallScreen ? 13 : 14,
        color: '#1e293b',
    },
    rowFields: {
        flexDirection: isSmallScreen ? 'column' : 'row',
        gap: 12,
        marginBottom: 16,
    },
    halfField: {
        flex: 1,
        minWidth: isSmallScreen ? '100%' : 'auto',
    },
    dateText: {
        fontSize: isSmallScreen ? 13 : 14,
        color: '#1e293b',
        marginLeft: 8,
        flex: 1,
    },
    typeRow: {
        flexDirection: isSmallScreen ? 'column' : 'row',
        gap: 8,
        marginBottom: 20,
    },
    typeBtn: {
        flex: 1,
        paddingVertical: isSmallScreen ? 10 : 12,
        backgroundColor: '#fff',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        alignItems: 'center',
        minWidth: isSmallScreen ? '100%' : 'auto',
    },
    typeBtnActive: {
        backgroundColor: '#122f8a',
        borderColor: '#122f8a',
    },
    typeBtnActiveOrange: {
        backgroundColor: '#FE9900',
        borderColor: '#FE9900',
    },
    typeText: {
        fontSize: isSmallScreen ? 12 : 13,
        fontWeight: '600',
        color: '#64748b',
    },
    typeTextActive: {
        color: '#fff',
    },
    lineItem: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: isSmallScreen ? 12 : 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    lineRow: {
        flexDirection: isSmallScreen ? 'column' : 'row',
        marginBottom: 12,
        gap: isSmallScreen ? 12 : 0,
    },
    select: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#f8fafc',
        borderRadius: 8,
        paddingHorizontal: isSmallScreen ? 10 : 12,
        paddingVertical: isSmallScreen ? 10 : 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    lineInput: {
        backgroundColor: '#f8fafc',
        borderRadius: 8,
        paddingHorizontal: isSmallScreen ? 10 : 12,
        paddingVertical: isSmallScreen ? 10 : 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        fontSize: isSmallScreen ? 13 : 14,
        color: '#1e293b',
    },
    removeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
        paddingVertical: 8,
    },
    removeBtnText: {
        marginLeft: 6,
        fontSize: 13,
        fontWeight: '600',
        color: '#ef4444',
    },
    addLineBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        backgroundColor: '#fff',
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: '#122f8a',
        borderStyle: 'dashed',
        marginBottom: 20,
    },
    addLineText: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '600',
        color: '#122f8a',
    },
    totalsSection: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    totalLabel: {
        fontSize: 14,
        color: '#64748b',
    },
    totalValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1e293b',
    },
    grandTotalRow: {
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        marginTop: 8,
        paddingTop: 12,
    },
    grandTotalLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1e293b',
    },
    grandTotalValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#122f8a',
    },
    saveBtn: {
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 40,
    },
    saveBtnGradient: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    saveBtnText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modal: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: Platform.OS === 'ios' ? 34 : 20,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1e293b',
    },
    modalItem: {
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    modalItemText: {
        fontSize: 15,
        color: '#1e293b',
        fontWeight: '500',
    },
});
