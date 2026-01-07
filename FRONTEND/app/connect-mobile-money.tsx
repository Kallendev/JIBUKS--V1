import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import apiService from '@/services/api';

const { width } = Dimensions.get('window');

export default function ConnectMobileMoneyScreen() {
  const router = useRouter();
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);

  const handleBack = () => {
    router.back();
  };

  /* import apiService from '@/services/api'; included above */
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    if (!selectedProvider) {
      alert('Please select a mobile money provider');
      return;
    }

    try {
      setLoading(true);
      // Save mobile money preference to family metadata
      await apiService.updateFamily({
        metadata: {
          mobileMoneyProvider: selectedProvider,
          mobileMoneyConnected: true,
          mobileMoneyConnectedAt: new Date().toISOString()
        }
      });

      // Navigate to main tabs
      // @ts-ignore
      router.replace('/(tabs)');
    } catch (error) {
      console.error(error);
      alert('Failed to connect mobile money settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    router.replace('/(tabs)');
  };

  const toggleProvider = (provider: string) => {
    setSelectedProvider(selectedProvider === provider ? null : provider);
  };

  return (
    <View style={styles.container}>
      {/* Blue Header Section */}
      <LinearGradient
        colors={['#1e3a8a', '#2563eb']}
        style={styles.header}
      >
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#f59e0b" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Connect Mobile Money</Text>
        <Text style={styles.subtitle}>Auto-track transactions</Text>
      </LinearGradient>

      {/* White Card Section */}
      <View style={styles.card}>
        {/* M-Pesa Card */}
        <TouchableOpacity
          style={[
            styles.providerCard,
            selectedProvider === 'mpesa' && styles.providerCardSelected
          ]}
          onPress={() => toggleProvider('mpesa')}
          activeOpacity={0.7}
        >
          <View style={styles.logoContainer}>
            <Text style={styles.mpesaText}>m<Text style={styles.mpesaRed}>📱</Text>pesa</Text>
          </View>
        </TouchableOpacity>

        {/* Airtel Money Card */}
        <TouchableOpacity
          style={[
            styles.providerCard,
            selectedProvider === 'airtel' && styles.providerCardSelected
          ]}
          onPress={() => toggleProvider('airtel')}
          activeOpacity={0.7}
        >
          <View style={styles.logoContainer}>
            <Text style={styles.airtelText}>airtel</Text>
            <Text style={styles.airtelSubtext}>money</Text>
          </View>
        </TouchableOpacity>

        {/* Info Text */}
        <Text style={styles.infoText}>
          Automatically categorize your income & expenses
        </Text>

        {/* Action Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.connectButton}
            onPress={handleConnect}
            activeOpacity={0.8}
          >
            <Text style={styles.connectButtonText}>Connect</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            activeOpacity={0.8}
          >
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Powered by Apbc</Text>
          <View style={styles.apbcLogo}>
            <View style={styles.logoCircle} />
          </View>
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
    paddingBottom: 60,
  },
  backButton: {
    marginBottom: 24,
    padding: 4,
  },
  headerTitle: {
    fontSize: 24,
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
    marginTop: -30,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 40,
    alignItems: 'center',
  },
  providerCard: {
    width: width - 120,
    height: 120,
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#1e3a8a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  providerCardSelected: {
    borderColor: '#f59e0b',
    backgroundColor: '#fef3c7',
  },
  logoContainer: {
    alignItems: 'center',
  },
  mpesaText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#10b981',
    letterSpacing: -2,
  },
  mpesaRed: {
    color: '#ef4444',
  },
  airtelText: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#ef4444',
    letterSpacing: -1,
  },
  airtelSubtext: {
    fontSize: 22,
    fontWeight: '600',
    color: '#f59e0b',
    marginTop: -8,
  },
  infoText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 24,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 40,
  },
  connectButton: {
    flex: 1,
    backgroundColor: '#9ca3af',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginRight: 12,
  },
  connectButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  skipButton: {
    flex: 1,
    backgroundColor: '#1e3a8a',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginLeft: 12,
  },
  skipButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
    marginTop: 'auto',
    paddingBottom: 32,
  },
  footerText: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  apbcLogo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1e3a8a',
  },
});
