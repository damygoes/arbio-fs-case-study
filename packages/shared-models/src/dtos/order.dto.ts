import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { OrderStatus } from '../entities/Order.entity';

export class CreateOrderDto {
  @IsUUID()
  userId!: string;

  @IsNumber()
  @Min(0)
  totalAmount!: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateOrderDto {
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsNumber()
  @Min(0)
  totalAmount!: number;
}

export class OrderResponseDto {
  id!: string;
  userId!: string;
  totalAmount!: number;
  status!: OrderStatus;
  notes?: string;
  createdAt!: Date;
  updatedAt!: Date;
}