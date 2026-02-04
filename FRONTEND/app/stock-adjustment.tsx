import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import apiService from '@/services/api';
import { Picker } from '@react-native-picker/picker';

interface InventoryItem {
    id: number;
    name: string;
    sku: string;
    quantity: number;
    costPrice: number;
    unit: string;
}

interface ReasonOption {
    label: string;
    value: string;
}

type AdjustmentType = 'ADJUSTMENT' | 'IN' | 'OUT';

const REASONS: Record<AdjustmentType, ReasonOption[]> = {
    ADJUSTMENT: [
        { label: 'Physical Count (Stock Take)', value: 'COUNT_ADJUSTMENT' }
    ],
    IN: [
        { label: 'Purchase (New Stock)', value: 'PURCHASE' },
        { label: 'Customer Return', value: 'CUSTOMER_RETURN' },
        { label: 'Found Item', value: 'FOUND' },
        { label: 'Transfer In', value: 'TRANSFER_IN' }
    ],
    OUT: [
        { label: 'Damaged Goods', value: 'DAMAGED' },
        { label: 'Theft / Stolen', value: 'THEFT' },
        { label: 'Expired', value: 'EXPIRED' },
        { label: 'Internal Use / Sample', value: 'SAMPLE' },
        { label: 'Supplier Return', value: 'SUPPLIER_RETURN' },
        { label: 'Transfer Out', value: 'TRANSFER_OUT' }
    ]
};

