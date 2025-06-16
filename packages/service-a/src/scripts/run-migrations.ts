import { AppDataSource } from '../config/database';

/**
 * Run database migrations
 * Usage: npm run migration:run
 */
async function runMigrations() {
  try {
    console.log('🏗️  Initializing database connection...');
    await AppDataSource.initialize();
    
    console.log('📦 Running migrations...');
    const migrations = await AppDataSource.runMigrations();
    
    if (migrations.length === 0) {
      console.log('✅ No migrations to run - database is up to date');
    } else {
      console.log(`✅ Successfully ran ${migrations.length} migration(s):`);
      migrations.forEach(migration => {
        console.log(`   - ${migration.name}`);
      });
    }
    
    console.log('🔌 Closing database connection...');
    await AppDataSource.destroy();
    
    console.log('✅ Migration process completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
    
    process.exit(1);
  }
}

runMigrations();