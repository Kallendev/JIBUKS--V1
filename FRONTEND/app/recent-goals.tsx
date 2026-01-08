import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator, RefreshControl, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import apiService from '@/services/api';
import { Stack } from 'expo-router';

export default function RecentGoalsScreen() {
    const router = useRouter();
    const [goals, setGoals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadGoals();
    }, []);

    const loadGoals = async () => {
        try {
            setLoading(true);
            const goalsData = await apiService.getGoals();
            setGoals(goalsData || []);
        } catch (error) {
            console.error('Failed to load goals:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadGoals();
        setRefreshing(false);
    };

    const calculateProgress = (current: number, target: number) => {
        if (!target || target === 0) return 0;
        return Math.min((current / target) * 100, 100);
    };

    const formatCurrency = (amount: number | undefined | null) => {
        if (amount === undefined || amount === null || isNaN(amount)) {
            return 'Ksh 0';
        }
        return `Ksh ${amount.toLocaleString()}`;
    };

    const handleBack = () => {
        router.back();
    };

    const handleAddGoal = () => {
        try {
            (router.push as any)('/family-dreams');
        } catch (error) {
            console.error('Navigation error:', error);
        }
    };

    if (loading) {
        return (
            <>
                <Stack.Screen options={{ headerShown: false }} />
                <SafeAreaView style={styles.container}>
                    <LinearGradient colors={['#1e3a8a', '#2563eb']} style={styles.header}>
                        <View style={styles.headerContent}>
                            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                                <Ionicons name="arrow-back" size={24} color="#fff" />
                            </TouchableOpacity>
                            <Text style={styles.headerTitle}>Family Goals</Text>
                            <View style={styles.placeholder} />
                        </View>
                    </LinearGradient>
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#2563eb" />
                        <Text style={styles.loadingText}>Loading goals...</Text>
                    </View>
                </SafeAreaView>
            </>
        );
    }

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <SafeAreaView style={styles.container}>
                <LinearGradient colors={['#1e3a8a', '#2563eb']} style={styles.header}>
                    <View style={styles.headerContent}>
                        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Family Goals</Text>
                        <TouchableOpacity onPress={handleAddGoal} style={styles.addButton}>
                            <Ionicons name="add-circle" size={28} color="#f59e0b" />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.subtitle}>Track your family savings goals</Text>
                </LinearGradient>

                <ScrollView
                    style={styles.content}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                >
                    {goals.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="trophy-outline" size={100} color="#cbd5e1" />
                            <Text style={styles.emptyTitle}>No Goals Yet</Text>
                            <Text style={styles.emptyText}>
                                Start by creating your first family savings goal!
                            </Text>
                            <TouchableOpacity style={styles.emptyButton} onPress={handleAddGoal}>
                                <Ionicons name="add-circle" size={20} color="#fff" />
                                <Text style={styles.emptyButtonText}>Create First Goal</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.goalsContainer}>
                            <Text style={styles.goalsCount}>
                                {goals.length} {goals.length === 1 ? 'Goal' : 'Goals'}
                            </Text>

                            {goals.map((goal: any) => {
                                const progress = calculateProgress(goal.currentAmount || 0, goal.targetAmount);
                                const isCompleted = progress >= 100;

                                return (
                                    <View key={goal.id} style={styles.goalCard}>
                                        <View style={styles.goalHeader}>
                                            <View style={styles.goalTitleRow}>
                                                <Ionicons
                                                    name={isCompleted ? "checkmark-circle" : "flag"}
                                                    size={24}
                                                    color={isCompleted ? "#10b981" : "#2563eb"}
                                                />
                                                <Text style={styles.goalTitle}>{goal.name}</Text>
                                            </View>
                                            {isCompleted && (
                                                <View style={styles.completedBadge}>
                                                    <Text style={styles.completedBadgeText}>✓ Completed</Text>
                                                </View>
                                            )}
                                        </View>

                                        {goal.description && (
                                            <Text style={styles.goalDescription}>{goal.description}</Text>
                                        )}

                                        <View style={styles.goalAmounts}>
                                            <Text style={styles.goalCurrent}>
                                                {formatCurrency(Number(goal.currentAmount) || 0)}
                                            </Text>
                                            <Text style={styles.goalTarget}>
                                                / {formatCurrency(Number(goal.targetAmount))}
                                            </Text>
                                        </View>

                                        <View style={styles.progressBarContainer}>
                                            <View
                                                style={[
                                                    styles.progressBar,
                                                    {
                                                        width: `${progress}%`,
                                                        backgroundColor: isCompleted ? '#10b981' : '#2563eb'
                                                    }
                                                ]}
                                            />
                                        </View>

                                        <View style={styles.goalFooter}>
                                            <Text style={styles.goalProgress}>
                                                {progress.toFixed(0)}% Complete
                                            </Text>
                                            {goal.targetDate && (
                                                <View style={styles.deadlineContainer}>
                                                    <Ionicons name="calendar-outline" size={14} color="#64748b" />
                                                    <Text style={styles.goalDeadline}>
                                                        {' '}{new Date(goal.targetDate).toLocaleDateString()}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    )}
                </ScrollView>
            </SafeAreaView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        paddingTop: 20,
        paddingBottom: 24,
        paddingHorizontal: 20,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    addButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    placeholder: {
        width: 40,
    },
    subtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
        textAlign: 'center',
    },
    content: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#64748b',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        marginTop: 60,
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1e293b',
        marginTop: 24,
        marginBottom: 12,
    },
    emptyText: {
        fontSize: 16,
        color: '#64748b',
        textAlign: 'center',
        marginBottom: 32,
        paddingHorizontal: 20,
    },
    emptyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2563eb',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    emptyButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    goalsContainer: {
        padding: 20,
    },
    goalsCount: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748b',
        marginBottom: 16,
    },
    goalCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
            },
            android: {
                elevation: 3,
            },
            web: {
                boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
            },
        }),
    },
    goalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    goalTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    goalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
        flex: 1,
    },
    completedBadge: {
        backgroundColor: '#d1fae5',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    completedBadgeText: {
        color: '#059669',
        fontSize: 12,
        fontWeight: '600',
    },
    goalDescription: {
        fontSize: 14,
        color: '#64748b',
        marginBottom: 16,
    },
    goalAmounts: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 12,
    },
    goalCurrent: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2563eb',
    },
    goalTarget: {
        fontSize: 16,
        color: '#64748b',
        marginLeft: 4,
    },
    progressBarContainer: {
        height: 8,
        backgroundColor: '#e2e8f0',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 12,
    },
    progressBar: {
        height: '100%',
        borderRadius: 4,
    },
    goalFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    goalProgress: {
        fontSize: 14,
        fontWeight: '600',
        color: '#475569',
    },
    deadlineContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    goalDeadline: {
        fontSize: 14,
        color: '#64748b',
    },
});
