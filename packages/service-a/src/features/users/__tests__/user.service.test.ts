
import { UserRepository } from '../user.repository';
import { UserService } from '../user.service';

describe('UserService', () => {
  let userService: UserService;
  let userRepository: UserRepository;

  beforeEach(() => {
    userRepository = new UserRepository();
    userService = new UserService(userRepository);
  });

  describe('create', () => {
    it('should create a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User'
      };

      const user = await userService.create(userData);

      expect(user).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.firstName).toBe(userData.firstName);
      expect(user.lastName).toBe(userData.lastName);
      expect(user.fullName).toBe('Test User');
      expect(user.isActive).toBe(true);
    });

    it('should throw error when email already exists', async () => {
      const userData = {
        email: 'duplicate@example.com',
        firstName: 'Test',
        lastName: 'User'
      };

      // Create first user
      await userService.create(userData);

      // Try to create second user with same email
      await expect(userService.create(userData))
        .rejects
        .toThrow('User with this email already exists');
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const userData = {
        email: 'findme@example.com',
        firstName: 'Find',
        lastName: 'Me'
      };

      const createdUser = await userService.create(userData);
      const foundUser = await userService.findByEmail(userData.email);

      expect(foundUser).toBeDefined();
      expect(foundUser!.id).toBe(createdUser.id);
      expect(foundUser!.email).toBe(userData.email);
    });

    it('should return null for non-existent email', async () => {
      const user = await userService.findByEmail('nonexistent@example.com');
      expect(user).toBeNull();
    });
  });
});