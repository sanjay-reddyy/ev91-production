import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Box,
  Typography,
} from '@mui/material';
import {
  Close as CloseIcon,
  Visibility as VisibilityIcon,
  Description as DocumentIcon,
} from '@mui/icons-material';

interface DocumentPreviewDialogProps {
  open: boolean;
  url: string | null;
  title: string;
  onClose: () => void;
}

const DocumentPreviewDialog: React.FC<DocumentPreviewDialogProps> = ({
  open,
  url,
  title,
  onClose,
}) => {
  const isPDF = url?.toLowerCase().endsWith('.pdf') || url?.toLowerCase().includes('.pdf?');

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {title}
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
        {url && (
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              p: 2,
              gap: 2,
            }}
          >
            {isPDF ? (
              // PDF viewer - Show message and open button
              <Box
                sx={{
                  textAlign: 'center',
                  p: 4,
                  border: '2px dashed #ddd',
                  borderRadius: 2,
                  width: '100%',
                  bgcolor: '#f9f9f9',
                }}
              >
                <DocumentIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  PDF Document Ready
                </Typography>
                <Typography variant="body2" color="textSecondary" paragraph>
                  Click the button below to open the PDF document in a new tab
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={<VisibilityIcon />}
                  onClick={() => window.open(url, '_blank')}
                  sx={{ mt: 2 }}
                >
                  Open PDF Document
                </Button>
                <Typography variant="caption" display="block" sx={{ mt: 2, color: 'text.secondary' }}>
                  {url.split('/').pop()}
                </Typography>
              </Box>
            ) : (
              // Image viewer
              <Box
                component="img"
                src={url}
                alt={title}
                sx={{
                  maxWidth: '100%',
                  maxHeight: '70vh',
                  objectFit: 'contain',
                }}
              />
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        {url && (
          <Button variant="contained" color="primary" onClick={() => window.open(url, '_blank')}>
            Open Full Size
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default DocumentPreviewDialog;
