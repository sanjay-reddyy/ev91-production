import React from 'react';
import {
  Grid,
  TextField,
  Typography,
  Divider,
} from '@mui/material';

interface RiderFormData {
  name: string;
  phone: string;
  email: string;
  dob: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  pincode: string;
  aadharNumber: string;
  panNumber: string;
  drivingLicenseNumber: string;
  emergencyName: string;
  emergencyPhone: string;
  emergencyRelation: string;
}

interface FormErrors {
  name?: string;
  phone?: string;
  email?: string;
  dob?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  aadharNumber?: string;
  panNumber?: string;
  drivingLicenseNumber?: string;
  emergencyName?: string;
  emergencyPhone?: string;
  emergencyRelation?: string;
}

interface RiderFormProps {
  formData: RiderFormData;
  formErrors: FormErrors;
  validationEnabled: boolean;
  onFormDataChange: (data: RiderFormData) => void;
  onErrorsChange: (errors: FormErrors) => void;
}

const RiderForm: React.FC<RiderFormProps> = ({
  formData,
  formErrors,
  validationEnabled,
  onFormDataChange,
  onErrorsChange,
}) => {
  const handleFieldChange = (field: keyof RiderFormData, value: string, validator?: (value: string) => string | undefined) => {
    const newFormData = { ...formData, [field]: value };
    onFormDataChange(newFormData);

    if (validationEnabled && validator) {
      const errors = { ...formErrors };
      const error = validator(value);
      if (error) {
        errors[field] = error;
      } else {
        delete errors[field];
      }
      onErrorsChange(errors);
    }
  };

  // Validation functions
  const validateName = (value: string): string | undefined => {
    if (!value.trim()) {
      return 'Full name is required';
    } else if (value.trim().length < 2) {
      return 'Name must be at least 2 characters long';
    }
    return undefined;
  };

  const validatePhone = (value: string): string | undefined => {
    if (!value) {
      return 'Phone number is required';
    } else if (!/^[6-9]\d{9}$/.test(value)) {
      return 'Phone number must be exactly 10 digits and start with 6, 7, 8, or 9';
    }
    return undefined;
  };

  const validateEmail = (value: string): string | undefined => {
    if (value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
      return 'Please enter a valid email address';
    }
    return undefined;
  };

  const validateDateOfBirth = (value: string): string | undefined => {
    if (!value) {
      return 'Date of birth is required';
    }
    const selectedDate = new Date(value);
    const today = new Date();
    const age = today.getFullYear() - selectedDate.getFullYear();
    const monthDiff = today.getMonth() - selectedDate.getMonth();
    const dayDiff = today.getDate() - selectedDate.getDate();

    if (age < 18 || (age === 18 && (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)))) {
      return 'Rider must be at least 18 years old';
    } else if (age > 65) {
      return 'Rider must be under 65 years old';
    }
    return undefined;
  };

  const validateAddress1 = (value: string): string | undefined => {
    if (!value.trim()) {
      return 'Address is required';
    }
    return undefined;
  };

  const validateCity = (value: string): string | undefined => {
    if (!value.trim()) {
      return 'City is required';
    }
    return undefined;
  };

  const validateState = (value: string): string | undefined => {
    if (!value.trim()) {
      return 'State is required';
    }
    return undefined;
  };

  const validatePincode = (value: string): string | undefined => {
    if (!value) {
      return 'PIN code is required';
    } else if (value.length !== 6) {
      return 'PIN code must be exactly 6 digits';
    }
    return undefined;
  };

  const validateAadharNumber = (value: string): string | undefined => {
    if (!value) {
      return 'Aadhar number is required';
    } else if (value.length !== 12) {
      return 'Aadhar number must be exactly 12 digits';
    }
    return undefined;
  };

  const validatePanNumber = (value: string): string | undefined => {
    if (!value) {
      return 'PAN number is required';
    } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(value)) {
      return 'PAN must be in format ABCDE1234F';
    }
    return undefined;
  };

  const validateDrivingLicenseNumber = (value: string): string | undefined => {
    if (!value.trim()) {
      return 'Driving license number is required';
    } else if (value.trim().length < 8) {
      return 'Driving license number must be at least 8 characters';
    }
    return undefined;
  };

  const validateEmergencyName = (value: string): string | undefined => {
    if (!value.trim()) {
      return 'Emergency contact name is required';
    }
    return undefined;
  };

  const validateEmergencyPhone = (value: string): string | undefined => {
    if (!value) {
      return 'Emergency contact phone is required';
    } else if (!/^[6-9]\d{9}$/.test(value)) {
      return 'Emergency phone must be exactly 10 digits and start with 6, 7, 8, or 9';
    }
    return undefined;
  };

  const validateEmergencyRelation = (value: string): string | undefined => {
    if (!value.trim()) {
      return 'Emergency contact relation is required';
    }
    return undefined;
  };

  return (
    <Grid container spacing={3} sx={{ mt: 1 }}>
      {/* Personal Information Section */}
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Personal Information
        </Typography>
        <Divider sx={{ mb: 2 }} />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Full Name"
          value={formData.name}
          onChange={(e) => handleFieldChange('name', e.target.value, validateName)}
          required
          error={validationEnabled && !!formErrors.name}
          helperText={validationEnabled && formErrors.name}
          placeholder="Enter full name"
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Phone Number"
          value={formData.phone}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, '').slice(0, 10);
            handleFieldChange('phone', value, validatePhone);
          }}
          required
          error={validationEnabled && !!formErrors.phone}
          helperText={validationEnabled && formErrors.phone ? formErrors.phone : 'Enter 10-digit mobile number'}
          inputProps={{
            maxLength: 10,
            inputMode: 'numeric',
            pattern: '[0-9]*'
          }}
          placeholder="9876543210"
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => handleFieldChange('email', e.target.value, validateEmail)}
          error={validationEnabled && !!formErrors.email}
          helperText={validationEnabled && formErrors.email ? formErrors.email : 'Optional'}
          placeholder="example@email.com"
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Date of Birth"
          type="date"
          value={formData.dob}
          onChange={(e) => handleFieldChange('dob', e.target.value, validateDateOfBirth)}
          required
          InputLabelProps={{ shrink: true }}
          error={validationEnabled && !!formErrors.dob}
          helperText={validationEnabled && formErrors.dob ? formErrors.dob : 'Must be 18-65 years old'}
        />
      </Grid>

      {/* Address Information Section */}
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          Address Information
        </Typography>
        <Divider sx={{ mb: 2 }} />
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Address Line 1"
          value={formData.address1}
          onChange={(e) => handleFieldChange('address1', e.target.value, validateAddress1)}
          required
          error={validationEnabled && !!formErrors.address1}
          helperText={validationEnabled && formErrors.address1}
          placeholder="Enter address line 1"
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Address Line 2"
          value={formData.address2}
          onChange={(e) => handleFieldChange('address2', e.target.value)}
          placeholder="Enter address line 2 (optional)"
        />
      </Grid>

      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          label="City"
          value={formData.city}
          onChange={(e) => handleFieldChange('city', e.target.value, validateCity)}
          required
          error={validationEnabled && !!formErrors.city}
          helperText={validationEnabled && formErrors.city}
          placeholder="Enter city"
        />
      </Grid>

      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          label="State"
          value={formData.state}
          onChange={(e) => handleFieldChange('state', e.target.value, validateState)}
          required
          error={validationEnabled && !!formErrors.state}
          helperText={validationEnabled && formErrors.state}
          placeholder="Enter state"
        />
      </Grid>

      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          label="PIN Code"
          value={formData.pincode}
          onChange={(e) => {
            const pinValue = e.target.value.replace(/\D/g, '').slice(0, 6);
            handleFieldChange('pincode', pinValue, validatePincode);
          }}
          required
          error={validationEnabled && !!formErrors.pincode}
          helperText={validationEnabled && formErrors.pincode ? formErrors.pincode : '6-digit PIN code'}
          placeholder="123456"
          inputProps={{
            maxLength: 6,
            inputMode: 'numeric',
            pattern: '[0-9]*'
          }}
        />
      </Grid>

      {/* Documents Section */}
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          Documents
        </Typography>
        <Divider sx={{ mb: 2 }} />
      </Grid>

      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          label="Aadhar Number"
          value={formData.aadharNumber}
          onChange={(e) => {
            const aadharValue = e.target.value.replace(/\D/g, '').slice(0, 12);
            handleFieldChange('aadharNumber', aadharValue, validateAadharNumber);
          }}
          required
          error={validationEnabled && !!formErrors.aadharNumber}
          helperText={validationEnabled && formErrors.aadharNumber ? formErrors.aadharNumber : '12-digit Aadhar number'}
          placeholder="123456789012"
          inputProps={{
            maxLength: 12,
            inputMode: 'numeric',
            pattern: '[0-9]*'
          }}
        />
      </Grid>

      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          label="PAN Number"
          value={formData.panNumber}
          onChange={(e) => {
            const panValue = e.target.value.toUpperCase();
            if (panValue.length <= 10) {
              handleFieldChange('panNumber', panValue, validatePanNumber);
            }
          }}
          required
          error={validationEnabled && !!formErrors.panNumber}
          helperText={validationEnabled && formErrors.panNumber ? formErrors.panNumber : 'Format: ABCDE1234F'}
          placeholder="ABCDE1234F"
          inputProps={{ style: { textTransform: 'uppercase' } }}
        />
      </Grid>

      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          label="Driving License Number"
          value={formData.drivingLicenseNumber}
          onChange={(e) => handleFieldChange('drivingLicenseNumber', e.target.value, validateDrivingLicenseNumber)}
          required
          error={validationEnabled && !!formErrors.drivingLicenseNumber}
          helperText={validationEnabled && formErrors.drivingLicenseNumber ? formErrors.drivingLicenseNumber : 'Minimum 8 characters'}
          placeholder="Enter driving license number"
        />
      </Grid>

      {/* Emergency Contact Section */}
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          Emergency Contact
        </Typography>
        <Divider sx={{ mb: 2 }} />
      </Grid>

      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          label="Emergency Contact Name"
          value={formData.emergencyName}
          onChange={(e) => handleFieldChange('emergencyName', e.target.value, validateEmergencyName)}
          required
          error={validationEnabled && !!formErrors.emergencyName}
          helperText={validationEnabled && formErrors.emergencyName}
          placeholder="Enter emergency contact name"
        />
      </Grid>

      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          label="Emergency Contact Phone"
          value={formData.emergencyPhone}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, '').slice(0, 10);
            handleFieldChange('emergencyPhone', value, validateEmergencyPhone);
          }}
          required
          error={validationEnabled && !!formErrors.emergencyPhone}
          helperText={validationEnabled && formErrors.emergencyPhone ? formErrors.emergencyPhone : '10-digit mobile number'}
          placeholder="9876543210"
          inputProps={{
            maxLength: 10,
            inputMode: 'numeric',
            pattern: '[0-9]*'
          }}
        />
      </Grid>

      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          label="Emergency Contact Relation"
          value={formData.emergencyRelation}
          onChange={(e) => handleFieldChange('emergencyRelation', e.target.value, validateEmergencyRelation)}
          required
          error={validationEnabled && !!formErrors.emergencyRelation}
          helperText={validationEnabled && formErrors.emergencyRelation}
          placeholder="e.g., Father, Mother, Spouse"
        />
      </Grid>
    </Grid>
  );
};

export default RiderForm;