export default function StockAdjustmentScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const itemId = params.itemId;

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [item, setItem] = useState<InventoryItem | null>(null);

    // Form State
    const [type, setType] = useState<AdjustmentType>('ADJUSTMENT');
    const [reason, setReason] = useState('COUNT_ADJUSTMENT');
    const [quantity, setQuantity] = useState(''); // For IN/OUT this is delta, for ADJUSTMENT this is final
    const [unitCost, setUnitCost] = useState('');
    const [notes, setNotes] = useState('');

    // Computed
    const [variance, setVariance] = useState(0);

    useEffect(() => {
        loadItem();
    }, [itemId]);

    useEffect(() => {
        // Validation logic or auto-calc features could go here
        if (type === 'ADJUSTMENT' && item) {
            const enteredQty = parseFloat(quantity) || 0;
            // setVariance(enteredQty - Number(item.quantity)); // Moved to render or separate effect
            setVariance(enteredQty - item.quantity);
        }
    }, [quantity, type, item]);

    const loadItem = async () => {
        try {
            setLoading(true);
            const data = await apiService.get<InventoryItem>(`/inventory/products/${itemId}`);
            setItem(data);
            setUnitCost(data.costPrice?.toString() || '');
            // Default quantity for adjustment is current quantity
            if (type === 'ADJUSTMENT' && data.quantity !== undefined) {
                setQuantity(data.quantity.toString());
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to load item details');
            router.back();
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!quantity) {
            Alert.alert('Missing Field', 'Please enter a quantity');
            return;
        }

        try {
            setSubmitting(true);

            // Construct payload
            const payload = {
                itemId: parseInt(itemId as string),
                type,
                reason,
                quantity: parseFloat(quantity),
                unitCost: unitCost ? parseFloat(unitCost) : undefined,
                notes,
                date: new Date()
            };

            await apiService.post('/inventory/adjust', payload);

            Alert.alert('Success', 'Stock adjusted successfully', [
                { text: 'OK', onPress: () => router.back() }
            ]);

        } catch (error: any) {
            console.error('Adjustment error:', error);
            Alert.alert('Error', error.message || error.error || 'Failed to adjust stock');
        } finally {
            setSubmitting(false);
        }
    };

    const handleTypeChange = (newType: AdjustmentType) => {
        setType(newType);

        // Reset defaults based on type
        if (newType === 'ADJUSTMENT' && item) {
            setReason('COUNT_ADJUSTMENT');
            setQuantity(item.quantity.toString());
        } else if (newType === 'IN') {
            setReason('PURCHASE');
            setQuantity('');
        } else {
            setReason('DAMAGED');
            setQuantity('');
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 50 }} />
            </SafeAreaView>
        );
    }

    if (!item) {
        return (
            <SafeAreaView style={styles.container}>
                <Text style={{ textAlign: 'center', marginTop: 20 }}>Item not found</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="close" size={24} color="#1f2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Adjust Stock</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={styles.content}
                keyboardShouldPersistTaps="handled"
            >
                {/* Product Summary Card */}
                <View style={styles.productCard}>
                    <View style={styles.iconCircle}>
                        <Ionicons name="cube" size={24} color="#2563eb" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.productName}>{item.name}</Text>
                        <Text style={styles.productSku}>{item.sku}</Text>
                        <View style={styles.statusRow}>
                            <Text style={styles.currentLabel}>Current Stock:</Text>
                            <Text style={styles.currentValue}>{item.quantity.toLocaleString()} {item.unit}</Text>
                        </View>
                    </View>
                </View>

                {/* Adjustment Type Tabs */}
                <View style={styles.tabs}>
                    <TouchableOpacity
                        style={[styles.tab, type === 'ADJUSTMENT' && styles.tabActive]}
                        onPress={() => handleTypeChange('ADJUSTMENT')}
                    >
                        <Text style={[styles.tabText, type === 'ADJUSTMENT' && styles.tabTextActive]}>Stock Take</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, type === 'IN' && styles.tabActive]}
                        onPress={() => handleTypeChange('IN')}
                    >
                        <Text style={[styles.tabText, type === 'IN' && styles.tabTextActive]}>Stock In (+)</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, type === 'OUT' && styles.tabActive]}
                        onPress={() => handleTypeChange('OUT')}
                    >
                        <Text style={[styles.tabText, type === 'OUT' && styles.tabTextActive]}>Stock Out (-)</Text>
                    </TouchableOpacity>
                </View>

                {/* Form Fields */}
                <View style={styles.form}>

                    {/* Reason Select */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Reason</Text>
                        <View style={styles.pickerContainer}>
                            <Picker
                                selectedValue={reason}
                                onValueChange={(val) => setReason(val)}
                                style={styles.picker}
                            >
                                {(REASONS[type] || []).map((r) => (
                                    <Picker.Item key={r.value} label={r.label} value={r.value} />
                                ))}
                            </Picker>
                        </View>
                    </View>

                    {/* Quantity Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>
                            {type === 'ADJUSTMENT' ? 'Actual Count (Total)' : 'Quantity to Move'}
                        </Text>
                        <TextInput
                            style={[styles.input, styles.largeInput]}
                            value={quantity}
                            onChangeText={setQuantity}
                            keyboardType="numeric"
                            placeholder="0"
                            autoFocus
                        />
                        {type === 'ADJUSTMENT' && (
                            <Text style={[
                                styles.helperText,
                                variance < 0 ? { color: '#ef4444' } : { color: '#10b981' }
                            ]}>
                                Variance: {variance > 0 ? '+' : ''}{variance} {item.unit}
                            </Text>
                        )}
                    </View>

                    {/* Cost Input (Usually needed for IN or variance > 0) */}
                    {(type === 'IN' || (type === 'ADJUSTMENT' && variance > 0)) && (
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Unit Cost (Required for Stock In)</Text>
                            <TextInput
                                style={styles.input}
                                value={unitCost}
                                onChangeText={setUnitCost}
                                keyboardType="numeric"
                                placeholder="0.00"
                            />
                            <Text style={styles.helperText}>
                                Adjusting cost automatically updates Weighted Avg Cost.
                            </Text>
                        </View>
                    )}

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Notes / Reference</Text>
                        <TextInput
                            style={[styles.input, { height: 80 }]}
                            value={notes}
                            onChangeText={setNotes}
                            placeholder="e.g. PO #1234 or 'Found in warehouse'"
                            multiline
                        />
                    </View>

                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.submitButton, submitting && styles.buttonDisabled]}
                    onPress={handleSave}
                    disabled={submitting}
                >
                    {submitting ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.submitButtonText}>
                            {type === 'ADJUSTMENT' ? 'Update Count' : type === 'IN' ? 'Receive Stock' : 'Remove Stock'}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f3f4f6',
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
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    productCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 20,
        alignItems: 'center',
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#eff6ff',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    productName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    productSku: {
        fontSize: 13,
        color: '#6b7280',
        marginBottom: 8,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    currentLabel: {
        fontSize: 13,
        color: '#6b7280',
    },
    currentValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1f2937',
        backgroundColor: '#f3f4f6',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    tabs: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        padding: 4,
        borderRadius: 12,
        marginBottom: 20,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8,
    },
    tabActive: {
        backgroundColor: '#2563eb',
    },
    tabText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#6b7280',
    },
    tabTextActive: {
        color: '#fff',
        fontWeight: '600',
    },
    form: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 40,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        color: '#1f2937',
    },
    largeInput: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        paddingVertical: 16,
        color: '#2563eb',
    },
    helperText: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 4,
        textAlign: 'right',
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        ...Platform.select({
            ios: { height: 100 },
            android: { height: 50 },
            web: { height: 40 }
        })
    },
    picker: {
        ...Platform.select({
            web: {
                height: 40,
                width: '100%',
                border: 'none',
                backgroundColor: 'transparent'
            }
        })
    },
    footer: {
        padding: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
    },
    submitButton: {
        backgroundColor: '#2563eb',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
