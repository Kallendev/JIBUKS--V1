import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import apiService from '@/services/api';

const { width } = Dimensions.get('window');

interface BudgetItem {
  category: string;
  amount: string;
}

// Category label mapping
const categoryLabels: Record<string, string> = {
  foodGroceries: 'Food & Groceries',
  rentUtilities: 'Rent & Utilities',
  schoolEducation: 'School Fees & Education',
  transportTravel: 'Transport & Travel',
  medicalHealthcare: 'Medical & Healthcare',
  entertainmentFun: 'Entertainment & Fun',
  clothingPersonal: 'Clothing & Personal',
  savingsInvestments: 'Savings & Investments',
};

export default function MonthlyBudgetsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [budgets, setBudgets] = useState<BudgetItem[]>([]);

  useEffect(() => {
    // Get selected categories from previous screen
    const categoriesParam = params.categories as string;
    if (categoriesParam) {
      try {
        const selectedCategories = JSON.parse(categoriesParam);
        const initialBudgets = selectedCategories.map((cat: string) => ({
          category: cat,
          amount: '',
        }));
        setBudgets(initialBudgets);
      } catch (error) {
        console.error('Failed to parse categories:', error);
      }
    }
  }, [params.categories]);

  const updateBudgetAmount = (category: string, amount: string) => {
    // Only allow numbers
    const numericAmount = amount.replace(/[^0-9]/g, '');
    setBudgets(prev =>
      prev.map(budget =>
        budget.category === category
          ? { ...budget, amount: numericAmount }
          : budget
      )
    );
  };

  /* import apiService from '@/services/api'; included above */
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    // Filter out empty budgets or zero
    const activeBudgets = budgets.filter(b => b.amount && parseFloat(b.amount) > 0);

    if (activeBudgets.length === 0) {
      // Allow skipping if no budgets set? Maybe prompt?
      // For now, let's just proceed or maybe alert if they should set at least one since they selected categories
      // But continuing is fine
    }

    try {
      setLoading(true);
      await apiService.saveBudgets(activeBudgets);

      // Navigate to family dreams (savings goals)
      // @ts-ignore
      router.push('/family-dreams');
    } catch (error) {
      console.error(error);
      alert('Failed to save budgets');
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
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
        <Text style={styles.headerTitle}>Monthly Budgets</Text>
        <Text style={styles.subtitle}>Let's create you monthly budget</Text>
      </LinearGradient>

      {/* White Card Section */}
      <View style={styles.card}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.cardTitle}>Set comfortable spending limits</Text>

          {/* Budget Input Fields */}
          <View style={styles.budgetsContainer}>
            {budgets.map((budget) => (
              <View key={budget.category} style={styles.budgetItem}>
                <Text style={styles.budgetLabel}>
                  {categoryLabels[budget.category] || budget.category}
                </Text>
                <TextInput
                  style={styles.budgetInput}
                  placeholder="Ksh 0"
                  placeholderTextColor="#d1d5db"
                  value={budget.amount ? `Ksh ${budget.amount}` : ''}
                  onChangeText={(text) => updateBudgetAmount(budget.category, text)}
                  keyboardType="numeric"
                />
              </View>
            ))}
          </View>

          <Text style={styles.helperText}>
            We'll alert you before you exceed your budgets
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
    </KeyboardAvoidingView>
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
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 32,
  },
  budgetsContainer: {
    marginBottom: 16,
  },
  budgetItem: {
    marginBottom: 24,
  },
  budgetLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  budgetInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1f2937',
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
