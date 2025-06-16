import { getBaseDataSourceOptions } from '@arbio/shared-models';
import dotenv from 'dotenv';
import * as path from 'path';
import { DataSource } from 'typeorm';

dotenv.config({
  path: path.resolve(__dirname, '../.env.local')
});

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_DATABASE || 'service_a_db'
};

// Create DataSource using shared configuration
export const AppDataSource = new DataSource({
  ...getBaseDataSourceOptions(config),
  // Service-specific migrations table to avoid conflicts
  migrationsTableName: 'service_a_migrations',
  logging: process.env.NODE_ENV === 'development',
  // Never use synchronize in production
  synchronize: false
} as any);

export async function initializeDatabase(): Promise<void> {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('✅ Database connected successfully');
    }
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}

export async function closeDatabase(): Promise<void> {
  try {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('✅ Database connection closed');
    }
  } catch (error) {
    console.error('❌ Error closing database:', error);
    throw error;
  }
}