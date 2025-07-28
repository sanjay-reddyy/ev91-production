import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useVerifyOtp, useResendOtp } from '../../api/riderRegistrationApi';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';

interface OtpVerificationScreenProps {
  navigation: StackNavigationProp<any, any>;
  route: RouteProp<any, any>;
}

/**
 * OTP Verification Screen
 * Second step in the rider registration flow
 * Validates the OTP sent to the user's phone
 */
const OtpVerificationScreen: React.FC<OtpVerificationScreenProps> = ({ navigation, route }) => {
  // State
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0); // seconds
  const [expiryTime, setExpiryTime] = useState(59); // OTP expiry countdown

  // API hooks
  const { mutate: verifyOtp, isPending } = useVerifyOtp();
  const { mutate: resendOtp, isPending: isResending } = useResendOtp();
  
  // Route params - Updated for Twilio flow
  const phone = route.params?.phone;
  const tempId = route.params?.tempId; // Required for Twilio flow
  const expiresIn = route.params?.expiresIn; // OTP expiry time in seconds
  
  // Validation
  if (!phone || !tempId) {
    Alert.alert('Error', 'Missing required information', [
      { text: 'Go Back', onPress: () => navigation.goBack() }
    ]);
  }

  // Refs for OTP inputs
  const otpRefs = Array.from({ length: 6 }, () => useRef<TextInput>(null));

  // Timer refs
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const expiryTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Format phone for display
  const formattedPhone = phone ? 
    `+91-${phone.substring(0, 5)}-${phone.substring(5).replace(/./g, 'X')}` : 
    '';

  // Cooldown timer effect
  useEffect(() => {
    if (cooldown > 0) {
      cooldownTimerRef.current = setTimeout(() => setCooldown(cooldown - 1), 1000);
    } else if (cooldownTimerRef.current) {
      clearTimeout(cooldownTimerRef.current);
      cooldownTimerRef.current = null;
    }
    
    return () => {
      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
    };
  }, [cooldown]);
  
  // OTP expiry timer effect
  useEffect(() => {
    expiryTimerRef.current = setTimeout(() => {
      if (expiryTime > 0) {
        setExpiryTime(expiryTime - 1);
      }
    }, 1000);
    
    return () => {
      if (expiryTimerRef.current) clearTimeout(expiryTimerRef.current);
    };
  }, [expiryTime]);

  // Handles both single digit and paste
  const handleOtpChange = (value: string, idx: number) => {
    let digits = value.split('');
    let newOtp = [...otp];
    
    if (digits.length === 1) {
      // Single digit entry
      newOtp[idx] = digits[0];
      setOtp(newOtp);
      setError('');
      
      // Auto-advance if not last field and digit entered
      if (digits[0] && idx < 5) {
        otpRefs[idx + 1].current?.focus();
      }
    } else if (digits.length === 6) {
      // Paste full OTP
      setOtp(digits);
      setError('');
      otpRefs[5].current?.focus();
    } else if (digits.length > 1 && digits.length < 6) {
      // Paste partial OTP
      for (let i = 0; i < digits.length; i++) {
        if (idx + i < 6) newOtp[idx + i] = digits[i];
      }
      setOtp(newOtp);
      setError('');
      
      if (idx + digits.length - 1 < 6) {
        otpRefs[Math.min(idx + digits.length, 5)].current?.focus();
      }
    }
  };

  /**
   * Handle OTP verification with Twilio flow
   */
  const handleVerify = () => {
    // Validate OTP
    if (otp.join('').length !== 6) {
      setError('Please enter all 6 digits of the OTP');
      return;
    }
    
    // Call Twilio API to verify OTP
    verifyOtp(
      { 
        phone: phone.startsWith('+') ? phone : `+91${phone}`, 
        otp: otp.join(''),
        tempId: tempId
      },
      {
        onSuccess: (data) => {
          if (data.success && data.data?.riderId) {
            // Navigate to personal details screen
            navigation.navigate('PersonalDetails', { 
              riderId: data.data.riderId,
              isNewUser: data.data.isNewUser
            });
          } else {
            Alert.alert('Error', data.message || 'Unexpected response from server');
          }
        },
        onError: (error: any) => {
          let errorMsg = 'Invalid OTP';
          
          // Extract error message from response
          if (error?.response?.data?.error) {
            errorMsg = error.response.data.error;
          } else if (error?.response?.data?.message) {
            errorMsg = error.response.data.message;
          } else if (error?.message) {
            errorMsg = error.message;
          }
          
          // Handle common Twilio errors
          if (errorMsg.includes('expired')) {
            errorMsg = 'OTP has expired. Please request a new one.';
            setCooldown(0); // Allow resend immediately
          } else if (errorMsg.includes('attempts')) {
            errorMsg = 'Too many failed attempts. Please request a new OTP.';
            setCooldown(0); // Allow resend immediately
          }
          if (errorMsg.toLowerCase().includes('too many attempts')) {
            setError('You have made too many attempts. Please wait 1 minute before trying again.');
            setCooldown(60); // 1 minute cooldown
          } else {
            setError(errorMsg);
          }
        },
      }
    );
  };

  /**
   * Handle resend OTP via Twilio
   */
  const handleResendOtp = () => {
    if (cooldown > 0) {
      Alert.alert('Please wait', `You can resend OTP in ${cooldown} seconds`);
      return;
    }
    
    resendOtp(
      { tempId },
      {
        onSuccess: (data) => {
          if (data.success) {
            Alert.alert('OTP Sent', 'A new OTP has been sent to your phone');
            setExpiryTime(data.data?.expiresIn || 600); // Reset countdown
            setCooldown(30); // 30 second cooldown before next resend
            setOtp(['', '', '', '', '', '']); // Clear current OTP
            setError('');
            otpRefs[0].current?.focus(); // Focus first input
          } else {
            Alert.alert('Error', data.message || 'Failed to resend OTP');
          }
        },
        onError: (error: any) => {
          const errorMsg = error?.response?.data?.error || 
                          error?.response?.data?.message || 
                          error?.message || 
                          'Failed to resend OTP';
          Alert.alert('Error', errorMsg);
        }
      }
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headline}>Enter OTP</Text>
      
      <Text style={styles.infoText}>
        OTP sent to {formattedPhone}. 
        Expires in 0:{expiryTime.toString().padStart(2, '0')}.
      </Text>
      
      <View style={styles.otpRow}>
        {otp.map((digit, idx) => (
          <TextInput
            key={idx}
            ref={otpRefs[idx]}
            style={[
              styles.otpInput,
              error ? styles.otpInputError : null,
              digit ? styles.otpInputFilled : null
            ]}
            maxLength={6}
            keyboardType="number-pad"
            value={digit}
            onChangeText={value => handleOtpChange(value, idx)}
            onKeyPress={({ nativeEvent }) => {
              if (nativeEvent.key === 'Backspace' && !otp[idx] && idx > 0) {
                otpRefs[idx - 1].current?.focus();
              }
            }}
            autoFocus={idx === 0}
            textContentType="oneTimeCode"
            secureTextEntry={false}
          />
        ))}
      </View>
      
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      
      <TouchableOpacity 
        onPress={handleResendOtp}
        style={styles.resendButton}
        disabled={cooldown > 0}
      >
        <Text style={[
          styles.resendText,
          cooldown > 0 ? styles.resendDisabled : null
        ]}>
          {cooldown > 0 ? `Resend OTP in ${cooldown}s` : 'Resend OTP'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[
          styles.button, 
          (isPending || cooldown > 0 || otp.join('').length !== 6) ? styles.buttonDisabled : null
        ]} 
        onPress={handleVerify} 
        disabled={isPending || cooldown > 0 || otp.join('').length !== 6}
      >
        {isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>
            {cooldown > 0 ? `Wait ${cooldown}s` : 'Verify & Continue'}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f9fafb', 
    justifyContent: 'center', 
    padding: 24 
  },
  headline: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#22543d', 
    marginBottom: 16, 
    textAlign: 'center' 
  },
  infoText: { 
    color: '#6b7280', 
    textAlign: 'center', 
    marginBottom: 24 
  },
  otpRow: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    marginBottom: 24 
  },
  otpInput: { 
    width: 45, 
    height: 55, 
    borderWidth: 1, 
    borderColor: '#d1d5db', 
    borderRadius: 8, 
    textAlign: 'center', 
    fontSize: 24, 
    marginHorizontal: 4, 
    backgroundColor: '#fff' 
  },
  otpInputError: {
    borderColor: '#ef4444'
  },
  otpInputFilled: {
    borderColor: '#22543d',
    backgroundColor: '#f0fdf4'
  },
  errorText: { 
    color: '#ef4444', 
    textAlign: 'center', 
    marginBottom: 16 
  },
  resendButton: {
    alignItems: 'center',
    marginBottom: 24
  },
  resendText: { 
    color: '#22543d', 
    textDecorationLine: 'underline',
    fontSize: 16
  },
  resendDisabled: {
    color: '#9ca3af',
    textDecorationLine: 'none'
  },
  button: { 
    backgroundColor: '#22543d', 
    padding: 16, 
    borderRadius: 8, 
    alignItems: 'center', 
    marginBottom: 12 
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af'
  },
  buttonText: { 
    color: '#fff', 
    fontWeight: '600', 
    fontSize: 16 
  },
});

export default OtpVerificationScreen;
