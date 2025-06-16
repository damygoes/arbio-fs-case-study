import axios, { AxiosInstance } from 'axios';

export interface ServiceAUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  isActive: boolean;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceAOrder {
  id: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  userEmail: string;
  notes?: string;
  userId: string;
}

export interface ServiceHealth {
  status: string;
  service: string;
  version?: string;
  timestamp: string;
  uptime?: number;
}

export class ExternalService {
  private client: AxiosInstance;
  private serviceAUrl: string;

  constructor() {
    this.serviceAUrl = process.env.SERVICE_A_URL || 'http://localhost:3001';
    this.client = axios.create({
      baseURL: this.serviceAUrl,
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Service-B/1.0.0'
      }
    });
  }

  /**
   * Check if Service A is healthy and reachable
   */
  async checkServiceHealth(): Promise<ServiceHealth | null> {
    try {
      const response = await this.client.get('/health');
      return response.data;
    } catch (error) {
      console.error('Service A health check failed:', error);
      return null;
    }
  }

  /**
   * Sync user data from Service A
   */
  async syncUserData(userId: string): Promise<ServiceAUser | null> {
    try {
      const response = await this.client.get(`/api/users/${userId}`);
      return response.data.success ? response.data.data : null;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null; // User not found
      }
      console.error('Failed to sync user data:', error);
      throw new Error('External service unavailable');
    }
  }

  /**
   * Sync order data from Service A
   */
  async syncOrderData(userId: string): Promise<ServiceAOrder[]> {
    try {
      const response = await this.client.get(`/api/orders/user/${userId}`);
      return response.data.success ? response.data.data : [];
    } catch (error) {
      console.error('Failed to sync order data:', error);
      throw new Error('External service unavailable');
    }
  }

  /**
   * Get all users from Service A
   */
  async getAllUsers(): Promise<ServiceAUser[]> {
    try {
      const response = await this.client.get('/api/users');
      return response.data.success ? response.data.data : [];
    } catch (error) {
      console.error('Failed to get all users:', error);
      throw new Error('External service unavailable');
    }
  }

  /**
   * Get user statistics from Service A
   */
  async getUserStats(): Promise<any> {
    try {
      const response = await this.client.get('/api/users/stats');
      return response.data.success ? response.data.data : null;
    } catch (error) {
      console.error('Failed to get user stats:', error);
      throw new Error('External service unavailable');
    }
  }

  /**
   * Get order statistics from Service A
   */
  async getOrderStats(): Promise<any> {
    try {
      const response = await this.client.get('/api/orders/stats');
      return response.data.success ? response.data.data : null;
    } catch (error) {
      console.error('Failed to get order stats:', error);
      throw new Error('External service unavailable');
    }
  }

  /**
   * Compare local analytics with Service A data
   */
  async validateDataConsistency(): Promise<{
    consistent: boolean;
    differences: any;
    serviceAStats: any;
    localStats: any;
  }> {
    try {
      const [serviceAUserStats, serviceAOrderStats] = await Promise.all([
        this.getUserStats(),
        this.getOrderStats()
      ]);

      return {
        consistent: true, // We'll implement comparison logic
        differences: {},
        serviceAStats: {
          users: serviceAUserStats,
          orders: serviceAOrderStats
        },
        localStats: {} // Will be filled by calling service
      };
    } catch (error) {
      console.error('Failed to validate data consistency:', error);
      throw new Error('Consistency check failed');
    }
  }
}