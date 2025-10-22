import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Grid,
  Box,
  Typography,
  Stack,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Paper,
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Description as DocumentIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { RiderKYC } from '../../../services';

interface KYCVerificationDialogProps {
  open: boolean;
  kyc: RiderKYC | null;
  onClose: () => void;
  onVerify: (status: 'verified' | 'rejected', notes: string) => void;
}

// Helper function to get a display-friendly document type name
const getDocumentTypeDisplay = (documentType: string): string => {
  const documentTypes: Record<string, string> = {
    'aadhaar': 'Aadhaar Card',
    'pan': 'PAN Card',
    'dl': 'Driving License',
    'selfie': 'Identity Selfie',
    'rc': 'Registration Certificate',
  };
  return documentTypes[documentType.toLowerCase()] || documentType;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'verified':
      return 'success';
    case 'pending':
      return 'warning';
    case 'rejected':
      return 'error';
    default:
      return 'default';
  }
};

const KYCVerificationDialog: React.FC<KYCVerificationDialogProps> = ({
  open,
  kyc,
  onClose,
  onVerify,
}) => {
  const [verificationStatus, setVerificationStatus] = useState<'verified' | 'rejected'>('verified');
  const [verificationNotes, setVerificationNotes] = useState('');

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setVerificationStatus('verified');
      setVerificationNotes('');
    }
  }, [open]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const handleVerify = () => {
    onVerify(verificationStatus, verificationNotes);
    onClose();
  };

  const isPDF =
    kyc?.documentImageUrl?.toLowerCase().endsWith('.pdf') ||
    kyc?.documentImageUrl?.toLowerCase().includes('.pdf?');

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Verify KYC Document
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {kyc && (
          <Grid container spacing={3} sx={{ mt: 0.5 }}>
            {/* Document details */}
            <Grid item xs={12} md={6}>
              <Stack spacing={3}>
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    Document Type
                  </Typography>
                  <Typography variant="subtitle1" fontWeight="medium">
                    {getDocumentTypeDisplay(kyc.documentType)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    Document Number
                  </Typography>
                  <Typography variant="subtitle1" fontWeight="medium">
                    {kyc.documentNumber || 'Not provided'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    Submitted Date
                  </Typography>
                  <Typography variant="subtitle1">{formatDate(kyc.createdAt)}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    Current Status
                  </Typography>
                  <Chip
                    label={kyc.verificationStatus}
                    color={getStatusColor(kyc.verificationStatus) as any}
                    size="small"
                    sx={{ mt: 0.5 }}
                  />
                </Box>

                <FormControl fullWidth>
                  <InputLabel>Verification Decision</InputLabel>
                  <Select
                    value={verificationStatus}
                    label="Verification Decision"
                    onChange={(e) => setVerificationStatus(e.target.value as 'verified' | 'rejected')}
                  >
                    <MenuItem value="verified">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CheckCircleIcon color="success" fontSize="small" />
                        <span>Verify Document</span>
                      </Box>
                    </MenuItem>
                    <MenuItem value="rejected">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CancelIcon color="error" fontSize="small" />
                        <span>Reject Document</span>
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  label="Verification Notes"
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  multiline
                  rows={3}
                  placeholder={
                    verificationStatus === 'rejected'
                      ? 'Please provide a reason for rejection...'
                      : 'Add any notes about the verification...'
                  }
                  required={verificationStatus === 'rejected'}
                  error={verificationStatus === 'rejected' && !verificationNotes}
                  helperText={
                    verificationStatus === 'rejected' && !verificationNotes
                      ? 'Reason is required when rejecting a document'
                      : ''
                  }
                />
              </Stack>
            </Grid>

            {/* Document preview */}
            <Grid item xs={12} md={6}>
              <Paper
                variant="outlined"
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 2,
                }}
              >
                {kyc.documentImageUrl ? (
                  <Box sx={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Document Preview
                    </Typography>
                    <Box
                      sx={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        overflow: 'hidden',
                        mb: 1,
                        gap: 1,
                      }}
                    >
                      {isPDF ? (
                        // PDF preview - Show icon and button
                        <Box
                          sx={{
                            textAlign: 'center',
                            p: 2,
                            border: '2px dashed #ddd',
                            borderRadius: 2,
                            width: '100%',
                            bgcolor: '#f9f9f9',
                          }}
                        >
                          <DocumentIcon sx={{ fontSize: 60, color: 'primary.main', mb: 1 }} />
                          <Typography variant="body2" color="textSecondary" gutterBottom>
                            PDF Document
                          </Typography>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<VisibilityIcon />}
                            onClick={() => window.open(kyc.documentImageUrl!, '_blank')}
                            sx={{ mt: 1 }}
                          >
                            Open PDF
                          </Button>
                        </Box>
                      ) : (
                        // Image preview
                        <Box
                          component="img"
                          src={kyc.documentImageUrl}
                          alt={kyc.documentType}
                          sx={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            objectFit: 'contain',
                          }}
                        />
                      )}
                    </Box>
                    <Button
                      variant="text"
                      size="small"
                      onClick={() => window.open(kyc.documentImageUrl!, '_blank')}
                    >
                      Open in New Tab
                    </Button>
                  </Box>
                ) : (
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography color="text.secondary">No document image available</Typography>
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleVerify}
          variant="contained"
          color={verificationStatus === 'verified' ? 'primary' : 'error'}
          disabled={verificationStatus === 'rejected' && !verificationNotes}
        >
          {verificationStatus === 'verified' ? 'Verify Document' : 'Reject Document'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default KYCVerificationDialog;
