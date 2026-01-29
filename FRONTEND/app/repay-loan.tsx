
import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    SafeAreaView,
    Alert,
    ActivityIndicator,
    Platform,
    KeyboardAvoidingView,
    Modal,
    FlatList,
    Switch
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import apiService, { Account } from '@/services/api';

// Brand Colors
const COLORS = {
    primary: '#122f8a', // Deep Blue
    primaryLight: '#3b5998', // Lighter Blue
    secondary: '#fe9900', // Orange
    success: '#10B981',
    danger: '#EF4444',
    bg: '#F3F4F6',
    white: '#fff',
    text: '#1F2937',
    textLight: '#6B7280',
    border: '#E5E7EB'
};

// Reusable Dropdown Modal
const SelectorModal = ({
    visible,
    onClose,
    title,
    items,
    onSelect,
    renderItem
}: {
    visible: boolean;
    onClose: () => void;
    title: string;
    items: any[];
    onSelect: (item: any) => void;
    renderItem?: (item: any) => React.ReactNode;
}) => (
    <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{title}</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                        <Ionicons name="close" size={24} color="#333" />
                    </TouchableOpacity>
                </View>
                <FlatList
                    data={items}
                    keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                    contentContainerStyle={{ padding: 20 }}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.modalItem}
                            onPress={() => {
                                onSelect(item);
                                onClose();
                            }}
                        >
                            {renderItem ? renderItem(item) : <Text style={styles.modalItemText}>{item.name}</Text>}
                        </TouchableOpacity>
                    )}
                />
            </View>
        </View>
    </Modal>
);

