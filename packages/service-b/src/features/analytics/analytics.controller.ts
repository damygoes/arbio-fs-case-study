import { Request, Response } from 'express';
import { AnalyticsService } from './analytics.service';

export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  /**
   * GET /api/analytics/dashboard
   * Get complete dashboard data with all metrics
   */
  async getDashboard(req: Request, res: Response): Promise<void> {
    try {
      const dashboardData = await this.analyticsService.getDashboardData();
      
      res.json({
        success: true,
        data: dashboardData
      });
    } catch (error) {
      console.error('Failed to get dashboard data:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch dashboard data'
      });
    }
  }

  /**
   * GET /api/analytics/metrics
   * Get business metrics only
   */
  async getMetrics(req: Request, res: Response): Promise<void> {
    try {
      const dashboardData = await this.analyticsService.getDashboardData();
      
      res.json({
        success: true,
        data: {
          businessMetrics: dashboardData.businessMetrics,
          realTimeMetrics: dashboardData.realTimeMetrics,
          lastUpdated: dashboardData.lastUpdated
        }
      });
    } catch (error) {
      console.error('Failed to get metrics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch metrics'
      });
    }
  }

  /**
   * GET /api/analytics/insights
   * Get business insights and recommendations
   */
  async getInsights(req: Request, res: Response): Promise<void> {
    try {
      const insights = await this.analyticsService.getBusinessInsights();
      
      res.json({
        success: true,
        data: insights
      });
    } catch (error) {
      console.error('Failed to get insights:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch business insights'
      });
    }
  }

  /**
   * GET /api/analytics/reports/:type
   * Generate and return specific report type
   */
  async generateReport(req: Request, res: Response): Promise<void> {
    try {
      const { type } = req.params;
      
      if (!type || !['daily', 'weekly', 'monthly'].includes(type)) {
        res.status(400).json({
          success: false,
          error: 'Invalid report type. Must be: daily, weekly, or monthly'
        });
        return;
      }

      const report = await this.analyticsService.generateReport(type as any);
      
      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      console.error('Failed to generate report:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate report'
      });
    }
  }

  /**
   * GET /api/analytics/comparison
   * Get period comparison data
   */
  async getPeriodComparison(req: Request, res: Response): Promise<void> {
    try {
      const days = parseInt(req.query.days as string) || 30;
      
      if (days < 1 || days > 365) {
        res.status(400).json({
          success: false,
          error: 'Days must be between 1 and 365'
        });
        return;
      }

      const dashboardData = await this.analyticsService.getDashboardData();
      
      res.json({
        success: true,
        data: {
          comparison: dashboardData.periodComparison,
          period: `${days} days`
        }
      });
    } catch (error) {
      console.error('Failed to get period comparison:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch period comparison'
      });
    }
  }

  /**
   * GET /api/analytics/cohorts
   * Get cohort analysis data
   */
  async getCohortAnalysis(req: Request, res: Response): Promise<void> {
    try {
      const dashboardData = await this.analyticsService.getDashboardData();
      
      res.json({
        success: true,
        data: {
          cohorts: dashboardData.cohortAnalysis,
          description: 'Monthly user cohorts showing retention and revenue patterns'
        }
      });
    } catch (error) {
      console.error('Failed to get cohort analysis:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch cohort analysis'
      });
    }
  }

  /**
   * GET /api/analytics/health
   * Get service health and data consistency status
   */
  async getServiceHealth(req: Request, res: Response): Promise<void> {
    try {
      const [dashboardData, consistency] = await Promise.all([
        this.analyticsService.getDashboardData(),
        this.analyticsService.validateDataConsistency()
      ]);
      
      res.json({
        success: true,
        data: {
          serviceHealth: dashboardData.serviceHealth,
          dataConsistency: consistency,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Failed to get service health:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch service health status'
      });
    }
  }
}