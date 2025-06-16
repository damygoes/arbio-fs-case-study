import { CreateOrderDto, Order, OrderStatus } from '@arbio/shared-models';
import { BaseRepository } from '../../repositories/base.repository';

export interface OrderFilters {
  status?: OrderStatus;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'totalAmount' | 'status';
  sortOrder?: 'ASC' | 'DESC';
}

export class OrderRepository extends BaseRepository<Order> {
  constructor() {
    super(Order);
  }

  /**
   * Find order by ID with user information
   */
  async findByIdWithUser(id: string): Promise<Order | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['user']
    });
  }

  /**
   * Find all orders for a specific user
   */
  async findByUserId(userId: string): Promise<Order[]> {
    return this.repository.find({
      where: { userId },
      relations: ['user'],
      order: { createdAt: 'DESC' }
    });
  }

  /**
   * Find orders with advanced filtering
   */
  async findWithFilters(filters: OrderFilters = {}): Promise<Order[]> {
    const queryBuilder = this.repository.createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user');

    // Apply status filter
    if (filters.status) {
      queryBuilder.andWhere('order.status = :status', { 
        status: filters.status 
      });
    }

    // Apply user filter
    if (filters.userId) {
      queryBuilder.andWhere('order.userId = :userId', { 
        userId: filters.userId 
      });
    }

    // Apply date range filter
    if (filters.startDate) {
      queryBuilder.andWhere('order.createdAt >= :startDate', { 
        startDate: filters.startDate 
      });
    }
    if (filters.endDate) {
      queryBuilder.andWhere('order.createdAt <= :endDate', { 
        endDate: filters.endDate 
      });
    }

    // Apply sorting
    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder || 'DESC';
    queryBuilder.orderBy(`order.${sortBy}`, sortOrder);

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
   * Find orders by status and user combination
   */
  async findByStatusAndUser(status: OrderStatus, userId: string): Promise<Order[]> {
    return this.repository.find({
      where: { status, userId },
      relations: ['user'],
      order: { createdAt: 'DESC' }
    });
  }

  /**
   * Create order with validation
   */
  async createOrder(orderData: CreateOrderDto): Promise<Order> {
    const order = this.repository.create(orderData);
    return this.repository.save(order);
  }

  /**
   * Update order status specifically
   */
  async updateStatus(id: string, status: OrderStatus): Promise<Order | null> {
    return this.update(id, { status });
  }

  /**
   * Get order count by status
   */
  async getOrderCountByStatus(): Promise<Record<OrderStatus, number>> {
    const results = await this.repository
      .createQueryBuilder('order')
      .select('order.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('order.status')
      .getRawMany();

    // Initialize with all statuses
    const statusCounts: Record<OrderStatus, number> = {
      [OrderStatus.PENDING]: 0,
      [OrderStatus.PROCESSING]: 0,
      [OrderStatus.SHIPPED]: 0,
      [OrderStatus.DELIVERED]: 0,
      [OrderStatus.CANCELLED]: 0
    };

    // Fill in actual counts
    results.forEach(result => {
      statusCounts[result.status as OrderStatus] = parseInt(result.count);
    });

    return statusCounts;
  }

  /**
   * Get total revenue from completed orders
   */
  async getTotalRevenue(): Promise<number> {
    const result = await this.repository
      .createQueryBuilder('order')
      .select('SUM(order.totalAmount)', 'total')
      .where('order.status IN (:...statuses)', { 
        statuses: [OrderStatus.DELIVERED, OrderStatus.SHIPPED] 
      })
      .getRawOne();

    return parseFloat(result.total) || 0;
  }

  /**
   * Get average order value
   */
  async getAverageOrderValue(): Promise<number> {
    const result = await this.repository
      .createQueryBuilder('order')
      .select('AVG(order.totalAmount)', 'average')
      .getRawOne();

    return parseFloat(result.average) || 0;
  }

  /**
   * Get comprehensive order statistics for a user
   */
  async getUserOrderStats(userId: string): Promise<{
    totalOrders: number;
    totalSpent: number;
    averageOrderValue: number;
    ordersByStatus: Record<OrderStatus, number>;
  }> {
    const orders = await this.findByUserId(userId);
    
    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
    const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

    // Count orders by status for this user
    const ordersByStatus = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<OrderStatus, number>);

    // Ensure all statuses are present
    Object.values(OrderStatus).forEach(status => {
      if (!ordersByStatus[status]) {
        ordersByStatus[status] = 0;
      }
    });

    return {
      totalOrders,
      totalSpent: Number(totalSpent.toFixed(2)),
      averageOrderValue: Number(averageOrderValue.toFixed(2)),
      ordersByStatus
    };
  }
}