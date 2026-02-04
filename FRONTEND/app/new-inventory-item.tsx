import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Switch,
    ActivityIndicator,
    Alert,
    Platform,
    FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import apiService, { Account } from '@/services/api';
import { Picker } from '@react-native-picker/picker';

// Define strict interface for Account usage in this form
interface AccountData {
    id: number | string;
    code: string;
    name: string;
}

export default function NewInventoryItemScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [generatingSKU, setGeneratingSKU] = useState(false);

    // Tab State: 'basic' | 'pricing' | 'inventory' | 'accounting'
    const [activeTab, setActiveTab] = useState('basic');

    // Catalog Search State
    const [catalogQuery, setCatalogQuery] = useState('');
    const [catalogResults, setCatalogResults] = useState<any[]>([]);
    const [showCatalogList, setShowCatalogList] = useState(false);

    const [accounts, setAccounts] = useState<{
        assets: AccountData[];
        income: AccountData[];
        expenses: AccountData[];
    }>({
        assets: [],
        income: [],
        expenses: []
    });

    // Form Data
    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        barcode: '',
        category: '',
        productType: 'GOODS', // GOODS, SERVICE
        unit: 'pcs',
        description: '',

        // Pricing
        costPrice: '',
        sellingPrice: '',
        taxRate: '16',
        isTaxInclusive: true,

        // Inventory
        initialQuantity: '',
        reorderLevel: '10',
        maxStockLevel: '',

        // Accounting
        assetAccountId: '',
        cogsAccountId: '',
        incomeAccountId: '',
    });

    useEffect(() => {
        loadAccounts();
    }, []);

    const loadAccounts = async () => {
        try {
            const [assets, income, expenses] = await Promise.all([
                apiService.get<AccountData[]>('/accounts', { params: { type: 'ASSET' } }),
                apiService.get<AccountData[]>('/accounts', { params: { type: 'INCOME' } }),
                apiService.get<AccountData[]>('/accounts', { params: { type: 'EXPENSE' } })
            ]);

            setAccounts({
                assets: assets || [],
                income: income || [],
                expenses: expenses || []
            });

            // Set Smart Defaults
            const inventoryAsset = (assets || []).find((a: AccountData) => a.code === '1201' || a.name.includes('Inventory'));
            const salesIncome = (income || []).find((a: AccountData) => a.code === '4101' || a.name.includes('Sales'));
            const cogsExpense = (expenses || []).find((a: AccountData) => a.code === '5001' || a.name.includes('Cost of'));

            setFormData(prev => ({
                ...prev,
                assetAccountId: inventoryAsset?.id?.toString() || '',
                incomeAccountId: salesIncome?.id?.toString() || '',
                cogsAccountId: cogsExpense?.id?.toString() || ''
            }));

        } catch (error) {
            console.error('Error loading accounts:', error);
        }
    };

    const searchCatalog = async (text: string) => {
        setCatalogQuery(text);
        if (text.length < 2) {
            setCatalogResults([]);
            setShowCatalogList(false);
            return;
        }

        try {
            const results = await apiService.get<any[]>('/inventory/catalog', { params: { search: text } });
            setCatalogResults(results || []);
            setShowCatalogList(true);
        } catch (error) {
            console.error("Catalog search error", error);
        }
    };

    const selectCatalogItem = (item: any) => {
        setFormData(prev => ({
            ...prev,
            name: item.name,
            category: item.category,
            unit: item.unit,
            barcode: item.barcode || prev.barcode,
            description: item.description || ''
        }));
        setCatalogResults([]);
        setCatalogQuery('');
        setShowCatalogList(false);
    };

    const handleSave = async () => {
        if (!formData.name || !formData.costPrice || !formData.sellingPrice) {
            Alert.alert('Missing Fields', 'Name, Cost Price, and Selling Price are required.');
            return;
        }

        try {
            setLoading(true);

            // Prepare payload
            const payload = {
                ...formData,
                costPrice: Number(formData.costPrice),
                sellingPrice: Number(formData.sellingPrice),
                initialQuantity: formData.initialQuantity ? Number(formData.initialQuantity) : 0,
                // Only send specific fields if GOODS
                ...(formData.productType === 'SERVICE' ? {
                    assetAccountId: null,
                    reorderLevel: null,
                    initialQuantity: 0
                } : {}),
            };

            await apiService.post('/inventory/products', payload);

            Alert.alert('Success', 'Product created successfully', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error: any) {
            console.error('Save error:', error);
            Alert.alert('Error', error.message || error.error || 'Failed to create product');
        } finally {
            setLoading(false);
        }
    };

    const generateSKU = () => {
        setGeneratingSKU(true);
        setTimeout(() => {
            const prefix = formData.name.substring(0, 3).toUpperCase() || 'PRD';
            const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
            setFormData(prev => ({ ...prev, sku: `${prefix}-${random}` }));
            setGeneratingSKU(false);
        }, 500);
    };

    const renderTabButton = (id: string, label: string, icon: any) => (
        <TouchableOpacity
            style={[styles.tabButton, activeTab === id && styles.tabButtonActive]}
            onPress={() => setActiveTab(id)}
        >
            <Ionicons
                name={icon}
                size={20}
                color={activeTab === id ? '#2563eb' : '#6b7280'}
            />
            <Text style={[styles.tabLabel, activeTab === id && styles.tabLabelActive]}>
                {label}
            </Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="close" size={24} color="#1f2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>New Product</Text>
                <TouchableOpacity
                    style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <Text style={styles.saveButtonText}>Save</Text>
                    )}
                </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
                {renderTabButton('basic', 'Basic', 'cube-outline')}
                {renderTabButton('pricing', 'Pricing', 'pricetag-outline')}
                {formData.productType === 'GOODS' && renderTabButton('inventory', 'Stock', 'layers-outline')}
                {renderTabButton('accounting', 'Accounts', 'calculator-outline')}
            </View>

            <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">

                {/* BASIC INFO TAB */}
                {activeTab === 'basic' && (
                    <View style={styles.section}>

                        {/* Catalog Search */}
                        <View style={styles.catalogSearchContainer}>
                            <View style={styles.catalogInputWrapper}>
                                <Ionicons name="search" size={20} color="#2563eb" />
                                <TextInput
                                    style={styles.catalogInput}
                                    placeholder="Quick Fill: e.g. 'Coca Cola'..."
                                    value={catalogQuery}
                                    onChangeText={searchCatalog}
                                />
                                {catalogQuery.length > 0 && (
                                    <TouchableOpacity onPress={() => { setCatalogQuery(''); setCatalogResults([]); setShowCatalogList(false); }}>
                                        <Ionicons name="close-circle" size={18} color="#9ca3af" />
                                    </TouchableOpacity>
                                )}
                            </View>
                            {/* Results Dropdown */}
                            {showCatalogList && catalogResults.length > 0 && (
                                <View style={styles.catalogDropdown}>
                                    {catalogResults.map((item, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            style={styles.catalogItem}
                                            onPress={() => selectCatalogItem(item)}
                                        >
                                            <View>
                                                <Text style={styles.catalogItemName}>{item.name}</Text>
                                                <Text style={styles.catalogItemMeta}>{item.category} • {item.unit}</Text>
                                            </View>
                                            <Ionicons name="add-circle-outline" size={20} color="#2563eb" />
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Product Name *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. Samsung 55' TV"
                                value={formData.name}
                                onChangeText={(text) => setFormData({ ...formData, name: text })}
                            />
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.label}>SKU (Auto if empty)</Text>
                                <View style={styles.inputWithAction}>
                                    <TextInput
                                        style={[styles.input, { flex: 1, borderRightWidth: 0, borderTopRightRadius: 0, borderBottomRightRadius: 0 }]}
                                        placeholder="Auto-generated"
                                        value={formData.sku}
                                        onChangeText={(text) => setFormData({ ...formData, sku: text })}
                                    />
                                    <TouchableOpacity
                                        style={styles.actionIcon}
                                        onPress={generateSKU}
                                    >
                                        <Ionicons name="refresh" size={20} color="#6b7280" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                                <Text style={styles.label}>Barcode</Text>
                                <View style={styles.inputWithAction}>
                                    <TextInput
                                        style={[styles.input, { flex: 1, borderRightWidth: 0, borderTopRightRadius: 0, borderBottomRightRadius: 0 }]}
                                        placeholder="Scan..."
                                        value={formData.barcode}
                                        onChangeText={(text) => setFormData({ ...formData, barcode: text })}
                                    />
                                    <TouchableOpacity style={styles.actionIcon}>
                                        <Ionicons name="barcode-outline" size={20} color="#6b7280" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Product Type</Text>
                            <View style={styles.typeSelector}>
                                <TouchableOpacity
                                    style={[styles.typeOption, formData.productType === 'GOODS' && styles.typeOptionActive]}
                                    onPress={() => setFormData({ ...formData, productType: 'GOODS' })}
                                >
                                    <Ionicons name="cube" size={20} color={formData.productType === 'GOODS' ? '#2563eb' : '#6b7280'} />
                                    <Text style={[styles.typeText, formData.productType === 'GOODS' && styles.typeTextActive]}>Goods</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.typeOption, formData.productType === 'SERVICE' && styles.typeOptionActive]}
                                    onPress={() => setFormData({ ...formData, productType: 'SERVICE' })}
                                >
                                    <Ionicons name="construct" size={20} color={formData.productType === 'SERVICE' ? '#2563eb' : '#6b7280'} />
                                    <Text style={[styles.typeText, formData.productType === 'SERVICE' && styles.typeTextActive]}>Service</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Category</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. Electronics"
                                value={formData.category}
                                onChangeText={(text) => setFormData({ ...formData, category: text })}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Unit</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. pcs, kg, box"
                                value={formData.unit}
                                onChangeText={(text) => setFormData({ ...formData, unit: text })}
                            />
                        </View>
                    </View>
                )}

                {/* PRICING TAB */}
                {activeTab === 'pricing' && (
                    <View style={styles.section}>
                        <View style={styles.row}>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.label}>Cost Price *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="0.00"
                                    keyboardType="numeric"
                                    value={formData.costPrice}
                                    onChangeText={(text) => setFormData({ ...formData, costPrice: text })}
                                />
                                <Text style={styles.helpText}>Purchase price per unit</Text>
                            </View>
                            <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                                <Text style={styles.label}>Selling Price *</Text>
                                <TextInput
                                    style={[styles.input, { color: '#10b981', fontWeight: '600' }]}
                                    placeholder="0.00"
                                    keyboardType="numeric"
                                    value={formData.sellingPrice}
                                    onChangeText={(text) => setFormData({ ...formData, sellingPrice: text })}
                                />
                                <Text style={styles.helpText}>Retail price</Text>
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Profit Margin</Text>
                            <View style={styles.readonlyField}>
                                <Text style={styles.readonlyText}>
                                    {formData.sellingPrice && formData.costPrice
                                        ? `${(((Number(formData.sellingPrice) - Number(formData.costPrice)) / Number(formData.sellingPrice)) * 100).toFixed(1)}%`
                                        : '0%'}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.row}>
                            <Text style={styles.label}>Price Includes Tax?</Text>
                            <Switch
                                value={formData.isTaxInclusive}
                                onValueChange={(val) => setFormData({ ...formData, isTaxInclusive: val })}
                                trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
                                thumbColor={formData.isTaxInclusive ? '#2563eb' : '#f3f4f6'}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Tax Rate (%)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="16"
                                keyboardType="numeric"
                                value={formData.taxRate}
                                onChangeText={(text) => setFormData({ ...formData, taxRate: text })}
                            />
                        </View>
                    </View>
                )}

                {/* INVENTORY TAB */}
                {activeTab === 'inventory' && formData.productType === 'GOODS' && (
                    <View style={styles.section}>
                        <View style={[styles.alertBox, { marginBottom: 16 }]}>
                            <Ionicons name="information-circle" size={20} color="#2563eb" />
                            <Text style={styles.alertText}>
                                Setting initial quantity will create an opening stock journal entry.
                            </Text>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Initial Quantity On Hand</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="0"
                                keyboardType="numeric"
                                value={formData.initialQuantity}
                                onChangeText={(text) => setFormData({ ...formData, initialQuantity: text })}
                            />
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.label}>Reorder Point</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="10"
                                    keyboardType="numeric"
                                    value={formData.reorderLevel}
                                    onChangeText={(text) => setFormData({ ...formData, reorderLevel: text })}
                                />
                                <Text style={styles.helpText}>Alert when below this</Text>
                            </View>
                            <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                                <Text style={styles.label}>Max Level</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Optional"
                                    keyboardType="numeric"
                                    value={formData.maxStockLevel}
                                    onChangeText={(text) => setFormData({ ...formData, maxStockLevel: text })}
                                />
                            </View>
                        </View>
                    </View>
                )}

                {/* ACCOUNTING TAB */}
                {activeTab === 'accounting' && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Link to Chart of Accounts</Text>
                        <Text style={styles.sectionSubtitle}>We've selected standard defaults for you.</Text>

                        {formData.productType === 'GOODS' && (
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Inventory Asset Account (Asset)</Text>
                                <View style={styles.pickerContainer}>
                                    <Picker
                                        selectedValue={formData.assetAccountId}
                                        onValueChange={(val) => setFormData({ ...formData, assetAccountId: val })}
                                        style={styles.picker}
                                    >
                                        <Picker.Item label="Select Account..." value="" />
                                        {accounts.assets.map(a => (
                                            <Picker.Item key={a.id} label={`${a.code} - ${a.name}`} value={a.id.toString()} />
                                        ))}
                                    </Picker>
                                </View>
                            </View>
                        )}

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Sales Income Account (Revenue)</Text>
                            <View style={styles.pickerContainer}>
                                <Picker
                                    selectedValue={formData.incomeAccountId}
                                    onValueChange={(val) => setFormData({ ...formData, incomeAccountId: val })}
                                    style={styles.picker}
                                >
                                    <Picker.Item label="Select Account..." value="" />
                                    {accounts.income.map(a => (
                                        <Picker.Item key={a.id} label={`${a.code} - ${a.name}`} value={a.id.toString()} />
                                    ))}
                                </Picker>
                            </View>
                        </View>

                        {formData.productType === 'GOODS' && (
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Cost of Goods Sold (Expense)</Text>
                                <View style={styles.pickerContainer}>
                                    <Picker
                                        selectedValue={formData.cogsAccountId}
                                        onValueChange={(val) => setFormData({ ...formData, cogsAccountId: val })}
                                        style={styles.picker}
                                    >
                                        <Picker.Item label="Select Account..." value="" />
                                        {accounts.expenses.map(a => (
                                            <Picker.Item key={a.id} label={`${a.code} - ${a.name}`} value={a.id.toString()} />
                                        ))}
                                    </Picker>
                                </View>
                            </View>
                        )}
                    </View>
                )}

                <View style={{ height: 100 }} />
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
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    saveButton: {
        backgroundColor: '#2563eb',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    saveButtonDisabled: {
        opacity: 0.7,
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    tabsContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    tabButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        gap: 4,
        borderRadius: 8,
    },
    tabButtonActive: {
        backgroundColor: '#eff6ff',
    },
    tabLabel: {
        fontSize: 12,
        color: '#6b7280',
        fontWeight: '500',
    },
    tabLabelActive: {
        color: '#2563eb',
        fontWeight: '600',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    section: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    catalogSearchContainer: {
        marginBottom: 16,
        zIndex: 10,
    },
    catalogInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#eff6ff',
        borderRadius: 8,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: '#2563eb',
    },
    catalogInput: {
        flex: 1,
        paddingVertical: 10,
        marginLeft: 8,
        fontSize: 14,
        color: '#1f2937',
    },
    catalogDropdown: {
        position: 'absolute',
        top: 48,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        maxHeight: 200,
        zIndex: 20,
    },
    catalogItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    catalogItemName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1f2937',
    },
    catalogItemMeta: {
        fontSize: 12,
        color: '#6b7280',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontSize: 13,
        color: '#6b7280',
        marginBottom: 16,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
        marginBottom: 6,
    },
    input: {
        backgroundColor: '#f9fafb',
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        color: '#1f2937',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    inputWithAction: {
        flexDirection: 'row',
    },
    actionIcon: {
        backgroundColor: '#f3f4f6',
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderLeftWidth: 0,
        borderTopRightRadius: 8,
        borderBottomRightRadius: 8,
        paddingHorizontal: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    typeSelector: {
        flexDirection: 'row',
        gap: 12,
    },
    typeOption: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#d1d5db',
        gap: 8,
        backgroundColor: '#fff',
    },
    typeOptionActive: {
        borderColor: '#2563eb',
        backgroundColor: '#eff6ff',
    },
    typeText: {
        fontWeight: '500',
        color: '#6b7280',
    },
    typeTextActive: {
        color: '#2563eb',
        fontWeight: '600',
    },
    helpText: {
        fontSize: 12,
        color: '#9ca3af',
        marginTop: 4,
    },
    readonlyField: {
        backgroundColor: '#f3f4f6',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    readonlyText: {
        color: '#6b7280',
        fontWeight: '600',
    },
    divider: {
        height: 1,
        backgroundColor: '#e5e7eb',
        marginVertical: 16,
    },
    alertBox: {
        flexDirection: 'row',
        backgroundColor: '#eff6ff',
        padding: 12,
        borderRadius: 8,
        gap: 8,
        alignItems: 'center',
    },
    alertText: {
        flex: 1,
        fontSize: 13,
        color: '#1e40af',
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        backgroundColor: '#f9fafb',
        ...Platform.select({
            ios: {
                height: 120, // Taller on iOS for scroll wheel
            },
            android: {
                height: 50,
            },
            web: {
                height: 40,
            },
        }),
    },
    picker: {
        ...Platform.select({
            web: {
                height: 40,
                width: '100%',
                border: 'none',
                backgroundColor: 'transparent',
                paddingHorizontal: 8,
            }
        }),
    },
});
