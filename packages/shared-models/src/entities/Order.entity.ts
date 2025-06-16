import { IsEnum, IsNumber, IsString, IsUUID, Min } from 'class-validator';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from './User.entity';

export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled'
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  @IsUUID()
  userId!: string;

  @Column('decimal', { precision: 10, scale: 2 })
  @IsNumber()
  @Min(0)
  totalAmount!: number;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING
  })
  @IsEnum(OrderStatus)
  status!: OrderStatus;

  @Column({ nullable: true })
  @IsString()
  notes?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => User, user => user.orders)
  @JoinColumn({ name: 'userId' })
  user!: User;
}