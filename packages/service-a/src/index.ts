import dotenv from 'dotenv';
import app from './app';
import { closeDatabase, initializeDatabase } from './config/database';

dotenv.config();

const PORT = process.env.PORT || 3001;

async function bootstrap() {
  try {
    console.log('🚀 Starting Service A...');
    await initializeDatabase();
    
    const server = app.listen(PORT, () => {
      console.log(`✅ Service A running on port ${PORT}`);
      console.log(`📋 Health check: http://localhost:${PORT}/health`);
      console.log(`📖 API docs: http://localhost:${PORT}/api`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    const gracefulShutdown = async (signal: string) => {
      console.log(`\n📡 Received ${signal}. Starting graceful shutdown...`);
      
      // Stop accepting new connections
      server.close(async () => {
        console.log('🔌 HTTP server closed');
        
        try {
          await closeDatabase();
          console.log('✅ Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          console.error('❌ Error during shutdown:', error);
          process.exit(1);
        }
      });

      // Force exit after 10 seconds
      setTimeout(() => {
        console.error('⏰ Forcing shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    // Register shutdown handlers
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    process.on('uncaughtException', (error) => {
      console.error('💥 Uncaught Exception:', error);
      gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('unhandledRejection');
    });

  } catch (error) {
    console.error('💥 Failed to start Service A:', error);
    process.exit(1);
  }
}

bootstrap();