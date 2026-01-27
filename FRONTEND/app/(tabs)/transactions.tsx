import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Modal,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import apiService from '@/services/api';

// Brand Colors
const COLORS = {
  primary: '#122f8a',
  secondary: '#fe9900',
  white: '#ffffff',
  background: '#f8fafc',
  text: '#0f172a',
  textLight: '#64748b',
  border: '#e2e8f0',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  green: '#10b981',
  red: '#ef4444',
  blue: '#3b82f6',
};

interface Cheque {
  id: number;
  chequeNumber: string;
  payee: string;
  amount: number;
  dueDate: Date;
  bank: string;
  accountNumber: string;
  purpose: string;
  status: 'pending' | 'cleared' | 'bounced' | 'voided';
  dateCleared?: Date;
}

export default function ChequeManagerScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showClearModal, setShowClearModal] = useState(false);
  const [selectedCheque, setSelectedCheque] = useState<Cheque | null>(null);
  const [clearanceDate, setClearanceDate] = useState(new Date());
  const [cheques, setCheques] = useState<Cheque[]>([]);
  const [loading, setLoading] = useState(false);
  const [chequeSummary, setChequeSummary] = useState({
    count: 0,
    totalAmount: 0,
    bankBalance: 0,
    realAvailable: 0,
  });

  useEffect(() => {
    if (user?.tenantId) {
      fetchCheques();
      fetchChequeSummary();
    }
  }, [user?.tenantId]);

  const fetchCheques = async () => {
    if (!user?.tenantId) return;

    try {
      setLoading(true);
      const allCheques = await apiService.getAllCheques(user.tenantId);
      setCheques(allCheques.map(c => ({
        ...c,
        dueDate: new Date(c.dueDate),
        dateCleared: c.dateCleared ? new Date(c.dateCleared) : undefined,
        status: c.status.toLowerCase(),
      })));
    } catch (error) {
      console.error('Error fetching cheques:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChequeSummary = async () => {
    if (!user?.tenantId) return;

    try {
      const summary = await apiService.getChequeSummary(user.tenantId);
      setChequeSummary(summary);
    } catch (error) {
      console.error('Error fetching cheque summary:', error);
    }
  };

  // Financial Calculations (now from API)
  const bankBalance = chequeSummary.bankBalance;
  const pendingTotal = chequeSummary.totalAmount;
  const realAvailable = chequeSummary.realAvailable;

  const filteredCheques = cheques.filter(
    cheque =>
      cheque.payee.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cheque.chequeNumber.includes(searchQuery) ||
      cheque.purpose.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isPastDue = (date: Date) => {
    return date < new Date();
  };

  const handleMarkCleared = (cheque: Cheque) => {
    setSelectedCheque(cheque);
    setShowClearModal(true);
  };

  const confirmClearance = async () => {
    if (!selectedCheque || !user?.tenantId) return;

    try {
      // Call API to clear cheque
      await apiService.clearCheque(selectedCheque.id, {
        dateCleared: clearanceDate.toISOString(),
        clearedById: user.id,
        tenantId: user.tenantId,
      });

      Alert.alert(
        '✅ Cheque Cleared!',
        `Cheque #${selectedCheque.chequeNumber} for KES ${selectedCheque.amount.toLocaleString()} has been marked as cleared.`,
        [{ text: 'OK' }]
      );

      // Refresh data
      fetchCheques();
      fetchChequeSummary();

      setShowClearModal(false);
      setSelectedCheque(null);
    } catch (error: any) {
      console.error('Error clearing cheque:', error);
      Alert.alert(
        'Error',
        error.error || 'Failed to clear cheque. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleVoidCheque = (cheque: Cheque) => {
    Alert.alert(
      'Void Cheque?',
      `Are you sure you want to void cheque #${cheque.chequeNumber}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Void',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.voidCheque(cheque.id, 'Voided by user');

              Alert.alert(
                '✅ Cheque Voided',
                `Cheque #${cheque.chequeNumber} has been voided.`,
                [{ text: 'OK' }]
              );

              // Refresh data
              fetchCheques();
              fetchChequeSummary();
            } catch (error: any) {
              console.error('Error voiding cheque:', error);
              Alert.alert(
                'Error',
                error.error || 'Failed to void cheque. Please try again.',
                [{ text: 'OK' }]
              );
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient colors={[COLORS.primary, '#0a1f5c']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Cheque Registry</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* THE IMPACT HEADER - This is the MAGIC! */}
        <View style={styles.impactHeader}>
          {/* Bank Balance (Current) */}
          <View style={[styles.impactCard, styles.impactCardGreen]}>
            <Text style={styles.impactLabel}>Bank Balance</Text>
            <Text style={styles.impactLabelSub}>(Current)</Text>
            <Text style={styles.impactAmount}>
              KES {bankBalance.toLocaleString('en-KE', { minimumFractionDigits: 0 })}
            </Text>
          </View>

          {/* Minus Sign */}
          <View style={styles.minusSign}>
            <Ionicons name="remove" size={24} color="rgba(255,255,255,0.6)" />
          </View>

          {/* Pending Cheques */}
          <View style={[styles.impactCard, styles.impactCardRed]}>
            <Text style={styles.impactLabel}>Pending Cheques</Text>
            <Text style={styles.impactLabelSub}>({cheques.filter(c => c.status === 'pending').length})</Text>
            <Text style={styles.impactAmount}>
              KES {pendingTotal.toLocaleString('en-KE', { minimumFractionDigits: 0 })}
            </Text>
          </View>

          {/* Equals Sign */}
          <View style={styles.equalsSign}>
            <Ionicons name="swap-horizontal" size={24} color="rgba(255,255,255,0.6)" />
          </View>

          {/* Real Available Cash */}
          <View style={[styles.impactCard, styles.impactCardBlue]}>
            <Text style={styles.impactLabel}>Real Available</Text>
            <Text style={styles.impactLabelSub}>(Don't Spend!)</Text>
            <Text style={[styles.impactAmount, styles.impactAmountLarge]}>
              KES {realAvailable.toLocaleString('en-KE', { minimumFractionDigits: 0 })}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Search Bar */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={COLORS.textLight} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search cheque #, payee, or purpose..."
            placeholderTextColor={COLORS.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={COLORS.textLight} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Cheques List */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.listContainer}>
          <Text style={styles.sectionTitle}>
            {filteredCheques.filter(c => c.status === 'pending').length} Pending Cheques
          </Text>

          {filteredCheques.filter(c => c.status === 'pending').length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-circle-outline" size={64} color={COLORS.success} />
              <Text style={styles.emptyText}>All Clear!</Text>
              <Text style={styles.emptySubtext}>No pending cheques</Text>
            </View>
          ) : (
            filteredCheques
              .filter(c => c.status === 'pending')
              .map((cheque) => (
                <View key={cheque.id} style={styles.chequeRow}>
                  {/* Due Date */}
                  <View style={styles.dueDateSection}>
                    <Text style={[
                      styles.dueDateDay,
                      isPastDue(cheque.dueDate) && styles.dueDatePastDue
                    ]}>
                      {cheque.dueDate.getDate()}
                    </Text>
                    <Text style={styles.dueDateMonth}>
                      {cheque.dueDate.toLocaleDateString('en-GB', { month: 'short' })}
                    </Text>
                    {isPastDue(cheque.dueDate) && (
                      <View style={styles.overdueBadge}>
                        <Text style={styles.overdueBadgeText}>!</Text>
                      </View>
                    )}
                  </View>

                  {/* Cheque Details */}
                  <View style={styles.chequeDetails}>
                    <Text style={styles.chequeNumber}>Cheque #{cheque.chequeNumber}</Text>
                    <Text style={styles.bankName}>{cheque.bank} {cheque.accountNumber}</Text>
                    <Text style={styles.payeeName}>{cheque.payee}</Text>
                    <Text style={styles.purpose}>{cheque.purpose}</Text>
                  </View>

                  {/* Amount */}
                  <View style={styles.amountSection}>
                    <Text style={styles.amount}>
                      KES {cheque.amount.toLocaleString('en-KE')}
                    </Text>
                  </View>

                  {/* Actions */}
                  <View style={styles.actionsSection}>
                    <TouchableOpacity
                      style={styles.clearButton}
                      onPress={() => handleMarkCleared(cheque)}
                    >
                      <LinearGradient
                        colors={[COLORS.success, '#059669']}
                        style={styles.clearButtonGradient}
                      >
                        <Ionicons name="checkmark-circle" size={18} color={COLORS.white} />
                        <Text style={styles.clearButtonText}>CLEAR</Text>
                      </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.menuButton}
                      onPress={() => handleVoidCheque(cheque)}
                    >
                      <Ionicons name="ellipsis-vertical" size={20} color={COLORS.textLight} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
          )}

          {/* Cleared Cheques Section */}
          {filteredCheques.filter(c => c.status === 'cleared').length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { marginTop: 32 }]}>
                Recently Cleared
              </Text>
              {filteredCheques
                .filter(c => c.status === 'cleared')
                .map((cheque) => (
                  <View key={cheque.id} style={[styles.chequeRow, styles.chequeRowCleared]}>
                    <View style={styles.dueDateSection}>
                      <Ionicons name="checkmark-circle" size={32} color={COLORS.success} />
                    </View>

                    <View style={styles.chequeDetails}>
                      <Text style={styles.chequeNumber}>Cheque #{cheque.chequeNumber}</Text>
                      <Text style={styles.payeeName}>{cheque.payee}</Text>
                      <Text style={styles.clearedDate}>
                        Cleared: {cheque.dateCleared?.toLocaleDateString('en-GB')}
                      </Text>
                    </View>

                    <View style={styles.amountSection}>
                      <Text style={[styles.amount, { color: COLORS.success }]}>
                        KES {cheque.amount.toLocaleString('en-KE')}
                      </Text>
                    </View>
                  </View>
                ))}
            </>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Clearance Confirmation Modal */}
      <Modal visible={showClearModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Clear Cheque #{selectedCheque?.chequeNumber}?</Text>
              <TouchableOpacity onPress={() => setShowClearModal(false)}>
                <Ionicons name="close" size={28} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <View style={styles.confirmationCard}>
                <Ionicons name="information-circle" size={48} color={COLORS.primary} />
                <Text style={styles.confirmationText}>
                  Confirming payment of{' '}
                  <Text style={styles.confirmationAmount}>
                    KES {selectedCheque?.amount.toLocaleString('en-KE')}
                  </Text>
                  {' '}to{' '}
                  <Text style={styles.confirmationPayee}>{selectedCheque?.payee}</Text>
                </Text>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>DATE CLEARED</Text>
                <View style={styles.dateInput}>
                  <Ionicons name="calendar" size={20} color={COLORS.textLight} />
                  <Text style={styles.dateText}>
                    {clearanceDate.toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
                <Text style={styles.helperText}>
                  💡 This date should match your bank statement
                </Text>
              </View>

              <TouchableOpacity style={styles.confirmButton} onPress={confirmClearance}>
                <LinearGradient
                  colors={[COLORS.success, '#059669']}
                  style={styles.confirmButtonGradient}
                >
                  <Ionicons name="checkmark-circle" size={24} color={COLORS.white} />
                  <Text style={styles.confirmButtonText}>CONFIRM CLEARANCE</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 50 : 12,
    marginBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
  },
  impactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    gap: 8,
  },
  impactCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  impactCardGreen: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  impactCardRed: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  impactCardBlue: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  impactLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  impactLabelSub: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
  },
  impactAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.white,
    textAlign: 'center',
  },
  impactAmountLarge: {
    fontSize: 16,
  },
  minusSign: {
    width: 24,
    alignItems: 'center',
  },
  equalsSign: {
    width: 24,
    alignItems: 'center',
  },
  searchWrapper: {
    paddingHorizontal: 20,
    marginTop: -12,
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  listContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },
  chequeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  chequeRowCleared: {
    opacity: 0.7,
  },
  dueDateSection: {
    width: 60,
    alignItems: 'center',
    position: 'relative',
  },
  dueDateDay: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
  },
  dueDatePastDue: {
    color: COLORS.error,
  },
  dueDateMonth: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textLight,
    textTransform: 'uppercase',
  },
  overdueBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overdueBadgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '800',
  },
  chequeDetails: {
    flex: 1,
  },
  chequeNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 2,
  },
  bankName: {
    fontSize: 11,
    color: COLORS.textLight,
    marginBottom: 4,
  },
  payeeName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  purpose: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  clearedDate: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: '500',
  },
  amountSection: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  actionsSection: {
    flexDirection: 'column',
    gap: 8,
  },
  clearButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  clearButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
  },
  clearButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  menuButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  modalContent: {
    padding: 20,
  },
  confirmationCard: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  confirmationText: {
    fontSize: 15,
    color: COLORS.text,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
  },
  confirmationAmount: {
    fontWeight: '800',
    color: COLORS.primary,
  },
  confirmationPayee: {
    fontWeight: '700',
    color: COLORS.text,
  },
  field: {
    marginBottom: 24,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 14,
    borderWidth: 2,
    borderColor: COLORS.border,
    gap: 10,
  },
  dateText: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '500',
  },
  helperText: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 8,
    fontStyle: 'italic',
  },
  confirmButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  confirmButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    gap: 8,
  },
  confirmButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
