import { CreateUserDto, UpdateUserDto, User } from '@arbio/shared-models';
import { BaseRepository } from '../../repositories/base.repository';

export interface UserFilters {
  isActive?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'email' | 'firstName' | 'lastName';
  sortOrder?: 'ASC' | 'DESC';
}

export class UserRepository extends BaseRepository<User> {
  constructor() {
    super(User);
  }

  /**
   * Find user by email address
   * Used for login and duplicate checking
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOne({ 
      where: { email: email.toLowerCase() } 
    });
  }

  /**
   * Find users with advanced filtering and pagination
   */
  async findWithFilters(filters: UserFilters = {}): Promise<User[]> {
    const queryBuilder = this.repository.createQueryBuilder('user');

    // Apply filters
    if (filters.isActive !== undefined) {
      queryBuilder.andWhere('user.isActive = :isActive', { 
        isActive: filters.isActive 
      });
    }

    // Apply sorting
    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder || 'DESC';
    queryBuilder.orderBy(`user.${sortBy}`, sortOrder);

    // Apply pagination
    if (filters.limit) {
      queryBuilder.limit(filters.limit);
    }
    if (filters.offset) {
      queryBuilder.offset(filters.offset);
    }

    return queryBuilder.getMany();
  }

  /**
   * Find user with their orders (includes relationship)
   */
  async findWithOrders(id: string): Promise<User | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['orders'],
      order: {
        orders: {
          createdAt: 'DESC'
        }
      }
    });
  }

  /**
   * Create user with validation
   */
  async createUser(userData: CreateUserDto): Promise<User> {
    const normalizedData = {
      ...userData,
      email: userData.email.toLowerCase()
    };

    const user = this.repository.create(normalizedData);
    return this.repository.save(user);
  }

  /**
   * Update user with partial data
   */
    async updateUser(id: string, userData: UpdateUserDto): Promise<User | null> {
    return this.update(id, userData);
    }


  /**
   * Soft delete user (deactivate instead of deleting)
   */
  async deactivateUser(id: string): Promise<User | null> {
    return this.update(id, { isActive: false });
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
  }> {
    const [totalUsers, activeUsers] = await Promise.all([
      this.repository.count(),
      this.repository.count({ where: { isActive: true } })
    ]);

    return {
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers
    };
  }

  /**
   * Check if email is already taken
   */
  async emailExists(email: string, excludeUserId?: string): Promise<boolean> {
    const queryBuilder = this.repository.createQueryBuilder('user')
      .where('user.email = :email', { email: email.toLowerCase() });

    if (excludeUserId) {
      queryBuilder.andWhere('user.id != :excludeUserId', { excludeUserId });
    }

    const count = await queryBuilder.getCount();
    return count > 0;
  }
}