import { Transform } from 'class-transformer';
import { IsBoolean, IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(2)
  firstName!: string;

  @IsString()
  @MinLength(2)
  lastName!: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  lastName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UserResponseDto {
  id!: string;
  email!: string;
  firstName!: string;
  lastName!: string;
  phone?: string;
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;

  @Transform(({ obj }) => `${obj.firstName} ${obj.lastName}`)
  fullName!: string;
}