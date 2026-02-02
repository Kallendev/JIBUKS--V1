import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

const { width } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const handleBegin = () => {
    // Route to the right flow based on tenant type (set at signup)
    const tenantType = user?.tenantType;
    if (tenantType === 'BUSINESS') {
      router.replace('/business-tabs');
    } else if (tenantType === 'FAMILY') {
      router.replace('/family-setup');
    } else {
      // Fallback: no tenant type (e.g. legacy user) — show account type picker
      router.push('/account-type');
    }
  };

  return (
    <View style={styles.container}>
      {/* Blue Header Section */}
      <LinearGradient
        colors={['#1e3a8a', '#2563eb']}
        style={styles.header}
      >
        <Text style={styles.greeting}>Hey there! 👋</Text>
        <Text style={styles.welcomeText}>Welcome to JIBUks!</Text>
      </LinearGradient>

      {/* White Card Section */}
      <View style={styles.card}>
        {/* Illustration */}
        <View style={styles.illustrationContainer}>
          <Image 
            source={require('@/assets/images/mama mboga 1.png')}
            style={styles.illustration}
            resizeMode="contain"
          />
        </View>

        {/* Description Text */}
        <Text style={styles.description}>
          We're excited to help you manage{'\n'}
          your money better- whether for your{'\n'}
          business or your family
        </Text>

        {/* Time Estimate Badge */}
        <View style={styles.timeBadge}>
          <Text style={styles.timeBadgeText}>Estimated time: 3-5 minutes</Text>
        </View>

        {/* Let's Begin Button */}
        <TouchableOpacity
          style={styles.beginButton}
          onPress={handleBegin}
          activeOpacity={0.8}
        >
          <Text style={styles.beginButtonText}>Let's Begin!</Text>
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
  greeting: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fbbf24',
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '500',
  },
  card: {
    flex: 1,
    backgroundColor: '#ffffff',
    marginTop: -20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 40,
    alignItems: 'center',
  },
  illustrationContainer: {
    width: width * 0.65,
    height: width * 0.65,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  illustration: {
    width: '100%',
    height: '100%',
  },
  description: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  timeBadge: {
    backgroundColor: '#9ca3af',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 24,
  },
  timeBadgeText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  beginButton: {
    backgroundColor: '#1e3a8a',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 30,
    width: width * 0.85,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  beginButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 32,
  },
  footerText: {
    fontSize: 12,
    color: '#6b7280',
  },
});
