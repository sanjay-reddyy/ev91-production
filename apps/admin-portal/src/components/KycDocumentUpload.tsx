import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Box,
  CircularProgress,
  Typography,
  Grid
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import { RiderKYCSubmission } from '../services/riderService';

interface KycDocumentUploadProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: RiderKYCSubmission) => Promise<void>;
}

const KycDocumentUpload: React.FC<KycDocumentUploadProps> = ({ open, onClose, onSubmit }) => {
  const [documentType, setDocumentType] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  // Validation states
  const [errors, setErrors] = useState({
    documentType: false,
    documentNumber: false,
    file: false
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];
      setFile(selectedFile);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleReset = () => {
    setDocumentType('');
    setDocumentNumber('');
    setFile(null);
    setPreview(null);
    setErrors({
      documentType: false,
      documentNumber: false,
      file: false
    });
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const validateForm = (): boolean => {
    const newErrors = {
      documentType: !documentType,
      documentNumber: !documentNumber,
      file: !file
    };

    setErrors(newErrors);
    return !(newErrors.documentType || newErrors.documentNumber || newErrors.file);
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      await onSubmit({
        documentType,
        documentNumber,
        documentImage: file || undefined
      });

      handleClose();
    } catch (error) {
      console.error("Error uploading KYC document:", error);
    } finally {
      setLoading(false);
    }
  };

  const documentTypes = [
    { value: 'aadhaar', label: 'Aadhaar Card' },
    { value: 'pan', label: 'PAN Card' },
    { value: 'dl', label: 'Driving License' },
    { value: 'selfie', label: 'Selfie Photo' },
    { value: 'other', label: 'Other Document' }
  ];

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Upload KYC Document</DialogTitle>
      <DialogContent>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth margin="normal" error={errors.documentType}>
              <InputLabel id="document-type-label">Document Type</InputLabel>
              <Select
                labelId="document-type-label"
                id="document-type"
                value={documentType}
                label="Document Type"
                onChange={(e) => setDocumentType(e.target.value)}
              >
                {documentTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
                ))}
              </Select>
              {errors.documentType && <FormHelperText>Please select a document type</FormHelperText>}
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              margin="normal"
              fullWidth
              id="document-number"
              label="Document Number"
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
              error={errors.documentNumber}
              helperText={errors.documentNumber ? "Please enter document number" : ""}
            />
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ mt: 2, mb: 2 }}>
              <Button
                component="label"
                variant="outlined"
                startIcon={<CloudUploadIcon />}
                sx={{ mb: 2 }}
                fullWidth
              >
                Select Document Image
                <input
                  type="file"
                  hidden
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                />
              </Button>
              {errors.file && (
                <FormHelperText error>Please select a file to upload</FormHelperText>
              )}

              {file && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    Selected file: {file.name} ({Math.round(file.size / 1024)} KB)
                  </Typography>
                </Box>
              )}
            </Box>
          </Grid>

          {preview && file?.type.startsWith('image/') && (
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <img
                  src={preview}
                  alt="Document Preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '200px',
                    objectFit: 'contain',
                    border: '1px solid #eee',
                    borderRadius: '4px'
                  }}
                />
              </Box>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <FileUploadIcon />}
        >
          {loading ? 'Uploading...' : 'Upload Document'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default KycDocumentUpload;
