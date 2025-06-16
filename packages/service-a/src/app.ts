import { SCHEMA_VERSION as CURRENT_SCHEMA_VERSION, validateSchemaCompatibility } from '@arbio/shared-models';
import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import 'reflect-metadata';

import orderRoutes from './features/orders/orders.route';
import userRoutes from './features/users/users.route';

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

// Compression middleware for better performance
app.use(compression());

// Logging middleware (skip in test environment)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
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
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    service: 'service-a',
    version: '1.0.0',
    schemaVersion: CURRENT_SCHEMA_VERSION,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    service: 'Service A - Main Application',
    version: '1.0.0',
    description: 'Primary business logic service with full CRUD operations',
    endpoints: {
      users: {
        'GET /api/users': 'Get all users (supports filtering)',
        'GET /api/users/stats': 'Get user statistics',
        'GET /api/users/:id': 'Get user by ID',
        'GET /api/users/:id/with-orders': 'Get user with order history',
        'POST /api/users': 'Create new user',
        'PUT /api/users/:id': 'Update user',
        'PATCH /api/users/:id/deactivate': 'Deactivate user',
        'DELETE /api/users/:id': 'Delete user'
      },
      orders: {
        'GET /api/orders': 'Get all orders (supports filtering)',
        'GET /api/orders/stats': 'Get order statistics',
        'GET /api/orders/:id': 'Get order by ID',
        'GET /api/orders/user/:userId': 'Get orders for user',
        'GET /api/orders/user/:userId/stats': 'Get user order statistics',
        'POST /api/orders': 'Create new order',
        'PUT /api/orders/:id': 'Update order',
        'PATCH /api/orders/:id/status': 'Update order status',
        'PATCH /api/orders/:id/cancel': 'Cancel order',
        'DELETE /api/orders/:id': 'Delete order'
      }
    },
    filters: {
      users: 'isActive, limit, offset, sortBy, sortOrder',
      orders: 'status, userId, startDate, endDate, limit, offset, sortBy, sortOrder'
    }
  });
});

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false,
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Global error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  
  // Log error details in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error stack:', err.stack);
  }
  
  // Return appropriate error response
  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      message: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString()
    });
  }
});

export default app;