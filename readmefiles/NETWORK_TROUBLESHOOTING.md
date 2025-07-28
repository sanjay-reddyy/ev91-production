# Network Connectivity Troubleshooting Guide

## Issue: "Failed to fetch" / CORS Errors

### 🔍 **Quick Diagnosis Steps**

#### 1. **Test Backend Server**
```bash
# In rider-service directory
cd C:\voice_project\EV91-Platform\services\rider-service
npm run dev
```

You should see:
```
Rider Service running on port 4004
💻 Browser: http://localhost:4004/docs
📱 Mobile: http://192.168.1.35:4004/api/v1/register/start-registration
```

#### 2. **Test API from Browser**
Open these URLs in your browser:
- Health: http://localhost:4004/api/v1/health/live
- CORS Test: http://localhost:4004/api/v1/health/cors
- API Docs: http://localhost:4004/docs

#### 3. **Test from Mobile App**
Import and use the network test in your mobile app:
```javascript
import { testNetworkConnectivity } from '../api/networkTest';

// In your component
const testConnection = async () => {
  const result = await testNetworkConnectivity();
  console.log('Network test result:', result);
};
```

### 🛠️ **Common Solutions**

#### **1. CORS Issues**
**Symptoms:** 
- "CORS policy blocking request"
- "URL scheme must be http or https"

**Solutions:**
✅ **Updated CORS configuration** to allow all origins in development
✅ **Added mobile-specific origins** (Expo URLs)
✅ **Added preflight headers** for mobile requests

#### **2. Wrong URL/Port**
**Symptoms:**
- "Network request failed"
- Connection timeout

**Check these:**
- Backend running on port 4004? ✅
- Mobile app pointing to correct URL? ✅
- IP address correct for your network? (Update if needed)

**Current mobile app URLs:**
- Android Emulator: `http://10.0.2.2:4004`
- iOS Simulator: `http://localhost:4004`
- Physical Device: `http://192.168.1.35:4004`

#### **3. Firewall/Network Issues**
If using physical device:
```bash
# Check Windows Firewall allows port 4004
# Allow "Node.js" through Windows Defender Firewall
```

#### **4. Environment Variables**
Create `.env` in mobile app root:
```bash
# For custom API URL
EXPO_PUBLIC_API_URL=http://192.168.1.35:4004
```

### 📋 **Update Your Network IP**

If your computer's IP is different from `192.168.1.35`:

1. **Find Your IP:**
```bash
ipconfig
# Look for "IPv4 Address" under your active network adapter
```

2. **Update Mobile App:**
```javascript
// In apps/mobile-app/src/api/client.ts
// Change this line:
return 'http://YOUR_ACTUAL_IP:4004';
```

3. **Update Backend CORS:**
```javascript
// In services/rider-service/src/middleware/auth.ts
// Add your IP to allowedOrigins array
```

### 🔧 **Platform-Specific Solutions**

#### **Expo Development:**
```bash
# Start with tunnel for easier access
expo start --tunnel
```

#### **React Native CLI:**
```bash
# For Android
npx react-native run-android

# For iOS  
npx react-native run-ios
```

### ⚡ **Quick Fixes**

1. **Restart Backend:** `npm run dev`
2. **Clear Metro Cache:** `expo start --clear`
3. **Restart App:** Shake device → "Reload"
4. **Check Network:** Ensure phone and computer on same WiFi

### 📞 **Test Connectivity Commands**

From your computer:
```bash
# Test if port is open
netstat -an | findstr :4004

# Test HTTP endpoint
curl http://localhost:4004/api/v1/health/live
```

From mobile device browser:
- Visit: `http://192.168.1.35:4004/api/v1/health/cors`
- Should see JSON response with CORS confirmation

### 🎯 **Expected Results**

**Successful Health Check:**
```json
{
  "status": "UP",
  "timestamp": "2025-07-21T..."
}
```

**Successful CORS Test:**
```json
{
  "message": "CORS is working correctly!",
  "origin": "...",
  "corsHeaders": {
    "Access-Control-Allow-Origin": "*"
  }
}
```

If you still have issues after these steps, check the mobile app console logs for specific error details.
