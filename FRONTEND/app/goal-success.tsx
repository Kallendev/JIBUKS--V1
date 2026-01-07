import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function GoalSuccessScreen() {
  const router = useRouter();

  const handleCreateAnother = () => {
    router.back(); // Go back to family-dreams
  };

  const handleContinue = () => {
    // @ts-ignore
    router.push('/connect-mobile-money');
  };

  return (
    <View style={styles.container}>
      {/* Blue Header Section */}
      <LinearGradient
        colors={['#1e3a8a', '#2563eb']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Goal Created Successfully!</Text>
      </LinearGradient>

      {/* White Card Section */}
      <View style={styles.card}>
        <View style={styles.messageBox}>
          {/* Success Icon */}
          <View style={styles.iconContainer}>
            <Ionicons name="checkmark-circle" size={48} color="#f59e0b" />
          </View>

          {/* Success Message */}
          <Text style={styles.messageText}>
            Your goal has been created successfully.
          </Text>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              onPress={handleCreateAnother}
              activeOpacity={0.7}
            >
              <Text style={styles.actionText}>Create another goal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleContinue}
              activeOpacity={0.7}
            >
              <Text style={styles.actionText}>Continue</Text>
            </TouchableOpacity>
          </View>

          {/* Info Text */}
          <Text style={styles.infoText}>
            You will access your goals in the manage section after sign up.
          </Text>
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
    paddingBottom: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f59e0b',
    textAlign: 'center',
  },
  card: {
    flex: 1,
    backgroundColor: '#ffffff',
    marginTop: -60,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 40,
    justifyContent: 'space-between',
  },
  messageBox: {
    borderWidth: 2,
    borderColor: '#1e3a8a',
    borderRadius: 20,
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  iconContainer: {
    marginBottom: 16,
  },
  messageText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 32,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 24,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e3a8a',
  },
  infoText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
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
