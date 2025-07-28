# Rider Service (Registration & KYC)

## Overview
This service handles the full registration, KYC, and onboarding flow for riders, including:
- Phone verification via MSG91 SMS
- Multi-step profile and emergency contact collection
- KYC document upload (Aadhaar, PAN, DL, Selfie, RC) to AWS S3
- KYC verification via provider API
- e-Sign rental agreement via provider API

## Environment Setup

Add a `.env` file in this directory with the following variables:

```
MSG91_AUTH_KEY=your_msg91_auth_key_here
MSG91_TEMPLATE_ID=your_msg91_template_id_here
MSG91_SENDER_ID=OTPSMS
KYC_PROVIDER_URL=https://sandbox.kyc-provider.com/api
KYC_PROVIDER_KEY=your_kyc_api_key
ESIGN_PROVIDER_URL=https://sandbox.esign-provider.com/api
ESIGN_PROVIDER_KEY=your_esign_api_key
AWS_REGION=your_aws_region
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_S3_BUCKET=your_s3_bucket_name
DATABASE_URL=file:./dev.db
```

## Database
Uses Prisma ORM. To set up:

```
npx prisma generate
npx prisma migrate dev --name init
```

## Running the Service

```
npm install
npm run dev
```
Service runs on port 4002 by default.

## API Endpoints

### 1. Start Registration (Send OTP)
`POST /register/start-registration`
```json
{
  "phone": "+919999999999",
  "consent": true
}
```

### 2. Verify OTP
`POST /register/verify-otp`
```json
{
  "phone": "+919999999999",
  "otp": "123456"
}
```

### 3. Submit Profile
`POST /register/profile`
```json
{
  "riderId": "...",
  "name": "John Doe",
  "dob": "1990-01-01",
  "address1": "123 Main St",
  "address2": "",
  "city": "Mumbai",
  "state": "MH",
  "pincode": "400001",
  "emergencyName": "Jane Doe",
  "emergencyPhone": "9876543210",
  "emergencyRelation": "Spouse"
}
```

### 4. Upload KYC Documents
`POST /register/kyc` (multipart/form-data)
Fields: `riderId`, `aadhaar` (file), `pan` (file, optional), `dl` (file), `selfie` (file), `rc` (file, optional)

### 5. Check KYC Status
`GET /register/kyc-status/:riderId`

### 6. e-Sign Agreement
`POST /register/esign`
```json
{
  "riderId": "...",
  "agreementData": { /* agreement details */ }
}
```

## Functionality Notes
- All KYC and profile docs are stored in AWS S3 and linked to the rider in the DB.
- Admins can later fetch and review these docs for manual verification.
- MSG91 is used for OTP SMS; KYC and e-sign are pluggable with any provider.

---
For more, see the main project README.