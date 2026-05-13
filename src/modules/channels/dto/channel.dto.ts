import { IsEnum, IsObject, IsOptional, IsString, Matches } from 'class-validator';

export class CreateChannelDto {
  @IsString()
  wabaId!: string;

  @IsString()
  phoneNumberId!: string;

  @Matches(/^\+[1-9]\d{6,14}$/, { message: 'displayPhoneNumber must be E.164 (e.g. +14155550123)' })
  displayPhoneNumber!: string;

  @IsOptional()
  @IsString()
  verifiedName?: string;

  @IsOptional()
  @IsObject()
  ycloudMetadata?: Record<string, unknown>;
}

export class UpdateChannelStatusDto {
  @IsEnum(['pending', 'active', 'disabled'])
  status!: 'pending' | 'active' | 'disabled';
}
