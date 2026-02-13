import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView,
    TextInput, Platform, Alert, ActivityIndicator, Image, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import apiService, { Account } from '@/services/api';

export default function SupplierBillScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { supplierId, supplierName } = params;

    const [loading, setLoading] = useState(false);
    const [expenseAccounts, setExpenseAccounts] = useState<Account[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<any[]>([]);

    // Form State
    const [categoryId, setCategoryId] = useState<string | null>(null);
    const [amount, setAmount] = useState('');
    const [billDate, setBillDate] = useState(new Date());
    const [dueDate, setDueDate] = useState<Date>(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // Default Net 7
    const [taxRate, setTaxRate] = useState(0);
    const [taxInclusive, setTaxInclusive] = useState(false);
    const [reference, setReference] = useState('');
    const [notes, setNotes] = useState('');
    const [attachments, setAttachments] = useState<string[]>([]);
    const [paymentMethodId, setPaymentMethodId] = useState<number | null>(null);

    // Modals
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
    const [showDueDatePicker, setShowDueDatePicker] = useState(false);
    const [showBillDatePicker, setShowBillDatePicker] = useState(false);

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            const [accountsData, methodsData] = await Promise.all([
                apiService.getAccounts({ type: 'EXPENSE' }),
                apiService.getPaymentMethods()
            ]);
            setExpenseAccounts(accountsData);
            setPaymentMethods(methodsData);

            // Auto-select first category if available
            if (accountsData.length > 0) {
                const validAcc = accountsData.find(a => a && a.id);
                if (validAcc) {
                    setCategoryId(String(validAcc.id));
                }
            }
        } catch (error) {
            console.error('Failed to load data:', error);
            Alert.alert('Error', 'Failed to load configuration data.');
        }
    };

    const handlePickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.7,
            });
            if (!result.canceled) {
                setAttachments([...attachments, result.assets[0].uri]);
            }
        } catch (e) {
            Alert.alert('Error', 'Failed to pick image');
        }
    };

    const handleSave = async (reset: boolean = false) => {
        if (!amount) {
            Alert.alert('Required', 'Please enter a bill amount');
            return;
        }

        setLoading(true);
        try {
            const status = paymentMethodId ? 'PAID' : 'UNPAID';

            // Resolve Category ID
            let finalCategoryId = categoryId;
            if (!finalCategoryId && expenseAccounts.length > 0) {
                const validAcc = expenseAccounts.find(a => a && a.id);
                if (validAcc) finalCategoryId = String(validAcc.id);
            }

            if (!finalCategoryId) throw new Error('No expense account selected');

            const cleanId = String(finalCategoryId).replace(/\D/g, '');
            const accountIdNum = parseInt(cleanId, 10);

            const formData = new FormData();
            formData.append('vendorId', String(supplierId));
            formData.append('purchaseDate', billDate.toISOString());
            formData.append('dueDate', dueDate.toISOString());
            formData.append('billNumber', reference);
            formData.append('notes', notes);
            formData.append('status', status);
            formData.append('tax', String(taxRate));

            formData.append('items', JSON.stringify([{
                description: `Bill from ${supplierName}`,
                quantity: 1,
                unitPrice: parseFloat(amount),
                accountId: accountIdNum
            }]));

            if (attachments.length > 0) {
                const filename = attachments[0].split('/').pop() || 'bill.jpg';
                const type = `image/${filename.split('.').pop()}`;
                // @ts-ignore
                formData.append('attachment', { uri: attachments[0], name: filename, type });
            }

            await apiService.createPurchase(formData);

            Alert.alert('Success', 'Bill saved successfully', [
                {
                    text: 'OK', onPress: () => {
                        if (reset) {
                            setAmount('');
                            setReference('');
                            setNotes('');
                            setAttachments([]);
                            setBillDate(new Date());
                            setPaymentMethodId(null);
                        } else {
                            router.back();
                        }
                    }
                }
            ]);
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to save bill');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Minimal Header */}
            <LinearGradient colors={['#122f8a', '#0a1a5c']} style={styles.header}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitle}>{supplierName}</Text>
                    <Text style={styles.headerSubtitle}>New Bill Entry</Text>
                </View>
                <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
                    <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
            </LinearGradient>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

                {/* Main Form Card */}
                <View style={styles.card}>
                    {/* Amount - First Focus */}
                    <View style={styles.field}>
                        <Text style={styles.label}>Amount (KES)</Text>
                        <TextInput
                            style={[styles.input, styles.amountInput]}
                            value={amount}
                            onChangeText={setAmount}
                            placeholder="0.00"
                            keyboardType="numeric"
                            placeholderTextColor="#9ca3af"
                        />
                    </View>

                    {/* Dates */}
                    <View style={styles.row}>
                        <View style={styles.halfField}>
                            <Text style={styles.label}>Bill Date</Text>
                            <TouchableOpacity style={styles.dateInput} onPress={() => setShowBillDatePicker(true)}>
                                <Text style={styles.dateText}>{formatDate(billDate)}</Text>
                                <Ionicons name="calendar-outline" size={16} color="#64748b" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.halfField}>
                            <Text style={styles.label}>Due Date</Text>
                            <TouchableOpacity style={styles.dateInput} onPress={() => setShowDueDatePicker(true)}>
                                <Text style={styles.dateText}>{formatDate(dueDate)}</Text>
                                <Ionicons name="calendar-outline" size={16} color="#64748b" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Tax Row */}
                    <View style={[styles.row, { alignItems: 'center' }]}>
                        <View style={styles.halfField}>
                            <Text style={styles.label}>Tax %</Text>
                            <View style={styles.readOnly}>
                                <Text style={styles.readOnlyText}>0%</Text>
                            </View>
                        </View>
                        <View style={styles.halfField}>
                            <TouchableOpacity
                                style={{ flexDirection: 'row', alignItems: 'center', marginTop: 24 }}
                                onPress={() => setTaxInclusive(!taxInclusive)}
                            >
                                <View style={[styles.checkbox, taxInclusive && styles.checkboxActive]}>
                                    {taxInclusive && <Ionicons name="checkmark" size={12} color="#fff" />}
                                </View>
                                <Text style={styles.checkboxLabel}>Tax Inclusive</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Reference & Notes */}
                    <View style={styles.field}>
                        <Text style={styles.label}>Reference / Invoice #</Text>
                        <TextInput
                            style={styles.input}
                            value={reference}
                            onChangeText={setReference}
                            placeholder="e.g. INV-001"
                            placeholderTextColor="#9ca3af"
                        />
                    </View>

                    <View style={styles.field}>
                        <Text style={styles.label}>Notes</Text>
                        <TextInput
                            style={styles.input}
                            value={notes}
                            onChangeText={setNotes}
                            placeholder="Add details..."
                            placeholderTextColor="#9ca3af"
                        />
                    </View>

                    {/* Attachments Area */}
                    <View style={{ marginTop: 8, marginBottom: 24 }}>
                        <View style={styles.attachmentRow}>
                            <TouchableOpacity style={styles.uploadBtn} onPress={handlePickImage}>
                                <Ionicons name="camera-outline" size={20} color="#122f8a" />
                                <Text style={styles.uploadText}>Add Photo</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.addBtn} onPress={handlePickImage}>
                                <Ionicons name="add" size={20} color="#fe9900" />
                            </TouchableOpacity>
                        </View>

                        {attachments.map((uri, idx) => (
                            <View key={idx} style={styles.attachmentItem}>
                                <Ionicons name="image-outline" size={14} color="#64748b" />
                                <Text style={styles.attachmentName} numberOfLines={1}>
                                    Attachment {idx + 1}
                                </Text>
                                <TouchableOpacity onPress={() => setAttachments(attachments.filter((_, i) => i !== idx))}>
                                    <Ionicons name="close-circle" size={16} color="#ef4444" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>

                    {/* Financial Section Field - Moved Here */}
                    <View style={styles.field}>
                        <Text style={styles.label}>Expense Account</Text>
                        <View style={[styles.readOnly, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                            <Text style={[styles.readOnlyText, { flex: 1 }]}>
                                {categoryId
                                    ? `Auto-filled: ${expenseAccounts.find(a => String(a.id) === categoryId)?.name}`
                                    : 'Loading...'}
                            </Text>
                            <TouchableOpacity onPress={() => setShowCategoryModal(true)}>
                                <Text style={{ color: '#122f8a', fontSize: 13, fontWeight: '600' }}>Edit</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Payment Method */}
                    <View style={styles.field}>
                        <Text style={styles.label}>Payment Method</Text>
                        <TouchableOpacity style={styles.select} onPress={() => setShowPaymentMethodModal(true)}>
                            <Text style={styles.selectText}>
                                {paymentMethodId
                                    ? paymentMethods.find(p => p.id === paymentMethodId)?.name
                                    : 'None (Unpaid) ▼'}
                            </Text>
                        </TouchableOpacity>
                        {paymentMethodId && (
                            <Text style={{ fontSize: 11, color: '#fe9900', marginTop: 4 }}>
                                Marked as PAID
                            </Text>
                        )}
                    </View>

                </View>

                {/* Actions */}
                <View style={styles.actionRow}>
                    <TouchableOpacity
                        style={[styles.btn, styles.saveBtn]}
                        onPress={() => handleSave(false)}
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save</Text>}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.btn, styles.saveNewBtn]}
                        onPress={() => handleSave(true)}
                        disabled={loading}
                    >
                        <Text style={styles.saveNewBtnText}>Save & New</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={() => router.back()}>
                        <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 60 }} />
            </ScrollView>

            {/* Modals reused from entries */}
            <CustomDatePicker
                visible={showDueDatePicker}
                onClose={() => setShowDueDatePicker(false)}
                date={dueDate}
                onChange={setDueDate}
                title="Select Due Date"
            />
            <CustomDatePicker
                visible={showBillDatePicker}
                onClose={() => setShowBillDatePicker(false)}
                date={billDate}
                onChange={setBillDate}
                title="Select Bill Date"
            />
            <Modal visible={showCategoryModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modal}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Choose Expense Account</Text>
                            <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                                <Ionicons name="close" size={24} color="#1e293b" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView>
                            {expenseAccounts.map(a => (
                                <TouchableOpacity
                                    key={a.id}
                                    style={styles.modalItem}
                                    onPress={() => {
                                        setCategoryId(String(a.id));
                                        setShowCategoryModal(false);
                                    }}
                                >
                                    <Text style={styles.modalItemText}>{a.name}</Text>
                                    {a.code && <Text style={styles.modalItemSub}>{a.code}</Text>}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
            <Modal visible={showPaymentMethodModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modal}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Payment Method</Text>
                            <TouchableOpacity onPress={() => setShowPaymentMethodModal(false)}>
                                <Ionicons name="close" size={24} color="#1e293b" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView>
                            <TouchableOpacity
                                style={styles.modalItem}
                                onPress={() => {
                                    setPaymentMethodId(null);
                                    setShowPaymentMethodModal(false);
                                }}
                            >
                                <Text style={[styles.modalItemText, { fontStyle: 'italic', color: '#64748b' }]}>None (Creates AP)</Text>
                            </TouchableOpacity>
                            {paymentMethods.map(m => (
                                <TouchableOpacity
                                    key={m.id}
                                    style={styles.modalItem}
                                    onPress={() => {
                                        setPaymentMethodId(m.id);
                                        setShowPaymentMethodModal(false);
                                    }}
                                >
                                    <Text style={styles.modalItemText}>{m.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

// Simple JS Date Picker Component (iOS Optimized)
const CustomDatePicker = ({ visible, onClose, date, onChange, title }: any) => {
    const [tempDate, setTempDate] = useState(date || new Date());

    const currentYear = tempDate.getFullYear();
    const currentMonth = tempDate.getMonth();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const changeMonth = (increment: number) => {
        const newDate = new Date(tempDate);
        newDate.setMonth(newDate.getMonth() + increment);
        setTempDate(newDate);
    };

    const confirmDate = () => {
        onChange(tempDate);
        onClose();
    };

    // Add empty cells for days before first day of month
    const emptyDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={datePickerStyles.overlay}>
                <View style={datePickerStyles.container}>
                    {/* Header */}
                    <View style={datePickerStyles.header}>
                        <Text style={datePickerStyles.title}>{title}</Text>
                        <TouchableOpacity onPress={onClose} style={datePickerStyles.closeButton}>
                            <Ionicons name="close" size={24} color="#1e293b" />
                        </TouchableOpacity>
                    </View>

                    {/* Month/Year Navigation */}
                    <View style={datePickerStyles.monthNav}>
                        <TouchableOpacity
                            onPress={() => changeMonth(-1)}
                            style={datePickerStyles.navButton}
                        >
                            <Ionicons name="chevron-back" size={24} color="#122f8a" />
                        </TouchableOpacity>

                        <Text style={datePickerStyles.monthYear}>
                            {months[tempDate.getMonth()]} {tempDate.getFullYear()}
                        </Text>

                        <TouchableOpacity
                            onPress={() => changeMonth(1)}
                            style={datePickerStyles.navButton}
                        >
                            <Ionicons name="chevron-forward" size={24} color="#122f8a" />
                        </TouchableOpacity>
                    </View>

                    {/* Week Days Header */}
                    <View style={datePickerStyles.weekDaysRow}>
                        {weekDays.map((day, idx) => (
                            <View key={idx} style={datePickerStyles.weekDayCell}>
                                <Text style={datePickerStyles.weekDayText}>{day}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Calendar Days */}
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <View style={datePickerStyles.daysGrid}>
                            {/* Empty cells before first day */}
                            {emptyDays.map(i => (
                                <View key={`empty-${i}`} style={datePickerStyles.dayCell} />
                            ))}

                            {/* Actual days */}
                            {days.map(day => {
                                const isSelected = tempDate.getDate() === day;
                                const isToday = new Date().getDate() === day &&
                                    new Date().getMonth() === tempDate.getMonth() &&
                                    new Date().getFullYear() === tempDate.getFullYear();

                                return (
                                    <TouchableOpacity
                                        key={day}
                                        style={[
                                            datePickerStyles.dayCell,
                                            isSelected && datePickerStyles.selectedDay,
                                            isToday && !isSelected && datePickerStyles.todayDay
                                        ]}
                                        onPress={() => {
                                            const newDate = new Date(tempDate);
                                            newDate.setDate(day);
                                            setTempDate(newDate);
                                        }}
                                    >
                                        <Text style={[
                                            datePickerStyles.dayText,
                                            isSelected && datePickerStyles.selectedDayText,
                                            isToday && !isSelected && datePickerStyles.todayDayText
                                        ]}>
                                            {day}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </ScrollView>

                    {/* Confirm Button */}
                    <TouchableOpacity
                        style={datePickerStyles.confirmButton}
                        onPress={confirmDate}
                    >
                        <Text style={datePickerStyles.confirmText}>
                            Confirm Date
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

// Date Picker Styles (Separate for clarity)
const datePickerStyles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: '#ffffff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: Platform.OS === 'ios' ? 34 : 20,
        maxHeight: '75%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1e293b',
    },
    closeButton: {
        padding: 8,
        backgroundColor: '#f8fafc',
        borderRadius: 20,
    },
    monthNav: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    navButton: {
        padding: 8,
        backgroundColor: '#eff6ff',
        borderRadius: 12,
    },
    monthYear: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1e293b',
    },
    weekDaysRow: {
        flexDirection: 'row',
        paddingHorizontal: 12,
        paddingBottom: 8,
        backgroundColor: '#f8fafc',
    },
    weekDayCell: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 8,
    },
    weekDayText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748b',
        textTransform: 'uppercase',
    },
    daysGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 12,
        paddingTop: 8,
    },
    dayCell: {
        width: `${100 / 7}%`,
        aspectRatio: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 4,
    },
    selectedDay: {
        backgroundColor: '#122f8a',
        borderRadius: 12,
    },
    todayDay: {
        borderWidth: 2,
        borderColor: '#fe9900',
        borderRadius: 12,
    },
    dayText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#334155',
    },
    selectedDayText: {
        color: '#ffffff',
        fontWeight: '700',
    },
    todayDayText: {
        color: '#fe9900',
        fontWeight: '700',
    },
    confirmButton: {
        marginHorizontal: 20,
        marginTop: 16,
        backgroundColor: '#122f8a',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#122f8a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    confirmText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '700',
    },
});

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: { padding: 16, paddingTop: Platform.OS === 'android' ? 40 : 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
    headerSubtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
    closeBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20 },

    content: { flex: 1, padding: 16 },
    card: { backgroundColor: '#fff', padding: 20, borderRadius: 16, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },

    field: { marginBottom: 16 },
    label: { fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },

    input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: '#0f172a' },
    amountInput: { fontSize: 18, fontWeight: '600', color: '#122f8a' },

    select: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12 },
    selectText: { fontSize: 15, color: '#0f172a' },

    row: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    halfField: { flex: 1 },
    dateInput: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    dateText: { fontSize: 14, color: '#0f172a' },

    readOnly: { backgroundColor: '#f1f5f9', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12 },
    readOnlyText: { color: '#64748b', fontSize: 15 },

    checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: '#cbd5e1', marginRight: 8, alignItems: 'center', justifyContent: 'center' },
    checkboxActive: { backgroundColor: '#122f8a', borderColor: '#122f8a' },
    checkboxLabel: { fontSize: 14, color: '#0f172a', fontWeight: '500' },

    attachmentRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
    uploadBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#dbeafe', borderRadius: 10, padding: 12 },
    uploadText: { fontSize: 14, fontWeight: '600', color: '#122f8a', marginLeft: 8 },
    addBtn: { width: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff7ed', borderWidth: 1, borderColor: '#fed7aa', borderRadius: 10 },

    attachmentItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', padding: 8, borderRadius: 8, marginTop: 8 },
    attachmentName: { flex: 1, marginLeft: 8, color: '#64748b', fontSize: 13 },

    actionRow: { flexDirection: 'row', gap: 10 },
    btn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
    saveBtn: { backgroundColor: '#122f8a' },
    saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    saveNewBtn: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#122f8a' },
    saveNewBtnText: { color: '#122f8a', fontWeight: '700', fontSize: 14 },
    cancelBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ef4444', flex: 0.7 },
    cancelBtnText: { color: '#ef4444', fontWeight: '600', fontSize: 14 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modal: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '70%', paddingBottom: 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    modalTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
    modalItem: { paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
    modalItemText: { fontSize: 16, color: '#334155', fontWeight: '500' },
    modalItemSub: { fontSize: 13, color: '#94a3b8', marginTop: 4 },
});
