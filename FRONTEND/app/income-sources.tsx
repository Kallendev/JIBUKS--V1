import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import apiService from '@/services/api';

const { width } = Dimensions.get('window');

type IncomeSource = 'salary' | 'business' | 'familySupport' | 'otherSources';

export default function IncomeSourcesScreen() {
  const router = useRouter();
  const [selectedSources, setSelectedSources] = useState<IncomeSource[]>([]);

  const toggleSource = (source: IncomeSource) => {
    setSelectedSources(prev =>
      prev.includes(source)
        ? prev.filter(s => s !== source)
        : [...prev, source]
    );
  };

  /* import apiService from '@/services/api'; included above */
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (selectedSources.length === 0) {
      alert('Please select at least one income source to continue.');
      return;
    }

    try {
      setLoading(true);
      // Save income sources to family metadata
      await apiService.updateFamily({
        metadata: {
          incomeSources: selectedSources
        }
      });

      // Navigate to spending categories screen
      // @ts-ignore
      router.push('/spending-categories');
    } catch (error) {
      console.error(error);
      alert('Failed to save income sources');
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
        <Text style={styles.headerTitle}>Money Coming In</Text>
        <Text style={styles.subtitle}>Let's create your Income</Text>
      </LinearGradient>

      {/* White Card Section */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Where does money come from?</Text>
        <Text style={styles.cardSubtitle}>
          Select at least one income source to continue.
        </Text>

        {/* Income Source Options */}
        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={[
              styles.optionCard,
              selectedSources.includes('salary') && styles.optionCardSelected
            ]}
            onPress={() => toggleSource('salary')}
            activeOpacity={0.7}
          >
            <Text style={styles.optionText}>Salary</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.optionCard,
              selectedSources.includes('business') && styles.optionCardSelected
            ]}
            onPress={() => toggleSource('business')}
            activeOpacity={0.7}
          >
            <Text style={styles.optionText}>Business</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.optionCard,
              selectedSources.includes('familySupport') && styles.optionCardSelected
            ]}
            onPress={() => toggleSource('familySupport')}
            activeOpacity={0.7}
          >
            <Text style={styles.optionText}>Family support</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.optionCard,
              selectedSources.includes('otherSources') && styles.optionCardSelected
            ]}
            onPress={() => toggleSource('otherSources')}
            activeOpacity={0.7}
          >
            <Text style={styles.optionText}>Other Sources</Text>
          </TouchableOpacity>
        </View>

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
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 32,
    textAlign: 'center',
  },
  optionsContainer: {
    marginBottom: 32,
  },
  optionCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#f59e0b',
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 24,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  optionCardSelected: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
    borderWidth: 3,
  },
  optionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  continueButton: {
    backgroundColor: '#1e3a8a',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 'auto',
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
