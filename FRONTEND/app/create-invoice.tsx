import React, { useState, useEffect, useCallback } from 'react';
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import apiService from '@/services/api';

// Default tax % for new invoices (can later come from tenant/business settings)
const DEFAULT_TAX_PERCENT = 0;

/** Parse payment terms string to days until due. e.g. "Net 30" -> 30, "Due on Receipt" -> 0 */
function getDaysFromPaymentTerms(paymentTerms: string | null | undefined): number {
    if (!paymentTerms || typeof paymentTerms !== 'string') return 30;
    const s = paymentTerms.trim().toLowerCase();
    if (s.includes('receipt') || s === 'due on receipt') return 0;
    const netMatch = s.match(/net\s*(\d+)/);
    if (netMatch) return Math.max(0, parseInt(netMatch[1], 10));
    if (s.includes('15')) return 15;
    if (s.includes('60')) return 60;
    if (s.includes('90')) return 90;
    return 30;
}

/** Compute due date YYYY-MM-DD from invoice date and payment terms */
function computeDueDate(invoiceDateStr: string, paymentTerms: string | null | undefined): string {
    const days = getDaysFromPaymentTerms(paymentTerms);
    const d = new Date(invoiceDateStr);
    if (isNaN(d.getTime())) return '';
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
}

/**
 * Create Invoice (Credit Sale): invoice only, no payment.
 * CoA: DR Accounts Receivable, CR Revenue. Payment recorded later posts DR Cash/Bank, CR AR.
 */
