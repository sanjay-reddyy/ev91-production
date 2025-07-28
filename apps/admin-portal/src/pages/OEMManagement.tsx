import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  Avatar,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Business as BusinessIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { oemService, OEM } from '../services/oemService';

interface OEMManagementProps {}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
}

const OEMManagement: React.FC<OEMManagementProps> = () => {
  const [oems, setOEMs] = useState<OEM[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; oem: OEM | null }>({
    open: false,
    oem: null,
  });
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedOEM, setSelectedOEM] = useState<OEM | null>(null);

  useEffect(() => {
    loadOEMs();
  }, []);

  const loadOEMs = async () => {
    try {
      setLoading(true);
      const response = await oemService.getAllOEMs();
      setOEMs(response.data);
    } catch (error) {
      console.error('Error loading OEMs:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load OEMs',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOEM = async () => {
    if (!deleteDialog.oem) return;

    try {
      await oemService.deleteOEM(deleteDialog.oem.id);
      setSnackbar({
        open: true,
        message: 'OEM deleted successfully',
        severity: 'success',
      });
      setDeleteDialog({ open: false, oem: null });
      loadOEMs();
    } catch (error) {
      console.error('Error deleting OEM:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete OEM',
        severity: 'error',
      });
    }
  };

  const handleTogglePreferred = async (oem: OEM) => {
    try {
      await oemService.updateOEM(oem.id, {
        ...oem,
        isPreferred: !oem.isPreferred,
      });
      setSnackbar({
        open: true,
        message: `OEM ${oem.isPreferred ? 'removed from' : 'added to'} preferred list`,
        severity: 'success',
      });
      loadOEMs();
    } catch (error) {
      console.error('Error updating OEM:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update OEM',
        severity: 'error',
      });
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, oem: OEM) => {
    setAnchorEl(event.currentTarget);
    setSelectedOEM(oem);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedOEM(null);
  };

  const filteredOEMs = oems.filter(oem =>
    oem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    oem.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (oem.country && oem.country.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'success' : 'error';
  };

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          OEM Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          href="/oems/new"
          sx={{ px: 3 }}
        >
          Add New OEM
        </Button>
      </Box>

      {/* Search and Stats */}
      <Box display="flex" gap={2} mb={3}>
        <TextField
          variant="outlined"
          placeholder="Search OEMs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 300 }}
        />
        <Box display="flex" gap={1} alignItems="center">
          <Chip 
            label={`Total: ${oems.length}`} 
            variant="outlined" 
          />
          <Chip 
            label={`Active: ${oems.filter(o => o.isActive).length}`} 
            color="success" 
            variant="outlined" 
          />
          <Chip 
            label={`Preferred: ${oems.filter(o => o.isPreferred).length}`} 
            color="primary" 
            variant="outlined" 
          />
        </Box>
      </Box>

      {/* OEMs Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>OEM</TableCell>
              <TableCell>Code</TableCell>
              <TableCell>Country</TableCell>
              <TableCell>Models</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Preferred</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : filteredOEMs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    {searchTerm ? 'No OEMs found matching your search' : 'No OEMs found'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredOEMs.map((oem) => (
              <TableRow key={oem.id} hover>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar
                      src={oem.logoUrl}
                      sx={{ 
                        width: 40, 
                        height: 40,
                        bgcolor: oem.brandColor || 'primary.main' 
                      }}
                    >
                      <BusinessIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {oem.name}
                      </Typography>
                      {oem.description && (
                        <Typography variant="caption" color="text.secondary">
                          {oem.description.length > 50 
                            ? `${oem.description.substring(0, 50)}...` 
                            : oem.description
                          }
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">
                    {oem.code}
                  </Typography>
                </TableCell>
                <TableCell>{oem.country || 'N/A'}</TableCell>
                <TableCell>
                  <Chip 
                    label={oem.models?.length || 0} 
                    size="small" 
                    variant="outlined" 
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={oem.isActive ? 'Active' : 'Inactive'}
                    color={getStatusColor(oem.isActive)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton
                    onClick={() => handleTogglePreferred(oem)}
                    color={oem.isPreferred ? 'primary' : 'default'}
                  >
                    {oem.isPreferred ? <StarIcon /> : <StarBorderIcon />}
                  </IconButton>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {format(new Date(oem.createdAt), 'dd MMM yyyy')}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Edit">
                    <IconButton
                      href={`/oems/${oem.id}/edit`}
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <IconButton
                    onClick={(e) => handleMenuClick(e, oem)}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          if (selectedOEM) {
            window.location.href = `/vehicle-models?oemId=${selectedOEM.id}`;
          }
          handleMenuClose();
        }}>
          View Models
        </MenuItem>
        <MenuItem onClick={() => {
          if (selectedOEM) {
            setDeleteDialog({ open: true, oem: selectedOEM });
          }
          handleMenuClose();
        }}>
          Delete OEM
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, oem: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This action will permanently delete the OEM and all associated models and vehicles.
          </Alert>
          <Typography>
            Are you sure you want to delete <strong>{deleteDialog.oem?.name}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, oem: null })}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteOEM}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default OEMManagement;
