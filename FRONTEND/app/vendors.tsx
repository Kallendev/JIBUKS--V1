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
import apiService from '@/services/api';

export default function VendorsScreen() {
    const router = useRouter();
    const [vendors, setVendors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    // const [showModal, setShowModal] = useState(false); // Removed

    // New vendor form
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        paymentTerms: 'Net 30',
    });

    useEffect(() => {
        loadVendors();
    }, []);

    const loadVendors = async () => {
        try {
            setLoading(true);
            const data = await apiService.getVendors();
            setVendors(data);
        } catch (error) {
            console.error('Error loading vendors:', error);
            Alert.alert('Error', 'Failed to load vendors');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadVendors();
        setRefreshing(false);
    };

    // handleCreateVendor removed as it's now handled by add-supplier.tsx

    const formatCurrency = (amount: number) => {
        return `KES ${Number(amount).toLocaleString()}`;
    };

    const filteredVendors = vendors.filter(vendor =>
        vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (vendor.email && vendor.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#1f2937" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Vendors</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#fe9900" />
                    <Text style={styles.loadingText}>Loading vendors...</Text>
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
                <Text style={styles.headerTitle}>Vendors</Text>
                <TouchableOpacity onPress={() => router.push('/add-supplier')} style={styles.addButton}>
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
                {/* Search */}
                <View style={styles.searchContainer}>
                    <View style={styles.searchBox}>
                        <Ionicons name="search" size={20} color="#6b7280" />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search vendors..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                </View>

                {/* Vendors List */}
                <View style={styles.listContainer}>
                    {filteredVendors.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="business-outline" size={64} color="#d1d5db" />
                            <Text style={styles.emptyText}>
                                {searchQuery ? 'No vendors found' : 'No vendors yet'}
                            </Text>
                            <Text style={styles.emptySubtext}>
                                {searchQuery
                                    ? 'Try a different search term'
                                    : 'Tap the + button to add your first vendor'}
                            </Text>
                        </View>
                    ) : (
                        filteredVendors.map((vendor) => (
                            <TouchableOpacity
                                key={vendor.id}
                                style={styles.vendorCard}
                                onPress={() => router.push(`/vendor-detail?id=${vendor.id}` as any)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.vendorHeader}>
                                    <View style={styles.vendorLeft}>
                                        <View style={styles.avatarCircle}>
                                            <Text style={styles.avatarText}>
                                                {vendor.name.charAt(0).toUpperCase()}
                                            </Text>
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.vendorName}>{vendor.name}</Text>
                                            {vendor.email && (
                                                <Text style={styles.vendorEmail}>{vendor.email}</Text>
                                            )}
                                            {vendor.phone && (
                                                <Text style={styles.vendorPhone}>{vendor.phone}</Text>
                                            )}
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.vendorDetails}>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Balance Owed:</Text>
                                        <Text style={[
                                            styles.balanceAmount,
                                            { color: vendor.balance > 0 ? '#ef4444' : '#10b981' }
                                        ]}>
                                            {formatCurrency(vendor.balance || 0)}
                                        </Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Purchases:</Text>
                                        <Text style={styles.detailValue}>
                                            {vendor.totalPurchases || 0}
                                        </Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Payment Terms:</Text>
                                        <Text style={styles.detailValue}>
                                            {vendor.paymentTerms || 'Net 30'}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.vendorFooter}>
                                    <TouchableOpacity
                                        style={styles.actionButton}
                                        onPress={(e) => {
                                            e.stopPropagation();
                                            router.push(`/new-purchase?vendorId=${vendor.id}` as any);
                                        }}
                                    >
                                        <Ionicons name="receipt" size={16} color="#f59e0b" />
                                        <Text style={styles.actionButtonText}>New Bill</Text>
                                    </TouchableOpacity>
                                    <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                                </View>
                            </TouchableOpacity>
                        ))
                    )}
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Modal removed */}
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
        color: '#122f8a',
    },
    addButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#fe9900',
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
    vendorCard: {
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
    vendorHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    vendorLeft: {
        flexDirection: 'row',
        flex: 1,
    },
    avatarCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#fef3c7',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    avatarText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#f59e0b',
    },
    vendorName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
    },
    vendorEmail: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 2,
    },
    vendorPhone: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 2,
    },
    vendorDetails: {
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
    vendorFooter: {
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
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: '#fef3c7',
        gap: 4,
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#f59e0b',
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
        backgroundColor: '#f59e0b',
        alignItems: 'center',
    },
    createButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
});
