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
    // Clear test data between tests
    const entities = AppDataSource.entityMetadatas;
    for (const entity of entities) {
      const repository = AppDataSource.getRepository(entity.name);
      await repository.clear();
    }
  }
});