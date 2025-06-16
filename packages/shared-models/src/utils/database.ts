import { DataSourceOptions } from 'typeorm';
import { Order } from '../entities/Order.entity';
import { User } from '../entities/User.entity';
import { CreateUsers1640000000000 } from '../migrations/1640000000000-CreateUsers.ts';
import { CreateOrders1640000000001 } from '../migrations/1640000000001-CreateOrders';

export const getBaseDataSourceOptions = (config: {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}): Partial<DataSourceOptions> => ({
  type: 'mysql',
  host: config.host,
  port: config.port,
  username: config.username,
  password: config.password,
  database: config.database,
  entities: [User, Order],
  migrations: [CreateUsers1640000000000, CreateOrders1640000000001],
  synchronize: false, // Always use migrations in production
  logging: process.env.NODE_ENV === 'development',
  migrationsRun: false // Services control when to run migrations
});