import React, { useState, useEffect } from 'react';
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
    Switch,
    Image,
    Platform,
    KeyboardAvoidingView,
    Modal,
    FlatList
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import apiService from '@/services/api';

// Brand Colors
const COLORS = {
    primary: '#122f8a',
    secondary: '#fe9900',
    white: '#ffffff',
    background: '#f8fafc',
    card: '#ffffff',
    text: '#0f172a',
    textLight: '#64748b',
    border: '#cbd5e1',
    success: '#10b981',
    error: '#ef4444',
    blue50: '#eff6ff',
    gray100: '#f1f5f9',
};

// ============================================
// MASTER ASSET LOGIC (THE BRAIN)
// ============================================
const ASSET_LOGIC_CONFIG: any = {
    // TYPE A: VEHICLES (1510, 1511)
    "1510": { label: "Number Plate", showSerial: true, showWarranty: true, depreciation: "YES", contraAccount: "1710" },
    "1511": { label: "Number Plate", showSerial: true, showWarranty: true, depreciation: "YES", contraAccount: "1710" },

    // TYPE B: LAND & REAL ESTATE (1520, 1523)
    "1520": { label: "Title Deed / LR No", showSerial: true, showWarranty: false, depreciation: "NO", contraAccount: null },
    "1523": { label: "Project Name", showSerial: false, showWarranty: false, depreciation: "NO", contraAccount: null }, // WIP

    // TYPE C: BUILDINGS (1521, 1522)
    "1521": { label: "Title Deed / LR No", showSerial: true, showWarranty: false, depreciation: "YES", contraAccount: "1721" },
    "1522": { label: "Title Deed / LR No", showSerial: true, showWarranty: false, depreciation: "YES", contraAccount: "1721" },

    // TYPE D: ELECTRONICS & FURNITURE (1530-1560)
    "1530": { label: "Tag / ID Number", showSerial: true, showWarranty: true, depreciation: "YES", contraAccount: "1730" },
    "1540": { label: "Serial Number", showSerial: true, showWarranty: true, depreciation: "YES", contraAccount: "1740" },
    "1550": { label: "IMEI / Serial", showSerial: true, showWarranty: true, depreciation: "YES", contraAccount: "1740" },
    "1560": { label: "Serial Number", showSerial: true, showWarranty: true, depreciation: "YES", contraAccount: "1740" },

    // TYPE E: INVESTMENTS & CRYPTO (1610 - 1699)
    "1610": { label: "Member Number", showQty: true, showSerial: true, depreciation: "MARKET", contraAccount: null },
    "1620": { label: "Policy / Account No", showQty: false, showSerial: true, depreciation: "MARKET", contraAccount: null },
    "1640": { label: "CDSC Account No", showQty: true, showSerial: true, depreciation: "MARKET", contraAccount: null },
    "1660": { label: "Wallet Address", showQty: true, showSerial: true, depreciation: "MARKET", contraAccount: null }, // Crypto
    "1699": { label: "Identifier", showQty: false, showSerial: true, depreciation: "NO", contraAccount: null }
};

// Selection Modal Component for "Dropdown" behavior
const SelectionModal = ({ visible, title, items, onClose, onSelect, selectedId }: any) => (
    <Modal visible={visible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{title}</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeModalBtn}>
                        <Ionicons name="close" size={24} color={COLORS.text} />
                    </TouchableOpacity>
                </View>
                <FlatList
                    data={items}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[
                                styles.modalItem,
                                selectedId === item.id && styles.modalItemActive
                            ]}
                            onPress={() => {
                                onSelect(item);
                                onClose();
                            }}
                        >
                            <View style={[styles.radioCircle, selectedId === item.id && styles.radioCircleActive]}>
                                {selectedId === item.id && <View style={styles.radioDot} />}
                            </View>
                            <View style={styles.modalItemTextContainer}>
                                <Text style={[styles.modalItemTitle, selectedId === item.id && styles.textPrimary]}>
                                    {item.name}
                                </Text>
                                {item.code && <Text style={styles.modalItemSubtitle}>Code: {item.code}</Text>}
                            </View>
                        </TouchableOpacity>
                    )}
                    contentContainerStyle={{ paddingBottom: 20 }}
                />
            </View>
        </View>
    </Modal>
);

