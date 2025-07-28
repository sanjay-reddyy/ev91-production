import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';

interface RegistrationSuccessScreenProps {
  navigation: StackNavigationProp<any, any>;
  route: RouteProp<any, any>;
}

const RegistrationSuccessScreen: React.FC<RegistrationSuccessScreenProps> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Image source={require('../../../assets/success.png')} style={styles.image} />
      <Text style={styles.headline}>Registration Complete!</Text>
      <Text style={styles.infoText}>
        Your registration and KYC are complete. You can now start booking rides and enjoy the EV91 experience.
      </Text>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Booking')}>
        <Text style={styles.buttonText}>Go to Booking</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center', padding: 24 },
  image: { width: 120, height: 120, marginBottom: 24 },
  headline: { fontSize: 26, fontWeight: 'bold', color: '#22543d', marginBottom: 16, textAlign: 'center' },
  infoText: { color: '#374151', fontSize: 16, textAlign: 'center', marginBottom: 32 },
  button: { backgroundColor: '#22543d', padding: 16, borderRadius: 8, alignItems: 'center', marginBottom: 12, width: 200 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16, textAlign: 'center' },
});

export default RegistrationSuccessScreen;