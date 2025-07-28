import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useSaveProfile, useGetProfile } from '../../api/riderRegistrationApi';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';
import { RiderProfileData } from '../../api/riderRegistrationApi';

interface PersonalDetailsScreenProps {
  navigation: StackNavigationProp<any, any>;
  route: RouteProp<any, any>;
}

/**
 * Personal Details Screen
 * Third step in the rider registration flow
 * Collects rider's personal information and emergency contact
 */
const PersonalDetailsScreen: React.FC<PersonalDetailsScreenProps> = ({ navigation, route }) => {
  // Route params
  const riderId = route.params?.riderId;

  // Validation
  if (!riderId) {
    Alert.alert('Error', 'Missing rider ID', [
      { text: 'Go Back', onPress: () => navigation.goBack() }
    ]);
  }
  
  // Form state
  const [formData, setFormData] = useState<Partial<RiderProfileData>>({
    name: '',
    dob: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    pincode: ''
  });
  
  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isFormValid, setIsFormValid] = useState(false);

  // API hooks
  const { mutate: saveProfile, isPending: isSaving } = useSaveProfile();
  const { 
    data: existingProfile, 
    isLoading: isLoadingProfile 
  } = useGetProfile(riderId);

  // Load existing profile data if available
  useEffect(() => {
    if (existingProfile) {
      // Convert ISO date format to DD/MM/YYYY for display
      const convertedProfile = { ...existingProfile };
      if (convertedProfile.dob && /^\d{4}-\d{2}-\d{2}$/.test(convertedProfile.dob)) {
        const [year, month, day] = convertedProfile.dob.split('-');
        convertedProfile.dob = `${day}/${month}/${year}`;
      }
      
      setFormData(prevData => ({
        ...prevData,
        ...convertedProfile
      }));
    }
  }, [existingProfile]);

  // Update form fields
  const updateField = (field: keyof RiderProfileData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Handle DOB input with auto-formatting
  const handleDobChange = (text: string) => {
    // Remove all non-numeric characters
    const numbersOnly = text.replace(/\D/g, '');
    
    let formatted = numbersOnly;
    
    // Add slashes automatically
    if (numbersOnly.length > 2) {
      formatted = numbersOnly.slice(0, 2) + '/' + numbersOnly.slice(2);
    }
    if (numbersOnly.length > 4) {
      formatted = numbersOnly.slice(0, 2) + '/' + numbersOnly.slice(2, 4) + '/' + numbersOnly.slice(4, 8);
    }
    
    updateField('dob', formatted);
  };

  // Validate form on data change
  useEffect(() => {
    validateForm();
  }, [formData]);

  // Validate all fields
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Required fields
    if (!formData.name?.trim()) newErrors.name = 'Full name is required';
    if (!formData.dob?.trim()) newErrors.dob = 'Date of birth is required';
    if (!formData.address1?.trim()) newErrors.address1 = 'Address is required';
    if (!formData.city?.trim()) newErrors.city = 'City is required';
    if (!formData.state?.trim()) newErrors.state = 'State is required';
    if (!formData.pincode?.trim()) newErrors.pincode = 'Pincode is required';
    
    // Format validations
    if (formData.dob && !/^\d{2}\/\d{2}\/\d{4}$/.test(formData.dob)) {
      newErrors.dob = 'Use format DD/MM/YYYY';
    }
    
    if (formData.pincode && !/^\d{6}$/.test(formData.pincode)) {
      newErrors.pincode = 'Enter valid 6-digit pincode';
    }

    setErrors(newErrors);
    setIsFormValid(Object.keys(newErrors).length === 0);
  };

  /**
   * Handle form submission
   */
  const handleNext = () => {
    validateForm();
    
    if (!isFormValid) {
      Alert.alert('Error', 'Please fix the errors before continuing');
      return;
    }
    
    saveProfile(
      {
        riderId,
        ...formData as RiderProfileData
      },
      {
        onSuccess: () => {
          navigation.navigate('EmergencyContact', { riderId });
        },
        onError: (error) => {
          const errorMessage = error instanceof Error 
            ? error.message 
            : 'Failed to save profile information. Please try again.';
            
          Alert.alert('Error', errorMessage);
        }
      }
    );
  };

  // Show loading state while fetching profile data
  if (isLoadingProfile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#22543d" />
        <Text style={styles.loadingText}>Loading profile data...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoidContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.headline}>Personal Details</Text>
        <Text style={styles.subtitle}>Please enter your information accurately</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <Text style={styles.label}>Full Name</Text>
          <TextInput 
            style={[styles.input, errors.name ? styles.inputError : null]} 
            placeholder="Enter your full name as per ID" 
            value={formData.name} 
            onChangeText={(text) => updateField('name', text)} 
          />
          {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
          
          <Text style={styles.label}>Date of Birth</Text>
          <TextInput 
            style={[styles.input, errors.dob ? styles.inputError : null]} 
            placeholder="DD/MM/YYYY" 
            value={formData.dob} 
            onChangeText={handleDobChange} 
            keyboardType="numeric"
            maxLength={10}
          />
          {errors.dob ? <Text style={styles.errorText}>{errors.dob}</Text> : null}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Residential Address</Text>
          
          <Text style={styles.label}>Address Line 1</Text>
          <TextInput 
            style={[styles.input, errors.address1 ? styles.inputError : null]} 
            placeholder="House/Flat No., Building Name, Street" 
            value={formData.address1} 
            onChangeText={(text) => updateField('address1', text)} 
          />
          {errors.address1 ? <Text style={styles.errorText}>{errors.address1}</Text> : null}
          
          <Text style={styles.label}>Address Line 2 (Optional)</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Area, Landmark, etc." 
            value={formData.address2} 
            onChangeText={(text) => updateField('address2', text)} 
          />
          
          <Text style={styles.label}>City</Text>
          <TextInput 
            style={[styles.input, errors.city ? styles.inputError : null]} 
            placeholder="Enter your city" 
            value={formData.city} 
            onChangeText={(text) => updateField('city', text)} 
          />
          {errors.city ? <Text style={styles.errorText}>{errors.city}</Text> : null}
          
          <Text style={styles.label}>State</Text>
          <TextInput 
            style={[styles.input, errors.state ? styles.inputError : null]} 
            placeholder="Enter your state" 
            value={formData.state} 
            onChangeText={(text) => updateField('state', text)} 
          />
          {errors.state ? <Text style={styles.errorText}>{errors.state}</Text> : null}
          
          <Text style={styles.label}>Pincode</Text>
          <TextInput 
            style={[styles.input, errors.pincode ? styles.inputError : null]} 
            placeholder="6-digit pincode" 
            value={formData.pincode} 
            onChangeText={(text) => updateField('pincode', text)} 
            keyboardType="numeric"
            maxLength={6}
          />
          {errors.pincode ? <Text style={styles.errorText}>{errors.pincode}</Text> : null}
        </View>
        
        <TouchableOpacity 
          style={[styles.button, (!isFormValid || isSaving) ? styles.buttonDisabled : null]} 
          onPress={handleNext} 
          disabled={!isFormValid || isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Save & Continue</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidContainer: {
    flex: 1,
  },
  container: { 
    flex: 1, 
    backgroundColor: '#f9fafb',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 10,
    color: '#4b5563',
    fontSize: 16,
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: '600', 
    color: '#374151', 
    marginBottom: 16
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

export default PersonalDetailsScreen;
