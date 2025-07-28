import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Checkbox } from 'react-native-paper';
import { useStartRegistration } from '../../api/riderRegistrationApi';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';

interface RegisterRiderScreenProps {
  navigation: StackNavigationProp<any, any>;
  route: RouteProp<any, any>;
}

/**
 * Registration screen for collecting phone number and consent
 * First step in the rider registration flow
 */
const RegisterRiderScreen: React.FC<RegisterRiderScreenProps> = ({ navigation }) => {
  // State
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(false);
  
  // API mutation hook
  const { mutate: startRegistration, isPending } = useStartRegistration();

  /**
   * Handle OTP sending
   */
  const handleSendOtp = () => {
    // Validate inputs
    if (!phone) {
      Alert.alert('Error', 'Please enter your mobile number');
      return;
    }
    
    if (!consent) {
      Alert.alert('Error', 'Please agree to the terms and conditions');
      return;
    }
    
    // Call Twilio API to start registration
    startRegistration(
      { 
        phone: phone.startsWith('+') ? phone : `+91${phone.trim()}`, 
        consent 
      },
      {
        onSuccess: (data) => {
          if (data.success && data.data?.tempId) {
            // Navigate to OTP verification screen with Twilio data
            navigation.navigate('OtpVerification', { 
              phone: phone.startsWith('+') ? phone : `+91${phone.trim()}`,
              tempId: data.data.tempId,
              expiresIn: data.data.expiresIn || 600
            });
          } else {
            Alert.alert('Error', data.message || 'Failed to send OTP');
          }
        },
        onError: (error: any) => {
          let errorMsg = 'Failed to send OTP';
          
          // Extract error message from Twilio response
          if (error?.response?.data?.error) {
            errorMsg = error.response.data.error;
          } else if (error?.response?.data?.message) {
            errorMsg = error.response.data.message;
          } else if (error?.message) {
            errorMsg = error.message;
          }
          
          Alert.alert('Error', errorMsg);
        }
      }
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register with EV91</Text>
      
      <Text style={styles.label}>Mobile Number</Text>
      <View style={styles.phoneInputContainer}>
        <Text style={styles.countryCode}>+91</Text>
        <TextInput
          style={styles.phoneInput}
          placeholder="Enter your 10-digit mobile number"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
          maxLength={10}
        />
      </View>
      
      <View style={styles.consentContainer}>
        <Checkbox
          status={consent ? 'checked' : 'unchecked'}
          onPress={() => setConsent(!consent)}
          color="#22543d"
        />
        <Text style={styles.consentText}>
          I agree to the{' '}
          <Text style={styles.link} onPress={() => navigation.navigate('Terms')}>
            Terms of Service
          </Text>{' '}
          and{' '}
          <Text style={styles.link} onPress={() => navigation.navigate('Privacy')}>
            Privacy Policy
          </Text>
        </Text>
      </View>
      
      <TouchableOpacity
        style={[styles.button, !phone || !consent ? styles.buttonDisabled : null]}
        onPress={handleSendOtp}
        disabled={isPending || !phone || !consent}
      >
        {isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Send OTP</Text>
        )}
      </TouchableOpacity>
      
      <View style={styles.loginContainer}>
        <Text style={styles.loginText}>Already have an account?</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginLink}>Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#22543d',
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#374151',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  countryCode: {
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#374151',
  },
  phoneInput: {
    flex: 1,
    height: 50,
    paddingHorizontal: 10,
    fontSize: 16,
  },
  consentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  consentText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#4b5563',
  },
  link: {
    color: '#22543d',
    textDecorationLine: 'underline',
  },
  button: {
    backgroundColor: '#22543d',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    color: '#4b5563',
  },
  loginLink: {
    color: '#22543d',
    fontWeight: '600',
    marginLeft: 5,
  },
});

export default RegisterRiderScreen;