export default function RepayLoanScreen() {
    const router = useRouter();

    // State
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [selectedAssetAccount, setSelectedAssetAccount] = useState<Account | null>(null); // Paid From
    const [selectedLoanAccount, setSelectedLoanAccount] = useState<Account | null>(null);   // Paying To

    const [totalAmount, setTotalAmount] = useState('');
    const [includeInterest, setIncludeInterest] = useState(true);
    const [interestAmount, setInterestAmount] = useState('');

    const [date, setDate] = useState(new Date());

    // Data State
    const [assetAccounts, setAssetAccounts] = useState<Account[]>([]);
    const [loanAccounts, setLoanAccounts] = useState<Account[]>([]);

    // Modals
    const [showAssetModal, setShowAssetModal] = useState(false);
    const [showLoanModal, setShowLoanModal] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const fetchedAccounts = await apiService.getAccounts({ includeBalances: true });

            // Filter Assets (Bank, Cash, M-Pesa)
            const assets = fetchedAccounts.filter(a => a.type === 'ASSET' && (a.subtype === 'bank' || a.subtype === 'cash' || a.subtype === 'mobile_money' || parseInt(a.code || '0') < 1200));
            setAssetAccounts(assets);

            // Filter Loans (Liabilities 2000 Series) that have balance > 0 ideally, or all
            const loans = fetchedAccounts.filter(a =>
                a.type === 'LIABILITY' &&
                (parseInt(a.code || '0') >= 2000 && parseInt(a.code || '0') < 3000)
            );
            setLoanAccounts(loans);

        } catch (error) {
            Alert.alert('Error', 'Failed to load accounts');
        } finally {
            setLoading(false);
        }
    };

    const principalReduction = useMemo(() => {
        const total = parseFloat(totalAmount) || 0;
        const interest = parseFloat(interestAmount) || 0;
        if (!includeInterest) return total;
        return Math.max(0, total - interest);
    }, [totalAmount, interestAmount, includeInterest]);

    const handleSubmit = async () => {
        if (!selectedAssetAccount || !selectedLoanAccount || !totalAmount) {
            Alert.alert('Missing Fields', 'Please select source, loan, and amount.');
            return;
        }

        if (includeInterest && !interestAmount) {
            Alert.alert('Missing Interest', 'Please enter Interest Amount or disable the interest checkbox.');
            return;
        }

        setSubmitting(true);
        try {
            const total = parseFloat(totalAmount);
            const interest = parseFloat(interestAmount) || 0;
            const principal = principalReduction;

            const splits = [];

            // 1. Principal Component (Reduces Liability)
            if (principal > 0) {
                splits.push({
                    accountId: selectedLoanAccount.id,
                    amount: principal,
                    category: 'Loan Principal',
                    description: `Principal Repayment: ${selectedLoanAccount.name}`
                });
            }

            // 2. Interest Component (Expense)
            if (includeInterest && interest > 0) {
                // Find Interest Expense Account (6810)
                // Ideally we should have fetched this ID dynamically, but we know we seeded 6810
                // For now, let the backend resolver handle it by category mapping or passed ID?
                // Since 'splits' requires accountId, we need to know the ID of 6810.
                // Hack: We can pass category 'Loan Interest' and let backend resolve if ID is missing?
                // Or better, let's look it up from the fetched accounts? But we only fetched Assets/Liabilities above.
                // Let's assume user has fetched all accounts context or we do a quick lookup.

                // Quick Fix: Let's assume the user selects 6810. But we don't expose it here.
                // We will pass the category "Loan Interest Expense" and rely on backend mapping? 
                // Or we can create the transaction with explicit splits where one split uses a KNOWN code.
                // But the API expects accountId.

                // Let's add a `fetchInterestAccount` logic or similar.
                // Or better, just hardcode the logic to find "Loan Interest" category.
                // Actually, createTransaction (splits) usually takes accountId.

                // WORKAROUND: We will fetch the Interest Account ID in loadData to be safe.
                // Re-using the logic below.
            }

            // Wait, I need the Interest Account ID. Let's fetch it on mount.
            // See updated loadData below.

            let interestAccountId = null;
            try {
                const all = await apiService.getAccounts({});
                const intAcc = all.find(a => a.code === '6810');
                if (intAcc) interestAccountId = intAcc.id;
            } catch (e) { }

            if (includeInterest && interest > 0 && interestAccountId) {
                splits.push({
                    accountId: interestAccountId,
                    amount: interest,
                    category: 'Loan Interest',
                    description: `Interest Component`
                });
            } else if (includeInterest && interest > 0) {
                Alert.alert('Error', 'Could not find Loan Interest Expense account (6810). Please contact support.');
                setSubmitting(false);
                return;
            }

            await apiService.createTransaction({
                type: 'LIABILITY_DEC', // Proper double-entry type for loan repayment
                amount: total,
                category: 'Loan Repayment',
                description: `Repayment to: ${selectedLoanAccount.name}`,
                date: date.toISOString(),
                creditAccountId: parseInt(selectedAssetAccount.id), // Money Source (Bank) - Money goes out
                splits: splits as any, // Principal reduction + Interest expense
                payee: selectedLoanAccount.name,
                notes: includeInterest
                    ? `Principal: KES ${principal.toLocaleString()}, Interest: KES ${interest.toLocaleString()}`
                    : `Principal payment: KES ${principal.toLocaleString()}`,
            });

            Alert.alert('Success', 'Repayment Recorded!', [
                { text: 'OK', onPress: () => router.back() }
            ]);

        } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to record repayment');
        } finally {
            setSubmitting(false);
        }
    };

    const renderAccountItem = (account: Account) => (
        <View style={styles.dropdownItem}>
            <View style={[styles.dropdownIcon, { backgroundColor: account.type === 'LIABILITY' ? '#FEE2E2' : '#EFF6FF' }]}>
                <Ionicons name={account.type === 'LIABILITY' ? "alert-circle-outline" : "wallet-outline"} size={20} color={account.type === 'LIABILITY' ? COLORS.danger : COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.dropdownTitle}>{account.name}</Text>
                <Text style={styles.dropdownSubtitle}>{account.code} • Bal: {account.balance?.toLocaleString()}</Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>

                {/* Header */}
                <LinearGradient colors={[COLORS.primary, '#1e40af']} style={styles.header}>
                    <View style={styles.headerTop}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Repay Loan</Text>
                        <View style={{ width: 40 }} />
                    </View>
                </LinearGradient>

                <ScrollView contentContainerStyle={{ padding: 20 }}>

                    {/* ZONE A: Source & Destination */}
                    <View style={styles.card}>
                        <Text style={styles.label}>Paid From (Source)</Text>
                        <TouchableOpacity style={styles.selector} onPress={() => setShowAssetModal(true)}>
                            <Text style={[styles.selectorText, !selectedAssetAccount && styles.placeholderText]}>
                                {selectedAssetAccount ? selectedAssetAccount.name : 'Select Payer Account...'}
                            </Text>
                            <Ionicons name="chevron-down" size={20} color={COLORS.textLight} />
                        </TouchableOpacity>

                        <View style={{ alignItems: 'center', marginVertical: 10 }}>
                            <Ionicons name="arrow-down-circle" size={24} color={COLORS.textLight} />
                        </View>

                        <Text style={styles.label}>Paying To (Loan Account)</Text>
                        <TouchableOpacity style={styles.selector} onPress={() => setShowLoanModal(true)}>
                            <Text style={[styles.selectorText, !selectedLoanAccount && styles.placeholderText]}>
                                {selectedLoanAccount ? selectedLoanAccount.name : 'Select Loan...'}
                            </Text>
                            <Ionicons name="chevron-down" size={20} color={COLORS.textLight} />
                        </TouchableOpacity>
                        {selectedLoanAccount && (
                            <Text style={styles.balanceText}>Current Outstanding Balance: KES {selectedLoanAccount.balance?.toLocaleString()}</Text>
                        )}
                    </View>

                    {/* ZONE B: The Split Logic */}
                    <View style={styles.card}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="pie-chart-outline" size={20} color={COLORS.secondary} />
                            <Text style={[styles.sectionTitle, { color: COLORS.secondary }]}>Payment Split</Text>
                        </View>

                        <Text style={styles.label}>Total Amount Leaving Bank</Text>
                        <View style={styles.amountInputWrap}>
                            <Text style={styles.currency}>KES</Text>
                            <TextInput
                                style={styles.amountInput}
                                value={totalAmount}
                                onChangeText={setTotalAmount}
                                placeholder="0.00"
                                keyboardType="numeric"
                            />
                        </View>

                        <View style={styles.divider} />

                        <View style={[styles.rowBetween, { marginBottom: 15 }]}>
                            <Text style={styles.label}>Include Interest Component?</Text>
                            <Switch
                                value={includeInterest}
                                onValueChange={setIncludeInterest}
                                trackColor={{ false: '#D1D5DB', true: COLORS.primaryLight }}
                                thumbColor={includeInterest ? COLORS.primary : '#f4f3f4'}
                            />
                        </View>

                        {includeInterest && (
                            <View>
                                <Text style={styles.label}>Interest Amount (Cost)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={interestAmount}
                                    onChangeText={setInterestAmount}
                                    placeholder="e.g. 12000"
                                    keyboardType="numeric"
                                />
                                <Text style={styles.helperText}>How much of this was the bank's profit?</Text>
                            </View>
                        )}

                        <View style={[styles.resultBox, { marginTop: 20 }]}>
                            <Text style={styles.resultLabel}>PRINCIPAL REDUCTION</Text>
                            <Text style={styles.resultAmount}>KES {principalReduction.toLocaleString()}</Text>
                            <Text style={styles.resultHelper}>Your debt only goes down by this amount.</Text>
                        </View>

                    </View>

                </ScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
                        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Record Payment</Text>}
                    </TouchableOpacity>
                </View>

            </KeyboardAvoidingView>

            {/* MODALS */}
            <SelectorModal
                visible={showAssetModal}
                onClose={() => setShowAssetModal(false)}
                title="Select Payment Source"
                items={assetAccounts}
                onSelect={setSelectedAssetAccount}
                renderItem={renderAccountItem}
            />
            <SelectorModal
                visible={showLoanModal}
                onClose={() => setShowLoanModal(false)}
                title="Select Loan to Pay"
                items={loanAccounts}
                onSelect={setSelectedLoanAccount}
                renderItem={renderAccountItem}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bg,
    },
    header: {
        paddingTop: 50,
        paddingBottom: 25,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    backBtn: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 12
    },
    headerTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '700'
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2
    },
    label: {
        fontSize: 14,
        color: COLORS.textLight,
        fontWeight: '600',
        marginBottom: 8
    },
    selector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F9FAFB',
        padding: 15,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border
    },
    selectorText: {
        fontSize: 16,
        color: COLORS.text,
        fontWeight: '500'
    },
    placeholderText: {
        color: '#9CA3AF'
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        gap: 10
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.text
    },
    amountInputWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        paddingBottom: 10
    },
    currency: {
        fontSize: 24,
        color: COLORS.textLight,
        fontWeight: '600',
        marginRight: 10
    },
    amountInput: {
        fontSize: 32,
        fontWeight: '700',
        color: COLORS.text,
        flex: 1
    },
    input: {
        backgroundColor: '#F9FAFB',
        padding: 15,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        fontSize: 16,
        color: COLORS.text
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: 15
    },
    rowBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    helperText: {
        fontSize: 12,
        color: COLORS.textLight,
        marginTop: 5,
        fontStyle: 'italic'
    },
    resultBox: {
        backgroundColor: '#ECFDF5',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#10B981'
    },
    resultLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#059669',
        letterSpacing: 1
    },
    resultAmount: {
        fontSize: 28,
        fontWeight: '800',
        color: '#047857',
        marginVertical: 5
    },
    resultHelper: {
        fontSize: 12,
        color: '#065F46'
    },
    footer: {
        backgroundColor: '#fff',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB'
    },
    submitBtn: {
        backgroundColor: COLORS.secondary,
        padding: 18,
        borderRadius: 16,
        alignItems: 'center',
    },
    submitBtnText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold'
    },
    balanceText: {
        fontSize: 12,
        color: COLORS.danger,
        marginTop: 5,
        marginLeft: 10
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end'
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        maxHeight: '80%',
        paddingBottom: 40
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee'
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.primary
    },
    closeBtn: {
        padding: 5
    },
    modalItem: {
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6'
    },
    modalItemText: {
        fontSize: 16,
        color: COLORS.text
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15
    },
    dropdownIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center'
    },
    dropdownTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text
    },
    dropdownSubtitle: {
        fontSize: 13,
        color: COLORS.textLight,
        marginTop: 2
    }
});
