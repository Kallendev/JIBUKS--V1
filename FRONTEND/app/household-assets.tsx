import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    Platform,
    StatusBar,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function HouseholdAssetsScreen() {
    const router = useRouter();
    const [selectedCategory, setSelectedCategory] = useState('All');

    // Mock Data based on your uploaded image
    const assets = [
        {
            id: 1,
            category: 'Electronics',
            name: 'Samsung TV',
            value: 65000,
            purchaseDate: 'Jan 2023',
            warranty: 'Jan 2026',
            icon: 'tv-outline'
        },
        {
            id: 2,
            category: 'Electronics',
            name: 'PS5 Console',
            value: 58000,
            purchaseDate: 'Sep 2024',
            warranty: 'Sep 2025',
            icon: 'game-controller-outline'
        },
        {
            id: 3,
            category: 'Appliances',
            name: 'Washing Machine',
            value: 45000,
            purchaseDate: 'Jun 2022',
            warranty: null,
            icon: 'water-outline'
        },
        {
            id: 4,
            category: 'Appliances',
            name: 'Microwave',
            value: 12000,
            purchaseDate: 'Unknown',
            warranty: null,
            icon: 'restaurant-outline'
        },
        {
            id: 5,
            category: 'Furniture',
            name: 'Sofa Set',
            value: 78000,
            purchaseDate: 'Jun 2021',
            warranty: null,
            icon: 'bed-outline'
        },
    ];

    const categories = ['All', 'Electronics', 'Appliances', 'Furniture', 'Vehicles'];

    const filteredAssets = selectedCategory === 'All'
        ? assets
        : assets.filter(a => a.category === selectedCategory);

    const totalValue = assets.reduce((sum, item) => sum + item.value, 0);

    const formatCurrency = (amount: number) => {
        return `KES ${amount.toLocaleString()}`;
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#122f8a" />

            <View style={styles.headerContainer}>
                <LinearGradient
                    colors={['#122f8a', '#0a1a5c']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.header}
                >
                    <View style={styles.headerContent}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Household Assets</Text>
                        <TouchableOpacity style={styles.addButton}>
                            <Ionicons name="add" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    {/* Total Value Card */}
                    <View style={styles.totalValueCard}>
                        <Text style={styles.totalValueLabel}>TOTAL ASSET VALUE</Text>
                        <Text style={styles.totalValueAmount}>{formatCurrency(totalValue)}</Text>
                        <View style={styles.assetCountBadge}>
                            <Ionicons name="cube-outline" size={14} color="#ffffff" />
                            <Text style={styles.assetCountText}>{assets.length} Items</Text>
                        </View>
                    </View>
                </LinearGradient>
            </View>

            <View style={styles.categoryContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
                    {categories.map((cat) => (
                        <TouchableOpacity
                            key={cat}
                            style={[
                                styles.categoryChip,
                                selectedCategory === cat && styles.categoryChipActive
                            ]}
                            onPress={() => setSelectedCategory(cat)}
                        >
                            <Text style={[
                                styles.categoryText,
                                selectedCategory === cat && styles.categoryTextActive
                            ]}>{cat}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {filteredAssets.map((item) => (
                    <View key={item.id} style={styles.assetCard}>
                        <View style={[styles.iconContainer, { backgroundColor: '#e0e7ff' }]}>
                            <Ionicons name={item.icon as any} size={24} color="#122f8a" />
                        </View>

                        <View style={styles.assetInfo}>
                            <View style={styles.assetHeader}>
                                <Text style={styles.assetName}>{item.name}</Text>
                                <Text style={styles.assetValue}>{formatCurrency(item.value)}</Text>
                            </View>

                            <Text style={styles.assetCategory}>{item.category}</Text>

                            <View style={styles.metaRow}>
                                <View style={styles.metaItem}>
                                    <Ionicons name="calendar-outline" size={12} color="#64748b" />
                                    <Text style={styles.metaText}>Bought: {item.purchaseDate}</Text>
                                </View>
                                {item.warranty && (
                                    <View style={[styles.metaItem, { marginLeft: 12 }]}>
                                        <Ionicons name="shield-checkmark-outline" size={12} color="#059669" />
                                        <Text style={[styles.metaText, { color: '#059669' }]}>
                                            Wty: {item.warranty}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>
                ))}

                <View style={{ height: 100 }} />
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
        marginBottom: 0,
    },
    header: {
        paddingTop: Platform.OS === 'android' ? 50 : 20,
        paddingBottom: 24,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    addButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#fe9900', // Orange accent
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    totalValueCard: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    totalValueLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
        marginBottom: 8,
        letterSpacing: 1,
    },
    totalValueAmount: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 12,
    },
    assetCountBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    assetCountText: {
        fontSize: 12,
        color: '#ffffff',
        fontWeight: '600',
        marginLeft: 6,
    },
    categoryContainer: {
        marginTop: 20,
        marginBottom: 10,
    },
    categoryScroll: {
        paddingHorizontal: 20,
        gap: 10,
    },
    categoryChip: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 25,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    categoryChipActive: {
        backgroundColor: '#122f8a',
        borderColor: '#122f8a',
    },
    categoryText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748b',
    },
    categoryTextActive: {
        color: '#ffffff',
    },
    content: {
        padding: 20,
    },
    assetCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#64748b',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    assetInfo: {
        flex: 1,
    },
    assetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    assetName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1e293b',
    },
    assetValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#122f8a',
    },
    assetCategory: {
        fontSize: 12,
        color: '#94a3b8',
        marginBottom: 8,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaText: {
        fontSize: 11,
        color: '#64748b',
        marginLeft: 4,
    },
});
