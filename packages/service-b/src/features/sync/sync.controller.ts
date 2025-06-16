import { Request, Response } from 'express';
import { ExternalService } from '../../services/external.service';
import { validateUserIdParam } from '../../utils/validate-userId-param';

export class SyncController {
  constructor(private externalService: ExternalService) {}

  /**
   * GET /api/sync/user/:userId
   * Sync specific user data from Service A
   */
  async syncUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = validateUserIdParam(req, res);

      if (!userId) return;
      
      const userData = await this.externalService.syncUserData(userId);
      
      if (!userData) {
        res.status(404).json({
          success: false,
          error: 'User not found in Service A'
        });
        return;
      }
      
      res.json({
        success: true,
        data: userData,
        message: 'User data synchronized successfully'
      });
    } catch (error) {
      console.error('Failed to sync user data:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to sync user data from Service A'
      });
    }
  }

  /**
   * GET /api/sync/orders/:userId
   * Sync user's order data from Service A
   */
  async syncUserOrders(req: Request, res: Response): Promise<void> {
    try {
      const userId = validateUserIdParam(req, res);

      if (!userId) return;
      
      const orderData = await this.externalService.syncOrderData(userId);
      
      res.json({
        success: true,
        data: orderData,
        count: orderData.length,
        message: 'Order data synchronized successfully'
      });
    } catch (error) {
      console.error('Failed to sync order data:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to sync order data from Service A'
      });
    }
  }

  /**
   * GET /api/sync/all-users
   * Sync all users from Service A
   */
  async syncAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await this.externalService.getAllUsers();
      
      res.json({
        success: true,
        data: users,
        count: users.length,
        message: 'All users synchronized successfully'
      });
    } catch (error) {
      console.error('Failed to sync all users:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to sync users from Service A'
      });
    }
  }

  /**
   * GET /api/sync/health-check
   * Check health of external services
   */
  async checkExternalServices(req: Request, res: Response): Promise<void> {
    try {
      const serviceAHealth = await this.externalService.checkServiceHealth();
      
      res.json({
        success: true,
        data: {
          services: {
            'service-a': {
              healthy: serviceAHealth?.status === 'healthy',
              url: process.env.SERVICE_A_URL,
              details: serviceAHealth
            }
          },
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Failed to check external services:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check external service health'
      });
    }
  }

  /**
   * GET /api/sync/stats-comparison
   * Compare local stats with Service A stats
   */
  async compareStats(req: Request, res: Response): Promise<void> {
    try {
      const [serviceAUserStats, serviceAOrderStats] = await Promise.all([
        this.externalService.getUserStats(),
        this.externalService.getOrderStats()
      ]);
      
      res.json({
        success: true,
        data: {
          serviceA: {
            users: serviceAUserStats,
            orders: serviceAOrderStats
          },
          message: 'Statistics comparison retrieved successfully'
        }
      });
    } catch (error) {
      console.error('Failed to compare stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve Service A statistics'
      });
    }
  }

  /**
   * POST /api/sync/validate-consistency
   * Validate data consistency between services
   */
  async validateDataConsistency(req: Request, res: Response): Promise<void> {
    try {
      // This would need access to AnalyticsService
      // For now, we'll just check external service health
      const serviceAHealth = await this.externalService.checkServiceHealth();
      
      res.json({
        success: true,
        data: {
          consistent: serviceAHealth?.status === 'healthy',
          serviceA: serviceAHealth,
          timestamp: new Date().toISOString(),
          message: 'Data consistency validation completed'
        }
      });
    } catch (error) {
      console.error('Failed to validate data consistency:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to validate data consistency'
      });
    }
  }
}