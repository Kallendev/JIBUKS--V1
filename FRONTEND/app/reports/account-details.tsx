import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    ActivityIndicator,
    FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import apiService from '@/services/api';

export default function AccountDetailsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { accountId, startDate, endDate } = params;

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        if (accountId) {
            loadData();
        }
    }, [accountId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const res = await apiService.getAccountTransactions(accountId as string, {
                startDate: startDate as string,
                endDate: endDate as string,
                limit: 100 // Load last 100 transactions
            });
            setData(res);
        } catch (error) {
            console.error('Error loading account details:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return amount.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
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
                    <Text style={styles.headerTitle}>Loading...</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2563eb" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1f2937" />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>{data?.account?.name || 'Account Details'}</Text>
                    <Text style={styles.headerSubtitle}>{data?.account?.code}</Text>
                </View>
                <View style={{ width: 40 }} />
            </View>

            {/* Summary Card */}
            <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                    <View>
                        <Text style={styles.summaryLabel}>Total Net Change</Text>
                        <Text style={styles.summaryDate}>
                            {startDate ? formatDate(startDate as string) : ''} - {endDate ? formatDate(endDate as string) : ''}
                        </Text>
                    </View>
                    <Text style={styles.summaryAmount}>
                        KES {formatCurrency(data?.totals?.netChange || 0)}
                    </Text>
                </View>
            </View>

            {/* Transactions List */}
            <FlatList
                data={data?.transactions || []}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                renderItem={({ item, index }) => (
                    <View style={[styles.transactionRow, index % 2 === 0 && styles.rowAlt]}>
                        <View style={styles.rowLeft}>
                            <Text style={styles.dateText}>{formatDate(item.date)}</Text>
                            <Text style={styles.descText} numberOfLines={2}>
                                {item.description}
                            </Text>
                            {item.reference ? <Text style={styles.refText}>Ref: {item.reference}</Text> : null}
                        </View>
                        <Text style={styles.amountText}>
                            {formatCurrency(item.amount)}
                        </Text>
                    </View>
                )}
                ListHeaderComponent={
                    <View style={styles.tableHeader}>
                        <Text style={styles.tableHeaderLeft}>Date / Description</Text>
                        <Text style={styles.tableHeaderRight}>Amount</Text>
                    </View>
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No transactions found in this period.</Text>
                    </View>
                }
            />
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
        fontSize: 16,
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
    summaryCard: {
        backgroundColor: '#f9fafb',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    summaryLabel: {
        fontSize: 12,
        color: '#6b7280',
        textTransform: 'uppercase',
        fontWeight: '600',
    },
    summaryDate: {
        fontSize: 12,
        color: '#9ca3af',
        marginTop: 2,
    },
    summaryAmount: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1f2937',
        fontFamily: 'monospace',
    },
    listContent: {
        paddingBottom: 20,
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
    transactionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start', // Align top for multiline desc
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    rowAlt: {
        backgroundColor: '#fafafa',
    },
    rowLeft: {
        flex: 1,
        paddingRight: 16,
    },
    dateText: {
        fontSize: 11,
        color: '#9ca3af',
        marginBottom: 2,
    },
    descText: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '500',
    },
    refText: {
        fontSize: 11,
        color: '#6b7280',
        fontStyle: 'italic',
        marginTop: 2,
    },
    amountText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1f2937',
        fontFamily: 'monospace',
        paddingTop: 2, // Align with desc
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        color: '#9ca3af',
        fontStyle: 'italic',
    },
});
