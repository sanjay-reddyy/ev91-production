import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useSaveEmergencyContact } from '../../api/riderRegistrationApi';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';

interface EmergencyContactScreenProps {
  navigation: StackNavigationProp<any, any>;
  route: RouteProp<any, any>;
}

const EmergencyContactScreen: React.FC<EmergencyContactScreenProps> = ({ navigation, route }) => {
  // Route params
  const riderId = route.params?.riderId;

  // Validation
  if (!riderId) {
    Alert.alert('Error', 'Missing rider ID', [
      { text: 'Go Back', onPress: () => navigation.goBack() }
    ]);
  }

  // Form state
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('');
  
  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // API hooks
  const { mutate: saveEmergencyContact, isPending: isSaving } = useSaveEmergencyContact();

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!emergencyName.trim()) newErrors.emergencyName = 'Contact name is required';
    if (!emergencyPhone.trim()) newErrors.emergencyPhone = 'Phone number is required';
    if (!emergencyRelation.trim()) newErrors.emergencyRelation = 'Relation is required';
    
    if (emergencyPhone && !/^\d{10}$/.test(emergencyPhone)) {
      newErrors.emergencyPhone = 'Enter valid 10-digit number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSave = () => {
    if (!validateForm()) {
      Alert.alert('Error', 'Please fix the errors before continuing');
      return;
    }
    
    saveEmergencyContact(
      {
        riderId,
        emergencyName,
        emergencyPhone,
        emergencyRelation
      },
      {
        onSuccess: () => {
          navigation.navigate('KycUpload', { riderId });
        },
        onError: (error) => {
          const errorMessage = error instanceof Error 
            ? error.message 
            : 'Failed to save emergency contact. Please try again.';
            
          Alert.alert('Error', errorMessage);
        }
      }
    );
  };

  const isFormValid = emergencyName.trim() && emergencyPhone.trim() && emergencyRelation.trim() && 
                     /^\d{10}$/.test(emergencyPhone);

  return (
    <View style={styles.container}>
      <Text style={styles.headline}>Emergency Contact Information</Text>
      <Text style={styles.subtitle}>Provide details of someone we can contact in case of emergency</Text>
      
      <Text style={styles.label}>Contact Name</Text>
      <TextInput 
        style={[styles.input, errors.emergencyName ? styles.inputError : null]} 
        placeholder="Full name of emergency contact" 
        value={emergencyName} 
        onChangeText={setEmergencyName} 
      />
      {errors.emergencyName ? <Text style={styles.errorText}>{errors.emergencyName}</Text> : null}
      
      <Text style={styles.label}>Phone Number</Text>
      <TextInput 
        style={[styles.input, errors.emergencyPhone ? styles.inputError : null]} 
        placeholder="10-digit mobile number" 
        value={emergencyPhone} 
        onChangeText={setEmergencyPhone} 
        keyboardType="phone-pad"
        maxLength={10}
      />
      {errors.emergencyPhone ? <Text style={styles.errorText}>{errors.emergencyPhone}</Text> : null}
      
      <Text style={styles.label}>Relation</Text>
      <TextInput 
        style={[styles.input, errors.emergencyRelation ? styles.inputError : null]} 
        placeholder="Parent, Spouse, Sibling, etc." 
        value={emergencyRelation} 
        onChangeText={setEmergencyRelation} 
      />
      {errors.emergencyRelation ? <Text style={styles.errorText}>{errors.emergencyRelation}</Text> : null}
      
      <TouchableOpacity 
        style={[styles.button, (!isFormValid || isSaving) ? styles.buttonDisabled : null]} 
        onPress={handleSave}
        disabled={!isFormValid || isSaving}
      >
        {isSaving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Save & Continue</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f9fafb', 
    padding: 20
  },
  headline: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#22543d', 
    marginBottom: 8, 
    textAlign: 'center' 
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 24,
    textAlign: 'center'
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4b5563',
    marginBottom: 6,
  },
  input: { 
    backgroundColor: '#fff', 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: '#d1d5db', 
    padding: 12, 
    fontSize: 16, 
    marginBottom: 8 
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginBottom: 12,
  },
  button: { 
    backgroundColor: '#22543d', 
    padding: 16, 
    borderRadius: 8, 
    alignItems: 'center', 
    marginTop: 12 
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
  buttonText: { 
    color: '#fff', 
    fontWeight: '600', 
    fontSize: 16 
  },
});

export default EmergencyContactScreen;