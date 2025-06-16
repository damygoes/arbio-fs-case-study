import {
  CreateUserData,
  CreateUserDto,
  IUserService,
  UpdateUserDto,
  UserProfile
} from '@arbio/shared-models';
import { UserFilters, UserRepository } from './user.repository';

export class UserService implements IUserService {
  constructor(private userRepository: UserRepository) {}

  /**
   * Find user by ID and return profile
   */
  async findById(id: string): Promise<UserProfile | null> {
    const user = await this.userRepository.findById(id);
    return user ? this.mapToProfile(user) : null;
  }

  /**
   * Find user by email and return profile
   */
  async findByEmail(email: string): Promise<UserProfile | null> {
    const user = await this.userRepository.findByEmail(email);
    return user ? this.mapToProfile(user) : null;
  }

  /**
   * Create new user with validation
   */
  async create(userData: CreateUserData): Promise<UserProfile> {
    const existingUser = await this.userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const user = await this.userRepository.createUser(userData as CreateUserDto);
    return this.mapToProfile(user);
  }

  /**
   * Find all users with optional filtering
   */
  async findAll(filters?: UserFilters): Promise<UserProfile[]> {
    const users = await this.userRepository.findWithFilters(filters);
    return users.map(user => this.mapToProfile(user));
  }

  /**
   * Update user information
   */
    async update(id: string, userData: UpdateUserDto): Promise<UserProfile | null> {
        const user = await this.userRepository.updateUser(id, userData);
        return user ? this.mapToProfile(user) : null;
    }


  /**
   * Deactivate user (soft delete)
   */
  async deactivate(id: string): Promise<UserProfile | null> {
    const user = await this.userRepository.deactivateUser(id);
    return user ? this.mapToProfile(user) : null;
  }

  /**
   * Delete user permanently
   */
  async delete(id: string): Promise<void> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    const deleted = await this.userRepository.delete(id);
    if (!deleted) {
      throw new Error('Failed to delete user');
    }
  }

  /**
   * Get user with their order history
   */
  async findWithOrders(id: string): Promise<any> {
    const user = await this.userRepository.findWithOrders(id);
    if (!user) {
      return null;
    }

    return {
      ...this.mapToProfile(user),
      orders: user.orders || []
    };
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
  }> {
    return this.userRepository.getUserStats();
  }

  /**
   * Map entity to profile (data transformation)
   */
  private mapToProfile(user: any): UserProfile {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }
}