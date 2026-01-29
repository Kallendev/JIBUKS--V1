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
    Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import apiService from '@/services/api';

export default function NewPurchaseScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    // State with types
    const [vendors, setVendors] = useState<any[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [items, setItems] = useState<any[]>([
        { description: '', quantity: '', unitPrice: '', accountId: '' }
    ]);
    const [tax, setTax] = useState('0');
    const [discount, setDiscount] = useState('0');

    // Form state
    const [vendorId, setVendorId] = useState('');
    const [billNumber, setBillNumber] = useState('');
    const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
    const [dueDate, setDueDate] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [vendorsData, accountsData] = await Promise.all([
                apiService.request<any[]>('/vendors'),
                apiService.request<any[]>('/accounts')
            ]);

            console.log('✅ Vendors loaded:', vendorsData?.length || 0);
            console.log('✅ Accounts loaded:', accountsData?.length || 0);

            setVendors(vendorsData || []);
            // Filter for expense accounts
            setAccounts(accountsData?.filter((a: any) => a.type === 'EXPENSE' || a.type === 'ASSET') || []);

            // Show warning if no vendors
            if (!vendorsData || vendorsData.length === 0) {
                Alert.alert(
                    'No Vendors Found',
                    'You need to create a vendor first. Would you like to create one now?',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Create Vendor', onPress: () => router.push('/vendors') }
                    ]
                );
            }
        } catch (error: any) {
            console.error('❌ Error loading data:', error);
            Alert.alert('Error', `Failed to load data: ${error.message || 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    const addItem = () => {
        setItems([...items, { description: '', quantity: '', unitPrice: '', accountId: '' }]);
    };

    const removeItem = (index: number) => {
        if (items.length === 1) {
            Alert.alert('Error', 'At least one item is required');
            return;
        }
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
    };

    const updateItem = (index: number, field: string, value: string) => {
        const newItems = [...items];
        newItems[index][field] = value;
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

    const handleSubmit = async () => {
        // Validation
        if (!vendorId) {
            Alert.alert('Error', 'Please select a vendor');
            return;
        }

        // Check each item for missing fields
        const invalidItems = items.map((item, index) => {
            const errors = [];
            if (!item.description) errors.push('description');
            if (!item.quantity) errors.push('quantity');
            if (!item.unitPrice) errors.push('unit price');
            if (!item.accountId) errors.push('account');

            if (errors.length > 0) {
                return { index: index + 1, errors };
            }
            return null;
        }).filter(Boolean);

        if (invalidItems.length > 0) {
            const errorMessages = invalidItems.map(item =>
                `Item ${item.index}: Missing ${item.errors.join(', ')}`
            ).join('\n');
            Alert.alert('Incomplete Items', errorMessages);
            return;
        }

        const validItems = items.filter(item =>
            item.description && item.quantity && item.unitPrice && item.accountId
        );

        try {
            setLoading(true);

            const purchaseData = {
                vendorId: parseInt(vendorId),
                billNumber: billNumber || undefined,
                purchaseDate,
                dueDate: dueDate || undefined,
                items: validItems.map(item => {
                    // Parse accountId - if it's a mock string ID, parseInt will return NaN
                    const accountId = parseInt(item.accountId);
                    if (isNaN(accountId)) {
                        throw new Error(`Invalid account ID: ${item.accountId}. Please make sure you're logged in and accounts are loaded from the backend.`);
                    }

                    return {
                        description: item.description,
                        quantity: parseFloat(item.quantity),
                        unitPrice: parseFloat(item.unitPrice),
                        accountId
                    };
                }),
                tax: parseFloat(tax) || 0,
                discount: parseFloat(discount) || 0,
                notes: notes || undefined,
                status: 'UNPAID'
            };

            await apiService.request('/purchases', {
                method: 'POST',
                body: JSON.stringify(purchaseData)
            });

            Alert.alert('Success', 'Purchase created successfully', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error: any) {
            console.error('Error creating purchase:', error);
            Alert.alert('Error', error.error || 'Failed to create purchase');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1f2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>New Purchase</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Vendor Selection */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Vendor Information</Text>
                        {vendors.length === 0 && (
                            <TouchableOpacity
                                onPress={() => router.push('/vendors')}
                                style={styles.addVendorButton}
                            >
                                <Ionicons name="add" size={18} color="#2563eb" />
                                <Text style={styles.addVendorText}>Add Vendor</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <Text style={styles.label}>Vendor *</Text>
                    <View style={styles.pickerContainer}>
                        <Ionicons name="person-outline" size={20} color="#6b7280" />
                        <Picker
                            selectedValue={vendorId}
                            onValueChange={(value) => setVendorId(value)}
                            style={styles.picker}
                        >
                            <Picker.Item label="Select Vendor" value="" />
                            {vendors.map(vendor => (
                                <Picker.Item
                                    key={vendor.id}
                                    label={vendor.name}
                                    value={vendor.id.toString()}
                                />
                            ))}
                        </Picker>
                    </View>

                    <Text style={styles.label}>Bill Number</Text>
                    <View style={styles.inputContainer}>
                        <Ionicons name="document-text-outline" size={20} color="#6b7280" />
                        <TextInput
                            style={styles.input}
                            placeholder="Enter bill number"
                            value={billNumber}
                            onChangeText={setBillNumber}
                        />
                    </View>

                    <View style={styles.row}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                            <Text style={styles.label}>Purchase Date *</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="calendar-outline" size={20} color="#6b7280" />
                                <TextInput
                                    style={styles.input}
                                    value={purchaseDate}
                                    onChangeText={setPurchaseDate}
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
                                    placeholder="YYYY-MM-DD"
                                />
                            </View>
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

                            <Text style={styles.label}>Description *</Text>
                            <TextInput
                                style={styles.textArea}
                                placeholder="Item description"
                                value={item.description}
                                onChangeText={(value) => updateItem(index, 'description', value)}
                                multiline
                                numberOfLines={2}
                            />

                            <Text style={styles.label}>Account *</Text>
                            <View style={styles.pickerContainer}>
                                <Ionicons name="folder-outline" size={20} color="#6b7280" />
                                <Picker
                                    selectedValue={item.accountId}
                                    onValueChange={(value) => updateItem(index, 'accountId', value)}
                                    style={styles.picker}
                                >
                                    <Picker.Item label="Select Account" value="" />
                                    {accounts.map(account => (
                                        <Picker.Item
                                            key={account.id}
                                            label={`${account.code} - ${account.name}`}
                                            value={account.id.toString()}
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
                    <Text style={styles.sectionTitle}>Totals</Text>

                    <View style={styles.row}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                            <Text style={styles.label}>Tax</Text>
                            <TextInput
                                style={styles.inputSmall}
                                placeholder="0.00"
                                value={tax}
                                onChangeText={setTax}
                                keyboardType="decimal-pad"
                            />
                        </View>
                        <View style={{ flex: 1, marginLeft: 8 }}>
                            <Text style={styles.label}>Discount</Text>
                            <TextInput
                                style={styles.inputSmall}
                                placeholder="0.00"
                                value={discount}
                                onChangeText={setDiscount}
                                keyboardType="decimal-pad"
                            />
                        </View>
                    </View>

                    <View style={styles.totalCard}>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Subtotal:</Text>
                            <Text style={styles.totalValue}>KES {calculateSubtotal().toLocaleString()}</Text>
                        </View>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Tax:</Text>
                            <Text style={styles.totalValue}>KES {(parseFloat(tax) || 0).toLocaleString()}</Text>
                        </View>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Discount:</Text>
                            <Text style={styles.totalValue}>- KES {(parseFloat(discount) || 0).toLocaleString()}</Text>
                        </View>
                        <View style={[styles.totalRow, styles.grandTotal]}>
                            <Text style={styles.grandTotalLabel}>Total:</Text>
                            <Text style={styles.grandTotalValue}>KES {calculateTotal().toLocaleString()}</Text>
                        </View>
                    </View>
                </View>

                {/* Notes */}
                <View style={styles.section}>
                    <Text style={styles.label}>Notes</Text>
                    <TextInput
                        style={styles.textArea}
                        placeholder="Additional notes..."
                        value={notes}
                        onChangeText={setNotes}
                        multiline
                        numberOfLines={3}
                    />
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                    style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Ionicons name="checkmark-circle" size={24} color="#fff" />
                            <Text style={styles.submitButtonText}>Create Purchase</Text>
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
        backgroundColor: '#f9fafb',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f3f4f6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    scrollView: {
        flex: 1,
    },
    section: {
        padding: 16,
        backgroundColor: '#fff',
        marginBottom: 8,
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
        color: '#2563eb',
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
        color: '#2563eb',
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#2563eb',
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
    addVendorButton: {
        backgroundColor: '#10b981',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        marginLeft: 8,
    },
    addVendorText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
});
