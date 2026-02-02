import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Alert,
    TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import apiService from '@/services/api';

export default function CustomersScreen() {
    const router = useRouter();
    const [customersData, setCustomersData] = useState<any>({ customers: [], pagination: {} });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [businessTypeFilter, setBusinessTypeFilter] = useState('');

    // New customer form
    const [formData, setFormData] = useState({
        name: '',
        companyName: '',
        email: '',
        phone: '',
        alternatePhone: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'Kenya',
        paymentTerms: 'Net 30',
        creditLimit: '',
        taxNumber: '',
        taxId: '',
        website: '',
        contactPerson: '',
        position: '',
        businessType: '',
        industry: '',
        notes: '',
    });

    useEffect(() => {
        loadCustomers();
    }, []);

    const loadCustomers = async () => {
        try {
            setLoading(true);
            const data = await apiService.getCustomers({
                search: searchQuery || undefined,
                businessType: businessTypeFilter || undefined,
                active: true,
                limit: 50,
                offset: 0,
            });
            setCustomersData(data);
        } catch (error) {
            console.error('Error loading customers:', error);
            Alert.alert('Error', 'Failed to load customers');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadCustomers();
        setRefreshing(false);
    };

    const handleCreateCustomer = async () => {
        if (!formData.name) {
            Alert.alert('Error', 'Customer name is required');
            return;
        }

        try {
            await apiService.createCustomer(formData);
            Alert.alert('Success', 'Customer created successfully');
            setShowModal(false);
            setFormData({
                name: '',
                companyName: '',
                email: '',
                phone: '',
                alternatePhone: '',
                address: '',
                city: '',
                state: '',
                zipCode: '',
                country: 'Kenya',
                paymentTerms: 'Net 30',
                creditLimit: '',
                taxNumber: '',
                taxId: '',
                website: '',
                contactPerson: '',
                position: '',
                businessType: '',
                industry: '',
                notes: '',
            });
            loadCustomers();
        } catch (error) {
            console.error('Error creating customer:', error);
            Alert.alert('Error', 'Failed to create customer');
        }
    };

    const formatCurrency = (amount: number) => {
        return `KES ${Number(amount).toLocaleString()}`;
    };

    // Effect to reload customers when search or filter changes
    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            if (!loading) loadCustomers();
        }, 300);

        return () => clearTimeout(debounceTimer);
    }, [searchQuery, businessTypeFilter]);

    const filteredCustomers = customersData.customers || [];

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#1f2937" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Customers</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#ec4899" />
                    <Text style={styles.loadingText}>Loading customers...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1f2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Customers</Text>
                <TouchableOpacity onPress={() => setShowModal(true)} style={styles.addButton}>
                    <Ionicons name="add" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Search and Filters */}
                <View style={styles.searchContainer}>
                    <View style={styles.searchBox}>
                        <Ionicons name="search" size={20} color="#6b7280" />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search customers..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                    
                    <View style={styles.filterContainer}>
                        <Text style={styles.filterLabel}>Filter by Business Type:</Text>
                        <ScrollView 
                            horizontal 
                            showsHorizontalScrollIndicator={false}
                            style={styles.filterScrollView}
                        >
                            {['', 'retail', 'wholesale', 'corporate', 'individual', 'government', 'nonprofit'].map((type) => (
                                <TouchableOpacity
                                    key={type}
                                    style={[
                                        styles.filterChip,
                                        businessTypeFilter === type && styles.filterChipActive
                                    ]}
                                    onPress={() => setBusinessTypeFilter(type)}
                                >
                                    <Text style={[
                                        styles.filterChipText,
                                        businessTypeFilter === type && styles.filterChipTextActive
                                    ]}>
                                        {type === '' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>

                {/* Customers List */}
                <View style={styles.listContainer}>
                    {filteredCustomers.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="people-outline" size={64} color="#d1d5db" />
                            <Text style={styles.emptyText}>
                                {searchQuery ? 'No customers found' : 'No customers yet'}
                            </Text>
                            <Text style={styles.emptySubtext}>
                                {searchQuery
                                    ? 'Try a different search term'
                                    : 'Tap the + button to add your first customer'}
                            </Text>
                        </View>
                    ) : (
                        filteredCustomers.map((customer) => (
                            <TouchableOpacity
                                key={customer.id}
                                style={styles.customerCard}
                                onPress={() => router.push(`/customer-detail?id=${customer.id}` as any)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.customerHeader}>
                                    <View style={styles.customerLeft}>
                                        <View style={styles.avatarCircle}>
                                            <Text style={styles.avatarText}>
                                                {(customer.companyName || customer.name).charAt(0).toUpperCase()}
                                            </Text>
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.customerName}>
                                                {customer.companyName || customer.name}
                                            </Text>
                                            {customer.companyName && customer.name && (
                                                <Text style={styles.customerContact}>
                                                    Contact: {customer.name}
                                                </Text>
                                            )}
                                            {customer.email && (
                                                <Text style={styles.customerEmail}>{customer.email}</Text>
                                            )}
                                            {customer.phone && (
                                                <Text style={styles.customerPhone}>{customer.phone}</Text>
                                            )}
                                        </View>
                                        <View style={styles.customerStatus}>
                                            {customer.balance > 0 && (
                                                <View style={styles.balanceBadge}>
                                                    <Text style={styles.balanceBadgeText}>
                                                        {formatCurrency(customer.balance || 0)}
                                                    </Text>
                                                </View>
                                            )}
                                            {customer.businessType && (
                                                <Text style={styles.businessType}>
                                                    {customer.businessType.toUpperCase()}
                                                </Text>
                                            )}
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.customerStats}>
                                    <View style={styles.statItem}>
                                        <Text style={styles.statValue}>{customer.stats?.totalInvoices || 0}</Text>
                                        <Text style={styles.statLabel}>Invoices</Text>
                                    </View>
                                    <View style={styles.statItem}>
                                        <Text style={styles.statValue}>
                                            {formatCurrency(customer.totalSales || 0)}
                                        </Text>
                                        <Text style={styles.statLabel}>Total Sales</Text>
                                    </View>
                                    <View style={styles.statItem}>
                                        <Text style={[
                                            styles.statValue,
                                            { color: customer.stats?.overdueInvoices > 0 ? '#ef4444' : '#10b981' }
                                        ]}>
                                            {customer.stats?.overdueInvoices || 0}
                                        </Text>
                                        <Text style={styles.statLabel}>Overdue</Text>
                                    </View>
                                </View>

                                <View style={styles.customerFooter}>
                                    <TouchableOpacity
                                        style={styles.actionButton}
                                        onPress={(e) => {
                                            e.stopPropagation();
                                            router.push(`/create-invoice?customerId=${customer.id}` as any);
                                        }}
                                    >
                                        <Ionicons name="document-text" size={16} color="#2563eb" />
                                        <Text style={styles.actionButtonText}>Invoice</Text>
                                    </TouchableOpacity>
                                    
                                    {customer.phone && (
                                        <TouchableOpacity
                                            style={styles.actionButton}
                                            onPress={(e) => {
                                                e.stopPropagation();
                                                // TODO: Add phone call functionality
                                                Alert.alert('Call', `Call ${customer.phone}?`);
                                            }}
                                        >
                                            <Ionicons name="call" size={16} color="#10b981" />
                                            <Text style={styles.actionButtonText}>Call</Text>
                                        </TouchableOpacity>
                                    )}
                                    
                                    {customer.email && (
                                        <TouchableOpacity
                                            style={styles.actionButton}
                                            onPress={(e) => {
                                                e.stopPropagation();
                                                // TODO: Add email functionality  
                                                Alert.alert('Email', `Email ${customer.email}?`);
                                            }}
                                        >
                                            <Ionicons name="mail" size={16} color="#f59e0b" />
                                            <Text style={styles.actionButtonText}>Email</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </TouchableOpacity>
                        ))
                    )}
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Create Customer Modal */}
            {showModal && (
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>New Customer</Text>
                            <TouchableOpacity onPress={() => setShowModal(false)}>
                                <Ionicons name="close" size={24} color="#1f2937" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                            <Text style={styles.label}>Customer Name *</Text>
                            <TextInput
                                style={styles.modalInput}
                                placeholder="Enter customer name"
                                value={formData.name}
                                onChangeText={(value) => setFormData({ ...formData, name: value })}
                            />

                            <Text style={styles.label}>Company Name</Text>
                            <TextInput
                                style={styles.modalInput}
                                placeholder="Company or business name"
                                value={formData.companyName}
                                onChangeText={(value) => setFormData({ ...formData, companyName: value })}
                            />

                            <Text style={styles.label}>Email</Text>
                            <TextInput
                                style={styles.modalInput}
                                placeholder="customer@example.com"
                                value={formData.email}
                                onChangeText={(value) => setFormData({ ...formData, email: value })}
                                keyboardType="email-address"
                            />

                            <Text style={styles.label}>Phone</Text>
                            <TextInput
                                style={styles.modalInput}
                                placeholder="+254 700 000 000"
                                value={formData.phone}
                                onChangeText={(value) => setFormData({ ...formData, phone: value })}
                                keyboardType="phone-pad"
                            />

                            <Text style={styles.label}>Address</Text>
                            <TextInput
                                style={styles.modalInput}
                                placeholder="Street address"
                                value={formData.address}
                                onChangeText={(value) => setFormData({ ...formData, address: value })}
                            />

                            <Text style={styles.label}>City</Text>
                            <TextInput
                                style={styles.modalInput}
                                placeholder="City"
                                value={formData.city}
                                onChangeText={(value) => setFormData({ ...formData, city: value })}
                            />

                            <Text style={styles.label}>Business Type</Text>
                            <View style={styles.pickerContainer}>
                                <Picker
                                    selectedValue={formData.businessType}
                                    onValueChange={(value) => setFormData({ ...formData, businessType: value })}
                                    style={styles.picker}
                                >
                                    <Picker.Item label="Select Business Type" value="" />
                                    <Picker.Item label="Retail" value="retail" />
                                    <Picker.Item label="Wholesale" value="wholesale" />
                                    <Picker.Item label="Corporate" value="corporate" />
                                    <Picker.Item label="Individual" value="individual" />
                                    <Picker.Item label="Government" value="government" />
                                    <Picker.Item label="Non-Profit" value="nonprofit" />
                                </Picker>
                            </View>

                            <Text style={styles.label}>Payment Terms</Text>
                            <View style={styles.pickerContainer}>
                                <Picker
                                    selectedValue={formData.paymentTerms}
                                    onValueChange={(value) => setFormData({ ...formData, paymentTerms: value })}
                                    style={styles.picker}
                                >
                                    <Picker.Item label="Due on Receipt" value="Due on Receipt" />
                                    <Picker.Item label="Net 15" value="Net 15" />
                                    <Picker.Item label="Net 30" value="Net 30" />
                                    <Picker.Item label="Net 60" value="Net 60" />
                                </Picker>
                            </View>

                            <Text style={styles.label}>Credit Limit (KES)</Text>
                            <TextInput
                                style={styles.modalInput}
                                placeholder="0"
                                value={formData.creditLimit}
                                onChangeText={(value) => setFormData({ ...formData, creditLimit: value })}
                                keyboardType="numeric"
                            />

                            <Text style={styles.label}>Tax Number (Optional)</Text>
                            <TextInput
                                style={styles.modalInput}
                                placeholder="VAT/Tax ID Number"
                                value={formData.taxNumber}
                                onChangeText={(value) => setFormData({ ...formData, taxNumber: value })}
                            />

                            <Text style={styles.label}>Notes</Text>
                            <TextInput
                                style={[styles.modalInput, { height: 80, textAlignVertical: 'top' }]}
                                placeholder="Additional notes about this customer..."
                                value={formData.notes}
                                onChangeText={(value) => setFormData({ ...formData, notes: value })}
                                multiline
                                numberOfLines={3}
                            />
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => setShowModal(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.createButton}
                                onPress={handleCreateCustomer}
                            >
                                <Text style={styles.createButtonText}>Create Customer</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f3f4f6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    addButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#ec4899',
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#6b7280',
    },
    scrollView: {
        flex: 1,
    },
    searchContainer: {
        padding: 16,
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 48,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 16,
        color: '#1f2937',
    },
    filterContainer: {
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    filterLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    filterScrollView: {
        marginHorizontal: -4,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f3f4f6',
        marginHorizontal: 4,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    filterChipActive: {
        backgroundColor: '#dbeafe',
        borderColor: '#2563eb',
    },
    filterChipText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6b7280',
    },
    filterChipTextActive: {
        color: '#2563eb',
    },
    listContainer: {
        paddingHorizontal: 16,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#6b7280',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#9ca3af',
        marginTop: 8,
        textAlign: 'center',
    },
    customerCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    customerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    customerLeft: {
        flexDirection: 'row',
        flex: 1,
    },
    avatarCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#fce7f3',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    avatarText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#ec4899',
    },
    customerName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
    },
    customerEmail: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 2,
    },
    customerPhone: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 2,
    },
    customerContact: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 2,
    },
    customerStatus: {
        alignItems: 'flex-end',
        marginLeft: 'auto',
    },
    balanceBadge: {
        backgroundColor: '#fee2e2',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        marginBottom: 4,
    },
    balanceBadgeText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#ef4444',
    },
    businessType: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#6b7280',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    customerStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 12,
        color: '#6b7280',
        textAlign: 'center',
    },
    customerDetails: {
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
        paddingTop: 12,
        marginBottom: 12,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    detailLabel: {
        fontSize: 14,
        color: '#6b7280',
    },
    detailValue: {
        fontSize: 14,
        color: '#1f2937',
        fontWeight: '500',
    },
    balanceAmount: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    customerFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
        paddingTop: 12,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        gap: 4,
        flex: 1,
        justifyContent: 'center',
    },
    actionButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#374151',
    },
    // Modal styles
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 16,
        width: '100%',
        maxWidth: 500,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    modalBody: {
        padding: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
        marginTop: 12,
    },
    modalInput: {
        backgroundColor: '#f9fafb',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        paddingHorizontal: 12,
        height: 48,
        fontSize: 16,
        color: '#1f2937',
    },
    pickerContainer: {
        backgroundColor: '#f9fafb',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        paddingHorizontal: 12,
        height: 48,
        justifyContent: 'center',
    },
    picker: {
        fontSize: 16,
        color: '#1f2937',
        backgroundColor: 'transparent',
    },
    modalFooter: {
        flexDirection: 'row',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        backgroundColor: '#f3f4f6',
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6b7280',
    },
    createButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        backgroundColor: '#ec4899',
        alignItems: 'center',
    },
    createButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
});
