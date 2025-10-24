import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Upload as UploadIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  Link as LinkIcon,
} from "@mui/icons-material";
import clientStoreAPI, { ClientRiderMapping } from "../services/clientStore";

interface CreateMappingData {
  platformRiderId: string;
  clientId: string;
  clientRiderId: string;
  notes?: string;
}

const ClientRiderMappingManagement: React.FC = () => {
  const [mappings, setMappings] = useState<ClientRiderMapping[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createDialogError, setCreateDialogError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [filterClientId, setFilterClientId] = useState("");
  const [filterPlatformRiderId, setFilterPlatformRiderId] = useState("");
  const [filterClientRiderId, setFilterClientRiderId] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("active");

  // Dialogs
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [bulkUploadDialogOpen, setBulkUploadDialogOpen] = useState(false);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CreateMappingData>({
    platformRiderId: "",
    clientId: "",
    clientRiderId: "",
    notes: "",
  });
  const [selectedMapping, setSelectedMapping] = useState<ClientRiderMapping | null>(null);
  const [deactivationReason, setDeactivationReason] = useState("");
  const [bulkData, setBulkData] = useState("");

  useEffect(() => {
    loadClients();
    loadMappings();
  }, [page, rowsPerPage, filterClientId, filterPlatformRiderId, filterClientRiderId, filterStatus]);

  const loadClients = async () => {
    try {
      const response = await clientStoreAPI.getClients({ page: 1, limit: 100 });
      setClients(response.data || []);
    } catch (err: any) {
      console.error("Failed to load clients:", err);
      setError("Failed to load clients: " + (err.message || "Unknown error"));
    }
  };

  const loadMappings = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {
        page: page + 1,
        limit: rowsPerPage,
      };

      if (filterClientId) params.clientId = filterClientId;
      if (filterPlatformRiderId) params.platformRiderId = filterPlatformRiderId;
      if (filterClientRiderId) params.clientRiderId = filterClientRiderId;
      if (filterStatus === "active") params.isActive = "true";
      if (filterStatus === "inactive") params.isActive = "false";

      const response = await clientStoreAPI.getClientRiderMappings(params);
      setMappings(response.data || []);
      setTotalCount(response.pagination?.totalItems || 0);
    } catch (err: any) {
      setError(err.message || "Failed to load mappings");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMapping = async () => {
    setCreateDialogError(null);
    if (!formData.platformRiderId || !formData.clientId || !formData.clientRiderId) {
      setCreateDialogError("Platform Rider ID, Client, and Client Rider ID are required");
      return;
    }

    try {
      await clientStoreAPI.createClientRiderMapping(formData);
      setSuccess("Mapping created successfully");
      setCreateDialogOpen(false);
      resetForm();
      loadMappings();
    } catch (err: any) {
      // Show user-friendly error for duplicate mapping or missing publicRiderId
      if (err.response?.status === 409) {
        const code = err.response?.data?.code;
        if (code === "DUPLICATE_CLIENT_RIDER_ID") {
          setCreateDialogError("This Client Rider ID is already mapped for the selected client.");
        } else if (code === "DUPLICATE_PLATFORM_RIDER") {
          setCreateDialogError("This rider is already mapped to the selected client with a different Client Rider ID.");
        } else {
          setCreateDialogError(err.response?.data?.message || "Duplicate mapping detected.");
        }
      } else if (err.response?.status === 404) {
        setCreateDialogError("The entered Public Rider ID was not found. Please check and try again.");
      } else {
        setCreateDialogError(err.message || "Failed to create mapping");
      }
    }
  };

  const handleUpdateMapping = async () => {
    if (!selectedMapping) return;

    try {
      await clientStoreAPI.updateClientRiderMapping(selectedMapping.id, {
        notes: formData.notes,
      });
      setSuccess("Mapping updated successfully");
      setEditDialogOpen(false);
      resetForm();
      loadMappings();
    } catch (err: any) {
      setError(err.message || "Failed to update mapping");
    }
  };

  const handleVerifyMapping = async (mappingId: string) => {
    try {
      await clientStoreAPI.verifyClientRiderMapping(mappingId, "admin-user-id", "verified");
      setSuccess("Mapping verified successfully");
      loadMappings();
    } catch (err: any) {
      setError(err.message || "Failed to verify mapping");
    }
  };

  const handleRejectMapping = async (mappingId: string) => {
    try {
      await clientStoreAPI.verifyClientRiderMapping(mappingId, "admin-user-id", "rejected");
      setSuccess("Mapping rejected");
      loadMappings();
    } catch (err: any) {
      setError(err.message || "Failed to reject mapping");
    }
  };

  const handleDeactivateMapping = async () => {
    if (!selectedMapping || !deactivationReason) {
      setError("Deactivation reason is required");
      return;
    }

    try {
      await clientStoreAPI.deactivateClientRiderMapping(selectedMapping.id, deactivationReason);
      setSuccess("Mapping deactivated successfully");
      setDeactivateDialogOpen(false);
      setDeactivationReason("");
      loadMappings();
    } catch (err: any) {
      setError(err.message || "Failed to deactivate mapping");
    }
  };

  const handleBulkUpload = async () => {
    if (!bulkData.trim()) {
      setError("Please provide CSV data");
      return;
    }

    try {
      const lines = bulkData.trim().split("\n");
      const mappings = lines
        .slice(1) // Skip header
        .map((line) => {
          const [platformRiderId, clientId, clientRiderId, notes] = line.split(",").map((s) => s.trim());
          return { platformRiderId, clientId, clientRiderId, notes };
        })
        .filter((m) => m.platformRiderId && m.clientId && m.clientRiderId);

      const response = await clientStoreAPI.bulkCreateClientRiderMappings({ mappings });
      setSuccess(
        `Bulk upload completed. Success: ${response.data?.successful?.length || 0}, Failed: ${
          response.data?.failed?.length || 0
        }`
      );
      setBulkUploadDialogOpen(false);
      setBulkData("");
      loadMappings();
    } catch (err: any) {
      setError(err.message || "Failed to upload mappings");
    }
  };

  const resetForm = () => {
    setFormData({
      platformRiderId: "",
      clientId: "",
      clientRiderId: "",
      notes: "",
    });
    setSelectedMapping(null);
  };

  const openEditDialog = (mapping: ClientRiderMapping) => {
    setSelectedMapping(mapping);
    setFormData({
      platformRiderId: mapping.platformRiderId,
      clientId: mapping.clientId,
      clientRiderId: mapping.clientRiderId,
      notes: mapping.notes || "",
    });
    setEditDialogOpen(true);
  };

  const openDeactivateDialog = (mapping: ClientRiderMapping) => {
    setSelectedMapping(mapping);
    setDeactivateDialogOpen(true);
  };

  const getVerificationStatusColor = (status: string) => {
    switch (status) {
      case "verified":
        return "success";
      case "rejected":
        return "error";
      case "pending":
        return "warning";
      default:
        return "default";
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" component="h1">
          Client Rider Mapping Management
        </Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<UploadIcon />}
            onClick={() => setBulkUploadDialogOpen(true)}
          >
            Bulk Upload
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Create Mapping
          </Button>
        </Box>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Client</InputLabel>
                <Select
                  value={filterClientId}
                  label="Client"
                  onChange={(e) => setFilterClientId(e.target.value)}
                >
                  <MenuItem value="">All Clients</MenuItem>
                  {clients.map((client) => (
                    <MenuItem key={client.id} value={client.id}>
                      {client.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Public Rider ID"
                placeholder="EV91-001234"
                value={filterPlatformRiderId}
                onChange={(e) => setFilterPlatformRiderId(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Client Rider ID"
                value={filterClientRiderId}
                onChange={(e) => setFilterClientRiderId(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select value={filterStatus} label="Status" onChange={(e) => setFilterStatus(e.target.value)}>
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={1}>
              <Button fullWidth variant="outlined" startIcon={<RefreshIcon />} onClick={loadMappings}>
                Refresh
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Client</TableCell>
              <TableCell>Client Rider ID</TableCell>
              <TableCell>Public Rider ID</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Verification</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : mappings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No mappings found
                </TableCell>
              </TableRow>
            ) : (
              mappings.map((mapping) => (
                <TableRow key={mapping.id}>
                  <TableCell>
                    {mapping.client?.name || mapping.clientId}
                    <br />
                    <Typography variant="caption" color="text.secondary">
                      {mapping.client?.clientCode}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={mapping.clientRiderId} size="small" icon={<LinkIcon />} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                      {mapping.publicRiderId || mapping.platformRiderId}
                    </Typography>
                    {mapping.publicRiderId && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        ID: {mapping.platformRiderId.substring(0, 8)}...
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={mapping.isActive ? "Active" : "Inactive"}
                      color={mapping.isActive ? "success" : "default"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={mapping.verificationStatus}
                      color={getVerificationStatusColor(mapping.verificationStatus)}
                      size="small"
                    />
                    {mapping.verificationStatus === "pending" && (
                      <Box sx={{ mt: 1, display: "flex", gap: 1 }}>
                        <Tooltip title="Verify">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => handleVerifyMapping(mapping.id)}
                          >
                            <CheckIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Reject">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRejectMapping(mapping.id)}
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(mapping.createdAt).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => openEditDialog(mapping)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {mapping.isActive && (
                      <Tooltip title="Deactivate">
                        <IconButton size="small" color="error" onClick={() => openDeactivateDialog(mapping)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </TableContainer>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onClose={() => { setCreateDialogOpen(false); setCreateDialogError(null); }} maxWidth="sm" fullWidth>
        <DialogTitle>Create Client Rider Mapping</DialogTitle>
        <DialogContent>
          {createDialogError && (
            <Alert severity="error" sx={{ mb: 2 }}>{createDialogError}</Alert>
          )}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
            <FormControl fullWidth required>
              <InputLabel>Client</InputLabel>
              <Select
                value={formData.clientId}
                label="Client"
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
              >
                {clients.map((client) => (
                  <MenuItem key={client.id} value={client.id}>
                    {client.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              required
              label="Public Rider ID"
              placeholder="e.g., EV91-001234"
              value={formData.platformRiderId}
              onChange={(e) => setFormData({ ...formData, platformRiderId: e.target.value })}
              helperText="The public rider ID (e.g., EV91-001234) from rider profile"
            />
            <TextField
              fullWidth
              required
              label="Client Rider ID"
              placeholder="e.g., SWIG-DEL-0123"
              value={formData.clientRiderId}
              onChange={(e) => setFormData({ ...formData, clientRiderId: e.target.value })}
              helperText="The unique rider ID provided by the client (e.g., Swiggy, Zomato)"
            />
            <TextField
              fullWidth
              label="Notes"
              multiline
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setCreateDialogOpen(false); setCreateDialogError(null); }}>Cancel</Button>
          <Button onClick={handleCreateMapping} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Mapping Notes</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Notes"
              multiline
              rows={4}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdateMapping} variant="contained">
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Deactivate Dialog */}
      <Dialog
        open={deactivateDialogOpen}
        onClose={() => setDeactivateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Deactivate Mapping</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This will mark the mapping as inactive. Provide a reason below.
          </Alert>
          <TextField
            fullWidth
            required
            label="Deactivation Reason"
            multiline
            rows={3}
            value={deactivationReason}
            onChange={(e) => setDeactivationReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeactivateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeactivateMapping} variant="contained" color="error">
            Deactivate
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Upload Dialog */}
      <Dialog
        open={bulkUploadDialogOpen}
        onClose={() => setBulkUploadDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Bulk Upload Mappings</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Paste CSV data with format: platformRiderId, clientId, clientRiderId, notes (optional)
          </Alert>
          <TextField
            fullWidth
            multiline
            rows={10}
            placeholder="rider-123, client-abc, CLI-R-001, Initial mapping&#10;rider-456, client-abc, CLI-R-002, From onboarding"
            value={bulkData}
            onChange={(e) => setBulkData(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkUploadDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleBulkUpload} variant="contained">
            Upload
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ClientRiderMappingManagement;
