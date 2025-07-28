import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  Image,
  ScrollView,
  ActivityIndicator,
  Platform
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useUploadKycDocument, useSubmitKyc } from '../../api/riderRegistrationApi';
import { Ionicons } from '@expo/vector-icons';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';

interface KycUploadScreenProps {
  navigation: StackNavigationProp<any, any>;
  route: RouteProp<any, any>;
}

type DocumentType = 'aadhaar' | 'pan' | 'dl' | 'selfie' | 'rc';

interface DocumentStatus {
  file: any;
  uploaded: boolean;
  uploading: boolean;
  error?: string;
}

/**
 * KYC Document Upload Screen
 * Fourth step in the rider registration flow
 * Allows user to upload required KYC documents
 */
const KycUploadScreen: React.FC<KycUploadScreenProps> = ({ navigation, route }) => {
  // Route params
  const riderId = route.params?.riderId;
  
  // Validation
  if (!riderId) {
    Alert.alert('Error', 'Missing rider ID', [
      { text: 'Go Back', onPress: () => navigation.goBack() }
    ]);
  }
  
  // Document state management
  const [documents, setDocuments] = useState<Record<DocumentType, DocumentStatus>>({
    aadhaar: { file: null, uploaded: false, uploading: false },
    pan: { file: null, uploaded: false, uploading: false },
    dl: { file: null, uploaded: false, uploading: false },
    selfie: { file: null, uploaded: false, uploading: false },
    rc: { file: null, uploaded: false, uploading: false }
  });
  
  // API hooks
  const { mutate: uploadDocument } = useUploadKycDocument();
  const { mutate: submitForVerification, isPending: isSubmitting } = useSubmitKyc();
  
  // Permission check for camera
  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Camera access is required to take a selfie for KYC verification.'
        );
      }
    })();
  }, []);

  // Calculate whether form can be submitted
  const canSubmit = documents.aadhaar.uploaded && 
                    documents.dl.uploaded && 
                    documents.selfie.uploaded &&
                    !isSubmitting;

  /**
   * Pick document from file system
   */
  const pickDocument = async (docType: DocumentType) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ 
        type: ['image/*', 'application/pdf'] 
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedFile = result.assets[0];
        
        // Update UI state
        setDocuments(prev => ({
          ...prev,
          [docType]: { 
            ...prev[docType], 
            file: selectedFile,
            uploading: true,
            error: undefined
          }
        }));
        
        // Upload file to server
        uploadDocumentToServer(docType, selectedFile);
      }
    } catch (err) {
      console.error(`Error picking ${docType} document:`, err);
      Alert.alert('Error', `Failed to select ${docType} document. Please try again.`);
    }
  };

  /**
   * Take photo using camera
   */
  const takeSelfie = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selfieImage = result.assets[0];
        
        // Update UI state
        setDocuments(prev => ({
          ...prev,
          selfie: { 
            ...prev.selfie, 
            file: selfieImage,
            uploading: true,
            error: undefined
          }
        }));
        
        // Upload selfie to server
        uploadDocumentToServer('selfie', selfieImage);
      }
    } catch (err) {
      console.error('Error taking selfie:', err);
      Alert.alert('Error', 'Failed to take selfie. Please try again.');
    }
  };

  /**
   * Upload document to server
   */
  const uploadDocumentToServer = (docType: DocumentType, file: any) => {
    // Create file object with proper URI handling for different platforms
    const fileUri = Platform.OS === 'ios' ? file.uri.replace('file://', '') : file.uri;
    const fileToUpload = {
      uri: fileUri,
      type: file.mimeType || 'application/octet-stream',
      name: file.name || `${docType}_${Date.now()}.${fileUri.split('.').pop()}`
    };
    
    // Upload to server - pass the file object directly, not FormData
    uploadDocument(
      { 
        riderId, 
        documentType: docType, 
        file: fileToUpload as any // Cast to any to handle React Native file object
      },
      {
        onSuccess: (response) => {
          // Update document status on success
          setDocuments(prev => ({
            ...prev,
            [docType]: {
              ...prev[docType],
              uploading: false,
              uploaded: true
            }
          }));
        },
        onError: (error) => {
          // Extract error message
          const errorMsg = error instanceof Error 
            ? error.message 
            : `Failed to upload ${docType}. Please try again.`;
          
          // Update document status on error
          setDocuments(prev => ({
            ...prev,
            [docType]: {
              ...prev[docType],
              uploading: false,
              error: errorMsg
            }
          }));
          
          Alert.alert('Upload Failed', errorMsg);
        }
      }
    );
  };

  /**
   * Submit all documents for KYC verification
   */
  const handleSubmit = () => {
    // Validate required documents
    if (!documents.aadhaar.uploaded || !documents.dl.uploaded || !documents.selfie.uploaded) {
      Alert.alert('Required Documents', 'Aadhaar, Driving License, and Selfie are required');
      return;
    }
    
    // Submit for verification
    submitForVerification(
      { riderId },
      {
        onSuccess: () => {
          navigation.navigate('KycStatus', { riderId });
        },
        onError: (error) => {
          const errorMsg = error instanceof Error 
            ? error.message 
            : 'KYC submission failed. Please try again.';
            
          Alert.alert('Error', errorMsg);
        }
      }
    );
  };

  /**
   * Render document upload button with status
   */
  const renderDocumentButton = (
    docType: DocumentType, 
    label: string, 
    required = false,
    useCamera = false
  ) => {
    const docStatus = documents[docType];
    const buttonAction = useCamera ? takeSelfie : () => pickDocument(docType);
    
    let buttonText = docStatus.uploaded ? `${label} Uploaded ✓` : `Upload ${label}`;
    let buttonStyle: any[] = [styles.documentButton];
    let statusIcon = null;
    
    if (docStatus.uploading) {
      buttonText = `Uploading ${label}...`;
      buttonStyle.push(styles.uploadingButton);
      statusIcon = <ActivityIndicator size="small" color="#fff" style={styles.buttonIcon} />;
    } else if (docStatus.uploaded) {
      buttonStyle.push(styles.uploadedButton);
      statusIcon = <Ionicons name="checkmark-circle" size={20} color="#fff" style={styles.buttonIcon} />;
    } else if (docStatus.error) {
      buttonStyle.push({ backgroundColor: '#ef4444' });
      statusIcon = <Ionicons name="alert-circle" size={20} color="#fff" style={styles.buttonIcon} />;
    }
    
    return (
      <View style={styles.documentSection}>
        <View style={styles.documentHeader}>
          <Text style={styles.documentTitle}>
            {label} {required && <Text style={styles.requiredMark}>*</Text>}
          </Text>
          {docStatus.error && (
            <Text style={styles.errorText}>{docStatus.error}</Text>
          )}
        </View>
        
        <TouchableOpacity 
          style={buttonStyle} 
          onPress={buttonAction}
          disabled={docStatus.uploading || docStatus.uploaded}
        >
          {statusIcon}
          <Text style={styles.buttonText}>{buttonText}</Text>
        </TouchableOpacity>
        
        {docStatus.file && docStatus.file.uri && docType === 'selfie' && (
          <Image 
            source={{ uri: docStatus.file.uri }} 
            style={styles.previewImage} 
            resizeMode="contain"
          />
        )}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.headline}>Upload Your Documents</Text>
      <Text style={styles.subtitle}>
        Please upload clear, readable images of your documents for faster verification
      </Text>
      
      {renderDocumentButton('aadhaar', 'Aadhaar Card', true)}
      
      {renderDocumentButton('pan', 'PAN Card')}
      
      {renderDocumentButton('dl', 'Driving License', true)}
      
      <View style={styles.documentSection}>
        <View style={styles.documentHeader}>
          <Text style={styles.documentTitle}>
            Selfie with Driving License <Text style={styles.requiredMark}>*</Text>
          </Text>
        </View>
        <Text style={styles.infoText}>
          Take a clear selfie holding your Driving License next to your face for identity verification.
        </Text>
        {renderDocumentButton('selfie', 'Selfie', true, true)}
      </View>
      
      {renderDocumentButton('rc', 'Registration Certificate')}
      
      <TouchableOpacity 
        style={[
          styles.submitButton, 
          !canSubmit ? styles.disabledButton : null
        ]} 
        onPress={handleSubmit} 
        disabled={!canSubmit}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>
            {canSubmit ? 'Submit for Verification' : 'Upload Required Documents'}
          </Text>
        )}
      </TouchableOpacity>
      
      <Text style={styles.bottomNote}>
        All documents are securely stored and only used for KYC verification purposes.
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
    paddingBottom: 40
  },
  headline: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#22543d', 
    marginBottom: 8, 
    textAlign: 'center' 
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 24,
    textAlign: 'center',
    paddingHorizontal: 20
  },
  documentSection: { 
    marginBottom: 20 
  },
  documentHeader: {
    marginBottom: 8
  },
  documentTitle: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#374151' 
  },
  requiredMark: {
    color: '#ef4444',
    fontWeight: 'bold'
  },
  infoText: { 
    color: '#6b7280', 
    marginBottom: 12,
    fontSize: 14
  },
  documentButton: { 
    backgroundColor: '#22543d', 
    padding: 14,
    borderRadius: 8, 
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center'
  },
  uploadingButton: {
    backgroundColor: '#9ca3af'
  },
  uploadedButton: {
    backgroundColor: '#047857'
  },
  buttonText: { 
    color: '#fff', 
    fontWeight: '600', 
    fontSize: 16
  },
  buttonIcon: {
    marginRight: 8
  },
  previewImage: {
    width: '100%',
    height: 150,
    marginTop: 12,
    borderRadius: 8,
    backgroundColor: '#e5e7eb'
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4
  },
  submitButton: { 
    backgroundColor: '#22543d', 
    padding: 16, 
    borderRadius: 8, 
    alignItems: 'center', 
    marginVertical: 20
  },
  disabledButton: {
    backgroundColor: '#9ca3af'
  },
  submitButtonText: { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 16
  },
  bottomNote: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 12
  }
});

export default KycUploadScreen;
