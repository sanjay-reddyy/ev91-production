import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from '@mui/lab';
import {
  DirectionsBike as PickupIcon,
  AssignmentReturn as ReturnIcon,
  Event as EventIcon,
  PhotoLibrary as PhotoIcon,
  Close as CloseIcon,
  Person as RiderIcon,
  PhotoCamera as CameraIcon,
  BatteryChargingFull as BatteryIcon,
  Speed as MileageIcon,
} from '@mui/icons-material';
import { vehicleService } from '../../services/vehicleService';

interface MediaFile {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  description?: string;
  uploadDate: string;
}

interface RiderHistoryEvent {
  id: string;
  riderId: string;
  vehicleId: string;
  eventType: string; // "Pickup" or "Drop"
  eventDate: string;
  mileageReading?: number;
  batteryPercentage?: number;
  overallCondition?: string;
  exteriorCondition?: string;
  interiorCondition?: string;
  mechanicalCondition?: string;
  issuesReported?: string;
  handoverLocation?: string;
  verifiedBy?: string;
  verificationDate?: string;
  media?: MediaFile[];
  riderDetails?: {
    name: string;
    phone?: string;
    id: string;
  };
}

interface RiderHistoryTimelineProps {
  vehicleId: string;
}

const RiderHistoryTimeline: React.FC<RiderHistoryTimelineProps> = ({ vehicleId }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [riderHistory, setRiderHistory] = useState<RiderHistoryEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<RiderHistoryEvent | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'timeline' | 'table'>('timeline');

  // Pagination for table view
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  useEffect(() => {
    fetchRiderHistory();
  }, [vehicleId]);

  const fetchRiderHistory = async () => {
    try {
      setLoading(true);
      const response = await vehicleService.getVehicleRiderHistory(vehicleId);
      console.log('Rider history data:', response.data);
      setRiderHistory(response.data || []);
    } catch (error) {
      console.error('Error fetching rider history:', error);
      setError('Failed to fetch rider history data');
    } finally {
      setLoading(false);
    }
  };

  const handleEventClick = (event: RiderHistoryEvent) => {
    setSelectedEvent(event);
  };

  const handleImageClick = (url: string) => {
    setSelectedImage(url);
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (riderHistory.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Alert severity="info">
          No rider history found for this vehicle. The vehicle hasn't been assigned to any riders yet.
        </Alert>
      </Box>
    );
  }

  // Function to format date nicely
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Function to get condition color
  const getConditionColor = (condition?: string) => {
    switch (condition?.toLowerCase()) {
      case 'excellent': return 'success';
      case 'good': return 'info';
      case 'fair': return 'warning';
      case 'poor': return 'error';
      default: return 'default';
    }
  };

  // Timeline view
  const renderTimeline = () => (
    <Timeline position="alternate">
      {riderHistory.map((event, index) => (
        <TimelineItem key={event.id}>
          <TimelineOppositeContent color="text.secondary">
            {formatDate(event.eventDate)}
          </TimelineOppositeContent>
          <TimelineSeparator>
            <TimelineDot color={event.eventType === 'Pickup' ? 'primary' : 'secondary'}>
              {event.eventType === 'Pickup' ? <PickupIcon /> : <ReturnIcon />}
            </TimelineDot>
            {index < riderHistory.length - 1 && <TimelineConnector />}
          </TimelineSeparator>
          <TimelineContent>
            <Card
              variant="outlined"
              sx={{
                cursor: 'pointer',
                '&:hover': { boxShadow: 2 },
                mb: 2
              }}
              onClick={() => handleEventClick(event)}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h6" color={event.eventType === 'Pickup' ? 'primary' : 'secondary'}>
                    {event.eventType} Event
                  </Typography>
                  {event.media && event.media.length > 0 && (
                    <PhotoIcon fontSize="small" color="action" sx={{ ml: 1 }} />
                  )}
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <RiderIcon fontSize="small" sx={{ mr: 1 }} />
                  <Typography variant="body2">
                    Rider: {event.riderDetails?.name || 'Unknown Rider'}
                  </Typography>
                </Box>

                {event.mileageReading && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <MileageIcon fontSize="small" sx={{ mr: 1 }} />
                    <Typography variant="body2">
                      Mileage: {event.mileageReading} km
                    </Typography>
                  </Box>
                )}

                {event.batteryPercentage && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <BatteryIcon fontSize="small" sx={{ mr: 1 }} />
                    <Typography variant="body2">
                      Battery: {event.batteryPercentage}%
                    </Typography>
                  </Box>
                )}

                {event.overallCondition && (
                  <Box sx={{ mt: 1 }}>
                    <Chip
                      label={`Condition: ${event.overallCondition}`}
                      color={getConditionColor(event.overallCondition) as any}
                      size="small"
                    />
                  </Box>
                )}
              </CardContent>
            </Card>
          </TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  );

  // Table view
  const renderTable = () => (
    <Box sx={{ width: '100%' }}>
      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Event Type</TableCell>
              <TableCell>Rider</TableCell>
              <TableCell>Mileage</TableCell>
              <TableCell>Condition</TableCell>
              <TableCell>Media</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {riderHistory
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((event) => (
                <TableRow key={event.id} hover>
                  <TableCell>{formatDate(event.eventDate)}</TableCell>
                  <TableCell>
                    <Chip
                      icon={event.eventType === 'Pickup' ? <PickupIcon /> : <ReturnIcon />}
                      label={event.eventType}
                      color={event.eventType === 'Pickup' ? 'primary' : 'secondary'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{event.riderDetails?.name || 'Unknown'}</TableCell>
                  <TableCell>{event.mileageReading || 'N/A'}</TableCell>
                  <TableCell>
                    {event.overallCondition ? (
                      <Chip
                        label={event.overallCondition}
                        color={getConditionColor(event.overallCondition) as any}
                        size="small"
                      />
                    ) : (
                      'N/A'
                    )}
                  </TableCell>
                  <TableCell>
                    {event.media && event.media.length > 0 ? (
                      <Chip
                        icon={<PhotoIcon />}
                        label={`${event.media.length} files`}
                        size="small"
                        color="info"
                      />
                    ) : (
                      'None'
                    )}
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => handleEventClick(event)}>
                      <EventIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={riderHistory.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25]}
      />
    </Box>
  );

  return (
    <Box sx={{ p: 2 }}>
      {/* View Mode Switch */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Chip
          label="Timeline View"
          color={viewMode === 'timeline' ? 'primary' : 'default'}
          onClick={() => setViewMode('timeline')}
          sx={{ mr: 1 }}
        />
        <Chip
          label="Table View"
          color={viewMode === 'table' ? 'primary' : 'default'}
          onClick={() => setViewMode('table')}
        />
      </Box>

      {/* Main Content */}
      {viewMode === 'timeline' ? renderTimeline() : renderTable()}

      {/* Event Details Dialog */}
      <Dialog
        open={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        maxWidth="md"
        fullWidth
      >
        {selectedEvent && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">
                  {selectedEvent.eventType} Details - {formatDate(selectedEvent.eventDate)}
                </Typography>
                <IconButton onClick={() => setSelectedEvent(null)}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2}>
                {/* Left column */}
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Event Information</Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">Rider</Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {selectedEvent.riderDetails?.name || 'Unknown'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">Event Type</Typography>
                          <Typography variant="body2" fontWeight="medium" color={selectedEvent.eventType === 'Pickup' ? 'primary' : 'secondary'}>
                            {selectedEvent.eventType}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">Date & Time</Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {formatDate(selectedEvent.eventDate)}
                          </Typography>
                        </Grid>
                        {selectedEvent.handoverLocation && (
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">Location</Typography>
                            <Typography variant="body2" fontWeight="medium">
                              {selectedEvent.handoverLocation}
                            </Typography>
                          </Grid>
                        )}
                        {selectedEvent.verifiedBy && (
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">Verified By</Typography>
                            <Typography variant="body2" fontWeight="medium">
                              {selectedEvent.verifiedBy}
                            </Typography>
                          </Grid>
                        )}
                        {selectedEvent.verificationDate && (
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">Verification Date</Typography>
                            <Typography variant="body2" fontWeight="medium">
                              {formatDate(selectedEvent.verificationDate)}
                            </Typography>
                          </Grid>
                        )}
                      </Grid>
                    </CardContent>
                  </Card>

                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Vehicle Condition</Typography>
                      <Grid container spacing={2}>
                        {selectedEvent.mileageReading && (
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">Mileage Reading</Typography>
                            <Typography variant="body2" fontWeight="medium">
                              {selectedEvent.mileageReading} km
                            </Typography>
                          </Grid>
                        )}
                        {selectedEvent.batteryPercentage && (
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">Battery Percentage</Typography>
                            <Typography variant="body2" fontWeight="medium">
                              {selectedEvent.batteryPercentage}%
                            </Typography>
                          </Grid>
                        )}
                        {selectedEvent.overallCondition && (
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">Overall Condition</Typography>
                            <Box>
                              <Chip
                                label={selectedEvent.overallCondition}
                                color={getConditionColor(selectedEvent.overallCondition) as any}
                                size="small"
                              />
                            </Box>
                          </Grid>
                        )}
                        {selectedEvent.exteriorCondition && (
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">Exterior Condition</Typography>
                            <Box>
                              <Chip
                                label={selectedEvent.exteriorCondition}
                                color={getConditionColor(selectedEvent.exteriorCondition) as any}
                                size="small"
                              />
                            </Box>
                          </Grid>
                        )}
                        {selectedEvent.interiorCondition && (
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">Interior Condition</Typography>
                            <Box>
                              <Chip
                                label={selectedEvent.interiorCondition}
                                color={getConditionColor(selectedEvent.interiorCondition) as any}
                                size="small"
                              />
                            </Box>
                          </Grid>
                        )}
                        {selectedEvent.mechanicalCondition && (
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">Mechanical Condition</Typography>
                            <Box>
                              <Chip
                                label={selectedEvent.mechanicalCondition}
                                color={getConditionColor(selectedEvent.mechanicalCondition) as any}
                                size="small"
                              />
                            </Box>
                          </Grid>
                        )}
                      </Grid>

                      {selectedEvent.issuesReported && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="caption" color="text.secondary">Issues Reported</Typography>
                          <Typography variant="body2">
                            {selectedEvent.issuesReported}
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                {/* Right column - Media files */}
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>Media Files</Typography>
                  {selectedEvent.media && selectedEvent.media.length > 0 ? (
                    <Grid container spacing={2}>
                      {selectedEvent.media.map((media) => (
                        <Grid item xs={12} sm={6} key={media.id}>
                          <Card variant="outlined" sx={{ height: '100%' }}>
                            <CardContent>
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <CameraIcon color="primary" sx={{ mr: 1 }} />
                                <Typography variant="body2" noWrap>
                                  {media.fileName}
                                </Typography>
                              </Box>

                              {media.fileType.startsWith('image/') && (
                                <Box
                                  component="img"
                                  src={media.fileUrl}
                                  alt={media.fileName}
                                  sx={{
                                    width: '100%',
                                    height: 150,
                                    objectFit: 'cover',
                                    cursor: 'pointer',
                                    borderRadius: 1,
                                  }}
                                  onClick={() => handleImageClick(media.fileUrl)}
                                />
                              )}

                              {media.description && (
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                                  {media.description}
                                </Typography>
                              )}
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 3, bgcolor: 'background.paper', borderRadius: 1 }}>
                      <Typography color="text.secondary">No media files available for this event</Typography>
                    </Box>
                  )}
                </Grid>
              </Grid>
            </DialogContent>
          </>
        )}
      </Dialog>

      {/* Image Preview Dialog */}
      <Dialog
        open={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Image Preview</Typography>
            <IconButton onClick={() => setSelectedImage(null)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedImage && (
            <Box
              component="img"
              src={selectedImage}
              alt="Preview"
              sx={{
                width: '100%',
                height: 'auto',
                maxHeight: '70vh',
                objectFit: 'contain',
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default RiderHistoryTimeline;