export default function CreateInvoiceScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const initialCustomerIdParam = Array.isArray(params.customerId) ? params.customerId[0] : params.customerId;
    const [loading, setLoading] = useState(false);
    const [customers, setCustomers] = useState<any[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [inventoryItems, setInventoryItems] = useState<any[]>([]);
    const [businessTypeFilter, setBusinessTypeFilter] = useState('');

    // Form state
    const [customerId, setCustomerId] = useState(initialCustomerIdParam ? String(initialCustomerIdParam) : '');
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
    const [dueDate, setDueDate] = useState('');
    const [customerMessage, setCustomerMessage] = useState('');
    const [memo, setMemo] = useState('');
    const [items, setItems] = useState([
        { description: '', quantity: '', unitPrice: '', accountId: '', inventoryItemId: '' }
    ]);
    const [tax, setTax] = useState(String(DEFAULT_TAX_PERCENT));
    const [discount, setDiscount] = useState('0');

    const loadData = useCallback(async () => {
        try {
            const [customersRes, accountsData, inventoryData] = await Promise.all([
                apiService.getCustomers({
                    active: true,
                    limit: 100,
                    offset: 0,
                    businessType: businessTypeFilter || undefined,
                }),
                apiService.getAccounts(),
                apiService.getInventory()
            ]);
            const customerList = Array.isArray(customersRes) ? customersRes : (customersRes?.customers ?? []);
            setCustomers(customerList);
            setAccounts((accountsData || []).filter((a: any) => a.type === 'INCOME'));
            setInventoryItems(inventoryData || []);
            // If current selection is not in filtered list, clear it
            setCustomerId(prev => {
                if (!prev) return prev;
                const found = customerList.some((c: any) => String(c.id) === String(prev));
                return found ? prev : '';
            });
        } catch (error) {
            console.error('Error loading data:', error);
            Alert.alert('Error', 'Failed to load customers and accounts');
        }
    }, [businessTypeFilter]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // When customer or invoice date changes, set due date from customer's payment terms
    useEffect(() => {
        if (!customerId || !invoiceDate) return;
        const customer = (customers ?? []).find((c: any) => String(c.id) === String(customerId));
        const terms = customer?.paymentTerms ?? undefined;
        const computed = computeDueDate(invoiceDate, terms);
        if (computed) setDueDate(computed);
    }, [customerId, invoiceDate, customers]);

    // After first load, if we had initial customer from URL, ensure due date is set
    const [dueDateInitialized, setDueDateInitialized] = useState(false);
    useEffect(() => {
        if (dueDateInitialized || !customerId || customers.length === 0) return;
        const customer = customers.find((c: any) => String(c.id) === String(customerId));
        if (!customer) return;
        const computed = computeDueDate(invoiceDate, customer.paymentTerms);
        if (computed) {
            setDueDate(computed);
            setDueDateInitialized(true);
        }
    }, [customerId, customers, invoiceDate, dueDateInitialized]);

    const addItem = () => {
        setItems([...items, { description: '', quantity: '', unitPrice: '', accountId: '', inventoryItemId: '' }]);
    };

    const removeItem = (index: number) => {
        if (items.length === 1) {
            Alert.alert('Error', 'At least one item is required');
            return;
        }
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
    };

    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...items];
        (newItems[index] as any)[field] = value;

        // If inventory item selected, auto-fill details
        if (field === 'inventoryItemId' && value) {
            const invItem = inventoryItems.find(item => item.id === parseInt(value));
            if (invItem) {
                newItems[index].description = invItem.name;
                newItems[index].unitPrice = invItem.sellingPrice.toString();
            }
        }

        setItems(newItems);
    };

    const calculateSubtotal = () => {
        return items.reduce((sum, item) => {
            const qty = parseFloat(item.quantity) || 0;
            const price = parseFloat(item.unitPrice) || 0;
            return sum + (qty * price);
        }, 0);
    };

    const calculateTotal = () => {
        const subtotal = calculateSubtotal();
        const taxAmount = parseFloat(tax) || 0;
        const discountAmount = parseFloat(discount) || 0;
        return subtotal + taxAmount - discountAmount;
    };

    const resetForm = () => {
        setInvoiceNumber('');
        const today = new Date().toISOString().split('T')[0];
        setInvoiceDate(today);
        setDueDate('');
        setItems([{ description: '', quantity: '', unitPrice: '', accountId: '', inventoryItemId: '' }]);
        setTax(String(DEFAULT_TAX_PERCENT));
        setDiscount('0');
        setCustomerMessage('');
        setMemo('');
    };

    type SubmitMode = 'save' | 'saveAndNew' | 'print';

    const submitInvoice = async (mode: SubmitMode) => {
        // Validation
        if (!customerId) {
            Alert.alert('Error', 'Please select a customer');
            return;
        }

        const validItems = items.filter(item =>
            item.description && item.quantity && item.unitPrice
        );

        if (validItems.length === 0) {
            Alert.alert('Error', 'Please add at least one valid item');
            return;
        }

        try {
            setLoading(true);

            const notesParts: string[] = [];
            if (customerMessage.trim()) {
                notesParts.push(`Message to customer: ${customerMessage.trim()}`);
            }
            if (memo.trim()) {
                notesParts.push(`Memo: ${memo.trim()}`);
            }
            const combinedNotes = notesParts.join('\n\n');

            const invoiceData = {
                customerId: parseInt(customerId),
                invoiceNumber: invoiceNumber || undefined,
                invoiceDate,
                dueDate: dueDate || undefined,
                items: validItems.map(item => ({
                    description: item.description,
                    quantity: parseFloat(item.quantity),
                    unitPrice: parseFloat(item.unitPrice),
                    accountId: item.accountId ? parseInt(item.accountId) : undefined,
                    inventoryItemId: item.inventoryItemId ? parseInt(item.inventoryItemId) : undefined,
                })),
                tax: parseFloat(tax) || 0,
                discount: parseFloat(discount) || 0,
                notes: combinedNotes || undefined,
                status: 'UNPAID'
            };

            const created = await apiService.createInvoice(invoiceData);

            if (mode === 'saveAndNew') {
                Alert.alert('Success', 'Invoice created successfully');
                resetForm();
            } else if (mode === 'print') {
                Alert.alert('Saved', 'Invoice created. Print & share will be added in the next phase.');
            } else {
                Alert.alert('Success', 'Invoice created successfully', [
                    { text: 'OK', onPress: () => router.back() }
                ]);
            }
        } catch (error) {
            console.error('Error creating invoice:', error);
            Alert.alert('Error', (error as any).error || 'Failed to create invoice');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = () => submitInvoice('save');
    const handleSaveAndNew = () => submitInvoice('saveAndNew');
    const handlePrintShare = () => submitInvoice('print');
    const handleClear = () => {
        resetForm();
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#f59e0b" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Create Invoice</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Customer Selection */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Customer Information</Text>

                    <Text style={styles.label}>Filter by business type</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
                        {['', 'retail', 'wholesale', 'corporate', 'individual', 'government', 'nonprofit'].map((type) => (
                            <TouchableOpacity
                                key={type || 'all'}
                                style={[styles.filterChip, businessTypeFilter === type && styles.filterChipActive]}
                                onPress={() => setBusinessTypeFilter(type)}
                            >
                                <Text style={[styles.filterChipText, businessTypeFilter === type && styles.filterChipTextActive]}>
                                    {type === '' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <Text style={styles.label}>Customer *</Text>
                    <View style={styles.pickerContainer}>
                        <Ionicons name="person-outline" size={20} color="#6b7280" />
                        <Picker
                            selectedValue={customerId}
                            onValueChange={(value) => setCustomerId(value ?? '')}
                            style={styles.picker}
                            prompt="Select Customer"
                        >
                            <Picker.Item label="Select Customer" value="" />
                            {(customers ?? []).map((customer: any) => (
                                <Picker.Item
                                    key={customer.id}
                                    label={customer.companyName || customer.name}
                                    value={String(customer.id)}
                                />
                            ))}
                        </Picker>
                    </View>

                    <Text style={styles.label}>Invoice Number</Text>
                    <View style={styles.inputContainer}>
                        <Ionicons name="document-text-outline" size={20} color="#6b7280" />
                        <TextInput
                            style={styles.input}
                            placeholder="Auto-generated if empty"
                            value={invoiceNumber}
                            onChangeText={setInvoiceNumber}
                        />
                    </View>

                    <View style={styles.row}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                            <Text style={styles.label}>Invoice Date *</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="calendar-outline" size={20} color="#6b7280" />
                                <TextInput
                                    style={styles.input}
                                    value={invoiceDate}
                                    onChangeText={setInvoiceDate}
                                    placeholder="YYYY-MM-DD"
                                />
                            </View>
                        </View>
                        <View style={{ flex: 1, marginLeft: 8 }}>
                            <Text style={styles.label}>Due Date</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="calendar-outline" size={20} color="#6b7280" />
                                <TextInput
                                    style={styles.input}
                                    value={dueDate}
                                    onChangeText={setDueDate}
                                    placeholder="Auto from payment terms"
                                />
                            </View>
                            <Text style={styles.hint}>Set from customer payment terms when customer is selected</Text>
                        </View>
                    </View>
                </View>

                {/* Line Items */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Items</Text>
                        <TouchableOpacity onPress={addItem} style={styles.addItemButton}>
                            <Ionicons name="add" size={20} color="#2563eb" />
                            <Text style={styles.addItemText}>Add Item</Text>
                        </TouchableOpacity>
                    </View>

                    {items.map((item, index) => (
                        <View key={index} style={styles.itemCard}>
                            <View style={styles.itemHeader}>
                                <Text style={styles.itemNumber}>Item {index + 1}</Text>
                                {items.length > 1 && (
                                    <TouchableOpacity onPress={() => removeItem(index)}>
                                        <Ionicons name="trash-outline" size={20} color="#ef4444" />
                                    </TouchableOpacity>
                                )}
                            </View>

                            <Text style={styles.label}>Inventory Item (Optional)</Text>
                            <View style={styles.pickerContainer}>
                                <Ionicons name="cube-outline" size={20} color="#6b7280" />
                                <Picker
                                    selectedValue={item.inventoryItemId ? String(item.inventoryItemId) : ''}
                                    onValueChange={(value) => updateItem(index, 'inventoryItemId', value || '')}
                                    style={styles.picker}
                                    prompt="Select Inventory Item"
                                >
                                    <Picker.Item label="Select Inventory Item" value="" />
                                    {(inventoryItems ?? []).map((invItem: any) => (
                                        <Picker.Item
                                            key={invItem.id}
                                            label={`${invItem.name} - ${invItem.sku || ''}`}
                                            value={String(invItem.id)}
                                        />
                                    ))}
                                </Picker>
                            </View>

                            <Text style={styles.label}>Description *</Text>
                            <TextInput
                                style={styles.textArea}
                                placeholder="Item description"
                                value={item.description}
                                onChangeText={(value) => updateItem(index, 'description', value)}
                                multiline
                                numberOfLines={2}
                            />

                            <Text style={styles.label}>Revenue Account</Text>
                            <View style={styles.pickerContainer}>
                                <Ionicons name="folder-outline" size={20} color="#6b7280" />
                                <Picker
                                    selectedValue={item.accountId ? String(item.accountId) : ''}
                                    onValueChange={(value) => updateItem(index, 'accountId', value || '')}
                                    style={styles.picker}
                                    prompt="Select Account"
                                >
                                    <Picker.Item label="Select Account" value="" />
                                    {(accounts ?? []).map((account: any) => (
                                        <Picker.Item
                                            key={account.id}
                                            label={`${account.code || ''} - ${account.name}`}
                                            value={String(account.id)}
                                        />
                                    ))}
                                </Picker>
                            </View>

                            <View style={styles.row}>
                                <View style={{ flex: 1, marginRight: 8 }}>
                                    <Text style={styles.label}>Quantity *</Text>
                                    <TextInput
                                        style={styles.inputSmall}
                                        placeholder="0"
                                        value={item.quantity}
                                        onChangeText={(value) => updateItem(index, 'quantity', value)}
                                        keyboardType="decimal-pad"
                                    />
                                </View>
                                <View style={{ flex: 1, marginLeft: 8 }}>
                                    <Text style={styles.label}>Unit Price *</Text>
                                    <TextInput
                                        style={styles.inputSmall}
                                        placeholder="0.00"
                                        value={item.unitPrice}
                                        onChangeText={(value) => updateItem(index, 'unitPrice', value)}
                                        keyboardType="decimal-pad"
                                    />
                                </View>
                            </View>

                            <View style={styles.itemTotal}>
                                <Text style={styles.itemTotalLabel}>Amount:</Text>
                                <Text style={styles.itemTotalValue}>
                                    KES {((parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0)).toLocaleString()}
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Totals */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Discount &amp; Tax</Text>

                    <View style={styles.row}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                            <Text style={styles.label}>Discount</Text>
                            <TextInput
                                style={styles.inputSmall}
                                placeholder="0"
                                value={discount}
                                onChangeText={setDiscount}
                                keyboardType="decimal-pad"
                            />
                        </View>
                        <View style={{ flex: 1, marginLeft: 8 }}>
                            <Text style={styles.label}>VAT</Text>
                            <TextInput
                                style={styles.inputSmall}
                                placeholder="0"
                                value={tax}
                                onChangeText={setTax}
                                keyboardType="decimal-pad"
                            />
                            <Text style={styles.hint}>Default {DEFAULT_TAX_PERCENT}%. Editable per invoice.</Text>
                        </View>
                    </View>

                    <View style={styles.totalCard}>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Subtotal:</Text>
                            <Text style={styles.totalValue}>KES {calculateSubtotal().toLocaleString()}</Text>
                        </View>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Discount:</Text>
                            <Text style={styles.totalValue}>KES {(parseFloat(discount) || 0).toLocaleString()}</Text>
                        </View>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>VAT:</Text>
                            <Text style={styles.totalValue}>KES {(parseFloat(tax) || 0).toLocaleString()}</Text>
                        </View>
                        <View style={[styles.totalRow, styles.grandTotal]}>
                            <Text style={styles.grandTotalLabel}>Invoiced Total:</Text>
                            <Text style={styles.grandTotalValue}>KES {calculateTotal().toLocaleString()}</Text>
                        </View>
                    </View>
                </View>

                {/* Message & Memo */}
                <View style={styles.section}>
                    <Text style={styles.label}>Message to Customer</Text>
                    <TextInput
                        style={styles.textArea}
                        placeholder="This will appear on the invoice..."
                        value={customerMessage}
                        onChangeText={setCustomerMessage}
                        multiline
                        numberOfLines={3}
                    />

                    <Text style={styles.label}>Memo</Text>
                    <TextInput
                        style={styles.textArea}
                        placeholder="Internal notes (not shown to customer)"
                        value={memo}
                        onChangeText={setMemo}
                        multiline
                        numberOfLines={3}
                    />
                </View>

                {/* Footer Buttons */}
                <View style={styles.footerButtonsRow}>
                    <TouchableOpacity
                        style={[styles.footerButton, styles.footerButtonClear]}
                        onPress={handleClear}
                        disabled={loading}
                    >
                        <Text style={styles.footerButtonClearText}>Clear</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.footerButton, styles.footerButtonOutline]}
                        onPress={handleSaveAndNew}
                        disabled={loading}
                    >
                        <Text style={styles.footerButtonOutlineText}>Save &amp; New</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.footerButton, styles.footerButtonOutline]}
                        onPress={handlePrintShare}
                        disabled={loading}
                    >
                        <Text style={styles.footerButtonOutlineText}>Print/Share</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.footerButton, styles.footerButtonPrimary, loading && styles.submitButtonDisabled]}
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

                <View style={{ height: 32 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#112b7a',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#112b7a',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#0b1b4f',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#fbbf24',
    },
    scrollView: {
        flex: 1,
    },
    section: {
        padding: 16,
        backgroundColor: '#ffffff',
        marginBottom: 8,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
        marginTop: 12,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        paddingHorizontal: 12,
        height: 48,
    },
    input: {
        flex: 1,
        marginLeft: 8,
        fontSize: 16,
        color: '#1f2937',
    },
    inputSmall: {
        backgroundColor: '#f9fafb',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        paddingHorizontal: 12,
        height: 48,
        fontSize: 16,
        color: '#1f2937',
    },
    textArea: {
        backgroundColor: '#f9fafb',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        padding: 12,
        fontSize: 16,
        color: '#1f2937',
        minHeight: 80,
        textAlignVertical: 'top',
    },
    pickerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        paddingHorizontal: 12,
        height: 48,
    },
    picker: {
        flex: 1,
        marginLeft: 8,
        fontSize: 16,
        color: '#1f2937',
        backgroundColor: 'transparent',
    },
    row: {
        flexDirection: 'row',
    },
    filterRow: {
        marginBottom: 12,
        marginTop: 4,
    },
    filterChip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f3f4f6',
        marginRight: 8,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    filterChipActive: {
        backgroundColor: '#dbeafe',
        borderColor: '#2563eb',
    },
    filterChipText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#6b7280',
    },
    filterChipTextActive: {
        color: '#2563eb',
    },
    hint: {
        fontSize: 11,
        color: '#9ca3af',
        marginTop: 4,
        marginLeft: 0,
    },
    addItemButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: '#eff6ff',
    },
    addItemText: {
        marginLeft: 4,
        fontSize: 14,
        fontWeight: '600',
        color: '#2563eb',
    },
    itemCard: {
        backgroundColor: '#f9fafb',
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    itemNumber: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2563eb',
    },
    itemTotal: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
    },
    itemTotalLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6b7280',
    },
    itemTotalValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#10b981',
    },
    totalCard: {
        backgroundColor: '#f9fafb',
        borderRadius: 8,
        padding: 16,
        marginTop: 16,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    totalLabel: {
        fontSize: 14,
        color: '#6b7280',
    },
    totalValue: {
        fontSize: 14,
        fontWeight: '500',
        color: '#1f2937',
    },
    grandTotal: {
        borderTopWidth: 2,
        borderTopColor: '#e5e7eb',
        paddingTop: 12,
        marginTop: 8,
    },
    grandTotalLabel: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    grandTotalValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#10b981',
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#10b981',
        marginHorizontal: 16,
        marginTop: 16,
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    footerButtonsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        marginTop: 16,
    },
    footerButton: {
        height: 46,
        borderRadius: 23,
        paddingHorizontal: 12,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 70,
        marginHorizontal: 4,
    },
    footerButtonClear: {
        backgroundColor: '#e5e7eb',
        borderWidth: 1,
        borderColor: '#9ca3af',
    },
    footerButtonClearText: {
        color: '#111827',
        fontSize: 13,
        fontWeight: '600',
    },
    footerButtonOutline: {
        backgroundColor: '#f9fafb',
        borderWidth: 2,
        borderColor: '#f59e0b',
    },
    footerButtonOutlineText: {
        color: '#1d4ed8',
        fontSize: 13,
        fontWeight: '600',
    },
    footerButtonPrimary: {
        backgroundColor: '#1d4ed8',
    },
    footerButtonPrimaryText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '700',
    },
});
