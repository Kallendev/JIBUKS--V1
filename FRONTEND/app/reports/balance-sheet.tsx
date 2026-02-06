import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    ActivityIndicator,
    RefreshControl,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import apiService from '@/services/api';

export default function BalanceSheetScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [reportData, setReportData] = useState<any>(null);
    // Expand top-level sections by default
    const [expandedSections, setExpandedSections] = useState<Set<string>>(
        new Set(['ASSETS', 'LIABILITIES', 'EQUITY'])
    );
    // Sub-sections can be toggled separately if needed, or just grouped.
    const [expandedSubSections, setExpandedSubSections] = useState<Set<string>>(
        new Set(['currentAssets', 'nonCurrentAssets', 'currentLiabilities', 'longTermLiabilities'])
    );

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await apiService.getBalanceSheet();
            setReportData(data);
        } catch (error: any) {
            console.error('Error loading Balance Sheet:', error);
            Alert.alert('Error', error?.error || 'Failed to load Balance Sheet');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const toggleSection = (section: string) => {
        const newExpanded = new Set(expandedSections);
        if (newExpanded.has(section)) {
            newExpanded.delete(section);
        } else {
            newExpanded.add(section);
        }
        setExpandedSections(newExpanded);
    };

    const handleAccountPress = (accountId: string, accountName: string, accountCode: string) => {
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
        const today = new Date().toISOString().split('T')[0];

        router.push({
            pathname: '/reports/account-details',
            params: {
                accountId,
                accountName,
                accountCode,
                startDate: startOfYear,
                endDate: today
            }
        });
    };

    const toggleSubSection = (section: string) => {
        const newExpanded = new Set(expandedSubSections);
        if (newExpanded.has(section)) {
            newExpanded.delete(section);
        } else {
            newExpanded.add(section);
        }
        setExpandedSubSections(newExpanded);
    };

    const formatCurrency = (amount: number) => {
        return amount.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <Stack.Screen options={{ headerShown: false }} />
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#1f2937" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Balance Sheet</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2563eb" />
                </View>
            </SafeAreaView>
        );
    }

    const assets = reportData?.assets || {};
    const liabilitiesEquity = reportData?.liabilitiesAndEquity || {};
    const liabilities = liabilitiesEquity?.liabilities || {};
    const equity = liabilitiesEquity?.equity || {};
    const meta = reportData?.meta;
    const insights = reportData?.insights;

    // Helper to render rows
    const renderItems = (items: any[]) => {
        if (!items || items.length === 0) {
            return (
                <View style={styles.tableRow}>
                    <Text style={styles.emptyText}>No items found</Text>
                    <Text style={styles.amountText}>0.00</Text>
                </View>
            );
        }
        return items.map((item: any, index: number) => (
            <TouchableOpacity
                key={index}
                style={[styles.tableRow, index % 2 === 0 && styles.tableRowAlt]}
                onPress={() => handleAccountPress(item.id, item.name, item.code)}
            >
                <Text style={styles.accountName}>{item.code} - {item.name}</Text>
                <Text style={styles.amountText}>{formatCurrency(item.amount)}</Text>
            </TouchableOpacity>
        ));
    };

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1f2937" />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>Balance Sheet</Text>
                    <Text style={styles.headerSubtitle}>
                        As of {meta?.asOfDate ? new Date(meta.asOfDate).toLocaleDateString() : new Date().toLocaleDateString()}
                    </Text>
                </View>
                <TouchableOpacity onPress={onRefresh} style={styles.backButton}>
                    <Ionicons name="print-outline" size={24} color="#1f2937" />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* Report Card */}
                <View style={styles.reportContainer}>
                    <View style={styles.tableHeader}>
                        <Text style={styles.tableHeaderLeft}>Account</Text>
                        <Text style={styles.tableHeaderRight}>Amount (KES)</Text>
                    </View>

                    {/* ================= ASSETS SECTION ================= */}
                    <View style={styles.tableSection}>
                        <TouchableOpacity
                            style={styles.sectionHeaderRow}
                            onPress={() => toggleSection('ASSETS')}
                        >
                            <View style={styles.sectionTitleContainer}>
                                <Ionicons
                                    name={expandedSections.has('ASSETS') ? "chevron-down" : "chevron-forward"}
                                    size={16}
                                    color="#2563eb"
                                />
                                <Text style={styles.sectionTitle}>ASSETS</Text>
                            </View>
                            <Text style={styles.sectionTotal}>{formatCurrency(assets.totalAssets || 0)}</Text>
                        </TouchableOpacity>

                        {expandedSections.has('ASSETS') && (
                            <View>
                                {/* Current Assets */}
                                <TouchableOpacity
                                    style={styles.subSectionHeaderRow}
                                    onPress={() => toggleSubSection('currentAssets')}
                                >
                                    <View style={styles.sectionTitleContainer}>
                                        <Ionicons
                                            name={expandedSubSections.has('currentAssets') ? "caret-down" : "caret-forward"}
                                            size={14}
                                            color="#6b7280"
                                        />
                                        <Text style={styles.subSectionTitle}>Current Assets</Text>
                                    </View>
                                    <Text style={styles.subSectionAmount}>{formatCurrency(assets.currentAssets?.total || 0)}</Text>
                                </TouchableOpacity>
                                {expandedSubSections.has('currentAssets') && (
                                    <View style={styles.indentBlock}>
                                        {renderItems(assets.currentAssets?.items)}
                                    </View>
                                )}

                                {/* Non-Current Assets */}
                                <TouchableOpacity
                                    style={styles.subSectionHeaderRow}
                                    onPress={() => toggleSubSection('nonCurrentAssets')}
                                >
                                    <View style={styles.sectionTitleContainer}>
                                        <Ionicons
                                            name={expandedSubSections.has('nonCurrentAssets') ? "caret-down" : "caret-forward"}
                                            size={14}
                                            color="#6b7280"
                                        />
                                        <Text style={styles.subSectionTitle}>Non-Current Assets</Text>
                                    </View>
                                    <Text style={styles.subSectionAmount}>{formatCurrency(assets.nonCurrentAssets?.total || 0)}</Text>
                                </TouchableOpacity>
                                {expandedSubSections.has('nonCurrentAssets') && (
                                    <View style={styles.indentBlock}>
                                        {renderItems(assets.nonCurrentAssets?.items)}
                                    </View>
                                )}

                                <View style={[styles.tableRow, styles.subTotalRow]}>
                                    <Text style={styles.subTotalLabel}>Total Assets</Text>
                                    <Text style={styles.subTotalValue}>{formatCurrency(assets.totalAssets || 0)}</Text>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* ================= LIABILITIES SECTION ================= */}
                    <View style={styles.tableSection}>
                        <TouchableOpacity
                            style={styles.sectionHeaderRow}
                            onPress={() => toggleSection('LIABILITIES')}
                        >
                            <View style={styles.sectionTitleContainer}>
                                <Ionicons
                                    name={expandedSections.has('LIABILITIES') ? "chevron-down" : "chevron-forward"}
                                    size={16}
                                    color="#dc2626"
                                />
                                <Text style={styles.sectionTitle}>LIABILITIES</Text>
                            </View>
                            <Text style={styles.sectionTotal}>{formatCurrency(liabilities.totalLiabilities || 0)}</Text>
                        </TouchableOpacity>

                        {expandedSections.has('LIABILITIES') && (
                            <View>
                                {/* Current Liabilities */}
                                <TouchableOpacity
                                    style={styles.subSectionHeaderRow}
                                    onPress={() => toggleSubSection('currentLiabilities')}
                                >
                                    <View style={styles.sectionTitleContainer}>
                                        <Ionicons
                                            name={expandedSubSections.has('currentLiabilities') ? "caret-down" : "caret-forward"}
                                            size={14}
                                            color="#6b7280"
                                        />
                                        <Text style={styles.subSectionTitle}>Current Liabilities</Text>
                                    </View>
                                    <Text style={styles.subSectionAmount}>{formatCurrency(liabilities.currentLiabilities?.total || 0)}</Text>
                                </TouchableOpacity>
                                {expandedSubSections.has('currentLiabilities') && (
                                    <View style={styles.indentBlock}>
                                        {renderItems(liabilities.currentLiabilities?.items)}
                                    </View>
                                )}

                                {/* Long Term Liabilities */}
                                <TouchableOpacity
                                    style={styles.subSectionHeaderRow}
                                    onPress={() => toggleSubSection('longTermLiabilities')}
                                >
                                    <View style={styles.sectionTitleContainer}>
                                        <Ionicons
                                            name={expandedSubSections.has('longTermLiabilities') ? "caret-down" : "caret-forward"}
                                            size={14}
                                            color="#6b7280"
                                        />
                                        <Text style={styles.subSectionTitle}>Long Term Liabilities</Text>
                                    </View>
                                    <Text style={styles.subSectionAmount}>{formatCurrency(liabilities.nonCurrentLiabilities?.total || 0)}</Text>
                                </TouchableOpacity>
                                {expandedSubSections.has('longTermLiabilities') && (
                                    <View style={styles.indentBlock}>
                                        {renderItems(liabilities.nonCurrentLiabilities?.items)}
                                    </View>
                                )}

                                <View style={[styles.tableRow, styles.subTotalRow]}>
                                    <Text style={styles.subTotalLabel}>Total Liabilities</Text>
                                    <Text style={styles.subTotalValue}>{formatCurrency(liabilities.totalLiabilities || 0)}</Text>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* ================= EQUITY SECTION ================= */}
                    <View style={styles.tableSection}>
                        <TouchableOpacity
                            style={styles.sectionHeaderRow}
                            onPress={() => toggleSection('EQUITY')}
                        >
                            <View style={styles.sectionTitleContainer}>
                                <Ionicons
                                    name={expandedSections.has('EQUITY') ? "chevron-down" : "chevron-forward"}
                                    size={16}
                                    color="#7c3aed"
                                />
                                <Text style={styles.sectionTitle}>EQUITY</Text>
                            </View>
                            <Text style={styles.sectionTotal}>{formatCurrency(equity.total || 0)}</Text>
                        </TouchableOpacity>

                        {expandedSections.has('EQUITY') && (
                            <View>
                                {renderItems(equity.items)}
                                <View style={[styles.tableRow, styles.subTotalRow]}>
                                    <Text style={styles.subTotalLabel}>Total Equity</Text>
                                    <Text style={styles.subTotalValue}>{formatCurrency(equity.total || 0)}</Text>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* NET WORTH / SUMMARY */}
                    <View style={styles.highlightRow}>
                        <Text style={styles.highlightLabel}>Total Liabilities & Equity</Text>
                        <Text style={styles.highlightValue}>
                            {formatCurrency(liabilitiesEquity.totalLiabilitiesAndEquity || 0)}
                        </Text>
                    </View>

                    {/* Balanced Check */}
                    {meta?.isBalanced ? (
                        <View style={styles.balancedRow}>
                            <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                            <Text style={styles.balancedText}>Balance Sheet is Balanced</Text>
                        </View>
                    ) : (
                        <View style={styles.unbalancedRow}>
                            <Ionicons name="alert-circle" size={16} color="#ef4444" />
                            <Text style={styles.unbalancedText}>Balance Sheet is Not Balanced</Text>
                        </View>
                    )}
                </View>

                {/* Insights Section */}
                {insights && (
                    <View style={styles.metricsContainer}>
                        <Text style={styles.metricsTitle}>Financial Health Insights</Text>
                        <View style={styles.metricGrid}>
                            <View style={styles.metricItem}>
                                <Text style={styles.metricLabel}>Cash Runway</Text>
                                <Text style={styles.metricValue}>{insights.survivalText || 'N/A'}</Text>
                            </View>
                            <View style={styles.metricDivider} />
                            <View style={styles.metricItem}>
                                <Text style={styles.metricLabel}>Liquidity</Text>
                                <Text style={[styles.metricValue, { color: insights.liquidityStatus === 'HEALTHY' ? '#10b981' : '#ef4444' }]}>
                                    {insights.liquidityStatus || 'N/A'}
                                </Text>
                            </View>
                            <View style={styles.metricDivider} />
                            <View style={styles.metricItem}>
                                <Text style={styles.metricLabel}>Debt Ratio</Text>
                                <Text style={styles.metricValue}>{insights.debtRatio || '0%'}</Text>
                            </View>
                        </View>
                        <Text style={styles.metricNote}>
                            {insights.liquidityStatus === 'HEALTHY'
                                ? `You have sufficient liquid cash (Excess: KES ${formatCurrency(insights.liquidityGap)})`
                                : `Consider improving liquidity (Shortfall: KES ${formatCurrency(Math.abs(insights.liquidityGap))})`}
                        </Text>
                    </View>
                )}

                <View style={styles.footerNote}>
                    <Text style={styles.footerText}>
                        Generated on {new Date().toLocaleDateString()} • JIBUKS Business Engine
                    </Text>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        backgroundColor: '#fff',
    },
    headerCenter: {
        alignItems: 'center',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 2,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    reportContainer: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    tableHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: '#f3f4f6',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    tableHeaderLeft: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6b7280',
        textTransform: 'uppercase',
    },
    tableHeaderRight: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6b7280',
        textTransform: 'uppercase',
    },
    tableSection: {
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: '#f9fafb',
    },
    subSectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 24, // Indented
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    sectionTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1f2937',
    },
    subSectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#4b5563',
    },
    sectionTotal: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1f2937',
    },
    subSectionAmount: {
        fontSize: 13,
        fontWeight: '600',
        color: '#4b5563',
    },
    indentBlock: {

    },
    tableRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        paddingHorizontal: 32, // Double Indented
    },
    tableRowAlt: {
        backgroundColor: '#fafafa',
    },
    accountName: {
        fontSize: 14,
        color: '#374151',
        flex: 1,
    },
    amountText: {
        fontSize: 14,
        color: '#1f2937',
        fontFamily: 'monospace',
    },
    emptyText: {
        fontSize: 14,
        color: '#9ca3af',
        fontStyle: 'italic',
    },
    subTotalRow: {
        backgroundColor: '#f3f4f6',
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        paddingHorizontal: 16,
    },
    subTotalLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1f2937',
    },
    subTotalValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1f2937',
        fontFamily: 'monospace',
    },
    highlightRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    highlightLabel: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1f2937',
    },
    highlightValue: {
        fontSize: 18,
        fontWeight: '800',
        fontFamily: 'monospace',
    },
    balancedRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        gap: 8,
        backgroundColor: '#ecfdf5',
    },
    balancedText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#059669',
    },
    unbalancedRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        gap: 8,
        backgroundColor: '#fef2f2',
    },
    unbalancedText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#dc2626',
    },
    metricsContainer: {
        marginTop: 16,
        marginHorizontal: 16,
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    metricsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6b7280',
        marginBottom: 12,
        textTransform: 'uppercase',
    },
    metricGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    metricItem: {
        alignItems: 'center',
        flex: 1,
    },
    metricLabel: {
        fontSize: 11,
        color: '#6b7280',
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    metricValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1f2937',
    },
    metricDivider: {
        width: 1,
        height: 24,
        backgroundColor: '#e5e7eb',
    },
    metricNote: {
        marginTop: 12,
        fontSize: 12,
        color: '#4b5563',
        textAlign: 'center',
        fontStyle: 'italic',
    },
    footerNote: {
        marginTop: 20,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 11,
        color: '#9ca3af',
    },
});
