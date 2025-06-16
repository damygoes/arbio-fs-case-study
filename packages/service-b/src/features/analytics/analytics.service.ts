import { ExternalService } from '../../services/external.service';
import { AnalyticsMetrics, AnalyticsRepository, PeriodComparison } from './analytics.repository';



export interface DashboardData {
  businessMetrics: AnalyticsMetrics;
  periodComparison: PeriodComparison;
  realTimeMetrics: any;
  cohortAnalysis: any[];
  serviceHealth: {
    serviceA: boolean;
    database: boolean;
    schemaCompatible: boolean;
  };
  lastUpdated: string;
}

export interface ReportData {
  type: 'daily' | 'weekly' | 'monthly';
  period: string;
  metrics: AnalyticsMetrics;
  insights: string[];
  recommendations: string[];
}

export class AnalyticsService {
  constructor(
    private analyticsRepository: AnalyticsRepository,
    private externalService: ExternalService
  ) {}

  /**
   * Get complete dashboard data
   */
async getDashboardData(): Promise<DashboardData> {
  try {
    // Make Service A health check optional
    let serviceAHealth = null;
    try {
      serviceAHealth = await this.externalService.checkServiceHealth();
    } catch (error) {
      console.warn('⚠️ Service A health check failed (optional):', error instanceof Error ? error.message : 'Unknown error');
    }

    const [
      businessMetrics,
      periodComparison,
      realTimeMetrics,
      cohortAnalysis
    ] = await Promise.all([
      this.analyticsRepository.getBusinessMetrics(),
      this.analyticsRepository.getPeriodComparison(30),
      this.analyticsRepository.getRealTimeMetrics(),
      this.analyticsRepository.getCohortAnalysis()
    ]);

    return {
      businessMetrics,
      periodComparison,
      realTimeMetrics,
      cohortAnalysis,
      serviceHealth: {
        serviceA: serviceAHealth?.status === 'healthy',
        database: true,
        schemaCompatible: true
      },
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Failed to get dashboard data:', error);
    throw new Error('Failed to retrieve dashboard data');
  }
}

  /**
   * Generate business insights based on metrics
   */
  async getBusinessInsights(): Promise<{
    insights: string[];
    recommendations: string[];
    alerts: string[];
  }> {
    const metrics = await this.analyticsRepository.getBusinessMetrics();
    const comparison = await this.analyticsRepository.getPeriodComparison();

    const insights: string[] = [];
    const recommendations: string[] = [];
    const alerts: string[] = [];

    // Analyze conversion rate
    if (metrics.conversionRate < 10) {
      insights.push(`Conversion rate is ${metrics.conversionRate}%, which is below industry average`);
      recommendations.push('Consider implementing email marketing campaigns to convert users');
    } else {
      insights.push(`Good conversion rate of ${metrics.conversionRate}%`);
    }

    // Analyze revenue growth
    if (comparison.growth.revenueGrowth < 0) {
      alerts.push(`Revenue declined by ${Math.abs(comparison.growth.revenueGrowth)}% compared to previous period`);
      recommendations.push('Review product pricing and customer satisfaction metrics');
    } else if (comparison.growth.revenueGrowth > 20) {
      insights.push(`Excellent revenue growth of ${comparison.growth.revenueGrowth}%`);
    }

    // Analyze average order value
    if (metrics.averageOrderValue < 50) {
      recommendations.push('Consider implementing upselling strategies to increase average order value');
    }

    // Analyze pending orders
    const realTime = await this.analyticsRepository.getRealTimeMetrics();
    if (realTime.pendingOrders > 10) {
      alerts.push(`${realTime.pendingOrders} orders are pending processing`);
      recommendations.push('Review order processing workflow for bottlenecks');
    }

    return { insights, recommendations, alerts };
  }

  /**
   * Generate automated report
   */
  async generateReport(type: 'daily' | 'weekly' | 'monthly'): Promise<ReportData> {
    const periodDays = type === 'daily' ? 1 : type === 'weekly' ? 7 : 30;
    const [metrics, insights] = await Promise.all([
      this.analyticsRepository.getBusinessMetrics(),
      this.getBusinessInsights()
    ]);

    return {
      type,
      period: this.getPeriodString(type),
      metrics,
      insights: insights.insights,
      recommendations: insights.recommendations
    };
  }

  /**
   * Compare local data with Service A data
   */
  async validateDataConsistency(): Promise<any> {
    try {
      const [localMetrics, externalValidation] = await Promise.all([
        this.analyticsRepository.getBusinessMetrics(),
        this.externalService.validateDataConsistency()
      ]);

      externalValidation.localStats = {
        totalUsers: localMetrics.totalUsers,
        totalOrders: localMetrics.totalOrders,
        totalRevenue: localMetrics.totalRevenue
      };

      // Compare metrics
      const serviceAStats = externalValidation.serviceAStats;
      const differences: any = {};

      if (serviceAStats.users) {
        differences.userCount = localMetrics.totalUsers - serviceAStats.users.totalUsers;
      }

      if (serviceAStats.orders) {
        differences.orderCount = localMetrics.totalOrders - serviceAStats.orders.totalOrders;
        differences.revenue = localMetrics.totalRevenue - serviceAStats.orders.totalRevenue;
      }

      externalValidation.differences = differences;
      externalValidation.consistent = Math.abs(differences.userCount || 0) === 0 && 
      Math.abs(differences.orderCount || 0) === 0;

      return externalValidation;
    } catch (error) {
      console.error('Data consistency validation failed:', error);
      throw new Error('Failed to validate data consistency');
    }
  }

  private getPeriodString(type: 'daily' | 'weekly' | 'monthly'): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const date = now.getDate();

    switch (type) {
      case 'daily':
        return `${year}-${month.toString().padStart(2, '0')}-${date.toString().padStart(2, '0')}`;
      case 'weekly':
        const weekStart = new Date(now.setDate(date - now.getDay()));
        return `Week of ${weekStart.toISOString().split('T')[0]}`;
      case 'monthly':
        return `${year}-${month.toString().padStart(2, '0')}`;
      default:
        return now.toISOString().split('T')[0] ?? now.toISOString();
    }
  }
}