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
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import apiService from '@/services/api';

// Brand Colors
const COLORS = {
    primary: '#2563eb',
    primaryDark: '#1e40af',
    green: '#10b981',
    greenLight: '#d1fae5',
    red: '#ef4444',
    redLight: '#fee2e2',
    blue: '#3b82f6',
    blueLight: '#dbeafe',
    orange: '#f59e0b',
    orangeLight: '#fef3c7',
    purple: '#8b5cf6',
    purpleLight: '#ede9fe',
    gray: '#6b7280',
    grayLight: '#f3f4f6',
    text: '#1f2937',
    textLight: '#6b7280',
    border: '#e5e7eb',
    white: '#ffffff',
};

export default function BalanceSheetScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [reportData, setReportData] = useState<any>(null);
    const [expandedSections, setExpandedSections] = useState<Set<string>>(
        new Set(['currentAssets', 'nonCurrentAssets', 'currentLiabilities', 'nonCurrentLiabilities', 'equity'])
    );

    useEffect(() => {
        loadData();
    }, []);

    const toggleSection = (section: string) => {
        const newExpanded = new Set(expandedSections);
        if (newExpanded.has(section)) {
            newExpanded.delete(section);
        } else {
            newExpanded.add(section);
        }
        setExpandedSections(newExpanded);
    };

    const loadData = async () => {
        try {
            setLoading(true);
            console.log('📊 Fetching balance sheet...');
            const data = await apiService.getBalanceSheet();
            console.log('✅ Balance sheet data received:', JSON.stringify(data, null, 2));
            setReportData(data);
        } catch (error: any) {
            console.error('❌ Error loading Balance Sheet:', error);
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

    const formatCurrency = (amount: number) => {
        return `${Math.abs(amount).toLocaleString('en-KE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <Stack.Screen options={{ headerShown: false }} />
                <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.header}>
                    <View style={styles.headerContent}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Balance Sheet</Text>
                        <View style={{ width: 40 }} />
                    </View>
                </LinearGradient>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loadingText}>Loading Balance Sheet...</Text>
                </View>
            </SafeAreaView>
        );
    }


    // Extract data from the response (New Structure)
    const meta = reportData?.meta || { status: reportData?.status, asOfDate: reportData?.asOfDate, currency: reportData?.currency };
    const summary = reportData?.summary || { totalAssets: 0, totalLiabilities: 0, netWorth: 0 };

    const assets = reportData?.assets || {};
    const liabilitiesEquity = reportData?.liabilitiesAndEquity || {};
    const liabilities = liabilitiesEquity?.liabilities || {};
    const equity = liabilitiesEquity?.equity || {};

    // Insights remain the same
    const insights = reportData?.insights;

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            {/* Premium Header */}
            <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.header}>
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <View style={styles.headerCenter}>
                        <Text style={styles.headerTitle}>Balance Sheet</Text>
                        <Text style={styles.headerSubtitle}>
                            Statement of Financial Position
                        </Text>
                    </View>
                    <TouchableOpacity onPress={onRefresh} style={styles.backButton}>
                        <Ionicons name="refresh" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
                <View style={styles.dateContainer}>
                    <Ionicons name="calendar-outline" size={16} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.dateText}>
                        As of {meta?.asOfDate ? new Date(meta.asOfDate).toLocaleDateString() : new Date().toLocaleDateString()}
                    </Text>
                </View>
            </LinearGradient>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* ==================== SECTION A: ASSETS ==================== */}
                <View style={styles.mainSection}>
                    <View style={[styles.sectionHeader, { backgroundColor: COLORS.greenLight }]}>
                        <View style={styles.sectionHeaderLeft}>
                            <View style={[styles.sectionIcon, { backgroundColor: COLORS.green }]}>
                                <Ionicons name="briefcase" size={20} color="#fff" />
                            </View>
                            <Text style={[styles.sectionHeaderTitle, { color: COLORS.green }]}>
                                ASSETS
                            </Text>
                        </View>
                        <Text style={[styles.sectionHeaderAmount, { color: COLORS.green }]}>
                            KES {formatCurrency(assets.totalAssets || 0)}
                        </Text>
                    </View>

                    {/* 1. Current Assets */}
                    <View style={styles.subSection}>
                        <TouchableOpacity
                            style={styles.subSectionHeader}
                            onPress={() => toggleSection('currentAssets')}
                        >
                            <View style={styles.subSectionLeft}>
                                <Ionicons
                                    name={expandedSections.has('currentAssets') ? 'chevron-down' : 'chevron-forward'}
                                    size={18}
                                    color={COLORS.gray}
                                />
                                <Text style={styles.subSectionTitle}>
                                    1. Current Assets
                                </Text>
                            </View>
                            <Text style={styles.subSectionAmount}>
                                KES {formatCurrency(assets.currentAssets?.total || 0)}
                            </Text>
                        </TouchableOpacity>

                        {expandedSections.has('currentAssets') && (
                            <View style={styles.itemsContainer}>
                                {assets.currentAssets?.items?.map((item: any, index: number) => (
                                    <View key={index} style={styles.itemRow}>
                                        <Text style={styles.itemCode}>{item.code}</Text>
                                        <Text style={styles.itemName}>{item.name}</Text>
                                        <Text style={styles.itemAmount}>KES {formatCurrency(item.amount || 0)}</Text>
                                    </View>
                                ))}
                                {(!assets.currentAssets?.items || assets.currentAssets.items.length === 0) && (
                                    <Text style={styles.emptyText}>No current assets</Text>
                                )}
                            </View>
                        )}
                    </View>

                    {/* 2. Non-Current Assets */}
                    <View style={styles.subSection}>
                        <TouchableOpacity
                            style={styles.subSectionHeader}
                            onPress={() => toggleSection('nonCurrentAssets')}
                        >
                            <View style={styles.subSectionLeft}>
                                <Ionicons
                                    name={expandedSections.has('nonCurrentAssets') ? 'chevron-down' : 'chevron-forward'}
                                    size={18}
                                    color={COLORS.gray}
                                />
                                <Text style={styles.subSectionTitle}>
                                    2. Non-Current Assets
                                </Text>
                            </View>
                            <Text style={styles.subSectionAmount}>
                                KES {formatCurrency(assets.nonCurrentAssets?.total || 0)}
                            </Text>
                        </TouchableOpacity>

                        {expandedSections.has('nonCurrentAssets') && (
                            <View style={styles.itemsContainer}>
                                {assets.nonCurrentAssets?.items?.map((item: any, index: number) => (
                                    <View key={index} style={styles.itemRow}>
                                        <Text style={styles.itemCode}>{item.code}</Text>
                                        <Text style={styles.itemName}>{item.name}</Text>
                                        <Text style={styles.itemAmount}>KES {formatCurrency(item.amount || 0)}</Text>
                                    </View>
                                ))}
                                {(!assets.nonCurrentAssets?.items || assets.nonCurrentAssets.items.length === 0) && (
                                    <Text style={styles.emptyText}>No non-current assets</Text>
                                )}
                            </View>
                        )}
                    </View>

                    {/* Total Assets */}
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>TOTAL ASSETS</Text>
                        <Text style={[styles.totalAmount, { color: COLORS.green }]}>
                            KES {formatCurrency(assets.totalAssets || 0)}
                        </Text>
                    </View>
                </View>

                {/* ==================== SECTION B: LIABILITIES & EQUITY ==================== */}
                {/* LIABILITIES */}
                <View style={styles.mainSection}>
                    <View style={[styles.sectionHeader, { backgroundColor: COLORS.redLight }]}>
                        <View style={styles.sectionHeaderLeft}>
                            <View style={[styles.sectionIcon, { backgroundColor: COLORS.red }]}>
                                <Ionicons name="trending-down" size={20} color="#fff" />
                            </View>
                            <Text style={[styles.sectionHeaderTitle, { color: COLORS.red }]}>
                                LIABILITIES
                            </Text>
                        </View>
                        <Text style={[styles.sectionHeaderAmount, { color: COLORS.red }]}>
                            KES {formatCurrency(liabilities.totalLiabilities || 0)}
                        </Text>
                    </View>

                    {/* 1. Current Liabilities */}
                    <View style={styles.subSection}>
                        <TouchableOpacity
                            style={styles.subSectionHeader}
                            onPress={() => toggleSection('currentLiabilities')}
                        >
                            <View style={styles.subSectionLeft}>
                                <Ionicons
                                    name={expandedSections.has('currentLiabilities') ? 'chevron-down' : 'chevron-forward'}
                                    size={18}
                                    color={COLORS.gray}
                                />
                                <Text style={styles.subSectionTitle}>
                                    1. Current Liabilities
                                </Text>
                            </View>
                            <Text style={styles.subSectionAmount}>
                                KES {formatCurrency(liabilities.currentLiabilities?.total || 0)}
                            </Text>
                        </TouchableOpacity>

                        {expandedSections.has('currentLiabilities') && (
                            <View style={styles.itemsContainer}>
                                {liabilities.currentLiabilities?.items?.map((item: any, index: number) => (
                                    <View key={index} style={styles.itemRow}>
                                        <Text style={styles.itemCode}>{item.code}</Text>
                                        <Text style={styles.itemName}>{item.name}</Text>
                                        <Text style={styles.itemAmount}>KES {formatCurrency(item.amount || 0)}</Text>
                                    </View>
                                ))}
                                {(!liabilities.currentLiabilities?.items || liabilities.currentLiabilities.items.length === 0) && (
                                    <Text style={styles.emptyText}>No current liabilities</Text>
                                )}
                            </View>
                        )}
                    </View>

                    {/* 2. Non-Current Liabilities */}
                    <View style={styles.subSection}>
                        <TouchableOpacity
                            style={styles.subSectionHeader}
                            onPress={() => toggleSection('nonCurrentLiabilities')}
                        >
                            <View style={styles.subSectionLeft}>
                                <Ionicons
                                    name={expandedSections.has('nonCurrentLiabilities') ? 'chevron-down' : 'chevron-forward'}
                                    size={18}
                                    color={COLORS.gray}
                                />
                                <Text style={styles.subSectionTitle}>
                                    2. Long Term Liabilities
                                </Text>
                            </View>
                            <Text style={styles.subSectionAmount}>
                                KES {formatCurrency(liabilities.nonCurrentLiabilities?.total || 0)}
                            </Text>
                        </TouchableOpacity>

                        {expandedSections.has('nonCurrentLiabilities') && (
                            <View style={styles.itemsContainer}>
                                {liabilities.nonCurrentLiabilities?.items?.map((item: any, index: number) => (
                                    <View key={index} style={styles.itemRow}>
                                        <Text style={styles.itemCode}>{item.code}</Text>
                                        <Text style={styles.itemName}>{item.name}</Text>
                                        <Text style={styles.itemAmount}>KES {formatCurrency(item.amount || 0)}</Text>
                                    </View>
                                ))}
                                {(!liabilities.nonCurrentLiabilities?.items || liabilities.nonCurrentLiabilities.items.length === 0) && (
                                    <Text style={styles.emptyText}>No long-term liabilities</Text>
                                )}
                            </View>
                        )}
                    </View>

                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>TOTAL LIABILITIES</Text>
                        <Text style={[styles.totalAmount, { color: COLORS.red }]}>
                            KES {formatCurrency(liabilities.totalLiabilities || 0)}
                        </Text>
                    </View>
                </View>

                {/* EQUITY SECTION */}
                <View style={styles.mainSection}>
                    <View style={[styles.sectionHeader, { backgroundColor: COLORS.purpleLight }]}>
                        <View style={styles.sectionHeaderLeft}>
                            <View style={[styles.sectionIcon, { backgroundColor: COLORS.purple }]}>
                                <Ionicons name="pie-chart" size={20} color="#fff" />
                            </View>
                            <Text style={[styles.sectionHeaderTitle, { color: COLORS.purple }]}>
                                EQUITY
                            </Text>
                        </View>
                        <Text style={[styles.sectionHeaderAmount, { color: COLORS.purple }]}>
                            KES {formatCurrency(equity.total || 0)}
                        </Text>
                    </View>

                    <View style={styles.subSection}>
                        <TouchableOpacity
                            style={styles.subSectionHeader}
                            onPress={() => toggleSection('equity')}
                        >
                            <View style={styles.subSectionLeft}>
                                <Ionicons
                                    name={expandedSections.has('equity') ? 'chevron-down' : 'chevron-forward'}
                                    size={18}
                                    color={COLORS.gray}
                                />
                                <Text style={styles.subSectionTitle}>
                                    Owner's Equity
                                </Text>
                            </View>
                            <Text style={styles.subSectionAmount}>
                                KES {formatCurrency(equity.total || 0)}
                            </Text>
                        </TouchableOpacity>

                        {expandedSections.has('equity') && (
                            <View style={styles.itemsContainer}>
                                {equity.items?.map((item: any, index: number) => (
                                    <View key={index} style={styles.itemRow}>
                                        <Text style={styles.itemCode}>{item.code}</Text>
                                        <Text style={styles.itemName}>{item.name}</Text>
                                        <Text style={styles.itemAmount}>KES {formatCurrency(item.amount || 0)}</Text>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>

                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>TOTAL EQUITY</Text>
                        <Text style={[styles.totalAmount, { color: COLORS.purple }]}>
                            KES {formatCurrency(equity.total || 0)}
                        </Text>
                    </View>
                </View>

                {/* ==================== THE BOTTOM LINE (Total Liabilities + Equity) ==================== */}
                <View style={styles.netWorthSection}>
                    <View style={styles.netWorthRow}>
                        <Text style={styles.netWorthLabel}>TOTAL LIABILITIES & EQUITY</Text>
                        <Text style={[styles.netWorthValue, { color: COLORS.text }]}>
                            KES {formatCurrency(liabilitiesEquity.totalLiabilitiesAndEquity || 0)}
                        </Text>
                    </View>
                    {meta?.isBalanced && (
                        <View style={[styles.growthRow, { marginTop: 0, paddingBottom: 15 }]}>
                            <View style={[styles.growthBadge, { backgroundColor: COLORS.greenLight }]}>
                                <Ionicons name="checkmark-circle" size={16} color={COLORS.green} />
                                <Text style={[styles.growthText, { color: COLORS.green }]}>
                                    Balanced
                                </Text>
                            </View>
                        </View>
                    )}
                </View>

                {/* ==================== HEALTH METRICS (AI INSIGHTS) ==================== */}
                {insights && (
                    <View style={styles.metricsSection}>
                        <Text style={styles.metricsSectionTitle}>💡 Financial Health Metrics</Text>
                        <Text style={styles.metricsSectionSubtitle}>
                            AI-powered insights into your financial position
                        </Text>

                        {/* Cash Runway */}
                        <View style={styles.metricCard}>
                            <View style={styles.metricHeader}>
                                <View style={[styles.metricIcon, { backgroundColor: COLORS.blueLight }]}>
                                    <Ionicons name="water-outline" size={24} color={COLORS.blue} />
                                </View>
                                <View style={styles.metricInfo}>
                                    <Text style={styles.metricTitle}>Cash Runway</Text>
                                    <Text style={styles.metricSubtitle}>How long can you survive?</Text>
                                </View>
                            </View>
                            <Text style={[styles.metricValue, { color: COLORS.blue }]}>
                                {insights.survivalText}
                            </Text>
                            <Text style={styles.metricDescription}>
                                Based on your liquid cash and average monthly expenses
                            </Text>
                        </View>

                        {/* Debt Ratio */}
                        <View style={styles.metricCard}>
                            <View style={styles.metricHeader}>
                                <View style={[styles.metricIcon, { backgroundColor: COLORS.orangeLight }]}>
                                    <Ionicons name="pie-chart-outline" size={24} color={COLORS.orange} />
                                </View>
                                <View style={styles.metricInfo}>
                                    <Text style={styles.metricTitle}>Debt Ratio</Text>
                                    <Text style={styles.metricSubtitle}>What % of assets are borrowed?</Text>
                                </View>
                            </View>
                            <Text style={[styles.metricValue, { color: COLORS.orange }]}>
                                {insights.debtRatio}
                            </Text>
                            <Text style={styles.metricDescription}>
                                Lower is better. Aim for below 50% for healthy finances
                            </Text>
                        </View>

                        {/* Liquidity Status */}
                        <View style={styles.metricCard}>
                            <View style={styles.metricHeader}>
                                <View style={[styles.metricIcon, {
                                    backgroundColor: insights.liquidityStatus === 'HEALTHY' ? COLORS.greenLight : COLORS.redLight
                                }]}>
                                    <Ionicons
                                        name={insights.liquidityStatus === 'HEALTHY' ? "checkmark-circle" : "alert-circle"}
                                        size={24}
                                        color={insights.liquidityStatus === 'HEALTHY' ? COLORS.green : COLORS.red}
                                    />
                                </View>
                                <View style={styles.metricInfo}>
                                    <Text style={styles.metricTitle}>Liquidity Status</Text>
                                    <Text style={styles.metricSubtitle}>Can you pay short-term debt?</Text>
                                </View>
                            </View>
                            <View style={[styles.statusBadge, {
                                backgroundColor: insights.liquidityStatus === 'HEALTHY' ? COLORS.greenLight : COLORS.redLight
                            }]}>
                                <Text style={[styles.statusText, {
                                    color: insights.liquidityStatus === 'HEALTHY' ? COLORS.green : COLORS.red
                                }]}>
                                    {insights.liquidityStatus}
                                </Text>
                            </View>
                            <Text style={styles.metricDescription}>
                                {insights.liquidityStatus === 'HEALTHY'
                                    ? `You have KES ${formatCurrency(insights.liquidityGap)} excess liquid cash`
                                    : `You need KES ${formatCurrency(Math.abs(insights.liquidityGap))} more liquid cash`}
                            </Text>
                        </View>

                        {/* Ownership Percentage */}
                        <View style={styles.metricCard}>
                            <View style={styles.metricHeader}>
                                <View style={[styles.metricIcon, { backgroundColor: COLORS.purpleLight }]}>
                                    <Ionicons name="trophy-outline" size={24} color={COLORS.purple} />
                                </View>
                                <View style={styles.metricInfo}>
                                    <Text style={styles.metricTitle}>True Ownership</Text>
                                    <Text style={styles.metricSubtitle}>What % do you actually own?</Text>
                                </View>
                            </View>
                            <Text style={[styles.metricValue, { color: COLORS.purple }]}>
                                {insights.ownershipPercentage}
                            </Text>
                            <Text style={styles.metricDescription}>
                                Net Worth ÷ Total Assets. Higher is better!
                            </Text>
                        </View>
                    </View>
                )}

                {/* Footer */}
                <View style={styles.footer}>
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
        backgroundColor: '#f9fafb',
    },
    header: {
        paddingTop: 20,
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    headerCenter: {
        alignItems: 'center',
        flex: 1,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
    },
    headerSubtitle: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: 2,
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginTop: 8,
    },
    dateText: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.9)',
        fontWeight: '600',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: COLORS.gray,
    },
    content: {
        flex: 1,
    },
    mainSection: {
        marginHorizontal: 16,
        marginTop: 20,
        backgroundColor: COLORS.white,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    sectionHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    sectionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sectionHeaderTitle: {
        fontSize: 16,
        fontWeight: '700',
        flex: 1,
    },
    sectionHeaderAmount: {
        fontSize: 18,
        fontWeight: '800',
    },
    subSection: {
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    subSectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: COLORS.grayLight,
    },
    subSectionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    subSectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
        flex: 1,
    },
    subSectionAmount: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.text,
    },
    itemsContainer: {
        paddingVertical: 8,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    itemCode: {
        fontSize: 13,
        color: COLORS.gray,
        fontWeight: '600',
        width: 50,
    },
    itemName: {
        fontSize: 14,
        color: COLORS.textLight,
        flex: 1,
        marginLeft: 8,
    },
    itemAmount: {
        fontSize: 14,
        color: COLORS.text,
        fontWeight: '500',
    },
    emptyText: {
        fontSize: 13,
        color: COLORS.gray,
        fontStyle: 'italic',
        paddingHorizontal: 24,
        paddingVertical: 8,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: COLORS.grayLight,
        borderTopWidth: 2,
        borderTopColor: COLORS.border,
    },
    totalLabel: {
        fontSize: 15,
        fontWeight: '800',
        color: COLORS.text,
        letterSpacing: 0.5,
    },
    totalAmount: {
        fontSize: 20,
        fontWeight: '800',
    },
    netWorthSection: {
        marginHorizontal: 16,
        marginTop: 24,
        marginBottom: 20,
        backgroundColor: COLORS.white,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 5,
        borderWidth: 2,
        borderColor: COLORS.primary,
    },
    netWorthRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
    },
    netWorthLabel: {
        fontSize: 18,
        fontWeight: '800',
        color: COLORS.text,
        letterSpacing: 0.5,
    },
    netWorthValue: {
        fontSize: 24,
        fontWeight: '900',
    },
    growthRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 8,
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    growthBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    growthText: {
        fontSize: 13,
        fontWeight: '700',
    },
    growthLabel: {
        fontSize: 13,
        color: COLORS.gray,
        fontStyle: 'italic',
    },
    metricsSection: {
        marginHorizontal: 16,
        marginTop: 32,
    },
    metricsSectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 4,
    },
    metricsSectionSubtitle: {
        fontSize: 13,
        color: COLORS.gray,
        marginBottom: 16,
    },
    metricCard: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 2,
    },
    metricHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    metricIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    metricInfo: {
        flex: 1,
    },
    metricTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.text,
    },
    metricSubtitle: {
        fontSize: 12,
        color: COLORS.gray,
        marginTop: 2,
    },
    metricValue: {
        fontSize: 28,
        fontWeight: '800',
        marginBottom: 8,
    },
    metricDescription: {
        fontSize: 13,
        color: COLORS.textLight,
        lineHeight: 18,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        marginBottom: 8,
    },
    statusText: {
        fontSize: 13,
        fontWeight: '700',
    },
    footer: {
        marginTop: 32,
        alignItems: 'center',
        paddingBottom: 16,
    },
    footerText: {
        fontSize: 11,
        color: COLORS.gray,
    },
});
