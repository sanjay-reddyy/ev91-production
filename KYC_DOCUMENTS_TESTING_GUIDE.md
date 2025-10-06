# KYC Documents Tab Integration Guide

This guide explains how to test and verify the KYC Documents tab implementation in the admin portal.

## Overview

The KYC Documents tab has been added to both the Rider Profile and Rider Details pages in the admin portal. This tab displays all KYC documents uploaded by the rider and allows admins to view and verify them.

## Features Implemented

1. **KYC Documents Tab** - Added to both RiderProfile.tsx and RiderDetail.tsx
2. **Document Display** - Shows document type, verification status, and details
3. **Document Preview** - Click to view the document image in a modal
4. **Verification Actions** - Buttons to verify or reject documents
5. **Status Indicators** - Visual indicators for document verification status

## Testing the Integration

### Prerequisites

1. The admin portal is running
2. The rider service is running
3. You have access to a test rider account

### Upload Test KYC Documents

We've created scripts to upload sample KYC documents for testing:

1. Navigate to the rider service directory:

   ```bash
   cd c:\voice_project\EV91-Platform\services\rider-service
   ```

2. Run the setup script to create KYC documents for a rider:

   ```bash
   node setup-kyc-documents.js
   ```

   This script will:

   - Run a migration to create the KYC documents table if needed
   - Find a suitable test rider
   - Upload sample KYC documents for that rider
   - The script will output the rider ID that was used

3. If you want to manually specify a rider, you can run:
   ```bash
   node upload-dummy-kyc.js <rider-id>
   ```

### Verify in Admin Portal

1. Log into the admin portal
2. Navigate to Rider Management
3. Find the rider used in the previous step
4. Click on the rider to view their details

#### In Rider Details Page

- You should see a "KYC Documents" tab
- Click on it to view the uploaded documents
- Each document should show its type, status, and preview option

#### In Rider Profile Page

- Navigate to the full Rider Profile page
- You should also see the "KYC Documents" tab here
- This view offers more functionality including verification actions

### Test Document Viewing

1. Click the "View Document" button for any document
2. A modal should open displaying the document image
3. Test this functionality in both Rider Details and Rider Profile pages

### Test Document Verification (Rider Profile only)

1. In the Rider Profile page, click on a document's "Verify" button
2. A verification dialog should appear
3. You can choose to approve or reject the document
4. Add verification notes if needed
5. Submit the verification
6. The document status should update accordingly

## AWS S3 Integration

The KYC documents are configured to be stored in AWS S3. The following setup has been completed:

1. S3 bucket configuration in the .env file
2. S3 client utility for uploading files
3. Document URL generation and storage in the database

The uploaded documents are stored in the following S3 path structure:

```
s3://[bucket-name]/kyc/[rider-id]/[document-type]-[timestamp].[extension]
```

## Troubleshooting

If you don't see the KYC Documents tab:

- Make sure you're viewing the latest version of the admin portal
- Check the browser console for any errors
- Verify that the tabs are properly initialized in the code

If documents don't display:

- Check the network requests to confirm the API is being called
- Verify that the rider has documents in the database
- Check that the S3 URLs are accessible

## Next Steps

Once you've verified the KYC Documents tab is working correctly, you can:

1. Test the full KYC workflow including mobile app uploads
2. Integrate with actual verification services if needed
3. Add additional document types as required
4. Enhance the verification process with additional checks
