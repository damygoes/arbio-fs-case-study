import { AppDataSource } from '../config/database';

/**
 * Run database migrations for Service B
 * Uses the same migrations as Service A but tracks them separately
 */
async function runMigrations() {
  try {
    console.log('🏗️  Initializing Service B database connection...');
    await AppDataSource.initialize();
    
    console.log('📦 Running Service B migrations...');
    const migrations = await AppDataSource.runMigrations();
    
    if (migrations.length === 0) {
      console.log('✅ No migrations to run - Service B database is up to date');
    } else {
      console.log(`✅ Successfully ran ${migrations.length} migration(s) for Service B:`);
      migrations.forEach(migration => {
        console.log(`   - ${migration.name}`);
      });
    }
    
    console.log('🔌 Closing Service B database connection...');
    await AppDataSource.destroy();
    
    console.log('✅ Service B migration process completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Service B migration failed:', error);
    
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
    
    process.exit(1);
  }
}

runMigrations();