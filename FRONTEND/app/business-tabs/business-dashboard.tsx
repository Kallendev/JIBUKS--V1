import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    Image,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import apiService from '@/services/api';

const { width } = Dimensions.get('window');

function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
}

function formatCurrency(n: number) {
    return `KES ${Number(n).toLocaleString()}`;
}

function formatActivityDate(d: string) {
    const date = new Date(d);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    return isToday
        ? date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
        : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default function BusinessDashboardScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();

    const [userName, setUserName] = useState<string>('');
    const [summary, setSummary] = useState<{ totalIncome: number; totalExpenses: number; balance: number } | null>(null);
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const businessName = Array.isArray(params.businessName)
        ? params.businessName[0]
        : params.businessName || 'My Business';
    const ownerName = Array.isArray(params.ownerName)
        ? params.ownerName[0]
        : params.ownerName || '';

    const loadUserData = useCallback(async () => {
        try {
            const user = await apiService.getCurrentUser();
            if (user && user.name) setUserName(user.name);
        } catch (e) {
            console.error('Error loading user:', e);
        }
    }, []);

    const loadDashboard = useCallback(async () => {
        try {
            const data = await apiService.getDashboard();
            if (data?.summary) {
                setSummary({
                    totalIncome: Number(data.summary.totalIncome ?? 0),
                    totalExpenses: Number(data.summary.totalExpenses ?? 0),
                    balance: Number(data.summary.balance ?? 0),
                });
            } else {
                const stats = await apiService.getTransactionStats();
                setSummary({
                    totalIncome: stats.totalIncome ?? 0,
                    totalExpenses: stats.totalExpenses ?? 0,
                    balance: (stats.totalIncome ?? 0) - (stats.totalExpenses ?? 0),
                });
            }
            const list = data?.recentTransactions ?? [];
            setRecentActivity(Array.isArray(list) ? list.slice(0, 10) : []);
        } catch (e) {
            console.error('Error loading dashboard:', e);
            setSummary({ totalIncome: 0, totalExpenses: 0, balance: 0 });
            setRecentActivity([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadUserData();
    }, [loadUserData]);

    useEffect(() => {
        loadDashboard();
    }, [loadDashboard]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadDashboard();
    }, [loadDashboard]);

    const displayName = userName || ownerName || 'There';

    return (
        <View style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1e3a8a']} />}
            >
                {/* Blue Header Section */}
                <View style={styles.header}>
                    <LinearGradient
                        colors={['#1e3a8a', '#1e3a8a']} // Solid deep blue as per screenshot
                        style={styles.headerGradient}
                    >
                        <View style={styles.profileSection}>
                            <View style={styles.avatarBorder}>
                                <Image
                                    source={{ uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200' }}
                                    style={styles.avatar}
                                />
                            </View>
                            <Text style={styles.greetingText}>{getGreeting()}, {displayName} 👋</Text>
                        </View>

                        {/* White Curved Card for Business Name */}
                        <View style={styles.businessCard}>
                            <Text style={styles.businessNameText}>{businessName.toUpperCase()}</Text>
                            <View style={styles.orangeUnderline} />
                        </View>
                    </LinearGradient>
                </View>

                {/* Summary Section */}
                <View style={styles.summarySection}>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryHeader}>This month</Text>
                        {loading ? (
                            <View style={styles.summaryRow}>
                                <ActivityIndicator size="small" color="#1e3a8a" style={{ flex: 1 }} />
                            </View>
                        ) : (
                            <View style={styles.summaryRow}>
                                <View style={styles.summaryItem}>
                                    <View style={styles.summaryValueContainer}>
                                        <Text style={styles.emoji}>💰</Text>
                                        <Text style={styles.currencyValue}>{formatCurrency(summary?.totalIncome ?? 0)}</Text>
                                    </View>
                                    <Text style={styles.summaryLabel}>Income</Text>
                                </View>
                                <View style={styles.summaryItem}>
                                    <View style={styles.summaryValueContainer}>
                                        <Text style={styles.emoji}>💸</Text>
                                        <Text style={styles.currencyValue}>{formatCurrency(summary?.totalExpenses ?? 0)}</Text>
                                    </View>
                                    <Text style={styles.summaryLabel}>Expenses</Text>
                                </View>
                                <View style={styles.summaryItem}>
                                    <View style={styles.summaryValueContainer}>
                                        <Text style={styles.emoji}>📊</Text>
                                        <Text style={[styles.currencyValue, { color: (summary?.balance ?? 0) >= 0 ? '#10b981' : '#ef4444' }]}>
                                            {formatCurrency(summary?.balance ?? 0)}
                                        </Text>
                                    </View>
                                    <Text style={styles.summaryLabel}>Balance</Text>
                                </View>
                            </View>
                        )}
                    </View>
                </View>

                {/* Action Buttons Row */}
                <View style={styles.actionsRow}>
                    <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/business-tabs/sales/cash-sale')}>
                        <Text style={styles.actionButtonText}>Cash Sale</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/create-invoice')}>
                        <Text style={styles.actionButtonText}>Credit Sale</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/add-expense')}>
                        <Text style={styles.actionButtonText}>Add Expense</Text>
                    </TouchableOpacity>
                </View>

                {/* Management Grid */}
                <View style={styles.gridContainer}>
                    <View style={styles.gridRow}>
                        <GridItem emoji="👤" label="Customers" onPress={() => router.push('/business-tabs/sales/customers')} />
                        <GridItem emoji="👨‍👩‍👧‍👦" label="Suppliers" onPress={() => router.push('/vendors')} />
                        <GridItem emoji="💰" label="Expenses" onPress={() => router.push('/expenses')} />
                    </View>
                    <View style={styles.gridRow}>
                        <GridItem emoji="📦" label="Inventory" onPress={() => router.push('/inventory' as any)} />
                        <GridItem emoji="📈" label="Reports" onPress={() => router.push('/reports')} />
                        <GridItem emoji="📥" label="Income" onPress={() => router.push('/income')} />
                    </View>
                    <View style={styles.gridRow}>
                        <GridItem emoji="⋮" label="MORE" onPress={() => router.push('/business-tabs/more-business')} />
                    </View>
                </View>

                {/* Recent Activity */}
                <View style={styles.activitySection}>
                    <View style={styles.activityContainer}>
                        <Text style={styles.activityTitle}>Recent Activity</Text>
                        {recentActivity.length === 0 ? (
                            <Text style={styles.activityEmpty}>No recent transactions</Text>
                        ) : (
                            recentActivity.map((item: any) => (
                                <View key={item.id} style={styles.activityItem}>
                                    <Ionicons
                                        name={item.type === 'INCOME' ? 'arrow-down-circle' : 'arrow-up-circle'}
                                        size={16}
                                        color={item.type === 'INCOME' ? '#10b981' : '#ef4444'}
                                    />
                                    <Text style={styles.activityText} numberOfLines={1}>
                                        {formatActivityDate(item.date)} · {item.description || item.category || 'Transaction'} · {formatCurrency(Number(item.amount ?? 0))}
                                    </Text>
                                </View>
                            ))
                        )}
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>Powered by Apbc</Text>
                    <View style={styles.footerIcon}>
                        <Text style={styles.footerIconText}>A</Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

function GridItem({ emoji, label, onPress }: { emoji: string; label: string; onPress?: () => void }) {
    return (
        <TouchableOpacity style={styles.gridItem} onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
            <View style={styles.gridIconCircle}>
                <Text style={styles.gridEmoji}>{emoji}</Text>
            </View>
            <Text style={styles.gridLabel}>{label}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollContent: {
        paddingBottom: 100,
    },
    header: {
        height: 250,
    },
    headerGradient: {
        flex: 1,
        paddingTop: 40,
        alignItems: 'center',
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
    },
    profileSection: {
        alignItems: 'center',
        marginBottom: 20,
    },
    avatarBorder: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 3,
        borderColor: '#f59e0b',
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    avatar: {
        width: 74,
        height: 74,
        borderRadius: 37,
    },
    greetingText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#f59e0b',
        marginTop: 12,
    },
    businessCard: {
        position: 'absolute',
        bottom: -15,
        backgroundColor: '#fff',
        width: '85%',
        paddingVertical: 12,
        borderRadius: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    businessNameText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1e3a8a',
        letterSpacing: 1,
    },
    orangeUnderline: {
        width: 150,
        height: 3,
        backgroundColor: '#f59e0b',
        marginTop: 4,
    },
    summarySection: {
        marginTop: 40,
        paddingHorizontal: 15,
    },
    summaryCard: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 15,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    summaryHeader: {
        textAlign: 'center',
        fontSize: 12,
        color: '#1e3a8a',
        fontWeight: '600',
        marginBottom: 15,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    summaryItem: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
        marginHorizontal: 4,
        paddingVertical: 12,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    summaryValueContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    emoji: {
        fontSize: 14,
        marginRight: 4,
    },
    currencyValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#000',
    },
    summaryLabel: {
        fontSize: 11,
        color: '#64748b',
    },
    actionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginTop: 25,
    },
    actionButton: {
        backgroundColor: '#1e3a8a',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
        width: (width - 60) / 3,
        alignItems: 'center',
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '600',
    },
    gridContainer: {
        marginTop: 25,
        paddingHorizontal: 20,
    },
    gridRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 20,
    },
    gridItem: {
        alignItems: 'center',
        width: (width - 60) / 3,
    },
    gridIconCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#1e3a8a',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    gridEmoji: {
        fontSize: 28,
    },
    gridLabel: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '500',
    },
    activitySection: {
        paddingHorizontal: 20,
        marginTop: 10,
    },
    activityContainer: {
        borderWidth: 2,
        borderColor: '#1e3a8a',
        borderRadius: 15,
        padding: 15,
    },
    activityTitle: {
        fontSize: 14,
        color: '#1e3a8a',
        fontWeight: 'bold',
        marginBottom: 10,
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e5e7eb',
        padding: 8,
        borderRadius: 4,
        marginBottom: 8,
    },
    activityText: {
        fontSize: 12,
        color: '#374151',
        marginLeft: 8,
        flex: 1,
    },
    activityEmpty: {
        fontSize: 13,
        color: '#6b7280',
        fontStyle: 'italic',
    },
    footer: {
        marginTop: 30,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
    },
    footerText: {
        fontSize: 10,
        color: '#94a3b8',
        marginRight: 6,
    },
    footerIcon: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#1e3a8a',
        justifyContent: 'center',
        alignItems: 'center',
    },
    footerIconText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
});
