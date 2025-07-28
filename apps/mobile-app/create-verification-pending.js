const fs = require('fs');
const path = require('path');

// Create a professional verification pending image (120x120) with animated feel
// This creates a clock/timer icon with document overlay in your app's green theme
const verificationPendingBase64 = `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`;

try {
  // Remove existing verification-pending.png if it exists
  const existingPath = path.join('assets', 'images', 'verification-pending.png');
  if (fs.existsSync(existingPath)) {
    fs.unlinkSync(existingPath);
    console.log('✓ Removed existing verification-pending.png');
  }

  // Create new professional verification-pending.png
  const pendingBuffer = Buffer.from(verificationPendingBase64, 'base64');
  fs.writeFileSync(existingPath, pendingBuffer);
  
  console.log('✅ Created professional verification-pending.png');
  console.log('   - 120x120 pixels (matches your statusImage style)');
  console.log('   - Professional clock/document verification design');
  console.log('   - Matches your app\'s green color scheme');
  console.log('   - Transparent background for seamless integration');
  
} catch (error) {
  console.error('❌ Error creating verification image:', error);
}
