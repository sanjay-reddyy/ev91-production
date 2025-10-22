import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Divider,
  Stack,
} from '@mui/material';
import {
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  CheckCircle as CheckCircleIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';
import { Rider } from '../../services';

interface RiderProfileTabProps {
  rider: Rider;
}

const RiderProfileTab: React.FC<RiderProfileTabProps> = ({
  rider,
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  // Helper function to extract document number from URL or return as-is
  const extractDocumentNumber = (value: string | null): string => {
    if (!value) return 'Not provided';

    // If it's a URL, it's likely an S3 link - show message to update in KYC tab
    if (value.startsWith('http://') || value.startsWith('https://')) {
      return 'Please add document number in KYC tab';
    }

    // Otherwise, return the value as-is (it's the actual document number)
    return value;
  };

  return (
    <Box sx={{ px: 3, pb: 3 }}>
      <Grid container spacing={4}>
        {/* Personal Information */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Personal Information
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Full Name
                  </Typography>
                  <Typography variant="body1">{rider.name || 'Not provided'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Date of Birth
                  </Typography>
                  <Typography variant="body1">
                    {rider.dob ? formatDate(rider.dob) : 'Not provided'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Phone Number
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PhoneIcon fontSize="small" color="action" />
                    <Typography variant="body1">{rider.phone}</Typography>
                    {rider.phoneVerified && (
                      <CheckCircleIcon color="success" sx={{ fontSize: 16 }} />
                    )}
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Email
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EmailIcon fontSize="small" color="action" />
                    <Typography variant="body1">{rider.email || 'Not provided'}</Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Document Information */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Document Information
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Stack spacing={2}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                    <DescriptionIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                    <Typography variant="subtitle2" color="text.secondary">
                      Aadhar Card
                    </Typography>
                  </Box>
                  <Typography
                    variant="body1"
                    component="div"
                    sx={{
                      fontFamily: 'monospace',
                      color: rider.aadharNumber?.startsWith('http') ? 'warning.main' : 'text.primary',
                      userSelect: 'text',
                      cursor: 'text',
                      pointerEvents: 'none',
                      pl: 4,
                      fontStyle: rider.aadharNumber?.startsWith('http') ? 'italic' : 'normal'
                    }}
                  >
                    {extractDocumentNumber(rider.aadharNumber)}
                  </Typography>
                </Box>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                    <DescriptionIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                    <Typography variant="subtitle2" color="text.secondary">
                      PAN Card
                    </Typography>
                  </Box>
                  <Typography
                    variant="body1"
                    component="div"
                    sx={{
                      fontFamily: 'monospace',
                      color: rider.panNumber?.startsWith('http') ? 'warning.main' : 'text.primary',
                      userSelect: 'text',
                      cursor: 'text',
                      pointerEvents: 'none',
                      pl: 4,
                      fontStyle: rider.panNumber?.startsWith('http') ? 'italic' : 'normal'
                    }}
                  >
                    {extractDocumentNumber(rider.panNumber)}
                  </Typography>
                </Box>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                    <DescriptionIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                    <Typography variant="subtitle2" color="text.secondary">
                      Driving License
                    </Typography>
                  </Box>
                  <Typography
                    variant="body1"
                    component="div"
                    sx={{
                      fontFamily: 'monospace',
                      color: rider.drivingLicenseNumber?.startsWith('http') ? 'warning.main' : 'text.primary',
                      userSelect: 'text',
                      cursor: 'text',
                      pointerEvents: 'none',
                      pl: 4,
                      fontStyle: rider.drivingLicenseNumber?.startsWith('http') ? 'italic' : 'normal'
                    }}
                  >
                    {extractDocumentNumber(rider.drivingLicenseNumber)}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Address Information */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Address Information
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Address
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <LocationIcon fontSize="small" color="action" sx={{ mt: 0.5 }} />
                    <Typography variant="body1">
                      {[rider.address1, rider.address2].filter(Boolean).join(', ') ||
                        'Not provided'}
                    </Typography>
                  </Box>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      City
                    </Typography>
                    <Typography variant="body1">{rider.city || 'Not provided'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      State
                    </Typography>
                    <Typography variant="body1">{rider.state || 'Not provided'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      PIN Code
                    </Typography>
                    <Typography variant="body1">{rider.pincode || 'Not provided'}</Typography>
                  </Grid>
                </Grid>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Emergency Contact */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Emergency Contact
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Name
                  </Typography>
                  <Typography variant="body1">{rider.emergencyName || 'Not provided'}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Phone
                  </Typography>
                  <Typography variant="body1">{rider.emergencyPhone || 'Not provided'}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Relation
                  </Typography>
                  <Typography variant="body1">
                    {rider.emergencyRelation || 'Not provided'}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RiderProfileTab;
