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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import apiService from '@/services/api';

export default function PurchasesScreen() {
    const router = useRouter();
    const [purchases, setPurchases] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState('ALL'); // ALL, UNPAID, PAID

    useEffect(() => {
        loadPurchases();
    }, [filter]);

    const loadPurchases = async () => {
        try {
            setLoading(true);
            const queryString = filter !== 'ALL' ? `?status=${filter}` : '';
            const data = await apiService.request(`/purchases${queryString}`, {
                method: 'GET'
            });
            setPurchases(data);
        } catch (error) {
            console.error('Error loading purchases:', error);
            Alert.alert('Error', 'Failed to load purchases');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadPurchases();
        setRefreshing(false);
    };

    const formatCurrency = (amount) => {
        return `KES ${Number(amount).toLocaleString()}`;
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'PAID':
                return '#10b981';
            case 'PARTIAL':
                return '#f59e0b';
            case 'UNPAID':
                return '#ef4444';
            case 'DRAFT':
                return '#6b7280';
            case 'CANCELLED':
                return '#9ca3af';
            default:
                return '#6b7280';
        }
    };

    const handlePurchasePress = (purchase) => {
        router.push(`/purchase-detail?id=${purchase.id}` as any);
    };

    const handleNewPurchase = () => {
        router.push('/new-purchase' as any);
    };

    const calculateSummary = () => {
        const total = purchases.reduce((sum, p) => sum + Number(p.total), 0);
        const paid = purchases.reduce((sum, p) => sum + Number(p.amountPaid), 0);
        const outstanding = total - paid;

        return { total, paid, outstanding };
    };

    const summary = calculateSummary();

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#1f2937" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Purchases</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2563eb" />
                    <Text style={styles.loadingText}>Loading purchases...</Text>
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
                <Text style={styles.headerTitle}>Purchases</Text>
                <TouchableOpacity onPress={handleNewPurchase} style={styles.addButton}>
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
                {/* Summary Cards */}
                <View style={styles.summaryContainer}>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>Total Purchases</Text>
                        <Text style={styles.summaryValue}>{formatCurrency(summary.total)}</Text>
                    </View>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>Paid</Text>
                        <Text style={[styles.summaryValue, { color: '#10b981' }]}>
                            {formatCurrency(summary.paid)}
                        </Text>
                    </View>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>Outstanding</Text>
                        <Text style={[styles.summaryValue, { color: '#ef4444' }]}>
                            {formatCurrency(summary.outstanding)}
                        </Text>
                    </View>
                </View>

                {/* Filter Tabs */}
                <View style={styles.filterContainer}>
                    <TouchableOpacity
                        style={[styles.filterTab, filter === 'ALL' && styles.filterTabActive]}
                        onPress={() => setFilter('ALL')}
                    >
                        <Text style={[styles.filterText, filter === 'ALL' && styles.filterTextActive]}>
                            All
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterTab, filter === 'UNPAID' && styles.filterTabActive]}
                        onPress={() => setFilter('UNPAID')}
                    >
                        <Text style={[styles.filterText, filter === 'UNPAID' && styles.filterTextActive]}>
                            Unpaid
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterTab, filter === 'PAID' && styles.filterTabActive]}
                        onPress={() => setFilter('PAID')}
                    >
                        <Text style={[styles.filterText, filter === 'PAID' && styles.filterTextActive]}>
                            Paid
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Purchases List */}
                <View style={styles.listContainer}>
                    {purchases.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="receipt-outline" size={64} color="#d1d5db" />
                            <Text style={styles.emptyText}>No purchases found</Text>
                            <Text style={styles.emptySubtext}>
                                Tap the + button to create your first purchase
                            </Text>
                        </View>
                    ) : (
                        purchases.map((purchase) => (
                            <TouchableOpacity
                                key={purchase.id}
                                style={styles.purchaseCard}
                                onPress={() => handlePurchasePress(purchase)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.purchaseHeader}>
                                    <View style={styles.purchaseLeft}>
                                        <View style={styles.iconCircle}>
                                            <Ionicons name="receipt" size={20} color="#2563eb" />
                                        </View>
                                        <View>
                                            <Text style={styles.vendorName}>
                                                {purchase.vendor?.name || 'No Vendor'}
                                            </Text>
                                            <Text style={styles.billNumber}>
                                                {purchase.billNumber || `Purchase #${purchase.id}`}
                                            </Text>
                                        </View>
                                    </View>
                                    <View
                                        style={[
                                            styles.statusBadge,
                                            { backgroundColor: `${getStatusColor(purchase.status)}20` },
                                        ]}
                                    >
                                        <Text style={[styles.statusText, { color: getStatusColor(purchase.status) }]}>
                                            {purchase.status}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.purchaseDetails}>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Date:</Text>
                                        <Text style={styles.detailValue}>
                                            {formatDate(purchase.purchaseDate)}
                                        </Text>
                                    </View>
                                    {purchase.dueDate && (
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Due:</Text>
                                            <Text style={styles.detailValue}>{formatDate(purchase.dueDate)}</Text>
                                        </View>
                                    )}
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Total:</Text>
                                        <Text style={styles.totalAmount}>{formatCurrency(purchase.total)}</Text>
                                    </View>
                                    {purchase.status !== 'PAID' && purchase.balance > 0 && (
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Balance:</Text>
                                            <Text style={[styles.totalAmount, { color: '#ef4444' }]}>
                                                {formatCurrency(purchase.balance)}
                                            </Text>
                                        </View>
                                    )}
                                </View>

                                <View style={styles.purchaseFooter}>
                                    <Text style={styles.itemCount}>
                                        {purchase.items?.length || 0} item(s)
                                    </Text>
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
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    filterContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        marginBottom: 16,
        gap: 8,
    },
    filterTab: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        backgroundColor: '#fff',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    filterTabActive: {
        backgroundColor: '#2563eb',
        borderColor: '#2563eb',
    },
    filterText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6b7280',
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
    purchaseCard: {
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
    purchaseHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    purchaseLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#dbeafe',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    vendorName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
    },
    billNumber: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    purchaseDetails: {
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
    totalAmount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2563eb',
    },
    purchaseFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
        paddingTop: 12,
    },
    itemCount: {
        fontSize: 12,
        color: '#6b7280',
    },
});
