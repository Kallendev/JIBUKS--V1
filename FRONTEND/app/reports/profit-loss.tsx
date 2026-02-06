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

export default function ProfitLossScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [reportData, setReportData] = useState<any>(null);
    const [selectedPeriod, setSelectedPeriod] = useState('THIS_MONTH');
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['INCOME', 'EXPENSES']));

    useEffect(() => {
        loadData();
    }, [selectedPeriod]);


    const toggleSection = (section: string) => {
        const newExpanded = new Set(expandedSections);
        if (newExpanded.has(section)) {
            newExpanded.delete(section);
        } else {
            newExpanded.add(section);
        }
        setExpandedSections(newExpanded);
    };

    const getPeriodDates = () => {
        const now = new Date();
        let startDate, endDate;

        switch (selectedPeriod) {
            case 'THIS_MONTH':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                break;
            case 'LAST_MONTH':
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                endDate = new Date(now.getFullYear(), now.getMonth(), 0);
                break;
            case 'THIS_YEAR':
                startDate = new Date(now.getFullYear(), 0, 1);
                endDate = new Date(now.getFullYear(), 11, 31);
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        }

        return {
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
        };
    };

    const handleAccountPress = (accountId: string, accountName: string, accountCode: string) => {
        const { startDate, endDate } = getPeriodDates();
        router.push({
            pathname: '/reports/account-details',
            params: {
                accountId,
                accountName,
                accountCode,
                startDate,
                endDate
            }
        });
    };

    const loadData = async () => {
        try {
            setLoading(true);
            const { startDate, endDate } = getPeriodDates();
            const data = await apiService.getProfitLoss(startDate, endDate);
            setReportData(data);
        } catch (error) {
            console.error('Error loading P&L:', error);
            Alert.alert('Error', 'Failed to load Profit & Loss report');
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
        return amount.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    const periods = [
        { key: 'THIS_MONTH', label: 'This Month' },
        { key: 'LAST_MONTH', label: 'Last Month' },
        { key: 'THIS_YEAR', label: 'This Year' },
    ];

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <Stack.Screen options={{ headerShown: false }} />
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#1f2937" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Profit & Loss</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2563eb" />
                </View>
            </SafeAreaView>
        );
    }

    const isPositiveNetIncome = (reportData?.netIncome || 0) >= 0;

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            {/* Professional Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1f2937" />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>Profit & Loss Statement</Text>
                    <Text style={styles.headerSubtitle}>
                        {selectedPeriod.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
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
                {/* Period Selector Tabs */}
                <View style={styles.periodTabs}>
                    {periods.map((period) => (
                        <TouchableOpacity
                            key={period.key}
                            style={[
                                styles.periodTab,
                                selectedPeriod === period.key && styles.periodTabActive,
                            ]}
                            onPress={() => setSelectedPeriod(period.key)}
                        >
                            <Text
                                style={[
                                    styles.periodTabText,
                                    selectedPeriod === period.key && styles.periodTabTextActive,
                                ]}
                            >
                                {period.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Report Table */}
                <View style={styles.reportContainer}>
                    <View style={styles.tableHeader}>
                        <Text style={styles.tableHeaderLeft}>Account</Text>
                        <Text style={styles.tableHeaderRight}>Amount (KES)</Text>
                    </View>

                    {/* INCOME SECTION */}
                    <View style={styles.tableSection}>
                        <TouchableOpacity
                            style={styles.sectionHeaderRow}
                            onPress={() => toggleSection('INCOME')}
                        >
                            <View style={styles.sectionTitleContainer}>
                                <Ionicons
                                    name={expandedSections.has('INCOME') ? "chevron-down" : "chevron-forward"}
                                    size={16}
                                    color="#4b5563"
                                />
                                <Text style={styles.sectionTitle}>Income</Text>
                            </View>
                            <Text style={styles.sectionTotal}>{formatCurrency(reportData?.income?.total || 0)}</Text>
                        </TouchableOpacity>

                        {expandedSections.has('INCOME') && (
                            <View>
                                {reportData?.income?.lines?.length > 0 ? (
                                    reportData.income.lines.map((line: any, index: number) => (
                                        <TouchableOpacity
                                            key={index}
                                            style={[styles.tableRow, index % 2 === 0 && styles.tableRowAlt]}
                                            onPress={() => handleAccountPress(line.accountId, line.name, line.code)}
                                        >
                                            <Text style={styles.accountName}>{line.name}</Text>
                                            <Text style={styles.amountText}>{formatCurrency(line.amount)}</Text>
                                        </TouchableOpacity>
                                    ))
                                ) : (
                                    <View style={styles.tableRow}>
                                        <Text style={styles.emptyText}>No income recorded</Text>
                                        <Text style={styles.amountText}>0.00</Text>
                                    </View>
                                )}
                                <View style={[styles.tableRow, styles.subTotalRow]}>
                                    <Text style={styles.subTotalLabel}>Total Income</Text>
                                    <Text style={styles.subTotalValue}>{formatCurrency(reportData?.income?.total || 0)}</Text>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* EXPENSES SECTION */}
                    <View style={styles.tableSection}>
                        <TouchableOpacity
                            style={styles.sectionHeaderRow}
                            onPress={() => toggleSection('EXPENSES')}
                        >
                            <View style={styles.sectionTitleContainer}>
                                <Ionicons
                                    name={expandedSections.has('EXPENSES') ? "chevron-down" : "chevron-forward"}
                                    size={16}
                                    color="#4b5563"
                                />
                                <Text style={styles.sectionTitle}>Expenses</Text>
                            </View>
                            <Text style={styles.sectionTotal}>{formatCurrency(reportData?.expenses?.total || 0)}</Text>
                        </TouchableOpacity>

                        {expandedSections.has('EXPENSES') && (
                            <View>
                                {reportData?.expenses?.lines?.length > 0 ? (
                                    reportData.expenses.lines.map((line: any, index: number) => (
                                        <TouchableOpacity
                                            key={index}
                                            style={[styles.tableRow, index % 2 === 0 && styles.tableRowAlt]}
                                            onPress={() => handleAccountPress(line.accountId, line.name, line.code)}
                                        >
                                            <Text style={styles.accountName}>{line.name}</Text>
                                            <Text style={styles.amountText}>{formatCurrency(line.amount)}</Text>
                                        </TouchableOpacity>
                                    ))
                                ) : (
                                    <View style={styles.tableRow}>
                                        <Text style={styles.emptyText}>No expenses recorded</Text>
                                        <Text style={styles.amountText}>0.00</Text>
                                    </View>
                                )}
                                <View style={[styles.tableRow, styles.subTotalRow]}>
                                    <Text style={styles.subTotalLabel}>Total Expenses</Text>
                                    <Text style={styles.subTotalValue}>{formatCurrency(reportData?.expenses?.total || 0)}</Text>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* NET INCOME SUMMARY */}
                    <View style={styles.highlightRow}>
                        <Text style={styles.highlightLabel}>Net Income</Text>
                        <Text
                            style={[
                                styles.highlightValue,
                                { color: isPositiveNetIncome ? '#10b981' : '#ef4444' }
                            ]}
                        >
                            {formatCurrency(reportData?.netIncome || 0)}
                        </Text>
                    </View>

                    {/* METRICS FOOTER */}
                    <View style={styles.metricsFooter}>
                        <View style={styles.metricItem}>
                            <Text style={styles.metricLabel}>Savings Rate</Text>
                            <Text style={styles.metricValue}>{reportData?.savingsRate}%</Text>
                        </View>
                        <View style={styles.metricDivider} />
                        <View style={styles.metricItem}>
                            <Text style={styles.metricLabel}>Profit Margin</Text>
                            <Text style={styles.metricValue}>
                                {reportData?.income?.total > 0
                                    ? ((reportData.netIncome / reportData.income.total) * 100).toFixed(1)
                                    : '0.0'}%
                            </Text>
                        </View>
                    </View>

                </View>

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
    periodTabs: {
        flexDirection: 'row',
        padding: 16,
        gap: 8,
        justifyContent: 'center',
    },
    periodTab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    periodTabActive: {
        backgroundColor: '#2563eb',
        borderColor: '#2563eb',
    },
    periodTabText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#6b7280',
    },
    periodTabTextActive: {
        color: '#fff',
    },
    reportContainer: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
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
    sectionTotal: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1f2937',
    },
    tableRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        paddingHorizontal: 16,
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
        fontFamily: 'monospace', // Use monospace for improved tabular alignment of numbers
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
    metricsFooter: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
        backgroundColor: '#f9fafb',
    },
    metricItem: {
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    metricLabel: {
        fontSize: 11,
        color: '#6b7280',
        marginBottom: 2,
        textTransform: 'uppercase',
    },
    metricValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
    },
    metricDivider: {
        width: 1,
        height: 24,
        backgroundColor: '#e5e7eb',
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
