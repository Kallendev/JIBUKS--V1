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
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import apiService from '@/services/api';

interface CategoryBreakdown {
    category: string;
    totalValue: number;
    itemCount: number;
    retailValue: number;
}

interface TopItem {
    id: number;
    name: string;
    sku: string;
    quantity: number;
    costPrice: number;
    value: number;
}

interface ValuationData {
    summary: {
        totalItems: number;
        totalUnits: number;
        totalCostValue: number;
        totalRetailValue: number;
        potentialProfit: number;
        avgMargin: number;
    };
    byCategory: CategoryBreakdown[];
    topItems: TopItem[];
}

export default function InventoryValuationScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [valuation, setValuation] = useState<ValuationData | null>(null);

    useEffect(() => {
        loadValuation();
    }, []);

    const loadValuation = async () => {
        try {
            setLoading(true);
            const data = await apiService.request<ValuationData>('/inventory/accounting/valuation');
            setValuation(data);
        } catch (error) {
            console.error('Error loading valuation:', error);
            // Try alternate endpoint
            try {
                const data = await apiService.request<ValuationData>('/inventory/valuation/current');
                setValuation(data);
            } catch (e) {
                console.error('Fallback also failed:', e);
            }
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadValuation();
        setRefreshing(false);
    };

    const formatCurrency = (amount: number) => `KES ${(amount || 0).toLocaleString()}`;
    const formatPercent = (value: number) => `${(value || 0).toFixed(1)}%`;

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#10b981" />
                    <Text style={styles.loadingText}>Calculating valuation...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <LinearGradient
                colors={['#10b981', '#059669', '#047857']}
                style={styles.header}
            >
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>Inventory Valuation</Text>
                    <Text style={styles.headerSubtitle}>
                        As of {new Date().toLocaleDateString('en-KE', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </Text>
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
                {/* Summary Cards */}
                <View style={styles.summaryGrid}>
                    <View style={[styles.summaryCard, styles.primaryCard]}>
                        <Ionicons name="cube" size={28} color="#10b981" />
                        <Text style={styles.summaryLabel}>Total Cost Value</Text>
                        <Text style={styles.summaryValue}>
                            {formatCurrency(valuation?.summary?.totalCostValue || 0)}
                        </Text>
                        <Text style={styles.summarySubtext}>
                            {valuation?.summary?.totalItems || 0} items, {(valuation?.summary?.totalUnits || 0).toLocaleString()} units
                        </Text>
                    </View>

                    <View style={styles.cardRow}>
                        <View style={[styles.summaryCard, styles.halfCard]}>
                            <Ionicons name="pricetag" size={24} color="#3b82f6" />
                            <Text style={styles.smallLabel}>Retail Value</Text>
                            <Text style={styles.smallValue}>
                                {formatCurrency(valuation?.summary?.totalRetailValue || 0)}
                            </Text>
                        </View>
                        <View style={[styles.summaryCard, styles.halfCard]}>
                            <Ionicons name="trending-up" size={24} color="#f59e0b" />
                            <Text style={styles.smallLabel}>Potential Profit</Text>
                            <Text style={styles.smallValue}>
                                {formatCurrency(valuation?.summary?.potentialProfit || 0)}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.marginCard}>
                        <View style={styles.marginHeader}>
                            <Text style={styles.marginTitle}>Average Margin</Text>
                            <Text style={styles.marginValue}>
                                {formatPercent(valuation?.summary?.avgMargin || 0)}
                            </Text>
                        </View>
                        <View style={styles.marginBar}>
                            <View
                                style={[
                                    styles.marginFill,
                                    { width: `${Math.min(valuation?.summary?.avgMargin || 0, 100)}%` }
                                ]}
                            />
                        </View>
                        <Text style={styles.marginSubtext}>
                            {(valuation?.summary?.avgMargin || 0) >= 30
                                ? '✅ Healthy margin'
                                : (valuation?.summary?.avgMargin || 0) >= 15
                                    ? '⚠️ Moderate margin'
                                    : '🔴 Low margin - review pricing'}
                        </Text>
                    </View>
                </View>

                {/* Category Breakdown */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Value by Category</Text>
                        <Ionicons name="pie-chart" size={20} color="#6b7280" />
                    </View>

                    {valuation?.byCategory && valuation.byCategory.length > 0 ? (
                        valuation.byCategory.map((category, index) => {
                            const percentage = valuation?.summary?.totalCostValue
                                ? (category.totalValue / valuation.summary.totalCostValue * 100)
                                : 0;
                            const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#6b7280'];
                            const barColor = colors[index % colors.length];

                            return (
                                <View key={category.category} style={styles.categoryRow}>
                                    <View style={styles.categoryInfo}>
                                        <View style={[styles.categoryDot, { backgroundColor: barColor }]} />
                                        <Text style={styles.categoryName}>{category.category || 'Uncategorized'}</Text>
                                        <Text style={styles.categoryCount}>({category.itemCount} items)</Text>
                                    </View>
                                    <View style={styles.categoryBarContainer}>
                                        <View
                                            style={[
                                                styles.categoryBar,
                                                { width: `${Math.min(percentage, 100)}%`, backgroundColor: barColor }
                                            ]}
                                        />
                                    </View>
                                    <Text style={styles.categoryValue}>{formatCurrency(category.totalValue)}</Text>
                                </View>
                            );
                        })
                    ) : (
                        <View style={styles.emptyState}>
                            <Ionicons name="folder-open-outline" size={48} color="#d1d5db" />
                            <Text style={styles.emptyText}>No category data available</Text>
                        </View>
                    )}
                </View>

                {/* Top Items by Value */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Top Items by Value</Text>
                        <Ionicons name="trophy" size={20} color="#f59e0b" />
                    </View>

                    {valuation?.topItems && valuation.topItems.length > 0 ? (
                        valuation.topItems.slice(0, 10).map((item, index) => (
                            <TouchableOpacity
                                key={item.id}
                                style={styles.topItemRow}
                                onPress={() => router.push(`/inventory-detail?id=${item.id}` as any)}
                            >
                                <View style={styles.rankBadge}>
                                    <Text style={styles.rankText}>{index + 1}</Text>
                                </View>
                                <View style={styles.topItemInfo}>
                                    <Text style={styles.topItemName}>{item.name}</Text>
                                    <Text style={styles.topItemSku}>{item.sku}</Text>
                                </View>
                                <View style={styles.topItemStats}>
                                    <Text style={styles.topItemQty}>{item.quantity} units</Text>
                                    <Text style={styles.topItemValue}>{formatCurrency(item.value)}</Text>
                                </View>
                            </TouchableOpacity>
                        ))
                    ) : (
                        <View style={styles.emptyState}>
                            <Ionicons name="cube-outline" size={48} color="#d1d5db" />
                            <Text style={styles.emptyText}>No inventory items found</Text>
                        </View>
                    )}
                </View>

                {/* Accounting Info */}
                <View style={styles.infoCard}>
                    <Ionicons name="information-circle" size={24} color="#3b82f6" />
                    <View style={styles.infoContent}>
                        <Text style={styles.infoTitle}>Balance Sheet Impact</Text>
                        <Text style={styles.infoText}>
                            The Total Cost Value ({formatCurrency(valuation?.summary?.totalCostValue || 0)}) should match your Inventory Asset account (1201) on the Balance Sheet.
                        </Text>
                    </View>
                </View>

                {/* Quick Actions */}
                <View style={styles.actionsGrid}>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => router.push('/stock-adjustment' as any)}
                    >
                        <Ionicons name="swap-horizontal" size={24} color="#8b5cf6" />
                        <Text style={styles.actionText}>Adjust Stock</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => router.push('/cogs-report' as any)}
                    >
                        <Ionicons name="bar-chart" size={24} color="#ef4444" />
                        <Text style={styles.actionText}>COGS Report</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => router.push('/inventory' as any)}
                    >
                        <Ionicons name="list" size={24} color="#10b981" />
                        <Text style={styles.actionText}>All Items</Text>
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
        fontSize: 13,
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
    summaryGrid: {
        padding: 16,
    },
    summaryCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        marginBottom: 12,
    },
    primaryCard: {
        alignItems: 'center',
    },
    summaryLabel: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 8,
    },
    summaryValue: {
        fontSize: 32,
        fontWeight: '800',
        color: '#1f2937',
        marginTop: 4,
    },
    summarySubtext: {
        fontSize: 13,
        color: '#9ca3af',
        marginTop: 4,
    },
    cardRow: {
        flexDirection: 'row',
        gap: 12,
    },
    halfCard: {
        flex: 1,
        alignItems: 'center',
    },
    smallLabel: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 8,
    },
    smallValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1f2937',
        marginTop: 2,
    },
    marginCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    marginHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    marginTitle: {
        fontSize: 14,
        color: '#6b7280',
    },
    marginValue: {
        fontSize: 24,
        fontWeight: '800',
        color: '#10b981',
    },
    marginBar: {
        height: 8,
        backgroundColor: '#e5e7eb',
        borderRadius: 4,
        marginTop: 12,
        overflow: 'hidden',
    },
    marginFill: {
        height: '100%',
        backgroundColor: '#10b981',
        borderRadius: 4,
    },
    marginSubtext: {
        fontSize: 13,
        color: '#6b7280',
        marginTop: 8,
    },
    section: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginTop: 8,
        padding: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1f2937',
    },
    categoryRow: {
        marginBottom: 16,
    },
    categoryInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    categoryDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 8,
    },
    categoryName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1f2937',
    },
    categoryCount: {
        fontSize: 12,
        color: '#9ca3af',
        marginLeft: 6,
    },
    categoryBarContainer: {
        height: 6,
        backgroundColor: '#e5e7eb',
        borderRadius: 3,
        marginBottom: 4,
        overflow: 'hidden',
    },
    categoryBar: {
        height: '100%',
        borderRadius: 3,
    },
    categoryValue: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6b7280',
        textAlign: 'right',
    },
    topItemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    rankBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#f3f4f6',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    rankText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#6b7280',
    },
    topItemInfo: {
        flex: 1,
    },
    topItemName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1f2937',
    },
    topItemSku: {
        fontSize: 12,
        color: '#9ca3af',
    },
    topItemStats: {
        alignItems: 'flex-end',
    },
    topItemQty: {
        fontSize: 12,
        color: '#9ca3af',
    },
    topItemValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#10b981',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 30,
    },
    emptyText: {
        fontSize: 14,
        color: '#9ca3af',
        marginTop: 12,
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
    actionsGrid: {
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
