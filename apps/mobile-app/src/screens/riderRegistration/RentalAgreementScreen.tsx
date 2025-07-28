import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Checkbox } from 'react-native-paper';
import { useEsignAgreement } from '../../api/riderRegistrationApi';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';

interface RentalAgreementScreenProps {
  navigation: StackNavigationProp<any, any>;
  route: RouteProp<any, any>;
}

const RentalAgreementScreen: React.FC<RentalAgreementScreenProps> = ({ navigation, route }) => {
  const [agreed, setAgreed] = useState(false);
  const { mutate: esignAgreement, isPending } = useEsignAgreement();
  const riderId = route.params?.riderId;

  const handleSign = () => {
    esignAgreement(
      { riderId, agreementData: { /* fill with agreement fields if needed */ } },
      {
        onSuccess: () => navigation.navigate('Booking'),
        onError: (err) => {
          const errorMessage =
            typeof err === 'object' && err !== null && 'error' in err
              ? (err as { error?: string }).error || 'e-Sign failed'
              : 'e-Sign failed';
          Alert.alert('Error', errorMessage);
        },
      }
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headline}>Review & e-Sign Your Agreement</Text>
      <ScrollView style={styles.agreementBox}>
        <Text style={styles.agreementText}>[Auto-generated rental agreement content goes here...]</Text>
      </ScrollView>
      <View style={styles.consentRow}>
        <Checkbox status={agreed ? 'checked' : 'unchecked'} onPress={() => setAgreed(!agreed)} color="#22543d" />
        <Text style={styles.consentText}>I have read and agree to the terms of the Rental Agreement.</Text>
      </View>
      <TouchableOpacity style={[styles.button, !agreed && styles.buttonDisabled]} disabled={!agreed || isPending} onPress={handleSign}>
        <Text style={styles.buttonText}>{isPending ? 'Signing...' : 'e-Sign Agreement'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6', justifyContent: 'center', padding: 24 },
  headline: { fontSize: 24, fontWeight: 'bold', color: '#374151', marginBottom: 16, textAlign: 'center' },
  agreementBox: { backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#9ca3af', padding: 12, height: 200, marginBottom: 16 },
  agreementText: { color: '#374151', fontSize: 14 },
  consentRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  consentText: { marginLeft: 8, color: '#374151' },
  button: { backgroundColor: '#22543d', padding: 16, borderRadius: 8, alignItems: 'center', marginBottom: 12 },
  buttonDisabled: { backgroundColor: '#9ca3af' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});

export default RentalAgreementScreen;