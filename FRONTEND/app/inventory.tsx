import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Alert,
    TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import apiService from '@/services/api';

// TypeScript interfaces
interface InventoryItem {
    id: number;
    name: string;
    sku: string;
    category: string;
    quantity: number;
    unit: string;
    costPrice: number;
    sellingPrice: number;
    stockValue: number;
    reorderLevel: number;
    isLowStock: boolean;
}

interface ValuationSummary {
    totalItems: number;
    totalCostValue: number;
    totalRetailValue: number;
}

interface ValuationData {
    summary: ValuationSummary;
}

export default function InventoryScreen() {
    const router = useRouter();
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [valuation, setValuation] = useState<ValuationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showLowStock, setShowLowStock] = useState(false);

    useEffect(() => {
        loadInventory();
        loadValuation();
    }, [showLowStock]);

    const loadInventory = async () => {
        try {
            setLoading(true);
            const endpoint = showLowStock ? '/inventory?lowStock=true' : '/inventory';
            const data = await apiService.request<InventoryItem[]>(endpoint);
            setInventory(data || []);
        } catch (error) {
            console.error('Error loading inventory:', error);
            Alert.alert('Error', 'Failed to load inventory');
        } finally {
            setLoading(false);
        }
    };

    const loadValuation = async () => {
        try {
            const data = await apiService.request<ValuationData>('/inventory/valuation/current');
            setValuation(data);
        } catch (error) {
            console.error('Error loading valuation:', error);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await Promise.all([loadInventory(), loadValuation()]);
        setRefreshing(false);
    };

    const formatCurrency = (amount: number): string => {
        return `KES ${Number(amount).toLocaleString()}`;
    };

    const filteredInventory = inventory.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#1f2937" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Inventory</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2563eb" />
                    <Text style={styles.loadingText}>Loading inventory...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1f2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Inventory</Text>
                <TouchableOpacity
                    onPress={() => router.push('/new-inventory-item' as any)}
                    style={styles.addButton}
                >
                    <Ionicons name="add" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Valuation Summary */}
                {valuation && (
                    <TouchableOpacity
                        style={styles.summaryContainer}
                        onPress={() => router.push('/inventory-valuation' as any)}
                        activeOpacity={0.8}
                    >
                        <View style={styles.summaryCard}>
                            <Text style={styles.summaryLabel}>Total Items</Text>
                            <Text style={styles.summaryValue}>{valuation.summary.totalItems}</Text>
                        </View>
                        <View style={styles.summaryCard}>
                            <Text style={styles.summaryLabel}>Cost Value</Text>
                            <Text style={[styles.summaryValue, { fontSize: 14 }]}>
                                {formatCurrency(valuation.summary.totalCostValue)}
                            </Text>
                        </View>
                        <View style={styles.summaryCard}>
                            <Text style={styles.summaryLabel}>Retail Value</Text>
                            <Text style={[styles.summaryValue, { fontSize: 14, color: '#10b981' }]}>
                                {formatCurrency(valuation.summary.totalRetailValue)}
                            </Text>
                        </View>
                    </TouchableOpacity>
                )}

                {/* Quick Actions */}
                <View style={styles.quickActionsRow}>
                    <TouchableOpacity
                        style={styles.quickActionBtn}
                        onPress={() => router.push('/inventory-valuation' as any)}
                    >
                        <Ionicons name="wallet" size={20} color="#10b981" />
                        <Text style={styles.quickActionText}>Valuation</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.quickActionBtn}
                        onPress={() => router.push('/cogs-report' as any)}
                    >
                        <Ionicons name="bar-chart" size={20} color="#ef4444" />
                        <Text style={styles.quickActionText}>COGS</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.quickActionBtn}
                        onPress={() => router.push('/credit-memo' as any)}
                    >
                        <Ionicons name="return-down-back" size={20} color="#f59e0b" />
                        <Text style={styles.quickActionText}>Returns</Text>
                    </TouchableOpacity>
                </View>


                {/* Search and Filter */}
                <View style={styles.searchContainer}>
                    <View style={styles.searchBox}>
                        <Ionicons name="search" size={20} color="#6b7280" />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search by name or SKU..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                    <TouchableOpacity
                        style={[styles.filterButton, showLowStock && styles.filterButtonActive]}
                        onPress={() => setShowLowStock(!showLowStock)}
                    >
                        <Ionicons
                            name="warning"
                            size={20}
                            color={showLowStock ? '#fff' : '#ef4444'}
                        />
                        <Text style={[styles.filterText, showLowStock && styles.filterTextActive]}>
                            Low Stock
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Inventory List */}
                <View style={styles.listContainer}>
                    {filteredInventory.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="cube-outline" size={64} color="#d1d5db" />
                            <Text style={styles.emptyText}>
                                {searchQuery ? 'No items found' : 'No inventory items'}
                            </Text>
                            <Text style={styles.emptySubtext}>
                                {searchQuery
                                    ? 'Try a different search term'
                                    : 'Tap the + button to add your first item'}
                            </Text>
                        </View>
                    ) : (
                        filteredInventory.map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                style={styles.itemCard}
                                onPress={() => router.push(`/inventory-detail?id=${item.id}` as any)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.itemHeader}>
                                    <View style={styles.itemLeft}>
                                        <View style={[
                                            styles.iconCircle,
                                            { backgroundColor: item.isLowStock ? '#fee2e2' : '#dbeafe' }
                                        ]}>
                                            <Ionicons
                                                name="cube"
                                                size={20}
                                                color={item.isLowStock ? '#ef4444' : '#2563eb'}
                                            />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.itemName}>{item.name}</Text>
                                            <Text style={styles.itemSku}>SKU: {item.sku}</Text>
                                            {item.category && (
                                                <Text style={styles.itemCategory}>{item.category}</Text>
                                            )}
                                        </View>
                                    </View>
                                    {item.isLowStock && (
                                        <View style={styles.lowStockBadge}>
                                            <Ionicons name="warning" size={16} color="#ef4444" />
                                            <Text style={styles.lowStockText}>Low</Text>
                                        </View>
                                    )}
                                </View>

                                <View style={styles.itemDetails}>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Quantity:</Text>
                                        <Text style={[
                                            styles.detailValue,
                                            { color: item.isLowStock ? '#ef4444' : '#1f2937' }
                                        ]}>
                                            {Number(item.quantity).toLocaleString()} {item.unit}
                                        </Text>
                                    </View>
                                    {item.reorderLevel && (
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Reorder Level:</Text>
                                            <Text style={styles.detailValue}>
                                                {Number(item.reorderLevel).toLocaleString()} {item.unit}
                                            </Text>
                                        </View>
                                    )}
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Cost Price:</Text>
                                        <Text style={styles.detailValue}>
                                            {formatCurrency(item.costPrice)}
                                        </Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Selling Price:</Text>
                                        <Text style={[styles.detailValue, { color: '#10b981' }]}>
                                            {formatCurrency(item.sellingPrice)}
                                        </Text>
                                    </View>
                                    <View style={[styles.detailRow, styles.stockValueRow]}>
                                        <Text style={styles.stockValueLabel}>Stock Value:</Text>
                                        <Text style={styles.stockValueAmount}>
                                            {formatCurrency(item.stockValue)}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.itemFooter}>
                                    <TouchableOpacity
                                        style={styles.actionButton}
                                        onPress={(e) => {
                                            e.stopPropagation();
                                            router.push(`/stock-adjustment?itemId=${item.id}` as any);
                                        }}
                                    >
                                        <Ionicons name="swap-horizontal" size={16} color="#2563eb" />
                                        <Text style={styles.actionButtonText}>Adjust</Text>
                                    </TouchableOpacity>
                                    <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                                </View>
                            </TouchableOpacity>
                        ))
                    )}
                </View>

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
    addButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#2563eb',
        alignItems: 'center',
        justifyContent: 'center',
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
    scrollView: {
        flex: 1,
    },
    summaryContainer: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
    },
    summaryCard: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    summaryLabel: {
        fontSize: 12,
        color: '#6b7280',
        marginBottom: 8,
    },
    summaryValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    quickActionsRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        marginBottom: 16,
        gap: 8,
    },
    quickActionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 12,
        gap: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    quickActionText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#374151',
    },
    searchContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        marginBottom: 16,
        gap: 8,
    },
    searchBox: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 48,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 16,
        color: '#1f2937',
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        gap: 4,
    },
    filterButtonActive: {
        backgroundColor: '#ef4444',
        borderColor: '#ef4444',
    },
    filterText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#ef4444',
    },
    filterTextActive: {
        color: '#fff',
    },
    listContainer: {
        paddingHorizontal: 16,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#6b7280',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#9ca3af',
        marginTop: 8,
        textAlign: 'center',
    },
    itemCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    itemLeft: {
        flexDirection: 'row',
        flex: 1,
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    itemName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
    },
    itemSku: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 2,
    },
    itemCategory: {
        fontSize: 12,
        color: '#2563eb',
        marginTop: 2,
    },
    lowStockBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fee2e2',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    lowStockText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#ef4444',
    },
    itemDetails: {
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
        paddingTop: 12,
        marginBottom: 12,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    detailLabel: {
        fontSize: 14,
        color: '#6b7280',
    },
    detailValue: {
        fontSize: 14,
        color: '#1f2937',
        fontWeight: '500',
    },
    stockValueRow: {
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
        paddingTop: 8,
        marginTop: 4,
    },
    stockValueLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1f2937',
    },
    stockValueAmount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2563eb',
    },
    itemFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
        paddingTop: 12,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: '#eff6ff',
        gap: 4,
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2563eb',
    },
});
