// Quick test to verify imports work correctly
import { AuthService } from './src/services/authService';
import { RBACMiddleware } from './src/middleware/rbac';
import { JwtService } from './src/utils/jwt';

console.log('✅ All imports successful!');
console.log('✅ AuthService loaded');
console.log('✅ RBACMiddleware loaded');
console.log('✅ JwtService loaded');

process.exit(0);
