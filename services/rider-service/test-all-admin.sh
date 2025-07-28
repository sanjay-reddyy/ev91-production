#!/bin/bash

echo "🚀 Starting Rider Service for Testing..."

# Start the service in background
cd "c:\voice_project\EV91-Platform\services\rider-service"
npm start &
SERVICE_PID=$!

# Wait for service to start
echo "⏳ Waiting for service to start..."
sleep 5

# Run the admin KYC test
echo "🧪 Running Admin KYC Tests..."
node test-admin-kyc.js

echo ""
echo "🔄 Running Complete KYC Flow Test..."
node test-complete-kyc-admin.js

# Stop the service
echo "🛑 Stopping service..."
kill $SERVICE_PID

echo "✅ Testing completed!"
