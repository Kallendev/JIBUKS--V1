import { StyleSheet, Text, View, Image, TouchableOpacity, Dimensions } from 'react-native'
import React from 'react'
import { useRouter } from 'expo-router'

const { width, height } = Dimensions.get('window')

const Auth = () => {
  const router = useRouter()

  return (
    <View style={styles.container}>
      {/* Logo Section */}
      <View style={styles.logoSection}>
        <Image 
          source={require('../assets/images/homepage.png')} // Using placeholder - replace with homepage.png when you add it
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Get started with JiBUKs</Text>
        <Text style={styles.subtitle}>Your financial answer</Text>
      </View>

      {/* Buttons Section */}
      <View style={styles.buttonsSection}>
        {/* Log In Button */}
         <TouchableOpacity 
          style={styles.loginButton}
          onPress={() => router.push('/login')}
        >
          <Text style={styles.loginButtonText}>Log in</Text>
        </TouchableOpacity>

        {/* Sign Up Button */}
        <TouchableOpacity 
          style={styles.signupButton}
          onPress={() => router.push('/signup')}
        >
          <Text style={styles.signupButtonText}>Sign up</Text>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Continue with Google Button */}
        <TouchableOpacity style={styles.googleButton}>
          <View style={styles.googleButtonContent}>
            <Text style={styles.googleIcon}>G</Text>
            <Text style={styles.googleButtonText}>Continue with google</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Footer Section */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          By proceeding, you consent to get calls, or SMS/RCS messages, including by automated dialer, from JiBUks and its affiliates to the number provided. Text "STOP" to 12345 to opt out.
        </Text>
        <Text style={styles.footerText}>
          Protected by reCAPTCHA: Google{' '}
          <Text style={styles.linkText}>Policy</Text> and{' '}
          <Text style={styles.linkText}>Terms</Text>.
        </Text>
      </View>
    </View>
  )
}

export default Auth

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 80,
    flex: 1,
    justifyContent: 'center',
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 20,
    backgroundColor: '#2E4BC7',
    borderRadius: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  buttonsSection: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loginButton: {
    backgroundColor: '#F5B942',
    paddingVertical: 16,
    borderRadius: 30,
    marginBottom: 16,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#2E4BC7',
    fontSize: 18,
    fontWeight: '600',
  },
  signupButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#2E4BC7',
    marginBottom: 24,
    alignItems: 'center',
  },
  signupButtonText: {
    color: '#2E4BC7',
    fontSize: 18,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    marginHorizontal: 15,
    color: '#999',
    fontSize: 16,
  },
  googleButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#F5B942',
    alignItems: 'center',
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  googleIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4285F4',
    marginRight: 10,
    width: 20,
    textAlign: 'center',
  },
  googleButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '500',
  },
  footer: {
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 8,
  },
  linkText: {
    color: '#2E4BC7',
    textDecorationLine: 'underline',
  },
})