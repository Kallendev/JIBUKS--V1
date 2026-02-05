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
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '@/services/api';

const ONBOARDING_KEY = 'businessOnboardingComplete';

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
    const [summary, setSummary] = useState<{
        revenue: number;
        expenses: number;
        netIncome: number;
        cashBankBalance: number;
        arBalance: number;
    } | null>(null);
    const [counts, setCounts] = useState<{ unpaidInvoices: number; overdueInvoices: number; customers: number } | null>(null);
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [onboardingChecked, setOnboardingChecked] = useState(false);

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
            const data = await apiService.getBusinessDashboard();
            if (data?.summary) {
                setSummary({
                    revenue: Number(data.summary.revenue ?? 0),
                    expenses: Number(data.summary.expenses ?? 0),
                    netIncome: Number(data.summary.netIncome ?? 0),
                    cashBankBalance: Number(data.summary.cashBankBalance ?? 0),
                    arBalance: Number(data.summary.arBalance ?? 0),
                });
            } else {
                setSummary({ revenue: 0, expenses: 0, netIncome: 0, cashBankBalance: 0, arBalance: 0 });
            }
            if (data?.counts) {
                setCounts({
                    unpaidInvoices: Number(data.counts.unpaidInvoices ?? 0),
                    overdueInvoices: Number(data.counts.overdueInvoices ?? 0),
                    customers: Number(data.counts.customers ?? 0),
                });
            } else {
                setCounts({ unpaidInvoices: 0, overdueInvoices: 0, customers: 0 });
            }
            const list = data?.recentActivity ?? [];
            setRecentActivity(Array.isArray(list) ? list : []);
        } catch (e) {
            console.error('Error loading business dashboard:', e);
            setSummary({ revenue: 0, expenses: 0, netIncome: 0, cashBankBalance: 0, arBalance: 0 });
            setCounts({ unpaidInvoices: 0, overdueInvoices: 0, customers: 0 });
            setRecentActivity([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    // Guard: redirect to business-tabs (onboarding) if setup not completed
    useEffect(() => {
        let mounted = true;
        async function checkOnboarding() {
            try {
                const completed = await AsyncStorage.getItem(ONBOARDING_KEY);
                if (!mounted) return;
                if (completed !== 'true') {
                    router.replace('/business-tabs');
                    return;
                }
                setOnboardingChecked(true);
            } catch {
                if (mounted) router.replace('/business-tabs');
            }
        }
        checkOnboarding();
        return () => { mounted = false };
    }, [router]);

    useEffect(() => {
        loadUserData();
    }, [loadUserData]);

    useEffect(() => {
        if (!onboardingChecked) return;
        loadDashboard();
    }, [loadDashboard, onboardingChecked]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadDashboard();
    }, [loadDashboard]);

    const displayName = userName || ownerName || 'There';

    // Wait for onboarding check before showing dashboard (avoids flash before redirect)
    if (!onboardingChecked) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#1e3a8a" />
                <Text style={{ marginTop: 12, fontSize: 14, color: '#64748b' }}>Loading...</Text>
            </View>
        );
    }

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
                        <View style={styles.headerTopRow}>
                            <View style={styles.profileSection}>
                                <View style={styles.avatarBorder}>
                                    <Image
                                        source={{ uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200' }}
                                        style={styles.avatar}
                                    />
                                </View>
                                <View style={styles.headerTextContainer}>
                                    <Text style={styles.helloText}>Hello, {displayName}</Text>
                                    <Text style={styles.subGreetingText}>{getGreeting()}</Text>
                                </View>
                            </View>
                            <TouchableOpacity style={styles.notificationButton} onPress={() => router.push('/(tabs)/transactions' as any)}>
                                <Ionicons name="notifications-outline" size={22} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        {/* White Curved Card for Business Name */}
                        <View style={styles.businessCard}>
                            <Text style={styles.businessNameText}>{businessName.toUpperCase()}</Text>
                            <View style={styles.orangeUnderline} />
                        </View>
                    </LinearGradient>
                </View>

                {/* Summary Section styled like the provided design (CoA-based values) */}
                <View style={styles.summarySection}>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryTitle}>Todays Summary</Text>
                        <Text style={styles.balanceLabel}>Your Balance</Text>
                        {loading ? (
                            <ActivityIndicator size="small" color="#1e3a8a" style={{ marginTop: 8 }} />
                        ) : (
                            <>
                                <Text style={styles.balanceValue}>
                                    {formatCurrency(summary?.netIncome ?? 0)}
                                </Text>

                                {/* Income / Expenses row */}
                                <View style={styles.summaryRow}>
                                    <View style={styles.summaryItem}>
                                        <View style={styles.summaryValueContainer}>
                                            <Ionicons name="arrow-up" size={16} color="#16a34a" />
                                            <Text style={[styles.currencyValue, { marginLeft: 4 }]}>{formatCurrency(summary?.revenue ?? 0)}</Text>
                                        </View>
                                        <Text style={styles.summaryLabel}>Income</Text>
                                    </View>
                                    <View style={styles.summaryItem}>
                                        <View style={styles.summaryValueContainer}>
                                            <Ionicons name="arrow-down" size={16} color="#ef4444" />
                                            <Text style={[styles.currencyValue, { marginLeft: 4 }]}>{formatCurrency(summary?.expenses ?? 0)}</Text>
                                        </View>
                                        <Text style={styles.summaryLabel}>Expenses</Text>
                                    </View>
                                </View>

                                {/* Extra balances from Chart of Accounts */}
                                <View style={[styles.summaryRow, { marginTop: 12 }]}>
                                    <View style={styles.secondarySummaryItem}>
                                        <Text style={styles.secondaryLabel}>Cash & Bank</Text>
                                        <Text style={styles.secondaryValue}>{formatCurrency(summary?.cashBankBalance ?? 0)}</Text>
                                    </View>
                                    <View style={styles.secondarySummaryItem}>
                                        <Text style={styles.secondaryLabel}>Receivables</Text>
                                        <Text
                                            style={[
                                                styles.secondaryValue,
                                                { color: (summary?.arBalance ?? 0) > 0 ? '#f59e0b' : '#64748b' },
                                            ]}
                                        >
                                            {formatCurrency(summary?.arBalance ?? 0)}
                                        </Text>
                                    </View>
                                </View>
                            </>
                        )}
                    </View>
                </View>

                {/* Counts: unpaid, overdue, customers */}
                {counts && (
                    <View style={styles.countsSection}>
                        <TouchableOpacity style={styles.countChip} onPress={() => router.push('/invoices' as any)}>
                            <Text style={styles.countValue}>{counts.unpaidInvoices}</Text>
                            <Text style={styles.countLabel}>Unpaid</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.countChip, counts.overdueInvoices > 0 && styles.countChipAlert]}>
                            <Text style={[styles.countValue, counts.overdueInvoices > 0 && { color: '#ef4444' }]}>{counts.overdueInvoices}</Text>
                            <Text style={styles.countLabel}>Overdue</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.countChip} onPress={() => router.push('/business-tabs/sales/customers' as any)}>
                            <Text style={styles.countValue}>{counts.customers}</Text>
                            <Text style={styles.countLabel}>Customers</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Action Carousel — Cash Sale, Credit Sale, Write Cheque all post to Chart of Accounts */}
                <View style={styles.actionsSection}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.actionsScrollContent}
                    >
                        <ActionCard
                            title="Cash Sale"
                            subtitle="Record walk-in payments"
                            icon="cash-outline"
                            colors={['#22c55e', '#16a34a']}
                            onPress={() => router.push('/business-tabs/sales/cash-sale')}
                        />
                        <ActionCard
                            title="Credit sale"
                            subtitle="Issue an invoice"
                            icon="card-outline"
                            colors={['#2563eb', '#1d4ed8']}
                            onPress={() => router.push('/create-invoice')}
                        />
                        <ActionCard
                            title="Write Cheque"
                            subtitle="Pay with a cheque"
                            icon="document-text-outline"
                            colors={['#f97316', '#ea580c']}
                            onPress={() => router.push('/write-cheque')}
                        />
                        <ActionCard
                            title="Add Item"
                            subtitle="Create a new product or service"
                            icon="add-circle-outline"
                            colors={['#4f46e5', '#6366f1']}
                            onPress={() => router.push('/new-inventory-item')}
                        />
                        <ActionCard
                            title="Write Bill"
                            subtitle="Record a supplier bill"
                            icon="receipt-outline"
                            colors={['#0ea5e9', '#0284c7']}
                            onPress={() => router.push('/bill-entry')}
                        />
                        <ActionCard
                            title="Write Journal"
                            subtitle="Post manual journal entries"
                            icon="book-outline"
                            colors={['#facc15', '#eab308']}
                            onPress={() => router.push('/business-tabs/more-business')}
                        />
                    </ScrollView>
                    {/* Static dots to mimic the design's pager indicator */}
                    <View style={styles.carouselDots}>
                        <View style={[styles.carouselDot, styles.carouselDotActive]} />
                        <View style={styles.carouselDot} />
                    </View>
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

                {/* Recent Activity (invoices, payments, transactions from CoA) */}
                <View style={styles.activitySection}>
                    <View style={styles.activityContainer}>
                        <Text style={styles.activityTitle}>Recent Activity</Text>
                        {recentActivity.length === 0 ? (
                            <Text style={styles.activityEmpty}>No recent activity</Text>
                        ) : (
                            recentActivity.map((item: any) => {
                                const amt = Number(item.amount ?? 0);
                                const isInflow = amt > 0;
                                return (
                                    <View key={item.id} style={styles.activityItem}>
                                        <Ionicons
                                            name={isInflow ? 'arrow-down-circle' : 'arrow-up-circle'}
                                            size={16}
                                            color={isInflow ? '#10b981' : '#ef4444'}
                                        />
                                        <Text style={styles.activityText} numberOfLines={1}>
                                            {formatActivityDate(item.date)} · {item.description || item.type || 'Activity'} · {formatCurrency(Math.abs(amt))}
                                        </Text>
                                    </View>
                                );
                            })
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

function ActionCard({
    title,
    subtitle,
    icon,
    colors,
    onPress,
}: {
    title: string;
    subtitle: string;
    icon: any;
    colors: [string, string];
    onPress: () => void;
}) {
    return (
        <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.actionCardWrapper}>
            <LinearGradient colors={colors} style={styles.actionCard}>
                <View style={styles.actionCardIconCircle}>
                    <Ionicons name={icon} size={26} color="#fff" />
                </View>
                <View style={styles.actionCardTextContainer}>
                    <Text style={styles.actionCardTitle}>{title}</Text>
                    <Text style={styles.actionCardSubtitle} numberOfLines={2}>
                        {subtitle}
                    </Text>
                </View>
            </LinearGradient>
        </TouchableOpacity>
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
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
        paddingHorizontal: 20,
    },
    headerTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
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
    headerTextContainer: {
        marginLeft: 12,
    },
    helloText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#ffffff',
    },
    subGreetingText: {
        marginTop: 4,
        fontSize: 13,
        color: '#e5e7eb',
    },
    notificationButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#ffffff55',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatar: {
        width: 74,
        height: 74,
        borderRadius: 37,
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
    summaryTitle: {
        textAlign: 'center',
        fontSize: 12,
        color: '#64748b',
        fontWeight: '600',
        marginBottom: 4,
    },
    balanceLabel: {
        textAlign: 'center',
        fontSize: 11,
        color: '#94a3b8',
    },
    countsSection: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: 20,
        marginTop: 12,
        marginBottom: 8,
    },
    countChip: {
        backgroundColor: '#f1f5f9',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 12,
        alignItems: 'center',
        minWidth: 80,
    },
    countChipAlert: {
        backgroundColor: '#fef2f2',
    },
    countValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1e3a8a',
    },
    countLabel: {
        fontSize: 11,
        color: '#64748b',
        marginTop: 2,
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
    balanceValue: {
        textAlign: 'center',
        fontSize: 24,
        fontWeight: '800',
        color: '#1e3a8a',
        marginTop: 6,
        marginBottom: 16,
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
    secondarySummaryItem: {
        flex: 1,
        paddingHorizontal: 8,
    },
    secondaryLabel: {
        fontSize: 10,
        color: '#94a3b8',
        marginBottom: 2,
    },
    secondaryValue: {
        fontSize: 12,
        fontWeight: '600',
        color: '#1e293b',
    },
    actionsSection: {
        marginTop: 24,
    },
    actionsScrollContent: {
        paddingHorizontal: 20,
        paddingRight: 30,
    },
    actionCardWrapper: {
        marginRight: 12,
    },
    actionCard: {
        width: width * 0.75,
        borderRadius: 18,
        paddingVertical: 14,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionCardIconCircle: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: '#ffffff22',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    actionCardTextContainer: {
        flex: 1,
    },
    actionCardTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#ffffff',
        marginBottom: 4,
    },
    actionCardSubtitle: {
        fontSize: 11,
        color: '#e5e7eb',
    },
    carouselDots: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 10,
    },
    carouselDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: '#cbd5f5',
        marginHorizontal: 3,
    },
    carouselDotActive: {
        width: 14,
        backgroundColor: '#1e3a8a',
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
