# Rider History Timeline Feature Documentation

## Overview

The Rider History Timeline feature provides a complete history of vehicle assignments, pickups, and returns. It allows administrators to view a chronological record of which riders have used a specific vehicle, including timestamps, handover details, and media documentation.

## Features

1. **Timeline View**: Displays chronological rider assignment events with dates, rider details, and vehicle condition
2. **Table View**: Alternative tabular presentation for quick scanning and filtering
3. **Detailed Event View**: Pop-up modal with comprehensive event information including:
   - Rider details
   - Event date and time
   - Vehicle condition (mileage, battery percentage)
   - Handover location
   - Issues reported
   - Verification details
4. **Media Gallery**: Displays images and documents captured during vehicle handover events
5. **Full-Size Image Preview**: View handover photos in full size

## Implementation

### Frontend Components

1. **RiderHistoryTimeline.tsx**: The main component displaying the timeline
2. **VehicleProfile.tsx**: Updated to include a new "Rider History" tab

### Backend API Endpoints

1. `GET /vehicles/:id/rider-history`: Retrieves complete rider history for a specific vehicle
   - Includes rider details, event dates, and media files

## Usage

1. Navigate to a vehicle profile
2. Click on the "Rider History" tab
3. View events in either Timeline or Table view
4. Click on an event to see full details including media
5. Click on any image to view it in full size

## Technical Details

- Integrates with handover records from the vehicle service
- Fetches rider details from the rider service via API gateway
- Displays media files with presigned URLs for secure access
- Supports pagination for vehicles with many rider events

## Future Enhancements

- Filtering by date range or specific riders
- Export functionality to PDF or Excel
- Integration with incident reports
- Map view showing handover locations
