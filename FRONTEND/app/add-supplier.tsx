import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    TextInput,
    Switch,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import apiService from '@/services/api';

export default function AddSupplierScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Form State
    const [logo, setLogo] = useState<string | null>(null);
    const [supplierName, setSupplierName] = useState('');
    const [category, setCategory] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');

    // Billing
    const [accountNumber, setAccountNumber] = useState('');
    const [preferredPaymentMethod, setPreferredPaymentMethod] = useState('Cash'); // Default
    const [paymentTerms, setPaymentTerms] = useState('Immediate');

    // Preferences
    const [defaultCategory, setDefaultCategory] = useState('Utilities: Water');
    const [autoTagReceipts, setAutoTagReceipts] = useState(true);
    const [recurringBills, setRecurringBills] = useState('No');
    const [reminderBeforeDue, setReminderBeforeDue] = useState('3 days');

    // Financial Options
    const [acceptCheque, setAcceptCheque] = useState(false); // Yes/No
    const [trackUnpaidBills, setTrackUnpaidBills] = useState(false); // Yes/No
    const [notes, setNotes] = useState('');

    // Options Lists
    const categories = ['Utilities', 'School', 'Grocery', 'Transport', 'Other'];
    const paymentMethods = ['Bank', 'Cash', 'Wallet', 'Cheque'];
    const paymentTermsOptions = ['Immediate', '7 days', '14 days', '30 days'];
    const recurringOptions = ['Monthly', 'No'];

    const handlePickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result.canceled) {
            setLogo(result.assets[0].uri);
        }
    };

    const handleSave = async () => {
        if (!supplierName) {
            Alert.alert('Required', 'Please enter a supplier name');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                name: supplierName,
                category,
                phone,
                email,
                address,
                paymentTerms,
                accountNumber,
                preferredPaymentMethod,
                defaultCategory,
                autoTagReceipts,
                recurringBills,
                reminderBeforeDue,
                acceptCheque,
                trackUnpaidBills,
                notes,
                logoUri: logo
            };

            await apiService.createVendor(payload);
            Alert.alert('Success', 'Supplier added successfully');
            router.back();
        } catch (error) {
            console.error('Error saving supplier:', error);
            Alert.alert('Error', 'Failed to save supplier. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const renderChipGroup = (options: string[], selected: string, onSelect: (val: string) => void) => (
        <View style={styles.chipContainer}>
            {options.map((option) => (
                <TouchableOpacity
                    key={option}
                    style={[styles.chip, selected === option && styles.chipActive]}
                    onPress={() => onSelect(option)}
                    activeOpacity={0.7}
                >
                    <Text style={[styles.chipText, selected === option && styles.chipTextActive]}>
                        {option}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );

    const renderToggleGroup = (label: string, value: boolean, onToggle: (val: boolean) => void) => (
        <View style={styles.toggleRow}>
            <Text style={styles.inputLabel}>{label}</Text>
            <View style={styles.toggleContainer}>
                <TouchableOpacity
                    style={[styles.toggleBtn, value && styles.toggleBtnActive]}
                    onPress={() => onToggle(true)}
                    activeOpacity={0.7}
                >
                    <Text style={[styles.toggleText, value && styles.toggleTextActive]}>Yes</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.toggleBtn, !value && styles.toggleBtnActive]}
                    onPress={() => onToggle(false)}
                    activeOpacity={0.7}
                >
                    <Text style={[styles.toggleText, !value && styles.toggleTextActive]}>No</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.headerContainer}>
                <LinearGradient
                    colors={['#122f8a', '#0a1a5c']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.headerGradient}
                >
                    <View style={styles.headerContent}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color="#ffffff" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>New Supplier</Text>
                        <View style={styles.headerIcons}>
                            <TouchableOpacity style={styles.iconButton}>
                                <Ionicons name="notifications-outline" size={24} color="#ffffff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </LinearGradient>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    style={styles.content}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Supplier Profile Card */}
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <View style={styles.cardIcon}>
                                <Ionicons name="business" size={20} color="#122f8a" />
                            </View>
                            <Text style={styles.cardTitle}>Profile Information</Text>
                        </View>

                        <View style={styles.uploadContainer}>
                            <TouchableOpacity onPress={handlePickImage} style={styles.uploadButton} activeOpacity={0.7}>
                                {logo ? (
                                    <Image source={{ uri: logo }} style={styles.logoImage} />
                                ) : (
                                    <View style={styles.uploadPlaceholder}>
                                        <View style={styles.cameraIconCircle}>
                                            <Ionicons name="camera" size={24} color="#122f8a" />
                                        </View>
                                        <Text style={styles.uploadText}>Upload Logo</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Supplier Name *</Text>
                            <TextInput
                                style={styles.textInput}
                                value={supplierName}
                                onChangeText={setSupplierName}
                                placeholder="e.g. Acme Corp"
                                placeholderTextColor="#9ca3af"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Category</Text>
                            {renderChipGroup(categories, category, setCategory)}
                        </View>
                    </View>

                    {/* Contact Card */}
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <View style={[styles.cardIcon, { backgroundColor: '#fff7ed' }]}>
                                <Ionicons name="call" size={20} color="#fe9900" />
                            </View>
                            <Text style={styles.cardTitle}>Contact Details</Text>
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                                <Text style={styles.inputLabel}>Phone</Text>
                                <TextInput
                                    style={styles.textInput}
                                    value={phone}
                                    onChangeText={setPhone}
                                    keyboardType="phone-pad"
                                    placeholder="+254..."
                                    placeholderTextColor="#9ca3af"
                                />
                            </View>
                            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                                <Text style={styles.inputLabel}>Email</Text>
                                <TextInput
                                    style={styles.textInput}
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    placeholder="name@email.com"
                                    placeholderTextColor="#9ca3af"
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Address</Text>
                            <TextInput
                                style={styles.textInput}
                                value={address}
                                onChangeText={setAddress}
                                placeholder="Street, City, Building"
                                placeholderTextColor="#9ca3af"
                            />
                        </View>
                    </View>

                    {/* Billing Card */}
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <View style={[styles.cardIcon, { backgroundColor: '#dbeafe' }]}>
                                <Ionicons name="wallet" size={20} color="#2563eb" />
                            </View>
                            <Text style={styles.cardTitle}>Billing & Payment</Text>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Account Number</Text>
                            <TextInput
                                style={styles.textInput}
                                value={accountNumber}
                                onChangeText={setAccountNumber}
                                placeholder="Utility Acc / Ref Number"
                                placeholderTextColor="#9ca3af"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Preferred Method</Text>
                            {renderChipGroup(paymentMethods, preferredPaymentMethod, setPreferredPaymentMethod)}
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Payment Terms</Text>
                            {renderChipGroup(paymentTermsOptions, paymentTerms, setPaymentTerms)}
                        </View>
                    </View>

                    {/* Preferences Card */}
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <View style={[styles.cardIcon, { backgroundColor: '#f3e8ff' }]}>
                                <Ionicons name="options" size={20} color="#9333ea" />
                            </View>
                            <Text style={styles.cardTitle}>Configuration</Text>
                        </View>

                        <View style={styles.switchRow}>
                            <View>
                                <Text style={styles.switchTitle}>Auto-Tag Receipts</Text>
                                <Text style={styles.switchSubtitle}>Automatically categorize uploaded bills</Text>
                            </View>
                            <Switch
                                value={autoTagReceipts}
                                onValueChange={setAutoTagReceipts}
                                trackColor={{ false: '#d1d5db', true: '#122f8a' }}
                                thumbColor="#ffffff"
                            />
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Recurring Bills?</Text>
                            {renderChipGroup(recurringOptions, recurringBills, setRecurringBills)}
                        </View>

                        {recurringBills !== 'No' && (
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Reminder Before Due</Text>
                                <TextInput
                                    style={styles.textInput}
                                    value={reminderBeforeDue}
                                    onChangeText={setReminderBeforeDue}
                                    placeholder="e.g. 3 days"
                                    placeholderTextColor="#9ca3af"
                                />
                            </View>
                        )}
                    </View>

                    {/* Financial Options Card */}
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <View style={[styles.cardIcon, { backgroundColor: '#fee2e2' }]}>
                                <Ionicons name="cash" size={20} color="#dc2626" />
                            </View>
                            <Text style={styles.cardTitle}>Financial Settings</Text>
                        </View>

                        <View style={styles.toggleWrapper}>
                            {renderToggleGroup('Accept Cheques', acceptCheque, setAcceptCheque)}
                            {renderToggleGroup('Track Unpaid', trackUnpaidBills, setTrackUnpaidBills)}
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Notes</Text>
                            <TextInput
                                style={[styles.textInput, styles.textArea]}
                                value={notes}
                                onChangeText={setNotes}
                                multiline
                                numberOfLines={3}
                                placeholder="Additional details..."
                                placeholderTextColor="#9ca3af"
                            />
                        </View>
                    </View>

                    <View style={{ height: 20 }} />
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Footer Button */}
            <View style={styles.footerContainer}>
                <TouchableOpacity
                    style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={loading}
                    activeOpacity={0.8}
                >
                    {loading ? (
                        <ActivityIndicator color="#ffffff" />
                    ) : (
                        <>
                            <Ionicons name="checkmark-circle" size={22} color="#ffffff" style={{ marginRight: 8 }} />
                            <Text style={styles.saveButtonText}>Save Supplier</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    headerContainer: {
        backgroundColor: '#122f8a',
        paddingTop: Platform.OS === 'android' ? 30 : 0,
    },
    headerGradient: {
        paddingHorizontal: 16,
        paddingBottom: 20,
        paddingTop: 10,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#ffffff',
        letterSpacing: 0.5,
    },
    headerIcons: {
        flexDirection: 'row',
        gap: 12,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 100, // Space for footer
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#64748b',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        gap: 12,
    },
    cardIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#eff6ff', // Light blue bg
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1e293b',
    },
    uploadContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    uploadButton: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#f8fafc',
        borderWidth: 2,
        borderColor: '#e2e8f0',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    uploadPlaceholder: {
        alignItems: 'center',
    },
    cameraIconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#eff6ff',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    uploadText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748b',
    },
    logoImage: {
        width: '100%',
        height: '100%',
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#475569',
        marginBottom: 8,
        marginLeft: 2,
    },
    textInput: {
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 15,
        color: '#1e293b',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
        paddingTop: 12,
    },
    row: {
        flexDirection: 'row',
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f1f5f9',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    chipActive: {
        backgroundColor: '#eff6ff',
        borderColor: '#122f8a',
    },
    chipText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#64748b',
    },
    chipTextActive: {
        color: '#122f8a',
        fontWeight: '700',
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    switchTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1e293b',
    },
    switchSubtitle: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
    },
    divider: {
        height: 1,
        backgroundColor: '#f1f5f9',
        marginVertical: 16,
    },
    toggleWrapper: {
        gap: 16,
        marginBottom: 16,
    },
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#f1f5f9',
        borderRadius: 8,
        padding: 4,
    },
    toggleBtn: {
        paddingVertical: 6,
        paddingHorizontal: 16,
        borderRadius: 6,
    },
    toggleBtnActive: {
        backgroundColor: '#ffffff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    toggleText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#64748b',
    },
    toggleTextActive: {
        color: '#fe9900',
        fontWeight: '700',
    },
    footerContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#ffffff',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 10,
    },
    saveButton: {
        backgroundColor: '#122f8a',
        borderRadius: 14,
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#122f8a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    saveButtonDisabled: {
        opacity: 0.7,
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#ffffff',
    },
});
