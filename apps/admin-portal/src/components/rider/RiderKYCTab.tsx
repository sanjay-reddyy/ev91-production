import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Stack,
  Alert,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  CloudUpload as CloudUploadIcon,
} from '@mui/icons-material';
import { RiderKYC } from '../../services';
import KycDocumentUpload from './KycDocumentUpload';
import { RiderKYCSubmission } from '../../services/riderService';

interface RiderKYCTabProps {
  kycDocuments: RiderKYC[];
  kycStatus: string;
  loading: boolean;
  onViewDocument: (url: string, title: string) => void;
  onVerifyDocument: (kyc: RiderKYC) => void;
  onRequestDocuments: () => void;
  onUploadDocument?: (data: RiderKYCSubmission) => Promise<void>;
}

// Helper function to get a display-friendly document type name
const getDocumentTypeDisplay = (documentType: string): string => {
  const documentTypes: Record<string, string> = {
    'aadhaar': 'Aadhaar Card',
    'pan': 'PAN Card',
    'dl': 'Driving License',
    'selfie': 'Identity Selfie',
    'agreement': 'Signed Agreement', // Hard copy agreement uploaded by backend team
    'rc': 'Registration Certificate',
  };
  return documentTypes[documentType.toLowerCase()] || documentType;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
    case 'verified':
    case 'delivered':
    case 'paid':
      return 'success';
    case 'pending':
      return 'warning';
    case 'rejected':
    case 'cancelled':
    case 'failed':
      return 'error';
    case 'processing':
    case 'picked_up':
      return 'info';
    default:
      return 'default';
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-IN');
};

const RiderKYCTab: React.FC<RiderKYCTabProps> = ({
  kycDocuments,
  kycStatus,
  loading,
  onViewDocument,
  onVerifyDocument,
  onRequestDocuments,
  onUploadDocument,
}) => {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  const handleUploadDocument = async (data: RiderKYCSubmission) => {
    if (onUploadDocument) {
      await onUploadDocument(data);
      setUploadDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <Typography>Loading KYC documents...</Typography>
      </Box>
    );
  }

  if (kycDocuments.length === 0) {
    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card sx={{ p: 3, mb: 3 }}>
            <Alert severity="info" sx={{ mb: 3 }}>
              No KYC documents found for this rider.
            </Alert>

            <Typography variant="body1" paragraph>
              The rider has not uploaded any KYC documents yet. KYC documents are required for
              rider verification and approval.
            </Typography>

            <Typography variant="body1" paragraph>
              Required documents include:
            </Typography>

            <Box component="ul" sx={{ mb: 3 }}>
              <li>Aadhaar Card</li>
              <li>PAN Card</li>
              <li>Driving License</li>
              <li>Identity Selfie</li>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <Typography variant="body2" color="textSecondary">
                Current KYC Status:
              </Typography>
              <Chip
                label={kycStatus || 'Unknown'}
                color={getStatusColor(kycStatus || 'pending') as any}
                size="small"
              />
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
              {onUploadDocument && (
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => setUploadDialogOpen(true)}
                  startIcon={<CloudUploadIcon />}
                >
                  Upload Document
                </Button>
              )}
              <Button
                variant="contained"
                color="primary"
                onClick={onRequestDocuments}
                startIcon={<AssignmentIcon />}
              >
                Request KYC Documents
              </Button>
            </Box>
          </Card>
        </Grid>
      </Grid>
    );
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">KYC Documents</Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Chip
              label={`${kycDocuments.length} Documents`}
              color="primary"
              variant="outlined"
              size="small"
            />
            <Chip
              label={kycStatus || 'Unknown'}
              color={getStatusColor(kycStatus || 'pending') as any}
              size="small"
            />
            {onUploadDocument && (
              <Button
                variant="contained"
                size="small"
                onClick={() => setUploadDialogOpen(true)}
                startIcon={<CloudUploadIcon />}
              >
                Upload Document
              </Button>
            )}
          </Box>
        </Box>
      </Grid>

      {kycDocuments.map((kyc) => (
        <Grid item xs={12} md={6} key={kyc.id}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                }}
              >
                <Typography variant="h6">{getDocumentTypeDisplay(kyc.documentType)}</Typography>
                <Chip
                  label={kyc.verificationStatus}
                  color={getStatusColor(kyc.verificationStatus) as any}
                  size="small"
                />
              </Box>

              {kyc.documentImageUrl && kyc.documentType.toLowerCase() === 'selfie' && (
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
                  <Box
                    component="img"
                    src={kyc.documentImageUrl}
                    alt="Rider Selfie"
                    sx={{
                      width: 120,
                      height: 120,
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid #eee',
                      cursor: 'pointer',
                      '&:hover': {
                        opacity: 0.9,
                        border: '2px solid #3f51b5',
                      },
                    }}
                    onClick={() =>
                      onViewDocument(kyc.documentImageUrl || '', 'Rider Selfie')
                    }
                  />
                </Box>
              )}

              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    Document Number
                  </Typography>
                  <Typography variant="body1">{kyc.documentNumber || 'Not provided'}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    Submitted Date
                  </Typography>
                  <Typography variant="body1">{formatDate(kyc.createdAt)}</Typography>
                </Box>
                {kyc.verificationDate && (
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Verification Date
                    </Typography>
                    <Typography variant="body1">{formatDate(kyc.verificationDate)}</Typography>
                  </Box>
                )}
                {kyc.verificationNotes && (
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Verification Notes
                    </Typography>
                    <Typography variant="body1">{kyc.verificationNotes}</Typography>
                  </Box>
                )}
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {kyc.documentImageUrl && (
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<VisibilityIcon />}
                      onClick={() =>
                        onViewDocument(
                          kyc.documentImageUrl || '',
                          getDocumentTypeDisplay(kyc.documentType)
                        )
                      }
                    >
                      View Document
                    </Button>
                  )}
                  {kyc.verificationStatus === 'pending' && (
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<CheckCircleIcon />}
                      onClick={() => onVerifyDocument(kyc)}
                    >
                      Verify
                    </Button>
                  )}
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      ))}

      {/* KYC Document Upload Dialog */}
      {onUploadDocument && (
        <KycDocumentUpload
          open={uploadDialogOpen}
          onClose={() => setUploadDialogOpen(false)}
          onSubmit={handleUploadDocument}
        />
      )}
    </Grid>
  );
};

export default RiderKYCTab;
