import { SCHEMA_VERSION as CURRENT_SCHEMA_VERSION, validateSchemaCompatibility } from '@arbio/shared-models';
import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import 'reflect-metadata';

import analyticsRoutes from './features/analytics/analytics.route';
import syncRoutes from './features/sync/sync.route';

// Validate schema compatibility at startup
const expectedSchemaVersion = process.env.SCHEMA_VERSION;

if (!expectedSchemaVersion) {
  console.warn('⚠️ SCHEMA_VERSION not set. Skipping compatibility check.');
} else {
  validateSchemaCompatibility(expectedSchemaVersion);
  console.log(`✅ Schema version ${expectedSchemaVersion} is compatible with ${CURRENT_SCHEMA_VERSION}`);
}

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// Compression middleware
app.use(compression());

// Logging middleware (skip in dev environment)
if (process.env.NODE_ENV !== 'development') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3002'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware
app.use(express.json({ 
  limit: '10mb',
  strict: true
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// API routes
app.use('/api/analytics', analyticsRoutes);
app.use('/api/sync', syncRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    service: 'service-b',
    version: '1.0.0',
    schemaVersion: CURRENT_SCHEMA_VERSION,
    description: 'Analytics and reporting service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Service information endpoint
app.get('/info', (req, res) => {
  res.json({
    service: 'Service B - Analytics & Reporting',
    version: '1.0.0',
    description: 'Specialized service for business analytics, reporting, and data insights',
    schemaVersion: CURRENT_SCHEMA_VERSION,
    capabilities: [
      'Business analytics and metrics',
      'Period-over-period comparisons', 
      'Cohort analysis',
      'Real-time dashboard data',
      'Automated report generation',
      'Service A data synchronization',
      'Data consistency validation'
    ],
    endpoints: {
      analytics: [
        'GET /api/analytics/dashboard - Complete dashboard data',
        'GET /api/analytics/metrics - Business metrics only',
        'GET /api/analytics/insights - AI-driven insights and recommendations',
        'GET /api/analytics/reports/:type - Generate daily/weekly/monthly reports',
        'GET /api/analytics/comparison?days=N - Period comparison data',
        'GET /api/analytics/cohorts - User cohort analysis',
        'GET /api/analytics/health - Service health and consistency status'
      ],
      synchronization: [
        'GET /api/sync/user/:userId - Sync specific user from Service A',
        'GET /api/sync/orders/:userId - Sync user orders from Service A',
        'GET /api/sync/all-users - Sync all users from Service A',
        'GET /api/sync/health-check - Check Service A health',
        'GET /api/sync/stats-comparison - Compare stats with Service A',
        'POST /api/sync/validate-consistency - Validate data consistency'
      ]
    },
    externalDependencies: {
      'service-a': process.env.SERVICE_A_URL || 'http://localhost:3001'
    },
    features: {
      sharedModels: true,
      versionCompatibility: true,
      interServiceCommunication: true,
      analytics: true,
      reporting: true
    }
  });
});

// API documentation endpoint
app.get('/api', (req, res) => {
  res.redirect('/info');
});

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false,
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    service: 'service-b'
  });
});

// Global error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error in Service B:', err);
  
  // Log error details in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error stack:', err.stack);
  }
  
  // Return appropriate error response
  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      service: 'service-b',
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      message: err.message,
      stack: err.stack,
      service: 'service-b',
      timestamp: new Date().toISOString()
    });
  }
});

export default app;