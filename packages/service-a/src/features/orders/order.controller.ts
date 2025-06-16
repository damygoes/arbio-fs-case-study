import { CreateOrderDto, OrderStatus, UpdateOrderDto } from '@arbio/shared-models';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { Request, Response } from 'express';
import { validateIdParam } from '../../utils/validate-id-param';
import { OrderFilters } from './order.repository';
import { OrderService } from './order.service';

export class OrderController {
  constructor(private orderService: OrderService) {}

  /**
   * GET /api/orders
   * Get all orders with optional filtering
   */
  async getOrders(req: Request, res: Response): Promise<void> {
    try {
      // Parse query parameters for filtering
      const filters: OrderFilters = {};
      
      if (req.query.status) {
        filters.status = req.query.status as OrderStatus;
      }
      if (req.query.userId) {
        filters.userId = req.query.userId as string;
      }
      if (req.query.startDate) {
        filters.startDate = new Date(req.query.startDate as string);
      }
      if (req.query.endDate) {
        filters.endDate = new Date(req.query.endDate as string);
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

      const orders = await this.orderService.findAll(filters);
      
      res.json({
        success: true,
        data: orders,
        count: orders.length
      });
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch orders' 
      });
    }
  }

  /**
   * GET /api/orders/:id
   * Get order by ID
   */
  async getOrder(req: Request, res: Response): Promise<void> {
    try {
      const id = validateIdParam(req, res);
      
      if (!id) return;

      const order = await this.orderService.findById(id);
      
      if (!order) {
        res.status(404).json({ 
          success: false,
          error: 'Order not found' 
        });
        return;
      }
      
      res.json({
        success: true,
        data: order
      });
    } catch (error) {
      console.error('Failed to fetch order:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch order' 
      });
    }
  }

  /**
   * GET /api/orders/user/:userId
   * Get orders for specific user
   */
  async getUserOrders(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      if (!userId) {
        res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
        return;
      }
      const orders = await this.orderService.findByUserId(userId);
      
      res.json({
        success: true,
        data: orders,
        count: orders.length
      });
    } catch (error) {
      console.error('Failed to fetch user orders:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch user orders' 
      });
    }
  }

  /**
   * POST /api/orders
   * Create new order
   */
  async createOrder(req: Request, res: Response): Promise<void> {
    try {
      // Transform and validate input
      const dto = plainToClass(CreateOrderDto, req.body);
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
      
      const order = await this.orderService.create(dto);
      
      res.status(201).json({
        success: true,
        data: order,
        message: 'Order created successfully'
      });
    } catch (error) {
      console.error('Failed to create order:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          res.status(404).json({ 
            success: false,
            error: error.message 
          });
        } else if (error.message.includes('inactive') || error.message.includes('greater than zero')) {
          res.status(400).json({ 
            success: false,
            error: error.message 
          });
        } else {
          res.status(500).json({ 
            success: false,
            error: 'Failed to create order' 
          });
        }
      } else {
        res.status(500).json({ 
          success: false,
          error: 'Failed to create order' 
        });
      }
    }
  }

  /**
   * PUT /api/orders/:id
   * Update order
   */
  async updateOrder(req: Request, res: Response): Promise<void> {
    try {
      const id = validateIdParam(req, res);
  if (!id) return;
      
      // Transform and validate input
      const dto = plainToClass(UpdateOrderDto, req.body);
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
      
      const order = await this.orderService.update(id, dto);
      
      res.json({
        success: true,
        data: order,
        message: 'Order updated successfully'
      });
    } catch (error) {
      console.error('Failed to update order:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          res.status(404).json({ 
            success: false,
            error: error.message 
          });
        } else if (error.message.includes('transition') || error.message.includes('greater than zero')) {
          res.status(400).json({ 
            success: false,
            error: error.message 
          });
        } else {
          res.status(500).json({ 
            success: false,
            error: 'Failed to update order' 
          });
        }
      } else {
        res.status(500).json({ 
          success: false,
          error: 'Failed to update order' 
        });
      }
    }
  }

  /**
   * PATCH /api/orders/:id/status
   * Update order status
   */
  async updateOrderStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Order ID is required'
        });
        return;
      }
      
      if (!Object.values(OrderStatus).includes(status)) {
        res.status(400).json({ 
          success: false,
          error: 'Invalid order status',
          validStatuses: Object.values(OrderStatus)
        });
        return;
      }
      
      await this.orderService.updateStatus(id, status);
      
      const updatedOrder = await this.orderService.findById(id);
      
      res.json({
        success: true,
        data: updatedOrder,
        message: 'Order status updated successfully'
      });
    } catch (error) {
      console.error('Failed to update order status:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          res.status(404).json({ 
            success: false,
            error: error.message 
          });
        } else if (error.message.includes('transition')) {
          res.status(400).json({ 
            success: false,
            error: error.message 
          });
        } else {
          res.status(500).json({ 
            success: false,
            error: 'Failed to update order status' 
          });
        }
      } else {
        res.status(500).json({ 
          success: false,
          error: 'Failed to update order status' 
        });
      }
    }
  }

  /**
   * PATCH /api/orders/:id/cancel
   * Cancel order
   */
  async cancelOrder(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      
      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Order ID is required'
        });
        return;
      }
      
      const order = await this.orderService.cancelOrder(id, reason);
      
      res.json({
        success: true,
        data: order,
        message: 'Order cancelled successfully'
      });
    } catch (error) {
      console.error('Failed to cancel order:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          res.status(404).json({ 
            success: false,
            error: error.message 
          });
        } else if (error.message.includes('cancel')) {
          res.status(400).json({ 
            success: false,
            error: error.message 
          });
        } else {
          res.status(500).json({ 
            success: false,
            error: 'Failed to cancel order' 
          });
        }
      } else {
        res.status(500).json({ 
          success: false,
          error: 'Failed to cancel order' 
        });
      }
    }
  }

  /**
   * DELETE /api/orders/:id
   * Delete order
   */
  async deleteOrder(req: Request, res: Response): Promise<void> {
    try {
      const id = validateIdParam(req, res);
  if (!id) return;
      await this.orderService.delete(id);
      
      res.status(204).send();
    } catch (error) {
      console.error('Failed to delete order:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          res.status(404).json({ 
            success: false,
            error: error.message 
          });
        } else if (error.message.includes('delete')) {
          res.status(400).json({ 
            success: false,
            error: error.message 
          });
        } else {
          res.status(500).json({ 
            success: false,
            error: 'Failed to delete order' 
          });
        }
      } else {
        res.status(500).json({ 
          success: false,
          error: 'Failed to delete order' 
        });
      }
    }
  }

  /**
   * GET /api/orders/stats
   * Get order statistics
   */
  async getOrderStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.orderService.getOrderStats();
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Failed to fetch order stats:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch order statistics' 
      });
    }
  }

  /**
   * GET /api/orders/user/:userId/stats
   * Get user-specific order statistics
   */
  async getUserOrderStats(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      if (!userId) {
        res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
        return;
      }
      const stats = await this.orderService.getUserOrderStats(userId);
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Failed to fetch user order stats:', error);
      
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({ 
          success: false,
          error: error.message 
        });
      } else {
        res.status(500).json({ 
          success: false,
          error: 'Failed to fetch user order statistics' 
        });
      }
    }
  }
}