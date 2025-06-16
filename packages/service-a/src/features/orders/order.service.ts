import {
  CreateOrderData,
  CreateOrderDto,
  IOrderService,
  OrderStatus,
  OrderSummary,
  UpdateOrderDto
} from '@arbio/shared-models';
import { UserRepository } from '../users/user.repository';
import { OrderFilters, OrderRepository } from './order.repository';


export interface OrderStats {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  ordersByStatus: Record<OrderStatus, number>;
}

export class OrderService implements IOrderService {
  constructor(
    private orderRepository: OrderRepository,
    private userRepository: UserRepository
  ) {}

  /**
   * Find order by ID
   */
  async findById(orderId: string): Promise<OrderSummary | null> {
    const order = await this.orderRepository.findByIdWithUser(orderId);
    return order ? this.mapToSummary(order) : null;
  }

  /**
   * Find all orders for a user
   */
  async findByUserId(userId: string): Promise<OrderSummary[]> {
    const orders = await this.orderRepository.findByUserId(userId);
    return orders.map(order => this.mapToSummary(order));
  }

  /**
   * Find all orders with filtering
   */
  async findAll(filters?: OrderFilters): Promise<OrderSummary[]> {
    const orders = await this.orderRepository.findWithFilters(filters);
    return orders.map(order => this.mapToSummary(order));
  }

  /**
   * Create new order with comprehensive validation
   */
  async create(orderData: CreateOrderData): Promise<OrderSummary> {
    // Validate user exists and is active
    const user = await this.userRepository.findById(orderData.userId);
    if (!user) {
      throw new Error('User not found');
    }
    if (!user.isActive) {
      throw new Error('Cannot create order for inactive user');
    }

    // Validate order amount
    if (orderData.totalAmount <= 0) {
      throw new Error('Order amount must be greater than zero');
    }

    // Create order
    const order = await this.orderRepository.createOrder(orderData as CreateOrderDto);
    
    // Fetch the created order with user relation
    const createdOrder = await this.orderRepository.findByIdWithUser(order.id);
    if (!createdOrder) {
      throw new Error('Failed to retrieve created order');
    }

    return this.mapToSummary(createdOrder);
  }

  /**
   * Update order status with validation
   */
  async updateStatus(orderId: string, status: OrderStatus): Promise<void> {
    const existingOrder = await this.orderRepository.findByIdWithUser(orderId);
    if (!existingOrder) {
      throw new Error('Order not found');
    }

    // Validate status transition
    this.validateStatusTransition(existingOrder.status, status);

    const updatedOrder = await this.orderRepository.updateStatus(orderId, status);
    if (!updatedOrder) {
      throw new Error('Failed to update order status');
    }
  }

  /**
   * Update order with comprehensive validation
   */
  async update(orderId: string, updateData: UpdateOrderDto): Promise<OrderSummary> {
    const existingOrder = await this.orderRepository.findByIdWithUser(orderId);
    if (!existingOrder) {
      throw new Error('Order not found');
    }

    // Validate amount if provided
    if (updateData.totalAmount !== undefined && updateData.totalAmount <= 0) {
      throw new Error('Order amount must be greater than zero');
    }

    // Validate status transition if provided
    if (updateData.status && updateData.status !== existingOrder.status) {
      this.validateStatusTransition(existingOrder.status, updateData.status);
    }

    const updatedOrder = await this.orderRepository.update(orderId, updateData);
    if (!updatedOrder) {
      throw new Error('Failed to update order');
    }

    // Get updated order with user relation
    const orderWithUser = await this.orderRepository.findByIdWithUser(orderId);
    return this.mapToSummary(orderWithUser!);
  }

  /**
   * Cancel order with reason
   */
  async cancelOrder(orderId: string, reason?: string): Promise<OrderSummary> {
    const existingOrder = await this.orderRepository.findByIdWithUser(orderId);
    if (!existingOrder) {
      throw new Error('Order not found');
    }

    // Only allow cancellation of pending or processing orders
    if (![OrderStatus.PENDING, OrderStatus.PROCESSING].includes(existingOrder.status)) {
      throw new Error('Cannot cancel order that is already shipped or delivered');
    }

    // Update order with cancellation
    const updateData: any = { status: OrderStatus.CANCELLED };
    if (reason) {
      const existingNotes = existingOrder.notes || '';
      updateData.notes = `${existingNotes}\nCancellation reason: ${reason}`.trim();
    }

    const updatedOrder = await this.orderRepository.update(orderId, updateData);
    if (!updatedOrder) {
      throw new Error('Failed to cancel order');
    }

    const orderWithUser = await this.orderRepository.findByIdWithUser(orderId);
    return this.mapToSummary(orderWithUser!);
  }

  /**
   * Delete order (only pending/cancelled orders)
   */
  async delete(orderId: string): Promise<void> {
    const existingOrder = await this.orderRepository.findByIdWithUser(orderId);
    if (!existingOrder) {
      throw new Error('Order not found');
    }

    // Only allow deletion of pending or cancelled orders
    if (![OrderStatus.PENDING, OrderStatus.CANCELLED].includes(existingOrder.status)) {
      throw new Error('Cannot delete order that is in progress or completed');
    }

    const deleted = await this.orderRepository.delete(orderId);
    if (!deleted) {
      throw new Error('Failed to delete order');
    }
  }

  /**
   * Get comprehensive order statistics
   */
  async getOrderStats(): Promise<OrderStats> {
    const [totalRevenue, averageOrderValue, ordersByStatus] = await Promise.all([
      this.orderRepository.getTotalRevenue(),
      this.orderRepository.getAverageOrderValue(),
      this.orderRepository.getOrderCountByStatus()
    ]);

    const totalOrders = Object.values(ordersByStatus).reduce((sum, count) => sum + count, 0);

    return {
      totalOrders,
      totalRevenue: Number(totalRevenue.toFixed(2)),
      averageOrderValue: Number(averageOrderValue.toFixed(2)),
      ordersByStatus
    };
  }

  /**
   * Get user-specific order statistics
   */
  async getUserOrderStats(userId: string): Promise<{
    totalOrders: number;
    totalSpent: number;
    averageOrderValue: number;
    ordersByStatus: Record<OrderStatus, number>;
    recentOrders: OrderSummary[];
  }> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const [stats, recentOrders] = await Promise.all([
      this.orderRepository.getUserOrderStats(userId),
      this.orderRepository.findByUserId(userId)
    ]);

    return {
      ...stats,
      recentOrders: recentOrders.slice(0, 5).map(order => this.mapToSummary(order))
    };
  }

  /**
   * Map order entity to summary DTO
   */
  private mapToSummary(order: any): OrderSummary {
    return {
      id: order.id,
      totalAmount: Number(order.totalAmount),
      status: order.status,
      createdAt: order.createdAt,
      userEmail: order.user?.email || 'Unknown',
    };
  }

  /**
   * Validate order status transitions
   */
  private validateStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus): void {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
      [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
      [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
      [OrderStatus.DELIVERED]: [], // No transitions from delivered
      [OrderStatus.CANCELLED]: [] // No transitions from cancelled
    };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new Error(
        `Invalid status transition from ${currentStatus} to ${newStatus}. ` +
        `Valid transitions: ${validTransitions[currentStatus].join(', ') || 'none'}`
      );
    }
  }
}