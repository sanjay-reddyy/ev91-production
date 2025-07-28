import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface WelcomeScreenProps {
  navigation: any;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to EV91!</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('RegisterRider')}
      >
        <Text style={styles.buttonText}>Register</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, styles.loginButton]}
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 32 },
  button: { backgroundColor: '#22543d', padding: 16, borderRadius: 8, alignItems: 'center', marginVertical: 12, width: 200 },
  loginButton: { backgroundColor: '#2b6cb0' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});

export default WelcomeScreen;