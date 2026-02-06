import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import apiService from '@/services/api';

export default function InventoryDetailScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    // Support both 'id' (from list) and 'itemId' (standard)
    const itemId = params.id || params.itemId;

    const [loading, setLoading] = useState(true);
    const [item, setItem] = useState<any>(null);
    const [transactions, setTransactions] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = async () => {
        try {
            setLoading(true);
            const [productData, txData] = await Promise.all([
                apiService.get(`/inventory/products/${itemId}`),
                apiService.get(`/inventory/transactions`, { params: { itemId, limit: 10 } })
            ]);

            setItem(productData);
            setTransactions(txData.data || []);
        } catch (error) {
            console.error('Error loading detail:', error);
            Alert.alert('Error', 'Failed to load product details');
            router.back();
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            if (itemId) {
                loadData();
            }
        }, [itemId])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const formatCurrency = (amount: number) => {
        return `KES ${Number(amount).toLocaleString()}`;
    };

    if (loading && !refreshing) {
        return (
            <SafeAreaView style={styles.container}>
                <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 50 }} />
            </SafeAreaView>
        );
    }

    if (!item) return null;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1f2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Product Details</Text>
                <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => Alert.alert('Coming Soon', 'Edit functionality will be added in the next update.')}
                >
                    <Ionicons name="create-outline" size={24} color="#2563eb" />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* Main Card */}
                <View style={styles.mainCard}>
                    <View style={styles.iconHeader}>
                        <View style={styles.iconCircle}>
                            <Ionicons name="cube" size={32} color="#2563eb" />
                        </View>
                        <View style={styles.nameSection}>
                            <Text style={styles.productName}>{item.name}</Text>
                            <Text style={styles.productSku}>{item.sku}</Text>
                            {item.description ? (
                                <Text style={styles.description}>{item.description}</Text>
                            ) : null}
                        </View>
                    </View>

                    <View style={styles.statsGrid}>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>On Hand</Text>
                            <Text style={styles.statValue}>
                                {Number(item.quantity).toLocaleString()} <Text style={styles.unit}>{item.unit}</Text>
                            </Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Cost per Unit</Text>
                            <Text style={styles.statValue}>{formatCurrency(item.costPrice)}</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Selling Price</Text>
                            <Text style={[styles.statValue, { color: '#10b981' }]}>{formatCurrency(item.sellingPrice)}</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Total Value</Text>
                            <Text style={[styles.statValue, { color: '#2563eb' }]}>
                                {formatCurrency(Number(item.quantity) * Number(item.costPrice))}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Actions */}
                <View style={styles.actionSection}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                    <View style={styles.actionButtons}>
                        <TouchableOpacity
                            style={styles.actionCard}
                            onPress={() => router.push(`/stock-adjustment?itemId=${item.id}&type=IN` as any)}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: '#dcfce7' }]}>
                                <Ionicons name="add-circle" size={24} color="#16a34a" />
                            </View>
                            <Text style={styles.actionText}>Add Stock</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionCard}
                            onPress={() => router.push(`/stock-adjustment?itemId=${item.id}&type=OUT` as any)}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: '#fee2e2' }]}>
                                <Ionicons name="remove-circle" size={24} color="#dc2626" />
                            </View>
                            <Text style={styles.actionText}>Remove</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionCard}
                            onPress={() => router.push(`/stock-adjustment?itemId=${item.id}` as any)}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: '#e0e7ff' }]}>
                                <Ionicons name="swap-horizontal" size={24} color="#4f46e5" />
                            </View>
                            <Text style={styles.actionText}>Adjust</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionCard}
                            onPress={() => router.push(`/item-history?id=${item.id}` as any)}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: '#fef3c7' }]}>
                                <Ionicons name="time" size={24} color="#d97706" />
                            </View>
                            <Text style={styles.actionText}>History</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* History */}
                <View style={styles.historySection}>
                    <Text style={styles.sectionTitle}>Recent Movements</Text>
                    {transactions.length === 0 ? (
                        <Text style={styles.emptyText}>No recent stock movements.</Text>
                    ) : (
                        transactions.map((tx: any) => (
                            <View key={tx.id} style={styles.txRow}>
                                <View style={styles.txLeft}>
                                    <View style={[
                                        styles.txIcon,
                                        { backgroundColor: tx.quantity > 0 ? '#dcfce7' : '#fee2e2' }
                                    ]}>
                                        <Ionicons
                                            name={tx.quantity > 0 ? 'arrow-down' : 'arrow-up'}
                                            size={16}
                                            color={tx.quantity > 0 ? '#16a34a' : '#dc2626'}
                                        />
                                    </View>
                                    <View>
                                        <Text style={styles.txType}>
                                            {tx.type === 'ADJUSTMENT' ? 'Stock Adjustment' : tx.type}
                                        </Text>
                                        <Text style={styles.txDate}>
                                            {new Date(tx.date).toLocaleDateString()}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.txRight}>
                                    <Text style={[
                                        styles.txQty,
                                        { color: tx.quantity > 0 ? '#16a34a' : '#dc2626' }
                                    ]}>
                                        {tx.quantity > 0 ? '+' : ''}{tx.quantity}
                                    </Text>
                                    {tx.notes && (
                                        <Text style={styles.txNotes} numberOfLines={1}>{tx.notes}</Text>
                                    )}
                                </View>
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>
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
    editButton: {
        padding: 4,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    mainCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    iconHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    iconCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#eff6ff',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    nameSection: {
        flex: 1,
    },
    productName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 4,
    },
    productSku: {
        fontSize: 14,
        color: '#6b7280',
        fontFamily: 'monospace',
    },
    description: {
        fontSize: 13,
        color: '#9ca3af',
        marginTop: 4,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
        paddingTop: 16,
    },
    statItem: {
        width: '45%',
    },
    statLabel: {
        fontSize: 12,
        color: '#6b7280',
        marginBottom: 4,
    },
    statValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
    },
    unit: {
        fontSize: 12,
        color: '#6b7280',
        fontWeight: 'normal',
    },
    actionSection: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 12,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    actionCard: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    actionIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    actionText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#374151',
    },
    historySection: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 40,
    },
    txRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
        paddingVertical: 12,
    },
    txLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    txIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    txType: {
        fontSize: 14,
        fontWeight: '500',
        color: '#1f2937',
    },
    txDate: {
        fontSize: 12,
        color: '#9ca3af',
    },
    txRight: {
        alignItems: 'flex-end',
    },
    txQty: {
        fontSize: 16,
        fontWeight: '600',
    },
    txNotes: {
        fontSize: 12,
        color: '#9ca3af',
        maxWidth: 100,
    },
    emptyText: {
        color: '#9ca3af',
        fontStyle: 'italic',
        marginTop: 8,
    },
});
