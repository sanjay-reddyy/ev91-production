import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Stack,
  IconButton,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Star as StarIcon,
  Visibility as VisibilityIcon,
  AccountBalance as AccountBalanceIcon,
} from '@mui/icons-material';
import { riderService, RiderBankDetails } from '../../services';
import BankDetailsDialog from './dialogs/BankDetailsDialog';

interface BankDetailsSectionProps {
  riderId: string;
}

const BankDetailsSection: React.FC<BankDetailsSectionProps> = ({ riderId }) => {
  const [loading, setLoading] = useState(false);
  const [bankDetails, setBankDetails] = useState<RiderBankDetails[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedBank, setSelectedBank] = useState<RiderBankDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; bankId: string | null }>({
    open: false,
    bankId: null,
  });
  const [verifyDialog, setVerifyDialog] = useState<{
    open: boolean;
    bankId: string | null;
    action: 'verify' | 'reject' | null;
  }>({
    open: false,
    bankId: null,
    action: null,
  });
  const [verificationNotes, setVerificationNotes] = useState('');
  const [documentPreview, setDocumentPreview] = useState<{ open: boolean; url: string | null }>({
    open: false,
    url: null,
  });

  useEffect(() => {
    if (riderId) {
      loadBankDetails();
    }
  }, [riderId]);

  const loadBankDetails = async () => {
    console.log('[BankDetailsSection] Loading bank details for riderId:', riderId);
    setLoading(true);
    setError(null);
    try {
      const response = await riderService.getRiderBankDetails(riderId);
      console.log('[BankDetailsSection] API response:', response);
      if (response.success) {
        setBankDetails(response.data || []);
        console.log('[BankDetailsSection] Set bank details:', response.data?.length, 'accounts');
      }
    } catch (err: any) {
      console.error('[BankDetailsSection] Error loading bank details:', err);
      setError('Failed to load bank details');
    } finally {
      setLoading(false);
      console.log('[BankDetailsSection] Loading complete');
    }
  };

  const handleAddNew = () => {
    setSelectedBank(null);
    setDialogOpen(true);
  };

  const handleEdit = (bank: RiderBankDetails) => {
    setSelectedBank(bank);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteDialog.bankId) return;

    try {
      await riderService.deleteBankDetails(deleteDialog.bankId);
      setDeleteDialog({ open: false, bankId: null });
      loadBankDetails();
    } catch (err: any) {
      console.error('Error deleting bank details:', err);
      setError('Failed to delete bank details');
    }
  };

  const handleSetPrimary = async (bankId: string) => {
    try {
      await riderService.setPrimaryAccount(bankId);
      loadBankDetails();
    } catch (err: any) {
      console.error('Error setting primary account:', err);
      setError('Failed to set primary account');
    }
  };

  const handleVerify = async () => {
    if (!verifyDialog.bankId || !verifyDialog.action) return;

    try {
      if (verifyDialog.action === 'verify') {
        await riderService.verifyBankDetails(verifyDialog.bankId, verificationNotes);
      } else {
        if (!verificationNotes) {
          setError('Verification notes are required for rejection');
          return;
        }
        await riderService.rejectBankDetails(verifyDialog.bankId, verificationNotes);
      }
      setVerifyDialog({ open: false, bankId: null, action: null });
      setVerificationNotes('');
      loadBankDetails();
    } catch (err: any) {
      console.error('Error verifying bank details:', err);
      setError('Failed to update verification status');
    }
  };

  const getVerificationColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'warning';
    }
  };

  const maskAccountNumber = (accountNumber: string) => {
    if (!accountNumber) return '';
    if (accountNumber.length <= 4) return accountNumber;
    return `XXXX${accountNumber.slice(-4)}`;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  console.log('[BankDetailsSection] RENDERING - bankDetails count:', bankDetails.length, 'loading:', loading);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6" display="flex" alignItems="center" gap={1}>
          <AccountBalanceIcon /> Bank Account Details ⭐ TAB VIEW
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddNew}>
          Add Bank Account
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {bankDetails.length === 0 ? (
        <Card>
          <CardContent>
            <Box textAlign="center" py={4}>
              <AccountBalanceIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="body1" color="text.secondary" gutterBottom>
                No bank account details added yet
              </Typography>
              <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAddNew} sx={{ mt: 2 }}>
                Add First Bank Account
              </Button>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Account Holder</TableCell>
                <TableCell>Bank Name</TableCell>
                <TableCell>Account Number</TableCell>
                <TableCell>IFSC Code</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Proof</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bankDetails.map((bank) => (
                <TableRow key={bank.id}>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {bank.accountHolderName}
                      </Typography>
                      {bank.isPrimary && (
                        <Chip
                          icon={<StarIcon />}
                          label="Primary"
                          color="primary"
                          size="small"
                          sx={{ mt: 0.5 }}
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{bank.bankName}</Typography>
                    {bank.branchName && (
                      <Typography variant="caption" color="text.secondary">
                        {bank.branchName}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">
                      {maskAccountNumber(bank.accountNumber)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">
                      {bank.ifscCode}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={bank.accountType} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={bank.verificationStatus.toUpperCase()}
                      color={getVerificationColor(bank.verificationStatus)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {bank.proofDocumentUrl ? (
                      <Tooltip title="View Bank Proof">
                        <IconButton
                          size="small"
                          onClick={() => setDocumentPreview({ open: true, url: bank.proofDocumentUrl })}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        No proof
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => handleEdit(bank)} color="primary">
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      {!bank.isPrimary && bank.isActive && (
                        <Tooltip title="Set as Primary">
                          <IconButton size="small" onClick={() => handleSetPrimary(bank.id)} color="warning">
                            <StarIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}

                      {bank.verificationStatus === 'pending' && (
                        <>
                          <Tooltip title="Verify">
                            <IconButton
                              size="small"
                              onClick={() =>
                                setVerifyDialog({ open: true, bankId: bank.id, action: 'verify' })
                              }
                              color="success"
                            >
                              <CheckCircleIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reject">
                            <IconButton
                              size="small"
                              onClick={() =>
                                setVerifyDialog({ open: true, bankId: bank.id, action: 'reject' })
                              }
                              color="error"
                            >
                              <CancelIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}

                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => setDeleteDialog({ open: true, bankId: bank.id })}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add/Edit Bank Details Dialog */}
      <BankDetailsDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setSelectedBank(null);
        }}
        riderId={riderId}
        bankDetails={selectedBank}
        onSuccess={loadBankDetails}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, bankId: null })}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this bank account? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, bankId: null })}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Verification Dialog */}
      <Dialog
        open={verifyDialog.open}
        onClose={() => {
          setVerifyDialog({ open: false, bankId: null, action: null });
          setVerificationNotes('');
        }}
      >
        <DialogTitle>
          {verifyDialog.action === 'verify' ? 'Verify Bank Details' : 'Reject Bank Details'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label={verifyDialog.action === 'reject' ? 'Rejection Reason (Required)' : 'Notes (Optional)'}
            value={verificationNotes}
            onChange={(e) => setVerificationNotes(e.target.value)}
            sx={{ mt: 2 }}
            required={verifyDialog.action === 'reject'}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setVerifyDialog({ open: false, bankId: null, action: null });
              setVerificationNotes('');
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleVerify}
            color={verifyDialog.action === 'verify' ? 'success' : 'error'}
            variant="contained"
          >
            {verifyDialog.action === 'verify' ? 'Verify' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Document Preview Dialog */}
      <Dialog
        open={documentPreview.open}
        onClose={() => setDocumentPreview({ open: false, url: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Bank Proof Document</DialogTitle>
        <DialogContent>
          {documentPreview.url && (
            <Box sx={{ textAlign: 'center' }}>
              {documentPreview.url.endsWith('.pdf') ? (
                <iframe
                  src={documentPreview.url}
                  style={{ width: '100%', height: '600px', border: 'none' }}
                  title="Bank Proof Document"
                />
              ) : (
                <img
                  src={documentPreview.url}
                  alt="Bank Proof"
                  style={{ maxWidth: '100%', maxHeight: '600px' }}
                />
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDocumentPreview({ open: false, url: null })}>Close</Button>
          <Button
            href={documentPreview.url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            variant="contained"
          >
            Open in New Tab
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BankDetailsSection;
