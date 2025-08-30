import React, { useState } from 'react';
import {
  Grid,
  Typography,
  Divider,
  Button,
  Box,
  IconButton,
  LinearProgress,
  Chip,
  Card,
  CardContent,
  Alert
} from '@mui/material';
import {
  PhotoCamera as PhotoIcon,
  Description as DocumentIcon,
  Delete as DeleteIcon,
  CloudUpload as UploadIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Preview as PreviewIcon
} from '@mui/icons-material';

interface UploadStatus {
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress?: number;
  message?: string;
  url?: string;
}

interface Step3PhotosAndDocumentsProps {
  vehiclePhotos: File[];
  rcDocument: File | null;
  insuranceDocument: File | null;
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>, type: 'vehicle' | 'rc' | 'insurance') => void;
  removeFile: (type: 'vehicle' | 'rc' | 'insurance', index?: number) => void;
  // Optional props for upload status tracking
  uploadStatus?: {
    vehiclePhotos?: UploadStatus[];
    rcDocument?: UploadStatus;
    insuranceDocument?: UploadStatus;
  };
  // Optional prop for vehicle ID when editing
  vehicleId?: string;
  // Optional prop for existing documents
  existingDocuments?: {
    vehiclePhotos?: Array<{ id: string; fileName: string; fileUrl: string; uploadDate: string }>;
    rcDocument?: { id: string; fileName: string; fileUrl: string; uploadDate: string };
    insuranceDocument?: { id: string; fileName: string; fileUrl: string; uploadDate: string };
  };
  // Optional callbacks for document management
  onPreviewDocument?: (url: string, fileName: string) => void;
  onDeleteExistingDocument?: (documentId: string, type: 'vehicle' | 'rc' | 'insurance') => void;
}