export default function AddAssetScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Data Sources
    const [assetAccounts, setAssetAccounts] = useState<any[]>([]); // 15xx accounts
    const [paymentAccounts, setPaymentAccounts] = useState<any[]>([]); // Cash/Bank
    const [liabilityAccounts, setLiabilityAccounts] = useState<any[]>([]); // Loans
    const [members, setMembers] = useState<any[]>([]);

    // Form State
    // Zone 1: Identity
    const [name, setName] = useState('');
    const [assetAccount, setAssetAccount] = useState<any>(null); // Selected Category Object
    const [serialNumber, setSerialNumber] = useState('');
    const [familyOwner, setFamilyOwner] = useState<any>(null); // Selected Owner Object

    // Zone 1.5: Quantity Details (For Investments)
    const [quantity, setQuantity] = useState('1');
    const [unitCost, setUnitCost] = useState('');

    // Zone 2: Financials
    const [purchaseDate, setPurchaseDate] = useState(new Date());
    const [purchasePrice, setPurchasePrice] = useState('');
    const [vendor, setVendor] = useState('');
    const [paymentMode, setPaymentMode] = useState<'CASH' | 'LOAN' | 'SPLIT'>('CASH');

    const [paidFromAccount, setPaidFromAccount] = useState<any>(null);
    const [financeAccount, setFinanceAccount] = useState<any>(null);

    const [cashPortion, setCashPortion] = useState('');
    const [financePortion, setFinancePortion] = useState('');

    // Zone 3: Lifecycle
    const [trackWarranty, setTrackWarranty] = useState(false);
    const [warrantyExpiry, setWarrantyExpiry] = useState(new Date());
    const [isDepreciating, setIsDepreciating] = useState(true);
    const [lifespanYears, setLifespanYears] = useState('5');
    const [salvageValue, setSalvageValue] = useState('');

    // Config Derived State
    const getConfig = (code: string) => {
        if (!code) return {};
        // 1. Exact Match
        if (ASSET_LOGIC_CONFIG[code]) return ASSET_LOGIC_CONFIG[code];

        // 2. Prefix Match (longest match first)
        const keys = Object.keys(ASSET_LOGIC_CONFIG).sort((a, b) => b.length - a.length);
        const match = keys.find(key => code.startsWith(key));

        // 3. Smart Default Fallbacks if no direct match found
        if (!match) {
            if (code.startsWith('151')) return ASSET_LOGIC_CONFIG['1510']; // Vehicles defaults
            if (code.startsWith('152')) return ASSET_LOGIC_CONFIG['1520']; // Land defaults
            if (code.startsWith('15')) return ASSET_LOGIC_CONFIG['1530']; // Other assets default to Furniture logic (Depreciates)
            if (code.startsWith('16')) return ASSET_LOGIC_CONFIG['1610']; // Investments defaults
        }

        return match ? ASSET_LOGIC_CONFIG[match] : {};
    };

    const currentConfig = assetAccount ? getConfig(assetAccount.code) : {};

    // Auto-Calculate Totals if Quantity changes
    useEffect(() => {
        if (currentConfig.showQty && quantity && unitCost) {
            const total = parseFloat(quantity) * parseFloat(unitCost);
            if (!isNaN(total)) setPurchasePrice(total.toString());
        }
    }, [quantity, unitCost]);

    // Zone 4: The Vault
    const [photoUrl, setPhotoUrl] = useState<string | null>(null);

    // UI Modals toggles
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [datePickerMode, setDatePickerMode] = useState<'purchase' | 'warranty'>('purchase');

    // Dropdown States
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showOwnerModal, setShowOwnerModal] = useState(false);
    const [showPaymentAccountModal, setShowPaymentAccountModal] = useState(false);
    const [showLiabilityAccountModal, setShowLiabilityAccountModal] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [assetAccs, allAccs, dashboard] = await Promise.all([
                apiService.getFixedAssetAccounts(), // returns [] of { id, name, code ... }
                apiService.getAccounts(),
                apiService.getDashboard(),
            ]);

            setAssetAccounts(assetAccs);

            // Filter payment accounts (Cash/Bank)
            const payAccs = allAccs.filter((a: any) =>
                ['ASSET'].includes(a.type) &&
                (a.subtype === 'cash' || a.subtype === 'bank' || a.subtype === 'mobile_money')
            );
            setPaymentAccounts(payAccs);

            // Filter liability accounts (Loans)
            const liabAccs = allAccs.filter((a: any) =>
                ['LIABILITY'].includes(a.type)
            );
            setLiabilityAccounts(liabAccs);

            if (dashboard?.familyMembers) {
                setMembers(dashboard.familyMembers);
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to load accounts');
        } finally {
            setLoading(false);
        }
    };

    const handleDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            if (datePickerMode === 'purchase') {
                setPurchaseDate(selectedDate);
            } else {
                setWarrantyExpiry(selectedDate);
            }
        }
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
        });

        if (!result.canceled) {
            setPhotoUrl(result.assets[0].uri);
        }
    };

    const validate = () => {
        if (!name) return 'Asset Name is required';
        if (!assetAccount) return 'Category is required';
        if (!purchasePrice) return 'Price is required';
        if ((paymentMode === 'CASH' || paymentMode === 'SPLIT') && !paidFromAccount) return 'Payment Account is required';
        if ((paymentMode === 'LOAN' || paymentMode === 'SPLIT') && !financeAccount) return 'Loan Account is required';
        return null;
    };

    const save = async () => {
        const error = validate();
        if (error) {
            Alert.alert('Missing Fields', error);
            return;
        }

        try {
            setSubmitting(true);
            const data = {
                name,
                category: assetAccount?.name || 'Asset',
                assetAccountId: assetAccount?.id,
                serialNumber,
                familyOwnerId: familyOwner?.id,
                purchaseDate: purchaseDate.toISOString(),
                purchasePrice: parseFloat(purchasePrice),
                quantity: currentConfig.showQty ? parseFloat(quantity) : 1,
                unitCost: currentConfig.showQty ? parseFloat(unitCost) : parseFloat(purchasePrice),
                paidFromAccountId: paymentMode === 'CASH' || paymentMode === 'SPLIT' ? paidFromAccount?.id : null,
                financeAccountId: paymentMode === 'LOAN' || paymentMode === 'SPLIT' ? financeAccount?.id : null,
                cashPortion: paymentMode === 'SPLIT' ? parseFloat(cashPortion) : (paymentMode === 'CASH' ? parseFloat(purchasePrice) : 0),
                financePortion: paymentMode === 'SPLIT' ? parseFloat(financePortion) : (paymentMode === 'LOAN' ? parseFloat(purchasePrice) : 0),
                vendor,
                trackWarranty,
                warrantyExpiry: trackWarranty ? warrantyExpiry.toISOString() : null,
                isDepreciating: currentConfig.depreciation === 'YES' ? isDepreciating : false,
                lifespanYears: isDepreciating ? parseInt(lifespanYears) : null,
                salvageValue: salvageValue ? parseFloat(salvageValue) : 0,
                photoUrl,
            };

            await apiService.createFixedAsset(data);

            Alert.alert('Success', 'Asset Added Successfully 💎', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to save asset');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Hide Default Header */}
            <Stack.Screen options={{ headerShown: false }} />

            {/* Custom Premium Header */}
            <LinearGradient colors={[COLORS.primary, '#0a1f5c']} style={styles.header}>
                <SafeAreaView>
                    <View style={styles.headerContent}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Add Asset / Wealth</Text>
                        <View style={{ width: 40 }} />
                    </View>
                </SafeAreaView>
            </LinearGradient>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.keyboardAvoid}
            >
                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* ASSET PROFILE HEADER - Image & Name */}
                    <View style={styles.profileHeader}>
                        <TouchableOpacity style={styles.imageUpload} onPress={pickImage}>
                            {photoUrl ? (
                                <Image source={{ uri: photoUrl }} style={styles.imagePreview} />
                            ) : (
                                <View style={styles.imagePlaceholder}>
                                    <Ionicons name="camera" size={32} color={COLORS.textLight} />
                                    <Text style={styles.imageText}>Add Photo</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                        <View style={styles.profileInputs}>
                            <Text style={styles.label}>ASSET NAME</Text>
                            <TextInput
                                style={styles.profileNameInput}
                                placeholder="e.g. Toyota Vitz"
                                value={name}
                                onChangeText={setName}
                                placeholderTextColor={COLORS.textLight}
                            />

                            <Text style={[styles.label, { marginTop: 10 }]}>Category (Type)</Text>
                            <TouchableOpacity style={styles.dropdown} onPress={() => setShowCategoryModal(true)}>
                                <Text style={assetAccount ? styles.dropdownText : styles.dropdownPlaceholder}>
                                    {assetAccount ? `${assetAccount.name}` : 'Select Category...'}
                                </Text>
                                <Ionicons name="chevron-down" size={20} color={COLORS.textLight} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* SECTIONS */}

                    {/* 1. IDENTITY DETAILS */}
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="finger-print-outline" size={20} color={COLORS.primary} />
                            <Text style={styles.cardTitle}>Identity & Ownership</Text>
                        </View>

                        <View style={styles.row}>
                            <View style={styles.flex1}>
                                <Text style={styles.label}>{currentConfig.label || 'SERIAL / VIN'}</Text>
                                {((!assetAccount) || (currentConfig.showSerial !== false)) ? (
                                    <TextInput
                                        style={styles.input}
                                        placeholder={currentConfig.label ? `Enter ${currentConfig.label}` : "ID Number"}
                                        value={serialNumber}
                                        onChangeText={setSerialNumber}
                                        placeholderTextColor={COLORS.textLight}
                                    />
                                ) : (
                                    <View style={[styles.input, { backgroundColor: '#e2e8f0', justifyContent: 'center' }]}>
                                        <Text style={{ color: COLORS.textLight, fontSize: 13 }}>Not Applicable</Text>
                                    </View>
                                )}
                            </View>
                            <View style={[styles.flex1, { marginLeft: 12 }]}>
                                <Text style={styles.label}>OWNER</Text>
                                <TouchableOpacity style={styles.input} onPress={() => setShowOwnerModal(true)}>
                                    <Text style={familyOwner ? styles.text : styles.placeholder}>
                                        {familyOwner ? familyOwner.name : 'Select Owner'}
                                    </Text>
                                    <Ionicons name="caret-down" size={14} color={COLORS.textLight} style={{ position: 'absolute', right: 10, top: 12 }} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* 2. FINANCIALS */}
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="wallet-outline" size={20} color={COLORS.primary} />
                            <Text style={styles.cardTitle}>Financial Details</Text>
                        </View>

                        {/* Quantity Logic for Investments */}
                        {currentConfig.showQty && (
                            <View style={[styles.row, { marginBottom: 15 }]}>
                                <View style={styles.flex1}>
                                    <Text style={styles.label}>QUANTITY / UNITS</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="0"
                                        keyboardType="numeric"
                                        value={quantity}
                                        onChangeText={setQuantity}
                                    />
                                </View>
                                <View style={[styles.flex1, { marginLeft: 10 }]}>
                                    <Text style={styles.label}>COST PER UNIT</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="0"
                                        keyboardType="numeric"
                                        value={unitCost}
                                        onChangeText={setUnitCost}
                                    />
                                </View>
                            </View>
                        )}

                        {/* Purchase Info */}
                        <View style={styles.row}>
                            <View style={styles.flex1}>
                                <Text style={styles.label}>DATE BOUGHT</Text>
                                <TouchableOpacity
                                    style={styles.input}
                                    onPress={() => { setDatePickerMode('purchase'); setShowDatePicker(true); }}
                                >
                                    <Text style={styles.text}>{purchaseDate.toLocaleDateString()}</Text>
                                    <Ionicons name="calendar-outline" size={16} color={COLORS.textLight} style={{ position: 'absolute', right: 10, top: 12 }} />
                                </TouchableOpacity>
                            </View>
                            <View style={[styles.flex1, { marginLeft: 12 }]}>
                                <Text style={styles.label}>TOTAL VALUE (KES)</Text>
                                <TextInput
                                    style={[styles.input, currentConfig.showQty && { backgroundColor: '#f1f5f9' }]} // Readonly look if auto-calc
                                    placeholder="e.g. 850,000"
                                    keyboardType="numeric"
                                    value={purchasePrice}
                                    onChangeText={setPurchasePrice}
                                    placeholderTextColor={COLORS.textLight}
                                    editable={!currentConfig.showQty}
                                />
                            </View>
                        </View>

                        <Text style={[styles.label, { marginTop: 15 }]}>SUPPLIER / VENDOR</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Toyotsu Cars or NSE"
                            value={vendor}
                            onChangeText={setVendor}
                        />

                        {/* Payment Mode */}
                        <Text style={[styles.label, { marginTop: 20 }]}>PAYMENT METHOD</Text>
                        <View style={styles.segmentControl}>
                            <TouchableOpacity style={[styles.segment, paymentMode === 'CASH' && styles.segmentActive]} onPress={() => setPaymentMode('CASH')}>
                                <Text style={[styles.segmentText, paymentMode === 'CASH' && styles.segmentTextActive]}>Cash</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.segment, paymentMode === 'LOAN' && styles.segmentActive]} onPress={() => setPaymentMode('LOAN')}>
                                <Text style={[styles.segmentText, paymentMode === 'LOAN' && styles.segmentTextActive]}>Loan / Credit</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.segment, paymentMode === 'SPLIT' && styles.segmentActive]} onPress={() => setPaymentMode('SPLIT')}>
                                <Text style={[styles.segmentText, paymentMode === 'SPLIT' && styles.segmentTextActive]}>Split</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Dynamic Payment Fields */}
                        <View style={styles.paymentDetails}>
                            {(paymentMode === 'CASH' || paymentMode === 'SPLIT') && (
                                <View style={{ marginTop: 10 }}>
                                    <Text style={styles.label}>PAID FROM (Wallet/Bank)</Text>
                                    <TouchableOpacity style={styles.dropdown} onPress={() => setShowPaymentAccountModal(true)}>
                                        <Text style={paidFromAccount ? styles.dropdownText : styles.dropdownPlaceholder}>
                                            {paidFromAccount ? paidFromAccount.name : 'Select Payment Account'}
                                        </Text>
                                        <Ionicons name="chevron-down" size={20} color={COLORS.textLight} />
                                    </TouchableOpacity>
                                    {paymentMode === 'SPLIT' && (
                                        <TextInput
                                            style={[styles.input, { marginTop: 8 }]}
                                            placeholder="Cash Amount"
                                            keyboardType="numeric"
                                            value={cashPortion}
                                            onChangeText={setCashPortion}
                                        />
                                    )}
                                </View>
                            )}

                            {(paymentMode === 'LOAN' || paymentMode === 'SPLIT') && (
                                <View style={{ marginTop: 10 }}>
                                    <Text style={styles.label}>FINANCED BY (Liability)</Text>
                                    <TouchableOpacity style={styles.dropdown} onPress={() => setShowLiabilityAccountModal(true)}>
                                        <Text style={financeAccount ? styles.dropdownText : styles.dropdownPlaceholder}>
                                            {financeAccount ? financeAccount.name : 'Select Loan Account'}
                                        </Text>
                                        <Ionicons name="chevron-down" size={20} color={COLORS.textLight} />
                                    </TouchableOpacity>
                                    {paymentMode === 'SPLIT' && (
                                        <TextInput
                                            style={[styles.input, { marginTop: 8 }]}
                                            placeholder="Loan Amount"
                                            keyboardType="numeric"
                                            value={financePortion}
                                            onChangeText={setFinancePortion}
                                        />
                                    )}
                                </View>
                            )}
                        </View>
                    </View>

                    {/* 3. LIFECYCLE - DYNAMIC */}
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="time-outline" size={20} color={COLORS.primary} />
                            <Text style={styles.cardTitle}>Asset Lifecycle</Text>
                        </View>

                        {/* Warranty Logic */}
                        {((!assetAccount) || (currentConfig.showWarranty !== false)) && (
                            <View>
                                <View style={styles.rowCenter}>
                                    <Text style={styles.switchLabel}>Track Warranty?</Text>
                                    <Switch value={trackWarranty} onValueChange={setTrackWarranty} trackColor={{ false: COLORS.border, true: COLORS.success }} />
                                </View>
                                {trackWarranty && (
                                    <TouchableOpacity
                                        style={[styles.input, { marginBottom: 15 }]}
                                        onPress={() => { setDatePickerMode('warranty'); setShowDatePicker(true); }}
                                    >
                                        <Text style={styles.text}>{warrantyExpiry.toLocaleDateString()}</Text>
                                        <Text style={styles.labelAbsolute}>EXPIRY DATE</Text>
                                    </TouchableOpacity>
                                )}
                                <View style={styles.divider} />
                            </View>
                        )}

                        {/* Depreciation Logic */}
                        {currentConfig.depreciation === 'MARKET' ? (
                            <View style={{ paddingVertical: 10 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Ionicons name="trending-up" size={24} color={COLORS.success} />
                                    <Text style={[styles.switchLabel, { marginLeft: 10 }]}>Market Value Asset</Text>
                                </View>
                                <Text style={{ fontSize: 13, color: COLORS.textLight, marginTop: 5 }}>
                                    This asset does not depreciate. Its value fluctuates with the market (e.g. Stocks, Crypto, Gold).
                                    You will update the "Current Market Price" manually.
                                </Text>
                            </View>
                        ) : currentConfig.depreciation === 'NO' ? (
                            <View style={{ paddingVertical: 10 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Ionicons name="lock-closed" size={24} color={COLORS.textLight} />
                                    <Text style={[styles.switchLabel, { marginLeft: 10 }]}>Non-Depreciating Asset</Text>
                                </View>
                                <Text style={{ fontSize: 13, color: COLORS.textLight, marginTop: 5 }}>
                                    This asset maintains its value or appreciates (e.g. Land). No depreciation schedule needed.
                                </Text>
                            </View>
                        ) : (
                            <View>
                                <View style={styles.rowCenter}>
                                    <Text style={styles.switchLabel}>Track Depreciation?</Text>
                                    <Switch value={isDepreciating} onValueChange={setIsDepreciating} trackColor={{ false: COLORS.border, true: COLORS.success }} />
                                </View>
                                {isDepreciating && (
                                    <View style={styles.row}>
                                        <View style={styles.flex1}>
                                            <Text style={styles.label}>Est. Lifespan (Years)</Text>
                                            <TextInput style={styles.input} value={lifespanYears} onChangeText={setLifespanYears} keyboardType="numeric" />
                                        </View>
                                        <View style={[styles.flex1, { marginLeft: 10 }]}>
                                            <Text style={styles.label}>Salvage Value</Text>
                                            <TextInput style={styles.input} value={salvageValue} onChangeText={setSalvageValue} keyboardType="numeric" placeholder="0" />
                                        </View>
                                    </View>
                                )}
                            </View>
                        )}
                    </View>

                    {/* 4. THE VAULT (Docs) */}
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="file-tray-full-outline" size={20} color={COLORS.primary} />
                            <Text style={styles.cardTitle}>The Vault (Docs)</Text>
                        </View>
                        <TouchableOpacity style={styles.uploadBox} onPress={() => Alert.alert('Coming Soon', 'Document Vault will be available in next update.')}>
                            <Ionicons name="cloud-upload-outline" size={32} color={COLORS.primary} />
                            <Text style={styles.uploadText}>Upload Logbook, Receipts, Warranty Cards</Text>
                        </TouchableOpacity>
                    </View>

                    {/* SAVE BUTTON */}
                    <TouchableOpacity style={styles.saveBtn} onPress={save} disabled={submitting}>
                        {submitting ? (
                            <ActivityIndicator color={COLORS.white} />
                        ) : (
                            <Text style={styles.saveBtnText}>Save to Wealth Portfolio</Text>
                        )}
                    </TouchableOpacity>

                    <View style={{ height: 40 }} />
                </ScrollView>
            </KeyboardAvoidingView>

            {/* SELECTION MODALS */}
            <SelectionModal
                visible={showCategoryModal}
                title="Select Category"
                items={assetAccounts}
                onClose={() => setShowCategoryModal(false)}
                selectedId={assetAccount?.id}
                onSelect={setAssetAccount}
            />
            <SelectionModal
                visible={showOwnerModal}
                title="Select Family Owner"
                items={members}
                onClose={() => setShowOwnerModal(false)}
                selectedId={familyOwner?.id}
                onSelect={setFamilyOwner}
            />
            <SelectionModal
                visible={showPaymentAccountModal}
                title="Select Payment Account"
                items={paymentAccounts}
                onClose={() => setShowPaymentAccountModal(false)}
                selectedId={paidFromAccount?.id}
                onSelect={setPaidFromAccount}
            />
            <SelectionModal
                visible={showLiabilityAccountModal}
                title="Select Financing Account"
                items={liabilityAccounts}
                onClose={() => setShowLiabilityAccountModal(false)}
                selectedId={financeAccount?.id}
                onSelect={setFinanceAccount}
            />

            {/* DATE PICKER */}
            {showDatePicker && (
                <DateTimePicker
                    value={datePickerMode === 'purchase' ? purchaseDate : warrantyExpiry}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    loading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        paddingTop: Platform.OS === 'android' ? 40 : 10,
        paddingBottom: 20,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.white,
    },
    backBtn: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 12,
    },
    keyboardAvoid: {
        flex: 1,
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },

    // Profile Header Styles
    profileHeader: {
        flexDirection: 'row',
        marginBottom: 25,
        alignItems: 'center',
    },
    imageUpload: {
        width: 100,
        height: 100,
        borderRadius: 16,
        backgroundColor: COLORS.card,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    imagePreview: {
        width: '100%',
        height: '100%',
        borderRadius: 16,
    },
    imagePlaceholder: {
        alignItems: 'center',
    },
    imageText: {
        fontSize: 10,
        color: COLORS.textLight,
        fontWeight: '600',
        marginTop: 4,
    },
    profileInputs: {
        flex: 1,
        marginLeft: 20,
    },
    profileNameInput: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.text,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        paddingVertical: 8,
    },

    // Card Styles
    card: {
        backgroundColor: COLORS.card,
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray100,
        paddingBottom: 10,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.text,
        marginLeft: 10,
    },

    // Input Styles
    label: {
        fontSize: 11,
        fontWeight: '700',
        color: COLORS.textLight,
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    labelAbsolute: {
        fontSize: 9,
        fontWeight: '700',
        color: COLORS.textLight,
        position: 'absolute',
        top: 4,
        left: 12,
    },
    input: {
        backgroundColor: COLORS.gray100,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: 15,
        color: COLORS.text,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    text: {
        fontSize: 15,
        color: COLORS.text,
    },
    placeholder: {
        fontSize: 15,
        color: COLORS.textLight,
    },
    dropdown: {
        backgroundColor: COLORS.gray100,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dropdownText: {
        fontSize: 15,
        color: COLORS.text,
    },
    dropdownPlaceholder: {
        fontSize: 15,
        color: COLORS.textLight,
    },

    // Layout
    row: {
        flexDirection: 'row',
    },
    rowCenter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginVertical: 10,
    },
    flex1: {
        flex: 1,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.gray100,
        marginVertical: 10,
    },

    // Segment Control
    segmentControl: {
        flexDirection: 'row',
        backgroundColor: COLORS.gray100,
        borderRadius: 10,
        padding: 4,
        marginTop: 5,
    },
    segment: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8,
    },
    segmentActive: {
        backgroundColor: COLORS.white,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    segmentText: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.textLight,
    },
    segmentTextActive: {
        color: COLORS.text,
        fontWeight: '700',
    },
    paymentDetails: {
        marginTop: 10,
    },

    // Switches & Toggles
    switchLabel: {
        fontSize: 15,
        fontWeight: '500',
        color: COLORS.text,
    },

    // Upload Vault
    uploadBox: {
        borderWidth: 2,
        borderColor: COLORS.gray100,
        borderStyle: 'dashed',
        borderRadius: 12,
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.gray100,
    },
    uploadText: {
        marginTop: 10,
        fontSize: 13,
        color: COLORS.textLight,
        textAlign: 'center',
        paddingHorizontal: 20,
    },

    // Save Button
    saveBtn: {
        backgroundColor: COLORS.primary,
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    saveBtnText: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: '700',
    },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        height: '70%',
        padding: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray100,
        paddingBottom: 15,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
    },
    closeModalBtn: {
        padding: 5,
    },
    modalItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray100,
    },
    modalItemActive: {
        backgroundColor: COLORS.blue50,
    },
    radioCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: COLORS.border,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    radioCircleActive: {
        borderColor: COLORS.primary,
    },
    radioDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: COLORS.primary,
    },
    modalItemTextContainer: {
        flex: 1,
    },
    modalItemTitle: {
        fontSize: 16,
        color: COLORS.text,
    },
    textPrimary: {
        color: COLORS.primary,
        fontWeight: '600',
    },
    modalItemSubtitle: {
        fontSize: 13,
        color: COLORS.textLight,
        marginTop: 2,
    },
});
