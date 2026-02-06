import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import apiService from '@/services/api';

interface Movement {
    id: number;
    type: 'IN' | 'OUT' | 'ADJUSTMENT';
    movementType: string;
    reason: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
    quantityBefore: number;
    quantityAfter: number;
    wacBefore: number;
    wacAfter: number;
    reference: string;
    notes: string;
    createdAt: string;
    journal?: {
        id: number;
        journalNumber: string;
    };
}

interface InventoryItem {
    id: number;
    name: string;
    sku: string;
    quantity: number;
    costPrice: number;
    weightedAvgCost: number;
    unit: string;
}

interface HistoryData {
    item: InventoryItem;
    currentStock: number;
    currentWAC: number;
    movements: Movement[];
}

export default function ItemHistoryScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const itemId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [historyData, setHistoryData] = useState<HistoryData | null>(null);

    useEffect(() => {
        if (itemId) {
            loadHistory();
        }
    }, [itemId]);

    const loadHistory = async () => {
        try {
            setLoading(true);
            const data = await apiService.request<HistoryData>(`/inventory/${itemId}/history`);
            setHistoryData(data);
        } catch (error) {
            console.error('Error loading history:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadHistory();
        setRefreshing(false);
    };

    const formatCurrency = (amount: number) => `KES ${(amount || 0).toLocaleString()}`;

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-KE', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getMovementIcon = (type: string, reason: string) => {
        if (type === 'IN') {
            switch (reason) {
                case 'PURCHASE': return { icon: 'cart', color: '#10b981' };
                case 'CUSTOMER_RETURN': return { icon: 'return-down-back', color: '#3b82f6' };
                case 'FOUND': return { icon: 'search', color: '#8b5cf6' };
                default: return { icon: 'add-circle', color: '#10b981' };
            }
        } else if (type === 'OUT') {
            switch (reason) {
                case 'SALE': return { icon: 'receipt', color: '#ef4444' };
                case 'DAMAGED': return { icon: 'warning', color: '#f59e0b' };
                case 'THEFT': return { icon: 'alert-circle', color: '#ef4444' };
                case 'EXPIRED': return { icon: 'time', color: '#f97316' };
                default: return { icon: 'remove-circle', color: '#ef4444' };
            }
        } else {
            return { icon: 'swap-horizontal', color: '#8b5cf6' };
        }
    };

    const getReasonLabel = (reason: string) => {
        const labels: Record<string, string> = {
            PURCHASE: 'Purchase',
            SALE: 'Sale',
            CUSTOMER_RETURN: 'Customer Return',
            SUPPLIER_RETURN: 'Supplier Return',
            DAMAGED: 'Damaged',
            THEFT: 'Theft/Shrinkage',
            EXPIRED: 'Expired',
            FOUND: 'Found Stock',
            COUNT_ADJUSTMENT: 'Physical Count',
            TRANSFER_IN: 'Transfer In',
            TRANSFER_OUT: 'Transfer Out',
            SAMPLE: 'Internal Use',
        };
        return labels[reason] || reason;
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3b82f6" />
                    <Text style={styles.loadingText}>Loading history...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!historyData) {
        return (
            <SafeAreaView style={styles.container}>
                <LinearGradient
                    colors={['#3b82f6', '#2563eb', '#1d4ed8']}
                    style={styles.header}
                >
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <View style={styles.headerContent}>
                        <Text style={styles.headerTitle}>Stock History</Text>
                    </View>
                </LinearGradient>
                <View style={styles.emptyContainer}>
                    <Ionicons name="document-text-outline" size={64} color="#d1d5db" />
                    <Text style={styles.emptyTitle}>No History Found</Text>
                    <Text style={styles.emptyText}>This item has no movement history yet.</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <LinearGradient
                colors={['#3b82f6', '#2563eb', '#1d4ed8']}
                style={styles.header}
            >
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>Stock History</Text>
                    <Text style={styles.headerSubtitle}>{historyData.item?.name}</Text>
                </View>
                <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
                    <Ionicons name="refresh" size={24} color="#fff" />
                </TouchableOpacity>
            </LinearGradient>

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Item Summary */}
                <View style={styles.summaryCard}>
                    <View style={styles.itemIcon}>
                        <Ionicons name="cube" size={32} color="#3b82f6" />
                    </View>
                    <View style={styles.itemInfo}>
                        <Text style={styles.itemName}>{historyData.item?.name}</Text>
                        <Text style={styles.itemSku}>SKU: {historyData.item?.sku}</Text>
                    </View>
                    <View style={styles.stockBadge}>
                        <Text style={styles.stockLabel}>Current Stock</Text>
                        <Text style={styles.stockValue}>{historyData.currentStock}</Text>
                        <Text style={styles.stockUnit}>{historyData.item?.unit || 'units'}</Text>
                    </View>
                </View>

                {/* Metrics Row */}
                <View style={styles.metricsRow}>
                    <View style={styles.metricCard}>
                        <Text style={styles.metricLabel}>WAC</Text>
                        <Text style={styles.metricValue}>{formatCurrency(historyData.currentWAC)}</Text>
                    </View>
                    <View style={styles.metricCard}>
                        <Text style={styles.metricLabel}>Stock Value</Text>
                        <Text style={[styles.metricValue, { color: '#10b981' }]}>
                            {formatCurrency(historyData.currentStock * historyData.currentWAC)}
                        </Text>
                    </View>
                    <View style={styles.metricCard}>
                        <Text style={styles.metricLabel}>Movements</Text>
                        <Text style={styles.metricValue}>{historyData.movements?.length || 0}</Text>
                    </View>
                </View>

                {/* Timeline */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Movement History</Text>

                    {historyData.movements && historyData.movements.length > 0 ? (
                        <View style={styles.timeline}>
                            {historyData.movements.map((movement, index) => {
                                const { icon, color } = getMovementIcon(movement.type || movement.movementType, movement.reason);
                                const isLast = index === historyData.movements.length - 1;

                                return (
                                    <View key={movement.id} style={styles.timelineItem}>
                                        {/* Timeline Line */}
                                        <View style={styles.timelineLine}>
                                            <View style={[styles.timelineDot, { backgroundColor: color }]}>
                                                <Ionicons name={icon as any} size={14} color="#fff" />
                                            </View>
                                            {!isLast && <View style={styles.timelineConnector} />}
                                        </View>

                                        {/* Movement Card */}
                                        <View style={styles.movementCard}>
                                            <View style={styles.movementHeader}>
                                                <Text style={styles.movementReason}>
                                                    {getReasonLabel(movement.reason)}
                                                </Text>
                                                <Text style={[
                                                    styles.movementQty,
                                                    { color: movement.type === 'IN' || movement.movementType === 'IN' ? '#10b981' : '#ef4444' }
                                                ]}>
                                                    {(movement.type === 'IN' || movement.movementType === 'IN') ? '+' : '-'}
                                                    {Math.abs(movement.quantity)}
                                                </Text>
                                            </View>

                                            <View style={styles.movementDetails}>
                                                <View style={styles.movementRow}>
                                                    <Ionicons name="time-outline" size={14} color="#9ca3af" />
                                                    <Text style={styles.movementDate}>{formatDate(movement.createdAt)}</Text>
                                                </View>

                                                <View style={styles.movementRow}>
                                                    <Ionicons name="cube-outline" size={14} color="#9ca3af" />
                                                    <Text style={styles.movementText}>
                                                        {movement.quantityBefore} → {movement.quantityAfter} units
                                                    </Text>
                                                </View>

                                                {movement.unitCost > 0 && (
                                                    <View style={styles.movementRow}>
                                                        <Ionicons name="cash-outline" size={14} color="#9ca3af" />
                                                        <Text style={styles.movementText}>
                                                            @ {formatCurrency(movement.unitCost)} = {formatCurrency(movement.totalCost)}
                                                        </Text>
                                                    </View>
                                                )}

                                                {movement.wacBefore !== movement.wacAfter && (
                                                    <View style={styles.wacChange}>
                                                        <Text style={styles.wacLabel}>WAC:</Text>
                                                        <Text style={styles.wacBefore}>{formatCurrency(movement.wacBefore)}</Text>
                                                        <Ionicons name="arrow-forward" size={12} color="#9ca3af" />
                                                        <Text style={styles.wacAfter}>{formatCurrency(movement.wacAfter)}</Text>
                                                    </View>
                                                )}

                                                {movement.reference && (
                                                    <View style={styles.movementRow}>
                                                        <Ionicons name="document-outline" size={14} color="#9ca3af" />
                                                        <Text style={styles.movementText}>{movement.reference}</Text>
                                                    </View>
                                                )}

                                                {movement.journal && (
                                                    <TouchableOpacity style={styles.journalBadge}>
                                                        <Ionicons name="book-outline" size={12} color="#3b82f6" />
                                                        <Text style={styles.journalText}>{movement.journal.journalNumber}</Text>
                                                    </TouchableOpacity>
                                                )}

                                                {movement.notes && (
                                                    <Text style={styles.movementNotes}>{movement.notes}</Text>
                                                )}
                                            </View>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    ) : (
                        <View style={styles.emptyState}>
                            <Ionicons name="time-outline" size={48} color="#d1d5db" />
                            <Text style={styles.emptyStateText}>No movements recorded</Text>
                        </View>
                    )}
                </View>

                {/* Quick Actions */}
                <View style={styles.actionsRow}>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => router.push(`/stock-adjustment?itemId=${itemId}` as any)}
                    >
                        <Ionicons name="swap-horizontal" size={24} color="#8b5cf6" />
                        <Text style={styles.actionText}>Adjust</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => router.push(`/inventory-detail?id=${itemId}` as any)}
                    >
                        <Ionicons name="eye" size={24} color="#3b82f6" />
                        <Text style={styles.actionText}>Details</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => router.push('/inventory-valuation' as any)}
                    >
                        <Ionicons name="wallet" size={24} color="#10b981" />
                        <Text style={styles.actionText}>Valuation</Text>
                    </TouchableOpacity>
                </View>

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
    refreshButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollView: {
        flex: 1,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#6b7280',
        marginTop: 16,
    },
    emptyText: {
        fontSize: 14,
        color: '#9ca3af',
        marginTop: 8,
        textAlign: 'center',
    },
    summaryCard: {
        flexDirection: 'row',
        alignItems: 'center',
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
    itemIcon: {
        width: 56,
        height: 56,
        borderRadius: 12,
        backgroundColor: '#eff6ff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    itemInfo: {
        flex: 1,
        marginLeft: 12,
    },
    itemName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1f2937',
    },
    itemSku: {
        fontSize: 13,
        color: '#6b7280',
        marginTop: 2,
    },
    stockBadge: {
        alignItems: 'center',
        backgroundColor: '#f0fdf4',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
    },
    stockLabel: {
        fontSize: 10,
        color: '#6b7280',
        textTransform: 'uppercase',
    },
    stockValue: {
        fontSize: 24,
        fontWeight: '800',
        color: '#10b981',
    },
    stockUnit: {
        fontSize: 11,
        color: '#6b7280',
    },
    metricsRow: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 16,
        marginTop: 12,
    },
    metricCard: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    metricLabel: {
        fontSize: 11,
        color: '#6b7280',
        textTransform: 'uppercase',
    },
    metricValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1f2937',
        marginTop: 4,
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
        marginBottom: 16,
    },
    timeline: {
        marginLeft: 8,
    },
    timelineItem: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    timelineLine: {
        alignItems: 'center',
        width: 32,
    },
    timelineDot: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    timelineConnector: {
        flex: 1,
        width: 2,
        backgroundColor: '#e5e7eb',
        marginTop: 4,
    },
    movementCard: {
        flex: 1,
        marginLeft: 12,
        backgroundColor: '#f9fafb',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    movementHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    movementReason: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1f2937',
    },
    movementQty: {
        fontSize: 16,
        fontWeight: '800',
    },
    movementDetails: {
        gap: 6,
    },
    movementRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    movementDate: {
        fontSize: 12,
        color: '#6b7280',
    },
    movementText: {
        fontSize: 12,
        color: '#6b7280',
    },
    wacChange: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#fef3c7',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    wacLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#92400e',
    },
    wacBefore: {
        fontSize: 11,
        color: '#92400e',
        textDecorationLine: 'line-through',
    },
    wacAfter: {
        fontSize: 11,
        fontWeight: '700',
        color: '#92400e',
    },
    journalBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#eff6ff',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    journalText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#3b82f6',
    },
    movementNotes: {
        fontSize: 12,
        color: '#6b7280',
        fontStyle: 'italic',
        marginTop: 4,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 30,
    },
    emptyStateText: {
        fontSize: 14,
        color: '#9ca3af',
        marginTop: 12,
    },
    actionsRow: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 16,
        marginTop: 16,
    },
    actionButton: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    actionText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6b7280',
        marginTop: 8,
    },
});
