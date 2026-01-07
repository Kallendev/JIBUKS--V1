import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Dimensions, Animated, LayoutAnimation, Platform, UIManager } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { showAlert } from '@/utils/alert';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

const { width } = Dimensions.get('window');

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

export default function FinancialSetupScreen() {
    const router = useRouter();
    const [currency, setCurrency] = useState('🇰🇪 KES - Kenyan Shilling');
    const [yearStart, setYearStart] = useState('January');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Animation refs
    const dropdownHeight = useRef(new Animated.Value(0)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;

    const toggleDropdown = () => {
        const toValue = isDropdownOpen ? 0 : 1;

        setIsDropdownOpen(!isDropdownOpen);

        // Smooth height and rotation animation
        Animated.parallel([
            Animated.timing(dropdownHeight, {
                toValue: toValue * 300, // Approximate height for the list
                duration: 500,
                useNativeDriver: false,
            }),
            Animated.timing(rotateAnim, {
                toValue: toValue,
                duration: 500,
                useNativeDriver: true,
            })
        ]).start();
    };

    const selectMonth = (month: string) => {
        setYearStart(month);
        toggleDropdown();
    };

    const rotation = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '180deg']
    });

    // Calculate year end based on year start
    const getYearEnd = (startMonth: string) => {
        const startIndex = MONTHS.indexOf(startMonth);
        const endIndex = (startIndex + 11) % 12;
        return MONTHS[endIndex];
    };

    const handleContinue = () => {
        console.log({ currency, yearStart, yearEnd: getYearEnd(yearStart) });
        router.replace('/(tabs)');
    };

    const handleBack = () => {
        router.back();
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#1e3a8a', '#2563eb']}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={28} color="#f59e0b" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Financial Setup</Text>
                    <View style={styles.placeholder} />
                </View>
                <Text style={styles.subtitle}>Set up your financial basics</Text>
            </LinearGradient>

            <ScrollView style={styles.card} showsVerticalScrollIndicator={false}>

                {/* Currency Input */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Currency *</Text>
                    <View style={styles.currencyContainer}>
                        <TextInput
                            style={[styles.input, { flex: 1, backgroundColor: '#f3f4f6' }]}
                            value={currency}
                            editable={false}
                        />
                        <TouchableOpacity
                            style={styles.changeButton}
                            onPress={() => showAlert('Info', 'Currency selection will be available in the next update.')}
                        >
                            <Text style={styles.changeButtonText}>Change</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Animated Year Start Dropdown */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Year Start</Text>
                    <TouchableOpacity
                        style={[styles.selectInput, isDropdownOpen && styles.selectInputActive]}
                        onPress={toggleDropdown}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.selectText}>{yearStart}</Text>
                        <Animated.View style={{ transform: [{ rotate: rotation }] }}>
                            <Ionicons name="chevron-down" size={20} color="#6b7280" />
                        </Animated.View>
                    </TouchableOpacity>

                    <Animated.View style={[styles.dropdownContainer, { height: dropdownHeight }]}>
                        <ScrollView nestedScrollEnabled={true} style={styles.dropdownList}>
                            {MONTHS.map((month) => (
                                <TouchableOpacity
                                    key={month}
                                    style={[styles.dropdownItem, yearStart === month && styles.dropdownItemActive]}
                                    onPress={() => selectMonth(month)}
                                >
                                    <Text style={[styles.dropdownItemText, yearStart === month && styles.dropdownItemTextActive]}>
                                        {month}
                                    </Text>
                                    {yearStart === month && <Ionicons name="checkmark" size={20} color="#2563eb" />}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </Animated.View>

                    {!isDropdownOpen && (
                        <Text style={styles.helperText}>(We suggest this for most businesses)</Text>
                    )}
                </View>

                {/* Year End (Read-only) */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Year End</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: '#f3f4f6' }]}
                        value={getYearEnd(yearStart)}
                        editable={false}
                    />
                </View>

                <Text style={styles.footerInstruction}>
                    We'll customize everything based on your industry with the right accounts \u0026 features.
                </Text>

                <TouchableOpacity
                    style={styles.continueButton}
                    onPress={handleContinue}
                    activeOpacity={0.8}
                >
                    <Text style={styles.continueButtonText}>Continue</Text>
                </TouchableOpacity>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Powered by Apbc</Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1e3a8a',
    },
    header: {
        paddingTop: 60,
        paddingHorizontal: 24,
        paddingBottom: 32,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#f59e0b',
        flex: 1,
        textAlign: 'center',
        marginHorizontal: 16,
    },
    placeholder: {
        width: 36,
    },
    subtitle: {
        fontSize: 18,
        color: '#ffffff',
        textAlign: 'center',
    },
    card: {
        flex: 1,
        backgroundColor: '#ffffff',
        marginTop: -20,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingHorizontal: 24,
        paddingTop: 32,
    },
    inputGroup: {
        marginBottom: 24,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#4b5563',
        marginBottom: 8,
    },
    currencyContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    input: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: '#1f2937',
        backgroundColor: '#fff',
    },
    changeButton: {
        marginLeft: 12,
        backgroundColor: '#f59e0b',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
    },
    changeButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    selectInput: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: '#fff',
    },
    selectInputActive: {
        borderColor: '#2563eb',
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
    },
    selectText: {
        fontSize: 16,
        color: '#1f2937',
    },
    dropdownContainer: {
        overflow: 'hidden',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderTopWidth: 0,
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
    },
    dropdownList: {
        maxHeight: 300,
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    dropdownItemActive: {
        backgroundColor: '#eff6ff',
    },
    dropdownItemText: {
        fontSize: 15,
        color: '#4b5563',
    },
    dropdownItemTextActive: {
        color: '#2563eb',
        fontWeight: '600',
    },
    helperText: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 6,
    },
    footerInstruction: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
        marginTop: 10,
        paddingHorizontal: 20,
        lineHeight: 20,
    },
    continueButton: {
        backgroundColor: '#1e3a8a',
        paddingVertical: 16,
        borderRadius: 30,
        alignItems: 'center',
        marginTop: 30,
        marginBottom: 24,
    },
    continueButtonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    footer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    footerText: {
        fontSize: 12,
        color: '#9ca3af',
    },
});
