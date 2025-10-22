import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Alert,
  CircularProgress,
  FormHelperText,
  IconButton,
  Chip,
} from '@mui/material';
import {
  Close as CloseIcon,
  CloudUpload as UploadIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { riderService, RiderBankDetails } from '../../../services';

interface BankDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  riderId: string;
  bankDetails?: RiderBankDetails | null; // For editing existing bank details
  onSuccess: () => void;
}

const BankDetailsDialog: React.FC<BankDetailsDialogProps> = ({
  open,
  onClose,
  riderId,
  bankDetails,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [accountHolderName, setAccountHolderName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
  const [accountType, setAccountType] = useState<'SAVINGS' | 'CURRENT'>('SAVINGS');
  const [ifscCode, setIfscCode] = useState('');
  const [bankName, setBankName] = useState('');
  const [branchName, setBranchName] = useState('');
  const [branchAddress, setBranchAddress] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [notes, setNotes] = useState('');
  const [proofDocument, setProofDocument] = useState<File | null>(null);
  const [proofType, setProofType] = useState<'PASSBOOK' | 'CANCELLED_CHEQUE' | 'BANK_STATEMENT'>('PASSBOOK');

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Populate form when editing
  useEffect(() => {
    if (bankDetails) {
      setAccountHolderName(bankDetails.accountHolderName);
      setAccountNumber(bankDetails.accountNumber);
      setConfirmAccountNumber(bankDetails.accountNumber);
      setAccountType(bankDetails.accountType);
      setIfscCode(bankDetails.ifscCode);
      setBankName(bankDetails.bankName);
      setBranchName(bankDetails.branchName || '');
      setBranchAddress(bankDetails.branchAddress || '');
      setIsPrimary(bankDetails.isPrimary);
      setNotes(bankDetails.notes || '');
      if (bankDetails.proofDocumentType) {
        setProofType(bankDetails.proofDocumentType);
      }
    } else {
      // Reset form for new entry
      resetForm();
    }
  }, [bankDetails, open]);

  const resetForm = () => {
    setAccountHolderName('');
    setAccountNumber('');
    setConfirmAccountNumber('');
    setAccountType('SAVINGS');
    setIfscCode('');
    setBankName('');
    setBranchName('');
    setBranchAddress('');
    setIsPrimary(false);
    setNotes('');
    setProofDocument(null);
    setProofType('PASSBOOK');
    setErrors({});
    setError(null);
    setSuccess(null);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!accountHolderName.trim()) {
      newErrors.accountHolderName = 'Account holder name is required';
    }

    if (!accountNumber.trim()) {
      newErrors.accountNumber = 'Account number is required';
    } else if (!/^\d{9,18}$/.test(accountNumber)) {
      newErrors.accountNumber = 'Account number must be 9-18 digits';
    }

    if (accountNumber !== confirmAccountNumber) {
      newErrors.confirmAccountNumber = 'Account numbers do not match';
    }

    if (!ifscCode.trim()) {
      newErrors.ifscCode = 'IFSC code is required';
    } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode.toUpperCase())) {
      newErrors.ifscCode = 'Invalid IFSC code format (e.g., SBIN0001234)';
    }

    if (!bankName.trim()) {
      newErrors.bankName = 'Bank name is required';
    }

    if (!bankDetails && !proofDocument) {
      newErrors.proofDocument = 'Bank proof document is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];

      // Validate file type
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        setError('Only images and PDF files are allowed');
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }

      setProofDocument(file);
      setError(null);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const bankData = {
        accountHolderName: accountHolderName.trim(),
        accountNumber: accountNumber.trim(),
        accountType,
        ifscCode: ifscCode.toUpperCase().trim(),
        bankName: bankName.trim(),
        branchName: branchName.trim() || undefined,
        branchAddress: branchAddress.trim() || undefined,
        isPrimary,
        notes: notes.trim() || undefined,
      };

      if (bankDetails) {
        // Update existing bank details
        await riderService.updateBankDetails(
          bankDetails.id,
          bankData,
          proofDocument || undefined,
          proofDocument ? proofType : undefined
        );
        setSuccess('Bank details updated successfully!');
      } else {
        // Add new bank details
        await riderService.addBankDetails(
          riderId,
          bankData,
          proofDocument!,
          proofType
        );
        setSuccess('Bank details added successfully!');
      }

      // Wait a moment to show success message
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Error saving bank details:', err);
      setError(err.response?.data?.message || 'Failed to save bank details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            {bankDetails ? 'Edit Bank Details' : 'Add Bank Details'}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }} icon={<CheckCircleIcon />}>
            {success}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Account Holder Name */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Account Holder Name"
              value={accountHolderName}
              onChange={(e) => setAccountHolderName(e.target.value)}
              error={!!errors.accountHolderName}
              helperText={errors.accountHolderName || 'Name as per bank account'}
              required
              disabled={loading}
            />
          </Grid>

          {/* Account Number */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Account Number"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
              error={!!errors.accountNumber}
              helperText={errors.accountNumber || 'Enter 9-18 digit account number'}
              required
              disabled={loading}
              inputProps={{ maxLength: 18 }}
            />
          </Grid>

          {/* Confirm Account Number */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Confirm Account Number"
              value={confirmAccountNumber}
              onChange={(e) => setConfirmAccountNumber(e.target.value.replace(/\D/g, ''))}
              error={!!errors.confirmAccountNumber}
              helperText={errors.confirmAccountNumber || 'Re-enter account number'}
              required
              disabled={loading}
              inputProps={{ maxLength: 18 }}
            />
          </Grid>

          {/* Account Type */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth required disabled={loading}>
              <InputLabel>Account Type</InputLabel>
              <Select
                value={accountType}
                onChange={(e) => setAccountType(e.target.value as 'SAVINGS' | 'CURRENT')}
                label="Account Type"
              >
                <MenuItem value="SAVINGS">Savings Account</MenuItem>
                <MenuItem value="CURRENT">Current Account</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* IFSC Code */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="IFSC Code"
              value={ifscCode}
              onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
              error={!!errors.ifscCode}
              helperText={errors.ifscCode || 'e.g., SBIN0001234'}
              required
              disabled={loading}
              inputProps={{ maxLength: 11 }}
            />
          </Grid>

          {/* Bank Name */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Bank Name"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              error={!!errors.bankName}
              helperText={errors.bankName}
              required
              disabled={loading}
            />
          </Grid>

          {/* Branch Name */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Branch Name (Optional)"
              value={branchName}
              onChange={(e) => setBranchName(e.target.value)}
              disabled={loading}
            />
          </Grid>

          {/* Branch Address */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Branch Address (Optional)"
              value={branchAddress}
              onChange={(e) => setBranchAddress(e.target.value)}
              disabled={loading}
            />
          </Grid>

          {/* Set as Primary */}
          <Grid item xs={12}>
            <FormControl fullWidth>
              <Box display="flex" alignItems="center" gap={1}>
                <input
                  type="checkbox"
                  checked={isPrimary}
                  onChange={(e) => setIsPrimary(e.target.checked)}
                  disabled={loading}
                  style={{ width: 20, height: 20 }}
                />
                <Typography>Set as primary account for payments</Typography>
              </Box>
              <FormHelperText>
                Primary account will be used for earnings disbursement
              </FormHelperText>
            </FormControl>
          </Grid>

          {/* Bank Proof Document */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Bank Proof Document {!bankDetails && <span style={{ color: 'red' }}>*</span>}
            </Typography>

            <FormControl fullWidth error={!!errors.proofDocument}>
              <InputLabel>Proof Type</InputLabel>
              <Select
                value={proofType}
                onChange={(e) => setProofType(e.target.value as typeof proofType)}
                label="Proof Type"
                disabled={loading}
              >
                <MenuItem value="PASSBOOK">Bank Passbook</MenuItem>
                <MenuItem value="CANCELLED_CHEQUE">Cancelled Cheque</MenuItem>
                <MenuItem value="BANK_STATEMENT">Bank Statement</MenuItem>
              </Select>
              {errors.proofDocument && (
                <FormHelperText>{errors.proofDocument}</FormHelperText>
              )}
            </FormControl>

            <Box mt={2}>
              <input
                accept="image/*,application/pdf"
                style={{ display: 'none' }}
                id="proof-document-upload"
                type="file"
                onChange={handleFileChange}
                disabled={loading}
              />
              <label htmlFor="proof-document-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<UploadIcon />}
                  disabled={loading}
                  fullWidth
                >
                  {proofDocument ? 'Change Document' : 'Upload Document'}
                </Button>
              </label>

              {proofDocument && (
                <Chip
                  label={proofDocument.name}
                  onDelete={() => setProofDocument(null)}
                  color="success"
                  sx={{ mt: 1 }}
                />
              )}

              {bankDetails?.proofDocumentUrl && !proofDocument && (
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Current document: <a href={bankDetails.proofDocumentUrl} target="_blank" rel="noopener noreferrer">View</a>
                </Typography>
              )}

              <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                Accepted formats: Images (JPG, PNG) or PDF • Max size: 5MB
              </Typography>
            </Box>
          </Grid>

          {/* Notes */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Notes (Optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              multiline
              rows={2}
              disabled={loading}
              helperText="Any additional information or remarks"
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          startIcon={loading && <CircularProgress size={20} />}
        >
          {loading ? 'Saving...' : (bankDetails ? 'Update' : 'Add Bank Details')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BankDetailsDialog;
