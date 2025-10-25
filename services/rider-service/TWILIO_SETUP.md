# Twilio Setup Guide for EV91 Platform

## Getting Started with Twilio

### 1. Create a Twilio Account
- Go to [https://www.twilio.com/](https://www.twilio.com/)
- Sign up for a free account
- Complete phone verification

### 2. Get Your Credentials
1. **Go to Twilio Console**: [https://console.twilio.com/](https://console.twilio.com/)
2. **Find your Account SID and Auth Token**:
   - Account SID: Starts with `AC` followed by 32 characters
   - Auth Token: 32-character string (click "Show" to reveal)

### 3. Get a Phone Number
1. **In Twilio Console** → **Phone Numbers** → **Manage** → **Buy a number**
2. **Choose a number** that supports SMS
3. **Note the number** (format: `+1234567890`)

### 4. Update Environment Variables
Edit your `.env` file in `services/rider-service/`:

```env
# Twilio SMS Provider Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890
```

⚠️ **Important**: Replace the `x` characters with your actual Twilio credentials.

### 5. Test the Configuration
Run the test script:
```bash
cd services/rider-service
node test-twilio-api.js
```

Or check the health endpoint:
```bash
curl http://localhost:4004/api/v1/health
```

## Common Issues

### ❌ "accountSid must start with AC"
- **Problem**: Invalid Account SID format
- **Solution**: Ensure TWILIO_ACCOUNT_SID starts with "AC"

### ❌ "Invalid credentials"
- **Problem**: Wrong Auth Token
- **Solution**: Copy the Auth Token correctly from Twilio Console

### ❌ "Phone number not verified"
- **Problem**: Phone number not purchased/configured
- **Solution**: Buy a phone number in Twilio Console

### ❌ "SMS not supported"
- **Problem**: Phone number doesn't support SMS
- **Solution**: Buy a different number with SMS capability

## Free Tier Limitations

Twilio free accounts have some limitations:
- **$15.50 free credit** upon signup
- **Verified phone numbers only** (add test numbers in Console)
- **SMS cost**: ~$0.0075 per SMS in US, varies by country
- **Upgrade** to remove restrictions

## Pricing (Approximate)
- **SMS (US/Canada)**: $0.0075 per message
- **SMS (India)**: $0.0055 per message
- **SMS (UK)**: $0.04 per message
- **Monthly phone number**: $1.15/month

## Production Checklist

- [ ] Upgrade Twilio account from trial
- [ ] Purchase phone number(s)
- [ ] Set up proper error monitoring
- [ ] Configure webhook endpoints (if needed)
- [ ] Set up proper logging
- [ ] Test in staging environment
- [ ] Monitor SMS delivery rates

## Support

- **Twilio Docs**: [https://www.twilio.com/docs](https://www.twilio.com/docs)
- **Console**: [https://console.twilio.com/](https://console.twilio.com/)
- **Support**: Available in Twilio Console