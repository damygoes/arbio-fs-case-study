import { Order, OrderStatus, User } from '@arbio/shared-models';
import { Between, Repository } from 'typeorm';
import { AppDataSource } from '../../config/database';

export interface AnalyticsMetrics {
  totalUsers: number;
  activeUsers: number;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  conversionRate: number;
  topCustomers: Array<{
    userId: string;
    userEmail: string;
    orderCount: number;
    totalSpent: number;
  }>;
  revenueByMonth: Array<{
    month: string;
    revenue: number;
    orderCount: number;
  }>;
  orderStatusDistribution: Record<OrderStatus, number>;
}

export interface PeriodComparison {
  current: {
    period: string;
    revenue: number;
    orders: number;
    newUsers: number;
  };
  previous: {
    period: string;
    revenue: number;
    orders: number;
    newUsers: number;
  };
  growth: {
    revenueGrowth: number;
    ordersGrowth: number;
    usersGrowth: number;
  };
}

export class AnalyticsRepository {
  private userRepository: Repository<User>;
  private orderRepository: Repository<Order>;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
    this.orderRepository = AppDataSource.getRepository(Order);
  }

  /**
   * Get comprehensive business metrics
   */
  async getBusinessMetrics(): Promise<AnalyticsMetrics> {
    const [
      totalUsers,
      activeUsers,
      orderStats,
      topCustomers,
      revenueByMonth,
      orderStatusDistribution
    ] = await Promise.all([
      this.getTotalUsers(),
      this.getActiveUsers(),
      this.getOrderStatistics(),
      this.getTopCustomers(),
      this.getRevenueByMonth(),
      this.getOrderStatusDistribution()
    ]);

    const conversionRate = totalUsers > 0 ? (orderStats.uniqueCustomers / totalUsers) * 100 : 0;

    return {
      totalUsers,
      activeUsers,
      totalOrders: orderStats.totalOrders,
      totalRevenue: orderStats.totalRevenue,
      averageOrderValue: orderStats.averageOrderValue,
      conversionRate: Number(conversionRate.toFixed(2)),
      topCustomers,
      revenueByMonth,
      orderStatusDistribution
    };
  }

  /**
   * Compare current period with previous period
   */
  async getPeriodComparison(periodDays: number = 30): Promise<PeriodComparison> {
    const now = new Date();
    const currentPeriodStart = new Date(now.getTime() - (periodDays * 24 * 60 * 60 * 1000));
    const previousPeriodStart = new Date(currentPeriodStart.getTime() - (periodDays * 24 * 60 * 60 * 1000));

    const [currentMetrics, previousMetrics] = await Promise.all([
      this.getPeriodMetrics(currentPeriodStart, now),
      this.getPeriodMetrics(previousPeriodStart, currentPeriodStart)
    ]);

    const revenueGrowth = previousMetrics.revenue > 0 
      ? ((currentMetrics.revenue - previousMetrics.revenue) / previousMetrics.revenue) * 100 
      : 0;

    const ordersGrowth = previousMetrics.orders > 0
      ? ((currentMetrics.orders - previousMetrics.orders) / previousMetrics.orders) * 100
      : 0;

    const usersGrowth = previousMetrics.newUsers > 0
      ? ((currentMetrics.newUsers - previousMetrics.newUsers) / previousMetrics.newUsers) * 100
      : 0;

    return {
      current: {
        period: `${currentPeriodStart.toISOString().split('T')[0]} to ${now.toISOString().split('T')[0]}`,
        ...currentMetrics
      },
      previous: {
        period: `${previousPeriodStart.toISOString().split('T')[0]} to ${currentPeriodStart.toISOString().split('T')[0]}`,
        ...previousMetrics
      },
      growth: {
        revenueGrowth: Number(revenueGrowth.toFixed(2)),
        ordersGrowth: Number(ordersGrowth.toFixed(2)),
        usersGrowth: Number(usersGrowth.toFixed(2))
      }
    };
  }

  /**
   * Get user cohort analysis
   */
  async getCohortAnalysis(): Promise<Array<{
    cohort: string;
    usersCount: number;
    totalRevenue: number;
    averageOrderValue: number;
    retentionRate: number;
  }>> {
    const cohorts = await this.userRepository
      .createQueryBuilder('user')
      .select([
        'DATE_FORMAT(user.createdAt, "%Y-%m") as cohort',
        'COUNT(*) as usersCount',
        'SUM(COALESCE(order.totalAmount, 0)) as totalRevenue',
        'AVG(COALESCE(order.totalAmount, 0)) as averageOrderValue',
        'COUNT(DISTINCT CASE WHEN order.id IS NOT NULL THEN user.id END) / COUNT(*) * 100 as retentionRate'
      ])
      .leftJoin('user.orders', 'order')
      .groupBy('cohort')
      .orderBy('cohort', 'DESC')
      .limit(12) // Last 12 months
      .getRawMany();

    return cohorts.map(cohort => ({
      cohort: cohort.cohort,
      usersCount: parseInt(cohort.usersCount),
      totalRevenue: Number(parseFloat(cohort.totalRevenue || '0').toFixed(2)),
      averageOrderValue: Number(parseFloat(cohort.averageOrderValue || '0').toFixed(2)),
      retentionRate: Number(parseFloat(cohort.retentionRate || '0').toFixed(2))
    }));
  }

  /**
   * Get real-time analytics for dashboard
   */
  async getRealTimeMetrics(): Promise<{
    pendingOrders: number;
    processingOrders: number;
    todayRevenue: number;
    todayOrders: number;
    activeUsersToday: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [pendingOrders, processingOrders, todayStats, activeUsersToday] = await Promise.all([
      this.orderRepository.count({ where: { status: OrderStatus.PENDING } }),
      this.orderRepository.count({ where: { status: OrderStatus.PROCESSING } }),
      this.getPeriodMetrics(today, tomorrow),
      this.userRepository.count({ where: { isActive: true } })
    ]);

    return {
      pendingOrders,
      processingOrders,
      todayRevenue: todayStats.revenue,
      todayOrders: todayStats.orders,
      activeUsersToday
    };
  }

  // Private helper methods
  private async getTotalUsers(): Promise<number> {
    return this.userRepository.count();
  }

  private async getActiveUsers(): Promise<number> {
    return this.userRepository.count({ where: { isActive: true } });
  }

  private async getOrderStatistics(): Promise<{
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    uniqueCustomers: number;
  }> {
    const result = await this.orderRepository
      .createQueryBuilder('order')
      .select([
        'COUNT(*) as totalOrders',
        'SUM(order.totalAmount) as totalRevenue',
        'AVG(order.totalAmount) as averageOrderValue',
        'COUNT(DISTINCT order.userId) as uniqueCustomers'
      ])
      .where('order.status IN (:...statuses)', { 
        statuses: [OrderStatus.DELIVERED, OrderStatus.SHIPPED, OrderStatus.PROCESSING] 
      })
      .getRawOne();

    return {
      totalOrders: parseInt(result.totalOrders || '0'),
      totalRevenue: Number(parseFloat(result.totalRevenue || '0').toFixed(2)),
      averageOrderValue: Number(parseFloat(result.averageOrderValue || '0').toFixed(2)),
      uniqueCustomers: parseInt(result.uniqueCustomers || '0')
    };
  }

  private async getTopCustomers(limit: number = 5): Promise<Array<{
    userId: string;
    userEmail: string;
    orderCount: number;
    totalSpent: number;
  }>> {
    const result = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoin('order.user', 'user')
      .select([
        'order.userId as userId',
        'user.email as userEmail',
        'COUNT(*) as orderCount',
        'SUM(order.totalAmount) as totalSpent'
      ])
      .where('order.status IN (:...statuses)', { 
        statuses: [OrderStatus.DELIVERED, OrderStatus.SHIPPED, OrderStatus.PROCESSING] 
      })
      .groupBy('order.userId, user.email')
      .orderBy('totalSpent', 'DESC')
      .limit(limit)
      .getRawMany();

    return result.map(row => ({
      userId: row.userId,
      userEmail: row.userEmail || 'Unknown',
      orderCount: parseInt(row.orderCount),
      totalSpent: Number(parseFloat(row.totalSpent).toFixed(2))
    }));
  }

  private async getRevenueByMonth(months: number = 12): Promise<Array<{
    month: string;
    revenue: number;
    orderCount: number;
  }>> {
    const result = await this.orderRepository
      .createQueryBuilder('order')
      .select([
        'DATE_FORMAT(order.createdAt, "%Y-%m") as month',
        'SUM(order.totalAmount) as revenue',
        'COUNT(*) as orderCount'
      ])
      .where('order.status IN (:...statuses)', { 
        statuses: [OrderStatus.DELIVERED, OrderStatus.SHIPPED] 
      })
      .andWhere('order.createdAt >= DATE_SUB(NOW(), INTERVAL :months MONTH)', { months })
      .groupBy('month')
      .orderBy('month', 'ASC')
      .getRawMany();

    return result.map(row => ({
      month: row.month,
      revenue: Number(parseFloat(row.revenue).toFixed(2)),
      orderCount: parseInt(row.orderCount)
    }));
  }

  private async getOrderStatusDistribution(): Promise<Record<OrderStatus, number>> {
    const result = await this.orderRepository
      .createQueryBuilder('order')
      .select([
        'order.status as status',
        'COUNT(*) as count'
      ])
      .groupBy('order.status')
      .getRawMany();

    const distribution: Record<OrderStatus, number> = {
      [OrderStatus.PENDING]: 0,
      [OrderStatus.PROCESSING]: 0,
      [OrderStatus.SHIPPED]: 0,
      [OrderStatus.DELIVERED]: 0,
      [OrderStatus.CANCELLED]: 0
    };

    result.forEach(row => {
      distribution[row.status as OrderStatus] = parseInt(row.count);
    });

    return distribution;
  }

private async getPeriodMetrics(startDate: Date, endDate: Date): Promise<{
  revenue: number;
  orders: number;
  newUsers: number;
}> {
  const [revenueResult, ordersCount, newUsersCount] = await Promise.all([
    this.orderRepository
      .createQueryBuilder('order')
      .select('SUM(order.totalAmount)', 'revenue')
      .where('order.createdAt >= :startDate AND order.createdAt < :endDate', { 
        startDate, 
        endDate 
      })
      .andWhere('order.status IN (:...statuses)', { 
        statuses: [OrderStatus.DELIVERED, OrderStatus.SHIPPED] 
      })
      .getRawOne(),
    
    this.orderRepository.count({
      where: {
        createdAt: Between(startDate, endDate)
      }
    }),
      
    this.userRepository.count({
      where: {
        createdAt: Between(startDate, endDate)
      }
    })
  ]);

  return {
    revenue: Number(parseFloat(revenueResult?.revenue || '0').toFixed(2)),
    orders: ordersCount,
    newUsers: newUsersCount
  };
}
}