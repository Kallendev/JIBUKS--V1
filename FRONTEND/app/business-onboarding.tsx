import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Dimensions, Modal, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { showAlert } from '@/utils/alert';

const { width } = Dimensions.get('window');

const INDUSTRIES = [
    "Hair Salon, Beauty Salon, or Barber Shop",
    "Retail Shop / Mini-mart",
    "Mama Mboga / Grocery Vendor",
    "Tailoring & Fashion Design",
    "Mobile Money Agent",
    "Boda Boda / Transportation Services",
    "Electronics Repair",
    "Motor Sales or Repair",
    "Repair and Maintenance",
    "Carpentry & Woodwork",
    "Metalwork & Welding",
    "Cleaning & Domestic Services",
    "Beauty Product Retail",
    "Events & Entertainment",
    "Pharmacy & Drugstore",
    "Hotels and Restaurants",
    "Lodging (Hotel, Bed & Breakfast)",
    "Gardening Services",
    "Construction Trades (Plumber, Electrician)",
    "Transportation, Trucking, or Delivery",
    "Building Materials Supply",
    "Wholesale Distribution and Sales",
    "Food Processing & Packaging",
    "Agriculture, Farming or Forestry",
    "Manufacturing",
    "Water & Energy Services",
    "Waste Management & Recycling",
    "Medical, Dental, or Health Service",
    "Education & Tutoring Services",
    "Art, Writing, or Photography",
    "Information Technology (Computers, Software)",
    "Design, Architecture, or Engineering",
    "Advertising or Public Relations",
    "Professional Consulting",
    "Legal Services",
    "Accounting & Bookkeeping",
    "Financial Services (other than Accounting)",
    "Insurance Agency or Broker",
    "Estate Agent / Real Estate",
    "Property Management or Home Association",
    "Construction General Contractor",
    "Non-Profit / NGO",
    "Church or Religious Organisation",
    "Chama / Investment Group",
    "SACCO / Cooperative Society",
    "General Product-based Business",
    "General Service-based Business"
];

type SalesType = 'services' | 'products' | 'both' | null;

export default function BusinessOnboardingScreen() {
    const router = useRouter();
    const [businessName, setBusinessName] = useState('');
    const [industry, setIndustry] = useState('');
    const [salesType, setSalesType] = useState<SalesType>(null);
    const [industryModalVisible, setIndustryModalVisible] = useState(false);

    const handleContinue = () => {
        if (!businessName.trim()) {
            showAlert('Error', 'Please enter your business name');
            return;
        }
        if (!industry.trim()) {
            showAlert('Error', 'Please select your industry');
            return;
        }
        if (!salesType) {
            showAlert('Error', 'Please select what you sell');
            return;
        }

        // Save business data logic would go here
        console.log({ businessName, industry, salesType });

        // Navigate to contact information
        router.push('/contact-information');
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
                    <Text style={styles.headerTitle}>Business Profile & Identity</Text>
                    <View style={styles.placeholder} />
                </View>
                <Text style={styles.subtitle}>Tell us about your business</Text>
            </LinearGradient>

            {/* White Card Section */}
            <ScrollView style={styles.card} showsVerticalScrollIndicator={false}>

                {/* Business Name Input */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>What's your business name?*</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter your business name..."
                        placeholderTextColor="#9ca3af"
                        value={businessName}
                        onChangeText={setBusinessName}
                    />
                </View>

                {/* Industry Input */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>What industry are you in?*</Text>
                    <TouchableOpacity
                        style={styles.selectInput}
                        onPress={() => setIndustryModalVisible(true)}
                        activeOpacity={0.7}
                    >
                        <Text style={[
                            styles.selectInputText,
                            !industry && styles.placeholderText
                        ]}>
                            {industry || "Select industry"}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color="#6b7280" />
                    </TouchableOpacity>
                    <Text style={styles.helperText}>
                        We'll customize everything based on your industry with the right accounts & features.
                    </Text>
                </View>

                {/* Sales Type Selection */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>What do you sell?*</Text>

                    <TouchableOpacity
                        style={[styles.radioOption, salesType === 'services' && styles.radioOptionSelected]}
                        onPress={() => setSalesType('services')}
                    >
                        <View style={[styles.radioCircle, salesType === 'services' && styles.radioCircleSelected]}>
                            {salesType === 'services' && <View style={styles.radioInnerCircle} />}
                        </View>
                        <Text style={styles.radioText}>Services only</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.radioOption, salesType === 'products' && styles.radioOptionSelected]}
                        onPress={() => setSalesType('products')}
                    >
                        <View style={[styles.radioCircle, salesType === 'products' && styles.radioCircleSelected]}>
                            {salesType === 'products' && <View style={styles.radioInnerCircle} />}
                        </View>
                        <Text style={styles.radioText}>Product only</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.radioOption, salesType === 'both' && styles.radioOptionSelected]}
                        onPress={() => setSalesType('both')}
                    >
                        <View style={[styles.radioCircle, salesType === 'both' && styles.radioCircleSelected]}>
                            {salesType === 'both' && <View style={styles.radioInnerCircle} />}
                        </View>
                        <Text style={styles.radioText}>Both services and products</Text>
                    </TouchableOpacity>
                </View>

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

            {/* Industry Selection Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={industryModalVisible}
                onRequestClose={() => setIndustryModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Industry</Text>
                            <TouchableOpacity onPress={() => setIndustryModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#6b7280" />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={INDUSTRIES}
                            keyExtractor={(item) => item}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.industryItem}
                                    onPress={() => {
                                        setIndustry(item);
                                        setIndustryModalVisible(false);
                                    }}
                                >
                                    <Text style={styles.industryItemText}>{item}</Text>
                                    {industry === item && (
                                        <Ionicons name="checkmark" size={20} color="#1e3a8a" />
                                    )}
                                </TouchableOpacity>
                            )}
                            showsVerticalScrollIndicator={false}
                        />
                    </View>
                </View>
            </Modal>
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
        fontSize: 20, // Slightly smaller to fit "Business Profile & Identity"
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
    selectInput: {
        backgroundColor: '#f9fafb',
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14, // Adjusted to match input height if using internal TextInput
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    helperText: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 6,
        lineHeight: 18,
    },
    radioOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        marginBottom: 10,
        backgroundColor: '#ffffff',
    },
    radioOptionSelected: {
        borderColor: '#1e3a8a',
        backgroundColor: '#eff6ff',
    },
    radioCircle: {
        height: 20,
        width: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#d1d5db',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    radioCircleSelected: {
        borderColor: '#1e3a8a',
    },
    radioInnerCircle: {
        height: 10,
        width: 10,
        borderRadius: 5,
        backgroundColor: '#1e3a8a',
    },
    radioText: {
        fontSize: 16,
        color: '#374151',
    },
    continueButton: {
        backgroundColor: '#1e3a8a',
        paddingVertical: 16,
        borderRadius: 30,
        alignItems: 'center',
        marginTop: 12,
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
        marginBottom: 32,
    },
    footerText: {
        fontSize: 12,
        color: '#6b7280',
    },
    selectInputText: {
        fontSize: 16,
        color: '#1f2937',
        flex: 1,
    },
    placeholderText: {
        color: '#9ca3af',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#ffffff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: '80%',
        padding: 24,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    industryItem: {
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    industryItemText: {
        fontSize: 16,
        color: '#374151',
    },
});
