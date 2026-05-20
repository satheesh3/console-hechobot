import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateTemplateDto {
  @IsString()
  channelId!: string;

  @IsString()
  name!: string;

  @IsString()
  language!: string;

  @IsEnum(['MARKETING', 'UTILITY', 'AUTHENTICATION'])
  category!: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';

  @IsArray()
  components!: unknown[];

  @IsOptional()
  description?: string;
}
