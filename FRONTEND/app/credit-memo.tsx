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
import { Picker } from '@react-native-picker/picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import apiService from '@/services/api';

interface Invoice {
    id: number;
    invoiceNumber: string;
    total: number;
    customer: { id: number; name: string };
    items: InvoiceItem[];
    paidAmount: number;
    status: string;
}

interface InvoiceItem {
    id: number;
    description: string;
    quantity: number;
    unitPrice: number;
    inventoryItemId?: number;
    inventoryItem?: {
        id: number;
        name: string;
        sku: string;
    };
}

interface ReturnItem {
    invoiceItemId: number;
    inventoryItemId?: number;
    description: string;
    maxQuantity: number;
    returnQuantity: string;
    unitPrice: number;
    selected: boolean;
}

export default function CreditMemoScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);

    // Form state
    const [invoiceId, setInvoiceId] = useState('');
    const [creditMemoNumber, setCreditMemoNumber] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        loadInvoices();
        generateCreditMemoNumber();
    }, []);

    useEffect(() => {
        if (invoiceId && invoices.length > 0) {
            const invoice = invoices.find(i => i.id.toString() === invoiceId);
            setSelectedInvoice(invoice || null);
            if (invoice) {
                // Convert invoice items to return items
                const items: ReturnItem[] = invoice.items.map(item => ({
                    invoiceItemId: item.id,
                    inventoryItemId: item.inventoryItemId,
                    description: item.description,
                    maxQuantity: item.quantity,
                    returnQuantity: '',
                    unitPrice: item.unitPrice,
                    selected: false,
                }));
                setReturnItems(items);
            }
        }
    }, [invoiceId, invoices]);

    const loadInvoices = async () => {
        try {
            setLoading(true);
            // Only get paid/partial invoices that can be credited
            const data = await apiService.request<Invoice[]>('/invoices?status=PAID,PARTIAL');
            setInvoices(data || []);
        } catch (error) {
            console.error('Error loading invoices:', error);
            // Try without filter
            try {
                const data = await apiService.request<Invoice[]>('/invoices');
                setInvoices(data || []);
            } catch (e) {
                Alert.alert('Error', 'Failed to load invoices');
            }
        } finally {
            setLoading(false);
        }
    };

    const generateCreditMemoNumber = () => {
        const prefix = 'CM';
        const timestamp = Date.now().toString(36).toUpperCase();
        setCreditMemoNumber(`${prefix}-${timestamp}`);
    };

    const toggleItemSelection = (index: number) => {
        const updated = [...returnItems];
        updated[index].selected = !updated[index].selected;
        if (updated[index].selected && !updated[index].returnQuantity) {
            updated[index].returnQuantity = updated[index].maxQuantity.toString();
        }
        setReturnItems(updated);
    };

    const updateReturnQuantity = (index: number, value: string) => {
        const updated = [...returnItems];
        updated[index].returnQuantity = value;
        setReturnItems(updated);
    };

    const calculateTotal = () => {
        return returnItems
            .filter(item => item.selected && parseFloat(item.returnQuantity) > 0)
            .reduce((sum, item) => {
                const qty = parseFloat(item.returnQuantity) || 0;
                return sum + (qty * item.unitPrice);
            }, 0);
    };

    const getSelectedItems = () => {
        return returnItems.filter(item =>
            item.selected &&
            parseFloat(item.returnQuantity) > 0 &&
            item.inventoryItemId
        );
    };

    const handleSubmit = async () => {
        if (!invoiceId) {
            Alert.alert('Error', 'Please select an invoice');
            return;
        }

        const selectedItems = getSelectedItems();
        if (selectedItems.length === 0) {
            Alert.alert('Error', 'Please select at least one item to return');
            return;
        }

        // Validate quantities
        for (const item of selectedItems) {
            const qty = parseFloat(item.returnQuantity);
            if (qty > item.maxQuantity) {
                Alert.alert('Error', `Return quantity for "${item.description}" exceeds original quantity`);
                return;
            }
        }

        try {
            setSubmitting(true);

            const creditMemoData = {
                invoiceId: parseInt(invoiceId),
                creditMemoNumber,
                items: selectedItems.map(item => ({
                    inventoryItemId: item.inventoryItemId,
                    quantity: parseFloat(item.returnQuantity),
                    sellingPrice: item.unitPrice,
                })),
                notes,
            };

            await apiService.request('/inventory/credit-memo', {
                method: 'POST',
                body: JSON.stringify(creditMemoData),
            });

            Alert.alert(
                '✅ Credit Memo Created',
                `Successfully processed return for ${selectedItems.length} item(s). Total refund: KES ${calculateTotal().toLocaleString()}`,
                [{ text: 'OK', onPress: () => router.back() }]
            );
        } catch (error: any) {
            console.error('Error creating credit memo:', error);
            Alert.alert('Error', error.error || 'Failed to process return');
        } finally {
            setSubmitting(false);
        }
    };

    const formatCurrency = (amount: number) => `KES ${amount.toLocaleString()}`;

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#ef4444" />
                    <Text style={styles.loadingText}>Loading invoices...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <LinearGradient
                colors={['#ef4444', '#dc2626', '#b91c1c']}
                style={styles.header}
            >
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>Credit Memo</Text>
                    <Text style={styles.headerSubtitle}>Process customer return</Text>
                </View>
                <View style={styles.headerIcon}>
                    <Ionicons name="return-down-back" size={32} color="rgba(255,255,255,0.3)" />
                </View>
            </LinearGradient>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Credit Memo Number */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Credit Memo Details</Text>
                    <View style={styles.creditMemoCard}>
                        <Ionicons name="document-text" size={24} color="#ef4444" />
                        <View style={styles.creditMemoInfo}>
                            <Text style={styles.creditMemoLabel}>Credit Memo #</Text>
                            <Text style={styles.creditMemoNumber}>{creditMemoNumber}</Text>
                        </View>
                    </View>
                </View>

                {/* Invoice Selection */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Original Invoice</Text>
                    <View style={styles.pickerContainer}>
                        <Ionicons name="receipt-outline" size={20} color="#6b7280" />
                        <Picker
                            selectedValue={invoiceId}
                            onValueChange={(value) => setInvoiceId(value)}
                            style={styles.picker}
                        >
                            <Picker.Item label="Select an invoice..." value="" />
                            {invoices.map(invoice => (
                                <Picker.Item
                                    key={invoice.id}
                                    label={`${invoice.invoiceNumber} - ${invoice.customer?.name || 'Unknown'} (${formatCurrency(invoice.total)})`}
                                    value={invoice.id.toString()}
                                />
                            ))}
                        </Picker>
                    </View>

                    {/* Selected Invoice Summary */}
                    {selectedInvoice && (
                        <View style={styles.invoiceSummary}>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Customer:</Text>
                                <Text style={styles.summaryValue}>{selectedInvoice.customer?.name}</Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Original Total:</Text>
                                <Text style={styles.summaryValue}>{formatCurrency(selectedInvoice.total)}</Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Status:</Text>
                                <View style={[
                                    styles.statusBadge,
                                    selectedInvoice.status === 'PAID' && styles.statusPaid,
                                    selectedInvoice.status === 'PARTIAL' && styles.statusPartial,
                                ]}>
                                    <Text style={styles.statusText}>{selectedInvoice.status}</Text>
                                </View>
                            </View>
                        </View>
                    )}
                </View>

                {/* Return Items */}
                {selectedInvoice && returnItems.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Items to Return</Text>
                        <Text style={styles.sectionSubtitle}>Select items and specify return quantities</Text>

                        {returnItems.map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.itemCard,
                                    item.selected && styles.itemCardSelected
                                ]}
                                onPress={() => toggleItemSelection(index)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.itemHeader}>
                                    <View style={[
                                        styles.checkbox,
                                        item.selected && styles.checkboxSelected
                                    ]}>
                                        {item.selected && (
                                            <Ionicons name="checkmark" size={16} color="#fff" />
                                        )}
                                    </View>
                                    <View style={styles.itemInfo}>
                                        <Text style={styles.itemDescription}>{item.description}</Text>
                                        {!item.inventoryItemId && (
                                            <Text style={styles.itemNote}>⚠️ Not an inventory item</Text>
                                        )}
                                    </View>
                                    <Text style={styles.itemPrice}>{formatCurrency(item.unitPrice)}</Text>
                                </View>

                                {item.selected && item.inventoryItemId && (
                                    <View style={styles.quantityRow}>
                                        <View style={styles.quantityInfo}>
                                            <Text style={styles.quantityLabel}>Original Qty:</Text>
                                            <Text style={styles.quantityValue}>{item.maxQuantity}</Text>
                                        </View>
                                        <View style={styles.returnQtyContainer}>
                                            <Text style={styles.returnQtyLabel}>Return Qty:</Text>
                                            <TextInput
                                                style={styles.returnQtyInput}
                                                value={item.returnQuantity}
                                                onChangeText={(value) => updateReturnQuantity(index, value)}
                                                keyboardType="decimal-pad"
                                                placeholder="0"
                                                placeholderTextColor="#9ca3af"
                                            />
                                        </View>
                                        <View style={styles.refundAmount}>
                                            <Text style={styles.refundLabel}>Refund:</Text>
                                            <Text style={styles.refundValue}>
                                                {formatCurrency((parseFloat(item.returnQuantity) || 0) * item.unitPrice)}
                                            </Text>
                                        </View>
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* Notes */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Notes</Text>
                    <TextInput
                        style={styles.notesInput}
                        placeholder="Reason for return, condition of items, etc..."
                        value={notes}
                        onChangeText={setNotes}
                        multiline
                        numberOfLines={3}
                        placeholderTextColor="#9ca3af"
                    />
                </View>

                {/* Total */}
                {getSelectedItems().length > 0 && (
                    <View style={styles.totalCard}>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Items to Return:</Text>
                            <Text style={styles.totalValue}>{getSelectedItems().length}</Text>
                        </View>
                        <View style={[styles.totalRow, styles.grandTotalRow]}>
                            <Text style={styles.grandTotalLabel}>Total Refund:</Text>
                            <Text style={styles.grandTotalValue}>{formatCurrency(calculateTotal())}</Text>
                        </View>
                    </View>
                )}

                {/* Accounting Info */}
                <View style={styles.infoCard}>
                    <Ionicons name="information-circle" size={24} color="#3b82f6" />
                    <View style={styles.infoContent}>
                        <Text style={styles.infoTitle}>Accounting Impact</Text>
                        <Text style={styles.infoText}>
                            This credit memo will:{'\n'}
                            • Reverse the revenue entry (DR Sales Returns, CR AR){'\n'}
                            • Return items to inventory (DR Inventory, CR COGS){'\n'}
                            • Update inventory quantities and valuation
                        </Text>
                    </View>
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                    style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={submitting || getSelectedItems().length === 0}
                >
                    {submitting ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Ionicons name="return-down-back" size={24} color="#fff" />
                            <Text style={styles.submitButtonText}>Process Return</Text>
                        </>
                    )}
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#6b7280',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 20,
        paddingTop: 10,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerContent: {
        flex: 1,
        marginLeft: 16,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 4,
    },
    headerIcon: {
        opacity: 0.5,
    },
    scrollView: {
        flex: 1,
    },
    section: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginTop: 16,
        padding: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontSize: 13,
        color: '#6b7280',
        marginBottom: 12,
    },
    creditMemoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fef2f2',
        padding: 16,
        borderRadius: 12,
        marginTop: 12,
        gap: 12,
    },
    creditMemoInfo: {
        flex: 1,
    },
    creditMemoLabel: {
        fontSize: 12,
        color: '#6b7280',
    },
    creditMemoNumber: {
        fontSize: 18,
        fontWeight: '700',
        color: '#ef4444',
    },
    pickerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        paddingHorizontal: 12,
        height: 56,
        marginTop: 12,
    },
    picker: {
        flex: 1,
        marginLeft: 8,
        fontSize: 16,
        color: '#1f2937',
    },
    invoiceSummary: {
        marginTop: 16,
        padding: 16,
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    summaryLabel: {
        fontSize: 14,
        color: '#6b7280',
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1f2937',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: '#e5e7eb',
    },
    statusPaid: {
        backgroundColor: '#d1fae5',
    },
    statusPartial: {
        backgroundColor: '#fef3c7',
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#1f2937',
    },
    itemCard: {
        backgroundColor: '#f9fafb',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 2,
        borderColor: '#e5e7eb',
    },
    itemCardSelected: {
        backgroundColor: '#fef2f2',
        borderColor: '#ef4444',
    },
    itemHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#d1d5db',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    checkboxSelected: {
        backgroundColor: '#ef4444',
        borderColor: '#ef4444',
    },
    itemInfo: {
        flex: 1,
    },
    itemDescription: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1f2937',
    },
    itemNote: {
        fontSize: 12,
        color: '#f59e0b',
        marginTop: 2,
    },
    itemPrice: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6b7280',
    },
    quantityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#fecaca',
        gap: 16,
    },
    quantityInfo: {
        alignItems: 'center',
    },
    quantityLabel: {
        fontSize: 11,
        color: '#6b7280',
    },
    quantityValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1f2937',
    },
    returnQtyContainer: {
        alignItems: 'center',
    },
    returnQtyLabel: {
        fontSize: 11,
        color: '#ef4444',
        fontWeight: '600',
    },
    returnQtyInput: {
        width: 60,
        height: 36,
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#ef4444',
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '700',
        color: '#ef4444',
    },
    refundAmount: {
        flex: 1,
        alignItems: 'flex-end',
    },
    refundLabel: {
        fontSize: 11,
        color: '#6b7280',
    },
    refundValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#ef4444',
    },
    notesInput: {
        backgroundColor: '#f9fafb',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        padding: 16,
        fontSize: 16,
        color: '#1f2937',
        minHeight: 100,
        textAlignVertical: 'top',
        marginTop: 12,
    },
    totalCard: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginTop: 16,
        padding: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
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
        fontWeight: '600',
        color: '#1f2937',
    },
    grandTotalRow: {
        borderTopWidth: 2,
        borderTopColor: '#e5e7eb',
        paddingTop: 12,
        marginTop: 8,
    },
    grandTotalLabel: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1f2937',
    },
    grandTotalValue: {
        fontSize: 20,
        fontWeight: '700',
        color: '#ef4444',
    },
    infoCard: {
        flexDirection: 'row',
        backgroundColor: '#eff6ff',
        marginHorizontal: 16,
        marginTop: 16,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#bfdbfe',
        gap: 12,
    },
    infoContent: {
        flex: 1,
    },
    infoTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1e40af',
        marginBottom: 4,
    },
    infoText: {
        fontSize: 13,
        color: '#1e40af',
        lineHeight: 20,
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ef4444',
        marginHorizontal: 16,
        marginTop: 24,
        paddingVertical: 18,
        borderRadius: 16,
        gap: 8,
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
    },
});
