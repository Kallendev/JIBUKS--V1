
import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
    RefreshControl, Modal, TextInput, ActivityIndicator, Alert, Platform
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import apiService from '@/services/api';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';

const COLORS = {
    primary: '#6366f1', // Indigo
    secondary: '#8b5cf6', // Violet
    success: '#10b981', // Emerald
    danger: '#ef4444', // Red
    warning: '#f59e0b', // Amber
    dark: '#1e293b', // Slate 800
    light: '#f8fafc', // Slate 50
    white: '#ffffff',
    gray: '#94a3b8',
    cardBg: '#ffffff',
    bg: '#f1f5f9',
};

export default function LendingDashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loans, setLoans] = useState<any[]>([]);
    const [summary, setSummary] = useState<any>({ totalOwed: 0, totalBorrowed: 0, activeCount: 0, overdueAmount: 0 });
    const [recentActivity, setRecentActivity] = useState<any[]>([]);

    // Modal States
    const [showNewLoanModal, setShowNewLoanModal] = useState(false);
    const [showRepayModal, setShowRepayModal] = useState(false);
    const [selectedLoan, setSelectedLoan] = useState<any>(null);
    const [submitting, setSubmitting] = useState(false);

    // Form Data
    const [formData, setFormData] = useState({
        borrowerName: '',
        amount: '',
        dueDate: new Date(),
        showDatePicker: false,
        accountId: '', // Paid From / Deposited To
        notes: '',
        phoneNumber: ''
    });

    const [accounts, setAccounts] = useState<any[]>([]);

    const loadDashboard = useCallback(async () => {
        try {
            setLoading(true);
            const [data, accs] = await Promise.all([
                apiService.getLendingDashboard(),
                apiService.getAccounts({ type: 'ASSET' }) // Fetch liquid assets
            ]);

            setLoans(data.loans || []);
            setSummary(data.summary || { totalOwed: 0, totalBorrowed: 0, activeCount: 0, overdueAmount: 0 });
            setRecentActivity(data.recentActivity || []);

            // Filter liquid accounts for dropdown
            const liquidAccs = accs.filter((a: any) =>
                ['cash', 'mobile_money', 'bank', 'online_wallet'].includes(a.subtype || '') ||
                ['1001', '1010', '1020'].includes(a.code) // Fallback for seeds
            );
            setAccounts(liquidAccs);

        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to load lending data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadDashboard();
    }, [loadDashboard]);

    const onRefresh = () => {
        setRefreshing(true);
        loadDashboard();
    };

    const handleIssueLoan = async () => {
        if (!formData.borrowerName || !formData.amount || !formData.accountId) {
            Alert.alert('Missing Fields', 'Please fill in Name, Amount, and Account.');
            return;
        }

        try {
            setSubmitting(true);
            await apiService.issueLoan({
                borrowerName: formData.borrowerName,
                amount: parseFloat(formData.amount),
                dueDate: formData.dueDate,
                paidFromAccountId: parseInt(formData.accountId),
                notes: formData.notes,
                phoneNumber: formData.phoneNumber
            });

            Alert.alert('Success', 'Loan issued successfully');
            setShowNewLoanModal(false);
            resetForm();
            loadDashboard();
        } catch (error: any) {
            Alert.alert('Error', error.error || 'Failed to issue loan');
        } finally {
            setSubmitting(false);
        }
    };

    const handleRepayLoan = async () => {
        if (!selectedLoan || !formData.amount || !formData.accountId) {
            Alert.alert('Missing Fields', 'Please fill in Amount and Deposit Account.');
            return;
        }

        try {
            setSubmitting(true);
            await apiService.recordLoanRepayment({
                loanId: selectedLoan.id,
                amount: parseFloat(formData.amount),
                depositedToAccountId: parseInt(formData.accountId),
                date: new Date()
            });

            Alert.alert('Success', 'Repayment recorded');
            setShowRepayModal(false);
            resetForm();
            loadDashboard();
        } catch (error: any) {
            Alert.alert('Error', error.error || 'Failed to record repayment');
        } finally {
            setSubmitting(false);
        }
    };

    const handleWriteOff = async (loanId: string) => {
        Alert.alert(
            "Confirm Write-Off",
            "Are you sure you want to write off this loan as Bad Debt? This cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Write Off",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setLoading(true);
                            await apiService.writeOffLoan(loanId);
                            loadDashboard();
                        } catch (error: any) {
                            Alert.alert('Error', error.error || 'Failed to write off loan');
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const resetForm = () => {
        setFormData({
            borrowerName: '',
            amount: '',
            dueDate: new Date(),
            showDatePicker: false,
            accountId: '',
            notes: '',
            phoneNumber: ''
        });
        setSelectedLoan(null);
    };

    const openRepayModal = (loan: any) => {
        setSelectedLoan(loan);
        setFormData({ ...formData, amount: loan.balance?.toString() || '' });
        setShowRepayModal(true);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(amount);
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <LinearGradient
                colors={[COLORS.primary, COLORS.secondary]}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Debt Tracker</Text>
                    <TouchableOpacity onPress={onRefresh} style={styles.headerAction}>
                        <Ionicons name="refresh" size={24} color="white" />
                    </TouchableOpacity>
                </View>

                <View style={styles.summaryGrid}>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>Total Owed To You</Text>
                        <Text style={styles.summaryValue}>{formatCurrency(summary.totalOwed)}</Text>
                        <View style={styles.summaryBadge}>
                            <FontAwesome5 name="arrow-up" size={10} color={COLORS.success} />
                            <Text style={styles.summaryBadgeText}>{summary.activeCount} Active Loans</Text>
                        </View>
                    </View>
                    <View style={[styles.summaryCard, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                        <Text style={[styles.summaryLabel, { color: '#fecaacaa' }]}>Overdue</Text>
                        <Text style={[styles.summaryValue, { color: '#fecaca' }]}>{formatCurrency(summary.overdueAmount)}</Text>
                    </View>
                </View>
            </LinearGradient>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
            >
                {/* Main Action */}
                <TouchableOpacity style={styles.mainActionButton} onPress={() => setShowNewLoanModal(true)}>
                    <LinearGradient
                        colors={[COLORS.primary, COLORS.secondary]}
                        style={styles.actionGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <Ionicons name="add-circle" size={24} color="white" />
                        <Text style={styles.actionButtonText}>Issue New Loan</Text>
                    </LinearGradient>
                </TouchableOpacity>

                {/* Active Loans List */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Active Loans</Text>
                </View>

                {loans.filter(l => l.status === 'ACTIVE').length === 0 ? (
                    <View style={styles.emptyState}>
                        <MaterialCommunityIcons name="cash-check" size={50} color={COLORS.gray} />
                        <Text style={styles.emptyStateText}>No active loans found</Text>
                    </View>
                ) : (
                    loans.filter(l => l.status === 'ACTIVE').map((loan, index) => (
                        <View key={loan.id} style={styles.loanCard}>
                            <View style={styles.loanHeader}>
                                <View style={styles.borrowerInfo}>
                                    <View style={styles.avatar}>
                                        <Text style={styles.avatarText}>{loan.borrowerName.charAt(0)}</Text>
                                    </View>
                                    <View>
                                        <Text style={styles.borrowerName}>{loan.borrowerName}</Text>
                                        <Text style={styles.loanDate}>{new Date(loan.issueDate).toLocaleDateString()}</Text>
                                    </View>
                                </View>
                                <View style={styles.loanAmount}>
                                    <Text style={styles.balanceText}>{formatCurrency(Number(loan.balance))}</Text>
                                    <Text style={styles.totalText}>of {formatCurrency(Number(loan.principalAmount))}</Text>
                                </View>
                            </View>

                            <View style={styles.loanFooter}>
                                <View style={styles.statusBadge}>
                                    <View style={[styles.statusDot, { backgroundColor: new Date(loan.dueDate) < new Date() ? COLORS.danger : COLORS.success }]} />
                                    <Text style={[styles.statusText, { color: new Date(loan.dueDate) < new Date() ? COLORS.danger : COLORS.success }]}>
                                        {new Date(loan.dueDate) < new Date() ? 'Overdue' : 'Active'}
                                    </Text>
                                </View>

                                <View style={styles.cardActions}>
                                    <TouchableOpacity onPress={() => handleWriteOff(loan.id)} style={styles.iconBtn}>
                                        <Ionicons name="trash-outline" size={20} color={COLORS.gray} />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => openRepayModal(loan)} style={styles.repayBtn}>
                                        <Text style={styles.repayBtnText}>Record Repayment</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    ))
                )}

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recent History</Text>
                </View>

                {recentActivity.map((activity: any, index: number) => (
                    <View key={index} style={styles.activityRow}>
                        <View style={styles.activityIcon}>
                            <Ionicons
                                name={activity.type === 'REPAYMENT' ? 'arrow-down' : 'arrow-up'}
                                size={16}
                                color={activity.type === 'REPAYMENT' ? COLORS.success : COLORS.warning}
                            />
                        </View>
                        <View style={styles.activityInfo}>
                            <Text style={styles.activityTitle}>
                                {activity.type === 'REPAYMENT' ? 'Repayment Received' : 'Loan Issued'}
                            </Text>
                            <Text style={styles.activitySub}>
                                {activity.loan?.borrowerName} • {new Date(activity.date).toLocaleDateString()}
                            </Text>
                        </View>
                        <Text style={[
                            styles.activityAmount,
                            { color: activity.type === 'REPAYMENT' ? COLORS.success : COLORS.dark }
                        ]}>
                            {activity.type === 'REPAYMENT' ? '+' : '-'}{formatCurrency(Number(activity.amount))}
                        </Text>
                    </View>
                ))}

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* NEW LOAN MODAL */}
            <Modal visible={showNewLoanModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Issue New Loan</Text>
                            <TouchableOpacity onPress={() => setShowNewLoanModal(false)}>
                                <Ionicons name="close" size={24} color={COLORS.gray} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView>
                            <Text style={styles.label}>Borrower Name</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g., John Doe"
                                value={formData.borrowerName}
                                onChangeText={(t) => setFormData({ ...formData, borrowerName: t })}
                            />

                            <Text style={styles.label}>Amount (KES)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="0.00"
                                keyboardType="numeric"
                                value={formData.amount}
                                onChangeText={(t) => setFormData({ ...formData, amount: t })}
                            />

                            <Text style={styles.label}>Paid From (Asset Account)</Text>
                            <View style={styles.pickerContainer}>
                                <Picker
                                    selectedValue={formData.accountId}
                                    onValueChange={(itemValue) => setFormData({ ...formData, accountId: itemValue })}
                                    style={styles.picker}
                                >
                                    <Picker.Item label="Select Account..." value="" color={COLORS.gray} />
                                    {accounts.map((acc) => (
                                        <Picker.Item
                                            key={acc.id}
                                            label={`${acc.name} (${formatCurrency(acc.balance || 0)})`}
                                            value={acc.id.toString()}
                                        />
                                    ))}
                                </Picker>
                            </View>

                            <Text style={styles.label}>Due Date</Text>
                            <TouchableOpacity style={styles.dateBtn} onPress={() => setFormData({ ...formData, showDatePicker: true })}>
                                <Text style={styles.dateBtnText}>{formData.dueDate.toLocaleDateString()}</Text>
                                <Ionicons name="calendar" size={20} color={COLORS.primary} />
                            </TouchableOpacity>
                            {formData.showDatePicker && (
                                <DateTimePicker
                                    value={formData.dueDate}
                                    mode="date"
                                    onChange={(e, date) => {
                                        setFormData({
                                            ...formData,
                                            showDatePicker: false,
                                            dueDate: date || formData.dueDate
                                        })
                                    }}
                                />
                            )}

                            <Text style={styles.label}>Notes (Optional)</Text>
                            <TextInput
                                style={[styles.input, { height: 80 }]}
                                placeholder="Any additional details..."
                                multiline
                                value={formData.notes}
                                onChangeText={(t) => setFormData({ ...formData, notes: t })}
                            />

                            <TouchableOpacity
                                style={[styles.fullWidthBtn, submitting && { opacity: 0.7 }]}
                                onPress={handleIssueLoan}
                                disabled={submitting}
                            >
                                {submitting ? <ActivityIndicator color="white" /> : <Text style={styles.fullWidthBtnText}>Confirm Issue Loan</Text>}
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* REPAY MODAL */}
            <Modal visible={showRepayModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Record Repayment</Text>
                            <TouchableOpacity onPress={() => setShowRepayModal(false)}>
                                <Ionicons name="close" size={24} color={COLORS.gray} />
                            </TouchableOpacity>
                        </View>

                        {selectedLoan && (
                            <View style={styles.loanSummaryBox}>
                                <Text style={styles.loanSummaryLabel}>Repaying Loan from:</Text>
                                <Text style={styles.loanSummaryValue}>{selectedLoan.borrowerName}</Text>
                                <Text style={styles.loanSummaryDebt}>Current Balance: {formatCurrency(Number(selectedLoan.balance))}</Text>
                            </View>
                        )}

                        <ScrollView>
                            <Text style={styles.label}>Amount Received (KES)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="0.00"
                                keyboardType="numeric"
                                value={formData.amount}
                                onChangeText={(t) => setFormData({ ...formData, amount: t })}
                            />

                            <Text style={styles.label}>Deposited To (Asset Account)</Text>
                            <View style={styles.pickerContainer}>
                                <Picker
                                    selectedValue={formData.accountId}
                                    onValueChange={(itemValue) => setFormData({ ...formData, accountId: itemValue })}
                                    style={styles.picker}
                                >
                                    <Picker.Item label="Select Account..." value="" color={COLORS.gray} />
                                    {accounts.map((acc) => (
                                        <Picker.Item
                                            key={acc.id}
                                            label={`${acc.name} (${formatCurrency(acc.balance || 0)})`}
                                            value={acc.id.toString()}
                                        />
                                    ))}
                                </Picker>
                            </View>

                            <TouchableOpacity
                                style={[styles.fullWidthBtn, submitting && { opacity: 0.7 }]}
                                onPress={handleRepayLoan}
                                disabled={submitting}
                            >
                                {submitting ? <ActivityIndicator color="white" /> : <Text style={styles.fullWidthBtnText}>Confirm Repayment</Text>}
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    header: {
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 24,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
    backButton: { padding: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12 },
    headerTitle: { color: 'white', fontSize: 20, fontWeight: '700' },
    headerAction: { padding: 8 },
    summaryGrid: { flexDirection: 'row', gap: 12 },
    summaryCard: {
        flex: 1, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: 16,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)'
    },
    summaryLabel: { color: '#e2e8f0', fontSize: 13, marginBottom: 4 },
    summaryValue: { color: 'white', fontSize: 22, fontWeight: '700' },
    summaryBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.9)', alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, marginTop: 8 },
    summaryBadgeText: { color: COLORS.dark, fontSize: 11, fontWeight: '600', marginLeft: 4 },

    content: { padding: 20 },
    mainActionButton: { marginBottom: 24, shadowColor: COLORS.primary, shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 5 },
    actionGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 16, gap: 8 },
    actionButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },

    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 8 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.dark },

    emptyState: { alignItems: 'center', padding: 40 },
    emptyStateText: { marginTop: 12, color: COLORS.gray },

    loanCard: { backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    loanHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
    borrowerInfo: { flexDirection: 'row', gap: 12 },
    avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontSize: 18, fontWeight: '700', color: COLORS.primary },
    borrowerName: { fontSize: 16, fontWeight: '600', color: COLORS.dark },
    loanDate: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
    loanAmount: { alignItems: 'flex-end' },
    balanceText: { fontSize: 16, fontWeight: '700', color: COLORS.success },
    totalText: { fontSize: 12, color: COLORS.gray },
    loanFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 12 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f8fafc', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusText: { fontSize: 12, fontWeight: '600' },
    cardActions: { flexDirection: 'row', gap: 8 },
    iconBtn: { padding: 8, backgroundColor: '#f1f5f9', borderRadius: 10 },
    repayBtn: { backgroundColor: '#f0fdf4', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#dcfce7' },
    repayBtnText: { color: COLORS.success, fontWeight: '600', fontSize: 12 },

    activityRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 12, borderRadius: 12, marginBottom: 8 },
    activityIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    activityInfo: { flex: 1 },
    activityTitle: { fontSize: 14, fontWeight: '500', color: COLORS.dark },
    activitySub: { fontSize: 12, color: COLORS.gray, marginTop: 1 },
    activityAmount: { fontSize: 14, fontWeight: '600' },

    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, height: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    modalTitle: { fontSize: 20, fontWeight: '700', color: COLORS.dark },
    label: { fontSize: 14, fontWeight: '600', color: COLORS.dark, marginBottom: 8, marginTop: 16 },
    input: { backgroundColor: '#f8fafc', padding: 16, borderRadius: 12, fontSize: 16, color: COLORS.dark, borderWidth: 1, borderColor: '#e2e8f0' },
    pickerContainer: {
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        overflow: 'hidden', // Ensures picker doesn't bleed out
    },
    picker: {
        height: 55,
        width: '100%',
    },
    dateBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
    dateBtnText: { fontSize: 16, color: COLORS.dark },
    fullWidthBtn: { backgroundColor: COLORS.primary, padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 32, shadowColor: COLORS.primary, shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
    fullWidthBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },

    loanSummaryBox: { backgroundColor: '#f8fafc', padding: 16, borderRadius: 12, marginBottom: 16, alignItems: 'center' },
    loanSummaryLabel: { color: COLORS.gray, fontSize: 12 },
    loanSummaryValue: { color: COLORS.dark, fontSize: 18, fontWeight: '700', marginVertical: 4 },
    loanSummaryDebt: { color: COLORS.danger, fontWeight: '600' }
});
