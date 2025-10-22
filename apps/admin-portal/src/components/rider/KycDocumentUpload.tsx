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
  Grid,
  LinearProgress,
  Alert
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import { RiderKYCSubmission } from '../../services/riderService';
// We'll implement image compression without the dependency since it might not be installed
// This allows the code to still function without the extra library

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
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>('');

  // Validation states
  const [errors, setErrors] = useState({
    documentType: false,
    documentNumber: false,
    file: false
  });

  // Function to optimize image size if needed
  const optimizeImage = async (originalFile: File): Promise<File> => {
    // Only process images
    if (!originalFile.type.startsWith('image/')) {
      return originalFile;
    }

    // Skip small files
    if (originalFile.size <= 1024 * 1024) { // Less than 1MB
      return originalFile;
    }

    try {
      // Create a canvas to resize the image
      const img = document.createElement('img');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Create a promise to handle image loading
      const imageLoaded = new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.src = URL.createObjectURL(originalFile);
      });

      // Wait for image to load
      await imageLoaded;

      // Calculate new dimensions (max width/height: 1600px)
      const MAX_SIZE = 1600;
      let width = img.width;
      let height = img.height;

      if (width > height && width > MAX_SIZE) {
        height = Math.round((height * MAX_SIZE) / width);
        width = MAX_SIZE;
      } else if (height > MAX_SIZE) {
        width = Math.round((width * MAX_SIZE) / height);
        height = MAX_SIZE;
      }

      // Resize image
      canvas.width = width;
      canvas.height = height;
      ctx?.drawImage(img, 0, 0, width, height);

      // Convert to blob with reduced quality
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob(
          (b) => resolve(b as Blob),
          originalFile.type,
          0.7 // 70% quality
        );
      });

      // Create new file
      const optimizedFile = new File([blob], originalFile.name, {
        type: originalFile.type,
        lastModified: originalFile.lastModified,
      });

      console.log(`Image optimized: ${(originalFile.size/1024).toFixed(1)}KB → ${(optimizedFile.size/1024).toFixed(1)}KB`);
      return optimizedFile;

    } catch (error) {
      console.error("Image optimization failed:", error);
      return originalFile; // Return original if optimization fails
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];

      // Show file size warning if over 5MB
      if (selectedFile.size > 5 * 1024 * 1024) {
        alert("Warning: Large file detected (over 5MB). Upload may take longer or fail.");
      }

      try {
        // Try to optimize the image if it's large
        const processedFile = await optimizeImage(selectedFile);
        setFile(processedFile);

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreview(e.target?.result as string);
        };
        reader.readAsDataURL(processedFile);
      } catch (error) {
        console.error("Error processing file:", error);
        setFile(selectedFile); // Use original file if optimization fails

        // Create preview of original file
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreview(e.target?.result as string);
        };
        reader.readAsDataURL(selectedFile);
      }
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
    setUploadProgress(0);
    setUploadStatus('Preparing upload...');

    try {
      // Check file size to set expectations
      if (file && file.size > 2 * 1024 * 1024) {
        setUploadStatus(`Preparing to upload large file (${(file.size / 1024 / 1024).toFixed(1)}MB)...`);
      }

      console.log("Starting KYC document upload - using improved upload method");

      // Create a function to handle progress updates
      const handleProgress = (progress: number) => {
        setUploadProgress(progress);
        if (progress < 100) {
          setUploadStatus(`Uploading: ${progress}% complete`);
        } else {
          setUploadStatus('Processing uploaded file...');
        }
      };

      // We'll update our parent component's onSubmit to accept this callback
      // This is a type assertion to maintain backward compatibility
      const submitWithProgress = onSubmit as (
        data: RiderKYCSubmission,
        progressCallback?: (progress: number) => void
      ) => Promise<void>;

      await submitWithProgress(
        {
          documentType,
          documentNumber,
          documentImage: file || undefined
        },
        handleProgress
      );

      setUploadStatus('Upload complete!');
      handleClose();
    } catch (error) {
      console.error("Error uploading KYC document:", error);
      setUploadStatus('Upload failed. Please try again.');
      setLoading(false);
    }
  };

  const documentTypes = [
    { value: 'aadhaar', label: 'Aadhaar Card' },
    { value: 'pan', label: 'PAN Card' },
    { value: 'dl', label: 'Driving License' },
    { value: 'selfie', label: 'Selfie Photo' },
    { value: 'agreement', label: 'Signed Agreement' }, // Hard copy agreement
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

                  {/* Show warning for large files */}
                  {file.size > 2 * 1024 * 1024 && (
                    <Typography variant="caption" color="warning.main" sx={{ display: 'block', mt: 1 }}>
                      Large file detected. Upload may take longer than usual.
                    </Typography>
                  )}
                </Box>
              )}

              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                Recommended: Upload clear images under 2MB for faster processing.
                Larger files will be automatically optimized when possible.
              </Typography>
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
      {loading && (
        <Box sx={{ width: '100%', mt: 1, px: 3, pb: 2 }}>
          {uploadProgress !== null ? (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Box sx={{ width: '100%', mr: 1 }}>
                  <LinearProgress variant="determinate" value={uploadProgress} />
                </Box>
                <Box sx={{ minWidth: 35 }}>
                  <Typography variant="body2" color="text.secondary">{`${Math.round(uploadProgress)}%`}</Typography>
                </Box>
              </Box>
              <Typography variant="caption" align="center" sx={{ display: 'block' }}>
                {uploadStatus || 'Uploading document...'}
              </Typography>
            </>
          ) : (
            <>
              <LinearProgress />
              <Typography variant="caption" align="center" sx={{ display: 'block', mt: 1 }}>
                {uploadStatus || 'Preparing upload...'}
              </Typography>
            </>
          )}

          {uploadStatus && uploadStatus.includes('failed') && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Upload failed. Please try again or contact support if the problem persists.
            </Alert>
          )}
        </Box>
      )}

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
