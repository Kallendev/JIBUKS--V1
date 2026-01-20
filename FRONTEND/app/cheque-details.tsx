import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    Image,
    Platform,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function ChequeDetailsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();

    // Mock Data based on ID (In real app, fetch from API)
    // Default to the one in the image if no ID matches
    const cheque = {
        id: '203',
        payee: 'School (Primary)',
        amount: 250,
        currency: 'KES', // Using KES for system consistency, displayed as $ in user image example
        status: 'Pending',
        issuedDate: 'Jan 10, 2026',
        bank: 'Bank A',
        memo: 'January School Fees',
        imageUri: 'https://via.placeholder.com/150', // Placeholder
        createdBy: 'Dad',
        recordedAt: 'Jan 10, 10:22 AM'
    };

    const handleMarkCleared = () => {
        Alert.alert('Success', 'Cheque marked as cleared.');
    };

    const handleDelete = () => {
        Alert.alert('Confirm Delete', 'Are you sure you want to delete this cheque?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => router.back() }
        ]);
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
                        <Text style={styles.headerTitle}>Cheque Details</Text>
                        <View style={{ width: 40 }} />
                    </View>
                </LinearGradient>
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Main Details Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeaderRow}>
                        <Text style={styles.cardTitle}>Cheque #{cheque.id}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: '#fff7ed', borderColor: '#fdba74' }]}>
                            <Text style={[styles.statusText, { color: '#c2410c' }]}>{cheque.status}</Text>
                        </View>
                    </View>

                    <View style={styles.dashedDivider} />

                    <View style={styles.detailRow}>
                        <Text style={styles.label}>Payee:</Text>
                        <Text style={styles.value}>{cheque.payee}</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.label}>Amount:</Text>
                        <Text style={[styles.value, styles.amountValue]}>
                            {cheque.currency} {cheque.amount}
                        </Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.label}>Issued Date:</Text>
                        <Text style={styles.value}>{cheque.issuedDate}</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.label}>Bank:</Text>
                        <Text style={styles.value}>{cheque.bank}</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.label}>Memo:</Text>
                        <Text style={styles.value}>{cheque.memo}</Text>
                    </View>

                    {/* Attached Image Section */}
                    <View style={styles.imageSection}>
                        <Text style={styles.label}>Attached Image:</Text>
                        <View style={styles.imageThumbnail}>
                            <Ionicons name="image-outline" size={32} color="#94a3b8" />
                            <Text style={styles.thumbnailText}>Thumbnail</Text>
                        </View>
                    </View>
                </View>

                {/* Actions */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionHeaderText}>Action Buttons</Text>
                </View>

                <View style={styles.actionsRow}>
                    <TouchableOpacity style={styles.actionBtnPrimary} onPress={handleMarkCleared}>
                        <Ionicons name="checkmark-circle-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
                        <Text style={styles.actionBtnPrimaryText}>Mark as Cleared</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionBtnOutline} onPress={() => Alert.alert('Info', 'Edit functionality here')}>
                        <Ionicons name="create-outline" size={18} color="#122f8a" style={{ marginRight: 6 }} />
                        <Text style={styles.actionBtnOutlineText}>Edit Cheque</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionBtnDanger} onPress={handleDelete}>
                        <Ionicons name="trash-outline" size={18} color="#dc2626" style={{ marginRight: 6 }} />
                        <Text style={styles.actionBtnDangerText}>Delete</Text>
                    </TouchableOpacity>
                </View>


                {/* Technical/Audit Metadata */}
                <View style={[styles.card, { marginTop: 24 }]}>
                    <Text style={[styles.cardTitle, { fontSize: 14, color: '#64748b' }]}>Transaction Info</Text>
                    <View style={[styles.dashedDivider, { borderColor: '#e2e8f0', marginVertical: 12 }]} />

                    <View style={styles.metaRow}>
                        <Text style={styles.metaLabel}>Created by:</Text>
                        <Text style={styles.metaValue}>{cheque.createdBy}</Text>
                    </View>
                    <View style={styles.metaRow}>
                        <Text style={styles.metaLabel}>Recorded:</Text>
                        <Text style={styles.metaValue}>{cheque.recordedAt}</Text>
                    </View>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
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
    cardHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1e293b',
    },
    dashedDivider: {
        height: 1,
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderStyle: 'dashed',
        marginBottom: 20,
        marginTop: 8,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    detailRow: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    label: {
        width: 120,
        fontSize: 14,
        color: '#64748b',
        fontWeight: '500',
    },
    value: {
        flex: 1,
        fontSize: 15,
        color: '#1e293b',
        fontWeight: '600',
    },
    amountValue: {
        fontSize: 16,
        color: '#122f8a',
        fontWeight: '700',
    },
    imageSection: {
        marginTop: 8,
        flexDirection: 'row',
    },
    imageThumbnail: {
        width: 100,
        height: 80,
        backgroundColor: '#f1f5f9',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    thumbnailText: {
        fontSize: 10,
        color: '#94a3b8',
        marginTop: 4,
    },
    sectionHeader: {
        marginTop: 24,
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    sectionHeaderText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    actionsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    actionBtnPrimary: {
        flexDirection: 'row',
        backgroundColor: '#122f8a',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
        shadowColor: '#122f8a',
        shadowOpacity: 0.3,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
    },
    actionBtnPrimaryText: {
        color: '#ffffff',
        fontWeight: '600',
        fontSize: 14,
    },
    actionBtnOutline: {
        flexDirection: 'row',
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#122f8a',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    actionBtnOutlineText: {
        color: '#122f8a',
        fontWeight: '600',
        fontSize: 14,
    },
    actionBtnDanger: {
        flexDirection: 'row',
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#fee2e2',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    actionBtnDangerText: {
        color: '#dc2626',
        fontWeight: '600',
        fontSize: 14,
    },
    metaRow: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    metaLabel: {
        width: 100,
        fontSize: 13,
        color: '#94a3b8',
    },
    metaValue: {
        fontSize: 13,
        color: '#475569',
        fontWeight: '500',
    }
});
