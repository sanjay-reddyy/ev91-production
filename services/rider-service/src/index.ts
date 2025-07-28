import app from './app';
import { env } from './config/env';
import { prisma } from './config/database';

// Log loaded environment variables
console.log('Loaded environment config:', env);
const PORT = env.PORT;

// Start the server 
// Start the server and catch any errors
let server;
try {
  server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Rider Service running on port ${PORT}`);
    console.log(`💻 Browser: http://localhost:${PORT}/docs`);
    console.log(`📱 Mobile: http://192.168.1.35:${PORT}/api/v1/register/start-registration`);
  });
} catch (error) {
  console.error('❌ Failed to start Rider Service:', error);
  process.exit(1);
}

// Handle graceful shutdown
const shutdown = async () => {
  console.log('Shutting down server...');
  
  // Close the server
  server.close(async () => {
    try {
      // Disconnect Prisma
      await prisma.$disconnect();
      console.log('Database connection closed');
      
      console.log('Server shutdown complete');
      process.exit(0);
    } catch (err) {
      console.error('Error during shutdown:', err);
      process.exit(1);
    }
  });
  
  // Force close after timeout
  setTimeout(() => {
    console.error('Server shutdown timed out, forcing exit');
    process.exit(1);
  }, 10000);
};

// Listen for termination signals
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
