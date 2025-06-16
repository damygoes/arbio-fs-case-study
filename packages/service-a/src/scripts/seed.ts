import { OrderStatus } from '@arbio/shared-models';
import { AppDataSource } from '../config/database';
import { OrderRepository } from '../features/orders/order.repository';
import { UserRepository } from '../features/users/user.repository';

/**
 * Seed database with sample data
 * Usage: npm run seed
 */
async function seed() {
  try {
    console.log('🌱 Starting database seeding...');
    await AppDataSource.initialize();
    
    const userRepo = new UserRepository();
    const orderRepo = new OrderRepository();
    
    console.log('👥 Creating sample users...');
    
    // Create sample users
    const user1 = await userRepo.createUser({
      email: 'john.doe@example.com',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+49-1621-2343-567',
    });
    
    const user2 = await userRepo.createUser({
      email: 'jane.smith@example.com',
      firstName: 'Jane',
      lastName: 'Smith',
      phone: '+49-1621-2343-568',
    });
    
    const user3 = await userRepo.createUser({
      email: 'mike.johnson@example.com',
      firstName: 'Mike',
      lastName: 'Johnson'
    });
    console.log( '✅ Finished creating users...' );
    
    console.log('📦 Creating sample orders...');
    
    const order1 = await orderRepo.createOrder({
      userId: user1.id,
      totalAmount: 99.99,
      notes: 'First order - Standard delivery'
    });
    
    const order2 = await orderRepo.createOrder({
      userId: user1.id,
      totalAmount: 149.50,
      notes: 'Second order - Express delivery'
    });
    
    await orderRepo.updateStatus(order2.id, OrderStatus.PROCESSING);
    console.log(`   📝 Updated order ${order2.id} status to ${OrderStatus.PROCESSING}`);
    
    const order3 = await orderRepo.createOrder({
      userId: user2.id,
      totalAmount: 79.99,
      notes: 'Jane\'s first order'
    });
    console.log(`   ✅ Created order ${order3.id} for ${user2.email}`);
    
    await orderRepo.updateStatus(order3.id, OrderStatus.PROCESSING);
    await orderRepo.updateStatus(order3.id, OrderStatus.SHIPPED);
    console.log(`   📝 Updated order ${order3.id} status to ${OrderStatus.SHIPPED}`);
    
    const order4 = await orderRepo.createOrder({
      userId: user2.id,
      totalAmount: 299.99,
      notes: 'Large order - Multiple items'
    });
    console.log(`   ✅ Created order ${order4.id} for ${user2.email}`);
    
    const order5 = await orderRepo.createOrder({
      userId: user3.id,
      totalAmount: 199.95,
      notes: 'Mike\'s order - Gift wrapping requested'
    });
    
    // Complete the order workflow
    await orderRepo.updateStatus(order5.id, OrderStatus.PROCESSING);
    await orderRepo.updateStatus(order5.id, OrderStatus.SHIPPED);
    await orderRepo.updateStatus(order5.id, OrderStatus.DELIVERED);
    console.log(`   ✅ Created and completed order ${order5.id} for ${user3.email}`);
    
    // Create a cancelled order
    const order6 = await orderRepo.createOrder({
      userId: user1.id,
      totalAmount: 49.99,
      notes: 'Order to be cancelled'
    });
    await orderRepo.updateStatus(order6.id, OrderStatus.CANCELLED);
    console.log(`   ✅ Created and cancelled order ${order6.id} for ${user1.email}`);
    
    console.log('📊 Seed data summary:');
    console.log(`   - Users created: 3`);
    console.log(`   - Orders created: 6`);
    console.log(`   - Order statuses: 1 pending, 1 processing, 1 shipped, 1 delivered, 1 cancelled`);
    
    await AppDataSource.destroy();
    console.log('✅ Database seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
    
    process.exit(1);
  }
}

seed();