# Route Documentation Update

Based on the current implementation, here are the available API routes:

## Health Routes (`/api/v1/health`)
- `GET /api/v1/health` - Complete health check with Twilio status
- `GET /api/v1/health/live` - Simple liveness probe
- `GET /api/v1/health/cors` - CORS test endpoint

## Twilio Registration Routes (`/api/v1/register-twilio`)
- `POST /api/v1/register-twilio/start` - Start registration and send OTP
- `POST /api/v1/register-twilio/verify-otp` - Verify OTP code
- `POST /api/v1/register-twilio/resend-otp` - Resend OTP
- `GET /api/v1/register-twilio/status/:phone` - Get registration status

## Standard Registration Routes (`/api/v1/register`)
- `POST /api/v1/register/start-registration` - Firebase-based registration (legacy)
- `POST /api/v1/register/profile/:riderId` - Save rider profile
- `GET /api/v1/register/profile/:riderId` - Get rider profile
- `POST /api/v1/register/kyc` - Upload KYC documents
- `GET /api/v1/register/kyc-status/:riderId` - Get KYC status
- `POST /api/v1/register/esign` - e-Sign rental agreement

## Booking Routes (`/api/v1/booking`)
- Need to check booking route implementation

The OpenAPI spec has been updated to:
1. ✅ Replace MSG91 with Twilio endpoints
2. ✅ Remove Firebase UID references
3. ✅ Add complete Twilio health check schema
4. ✅ Update description to mention Twilio
5. ✅ Add proper Twilio endpoint documentation

Note: The legacy `/register` routes are still available for backward compatibility but new implementations should use `/register-twilio` for OTP-based registration.
