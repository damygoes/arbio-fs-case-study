import { AppDataSource } from '../config/database';

// Test database setup
beforeAll(async () => {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
});

afterAll(async () => {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
});

// Clear database between tests
beforeEach(async () => {
  if (process.env.NODE_ENV === 'test') {
    // Disable FK checks before clearing
    await AppDataSource.query('SET FOREIGN_KEY_CHECKS = 0');

    const entities = AppDataSource.entityMetadatas;
    for (const entity of entities) {
      const repository = AppDataSource.getRepository(entity.name);
      await repository.clear(); // effectively DELETE FROM table;
    }

    // Re-enable FK checks after clearing
    await AppDataSource.query('SET FOREIGN_KEY_CHECKS = 1');
  }
});