const axios = require('axios');

async function createAdminUser() {
  console.log('🔐 Creating Admin User for Testing...\n');
  
  const authURL = 'http://localhost:4001/api/v1';
  const headers = {
    'Content-Type': 'application/json',
    'Origin': 'http://localhost:3003'
  };

  try {
    // Create an admin user for testing
    console.log('📤 Creating admin user...');
    const registerData = {
      email: 'admin@ev91.com',
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN'
    };

    try {
      const registerResponse = await axios.post(`${authURL}/auth/register`, registerData, { headers });
      console.log('✅ Admin user created successfully');
      console.log('   Email: admin@ev91.com');
      console.log('   Password: admin123');
    } catch (registerError) {
      if (registerError.response && registerError.response.status === 409) {
        console.log('✅ Admin user already exists');
      } else {
        throw registerError;
      }
    }
    
    // Test login with the admin user
    console.log('\n📤 Testing admin login...');
    const loginData = {
      email: 'admin@ev91.com',
      password: 'admin123'
    };
    
    const loginResponse = await axios.post(`${authURL}/auth/login`, loginData, { headers });
    console.log('✅ Admin login successful');
    console.log('   Token received:', loginResponse.data.token ? 'Yes' : 'No');
    
    return loginResponse.data.token;
    
  } catch (error) {
    console.error('❌ Admin User Creation Failed:');
    if (error.response) {
      console.error(`HTTP ${error.response.status}:`, error.response.data);
    } else {
      console.error('Network Error:', error.message);
    }
    return null;
  }
}

if (require.main === module) {
  createAdminUser();
}

module.exports = { createAdminUser };
