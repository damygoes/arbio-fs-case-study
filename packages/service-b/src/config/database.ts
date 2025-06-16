import { getBaseDataSourceOptions, SCHEMA_VERSION, validateSchemaCompatibility } from '@arbio/shared-models';
import dotenv from 'dotenv';
import * as path from 'path';
import { DataSource } from 'typeorm';

dotenv.config({
  path: path.resolve(__dirname, '../.env.local')
});

// Validate schema compatibility at startup
validateSchemaCompatibility(process.env.SCHEMA_VERSION);

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_DATABASE || 'service_b_db'
};

export const AppDataSource = new DataSource({
  ...getBaseDataSourceOptions(config),
  // Service B specific configuration
  migrationsTableName: 'service_b_migrations',
  logging: process.env.NODE_ENV === 'development'
} as any);

export async function initializeDatabase(): Promise<void> {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('✅ Service B Database connected successfully');
      console.log(`📊 Using schema version: ${SCHEMA_VERSION}`);
    }
  } catch (error) {
    console.error('❌ Service B Database connection failed:', error);
    throw error;
  }
}

export async function closeDatabase(): Promise<void> {
  try {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('✅ Service B Database connection closed');
    }
  } catch (error) {
    console.error('❌ Error closing Service B database:', error);
    throw error;
  }
}