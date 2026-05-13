import { IsEmail, IsEnum, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateClientDto {
  @IsString()
  name!: string;

  @IsEmail()
  contactEmail!: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class UpdateClientDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsEnum(['active', 'suspended'])
  status?: 'active' | 'suspended';

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
