import dotenv from 'dotenv';
import cron from 'node-cron';
import app from './app';
import { closeDatabase, initializeDatabase } from './config/database';
import { AnalyticsRepository } from './features/analytics/analytics.repository';
import { ExternalService } from './services/external.service';

dotenv.config();

const PORT = process.env.PORT || 3002;

/**
 * Scheduled task for analytics updates
 */
async function runScheduledAnalytics() {
  try {
    console.log('🔄 Running scheduled analytics update...');
    
    const analyticsRepo = new AnalyticsRepository();
    const externalService = new ExternalService();
    
    // Check Service A health
    const serviceAHealth = await externalService.checkServiceHealth();
    if (serviceAHealth?.status === 'healthy') {
      console.log('✅ Service A is healthy');
    } else {
      console.log('⚠️ Service A health check failed');
    }
    
    // Get current metrics for logging
    const metrics = await analyticsRepo.getRealTimeMetrics();
    console.log(`📊 Current metrics: ${metrics.todayOrders} orders today, $${metrics.todayRevenue} revenue`);
    
  } catch (error) {
    console.error('❌ Scheduled analytics update failed:', error);
  }
}

async function bootstrap() {
  try {
    console.log('🚀 Starting Service B (Analytics & Reporting)...');
    await initializeDatabase();
    
    // Start HTTP server
    const server = app.listen(PORT, () => {
      console.log(`✅ Service B running on port ${PORT}`);
      console.log(`📋 Health check: http://localhost:${PORT}/health`);
      console.log(`📖 Service info: http://localhost:${PORT}/info`);
      console.log(`📊 Analytics dashboard: http://localhost:${PORT}/api/analytics/dashboard`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Setup scheduled analytics updates (every 15 minutes by default)
    if (process.env.ENABLE_SCHEDULED_REPORTS === 'true') {
      const interval = process.env.ANALYTICS_UPDATE_INTERVAL || '*/15 * * * *';
      cron.schedule(interval, runScheduledAnalytics);
      console.log(`⏰ Scheduled analytics updates enabled (${interval})`);
    }

    const gracefulShutdown = async (signal: string) => {
      console.log(`\n📡 Received ${signal}. Starting graceful shutdown...`);
      
      // Stop accepting new connections
      server.close(async () => {
        console.log('🔌 HTTP server closed');
        
        try {
          // Close database connection
          await closeDatabase();
          console.log('✅ Service B graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          console.error('❌ Error during Service B shutdown:', error);
          process.exit(1);
        }
      });

      // Force exit after 10 seconds
      setTimeout(() => {
        console.error('⏰ Forcing Service B shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    // Register shutdown handlers
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    process.on('uncaughtException', (error) => {
      console.error('💥 Uncaught Exception in Service B:', error);
      gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('💥 Unhandled Rejection in Service B at:', promise, 'reason:', reason);
      gracefulShutdown('unhandledRejection');
    });

  } catch (error) {
    console.error('💥 Failed to start Service B:', error);
    process.exit(1);
  }
}

bootstrap();