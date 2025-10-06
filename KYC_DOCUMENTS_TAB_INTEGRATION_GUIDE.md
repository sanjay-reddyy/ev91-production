# KYC Documents Tab Integration Guide

This guide explains how KYC documents are integrated across the admin portal.

## Overview

The KYC documents tab is now available in two key locations:

1. **RiderProfile.tsx**: Primary, comprehensive view with full document management and verification capabilities
2. **RiderDetail.tsx**: Secondary view with basic document viewing capabilities

## Tab Structure

### 1. RiderProfile Page Tabs

- Rider Information
- **KYC Documents** (index 1)
- Orders
- Earnings
- Vehicle History

### 2. RiderDetail Page Tabs

- Profile
- **KYC Documents** (index 1)
- Vehicle History
- Order History
- Payment History

## Technical Integration

### Backend

- The `riderService` provides several KYC-related endpoints:
  - `getRiderKYC`: Fetches all KYC documents for a rider
  - `submitKYC`: Submits a new KYC document
  - `verifyKYC`: Admin verification of a KYC document
  - `getPendingKYC`: Gets all pending KYC documents

### Frontend

Both pages use similar patterns to display KYC documents:

1. Load KYC documents using `riderService.getRiderKYC(riderId)`
2. Display documents in a grid layout with document type, status, and preview options
3. Enable document viewing via a preview dialog

## Differences Between Implementations

1. **RiderProfile.tsx**:

   - Full document management
   - Verification capabilities
   - Detailed status updates
   - Enhanced document previews
   - Verification dialog

2. **RiderDetail.tsx**:
   - Basic document viewing
   - Status display
   - Document preview
   - No verification capabilities

## Testing KYC Integration

1. Open the Rider Management page
2. Navigate to a rider detail page
3. Verify KYC Documents tab is available in both views:

   - Click "View Profile" button to see RiderProfile view
   - From the detail page, check that the KYC Documents tab is visible

4. Test document viewing:
   - Click "View Document" on any KYC document
   - Verify the preview dialog works

## Troubleshooting

If KYC documents are not displaying:

1. Check that KYC documents exist for the rider in the database
2. Verify the API endpoints are responding correctly
3. Check the console for any errors related to document loading
4. Ensure the correct tabs and indexes are configured

## Common Issues

1. **"Not seeing documents in RiderDetail page"**:

   - Ensure you're looking at the correct tab (index 1)
   - Check if documents exist for that rider
   - Verify the `loadKycDocuments` function is being called

2. **"KYC tab missing altogether"**:

   - Verify the tab is properly defined in the tab list
   - Check that the tab panel has the correct index

3. **"Document preview not working"**:
   - Check if document URL is valid
   - Verify dialog state is being updated correctly
