import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    TextInput,
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
import { Picker } from '@react-native-picker/picker'; // Standard picker

export default function DepositChequeScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Form State
    const [depositor, setDepositor] = useState('');
    const [chequeNumber, setChequeNumber] = useState('');
    const [amount, setAmount] = useState('');
    const [bankAccount, setBankAccount] = useState('');
    const [imageUri, setImageUri] = useState<string | null>(null);

    // Dates
    const [depositDate, setDepositDate] = useState(new Date());

    // Auto-calculate Clear Date (e.g., +3 days)
    const clearDate = useMemo(() => {
        const date = new Date(depositDate);
        date.setDate(date.getDate() + 3);
        return date;
    }, [depositDate]);

    // Mock Data
    const members = [
        { label: 'Select Member', value: '' },
        { label: 'John Doe (Admin)', value: 'john' },
        { label: 'Jane Smith (Treasurer)', value: 'jane' },
        { label: 'Robert Brown', value: 'robert' },
    ];

    const bankAccounts = [
        { label: 'Choose Account', value: '' },
        { label: 'Equity Bank - 123456789', value: 'equity_main' },
        { label: 'KCB Bank - 987654321', value: 'kcb_savings' },
        { label: 'Co-op Bank - 456123789', value: 'coop_biz' },
    ];

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const handlePickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.5,
        });

        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
        }
    };

    const handleDeposit = async () => {
        if (!depositor || !chequeNumber || !amount || !bankAccount) {
            Alert.alert('Missing Fields', 'Please fill in all required fields.');
            return;
        }

        setLoading(true);
        // Simulate API call
        setTimeout(() => {
            setLoading(false);
            Alert.alert('Success', 'Cheque deposited successfully!', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        }, 1500);
    };

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
                        <Text style={styles.headerTitle}>Deposit Cheque</Text>
                        <View style={{ width: 40 }} />
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
                    {/* Main Form Card */}
                    <View style={styles.card}>

                        {/* Title inside card as per image design hint */}
                        <Text style={styles.formTitle}>Deposit Details</Text>
                        <View style={styles.divider} />

                        {/* Depositor */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Depositor:</Text>
                            <View style={styles.pickerWrapper}>
                                <Picker
                                    selectedValue={depositor}
                                    onValueChange={(itemValue) => setDepositor(itemValue)}
                                    style={styles.picker}
                                >
                                    {members.map((m) => (
                                        <Picker.Item key={m.value} label={m.label} value={m.value} style={{ fontSize: 14 }} color="#1f2937" />
                                    ))}
                                </Picker>
                            </View>
                        </View>

                        {/* Cheque Number */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Cheque Number:</Text>
                            <TextInput
                                style={styles.textInput}
                                value={chequeNumber}
                                onChangeText={setChequeNumber}
                                placeholder="e.g. 000123"
                                keyboardType="numeric"
                                placeholderTextColor="#9ca3af"
                            />
                        </View>

                        {/* Amount */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Amount:</Text>
                            <TextInput
                                style={styles.textInput}
                                value={amount}
                                onChangeText={setAmount}
                                placeholder="KES 0.00"
                                keyboardType="numeric"
                                placeholderTextColor="#9ca3af"
                            />
                        </View>

                        {/* Bank Account */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Bank Account:</Text>
                            <View style={styles.pickerWrapper}>
                                <Picker
                                    selectedValue={bankAccount}
                                    onValueChange={(itemValue) => setBankAccount(itemValue)}
                                    style={styles.picker}
                                >
                                    {bankAccounts.map((b) => (
                                        <Picker.Item key={b.value} label={b.label} value={b.value} style={{ fontSize: 14 }} color="#1f2937" />
                                    ))}
                                </Picker>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        {/* Deposit Date */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Deposit Date:</Text>
                            <View style={styles.dateDisplay}>
                                <Text style={styles.dateText}>{formatDate(depositDate)}</Text>
                                <Ionicons name="calendar-outline" size={18} color="#122f8a" />
                            </View>
                        </View>

                        {/* Expected Clear Date */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Expected Clear Date:</Text>
                            <View style={styles.autoDateDisplay}>
                                <Text style={styles.autoLabel}>Auto</Text>
                                <Ionicons name="arrow-forward" size={14} color="#fe9900" style={{ marginHorizontal: 6 }} />
                                <Text style={styles.autoDateText}>{formatDate(clearDate)}</Text>
                            </View>
                        </View>

                        {/* Attach Photo */}
                        <View style={[styles.inputContainer, { alignItems: 'flex-start', marginTop: 10 }]}>
                            <Text style={[styles.label, { marginTop: 12 }]}>Attach Photo:</Text>
                            <View style={{ flex: 1 }}>
                                <TouchableOpacity
                                    style={styles.uploadButton}
                                    onPress={handlePickImage}
                                >
                                    <Ionicons name="camera" size={20} color="#ffffff" />
                                    <Text style={styles.uploadButtonText}>
                                        {imageUri ? 'Photo Attached' : 'Upload'}
                                    </Text>
                                </TouchableOpacity>
                                {imageUri && (
                                    <Image source={{ uri: imageUri }} style={styles.previewImage} />
                                )}
                            </View>
                        </View>

                    </View>

                    {/* Actions */}
                    <View style={styles.actionsContainer}>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.depositButton]}
                            onPress={handleDeposit}
                            disabled={loading}
                        >
                            {loading ? <ActivityIndicator color="#fff" /> : (
                                <Text style={styles.depositButtonText}>Deposit</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionButton, styles.cancelButton]}
                            onPress={() => router.back()}
                            disabled={loading}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={{ height: 40 }} />
                </ScrollView>
            </KeyboardAvoidingView>
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
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 20,
        shadowColor: '#64748b',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    formTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 8,
    },
    divider: {
        height: 1,
        backgroundColor: '#e2e8f0',
        marginBottom: 20,
        marginTop: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    label: {
        width: 130, // Fixed width for alignment like in the image
        fontSize: 14,
        fontWeight: '600',
        color: '#64748b',
    },
    textInput: {
        flex: 1,
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 15,
        color: '#1e293b',
    },
    pickerWrapper: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderRadius: 8,
        backgroundColor: '#f8fafc',
        overflow: 'hidden',
        height: 50, // Fixed height for consistent look
        justifyContent: 'center',
    },
    picker: {
        width: '100%',
        color: '#1e293b',
    },
    dateDisplay: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
    },
    dateText: {
        fontSize: 15,
        color: '#1e293b',
        fontWeight: '500',
    },
    autoDateDisplay: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff7ed', // Light orange bg for auto
        borderWidth: 1,
        borderColor: '#fdba74',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
    },
    autoLabel: {
        fontSize: 12,
        color: '#9a3412',
        fontWeight: '700',
    },
    autoDateText: {
        fontSize: 15,
        color: '#1e293b',
        fontWeight: '600',
    },
    uploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1e293b', // Dark button for contrast or image placeholder
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    uploadButtonText: {
        color: '#ffffff',
        fontWeight: '600',
        marginLeft: 8,
        fontSize: 14,
    },
    previewImage: {
        width: 120,
        height: 80,
        borderRadius: 8,
        marginTop: 12,
        backgroundColor: '#f1f5f9',
    },
    actionsContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-start', // Left aligned to match image somewhat, or centered? Image shows them separate.
        gap: 20, // Space between buttons
        marginTop: 30,
        paddingHorizontal: 10,
    },
    actionButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 100,
    },
    depositButton: {
        backgroundColor: '#122f8a', // Brand Blue
        shadowColor: '#122f8a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    depositButtonText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    cancelButton: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#cbd5e1',
    },
    cancelButtonText: {
        color: '#64748b',
        fontWeight: '600',
        fontSize: 16,
    }
});
