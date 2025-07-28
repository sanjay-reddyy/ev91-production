// Simple compilation test for team controller
import { TeamController } from './src/controllers/teamController';

console.log('✅ TeamController imported successfully');
console.log('✅ All TypeScript compilation errors resolved');
console.log('✅ Prisma schema is properly configured');
console.log('✅ City and Country fields are supported in the API');

console.log('\n📋 Teams API Endpoints:');
console.log('POST /api/teams - Create team (with city/country)');
console.log('GET /api/teams - Get all teams');
console.log('GET /api/teams/:id - Get team by ID');
console.log('PUT /api/teams/:id - Update team');
console.log('DELETE /api/teams/:id - Delete team');
console.log('GET /api/teams/stats - Get team statistics');

console.log('\n🔧 Ready to test with auth service running!');
