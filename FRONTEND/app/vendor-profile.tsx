import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function VendorProfileScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const supplierName = params.name || 'Water Board';

    // Sample data - in real app, fetch from backend
    const supplierData = {
        name: supplierName,
        totalSpent: 340,
        lastPayment: { amount: 20, date: 'Jan 10' },
        unpaidBills: 1,
        nextDue: { date: 'Feb 10', amount: 22 },
        contact: '080-123-4567',
        email: 'billing@waterboard.com',
        notes: 'High usage in dry seasons',
        recentTransactions: [
            { id: 1, date: 'Jan 10', amount: 20, method: 'Cheque #202' },
            { id: 2, date: 'Dec 10', amount: 20, method: 'Cash' },
            { id: 3, date: 'Nov 08', amount: 18, method: 'Wallet' },
        ],
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1f2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Supplier Profile</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Main Info */}
                <View style={styles.section}>
                    <View style={styles.infoCard}>
                        <Text style={styles.supplierName}>Supplier: {supplierData.name}</Text>
                        <View style={styles.divider} />

                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Total Spent:</Text>
                            <Text style={styles.infoValue}>${supplierData.totalSpent}</Text>
                        </View>

                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Last Payment:</Text>
                            <Text style={styles.infoValue}>${supplierData.lastPayment.amount} on {supplierData.lastPayment.date}</Text>
                        </View>

                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Unpaid Bills:</Text>
                            <Text style={styles.infoValue}>{supplierData.unpaidBills}</Text>
                        </View>

                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Next Due:</Text>
                            <Text style={styles.infoValue}>{supplierData.nextDue.date} - ${supplierData.nextDue.amount}</Text>
                        </View>
                    </View>
                </View>

                {/* Quick Actions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick Actions:</Text>
                    <View style={styles.actionsGrid}>
                        <TouchableOpacity style={styles.actionButton}>
                            <Ionicons name="cash" size={20} color="#ffffff" />
                            <Text style={styles.actionButtonText}>Pay Supplier</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionButton}>
                            <Ionicons name="document-text" size={20} color="#ffffff" />
                            <Text style={styles.actionButtonText}>Add Bill</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.actionButton, styles.actionButtonOrange]}>
                            <Ionicons name="create" size={20} color="#ffffff" />
                            <Text style={styles.actionButtonText}>Write Cheque</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionButton}>
                            <Ionicons name="attach" size={20} color="#ffffff" />
                            <Text style={styles.actionButtonText}>Attach Receipt</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.actionButton, styles.actionButtonOrange]}>
                            <Ionicons name="wallet" size={20} color="#ffffff" />
                            <Text style={styles.actionButtonText}>View Cheques</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Recent Transactions */}
                <View style={styles.section}>
                    <View style={styles.visualCard}>
                        <Text style={styles.visualCardTitle}>Recent Transactions</Text>
                        <View style={styles.divider} />
                        {supplierData.recentTransactions.map((transaction) => (
                            <View key={transaction.id} style={styles.transactionItem}>
                                <Text style={styles.bullet}>•</Text>
                                <Text style={styles.transactionText}>
                                    {transaction.date} - ${transaction.amount} - {transaction.method}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Receipts */}
                <View style={styles.section}>
                    <View style={styles.visualCard}>
                        <Text style={styles.visualCardTitle}>Receipts</Text>
                        <View style={styles.divider} />
                        <View style={styles.receiptsRow}>
                            <View style={styles.thumbnail}>
                                <Text style={styles.thumbnailText}>[Thumbnail]</Text>
                            </View>
                            <View style={styles.thumbnail}>
                                <Text style={styles.thumbnailText}>[Thumbnail]</Text>
                            </View>
                            <View style={styles.thumbnail}>
                                <Text style={styles.thumbnailText}>[Thumbnail]</Text>
                            </View>
                            <TouchableOpacity>
                                <Text style={styles.viewAllLink}>+ View All</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Supplier Info */}
                <View style={styles.section}>
                    <View style={styles.visualCard}>
                        <Text style={styles.visualCardTitle}>Supplier Info</Text>
                        <View style={styles.divider} />
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Contact:</Text>
                            <Text style={styles.infoValue}>{supplierData.contact}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Email:</Text>
                            <Text style={styles.infoValue}>{supplierData.email}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Notes:</Text>
                            <Text style={styles.infoValue}>{supplierData.notes}</Text>
                        </View>
                    </View>
                </View>

                {/* Bottom Spacing */}
                <View style={{ height: 100 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f4f8',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: '#ffffff',
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
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    content: {
        flex: 1,
    },
    section: {
        paddingHorizontal: 16,
        marginTop: 20,
    },
    infoCard: {
        backgroundColor: '#ffffff',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    supplierName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#122f8a',
        marginBottom: 12,
    },
    divider: {
        height: 1,
        backgroundColor: '#e5e7eb',
        marginVertical: 12,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 6,
    },
    infoLabel: {
        fontSize: 14,
        color: '#6b7280',
    },
    infoValue: {
        fontSize: 14,
        color: '#1f2937',
        fontWeight: '500',
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#122f8a',
        marginBottom: 12,
    },
    actionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#122f8a',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 8,
        gap: 6,
        shadowColor: '#122f8a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
    actionButtonOrange: {
        backgroundColor: '#fe9900',
        shadowColor: '#fe9900',
    },
    actionButtonText: {
        fontSize: 13,
        color: '#ffffff',
        fontWeight: '600',
    },
    visualCard: {
        backgroundColor: '#ffffff',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    visualCardTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#122f8a',
    },
    transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
    },
    bullet: {
        fontSize: 16,
        color: '#1f2937',
        marginRight: 8,
    },
    transactionText: {
        fontSize: 13,
        color: '#1f2937',
    },
    receiptsRow: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
    },
    thumbnail: {
        width: 60,
        height: 60,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#d1d5db',
        alignItems: 'center',
        justifyContent: 'center',
    },
    thumbnailText: {
        fontSize: 10,
        color: '#6b7280',
    },
    viewAllLink: {
        fontSize: 13,
        color: '#122f8a',
        fontWeight: '600',
    },
});
