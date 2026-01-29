import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    ActivityIndicator,
    Image,
    RefreshControl,
    StatusBar,
    Alert,
    Modal,
    TextInput,
    Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect, Stack } from 'expo-router';
import apiService from '@/services/api';
import DateTimePicker from '@react-native-community/datetimepicker';

// Brand Colors
const COLORS = {
    primary: '#122f8a',
    secondary: '#fe9900',
    white: '#ffffff',
    background: '#f8fafc',
    card: '#ffffff',
    text: '#0f172a',
    textLight: '#64748b',
    border: '#e2e8f0',
    success: '#10b981',
    error: '#ef4444',
    blue50: '#eff6ff',
    orange50: '#fff7ed',
    red50: '#fef2f2',
};

export default function AssetDashboardScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [assets, setAssets] = useState<any[]>([]);
    const [totalValue, setTotalValue] = useState(0);

    // Modals
    const [selectedAsset, setSelectedAsset] = useState<any>(null);
    const [showDepreciationModal, setShowDepreciationModal] = useState(false);
    const [showDisposalModal, setShowDisposalModal] = useState(false);

    // Action Form State
    const [newValue, setNewValue] = useState('');
    const [disposalPrice, setDisposalPrice] = useState('');
    const [depositAccounts, setDepositAccounts] = useState<any[]>([]);
    const [disposalAccountId, setDisposalAccountId] = useState<number | null>(null);
    const [disposalDate, setDisposalDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    useFocusEffect(
        React.useCallback(() => {
            loadAssets();
        }, [])
    );

    const loadAssets = async () => {
        try {
            setLoading(true);
            const [data, accounts] = await Promise.all([
                apiService.getFixedAssets({ active: true }),
                apiService.getPaymentEligibleAccounts(),
            ]);
            setAssets(data);
            setDepositAccounts(accounts);

            const total = data.reduce((sum: number, asset: any) => sum + Number(asset.currentValue), 0);
            setTotalValue(total);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to load assets');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        loadAssets();
    };

    const openDepreciationModal = (asset: any) => {
        setSelectedAsset(asset);
        setNewValue(String(asset.currentValue));
        setShowDepreciationModal(true);
    };

    const openDisposalModal = (asset: any) => {
        setSelectedAsset(asset);
        setDisposalPrice('');
        setDisposalAccountId(null);
        setDisposalDate(new Date());
        setShowDisposalModal(true);
    };

    const submitDepreciation = async () => {
        if (!selectedAsset) return;
        const val = parseFloat(newValue);
        if (isNaN(val) || val >= Number(selectedAsset.currentValue)) {
            Alert.alert('Invalid Value', 'New value must be lower than current value');
            return;
        }

        try {
            setActionLoading(true);
            await apiService.depreciateAsset(selectedAsset.id, val);
            setShowDepreciationModal(false);
            Alert.alert('Success', 'Asset value updated! Expense recorded.');
            loadAssets();
        } catch (error: any) {
            Alert.alert('Error', error.error || 'Failed to update value');
        } finally {
            setActionLoading(false);
        }
    };

    const submitDisposal = async () => {
        if (!selectedAsset) return;
        const price = parseFloat(disposalPrice) || 0;

        if (price > 0 && !disposalAccountId) {
            Alert.alert('Required', 'Please select where the money was deposited');
            return;
        }

        try {
            setActionLoading(true);
            await apiService.disposeAsset(selectedAsset.id, {
                disposalPrice: price,
                disposalAccountId: disposalAccountId || undefined,
                date: disposalDate.toISOString(),
            });
            setShowDisposalModal(false);
            Alert.alert('Success', 'Asset disposed and removed from wealth list.');
            loadAssets();
        } catch (error: any) {
            Alert.alert('Error', error.error || 'Failed to dispose asset');
        } finally {
            setActionLoading(false);
        }
    };

    const AssetCard = ({ asset }: { asset: any }) => {
        const originalCost = Number(asset.purchasePrice);
        const current = Number(asset.currentValue);
        const dropPercent = ((originalCost - current) / originalCost) * 100;

        return (
            <View style={styles.card}>
                {/* Header Image & Title */}
                <View style={styles.cardHeader}>
                    <Image
                        source={asset.photoUrl ? { uri: asset.photoUrl } : require('@/assets/images/placeholder.png')}
                        style={styles.cardImage}
                        defaultSource={require('@/assets/images/placeholder.png')} // Fallback if local asset exists
                    />
                    <View style={styles.cardHeaderContent}>
                        <Text style={styles.assetName}>{asset.name}</Text>
                        <Text style={styles.assetCategory}>{asset.category} ({asset.assetAccount?.code})</Text>
                        <View style={styles.badgeContainer}>
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>Active</Text>
                            </View>
                            {asset.familyOwner && (
                                <View style={[styles.badge, styles.badgeBlue]}>
                                    <Text style={[styles.badgeText, styles.badgeTextBlue]}>{asset.familyOwner.name}'s</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>

                {/* Financial Stats */}
                <View style={styles.statsContainer}>
                    <View style={styles.statRow}>
                        <Text style={styles.statLabel}>Orig Cost:</Text>
                        <Text style={styles.statValue}>KES {originalCost.toLocaleString()}</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.statRow}>
                        <Text style={styles.statLabel}>Curr Value:</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={[styles.statValue, styles.textPrimary]}>KES {current.toLocaleString()}</Text>
                            {dropPercent > 0 && (
                                <Text style={styles.dropText}> ▼ {dropPercent.toFixed(1)}%</Text>
                            )}
                        </View>
                    </View>
                </View>

                {/* Actions */}
                <View style={styles.actionsContainer}>
                    <TouchableOpacity
                        style={[styles.actionBtn, styles.btnOutline]}
                        onPress={() => openDepreciationModal(asset)}
                    >
                        <Ionicons name="trending-down" size={18} color={COLORS.primary} />
                        <Text style={[styles.actionBtnText, styles.textPrimary]}>Update Value</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionBtn, styles.btnOutline]}
                        onPress={() => Alert.alert('Documents', 'Document viewing features coming soon.')}
                    >
                        <Ionicons name="document-text-outline" size={18} color={COLORS.primary} />
                        <Text style={[styles.actionBtnText, styles.textPrimary]}>View Docs</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionBtn, styles.btnRed]}
                        onPress={() => openDisposalModal(asset)}
                    >
                        <Ionicons name="trash-outline" size={18} color={COLORS.error} />
                        <Text style={[styles.actionBtnText, styles.textError]}>Dispose / Sell</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <Stack.Screen options={{ headerShown: false }} />

            {/* Premium Header */}
            <LinearGradient colors={[COLORS.primary, '#0a1f5c']} style={styles.header}>
                <SafeAreaView>
                    <View style={styles.headerTop}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>My Wealth (Assets)</Text>
                        <TouchableOpacity onPress={() => router.push('/fixed-assets/add' as any)} style={styles.addBtn}>
                            <Ionicons name="add" size={28} color={COLORS.white} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.headerStats}>
                        <Text style={styles.statsLabel}>TOTAL FIXED ASSETS VALUE</Text>
                        <Text style={styles.statsValue}>KES {totalValue.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</Text>
                        <Text style={styles.statsSubtext}>(Live Sum of all active assets)</Text>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            {/* Gallery List */}
            <ScrollView
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />}
            >
                {loading && !refreshing ? (
                    <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
                ) : assets.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="car-sport-outline" size={64} color={COLORS.textLight} />
                        <Text style={styles.emptyTitle}>No Assets Yet</Text>
                        <Text style={styles.emptyText}>Track your cars, land, electronics, and more to see your true net worth.</Text>
                        <TouchableOpacity style={styles.createBtn} onPress={() => router.push('/fixed-assets/add' as any)}>
                            <Text style={styles.createBtnText}>Add First Asset</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    assets.map(asset => (
                        <AssetCard key={asset.id} asset={asset} />
                    ))
                )}
            </ScrollView>

            {/* Depreciation Modal */}
            <Modal visible={showDepreciationModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Update Asset Value</Text>
                        <Text style={styles.modalSubtitle}>{selectedAsset?.name}</Text>

                        <Text style={styles.label}>NEW CURRENT VALUE</Text>
                        <TextInput
                            style={styles.input}
                            value={newValue}
                            onChangeText={setNewValue}
                            keyboardType="decimal-pad"
                        />
                        <Text style={styles.hint}>Current Book Value: KES {selectedAsset?.currentValue?.toLocaleString()}</Text>
                        <Text style={styles.hint}>Difference will be recorded as Depreciation Expense.</Text>

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.modalCancel} onPress={() => setShowDepreciationModal(false)}>
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalSubmit} onPress={submitDepreciation} disabled={actionLoading}>
                                {actionLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalSubmitText}>Save Update</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Disposal Modal */}
            <Modal visible={showDisposalModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Dispose / Sell Asset</Text>
                        <Text style={styles.modalSubtitle}>{selectedAsset?.name}</Text>

                        <Text style={styles.label}>SELLING PRICE (0 if written off)</Text>
                        <TextInput
                            style={styles.input}
                            value={disposalPrice}
                            onChangeText={setDisposalPrice}
                            keyboardType="decimal-pad"
                            placeholder="0.00"
                        />

                        {(parseFloat(disposalPrice) || 0) > 0 && (
                            <>
                                <Text style={styles.label}>PROCEEDS DEPOSITED TO</Text>
                                <ScrollView horizontal style={styles.pillContainer} showsHorizontalScrollIndicator={false}>
                                    {depositAccounts.map(acc => (
                                        <TouchableOpacity
                                            key={acc.id}
                                            style={[styles.pill, disposalAccountId === acc.id && styles.pillActive]}
                                            onPress={() => setDisposalAccountId(acc.id)}
                                        >
                                            <Text style={[styles.pillText, disposalAccountId === acc.id && styles.pillTextActive]}>{acc.name}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </>
                        )}

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.modalCancel} onPress={() => setShowDisposalModal(false)}>
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalSubmit, { backgroundColor: COLORS.error }]} onPress={submitDisposal} disabled={actionLoading}>
                                {actionLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalSubmitText}>Confirm Disposal</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        paddingBottom: 25,
        paddingTop: Platform.OS === 'android' ? 40 : 0,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.white,
    },
    backBtn: {
        padding: 8,
    },
    addBtn: {
        padding: 8,
    },
    headerStats: {
        alignItems: 'center',
    },
    statsLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.7)',
        fontWeight: '600',
        marginBottom: 4,
    },
    statsValue: {
        fontSize: 32,
        fontWeight: '800',
        color: COLORS.white,
    },
    statsSubtext: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.6)',
        marginTop: 4,
    },
    listContent: {
        padding: 20,
    },
    card: {
        backgroundColor: COLORS.card,
        borderRadius: 20,
        marginBottom: 20,
        padding: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
        overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row',
        padding: 15,
        alignItems: 'center',
    },
    cardImage: {
        width: 60,
        height: 60,
        borderRadius: 12,
        backgroundColor: COLORS.background,
    },
    cardHeaderContent: {
        marginLeft: 15,
        flex: 1,
    },
    assetName: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 4,
    },
    assetCategory: {
        fontSize: 14,
        color: COLORS.textLight,
        marginBottom: 6,
    },
    badgeContainer: {
        flexDirection: 'row',
    },
    badge: {
        backgroundColor: COLORS.blue50,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        marginRight: 6,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: COLORS.primary,
    },
    badgeBlue: {
        backgroundColor: '#e0f2fe',
    },
    badgeTextBlue: {
        color: '#0284c7',
    },
    statsContainer: {
        backgroundColor: '#f8fafc',
        padding: 15,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: COLORS.border,
    },
    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 4,
    },
    statLabel: {
        fontSize: 14,
        color: COLORS.textLight,
    },
    statValue: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginVertical: 8,
    },
    textPrimary: {
        color: COLORS.primary,
    },
    dropText: {
        color: COLORS.error,
        fontSize: 12,
        fontWeight: '600',
    },
    actionsContainer: {
        flexDirection: 'row',
        padding: 15,
        gap: 15,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 12,
        gap: 6,
    },
    btnOutline: {
        backgroundColor: COLORS.blue50,
    },
    btnRed: {
        backgroundColor: COLORS.red50,
    },
    actionBtnText: {
        fontWeight: '600',
        fontSize: 13,
    },
    textError: {
        color: COLORS.error,
    },
    emptyState: {
        alignItems: 'center',
        paddingTop: 60,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.text,
        marginTop: 20,
    },
    emptyText: {
        textAlign: 'center',
        color: COLORS.textLight,
        marginTop: 10,
        marginHorizontal: 40,
        lineHeight: 22,
    },
    createBtn: {
        marginTop: 30,
        backgroundColor: COLORS.primary,
        paddingVertical: 14,
        paddingHorizontal: 30,
        borderRadius: 30,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    createBtnText: {
        color: COLORS.white,
        fontWeight: '700',
        fontSize: 16,
    },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        padding: 25,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 5,
    },
    modalSubtitle: {
        fontSize: 14,
        color: COLORS.textLight,
        marginBottom: 20,
    },
    label: {
        fontSize: 12,
        fontWeight: '700',
        color: COLORS.textLight,
        marginBottom: 8,
        marginTop: 10,
    },
    input: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        padding: 14,
        fontSize: 18,
        color: COLORS.text,
        marginBottom: 5,
    },
    hint: {
        fontSize: 12,
        color: COLORS.textLight,
        marginTop: 4,
    },
    modalActions: {
        flexDirection: 'row',
        marginTop: 30,
        gap: 15,
    },
    modalCancel: {
        flex: 1,
        padding: 16,
        alignItems: 'center',
        backgroundColor: COLORS.background,
        borderRadius: 14,
    },
    modalCancelText: {
        color: COLORS.textLight,
        fontWeight: '600',
    },
    modalSubmit: {
        flex: 1,
        padding: 16,
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        borderRadius: 14,
    },
    modalSubmitText: {
        color: COLORS.white,
        fontWeight: '700',
    },
    pillContainer: {
        flexDirection: 'row',
        marginVertical: 10,
    },
    pill: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 8,
        marginRight: 10,
    },
    pillActive: {
        backgroundColor: COLORS.blue50,
        borderColor: COLORS.primary,
    },
    pillText: {
        color: COLORS.textLight,
    },
    pillTextActive: {
        color: COLORS.primary,
        fontWeight: '600',
    },
});
