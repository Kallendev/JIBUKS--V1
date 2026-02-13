/**
 * B-013: Quick POS cash sale
 * Create invoice + record full payment in one flow.
 * CoA: (1) Create invoice → DR Accounts Receivable, CR Revenue.
 *      (2) Record payment → DR Cash/Bank, CR Accounts Receivable.
 */
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import apiService from '@/services/api';

const VAT_RATE = 0.16;

type LineItem = { description: string; quantity: string; unitPrice: string };

export default function CashSaleScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [customers, setCustomers] = useState<any[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [customerId, setCustomerId] = useState('');
    const [accountId, setAccountId] = useState('');
    const [saleNumber, setSaleNumber] = useState('');
    const [chequeNumber, setChequeNumber] = useState('');
    const [taxDate, setTaxDate] = useState(new Date().toISOString().split('T')[0]);
    const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Cheque' | 'Card' | 'Mobile Money'>('Cash');
    const [items, setItems] = useState<LineItem[]>([
        { description: '', quantity: '1', unitPrice: '' },
    ]);
    const [vatInclusive, setVatInclusive] = useState(true);
    const [messageToCustomer, setMessageToCustomer] = useState('');
    const [memo, setMemo] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [custRes, acc] = await Promise.all([
                apiService.getCustomers(),
                apiService.getPaymentEligibleAccounts(),
            ]);
            const custList = Array.isArray(custRes) ? custRes : (custRes?.customers ?? []);
            const accList = Array.isArray(acc) ? acc : (acc ?? []);
            setCustomers(custList);
            setAccounts(accList);
            if (accList.length > 0 && !accountId) setAccountId(String(accList[0].id));
            if (custList.length > 0 && !customerId) setCustomerId(String(custList[0].id));
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Failed to load customers and accounts');
        }
    };

    const addLine = () => {
        setItems([...items, { description: '', quantity: '1', unitPrice: '' }]);
    };

    const removeLine = (index: number) => {
        if (items.length <= 1) return;
        setItems(items.filter((_, i) => i !== index));
    };

    const updateLine = (index: number, field: keyof LineItem, value: string) => {
        const next = [...items];
        next[index] = { ...next[index], [field]: value };
        setItems(next);
    };

    const subtotal = items.reduce((sum, row) => {
        const q = parseFloat(row.quantity) || 0;
        const p = parseFloat(row.unitPrice) || 0;
        return sum + q * p;
    }, 0);
    const vatAmountRaw = vatInclusive
        ? subtotal - subtotal / (1 + VAT_RATE)
        : subtotal * VAT_RATE;
    const vatAmount = Number(vatAmountRaw.toFixed(2));
    const total = vatInclusive ? subtotal : subtotal + vatAmount;

    const handleCompleteSale = async () => {
        if (!customerId) {
            Alert.alert('Error', 'Please select a customer');
            return;
        }
        const validItems = items.filter(
            (r) => r.description.trim() && r.quantity && r.unitPrice && parseFloat(r.quantity) > 0 && parseFloat(r.unitPrice) >= 0
        );
        if (validItems.length === 0) {
            Alert.alert('Error', 'Add at least one item with description, quantity and price');
            return;
        }
        if ((accounts ?? []).length === 0) {
            Alert.alert(
                'Setup Required',
                'No payment accounts (Cash/Bank) found. Please complete business setup so the Chart of Accounts is seeded, then try again.'
            );
            return;
        }
        const payAccountId = accountId ? parseInt(accountId) : undefined;
        if (!payAccountId) {
            Alert.alert('Error', 'Please select a payment account (e.g. Cash or Bank) so the sale posts to the correct account.');
            return;
        }

        try {
            setLoading(true);
            const today = new Date().toISOString().split('T')[0];

            const notesParts: string[] = [];
            if (messageToCustomer.trim()) {
                notesParts.push(`Message to customer: ${messageToCustomer.trim()}`);
            }
            if (memo.trim()) {
                notesParts.push(`Memo: ${memo.trim()}`);
            }
            if (chequeNumber.trim()) {
                notesParts.push(`Cheque No: ${chequeNumber.trim()}`);
            }
            const combinedNotes = notesParts.join('\n\n') || undefined;

            const invoiceData = {
                customerId: parseInt(customerId),
                invoiceNumber: saleNumber || undefined,
                invoiceDate: today,
                dueDate: today,
                items: validItems.map((r) => ({
                    description: r.description.trim(),
                    quantity: parseFloat(r.quantity),
                    unitPrice: parseFloat(r.unitPrice),
                })),
                tax: vatAmount,
                discount: 0,
                notes: combinedNotes,
                status: 'UNPAID',
            };
            const invoice = await apiService.createInvoice(invoiceData);
            const invTotal = Number(invoice.total);
            await apiService.recordInvoicePayment(invoice.id, {
                amount: invTotal,
                paymentDate: new Date().toISOString(),
                paymentMethod,
                bankAccountId: payAccountId,
                reference: `Cash sale INV-${invoice.invoiceNumber || invoice.id}`,
                notes: combinedNotes,
            });
            Alert.alert('Success', `Sale recorded. KES ${invTotal.toLocaleString()}`, [
                { text: 'OK', onPress: () => router.back() },
            ]);
        } catch (e: any) {
            console.error(e);
            Alert.alert('Error', e?.error || 'Failed to complete sale');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (n: number) => `KES ${n.toLocaleString()}`;

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            {/* Blue header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#f59e0b" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Cash Sale</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Top customer / dates / ref row */}
                <View style={styles.card}>
                    <View style={styles.rowTwoCols}>
                        <View style={styles.fieldGroup}>
                            <Text style={styles.fieldLabel}>Customer*</Text>
                            <View style={styles.dropdownField}>
                                <Picker
                                    selectedValue={customerId}
                                    onValueChange={(value) => setCustomerId(value ? String(value) : '')}
                                    style={styles.picker}
                                    prompt="Select customer"
                                >
                                    <Picker.Item label="Select customer" value="" />
                                    {(customers ?? []).map((c) => (
                                        <Picker.Item
                                            key={c.id}
                                            label={c.name}
                                            value={String(c.id)}
                                        />
                                    ))}
                                </Picker>
                            </View>
                        </View>
                        <View style={styles.fieldGroup}>
                            <Text style={styles.fieldLabel}>Tax Date*</Text>
                            <View style={styles.inputWithIcon}>
                                <TextInput
                                    style={styles.textInput}
                                    value={taxDate}
                                    onChangeText={setTaxDate}
                                    placeholder="YYYY-MM-DD"
                                />
                                <Ionicons name="calendar-outline" size={18} color="#6b7280" />
                            </View>
                        </View>
                    </View>

                    <View style={styles.rowTwoCols}>
                        <View style={styles.fieldGroup}>
                            <Text style={styles.fieldLabel}>Sale No*</Text>
                            <TextInput
                                style={styles.textInput}
                                placeholder="Manual"
                                value={saleNumber}
                                onChangeText={setSaleNumber}
                            />
                        </View>
                        <View style={styles.fieldGroup}>
                            <Text style={styles.fieldLabel}>Cheque No*</Text>
                            <TextInput
                                style={styles.textInput}
                                placeholder="Optional"
                                value={chequeNumber}
                                onChangeText={setChequeNumber}
                            />
                        </View>
                    </View>

                    <View style={styles.rowTwoCols}>
                        <View style={styles.fieldGroup}>
                            <Text style={styles.fieldLabel}>Payment Method*</Text>
                            <View style={styles.dropdownField}>
                                <Picker
                                    selectedValue={paymentMethod}
                                    onValueChange={(value) =>
                                        setPaymentMethod((value || 'Cash') as 'Cash' | 'Cheque' | 'Card' | 'Mobile Money')
                                    }
                                    style={styles.picker}
                                    prompt="Select payment method"
                                >
                                    <Picker.Item label="Cash" value="Cash" />
                                    <Picker.Item label="Card" value="Card" />
                                    <Picker.Item label="Mobile Money" value="Mobile Money" />
                                    <Picker.Item label="Cheque" value="Cheque" />
                                </Picker>
                            </View>
                        </View>
                        <View style={styles.fieldGroup}>
                            <Text style={styles.fieldLabel}>Deposit to*</Text>
                            <View style={styles.dropdownField}>
                                <Picker
                                    selectedValue={accountId}
                                    onValueChange={(value) => setAccountId(value ? String(value) : '')}
                                    style={styles.picker}
                                    prompt="Select payment account"
                                >
                                    <Picker.Item label="Select account" value="" />
                                    {(accounts ?? []).map((a) => (
                                        <Picker.Item
                                            key={a.id}
                                            label={a.name}
                                            value={String(a.id)}
                                        />
                                    ))}
                                </Picker>
                            </View>
                        </View>
                    </View>
                </View>

                {(customers ?? []).length === 0 && (
                    <Text style={styles.hint}>Add customers first from the Customers screen.</Text>
                )}

                {/* Items table */}
                <View style={styles.itemsSection}>
                    <View style={styles.itemsHeaderRow}>
                        <Text style={styles.itemsTitle}>Items</Text>
                        <TouchableOpacity onPress={addLine} style={styles.addRow}>
                            <Ionicons name="add-circle-outline" size={20} color="#1e3a8a" />
                            <Text style={styles.addRowText}>Add line</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.itemsTableHeader}>
                        <Text style={[styles.itemsHeaderCell, { flex: 0.5 }]}>Item</Text>
                        <Text style={[styles.itemsHeaderCell, { flex: 0.6 }]}>Qty</Text>
                        <Text style={[styles.itemsHeaderCell, { flex: 2 }]}>Desc</Text>
                        <Text style={[styles.itemsHeaderCell, { flex: 1 }]}>Rate</Text>
                        <Text style={[styles.itemsHeaderCell, { flex: 0.7 }]}>VAT</Text>
                        <Text style={[styles.itemsHeaderCell, { flex: 1 }]}>Amt</Text>
                    </View>

                    {items.map((row, index) => {
                        const lineQty = parseFloat(row.quantity) || 0;
                        const linePrice = parseFloat(row.unitPrice) || 0;
                        const lineAmount = lineQty * linePrice;
                        return (
                            <View key={index} style={styles.itemRow}>
                                <Text style={[styles.itemCellText, { flex: 0.5 }]}>{index + 1}</Text>
                                <TextInput
                                    style={[styles.itemInput, { flex: 0.6 }]}
                                    placeholder="1"
                                    value={row.quantity}
                                    onChangeText={(v) => updateLine(index, 'quantity', v)}
                                    keyboardType="decimal-pad"
                                />
                                <TextInput
                                    style={[styles.itemInput, { flex: 2 }]}
                                    placeholder="Item description"
                                    value={row.description}
                                    onChangeText={(v) => updateLine(index, 'description', v)}
                                />
                                <TextInput
                                    style={[styles.itemInput, { flex: 1 }]}
                                    placeholder="0.00"
                                    value={row.unitPrice}
                                    onChangeText={(v) => updateLine(index, 'unitPrice', v)}
                                    keyboardType="decimal-pad"
                                />
                                <Text style={[styles.itemCellText, { flex: 0.7 }]}>16%</Text>
                                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                                    <Text style={styles.itemAmountText}>
                                        {lineAmount ? lineAmount.toLocaleString() : '0'}
                                    </Text>
                                </View>
                                <TouchableOpacity onPress={() => removeLine(index)} style={styles.removeBtn}>
                                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                                </TouchableOpacity>
                            </View>
                        );
                    })}
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
                    <Text style={styles.vatToggleText}>Amounts are VAT inclusive</Text>
                </TouchableOpacity>

                {/* Totals card */}
                <View style={styles.totalsCard}>
                    <View style={styles.totalsRow}>
                        <Text style={styles.totalsLabel}>Subtotal:</Text>
                        <Text style={styles.totalsValue}>{subtotal.toLocaleString()}</Text>
                    </View>
                    <View style={styles.totalsRow}>
                        <Text style={styles.totalsLabel}>VAT (16%):</Text>
                        <Text style={styles.totalsValue}>{vatAmount.toLocaleString()}</Text>
                    </View>
                    <View style={[styles.totalsRow, styles.totalsTotalRow]}>
                        <Text style={styles.totalsTotalLabel}>Total:</Text>
                        <Text style={styles.totalsTotalValue}>{formatCurrency(total)}</Text>
                    </View>
                </View>

                {/* Message & memo */}
                <View style={styles.textBlock}>
                    <Text style={styles.fieldLabel}>Message to Customer</Text>
                    <TextInput
                        style={styles.multiLineInput}
                        placeholder="This will appear on the receipt"
                        value={messageToCustomer}
                        onChangeText={setMessageToCustomer}
                        multiline
                    />
                </View>

                <View style={styles.textBlock}>
                    <Text style={styles.fieldLabel}>Memo</Text>
                    <TextInput
                        style={styles.multiLineInput}
                        placeholder="Internal notes (not visible to customer)"
                        value={memo}
                        onChangeText={setMemo}
                        multiline
                    />
                </View>

                {/* Footer buttons */}
                <View style={styles.footerButtonsRow}>
                    <TouchableOpacity
                        style={styles.footerButtonClear}
                        onPress={() => {
                            setItems([{ description: '', quantity: '1', unitPrice: '' }]);
                            setSaleNumber('');
                            setChequeNumber('');
                            setTaxDate(new Date().toISOString().split('T')[0]);
                            setVatInclusive(true);
                            setMessageToCustomer('');
                            setMemo('');
                        }}
                        disabled={loading}
                    >
                        <Text style={styles.footerButtonClearText}>Clear</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.footerButtonPrimary, loading && styles.submitBtnDisabled]}
                        onPress={handleCompleteSale}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.footerButtonPrimaryText}>Record sale</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={{ height: 32 }} />
            </ScrollView>
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
    backBtn: { padding: 4, borderRadius: 20, backgroundColor: '#0b1b4f' },
    headerTitle: { fontSize: 20, fontWeight: '700', color: '#fbbf24' },
    scroll: { flex: 1, backgroundColor: '#f9fafb' },
    scrollContent: { padding: 16, paddingBottom: 40 },
    card: {
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
    textInput: {
        flex: 1,
        fontSize: 14,
        color: '#111827',
        marginRight: 8,
    },
    dropdownField: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 6,
        backgroundColor: '#f9fafb',
        minHeight: 44,
        justifyContent: 'center',
    },
    dropdownScroll: {
        flexGrow: 0,
    },
    customerScroll: { flex: 1, marginLeft: 8 },
    chip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 18,
        backgroundColor: '#e5e7eb',
        marginRight: 8,
    },
    chipActive: { backgroundColor: '#1e3a8a' },
    chipText: { fontSize: 13, color: '#374151' },
    chipTextActive: { color: '#fff' },
    hint: { fontSize: 12, color: '#6b7280', marginBottom: 12, marginTop: 4 },
    pillRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    pill: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#d1d5db',
        backgroundColor: '#ffffff',
    },
    pillActive: {
        backgroundColor: '#1e3a8a',
        borderColor: '#1e3a8a',
    },
    pillText: { fontSize: 12, color: '#374151', fontWeight: '500' },
    pillTextActive: { color: '#ffffff' },
    itemsSection: {
        backgroundColor: '#ffffff',
        borderRadius: 24,
        paddingVertical: 12,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    itemsHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 8,
    },
    itemsTitle: { fontSize: 15, fontWeight: '600', color: '#111827' },
    addRow: { flexDirection: 'row', alignItems: 'center' },
    addRowText: { marginLeft: 4, fontSize: 13, color: '#1e3a8a', fontWeight: '600' },
    itemsTableHeader: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#e5e7eb',
        backgroundColor: '#f9fafb',
    },
    itemsHeaderCell: { fontSize: 11, fontWeight: '600', color: '#4b5563' },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    itemInput: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 6,
        fontSize: 13,
        color: '#111827',
        marginRight: 6,
        backgroundColor: '#f9fafb',
    },
    itemCellText: {
        fontSize: 12,
        color: '#374151',
        marginRight: 6,
    },
    itemAmountText: { fontSize: 13, fontWeight: '600', color: '#111827' },
    removeBtn: { paddingLeft: 4, paddingVertical: 4 },
    vatToggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        marginBottom: 8,
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
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
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
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
    },
    footerButtonClear: {
        flex: 1,
        height: 46,
        borderRadius: 23,
        backgroundColor: '#e5e7eb',
        borderWidth: 1,
        borderColor: '#9ca3af',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    footerButtonClearText: { fontSize: 14, fontWeight: '600', color: '#111827' },
    footerButtonPrimary: {
        flex: 1,
        height: 46,
        borderRadius: 23,
        backgroundColor: '#1d4ed8',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    footerButtonPrimaryText: { fontSize: 14, fontWeight: '700', color: '#ffffff' },
    submitBtnDisabled: { opacity: 0.7 },
    picker: {
        flex: 1,
        color: '#111827',
        fontSize: 14,
        backgroundColor: 'transparent',
    },
});
