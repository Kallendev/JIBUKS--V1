import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    SafeAreaView,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAccounts } from '@/contexts/AccountsContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Get environment variables (same logic as api.ts)
const getEnvVar = (key: string, defaultValue: string = ''): string => {
    // @ts-ignore - Expo injects these at build time
    return Constants.expoConfig?.extra?.[key] || process.env[key] || defaultValue;
};

const LOCAL_IP = getEnvVar('EXPO_PUBLIC_LOCAL_IP', '172.20.10.2');
const API_PORT = getEnvVar('EXPO_PUBLIC_API_PORT', '4400');
const API_BASE_URL = `http://${LOCAL_IP}:${API_PORT}`;

interface Account {
    id: number;
    code: string;
    name: string;
    type: string;
    balance: number;
    currency: string;
}

export default function TransferScreen() {
    const router = useRouter();
    const { accounts, loading: accountsLoading } = useAccounts();

    // Filter for Asset accounts only (payment-eligible)
    const assetAccounts = accounts.filter((acc) => acc.type === 'ASSET');

    // Form State
    const [fromAccount, setFromAccount] = useState<Account | null>(null);
    const [toAccount, setToAccount] = useState<Account | null>(null);
    const [amount, setAmount] = useState('');
    const [transferFee, setTransferFee] = useState('');
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [reference, setReference] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    // Dropdown states
    const [showFromDropdown, setShowFromDropdown] = useState(false);
    const [showToDropdown, setShowToDropdown] = useState(false);

    // Auto-generate reference
    useEffect(() => {
        const ref = `TRF-${Date.now().toString().slice(-8)}`;
        setReference(ref);
    }, []);

    // Auto-fill description
    useEffect(() => {
        if (fromAccount && toAccount) {
            setDescription(`Transfer from ${fromAccount.name} to ${toAccount.name}`);
        }
    }, [fromAccount, toAccount]);

    // Quick Action Handlers
    const handleQuickATM = () => {
        const cashAccount = assetAccounts.find((acc) => acc.code === '1001');
        if (cashAccount) setToAccount(cashAccount as any);
    };

    const handleQuickBankToMpesa = () => {
        const bankAccount = assetAccounts.find((acc) => acc.code === '1020');
        const mpesaAccount = assetAccounts.find((acc) => acc.code === '1010');
        if (bankAccount) setFromAccount(bankAccount as any);
        if (mpesaAccount) setToAccount(mpesaAccount as any);
    };

    const handleQuickMpesaToBank = () => {
        const mpesaAccount = assetAccounts.find((acc) => acc.code === '1010');
        const bankAccount = assetAccounts.find((acc) => acc.code === '1020');
        if (mpesaAccount) setFromAccount(mpesaAccount as any);
        if (bankAccount) setToAccount(bankAccount as any);
    };

    // Validation
    const validateTransfer = (): boolean => {
        if (!fromAccount) {
            Alert.alert('Validation Error', 'Please select a source account');
            return false;
        }
        if (!toAccount) {
            Alert.alert('Validation Error', 'Please select a destination account');
            return false;
        }
        if (fromAccount.id === toAccount.id) {
            Alert.alert('Validation Error', 'Cannot transfer to the same account');
            return false;
        }
        if (!amount || parseFloat(amount) <= 0) {
            Alert.alert('Validation Error', 'Please enter a valid amount');
            return false;
        }

        const totalDeduction = parseFloat(amount) + parseFloat(transferFee || '0');
        if (totalDeduction > fromAccount.balance) {
            Alert.alert(
                'Insufficient Funds',
                `Total deduction (KES ${totalDeduction.toLocaleString()}) exceeds available balance (KES ${fromAccount.balance.toLocaleString()})`
            );
            return false;
        }

        return true;
    };

    // Submit Transfer
    const handleSubmit = async () => {
        if (!validateTransfer()) return;

        setLoading(true);
        try {
            const parsedAmount = parseFloat(amount);
            const parsedFee = parseFloat(transferFee || '0');

            // Get token from AsyncStorage
            const token = await AsyncStorage.getItem('authToken');

            const requestBody = {
                fromAccountId: fromAccount!.id,
                toAccountId: toAccount!.id,
                amount: parsedAmount,
                fee: parsedFee,
                date: date.toISOString(),
                reference,
                description,
            };

            console.log('Transfer request:', requestBody);

            const response = await fetch(`${API_BASE_URL}/api/transfers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const error = await response.json() as { error?: string; details?: string };
                console.error('Backend error response:', {
                    status: response.status,
                    statusText: response.statusText,
                    error: error.error,
                    details: error.details
                });
                throw new Error(error.error || error.details || 'Failed to create transfer');
            }

            const result = await response.json();

            Alert.alert('Success', 'Transfer completed successfully!', [
                {
                    text: 'OK',
                    onPress: () => {
                        router.back();
                    },
                },
            ]);
        } catch (error: any) {
            console.error('Transfer error:', error);

            let errorMessage = 'Failed to process transfer';

            if (error.message === 'Network request failed') {
                errorMessage = `Cannot connect to server at ${LOCAL_IP}:${API_PORT}. Please check:\n\n1. Backend server is running\n2. You're on the same network\n3. IP address is correct`;
            } else if (error.message) {
                errorMessage = error.message;
            }

            Alert.alert('Transfer Error', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value: number) => {
        return `KES ${value.toLocaleString()}`;
    };

    const totalDeduction = parseFloat(amount || '0') + parseFloat(transferFee || '0');

    if (accountsLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <LinearGradient colors={['#2563eb', '#1e40af']} style={styles.header}>
                    <View style={styles.headerContent}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Transfer Funds</Text>
                        <View style={{ width: 40 }} />
                    </View>
                </LinearGradient>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2563eb" />
                    <Text style={styles.loadingText}>Loading accounts...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <LinearGradient colors={['#2563eb', '#1e40af']} style={styles.header}>
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Transfer Funds</Text>
                    <View style={{ width: 40 }} />
                </View>
                <Text style={styles.headerSubtitle}>Move money between accounts</Text>
            </LinearGradient>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Quick Action Chips */}
                <View style={styles.quickChipsContainer}>
                    <TouchableOpacity style={styles.quickChip} onPress={handleQuickATM}>
                        <Ionicons name="cash-outline" size={20} color="#2563eb" />
                        <Text style={styles.quickChipText}>ATM Withdrawal</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.quickChip} onPress={handleQuickBankToMpesa}>
                        <Ionicons name="phone-portrait-outline" size={20} color="#10b981" />
                        <Text style={styles.quickChipText}>Bank to M-PESA</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.quickChip} onPress={handleQuickMpesaToBank}>
                        <Ionicons name="business-outline" size={20} color="#f59e0b" />
                        <Text style={styles.quickChipText}>M-PESA to Bank</Text>
                    </TouchableOpacity>
                </View>

                {/* Transfer Flow Card */}
                <View style={styles.transferCard}>
                    {/* FROM Account */}
                    <View style={styles.accountSection}>
                        <Text style={styles.sectionLabel}>FROM (Source)</Text>
                        <TouchableOpacity
                            style={styles.accountSelector}
                            onPress={() => setShowFromDropdown(!showFromDropdown)}
                        >
                            <View style={styles.accountSelectorContent}>
                                {fromAccount ? (
                                    <>
                                        <Ionicons name="wallet" size={24} color="#2563eb" />
                                        <View style={{ flex: 1, marginLeft: 12 }}>
                                            <Text style={styles.accountName}>{fromAccount.name}</Text>
                                            <Text style={styles.accountCode}>Code: {fromAccount.code}</Text>
                                        </View>
                                    </>
                                ) : (
                                    <Text style={styles.placeholderText}>Select source account</Text>
                                )}
                                <Ionicons name="chevron-down" size={20} color="#6b7280" />
                            </View>
                        </TouchableOpacity>

                        {/* FROM Dropdown */}
                        {showFromDropdown && (
                            <View style={styles.dropdown}>
                                <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                                    {assetAccounts.map((account) => (
                                        <TouchableOpacity
                                            key={account.id}
                                            style={styles.dropdownItem}
                                            onPress={() => {
                                                setFromAccount(account as any);
                                                setShowFromDropdown(false);
                                            }}
                                        >
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.dropdownItemName}>{account.name}</Text>
                                                <Text style={styles.dropdownItemCode}>Code: {account.code}</Text>
                                            </View>
                                            <Text style={styles.dropdownItemBalance}>
                                                {formatCurrency(account.balance || 0)}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )}

                        {/* Live Balance Display */}
                        {fromAccount && (
                            <View style={styles.balanceInfo}>
                                <Text
                                    style={[
                                        styles.balanceText,
                                        fromAccount.balance < 0 && styles.balanceNegative,
                                    ]}
                                >
                                    Available: {formatCurrency(fromAccount.balance)}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Arrow Divider */}
                    <View style={styles.arrowContainer}>
                        <View style={styles.arrowLine} />
                        <View style={styles.arrowIcon}>
                            <Ionicons name="arrow-forward" size={28} color="#2563eb" />
                        </View>
                        <View style={styles.arrowLine} />
                    </View>

                    {/* TO Account */}
                    <View style={styles.accountSection}>
                        <Text style={styles.sectionLabel}>TO (Destination)</Text>
                        <TouchableOpacity
                            style={styles.accountSelector}
                            onPress={() => setShowToDropdown(!showToDropdown)}
                        >
                            <View style={styles.accountSelectorContent}>
                                {toAccount ? (
                                    <>
                                        <Ionicons name="wallet" size={24} color="#10b981" />
                                        <View style={{ flex: 1, marginLeft: 12 }}>
                                            <Text style={styles.accountName}>{toAccount.name}</Text>
                                            <Text style={styles.accountCode}>Code: {toAccount.code}</Text>
                                        </View>
                                    </>
                                ) : (
                                    <Text style={styles.placeholderText}>Select destination account</Text>
                                )}
                                <Ionicons name="chevron-down" size={20} color="#6b7280" />
                            </View>
                        </TouchableOpacity>

                        {/* TO Dropdown */}
                        {showToDropdown && (
                            <View style={styles.dropdown}>
                                <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                                    {assetAccounts.map((account) => (
                                        <TouchableOpacity
                                            key={account.id}
                                            style={styles.dropdownItem}
                                            onPress={() => {
                                                setToAccount(account as any);
                                                setShowToDropdown(false);
                                            }}
                                        >
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.dropdownItemName}>{account.name}</Text>
                                                <Text style={styles.dropdownItemCode}>Code: {account.code}</Text>
                                            </View>
                                            <Text style={styles.dropdownItemBalance}>
                                                {formatCurrency(account.balance || 0)}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )}

                        {/* Current Balance Display */}
                        {toAccount && (
                            <View style={styles.balanceInfo}>
                                <Text style={styles.balanceText}>
                                    Current Bal: {formatCurrency(toAccount.balance)}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Amount & Fee Section */}
                <View style={styles.amountCard}>
                    <Text style={styles.cardTitle}>Transfer Details</Text>

                    {/* Amount Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Amount to Transfer</Text>
                        <View style={styles.inputWrapper}>
                            <Text style={styles.currencyPrefix}>KES</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="0"
                                placeholderTextColor="#9ca3af"
                                keyboardType="numeric"
                                value={amount}
                                onChangeText={setAmount}
                            />
                        </View>
                        <Text style={styles.inputHint}>Amount entering the destination</Text>
                    </View>

                    {/* Transfer Fee Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Transaction Fee</Text>
                        <View style={styles.inputWrapper}>
                            <Text style={styles.currencyPrefix}>KES</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="0"
                                placeholderTextColor="#9ca3af"
                                keyboardType="numeric"
                                value={transferFee}
                                onChangeText={setTransferFee}
                            />
                        </View>
                        <Text style={styles.inputHint}>Withdrawal/Transfer charge (Bank Charges)</Text>
                    </View>

                    {/* Total Deduction Display */}
                    {(amount || transferFee) && (
                        <View style={styles.totalSection}>
                            <View style={styles.totalDivider} />
                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>
                                    Total Leaving {fromAccount?.name || 'Source'}:
                                </Text>
                                <Text style={styles.totalAmount}>{formatCurrency(totalDeduction)}</Text>
                            </View>
                            {fromAccount && totalDeduction > fromAccount.balance && (
                                <Text style={styles.warningText}>⚠️ Insufficient funds</Text>
                            )}
                        </View>
                    )}
                </View>

                {/* Metadata Section */}
                <View style={styles.metadataCard}>
                    {/* Date Picker */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Date</Text>
                        <TouchableOpacity
                            style={styles.dateButton}
                            onPress={() => setShowDatePicker(true)}
                        >
                            <Ionicons name="calendar-outline" size={20} color="#6b7280" />
                            <Text style={styles.dateText}>{date.toLocaleDateString()}</Text>
                        </TouchableOpacity>
                        {showDatePicker && (
                            <DateTimePicker
                                value={date}
                                mode="date"
                                display="default"
                                onChange={(event: any, selectedDate?: Date) => {
                                    setShowDatePicker(false);
                                    if (selectedDate) setDate(selectedDate);
                                }}
                            />
                        )}
                    </View>

                    {/* Reference */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Reference</Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Auto-generated"
                            placeholderTextColor="#9ca3af"
                            value={reference}
                            onChangeText={setReference}
                        />
                    </View>

                    {/* Description */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Description</Text>
                        <TextInput
                            style={[styles.textInput, styles.textArea]}
                            placeholder="Transfer description"
                            placeholderTextColor="#9ca3af"
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            numberOfLines={3}
                        />
                    </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={[styles.button, styles.cancelButton]}
                        onPress={() => router.back()}
                    >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, styles.submitButton, loading && styles.buttonDisabled]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="swap-horizontal" size={20} color="#fff" />
                                <Text style={styles.submitButtonText}>Save Transfer</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f3f4f6',
    },
    header: {
        paddingTop: 20,
        paddingBottom: 24,
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
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        fontWeight: '500',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#6b7280',
    },
    content: {
        flex: 1,
    },
    quickChipsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 16,
        gap: 8,
    },
    quickChip: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: 12,
        gap: 6,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    quickChipText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#1f2937',
    },
    transferCard: {
        marginHorizontal: 20,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    accountSection: {
        marginBottom: 16,
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#6b7280',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    accountSelector: {
        borderWidth: 2,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        padding: 14,
        backgroundColor: '#f9fafb',
    },
    accountSelectorContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    accountName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
    },
    accountCode: {
        fontSize: 12,
        color: '#9ca3af',
        marginTop: 2,
    },
    placeholderText: {
        flex: 1,
        fontSize: 15,
        color: '#9ca3af',
    },
    dropdown: {
        marginTop: 8,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        maxHeight: 200,
    },
    dropdownScroll: {
        maxHeight: 200,
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    dropdownItemName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1f2937',
    },
    dropdownItemCode: {
        fontSize: 12,
        color: '#9ca3af',
        marginTop: 2,
    },
    dropdownItemBalance: {
        fontSize: 14,
        fontWeight: '700',
        color: '#2563eb',
    },
    balanceInfo: {
        marginTop: 8,
        paddingHorizontal: 4,
    },
    balanceText: {
        fontSize: 13,
        color: '#6b7280',
        fontWeight: '500',
    },
    balanceNegative: {
        color: '#ef4444',
    },
    arrowContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 12,
    },
    arrowLine: {
        flex: 1,
        height: 2,
        backgroundColor: '#e5e7eb',
    },
    arrowIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#dbeafe',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 12,
    },
    amountCard: {
        marginHorizontal: 20,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 16,
    },
    inputGroup: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        paddingHorizontal: 14,
        backgroundColor: '#f9fafb',
    },
    currencyPrefix: {
        fontSize: 16,
        fontWeight: '700',
        color: '#6b7280',
        marginRight: 8,
    },
    input: {
        flex: 1,
        fontSize: 18,
        fontWeight: '600',
        color: '#1f2937',
        paddingVertical: 14,
    },
    inputHint: {
        fontSize: 12,
        color: '#9ca3af',
        marginTop: 4,
        fontStyle: 'italic',
    },
    totalSection: {
        marginTop: 8,
    },
    totalDivider: {
        height: 1,
        backgroundColor: '#e5e7eb',
        marginVertical: 12,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    totalLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6b7280',
    },
    totalAmount: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#2563eb',
    },
    warningText: {
        fontSize: 13,
        color: '#ef4444',
        marginTop: 8,
        fontWeight: '600',
    },
    metadataCard: {
        marginHorizontal: 20,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        padding: 14,
        backgroundColor: '#f9fafb',
        gap: 10,
    },
    dateText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1f2937',
    },
    textInput: {
        borderWidth: 2,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        padding: 14,
        fontSize: 15,
        color: '#1f2937',
        backgroundColor: '#f9fafb',
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    buttonContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 12,
    },
    button: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
    },
    cancelButton: {
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#e5e7eb',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#6b7280',
    },
    submitButton: {
        backgroundColor: '#2563eb',
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
});
