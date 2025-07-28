// Frontend API Routes Verification Script
const axios = require('axios');

const API_ENDPOINTS = {
  // Admin Portal Frontend (through Vite proxy)
  FRONTEND_BASE: 'http://localhost:3003',
  
  // Direct Backend Services
  AUTH_SERVICE: 'http://localhost:4001',
  TEAM_SERVICE: 'http://localhost:3002'
};

// Super admin credentials
const CREDENTIALS = {
  email: 'admin@ev91.com',
  password: 'SuperAdmin123!'
};

async function verifyAPIRouting() {
  console.log('🔍 Verifying Frontend API Routing...\n');

  try {
    // Step 1: Login via frontend proxy
    console.log('1️⃣ Testing Login via Frontend Proxy...');
    const loginResponse = await axios.post(`${API_ENDPOINTS.FRONTEND_BASE}/auth/login`, CREDENTIALS);
    console.log('✅ Frontend login proxy working');
    const token = loginResponse.data.data.accessToken;

    // Step 2: Test profile via frontend proxy
    console.log('\n2️⃣ Testing Profile via Frontend Proxy...');
    try {
      const profileResponse = await axios.get(`${API_ENDPOINTS.FRONTEND_BASE}/auth/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('✅ Frontend profile proxy working');
      console.log(`   User: ${profileResponse.data.data.user.firstName} ${profileResponse.data.data.user.lastName}`);
    } catch (error) {
      console.log('❌ Frontend profile proxy failed:', error.response?.status, error.response?.data);
    }

    // Step 3: Test teams API via frontend proxy
    console.log('\n3️⃣ Testing Teams API via Frontend Proxy...');
    try {
      const teamsResponse = await axios.get(`${API_ENDPOINTS.FRONTEND_BASE}/api/teams`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('✅ Frontend teams proxy working');
      console.log(`   Teams found: ${teamsResponse.data.teams?.length || 0}`);
    } catch (error) {
      console.log('❌ Frontend teams proxy failed:', error.response?.status, error.response?.data);
    }

    // Step 4: Test departments API via frontend proxy
    console.log('\n4️⃣ Testing Departments API via Frontend Proxy...');
    try {
      const deptsResponse = await axios.get(`${API_ENDPOINTS.FRONTEND_BASE}/api/departments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('✅ Frontend departments proxy working');
      console.log(`   Departments found: ${deptsResponse.data.departments?.length || 0}`);
    } catch (error) {
      console.log('❌ Frontend departments proxy failed:', error.response?.status, error.response?.data);
    }

    // Step 5: Verify direct backend endpoints (for comparison)
    console.log('\n5️⃣ Verifying Direct Backend Endpoints...');
    
    // Auth service direct
    try {
      const directAuth = await axios.get(`${API_ENDPOINTS.AUTH_SERVICE}/auth/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('✅ Direct auth service working');
    } catch (error) {
      console.log('❌ Direct auth service failed:', error.response?.status, error.response?.data);
    }

    // Team service direct
    try {
      const directTeams = await axios.get(`${API_ENDPOINTS.TEAM_SERVICE}/api/teams`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('✅ Direct team service working');
    } catch (error) {
      console.log('❌ Direct team service failed:', error.response?.status, error.response?.data);
    }

    console.log('\n🎯 Frontend API Routing Summary:');
    console.log('┌─────────────────────────────────────────────────────────────┐');
    console.log('│ Route Pattern    │ Target Service    │ Status              │');
    console.log('├─────────────────────────────────────────────────────────────┤');
    console.log('│ /auth/*          │ Auth Service      │ Check above results │');
    console.log('│ /api/teams/*     │ Team Service      │ Check above results │');
    console.log('│ /api/departments │ Auth Service      │ Check above results │');
    console.log('│ /api/*           │ Auth Service      │ Check above results │');
    console.log('└─────────────────────────────────────────────────────────────┘');

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

// Additional function to test specific frontend pages
async function testFrontendPages() {
  console.log('\n🌐 Testing Frontend Pages...');
  
  try {
    // Test if admin portal is serving
    const homeResponse = await axios.get(`${API_ENDPOINTS.FRONTEND_BASE}`);
    console.log('✅ Admin portal home page accessible');
  } catch (error) {
    console.log('❌ Admin portal not accessible:', error.message);
    console.log('   Make sure to run: npm run dev in apps/admin-portal/');
  }
}

// Run all tests
async function runAllTests() {
  await testFrontendPages();
  await verifyAPIRouting();
  
  console.log('\n📋 **Next Steps to Ensure Correct API Calls:**');
  console.log('1. Start admin portal: cd apps/admin-portal && npm run dev');
  console.log('2. Login with: admin@ev91.com / SuperAdmin123!');
  console.log('3. Click Teams tab - should not get 401 errors');
  console.log('4. Check browser DevTools Network tab to see API calls');
  
  console.log('\n🔧 **Expected API Call Patterns:**');
  console.log('- Login: POST /auth/login → Auth Service (port 4001)');
  console.log('- Profile: GET /auth/profile → Auth Service (port 4001)');
  console.log('- Teams: GET /api/teams → Team Service (port 3002)');
  console.log('- Departments: GET /api/departments → Auth Service (port 4001)');
}

runAllTests().catch(console.error);
