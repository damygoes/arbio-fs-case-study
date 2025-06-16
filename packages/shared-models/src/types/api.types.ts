import { OrderStatus } from '../entities/Order.entity';

// Pure TypeScript interfaces for business logic
export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderSummary {
  id: string;
  totalAmount: number;
  status: OrderStatus;
  createdAt: Date;
  userEmail: string;
}

// Service contracts
export interface IUserService {
  findById(id: string): Promise<UserProfile | null>;
  findByEmail(email: string): Promise<UserProfile | null>;
  create(userData: CreateUserData): Promise<UserProfile>;
}

export interface IOrderService {
  findByUserId(userId: string): Promise<OrderSummary[]>;
  create(orderData: CreateOrderData): Promise<OrderSummary>;
  updateStatus(orderId: string, status: OrderStatus): Promise<void>;
}

// Data contracts
export interface CreateUserData {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface CreateOrderData {
  userId: string;
  totalAmount: number;
  notes?: string;
}