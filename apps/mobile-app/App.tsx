import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import WelcomeScreen from './src/screens/riderRegistration/WelcomeScreen';
import RegisterRiderScreen from './src/screens/riderRegistration/RegisterRiderScreen';
import OtpVerificationScreen from './src/screens/riderRegistration/OtpVerificationScreen';
import PersonalDetailsScreen from './src/screens/riderRegistration/PersonalDetailsScreen';
import EmergencyContactScreen from './src/screens/riderRegistration/EmergencyContactScreen';
import KycUploadScreen from './src/screens/riderRegistration/KycUploadScreen';
import KycStatusScreen from './src/screens/riderRegistration/KycStatusScreen';
import RentalAgreementScreen from './src/screens/riderRegistration/RentalAgreementScreen';

const Stack = createStackNavigator();
const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Welcome">
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="RegisterRider" component={RegisterRiderScreen} />
          <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />
          <Stack.Screen name="PersonalDetails" component={PersonalDetailsScreen} />
          <Stack.Screen name="EmergencyContact" component={EmergencyContactScreen} />
          <Stack.Screen name="KycUpload" component={KycUploadScreen} />
          <Stack.Screen name="KycStatus" component={KycStatusScreen} />
          <Stack.Screen name="RentalAgreement" component={RentalAgreementScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </QueryClientProvider>
  );
}