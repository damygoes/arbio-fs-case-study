import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Order } from './Order.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  @IsEmail()
  email!: string;

  @Column()
  @IsString()
  @MinLength(2)
  firstName!: string;

  @Column()
  @IsString()
  @MinLength(2)
  lastName!: string;

  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  phone?: string;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => Order, order => order.user)
  orders!: Order[];

  // Computed property
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}