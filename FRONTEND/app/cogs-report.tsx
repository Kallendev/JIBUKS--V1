import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import apiService from '@/services/api';

interface CategoryCOGS {
    category: string;
    cogs: number;
    units: number;
}

interface ItemCOGS {
    id: number;
    name: string;
    sku: string;
    cogs: number;
    units: number;
}

interface COGSReportData {
    report: string;
    period: {
        start: string;
        end: string;
    };
    totalCOGS: number;
    transactions: number;
    byCategory: CategoryCOGS[];
    byItem: ItemCOGS[];
}

export default function COGSReportScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [cogsData, setCogsData] = useState<COGSReportData | null>(null);

    // Date filters
    const currentYear = new Date().getFullYear();
    const [startDate, setStartDate] = useState(`${currentYear}-01-01`);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [showDatePicker, setShowDatePicker] = useState(false);

    useEffect(() => {
        loadCOGSReport();
    }, [startDate, endDate]);

    const loadCOGSReport = async () => {
        try {
            setLoading(true);
            const data = await apiService.request<COGSReportData>(
                `/inventory/cogs-report?startDate=${startDate}&endDate=${endDate}`
            );
            setCogsData(data);
        } catch (error) {
            console.error('Error loading COGS report:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadCOGSReport();
        setRefreshing(false);
    };

    const formatCurrency = (amount: number) => `KES ${(amount || 0).toLocaleString()}`;

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-KE', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    // Quick date presets
    const setThisMonth = () => {
        const now = new Date();
        setStartDate(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`);
        setEndDate(now.toISOString().split('T')[0]);
    };

    const setLastMonth = () => {
        const now = new Date();
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        setStartDate(lastMonth.toISOString().split('T')[0]);
        setEndDate(endOfLastMonth.toISOString().split('T')[0]);
    };

    const setThisYear = () => {
        const now = new Date();
        setStartDate(`${now.getFullYear()}-01-01`);
        setEndDate(now.toISOString().split('T')[0]);
    };

    if (loading && !refreshing) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#ef4444" />
                    <Text style={styles.loadingText}>Generating COGS Report...</Text>
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
                    <Text style={styles.headerTitle}>COGS Report</Text>
                    <Text style={styles.headerSubtitle}>Cost of Goods Sold Analysis</Text>
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
                {/* Date Filter */}
                <View style={styles.filterSection}>
                    <View style={styles.datePresets}>
                        <TouchableOpacity style={styles.presetButton} onPress={setThisMonth}>
                            <Text style={styles.presetText}>This Month</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.presetButton} onPress={setLastMonth}>
                            <Text style={styles.presetText}>Last Month</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.presetButton} onPress={setThisYear}>
                            <Text style={styles.presetText}>YTD</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.dateInputRow}>
                        <View style={styles.dateInputContainer}>
                            <Text style={styles.dateLabel}>From</Text>
                            <TextInput
                                style={styles.dateInput}
                                value={startDate}
                                onChangeText={setStartDate}
                                placeholder="YYYY-MM-DD"
                                placeholderTextColor="#9ca3af"
                            />
                        </View>
                        <View style={styles.dateInputContainer}>
                            <Text style={styles.dateLabel}>To</Text>
                            <TextInput
                                style={styles.dateInput}
                                value={endDate}
                                onChangeText={setEndDate}
                                placeholder="YYYY-MM-DD"
                                placeholderTextColor="#9ca3af"
                            />
                        </View>
                    </View>
                </View>

                {/* Summary Card */}
                <View style={styles.summaryCard}>
                    <View style={styles.summaryHeader}>
                        <View style={styles.periodBadge}>
                            <Ionicons name="calendar-outline" size={16} color="#6b7280" />
                            <Text style={styles.periodText}>
                                {formatDate(startDate)} - {formatDate(endDate)}
                            </Text>
                        </View>
                        <Text style={styles.transactionCount}>
                            {cogsData?.transactions || 0} transactions
                        </Text>
                    </View>

                    <View style={styles.totalCOGSContainer}>
                        <Text style={styles.totalCOGSLabel}>Total Cost of Goods Sold</Text>
                        <Text style={styles.totalCOGSValue}>
                            {formatCurrency(cogsData?.totalCOGS || 0)}
                        </Text>
                    </View>

                    <View style={styles.summaryInfo}>
                        <Ionicons name="information-circle-outline" size={16} color="#6b7280" />
                        <Text style={styles.summaryInfoText}>
                            This is the total cost of inventory sold during this period.
                            Subtract from Revenue to get Gross Profit.
                        </Text>
                    </View>
                </View>

                {/* Category Breakdown */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>COGS by Category</Text>
                        <Ionicons name="pie-chart" size={20} color="#6b7280" />
                    </View>

                    {cogsData?.byCategory && cogsData.byCategory.length > 0 ? (
                        cogsData.byCategory.map((category, index) => {
                            const percentage = cogsData?.totalCOGS
                                ? (category.cogs / cogsData.totalCOGS * 100)
                                : 0;
                            const colors = ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'];
                            const barColor = colors[index % colors.length];

                            return (
                                <View key={category.category} style={styles.categoryRow}>
                                    <View style={styles.categoryInfo}>
                                        <View style={[styles.categoryDot, { backgroundColor: barColor }]} />
                                        <View style={styles.categoryDetails}>
                                            <Text style={styles.categoryName}>{category.category}</Text>
                                            <Text style={styles.categoryUnits}>{category.units} units sold</Text>
                                        </View>
                                    </View>
                                    <View style={styles.categoryValues}>
                                        <Text style={styles.categoryPercent}>{percentage.toFixed(1)}%</Text>
                                        <Text style={styles.categoryValue}>{formatCurrency(category.cogs)}</Text>
                                    </View>
                                </View>
                            );
                        })
                    ) : (
                        <View style={styles.emptyState}>
                            <Ionicons name="analytics-outline" size={48} color="#d1d5db" />
                            <Text style={styles.emptyText}>No sales data for this period</Text>
                        </View>
                    )}
                </View>

                {/* Top Items */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Top Items by COGS</Text>
                        <Text style={styles.sectionSubtitle}>Which items cost you the most</Text>
                    </View>

                    {cogsData?.byItem && cogsData.byItem.length > 0 ? (
                        cogsData.byItem.map((item, index) => (
                            <TouchableOpacity
                                key={item.id}
                                style={styles.itemRow}
                                onPress={() => router.push(`/inventory-detail?id=${item.id}` as any)}
                            >
                                <View style={[
                                    styles.rankBadge,
                                    index === 0 && styles.rankFirst,
                                    index === 1 && styles.rankSecond,
                                    index === 2 && styles.rankThird,
                                ]}>
                                    <Text style={[
                                        styles.rankText,
                                        index < 3 && styles.rankTextLight
                                    ]}>
                                        {index + 1}
                                    </Text>
                                </View>
                                <View style={styles.itemInfo}>
                                    <Text style={styles.itemName}>{item.name}</Text>
                                    <Text style={styles.itemSku}>{item.sku}</Text>
                                </View>
                                <View style={styles.itemStats}>
                                    <Text style={styles.itemUnits}>{item.units} units</Text>
                                    <Text style={styles.itemCOGS}>{formatCurrency(item.cogs)}</Text>
                                </View>
                            </TouchableOpacity>
                        ))
                    ) : (
                        <View style={styles.emptyState}>
                            <Ionicons name="cube-outline" size={48} color="#d1d5db" />
                            <Text style={styles.emptyText}>No items sold in this period</Text>
                        </View>
                    )}
                </View>

                {/* Accounting Insight */}
                <View style={styles.insightCard}>
                    <View style={styles.insightHeader}>
                        <Ionicons name="bulb" size={24} color="#f59e0b" />
                        <Text style={styles.insightTitle}>Accounting Insight</Text>
                    </View>
                    <Text style={styles.insightText}>
                        COGS appears on your Profit & Loss statement as an expense. The journal entries created were:
                    </Text>
                    <View style={styles.journalEntry}>
                        <View style={styles.journalRow}>
                            <Text style={styles.journalDr}>DR</Text>
                            <Text style={styles.journalAccount}>Cost of Goods Sold (5001)</Text>
                            <Text style={styles.journalAmount}>{formatCurrency(cogsData?.totalCOGS || 0)}</Text>
                        </View>
                        <View style={styles.journalRow}>
                            <Text style={styles.journalCr}>CR</Text>
                            <Text style={styles.journalAccount}>Inventory Asset (1201)</Text>
                            <Text style={styles.journalAmount}>{formatCurrency(cogsData?.totalCOGS || 0)}</Text>
                        </View>
                    </View>
                </View>

                {/* Quick Actions */}
                <View style={styles.actionsGrid}>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => router.push('/inventory-valuation' as any)}
                    >
                        <Ionicons name="wallet" size={24} color="#10b981" />
                        <Text style={styles.actionText}>Valuation</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => router.push('/reports' as any)}
                    >
                        <Ionicons name="document-text" size={24} color="#3b82f6" />
                        <Text style={styles.actionText}>P&L Report</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => router.push('/inventory' as any)}
                    >
                        <Ionicons name="cube" size={24} color="#8b5cf6" />
                        <Text style={styles.actionText}>Inventory</Text>
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
    filterSection: {
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
    datePresets: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
    },
    presetButton: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: '#f3f4f6',
        borderRadius: 8,
        alignItems: 'center',
    },
    presetText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6b7280',
    },
    dateInputRow: {
        flexDirection: 'row',
        gap: 12,
    },
    dateInputContainer: {
        flex: 1,
    },
    dateLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6b7280',
        marginBottom: 4,
    },
    dateInput: {
        backgroundColor: '#f9fafb',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        color: '#1f2937',
    },
    summaryCard: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginTop: 16,
        padding: 20,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    summaryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    periodBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f3f4f6',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 6,
    },
    periodText: {
        fontSize: 12,
        color: '#6b7280',
    },
    transactionCount: {
        fontSize: 12,
        color: '#9ca3af',
    },
    totalCOGSContainer: {
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    totalCOGSLabel: {
        fontSize: 14,
        color: '#6b7280',
    },
    totalCOGSValue: {
        fontSize: 36,
        fontWeight: '800',
        color: '#ef4444',
        marginTop: 4,
    },
    summaryInfo: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginTop: 16,
        gap: 8,
    },
    summaryInfoText: {
        flex: 1,
        fontSize: 13,
        color: '#6b7280',
        lineHeight: 18,
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
    sectionHeader: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1f2937',
    },
    sectionSubtitle: {
        fontSize: 12,
        color: '#9ca3af',
        marginTop: 2,
    },
    categoryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    categoryInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    categoryDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 12,
    },
    categoryDetails: {
        flex: 1,
    },
    categoryName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1f2937',
    },
    categoryUnits: {
        fontSize: 12,
        color: '#9ca3af',
    },
    categoryValues: {
        alignItems: 'flex-end',
    },
    categoryPercent: {
        fontSize: 12,
        color: '#9ca3af',
    },
    categoryValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#ef4444',
    },
    itemRow: {
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
    rankFirst: {
        backgroundColor: '#fbbf24',
    },
    rankSecond: {
        backgroundColor: '#9ca3af',
    },
    rankThird: {
        backgroundColor: '#cd7f32',
    },
    rankText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#6b7280',
    },
    rankTextLight: {
        color: '#fff',
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1f2937',
    },
    itemSku: {
        fontSize: 12,
        color: '#9ca3af',
    },
    itemStats: {
        alignItems: 'flex-end',
    },
    itemUnits: {
        fontSize: 12,
        color: '#9ca3af',
    },
    itemCOGS: {
        fontSize: 14,
        fontWeight: '700',
        color: '#ef4444',
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
    insightCard: {
        backgroundColor: '#fffbeb',
        marginHorizontal: 16,
        marginTop: 16,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#fcd34d',
    },
    insightHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    insightTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#92400e',
    },
    insightText: {
        fontSize: 13,
        color: '#92400e',
        lineHeight: 18,
        marginBottom: 12,
    },
    journalEntry: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
    },
    journalRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
    },
    journalDr: {
        width: 28,
        fontSize: 11,
        fontWeight: '700',
        color: '#ef4444',
    },
    journalCr: {
        width: 28,
        fontSize: 11,
        fontWeight: '700',
        color: '#10b981',
        paddingLeft: 12,
    },
    journalAccount: {
        flex: 1,
        fontSize: 13,
        color: '#1f2937',
    },
    journalAmount: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1f2937',
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
