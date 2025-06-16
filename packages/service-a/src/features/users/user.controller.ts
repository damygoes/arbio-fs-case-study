import { CreateUserDto, UpdateUserDto } from '@arbio/shared-models';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { Request, Response } from 'express';
import { validateIdParam } from '../../utils/validate-id-param';
import { UserFilters } from './user.repository';
import { UserService } from './user.service';

export class UserController {
  constructor(private userService: UserService) {}

  /**
   * GET /api/users
   * Get all users with optional filtering
   */
  async getUsers(req: Request, res: Response): Promise<void> {
    try {
      // Parse query parameters for filtering
      const filters: UserFilters = {};
      
      if (req.query.isActive !== undefined) {
        filters.isActive = req.query.isActive === 'true';
      }
      if (req.query.limit) {
        filters.limit = parseInt(req.query.limit as string);
      }
      if (req.query.offset) {
        filters.offset = parseInt(req.query.offset as string);
      }
      if (req.query.sortBy) {
        filters.sortBy = req.query.sortBy as any;
      }
      if (req.query.sortOrder) {
        filters.sortOrder = req.query.sortOrder as 'ASC' | 'DESC';
      }

      const users = await this.userService.findAll(filters);
      
      res.json({
        success: true,
        data: users,
        count: users.length
      });
    } catch (error) {
      console.error('Failed to fetch users:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch users' 
      });
    }
  }

  /**
   * GET /api/users/:id
   * Get user by ID
   */
  async getUser(req: Request, res: Response): Promise<void> {
    try {
    const id = validateIdParam(req, res);
  if (!id) return;
      const user = await this.userService.findById(id);
      
      if (!user) {
        res.status(404).json({ 
          success: false,
          error: 'User not found' 
        });
        return;
      }
      
      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      console.error('Failed to fetch user:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch user' 
      });
    }
  }

  /**
   * GET /api/users/:id/with-orders
   * Get user with their order history
   */
  async getUserWithOrders(req: Request, res: Response): Promise<void> {
    try {
    const id = validateIdParam(req, res);
  if (!id) return;
      const user = await this.userService.findWithOrders(id);
      
      if (!user) {
        res.status(404).json({ 
          success: false,
          error: 'User not found' 
        });
        return;
      }
      
      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      console.error('Failed to fetch user with orders:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch user with orders' 
      });
    }
  }

  /**
   * POST /api/users
   * Create new user
   */
  async createUser(req: Request, res: Response): Promise<void> {
    try {
      // Transform and validate input
      const dto = plainToClass(CreateUserDto, req.body);
      const errors = await validate(dto);
      
      if (errors.length > 0) {
        res.status(400).json({ 
          success: false,
          error: 'Validation failed',
          details: errors.map(e => ({
            property: e.property,
            constraints: e.constraints
          }))
        });
        return;
      }
      
      const user = await this.userService.create(dto);
      
      res.status(201).json({
        success: true,
        data: user,
        message: 'User created successfully'
      });
    } catch (error) {
      console.error('Failed to create user:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('already exists')) {
          res.status(409).json({ 
            success: false,
            error: error.message 
          });
        } else {
          res.status(500).json({ 
            success: false,
            error: 'Failed to create user' 
          });
        }
      } else {
        res.status(500).json({ 
          success: false,
          error: 'Failed to create user' 
        });
      }
    }
  }

  /**
   * PUT /api/users/:id
   * Update user
   */
  async updateUser(req: Request, res: Response): Promise<void> {
    try {
    const id = validateIdParam(req, res);
  if (!id) return;
      
      // Transform and validate input
      const dto = plainToClass(UpdateUserDto, req.body);
      const errors = await validate(dto);
      
      if (errors.length > 0) {
        res.status(400).json({ 
          success: false,
          error: 'Validation failed',
          details: errors.map(e => ({
            property: e.property,
            constraints: e.constraints
          }))
        });
        return;
      }
      
      const user = await this.userService.update(id, dto);
      
      if (!user) {
        res.status(404).json({ 
          success: false,
          error: 'User not found' 
        });
        return;
      }
      
      res.json({
        success: true,
        data: user,
        message: 'User updated successfully'
      });
    } catch (error) {
      console.error('Failed to update user:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('already taken')) {
          res.status(409).json({ 
            success: false,
            error: error.message 
          });
        } else {
          res.status(500).json({ 
            success: false,
            error: 'Failed to update user' 
          });
        }
      } else {
        res.status(500).json({ 
          success: false,
          error: 'Failed to update user' 
        });
      }
    }
  }

  /**
   * PATCH /api/users/:id/deactivate
   * Deactivate user (soft delete)
   */
  async deactivateUser(req: Request, res: Response): Promise<void> {
    try {
    const id = validateIdParam(req, res);
  if (!id) return;
      const user = await this.userService.deactivate(id);
      
      if (!user) {
        res.status(404).json({ 
          success: false,
          error: 'User not found' 
        });
        return;
      }
      
      res.json({
        success: true,
        data: user,
        message: 'User deactivated successfully'
      });
    } catch (error) {
      console.error('Failed to deactivate user:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to deactivate user' 
      });
    }
  }

  /**
   * DELETE /api/users/:id
   * Delete user permanently
   */
  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
    const id = validateIdParam(req, res);
  if (!id) return;
      await this.userService.delete(id);
      
      res.status(204).send();
    } catch (error) {
      console.error('Failed to delete user:', error);
      
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({ 
          success: false,
          error: error.message 
        });
      } else {
        res.status(500).json({ 
          success: false,
          error: 'Failed to delete user' 
        });
      }
    }
  }

  /**
   * GET /api/users/stats
   * Get user statistics
   */
  async getUserStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.userService.getUserStats();
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch user statistics' 
      });
    }
  }
}