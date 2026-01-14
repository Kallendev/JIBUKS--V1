import { StyleSheet, Text, View, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native'
import React, { useState } from 'react'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import apiService from '@/services/api'
import { showToast } from '@/utils/toast'

const ForgotPassword = () => {
  const router = useRouter()
  const [deliveryMethod, setDeliveryMethod] = useState<'email' | 'sms'>('email')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSendOtp = async () => {
    if (deliveryMethod === 'email' && !email) {
      showToast.error('Error', 'Please enter your email')
      return
    }

    if (deliveryMethod === 'sms' && !phone) {
      showToast.error('Error', 'Please enter your phone number')
      return
    }

    setIsLoading(true)
    try {
      await apiService.forgotPassword(email, phone, deliveryMethod)
      showToast.success('Success', `OTP sent to your ${deliveryMethod === 'email' ? 'email' : 'phone'}`)
      router.push({ pathname: '/verify-otp', params: { email: email || phone, deliveryMethod } } as any)
    } catch (error: any) {
      console.error('Forgot password error:', error)
      showToast.error('Error', error.error || error.message || 'Failed to send OTP')
    } finally {
      setIsLoading(false)
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
            <Ionicons name="lock-closed-outline" size={40} color="#2E4BC7" />
          </View>
          <Text style={styles.title}>Forgot Password?</Text>
          <Text style={styles.subtitle}>Enter your contact information and we'll send you a code to reset your password.</Text>
        </View>

        <View style={styles.formSection}>
          {/* Delivery Method Toggle */}
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[styles.toggleButton, deliveryMethod === 'email' && styles.toggleButtonActive]}
              onPress={() => setDeliveryMethod('email')}
            >
              <Ionicons
                name="mail-outline"
                size={20}
                color={deliveryMethod === 'email' ? '#2E4BC7' : '#666'}
              />
              <Text style={[styles.toggleText, deliveryMethod === 'email' && styles.toggleTextActive]}>
                Email
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toggleButton, deliveryMethod === 'sms' && styles.toggleButtonActive]}
              onPress={() => setDeliveryMethod('sms')}
            >
              <Ionicons
                name="chatbubble-outline"
                size={20}
                color={deliveryMethod === 'sms' ? '#2E4BC7' : '#666'}
              />
              <Text style={[styles.toggleText, deliveryMethod === 'sms' && styles.toggleTextActive]}>
                SMS
              </Text>
            </TouchableOpacity>
          </View>

          {/* Email Input */}
          {deliveryMethod === 'email' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address :</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isLoading}
              />
            </View>
          )}

          {/* Phone Input */}
          {deliveryMethod === 'sms' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number :</Text>
              <TextInput
                style={styles.input}
                placeholder="254703727272"
                placeholderTextColor="#999"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                editable={!isLoading}
              />
              <Text style={styles.hint}>Enter phone number with country code (e.g., 254...)</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleSendOtp}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#2E4BC7" size="small" />
            ) : (
              <Text style={styles.buttonText}>Send Code</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

export default ForgotPassword

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
  formSection: {
    width: '100%',
  },
  toggleContainer: {
    flexDirection: 'row',
    marginBottom: 30,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#333',
    overflow: 'hidden',
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  toggleButtonActive: {
    backgroundColor: '#F5B942',
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  toggleTextActive: {
    color: '#2E4BC7',
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderColor: '#333',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333',
  },
  hint: {
    fontSize: 12,
    color: '#666',
    marginTop: 6,
    fontStyle: 'italic',
  },
  button: {
    backgroundColor: '#F5B942',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#2E4BC7',
    fontSize: 18,
    fontWeight: '600',
  },
})
