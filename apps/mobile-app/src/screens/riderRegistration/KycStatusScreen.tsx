import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  ActivityIndicator, 
  StyleSheet,
  TouchableOpacity,
  Image,
  RefreshControl,
  ScrollView
} from 'react-native';
import { useKycStatus } from '../../api/riderRegistrationApi';
import { Ionicons } from '@expo/vector-icons';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';

interface KycStatusScreenProps {
  navigation: StackNavigationProp<any, any>;
  route: RouteProp<any, any>;
}

type KycStatus = 'pending' | 'processing' | 'approved' | 'rejected';

/**
 * KYC Status Screen
 * Fifth step in the rider registration flow
 * Shows status of KYC verification
 */
const KycStatusScreen: React.FC<KycStatusScreenProps> = ({ navigation, route }) => {
  // Route params
  const riderId = route.params?.riderId;
  
  // Local state
  const [refreshing, setRefreshing] = useState(false);
  
  // API hooks
  const { 
    data, 
    isLoading, 
    error, 
    refetch 
  } = useKycStatus(riderId);
  
  // Extract status from data or default to 'pending'
  const kycStatus = data?.status?.toLowerCase() as KycStatus || 'pending';
  
  // Refreshing state
  useEffect(() => {
    if (!isLoading) {
      setRefreshing(false);
    }
  }, [isLoading]);

  // Auto-navigate when approved
  useEffect(() => {
    if (data && kycStatus === 'approved') {
      navigation.navigate('RentalAgreement', { riderId });
    }
  }, [data, kycStatus, navigation, riderId]);

  // Handle manual refresh
  const handleRefresh = () => {
    setRefreshing(true);
    refetch();
  };

  // Render appropriate status content
  const renderStatusContent = () => {
    if (isLoading && !refreshing) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#22543d" />
          <Text style={styles.loadingText}>Checking KYC status...</Text>
        </View>
      );
    }
    
    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
          <Text style={styles.errorTitle}>Error Checking Status</Text>
          <Text style={styles.errorMessage}>
            {error instanceof Error ? error.message : 'Failed to check KYC status'}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    switch (kycStatus) {
      case 'pending':
        return (
          <View style={styles.statusContainer}>
            {/* <Image
              source={require('../../assets/images/verification-pending.png')}
              style={styles.statusImage}
              resizeMode="contain"
            /> */}
            <Text style={styles.statusTitle}>Verification Pending</Text>
            <Text style={styles.statusDescription}>
              Your documents have been submitted and are waiting for verification.
              This process typically takes 2-4 hours.
            </Text>
            <View style={styles.documentStatusContainer}>
              <View style={styles.documentStatus}>
                <Ionicons
                  name={data?.aadhaar ? "checkmark-circle" : "time-outline"}
                  size={24}
                  color={data?.aadhaar ? "#047857" : "#9ca3af"}
                />
                <Text style={styles.documentName}>Aadhaar Card</Text>
              </View>
              <View style={styles.documentStatus}>
                <Ionicons
                  name={data?.pan ? "checkmark-circle" : "time-outline"}
                  size={24}
                  color={data?.pan ? "#047857" : "#9ca3af"}
                />
                <Text style={styles.documentName}>PAN Card</Text>
              </View>
              <View style={styles.documentStatus}>
                <Ionicons
                  name={data?.dl ? "checkmark-circle" : "time-outline"}
                  size={24}
                  color={data?.dl ? "#047857" : "#9ca3af"}
                />
                <Text style={styles.documentName}>Driving License</Text>
              </View>
              <View style={styles.documentStatus}>
                <Ionicons
                  name={data?.selfie ? "checkmark-circle" : "time-outline"}
                  size={24}
                  color={data?.selfie ? "#047857" : "#9ca3af"}
                />
                <Text style={styles.documentName}>Selfie Verification</Text>
              </View>
            </View>
          </View>
        );
        
      case 'processing':
        return (
          <View style={styles.statusContainer}>
            <ActivityIndicator size="large" color="#22543d" style={styles.processingIndicator} />
            <Text style={styles.statusTitle}>Verification In Progress</Text>
            <Text style={styles.statusDescription}>
              We're currently verifying your documents. This won't take long!
            </Text>
          </View>
        );
        
      case 'rejected':
        return (
          <View style={styles.statusContainer}>
            <Ionicons name="close-circle-outline" size={80} color="#ef4444" />
            <Text style={[styles.statusTitle, styles.rejectedTitle]}>Verification Failed</Text>
            <Text style={styles.statusDescription}>
              We couldn't verify your documents. Please contact our support team
              or try uploading clearer documents.
            </Text>
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => navigation.navigate('KycUpload', { riderId })}
            >
              <Text style={styles.actionButtonText}>Upload Documents Again</Text>
            </TouchableOpacity>
          </View>
        );
        
      case 'approved':
        return (
          <View style={styles.statusContainer}>
            <Ionicons name="checkmark-circle-outline" size={80} color="#047857" />
            <Text style={[styles.statusTitle, styles.approvedTitle]}>Verification Successful</Text>
            <Text style={styles.statusDescription}>
              Your KYC has been approved! You can now proceed to the rental agreement.
            </Text>
            <TouchableOpacity 
              style={[styles.actionButton, styles.approvedButton]} 
              onPress={() => navigation.navigate('RentalAgreement', { riderId })}
            >
              <Text style={styles.actionButtonText}>Continue to Agreement</Text>
            </TouchableOpacity>
          </View>
        );
        
      default:
        return (
          <View style={styles.statusContainer}>
            <Text style={styles.statusTitle}>Unknown Status</Text>
            <Text style={styles.statusDescription}>
              The status of your KYC verification is unknown. Please contact support.
            </Text>
          </View>
        );
    }
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={['#22543d']}
          tintColor="#22543d"
        />
      }
    >
      <Text style={styles.headline}>KYC Verification</Text>
      
      {renderStatusContent()}
      
      <Text style={styles.refreshHint}>
        Pull down to refresh status
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f9fafb',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
    alignItems: 'center',
    minHeight: '100%',
    justifyContent: 'center'
  },
  headline: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#22543d', 
    marginBottom: 24, 
    textAlign: 'center' 
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    color: '#4b5563',
    fontSize: 16,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ef4444',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    textAlign: 'center',
    color: '#6b7280',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  statusContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    width: '100%',
  },
  statusImage: {
    width: 120,
    height: 120,
    marginBottom: 24,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#22543d',
    marginBottom: 12,
  },
  approvedTitle: {
    color: '#047857',
  },
  rejectedTitle: {
    color: '#ef4444',
  },
  statusDescription: {
    textAlign: 'center',
    color: '#6b7280',
    marginBottom: 24,
    fontSize: 16,
  },
  documentStatusContainer: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
  },
  documentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  documentName: {
    marginLeft: 12,
    fontSize: 16,
    color: '#374151',
  },
  processingIndicator: {
    marginVertical: 24,
  },
  actionButton: {
    backgroundColor: '#22543d',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginTop: 16,
  },
  approvedButton: {
    backgroundColor: '#047857',
  },
  actionButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  refreshHint: {
    marginTop: 40,
    color: '#9ca3af',
    fontSize: 14,
  },
});

export default KycStatusScreen;
