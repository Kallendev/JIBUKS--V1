
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
    FlatList
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import apiService, { Account } from '@/services/api';

// Brand Colors
const COLORS = {
    primary: '#122f8a', // Deep Blue
    primaryLight: '#3b5998',
    secondary: '#fe9900', // Orange
    white: '#ffffff',
    bg: '#F3F4F6',
    text: '#1F2937',
    textLight: '#6B7280',
    border: '#E5E7EB',
    danger: '#EF4444',
    success: '#10B981'
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

export default function AddLoanScreen() {
    const router = useRouter();


    // State
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [loanName, setLoanName] = useState('');
    const [lender, setLender] = useState(''); // Could be a vendor or just text
    const [selectedLiabilityAccount, setSelectedLiabilityAccount] = useState<Account | null>(null);

    const [principalAmount, setPrincipalAmount] = useState('');
    const [selectedDepositAccount, setSelectedDepositAccount] = useState<Account | null>(null);

    const [interestRate, setInterestRate] = useState('');
    const [durationMonths, setDurationMonths] = useState('');
    const [startDate, setStartDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [monthlyInstallment, setMonthlyInstallment] = useState('');

    // Data State
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [liabilityAccounts, setLiabilityAccounts] = useState<Account[]>([]);
    const [assetAccounts, setAssetAccounts] = useState<Account[]>([]);

    // Modals
    const [showLiabilityModal, setShowLiabilityModal] = useState(false);
    const [showDepositModal, setShowDepositModal] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const fetchedAccounts = await apiService.getAccounts({ includeBalances: true });
            setAccounts(fetchedAccounts);

            // Filter Liabilities (2000 Series)
            const liabilities = fetchedAccounts.filter(a =>
                a.type === 'LIABILITY' &&
                (parseInt(a.code || '0') >= 2000 && parseInt(a.code || '0') < 3000)
            ).sort((a, b) => (a.code || '').localeCompare(b.code || ''));
            setLiabilityAccounts(liabilities);

            // Filter Assets (Bank, Cash, M-Pesa)
            const assets = fetchedAccounts.filter(a => a.type === 'ASSET' && (a.subtype === 'bank' || a.subtype === 'cash' || a.subtype === 'mobile_money' || parseInt(a.code || '0') < 1200));
            setAssetAccounts(assets);

        } catch (error) {
            Alert.alert('Error', 'Failed to load accounts');
        } finally {
            setLoading(false);
        }
    };

    const calculateInstallment = () => {
        const P = parseFloat(principalAmount);
        const r = parseFloat(interestRate) / 100 / 12; // Monthly rate
        const n = parseFloat(durationMonths);

        if (P && r && n) {
            // EMI = [P x r x (1+r)^n]/[(1+r)^n-1]
            const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
            setMonthlyInstallment(emi.toFixed(2));
        } else if (P && n && (!r || r === 0)) {
            // Simple division if 0 interest
            setMonthlyInstallment((P / n).toFixed(2));
        }
    };

    const handleSubmit = async () => {
        if (!loanName || !selectedLiabilityAccount || !principalAmount || !selectedDepositAccount) {
            Alert.alert('Missing Fields', 'Please fill in all required fields.');
            return;
        }

        setSubmitting(true);
        try {
            const principal = parseFloat(principalAmount);

            // 1. Create Transaction for Disbursement
            // Debit: Asset Account (Money In)
            // Credit: Liability Account (Debt Up)

            await apiService.createTransaction({
                type: 'LIABILITY_INC', // Proper double-entry type for loan disbursement
                amount: principal,
                category: 'Loan Disbursement',
                description: `Loan Disbursement: ${loanName}`,
                date: startDate.toISOString(),

                // Explicit account specification for double-entry
                debitAccountId: parseInt(selectedDepositAccount.id),   // Cash In (Asset increases)
                creditAccountId: parseInt(selectedLiabilityAccount.id), // Debt Up (Liability increases)

                paymentMethod: 'Bank Transfer',
                payee: lender || selectedLiabilityAccount.name,
                notes: `Loan Terms: ${durationMonths} months @ ${interestRate}% interest. Monthly installment: KES ${monthlyInstallment}`,
            });

            Alert.alert('Success', 'Loan Recorded Successfully!', [
                { text: 'OK', onPress: () => router.back() }
            ]);

        } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to record loan');
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
                <Text style={styles.dropdownSubtitle}>{account.code}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
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
                        <Text style={styles.headerTitle}>Add New Loan</Text>
                        <View style={{ width: 40 }} />
                    </View>
                </LinearGradient>

                <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>

                    {/* ZONE A: Facility Details */}
                    <View style={styles.card}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="document-text-outline" size={20} color={COLORS.primary} />
                            <Text style={styles.sectionTitle}>Facility Details</Text>
                        </View>

                        <Text style={styles.label}>Loan Name / Reference</Text>
                        <TextInput
                            style={styles.input}
                            value={loanName}
                            onChangeText={setLoanName}
                            placeholder="e.g. KCB Car Loan - KCA 123B"
                        />

                        <Text style={[styles.label, { marginTop: 15 }]}>Lender / Provider</Text>
                        <TextInput
                            style={styles.input}
                            value={lender}
                            onChangeText={setLender}
                            placeholder="e.g. KCB Bank, Stima Sacco"
                        />

                        <Text style={[styles.label, { marginTop: 15 }]}>Loan Category (Liability Account)</Text>
                        <TouchableOpacity style={styles.selector} onPress={() => setShowLiabilityModal(true)}>
                            <Text style={[styles.selectorText, !selectedLiabilityAccount && styles.placeholderText]}>
                                {selectedLiabilityAccount ? selectedLiabilityAccount.name : 'Select Liability Category...'}
                            </Text>
                            <Ionicons name="chevron-down" size={20} color={COLORS.textLight} />
                        </TouchableOpacity>

                        {/* Smart Logic for Asset Link could go here */}
                    </View>

                    {/* ZONE B: Disbursement */}
                    <View style={styles.card}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="cash-outline" size={20} color={COLORS.success} />
                            <Text style={[styles.sectionTitle, { color: COLORS.success }]}>Disbursement (Cash In)</Text>
                        </View>

                        <Text style={styles.label}>Principal Amount</Text>
                        <View style={styles.amountInputWrap}>
                            <Text style={styles.currency}>KES</Text>
                            <TextInput
                                style={styles.amountInput}
                                value={principalAmount}
                                onChangeText={setPrincipalAmount}
                                placeholder="0.00"
                                keyboardType="numeric"
                            />
                        </View>

                        <Text style={[styles.label, { marginTop: 15 }]}>Deposited Into (Asset Account)</Text>
                        <TouchableOpacity style={styles.selector} onPress={() => setShowDepositModal(true)}>
                            <Text style={[styles.selectorText, !selectedDepositAccount && styles.placeholderText]}>
                                {selectedDepositAccount ? selectedDepositAccount.name : 'Select Bank/Wallet...'}
                            </Text>
                            <Ionicons name="chevron-down" size={20} color={COLORS.textLight} />
                        </TouchableOpacity>
                    </View>

                    {/* ZONE C: Terms */}
                    <View style={styles.card}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="calculator-outline" size={20} color={COLORS.secondary} />
                            <Text style={[styles.sectionTitle, { color: COLORS.secondary }]}>Loan Terms</Text>
                        </View>

                        <View style={{ flexDirection: 'row', gap: 15 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.label}>Interest Rate (%)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={interestRate}
                                    onChangeText={setInterestRate}
                                    placeholder="e.g. 13"
                                    keyboardType="numeric"
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.label}>Duration (Months)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={durationMonths}
                                    onChangeText={setDurationMonths}
                                    placeholder="e.g. 48"
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>

                        <Text style={[styles.label, { marginTop: 15 }]}>Repayment Start Date</Text>
                        <TouchableOpacity style={styles.dateSelector} onPress={() => setShowDatePicker(true)}>
                            <Ionicons name="calendar" size={20} color={COLORS.textLight} />
                            <Text style={styles.selectorText}>{startDate.toLocaleDateString()}</Text>
                        </TouchableOpacity>
                        {showDatePicker && (
                            <DateTimePicker
                                value={startDate}
                                mode="date"
                                display="default"
                                onChange={(event, selectedDate) => {
                                    setShowDatePicker(false);
                                    if (selectedDate) setStartDate(selectedDate);
                                }}
                            />
                        )}

                        <View style={styles.divider} />

                        <Text style={styles.label}>Monthly Installment</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <TextInput
                                style={[styles.input, { flex: 1, backgroundColor: '#EFF6FF', borderColor: COLORS.primaryLight, color: COLORS.primary, fontWeight: '700' }]}
                                value={monthlyInstallment}
                                onChangeText={setMonthlyInstallment}
                                placeholder="Calculated Amount"
                                keyboardType="numeric"
                            />
                            <TouchableOpacity style={styles.calcBtn} onPress={calculateInstallment}>
                                <Ionicons name="calculator" size={20} color="#fff" />
                                <Text style={{ color: '#fff', fontWeight: '600' }}>Calc</Text>
                            </TouchableOpacity>
                        </View>

                    </View>

                </ScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
                        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Record Loan</Text>}
                    </TouchableOpacity>
                </View>

            </KeyboardAvoidingView>

            {/* MODALS */}
            <SelectorModal
                visible={showLiabilityModal}
                onClose={() => setShowLiabilityModal(false)}
                title="Select Liability Account"
                items={liabilityAccounts}
                onSelect={setSelectedLiabilityAccount}
                renderItem={renderAccountItem}
            />

            <SelectorModal
                visible={showDepositModal}
                onClose={() => setShowDepositModal(false)}
                title="Select Deposit Account"
                items={assetAccounts}
                onSelect={setSelectedDepositAccount}
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
    label: {
        fontSize: 14,
        color: COLORS.textLight,
        fontWeight: '600',
        marginBottom: 8
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
    dateSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        padding: 15,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        gap: 10
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: 15
    },
    calcBtn: {
        backgroundColor: COLORS.secondary,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderRadius: 12,
        gap: 5
    },
    footer: {
        backgroundColor: '#fff',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB'
    },
    submitBtn: {
        backgroundColor: COLORS.primary,
        padding: 18,
        borderRadius: 16,
        alignItems: 'center',
    },
    submitBtnText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold'
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
