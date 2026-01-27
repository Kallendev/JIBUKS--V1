import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView,
    TextInput, Platform, Alert, ActivityIndicator, Image, Modal, FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import apiService, { Account } from '@/services/api';

export default function PaySupplierScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { supplierId, supplierName } = params;

    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);

    // Data
    const [bills, setBills] = useState<any[]>([]);
    const [paymentAccounts, setPaymentAccounts] = useState<Account[]>([]);

    // Form State
    const [selectedBillIds, setSelectedBillIds] = useState<Set<number>>(new Set());
    const [paymentAccountId, setPaymentAccountId] = useState<string | null>(null);
    const [paymentDate, setPaymentDate] = useState(new Date());
    const [totalAmountPaid, setTotalAmountPaid] = useState('');
    const [reference, setReference] = useState('');
    const [notes, setNotes] = useState('');
    const [attachment, setAttachment] = useState<string | null>(null);

    // Modals
    const [showAccountModal, setShowAccountModal] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
    const [showChequeDatePicker, setShowChequeDatePicker] = useState(false);

    // Payment Method & Cheque Support
    const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
    const [chequeNumber, setChequeNumber] = useState('');
    const [chequeDate, setChequeDate] = useState(new Date());

    const paymentMethods = ['Cash', 'Bank Transfer', 'M-PESA', 'Cheque'];

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [purchasesData, accountsData] = await Promise.all([
                apiService.getPurchases(), // Fetch all, we will filter
                apiService.getPaymentEligibleAccounts() // Fetch only payment-eligible accounts (Cash/Bank)
            ]);

            // Filter for this supplier and unpaid/partial
            const unpaidBills = purchasesData
                .filter((p: any) =>
                    String(p.vendorId) === String(supplierId) &&
                    (p.status === 'UNPAID' || p.status === 'PARTIAL')
                )
                .map((p: any) => ({
                    ...p,
                    balance: Number(p.total) - Number(p.amountPaid)
                }))
                .sort((a: any, b: any) => new Date(a.dueDate || a.createdAt).getTime() - new Date(b.dueDate || b.createdAt).getTime());

            setBills(unpaidBills);
            setPaymentAccounts(accountsData); // Already filtered to payment-eligible only

            setPageLoading(false);
        } catch (error) {
            console.error('Failed to load data:', error);
            Alert.alert('Error', 'Failed to load outstanding bills.');
            setPageLoading(false);
        }
    };

    // Auto-calculate total when selection changes
    useEffect(() => {
        let sum = 0;
        selectedBillIds.forEach(id => {
            const bill = bills.find(b => b.id === id);
            if (bill) sum += bill.balance;
        });
        setTotalAmountPaid(sum > 0 ? sum.toFixed(2) : '');
    }, [selectedBillIds]);


    const toggleBillSelection = (id: number) => {
        const newSet = new Set(selectedBillIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedBillIds(newSet);
    };

    const handlePay = async () => {
        if (selectedBillIds.size === 0) {
            Alert.alert('Required', 'Please select at least one bill to pay.');
            return;
        }

        const safeAccountId = paymentAccountId;
        if (!safeAccountId) {
            Alert.alert('Required', 'Please select a Payment Account (Cash/Bank).');
            return;
        }

        const bankAccountIdNum = parseInt(safeAccountId, 10);
        if (isNaN(bankAccountIdNum)) {
            Alert.alert('Error', 'Invalid Payment Account ID');
            return;
        }

        if (!totalAmountPaid || parseFloat(totalAmountPaid) <= 0) {
            Alert.alert('Required', 'Please enter a valid amount.');
            return;
        }

        // Validate cheque fields if payment method is Cheque
        if (paymentMethod === 'Cheque') {
            if (!chequeNumber.trim()) {
                Alert.alert('Required', 'Please enter the cheque number.');
                return;
            }
        }

        setLoading(true);
        try {
            const selectedBills = bills.filter(b => selectedBillIds.has(b.id));
            const firstBill = selectedBills[0];

            // If payment method is Cheque, create cheque record first
            if (paymentMethod === 'Cheque') {
                const accountInfo = paymentAccounts.find(a => String(a.id) === safeAccountId);
                const accountNumber = accountInfo?.code?.slice(-4) || '****';

                await apiService.createCheque({
                    tenantId: (await apiService.getCurrentUser()).tenantId!,
                    chequeNumber: chequeNumber,
                    payee: supplierName as string,
                    amount: parseFloat(totalAmountPaid),
                    dueDate: chequeDate.toISOString(),
                    bankAccountId: bankAccountIdNum,
                    accountNumber: accountNumber,
                    purpose: `Payment to ${supplierName} - Bill #${firstBill.billNumber || firstBill.id}`,
                    notes: notes || `Supplier payment via cheque`,
                    reference: reference || chequeNumber,
                });
            }

            // Distribute amount logic
            let remainingAmount = parseFloat(totalAmountPaid);

            console.log('Paying Bills:', selectedBills.map(b => b.id), 'Total:', totalAmountPaid, 'AccID:', bankAccountIdNum);

            for (const bill of selectedBills) {
                if (remainingAmount <= 0) break;

                const amountToPayForThisBill = Math.min(bill.balance, remainingAmount);

                // Construct payload
                const payload = {
                    amount: amountToPayForThisBill,
                    paymentDate: paymentDate.toISOString(),
                    paymentMethod: paymentMethod,
                    bankAccountId: bankAccountIdNum,
                    reference: paymentMethod === 'Cheque' ? chequeNumber : reference,
                    notes: notes
                };

                console.log('Payload for Bill', bill.id, payload);

                await apiService.recordPurchasePayment(bill.id, payload);

                remainingAmount -= amountToPayForThisBill;
            }

            Alert.alert('Success',
                paymentMethod === 'Cheque'
                    ? `Cheque #${chequeNumber} recorded successfully!`
                    : 'Payment recorded successfully!',
                [{ text: 'OK', onPress: () => router.back() }]
            );

        } catch (error: any) {
            console.error('Payment Error:', error);
            Alert.alert('Error', error.error || error.message || 'Failed to record payment');
        } finally {
            setLoading(false);
        }
    };

    const handlePickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.7,
            });
            if (!result.canceled) {
                setAttachment(result.assets[0].uri);
            }
        } catch (e) { Alert.alert('Error', 'Failed to pick image'); }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
    };

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient colors={['#122f8a', '#0a1a5c']} style={styles.header}>
                <Text style={styles.headerTitle}>Pay Supplier — {supplierName}</Text>
                <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
                    <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
            </LinearGradient>

            {pageLoading ? (
                <View style={[styles.content, { justifyContent: 'center', alignItems: 'center' }]}>
                    <ActivityIndicator size="large" color="#122f8a" />
                </View>
            ) : (
                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

                    {/* Outstanding Bills Table */}
                    <Text style={styles.sectionTitle}>Outstanding Bills:</Text>
                    <View style={styles.tableCard}>
                        <View style={styles.tableHeader}>
                            <Text style={[styles.th, { flex: 1.5 }]}>Bill #</Text>
                            <Text style={[styles.th, { flex: 1 }]}>Due</Text>
                            <Text style={[styles.th, { flex: 1.5, textAlign: 'right' }]}>Total</Text>
                            <Text style={[styles.th, { flex: 1.5, textAlign: 'right' }]}>Bal</Text>
                            <Text style={[styles.th, { flex: 0.8, textAlign: 'center' }]}>Pay</Text>
                        </View>
                        {bills.length === 0 ? (
                            <View style={{ padding: 20, alignItems: 'center' }}>
                                <Text style={{ color: '#64748b' }}>No outstanding bills.</Text>
                            </View>
                        ) : (
                            bills.map((bill, index) => (
                                <View key={bill.id} style={[styles.tableRow, index % 2 === 1 && styles.tableRowAlt]}>
                                    <Text style={[styles.td, { flex: 1.5, fontWeight: '600' }]}>{bill.billNumber || `#${bill.id}`}</Text>
                                    <Text style={[styles.td, { flex: 1 }]}>{formatDate(bill.dueDate)}</Text>
                                    <Text style={[styles.td, { flex: 1.5, textAlign: 'right' }]}>{Number(bill.total).toLocaleString()}</Text>
                                    <Text style={[styles.td, { flex: 1.5, textAlign: 'right', color: '#ef4444' }]}>{bill.balance.toLocaleString()}</Text>
                                    <TouchableOpacity
                                        style={[styles.checkboxContainer, { flex: 0.8 }]}
                                        onPress={() => toggleBillSelection(bill.id)}
                                    >
                                        <View style={[styles.checkbox, selectedBillIds.has(bill.id) && styles.checkboxActive]}>
                                            {selectedBillIds.has(bill.id) && <Ionicons name="checkmark" size={12} color="#fff" />}
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            ))
                        )}
                    </View>

                    {/* Payment Details */}
                    <Text style={styles.sectionTitle}>Payment Details:</Text>
                    <View style={styles.card}>
                        <View style={styles.field}>
                            <Text style={styles.label}>Payment Account</Text>
                            <TouchableOpacity style={styles.select} onPress={() => setShowAccountModal(true)}>
                                <Text style={styles.selectText}>
                                    {paymentAccountId
                                        ? paymentAccounts.find(a => String(a.id) === paymentAccountId)?.name
                                        : 'Select Bank / Cash / Wallet ▼'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Payment Method */}
                        <View style={styles.field}>
                            <Text style={styles.label}>Payment Method</Text>
                            <TouchableOpacity style={styles.select} onPress={() => setShowPaymentMethodModal(true)}>
                                <Text style={styles.selectText}>{paymentMethod} ▼</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Conditional Cheque Fields */}
                        {paymentMethod === 'Cheque' && (
                            <>
                                <View style={styles.field}>
                                    <Text style={styles.label}>Cheque Number *</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={chequeNumber}
                                        onChangeText={setChequeNumber}
                                        placeholder="Enter cheque number"
                                        placeholderTextColor="#94a3b8"
                                    />
                                </View>

                                <View style={styles.field}>
                                    <Text style={styles.label}>Cheque Date (Post-Dated)</Text>
                                    <TouchableOpacity style={styles.dateInput} onPress={() => setShowChequeDatePicker(true)}>
                                        <Text style={styles.dateText}>{chequeDate.toLocaleDateString()}</Text>
                                        <Ionicons name="calendar-outline" size={16} color="#64748b" />
                                    </TouchableOpacity>
                                    <Text style={styles.hintText}>💡 Won't deduct from bank until cleared</Text>
                                </View>
                            </>
                        )}

                        <View style={styles.field}>
                            <Text style={styles.label}>Payment Date</Text>
                            <TouchableOpacity style={styles.dateInput} onPress={() => setShowDatePicker(true)}>
                                <Text style={styles.dateText}>{paymentDate.toLocaleDateString()}</Text>
                                <Ionicons name="calendar-outline" size={16} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.field}>
                            <Text style={styles.label}>Amount Paid (KES)</Text>
                            <TextInput
                                style={[styles.input, styles.amountInput]}
                                value={totalAmountPaid}
                                onChangeText={setTotalAmountPaid}
                                placeholder="0.00"
                                keyboardType="numeric"
                            />
                            <Text style={styles.hintText}>Auto-sum of selected bills (editable)</Text>
                        </View>
                    </View>

                    {/* Attachments */}
                    <Text style={styles.sectionTitle}>Attachments:</Text>
                    <View style={styles.card}>
                        <TouchableOpacity style={styles.uploadBtn} onPress={handlePickImage}>
                            <Ionicons name="attach" size={20} color="#122f8a" />
                            <Text style={styles.uploadText}>{attachment ? 'Change Receipt' : 'Upload Receipt'}</Text>
                        </TouchableOpacity>
                        {attachment && (
                            <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center' }}>
                                <Ionicons name="document" size={16} color="#64748b" />
                                <Text style={{ marginLeft: 6, color: '#64748b' }}>Receipt Attached</Text>
                            </View>
                        )}
                    </View>

                    {/* Action */}
                    <TouchableOpacity
                        style={[styles.bigBtn, (!selectedBillIds.size || loading) && { opacity: 0.7 }]}
                        onPress={handlePay}
                        disabled={loading || selectedBillIds.size === 0}
                    >
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.bigBtnText}>Record Payment</Text>}
                    </TouchableOpacity>

                    <View style={{ height: 60 }} />

                </ScrollView>
            )}

            {/* Account Modal */}
            <Modal visible={showAccountModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modal}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Payment Account</Text>
                            <TouchableOpacity onPress={() => setShowAccountModal(false)}>
                                <Ionicons name="close" size={24} color="#1e293b" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView>
                            {paymentAccounts.map((a: any) => (
                                <TouchableOpacity
                                    key={a.id}
                                    style={styles.modalItem}
                                    onPress={() => {
                                        setPaymentAccountId(String(a._dbId || a.id));
                                        setShowAccountModal(false);
                                    }}
                                >
                                    <Text style={styles.modalItemText}>{a.name}</Text>
                                    <Text style={styles.modalItemSub}>{a.code}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Payment Method Modal */}
            <Modal visible={showPaymentMethodModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modal}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Payment Method</Text>
                            <TouchableOpacity onPress={() => setShowPaymentMethodModal(false)}>
                                <Ionicons name="close" size={24} color="#1e293b" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView>
                            {paymentMethods.map((method) => (
                                <TouchableOpacity
                                    key={method}
                                    style={styles.modalItem}
                                    onPress={() => {
                                        setPaymentMethod(method);
                                        setShowPaymentMethodModal(false);
                                    }}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Ionicons
                                            name={
                                                method === 'Cash' ? 'cash-outline' :
                                                    method === 'Bank Transfer' ? 'card-outline' :
                                                        method === 'M-PESA' ? 'phone-portrait-outline' :
                                                            'document-text-outline'
                                            }
                                            size={20}
                                            color="#122f8a"
                                            style={{ marginRight: 12 }}
                                        />
                                        <Text style={styles.modalItemText}>{method}</Text>
                                    </View>
                                    {paymentMethod === method && (
                                        <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Cheque Date Picker */}
            <CustomDatePicker
                visible={showChequeDatePicker}
                onClose={() => setShowChequeDatePicker(false)}
                date={chequeDate}
                onChange={setChequeDate}
            />

            {/* Simple Date Picker Modal Reuse */}
            <CustomDatePicker
                visible={showDatePicker}
                onClose={() => setShowDatePicker(false)}
                date={paymentDate}
                onChange={setPaymentDate}
            />

        </SafeAreaView>
    );
}

// Simple JS Date Picker Component (Reused)
const CustomDatePicker = ({ visible, onClose, date, onChange }: any) => {
    const [tempDate, setTempDate] = useState(date || new Date());
    const daysInMonth = new Date(tempDate.getFullYear(), tempDate.getMonth() + 1, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.modalOverlay}>
                <View style={[styles.modal, { maxHeight: 'auto' }]}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Select Date</Text>
                        <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color="#1e293b" /></TouchableOpacity>
                    </View>
                    <View style={{ padding: 20 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 15 }}>
                            <Text style={{ fontSize: 16, fontWeight: '700' }}>{months[tempDate.getMonth()]} {tempDate.getFullYear()}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                            {days.map(day => (
                                <TouchableOpacity key={day} style={{ width: 36, height: 36, justifyContent: 'center', alignItems: 'center', borderRadius: 18, backgroundColor: tempDate.getDate() === day ? '#122f8a' : '#f1f5f9' }} onPress={() => { const newDate = new Date(tempDate); newDate.setDate(day); setTempDate(newDate); }}>
                                    <Text style={{ color: tempDate.getDate() === day ? '#fff' : '#334155', fontSize: 13 }}>{day}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <TouchableOpacity style={{ backgroundColor: '#122f8a', marginTop: 20, padding: 12, borderRadius: 8, alignItems: 'center' }} onPress={() => { onChange(tempDate); onClose(); }}>
                            <Text style={{ color: '#fff' }}>Confirm</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: { padding: 16, paddingTop: Platform.OS === 'android' ? 40 : 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
    closeBtn: { padding: 4 },
    content: { flex: 1, padding: 16 },

    sectionTitle: { fontSize: 13, fontWeight: '700', color: '#64748b', marginBottom: 8, marginTop: 16, letterSpacing: 0.5 },

    tableCard: { backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden' },
    tableHeader: { flexDirection: 'row', backgroundColor: '#f1f5f9', padding: 12, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
    th: { fontSize: 12, fontWeight: '700', color: '#475569' },
    tableRow: { flexDirection: 'row', padding: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', alignItems: 'center' },
    tableRowAlt: { backgroundColor: '#f8fafc' },
    td: { fontSize: 12, color: '#334155' },

    checkboxContainer: { alignItems: 'center', justifyContent: 'center' },
    checkbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 1, borderColor: '#cbd5e1', alignItems: 'center', justifyContent: 'center' },
    checkboxActive: { backgroundColor: '#122f8a', borderColor: '#122f8a' },

    card: { backgroundColor: '#fff', padding: 16, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' },

    field: { marginBottom: 12 },
    label: { fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 4 },

    select: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 10 },
    selectText: { fontSize: 14, color: '#0f172a' },

    dateInput: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', justifyContent: 'space-between' },
    dateText: { fontSize: 14, color: '#0f172a' },

    input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#0f172a' },
    amountInput: { fontSize: 16, fontWeight: '700', color: '#122f8a' },
    hintText: { fontSize: 11, color: '#94a3b8', marginTop: 4, fontStyle: 'italic' },

    uploadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#dbeafe', borderRadius: 6, padding: 12 },
    uploadText: { fontSize: 13, fontWeight: '600', color: '#122f8a', marginLeft: 8 },

    bigBtn: { backgroundColor: '#fe9900', marginTop: 24, paddingVertical: 14, borderRadius: 8, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
    bigBtnText: { color: '#fff', fontWeight: '700', fontSize: 15, letterSpacing: 0.5 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modal: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '70%', paddingBottom: 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    modalTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
    modalItem: { paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
    modalItemText: { fontSize: 15, color: '#334155', fontWeight: '500' },
    modalItemSub: { fontSize: 12, color: '#94a3b8' },
});
