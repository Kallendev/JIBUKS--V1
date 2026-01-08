import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { showToast } from '@/utils/toast';

const { width } = Dimensions.get('window');

export default function ContactInformationScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const [address, setAddress] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [email, setEmail] = useState('');

    const handleContinue = () => {
        if (!phoneNumber.trim()) {
            showToast.error('Error', 'Please enter your phone number');
            return;
        }

        // Save contact information logic would go here
        console.log({ address, phoneNumber, email });

        // Navigate to financial setup
        // @ts-ignore - Route exists but not in type definitions
        router.push('/financial-setup');
    };

    const handleBack = () => {
        router.back();
    };

    return (
        <View style={styles.container}>
            {/* Blue Header Section */}
            <LinearGradient
                colors={['#1e3a8a', '#2563eb']}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={28} color="#f59e0b" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Contact Information</Text>
                    <View style={styles.placeholder} />
                </View>
                <Text style={styles.subtitle}>How can customers reach you?</Text>
            </LinearGradient>

            {/* White Card Section */}
            <ScrollView style={styles.card} showsVerticalScrollIndicator={false}>

                {/* Business Address Input */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Business address?</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="123 Salon Street, Nairobi"
                        placeholderTextColor="#9ca3af"
                        value={address}
                        onChangeText={setAddress}
                    />
                </View>

                {/* Phone Number Input */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Phone Number *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="+2547897654389"
                        placeholderTextColor="#9ca3af"
                        value={phoneNumber}
                        onChangeText={setPhoneNumber}
                        keyboardType="phone-pad"
                    />
                </View>

                {/* Email Input */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="doris@salon.com"
                        placeholderTextColor="#9ca3af"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                </View>

                <Text style={styles.helperText}>
                    We'll customize everything based on your industry with the right accounts & features.
                </Text>

                {/* Continue Button */}
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
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#f9fafb',
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: '#1f2937',
    },
    helperText: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 10,
        textAlign: 'center',
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
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
