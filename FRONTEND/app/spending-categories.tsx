import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import apiService from '@/services/api';

const { width } = Dimensions.get('window');

type SpendingCategory =
  | 'foodGroceries'
  | 'rentUtilities'
  | 'schoolEducation'
  | 'transportTravel'
  | 'medicalHealthcare'
  | 'entertainmentFun'
  | 'clothingPersonal'
  | 'savingsInvestments';

interface Category {
  id: SpendingCategory;
  label: string;
}

const categories: Category[] = [
  { id: 'foodGroceries', label: 'Food & Groceries' },
  { id: 'rentUtilities', label: 'Rent & Utilities' },
  { id: 'schoolEducation', label: 'School Fees & Education' },
  { id: 'transportTravel', label: 'Transport & Travel' },
  { id: 'medicalHealthcare', label: 'Medical & Healthcare' },
  { id: 'entertainmentFun', label: 'Entertainment & Fun' },
  { id: 'clothingPersonal', label: 'Clothing & Personal' },
  { id: 'savingsInvestments', label: 'Savings & Investments' },
];

export default function SpendingCategoriesScreen() {
  const router = useRouter();
  const [selectedCategories, setSelectedCategories] = useState<SpendingCategory[]>([]);

  const toggleCategory = (categoryId: SpendingCategory) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  /* import apiService from '@/services/api'; included above */
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (selectedCategories.length === 0) {
      alert('Please select at least one category to continue.');
      return;
    }

    try {
      setLoading(true);
      // Save spending categories to family metadata
      await apiService.updateFamily({
        metadata: {
          spendingCategories: selectedCategories
        }
      });

      // Navigate to monthly budgets with selected categories
      // @ts-ignore
      router.push({
        pathname: '/monthly-budgets' as any,
        params: {
          categories: JSON.stringify(selectedCategories),
        },
      });
    } catch (error) {
      console.error(error);
      alert('Failed to save spending categories');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    router.replace('/(tabs)');
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
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color="#f59e0b" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerTitle}>Spending Categories</Text>
        <Text style={styles.subtitle}>Let's create your spending categories</Text>
      </LinearGradient>

      {/* White Card Section */}
      <View style={styles.card}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.cardTitle}>What do you spend money on?</Text>
          <Text style={styles.cardSubtitle}>
            Select at least one category to continue.
          </Text>

          {/* Categories List */}
          <View style={styles.categoriesContainer}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryItem}
                onPress={() => toggleCategory(category.id)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.checkbox,
                  selectedCategories.includes(category.id) && styles.checkboxChecked
                ]}>
                  {selectedCategories.includes(category.id) && (
                    <Ionicons name="checkmark" size={20} color="#1e3a8a" />
                  )}
                </View>
                <Text style={styles.categoryLabel}>{category.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.helperText}>
            We'll help track spending in these areas
          </Text>

          {/* Continue Button */}
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
            activeOpacity={0.8}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Powered by Apbc</Text>
          </View>
        </ScrollView>
      </View>
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
    paddingBottom: 40,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    padding: 4,
  },
  skipText: {
    fontSize: 16,
    color: '#ffffff',
    textDecorationLine: 'underline',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f59e0b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#ffffff',
  },
  card: {
    flex: 1,
    backgroundColor: '#ffffff',
    marginTop: -20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 32,
  },
  categoriesContainer: {
    marginBottom: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 8,
  },
  checkbox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#1f2937',
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  checkboxChecked: {
    backgroundColor: '#ffffff',
    borderColor: '#1e3a8a',
    borderWidth: 2,
  },
  categoryLabel: {
    fontSize: 16,
    color: '#1f2937',
    flex: 1,
  },
  helperText: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  continueButton: {
    backgroundColor: '#1e3a8a',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
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
});
