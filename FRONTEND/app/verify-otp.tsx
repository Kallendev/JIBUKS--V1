import { StyleSheet, Text, View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native'
import React, { useState } from 'react'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import apiService from '@/services/api'
import { showToast } from '@/utils/toast'

const VerifyOtp = () => {
  const router = useRouter()
  const { email, deliveryMethod = 'email' } = useLocalSearchParams<{ email: string; deliveryMethod?: string }>()
  const [otp, setOtp] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleVerify = async () => {
    if (!otp || otp.length !== 4) {
      showToast.error('Error', 'Please enter a valid 4-digit code')
      return
    }

    setIsLoading(true)
    try {
      await apiService.verifyOtp(email, otp)
      showToast.success('Success', 'Code verified')
      router.push({ pathname: '/reset-password', params: { email, otp } } as any)
    } catch (error: any) {
      console.error('Verify OTP error:', error)
      showToast.error('Error', error.error || error.message || 'Invalid code')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    try {
      if (deliveryMethod === 'sms') {
        await apiService.forgotPassword('', email, 'sms')
      } else {
        await apiService.forgotPassword(email, '', 'email')
      }
      showToast.success('Success', 'Code resent')
    } catch (error: any) {
      showToast.error('Error', 'Failed to resend code')
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>

        <View style={styles.logoSection}>
          <View style={styles.iconContainer}>
            <Ionicons name="chatbox-ellipses-outline" size={40} color="#2E4BC7" />
          </View>
          <Text style={styles.title}>Verify Code</Text>
          <Text style={styles.subtitle}>
            Please enter the code we just sent to email {'\n'}
            <Text style={styles.emailText}>{email}</Text>
          </Text>
        </View>

        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Enter Code :</Text>
            <TextInput
              style={[styles.input, { letterSpacing: 10 }]}
              placeholder="0000"
              placeholderTextColor="#999"
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={4}
              editable={!isLoading}
              textAlign="center"
            />
          </View>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleVerify}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#2E4BC7" size="small" />
            ) : (
              <Text style={styles.buttonText}>Verify</Text>
            )}
          </TouchableOpacity>


          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>Didn't receive code? </Text>
            <TouchableOpacity onPress={handleResend}>
              <Text style={styles.resendLink}>Resend</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

export default VerifyOtp

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  backButton: {
    marginBottom: 20,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(46, 75, 199, 0.1)',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  emailText: {
    fontWeight: 'bold',
    color: '#2E4BC7',
  },
  formSection: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
    alignSelf: 'center',
  },
  input: {
    borderWidth: 2,
    borderColor: '#333',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 24,
    backgroundColor: '#fff',
    color: '#333',
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#F5B942',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 30,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#2E4BC7',
    fontSize: 18,
    fontWeight: '600',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resendText: {
    fontSize: 16,
    color: '#666',
  },
  resendLink: {
    fontSize: 16,
    color: '#2E4BC7',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
})