const Step3_PhotosAndDocuments: React.FC<Step3PhotosAndDocumentsProps> = ({
  vehiclePhotos,
  rcDocument,
  insuranceDocument,
  handleFileUpload,
  removeFile,
  uploadStatus,
  vehicleId,
  existingDocuments,
  onPreviewDocument,
  onDeleteExistingDocument,
}) => {
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());

  const getStatusIcon = (status?: UploadStatus) => {
    if (!status) return null;

    switch (status.status) {
      case 'uploading':
        return <LinearProgress variant="determinate" value={status.progress || 0} sx={{ width: 60 }} />;
      case 'success':
        return <CheckIcon color="success" fontSize="small" />;
      case 'error':
        return <ErrorIcon color="error" fontSize="small" />;
      default:
        return null;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const truncateFileName = (fileName: string, maxLength: number = 20) => {
    if (fileName.length <= maxLength) return fileName;
    const extension = fileName.split('.').pop();
    const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
    const truncatedName = nameWithoutExt.substring(0, maxLength - extension!.length - 4) + '...';
    return `${truncatedName}.${extension}`;
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>Photos & Documents</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Upload vehicle photos, RC document, and insurance policy document. All documents will be stored securely in AWS S3.
        </Typography>
        <Divider sx={{ mb: 2 }} />
      </Grid>

      {/* Existing Documents (for edit mode) */}
      {existingDocuments && (
        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom>Existing Documents</Typography>

          {/* Existing Vehicle Photos */}
          {existingDocuments.vehiclePhotos && existingDocuments.vehiclePhotos.length > 0 && (
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  Current Vehicle Photos ({existingDocuments.vehiclePhotos.length})
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {existingDocuments.vehiclePhotos.map((photo) => (
                    <Chip
                      key={photo.id}
                      label={truncateFileName(photo.fileName)}
                      variant="outlined"
                      color="primary"
                      icon={<PreviewIcon />}
                      onClick={() => onPreviewDocument?.(photo.fileUrl, photo.fileName)}
                      onDelete={() => onDeleteExistingDocument?.(photo.id, 'vehicle')}
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Existing RC Document */}
          {existingDocuments.rcDocument && (
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>Current RC Document</Typography>
                <Chip
                  label={truncateFileName(existingDocuments.rcDocument.fileName)}
                  variant="outlined"
                  color="secondary"
                  icon={<PreviewIcon />}
                  onClick={() => onPreviewDocument?.(existingDocuments.rcDocument!.fileUrl, existingDocuments.rcDocument!.fileName)}
                  onDelete={() => onDeleteExistingDocument?.(existingDocuments.rcDocument!.id, 'rc')}
                />
              </CardContent>
            </Card>
          )}

          {/* Existing Insurance Document */}
          {existingDocuments.insuranceDocument && (
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>Current Insurance Document</Typography>
                <Chip
                  label={truncateFileName(existingDocuments.insuranceDocument.fileName)}
                  variant="outlined"
                  color="info"
                  icon={<PreviewIcon />}
                  onClick={() => onPreviewDocument?.(existingDocuments.insuranceDocument!.fileUrl, existingDocuments.insuranceDocument!.fileName)}
                  onDelete={() => onDeleteExistingDocument?.(existingDocuments.insuranceDocument!.id, 'insurance')}
                />
              </CardContent>
            </Card>
          )}
        </Grid>
      )}

      {/* Vehicle Photos Upload */}
      <Grid item xs={12}>
        <Typography variant="subtitle1" gutterBottom>
          Vehicle Photos
          <Typography component="span" variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
            (Recommended: Front, Back, Left, Right views)
          </Typography>
        </Typography>
        <input
          accept="image/*"
          style={{ display: 'none' }}
          id="vehicle-photos-upload"
          multiple
          type="file"
          onChange={(e) => handleFileUpload(e, 'vehicle')}
        />
        <label htmlFor="vehicle-photos-upload">
          <Button
            variant="outlined"
            component="span"
            startIcon={<PhotoIcon />}
            sx={{ mb: 2 }}
          >
            Upload Vehicle Photos
          </Button>
        </label>
        {vehiclePhotos.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
            {vehiclePhotos.map((file, index) => (
              <Card key={index} sx={{ minWidth: 200, position: 'relative' }}>
                <CardContent sx={{ pb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ flex: 1, mr: 1 }}>
                      <Typography variant="caption" sx={{ fontWeight: 'medium' }}>
                        {truncateFileName(file.name)}
                      </Typography>
                      <Typography variant="caption" display="block" color="text.secondary">
                        {formatFileSize(file.size)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getStatusIcon(uploadStatus?.vehiclePhotos?.[index])}
                      <IconButton
                        size="small"
                        onClick={() => removeFile('vehicle', index)}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                  {uploadStatus?.vehiclePhotos?.[index]?.message && (
                    <Typography variant="caption" color="error" display="block" sx={{ mt: 0.5 }}>
                      {uploadStatus.vehiclePhotos[index].message}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Grid>

      {/* RC Document Upload */}
      <Grid item xs={12} md={6}>
        <Typography variant="subtitle1" gutterBottom>
          RC Document
          <Typography component="span" variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
            (Registration Certificate - PDF/Image)
          </Typography>
        </Typography>
        <input
          accept="image/*,.pdf"
          style={{ display: 'none' }}
          id="rc-document-upload"
          type="file"
          onChange={(e) => handleFileUpload(e, 'rc')}
        />
        <label htmlFor="rc-document-upload">
          <Button
            variant="outlined"
            component="span"
            startIcon={<DocumentIcon />}
            color="secondary"
            sx={{ mb: 2 }}
          >
            Upload RC Document
          </Button>
        </label>
        {rcDocument && (
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ flex: 1, mr: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                    {truncateFileName(rcDocument.name)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatFileSize(rcDocument.size)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {getStatusIcon(uploadStatus?.rcDocument)}
                  <IconButton
                    size="small"
                    onClick={() => removeFile('rc')}
                    color="error"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
              {uploadStatus?.rcDocument?.message && (
                <Typography variant="caption" color="error" display="block" sx={{ mt: 1 }}>
                  {uploadStatus.rcDocument.message}
                </Typography>
              )}
            </CardContent>
          </Card>
        )}
      </Grid>

      {/* Insurance Document Upload */}
      <Grid item xs={12} md={6}>
        <Typography variant="subtitle1" gutterBottom>
          Insurance Document
          <Typography component="span" variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
            (Insurance Policy - PDF/Image)
          </Typography>
        </Typography>
        <input
          accept="image/*,.pdf"
          style={{ display: 'none' }}
          id="insurance-document-upload"
          type="file"
          onChange={(e) => handleFileUpload(e, 'insurance')}
        />
        <label htmlFor="insurance-document-upload">
          <Button
            variant="outlined"
            component="span"
            startIcon={<DocumentIcon />}
            color="info"
            sx={{ mb: 2 }}
          >
            Upload Insurance Document
          </Button>
        </label>
        {insuranceDocument && (
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ flex: 1, mr: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                    {truncateFileName(insuranceDocument.name)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatFileSize(insuranceDocument.size)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {getStatusIcon(uploadStatus?.insuranceDocument)}
                  <IconButton
                    size="small"
                    onClick={() => removeFile('insurance')}
                    color="error"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
              {uploadStatus?.insuranceDocument?.message && (
                <Typography variant="caption" color="error" display="block" sx={{ mt: 1 }}>
                  {uploadStatus.insuranceDocument.message}
                </Typography>
              )}
            </CardContent>
          </Card>
        )}
      </Grid>

      {/* Upload Summary */}
      <Grid item xs={12}>
        <Card variant="outlined" sx={{ bgcolor: 'grey.50' }}>
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>Upload Summary</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PhotoIcon fontSize="small" color="primary" />
                <Typography variant="body2">
                  Vehicle Photos: {vehiclePhotos.length} selected
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <DocumentIcon fontSize="small" color="secondary" />
                <Typography variant="body2">
                  RC Document: {rcDocument ? '1 selected' : 'None'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <DocumentIcon fontSize="small" color="info" />
                <Typography variant="body2">
                  Insurance Document: {insuranceDocument ? '1 selected' : 'None'}
                </Typography>
              </Box>
            </Box>

            {(vehiclePhotos.length > 0 || rcDocument || insuranceDocument) && (
              <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                Documents will be uploaded to AWS S3 when you submit the form
              </Typography>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default Step3_PhotosAndDocuments;
